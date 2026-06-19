#!/usr/bin/env node
// tools/probe-malvern-hill.mjs
// Focused completion probe for the Malvern Hill data-driven __FIELD battle.
// It verifies the historical/data contract, single-phase launch seam, open-plateau
// terrain, universal gun-count artillery model, deterministic resolution,
// Union-defender balance, side-choice UI, end-note framing, and light roster regression.

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
  var R = { ok:true, steps:[], errors:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message || ev.error || ev)); });
  function isNum(n) { return typeof n === 'number' && isFinite(n); }
  function ids(list) { return (list || []).map(function(x){ return x.id || x.name; }).join(','); }
  function allUnits(sd) {
    return ((sd.oob && sd.oob.US) || []).concat((sd.oob && sd.oob.CS) || []).concat(sd.reinforcements || []);
  }
  function sideFielded(sd, side) {
    var n = 0, list = (sd.oob && sd.oob[side]) || [], rf = sd.reinforcements || [];
    for (var i = 0; i < list.length; i++) n += list[i].men || 0;
    for (var j = 0; j < rf.length; j++) if (rf[j].side === side) n += rf[j].men || 0;
    return n;
  }
  function sideGuns(sd, side) {
    var n = 0, units = allUnits(sd);
    for (var i = 0; i < units.length; i++) if (units[i].side === side || ((sd.oob && sd.oob[side] || []).indexOf(units[i]) >= 0)) {
      if (units[i].arm === 'art') n += units[i].guns || 0;
    }
    return n;
  }
  function strength(side) {
    var c = 0; for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === side && u.alive) c += u.men; }
    return Math.round(c);
  }
  function liveCount() { return __FIELD.units.length; }
  function nanScan() {
    for (var i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i];
      if (!isNum(u.x) || !isNum(u.z) || !isNum(u.men) || !isNum(u.morale) || !isNum(u.facing) || !isNum(u.fatigue) || !isNum(u.ammo)) return u.id;
    }
    return null;
  }
  function launchOpts(opts) {
    var out = {}, k; opts = opts || {};
    for (k in opts) if (Object.prototype.hasOwnProperty.call(opts, k) && k !== 'maxSteps') out[k] = opts[k];
    return out;
  }
  function runToEnd(maxSteps) {
    if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
    var n = 0;
    while (__FIELD.phase === 'battle' && n < maxSteps) { fldSimStep(0.05); n++; }
    return n;
  }
  function runMH(opts) {
    opts = opts || {};
    var maxSteps = opts.maxSteps || ((opts.scenario === 'antietam' || opts.scenario === 'gettysburg') ? 60000 : 26000);
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    fldLaunchSandbox(launchOpts(opts));
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = runToEnd(maxSteps);
    return {
      w:__FIELD.winner, us:strength('US'), cs:strength('CS'), steps:n, t:Math.round(__FIELD.t), winBy:__FIELD.winBy,
      atk:__FIELD.attacker, def:__FIELD.defender, phase:__FIELD.phase, scenario:__FIELD.scenario,
      hold:{ US:Math.round(__FIELD.holdSecs.US), CS:Math.round(__FIELD.holdSecs.CS) },
      phasesPlayed:__FIELD.phaseLog ? __FIELD.phaseLog.length : 0
    };
  }
  function keyScan(obj, path, bad) {
    if (!obj || typeof obj !== 'object') return;
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var p = path ? path + '.' + k : k;
      if (/^(damage|dmg|fireScale|killScale|combatScale|battleDamage|battleFire)$/i.test(k)) bad.push(p);
      keyScan(obj[k], p, bad);
    }
  }

  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof __FIELD === 'undefined')
      return JSON.stringify({ ok:false, fatal:'__FIELD engine / scenario registry missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;

    var DATA = (GAME_DATA && GAME_DATA["malvern-hill"]) ? GAME_DATA["malvern-hill"].malvernHill : null;

    step('DATA present: GAME_DATA["malvern-hill"].malvernHill is registered as a single-phase battle', function() {
      var reg = fldScenarioRegistry();
      if (!DATA) throw new Error('GAME_DATA["malvern-hill"].malvernHill missing');
      if (!reg.malvernHill) throw new Error('malvernHill missing from registry');
      if (DATA.phases) throw new Error('Malvern Hill should be single-phase, not phases[]');
      if (!DATA.oob || !DATA.oob.US || !DATA.oob.CS) throw new Error('OOB missing');
      if (!DATA.terrain || !DATA.terrain.hills || !DATA.terrain.woods || !DATA.terrain.markers) throw new Error('terrain hills/woods/markers missing');
      return { usUnits:DATA.oob.US.length, csUnits:DATA.oob.CS.length, reinforcements:(DATA.reinforcements || []).length };
    });

    step('DATA: attacker is CS, defender is US, cautious doctrine, objective is the Crew House / Malvern plateau', function() {
      if (DATA.attacker !== 'CS') throw new Error('attacker must be CS: ' + DATA.attacker);
      if (DATA.defender !== 'US') throw new Error('defender must be US: ' + DATA.defender);
      if (DATA.assaultDoctrine !== 'cautious') throw new Error('Malvern Hill should use cautious Confederate AI assault doctrine: ' + DATA.assaultDoctrine);
      if (DATA.defaultFog !== false) throw new Error('Malvern Hill should default fog OFF: ' + DATA.defaultFog);
      if (!DATA.objective || !/Crew|Malvern|Plateau/i.test(DATA.objective.name)) throw new Error('objective not Crew/Malvern plateau: ' + (DATA.objective && DATA.objective.name));
      if (!DATA.timeLimitSec || DATA.timeLimitSec < 360) throw new Error('timeLimitSec too short: ' + DATA.timeLimitSec);
      if (!DATA.holdToWinSec || DATA.holdToWinSec < 90) throw new Error('holdToWinSec too short: ' + DATA.holdToWinSec);
      return { attacker:DATA.attacker, defender:DATA.defender, objective:DATA.objective.name, timeLimit:DATA.timeLimitSec, holdToWin:DATA.holdToWinSec };
    });

    step('DATA: leaders include Porter, Hunt, Lee, Magruder, D.H. Hill, Armistead, and Jackson', function() {
      var us = ids(DATA.leaders && DATA.leaders.US), cs = ids(DATA.leaders && DATA.leaders.CS);
      ['ld_porter_malvern', 'ld_hunt_malvern'].forEach(function(id){ if (us.indexOf(id) < 0) throw new Error('US leader missing ' + id + ': ' + us); });
      ['ld_lee_malvern', 'ld_magruder_malvern', 'ld_dh_hill_malvern', 'ld_armistead_malvern', 'ld_jackson_malvern'].forEach(function(id){ if (cs.indexOf(id) < 0) throw new Error('CS leader missing ' + id + ': ' + cs); });
      return { US:us, CS:cs };
    });

    step('DATA: terrain teaches Malvern Hill, Crew House ridge, open killing fields, roads, ravines, and James River gunboats', function() {
      var txt = JSON.stringify(DATA.terrain);
      ['Malvern Hill plateau', 'Crew House ridge', 'open killing fields', 'Willis Church Road', 'Carter', 'James River gunboats', 'ravines'].forEach(function(n) {
        if (txt.indexOf(n) < 0) throw new Error('terrain missing ' + n);
      });
      if ((DATA.terrain.walls || []).length) throw new Error('Malvern Hill should not import the Fredericksburg/Chancellorsville wall pattern');
      if (DATA.terrain.hills.length < 3) throw new Error('want >=3 hills, got ' + DATA.terrain.hills.length);
      if (DATA.terrain.markers.length < 7) throw new Error('want >=7 terrain markers, got ' + DATA.terrain.markers.length);
      return { hills:DATA.terrain.hills.length, woods:DATA.terrain.woods.length, markers:DATA.terrain.markers.length };
    });

    step('DATA: batteries use the universal gun model with Union artillery superiority and realistic crew counts', function() {
      var units = allUnits(DATA), arts = [], usGuns = 0, csGuns = 0;
      for (var i = 0; i < units.length; i++) {
        if (units[i].arm !== 'art') continue;
        arts.push(units[i]);
        if (units[i].side === 'US' || ids(DATA.oob.US).indexOf(units[i].id) >= 0) usGuns += units[i].guns || 0;
        if (units[i].side === 'CS' || ids(DATA.oob.CS).indexOf(units[i].id) >= 0) csGuns += units[i].guns || 0;
      }
      if (arts.length < 5) throw new Error('want at least five aggregate batteries, got ' + arts.length);
      if (usGuns < 40) throw new Error('Union gun line too small: ' + usGuns);
      if (csGuns < 14) throw new Error('Confederate grand batteries too small: ' + csGuns);
      if (!(usGuns > csGuns)) throw new Error('Malvern should show Union artillery superiority: US ' + usGuns + ' CS ' + csGuns);
      for (var j = 0; j < arts.length; j++) {
        var a = arts[j];
        if (!(a.guns > 0)) throw new Error(a.id + ' missing gun count');
        if (!(a.men > 0 && a.men <= a.guns * 40)) throw new Error(a.id + ' crew/gun ratio suspicious: ' + a.men + '/' + a.guns);
      }
      return { batteries:arts.map(function(a){ return a.id + ':' + a.guns + 'g/' + a.men; }), usGuns:usGuns, csGuns:csGuns };
    });

    step('DATA: no battle-specific combat/damage fudge keys are present', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('battle-specific combat keys found: ' + bad.join(', '));
      return { scanned:true };
    });

    step('DATA: teaching and codex cover Hunt, grand batteries, piecemeal attack, McClellan retreat, and James River', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], cardIds = ids(cards);
      ['mh_hunt', 'mh_grand_batteries', 'mh_piecemeal', 'mh_mcclellan', 'mh_james_river'].forEach(function(id){ if (cardIds.indexOf(id) < 0) throw new Error('missing teaching card ' + id + ': ' + cardIds); });
      if (!DATA.teaching.codex || DATA.teaching.codex.id !== 'codex_malvern_hill') throw new Error('codex_malvern_hill missing');
      if (DATA.teaching.codex.axes.theater !== 'Eastern') throw new Error('codex theater wrong: ' + DATA.teaching.codex.axes.theater);
      return { cards:cardIds };
    });

    step('LAUNCH: Malvern Hill instantiates as single-phase, CS-attacker, no Classic battle contamination', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'malvernHill', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'malvernHill') throw new Error('scenario not set: ' + __FIELD.scenario);
      if (__FIELD.attacker !== 'CS' || __FIELD.defender !== 'US') throw new Error('asymmetry wrong: atk ' + __FIELD.attacker + ' def ' + __FIELD.defender);
      if (__FIELD._atkCautious !== true) throw new Error('cautious attacker flag missing');
      if (__FIELD.phases !== null) throw new Error('single-phase scenario leaked phase machinery');
      if (!__FIELD.objective || __FIELD.objective.name.indexOf('Malvern') < 0) throw new Error('objective not built');
      if (liveCount() !== DATA.oob.US.length + DATA.oob.CS.length) throw new Error('initial unit count wrong: ' + liveCount());
      if (G.battle && G.battle.M) throw new Error('Malvern Hill launch created a Classic G.battle');
      return { units:liveCount(), fog:__FIELD.fog, holdToWin:__FIELD.holdToWin, timeLimit:__FIELD.timeLimit };
    });

    step('TERRAIN: the crest has mild high-ground cover while the open approach stays exposed', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'malvernHill', autoBoth:true, seed:3 });
      var crest = fldCoverAt(600, 330);
      var open = fldCoverAt(600, 520);
      if (!(crest > 1.08 && crest < 1.4)) throw new Error('crest cover outside expected hill band: ' + crest);
      if (!(open < 1.05)) throw new Error('open approach unexpectedly covered: ' + open);
      return { crest:Math.round(crest * 100) / 100, open:Math.round(open * 100) / 100 };
    });

    step('REINFORCEMENTS: arrive on schedule, in order, idempotently', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'malvernHill', autoBoth:true, seed:7 });
      var base = liveCount(), sched = __FIELD.reinforce.slice();
      if (sched.length !== (DATA.reinforcements || []).length) throw new Error('schedule length mismatch');
      for (var i = 1; i < sched.length; i++) if (sched[i].atSec < sched[i - 1].atSec) throw new Error('schedule not sorted');
      __FIELD.phase = 'battle';
      __FIELD.t = 0; fldScenarioTick(0.05);
      if (liveCount() !== base) throw new Error('arrival at t=0: ' + liveCount() + ' vs ' + base);
      var first = sched[0];
      __FIELD.t = first.atSec + 1; fldScenarioTick(0.05);
      if (liveCount() !== base + 1) throw new Error('first reinforcement did not arrive at t=' + first.atSec);
      __FIELD.t = 99999; fldScenarioTick(0.05);
      if (liveCount() !== base + sched.length) throw new Error('not all reinforcements arrived');
      fldScenarioTick(0.05);
      if (liveCount() !== base + sched.length) throw new Error('reinforcements duplicated on re-tick');
      return { base:base, firstAt:first.atSec, totalAfterAll:liveCount(), schedule:sched.map(function(e){ return e.spec.id + '@' + e.atSec; }) };
    });

    var r1 = runMH({ scenario:'malvernHill', renderer:'none', autoBoth:true, playerSide:'US', seed:101 });
    step('Malvern Hill AI-vs-AI resolves to a winner with no hang/NaN', function() {
      if (!r1.w) throw new Error('no winner after ' + r1.steps + ' steps');
      if (r1.steps < 100) throw new Error('battle ended too fast: ' + r1.steps);
      if (r1.steps > 25999) throw new Error('battle did not resolve: ' + r1.steps);
      var bad = nanScan(); if (bad) throw new Error('NaN in unit ' + bad);
      return r1;
    });

    step('Malvern Hill AI-vs-AI produces meaningful, historically asymmetric losses', function() {
      var usLoss = sideFielded(DATA, 'US') - r1.us, csLoss = sideFielded(DATA, 'CS') - r1.cs;
      if (usLoss < 100) throw new Error('US losses too low: ' + usLoss);
      if (csLoss < 250) throw new Error('CS losses too low for Malvern Hill: ' + csLoss);
      if (!(csLoss > usLoss)) throw new Error('CS losses should exceed US losses at Malvern Hill: US ' + usLoss + ' CS ' + csLoss);
      return { usLoss:usLoss, csLoss:csLoss, winner:r1.w, winBy:r1.winBy };
    });

    var r2 = runMH({ scenario:'malvernHill', renderer:'none', autoBoth:true, playerSide:'US', seed:101 });
    step('Malvern Hill AI-vs-AI is deterministic for the same seed', function() {
      if (r1.w !== r2.w || r1.steps !== r2.steps || r1.winBy !== r2.winBy) throw new Error('same seed changed: ' + JSON.stringify(r1) + ' vs ' + JSON.stringify(r2));
      return { winner:r1.w, winBy:r1.winBy, steps:r1.steps };
    });

    step('Malvern Hill balance (8 seeds): Union gun line is defender-favored', function() {
      var seedVals = [1, 7, 21, 42, 55, 101, 303, 909], usWins = 0, csWins = 0, draws = 0, outcomes = [];
      for (var i = 0; i < seedVals.length; i++) {
        var r = runMH({ scenario:'malvernHill', renderer:'none', autoBoth:true, playerSide:'US', seed:seedVals[i] });
        if (r.w === 'US') usWins++; else if (r.w === 'CS') csWins++; else draws++;
        outcomes.push(seedVals[i] + ':' + r.w + '/' + r.winBy + '@' + r.t + 's');
      }
      if (usWins < 6) throw new Error('US wins only ' + usWins + '/8; outcomes [' + outcomes.join(', ') + ']');
      return { usWins:usWins + '/8', csWins:csWins + '/8', draws:draws + '/8', outcomes:outcomes };
    });

    step('US and CS passive-player launches both resolve', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        var r = runMH({ scenario:'malvernHill', renderer:'none', autoBoth:false, playerSide:ps, seed:7 });
        if (!r.w) throw new Error(ps + ' passive launch did not resolve');
        if (r.steps > 25999) throw new Error(ps + ' passive launch hit step limit');
        var bad = nanScan(); if (bad) throw new Error(ps + ' passive launch NaN in ' + bad);
        out[ps] = { winner:r.w, steps:r.steps, playerSide:__FIELD.playerSide };
      });
      return out;
    });

    step('SIDE-AWARE objective and end-note framing builds for US and CS players', function() {
      if (typeof fldBriefObjectiveHtml !== 'function' || typeof fldScenarioEndHtml !== 'function') throw new Error('brief/end helpers missing');
      fldLaunchSandbox({ renderer:'none', scenario:'malvernHill', autoBoth:true, playerSide:'US', seed:5 });
      var usH = fldBriefObjectiveHtml('US', DATA, 140), csH = fldBriefObjectiveHtml('CS', DATA, 140);
      if (usH.indexOf('HOLD') < 0 || usH.toLowerCase().indexOf('deny') < 0) throw new Error('US defensive objective not hold/deny framed: ' + usH);
      if (csH.indexOf('seize and hold') < 0) throw new Error('CS attack objective not seize framed: ' + csH);
      __FIELD.playerSide = 'US'; var usEnd = fldScenarioEndHtml('US');
      __FIELD.playerSide = 'CS'; var csEnd = fldScenarioEndHtml('CS');
      if (usEnd.indexOf('History holds') < 0) throw new Error('US victory history-holds end note missing');
      if (csEnd.indexOf('History is overturned') < 0) throw new Error('CS victory alternate-history end note missing');
      return { usObjectiveLen:usH.length, csObjectiveLen:csH.length, usEndLen:usEnd.length, csEndLen:csEnd.length };
    });

    step('MENU + SIDE CHOICE: Malvern Hill button and side cards render/click', function() {
      if (typeof openMainMenu !== 'function') return { skipped:'no openMainMenu' };
      G.mode = 'menu'; openMainMenu(); fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_malvernHill');
      if (!btn) throw new Error('missing fldScnBtn_malvernHill');
      if (!btn.getAttribute('aria-label')) throw new Error('Malvern Hill button missing aria-label');
      var got = null;
      fldScenarioSideChoice('malvernHill', function(side){ got = side; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('expected 2 side cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]');
      if (!cs) throw new Error('missing CS side card');
      cs.click();
      if (got !== 'CS') throw new Error('CS card returned ' + got);
      return { buttonText:btn.textContent.slice(0, 80), picked:got };
    });

    [['sandbox', 26000], ['bullrun1', 26000], ['fredericksburg', 26000], ['antietam', 60000], ['gettysburg', 60000], ['shiloh', 26000], ['chancellorsville', 26000]].forEach(function(pair) {
      var id = pair[0], limit = pair[1];
      var r = runMH({ scenario:id, renderer:'none', autoBoth:true, playerSide:'US', seed:101, maxSteps:limit });
      step('Regression: ' + id + ' still resolves', function() {
        if (!r.w) throw new Error(id + ' no winner');
        if (r.steps >= limit) throw new Error(id + ' hit step limit');
        if ((id === 'antietam' || id === 'gettysburg') && r.winBy !== 'phases') throw new Error(id + ' phase result incomplete: ' + JSON.stringify(r));
        return r;
      });
    });

    return JSON.stringify(R);
  } catch(e) {
    return JSON.stringify({ ok:false, fatal:String(e && e.message || e), steps:R.steps, errors:R.errors });
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

    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:60000 });
    await sleep(500);
    const data = JSON.parse(await page.evaluate(SETUP));
    data.screenshot = await page.evaluate(`(() => {
      try {
        fldLaunchSandbox({ renderer:'2d', scenario:'malvernHill', autoBoth:true, playerSide:'US', seed:21 });
        __FIELD.phase = 'battle'; __FIELD.paused = false;
        if (typeof fldStepN === 'function') fldStepN(900, 0.05);
        else for (var i = 0; i < 900 && __FIELD.phase === 'battle'; i++) fldSimStep(0.05);
        __FIELD.paused = true;
        if (typeof fld2dDraw === 'function') fld2dDraw();
        if (typeof fldRenderTop === 'function') fldRenderTop();
        if (typeof fldRenderHud === 'function') fldRenderHud();
        return { scenario:__FIELD.scenario, phase:__FIELD.phase, winner:__FIELD.winner, t:Math.round(__FIELD.t), units:__FIELD.units.length };
      } catch(e) { return { error:String(e && e.message || e) }; }
    })()`);
    await sleep(250);
    await page.screenshot({ path: join(OUT, 'probe-malvern-hill.png'), fullPage:false });

    const actionableConsoleErrors = consoleLines.filter(line => line.startsWith('[error]') && !/Failed to load resource:.*404/i.test(line));
    data.pageerrors = pageerrors;
    data.console = consoleLines.slice(-20);
    data.ok = !!data.ok && !pageerrors.length && !actionableConsoleErrors.length;
    const outPath = join(OUT, 'probe-malvern-hill.json');
    writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log('wrote ' + outPath);
    console.log('wrote ' + join(OUT, 'probe-malvern-hill.png'));

    const steps = data.steps || [];
    const ok = steps.filter(s => s.ok).length;
    const fail = steps.filter(s => !s.ok).length;
    console.log('probe-malvern-hill: ' + ok + '/' + steps.length + ' steps ok' + (fail ? ', ' + fail + ' FAIL' : ', 0 fail'));
    if (!data.ok || fail || pageerrors.length) {
      if (data.fatal) console.error('FATAL:', data.fatal);
      for (const s of steps) if (!s.ok) console.error('  FAIL:', s.name, s.err);
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

main().then(() => process.exit(0)).catch(e => { console.error('FATAL:', e); process.exit(1); });
