#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D179 flagship named units focused gate.
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
const T = { serverTries:180, serverDelay:250, nav:150000, settle:1400, eval:300000, screenshotSetup:90000, screenshot:300000, screenshotBound:320000, pageClose:10000, browserClose:15000 };
async function withTimeout(label, promise, ms) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms); })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function closePage(page) { try { await withTimeout('page.close', page.close({ runBeforeUnload: false }), T.pageClose); } catch (e) {} }
async function closeBrowser(browser) { try { await withTimeout('browser.close', browser.close(), T.browserClose); } catch (e) {} }

const sourceText = readFileSync(join(ROOT, 'src', '67-flagship-units.js'), 'utf8');
const dataText = readFileSync(join(ROOT, 'data', 'flagship-units.json'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year, battleId){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?2200:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock){ C.clock.year=year||1864; C.clock.weariness=42; C.clock.capital=12; }
    if(C.president && C.president.date) C.president.date.year=year||1864;
    if(battleId && typeof CHAINS!=='undefined' && CHAINS[side]) { var ix=CHAINS[side].indexOf(battleId); if(ix>=0) C.idx=ix; }
    return C; }
  function fakeB(side, id, year){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=2600; c[e]=1500;
    return { playerSide:side, enemySide:e, bd:{id:id||'gettysburg',name:'Gettysburg',year:year||1863}, casualties:c, infl:{}, units:[], type:'loss' }; }
  try {
    G.mode='menu';
    step('data loads flagship units with source and queue locks', function(){
      var D=GAME_DATA&&GAME_DATA['flagship-units'];
      if(!D||D.schema!=='cw_flagship_units_v1') throw new Error('missing schema');
      if(!Array.isArray(D.units)||D.units.length<6) throw new Error('need six unit records');
      ['54th-massachusetts-infantry','iron-brigade','irish-brigade','stonewall-brigade','twentieth-maine-vincent','battery-a-fourth-us-cushing'].forEach(function(id){
        if(!D.units.some(function(u){return u.id===id;})) throw new Error('missing '+id);
      });
      D.units.concat(D.debates||[]).forEach(function(x){
        if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+(x.id||x.title));
        if(Object.prototype.hasOwnProperty.call(x,'replacePid')) throw new Error('replacePid leak '+(x.id||x.title));
      });
      var f=D.units.filter(function(u){return u.id==='54th-massachusetts-infantry';})[0];
      if(f.status!=='visible-now-playable-later'||(f.battleIds&&f.battleIds.length)) throw new Error('54th boundary broken');
      var text=JSON.stringify(D);
      ['chattanooga','atlanta','franklin','nashville','new-market-heights','olustee','crater'].forEach(function(id){ if(new RegExp('"'+id+'"','i').test(text)) throw new Error('locked battle id leaked '+id); });
      return { units:D.units.length, debates:(D.debates||[]).length };
    });
    step('default bridge input is exact zero', function(){
      var C=mkC('US',1864,'gettysburg'); C.flagshipUnits.casualtyMemory['iron-brigade']=200; C.flagshipUnits.readiness['twentieth-maine-vincent']=50;
      var a0=bridgeArmy(C), b=flagshipUnitsBridgeBonus(C), a1=bridgeArmy(C);
      if(b.morale!==0||b.supply!==0||b.fatigue!==0||b.overall!==0) throw new Error('inactive nonzero '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(a0[k]!==a1[k]) throw new Error(k+' changed '+a0[k]+'->'+a1[k]); });
      return { bridge:b, army:{overall:a1.overall,morale:a1.morale,supply:a1.supply,fatigue:a1.fatigue} };
    });
    step('active stewardship is capped and costly', function(){
      var C=mkC('US',1864,'gettysburg'), before=bridgeArmy(C);
      flagshipUnitsSetPriority(C,'unitStewardship');
      var bonus=flagshipUnitsBridgeBonus(C), after=bridgeArmy(C), caps=GAME_DATA['flagship-units'].config.bridgeCaps;
      if(!bonus.active) throw new Error('not active');
      if(bonus.morale<0||bonus.morale>caps.morale) throw new Error('morale cap');
      if(bonus.supply>0||Math.abs(bonus.supply)>caps.supplyCost) throw new Error('supply cap');
      if(bonus.fatigue<0||bonus.fatigue>caps.fatigueCost) throw new Error('fatigue cap');
      if(bonus.overall!==0) throw new Error('direct overall bonus');
      if(after.supply>before.supply||after.fatigue<before.fatigue) throw new Error('costs inverted');
      return { before:before, after:after, bonus:bonus };
    });
    step('snapshot sees current battle relevance', function(){
      var early=mkC('US',1861,'bullrun1'), getty=mkC('US',1864,'gettysburg');
      getty.flagshipUnits.casualtyMemory['iron-brigade']=180; getty.flagshipUnits.readiness['twentieth-maine-vincent']=50;
      var e=flagshipUnitsSnapshot(early), g=flagshipUnitsSnapshot(getty);
      if(!(g.battleFame>e.battleFame)) throw new Error('battle relevance did not rise');
      if(g.featured.id!=='iron-brigade'&&g.featured.id!=='twentieth-maine-vincent'&&g.featured.id!=='battery-a-fourth-us-cushing') throw new Error('bad featured '+g.featured.id);
      return { early:e, getty:g };
    });
    step('resolve records memory and active stewardship mitigates without erasing cost', function(){
      var I=mkC('US',1864,'gettysburg'), A=mkC('US',1864,'gettysburg'); I.clock.capital=A.clock.capital=12;
      flagshipUnitsSetPriority(A,'unitStewardship');
      flagshipUnitsOnResolve('CS','loss',fakeB('US','gettysburg',1863),I,false);
      flagshipUnitsOnResolve('CS','loss',fakeB('US','gettysburg',1863),A,false);
      if(!(A.flagshipUnits.lastTurn.casualtyMemoryAdded<I.flagshipUnits.lastTurn.casualtyMemoryAdded)) throw new Error('mitigation absent');
      if(!(A.flagshipUnits.lastTurn.readinessAdded>I.flagshipUnits.lastTurn.readinessAdded)) throw new Error('readiness not raised');
      if(!(A.clock.capital<I.clock.capital)) throw new Error('no capital cost');
      if(!(A.flagshipUnits.casualtyMemory['iron-brigade']>0||A.flagshipUnits.casualtyMemory['twentieth-maine-vincent']>0)) throw new Error('no unit memory');
      return { inactive:I.flagshipUnits.lastTurn, active:A.flagshipUnits.lastTurn };
    });
    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1864,'bullrun1');
      C.flagshipUnits={active:'yes', priority:'bad', readiness:{'stonewall-brigade':'9','iron-brigade':-5}, casualtyMemory:'bad', colorsPreserved:{'stonewall-brigade':2}, supported:{'stonewall-brigade':'7'}, log:'oops', lastTurn:'bad', lastBridge:[]};
      flagshipUnitsInit(C);
      if(C.flagshipUnits.active!==false||C.flagshipUnits.priority!==null) throw new Error('active/priority not sanitized');
      if(C.flagshipUnits.readiness['stonewall-brigade']!==9||C.flagshipUnits.readiness['iron-brigade']!==0) throw new Error('readiness bad');
      if(C.flagshipUnits.casualtyMemory['stonewall-brigade']!==0) throw new Error('casualty not reset');
      if(!Array.isArray(C.flagshipUnits.log)||C.flagshipUnits.lastTurn!==null||C.flagshipUnits.lastBridge!==null) throw new Error('last/log not sanitized');
      return C.flagshipUnits;
    });
    step('War Effort UI renders flagship teaching and toggle wires', function(){
      var C=mkC('US',1864,'gettysburg'); C.flagshipUnits.casualtyMemory['iron-brigade']=160;
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if(h.indexOf('Flagship Named Units')<0||h.indexOf('54th Massachusetts')<0||h.indexOf('Iron Brigade')<0||h.indexOf('20th Maine')<0||h.indexOf('super-unit')<0) throw new Error('teaching copy missing');
      var b=document.getElementById('fguToggleStewardship'); if(!b) throw new Error('button absent');
      b.click(); if(!C.flagshipUnits.active||C.flagshipUnits.priority!=='unitStewardship') throw new Error('toggle failed');
      return { active:C.flagshipUnits.active, bridge:flagshipUnitsBridgeBonus(C), len:h.length };
    });
    step('no replacement or tactical contamination from source/data', function(){
      var src=${JSON.stringify(sourceText)}, data=${JSON.stringify(dataText)};
      function scan(o,p){ if(!o||typeof o!=='object') return; Object.keys(o).forEach(function(k){ var v=o[k], q=p?p+'.'+k:k; if(k==='replacePid') throw new Error('replacePid '+q); if(typeof v==='string'&&/^ss:/.test(v)) throw new Error('ss '+q); if(v&&typeof v==='object') scan(v,q); }); }
      scan(JSON.parse(data),'');
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=|\\.winner\\s*=|\\.men\\s*=/.test(src)) throw new Error('tactical/output touch');
      if(/ssPersonRegistry|ssFindPerson|wiwThreadHTML/.test(src)) throw new Error('registry renderer consumed');
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
    try {
      await withTimeout('screenshot setup', page.evaluate(() => {
        G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
        var C=G.campaign; _t1InitAll(C); if(C.clock){ C.clock.year=1864; C.clock.capital=12; C.clock.weariness=52; } if(C.president&&C.president.date) C.president.date.year=1864;
        if(typeof CHAINS!=='undefined'&&CHAINS.US){ var ix=CHAINS.US.indexOf('gettysburg'); if(ix>=0) C.idx=ix; }
        C.flagshipUnits.casualtyMemory['iron-brigade']=180; C.flagshipUnits.readiness['twentieth-maine-vincent']=50; flagshipUnitsSetPriority(C,'unitStewardship');
        openWarDept(); window._wdTab='economy'; _wdRefresh();
        var b=document.getElementById('fguToggleStewardship'); if(b&&b.scrollIntoView) b.scrollIntoView({block:'center'});
      }), T.screenshotSetup);
      await sleep(600);
      await withTimeout('screenshot', page.screenshot({ path: join(OUT,'flagship-units.png'), fullPage:false, timeout:T.screenshot }), T.screenshotBound);
      result.screenshot = { path: join(OUT,'flagship-units.png') };
    } catch (shotErr) {
      result.screenshotWarning = String(shotErr && shotErr.message || shotErr);
    }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-flagship-units.json'), JSON.stringify(result, null, 2));
    await closePage(page);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  console.log('probe-flagship-units ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
  process.exit(0);
})();
