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
  function freshRiver() { freshSandbox({ river: true }); }
  function river0() { return (__FIELD.terrain && __FIELD.terrain.rivers && __FIELD.terrain.rivers[0]) || null; }
  function fordOf(deep) { var r = river0(); if (!r) return null; for (var i = 0; i < r.crossings.length; i++) { var c = r.crossings[i]; if (c.kind === 'ford' && !!c.deep === !!deep) return c; } return null; }
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
      ['fldEngCover', 'fldEngStep', 'fldSelEntrench', 'fldSelAbatis', 'fldSelClearObstacle', 'fldEngMoveFactor', 'fldEngMoveGate', 'fldEngFireFactor', 'fldEngRealism', 'fldEngProgress', 'fldEngStage', 'fldEngStageName', 'fldEngInOwnWorks', 'fldEngHudSelected', 'fldEngDraw2d', 'fld3dBuildEng', 'fld3dSyncEng', 'fldEngEndHtml',
       'fldSelPontoon', 'fldEngCrossAt', 'fldEngInstallRiver', 'fldEngDrawWater2d', 'fld3dBuildWater'].forEach(function(fn) {
        if (typeof window[fn] !== 'function') throw new Error('missing engineering fn ' + fn);
      });
      if (fldEngCover({}) !== 1) throw new Error('fldEngCover(clean) must be exactly 1, got ' + fldEngCover({}));
      if (fldEngCover({ entrench: 0 }) !== 1) throw new Error('fldEngCover(entrench:0) must be exactly 1');
      // INCREMENT 3 no-op identities with NO river declared (every shipped scenario): the gate is inert.
      freshSandbox();
      if (fldEngCrossAt(100, 100) !== null) throw new Error('fldEngCrossAt must be null with no river declared');
      if (fldEngMoveGate({ x: 100, z: 100, state: 'steady' }, 100, 100, 110, 110, 0.1) !== null) throw new Error('fldEngMoveGate must be null with no river/obstacle');
      if (fldEngMoveFactor(100, 100, { side: 'US' }) !== 1) throw new Error('fldEngMoveFactor must be exactly 1 with no river/obstacle');
      return { engCoverClean: fldEngCover({}), crossNoRiver: fldEngCrossAt(100, 100) };
    });

    step('DIG: an ordered brigade progresses through hasty cover, full parapet, then redoubt', function() {
      freshSandbox();
      var u = usInf(); if (!u) throw new Error('no US unit');
      __FIELD.sev = null; // neutral / Balanced realism
      __FIELD.sel = [u.id];
      fldSelEntrench();
      if (!u.digging) throw new Error('fldSelEntrench did not set digging');
      if (u.entrench && u.entrench > 0.001) throw new Error('entrench should start at 0');
      var cover0 = fldEngCover(u);
      for (var h = 0; h < 100; h++) fldEngStep(0.1);   // ~10s -> hasty cover
      var hastyStage = fldEngStage(u), hastyName = fldEngStageName(u), coverH = fldEngCover(u);
      for (var p = 0; p < 160; p++) fldEngStep(0.1);   // ~26s total -> parapet
      var paraStage = fldEngStage(u), paraName = fldEngStageName(u), coverP = fldEngCover(u);
      for (var r = 0; r < 160; r++) fldEngStep(0.1);   // ~42s total -> redoubt/top stage
      var redStage = fldEngStage(u), redName = fldEngStageName(u), coverR = fldEngCover(u);
      if (hastyStage !== 1 || hastyName.indexOf('Hasty') < 0) throw new Error('expected hasty stage after 10s: stage=' + hastyStage + ' name=' + hastyName + ' e=' + u.entrench);
      if (paraStage !== 2 || paraName.indexOf('parapet') < 0) throw new Error('expected parapet stage after 26s: stage=' + paraStage + ' name=' + paraName + ' e=' + u.entrench);
      if (redStage !== 3 || redName.indexOf('Redoubt') < 0) throw new Error('expected redoubt stage after 42s: stage=' + redStage + ' name=' + redName + ' e=' + u.entrench);
      if (!(cover0 === 1 && coverH > cover0 && coverP > coverH && coverR > coverP)) throw new Error('cover should rise monotonically: ' + [cover0, coverH, coverP, coverR].join(','));
      if (!(u.entrench > 0.98)) throw new Error('entrench should reach full after ~42s: ' + u.entrench);
      if (cover0 !== 1) throw new Error('cover before digging should be 1');
      return { stages: [hastyName, paraName, redName], entrench: Number(u.entrench.toFixed(3)), cover: [Number(coverH.toFixed(3)), Number(coverP.toFixed(3)), Number(coverR.toFixed(3))] };
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
      var coverAfterMove = fldEngCover(u);
      if (u.digging) throw new Error('digging should cancel after marching off the works');
      if (!(u.entrench < peak)) throw new Error('abandoned works should fade: ' + u.entrench);
      if (coverAfterMove !== 1) throw new Error('abandoned works must no longer shelter the live unit: cover=' + coverAfterMove);
      return { movedTo: Math.round(u.x), digging: u.digging, entrenchAfter: Number(u.entrench.toFixed(3)), coverAfterMove: coverAfterMove };
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

    step('PREPARED ABATIS: tying the belt to full works makes it bite harder and clear slower', function() {
      function builtBelt(prepared) {
        freshSandbox(); __FIELD.sev = { attrition: 1 };
        var u = usInf(); u.facing = 0; u.arm = 'inf'; u.order = { type: 'hold', tx: u.x, tz: u.z, tface: u.facing };
        if (prepared) { u.entrench = 1; u.digging = true; u.digX = u.x; u.digZ = u.z; }
        __FIELD.sel = [u.id]; fldSelAbatis();
        var a = (__FIELD.engObstacles || [])[0]; if (!a) throw new Error('no belt built');
        a.strength = 1; a.building = false;
        var enemy = null; for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].side === 'CS') { enemy = __FIELD.units[i]; break; }
        var cx = (a.x1 + a.x2) / 2, cz = (a.z1 + a.z2) / 2;
        var slow = fldEngMoveFactor(cx, cz, enemy);
        var m0 = enemy.morale; enemy._engObsTouch = null; enemy.engDisorder = 0;
        fldEngMoveGate(enemy, cx, cz + 30, cx, cz - 30, 0.1);
        return { u: u, a: a, cx: cx, cz: cz, slow: slow, moraleDrop: m0 - enemy.morale, disorder: enemy.engDisorder, prepared: !!a.prepared, worksStage: a.worksStage || 0 };
      }
      var base = builtBelt(false), prep = builtBelt(true);
      if (!prep.prepared || prep.worksStage < 2) throw new Error('covered belt should stamp prepared works metadata: ' + JSON.stringify({ prepared: prep.prepared, worksStage: prep.worksStage }));
      if (!(prep.slow < base.slow)) throw new Error('prepared abatis should slow more strongly: prep ' + prep.slow + ' vs base ' + base.slow);
      if (!(prep.moraleDrop > base.moraleDrop && prep.disorder > base.disorder)) throw new Error('prepared abatis should disorder more: prep ' + prep.moraleDrop + '/' + prep.disorder + ' vs base ' + base.moraleDrop + '/' + base.disorder);
      function clearTen(prepared) {
        var b = builtBelt(prepared), u = b.u, a = b.a;
        u.x = b.cx; u.z = b.cz; u.order = { type: 'hold', tx: u.x, tz: u.z, tface: u.facing }; __FIELD.sel = [u.id];
        fldSelClearObstacle(); for (var t = 0; t < 100; t++) fldEngStep(0.1);
        return a.strength;
      }
      var baseLeft = clearTen(false), prepLeft = clearTen(true);
      if (!(prepLeft > baseLeft)) throw new Error('prepared abatis should clear slower: prepLeft ' + prepLeft + ' vs baseLeft ' + baseLeft);
      return { baseSlow: Number(base.slow.toFixed(3)), prepSlow: Number(prep.slow.toFixed(3)), baseClearLeft: Number(baseLeft.toFixed(3)), prepClearLeft: Number(prepLeft.toFixed(3)) };
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
      if (__FIELD.terrain && __FIELD.terrain.rivers) throw new Error('AI baseline declared a river (must be opt-in only)');
      if (__FIELD.engPontoons && __FIELD.engPontoons.length) throw new Error('AI baseline created pontoon bridges');
      return { units: __FIELD.units.length, entrenched: anyEnt, obstacles: (__FIELD.engObstacles || []).length, nonIdentityCover: anyCover, rivers: !!(__FIELD.terrain && __FIELD.terrain.rivers), pontoons: (__FIELD.engPontoons || []).length };
    });

    step('RENDER + HUD: the 2D redoubt draws without error and the HUD reports the staged works', function() {
      freshSandbox();
      var u = usInf(); u.entrench = 1; u.digging = true; u.digX = u.x; u.digZ = u.z;
      var calls = 0;
      var stub = { save: function(){}, restore: function(){}, translate: function(){}, rotate: function(){},
        beginPath: function(){}, moveTo: function(){}, lineTo: function(){}, closePath: function(){},
        fill: function(){ calls++; }, stroke: function(){ calls++; }, set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){} };
      fldEngDraw2d(stub, { ox: 0, oz: 0, s: 1 });
      if (calls < 2) throw new Error('the 2D parapet should issue draw calls: ' + calls);
      var hud = fldEngHudSelected(u);
      if (hud.indexOf('Redoubt') < 0 || hud.indexOf('%') < 0 || (hud.indexOf('cover') < 0 && hud.indexOf('×') < 0)) throw new Error('HUD should report redoubt stage + cover: ' + hud);
      if (fldEngHudSelected({}) !== '') throw new Error('HUD must be empty for a non-entrenching unit');
      __FIELD._engUsed = { entrench: true, abatis: true };
      var card = fldEngEndHtml(); if (card.indexOf('Hess') < 0 || card.indexOf('Mahan') < 0 || card.indexOf('abatis') < 0) throw new Error('staged works / abatis teaching card provenance missing');
      return { drawCalls: calls, hudHasRedoubt: hud.indexOf('Redoubt') >= 0, teaching: card.indexOf('Hess') >= 0 && card.indexOf('Mahan') >= 0 };
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

    step('RIVER: an opt-in river installs a water band with two fords and BLOCKS an illegal water step', function() {
      freshRiver();
      var r = river0(); if (!r) throw new Error('opts.river did not install a river');
      if (!(r.crossings && r.crossings.length >= 2)) throw new Error('the river should declare crossings (fords)');
      var base = fordOf(false).z, ox = 600;   // the river centerline z (fords sit on it); ox is between the two flank fords -> no crossing
      var u = usInf(); __FIELD.sev = null; u.x = ox; u.z = base + 150; u.arm = 'inf';   // dry, south of the band
      var cBlock = fldEngCrossAt(ox, base);
      if (!cBlock || cBlock.open) throw new Error('mid-river (no crossing) must be blocked water: ' + JSON.stringify(cBlock));
      var clamp = fldEngMoveGate(u, ox, base + 150, ox, base, 0.1);
      if (!clamp || typeof clamp.z !== 'number') throw new Error('an illegal water step must return a clamped bank point');
      // marching toward the band from the south, the unit must HALT on the near (south) bank (~base + halfW), not wade in
      if (!(clamp.z > base + 20 && clamp.z <= base + 150)) throw new Error('the clamp must stop the unit on the near bank, not in the water: z=' + clamp.z + ' base=' + base);
      var atBank = fldEngCrossAt(clamp.x, clamp.z);
      if (atBank && !atBank.open) throw new Error('the bank point must be a legal (non-blocked) position');
      return { crossings: r.crossings.length, base: base, blockedKind: cBlock.kind, bankZ: Math.round(clamp.z) };
    });

    step('RIVER LEAK GUARD: a unit on an OPEN ford cannot sidestep off it into deep water (bug-hunt fix)', function() {
      freshRiver(); __FIELD.sev = null;
      var f = fordOf(false), base = f.z, u = usInf(); u.arm = 'inf';
      // stand the unit ON the open ford, then order a step laterally ALONG the river off the ford into deep water
      u.x = f.x; u.z = base;
      var onFord = fldEngCrossAt(u.x, u.z); if (!onFord || !onFord.open) throw new Error('precondition: the unit should be on an OPEN ford');
      var offX = f.x + 200;   // 200yd along the river, well past the 88yd ford corridor, still in the band
      var deep = fldEngCrossAt(offX, base); if (!deep || deep.open) throw new Error('precondition: 200yd off the ford should be blocked water: ' + JSON.stringify(deep));
      var clamp = fldEngMoveGate(u, f.x, base, offX, base, 0.1);
      if (!clamp) throw new Error('stepping off an open ford into deep water must be GATED (the sidestep leak), got null');
      var at = fldEngCrossAt(clamp.x, clamp.z);
      if (at && !at.open) throw new Error('the clamp must land the unit on a legal (open/dry) position, not in deep water');
      // ...but a unit already mired in the water can still crawl back out (no permanent trap)
      u.x = offX; u.z = base;   // pretend it is in the water
      var escape = fldEngMoveGate(u, offX, base, offX, base + 120, 0.1);   // crawl toward the south bank
      if (escape) { var e2 = fldEngCrossAt(escape.x, escape.z); if (e2 && !e2.open && (escape.z <= base)) throw new Error('a mired unit must be able to crawl out, not be trapped'); }
      return { onFordKind: onFord.kind, leakGated: !!clamp, clampLegal: !(at && !at.open) };
    });

    step('FORD: a shallow ford is passable but slow; a friendly march elsewhere on dry land is full speed', function() {
      freshRiver(); __FIELD.sev = null;
      var f = fordOf(false); if (!f) throw new Error('no shallow ford');
      var u = usInf();
      var cr = fldEngCrossAt(f.x, f.z);
      if (!cr || !cr.open || cr.kind !== 'ford') throw new Error('the shallow ford must be an OPEN ford crossing: ' + JSON.stringify(cr));
      var slow = fldEngMoveFactor(f.x, f.z, u);
      if (!(slow > 0.30 && slow < 1)) throw new Error('fording must slow movement below 1 (and above the floor): ' + slow);
      var dry = fldEngMoveFactor(50, 50, u);   // a corner far from the river
      if (dry !== 1) throw new Error('dry-land movement must stay exactly 1: ' + dry);
      return { fordSlow: Number(slow.toFixed(3)), dryFactor: dry };
    });

    step('REALISM FORDABILITY (B-5): a DEEP ford is fordable at Arcade but requires a pontoon at Historian', function() {
      freshRiver();
      var d = fordOf(true); if (!d) throw new Error('no deep ford');
      __FIELD.sev = { attrition: 0.7 };   // Arcade
      var arc = fldEngCrossAt(d.x, d.z);
      __FIELD.sev = { attrition: 1.3 };   // Historian
      var his = fldEngCrossAt(d.x, d.z);
      __FIELD.sev = null;
      if (!arc || !arc.open) throw new Error('a deep ford must be fordable at Arcade realism: ' + JSON.stringify(arc));
      if (!his || his.open) throw new Error('a deep ford must NOT be fordable at Historian realism (needs a pontoon): ' + JSON.stringify(his));
      return { arcadeOpen: arc.open, historianOpen: his.open, historianKind: his.kind };
    });

    step('PONTOON: a brigade on the bank lays a bridge that opens a fast crossing where none existed', function() {
      freshRiver(); __FIELD.sev = null;
      var base = fordOf(false).z;
      var u = usInf(); u.x = 600; u.z = base + 90; u.arm = 'inf'; __FIELD.sel = [u.id];   // near the bank, away from both fords
      if (fldEngCrossAt(600, base) && fldEngCrossAt(600, base).open) throw new Error('precondition: mid-river should be impassable before bridging');
      fldSelPontoon();
      var pp = __FIELD.engPontoons || []; if (!pp.length) throw new Error('fldSelPontoon laid no bridge');
      var pn = pp[0];
      for (var t = 0; t < 900; t++) fldEngStep(0.1);   // ~90 sim-seconds (build is ~58s balanced)
      if (!(pn.strength >= 1) || pn.building) throw new Error('the pontoon should complete after ~90s: ' + pn.strength);
      var cr = fldEngCrossAt(pn.x, pn.z);
      if (!cr || !cr.open || cr.kind !== 'pontoon') throw new Error('a completed pontoon must be an OPEN crossing: ' + JSON.stringify(cr));
      // a step into the band AT the pontoon corridor is now allowed (no clamp); full speed across it
      var clamp = fldEngMoveGate(u, pn.x, pn.z + 90, pn.x, pn.z, 0.1);
      if (clamp) throw new Error('stepping onto the finished pontoon must be allowed (no clamp), got ' + JSON.stringify(clamp));
      if (fldEngMoveFactor(pn.x, pn.z, u) !== 1) throw new Error('a pontoon/bridge corridor must be full speed (factor 1)');
      // ...while the same step at a NON-crossing span is still blocked
      var blocked = fldEngMoveGate(u, pn.x - 150, pn.z + 90, pn.x - 150, pn.z, 0.1);
      if (!blocked) throw new Error('a non-crossing span must still block (the bridge is a local corridor, not a ford of the whole river)');
      return { strength: Number(pn.strength.toFixed(3)), crossKind: cr.kind, ponId: pn.id, blockedElsewhere: !!blocked };
    });

    step('PONTOON REALISM + WASH-OUT: Historian lays slower than Arcade; an abandoned half-bridge washes away', function() {
      function layFixed(attr, secs) {
        freshRiver(); __FIELD.sev = { attrition: attr };
        var base = fordOf(false).z, u = usInf(); u.x = 600; u.z = base + 90; u.arm = 'inf'; __FIELD.sel = [u.id];
        fldSelPontoon();
        var pn = (__FIELD.engPontoons || [])[0]; if (!pn) throw new Error('no bridge ordered');
        for (var t = 0; t < secs * 10; t++) fldEngStep(0.1);
        return pn.strength;
      }
      var arc = layFixed(0.7, 25), his = layFixed(1.3, 25);
      if (!(arc > his)) throw new Error('Arcade must lay a pontoon faster than Historian: arc ' + arc + ' vs his ' + his);
      // wash-out: the escorting brigade marches off before completion -> the half-laid bridge decays away
      freshRiver(); __FIELD.sev = null;
      var base2 = fordOf(false).z, u2 = usInf(); u2.x = 600; u2.z = base2 + 90; u2.arm = 'inf'; __FIELD.sel = [u2.id]; fldSelPontoon();
      for (var w = 0; w < 80; w++) fldEngStep(0.1);   // partial lay
      u2.order = { type: 'move', tx: 600, tz: 30, tface: 0 }; u2.x = 600; u2.z = 200;   // march far off
      for (var d2 = 0; d2 < 400; d2++) fldEngStep(0.1);
      if ((__FIELD.engPontoons || []).length) throw new Error('an abandoned half-bridge must wash away, not linger: ' + JSON.stringify(__FIELD.engPontoons));
      __FIELD.sev = null;
      return { arc25s: Number(arc.toFixed(3)), his25s: Number(his.toFixed(3)), washedOut: true };
    });

    step('WATER RENDER + TEACHING: the river/pontoon 2D draw issues calls and the pontoon teaching card is sourced', function() {
      freshRiver();
      var base = fordOf(false).z, u = usInf(); u.x = 600; u.z = base + 90; u.arm = 'inf'; __FIELD.sel = [u.id]; fldSelPontoon();
      var calls = 0;
      var stub = { save: function(){}, restore: function(){}, translate: function(){}, rotate: function(){},
        beginPath: function(){}, moveTo: function(){}, lineTo: function(){}, closePath: function(){}, arc: function(){}, ellipse: function(){},
        fill: function(){ calls++; }, stroke: function(){ calls++; }, fillText: function(){}, strokeText: function(){},
        set fillStyle(v){}, set strokeStyle(v){}, set lineWidth(v){}, set lineCap(v){}, set lineJoin(v){}, set font(v){}, set textAlign(v){}, set textBaseline(v){} };
      fldEngDrawWater2d(stub, { ox: 0, oz: 0, s: 1 });
      if (calls < 3) throw new Error('the river 2D render should issue draw calls: ' + calls);
      // no-op on a riverless field
      freshSandbox(); var calls0 = 0;
      var stub0 = Object.assign({}, stub); stub0.stroke = function(){ calls0++; }; stub0.fill = function(){ calls0++; };
      fldEngDrawWater2d(stub0, { ox: 0, oz: 0, s: 1 });
      if (calls0 !== 0) throw new Error('fldEngDrawWater2d must be a no-op with no river: ' + calls0);
      __FIELD._engUsed = { pontoon: true };
      var card = fldEngEndHtml();
      if (card.indexOf('pontoon') < 0 && card.indexOf('Pontoon') < 0) throw new Error('pontoon teaching card missing');
      if (card.indexOf('Verified') < 0 || card.indexOf('Rappahannock') < 0) throw new Error('pontoon teaching card must be sourced (Fredericksburg/Rappahannock): ' + card.slice(0, 120));
      return { riverDrawCalls: calls, riverlessCalls: calls0, teaching: card.indexOf('Verified') >= 0 };
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
    // The embedded-photo tier can keep the window "load" event open while
    // local assets stream; the probe only needs inline scripts ready.
    await page.goto(probe, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
