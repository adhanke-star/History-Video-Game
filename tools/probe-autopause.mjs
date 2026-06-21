#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-autopause.mjs — TACTICAL P1b (active auto-pause). The feature lives in the RAF loop
// (fldAutoPauseScan), so this drives that pure scan directly: it pauses once on a decision-point event
// (a break, a destroyed brigade, arriving reinforcements), no-ops when nothing changed, returns early
// when already paused; the toggle flips + persists + sets aria-pressed; resume clears the reason; and the
// HEADLESS stepper (fldStepN) NEVER auto-pauses -> a full auto-pause-ON battle still resolves deterministically.
// Writes shots/probe-autopause.json.
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
  function alive(){ var n=0; for(var i=0;i<__FIELD.units.length;i++) if(__FIELD.units[i].alive) n++; return n; }
  function strength(s){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===s&&u.alive)c+=u.men; } return Math.round(c); }
  function runToEnd(m){ if(__FIELD.phase==='deploy'){__FIELD.phase='battle';__FIELD.paused=false;} var n=0; while(__FIELD.phase==='battle'&&n<m){ fldSimStep(0.05); n++; } return n; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof fldAutoPauseScan!=='function' || typeof fldToggleAutoPause!=='function')
      return JSON.stringify({ok:false, fatal:'auto-pause engine missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; G.settings.tacticalFog=false; delete G.settings.tacticalAutoPause; __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=true;   // B-2/B-3/B-4: lock the PRE-officer/PRE-logistics/PRE-arms sim core BYTE-IDENTICAL (each layer -> its own probe). tacticalFog pinned OFF (D67: bullrun1 now defaults fog ON).

    step('DEFAULT ON (accessible low-APM default)', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      if(__FIELD.autoPause!==true) throw new Error('auto-pause should default ON, got '+__FIELD.autoPause);
      return { autoPause:__FIELD.autoPause }; });

    step('SCAN pauses on a BREAK (rout), with the reason', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1}); __FIELD.phase='battle'; __FIELD.paused=false; __FIELD._apReason=null;
      var a=alive(), n=__FIELD.units.length, r=__FIELD.routEverCount;
      __FIELD.routEverCount = r+1;                 // a brigade just broke this advance
      fldAutoPauseScan(r, a, n);
      if(__FIELD.paused!==true) throw new Error('did not pause on a break');
      if(__FIELD._apReason!=='A brigade has broken') throw new Error('wrong reason: '+__FIELD._apReason);
      return { reason:__FIELD._apReason }; });

    step('SCAN pauses on a DESTROYED brigade', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1}); __FIELD.phase='battle'; __FIELD.paused=false; __FIELD._apReason=null;
      var a=alive(), n=__FIELD.units.length, r=__FIELD.routEverCount;
      __FIELD.units[2].alive=false;                // one fewer alive than the snapshot
      fldAutoPauseScan(r, a, n);
      if(__FIELD.paused!==true || __FIELD._apReason!=='A brigade is destroyed') throw new Error('did not pause on destroy: '+__FIELD._apReason);
      return { reason:__FIELD._apReason }; });

    step('SCAN pauses on REINFORCEMENTS arriving', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1}); __FIELD.phase='battle'; __FIELD.paused=false; __FIELD._apReason=null;
      var a=alive(), n=__FIELD.units.length, r=__FIELD.routEverCount;
      __FIELD.units.push(fldMakeUnit({id:'X1',side:'CS',name:'Test',arm:'inf',weapon:'smooth',men:1000,x:600,z:300,facing:0,ai:true}));
      fldAutoPauseScan(r, a, n);
      if(__FIELD.paused!==true || __FIELD._apReason!=='Reinforcements arrive') throw new Error('did not pause on reinforcement: '+__FIELD._apReason);
      return { reason:__FIELD._apReason }; });

    step('SAME-FRAME death + reinforcement: destroyed is NOT masked (combined reason, destroyed primary)', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1}); __FIELD.phase='battle'; __FIELD.paused=false; __FIELD._apReason=null;
      var a=alive(), n=__FIELD.units.length, r=__FIELD.routEverCount;
      __FIELD.units[2].alive=false;   // a death this frame
      __FIELD.units.push(fldMakeUnit({id:'X2',side:'CS',name:'T',arm:'inf',weapon:'smooth',men:900,x:600,z:300,facing:0,ai:true}));  // and a spawn (nets the headcount)
      fldAutoPauseScan(r, a, n);
      if(__FIELD.paused!==true) throw new Error('did not pause on same-frame death+reinforce');
      if(__FIELD._apReason!=='A brigade is destroyed') throw new Error('same-frame: destroyed reason was masked, got '+__FIELD._apReason);
      return { primary:__FIELD._apReason }; });

    step('TOGGLE OFF releases an actively-held auto-pause (the escape control escapes)', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1}); __FIELD.phase='battle'; __FIELD.autoPause=true; __FIELD.paused=true; __FIELD._apReason='A brigade has broken';
      fldToggleAutoPause();   // turn OFF while auto-paused
      if(__FIELD.autoPause!==false) throw new Error('did not turn off');
      if(__FIELD.paused!==false) throw new Error('turning auto-pause OFF did not release the active pause');
      if(__FIELD._apReason!==null) throw new Error('reason not cleared on release');
      delete G.settings.tacticalAutoPause;
      return { released:true }; });

    step('SCAN is a NO-OP when nothing changed', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1}); __FIELD.phase='battle'; __FIELD.paused=false; __FIELD._apReason=null;
      fldAutoPauseScan(__FIELD.routEverCount, alive(), __FIELD.units.length);
      if(__FIELD.paused!==false) throw new Error('paused with no event');
      if(__FIELD._apReason!==null) throw new Error('set a reason with no event');
      return { stayedRunning:true }; });

    step('SCAN returns early when ALREADY paused (no re-trigger spam)', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1}); __FIELD.phase='battle'; __FIELD.paused=true; __FIELD._apReason='prior';
      var r=__FIELD.routEverCount; __FIELD.routEverCount=r+1;
      fldAutoPauseScan(r, alive(), __FIELD.units.length);
      if(__FIELD._apReason!=='prior') throw new Error('overwrote reason while already paused');
      return { unchanged:true }; });

    step('RESUME (fldTogglePlay) clears the auto-pause reason', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1}); __FIELD.phase='battle'; __FIELD.paused=true; __FIELD._apReason='A brigade has broken';
      fldTogglePlay();   // resume
      if(__FIELD.paused!==false) throw new Error('did not resume');
      if(__FIELD._apReason!==null) throw new Error('reason not cleared on resume: '+__FIELD._apReason);
      return { resumed:true }; });

    step('TOGGLE flips + persists G.settings.tacticalAutoPause', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      var before=__FIELD.autoPause; fldToggleAutoPause();
      if(__FIELD.autoPause===before) throw new Error('toggle did not flip');
      if(G.settings.tacticalAutoPause!==__FIELD.autoPause) throw new Error('toggle did not persist');
      fldToggleAutoPause();
      if(__FIELD.autoPause!==before) throw new Error('toggle did not flip back');
      // persisted OFF drives the next launch
      G.settings.tacticalAutoPause=false; fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      if(__FIELD.autoPause!==false) throw new Error('persisted OFF not read on launch');
      delete G.settings.tacticalAutoPause;
      return { persists:true }; });

    step('HEADLESS battle is UNAFFECTED by auto-pause (fldStepN never auto-pauses) + determinism', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:303}); runToEnd(12000);
      if(__FIELD.phase!=='over') throw new Error('auto-pause stalled a headless battle (phase='+__FIELD.phase+')');
      var w1=__FIELD.winner, c1=strength('US')+strength('CS');
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:303}); runToEnd(12000);
      if(__FIELD.winner!==w1 || strength('US')+strength('CS')!==c1) throw new Error('non-deterministic with auto-pause ON');
      return { winner:w1 }; });

    step('2D button reflects state + aria-pressed (a11y toggle)', function(){
      G.settings.tacticalAutoPause=true; fldLaunchSandbox({renderer:'2d', seed:1});
      var b=document.getElementById('fldBtnAuto');
      if(!b) throw new Error('no Auto-pause button');
      if(b.getAttribute('aria-pressed')!=='true') throw new Error('aria-pressed not set on (default ON)');
      if(b.innerHTML.indexOf('On')<0) throw new Error('label does not show On');
      fldToggleAutoPause();
      if(b.getAttribute('aria-pressed')!=='false' || b.innerHTML.indexOf('Off')<0) throw new Error('toggle did not update button a11y/label');
      fldExit(true); delete G.settings.tacticalAutoPause;
      return { ariaToggles:true }; });

    step('NO CLASSIC CONTAMINATION', function(){
      var m=G.mode; fldLaunchSandbox({renderer:'none', autoBoth:true, seed:2}); fldStepN(120,0.05);
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==m) throw new Error('mutated G.mode'); fldExit(true);
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
    writeFileSync(join(OUT,'probe-autopause.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-autopause ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
