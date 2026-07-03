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
    await page.goto(probe, { waitUntil:'load', timeout:60000 });
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
    await page.screenshot({ path: join(OUT,'probe-field.png') });
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
