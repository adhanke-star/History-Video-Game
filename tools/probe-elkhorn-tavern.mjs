#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D388 playable Elkhorn Tavern. Binds the D387 two-phase role reversal,
// [1,3] scoring, operational-surprise fog, constant CS-north/US-south home
// edges, per-phase T4 train positions, March 8's 21-to-12 gun line, exact
// battle-date grades, the D359 Leetown/Native OOB absence, and the D74 wall.
// The historical direction battery has exactly four guards: P1 CS seizes,
// P2 US seizes, aggregate US wins, and aggregate CS losses exceed US losses.
// It asserts no casualty magnitude, ratio, per-phase casualty split, prisoner,
// capture, gun-loss, or rout result.
//
// Registration-removal bind: exactly these eight steps must turn red:
// REGISTRY + MENU; LANDMARKS + HOME EDGES + SUPPLY RUNTIME; REGISTERED LAUNCH;
// SAME-SEED REPLAY; PASSIVE US + PASSIVE CS; HISTORICAL DIRECTION;
// ARMY REGISTER PIN; MENU + SIDE CHOICE. The Curtis-grade bind turns only
// RANK + NAME LOCKS red.
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
function step(result, name, fn) {
  try {
    const v = fn();
    result.steps.push({ name, ok: true, v: v === undefined ? null : v });
  } catch (e) {
    result.ok = false;
    result.steps.push({ name, ok: false, err: String(e && e.message || e) });
  }
}
function printResult(result) {
  console.log("probe-elkhorn-tavern ok=" + result.ok + " steps=" + (result.steps || []).length + " pageerrors=" + (result.pageerrors || []).length);
  if (result.fatal) console.log("  FATAL " + result.fatal);
  for (const s of (result.steps || [])) {
    if (s.ok) console.log("  ok   " + s.name.slice(0, 76) + " :: " + JSON.stringify(s.v).slice(0, 260));
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
    for (var si = 0; si < sides.length; si++) {
      var side = sides[si], units = (((p.oob || {})[side]) || []);
      for (var i = 0; i < units.length; i++) rows.push({ side:side, u:units[i] });
    }
    for (var r = 0; r < (p.reinforcements || []).length; r++) rows.push({ side:String(p.reinforcements[r].side || ''), u:p.reinforcements[r] });
    return rows;
  }
  function phaseTotals(p) {
    var out = { US:0, CS:0, gunsUS:0, gunsCS:0, opening:((p.oob && p.oob.US) || []).length + ((p.oob && p.oob.CS) || []).length };
    phaseUnits(p).forEach(function(row) {
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
      killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossscale:1,lossmult:1,capturescale:1,capturemult:1,
      surrenderscale:1,surrendermult:1,routscale:1,routmult:1,moralescale:1,moralemult:1,combatscale:1,
      battledamage:1,battlefire:1,powermult:1,scorebonus:1,scoremult:1,winner:1,winoverride:1,victoryoverride:1,
      outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,genius:1,geniusmult:1,ammopenalty:1,ammomult:1,
      supplymult:1,supplypenalty:1,exhaustionmult:1,fatiguemult:1,starvationmult:1,marchpenalty:1,
      surprisebonus:1,surprisemult:1,envelopmentbonus:1,envelopmentmult:1,panicmult:1,collapsemult:1
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
  function trainMatches(side, spec) {
    var tr = __FIELD.trains && __FIELD.trains[side];
    return !!tr && tr.x === spec.x && tr.z === spec.z && tr.name === spec.name;
  }
  function runBattle(opts) {
    opts = opts || {};
    G.campaign = null; G.settings = G.settings || {};
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    fldLaunchSandbox({ renderer:'none', scenario:'elkhornTavern', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    if (__FIELD.scenario !== 'elkhornTavern' || !__FIELD.phases || __FIELD.phases.length !== 2) throw new Error('registered Elkhorn launch unavailable');
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 120000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    return {
      w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n,
      score:__FIELD.phaseScore, cas:__FIELD.battleCas, badUnit:nanScan(),
      log:(__FIELD.phaseLog || []).map(function(e){ return { name:e.name, w:e.winner, by:e.winBy, us:Math.round(e.usCas), cs:Math.round(e.csCas) }; })
    };
  }

  var DATA = null;
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof _fldScenarioInitPhased !== 'function' || typeof ssPersonRegistry !== 'function')
      return JSON.stringify({ ok:false, fatal:'required tactical/T8/Army Register API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    DATA = GAME_DATA && GAME_DATA['elkhorn-tavern'] ? GAME_DATA['elkhorn-tavern'].elkhornTavern : null;

    check('DATA CONTRACT: two phases, [1,3], CS>US then US>CS, fog surprise then clear, constant home edges, committed envelopes, 21/12 guns, Inferred-strength disclosures', function() {
      if (!DATA || DATA.id !== 'elkhornTavern') throw new Error('GAME_DATA["elkhorn-tavern"].elkhornTavern missing');
      if (DATA.attacker !== 'CS' || DATA.defender !== 'US' || DATA.defaultFog !== false) throw new Error('top-level role/fog contract failed');
      if (!DATA.phases || DATA.phases.length !== 2) throw new Error('want exactly two phases');
      var p1 = DATA.phases[0], p2 = DATA.phases[1];
      if (p1.name !== 'Elkhorn Tavern - March 7' || p2.name !== "Curtis's Counterattack - March 8") throw new Error('phase names changed');
      if (p1.scoreWeight !== 1 || p2.scoreWeight !== 3 || p1.scoreWeight + p2.scoreWeight !== 4) throw new Error('weights must be [1,3], sum 4');
      if (p1.attacker !== 'CS' || p1.defender !== 'US' || p2.attacker !== 'US' || p2.defender !== 'CS') throw new Error('role reversal wrong');
      if (p1.defaultFog !== true || p2.defaultFog !== false) throw new Error('phase fog contract wrong');
      [p1,p2].forEach(function(p){ if (!p.homeEdge || p.homeEdge.CS !== 'low' || p.homeEdge.US !== 'high') throw new Error('home edges must stay CS north / US south in ' + p.id); });
      var t1 = phaseTotals(p1), t2 = phaseTotals(p2);
      if (t1.US < 2000 || t1.US > 5500 || t1.CS < 4000 || t1.CS > 6500) throw new Error('phase-1 envelope failed: ' + JSON.stringify(t1));
      if (t2.US < 7500 || t2.US > 10500 || t2.CS < 5000 || t2.CS > 11000) throw new Error('phase-2 envelope failed: ' + JSON.stringify(t2));
      if (t2.gunsUS !== 21 || t2.gunsCS !== 12) throw new Error('phase-2 guns must be exact 21/12: ' + t2.gunsUS + '/' + t2.gunsCS);
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){ if (String(row.u.note || '').indexOf('Inferred strength') < 0) throw new Error('unit lacks Inferred strength: ' + row.u.id); }); });
      return { weights:[1,3], phase1:t1, phase2:t2 };
    });

    check('INTERSTITIAL + STATIC SUPPLY: Camp Stephens, Greer remnant, and Curtis re-forming share one unscored overnight card; T4 trains hold the committed far/close geometry', function() {
      var p1 = DATA.phases[0], p2 = DATA.phases[1], lead = String(p2.transition && p2.transition.lead || '');
      if (!/Camp Stephens/i.test(lead) || !/Greer|remnant/i.test(lead) || !/Curtis.*reform|Curtis.*re-form|four divisions/i.test(lead)) throw new Error('overnight interstitial lacks train + Greer + Curtis re-forming');
      if (!/never a scored phase|unscored|teaching interstitial/i.test(lead)) throw new Error('overnight interstitial does not disclose its unscored status');
      if (!p1.supply || !p1.supply.US || !p1.supply.CS || !p2.supply || !p2.supply.US || !p2.supply.CS) throw new Error('per-phase supply objects missing');
      if (!(p1.supply.CS.z <= 50 && p1.supply.CS.x >= 1100)) throw new Error('phase-1 CS train is not far north: ' + JSON.stringify(p1.supply.CS));
      if (!(p2.supply.CS.z <= 50 && p2.supply.CS.x <= 100 && /Camp Stephens/i.test(p2.supply.CS.name || ''))) throw new Error('phase-2 CS train is not at the extreme Camp-Stephens edge');
      if (!(p1.supply.US.z >= DATA.field.h - 100 && p2.supply.US.z >= DATA.field.h - 100)) throw new Error('Union trains must stay close behind the south line');
      return { p1:p1.supply, p2:p2.supply };
    });

    check('REGISTRY + MENU: Elkhorn Tavern is rank 49 between Fort Donelson and Shiloh', function() {
      var reg = fldScenarioRegistry(), order = fldScenarioMenuOrder(reg);
      if (!reg.elkhornTavern || reg.elkhornTavern !== DATA) throw new Error('registry identity missing');
      if (fldScenarioMenuRank('elkhornTavern') !== 49) throw new Error('menu rank must be 49');
      if (!(order.indexOf('fortDonelson') + 1 === order.indexOf('elkhornTavern') && order.indexOf('elkhornTavern') + 1 === order.indexOf('shiloh'))) throw new Error('chronology wrong: ' + order.join(' -> '));
      return { rank:49, scenarios:Object.keys(reg).length };
    });

    check('LANDMARKS + HOME EDGES + SUPPLY RUNTIME: both phases keep CS north/US south and live T4 trains exactly consume each phase supply object; sandbox does not inherit', function() {
      var body = JSON.stringify(DATA);
      ['Elkhorn Tavern','Telegraph Road','Huntsville Road','Cross Timber Hollow','Big Mountain','Ruddick',"Welfley's Knoll",'Little Sugar Creek','Camp Stephens'].forEach(function(t){ if (body.indexOf(t) < 0) throw new Error('landmark missing ' + t); });
      delete G.settings.tacticalFog; __FIELD._logisticsOff = false;
      fldLaunchSandbox({ renderer:'none', scenario:'elkhornTavern', autoBoth:true, seed:3 });
      if (__FIELD.scenario !== 'elkhornTavern') throw new Error('registered launch missing');
      if (fldHomeEdgeZ('CS') !== -60 || fldHomeEdgeZ('US') !== FLD.FIELD_H + 60) throw new Error('phase-1 home edges wrong');
      if (!trainMatches('US', DATA.phases[0].supply.US) || !trainMatches('CS', DATA.phases[0].supply.CS)) throw new Error('phase-1 live trains do not match data: ' + JSON.stringify(__FIELD.trains));
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      if (fldHomeEdgeZ('CS') !== -60 || fldHomeEdgeZ('US') !== FLD.FIELD_H + 60) throw new Error('phase-2 home edges drifted');
      if (!trainMatches('US', DATA.phases[1].supply.US) || !trainMatches('CS', DATA.phases[1].supply.CS)) throw new Error('phase-2 live trains do not match data: ' + JSON.stringify(__FIELD.trains));
      fldLaunchSandbox({ renderer:'none', scenario:'sandbox', autoBoth:true, seed:3 });
      if (__FIELD.homeEdgeZ !== null) throw new Error('home-edge override leaked into sandbox');
      return { phase1:DATA.phases[0].supply, phase2:DATA.phases[1].supply, leak:false };
    });

    check('RANK + NAME LOCKS: every Elkhorn cast member keeps the battle-date grade; Curtis is a brigadier, never the March 21 major general', function() {
      var body = JSON.stringify(DATA), required = [
        'Brig. Gen. Samuel R. Curtis','Brig. Gen. Franz Sigel','Brig. Gen. Alexander Asboth','Col. Eugene A. Carr',
        'Col. Grenville M. Dodge','Col. William Vandever','Col. Jefferson C. Davis','Col. Peter J. Osterhaus',
        'Maj. Gen. Earl Van Dorn','Maj. Gen. Sterling Price','Col. Henry Little','Col. William Y. Slack',
        'Brig. Gen. Daniel M. Frost','Col. Elijah Gates','Col. Elkanah Greer','Col. Stand Watie','Col. John Drew'
      ];
      required.forEach(function(name){ if (body.indexOf(name) < 0) throw new Error('missing exact battle-date rank ' + name); });
      var curtis = [];
      DATA.phases.forEach(function(p){ ['US','CS'].forEach(function(side){ ((p.leaders || {})[side] || []).forEach(function(ld){ if (/Samuel R\. Curtis/.test(String(ld.name || ''))) curtis.push(ld.name); }); }); });
      if (curtis.length !== 2 || curtis.some(function(name){ return name !== 'Brig. Gen. Samuel R. Curtis'; })) throw new Error('every Curtis leader row must carry the exact brigadier grade: ' + JSON.stringify(curtis));
      [/Maj\. Gen\. Samuel R\. Curtis/,/Major General Samuel R\. Curtis/,/Brig\. Gen\. (?:Eugene A?\.? )?Carr\b/,/Brigadier General (?:Eugene A?\.? )?Carr\b/,
       /Brig\. Gen\. (?:Henry )?Little\b/,/Brig\. Gen\. (?:William Y?\.? )?Slack\b/,/Brig\. Gen\. Jefferson C\. Davis/,
       /Brig\. Gen\. (?:Peter J?\.? )?Osterhaus\b/,/Brig\. Gen\. (?:Grenville M?\.? )?Dodge\b/,/Brig\. Gen\. (?:William )?Vandever\b/,
       /(?:Brig\.|Maj\.) Gen\. Stand Watie/,/General Stand Watie/].forEach(function(re){ if (re.test(body)) throw new Error('forbidden rank leaked: ' + re); });
      return { locks:required.length, curtisRows:curtis.length };
    });

    check('D74 NO-FUDGE: no Elkhorn-specific combat/result/ammunition/supply/exhaustion/surprise/envelopment key at any depth; artillery uses the universal gun model', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden keys: ' + bad.join(', '));
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){ if (row.u.arm === 'art' && (!(row.u.guns > 0) || !(row.u.men > 0))) throw new Error('artillery gun/crew missing on ' + row.u.id); }); });
      return { forbidden:0 };
    });

    /* D460 CHAIN (LANE-013 P2; Aaron's D455 SS3 row 7 unlock amends the D359 carve-out): the
       old tooth barred ANY Native formation from the Elkhorn OOB. The registry-absence half is
       KEPT (no Leetown/Wilson/Glorieta/Red River scenario may exist). The fielded-Native half
       FLIPS to the sourced-fielding contract: phase 1 (March 7, the Elkhorn axis while both
       Cherokee regiments fought at Leetown) fields NO Native formation; phase 2 (March 8)
       fields EXACTLY Watie's 2nd Cherokee Mounted Rifles at its sourced Big Mountain station,
       two placement families named in its note (Shea & Hess + Goodspeed), Watie a COLONEL;
       Drew's 1st CMR is NEVER a combat marker (every account agrees it saw no combat March 8)
       and its non-combat station lives in the phase-2 transition record; teaching cards 8-10
       stay byte-identical to the D388 corpus (md5-pinned). */
    check('LEETOWN SCOPE + D460 CHEROKEE FIELDING: registry absence holds; phase 1 fields no Native formation; phase 2 fields exactly Watie 2nd CMR two-source; Drew never a combat marker; cards 8-10 byte-identical', function() {
      var reg = fldScenarioRegistry(), keys = Object.keys(reg);
      if (keys.some(function(k){ return /leetown|wilson|glorieta|redriver|redRiver/i.test(k); })) throw new Error('teaching/queued battle leaked into registry: ' + keys.join(','));
      var NATIVE_RE = /Cherokee|Mounted Rifles|Stand Watie|John Drew|Pike.?s brigade|Indian Brigade/i;
      phaseUnits(DATA.phases[0]).forEach(function(row){
        var text = [row.u.name,row.u.commander,row.u.note,row.u.entry].join(' ');
        if (NATIVE_RE.test(text)) throw new Error('Native formation fielded on the March 7 Elkhorn axis (they fought at Leetown): ' + row.u.id);
      });
      var natives = [];
      phaseUnits(DATA.phases[1]).forEach(function(row){
        var text = [row.u.name,row.u.commander,row.u.note,row.u.entry].join(' ');
        if (NATIVE_RE.test(text)) natives.push(row.u);
      });
      if (natives.length !== 1 || natives[0].id !== 'cs_et_watie_2cmr') throw new Error('phase 2 must field exactly cs_et_watie_2cmr: ' + natives.map(function(u){ return u.id; }).join(','));
      var w = natives[0], note = String(w.note || '');
      if (w.commander !== 'Col. Stand Watie') throw new Error('Watie must carry the exact colonel grade: ' + w.commander);
      if (w.name.indexOf('2nd Cherokee Mounted Rifles') < 0) throw new Error('the Pea Ridge-date SECOND designation is law: ' + w.name);
      if (note.indexOf('Shea & Hess') < 0 || note.indexOf('Goodspeed') < 0) throw new Error('the two-source placement rows are missing from the Watie note'); // D460_BIND_SOURCE
      if (note.indexOf('Inferred placement') < 0 || note.indexOf('Inferred strength') < 0) throw new Error('the Inferred placement/strength disclosures are missing');
      var drewCombat = [];
      DATA.phases.forEach(function(p){ phaseUnits(p).forEach(function(row){ if (/John Drew|Drew's 1st|1st Cherokee/i.test([row.u.name,row.u.commander,row.u.note].join(' ')) && row.u.id !== 'cs_et_watie_2cmr') drewCombat.push(row.u.id); }); });
      if (drewCombat.length) throw new Error('Drew must never be a combat marker (refuted placement): ' + drewCombat.join(','));
      var lead = String(DATA.phases[1].transition && DATA.phases[1].transition.lead || '');
      if (!/Drew's 1st Cherokee Mounted Rifles/.test(lead) || !/no combat/i.test(lead)) throw new Error('the Drew non-combat station record is missing from the phase-2 transition');
      var s810 = JSON.stringify(((DATA.teaching && DATA.teaching.cards) || []).slice(7,10)), h810 = 2166136261;
      for (var ci = 0; ci < s810.length; ci++) { h810 ^= s810.charCodeAt(ci); h810 = Math.imul(h810, 16777619); }
      var cards810 = (h810 >>> 0).toString(16) + ':' + s810.length;
      if (cards810 !== '68d30a4:3234') throw new Error('teaching cards 8-10 moved (must stay byte-identical to the D388 corpus; the parsed-JSON md5 is 4abd77c94ede36077976054fba3f3cfe): ' + cards810);
      var teaching = JSON.stringify((DATA.teaching && DATA.teaching.cards) || []);
      if (!/Leetown/.test(teaching) || !/Watie|Cherokee/.test(teaching) || !/scalp/i.test(teaching)) throw new Error('mandatory dignity teaching missing');
      return { fieldedNative:'cs_et_watie_2cmr', drewCombat:false, cards810:cards810, teaching:true };
    });

    check('REGISTERED LAUNCH: both objectives, roles, fog states, opening casts, and reinforcement schedules initialize and fire exactly once without NaN', function() {
      delete G.settings.tacticalFog; __FIELD._logisticsOff = false;
      fldLaunchSandbox({ renderer:'none', scenario:'elkhornTavern', autoBoth:true, playerSide:'US', seed:24680 });
      if (__FIELD.scenario !== 'elkhornTavern' || !__FIELD.phases || __FIELD.phases.length !== 2 || __FIELD.phaseIdx !== 0) throw new Error('two-phase registered launch missing');
      if (__FIELD.attacker !== 'CS' || __FIELD.defender !== 'US' || __FIELD.fog !== true || __FIELD.objective.name !== 'Elkhorn Tavern') throw new Error('phase-1 launch contract wrong');
      var base1 = __FIELD.units.length, sched1 = (__FIELD.reinforce || []).slice();
      if (base1 !== 7 || sched1.length !== 2 || sched1[0].spec.id !== 'us_et_vandever' || sched1[0].atSec !== 115 || sched1[1].spec.id !== 'us_et_asboth_relief' || sched1[1].atSec !== 255) throw new Error('phase-1 opening/schedule wrong: ' + base1 + '/' + JSON.stringify(sched1));
      __FIELD.phase = 'battle'; __FIELD.t = 99999; fldScenarioTick(0.05); fldScenarioTick(0.05);
      if (__FIELD.units.length !== base1 + 2) throw new Error('phase-1 reinforcements duplicated or missing: ' + __FIELD.units.length);
      __FIELD.phaseIdx = 1; _fldBuildPhase(1);
      if (__FIELD.attacker !== 'US' || __FIELD.defender !== 'CS' || __FIELD.fog !== false || __FIELD.objective.name.indexOf('Elkhorn Tavern') < 0) throw new Error('phase-2 launch contract wrong');
      var base2 = __FIELD.units.length, sched2 = (__FIELD.reinforce || []).slice();
      if (base2 !== 10 || sched2.length !== 1 || sched2[0].spec.id !== 'cs_et_greer' || sched2[0].atSec !== 40) throw new Error('phase-2 opening/schedule wrong: ' + base2 + '/' + JSON.stringify(sched2));   // D460: 9 -> 10 — Watie's 2nd CMR joins the phase-2 opening OOB (D455 SS3 row 7)
      __FIELD.phase = 'battle'; __FIELD.t = 99999; fldScenarioTick(0.05); fldScenarioTick(0.05);
      if (__FIELD.units.length !== base2 + 1) throw new Error('phase-2 reinforcement duplicated or missing: ' + __FIELD.units.length);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { p1:{ opening:base1, arrivals:['us_et_vandever@115','us_et_asboth_relief@255'] }, p2:{ opening:base2, arrivals:['cs_et_greer@40'] } };
    });

    check('SAME-SEED REPLAY: identical inputs produce an identical two-phase battle', function() {
      var a = runBattle({ autoBoth:true, seed:909 }), b = runBattle({ autoBoth:true, seed:909 });
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      if (a.phase !== 'over' || a.log.length !== 2 || a.badUnit) throw new Error('replay did not resolve both phases cleanly: ' + JSON.stringify(a));
      return { winner:a.w, score:a.score, log:a.log };
    });

    check('PASSIVE US + PASSIVE CS: both no-input players reach a valid two-phase end state without NaN', function() {
      var out = {};
      ['US','CS'].forEach(function(ps){
        var r = runBattle({ playerSide:ps, seed:17, autoBoth:false });
        if (r.phase !== 'over' || r.log.length !== 2 || ['US','CS','draw'].indexOf(r.w) < 0 || r.badUnit) throw new Error(ps + ' passive failed: ' + JSON.stringify(r));
        out[ps] = { winner:r.w, steps:r.steps };
      });
      return out;
    });

    check('HISTORICAL DIRECTION (8 seeds): P1 CS seizes, P2 US seizes, aggregate US wins, aggregate CS total losses exceed US; direction only', function() {
      var seeds = ${JSON.stringify(SEEDS)}, p1CS = 0, p2US = 0, aggregateUS = 0, aggregateCSLosses = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over' || r.badUnit || r.log.length !== 2) throw new Error('seed ' + seeds[i] + ' did not resolve: ' + JSON.stringify(r));
        if (r.log[0].w === 'CS') p1CS++;
        if (r.log[1].w === 'US') p2US++;
        if (r.w === 'US') aggregateUS++;
        if (r.cas.CS > r.cas.US) aggregateCSLosses++;
        samples.push(seeds[i] + ':' + r.log[0].w + '/' + r.log[0].by + '|' + r.log[1].w + '/' + r.log[1].by + '=' + r.w + '/' + r.by + ' aggregate-losses US ' + Math.round(r.cas.US) + ' CS ' + Math.round(r.cas.CS));
      }
      if (p1CS >= 5) {} else throw new Error('phase-1 CS seizes below 5/8: ' + p1CS + ' :: ' + samples.join(', '));
      if (p2US >= 5) {} else throw new Error('phase-2 US seizes below 5/8: ' + p2US + ' :: ' + samples.join(', '));
      if (aggregateUS >= 5) {} else throw new Error('aggregate US wins below 5/8: ' + aggregateUS + ' :: ' + samples.join(', '));
      if (aggregateCSLosses >= 5) {} else throw new Error('aggregate CS-losses-exceed-US below 5/8: ' + aggregateCSLosses + ' :: ' + samples.join(', '));
      return { phase1CS:p1CS + '/8', phase2US:p2US + '/8', aggregateUS:aggregateUS + '/8', aggregateCSLosses:aggregateCSLosses + '/8', samples:samples };
    });

    check('TEACHING + CODEX + WEATHER: ten source-honest cards carry the required quotations, Native agency, atrocity and weaponization; Trans-Mississippi codex and clear-March presentation stay honest', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], codex = DATA.teaching && DATA.teaching.codex, w = DATA.weather || {};
      if (cards.length < 8 || !codex) throw new Error('teaching/codex missing');
      cards.forEach(function(c){ if (sourceUrls(c.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(c.provenance || ''))) throw new Error('card source/provenance contract failed: ' + c.id); });
      var byId = {}; cards.forEach(function(c){ byId[c.id] = c; });
      ['et_most_pivotal','et_state_army','et_about_face','et_forced_march','et_carr_holds','et_welfley_guns','et_ammunition','et_leetown_other_field','et_native_agency','et_scalping_weaponized'].forEach(function(id){ if (!byId[id]) throw new Error('missing mandatory card ' + id); });
      var pivotal = String(byId.et_most_pivotal.body || ''), carr = String(byId.et_carr_holds.body || ''), native = String(byId.et_native_agency.body || ''), scalp = String(byId.et_scalping_weaponized.body || '');
      if (pivotal.indexOf('Pea Ridge was the most pivotal Civil War battle west of the Mississippi River') < 0 || pivotal.indexOf('greater than any other Confederate force in a single campaign during the entire Civil War') < 0 || /largest Civil War battle/i.test(pivotal)) throw new Error('pivotal-card quotations/scope wrong');
      if (carr.indexOf('682') < 0 || carr.indexOf('1,384') < 0 || byId.et_carr_holds.provenance !== 'Inferred') throw new Error('Carr casualty context/provenance missing');
      ['about 2,500','Ross','New Echota','defect','four-voice','does not make the Confederacy'].forEach(function(t){ if (native.indexOf(t) < 0) throw new Error('Native-agency framing missing ' + t); });
      ['court-martial','federal indictment','July 1862','single-family','Northern press'].forEach(function(t){ if (scalp.indexOf(t) < 0) throw new Error('scalping provenance framing missing ' + t); });
      if (sourceUrls(codex.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance || '')) || !codex.axes || codex.axes.theater !== 'Trans-Mississippi' || codex.axes.campaign !== 'Pea Ridge Campaign' || codex.axes.result !== 'Union victory') throw new Error('codex contract wrong');
      if (w.sky !== 'clear' || w.time !== 'morning' || w.provenance !== 'Inferred' || sourceUrls(w.sources).length < 2 || !/operational[- ]surprise/i.test(String(w.note || '')) || !/No literal weather fog/i.test(String(w.note || ''))) throw new Error('weather/fog disclosure wrong');
      return { cards:cards.length, codex:codex.id, weather:{ sky:w.sky, time:w.time, provenance:w.provenance } };
    });

    check('ARMY REGISTER PIN: 16 Elkhorn side-unit ids produce exact cmd/nco/pvt trios and current total 1632', function() {
      var C = { side:'US', iron:false, idx:0, funds:6500, recovery:false, completed:[], roster:[], nextId:1,
        stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
      if (typeof _t1InitAll === 'function') _t1InitAll(C);
      var reg = ssPersonRegistry(C), rows = [], groups = {};
      if (reg.people.length !== 1632) throw new Error('Army Register total is ' + reg.people.length + ', expected 1632');   // D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D393: 1380 -> 1434 — Wilderness adds 18 unique side-unit ids x 3 slots. D397: 1434 -> 1512 — Petersburg initial assaults adds 26 unique side-unit ids x 3 slots; Elkhorn's own 45-row/15-unit teeth remain stable. D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots. D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots. D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7): Watie's 2nd CMR adds 1 unique side-unit id x 3 slots; Elkhorn's own teeth move 45->48 rows / 15->16 units. D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (LANE-013 P4, the D455 SS3 row 6 unlock).
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:elkhornTavern:') === 0) rows.push(origin);
      }
      if (rows.length !== 48) throw new Error('Elkhorn rows are ' + rows.length + ', expected 48');   // D460: 45 -> 48
      rows.forEach(function(origin){
        var m = origin.match(/^ss:elkhornTavern:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Elkhorn slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var keys = Object.keys(groups);
      if (keys.length !== 16) throw new Error('Elkhorn unit groups are ' + keys.length + ', expected 16');   // D460: 15 -> 16
      keys.forEach(function(k){ if (!groups[k].cmd || !groups[k].nco || !groups[k].pvt) throw new Error('incomplete trio ' + k); });
      return { total:reg.people.length, elkhornRows:rows.length, units:keys.length };
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
    check('MENU + SIDE CHOICE: one accessible Elkhorn Tavern button sits between Fort Donelson and Shiloh; the chosen side reaches fldLaunchBattle', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_elkhornTavern');
      if (!btn || !btn.getAttribute('aria-label')) throw new Error('accessible Elkhorn Tavern menu button missing');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_elkhornTavern').length !== 1) throw new Error('duplicate Elkhorn Tavern button');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_fortDonelson') >= 0 && ids.indexOf('fldScnBtn_elkhornTavern') === ids.indexOf('fldScnBtn_fortDonelson') + 1 && ids.indexOf('fldScnBtn_shiloh') === ids.indexOf('fldScnBtn_elkhornTavern') + 1)) throw new Error('button chronology wrong: ' + ids.join(' -> '));
      var got = null; fldScenarioSideChoice('elkhornTavern', function(side){ got = side; });
      var cards = document.querySelectorAll('[data-brside]'); if (cards.length !== 2) throw new Error('wanted two side cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]'); if (!cs) throw new Error('CS side card missing'); cs.click();
      if (got !== 'CS') throw new Error('side choice returned ' + got);
      var captured = null, oldLaunch = window.fldLaunchSandbox, oldBrief = window.fldBullRunBriefing;
      try {
        window.fldLaunchSandbox = function(opts){ captured = opts; };
        window.fldBullRunBriefing = function(){};
        fldLaunchBattle('elkhornTavern', 'CS');
      } finally {
        window.fldLaunchSandbox = oldLaunch; window.fldBullRunBriefing = oldBrief;
      }
      if (!captured || captured.scenario !== 'elkhornTavern' || captured.playerSide !== 'CS' || captured.renderer !== '3d') throw new Error('fldLaunchBattle options wrong: ' + JSON.stringify(captured));
      return { button:btn.id, sideChoice:got };
    });
  } catch(e) { R.ok = false; R.fatal = String(e && e.message || e); }
  return JSON.stringify(R);
})()`;

async function main() {
  let server = null, browser = null;
  const url = cfg.baseUrl + "/" + cfg.file;
  const result = { ok:true, steps:[], pageerrors:[] };
  try {
    step(result, "HARNESS PREPARSE: cooked SETUP and DOM browser programs compile", () => {
      new Script(SETUP); new Script(DOM);
      return { setupBytes:SETUP.length, domBytes:DOM.length };
    });
    step(result, "CLASSIC + RAIL + DIGNITY FILES: frozen peariver remains separate; no tactical rail alias or teaching-only battle file exists", () => {
      const base = readFileSync(join(ROOT, "build", "base.html"), "utf8");
      const row = '{id:"peariver", name:"Pea Ridge", year:1862, th:"TM", atk:"CS", us:10500, cs:16000, feat:"hills,woods,road", obj:"hold", wx:"clear", res:"Union victory secured Missouri for the Union.", cmdUS:"Curtis", cmdCS:"Van Dorn"}';
      if ((base.match(/\{id:"peariver", name:"Pea Ridge", year:1862, th:"TM", atk:"CS", us:10500, cs:16000, feat:"hills,woods,road", obj:"hold", wx:"clear", res:"Union victory secured Missouri for the Union\.", cmdUS:"Curtis", cmdCS:"Van Dorn"\}/g) || []).length !== 1) throw new Error("frozen Classic peariver row changed");
      const rail = JSON.parse(readFileSync(join(ROOT, "data", "logistics-rail.json"), "utf8"));
      for (const id of ["peariver", "elkhornTavern", "elkhorn-tavern", "pearidge"]) if (rail.routes && rail.routes[id]) throw new Error("forbidden rail route " + id);
      const forbidden = readdirSync(join(ROOT, "data")).filter(f => /leetown|wilson.?s.?creek|glorieta|red.?river/i.test(f));
      if (forbidden.length) throw new Error("teaching-only/queued battle data file present: " + forbidden.join(", "));
      return { classic:row, railAliases:0, forbiddenFiles:0 };
    });
    if (!(await up(url))) {
      server = spawn("python3", ["-m", "http.server", String(cfg.port)], { cwd:ROOT, stdio:"ignore" });
      for (let i = 0; i < 80 && !(await up(url)); i++) await sleep(250);
    }
    if (!(await up(url))) throw new Error("server not reachable at " + url);
    browser = await chromium.launch({ headless:true, args:GL });
    const page = await browser.newPage({ viewport:{ width:1440, height:950 }, deviceScaleFactor:1 });
    page.on("pageerror", e => result.pageerrors.push(String(e && e.message || e)));
    page.on("console", msg => { if (msg.type() === "error") result.pageerrors.push("console: " + msg.text()); });
    await page.goto(url, { waitUntil:"domcontentloaded", timeout:45000 });
    await page.waitForFunction(() => typeof window.fldLaunchSandbox === "function" && typeof window.fldScenarioRegistry === "function" && window.GAME_DATA && window.GAME_DATA["elkhorn-tavern"], null, { timeout:45000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = result.steps.concat(setup.steps || [], dom.steps || []);
    result.pageerrors = result.pageerrors.concat(setup.errors || []);
    if (setup.fatal) result.pageerrors.push("SETUP fatal: " + setup.fatal);
    if (dom.fatal) result.pageerrors.push("DOM fatal: " + dom.fatal);
    result.ok = result.steps.every(s => s.ok) && result.pageerrors.length === 0;
    try { await page.screenshot({ path:join(OUT, "probe-elkhorn-tavern.png"), fullPage:false, timeout:5000 }); }
    catch (e) { result.screenshotWarning = String(e && e.message || e); }
  } catch(e) {
    result.fatal = String(e && e.message || e); result.ok = false;
  } finally {
    try { writeFileSync(join(OUT, "probe-elkhorn-tavern.json"), JSON.stringify(result, null, 2)); } catch {}
    printResult(result);
    await closeBrowserHard(browser); killChild(server);
  }
  if (!result.ok) process.exit(1);
  console.log("ALL OK");
}

main();
