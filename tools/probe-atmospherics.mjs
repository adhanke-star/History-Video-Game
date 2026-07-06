#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-atmospherics.mjs
// Focused probe for T16 battlefield atmospherics (Phase H · H3-i1). Verifies:
//  - the module + the three by-assignment wrappers are installed;
//  - gunsmoke SPAWNS during a fought battle (2D + 3D), bounded by the particle cap;
//  - reduceMotion AND the atmospherics="off" opt-out both suppress it (0 particles);
//  - the 3D path builds the named "atmoSmoke" Points cloud with NO Three.js texture warning;
//  - the sim RNG (__FIELD.seed) is UNCHANGED across pure render frames (atmo uses its own
//    LCG, never fldRng) — the runtime combat-byte-identity lock;
//  - a static source scan proves NO combat-execution file references the atmo layer.
// (The 9-baseline seed-for-seed byte-identity gate stays owned by probe-presets.)

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const THREE_TEXTURE_WARNING = /THREE\.WebGLRenderer:\s*Texture marked for update but image is undefined/;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

/* ---------- 1) STATIC SCAN: no combat-execution file may reference the atmo layer ---------- */
function staticScan() {
  const tacDir = join(ROOT, 'src', 'tactical');
  const files = readdirSync(tacDir).filter(f => /\.js$/.test(f) && f !== 'T16-atmospherics.js');
  const combatExtra = ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js'].map(f => join(ROOT, 'src', f));
  const all = files.map(f => join(tacDir, f)).concat(combatExtra);
  const leaks = [];
  for (const f of all) {
    let txt = ''; try { txt = readFileSync(f, 'utf8'); } catch (e) { continue; }
    if (/fldAtmo|FLDAT/.test(txt)) leaks.push(f.replace(ROOT + '/', ''));
  }
  check('static-scan: no combat/tactical file references the atmo layer', leaks.length === 0, leaks.join(', '));
  // and T16 itself must NOT call fldRng (would perturb sim determinism). Match a CALL
  // (`fldRng(` with no space) so the prose mentions in the header comment don't false-positive.
  let t16 = ''; try { t16 = readFileSync(join(tacDir, 'T16-atmospherics.js'), 'utf8'); } catch (e) {}
  check('static-scan: T16 never calls fldRng (uses its own LCG)', t16.length > 0 && !/fldRng\(/.test(t16));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

function sceneScript(renderer, scenario, seed, mode) {
  // mode: 'normal' | 'reduceMotion' | 'off'
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    try {
      G.settings = G.settings || {};
      G.settings.gfxQuality = 'high';
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;
      G.settings.reduceMotion = ${mode === 'reduceMotion' ? 'true' : 'false'};
      if (${JSON.stringify(mode)} === 'off') G.settings.atmospherics = 'off'; else { try { delete G.settings.atmospherics; } catch(e){} }
      var wrappers = {
        d2: typeof fld2dDraw === 'function' && !!fld2dDraw._atmo,
        d3: typeof fld3dRender === 'function' && !!fld3dRender._atmo,
        ex: typeof fldExit === 'function' && !!fldExit._atmo,
        fns: ['fldAtmoStep','fldAtmoDraw2d','fldAtmoPre3d','fldAtmoDispose','fldAtmoState'].every(function(n){ return typeof window[n] === 'function' || eval('typeof '+n) === 'function'; })
      };
      fldLaunchSandbox({ renderer:${JSON.stringify(renderer)}, scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      if (${JSON.stringify(renderer)} === '3d') {
        for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
        if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      }
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      var _fog = (${JSON.stringify(mode)} === 'fog');
      if (_fog) { __FIELD.fog = true; }   // force the fog-of-war on so the hidden-enemy gate is exercised
      fldStepN(_fog ? 200 : 360, 0.05);
      __FIELD.paused = false;
      // RNG-ISOLATION (combat-byte-identity lock): drive atmo's SPAWN path SYNCHRONOUSLY —
      // no await, so the live RAF sim loop cannot interleave (single-threaded JS) — and assert
      // the sim seed is untouched. atmo calls its own LCG hundreds of times here; if any call
      // had reached fldRng, __FIELD.seed would move.
      var A = (typeof fldAtmoState === 'function') ? fldAtmoState() : null;
      var seedBefore = __FIELD.seed;
      if (A) { for (var s2 = 0; s2 < 240; s2++) fldAtmoStep(A, 0.05); }
      var seedAfter = __FIELD.seed;
      // FOG-LEAK GATE coverage: with fog on, smoke must NOT spawn for an enemy the player cannot see.
      // Find ISOLATED hidden enemies (far from every visible/own unit, so no nearby smoke source could
      // drift onto them) and assert zero particles within R of any of them — while confirming smoke DID
      // spawn somewhere (a control, so the assertion isn't vacuously passing on an empty field).
      var fogA = null;
      if (_fog && A) {
        var ps2 = (typeof fldPlayerSide === 'function') ? fldPlayerSide() : 'US';
        // collect the enemies the player CANNOT see (LOS-hidden under fog)
        var hidden = [];
        for (var hi = 0; hi < __FIELD.units.length; hi++) {
          var hu = __FIELD.units[hi]; if (!hu.alive) continue;
          if (hu.side !== ps2 && typeof fldVisible === 'function' && !fldVisible(ps2, hu)) hidden.push(hu);
        }
        // Sim-arc geometry-drift repair (D279 batch checkpoint): after the D273/D275 Shiloh attacker arc the
        // 200-step sampled moment can legitimately contain NO naturally-hidden enemy (hidden=0 red, both teeth
        // starved). The gate test below is already geometry-INDEPENDENT by design (it silences every unit and
        // force-fires only hidden ones on this throwaway page), so manufacture the hidden subject honestly:
        // relocate the farthest living enemy to the field corner farthest from every player unit and recompute
        // the vis map. The assertions are UNTOUCHED — if fldVisible still sees a corner-isolated enemy, the fog
        // LOS itself is broken and the meaningful-scene tooth reds exactly as before.
        if (!hidden.length) {
          var own = [], foes = [];
          for (var qi = 0; qi < __FIELD.units.length; qi++) { var qu = __FIELD.units[qi]; if (!qu.alive) continue; (qu.side === ps2 ? own : foes).push(qu); }
          if (own.length && foes.length && typeof fldComputeVisibility === 'function') {
            var corners = [[30,30],[FLD.FIELD_W-30,30],[30,FLD.FIELD_H-30],[FLD.FIELD_W-30,FLD.FIELD_H-30]];
            var bestC = corners[0], bestD = -1;
            for (var ci = 0; ci < corners.length; ci++) { var dmin = 1e9;
              for (var oi = 0; oi < own.length; oi++) { var dx = corners[ci][0]-own[oi].x, dz = corners[ci][1]-own[oi].z; var dd = dx*dx+dz*dz; if (dd < dmin) dmin = dd; }
              if (dmin > bestD) { bestD = dmin; bestC = corners[ci]; } }
            var far = foes[0], fd = -1;
            for (var fi = 0; fi < foes.length; fi++) { var dmin2 = 1e9;
              for (var oj = 0; oj < own.length; oj++) { var dx2 = foes[fi].x-own[oj].x, dz2 = foes[fi].z-own[oj].z; var dd2 = dx2*dx2+dz2*dz2; if (dd2 < dmin2) dmin2 = dd2; }
              if (dmin2 > fd) { fd = dmin2; far = foes[fi]; } }
            far.x = bestC[0]; far.z = bestC[1];
            fldComputeVisibility();
            for (var h2 = 0; h2 < __FIELD.units.length; h2++) { var hv = __FIELD.units[h2]; if (!hv.alive) continue;
              if (hv.side !== ps2 && !fldVisible(ps2, hv)) hidden.push(hv); }
          }
        }
        // CONTROLLED GATE TEST (geometry-independent): silence EVERY unit, then force ONLY the hidden
        // enemies to "fire". Under fog the gate must yield ZERO smoke; lifting fog (the very same units,
        // now visible) must yield smoke — so the assertion is not vacuous and a gate regression (a dropped
        // or inverted !fldVisible term) is caught. Mutating units here is safe: this is the throwaway probe
        // page, not the headless byte-identity run (probe-presets owns that).
        for (var si = 0; si < __FIELD.units.length; si++) { var su = __FIELD.units[si]; su.targetId = null; su._artFlash = 0; su.underFire = 0; }
        for (var fh = 0; fh < hidden.length; fh++) { var hh = hidden[fh]; hh.targetId = 'probe'; hh.ammo = 100; hh._artFlash = 0; hh.underFire = 0; if (hh.state === 'routing') hh.state = 'steady'; }
        A.parts.length = 0; __FIELD.fog = true;
        for (var s = 0; s < 12; s++) fldAtmoStep(A, 0.05);
        var partsHiddenFog = A.parts.length;
        A.parts.length = 0; __FIELD.fog = false;   // control: the same units are now visible
        for (var s3 = 0; s3 < 12; s3++) fldAtmoStep(A, 0.05);
        var partsHiddenNoFog = A.parts.length;
        fogA = { hiddenCount: hidden.length, partsHiddenFog: partsHiddenFog, partsHiddenNoFog: partsHiddenNoFog };
      }
      // then exercise the REAL wrapper draw path (builds the 3D cloud, paints the 2D canvas) for the PNG
      for (var f = 0; f < 4; f++) { fldRender(); await wait(70); }
      A = __FIELD._atmo || A;
      var parts = A && A.parts ? A.parts.length : -1;
      // uMaxPoint clamp coverage (3D): the shader uniform is wired from the driver's point-size cap
      var maxPtUniform = -1, glCap = -1;
      try { if (A && A.mat && A.mat.uniforms && A.mat.uniforms.uMaxPoint) maxPtUniform = A.mat.uniforms.uMaxPoint.value; } catch (e) {}
      try { var glx = __FIELD.renderer.getContext(); var rr = glx.getParameter(glx.ALIASED_POINT_SIZE_RANGE); glCap = rr && rr[1]; } catch (e) {}
      var cap = 200;
      var points3d = null, ptsCount = -1, ptsDrawCount = -1, ptsVisible = null;
      if (__FIELD.mode3d && __FIELD.scene && __FIELD.scene.getObjectByName) {
        var pts = __FIELD.scene.getObjectByName('atmoSmoke');
        points3d = !!pts;
        if (pts && pts.geometry && pts.geometry.attributes && pts.geometry.attributes.aAlpha) ptsCount = pts.geometry.attributes.aAlpha.count;
        if (pts && pts.geometry && pts.geometry.drawRange) ptsDrawCount = pts.geometry.drawRange.count;
        if (pts) ptsVisible = pts.visible !== false;
      }
      var cv = document.getElementById('fldGl');
      var dataUrl = (cv && typeof cv.toDataURL === 'function') ? cv.toDataURL('image/png') : '';
      return { ok:true, renderer:${JSON.stringify(renderer)}, mode:${JSON.stringify(mode)},
        wrappers:wrappers, parts:parts, cap:cap, seedBefore:seedBefore, seedAfter:seedAfter,
        seedStable:(seedBefore === seedAfter), mode3d:!!__FIELD.mode3d, points3d:points3d, ptsCount:ptsCount,
        ptsDrawCount:ptsDrawCount, ptsVisible:ptsVisible, fogA:fogA, maxPtUniform:maxPtUniform, glCap:glCap,
        phase:__FIELD.phase, units:__FIELD.units.length, dataUrl:dataUrl };
    } catch(e) {
      return { ok:false, error:String(e && e.message || e), renderer:${JSON.stringify(renderer)}, mode:${JSON.stringify(mode)} };
    }
  })()`;
}

async function runScene(page, label, renderer, scenario, seed, mode) {
  const pageerrors = [], consoleLines = [];
  const onErr = e => pageerrors.push(String(e.message));
  const onConsole = m => { if (m.type() === 'error' || m.type() === 'warning') consoleLines.push('[' + m.type() + '] ' + m.text()); };
  page.on('pageerror', onErr); page.on('console', onConsole);
  let d = { ok: false, error: 'not run' };
  try {
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(450);
    d = await page.evaluate(sceneScript(renderer, scenario, seed, mode));
    if (d && d.ok && d.dataUrl && d.dataUrl.indexOf('data:image/png;base64,') === 0) {
      writeFileSync(join(OUT, 'atmo-' + label + '.png'), Buffer.from(d.dataUrl.split(',')[1] || '', 'base64'));
      d.shot = 'tools/shots/atmo-' + label + '.png';
    }
    if (d) delete d.dataUrl;
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  finally {
    try { await page.evaluate(`(() => { try { if (typeof fldExit === 'function') fldExit(true); } catch(e){} })()`); } catch (e) {}
    try { page.off('pageerror', onErr); page.off('console', onConsole); } catch (e) {}
  }
  const texWarn = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
  return { label, detail: d, pageerrors, texWarn, console: consoleLines.slice(-10) };
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(25000);
  const page = await ctx.newPage();
  const scenes = [];
  try {
    scenes.push(await runScene(page, 'shiloh-2d-normal', '2d', 'shiloh', 21, 'normal'));
    scenes.push(await runScene(page, 'shiloh-2d-reducemotion', '2d', 'shiloh', 21, 'reduceMotion'));
    scenes.push(await runScene(page, 'shiloh-2d-off', '2d', 'shiloh', 21, 'off'));
    scenes.push(await runScene(page, 'shiloh-2d-fog', '2d', 'shiloh', 21, 'fog'));
    scenes.push(await runScene(page, 'shiloh-3d-normal', '3d', 'shiloh', 21, 'normal'));
    scenes.push(await runScene(page, 'gettysburg-3d-normal', '3d', 'gettysburg', 7, 'normal'));
  } finally { if (server) server.kill(); }

  const byLabel = {};
  for (const s of scenes) byLabel[s.label] = s;
  const allPe = scenes.reduce((a, s) => a + s.pageerrors.length, 0);
  const allTex = scenes.reduce((a, s) => a + s.texWarn.length, 0);

  // wrappers + module present (from the first normal scene)
  const n2 = byLabel['shiloh-2d-normal'].detail;
  check('module + 3 by-assignment wrappers installed', n2.ok && n2.wrappers && n2.wrappers.d2 && n2.wrappers.d3 && n2.wrappers.ex && n2.wrappers.fns, JSON.stringify(n2.wrappers || {}));
  // 2D spawns, bounded by cap
  check('2D: gunsmoke spawns during the fight', n2.ok && n2.parts > 0, 'parts=' + (n2.parts));
  check('2D: particle count within the cap', n2.ok && n2.parts <= n2.cap, 'parts=' + n2.parts + ' cap=' + n2.cap);
  check('2D: sim seed UNCHANGED across pure renders (atmo never calls fldRng)', n2.ok && n2.seedStable, n2.seedBefore + ' -> ' + n2.seedAfter);
  // reduceMotion suppresses
  const rm = byLabel['shiloh-2d-reducemotion'].detail;
  check('reduceMotion: atmospherics fully suppressed (0 particles)', rm.ok && rm.parts === 0, 'parts=' + rm.parts);
  // off opt-out suppresses
  const off = byLabel['shiloh-2d-off'].detail;
  check('atmospherics="off": fully suppressed (0 particles)', off.ok && off.parts === 0, 'parts=' + off.parts);
  // FOG-OF-WAR: no smoke betrays a hidden enemy (D127 gate — exercised here, not just claimed in prose)
  const fog = byLabel['shiloh-2d-fog'].detail, fa = fog && fog.fogA;
  check('fog: scene meaningful (≥1 hidden enemy; the same units DO emit when fog is lifted — control)',
    fog && fog.ok && fa && fa.hiddenCount > 0 && fa.partsHiddenNoFog > 0,
    fa ? ('hidden=' + fa.hiddenCount + ' noFogParts=' + fa.partsHiddenNoFog) : 'no fogA');
  check('fog: ZERO gunsmoke from a hidden enemy (gate blocks it — no position betrayal)',
    fog && fog.ok && fa && fa.partsHiddenFog === 0, fa ? ('hiddenFogParts=' + fa.partsHiddenFog) : 'no fogA');
  // 3D builds + spawns
  const t3 = byLabel['shiloh-3d-normal'].detail;
  check('3D: live renderer active', t3.ok && t3.mode3d, 'mode3d=' + (t3 && t3.mode3d));
  check('3D: named "atmoSmoke" Points cloud built', t3.ok && t3.points3d === true, 'points3d=' + (t3 && t3.points3d) + ' count=' + (t3 && t3.ptsCount));
  check('3D: gunsmoke spawns during the fight', t3.ok && t3.parts > 0, 'parts=' + (t3 && t3.parts));
  check('3D: atmoSmoke draw range tracks active particles instead of the full buffer',
    t3.ok && t3.points3d === true && t3.ptsVisible === true && t3.ptsDrawCount > 0 && t3.ptsDrawCount === Math.min(t3.parts, t3.ptsCount),
    'draw=' + (t3 && t3.ptsDrawCount) + ' parts=' + (t3 && t3.parts) + ' buffer=' + (t3 && t3.ptsCount) + ' visible=' + (t3 && t3.ptsVisible));
  check('3D: sim seed UNCHANGED across pure renders', t3.ok && t3.seedStable, (t3 && t3.seedBefore) + ' -> ' + (t3 && t3.seedAfter));
  check('3D: gl_PointSize clamp wired (uMaxPoint uniform = driver ALIASED_POINT_SIZE_RANGE max)',
    t3.ok && t3.maxPtUniform > 0 && t3.glCap > 0 && t3.maxPtUniform === t3.glCap,
    'uMaxPoint=' + (t3 && t3.maxPtUniform) + ' glCap=' + (t3 && t3.glCap));
  const g3 = byLabel['gettysburg-3d-normal'].detail;
  check('3D (Gettysburg): atmoSmoke built + spawns', g3.ok && g3.points3d === true && g3.parts > 0, 'points=' + (g3 && g3.points3d) + ' parts=' + (g3 && g3.parts));
  check('3D (Gettysburg): atmoSmoke draw range stays active-particle bounded',
    g3.ok && g3.points3d === true && g3.ptsDrawCount > 0 && g3.ptsDrawCount === Math.min(g3.parts, g3.ptsCount),
    'draw=' + (g3 && g3.ptsDrawCount) + ' parts=' + (g3 && g3.parts) + ' buffer=' + (g3 && g3.ptsCount));
  // no warnings / no errors
  check('no Three.js texture warning across all scenes', allTex === 0, 'texWarnings=' + allTex);
  check('zero pageerrors across all scenes', allPe === 0, 'pageerrors=' + allPe);

  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), passed: steps.filter(s => s.ok).length, total: steps.length, steps, scenes };
  writeFileSync(join(OUT, 'probe-atmospherics.json'), JSON.stringify(out, null, 2));
  console.log('probe-atmospherics ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
