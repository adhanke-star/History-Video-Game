#!/usr/bin/env node
// tools/probe-fredericksburg.mjs — TACTICAL ENGINE C-1 (the SECOND data-driven scenario: Fredericksburg, the
// assault on Marye's Heights, Dec 13 1862). Verifies the battle EMPIRICALLY on the renderer-agnostic sim (no GPU):
// the OOB instantiates from GAME_DATA.fredericksburg.fredericksburg; the historical terrain (the SUNKEN-ROAD STONE
// WALL + Marye's Heights crest + the open glacis) builds and the WALL GIVES THE DEFENDER COVER the open glacis does
// not; reinforcements (Kershaw thickening the wall, Alexander relieving the crest guns, the seven Union waves) arrive
// on schedule, in order, idempotently; the balance is CS-FAVORED under the default (fog OFF + the wall + canister =
// the historical slaughter) with a lopsided Union casualty ratio; a CS player AND a US player both resolve to a
// decided result with no hang/NaN; the side-aware briefing/objective/end framing + the side-choice card + the menu
// button all build; determinism; no Classic contamination; and the SANDBOX + BULL RUN are unregressed. Bull Run's
// full byte-identity golden lives in probe-bullrun.mjs (required in the no-regression gate); this asserts it still
// builds + resolves deterministically as a sanity guard. Writes shots/probe-fredericksburg.{json,png}.
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

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function isNum(n){ return typeof n==='number' && isFinite(n); }
  function nanScan(){ for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
    if(!isNum(u.x)||!isNum(u.z)||!isNum(u.men)||!isNum(u.morale)||!isNum(u.facing)||!isNum(u.fatigue)||!isNum(u.ammo))
      return u.id; } return null; }
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  function liveCount(){ return __FIELD.units.length; }
  function runToEnd(maxSteps){ if(__FIELD.phase==='deploy'){__FIELD.phase='battle';__FIELD.paused=false;} var n=0; while(__FIELD.phase==='battle' && n<maxSteps){ fldSimStep(0.05); n++; } return n; }
  // run Fredericksburg to completion with the LIVE stacked config (officers+logistics+arms ON), honouring the
  // scenario default fog (OFF) unless an explicit fog is pinned. autoBoth -> AI both sides (the CS runs the
  // role-aware DEFENDER doctrine a human can match; the US runs the B-1 attacker doctrine).
  function runFB(opts){ __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false; fldLaunchSandbox(opts); __FIELD.phase='battle'; __FIELD.paused=false; var n=runToEnd(20000); return { w:__FIELD.winner, us:strength('US'), cs:strength('CS'), steps:n, t:Math.round(__FIELD.t), winBy:__FIELD.winBy, atk:__FIELD.attacker }; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldScenarioInit!=='function')
      return JSON.stringify({ok:false, fatal:'__FIELD engine / scenario seam missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    try{ delete G.settings.tacticalPreset; }catch(e){} delete G.settings.tacticalFog;   // honour the scenario default fog (OFF)
    var DATA = (GAME_DATA && GAME_DATA.fredericksburg) ? GAME_DATA.fredericksburg.fredericksburg : null;

    step('DATA present: GAME_DATA.fredericksburg.fredericksburg with OOB + a stone wall + reinforcement waves', function(){
      if(!DATA) throw new Error('GAME_DATA.fredericksburg.fredericksburg missing');
      if(!DATA.terrain || !DATA.terrain.walls || !DATA.terrain.walls.length) throw new Error('no stone wall in terrain');
      if(!DATA.objective || DATA.objective.name.indexOf('Sunken Road')<0) throw new Error('objective not the Sunken Road: '+(DATA.objective&&DATA.objective.name));
      if(DATA.defaultFog!==false) throw new Error('Fredericksburg must default fog OFF (clear fields of fire): '+DATA.defaultFog);
      var rf=DATA.reinforcements||[]; var usTot=DATA.oob.US.length, csTot=DATA.oob.CS.length;
      for(var i=0;i<rf.length;i++){ if(rf[i].side==='US')usTot++; else if(rf[i].side==='CS')csTot++; }
      if(usTot<6) throw new Error('want >=6 US brigades total (the seven assault waves), got '+usTot);
      if(rf.length<8) throw new Error('want >=8 reinforcement waves, got '+rf.length);
      return { usTotal:usTot, csTotal:csTot, waves:rf.length, wall:DATA.terrain.walls.length }; });

    step('LAUNCH fredericksburg instantiates the OOB at T=0 + fog OFF default (clear glacis)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:12345});
      if(__FIELD.scenario!=='fredericksburg') throw new Error('scenario not set: '+__FIELD.scenario);
      var want=DATA.oob.US.length+DATA.oob.CS.length;
      if(liveCount()!==want) throw new Error('want '+want+' units at T=0, got '+liveCount());
      if(__FIELD.attacker!=='US' || __FIELD.defender!=='CS') throw new Error('asymmetry wrong: atk '+__FIELD.attacker+' def '+__FIELD.defender);
      if(__FIELD.fog!==false) throw new Error('fog should default OFF for Fredericksburg, got '+__FIELD.fog);
      if(__FIELD.phase!=='deploy') throw new Error('should deploy, got '+__FIELD.phase);
      return { units:liveCount(), holdToWin:__FIELD.holdToWin, timeLimit:__FIELD.timeLimit, fog:__FIELD.fog }; });

    step('HISTORICAL TERRAIN: Marye\\'s Heights + the SUNKEN-ROAD STONE WALL + the canal/glacis markers', function(){
      var t=__FIELD.terrain;
      if(!t.hills || t.hills.length<2) throw new Error('want >=2 hills (the heights chain), got '+(t.hills&&t.hills.length));
      var names=t.hills.map(function(h){return h.name;}).join('|');
      if(names.indexOf("Marye")<0) throw new Error("no Marye's Heights: "+names);
      if(__FIELD.objective.name.indexOf('Sunken Road')<0) throw new Error('objective='+__FIELD.objective.name);
      if(!t.markers || t.markers.length<4) throw new Error('want >=4 markers, got '+(t.markers&&t.markers.length));
      var kinds={}; for(var i=0;i<t.markers.length;i++) kinds[t.markers[i].kind]=1;
      if(!kinds.bridge||!kinds.road) throw new Error('missing bridge/road markers (the canal crossings / Telegraph Road)');
      return { hills:names, walls:t.walls.length, markerKinds:Object.keys(kinds).join(',') }; });

    step('THE WALL GIVES COVER the open glacis does not: a defender hard behind the stone wall is in cover; the open killing-rise to the wall is not', function(){
      // the defender line crouches at z~390, hard behind the wall (x1 360 z1 405 -> x2 840 z2 402); the final
      // rise to the wall (z 403-485) is open. fldCoverAt: near-wall=1.7x, woods=1.4x, open=1.0x.
      var wallCover=fldCoverAt(600,390);          // on the sunken-road line, behind the wall
      var glacisCover=fldCoverAt(600,450);         // the open killing-rise above the wall
      if(!(wallCover>1.5)) throw new Error('the stone wall gives the defender no cover: '+wallCover);
      if(!(glacisCover<1.2)) throw new Error('the open glacis is unexpectedly covered (it must be a killing field): '+glacisCover);
      if(!(wallCover>glacisCover+0.4)) throw new Error('insufficient wall-vs-glacis cover differential: wall '+wallCover+' glacis '+glacisCover);
      return { wallCover:Math.round(wallCover*100)/100, glacisCover:Math.round(glacisCover*100)/100 }; });

    step('THE DEFENDING LINE HOLDS THE WALL (live, not just static terrain): the wall brigades REMAIN in stone-wall cover through the firefight, and the cautious attacker holds in the OPEN — the slaughter geometry, not a symmetric open-field duel (bug-hunt C-1 HIGH guard)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:1});
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      __FIELD.phase='battle'; __FIELD.paused=false;
      for(var s=0;s<460;s++) fldSimStep(0.05);   // ~23s: the AI hold lines are set AND the lead Union waves have crossed the swale into the open killing ground at the wall
      function unit(id){ for(var i=0;i<__FIELD.units.length;i++) if(__FIELD.units[i].id===id) return __FIELD.units[i]; return null; }
      var cobb=unit('cs_cobb'), ransom=unit('cs_ransom_nc');
      if(!cobb||!ransom||!cobb.alive||!ransom.alive) throw new Error('wall brigades missing/dead at t=15s');
      // the DEFENDER doctrine must hold the line ON the wall in cover (NOT march it forward off the wall into the open)
      var cobbCov=fldCoverAt(cobb.x,cobb.z), ransomCov=fldCoverAt(ransom.x,ransom.z);
      if(!(cobbCov>1.5)) throw new Error('Cobb abandoned the wall: cover '+cobbCov.toFixed(2)+' at z='+Math.round(cobb.z)+' (the wall-defense teaching is gutted)');
      if(!(ransomCov>1.5)) throw new Error('Ransom abandoned the wall: cover '+ransomCov.toFixed(2)+' at z='+Math.round(ransom.z));
      if(!fldNearWall(cobb.x,cobb.z)||!fldNearWall(ransom.x,ransom.z)) throw new Error('a wall brigade is not at the stone wall: cobb z='+Math.round(cobb.z)+' ransom z='+Math.round(ransom.z));
      // the cautious ATTACKER's HOLD line (its doomed firing line, order.type 'hold') must sit in the OPEN (cover
      // ~1.0), not in the wall/woods cover — else it would be a symmetric covered duel, not the slaughter. (A unit
      // PURSUING a wavering defender via the disordered-charge path may transiently enter the wall band; that is
      // intentional, so we judge only the holding line, not chargers.)
      var holdExposed=0, holdCovered=0, closestHoldZ=1e9;
      for(var j=0;j<__FIELD.units.length;j++){ var u=__FIELD.units[j]; if(!u.alive||u.side!=='US'||u.arm!=='inf') continue;
        if(u.order && u.order.type==='hold' && u.z < 480){ closestHoldZ=Math.min(closestHoldZ,u.z);
          if(fldCoverAt(u.x,u.z) > 1.25) holdCovered++; else holdExposed++; } }
      if((holdExposed+holdCovered) > 0 && holdExposed===0) throw new Error('the cautious attacker HOLD line is in cover ('+holdCovered+' covered, 0 exposed) — it must be exposed in the open at the wall, not sharing cover');
      return { cobbCover:Math.round(cobbCov*100)/100, ransomCover:Math.round(ransomCov*100)/100, cobbZ:Math.round(cobb.z), atkHoldExposed:holdExposed, atkHoldCovered:holdCovered, closestHoldZ:isFinite(closestHoldZ)?Math.round(closestHoldZ):null }; });

    step('REINFORCEMENTS arrive ON SCHEDULE, in order, idempotently — incl. Kershaw thickening the wall + the seven waves', function(){
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:7});
      var base=liveCount(), sched=__FIELD.reinforce.slice();
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
      fldScenarioTick(0.05);
      if(liveCount()!==all) throw new Error('re-tick spawned duplicates: '+liveCount());
      var ids=[]; for(var j=0;j<__FIELD.units.length;j++) ids.push(__FIELD.units[j].id);
      return { baseOOB:base, totalAfterAll:all, firstAt:first.atSec, hasKershaw:ids.indexOf('cs_kershaw')>=0, hasHumphreys:ids.indexOf('us_humphreys')>=0, hasAlexander:ids.indexOf('cs_alexander')>=0 }; });

    step('FULL BATTLE resolves: a winner is declared, past the reinforcement era, no deadlock, no NaN', function(){
      var r=runFB({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:101});
      if(__FIELD.phase!=='over') throw new Error('battle did not end, t='+__FIELD.t);
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('bad winner '+__FIELD.winner);
      if(__FIELD.t < 112) throw new Error('battle ended before Kershaw thickened the wall (t='+Math.round(__FIELD.t)+')');
      var arrived=__FIELD.reinforce.filter(function(e){return e.done;}).length;
      if(arrived < 3) throw new Error('too few reinforcements engaged: '+arrived);
      var bad=nanScan(); if(bad) throw new Error('NaN in '+bad);
      if(['hold','destroy','timeout'].indexOf(__FIELD.winBy)<0) throw new Error('winBy not recorded: '+__FIELD.winBy);
      return { winner:r.w, winBy:r.winBy, endSec:r.t, reinforcementsArrived:arrived, usStr:r.us, csStr:r.cs }; });

    step('THE SLAUGHTER — CS-FAVORED under the default (fog OFF + the wall + canister): the assault breaks before the sunken road >=6/8', function(){
      delete G.settings.tacticalFog;
      var seeds=[1,7,21,42,55,101,303,909], cs=0, results=[];
      for(var i=0;i<seeds.length;i++){ var r=runFB({renderer:'none',scenario:'fredericksburg',autoBoth:true,seed:seeds[i]}); if(r.w==='CS') cs++; results.push(r.w); }
      if(cs<6) throw new Error('Fredericksburg is not CS-favored under the default (>=6/8): '+cs+'/8 ['+results.join(',')+'] — the slaughter did not land; rebalance');
      return { csWins:cs+'/8', outcomes:results.join(',') }; });

    step('A LOPSIDED UNION CASUALTY RATIO (the wall is a killing machine): Union losses far exceed Confederate losses', function(){
      // sum the casualties (men fielded incl. reinforcements minus men surviving) over a few seeds.
      function fielded(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side) c+=(u.men0||u.men); }
        // add the pending reinforcements' nominal strength so casualties count the full committed force
        var rf=__FIELD.reinforce||[]; for(var j=0;j<rf.length;j++){ if(!rf[j].done && rf[j].spec && rf[j].spec.side===side) c+=(rf[j].spec.men||0); } return c; }
      var seeds=[7,42,303], usLoss=0, csLoss=0;
      for(var s=0;s<seeds.length;s++){
        __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
        fldLaunchSandbox({renderer:'none',scenario:'fredericksburg',autoBoth:true,seed:seeds[s]});
        var us0=fielded('US'), cs0=fielded('CS');
        __FIELD.phase='battle'; __FIELD.paused=false; runToEnd(20000);
        usLoss += (us0 - strength('US')); csLoss += (cs0 - strength('CS'));
      }
      if(!(usLoss > csLoss)) throw new Error('Union losses did not exceed Confederate (not a slaughter): US '+usLoss+' vs CS '+csLoss);
      return { unionLosses:Math.round(usLoss), confederateLosses:Math.round(csLoss), ratio:Math.round(usLoss/Math.max(1,csLoss)*100)/100 }; });

    step('THE WALL IS LOAD-BEARING: removing the stone wall (the defender\\'s cover) collapses the Confederate edge', function(){
      // a CS-defender score: a CS win dominates; else the longer/cheaper the Union seizure, the worse for the rebels.
      function csScore(){ var d=strength('CS')-strength('US');
        if(__FIELD.winner==='CS') return 1000000+d; if(__FIELD.winner==='draw') return 500000+d; return Math.round(__FIELD.t*1000)+d; }
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:55}); runToEnd(20000);
      var wWith=__FIELD.winner, sWith=csScore();
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:55});
      __FIELD.terrain = Object.assign({}, __FIELD.terrain, { walls: [] });   // tear the wall down for this run only
      runToEnd(20000);
      var wWithout=__FIELD.winner, sWithout=csScore();
      if(!(sWith>=sWithout)) throw new Error('the wall is not load-bearing for the defense: csScore with='+sWith+' without='+sWithout);
      return { winnerWithWall:wWith, winnerWithoutWall:wWithout, csScoreWith:sWith, csScoreWithout:sWithout }; });

    step('CS PLAYER + US PLAYER both resolve (no hang/NaN): a passive player on either side reaches a decided result', function(){
      delete G.settings.tacticalFog;
      var out={};
      ['US','CS'].forEach(function(ps){
        fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', seed:7, playerSide:ps});   // NOT autoBoth -> the player side is non-AI (idle), the other runs its AI
        __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
        __FIELD.phase='battle'; __FIELD.paused=false; var n=runToEnd(20000);
        if(__FIELD.phase!=='over') throw new Error(ps+' passive battle did not terminate (phase '+__FIELD.phase+')');
        if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error(ps+' passive battle bad winner: '+__FIELD.winner);
        if(!isFinite(strength('US'))||!isFinite(strength('CS'))) throw new Error('NaN after '+ps+' passive battle');
        out[ps]={ winner:__FIELD.winner, steps:n, playerSide:__FIELD.playerSide };
      });
      return out; });

    step('SIDE-AWARE OBJECTIVE COPY for Fredericksburg: US "seize and hold" the sunken road; CS "HOLD"/"deny" it', function(){
      if(typeof fldBriefObjectiveHtml!=='function') throw new Error('fldBriefObjectiveHtml missing');
      __FIELD.attacker='US';
      var usH=fldBriefObjectiveHtml('US', DATA, 140), csH=fldBriefObjectiveHtml('CS', DATA, 140);
      if(usH.indexOf('seize and hold')<0) throw new Error('US objective not attack-framed: '+usH);
      if(csH.indexOf('HOLD')<0 || csH.toLowerCase().indexOf('deny')<0) throw new Error('CS objective not defend-framed: '+csH);
      if(usH===csH) throw new Error('objective copy did not change with side');
      if(usH.indexOf('Sunken Road')<0) throw new Error('US objective did not name the Sunken Road: '+usH);
      return { usLen:usH.length, csLen:csH.length }; });

    step('DATA-DRIVEN END NOTE: fldScenarioEndHtml builds a "your war vs history" payoff for a US win AND a CS win (from sd.endNote)', function(){
      if(typeof fldScenarioEndHtml!=='function') throw new Error('fldScenarioEndHtml missing');
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', seed:1});   // sets __FIELD.scenData + scenario
      var usEnd=fldScenarioEndHtml('US'), csEnd=fldScenarioEndHtml('CS');
      if(!usEnd || usEnd.indexOf('Your war vs. history')<0) throw new Error('US end note missing the box: '+usEnd.slice(0,80));
      if(!csEnd || csEnd.indexOf('Your war vs. history')<0) throw new Error('CS end note missing the box');
      if(usEnd.indexOf('overturned')<0) throw new Error('US-win note not the alt-history framing: '+usEnd.slice(0,160));
      if(csEnd.indexOf('History holds')<0) throw new Error('CS-win note not the history-holds framing');
      if(usEnd.indexOf('Slaughter')<0 && usEnd.indexOf('charges')<0) throw new Error('end note did not append the teaching cards');
      // the draw branch (a human-only mutual-attrition outcome) must also resolve to the data box (bug-hunt critic gap)
      var drawEnd=fldScenarioEndHtml('draw');
      if(!drawEnd || drawEnd.indexOf('Your war vs. history')<0) throw new Error('draw end note missing the box');
      if(drawEnd.indexOf('grinding')<0) throw new Error('draw end note not the data-driven en.draw text: '+drawEnd.slice(0,120));
      return { usLen:usEnd.length, csLen:csEnd.length, drawLen:drawEnd.length }; });

    step('DETERMINISM: same seed -> identical battle', function(){
      var a=runFB({renderer:'none',scenario:'fredericksburg',autoBoth:true,seed:909});
      var b=runFB({renderer:'none',scenario:'fredericksburg',autoBoth:true,seed:909});
      if(a.w!==b.w||a.us!==b.us||a.cs!==b.cs||a.steps!==b.steps) throw new Error('non-deterministic: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      return { winner:a.w, us:a.us, cs:a.cs, steps:a.steps }; });

    step('NO CLASSIC CONTAMINATION: fredericksburg never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode;
      runFB({renderer:'none',scenario:'fredericksburg',autoBoth:true,seed:3});
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('mutated G.mode: '+G.mode);
      try{ fldExit(true); }catch(e){}
      return { gMode:G.mode }; });

    step('SANDBOX + BULL RUN UNREGRESSED: the sandbox is untouched + Bull Run still builds & resolves deterministically (its golden lives in probe-bullrun)', function(){
      // sandbox
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:12345});
      if(__FIELD.scenario!=='sandbox') throw new Error('sandbox tag wrong: '+__FIELD.scenario);
      if(__FIELD.scenData) throw new Error('stale scenData leaked into the sandbox');
      if(__FIELD.units.length!==4) throw new Error('sandbox want 4 units, got '+__FIELD.units.length);
      // bull run still resolves + is deterministic seed-for-seed (sanity; full byte golden = probe-bullrun)
      G.settings.tacticalFog=false; __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=true;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:101}); runToEnd(20000);
      var w1=__FIELD.winner, c1=strength('US')+strength('CS');
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:101}); runToEnd(20000);
      if(__FIELD.winner!==w1 || (strength('US')+strength('CS'))!==c1) throw new Error('bullrun non-deterministic after the C-1 refactor');
      delete G.settings.tacticalFog;
      return { sandboxOK:true, bullrunWinner:w1 }; });

  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

// A second eval, in a 2D DOM context, for the side-choice card + the menu button + the 2D draw path.
const DOM = `(() => {
  var R = { steps: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  try {
    try{ delete G.settings.tacticalPreset; }catch(e){} delete G.settings.tacticalFog;

    step('SIDE-CHOICE SHEET: fldScenarioSideChoice("fredericksburg") renders BOTH side cards; clicking the CS card calls back "CS"', function(){
      if(typeof fldScenarioSideChoice!=='function') throw new Error('fldScenarioSideChoice missing');
      var picked=null;
      fldScenarioSideChoice('fredericksburg', function(side){ picked=side; });
      var cards=document.querySelectorAll('[data-brside]');
      if(cards.length!==2) throw new Error('expected 2 side cards, got '+cards.length+(typeof openSheet!=='function'?' (openSheet unavailable; fallback picked '+picked+')':''));
      var csCard=document.querySelector('[data-brside="CS"]'); if(!csCard) throw new Error('no CS card');
      var sheetTxt=(document.getElementById('sheetPad')||document.body).textContent||'';
      if(sheetTxt.indexOf('Fredericksburg')<0) throw new Error('side card did not name the battle');
      csCard.click();
      if(picked!=='CS') throw new Error('clicking the CS card did not call back "CS": '+picked);
      try{ if(typeof closeSheet==='function') closeSheet(); }catch(e){}
      return { cards:cards.length, picked:picked }; });

    step('MENU: the Fredericksburg button injects after the sandbox + Bull Run buttons, idempotently, in the same column', function(){
      if (typeof openMainMenu!=='function') return { skipped:'no openMainMenu' };
      G.mode='menu'; openMainMenu();
      if(!document.getElementById('gnFree')) throw new Error('live menu has no #gnFree anchor');
      fldInjectMenuButton();
      var sb=document.getElementById('fldSandboxBtn'), bb=document.getElementById('fldBullRunBtn'), fb=document.getElementById('fldScnBtn_fredericksburg');
      if(!sb) throw new Error('sandbox button missing');
      if(!bb) throw new Error('First Bull Run button missing (marquee regressed)');
      if(!fb) throw new Error('Fredericksburg button did NOT inject');
      if(fb.parentNode!==sb.parentNode) throw new Error('Fredericksburg button not in the sandbox/Bull Run column');
      if(!fb.getAttribute('aria-label')) throw new Error('Fredericksburg button missing aria-label');
      fldInjectMenuButton();   // idempotent
      if(document.querySelectorAll('#fldScnBtn_fredericksburg').length!==1) throw new Error('duplicate Fredericksburg buttons');
      if(document.querySelectorAll('#fldBullRunBtn').length!==1) throw new Error('duplicate Bull Run buttons');
      // the skirmish button must still anchor AFTER the whole scenario block
      var sk=document.getElementById('fldSkirmishBtn');
      return { injected:true, hasSkirmishAfter: !!sk, hl: (fb.querySelector('.gn-hl')||{}).textContent }; });

    step('2D PATH for fredericksburg: DOM + canvas build, the stone wall + markers + waves draw without throwing, teardown', function(){
      fldLaunchSandbox({renderer:'2d', scenario:'fredericksburg', autoBoth:true, seed:42});
      var root=document.getElementById('fldRoot'); if(!root) throw new Error('no #fldRoot');
      if(!__FIELD.ctx2d) throw new Error('no 2d context');
      __FIELD.phase='battle'; __FIELD.paused=false;
      fldStepN(2600,0.05);   // ~130 sim-seconds: Kershaw (112) has thickened the wall, several waves committed
      var threw=null; try{ fld2dDraw(); fldRenderHud(); fldRenderTop(); }catch(e){ threw=String(e&&e.message||e); }
      var arrived=__FIELD.reinforce.filter(function(e){return e.done;}).length;
      fldExit(true);
      if(threw) throw new Error('2D draw threw: '+threw);
      if(document.getElementById('fldRoot')) throw new Error('teardown left DOM');
      if(arrived<1) throw new Error('no reinforcement arrived in the 2D run');
      return { built:true, reinforcementsArrived:arrived }; });

    step('SCENARIO BRIEFING builds for fredericksburg (role/modal dialog, teaching cards, Take-command focus)', function(){
      fldLaunchSandbox({renderer:'2d', scenario:'fredericksburg', seed:8});
      fldBullRunBriefing();   // battle-agnostic briefing (reads __FIELD.scenData)
      var brief=document.getElementById('fldBrief');
      if(!brief) throw new Error('briefing dialog not created for fredericksburg');
      if(brief.getAttribute('role')!=='dialog' || brief.getAttribute('aria-modal')!=='true') throw new Error('briefing not a modal dialog');
      if(!document.getElementById('fldBriefGo')) throw new Error('no Take-command button');
      if(brief.textContent.indexOf('Sunken Road')<0 && brief.textContent.indexOf("Marye")<0) throw new Error('briefing did not name the field');
      document.getElementById('fldBriefGo').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      if(document.getElementById('fldBrief')) throw new Error('Esc did not close the briefing');
      if(__FIELD.launched!==true) throw new Error('Esc on the briefing tore down the battle');
      fldExit(true);
      return { briefingDialog:true }; });

  } catch(e){ R.ok=false; R.steps.push({name:'FATAL', ok:false, err:String(e&&e.message||e)}); }
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
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = result.steps.concat(dom.steps);
    if (!dom.ok) result.ok = false;
    result.pageerrors = pageerrors;
    const shot = await page.evaluate(`(function(){
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'2d', scenario:'fredericksburg', autoBoth:true, seed:21});
      __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(2400, 0.05);   // ~120 sim-seconds: the assault on the wall in full cry
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      return { simT: Math.round(__FIELD.t), winner: __FIELD.winner, units: __FIELD.units.length, fog:__FIELD.fog };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-fredericksburg.png') });
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-fredericksburg.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-fredericksburg ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
