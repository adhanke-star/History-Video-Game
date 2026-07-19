#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D376 playable Cedar Creek. Binds the D375 role-reversal contract to the live
// T8 engine: Gordon's CS dawn attack under fog (w1) -> Sheridan's clear-afternoon
// US counterattack (w3); side-keyed north/south home edges stay fixed. The casualty
// law is direction-neutral at aggregate: this probe carries ONLY the two phase-scoped
// D92 directions beside the three outcome guards. It never asserts either aggregate
// casualty direction. The Fatal Halt remains a two-primary dispute, pursuit prose is
// count-free, The Burning stays teaching-only, and the D74 wall includes plunder,
// straggle, blame, valorMult, and heroism.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";

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
  console.log("probe-cedar-creek ok=" + result.ok + " steps=" + (result.steps || []).length + " pageerrors=" + (result.pageerrors || []).length);
  if (result.fatal) console.log("  FATAL " + result.fatal);
  for (const s of (result.steps || [])) {
    if (s.ok) console.log("  ok   " + s.name.slice(0, 76) + " :: " + JSON.stringify(s.v).slice(0, 240));
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
      winoverride:1,victoryoverride:1,outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,valormult:1,heroism:1,
      scripteddeath:1,plunder:1,straggle:1,blame:1
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
    fldLaunchSandbox({ renderer:'none', scenario:'cedarCreek', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
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
    DATA = GAME_DATA && GAME_DATA['cedar-creek'] ? GAME_DATA['cedar-creek'].cedarCreek : null;

    check('DATA CONTRACT: two-phase role reversal, fog true then false, standard doctrine, weights 1+3=4, source-bounded strengths/guns, exact unit provenance', function() {
      if (!DATA || DATA.id !== 'cedarCreek') throw new Error('GAME_DATA["cedar-creek"].cedarCreek missing');
      if (DATA.attacker !== 'CS' || DATA.defender !== 'US' || DATA.defaultFog !== true) throw new Error('top-level opening role/fog contract failed');
      if (!DATA.phases || DATA.phases.length !== 2) throw new Error('want exactly 2 phases, got ' + (DATA.phases && DATA.phases.length));
      var p0 = DATA.phases[0], p1 = DATA.phases[1];
      if (String(p0.name || '').indexOf("Gordon's Dawn Assault") < 0 || String(p1.name || '').indexOf("Sheridan's Counterattack") < 0) throw new Error('phase names/order wrong');
      if (p0.attacker !== 'CS' || p0.defender !== 'US' || p0.defaultFog !== true || p0.assaultDoctrine !== 'standard') throw new Error('phase-1 role/fog/doctrine wrong');
      if (p1.attacker !== 'US' || p1.defender !== 'CS' || p1.defaultFog !== false || p1.assaultDoctrine !== 'standard') throw new Error('phase-2 role/fog/doctrine wrong');
      var weights = [p0.scoreWeight, p1.scoreWeight];
      if (weights[0] !== 1 || weights[1] !== 3 || weights[0] + weights[1] !== 4) throw new Error('weights must be 1+3=4, never 5: ' + weights.join('+'));
      var t0 = phaseTotals(p0), t1 = phaseTotals(p1);
      if (t0.CS < 12500 || t0.CS > 14500 || t0.US < 27000 || t0.US > 31610) throw new Error('phase-1 strength out of bounds: ' + JSON.stringify(t0));
      if (t1.US < 22000 || t1.US > 28500 || t1.CS < 13000 || t1.CS > 19000) throw new Error('phase-2 strength out of bounds: ' + JSON.stringify(t1));
      if (t0.gunsCS < 30 || t0.gunsCS > 48 || t0.gunsUS < 60 || t0.gunsUS > 90) throw new Error('phase-1 guns out of bounds: ' + JSON.stringify(t0));
      if (t1.gunsUS < 40 || t1.gunsUS > 90 || t1.gunsCS < 15 || t1.gunsCS > 48) throw new Error('phase-2 guns out of bounds: ' + JSON.stringify(t1));
      if (t0.opening !== 8 || t0.opening > 17) throw new Error('phase-1 opening scene must be 8 and stay at/below Kennesaw 17: ' + t0.opening);
      if (t1.opening !== 15) throw new Error('phase-2 opening scene must be 15: ' + t1.opening);
      DATA.phases.forEach(function(p, pi){
        phaseUnits(p).forEach(function(row){
          if (!row.side || !row.u.id) throw new Error('phase ' + pi + ' unit lacks side/id');
          if (String(row.u.note || '').indexOf('Verified identity; Inferred strength') < 0) throw new Error('unit lacks exact provenance label: ' + row.u.id + ' phase ' + pi);
          if (row.u.arm === 'art' && (!(row.u.guns > 0) || !(row.u.men > 0))) throw new Error('artillery lacks positive guns/crew: ' + row.u.id);
        });
      });
      return { phase1:t0, phase2:t1, weights:weights };
    });

    check('REGISTRY + MENU: Cedar Creek identity and rank 72 place it after Kennesaw and before Franklin', function() {
      var reg = fldScenarioRegistry(), order = fldScenarioMenuOrder(reg);
      if (!reg.cedarCreek || reg.cedarCreek !== DATA) throw new Error('registry identity missing');
      if (fldScenarioMenuRank('cedarCreek') !== 72) throw new Error('menu rank must be 72, got ' + fldScenarioMenuRank('cedarCreek'));
      if (!(order.indexOf('kennesaw') + 1 === order.indexOf('atlanta') && order.indexOf('atlanta') + 1 === order.indexOf('crater') && order.indexOf('crater') + 1 === order.indexOf('cedarCreek') && order.indexOf('cedarCreek') + 1 === order.indexOf('franklin'))) throw new Error('chronology wrong: ' + order.join(' -> '));   // D454 re-pin: D436 registered atlanta at rank 71 BETWEEN kennesaw 70 and cedarCreek 72 and updated this probe's DOM chronology tooth (line ~360) but MISSED this registry tooth (the reversed-form expression); re-pinned to the shipped chain on its first-ever run — the chain now guards Kennesaw -> Atlanta -> Cedar Creek -> Franklin. D469 re-pin: crater (rank 71.5) inserts between atlanta and cedarCreek per the D464 spec SS2 (LANE-015) — the chain is now Kennesaw -> Atlanta -> Crater -> Cedar Creek -> Franklin.
      return { rank:72, order:order.indexOf('cedarCreek') };
    });

    check('LANDMARKS + HOME EDGES: sourced ground is present; US north/low and CS south/high persist across the role reversal; no sandbox leak', function() {
      var body = JSON.stringify(DATA);
      ['Belle Grove', 'Valley Pike', 'Massanutten', 'Cedar Creek', 'Middletown', "Miller's Mill", "Hupp's Hill", "Bowman's Mill Ford"].forEach(function(t){
        if (body.indexOf(t) < 0) throw new Error('landmark tooth missing ' + t);
      });
      fldLaunchSandbox({ renderer:'none', scenario:'cedarCreek', autoBoth:true, seed:3 });
      if (__FIELD.scenario !== 'cedarCreek' || !__FIELD.phases || __FIELD.phases.length !== 2) throw new Error('registered phased launch missing');
      if (fldHomeEdgeZ('US') !== -60 || fldHomeEdgeZ('CS') !== FLD.FIELD_H + 60) throw new Error('phase-1 home edges wrong: ' + fldHomeEdgeZ('US') + '/' + fldHomeEdgeZ('CS'));
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      if (__FIELD.attacker !== 'US' || __FIELD.defender !== 'CS') throw new Error('roles did not reverse');
      if (fldHomeEdgeZ('US') !== -60 || fldHomeEdgeZ('CS') !== FLD.FIELD_H + 60) throw new Error('phase-2 home edges drifted: ' + fldHomeEdgeZ('US') + '/' + fldHomeEdgeZ('CS'));
      fldLaunchSandbox({ renderer:'none', scenario:'sandbox', autoBoth:true, seed:3 });
      if (__FIELD.homeEdgeZ !== null) throw new Error('home-edge override leaked into sandbox');
      return { landmarks:8, phase1:'US north / CS south', phase2:'US north / CS south', leak:false };
    });

    check('RANK + NAME LOCKS: 26 exact battle-date grades hold, brevet parentheticals follow names, and all 15 wrong prefixes are absent', function() {
      var body = JSON.stringify(DATA);
      var required = [
        'Maj. Gen. Philip H. Sheridan', 'Lt. Gen. Jubal A. Early', 'Maj. Gen. Horatio G. Wright',
        'Brig. Gen. William H. Emory (Bvt. Maj. Gen.)', 'Brig. Gen. George Crook', 'Brig. Gen. Alfred T. A. Torbert (Bvt. Maj. Gen.)',
        'Brig. Gen. Wesley Merritt', 'Brig. Gen. George A. Custer', 'Brig. Gen. George W. Getty',
        'Brig. Gen. Frank Wheaton', 'Brig. Gen. James B. Ricketts', 'Brig. Gen. William Dwight',
        'Brig. Gen. Cuvier Grover', 'Col. William H. Powell', 'Col. Joseph Thoburn',
        'Col. Rutherford B. Hayes', 'Col. J. Howard Kitching', 'Col. J. Warren Keifer',
        'Col. Charles Russell Lowell', 'Maj. Gen. John B. Gordon', 'Maj. Gen. Joseph B. Kershaw',
        'Maj. Gen. Stephen D. Ramseur', 'Maj. Gen. Lunsford L. Lomax', 'Brig. Gen. John Pegram',
        'Brig. Gen. Gabriel C. Wharton', 'Brig. Gen. Thomas L. Rosser'
      ];
      required.forEach(function(name){ if (body.indexOf(name) < 0) throw new Error('missing exact name/rank ' + name); });
      if (body.indexOf('temporary grade') < 0) throw new Error('Early temporary-grade marker missing');
      [
        /Lt\. Gen\. Philip H\. Sheridan/, /Maj\. Gen\. Jubal A\. Early/, /Maj\. Gen\. William H\. Emory/,
        /Maj\. Gen\. George Crook/, /Maj\. Gen\. Alfred T\. A\. Torbert/, /Maj\. Gen\. George A\. Custer/,
        /Maj\. Gen\. Wesley Merritt/, /Brig\. Gen\. Joseph Thoburn/, /Brig\. Gen\. Rutherford B\. Hayes/,
        /Brig\. Gen\. J\. Howard Kitching/, /Lt\. Gen\. John B\. Gordon/, /Brig\. Gen\. Stephen D\. Ramseur/,
        /Maj\. Gen\. John Pegram/, /Maj\. Gen\. Gabriel C\. Wharton/, /Maj\. Gen\. Thomas L\. Rosser/
      ].forEach(function(re){ if (re.test(body)) throw new Error('forbidden rank prefix leaked: ' + re); });
      var kitching = [];
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){ if (row.u.id === 'us_cc_kitching') kitching.push(String(row.u.note || '')); }); });
      if (!kitching.length || kitching.some(function(note){ return /killed[- ]?in[- ]?action|\bKIA\b/i.test(note); })) throw new Error('Kitching must be wounded/died later, never KIA');
      return { locks:required.length, rejections:15, kitchingNotes:kitching.length };
    });

    check("FATAL HALT + COUNT-FREE PURSUIT + DIGNITY: both primaries are attributed, glory-enough occurs only in Gordon's card, rejected counts stay absent, Ramseur is teaching-only, The Burning is never scored", function() {
      var body = JSON.stringify(DATA), cards = (DATA.teaching && DATA.teaching.cards) || [];
      var halt = cards.filter(function(c){ return c.id === 'cc_fatal_halt'; })[0];
      if (!halt) throw new Error('cc_fatal_halt missing');
      var haltBody = JSON.stringify(halt), glory = (body.toLowerCase().match(/glory enough for one day/g) || []).length;
      if (glory !== 1 || haltBody.toLowerCase().indexOf('glory enough for one day') < 0) throw new Error('glory-enough attribution walk failed: occurrences=' + glory);
      ['Early', 'Gordon', 'Reminiscences'].forEach(function(t){ if (haltBody.indexOf(t) < 0) throw new Error('Fatal Halt attribution missing ' + t); });
      [/\b43 guns\b/i, /\b24 recaptured\b/i, /\b200 wagons\b/i, /\b1,000 prisoners\b/i].forEach(function(re){ if (re.test(body)) throw new Error('rejected pursuit count leaked: ' + re); });
      DATA.phases.forEach(function(p){ if (/burning/i.test(String((p.objective || {}).name || ''))) throw new Error('The Burning may never be a phase objective'); });
      if (!cards.some(function(c){ return c.id === 'cc_the_burning'; })) throw new Error('Burning teaching card missing');
      if (!cards.some(function(c){ return c.id === 'cc_ramseur'; })) throw new Error('Ramseur teaching card missing');
      return { primaries:['Early','Gordon'], gloryOccurrences:glory, rejectedCounts:4, burning:'teaching-only', ramseur:'teaching-only' };
    });

    check('D74 NO-FUDGE: no Cedar-Creek-specific combat/result/plunder/straggle/blame/death key at any depth; artillery uses the universal gun model', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden keys: ' + bad.join(', '));
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){
        if (row.u.arm === 'art' && (!(row.u.guns > 0) || !(row.u.men > 0))) throw new Error('artillery gun/crew missing on ' + row.u.id);
      }); });
      return { forbidden:0 };
    });

    check('LAUNCH: phase 1 initializes CS attack under fog with eleven source-sequence arrivals; phase 2 reverses roles and clears fog; arrivals fire once; no NaN', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'cedarCreek', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'cedarCreek' || __FIELD.attacker !== 'CS' || __FIELD.defender !== 'US' || __FIELD.fog !== true) throw new Error('phase-1 launch roles/fog wrong');
      if (!__FIELD.phases || __FIELD.phases.length !== 2 || __FIELD.phaseIdx !== 0) throw new Error('phases not initialized');
      if (__FIELD.objective.name.indexOf('Belle Grove') < 0) throw new Error('phase-1 objective wrong: ' + __FIELD.objective.name);
      if (__FIELD.units.length !== 8 || !__FIELD.reinforce || __FIELD.reinforce.length !== 11) throw new Error('phase-1 opening/schedule wrong: ' + __FIELD.units.length + '/' + (__FIELD.reinforce && __FIELD.reinforce.length));
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      if (__FIELD.attacker !== 'US' || __FIELD.defender !== 'CS' || __FIELD.fog !== false) throw new Error('phase-2 reversed roles/fog wrong');
      if (__FIELD.objective.name.indexOf("Miller's Mill") < 0 || __FIELD.objective.name.indexOf('Middletown') < 0) throw new Error('phase-2 objective wrong: ' + __FIELD.objective.name);
      var base = __FIELD.units.length, sched = __FIELD.reinforce.slice();
      if (base !== 15 || sched.length !== 3) throw new Error('phase-2 opening/schedule wrong: ' + base + '/' + sched.length);
      __FIELD.phase = 'battle'; __FIELD.t = 99999; fldScenarioTick(0.05); fldScenarioTick(0.05);
      if (__FIELD.units.length !== base + 3) throw new Error('reinforcements duplicated or missing: ' + __FIELD.units.length);
      fldSimStep(0.05);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { p1units:8, p1arrivals:11, p2units:base, p2arrivals:sched.map(function(x){ return x.spec.id + '@' + x.atSec; }) };
    });

    check('SAME-SEED REPLAY: identical inputs produce an identical two-phase role-reversal battle', function() {
      var a = runBattle({ autoBoth:true, seed:909 });
      var b = runBattle({ autoBoth:true, seed:909 });
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      if (a.phase !== 'over' || a.badUnit || a.log.length !== 2) throw new Error('replay did not resolve both phases cleanly: ' + JSON.stringify(a));
      return { winner:a.w, score:a.score, log:a.log };
    });

    check('PASSIVE US and PASSIVE CS: both no-input players reach a valid two-phase end state without NaN', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps){
        var r = runBattle({ playerSide:ps, seed:17, autoBoth:false });
        if (r.phase !== 'over' || r.log.length !== 2 || ['US','CS','draw'].indexOf(r.w) < 0 || r.badUnit) throw new Error(ps + ' passive failed: ' + JSON.stringify(r));
        out[ps] = { winner:r.w, steps:r.steps };
      });
      return out;
    });

    check('HISTORICAL DIRECTION (8 seeds, direction-neutral aggregate casualty law): P1 CS seizes, P2 US seizes, aggregate US wins; struck side bleeds more within each phase only', function() {
      var seeds = ${JSON.stringify(SEEDS)}, p1CS = 0, p2US = 0, aggregateUS = 0, p1USBleeds = 0, p2CSBleeds = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over' || r.badUnit || r.log.length !== 2) throw new Error('seed ' + seeds[i] + ' did not resolve: ' + JSON.stringify(r));
        if (r.log[0].w === 'CS') p1CS++;
        if (r.log[1].w === 'US') p2US++;
        if (r.w === 'US') aggregateUS++;
        if (r.log[0].us > r.log[0].cs) p1USBleeds++;
        if (r.log[1].cs > r.log[1].us) p2CSBleeds++;
        samples.push(seeds[i] + ':' + r.log[0].w + '/' + r.log[1].w + '=' + r.w + ' phase-losses ' + r.log[0].us + '-' + r.log[0].cs + '/' + r.log[1].us + '-' + r.log[1].cs);
      }
      if (p1CS < 5) throw new Error('phase-1 CS seizes below 5/8: ' + p1CS + ' :: ' + samples.join(', '));
      if (p2US < 5) throw new Error('phase-2 US seizes below 5/8: ' + p2US + ' :: ' + samples.join(', '));
      if (aggregateUS < 5) throw new Error('aggregate US wins below 5/8: ' + aggregateUS + ' :: ' + samples.join(', '));
      if (p1USBleeds < 5) throw new Error('phase-1 US-losses-exceed-CS below 5/8 (direction only): ' + p1USBleeds + ' :: ' + samples.join(', '));
      if (p2CSBleeds < 5) throw new Error('phase-2 CS-losses-exceed-US below 5/8 (direction only): ' + p2CSBleeds + ' :: ' + samples.join(', '));
      return { phase1CS:p1CS + '/8', phase2US:p2US + '/8', aggregateUS:aggregateUS + '/8', phase1USBleeds:p1USBleeds + '/8', phase2CSBleeds:p2CSBleeds + '/8', samples:samples };
    });

    check('TEACHING + WEATHER: seven two-source cards carry the dispute, ride/poem split, Burning, Ramseur, march, Lost Cause, and election; Eastern Union-victory codex names the winner-bled-more cost; fog/dawn opens before a clear phase 2', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], codex = DATA.teaching && DATA.teaching.codex;
      if (cards.length < 7 || !codex) throw new Error('teaching/codex missing: ' + cards.length);
      cards.forEach(function(c){ if (sourceUrls(c.sources).length < 2) throw new Error('card lacks two source URLs: ' + c.id); });
      var ids = cards.map(function(c){ return c.id; });
      ['cc_fatal_halt','cc_sheridans_ride','cc_the_burning','cc_ramseur','cc_gordons_march','cc_lost_cause_architect','cc_election_1864'].forEach(function(id){ if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
      if (sourceUrls(codex.sources).length < 2) throw new Error('codex lacks two source URLs');
      if (!codex.axes || codex.axes.theater !== 'Eastern' || codex.axes.result !== 'Union victory') throw new Error('codex axes wrong');
      if (String(codex.axes.cost || '').toLowerCase().indexOf('winner bled more') < 0) throw new Error('codex cost axis must name that the winner bled more');
      var w = DATA.weather || {};
      if (w.sky !== 'fog' || w.time !== 'dawn' || !/^(Verified|Inferred)$/.test(String(w.provenance || '')) || sourceUrls(w.sources).length < 2) throw new Error('weather must be fog/dawn with exact provenance and two sources');
      if (String(w.note || '').indexOf('phase 2') < 0 || String(w.note || '').indexOf('defaultFog:false') < 0) throw new Error('weather note must explain the clear phase-2 seam');
      return { cards:ids, codex:codex.id, weather:{ sky:w.sky, time:w.time, provenance:w.provenance } };
    });

    check('ARMY REGISTER PIN: 19 unique Cedar Creek side/unit ids produce exact cmd/nco/pvt trios and current total 1671', function() {
      var C = { side:'US', iron:false, idx:0, funds:6500, recovery:false, completed:[], roster:[], nextId:1,
        stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
      if (typeof _t1InitAll === 'function') _t1InitAll(C);
      var reg = ssPersonRegistry(C), rows = [], groups = {};
      if (reg.people.length !== 1671) throw new Error('Army Register total is ' + reg.people.length + ', expected 1671');   // D380: 1170 -> 1200 — Five Forks adds 10 unique units x 3 slots. D384: 1200 -> 1281 — Fort Donelson adds 27 unique units x 3 slots. D388: 1281 -> 1326 — Elkhorn Tavern adds 15 unique side-unit ids x 3 slots. D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D393: 1380 -> 1434 — Wilderness adds 18 unique side-unit ids x 3 slots. D397: 1434 -> 1512 — Petersburg initial assaults adds 26 unique side-unit ids x 3 slots; Cedar Creek's 57-row/19-unit teeth remain stable. D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots. D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots. D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7): Watie's 2nd CMR adds 1 unique side-unit id x 3 slots. D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (LANE-013 P4, the D455 SS3 row 6 unlock). D469: 1632 -> 1671 — The Crater adds 13 unique side-unit ids x 3 slots (LANE-015, the D464 spec).
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:cedarCreek:') === 0) rows.push(origin);
      }
      if (rows.length !== 57) throw new Error('Cedar Creek rows are ' + rows.length + ', expected 57');
      rows.forEach(function(origin){
        var m = origin.match(/^ss:cedarCreek:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Cedar Creek slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var keys = Object.keys(groups);
      if (keys.length !== 19) throw new Error('Cedar Creek unit groups are ' + keys.length + ', expected 19');
      keys.forEach(function(k){ if (!groups[k].cmd || !groups[k].nco || !groups[k].pvt) throw new Error('incomplete trio ' + k); });
      return { total:reg.people.length, cedarRows:rows.length, units:keys.length };
    });

    check('FORT PILLOW REGISTERED (D463): the D455 SS3 row 6 unlock holds - fortPillow is the registered assault scenario and the massacre stays out of every scenario surface', function() {
      /* D463 chain: this tooth was the D376-era FORT PILLOW ABSENCE guard (no playable massacre
         scenario registered - the D135/D382 taught-only disposition). Aaron's D455 SS3 row 6
         AMENDS that disposition and D463 registers fortPillow per the committed spec
         (docs/design/fort-pillow-battle-build-spec.md): the scenario is the ASSAULT ONLY - the
         massacre is never in-scenario and resolves only through the shipped D457 no-quarter
         machinery. The tooth flips the documented D397/D454 way: absence -> registered-with-
         the-dignity-contract; the massacre-key scan is the half that REMAINS. */
      var reg = fldScenarioRegistry();
      if (!reg.fortPillow) throw new Error('fortPillow missing from the registry (registered per D455 SS3 row 6 / D463)');
      if (((reg.fortPillow || {}).name || '') !== 'Fort Pillow') throw new Error('fortPillow name wrong: ' + (reg.fortPillow || {}).name);
      var body = JSON.stringify(reg.fortPillow);
      /* teaching prose may NAME the massacre; keys/mechanics may not — the key-name scan is the absence half that remains */
      if (/"(?:massacreMult|rageMult|atrocityBonus|noQuarterBonus|casualtyScript)"/i.test(body)) throw new Error('massacre-temptation key in the scenario data');
      return { playable:true, registered:'D455 SS3 row 6 / D463' };
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
    check('MENU + SIDE CHOICE: one accessible Cedar Creek button sits between Kennesaw and Franklin; two side cards preserve the CS choice through fldLaunchBattle', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_cedarCreek');
      if (!btn || !btn.getAttribute('aria-label')) throw new Error('accessible Cedar Creek menu button missing');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_cedarCreek').length !== 1) throw new Error('duplicate Cedar Creek button');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_kennesaw') >= 0 && ids.indexOf('fldScnBtn_atlanta') === ids.indexOf('fldScnBtn_kennesaw') + 1 && ids.indexOf('fldScnBtn_crater') === ids.indexOf('fldScnBtn_atlanta') + 1 && ids.indexOf('fldScnBtn_cedarCreek') === ids.indexOf('fldScnBtn_crater') + 1 && ids.indexOf('fldScnBtn_franklin') === ids.indexOf('fldScnBtn_cedarCreek') + 1)) throw new Error('button chronology wrong: ' + ids.join(' -> '));   // D436 reshape: atlanta (rank 71, Jul 22 1864) inserts between kennesaw and cedarCreek. D469 re-pin: crater (rank 71.5, Jul 30 1864) inserts between atlanta and cedarCreek (LANE-015)
      var got = null; fldScenarioSideChoice('cedarCreek', function(side){ got = side; });
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
        fldLaunchBattle('cedarCreek', 'CS');
      } finally {
        window.fldLaunchSandbox = oldLaunch; window.fldBullRunBriefing = oldBrief;
      }
      if (!captured || captured.scenario !== 'cedarCreek' || captured.playerSide !== 'CS' || captured.renderer !== '3d') throw new Error('fldLaunchBattle options wrong: ' + JSON.stringify(captured));
      return { button:btn.id, sideChoice:got };
    });
  } catch(e) { R.ok = false; R.fatal = String(e && e.message || e); }
  return JSON.stringify(R);
})()`;

async function main() {
  let server = null, browser = null;
  const url = cfg.baseUrl + "/" + cfg.file;
  const result = { ok:false, steps:[], pageerrors:[] };
  try {
    const base = readFileSync(join(ROOT, "build", "base.html"), "utf8");
    const classicCount = (base.match(/\bcedarcreek\b/g) || []).length;
    const rail = JSON.parse(readFileSync(join(ROOT, "data", "logistics-rail.json"), "utf8"));
    const cedarRoutes = Object.keys(rail.routes || {}).filter(k => /cedar/i.test(k));
    result.steps.push({
      name:"CLASSIC LAYER: frozen lowercase cedarcreek remains three separate Classic references; tactical cedarCreek does not alter logistics rail",
      ok:classicCount === 3 && cedarRoutes.length === 0,
      v:{ classicId:"cedarcreek", occurrences:classicCount, tacticalId:"cedarCreek", railRoutes:cedarRoutes }
    });
    if (!result.steps[0].ok) throw new Error("Classic-layer collision contract changed: " + JSON.stringify(result.steps[0].v));
    const pillowFiles = readdirSync(join(ROOT, "data")).filter(f => /pillow/i.test(f));
    if (pillowFiles.join(",") !== "fort-pillow.json") throw new Error("expected exactly data/fort-pillow.json on disk (D463 flip of the absence guard): " + pillowFiles.join(", "));
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
    await page.waitForFunction(() => typeof window.fldLaunchSandbox === "function" && typeof window.fldScenarioRegistry === "function" && window.GAME_DATA && window.GAME_DATA["cedar-creek"], null, { timeout:45000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = result.steps.concat(setup.steps || [], dom.steps || []);
    result.pageerrors = result.pageerrors.concat(setup.errors || []);
    if (setup.fatal) result.pageerrors.push("SETUP fatal: " + setup.fatal);
    if (dom.fatal) result.pageerrors.push("DOM fatal: " + dom.fatal);
    result.ok = !!setup.ok && !!dom.ok && result.steps.every(s => s.ok) && result.pageerrors.length === 0;
    try { await page.screenshot({ path:join(OUT, "probe-cedar-creek.png"), fullPage:false, timeout:5000 }); }
    catch (e) { result.screenshotWarning = String(e && e.message || e); }
  } catch(e) {
    result.fatal = String(e && e.message || e); result.ok = false;
  } finally {
    try { writeFileSync(join(OUT, "probe-cedar-creek.json"), JSON.stringify(result, null, 2)); } catch {}
    printResult(result);
    await closeBrowserHard(browser); killChild(server);
  }
  if (!result.ok) process.exit(1);
  console.log("ALL OK");
}

main();
