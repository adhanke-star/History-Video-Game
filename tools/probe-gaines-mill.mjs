#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D362 playable Gaines' Mill. This focused gate binds the D361 history/OOB
// contract to the live single-phase engine and guards the shared-model result.
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
const SEEDS = [1, 7, 21, 33, 49, 101, 202, 303];
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
  console.log('probe-gaines-mill ok=' + result.ok + ' steps=' + (result.steps || []).length + ' pageerrors=' + (result.pageerrors || []).length);
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (s.ok) console.log('  ok   ' + s.name.slice(0, 70) + ' :: ' + JSON.stringify(s.v));
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
  function allUnits(sd) { return ((sd.oob && sd.oob.US) || []).concat((sd.oob && sd.oob.CS) || []).concat(sd.reinforcements || []); }
  function sideOf(sd, u) {
    if (u.side) return u.side;
    if (sd.oob && sd.oob.US && sd.oob.US.indexOf(u) >= 0) return 'US';
    if (sd.oob && sd.oob.CS && sd.oob.CS.indexOf(u) >= 0) return 'CS';
    return null;
  }
  function totals(sd) {
    var out = { US:0, CS:0 }, units = allUnits(sd);
    for (var i = 0; i < units.length; i++) out[sideOf(sd, units[i])] += units[i].men || 0;
    return out;
  }
  function guns(sd) {
    var out = { US:0, CS:0 }, units = allUnits(sd);
    for (var i = 0; i < units.length; i++) if (units[i].arm === 'art') out[sideOf(sd, units[i])] += units[i].guns || 0;
    return out;
  }
  function sourceUrls(value) {
    if (!Array.isArray(value)) return [];
    var out = [], seen = {};
    for (var i = 0; i < value.length; i++) if (typeof value[i] === 'string' && /^https?:\\/\\//.test(value[i]) && !seen[value[i]]) { seen[value[i]] = 1; out.push(value[i]); }
    return out;
  }
  function keyScan(obj, path, bad) {
    if (!obj || typeof obj !== 'object') return;
    var forbidden = {
      damage:1,dmg:1,damagemult:1,firepower:1,firepowermult:1,firescale:1,firemult:1,firemultiplier:1,
      killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossmult:1,combatscale:1,battledamage:1,
      battlefire:1,powermult:1,moralemult:1,routmult:1,capturemult:1,scorebonus:1,scoremult:1,winner:1,
      winoverride:1,victoryoverride:1,outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1
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
      if (typeof u.x !== 'number' || !isFinite(u.x) || typeof u.z !== 'number' || !isFinite(u.z) || typeof u.men !== 'number' || !isFinite(u.men) || typeof u.morale !== 'number' || !isFinite(u.morale)) return u.id;
    }
    return null;
  }
  function runScenario(opts) {
    opts = opts || {};
    G.campaign = null; G.settings = G.settings || {};
    try { delete G.settings.tacticalPreset; } catch(e) {}
    delete G.settings.tacticalFog;
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    fldLaunchSandbox({ renderer:'none', scenario:'gainesMill', autoBoth:!!opts.autoBoth, playerSide:opts.playerSide || 'US', seed:opts.seed || 1 });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0, max = opts.maxSteps || 40000;
    while (__FIELD.phase === 'battle' && n < max) { fldSimStep(0.05); n++; }
    var tally = (typeof _fldPrisTally === 'function') ? _fldPrisTally() : null;
    return {
      w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, steps:n, t:Math.round(__FIELD.t),
      hold:{ US:Math.round(__FIELD.holdSecs.US), CS:Math.round(__FIELD.holdSecs.CS) },
      tally:tally, scenario:__FIELD.scenario, objective:__FIELD.objective && __FIELD.objective.name,
      badUnit:nanScan()
    };
  }
  function sameSeedReplay() {
    var a = runScenario({ autoBoth:true, seed:909 });
    var b = runScenario({ autoBoth:true, seed:909 });
    return { a:a, b:b, equal:JSON.stringify(a) === JSON.stringify(b) };
  }
  function runPassive(side, seed) { return runScenario({ autoBoth:false, playerSide:side, seed:seed, maxSteps:40000 }); }
  function makeCampaign(side) {
    return { side:side || 'US', iron:false, idx:0, funds:6500, recovery:false, completed:[], roster:[], nextId:1,
      stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
  }

  var DATA = null;
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof fldScenarioRegistry !== 'function' || typeof _fldPrisTally !== 'function' || typeof ssPersonRegistry !== 'function')
      return JSON.stringify({ ok:false, fatal:'required tactical/Army Register API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    DATA = GAME_DATA && GAME_DATA["gaines-mill"] ? GAME_DATA["gaines-mill"].gainesMill : null;

    check('DATA CONTRACT: single-phase CS attacker / US defender uses the 27,000 / 32,000 bounded abstraction', function() {
      if (!DATA || DATA.id !== 'gainesMill') throw new Error('GAME_DATA["gaines-mill"].gainesMill missing');
      if (DATA.phases) throw new Error('Gaines Mill must be single-phase');
      if (DATA.attacker !== 'CS' || DATA.defender !== 'US' || DATA.defaultFog !== false || DATA.assaultDoctrine !== 'standard') throw new Error('role/fog/doctrine contract failed');
      var t = totals(DATA), u = allUnits(DATA);
      if (t.US !== 27000 || t.CS !== 32000 || u.length !== 15) throw new Error('strength/unit contract failed: ' + JSON.stringify({ totals:t, units:u.length }));
      for (var i = 0; i < u.length; i++) if (String(u[i].note || '').indexOf('Verified identity; Inferred strength') < 0) throw new Error('missing strength label on ' + u[i].id);
      return { totals:t, units:u.length, opening:DATA.oob.US.length + DATA.oob.CS.length };
    });

    check('REGISTRY + MENU: Gaines Mill sits after Cross Keys / Port Republic and before Malvern Hill', function() {
      var reg = fldScenarioRegistry(), order = fldScenarioMenuOrder(reg);
      if (!reg.gainesMill || reg.gainesMill !== DATA) throw new Error('registry identity missing');
      if (!(order.indexOf('bullrun1') + 1 === order.indexOf('crossKeysPortRepublic') && order.indexOf('crossKeysPortRepublic') + 1 === order.indexOf('gainesMill') && order.indexOf('gainesMill') + 1 === order.indexOf('malvernHill'))) throw new Error('chronology wrong: ' + order.join(' -> '));
      return { order:order, rank:fldScenarioMenuRank('gainesMill') };
    });

    check('TERRAIN + HOME EDGE: the creek obstacle, Watt plateau, and role-aware rears load without sandbox leak', function() {
      var body = JSON.stringify(DATA.terrain || {});
      ['Watt House', 'Boatswain', 'Adams', 'Chickahominy', 'Old Cold Harbor', 'New Cold Harbor'].forEach(function(term){ if (body.indexOf(term) < 0) throw new Error('missing terrain term ' + term); });
      if (!DATA.homeEdge || DATA.homeEdge.US !== 'low' || DATA.homeEdge.CS !== 'high') throw new Error('data home edges wrong');
      if ((DATA.terrain.walls || []).length) throw new Error('wall pattern leaked into Gaines Mill');
      fldLaunchSandbox({ renderer:'none', scenario:'gainesMill', autoBoth:true, seed:3 });
      var usEdge = fldHomeEdgeZ('US'), csEdge = fldHomeEdgeZ('CS');
      if (usEdge !== -60 || csEdge !== FLD.FIELD_H + 60) throw new Error('runtime home edges wrong: ' + usEdge + '/' + csEdge);
      var plateau = fldCoverAt(600, 360), creek = fldCoverAt(530, 500);
      fldLaunchSandbox({ renderer:'none', scenario:'sandbox', autoBoth:true, seed:3 });
      if (__FIELD.homeEdgeZ !== null || fldHomeEdgeZ('US') !== FLD.FIELD_H + 60 || fldHomeEdgeZ('CS') !== -60) throw new Error('home-edge override leaked into sandbox');
      return { home:{ US:usEdge, CS:csEdge }, cover:{ plateau:plateau, creek:creek } };
    });

    check('RANK + SOURCES: exact battle-date grades and source plurality survive in runtime data', function() {
      var leaders = [], sides = ['US', 'CS'];
      for (var si = 0; si < sides.length; si++) for (var li = 0; li < ((DATA.leaders || {})[sides[si]] || []).length; li++) leaders.push(DATA.leaders[sides[si]][li].name);
      ['Brig. Gen. Fitz John Porter', 'Maj. Gen. A. P. Hill', 'Brig. Gen. John B. Hood', 'Maj. Gen. Thomas J. Jackson', 'Maj. Gen. James Longstreet', 'Maj. Gen. D. H. Hill', 'Maj. Gen. Richard S. Ewell', 'Maj. Gen. William H. C. Whiting'].forEach(function(name){ if (leaders.indexOf(name) < 0) throw new Error('missing exact rank ' + name); });
      var body = JSON.stringify(DATA);
      [/Maj\\. Gen\\. Fitz John Porter/, /Brig\\. Gen\\. A\\. P\\. Hill/, /Lt\\. Gen\\. A\\. P\\. Hill/, /Maj\\. Gen\\. John B\\. Hood/, /Lt\\. Gen\\. John B\\. Hood/, /\\bFirst Corps\\b/, /\\bSecond Corps\\b/, /\\bThird Corps\\b/, /Turkey Hill/].forEach(function(re){ if (re.test(body)) throw new Error('forbidden rank/place leaked: ' + re); });
      if (/McClellan/.test(JSON.stringify(DATA.leaders || {})) || /Lt\\. Gen\\./.test(JSON.stringify(DATA.leaders || {}))) throw new Error('forbidden on-map leader leaked');
      return { leaders:leaders };
    });

    check('D74 NO-FUDGE: universal gun model and data-only inputs own the result', function() {
      var bad = [], g = guns(DATA), units = allUnits(DATA); keyScan(DATA, '', bad);
      if (bad.length) throw new Error('forbidden result/combat keys: ' + bad.join(', '));
      if (g.US !== 72 || g.CS !== 32 || !(g.US > g.CS)) throw new Error('gun contract failed: ' + JSON.stringify(g));
      for (var i = 0; i < units.length; i++) if (units[i].arm === 'art' && (!(units[i].guns > 0) || !(units[i].men > 0))) throw new Error('artillery gun/crew missing on ' + units[i].id);
      return { guns:g, forbidden:bad };
    });

    check('LAUNCH + REINFORCEMENTS: single-phase state builds and scheduled arrivals stay ordered and idempotent', function() {
      fldLaunchSandbox({ renderer:'none', scenario:'gainesMill', autoBoth:true, playerSide:'US', seed:12345 });
      if (__FIELD.scenario !== 'gainesMill' || __FIELD.attacker !== 'CS' || __FIELD.defender !== 'US' || __FIELD.phases !== null) throw new Error('runtime single-phase state wrong');
      if (!__FIELD.objective || __FIELD.objective.name !== 'Watt House Plateau') throw new Error('objective wrong');
      var base = __FIELD.units.length, sched = __FIELD.reinforce.slice();
      if (base !== DATA.oob.US.length + DATA.oob.CS.length || sched.length !== DATA.reinforcements.length) throw new Error('opening/schedule count wrong');
      for (var i = 1; i < sched.length; i++) if (sched[i].atSec < sched[i - 1].atSec) throw new Error('reinforcements not sorted');
      __FIELD.phase = 'battle'; __FIELD.t = sched[0].atSec + 1; fldScenarioTick(0.05);
      if (__FIELD.units.length !== base + 1) throw new Error('first reinforcement did not arrive once');
      __FIELD.t = 99999; fldScenarioTick(0.05);
      if (__FIELD.units.length !== base + sched.length) throw new Error('not all reinforcements arrived');
      fldScenarioTick(0.05);
      if (__FIELD.units.length !== base + sched.length) throw new Error('reinforcement duplicated');
      return { opening:base, arrivals:sched.map(function(x){ return x.spec.id + '@' + x.atSec; }) };
    });

    check('SAME-SEED REPLAY: identical inputs produce an exact identical battle and butcher bill', function() {
      var sameSeedReplayResult = sameSeedReplay();
      if (!sameSeedReplayResult.equal) throw new Error('same-seed replay diverged: ' + JSON.stringify(sameSeedReplayResult));
      if (sameSeedReplayResult.a.phase !== 'over' || sameSeedReplayResult.a.badUnit) throw new Error('replay did not resolve cleanly');
      return sameSeedReplayResult.a;
    });

    check('PASSIVE US: a no-input Union player still reaches a valid end state', function() {
      var r = runPassive('US', 17);
      if (r.phase !== 'over' || ['US','CS','draw'].indexOf(r.w) < 0 || r.badUnit) throw new Error('passive US failed: ' + JSON.stringify(r));
      return r;
    });

    check('PASSIVE CS: a no-input Confederate player still reaches a valid end state', function() {
      var r = runPassive('CS', 17);
      if (r.phase !== 'over' || ['US','CS','draw'].indexOf(r.w) < 0 || r.badUnit) throw new Error('passive CS failed: ' + JSON.stringify(r));
      return r;
    });

    check('HISTORICAL DIRECTION: 8 shared-model seeds favor a CS objective victory and greater CS killed/wounded', function() {
      var seeds = ${JSON.stringify(SEEDS)}, csObjectiveWins = 0, csKilledWoundedWins = 0, samples = [];
      for (var i = 0; i < seeds.length; i++) {
        var r = runScenario({ autoBoth:true, seed:seeds[i] });
        if (r.phase !== 'over' || !r.tally || r.badUnit) throw new Error('seed did not resolve cleanly: ' + seeds[i] + ' ' + JSON.stringify(r));
        if (r.w === 'CS' && r.by === 'hold') csObjectiveWins++;
        if (r.tally.CS.kw >= r.tally.US.kw) csKilledWoundedWins++;
        samples.push({ seed:seeds[i], winner:r.w, winBy:r.by, killedWounded:{ US:r.tally.US.kw, CS:r.tally.CS.kw }, captured:{ US:r.tally.US.cap, CS:r.tally.CS.cap }, missing:{ US:r.tally.US.mis, CS:r.tally.CS.mis } });
      }
      if (!(csObjectiveWins >= 5)) throw new Error('CS objective wins below 5/8: ' + csObjectiveWins + ' :: ' + JSON.stringify(samples));
      if (!(csKilledWoundedWins >= 5)) throw new Error('CS killed/wounded direction below 5/8: ' + csKilledWoundedWins + ' :: ' + JSON.stringify(samples));
      return { csObjectiveWins:csObjectiveWins + '/8', csKilledWoundedWins:csKilledWoundedWins + '/8', samples:samples };
    });

    check('TEACHING: dispute, terrain, cost, civilian landscape, and Malvern inverse are sourced and indexed', function() {
      var cards = (DATA.teaching && DATA.teaching.cards) || [], codex = DATA.teaching && DATA.teaching.codex;
      if (cards.length < 5 || !codex) throw new Error('teaching/codex missing');
      for (var i = 0; i < cards.length; i++) if (sourceUrls(cards[i].sources).length < 2) throw new Error('card lacks two source URLs: ' + cards[i].id);
      if (sourceUrls(codex.sources).length < 2) throw new Error('codex lacks two source URLs');
      var ids = cards.map(function(c){ return c.id; });
      ['gm_strength_dispute','gm_boatswain','gm_hood_without_bonus','gm_costly_victory','gm_farms','gm_malvern_inverse'].forEach(function(id){ if (ids.indexOf(id) < 0) throw new Error('missing card ' + id); });
      if (!codex.axes || codex.axes.theater !== 'Eastern' || codex.axes.result !== 'Confederate victory') throw new Error('codex axes wrong');
      return { cards:ids, codex:codex.id, axes:codex.axes };
    });

    check('ARMY REGISTER PIN: 15 Gaines Mill units produce exactly cmd/nco/pvt rows and current total 1380', function() {
      var C = makeCampaign('US'); if (typeof _t1InitAll === 'function') _t1InitAll(C);
      var reg = ssPersonRegistry(C), rows = [], groups = {};
      if (reg.people.length !== 1380) throw new Error('Army Register total is ' + reg.people.length + ', expected 1380');   // D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D388: 1281 -> 1326 — Elkhorn Tavern adds 15 unique side-unit ids x 3 slots. D384: 1200 -> 1281 — Fort Donelson adds 27 units x 3 slots. D380: 1170 -> 1200 — Five Forks adds 10 unique units x 3 slots. The Gaines-specific 45-row/15-unit teeth below remain stable.
      for (var i = 0; i < reg.people.length; i++) {
        var p = reg.people[i], origin = p.replaces || p.pid;
        if (typeof origin === 'string' && origin.indexOf('ss:gainesMill:') === 0) rows.push({ p:p, origin:origin });
      }
      if (rows.length !== 45) throw new Error('Gaines rows are ' + rows.length + ', expected 45');
      for (var j = 0; j < rows.length; j++) {
        var m = rows[j].origin.match(/^ss:gainesMill:(US|CS):([^:]+):(cmd|nco|pvt)$/);
        if (!m) throw new Error('bad Gaines slot id ' + rows[j].origin);
        var key = m[1] + ':' + m[2]; groups[key] = groups[key] || {}; groups[key][m[3]] = 1;
        if (rows[j].p.source !== 'scenario-oob' || rows[j].p.generated !== true || rows[j].p.provenance !== 'Inferred') throw new Error('Gaines slot metadata wrong for ' + rows[j].origin);
      }
      var keys = Object.keys(groups);
      if (keys.length !== 15) throw new Error('Gaines unit groups are ' + keys.length + ', expected 15');
      for (var k = 0; k < keys.length; k++) if (!groups[keys[k]].cmd || !groups[keys[k]].nco || !groups[keys[k]].pvt) throw new Error('incomplete slot trio ' + keys[k]);
      return { total:reg.people.length, gainesRows:rows.length, units:keys.length, slots:['cmd','nco','pvt'] };
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
    check('RUNTIME SIDE CHOICE: menu button is unique, accessible, ordered, and fldLaunchBattle preserves the chosen side', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      fldInjectMenuButton();
      var btn = document.getElementById('fldScnBtn_gainesMill');
      if (!btn || !btn.getAttribute('aria-label')) throw new Error('accessible Gaines menu button missing');
      fldInjectMenuButton();
      if (document.querySelectorAll('#fldScnBtn_gainesMill').length !== 1) throw new Error('duplicate Gaines menu button');
      var ids = Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){ return b.id; });
      if (!(ids.indexOf('fldBullRunBtn') >= 0 && ids.indexOf('fldScnBtn_crossKeysPortRepublic') === ids.indexOf('fldBullRunBtn') + 1 && ids.indexOf('fldScnBtn_gainesMill') === ids.indexOf('fldScnBtn_crossKeysPortRepublic') + 1 && ids.indexOf('fldScnBtn_malvernHill') === ids.indexOf('fldScnBtn_gainesMill') + 1)) throw new Error('button chronology wrong: ' + ids.join(' -> '));
      var got = null; fldScenarioSideChoice('gainesMill', function(side){ got = side; });
      var cards = document.querySelectorAll('[data-brside]'); if (cards.length !== 2) throw new Error('wanted two side cards, got ' + cards.length);
      var cs = document.querySelector('[data-brside="CS"]'); if (!cs) throw new Error('CS side card missing'); cs.click();
      if (got !== 'CS') throw new Error('side choice returned ' + got);
      var captured = null, oldLaunch = window.fldLaunchSandbox, oldBrief = window.fldBullRunBriefing;
      try {
        window.fldLaunchSandbox = function(opts){ captured = opts; };
        window.fldBullRunBriefing = function(){};
        fldLaunchBattle('gainesMill', 'CS');
      } finally {
        window.fldLaunchSandbox = oldLaunch; window.fldBullRunBriefing = oldBrief;
      }
      if (!captured || captured.scenario !== 'gainesMill' || captured.playerSide !== 'CS' || captured.renderer !== '3d') throw new Error('fldLaunchBattle options wrong: ' + JSON.stringify(captured));
      return { button:btn.id, sideChoice:got, launch:captured };
    });
  } catch(e) { R.ok = false; R.fatal = String(e && e.message || e); }
  return JSON.stringify(R);
})()`;

async function main() {
  let server = null, browser = null;
  const url = cfg.baseUrl + '/' + cfg.file;
  const result = { ok:false, steps:[], pageerrors:[] };
  try {
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
    await page.waitForFunction(() => typeof window.fldLaunchSandbox === 'function' && typeof window.fldScenarioRegistry === 'function' && window.GAME_DATA && window.GAME_DATA["gaines-mill"], null, { timeout:45000 });
    const setup = JSON.parse(await page.evaluate(SETUP));
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = (setup.steps || []).concat(dom.steps || []);
    result.pageerrors = result.pageerrors.concat(setup.errors || []);
    if (dom.fatal) result.pageerrors.push('DOM fatal: ' + dom.fatal);
    result.ok = !!setup.ok && !!dom.ok && result.steps.every(s => s.ok) && result.pageerrors.length === 0;
    await page.screenshot({ path:join(OUT, 'probe-gaines-mill.png'), fullPage:true });
  } catch(e) {
    result.fatal = String(e && e.message || e); result.ok = false;
  } finally {
    try { writeFileSync(join(OUT, 'probe-gaines-mill.json'), JSON.stringify(result, null, 2)); } catch {}
    printResult(result);
    await closeBrowserHard(browser); killChild(server);
  }
  if (!result.ok) process.exit(1);
  console.log('ALL OK');
}

main();
