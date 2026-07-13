#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D378 playable Cross Keys / Port Republic. Binds the D377 two-field contract to
// T8: Cross Keys US attack / CS defense under cautious doctrine (w1), then Port
// Republic CS attack / US defense under standard doctrine (w3). The four
// source-derived vectors are phase-1 CS, phase-2 CS, aggregate CS, and phase-1
// US losses above CS losses. No phase-2 or aggregate casualty tooth exists.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { Script } from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, "shots.json"), "utf8"));
const GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--disable-dev-shm-usage"];
const SEEDS = [1, 7, 21, 33, 49, 101, 202, 303];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function up(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok || r.status === 200;
  } catch {
    return false;
  }
}
function killChild(child) {
  if (!child) return;
  try { child.kill(); } catch {}
}
async function closeBrowserHard(browser) {
  if (!browser) return;
  const proc = typeof browser.process === "function" ? browser.process() : null;
  let closed = false;
  try {
    await Promise.race([
      browser.close().then(() => { closed = true; }, () => { closed = true; }),
      sleep(2500)
    ]);
  } catch {}
  if (!closed && proc && !proc.killed) {
    try { proc.kill("SIGKILL"); } catch {}
  }
}
function printResult(result) {
  console.log("probe-cross-keys-port-republic ok=" + result.ok + " steps=" + (result.steps || []).length + " pageerrors=" + (result.pageerrors || []).length);
  if (result.fatal) console.log("  FATAL " + result.fatal);
  for (const s of (result.steps || [])) {
    if (s.ok) console.log("  ok   " + s.name.slice(0, 78) + " :: " + JSON.stringify(s.v).slice(0, 260));
    else console.log("  FAIL " + s.name + " :: " + s.err);
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
    var out = { US:0, CS:0, gunsUS:0, gunsCS:0, opening:((p.oob && p.oob.US) || []).length + ((p.oob && p.oob.CS) || []).length };
    phaseUnits(p).forEach(function(row){
      out[row.side] += row.u.men || 0;
      if (row.u.arm === 'art') out[row.side === 'US' ? 'gunsUS' : 'gunsCS'] += row.u.guns || 0;
    });
    return out;
  }
  function sourceUrls(value) {
    if (!Array.isArray(value)) return [];
    var seen = {}, out = [];
    value.forEach(function(u){ if (typeof u === 'string' && /^https?:/.test(u) && !seen[u]) { seen[u] = 1; out.push(u); } });
    return out;
  }
  function keyScan(obj, path, bad) {
    if (!obj || typeof obj !== 'object') return;
    var forbidden = {
      damage:1,dmg:1,damagemult:1,firepower:1,firepowermult:1,firescale:1,firemult:1,firemultiplier:1,
      killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossmult:1,combatscale:1,battledamage:1,
      battlefire:1,powermult:1,moralemult:1,routmult:1,capturemult:1,scorebonus:1,scoremult:1,winner:1,
      winoverride:1,victoryoverride:1,outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,valormult:1,
      heroism:1,geniusmult:1,speedmult:1,commitmentmult:1,flankmult:1
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
    fldLaunchSandbox({ renderer:'none', scenario:'crossKeysPortRepublic', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
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
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    DATA = GAME_DATA && GAME_DATA['cross-keys-port-republic'] ? GAME_DATA['cross-keys-port-republic'].crossKeysPortRepublic : null;

    check('DATA CONTRACT: two fields, role flip, fog off, cautious then standard, weights 1+3=4, source-bounded strengths/guns, exact provenance labels', function() {
      if (!DATA || DATA.id !== 'crossKeysPortRepublic') throw new Error('GAME_DATA["cross-keys-port-republic"].crossKeysPortRepublic missing');
      if (DATA.attacker !== 'US' || DATA.defender !== 'CS' || DATA.defaultFog !== false) throw new Error('top-level opening role/fog contract failed');
      if (!DATA.phases || DATA.phases.length !== 2) throw new Error('want exactly 2 phases, got ' + (DATA.phases && DATA.phases.length));
      var p0 = DATA.phases[0], p1 = DATA.phases[1];
      if (p0.name !== 'Cross Keys - Ewell Holds the Ridge' || p1.name !== 'Port Republic - The Coaling') throw new Error('phase names/order wrong');
      if (p0.attacker !== 'US' || p0.defender !== 'CS' || p0.defaultFog !== false || p0.assaultDoctrine !== 'cautious') throw new Error('phase-1 role/fog/doctrine wrong');
      if (p1.attacker !== 'CS' || p1.defender !== 'US' || p1.defaultFog !== false || p1.assaultDoctrine !== 'standard') throw new Error('phase-2 role/fog/doctrine wrong');
      if (!p0.homeEdge || p0.homeEdge.US !== 'low' || p0.homeEdge.CS !== 'high' || !p1.homeEdge || p1.homeEdge.US !== 'high' || p1.homeEdge.CS !== 'low') throw new Error('opposite phase home-edge maps missing');
      var weights = [p0.scoreWeight, p1.scoreWeight];
      if (weights[0] !== 1 || weights[1] !== 3 || weights[0] + weights[1] !== 4) throw new Error('weights must be 1+3=4: ' + weights.join('+'));
      var t0 = phaseTotals(p0), t1 = phaseTotals(p1);
      if (t0.CS < 5500 || t0.CS > 6100 || t0.US < 6000 || t0.US > 9500 || t0.US >= 11500) throw new Error('phase-1 strength out of bounds: ' + JSON.stringify(t0));
      if (t1.CS < 5700 || t1.CS > 6300 || t1.US < 3300 || t1.US > 3700) throw new Error('phase-2 strength out of bounds: ' + JSON.stringify(t1));
      if (t0.gunsUS < 8 || t0.gunsUS > 24 || t0.gunsCS < 8 || t0.gunsCS > 20) throw new Error('phase-1 gun envelope failed: ' + JSON.stringify(t0));
      if (t1.gunsUS < 6 || t1.gunsUS > 12 || t1.gunsCS < 6 || t1.gunsCS > 18) throw new Error('phase-2 gun envelope failed: ' + JSON.stringify(t1));
      if (t0.opening !== 7 || t1.opening !== 6) throw new Error('opening scene counts changed: ' + t0.opening + '/' + t1.opening);
      var labels = ['Verified identity; Inferred strength','Inferred grouping; Inferred committed strength','Verified emplacement; Unpinned battery identity; Inferred strength','Unpinned battery identity; Inferred guns and crew'];
      DATA.phases.forEach(function(p, pi){ phaseUnits(p).forEach(function(row){
        if (!row.side || !row.u.id) throw new Error('phase ' + pi + ' unit lacks side/id');
        if (!labels.some(function(label){ return String(row.u.note || '').indexOf(label) >= 0; })) throw new Error('unit lacks allowed provenance label: ' + row.u.id);
        if (row.u.arm === 'art' && (!(row.u.guns > 0) || !(row.u.men > 0))) throw new Error('artillery lacks positive guns/crew: ' + row.u.id);
      }); });
      return { phase1:t0, phase2:t1, weights:weights };
    });

    check('REGISTRY + MENU: combined tactical identity sits Bull Run -> Cross Keys / Port Republic -> Gaines Mill -> Malvern Hill', function() {
      var reg = fldScenarioRegistry(), order = fldScenarioMenuOrder(reg);
      if (!reg.crossKeysPortRepublic || reg.crossKeysPortRepublic !== DATA) throw new Error('registry identity missing');
      if (fldScenarioMenuRank('crossKeysPortRepublic') !== 12) throw new Error('menu rank must be 12');
      if (!(order.indexOf('bullrun1') + 1 === order.indexOf('crossKeysPortRepublic') && order.indexOf('crossKeysPortRepublic') + 1 === order.indexOf('gainesMill') && order.indexOf('gainesMill') + 1 === order.indexOf('malvernHill'))) throw new Error('chronology wrong: ' + order.join(' -> '));
      return { rank:12, order:order.indexOf('crossKeysPortRepublic') };
    });

    check('LANDMARKS + HOME EDGES: both sourced fields load, phase edges reverse, and no edge override leaks into sandbox', function() {
      var body = JSON.stringify(DATA);
      ['Mill Creek','Port Republic Road','Union Church',"Ewell's Ridge",'Trimble','The Coaling','Lewiston','Lewiston Lane','South Fork','North River bridge','wheat field'].forEach(function(t){ if (body.indexOf(t) < 0) throw new Error('landmark missing ' + t); });
      fldLaunchSandbox({ renderer:'none', scenario:'crossKeysPortRepublic', autoBoth:true, seed:3 });
      if (__FIELD.scenario !== 'crossKeysPortRepublic' || !__FIELD.phases || __FIELD.phases.length !== 2) throw new Error('registered phased launch missing');
      if (fldHomeEdgeZ('US') !== -60 || fldHomeEdgeZ('CS') !== FLD.FIELD_H + 60) throw new Error('phase-1 home edges wrong');
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      if (__FIELD.attacker !== 'CS' || __FIELD.defender !== 'US') throw new Error('phase roles did not flip');
      if (fldHomeEdgeZ('US') !== FLD.FIELD_H + 60 || fldHomeEdgeZ('CS') !== -60) throw new Error('phase-2 home edges wrong');
      fldLaunchSandbox({ renderer:'none', scenario:'sandbox', autoBoth:true, seed:3 });
      if (__FIELD.homeEdgeZ !== null) throw new Error('home-edge override leaked into sandbox');
      return { landmarks:11, phase1:'US low / CS high', phase2:'US high / CS low', leak:false };
    });

    check('RANK + NAME + ABSENCE LOCKS: seven battle-date grades, required coarse OOB, Unpinned Coaling battery, and Ashby absence hold', function() {
      var body = JSON.stringify(DATA);
      ['Maj. Gen. Thomas J. Jackson','Maj. Gen. Richard S. Ewell','Maj. Gen. John C. Fremont','Brig. Gen. Erastus B. Tyler','Col. Samuel S. Carroll','Brig. Gen. Richard Taylor','Brig. Gen. Charles S. Winder',"Taylor's Louisiana Brigade","Winder's Brigade","Tyler's Brigade","Carroll's Command",'Union Artillery at The Coaling'].forEach(function(name){ if (body.indexOf(name) < 0) throw new Error('missing exact rank/OOB string ' + name); });
      ['Lt. Gen. Thomas J. Jackson','Brig. Gen. Richard S. Ewell','Brig. Gen. John C. Fremont','Maj. Gen. Erastus B. Tyler','Brig. Gen. Samuel S. Carroll','Maj. Gen. Samuel S. Carroll','Maj. Gen. Richard Taylor','Maj. Gen. Charles S. Winder','7th Louisiana','9th Louisiana'].forEach(function(name){ if (body.indexOf(name) >= 0) throw new Error('forbidden rank or unpinned OOB string ' + name); });
      var fielded = JSON.stringify(DATA.phases.map(function(p){ return phaseUnits(p).map(function(row){ return row.u; }); }));
      if (/Ashby/i.test(fielded)) throw new Error('Turner Ashby is fielded after his June 6 death');
      return { ranks:7, requiredOob:5, ashby:'absent', coalingBattery:'Unpinned' };
    });

    check('D74 NO-FUDGE: no scenario-specific combat, casualty, commitment, flank, genius, speed, winner, or score control exists', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden keys: ' + bad.join(', '));
      return { forbidden:0 };
    });

    check('LAUNCH: both fields initialize their role, objective, opposite edges, and one source-honest arrival exactly once without NaN', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'crossKeysPortRepublic', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'crossKeysPortRepublic' || __FIELD.attacker !== 'US' || __FIELD.defender !== 'CS' || __FIELD.fog !== false) throw new Error('phase-1 launch roles/fog wrong');
      if (__FIELD.objective.name.indexOf("Ewell's Ridge") < 0 || __FIELD.units.length !== 7 || !__FIELD.reinforce || __FIELD.reinforce.length !== 1) throw new Error('phase-1 objective/opening/schedule wrong');
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      if (__FIELD.attacker !== 'CS' || __FIELD.defender !== 'US' || __FIELD.fog !== false || __FIELD.objective.name !== 'The Coaling') throw new Error('phase-2 launch contract wrong');
      var base = __FIELD.units.length, sched = __FIELD.reinforce.slice();
      if (base !== 6 || sched.length !== 1) throw new Error('phase-2 opening/schedule wrong: ' + base + '/' + sched.length);
      __FIELD.phase = 'battle'; __FIELD.t = 99999; fldScenarioTick(0.05); fldScenarioTick(0.05);
      if (__FIELD.units.length !== base + 1) throw new Error('reinforcement duplicated or missing: ' + __FIELD.units.length);
      fldSimStep(0.05);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { p1units:7, p1arrival:'us_ckpr_reserve@85', p2units:base, p2arrival:sched[0].spec.id + '@' + sched[0].atSec };
    });

    check('SAME-SEED REPLAY: identical inputs produce an identical two-field result', function() {
      var a = runBattle({ autoBoth:true, seed:909 });
      var b = runBattle({ autoBoth:true, seed:909 });
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      if (a.phase !== 'over' || a.badUnit || a.log.length !== 2) throw new Error('replay did not resolve both fields cleanly: ' + JSON.stringify(a));
      return { winner:a.w, score:a.score, log:a.log };
    });

    check('PASSIVE US and PASSIVE CS: both no-input players reach a valid two-field end state without NaN', function() {
      var out = {};
      ['US','CS'].forEach(function(ps){
        var r = runBattle({ playerSide:ps, seed:17, autoBoth:false });
        if (r.phase !== 'over' || r.log.length !== 2 || ['US','CS','draw'].indexOf(r.w) < 0 || r.badUnit) throw new Error(ps + ' passive failed: ' + JSON.stringify(r));
        out[ps] = { winner:r.w, steps:r.steps };
      });
      return out;
    });

    check('HISTORICAL DIRECTION (8 seeds): P1 CS holds, P2 CS seizes, aggregate CS wins, and P1 US losses exceed CS losses; no other casualty direction is asserted', function() {
      var seeds = ${JSON.stringify(SEEDS)}, p1CS = 0, p2CS = 0, aggregateCS = 0, p1USBleeds = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over' || r.badUnit || r.log.length !== 2) throw new Error('seed ' + seeds[i] + ' did not resolve: ' + JSON.stringify(r));
        if (r.log[0].w === 'CS') p1CS++;
        if (r.log[1].w === 'CS') p2CS++;
        if (r.w === 'CS') aggregateCS++;
        if (r.log[0].us > r.log[0].cs) p1USBleeds++;
        samples.push(seeds[i] + ':' + r.log[0].w + '/' + r.log[1].w + '=' + r.w + ' phase-losses ' + r.log[0].us + '-' + r.log[0].cs + '/' + r.log[1].us + '-' + r.log[1].cs);
      }
      if (p1CS < 5) throw new Error('phase-1 CS holds below 5/8: ' + p1CS + ' :: ' + samples.join(', '));
      if (p2CS < 5) throw new Error('phase-2 CS seizes below 5/8: ' + p2CS + ' :: ' + samples.join(', '));
      if (aggregateCS < 5) throw new Error('aggregate CS wins below 5/8: ' + aggregateCS + ' :: ' + samples.join(', '));
      if (p1USBleeds < 5) throw new Error('phase-1 US-losses-exceed-CS below 5/8: ' + p1USBleeds + ' :: ' + samples.join(', '));
      return { phase1CS:p1CS + '/8', phase2CS:p2CS + '/8', aggregateCS:aggregateCS + '/8', phase1USBleeds:p1USBleeds + '/8', samples:samples };
    });

    check('TEACHING + WEATHER: seven exact-provenance cards and the codex keep operational limits, evidence gaps, and anti-Lost-Cause framing visible; haze stays presentation-only', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], codex = DATA.teaching && DATA.teaching.codex;
      if (cards.length < 6 || !codex) throw new Error('teaching/codex missing: ' + cards.length);
      cards.forEach(function(c){ if (sourceUrls(c.sources).length < 2 || ['Verified','Inferred','Disputed'].indexOf(String(c.provenance || '')) < 0) throw new Error('card source/provenance contract failed: ' + c.id); });
      var ids = cards.map(function(c){ return c.id; });
      ['vk_two_day_finale','vk_limited_commitment','vk_the_coaling','vk_three_armies_one_valley','vk_foot_cavalry_not_deified','vk_victorious_defeat'].forEach(function(id){ if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
      if (sourceUrls(codex.sources).length < 2 || ['Verified','Inferred','Disputed'].indexOf(String(codex.provenance || '')) < 0) throw new Error('codex source/provenance contract failed');
      if (!codex.axes || codex.axes.theater !== 'Eastern' || codex.axes.campaign !== 'Shenandoah Valley Campaign of 1862' || codex.axes.result !== 'Confederate victory') throw new Error('codex axes wrong');
      if (String(codex.summary || '').indexOf('objective-hold engine') < 0) throw new Error('codex operational-limit statement missing');
      var w = DATA.weather || {};
      if (w.sky !== 'haze' || w.time !== 'morning' || w.provenance !== 'Inferred' || sourceUrls(w.sources).length < 2 || DATA.defaultFog !== false || DATA.phases.some(function(p){ return p.defaultFog !== false; })) throw new Error('haze/morning/Inferred presentation contract failed');
      return { cards:ids, codex:codex.id, weather:{ sky:w.sky, time:w.time, provenance:w.provenance, tacticalFog:false } };
    });

    check('ARMY REGISTER PIN: 15 unique Cross Keys / Port Republic side-unit ids produce 45 cmd/nco/pvt rows and current total 1380', function() {
      var C = { side:'US', iron:false, idx:0, funds:6500, recovery:false, completed:[], roster:[], nextId:1,
        stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
      if (typeof _t1InitAll === 'function') _t1InitAll(C);
      var reg = ssPersonRegistry(C), rows = [], groups = {};
      if (reg.people.length !== 1380) throw new Error('Army Register total is ' + reg.people.length + ', expected 1380');   // D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D388: 1281 -> 1326 — Elkhorn Tavern adds 15 unique side-unit ids x 3 slots. D384: 1200 -> 1281 — Fort Donelson adds 27 units x 3 slots. D380: 1170 -> 1200 — Five Forks adds 10 unique units x 3 slots; Cross Keys / Port Republic's own 45-row teeth remain stable.
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:crossKeysPortRepublic:') === 0) rows.push(origin);
      }
      if (rows.length !== 45) throw new Error('Cross Keys / Port Republic rows are ' + rows.length + ', expected 45');
      rows.forEach(function(origin){
        var m = origin.match(/^ss:crossKeysPortRepublic:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Cross Keys / Port Republic slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var keys = Object.keys(groups);
      if (keys.length !== 15) throw new Error('unit groups are ' + keys.length + ', expected 15');
      keys.forEach(function(k){ if (!groups[k].cmd || !groups[k].nco || !groups[k].pvt) throw new Error('incomplete trio ' + k); });
      return { total:reg.people.length, scenarioRows:rows.length, units:keys.length };
    });

    check('SCOPE + DIGNITY: other Valley actions stay teaching-only and standing Fort Pillow / Leetown carve-outs remain absent', function() {
      var reg = fldScenarioRegistry(), keys = Object.keys(reg), combined = JSON.stringify(keys.map(function(k){ return (reg[k] || {}).name || ''; }));
      ['kernstown','mcdowell','frontRoyal','firstWinchester'].forEach(function(id){ if (keys.indexOf(id) >= 0) throw new Error('teaching-only Valley action registered: ' + id); });
      if (/fort pillow|leetown/i.test(combined) || keys.some(function(k){ return /pillow|leetown/i.test(k); })) throw new Error('standing dignity carve-out violated');
      return { valleyExtraPhases:0, fortPillow:false, leetown:false };
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
    check('MENU + SIDE CHOICE: one accessible combined button sits Bull Run -> Cross Keys / Port Republic -> Gaines Mill -> Malvern Hill; two side cards preserve CS through launch', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_crossKeysPortRepublic');
      if (!btn || !btn.getAttribute('aria-label')) throw new Error('accessible Cross Keys / Port Republic menu button missing');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_crossKeysPortRepublic').length !== 1) throw new Error('duplicate combined battle button');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldBullRunBtn') >= 0 && ids.indexOf('fldScnBtn_crossKeysPortRepublic') === ids.indexOf('fldBullRunBtn') + 1 && ids.indexOf('fldScnBtn_gainesMill') === ids.indexOf('fldScnBtn_crossKeysPortRepublic') + 1 && ids.indexOf('fldScnBtn_malvernHill') === ids.indexOf('fldScnBtn_gainesMill') + 1)) throw new Error('button chronology wrong: ' + ids.join(' -> '));
      var got = null; fldScenarioSideChoice('crossKeysPortRepublic', function(side){ got = side; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('wanted two side cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]');
      if (!cs) throw new Error('CS side card missing');
      cs.click();
      if (got !== 'CS') throw new Error('side choice returned ' + got);
      var captured = null, oldLaunch = window.fldLaunchSandbox, oldBrief = window.fldBullRunBriefing;
      try {
        window.fldLaunchSandbox = function(opts){ captured = opts; };
        window.fldBullRunBriefing = function(){};
        fldLaunchBattle('crossKeysPortRepublic', 'CS');
      } finally {
        window.fldLaunchSandbox = oldLaunch; window.fldBullRunBriefing = oldBrief;
      }
      if (!captured || captured.scenario !== 'crossKeysPortRepublic' || captured.playerSide !== 'CS' || captured.renderer !== '3d') throw new Error('fldLaunchBattle options wrong: ' + JSON.stringify(captured));
      return { button:btn.id, sideChoice:got };
    });
  } catch(e) { R.ok = false; R.fatal = String(e && e.message || e); }
  return JSON.stringify(R);
})()`;

function preparseCooked() {
  new Script(SETUP, { filename: "probe-cross-keys-port-republic-SETUP.js" });
  new Script(DOM, { filename: "probe-cross-keys-port-republic-DOM.js" });
}

async function main() {
  let server = null, browser = null;
  const url = cfg.baseUrl + "/" + cfg.file;
  const result = { ok:false, steps:[], pageerrors:[] };
  try {
    preparseCooked();
    result.steps.push({ name:"HARNESS PREPARSE: cooked SETUP and DOM compile before Chrome", ok:true, v:{ setup:true, dom:true } });
    const base = readFileSync(join(ROOT, "build", "base.html"), "utf8");
    const cross = Array.from(base.matchAll(/\{id:"crosskeys"/g)).length;
    const port = Array.from(base.matchAll(/\{id:"portrepublic"/g)).length;
    const rail = JSON.parse(readFileSync(join(ROOT, "data", "logistics-rail.json"), "utf8"));
    const railRoutes = Object.keys(rail.routes || {}).filter(key => /crosskeys|portrepublic|cross.?keys|port.?republic/i.test(key));
    const dignityFiles = readdirSync(join(ROOT, "data")).filter(f => /fort.?pillow|leetown/i.test(f));
    const classicOk = cross === 1 && port === 1 && railRoutes.length === 0 && dignityFiles.length === 0;
    result.steps.push({
      name:"CLASSIC + DIGNITY LAYERS: frozen crosskeys/portrepublic stay separate, no rail route or forbidden data file appears",
      ok:classicOk,
      v:{ classicRows:{ crosskeys:cross, portrepublic:port }, tacticalId:"crossKeysPortRepublic", railRoutes, dignityFiles }
    });
    if (!classicOk) throw new Error("Classic/dignity layer contract changed");
    if (!(await up(url))) {
      server = spawn("python3", ["-m", "http.server", String(cfg.port)], { cwd: ROOT, stdio:"ignore" });
      for (let i = 0; i < 80 && !(await up(url)); i++) await sleep(250);
    }
    if (!(await up(url))) throw new Error("server not reachable at " + url);
    browser = await chromium.launch({ headless:true, args:GL });
    const page = await browser.newPage({ viewport:{ width:1440, height:950 }, deviceScaleFactor:1 });
    page.on("pageerror", e => result.pageerrors.push(String(e && e.message || e)));
    page.on("console", msg => { if (msg.type() === "error") result.pageerrors.push("console: " + msg.text()); });
    await page.goto(url, { waitUntil:"domcontentloaded", timeout:45000 });
    await page.waitForFunction(() => typeof window.fldLaunchSandbox === "function" && typeof window.fldScenarioRegistry === "function" && window.GAME_DATA && window.GAME_DATA["cross-keys-port-republic"], null, { timeout:45000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = result.steps.concat(setup.steps || [], dom.steps || []);
    result.pageerrors = result.pageerrors.concat(setup.errors || []);
    if (setup.fatal) result.pageerrors.push("SETUP fatal: " + setup.fatal);
    if (dom.fatal) result.pageerrors.push("DOM fatal: " + dom.fatal);
    result.ok = !!setup.ok && !!dom.ok && result.steps.every(s => s.ok) && result.pageerrors.length === 0;
    try { await page.screenshot({ path:join(OUT, "probe-cross-keys-port-republic.png"), fullPage:false, timeout:5000 }); }
    catch (e) { result.screenshotWarning = String(e && e.message || e); }
  } catch(e) {
    result.fatal = String(e && e.message || e); result.ok = false;
  } finally {
    try { writeFileSync(join(OUT, "probe-cross-keys-port-republic.json"), JSON.stringify(result, null, 2)); } catch {}
    printResult(result);
    await closeBrowserHard(browser); killChild(server);
  }
  if (!result.ok) process.exit(1);
  console.log("ALL OK");
}

main();
