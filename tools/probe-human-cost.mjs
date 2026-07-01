#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D190 human-cost-with-gravity focused gate.
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

const sourceText = readFileSync(join(ROOT, 'src', '72-human-cost.js'), 'utf8');
const bridgeText = readFileSync(join(ROOT, 'src', '85-battle-bridge.js'), 'utf8');
const dataText = readFileSync(join(ROOT, 'data', 'human-cost.json'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v:v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?900:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:4,won:2,infl:9800,suff:12200},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock){ C.clock.year=year||1864; C.clock.weariness=46; C.clock.capital=15; C.clock.intervention=18; }
    if(C.president && C.president.date) C.president.date.year=year||1864;
    if(C.morale){ C.morale.casualtyToll=11800; C.morale.public=43; }
    if(C.medical){ C.medical.sick=6400; C.medical.wounded=3600; C.medical.treated=950; C.medical.diseaseDeaths=410; }
    if(C.prisoners){ C.prisoners.detained[side]=2200; C.prisoners.deaths[side]=180; }
    if(C.hardWar){ C.hardWar.displaced[side]=3600; C.hardWar.propertyDestroyed[side]=8200; }
    if(C.irregularWar){ C.irregularWar.civilianHarm=2400; }
    return C; }
  function fakeB(side, year){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=2600; c[e]=1900;
    return { playerSide:side, enemySide:e, bd:{id:'wilderness',name:'The Wilderness',year:year||1864}, casualties:c, infl:{}, units:[], type:'loss' }; }
  function stripHuman(C){ var copy=JSON.parse(JSON.stringify(C)); delete copy.humanCost; return JSON.stringify(copy); }
  try {
    G.mode='menu';
    step('data loads sourced human-cost anchors without battle-build leakage', function(){
      var D=GAME_DATA&&GAME_DATA['human-cost'];
      if(!D||D.schema!=='cw_human_cost_v1') throw new Error('missing human-cost schema');
      var scale=D.historicalScale||{};
      if(scale.revisedDeaths!==750000||scale.rangeLow!==650000||scale.rangeHigh!==850000) throw new Error('historical range mismatch '+JSON.stringify(scale));
      var ids=(D.anchors||[]).map(function(a){return a.id;}).sort();
      ['disease-before-romance','estimated-not-counted','home-front-names','work-of-death'].forEach(function(id){ if(ids.indexOf(id)<0) throw new Error('missing anchor '+id); });
      var all=[scale,D.profile||{}].concat(D.anchors||[],D.debates||[]);
      all.forEach(function(x){ if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+(x.id||x.title||x.label||x.name)); });
      var text=JSON.stringify(D);
      ['chattanooga','atlanta','franklin','nashville','new-market-heights','olustee','crater'].forEach(function(id){ if(new RegExp('"'+id+'"','i').test(text)) throw new Error('locked battle id leaked '+id); });
      return { anchors:ids, deaths:scale.revisedDeaths };
    });
    step('bridge function is exact zero and does not move army facets', function(){
      var C=mkC('US',1864), before=bridgeArmy(C), b=humanCostBridgeBonus(C), after=bridgeArmy(C);
      if(b.active!==false||b.morale!==0||b.supply!==0||b.fatigue!==0||b.overall!==0||b.readoutOnly!==true) throw new Error('nonzero bridge '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(before[k]!==after[k]) throw new Error(k+' changed '+before[k]+'->'+after[k]); });
      return { bridge:b, army:after };
    });
    step('snapshot aggregates existing ledgers without external mutation', function(){
      var C=mkC('US',1864), before=stripHuman(C), snap=humanCostSnapshot(C), after=stripHuman(C);
      if(before!==after) throw new Error('snapshot mutated external campaign state');
      if(!(snap.campaignLosses>=12200 && snap.diseaseDeaths===410 && snap.prisonerDeaths===180 && snap.displaced===3600)) throw new Error('snapshot missed ledgers '+JSON.stringify(snap));
      if(!(snap.index>0 && snap.historicalDeaths===750000 && snap.historicalSharePct>0)) throw new Error('snapshot scale missing '+JSON.stringify(snap));
      return snap;
    });
    step('resolve records lastTurn/log but does not alter cost-bearing systems', function(){
      var C=mkC('US',1864);
      var before={stats:JSON.stringify(C.stats), morale:JSON.stringify(C.morale), medical:JSON.stringify(C.medical), prisoners:JSON.stringify(C.prisoners), hardWar:JSON.stringify(C.hardWar)};
      humanCostOnResolve('CS','loss',fakeB('US',1864),C,false);
      if(!C.humanCost.lastTurn||C.humanCost.lastTurn.readoutOnly!==true) throw new Error('lastTurn missing');
      if(!Array.isArray(C.humanCost.log)||!C.humanCost.log.length) throw new Error('log missing');
      ['stats','morale','medical','prisoners','hardWar'].forEach(function(k){ if(before[k]!==JSON.stringify(C[k])) throw new Error(k+' mutated'); });
      return C.humanCost.lastTurn;
    });
    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1864);
      C.humanCost={schema:3, log:'oops', lastTurn:'bad', lastBridge:[]};
      humanCostInit(C);
      if(C.humanCost.schema!=='cw_human_cost_v1') throw new Error('schema not set');
      if(!Array.isArray(C.humanCost.log)||C.humanCost.lastTurn!==null||C.humanCost.lastBridge!==null) throw new Error('sanitize failed '+JSON.stringify(C.humanCost));
      return C.humanCost;
    });
    step('War Effort UI renders gravity treatment and no priority control', function(){
      var C=mkC('US',1864);
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      ['Human Cost Ledger','Hacker','750,000','650,000-850,000','Drew Gilpin Faust','No priority lever','bridge input is zero'].forEach(function(s){ if(h.indexOf(s)<0) throw new Error('missing UI text '+s); });
      if(document.querySelector('[data-hcpriority],#hcToggle,#humanCostToggle')) throw new Error('human-cost priority control should not exist');
      return { len:h.length };
    });
    step('no tactical, output, or bridge-contamination path exists', function(){
      var src=${JSON.stringify(sourceText)}, bridge=${JSON.stringify(bridgeText)}, data=${JSON.stringify(dataText)};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\.winner\\s*=|\\.men\\s*=|\\.casualties\\s*=/.test(src)) throw new Error('human-cost source touched tactical/output fields');
      if(/humanCostBridgeBonus/.test(bridge)) throw new Error('bridgeArmy should not consume humanCostBridgeBonus');
      if(/new-market-heights|olustee|chattanooga|atlanta|franklin|nashville/i.test(data)) throw new Error('battle queue leak in data');
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
    await page.evaluate(() => {
      G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:4,won:2,infl:9800,suff:12200},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); if(C.clock){C.clock.year=1864;C.clock.weariness=46;} if(C.president&&C.president.date) C.president.date.year=1864;
      C.morale.casualtyToll=11800; C.medical.sick=6400; C.medical.wounded=3600; C.medical.diseaseDeaths=410; C.prisoners.deaths.US=180; C.hardWar.displaced.US=3600; C.hardWar.propertyDestroyed.US=8200;
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var block=Array.from(document.querySelectorAll('.h0-desk-systems > div, #wdContent > div')).filter(function(el){return (el.textContent||'').indexOf('Human Cost Ledger')>=0;})[0];
      if(block && block.scrollIntoView) block.scrollIntoView({block:'center'});
    });
    await sleep(350);
    await page.screenshot({ path: join(OUT, 'human-cost-war-effort.png'), fullPage:false, timeout:120000 });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-human-cost.json'), JSON.stringify(result, null, 2));
    await closePage(page);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  console.log('probe-human-cost ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
  process.exit(0);
})();
