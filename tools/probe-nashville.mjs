#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-nashville.mjs - D335 playable Nashville.
// Verifies Nashville's two-phase T8 scenario, D334 source/rank/terrain/USCT
// traps, D74 no-fudge wall, registry/menu integration, deterministic resolution,
// and direction guards for Thomas breaking Hood's army.
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
function killChild(child) { if (!child) return; try { child.kill(); } catch(e) {} }
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
function printResult(result) {
  console.log('probe-nashville ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
    else console.log('  ok   ' + s.name.slice(0, 68) + ' :: ' + JSON.stringify(s.v));
  }
}

const SETUP = `(() => {
  var R = { ok:true, steps:[], errors:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message || ev.error || ev)); });
  function isNum(n) { return typeof n === 'number' && isFinite(n); }
  function txt(o) { var s = ''; try { s = JSON.stringify(o); } catch(e) {} return String(s || '').toLowerCase(); }
  function allUnitsPhase(p) { return ((p.oob && p.oob.US) || []).concat((p.oob && p.oob.CS) || []).concat(p.reinforcements || []); }
  function sideOf(p, u) {
    if (u.side) return u.side;
    if (p.oob && p.oob.US && p.oob.US.indexOf(u) >= 0) return 'US';
    if (p.oob && p.oob.CS && p.oob.CS.indexOf(u) >= 0) return 'CS';
    return null;
  }
  function phaseTotal(p, side) {
    var n = 0, units = allUnitsPhase(p);
    for (var i = 0; i < units.length; i++) if (sideOf(p, units[i]) === side) n += units[i].men || 0;
    return n;
  }
  function keyScan(obj, path, bad) {
    if (!obj || typeof obj !== 'object') return;
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var p = path ? path + '.' + k : k;
      if (/^(damage|dmg|fireScale|fireMult|fireMultiplier|killScale|killMult|casualtyMult|lossMult|combatScale|battleDamage|battleFire|powerMult|scoreBonus|forceWin|winnerFudge)$/i.test(k)) bad.push(p);
      keyScan(obj[k], p, bad);
    }
  }
  function liveStrength(side) {
    var c = 0; for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === side && u.alive) c += u.men; }
    return Math.round(c);
  }
  function nanScan() {
    for (var i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i];
      if (!isNum(u.x) || !isNum(u.z) || !isNum(u.men) || !isNum(u.morale) || !isNum(u.facing) || !isNum(u.fatigue) || !isNum(u.ammo)) return u.id;
    }
    return null;
  }
  function runNashville(opts) {
    opts = opts || {};
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    delete G.settings.tacticalFog;
    fldLaunchSandbox({ renderer:'none', scenario:'nashville', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 100000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    return {
      w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n,
      idx:__FIELD.phaseIdx, score:__FIELD.phaseScore, cas:__FIELD.battleCas,
      us:liveStrength('US'), cs:liveStrength('CS'),
      log:(__FIELD.phaseLog || []).map(function(e){ return { name:e.name, w:e.winner, by:e.winBy, us:e.usCas, cs:e.csCas }; })
    };
  }

  var DATA = null;
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof __FIELD === 'undefined' || typeof _fldScenarioInitPhased !== 'function')
      return JSON.stringify({ ok:false, fatal:'__FIELD engine / registry / T8 seam missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    DATA = (GAME_DATA && GAME_DATA.nashville) ? GAME_DATA.nashville.nashville : null;

    step('DATA present and registered: Nashville is two-phase T8, US attacker / CS defender, fog OFF, after Franklin', function() {
      var reg = fldScenarioRegistry();
      if (!DATA) throw new Error('GAME_DATA.nashville.nashville missing');
      if (!reg.nashville) throw new Error('nashville missing from registry');
      if (DATA.attacker !== 'US' || DATA.defender !== 'CS') throw new Error('top-level roles wrong: ' + DATA.attacker + '/' + DATA.defender);
      if (DATA.defaultFog !== false) throw new Error('defaultFog must be false');
      if (!DATA.phases || DATA.phases.length !== 2) throw new Error('want 2 phases, got ' + (DATA.phases && DATA.phases.length));
      var names = DATA.phases.map(function(p){ return p.name; }).join(' | ');
      if (names.indexOf('Redoubts') < 0 || names.indexOf("Shy's Hill") < 0 || names.indexOf('Peach Orchard') < 0) throw new Error('phase names wrong: ' + names);
      var weights = DATA.phases.map(function(p){ return p.scoreWeight || 1; });
      if (weights[0] !== 1 || weights[1] !== 3) throw new Error('weights must be 1+3, got ' + weights.join('+'));
      var order = fldScenarioMenuOrder(reg);
      if (order.indexOf('nashville') !== order.indexOf('franklin') + 1) throw new Error('menu order not after Franklin: ' + order.join(' -> '));
      return { order:order, names:names, weights:weights };
    });

    step('CONTENT TEETH: landmarks and teaching cover redoubts, Montgomery Hill, Shy\\'s Hill, Peach Orchard/Overton, pikes, USCT, Wilson, Spring Hill, and Franklin separation', function() {
      var body = txt(DATA);
      var terms = ['redoubts #1-#5', 'redoubt no. 1', 'montgomery hill', "shy's hill", 'compton', 'peach orchard hill', 'overton hill', 'granny white pike', 'franklin pike', 'nashville & chattanooga railroad', 'travellers rest', '12th, 13th, and 100th usct', '18th usct', 'wilson pressure', 'spring hill', 'franklin'];
      var missing = [];
      for (var i = 0; i < terms.length; i++) if (body.indexOf(terms[i]) < 0) missing.push(terms[i]);
      if (missing.length) throw new Error('missing terms: ' + missing.join(', '));
      if (!DATA.teaching || !DATA.teaching.cards || DATA.teaching.cards.length < 5) throw new Error('expected at least 5 teaching cards');
      return { terms:terms.length, cards:DATA.teaching.cards.length, codex:DATA.teaching.codex && DATA.teaching.codex.id };
    });

    step('RANK/OOB TRAPS: Thomas, A. J. Smith, Schofield, Wilson, Steedman, McArthur, Wood, Hood, Lee, Stewart, Cheatham, Bate, Shy, and Forrest are guarded', function() {
      var body = txt(DATA);
      ['maj. gen. george h. thomas', 'maj. gen. andrew j. smith', 'brig. gen. john mcarthur', 'brig. gen. thomas j. wood', 'maj. gen. john m. schofield', 'maj. gen. james h. wilson', 'maj. gen. james b. steedman', 'col. charles r. thompson', 'gen. john bell hood (temporary grade)', 'permanent grade lieutenant general', 'lt. gen. stephen d. lee', 'lt. gen. alexander p. stewart', 'maj. gen. benjamin f. cheatham', 'maj. gen. william b. bate', 'col. william l. shy', 'not a general', 'forrest was detached'].forEach(function(term) {
        if (body.indexOf(term) < 0) throw new Error('missing rank/nuance trap ' + term);
      });
      ['maj. gen. thomas j. wood', 'lt. gen. benjamin f. cheatham', 'brig. gen. william l. shy', 'gen. william l. shy', 'forrest cavalry on the map'].forEach(function(term) {
        if (body.indexOf(term) >= 0) throw new Error('anachronistic/forbidden trap leaked: ' + term);
      });
      return { rankTeeth:true };
    });

    step('OOB STRENGTH HONESTY: compact phase strengths do not literalize 85,000 / 55,000 and inferred labels are present', function() {
      var body = txt(DATA);
      if (body.indexOf('85000') >= 0 || body.indexOf('55000') >= 0) throw new Error('literal broad force total leaked without comma guard');
      var p0us = phaseTotal(DATA.phases[0], 'US'), p0cs = phaseTotal(DATA.phases[0], 'CS');
      var p1us = phaseTotal(DATA.phases[1], 'US'), p1cs = phaseTotal(DATA.phases[1], 'CS');
      if (p0us >= 85000 || p0cs >= 55000 || p1us >= 85000 || p1cs >= 55000) throw new Error('phase totals literalize broad force figures');
      if (!(p0us > p0cs && p1us > p1cs)) throw new Error('Union should be stronger in both compact phases: ' + p0us + '/' + p0cs + ' and ' + p1us + '/' + p1cs);
      var inferred = 0;
      for (var p = 0; p < DATA.phases.length; p++) {
        var units = allUnitsPhase(DATA.phases[p]);
        for (var i = 0; i < units.length; i++) if (/Inferred strength/i.test(units[i].note || '')) inferred++;
      }
      if (inferred < 12) throw new Error('inferred-strength labels too thin: ' + inferred);
      return { phase0:{ US:p0us, CS:p0cs }, phase1:{ US:p1us, CS:p1cs }, inferred:inferred };
    });

    step('D74 NO-FUDGE: artillery carries gun counts and data has no battle-specific combat/result keys', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden combat/result keys found: ' + bad.join(', '));
      var arts = [], totalGuns = 0;
      for (var p = 0; p < DATA.phases.length; p++) {
        var units = allUnitsPhase(DATA.phases[p]);
        for (var i = 0; i < units.length; i++) if (units[i].arm === 'art') arts.push(units[i]);
      }
      if (arts.length < 4) throw new Error('expected at least 4 artillery entries, got ' + arts.length);
      for (var j = 0; j < arts.length; j++) {
        var a = arts[j];
        if (!(a.guns > 0)) throw new Error(a.id + ' missing gun count');
        if (!(a.men > 0 && a.men <= a.guns * 40)) throw new Error(a.id + ' crew/gun ratio suspicious: ' + a.men + '/' + a.guns);
        totalGuns += a.guns;
      }
      return { batteries:arts.length, totalGuns:totalGuns };
    });

    step('MULTI-PHASE LAUNCH: phase 0 builds redoubts/Montgomery Hill OOB/objective and zeroes running tally', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'nashville', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'nashville') throw new Error('scenario not set: ' + __FIELD.scenario);
      if (__FIELD.attacker !== 'US' || __FIELD.defender !== 'CS') throw new Error('launch roles wrong: ' + __FIELD.attacker + '/' + __FIELD.defender);
      if (!__FIELD.phases || __FIELD.phases.length !== 2) throw new Error('phases not initialized');
      if (__FIELD.phaseIdx !== 0) throw new Error('phaseIdx not 0: ' + __FIELD.phaseIdx);
      if (!__FIELD.phaseScore || __FIELD.phaseScore.US !== 0 || __FIELD.phaseScore.CS !== 0) throw new Error('phaseScore not zeroed');
      if (!__FIELD.objective || __FIELD.objective.name.indexOf('Redoubt') < 0) throw new Error('phase-0 objective wrong: ' + (__FIELD.objective && __FIELD.objective.name));
      if (__FIELD.units.length !== DATA.phases[0].oob.US.length + DATA.phases[0].oob.CS.length) throw new Error('phase-0 unit count wrong: ' + __FIELD.units.length);
      fldSimStep(0.05);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { phases:__FIELD.phases.length, units:__FIELD.units.length, objective:__FIELD.objective.name };
    });

    step('PER-PHASE COMMANDERS: P0 Thomas/AJ Smith/Wilson/Schofield/Hood/Stewart/Cheatham; P1 McArthur/Steedman/Thompson/S. D. Lee/Stewart/Cheatham/Bate/Shy', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'nashville', autoBoth:true, seed:1 });
      function leaderIds() { var L = __FIELD.leaders || [], o = []; for (var i = 0; i < L.length; i++) o.push(L[i].id); return o.join(','); }
      var p0 = leaderIds();
      ['ld_thomas_r', 'ld_ajsmith_r', 'ld_wilson_r', 'ld_schofield_r', 'ld_hood_r', 'ld_stewart_r', 'ld_cheatham_r'].forEach(function(id) {
        if (p0.indexOf(id) < 0) throw new Error('phase-0 missing leader ' + id + ': ' + p0);
      });
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      var p1 = leaderIds();
      ['ld_thomas_s', 'ld_mcarthur_s', 'ld_ajsmith_s', 'ld_wilson_s', 'ld_steedman_s', 'ld_thompson_s', 'ld_slee_s', 'ld_stewart_s', 'ld_cheatham_s', 'ld_bate_s', 'ld_shy_s'].forEach(function(id) {
        if (p1.indexOf(id) < 0) throw new Error('phase-1 missing leader ' + id + ': ' + p1);
      });
      if (__FIELD.objective.name.indexOf("Shy's Hill") < 0) throw new Error('phase-1 objective wrong: ' + __FIELD.objective.name);
      return { p0:p0, p1:p1 };
    });

    step('THE BATTLE ADVANCES through both phases headlessly, phaseLog in order, aggregate winner by phases, no NaN', function() {
      var r = runNashville({ autoBoth:true, seed:7 });
      if (__FIELD.phase !== 'over') throw new Error('battle did not end, phase=' + __FIELD.phase);
      if (r.log.length !== 2) throw new Error('not both phases resolved: ' + r.log.length);
      if (r.by !== 'phases') throw new Error('winBy not phases: ' + r.by);
      if (r.log[0].name.indexOf('Redoubts') < 0 || r.log[1].name.indexOf("Shy's Hill") < 0) throw new Error('phase order wrong: ' + r.log.map(function(e){ return e.name; }).join('/'));
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      var sumScore = r.score.US + r.score.CS;
      if (sumScore < 3.99 || sumScore > 4.01) throw new Error('phase score does not sum to 4.0: ' + sumScore);
      return { winner:r.w, winBy:r.by, phases:r.log.length, score:r.score, steps:r.steps };
    });

    step('HISTORICAL PATTERN (shared model, 8 seeds): US wins aggregate majority and CS aggregate losses exceed US in majority', function() {
      var seeds = [1, 7, 21, 33, 49, 101, 202, 303], usAgg = 0, csHigherLoss = 0, phase1US = 0, phase2US = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runNashville({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over') throw new Error('seed ' + seeds[i] + ' did not finish: ' + JSON.stringify(r));
        if (r.w === 'US') usAgg++;
        if (r.log[0] && r.log[0].w === 'US') phase1US++;
        if (r.log[1] && r.log[1].w === 'US') phase2US++;
        var usLoss = r.cas.US || 0, csLoss = r.cas.CS || 0;
        if (csLoss > usLoss) csHigherLoss++;
        samples.push(seeds[i] + ':' + r.log.map(function(e){ return e.w; }).join('/') + '=' + r.w + '/' + Math.round(usLoss) + '-' + Math.round(csLoss));
      }
      if (usAgg < 5) throw new Error('US should win aggregate majority, got ' + usAgg + '/8 :: ' + samples.join(', '));
      if (phase2US < 5) throw new Error('US should usually win decisive Shy\\'s Hill phase, got ' + phase2US + '/8 :: ' + samples.join(', '));
      if (csHigherLoss < 5) throw new Error('CS losses should exceed US in majority, got ' + csHigherLoss + '/8 :: ' + samples.join(', '));
      return { usAggregate:usAgg + '/8', redoubtsUS:phase1US + '/8', shysHillUS:phase2US + '/8', csHigherLoss:csHigherLoss + '/8', sample:samples.slice(0, 4) };
    });

    step('DETERMINISM: same seed -> identical Nashville result', function() {
      var a = runNashville({ autoBoth:true, seed:909 });
      var b = runNashville({ autoBoth:true, seed:909 });
      if (a.w !== b.w || a.by !== b.by || a.steps !== b.steps || JSON.stringify(a.score) !== JSON.stringify(b.score) || JSON.stringify(a.log) !== JSON.stringify(b.log))
        throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      return { winner:a.w, score:a.score, steps:a.steps, log:a.log.map(function(e){ return e.name + ':' + e.w; }) };
    });

    step('A US PLAYER AND A CS PLAYER both resolve the whole two-phase battle passively (no hang/NaN)', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        var r = runNashville({ playerSide:ps, seed:17, autoBoth:false, maxSteps:100000 });
        if (r.phase !== 'over') throw new Error(ps + ' passive battle did not terminate: ' + JSON.stringify(r));
        if (r.log.length !== 2) throw new Error(ps + ' passive battle did not play both phases: ' + r.log.length);
        if (['US', 'CS', 'draw'].indexOf(r.w) < 0) throw new Error(ps + ' bad winner: ' + r.w);
        var bad = nanScan(); if (bad) throw new Error(ps + ' NaN in ' + bad);
        out[ps] = { winner:r.w, phases:r.log.length, steps:r.steps };
      });
      return out;
    });

  } catch(e) {
    R.ok = false;
    R.errors.push('FATAL ' + String(e && e.message || e));
  }
  return JSON.stringify(R);
})()`;

const DOM = `(() => {
  var R = { ok:true, steps:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  try {
    G.settings = G.settings || {}; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    step('MENU: Nashville button injects once immediately after Franklin and opens side-choice cards', function() {
      if (typeof openMainMenu !== 'function') return { skipped:'no openMainMenu' };
      openMainMenu(); fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_nashville');
      if (!btn) throw new Error('Nashville button did not inject');
      if (!btn.getAttribute('aria-label')) throw new Error('Nashville button missing aria-label');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_nashville').length !== 1) throw new Error('duplicate Nashville buttons');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_franklin') >= 0 && ids.indexOf('fldScnBtn_nashville') === ids.indexOf('fldScnBtn_franklin') + 1)) throw new Error('Nashville not immediately after Franklin: ' + ids.join(' -> '));
      var got = null;
      fldScenarioSideChoice('nashville', function(s){ got = s; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('side choice expected 2 cards, got ' + cards.length);
      var us = document.querySelector('[data-brside="US"]');
      if (!us) throw new Error('US side card missing');
      us.click();
      if (got !== 'US') throw new Error('US side card returned ' + got);
      return { injected:true, orderIndex:ids.indexOf('fldScnBtn_nashville'), sideChoice:got };
    });
  } catch(e) {
    R.ok = false;
    R.fatal = String(e && e.message || e);
  }
  return JSON.stringify(R);
})()`;

async function main() {
  let server = null, browser = null;
  const url = 'http://127.0.0.1:' + cfg.port + '/civil_war_generals.html';
  const result = { ok: false, steps: [], pageerrors: [] };
  try {
    if (!(await up(url))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 50 && !(await up(url)); i++) await sleep(200);
    }
    browser = await chromium.launch({ headless: true, args: GL });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on('pageerror', e => result.pageerrors.push(String(e && e.message || e)));
    page.on('console', msg => {
      if (msg.type() === 'error') result.pageerrors.push('console: ' + msg.text());
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => typeof window.fldLaunchSandbox === 'function' && window.GAME_DATA && window.GAME_DATA.nashville, null, { timeout: 45000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = (setup.steps || []).concat(dom.steps || []);
    result.pageerrors = result.pageerrors.concat(setup.errors || []);
    if (dom.fatal) result.pageerrors.push('DOM fatal: ' + dom.fatal);
    result.ok = !!setup.ok && !!dom.ok && result.pageerrors.length === 0 && result.steps.every(s => s.ok);
  } catch (e) {
    result.fatal = String(e && e.message || e);
    result.ok = false;
  } finally {
    try { writeFileSync(join(OUT, 'probe-nashville.json'), JSON.stringify(result, null, 2)); } catch {}
    printResult(result);
    await closeBrowserHard(browser);
    killChild(server);
  }
  if (!result.ok) process.exit(1);
  console.log('ALL OK');
}

main();
