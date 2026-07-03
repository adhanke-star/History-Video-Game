#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-vicksburg.mjs - Phase C Western breadth.
// Verifies the Vicksburg real-time tactical scenario as a 3-phase siege
// (Stockade Redan -> Grand Assault -> saps/mine), plus the Modern 3D
// unit-label/selection readability follow-up.
// Writes tools/shots/probe-vicksburg.{json,png} and probe-vicksburg-3d.png.
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
async function closeBrowser(browser) {
  if (!browser) return;
  try { await Promise.race([browser.close(), sleep(3000)]); } catch {}
}
function printResult(result) {
  console.log('probe-vicksburg ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
    else console.log('  ok   ' + s.name.slice(0, 64) + ' :: ' + JSON.stringify(s.v));
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
  function runVicksburg(opts) {
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    delete G.settings.tacticalFog;
    fldLaunchSandbox(opts);
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0;
    while (__FIELD.phase === 'battle' && n < 90000) { fldSimStep(0.05); n++; }
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
    var DATA = (GAME_DATA && GAME_DATA.vicksburg) ? GAME_DATA.vicksburg.vicksburg : null;

    step('DATA present: GAME_DATA.vicksburg.vicksburg declares 3 named siege phases with per-phase OOB/objectives', function() {
      if (!DATA) throw new Error('GAME_DATA.vicksburg.vicksburg missing');
      if (!DATA.phases || DATA.phases.length !== 3) throw new Error('want 3 phases, got ' + (DATA.phases && DATA.phases.length));
      var names = DATA.phases.map(function(p) { return p.name; }).join(' | ');
      if (names.indexOf('Stockade') < 0 || names.indexOf('Grand') < 0 || (names.indexOf('Saps') < 0 && names.indexOf('Mine') < 0)) throw new Error('phase names wrong: ' + names);
      for (var i = 0; i < DATA.phases.length; i++) {
        var p = DATA.phases[i];
        if (!p.objective || !isNum(p.objective.x)) throw new Error('phase ' + i + ' has no objective');
        if (!p.oob || !p.oob.US || !p.oob.CS) throw new Error('phase ' + i + ' missing OOB');
        if (!p.terrain || !p.terrain.walls || p.terrain.walls.length < 2) throw new Error('phase ' + i + ' has too little siege-wall architecture');
        if (!p.terrain.markers || p.terrain.markers.length < 3) throw new Error('phase ' + i + ' has too few named markers');
      }
      return { names: names, scoreWeights: DATA.phases.map(function(p) { return p.scoreWeight || 1; }) };
    });

    step('SIEGE ARCHITECTURE CONTENT: the data names redans, redoubts, DeGolyer, Logan\\'s approach, saps, mine galleries, countermines, loess ravines, and Mississippi pressure', function() {
      var body = txt(DATA);
      var terms = ['stockade redan', '3rd louisiana redan', 'great redoubt', 'railroad redoubt', 'battery degolyer', 'logan', 'sap', 'mine gallery', 'countermine', 'loess', 'mississippi'];
      var missing = [];
      for (var i = 0; i < terms.length; i++) if (body.indexOf(terms[i]) < 0) missing.push(terms[i]);
      if (missing.length) throw new Error('missing siege terms: ' + missing.join(', '));
      if (body.indexOf('dug out') < 0 || body.indexOf('not merely waited out') < 0) throw new Error('teaching does not foreground spade/siege over generic starvation');
      return { terms: terms.length, cards: (DATA.teaching && DATA.teaching.cards || []).length, codex: DATA.teaching && DATA.teaching.codex && DATA.teaching.codex.id };
    });

    step('UNIVERSAL GUN MODEL at Vicksburg scale: every field/siege/naval battery carries a gun count + plausible crew', function() {
      var arts = [], totalGuns = 0;
      for (var i = 0; i < DATA.phases.length; i++) {
        var all = collectUnits(DATA.phases[i]);
        for (var j = 0; j < all.length; j++) if (all[j].arm === 'art') arts.push(all[j]);
      }
      if (arts.length < 6) throw new Error('expected >=6 batteries across the siege phases, got ' + arts.length);
      for (var k = 0; k < arts.length; k++) {
        var a = arts[k];
        if (!(a.guns > 0)) throw new Error(a.id + ' has no gun count');
        if (!(a.men > 0 && a.men <= a.guns * 40)) throw new Error(a.id + ' crew not plausible: ' + a.men + ' for ' + a.guns + ' guns');
        totalGuns += a.guns;
      }
      if (totalGuns < 48) throw new Error('siege artillery too small for Vicksburg abstraction: ' + totalGuns);
      return { batteries: arts.length, totalGuns: totalGuns };
    });

    step('MULTI-PHASE LAUNCH: phase state initializes, phase 0 builds Stockade Redan OOB/objective/running tally', function() {
      fldLaunchSandbox({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: 12345 });
      if (__FIELD.scenario !== 'vicksburg') throw new Error('scenario not set: ' + __FIELD.scenario);
      if (!__FIELD.phases || __FIELD.phases.length !== 3) throw new Error('phases not initialized');
      if (__FIELD.phaseIdx !== 0) throw new Error('phaseIdx not 0: ' + __FIELD.phaseIdx);
      if (!__FIELD.phaseScore || __FIELD.phaseScore.US !== 0 || __FIELD.phaseScore.CS !== 0) throw new Error('phaseScore not zeroed');
      if (!__FIELD.battleCas || __FIELD.battleCas.US !== 0 || __FIELD.battleCas.CS !== 0) throw new Error('battleCas not zeroed');
      if (__FIELD.objective.name.indexOf('Stockade Redan') < 0) throw new Error('phase-0 objective not Stockade Redan: ' + __FIELD.objective.name);
      var want = DATA.phases[0].oob.US.length + DATA.phases[0].oob.CS.length;
      if (__FIELD.units.length !== want) throw new Error('phase-0 unit count wrong: ' + __FIELD.units.length + ' want ' + want);
      if (__FIELD.phase !== 'deploy') throw new Error('should deploy, got ' + __FIELD.phase);
      return { phases: __FIELD.phases.length, units: __FIELD.units.length, objective: __FIELD.objective.name, holdToWin: __FIELD.holdToWin };
    });

    step('PER-PHASE COMMANDERS: phase 0 has Grant/Sherman/Pemberton/Smith (Stockade Redan = M.L. Smith\\'s division, not Hebert); phase 2 rebuilds Logan/Pemberton/Forney at the mined Redan', function() {
      fldLaunchSandbox({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: 1 });
      function leaderIds() { var L = __FIELD.leaders || [], o = []; for (var i = 0; i < L.length; i++) o.push(L[i].id); return o; }
      var p0 = leaderIds().join(',');
      if (p0.indexOf('ld_grant_vb') < 0 || p0.indexOf('ld_sherman_vb') < 0 || p0.indexOf('ld_pemberton_vb') < 0 || p0.indexOf('ld_smith_vb') < 0) throw new Error('phase-0 leaders wrong: ' + p0);
      if (p0.indexOf('ld_hebert_vb') >= 0) throw new Error('Hebert must NOT hold the Stockade Redan (his sector was the 3rd Louisiana Redan): ' + p0);
      __FIELD.phaseIdx = 2; _fldBuildPhase(2);
      var p2 = leaderIds().join(',');
      if (p2.indexOf('ld_logan_siege_vb') < 0 || p2.indexOf('ld_pemberton_siege_vb') < 0 || p2.indexOf('ld_forney_siege_vb') < 0) throw new Error('phase-2 siege leaders wrong: ' + p2);
      if (__FIELD.objective.name.toLowerCase().indexOf('mined') < 0 || __FIELD.objective.name.indexOf('3rd Louisiana Redan') < 0) throw new Error('phase-2 objective not the mined 3rd Louisiana Redan: ' + __FIELD.objective.name);
      return { phase0Leaders: p0, phase2Leaders: p2, phase2Objective: __FIELD.objective.name };
    });

    step('THE SIEGE ADVANCES THROUGH ALL 3 PHASES headlessly, phaseLog in order, aggregate winner by phases, no NaN', function() {
      var r = runVicksburg({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: 7 });
      if (__FIELD.phase !== 'over') throw new Error('battle did not end, phase=' + __FIELD.phase);
      if (r.phasesPlayed !== 3) throw new Error('not all 3 phases resolved: ' + r.phasesPlayed);
      if (r.w !== 'US') throw new Error('Vicksburg aggregate should be Union after the siege phase, got ' + r.w);
      if (r.by !== 'phases') throw new Error('winBy not phases: ' + r.by);
      if (r.log[0].name.indexOf('Stockade') < 0 || r.log[1].name.indexOf('Grand') < 0 || (r.log[2].name.indexOf('Saps') < 0 && r.log[2].name.indexOf('Mine') < 0)) throw new Error('phase order wrong: ' + r.log.map(function(e) { return e.name; }).join('/'));
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { winner: r.w, winBy: r.by, phases: r.phasesPlayed, steps: r.steps, log: r.log.map(function(e) { return e.name.split(' ')[0] + ':' + e.w; }) };
    });

    step('CARRY-OVER: battleCas equals the sum of phase losses, and weighted sector score totals to the Vicksburg siege package', function() {
      var r = runVicksburg({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: 42 });
      var sumCas = 0; for (var i = 0; i < r.log.length; i++) sumCas += (r.log[i].us + r.log[i].cs);
      var totalCas = r.cas.US + r.cas.CS;
      if (Math.abs(sumCas - totalCas) > 5) throw new Error('battleCas (' + totalCas + ') != sum of phase casualties (' + sumCas + ')');
      if (totalCas < 6500) throw new Error('implausibly low total casualties for three Vicksburg sectors: ' + totalCas);
      var sumScore = r.score.US + r.score.CS;
      if (sumScore < 4.99 || sumScore > 5.01) throw new Error('phase score does not sum to 5.0 (1 + 1 + 3): ' + sumScore);
      return { battleCas: r.cas, sumOfPhaseCas: Math.round(sumCas), score: r.score };
    });

    step('HISTORICAL PATTERN under the shared model: May assaults mostly fail, the engineered mine/sap phase mostly succeeds, aggregate Vicksburg falls >=6/8 seeds', function() {
      var seeds = [1, 7, 21, 42, 55, 101, 303, 909], stockadeCS = 0, forlornCS = 0, mineUS = 0, usAgg = 0, samples = [];
      var p0us = 0, p0cs = 0, p1us = 0, p1cs = 0;
      for (var s = 0; s < seeds.length; s++) {
        var r = runVicksburg({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: seeds[s] });
        if (r.log[0].w === 'CS') stockadeCS++;
        if (r.log[1].w === 'CS') forlornCS++;
        if (r.log[2].w === 'US') mineUS++;
        if (r.w === 'US') usAgg++;
        p0us += r.log[0].us; p0cs += r.log[0].cs; p1us += r.log[1].us; p1cs += r.log[1].cs;
        samples.push(r.log.map(function(e) { return e.w; }).join('') + '=' + r.w);
      }
      if (stockadeCS < 6) throw new Error('Stockade Redan should hold in the majority: ' + stockadeCS + '/8');
      if (forlornCS < 6) throw new Error('May 22 grand assault should fail in the majority: ' + forlornCS + '/8');
      if (mineUS < 6) throw new Error('mine/sap siege phase should succeed in the majority: ' + mineUS + '/8');
      if (usAgg < 6) throw new Error('aggregate Vicksburg should fall to the Union in the majority: ' + usAgg + '/8');
      // TEACHING DIRECTION (the Fredericksburg lesson, mirrored): the FAILED May assaults must cost the
      // ATTACKER more than the defender behind the works. Without this the redans can "hold" while the
      // dug-in defender bleeds more than the exposed attacker, teaching the literal opposite of the cards.
      var p0ratio = p0cs > 0 ? p0us / p0cs : 99, p1ratio = p1cs > 0 ? p1us / p1cs : 99;
      if (p0ratio < 1.2) throw new Error('May 19 Stockade assault must cost the ATTACKER more than the defender (US:CS ' + p0ratio.toFixed(2) + ', want >=1.2)');
      if (p1ratio < 1.2) throw new Error('May 22 grand assault must cost the ATTACKER more than the defender (US:CS ' + p1ratio.toFixed(2) + ', want >=1.2)');
      return { stockadeCS: stockadeCS + '/8', forlornCS: forlornCS + '/8', mineUS: mineUS + '/8', usAggregate: usAgg + '/8',
        assaultCostUStoCS: { stockade: Number(p0ratio.toFixed(2)), forlorn: Number(p1ratio.toFixed(2)) }, sample: samples.slice(0, 3) };
    });

    step('A US PLAYER AND A CS PLAYER both resolve the whole 3-phase siege passively (no hang/NaN)', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false; delete G.settings.tacticalFog;
        fldLaunchSandbox({ renderer: 'none', scenario: 'vicksburg', seed: 7, playerSide: ps });
        __FIELD.phase = 'battle'; __FIELD.paused = false;
        var n = 0; while (__FIELD.phase === 'battle' && n < 90000) { fldSimStep(0.05); n++; }
        if (__FIELD.phase !== 'over') throw new Error(ps + ' passive battle did not terminate (phase ' + __FIELD.phase + ', idx ' + __FIELD.phaseIdx + ')');
        if ((__FIELD.phaseLog || []).length !== 3) throw new Error(ps + ' passive battle did not play all 3 phases: ' + (__FIELD.phaseLog || []).length);
        if (['US', 'CS', 'draw'].indexOf(__FIELD.winner) < 0) throw new Error(ps + ' passive battle bad winner: ' + __FIELD.winner);
        out[ps] = { winner: __FIELD.winner, phases: (__FIELD.phaseLog || []).length, steps: n };
      });
      return out;
    });

    step('DETERMINISM: same seed -> identical Vicksburg siege (winner, score, phase log, steps)', function() {
      var a = runVicksburg({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: 909 });
      var b = runVicksburg({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: 909 });
      if (a.w !== b.w || JSON.stringify(a.score) !== JSON.stringify(b.score) || a.steps !== b.steps || JSON.stringify(a.log) !== JSON.stringify(b.log))
        throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      return { winner: a.w, score: a.score, steps: a.steps };
    });

    step('SINGLE-OBJECTIVE PATH UNREGRESSED: sandbox + Shiloh/Fredericksburg stay non-phased while Vicksburg uses phases', function() {
      fldLaunchSandbox({ renderer: 'none', autoBoth: true, seed: 12345 });
      if (__FIELD.scenario !== 'sandbox') throw new Error('sandbox tag wrong');
      if (__FIELD.phases !== null) throw new Error('phase machinery leaked into sandbox: ' + __FIELD.phases);
      fldLaunchSandbox({ renderer: 'none', scenario: 'shiloh', autoBoth: true, seed: 101 });
      if (__FIELD.phases !== null) throw new Error('phase machinery leaked into Shiloh: ' + __FIELD.phases);
      __FIELD.phase = 'battle'; __FIELD.paused = false; var n = 0; while (__FIELD.phase === 'battle' && n < 25000) { fldSimStep(0.05); n++; }
      var shW = __FIELD.winner; if (['US', 'CS', 'draw'].indexOf(shW) < 0) throw new Error('Shiloh did not resolve: ' + shW);
      fldLaunchSandbox({ renderer: 'none', scenario: 'fredericksburg', autoBoth: true, seed: 101 });
      if (__FIELD.phases !== null) throw new Error('phase machinery leaked into Fredericksburg: ' + __FIELD.phases);
      fldLaunchSandbox({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: 101 });
      if (__FIELD.phases === null || __FIELD.phases.length !== 3) throw new Error('Vicksburg phases not set');
      return { sandboxPhases: null, shilohWinner: shW, vicksburgPhases: __FIELD.phases.length };
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

    step('MENU: the Vicksburg button injects idempotently in the tactical scenario block', function() {
      if (typeof openMainMenu !== 'function') return { skipped: 'no openMainMenu' };
      G.mode = 'menu'; openMainMenu(); fldInjectMenuButton();
      var vb = document.getElementById('fldScnBtn_vicksburg');
      if (!vb) throw new Error('Vicksburg button did NOT inject');
      if (!vb.getAttribute('aria-label')) throw new Error('Vicksburg button missing aria-label');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_vicksburg').length !== 1) throw new Error('duplicate Vicksburg buttons');
      var txt = vb.textContent || '';
      if (txt.indexOf('VICKSBURG') < 0 && txt.indexOf('Vicksburg') < 0) throw new Error('button does not name Vicksburg');
      return { injected: true, hl: (vb.querySelector('.gn-hl') || {}).textContent };
    });

    step('SIDE-CHOICE SHEET: fldScenarioSideChoice("vicksburg") renders Union/Confederate cards and CS callback', function() {
      if (typeof fldScenarioSideChoice !== 'function') throw new Error('fldScenarioSideChoice missing');
      var picked = null; fldScenarioSideChoice('vicksburg', function(side) { picked = side; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('expected 2 side cards, got ' + cards.length);
      var sheetTxt = (document.getElementById('sheetPad') || document.body).textContent || '';
      if (sheetTxt.indexOf('Vicksburg') < 0) throw new Error('side sheet did not name Vicksburg');
      document.querySelector('[data-brside="CS"]').click();
      if (picked !== 'CS') throw new Error('CS card did not call back CS: ' + picked);
      try { if (typeof closeSheet === 'function') closeSheet(); } catch (e) {}
      return { cards: cards.length, picked: picked };
    });

    step('INTER-PHASE CARD: Stockade Redan resolution opens a modal naming The Grand Assault; Continue advances to phase 1', function() {
      fldLaunchSandbox({ renderer: '2d', scenario: 'vicksburg', autoBoth: true, seed: 7 });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      var n = 0; while (__FIELD.phase === 'battle' && n < 30000) { fldSimStep(0.05); n++; }
      if (__FIELD.phase !== 'interphase') throw new Error('phase 0 did not pause at interphase card (phase ' + __FIELD.phase + ', idx ' + __FIELD.phaseIdx + ')');
      var card = document.getElementById('fldInterphase');
      if (!card) throw new Error('interphase card not created');
      if (card.getAttribute('role') !== 'dialog' || card.getAttribute('aria-modal') !== 'true') throw new Error('interphase card not modal');
      var txt = card.textContent || '';
      if (txt.indexOf('Stockade Redan') < 0 || txt.indexOf('Grand Assault') < 0) throw new Error('card missing phase names: ' + txt.slice(0, 160));
      if (txt.indexOf('SECTORS') < 0 && txt.indexOf('Sectors') < 0) throw new Error('card missing running tally');
      var go = document.getElementById('fldPhaseGo'); if (!go) throw new Error('no Continue button');
      var idxBefore = __FIELD.phaseIdx;
      go.click();
      if (document.getElementById('fldInterphase')) throw new Error('Continue did not dismiss card');
      if (__FIELD.phase !== 'battle') throw new Error('Continue did not resume battle: ' + __FIELD.phase);
      if (__FIELD.objective.name.indexOf('3rd Louisiana Redan') < 0) throw new Error('phase 1 objective did not load: ' + __FIELD.objective.name);
      try { fldExit(true); } catch (e) {}
      return { interphasePaused: true, advancedTo: __FIELD.objective.name, idxBefore: idxBefore };
    });

    step('RUNNING-TALLY HUD: Vicksburg exposes the compact phase/sector chip and single-objective Shiloh stays empty', function() {
      if (typeof _fldPhaseTopLabel !== 'function') throw new Error('_fldPhaseTopLabel missing');
      fldLaunchSandbox({ renderer: '2d', scenario: 'vicksburg', autoBoth: true, seed: 1 });
      var lbl = _fldPhaseTopLabel(), parts = (typeof _fldPhaseTopParts === 'function') ? _fldPhaseTopParts() : null;
      if (lbl.indexOf('Phase 1/3') < 0 || lbl.indexOf('Stockade') < 0 || lbl.indexOf('US ') < 0 || lbl.indexOf(' / CS ') < 0) throw new Error('multi-phase top label wrong: ' + lbl);
      if (!parts || parts.chip !== lbl || !parts.full || parts.full.toLowerCase().indexOf('sectors') < 0) throw new Error('phase top parts wrong: ' + JSON.stringify(parts));
      if (!document.getElementById('fldSector')) throw new Error('compact phase chip #fldSector missing');
      fldExit(true);
      fldLaunchSandbox({ renderer: '2d', scenario: 'shiloh', autoBoth: true, seed: 1 });
      var lbl2 = _fldPhaseTopLabel();
      if (lbl2 !== '') throw new Error('single-objective top label must be empty, got: ' + lbl2);
      fldExit(true);
      return { multiPhaseLabel: lbl, fullLabel: parts.full, singleObjectiveLabel: lbl2 };
    });

    step('AGGREGATE END-SCREEN: phase table + Vicksburg endNote/teaching surface Mississippi/spade/siege framing', function() {
      if (typeof _fldPhasesEndHtml !== 'function') throw new Error('_fldPhasesEndHtml missing');
      fldLaunchSandbox({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: 7 });
      __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      var n = 0; while (__FIELD.phase === 'battle' && n < 90000) { fldSimStep(0.05); n++; }
      var aggWinner = __FIELD.winner;
      var html = _fldPhasesEndHtml();
      if (!html || html.indexOf('phase by phase') < 0) throw new Error('aggregate end html missing phase table');
      if (html.indexOf('Stockade') < 0 || html.indexOf('Grand') < 0 || (html.indexOf('Saps') < 0 && html.indexOf('Mine') < 0)) throw new Error('end table missing a Vicksburg phase');
      var note = fldScenarioEndHtml(aggWinner);
      var low = String(note || '').toLowerCase();
      if (low.indexOf('mississippi') < 0 || (low.indexOf('spade') < 0 && low.indexOf('siege') < 0 && low.indexOf('batteries') < 0)) throw new Error('endNote/teaching did not surface Mississippi + siege framing');
      fldLaunchSandbox({ renderer: 'none', scenario: 'shiloh', autoBoth: true, seed: 1 });
      if (_fldPhasesEndHtml() !== '') throw new Error('phases end html must be empty for Shiloh');
      try { fldExit(true); } catch (e) {}
      return { aggregateWinner: aggWinner, endLen: html.length, noteLen: note.length };
    });

  } catch (e) { R.ok = false; R.steps.push({ name: 'FATAL', ok: false, err: String(e && e.message || e) }); }
  return JSON.stringify(R);
})()`;

const M3D_SETUP = `(() => {
  try {
    if (typeof G === 'undefined') return { ok: false, err: 'G missing' };
    if (typeof BATTLES === 'undefined' || typeof startBattleRuntime !== 'function') return { ok: false, err: 'classic battle runtime missing' };
    G.settings = G.settings || {}; G.settings.gfx = 'modern'; G.settings.gfxQuality = 'high';
    try { localStorage.setItem('gor_welcomed', '1'); } catch (e0) {}
    var bd = BATTLES.find(function(b) { return b.id === 'vicksburg'; });
    if (!bd) return { ok: false, err: 'BATTLES vicksburg missing' };
    startBattleRuntime(bd, 'US', false);
    if (typeof _m3dActivate === 'function') _m3dActivate();
    var gg = document.getElementById('groundGo');
    if (gg) gg.click();
    else {
      try { if (typeof closeSheet === 'function') closeSheet(); } catch (e) {}
      try { if (typeof showHud === 'function') showHud(); } catch (e2) {}
      try { if (typeof draw === 'function') draw(); } catch (e3) {}
    }
    return { ok: true, battle: bd.name };
  } catch (e) { return { ok: false, err: String(e && e.message || e) }; }
})()`;

const M3D_ASSERT = `(() => {
  var R = { name: 'MODERN 3D READABILITY: Vicksburg selected unit has large depth-test-free badge plus visible selection halo', ok: true, v: null };
  try {
    if (!window.__M3D || !__M3D.ready || !__M3D.unitGroup) throw new Error('Modern 3D not ready');
    if (!G.battle || !G.battle.units) throw new Error('G.battle missing after Modern launch');
    var u = null, B = G.battle, i;
    for (i = 0; i < B.units.length; i++) {
      var x = B.units[i];
      if (x.alive && x.side === B.playerSide && x.type !== 'hq') { u = x; break; }
    }
    if (!u) for (i = 0; i < B.units.length; i++) if (B.units[i].alive && B.units[i].side === B.playerSide) { u = B.units[i]; break; }
    if (!u) throw new Error('no friendly unit to select');
    if (typeof setSel === 'function') setSel(u); else G.sel = u;
    if (typeof _m3dSync === 'function') _m3dSync();
    var M = B.M, tile = M.map[M.key(u.c, u.r)], elev = tile ? (tile.elev || 0) : 0;
    var w = _m3dWorld(u.c, u.r, elev), topY = _m3dTileH(elev);
    if (__M3D.controls && __M3D.camera) {
      __M3D.controls.target.set(w.x, topY + 3, w.z);
      __M3D.camera.position.set(w.x + 6, topY + 7, w.z + 11);
      __M3D.controls.update();
    }
    var cv = _m3dBadgeCanvas(u);
    if (!cv || cv.width < 384 || cv.height < 148) throw new Error('badge canvas too small: ' + (cv && (cv.width + 'x' + cv.height)));
    var grp = null, kids = __M3D.unitGroup.children;
    for (i = 0; i < kids.length; i++) {
      if (kids[i].userData && kids[i].userData.unit === u) { grp = kids[i]; break; }
    }
    if (!grp) throw new Error('selected unit group not found');
    var sprites = 0, selectedBadge = null, halos = 0, noDepth = 0;
    grp.traverse(function(o) {
      if (o.isSprite) {
        sprites++;
        if (!selectedBadge || o.renderOrder > selectedBadge.renderOrder) selectedBadge = o;
      }
      if (o.geometry && String(o.geometry.type || '').indexOf('Ring') >= 0) halos++;
      if (o.material && o.material.depthTest === false) noDepth++;
    });
    if (!selectedBadge) throw new Error('selected badge sprite missing');
    if (selectedBadge.scale.x < 3.8) throw new Error('selected badge not large enough: ' + selectedBadge.scale.x);
    if (!selectedBadge.material || selectedBadge.material.depthTest !== false) throw new Error('selected badge still depth-tested');
    if (selectedBadge.renderOrder < 15) throw new Error('selected badge renderOrder too low: ' + selectedBadge.renderOrder);
    if (halos < 2) throw new Error('selection halo rings missing: ' + halos);
    if (noDepth < 4) throw new Error('not enough depth-test-free readability geometry: ' + noDepth);
    if (__M3D._readabilityBadgeRev !== 1) throw new Error('readability badge cache revision not installed');
    if (__M3D.renderer && __M3D.scene && __M3D.camera) __M3D.renderer.render(__M3D.scene, __M3D.camera);
    R.v = { unit: u.name || u.vetName || u.type, badgeScale: Number(selectedBadge.scale.x.toFixed(2)), renderOrder: selectedBadge.renderOrder, sprites: sprites, halos: halos, depthFree: noDepth, canvas: cv.width + 'x' + cv.height };
  } catch (e) { R.ok = false; R.err = String(e && e.message || e); }
  return R;
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

    const m3dSetup = await page.evaluate(M3D_SETUP);
    if (!m3dSetup || !m3dSetup.ok) {
      result.ok = false;
      result.steps.push({ name: 'MODERN 3D setup for readability probe', ok: false, err: m3dSetup && m3dSetup.err ? m3dSetup.err : 'unknown setup failure' });
    } else {
      try {
        await page.waitForFunction('window.__M3D && (window.__M3D.ready || window.__M3D.failed)', { timeout: 20000 });
        const ready = await page.evaluate('({ ready: !!window.__M3D.ready, failed: !!window.__M3D.failed })');
        if (!ready.ready || ready.failed) {
          result.ok = false;
          result.steps.push({ name: 'MODERN 3D setup for readability probe', ok: false, err: 'Modern 3D failed or reverted: ' + JSON.stringify(ready) });
        } else {
          const m3d = await page.evaluate(M3D_ASSERT);
          result.steps.push(m3d);
          if (!m3d.ok) result.ok = false;
          await sleep(350);
          // Capture the Modern-3D readability frame via the canvas's own toDataURL in the
          // same synchronous tick as the render — the proven probe-tactical-visuals pattern.
          // Playwright's page.screenshot() readback hangs on the live, continuously-rendering
          // WebGL canvas (the documented Chromium readback timeout), so it must not gate this
          // functional probe; same-tick render -> toDataURL is reliable without preserveDrawingBuffer.
          const cap = await page.evaluate(`(function() {
            try {
              var pad = document.getElementById('sheetPad');
              var txt = pad ? (pad.textContent || '') : '';
              if (document.getElementById('hpWelcomeOk') || txt.indexOf('The Civil War') >= 0) {
                if (typeof closeSheet === 'function') closeSheet();
                else {
                  var ov = document.getElementById('overlay');
                  if (ov) ov.classList.add('hidden');
                }
              }
              if (!(__M3D && __M3D.renderer && __M3D.scene && __M3D.camera)) return { ok: false, err: 'Modern 3D renderer missing at capture' };
              __M3D.renderer.render(__M3D.scene, __M3D.camera);
              var cv = __M3D.glcv || document.getElementById('gl');
              if (!cv || typeof cv.toDataURL !== 'function') return { ok: false, err: 'Modern 3D canvas cannot export a capture' };
              var dataUrl = cv.toDataURL('image/png');
              if (!dataUrl || dataUrl.indexOf('data:image/png;base64,') !== 0 || dataUrl.length < 1024) return { ok: false, err: 'Modern 3D PNG export too small' };
              return { ok: true, dataUrl: dataUrl, w: cv.width, h: cv.height };
            } catch (e) { return { ok: false, err: String(e && e.message || e) }; }
          })()`);
          if (cap && cap.ok && cap.dataUrl) {
            writeFileSync(join(OUT, 'probe-vicksburg-3d.png'), Buffer.from(cap.dataUrl.split(',')[1] || '', 'base64'));
            result.steps.push({ name: 'MODERN 3D readability capture: the #gl canvas exports a non-blank frame', ok: true, v: { w: cap.w, h: cap.h } });
          } else {
            result.ok = false;
            result.steps.push({ name: 'MODERN 3D readability capture', ok: false, err: cap && cap.err ? cap.err : 'capture failed' });
          }
        }
      } catch (e) {
        result.ok = false;
        result.steps.push({ name: 'MODERN 3D setup for readability probe', ok: false, err: String(e && e.message || e) });
      }
    }

    const shot = await page.evaluate(`(function() {
      try {
        if (typeof _m3dDeactivate === 'function') _m3dDeactivate();
        if (typeof closeSheet === 'function') closeSheet();
        G.settings.gfx = 'classic';
        fldLaunchSandbox({ renderer: '2d', scenario: 'vicksburg', autoBoth: true, seed: 21 });
        __FIELD.phase = 'battle'; __FIELD.paused = true;
        fldStepN(1200, 0.05);
        fld2dDraw(); fldRenderTop(); fldRenderHud();
        return { simT: Math.round(__FIELD.t), phaseIdx: __FIELD.phaseIdx, units: __FIELD.units.length, objective: __FIELD.objective.name };
      } catch (e) { return { err: String(e && e.message || e) }; }
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT, 'probe-vicksburg.png'), fullPage: false });
    await page.evaluate(`(function() { try { fldExit(true); } catch (e) {} })()`);
    result.pageerrors = pageerrors;
  } catch (e) {
    result = { ok: false, fatal: String(e && e.message || e), pageerrors };
  } finally {
    writeFileSync(join(OUT, 'probe-vicksburg.json'), JSON.stringify(result, null, 2));
    printResult(result);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  if (!result.ok || result.fatal || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
