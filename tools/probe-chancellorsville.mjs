#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-chancellorsville.mjs
// Focused completion probe for the Chancellorsville data-driven __FIELD battle.
// It verifies the historical/data contract, the single-phase launch seam, terrain
// cover, reinforcements, deterministic resolution, CS-favored balance, side-choice
// UI, end-note framing, and light no-regression coverage for the existing roster.

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
  function strength(side) { var c = 0; for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === side && u.alive) c += u.men; } return Math.round(c); }
  function liveCount() { return __FIELD.units.length; }
  function nanScan() {
    for (var i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i];
      if (!isNum(u.x) || !isNum(u.z) || !isNum(u.men) || !isNum(u.morale) || !isNum(u.facing) || !isNum(u.fatigue) || !isNum(u.ammo)) return u.id;
    }
    return null;
  }
  function fieldedFromData(sd, side) {
    var n = 0, list = (sd.oob && sd.oob[side]) || [], rf = sd.reinforcements || [];
    for (var i = 0; i < list.length; i++) n += list[i].men || 0;
    for (var j = 0; j < rf.length; j++) if (rf[j].side === side) n += rf[j].men || 0;
    return n;
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
  function runCV(opts) {
    opts = opts || {};
    var maxSteps = opts.maxSteps || ((opts.scenario === 'antietam' || opts.scenario === 'gettysburg') ? 60000 : 24000);
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
  function ids(list) { return (list || []).map(function(x){ return x.id || x.name; }).join(','); }
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof __FIELD === 'undefined')
      return JSON.stringify({ ok:false, fatal:'__FIELD engine / scenario registry missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    var DATA = (GAME_DATA && GAME_DATA.chancellorsville) ? GAME_DATA.chancellorsville.chancellorsville : null;

    step('DATA present: GAME_DATA.chancellorsville.chancellorsville is registered as a single-phase battle', function() {
      var reg = fldScenarioRegistry();
      if (!DATA) throw new Error('GAME_DATA.chancellorsville.chancellorsville missing');
      if (!reg.chancellorsville) throw new Error('chancellorsville missing from registry');
      if (DATA.phases) throw new Error('Chancellorsville should be single-phase, not phases[]');
      if (!DATA.oob || !DATA.oob.US || !DATA.oob.CS) throw new Error('OOB missing');
      if (!DATA.terrain || !DATA.terrain.woods || !DATA.terrain.walls) throw new Error('terrain woods/walls missing');
      return { usUnits:DATA.oob.US.length, csUnits:DATA.oob.CS.length, reinforcements:(DATA.reinforcements || []).length };
    });

    step('DATA: historical accuracy guard removes stale Spotsylvania / D.H. Hill draft text', function() {
      var txt = JSON.stringify(DATA);
      if (/Mule Shoe/i.test(txt)) throw new Error('Mule Shoe belongs to Spotsylvania, not this Chancellorsville packet');
      if (/D\\.\\s*H\\.\\s*Hill|D\\.H\\. Hill/i.test(txt)) throw new Error('D.H. Hill should not anchor the Chancellorsville flank-attack OOB');
      if (/highest percentage loss/i.test(txt)) throw new Error('over-specific casualty claim still present');
      return { bytes:txt.length };
    });

    step('DATA: attacker is CS, defender is US, objective is the Chancellor crossroads', function() {
      if (DATA.attacker !== 'CS') throw new Error('attacker must be CS: ' + DATA.attacker);
      if (DATA.defender !== 'US') throw new Error('defender must be US: ' + DATA.defender);
      if (!DATA.objective || DATA.objective.name.indexOf('Chancellor') < 0) throw new Error('objective not Chancellor House/crossroads');
      if (!DATA.timeLimitSec || DATA.timeLimitSec < 300) throw new Error('timeLimitSec too short: ' + DATA.timeLimitSec);
      if (!DATA.holdToWinSec || DATA.holdToWinSec < 90) throw new Error('holdToWinSec too short: ' + DATA.holdToWinSec);
      return { attacker:DATA.attacker, defender:DATA.defender, objective:DATA.objective.name, defaultFog:DATA.defaultFog };
    });

    step('DATA: leaders include Hooker, Howard, Jackson, Stuart, Rodes, A.P. Hill, and Paxton', function() {
      var us = ids(DATA.leaders && DATA.leaders.US), cs = ids(DATA.leaders && DATA.leaders.CS);
      ['ld_hooker', 'ld_howard'].forEach(function(id){ if (us.indexOf(id) < 0) throw new Error('US leader missing ' + id + ': ' + us); });
      ['ld_jackson', 'ld_stuart', 'ld_rodes', 'ld_a_p_hill', 'ld_paxton'].forEach(function(id){ if (cs.indexOf(id) < 0) throw new Error('CS leader missing ' + id + ': ' + cs); });
      return { US:us, CS:cs };
    });

    step('DATA: Confederate attack order uses Rodes, Colston, and A.P. Hill divisions', function() {
      var cs = DATA.oob.CS || [], names = cs.map(function(u){ return u.name + ' / ' + u.commander; }).join(' | ');
      ['Rodes', 'Colston', 'A. P. Hill'].forEach(function(n){ if (names.indexOf(n) < 0) throw new Error('missing ' + n + ' in CS OOB: ' + names); });
      if (ids(cs).indexOf('cs_rodes_div') < 0 || ids(cs).indexOf('cs_colston_div') < 0 || ids(cs).indexOf('cs_ap_hill_div') < 0) throw new Error('expected division ids missing: ' + ids(cs));
      return { csOob:names };
    });

    step('DATA: terrain teaches the Wilderness, Dowdall\\'s Tavern, Hazel Grove, Fairview, and the Chancellor breastworks', function() {
      var markers = DATA.terrain.markers || [], hills = DATA.terrain.hills || [], walls = DATA.terrain.walls || [];
      var txt = JSON.stringify({ markers:markers, hills:hills, walls:walls });
      ['Wilderness', 'Dowdall', 'Hazel Grove', 'Fairview', 'breastworks'].forEach(function(n){ if (txt.indexOf(n) < 0) throw new Error('terrain missing ' + n); });
      if (DATA.terrain.woods.length < 4) throw new Error('want >=4 woods patches, got ' + DATA.terrain.woods.length);
      if (!walls.length) throw new Error('no Chancellor breastwork wall');
      return { hills:hills.length, woods:DATA.terrain.woods.length, walls:walls.length, markers:markers.length };
    });

    step('DATA: batteries use the universal gun model with realistic crew counts', function() {
      var all = DATA.oob.US.concat(DATA.oob.CS).concat(DATA.reinforcements || []), arts = [];
      for (var i = 0; i < all.length; i++) if (all[i].arm === 'art') arts.push(all[i]);
      if (arts.length < 2) throw new Error('want US and CS artillery, got ' + arts.length);
      for (var j = 0; j < arts.length; j++) {
        var a = arts[j];
        if (!(a.guns > 0)) throw new Error(a.id + ' missing gun count');
        if (!(a.men > 0 && a.men <= a.guns * 40)) throw new Error(a.id + ' crew/gun ratio suspicious: ' + a.men + '/' + a.guns);
      }
      return { batteries:arts.map(function(a){ return a.id + ':' + a.guns + 'g/' + a.men; }) };
    });

    step('DATA: teaching and codex entries cover flank march, Hooker, Jackson, cost, and XI Corps scapegoating', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], cardIds = ids(cards);
      ['cv_flank_march', 'cv_hooker', 'cv_jackson_death', 'cv_cost', 'cv_xi_corps'].forEach(function(id){ if (cardIds.indexOf(id) < 0) throw new Error('missing teaching card ' + id + ': ' + cardIds); });
      if (!DATA.teaching.codex || DATA.teaching.codex.id !== 'codex_chancellorsville') throw new Error('codex_chancellorsville missing');
      if (DATA.teaching.codex.axes.theater !== 'Eastern') throw new Error('codex theater wrong: ' + DATA.teaching.codex.axes.theater);
      return { cards:cardIds };
    });

    step('LAUNCH: Chancellorsville instantiates as single-phase, CS-attacker, no Classic battle contamination', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'chancellorsville', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'chancellorsville') throw new Error('scenario not set: ' + __FIELD.scenario);
      if (__FIELD.attacker !== 'CS' || __FIELD.defender !== 'US') throw new Error('asymmetry wrong: atk ' + __FIELD.attacker + ' def ' + __FIELD.defender);
      if (__FIELD.phases !== null) throw new Error('single-phase scenario leaked phase machinery');
      if (!__FIELD.objective || __FIELD.objective.name.indexOf('Chancellor') < 0) throw new Error('objective not built');
      if (liveCount() !== DATA.oob.US.length + DATA.oob.CS.length) throw new Error('initial unit count wrong: ' + liveCount());
      if (G.battle && G.battle.M) throw new Error('Chancellorsville launch created a Classic G.battle');
      return { units:liveCount(), fog:__FIELD.fog, holdToWin:__FIELD.holdToWin, timeLimit:__FIELD.timeLimit };
    });

    step('TERRAIN: Chancellor breastworks provide cover while the open approach does not', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'chancellorsville', autoBoth:true, seed:3 });
      var wallCover = fldCoverAt(600, 438);
      var openCover = fldCoverAt(600, 505);
      if (!(wallCover > 1.5)) throw new Error('breastwork wall gives no cover: ' + wallCover);
      if (!(openCover < 1.35)) throw new Error('open approach unexpectedly covered: ' + openCover);
      return { wallCover:Math.round(wallCover * 100) / 100, openCover:Math.round(openCover * 100) / 100 };
    });

    step('REINFORCEMENTS: arrive on schedule, in order, idempotently', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'chancellorsville', autoBoth:true, seed:7 });
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

    var r1 = runCV({ scenario:'chancellorsville', renderer:'none', autoBoth:true, playerSide:'US', seed:101 });
    step('Chancellorsville AI-vs-AI resolves to a winner with no hang/NaN', function() {
      if (!r1.w) throw new Error('no winner after ' + r1.steps + ' steps');
      if (r1.steps < 100) throw new Error('battle ended too fast: ' + r1.steps);
      if (r1.steps > 23999) throw new Error('battle did not resolve: ' + r1.steps);
      var bad = nanScan(); if (bad) throw new Error('NaN in unit ' + bad);
      return r1;
    });

    step('Chancellorsville AI-vs-AI produces meaningful losses on both sides', function() {
      var usLoss = fieldedFromData(DATA, 'US') - r1.us, csLoss = fieldedFromData(DATA, 'CS') - r1.cs;
      if (usLoss < 100) throw new Error('US losses too low: ' + usLoss);
      if (csLoss < 100) throw new Error('CS losses too low: ' + csLoss);
      return { usLoss:usLoss, csLoss:csLoss, winner:r1.w, winBy:r1.winBy };
    });

    var r2 = runCV({ scenario:'chancellorsville', renderer:'none', autoBoth:true, playerSide:'US', seed:101 });
    step('Chancellorsville AI-vs-AI is deterministic for the same seed', function() {
      if (r1.w !== r2.w || r1.steps !== r2.steps || r1.winBy !== r2.winBy) throw new Error('same seed changed: ' + JSON.stringify(r1) + ' vs ' + JSON.stringify(r2));
      return { winner:r1.w, winBy:r1.winBy, steps:r1.steps };
    });

    step('Chancellorsville balance (8 seeds): Confederate flank attack is favored, not scripted', function() {
      var seedVals = [1, 7, 21, 42, 55, 101, 303, 909], csWins = 0, usWins = 0, draws = 0, outcomes = [];
      for (var i = 0; i < seedVals.length; i++) {
        var r = runCV({ scenario:'chancellorsville', renderer:'none', autoBoth:true, playerSide:'US', seed:seedVals[i] });
        if (r.w === 'CS') csWins++; else if (r.w === 'US') usWins++; else draws++;
        outcomes.push(seedVals[i] + ':' + r.w + '/' + r.winBy + '@' + r.t + 's');
      }
      if (csWins < 4) throw new Error('CS wins only ' + csWins + '/8; outcomes [' + outcomes.join(', ') + ']');
      return { csWins:csWins + '/8', usWins:usWins + '/8', draws:draws + '/8', outcomes:outcomes };
    });

    step('US and CS passive-player launches both resolve', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        var r = runCV({ scenario:'chancellorsville', renderer:'none', autoBoth:false, playerSide:ps, seed:7 });
        if (!r.w) throw new Error(ps + ' passive launch did not resolve');
        if (r.steps > 23999) throw new Error(ps + ' passive launch hit step limit');
        var bad = nanScan(); if (bad) throw new Error(ps + ' passive launch NaN in ' + bad);
        out[ps] = { winner:r.w, steps:r.steps, playerSide:__FIELD.playerSide };
      });
      return out;
    });

    step('SIDE-AWARE objective and end-note framing builds for US and CS players', function() {
      if (typeof fldBriefObjectiveHtml !== 'function' || typeof fldScenarioEndHtml !== 'function') throw new Error('brief/end helpers missing');
      fldLaunchSandbox({ renderer:'none', scenario:'chancellorsville', autoBoth:true, playerSide:'US', seed:5 });
      var usH = fldBriefObjectiveHtml('US', DATA, 140), csH = fldBriefObjectiveHtml('CS', DATA, 140);
      if (usH.indexOf('HOLD') < 0 || usH.toLowerCase().indexOf('deny') < 0) throw new Error('US defensive objective not hold/deny framed: ' + usH);
      if (csH.indexOf('seize and hold') < 0) throw new Error('CS attack objective not seize framed: ' + csH);
      __FIELD.playerSide = 'US'; var usEnd = fldScenarioEndHtml('CS');
      __FIELD.playerSide = 'CS'; var csEnd = fldScenarioEndHtml('CS');
      if (usEnd.indexOf('History holds') < 0 || csEnd.indexOf('History holds') < 0) throw new Error('history-holds end note missing');
      return { usObjectiveLen:usH.length, csObjectiveLen:csH.length, usEndLen:usEnd.length, csEndLen:csEnd.length };
    });

    step('MENU + SIDE CHOICE: Chancellorsville button and side cards render/click', function() {
      if (typeof openMainMenu !== 'function') return { skipped:'no openMainMenu' };
      G.mode = 'menu'; openMainMenu(); fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_chancellorsville');
      if (!btn) throw new Error('missing fldScnBtn_chancellorsville');
      if (!btn.getAttribute('aria-label')) throw new Error('Chancellorsville button missing aria-label');
      var got = null;
      fldScenarioSideChoice('chancellorsville', function(side){ got = side; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('expected 2 side cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]');
      if (!cs) throw new Error('missing CS side card');
      cs.click();
      if (got !== 'CS') throw new Error('CS card returned ' + got);
      return { buttonText:btn.textContent.slice(0, 80), picked:got };
    });

    [['sandbox', 24000], ['bullrun1', 24000], ['fredericksburg', 24000], ['antietam', 60000], ['gettysburg', 60000], ['shiloh', 24000]].forEach(function(pair) {
      var id = pair[0], limit = pair[1];
      var r = runCV({ scenario:id, renderer:'none', autoBoth:true, playerSide:'US', seed:101, maxSteps:limit });
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
        fldLaunchSandbox({ renderer:'2d', scenario:'chancellorsville', autoBoth:true, playerSide:'US', seed:21 });
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
    await page.screenshot({ path: join(OUT, 'probe-chancellorsville.png'), fullPage:false });

    const actionableConsoleErrors = consoleLines.filter(line => line.startsWith('[error]') && !/Failed to load resource:.*404/i.test(line));
    data.pageerrors = pageerrors;
    data.console = consoleLines.slice(-20);
    data.ok = !!data.ok && !pageerrors.length && !actionableConsoleErrors.length;
    const outPath = join(OUT, 'probe-chancellorsville.json');
    writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log('wrote ' + outPath);
    console.log('wrote ' + join(OUT, 'probe-chancellorsville.png'));

    const steps = data.steps || [];
    const ok = steps.filter(s => s.ok).length;
    const fail = steps.filter(s => !s.ok).length;
    console.log('probe-chancellorsville: ' + ok + '/' + steps.length + ' steps ok' + (fail ? ', ' + fail + ' FAIL' : ', 0 fail'));
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
