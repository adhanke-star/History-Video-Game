#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-chief-of-staff.mjs - GEA-08 (D445): the Chief of Staff morning brief.
// AUTHORED under the D443 coding-first law (VETTING DEFERRED; the FINAL audit session runs
// it — AUDIT-DEBT AD-12). Verifies the D441 contract (docs/design/genre-elite-p1-contracts.md
// GEA-08): the data-declared rule table (closed shape, known reader ids, real desk tab ids),
// determinism (same campaign state -> the same at-most-three lines), the PURITY SNAPSHOT (the
// brief writes NOTHING to the campaign — the D443 §19 lesson class), the three-line cap, the
// fail-closed unknown-reader drop (never a throw), the honest all-quiet state, panel presence
// on the real desk, and the deep links landing on their owning live tabs.
// BIND A PREDECLARATION - removing the src/30 cosBriefHtml composition line must red exactly
// the PANEL-PRESENCE tooth (no #cosBrief on the desk), nothing else.
// BIND B PREDECLARATION - tampering data/chief-of-staff.json rules[0].reader to an unknown id
// must red exactly the STATIC known-reader tooth here AND exit tools/validate-data-schemas.mjs
// nonzero naming rules[0].reader (the cos-badrule fixture proves the same tooth on demand).
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
  console.log('probe-chief-of-staff ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

const READER_IDS = new Set([
  'decisions-pending', 'treasury-funds', 'treasury-inflation', 'morale-public',
  'manpower-pool', 'blockade-recognition', 'rail-integrity'
]);

function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };

  const data = JSON.parse(readFileSync(join(ROOT, 'data', 'chief-of-staff.json'), 'utf8'));
  const shell = readFileSync(join(ROOT, 'src', '30-president-shell.js'), 'utf8');

  check('DATA CLOSED SHAPE: cw_chief_of_staff_v1; config {maxLines 1-3, plain allQuiet}; 1-16 rules each exactly {id,reader,op,threshold,severity,copy,tab,label}; KNOWN reader ids; lt|gte; plain-text copy; unique ids', () => {
    if (data.schema !== 'cw_chief_of_staff_v1' || data.schemaVersion !== 1) throw new Error('schema marker wrong');
    if (!Number.isInteger(data.config.maxLines) || data.config.maxLines < 1 || data.config.maxLines > 3) throw new Error('maxLines out of bounds');
    if (/[<>]/.test(data.config.allQuiet)) throw new Error('allQuiet carries markup');
    if (!Array.isArray(data.rules) || !data.rules.length || data.rules.length > 16) throw new Error('rules bound');
    const ids = new Set();
    data.rules.forEach((r, i) => {
      const keys = Object.keys(r).sort().join(',');
      if (keys !== 'copy,id,label,op,reader,severity,tab,threshold') throw new Error('rules[' + i + '] keys ' + keys);
      if (!READER_IDS.has(r.reader)) throw new Error('rules[' + i + '] unknown reader ' + r.reader);
      if (r.op !== 'lt' && r.op !== 'gte') throw new Error('rules[' + i + '] op ' + r.op);
      if (!Number.isFinite(r.threshold) || !Number.isFinite(r.severity)) throw new Error('rules[' + i + '] numbers');
      if (/[<>]/.test(r.copy) || /[<>]/.test(r.label)) throw new Error('rules[' + i + '] markup in copy/label');
      if (ids.has(r.id)) throw new Error('duplicate id ' + r.id); ids.add(r.id);
    });
    return { rules: data.rules.length };
  });

  check('TAB TRUTH (registry-derived): every rule.tab appears in the src/30 desk tab registry literal', () => {
    const m = shell.match(/var tabs = \[([^\]]+)\]/);
    if (!m) throw new Error('cannot derive the desk tab registry');
    const tabs = new Set(m[1].split(',').map(s => s.trim().replace(/^"|"$/g, '')));
    data.rules.forEach((r, i) => { if (!tabs.has(r.tab)) throw new Error('rules[' + i + '].tab not a desk tab: ' + r.tab); });
    return { tabs: tabs.size };
  });

  check('SEAM PINS: the shell composes cosBriefHtml behind a typeof guard above wdTabs and wires cosWireBrief; src/00-manifest.json enrolls 109-chief-of-staff.js; the validator enrolls validateChiefOfStaff + the cos-badrule fixture', () => {
    if (!/typeof cosBriefHtml === "function"\) \? cosBriefHtml\(C\)/.test(shell)) throw new Error('guarded composition missing');
    if (shell.indexOf('cosWireBrief') < 0) throw new Error('wire call missing');
    const manifest = readFileSync(join(ROOT, 'src', '00-manifest.json'), 'utf8');
    if (manifest.indexOf('"109-chief-of-staff.js"') < 0) throw new Error('manifest enrollment missing');
    const validator = readFileSync(join(__dirname, 'validate-data-schemas.mjs'), 'utf8');
    ['validateChiefOfStaff', 'cos-badrule', 'COS_READER_IDS'].forEach(tok => { if (validator.indexOf(tok) < 0) throw new Error('validator missing ' + tok); });
    return { ok: true };
  });

  check('PURITY BY CONSTRUCTION: src/109 contains NO lazy-init tab-wrapper call (econRenderFinance/econInit/blockadeInit/decInit/moraleCompute/logisticsSnapshot/decPendingCount are all absent) — the D443 §19 lesson', () => {
    const mod = readFileSync(join(ROOT, 'src', '109-chief-of-staff.js'), 'utf8');
    ['econRenderFinance', 'econInit(', 'blockadeInit(', 'decInit(', 'moraleCompute(', 'logisticsSnapshot(', 'decPendingCount(', 'realDiplomacySnapshot('].forEach(tok => {
      if (mod.indexOf(tok) >= 0) throw new Error('impure reader call present: ' + tok);
    });
    return { ok: true };
  });

  return steps;
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function check(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  // the probe-decisions mkC idiom: a minimal real campaign seeded through _t1InitAll
  function mkC(side){ var C={ side:side||'US', iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if (typeof presInit === 'function') presInit(C);
    return C; }
  try {
    if (typeof cosBriefLines !== 'function' || typeof cosBriefHtml !== 'function' || typeof openWarDept !== 'function')
      return JSON.stringify({ ok:false, fatal:'chief-of-staff/desk API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';

    check('DETERMINISM: the same campaign state produces the SAME lines twice (order, copy, tabs)', function(){
      var C = mkC('US');
      var a = JSON.stringify(cosBriefLines(C)), b = JSON.stringify(cosBriefLines(C));
      if (a !== b) throw new Error('two reads differ');
      return { lines: JSON.parse(a).length };
    });

    check('PURITY SNAPSHOT: cosBriefLines + cosBriefHtml leave the campaign BYTE-IDENTICAL (deep JSON before/after — the §19 tooth class)', function(){
      var C = mkC('US');
      var before = JSON.stringify(C);
      cosBriefLines(C); cosBriefHtml(C);
      var after = JSON.stringify(C);
      if (before !== after) throw new Error('the brief mutated the campaign (len ' + before.length + ' -> ' + after.length + ')');
      return { bytes: before.length };
    });

    check('THREE-LINE CAP + SEVERITY ORDER: a crisis state firing every rule renders EXACTLY 3 lines in declared severity order (decisions > treasury > morale)', function(){
      var C = mkC('US');
      C.funds = 10;                                      // treasury-funds lt 60
      C.morale = C.morale || {}; C.morale.public = 20;   // morale-public lt 35
      C.manpower = C.manpower || {}; C.manpower.pool = 100;   // manpower-pool lt 300
      C.blockade = C.blockade || {}; C.blockade.recognition = 80;   // gte 60
      C.economy = C.economy || {}; C.economy.lastTurn = { inflRatePct: 25 };   // gte 12
      C.production = C.production || {}; C.production.railIntegrity = 30;   // lt 50
      C.president.pendingChoices = ['a', 'b'];           // gte 1
      var lines = cosBriefLines(C);
      if (lines.length !== 3) throw new Error('cap violated: ' + lines.length);
      if (lines[0].id !== 'cos-decisions' || lines[1].id !== 'cos-treasury' || lines[2].id !== 'cos-morale')
        throw new Error('severity order wrong: ' + lines.map(function(l){ return l.id; }).join(','));
      if (lines[0].copy.indexOf('2') < 0) throw new Error('{value} substitution missing');
      return { order: lines.map(function(l){ return l.id; }) };
    });

    check('FAIL-CLOSED UNKNOWN READER: a tampered rule with an unknown reader id is DROPPED (no throw, other rules unaffected); restore proven', function(){
      var d = GAME_DATA['chief-of-staff'];
      var saved = d.rules[0].reader;
      var C = mkC('US');
      C.president.pendingChoices = ['a'];
      try {
        d.rules[0].reader = 'not-a-reader';
        var lines = cosBriefLines(C);   // must not throw
        for (var i = 0; i < lines.length; i++) if (lines[i].id === 'cos-decisions') throw new Error('the tampered rule still fired');
      } finally { d.rules[0].reader = saved; }
      var again = cosBriefLines(C);
      var found = false; for (var j = 0; j < again.length; j++) if (again[j].id === 'cos-decisions') found = true;
      if (!found) throw new Error('restore failed');
      return { ok: true };
    });

    check('ALL-QUIET HONESTY: a healthy state renders the allQuiet copy and ZERO line buttons', function(){
      var C = mkC('US');
      C.funds = 200000;
      C.morale = C.morale || {}; C.morale.public = 70;
      C.manpower = C.manpower || {}; C.manpower.pool = 4000;
      C.blockade = C.blockade || {}; C.blockade.recognition = 10;
      C.economy = C.economy || {}; C.economy.lastTurn = { inflRatePct: 2 };
      C.production = C.production || {}; C.production.railIntegrity = 96;
      C.president.pendingChoices = [];
      var lines = cosBriefLines(C);
      if (lines.length !== 0) throw new Error('rules fired on a healthy state: ' + lines.map(function(l){ return l.id; }).join(','));
      var html = cosBriefHtml(C);
      if (html.indexOf(GAME_DATA['chief-of-staff'].config.allQuiet.split(' ')[0]) < 0) throw new Error('allQuiet copy missing');
      if (html.indexOf('data-costab') >= 0) throw new Error('line buttons rendered on all-quiet');
      return { ok: true };
    });

    check('PANEL PRESENCE + DEEP LINK: the real desk renders #cosBrief above wdTabs; clicking a brief line flips the target tab aria-pressed true', function(){
      var C = mkC('US');
      C.president.pendingChoices = ['x'];   // guarantee at least the decisions line
      openWarDept();
      var panel = document.getElementById('cosBrief');
      if (!panel) throw new Error('#cosBrief absent from the desk');
      var tabsRow = document.getElementById('wdTabs');
      if (!tabsRow || !(panel.compareDocumentPosition(tabsRow) & Node.DOCUMENT_POSITION_FOLLOWING)) throw new Error('panel is not above the tab row');
      var btn = panel.querySelector('[data-costab]');
      if (!btn) throw new Error('no deep-link line rendered');
      var target = btn.getAttribute('data-costab');
      btn.click();
      var tabBtn = document.getElementById('wdTab_' + target);
      if (!tabBtn || tabBtn.getAttribute('aria-pressed') !== 'true') throw new Error('deep link did not open ' + target);
      if (typeof closeSheet === 'function') closeSheet();
      return { target: target };
    });

    G.campaign = null;
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
    writeFileSync(join(OUT, 'probe-chief-of-staff.json'), JSON.stringify(data, null, 2));
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
