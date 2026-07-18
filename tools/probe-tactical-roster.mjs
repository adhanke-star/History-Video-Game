#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-tactical-roster.mjs
// Focused integration probe for the data-driven __FIELD battle roster. It verifies the
// current playable battle registry, main-menu order, side-choice cards, launch contracts,
// and single-vs-multi-phase seams without changing tactical balance.

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
  var EXPECTED = ['bullrun1', 'crossKeysPortRepublic', 'gainesMill', 'malvernHill', 'antietam', 'fredericksburg', 'chancellorsville', 'gettysburg', 'newMarketHeights', 'fortDonelson', 'elkhornTavern', 'shiloh', 'stonesRiver', 'vicksburg', 'chickamauga', 'chattanooga', 'wilderness', 'spotsylvania', 'petersburgAssaults', 'kennesaw', 'atlanta', 'cedarCreek', 'franklin', 'nashville', 'fiveForks'];   // D397: 23 -> 24 — Petersburg initial assaults registers at rank 69 between spotsylvania and kennesaw (single-phase; PHASE_COUNTS unchanged).
  var PHASE_COUNTS = { vicksburg: 3, chickamauga: 3, chattanooga: 3, fortDonelson: 3, elkhornTavern: 2, nashville: 2, newMarketHeights: 2, stonesRiver: 2, cedarCreek: 2, crossKeysPortRepublic: 2 };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function allUnits(sd) {
    var out = [];
    function add(list) { if (!list) return; for (var i = 0; i < list.length; i++) out.push(list[i]); }
    if (sd && sd.phases) {
      for (var p = 0; p < sd.phases.length; p++) {
        add(sd.phases[p].oob && sd.phases[p].oob.US); add(sd.phases[p].oob && sd.phases[p].oob.CS); add(sd.phases[p].reinforcements);
      }
    } else if (sd) {
      add(sd.oob && sd.oob.US); add(sd.oob && sd.oob.CS); add(sd.reinforcements);
    }
    return out;
  }
  function phaseKind(sd) { return (sd && sd.phases && sd.phases.length) ? 'multi' : 'single'; }
  try {
    if (typeof fldScenarioRegistry !== 'function' || typeof fldScenarioMenuOrder !== 'function' || typeof fldLaunchSandbox !== 'function')
      return JSON.stringify({ ok:false, fatal:'missing tactical scenario registry / launcher helpers', steps:[] });
    G.settings = G.settings || {}; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    var reg = fldScenarioRegistry();

    step('REGISTRY: current playable battle ids are exactly the shipped Phase-C roster', function() {
      var ids = Object.keys(reg).sort();
      var want = EXPECTED.slice().sort();
      if (!eq(ids, want)) throw new Error('registry ids '+ids.join(',')+' != '+want.join(','));
      return { ids:ids };
    });

    step('MENU ORDER: public roster order keeps Gaines Mill between Bull Run and Malvern Hill, then follows chronology', function() {
      var order = fldScenarioMenuOrder(reg);
      if (!eq(order, EXPECTED)) throw new Error('menu order '+order.join(' -> ')+' != '+EXPECTED.join(' -> '));
      return { order:order };
    });

    step('DATA CONTRACT: every scenario has side cards, brief text, teaching, and provenance; data-built buttons also have menu copy', function() {
      var summary = {};
      for (var i = 0; i < EXPECTED.length; i++) {
        var id = EXPECTED[i], sd = reg[id];
        if (!sd || !sd.name || !sd.date || !sd.place) throw new Error(id+' missing name/date/place');
        if (id !== 'bullrun1' && (!sd.menu || !sd.menu.title || !sd.menu.deck || !sd.menu.aria)) throw new Error(id+' missing menu title/deck/aria');
        if (!sd.sides || !sd.sides.US || !sd.sides.CS) throw new Error(id+' missing side-choice data');
        if (!sd.brief || !sd.brief.attack || !sd.brief.defend) throw new Error(id+' missing attack/defend brief');
        if (!sd.teaching || !sd.teaching.cards || sd.teaching.cards.length < 2) throw new Error(id+' missing teaching cards');
        if (!sd.provenance) throw new Error(id+' missing provenance');
        summary[id] = { kind:phaseKind(sd), cards:sd.teaching.cards.length, menu:id === 'bullrun1' ? 'bespoke' : 'data' };
      }
      return summary;
    });

    step('SCENARIO SHAPE: single-objective and multi-phase battles declare the right required structures', function() {
      var summary = {};
      for (var i = 0; i < EXPECTED.length; i++) {
        var id = EXPECTED[i], sd = reg[id];
        if (phaseKind(sd) === 'multi') {
          var wantPhases = PHASE_COUNTS[id] || 3;
          if (sd.phases.length !== wantPhases) throw new Error(id+' should have '+wantPhases+' phases, got '+sd.phases.length);
          for (var p = 0; p < sd.phases.length; p++) {
            var ph = sd.phases[p];
            if (!ph.name || !ph.objective || !ph.terrain || !ph.oob || !ph.oob.US || !ph.oob.CS) throw new Error(id+' phase '+p+' malformed');
          }
          summary[id] = { phases:sd.phases.length };
        } else {
          if (!sd.objective || !sd.terrain || !sd.oob || !sd.oob.US || !sd.oob.CS) throw new Error(id+' single-objective shape malformed');
          summary[id] = { units:(sd.oob.US.length + sd.oob.CS.length), reinforcements:(sd.reinforcements || []).length };
        }
      }
      return summary;
    });

    step('UNIVERSAL GUN MODEL: post-Bull-Run artillery uses gun counts instead of proxy-men strength', function() {
      var out = {};
      for (var i = 0; i < EXPECTED.length; i++) {
        var id = EXPECTED[i], units = allUnits(reg[id]), arts = [];
        for (var j = 0; j < units.length; j++) if (units[j].arm === 'art') arts.push(units[j]);
        out[id] = arts.length;
        if (id !== 'bullrun1') {
          if (!arts.length) throw new Error(id+' has no artillery batteries');
          for (var k = 0; k < arts.length; k++) {
            if (!(arts[k].guns > 0)) throw new Error(id+' battery '+arts[k].id+' missing guns');
            if (!(arts[k].men > 0 && arts[k].men <= arts[k].guns * 40)) throw new Error(id+' battery '+arts[k].id+' crew/gun ratio suspicious: '+arts[k].men+' men / '+arts[k].guns+' guns');
          }
        }
      }
      return out;
    });

    step('MENU DOM: all registered battle buttons inject once, in roster order, before Skirmish/Command buttons', function() {
      if (typeof openMainMenu !== 'function') return { skipped:'no openMainMenu' };
      openMainMenu(); fldInjectMenuButton();
      var ids = ['fldBullRunBtn', 'fldScnBtn_crossKeysPortRepublic', 'fldScnBtn_gainesMill', 'fldScnBtn_malvernHill', 'fldScnBtn_antietam', 'fldScnBtn_fredericksburg', 'fldScnBtn_chancellorsville', 'fldScnBtn_gettysburg', 'fldScnBtn_newMarketHeights', 'fldScnBtn_fortDonelson', 'fldScnBtn_elkhornTavern', 'fldScnBtn_shiloh', 'fldScnBtn_stonesRiver', 'fldScnBtn_vicksburg', 'fldScnBtn_chickamauga', 'fldScnBtn_chattanooga', 'fldScnBtn_wilderness', 'fldScnBtn_spotsylvania', 'fldScnBtn_petersburgAssaults', 'fldScnBtn_kennesaw', 'fldScnBtn_atlanta', 'fldScnBtn_cedarCreek', 'fldScnBtn_franklin', 'fldScnBtn_nashville', 'fldScnBtn_fiveForks'];   // D397: 23 -> 24 buttons — fldScnBtn_petersburgAssaults inserts between spotsylvania and kennesaw.
      var found = [];
      for (var i = 0; i < ids.length; i++) {
        var btn = document.getElementById(ids[i]);
        if (!btn) throw new Error('missing menu button '+ids[i]);
        if (!btn.getAttribute('aria-label')) throw new Error(ids[i]+' missing aria-label');
        found.push(btn.id);
      }
      fldInjectMenuButton();
      for (var j = 0; j < ids.length; j++) if (document.querySelectorAll('#' + ids[j]).length !== 1) throw new Error('duplicate '+ids[j]);
      var domOrder = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; }).filter(function(id){ return ids.indexOf(id) >= 0; });
      if (!eq(domOrder, ids)) throw new Error('battle DOM order '+domOrder.join(' -> ')+' != '+ids.join(' -> '));
      return { buttons:found, order:domOrder };
    });

    step('SIDE CHOICE: every scenario renders two side cards and each card calls back its side', function() {
      var picked = {};
      for (var i = 0; i < EXPECTED.length; i++) {
        var id = EXPECTED[i];
        ['US', 'CS'].forEach(function(side) {
          var got = null;
          fldScenarioSideChoice(id, function(s){ got = s; });
          var cards = document.querySelectorAll('[data-brside]');
          if (cards.length !== 2) throw new Error(id+' expected 2 side cards, got '+cards.length);
          var c = document.querySelector('[data-brside="' + side + '"]');
          if (!c) throw new Error(id+' missing '+side+' card');
          c.click();
          if (got !== side) throw new Error(id+' '+side+' card returned '+got);
          picked[id + ':' + side] = got;
        });
      }
      return picked;
    });

    step('LAUNCH CONTRACT: every scenario launches from data, builds units/objective, keeps Classic state untouched, and sets phase machinery only for phases[] battles', function() {
      var out = {};
      for (var i = 0; i < EXPECTED.length; i++) {
        var id = EXPECTED[i], sd = reg[id];
        delete G.settings.tacticalFog;
        __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
        fldLaunchSandbox({ renderer:'none', scenario:id, autoBoth:true, playerSide:'US', seed:17 });
        if (__FIELD.scenario !== id) throw new Error(id+' launch set scenario '+__FIELD.scenario);
        if (!__FIELD.objective || !__FIELD.objective.name) throw new Error(id+' launch has no objective');
        if (!__FIELD.units || __FIELD.units.length < 2) throw new Error(id+' launch built too few units: '+(__FIELD.units && __FIELD.units.length));
        var multi = phaseKind(sd) === 'multi';
        if (multi && (!__FIELD.phases || __FIELD.phases.length !== sd.phases.length)) throw new Error(id+' did not initialize phases');
        if (!multi && __FIELD.phases !== null) throw new Error(id+' leaked phase machinery: '+__FIELD.phases);
        if (G.battle && G.battle.M) throw new Error(id+' created a Classic G.battle');
        fldSimStep(0.05);
        out[id] = { units:__FIELD.units.length, objective:__FIELD.objective.name, phases:__FIELD.phases ? __FIELD.phases.length : 0, scenario:__FIELD.scenario };
        try { fldExit(true); } catch(e) {}
      }
      return out;
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
    await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch(e) {} });
    const pageerrors = [], consoleLines = [];
    page.on('pageerror', err => pageerrors.push(String(err.message)));
    page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') consoleLines.push('[' + msg.type() + '] ' + msg.text()); });
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(400);
    const data = JSON.parse(await page.evaluate(SETUP));
    await page.evaluate(`(() => {
      try { if (typeof closeSheet === 'function') closeSheet(); } catch(e) {}
      try { if (typeof openMainMenu === 'function') openMainMenu(); } catch(e) {}
      try { if (typeof fldInjectMenuButton === 'function') fldInjectMenuButton(); } catch(e) {}
    })()`);
    await sleep(250);
    await page.screenshot({ path: join(OUT, 'probe-tactical-roster.png'), fullPage:false });
    const actionableConsoleErrors = consoleLines.filter(line => line.startsWith('[error]') && !/Failed to load resource:.*404/i.test(line));
    data.pageerrors = pageerrors;
    data.console = consoleLines.slice(-20);
    data.ok = !!data.ok && !pageerrors.length && !actionableConsoleErrors.length;
    writeFileSync(join(OUT, 'probe-tactical-roster.json'), JSON.stringify(data, null, 2));
    const ok = (data.steps || []).filter(s => s.ok).length;
    const fail = (data.steps || []).filter(s => !s.ok).length;
    console.log('probe-tactical-roster: ' + ok + '/' + (data.steps || []).length + ' steps ok' + (fail ? ', ' + fail + ' FAIL' : ', 0 fail'));
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
