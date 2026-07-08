#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-chattanooga.mjs - D326 playable Chattanooga.
// Verifies the three-phase T8 scenario (Orchard Knob -> Lookout Mountain ->
// Missionary Ridge), the D325 source traps, D74 no-fudge wall, deterministic
// completion, menu integration, and JSON/pageerror readback.
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
  console.log('probe-chattanooga ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
    else console.log('  ok   ' + s.name.slice(0, 68) + ' :: ' + JSON.stringify(s.v));
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
  function runChat(opts) {
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    delete G.settings.tacticalFog;
    fldLaunchSandbox(opts);
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0;
    while (__FIELD.phase === 'battle' && n < 130000) { fldSimStep(0.05); n++; }
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
    var DATA = (GAME_DATA && GAME_DATA.chattanooga) ? GAME_DATA.chattanooga.chattanooga : null;

    step('DATA present: GAME_DATA.chattanooga.chattanooga declares 3 phases (Orchard Knob -> Lookout Mountain -> Missionary Ridge) with US attacker / CS defender and 1+1+3 weights', function() {
      if (!DATA) throw new Error('GAME_DATA.chattanooga.chattanooga missing');
      if (DATA.attacker !== 'US' || DATA.defender !== 'CS') throw new Error('top-level roles wrong: ' + DATA.attacker + '/' + DATA.defender);
      if (!DATA.phases || DATA.phases.length !== 3) throw new Error('want 3 phases, got ' + (DATA.phases && DATA.phases.length));
      var names = DATA.phases.map(function(p) { return p.name; }).join(' | ');
      if (names.indexOf('Orchard') < 0 || names.indexOf('Lookout') < 0 || names.indexOf('Missionary') < 0) throw new Error('phase names wrong: ' + names);
      var weights = DATA.phases.map(function(p) { return p.scoreWeight || 1; });
      if (weights[0] !== 1 || weights[1] !== 1 || weights[2] !== 3) throw new Error('weights must be 1+1+3, got ' + weights.join('+'));
      for (var i = 0; i < DATA.phases.length; i++) {
        var p = DATA.phases[i];
        if (p.attacker !== 'US' || p.defender !== 'CS') throw new Error('phase ' + i + ' roles wrong: ' + p.attacker + '/' + p.defender);
        if (!p.objective || !isNum(p.objective.x)) throw new Error('phase ' + i + ' missing objective');
        if (!p.terrain || !p.terrain.markers || p.terrain.markers.length < 3) throw new Error('phase ' + i + ' missing terrain markers');
        if (!p.oob || !p.oob.US || !p.oob.CS) throw new Error('phase ' + i + ' missing OOB');
      }
      return { names: names, weights: weights };
    });

    step('CONTENT TEETH: landmarks and teaching cover Orchard Knob / Indian Hill, Lookout Creek, Cravens House, bench-not-summit, Missionary Ridge, base rifle pits, military crest, Tunnel Hill, Cleburne, and Ringgold Gap', function() {
      var body = txt(DATA);
      var terms = ['orchard knob', 'indian hill', 'lookout creek', 'cravens house', 'bench', 'not the summit', 'missionary ridge', 'base rifle pits', 'military-crest', 'tunnel hill', 'cleburne', 'ringgold gap'];
      var missing = [];
      for (var i = 0; i < terms.length; i++) if (body.indexOf(terms[i]) < 0) missing.push(terms[i]);
      if (missing.length) throw new Error('missing terms: ' + missing.join(', '));
      if (body.indexOf('battle above the clouds') < 0) throw new Error('Lookout teaching does not name Battle Above the Clouds');
      if (body.indexOf('captured and missing') < 0 || body.indexOf('40 guns') < 0) throw new Error('casualty/capture teaching missing');
      return { terms: terms.length, cards: (DATA.teaching && DATA.teaching.cards || []).length, codex: DATA.teaching && DATA.teaching.codex && DATA.teaching.codex.id };
    });

    step('RANK/OOB TRAPS: Grant/Sherman/Thomas/Hooker/Granger/Palmer/Bragg/Hardee/Breckinridge/Cleburne/Anderson/Bate/Osterhaus are not anachronistically inflated', function() {
      var body = txt(DATA);
      var forbidden = ['lt. gen. ulysses s. grant', 'lieutenant general ulysses s. grant', 'lt. gen. john c. breckinridge', 'lieutenant general john c. breckinridge', 'maj. gen. j. patton anderson', 'major general j. patton anderson', 'maj. gen. william b. bate', 'major general william b. bate', 'maj. gen. peter j. osterhaus', 'major general peter j. osterhaus'];
      for (var i = 0; i < forbidden.length; i++) if (body.indexOf(forbidden[i]) >= 0) throw new Error('anachronistic rank leaked: ' + forbidden[i]);
      ['maj. gen. ulysses s. grant', 'maj. gen. george h. thomas', 'maj. gen. joseph hooker', 'maj. gen. gordon granger', 'maj. gen. john m. palmer', 'gen. braxton bragg', 'lt. gen', 'maj. gen. john c. breckinridge', 'maj. gen. patrick cleburne', 'brig. gen. j. patton anderson', 'brig. gen. william b. bate', 'brig. gen. peter j. osterhaus'].forEach(function(term) {
        if (body.indexOf(term) < 0) throw new Error('missing rank trap term ' + term);
      });
      return { rankTeeth: true };
    });

    step('UNIVERSAL GUN MODEL + NO per-battle fudge: batteries carry gun counts and no unit/phase carries battle-specific combat multipliers', function() {
      var arts = [], totalGuns = 0, FORBID = ['damage', 'dmg', 'firemult', 'firemultiplier', 'casualtymult', 'lossmult', 'killmult', 'fudge', 'powermult'];
      for (var i = 0; i < DATA.phases.length; i++) {
        var p = DATA.phases[i];
        for (var pk in p) if (p.hasOwnProperty(pk) && FORBID.indexOf(String(pk).toLowerCase()) >= 0) throw new Error('forbidden phase key ' + pk + ' on ' + p.id);
        var all = collectUnits(p);
        for (var j = 0; j < all.length; j++) {
          var u = all[j];
          for (var k in u) if (u.hasOwnProperty(k) && FORBID.indexOf(String(k).toLowerCase()) >= 0) throw new Error('forbidden fudge key "' + k + '" on ' + u.id);
          if (u.arm === 'art') arts.push(u);
        }
      }
      if (arts.length < 6) throw new Error('expected >=6 batteries across phases, got ' + arts.length);
      for (var a = 0; a < arts.length; a++) {
        var b = arts[a];
        if (!(b.guns > 0)) throw new Error(b.id + ' has no gun count');
        if (!(b.men > 0 && b.men <= b.guns * 40)) throw new Error(b.id + ' crew not plausible: ' + b.men + ' for ' + b.guns + ' guns');
        totalGuns += b.guns;
      }
      return { batteries: arts.length, totalGuns: totalGuns };
    });

    step('MULTI-PHASE LAUNCH: phase 0 builds Orchard Knob OOB/objective and zeroes running tally', function() {
      fldLaunchSandbox({ renderer: 'none', scenario: 'chattanooga', autoBoth: true, seed: 12345 });
      if (__FIELD.scenario !== 'chattanooga') throw new Error('scenario not set: ' + __FIELD.scenario);
      if (!__FIELD.phases || __FIELD.phases.length !== 3) throw new Error('phases not initialized');
      if (__FIELD.phaseIdx !== 0) throw new Error('phaseIdx not 0: ' + __FIELD.phaseIdx);
      if (!__FIELD.phaseScore || __FIELD.phaseScore.US !== 0 || __FIELD.phaseScore.CS !== 0) throw new Error('phaseScore not zeroed');
      if (!__FIELD.battleCas || __FIELD.battleCas.US !== 0 || __FIELD.battleCas.CS !== 0) throw new Error('battleCas not zeroed');
      if (__FIELD.objective.name.indexOf('Orchard') < 0) throw new Error('phase-0 objective not Orchard Knob: ' + __FIELD.objective.name);
      var want = DATA.phases[0].oob.US.length + DATA.phases[0].oob.CS.length;
      if (__FIELD.units.length !== want) throw new Error('phase-0 unit count wrong: ' + __FIELD.units.length + ' want ' + want);
      return { phases: __FIELD.phases.length, units: __FIELD.units.length, objective: __FIELD.objective.name };
    });

    step('PER-PHASE COMMANDERS: P0 Grant/Thomas/Granger/Bragg; P1 Hooker/Geary/Osterhaus/Walthall/Moore; P2 Thomas/Granger/Palmer/Breckinridge/Anderson/Bate/Cleburne', function() {
      fldLaunchSandbox({ renderer: 'none', scenario: 'chattanooga', autoBoth: true, seed: 1 });
      function leaderIds() { var L = __FIELD.leaders || [], o = []; for (var i = 0; i < L.length; i++) o.push(L[i].id); return o.join(','); }
      var p0 = leaderIds();
      if (p0.indexOf('ld_grant_ok') < 0 || p0.indexOf('ld_thomas_ok') < 0 || p0.indexOf('ld_granger_ok') < 0 || p0.indexOf('ld_bragg_ok') < 0) throw new Error('phase-0 leaders wrong: ' + p0);
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      var p1 = leaderIds();
      if (p1.indexOf('ld_hooker_lm') < 0 || p1.indexOf('ld_geary_lm') < 0 || p1.indexOf('ld_osterhaus_lm') < 0 || p1.indexOf('ld_walthall_lm') < 0 || p1.indexOf('ld_moore_lm') < 0) throw new Error('phase-1 leaders wrong: ' + p1);
      if (__FIELD.objective.name.indexOf('Cravens') < 0) throw new Error('phase-1 objective not Cravens bench: ' + __FIELD.objective.name);
      __FIELD.phaseIdx = 2; _fldBuildPhase(2);
      var p2 = leaderIds();
      ['ld_thomas_mr', 'ld_granger_mr', 'ld_palmer_mr', 'ld_breck_mr', 'ld_anderson_mr', 'ld_bate_mr', 'ld_cleburne_note'].forEach(function(id) {
        if (p2.indexOf(id) < 0) throw new Error('phase-2 missing leader ' + id + ': ' + p2);
      });
      if (__FIELD.objective.name.indexOf('Missionary') < 0) throw new Error('phase-2 objective not Missionary Ridge: ' + __FIELD.objective.name);
      return { p0: p0, p1Objective: __FIELD.phases[1].objective.name, p2: p2 };
    });

    step('THE BATTLE ADVANCES through all 3 phases headlessly, phaseLog in order, aggregate winner by phases, no NaN', function() {
      var r = runChat({ renderer: 'none', scenario: 'chattanooga', autoBoth: true, seed: 7 });
      if (__FIELD.phase !== 'over') throw new Error('battle did not end, phase=' + __FIELD.phase);
      if (r.phasesPlayed !== 3) throw new Error('not all 3 phases resolved: ' + r.phasesPlayed);
      if (r.by !== 'phases') throw new Error('winBy not phases: ' + r.by);
      if (['US', 'CS', 'draw'].indexOf(r.w) < 0) throw new Error('bad aggregate winner: ' + r.w);
      if (r.log[0].name.indexOf('Orchard') < 0 || r.log[1].name.indexOf('Lookout') < 0 || r.log[2].name.indexOf('Missionary') < 0) throw new Error('phase order wrong: ' + r.log.map(function(e) { return e.name; }).join('/'));
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { winner: r.w, winBy: r.by, phases: r.phasesPlayed, steps: r.steps, log: r.log.map(function(e) { return e.name.split(' ')[2] + ':' + e.w; }) };
    });

    step('CARRY-OVER: battleCas equals summed phase losses and weighted score totals to 5.0 (1 + 1 + 3)', function() {
      var r = runChat({ renderer: 'none', scenario: 'chattanooga', autoBoth: true, seed: 42 });
      var sumCas = 0; for (var i = 0; i < r.log.length; i++) sumCas += (r.log[i].us + r.log[i].cs);
      var totalCas = r.cas.US + r.cas.CS;
      if (Math.abs(sumCas - totalCas) > 5) throw new Error('battleCas (' + totalCas + ') != sum of phase casualties (' + sumCas + ')');
      if (totalCas < 4500) throw new Error('implausibly low total casualties/losses for three Chattanooga sectors: ' + totalCas);
      var sumScore = r.score.US + r.score.CS;
      if (sumScore < 4.99 || sumScore > 5.01) throw new Error('phase score does not sum to 5.0: ' + sumScore);
      return { battleCas: r.cas, sumOfPhaseCas: Math.round(sumCas), score: r.score };
    });

    step('HISTORICAL PATTERN (shared model, 8 seeds): US takes Orchard Knob, Lookout, Missionary Ridge, and aggregate; Missionary Ridge is decisive', function() {
      var seeds = [1, 7, 21, 33, 49, 101, 202, 303], p0us = 0, p1us = 0, p2us = 0, usAgg = 0, samples = [];
      for (var s = 0; s < seeds.length; s++) {
        var r = runChat({ renderer: 'none', scenario: 'chattanooga', autoBoth: true, seed: seeds[s] });
        if (r.log[0].w === 'US') p0us++;
        if (r.log[1].w === 'US') p1us++;
        if (r.log[2].w === 'US') p2us++;
        if (r.w === 'US') usAgg++;
        samples.push(r.log.map(function(e) { return e.w; }).join('') + '=' + r.w);
      }
      if (p0us < 6) throw new Error('Orchard Knob should fall to the US in the majority: ' + p0us + '/8');
      if (p1us < 6) throw new Error('Lookout bench should fall to the US in the majority: ' + p1us + '/8');
      if (p2us < 6) throw new Error('Missionary Ridge should fall to the US in the majority: ' + p2us + '/8');
      if (usAgg < 6) throw new Error('aggregate Chattanooga should be a Union victory in the majority: ' + usAgg + '/8');
      return { orchardUS: p0us + '/8', lookoutUS: p1us + '/8', ridgeUS: p2us + '/8', usAggregate: usAgg + '/8', sample: samples.slice(0, 3) };
    });

    step('ALT-HISTORY HINGE: holding Missionary Ridge overturns the weighted aggregate despite Union wins at Orchard Knob and Lookout', function() {
      var w = DATA.phases.map(function(p) { return p.scoreWeight || 1; });
      var histUS = w[0] + w[1] + w[2], heldCS = w[2], heldUS = w[0] + w[1];
      if (histUS !== 5) throw new Error('historical weights should total US 5, got ' + histUS);
      if (!(heldCS > heldUS)) throw new Error('CS holding Missionary Ridge should overturn the battle: CS ' + heldCS + ' / US ' + heldUS);
      return { history: 'US 5 -> US', ridgeHeld: 'US ' + heldUS + ' / CS ' + heldCS + ' -> CS' };
    });

    step('DETERMINISM: same seed -> identical Chattanooga (winner, score, phase log, steps)', function() {
      var a = runChat({ renderer: 'none', scenario: 'chattanooga', autoBoth: true, seed: 909 });
      var b = runChat({ renderer: 'none', scenario: 'chattanooga', autoBoth: true, seed: 909 });
      if (a.w !== b.w || JSON.stringify(a.score) !== JSON.stringify(b.score) || a.steps !== b.steps || JSON.stringify(a.log) !== JSON.stringify(b.log))
        throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      return { winner: a.w, score: a.score, steps: a.steps };
    });

    step('A US PLAYER AND A CS PLAYER both resolve the whole 3-phase battle passively (no hang/NaN)', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false; delete G.settings.tacticalFog;
        fldLaunchSandbox({ renderer: 'none', scenario: 'chattanooga', seed: 7, playerSide: ps });
        __FIELD.phase = 'battle'; __FIELD.paused = false;
        var n = 0; while (__FIELD.phase === 'battle' && n < 130000) { fldSimStep(0.05); n++; }
        if (__FIELD.phase !== 'over') throw new Error(ps + ' passive battle did not terminate (phase ' + __FIELD.phase + ', idx ' + __FIELD.phaseIdx + ')');
        if ((__FIELD.phaseLog || []).length !== 3) throw new Error(ps + ' passive battle did not play all 3 phases: ' + (__FIELD.phaseLog || []).length);
        if (['US', 'CS', 'draw'].indexOf(__FIELD.winner) < 0) throw new Error(ps + ' passive battle bad winner: ' + __FIELD.winner);
        out[ps] = { winner: __FIELD.winner, phases: (__FIELD.phaseLog || []).length, steps: n };
      });
      return out;
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

    step('MENU: the Chattanooga button injects after Chickamauga and is idempotent', function() {
      if (typeof openMainMenu !== 'function') return { skipped: 'no openMainMenu' };
      G.mode = 'menu'; openMainMenu(); fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_chattanooga');
      if (!btn) throw new Error('Chattanooga button did NOT inject');
      if (!btn.getAttribute('aria-label')) throw new Error('Chattanooga button missing aria-label');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_chattanooga').length !== 1) throw new Error('duplicate Chattanooga buttons');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_chickamauga') >= 0 && ids.indexOf('fldScnBtn_chattanooga') === ids.indexOf('fldScnBtn_chickamauga') + 1)) throw new Error('Chattanooga not immediately after Chickamauga: ' + ids.join(' -> '));
      return { injected: true, orderIndex: ids.indexOf('fldScnBtn_chattanooga') };
    });

    step('SIDE-CHOICE SHEET: fldScenarioSideChoice("chattanooga") renders Union/Confederate cards and CS callback', function() {
      if (typeof fldScenarioSideChoice !== 'function') throw new Error('fldScenarioSideChoice missing');
      var picked = null; fldScenarioSideChoice('chattanooga', function(side) { picked = side; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('expected 2 side cards, got ' + cards.length);
      var sheetTxt = (document.getElementById('sheetPad') || document.body).textContent || '';
      if (sheetTxt.indexOf('Chattanooga') < 0) throw new Error('side sheet did not name Chattanooga');
      document.querySelector('[data-brside="CS"]').click();
      if (picked !== 'CS') throw new Error('CS card did not call back CS: ' + picked);
      try { if (typeof closeSheet === 'function') closeSheet(); } catch (e) {}
      return { cards: cards.length, picked: picked };
    });

    step('INTER-PHASE CARD: Orchard Knob resolution opens a modal naming Lookout Mountain; Continue advances to phase 1', function() {
      fldLaunchSandbox({ renderer: '2d', scenario: 'chattanooga', autoBoth: true, seed: 7 });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      var n = 0; while (__FIELD.phase === 'battle' && n < 35000) { fldSimStep(0.05); n++; }
      if (__FIELD.phase !== 'interphase') throw new Error('phase 0 did not pause at the interphase card (phase ' + __FIELD.phase + ', idx ' + __FIELD.phaseIdx + ')');
      var card = document.getElementById('fldInterphase');
      if (!card) throw new Error('interphase card not created');
      if (card.getAttribute('role') !== 'dialog' || card.getAttribute('aria-modal') !== 'true') throw new Error('interphase card not modal');
      var t = card.textContent || '';
      if (t.indexOf('Orchard') < 0 || t.indexOf('Lookout') < 0) throw new Error('card missing phase names: ' + t.slice(0, 160));
      var go = document.getElementById('fldPhaseGo'); if (!go) throw new Error('no Continue button');
      go.click();
      if (document.getElementById('fldInterphase')) throw new Error('Continue did not dismiss the card');
      if (__FIELD.phase !== 'battle') throw new Error('Continue did not resume battle: ' + __FIELD.phase);
      if (__FIELD.objective.name.indexOf('Cravens') < 0) throw new Error('phase 1 objective did not load: ' + __FIELD.objective.name);
      try { fldExit(true); } catch (e) {}
      return { interphasePaused: true, advancedTo: __FIELD.objective.name };
    });

    step('RUNNING-TALLY HUD + END-SCREEN: Chattanooga exposes phase chip and phase table / Cleburne teaching; Shiloh stays non-phased', function() {
      if (typeof _fldPhaseTopLabel !== 'function' || typeof _fldPhasesEndHtml !== 'function') throw new Error('phase HUD helpers missing');
      fldLaunchSandbox({ renderer: '2d', scenario: 'chattanooga', autoBoth: true, seed: 1 });
      var lbl = _fldPhaseTopLabel(), parts = (typeof _fldPhaseTopParts === 'function') ? _fldPhaseTopParts() : null;
      if (lbl.indexOf('Phase 1/3') < 0 || lbl.indexOf('Orchard') < 0 || lbl.indexOf('US ') < 0 || lbl.indexOf(' / CS ') < 0) throw new Error('multi-phase top label wrong: ' + lbl);
      if (!parts || parts.chip !== lbl || !parts.full || parts.full.toLowerCase().indexOf('sectors') < 0) throw new Error('phase top parts wrong: ' + JSON.stringify(parts));
      fldLaunchSandbox({ renderer: 'none', scenario: 'chattanooga', autoBoth: true, seed: 7 });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      var n = 0; while (__FIELD.phase === 'battle' && n < 130000) { fldSimStep(0.05); n++; }
      var html = _fldPhasesEndHtml();
      if (!html || html.indexOf('phase by phase') < 0 || html.indexOf('Missionary') < 0) throw new Error('aggregate end html missing Chattanooga phases');
      var note = fldScenarioEndHtml(__FIELD.winner), low = String(note || '').toLowerCase();
      if (low.indexOf('chattanooga') < 0 || low.indexOf('cleburne') < 0) throw new Error('endNote/teaching did not surface Chattanooga/Cleburne framing');
      fldLaunchSandbox({ renderer: '2d', scenario: 'shiloh', autoBoth: true, seed: 1 });
      if (_fldPhaseTopLabel() !== '' || _fldPhasesEndHtml() !== '') throw new Error('single-objective Shiloh gained phase UI');
      try { fldExit(true); } catch (e) {}
      return { multiPhaseLabel: lbl, endLen: html.length, noteLen: note.length };
    });

  } catch (e) { R.ok = false; R.steps.push({ name: 'FATAL', ok: false, err: String(e && e.message || e) }); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) {
    srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 70; i++) { if (await up(probe)) break; await sleep(150); }
  }
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
  catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = [];
  page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok: false };
  try {
    await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch(e) {} });
    await page.goto(probe, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = result.steps.concat(dom.steps);
    if (!dom.ok) result.ok = false;

    const shot = await page.evaluate(`(function() {
      try {
        G.settings.gfx = 'classic';
        fldLaunchSandbox({ renderer: '2d', scenario: 'chattanooga', autoBoth: true, seed: 21 });
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
    if (shot && shot.err) throw new Error('Chattanooga capture failed: ' + shot.err);
    result.screenshot = { simT: shot.simT, phaseIdx: shot.phaseIdx, units: shot.units, objective: shot.objective };
    writeFileSync(join(OUT, 'probe-chattanooga.png'), Buffer.from(String(shot.dataUrl || '').split(',')[1] || '', 'base64'));
    await page.evaluate(`(function() { try { fldExit(true); } catch (e) {} })()`);
    result.pageerrors = pageerrors;
  } catch (e) {
    result = { ok: false, fatal: String(e && e.message || e), pageerrors };
  } finally {
    writeFileSync(join(OUT, 'probe-chattanooga.json'), JSON.stringify(result, null, 2));
    printResult(result);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  if (!result.ok || result.fatal || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
