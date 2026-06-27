#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-save-slots.mjs — Phase J focused gate for save/load/share hardening.
// Verifies named slots, rename/load/delete, import/export round trip, invalid payload
// handling, no-latch menu reinjection, and D35 one-turn undo on learner-friendly terms.

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

const SETUP = `(() => {
  var R = { ok:true, steps:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  function cleanStore() {
    try {
      for (var i = 0; i < 3; i++) localStorage.removeItem('gor_slot_' + i);
      localStorage.removeItem('gor_undo_last');
      localStorage.removeItem('gor_save');
    } catch(e) {}
  }
  function mkC(side, idx) {
    var C = { side:side || 'US', iron:false, idx:idx || 0, funds:900, recovery:false, completed:[],
      roster:[{ id:'R1', type:'inf', weapon:'springfield', xp:1, name:'Probe Infantry' }],
      nextId:2, stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0,
      recoveryMode:false, flipAtk:false, captured:[] };
    if (typeof _t1InitAll === 'function') _t1InitAll(C);
    return C;
  }
  function slotCount() { return document.querySelectorAll('#gnSaveLoad').length; }
  function input(id, value) {
    var el = document.getElementById(id); if (!el) throw new Error('missing input ' + id);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles:true }));
    return el;
  }
  try {
    cleanStore();
    G.mode = 'menu';
    G.settings = G.settings || {};
    G.settings.diff = 1;
    G.campaign = mkC('US', 0);

    step('API: save-slot helpers and campaignAdvance wrapper are present', function() {
      ['_slOpenManager','_slRead','_slWrite','_slSetSlotName','_slImportText','_slImportFile','_slExportString','_slCaptureUndo','_slRestoreUndo','_slInjectMenuButton'].forEach(function(n) {
        if (typeof window[n] !== 'function') throw new Error('missing ' + n);
      });
      if (typeof campaignAdvance !== 'function' || !campaignAdvance._slUndoWrapped) throw new Error('campaignAdvance not undo-wrapped');
      if (typeof importSave !== 'function' || !importSave._slHardened) throw new Error('importSave not hardened');
      return { wrapped:true, importHardened:true };
    });

    step('MENU: Save & Load button injects once, dedupes, and re-injects after removal/rebuild', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      _slInjectMenuButton(); _slInjectMenuButton();
      if (slotCount() !== 1) throw new Error('button count after dedupe ' + slotCount());
      var b = document.getElementById('gnSaveLoad');
      if (!b || !/Save and Load/.test(b.getAttribute('aria-label') || '')) throw new Error('button missing usable aria-label');
      b.parentNode.removeChild(b);
      _slInjectMenuButton();
      if (slotCount() !== 1) throw new Error('button did not re-inject after removal');
      openMainMenu(); _slInjectMenuButton();
      if (slotCount() !== 1) throw new Error('button duplicated after menu rebuild: ' + slotCount());
      return { button:true };
    });

    step('UI: manager renders three named slots, paste import, export/import, and accessible controls', function() {
      _slOpenManager();
      if (document.querySelectorAll('.sl-row').length !== 3) throw new Error('expected 3 slot rows');
      if (!document.getElementById('slImportJson')) throw new Error('paste-import textarea missing');
      ['slExport','slImport','slImportPaste','slBack','slSave0'].forEach(function(id){ if (!document.getElementById(id)) throw new Error('missing ' + id); });
      var bad = [];
      document.querySelectorAll('.sl-row button,input,textarea').forEach(function(el) {
        if (el.tagName === 'BUTTON' && !el.textContent.trim()) bad.push(el.id || el.tagName);
        if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !(el.getAttribute('aria-label') || document.querySelector('label[for="' + el.id + '"]'))) bad.push(el.id || el.tagName);
      });
      if (bad.length) throw new Error('weak control labels: ' + bad.join(','));
      return { rows:3 };
    });

    step('SLOTS: save, rename, load, and delete use validated payloads', function() {
      G.campaign = mkC('US', 0);
      _slOpenManager();
      input('slName0', 'Probe Slot');
      document.getElementById('slSave0').click();
      var m0 = _slMeta(0);
      if (!m0 || m0.label !== 'Probe Slot' || m0.side !== 'Union') throw new Error('slot save/meta failed: ' + JSON.stringify(m0));
      _slOpenManager();
      input('slName0', 'Renamed Probe');
      document.getElementById('slRename0').click();
      if ((_slMeta(0) || {}).label !== 'Renamed Probe') throw new Error('rename failed: ' + JSON.stringify(_slMeta(0)));
      G.campaign = mkC('CS', 2);
      _slOpenManager();
      document.getElementById('slLoad0').click();
      if (!G.campaign || G.campaign.side !== 'US' || G.campaign.idx !== 0) throw new Error('load did not restore slot campaign: ' + JSON.stringify(G.campaign && { side:G.campaign.side, idx:G.campaign.idx }));
      _slOpenManager();
      document.getElementById('slDel0').click();
      if (_slRead(0)) throw new Error('delete left a readable slot');
      return { ok:true };
    });

    step('IMPORT/EXPORT: JSON round trip restores campaign and rejects malformed/invalid payloads', function() {
      G.campaign = mkC('CS', 2);
      G.campaign.funds = 1776;
      var json = _slExportString(serializeSave());
      G.campaign = mkC('US', 0);
      var r = _slImportText(json);
      if (!r.ok) throw new Error('valid import rejected: ' + r.reason);
      if (G.campaign.side !== 'CS' || G.campaign.idx !== 2 || G.campaign.funds !== 1776) throw new Error('import did not restore campaign');
      if (_slImportText('{ broken').ok) throw new Error('malformed JSON accepted');
      if (_slImportText(JSON.stringify({ ver:_SAVE_VER, settings:[], campaign:null })).ok) throw new Error('settings array accepted');
      if (_slImportText(JSON.stringify({ ver:_SAVE_VER, settings:{}, campaign:7 })).ok) throw new Error('primitive campaign accepted');
      if (_slImportText(JSON.stringify({ ver:_SAVE_VER, settings:{ hasOwnProperty:7 }, campaign:null })).ok) throw new Error('hasOwnProperty-shadow settings accepted');
      return { bytes:json.length, side:G.campaign.side };
    });

    step('VALIDATION: stale slots, corrupt JSON, and wrong versions are hidden safely', function() {
      localStorage.setItem('gor_slot_0', '{ bad');
      if (_slRead(0)) throw new Error('corrupt JSON slot read as valid');
      localStorage.setItem('gor_slot_1', JSON.stringify({ ver:_SAVE_VER + 1, settings:{}, campaign:null }));
      if (_slRead(1)) throw new Error('future-version slot read as valid');
      localStorage.setItem('gor_slot_2', JSON.stringify({ ver:_SAVE_VER, settings:{}, campaign:3 }));
      if (_slRead(2)) throw new Error('primitive campaign slot read as valid');
      localStorage.setItem('gor_slot_2', JSON.stringify({ ver:_SAVE_VER, settings:{ hasOwnProperty:7 }, campaign:null }));
      if (_slRead(2)) throw new Error('hasOwnProperty-shadow settings slot read as valid');
      cleanStore();
      return { ok:true };
    });

    step('UNDO: learner-friendly campaign captures before campaignAdvance and restores exactly once', function() {
      cleanStore();
      G.settings.diff = 1;
      G.campaign = mkC('US', 0);
      G.battle = { playerSide:'US', enemySide:'CS', bd:{ id:'sumter', name:'Fort Sumter', year:1861 },
        infl:{ US:0, CS:0 }, casualties:{ US:0, CS:0 },
        units:[{ side:'US', alive:true, type:'inf', vetId:'R1', weapon:'springfield', xp:1, kills:0, name:'Probe Infantry' },
               { side:'CS', alive:false, type:'inf', id:'E1', weapon:'rifle', xp:0, kills:0, name:'Enemy' }] };
      campaignAdvance('US', 'win');
      if (!G.campaign || G.campaign.idx !== 1 || G.campaign.stats.battles !== 1) throw new Error('advance precondition failed');
      if (!_slReadUndo() || !_slUndoAvailable()) throw new Error('undo snapshot unavailable after accessible advance');
      _slOpenManager();
      var u = document.getElementById('slUndo');
      if (!u) throw new Error('undo button missing from manager');
      u.click();
      if (!G.campaign || G.campaign.idx !== 0 || G.campaign.stats.battles !== 0 || G.campaign.completed.length !== 0) throw new Error('undo did not restore pre-turn campaign');
      if (_slReadUndo()) throw new Error('undo snapshot was not cleared after restore');
      return { idx:G.campaign.idx, battles:G.campaign.stats.battles };
    });

    step('UNDO: hardened and Ironman terms do not retain an undo snapshot', function() {
      cleanStore();
      G.settings.diff = 3;
      G.campaign = mkC('US', 0);
      _slCaptureUndo('US', 'win');
      if (_slReadUndo()) throw new Error('hardened difficulty captured undo');
      G.settings.diff = 1;
      G.campaign = mkC('US', 0);
      G.campaign.iron = true;
      _slCaptureUndo('US', 'win');
      if (_slReadUndo()) throw new Error('ironman captured undo');
      G.campaign.iron = false;
      return { ok:true };
    });

    step('STATIC: save-slot hardening stays out of tactical/combat state and does not redeclare campaignAdvance', function() {
      var txt = window.__SL_SRC__ || '';
      if (/function\\s+campaignAdvance\\s*\\(/.test(txt)) throw new Error('campaignAdvance was redeclared instead of wrapped by assignment');
      if (/_SAVE_VER\\s*=/.test(txt)) throw new Error('module writes _SAVE_VER');
      if (/G\\.battle\\s*=/.test(txt)) throw new Error('module writes G.battle');
      return { scanned:txt.length };
    });

    return JSON.stringify(R);
  } catch(e) {
    return JSON.stringify({ ok:false, fatal:String(e && e.message || e), steps:R.steps });
  }
})()`;

async function main() {
  let server = null, browser = null;
  const probe = cfg.baseUrl + '/' + cfg.file;
  try {
    if (!(await up(probe))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 70; i++) { if (await up(probe)) break; await sleep(150); }
    }
    try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
    catch(e) { browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
    const page = await browser.newPage({ viewport: cfg.viewport });
    const pageerrors = [], consoleLines = [];
    page.on('pageerror', err => pageerrors.push(String(err.message)));
    page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') consoleLines.push('[' + msg.type() + '] ' + msg.text()); });
    await page.addInitScript(src => {
      window.__SL_SRC__ = src;
      try { localStorage.setItem('gor_welcomed', '1'); } catch(e) {}
    }, readFileSync(join(ROOT, 'src', '91-save-slots.js'), 'utf8'));
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(500);
    const data = JSON.parse(await page.evaluate(SETUP));
    await page.evaluate(`(() => { try { if (typeof _slOpenManager === 'function') _slOpenManager(); } catch(e) {} })()`);
    await sleep(250);
    await page.screenshot({ path: join(OUT, 'probe-save-slots.png'), fullPage:false });
    const actionableConsoleErrors = consoleLines.filter(line => line.startsWith('[error]') && !/Failed to load resource:.*404/i.test(line));
    data.pageerrors = pageerrors;
    data.console = consoleLines.slice(-20);
    data.ok = !!data.ok && !pageerrors.length && !actionableConsoleErrors.length;
    writeFileSync(join(OUT, 'probe-save-slots.json'), JSON.stringify(data, null, 2));
    const ok = (data.steps || []).filter(s => s.ok).length;
    const fail = (data.steps || []).filter(s => !s.ok).length;
    console.log('probe-save-slots: ' + ok + '/' + (data.steps || []).length + ' steps ok' + (fail ? ', ' + fail + ' FAIL' : ', 0 fail') + ' pageerrors=' + pageerrors.length);
    if (!data.ok || fail || pageerrors.length || actionableConsoleErrors.length) {
      if (data.fatal) console.error('FATAL:', data.fatal);
      for (const s of (data.steps || [])) if (!s.ok) console.error('  FAIL:', s.name, s.err);
      for (const e of pageerrors) console.error('  PAGE ERROR:', e);
      for (const c of actionableConsoleErrors) console.error('  CONSOLE:', c);
      process.exit(1);
    }
    console.log('ALL OK');
  } finally {
    if (browser) try { await Promise.race([browser.close(), sleep(2500)]); } catch(e) {}
    if (server) server.kill();
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
