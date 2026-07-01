#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-irregular-war.mjs — D177 irregular-war War Effort gate.
// Verifies source-backed data, default exact-zero bridge input, capped active
// civilian security, irregular-war ledger behavior, save sanitation, War Effort
// UI, and no tactical contamination.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }

const sourceText = readFileSync(join(ROOT, 'src', '65-irregular-war.js'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?2200:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock){ C.clock.year=year||1864; C.clock.weariness=40; C.clock.capital=12; }
    if(C.president && C.president.date) C.president.date.year=year||1864;
    return C; }
  function fakeB(side, id, year, type){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=2400; c[e]=1500;
    return { playerSide:side, enemySide:e, bd:{id:id||'shiloh',name:'Shiloh',year:year||1863}, casualties:c, infl:{}, units:[], type:type||'loss' }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';

    step('data loads with Verified profiles, threads, and debates', function(){
      var D=GAME_DATA && GAME_DATA['irregular-war'];
      if(!D || D.schema!=='cw_irregular_war_v1') throw new Error('missing irregular-war data/schema');
      ['US','CS'].forEach(function(s){ var p=D.profiles&&D.profiles[s]; if(!p) throw new Error('missing profile '+s);
        if(p.provenance!=='Verified') throw new Error('profile '+s+' not Verified');
        if(!Array.isArray(p.sources)||p.sources.length<2) throw new Error('profile '+s+' needs >=2 sources');
        if(!/guerrilla|partisan|civilian|border/i.test((p.teaching||'')+' '+(p.summary||''))) throw new Error('profile '+s+' lacks irregular-war teaching'); });
      if(!Array.isArray(D.threads)||D.threads.length<5) throw new Error('missing irregular-war threads');
      if(!Array.isArray(D.debates)||D.debates.length<3) throw new Error('missing debates');
      D.threads.concat(D.debates).forEach(function(x){ if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+x.id); });
      var labels=D.threads.map(function(p){return p.id;}).join(',');
      ['mosby-partisan-rangers','lawrence-massacre','general-order-11','lieber-code'].forEach(function(id){ if(labels.indexOf(id)<0) throw new Error('missing required teaching beat '+id); });
      return { schema:D.schema, threads:D.threads.length, debates:D.debates.length };
    });

    step('default bridge input is exact zero and does not move army facets', function(){
      var C=mkC('US',1864);
      C.irregularWar.incidents.US=60; C.irregularWar.civilianHarm.US=800;
      var a0=bridgeArmy(C);
      var b=irregularWarBridgeBonus(C);
      var a1=bridgeArmy(C);
      if(b.morale!==0 || b.supply!==0 || b.fatigue!==0 || b.overall!==0) throw new Error('inactive bridge should be exact zero: '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(a0[k]!==a1[k]) throw new Error(k+' changed while inactive: '+a0[k]+'->'+a1[k]); });
      return { bridge:b, army:{overall:a1.overall,morale:a1.morale,supply:a1.supply,fatigue:a1.fatigue} };
    });

    step('active civilian security is explicit, bounded, and costly', function(){
      var C=mkC('US',1864); C.warroom.supply=70; C.strategy.enemyWill=40;
      var before=bridgeArmy(C);
      irregularWarSetPriority(C,'civilianSecurity');
      var bonus=irregularWarBridgeBonus(C), after=bridgeArmy(C), caps=GAME_DATA['irregular-war'].config.bridgeCaps;
      if(!bonus.active) throw new Error('bonus should be active');
      if(bonus.morale<0 || bonus.morale>caps.morale) throw new Error('morale outside cap '+bonus.morale);
      if(bonus.supply>0 || Math.abs(bonus.supply)>caps.supplyCost) throw new Error('supply cost outside cap '+bonus.supply);
      if(bonus.fatigue<0 || bonus.fatigue>caps.fatigueCost) throw new Error('fatigue outside cap '+bonus.fatigue);
      if(bonus.overall!==0) throw new Error('irregular-war security must not add direct overall bonus');
      if(after.supply>before.supply) throw new Error('security should not raise supply');
      if(after.fatigue<before.fatigue) throw new Error('security should not reduce fatigue');
      return { before:before, after:after, bonus:bonus };
    });

    step('pressure responds to year, border-war context, hard-war spillover, and logistics', function(){
      var early=mkC('US',1861); early.idx=0; early.strategy.enemyWill=82; early.warroom.supply=78;
      var late=mkC('CS',1864); late.idx=1; late.strategy.enemyWill=35; late.warroom.supply=35; late.production.railIntegrity=35; late.production.foodDist=.38;
      if(typeof hardWarSetPriority==='function') hardWarSetPriority(late,'civilianProtection');
      var e=irregularWarSnapshot(early), l=irregularWarSnapshot(late);
      if(!(l.pressure>e.pressure+15)) throw new Error('late pressure should exceed early contained pressure: '+e.pressure+' -> '+l.pressure);
      if(!(l.hardWarPressure>=e.hardWarPressure)) throw new Error('hard-war spillover should be visible');
      return { early:e, late:l };
    });

    step('resolve records ledger and active security mitigates without erasing', function(){
      var I=mkC('US',1864), A=mkC('US',1864);
      I.strategy.enemyWill=40; A.strategy.enemyWill=40;
      A.clock.capital=I.clock.capital=12;
      irregularWarSetPriority(A,'civilianSecurity');
      irregularWarOnResolve('CS','loss',fakeB('US','shiloh',1864,'loss'),I,false);
      irregularWarOnResolve('CS','loss',fakeB('US','shiloh',1864,'loss'),A,false);
      if(!I.irregularWar.lastTurn || !A.irregularWar.lastTurn) throw new Error('lastTurn not recorded');
      if(!(A.irregularWar.lastTurn.reprisalsAdded<I.irregularWar.lastTurn.reprisalsAdded)) throw new Error('active security should reduce reprisals');
      if(!(A.irregularWar.lastTurn.civilianHarmAdded<I.irregularWar.lastTurn.civilianHarmAdded)) throw new Error('active security should reduce civilian harm');
      if(!(A.irregularWar.lastTurn.protectedCivilians>0)) throw new Error('active security should record protected civilians');
      if(!(A.clock.capital<I.clock.capital)) throw new Error('active security should cost political capital');
      if(!(A.irregularWar.incidents.US>0 && A.irregularWar.civilianHarm.US>0)) throw new Error('security must not erase irregular-war ledger');
      return { inactive:I.irregularWar.lastTurn, active:A.irregularWar.lastTurn, clocks:{inactive:I.clock, active:A.clock} };
    });

    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1864);
      C.irregularWar={active:'yes', priority:'bad', incidents:{US:-5,CS:'44'}, reprisals:'bad', civilianHarm:{US:'8',CS:[]}, protectedCivilians:{US:3,CS:'9'}, localIntelligence:{US:'10',CS:null}, log:'oops', lastTurn:'bad', lastBridge:[]};
      irregularWarInit(C);
      if(C.irregularWar.active!==false) throw new Error('active not sanitized');
      if(C.irregularWar.priority!==null) throw new Error('priority not sanitized');
      if(C.irregularWar.incidents.US!==0 || C.irregularWar.incidents.CS!==44) throw new Error('incidents bag not sanitized');
      if(C.irregularWar.reprisals.US!==0 || C.irregularWar.reprisals.CS!==0) throw new Error('reprisals bag not sanitized');
      if(C.irregularWar.civilianHarm.US!==8 || C.irregularWar.civilianHarm.CS!==0) throw new Error('civilianHarm bag not sanitized');
      if(C.irregularWar.protectedCivilians.US!==3 || C.irregularWar.protectedCivilians.CS!==9) throw new Error('protected bag not sanitized');
      if(C.irregularWar.localIntelligence.US!==10 || C.irregularWar.localIntelligence.CS!==0) throw new Error('intel bag not sanitized');
      if(!Array.isArray(C.irregularWar.log)) throw new Error('log not array');
      if(C.irregularWar.lastTurn!==null || C.irregularWar.lastBridge!==null) throw new Error('last fields not nulled');
      return C.irregularWar;
    });

    step('War Effort UI renders irregular-war teaching and toggle wires', function(){
      var C=mkC('US',1864); C.irregularWar.incidents.US=72; C.irregularWar.civilianHarm.US=1800; C.strategy.enemyWill=42;
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if(h.indexOf('Irregular War &amp; Civilian Security')<0) throw new Error('irregular-war block missing');
      if(h.indexOf('Mosby')<0 || h.indexOf('Quantrill')<0 || h.indexOf('Lawrence')<0 || h.indexOf('Lost Cause')<0) throw new Error('irregular-war teaching copy missing');
      var b=document.getElementById('iwToggleSecurity'); if(!b) throw new Error('civilian-security button absent');
      b.click();
      if(!C.irregularWar || C.irregularWar.active!==true || C.irregularWar.priority!=='civilianSecurity') throw new Error('toggle did not activate');
      var bb=irregularWarBridgeBonus(C); if(!bb.active) throw new Error('bridge not active after click');
      return { active:C.irregularWar.active, bridge:bb, len:h.length };
    });

    step('no tactical/classic contamination from the strategic module', function(){
      var src = ${JSON.stringify(sourceText)};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=|\\.winner\\s*=|\\.men\\s*=/.test(src)) throw new Error('irregular-war module touched tactical engine/output fields');
      return { tacticalTokens:false };
    });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<80;i++){ if(await up(probe))break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:90000 });
    await sleep(700);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    await page.evaluate(() => {
      G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); if(C.clock){ C.clock.year=1864; C.clock.capital=12; } if(C.president&&C.president.date) C.president.date.year=1864;
      C.irregularWar.incidents.US=92; C.irregularWar.reprisals.US=44; C.irregularWar.civilianHarm.US=2400; C.strategy.enemyWill=42; irregularWarSetPriority(C,'civilianSecurity');
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var b=document.getElementById('iwToggleSecurity'); if(b && b.scrollIntoView) b.scrollIntoView({block:'center'});
    });
    await sleep(300); await page.screenshot({ path: join(OUT,'irregular-war.png'), fullPage:false, timeout:90000 });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-irregular-war.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-irregular-war ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
