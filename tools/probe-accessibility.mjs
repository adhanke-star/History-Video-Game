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
// write a combat-path knob; and a STATIC SCAN proves no tactical/combat/bridge/resolve code
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
  for (const f of files) { try { if (A11Y_RE.test(stripForSymbolScan(readFileSync(f, 'utf8')))) leaks.push(f.split('/').pop()); } catch (e) {} }
  return { scanned: files.length, leaks };
}

function stripForSymbolScan(src) {
  let out = '', q = '', esc = false, line = false, block = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i], n = src[i + 1] || '';
    if (line) { if (c === '\n') { line = false; out += '\n'; } else out += ' '; continue; }
    if (block) { if (c === '*' && n === '/') { block = false; out += '  '; i++; } else out += (c === '\n' ? '\n' : ' '); continue; }
    if (q) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === q) q = '';
      out += (c === '\n' ? '\n' : ' ');
      continue;
    }
    if (c === '/' && n === '/') { line = true; out += '  '; i++; continue; }
    if (c === '/' && n === '*') { block = true; out += '  '; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; out += ' '; continue; }
    out += c;
  }
  return out;
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

    // ===== E3-i2 (D126): per-surface WCAG 2.2 AA assertions =====
    var _hx=function(h){h=String(h).replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];};
    var _lin=function(c){c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
    var _lum=function(rgb){return 0.2126*_lin(rgb[0])+0.7152*_lin(rgb[1])+0.0722*_lin(rgb[2]);};
    var _ratio=function(fg,bg){var a=_lum(_hx(fg)),b=_lum(_hx(bg)),hi=Math.max(a,b),lo=Math.min(a,b);return (hi+0.05)/(lo+0.05);};
    var _ratioRgb=function(rgb,bg){var a=_lum(rgb),b=_lum(_hx(bg)),hi=Math.max(a,b),lo=Math.min(a,b);return (hi+0.05)/(lo+0.05);};
    var _composite=function(fg,bg,al){var f=_hx(fg),b=_hx(bg);return [Math.round(f[0]*al+b[0]*(1-al)),Math.round(f[1]*al+b[1]*(1-al)),Math.round(f[2]*al+b[2]*(1-al))];};
    var _parseRgb=function(s){var m=String(s).match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)/);return m?[+m[1],+m[2],+m[3]]:null;};
    var _effOpacity=function(el){var o=1,n=el;while(n&&n.nodeType===1){var c=getComputedStyle(n).opacity;if(c!=='')o*=parseFloat(c);n=n.parentElement;}return o;};

    step('AA cascade: --rule -> #a89066 and --blood-lt -> #d8745c on <html> (always-on, mode-independent)', function(){
      reset();
      var cs=getComputedStyle(document.documentElement);
      var rule=String(cs.getPropertyValue('--rule')).trim().toLowerCase(), blood=String(cs.getPropertyValue('--blood-lt')).trim().toLowerCase();
      if(rule!=='#a89066') throw new Error('--rule not redefined: "'+rule+'"');
      if(blood!=='#d8745c') throw new Error('--blood-lt not redefined: "'+blood+'"');
      return { rule:rule, blood:blood }; });

    step('AA cascade reaches FROZEN base classes: .title-sub computes #a89066, .tagn computes #d8745c', function(){
      reset();
      var t=document.createElement('div'); t.className='title-sub'; document.body.appendChild(t);
      var g=document.createElement('span'); g.className='tagn'; document.body.appendChild(g);
      var tc=_parseRgb(getComputedStyle(t).color), gc=_parseRgb(getComputedStyle(g).color);
      document.body.removeChild(t); document.body.removeChild(g);
      if(!tc||tc[0]!==168||tc[1]!==144||tc[2]!==102) throw new Error('.title-sub color not #a89066: '+JSON.stringify(tc));
      if(!gc||gc[0]!==216||gc[1]!==116||gc[2]!==92) throw new Error('.tagn (--blood-lt) color not #d8745c: '+JSON.stringify(gc));
      return { titleSub:tc, tagn:gc }; });

    step('the always-on AA + HC-extension rules are present in the injected stylesheet', function(){
      var css=(document.getElementById('a11yModeStyles')||{}).textContent||'';
      var need=[':root{--rule:#a89066;--blood-lt:#d8745c;}',':focus-visible{','.upg[aria-pressed="true"]:focus-visible',
        '#wdContent','[id^="wdTab_"][aria-pressed="true"]','#fldHud','.sheet [style*="color:var(--rule)"]','#fldAudioPanel button'];
      for(var i=0;i<need.length;i++) if(css.indexOf(need[i])<0) throw new Error('stylesheet missing: '+need[i]);
      return { rules:need.length }; });

    step('toast is an assistive-tech status region (WCAG 4.1.3)', function(){
      reset();
      var t=document.getElementById('toast'); if(!t) throw new Error('no #toast element');
      if(t.getAttribute('aria-live')!=='polite') throw new Error('toast not aria-live=polite');
      return { ok:true }; });

    step('the canonical fixed palette clears AA on its grounds (text 4.5 / fill 3 / composited)', function(){
      var fails=[];
      var text=[['#a89066','#26200f'],['#a89066','#2c2014'],['#d8745c','#241a10'],['#d8745c','#161009'],['#d07060','#26200f'],
        ['#639452','#26200f'],['#739850','#26200f'],['#da6a5a','#26200f'],['#6a9a58','#211c0d'],['#d06862','#211c0d'],
        ['#65974f','#26200f'],['#d56760','#26200f'],['#6f9e5a','#26200f'],['#699952','#26200f'],['#d88878','#2b1e10'],['#e8784a','#2b1e10']];
      for(var i=0;i<text.length;i++){var r=_ratio(text[i][0],text[i][1]);if(r<4.5)fails.push('TEXT '+text[i][0]+'/'+text[i][1]+'='+r.toFixed(2));}
      var fill=[['#ad4133','#1c180b'],['#4d703c','#1c180b'],['#4f7040','#1c180b'],['#b84038','#1c180b'],['#639452','#1c180b'],['#d07060','#1c180b'],['#8a7258','#161b22'],['#9c7a3c','#26200f']];
      for(var j=0;j<fill.length;j++){var rf=_ratio(fill[j][0],fill[j][1]);if(rf<3)fails.push('FILL '+fill[j][0]+'/'+fill[j][1]+'='+rf.toFixed(2));}
      var dead=_ratioRgb(_composite('#d49898','#111517',0.8),'#111517'); if(dead<4.5)fails.push('officer-dead@.8='+dead.toFixed(2));
      var ammo=_ratioRgb(_composite('#d49888','#111517',0.8),'#111517'); if(ammo<4.5)fails.push('ammo@.8='+ammo.toFixed(2));
      if(fails.length) throw new Error(fails.join(' ; '));
      return { textPairs:text.length, fillPairs:fill.length }; });

    step('RENDER-SAMPLE: meter status words render at FULL opacity & clear 4.5 (the .85-row-group compositing fix: _brgBar + _morMeter)', function(){
      // exercises the REAL DOM cascade, not the bare palette: a .85 row-opacity composites onto a
      // child even if the child sets opacity:1, so the fix moves the dimming to the LABEL span only.
      // _morMeter + _brgBar are global; the blockade meter() closure uses the identical structure.
      var html='', n=0;
      if(typeof _brgBar==='function'){ html+=_brgBar('Morale',90)+_brgBar('Supply',20); n+=2; }
      if(typeof _morMeter==='function'){ html+=_morMeter('National will',80)+_morMeter('Casualties',20); n+=2; }
      if(!n) return { skipped:'no meter fns' };
      var host=document.createElement('div'); host.style.cssText='position:absolute;left:-9999px;background:#26200f;padding:8px';
      host.innerHTML=html; document.body.appendChild(host);
      try {
        var spans=host.querySelectorAll('span'), vals=[];
        for(var i=0;i<spans.length;i++){ var st=spans[i].getAttribute('style')||''; if(/color:/.test(st)) vals.push(spans[i]); }
        if(vals.length<n) throw new Error('expected '+n+' colored value spans, found '+vals.length);
        for(var k=0;k<vals.length;k++){
          var sp=vals[k], eff=_effOpacity(sp);
          if(eff<0.999) throw new Error('value span effective opacity '+eff.toFixed(2)+' (<1 -> still dimmed by an ancestor .85 row group)');
          var rgb=_parseRgb(getComputedStyle(sp).color), r=_ratioRgb(rgb,'#26200f');
          if(r<4.5) throw new Error('meter status value '+JSON.stringify(rgb)+' ratio '+r.toFixed(2)+' < 4.5');
        }
      } finally { document.body.removeChild(host); }
      return { sampled:vals.length }; });

    step('HIGH-CONTRAST lifts the desk tab body + the tactical HUD to a black ground', function(){
      reset();
      G.settings.a11yContrast=true; a11yApply();
      var wd=document.createElement('div'); wd.id='wdContent'; wd.innerHTML='<span>x</span>'; document.body.appendChild(wd);
      var hud=document.createElement('div'); hud.id='fldHud'; document.body.appendChild(hud);
      var wdbg=_parseRgb(getComputedStyle(wd).backgroundColor), hudbg=_parseRgb(getComputedStyle(hud).backgroundColor);
      document.body.removeChild(wd); document.body.removeChild(hud); reset();
      if(!wdbg||wdbg[0]>8||wdbg[1]>8||wdbg[2]>8) throw new Error('#wdContent not blackened under HC: '+JSON.stringify(wdbg));
      if(!hudbg||hudbg[0]>8||hudbg[1]>8||hudbg[2]>8) throw new Error('#fldHud not blackened under HC: '+JSON.stringify(hudbg));
      return { ok:true }; });

    step('HIGH-CONTRAST must NOT touch the LIGHT main-menu broadsheet (.gn-paper)', function(){
      reset();
      var css=(document.getElementById('a11yModeStyles')||{}).textContent||'';
      if(/\\.gn-/.test(css)) throw new Error('an injected a11y rule targets a .gn-* menu node');
      var gp=document.createElement('div'); gp.className='gn-paper'; document.body.appendChild(gp);
      var bgNorm=_parseRgb(getComputedStyle(gp).backgroundColor);
      G.settings.a11yContrast=true; a11yApply();
      var bgHC=_parseRgb(getComputedStyle(gp).backgroundColor);
      document.body.removeChild(gp); reset();
      if(bgNorm && bgNorm[0]>200){ if(!bgHC||bgHC[0]<200) throw new Error('HC darkened the light .gn-paper: '+JSON.stringify(bgHC)); }
      return { gnPaperBg:bgNorm }; });

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
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:60000 });
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


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-accessibility.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-accessibility.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-accessibility: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-accessibility: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-accessibility: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
