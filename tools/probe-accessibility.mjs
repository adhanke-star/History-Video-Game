#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-accessibility.mjs — E3-i1 (D125) the ACCESSIBILITY HUB + the 4 a11y modes.
// Verifies: the module loads; the 4 modes apply (high-contrast -> <html data-a11y-contrast>;
// dyslexia -> data-a11y-text; CVD -> a11yCvd+cbAids in lockstep; SR-narration -> #a11yLive
// live region + a11yAnnounce gated by the flag) + the reduced-motion mirror; the injected
// <style> carries the contrast var-override + the dyslexia font rule; a11yPanelHTML renders
// the 5 toggle rows (menu has a Back button, desk does not) with aria-pressed; a11yWire wires
// + a click flips the flag + aria-pressed; a11yTurnSummary builds a sensible string;
// persistence writes/reads the cw_a11y bundle (boot seeds DEFAULTS-ONLY); the menu button
// injects/dedupes/re-injects (no latch); PURITY — render/toggle never call Math.random nor
// write a combat-path knob; and a STATIC SCAN proves no tactical/combat/bridge/resolve file
// references the a11y-family symbols. Writes shots/probe-accessibility.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// A11Y-01: lock the byte-identical-combat claim STRUCTURALLY — no tactical/combat/bridge/
// resolve file may reference the a11y API or the a11y flags. cbAids is a pre-existing base
// flag (NOT an a11y symbol) so it is intentionally excluded from the scan.
function staticA11yLeakScan() {
  const A11Y_RE = /a11y[A-Z]|A11Y\b|a11yContrast|a11yDyslexia|a11yCvd|a11yNarrate/;
  const files = [];
  try { const TACT = join(ROOT, 'src', 'tactical'); for (const f of readdirSync(TACT)) if (f.endsWith('.js')) files.push(join(TACT, f)); } catch (e) {}
  for (const f of ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js', '80-victory.js']) files.push(join(ROOT, 'src', f));
  const leaks = [];
  for (const f of files) { try { if (A11Y_RE.test(readFileSync(f, 'utf8'))) leaks.push(f.split('/').pop()); } catch (e) {} }
  return { scanned: files.length, leaks };
}
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
  function root(){ return document.documentElement; }
  try {
    if (typeof a11yApply!=='function' || typeof a11yToggle!=='function' || typeof a11yBootLoad!=='function' ||
        typeof a11yOpenMenu!=='function' || typeof a11yPanelHTML!=='function' || typeof a11yAnnounce!=='function' ||
        typeof a11yTurnSummary!=='function' || typeof a11yInjectMenuButton!=='function' || typeof a11yOn!=='function')
      return JSON.stringify({ok:false,fatal:'accessibility module missing'});
    G.settings=G.settings||{}; G.mode='menu'; G.campaign=null;
    // snapshot the player's real a11y settings to restore at the end
    var SAVE={}; ['a11yContrast','a11yDyslexia','a11yCvd','a11yNarrate','reduceMotion','cbAids'].forEach(function(k){ SAVE[k]=G.settings[k]; });
    function reset(){ delete G.settings.a11yContrast; delete G.settings.a11yDyslexia; delete G.settings.a11yCvd; delete G.settings.a11yNarrate; delete G.settings.reduceMotion; delete G.settings.cbAids; a11yApply(); }

    step('the injected <style> carries the high-contrast var-override + the dyslexia font rule', function(){
      reset();
      var el=document.getElementById('a11yModeStyles'); if(!el) throw new Error('no #a11yModeStyles style element after apply');
      var css=el.textContent||'';
      if(css.indexOf('data-a11y-contrast="high"')<0) throw new Error('no high-contrast selector in the stylesheet');
      if(css.indexOf('--rule:#e8c860')<0) throw new Error('high-contrast did not override the --rule token');
      if(css.indexOf(':focus-visible')<0) throw new Error('no universal focus-ring rule');
      if(css.indexOf('data-a11y-text="dyslexia"')<0) throw new Error('no dyslexia selector');
      if(!/font-family:[^;]*sans-serif/i.test(css)) throw new Error('dyslexia rule has no sans-serif font stack');
      return { ok:true }; });

    step('HIGH CONTRAST: toggle sets the flag + <html data-a11y-contrast=high>; off removes it', function(){
      reset();
      if(a11yOn('a11yContrast')) throw new Error('contrast should start off');
      a11yToggle('a11yContrast');
      if(!G.settings.a11yContrast) throw new Error('flag not set');
      if(root().getAttribute('data-a11y-contrast')!=='high') throw new Error('root attr not set to high');
      a11yToggle('a11yContrast');
      if(G.settings.a11yContrast) throw new Error('flag not cleared');
      if(root().getAttribute('data-a11y-contrast')) throw new Error('root attr not removed when off');
      return { ok:true }; });

    step('DYSLEXIA: toggle sets the flag + <html data-a11y-text=dyslexia>; off removes it', function(){
      reset();
      a11yToggle('a11yDyslexia');
      if(!G.settings.a11yDyslexia || root().getAttribute('data-a11y-text')!=='dyslexia') throw new Error('dyslexia not applied');
      a11yToggle('a11yDyslexia');
      if(G.settings.a11yDyslexia || root().getAttribute('data-a11y-text')) throw new Error('dyslexia not cleared');
      return { ok:true }; });

    step('CVD == cbAids (single source of truth): toggle flips cbAids; a11yOn(cvd) reflects it', function(){
      reset();
      if(a11yOn('a11yCvd')) throw new Error('cvd should start off');
      a11yToggle('a11yCvd');
      if(!G.settings.cbAids) throw new Error('cvd toggle did not set cbAids');
      if(!a11yOn('a11yCvd')) throw new Error('a11yOn(cvd) false after enable');
      a11yToggle('a11yCvd');
      if(G.settings.cbAids) throw new Error('cvd off did not clear cbAids');
      return { ok:true }; });

    step('CVD NO RESURRECTION (bug-hunt I3-1/I5-1): a base cbAids-OFF survives apply + reload', function(){
      reset();
      a11yToggle('a11yCvd');                  // enable CVD in the hub -> cbAids true
      if(!G.settings.cbAids) throw new Error('precondition: cbAids should be on');
      G.settings.cbAids=false;                // simulate the FROZEN base Settings "Colour-blind Aids: Off"
      a11yApply();                            // any subsequent apply must NOT force cbAids back on
      if(G.settings.cbAids) throw new Error('a11yApply RESURRECTED a base cbAids-off choice');
      a11yBootLoad();                         // the reload path must not resurrect it either
      if(G.settings.cbAids) throw new Error('a11yBootLoad resurrected cbAids');
      reset();
      return { ok:true }; });

    step('SR NARRATION default ON; #a11yLive is a polite live region; toggle gates a11yAnnounce', function(){
      reset();
      if(!a11yOn('a11yNarrate')) throw new Error('narration should default ON');
      var live=document.getElementById('a11yLive');
      if(!live) throw new Error('no #a11yLive region');
      if(live.getAttribute('aria-live')!=='polite') throw new Error('live region not aria-live=polite');
      a11yAnnounce('Test situation alpha');
      if(String(live.textContent||'').indexOf('Test situation alpha')<0) throw new Error('announce did not write the live region');
      // turning narration OFF must silence announce
      a11yToggle('a11yNarrate');
      if(a11yOn('a11yNarrate')) throw new Error('narration did not turn off');
      live.textContent='';
      a11yAnnounce('Should be suppressed');
      if(String(live.textContent||'').length) throw new Error('announce wrote while narration off');
      a11yToggle('a11yNarrate');   // restore default
      return { ok:true }; });

    step('a11yTurnSummary uses the ENGINE side value "CS"->Confederate (bug-hunt I6-1; not "CSA")', function(){
      // the real engine side is "CS"/"US" — feed the REAL value so this guards the fix (the old
      // ==="CSA" check would mislabel a CS player "Union").
      var C={ side:'CS', clock:{year:1863}, idx:0 }; G.campaign=C;
      var s=a11yTurnSummary(C);
      if(!s || s.length<8) throw new Error('empty/short summary: "'+s+'"');
      if(/undefined|null|\\[object/.test(s)) throw new Error('summary leaks a placeholder: "'+s+'"');
      if(s.indexOf('Confederate')<0) throw new Error('CS side not labelled Confederate: "'+s+'"');
      // and a Union ("US") campaign must say Union
      var sUS=a11yTurnSummary({ side:'US', clock:{year:1864}, idx:0 });
      if(sUS.indexOf('Union')<0) throw new Error('US side not labelled Union: "'+sUS+'"');
      // with NO campaign anywhere (arg null AND no G.campaign fallback) -> empty string
      G.campaign=null;
      if(a11yTurnSummary(null)!=='') throw new Error('no-campaign should yield empty string');
      return { sample:s }; });

    step('REDUCED MOTION mirror: toggle flips G.settings.reduceMotion', function(){
      reset();
      var before=!!G.settings.reduceMotion;
      a11yToggle('reduceMotion');
      if(!!G.settings.reduceMotion===before) throw new Error('reduceMotion did not flip');
      a11yToggle('reduceMotion');
      if(!!G.settings.reduceMotion!==before) throw new Error('reduceMotion did not flip back');
      return { ok:true }; });

    step('a11yPanelHTML(menu): 5 toggle rows + a Back button; aria-pressed reflects state', function(){
      reset();
      G.settings.a11yContrast=true; a11yApply();
      var h=a11yPanelHTML('menu');
      var d=document.createElement('div'); d.innerHTML=h;
      var toggles=d.querySelectorAll('[data-a11y-flag]');
      if(toggles.length!==5) throw new Error('expected 5 toggle rows, got '+toggles.length);
      if(!d.querySelector('#a11yBack')) throw new Error('menu ctx missing Back button');
      var ct=d.querySelector('[data-a11y-flag="a11yContrast"]');
      if(!ct||ct.getAttribute('aria-pressed')!=='true') throw new Error('contrast toggle not aria-pressed=true when on');
      reset();
      return { toggles:toggles.length }; });

    step('a11yPanelHTML(desk): the same rows but NO Back button', function(){
      reset();
      var d=document.createElement('div'); d.innerHTML=a11yPanelHTML('desk');
      if(d.querySelectorAll('[data-a11y-flag]').length!==5) throw new Error('desk ctx missing toggle rows');
      if(d.querySelector('#a11yBack')) throw new Error('desk ctx must NOT have a Back button');
      return { ok:true }; });

    step('a11yWire(menu): clicking a toggle flips the flag + aria-pressed (live overlay)', function(){
      reset();
      a11yOpenMenu();
      var btn=document.querySelector('[data-a11y-flag="a11yDyslexia"]');
      if(!btn) throw new Error('no dyslexia toggle in the opened overlay');
      if(btn.getAttribute('aria-pressed')!=='false') throw new Error('dyslexia should start off');
      btn.click();
      if(!G.settings.a11yDyslexia) throw new Error('click did not set dyslexia');
      var btn2=document.querySelector('[data-a11y-flag="a11yDyslexia"]');   // fresh node after rerender
      if(!btn2||btn2.getAttribute('aria-pressed')!=='true') throw new Error('aria-pressed not true after rerender');
      reset();
      return { ok:true }; });

    step('PERSISTENCE: a toggle writes the cw_a11y bundle; boot seeds DEFAULTS-ONLY', function(){
      reset();
      a11yToggle('a11yContrast');
      var raw=window.localStorage.getItem('cw_a11y'); if(!raw) throw new Error('no cw_a11y bundle written');
      var b=JSON.parse(raw); if(b.a11yContrast!==true) throw new Error('bundle a11yContrast not true: '+b.a11yContrast);
      // boot must NOT override an in-memory value
      G.settings.a11yContrast=false;
      a11yBootLoad();
      if(G.settings.a11yContrast!==false) throw new Error('boot overrode an existing value');
      // boot SHOULD seed when absent
      delete G.settings.a11yContrast;
      a11yBootLoad();
      if(G.settings.a11yContrast!==true) throw new Error('boot did not seed from the bundle');
      reset(); window.localStorage.removeItem('cw_a11y');
      return { ok:true }; });

    step('NEW-1 persistence: a menu-time mode-OFF is written to gor_save (no campaign gate)', function(){
      var _g=window.localStorage.getItem('gor_save');
      try {
        reset(); G.campaign=null;             // on the menu, no active campaign
        a11yToggle('a11yContrast');           // ON
        a11yToggle('a11yContrast');           // OFF again
        var raw=window.localStorage.getItem('gor_save');
        if(!raw) throw new Error('no gor_save written by a menu-time toggle (campaign-gate regression)');
        var sv=JSON.parse(raw);
        if(!sv.settings || sv.settings.a11yContrast!==false) throw new Error('gor_save did not capture the menu-time a11yContrast=false');
      } finally {
        if(_g==null) window.localStorage.removeItem('gor_save'); else window.localStorage.setItem('gor_save',_g);
        reset();
      }
      return { ok:true }; });

    step('MENU BUTTON: a11yInjectMenuButton injects once, dedupes, re-injects after a rebuild (no latch)', function(){
      var synth=null;
      if(!document.querySelector('.gn-col:last-child .gn-classifieds')){
        synth=document.createElement('div'); synth.innerHTML='<div class="gn-col"><div class="gn-classifieds"></div></div>'; document.body.appendChild(synth);
      }
      var ex=document.getElementById('gnA11y'); if(ex&&ex.parentNode) ex.parentNode.removeChild(ex);
      a11yInjectMenuButton();
      if(document.querySelectorAll('[id="gnA11y"]').length!==1) throw new Error('inject did not produce exactly one button');
      a11yInjectMenuButton();
      if(document.querySelectorAll('[id="gnA11y"]').length!==1) throw new Error('second inject duplicated (dedupe failed)');
      var b2=document.getElementById('gnA11y'); if(b2&&b2.parentNode) b2.parentNode.removeChild(b2);
      a11yInjectMenuButton();
      if(document.querySelectorAll('[id="gnA11y"]').length!==1) throw new Error('did not re-inject after removal (latch regression)');
      var fin=document.getElementById('gnA11y'); if(fin&&fin.parentNode) fin.parentNode.removeChild(fin);
      if(synth&&synth.parentNode) synth.parentNode.removeChild(synth);
      return { ok:true }; });

    step('PURITY (spy): apply/toggle/render never call Math.random nor write a combat-path knob', function(){
      reset();
      var origRand=Math.random, randCalls=0;
      var snap={ tacticalPreset:G.settings.tacticalPreset, tacticalFog:G.settings.tacticalFog, tacticalAutoPause:G.settings.tacticalAutoPause };
      try {
        Math.random=function(){ randCalls++; return 0.5; };
        a11yApply(); a11yPanelHTML('menu'); a11yToggle('a11yContrast'); a11yToggle('a11yContrast');
        a11yToggle('a11yDyslexia'); a11yToggle('a11yDyslexia'); a11yTurnSummary({side:'US',clock:{year:1864}});
      } finally { Math.random=origRand; }
      if(randCalls) throw new Error('a11y called Math.random '+randCalls+'x');
      if(G.settings.tacticalPreset!==snap.tacticalPreset || G.settings.tacticalFog!==snap.tacticalFog || G.settings.tacticalAutoPause!==snap.tacticalAutoPause)
        throw new Error('a11y wrote a combat-path knob');
      reset();
      return { clean:true }; });

    step('A11Y of the controls themselves: toggles are real <button> with aria-pressed + aria-label', function(){
      reset();
      var d=document.createElement('div'); d.innerHTML=a11yPanelHTML('menu');
      var btns=d.querySelectorAll('[data-a11y-flag]');
      for(var i=0;i<btns.length;i++){
        if(btns[i].tagName!=='BUTTON') throw new Error('toggle not a <button>');
        if(btns[i].getAttribute('aria-pressed')==null) throw new Error('toggle missing aria-pressed');
        var al=String(btns[i].getAttribute('aria-label')||'');
        if(al.length<5 || /^(on|off)$/i.test(al)) throw new Error('toggle aria-label weak: "'+al+'"');
      }
      if(!d.querySelector('[role="group"][aria-label]')) throw new Error('no labelled modes group');
      return { n:btns.length }; });

    // restore the player's real settings
    ['a11yContrast','a11yDyslexia','a11yCvd','a11yNarrate','reduceMotion','cbAids'].forEach(function(k){
      if(SAVE[k]==null){ try{ delete G.settings[k]; }catch(e){} } else G.settings[k]=SAVE[k];
    });
    a11yApply();
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
    result.staticScan = staticA11yLeakScan();
    if (result.staticScan.leaks.length) { result.ok = false; result.steps.push({ name:'STATIC SCAN: no combat path references the a11y API', ok:false, err:'a11y referenced by: '+result.staticScan.leaks.join(', ') }); }
    else { result.steps.push({ name:'STATIC SCAN: no combat path references the a11y API', ok:true, v:{ scanned: result.staticScan.scanned } }); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-accessibility.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-accessibility ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
