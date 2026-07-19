#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-atlanta.mjs - D436 playable Battle of Atlanta (July 22, 1864).
// AUTHORED under the D431 coding-first law (VETTING DEFERRED; the audit session runs it —
// AUDIT-DEBT AD-4). Verifies the two-phase T8 contract from
// docs/design/atlanta-battle-build-spec.md: registry/menu/meta integration at rank 71,
// the spec §3 rank wall (Hood "General (temporary)"; McPherson Maj. Gen. killed 2:02;
// Logan's one-day command; no Johnston on the field), the §5 landmarks, the D74
// forbidden-key wall, the 4e-2 sources register, the S44 western-theater truth swap
// (atlanta playable; marchToTheSea the only lock), the 1617 Army Register pin (D442), and the
// 8-seed casualty-direction battery (defender holds + CS bleeds more, direction only).
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
  console.log('probe-atlanta ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

// ---- STATIC (node-side) teeth: the scenario JSON + the cross-file S44/T10/T1 contracts ----
function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };
  const raw = readFileSync(join(ROOT, 'data', 'atlanta.json'), 'utf8');
  const j = JSON.parse(raw);
  const B = j.atlanta;

  check('D74 FORBIDDEN-KEY WALL: no per-battle damage/firepower/casualty/winner lever key anywhere in the scenario JSON', () => {
    const bad = raw.match(/"(damage|dmg|fireMult|fireMultiplier|casualtyMult|lossMult|killMult|powerMult|fudge)"\s*:/g);
    if (bad) throw new Error('forbidden keys present: ' + bad.join(', '));
    return { clean:true };
  });

  check('4e-2 SOURCES REGISTER: the battle object carries >=2 distinct register entries naming the two live-fetched pages + the D327 packet', () => {
    const src = B.sources || [];
    if (new Set(src.map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('register below 2 distinct entries');
    const all = src.join(' | ');
    ['battlefields.org/learn/civil-war/battles/atlanta', 'en.wikipedia.org/wiki/Battle_of_Atlanta', 'atlanta-march-battle-build-research.md'].forEach(t => { if (all.indexOf(t) < 0) throw new Error('register missing ' + t); });
    return { entries:src.length };
  });

  check('SHAPE: two phases, weights [1,3] (decisive Jul 22 afternoon breakthrough), CS attacker / US defender, fog OFF at battle + phase level', () => {
    if (B.attacker !== 'CS' || B.defender !== 'US' || B.defaultFog !== false) throw new Error('top-level role/fog contract failed');
    if (!B.phases || B.phases.length !== 2) throw new Error('want 2 phases, got ' + (B.phases && B.phases.length));
    const w = B.phases.map(p => p.scoreWeight);
    if (w[0] !== 1 || w[1] !== 3) throw new Error('weights must be [1,3], got ' + w.join(','));
    B.phases.forEach(p => { if (p.attacker !== 'CS' || p.defender !== 'US' || p.defaultFog !== false) throw new Error('per-phase role/fog failed on ' + p.id); });
    if (B.homeEdge.US !== 'low' || B.homeEdge.CS !== 'high') throw new Error('homeEdge contract failed');
    return { weights:w };
  });

  check('RANK WALL (spec §3): Hood "General (temporary)"; McPherson Maj. Gen. + the 2:02 minute; Hardee Lt. Gen.; Walker killed; Logan temporary command; NO Johnston on this field; no CS Lt. Gen. besides Hardee', () => {
    if (raw.indexOf('temporary full general') < 0 && raw.indexOf('General (temporary)') < 0) throw new Error('Hood temporary-General encoding missing');
    if (raw.indexOf('Maj. Gen. James B. McPherson') < 0 || raw.indexOf('2:02') < 0) throw new Error('McPherson rank/minute missing');
    if (raw.indexOf('Lt. Gen. William J. Hardee') < 0) throw new Error('Hardee Lt. Gen. missing');
    if (raw.indexOf('Walker') < 0 || !/Walker[^"]{0,200}(shot|killed)/i.test(raw.replace(/\\n/g, ' '))) throw new Error('Walker fate missing');
    if (!/Logan[^]{0,400}?(temporar|since McPherson fell|took the army)/i.test(raw)) throw new Error('Logan temporary-command note missing');
    // dead-man/wrong-commander wall: Johnston was relieved Jul 17; he may never command here.
    const cmdBearing = [];
    B.phases.forEach(p => {
      ['US','CS'].forEach(side => (p.oob[side] || []).forEach(u => cmdBearing.push(u.commander || '')));
      ['US','CS'].forEach(side => ((p.leaders || {})[side] || []).forEach(l => cmdBearing.push(l.name || '')));
      (p.reinforcements || []).forEach(u => cmdBearing.push(u.commander || u.name || ''));
    });
    if (cmdBearing.some(c => /Johnston/.test(c))) throw new Error('Johnston appears as a commander after his Jul 17 relief');
    const csLtGens = cmdBearing.filter(c => /^Lt\. Gen\./.test(c));
    if (csLtGens.some(c => c.indexOf('Hardee') < 0)) throw new Error('a CS Lt. Gen. other than Hardee is encoded: ' + csLtGens.join('; '));
    return { commanders:cmdBearing.length };
  });

  check('LANDMARKS (spec §5): Bald Hill/Leggett, the Troup Hurt house, the Georgia Railroad, Decatur (teaching), the twenty massed guns', () => {
    ['Bald Hill', 'Leggett', 'Troup Hurt', 'Georgia Railroad', 'Decatur', 'twenty'].forEach(t => { if (raw.indexOf(t) < 0) throw new Error('missing landmark token: ' + t); });
    if (B.phases[0].objective.name.indexOf('Bald Hill') < 0) throw new Error('phase-1 objective must be Bald Hill');
    if (B.phases[1].objective.name.indexOf('Troup Hurt') < 0) throw new Error('phase-2 objective must be the Troup Hurt house line');
    return { ok:true };
  });

  check('TEACHING: five sourced cards (McPherson / Hood-bleeds / Bald Hill / Troup Hurt / election), each with >=2 sources', () => {
    const cards = (B.teaching && B.teaching.cards) || [];
    const ids = cards.map(c => c.id);
    ['at_mcpherson', 'at_hood_bleeds', 'at_bald_hill', 'at_troup_hurt', 'at_election'].forEach(id => { if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
    cards.forEach(c => { if (new Set((c.sources || []).map(s => String(s).trim().toLowerCase())).size < 2) throw new Error('card lacks 2 distinct sources: ' + c.id); });
    return { cards:ids };
  });

  check('S44 TRUTH (D436): western-theater currentArc carries the playable atlanta entry with two sources; futureLocks is exactly the marchToTheSea campaign-treatment lock', () => {
    const wt = JSON.parse(readFileSync(join(ROOT, 'data', 'western-theater.json'), 'utf8'));
    const arc = wt.currentArc.filter(e => e.scenarioId === 'atlanta');
    if (arc.length !== 1) throw new Error('atlanta currentArc entries: ' + arc.length);
    if (arc[0].status !== 'playable-now' || (arc[0].sources || []).length < 2) throw new Error('atlanta arc entry status/sources wrong');
    const locks = wt.futureLocks || [];
    if (locks.length < 1) throw new Error('futureLocks must stay non-empty (the schema rule)');
    const lockedIds = locks.reduce((a, l) => a.concat(l.lockedScenarioIds || []), []);
    if (JSON.stringify(lockedIds) !== JSON.stringify(['marchToTheSea'])) throw new Error('locked ids must be exactly ["marchToTheSea"], got ' + JSON.stringify(lockedIds));
    return { arcLen:wt.currentArc.length };
  });

  check('INTEGRATION SOURCE PINS: T1 rank 71 (kennesaw 70 < atlanta 71 < cedarCreek 72) and the T10 W/false/hardee meta row exist in source', () => {
    const t1 = readFileSync(join(ROOT, 'src', 'tactical', 'T1-bull-run.js'), 'utf8');
    if (!/kennesaw:\s*70,\s*atlanta:\s*71,\s*cedarCreek:\s*72/.test(t1)) throw new Error('menu rank chain kennesaw:70 -> atlanta:71 -> cedarCreek:72 missing');
    if (t1.indexOf('GAME_DATA.atlanta && GAME_DATA.atlanta.atlanta') < 0) throw new Error('T1 registry line missing');
    const t10 = readFileSync(join(ROOT, 'src', 'tactical', 'T10-flags.js'), 'utf8');
    if (!/atlanta:\s*\{ theater: "W", badges: false, csFlag: "hardee" \}/.test(t10)) throw new Error('T10 meta row missing');
    return { ok:true };
  });

  return steps;
}

// ---- BROWSER teeth: live registry, launch, phases, Army Register, 8-seed direction ----
const SEEDS = [1, 7, 21, 33, 49, 101, 202, 303];
const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function check(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  function fielded(side){ var t=0; for (var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side) t+=u.men; } return t; }
  function runBattle(opts) {
    opts = opts || {};
    G.campaign = null; G.settings = G.settings || {};
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    fldLaunchSandbox({ renderer:'none', scenario:'atlanta', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 120000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    return {
      w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n,
      score:__FIELD.phaseScore, cas:__FIELD.battleCas,
      log:(__FIELD.phaseLog || []).map(function(e){ return { name:e.name, w:e.winner, us:Math.round(e.usCas), cs:Math.round(e.csCas) }; })
    };
  }
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof ssPersonRegistry !== 'function')
      return JSON.stringify({ ok:false, fatal:'required tactical/Army Register API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';

    check('REGISTRY: atlanta registered; menu rank 71 lands Jul 22 1864 after kennesaw and before cedarCreek', function(){
      var reg = fldScenarioRegistry();
      if (!reg.atlanta || reg.atlanta.id !== 'atlanta') throw new Error('atlanta missing from the live registry');
      var rk = fldScenarioMenuRank('kennesaw'), ra = fldScenarioMenuRank('atlanta'), rc = fldScenarioMenuRank('cedarCreek');
      if (!(rk < ra && ra < rc)) throw new Error('rank order wrong: ' + [rk, ra, rc].join(' / '));
      return { rank:ra };
    });

    check('T10 META: _FLD_BATTLE_META.atlanta is theater W, badges false, csFlag hardee (Army of Tennessee)', function(){
      var m = _FLD_BATTLE_META.atlanta;
      if (!m || m.theater !== 'W' || m.badges !== false || m.csFlag !== 'hardee') throw new Error('meta wrong: ' + JSON.stringify(m));
      return m;
    });

    check('LAUNCH: phase 1 opens with 9 units (5 US incl. the Bald Hill guns, 4 CS) on the Bald Hill objective; Maney arrives as the echelon reinforcement', function(){
      G.campaign = null;
      fldLaunchSandbox({ renderer:'none', scenario:'atlanta', autoBoth:true, seed:12345 });
      if (__FIELD.units.length !== 9) throw new Error('want 9 opening units, got ' + __FIELD.units.length);
      var us = __FIELD.units.filter(function(u){ return u.side === 'US'; }).length;
      var cs = __FIELD.units.filter(function(u){ return u.side === 'CS'; }).length;
      if (us !== 5 || cs !== 4) throw new Error('want 5 US / 4 CS, got ' + us + '/' + cs);
      if (!__FIELD.objective || String(__FIELD.objective.name).indexOf('Bald Hill') < 0) throw new Error('phase-1 objective is not Bald Hill: ' + (__FIELD.objective && __FIELD.objective.name));
      if (!__FIELD.phases || __FIELD.phases.length !== 2) throw new Error('T8 phases not initialized: ' + (__FIELD.phases && __FIELD.phases.length));
      var reinf = (__FIELD.phases[0].reinforcements || []);
      if (!reinf.some(function(r){ return r.id === 'cs_maney'; })) throw new Error('cs_maney echelon reinforcement missing');
      var p2 = __FIELD.phases[1];
      if (String(p2.objective.name).indexOf('Troup Hurt') < 0) throw new Error('phase-2 objective is not the Troup Hurt line');
      if (!(p2.reinforcements || []).some(function(r){ return r.id === 'us_massed_guns' && r.guns === 20; })) throw new Error('the twenty massed guns reinforcement missing');
      return { units:__FIELD.units.length };
    });

    check('ARMY REGISTER PIN: 18 unique Atlanta side-unit ids produce exact cmd/nco/pvt trios and current total 1617', function(){
      var reg = ssPersonRegistry();
      if (reg.people.length !== 1617) throw new Error('Army Register total is ' + reg.people.length + ', expected 1617');   // D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots. D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7): Watie's 2nd CMR adds 1 unique side-unit id x 3 slots.
      // D443 (AD-4 probe fix, the AD-10 never-run bug class): people carry no flat unitId —
      // count trios by parsing the canonical ss:atlanta:<side>:<uid>:<slot> origin pids.
      var rows = [], groups = {};
      for (var pi2 = 0; pi2 < reg.people.length; pi2++) {
        var pp = reg.people[pi2], origin = pp.replaces || pp.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:atlanta:') === 0) rows.push(origin);
      }
      if (rows.length !== 54) throw new Error('Atlanta rows are ' + rows.length + ', expected 54 (18 units x cmd/nco/pvt)');
      rows.forEach(function(origin){
        var m = origin.match(/^ss:atlanta:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Atlanta slot id ' + origin);
        var key = m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
      });
      var bad = ['us_leggett','us_gasmith','us_fuller','us_sweeny','us_bald_hill_guns','cs_cleburne','cs_walker','cs_bate','cs_hardee_guns','cs_maney','us_mlsmith','us_woods','us_harrow','us_degress','us_massed_guns','cs_brown','cs_clayton','cs_gwsmith'].filter(function(k){ var g = groups[k]; return !g || !g.cmd || !g.nco || !g.pvt; });
      if (bad.length) throw new Error('units without exact trios: ' + bad.join(', '));
      return { total:reg.people.length, rows:rows.length };
    });

    check('HISTORICAL DIRECTION (8 seeds): US holds BOTH phases and CS losses exceed US in the majority; aggregate US victory with CS total loss > US (direction only, never a count gate — D74)', function(){
      var seeds = ${JSON.stringify(SEEDS)}, p1us = 0, p2us = 0, aggUS = 0, csBleeds = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runBattle({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over') throw new Error('seed ' + seeds[i] + ' did not resolve');
        if (r.log[0] && r.log[0].w === 'US') p1us++;
        if (r.log[1] && r.log[1].w === 'US') p2us++;
        if (r.w === 'US') aggUS++;
        var totUS = (r.cas && r.cas.US) || 0, totCS = (r.cas && r.cas.CS) || 0;
        if (totCS > totUS) csBleeds++;
        samples.push(seeds[i] + ':' + (r.log || []).map(function(e){ return e.w; }).join('/') + '=' + r.w + ' cas ' + Math.round(totUS) + '-' + Math.round(totCS));
      }
      if (p1us < 5) throw new Error('phase-1 US holds below 5/8: ' + p1us + ' :: ' + samples.join(', '));
      if (p2us < 5) throw new Error('phase-2 US holds below 5/8: ' + p2us + ' :: ' + samples.join(', '));
      if (aggUS < 5) throw new Error('aggregate US wins below 5/8: ' + aggUS + ' :: ' + samples.join(', '));
      if (csBleeds < 5) throw new Error('CS-losses-exceed-US below 5/8 (US 3,722 vs CS 5,000-5,500 direction): ' + csBleeds + ' :: ' + samples.join(', '));
      return { phase1US:p1us + '/8', phase2US:p2us + '/8', aggregateUS:aggUS + '/8', csBleeds:csBleeds + '/8', samples:samples };
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
    writeFileSync(join(OUT, 'probe-atlanta.json'), JSON.stringify(data, null, 2));
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
