#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D384 playable Fort Donelson. Binds the D383 contract to the live T8 engine:
// three phases (Investment w1 -> Breakout w1 CS-attacker -> Smith's Recapture w3
// DECISIVE), the [1,1,3] reweighting the sourced phase leans force, the Feb 14
// naval-repulse interstitial on the phase-2 transition card, gunboats as INPUTS
// only (no ship-vs-ship engine; water batteries terrain/teaching, never land OOB),
// the corrected US 24,531 / CS 16,171 engaged anchors, the early-1862 rank wall
// (Grant Brig. Gen.; Buckner never Lt. Gen.; Forrest Lt. Col.; Foote Flag Officer),
// four sourced direction guards with NO casualty-direction tooth anywhere, the D74
// wall incl. the naval/command-collapse temptations, and the 1281 Army Register pin.
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
const SEEDS = [3, 11, 23, 41, 59, 107, 223, 331];
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
  console.log('probe-fort-donelson ok=' + result.ok + ' steps=' + (result.steps || []).length + ' pageerrors=' + (result.pageerrors || []).length);
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
      killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossscale:1,lossmult:1,capturescale:1,capturemult:1,
      surrenderscale:1,surrendermult:1,routscale:1,routmult:1,moralescale:1,moralemult:1,combatscale:1,
      battledamage:1,battlefire:1,powermult:1,scorebonus:1,scoremult:1,winner:1,winoverride:1,victoryoverride:1,
      outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,genius:1,geniusmult:1,gunboatmult:1,bombardmult:1,
      navalbarrage:1,surrenderforce:1,paralysismult:1,commandcollapsemult:1,weatherdamage:1,frostbitemult:1,
      floydpenalty:1,escapebonus:1,prisonercount:1,valormult:1,heroism:1
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
    fldLaunchSandbox({ renderer:'none', scenario:'fortDonelson', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 150000;
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
    DATA = GAME_DATA && GAME_DATA['fort-donelson'] ? GAME_DATA['fort-donelson'].fortDonelson : null;

    check('DATA CONTRACT: three phases with [1,1,3] and the decisive RECAPTURE, role flips US>CS / CS>US / US>CS, fog off everywhere, committed envelopes inside the corrected 24,531/16,171 anchors, Inferred-strength disclosure on every unit', function() {
      if (!DATA || DATA.id !== 'fortDonelson') throw new Error('GAME_DATA["fort-donelson"].fortDonelson missing');
      if (DATA.attacker !== 'US' || DATA.defender !== 'CS' || DATA.defaultFog !== false) throw new Error('top-level role/fog contract failed');
      if (!DATA.phases || DATA.phases.length !== 3) throw new Error('want exactly 3 phases, got ' + (DATA.phases && DATA.phases.length));
      var names = DATA.phases.map(function(p){ return String(p.name || ''); });
      if (names[0].indexOf('Investment') < 0 || names[1].indexOf('Breakout') < 0 || names[2].indexOf('Recapture') < 0) throw new Error('phase names must carry Investment / Breakout / Recapture: ' + names.join(' | '));
      var weights = DATA.phases.map(function(p){ return (typeof p.scoreWeight === 'number') ? p.scoreWeight : 1; });
      if (weights[0] !== 1 || weights[1] !== 1 || weights[2] !== 3) throw new Error('weights must be [1,1,3] - the packet [1,3,1] would score the aggregate for the side that surrendered - got ' + weights.join(','));
      var roles = DATA.phases.map(function(p){ return (p.attacker || '') + '>' + (p.defender || ''); });
      if (roles[0] !== 'US>CS' || roles[1] !== 'CS>US' || roles[2] !== 'US>CS') throw new Error('phase roles must be US>CS / CS>US / US>CS, got ' + roles.join(' | '));
      DATA.phases.forEach(function(p){ if (p.defaultFog !== false) throw new Error('fog must be off in every phase: ' + p.id); });
      var t0 = phaseTotals(DATA.phases[0]), t1 = phaseTotals(DATA.phases[1]), t2 = phaseTotals(DATA.phases[2]);
      if (t0.US < 8000 || t0.US > 15000) throw new Error('phase-1 US committed out of 8000-15000: ' + t0.US);
      if (t0.CS < 7000 || t0.CS > 13000) throw new Error('phase-1 CS committed out of 7000-13000: ' + t0.CS);
      if (t1.CS < 8000 || t1.CS > 13000) throw new Error('phase-2 CS committed out of 8000-13000: ' + t1.CS);
      if (t1.US < 9000 || t1.US > 15000) throw new Error('phase-2 US committed out of 9000-15000: ' + t1.US);
      if (t2.US < 4000 || t2.US > 9000) throw new Error('phase-3 US committed out of 4000-9000: ' + t2.US);
      if (t2.CS < 1500 || t2.CS > 6500) throw new Error('phase-3 CS committed out of 1500-6500: ' + t2.CS);
      if (t0.US + 0 > 24531 || t1.US > 24531 || t2.US > 24531) throw new Error('a phase fields more US men than the whole engaged army');
      if (t0.CS > 16171 || t1.CS > 16171 || t2.CS > 16171) throw new Error('a phase fields more CS men than the whole engaged garrison');
      DATA.phases.forEach(function(p, pi) {
        phaseUnits(p).forEach(function(row) {
          if (String(row.u.note || '').indexOf('Inferred strength') < 0)
            throw new Error('unit lacks the Inferred-strength disclosure: ' + row.u.id + ' (phase ' + pi + ')');
        });
      });
      return { phase1:t0, phase2:t1, phase3:t2 };
    });

    check('INTERSTITIAL CARDS: the Feb 14 naval repulse rides phase-2 transition.lead (beaten at close range, inputs-only) and the recall/thrown-away teaching rides phase-3', function() {
      var p2 = DATA.phases[1], p3 = DATA.phases[2];
      if (!p2.transition || !/Foote|gunboat|water batter/i.test(String(p2.transition.lead || ''))) throw new Error('phase-2 transition card must carry the Feb 14 naval repulse');
      if (!/repulsed|beaten|wreck/i.test(String(p2.transition.lead || ''))) throw new Error('the naval interstitial must state the repulse honestly');
      if (!/transport/i.test(String(p2.transition.lead || ''))) throw new Error('the naval interstitial must carry the transports-as-inputs teaching');
      if (!p3.transition || !/back into the works|recall|abandon/i.test(String(p3.transition.lead || ''))) throw new Error('phase-3 transition card must carry the recall / thrown-away escape teaching');
      return { p2:String(p2.transition.title || ''), p3:String(p3.transition.title || '') };
    });

    check('REGISTRY + MENU: Fort Donelson opens the Western arc at rank 48 - after New Market Heights, before Shiloh', function() {
      var reg = fldScenarioRegistry(), order = fldScenarioMenuOrder(reg);
      if (!reg.fortDonelson || reg.fortDonelson !== DATA) throw new Error('registry identity missing');
      if (fldScenarioMenuRank('fortDonelson') !== 48) throw new Error('menu rank must be 48, got ' + fldScenarioMenuRank('fortDonelson'));
      if (!(order.indexOf('newMarketHeights') + 1 === order.indexOf('fortDonelson') && order.indexOf('fortDonelson') + 1 === order.indexOf('shiloh'))) throw new Error('chronology wrong: ' + order.join(' -> '));
      return { rank:48, order:order.indexOf('fortDonelson') };
    });

    check('LANDMARKS + HOME EDGES: the sourced ground is on the field (Forge Road distinct from the road to Charlotte), the water batteries are markers not OOB, no sandbox leak', function() {
      var body = JSON.stringify(DATA);
      ['Cumberland', 'water batteries', 'Hickman Creek', 'Indian Creek', 'Lick Creek', "Dudley's Hill", "Wynn's Ferry Road", 'Forge Road', 'Charlotte', 'Dover', 'Redan No. 2'].forEach(function(t){
        if (body.indexOf(t) < 0) throw new Error('landmark tooth missing ' + t);
      });
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){
        if (/water batter|gunboat|ironclad|St\\. Louis|Carondelet/i.test(String(row.u.name || ''))) throw new Error('naval asset fielded as land OOB: ' + row.u.id);
      }); });
      fldLaunchSandbox({ renderer:'none', scenario:'fortDonelson', autoBoth:true, seed:3 });
      if (fldHomeEdgeZ('US') !== -60 || fldHomeEdgeZ('CS') !== FLD.FIELD_H + 60) throw new Error('home edges wrong (US rear is the Fort Henry side, LOW z): ' + fldHomeEdgeZ('US') + '/' + fldHomeEdgeZ('CS'));
      fldLaunchSandbox({ renderer:'none', scenario:'sandbox', autoBoth:true, seed:3 });
      if (__FIELD.homeEdgeZ !== null) throw new Error('home-edge override leaked into sandbox');
      return { leak:false, landmarks:11 };
    });

    check('RANK + NAME LOCKS: the early-1862 wall holds (Grant the brigadier, Buckner never Lt. Gen., Forrest the lieutenant colonel, Foote the Flag Officer, colonels stay colonels)', function() {
      var body = JSON.stringify(DATA);
      ['Brig. Gen. Ulysses S. Grant', 'Brig. Gen. John B. Floyd', 'Brig. Gen. Gideon J. Pillow', 'Brig. Gen. Simon B. Buckner',
       'Brig. Gen. Bushrod R. Johnson', 'Lt. Col. Nathan Bedford Forrest', 'Flag Officer Andrew H. Foote',
       'Brig. Gen. Charles F. Smith', 'Brig. Gen. John A. McClernand', 'Brig. Gen. Lew Wallace',
       'Col. Richard J. Oglesby', 'Col. Jacob G. Lauman', 'Col. John W. Head', 'Col. Roger W. Hanson',
       'Col. Adolphus Heiman', 'Capt. Frank Maney', 'Col. James Tuttle'].forEach(function(name){
        if (body.indexOf(name) < 0) throw new Error('missing exact name/rank ' + name);
      });
      ['Maj. Gen. Ulysses S. Grant', 'Major General Ulysses S. Grant', 'Lt. Gen. Simon B. Buckner', 'Lieutenant General Simon',
       'Gen. Nathan Bedford Forrest', 'General Nathan Bedford Forrest', 'Admiral Foote', 'Admiral Andrew H. Foote',
       'Rear Admiral Foote', 'Maj. Gen. Charles F. Smith', 'Maj. Gen. John A. McClernand'].forEach(function(t){
        if (body.indexOf(t) >= 0) throw new Error('forbidden rendering leaked: ' + t);
      });
      var stripped = body.split('Lt. Col. Nathan Bedford Forrest').join('').split('Lieutenant Colonel Nathan Bedford Forrest').join('');
      if (stripped.indexOf('Col. Nathan Bedford Forrest') >= 0 || stripped.indexOf('Colonel Nathan Bedford Forrest') >= 0) throw new Error('Forrest rendered as full colonel somewhere');
      return { locks:17, rejections:11 };
    });

    check('D74 NO-FUDGE: no battle-specific combat/result key at any depth (incl. gunboatMult/bombardMult/navalBarrage/surrenderForce/paralysisMult/floydPenalty); artillery uses the universal gun model', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden keys: ' + bad.join(', '));
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){
        if (row.u.arm === 'art' && (!(row.u.guns > 0) || !(row.u.men > 0))) throw new Error('artillery gun/crew missing on ' + row.u.id);
      }); });
      return { forbidden:0 };
    });

    check('LAUNCH: three phases initialize in order with the right objectives, schedules fire once, no NaN', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'fortDonelson', autoBoth:true, playerSide:'US', seed:24680 });
      if (__FIELD.scenario !== 'fortDonelson' || __FIELD.attacker !== 'US' || __FIELD.defender !== 'CS') throw new Error('launch roles wrong');
      if (!__FIELD.phases || __FIELD.phases.length !== 3 || __FIELD.phaseIdx !== 0) throw new Error('phases not initialized');
      if (__FIELD.objective.name.indexOf('Works') < 0) throw new Error('phase-1 objective wrong: ' + __FIELD.objective.name);
      if (__FIELD.units.length !== 11) throw new Error('phase-1 opening unit count wrong (want 11, under the Kennesaw 17 crown): ' + __FIELD.units.length);
      if (!__FIELD.reinforce || __FIELD.reinforce.length !== 1) throw new Error('phase-1 should schedule exactly the Morrison noon assault: ' + (__FIELD.reinforce && __FIELD.reinforce.length));
      if (__FIELD.attacker !== 'US') throw new Error('phase-1 attacker wrong');
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      if (__FIELD.objective.name.indexOf('Forge Road') < 0) throw new Error('phase-2 objective wrong: ' + __FIELD.objective.name);
      if (__FIELD.attacker !== 'CS' || __FIELD.defender !== 'US') throw new Error('phase-2 role reversal missing');
      var base2 = __FIELD.units.length, sched2 = __FIELD.reinforce.slice();
      if (base2 !== 10 || sched2.length !== 5) throw new Error('phase-2 opening/schedule wrong (dawn surprise: 3 US + 7 CS open; W.H.L. Wallace/Ross/Buckner/Cruft/Thayer arrive on the sourced piecemeal timeline): ' + base2 + '/' + sched2.length);
      __FIELD.phase = 'battle'; __FIELD.t = 99999; fldScenarioTick(0.05); fldScenarioTick(0.05);
      if (__FIELD.units.length !== base2 + 5) throw new Error('phase-2 reinforcements duplicated or missing: ' + __FIELD.units.length);
      __FIELD.phaseIdx = 2; _fldBuildPhase(2);
      if (__FIELD.objective.name.indexOf('Rifle Pits') < 0) throw new Error('phase-3 objective wrong: ' + __FIELD.objective.name);
      if (__FIELD.attacker !== 'US' || __FIELD.defender !== 'CS') throw new Error('phase-3 roles wrong');
      var base3 = __FIELD.units.length, sched3 = __FIELD.reinforce.slice();
      if (base3 !== 6 || sched3.length !== 2) throw new Error('phase-3 opening/schedule wrong: ' + base3 + '/' + sched3.length);
      fldSimStep(0.05);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { p1units:11, p2units:base2, p3units:base3, p3arrivals:sched3.map(function(x){ return x.spec.id + '@' + x.atSec; }) };
    });

    check('GRANT RETURNS: the phase-2 command absence is a timed-arrival INPUT - Grant inactive at dawn, active after his sourced-return second, never a result writer', function() {
      var p2 = DATA.phases[1], rec = null;
      (p2.leaders && p2.leaders.US || []).forEach(function(ld){ if (ld.id === 'ld_grant') rec = ld; });
      if (!rec || !(rec.atSec > 0) || !isFinite(rec.atSec)) throw new Error('phase-2 ld_grant must carry a finite positive atSec');
      if (!rec.entry || !/return/i.test(String(rec.entry))) throw new Error('the return entry text is missing');
      fldLaunchSandbox({ renderer:'none', scenario:'fortDonelson', autoBoth:true, seed:13579 });
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      var offs = __FIELD.leaders || [], grant0 = null;
      offs.forEach(function(o){ if (o.id === 'ld_grant') grant0 = o; });
      if (!grant0) throw new Error('phase-2 officer cast lacks ld_grant');
      if (grant0.active) throw new Error('Grant must be INACTIVE at the phase-2 dawn (he was downriver with Foote)');
      __FIELD.phase = 'battle'; __FIELD.paused = false; __FIELD.t = (rec.atSec || 170) + 5;
      fldSimStep(0.05);
      var grant1 = null; (__FIELD.leaders || []).forEach(function(o){ if (o.id === 'ld_grant') grant1 = o; });
      if (!grant1 || !grant1.active) throw new Error('Grant did not activate after his return second');
      if (grant1.fellAt || grant1.relieved) throw new Error('the return must not touch fall/relief state');
      return { atSec:rec.atSec, activated:true };
    });

    check('SAME-SEED REPLAY: identical inputs produce an identical three-phase battle', function() {
      var a = runBattle({ autoBoth:true, seed:909 });
      var b = runBattle({ autoBoth:true, seed:909 });
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      if (a.phase !== 'over' || a.badUnit) throw new Error('replay did not resolve cleanly');
      return { winner:a.w, score:a.score, log:a.log };
    });

    check('PASSIVE US and PASSIVE CS: both no-input players reach a valid end state through all three phases', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        var r = runBattle({ playerSide:ps, seed:17, autoBoth:false });
        if (r.phase !== 'over' || r.log.length !== 3 || ['US','CS','draw'].indexOf(r.w) < 0 || r.badUnit) throw new Error(ps + ' passive failed: ' + JSON.stringify(r));
        out[ps] = { winner:r.w, steps:r.steps };
      });
      return out;
    });

    check('HISTORICAL DIRECTION (8 seeds): CS holds the works, CS seizes the road, US seizes the vacated pits, US wins the aggregate - and NO casualty-direction tooth anywhere (the accounting conflict is the teaching)', function() {
      var seeds = ${JSON.stringify(SEEDS)}, p1cs = 0, p2cs = 0, p3us = 0, usAgg = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over' || r.badUnit) throw new Error('seed ' + seeds[i] + ' did not resolve: ' + JSON.stringify(r));
        if (r.log[0] && r.log[0].w === 'CS') p1cs++;
        if (r.log[1] && r.log[1].w === 'CS') p2cs++;
        if (r.log[2] && r.log[2].w === 'US') p3us++;
        if (r.w === 'US') usAgg++;
        samples.push(seeds[i] + ':' + r.log.map(function(e){ return e.w; }).join('/') + '=' + r.w + ' cas ' + Math.round(r.cas.US) + '-' + Math.round(r.cas.CS));
      }
      if (!(p1cs >= 5)) throw new Error('phase-1 CS holds below 5/8: ' + p1cs + ' :: ' + samples.join(', '));
      if (!(p2cs >= 5)) throw new Error('phase-2 CS seizures below 5/8: ' + p2cs + ' :: ' + samples.join(', '));
      if (!(p3us >= 5)) throw new Error('phase-3 US seizures below 5/8: ' + p3us + ' :: ' + samples.join(', '));
      if (!(usAgg >= 5)) throw new Error('aggregate US wins below 5/8: ' + usAgg + ' :: ' + samples.join(', '));
      return { phase1CS:p1cs + '/8', phase2CS:p2cs + '/8', phase3US:p3us + '/8', aggregateUS:usAgg + '/8', samples:samples };
    });

    check('TEACHING: eight sourced cards with the exact Grant text and the OR "post" wording, disputes shown never modeled, Western codex on the Henry-Donelson axis, snow/dawn weather as presentation only', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], codex = DATA.teaching && DATA.teaching.codex;
      if (cards.length < 8 || !codex) throw new Error('teaching/codex missing: ' + cards.length);
      cards.forEach(function(c) {
        var urls = (c.sources || []).filter(function(u){ return /^https?:/.test(u); });
        if (urls.length < 2) throw new Error('card lacks two source URLs: ' + c.id);
        if (!/^(Verified|Inferred|Disputed)$/.test(String(c.provenance || ''))) throw new Error('card lacks exact provenance: ' + c.id);
      });
      var ids = cards.map(function(c){ return c.id; });
      ['fd_river_war', 'fd_unconditional', 'fd_command_collapse', 'fd_forrest_out', 'fd_gunboats_beaten', 'fd_freezing_night', 'fd_grants_absence', 'fd_fort_henry'].forEach(function(id){ if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
      var body = JSON.stringify(DATA);
      if (body.indexOf('No terms except an unconditional and immediate surrender can be accepted. I propose to move immediately upon your works.') < 0) throw new Error('Grant reply must be quoted exactly');
      if (body.indexOf('forces and post under my command') < 0) throw new Error('Buckner request must carry the OR "post" wording, never the secondary "fort" variant');
      if (body.indexOf('ungenerous and unchivalrous') < 0) throw new Error('Buckner acceptance phrase missing');
      if (body.indexOf('24,531') < 0 || body.indexOf('16,171') < 0) throw new Error('the corrected engaged anchors must be taught');
      if (body.indexOf('12,392') < 0) throw new Error('the citation-grade surrendered figure must be taught');
      if ((codex.sources || []).filter(function(u){ return /^https?:/.test(u); }).length < 2) throw new Error('codex lacks two source URLs');
      if (!codex.axes || codex.axes.theater !== 'Western' || codex.axes.result !== 'Union victory' || codex.axes.campaign !== 'Henry-Donelson Campaign') throw new Error('codex axes wrong');
      if (!/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance || ''))) throw new Error('codex lacks exact provenance');
      var w = DATA.weather || {};
      if (w.sky !== 'snow' || w.time !== 'dawn' || !/^(Verified|Inferred)$/.test(String(w.provenance || '')) || (w.sources || []).filter(function(u){ return /^https?:/.test(u); }).length < 2) throw new Error('weather must be snow/dawn presentation-only with exact provenance and two sources');
      return { cards:ids, codex:codex.id };
    });

    check('ARMY REGISTER PIN: 27 Fort Donelson units produce exact cmd/nco/pvt trios and current total 1281', function() {
      var C = { side:'US', iron:false, idx:0, funds:6500, recovery:false, completed:[], roster:[], nextId:1,
        stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
      if (typeof _t1InitAll === 'function') _t1InitAll(C);
      var reg = ssPersonRegistry(C), rows = [], groups = {};
      if (reg.people.length !== 1281) throw new Error('Army Register total is ' + reg.people.length + ', expected 1281');
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:fortDonelson:') === 0) rows.push(origin);
      }
      if (rows.length !== 81) throw new Error('Fort Donelson rows are ' + rows.length + ', expected 81');
      rows.forEach(function(origin) {
        var m = origin.match(/^ss:fortDonelson:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Fort Donelson slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var keys = Object.keys(groups);
      if (keys.length !== 27) throw new Error('Fort Donelson unit groups are ' + keys.length + ', expected 27');
      keys.forEach(function(k){ if (!groups[k].cmd || !groups[k].nco || !groups[k].pvt) throw new Error('incomplete trio ' + k); });
      return { total:reg.people.length, fdRows:rows.length, units:keys.length };
    });

    check('DIGNITY + SHIP-VS-SHIP ABSENCE: no playable Fort Pillow, no playable Fort Henry, no naval scenario in the registry', function() {
      var reg = fldScenarioRegistry(), keys = Object.keys(reg);
      if (keys.some(function(k){ return /pillow|forthenry|fortHenry|hamptonroads|mobilebay/i.test(k); })) throw new Error('a teaching-only lane battle appears in the registry');
      var body = JSON.stringify(Object.keys(reg).map(function(k){ return (reg[k] || {}).name || ''; }));
      if (/fort pillow|hampton roads|mobile bay/i.test(body)) throw new Error('a registered scenario names a teaching-only lane battle');
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
    check('MENU + SIDE CHOICE: one accessible button between New Market Heights and Shiloh; the chosen side reaches fldLaunchBattle', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_fortDonelson');
      if (!btn || !btn.getAttribute('aria-label')) throw new Error('accessible Fort Donelson menu button missing');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_fortDonelson').length !== 1) throw new Error('duplicate Fort Donelson button');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_newMarketHeights') >= 0 && ids.indexOf('fldScnBtn_fortDonelson') === ids.indexOf('fldScnBtn_newMarketHeights') + 1 && ids.indexOf('fldScnBtn_shiloh') === ids.indexOf('fldScnBtn_fortDonelson') + 1)) throw new Error('button chronology wrong: ' + ids.join(' -> '));
      var got = null; fldScenarioSideChoice('fortDonelson', function(side){ got = side; });
      var cards = document.querySelectorAll('[data-brside]'); if (cards.length !== 2) throw new Error('wanted two side cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]'); if (!cs) throw new Error('CS side card missing'); cs.click();
      if (got !== 'CS') throw new Error('side choice returned ' + got);
      var captured = null, oldLaunch = window.fldLaunchSandbox, oldBrief = window.fldBullRunBriefing;
      try {
        window.fldLaunchSandbox = function(opts){ captured = opts; };
        window.fldBullRunBriefing = function(){};
        fldLaunchBattle('fortDonelson', 'CS');
      } finally {
        window.fldLaunchSandbox = oldLaunch; window.fldBullRunBriefing = oldBrief;
      }
      if (!captured || captured.scenario !== 'fortDonelson' || captured.playerSide !== 'CS' || captured.renderer !== '3d') throw new Error('fldLaunchBattle options wrong: ' + JSON.stringify(captured));
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
    const forbiddenFiles = readdirSync(join(ROOT, 'data')).filter(f => /pillow|fort-henry|forthenry|hampton|mobile-bay/i.test(f));
    if (forbiddenFiles.length) throw new Error('teaching-only lane data file present on disk: ' + forbiddenFiles.join(', '));
    const rail = JSON.parse(readFileSync(join(ROOT, 'data', 'logistics-rail.json'), 'utf8'));
    const route = rail.routes && rail.routes.ftdonelson;
    if (!route || route.label !== 'Cumberland-Tennessee river-rail junctions' || route.theater !== 'W' || !route.friction || route.friction.US !== 10 || route.friction.CS !== 15)
      throw new Error('the Classic-layer logistics-rail routes.ftdonelson was renamed or altered - it is a SEPARATE frozen layer');
    if (rail.routes.fortDonelson || rail.routes['fort-donelson']) throw new Error('tactical Fort Donelson id must not create or replace a rail route');
    const base = readFileSync(join(ROOT, 'build', 'base.html'), 'utf8');
    if ((base.match(/\{id:"ftdonelson", name:"Fort Donelson"/g) || []).length !== 1) throw new Error('frozen Classic ftdonelson row changed');
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
    await page.waitForFunction(() => typeof window.fldLaunchSandbox === 'function' && typeof window.fldScenarioRegistry === 'function' && window.GAME_DATA && window.GAME_DATA['fort-donelson'], null, { timeout:45000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = (setup.steps || []).concat(dom.steps || []);
    result.pageerrors = result.pageerrors.concat(setup.errors || []);
    if (setup.fatal) result.pageerrors.push('SETUP fatal: ' + setup.fatal);
    if (dom.fatal) result.pageerrors.push('DOM fatal: ' + dom.fatal);
    result.ok = !!setup.ok && !!dom.ok && result.steps.every(s => s.ok) && result.pageerrors.length === 0;
    // Best-effort artifact capture (the probe-kennesaw heavy-scene pattern): after eleven-plus
    // full three-phase sim runs the page's font readiness can stall, and the screenshot is an
    // artifact, not a tooth - the 14 teeth + 0 pageerrors above are the acceptance gate.
    try { await page.screenshot({ path:join(OUT, 'probe-fort-donelson.png'), fullPage:false, timeout:5000 }); }
    catch (e) { result.screenshotWarning = String(e && e.message || e); }
  } catch(e) {
    result.fatal = String(e && e.message || e); result.ok = false;
  } finally {
    try { writeFileSync(join(OUT, 'probe-fort-donelson.json'), JSON.stringify(result, null, 2)); } catch {}
    printResult(result);
    await closeBrowserHard(browser); killChild(server);
  }
  if (!result.ok) process.exit(1);
  console.log('ALL OK');
}

main();
