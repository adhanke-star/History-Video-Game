#!/usr/bin/env node
// tools/probe-engineering-corps.mjs - Phase F: the Tactical Engineering Corps.
// INCREMENT 1 verifies FIELD ENTRENCHMENTS (T13): the dig-in order, the earned-cover
// rise, the B-5 realism coupling, the fire/melee cover effect, abandon-on-march, the
// HUD, the render seams, and (critically) byte-identity of every AI-vs-AI baseline.
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
      ['fldEngCover', 'fldEngStep', 'fldSelEntrench', 'fldEngRealism', 'fldEngHudSelected', 'fldEngDraw2d', 'fld3dBuildEng', 'fld3dSyncEng'].forEach(function(fn) {
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
      return { units: __FIELD.units.length, entrenched: anyEnt, nonIdentityCover: anyCover };
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
      return { drawCalls: calls, hudHasPct: hud.indexOf('%') >= 0 };
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

  } catch (e) { R.ok = false; R.steps.push({ name: 'FATAL', ok: false, err: String(e && e.message || e) }); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null, browser = null;
  if (!(await up(probe))) {
    srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 60; i++) { if (await up(probe)) break; await sleep(150); }
  }
  const pageerrors = [];
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
  catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch (e) {} });
  page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok: false };
  try {
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
    if (srv) srv.kill();
  }
  if (!result.ok || result.fatal || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
