#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-franklin.mjs - D333 playable Franklin.
// Verifies Franklin's scenario contract, D332 source/rank/terrain traps, D74
// no-fudge wall, registry/menu integration, deterministic resolution, and
// direction guards for Hood's failed assault on the Carter House line.
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
  console.log('probe-franklin ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
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
  function allUnits(sd) { return ((sd.oob && sd.oob.US) || []).concat((sd.oob && sd.oob.CS) || []).concat(sd.reinforcements || []); }
  function sideTotal(side) {
    var n = 0, units = allUnits(DATA);
    for (var i = 0; i < units.length; i++) {
      var u = units[i], s = u.side || (DATA.oob && DATA.oob.US && DATA.oob.US.indexOf(u) >= 0 ? 'US' : null) || (DATA.oob && DATA.oob.CS && DATA.oob.CS.indexOf(u) >= 0 ? 'CS' : null);
      if (s === side) n += u.men || 0;
    }
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
  function runFranklin(opts) {
    opts = opts || {};
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    delete G.settings.tacticalFog;
    fldLaunchSandbox({ renderer:'none', scenario:'franklin', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 65000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    return {
      w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n, t:Math.round(__FIELD.t),
      us:liveStrength('US'), cs:liveStrength('CS'), cas:__FIELD.battleCas || null,
      hold:{ US:Math.round(__FIELD.holdSecs.US), CS:Math.round(__FIELD.holdSecs.CS) },
      scenario:__FIELD.scenario, objective:__FIELD.objective && __FIELD.objective.name
    };
  }

  var DATA = null, initUS = 0, initCS = 0;
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof __FIELD === 'undefined')
      return JSON.stringify({ ok:false, fatal:'__FIELD engine / registry missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    DATA = (GAME_DATA && GAME_DATA.franklin) ? GAME_DATA.franklin.franklin : null;
    initUS = DATA ? sideTotal('US') : 0;
    initCS = DATA ? sideTotal('CS') : 0;

    step('DATA present and registered: Franklin is single-phase, CS attacker / US defender, fog OFF, after Kennesaw', function() {
      var reg = fldScenarioRegistry();
      if (!DATA) throw new Error('GAME_DATA.franklin.franklin missing');
      if (!reg.franklin) throw new Error('franklin missing from registry');
      if (DATA.phases) throw new Error('Franklin must be single-phase, not phases[]');
      if (DATA.attacker !== 'CS' || DATA.defender !== 'US') throw new Error('roles wrong: ' + DATA.attacker + '/' + DATA.defender);
      if (DATA.defaultFog !== false) throw new Error('defaultFog must be false');
      var order = fldScenarioMenuOrder(reg);
      if (order.indexOf('franklin') !== order.indexOf('kennesaw') + 1) throw new Error('menu order not after Kennesaw: ' + order.join(' -> '));
      return { order:order, usUnits:DATA.oob.US.length, csUnits:DATA.oob.CS.length };
    });

    step('CONTENT TEETH: landmarks and teaching cover Carter House, cotton gin, Columbia Pike, breastworks, Osage-orange abatis, Winstead Hill, Fort Granger, Harpeth, Wagner, Opdycke, Carnton, Spring Hill, and Nashville', function() {
      var body = txt(DATA);
      var terms = ['carter house', 'cotton gin', 'columbia pike', 'breastworks', 'osage-orange abatis', 'winstead hill', 'fort granger', 'harpeth', 'wagner', 'opdycke', 'carnton', 'spring hill', 'nashville'];
      var missing = [];
      for (var i = 0; i < terms.length; i++) if (body.indexOf(terms[i]) < 0) missing.push(terms[i]);
      if (missing.length) throw new Error('missing terms: ' + missing.join(', '));
      if (!DATA.teaching || !DATA.teaching.cards || DATA.teaching.cards.length < 4) throw new Error('expected at least 4 teaching cards');
      return { terms:terms.length, cards:DATA.teaching.cards.length, codex:DATA.teaching.codex && DATA.teaching.codex.id };
    });

    step('RANK/OOB TRAPS: battle-date ranks, Hood grade nuance, and six-general nuance are explicit', function() {
      var body = txt(DATA);
      ['gen. john bell hood (temporary grade)', 'permanent grade lieutenant general', 'maj. gen. john m. schofield', 'brig. gen. jacob d. cox', 'maj. gen. david s. stanley', 'brig. gen. george d. wagner', 'col. emerson opdycke', 'maj. gen. benjamin f. cheatham', 'maj. gen. patrick r. cleburne', 'maj. gen. john c. brown', 'lt. gen. alexander p. stewart', 'john c. carter', 'died december 10'].forEach(function(term) {
        if (body.indexOf(term) < 0) throw new Error('missing rank/nuance trap ' + term);
      });
      ['brig. gen. emerson opdycke', 'lt. gen. patrick r. cleburne', 'lt. gen. benjamin f. cheatham', 'maj. gen. jacob d. cox'].forEach(function(term) {
        if (body.indexOf(term) >= 0) throw new Error('anachronistic/forbidden rank leaked: ' + term);
      });
      return { rankTeeth:true };
    });

    step('OOB STRENGTH HONESTY: active CS assault force is near 18,000-20,000, not 33,000, with Inferred strength labels', function() {
      var body = txt(DATA);
      if (body.indexOf('33,000') >= 0 || body.indexOf('33000') >= 0) throw new Error('33,000 army-present figure leaked into runtime data');
      if (initCS < 18000 || initCS > 20000) throw new Error('CS active assault total outside D332 range: ' + initCS);
      var units = allUnits(DATA), inferred = 0;
      for (var i = 0; i < units.length; i++) if (/Inferred strength/i.test(units[i].note || '')) inferred++;
      if (inferred < 10) throw new Error('inferred-strength labels too thin: ' + inferred);
      return { initUS:initUS, initCS:initCS, inferred:inferred };
    });

    step('D74 NO-FUDGE: artillery carries gun counts and data has no battle-specific combat/result keys', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden combat/result keys found: ' + bad.join(', '));
      var arts = [], totalGuns = 0, units = allUnits(DATA);
      for (var i = 0; i < units.length; i++) if (units[i].arm === 'art') arts.push(units[i]);
      if (arts.length < 4) throw new Error('expected at least 4 artillery entries, got ' + arts.length);
      for (var j = 0; j < arts.length; j++) {
        var a = arts[j];
        if (!(a.guns > 0)) throw new Error(a.id + ' missing gun count');
        if (!(a.men > 0 && a.men <= a.guns * 40)) throw new Error(a.id + ' crew/gun ratio suspicious: ' + a.men + '/' + a.guns);
        totalGuns += a.guns;
      }
      return { batteries:arts.length, totalGuns:totalGuns };
    });

    step('LAUNCH: Franklin instantiates as single-phase, no phase machinery, correct objective, no Classic contamination, no NaN', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'franklin', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'franklin') throw new Error('scenario not set: ' + __FIELD.scenario);
      if (__FIELD.attacker !== 'CS' || __FIELD.defender !== 'US') throw new Error('launch roles wrong: ' + __FIELD.attacker + '/' + __FIELD.defender);
      if (__FIELD.phases !== null) throw new Error('single-phase scenario leaked phase machinery');
      if (!__FIELD.objective || __FIELD.objective.name.indexOf('Carter House') < 0) throw new Error('objective wrong: ' + (__FIELD.objective && __FIELD.objective.name));
      if (__FIELD.units.length !== DATA.oob.US.length + DATA.oob.CS.length) throw new Error('initial unit count wrong: ' + __FIELD.units.length);
      if (G.battle && G.battle.M) throw new Error('Franklin launch created Classic G.battle');
      fldSimStep(0.05);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { units:__FIELD.units.length, objective:__FIELD.objective.name, holdToWin:__FIELD.holdToWin, timeLimit:__FIELD.timeLimit };
    });

    step('HISTORICAL PATTERN (shared model, 8 seeds): US holds majority and CS casualties exceed US in majority', function() {
      var seeds = [1, 7, 21, 33, 49, 101, 202, 303], usWins = 0, csHigherLoss = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runFranklin({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over') throw new Error('seed ' + seeds[i] + ' did not finish: ' + JSON.stringify(r));
        if (r.w === 'US') usWins++;
        var usLoss = initUS - r.us, csLoss = initCS - r.cs;
        if (csLoss > usLoss) csHigherLoss++;
        samples.push(seeds[i] + ':' + r.w + '/' + Math.round(usLoss) + '-' + Math.round(csLoss) + '/' + r.by);
      }
      if (usWins < 5) throw new Error('US should hold majority, got ' + usWins + '/8 :: ' + samples.join(', '));
      if (csHigherLoss < 5) throw new Error('CS should lose more in majority, got ' + csHigherLoss + '/8 :: ' + samples.join(', '));
      return { usWins:usWins + '/8', csHigherLoss:csHigherLoss + '/8', sample:samples.slice(0, 4) };
    });

    step('DETERMINISM: same seed -> identical Franklin result', function() {
      var a = runFranklin({ autoBoth:true, seed:909 });
      var b = runFranklin({ autoBoth:true, seed:909 });
      if (a.w !== b.w || a.by !== b.by || a.steps !== b.steps || a.us !== b.us || a.cs !== b.cs || JSON.stringify(a.hold) !== JSON.stringify(b.hold))
        throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      return { winner:a.w, winBy:a.by, steps:a.steps, us:a.us, cs:a.cs };
    });

    step('A US PLAYER AND A CS PLAYER both resolve passively (no hang/NaN)', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        var r = runFranklin({ playerSide:ps, seed:17, autoBoth:false, maxSteps:65000 });
        if (r.phase !== 'over') throw new Error(ps + ' passive battle did not terminate: ' + JSON.stringify(r));
        if (['US', 'CS', 'draw'].indexOf(r.w) < 0) throw new Error(ps + ' bad winner: ' + r.w);
        var bad = nanScan(); if (bad) throw new Error(ps + ' NaN in ' + bad);
        out[ps] = { winner:r.w, by:r.by, steps:r.steps, us:r.us, cs:r.cs };
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
    step('MENU: Franklin button injects once immediately after Kennesaw and opens side-choice cards', function() {
      if (typeof openMainMenu !== 'function') return { skipped:'no openMainMenu' };
      openMainMenu(); fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_franklin');
      if (!btn) throw new Error('Franklin button did not inject');
      if (!btn.getAttribute('aria-label')) throw new Error('Franklin button missing aria-label');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_franklin').length !== 1) throw new Error('duplicate Franklin buttons');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_kennesaw') >= 0 && ids.indexOf('fldScnBtn_franklin') === ids.indexOf('fldScnBtn_kennesaw') + 1)) throw new Error('Franklin not immediately after Kennesaw: ' + ids.join(' -> '));
      var got = null;
      fldScenarioSideChoice('franklin', function(s){ got = s; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('side choice expected 2 cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]');
      if (!cs) throw new Error('CS side card missing');
      cs.click();
      if (got !== 'CS') throw new Error('CS side card returned ' + got);
      return { injected:true, orderIndex:ids.indexOf('fldScnBtn_franklin'), sideChoice:got };
    });
  } catch(e) {
    R.ok = false;
    R.fatal = String(e && e.message || e);
  }
  return JSON.stringify(R);
})()`;

async function main() {
  let server = null, browser = null;
  const probe = cfg.baseUrl + '/' + cfg.file;
  try {
    if (!(await up(probe))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 80; i++) { if (await up(probe)) break; await sleep(250); }
    }
    if (!(await up(probe))) throw new Error('server not reachable at ' + probe);
    browser = await chromium.launch({ headless: true, args: GL });
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });
    const pageerrors = [];
    page.on('pageerror', e => pageerrors.push(String(e.message || e)));
    page.on('console', msg => {
      if (msg.type() === 'error') pageerrors.push('console:' + msg.text());
    });
    await page.goto(probe, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => typeof fldLaunchSandbox === 'function' && typeof fldScenarioRegistry === 'function' && window.GAME_DATA, null, { timeout: 30000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    const steps = [...(setup.steps || []), ...(dom.steps || [])];
    const result = {
      ok: !!setup.ok && !!dom.ok && steps.every(s => s.ok) && pageerrors.length === 0,
      steps,
      pageerrors,
      errors: setup.errors || [],
      fatal: setup.fatal || dom.fatal || null
    };
    if ((setup.errors || []).length) result.ok = false;
    writeFileSync(join(OUT, 'probe-franklin.json'), JSON.stringify(result, null, 2));
    printResult(result);
    if (!result.ok) process.exitCode = 1;
  } catch (e) {
    const result = { ok:false, fatal:String(e && e.message || e), steps:[], pageerrors:[], errors:[] };
    writeFileSync(join(OUT, 'probe-franklin.json'), JSON.stringify(result, null, 2));
    printResult(result);
    process.exitCode = 1;
  } finally {
    await closeBrowserHard(browser);
    killChild(server);
  }
}

main();
