#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-fort-pillow.mjs - D463 playable Fort Pillow (April 12, 1864); LANE-013 P4.
// Verifies the one-commit runtime contract from docs/design/fort-pillow-battle-build-spec.md
// (D462, the controlling law) under Aaron's D455 SS3 row 6 unlock: registry/menu/meta
// integration at rank 66 (between chattanooga 65 and wilderness 67), the spec SS3 rank wall
// (Forrest Maj. Gen. NEVER Brig./Lt. Gen.; Chalmers Brig. Gen.; Booth/Bradford Majors NEVER
// colonels or generals), the Bell/Buford attachment honesty, the 6th-USCHA designation trap,
// the three-formation garrison, the spec SS7 extended D74 forbidden-key wall (incl. the
// massacre-temptation keys), the SS5 teaching teeth (five sourced cards; the JCCW conclusion
// verbatim; the culpability debate taught AS a debate; the casualty record as attributed
// RANGES), the SS6 dignity imagery scan (no imagery reference anywhere in the scenario; the
// USS New Era fenced inside the fp_truce card - the cold-harbor fence idiom), the 1710 Army
// Register pin, the 8-seed direction battery (CS seizes >=5/8 AND US-losses-exceed-CS >=5/8 -
// direction only, never a count gate), and the D457 no-quarter machinery teeth EXTENDING
// probe-mayhem-mode's shipped t1-t6 family with battleId fortPillow: captures stamp the offer
// through the _MH_BASE_CAMPAIGN_ADVANCE override idiom; EVERY reward family refuses under
// Historical via fixture actions injected into GAME_DATA["mayhem-rules"].actions with
// restore; the declined/no-choice path is byte-identical. THE MASSACRE IS NEVER IN-SCENARIO:
// this probe asserts its ABSENCE from the battle data and its resolution path's presence in
// the shipped machinery only.
// BIND A PREDECLARATION - tampering Forrest's grade to "Brig. Gen." in the data must red
// EXACTLY the RANK WALL tooth.
// BIND B PREDECLARATION - dropping one teaching card's second source row must red EXACTLY
// the CARD-SOURCE tooth.
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
  console.log('probe-fort-pillow ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

// ---- STATIC (node-side) teeth: the scenario JSON + the cross-file T1/T10 contracts ----
function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };
  const raw = readFileSync(join(ROOT, 'data', 'fort-pillow.json'), 'utf8');
  const j = JSON.parse(raw);
  const B = j.fortPillow;

  check('D74 FORBIDDEN-KEY WALL (spec SS7, the extended list incl. the massacre-temptation keys): no per-battle lever key at any depth', () => {
    const bad = raw.match(/"(damage|dmg|damageMult|firepower|firepowerMult|fireScale|fireMult|fireMultiplier|killScale|killMult|casualtyScale|casualtyMult|lossMult|combatScale|battleDamage|battleFire|powerMult|moraleMult|routMult|captureMult|scoreBonus|scoreMult|winner|winOverride|victoryOverride|outcomeOverride|forceWin|winnerFudge|fudge|valorMult|heroism|rageMult|massacreMult|atrocityBonus|noQuarterBonus|surpriseBonus|surpriseMult|panicMult|collapseMult)"\s*:/g);
    if (bad) throw new Error('forbidden keys present: ' + bad.join(', '));
    return { clean:true };
  });

  check('SOURCES REGISTER: >=2 distinct families - the JCCW primary, Forrest OR primary, NPS x2, Cimprich/TN Encyclopedia, ABT x2, Wikipedia, the committed packet + spec', () => {
    const src = B.sources || [];
    if (new Set(src.map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('register below 2 distinct entries');
    const all = src.join(' | ');
    ['gutenberg.org/files/41787', 'confederatehistory.wixsite.com/forrest/fort-pillow-report',
     'nps.gov/civilwar/search-battles-detail.htm?battleCode=TN030', 'nps.gov/articles/000/hard-reality-of-fort-pillow.htm',
     'tennesseeencyclopedia.net/entries/fort-pillow', 'battlefields.org/learn/articles/most-terrible-ordeal-my-life-battle-fort-pillow',
     'en.wikipedia.org/wiki/Battle_of_Fort_Pillow',
     'massacre-treatment-battle-build-research.md', 'fort-pillow-battle-build-spec.md'].forEach(t => { if (all.indexOf(t) < 0) throw new Error('register missing ' + t); });
    return { entries:src.length };
  });

  check('SHAPE (spec SS2): single-phase (no phases key), attacker CS, defender US, fog OFF disclosed, standard doctrine, sourced strengths encoded with ranges disclosed', () => {
    if (B.attacker !== 'CS' || B.defender !== 'US' || B.defaultFog !== false) throw new Error('role/fog contract failed');
    if (Object.prototype.hasOwnProperty.call(B, 'phases')) throw new Error('phases key present - the day-shape is teaching prose, never phases');
    if (B.assaultDoctrine !== 'standard') throw new Error('spec pins assaultDoctrine standard, got ' + B.assaultDoctrine);
    const men = side => (B.oob[side] || []).reduce((a, u) => a + (u.men || 0), 0) + (B.reinforcements || []).filter(r => r.side === side).reduce((a, u) => a + (u.men || 0), 0);
    const us = men('US'), cs = men('CS');
    if (us !== 535) throw new Error('US encoded total ' + us + ' - the spec encodes NPS 557 as 535 (the 40-per-gun crew cap, residual disclosed)');
    if (cs < 1500 || cs > 2500) throw new Error('CS encoded total ' + cs + ' outside the sourced 1,500-2,500 range');
    if (raw.indexOf('1,500-2,500') < 0) throw new Error('the CS range disclosure is missing from provenance');
    if (raw.indexOf('585-605') < 0) throw new Error('the present-for-duty band disclosure is missing');
    if ((B.weather || {}).note === undefined || String(B.weather.note).indexOf('operational tempo') < 0) throw new Error('the fog-OFF operational-tempo disclosure is missing');
    return { us, cs };
  });

  check('RANK WALL (spec SS3): exact battle-date grades; Forrest NEVER Brig. or Lt. Gen.; Booth/Bradford NEVER colonels or generals', () => {
    ['Maj. Gen. Nathan Bedford Forrest', 'Brig. Gen. James R. Chalmers',
     'Maj. Lionel F. Booth', 'Maj. William F. Bradford'].forEach(s => {
      if (raw.indexOf(s) < 0) throw new Error('missing required rank rendering: ' + s);
    });
    if (/(?:Brig\.|Brigadier|Lt\.|Lieutenant)\s+Gen(?:\.|eral)\s+(?:Nathan\s+Bedford\s+)?Forrest/i.test(raw)) throw new Error('a forbidden Forrest grade rendering exists');
    if (/(?:Col\.|Colonel|Gen\.|General)\s+(?:Lionel\s+F\.\s+)?Booth/i.test(raw)) throw new Error('a forbidden Booth grade rendering exists');
    if (/(?:Col\.|Colonel|Gen\.|General)\s+(?:William\s+F\.\s+)?Bradford/i.test(raw)) throw new Error('a forbidden Bradford grade rendering exists');
    if (raw.indexOf('never brigadier, never lieutenant general here') < 0) throw new Error('the Forrest grade-lock note is missing');
    if (raw.indexOf('Neither Booth nor Bradford was ever a colonel') < 0) throw new Error('the Booth/Bradford never-colonels note is missing');
    return { ok:true };
  });

  check('ORGANIZATION HONESTY (spec SS3): Bell\'s brigade of BUFORD\'s division attached to Chalmers per Forrest\'s own report; McCulloch of Chalmers\'s division', () => {
    if (raw.indexOf("Bell's Brigade (Buford's Division, attached to Chalmers)") < 0) throw new Error('the Bell/Buford attachment unit name is missing');
    if (raw.indexOf('attached to Chalmers for this operation') < 0) throw new Error('the attachment note is missing');
    if (raw.indexOf("McCulloch's Brigade (Chalmers's Division)") < 0) throw new Error('the McCulloch/Chalmers organization is missing');
    return { ok:true };
  });

  check('GARRISON (spec SS3): the three formations named (6th USCHA four companies + the Battery D 2nd USCLA section + 13th Tennessee Cavalry), the designation trap shipped, guns 6, crews capped 40/gun with the residual disclosed', () => {
    const us = B.oob.US || [];
    if (us.length !== 2) throw new Error('US fields ' + us.length + ' units, expected 2 (the artillery formation folds the Battery D section)');
    const art = us.find(u => u.id === 'us_fp_6uscha'), tn = us.find(u => u.id === 'us_fp_13tn');
    if (!art || !tn) throw new Error('us_fp_6uscha / us_fp_13tn missing');
    if (art.name.indexOf('6th U.S. Colored Heavy Artillery') < 0 || art.name.indexOf('Battery D, 2nd U.S. Colored Light Artillery') < 0) throw new Error('the artillery formation names are wrong');
    if (tn.name.indexOf('13th Tennessee Cavalry') < 0 || tn.name.indexOf('Bradford') < 0) throw new Error('the 13th Tennessee identity is wrong');
    if (art.arm !== 'art' || art.guns !== 6) throw new Error('the six-gun armament is wrong: ' + art.guns);
    if (art.men !== 240) throw new Error('the 40-per-gun crew cap encoding is wrong: ' + art.men);
    if (String(art.note).indexOf('DESIGNATION TRAP') < 0 || String(art.note).indexOf('March 11 to April 26, 1864') < 0) throw new Error('the 6th-USCHA designation trap note is missing');
    if (String(art.note).indexOf('residual') < 0) throw new Error('the crew-cap residual disclosure is missing');
    if (tn.men !== 295) throw new Error('the NPS white-garrison figure is wrong: ' + tn.men);
    const cs = B.oob.CS || [];
    if (cs.length !== 3) throw new Error('CS fields ' + cs.length + ' units, expected 3');
    if (cs.reduce((a,u)=>a+u.men,0) !== 1500) throw new Error('the CS 720/720/60 split must total the encoded 1,500');
    return { usUnits:us.length, csUnits:cs.length };
  });

  check('TEACHING (spec SS5): five sourced cards, each >=2 distinct sources; the JCCW conclusion VERBATIM; the culpability debate taught AS a debate; the casualty record as attributed RANGES', () => {
    const cards = (B.teaching && B.teaching.cards) || [];
    const ids = cards.map(c => c.id);
    ['fp_massacre_named', 'fp_remember', 'fp_casualty_range', 'fp_garrison', 'fp_truce'].forEach(id => { if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
    if (cards.length !== 5) throw new Error('expected exactly 5 cards, got ' + cards.length);
    cards.forEach(c => { if (new Set((c.sources || []).map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('card lacks 2 distinct sources: ' + c.id); });
    if (raw.indexOf('the results of a policy deliberately decided upon') < 0) throw new Error('the JCCW conclusion verbatim is missing');
    const named = cards.find(c => c.id === 'fp_massacre_named');
    if (String(named.body).indexOf('teaches that debate as a debate') < 0 || String(named.body).indexOf('remains genuinely debated') < 0) throw new Error('the culpability debate must be taught AS a debate');
    if (!/ordered the killing, condoned it, or failed to halt it/.test(named.body)) throw new Error('the three-way culpability frame is missing');
    const range = cards.find(c => c.id === 'fp_casualty_range');
    ['228', '277-297', '300-400', '58-80', '100-168'].forEach(t => { if (String(range.body).indexOf(t) < 0) throw new Error('the casualty-range card is missing the attributed figure ' + t); });
    if (String(range.body).indexOf('counts are contested; the disproportion is not') < 0) throw new Error('the direction-certain framing is missing');
    return { cards:ids };
  });

  check('CODEX AXES (spec SS5): theater Western, campaign "Forrest\'s 1864 West Tennessee raid", result "Confederate victory"', () => {
    const ax = (B.teaching && B.teaching.codex && B.teaching.codex.axes) || {};
    if (ax.theater !== 'Western' || ax.campaign !== "Forrest's 1864 West Tennessee raid" || ax.result !== 'Confederate victory') throw new Error('codex axes wrong: ' + JSON.stringify(ax));
    return ax;
  });

  check('DIGNITY IMAGERY SCAN (spec SS6): no imagery key or reference anywhere in the scenario data; text carries the weight', () => {
    if (/"(img|image|images|imagery|photo|photos|footage|engraving|cutaway|scene|sceneId|media)"\s*:/i.test(raw)) throw new Error('an imagery key exists in the scenario data');
    if (/harper|engraving|\.jpe?g|\.png|\.gif|\.webp/i.test(raw)) throw new Error('an imagery reference exists in the scenario data');
    return { clean:true };
  });

  check('THE NEW ERA FENCE (the cold-harbor fence idiom): the gunboat appears ONLY inside the fp_truce card - never as a unit, mechanic, or stray claim', () => {
    const copy = JSON.parse(raw);
    copy.fortPillow.teaching.cards = copy.fortPillow.teaching.cards.filter(c => c.id !== 'fp_truce');
    if (/New Era/i.test(JSON.stringify(copy))) throw new Error('the USS New Era leaked outside its fenced teaching card');
    const inCard = JSON.stringify((JSON.parse(raw).fortPillow.teaching.cards || []).filter(c => c.id === 'fp_truce'));
    if (!/New Era/.test(inCard)) throw new Error('the fenced card no longer teaches the gunboat record');
    if (!(B.oob.US || []).every(u => u.arm !== 'nav')) throw new Error('a naval unit exists (the no-naval-engine law)');
    return { fenced:true };
  });

  check('MASSACRE NEVER IN-SCENARIO (spec SS1): no massacre event, mechanic, casualty script, or scoring exists; the teaching names it and routes it to the D457 machinery', () => {
    if (Object.prototype.hasOwnProperty.call(B, 'events') || Object.prototype.hasOwnProperty.call(B, 'scripts') || Object.prototype.hasOwnProperty.call(B, 'casualtyScript')) throw new Error('an event/script key exists');
    if (raw.indexOf('THE MASSACRE IS NEVER IN THIS SCENARIO') < 0) throw new Error('the _comment design lock is missing');
    if (raw.indexOf('no-quarter machinery') < 0) throw new Error('the D457 resolution-path teaching reference is missing');
    if ((B.reinforcements || []).length !== 0) throw new Error('the single-phase assault schedules no reinforcements');
    return { ok:true };
  });

  check('INTEGRATION SOURCE PINS: T1 rank chain chattanooga 65 -> fortPillow 66 -> wilderness 67 and the T10 W/false/anv meta row exist in source', () => {
    const t1 = readFileSync(join(ROOT, 'src', 'tactical', 'T1-bull-run.js'), 'utf8');
    if (!/chattanooga:\s*65,\s*olustee:\s*65\.5,\s*fortPillow:\s*66,\s*wilderness:\s*67/.test(t1)) throw new Error('menu rank chain chattanooga:65 -> olustee:65.5 -> fortPillow:66 -> wilderness:67 missing');   // D470 re-pin: olustee (rank 65.5, Feb 20 1864) inserts between chattanooga and fortPillow per the D465 spec SS2 (LANE-016).
    if (t1.indexOf('GAME_DATA["fort-pillow"] && GAME_DATA["fort-pillow"].fortPillow') < 0) throw new Error('T1 registry line missing');
    const t10 = readFileSync(join(ROOT, 'src', 'tactical', 'T10-flags.js'), 'utf8');
    if (!/fortPillow:\s*\{ theater: "W", badges: false, csFlag: "anv" \}/.test(t10)) throw new Error('T10 meta row missing');
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
    fldLaunchSandbox({ renderer:'none', scenario:'fortPillow', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'CS', seed:opts.seed || 1 });
    var start = { US:dataStrength(__FIELD.scenData, 'US'), CS:dataStrength(__FIELD.scenData, 'CS') };
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 120000;
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

    check('REGISTRY: fortPillow registered at rank 66 - Apr 12 1864 lands after Chattanooga (65) and before the Wilderness (67); attacker CS, defender US', function(){
      var reg = fldScenarioRegistry();
      if (!reg.fortPillow || reg.fortPillow.id !== 'fortPillow') throw new Error('fortPillow missing from the live registry');
      var rc = fldScenarioMenuRank('chattanooga'), rf = fldScenarioMenuRank('fortPillow'), rw = fldScenarioMenuRank('wilderness');
      if (rf !== 66) throw new Error('menu rank must be 66, got ' + rf);
      if (!(rc < rf && rf < rw)) throw new Error('rank order wrong: ' + [rc, rf, rw].join(' / '));
      if (reg.fortPillow.attacker !== 'CS' || reg.fortPillow.defender !== 'US') throw new Error('role contract failed in the live registry');
      return { rank:rf };
    });

    check('T10 META: _FLD_BATTLE_META.fortPillow is theater W, badges false, csFlag anv (the Inferred representative family, disclosed in source)', function(){
      var m = _FLD_BATTLE_META.fortPillow;
      if (!m || m.theater !== 'W' || m.badges !== false || m.csFlag !== 'anv') throw new Error('meta wrong: ' + JSON.stringify(m));
      return m;
    });

    check('LAUNCH: the field opens with 5 units (2 US garrison / 3 CS assault) on the inner-fort objective; single-phase; no reinforcements; fog OFF', function(){
      G.campaign = null;
      fldLaunchSandbox({ renderer:'none', scenario:'fortPillow', autoBoth:true, seed:12345 });
      if (__FIELD.units.length !== 5) throw new Error('want 5 opening units, got ' + __FIELD.units.length);
      var us = __FIELD.units.filter(function(u){ return u.side === 'US'; }).length;
      var cs = __FIELD.units.filter(function(u){ return u.side === 'CS'; }).length;
      if (us !== 2 || cs !== 3) throw new Error('want 2 US / 3 CS, got ' + us + '/' + cs);
      if (!__FIELD.objective || String(__FIELD.objective.name).indexOf('inner fort') < 0) throw new Error('objective is not the inner fort: ' + (__FIELD.objective && __FIELD.objective.name));
      if (__FIELD.phases !== null) throw new Error('single-phase battle leaked phase machinery');
      if ((__FIELD.reinforce || []).length !== 0) throw new Error('want zero scheduled reinforcements, got ' + (__FIELD.reinforce || []).length);
      if (__FIELD.fog !== false) throw new Error('fog must default OFF (spec SS2)');
      return { units:__FIELD.units.length };
    });

    check('ARMY REGISTER PIN: 5 unique Fort Pillow side-unit ids produce exact cmd/nco/pvt trios and current total 1710', function(){
      var reg = ssPersonRegistry();
      if (reg.people.length !== 1710) throw new Error('Army Register total is ' + reg.people.length + ', expected 1710');   // D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (LANE-013 P4, the D455 SS3 row 6 unlock). D469: 1632 -> 1671 — The Crater adds 13 unique side-unit ids x 3 slots (LANE-015, the D464 spec). D470: 1671 -> 1710 — Olustee adds 13 unique side-unit ids x 3 slots (LANE-016, the D465 spec).
      var rows = [], groups = {};
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:fortPillow:') === 0) rows.push(origin);
      }
      if (rows.length !== 15) throw new Error('Fort Pillow rows are ' + rows.length + ', expected 15 (5 units x cmd/nco/pvt)');
      rows.forEach(function(origin){
        var m = origin.match(/^ss:fortPillow:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Fort Pillow slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var want = ['US:us_fp_6uscha','US:us_fp_13tn','CS:cs_fp_mcculloch','CS:cs_fp_bell','CS:cs_fp_sharp'];
      var bad = want.filter(function(k){ var g = groups[k]; return !g || !g.cmd || !g.nco || !g.pvt; });
      if (bad.length) throw new Error('units without exact trios: ' + bad.join(', '));
      if (Object.keys(groups).length !== 5) throw new Error('unexpected Fort Pillow unit groups: ' + Object.keys(groups).length);
      return { total:reg.people.length, rows:rows.length };
    });

    check('HISTORICAL DIRECTION (8 seeds): the CS attacker seizes the works in the majority AND US losses exceed CS in the majority (direction only, never a count gate - D74; fix INPUTS within the sourced 1,500-2,500 range if this fails, never a lever)', function(){
      var seeds = ${JSON.stringify(SEEDS)}, csSeizes = 0, usBleeds = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over') throw new Error('seed ' + seeds[i] + ' did not resolve');
        if (r.w === 'CS') csSeizes++;
        if (r.loss.US > r.loss.CS) usBleeds++;
        samples.push(seeds[i] + ':' + r.w + ' loss ' + r.loss.US + '-' + r.loss.CS);
      }
      if (csSeizes < 5) throw new Error('CS seizes below 5/8: ' + csSeizes + ' :: ' + samples.join(', '));
      if (usBleeds < 5) throw new Error('US-losses-exceed-CS below 5/8 (every reputable figure agrees on the direction): ' + usBleeds + ' :: ' + samples.join(', '));
      return { csSeizes:csSeizes + '/8', usBleeds:usBleeds + '/8', samples:samples };
    });

    check('NO NaN in unit state after a full run', function(){
      for (var i = 0; i < __FIELD.units.length; i++) {
        var u = __FIELD.units[i];
        if (!isFinite(u.x) || !isFinite(u.z) || !isFinite(u.men) || !isFinite(u.morale)) throw new Error('NaN in ' + u.id);
      }
      return { units:__FIELD.units.length };
    });

    check('NO-QUARTER MACHINERY (extends probe-mayhem-mode t1-t6 with battleId fortPillow): captures stamp the offer; EVERY reward family refuses under Historical; the judged action resolves consequences-only; the declined path is byte-identical', function(){
      if (typeof mayhemInit !== 'function' || typeof mayhemNoQuarterHistApply !== 'function' || typeof _mhNoQuarterHistContext !== 'function') throw new Error('the D457 machinery API is missing');
      // (a) the offer stamps from the captured chain at the Fort Pillow battle (the
      // _MH_BASE_CAMPAIGN_ADVANCE override idiom; no captures -> no stamp -> bytes unchanged).
      // THE STABLE-ID LAW, DOCUMENTED: _mhStableId is lowercase-only, so the camelCase
      // scenario id 'fortPillow' falls back to the offer's 'battle-N' naming BY DESIGN
      // (the shipped D457 fail-safe; same for every camelCase scenario). The tooth pins
      // that documented behavior - captured count and stamp shape are the contract.
      var priorAdv = _MH_BASE_CAMPAIGN_ADVANCE, stamped = null;
      try {
        _MH_BASE_CAMPAIGN_ADVANCE = function () {};
        var N = histCampaign('CS'); G.campaign = N; G.battle = { id:'fortPillow' };
        var nb = JSON.stringify(N);
        campaignAdvance('CS', 'major');
        if (N.mayhemNoQuarterOffer !== undefined || JSON.stringify(N) !== nb) throw new Error('a no-captures Fort Pillow resolve must stamp nothing (bytes unchanged)');
        G.battle = { id:'fortPillow', mayhemCapturedByPlayer:226 };
        campaignAdvance('CS', 'major');
        if (!N.mayhemNoQuarterOffer || N.mayhemNoQuarterOffer.captured !== 226) throw new Error('the Historical offer must stamp from the Fort Pillow captured chain');
        if (N.mayhemNoQuarterOffer.battleId !== 'battle-1') throw new Error('the camelCase fortPillow id must take the documented stable-id fallback battle-1, got ' + N.mayhemNoQuarterOffer.battleId);
        stamped = N;
      } finally { _MH_BASE_CAMPAIGN_ADVANCE = priorAdv; G.campaign = null; G.battle = null; }
      // (b) the DECLINED path leaves no consequence: the judged PANEL is a pure render
      // (the D457 purity contract - byte-identical campaign before/after), and declining
      // (never confirming) appends no receipt, consumes nothing, and opens no infamy.
      // (The FULL AAR render may lazily initialize domain state - that is the base
      // grading surface's own shipped behavior, not this scenario's.)
      var declinedBytes = JSON.stringify(stamped);
      var panelHtml = mhJudgedNoQuarterPanel(stamped);
      if (panelHtml.indexOf('mh-judged') < 0 || panelHtml.indexOf('data-mh-no-quarter') < 0) throw new Error('the judged panel must render the offer + confirm button for the fortPillow capture');
      if (JSON.stringify(stamped) !== declinedBytes) throw new Error('the judged panel render mutated the campaign (it must be pure)');
      if (stamped.mayhemNoQuarterOffer.consumed !== false) throw new Error('the unconfirmed offer must stay unconsumed');
      if ((stamped.mayhemReceipts || []).length) throw new Error('the declined path must append no receipt');
      if (stamped.infamy !== undefined) throw new Error('the declined path must open no infamy ledger');
      var aarHtml = aarRenderReport(stamped, { final:false });
      if (aarHtml.indexOf('mh-judged') < 0) throw new Error('the judged panel must ride the Historical AAR with a live offer');
      if ((stamped.mayhemReceipts || []).length || stamped.mayhemNoQuarterOffer.consumed !== false || stamped.infamy !== undefined) throw new Error('the declined AAR render took a consequence (receipt/consumed/infamy moved)');
      // (c) EVERY reward operation family refuses under Historical at battleId fortPillow -
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
      // the fixture battleId uses the stable-id form 'fort-pillow' so the context itself is
      // LEGAL and the massacre-block is the ONLY refuser (the t1 full-coverage idiom); the
      // consequence-only CONTROL below proves the refusals are not vacuous.
      function fpCtx(C) {
        return { campaign:C, ruleset:{id:'historical',version:1}, side:'CS', timelineId:'timeline-1', battleId:'fort-pillow',
          phaseId:'result', actorId:'cs-command', sequence:1, actorTags:[{namespace:'side',value:'cs'}], adapters:fixtureAdapters() };
      }
      function fpFixture(effects) {
        return { id:'fixture.fp-reward', rulesetId:'historical',
          availableWhen:[{id:'ruleset.is',value:'historical'},{id:'side.isActor'}],
          actorTags:[{namespace:'side',value:'actor'}], effects:effects,
          presentation:{label:'F',summary:'f',tone:'t',icon:'i'} };
      }
      var savedActions = dataDoc.actions, refused = 0;
      try {
        dataDoc.actions = savedActions.concat([fpFixture([{operation:'morale.add',target:'actor',value:-1}])]);
        if (_mhResolve('fixture.fp-reward', fpCtx(histCampaign('CS'))) === null) throw new Error('CONTROL failed: a legal consequence-only fixture must resolve (the reward refusals below would be vacuous)');
        for (var i = 0; i < rewardOps.length; i++) {
          dataDoc.actions = savedActions.concat([fpFixture([{operation:rewardOps[i],target:'actor',value:1}])]);
          var C = histCampaign('CS');
          var cb = JSON.stringify(C);
          if (_mhResolve('fixture.fp-reward', fpCtx(C)) !== null) throw new Error('reward family ' + rewardOps[i] + ' resolved under Historical (the massacre-block failed)');
          if (JSON.stringify(C) !== cb) throw new Error('the ' + rewardOps[i] + ' refusal mutated the campaign');
          refused++;
        }
      } finally { dataDoc.actions = savedActions; }
      // (d) the judged consequence-only action RESOLVES at battleId fortPillow and moves
      // only the four consequence targets (the t3 contract at this battle id).
      var M = stamped;
      lootInit(M); moraleInit(M); pressInit(M); M.blockade = { recognition: 20 };
      var statsBytes = JSON.stringify(M.stats), lootBytes = JSON.stringify(M.loot.inventory);
      var receipt = mayhemNoQuarterHistApply(M);
      if (!receipt) throw new Error('the judged historical action must resolve at battleId fortPillow');
      var opIds = receipt.operations.map(function(o){ return o.operation; }).join(',');
      if (opIds !== 'morale.add,press.add,diplomacy.add,notoriety.add') throw new Error('the op set drifted: ' + opIds);
      if (M.infamy.events.length !== 1 || M.infamy.events[0].battleId !== 'battle-1') throw new Error('the infamy ledger must record the offer battle id (the documented stable-id fallback), got ' + JSON.stringify(M.infamy.events));
      if (JSON.stringify(M.stats) !== statsBytes) throw new Error('stats moved (score/infl)');
      if (JSON.stringify(M.loot.inventory) !== lootBytes) throw new Error('the loot inventory moved');
      if (M.stats.mayhemScore !== undefined) throw new Error('mayhemScore must stay absent');
      if (M.blockade.recognition >= 20) throw new Error('a CS actor\\'s recognition must move AGAINST the actor (down)');
      // (e) the Mayhem reward action STILL refuses under Historical at this offer (the t4
      // surviving half at battleId fortPillow).
      var H = histCampaign('CS'); H.mayhemNoQuarterOffer = { timelineId:'timeline-1', battleId:'fort-pillow', captured:226, consumed:false };
      var hb = JSON.stringify(H);
      if (_mhNoQuarterContext(H) !== null || mayhemNoQuarterApply(H) !== null || JSON.stringify(H) !== hb) throw new Error('the Mayhem reward path must still refuse under Historical with zero mutation');
      return { refusedRewardFamilies:refused, applied:opIds, infamyBattle:'fortPillow' };
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
    writeFileSync(join(OUT, 'probe-fort-pillow.json'), JSON.stringify(data, null, 2));
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
