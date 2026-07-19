#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-cold-harbor.mjs - D442 playable Cold Harbor (June 3, 1864).
// AUTHORED under the D431 coding-first law (VETTING DEFERRED; the audit session runs it —
// AUDIT-DEBT AD-10). Verifies the single-phase contract from
// docs/design/cold-harbor-battle-build-spec.md: registry/menu/meta integration at the
// documented non-integer rank 68.5 (between spotsylvania 68 and petersburgAssaults 69),
// the spec §2 rank wall (Grant Lt. Gen. general-in-chief / Meade command frame /
// Wright-not-his-predecessor / Anderson's disclosed temporary lieutenant-generalcy /
// Gibbon's reverse anachronism / the dead-officer wall), the §4 landmarks, the D74
// forbidden-key wall, the fenced thirty-minute casualty tradition (digits live ONLY in
// the ch_seven_thousand card), the 4e-2 sources register, the 1632 Army Register pin,
// and the 8-seed direction battery (CS holds >=5/8 AND US losses exceed CS >=5/8 —
// direction only, never a count gate).
// BIND A PREDECLARATION - removing the T1 registry line must red exactly the REGISTRY tooth.
// BIND B PREDECLARATION - tampering a data rank (e.g. Grant to full General) must red exactly
// the RANK WALL tooth.
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
  console.log('probe-cold-harbor ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

// ---- STATIC (node-side) teeth: the scenario JSON + the cross-file T1/T10 contracts ----
function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };
  const raw = readFileSync(join(ROOT, 'data', 'cold-harbor.json'), 'utf8');
  const j = JSON.parse(raw);
  const B = j.coldHarbor;

  check('D74 FORBIDDEN-KEY WALL: no per-battle damage/firepower/casualty/winner lever key anywhere in the scenario JSON', () => {
    const bad = raw.match(/"(damage|dmg|fireMult|fireMultiplier|casualtyMult|lossMult|killMult|powerMult|fudge)"\s*:/g);
    if (bad) throw new Error('forbidden keys present: ' + bad.join(', '));
    return { clean:true };
  });

  check('4e-2 SOURCES REGISTER: >=2 distinct register entries naming the packet-fetched ABT page, the two live-fetched pages, and the committed packet + spec', () => {
    const src = B.sources || [];
    if (new Set(src.map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('register below 2 distinct entries');
    const all = src.join(' | ');
    ['battlefields.org/learn/civil-war/battles/cold-harbor', 'en.wikipedia.org/wiki/Battle_of_Cold_Harbor', 'nps.gov/rich/learn/historyculture/cold-harbor.htm', '1864-65-attrition-battle-build-research.md', 'cold-harbor-battle-build-spec.md'].forEach(t => { if (all.indexOf(t) < 0) throw new Error('register missing ' + t); });
    return { entries:src.length };
  });

  check('SHAPE (spec §1): single-phase (no phases key), attacker US, defender CS, fog OFF, standard doctrine, envelopes honored', () => {
    if (B.attacker !== 'US' || B.defender !== 'CS' || B.defaultFog !== false) throw new Error('role/fog contract failed');
    if (Object.prototype.hasOwnProperty.call(B, 'phases')) throw new Error('phases key present - the June 1-12 trench period must be teaching prose, never a phase');
    if (B.assaultDoctrine !== 'standard') throw new Error('spec §1 pins assaultDoctrine standard, got ' + B.assaultDoctrine);
    const men = side => (B.oob[side] || []).reduce((a, u) => a + (u.men || 0), 0) + (B.reinforcements || []).filter(r => r.side === side).reduce((a, u) => a + (u.men || 0), 0);
    const us = men('US'), cs = men('CS');
    if (us < 15000 || us > 25000) throw new Error('US engaged total ' + us + ' outside the committed envelope [15000, 25000]');
    if (cs < 10000 || cs > 18000) throw new Error('CS engaged total ' + cs + ' outside the committed envelope [10000, 18000]');
    return { us, cs };
  });

  check('RANK WALL (spec §2): Grant Lt. Gen. general-in-chief (never full General), Meade commands the AotP, Wright Maj. Gen. VI, Smith Maj. Gen. XVIII on loan, Anderson temporary Lt. Gen. disclosed, Hoke independent, Breckinridge Maj. Gen., Barlow + Gibbon Brig. Gens. with the June 7 reverse anachronism', () => {
    ['Lt. Gen. Ulysses S. Grant', 'Maj. Gen. George G. Meade', 'Maj. Gen. Winfield S. Hancock',
     'Maj. Gen. Horatio G. Wright', 'Maj. Gen. William F. Smith', 'Gen. Robert E. Lee',
     'Lt. Gen. Richard H. Anderson', 'Maj. Gen. Robert F. Hoke', 'Maj. Gen. John C. Breckinridge',
     'Brig. Gen. Francis C. Barlow', 'Brig. Gen. John Gibbon', 'Lt. Gen. A. P. Hill'].forEach(s => {
      if (raw.indexOf(s) < 0) throw new Error('missing required rank rendering: ' + s);
    });
    if (/Gen\.\s+Ulysses S\. Grant/.test(raw.replace(/Lt\. Gen\. Ulysses S\. Grant/g, ''))) throw new Error('a full-General Grant rendering exists');
    if (raw.indexOf('general-in-chief') < 0) throw new Error('the Grant command-frame (general-in-chief traveling with the army) is missing');
    if (raw.indexOf('never confirmed by the Confederate Congress') < 0) throw new Error('the Anderson temporary-grade disclosure is missing');
    if (raw.indexOf('June 7') < 0) throw new Error('the Gibbon June 7 reverse-anachronism disclosure is missing');
    if (raw.indexOf('on temporary loan from the Army of the James') < 0 && raw.indexOf('temporary assignment from the Army of the James') < 0) throw new Error('the XVIII Corps Army-of-the-James loan is missing');
    if (raw.indexOf('independent') < 0) throw new Error('the Hoke independent-division honesty is missing');
    return { ok:true };
  });

  check('DEAD-OFFICER WALL (spec §2): the fallen and absent may not appear in this battle file at all', () => {
    ['Sedgwick', 'Stuart', 'Longstreet'].forEach(nm => { if (raw.indexOf(nm) >= 0) throw new Error('dead/absent officer named: ' + nm); });
    return { clean:true };
  });

  check('LANDMARKS (spec §4): the crossroads, the killing field, the ravines/swampy approach, the narrow gaps, the enfilade angles, Boatswain\'s Swamp', () => {
    ['Cold Harbor crossroads', 'KILLING FIELD', 'ravine and swampy approach ground', 'Narrow gaps in the works', 'ENFILADE SPUR', "Boatswain's Swamp"].forEach(t => { if (raw.indexOf(t) < 0) throw new Error('missing landmark token: ' + t); });
    if (String(B.objective.name).indexOf('entrenched Confederate line') < 0) throw new Error('objective must be the entrenched line');
    return { ok:true };
  });

  check('TEACHING (spec §6): five sourced cards (regret / seven-thousand / trench / truce / pivot), each with >=2 distinct sources; the Grant regret quote verbatim', () => {
    const cards = (B.teaching && B.teaching.cards) || [];
    const ids = cards.map(c => c.id);
    ['ch_regret', 'ch_seven_thousand', 'ch_trench_lesson', 'ch_truce', 'ch_pivot'].forEach(id => { if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
    cards.forEach(c => { if (new Set((c.sources || []).map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('card lacks 2 distinct sources: ' + c.id); });
    if (raw.indexOf('I have always regretted that the last assault at Cold Harbor was ever made') < 0) throw new Error('the fetched Grant regret quote is missing');
    return { cards:ids };
  });

  check('THE SEVEN-THOUSAND FENCE (spec §3): the disputed figure appears ONLY inside the ch_seven_thousand card - never as a count, seed, or guard', () => {
    const copy = JSON.parse(raw);
    copy.coldHarbor.teaching.cards = copy.coldHarbor.teaching.cards.filter(c => c.id !== 'ch_seven_thousand');
    const rest = JSON.stringify(copy);
    if (/7,000|7000/.test(rest)) throw new Error('the thirty-minute casualty figure leaked outside its fenced teaching card');
    const inCard = JSON.stringify((JSON.parse(raw).coldHarbor.teaching.cards || []).filter(c => c.id === 'ch_seven_thousand'));
    if (!/7,000/.test(inCard)) throw new Error('the fenced card no longer teaches the disputed figure');
    return { fenced:true };
  });

  check('INTEGRATION SOURCE PINS: T1 rank chain spotsylvania 68 -> coldHarbor 68.5 -> petersburgAssaults 69 (the documented non-integer exception) and the T10 E/true/anv meta row exist in source', () => {
    const t1 = readFileSync(join(ROOT, 'src', 'tactical', 'T1-bull-run.js'), 'utf8');
    if (!/spotsylvania:\s*68,\s*coldHarbor:\s*68\.5,\s*petersburgAssaults:\s*69/.test(t1)) throw new Error('menu rank chain spotsylvania:68 -> coldHarbor:68.5 -> petersburgAssaults:69 missing');
    if (t1.indexOf('GAME_DATA["cold-harbor"] && GAME_DATA["cold-harbor"].coldHarbor') < 0) throw new Error('T1 registry line missing');
    const t10 = readFileSync(join(ROOT, 'src', 'tactical', 'T10-flags.js'), 'utf8');
    if (!/coldHarbor:\s*\{ theater: "E", badges: true, csFlag: "anv" \}/.test(t10)) throw new Error('T10 meta row missing');
    return { ok:true };
  });

  return steps;
}

// ---- BROWSER teeth: live registry, launch, Army Register, 8-seed direction ----
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
    fldLaunchSandbox({ renderer:'none', scenario:'coldHarbor', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    var start = { US:dataStrength(__FIELD.scenData, 'US'), CS:dataStrength(__FIELD.scenData, 'CS') };
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 120000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    var us = liveStrength('US'), cs = liveStrength('CS');
    return { w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n,
      loss:{ US:Math.round(start.US - us), CS:Math.round(start.CS - cs) }, cas:__FIELD.battleCas || null };
  }
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof ssPersonRegistry !== 'function')
      return JSON.stringify({ ok:false, fatal:'required tactical/Army Register API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';

    check('REGISTRY: coldHarbor registered; menu rank 68.5 lands Jun 3 1864 after Spotsylvania (68) and before the Petersburg initial assaults (69)', function(){
      var reg = fldScenarioRegistry();
      if (!reg.coldHarbor || reg.coldHarbor.id !== 'coldHarbor') throw new Error('coldHarbor missing from the live registry');
      var rs = fldScenarioMenuRank('spotsylvania'), rc = fldScenarioMenuRank('coldHarbor'), rp = fldScenarioMenuRank('petersburgAssaults');
      if (rc !== 68.5) throw new Error('menu rank must be the documented 68.5 exception, got ' + rc);
      if (!(rs < rc && rc < rp)) throw new Error('rank order wrong: ' + [rs, rc, rp].join(' / '));
      return { rank:rc };
    });

    check('T10 META: _FLD_BATTLE_META.coldHarbor is theater E, badges true, csFlag anv', function(){
      var m = _FLD_BATTLE_META.coldHarbor;
      if (!m || m.theater !== 'E' || m.badges !== true || m.csFlag !== 'anv') throw new Error('meta wrong: ' + JSON.stringify(m));
      return m;
    });

    check('LAUNCH: the field opens with 15 units (9 US assault / 6 CS entrenched) on the entrenched-line objective; Breckinridge\\'s sector reserves arrive as the counterattack reinforcement', function(){
      G.campaign = null;
      fldLaunchSandbox({ renderer:'none', scenario:'coldHarbor', autoBoth:true, seed:12345 });
      if (__FIELD.units.length !== 15) throw new Error('want 15 opening units, got ' + __FIELD.units.length);
      var us = __FIELD.units.filter(function(u){ return u.side === 'US'; }).length;
      var cs = __FIELD.units.filter(function(u){ return u.side === 'CS'; }).length;
      if (us !== 9 || cs !== 6) throw new Error('want 9 US / 6 CS, got ' + us + '/' + cs);
      if (!__FIELD.objective || String(__FIELD.objective.name).indexOf('entrenched Confederate line') < 0) throw new Error('objective is not the entrenched line: ' + (__FIELD.objective && __FIELD.objective.name));
      if (__FIELD.phases !== null) throw new Error('single-phase battle leaked phase machinery');
      if ((__FIELD.reinforce || []).length !== 1) throw new Error('want exactly 1 scheduled reinforcement, got ' + (__FIELD.reinforce || []).length);
      var sd = __FIELD.scenData;
      if (!sd || !(sd.reinforcements || []).some(function(r){ return r.id === 'cs_breck_reserve_ch'; })) throw new Error('cs_breck_reserve_ch counterattack reinforcement missing from scenData');
      if (__FIELD.fog !== false) throw new Error('fog must default OFF (spec §1)');
      return { units:__FIELD.units.length };
    });

    check('ARMY REGISTER PIN: 16 unique Cold Harbor side-unit ids produce exact cmd/nco/pvt trios and current total 1632', function(){
      var reg = ssPersonRegistry();
      if (reg.people.length !== 1632) throw new Error('Army Register total is ' + reg.people.length + ', expected 1632');   // D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7): Watie's 2nd CMR adds 1 unique side-unit id x 3 slots. D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (LANE-013 P4, the D455 SS3 row 6 unlock).
      var rows = [], groups = {};
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:coldHarbor:') === 0) rows.push(origin);
      }
      if (rows.length !== 48) throw new Error('Cold Harbor rows are ' + rows.length + ', expected 48 (16 units x cmd/nco/pvt)');
      rows.forEach(function(origin){
        var m = origin.match(/^ss:coldHarbor:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Cold Harbor slot id ' + origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var want = ['US:us_barlow_ch','US:us_gibbon_ch','US:us_russell_ch','US:us_vi_second_ch','US:us_brooks_ch','US:us_martindale_ch','US:us_xviii_second_ch','US:us_left_guns_ch','US:us_right_guns_ch','CS:cs_anderson_front_ch','CS:cs_hoke_ch','CS:cs_breck_ch','CS:cs_hill_right_ch','CS:cs_works_guns_ch','CS:cs_right_guns_ch','CS:cs_breck_reserve_ch'];
      var bad = want.filter(function(k){ var g = groups[k]; return !g || !g.cmd || !g.nco || !g.pvt; });
      if (bad.length) throw new Error('units without exact trios: ' + bad.join(', '));
      if (Object.keys(groups).length !== 16) throw new Error('unexpected Cold Harbor unit groups: ' + Object.keys(groups).length);
      return { total:reg.people.length, rows:rows.length };
    });

    check('HISTORICAL DIRECTION (8 seeds): the CS defender holds in the majority AND US losses exceed CS in the majority (direction only, never a count gate — D74; fix INPUTS if this fails, never a lever)', function(){
      var seeds = ${JSON.stringify(SEEDS)}, csHolds = 0, usBleeds = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over') throw new Error('seed ' + seeds[i] + ' did not resolve');
        if (r.w === 'CS') csHolds++;
        if (r.loss.US > r.loss.CS) usBleeds++;
        samples.push(seeds[i] + ':' + r.w + ' loss ' + r.loss.US + '-' + r.loss.CS);
      }
      if (csHolds < 5) throw new Error('CS holds below 5/8: ' + csHolds + ' :: ' + samples.join(', '));
      if (usBleeds < 5) throw new Error('US-losses-exceed-CS below 5/8 (the lopsided-repulse direction): ' + usBleeds + ' :: ' + samples.join(', '));
      return { csHolds:csHolds + '/8', usBleeds:usBleeds + '/8', samples:samples };
    });

    check('NO NaN in unit state after a full run', function(){
      for (var i = 0; i < __FIELD.units.length; i++) {
        var u = __FIELD.units[i];
        if (!isFinite(u.x) || !isFinite(u.z) || !isFinite(u.men) || !isFinite(u.morale)) throw new Error('NaN in ' + u.id);
      }
      return { units:__FIELD.units.length };
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
    writeFileSync(join(OUT, 'probe-cold-harbor.json'), JSON.stringify(data, null, 2));
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
