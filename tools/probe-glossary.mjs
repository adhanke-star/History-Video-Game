#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-glossary.mjs — E2-i2 (D120) the INLINE GLOSSARY.
// Verifies: matchers build from the codex (longest-first, min-length/acronym rule);
// glDecorate wraps the FIRST occurrence of known terms (once per term per container)
// in accessible .gl-term <button>s whose aria-label carries the def and starts with
// the visible term (WCAG 2.5.3); word-boundary correctness (no substring matches);
// skip-zones (button/a/.cx-card/#cxList/[data-no-gloss]) untouched; existing child
// elements preserved (no HTML corruption); idempotent re-decorate; tooltip show/hide
// + reduce-motion; pure read-out; and the _wdRefresh hook decorates the teaching
// tabs but NOT others. Node-side: a static scan that no combat path references gl*.
// Writes shots/probe-glossary.json.
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
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }

// lock the byte-identity claim: no tactical/combat/bridge/resolve file references gl*
function staticGlLeakScan() {
  const GL_RE = /\bglDecorate\b|\bglStartGlossary\b|\b_glBuildMatchers\b|\b_glDecorateTextNode\b|\b_glShowTip\b/;
  const files = [];
  try { const TACT = join(ROOT, 'src', 'tactical'); for (const f of readdirSync(TACT)) if (f.endsWith('.js')) files.push(join(TACT, f)); } catch (e) {}
  for (const f of ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js', '80-victory.js']) files.push(join(ROOT, 'src', f));
  const leaks = [];
  for (const f of files) { try { if (GL_RE.test(readFileSync(f, 'utf8'))) leaks.push(f.split('/').pop()); } catch (e) {} }
  return { scanned: files.length, leaks };
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mk(html){ var d=document.createElement('div'); d.innerHTML=html; document.body.appendChild(d); return d; }
  function mkC(){ var C={ side:'US', iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:2,won:1,infl:5000,suff:4000},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; if(typeof _t1InitAll==='function') _t1InitAll(C); return C; }
  // matcher surfaces (the spellings prose uses) keyed by lowercase surface
  function surfMap(){ var m=_glBuildMatchers(); var byS={}; for(var i=0;i<m.length;i++) byS[m[i].surface.toLowerCase()]=m[i]; return byS; }
  function need(byS,s){ if(!byS[s]) throw new Error('expected matcher surface MISSING from the deck: "'+s+'" (the probe is anchored to real shipped data)'); return byS[s].surface; }
  try {
    if (typeof glDecorate!=='function' || typeof _glBuildMatchers!=='function' || typeof cxLookupShort!=='function')
      return JSON.stringify({ok:false,fatal:'glossary module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('matchers build (longest-first; word-char bounded; derived surfaces incl. acronym + bare forms)', function(){
      var m=_glBuildMatchers(); if(!m.length) throw new Error('no matchers built');
      for(var i=1;i<m.length;i++){ if(m[i].len>m[i-1].len) throw new Error('not sorted longest-first at '+i); }
      for(var j=0;j<m.length;j++){ var s=m[j].surface;
        if(s.length<4 && !/^[A-Z0-9]{2,}$/.test(s)) throw new Error('too-short non-acronym surface leaked: '+s);
        if(!/^[A-Za-z0-9]/.test(s) || !/[A-Za-z0-9]$/.test(s)) throw new Error('surface not word-char-bounded (would be a dead \\\\b matcher): "'+s+'"'); }
      var byS=surfMap();
      // the derivation must produce the bare/acronym forms the prose actually uses
      need(byS,'reconstruction'); need(byS,'secession'); need(byS,'usct'); need(byS,'lost cause'); need(byS,'contraband'); need(byS,'blockade');
      return { matchers:m.length }; });

    step('glDecorate wraps the FIRST occurrence (once per term); aria-label leads with the VISIBLE text + def', function(){
      var box=mk('<p>The era of Reconstruction reshaped the South; Reconstruction is named again to test single-wrap.</p>'); glDecorate(box);
      var terms=box.querySelectorAll('.gl-term'); if(terms.length<1) throw new Error('no term wrapped');
      var firstId=terms[0].getAttribute('data-gl-id'), dup=0;
      for(var i=0;i<terms.length;i++){ if(terms[i].getAttribute('data-gl-id')===firstId) dup++; }
      if(dup>1) throw new Error('same term wrapped '+dup+' times (should be once per container)');
      var b=terms[0], lbl=b.getAttribute('aria-label')||'', vis=b.textContent||'';
      if(lbl.indexOf(vis)!==0) throw new Error('aria-label must START with the VISIBLE matched text (WCAG 2.5.3): vis="'+vis+'" lbl="'+lbl+'"');
      if(lbl.indexOf(b.getAttribute('data-gl-short').slice(0,12))<0) throw new Error('aria-label missing the def');
      if(b.tagName!=='BUTTON') throw new Error('trigger must be a <button>');
      document.body.removeChild(box);
      return { matched:vis, wrapped:terms.length }; });

    step('PARENTHETICAL/ACRONYM/ALIAS surfaces decorate (the trailing-\\\\b regression class)', function(){
      // these surfaces are DERIVED from terms like "United States Colored Troops (USCT)",
      // "The Lost Cause (Myth)", "Contraband (of War)" + the "blockade" alias — all of which
      // the OLD trailing-\\b regex could never match.
      var cases=[['The USCT regiments fought at Port Hudson.','USCT'],
                 ['The Lost Cause myth distorts the record.','Lost Cause'],
                 ['Contraband policy evolved through 1862.','Contraband'],
                 ['The Anaconda Plan aimed to strangle Southern commerce.','Anaconda Plan']];
      var got=[];
      for(var c=0;c<cases.length;c++){ var box=mk('<p>'+cases[c][0]+'</p>'); glDecorate(box);
        var t=box.querySelector('.gl-term');
        if(!t) throw new Error('no decoration for "'+cases[c][1]+'" (the parenthetical/alias regression class)');
        if(t.textContent.toLowerCase()!==cases[c][1].toLowerCase()) throw new Error('wrong surface wrapped: got "'+t.textContent+'" expected "'+cases[c][1]+'"');
        got.push(t.textContent); document.body.removeChild(box); }
      return { decorated:got }; });

    step('WORD-BOUNDARY: a real surface as a substring of a longer word is NOT wrapped', function(){
      var box=mk('<p>Reconstructionist polemics aside, Reconstruction itself mattered.</p>'); glDecorate(box);
      var terms=box.querySelectorAll('.gl-term');
      var recon=0; for(var i=0;i<terms.length;i++){ if(terms[i].textContent==='Reconstruction') recon++; }
      if(recon!==1) throw new Error('expected exactly one standalone "Reconstruction" wrap, got '+recon);
      if(box.textContent.indexOf('Reconstructionist')<0) throw new Error('the longer word "Reconstructionist" was broken/lost');
      return { reconWraps:recon }; });

    step('MULTI-TERM: distinct terms in ONE text node all decorate', function(){
      var box=mk('<p>Reconstruction followed secession across the South.</p>'); glDecorate(box);
      var ids={}; var t=box.querySelectorAll('.gl-term'); for(var i=0;i<t.length;i++) ids[t[i].getAttribute('data-gl-id')]=1;
      if(Object.keys(ids).length<2) throw new Error('expected >=2 distinct terms wrapped in one node, got '+Object.keys(ids).length);
      document.body.removeChild(box);
      return { distinct:Object.keys(ids).length }; });

    step('SKIP-ZONES: every declared skip tag/class/id is honored', function(){
      var W='Reconstruction';
      var html='<button>'+W+'</button><a href="#">'+W+'</a><kbd>'+W+'</kbd><code>'+W+'</code>'
        +'<label>'+W+'</label><select><option>'+W+'</option></select><textarea>'+W+'</textarea>'
        +'<script>var x="'+W+'";<\\/script><style>.x{content:"'+W+'"}<\\/style>'
        +'<div class="cx-card">'+W+'</div><div id="cxList">'+W+'</div><div data-no-gloss>'+W+'</div>';
      var box=mk(html); glDecorate(box);
      if(box.querySelectorAll('.gl-term').length!==0) throw new Error('decorated inside a declared skip-zone');
      document.body.removeChild(box);
      return { ok:true }; });

    step('NO HTML CORRUPTION: existing child elements survive decoration', function(){
      var box=mk('<p>Before <strong>BOLD</strong> came Reconstruction, with <em>EMPH</em> after.</p>');
      glDecorate(box);
      if(!box.querySelector('strong')||box.querySelector('strong').textContent!=='BOLD') throw new Error('<strong> lost/altered');
      if(!box.querySelector('em')||box.querySelector('em').textContent!=='EMPH') throw new Error('<em> lost/altered');
      if(box.querySelectorAll('.gl-term').length<1) throw new Error('term not wrapped amid child elements');
      document.body.removeChild(box);
      return { ok:true }; });

    step('IDEMPOTENT: re-decorating a container does not double-wrap', function(){
      var box=mk('<p>The era of Reconstruction reshaped the South.</p>');
      glDecorate(box); var n1=box.querySelectorAll('.gl-term').length;
      glDecorate(box); var n2=box.querySelectorAll('.gl-term').length;
      if(n2!==n1) throw new Error('re-decorate changed count '+n1+'->'+n2);
      document.body.removeChild(box);
      return { n:n1 }; });

    step('TOOLTIP + EVENTS: focusin shows; Esc hides; click reveals; reduce-motion -> no transition', function(){
      var box=mk('<p>The era of Reconstruction reshaped the South.</p>'); glDecorate(box);
      var b=box.querySelector('.gl-term'); if(!b) throw new Error('no trigger');
      G.settings.reduceMotion=true;
      _glShowTip(b);
      var tip=document.getElementById('glTip'); if(!tip) throw new Error('no #glTip');
      if(tip.getAttribute('role')!=='tooltip') throw new Error('tip not role=tooltip');
      if(tip.getAttribute('aria-hidden')!=='true') throw new Error('tip should be aria-hidden (def rides aria-label)');
      if(tip.style.display!=='block') throw new Error('tip not shown');
      if(tip.style.transition!=='none') throw new Error('reduce-motion should disable the transition, got '+tip.style.transition);
      if(tip.textContent.indexOf(b.getAttribute('data-gl-short').slice(0,12))<0) throw new Error('tip missing the def');
      _glHideTip(); if(tip.style.display!=='none') throw new Error('hide did not hide');
      // delegated events
      b.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));
      if(document.getElementById('glTip').style.display!=='block') throw new Error('focusin did not show the tip (delegation broken)');
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
      if(document.getElementById('glTip').style.display!=='none') throw new Error('Escape did not hide the tip');
      b.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      if(document.getElementById('glTip').style.display!=='block') throw new Error('click did not reveal the tip (touch path)');
      _glHideTip(); G.settings.reduceMotion=false;
      document.body.removeChild(box);
      return { ok:true }; });

    step('PURE read-out: glDecorate does not mutate the campaign / save / RNG', function(){
      var origSet=window.localStorage.setItem, origRand=Math.random, calls=[];
      var before=G.campaign;
      try { window.localStorage.setItem=function(){ calls.push('ls'); }; Math.random=function(){ calls.push('rand'); return 0.5; };
        var box=mk('<p>The blockade and emancipation shaped the war.</p>'); glDecorate(box); document.body.removeChild(box);
      } finally { window.localStorage.setItem=origSet; Math.random=origRand; }
      if(G.campaign!==before) throw new Error('glDecorate mutated G.campaign');
      if(calls.length) throw new Error('glDecorate touched: '+calls.join(','));
      return { clean:true }; });

    step('HOOK: _wdRefresh decorates the teaching tabs (afteraction/warvshistory) but NOT others', function(){
      if(typeof _wdRefresh!=='function') throw new Error('_wdRefresh missing');
      var C=mkC();
      var w=document.getElementById('wdContent'); if(!w){ w=document.createElement('div'); w.id='wdContent'; document.body.appendChild(w); }
      _wdTab='afteraction'; _wdRefresh();
      if(w.getAttribute('data-gl-done')!=='1') throw new Error('afteraction tab not glossified (glDecorate did not run)');
      var afterTerms1=w.querySelectorAll('.gl-term').length;
      if(afterTerms1<1) throw new Error('afteraction prose should wrap at least one codex term (got '+afterTerms1+')');
      _wdTab='economy'; _wdRefresh();
      // the REAL invariant: a non-teaching tab's rendered content carries no inline glossary triggers
      if(w.querySelectorAll('.gl-term').length!==0) throw new Error('economy tab should NOT carry .gl-term triggers');
      // DISCRIMINATING re-decorate test (the container-reuse guard fix): switching BACK to a
      // teaching tab must RE-decorate fresh content. Without the removeAttribute fix the stale
      // data-gl-done='1' would make glDecorate skip -> 0 terms on the second view.
      _wdTab='afteraction'; _wdRefresh();
      var afterTerms2=w.querySelectorAll('.gl-term').length;
      if(afterTerms2!==afterTerms1) throw new Error('re-view of afteraction did not re-decorate (container-reuse guard bug): '+afterTerms1+' -> '+afterTerms2);
      return { afteractionTerms: afterTerms1, reDecorated: afterTerms2 }; });
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
    result.staticScan = staticGlLeakScan();
    if (result.staticScan.leaks.length) { result.ok = false; result.steps.push({ name:'STATIC SCAN: no combat path references gl*', ok:false, err:'gl* read by: '+result.staticScan.leaks.join(', ') }); }
    else { result.steps.push({ name:'STATIC SCAN: no combat path references gl*', ok:true, v:{ scanned: result.staticScan.scanned } }); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-glossary.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-glossary ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
