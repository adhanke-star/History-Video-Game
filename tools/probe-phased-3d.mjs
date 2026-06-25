#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-phased-3d.mjs
// EMPIRICAL CONFIRMATION + REGRESSION GUARD for the multi-phase 3D scene rebuild (D132).
//
// THE BUG (pre-fix, surfaced in D131's bug-hunt): a phased battle's 3D phase-advance
// (_fldBuildPhase / _fldAdvancePhase in T8) swaps in a FRESH unit cast (new ids) + a fresh
// sector terrain + a fresh objective, but never rebuilds the 3D scene -> the new-phase units
// get NO _u3d group (invisible), the prior phase's groups orphan, and the woods / walls /
// objective beacon stay at the OLD sector. The 2D fallback is unaffected (it reads live state).
//
// THIS PROBE drives each of the 4 multi-phase battles (antietam, gettysburg, chickamauga,
// vicksburg) in the live 3D renderer, snapshots phase 0, then advances through every later
// phase exactly as the engine does (phaseIdx++ then _fldAdvancePhase, bypassing the UI card),
// and asserts the CORRECT post-fix invariants:
//   (1) every current unit id has a _u3d group (coverage == 1.0)        <- FAILS pre-fix
//   (2) no ORPHAN groups (every _u3d key is a current unit id)          <- FAILS pre-fix
//   (3) __FIELD.groups.children.length === units.length                 <- FAILS pre-fix
//   (4) the objective beacon is seated on the NEW phase objective       <- FAILS pre-fix
//   (5) the rendered 3D canvas is non-blank after the advance
//   (6) 0 pageerrors / 0 THREE texture warnings across the whole run
// Run pre-fix to CONFIRM the bug (expect FAILs on 1-4), then post-fix to confirm the repair.

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
const THREE_TEXTURE_WARNING = /THREE\.WebGLRenderer:\s*Texture marked for update but image is undefined/;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

// the 4 shipped multi-phase battles; capture a PNG of the first one's last phase for visual proof
const battles = [
  { scenario: 'antietam', side: 'US', seed: 11, shot: true },
  { scenario: 'gettysburg', side: 'US', seed: 7, shot: false },
  { scenario: 'chickamauga', side: 'CS', seed: 13, shot: false },
  { scenario: 'vicksburg', side: 'US', seed: 5, shot: false },
];

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill();
  throw new Error('Could not start static server on :' + cfg.port);
}

function battleScript(b) {
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function sample3d(renderer, cv) {
      try {
        var gl = renderer.getContext(), w = gl.drawingBufferWidth || cv.width, h = gl.drawingBufferHeight || cv.height;
        var sw = Math.max(12, Math.min(40, Math.floor(w * 0.3))), sh = Math.max(12, Math.min(40, Math.floor(h * 0.3)));
        var x = Math.max(0, Math.floor((w - sw) / 2)), y = Math.max(0, Math.floor((h - sh) / 2));
        var pix = new Uint8Array(sw * sh * 4); gl.readPixels(x, y, sw, sh, gl.RGBA, gl.UNSIGNED_BYTE, pix);
        var colored = 0, seen = {}, varied = 0, total = Math.floor(pix.length / 4);
        for (var i = 0; i < pix.length; i += 4) {
          if (pix[i] + pix[i+1] + pix[i+2] > 24) colored++;
          var key = (pix[i] >> 4) + ',' + (pix[i+1] >> 4) + ',' + (pix[i+2] >> 4);
          if (!seen[key]) { seen[key] = 1; varied++; }
        }
        return { ok:true, total:total, colored:colored, buckets:varied };
      } catch(e) { return { ok:false, error:'3d readPixels: ' + e.message }; }
    }
    function snapshot(label) {
      var U = __FIELD.units || [], u3d = __FIELD._u3d || {};
      var unitIds = {}, i, withGroup = 0;
      for (i = 0; i < U.length; i++) unitIds[U[i].id] = 1;
      for (i = 0; i < U.length; i++) if (u3d[U[i].id]) withGroup++;
      var keys = Object.keys(u3d), orphans = 0;
      for (i = 0; i < keys.length; i++) if (!unitIds[keys[i]]) orphans++;
      var beacon = (__FIELD.scene && __FIELD.scene.getObjectByName) ? __FIELD.scene.getObjectByName('objectiveBeacon') : null;
      var o = __FIELD.objective || { x:0, z:0 };
      var beaconDx = beacon ? Math.abs(beacon.position.x - o.x) : 9999;
      var beaconDz = beacon ? Math.abs(beacon.position.z - o.z) : 9999;
      // count distinct woods InstancedMeshes currently in the scene (a fresh sector should bring its own)
      var woods = 0, ch = (__FIELD.scene && __FIELD.scene.children) || [];
      for (i = 0; i < ch.length; i++) { var c = ch[i]; if (c && c.isInstancedMesh) woods++; }
      var st = (__FIELD.renderer) ? sample3d(__FIELD.renderer, document.getElementById('fldGl')) : { ok:false };
      return {
        label: label,
        phaseIdx: __FIELD.phaseIdx,
        sector: (__FIELD.scenData && __FIELD.scenData._phase) ? __FIELD.scenData._phase.name : '',
        objectiveName: o.name,
        objX: Math.round(o.x), objZ: Math.round(o.z),
        units: U.length,
        groupsChildren: (__FIELD.groups && __FIELD.groups.children) ? __FIELD.groups.children.length : -1,
        u3dKeys: keys.length,
        coverage: U.length ? +(withGroup / U.length).toFixed(3) : 0,
        orphans: orphans,
        beaconDx: Math.round(beaconDx), beaconDz: Math.round(beaconDz),
        beaconOnObjective: (beaconDx <= 3 && beaconDz <= 3),
        woodsMeshes: woods,
        pixelColored: st.ok ? st.colored : -1,
        pixelBuckets: st.ok ? st.buckets : -1,
        nonBlank: st.ok ? (st.colored >= Math.max(20, st.total * 0.25) && st.buckets >= 6) : false
      };
    }
    try {
      G.settings = G.settings || {}; G.settings.gfxQuality = 'high';
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;
      fldLaunchSandbox({ renderer:'3d', scenario:${JSON.stringify(b.scenario)}, autoBoth:true, playerSide:${JSON.stringify(b.side)}, seed:${b.seed} });
      for (var w = 0; w < 180 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
      if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not activate; kind=' + __FIELD.rendererKind + ' mode3d=' + __FIELD.mode3d);
      if (!__FIELD.phases) throw new Error('scenario is not multi-phase (no __FIELD.phases)');
      var nPhases = __FIELD.phases.length;
      // settle a frame so phase-0 groups sync
      if (typeof fldRender === 'function') fldRender();
      await wait(220);
      if (typeof fldRender === 'function') fldRender();
      var snaps = [ snapshot('phase0') ];
      // advance through each later phase exactly as _fldPhaseResolved -> _fldAdvancePhase does (UI card bypassed)
      for (var pidx = 1; pidx < nPhases; pidx++) {
        __FIELD.phaseIdx = pidx;
        _fldAdvancePhase();
        if (typeof fldRender === 'function') fldRender();
        await wait(220);
        if (typeof fldRender === 'function') fldRender();
        snaps.push(snapshot('phase' + pidx));
      }
      var lastDataUrl = null;
      if (${JSON.stringify(!!b.shot)}) {
        var cvShot = document.getElementById('fldGl');
        if (cvShot && typeof cvShot.toDataURL === 'function') { try { lastDataUrl = cvShot.toDataURL('image/png'); } catch(e) {} }
      }
      return { ok:true, scenario:${JSON.stringify(b.scenario)}, nPhases:nPhases, snaps:snaps, dataUrl:lastDataUrl };
    } catch(e) {
      return { ok:false, error:String(e && e.message || e), scenario:${JSON.stringify(b.scenario)} };
    }
  })()`;
}

function evaluateBattle(detail) {
  // turn the raw snapshots into pass/fail checks (the CORRECT post-fix invariants)
  const checks = [];
  if (!detail.ok) { checks.push({ name: detail.scenario + ':launch', ok: false, info: detail.error }); return checks; }
  for (const s of detail.snaps) {
    const tag = detail.scenario + ':' + s.label;
    checks.push({ name: tag + ':coverage', ok: s.coverage === 1, info: 'coverage=' + s.coverage + ' units=' + s.units + ' u3dKeys=' + s.u3dKeys });
    checks.push({ name: tag + ':no-orphans', ok: s.orphans === 0, info: 'orphans=' + s.orphans });
    checks.push({ name: tag + ':groups==units', ok: s.groupsChildren === s.units, info: 'groupsChildren=' + s.groupsChildren + ' units=' + s.units });
    checks.push({ name: tag + ':beacon-on-objective', ok: s.beaconOnObjective, info: 'dx=' + s.beaconDx + ' dz=' + s.beaconDz + ' obj=' + s.objX + ',' + s.objZ });
    checks.push({ name: tag + ':nonblank', ok: s.nonBlank, info: 'colored=' + s.pixelColored + ' buckets=' + s.pixelBuckets });
  }
  // the marquee cross-phase check: the objective MOVED between phase0 and the last phase (distinct sectors)
  if (detail.snaps.length >= 2) {
    const a = detail.snaps[0], z = detail.snaps[detail.snaps.length - 1];
    const moved = (a.objX !== z.objX) || (a.objZ !== z.objZ);
    checks.push({ name: detail.scenario + ':sectors-distinct', ok: moved, info: 'p0=' + a.objX + ',' + a.objZ + ' pLast=' + z.objX + ',' + z.objZ });
  }
  return checks;
}

async function launchBrowser() {
  try { return await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
  catch (e) { return await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }
}

async function runBattle(page, b) {
  const pageerrors = []; const consoleLines = [];
  const onErr = e => pageerrors.push(String(e.message));
  const onConsole = m => { if (m.type() === 'error' || m.type() === 'warning') consoleLines.push('[' + m.type() + '] ' + m.text()); };
  page.on('pageerror', onErr); page.on('console', onConsole);
  const url = cfg.baseUrl + '/' + cfg.file;
  let detail = { ok: false, error: 'not run', scenario: b.scenario };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(450);
    detail = await page.evaluate(battleScript(b));
    if (detail && detail.ok && detail.dataUrl) {
      const raw = detail.dataUrl.split(',')[1] || '';
      if (raw.length > 512) { writeFileSync(join(OUT, 'phased-3d-' + b.scenario + '.png'), Buffer.from(raw, 'base64')); detail.shot = 'tools/shots/phased-3d-' + b.scenario + '.png'; }
    }
    if (detail) delete detail.dataUrl;
  } catch (e) {
    detail = { ok: false, error: String(e && e.message || e), scenario: b.scenario };
  } finally {
    try { await page.evaluate(`(() => { try { if (typeof fldExit === 'function') fldExit(true); } catch(e) {} })()`); } catch (e) {}
    const textureWarnings = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
    detail.textureWarnings = textureWarnings;
    detail.pageerrors = pageerrors;
    detail.console = consoleLines.slice(-12);
    try { page.off('pageerror', onErr); page.off('console', onConsole); } catch (e) {}
  }
  const checks = evaluateBattle(detail);
  const ok = checks.every(c => c.ok) && !pageerrors.length && !detail.textureWarnings.length;
  return { scenario: b.scenario, ok, checks, detail };
}

(async () => {
  const server = await ensureServer();
  const results = [];
  const browser = await launchBrowser();
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(30000);
  const page = await ctx.newPage();
  try {
    for (const b of battles) {
      const r = await runBattle(page, b);
      results.push(r);
      writeFileSync(join(OUT, 'probe-phased-3d.json'), JSON.stringify({ ok: false, partial: true, generatedAt: new Date().toISOString(), results }, null, 2));
    }
  } finally {
    if (server) server.kill();
  }
  const totalChecks = results.reduce((a, r) => a + r.checks.length, 0);
  const passChecks = results.reduce((a, r) => a + r.checks.filter(c => c.ok).length, 0);
  const out = { ok: results.every(r => r.ok), checks: passChecks + '/' + totalChecks, generatedAt: new Date().toISOString(), results };
  writeFileSync(join(OUT, 'probe-phased-3d.json'), JSON.stringify(out, null, 2));
  console.log('probe-phased-3d ok=' + out.ok + ' checks=' + out.checks);
  for (const r of results) {
    console.log((r.ok ? '  ok   ' : '  FAIL ') + r.scenario + (r.detail.error ? ' :: ' + r.detail.error : ''));
    for (const c of r.checks) if (!c.ok) console.log('         x ' + c.name + ' :: ' + c.info);
  }
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  process.exit(out.ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
