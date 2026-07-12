#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D364 playable New Market Heights. Binds the D363 contract to the live T8 engine:
// two phases over the same ground, the pre-placed abatis belts, battle-date ranks,
// the fourteen Medals of Honor, the Fort Pillow absence guard, the D74 wall, and
// the split direction battery (phase-1 CS holds / phase-2 US carries / aggregate US
// wins WHILE bleeding more - the inverse of winner-bleeds-less).
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
const SEEDS = [1, 7, 21, 33, 49, 101, 202, 303];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(url) { try { const r = await fetch(url, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }
function killChild(child) { if (!child) return; try { child.kill(); } catch {} }
async function closeBrowserHard(browser) {
  if (!browser) return;
  const proc = typeof browser.process === 'function' ? browser.process() : null;
  let closed = false;
  try {
    await Promise.race([
      browser.close().then(() => { closed = true; }, () => { closed = true; }),
      sleep(2500)
    ]);
  } catch {}
  if (!closed && proc && !proc.killed) { try { proc.kill('SIGKILL'); } catch {} }
}
function printResult(result) {
  console.log('probe-new-market-heights ok=' + result.ok + ' steps=' + (result.steps || []).length + ' pageerrors=' + (result.pageerrors || []).length);
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (s.ok) console.log('  ok   ' + s.name.slice(0, 70) + ' :: ' + JSON.stringify(s.v).slice(0, 220));
    else console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

const SETUP = `(() => {
  var R = { ok:true, steps:[], errors:[] };
  function check(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message || ev.error || ev)); });
  function phaseUnits(p) {
    var rows = [], sides = ['US', 'CS'];
    for (var si = 0; si < sides.length; si++) for (var i = 0; i < (((p.oob || {})[sides[si]]) || []).length; i++) rows.push({ side:sides[si], u:p.oob[sides[si]][i] });
    for (var r = 0; r < (p.reinforcements || []).length; r++) rows.push({ side:String(p.reinforcements[r].side || ''), u:p.reinforcements[r] });
    return rows;
  }
  function phaseTotals(p) {
    var out = { US:0, CS:0, gunsUS:0, gunsCS:0 };
    phaseUnits(p).forEach(function(row){
      out[row.side] += row.u.men || 0;
      if (row.u.arm === 'art') out[row.side === 'US' ? 'gunsUS' : 'gunsCS'] += row.u.guns || 0;
    });
    return out;
  }
  function keyScan(obj, path, bad) {
    if (!obj || typeof obj !== 'object') return;
    var forbidden = {
      damage:1,dmg:1,damagemult:1,firepower:1,firepowermult:1,firescale:1,firemult:1,firemultiplier:1,
      killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossmult:1,combatscale:1,battledamage:1,
      battlefire:1,powermult:1,moralemult:1,routmult:1,capturemult:1,scorebonus:1,scoremult:1,winner:1,
      winoverride:1,victoryoverride:1,outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,valormult:1,heroism:1
    };
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var p = path ? path + '.' + k : k;
      if (forbidden[String(k).toLowerCase()]) bad.push(p);
      keyScan(obj[k], p, bad);
    }
  }
  function nanScan() {
    for (var i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i];
      if (typeof u.x !== 'number' || !isFinite(u.x) || typeof u.men !== 'number' || !isFinite(u.men) || typeof u.morale !== 'number' || !isFinite(u.morale)) return u.id;
    }
    return null;
  }
  function runBattle(opts) {
    opts = opts || {};
    G.campaign = null; G.settings = G.settings || {};
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    fldLaunchSandbox({ renderer:'none', scenario:'newMarketHeights', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 100000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    return {
      w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n,
      score:__FIELD.phaseScore, cas:__FIELD.battleCas, badUnit:nanScan(),
      log:(__FIELD.phaseLog || []).map(function(e){ return { name:e.name, w:e.winner, us:Math.round(e.usCas), cs:Math.round(e.csCas) }; })
    };
  }

  var DATA = null;
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof _fldScenarioInitPhased !== 'function' || typeof ssPersonRegistry !== 'function' || typeof fldEngSeedScenarioObstacles !== 'function')
      return JSON.stringify({ ok:false, fatal:'required tactical/T8/T13/Army Register API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    DATA = GAME_DATA && GAME_DATA['new-market-heights'] ? GAME_DATA['new-market-heights'].newMarketHeights : null;

    check('DATA CONTRACT: two phases over the same ground, weights 1+3, sourced strength bounds, exact provenance labels', function() {
      if (!DATA || DATA.id !== 'newMarketHeights') throw new Error('GAME_DATA["new-market-heights"].newMarketHeights missing');
      if (DATA.attacker !== 'US' || DATA.defender !== 'CS' || DATA.defaultFog !== false) throw new Error('role/fog contract failed');
      if (!DATA.phases || DATA.phases.length !== 2) throw new Error('want 2 phases, got ' + (DATA.phases && DATA.phases.length));
      var names = DATA.phases.map(function(p){ return p.name; });
      if (names[0].indexOf('Duncan') < 0 || names[1].indexOf('Draper') < 0) throw new Error('phase names wrong: ' + names.join(' | '));
      var weights = DATA.phases.map(function(p){ return p.scoreWeight || 1; });
      if (weights[0] !== 1 || weights[1] !== 3) throw new Error('weights must be 1+3, got ' + weights.join('+'));
      var t0 = phaseTotals(DATA.phases[0]), t1 = phaseTotals(DATA.phases[1]);
      var p1oobUS = ((DATA.phases[0].oob || {}).US || []).reduce(function(n, u){ return n + (u.men || 0); }, 0);
      if (p1oobUS < 630 || p1oobUS > 770) throw new Error('phase-1 US opening OOB out of 630-770: ' + p1oobUS);
      if (t0.US > 1000) throw new Error('phase-1 US total (with the skirmish arrival) exceeds 1000: ' + t0.US);
      if (t0.CS < 1700 || t0.CS > 2100) throw new Error('phase-1 CS out of 1700-2100: ' + t0.CS);
      if (t0.gunsUS !== 0 || t0.gunsCS !== 8) throw new Error('phase-1 gun contract 0/8 failed: ' + t0.gunsUS + '/' + t0.gunsCS);
      if (t1.US < 1900 || t1.US > 2400) throw new Error('phase-2 US out of 1900-2400: ' + t1.US);
      if (t1.CS < 600 || t1.CS > 1100) throw new Error('phase-2 CS out of 600-1100: ' + t1.CS);
      if (t1.gunsCS > 4) throw new Error('phase-2 residual CS guns exceed 4: ' + t1.gunsCS);
      DATA.phases.forEach(function(p, pi) {
        phaseUnits(p).forEach(function(row) {
          var note = String(row.u.note || '');
          var ok = note.indexOf('Verified identity; Inferred strength') >= 0
            || (pi === 1 && row.side === 'CS' && note.indexOf('Verified withdrawal order; Inferred residual strength') >= 0);
          if (!ok) throw new Error('unit lacks exact provenance label: ' + row.u.id + ' (phase ' + pi + ')');
        });
      });
      var p2cs = phaseUnits(DATA.phases[1]).filter(function(r){ return r.side === 'CS'; });
      if (!p2cs.every(function(r){ return String(r.u.note || '').indexOf('Verified withdrawal order; Inferred residual strength') >= 0; }))
        throw new Error('every phase-2 CS unit must carry the withdrawal label');
      return { phase1:t0, phase2:t1 };
    });

    check('REGISTRY + MENU: New Market Heights sits after Gettysburg and before Shiloh in the Eastern arc', function() {
      var reg = fldScenarioRegistry(), order = fldScenarioMenuOrder(reg);
      if (!reg.newMarketHeights || reg.newMarketHeights !== DATA) throw new Error('registry identity missing');
      if (!(order.indexOf('gettysburg') + 1 === order.indexOf('newMarketHeights') && order.indexOf('newMarketHeights') + 1 === order.indexOf('shiloh'))) throw new Error('chronology wrong: ' + order.join(' -> '));
      return { rank:fldScenarioMenuRank('newMarketHeights'), order:order.indexOf('newMarketHeights') };
    });

    check('OBSTACLE BELTS: two pre-placed CS abatis lines at t=0, phase-2 belts partially breached, real movement bite', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'newMarketHeights', autoBoth:true, seed:3 });
      var obs = __FIELD.engObstacles || [];
      if (obs.length !== 2) throw new Error('phase-1 belts wrong count: ' + obs.length);
      if (!obs.every(function(a){ return a.side === 'CS' && a.building === false; })) throw new Error('belts must be completed CS obstacles');
      if (!(obs[0].strength === 1 && obs[1].strength === 1)) throw new Error('phase-1 belts must be full strength');
      if (!(obs[0].prepared === false && obs[1].prepared === true)) throw new Error('inner belt must be the prepared one');
      var onBelt = fldEngMoveFactor(600, 392, { side:'US' });
      var offBelt = fldEngMoveFactor(600, 520, { side:'US' });
      if (!(onBelt < offBelt && onBelt < 1)) throw new Error('belt does not slow a US unit: on=' + onBelt + ' off=' + offBelt);
      var friendly = fldEngMoveFactor(600, 392, { side:'CS' });
      if (friendly !== offBelt) throw new Error('belt should not slow its own side: ' + friendly + ' vs ' + offBelt);
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      var obs2 = __FIELD.engObstacles || [];
      if (obs2.length !== 2) throw new Error('phase-2 belts wrong count: ' + obs2.length);
      if (!obs2.every(function(a){ return a.strength < 1 && a.strength >= 0.2; })) throw new Error('phase-2 belts must be partially breached');
      return { p1:[obs[0].strength, obs[1].strength], p2:[obs2[0].strength, obs2[1].strength], onBelt:onBelt, offBelt:offBelt };
    });

    check('NO LEAK: the sandbox and Gaines Mill get no pre-placed belts; home edges stay role-aware', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'newMarketHeights', autoBoth:true, seed:3 });
      if (fldHomeEdgeZ('US') !== FLD.FIELD_H + 60 || fldHomeEdgeZ('CS') !== -60) throw new Error('NMH home edges wrong: ' + fldHomeEdgeZ('US') + '/' + fldHomeEdgeZ('CS'));
      fldLaunchSandbox({ renderer:'none', scenario:'sandbox', autoBoth:true, seed:3 });
      if ((__FIELD.engObstacles || []).length) throw new Error('pre-placed belts leaked into the sandbox');
      if (__FIELD.homeEdgeZ !== null) throw new Error('home-edge override leaked into sandbox');
      fldLaunchSandbox({ renderer:'none', scenario:'gainesMill', autoBoth:true, seed:3 });
      if ((__FIELD.engObstacles || []).length) throw new Error('pre-placed belts leaked into Gaines Mill');
      return { leak:false };
    });

    check('RANK + NAME LOCKS: battle-date grades hold and forbidden renderings are absent', function() {
      var leaders = [];
      DATA.phases.forEach(function(p){ ['US','CS'].forEach(function(s){ ((p.leaders || {})[s] || []).forEach(function(l){ leaders.push(l.name); }); }); });
      ['Brig. Gen. Charles J. Paine', 'Col. Samuel A. Duncan', 'Col. Alonzo G. Draper', 'Col. John H. Holman', 'Brig. Gen. John Gregg', 'Col. Frederick S. Bass', 'Brig. Gen. Martin W. Gary'].forEach(function(name){
        if (leaders.indexOf(name) < 0) throw new Error('missing exact leader rank ' + name);
      });
      var body = JSON.stringify(DATA);
      [/Maj\\. Gen\\. Charles J\\. Paine/, /Gen\\. Alonzo G\\. Draper/, /Gen\\. Samuel A\\. Duncan/, /Gen\\. John H\\. Holman/, /Henry Holman/, /Richard C\\. Taylor/, /Maj\\. Gen\\. John Gregg/, /Turkey Hill/].forEach(function(re){
        if (re.test(body)) throw new Error('forbidden rendering leaked: ' + re);
      });
      ['Christian A. Fleetwood','Alfred B. Hilton','Charles Veal','Milton M. Holland','Powhatan Beaty','James H. Bronson','Robert A. Pinn','Thomas R. Hawkins','Alexander Kelly','James Gardiner','Miles James','Edward Ratcliff','James H. Harris','William H. Barnes'].forEach(function(name){
        if (body.indexOf(name) < 0) throw new Error('Medal of Honor name missing: ' + name);
      });
      ['Four Mile Creek','New Market Road','Deep Bottom'].forEach(function(t){ if (body.indexOf(t) < 0) throw new Error('terrain tooth missing ' + t); });
      return { leaders:leaders.length, moh:14 };
    });

    check('D74 NO-FUDGE: no battle-specific combat/result/valor key at any depth; artillery uses the universal gun model', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden keys: ' + bad.join(', '));
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){
        if (row.u.arm === 'art' && (!(row.u.guns > 0) || !(row.u.men > 0))) throw new Error('artillery gun/crew missing on ' + row.u.id);
      }); });
      return { forbidden:0 };
    });

    check('LAUNCH: phase machinery initializes, reinforcements schedule and arrive once, no NaN', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'newMarketHeights', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'newMarketHeights' || __FIELD.attacker !== 'US' || __FIELD.defender !== 'CS') throw new Error('launch roles wrong');
      if (!__FIELD.phases || __FIELD.phases.length !== 2 || __FIELD.phaseIdx !== 0) throw new Error('phases not initialized');
      if (__FIELD.objective.name !== 'The New Market Heights works') throw new Error('objective wrong: ' + __FIELD.objective.name);
      if (__FIELD.units.length !== 6) throw new Error('phase-1 unit count wrong: ' + __FIELD.units.length);
      if (!__FIELD.reinforce || __FIELD.reinforce.length !== 1) throw new Error('phase-1 should schedule exactly the 22nd skirmish arrival: ' + (__FIELD.reinforce && __FIELD.reinforce.length));
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      var base = __FIELD.units.length, sched = __FIELD.reinforce.slice();
      if (base !== 6 || sched.length !== 2) throw new Error('phase-2 opening/schedule wrong: ' + base + '/' + sched.length);
      __FIELD.phase = 'battle'; __FIELD.t = 99999; fldScenarioTick(0.05); fldScenarioTick(0.05);
      if (__FIELD.units.length !== base + 2) throw new Error('reinforcements duplicated or missing: ' + __FIELD.units.length);
      fldSimStep(0.05);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { p1units:6, p2units:base, arrivals:sched.map(function(x){ return x.spec.id + '@' + x.atSec; }) };
    });

    check('SAME-SEED REPLAY: identical inputs produce an identical two-phase battle', function() {
      var a = runBattle({ autoBoth:true, seed:909 });
      var b = runBattle({ autoBoth:true, seed:909 });
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      if (a.phase !== 'over' || a.badUnit) throw new Error('replay did not resolve cleanly');
      return { winner:a.w, score:a.score, log:a.log };
    });

    check('PASSIVE US and PASSIVE CS: both no-input players reach a valid end state through both phases', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        var r = runBattle({ playerSide:ps, seed:17, autoBoth:false });
        if (r.phase !== 'over' || r.log.length !== 2 || ['US','CS','draw'].indexOf(r.w) < 0 || r.badUnit) throw new Error(ps + ' passive failed: ' + JSON.stringify(r));
        out[ps] = { winner:r.w, steps:r.steps };
      });
      return out;
    });

    check('HISTORICAL DIRECTION (8 seeds): phase-1 CS holds, phase-2 US carries, aggregate US wins WHILE US losses exceed CS losses', function() {
      var seeds = ${JSON.stringify(SEEDS)}, p1cs = 0, p2us = 0, usAgg = 0, usBleedsMore = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over' || r.badUnit) throw new Error('seed ' + seeds[i] + ' did not resolve: ' + JSON.stringify(r));
        if (r.log[0] && r.log[0].w === 'CS') p1cs++;
        if (r.log[1] && r.log[1].w === 'US') p2us++;
        if (r.w === 'US') usAgg++;
        if ((r.cas.US || 0) > (r.cas.CS || 0)) usBleedsMore++;
        samples.push(seeds[i] + ':' + r.log.map(function(e){ return e.w; }).join('/') + '=' + r.w + ' cas ' + Math.round(r.cas.US) + '-' + Math.round(r.cas.CS));
      }
      if (p1cs < 5) throw new Error('phase-1 CS holds below 5/8: ' + p1cs + ' :: ' + samples.join(', '));
      if (p2us < 5) throw new Error('phase-2 US carries below 5/8: ' + p2us + ' :: ' + samples.join(', '));
      if (usAgg < 5) throw new Error('aggregate US wins below 5/8: ' + usAgg + ' :: ' + samples.join(', '));
      if (usBleedsMore < 5) throw new Error('inverse-cost guard below 5/8 (US must bleed more): ' + usBleedsMore + ' :: ' + samples.join(', '));
      return { phase1CS:p1cs + '/8', phase2US:p2us + '/8', aggregateUS:usAgg + '/8', usBleedsMore:usBleedsMore + '/8', samples:samples };
    });

    check('TEACHING: six sourced cards including the withdrawal controversy, the fourteen medals, and Fort Harrison; Eastern codex', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], codex = DATA.teaching && DATA.teaching.codex;
      if (cards.length < 6 || !codex) throw new Error('teaching/codex missing: ' + cards.length);
      cards.forEach(function(c) {
        var urls = (c.sources || []).filter(function(u){ return /^https?:/.test(u); });
        if (urls.length < 2) throw new Error('card lacks two source URLs: ' + c.id);
      });
      var ids = cards.map(function(c){ return c.id; });
      ['nmh_fourteen', 'nmh_withdrawal', 'nmh_operation', 'nmh_abatis'].forEach(function(id){ if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
      if ((codex.sources || []).filter(function(u){ return /^https?:/.test(u); }).length < 2) throw new Error('codex lacks two source URLs');
      if (!codex.axes || codex.axes.theater !== 'Eastern' || codex.axes.result !== 'Union victory') throw new Error('codex axes wrong');
      return { cards:ids, codex:codex.id };
    });

    check('FORT PILLOW ABSENCE: no playable massacre scenario in the registry or menu order', function() {
      var reg = fldScenarioRegistry(), keys = Object.keys(reg);
      if (keys.some(function(k){ return /pillow/i.test(k); })) throw new Error('Fort Pillow appears in the registry');
      var body = JSON.stringify(Object.keys(reg).map(function(k){ return (reg[k] || {}).name || ''; }));
      if (/fort pillow/i.test(body)) throw new Error('a registered scenario names Fort Pillow');
      return { playable:false };
    });

    check('ARMY REGISTER PIN: 11 New Market Heights units produce exact cmd/nco/pvt trios and current total 1200', function() {
      var C = { side:'US', iron:false, idx:0, funds:6500, recovery:false, completed:[], roster:[], nextId:1,
        stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
      if (typeof _t1InitAll === 'function') _t1InitAll(C);
      var reg = ssPersonRegistry(C), rows = [], groups = {};
      if (reg.people.length !== 1200) throw new Error('Army Register total is ' + reg.people.length + ', expected 1200');   // D380: 1170 -> 1200 — Five Forks adds 10 unique side-unit ids x 3 slots; the NMH-specific 33-row/11-unit teeth below remain stable.
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:newMarketHeights:') === 0) rows.push(origin);
      }
      if (rows.length !== 33) throw new Error('NMH rows are ' + rows.length + ', expected 33');
      rows.forEach(function(origin) {
        var m = origin.match(/^ss:newMarketHeights:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad NMH slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var keys = Object.keys(groups);
      if (keys.length !== 11) throw new Error('NMH unit groups are ' + keys.length + ', expected 11');
      keys.forEach(function(k){ if (!groups[k].cmd || !groups[k].nco || !groups[k].pvt) throw new Error('incomplete trio ' + k); });
      return { total:reg.people.length, nmhRows:rows.length, units:keys.length };
    });
  } catch(e) {
    R.ok = false; R.errors.push('FATAL ' + String(e && e.message || e));
  }
  return JSON.stringify(R);
})()`;

const DOM = `(() => {
  var R = { ok:true, steps:[] };
  function check(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  try {
    G.settings = G.settings || {}; G.mode = 'menu';
    check('MENU + SIDE CHOICE: one accessible button between Gettysburg and Shiloh; the chosen side reaches fldLaunchBattle', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_newMarketHeights');
      if (!btn || !btn.getAttribute('aria-label')) throw new Error('accessible NMH menu button missing');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_newMarketHeights').length !== 1) throw new Error('duplicate NMH button');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_gettysburg') >= 0 && ids.indexOf('fldScnBtn_newMarketHeights') === ids.indexOf('fldScnBtn_gettysburg') + 1 && ids.indexOf('fldScnBtn_shiloh') === ids.indexOf('fldScnBtn_newMarketHeights') + 1)) throw new Error('button chronology wrong: ' + ids.join(' -> '));
      var got = null; fldScenarioSideChoice('newMarketHeights', function(side){ got = side; });
      var cards = document.querySelectorAll('[data-brside]'); if (cards.length !== 2) throw new Error('wanted two side cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]'); if (!cs) throw new Error('CS side card missing'); cs.click();
      if (got !== 'CS') throw new Error('side choice returned ' + got);
      var captured = null, oldLaunch = window.fldLaunchSandbox, oldBrief = window.fldBullRunBriefing;
      try {
        window.fldLaunchSandbox = function(opts){ captured = opts; };
        window.fldBullRunBriefing = function(){};
        fldLaunchBattle('newMarketHeights', 'CS');
      } finally {
        window.fldLaunchSandbox = oldLaunch; window.fldBullRunBriefing = oldBrief;
      }
      if (!captured || captured.scenario !== 'newMarketHeights' || captured.playerSide !== 'CS' || captured.renderer !== '3d') throw new Error('fldLaunchBattle options wrong: ' + JSON.stringify(captured));
      return { button:btn.id, sideChoice:got };
    });
  } catch(e) { R.ok = false; R.fatal = String(e && e.message || e); }
  return JSON.stringify(R);
})()`;

async function main() {
  let server = null, browser = null;
  const url = cfg.baseUrl + '/' + cfg.file;
  const result = { ok:false, steps:[], pageerrors:[] };
  try {
    const pillowFiles = readdirSync(join(ROOT, 'data')).filter(f => /pillow/i.test(f));
    if (pillowFiles.length) throw new Error('Fort Pillow data file present on disk: ' + pillowFiles.join(', '));
    if (!(await up(url))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio:'ignore' });
      for (let i = 0; i < 80 && !(await up(url)); i++) await sleep(250);
    }
    if (!(await up(url))) throw new Error('server not reachable at ' + url);
    browser = await chromium.launch({ headless:true, args:GL });
    const page = await browser.newPage({ viewport:{ width:1440, height:950 }, deviceScaleFactor:1 });
    page.on('pageerror', e => result.pageerrors.push(String(e && e.message || e)));
    page.on('console', msg => { if (msg.type() === 'error') result.pageerrors.push('console: ' + msg.text()); });
    await page.goto(url, { waitUntil:'domcontentloaded', timeout:45000 });
    await page.waitForFunction(() => typeof window.fldLaunchSandbox === 'function' && typeof window.fldScenarioRegistry === 'function' && window.GAME_DATA && window.GAME_DATA['new-market-heights'], null, { timeout:45000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = (setup.steps || []).concat(dom.steps || []);
    result.pageerrors = result.pageerrors.concat(setup.errors || []);
    if (dom.fatal) result.pageerrors.push('DOM fatal: ' + dom.fatal);
    result.ok = !!setup.ok && !!dom.ok && result.steps.every(s => s.ok) && result.pageerrors.length === 0;
    await page.screenshot({ path:join(OUT, 'probe-new-market-heights.png'), fullPage:true });
  } catch(e) {
    result.fatal = String(e && e.message || e); result.ok = false;
  } finally {
    try { writeFileSync(join(OUT, 'probe-new-market-heights.json'), JSON.stringify(result, null, 2)); } catch {}
    printResult(result);
    await closeBrowserHard(browser); killChild(server);
  }
  if (!result.ok) process.exit(1);
  console.log('ALL OK');
}

main();
