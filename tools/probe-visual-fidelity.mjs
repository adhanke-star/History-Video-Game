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
//    on fldLow() the pegs are GATED OUT and the shared slab/front body layer remains the low-tier fallback;
//  - BYTE-IDENTITY: the sim seed + mutable sim fields are INVARIANT across a synchronous render burst (T21 never
//    calls fldRng), FLDVF_S.errN === 0, and a static scan proves no combat/tactical file references the vf layer;
//  - the OFF switch (renderRich="off") reverts to the byte-identical default: no dome, no vignette, no shadow/
//    pegs/rank-map, colA._vfAO unset;
//  - zero pageerrors + zero Three.js texture warnings; a screenshot is captured for visual confirmation.
//  - T33 HDRI SKY + DERIVED LIGHTING (LANE-014 slice 3, this probe is the owner): the decoded LDR
//    equirect map attaches to the vfSky dome keyed to weather/time (day at launch; injected clear/dusk
//    -> dusk; injected rain -> overcast — the probe-weather scenData-injection idiom + the re-callable
//    fldHdriApply); sun/hemisphere light COLOURS == the FLDHDRI.LIGHTS precomputed constants
//    (tools/derive-hdr-palette.mjs, D472) with INTENSITIES untouched; reduceMotion detaches the map and
//    restores the authored launch palette; fldLow() carries no map; a route-BLOCKED first-load scene
//    proves the fail-closed gradient dome (loadState "failed", no map, fog tint live, lights never
//    captured, errN 0); renderRich="off" leaves T33 inert. The existing matchesFog tooth doubles as the
//    fog-tint COUPLING tooth on the mapped dome (the dome colour keeps re-copying the live weather fog).
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
  // T33 hdri sky (LANE-014 slice 3): presentation-only + no sibling visual-layer reaches
  // (the dome is found by scene name 'vfSky'; weather re-resolved from __FIELD independently).
  let t33 = ''; try { t33 = readFileSync(join(tacDir, 'T33-hdri-sky.js'), 'utf8'); } catch (e) {}
  check('static-scan: T33 never calls fldRng, never writes _SAVE_VER, reaches no sibling visual-layer internals',
    t33.length > 0 && !/fldRng\(/.test(t33) && !/_SAVE_VER\s*=/.test(t33) && !/(fldRr|FLDRR|fldVf|FLDVF|fldTr[A-Z]|FLDTR|fldFf|FLDFF|fldWx|FLDWX|fldAtmo|FLDAT|fldElevMode)/.test(t33) && !/\.swamps\b|\.towns\b|\.forts\b/.test(t33));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

// opts: { off, low, noFigures, waitHdri }
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

      /* ---- T33 HDRI SKY (LANE-014 slice 3): wait for the async day attach where expected ---- */
      if (${JSON.stringify(!!opts.waitHdri)}) {
        for (var hw = 0; hw < 200 && !(typeof FLDHDRI_S !== 'undefined' && FLDHDRI_S.attachedKey === 'day'); hw++) { fldRender(); await wait(100); }
      }
      out.t33 = {
        wrappers: typeof fld3dInit === 'function' && !!fld3dInit._t33 && typeof fldExit === 'function' && !!fldExit._t33,
        chainVf: !!(fld3dInit._vf && fldExit._vf),
        fns: ['fldHdriOff','fldHdriEligible','fldHdriKey','fldHdriDome','fldHdriDecode','fldHdriEnsure','fldHdriApply','fldHdriAttach','fldHdriDetach','fldHdriExit'].every(function(n){ return eval('typeof '+n) === 'function'; }),
        attachedKey: (typeof FLDHDRI_S !== 'undefined') ? FLDHDRI_S.attachedKey : undefined,
        errN: (typeof FLDHDRI_S !== 'undefined') ? FLDHDRI_S.errN : -1
      };

      /* ---- SKY DOME ---- */
      var sky = null; __FIELD.scene.traverse(function(o){ if (o && o.name === 'vfSky') sky = o; });
      out.sky = { found: !!sky };
      if (sky) {
        out.sky.renderOrder = sky.renderOrder;
        out.sky.backside = (sky.material && sky.material.side === T.BackSide);
        out.sky.map = !!(sky.material && sky.material.map);
        out.sky.attachedKey = (typeof FLDHDRI_S !== 'undefined') ? FLDHDRI_S.attachedKey : undefined;
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
      // T32 terrain texturing rides the same renderRich opt-out: capture the ground map state per scene
      out.groundMap = !!(__FIELD.ground && __FIELD.ground.material && __FIELD.ground.material.map);

      /* ---- PER-BRIGADE DECOR ---- */
      var ug = null, uu = null;
      for (var k = 0; k < __FIELD.units.length; k++) { var u0 = __FIELD.units[k], g0 = __FIELD._u3d[u0.id]; if (g0 && u0.alive) { ug = g0; uu = u0; break; } }
      out.unit = { found: !!ug };
      if (ug && uu) {
        var sh = ug.getObjectByName('vfShadow'), shLayer = null, pegs = ug.getObjectByName('vfPegs'), slab = ug.getObjectByName('slab');
        var bodySlabLayer = null, bodyFrontLayer = null;
        try { __FIELD.scene.traverse(function(o){ if (o && o.name === 'vfShadowLayer') shLayer = o; }); } catch(e){}
        try { __FIELD.scene.traverse(function(o){ if (o && o.name === 'markerBodySlabLayer') bodySlabLayer = o; if (o && o.name === 'markerBodyFrontLayer') bodyFrontLayer = o; }); } catch(e){}
        var shIndex = ug.userData && ug.userData._vf ? ug.userData._vf.shIndex : -1;
        var bodyLayerSlot = (ug.userData && ug.userData._markerBodySlot != null) ? ug.userData._markerBodySlot : -1;
        var bodyLayerSlotActive = false;
        try {
          if (bodySlabLayer && bodyLayerSlot >= 0 && window.THREE) {
            var bodyMat = new window.THREE.Matrix4();
            bodySlabLayer.getMatrixAt(bodyLayerSlot, bodyMat);
            var bodyEl = bodyMat.elements || [];
            bodyLayerSlotActive = Math.abs(Number(bodyEl[0] || 0)) > 0.01 && Number(bodyEl[13] || -9999) > -1000;
          }
        } catch(e) {}
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
        out.unit.slab = !!slab;
        out.unit.slabVisible = slab ? slab.visible !== false : null;
        out.unit.rankMap = !!(slab && slab.material && slab.material.map);
        out.unit.bodyLayer = !!(bodySlabLayer && bodyFrontLayer);
        out.unit.bodyLayerVisible = bodySlabLayer && bodyFrontLayer ? (bodySlabLayer.visible !== false && bodyFrontLayer.visible !== false) : null;
        out.unit.bodyLayerSlotActive = bodyLayerSlotActive;
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

/* ---- T33 scene scripts (LANE-014 slice 3) ---- */
// FAIL-CLOSED FIRST-LOAD: runs on a fresh page session with every .hdr request aborted
// (T33's per-key loadState is sticky per session), proving the byte-identical gradient dome.
function hdriBlockedScript(scenario, seed) {
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    var out = { ok:false };
    try {
      G.settings = G.settings || {};
      G.settings.gfxQuality = 'high';
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;
      G.settings.reduceMotion = false;
      try { delete G.settings.renderRich; } catch(e){}
      try { delete G.settings.formationFigures; } catch(e){}
      fldLaunchSandbox({ renderer:'3d', scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
      if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      for (var p = 0; p < 200 && !(typeof FLDHDRI_S !== 'undefined' && FLDHDRI_S.loadState.day === 'failed'); p++) { fldRender(); await wait(100); }
      var sky = null; __FIELD.scene.traverse(function(o){ if (o && o.name === 'vfSky') sky = o; });
      out.loadStateDay = (typeof FLDHDRI_S !== 'undefined') ? FLDHDRI_S.loadState.day : undefined;
      out.sky = { found: !!sky, map: !!(sky && sky.material.map),
        matchesFog: !!(sky && __FIELD.scene.fog && sky.material.color.getHexString() === __FIELD.scene.fog.color.getHexString()) };
      out.attachedKey = FLDHDRI_S.attachedKey;
      out.prevLights = FLDHDRI_S.prevLights;
      out.errN = FLDHDRI_S.errN;
      out.ok = true;
    } catch (e) { out.ok = false; out.error = String(e && e.message || e); }
    return out;
  })();`;
}
// KEYING + DERIVED LIGHTING + reduceMotion: one launch; weather re-injected via the
// probe-weather scenData idiom, re-applied through the re-callable fldHdriApply().
function hdriKeysScript(scenario, seed) {
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    var out = { ok:false };
    try {
      try { if (typeof fldExit === 'function' && typeof __FIELD !== 'undefined' && __FIELD && __FIELD.launched) fldExit(true); } catch(e){}
      await wait(120);
      G.settings = G.settings || {};
      G.settings.gfxQuality = 'high';
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;
      G.settings.reduceMotion = false;
      try { delete G.settings.renderRich; } catch(e){}
      try { delete G.settings.formationFigures; } catch(e){}
      fldLaunchSandbox({ renderer:'3d', scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
      if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      // the authored launch palette (what T33 must never change intensities of, and must
      // restore colours to on detach): the weather layer's own resolve, else engine defaults
      var wx = (typeof fldWxResolve === 'function') ? fldWxResolve() : null;
      out.palette = wx ? { sun: wx.palette.sun, hemiS: wx.palette.hemiS, hemiG: wx.palette.hemiG, sunI: wx.palette.sunI, hemiI: wx.palette.hemiI }
                       : { sun: '#fff2d0', hemiS: '#dceaff', hemiG: '#5a4a32', sunI: 1.15, hemiI: 0.72 };
      function snap() {
        var sky = null, dir = null, hemi = null;
        __FIELD.scene.traverse(function(o){
          if (o && o.name === 'vfSky') sky = o;
          if (o && o.isDirectionalLight && !dir) dir = o;
          if (o && o.isHemisphereLight && !hemi) hemi = o;
        });
        return {
          attachedKey: FLDHDRI_S.attachedKey,
          map: !!(sky && sky.material.map),
          matchesFog: !!(sky && __FIELD.scene.fog && sky.material.color.getHexString() === __FIELD.scene.fog.color.getHexString()),
          sun: dir ? '#' + dir.color.getHexString() : null, sunI: dir ? dir.intensity : null,
          hemiS: hemi ? '#' + hemi.color.getHexString() : null,
          hemiG: hemi && hemi.groundColor ? '#' + hemi.groundColor.getHexString() : null,
          hemiI: hemi ? hemi.intensity : null,
          prevLights: FLDHDRI_S.prevLights ? Object.assign({}, FLDHDRI_S.prevLights) : null
        };
      }
      async function till(key) {
        for (var p = 0; p < 200 && FLDHDRI_S.attachedKey !== key; p++) { fldRender(); await wait(100); }
      }
      function inject(weather) {
        __FIELD.scenData = Object.assign({}, __FIELD.scenData, { weather: weather });   // resolve reads _scenTop first, then scenData
        __FIELD._scenTop = null;
        fldHdriApply();
      }
      await till('day');    out.day = snap();
      inject({ sky: 'clear', time: 'dusk' });     await till('dusk');     out.dusk = snap();
      inject({ sky: 'rain', time: 'midday' });    await till('overcast'); out.rain = snap();
      G.settings.reduceMotion = true; fldHdriApply();
      for (var f = 0; f < 3; f++) { fldRender(); await wait(60); }
      out.rm = snap();
      G.settings.reduceMotion = false;
      out.errN = FLDHDRI_S.errN;
      out.ok = true;
    } catch (e) { out.ok = false; out.error = String(e && e.message || e); }
    return out;
  })();`;
}

async function runSceneScript(page, label, script, shared) {
  const peStart = shared.pe.length, conStart = shared.con.length;
  let d = { ok: false, error: 'not run' };
  try {
    d = await page.evaluate(script);
    try { await page.screenshot({ path: join(OUT, 'vf-' + label + '.png') }); d.shot = 'tools/shots/vf-' + label + '.png'; } catch (e) {}
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  const pageerrors = shared.pe.slice(peStart), consoleLines = shared.con.slice(conStart);
  const texWarn = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
  return { label, detail: d, pageerrors, texWarn, console: consoleLines.slice(-10) };
}
async function runScene(page, label, scenario, seed, opts, shared) {
  return runSceneScript(page, label, sceneScript(scenario, seed, opts), shared);
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
    // T33 FAIL-CLOSED FIRST (fresh page session; per-key loadState is sticky): abort
    // every .hdr fetch, prove the byte-identical gradient dome, then reload clean.
    await page.route('**/*.hdr', r => r.abort());
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    scenes.push(await runSceneScript(page, 'hdri-blocked', hdriBlockedScript('shiloh', 21), shared));
    await page.unroute('**/*.hdr');
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    scenes.push(await runScene(page, '3d', 'shiloh', 21, { waitHdri: true }, shared));
    scenes.push(await runScene(page, 'pegs-fallback', 'shiloh', 21, { noFigures: true }, shared));
    scenes.push(await runScene(page, 'off', 'shiloh', 21, { off: true }, shared));
    scenes.push(await runScene(page, 'low', 'shiloh', 21, { low: true }, shared));
    scenes.push(await runSceneScript(page, 'hdri-keys', hdriKeysScript('shiloh', 21), shared));
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
  check('decor (Max tier, default high): T24 formation figures replace the slab body without hidden resident vfPegs',
    R.ok && R.unit.slab === false && R.unit.rankMap !== true && R.unit.pegs === false,
    'slab=' + (R.unit && R.unit.slab) + ' rankMap=' + (R.unit && R.unit.rankMap) + ' pegs=' + (R.unit && R.unit.pegs) + ' visible=' + (R.unit && R.unit.pegsVisible));
  check('decor (Max tier fallback): formationFigures="off" restores a visible "vfPegs" InstancedMesh with count>0 + bounding sphere',
    PEG.ok && PEG.unit && PEG.unit.slab === true && PEG.unit.rankMap === true && PEG.unit.pegs === true && PEG.unit.pegsVisible === true && PEG.unit.pegCount > 0 && PEG.unit.pegSphere === true,
    'slab=' + (PEG.unit && PEG.unit.slab) + ' rankMap=' + (PEG.unit && PEG.unit.rankMap) + ' pegs=' + (PEG.unit && PEG.unit.pegs) + ' visible=' + (PEG.unit && PEG.unit.pegsVisible) + ' count=' + (PEG.unit && PEG.unit.pegCount) + ' sphere=' + (PEG.unit && PEG.unit.pegSphere));
  check('decor (Max tier fallback): restored slab carries the stylized rank MAP (massed-infantry read)',
    PEG.ok && PEG.unit && PEG.unit.slab === true && PEG.unit.slabVisible === true && PEG.unit.rankMap === true,
    'slab=' + (PEG.unit && PEG.unit.slab) + ' visible=' + (PEG.unit && PEG.unit.slabVisible) + ' rankMap=' + (PEG.unit && PEG.unit.rankMap));

  // peg tier gate
  check('peg tier gate: on fldLow() the peg ranks are GATED OUT while shared body fallback + instanced shadow remain',
    LOW.ok && LOW.unit.found && LOW.unit.pegs === false && LOW.unit.shadowInstanced === true && LOW.unit.slab === false && LOW.unit.rankMap !== true && LOW.unit.bodyLayer === true && LOW.unit.bodyLayerVisible === true && LOW.unit.bodyLayerSlotActive === true,
    'lowPegs=' + (LOW.unit && LOW.unit.pegs) + ' lowShadowInstanced=' + (LOW.unit && LOW.unit.shadowInstanced) + ' lowBodyLayer=' + (LOW.unit && LOW.unit.bodyLayer) + ' lowBodyLayerActive=' + (LOW.unit && LOW.unit.bodyLayerSlotActive));

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
  check('renderRich="off": NO ground texture map applied (the T32 terrain-texturing layer rides the same opt-out)', OFF.ok && OFF.groundMap === false, 'groundMap=' + (OFF.groundMap));

  // T33 HDRI sky + derived lighting (LANE-014 slice 3)
  const KEYS = byLabel['hdri-keys'].detail, BLK = byLabel['hdri-blocked'].detail;
  // FLDHDRI.LIGHTS pinned as literals (tools/derive-hdr-palette.mjs reproduces them; D472)
  const HL = { day: { sun: '#feefc7', hemiS: '#dee0dc', hemiG: '#55534d' },
               dusk: { sun: '#ffdb9e', hemiS: '#dfdef0', hemiG: '#5e4f44' },
               overcast: { sun: '#efeadf', hemiS: '#d3d5d5', hemiG: '#57524a' } };
  const near = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && Math.abs(a - b) < 1e-9;
  const litMatch = (s, e) => !!s && !!e && s.sun === e.sun && s.hemiS === e.hemiS && s.hemiG === e.hemiG;
  check('T33: 2 by-assignment wrappers (fld3dInit/fldExit) installed, prior ._vf markers carried, module fns present',
    R.ok && R.t33 && R.t33.wrappers === true && R.t33.chainVf === true && R.t33.fns === true, JSON.stringify(R.t33 || {}));
  check('hdri sky: the decoded day equirect map ATTACHES to the vfSky dome at launch (attachedKey "day")',
    R.ok && R.sky.map === true && R.sky.attachedKey === 'day', 'map=' + (R.sky && R.sky.map) + ' key=' + (R.sky && R.sky.attachedKey));
  check('hdri keying: injected clear/dusk re-applies to the DUSK HDRI',
    KEYS.ok && KEYS.dusk && KEYS.dusk.attachedKey === 'dusk' && KEYS.dusk.map === true,
    'key=' + (KEYS.dusk && KEYS.dusk.attachedKey) + ' map=' + (KEYS.dusk && KEYS.dusk.map));
  check('hdri keying: injected rain re-applies to the OVERCAST HDRI',
    KEYS.ok && KEYS.rain && KEYS.rain.attachedKey === 'overcast' && KEYS.rain.map === true,
    'key=' + (KEYS.rain && KEYS.rain.attachedKey) + ' map=' + (KEYS.rain && KEYS.rain.map));
  check('derived lighting: sun/hemisphere COLOURS == the precomputed FLDHDRI.LIGHTS constants for all three keys',
    KEYS.ok && litMatch(KEYS.day, HL.day) && litMatch(KEYS.dusk, HL.dusk) && litMatch(KEYS.rain, HL.overcast),
    JSON.stringify({ day: KEYS.day && [KEYS.day.sun, KEYS.day.hemiS, KEYS.day.hemiG], dusk: KEYS.dusk && [KEYS.dusk.sun, KEYS.dusk.hemiS, KEYS.dusk.hemiG], rain: KEYS.rain && [KEYS.rain.sun, KEYS.rain.hemiS, KEYS.rain.hemiG] }));
  check('derived lighting: light INTENSITIES untouched (== the authored launch palette) across every key switch',
    KEYS.ok && KEYS.palette && [KEYS.day, KEYS.dusk, KEYS.rain, KEYS.rm].every(s => s && near(s.sunI, KEYS.palette.sunI) && near(s.hemiI, KEYS.palette.hemiI)),
    JSON.stringify({ expected: KEYS.palette && [KEYS.palette.sunI, KEYS.palette.hemiI], day: KEYS.day && [KEYS.day.sunI, KEYS.day.hemiI], rm: KEYS.rm && [KEYS.rm.sunI, KEYS.rm.hemiI] }));
  check('reduceMotion: static tint — map DETACHED, key null, light colours RESTORED to the authored launch palette, stash cleared',
    KEYS.ok && KEYS.rm && KEYS.rm.map === false && KEYS.rm.attachedKey === null && litMatch(KEYS.rm, KEYS.palette) && KEYS.rm.prevLights === null,
    JSON.stringify(KEYS.rm || {}));
  check('fldLow(): the dome carries NO hdri map at the low tier (static tint)',
    LOW.ok && LOW.sky.found && LOW.sky.map !== true && !!LOW.t33 && LOW.t33.attachedKey == null,
    'map=' + (LOW.sky && LOW.sky.map) + ' key=' + (LOW.t33 && LOW.t33.attachedKey));
  check('fail-closed (.hdr BLOCKED, first load): loadState "failed" — gradient dome intact (no map), fog tint live, lights never captured, errN 0',
    BLK.ok && BLK.loadStateDay === 'failed' && BLK.sky && BLK.sky.found === true && BLK.sky.map !== true && BLK.sky.matchesFog === true && BLK.attachedKey === null && BLK.prevLights === null && BLK.errN === 0,
    JSON.stringify({ loadStateDay: BLK.loadStateDay, sky: BLK.sky, key: BLK.attachedKey, errN: BLK.errN }));
  check('renderRich="off": T33 inert (no attach, attachedKey null, errN 0)',
    OFF.ok && OFF.t33 && OFF.t33.attachedKey === null && OFF.t33.errN === 0, JSON.stringify(OFF.t33 || {}));

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
