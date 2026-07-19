#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-olustee.mjs - D470 playable Olustee / Ocean Pond (February 20, 1864); LANE-016.
// Verifies the one-commit runtime contract from docs/design/olustee-battle-build-spec.md
// (D465, the controlling law) from the D459 massacre-treatment family packet: registry/menu/
// meta integration at rank 65.5 (between chattanooga 65 and fortPillow 66, the documented
// D442 non-integer exception), the spec SS3 rank wall (Seymour/Finegan/Colquitt BRIG. GENS.
// - the Colquitt never-1864-MG lock; THE COLONELS' WALL incl. Barton COLONEL with the
// never-brevet-backdate law and Reed's death date as the CONTESTED Feb 26/27 spread - Feb 23
// is REFUTED and never appears), the dual-designation law (the display string "35th USCT
// (1st North Carolina Colored Volunteers)" exactly), the 8th USCT law (565 engaged; xp floor
// as the TRUE EXPERIENCE INPUT, never a damage penalty), the piecemeal reinforcement
// schedule that PRODUCES the honest Union defeat (never a winner gate), the corridor terrain
// (Ocean Pond / southern swamps bounding; Finegan's works BEHIND the fight line; the
// objective on the wagon-road/railroad junction), the spec SS7 extended D74 wall (incl. the
// Olustee temptations: green-troops penalty keys / scripted deaths / rearguard bonuses), the
// SS5 teaching teeth (five sourced cards incl. the rearguard/rope-train card, the
// contested-scale aftermath card WITH the ABT self-contradiction taught, and the hedged
// command-failure card), the SS6 dignity imagery scan, the 1710 Army Register pin, the
// 8-seed direction battery (CS breaks the line >=5/8 AND US-losses-exceed-CS >=5/8 -
// direction only, never a count gate), and the D457 no-quarter machinery teeth EXTENDING
// probe-mayhem-mode's t1-t6 family with battleId olustee (a lowercase id that PASSES
// _mhStableId directly - the crater-proven primary path). THE AFTERMATH IS NEVER
// IN-SCENARIO: this probe asserts its ABSENCE from the battle data and its resolution
// path's presence in the shipped machinery only.
// BIND A PREDECLARATION - tampering Colquitt's grade to "Maj. Gen." in the data must red
// EXACTLY the RANK WALL tooth.
// BIND B PREDECLARATION - cutting one teaching card below two sources must red EXACTLY
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
  console.log('probe-olustee ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

// ---- STATIC (node-side) teeth ----
function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };
  const raw = readFileSync(join(ROOT, 'data', 'olustee.json'), 'utf8');
  const j = JSON.parse(raw);
  const B = j.olustee;
  const allUnits = (B.oob.US || []).concat(B.oob.CS || []).concat(B.reinforcements || []);
  const byId = id => allUnits.find(u => u.id === id);

  check('D74 FORBIDDEN-KEY WALL (spec SS7, the extended list incl. the Olustee temptations: green-troops penalties / scripted deaths / rearguard bonuses): no per-battle lever key at any depth', () => {
    const bad = raw.match(/"(damage|dmg|damageMult|firepower|firepowerMult|fireScale|fireMult|fireMultiplier|killScale|killMult|casualtyScale|casualtyMult|lossMult|combatScale|battleDamage|battleFire|powerMult|moraleMult|routMult|captureMult|scoreBonus|scoreMult|winner|winOverride|victoryOverride|outcomeOverride|forceWin|winnerFudge|fudge|valorMult|heroism|rageMult|massacreMult|atrocityBonus|noQuarterBonus|surpriseBonus|surpriseMult|panicMult|collapseMult|greenPenalty|greenMult|rookiePenalty|rearguardBonus|rearguardMult|deathScript|scriptedDeath)"\s*:/g);
    if (bad) throw new Error('forbidden keys present: ' + bad.join(', '));
    return { clean:true };
  });

  check('SOURCES REGISTER: >=2 distinct families - Wikipedia x2, ABT x2 with the self-contradiction recorded, NPS FL005, battleofolustee.org hosted primaries, emergingcivilwar, the committed packet + spec', () => {
    const src = B.sources || [];
    if (new Set(src.map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('register below 2 distinct entries');
    const all = src.join(' | ');
    ['en.wikipedia.org/wiki/Battle_of_Olustee', 'battlefields.org/learn/articles/battle-olustee',
     'battlefields.org/learn/civil-war/battles/olustee', 'nps.gov/civilwar/search-battles-detail.htm?battleCode=FL005',
     'battleofolustee.org', '35th_United_States_Colored_Infantry', 'emergingcivilwar.com',
     'massacre-treatment-battle-build-research.md', 'olustee-battle-build-spec.md'].forEach(t => { if (all.indexOf(t) < 0) throw new Error('register missing ' + t); });
    if (all.indexOf('self-contradiction') < 0) throw new Error('the ABT self-contradiction caveat is missing from the register');
    return { entries:src.length };
  });

  check('SHAPE (spec SS2): single-phase (no phases key), attacker CS, defender US, fog OFF with the billiard-table disclosure, standard doctrine, US 5,500 / CS 5,000 with the ~5,400 single-family variant disclosed', () => {
    if (B.attacker !== 'CS' || B.defender !== 'US' || B.defaultFog !== false) throw new Error('role/fog contract failed');
    if (Object.prototype.hasOwnProperty.call(B, 'phases')) throw new Error('phases key present');
    if (B.assaultDoctrine !== 'standard') throw new Error('spec pins assaultDoctrine standard, got ' + B.assaultDoctrine);
    const men = side => (B.oob[side] || []).reduce((a, u) => a + (u.men || 0), 0) + (B.reinforcements || []).filter(r => r.side === side).reduce((a, u) => a + (u.men || 0), 0);
    const us = men('US'), cs = men('CS');
    if (us !== 5500) throw new Error('US encoded total ' + us + ' - the spec encodes the convergent ~5,500');
    if (cs !== 5000) throw new Error('CS encoded total ' + cs + ' - the spec encodes the two-family 5,000');
    if (raw.indexOf('~5,400') < 0 || raw.indexOf('battleofolustee.org') < 0) throw new Error('the 5,400 single-family variant disclosure is missing');
    if ((B.weather || {}).note === undefined || String(B.weather.note).indexOf('billiard table') < 0) throw new Error('the billiard-table open-ground disclosure is missing');
    return { us, cs };
  });

  check('RANK WALL (spec SS3): Seymour/Finegan/Colquitt BRIG. GENS. (Colquitt NEVER a 1864 Maj. Gen.); THE COLONELS\' WALL incl. Barton COLONEL (never the 1865 brevet backdated) and Reed\'s Feb 26/27 spread (Feb 23 REFUTED, never appears)', () => {
    ['Brig. Gen. Truman Seymour', 'Brig. Gen. Joseph Finegan', 'Brig. Gen. Alfred H. Colquitt',
     'Col. Charles W. Fribley', 'Col. William B. Barton', 'Col. Joseph R. Hawley',
     'Col. George P. Harrison Jr.', 'Col. Caraway Smith', 'Col. Guy V. Henry',
     'Lt. Col. Edward N. Hallowell', 'Lt. Col. William N. Reed'].forEach(s => {
      if (raw.indexOf(s) < 0) throw new Error('missing required rank rendering: ' + s);
    });
    if (/Maj(?:\.|or)?\s+Gen(?:\.|eral)?\s+(?:Alfred\s+H\.\s+)?Colquitt/i.test(raw)) throw new Error('a forbidden Maj.-Gen. Colquitt rendering exists (his major-general grade came only near the war\'s end)');
    if (raw.indexOf('September 1, 1862') < 0) throw new Error('the Colquitt to-rank-from note is missing');
    if (/Brig(?:\.|adier)?\s+Gen(?:\.|eral)?\s+(?:William\s+B\.\s+)?Barton/i.test(raw)) throw new Error('a forbidden Brig.-Gen. Barton rendering exists (the LoC caption is a March 1865 brevet)');
    if (raw.indexOf('March 1865 BREVET') < 0) throw new Error('the Barton brevet-trap disclosure is missing');
    if (/Feb(?:ruary|\.)?\s*23/i.test(raw)) throw new Error('a refuted Feb 23 Reed death date exists');
    if (raw.indexOf('February 27') < 0 || raw.indexOf('February 26') < 0) throw new Error('the Reed Feb 26/27 contested spread is missing');
    return { ok:true };
  });

  check('DUAL-DESIGNATION LAW (spec SS3): the display string is EXACTLY "35th USCT (1st North Carolina Colored Volunteers)"', () => {
    const u = byId('us_ol_35usct');
    if (!u || u.name !== '35th USCT (1st North Carolina Colored Volunteers)') throw new Error('the dual-designation display string is wrong: ' + (u && u.name));
    if (String(u.note).indexOf('twelve days') < 0) throw new Error('the redesignation-timing disclosure is missing');
    return { name:u.name };
  });

  check('THE 8th USCT LAW (spec SS3): 565 engaged (21 officers + 544 enlisted; the 300-of-500 prose variant disclosed never encoded); greenness as the TRUE EXPERIENCE INPUT, never a damage penalty', () => {
    const u = byId('us_ol_8usct');
    if (!u) throw new Error('the 8th USCT is missing');
    if (u.men !== 565) throw new Error('the 8th USCT must encode 565 engaged, got ' + u.men);
    if (u.xp !== 1) throw new Error('the greenness xp floor must be 1, got ' + u.xp);
    if (String(u.note).indexOf('TRUE EXPERIENCE INPUT') < 0 || String(u.note).indexOf('never a damage penalty') < 0) throw new Error('the xp-floor-not-penalty law is missing from the note');
    if (raw.indexOf('21 officers') < 0 || raw.indexOf('544 enlisted') < 0) throw new Error('the ABT-explicit breakdown is missing');
    if (raw.indexOf("'300 of 500'") < 0) throw new Error('the prose-variant disclosure is missing');
    return { men:u.men, xp:u.xp };
  });

  check('PIECEMEAL SCHEDULE (spec SS3): the Union commitment sequence 7th NH -> 8th USCT -> Barton -> 54th Mass -> 35th USCT as arrival inputs (the defeat\'s true cause); the staged CS commitment; the 7th NH break NEVER scripted', () => {
    const nh = byId('us_ol_7nh'), usct8 = byId('us_ol_8usct'), barton = byId('us_ol_barton'), ma54 = byId('us_ol_54ma'), usct35 = byId('us_ol_35usct');
    const harrison = byId('cs_ol_harrison'), reserve = byId('cs_ol_reserve');
    [nh, usct8, barton, ma54, usct35, harrison, reserve].forEach(u => { if (!u || typeof u.atSec !== 'number') throw new Error('a scheduled formation is missing its arrival input'); });
    if (!(nh.atSec < usct8.atSec && usct8.atSec < barton.atSec && barton.atSec < ma54.atSec && ma54.atSec < usct35.atSec)) throw new Error('the Union piecemeal sequence is wrong');
    if (!(harrison.atSec < reserve.atSec)) throw new Error('the staged CS commitment is wrong');
    if (!byId('us_ol_7ct') || byId('us_ol_7ct').atSec !== undefined) throw new Error('the 7th Connecticut advance must open ON the field');
    if (String(nh.note).indexOf('NEVER a scripted rout') < 0) throw new Error('the 7th NH never-scripted disclosure is missing');
    return { usWave:[nh.atSec, usct8.atSec, barton.atSec, ma54.atSec, usct35.atSec], csWave:[harrison.atSec, reserve.atSec] };
  });

  check('CORRIDOR TERRAIN (spec SS4): Ocean Pond seals the north (low x) and the swamps the south (high x); Finegan\'s works are BEHIND the fight at the CS rear; the objective is the wagon-road/railroad junction with both axis markers present', () => {
    const sw = B.terrain.swamps || [];
    const pond = sw.find(s => String(s.note).indexOf('OCEAN POND') >= 0);
    if (!pond) throw new Error('the Ocean Pond entry is missing');
    if (!(pond.x < 300)) throw new Error('Ocean Pond must seal the north (low x): ' + pond.x);
    const south = sw.filter(s => s !== pond);
    if (!south.length || !south.every(s => s.x > 800)) throw new Error('the southern swamps must seal the other flank (high x)');
    const works = (B.terrain.walls || []).find(w => String(w.note).indexOf('BEHIND THE FIGHT') >= 0);
    if (!works) throw new Error('the Finegan-works honest note is missing');
    if (!(Math.max(works.z1, works.z2) < 200)) throw new Error('the works must sit at the CS rear, never at the fight line');
    if (!B.objective || B.objective.name !== 'The wagon-road and railroad junction') throw new Error('the objective is wrong: ' + (B.objective && B.objective.name));
    const roads = (B.terrain.markers || []).filter(m => m.kind === 'road').map(m => m.name).join('|');
    if (roads.indexOf('Railroad') < 0 || roads.indexOf('wagon road') < 0) throw new Error('the rail/wagon-road axis markers are missing: ' + roads);
    return { pond:pond.x, works:Math.max(works.z1, works.z2) };
  });

  check('TEACHING (spec SS5): five sourced cards, each >=2 distinct sources; the rearguard/rope-train card; the contested-scale aftermath card WITH the ABT self-contradiction taught; the hedged command-failure card; the 54th loss spread recorded unpinned', () => {
    const cards = (B.teaching && B.teaching.cards) || [];
    const ids = cards.map(c => c.id);
    ['ol_rearguard', 'ol_aftermath', 'ol_political', 'ol_8usct', 'ol_command'].forEach(id => { if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
    if (cards.length !== 5) throw new Error('expected exactly 5 cards, got ' + cards.length);
    cards.forEach(c => { if (new Set((c.sources || []).map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('card lacks 2 distinct sources: ' + c.id); });
    const rg = cards.find(c => c.id === 'ol_rearguard');
    if (String(rg.body).indexOf('BY ROPE') < 0 || String(rg.body).indexOf('forty-two hours') < 0) throw new Error('the rope-train record is missing');
    ['54th Massachusetts', '35th USCT', '7th Connecticut'].forEach(t => { if (String(rg.body).indexOf(t) < 0) throw new Error('the rearguard card is missing ' + t); });
    const af = cards.find(c => c.id === 'ol_aftermath');
    if (String(af.body).indexOf("'killed most'") < 0 || String(af.body).indexOf("'killed a few'") < 0 || String(af.body).indexOf('self-contradiction') < 0) throw new Error('the ABT self-contradiction teaching is missing');
    if (String(af.body).indexOf('Penniman') < 0 || String(af.body).indexOf('70') < 0 || String(af.body).indexOf('Andersonville') < 0) throw new Error('the aftermath primary record is missing');
    if (String(af.body).indexOf('GENUINELY CONTESTED') < 0) throw new Error('the contested-scale framing is missing');
    const cm = cards.find(c => c.id === 'ol_command');
    if (String(cm.body).indexOf('1,861') < 0 || String(cm.body).indexOf('946') < 0 || String(cm.body).indexOf('34 percent') < 0) throw new Error('the loss record is missing');
    if (String(cm.body).indexOf('standing instructions') < 0) throw new Error('the command-context record is missing');
    if (String(cm.body).indexOf('declines to harden the superlative') < 0) throw new Error('the superlative hedge is missing');
    if (raw.indexOf('13/65/8 = 86') < 0 || raw.indexOf("8 killed, 70+ wounded") < 0) throw new Error('the 54th loss-conflict spread is missing');
    return { cards:ids };
  });

  check('CODEX AXES (spec SS5): campaign "Seymour\'s Florida expedition (Lincoln\'s Florida project)", result "Confederate victory", theater from the EXISTING vocabulary with its disclosure note', () => {
    const cx = (B.teaching && B.teaching.codex) || {};
    const ax = cx.axes || {};
    if (ax.campaign !== "Seymour's Florida expedition (Lincoln's Florida project)" || ax.result !== 'Confederate victory') throw new Error('codex axes wrong: ' + JSON.stringify(ax));
    if (['Eastern', 'Western', 'Multi', 'Trans-Mississippi'].indexOf(ax.theater) < 0) throw new Error('the theater must come from the EXISTING vocabulary, got ' + ax.theater);
    if (!cx._axesNote || String(cx._axesNote).indexOf('EXISTING axis vocabulary') < 0) throw new Error('the existing-vocabulary disclosure note is missing');
    return ax;
  });

  check('DIGNITY IMAGERY SCAN (spec SS6): no imagery key or reference anywhere in the scenario data; text carries the weight', () => {
    if (/"(img|image|images|imagery|photo|photos|footage|engraving|cutaway|scene|sceneId|media)"\s*:/i.test(raw)) throw new Error('an imagery key exists in the scenario data');
    if (/harper|engraving|\.jpe?g|\.png|\.gif|\.webp/i.test(raw)) throw new Error('an imagery reference exists in the scenario data');
    return { clean:true };
  });

  check('AFTERMATH NEVER IN-SCENARIO (spec SS1): no aftermath event, mechanic, casualty script, or scoring exists; the teaching names it and routes it to the D457 machinery', () => {
    if (Object.prototype.hasOwnProperty.call(B, 'events') || Object.prototype.hasOwnProperty.call(B, 'scripts') || Object.prototype.hasOwnProperty.call(B, 'casualtyScript')) throw new Error('an event/script key exists');
    if (raw.indexOf('THE AFTERMATH IS NEVER IN THIS SCENARIO') < 0) throw new Error('the _comment design lock is missing');
    if (raw.indexOf('no-quarter machinery') < 0) throw new Error('the D457 resolution-path teaching reference is missing');
    allUnits.forEach(u => { if (u.events || u.script) throw new Error('a formation carries an event/script key'); });
    return { ok:true };
  });

  check('INTEGRATION SOURCE PINS: T1 rank chain chattanooga 65 -> olustee 65.5 -> fortPillow 66 and the T10 E/false/first-national meta row exist in source', () => {
    const t1 = readFileSync(join(ROOT, 'src', 'tactical', 'T1-bull-run.js'), 'utf8');
    if (!/chattanooga:\s*65,\s*olustee:\s*65\.5,\s*fortPillow:\s*66/.test(t1)) throw new Error('menu rank chain chattanooga:65 -> olustee:65.5 -> fortPillow:66 missing');
    if (t1.indexOf('GAME_DATA.olustee && GAME_DATA.olustee.olustee') < 0) throw new Error('T1 registry line missing');
    const t10 = readFileSync(join(ROOT, 'src', 'tactical', 'T10-flags.js'), 'utf8');
    if (!/olustee:\s*\{ theater: "E", badges: false, csFlag: "first-national" \}/.test(t10)) throw new Error('T10 meta row missing');
    return { ok:true };
  });

  return steps;
}

// ---- BROWSER teeth ----
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
    fldLaunchSandbox({ renderer:'none', scenario:'olustee', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'CS', seed:opts.seed || 1 });
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

    check('REGISTRY: olustee registered at rank 65.5 - Feb 20 1864 lands after Chattanooga (65) and before Fort Pillow (66); attacker CS, defender US', function(){
      var reg = fldScenarioRegistry();
      if (!reg.olustee || reg.olustee.id !== 'olustee') throw new Error('olustee missing from the live registry');
      var rc = fldScenarioMenuRank('chattanooga'), ro = fldScenarioMenuRank('olustee'), rf = fldScenarioMenuRank('fortPillow');
      if (ro !== 65.5) throw new Error('menu rank must be 65.5, got ' + ro);
      if (!(rc < ro && ro < rf)) throw new Error('rank order wrong: ' + [rc, ro, rf].join(' / '));
      if (reg.olustee.attacker !== 'CS' || reg.olustee.defender !== 'US') throw new Error('role contract failed in the live registry');
      return { rank:ro };
    });

    check('T10 META: _FLD_BATTLE_META.olustee is theater E, badges false, csFlag first-national (the fortDonelson/elkhorn Inferred-representative precedent, disclosed in source)', function(){
      var m = _FLD_BATTLE_META.olustee;
      if (!m || m.theater !== 'E' || m.badges !== false || m.csFlag !== 'first-national') throw new Error('meta wrong: ' + JSON.stringify(m));
      return m;
    });

    check('LAUNCH: the field opens with 6 units (3 US advance - the 7th CT, Henry, the guns - / 3 CS concentrated) on the junction objective; single-phase; SEVEN scheduled formations (the piecemeal column + the staged CS commitment); fog OFF', function(){
      G.campaign = null;
      fldLaunchSandbox({ renderer:'none', scenario:'olustee', autoBoth:true, seed:12345 });
      if (__FIELD.units.length !== 6) throw new Error('want 6 opening units, got ' + __FIELD.units.length);
      var us = __FIELD.units.filter(function(u){ return u.side === 'US'; }).length;
      var cs = __FIELD.units.filter(function(u){ return u.side === 'CS'; }).length;
      if (us !== 3 || cs !== 3) throw new Error('want 3 US / 3 CS, got ' + us + '/' + cs);
      if (!__FIELD.objective || String(__FIELD.objective.name).indexOf('junction') < 0) throw new Error('objective is not the junction: ' + (__FIELD.objective && __FIELD.objective.name));
      if (__FIELD.phases !== null) throw new Error('single-phase battle leaked phase machinery');
      if ((__FIELD.reinforce || []).length !== 7) throw new Error('want 7 scheduled formations, got ' + (__FIELD.reinforce || []).length);
      if (__FIELD.fog !== false) throw new Error('fog must default OFF (spec SS2)');
      return { units:__FIELD.units.length, scheduled:(__FIELD.reinforce || []).length };
    });

    check('ARMY REGISTER PIN: 13 unique Olustee side-unit ids produce exact cmd/nco/pvt trios and current total 1710', function(){
      var reg = ssPersonRegistry();
      if (reg.people.length !== 1710) throw new Error('Army Register total is ' + reg.people.length + ', expected 1710');   // D470: 1671 -> 1710 — Olustee adds 13 unique side-unit ids x 3 slots (LANE-016, the D465 spec).
      var rows = [], groups = {};
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:olustee:') === 0) rows.push(origin);
      }
      if (rows.length !== 39) throw new Error('Olustee rows are ' + rows.length + ', expected 39 (13 units x cmd/nco/pvt)');
      rows.forEach(function(origin){
        var m = origin.match(/^ss:olustee:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Olustee slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var want = ['US:us_ol_7ct','US:us_ol_henry','US:us_ol_guns','US:us_ol_7nh','US:us_ol_8usct','US:us_ol_barton','US:us_ol_54ma','US:us_ol_35usct',
        'CS:cs_ol_colquitt','CS:cs_ol_smith','CS:cs_ol_guns','CS:cs_ol_harrison','CS:cs_ol_reserve'];
      var bad = want.filter(function(k){ var g = groups[k]; return !g || !g.cmd || !g.nco || !g.pvt; });
      if (bad.length) throw new Error('units without exact trios: ' + bad.join(', '));
      if (Object.keys(groups).length !== 13) throw new Error('unexpected Olustee unit groups: ' + Object.keys(groups).length);
      return { total:reg.people.length, rows:rows.length };
    });

    check('HISTORICAL DIRECTION (8 seeds): the CS attack breaks the line in the majority AND US losses exceed CS in the majority (direction only, never a count gate - D74; the honest defeat must EMERGE from the piecemeal schedule - fix INPUTS inside the sourced envelope if this fails, never a lever)', function(){
      var seeds = ${JSON.stringify(SEEDS)}, csBreaks = 0, usBleeds = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over') throw new Error('seed ' + seeds[i] + ' did not resolve');
        if (r.w === 'CS') csBreaks++;
        if (r.loss.US > r.loss.CS) usBleeds++;
        samples.push(seeds[i] + ':' + r.w + ' loss ' + r.loss.US + '-' + r.loss.CS);
      }
      if (csBreaks < 5) throw new Error('CS breaks below 5/8: ' + csBreaks + ' :: ' + samples.join(', '));
      if (usBleeds < 5) throw new Error('US-losses-exceed-CS below 5/8 (the ~2:1 direction; the winner bled less here): ' + usBleeds + ' :: ' + samples.join(', '));
      return { csBreaks:csBreaks + '/8', usBleeds:usBleeds + '/8', samples:samples };
    });

    check('NO NaN in unit state after a full run', function(){
      for (var i = 0; i < __FIELD.units.length; i++) {
        var u = __FIELD.units[i];
        if (!isFinite(u.x) || !isFinite(u.z) || !isFinite(u.men) || !isFinite(u.morale)) throw new Error('NaN in ' + u.id);
      }
      return { units:__FIELD.units.length };
    });

    check('NO-QUARTER MACHINERY (extends probe-mayhem-mode t1-t6 with battleId olustee): captures stamp the offer AT THE STABLE ID olustee (lowercase passes _mhStableId directly); EVERY reward family refuses under Historical; the judged action resolves consequences-only; the declined path is byte-identical', function(){
      if (typeof mayhemInit !== 'function' || typeof mayhemNoQuarterHistApply !== 'function' || typeof _mhNoQuarterHistContext !== 'function') throw new Error('the D457 machinery API is missing');
      var priorAdv = _MH_BASE_CAMPAIGN_ADVANCE, stamped = null;
      try {
        _MH_BASE_CAMPAIGN_ADVANCE = function () {};
        var N = histCampaign('CS'); G.campaign = N; G.battle = { id:'olustee' };
        var nb = JSON.stringify(N);
        campaignAdvance('CS', 'major');
        if (N.mayhemNoQuarterOffer !== undefined || JSON.stringify(N) !== nb) throw new Error('a no-captures Olustee resolve must stamp nothing (bytes unchanged)');
        G.battle = { id:'olustee', mayhemCapturedByPlayer:70 };
        campaignAdvance('CS', 'major');
        if (!N.mayhemNoQuarterOffer || N.mayhemNoQuarterOffer.captured !== 70) throw new Error('the Historical offer must stamp from the Olustee captured chain');
        if (N.mayhemNoQuarterOffer.battleId !== 'olustee') throw new Error('the lowercase olustee id must stamp DIRECTLY (no fallback), got ' + N.mayhemNoQuarterOffer.battleId);
        stamped = N;
      } finally { _MH_BASE_CAMPAIGN_ADVANCE = priorAdv; G.campaign = null; G.battle = null; }
      var declinedBytes = JSON.stringify(stamped);
      var panelHtml = mhJudgedNoQuarterPanel(stamped);
      if (panelHtml.indexOf('mh-judged') < 0 || panelHtml.indexOf('data-mh-no-quarter') < 0) throw new Error('the judged panel must render the offer + confirm button for the olustee capture');
      if (JSON.stringify(stamped) !== declinedBytes) throw new Error('the judged panel render mutated the campaign (it must be pure)');
      if (stamped.mayhemNoQuarterOffer.consumed !== false) throw new Error('the unconfirmed offer must stay unconsumed');
      if ((stamped.mayhemReceipts || []).length) throw new Error('the declined path must append no receipt');
      if (stamped.infamy !== undefined) throw new Error('the declined path must open no infamy ledger');
      var aarHtml = aarRenderReport(stamped, { final:false });
      if (aarHtml.indexOf('mh-judged') < 0) throw new Error('the judged panel must ride the Historical AAR with a live offer');
      if ((stamped.mayhemReceipts || []).length || stamped.mayhemNoQuarterOffer.consumed !== false || stamped.infamy !== undefined) throw new Error('the declined AAR render took a consequence (receipt/consumed/infamy moved)');
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
      function olCtx(C) {
        return { campaign:C, ruleset:{id:'historical',version:1}, side:'CS', timelineId:'timeline-1', battleId:'olustee',
          phaseId:'result', actorId:'cs-command', sequence:1, actorTags:[{namespace:'side',value:'cs'}], adapters:fixtureAdapters() };
      }
      function olFixture(effects) {
        return { id:'fixture.ol-reward', rulesetId:'historical',
          availableWhen:[{id:'ruleset.is',value:'historical'},{id:'side.isActor'}],
          actorTags:[{namespace:'side',value:'actor'}], effects:effects,
          presentation:{label:'F',summary:'f',tone:'t',icon:'i'} };
      }
      var savedActions = dataDoc.actions, refused = 0;
      try {
        dataDoc.actions = savedActions.concat([olFixture([{operation:'morale.add',target:'actor',value:-1}])]);
        if (_mhResolve('fixture.ol-reward', olCtx(histCampaign('CS'))) === null) throw new Error('CONTROL failed: a legal consequence-only fixture must resolve (the reward refusals below would be vacuous)');
        for (var i = 0; i < rewardOps.length; i++) {
          dataDoc.actions = savedActions.concat([olFixture([{operation:rewardOps[i],target:'actor',value:1}])]);
          var C = histCampaign('CS');
          var cb = JSON.stringify(C);
          if (_mhResolve('fixture.ol-reward', olCtx(C)) !== null) throw new Error('reward family ' + rewardOps[i] + ' resolved under Historical (the massacre-block failed)');
          if (JSON.stringify(C) !== cb) throw new Error('the ' + rewardOps[i] + ' refusal mutated the campaign');
          refused++;
        }
      } finally { dataDoc.actions = savedActions; }
      var M = stamped;
      lootInit(M); moraleInit(M); pressInit(M); M.blockade = { recognition: 20 };
      var statsBytes = JSON.stringify(M.stats), lootBytes = JSON.stringify(M.loot.inventory);
      var receipt = mayhemNoQuarterHistApply(M);
      if (!receipt) throw new Error('the judged historical action must resolve at battleId olustee');
      var opIds = receipt.operations.map(function(o){ return o.operation; }).join(',');
      if (opIds !== 'morale.add,press.add,diplomacy.add,notoriety.add') throw new Error('the op set drifted: ' + opIds);
      if (M.infamy.events.length !== 1 || M.infamy.events[0].battleId !== 'olustee') throw new Error('the infamy ledger must record battleId olustee (the direct stable id), got ' + JSON.stringify(M.infamy.events));
      if (JSON.stringify(M.stats) !== statsBytes) throw new Error('stats moved (score/infl)');
      if (JSON.stringify(M.loot.inventory) !== lootBytes) throw new Error('the loot inventory moved');
      if (M.stats.mayhemScore !== undefined) throw new Error('mayhemScore must stay absent');
      if (M.blockade.recognition >= 20) throw new Error('a CS actor\\'s recognition must move AGAINST the actor (down)');
      var H = histCampaign('CS'); H.mayhemNoQuarterOffer = { timelineId:'timeline-1', battleId:'olustee', captured:70, consumed:false };
      var hb = JSON.stringify(H);
      if (_mhNoQuarterContext(H) !== null || mayhemNoQuarterApply(H) !== null || JSON.stringify(H) !== hb) throw new Error('the Mayhem reward path must still refuse under Historical with zero mutation');
      return { refusedRewardFamilies:refused, applied:opIds, infamyBattle:'olustee' };
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
    writeFileSync(join(OUT, 'probe-olustee.json'), JSON.stringify(data, null, 2));
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
