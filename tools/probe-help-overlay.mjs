#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-help-overlay.mjs — D230/E24: teeth for the help/onboarding subsystem
// (src/92-help-overlay.js), which shipped with ZERO probe coverage. Verifies:
//   (1) the module's symbols exist;
//   (2) _hpShowWelcome() renders the first-launch card with the tour + skip actions;
//   (3) _hpShowHelp() opens the How-to-Play sheet with the controls reference + aria-labelled buttons;
//   (4) the global "?" keydown opens How-to-Play in menu mode and the tactical overlay in battle mode;
//   (5) _hpShowTacticalHelp() builds an aria-modal dialog and Escape/close tears it down (focus returns);
//   (6) _hpInjectPauseIndicator()/_hpUpdatePause() render + toggle the aria-live pause indicator.
// Pure UI/help layer -> no campaign mutation, no RNG. Node-side static scan: no combat path references
// the help subsystem. Writes shots/probe-help-overlay.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GLA = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }

function staticHpLeakScan() {
  const RE = /\b_hpShowHelp\b|\b_hpShowTacticalHelp\b|\b_hpShowWelcome\b|\b_hpInjectPauseIndicator\b/;
  const files = [];
  try { const TACT = join(ROOT, 'src', 'tactical'); for (const f of readdirSync(TACT)) if (f.endsWith('.js')) files.push(join(TACT, f)); } catch (e) {}
  for (const f of ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js', '80-victory.js']) files.push(join(ROOT, 'src', f));
  const leaks = [];
  for (const f of files) { try { if (RE.test(readFileSync(f, 'utf8'))) leaks.push(f.split('/').pop()); } catch (e) {} }
  return { scanned: files.length, leaks };
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function sheetOpen(){ var o=document.getElementById('overlay'); return o && o.className.indexOf('hidden')<0; }
  function pad(){ var p=document.getElementById('sheetPad'); return p?p.innerHTML:''; }
  function closeSheetSafe(){ try{ if(typeof closeSheet==='function') closeSheet(); }catch(e){} }
  try {
    if (typeof _hpShowHelp!=='function' || typeof _hpShowTacticalHelp!=='function' || typeof _hpShowWelcome!=='function' || typeof _hpInjectPauseIndicator!=='function' || typeof _hpUpdatePause!=='function')
      return JSON.stringify({ok:false,fatal:'help-overlay module missing symbols'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    window.__FIELD = window.__FIELD || {}; __FIELD.launched=false; __FIELD.phase='idle';

    step('welcome card renders the tour + skip actions', function(){
      _hpShowWelcome();
      if(!sheetOpen()) throw new Error('welcome did not open a sheet');
      if(!document.getElementById('hpWelcomeTour')) throw new Error('no #hpWelcomeTour');
      if(!document.getElementById('hpWelcomeOk')) throw new Error('no #hpWelcomeOk');
      closeSheetSafe();
      return { ok:true }; });

    step('How-to-Play sheet renders controls reference + aria-labelled buttons', function(){
      _hpShowHelp();
      if(!sheetOpen()) throw new Error('_hpShowHelp did not open a sheet');
      var html=pad();
      if(html.indexOf('How to Play')<0) throw new Error('sheet missing the How to Play heading');
      var back=document.getElementById('hpHelpBack'), tour=document.getElementById('hpHelpTour');
      if(!back||!tour) throw new Error('missing Back/Tour buttons');
      if(!back.getAttribute('aria-label')||!tour.getAttribute('aria-label')) throw new Error('help buttons missing aria-label (4.1.2)');
      // S07/S08 (D233): the complete reference documents the two marquee UG:G gestures + the R hotkey
      if(html.indexOf('Charge a chosen foe')<0 || html.indexOf('Drag ONTO an enemy')<0) throw new Error('How-to-Play missing the drag-onto-enemy charge gesture');
      if(html.indexOf('Queue a route')<0) throw new Error('How-to-Play missing the shift-queue gesture');
      if(html.indexOf('Keyboard movement')<0 || html.indexOf('M + arrows')<0 || html.indexOf('Shift+Enter')<0) throw new Error('How-to-Play missing the S40 keyboard endpoint/facing/waypoint path');
      if(html.indexOf('Cycle elevation display')<0) throw new Error('How-to-Play missing the R elevation hotkey');
      closeSheetSafe();
      return { htmlLen:html.length }; });

    step('C19 (D233): the welcome quick-start names the SHIPPED menu buttons, not the retired pre-H0 layout', function(){
      _hpShowWelcome();
      var html=pad();
      if(html.indexOf('Muster the Union')<0 || html.indexOf('Command the Confederacy')<0) throw new Error('quick-start missing the shipped campaign buttons');
      if(html.indexOf('Choose a Battle')<0) throw new Error('quick-start missing the Choose a Battle path');
      if(html.indexOf('Federal Armies Muster for War')>=0) throw new Error('quick-start still names the retired pre-H0 button');
      closeSheetSafe();
      return { ok:true }; });

    step('GEA-01 (D423): quick-start derives the live scenario count and retires the nine-name chain', function(){
      _hpShowWelcome();
      var html=pad();
      var n=(typeof fldScenarioRegistry==='function')?Object.keys(fldScenarioRegistry()||{}).length:0;
      if(!(n>0)) throw new Error('live scenario registry unavailable/empty in-page (n='+n+')');
      if(html.indexOf('all '+n+' historical battles')<0) throw new Error('quick-start missing the live-count phrase "all '+n+' historical battles"');
      if(html.indexOf('beginning with First Bull Run')<0) throw new Error('quick-start missing the First Bull Run anchor');
      if(html.indexOf('Fredericksburg, Chancellorsville, Gettysburg')>=0) throw new Error('quick-start still carries the retired nine-name enumeration');
      if(html.indexOf('Choose a Battle')<0) throw new Error('quick-start missing Choose a Battle');
      if(html.indexOf('Skirmish sandbox')<0 || html.indexOf('Custom Battle builder')<0) throw new Error('quick-start missing the Skirmish sandbox / Custom Battle builder mentions');
      closeSheetSafe();
      return { liveCount:n }; });

    step('S07/S08 (D233): the tactical "?" overlay lists drag-onto-enemy, shift-queue, and R', function(){
      G.mode='battle'; __FIELD.launched=true; __FIELD.phase='battle';
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true}));
      var ov=document.getElementById('hpTacOverlay');
      if(!ov) throw new Error('tactical overlay did not open');
      var t=ov.textContent||'';
      if(t.indexOf('Charge a foe')<0 || t.indexOf('Drag onto it')<0) throw new Error('tactical overlay missing drag-onto-enemy');
      if(t.indexOf('Queue route')<0 || t.indexOf('Shift+drag')<0) throw new Error('tactical overlay missing shift-queue');
      if(t.indexOf('Keyboard move')<0 || t.indexOf('M, then arrows')<0 || t.indexOf('Shift+Enter')<0) throw new Error('tactical overlay missing the S40 keyboard path');
      if(t.indexOf('Elevation display')<0) throw new Error('tactical overlay missing the R elevation row');
      ov.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      G.mode='menu'; __FIELD.launched=false; __FIELD.phase='idle';
      return { ok:true }; });

    step('GEA-03 (D435): both help surfaces document the Home / Shift+Home camera-recovery keys', function(){
      // the How-to-Play complete reference (list line + two grid rows)
      if(typeof _hpHowToHTML!=='function' && typeof _hpShowHelp!=='function') throw new Error('help builders missing');
      G.mode='menu';
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true}));
      var sheet=document.getElementById('sheetPad')||document.body;
      var t=sheet.textContent||'';
      if(t.indexOf('resets the side-aware overview')<0) throw new Error('How-to-Play missing the Home camera line');
      if(t.indexOf('Reset the 3D camera to the side-aware overview')<0) throw new Error('How-to-Play grid missing the Home row');
      if(t.indexOf('Frame the selected brigade (3D camera)')<0) throw new Error('How-to-Play grid missing the Shift+Home row');
      closeSheetSafe();
      // the tactical "?" overlay compact rows
      G.mode='battle'; __FIELD.launched=true; __FIELD.phase='battle';
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true}));
      var ov=document.getElementById('hpTacOverlay');
      if(!ov) throw new Error('tactical overlay did not open');
      var tt=ov.textContent||'';
      if(tt.indexOf('Overview camera (3D)')<0) throw new Error('tactical overlay missing the Home row');
      if(tt.indexOf('Frame selected (3D)')<0) throw new Error('tactical overlay missing the Shift+Home row');
      ov.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      G.mode='menu'; __FIELD.launched=false; __FIELD.phase='idle';
      return { ok:true }; });

    step('global "?" opens How-to-Play in menu mode', function(){
      G.mode='menu'; __FIELD.launched=false; __FIELD.phase='idle'; closeSheetSafe();
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true}));
      if(!sheetOpen()) throw new Error('"?" did not open the help sheet in menu mode');
      if(pad().indexOf('How to Play')<0) throw new Error('"?" opened a sheet but not How to Play');
      closeSheetSafe();
      return { ok:true }; });

    step('E44: "?" typed INTO an editable field never hijacks the keystroke (input/textarea/select guard)', function(){
      G.mode='menu'; __FIELD.launched=false; __FIELD.phase='idle'; closeSheetSafe();
      var inp=document.createElement('input'); inp.type='text'; inp.id='hpProbeInput'; document.body.appendChild(inp); inp.focus();
      inp.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true}));   // bubbles to document with e.target=input
      var opened=sheetOpen();
      document.body.removeChild(inp);
      if(opened){ closeSheetSafe(); throw new Error('"?" from a focused text input opened the help sheet'); }
      // and the handler still works from a non-editable target afterwards
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true}));
      if(!sheetOpen()) throw new Error('"?" from the document stopped working after the guard');
      closeSheetSafe();
      return { inputGuarded:true }; });

    step('tactical overlay: "?" in battle builds an aria-modal dialog; Escape closes + focus returns', function(){
      G.mode='battle'; __FIELD.launched=true; __FIELD.phase='battle';
      var trigger=document.createElement('button'); trigger.id='hpProbeTrigger'; document.body.appendChild(trigger); trigger.focus();
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true}));
      var ov=document.getElementById('hpTacOverlay');
      if(!ov) throw new Error('"?" did not build the tactical overlay in battle mode');
      if(ov.getAttribute('role')!=='dialog') throw new Error('tactical overlay not role=dialog');
      if(ov.getAttribute('aria-modal')!=='true') throw new Error('tactical overlay not aria-modal');
      var visible=(ov.style.display!=='none');
      if(!visible) throw new Error('tactical overlay not visible after "?"');
      // Escape closes it (the overlay wires its own keydown handler)
      ov.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      var closed=(document.getElementById('hpTacOverlay')===null) || (ov.style.display==='none');
      if(!closed) throw new Error('Escape did not close the tactical overlay');
      var restored=(document.activeElement===trigger);
      document.body.removeChild(trigger);
      if(!restored) throw new Error('focus not returned to the trigger after close (got '+(document.activeElement&&document.activeElement.id)+')');
      G.mode='menu'; __FIELD.launched=false; __FIELD.phase='idle';
      return { ok:true }; });

    step('pause indicator injects + toggles with an aria-live region', function(){
      var root=document.getElementById('fldRoot');
      var made=false;
      if(!root){ root=document.createElement('div'); root.id='fldRoot'; document.body.appendChild(root); made=true; }
      __FIELD.launched=true; __FIELD.phase='battle'; __FIELD.paused=false; __FIELD._apReason='';
      _hpInjectPauseIndicator();
      var ind=document.getElementById('hpPauseInd');
      if(!ind) throw new Error('pause indicator not injected');
      if(ind.getAttribute('aria-live')!=='polite') throw new Error('pause indicator not aria-live=polite');
      _hpUpdatePause();
      if(ind.style.display!=='none') throw new Error('pause indicator should be hidden when not paused');
      __FIELD.paused=true; __FIELD._apReason='a brigade broke';
      _hpUpdatePause();
      if(ind.style.display!=='block') throw new Error('pause indicator should show when paused');
      if(ind.textContent.indexOf('a brigade broke')<0) throw new Error('pause reason not shown: '+ind.textContent);
      // S06 (D231): the aria-live lane is VISUALLY hidden (sr-only clip pattern) — the visible pause state
      // lives in the top-bar #fldPhase chip alone, so no second stacked "PAUSED" badge duplicates it.
      if(ind.style.width!=='1px'||ind.style.height!=='1px'||ind.style.overflow!=='hidden') throw new Error('S06: pause indicator must be a visually-hidden SR lane (1px clip), got w='+ind.style.width+' h='+ind.style.height);
      __FIELD.paused=false; _hpUpdatePause();
      if(ind.style.display!=='none') throw new Error('pause indicator should hide again on resume');
      if(ind.parentNode) ind.parentNode.removeChild(ind);
      if(made && root.parentNode) root.parentNode.removeChild(root);
      __FIELD.launched=false; __FIELD.phase='idle';
      return { ok:true }; });

    step('PURE UI: help paths do not mutate G.campaign or call Math.random', function(){
      var origRand=Math.random, calls=0; var before=G.campaign;
      try { Math.random=function(){ calls++; return 0.5; };
        _hpShowWelcome(); closeSheetSafe(); _hpShowHelp(); closeSheetSafe();
      } finally { Math.random=origRand; }
      if(calls>0) throw new Error('help subsystem called Math.random '+calls+' times');
      if(G.campaign!==before) throw new Error('help subsystem mutated G.campaign');
      return { clean:true }; });

  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  try { var o=document.getElementById('hpTacOverlay'); if(o&&o.parentNode) o.parentNode.removeChild(o); } catch(e){}
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<60;i++){ if(await up(probe))break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GLA }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GLA }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });   // slow-Mac: the 'load' wait stalls while embedded assets stream (the documented gotcha); inline scripts are all the probe needs
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    result.staticScan = staticHpLeakScan();
    if (result.staticScan.leaks.length) { result.ok = false; result.steps.push({ name:'STATIC SCAN: no combat path references the help subsystem', ok:false, err:'_hp* read by: '+result.staticScan.leaks.join(', ') }); }
    else { result.steps.push({ name:'STATIC SCAN: no combat path references the help subsystem', ok:true, v:{ scanned: result.staticScan.scanned } }); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-help-overlay.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-help-overlay ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  const pe = Array.isArray(result.pageerrors) ? result.pageerrors.length : 0;
  const failedSteps = Array.isArray(result.steps) ? result.steps.filter(s => s && s.ok === false).length : 0;
  process.exit((result.ok && pe === 0 && failedSteps === 0) ? 0 : 1);
})();
