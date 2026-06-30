#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-hard-war.mjs — D175 hard-war War Effort gate.
// Verifies source-backed data, default exact-zero bridge input, capped active
// protection, hard-war ledger behavior, save sanitation, War Effort UI, and no
// tactical contamination.
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

const sourceText = readFileSync(join(ROOT, 'src', '64-hard-war.js'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?2200:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock){ C.clock.year=year||1864; C.clock.weariness=38; C.clock.capital=12; }
    if(C.president && C.president.date) C.president.date.year=year||1864;
    if(C.president) C.president.emancipation={issued:true,declined:false,year:1863};
    return C; }
  function fakeB(side, id, year, type){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=2500; c[e]=1700;
    return { playerSide:side, enemySide:e, bd:{id:id||'atlanta',name:'Atlanta',year:year||1864}, casualties:c, infl:{}, units:[], type:type||'win' }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';

    step('data loads with Verified profiles, policies, and debates', function(){
      var D=GAME_DATA && GAME_DATA['hard-war'];
      if(!D || D.schema!=='cw_hard_war_v1') throw new Error('missing hard-war data/schema');
      ['US','CS'].forEach(function(s){ var p=D.profiles&&D.profiles[s]; if(!p) throw new Error('missing profile '+s);
        if(p.provenance!=='Verified') throw new Error('profile '+s+' not Verified');
        if(!Array.isArray(p.sources)||p.sources.length<2) throw new Error('profile '+s+' needs >=2 sources');
        if(!/slavery|civilian|property|Confeder/i.test((p.teaching||'')+' '+(p.summary||''))) throw new Error('profile '+s+' lacks hard-war teaching'); });
      if(!Array.isArray(D.policies)||D.policies.length<4) throw new Error('missing hard-war policies');
      if(!Array.isArray(D.debates)||D.debates.length<2) throw new Error('missing debates');
      D.policies.concat(D.debates).forEach(function(x){ if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+x.id); });
      var labels=D.policies.map(function(p){return p.id;}).join(',');
      if(labels.indexOf('sherman-march')<0 || labels.indexOf('sheridan-burning')<0 || labels.indexOf('freedpeople-protection')<0) throw new Error('missing required teaching beats: '+labels);
      return { schema:D.schema, policies:D.policies.length, debates:D.debates.length };
    });

    step('default bridge input is exact zero and does not move army facets', function(){
      var C=mkC('US',1864);
      C.hardWar.propertyDestroyed.US=5000; C.hardWar.displaced.US=2500;
      var a0=bridgeArmy(C);
      var b=hardWarBridgeBonus(C);
      var a1=bridgeArmy(C);
      if(b.morale!==0 || b.supply!==0 || b.fatigue!==0 || b.overall!==0) throw new Error('inactive bridge should be exact zero: '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(a0[k]!==a1[k]) throw new Error(k+' changed while inactive: '+a0[k]+'->'+a1[k]); });
      return { bridge:b, army:{overall:a1.overall,morale:a1.morale,supply:a1.supply,fatigue:a1.fatigue} };
    });

    step('active protection is explicit, bounded, and costly', function(){
      var C=mkC('US',1864); C.warroom.supply=74; C.strategy.enemyWill=38;
      var before=bridgeArmy(C);
      hardWarSetPriority(C,'civilianProtection');
      var bonus=hardWarBridgeBonus(C), after=bridgeArmy(C), caps=GAME_DATA['hard-war'].config.bridgeCaps;
      if(!bonus.active) throw new Error('bonus should be active');
      if(bonus.morale<0 || bonus.morale>caps.morale) throw new Error('morale outside cap '+bonus.morale);
      if(bonus.supply>0 || Math.abs(bonus.supply)>caps.supplyCost) throw new Error('supply cost outside cap '+bonus.supply);
      if(bonus.fatigue<0 || bonus.fatigue>caps.fatigueCost) throw new Error('fatigue outside cap '+bonus.fatigue);
      if(bonus.overall!==0) throw new Error('hard-war protection must not add direct overall bonus');
      if(after.supply>before.supply) throw new Error('protection should not raise supply');
      if(after.fatigue<before.fatigue) throw new Error('protection should not reduce fatigue');
      return { before:before, after:after, bonus:bonus };
    });

    step('pressure responds to year, momentum, logistics, and emancipation', function(){
      var early=mkC('US',1862); early.president.emancipation={issued:false,declined:false}; early.strategy.enemyWill=80; early.warroom.supply=75;
      var late=mkC('CS',1864); late.strategy.enemyWill=35; late.warroom.supply=35; late.production.railIntegrity=35; late.production.foodDist=.38;
      var e=hardWarSnapshot(early), l=hardWarSnapshot(late);
      if(!(l.pressure>e.pressure+20)) throw new Error('late Confederate hard-war pressure should exceed early limited policy: '+e.pressure+' -> '+l.pressure);
      if(!l.emancipation) throw new Error('late hard-war snapshot should carry emancipation/freedpeople pressure');
      return { early:e, late:l };
    });

    step('resolve records ledger and active protection mitigates without erasing', function(){
      var I=mkC('US',1864), A=mkC('US',1864);
      I.strategy.enemyWill=40; A.strategy.enemyWill=40;
      A.clock.weariness=I.clock.weariness=42; A.clock.capital=I.clock.capital=12;
      hardWarSetPriority(A,'civilianProtection');
      hardWarOnResolve('US','win',fakeB('US','atlanta',1864,'win'),I,true);
      hardWarOnResolve('US','win',fakeB('US','atlanta',1864,'win'),A,true);
      if(!I.hardWar.lastTurn || !A.hardWar.lastTurn) throw new Error('lastTurn not recorded');
      if(!(A.hardWar.lastTurn.propertyAdded<I.hardWar.lastTurn.propertyAdded)) throw new Error('active protection should reduce property pressure');
      if(!(A.hardWar.lastTurn.displacedAdded<I.hardWar.lastTurn.displacedAdded)) throw new Error('active protection should reduce displacement');
      if(!(A.hardWar.lastTurn.freedpeopleProtected>0)) throw new Error('active protection should record protected freedpeople/refugees');
      if(!(A.clock.weariness<I.clock.weariness)) throw new Error('active protection should relieve weariness by a small cap');
      if(!(A.clock.capital<I.clock.capital)) throw new Error('active protection should cost political capital');
      if(!(A.hardWar.propertyDestroyed.US>0 && A.hardWar.displaced.US>0)) throw new Error('protection must not erase hard-war ledger');
      return { inactive:I.hardWar.lastTurn, active:A.hardWar.lastTurn, clocks:{inactive:I.clock, active:A.clock} };
    });

    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1864);
      C.hardWar={active:'yes', priority:'bad', propertyDestroyed:{US:-5,CS:'44'}, displaced:'bad', freedpeopleProtected:{US:'8',CS:[]}, log:'oops', lastTurn:'bad', lastBridge:[]};
      hardWarInit(C);
      if(C.hardWar.active!==false) throw new Error('active not sanitized');
      if(C.hardWar.priority!==null) throw new Error('priority not sanitized');
      if(C.hardWar.propertyDestroyed.US!==0 || C.hardWar.propertyDestroyed.CS!==44) throw new Error('property bag not sanitized');
      if(C.hardWar.displaced.US!==0 || C.hardWar.displaced.CS!==0) throw new Error('displaced bag not sanitized');
      if(C.hardWar.freedpeopleProtected.US!==8 || C.hardWar.freedpeopleProtected.CS!==0) throw new Error('freedpeople bag not sanitized');
      if(!Array.isArray(C.hardWar.log)) throw new Error('log not array');
      if(C.hardWar.lastTurn!==null || C.hardWar.lastBridge!==null) throw new Error('last fields not nulled');
      return C.hardWar;
    });

    step('War Effort UI renders hard-war teaching and toggle wires', function(){
      var C=mkC('US',1864); C.hardWar.propertyDestroyed.US=4600; C.hardWar.displaced.US=1800; C.strategy.enemyWill=42;
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if(h.indexOf('Hard War &amp; Civilian Protection')<0) throw new Error('hard-war block missing');
      if(h.indexOf('Sherman')<0 || h.indexOf('Sheridan')<0 || h.indexOf('Lost Cause')<0) throw new Error('hard-war teaching copy missing');
      var b=document.getElementById('hwToggleProtection'); if(!b) throw new Error('protection button absent');
      b.click();
      if(!C.hardWar || C.hardWar.active!==true || C.hardWar.priority!=='civilianProtection') throw new Error('toggle did not activate');
      var bb=hardWarBridgeBonus(C); if(!bb.active) throw new Error('bridge not active after click');
      return { active:C.hardWar.active, bridge:bb, len:h.length };
    });

    step('no tactical/classic contamination from the strategic module', function(){
      var src = ${JSON.stringify(sourceText)};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=|\\.winner\\s*=/.test(src)) throw new Error('hard-war module touched tactical engine/output fields');
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
      if(C.president) C.president.emancipation={issued:true,declined:false,year:1863};
      C.hardWar.propertyDestroyed.US=6200; C.hardWar.displaced.US=2400; C.strategy.enemyWill=42; hardWarSetPriority(C,'civilianProtection');
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var b=document.getElementById('hwToggleProtection'); if(b && b.scrollIntoView) b.scrollIntoView({block:'center'});
    });
    await sleep(300); await page.screenshot({ path: join(OUT,'hard-war.png'), fullPage:false, timeout:90000 });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-hard-war.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-hard-war ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
