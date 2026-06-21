#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-bullrun.mjs — TACTICAL ENGINE P1a (the First Bull Run scenario). Verifies the
// real-OOB historical battle EMPIRICALLY on the renderer-agnostic sim (no GPU → no swiftshader
// flake): the engaged OOB instantiates; the historical terrain (Henry House Hill / Matthews Hill /
// Chinn Ridge + markers) builds; reinforcements arrive ON SCHEDULE, in order, idempotently; the
// rail-pivot timeline is LOAD-BEARING on the outcome (the historical asymmetry); determinism under
// a fixed seed; no NaN; a winner is declared; the SANDBOX is unregressed (incl. a terrain
// GOLDEN-SNAPSHOT guard); no Classic contamination; the 2D path + the live-menu button work.
// Writes shots/probe-bullrun.json + shots/probe-bullrun.png.
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

// The frozen golden snapshot of the P0 sandbox terrain (derived from fldBuildTerrain at the
// 1200x900 field, OBJ_R=130). If a future edit silently changes the sandbox geometry, this fails.
const GOLD_TERRAIN = '{"hill":{"x":600,"z":450,"h":26,"s":220},"woods":[{"x":310,"z":480,"r":170},{"x":920,"z":360,"r":130}],"wall":{"x1":490,"z1":380,"x2":720,"z2":380}}';
const GOLD_OBJ = '{"x":600,"z":450,"r":130}';

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function isNum(n){ return typeof n==='number' && isFinite(n); }
  function nanScan(){ for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
    if(!isNum(u.x)||!isNum(u.z)||!isNum(u.men)||!isNum(u.morale)||!isNum(u.facing)||!isNum(u.fatigue)||!isNum(u.ammo))
      return u.id; } return null; }
  function runToEnd(maxSteps){ if(__FIELD.phase==='deploy'){__FIELD.phase='battle';__FIELD.paused=false;} var n=0; while(__FIELD.phase==='battle' && n<maxSteps){ fldSimStep(0.05); n++; } return n; }
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  function liveCount(){ return __FIELD.units.length; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldScenarioInit!=='function')
      return JSON.stringify({ok:false, fatal:'__FIELD engine / scenario seam missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; G.settings.tacticalFog=false; __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=true;   // B-2/B-3/B-4: lock the PRE-officer/PRE-logistics/PRE-arms sim core BYTE-IDENTICAL (bullrun1 fields art+cav; each layer has its own probe). tacticalFog pinned OFF: bullrun1 now DEFAULTS fog ON (D67) -> pin it so this baseline stays clear-weather byte-identical.
    var DATA = (GAME_DATA && GAME_DATA.bullrun) ? GAME_DATA.bullrun.bullrun1 : null;

    step('DATA present: GAME_DATA.bullrun.bullrun1 with OOB + terrain + reinforcements (full engaged force)', function(){
      if(!DATA) throw new Error('GAME_DATA.bullrun.bullrun1 missing');
      var rf=DATA.reinforcements||[];
      var usTot=DATA.oob.US.length, csTot=DATA.oob.CS.length;
      for(var i=0;i<rf.length;i++){ if(rf[i].side==='US')usTot++; else if(rf[i].side==='CS')csTot++; }
      if(usTot<6) throw new Error('want >=6 US brigades total, got '+usTot);
      if(csTot<6) throw new Error('want >=6 CS brigades total, got '+csTot);
      if(rf.length<8) throw new Error('want >=8 reinforcement waves, got '+rf.length);
      return { usTotal:usTot, csTotal:csTot, t0:{us:DATA.oob.US.length,cs:DATA.oob.CS.length}, waves:rf.length }; });

    step('LAUNCH bullrun1 instantiates the engaged OOB at T=0 (US+CS on field)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:12345});
      if(__FIELD.scenario!=='bullrun1') throw new Error('scenario not set: '+__FIELD.scenario);
      var want=DATA.oob.US.length+DATA.oob.CS.length;
      if(liveCount()!==want) throw new Error('want '+want+' units at T=0, got '+liveCount());
      var us=0,cs=0; for(var i=0;i<__FIELD.units.length;i++){ if(__FIELD.units[i].side==='US')us++; else cs++; }
      if(us!==DATA.oob.US.length) throw new Error('US count '+us);
      if(cs!==DATA.oob.CS.length) throw new Error('CS count '+cs);
      if(__FIELD.phase!=='deploy') throw new Error('should deploy, got '+__FIELD.phase);
      return { units:liveCount(), us:us, cs:cs, holdToWin:__FIELD.holdToWin, timeLimit:__FIELD.timeLimit }; });

    step('HISTORICAL TERRAIN: 3 named hills (Henry House Hill objective) + markers', function(){
      var t=__FIELD.terrain;
      if(!t.hills || t.hills.length!==3) throw new Error('want 3 hills, got '+(t.hills&&t.hills.length));
      var names=t.hills.map(function(h){return h.name;}).join('|');
      if(names.indexOf('Henry House Hill')<0) throw new Error('no Henry House Hill: '+names);
      if(names.indexOf('Matthews Hill')<0) throw new Error('no Matthews Hill: '+names);
      if(names.indexOf('Chinn Ridge')<0) throw new Error('no Chinn Ridge: '+names);
      if(__FIELD.objective.name!=='Henry House Hill') throw new Error('objective='+__FIELD.objective.name);
      // coordinate drift-guard for the Bull Run objective (mirrors the sandbox golden snapshot)
      if(__FIELD.objective.x!==600 || __FIELD.objective.z!==450 || __FIELD.objective.r!==140) throw new Error('Bull Run objective coords drifted: '+JSON.stringify(__FIELD.objective));
      if(!t.markers || t.markers.length<4) throw new Error('want >=4 markers, got '+(t.markers&&t.markers.length));
      var kinds={}; for(var i=0;i<t.markers.length;i++) kinds[t.markers[i].kind]=1;
      if(!kinds.ford||!kinds.bridge||!kinds.road) throw new Error('missing ford/bridge/road markers');
      // cover function reads multiple hills: the objective crest must give a cover bonus.
      var cov=fldCoverAt(__FIELD.objective.x,__FIELD.objective.z);
      if(!(cov>1.0)) throw new Error('crest gives no cover bonus: '+cov);
      return { hills:names, markerKinds:Object.keys(kinds).join(','), crestCover:Math.round(cov*100)/100 }; });

    step('REINFORCEMENTS arrive ON SCHEDULE, in order, idempotently (isolated)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:7});
      var base=liveCount(), sched=__FIELD.reinforce.slice();
      // sorted ascending by atSec
      for(var i=1;i<sched.length;i++) if(sched[i].atSec<sched[i-1].atSec) throw new Error('schedule not sorted');
      __FIELD.phase='battle';
      __FIELD.t=0; fldScenarioTick(0.05);
      if(liveCount()!==base) throw new Error('something arrived at t=0: '+liveCount()+' vs '+base);
      var first=sched[0];
      __FIELD.t=first.atSec+1; fldScenarioTick(0.05);
      if(liveCount()!==base+1) throw new Error('first reinforcement did not arrive at t='+first.atSec+': '+liveCount());
      __FIELD.t=99999; fldScenarioTick(0.05);
      var all=base+sched.length;
      if(liveCount()!==all) throw new Error('not all arrived: '+liveCount()+' want '+all);
      fldScenarioTick(0.05); // idempotent
      if(liveCount()!==all) throw new Error('re-tick spawned duplicates: '+liveCount());
      var spawnedIds=[]; for(var j=0;j<__FIELD.units.length;j++) spawnedIds.push(__FIELD.units[j].id);
      return { baseOOB:base, totalAfterAll:all, firstAt:first.atSec, hasJackson: spawnedIds.indexOf('cs_jackson')>=0, hasElzey: spawnedIds.indexOf('cs_elzey')>=0 }; });

    step('PLAYER REINFORCEMENTS advance on arrival (non-autoBoth: US units are player-side, not left idling)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', seed:4});   // NOT autoBoth -> US = the player
      __FIELD.phase='battle'; __FIELD.t=99999; fldScenarioTick(0.05);     // force every reinforcement to spawn
      var howard=null, jackson=null;
      for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.id==='us_howard')howard=u; if(u.id==='cs_jackson')jackson=u; }
      if(!howard) throw new Error('us_howard (player reinforcement) did not spawn');
      if(howard.ai) throw new Error('player US reinforcement is AI (should be player-controlled)');
      if(!howard.order || howard.order.type!=='move') throw new Error('player US reinforcement left idling (no advance order): '+(howard.order&&howard.order.type));
      if(!jackson || !jackson.ai) throw new Error('CS reinforcement should remain AI-driven');
      return { howardOrder:howard.order.type, howardAi:howard.ai, jacksonAi:jackson.ai }; });

    step('FULL BATTLE: reaches the reinforcement era, a winner is declared, no deadlock, no NaN', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:101});
      var n=runToEnd(20000);
      if(__FIELD.phase!=='over') throw new Error('battle did not end, t='+__FIELD.t);
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('bad winner '+__FIELD.winner);
      // the staggered model must NOT resolve before the rail pivot — the timeline has to matter
      if(__FIELD.t < 140) throw new Error('battle ended before reinforcements engaged (t='+Math.round(__FIELD.t)+'); rebalance needed');
      var arrived=__FIELD.reinforce.filter(function(e){return e.done;}).length;
      if(arrived < 3) throw new Error('too few reinforcements engaged: '+arrived);
      var bad=nanScan(); if(bad) throw new Error('NaN in '+bad);
      if(['hold','destroy','timeout'].indexOf(__FIELD.winBy)<0) throw new Error('winBy not recorded: '+__FIELD.winBy);
      return { winner:__FIELD.winner, winBy:__FIELD.winBy, endSec:Math.round(__FIELD.t), reinforcementsArrived:arrived, usStr:strength('US'), csStr:strength('CS') }; });

    step('DEFENDER WINS BY DENIAL: time limit reached without the Union holding -> Confederate (defender) wins', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:5});
      __FIELD.phase='battle'; __FIELD.holdSecs.US=0; __FIELD.holdSecs.CS=0; __FIELD.t=__FIELD.timeLimit;
      __FIELD.reinforce=[];   // none pending so the gone-checks are decided by live units (both sides have some)
      fldSimStep(0.05);
      if(__FIELD.winner!=='CS') throw new Error('defender (CS) should win by denial at the time limit, got '+__FIELD.winner);
      if(__FIELD.winBy!=='timeout') throw new Error('expected winBy=timeout, got '+__FIELD.winBy);
      return { winner:__FIELD.winner, winBy:__FIELD.winBy }; });

    step('HISTORICAL ASYMMETRY: the CONFEDERATE rail pivot is LOAD-BEARING (it makes the Union job far harder)', function(){
      // a Confederate-DEFENDER outcome scalar: a CS win dominates; else the longer the Union is
      // denied the hill (and the more men it must spend), the better the rebels did. Removing ONLY the
      // CS reinforcements must collapse this score (the Union seizes the hill far sooner / cheaper).
      function csScore(){ var d=strength('CS')-strength('US');
        if(__FIELD.winner==='CS') return 1000000+d;
        if(__FIELD.winner==='draw') return 500000+d;
        return Math.round(__FIELD.t*1000)+d; }   // US won: reward the time it took
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:55});
      runToEnd(20000); var wWith=__FIELD.winner, sWith=csScore(), tWith=Math.round(__FIELD.t);
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:55});
      __FIELD.reinforce=__FIELD.reinforce.filter(function(e){return e.spec.side!=='CS';});  // the trains never run
      runToEnd(20000); var wWithout=__FIELD.winner, sWithout=csScore(), tWithout=Math.round(__FIELD.t);
      if(!(sWith>sWithout)) throw new Error('CS rail pivot not load-bearing: csScore with='+sWith+' without='+sWithout);
      return { winnerWith:wWith, winnerWithoutCSrail:wWithout, endWith:tWith, endWithout:tWithout, csScoreWith:sWith, csScoreWithout:sWithout }; });

    step('DETERMINISM: same seed -> same winner + same casualties', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:909}); runToEnd(20000);
      var w1=__FIELD.winner, c1=strength('US')+strength('CS'), n1=liveCount();
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:909}); runToEnd(20000);
      var w2=__FIELD.winner, c2=strength('US')+strength('CS'), n2=liveCount();
      if(w1!==w2) throw new Error('non-deterministic winner '+w1+' vs '+w2);
      if(c1!==c2) throw new Error('non-deterministic strength '+c1+' vs '+c2);
      if(n1!==n2) throw new Error('non-deterministic unit count '+n1+' vs '+n2);
      return { winner:w1, totalStr:c1, units:n1 }; });

    step('SANDBOX UNREGRESSED + terrain GOLDEN SNAPSHOT (silent-drift guard)', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:12345});   // no scenario -> sandbox
      if(__FIELD.scenario!=='sandbox') throw new Error('sandbox scenario tag wrong: '+__FIELD.scenario);
      if(__FIELD.units.length!==4) throw new Error('sandbox want 4 units, got '+__FIELD.units.length);
      if(__FIELD.reinforce) throw new Error('sandbox should have no reinforcements');
      if(__FIELD.scenData) throw new Error('stale scenData leaked into the sandbox after a bullrun launch');
      if(__FIELD.attacker) throw new Error('stale attacker leaked into the sandbox');
      var gt=JSON.stringify(__FIELD.terrain), go=JSON.stringify(__FIELD.objective);
      if(gt!==${JSON.stringify(GOLD_TERRAIN)}) throw new Error('sandbox terrain drifted: '+gt);
      if(go!==${JSON.stringify(GOLD_OBJ)}) throw new Error('sandbox objective drifted: '+go);
      fldStepN(20,0.05); runToEnd(12000);
      if(__FIELD.phase!=='over') throw new Error('sandbox did not finish');
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('sandbox bad winner');
      return { goldenTerrainOK:true, goldenObjOK:true, sandboxWinner:__FIELD.winner }; });

    step('NO CLASSIC CONTAMINATION: bullrun never wrote G.battle / G.campaign / G.mode', function(){
      var modeBefore=G.mode;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:3}); fldStepN(400,0.05);
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('mutated G.mode: '+G.mode);
      fldExit(true);
      return { gMode:G.mode, gBattle:(typeof G.battle) }; });

    step('2D PATH for bullrun: DOM + canvas build, reinforcement banner-safe draw, teardown', function(){
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', autoBoth:true, seed:42});
      var root=document.getElementById('fldRoot'); if(!root) throw new Error('no #fldRoot');
      if(!__FIELD.ctx2d) throw new Error('no 2d context');
      __FIELD.phase='battle'; __FIELD.paused=false;
      fldStepN(2800,0.05);   // ~140 sim-seconds -> at least Jackson (130) has arrived & a banner drawn
      fld2dDraw(); fldRenderHud(); fldRenderTop();   // must not throw with markers + extra units
      var arrived = __FIELD.reinforce.filter(function(e){return e.done;}).length;
      fldExit(true);
      if(document.getElementById('fldRoot')) throw new Error('teardown left DOM');
      if(arrived<1) throw new Error('no reinforcement arrived in 140s of 2D run');
      return { built:true, reinforcementsArrived:arrived }; });

    step('SCENARIO A11Y: briefing dialog (role/modal/Esc-contained) + reinforcement aria-live + banner role', function(){
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', seed:8});
      fldBullRunBriefing();
      var brief=document.getElementById('fldBrief');
      if(!brief) throw new Error('briefing dialog not created');
      if(brief.getAttribute('role')!=='dialog') throw new Error('briefing role!=dialog');
      if(brief.getAttribute('aria-modal')!=='true') throw new Error('briefing not aria-modal');
      if(!document.getElementById('fldBriefGo')) throw new Error('no Take-command button');
      // Esc inside the briefing must close ONLY the briefing, never tear down the running battle
      document.getElementById('fldBriefGo').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      if(document.getElementById('fldBrief')) throw new Error('Esc did not close the briefing');
      if(__FIELD.launched!==true) throw new Error('Esc on the briefing tore down the whole battle');
      // reinforcement announce: step past Hampton (45s) -> an aria-live message + a role=status banner
      __FIELD.phase='battle'; __FIELD.paused=true; fldStepN(1000,0.05);   // ~50s, paused so the RAF can't double-step
      var live=document.getElementById('fldLive');
      if(!live || live.textContent.indexOf('Hampton')<0) throw new Error('reinforcement not announced via aria-live: '+(live&&live.textContent));
      var banner=document.querySelector('.fldBanner');
      if(!banner || banner.getAttribute('role')!=='status') throw new Error('arrival banner missing role=status');
      fldExit(true);
      return { briefingDialog:true, escContained:true, ariaLiveAnnounce:true, bannerRole:'status' }; });

    step('MENU: the First Bull Run button injects after the sandbox button on the live menu', function(){
      if (typeof openMainMenu!=='function') return { skipped:'no openMainMenu' };
      G.mode='menu'; openMainMenu();
      if(!document.getElementById('gnFree')) throw new Error('live menu has no #gnFree anchor');
      fldInjectMenuButton();   // injects sandbox + (via the seam) the scenario buttons
      var sb=document.getElementById('fldSandboxBtn'), bb=document.getElementById('fldBullRunBtn');
      if(!sb) throw new Error('sandbox button missing');
      if(!bb) throw new Error('First Bull Run button did NOT inject');
      if(bb.parentNode!==sb.parentNode) throw new Error('Bull Run button not in the same column as the sandbox button');
      fldInjectMenuButton();   // idempotent
      var n=document.querySelectorAll('#fldBullRunBtn').length;
      if(n!==1) throw new Error('duplicate Bull Run buttons: '+n);
      return { injected:true, copies:n, hasAria: !!bb.getAttribute('aria-label') }; });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<60;i++){ if(await up(probe))break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'load', timeout:60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    // visual: 2D Bull Run mid-battle, after the first reinforcements (paused so RAF can't double-advance).
    const shot = await page.evaluate(`(function(){
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', autoBoth:true, seed:21});
      __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(3000, 0.05);   // ~150 sim-seconds: Jackson on Henry Hill, the lines engaged
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      var arrived=__FIELD.reinforce.filter(function(e){return e.done;}).length;
      return { simT: Math.round(__FIELD.t), arrived: arrived, units: __FIELD.units.length };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-bullrun.png') });
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
    // 3D LEAK GUARD: launch the 3D renderer, let THREE load, run all reinforcement waves (each triggers a
    // full fld3dBuildUnits rebuild) and assert GPU geometry count stays BOUNDED (disposal works), not cumulative.
    // Gracefully SKIPS when THREE is unavailable (offline CDN 404) so it never flakes the suite.
    const leak = await page.evaluate(`(function(){ return new Promise(function(resolve){
      try { fldLaunchSandbox({renderer:'3d', scenario:'bullrun1', seed:11}); } catch(e){ resolve({skipped:'launch:'+e}); return; }
      var tries=0, iv=setInterval(function(){ tries++;
        if(__FIELD.mode3d && __FIELD.renderer && __FIELD.renderer.info){
          clearInterval(iv);
          __FIELD.phase='battle'; __FIELD.paused=true;
          fldStepN(900,0.05); var g1=__FIELD.renderer.info.memory.geometries;
          fldStepN(5200,0.05); var g2=__FIELD.renderer.info.memory.geometries; var units=__FIELD.units.length;
          try{ fldExit(true); }catch(e){}
          resolve({mode3d:true, geomAfterWave1:g1, geomAfterAllWaves:g2, units:units, bounded: g2 < g1 + units*6 + 90});
        } else if(tries>45){ clearInterval(iv); try{fldExit(true);}catch(e){} resolve({skipped:'THREE unavailable (offline)'}); }
      },100);
    }); })()`);
    result.leak3d = leak;
    if (leak && leak.mode3d && !leak.bounded) {
      result.ok = false;
      (result.steps = result.steps || []).push({ name:'3D geometry BOUNDED across reinforcement waves (no GPU leak)', ok:false, err:'geometries grew unbounded: wave1='+leak.geomAfterWave1+' allWaves='+leak.geomAfterAllWaves+' units='+leak.units });
    } else if (leak && leak.mode3d) {
      (result.steps = result.steps || []).push({ name:'3D geometry BOUNDED across reinforcement waves (no GPU leak)', ok:true, v:leak });
    }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-bullrun.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-bullrun ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
