#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-codex.mjs — E2 (D120) the multi-axis CODEX / glossary.
// Verifies: the codex deck loads with schema integrity (unique ids, valid axes,
// the >=2-source-for-Verified invariant mirrored from the build gate); the desk
// tab renders a search box + axis pills + entry cards; codexWireTab wires without
// throwing; client-side filtering (axis + query) shows/hides cards; expand toggles
// reveal the body; cross-links only render to resolvable entries; cxLookupShort
// (the inline-glossary accessor) returns the short def for a known term + null for
// an unknown one; and the citation-grade / anti-Lost-Cause content invariants hold.
// Writes shots/probe-codex.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// CX-03 (bug-hunt): lock the byte-identical-combat claim STRUCTURALLY — no tactical/
// combat/bridge/resolve file may read the codex (GAME_DATA.codex / gameData("codex") /
// the cx* API). If this ever trips, the codex stopped being a pure read-out.
function staticCodexLeakScan() {
  const CODEX_RE = /GAME_DATA\s*\.\s*codex|gameData\(\s*["']codex["']\s*\)|cxLookupShort|cxGlossaryIndex|codexRenderTab|codexWireTab/;
  const files = [];
  try { const TACT = join(ROOT, 'src', 'tactical'); for (const f of readdirSync(TACT)) if (f.endsWith('.js')) files.push(join(TACT, f)); } catch (e) {}
  for (const f of ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js', '80-victory.js']) files.push(join(ROOT, 'src', f));
  const leaks = [];
  for (const f of files) { try { if (CODEX_RE.test(readFileSync(f, 'utf8'))) leaks.push(f.split('/').pop()); } catch (e) {} }
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
  function mount(html){ var w=document.getElementById('wdContent'); if(w){ w.parentNode.removeChild(w); } w=document.createElement('div'); w.id='wdContent'; w.innerHTML=html; document.body.appendChild(w); return w; }
  function vis(sel){ var n=document.querySelectorAll(sel), c=0; for(var i=0;i<n.length;i++){ if(n[i].style.display!=='none') c++; } return c; }
  function norm(s){ return String(s==null?'':s).toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\\s+/g,' ').trim(); }
  function mkC(){ var C={ side:'US', iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; if(typeof _t1InitAll==='function') _t1InitAll(C); return C; }
  try {
    if (typeof _cxData!=='function' || typeof codexRenderTab!=='function' || typeof codexWireTab!=='function' || typeof cxLookupShort!=='function')
      return JSON.stringify({ok:false,fatal:'codex module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('codex deck loads + schema integrity (unique ids, valid axes, required fields)', function(){
      var d=_cxData(); if(!d||!Array.isArray(d.entries)||!d.entries.length) throw new Error('no GAME_DATA.codex.entries');
      var validAxes={people:1,units:1,terms:1,systems:1}, seen={};
      for(var i=0;i<d.entries.length;i++){ var e=d.entries[i];
        if(!e||!e.id) throw new Error('entry missing id at '+i);
        if(seen[e.id]) throw new Error('duplicate entry id: '+e.id); seen[e.id]=1;
        if(!validAxes[e.axis]) throw new Error('entry '+e.id+' has invalid axis: '+e.axis);
        if(!e.term||!e.short||!e.body) throw new Error('entry '+e.id+' missing term/short/body');
        if(typeof e.short==='string' && e.short.length>160) throw new Error('entry '+e.id+' short too long ('+e.short.length+')');
        if(!Array.isArray(e.sources)) throw new Error('entry '+e.id+' missing sources[]'); }
      return { entries:d.entries.length }; });

    step('VERIFIED => >=2 sources (the citation-grade invariant, mirrors the build gate)', function(){
      var es=_cxEntries(), offenders=[];
      for(var i=0;i<es.length;i++){ var e=es[i];
        if(String(e.provenance||'').trim().toLowerCase()==='verified' && (!Array.isArray(e.sources)||e.sources.length<2)) offenders.push(e.id+' ('+((e.sources||[]).length)+' src)'); }
      if(offenders.length) throw new Error('Verified entries with <2 sources: '+offenders.join(', '));
      var verified=es.filter(function(e){return String(e.provenance||'').trim().toLowerCase()==='verified';}).length;
      return { verified:verified, total:es.length }; });

    step('all four axes present + non-empty', function(){
      var want=['people','units','terms','systems'], es=_cxEntries(), counts={};
      for(var i=0;i<es.length;i++){ counts[es[i].axis]=(counts[es[i].axis]||0)+1; }
      for(var w=0;w<want.length;w++){ if(!counts[want[w]]) throw new Error('axis '+want[w]+' has no entries'); }
      return counts; });

    step('codexRenderTab renders a search box + axis pills + entry cards', function(){
      var html=codexRenderTab(G.campaign||null);
      if(html.indexOf('id="cxSearch"')<0) throw new Error('no search box');
      if(html.indexOf('data-cx-axis-filter="all"')<0) throw new Error('no All axis pill');
      mount(html);
      var cards=document.querySelectorAll('.cx-card').length;
      if(cards<1) throw new Error('no cards rendered');
      var pills=document.querySelectorAll('.cx-axis').length;
      if(pills<2) throw new Error('expected axis pills (All + axes), got '+pills);
      return { cards:cards, pills:pills }; });

    step('codexWireTab wires + expand toggle reveals the body (no throw)', function(){
      mount(codexRenderTab(G.campaign||null));
      var threw=false; try{ codexWireTab(G.campaign||null); }catch(e){ threw=true; R.errors.push('wire:'+String(e&&e.message||e)); }
      if(threw) throw new Error('codexWireTab threw');
      var head=document.querySelector('.cx-head'); if(!head) throw new Error('no expandable head');
      var bodyId='cxBody_'+head.id.replace(/^cxHead_/,'');
      var body=document.getElementById(bodyId); if(!body) throw new Error('no body for '+head.id);
      if(body.style.display!=='none') throw new Error('body should start collapsed');
      head.click();
      if(body.style.display==='none') throw new Error('body did not expand on click');
      if(head.getAttribute('aria-expanded')!=='true') throw new Error('aria-expanded not set true');
      return { expanded:true }; });

    step('client-side filtering: axis pill + search query show/hide cards', function(){
      mount(codexRenderTab(G.campaign||null)); codexWireTab(G.campaign||null);
      var total=document.querySelectorAll('.cx-card').length;
      // filter to people axis
      _cxApplyFilter('', 'people');
      var peopleShown=vis('.cx-card');
      var peopleData=_cxEntries().filter(function(e){return e.axis==='people';}).length;
      if(peopleShown!==peopleData) throw new Error('people-axis filter showed '+peopleShown+' expected '+peopleData);
      // a query that matches nothing hides all
      _cxApplyFilter('zzqxnotarealtoken', 'all');
      if(vis('.cx-card')!==0) throw new Error('a no-match query should hide all cards');
      var empty=document.getElementById('cxEmpty'); if(!empty||empty.style.display==='none') throw new Error('empty-state not shown for no-match');
      // reset
      _cxApplyFilter('', 'all');
      if(vis('.cx-card')!==total) throw new Error('reset did not restore all cards');
      return { total:total, peopleShown:peopleShown }; });

    step('cxLookupShort (inline-glossary accessor): known term -> short, unknown -> null, case-insensitive', function(){
      var es=_cxEntries(), e0=es[0];
      var hit=cxLookupShort(e0.term);
      if(!hit||hit.id!==e0.id) throw new Error('lookup of "'+e0.term+'" failed');
      if(hit.short!==e0.short) throw new Error('lookup returned wrong short');
      var hitU=cxLookupShort(e0.term.toUpperCase());
      if(!hitU||hitU.id!==e0.id) throw new Error('lookup not case-insensitive');
      if(cxLookupShort('zzz no such term zzz')!==null) throw new Error('unknown term should return null');
      return { sample:e0.term }; });

    step('cross-links only render to RESOLVABLE entries (no broken See-also links)', function(){
      mount(codexRenderTab(G.campaign||null));
      var rels=document.querySelectorAll('.cx-rel'), broken=[];
      for(var i=0;i<rels.length;i++){ var gid=rels[i].getAttribute('data-cx-goto'); if(!_cxById(gid)) broken.push(gid); }
      if(broken.length) throw new Error('broken cross-links rendered: '+broken.join(', '));
      return { relLinks:rels.length }; });

    step('anti-Lost-Cause content invariants: Lost Cause named+countered; secession names slavery', function(){
      var es=_cxEntries();
      var lc=null, sec=null;
      for(var i=0;i<es.length;i++){ var t=norm(es[i].term); if(/lost cause/.test(t)) lc=es[i]; if(/secession/.test(t)) sec=es[i]; }
      if(!lc) throw new Error('no Lost Cause entry found');
      if(!/myth|postwar|counter|false|distort|romantic/i.test(lc.body)) throw new Error('Lost Cause entry does not name it a myth / counter it: '+lc.body.slice(0,80));
      if(!sec) throw new Error('no secession entry found');
      if(!/slaver|enslav/i.test(sec.body+' '+sec.short)) throw new Error('secession entry does not name slavery as the cause');
      return { lostCause:lc.id, secession:sec.id }; });

    step('render is a PURE read-out (no campaign mutation, no save)', function(){
      // codex render/wire must not require or mutate a campaign — they run with G.campaign null
      var before=G.campaign;
      codexRenderTab(null); cxGlossaryIndex(); cxLookupShort('secession');
      if(G.campaign!==before) throw new Error('codex mutated G.campaign');
      return { ok:true }; });

    // ---- bug-hunt hardening (E2-i1): lock the invariants the hunt flagged as under-covered ----
    step('PURITY (spy): render/wire never write localStorage nor call Math.random', function(){
      var origSet=window.localStorage.setItem, origRand=Math.random, calls=[];
      try { window.localStorage.setItem=function(){ calls.push('localStorage.setItem'); };
        Math.random=function(){ calls.push('Math.random'); return 0.5; };
        mount(codexRenderTab(null)); codexWireTab(null); cxGlossaryIndex(); cxLookupShort('secession');
      } finally { window.localStorage.setItem=origSet; Math.random=origRand; }
      if(calls.length) throw new Error('codex touched: '+calls.join(','));
      return { clean:true }; });

    step('XSS: data is HTML-escaped in render (no live injection)', function(){
      var d=_cxData(); window.__cxXss=0;
      var inj={ id:'__xss_probe', axis:'people', term:'<img src=x onerror="window.__cxXss=1">',
        short:'a "quoted" & <b>bold</b> def', body:'tags & <img src=y onerror="window.__cxXss=2"> body',
        tags:['test'], related:[], provenance:'Inferred', sources:[] };
      d.entries.push(inj);
      try {
        var html=codexRenderTab(null); mount(html);
        if(window.__cxXss!==0) throw new Error('XSS payload executed (__cxXss='+window.__cxXss+')');
        // The codex LEGITIMATELY embeds build-controlled PD teaching photos as <img src="data:..."> on the
        // People cards (D135 USCT + D136 leaders), so the property to verify is that the ENTRY-DATA payload is
        // NEUTRALIZED (escaped, never a live handler) — not the incidental absence of any <img>.
        if(html.indexOf('&lt;img')<0) throw new Error('escaped &lt;img not found — term/body not escaped');
        if(/onerror\s*=\s*"window\.__cxXss/.test(html)) throw new Error('a live onerror handler from the payload is present (term/body not escaped)');
        if(document.querySelector('#cxList img[onerror]')) throw new Error('an <img> carrying an onerror handler made it into the DOM');
        if(document.querySelector('#cxList img[src="x"], #cxList img[src="y"]')) throw new Error('a payload <img> (src=x/y) made it into the DOM');
        var liveImgs=document.querySelectorAll('#cxList img');   // any live imgs MUST be the controlled data: photos, never the payload
        for(var li=0;li<liveImgs.length;li++){ var s=liveImgs[li].getAttribute('src')||''; if(s.indexOf('data:image/')!==0) throw new Error('a non-data: <img> reached the DOM (src='+s.slice(0,24)+')'); }
      } finally { d.entries.pop(); }
      return { escaped:true }; });

    step('DATA robustness: no unresolvable related ids; no normalized-term collisions', function(){
      var es=_cxEntries(), ids={}; for(var i=0;i<es.length;i++) ids[es[i].id]=1;
      var badRel=[]; for(var j=0;j<es.length;j++){ var rel=es[j].related||[]; for(var k=0;k<rel.length;k++){ if(!ids[rel[k]]) badRel.push(es[j].id+'->'+rel[k]); } }
      if(badRel.length) throw new Error('unresolvable related ids: '+badRel.join(', '));
      var terms={}, coll=[]; for(var t=0;t<es.length;t++){ var key=norm(es[t].term); if(terms[key]) coll.push(key); terms[key]=1; }
      if(coll.length) throw new Error('normalized-term collisions (glossary ambiguity): '+coll.join(', '));
      return { ok:true }; });

    step('ANTI-LOST-CAUSE content locks: Forrest-not-founder; Fort Pillow + Andersonville + hard-war + slavery named', function(){
      var es=_cxEntries(), forrest=null;
      for(var i=0;i<es.length;i++){ if(/forrest/i.test(es[i].term)) forrest=es[i]; }
      if(!forrest) throw new Error('no Forrest entry');
      if(/founded the (klan|ku klux)|founder of the (klan|ku klux)/i.test(forrest.body)) throw new Error('Forrest wrongly called a Klan FOUNDER');
      if(!/grand wizard|early leader/i.test(forrest.body)) throw new Error('Forrest entry must say first Grand Wizard / early leader');
      if(!/fort pillow/i.test(forrest.body)) throw new Error('Forrest entry must name Fort Pillow');
      var blob=es.map(function(e){return e.body+' '+e.short;}).join(' ');
      if(!/fort pillow/i.test(blob)) throw new Error('corpus must name Fort Pillow');
      if(!/andersonville/i.test(blob)) throw new Error('corpus must name Andersonville (a CS atrocity — both-sides balance)');
      if(!/hard war|the burning|march to the sea/i.test(blob)) throw new Error('corpus must name Union hard-war destruction (both-sides balance)');
      if(!/slaver|enslav/i.test(blob)) throw new Error('corpus must name slavery as the cause');
      return { forrest:forrest.id }; });

    step('A11Y: scoped focus-visible ring for cxSearch + cx-head; sr-only search label; aria-live count', function(){
      var html=codexRenderTab(null);
      if(html.indexOf('#cxSearch:focus-visible')<0 || html.indexOf('.cx-head:focus-visible')<0) throw new Error('no scoped focus-visible ring for codex controls');
      mount(html);
      if(!document.querySelector('label[for="cxSearch"]')) throw new Error('no sr-only label for cxSearch');
      var cnt=document.getElementById('cxCount'); if(!cnt||cnt.getAttribute('aria-live')!=='polite') throw new Error('count not aria-live');
      var bl=document.getElementById('cxBlurb'); if(!bl||bl.getAttribute('aria-live')!=='polite') throw new Error('blurb not aria-live');
      var head=document.querySelector('.cx-head'); var ctl=head.getAttribute('aria-controls');
      if(!ctl||!document.getElementById(ctl)) throw new Error('aria-controls does not resolve: '+ctl);
      return { ok:true }; });

    step('INTERACTION: aria-pressed toggles; cross-link resets+expands+clears blurb; reduce-motion safe', function(){
      mount(codexRenderTab(null)); codexWireTab(null);
      var pills=document.querySelectorAll('.cx-axis'), nonAll=null;
      for(var i=0;i<pills.length;i++){ if(pills[i].getAttribute('data-cx-axis-filter')!=='all'){ nonAll=pills[i]; break; } }
      if(!nonAll) throw new Error('no non-All pill');
      nonAll.click();
      if(nonAll.getAttribute('aria-pressed')!=='true') throw new Error('clicked pill not aria-pressed=true');
      var blurbAfterPill=(document.getElementById('cxBlurb')||{}).textContent||'';
      if(!blurbAfterPill) throw new Error('non-All pill should populate the blurb');
      try{ G.settings.reduceMotion=true; }catch(eRM){}
      var rel=document.querySelector('.cx-rel'); var crossTested=false;
      if(rel){ var gid=(rel.getAttribute('data-cx-goto')||'').replace(/[^A-Za-z0-9_-]/g,'_');
        var threw=false; try{ rel.click(); }catch(e){ threw=true; }
        if(threw) throw new Error('cross-link click threw (reduce-motion path)');
        var allPill=document.querySelector('.cx-axis[data-cx-axis-filter="all"]');
        if(allPill.getAttribute('aria-pressed')!=='true') throw new Error('cross-link did not reset to All');
        var bl=document.getElementById('cxBlurb'); if(bl && bl.textContent) throw new Error('cross-link left a stale blurb: '+bl.textContent);
        var tb=document.getElementById('cxBody_'+gid); if(tb && tb.style.display==='none') throw new Error('cross-link did not expand the target');
        crossTested=true; }
      try{ G.settings.reduceMotion=false; }catch(eRM2){}
      return { crossTested:crossTested }; });

    step('SHELL dispatch: _wdTab=codex renders codex; another tab does not (lockstep arrays)', function(){
      if(typeof _wdRefresh!=='function') throw new Error('_wdRefresh missing');
      var C=mkC();
      var w=document.getElementById('wdContent'); if(!w){ w=document.createElement('div'); w.id='wdContent'; document.body.appendChild(w); }
      _wdTab='codex'; _wdRefresh();
      if(w.innerHTML.indexOf('id="cxSearch"')<0) throw new Error('_wdRefresh did not render codex for _wdTab=codex');
      _wdTab='decisions'; _wdRefresh();
      if(w.innerHTML.indexOf('id="cxSearch"')>=0) throw new Error('codex markup leaked into the decisions tab');
      return { dispatched:true }; });
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
    result.staticScan = staticCodexLeakScan();
    if (result.staticScan.leaks.length) { result.ok = false; result.steps.push({ name:'STATIC SCAN: no combat path reads the codex', ok:false, err:'codex read by: '+result.staticScan.leaks.join(', ') }); }
    else { result.steps.push({ name:'STATIC SCAN: no combat path reads the codex', ok:true, v:{ scanned: result.staticScan.scanned } }); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-codex.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-codex ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
