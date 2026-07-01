#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-primary-sources.mjs - M2/M3/M4/M6/M7 primary-source apparatus gate.
// Verifies schema/quote/provenance invariants; the President's Desk "Documents"
// tab render/wire path; client-side filters/search; and the pure-readout wall.
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

function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function wordCount(s) { const n = norm(s); return n ? n.split(' ').length : 0; }

function validatePrimarySourcesData() {
  const data = JSON.parse(readFileSync(join(ROOT, 'data', 'primary-sources.json'), 'utf8'));
  const errors = [];
  if (data.schema !== 'cw_primary_sources_v1') errors.push('schema must be cw_primary_sources_v1');
  if (!Array.isArray(data.records) || data.records.length < 20) errors.push('expected at least 20 records');
  const ids = new Set();
  const cats = new Set((data.categories || []).map(c => c && c.id).filter(Boolean));
  let confed = 0, verified = 0, reconstruction = 0, sourceCriticism = 0, homeFront = 0, livedSlavery = 0;
  for (const rec of data.records || []) {
    const id = rec && rec.id;
    if (!id) { errors.push('record missing id'); continue; }
    if (ids.has(id)) errors.push('duplicate id: ' + id);
    ids.add(id);
    for (const k of ['title','author','date','place','provenance','verbatimExcerpt','attribution','sourceCritique','indictment','sources']) {
      if (rec[k] == null || (typeof rec[k] === 'string' && !rec[k].trim())) errors.push(id + ' missing ' + k);
    }
    if (!cats.has(rec.category)) errors.push(id + ' category not declared: ' + rec.category);
    const wc = wordCount(rec.verbatimExcerpt);
    if (wc > 60) errors.push(id + ' excerpt too long: ' + wc + ' words');
    if (!/Repository:/i.test(rec.attribution || '') || !/Locator:/i.test(rec.attribution || '')) errors.push(id + ' attribution must include Repository: and Locator: tokens');
    const sources = Array.isArray(rec.sources) ? rec.sources : [];
    if (String(rec.provenance || '').trim().toLowerCase() === 'verified') {
      verified++;
      if (sources.length < 2) errors.push(id + ' is Verified with <2 sources');
    }
    for (const src of sources) {
      if (!src || typeof src !== 'object') { errors.push(id + ' source must be an object'); continue; }
      for (const k of ['title','repository','locator','url']) if (!src[k]) errors.push(id + ' source missing ' + k);
    }
    if (rec.category === 'confederate-self-justification') {
      confed++;
      if (!rec.catalystFrame || !String(rec.catalystFrame).trim()) errors.push(id + ' Confederate self-justification missing catalystFrame');
      if (!/slaver|enslav|white|negro|slave/i.test((rec.verbatimExcerpt || '') + ' ' + (rec.indictment || '') + ' ' + (rec.catalystFrame || ''))) errors.push(id + ' Confederate card does not name slavery/race in excerpt/frame');
    }
    if (rec.category === 'reconstruction-memory') reconstruction++;
    if (rec.category === 'source-criticism-voices') sourceCriticism++;
    if (rec.category === 'home-front-politics-economy') homeFront++;
    if (rec.category === 'lived-slavery-agency') livedSlavery++;
  }
  if (confed < 5) errors.push('expected at least 5 Confederate self-justification records, got ' + confed);
  for (const rid of ['ps-mississippi-black-code-apprentice','ps-elias-hill-kkk-hearings','ps-douglass-black-man-wants']) {
    if (!ids.has(rid)) errors.push('missing M3 Reconstruction/memory record: ' + rid);
  }
  if (reconstruction < 3) errors.push('expected at least 3 Reconstruction/memory records, got ' + reconstruction);
  for (const rid of ['ps-gettysburg-address-bliss','ps-susie-king-taylor-after-war','ps-dolly-lunt-hard-war','ps-mccarter-irish-brigade','ps-dwyer-irish-brigade-letter']) {
    if (!ids.has(rid)) errors.push('missing M4 source-criticism / under-told voice record: ' + rid);
  }
  if (sourceCriticism < 5) errors.push('expected at least 5 source-criticism records, got ' + sourceCriticism);
  for (const rid of ['ps-lincoln-blind-memorandum-1864','ps-legal-tender-act-1862']) {
    if (!ids.has(rid)) errors.push('missing M6 home-front/politics/economy record: ' + rid);
  }
  if (homeFront < 2) errors.push('expected at least 2 home-front/politics/economy records, got ' + homeFront);
  for (const rid of ['ps-jacobs-enslaved-women','ps-fountain-hughes-auction-pass']) {
    if (!ids.has(rid)) errors.push('missing M7 lived-slavery record: ' + rid);
  }
  if (livedSlavery < 2) errors.push('expected at least 2 lived-slavery records, got ' + livedSlavery);
  return { ok: errors.length === 0, errors, records: (data.records || []).length, verified, confed, reconstruction, sourceCriticism, homeFront, livedSlavery };
}

function staticPrimarySourceLeakScan() {
  const RE = /GAME_DATA\s*\[\s*["']primary-sources["']\s*\]|gameData\(\s*["']primary-sources["']\s*\)|primarySourcesRenderTab|primarySourcesWireTab|_psRecords|_psData/;
  const files = [];
  try {
    const TACT = join(ROOT, 'src', 'tactical');
    for (const f of readdirSync(TACT)) if (f.endsWith('.js')) files.push(join(TACT, f));
  } catch (e) {}
  for (const f of ['80-victory.js', '85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js', '90-president-register.js', '91-save-slots.js']) files.push(join(ROOT, 'src', f));
  const leaks = [];
  for (const f of files) {
    try { if (RE.test(readFileSync(f, 'utf8'))) leaks.push(f.split('/').pop()); } catch (e) {}
  }
  return { scanned: files.length, leaks };
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mount(html){ var w=document.getElementById('wdContent'); if(w){ w.parentNode.removeChild(w); } w=document.createElement('div'); w.id='wdContent'; w.innerHTML=html; document.body.appendChild(w); return w; }
  function visible(sel){ var n=document.querySelectorAll(sel), c=0; for(var i=0;i<n.length;i++){ if(n[i].style.display!=='none') c++; } return c; }
  function mkC(){ var C={ side:'US', iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; if(typeof _t1InitAll==='function') _t1InitAll(C); return C; }
  try {
    if (typeof _psData!=='function' || typeof _psRecords!=='function' || typeof primarySourcesRenderTab!=='function' || typeof primarySourcesWireTab!=='function')
      return JSON.stringify({ok:false,fatal:'primary-source module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('primary-source deck loads and categories are populated', function(){
      var d=_psData(); if(!d||d.schema!=='cw_primary_sources_v1') throw new Error('bad/missing schema');
      var rs=_psRecords(); if(!rs.length) throw new Error('no records');
      var cats=_psCatOrder(); if(cats.length<3) throw new Error('expected 3 category lanes, got '+cats.length);
      return { records:rs.length, categories:cats.length }; });

    step('render includes search, category filters, cards, and a11y count', function(){
      var html=primarySourcesRenderTab(null);
      if(html.indexOf('id="psSearch"')<0) throw new Error('no search input');
      if(html.indexOf('data-ps-category-filter="all"')<0) throw new Error('no All category filter');
      mount(html);
      var cards=document.querySelectorAll('.ps-card').length;
      if(cards!==_psRecords().length) throw new Error('rendered '+cards+' cards, expected '+_psRecords().length);
      var cnt=document.getElementById('psCount'); if(!cnt||cnt.getAttribute('aria-live')!=='polite') throw new Error('count not aria-live');
      return { cards:cards }; });

    step('Confederate self-justification card shows quote -> catalyst frame -> attribution', function(){
      mount(primarySourcesRenderTab(null)); primarySourcesWireTab(null);
      var card=document.querySelector('.ps-card[data-ps-category="confederate-self-justification"]');
      if(!card) throw new Error('no Confederate card');
      var head=card.querySelector('.ps-head'); head.click();
      var body=document.getElementById(head.getAttribute('aria-controls'));
      if(!body || body.style.display==='none') throw new Error('card body did not open');
      var text=(body.textContent||card.textContent||'');
      if(text.indexOf('Verbatim excerpt')<0) throw new Error('missing verbatim excerpt label');
      if(text.indexOf('Catalyst frame')<0) throw new Error('missing catalyst frame');
      if(text.indexOf('Attribution:')<0 || text.indexOf('Repository:')<0 || text.indexOf('Locator:')<0) throw new Error('missing attribution repository/locator');
      if(!/slaver|enslav|negro|white/i.test(text)) throw new Error('card does not visibly name slavery/race');
      return { id:card.id }; });

    step('filters and search show/hide without rerendering', function(){
      mount(primarySourcesRenderTab(null)); primarySourcesWireTab(null);
      var total=document.querySelectorAll('.ps-card').length;
      _psApplyFilter('', 'black-soldier-agency');
      var black=visible('.ps-card');
      var expected=_psRecords().filter(function(r){return r.category==='black-soldier-agency';}).length;
      if(black!==expected) throw new Error('black-soldier filter showed '+black+' expected '+expected);
      _psApplyFilter('gooding', 'all');
      var gooding=visible('.ps-card');
      if(gooding!==1) throw new Error('Gooding search should show 1 card, got '+gooding);
      _psApplyFilter('', 'all');
      if(visible('.ps-card')!==total) throw new Error('reset did not restore all cards');
      return { total:total, black: black }; });

    step('M3 Reconstruction/memory lane filters to Black Codes, Klan testimony, and Douglass suffrage', function(){
      mount(primarySourcesRenderTab(null)); primarySourcesWireTab(null);
      _psApplyFilter('', 'reconstruction-memory');
      var shown=visible('.ps-card');
      if(shown<3) throw new Error('reconstruction-memory filter showed '+shown+' expected at least 3');
      var text=(document.getElementById('psList')||{}).textContent||'';
      ['Black Code','Elias Hill','What the Black Man Wants'].forEach(function(token){ if(text.indexOf(token)<0) throw new Error('missing M3 visible token: '+token); });
      _psApplyFilter('enfranchisement', 'all');
      var suffrage=visible('.ps-card');
      if(suffrage!==1) throw new Error('enfranchisement search should show 1 card, got '+suffrage);
      return { shown:shown, suffrage:suffrage }; });

    step('M4 source-criticism lane filters to Gettysburg, Taylor, Lunt, McCarter, and Dwyer records', function(){
      mount(primarySourcesRenderTab(null)); primarySourcesWireTab(null);
      _psApplyFilter('', 'source-criticism-voices');
      var shown=visible('.ps-card');
      if(shown<5) throw new Error('source-criticism filter showed '+shown+' expected at least 5');
      var text=(document.getElementById('psList')||{}).textContent||'';
      ['Gettysburg Address','Susie King Taylor','Dolly Lunt','William McCarter','William Dwyer'].forEach(function(token){ if(text.indexOf(token)<0) throw new Error('missing M4 visible token: '+token); });
      _psApplyFilter('Bliss copy', 'all');
      var bliss=visible('.ps-card');
      if(bliss!==1) throw new Error('Bliss copy search should show 1 card, got '+bliss);
      _psApplyFilter('McCarter', 'source-criticism-voices');
      var mccarter=visible('.ps-card');
      if(mccarter!==1) throw new Error('McCarter search should show 1 card, got '+mccarter);
      _psApplyFilter('Dwyer', 'source-criticism-voices');
      var dwyer=visible('.ps-card');
      if(dwyer!==1) throw new Error('Dwyer search should show 1 card, got '+dwyer);
      return { shown:shown, bliss:bliss, mccarter:mccarter, dwyer:dwyer }; });

    step('M6 home-front/politics/economy lane filters to election and wartime-finance records', function(){
      mount(primarySourcesRenderTab(null)); primarySourcesWireTab(null);
      _psApplyFilter('', 'home-front-politics-economy');
      var shown=visible('.ps-card');
      if(shown<2) throw new Error('home-front/politics/economy filter showed '+shown+' expected at least 2');
      var text=(document.getElementById('psList')||{}).textContent||'';
      ['Blind Memorandum','Administration will not be re-elected','First Legal Tender Act','legal tender in payment of all debts'].forEach(function(token){ if(text.indexOf(token)<0) throw new Error('missing M6 visible token: '+token); });
      _psApplyFilter('co-operate', 'home-front-politics-economy');
      var lincoln=visible('.ps-card');
      if(lincoln!==1) throw new Error('co-operate search should show 1 card, got '+lincoln);
      _psApplyFilter('legal tender', 'home-front-politics-economy');
      var tender=visible('.ps-card');
      if(tender!==1) throw new Error('legal tender search should show 1 card, got '+tender);
      return { shown:shown, lincoln:lincoln, legalTender:tender }; });

    step('M7 lived-slavery lane filters to Jacobs and Hughes records with source-critique anchors', function(){
      mount(primarySourcesRenderTab(null)); primarySourcesWireTab(null);
      _psApplyFilter('', 'lived-slavery-agency');
      var shown=visible('.ps-card');
      if(shown<2) throw new Error('lived-slavery filter showed '+shown+' expected at least 2');
      var text=(document.getElementById('psList')||{}).textContent||'';
      ['Harriet Jacobs','Fountain Hughes','far more terrible for women','sell us like they sell horses','oral-history interview'].forEach(function(token){ if(text.indexOf(token)<0) throw new Error('missing M7 visible token: '+token); });
      _psApplyFilter('auction', 'lived-slavery-agency');
      var auction=visible('.ps-card');
      if(auction!==1) throw new Error('auction search should show 1 card, got '+auction);
      _psApplyFilter('enslaved women', 'lived-slavery-agency');
      var women=visible('.ps-card');
      if(women!==1) throw new Error('enslaved women search should show 1 card, got '+women);
      return { shown:shown, auction:auction, women:women }; });

    step('Desk dispatch: _wdTab=sources renders Documents and another tab clears it', function(){
      if(typeof _wdRefresh!=='function') throw new Error('_wdRefresh missing');
      var C=mkC();
      var w=document.getElementById('wdContent'); if(!w){ w=document.createElement('div'); w.id='wdContent'; document.body.appendChild(w); }
      _wdTab='sources'; _wdRefresh();
      if(w.innerHTML.indexOf('id="psSearch"')<0) throw new Error('_wdRefresh did not render sources for _wdTab=sources');
      _wdTab='codex'; _wdRefresh();
      if(w.innerHTML.indexOf('id="psSearch"')>=0) throw new Error('sources markup leaked into codex tab');
      return { dispatched:true }; });

    step('H0 desk tab button is present and opens Documents', function(){
      var C=mkC(); openWarDept();
      var b=document.getElementById('wdTab_sources'); if(!b) throw new Error('Documents tab button missing');
      b.click();
      var w=document.getElementById('wdContent'); if(!w || w.innerHTML.indexOf('id="psSearch"')<0) throw new Error('clicking Documents did not render source reader');
      if(typeof closeSheet==='function') closeSheet();
      return { opened:true }; });

    step('PURE READ-OUT: render/wire/filter do not mutate campaign, save, or RNG', function(){
      var C=mkC(), before=JSON.stringify(C), calls=[];
      var origSet=window.localStorage.setItem, origRand=Math.random;
      try { window.localStorage.setItem=function(){ calls.push('localStorage.setItem'); };
        Math.random=function(){ calls.push('Math.random'); return 0.5; };
        mount(primarySourcesRenderTab(C)); primarySourcesWireTab(C); _psApplyFilter('slavery', 'all');
        var head=document.querySelector('.ps-head'); if(head) head.click();
      } finally { window.localStorage.setItem=origSet; Math.random=origRand; }
      if(calls.length) throw new Error('reader touched: '+calls.join(','));
      if(JSON.stringify(C)!==before) throw new Error('reader mutated campaign');
      return { clean:true }; });

    step('XSS: record fields are HTML-escaped in render', function(){
      var d=_psData(); window.__psXss=0;
      var inj={ id:'__xss_probe', category:'black-soldier-agency', title:'<img src=x onerror="window.__psXss=1">', author:'X', date:'1863', place:'X', provenance:'Inferred',
        verbatimExcerpt:'<img src=y onerror="window.__psXss=2">', attribution:'Repository: Test. Locator: Test.', sourceCritique:'<b>bad</b>', indictment:'tags', catalystFrame:'', sources:[] };
      d.records.push(inj);
      try {
        var html=primarySourcesRenderTab(null); mount(html);
        if(window.__psXss!==0) throw new Error('payload executed (__psXss='+window.__psXss+')');
        if(html.indexOf('&lt;img')<0) throw new Error('escaped &lt;img not found');
        if(document.querySelector('#psList img[onerror]')) throw new Error('payload img with onerror reached DOM');
      } finally { d.records.pop(); }
      return { escaped:true }; });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  let staticData = validatePrimarySourcesData();
  let staticScan = staticPrimarySourceLeakScan();
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<80;i++){ if(await up(probe))break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'load', timeout:90000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    result.staticData = staticData;
    result.staticScan = staticScan;
    if (!staticData.ok) { result.ok = false; for (const err of staticData.errors) result.steps.push({ name:'STATIC DATA: primary-sources schema', ok:false, err }); }
    else { result.steps.push({ name:'STATIC DATA: primary-sources schema', ok:true, v:{ records: staticData.records, verified: staticData.verified, confed: staticData.confed, reconstruction: staticData.reconstruction, sourceCriticism: staticData.sourceCriticism, homeFront: staticData.homeFront, livedSlavery: staticData.livedSlavery } }); }
    if (staticScan.leaks.length) { result.ok = false; result.steps.push({ name:'STATIC SCAN: no combat/bridge/save path reads primary sources', ok:false, err:'primary-source read by: '+staticScan.leaks.join(', ') }); }
    else { result.steps.push({ name:'STATIC SCAN: no combat/bridge/save path reads primary sources', ok:true, v:{ scanned: staticScan.scanned } }); }
    await page.evaluate(() => { if (typeof _wdRefresh === 'function') { _wdTab = 'sources'; _wdRefresh(); } });
    await sleep(250);
    await page.screenshot({ path: join(OUT, 'primary-sources.png'), fullPage:false });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors, staticData, staticScan }; }
  finally {
    writeFileSync(join(OUT,'probe-primary-sources.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-primary-sources ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
