#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D189 real diplomacy focused gate.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY || '1';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }
const T = { serverTries:180, serverDelay:250, nav:150000, settle:1400, eval:300000, pageClose:10000, browserClose:15000 };
async function withTimeout(label, promise, ms) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms); })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function closePage(page) { try { await withTimeout('page.close', page.close({ runBeforeUnload: false }), T.pageClose); } catch {} }
async function closeBrowser(browser) { try { await withTimeout('browser.close', browser.close(), T.browserClose); } catch {} }

const sourceText = readFileSync(join(ROOT, 'src', '71-real-diplomacy.js'), 'utf8');
const dataText = readFileSync(join(ROOT, 'data', 'diplomacy.json'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v:v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?900:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock){ C.clock.year=year||1863; C.clock.weariness=38; C.clock.capital=14; C.clock.intervention=18; }
    if(C.president && C.president.date) C.president.date.year=year||1863;
    if(C.blockade){ C.blockade.recognition=18; C.blockade.importFactor=.48; C.blockade.recognitionForeclosed=false; }
    return C; }
  function fakeB(side, year){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=1500; c[e]=1600;
    return { playerSide:side, enemySide:e, bd:{id:'antietam',name:'Antietam',year:year||1863}, casualties:c, infl:{}, units:[], type:'draw' }; }
  try {
    G.mode='menu';
    step('data loads D40 real diplomacy crises and sourced priorities', function(){
      var D=GAME_DATA&&GAME_DATA.diplomacy&&GAME_DATA.diplomacy.realDiplomacy;
      if(!D||D.schema!=='cw_real_diplomacy_v1') throw new Error('missing real diplomacy schema');
      var crisisIds=(D.crises||[]).map(function(x){return x.id;}).sort();
      ['autumn-1862-mediation','king-wheat','laird-rams','russian-fleet','trent-affair'].forEach(function(id){ if(crisisIds.indexOf(id)<0) throw new Error('missing crisis '+id); });
      var priorityIds=(D.priorities||[]).map(function(x){return x.id;}).sort();
      ['king-wheat-neutrality','laird-rams-procurement','recognition-mission','seward-neutrality-line','trent-hardline','watch-laird-rams'].forEach(function(id){ if(priorityIds.indexOf(id)<0) throw new Error('missing priority '+id); });
      var all=[D.profile||{}].concat(D.crises||[], D.priorities||[], D.debates||[]);
      all.forEach(function(x){ if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+(x.id||x.title||x.name)); });
      var text=JSON.stringify(D);
      ['chattanooga','atlanta','franklin','nashville','new-market-heights','olustee','crater'].forEach(function(id){ if(new RegExp('"'+id+'"','i').test(text)) throw new Error('locked battle id leaked '+id); });
      return { crises:crisisIds, priorities:priorityIds };
    });
    step('default bridge input is exact zero on both sides', function(){
      var C=mkC('CS',1863), before=bridgeArmy(C), b=realDiplomacyBridgeBonus(C), after=bridgeArmy(C);
      if(b.morale!==0||b.supply!==0||b.fatigue!==0||b.overall!==0) throw new Error('inactive CS nonzero '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(before[k]!==after[k]) throw new Error('CS '+k+' changed '+before[k]+'->'+after[k]); });
      var U=mkC('US',1863), ub=realDiplomacyBridgeBonus(U);
      if(ub.morale!==0||ub.supply!==0||ub.fatigue!==0||ub.overall!==0) throw new Error('inactive US nonzero '+JSON.stringify(ub));
      return { cs:b, us:ub };
    });
    step('active priorities are side-filtered, capped, and no direct overall', function(){
      var C=mkC('CS',1863);
      realDiplomacySetPriority(C,'watch-laird-rams');
      if(C.realDiplomacy.active) throw new Error('US priority activated for CS');
      realDiplomacySetPriority(C,'laird-rams-procurement');
      var bonus=realDiplomacyBridgeBonus(C), caps=GAME_DATA.diplomacy.realDiplomacy.config.bridgeCaps;
      if(!bonus.active||bonus.priority!=='laird-rams-procurement') throw new Error('CS priority not active '+JSON.stringify(bonus));
      if(Math.abs(bonus.morale)>caps.morale||Math.abs(bonus.supply)>caps.supply||bonus.fatigue>caps.fatigueCost) throw new Error('caps failed '+JSON.stringify(bonus));
      if(bonus.overall!==0) throw new Error('direct overall bonus');
      var U=mkC('US',1863);
      realDiplomacySetPriority(U,'watch-laird-rams');
      var ub=realDiplomacyBridgeBonus(U);
      if(!ub.active||ub.priority!=='watch-laird-rams'||ub.overall!==0) throw new Error('US priority failed '+JSON.stringify(ub));
      return { cs:bonus, us:ub };
    });
    step('resolve moves strategic recognition and intervention ledgers only', function(){
      var C=mkC('CS',1863); C.clock.intervention=15; C.clock.capital=14; C.blockade.recognition=16;
      realDiplomacySetPriority(C,'recognition-mission');
      realDiplomacyOnResolve('CS','draw',fakeB('CS',1863),C,false);
      if(!(C.blockade.recognition>16 && C.clock.intervention>15)) throw new Error('CS diplomacy did not raise recognition/intervention');
      if(!(C.clock.capital<14 && C.realDiplomacy.recognitionInfluence>0 && C.realDiplomacy.lastTurn.priority==='recognition-mission')) throw new Error('CS ledgers not written');
      var U=mkC('US',1863); U.clock.intervention=22; U.blockade.recognition=21; U.clock.capital=14;
      realDiplomacySetPriority(U,'watch-laird-rams');
      realDiplomacyOnResolve('US','draw',fakeB('US',1863),U,false);
      if(!(U.clock.intervention<22 && U.blockade.recognition<21 && U.realDiplomacy.neutralGoodwill>58)) throw new Error('US diplomacy did not contain risk');
      if(U.realDiplomacy.lastTurn.capitalCost!==3) throw new Error('capital cost not tracked');
      return { cs:C.realDiplomacy.lastTurn, us:U.realDiplomacy.lastTurn };
    });
    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1863);
      C.realDiplomacy={active:'yes', priority:'bad', recognitionInfluence:'-12', crisisRisk:999, neutralGoodwill:'41', commercePressure:-5, used:'bad', log:'oops', lastTurn:'bad', lastBridge:[]};
      realDiplomacyInit(C);
      if(C.realDiplomacy.active!==false||C.realDiplomacy.priority!==null) throw new Error('active/priority not sanitized');
      if(C.realDiplomacy.recognitionInfluence!==-12||C.realDiplomacy.crisisRisk!==100||C.realDiplomacy.neutralGoodwill!==41||C.realDiplomacy.commercePressure!==0) throw new Error('ledger sanitize failed');
      if(C.realDiplomacy.used['trent-hardline']!==false) throw new Error('used bag absent');
      if(!Array.isArray(C.realDiplomacy.log)||C.realDiplomacy.lastTurn!==null||C.realDiplomacy.lastBridge!==null) throw new Error('last/log not sanitized');
      return C.realDiplomacy;
    });
    step('War Effort UI renders crises and priority toggles', function(){
      var C=mkC('CS',1863);
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      ['Real Diplomacy System','Trent Affair','Laird Rams','Russian Fleet','King Wheat','Recognition mission','Laird rams procurement'].forEach(function(s){ if(h.indexOf(s)<0) throw new Error('missing War Effort text '+s); });
      var b=document.querySelector('[data-rdpriority="laird-rams-procurement"]'); if(!b) throw new Error('priority button absent');
      b.click(); if(!C.realDiplomacy.active||C.realDiplomacy.priority!=='laird-rams-procurement') throw new Error('War Effort toggle failed');
      return { active:C.realDiplomacy.active, priority:C.realDiplomacy.priority, len:h.length };
    });
    step('Diplomacy tab includes real diplomacy block and wires', function(){
      var U=mkC('US',1863);
      openWarDept(); window._wdTab='diplomacy'; _wdRefresh();
      // D237: assert on textContent, not innerHTML — the C18 glossary decoration (D233) legitimately
      // wraps teaching terms (e.g. "Blockade") in tip spans, which broke the old contiguous-innerHTML
      // match. textContent keeps the SAME required strings while tolerating the shipped decoration.
      var h=document.getElementById('wdContent').textContent;
      ['Diplomacy & the Blockade','Real Diplomacy System','Seward neutrality line','Watch the Laird rams'].forEach(function(s){ if(h.indexOf(s)<0) throw new Error('missing diplomacy tab text '+s); });
      var b=document.querySelector('[data-rdpriority="watch-laird-rams"]'); if(!b) throw new Error('US diplomacy priority absent');
      b.click(); if(!U.realDiplomacy.active||U.realDiplomacy.priority!=='watch-laird-rams') throw new Error('Diplomacy tab toggle failed');
      return { priority:U.realDiplomacy.priority, len:h.length };
    });
    step('no tactical or output contamination from source/data', function(){
      var src=${JSON.stringify(sourceText)}, data=${JSON.stringify(dataText)};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=|\\.winner\\s*=|\\.men\\s*=/.test(src)) throw new Error('tactical/output touch');
      if(/new-market-heights|olustee|chattanooga|atlanta|franklin|nashville/i.test(data)) throw new Error('battle queue leak in data');
      if(src.indexOf('overall = 0')<0 && src.indexOf('out.overall = 0')<0) throw new Error('overall zero contract not visible');
      return { clean:true };
    });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<T.serverTries;i++){ if(await up(probe))break; await sleep(T.serverDelay); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  page.setDefaultTimeout(T.nav);
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:T.nav });
    await sleep(T.settle);
    result = JSON.parse(await withTimeout('assertion evaluate', page.evaluate(SETUP), T.eval));
    result.pageerrors = pageerrors;
    if (pageerrors.length) result.ok = false;
    await page.evaluate(() => { G.campaign={side:'CS',iron:false,idx:0,funds:900,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]}; var C=G.campaign; _t1InitAll(C); if(C.clock){C.clock.year=1863;C.clock.intervention=20;} if(C.president&&C.president.date) C.president.date.year=1863; openWarDept(); window._wdTab='economy'; _wdRefresh(); });
    await sleep(350);
    await page.screenshot({ path: join(OUT, 'real-diplomacy-war-effort.png'), fullPage:false });
    await page.evaluate(() => { G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]}; var C=G.campaign; _t1InitAll(C); if(C.clock){C.clock.year=1863;C.clock.intervention=18;} if(C.president&&C.president.date) C.president.date.year=1863; openWarDept(); window._wdTab='diplomacy'; _wdRefresh(); });
    await sleep(350);
    await page.screenshot({ path: join(OUT, 'real-diplomacy-tab.png'), fullPage:false });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-real-diplomacy.json'), JSON.stringify(result, null, 2));
    await closePage(page);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  console.log('probe-real-diplomacy ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
  process.exit(0);
})();
