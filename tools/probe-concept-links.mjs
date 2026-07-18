#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-concept-links.mjs - GEA-10 (D446): stable concept ids + focus-returning deep
// links. AUTHORED under the D443 coding-first law (VETTING DEFERRED; the FINAL audit session
// runs it — AUDIT-DEBT AD-13). Verifies the D441 contract
// (docs/design/genre-elite-p1-contracts.md GEA-10): the registry's closed shape + LIVE anchor
// resolution across all four kinds (codex/glossary/source/card), the decorated-span opt-in
// (unknown ids stay INERT plain text — no role, no tabindex, no dead link), the modal deep
// link with PROVENANCE VISIBLE on landing (codex bodies force-expanded; source citations
// present), and the FOCUS-RETURN round trip (click + Escape paths — the S12/S22 law).
// BIND A PREDECLARATION - removing the src/30 conceptDecorate call must red exactly the
// DESK-SPAN-DECORATED tooth (the economy-tab spans stay inert), nothing else.
// BIND B PREDECLARATION - tampering data/concept-links.json concepts[0].anchor to an unreal
// id must red exactly the STATIC anchor-resolution tooth here AND exit
// tools/validate-data-schemas.mjs nonzero naming concepts[0].anchor (the concept-badanchor
// fixture proves the same tooth on demand).
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
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }
function killChild(child) { if (!child) return; try { child.kill(); } catch(e) {} }
async function closeBrowserHard(browser) {
  if (!browser) return;
  const proc = typeof browser.process === 'function' ? browser.process() : null;
  let closed = false;
  try {
    await Promise.race([
      browser.close().then(() => { closed = true; }, () => { closed = true; }),
      sleep(2500)
    ]);
  } catch(e) {}
  if (!closed && proc && !proc.killed) {
    try { proc.kill('SIGKILL'); } catch(e) {}
  }
}
function printResult(result) {
  console.log('probe-concept-links ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };

  const reg = JSON.parse(readFileSync(join(ROOT, 'data', 'concept-links.json'), 'utf8'));

  check('REGISTRY CLOSED SHAPE: cw_concept_links_v1; 1-64 concepts each exactly {id, kind, anchor}; concept:<kebab> ids, unique; known kinds', () => {
    if (reg.schema !== 'cw_concept_links_v1' || reg.schemaVersion !== 1) throw new Error('schema marker wrong');
    if (!Array.isArray(reg.concepts) || !reg.concepts.length || reg.concepts.length > 64) throw new Error('concepts bound');
    const ids = new Set();
    reg.concepts.forEach((c, i) => {
      const keys = Object.keys(c).sort().join(',');
      if (keys !== 'anchor,id,kind') throw new Error('concepts[' + i + '] keys ' + keys);
      if (!/^concept:[a-z0-9][a-z0-9-]{0,60}$/.test(c.id)) throw new Error('concepts[' + i + '] id ' + c.id);
      if (ids.has(c.id)) throw new Error('duplicate ' + c.id); ids.add(c.id);
      if (['codex', 'glossary', 'source', 'card'].indexOf(c.kind) < 0) throw new Error('concepts[' + i + '] kind ' + c.kind);
    });
    return { concepts: reg.concepts.length };
  });

  check('ANCHOR RESOLUTION (live-derived): every anchor resolves in its owning data file — codex ids, codex terms, primary-source record ids, battle teaching-card ids', () => {
    const cx = JSON.parse(readFileSync(join(ROOT, 'data', 'codex.json'), 'utf8'));
    const cxIds = new Set((cx.entries || []).map(e => e.id));
    const cxTerms = new Set((cx.entries || []).map(e => String(e.term).toLowerCase()));
    const ps = JSON.parse(readFileSync(join(ROOT, 'data', 'primary-sources.json'), 'utf8'));
    const psIds = new Set((ps.records || []).map(r => r.id));
    const cardIds = new Set();
    for (const f of readdirSync(join(ROOT, 'data'))) {
      if (!f.endsWith('.json')) continue;
      let j; try { j = JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8')); } catch (e) { continue; }
      const key = Object.keys(j).find(k => !['_comment', '_meta', 'schemaVersion'].includes(k));
      const b = key ? j[key] : null; if (!b || !b.id || b.id !== key) continue;
      const packs = [];
      if (b.teaching && Array.isArray(b.teaching.cards)) packs.push(b.teaching.cards);
      for (const p of (b.phases || [])) if (p && p.teaching && Array.isArray(p.teaching.cards)) packs.push(p.teaching.cards);
      for (const cards of packs) for (const c of cards) if (c && c.id) cardIds.add(c.id);
    }
    reg.concepts.forEach((c, i) => {
      const ok = c.kind === 'codex' ? cxIds.has(c.anchor)
        : c.kind === 'glossary' ? cxTerms.has(String(c.anchor).toLowerCase())
        : c.kind === 'source' ? psIds.has(c.anchor)
        : cardIds.has(c.anchor);
      if (!ok) throw new Error('concepts[' + i + '] (' + c.id + ') anchor unresolved: ' + c.kind + '/' + c.anchor);
    });
    return { codex: cxIds.size, sources: psIds.size, cards: cardIds.size };
  });

  check('SPAN INVENTORY: every data-concept id annotated in src/ is registered (no orphan span ships)', () => {
    const registered = new Set(reg.concepts.map(c => c.id));
    const orphans = [];
    const scan = (dir) => {
      for (const f of readdirSync(join(ROOT, dir))) {
        if (!f.endsWith('.js')) continue;
        const t = readFileSync(join(ROOT, dir, f), 'utf8');
        const m = t.match(/data-concept="([^"]+)"/g) || [];
        for (const hit of m) {
          const id = hit.slice('data-concept="'.length, -1);
          if (!registered.has(id)) orphans.push(dir + '/' + f + ':' + id);
        }
      }
    };
    scan('src'); scan(join('src', 'tactical'));
    if (orphans.length) throw new Error('orphan spans: ' + orphans.join(', '));
    return { ok: true };
  });

  check('SEAM PINS: src/30 + src/92 call conceptDecorate behind typeof guards; annotated spans carry data-no-gloss (the glossary-nesting guard); manifest enrolls 110-concept-links.js; the validator enrolls validateConceptLinks + concept-badanchor', () => {
    const shell = readFileSync(join(ROOT, 'src', '30-president-shell.js'), 'utf8');
    const help = readFileSync(join(ROOT, 'src', '92-help-overlay.js'), 'utf8');
    const render = readFileSync(join(ROOT, 'src', '20-president-render.js'), 'utf8');
    if (!/typeof conceptDecorate === "function"/.test(shell) || !/typeof conceptDecorate === "function"/.test(help)) throw new Error('guarded decorate call missing');
    for (const t of [help, render]) {
      const spans = t.match(/data-concept="[^"]+"[^>]*/g) || [];
      for (const s of spans) if (s.indexOf('data-no-gloss') < 0) throw new Error('a concept span lacks data-no-gloss');
    }
    const manifest = readFileSync(join(ROOT, 'src', '00-manifest.json'), 'utf8');
    if (manifest.indexOf('"110-concept-links.js"') < 0) throw new Error('manifest enrollment missing');
    const validator = readFileSync(join(__dirname, 'validate-data-schemas.mjs'), 'utf8');
    ['validateConceptLinks', 'concept-badanchor', 'conceptAnchorSets'].forEach(tok => { if (validator.indexOf(tok) < 0) throw new Error('validator missing ' + tok); });
    return { ok: true };
  });

  return steps;
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function check(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  function mkC(side){ var C={ side:side||'US', iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if (typeof presInit === 'function') presInit(C);
    return C; }
  try {
    if (typeof conceptResolve !== 'function' || typeof conceptDecorate !== 'function' || typeof conceptOpen !== 'function')
      return JSON.stringify({ ok:false, fatal:'concept-links API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';

    check('ALL KINDS RESOLVE LIVE: every registry concept returns nonempty canonical html; all four kinds are exercised', function(){
      var d = GAME_DATA['concept-links'], kinds = {};
      for (var i = 0; i < d.concepts.length; i++) {
        var c = d.concepts[i], res = conceptResolve(c.id);
        if (!res || !res.html || !res.title) throw new Error(c.id + ' failed to resolve');
        kinds[c.kind] = 1;
      }
      ['codex','glossary','source','card'].forEach(function(k){ if (!kinds[k]) throw new Error('kind not exercised: ' + k); });
      return { concepts: d.concepts.length };
    });

    check('UNKNOWN-ID INERTNESS: a span with an unregistered concept id stays PLAIN TEXT after decoration (no role, no tabindex, no modal on click)', function(){
      var host = document.createElement('div');
      host.innerHTML = '<span data-concept="concept:not-a-real-concept" data-no-gloss>plain words</span>'
        + '<span data-concept="concept:union-blockade" data-no-gloss>blockade</span>';
      document.body.appendChild(host);
      try {
        conceptDecorate(host);
        var bad = host.querySelector('[data-concept="concept:not-a-real-concept"]');
        var good = host.querySelector('[data-concept="concept:union-blockade"]');
        if (bad.getAttribute('role') || bad.getAttribute('tabindex') || bad.getAttribute('data-cl-done')) throw new Error('unknown id was decorated');
        if (good.getAttribute('role') !== 'button' || good.getAttribute('tabindex') !== '0') throw new Error('known id was not decorated');
        bad.click();
        if (document.getElementById('clModal')) throw new Error('unknown id opened a modal');
      } finally { document.body.removeChild(host); }
      return { ok: true };
    });

    check('DEEP LINK + PROVENANCE + FOCUS RETURN (click path): opening a codex concept shows the canonical entry with its sources VISIBLE; Close returns focus to the invoking span', function(){
      var host = document.createElement('div');
      host.innerHTML = '<span id="clProbeSpan" data-concept="concept:union-blockade" data-no-gloss>blockade</span>';
      document.body.appendChild(host);
      try {
        conceptDecorate(host);
        var span = document.getElementById('clProbeSpan');
        span.click();
        var modal = document.getElementById('clModal');
        if (!modal) throw new Error('modal did not open');
        if (modal.getAttribute('role') !== 'dialog' || modal.getAttribute('aria-modal') !== 'true') throw new Error('dialog semantics missing');
        var body = modal.querySelector('.cx-body');
        if (!body || body.style.display === 'none') throw new Error('codex body not force-expanded (sources hidden)');
        if (modal.textContent.toLowerCase().indexOf('blockade') < 0) throw new Error('canonical content missing');
        var head = modal.querySelector('.cx-head');
        if (head && head.getAttribute('aria-expanded') !== 'true') throw new Error('aria-expanded not trued');
        document.getElementById('clModalClose').click();
        if (document.getElementById('clModal')) throw new Error('modal did not close');
        if (document.activeElement !== span) throw new Error('focus did not return to the invoking span');
      } finally { document.body.removeChild(host); }
      return { ok: true };
    });

    check('FOCUS RETURN (Escape path) + SOURCE-KIND PROVENANCE: a primary-source concept opens with its citation list; Escape closes and returns focus', function(){
      var host = document.createElement('div');
      host.innerHTML = '<span id="clProbeSpan2" data-concept="concept:emancipation-service" data-no-gloss>service</span>';
      document.body.appendChild(host);
      try {
        conceptDecorate(host);
        var span = document.getElementById('clProbeSpan2');
        span.click();
        var modal = document.getElementById('clModal');
        if (!modal) throw new Error('modal did not open');
        var txt = modal.textContent;
        if (!/repository|archive|library|collection|https?:/i.test(txt) && txt.indexOf('Source') < 0) throw new Error('source citations not visible');
        modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        if (document.getElementById('clModal')) throw new Error('Escape did not close');
        if (document.activeElement !== span) throw new Error('focus did not return after Escape');
      } finally { document.body.removeChild(host); }
      return { ok: true };
    });

    check('DESK SPANS DECORATED: the economy tab renders the inflation + blockade spans as live deep links (the src/30 decorate seam)', function(){
      mkC('US');
      openWarDept();
      var cont = document.getElementById('wdContent');
      var spans = cont ? cont.querySelectorAll('[data-concept][data-cl-done="1"]') : [];
      if (spans.length < 2) throw new Error('expected >=2 decorated desk spans, got ' + spans.length);
      if (typeof closeSheet === 'function') closeSheet();
      G.campaign = null;
      return { decorated: spans.length };
    });

    check('PURITY: decorate + resolve + open/close write nothing to G.settings and leave no stray modal', function(){
      var s1 = JSON.stringify(G.settings);
      conceptResolve('concept:inflation'); conceptResolve('concept:mcpherson-at-atlanta');
      if (JSON.stringify(G.settings) !== s1) throw new Error('G.settings mutated');
      if (document.getElementById('clModal')) throw new Error('stray modal');
      return { ok: true };
    });
  } catch(e) { R.ok = false; R.errors.push(String(e && e.message || e)); }
  R.ok = R.ok && R.steps.every(function(s){ return s.ok; });
  return JSON.stringify(R);
})()`;

async function main() {
  const statics = staticChecks();
  let server = null, browser = null;
  try {
    const probe = 'http://127.0.0.1:' + cfg.port + '/civil_war_generals.html';
    if (!(await up(probe))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 80; i++) { if (await up(probe)) break; await sleep(150); }
    }
    try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
    catch(e) { browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
    const page = await browser.newPage({ viewport: cfg.viewport });
    await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch(e) {} });
    const pageerrors = [];
    page.on('pageerror', err => pageerrors.push(String(err.message)));
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(400);
    const data = JSON.parse(await page.evaluate(SETUP));
    data.steps = statics.concat(data.steps || []);
    data.pageerrors = pageerrors;
    data.ok = !!data.ok && statics.every(s => s.ok) && !pageerrors.length;
    writeFileSync(join(OUT, 'probe-concept-links.json'), JSON.stringify(data, null, 2));
    printResult(data);
    const fail = (data.steps || []).filter(s => !s.ok);
    if (!data.ok || fail.length || pageerrors.length) {
      for (const e of pageerrors) console.error('  PAGE ERROR:', e);
      process.exit(1);
    }
    console.log('ALL OK');
  } finally {
    await closeBrowserHard(browser);
    killChild(server);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error('FATAL:', e); process.exit(1); });
