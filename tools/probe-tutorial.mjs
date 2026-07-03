#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-tutorial.mjs — E2-i3 (D121) the GUIDED TUTORIAL.
// Verifies: the module loads with a multi-step deck; tutStart opens an ARIA dialog
// at step 1; Next/Back navigate (Back hidden on step 0); the last step's button is
// "To the Field" and finishing closes + sets the seen flag; Esc closes; Arrow keys
// navigate; the step title takes focus (SR announce) + a focus trap exists; reduce-
// motion disables the fade; pure read-out (no campaign mutation, no RNG; the
// localStorage seen-flag is intended). Node-side: a static scan that no combat path
// references the tutorial. Writes shots/probe-tutorial.json.
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

function staticTutLeakScan() {
  const RE = /\btutStart\b|\b_tutRender\b|\b_tutClose\b|\b_tutKey\b|\b_TUT_STEPS\b/;
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
  function ov(){ return document.getElementById('tutOverlay'); }
  function ind(){ var e=document.getElementById('tutStepInd'); return e?e.textContent:''; }
  function clearSeen(){ try{ localStorage.removeItem('gor_tour_seen'); }catch(e){} }
  try {
    if (typeof tutStart!=='function' || typeof _tutRender!=='function' || typeof tutSeen!=='function')
      return JSON.stringify({ok:false,fatal:'tutorial module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('module loads + multi-step deck schema', function(){
      if(!Array.isArray(_TUT_STEPS)||_TUT_STEPS.length<5) throw new Error('expected >=5 tour steps, got '+(_TUT_STEPS?_TUT_STEPS.length:'none'));
      for(var i=0;i<_TUT_STEPS.length;i++){ var s=_TUT_STEPS[i]; if(!s.title||!s.body) throw new Error('step '+i+' missing title/body'); }
      return { steps:_TUT_STEPS.length }; });

    step('tutStart opens an ARIA dialog at step 1 (Back hidden)', function(){
      clearSeen(); tutStart();
      var o=ov(); if(!o) throw new Error('no #tutOverlay');
      if(o.getAttribute('role')!=='dialog') throw new Error('not role=dialog');
      if(o.getAttribute('aria-modal')!=='true') throw new Error('not aria-modal');
      if(o.getAttribute('aria-labelledby')!=='tutTitle') throw new Error('aria-labelledby not tutTitle');
      if(ind().indexOf('Step 1 of ')!==0) throw new Error('not at step 1: '+ind());
      var back=document.getElementById('tutBack'); if(back.style.visibility!=='hidden') throw new Error('Back should be hidden on step 1');
      var title=document.getElementById('tutTitle'); if(!title||title.innerHTML.indexOf(_TUT_STEPS[0].title.slice(0,6))<0) throw new Error('step-1 title not rendered');
      return { ok:true }; });   // leave open for the next step

    step('Next advances; Back returns; Back visible after step 1', function(){
      var body1=document.getElementById('tutBody').innerHTML;
      document.getElementById('tutNext').click();
      if(ind().indexOf('Step 2 of ')!==0) throw new Error('Next did not advance to step 2: '+ind());
      if(document.getElementById('tutBody').innerHTML===body1) throw new Error('body did not change');
      if(document.getElementById('tutBack').style.visibility==='hidden') throw new Error('Back should be visible on step 2');
      document.getElementById('tutBack').click();
      if(ind().indexOf('Step 1 of ')!==0) throw new Error('Back did not return to step 1: '+ind());
      return { ok:true }; });

    step('Arrow keys navigate; Esc closes', function(){
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
      if(ind().indexOf('Step 2 of ')!==0) throw new Error('ArrowRight did not advance: '+ind());
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
      if(ind().indexOf('Step 1 of ')!==0) throw new Error('ArrowLeft did not go back: '+ind());
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      if(ov()) throw new Error('Escape did not close the tour');
      return { ok:true }; });

    step('focus management: the step title is focused (SR announce) + a focus trap exists', function(){
      clearSeen(); tutStart();
      var title=document.getElementById('tutTitle');
      if(document.activeElement!==title) throw new Error('step title not focused on render (got '+(document.activeElement&&document.activeElement.id)+')');
      if(typeof _tutFocusable==='function'){ if(_tutFocusable().length<1) throw new Error('no focusable controls (focus trap would break)'); }
      document.getElementById('tutSkip').click();   // close via Skip
      if(ov()) throw new Error('Skip did not close');
      return { ok:true }; });

    step('last step button is "To the Field" and finishing closes + sets the seen flag', function(){
      clearSeen(); tutStart();
      var n=_TUT_STEPS.length;
      for(var i=0;i<n-1;i++) document.getElementById('tutNext').click();   // advance to the last step
      if(ind().indexOf('Step '+n+' of '+n)!==0) throw new Error('did not reach the last step: '+ind());
      var nb=document.getElementById('tutNext');
      if(nb.textContent.indexOf('Field')<0) throw new Error('last-step button should read "To the Field", got: '+nb.textContent);
      nb.click();
      if(ov()) throw new Error('finishing did not close the tour');
      if(!tutSeen()) throw new Error('finishing did not set the seen flag');
      return { ok:true }; });

    step('reduce-motion disables the fade transition', function(){
      clearSeen(); G.settings.reduceMotion=true; tutStart();
      var o=ov(); var trans=o.style.transition||'';
      if(trans.indexOf('opacity')>=0) throw new Error('reduce-motion should not set an opacity transition, got: '+trans);
      document.getElementById('tutSkip').click(); G.settings.reduceMotion=false;
      return { transition: trans||'(none)' }; });

    step('PURE read-out: no campaign mutation, no RNG (localStorage seen-flag is intended)', function(){
      var origRand=Math.random, calls=0; var before=G.campaign;
      try { Math.random=function(){ calls++; return 0.5; };
        clearSeen(); tutStart(); document.getElementById('tutNext').click(); _tutClose(true);
      } finally { Math.random=origRand; }
      if(calls>0) throw new Error('tutorial called Math.random '+calls+' times (no RNG allowed)');
      if(G.campaign!==before) throw new Error('tutorial mutated G.campaign');
      return { clean:true }; });

    step('tutSeen reflects localStorage', function(){
      clearSeen(); if(tutSeen()) throw new Error('tutSeen true after clear');
      tutStart(); document.getElementById('tutSkip').click();
      if(!tutSeen()) throw new Error('tutSeen false after a completed/closed tour');
      return { ok:true }; });

    // ---- bug-hunt fixes (E2-i3) ----
    step('FOCUS TRAP: forward Tab REACHES Skip; the cycle is symmetric (TUT-A11Y-01)', function(){
      clearSeen(); tutStart();
      document.getElementById('tutNext').click();   // step 2 so Back is visible+enabled
      var skip=document.getElementById('tutSkip'), back=document.getElementById('tutBack'), next=document.getElementById('tutNext');
      function tab(sh){ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:!!sh,bubbles:true})); }
      next.focus(); tab();
      if(document.activeElement!==skip) throw new Error('forward Tab from Next must reach Skip, got '+(document.activeElement&&document.activeElement.id));
      tab(); if(document.activeElement!==back) throw new Error('forward Tab from Skip must reach Back, got '+(document.activeElement&&document.activeElement.id));
      tab(); if(document.activeElement!==next) throw new Error('forward Tab from Back must reach Next, got '+(document.activeElement&&document.activeElement.id));
      skip.focus(); tab(true);
      if(document.activeElement!==next) throw new Error('shift+Tab from Skip must wrap to Next, got '+(document.activeElement&&document.activeElement.id));
      _tutClose(false);
      return { ok:true }; });

    step('MODAL "?" guard: ? does NOT open How-to-Play behind the tour (TUT-DOM-01)', function(){
      clearSeen(); tutStart();
      var orig=window.openSheet, calls=0;
      window.openSheet=function(){ calls++; return (typeof orig==='function')?orig.apply(this,arguments):undefined; };
      try { document.dispatchEvent(new KeyboardEvent('keydown',{key:'?',bubbles:true})); }
      finally { window.openSheet=orig; }
      if(calls>0) throw new Error('"?" opened a sheet ('+calls+') behind the modal tour');
      if(!document.getElementById('tutOverlay')) throw new Error('the tour was disrupted by "?"');
      _tutClose(false);
      return { ok:true }; });

    step('MODAL inert: background is aria-hidden under the tour + restored on close (TUT-A11Y-02)', function(){
      var bg=document.createElement('div'); bg.id='tutProbeBg'; document.body.appendChild(bg);
      clearSeen(); tutStart();
      if(bg.getAttribute('aria-hidden')!=='true') throw new Error('a background sibling was not aria-hidden under the modal');
      if(document.getElementById('tutOverlay').getAttribute('aria-hidden')==='true') throw new Error('the tour overlay must NOT be aria-hidden');
      _tutClose(false);
      if(bg.getAttribute('aria-hidden')==='true') throw new Error('background aria-hidden not restored on close');
      document.body.removeChild(bg);
      return { ok:true }; });

    step('A11Y: title aria-label conveys "Step N of M" + heading (TUT-A11Y-03)', function(){
      clearSeen(); tutStart();
      var t=document.getElementById('tutTitle'), lbl=t.getAttribute('aria-label')||'';
      if(lbl.indexOf('Step 1 of ')!==0) throw new Error('title aria-label should start with "Step 1 of": '+lbl);
      if(lbl.indexOf(t.textContent.slice(0,6))<0) throw new Error('title aria-label missing the heading text');
      _tutClose(false);
      return { ok:true }; });

    step('DOUBLE-START preserves the focus-restore target + leaves no stale aria-hidden (TUT-CORR-01)', function(){
      var launcher=document.createElement('button'); launcher.id='tutProbeLauncher'; document.body.appendChild(launcher); launcher.focus();
      clearSeen(); tutStart(); tutStart();   // double-start
      _tutClose(false);
      var restored=(document.activeElement===launcher);
      var stale=(launcher.getAttribute('aria-hidden')==='true');
      document.body.removeChild(launcher);
      if(!restored) throw new Error('focus not restored to the launcher after double-start+close (got '+(document.activeElement&&document.activeElement.id)+')');
      if(stale) throw new Error('launcher left aria-hidden after double-start+close (inert leak)');
      return { ok:true }; });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  // tidy up any lingering overlay
  try { var o=document.getElementById('tutOverlay'); if(o&&o.parentNode) o.parentNode.removeChild(o); } catch(e){}
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
    await page.goto(probe, { waitUntil:'load', timeout:60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    result.staticScan = staticTutLeakScan();
    if (result.staticScan.leaks.length) { result.ok = false; result.steps.push({ name:'STATIC SCAN: no combat path references the tutorial', ok:false, err:'tut* read by: '+result.staticScan.leaks.join(', ') }); }
    else { result.steps.push({ name:'STATIC SCAN: no combat path references the tutorial', ok:true, v:{ scanned: result.staticScan.scanned } }); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-tutorial.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-tutorial ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-tutorial.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-tutorial.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-tutorial: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-tutorial: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-tutorial: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
