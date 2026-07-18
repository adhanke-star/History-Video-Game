#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-field.mjs — TACTICAL ENGINE P0 (the sandbox skirmish). Verifies the full core loop
// EMPIRICALLY on the renderer-agnostic sim (no GPU needed → no swiftshader flake): deploy →
// maneuver → fire → casualties → morale/rout → a declared winner; determinism under a fixed seed;
// no NaN; victory-by-collapse; the objective hold accrues; re-launch is clean; and the 2D fallback
// DOM/render path builds + draws + tears down. Then a 2D screenshot for the eye.
// Writes shots/probe-field.json + shots/probe-field.png.
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
  function runToEnd(maxSteps){ var n=0; while(__FIELD.phase==='battle' && n<maxSteps){ fldSimStep(0.05); n++; } return n; }
  function casTotal(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side) c+=(u.maxMen-u.men); } return Math.round(c); }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldSimStep!=='function')
      return JSON.stringify({ok:false, fatal:'__FIELD engine missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=true;   // B-2/B-3/B-4: lock the PRE-officer/PRE-logistics/PRE-arms sim core BYTE-IDENTICAL (each layer has its own probe)

    step('launch (headless) deploys ~2 brigades/side: 4 units, 2 US + 2 CS', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:12345});
      var us=0, cs=0; for(var i=0;i<__FIELD.units.length;i++){ if(__FIELD.units[i].side==='US')us++; else cs++; }
      if(__FIELD.units.length!==4) throw new Error('want 4 units, got '+__FIELD.units.length);
      if(us!==2||cs!==2) throw new Error('want 2/side, got US='+us+' CS='+cs);
      if(__FIELD.phase!=='deploy') throw new Error('should start in deploy, got '+__FIELD.phase);
      return { units:__FIELD.units.length, us:us, cs:cs, phase:__FIELD.phase }; });

    step('GEA-03 (D435): camera-recovery commands exist, route from fldKey, and are inert no-ops outside 3D', function(){
      if(typeof fldCamHome!=='function'||typeof fldCamFrameSelected!=='function') throw new Error('GEA-03 camera functions missing');
      var src=String(fldKey);
      if(src.indexOf('"Home"')<0) throw new Error('fldKey does not route the Home key');
      if(src.indexOf('fldCamFrameSelected')<0||src.indexOf('shiftKey')<0) throw new Error('fldKey does not route Shift+Home to frame-selected');
      if(src.indexOf('fldCamHome')<0) throw new Error('fldKey does not route Home to the overview reset');
      // headless launch has no 3D camera: both commands must be guarded, throw-free, sim-pure no-ops
      var snap=JSON.stringify(__FIELD.units.map(function(u){return {id:u.id,x:u.x,z:u.z,men:u.men,morale:u.morale,sel:__FIELD.sel.slice()};}));
      fldCamHome(); fldCamFrameSelected();
      __FIELD.sel=[__FIELD.units[0].id]; fldCamFrameSelected(); __FIELD.sel=[];
      var snap2=JSON.stringify(__FIELD.units.map(function(u){return {id:u.id,x:u.x,z:u.z,men:u.men,morale:u.morale,sel:__FIELD.sel.slice()};}));
      if(snap!==snap2) throw new Error('camera commands mutated simulation state (must be pure)');
      // frame-selected reads the SELECTED unit and the survey fallback: both paths side-aware via fldPlayerSide
      var fs=String(fldCamFrameSelected);
      if(fs.indexOf('fldPlayerSide')<0) throw new Error('frame-selected must stay side-aware');
      if(fs.indexOf('fldCamHome')<0) throw new Error('frame-selected must fall back to the overview when nothing is selected');
      return { ok:true }; });

    step('MANEUVER: stepping advances the sim and units move from their start', function(){
      var start=__FIELD.units.map(function(u){return {id:u.id,x:u.x,z:u.z};});
      fldStepN(120, 0.05);  // 6 sim-seconds; flips deploy->battle
      if(__FIELD.t<=0) throw new Error('sim time did not advance: '+__FIELD.t);
      var moved=0, maxMove=0;
      for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i], s=start[i];
        var d=Math.hypot(u.x-s.x,u.z-s.z); if(d>5) moved++; if(d>maxMove)maxMove=d; }
      if(moved<1) throw new Error('no unit maneuvered (AI advance broken)');
      return { simTime:Math.round(__FIELD.t*10)/10, unitsMoved:moved, maxMove:Math.round(maxMove) }; });

    step('FIRE: both sides take casualties as the firefight develops', function(){
      runToEnd(12000);  // resolve the fight (>TIME_LIMIT/FIXED_DT so it always reaches a verdict)
      var cU=casTotal('US'), cC=casTotal('CS');
      if(cU<=0) throw new Error('Union took no casualties: '+cU);
      if(cC<=0) throw new Error('Confederate took no casualties: '+cC);
      return { casUnion:cU, casConfederate:cC }; });

    step('MORALE/ROUT: at least one brigade broke and routed during the battle', function(){
      if(!(__FIELD.routEverCount>=1)) throw new Error('no unit ever routed (morale/rout system inert): '+__FIELD.routEverCount);
      return { routEvents:__FIELD.routEverCount }; });

    step('WIN: a winner is declared and the battle ends (no deadlock)', function(){
      if(__FIELD.phase!=='over') throw new Error('battle did not end, phase='+__FIELD.phase+' t='+__FIELD.t);
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('bad winner: '+__FIELD.winner);
      return { winner:__FIELD.winner, endTime:Math.round(__FIELD.t) }; });

    step('NO NaN anywhere in the unit state after a full battle', function(){
      var bad=nanScan(); if(bad) throw new Error('NaN in unit '+bad); return { clean:true }; });

    step('DETERMINISM: same seed -> same winner + same casualties', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:777}); fldStepN(20,0.05); runToEnd(12000);
      var w1=__FIELD.winner, c1=casTotal('US')+casTotal('CS');
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:777}); fldStepN(20,0.05); runToEnd(12000);
      var w2=__FIELD.winner, c2=casTotal('US')+casTotal('CS');
      if(w1!==w2) throw new Error('non-deterministic winner: '+w1+' vs '+w2);
      if(c1!==c2) throw new Error('non-deterministic casualties: '+c1+' vs '+c2);
      return { winner:w1, totalCas:c1 }; });

    step('VICTORY-BY-COLLAPSE: destroy one army -> the other wins immediately', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:5});
      __FIELD.phase='battle'; __FIELD.paused=false;
      for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side==='CS'){ u.alive=false; u.men=0; u.state='destroyed'; } }
      fldSimStep(0.05);
      if(__FIELD.winner!=='US') throw new Error('US should win when CS is wiped, got '+__FIELD.winner);
      return { winner:__FIELD.winner }; });

    step('OBJECTIVE: holding the crest unopposed accrues hold-time toward the win', function(){
      fldLaunchSandbox({renderer:'none', seed:9});  // not autoBoth: US is player, CS we will remove
      __FIELD.phase='battle'; __FIELD.paused=false;
      // remove CS so US can sit on the objective uncontested
      for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side==='CS'){ u.alive=false; u.men=0; u.state='destroyed'; } }
      // place a US brigade on the objective and keep it there
      var o=__FIELD.objective, us=null;
      for(var j=0;j<__FIELD.units.length;j++){ if(__FIELD.units[j].side==='US'){ us=__FIELD.units[j]; break; } }
      us.x=o.x; us.z=o.z; us.order={type:'hold',tx:o.x,tz:o.z,tface:0};
      // step a couple seconds BEFORE collapse-victory ends it (collapse fires first here, so test objective directly)
      var before=__FIELD.holdSecs.US;
      // call objective step directly to isolate the mechanic from the collapse check
      for(var k=0;k<40;k++) fldObjectiveStep(0.05);
      if(!(__FIELD.holdSecs.US>before)) throw new Error('objective hold did not accrue: '+__FIELD.holdSecs.US);
      return { holdSecs:Math.round(__FIELD.holdSecs.US*10)/10 }; });

    step('E48 (D252): a position FALLING at the buzzer plays out its fall (overtime -> hold win, bounded); a contested or unattended objective still times out to the defender AT the clock', function(){
      function launchAsym(seed){
        fldLaunchSandbox({renderer:'none', autoBoth:true, seed:seed, skirmish:{ playerSide:'US', attacker:'US', year:1862,
          countPlayer:2, countEnemy:2, menPlayer:1500, menEnemy:1500, weaponPlayer:'rifled', weaponEnemy:'rifled', terrain:'open', holdToWin:40 }});
        __FIELD.phase='battle'; __FIELD.paused=false;
        var o=__FIELD.objective, i, u;
        for(i=0;i<__FIELD.units.length;i++){ u=__FIELD.units[i]; u.ai=false; u.x=60; u.z=60; u.order={type:'hold',tx:60,tz:60,tface:0}; }
        return o;
      }
      function put(side, x, z){ for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
        if(u.side===side){ u.x=x; u.z=z; u.order={type:'hold',tx:x,tz:z,tface:0}; return u; } } return null; }
      function run(maxSteps){ var n=0; while(__FIELD.phase==='battle' && n<maxSteps){ fldSimStep(0.05); n++; } return n; }
      // (a) MID-HOLD AT THE BUZZER: the US attacker alone on the objective, hold clock 10/40 at the clock.
      // The pre-E48 rule ended this w=CS by=timeout the tick t crossed the limit; E48 plays the fall out.
      var o=launchAsym(11); put('US', o.x, o.z);
      __FIELD.t=__FIELD.timeLimit-1; __FIELD.holdSecs.US=10;
      run(4000);
      if(__FIELD.winner!=='US' || __FIELD.winBy!=='hold') throw new Error('(a) mid-hold at the buzzer must complete the fall: w='+__FIELD.winner+' by='+__FIELD.winBy);
      if(!(__FIELD.t>__FIELD.timeLimit)) throw new Error('(a) the hold win should land PAST the clock (overtime), t='+__FIELD.t);
      var ot=__FIELD.t-__FIELD.timeLimit;
      if(!(ot<=__FIELD.holdToWin+1)) throw new Error('(a) overtime must be bounded by holdToWin: '+ot);
      // (b) CONTESTED at the buzzer: a steady CS unit also stands in the radius -> the hold clock is NOT
      // accruing -> the containment fires AT the clock exactly as before E48.
      o=launchAsym(12); put('US', o.x, o.z); put('CS', o.x+10, o.z);
      __FIELD.t=__FIELD.timeLimit-1; __FIELD.holdSecs.US=10;
      run(400);
      if(__FIELD.winner!=='CS' || __FIELD.winBy!=='timeout') throw new Error('(b) a contested objective must still time out to the defender: w='+__FIELD.winner+' by='+__FIELD.winBy);
      if(!(__FIELD.t<=__FIELD.timeLimit+2)) throw new Error('(b) the contested timeout must fire AT the clock, t='+__FIELD.t);
      // (c) UNATTENDED objective at the buzzer (attacker not on it): byte-identical pre-E48 behavior.
      o=launchAsym(13);
      __FIELD.t=__FIELD.timeLimit-1;
      run(400);
      if(__FIELD.winner!=='CS' || __FIELD.winBy!=='timeout') throw new Error('(c) an unattended objective must time out to the defender: w='+__FIELD.winner+' by='+__FIELD.winBy);
      if(!(__FIELD.t<=__FIELD.timeLimit+2)) throw new Error('(c) the timeout must fire AT the clock, t='+__FIELD.t);
      return { overtimeSecs:Math.round(ot*10)/10, holdToWin:__FIELD.holdToWin, contestedEndsAtClock:true, unattendedEndsAtClock:true }; });

    // ==== E49 fixtures — E49a (D258) SL-2 surrender + SL-4 ledgers, E49b (D260) SL-1v2
    // first-break-only straggler-shedding (design law docs/design/e49-surrender-straggler-design.md
    // §3.2 + §5.4; the two D258 protective teeth re-targeted in the SAME commit as the landing —
    // never deleted). Shared asymmetric launcher: a 3v3 open-field skirmish (attacker US -> both
    // mechanics ARMED), every unit parked out of contact.
    function e49Launch(seed){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:seed, skirmish:{ playerSide:'US', attacker:'US', year:1862,
        countPlayer:3, countEnemy:3, menPlayer:1500, menEnemy:1500, weaponPlayer:'rifled', weaponEnemy:'rifled', terrain:'open', holdToWin:40 }});
      __FIELD.phase='battle'; __FIELD.paused=false;
      var us=[], cs=[];
      for(var i=0;i<__FIELD.units.length;i++){ var q=__FIELD.units[i]; q.ai=false; (q.side==='US'?us:cs).push(q); }
      function park(q,x,z){ q.x=x; q.z=z; q.order={type:'hold',tx:x,tz:z,tface:0}; }
      // default parking: everyone far from everyone (no combat, no blockers, no rally danger)
      park(us[0],1140,60); park(us[1],1100,60); park(us[2],1060,60);
      park(cs[0],60,860);  park(cs[1],100,860); park(cs[2],140,860);
      return { us:us, cs:cs, park:park };
    }

    step('E49b SL-1v2 FIRST-BREAK EXACT: a forced rout event sheds round(men PRESENT x 0.05) — 600/1000 -> men 570, missing 30 (the refuted maxMen form would read 550/50); sticky shedDone set', function(){
      var F=e49Launch(31), u=F.us[0];
      u.men=600; u.maxMen=1000; u.xp=1;   // men != maxMen LOAD-BEARING: the shed must anchor on the men PRESENT (§5.2 answer 1)
      if(u.shedDone!==false) throw new Error('shedDone not spawn-initialized false: '+u.shedDone);
      u.state='steady'; u.morale=0; u.rallyT=0;
      var n=0;
      while(u.state!=='routing' && n<400){ u.morale=0; fldMoraleStep(u,0.05); n++; }
      if(u.state!=='routing') throw new Error('the forced break never fired after '+n+' ticks');
      if(u.men!==570) throw new Error('first break must shed round(600x0.05)=30 of men PRESENT: men '+u.men+' != 570 (550 would be the refuted maxMen-anchored form)');
      if(__FIELD.missing.US!==30) throw new Error('missing.US '+__FIELD.missing.US+' != 30');
      if(__FIELD.missing.CS!==0) throw new Error('missing.CS fed without a CS break: '+__FIELD.missing.CS);
      if(u.shedDone!==true) throw new Error('shedDone not set by the first break');
      if(__FIELD.routEverCount<1) throw new Error('routEverCount '+__FIELD.routEverCount+' < 1');
      return { menAfterBreak:u.men, missingUS:__FIELD.missing.US, shedDone:u.shedDone }; });

    step('E49b anti-compounding + 5-break guard: break -> shed 50 -> rally restores NO men -> 4 more break/rally cycles shed ZERO (missing stays EXACTLY 50 through routEverCount 5; the dead per-event form read 227)', function(){
      var F=e49Launch(34), u=F.us[0];
      u.men=1000; u.maxMen=1000; u.xp=1;
      function forceBreak(){ var n=0; u.rallyT=0; while(u.state!=='routing' && n<500){ u.morale=0; fldMoraleStep(u,0.05); n++; } if(u.state!=='routing') throw new Error('a forced break never fired'); }
      function forceRally(){ var n=0; while(u.state==='routing' && n<500){ fldMoraleStep(u,0.05); n++; } if(u.state==='routing') throw new Error('the rally never fired'); }
      forceBreak();
      if(u.men!==950 || __FIELD.missing.US!==50) throw new Error('first break: men '+u.men+' missing '+__FIELD.missing.US+' (want 950/50)');
      forceRally();
      if(u.men!==950) throw new Error('rally changed men: '+u.men+' != 950 (rally must NEVER restore men — §5.1)');
      forceBreak();
      if(__FIELD.routEverCount!==2) throw new Error('non-vacuity: second break did not fire, routEverCount='+__FIELD.routEverCount);
      if(u.men!==950 || __FIELD.missing.US!==50) throw new Error('the RE-BREAK shed: men '+u.men+' missing '+__FIELD.missing.US+' (a re-break must shed ZERO)');
      forceRally(); forceBreak(); forceRally(); forceBreak(); forceRally(); forceBreak();
      if(__FIELD.routEverCount!==5) throw new Error('need exactly 5 break events, routEverCount='+__FIELD.routEverCount);
      if(u.men!==950) throw new Error('re-breaks shed men: '+u.men+' != 950');
      if(__FIELD.missing.US!==50) throw new Error('missing after 5 breaks '+__FIELD.missing.US+' != EXACTLY 50 (227 = the dead D256 per-event form)');
      return { breaks:__FIELD.routEverCount, men:u.men, missing:__FIELD.missing.US }; });

    step('E49b identity + symmetry: shed->rally, shed->kill, shed->surrender (captured banks the POST-shed 950) each keep fielded = survivors + kw + captured + missing EXACT; US and CS both shed in ONE asymmetric launch', function(){
      var F=e49Launch(35), a=F.us[0], b=F.us[1], r=F.cs[0], i, q;
      function bk(q){ var n=0; q.rallyT=0; q.state='steady'; while(q.state!=='routing' && n<500){ q.morale=0; fldMoraleStep(q,0.05); n++; } if(q.state!=='routing') throw new Error('a forced break never fired'); }
      // (a) shed->rally: 1000 men break (shed 50), rally with 950 — the missing men never return
      a.men=1000; a.maxMen=1000; bk(a);
      var n=0; while(a.state==='routing' && n<500){ fldMoraleStep(a,0.05); n++; }
      if(a.state==='routing') throw new Error('(a) the rally never fired');
      if(a.men!==950 || __FIELD.missing.US!==50) throw new Error('(a) shed->rally: men '+a.men+' missing '+__FIELD.missing.US);
      // (b) shed->kill: 1000 men break (shed 50 -> missing.US 100), then die — kw carries the post-shed 950
      b.men=1000; b.maxMen=1000; bk(b);
      if(b.men!==950 || __FIELD.missing.US!==100) throw new Error('(b) second US shed: men '+b.men+' missing '+__FIELD.missing.US);
      fldKill(b);
      if(b.alive || __FIELD.missing.US!==100) throw new Error('(b) the kill disturbed the missing ledger');
      // (c) SYMMETRY (§27): a CS unit sheds under the same truthy attacker gate, then surrenders blocked —
      // captured banks the POST-shed 950 (never the pre-shed 1000; no double-count with the missing 50)
      r.men=1000; r.maxMen=1000; bk(r);
      if(r.men!==950 || __FIELD.missing.CS!==50) throw new Error('(c) the CS first break did not shed (symmetry): men '+r.men+' missing '+JSON.stringify(__FIELD.missing));
      F.park(r,600,500); F.park(F.us[2],600,200); F.us[2].state='steady';   // the SL-2 blocked-corridor geometry (blocker past RALLY_R, in-band, directional)
      for(i=0;i<130;i++) fldMoraleStep(r,0.05);
      if(r.alive || r.state!=='captured') throw new Error('(c) the blocked post-shed router did not surrender: '+r.state);
      if(__FIELD.captured.CS!==950) throw new Error('(c) captured must bank the POST-shed men: '+__FIELD.captured.CS+' != 950');
      if(__FIELD.missing.CS!==50) throw new Error('(c) surrender disturbed the missing ledger: '+__FIELD.missing.CS);
      // the SL-4 identity, EXACT per side over the live roster: fielded = survivors + kw + captured + missing
      var f={US:0,CS:0}, s={US:0,CS:0};
      for(i=0;i<__FIELD.units.length;i++){ q=__FIELD.units[i]; if(q.side!=='US'&&q.side!=='CS') continue; f[q.side]+=q.maxMen; if(q.alive) s[q.side]+=q.men; }
      var casUS=Math.round(f.US-s.US), kwUS=casUS-__FIELD.captured.US-__FIELD.missing.US;
      var casCS=Math.round(f.CS-s.CS), kwCS=casCS-__FIELD.captured.CS-__FIELD.missing.CS;
      if(casUS!==1050 || kwUS!==950) throw new Error('US identity: cas '+casUS+' (want 1050 = shed 50 + killed 1000) kw '+kwUS+' (want 950)');
      if(casCS!==1000 || kwCS!==0) throw new Error('CS identity: cas '+casCS+' (want 1000) kw '+kwCS+' (want 0 — cap 950 + mis 50 carry the whole loss)');
      if(f.US!==s.US+kwUS+__FIELD.captured.US+__FIELD.missing.US) throw new Error('US identity: fielded != survivors+kw+captured+missing');
      if(f.CS!==s.CS+kwCS+__FIELD.captured.CS+__FIELD.missing.CS) throw new Error('CS identity: fielded != survivors+kw+captured+missing');
      return { shedRallyMen:a.men, kwUS:kwUS, capturedCS:__FIELD.captured.CS, missing:{US:__FIELD.missing.US,CS:__FIELD.missing.CS}, identityExact:true }; });

    step('E49b _e49NoShed isolation hook honored: the break FIRES (routEverCount increments) but the shed is suppressed — men unchanged, missing zero, shedDone NOT consumed', function(){
      var F=e49Launch(36), u=F.us[0];
      u.men=1000; u.maxMen=1000;
      __FIELD._e49NoShed=true;
      var n=0; u.state='steady'; u.rallyT=0;
      while(u.state!=='routing' && n<500){ u.morale=0; fldMoraleStep(u,0.05); n++; }
      var men=u.men, mis=__FIELD.missing.US, rc=__FIELD.routEverCount, sd=u.shedDone, st=u.state;
      delete __FIELD._e49NoShed;   // never leak the isolation hook into later teeth
      if(st!=='routing') throw new Error('the forced break never fired');
      if(men!==1000) throw new Error('shed fired despite _e49NoShed: men '+men);
      if(mis!==0) throw new Error('missing fed despite _e49NoShed: '+mis);
      if(rc<1) throw new Error('routEverCount '+rc+' < 1');
      if(sd!==false) throw new Error('shedDone consumed while suppressed: '+sd);
      return { men:men, missing:mis, breaks:rc, shedDoneStillFalse:true }; });

    step('E49a SL-2: a BLOCKED corridor (steady enemy beyond RALLY_R, directional, in-band) SUPPRESSES rally and surrenders at the RALLY_SECS grace — captured/tallied/marked; T2 counts the loss (OR convention)', function(){
      var F=e49Launch(32), r=F.cs[0], b=F.us[0];
      // router at (600,500) fleeing to the CS home edge (low z); blocker STEADY at (600,200):
      // dist 300 > RALLY_R 240 (pre-E49 this router would RALLY), dx 0 inside the band, z strictly
      // between router and edge. Nearest friendly steady is ~616yd away -> no rescue.
      F.park(r,600,500); r.men=1400; r.maxMen=1400; r.state='routing'; r.rallyT=0; r.surrenderT=0; r.morale=0;
      F.park(b,600,200); b.state='steady';
      for(var i=0;i<60;i++) fldMoraleStep(r,0.05);   // 3.0s blocked
      if(r.rallyT!==0) throw new Error('rallyT accrued while blocked: '+r.rallyT+' (blocked must suppress rally)');
      if(!(r.surrenderT>2.9)) throw new Error('surrenderT not accruing while blocked: '+r.surrenderT);
      if(!r.alive) throw new Error('surrendered before the grace elapsed');
      for(var j=0;j<70;j++) fldMoraleStep(r,0.05);   // past 6.0s
      if(r.alive || r.state!=='captured') throw new Error('unit did not surrender: alive='+r.alive+' state='+r.state);
      if(__FIELD.captured.CS!==1400) throw new Error('captured ledger '+__FIELD.captured.CS+' != 1400');
      if(__FIELD.surrenderEverCount!==1) throw new Error('surrenderEverCount '+__FIELD.surrenderEverCount+' != 1');
      if(__FIELD.prisonerMarkers.length!==1 || __FIELD.prisonerMarkers[0].men!==1400) throw new Error('prisoner marker missing/wrong');
      // T2 leg: the campaign fraction counts the captured men as total loss (SL-4, the OR convention),
      // and the tally identity holds EXACTLY: the entire CS loss IS the captured ledger (kw = 0, missing = 0).
      var savedCamp=(typeof G!=='undefined')?G.campaign:null; G.campaign={side:'US'}; __FIELD.campaignCtx={bd:{id:'e49fixture'}};
      var fCS=0, sCS=0; for(var k=0;k<__FIELD.units.length;k++){ var q=__FIELD.units[k]; if(q.side!=='CS') continue; fCS+=q.maxMen; if(q.alive) sCS+=q.men; }
      var o=fldCampaignComputeOutcome();
      G.campaign=savedCamp; __FIELD.campaignCtx=null;
      if(!o) throw new Error('no T2 outcome');
      var expE=Math.max(0,Math.min(0.92,(fCS-sCS)/Math.max(1,fCS)));
      if(Math.abs(o.eFrac-expE)>1e-9) throw new Error('T2 eFrac '+o.eFrac+' != total-loss '+expE);
      var cas=Math.round(fCS-sCS), kw=cas-__FIELD.captured.CS-__FIELD.missing.CS;
      if(kw!==0) throw new Error('identity: kw '+kw+' != 0 (cas '+cas+' cap '+__FIELD.captured.CS+' mis '+__FIELD.missing.CS+')');
      if(fCS!==sCS+kw+__FIELD.captured.CS+__FIELD.missing.CS) throw new Error('identity: fielded != survivors+kw+captured+missing');
      return { surrenderT:Math.round(r.surrenderT*10)/10, capturedCS:__FIELD.captured.CS, eFrac:Math.round(o.eFrac*1000)/1000, identityExact:true }; });

    step('E49a SL-2 controls: a pursuer BEHIND never blocks (rallies as today); a nearer steady FRIENDLY reopens the corridor (rescue); an out-of-band blocker does not trigger', function(){
      function ctl(setup){
        var F=e49Launch(33), r=F.cs[0];
        F.park(r,600,500); r.men=1400; r.maxMen=1400; r.state='routing'; r.rallyT=0; r.surrenderT=0; r.morale=0;
        setup(F,r);
        for(var i=0;i<125;i++) fldMoraleStep(r,0.05);   // 6.25s — past both the grace and the rally clock
        return r;
      }
      // (a) DIRECTIONAL: steady pursuer BEHIND the router (z 800, dist 300) — must rally, never surrender
      var r1=ctl(function(F,r){ F.park(F.us[0],600,800); F.us[0].state='steady'; });
      if(!r1.alive || r1.state==='captured' || __FIELD.captured.CS!==0) throw new Error('(a) pursuer-behind falsely triggered surrender: state='+r1.state);
      if(r1.state!=='wavering' && r1.state!=='steady' && r1.state!=='shaken') throw new Error('(a) router did not rally: '+r1.state);
      // (b) RESCUE: valid blocker at 300 but a steady friendly at 100 — corridor reopenable, must rally
      var r2=ctl(function(F,r){ F.park(F.us[0],600,200); F.us[0].state='steady'; F.park(F.cs[1],700,500); F.cs[1].state='steady'; });
      if(!r2.alive || __FIELD.captured.CS!==0) throw new Error('(b) rescue clause failed — surrendered despite a nearer steady friendly');
      // (c) BAND: steady enemy ahead but 300yd OFF the flight lane (dx > RALLY_R) — must rally
      var r3=ctl(function(F,r){ F.park(F.us[0],900,200); F.us[0].state='steady'; });
      if(!r3.alive || __FIELD.captured.CS!==0) throw new Error('(c) out-of-band enemy falsely triggered surrender');
      return { pursuerBehindRallies:true, rescueRallies:true, outOfBandRallies:true }; });

    step('E54 pocket-collapse capture: an attacker-HOLD win with explicit role-aware homeEdge captures broken defenders only after 2:1 field collapse + local objective control; near-parity and no-homeEdge controls stay inert', function(){
      if(typeof fldPocketCollapseOnVictory!=='function') throw new Error('fldPocketCollapseOnVictory missing');
      function setup(seed, usMen, withHomeEdge){
        var F=e49Launch(seed), o=__FIELD.objective, i;
        __FIELD.homeEdgeZ = withHomeEdge ? { US:'low', CS:'high' } : null;
        for(i=0;i<F.us.length;i++){ F.us[i].men=usMen; F.us[i].maxMen=usMen; F.us[i].state='steady'; F.park(F.us[i], o.x-40+i*40, o.z); }
        F.cs[0].men=950; F.cs[0].maxMen=1000; F.cs[0].state='routing'; F.park(F.cs[0], o.x-30, o.z+70);
        F.cs[1].men=800; F.cs[1].maxMen=1000; F.cs[1].state='wavering'; F.park(F.cs[1], o.x+30, o.z+75);
        F.cs[2].men=1000; F.cs[2].maxMen=1000; F.cs[2].state='steady'; F.park(F.cs[2], o.x+75, o.z+75);
        return F;
      }
      var F=setup(37,3000,true), n=fldPocketCollapseOnVictory('US','hold');
      if(n!==2) throw new Error('wanted exactly two broken defenders captured, got '+n);
      if(F.cs[0].state!=='captured' || F.cs[1].state!=='captured') throw new Error('broken defenders not captured');
      if(!F.cs[2].alive || F.cs[2].state!=='steady') throw new Error('steady defender falsely captured');
      if(__FIELD.captured.CS!==1750) throw new Error('captured.CS '+__FIELD.captured.CS+' != 1750');
      if(__FIELD.prisonerMarkers.length!==2) throw new Error('wanted two prisoner markers, got '+__FIELD.prisonerMarkers.length);
      F=setup(38,1200,true); n=fldPocketCollapseOnVictory('US','hold');
      if(n!==0 || __FIELD.captured.CS!==0) throw new Error('near-parity hold falsely captured: n='+n+' cap='+__FIELD.captured.CS);
      F=setup(39,3000,false); n=fldPocketCollapseOnVictory('US','hold');
      if(n!==0 || __FIELD.captured.CS!==0) throw new Error('default/no-homeEdge battle falsely captured: n='+n+' cap='+__FIELD.captured.CS);
      return { capturedCS:1750, nearParityInert:true, noHomeEdgeInert:true }; });

    step('E49b SL-4/§5.4: the T8 phased ledgers — antietam full run keeps captured/missing CONSISTENT subsets of battleCas (never added; phaseLog sums == cumulative; missing ≤ f x battleFielded + 0.5 x unitsShed per side — the structural bound the D256 form broke)', function(){
      G.campaign=null;
      // sim-inert observation wrapper: count the units that actually shed per side (the §5.4 bound's
      // unitsBroke term). Calls the original exactly once — no RNG, no state beyond the counter.
      var shedN={US:0,CS:0}, _origShed=fldShedStragglers;
      fldShedStragglers=function(q){ var b=__FIELD.missing[q.side]; _origShed(q); if(__FIELD.missing[q.side]!==b) shedN[q.side]++; };
      var bc,cap,mis,pl;
      try {
        fldLaunchSandbox({renderer:'none', autoBoth:true, seed:7, scenario:'antietam'});
        if(!__FIELD.phases) throw new Error('precondition: antietam should be phased');
        __FIELD.phase='battle'; __FIELD.paused=false;
        var n=0; while(__FIELD.phase!=='over' && n<120000){ fldSimStep(0.05); n++; }
        if(__FIELD.phase!=='over') throw new Error('phased battle did not finish');
        bc=__FIELD.battleCas; cap=__FIELD.battleCaptured; mis=__FIELD.battleMissing; pl=__FIELD.phaseLog;
      } finally { fldShedStragglers=_origShed; }
      var sum={usCap:0,csCap:0,usMis:0,csMis:0};
      for(var i=0;i<pl.length;i++){ sum.usCap+=pl[i].usCap||0; sum.csCap+=pl[i].csCap||0; sum.usMis+=pl[i].usMis||0; sum.csMis+=pl[i].csMis||0; }
      if(sum.usCap!==cap.US || sum.csCap!==cap.CS) throw new Error('phaseLog captured sums != cumulative: '+JSON.stringify(sum)+' vs '+JSON.stringify(cap));
      if(sum.usMis!==mis.US || sum.csMis!==mis.CS) throw new Error('phaseLog missing sums != cumulative: '+JSON.stringify(sum)+' vs '+JSON.stringify(mis));
      // subsets never exceed the total-loss tally (±1/phase rounding headroom, 3 phases)
      if(cap.US+mis.US > bc.US+3 || cap.CS+mis.CS > bc.CS+3) throw new Error('subset ledgers exceed battleCas: cap '+JSON.stringify(cap)+' mis '+JSON.stringify(mis)+' cas '+JSON.stringify(bc));
      // E49b §5.4: the first-break structural bound — missing can never exceed f x the accumulated
      // fielded (+0.5/shed-unit rounding headroom). Missing>0 is ALLOWED here (shedding is live);
      // non-vacuity is gated in the battery at the heavy battles, not pinned to one Antietam seed.
      var fb=__FIELD.battleFielded;
      if(mis.US > 0.05*fb.US + 0.5*shedN.US) throw new Error('missing.US '+mis.US+' breaks the first-break bound: f x fielded '+(0.05*fb.US)+' + 0.5 x '+shedN.US+' shed units');
      if(mis.CS > 0.05*fb.CS + 0.5*shedN.CS) throw new Error('missing.CS '+mis.CS+' breaks the first-break bound: f x fielded '+(0.05*fb.CS)+' + 0.5 x '+shedN.CS+' shed units');
      return { cas:{US:Math.round(bc.US),CS:Math.round(bc.CS)}, captured:cap, missing:mis, unitsShed:shedN, fielded:{US:fb.US,CS:fb.CS}, phases:pl.length }; });

    step('E49a SL-3: the symmetric SANDBOX is inert — attacker null -> zero ledgers, no surrender state, no markers after a full battle', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:777}); fldStepN(20,0.05); runToEnd(12000);
      if(__FIELD.attacker!==null) throw new Error('sandbox has an attacker: '+__FIELD.attacker);
      if(__FIELD.captured.US!==0 || __FIELD.captured.CS!==0) throw new Error('sandbox captured ledger nonzero');
      if(__FIELD.missing.US!==0 || __FIELD.missing.CS!==0) throw new Error('sandbox missing ledger nonzero');
      if(__FIELD.surrenderEverCount!==0 || __FIELD.prisonerMarkers.length!==0) throw new Error('sandbox surrender fired');
      for(var i=0;i<__FIELD.units.length;i++) if(__FIELD.units[i].state==='captured') throw new Error('sandbox unit captured');
      return { winner:__FIELD.winner, inert:true }; });

    step('RE-LAUNCH is clean (exit removes DOM + state; relaunch fresh)', function(){
      fldLaunchSandbox({renderer:'none', seed:1}); fldExit(true);
      if(__FIELD.launched!==false) throw new Error('exit left launched=true');
      if(document.getElementById('fldRoot')) throw new Error('exit left #fldRoot in the DOM');
      fldLaunchSandbox({renderer:'none', seed:1});
      if(__FIELD.units.length!==4) throw new Error('relaunch did not rebuild units');
      if(__FIELD.t!==0) throw new Error('relaunch did not reset time: '+__FIELD.t);
      fldExit(true);
      return { ok:true }; });

    step('2D FALLBACK renderer: DOM root + canvas build, draw runs, teardown clean', function(){
      fldLaunchSandbox({renderer:'2d', autoBoth:true, seed:3});
      var root=document.getElementById('fldRoot'); if(!root) throw new Error('no #fldRoot built');
      var cv=document.getElementById('fldGl'); if(!cv) throw new Error('no canvas');
      if(!__FIELD.ctx2d) throw new Error('2d context not created');
      __FIELD.phase='battle'; __FIELD.paused=false;
      fldStepN(80,0.05);
      fld2dDraw();          // must not throw
      fldRenderHud();       // must not throw
      var hud=document.getElementById('fldHud'); var hudOk = hud && hud.innerHTML.length>0;
      fldExit(true);
      if(document.getElementById('fldRoot')) throw new Error('teardown left DOM');
      return { built:true, hudRendered:!!hudOk }; });

    step('MENU ENTRY: the Sandbox button injects into the LIVE broadsheet main menu (#gnFree anchor)', function(){
      if (typeof openMainMenu !== 'function') return { skipped:'no openMainMenu' };
      G.mode='menu';
      openMainMenu();                                   // renders the live broadsheet menu into #sheetPad
      if(!document.getElementById('gnFree')) throw new Error('live menu did not render #gnFree (anchor gone)');
      fldInjectMenuButton();                            // what the MutationObserver calls
      var btn=document.getElementById('fldSandboxBtn');
      if(!btn) throw new Error('Sandbox button did NOT inject into the live menu');
      if(btn.parentNode!==document.getElementById('gnFree').parentNode) throw new Error('button not placed in the Free-Battle column');
      fldInjectMenuButton();                            // idempotent — must not duplicate
      var n=document.querySelectorAll('#fldSandboxBtn').length;
      if(n!==1) throw new Error('duplicate injection: '+n+' buttons');
      return { injected:true, copies:n, hasAria: !!btn.getAttribute('aria-label') }; });

    step('NO CLASSIC CONTAMINATION: __FIELD never wrote G.battle / G.campaign / G.mode', function(){
      var modeBefore=G.mode;
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:2}); fldStepN(200,0.05);
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('sandbox created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('sandbox mutated G.mode: '+G.mode);
      fldExit(true);
      return { gMode:G.mode, gBattle:(typeof G.battle) }; });
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
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });   // slow-Mac: the 'load' wait stalls while embedded assets stream (the documented gotcha, D233 class; fixed in D245); inline scripts are all the probe needs
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    // visual: launch the 2D sandbox, advance the fight deterministically (headless RAF is
    // throttled, so step the sim directly), draw, then screenshot a battle in progress.
    const rafProbe = await page.evaluate(`(function(){
      fldLaunchSandbox({renderer:'2d', autoBoth:true, seed:42});
      __FIELD.phase='battle'; __FIELD.paused=true;   // paused so RAF can't double-advance
      fldStepN(300, 0.05);                            // 15 sim-seconds of maneuver + fire
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      return { simT: Math.round(__FIELD.t), routs: __FIELD.routEverCount };
    })()`);
    result.screenshotSimT = rafProbe.simT;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-field.png'), timeout: 120000 });   // slow-Mac WebGL ReadPixels stall: the 30s default flakes (the documented D232 class, repaired in D252)
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-field.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-field ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-field.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-field.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-field: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-field: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-field: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
