#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D366 playable Stones River. Binds the D365 contract to the live T8 engine:
// two real combat days (the Jan 1 lull is a teaching interstitial, never a phase),
// the near-parity law (the Union WON while bleeding MORE - no tooth may assert
// aggregate US < CS; the aggregate guard is the max/min <= 1.6 band), the phase-2
// direction-only CS>US guard, the lieutenant-general flip and the Sheridan/Hazen/
// Beatty rank traps, the D74 wall, and the current Army Register 1200 pin.
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
  console.log('probe-stones-river ok=' + result.ok + ' steps=' + (result.steps || []).length + ' pageerrors=' + (result.pageerrors || []).length);
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
    fldLaunchSandbox({ renderer:'none', scenario:'stonesRiver', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 120000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    return {
      w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n,
      score:__FIELD.phaseScore, cas:__FIELD.battleCas, badUnit:nanScan(),
      log:(__FIELD.phaseLog || []).map(function(e){ return { name:e.name, w:e.winner, us:Math.round(e.usCas), cs:Math.round(e.csCas) }; })
    };
  }

  var DATA = null;
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof _fldScenarioInitPhased !== 'function' || typeof ssPersonRegistry !== 'function')
      return JSON.stringify({ ok:false, fatal:'required tactical/T8/Army Register API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    DATA = GAME_DATA && GAME_DATA['stones-river'] ? GAME_DATA['stones-river'].stonesRiver : null;

    check('DATA CONTRACT: two real combat days (Jan 1 is never a phase), CS attacker / US defender, weights 3+1, sourced strength bounds, exact provenance labels', function() {
      if (!DATA || DATA.id !== 'stonesRiver') throw new Error('GAME_DATA["stones-river"].stonesRiver missing');
      if (DATA.attacker !== 'CS' || DATA.defender !== 'US' || DATA.defaultFog !== false) throw new Error('role/fog contract failed');
      if (!DATA.phases || DATA.phases.length !== 2) throw new Error('want 2 phases (the Jan 1 lull is a teaching interstitial, never a scored phase), got ' + (DATA.phases && DATA.phases.length));
      var names = DATA.phases.map(function(p){ return String(p.name || ''); });
      if (names[0].indexOf('December 31') < 0 || names[1].indexOf('January 2') < 0) throw new Error('phase names must carry December 31 then January 2: ' + names.join(' | '));
      var weights = DATA.phases.map(function(p){ return (typeof p.scoreWeight === 'number') ? p.scoreWeight : 1; });
      if (weights[0] !== 3 || weights[1] !== 1) throw new Error('weights must be 3+1 (the DECISIVE day carries the weight), got ' + weights.join('+'));
      DATA.phases.forEach(function(p){ if (p.attacker !== 'CS' || p.defender !== 'US' || p.defaultFog !== false) throw new Error('per-phase role/fog contract failed on ' + p.id); });
      var t0 = phaseTotals(DATA.phases[0]), t1 = phaseTotals(DATA.phases[1]);
      if (t0.US < 38000 || t0.US > 41400) throw new Error('phase-1 US total out of 38000-41400: ' + t0.US);
      if (t0.CS < 30000 || t0.CS > 35000) throw new Error('phase-1 CS total out of 30000-35000: ' + t0.CS);
      if (t0.gunsUS < 30 || t0.gunsUS > 60) throw new Error('phase-1 US guns out of the sourced 30-60: ' + t0.gunsUS);
      if (t0.gunsCS < 20 || t0.gunsCS > 50) throw new Error('phase-1 CS guns out of the sourced 20-50: ' + t0.gunsCS);
      if (t1.CS < 4200 || t1.CS > 5000) throw new Error('phase-2 CS total out of 4200-5000 (Breckinridge some 4,500): ' + t1.CS);
      if (t1.US < 7000 || t1.US > 11000) throw new Error('phase-2 US total out of 7000-11000: ' + t1.US);
      if (t1.gunsUS < 45 || t1.gunsUS > 58) throw new Error('phase-2 US gun mass out of the sourced 45-58 range (the RANGE is the tooth, never one exact count): ' + t1.gunsUS);
      if (t1.gunsCS > 12) throw new Error('phase-2 CS guns exceed the never-effectively-deployed 0-12: ' + t1.gunsCS);
      DATA.phases.forEach(function(p, pi) {
        phaseUnits(p).forEach(function(row) {
          if (String(row.u.note || '').indexOf('Verified identity; Inferred strength') < 0)
            throw new Error('unit lacks the exact strength-provenance label: ' + row.u.id + ' (phase ' + pi + ')');
        });
      });
      return { phase1:t0, phase2:t1 };
    });

    check('REGISTRY + MENU: Stones River sits after Shiloh and before Vicksburg in the Western arc (rank 52)', function() {
      var reg = fldScenarioRegistry(), order = fldScenarioMenuOrder(reg);
      if (!reg.stonesRiver || reg.stonesRiver !== DATA) throw new Error('registry identity missing');
      if (fldScenarioMenuRank('stonesRiver') !== 52) throw new Error('menu rank must be 52, got ' + fldScenarioMenuRank('stonesRiver'));
      if (!(order.indexOf('shiloh') + 1 === order.indexOf('stonesRiver') && order.indexOf('stonesRiver') + 1 === order.indexOf('vicksburg'))) throw new Error('chronology wrong: ' + order.join(' -> '));
      return { rank:52, order:order.indexOf('stonesRiver') };
    });

    check('LANDMARKS + HOME EDGES: the sourced ground is on the field and routers flee toward their own rear; no sandbox leak', function() {
      var body = JSON.stringify(DATA);
      ['Nashville Pike', 'Round Forest', "Hell's Half Acre", 'Stones River', 'McFadden', 'Wilkinson Pike', 'the Cedars', 'Slaughter Pen', 'cotton field'].forEach(function(t){
        if (body.indexOf(t) < 0) throw new Error('landmark tooth missing ' + t);
      });
      fldLaunchSandbox({ renderer:'none', scenario:'stonesRiver', autoBoth:true, seed:3 });
      if (fldHomeEdgeZ('US') !== -60 || fldHomeEdgeZ('CS') !== FLD.FIELD_H + 60) throw new Error('home edges wrong (US rear is the Nashville side, LOW z): ' + fldHomeEdgeZ('US') + '/' + fldHomeEdgeZ('CS'));
      fldLaunchSandbox({ renderer:'none', scenario:'sandbox', autoBoth:true, seed:3 });
      if (__FIELD.homeEdgeZ !== null) throw new Error('home-edge override leaked into sandbox');
      return { leak:false, landmarks:9 };
    });

    check('RANK + NAME LOCKS: battle-date grades hold (the Polk/Hardee lieutenant-general flip, Sheridan the brigadier, Hazen and Beatty the colonels) and forbidden renderings are absent', function() {
      var body = JSON.stringify(DATA);
      ['Maj. Gen. William S. Rosecrans', 'Gen. Braxton Bragg', 'Lt. Gen. Leonidas Polk', 'Lt. Gen. William J. Hardee',
       'Maj. Gen. John C. Breckinridge', 'Maj. Gen. Patrick R. Cleburne', 'Brig. Gen. Philip H. Sheridan',
       'Col. William B. Hazen', 'Col. Samuel Beatty', 'Brig. Gen. Roger W. Hanson', 'Capt. John Mendenhall',
       'Maj. Gen. George H. Thomas', 'Brig. Gen. Gideon J. Pillow', 'Col. Randall L. Gibson', 'Brig. Gen. William Preston',
       'Lt. Col. Julius P. Garesch'].forEach(function(name){
        if (body.indexOf(name) < 0) throw new Error('missing exact name/rank ' + name);
      });
      [/Maj\\. Gen\\. Philip H\\. Sheridan/, /Brig\\. Gen\\. William B\\. Hazen/, /Maj\\. Gen\\. Leonidas Polk/,
       /Maj\\. Gen\\. William J\\. Hardee/, /Lt\\. Gen\\. John C\\. Breckinridge/, /Brig\\. Gen\\. Patrick R\\. Cleburne/,
       /Lt\\. Gen\\. Braxton Bragg/, /Maj\\. Gen\\. James S\\. Negley/, /Robert W\\. Hanson/, /Gen\\. Samuel Beatty/,
       /four Confederate generals/i, /personal Bible/i, /Garfield/].forEach(function(re){
        if (re.test(body)) throw new Error('forbidden rendering leaked: ' + re);
      });
      return { locks:16, rejections:13 };
    });

    check('D74 NO-FUDGE: no battle-specific combat/result/parity key at any depth (incl. valorMult/heroism); artillery uses the universal gun model', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden keys: ' + bad.join(', '));
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){
        if (row.u.arm === 'art' && (!(row.u.guns > 0) || !(row.u.men > 0))) throw new Error('artillery gun/crew missing on ' + row.u.id);
      }); });
      return { forbidden:0 };
    });

    check('LAUNCH: phase machinery initializes both days, reinforcements schedule and arrive once, no NaN', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'stonesRiver', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'stonesRiver' || __FIELD.attacker !== 'CS' || __FIELD.defender !== 'US') throw new Error('launch roles wrong');
      if (!__FIELD.phases || __FIELD.phases.length !== 2 || __FIELD.phaseIdx !== 0) throw new Error('phases not initialized');
      if (__FIELD.objective.name.indexOf('Round Forest') < 0) throw new Error('phase-1 objective wrong: ' + __FIELD.objective.name);
      if (__FIELD.units.length !== 16) throw new Error('phase-1 opening unit count wrong (want 16, at or under the Kennesaw 17 crown): ' + __FIELD.units.length);
      if (!__FIELD.reinforce || __FIELD.reinforce.length !== 2) throw new Error('phase-1 should schedule exactly the two Breckinridge crossings: ' + (__FIELD.reinforce && __FIELD.reinforce.length));
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      if (__FIELD.objective.name.indexOf("McFadden") < 0) throw new Error('phase-2 objective wrong: ' + __FIELD.objective.name);
      var base = __FIELD.units.length, sched = __FIELD.reinforce.slice();
      if (base !== 7 || sched.length !== 1) throw new Error('phase-2 opening/schedule wrong: ' + base + '/' + sched.length);
      __FIELD.phase = 'battle'; __FIELD.t = 99999; fldScenarioTick(0.05); fldScenarioTick(0.05);
      if (__FIELD.units.length !== base + 1) throw new Error('reinforcements duplicated or missing: ' + __FIELD.units.length);
      fldSimStep(0.05);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { p1units:16, p2units:base, arrivals:sched.map(function(x){ return x.spec.id + '@' + x.atSec; }) };
    });

    check('SAME-SEED REPLAY: identical inputs produce an identical two-day battle', function() {
      var a = runBattle({ autoBoth:true, seed:909 });
      var b = runBattle({ autoBoth:true, seed:909 });
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      if (a.phase !== 'over' || a.badUnit) throw new Error('replay did not resolve cleanly');
      return { winner:a.w, score:a.score, log:a.log };
    });

    check('PASSIVE US and PASSIVE CS: both no-input players reach a valid end state through both days', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        var r = runBattle({ playerSide:ps, seed:17, autoBoth:false });
        if (r.phase !== 'over' || r.log.length !== 2 || ['US','CS','draw'].indexOf(r.w) < 0 || r.badUnit) throw new Error(ps + ' passive failed: ' + JSON.stringify(r));
        out[ps] = { winner:r.w, steps:r.steps };
      });
      return out;
    });

    check('HISTORICAL DIRECTION (8 seeds): US holds both days, the Jan-2 repulse costs CS more (direction only), US wins the aggregate - under the NEAR-PARITY band, never a US<CS tooth', function() {
      var seeds = ${JSON.stringify(SEEDS)}, p1us = 0, p2us = 0, p2csBleeds = 0, usAgg = 0, nearParity = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over' || r.badUnit) throw new Error('seed ' + seeds[i] + ' did not resolve: ' + JSON.stringify(r));
        if (r.log[0] && r.log[0].w === 'US') p1us++;
        if (r.log[1] && r.log[1].w === 'US') p2us++;
        if (r.log[1] && r.log[1].cs > r.log[1].us) p2csBleeds++;
        if (r.w === 'US') usAgg++;
        var totUS = (r.cas.US || 0), totCS = (r.cas.CS || 0);
        var ratio = Math.max(totUS, totCS) / Math.max(1, Math.min(totUS, totCS));
        if (ratio <= 1.6) nearParity++;
        samples.push(seeds[i] + ':' + r.log.map(function(e){ return e.w; }).join('/') + '=' + r.w + ' cas ' + Math.round(totUS) + '-' + Math.round(totCS) + ' r' + ratio.toFixed(2));
      }
      if (p1us < 5) throw new Error('phase-1 US holds below 5/8: ' + p1us + ' :: ' + samples.join(', '));
      if (p2us < 5) throw new Error('phase-2 US holds below 5/8: ' + p2us + ' :: ' + samples.join(', '));
      if (p2csBleeds < 5) throw new Error('phase-2 CS-losses-exceed-US below 5/8 (the ONE verified phase datum, direction only): ' + p2csBleeds + ' :: ' + samples.join(', '));
      if (usAgg < 5) throw new Error('aggregate US wins below 5/8: ' + usAgg + ' :: ' + samples.join(', '));
      if (nearParity < 5) throw new Error('NEAR-PARITY aggregate band (max/min <= 1.6) below 5/8 - the winner bled MORE here and forcing US < CS is forbidden: ' + nearParity + ' :: ' + samples.join(', '));
      return { phase1US:p1us + '/8', phase2US:p2us + '/8', phase2CSbleeds:p2csBleeds + '/8', aggregateUS:usAgg + '/8', nearParity:nearParity + '/8', samples:samples };
    });

    check('TEACHING: eight sourced cards incl. won-by-holding with Lincoln\\'s exact quote, the protest, the revolt, Garesch\\u00e9, and the Emancipation interstitial; Western codex with the near-parity cost note', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], codex = DATA.teaching && DATA.teaching.codex;
      if (cards.length < 7 || !codex) throw new Error('teaching/codex missing: ' + cards.length);
      cards.forEach(function(c) {
        var urls = (c.sources || []).filter(function(u){ return /^https?:/.test(u); });
        if (urls.length < 2) throw new Error('card lacks two source URLs: ' + c.id);
      });
      var ids = cards.map(function(c){ return c.id; });
      ['sr_won_by_holding', 'sr_dawn_breakfast', 'sr_hells_half_acre', 'sr_breckinridge_protest', 'sr_mendenhall', 'sr_garesche', 'sr_generals_revolt', 'sr_emancipation'].forEach(function(id){ if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
      var body = JSON.stringify(DATA);
      if (body.indexOf('you gave us a hard earned victory, which, had there been a defeat instead, the nation could scarcely have lived over') < 0) throw new Error('the Lincoln letter must be quoted exactly');
      if (body.indexOf('The Imitation of Christ') < 0) throw new Error('the Garesch\\u00e9 card must carry the Imitation of Christ correction');
      if ((codex.sources || []).filter(function(u){ return /^https?:/.test(u); }).length < 2) throw new Error('codex lacks two source URLs');
      if (!codex.axes || codex.axes.theater !== 'Western' || codex.axes.result !== 'Union victory') throw new Error('codex axes wrong');
      if (String(codex.axes.cost || '').toLowerCase().indexOf('near-parity') < 0) throw new Error('codex cost axis must carry the near-parity note');
      var w = DATA.weather || {};
      if (w.sky !== 'rain' || w.time !== 'dawn' || !/^(Verified|Inferred)$/.test(String(w.provenance || '')) || (w.sources || []).filter(function(u){ return /^https?:/.test(u); }).length < 2) throw new Error('weather must be rain/dawn (never snow) with exact provenance and two sources');
      return { cards:ids, codex:codex.id };
    });

    check('ARMY REGISTER PIN: 26 Stones River units produce exact cmd/nco/pvt trios and current total 1566', function() {
      var C = { side:'US', iron:false, idx:0, funds:6500, recovery:false, completed:[], roster:[], nextId:1,
        stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
      if (typeof _t1InitAll === 'function') _t1InitAll(C);
      var reg = ssPersonRegistry(C), rows = [], groups = {};
      if (reg.people.length !== 1566) throw new Error('Army Register total is ' + reg.people.length + ', expected 1566');   // D380: 1170 -> 1200 — Five Forks adds 10 unique units x 3 slots. D384: 1200 -> 1281 — Fort Donelson adds 27 units x 3 slots. D388: 1281 -> 1326 — Elkhorn Tavern adds 15 unique side-unit ids x 3 slots. D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D393: 1380 -> 1434 — Wilderness adds 18 unique side-unit ids x 3 slots. D397: 1434 -> 1512 — Petersburg initial assaults adds 26 unique side-unit ids x 3 slots; Stones River's own 78-row/26-unit teeth below remain stable. D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots.
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:stonesRiver:') === 0) rows.push(origin);
      }
      if (rows.length !== 78) throw new Error('Stones River rows are ' + rows.length + ', expected 78');
      rows.forEach(function(origin) {
        var m = origin.match(/^ss:stonesRiver:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Stones River slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var keys = Object.keys(groups);
      if (keys.length !== 26) throw new Error('Stones River unit groups are ' + keys.length + ', expected 26');
      keys.forEach(function(k){ if (!groups[k].cmd || !groups[k].nco || !groups[k].pvt) throw new Error('incomplete trio ' + k); });
      return { total:reg.people.length, srRows:rows.length, units:keys.length };
    });

    check('FORT PILLOW ABSENCE: the standing dignity guard holds - no playable massacre scenario in the registry', function() {
      var reg = fldScenarioRegistry(), keys = Object.keys(reg);
      if (keys.some(function(k){ return /pillow/i.test(k); })) throw new Error('Fort Pillow appears in the registry');
      var body = JSON.stringify(Object.keys(reg).map(function(k){ return (reg[k] || {}).name || ''; }));
      if (/fort pillow/i.test(body)) throw new Error('a registered scenario names Fort Pillow');
      return { playable:false };
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
    check('MENU + SIDE CHOICE: one accessible button between Shiloh and Vicksburg; the chosen side reaches fldLaunchBattle', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_stonesRiver');
      if (!btn || !btn.getAttribute('aria-label')) throw new Error('accessible Stones River menu button missing');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_stonesRiver').length !== 1) throw new Error('duplicate Stones River button');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_shiloh') >= 0 && ids.indexOf('fldScnBtn_stonesRiver') === ids.indexOf('fldScnBtn_shiloh') + 1 && ids.indexOf('fldScnBtn_vicksburg') === ids.indexOf('fldScnBtn_stonesRiver') + 1)) throw new Error('button chronology wrong: ' + ids.join(' -> '));
      var got = null; fldScenarioSideChoice('stonesRiver', function(side){ got = side; });
      var cards = document.querySelectorAll('[data-brside]'); if (cards.length !== 2) throw new Error('wanted two side cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]'); if (!cs) throw new Error('CS side card missing'); cs.click();
      if (got !== 'CS') throw new Error('side choice returned ' + got);
      var captured = null, oldLaunch = window.fldLaunchSandbox, oldBrief = window.fldBullRunBriefing;
      try {
        window.fldLaunchSandbox = function(opts){ captured = opts; };
        window.fldBullRunBriefing = function(){};
        fldLaunchBattle('stonesRiver', 'CS');
      } finally {
        window.fldLaunchSandbox = oldLaunch; window.fldBullRunBriefing = oldBrief;
      }
      if (!captured || captured.scenario !== 'stonesRiver' || captured.playerSide !== 'CS' || captured.renderer !== '3d') throw new Error('fldLaunchBattle options wrong: ' + JSON.stringify(captured));
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
    const rail = JSON.parse(readFileSync(join(ROOT, 'data', 'logistics-rail.json'), 'utf8'));
    if (!rail.routes || !rail.routes.stonesriver || rail.routes.stonesriver.theater !== 'W')
      throw new Error('the Classic-layer logistics-rail routes.stonesriver was renamed or altered - it is a SEPARATE frozen layer (the malvern/malvernHill precedent)');
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
    await page.waitForFunction(() => typeof window.fldLaunchSandbox === 'function' && typeof window.fldScenarioRegistry === 'function' && window.GAME_DATA && window.GAME_DATA['stones-river'], null, { timeout:45000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = (setup.steps || []).concat(dom.steps || []);
    result.pageerrors = result.pageerrors.concat(setup.errors || []);
    if (setup.fatal) result.pageerrors.push('SETUP fatal: ' + setup.fatal);
    if (dom.fatal) result.pageerrors.push('DOM fatal: ' + dom.fatal);
    result.ok = !!setup.ok && !!dom.ok && result.steps.every(s => s.ok) && result.pageerrors.length === 0;
    // Best-effort artifact capture (the probe-kennesaw heavy-scene pattern): after eleven full
    // 72k-man sim runs the page's font readiness can stall, and the screenshot is an artifact,
    // not a tooth - the 13 teeth + 0 pageerrors above are the acceptance gate.
    try { await page.screenshot({ path:join(OUT, 'probe-stones-river.png'), fullPage:false, timeout:5000 }); }
    catch (e) { result.screenshotWarning = String(e && e.message || e); }
  } catch(e) {
    result.fatal = String(e && e.message || e); result.ok = false;
  } finally {
    try { writeFileSync(join(OUT, 'probe-stones-river.json'), JSON.stringify(result, null, 2)); } catch {}
    printResult(result);
    await closeBrowserHard(browser); killChild(server);
  }
  if (!result.ok) process.exit(1);
  console.log('ALL OK');
}

main();
