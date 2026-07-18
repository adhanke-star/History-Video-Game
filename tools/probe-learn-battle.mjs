#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-learn-battle.mjs - GEA-07 (D444): Learn-the-Battle metadata + the non-binding
// recommendation card. AUTHORED under the D443 coding-first law (VETTING DEFERRED; the FINAL
// audit session runs it — AUDIT-DEBT AD-11). Verifies the D441 contract
// (docs/design/genre-elite-p1-contracts.md GEA-07): the OPTIONAL learnMeta presentation
// metadata on every battle payload (closed shape, known skill ids, real recommendedAfter
// chain, phases matching the actual phase count), the read-only picker card (values derived
// from data; the explicit "recommendation, never a gate" line), the no-card path (a scenario
// without learnMeta contributes "" — the picker sheet is byte-identical), render purity
// (no settings/sim write), and the grep-guard (NO combat/AI src file reads learnMeta —
// T1-bull-run.js's render helper is the only src reader).
// BIND A PREDECLARATION - removing the T7 fldLearnCardHtml composition line must red exactly
// the CARD-PRESENCE tooth (the sheet renders no #fldLearnCard), nothing else.
// BIND B PREDECLARATION - tampering one skills entry in data/antietam.json to an unknown id
// must red exactly the STATIC closed-shape/known-skill tooth here AND exit
// tools/validate-data-schemas.mjs nonzero naming antietam.learnMeta.skills[i].
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
  console.log('probe-learn-battle ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

// The battle files + skill vocabulary mirror tools/validate-data-schemas.mjs (live-derived
// there from the payload keys; restated here so THIS probe stands alone as the GEA-07 tooth).
const BATTLE_FILES = [
  'antietam.json', 'atlanta.json', 'bullrun.json', 'chancellorsville.json', 'chickamauga.json',
  'chattanooga.json', 'cedar-creek.json', 'cold-harbor.json', 'cross-keys-port-republic.json',
  'franklin.json', 'fredericksburg.json', 'gaines-mill.json', 'gettysburg.json', 'kennesaw.json',
  'five-forks.json', 'fort-donelson.json', 'nashville.json', 'new-market-heights.json',
  'malvern-hill.json', 'elkhorn-tavern.json', 'petersburg-assaults.json', 'shiloh.json',
  'spotsylvania.json', 'stones-river.json', 'vicksburg.json', 'wilderness.json'
];
const SKILL_IDS = new Set([
  'facing', 'formations', 'fog-scouting', 'reinforcements', 'phases', 'works-assault',
  'artillery', 'assault-pacing', 'defense-hold', 'morale-rally', 'supply-ammo', 'cavalry'
]);
const META_KEYS = new Set(['_comment', '_meta', 'schemaVersion']);

function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };

  const payloads = {};
  for (const f of BATTLE_FILES) {
    const j = JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'));
    const key = Object.keys(j).find(k => !META_KEYS.has(k));
    payloads[key] = j[key];
  }
  const ids = new Set(Object.keys(payloads));

  check('COVERAGE + CLOSED SHAPE: every battle payload carries learnMeta with exactly {phases, approxMinutes, skills, recommendedAfter}; phases equals the actual phase count; [lo,hi] integers 1<=lo<=hi<=240; 1-6 known unique skill ids', () => {
    const bad = [];
    for (const [id, b] of Object.entries(payloads)) {
      const lm = b.learnMeta;
      if (!lm) { bad.push(id + ': learnMeta missing'); continue; }
      const keys = Object.keys(lm).sort().join(',');
      if (keys !== 'approxMinutes,phases,recommendedAfter,skills') bad.push(id + ': keys ' + keys);
      const actual = Array.isArray(b.phases) ? b.phases.length : 1;
      if (lm.phases !== actual) bad.push(id + ': phases ' + lm.phases + ' != actual ' + actual);
      const m = lm.approxMinutes;
      if (!Array.isArray(m) || m.length !== 2 || !Number.isInteger(m[0]) || !Number.isInteger(m[1]) || m[0] < 1 || m[0] > m[1] || m[1] > 240) bad.push(id + ': approxMinutes ' + JSON.stringify(m));
      if (!Array.isArray(lm.skills) || !lm.skills.length || lm.skills.length > 6) bad.push(id + ': skills bound');
      else {
        const seen = new Set();
        for (const s of lm.skills) { if (!SKILL_IDS.has(s)) bad.push(id + ': unknown skill ' + s); if (seen.has(s)) bad.push(id + ': dup skill ' + s); seen.add(s); }
      }
    }
    if (bad.length) throw new Error(bad.join(' | '));
    return { battles: Object.keys(payloads).length };
  });

  check('RECOMMENDED-AFTER CHAIN: every recommendedAfter is null or a REAL registered scenario id (never itself); exactly one null root (the bullrun1 opener); the chain is acyclic and covers all battles', () => {
    const roots = [];
    for (const [id, b] of Object.entries(payloads)) {
      const ra = b.learnMeta.recommendedAfter;
      if (ra === null) { roots.push(id); continue; }
      if (typeof ra !== 'string' || !ids.has(ra)) throw new Error(id + ': recommendedAfter not a registered id: ' + ra);
      if (ra === id) throw new Error(id + ': self-reference');
    }
    if (roots.length !== 1 || roots[0] !== 'bullrun1') throw new Error('null roots must be exactly [bullrun1], got ' + JSON.stringify(roots));
    // acyclicity: walk each node to the root; a cycle would exceed the node count.
    for (const id of ids) {
      let cur = id, hops = 0;
      while (payloads[cur].learnMeta.recommendedAfter !== null) {
        cur = payloads[cur].learnMeta.recommendedAfter;
        if (++hops > ids.size) throw new Error('cycle reached from ' + id);
      }
    }
    return { root: roots[0] };
  });

  check('GREP-GUARD: learnMeta is read by NO combat/AI/scoring src file — src/tactical/T1-bull-run.js (the render helper) is the ONLY src reader', () => {
    const offenders = [];
    const scan = (dir, prefix) => {
      for (const f of readdirSync(join(ROOT, dir))) {
        if (!f.endsWith('.js')) continue;
        const t = readFileSync(join(ROOT, dir, f), 'utf8');
        if (t.indexOf('learnMeta') >= 0) offenders.push(prefix + f);
      }
    };
    scan('src', 'src/');
    scan(join('src', 'tactical'), 'src/tactical/');
    if (JSON.stringify(offenders) !== JSON.stringify(['src/tactical/T1-bull-run.js'])) throw new Error('src readers must be exactly [src/tactical/T1-bull-run.js], got ' + JSON.stringify(offenders));
    return { readers: offenders };
  });

  check('VALIDATOR FAMILY: tools/validate-data-schemas.mjs enrolls the battle-learnmeta diagnostic fixture and the validateLearnMeta closed-shape family', () => {
    const t = readFileSync(join(__dirname, 'validate-data-schemas.mjs'), 'utf8');
    ['battle-learnmeta', 'validateLearnMeta', 'LEARN_SKILL_IDS'].forEach(tok => { if (t.indexOf(tok) < 0) throw new Error('validator missing ' + tok); });
    return { ok: true };
  });

  check('T7 COMPOSITION: the side-choice sheet composes fldLearnCardHtml behind a typeof guard (the D444 seam)', () => {
    const t = readFileSync(join(ROOT, 'src', 'tactical', 'T7-command-side.js'), 'utf8');
    if (!/typeof fldLearnCardHtml === "function"\) \? fldLearnCardHtml\(sd\)/.test(t)) throw new Error('T7 guarded composition line missing');
    return { ok: true };
  });

  return steps;
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function check(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  try {
    if (typeof fldScenarioRegistry !== 'function' || typeof fldScenarioSideChoice !== 'function' || typeof fldLearnCardHtml !== 'function')
      return JSON.stringify({ ok:false, fatal:'required picker/learn API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';

    check('CARD PRESENCE + DATA DERIVATION: the antietam side-choice sheet renders #fldLearnCard with the data approxMinutes band, the phase count, every skill label, the resolved predecessor NAME, and the verbatim never-a-gate line', function(){
      var sd = fldScenarioData('antietam'), lm = sd.learnMeta;
      if (!lm) throw new Error('antietam learnMeta missing');
      fldScenarioSideChoice('antietam', function(){});
      var card = document.getElementById('fldLearnCard');
      if (!card) throw new Error('#fldLearnCard absent from the sheet');
      var txt = card.textContent;
      if (txt.indexOf(String(lm.approxMinutes[0])) < 0 || txt.indexOf(String(lm.approxMinutes[1])) < 0) throw new Error('duration band not data-derived');
      if (txt.indexOf(lm.phases + ' phases') < 0 && !(lm.phases === 1 && txt.indexOf('1 phase') >= 0)) throw new Error('phase count missing');
      for (var i = 0; i < lm.skills.length; i++) {
        var label = FLD_LEARN_SKILL_LABELS[lm.skills[i]];
        if (!label || txt.indexOf(label) < 0) throw new Error('skill label missing: ' + lm.skills[i]);
      }
      var prev = fldScenarioData(lm.recommendedAfter);
      if (txt.indexOf(String(prev.name).split(' — ')[0]) < 0) throw new Error('predecessor name not resolved from data');
      if (txt.indexOf('A recommendation, never a gate') < 0) throw new Error('the never-a-gate contract line missing');
      if (typeof closeSheet === 'function') closeSheet();
      return { minutes: lm.approxMinutes, skills: lm.skills };
    });

    check('OPENER: bullrun1 (recommendedAfter null) renders the first-battle line, never a broken predecessor', function(){
      var html = fldLearnCardHtml(fldScenarioData('bullrun1'));
      if (html.indexOf('first battle') < 0) throw new Error('null recommendedAfter must render the first-battle line');
      if (html.indexOf('Recommended after:') >= 0) throw new Error('a null predecessor must not render the after line');
      return { ok: true };
    });

    check('NO-CARD BYTE-IDENTITY: with learnMeta absent the helper returns EXACTLY "" and the sheet renders no card (the pre-GEA-07 picker byte-wise)', function(){
      var sd = fldScenarioData('shiloh');
      var saved = sd.learnMeta;
      try {
        delete sd.learnMeta;
        if (fldLearnCardHtml(sd) !== '') throw new Error('helper must contribute the empty string');
        fldScenarioSideChoice('shiloh', function(){});
        if (document.getElementById('fldLearnCard')) throw new Error('card rendered without learnMeta');
        var sheet = document.querySelector('.sheet, #sheet, [role="dialog"]');
        var body = sheet ? sheet.innerHTML : document.body.innerHTML;
        if (body.indexOf('LEARN THE BATTLE') >= 0) throw new Error('learn copy leaked without learnMeta');
        if (typeof closeSheet === 'function') closeSheet();
      } finally { sd.learnMeta = saved; }
      return { restored: !!sd.learnMeta };
    });

    check('PURITY: rendering the card twice is string-identical and writes NOTHING (G.settings + __FIELD snapshots unchanged; no lock/difficulty/settings mutation — the informs-only contract)', function(){
      var sd = fldScenarioData('gettysburg');
      var s1 = JSON.stringify(G.settings), f1 = (typeof __FIELD !== 'undefined' && __FIELD) ? (__FIELD.scenario || null) : null;
      var a = fldLearnCardHtml(sd), b = fldLearnCardHtml(sd);
      if (a !== b) throw new Error('render not pure');
      if (JSON.stringify(G.settings) !== s1) throw new Error('G.settings mutated by a read-only card');
      var f2 = (typeof __FIELD !== 'undefined' && __FIELD) ? (__FIELD.scenario || null) : null;
      if (f1 !== f2) throw new Error('__FIELD mutated by a read-only card');
      return { bytes: a.length };
    });

    check('EVERY registered scenario with learnMeta produces a nonempty card; every one without produces ""', function(){
      var reg = fldScenarioRegistry(), n = 0;
      for (var id in reg) { if (!reg.hasOwnProperty(id)) continue;
        var html = fldLearnCardHtml(reg[id]);
        if (reg[id].learnMeta) { if (!html || html.indexOf('fldLearnCard') < 0) throw new Error(id + ': card empty despite learnMeta'); n++; }
        else if (html !== '') throw new Error(id + ': card without learnMeta');
      }
      if (n < 26) throw new Error('expected >=26 carded scenarios, got ' + n);
      return { carded: n };
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
    writeFileSync(join(OUT, 'probe-learn-battle.json'), JSON.stringify(data, null, 2));
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
