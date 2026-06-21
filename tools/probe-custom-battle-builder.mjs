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
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const SETUP = `(() => {
  var R = { ok:true, steps:[] };
  var EXPECTED = ['bullrun1', 'malvernHill', 'antietam', 'fredericksburg', 'chancellorsville', 'gettysburg', 'shiloh', 'vicksburg'];
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
      if (!root.querySelector('[data-cb-list="units"]')) throw new Error('unit OOB rows missing');
      if (!document.getElementById('fldCbJson')) throw new Error('import/export textarea missing');
      return { button:true, rows:document.querySelectorAll('[data-cb-list="units"]').length };
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

    step('JSON: export/import round trip is stable and rejects unsafe prototype keys', function() {
      var r = fldCustomValidate(validDraft());
      var imported = fldCustomImportJson(r.json);
      if (!imported.ok) throw new Error(imported.errors.join(' | '));
      if (!eq(imported.scenario, r.scenario)) throw new Error('round trip scenario changed');
      var unsafe = fldCustomImportJson('{"scenario":{"name":"Bad","date":"1863","place":"x","__proto__":{"polluted":true},"oob":{"US":[],"CS":[]},"terrain":{},"objective":{"name":"x","x":1,"z":1,"r":500}}}');
      if (unsafe.ok) throw new Error('unsafe JSON object accepted');
      return { bytes:r.json.length, id:imported.scenario.id };
    });

    step('UI: export button fills JSON and import button rejects malformed text without page errors', function() {
      _fldCbState = validDraft();
      fldCustomBattleBuilderMenu();
      document.querySelector('[data-cb-act="export"]').click();
      var ta = document.getElementById('fldCbJson');
      if (!ta || ta.value.indexOf('"custom_probe_ridge"') < 0) throw new Error('export textarea not filled');
      ta.value = '{ broken json';
      document.querySelector('[data-cb-act="import"]').click();
      var status = document.querySelector('.fld-cb-status.bad');
      if (!status || status.textContent.indexOf('Malformed JSON') < 0) throw new Error('malformed import was not shown as blocked');
      return { exported:true };
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
    await page.screenshot({ path: join(OUT, 'probe-custom-battle-builder.png'), fullPage:false });
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
    if (browser) try { await Promise.race([browser.close(), sleep(2500)]); } catch(e) {}
    if (server) server.kill();
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
