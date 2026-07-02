#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-visual-fidelity.mjs
// Focused probe for T21 modern-engine VISUAL FIDELITY (Phase H · H5-i2). Verifies, in the live 3D engine:
//  - the module + its seven by-assignment wrappers (fld3dInit/fld3dBuildTerrain/fld3dBuildUnits/fld3dSyncUnit/
//    fld3dRender/fld2dDraw/fldExit) are installed AND every prior marker (._wx/._atmo/._rr) is carried forward;
//  - GROUND RELIEF: colA._vfAO latch set; high ground reads BRIGHTER than low ground (relief), with vertex
//    POSITIONS untouched (sampled Y == analytic fldTerrainH -> units never float/sink);
//  - SKY DOME: a BackSide "vfSky" mesh with renderOrder -1 exists, scene.background is nulled, and the dome's
//    material colour matches the live fog (weather) colour so dome + ground-fog stay seamless;
//  - VIGNETTE: a pointer-events:none #fldVignette div is injected (above the canvas, below the HUD);
//  - PER-BRIGADE DECOR: one shared "vfShadowLayer" InstancedMesh glues a soft contact shadow under every
//    brigade + each slab gets a rank MAP; when T24 formation figures replace the slab, high tier does not keep
//    hidden resident "vfPegs"; when formation figures are explicitly off, the capable-tier peg fallback returns;
//    on fldLow() the pegs are GATED OUT;
//  - BYTE-IDENTITY: the sim seed + mutable sim fields are INVARIANT across a synchronous render burst (T21 never
//    calls fldRng), FLDVF_S.errN === 0, and a static scan proves no combat/tactical file references the vf layer;
//  - the OFF switch (renderRich="off") reverts to the byte-identical default: no dome, no vignette, no shadow/
//    pegs/rank-map, colA._vfAO unset;
//  - zero pageerrors + zero Three.js texture warnings; a screenshot is captured for visual confirmation.
// (The 26-outcome + 20-AB seed-for-seed byte-identity gate stays owned by probe-presets / probe-phased-ab.)

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

/* ---------- STATIC SCAN: combat purity ---------- */
function staticScan() {
  const tacDir = join(ROOT, 'src', 'tactical');
  const files = readdirSync(tacDir).filter(f => /\.js$/.test(f) && f !== 'T21-visual-fidelity.js');
  const combatExtra = ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js'].map(f => join(ROOT, 'src', f));
  const all = files.map(f => join(tacDir, f)).concat(combatExtra);
  const leaks = [];
  for (const f of all) {
    let txt = ''; try { txt = readFileSync(f, 'utf8'); } catch (e) { continue; }
    if (/fldVf|FLDVF/.test(txt)) leaks.push(f.replace(ROOT + '/', ''));
  }
  check('static-scan: no combat/tactical file references the visual-fidelity layer', leaks.length === 0, leaks.join(', '));
  let t21 = ''; try { t21 = readFileSync(join(tacDir, 'T21-visual-fidelity.js'), 'utf8'); } catch (e) {}
  check('static-scan: T21 never calls fldRng + never writes _SAVE_VER', t21.length > 0 && !/fldRng\(/.test(t21) && !/_SAVE_VER\s*=/.test(t21));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

// opts: { off, low, noFigures }
function sceneScript(scenario, seed, opts) {
  opts = opts || {};
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    var out = { ok:false };
    try {
      try { if (typeof fldExit === 'function' && typeof __FIELD !== 'undefined' && __FIELD && __FIELD.launched) fldExit(true); } catch(e){}
      await wait(120);
      G.settings = G.settings || {};
      G.settings.gfxQuality = ${JSON.stringify(opts.low ? 'low' : 'high')};
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;
      G.settings.reduceMotion = false;
      if (${JSON.stringify(!!opts.off)}) G.settings.renderRich = 'off'; else { try { delete G.settings.renderRich; } catch(e){} }
      if (${JSON.stringify(!!opts.noFigures)}) G.settings.formationFigures = 'off'; else { try { delete G.settings.formationFigures; } catch(e){} }

      out.wrappers = {
        init: typeof fld3dInit === 'function' && !!fld3dInit._vf,
        bt: typeof fld3dBuildTerrain === 'function' && !!fld3dBuildTerrain._vf,
        bu: typeof fld3dBuildUnits === 'function' && !!fld3dBuildUnits._vf,
        su: typeof fld3dSyncUnit === 'function' && !!fld3dSyncUnit._vf,
        r3: typeof fld3dRender === 'function' && !!fld3dRender._vf,
        d2: typeof fld2dDraw === 'function' && !!fld2dDraw._vf,
        ex: typeof fldExit === 'function' && !!fldExit._vf,
        // prior markers must survive T21's outer re-wrap
        chain: !!(fld3dRender._wx && fld3dRender._atmo && fld3dRender._rr && fld2dDraw._rr && fldExit._rr),
        fns: ['fldVfOff','fldVfEnrichGroundAO','fldVfDecorateUnits','fldVfSyncUnit','fldVfEnsureShadowLayer','fldVfSetShadow','fldVfBuildSky','fldVfDispose','fldVfShouldBuildPegs'].every(function(n){ return eval('typeof '+n) === 'function'; })
      };

      fldLaunchSandbox({ renderer:'3d', scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
      if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      // select a unit so the decoration paths exercise the selected branch too
      try { if (__FIELD.units && __FIELD.units.length) { var fu = __FIELD.units.find(function(u){return u.alive;}); if (fu) __FIELD.sel = [fu.id]; } } catch(e){}
      for (var f = 0; f < 5; f++) { fldRender(); await wait(70); }

      var T = window.THREE;

      /* ---- SKY DOME ---- */
      var sky = null; __FIELD.scene.traverse(function(o){ if (o && o.name === 'vfSky') sky = o; });
      out.sky = { found: !!sky };
      if (sky) {
        out.sky.renderOrder = sky.renderOrder;
        out.sky.backside = (sky.material && sky.material.side === T.BackSide);
        out.sky.matchesFog = !!(sky.material && __FIELD.scene.fog && sky.material.color.getHexString() === __FIELD.scene.fog.color.getHexString());
        // the flat background is RETAINED (a sky-coloured fallback that fills the far-plane clip ring behind the
        // dome). T17 authors bg a touch distinct from fog by design, so we assert RETENTION, not a fog hex match
        // (the dome<->ground-fog seam at the field horizon is the one that matters, asserted by matchesFog above).
        out.sky.bgKept = !!(__FIELD.scene.background && __FIELD.scene.background.isColor);
      }

      /* ---- VIGNETTE ---- */
      var vg = document.getElementById('fldVignette');
      out.vig = { found: !!vg, pe: vg ? (vg.style.pointerEvents || (window.getComputedStyle ? getComputedStyle(vg).pointerEvents : '')) : null };

      /* ---- GROUND RELIEF + position integrity ---- */
      var geo = __FIELD.ground.geometry, posA = geo.attributes.position, colA = geo.attributes.color;
      out.ao = { latch: !!colA._vfAO, vcount: posA.count };
      var W = FLD.FIELD_W, H = FLD.FIELD_H;
      var loi = 0, hii = 0, loy = Infinity, hiy = -Infinity;
      for (var i = 0; i < posA.count; i++) { var y = posA.getY(i); if (y < loy) { loy = y; loi = i; } if (y > hiy) { hiy = y; hii = i; } }
      function lum(idx) { return 0.299 * colA.getX(idx) + 0.587 * colA.getY(idx) + 0.114 * colA.getZ(idx); }
      out.ao.loLum = lum(loi); out.ao.hiLum = lum(hii); out.ao.reliefReads = (lum(hii) > lum(loi));
      var posOk = true;
      for (var sv = 0; sv < posA.count; sv += Math.max(1, Math.floor(posA.count / 9))) {
        var wx = posA.getX(sv) + W / 2, wz = posA.getZ(sv) + H / 2;
        if (Math.abs(fldTerrainH(wx, wz) - posA.getY(sv)) > 0.01) { posOk = false; break; }
      }
      out.ao.posOk = posOk;

      /* ---- PER-BRIGADE DECOR ---- */
      var ug = null, uu = null;
      for (var k = 0; k < __FIELD.units.length; k++) { var u0 = __FIELD.units[k], g0 = __FIELD._u3d[u0.id]; if (g0 && u0.alive) { ug = g0; uu = u0; break; } }
      out.unit = { found: !!ug };
      if (ug && uu) {
        var sh = ug.getObjectByName('vfShadow'), shLayer = null, pegs = ug.getObjectByName('vfPegs'), slab = ug.getObjectByName('slab');
        try { __FIELD.scene.traverse(function(o){ if (o && o.name === 'vfShadowLayer') shLayer = o; }); } catch(e){}
        var shIndex = ug.userData && ug.userData._vf ? ug.userData._vf.shIndex : -1;
        var shGroundGap = null, shScaleX = null, shScaleY = null;
        if (shLayer && shIndex >= 0 && shIndex < shLayer.count) {
          var mx = new T.Matrix4(), pos = new T.Vector3(), quat = new T.Quaternion(), scl = new T.Vector3();
          shLayer.getMatrixAt(shIndex, mx); mx.decompose(pos, quat, scl);
          shGroundGap = Math.abs(pos.y - fldTerrainH(uu.x, uu.z));
          shScaleX = scl.x; shScaleY = scl.y;
        }
        out.unit.shadow = !!(sh || shLayer);
        out.unit.shadowInstanced = !!(shLayer && shLayer.isInstancedMesh);
        out.unit.shadowIndex = shIndex;
        out.unit.shadowCount = shLayer ? shLayer.count : 0;
        out.unit.shadowFlat = sh ? (Math.abs(Math.abs(sh.rotation.x) - Math.PI / 2) < 0.01) : null;
        out.unit.shadowGroundGap = sh ? Math.abs((ug.position.y + sh.position.y) - fldTerrainH(uu.x, uu.z)) : shGroundGap;
        out.unit.shadowScaleX = shScaleX; out.unit.shadowScaleY = shScaleY;
        out.unit.pegs = !!pegs; out.unit.pegCount = pegs ? pegs.count : 0;
        out.unit.pegsVisible = !!(pegs && pegs.visible !== false);
        out.unit.pegSphere = !!(pegs && pegs.geometry && pegs.geometry.boundingSphere);
        out.unit.rankMap = !!(slab && slab.material && slab.material.map);
      }

      /* ---- BYTE-IDENTITY: synchronous render burst (no sim step, no fldRng) ---- */
      __FIELD.paused = true;
      var su0 = (__FIELD.units && __FIELD.units[0]) ? __FIELD.units[0] : null;
      var snap0 = su0 ? [su0.x, su0.z, su0.men, su0.morale, su0.facing].join(',') : '';
      out.seedBefore = (__FIELD.seed >>> 0);
      for (var b = 0; b < 6; b++) fld3dRender();
      out.seedAfter = (__FIELD.seed >>> 0);
      out.seedStable = (out.seedBefore === out.seedAfter);
      var snap1 = su0 ? [su0.x, su0.z, su0.men, su0.morale, su0.facing].join(',') : '';
      out.simStable = (snap0 === snap1);
      out.errN = (typeof FLDVF_S !== 'undefined' && FLDVF_S) ? FLDVF_S.errN : -1;

      out.ok = true;
    } catch (e) { out.ok = false; out.error = String(e && e.message || e); }
    return out;
  })();`;
}

async function runScene(page, label, scenario, seed, opts, shared) {
  const peStart = shared.pe.length, conStart = shared.con.length;
  let d = { ok: false, error: 'not run' };
  try {
    d = await page.evaluate(sceneScript(scenario, seed, opts));
    try { await page.screenshot({ path: join(OUT, 'vf-' + label + '.png') }); d.shot = 'tools/shots/vf-' + label + '.png'; } catch (e) {}
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  const pageerrors = shared.pe.slice(peStart), consoleLines = shared.con.slice(conStart);
  const texWarn = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
  return { label, detail: d, pageerrors, texWarn, console: consoleLines.slice(-10) };
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(45000);
  const page = await ctx.newPage();
  const shared = { pe: [], con: [] };
  page.on('pageerror', e => shared.pe.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') shared.con.push('[' + m.type() + '] ' + m.text()); });
  const scenes = [];
  try {
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    scenes.push(await runScene(page, '3d', 'shiloh', 21, {}, shared));
    scenes.push(await runScene(page, 'pegs-fallback', 'shiloh', 21, { noFigures: true }, shared));
    scenes.push(await runScene(page, 'off', 'shiloh', 21, { off: true }, shared));
    scenes.push(await runScene(page, 'low', 'shiloh', 21, { low: true }, shared));
  } finally { if (server) server.kill(); }

  const byLabel = {}; for (const s of scenes) byLabel[s.label] = s;
  const allPe = scenes.reduce((a, s) => a + s.pageerrors.length, 0);
  const allTex = scenes.reduce((a, s) => a + s.texWarn.length, 0);
  const R = byLabel['3d'].detail, PEG = byLabel['pegs-fallback'].detail, OFF = byLabel['off'].detail, LOW = byLabel['low'].detail;

  // wrappers + chain
  check('module + 7 by-assignment wrappers installed (prior ._wx/._atmo/._rr markers carried forward)',
    R.ok && R.wrappers && R.wrappers.init && R.wrappers.bt && R.wrappers.bu && R.wrappers.su && R.wrappers.r3 && R.wrappers.d2 && R.wrappers.ex && R.wrappers.chain && R.wrappers.fns,
    JSON.stringify(R.wrappers || {}));

  // sky dome
  check('sky dome: a BackSide "vfSky" mesh exists with renderOrder -1', R.ok && R.sky.found && R.sky.backside && R.sky.renderOrder === -1, JSON.stringify(R.sky || {}));
  check('sky dome: horizon colour matches the live weather fog colour (seamless ground-fog -> sky)', R.ok && R.sky.matchesFog === true, 'matchesFog=' + (R.sky && R.sky.matchesFog));
  check('sky dome: scene.background RETAINED as a sky-coloured fallback (fills the far-plane clip ring; not nulled)', R.ok && R.sky.bgKept === true, 'bgKept=' + (R.sky && R.sky.bgKept));

  // vignette
  check('vignette: #fldVignette div injected with pointer-events:none (HUD stays clickable/legible)', R.ok && R.vig.found && R.vig.pe === 'none', JSON.stringify(R.vig || {}));

  // ground relief
  check('ground relief: colA._vfAO latch set (AO ran once, idempotent)', R.ok && R.ao.latch === true, 'latch=' + (R.ao && R.ao.latch));
  check('ground relief: high ground reads BRIGHTER than low ground (high/low reads at a glance)', R.ok && R.ao.reliefReads === true, 'hiLum=' + (R.ao && R.ao.hiLum && R.ao.hiLum.toFixed(3)) + ' loLum=' + (R.ao && R.ao.loLum && R.ao.loLum.toFixed(3)));
  check('ground relief: vertex POSITIONS untouched (sampled Y == analytic fldTerrainH -> units never float/sink)', R.ok && R.ao.posOk === true, 'posOk=' + (R.ao && R.ao.posOk));

  // per-brigade decor
  check('decor: a unit group was found', R.ok && R.unit.found, 'found=' + (R.unit && R.unit.found));
  check('decor: one shared "vfShadowLayer" InstancedMesh grounds each brigade (gap ~0.5yd, positive width/depth)',
    R.ok && R.unit.shadow && R.unit.shadowInstanced === true && R.unit.shadowIndex >= 0 && R.unit.shadowGroundGap !== null && R.unit.shadowGroundGap < 2 && R.unit.shadowScaleX > 8 && R.unit.shadowScaleY > 8,
    JSON.stringify({ instanced:R.unit && R.unit.shadowInstanced, index:R.unit && R.unit.shadowIndex, count:R.unit && R.unit.shadowCount, gap:R.unit && R.unit.shadowGroundGap, sx:R.unit && R.unit.shadowScaleX, sy:R.unit && R.unit.shadowScaleY }));
  check('decor: the slab carries a stylized rank MAP (massed-infantry read)', R.ok && R.unit.rankMap === true, 'rankMap=' + (R.unit && R.unit.rankMap));
  check('decor (Max tier, default high): T24 formation figures replace the slab without hidden resident vfPegs',
    R.ok && R.unit.pegs === false,
    'pegs=' + (R.unit && R.unit.pegs) + ' visible=' + (R.unit && R.unit.pegsVisible));
  check('decor (Max tier fallback): formationFigures="off" restores a visible "vfPegs" InstancedMesh with count>0 + bounding sphere',
    PEG.ok && PEG.unit && PEG.unit.pegs === true && PEG.unit.pegsVisible === true && PEG.unit.pegCount > 0 && PEG.unit.pegSphere === true,
    'pegs=' + (PEG.unit && PEG.unit.pegs) + ' visible=' + (PEG.unit && PEG.unit.pegsVisible) + ' count=' + (PEG.unit && PEG.unit.pegCount) + ' sphere=' + (PEG.unit && PEG.unit.pegSphere));

  // peg tier gate
  check('peg tier gate: on fldLow() the peg ranks are GATED OUT (rank map + instanced shadow still present)',
    LOW.ok && LOW.unit.found && LOW.unit.pegs === false && LOW.unit.shadowInstanced === true && LOW.unit.rankMap === true,
    'lowPegs=' + (LOW.unit && LOW.unit.pegs) + ' lowShadowInstanced=' + (LOW.unit && LOW.unit.shadowInstanced));

  // byte-identity
  check('byte-identity: sim seed UNCHANGED across a synchronous render burst (T21 never calls fldRng)', R.ok && R.seedStable === true, R.seedBefore + ' -> ' + R.seedAfter);
  check('byte-identity: a unit’s mutable sim fields (x/z/men/morale/facing) INVARIANT across the burst', R.ok && R.simStable === true, 'simStable=' + (R.ok && R.simStable));
  check('byte-identity: no swallowed per-frame exceptions (FLDVF_S.errN === 0)', R.ok && R.errN === 0, 'errN=' + (R.ok && R.errN));

  // OFF switch -> byte-identical default look
  check('renderRich="off": NO sky dome built', OFF.ok && OFF.sky.found === false, 'sky=' + (OFF.sky && OFF.sky.found));
  check('renderRich="off": NO vignette injected', OFF.ok && OFF.vig.found === false, 'vig=' + (OFF.vig && OFF.vig.found));
  check('renderRich="off": ground AO NOT applied (colA._vfAO unset)', OFF.ok && OFF.ao.latch !== true, 'latch=' + (OFF.ao && OFF.ao.latch));
  check('renderRich="off": NO per-brigade shadow / pegs / rank-map (byte-identical default marker)', OFF.ok && OFF.unit.found && OFF.unit.shadow !== true && OFF.unit.pegs !== true && OFF.unit.rankMap !== true, 'shadow=' + (OFF.unit && OFF.unit.shadow) + ' pegs=' + (OFF.unit && OFF.unit.pegs) + ' rankMap=' + (OFF.unit && OFF.unit.rankMap));
  check('renderRich="off": no swallowed exceptions (errN===0)', OFF.ok && OFF.errN === 0, 'errN=' + (OFF.ok && OFF.errN));

  // health
  check('a screenshot was captured for visual confirmation', !!byLabel['3d'].detail.shot, byLabel['3d'].detail.shot || '');
  check('no Three.js texture warning across all scenes', allTex === 0, 'texWarnings=' + allTex);
  check('zero pageerrors across all scenes', allPe === 0, 'pageerrors=' + allPe + (allPe ? ' :: ' + scenes.flatMap(s => s.pageerrors).slice(0, 3).join(' | ') : ''));

  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), passed: steps.filter(s => s.ok).length, total: steps.length, steps, scenes };
  writeFileSync(join(OUT, 'probe-visual-fidelity.json'), JSON.stringify(out, null, 2));
  console.log('probe-visual-fidelity ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
