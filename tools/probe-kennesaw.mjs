#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-kennesaw.mjs - D331 playable Kennesaw Mountain; D339/C70 fixes.
// Verifies the single-phase scenario contract, D330/D339/C70 source traps, D74
// no-fudge wall, all-fielded sector strengths, registry/menu integration,
// deterministic resolution, and direction guards for the historical repulse.
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
  console.log('probe-kennesaw ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
    else console.log('  ok   ' + s.name.slice(0, 68) + ' :: ' + JSON.stringify(s.v));
  }
}

const SETUP = `(() => {
  var R = { ok:true, steps:[], errors:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message || ev.error || ev)); });
  function isNum(n) { return typeof n === 'number' && isFinite(n); }
  function txt(o) { var s = ''; try { s = JSON.stringify(o); } catch(e) {} return String(s || '').toLowerCase(); }
  function allUnits(sd) { return ((sd.oob && sd.oob.US) || []).concat((sd.oob && sd.oob.CS) || []).concat(sd.reinforcements || []); }
  function fieldedSideUnits(sd, side) {
    var out = ((sd.oob && sd.oob[side]) || []).slice(), reinf = sd.reinforcements || [];
    for (var i = 0; i < reinf.length; i++) if (reinf[i].side === side) out.push(reinf[i]);
    return out;
  }
  function fieldedStrength(side) {
    var n = 0, units = fieldedSideUnits(DATA, side);
    for (var i = 0; i < units.length; i++) n += units[i].men || 0;
    return n;
  }
  function sectorUnits(side, sector) {
    var out = [], units = fieldedSideUnits(DATA, side);
    for (var i = 0; i < units.length; i++) if (units[i].assaultSector === sector) out.push(units[i]);
    return out;
  }
  function sumMen(units) {
    var n = 0; for (var i = 0; i < units.length; i++) n += units[i].men || 0; return n;
  }
  function keyScan(obj, path, bad) {
    if (!obj || typeof obj !== 'object') return;
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
      var p = path ? path + '.' + k : k;
      if (/^(damage|dmg|fireScale|fireMult|fireMultiplier|killScale|killMult|casualtyMult|lossMult|combatScale|battleDamage|battleFire|powerMult|scoreBonus|forceWin|winnerFudge)$/i.test(k)) bad.push(p);
      keyScan(obj[k], p, bad);
    }
  }
  function liveStrength(side) {
    var c = 0; for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === side && u.alive) c += u.men; }
    return Math.round(c);
  }
  function nanScan() {
    for (var i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i];
      if (!isNum(u.x) || !isNum(u.z) || !isNum(u.men) || !isNum(u.morale) || !isNum(u.facing) || !isNum(u.fatigue) || !isNum(u.ammo)) return u.id;
    }
    return null;
  }
  function runKen(opts) {
    opts = opts || {};
    var start = { US:fieldedStrength('US'), CS:fieldedStrength('CS') };
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    delete G.settings.tacticalFog;
    fldLaunchSandbox({ renderer:'none', scenario:'kennesaw', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 65000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    var us = liveStrength('US'), cs = liveStrength('CS');
    return {
      w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n, t:Math.round(__FIELD.t),
      us:us, cs:cs, start:start, loss:{ US:Math.round(start.US - us), CS:Math.round(start.CS - cs) }, cas:__FIELD.battleCas || null,
      hold:{ US:Math.round(__FIELD.holdSecs.US), CS:Math.round(__FIELD.holdSecs.CS) },
      scenario:__FIELD.scenario, objective:__FIELD.objective && __FIELD.objective.name
    };
  }

  var DATA = null;
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof __FIELD === 'undefined')
      return JSON.stringify({ ok:false, fatal:'__FIELD engine / registry missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    DATA = (GAME_DATA && GAME_DATA.kennesaw) ? GAME_DATA.kennesaw.kennesaw : null;

    step('DATA present and registered: Kennesaw is single-phase, US attacker / CS defender, fog OFF, after Chattanooga', function() {
      var reg = fldScenarioRegistry();
      if (!DATA) throw new Error('GAME_DATA.kennesaw.kennesaw missing');
      if (!reg.kennesaw) throw new Error('kennesaw missing from registry');
      if (DATA.phases) throw new Error('Kennesaw must be single-phase, not phases[]');
      if (DATA.attacker !== 'US' || DATA.defender !== 'CS') throw new Error('roles wrong: ' + DATA.attacker + '/' + DATA.defender);
      if (DATA.defaultFog !== false) throw new Error('defaultFog must be false');
      var order = fldScenarioMenuOrder(reg);
      if (order.indexOf('olustee') !== order.indexOf('chattanooga') + 1 || order.indexOf('fortPillow') !== order.indexOf('olustee') + 1 || order.indexOf('wilderness') !== order.indexOf('fortPillow') + 1 || order.indexOf('spotsylvania') !== order.indexOf('wilderness') + 1 || order.indexOf('coldHarbor') !== order.indexOf('spotsylvania') + 1 || order.indexOf('petersburgAssaults') !== order.indexOf('coldHarbor') + 1 || order.indexOf('kennesaw') !== order.indexOf('petersburgAssaults') + 1) throw new Error('menu order not Chattanooga -> Olustee -> Fort Pillow -> Wilderness -> Spotsylvania -> Cold Harbor -> Petersburg initial assaults -> Kennesaw: ' + order.join(' -> '));   // D442 reshape: Cold Harbor rank 68.5 inserts between Spotsylvania 68 and the Petersburg initial assaults 69; preserve the full six-battle chronology. D397 reshape: Petersburg initial assaults rank 69 between Spotsylvania 68 and Kennesaw 70. D393: Wilderness rank 67 inserted between Chattanooga 65 and Spotsylvania 68. D391: Spotsylvania sat between Chattanooga and Kennesaw. D466 re-pin (the battery's exact-label red): D463 registered fortPillow at rank 66 between Chattanooga 65 and the Wilderness 67 — this probe's own chain teeth sat outside the banked D463 inventory; the chain now guards the seven-battle chronology. D470 battery root-fix 4 (the battery's exact-label red, the D466 sibling class): D470 registered olustee at rank 65.5 between Chattanooga 65 and fortPillow 66 and re-pinned this probe's DOM chain (line ~276) but MISSED this registry-order variant — re-pinned to the shipped eight-battle chronology; the tree-wide adjacency sweep (bare-token and regex-source forms) found no other stale site.
      return { order:order, usUnits:DATA.oob.US.length, csUnits:DATA.oob.CS.length };
    });

    step('CONTENT TEETH: landmarks and teaching cover Pigeon Hill, Little Kennesaw, Cheatham Hill, Dead Angle, abatis, Mebane battery, Dallas Road, Burnt Hickory Road, Schofield flank, and Atlanta', function() {
      var body = txt(DATA);
      var terms = ['pigeon hill', 'little kennesaw', 'cheatham', 'dead angle', 'abatis', 'mebane', 'dallas road', 'burnt hickory', 'schofield', 'atlanta'];
      var missing = [];
      for (var i = 0; i < terms.length; i++) if (body.indexOf(terms[i]) < 0) missing.push(terms[i]);
      if (missing.length) throw new Error('missing terms: ' + missing.join(', '));
      if (!DATA.teaching || !DATA.teaching.cards || DATA.teaching.cards.length < 4) throw new Error('expected at least 4 teaching cards');
      return { terms:terms.length, cards:DATA.teaching.cards.length, codex:DATA.teaching.codex && DATA.teaching.codex.id };
    });

    step('RANK/OOB TRAPS: battle-date ranks and Johnston/Hood timing are explicit; no campaign totals leak into OOB', function() {
      var body = txt(DATA);
      ['maj. gen. william t. sherman', 'maj. gen. george h. thomas', 'maj. gen. john m. schofield', 'maj. gen. james b. mcpherson', 'maj. gen. john a. logan', 'brig. gen. morgan l. smith', 'gen. joseph e. johnston', 'lt. gen. william j. hardee', 'maj. gen. benjamin f. cheatham', 'maj. gen. patrick r. cleburne', 'brig. gen. george e. maney', 'brig. gen. alfred j. vaughan', 'brig. gen. charles g. harker', 'col. daniel mccook', 'col. john g. mitchell'].forEach(function(term) {
        if (body.indexOf(term) < 0) throw new Error('missing rank trap ' + term);
      });
      ['lt. gen. william t. sherman', 'lt. gen. ulysses', 'gen. john bell hood', 'maj. gen. george e. maney', 'lt. gen. patrick r. cleburne', 'brig. gen. daniel mccook', 'brig. gen. john g. mitchell'].forEach(function(term) {
        if (body.indexOf(term) >= 0) throw new Error('anachronistic/forbidden rank leaked: ' + term);
      });
      if (body.indexOf('150,000') >= 0 || body.indexOf('100,000') >= 0) throw new Error('campaign-scale totals leaked into runtime data');
      if (body.indexOf('verified identity; inferred strength') < 0) throw new Error('inferred strength honesty label missing');
      return { rankTeeth:true };
    });

    step('IDENTITY TRAP: Alfred J. Vaughan is player-facing while stable id cs_vaughn remains unchanged', function() {
      var units = allUnits(DATA), unit = null;
      for (var i = 0; i < units.length; i++) if (units[i].id === 'cs_vaughn') unit = units[i];
      if (!unit) throw new Error('stable unit id cs_vaughn missing');
      if (unit.name !== "Vaughan's Tennessee Brigade") throw new Error('unit name spelling wrong: ' + unit.name);
      if (unit.commander !== 'Brig. Gen. Alfred J. Vaughan') throw new Error('commander spelling wrong: ' + unit.commander);
      var people = DATA.teaching && DATA.teaching.codex && DATA.teaching.codex.axes && DATA.teaching.codex.axes.people || [];
      if (people.indexOf('Vaughan') < 0 || people.indexOf('Vaughn') >= 0) throw new Error('codex people spelling wrong: ' + people.join(', '));
      var surfaces = [DATA.leaders && DATA.leaders._note, unit.name, unit.commander, unit.note, people.join(' ')];
      for (var j = 0; j < surfaces.length; j++) if (/\bvaughn\b/i.test(String(surfaces[j] || ''))) throw new Error('obsolete player-facing spelling: ' + surfaces[j]);
      return { id:unit.id, name:unit.name, commander:unit.commander, codex:'Vaughan' };
    });

    step('OOB STRENGTH HONESTY: ALL fielded US infantry is sector-tagged; Pigeon Hill totals 5,500 with no extra echelon; Cheatham Hill totals 9,000', function() {
      var fieldedUS = fieldedSideUnits(DATA, 'US');
      var usInf = fieldedUS.filter(function(u){ return u.arm === 'inf'; });
      var unclassified = usInf.filter(function(u){ return u.assaultSector !== 'pigeon-hill' && u.assaultSector !== 'cheatham-hill'; });
      if (unclassified.length) throw new Error('fielded US infantry missing valid assaultSector: ' + unclassified.map(function(u){ return u.id; }).join(', '));
      var pigeonUnits = sectorUnits('US', 'pigeon-hill');
      var cheathamUnits = sectorUnits('US', 'cheatham-hill');
      var pigeonIds = pigeonUnits.map(function(u){ return u.id; }).sort();
      var expectedPigeon = ['us_giles_smith', 'us_lightburn', 'us_walcutt'].sort();
      if (JSON.stringify(pigeonIds) !== JSON.stringify(expectedPigeon)) throw new Error('Pigeon Hill fielded ids wrong: ' + pigeonIds.join(', '));
      var pigeon = sumMen(pigeonUnits), cheatham = sumMen(cheathamUnits);
      if (pigeon !== 5500) throw new Error('ALL fielded Pigeon Hill units should sum to 5500, got ' + pigeon);
      if (cheatham !== 9000) throw new Error('ALL fielded Cheatham Hill units should sum to 9000, got ' + cheatham);
      if (allUnits(DATA).some(function(u){ return u.id === 'us_morgan_smith_support'; })) throw new Error('unsupported us_morgan_smith_support still fielded');
      var cs = (DATA.oob.CS || []), inferred = 0;
      for (var i = 0; i < cs.length; i++) if (/Inferred strength/i.test(cs[i].note || '')) inferred++;
      if (inferred < 5) throw new Error('Confederate inferred-strength labels too thin: ' + inferred);
      return { pigeon:{ men:pigeon, ids:pigeonIds }, cheatham:{ men:cheatham, units:cheathamUnits.length }, fieldedUS:fieldedUS.length, unclassified:unclassified.length, csInferred:inferred };
    });

    step('D74 NO-FUDGE: artillery carries gun counts and data has no battle-specific combat/result keys', function() {
      var bad = []; keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden combat/result keys found: ' + bad.join(', '));
      var arts = [], totalGuns = 0, units = allUnits(DATA);
      for (var i = 0; i < units.length; i++) if (units[i].arm === 'art') arts.push(units[i]);
      if (arts.length < 4) throw new Error('expected at least 4 artillery entries, got ' + arts.length);
      for (var j = 0; j < arts.length; j++) {
        var a = arts[j];
        if (!(a.guns > 0)) throw new Error(a.id + ' missing gun count');
        if (!(a.men > 0 && a.men <= a.guns * 40)) throw new Error(a.id + ' crew/gun ratio suspicious: ' + a.men + '/' + a.guns);
        totalGuns += a.guns;
      }
      return { batteries:arts.length, totalGuns:totalGuns };
    });

    step('LAUNCH: Kennesaw instantiates as single-phase, no phase machinery, correct objective, no Classic contamination, no NaN', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'kennesaw', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'kennesaw') throw new Error('scenario not set: ' + __FIELD.scenario);
      if (__FIELD.attacker !== 'US' || __FIELD.defender !== 'CS') throw new Error('launch roles wrong: ' + __FIELD.attacker + '/' + __FIELD.defender);
      if (__FIELD.phases !== null) throw new Error('single-phase scenario leaked phase machinery');
      if (!__FIELD.objective || __FIELD.objective.name.indexOf('Kennesaw') < 0) throw new Error('objective wrong: ' + (__FIELD.objective && __FIELD.objective.name));
      if (__FIELD.units.length !== DATA.oob.US.length + DATA.oob.CS.length) throw new Error('initial unit count wrong: ' + __FIELD.units.length);
      if (G.battle && G.battle.M) throw new Error('Kennesaw launch created Classic G.battle');
      fldSimStep(0.05);
      var bad = nanScan(); if (bad) throw new Error('NaN in ' + bad);
      return { units:__FIELD.units.length, objective:__FIELD.objective.name, holdToWin:__FIELD.holdToWin, timeLimit:__FIELD.timeLimit };
    });

    step('HISTORICAL PATTERN (shared model, 8 seeds): CS holds majority and US casualties exceed CS in majority', function() {
      var seeds = [1, 7, 21, 33, 49, 101, 202, 303], csWins = 0, usHigherLoss = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runKen({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over') throw new Error('seed ' + seeds[i] + ' did not finish: ' + JSON.stringify(r));
        if (r.w === 'CS') csWins++;
        var usLoss = r.loss.US, csLoss = r.loss.CS;
        if (usLoss > csLoss) usHigherLoss++;
        samples.push(seeds[i] + ':' + r.w + '/' + Math.round(usLoss) + '-' + Math.round(csLoss) + '/' + r.by);
      }
      if (csWins < 5) throw new Error('CS should hold majority, got ' + csWins + '/8 :: ' + samples.join(', '));
      if (usHigherLoss < 5) throw new Error('US should lose more in majority, got ' + usHigherLoss + '/8 :: ' + samples.join(', '));
      return { csWins:csWins + '/8', usHigherLoss:usHigherLoss + '/8', start:{ US:fieldedStrength('US'), CS:fieldedStrength('CS') }, sample:samples };
    });

    step('DETERMINISM: same seed -> identical Kennesaw result', function() {
      var a = runKen({ autoBoth:true, seed:909 });
      var b = runKen({ autoBoth:true, seed:909 });
      if (a.w !== b.w || a.by !== b.by || a.steps !== b.steps || a.us !== b.us || a.cs !== b.cs || JSON.stringify(a.hold) !== JSON.stringify(b.hold))
        throw new Error('non-deterministic: ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b));
      return { winner:a.w, winBy:a.by, steps:a.steps, start:a.start, loss:a.loss, us:a.us, cs:a.cs };
    });

    step('A US PLAYER AND A CS PLAYER both resolve passively (no hang/NaN)', function() {
      var out = {};
      ['US', 'CS'].forEach(function(ps) {
        var r = runKen({ playerSide:ps, seed:17, autoBoth:false, maxSteps:65000 });
        if (r.phase !== 'over') throw new Error(ps + ' passive battle did not terminate: ' + JSON.stringify(r));
        if (['US', 'CS', 'draw'].indexOf(r.w) < 0) throw new Error(ps + ' bad winner: ' + r.w);
        var bad = nanScan(); if (bad) throw new Error(ps + ' NaN in ' + bad);
        out[ps] = { winner:r.w, by:r.by, steps:r.steps, us:r.us, cs:r.cs };
      });
      return out;
    });

  } catch(e) {
    R.ok = false;
    R.errors.push('FATAL ' + String(e && e.message || e));
  }
  return JSON.stringify(R);
})()`;

const DOM = `(() => {
  var R = { ok:true, steps:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  try {
    G.settings = G.settings || {}; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    step('MENU: Kennesaw button injects once in the Chattanooga -> Spotsylvania -> Kennesaw chronology and opens side-choice cards', function() {
      if (typeof openMainMenu !== 'function') return { skipped:'no openMainMenu' };
      openMainMenu(); fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_kennesaw');
      if (!btn) throw new Error('Kennesaw button did not inject');
      if (!btn.getAttribute('aria-label')) throw new Error('Kennesaw button missing aria-label');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_kennesaw').length !== 1) throw new Error('duplicate Kennesaw buttons');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldScnBtn_chattanooga') >= 0 && ids.indexOf('fldScnBtn_olustee') === ids.indexOf('fldScnBtn_chattanooga') + 1 && ids.indexOf('fldScnBtn_fortPillow') === ids.indexOf('fldScnBtn_olustee') + 1 && ids.indexOf('fldScnBtn_wilderness') === ids.indexOf('fldScnBtn_fortPillow') + 1 && ids.indexOf('fldScnBtn_spotsylvania') === ids.indexOf('fldScnBtn_wilderness') + 1 && ids.indexOf('fldScnBtn_coldHarbor') === ids.indexOf('fldScnBtn_spotsylvania') + 1 && ids.indexOf('fldScnBtn_petersburgAssaults') === ids.indexOf('fldScnBtn_coldHarbor') + 1 && ids.indexOf('fldScnBtn_kennesaw') === ids.indexOf('fldScnBtn_petersburgAssaults') + 1)) throw new Error('Kennesaw not in the Chattanooga -> Fort Pillow -> Wilderness -> Spotsylvania -> Cold Harbor -> Petersburg initial assaults -> Kennesaw order: ' + ids.join(' -> '));   // D397 reshape DOM variant: the petersburgAssaults button inserts between spotsylvania and kennesaw; the complete chronology stays guarded. D393 inserted Wilderness; D391 carried the prior three-button chronology. D454 re-pin: D442 updated this probe's registry-order tooth (line ~127) for the coldHarbor rank-68.5 insert but MISSED this DOM variant — re-pinned to the same shipped six-button chain, first-ever run. D466 re-pin: the fortPillow button (D463, rank 66) inserts between chattanooga and wilderness — the seven-button chain.
      var got = null;
      fldScenarioSideChoice('kennesaw', function(s){ got = s; });
      var cards = document.querySelectorAll('[data-brside]');
      if (cards.length !== 2) throw new Error('side choice expected 2 cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]');
      if (!cs) throw new Error('CS side card missing');
      cs.click();
      if (got !== 'CS') throw new Error('CS side card returned ' + got);
      return { injected:true, orderIndex:ids.indexOf('fldScnBtn_kennesaw'), sideChoice:got };
    });
  } catch(e) {
    R.ok = false;
    R.fatal = String(e && e.message || e);
  }
  return JSON.stringify(R);
})()`;

async function main() {
  let server = null, browser = null;
  const probe = cfg.baseUrl + '/' + cfg.file;
  try {
    if (!(await up(probe))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 80; i++) { if (await up(probe)) break; await sleep(150); }
    }
    try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
    catch(e) { browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
    const page = await browser.newPage({ viewport: cfg.viewport });
    await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch(e) {} });
    const pageerrors = [], consoleLines = [];
    page.on('pageerror', err => pageerrors.push(String(err.message)));
    page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') consoleLines.push('[' + msg.type() + '] ' + msg.text()); });
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(400);
    const data = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    data.steps = (data.steps || []).concat((dom.steps || []).map(s => ({ ...s, name:'DOM: ' + s.name })));
    if (!dom.ok) {
      data.ok = false;
      if (dom.fatal) data.errors = (data.errors || []).concat(['DOM FATAL ' + dom.fatal]);
    }
    const actionableConsoleErrors = consoleLines.filter(line => line.startsWith('[error]') && !/Failed to load resource:.*404/i.test(line));
    data.pageerrors = pageerrors;
    data.console = consoleLines.slice(-20);
    data.ok = !!data.ok && !pageerrors.length && !actionableConsoleErrors.length;
    writeFileSync(join(OUT, 'probe-kennesaw.json'), JSON.stringify(data, null, 2));
    await sleep(250);
    try {
      await page.screenshot({ path: join(OUT, 'probe-kennesaw.png'), fullPage:false, timeout:5000 });
    } catch(e) {
      data.screenshotWarning = String(e && e.message || e);
      writeFileSync(join(OUT, 'probe-kennesaw.json'), JSON.stringify(data, null, 2));
    }
    printResult(data);
    const fail = (data.steps || []).filter(s => !s.ok);
    if (!data.ok || fail.length || pageerrors.length) {
      for (const e of pageerrors) console.error('  PAGE ERROR:', e);
      for (const c of actionableConsoleErrors) console.error('  CONSOLE:', c);
      process.exit(1);
    }
    console.log('ALL OK');
  } finally {
    await closeBrowserHard(browser);
    killChild(server);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error('FATAL:', e); process.exit(1); });
