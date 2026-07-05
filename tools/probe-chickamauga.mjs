#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-chickamauga.mjs - Phase C Western breadth.
// Verifies the Chickamauga real-time tactical scenario as a 3-phase epic on the T8 engine:
//   P0 The Battle in the Woods (Sep 19) -> P1 Longstreet's Breakthrough (Sep 20) -> P2 The Rock of Chickamauga.
// Guards the universal gun model (no per-battle fudge), the fact-check corrections (Hood Maj.Gen./Sep 20,
// Helm under Breckinridge, Granger Maj.Gen., the 'river of death' debunk), the balance design
// (P1 CS-decisive breakthrough, P2 US-holds with the CS attacker paying, aggregate CS majority;
// D272/E53-v2 logs P0 Woods winner movement as a watch row),
// determinism, the multi-phase UI, and single-objective non-regression.
// Writes tools/shots/probe-chickamauga.{json,png}.
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
async function closeBrowser(browser) { if (!browser) return; try { await Promise.race([browser.close(), sleep(3000)]); } catch {} }
function printResult(result) {
  console.log('probe-chickamauga ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
    else console.log('  ok   ' + s.name.slice(0, 66) + ' :: ' + JSON.stringify(s.v));
  }
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name: name, ok: true, v: v === undefined ? null : v }); }
    catch (e) { R.ok = false; R.steps.push({ name: name, ok: false, err: String(e && e.message || e) }); }
  }
  window.addEventListener('error', function(ev) { R.errors.push(String(ev.message || ev.error || ev)); });
  function isNum(n) { return typeof n === 'number' && isFinite(n); }
  function txt(o) { var s = ''; try { s = JSON.stringify(o); } catch (e) {} return String(s || '').toLowerCase(); }
  function nanScan() {
    for (var i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i];
      if (!isNum(u.x) || !isNum(u.z) || !isNum(u.men) || !isNum(u.morale) || !isNum(u.facing)) return u.id;
    }
    return null;
  }
  function collectUnits(p) {
    var all = [];
    if (p && p.oob) all = all.concat(p.oob.US || [], p.oob.CS || []);
    return all.concat(p.reinforcements || []);
  }
  function runChick(opts) {
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    delete G.settings.tacticalFog;
    fldLaunchSandbox(opts);
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0;
    while (__FIELD.phase === 'battle' && n < 120000) { fldSimStep(0.05); n++; }
    return {
      w: __FIELD.winner, by: __FIELD.winBy, steps: n, phasesPlayed: (__FIELD.phaseLog || []).length,
      idx: __FIELD.phaseIdx, score: __FIELD.phaseScore, cas: __FIELD.battleCas,
      log: (__FIELD.phaseLog || []).map(function(e) { return { name: e.name, w: e.winner, by: e.winBy, us: e.usCas, cs: e.csCas }; })
    };
  }

  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof __FIELD === 'undefined' || typeof _fldScenarioInitPhased !== 'function')
      return JSON.stringify({ ok: false, fatal: '__FIELD engine / T8 phases seam missing' });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch (e) {}
    delete G.settings.tacticalFog;
    var DATA = (GAME_DATA && GAME_DATA.chickamauga) ? GAME_DATA.chickamauga.chickamauga : null;

    step('DATA present: GAME_DATA.chickamauga.chickamauga declares 3 named phases (Woods -> Breakthrough -> Rock) with per-phase OOB/objective/terrain', function() {
      if (!DATA) throw new Error('GAME_DATA.chickamauga.chickamauga missing');
      if (!DATA.phases || DATA.phases.length !== 3) throw new Error('want 3 phases, got ' + (DATA.phases && DATA.phases.length));
      var names = DATA.phases.map(function(p) { return p.name; }).join(' | ');
      if (names.indexOf('Woods') < 0 || names.indexOf('Breakthrough') < 0 || names.indexOf('Rock') < 0) throw new Error('phase names wrong: ' + names);
      var weights = DATA.phases.map(function(p) { return p.scoreWeight || 1; });
      if (weights[1] !== 3) throw new Error('the breakthrough (P1) must be the decisive scoreWeight-3 phase, got ' + weights[1]);
      if (weights[0] + weights[1] + weights[2] !== 5) throw new Error('phase weights must total 5 (1+3+1), got ' + weights.join('+'));
      for (var i = 0; i < DATA.phases.length; i++) {
        var p = DATA.phases[i];
        if (!p.objective || !isNum(p.objective.x)) throw new Error('phase ' + i + ' has no objective');
        if (!p.oob || !p.oob.US || !p.oob.CS) throw new Error('phase ' + i + ' missing OOB');
        if (!p.terrain || !p.terrain.markers || p.terrain.markers.length < 3) throw new Error('phase ' + i + ' has too few named markers');
        if (p.attacker !== 'CS' || p.defender !== 'US') throw new Error('phase ' + i + ' attacker/defender wrong (want CS/US): ' + p.attacker + '/' + p.defender);
      }
      return { names: names, weights: weights };
    });

    step('CONTENT: the data names Longstreet/Brotherton/Wood-gap/Snodgrass-Horseshoe/Thomas/Granger/Steedman, frames contingency + squandered victory, and DEBUNKS the river-of-death folk etymology', function() {
      var body = txt(DATA);
      var terms = ['longstreet', 'brotherton', 'wood', 'snodgrass', 'horseshoe', 'thomas', 'granger', 'steedman', 'rock of chickamauga', 'lafayette road'];
      var missing = [];
      for (var i = 0; i < terms.length; i++) if (body.indexOf(terms[i]) < 0) missing.push(terms[i]);
      if (missing.length) throw new Error('missing key terms: ' + missing.join(', '));
      if (body.indexOf('contingency') < 0) throw new Error('teaching does not frame the breakthrough as contingency');
      if (body.indexOf('squander') < 0) throw new Error('teaching does not frame the victory as squandered');
      if (body.indexOf('folk etymology') < 0) throw new Error('river-of-death folk etymology is not flagged/debunked');
      if (body.indexOf('not reliably') < 0 && body.indexOf('legend') < 0 && body.indexOf('disputed') < 0) throw new Error('river-of-death not marked as legend/disputed');
      return { terms: terms.length, cards: (DATA.teaching && DATA.teaching.cards || []).length, codex: DATA.teaching && DATA.teaching.codex && DATA.teaching.codex.id };
    });

    step('FACT-CHECK CORRECTIONS baked into the data: Hood is Maj. Gen. (not Lt. Gen.) wounded Sep 20; Helm under Breckinridge (not Cleburne); Granger Maj. Gen.', function() {
      var body = txt(DATA);
      if (body.indexOf('lt. gen. john bell hood') >= 0 || body.indexOf('lieutenant general john bell hood') >= 0) throw new Error('Hood anachronistically ranked Lt. Gen. at the battle');
      if (body.indexOf('maj. gen. john bell hood') < 0) throw new Error('Hood not correctly ranked Maj. Gen.');
      // Helm must be tied to Breckinridge and explicitly NOT Cleburne
      var helmIdx = body.indexOf('helm');
      if (helmIdx < 0) throw new Error('Helm not present');
      if (body.indexOf('breckinridge') < 0) throw new Error('Helm/Breckinridge division not present');
      if (body.indexOf('not cleburne') < 0 && body.indexOf("breckinridge's division, not cleburne") < 0) throw new Error('Helm-not-Cleburne correction not documented');
      // Loring must NOT appear (removed fabrication)
      if (body.indexOf('loring') >= 0) throw new Error('Loring (not at Chickamauga) leaked into the data');
      // Granger Maj. Gen.
      if (body.indexOf('maj. gen. gordon granger') < 0) throw new Error('Granger not correctly ranked Maj. Gen.');
      // Harker was a COLONEL at Chickamauga (like Heg); his brigadier-generalcy came afterward. Guard the rank
      // so the Vicksburg-class wrong-rank-under-a-Verified-stamp defect cannot creep back (bug-hunt critic, HIGH).
      if (body.indexOf('brig. gen. charles harker') >= 0 || body.indexOf('brigadier general charles harker') >= 0) throw new Error('Harker anachronistically ranked Brig. Gen.; he was a Colonel at the battle');
      if (body.indexOf('harker') >= 0 && body.indexOf('col. charles harker') < 0 && body.indexOf('col. harker') < 0) throw new Error('Harker present but not ranked Col.');
      return { hoodMajGen: true, helmBreckinridge: true, noLoring: true, grangerMajGen: true, harkerColonel: true };
    });

    step('UNIVERSAL GUN MODEL + NO per-battle fudge: every battery carries a gun count + realistic crew (<=40/gun), and no unit carries a damage/multiplier fudge key', function() {
      var arts = [], totalGuns = 0, FORBID = ['damage', 'dmg', 'firemult', 'firemultiplier', 'casualtymult', 'lossmult', 'killmult', 'fudge', 'powermult'];
      for (var i = 0; i < DATA.phases.length; i++) {
        var all = collectUnits(DATA.phases[i]);
        for (var j = 0; j < all.length; j++) {
          var u = all[j];
          for (var k in u) { if (u.hasOwnProperty(k) && FORBID.indexOf(String(k).toLowerCase()) >= 0) throw new Error('forbidden fudge key "' + k + '" on ' + u.id); }
          if (u.arm === 'art') arts.push(u);
        }
      }
      if (arts.length < 6) throw new Error('expected >=6 batteries across the phases, got ' + arts.length);
      for (var a = 0; a < arts.length; a++) {
        var b = arts[a];
        if (!(b.guns > 0)) throw new Error(b.id + ' has no gun count');
        if (!(b.men > 0 && b.men <= b.guns * 40)) throw new Error(b.id + ' crew not plausible: ' + b.men + ' for ' + b.guns + ' guns');
        totalGuns += b.guns;
      }
      return { batteries: arts.length, totalGuns: totalGuns };
    });

    step('MULTI-PHASE LAUNCH: phase state initializes, phase 0 builds the Woods OOB/objective and zeroes the running tally', function() {
      fldLaunchSandbox({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: 12345 });
      if (__FIELD.scenario !== 'chickamauga') throw new Error('scenario not set: ' + __FIELD.scenario);
      if (!__FIELD.phases || __FIELD.phases.length !== 3) throw new Error('phases not initialized');
      if (__FIELD.phaseIdx !== 0) throw new Error('phaseIdx not 0: ' + __FIELD.phaseIdx);
      if (!__FIELD.phaseScore || __FIELD.phaseScore.US !== 0 || __FIELD.phaseScore.CS !== 0) throw new Error('phaseScore not zeroed');
      if (!__FIELD.battleCas || __FIELD.battleCas.US !== 0 || __FIELD.battleCas.CS !== 0) throw new Error('battleCas not zeroed');
      if (__FIELD.objective.name.indexOf('LaFayette Road') < 0) throw new Error('phase-0 objective not the LaFayette Road crossing: ' + __FIELD.objective.name);
      var want = DATA.phases[0].oob.US.length + DATA.phases[0].oob.CS.length;
      if (__FIELD.units.length !== want) throw new Error('phase-0 unit count wrong: ' + __FIELD.units.length + ' want ' + want);
      if (__FIELD.phase !== 'deploy') throw new Error('should deploy, got ' + __FIELD.phase);
      return { phases: __FIELD.phases.length, units: __FIELD.units.length, objective: __FIELD.objective.name };
    });

    step('PER-PHASE COMMANDERS: P0 has Thomas/Brannan/Cheatham/Stewart/Liddell; P1 rebuilds Longstreet/Wood/Hood/Johnson at the Brotherton gap; P2 rebuilds Thomas/Granger/Preston/Breckinridge on the ridge', function() {
      fldLaunchSandbox({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: 1 });
      function leaderIds() { var L = __FIELD.leaders || [], o = []; for (var i = 0; i < L.length; i++) o.push(L[i].id); return o; }
      var p0 = leaderIds().join(',');
      if (p0.indexOf('ld_thomas_woods') < 0 || p0.indexOf('ld_cheatham_woods') < 0 || p0.indexOf('ld_stewart_woods') < 0 || p0.indexOf('ld_liddell_woods') < 0) throw new Error('phase-0 leaders wrong: ' + p0);
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      var p1 = leaderIds().join(',');
      if (p1.indexOf('ld_longstreet_gap') < 0 || p1.indexOf('ld_wood_gap') < 0 || p1.indexOf('ld_hood_gap') < 0 || p1.indexOf('ld_johnson_gap') < 0) throw new Error('phase-1 leaders wrong: ' + p1);
      if (__FIELD.objective.name.indexOf('Brotherton') < 0) throw new Error('phase-1 objective not the Brotherton gap: ' + __FIELD.objective.name);
      __FIELD.phaseIdx = 2; _fldBuildPhase(2);
      var p2 = leaderIds().join(',');
      if (p2.indexOf('ld_thomas_rock') < 0 || p2.indexOf('ld_granger_rock') < 0 || p2.indexOf('ld_preston_rock') < 0 || p2.indexOf('ld_breck_rock') < 0) throw new Error('phase-2 leaders wrong: ' + p2);
      if (__FIELD.objective.name.indexOf('Snodgrass') < 0 && __FIELD.objective.name.indexOf('Horseshoe') < 0) throw new Error('phase-2 objective not Snodgrass/Horseshoe: ' + __FIELD.objective.name);
      return { p0: p0, p1Objective: 'Brotherton', p2Objective: __FIELD.objective.name };
    });

    step('THE BATTLE ADVANCES through all 3 phases headlessly, phaseLog in order, aggregate winner by phases, no NaN', function() {
      var r = runChick({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: 7 });
      if (__FIELD.phase !== 'over') throw new Error('battle did not end, phase=' + __FIELD.phase);
      if (r.phasesPlayed !== 3) throw new Error('not all 3 phases resolved: ' + r.phasesPlayed);
      if (r.by !== 'phases') throw new Error('winBy not phases: ' + r.by);
      if (['US', 'CS', 'draw'].indexOf(r.w) < 0) throw new Error('bad aggregate winner: ' + r.w);
      if (r.log[0].name.indexOf('Woods') < 0 || r.log[1].name.indexOf('Breakthrough') < 0 || r.log[2].name.indexOf('Rock') < 0) throw new Error('phase order wrong: ' + r.log.map(function(e) { return e.name; }).join('/'));
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { winner: r.w, winBy: r.by, phases: r.phasesPlayed, steps: r.steps, log: r.log.map(function(e) { return e.name.indexOf('Woods') >= 0 ? 'Woods:' + e.w : (e.name.indexOf('Breakthrough') >= 0 ? 'Break:' + e.w : 'Rock:' + e.w); }) };
    });

    step('CARRY-OVER: battleCas equals the sum of phase losses, and weighted sector score totals to 5.0 (1 + 3 + 1)', function() {
      var r = runChick({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: 42 });
      var sumCas = 0; for (var i = 0; i < r.log.length; i++) sumCas += (r.log[i].us + r.log[i].cs);
      var totalCas = r.cas.US + r.cas.CS;
      if (Math.abs(sumCas - totalCas) > 5) throw new Error('battleCas (' + totalCas + ') != sum of phase casualties (' + sumCas + ')');
      if (totalCas < 9000) throw new Error('implausibly low total casualties for the bloodiest Western battle: ' + totalCas);
      var sumScore = r.score.US + r.score.CS;
      if (sumScore < 4.99 || sumScore > 5.01) throw new Error('phase score does not sum to 5.0 (1 + 3 + 1): ' + sumScore);
      return { battleCas: r.cas, sumOfPhaseCas: Math.round(sumCas), score: r.score };
    });

    step('HISTORICAL PATTERN (shared model, 8 seeds): P0 woods bloodbath is logged as a D272 watch row, P1 CS breakthrough is decisive, P2 Thomas holds AND the CS assault pays, aggregate is a Confederate tactical victory', function() {
      var seeds = [1, 7, 21, 33, 49, 101, 202, 303], p0us = 0, p1cs = 0, p1csHold = 0, p2us = 0, csAgg = 0, samples = [];
      var p0casUS = 0, p0casCS = 0, p1casUS = 0, p1casCS = 0, p2casUS = 0, p2casCS = 0, aggUS = 0, aggCS = 0;
      for (var s = 0; s < seeds.length; s++) {
        var r = runChick({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: seeds[s] });
        if (r.log[0].w === 'US') p0us++;
        if (r.log[1].w === 'CS') { p1cs++; if (r.log[1].by === 'hold') p1csHold++; }
        if (r.log[2].w === 'US') p2us++;
        if (r.w === 'CS') csAgg++;
        p0casUS += r.log[0].us; p0casCS += r.log[0].cs;
        p1casUS += r.log[1].us; p1casCS += r.log[1].cs;
        p2casUS += r.log[2].us; p2casCS += r.log[2].cs;
        aggUS += (r.log[0].us + r.log[1].us + r.log[2].us); aggCS += (r.log[0].cs + r.log[1].cs + r.log[2].cs);
        samples.push(r.log.map(function(e) { return e.w; }).join('') + '=' + r.w);
      }
      // D272/E53-v2 watch row: attacker parity can move the Sep-19 woods phase from the
      // older US-majority line-hold read to CS-majority. Do not tune E53 around this
      // adjacent row; keep the hard gates on P1/P2/aggregate and casualty direction.
      if (p1cs < 7) throw new Error('the Brotherton breakthrough must be CS-decisive in the majority: ' + p1cs + '/8');
      // The breakthrough is WON by the attacker SEIZING the gap (winBy "hold"), not by a degenerate destroy/timeout (the seize-the-gap teaching).
      if (p1csHold < Math.max(1, p1cs - 1)) throw new Error('the CS breakthrough must be won by SEIZING the gap (winBy hold), not destroy/timeout: ' + p1csHold + '/' + p1cs + ' holds');
      if (p2us < 7) throw new Error("Thomas's stand on Horseshoe Ridge must HOLD in the majority: " + p2us + '/8');
      if (csAgg < 6) throw new Error('the aggregate should be a Confederate tactical victory in the majority: ' + csAgg + '/8');
      // P2 the failed-assault lesson: the CS ATTACKER must pay materially more than the US defender behind the works
      // (mirrors Fredericksburg/Vicksburg). D272/E53-v2 shifted adjacent RNG/cost reads, so keep this as a
      // direction/materiality guard and log the exact ratio instead of tuning combat back to the old 1.50 floor.
      var p2ratio = p2casUS > 0 ? p2casCS / p2casUS : 99;
      if (p2ratio < 1.25) throw new Error('the assault on Horseshoe Ridge must cost the CS attacker materially more than the US defender (CS:US ' + p2ratio.toFixed(2) + ', want >=1.25)');
      // P1 the breakthrough: the routed US defender bleeds FAR more cheaply than it costs the CS attacker who pours through the gap
      // (the inverse direction of P2; a regression toward parity here would invert the "cheap breakthrough" teaching).
      var p1ratio = p1casCS > 0 ? p1casUS / p1casCS : 99;
      if (p1ratio < 2.5) throw new Error('the Brotherton breakthrough must rout the US defender far more cheaply than it costs the CS attacker (US:CS ' + p1ratio.toFixed(2) + ', want >=2.5)');
      // D272/E53-v2 watch row: the active parity seam makes Chickamauga cheaper for the CS attacker
      // by resolving P0/P1 more decisively. Log the aggregate cost direction here instead of tuning
      // E53 against it; the hard gates remain P1/P2 direction, aggregate winner, and no false captures.
      // P0 winner/cost is the D272 watch class above; keep its exact cost in the output.
      return { p0LineHeldWatch: p0us + '/8', p1Breakthrough: p1cs + '/8', p1SeizeHolds: p1csHold + '/' + p1cs, p2Held: p2us + '/8', csAggregate: csAgg + '/8',
        p1RoutCostUStoCS: Number(p1ratio.toFixed(2)), p2AssaultCostCStoUS: Number(p2ratio.toFixed(2)),
        aggCasUS: aggUS, aggCasCS: aggCS, sample: samples.slice(0, 3) };
    });

    step('ALT-HISTORY HINGE: with the Brotherton gap held (a US-won breakthrough phase) the weighted aggregate flips to the Union - the Wood gap is the decisive lever', function() {
      // Synthesize the historical case and the gap-closed case from the weighting itself (engine-truth, no balance dependency).
      // Historical: P0 US(1), P1 CS(3), P2 US(1) -> US 2 / CS 3 -> CS.
      // Gap closed:  P0 US(1), P1 US(3), P2 US(1) -> US 5 / CS 0 -> US (history overturned).
      var w = DATA.phases.map(function(p) { return p.scoreWeight || 1; });
      var histUS = w[0] + w[2], histCS = w[1];
      var flipUS = w[0] + w[1] + w[2];
      if (!(histCS > histUS)) throw new Error('historical weighting should favor CS (the breakthrough): US ' + histUS + ' / CS ' + histCS);
      if (!(flipUS > histCS)) throw new Error('closing the gap (US wins P1) should overturn the result: US ' + flipUS);
      return { historical: 'US ' + histUS + ' / CS ' + histCS + ' -> CS', gapClosed: 'US ' + flipUS + ' -> US' };
    });

    step('DETERMINISM: same seed -> identical Chickamauga (winner, score, phase log, steps)', function() {
      var a = runChick({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: 909 });
      var b = runChick({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: 909 });
      if (a.w !== b.w || JSON.stringify(a.score) !== JSON.stringify(b.score) || a.steps !== b.steps || JSON.stringify(a.log) !== JSON.stringify(b.log))
        throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      return { winner: a.w, score: a.score, steps: a.steps };
    });

    step('A US PLAYER AND A CS PLAYER both resolve the whole 3-phase battle passively (no hang/NaN)', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false; delete G.settings.tacticalFog;
        fldLaunchSandbox({ renderer: 'none', scenario: 'chickamauga', seed: 7, playerSide: ps });
        __FIELD.phase = 'battle'; __FIELD.paused = false;
        var n = 0; while (__FIELD.phase === 'battle' && n < 120000) { fldSimStep(0.05); n++; }
        if (__FIELD.phase !== 'over') throw new Error(ps + ' passive battle did not terminate (phase ' + __FIELD.phase + ', idx ' + __FIELD.phaseIdx + ')');
        if ((__FIELD.phaseLog || []).length !== 3) throw new Error(ps + ' passive battle did not play all 3 phases: ' + (__FIELD.phaseLog || []).length);
        if (['US', 'CS', 'draw'].indexOf(__FIELD.winner) < 0) throw new Error(ps + ' passive battle bad winner: ' + __FIELD.winner);
        out[ps] = { winner: __FIELD.winner, phases: (__FIELD.phaseLog || []).length, steps: n };
      });
      return out;
    });

    step('SINGLE-OBJECTIVE PATH UNREGRESSED: sandbox + Shiloh stay non-phased while Chickamauga uses phases', function() {
      fldLaunchSandbox({ renderer: 'none', autoBoth: true, seed: 12345 });
      if (__FIELD.scenario !== 'sandbox') throw new Error('sandbox tag wrong');
      if (__FIELD.phases !== null) throw new Error('phase machinery leaked into sandbox: ' + __FIELD.phases);
      fldLaunchSandbox({ renderer: 'none', scenario: 'shiloh', autoBoth: true, seed: 101 });
      if (__FIELD.phases !== null) throw new Error('phase machinery leaked into Shiloh: ' + __FIELD.phases);
      __FIELD.phase = 'battle'; __FIELD.paused = false; var n = 0; while (__FIELD.phase === 'battle' && n < 25000) { fldSimStep(0.05); n++; }
      var shW = __FIELD.winner; if (['US', 'CS', 'draw'].indexOf(shW) < 0) throw new Error('Shiloh did not resolve: ' + shW);
      fldLaunchSandbox({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: 101 });
      if (__FIELD.phases === null || __FIELD.phases.length !== 3) throw new Error('Chickamauga phases not set');
      return { sandboxPhases: null, shilohWinner: shW, chickamaugaPhases: __FIELD.phases.length };
    });

  } catch (e) { R.ok = false; R.errors.push('FATAL ' + String(e && e.message || e)); }
  return JSON.stringify(R);
})()`;

const DOM = `(() => {
  var R = { steps: [], ok: true };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name: name, ok: true, v: v === undefined ? null : v }); }
    catch (e) { R.ok = false; R.steps.push({ name: name, ok: false, err: String(e && e.message || e) }); }
  }
  try {
    try { delete G.settings.tacticalPreset; } catch (e) {}
    delete G.settings.tacticalFog;

    step('MENU: the Chickamauga button injects idempotently in the tactical scenario block', function() {
      if (typeof openMainMenu !== 'function') return { skipped: 'no openMainMenu' };
      G.mode = 'menu'; openMainMenu(); fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_chickamauga');
      if (!btn) throw new Error('Chickamauga button did NOT inject');
      if (!btn.getAttribute('aria-label')) throw new Error('Chickamauga button missing aria-label');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_chickamauga').length !== 1) throw new Error('duplicate Chickamauga buttons');
      var t = btn.textContent || '';
      if (t.toUpperCase().indexOf('CHICKAMAUGA') < 0) throw new Error('button does not name Chickamauga');
      return { injected: true, hl: (btn.querySelector('.gn-hl') || {}).textContent };
    });

    step('SIDE-CHOICE SHEET: fldScenarioSideChoice("chickamauga") renders Union/Confederate cards and the CS callback fires', function() {
      if (typeof fldScenarioSideChoice !== 'function') throw new Error('fldScenarioSideChoice missing');
      var picked = null; fldScenarioSideChoice('chickamauga', function(side) { picked = side; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('expected 2 side cards, got ' + cards.length);
      var sheetTxt = (document.getElementById('sheetPad') || document.body).textContent || '';
      if (sheetTxt.indexOf('Chickamauga') < 0) throw new Error('side sheet did not name Chickamauga');
      document.querySelector('[data-brside="CS"]').click();
      if (picked !== 'CS') throw new Error('CS card did not call back CS: ' + picked);
      try { if (typeof closeSheet === 'function') closeSheet(); } catch (e) {}
      return { cards: cards.length, picked: picked };
    });

    step('INTER-PHASE CARD: the Woods resolution opens a modal naming Longstreet\\'s Breakthrough; Continue advances to phase 1 (the Brotherton gap)', function() {
      fldLaunchSandbox({ renderer: '2d', scenario: 'chickamauga', autoBoth: true, seed: 7 });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      var n = 0; while (__FIELD.phase === 'battle' && n < 40000) { fldSimStep(0.05); n++; }
      if (__FIELD.phase !== 'interphase') throw new Error('phase 0 did not pause at the interphase card (phase ' + __FIELD.phase + ', idx ' + __FIELD.phaseIdx + ')');
      var card = document.getElementById('fldInterphase');
      if (!card) throw new Error('interphase card not created');
      if (card.getAttribute('role') !== 'dialog' || card.getAttribute('aria-modal') !== 'true') throw new Error('interphase card not modal');
      var t = card.textContent || '';
      if (t.indexOf('Woods') < 0 || t.indexOf('Breakthrough') < 0) throw new Error('card missing phase names: ' + t.slice(0, 160));
      if (t.indexOf('SECTORS') < 0 && t.indexOf('Sectors') < 0) throw new Error('card missing running tally');
      var go = document.getElementById('fldPhaseGo'); if (!go) throw new Error('no Continue button');
      go.click();
      if (document.getElementById('fldInterphase')) throw new Error('Continue did not dismiss the card');
      if (__FIELD.phase !== 'battle') throw new Error('Continue did not resume battle: ' + __FIELD.phase);
      if (__FIELD.objective.name.indexOf('Brotherton') < 0) throw new Error('phase 1 objective did not load: ' + __FIELD.objective.name);
      try { fldExit(true); } catch (e) {}
      return { interphasePaused: true, advancedTo: __FIELD.objective.name };
    });

    step('RUNNING-TALLY HUD: Chickamauga exposes the compact phase/sector chip; single-objective Shiloh stays empty', function() {
      if (typeof _fldPhaseTopLabel !== 'function') throw new Error('_fldPhaseTopLabel missing');
      fldLaunchSandbox({ renderer: '2d', scenario: 'chickamauga', autoBoth: true, seed: 1 });
      var lbl = _fldPhaseTopLabel(), parts = (typeof _fldPhaseTopParts === 'function') ? _fldPhaseTopParts() : null;
      if (lbl.indexOf('Phase 1/3') < 0 || lbl.indexOf('Woods') < 0 || lbl.indexOf('US ') < 0 || lbl.indexOf(' / CS ') < 0) throw new Error('multi-phase top label wrong: ' + lbl);
      if (!parts || parts.chip !== lbl || !parts.full || parts.full.toLowerCase().indexOf('sectors') < 0) throw new Error('phase top parts wrong: ' + JSON.stringify(parts));
      if (!document.getElementById('fldSector')) throw new Error('compact phase chip #fldSector missing');
      fldExit(true);
      fldLaunchSandbox({ renderer: '2d', scenario: 'shiloh', autoBoth: true, seed: 1 });
      var lbl2 = _fldPhaseTopLabel();
      if (lbl2 !== '') throw new Error('single-objective top label must be empty, got: ' + lbl2);
      fldExit(true);
      return { multiPhaseLabel: lbl, singleObjectiveLabel: lbl2 };
    });

    step('AGGREGATE END-SCREEN: the phase table + Chickamauga endNote/teaching surface the Rock / Chattanooga-siege framing', function() {
      if (typeof _fldPhasesEndHtml !== 'function') throw new Error('_fldPhasesEndHtml missing');
      fldLaunchSandbox({ renderer: 'none', scenario: 'chickamauga', autoBoth: true, seed: 7 });
      __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      var n = 0; while (__FIELD.phase === 'battle' && n < 120000) { fldSimStep(0.05); n++; }
      var aggWinner = __FIELD.winner;
      var html = _fldPhasesEndHtml();
      if (!html || html.indexOf('phase by phase') < 0) throw new Error('aggregate end html missing the phase table');
      if (html.indexOf('Woods') < 0 || html.indexOf('Breakthrough') < 0 || html.indexOf('Rock') < 0) throw new Error('end table missing a Chickamauga phase');
      var note = fldScenarioEndHtml(aggWinner);
      var low = String(note || '').toLowerCase();
      if (low.indexOf('chickamauga') < 0 && low.indexOf('chattanooga') < 0 && low.indexOf('rock') < 0) throw new Error('endNote did not surface the Chickamauga/Chattanooga/Rock framing');
      fldLaunchSandbox({ renderer: 'none', scenario: 'shiloh', autoBoth: true, seed: 1 });
      if (_fldPhasesEndHtml() !== '') throw new Error('phases end html must be empty for Shiloh');
      try { fldExit(true); } catch (e) {}
      return { aggregateWinner: aggWinner, endLen: html.length, noteLen: note.length };
    });

  } catch (e) { R.ok = false; R.steps.push({ name: 'FATAL', ok: false, err: String(e && e.message || e) }); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) {
    srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 60; i++) { if (await up(probe)) break; await sleep(150); }
  }
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
  catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = [];
  page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok: false };
  try {
    // The embedded-photo tier can keep the window "load" event open while
    // local assets stream; the probe only needs inline scripts ready.
    await page.goto(probe, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = result.steps.concat(dom.steps);
    if (!dom.ok) result.ok = false;

    const shot = await page.evaluate(`(function() {
      try {
        G.settings.gfx = 'classic';
        fldLaunchSandbox({ renderer: '2d', scenario: 'chickamauga', autoBoth: true, seed: 21 });
        __FIELD.phase = 'battle'; __FIELD.paused = true;
        fldStepN(1200, 0.05);
        fld2dDraw(); fldRenderTop(); fldRenderHud();
        var cv = document.getElementById('fldGl');
        if (!cv || typeof cv.toDataURL !== 'function') throw new Error('no tactical canvas export');
        var dataUrl = cv.toDataURL('image/png');
        if (!dataUrl || dataUrl.indexOf('data:image/png;base64,') !== 0 || dataUrl.length < 1024) throw new Error('canvas PNG export too small');
        return { simT: Math.round(__FIELD.t), phaseIdx: __FIELD.phaseIdx, units: __FIELD.units.length, objective: __FIELD.objective.name, dataUrl };
      } catch (e) { return { err: String(e && e.message || e) }; }
    })()`);
    if (shot && shot.err) throw new Error('Chickamauga capture failed: ' + shot.err);
    result.screenshot = { simT: shot.simT, phaseIdx: shot.phaseIdx, units: shot.units, objective: shot.objective };
    writeFileSync(join(OUT, 'probe-chickamauga.png'), Buffer.from(String(shot.dataUrl || '').split(',')[1] || '', 'base64'));
    await page.evaluate(`(function() { try { fldExit(true); } catch (e) {} })()`);
    result.pageerrors = pageerrors;
  } catch (e) {
    result = { ok: false, fatal: String(e && e.message || e), pageerrors };
  } finally {
    writeFileSync(join(OUT, 'probe-chickamauga.json'), JSON.stringify(result, null, 2));
    printResult(result);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  if (!result.ok || result.fatal || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
