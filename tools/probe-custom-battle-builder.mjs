#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-custom-battle-builder.mjs
// Focused C4 gate: renders the Custom Battle Builder, validates bad + good
// scenarios, proves JSON round-trip/persistence, launches through fldScenarioInit,
// and guards the historical tactical registry + Classic state.

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

// S25 (D245) anti-drift tooth — every --h0d-* token a pre-battle config surface defines must carry
// EXACTLY the value the H0 desk shell defines (src/99-h0-president-desk.js), so the three surfaces
// can never quietly diverge from the shared palette again. Runs node-side before the browser.
{
  const canon = {};
  const h0 = readFileSync(join(ROOT, 'src', '99-h0-president-desk.js'), 'utf8');
  for (const m of h0.matchAll(/--h0d-([a-z0-9]+):([^;"'}]+)/g)) if (!(m[1] in canon)) canon[m[1]] = m[2].trim();
  if (!canon.brass || !canon.focus) throw new Error('S25 tooth: could not extract --h0d-* canon from 99-h0-president-desk.js');
  for (const rel of ['src/tactical/T2-campaign-link.js', 'src/tactical/T6-presets.js', 'src/tactical/T11-custom-battle.js']) {
    const txt = readFileSync(join(ROOT, rel), 'utf8');
    let defs = 0;
    for (const m of txt.matchAll(/--h0d-([a-z0-9]+):([^;"'}]+)/g)) {
      defs++;
      if (!(m[1] in canon)) throw new Error('S25 tooth: ' + rel + ' defines unknown token --h0d-' + m[1]);
      if (m[2].trim() !== canon[m[1]]) throw new Error('S25 tooth: ' + rel + ' --h0d-' + m[1] + ' = ' + m[2].trim() + ' but the H0 canon is ' + canon[m[1]]);
    }
    if (!defs) throw new Error('S25 tooth: ' + rel + ' defines no --h0d-* tokens (the surface fell off the shared palette)');
  }
  console.log('S25 token canon check: 3 surfaces match the H0 --h0d-* values');
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }
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
function killChild(child) {
  if (!child) return;
  try { child.kill(); } catch(e) {}
}

const SETUP = `(() => {
  var R = { ok:true, steps:[] };
  var EXPECTED = ['bullrun1', 'crossKeysPortRepublic', 'gainesMill', 'malvernHill', 'antietam', 'fredericksburg', 'chancellorsville', 'gettysburg', 'newMarketHeights', 'fortDonelson', 'elkhornTavern', 'shiloh', 'stonesRiver', 'vicksburg', 'chickamauga', 'chattanooga', 'wilderness', 'spotsylvania', 'petersburgAssaults', 'kennesaw', 'atlanta', 'cedarCreek', 'franklin', 'nashville', 'fiveForks'];   // D397: 23 -> 24 — Petersburg initial assaults registers at rank 69 between spotsylvania and kennesaw.
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function cleanStore() { try { localStorage.removeItem('cw_custom_battles_v1'); } catch(e) {} }
  function ids() { return Object.keys(fldScenarioRegistry()).sort(); }
  function validDraft() {
    var d = fldCustomDefaultDraft();
    d.id = 'custom_probe_ridge';
    d.name = 'Probe Ridge';
    d.date = 'October 1863';
    d.place = 'Probe County, Virginia';
    d.fieldW = 1500;
    d.fieldH = 1000;
    d.objective.x = 740;
    d.objective.z = 470;
    d.objective.r = 135;
    d.terrain.markers[0].path = '90,760;620,540;1410,315';
    d.units[0].id = 'us_probe_1';
    d.units[1].id = 'us_probe_2';
    d.units[2].id = 'us_probe_guns';
    d.units[2].guns = 6;
    d.units[2].men = 132;
    d.units[3].id = 'us_probe_reserve';
    d.units[3].z = 1030;
    d.units[4].id = 'cs_probe_1';
    d.units[5].id = 'cs_probe_2';
    d.units[6].id = 'cs_probe_guns';
    d.units[6].guns = 4;
    d.units[6].men = 92;
    d.units[7].id = 'cs_probe_reserve';
    d.leaders[0].id = 'us_probe_cmd';
    d.leaders[0].attach = 'us_probe_1';
    d.leaders[1].id = 'cs_probe_cmd';
    d.leaders[1].attach = 'cs_probe_1';
    d.supply.US.x = 720;
    d.supply.US.z = 940;
    d.supply.CS.x = 760;
    d.supply.CS.z = 70;
    return d;
  }
  function secondDraft() {
    var d = validDraft();
    d.id = 'custom_probe_creek';
    d.name = 'Probe Creek';
    d.place = 'Probe Creek, Tennessee';
    d.objective.name = 'Creek Crossing';
    d.objective.x = 680;
    d.objective.z = 500;
    d.units[0].id = 'us_creek_1';
    d.units[1].id = 'us_creek_2';
    d.units[2].id = 'us_creek_guns';
    d.units[3].id = 'us_creek_reserve';
    d.units[4].id = 'cs_creek_1';
    d.units[5].id = 'cs_creek_2';
    d.units[6].id = 'cs_creek_guns';
    d.units[7].id = 'cs_creek_reserve';
    d.leaders[0].id = 'us_creek_cmd';
    d.leaders[0].attach = 'us_creek_1';
    d.leaders[1].id = 'cs_creek_cmd';
    d.leaders[1].attach = 'cs_creek_1';
    return d;
  }
  try {
    cleanStore();
    if (typeof fldCustomDefaultDraft !== 'function' || typeof fldCustomValidate !== 'function' || typeof fldCustomScenarioData !== 'function')
      return JSON.stringify({ ok:false, fatal:'custom builder API missing', steps:[] });
    G.settings = G.settings || {};
    G.mode = 'menu';
    delete G.battle;

    step('API: builder helpers and unchanged historical roster are present', function() {
      var want = EXPECTED.slice().sort();
      if (!eq(ids(), want)) throw new Error('historical registry changed: ' + ids().join(','));
      if (typeof fldCustomImportJson !== 'function' || typeof fldCustomSaveScenario !== 'function' || typeof fldLaunchSandbox !== 'function') throw new Error('missing import/save/launch helpers');
      ['fldCustomTemplateJson','fldCustomExportPack','fldCustomImportPackJson','fldCustomInstallPack'].forEach(function(n) {
        if (typeof globalThis[n] !== 'function') throw new Error('missing pack helper ' + n);
      });
      return { registry:ids() };
    });

    step('UI: main menu injects one first-class builder button and opens the builder form', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      if (typeof fldInjectMenuButton === 'function') fldInjectMenuButton();
      if (typeof fldCustomInjectBuilderButton === 'function') fldCustomInjectBuilderButton();
      fldCustomInjectBuilderButton();
      var btns = document.querySelectorAll('#fldCustomBuilderBtn');
      if (btns.length !== 1) throw new Error('builder button count ' + btns.length);
      btns[0].click();
      var root = document.querySelector('.fld-cb');
      if (!root) throw new Error('builder root missing');
      var required = ['name','date','place','fieldW','fieldH','timeLimitSec','holdToWinSec'];
      for (var i = 0; i < required.length; i++) if (!root.querySelector('[data-cb-field="' + required[i] + '"]')) throw new Error('missing field ' + required[i]);
      ['template','export-pack','import-pack'].forEach(function(act) {
        if (!root.querySelector('[data-cb-act="' + act + '"]')) throw new Error('missing action ' + act);
      });
      if (!root.querySelector('[data-cb-list="units"]')) throw new Error('unit OOB rows missing');
      if (!document.getElementById('fldCbJson')) throw new Error('import/export textarea missing');
      return { button:true, rows:document.querySelectorAll('[data-cb-list="units"]').length };
    });

    step('S25 (D245): the builder skin consumes the shared H0 --h0d-* tokens; the invented palette is gone', function() {
      var css = _fldCbHtml();
      ['--h0d-brass:#d8b458','--h0d-focus:#ffe27a','--h0d-panel:#111918','var(--h0d-muted)','var(--h0d-green)','var(--h0d-red)','var(--h0d-warn)','var(--h0d-line)'].forEach(function(t) {
        if (css.indexOf(t) < 0) throw new Error('missing token use: ' + t);
      });
      ['#9c7a3c','#d8c8aa','#e4c677','#cf6a5e','#5e8d58','#a99778','#c9b58e','#17120d','#f5ead6','#9e8a68','#4c3b25','#3b2d1e','#665136','#20170f'].forEach(function(h) {
        if (css.indexOf(h) >= 0) throw new Error('retired invented hex still present: ' + h);
      });
      // the live DOM resolves the token: an input border computes to the H0 brass
      var inp = document.querySelector('.fld-cb input');
      if (inp) {
        var bc = getComputedStyle(inp).borderColor;
        if (bc !== 'rgb(216, 180, 88)') throw new Error('input border did not resolve to --h0d-brass: ' + bc);
      }
      return { tokens:true, resolved:!!inp };
    });

    step('VALIDATION: rejects malformed JSON, missing fields, duplicate IDs, objective overflow, bad artillery, forbidden keys, and phases', function() {
      var malformed = fldCustomImportJson('{ no }');
      if (malformed.ok || !/Malformed JSON/.test(malformed.errors.join(' '))) throw new Error('malformed JSON accepted');
      var bad = validDraft();
      bad.name = '';
      bad.objective.x = 12;
      bad.objective.r = 220;
      bad.units[1].id = bad.units[0].id;
      bad.units[2].men = 5;
      bad.fireScale = 2;
      bad.phases = [{ id:'unsafe' }];
      var r = fldCustomValidate(bad);
      var msg = r.errors.join(' | ');
      if (r.ok) throw new Error('invalid scenario passed');
      ['Scenario name', 'Duplicate', 'artillery crew', 'Forbidden', 'single-phase', 'Objective radius'].forEach(function(part) {
        if (msg.indexOf(part) < 0) throw new Error('missing validation error for ' + part + ': ' + msg);
      });
      return { errors:r.errors.length };
    });

    step('VALIDATION: valid scenario produces canonical single-phase field data with terrain, OOB, guns, reinforcements, leaders, supply, and teaching', function() {
      var r = fldCustomValidate(validDraft());
      if (!r.ok) throw new Error(r.errors.join(' | '));
      var s = r.scenario;
      if (s.phases) throw new Error('valid custom scenario gained phases[]');
      if (s.field.w !== 1500 || s.field.h !== 1000) throw new Error('field size not preserved');
      if (!s.oob.US.length || !s.oob.CS.length) throw new Error('OOB missing side units');
      if (!s.reinforcements.length) throw new Error('reinforcements missing');
      if (!s.terrain.hills.length || !s.terrain.woods.length || !s.terrain.walls.length || !s.terrain.markers.length) throw new Error('terrain missing');
      if (!s.oob.US.some(function(u){ return u.arm === 'art' && u.guns === 6; })) throw new Error('artillery guns not carried');
      if (!s.leaders.US.length || !s.leaders.CS.length) throw new Error('leaders missing');
      if (!s.supply.US || !s.supply.CS) throw new Error('supply missing');
      if (!s.teaching || !s.teaching.cards.length) throw new Error('teaching missing');
      return { id:s.id, us:s.oob.US.length, cs:s.oob.CS.length, reinforcements:s.reinforcements.length };
    });

    step('JSON: export/import round trip is stable', function() {
      // E75 (D427): the old unsafe-key sub-check here used a payload that was ALREADY invalid
      // (empty OOBs, oversized objective), so its red result proved nothing about unsafe keys.
      // The honest policy tooth is the dedicated E75 step below.
      var r = fldCustomValidate(validDraft());
      var imported = fldCustomImportJson(r.json);
      if (!imported.ok) throw new Error(imported.errors.join(' | '));
      if (!eq(imported.scenario, r.scenario)) throw new Error('round trip scenario changed');
      return { bytes:r.json.length, id:imported.scenario.id };
    });

    step('E75 (D427): unsafe-key POLICY on an OTHERWISE-VALID payload — import strips-then-accepts (no pollution, byte-equal); direct validate rejects', function() {
      var clean = fldCustomValidate(validDraft());
      if (!clean.ok) throw new Error('precondition: valid draft failed validation');
      var cleanImp = fldCustomImportJson(clean.json);
      if (!cleanImp.ok) throw new Error('precondition: clean import failed');
      // build the evil twin: the SAME valid payload with own __proto__ + nested own constructor
      var obj = JSON.parse(clean.json);
      var host = obj.scenario || obj;
      Object.defineProperty(host, '__proto__', { value: { polluted: true }, enumerable: true, configurable: true, writable: true });
      if (host.objective) Object.defineProperty(host.objective, 'constructor', { value: { evil: 1 }, enumerable: true, configurable: true, writable: true });
      var evilJson = JSON.stringify(obj);
      if (evilJson.indexOf('__proto__') < 0 || evilJson.indexOf('"constructor"') < 0) throw new Error('harness failed to build the unsafe payload');
      // POLICY (T11 design): the import lane SCRUBS unsafe keys BEFORE validation and ACCEPTS
      var evil = fldCustomImportJson(evilJson);
      if (!evil.ok) throw new Error('policy broken: otherwise-valid payload with unsafe keys must be accepted AFTER stripping, got reject: ' + evil.errors.join(' | '));
      // the strip left no trace: no own unsafe key anywhere in the accepted scenario
      var UNSAFE = { '__proto__':1, 'constructor':1, 'prototype':1, 'hasOwnProperty':1 };
      var hits = [];
      (function scan(node, path) {
        if (!node || typeof node !== 'object') return;
        var names = Object.getOwnPropertyNames(node);
        for (var i = 0; i < names.length; i++) {
          if (UNSAFE[names[i]] === 1 && !Array.isArray(node)) hits.push(path + '.' + names[i]);
          try { scan(node[names[i]], path + '.' + names[i]); } catch (e) {}
        }
      })(evil.scenario, 'scenario');
      if (hits.length) throw new Error('unsafe own keys survived the strip: ' + hits.join(', '));
      // no prototype pollution reached any object
      if (({}).polluted !== undefined || Object.prototype.polluted !== undefined) throw new Error('Object.prototype was polluted');
      if (evil.scenario.polluted !== undefined) throw new Error('accepted scenario inherits pollution');
      // the accepted scenario is byte-equal to the clean import — stripping changed nothing else
      if (!eq(evil.scenario, cleanImp.scenario)) throw new Error('stripped import differs from the clean import');
      // defense-in-depth stays explicit: DIRECT validation of an unscrubbed unsafe payload rejects
      var direct = fldCustomValidate(JSON.parse(evilJson));
      if (direct.ok) throw new Error('direct fldCustomValidate accepted an unscrubbed unsafe payload');
      if (direct.errors.join(' ').indexOf('Unsafe JSON key') < 0) throw new Error('direct reject did not name the unsafe key: ' + direct.errors.join(' | '));
      return { accepted: true, directRejected: true };
    });

    step('PACK: template, export, import-to-empty-slots, duplicate rejection, and forbidden-key rejection are locked', function() {
      cleanStore();
      var tmpl = JSON.parse(fldCustomTemplateJson());
      if (tmpl.schema !== 'cw_custom_battle_v1' || !tmpl.scenario || tmpl.scenario.id.indexOf('custom_') !== 0) throw new Error('template malformed');
      var a = fldCustomValidate(validDraft());
      var b = fldCustomValidate(secondDraft());
      if (!a.ok || !b.ok) throw new Error('valid pack drafts failed validation');
      var directDup = fldCustomInstallPack([a.scenario, a.scenario]);
      if (directDup.ok || directDup.errors.join(' ').indexOf('Duplicate scenario id') < 0) throw new Error('direct installer duplicate ids accepted');
      cleanStore();
      var pk = fldCustomExportPack([a.scenario, b.scenario], { title:'Probe Pack' });
      if (!pk.ok) throw new Error(pk.errors.join(' | '));
      var raw = JSON.parse(pk.json);
      if (raw.schema !== 'cw_custom_battle_pack_v1' || raw.format !== 'cw_custom_battle_v1') throw new Error('pack schema wrong');
      if (!raw.scenarios || raw.scenarios.length !== 2) throw new Error('pack scenario count wrong');
      var imp = fldCustomImportPackJson(pk.json, { install:true });
      if (!imp.ok) throw new Error(imp.errors.join(' | '));
      if (imp.saved !== 2) throw new Error('pack did not install 2 scenarios: ' + imp.saved);
      var slots = fldCustomListSlots();
      if (!slots[0] || slots[0].id !== a.scenario.id || !slots[1] || slots[1].id !== b.scenario.id) throw new Error('pack slots not installed in order');
      if (!fldCustomScenarioData(b.scenario.id) || fldCustomScenarioData(b.scenario.id).name !== b.scenario.name) throw new Error('pack scenario lookup failed');
      if (Object.keys(fldScenarioRegistry()).indexOf(b.scenario.id) >= 0) throw new Error('pack scenario leaked into historical registry');
      var dup = JSON.parse(pk.json);
      dup.scenarios[1].id = dup.scenarios[0].id;
      if (fldCustomImportPackJson(JSON.stringify(dup)).ok) throw new Error('duplicate pack ids accepted');
      var bad = JSON.parse(pk.json);
      bad.scenarios[0].fireScale = 2;
      if (fldCustomImportPackJson(JSON.stringify(bad)).ok) throw new Error('forbidden combat key in pack accepted');
      if (fldCustomImportPackJson(pk.json, { install:true }).ok) throw new Error('installing duplicate saved ids should fail');
      return { scenarios:raw.scenarios.length, slots:imp.slots };
    });

    step('UI: export/template/pack buttons fill JSON and import button rejects malformed text without page errors', function() {
      _fldCbState = validDraft();
      _fldCbCleanJson = null;   // S24 (D233): the harness swapped the draft out-of-band — re-baseline so the dirty-confirm (tested in its own step) stays out of this flow
      fldCustomBattleBuilderMenu();
      document.querySelector('[data-cb-act="export"]').click();
      var ta = document.getElementById('fldCbJson');
      if (!ta || ta.value.indexOf('"custom_probe_ridge"') < 0) throw new Error('export textarea not filled');
      document.querySelector('[data-cb-act="template"]').click();
      ta = document.getElementById('fldCbJson');
      if (ta.value.indexOf('"schema": "cw_custom_battle_v1"') < 0) throw new Error('template textarea not filled');
      document.querySelector('[data-cb-act="export-pack"]').click();
      ta = document.getElementById('fldCbJson');
      if (ta.value.indexOf('"schema": "cw_custom_battle_pack_v1"') < 0) throw new Error('pack textarea not filled');
      ta.value = '{ broken json';
      document.querySelector('[data-cb-act="import"]').click();
      var status = document.querySelector('.fld-cb-status.bad');
      if (!status || status.textContent.indexOf('Malformed JSON') < 0) throw new Error('malformed import was not shown as blocked');
      return { exported:true };
    });

    step('S27 (D233): a Hold-to-win above the time-limit ceiling WARNS instead of silently clamping', function() {
      var d = validDraft(); d.timeLimitSec = 180; d.holdToWinSec = 600;
      var r = fldCustomValidate(d);
      if (!r.ok) throw new Error('clamp case should still validate: ' + r.errors.join(' | '));
      if (r.scenario.holdToWinSec !== 170) throw new Error('expected clamp to 170 (timeLimit-10), got ' + r.scenario.holdToWinSec);
      var warned = (r.warnings || []).some(function(w) { return String(w).indexOf('Hold-to-win') === 0; });
      if (!warned) throw new Error('no clamp warning pushed: ' + JSON.stringify(r.warnings));
      return { clampedTo: r.scenario.holdToWinSec, warned: true };
    });

    step('S21/S26 (D233): every editor-table control carries an accessible name; numeric cells are inputmode=numeric', function() {
      _fldCbState = validDraft(); _fldCbCleanJson = null;
      fldCustomBattleBuilderMenu();
      var ctls = document.querySelectorAll('.fld-cb-table input, .fld-cb-table select, .fld-cb-table button');
      if (!ctls.length) throw new Error('no table controls rendered');
      var unnamed = 0;
      for (var i = 0; i < ctls.length; i++) {
        var el = ctls[i];
        var name = el.getAttribute('aria-label') || (el.tagName === 'BUTTON' ? (el.textContent || '').trim() : '');
        if (!name) unnamed++;
      }
      if (unnamed) throw new Error(unnamed + ' of ' + ctls.length + ' table controls have no accessible name');
      var menInp = document.querySelector('[data-cb-list="units"][data-cb-key="men"]');
      if (!menInp || menInp.getAttribute('inputmode') !== 'numeric') throw new Error('units men cell missing inputmode=numeric');
      var nameInp = document.querySelector('[data-cb-list="units"][data-cb-key="name"]');
      if (nameInp && nameInp.getAttribute('inputmode')) throw new Error('text cell should not carry inputmode=numeric');
      var qInp = document.querySelector('[data-cb-list="leaders"][data-cb-key="quality"]');
      if (!qInp || qInp.getAttribute('inputmode') !== 'decimal') throw new Error('fractional quality cell must be inputmode=decimal (a numeric keypad has no decimal key)');
      return { controls: ctls.length, unnamed: 0 };
    });

    step('S22/S23 (D233): edits restore keyboard focus; validation + a blocked Launch announce via the focused status region', function() {
      _fldCbState = validDraft(); _fldCbCleanJson = null;
      fldCustomBattleBuilderMenu();
      document.querySelector('[data-cb-act="validate"]').click();
      var st = document.querySelector('.fld-cb-status');
      if (!st) throw new Error('no status region after validate');
      if (document.activeElement !== st) throw new Error('validate did not move focus to the status region (active=' + (document.activeElement && (document.activeElement.id || document.activeElement.tagName)) + ')');
      if (st.getAttribute('role') !== 'status') throw new Error('valid result should be role=status, got ' + st.getAttribute('role'));
      document.querySelector('[data-cb-act="add-unit"]').click();
      var ae = document.activeElement;
      if (!ae || ae.getAttribute('data-cb-act') !== 'add-unit') throw new Error('Add Unit did not restore focus to the acted-on control');
      var nm = document.querySelector('[data-cb-field="name"]'); nm.value = '';
      document.querySelector('[data-cb-act="launch"]').click();
      st = document.querySelector('.fld-cb-status');
      if (!st || st.getAttribute('role') !== 'alert') throw new Error('blocked launch did not render a role=alert status');
      if (document.activeElement !== st) throw new Error('blocked launch did not move focus onto the alert');
      return { announced: true };
    });

    step('S24 (D233): destructive actions confirm before discarding an unsaved draft; clean drafts never prompt', function() {
      _fldCbState = validDraft(); _fldCbCleanJson = null;
      fldCustomBattleBuilderMenu();   // snapshots the clean baseline
      var nameEl = document.querySelector('[data-cb-field="name"]'); nameEl.value = 'Edited Ridge';
      var calls = [], origConfirm = window.confirm, allow = false;
      window.confirm = function(msg) { calls.push(String(msg)); return allow; };
      try {
        document.querySelector('[data-cb-act="reset"]').click();
        if (!calls.length) throw new Error('New Draft did not confirm on a dirty draft');
        var nm2 = document.querySelector('[data-cb-field="name"]');
        if (!nm2 || nm2.value !== 'Edited Ridge') throw new Error('a DECLINED confirm still discarded the draft');
        allow = true;
        document.querySelector('[data-cb-act="reset"]').click();
        nm2 = document.querySelector('[data-cb-field="name"]');
        if (nm2 && nm2.value === 'Edited Ridge') throw new Error('an ACCEPTED confirm did not reset the draft');
        calls.length = 0;
        document.querySelector('[data-cb-act="reset"]').click();
        if (calls.length) throw new Error('a CLEAN draft still prompted a confirm');
      } finally { window.confirm = origConfirm; }
      return { guarded: true };
    });

    step('PERSISTENCE: local slots save, list, reload, delete, and feed fldCustomScenarioData by explicit custom ID', function() {
      cleanStore();
      var r = fldCustomValidate(validDraft());
      var saved = fldCustomSaveScenario(0, r.scenario);
      if (!saved.ok) throw new Error(saved.errors.join(' | '));
      var slots = fldCustomListSlots();
      if (!slots[0] || slots[0].id !== r.scenario.id) throw new Error('slot did not save');
      var sd = fldCustomScenarioData(r.scenario.id);
      if (!sd || sd.name !== r.scenario.name) throw new Error('scenario data lookup failed');
      if (Object.keys(fldScenarioRegistry()).indexOf(r.scenario.id) >= 0) throw new Error('custom scenario leaked into historical registry');
      if (!fldCustomDeleteSlot(0)) throw new Error('delete failed');
      if (fldCustomScenarioData(r.scenario.id)) throw new Error('deleted slot still resolves');
      return { slot:'ok' };
    });

    step('LAUNCH CONTRACT: custom scenario launches via fldScenarioData/fldScenarioInit, uses shared gun model, no phases, no Classic battle, and field size resets after exit', function() {
      var r = fldCustomValidate(validDraft());
      _fldCbActiveScenario = r.scenario;
      fldLaunchSandbox({ renderer:'none', scenario:r.scenario.id, autoBoth:true, playerSide:'US', seed:44 });
      if (__FIELD.scenario !== r.scenario.id) throw new Error('scenario id mismatch');
      if (__FIELD.scenData.id !== r.scenario.id) throw new Error('scenData not custom');
      if (__FIELD.phases !== null) throw new Error('custom scenario initialized phases');
      if (FLD.FIELD_W !== 1500 || FLD.FIELD_H !== 1000) throw new Error('field dimensions not applied: ' + FLD.FIELD_W + 'x' + FLD.FIELD_H);
      if (!__FIELD.objective || __FIELD.objective.name !== r.scenario.objective.name) throw new Error('objective missing');
      if (__FIELD.units.length !== r.scenario.oob.US.length + r.scenario.oob.CS.length) throw new Error('initial units mismatch');
      if (!__FIELD.reinforce || __FIELD.reinforce.length !== r.scenario.reinforcements.length) throw new Error('reinforcement schedule mismatch');
      var art = __FIELD.units.filter(function(u){ return u.arm === 'art'; });
      if (!art.length || !art.some(function(u){ return u.guns === 6; })) throw new Error('artillery gun count not on field');
      if (G.battle && G.battle.M) throw new Error('Classic G.battle created by custom launch');
      fldExit(true);
      fldLaunchSandbox({ renderer:'none', autoBoth:true, seed:3 });
      if (FLD.FIELD_W !== FLD.BASE_FIELD_W || FLD.FIELD_H !== FLD.BASE_FIELD_H) throw new Error('field size leaked into sandbox');
      fldExit(true);
      return { units:r.scenario.oob.US.length + r.scenario.oob.CS.length, reinforcements:r.scenario.reinforcements.length };
    });

    step('NO CONTAMINATION: Classic state and canonical roster remain untouched after builder activity', function() {
      var want = EXPECTED.slice().sort();
      if (!eq(ids(), want)) throw new Error('registry changed after builder: ' + ids().join(','));
      if (G.battle && G.battle.M) throw new Error('Classic battle state exists');
      if (document.querySelectorAll('#fldCustomBuilderBtn').length > 1) throw new Error('duplicate builder buttons');
      return { registry:ids(), classic:false };
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
    await page.addInitScript(() => {
      try {
        localStorage.setItem('gor_welcomed', '1');
        localStorage.removeItem('cw_custom_battles_v1');
      } catch(e) {}
    });
    const pageerrors = [], consoleLines = [];
    page.on('pageerror', err => pageerrors.push(String(err.message)));
    page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') consoleLines.push('[' + msg.type() + '] ' + msg.text()); });
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(450);
    const data = JSON.parse(await page.evaluate(SETUP));
    await page.evaluate(`(() => {
      try { if (typeof fldCustomBattleBuilderMenu === 'function') fldCustomBattleBuilderMenu(); } catch(e) {}
    })()`);
    await sleep(250);
    await page.screenshot({ path: join(OUT, 'probe-custom-battle-builder.png'), fullPage:false, timeout: 120000 });   // slow-Mac budget (the D232 SLOW_MAC precedent) — the default 30s flaked under load
    const actionableConsoleErrors = consoleLines.filter(line => line.startsWith('[error]') && !/Failed to load resource:.*404/i.test(line));
    data.pageerrors = pageerrors;
    data.console = consoleLines.slice(-20);
    data.ok = !!data.ok && !pageerrors.length && !actionableConsoleErrors.length;
    writeFileSync(join(OUT, 'probe-custom-battle-builder.json'), JSON.stringify(data, null, 2));
    const ok = (data.steps || []).filter(s => s.ok).length;
    const fail = (data.steps || []).filter(s => !s.ok).length;
    console.log('probe-custom-battle-builder: ' + ok + '/' + (data.steps || []).length + ' steps ok' + (fail ? ', ' + fail + ' FAIL' : ', 0 fail'));
    if (!data.ok || fail || pageerrors.length) {
      if (data.fatal) console.error('FATAL:', data.fatal);
      for (const s of (data.steps || [])) if (!s.ok) console.error('  FAIL:', s.name, s.err);
      for (const e of pageerrors) console.error('  PAGE ERROR:', e);
      for (const c of actionableConsoleErrors) console.error('  CONSOLE:', c);
      process.exit(1);
    }
    console.log('ALL OK');
  } finally {
    await closeBrowserHard(browser);
    killChild(server);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error('FATAL:', e); process.exit(1); });
