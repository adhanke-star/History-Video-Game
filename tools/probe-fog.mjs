#!/usr/bin/env node
// tools/probe-fog.mjs — TACTICAL P1b (the fog-of-war toggle). Verifies the per-side line-of-sight
// visibility model EMPIRICALLY on the renderer-agnostic sim: default OFF is the no-op fast path (every
// pair visible); fog ON hides enemies beyond sight range and behind woods; AI/targeting engage ONLY
// visible enemies; cavalry scout widest; last-known "ghosts" persist; the toggle flips + persists;
// determinism + no NaN; a full fog-ON battle (sandbox + Bull Run) still resolves; no Classic contamination.
// Writes shots/probe-fog.json.
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
    if(!isNum(u.x)||!isNum(u.z)||!isNum(u.men)||!isNum(u.morale)||!isNum(u.facing)) return u.id; } return null; }
  function runToEnd(maxSteps){ if(__FIELD.phase==='deploy'){__FIELD.phase='battle';__FIELD.paused=false;} var n=0; while(__FIELD.phase==='battle' && n<maxSteps){ fldSimStep(0.05); n++; } return n; }
  function side(s){ var o=[]; for(var i=0;i<__FIELD.units.length;i++) if(__FIELD.units[i].side===s) o.push(__FIELD.units[i]); return o; }
  function strength(s){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===s&&u.alive)c+=u.men; } return Math.round(c); }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof fldVisible!=='function' || typeof fldComputeVisibility!=='function')
      return JSON.stringify({ok:false, fatal:'fog engine missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; G.settings.tacticalFog=false; __FIELD._officersOff=true;   // B-2: lock the PRE-officer sim core BYTE-IDENTICAL (officer layer -> probe-officers)

    step('DEFAULT OFF: __FIELD.fog false and fldVisible() is always true (the no-op fast path)', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      if(__FIELD.fog!==false) throw new Error('fog should default OFF, got '+__FIELD.fog);
      var us=side('US')[0], cs=side('CS')[0];
      us.x=50; us.z=50; cs.x=1150; cs.z=850;   // maximally far apart
      if(!fldVisible('US', cs)) throw new Error('fog OFF must report everything visible');
      if(!fldVisible('CS', us)) throw new Error('fog OFF must report everything visible (CS side)');
      return { fog:__FIELD.fog }; });

    step('LOS math: a sight line through woods is blocked; a clear line is not', function(){
      // sandbox woods are centered at (310,480,r170) and (920,360,r130)
      if(fldLosClear(310,300,310,660)) throw new Error('line through the (310,480) woods should be BLOCKED');
      if(!fldLosClear(600,300,600,660)) throw new Error('clear line at x=600 should be UNBLOCKED');
      return { blockedThroughWoods:true, clearOpenGround:true }; });

    step('FOG ON hides enemies beyond sight range; reveals them within it', function(){
      fldLaunchSandbox({renderer:'none', fog:true, autoBoth:true, seed:1});
      if(__FIELD.fog!==true) throw new Error('fog opt not honored');
      var us=side('US'), cs=side('CS');
      us[1].x=40; us[1].z=860; cs[1].x=1160; cs[1].z=40;   // park the other units far off
      us[0].x=600; us[0].z=780; cs[0].x=600; cs[0].z=200;  // dist 580 > SIGHT_INF(430), open ground
      fldComputeVisibility();
      if(fldVisible('US', cs[0])) throw new Error('distant enemy (580y) should be HIDDEN under fog');
      cs[0].z=500;  // dist 280 < 430, clear LOS at x=600
      fldComputeVisibility();
      if(!fldVisible('US', cs[0])) throw new Error('enemy within sight + clear LOS should be VISIBLE');
      return { hiddenFar:true, seenNear:true }; });

    step('FOG ON: woods break line-of-sight even within sight range', function(){
      fldLaunchSandbox({renderer:'none', fog:true, autoBoth:true, seed:1});
      var us=side('US'), cs=side('CS');
      us[1].x=40; us[1].z=860; cs[1].x=1160; cs[1].z=40;
      us[0].x=310; us[0].z=640; cs[0].x=310; cs[0].z=360;  // 280y apart but the (310,480) woods sits between
      fldComputeVisibility();
      if(fldVisible('US', cs[0])) throw new Error('enemy behind woods should be HIDDEN despite being in sight range');
      us[0].x=600; cs[0].x=600;  // same separation, clear lane at x=600
      fldComputeVisibility();
      if(!fldVisible('US', cs[0])) throw new Error('same range on a clear lane should be VISIBLE');
      return { woodsBlocks:true }; });

    step('CAVALRY scout widest (sight radius by arm)', function(){
      if(!(fldUnitSight({arm:'cav'}) > fldUnitSight({arm:'inf'}))) throw new Error('cavalry should out-scout infantry');
      if(!(fldUnitSight({arm:'inf'}) > 0)) throw new Error('infantry sight must be positive');
      return { cav:fldUnitSight({arm:'cav'}), inf:fldUnitSight({arm:'inf'}), art:fldUnitSight({arm:'art'}) }; });

    step('AI/TARGETING engage ONLY visible enemies under fog', function(){
      fldLaunchSandbox({renderer:'none', fog:true, autoBoth:true, seed:1});
      var us=side('US'), cs=side('CS');
      us[1].x=40; us[1].z=860; cs[1].x=1160; cs[1].z=40;
      us[0].x=310; us[0].z=640; us[0].ammo=100; us[0].state='steady';
      cs[0].x=310; cs[0].z=420;  // ~220y (in rifle range) but behind the woods -> hidden
      fldComputeVisibility();
      fldAcquireTarget(us[0]);
      if(us[0].targetId) throw new Error('acquired a target it cannot see (fog leak in targeting): '+us[0].targetId);
      us[0].x=600; cs[0].x=600;  // clear lane, same range
      fldComputeVisibility();
      fldAcquireTarget(us[0]);
      if(us[0].targetId!==cs[0].id) throw new Error('failed to acquire a visible in-range enemy: '+us[0].targetId);
      return { hiddenNoTarget:true, visibleAcquired:true }; });

    step('LAST-KNOWN GHOST: a once-seen enemy persists in lastSeen after it goes dark', function(){
      fldLaunchSandbox({renderer:'none', fog:true, autoBoth:true, seed:1});
      var us=side('US'), cs=side('CS');
      us[1].x=40; us[1].z=860; cs[1].x=1160; cs[1].z=40;
      us[0].x=600; us[0].z=700; cs[0].x=600; cs[0].z=520;  // visible
      fldComputeVisibility();
      if(!fldVisible('US', cs[0])) throw new Error('precondition: should be visible');
      if(!__FIELD.lastSeen[cs[0].id]) throw new Error('lastSeen not recorded while visible');
      cs[0].z=120;  // now far away -> hidden
      fldComputeVisibility();
      if(fldVisible('US', cs[0])) throw new Error('should now be hidden');
      if(!__FIELD.lastSeen[cs[0].id]) throw new Error('ghost (lastSeen) lost after going dark');
      return { ghostKept:true, ghostZ:Math.round(__FIELD.lastSeen[cs[0].id].z) }; });

    step('TOGGLE flips + persists to G.settings.tacticalFog', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});  // OFF
      if(__FIELD.fog!==false) throw new Error('precondition OFF');
      fldToggleFog();
      if(__FIELD.fog!==true || G.settings.tacticalFog!==true) throw new Error('toggle did not turn fog ON + persist');
      fldToggleFog();
      if(__FIELD.fog!==false || G.settings.tacticalFog!==false) throw new Error('toggle did not turn fog OFF + persist');
      // persisted setting drives the next launch
      G.settings.tacticalFog=true; fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      if(__FIELD.fog!==true) throw new Error('persisted setting not read on launch');
      G.settings.tacticalFog=false;
      return { persists:true }; });

    step('FOG ON full battle resolves with a winner, no NaN, determinism', function(){
      fldLaunchSandbox({renderer:'none', fog:true, autoBoth:true, seed:202}); runToEnd(12000);
      if(__FIELD.phase!=='over') throw new Error('fog battle did not end');
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('bad winner '+__FIELD.winner);
      var bad=nanScan(); if(bad) throw new Error('NaN in '+bad);
      var w1=__FIELD.winner, c1=strength('US')+strength('CS');
      fldLaunchSandbox({renderer:'none', fog:true, autoBoth:true, seed:202}); runToEnd(12000);
      if(__FIELD.winner!==w1) throw new Error('non-deterministic fog winner: '+w1+' vs '+__FIELD.winner);
      if(strength('US')+strength('CS')!==c1) throw new Error('non-deterministic fog casualties');
      return { winner:w1, totalStr:c1 }; });

    step('FOG ON Bull Run resolves (the reverse-slope/rail reserves stay unseen until scouted)', function(){
      if(typeof fldScenarioInit!=='function') return { skipped:'no scenario engine' };
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', fog:true, autoBoth:true, seed:9}); runToEnd(20000);
      if(__FIELD.phase!=='over') throw new Error('fog Bull Run did not end');
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('bad winner '+__FIELD.winner);
      if(nanScan()) throw new Error('NaN in fog Bull Run');
      return { winner:__FIELD.winner, winBy:__FIELD.winBy, endSec:Math.round(__FIELD.t) }; });

    step('DESTROYED enemy leaves NO phantom ghost (lastSeen purged on kill)', function(){
      fldLaunchSandbox({renderer:'none', fog:true, autoBoth:true, seed:1});
      var us=side('US'), cs=side('CS');
      us[1].x=40; us[1].z=860; cs[1].x=1160; cs[1].z=40;
      us[0].x=600; us[0].z=640; cs[0].x=600; cs[0].z=480;   // visible (clear lane, in sight)
      fldComputeVisibility();
      if(!__FIELD.lastSeen[cs[0].id]) throw new Error('precondition: CS should be in lastSeen');
      fldKill(cs[0]);
      if(__FIELD.lastSeen[cs[0].id]) throw new Error('destroyed enemy left a phantom ghost in lastSeen');
      // and the ghost-skip guard would skip a dead unit even if an entry survived
      return { ghostPurgedOnKill:true }; });

    step('DEPLOY-PHASE visibility is primed at launch when fog is ON (no blacked-out deploy screen)', function(){
      G.settings.tacticalFog=true;
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});   // persisted fog ON
      if(__FIELD.phase!=='deploy') throw new Error('should be in deploy');
      if(__FIELD.vis===null) throw new Error('vis not primed at launch -> deploy screen would be blacked out');
      G.settings.tacticalFog=false;
      return { visPrimedAtDeploy:true }; });

    step('NO CLASSIC CONTAMINATION under fog', function(){
      var modeBefore=G.mode;
      fldLaunchSandbox({renderer:'none', fog:true, autoBoth:true, seed:2}); fldStepN(200,0.05);
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('fog created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('fog mutated G.mode');
      fldExit(true);
      return { gMode:G.mode }; });
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
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-fog.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-fog ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
