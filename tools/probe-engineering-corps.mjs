#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-engineering-corps.mjs - Phase F: the Tactical Engineering Corps.
// INCREMENTS 1-2 verify FIELD ENTRENCHMENTS + ABATIS/OBSTACLES (T13): earned cover,
// obstacle placement/slow/disorder/clear, B-5 coupling, render/teaching, and the
// byte-identity of every AI-vs-AI baseline.
// Writes tools/shots/probe-engineering-corps.{json,png}.
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

const SETUP = `(() => {
  var R = { steps: [], ok: true };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name: name, ok: true, v: v === undefined ? null : v }); }
    catch (e) { R.ok = false; R.steps.push({ name: name, ok: false, err: String(e && e.message || e) }); }
  }
  function isNum(n) { return typeof n === 'number' && isFinite(n); }
  function freshSandbox(opts) {
    __FIELD._officersOff = true; __FIELD._logisticsOff = true; __FIELD._armsOff = true;
    delete G.settings.tacticalFog;
    fldLaunchSandbox(Object.assign({ renderer: 'none', autoBoth: false, seed: 7 }, opts || {}));
    __FIELD.phase = 'battle'; __FIELD.paused = true;
  }
  function usInf() {
    for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.alive && u.side === 'US') return u; }
    return null;
  }
  try {
    if (typeof fldLaunchSandbox !== 'function' || typeof __FIELD === 'undefined')
      return JSON.stringify({ ok: false, fatal: '__FIELD engine missing' });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch (e) {}

    step('WIRING: the engineering seams exist and fldEngCover is the byte-identical identity for a clean unit', function() {
      ['fldEngCover', 'fldEngStep', 'fldSelEntrench', 'fldSelAbatis', 'fldSelClearObstacle', 'fldEngMoveFactor', 'fldEngMoveGate', 'fldEngFireFactor', 'fldEngRealism', 'fldEngHudSelected', 'fldEngDraw2d', 'fld3dBuildEng', 'fld3dSyncEng', 'fldEngEndHtml'].forEach(function(fn) {
        if (typeof window[fn] !== 'function') throw new Error('missing engineering fn ' + fn);
      });
      if (fldEngCover({}) !== 1) throw new Error('fldEngCover(clean) must be exactly 1, got ' + fldEngCover({}));
      if (fldEngCover({ entrench: 0 }) !== 1) throw new Error('fldEngCover(entrench:0) must be exactly 1');
      return { engCoverClean: fldEngCover({}) };
    });

    step('DIG: an ordered brigade entrenches over time and its earned cover rises toward a parapet', function() {
      freshSandbox();
      var u = usInf(); if (!u) throw new Error('no US unit');
      __FIELD.sev = null; // neutral / Balanced realism
      __FIELD.sel = [u.id];
      fldSelEntrench();
      if (!u.digging) throw new Error('fldSelEntrench did not set digging');
      if (u.entrench && u.entrench > 0.001) throw new Error('entrench should start at 0');
      var cover0 = fldEngCover(u);
      // ~80 sim-seconds of digging (dig time at Balanced is 70s)
      for (var t = 0; t < 800; t++) fldEngStep(0.1);
      var cover1 = fldEngCover(u);
      if (!(u.entrench > 0.9)) throw new Error('entrench should approach full after 80s: ' + u.entrench);
      if (!(cover1 > 1.5)) throw new Error('full entrench cover should exceed 1.5x: ' + cover1);
      if (cover0 !== 1) throw new Error('cover before digging should be 1');
      return { cover0: cover0, entrench: Number(u.entrench.toFixed(3)), coverFull: Number(cover1.toFixed(3)) };
    });

    step('REALISM SLIDER (B-5): Arcade digs faster for modest cover; Historian digs slower for stronger cover', function() {
      freshSandbox();
      var u = usInf();
      function digFixed(attr, secs) {
        __FIELD.sev = { attrition: attr, canister: 1, supply: 1, cmdShock: 1, sight: 1, veteran: 1 };
        u.entrench = 0; u.digging = true; u.digX = u.x; u.digZ = u.z;
        u.order = { type: 'hold', tx: u.x, tz: u.z, tface: u.facing }; u.state = 'steady';
        for (var t = 0; t < secs * 10; t++) fldEngStep(0.1);
        return u.entrench;
      }
      var arc = digFixed(0.7, 30);   // arcade
      var his = digFixed(1.3, 30);   // historian
      if (!(arc > his)) throw new Error('Arcade must dig faster than Historian in fixed time: arc ' + arc + ' vs his ' + his);
      // at full entrench, Historian works are stronger
      __FIELD.sev = { attrition: 1.3 }; var covHis = fldEngCover({ entrench: 1 });
      __FIELD.sev = { attrition: 0.7 }; var covArc = fldEngCover({ entrench: 1 });
      if (!(covHis > covArc)) throw new Error('Historian full-entrench cover must exceed Arcade: ' + covHis + ' vs ' + covArc);
      __FIELD.sev = null;
      return { arc30s: Number(arc.toFixed(3)), his30s: Number(his.toFixed(3)), covHistorian: Number(covHis.toFixed(3)), covArcade: Number(covArc.toFixed(3)) };
    });

    step('COVER REDUCES FRONTAL FIRE — but a FLANK/REAR shot bypasses the parapet (facing-aware)', function() {
      freshSandbox();
      var shooter = null, target = null;
      for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === 'US' && !shooter) shooter = u; if (u.side === 'CS' && !target) target = u; }
      if (!shooter || !target) throw new Error('need a US shooter + CS target');
      // place the target squarely in front of the shooter, in the open (no wall/woods/hill cover)
      shooter.ammo = 100; shooter.alive = true; shooter.state = 'steady'; shooter.morale = shooter.maxMor;
      target.x = shooter.x; target.z = shooter.z - Math.min(shooter.rng * 0.5, 120); target.alive = true; target.state = 'steady';
      // the parapet FACES the shooter (front arc)
      var faceShooter = Math.atan2(shooter.x - target.x, -(shooter.z - target.z));
      var baseCover = fldCoverAt(target.x, target.z);
      var _r = fldRng; fldRng = function() { return 0.5; };   // deterministic fire for the A/B
      function fireOnce(entr, face) {
        target.entrench = entr; target.facing = face; target.men = target.maxMen; target.morale = target.maxMor; target.fatigue = 0;
        var before = target.men; fldResolveFire(shooter, target, 0.1); return before - target.men;
      }
      // hold facing CONSTANT within each A/B pair so only the entrench bonus varies (the frontage arc differs
      // between front/rear, so we compare entrenched-vs-open at the SAME facing, not across facings).
      var casFrontOpen = fireOnce(0, faceShooter);             // front arc, no works
      var casFrontEnt = fireOnce(1, faceShooter);              // front arc, parapet toward the fire -> full cover
      var casRearOpen = fireOnce(0, faceShooter + Math.PI);    // rear arc, no works
      var casRearEnt = fireOnce(1, faceShooter + Math.PI);     // rear arc, parapet faces away -> NO benefit
      fldRng = _r;
      if (!(casFrontOpen > 0)) throw new Error('the open frontal fire should inflict casualties: ' + casFrontOpen);
      if (!(casFrontEnt < casFrontOpen)) throw new Error('a frontally-entrenched target must bleed LESS: open ' + casFrontOpen + ' vs front ' + casFrontEnt);
      var ratio = casFrontOpen / casFrontEnt, expect = fldEngCover({ entrench: 1 });
      if (Math.abs(ratio - expect) > 0.06) throw new Error('front cover ratio ' + ratio.toFixed(3) + ' should match nominal fldEngCover ' + expect.toFixed(3));
      // the parapet gives essentially NO protection against fire from the rear arc
      if (Math.abs(casRearEnt - casRearOpen) > casRearOpen * 0.05) throw new Error('a rear shot must bypass the parapet: rear-entrenched ' + casRearEnt.toFixed(1) + ' should ~equal rear-open ' + casRearOpen.toFixed(1));
      if (!(casRearEnt > casFrontEnt)) throw new Error('a rear shot on a dug-in unit must hurt more than a frontal one: rear ' + casRearEnt.toFixed(1) + ' vs front ' + casFrontEnt.toFixed(1));
      return { baseTerrainCover: baseCover, casFrontOpen: Number(casFrontOpen.toFixed(1)), casFrontEnt: Number(casFrontEnt.toFixed(1)), casRearOpen: Number(casRearOpen.toFixed(1)), casRearEnt: Number(casRearEnt.toFixed(1)), frontRatio: Number(ratio.toFixed(3)) };
    });

    step('ABANDON: marching off the works cancels digging and the parapet fades', function() {
      freshSandbox();
      var u = usInf(); __FIELD.sev = null;
      u.entrench = 1; u.digging = true; u.digX = u.x; u.digZ = u.z;
      var peak = u.entrench;
      fldOrderMove(u, u.x + 220, u.z, u.facing);
      for (var t = 0; t < 120; t++) { fldStepMovement(u, 0.1); fldEngStep(0.1); }
      if (u.digging) throw new Error('digging should cancel after marching off the works');
      if (!(u.entrench < peak)) throw new Error('abandoned works should fade: ' + u.entrench);
      return { movedTo: Math.round(u.x), digging: u.digging, entrenchAfter: Number(u.entrench.toFixed(3)) };
    });

    step('ABATIS: pioneer order builds a capped front belt; enemies slow while friends retain lanes', function() {
      freshSandbox(); __FIELD.sev = { attrition: 1 };
      var u = usInf(); u.facing = 0; __FIELD.sel = [u.id];
      fldSelAbatis();
      var obs = __FIELD.engObstacles || [], a = obs[0]; if (!a) throw new Error('abatis order created no belt');
      for (var t = 0; t < 520; t++) fldEngStep(0.1);
      if (!(a.strength > 0.98) || a.building) throw new Error('belt should complete near 48s: ' + a.strength);
      var cx = (a.x1 + a.x2) / 2, cz = (a.z1 + a.z2) / 2;
      var enemy = null; for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].side === 'CS') { enemy = __FIELD.units[i]; break; }
      var slow = fldEngMoveFactor(cx, cz, enemy), friendly = fldEngMoveFactor(cx, cz, u);
      if (!(slow < 0.5)) throw new Error('full balanced belt should slow enemy below half speed: ' + slow);
      if (friendly !== 1) throw new Error('friendly lanes must retain exact factor 1: ' + friendly);
      return { belts: obs.length, strength: Number(a.strength.toFixed(3)), enemyFactor: Number(slow.toFixed(3)), friendlyFactor: friendly };
    });

    step('ABATIS CONTACT: crossing disorders morale/fire once, then cohesion recovers', function() {
      freshSandbox(); __FIELD.sev = { attrition: 1 };
      var u = usInf(); __FIELD.sel = [u.id]; fldSelAbatis();
      var a = __FIELD.engObstacles[0]; a.strength = 1; a.building = false;
      var enemy = null; for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].side === 'CS') { enemy = __FIELD.units[i]; break; }
      var cx = (a.x1 + a.x2) / 2, cz = (a.z1 + a.z2) / 2, m0 = enemy.morale;
      fldEngMoveGate(enemy, cx, cz + 30, cx, cz - 30, 0.1);
      var m1 = enemy.morale, f1 = fldEngFireFactor(enemy);
      fldEngMoveGate(enemy, cx, cz + 4, cx, cz - 4, 0.1);
      if (!(m1 < m0) || !(enemy.engDisorder > 0)) throw new Error('crossing must impose morale + disorder');
      if (enemy.morale !== m1) throw new Error('same contact must not double-charge morale');
      if (!(f1 < 1) || fldEngFireFactor({}) !== 1) throw new Error('disorder fire factor must penalize only affected unit');
      for (var t = 0; t < 200; t++) fldEngStep(0.1);
      if (enemy.engDisorder !== 0 || fldEngFireFactor(enemy) !== 1) throw new Error('cohesion should recover to exact identity');
      return { moraleDrop: Number((m0 - m1).toFixed(2)), disorderFire: f1, recovered: fldEngFireFactor(enemy) };
    });

    step('CLEAR + REALISM: nearby infantry opens a lane; Historian clears slower than Arcade', function() {
      freshSandbox();
      var u = usInf(); __FIELD.sel = [u.id]; fldSelAbatis();
      var a = __FIELD.engObstacles[0]; a.strength = 1; a.building = false;
      u.x = (a.x1 + a.x2) / 2; u.z = (a.z1 + a.z2) / 2;
      function clearTen(attr) {
        a.strength = 1; a.building = false; u.engClearId = null; __FIELD.sev = { attrition: attr };
        fldSelClearObstacle(); for (var t = 0; t < 100; t++) fldEngStep(0.1); return a.strength;
      }
      var arcade = clearTen(0.7), historian = clearTen(1.3);
      if (!(arcade < historian)) throw new Error('Arcade must clear faster: ' + arcade + ' vs ' + historian);
      __FIELD.sev = { attrition: 1 }; a.strength = 0.05; u.engClearId = a.id;
      for (var q = 0; q < 30; q++) fldEngStep(0.1);
      if ((__FIELD.engObstacles || []).length) throw new Error('fully cleared belt should be removed');
      return { arcadeAfter10s: Number(arcade.toFixed(3)), historianAfter10s: Number(historian.toFixed(3)), removed: true };
    });

    step('BYTE-IDENTITY: a full AI-vs-AI baseline never entrenches and fldEngCover stays 1 for every unit', function() {
      __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
      fldLaunchSandbox({ renderer: 'none', autoBoth: true, seed: 3 });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      for (var t = 0; t < 400; t++) fldSimStep(0.05);
      var anyEnt = 0, anyCover = 0;
      for (var i = 0; i < __FIELD.units.length; i++) {
        var u = __FIELD.units[i];
        if (u.entrench && u.entrench > 0) anyEnt++;
        if (fldEngCover(u) !== 1) anyCover++;
      }
      if (anyEnt) throw new Error(anyEnt + ' units entrenched in an AI baseline (AI must not auto-dig)');
      if (anyCover) throw new Error(anyCover + ' units have a non-1 eng cover in a baseline');
      if (__FIELD.engObstacles && __FIELD.engObstacles.length) throw new Error('AI baseline created obstacle belts');
      return { units: __FIELD.units.length, entrenched: anyEnt, obstacles: (__FIELD.engObstacles || []).length, nonIdentityCover: anyCover };
    });

    step('RENDER + HUD: the 2D parapet draws without error and the HUD reports the works', function() {
      freshSandbox();
      var u = usInf(); u.entrench = 0.8; u.digging = true; u.digX = u.x; u.digZ = u.z;
      var calls = 0;
      var stub = { save: function(){}, restore: function(){}, translate: function(){}, rotate: function(){},
        beginPath: function(){}, moveTo: function(){}, lineTo: function(){}, closePath: function(){},
        fill: function(){ calls++; }, stroke: function(){ calls++; }, set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){} };
      fldEngDraw2d(stub, { ox: 0, oz: 0, s: 1 });
      if (calls < 2) throw new Error('the 2D parapet should issue draw calls: ' + calls);
      var hud = fldEngHudSelected(u);
      if (hud.indexOf('%') < 0 || (hud.indexOf('cover') < 0 && hud.indexOf('×') < 0)) throw new Error('HUD should report entrench % + cover: ' + hud);
      if (fldEngHudSelected({}) !== '') throw new Error('HUD must be empty for a non-entrenching unit');
      __FIELD._engUsed = { abatis: true };
      var card = fldEngEndHtml(); if (card.indexOf('Mahan') < 0 || card.indexOf('abatis') < 0) throw new Error('abatis teaching card/provenance missing');
      return { drawCalls: calls, hudHasPct: hud.indexOf('%') >= 0, teaching: card.indexOf('Mahan') >= 0 };
    });

    step('ART/ROUTING SANITY: a routed unit does not progress; the order seam survives an empty selection', function() {
      freshSandbox();
      var u = usInf();
      u.entrench = 0; u.digging = true; u.digX = u.x; u.digZ = u.z; u.state = 'routing';
      for (var t = 0; t < 200; t++) fldEngStep(0.1);
      if (u.entrench > 0.001) throw new Error('a routing unit must not dig: ' + u.entrench);
      __FIELD.sel = [];
      fldSelEntrench(); // must not throw on empty selection
      return { routingEntrench: u.entrench };
    });

    step('MULTI-PHASE RESET: a phase advance drops the prior sector belts but KEEPS the teaching flag', function() {
      freshSandbox(); __FIELD.sev = { attrition: 1 };
      var u = usInf(); __FIELD.sel = [u.id]; fldSelAbatis();
      __FIELD._engUsed = { abatis: true };
      if (!(__FIELD.engObstacles && __FIELD.engObstacles.length)) throw new Error('precondition: a belt should exist before the phase reset');
      if (typeof fldEngPhaseReset !== 'function') throw new Error('fldEngPhaseReset missing (the multi-phase obstacle-leak fix)');
      fldEngPhaseReset();
      if (__FIELD.engObstacles) throw new Error('phase reset must drop the prior sector belts (HIGH bug): ' + JSON.stringify(__FIELD.engObstacles));
      if (!(__FIELD._engUsed && __FIELD._engUsed.abatis)) throw new Error('phase reset must KEEP _engUsed so the end-card still fires across phases');
      return { obstaclesAfter: (__FIELD.engObstacles || []).length, engUsedKept: !!(__FIELD._engUsed && __FIELD._engUsed.abatis) };
    });

    step('ABANDONED BELT DECAYS: an immature belt whose builder marches off fades and frees the cap', function() {
      freshSandbox(); __FIELD.sev = { attrition: 1 };
      var u = usInf(); u.facing = 0; __FIELD.sel = [u.id]; fldSelAbatis();
      if (!(__FIELD.engObstacles && __FIELD.engObstacles.length === 1)) throw new Error('expected exactly one fresh belt');
      u.order = { type: 'move', tx: u.x + 600, tz: u.z, tface: u.facing }; u.x += 600;   // abandon before maturity
      for (var t = 0; t < 400; t++) fldEngStep(0.1);
      if ((__FIELD.engObstacles || []).length) throw new Error('an abandoned immature belt must decay away, not linger and eat a build-cap slot: ' + JSON.stringify(__FIELD.engObstacles));
      return { remaining: (__FIELD.engObstacles || []).length };
    });

    step('UNIQUE IDS: two single-unit belts ordered at the same frozen sim-tick get distinct ids', function() {
      freshSandbox(); __FIELD.sev = { attrition: 1 };
      var us = []; for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].side === 'US' && __FIELD.units[i].alive) us.push(__FIELD.units[i]);
      if (us.length < 2) throw new Error('need two US brigades for the collision test');
      us[0].arm = 'inf'; us[1].arm = 'inf'; __FIELD.t = 5;   // frozen tick: the old time-keyed id would collide here
      __FIELD.sel = [us[0].id]; fldSelAbatis();
      __FIELD.sel = [us[1].id]; fldSelAbatis();
      var obs = __FIELD.engObstacles || [];
      if (obs.length !== 2) throw new Error('expected two belts, got ' + obs.length);
      if (obs[0].id === obs[1].id) throw new Error('belt ids collided at the same tick: ' + obs[0].id);
      return { ids: [obs[0].id, obs[1].id], distinct: obs[0].id !== obs[1].id };
    });

    step('ROUTING IMMUNITY: a routed unit fleeing through a belt is not further morale-docked', function() {
      freshSandbox(); __FIELD.sev = { attrition: 1 };
      var u = usInf(); __FIELD.sel = [u.id]; fldSelAbatis();
      var a = __FIELD.engObstacles[0]; a.strength = 1; a.building = false;
      var enemy = null; for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].side === 'CS') { enemy = __FIELD.units[i]; break; }
      enemy.state = 'routing'; enemy._engObsTouch = null; enemy.engDisorder = 0; var m0 = enemy.morale;
      var cx = (a.x1 + a.x2) / 2, cz = (a.z1 + a.z2) / 2;
      fldEngMoveGate(enemy, cx, cz + 30, cx, cz - 30, 0.1);
      if (enemy.morale !== m0) throw new Error('a routing unit must not be morale-docked by the belt: ' + enemy.morale + ' vs ' + m0);
      if (enemy.engDisorder) throw new Error('a routing unit must not be disordered by the belt');
      return { moraleUnchanged: enemy.morale === m0, disorder: enemy.engDisorder };
    });

  } catch (e) { R.ok = false; R.steps.push({ name: 'FATAL', ok: false, err: String(e && e.message || e) }); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null, browser = null;
  const pageerrors = [];
  let result = { ok: false };
  try {
    if (!(await up(probe))) {
      srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      let ready = false;
      for (let i = 0; i < 60; i++) { if (await up(probe)) { ready = true; break; } await sleep(150); }
      if (!ready) throw new Error(`local probe server did not bind on ${cfg.baseUrl}`);
    }
    // A macOS GUI browser launched as a child of Codex Seatbelt aborts inside HIServices
    // (TransformProcessType) before Playwright can connect. Refuse that known-bad launch
    // cleanly: no crash report, and the finally block still owns/terminates any server.
    if (process.env.CODEX_SANDBOX === 'seatbelt') {
      throw new Error('browser launch blocked by Codex Seatbelt; restart Codex with default_permissions=":danger-full-access" or run this probe from a normal terminal');
    }
    try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
    catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }
    const page = await browser.newPage({ viewport: cfg.viewport });
    await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch (e) {} });
    page.on('pageerror', e => pageerrors.push(String(e.message)));
    await page.goto(probe, { waitUntil: 'load', timeout: 60000 });
    await sleep(400);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    if (pageerrors.length) result.ok = false;
  } catch (e) {
    result = { ok: false, fatal: String(e && e.message || e), pageerrors };
  } finally {
    writeFileSync(join(OUT, 'probe-engineering-corps.json'), JSON.stringify(result, null, 2));
    console.log('probe-engineering-corps ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
    if (result.fatal) console.log('  FATAL ' + result.fatal);
    if (result.steps) for (const s of result.steps) {
      if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
      else console.log('  ok   ' + s.name.slice(0, 60) + ' :: ' + JSON.stringify(s.v));
    }
    if (browser) try { await Promise.race([browser.close(), sleep(2500)]); } catch (e) {}
    if (srv) { try { srv.kill(); } catch (e) {} }
  }
  if (!result.ok || result.fatal || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
