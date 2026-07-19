#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-crater.mjs - D469 playable The Crater (July 30, 1864); LANE-015.
// Verifies the one-commit runtime contract from docs/design/crater-battle-build-spec.md
// (D464, the controlling law) from the D459 massacre-treatment family packet: registry/menu/
// meta integration at rank 71.5 (between atlanta 71 and cedarCreek 72, the documented D442
// non-integer exception), the spec SS3 rank wall (MAHONE BRIG. GEN. - THE HEADLINE LOCK: the
// grade he wore in the field July 30; "Maj. Gen. Mahone" is forbidden ANYWHERE in the
// scenario), the SS3 roster law (NO Connecticut unit - the 2nd Brigade is EXACTLY the
// 19th/23rd/28th/29th/31st USCT), the one-family strength law (the Wikipedia engaged pair
// US 8,500 / CS 6,100 with the full spread disclosed), the blast as TRUE STARTING STATE
// (Elliott reduced by the sourced ~278, reforming posture - never a lever), the wave
// schedule at the sourced hours (Weisiger + part of Wright's ~9 a.m.; Hall ~11 a.m.;
// Sanders ~1-1:30 p.m.; the sub-split Inferred per the beyondthecrater family), the
// objective-beyond-the-bowl tooth (Cemetery Hill is never inside the crater pit), the spec
// SS7 extended D74 wall (incl. the Crater temptations: blastMult/shockMult/craterKill/
// confusionMult/any Ledlie-debuff key), the SS5 teaching teeth (five sourced cards; BOTH
// official findings taught; the qualitative-toll law - no invented count; THE McCLELLAN
// CAUTION - the "had it not been for Gen. Mahone" letter never standalone, always paired
// with the Suderow ratio evidence), the SS6 dignity imagery scan, the 1671 Army Register
// pin, the 8-seed direction battery (CS holds >=5/8 AND US-losses-exceed-CS >=5/8 -
// direction only, never a count gate), and the D457 no-quarter machinery teeth EXTENDING
// probe-mayhem-mode's shipped t1-t6 family with battleId crater (a lowercase id that PASSES
// _mhStableId directly - the complementary case to fortPillow's documented battle-N
// fallback). THE MASSACRE IS NEVER IN-SCENARIO: this probe asserts its ABSENCE from the
// battle data and its resolution path's presence in the shipped machinery only.
// BIND A PREDECLARATION - tampering Mahone's grade to "Maj. Gen." in the data must red
// EXACTLY the RANK WALL tooth.
// BIND B PREDECLARATION - dropping one teaching card's second source row must red EXACTLY
// the TEACHING card-source tooth.
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
  console.log('probe-crater ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

// ---- STATIC (node-side) teeth: the scenario JSON + the cross-file T1/T10 contracts ----
function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };
  const raw = readFileSync(join(ROOT, 'data', 'crater.json'), 'utf8');
  const j = JSON.parse(raw);
  const B = j.crater;

  check('D74 FORBIDDEN-KEY WALL (spec SS7, the extended list incl. the Crater temptations blastMult/shockMult/craterKill/confusionMult/ledlieDebuff): no per-battle lever key at any depth', () => {
    const bad = raw.match(/"(damage|dmg|damageMult|firepower|firepowerMult|fireScale|fireMult|fireMultiplier|killScale|killMult|casualtyScale|casualtyMult|lossMult|combatScale|battleDamage|battleFire|powerMult|moraleMult|routMult|captureMult|scoreBonus|scoreMult|winner|winOverride|victoryOverride|outcomeOverride|forceWin|winnerFudge|fudge|valorMult|heroism|rageMult|massacreMult|atrocityBonus|noQuarterBonus|surpriseBonus|surpriseMult|panicMult|collapseMult|blastMult|shockMult|craterKill|confusionMult|ledlieDebuff|debuff)"\s*:/g);
    if (bad) throw new Error('forbidden keys present: ' + bad.join(', '));
    return { clean:true };
  });

  check('SOURCES REGISTER: >=2 distinct families - Wikipedia x3 incl. both OR-derived orders of battle, Encyclopedia Virginia, NPS Petersburg, ABT with recorded defects, beyondthecrater, Levin, the committed packet + spec', () => {
    const src = B.sources || [];
    if (new Set(src.map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('register below 2 distinct entries');
    const all = src.join(' | ');
    ['en.wikipedia.org/wiki/Battle_of_the_Crater', 'Union_order_of_battle_for_the_Battle_of_the_Crater',
     'Confederate_order_of_battle_for_the_Battle_of_the_Crater', 'encyclopediavirginia.org/entries/crater-battle-of-the',
     'nps.gov/pete/learn/historyculture/battle-of-the-crater.htm', 'battlefields.org/learn/civil-war/battles/crater',
     'beyondthecrater.com', 'cwmemory.com',
     'massacre-treatment-battle-build-research.md', 'crater-battle-build-spec.md'].forEach(t => { if (all.indexOf(t) < 0) throw new Error('register missing ' + t); });
    if (all.indexOf('recorded defects') < 0) throw new Error('the ABT recorded-defects caveat is missing from the register');
    return { entries:src.length };
  });

  check('SHAPE (spec SS2): single-phase (no phases key), attacker US, defender CS, fog OFF with the ~15-minute-silence setup disclosure, standard doctrine, the one-family strengths encoded with the FULL spread disclosed', () => {
    if (B.attacker !== 'US' || B.defender !== 'CS' || B.defaultFog !== false) throw new Error('role/fog contract failed');
    if (Object.prototype.hasOwnProperty.call(B, 'phases')) throw new Error('phases key present - the day-shape is teaching prose, never phases');
    if (B.assaultDoctrine !== 'standard') throw new Error('spec pins assaultDoctrine standard, got ' + B.assaultDoctrine);
    const men = side => (B.oob[side] || []).reduce((a, u) => a + (u.men || 0), 0) + (B.reinforcements || []).filter(r => r.side === side).reduce((a, u) => a + (u.men || 0), 0);
    const us = men('US'), cs = men('CS');
    if (us !== 8500) throw new Error('US encoded total ' + us + ' - the spec encodes the Wikipedia engaged 8,500 (one family, no mixing)');
    if (cs !== 6100) throw new Error('CS encoded total ' + cs + ' - the spec encodes the Wikipedia engaged 6,100 (one family, no mixing)');
    if (raw.indexOf('8,500-16,500') < 0 || raw.indexOf('6,100-9,500') < 0) throw new Error('the full strength-spread disclosure is missing from provenance');
    if (raw.indexOf('one source family') < 0) throw new Error('the one-family law disclosure is missing');
    if ((B.weather || {}).note === undefined || String(B.weather.note).indexOf('~15-minute') < 0) throw new Error('the fog-OFF ~15-minute-silence setup disclosure is missing');
    return { us, cs };
  });

  check('RANK WALL (spec SS3): MAHONE BRIG. GEN. - the grade he wore July 30 (the CS OOB pins it); "Maj. Gen. Mahone" forbidden ANYWHERE; Burnside Maj. Gen.; Ledlie/Ferrero/Elliott Brig. Gens.', () => {
    ['Brig. Gen. William Mahone', 'Maj. Gen. Ambrose E. Burnside',
     'Brig. Gen. James H. Ledlie', 'Brig. Gen. Edward Ferrero', 'Brig. Gen. Stephen Elliott Jr.'].forEach(s => {
      if (raw.indexOf(s) < 0) throw new Error('missing required rank rendering: ' + s);
    });
    if (/Maj(?:\.|or)?\s+Gen(?:\.|eral)?\s+(?:William\s+)?Mahone/i.test(raw)) throw new Error('a forbidden Maj.-Gen. Mahone rendering exists (the grade belongs to the days-later commission, never the field)');
    if (/(?:Lt\.|Lieutenant)\s+Gen(?:\.|eral)?\s+(?:William\s+)?Mahone/i.test(raw)) throw new Error('a forbidden Lt.-Gen. Mahone rendering exists');
    if (raw.indexOf('the grade he actually wore in the field on July 30 was brigadier general') < 0) throw new Error('the Mahone rank-lock note is missing');
    if (/(?:Col\.|Colonel)\s+(?:James\s+H\.\s+)?Ledlie/i.test(raw) || /Maj\.\s+Gen(?:\.|eral)?\s+(?:James\s+H\.\s+)?Ledlie/i.test(raw)) throw new Error('a forbidden Ledlie grade rendering exists');
    return { ok:true };
  });

  check('ROSTER LAW (spec SS3): NO Connecticut unit anywhere; the 2nd Brigade is EXACTLY the 19th/23rd/28th/29th/31st USCT; the 1st Brigade is the 27th/30th/39th/43rd USCT', () => {
    if (/connecticut/i.test(raw)) throw new Error('a Connecticut token exists - the consolidated regiment law forbids it');
    const thomas = (B.reinforcements || []).find(u => u.id === 'us_cr_thomas');
    const sigfried = (B.reinforcements || []).find(u => u.id === 'us_cr_sigfried');
    if (!thomas || thomas.name.indexOf('19th, 23rd, 28th, 29th, 31st USCT') < 0) throw new Error('the 2nd Brigade five-regiment roster is wrong: ' + (thomas && thomas.name));
    if (!sigfried || sigfried.name.indexOf('27th, 30th, 39th, 43rd USCT') < 0) throw new Error('the 1st Brigade roster is wrong: ' + (sigfried && sigfried.name));
    if (String(thomas.note).indexOf('separate trench lane') < 0) throw new Error('the Thomas distinct-axis disclosure is missing');
    return { ok:true };
  });

  check('WAVE SCHEDULE (spec SS3): the staged US commitment (Ledlie leads; Potter/Willcox in support; the 4th Division LATE) and the three CS waves at the sourced hours, the Wright sub-split Inferred', () => {
    const r = id => (B.reinforcements || []).find(u => u.id === id);
    const potter = r('us_cr_potter'), willcox = r('us_cr_willcox'), sig = r('us_cr_sigfried'), tho = r('us_cr_thomas');
    const wei = r('cs_cr_weisiger'), wga = r('cs_cr_wrightga'), hall = r('cs_cr_hall'), san = r('cs_cr_sanders');
    [potter, willcox, sig, tho, wei, wga, hall, san].forEach(u => { if (!u) throw new Error('a scheduled formation is missing'); });
    if (!((B.oob.US || []).some(u => u.id === 'us_cr_ledlie'))) throw new Error('Ledlie must LEAD (on field at open)');
    if (!(potter.atSec < willcox.atSec && willcox.atSec < sig.atSec && sig.atSec < tho.atSec)) throw new Error('the staged US commitment sequence is wrong');
    if (!(tho.atSec < wei.atSec)) throw new Error('the 4th Division commits before the counterattack per the sourced sequence');
    if (wei.atSec !== wga.atSec) throw new Error('Weisiger and the Wright part attack together (~9 a.m.)');
    if (!(wei.atSec < hall.atSec && hall.atSec < san.atSec)) throw new Error('the CS wave order is wrong');
    if (String(wei.entry).indexOf('9 a.m.') < 0 || String(hall.entry).indexOf('11 a.m.') < 0 || String(san.entry).indexOf('1 to 1:30 p.m.') < 0) throw new Error('the sourced hours are missing from the wave entries');
    if (String(wga.note).indexOf('beyondthecrater specialist family alone and ships Inferred') < 0) throw new Error('the Wright sub-split Inferred disclosure is missing');
    if (String(potter.note).indexOf('sourced sequence') < 0) throw new Error('the staged-commitment disclosure is missing');
    return { usWaves:[potter.atSec, willcox.atSec, sig.atSec, tho.atSec], csWaves:[wei.atSec, wga.atSec, hall.atSec, san.atSec] };
  });

  check('OBJECTIVE BEYOND THE BOWL (spec SS2): Cemetery Hill is the objective, ~500 yards beyond the breach; the crater bowl is a TRAP the objective never touches', () => {
    if (!B.objective || B.objective.name !== 'Cemetery Hill') throw new Error('the objective is not Cemetery Hill: ' + (B.objective && B.objective.name));
    const bowl = (B.terrain.swamps || [])[0];
    if (!bowl || String(bowl.note).indexOf('THE CRATER BOWL') < 0) throw new Error('the crater bowl terrain entry is missing');
    const dx = B.objective.x - bowl.x, dz = B.objective.z - bowl.z, dist = Math.sqrt(dx * dx + dz * dz);
    if (!(dist > (B.objective.r + bowl.r))) throw new Error('the objective touches the bowl: dist ' + Math.round(dist) + ' vs ' + (B.objective.r + bowl.r));
    if (String(bowl.note).indexOf('NEVER attacker cover toward Cemetery Hill') < 0) throw new Error('the never-attacker-cover law is missing from the bowl note');
    if (raw.indexOf('~170 ft') < 0 || raw.indexOf('60-120') < 0 || raw.indexOf('30-35') < 0) throw new Error('the crater-dimension spread disclosure is missing');
    return { dist:Math.round(dist) };
  });

  check('BLAST AS TRUE STARTING STATE (spec SS3): Elliott encoded 1,722 (the 2,000 share MINUS the sourced ~278; the 352 outlier attributed, never encoded), reforming posture disclosed', () => {
    const ell = (B.oob.CS || []).find(u => u.id === 'cs_cr_elliott');
    if (!ell) throw new Error('Elliott missing');
    if (ell.men !== 1722) throw new Error('Elliott must encode 1,722 (2,000 - 278), got ' + ell.men);
    if (String(ell.note).indexOf('~278') < 0 || String(ell.note).indexOf('352') < 0 || String(ell.note).indexOf('outlier') < 0) throw new Error('the blast-toll disclosure is missing');
    if (String(ell.note).indexOf('reforming') < 0) throw new Error('the reforming-posture disclosure is missing');
    if (ell.name.indexOf('South Carolina') < 0) throw new Error('the brigade identity is wrong');
    if (String(ell.note).indexOf('OR-derived single-family') < 0) throw new Error('the regimental-roster Inferred disclosure is missing');
    return { men:ell.men };
  });

  check('TEACHING (spec SS5): five sourced cards, each >=2 distinct sources; BOTH official findings taught; the qualitative-toll law; THE McCLELLAN CAUTION - the letter never standalone, paired with Suderow', () => {
    const cards = (B.teaching && B.teaching.cards) || [];
    const ids = cards.map(c => c.id);
    ['cr_substitution', 'cr_massacre', 'cr_mine', 'cr_leadership', 'cr_remember'].forEach(id => { if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
    if (cards.length !== 5) throw new Error('expected exactly 5 cards, got ' + cards.length);
    cards.forEach(c => { if (new Set((c.sources || []).map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('card lacks 2 distinct sources: ' + c.id); });
    const sub = cards.find(c => c.id === 'cr_substitution');
    if (String(sub.body).indexOf('censured Burnside, Ledlie, Ferrero, Willcox') < 0 || String(sub.body).indexOf('Bliss') < 0) throw new Error('the court-of-inquiry censure list is missing');
    if (String(sub.body).indexOf('blamed the substitution') < 0 || String(sub.body).indexOf('BOTH findings') < 0) throw new Error('the two-findings frame is missing');
    if (String(sub.body).indexOf('it would have been a success') < 0) throw new Error('the Grant JCCW testimony is missing');
    const mas = cards.find(c => c.id === 'cr_massacre');
    if (String(mas.body).indexOf('NO SOURCE PINS A PRECISE TOLL') < 0) throw new Error('the qualitative-toll law is missing');
    if (String(mas.body).indexOf('had it not been for Gen. Mahone') < 0 || String(mas.body).indexOf('Suderow') < 0) throw new Error('the McClellan-caution pairing is missing');
    if (String(mas.body).indexOf('historiographically contested') < 0) throw new Error('the contested-reading disclosure is missing');
    const mine = cards.find(c => c.id === 'cr_mine');
    ['511', '8,000 lbs', '4:44 a.m.', '278', '352'].forEach(t => { if (String(mine.body).indexOf(t) < 0) throw new Error('the mine card is missing the attributed figure ' + t); });
    const led = cards.find(c => c.id === 'cr_leadership');
    if (String(led.body).indexOf('bomb-proof') < 0 || String(led.body).indexOf('rum') < 0 || String(led.body).indexOf('the saddest affair I have witnessed in this war') < 0) throw new Error('the leadership-failure record is missing');
    const rem = cards.find(c => c.id === 'cr_remember');
    if (String(rem.body).indexOf('General Order No. 252') < 0 || String(rem.body).indexOf('December 1862') < 0 || String(rem.body).indexOf('May 1863') < 0) throw new Error('the policy-chain record is missing');
    return { cards:ids };
  });

  check('CODEX AXES (spec SS5): theater Eastern, campaign "Richmond-Petersburg Campaign", result "Confederate victory"', () => {
    const ax = (B.teaching && B.teaching.codex && B.teaching.codex.axes) || {};
    if (ax.theater !== 'Eastern' || ax.campaign !== 'Richmond-Petersburg Campaign' || ax.result !== 'Confederate victory') throw new Error('codex axes wrong: ' + JSON.stringify(ax));
    return ax;
  });

  check('DIGNITY IMAGERY SCAN (spec SS6): no imagery key or reference anywhere in the scenario data; text carries the weight', () => {
    if (/"(img|image|images|imagery|photo|photos|footage|engraving|cutaway|scene|sceneId|media)"\s*:/i.test(raw)) throw new Error('an imagery key exists in the scenario data');
    if (/harper|engraving|\.jpe?g|\.png|\.gif|\.webp/i.test(raw)) throw new Error('an imagery reference exists in the scenario data');
    return { clean:true };
  });

  check('MASSACRE NEVER IN-SCENARIO (spec SS1): no massacre event, mechanic, casualty script, or scoring exists; the teaching names it and routes it to the D457 machinery', () => {
    if (Object.prototype.hasOwnProperty.call(B, 'events') || Object.prototype.hasOwnProperty.call(B, 'scripts') || Object.prototype.hasOwnProperty.call(B, 'casualtyScript')) throw new Error('an event/script key exists');
    if (raw.indexOf('THE MASSACRE IS NEVER IN THIS SCENARIO') < 0) throw new Error('the _comment design lock is missing');
    if (raw.indexOf('no-quarter machinery') < 0) throw new Error('the D457 resolution-path teaching reference is missing');
    (B.reinforcements || []).forEach(u => { if (u.events || u.script) throw new Error('a scheduled formation carries an event/script key'); });
    return { ok:true };
  });

  check('INTEGRATION SOURCE PINS: T1 rank chain atlanta 71 -> crater 71.5 -> cedarCreek 72 and the T10 E/true/anv meta row exist in source', () => {
    const t1 = readFileSync(join(ROOT, 'src', 'tactical', 'T1-bull-run.js'), 'utf8');
    if (!/atlanta:\s*71,\s*crater:\s*71\.5,\s*cedarCreek:\s*72/.test(t1)) throw new Error('menu rank chain atlanta:71 -> crater:71.5 -> cedarCreek:72 missing');
    if (t1.indexOf('GAME_DATA.crater && GAME_DATA.crater.crater') < 0) throw new Error('T1 registry line missing');
    const t10 = readFileSync(join(ROOT, 'src', 'tactical', 'T10-flags.js'), 'utf8');
    if (!/crater:\s*\{ theater: "E", badges: true, csFlag: "anv" \}/.test(t10)) throw new Error('T10 meta row missing');
    return { ok:true };
  });

  return steps;
}

// ---- BROWSER teeth: live registry, launch, Army Register, 8-seed direction, the D457 machinery ----
const SEEDS = [1, 7, 21, 33, 49, 101, 202, 303];
const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function check(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  function dataStrength(sd, side) {
    var t = 0;
    (((sd || {}).oob || {})[side] || []).forEach(function(u){ t += u.men || 0; });
    ((sd || {}).reinforcements || []).forEach(function(u){ if (u.side === side) t += u.men || 0; });
    return t;
  }
  function liveStrength(side) {
    var t = 0;
    for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === side) t += u.men; }
    return t;
  }
  function runBattle(opts) {
    opts = opts || {};
    G.campaign = null; G.settings = G.settings || {};
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    fldLaunchSandbox({ renderer:'none', scenario:'crater', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    var start = { US:dataStrength(__FIELD.scenData, 'US'), CS:dataStrength(__FIELD.scenData, 'CS') };
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 140000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    var us = liveStrength('US'), cs = liveStrength('CS');
    return { w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n,
      loss:{ US:Math.round(start.US - us), CS:Math.round(start.CS - cs) }, cas:__FIELD.battleCas || null };
  }
  function histCampaign(side) {
    var C = { side: side === 'CS' ? 'CS' : 'US', iron:false, idx:0, funds:300, recovery:false, completed:[], roster:[],
      nextId:1, stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0, recoveryMode:false, flipAtk:false,
      captured:[], president:{ turn:0 } };
    mayhemInit(C, 'historical', 'new');
    return C;
  }
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof ssPersonRegistry !== 'function')
      return JSON.stringify({ ok:false, fatal:'required tactical/Army Register API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';

    check('REGISTRY: crater registered at rank 71.5 - Jul 30 1864 lands after Atlanta (71) and before Cedar Creek (72); attacker US, defender CS', function(){
      var reg = fldScenarioRegistry();
      if (!reg.crater || reg.crater.id !== 'crater') throw new Error('crater missing from the live registry');
      var ra = fldScenarioMenuRank('atlanta'), rc = fldScenarioMenuRank('crater'), rd = fldScenarioMenuRank('cedarCreek');
      if (rc !== 71.5) throw new Error('menu rank must be 71.5, got ' + rc);
      if (!(ra < rc && rc < rd)) throw new Error('rank order wrong: ' + [ra, rc, rd].join(' / '));
      if (reg.crater.attacker !== 'US' || reg.crater.defender !== 'CS') throw new Error('role contract failed in the live registry');
      return { rank:rc };
    });

    check('T10 META: _FLD_BATTLE_META.crater is theater E, badges true, csFlag anv (AotP IX Corps badges legible - the D397 Petersburg precedent; Mahone is ANV)', function(){
      var m = _FLD_BATTLE_META.crater;
      if (!m || m.theater !== 'E' || m.badges !== true || m.csFlag !== 'anv') throw new Error('meta wrong: ' + JSON.stringify(m));
      return m;
    });

    check('LAUNCH: the field opens with 5 units (2 US - Ledlie leads with the corps guns - / 3 CS) on the Cemetery Hill objective; single-phase; EIGHT scheduled formations (the staged commitment + the waves); fog OFF', function(){
      G.campaign = null;
      fldLaunchSandbox({ renderer:'none', scenario:'crater', autoBoth:true, seed:12345 });
      if (__FIELD.units.length !== 5) throw new Error('want 5 opening units, got ' + __FIELD.units.length);
      var us = __FIELD.units.filter(function(u){ return u.side === 'US'; }).length;
      var cs = __FIELD.units.filter(function(u){ return u.side === 'CS'; }).length;
      if (us !== 2 || cs !== 3) throw new Error('want 2 US / 3 CS, got ' + us + '/' + cs);
      if (!__FIELD.objective || String(__FIELD.objective.name).indexOf('Cemetery Hill') < 0) throw new Error('objective is not Cemetery Hill: ' + (__FIELD.objective && __FIELD.objective.name));
      if (__FIELD.phases !== null) throw new Error('single-phase battle leaked phase machinery');
      if ((__FIELD.reinforce || []).length !== 8) throw new Error('want 8 scheduled formations, got ' + (__FIELD.reinforce || []).length);
      if (__FIELD.fog !== false) throw new Error('fog must default OFF (spec SS2)');
      return { units:__FIELD.units.length, scheduled:(__FIELD.reinforce || []).length };
    });

    check('ARMY REGISTER PIN: 13 unique Crater side-unit ids produce exact cmd/nco/pvt trios and current total 1671', function(){
      var reg = ssPersonRegistry();
      if (reg.people.length !== 1671) throw new Error('Army Register total is ' + reg.people.length + ', expected 1671');   // D469: 1632 -> 1671 — The Crater adds 13 unique side-unit ids x 3 slots (LANE-015, the D464 spec).
      var rows = [], groups = {};
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:crater:') === 0) rows.push(origin);
      }
      if (rows.length !== 39) throw new Error('Crater rows are ' + rows.length + ', expected 39 (13 units x cmd/nco/pvt)');
      rows.forEach(function(origin){
        var m = origin.match(/^ss:crater:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Crater slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var want = ['US:us_cr_ledlie','US:us_cr_guns','US:us_cr_potter','US:us_cr_willcox','US:us_cr_sigfried','US:us_cr_thomas',
        'CS:cs_cr_elliott','CS:cs_cr_wright_bty','CS:cs_cr_davidson_bty','CS:cs_cr_weisiger','CS:cs_cr_wrightga','CS:cs_cr_hall','CS:cs_cr_sanders'];
      var bad = want.filter(function(k){ var g = groups[k]; return !g || !g.cmd || !g.nco || !g.pvt; });
      if (bad.length) throw new Error('units without exact trios: ' + bad.join(', '));
      if (Object.keys(groups).length !== 13) throw new Error('unexpected Crater unit groups: ' + Object.keys(groups).length);
      return { total:reg.people.length, rows:rows.length };
    });

    check('HISTORICAL DIRECTION (8 seeds): the CS defense holds the hill in the majority AND US losses exceed CS in the majority (direction only, never a count gate - D74; fix INPUTS inside the one-family envelope and the Inferred timing/placement abstractions if this fails, never a lever)', function(){
      var seeds = ${JSON.stringify(SEEDS)}, csHolds = 0, usBleeds = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over') throw new Error('seed ' + seeds[i] + ' did not resolve');
        if (r.w === 'CS') csHolds++;
        if (r.loss.US > r.loss.CS) usBleeds++;
        samples.push(seeds[i] + ':' + r.w + ' loss ' + r.loss.US + '-' + r.loss.CS);
      }
      if (csHolds < 5) throw new Error('CS holds below 5/8: ' + csHolds + ' :: ' + samples.join(', '));
      if (usBleeds < 5) throw new Error('US-losses-exceed-CS below 5/8 (the ~2.5:1 direction at the one-family figures): ' + usBleeds + ' :: ' + samples.join(', '));
      return { csHolds:csHolds + '/8', usBleeds:usBleeds + '/8', samples:samples };
    });

    check('NO NaN in unit state after a full run', function(){
      for (var i = 0; i < __FIELD.units.length; i++) {
        var u = __FIELD.units[i];
        if (!isFinite(u.x) || !isFinite(u.z) || !isFinite(u.men) || !isFinite(u.morale)) throw new Error('NaN in ' + u.id);
      }
      return { units:__FIELD.units.length };
    });

    check('NO-QUARTER MACHINERY (extends probe-mayhem-mode t1-t6 with battleId crater): captures stamp the offer AT THE STABLE ID crater (lowercase passes _mhStableId directly - the complementary case to the fortPillow battle-N fallback); EVERY reward family refuses under Historical; the judged action resolves consequences-only; the declined path is byte-identical', function(){
      if (typeof mayhemInit !== 'function' || typeof mayhemNoQuarterHistApply !== 'function' || typeof _mhNoQuarterHistContext !== 'function') throw new Error('the D457 machinery API is missing');
      // (a) the offer stamps from the captured chain at the Crater battle (the
      // _MH_BASE_CAMPAIGN_ADVANCE override idiom; no captures -> no stamp -> bytes unchanged).
      // THE STABLE-ID LAW, THE OTHER HALF: 'crater' is already lowercase, so it PASSES
      // _mhStableId and the offer carries battleId 'crater' directly - no battle-N fallback
      // (the shipped D457 contract's primary path; fortPillow pinned the fallback half).
      var priorAdv = _MH_BASE_CAMPAIGN_ADVANCE, stamped = null;
      try {
        _MH_BASE_CAMPAIGN_ADVANCE = function () {};
        var N = histCampaign('CS'); G.campaign = N; G.battle = { id:'crater' };
        var nb = JSON.stringify(N);
        campaignAdvance('CS', 'major');
        if (N.mayhemNoQuarterOffer !== undefined || JSON.stringify(N) !== nb) throw new Error('a no-captures Crater resolve must stamp nothing (bytes unchanged)');
        G.battle = { id:'crater', mayhemCapturedByPlayer:187 };
        campaignAdvance('CS', 'major');
        if (!N.mayhemNoQuarterOffer || N.mayhemNoQuarterOffer.captured !== 187) throw new Error('the Historical offer must stamp from the Crater captured chain');
        if (N.mayhemNoQuarterOffer.battleId !== 'crater') throw new Error('the lowercase crater id must stamp DIRECTLY (no fallback), got ' + N.mayhemNoQuarterOffer.battleId);
        stamped = N;
      } finally { _MH_BASE_CAMPAIGN_ADVANCE = priorAdv; G.campaign = null; G.battle = null; }
      // (b) the DECLINED path leaves no consequence (the D457 purity contract).
      var declinedBytes = JSON.stringify(stamped);
      var panelHtml = mhJudgedNoQuarterPanel(stamped);
      if (panelHtml.indexOf('mh-judged') < 0 || panelHtml.indexOf('data-mh-no-quarter') < 0) throw new Error('the judged panel must render the offer + confirm button for the crater capture');
      if (JSON.stringify(stamped) !== declinedBytes) throw new Error('the judged panel render mutated the campaign (it must be pure)');
      if (stamped.mayhemNoQuarterOffer.consumed !== false) throw new Error('the unconfirmed offer must stay unconsumed');
      if ((stamped.mayhemReceipts || []).length) throw new Error('the declined path must append no receipt');
      if (stamped.infamy !== undefined) throw new Error('the declined path must open no infamy ledger');
      var aarHtml = aarRenderReport(stamped, { final:false });
      if (aarHtml.indexOf('mh-judged') < 0) throw new Error('the judged panel must ride the Historical AAR with a live offer');
      if ((stamped.mayhemReceipts || []).length || stamped.mayhemNoQuarterOffer.consumed !== false || stamped.infamy !== undefined) throw new Error('the declined AAR render took a consequence (receipt/consumed/infamy moved)');
      // (c) EVERY reward operation family refuses under Historical at battleId crater -
      // fixture actions injected into GAME_DATA["mayhem-rules"].actions with restore.
      var dataDoc = GAME_DATA['mayhem-rules'];
      var rewardOps = ['battle.score.add','phase.score.add','objective.resolve','casualty.apply','casualty.credit','capture.credit',
        'result.declare','result.reclassify','campaign.victoryProgress.add','enemyWill.add','discipline.add','funds.add','resource.add',
        'loot.grant','technology.unlock','weapon.grant','career.promote','reputation.add','achievement.unlock','roster.add',
        'roster.transfer','reinforcement.add','scenario.unlock','timeline.branch'];
      function fixtureAdapters() {
        var adapters = {};
        rewardOps.concat(['morale.add','press.add','diplomacy.add','notoriety.add','modifier.add','chronicle.event']).forEach(function(id){
          adapters[id] = { stage:function(op){ return { before:0, after:op.value, token:{} }; }, commit:function(){}, rollback:function(){} };
        });
        return adapters;
      }
      function crCtx(C) {
        return { campaign:C, ruleset:{id:'historical',version:1}, side:'CS', timelineId:'timeline-1', battleId:'crater',
          phaseId:'result', actorId:'cs-command', sequence:1, actorTags:[{namespace:'side',value:'cs'}], adapters:fixtureAdapters() };
      }
      function crFixture(effects) {
        return { id:'fixture.cr-reward', rulesetId:'historical',
          availableWhen:[{id:'ruleset.is',value:'historical'},{id:'side.isActor'}],
          actorTags:[{namespace:'side',value:'actor'}], effects:effects,
          presentation:{label:'F',summary:'f',tone:'t',icon:'i'} };
      }
      var savedActions = dataDoc.actions, refused = 0;
      try {
        dataDoc.actions = savedActions.concat([crFixture([{operation:'morale.add',target:'actor',value:-1}])]);
        if (_mhResolve('fixture.cr-reward', crCtx(histCampaign('CS'))) === null) throw new Error('CONTROL failed: a legal consequence-only fixture must resolve (the reward refusals below would be vacuous)');
        for (var i = 0; i < rewardOps.length; i++) {
          dataDoc.actions = savedActions.concat([crFixture([{operation:rewardOps[i],target:'actor',value:1}])]);
          var C = histCampaign('CS');
          var cb = JSON.stringify(C);
          if (_mhResolve('fixture.cr-reward', crCtx(C)) !== null) throw new Error('reward family ' + rewardOps[i] + ' resolved under Historical (the massacre-block failed)');
          if (JSON.stringify(C) !== cb) throw new Error('the ' + rewardOps[i] + ' refusal mutated the campaign');
          refused++;
        }
      } finally { dataDoc.actions = savedActions; }
      // (d) the judged consequence-only action RESOLVES at battleId crater and moves
      // only the four consequence targets (the t3 contract at this battle id).
      var M = stamped;
      lootInit(M); moraleInit(M); pressInit(M); M.blockade = { recognition: 20 };
      var statsBytes = JSON.stringify(M.stats), lootBytes = JSON.stringify(M.loot.inventory);
      var receipt = mayhemNoQuarterHistApply(M);
      if (!receipt) throw new Error('the judged historical action must resolve at battleId crater');
      var opIds = receipt.operations.map(function(o){ return o.operation; }).join(',');
      if (opIds !== 'morale.add,press.add,diplomacy.add,notoriety.add') throw new Error('the op set drifted: ' + opIds);
      if (M.infamy.events.length !== 1 || M.infamy.events[0].battleId !== 'crater') throw new Error('the infamy ledger must record battleId crater (the direct stable id), got ' + JSON.stringify(M.infamy.events));
      if (JSON.stringify(M.stats) !== statsBytes) throw new Error('stats moved (score/infl)');
      if (JSON.stringify(M.loot.inventory) !== lootBytes) throw new Error('the loot inventory moved');
      if (M.stats.mayhemScore !== undefined) throw new Error('mayhemScore must stay absent');
      if (M.blockade.recognition >= 20) throw new Error('a CS actor\\'s recognition must move AGAINST the actor (down)');
      // (e) the Mayhem reward action STILL refuses under Historical at this offer.
      var H = histCampaign('CS'); H.mayhemNoQuarterOffer = { timelineId:'timeline-1', battleId:'crater', captured:187, consumed:false };
      var hb = JSON.stringify(H);
      if (_mhNoQuarterContext(H) !== null || mayhemNoQuarterApply(H) !== null || JSON.stringify(H) !== hb) throw new Error('the Mayhem reward path must still refuse under Historical with zero mutation');
      return { refusedRewardFamilies:refused, applied:opIds, infamyBattle:'crater' };
    });

    if (typeof fldExit === 'function') { try { fldExit(false); } catch(e) {} }
  } catch(e) { R.ok = false; R.errors.push(String(e && e.message || e)); }
  R.ok = R.ok && R.steps.every(function(s){ return s.ok; });
  return JSON.stringify(R);
})()`;

async function main() {
  const statics = staticChecks();
  let server = null, browser = null;
  try {
    const probe = 'http://127.0.0.1:' + cfg.port + '/civil_war_generals.html';
    if (!(await up(probe))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 80; i++) { if (await up(probe)) break; await sleep(150); }
    }
    try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
    catch(e) { browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
    const page = await browser.newPage({ viewport: cfg.viewport });
    await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch(e) {} });
    const pageerrors = [];
    page.on('pageerror', err => pageerrors.push(String(err.message)));
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(400);
    const data = JSON.parse(await page.evaluate(SETUP));
    data.steps = statics.concat(data.steps || []);
    data.pageerrors = pageerrors;
    data.ok = !!data.ok && statics.every(s => s.ok) && !pageerrors.length;
    writeFileSync(join(OUT, 'probe-crater.json'), JSON.stringify(data, null, 2));
    printResult(data);
    const fail = (data.steps || []).filter(s => !s.ok);
    if (!data.ok || fail.length || pageerrors.length) {
      for (const e of pageerrors) console.error('  PAGE ERROR:', e);
      process.exit(1);
    }
    console.log('ALL OK');
  } finally {
    await closeBrowserHard(browser);
    killChild(server);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error('FATAL:', e); process.exit(1); });
