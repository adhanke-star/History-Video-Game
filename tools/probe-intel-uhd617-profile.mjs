#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused Phase H performance/readout gate for the Intel UHD Graphics 617 floor.
// Timing metrics are recorded as warning-only because headless Chrome may use
// SwiftShader or the host GPU; structural low-tier render limits are hard.

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, resolve } from 'node:path';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });

const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const mediaBudget = JSON.parse(readFileSync(join(ROOT, 'data', 'media-budget.json'), 'utf8'));
const perf = mediaBudget.performanceProfile || {};
const budgets = perf.budgets || {};
const scenario = perf.representativeScenario || 'chickamauga';
const largestScenario = perf.largestShippedScene || '';
const HW_GL = ['--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const SW_GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const THREE_TEXTURE_WARNING = /THREE\.WebGLRenderer:\s*Texture marked for update but image is undefined/;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const steps = [];
const warnings = [];
function check(name, cond, detail) {
  steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) });
}
function warn(msg, detail) {
  warnings.push(detail === undefined ? msg : (msg + ': ' + detail));
}
async function up(u) {
  try {
    const r = await fetch(u, { method: 'HEAD' });
    return r.ok || r.status === 200;
  } catch {
    return false;
  }
}
function walkFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name[0] === '.') continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(p));
    else if (ent.isFile()) out.push(p);
  }
  return out;
}
function assetMetrics() {
  const files = walkFiles(join(ROOT, 'assets', 'embed'));
  const byCategory = {};
  let rawBytes = 0;
  for (const f of files) {
    const b = statSync(f).size;
    rawBytes += b;
    const rel = f.replace(join(ROOT, 'assets', 'embed') + '/', '');
    const cat = rel.split('/')[0] || '';
    byCategory[cat] = byCategory[cat] || { files: 0, bytes: 0 };
    byCategory[cat].files++;
    byCategory[cat].bytes += b;
  }
  const htmlBytes = statSync(join(ROOT, cfg.file)).size;
  return {
    embeddedFiles: files.length,
    rawBytes,
    rawMB: +(rawBytes / 1048576).toFixed(3),
    htmlBytes,
    htmlMB: +(htmlBytes / 1048576).toFixed(3),
    byCategory
  };
}

// E68: derive the shipped opening-scene roster directly from current battle data. The configured
// largest leg must remain tied for the actual maximum when future battles or OOBs are added.
function openingSceneInventory() {
  const byScenario = {};
  for (const file of readdirSync(join(ROOT, 'data')).filter(name => /\.json$/.test(name))) {
    let data = null;
    try { data = JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8')); } catch { continue; }
    for (const value of Object.values(data || {})) {
      if (!value || typeof value !== 'object' || !value.id || !value.objective) continue;
      const scene = Array.isArray(value.phases) && value.phases.length ? value.phases[0] : value;
      const oob = scene && scene.oob;
      if (!oob || typeof oob !== 'object') continue;
      const units = ['US', 'CS'].reduce((n, side) => n + (Array.isArray(oob[side]) ? oob[side].length : 0), 0);
      if (units > 0) byScenario[value.id] = { file, units };
    }
  }
  const maxUnits = Math.max(0, ...Object.values(byScenario).map(item => item.units));
  const largestIds = Object.keys(byScenario).filter(id => byScenario[id].units === maxUnits).sort();
  return { metric: 'opening-oob-units', scenarios: byScenario, count: Object.keys(byScenario).length, maxUnits, largestIds };
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 90; i++) {
    if (await up(probe)) return srv;
    await sleep(150);
  }
  try { srv.kill(); } catch {}
  throw new Error('Could not start static server on :' + cfg.port);
}

async function launchBrowser() {
  async function tryLaunch(args, mode) {
    try {
      const browser = await chromium.launch({ channel: 'chrome', headless: true, args });
      return { browser, mode };
    } catch (first) {
      const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args });
      return { browser, mode };
    }
  }
  try {
    return await tryLaunch(HW_GL, 'hardware-preferred');
  } catch {
    return await tryLaunch(SW_GL, 'swiftshader-fallback');
  }
}

function profileScript(label, quality, scenarioId) {
  const opts = {
    label,
    quality,
    scenario: scenarioId,
    seed: label === 'high' ? 40 : (label === 'low' ? 41 : 42),
    stepN: 220,
    burstFrames: 45
  };
  return `(async () => {
    var opts = ${JSON.stringify(opts)};
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function summarizePixels(gl, cv) {
      try {
        var w = gl.drawingBufferWidth || cv.width;
        var h = gl.drawingBufferHeight || cv.height;
        var sw = Math.max(16, Math.min(36, Math.floor(w * 0.18)));
        var sh = Math.max(16, Math.min(36, Math.floor(h * 0.18)));
        var x = Math.max(0, Math.floor((w - sw) / 2));
        var y = Math.max(0, Math.floor((h - sh) / 2));
        var pix = new Uint8Array(sw * sh * 4);
        gl.readPixels(x, y, sw, sh, gl.RGBA, gl.UNSIGNED_BYTE, pix);
        var buckets = {}, colored = 0, alpha = 0, total = Math.floor(pix.length / 4);
        for (var i = 0; i < pix.length; i += 4) {
          var r = pix[i], g = pix[i + 1], b = pix[i + 2], a = pix[i + 3];
          if (a > 0) alpha++;
          if (r + g + b > 24) colored++;
          buckets[(r >> 4) + "," + (g >> 4) + "," + (b >> 4)] = 1;
        }
        return { total: total, colored: colored, alpha: alpha, buckets: Object.keys(buckets).length };
      } catch(e) {
        return { error: String(e && e.message || e) };
      }
    }
    function countScene(scene) {
      var c = { objects: 0, meshes: 0, instancedMeshes: 0, points: 0, lines: 0, sprites: 0, maxDepth: 0 };
      function visit(o, d) {
        if (!o) return;
        c.objects++;
        if (o.isInstancedMesh) c.instancedMeshes++;
        if (o.isMesh) c.meshes++;
        if (o.isPoints) c.points++;
        if (o.isLine || o.isLineSegments) c.lines++;
        if (o.isSprite) c.sprites++;
        if (d > c.maxDepth) c.maxDepth = d;
        var ch = o.children || [];
        for (var i = 0; i < ch.length; i++) visit(ch[i], d + 1);
      }
      visit(scene, 0);
      return c;
    }
    function firstUnitRender() {
      var out = { found: false };
      try {
        var u = null;
        for (var i = 0; i < __FIELD.units.length; i++) {
          var x = __FIELD.units[i];
          var arm = String((x && (x.arm || x.type)) || 'inf').toLowerCase();
          if (x && x.alive && (arm === 'inf' || arm === 'infantry')) { u = x; break; }
        }
        var g = u && __FIELD._u3d && __FIELD._u3d[u.id];
        if (!u || !g) return out;
        var ff = g.getObjectByName('ffFormation');
        var ffMeta = (ff && ff.userData && ff.userData.ff) || {};
        var ffLayer = null;
        try { ffLayer = (typeof __FIELD !== 'undefined' && __FIELD && __FIELD._ffLayer) || null; } catch(e){}
        var pegs = g.getObjectByName('vfPegs');
        var shadow = g.getObjectByName('vfShadow');
        var shadowLayer = null;
        try { if (typeof __FIELD !== 'undefined' && __FIELD && __FIELD.scene) __FIELD.scene.traverse(function(o){ if (o && o.name === 'vfShadowLayer') shadowLayer = o; }); } catch(e){}
        var shIndex = g.userData && g.userData._vf ? g.userData._vf.shIndex : -1;
        var slab = g.getObjectByName('slab');
        var ring = g.getObjectByName('ring');
        var flag = g.getObjectByName('flag');
        var front = g.getObjectByName('front');
        var pole = g.getObjectByName('pole');
        var topper = g.getObjectByName('topper');
        var bodySlabLayer = null;
        var bodyFrontLayer = null;
        try { if (typeof __FIELD !== 'undefined' && __FIELD && __FIELD.scene) __FIELD.scene.traverse(function(o){ if (o && o.name === 'markerBodySlabLayer') bodySlabLayer = o; if (o && o.name === 'markerBodyFrontLayer') bodyFrontLayer = o; }); } catch(e){}
        var bodyLayerSlot = (g.userData && g.userData._markerBodySlot != null) ? g.userData._markerBodySlot : -1;
        var bodyLayerSlotActive = false;
        try {
          if (bodySlabLayer && bodyLayerSlot >= 0 && window.THREE) {
            var bodyMat = new window.THREE.Matrix4();
            bodySlabLayer.getMatrixAt(bodyLayerSlot, bodyMat);
            var bodyEl = bodyMat.elements || [];
            bodyLayerSlotActive = Math.abs(Number(bodyEl[0] || 0)) > 0.01 && Number(bodyEl[13] || -9999) > -1000;
          }
        } catch(e) {}
        var poleLayer = null;
        try { if (typeof __FIELD !== 'undefined' && __FIELD && __FIELD.scene) __FIELD.scene.traverse(function(o){ if (o && o.name === 'markerPoleLayer') poleLayer = o; }); } catch(e){}
        var poleLayerSlot = (g.userData && g.userData._markerPoleSlot != null) ? g.userData._markerPoleSlot : -1;
        var poleLayerSlotActive = false;
        try {
          if (poleLayer && poleLayerSlot >= 0 && window.THREE) {
            var poleMat = new window.THREE.Matrix4();
            poleLayer.getMatrixAt(poleLayerSlot, poleMat);
            var poleEl = poleMat.elements || [];
            poleLayerSlotActive = Math.abs(Number(poleEl[0] || 0)) > 0.01 && Number(poleEl[13] || -9999) > -1000;
          }
        } catch(e) {}
        out = {
          found: true,
          unitId: u.id,
          formation: u.formation || '',
          formationFigures: !!(ff || ffLayer),
          formationFiguresVisible: !!(ff && ff.visible && ffMeta.active > 0),
          formationFiguresMode: ffLayer ? 'shared-instanced' : (ff ? 'per-unit' : ''),
          formationFigureSlot: ffMeta.slot == null ? -1 : ffMeta.slot,
          formationFigureLayerCount: ffLayer ? ffLayer.nextSlot : 0,
          formationFigureLayerMeshes: ffLayer && ffLayer.grp && ffLayer.grp.children ? ffLayer.grp.children.length : 0,
          pegs: !!pegs,
          pegsVisible: !!(pegs && pegs.visible !== false),
          shadow: !!(shadow || shadowLayer),
          shadowMode: shadow ? 'per-unit' : (shadowLayer ? 'instanced' : ''),
          shadowIndex: shIndex,
          shadowLayerCount: shadowLayer ? shadowLayer.count : 0,
          selectionRing: !!ring,
          selectionRingVisible: ring ? ring.visible !== false : null,
          selectionRingOpacity: ring && ring.material ? ring.material.opacity : null,
          flag: !!flag,
          flagVisible: flag ? flag.visible !== false : null,
          bodyLayer: !!(bodySlabLayer && bodyFrontLayer),
          bodyLayerVisible: bodySlabLayer && bodyFrontLayer ? (bodySlabLayer.visible !== false && bodyFrontLayer.visible !== false) : null,
          bodyLayerCount: bodySlabLayer ? bodySlabLayer.count : 0,
          bodyLayerSlot: bodyLayerSlot,
          bodyLayerSlotActive: bodyLayerSlotActive,
          pole: !!pole,
          poleVisible: pole ? pole.visible !== false : null,
          poleLayer: !!poleLayer,
          poleLayerVisible: poleLayer ? poleLayer.visible !== false : null,
          poleLayerCount: poleLayer ? poleLayer.count : 0,
          poleLayerSlot: poleLayerSlot,
          poleLayerSlotActive: poleLayerSlotActive,
          topper: !!topper,
          topperVisible: topper ? topper.visible !== false : null,
          front: !!front,
          frontVisible: front ? front.visible !== false : null,
          slab: !!slab,
          slabVisible: slab ? slab.visible !== false : null
        };
      } catch(e) { out.error = String(e && e.message || e); }
      return out;
    }
    function markerResourceStats() {
      var out = { found: false };
      try {
        var refs = [];
        var bySide = {};
        for (var i = 0; i < __FIELD.units.length; i++) {
          var u = __FIELD.units[i];
          var g = u && __FIELD._u3d && __FIELD._u3d[u.id];
          if (!u || !g) continue;
          var ref = {
            side: u.side,
            slab: g.getObjectByName('slab'),
            front: g.getObjectByName('front'),
            ring: g.getObjectByName('ring'),
            pole: g.getObjectByName('pole'),
            topper: g.getObjectByName('topper')
          };
          refs.push(ref);
          bySide[u.side] = bySide[u.side] || [];
          bySide[u.side].push(ref);
        }
        if (refs.length < 2) return out;
        var ringCount = 0;
        var ringPair = [];
        var slabCount = 0;
        var slabPair = [];
        var frontCount = 0;
        var frontPair = [];
        var poleCount = 0;
        var polePair = [];
        var topperCount = 0;
        var topperPair = [];
        var poleLayer = null;
        var bodySlabLayer = null;
        var bodyFrontLayer = null;
        try { if (typeof __FIELD !== 'undefined' && __FIELD && __FIELD.scene) __FIELD.scene.traverse(function(o){ if (o && o.name === 'markerPoleLayer') poleLayer = o; }); } catch(e){}
        try { if (typeof __FIELD !== 'undefined' && __FIELD && __FIELD.scene) __FIELD.scene.traverse(function(o){ if (o && o.name === 'markerBodySlabLayer') bodySlabLayer = o; if (o && o.name === 'markerBodyFrontLayer') bodyFrontLayer = o; }); } catch(e){}
        for (var rc = 0; rc < refs.length; rc++) if (refs[rc].ring) ringCount++;
        for (var pc = 0; pc < refs.length; pc++) if (refs[pc].pole) poleCount++;
        for (var tc = 0; tc < refs.length; tc++) if (refs[tc].topper) topperCount++;
        for (var side in bySide) {
          if (!Object.prototype.hasOwnProperty.call(bySide, side)) continue;
          var sideRings = [];
          var sideSlabs = [];
          var sideFronts = [];
          var sidePoles = [];
          var sideToppers = [];
          for (var ts = 0; ts < bySide[side].length; ts++) {
            if (bySide[side][ts].ring) sideRings.push(bySide[side][ts]);
            if (bySide[side][ts].slab) sideSlabs.push(bySide[side][ts]);
            if (bySide[side][ts].front) sideFronts.push(bySide[side][ts]);
            if (bySide[side][ts].pole) sidePoles.push(bySide[side][ts]);
            if (bySide[side][ts].topper) sideToppers.push(bySide[side][ts]);
          }
          if (ringPair.length < 2 && sideRings.length >= 2) ringPair = sideRings;
          if (slabPair.length < 2 && sideSlabs.length >= 2) slabPair = sideSlabs;
          if (frontPair.length < 2 && sideFronts.length >= 2) frontPair = sideFronts;
          if (polePair.length < 2 && sidePoles.length >= 2) polePair = sidePoles;
          if (sideToppers.length >= 2) { topperPair = sideToppers; break; }
        }
        for (var sc = 0; sc < refs.length; sc++) if (refs[sc].slab) slabCount++;
        for (var fc = 0; fc < refs.length; fc++) if (refs[fc].front) frontCount++;
        function pairFor(name) {
          if (name === 'slab') return slabPair;
          if (name === 'front') return frontPair;
          if (name === 'ring') return ringPair;
          if (name === 'pole') return polePair;
          return name === 'topper' ? topperPair : refs;
        }
        function sameGeo(name) {
          var pair = pairFor(name);
          return !!(pair[0][name] && pair[1][name] && pair[0][name].geometry && pair[0][name].geometry === pair[1][name].geometry);
        }
        function sameMat(name) {
          var pair = pairFor(name);
          return !!(pair[0][name] && pair[1][name] && pair[0][name].material && pair[0][name].material === pair[1][name].material);
        }
        out = {
          found: true,
          cache: !!__FIELD._unit3dMarkerResources,
          slabCount: slabCount,
          frontCount: frontCount,
          bodyLayer: !!(bodySlabLayer && bodyFrontLayer),
          bodyLayerVisible: bodySlabLayer && bodyFrontLayer ? (bodySlabLayer.visible !== false && bodyFrontLayer.visible !== false) : null,
          bodyLayerCount: bodySlabLayer ? bodySlabLayer.count : 0,
          ringCount: ringCount,
          poleCount: poleCount,
          poleLayer: !!poleLayer,
          poleLayerVisible: poleLayer ? poleLayer.visible !== false : null,
          poleLayerCount: poleLayer ? poleLayer.count : 0,
          topperCount: topperCount,
          slabGeoShared: slabPair.length >= 2 ? sameGeo('slab') : null,
          frontGeoShared: frontPair.length >= 2 ? sameGeo('front') : null,
          ringGeoShared: ringPair.length >= 2 ? sameGeo('ring') : null,
          poleGeoShared: polePair.length >= 2 ? sameGeo('pole') : null,
          topperGeoShared: topperPair.length >= 2 ? sameGeo('topper') : null,
          frontMatShared: frontPair.length >= 2 ? sameMat('front') : null,
          poleMatShared: polePair.length >= 2 ? sameMat('pole') : null,
          topperMatShared: topperPair.length >= 2 ? sameMat('topper') : null,
          slabMatShared: slabPair.length >= 2 ? sameMat('slab') : null
        };
      } catch(e) { out.error = String(e && e.message || e); }
      return out;
    }
    function terrainOverlayResidency() {
      var out = { available: false, hypExists: null, contourExists: null, decorExists: null };
      try {
        if (typeof FLDTR_S === 'undefined' || !FLDTR_S) return out;
        out.available = true;
        out.hypExists = !!FLDTR_S.hyp3d;
        out.contourExists = !!FLDTR_S.contour3d;
        out.decorExists = !!FLDTR_S.decor3d;
        out.mode = (typeof fldElevMode === 'function') ? fldElevMode() : '';
      } catch(e) { out.error = String(e && e.message || e); }
      return out;
    }
    function atmoSmokeStats() {
      var out = { available: false, pointsExists: false, visible: null, activeParticles: 0, bufferCount: 0, drawRangeCount: 0 };
      try {
        out.available = (typeof fldAtmoState === 'function');
        var A = (typeof __FIELD !== 'undefined' && __FIELD) ? __FIELD._atmo : null;
        if (A && A.parts) out.activeParticles = A.parts.length;
        var pts = null;
        if (typeof __FIELD !== 'undefined' && __FIELD && __FIELD.scene && __FIELD.scene.getObjectByName) pts = __FIELD.scene.getObjectByName('atmoSmoke');
        out.pointsExists = !!pts;
        if (!pts) return out;
        out.visible = pts.visible !== false;
        if (pts.geometry && pts.geometry.attributes && pts.geometry.attributes.aAlpha) out.bufferCount = pts.geometry.attributes.aAlpha.count;
        if (pts.geometry && pts.geometry.drawRange) out.drawRangeCount = pts.geometry.drawRange.count;
      } catch(e) { out.error = String(e && e.message || e); }
      return out;
    }
    function glInfo(gl) {
      var info = { maxTextureSize: 0, maxRenderbufferSize: 0, pointSizeRange: [] };
      try {
        var dbg = gl.getExtension('WEBGL_debug_renderer_info');
        info.vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        info.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        info.version = gl.getParameter(gl.VERSION);
        info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        info.maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        info.pointSizeRange = Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || []);
      } catch(e) { info.error = String(e && e.message || e); }
      return info;
    }
    var out = { ok: false, label: opts.label, quality: opts.quality, scenario: opts.scenario };
    try {
      try { if (typeof fldExit === 'function' && typeof __FIELD !== 'undefined' && __FIELD && __FIELD.launched) fldExit(true); } catch(e){}
      await wait(120);
      G.settings = G.settings || {};
      G.settings.gfxQuality = opts.quality;
      G.settings.reduceMotion = false;
      delete G.settings.tacticalFog;
      try { delete G.settings.tacticalPreset; } catch(e) {}
      try { delete G.settings.renderRich; } catch(e) {}
      try { delete G.settings.formationFigures; } catch(e) {}
      var launchStart = performance.now();
      fldLaunchSandbox({ renderer: '3d', scenario: opts.scenario, autoBoth: true, playerSide: 'US', seed: opts.seed });
      for (var w = 0; w < 220 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(75);
      out.launchMs = +(performance.now() - launchStart).toFixed(1);
      if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      var stepStart = performance.now();
      if (typeof fldStepN === 'function') fldStepN(opts.stepN, 0.05);
      out.stepMs = +(performance.now() - stepStart).toFixed(1);
      for (var s = 0; s < 5; s++) { fldRender(); await wait(45); }
      var renderer = __FIELD.renderer;
      var gl = renderer.getContext();
      out.webgl = glInfo(gl);
      out.fldLow = typeof fldLow === 'function' ? !!fldLow() : null;
      out.rendererKind = __FIELD.rendererKind || '';
      out.units = __FIELD.units ? __FIELD.units.length : 0;
      out.sceneCounts = countScene(__FIELD.scene);
      out.unitRender = firstUnitRender();
      out.markerResources = markerResourceStats();
      out.terrainOverlay = terrainOverlayResidency();
      out.atmoSmokeBeforeBurst = atmoSmokeStats();
      out.ffOff = typeof fldFfOff === 'function' ? !!fldFfOff() : null;
      out.rrOff = typeof fldRrOff === 'function' ? !!fldRrOff() : null;
      out.vfOff = typeof fldVfOff === 'function' ? !!fldVfOff() : null;
      out.frameBurst = { frames: opts.burstFrames };
      if (renderer.info && typeof renderer.info.reset === 'function') renderer.info.reset();
      var burstStart = performance.now();
      for (var f = 0; f < opts.burstFrames; f++) fldRender();
      var burstMs = performance.now() - burstStart;
      out.frameBurst.totalMs = +burstMs.toFixed(1);
      out.frameBurst.avgMs = +(burstMs / opts.burstFrames).toFixed(2);
      out.frameBurst.proxyFps = +(1000 / Math.max(0.001, burstMs / opts.burstFrames)).toFixed(1);
      var ri = renderer.info && renderer.info.render ? renderer.info.render : {};
      var mi = renderer.info && renderer.info.memory ? renderer.info.memory : {};
      out.renderInfo = {
        calls: Number(ri.calls || 0),
        triangles: Number(ri.triangles || 0),
        points: Number(ri.points || 0),
        lines: Number(ri.lines || 0),
        geometries: Number(mi.geometries || 0),
        textures: Number(mi.textures || 0)
      };
      out.atmoSmokeAfterBurst = atmoSmokeStats();
      var cv = document.getElementById('fldGl');
      out.pixelStats = summarizePixels(gl, cv);
      if (out.pixelStats.error) throw new Error(out.pixelStats.error);
      if (out.pixelStats.colored < Math.max(20, out.pixelStats.total * 0.25)) throw new Error('canvas too blank: ' + JSON.stringify(out.pixelStats));
      if (out.pixelStats.buckets < 6) throw new Error('canvas lacks visual variety: ' + JSON.stringify(out.pixelStats));
      out.ok = true;
    } catch(e) {
      out.ok = false;
      out.error = String(e && e.message || e);
    }
    return out;
  })();`;
}

async function runProfile(page, label, quality, scenarioId, shared) {
  const peStart = shared.pe.length;
  const conStart = shared.con.length;
  let detail = { ok: false, error: 'not run' };
  try {
    detail = await page.evaluate(profileScript(label, quality, scenarioId));
  } catch (e) {
    detail = { ok: false, error: String(e && e.message || e), label, quality, scenario: scenarioId };
  } finally {
    try { await page.evaluate(`(() => { try { if (typeof fldExit === 'function') fldExit(true); } catch(e) {} })()`); } catch {}
  }
  const pageerrors = shared.pe.slice(peStart);
  const consoleLines = shared.con.slice(conStart);
  const textureWarnings = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
  return { label, quality, ok: !!detail.ok && !pageerrors.length && !textureWarnings.length, detail, pageerrors, textureWarnings, console: consoleLines.slice(-12) };
}

const assets = assetMetrics();
const coverage = openingSceneInventory();
check('performance policy is present in data/media-budget.json', perf.targetHardware === 'Intel UHD Graphics 617 / 8 GB RAM floor' && perf.probe === 'tools/probe-intel-uhd617-profile.mjs', perf.targetHardware || '');
check('E68 largest-scene config names a current largest shipped opening OOB',
  coverage.count === 27 && !!coverage.scenarios[largestScenario] && coverage.scenarios[largestScenario].units === coverage.maxUnits,   // D391: 21 -> 22 — Spotsylvania opens at 10 units. D393: 22 -> 23 — Wilderness opens at 6 units. D397: 23 -> 24 — Petersburg initial assaults opens at 9 units; Kennesaw's 17 keeps the largest-scene crown (re-audited). D436: 24 -> 25 — Atlanta phase 1 opens at 9 units (5 US + 4 CS); Kennesaw's 17 keeps the crown. D442: 25 -> 26 — Cold Harbor opens at 15 units (9 US + 6 CS); Kennesaw's 17 still keeps the crown. D463: 26 -> 27 — Fort Pillow opens at 5 units (2 US + 3 CS); Kennesaw's 17 still keeps the crown (LANE-013 P4).
  JSON.stringify({ configured: largestScenario, count: coverage.count, maxUnits: coverage.maxUnits, largestIds: coverage.largestIds, configuredUnits: coverage.scenarios[largestScenario] && coverage.scenarios[largestScenario].units }));
check('E68 retains the existing low-tier hard caps unchanged',
  Number(budgets.lowTierRenderCallHardCap) === 360 && Number(budgets.lowTierObjectHardCap) === 1400,
  JSON.stringify({ calls: budgets.lowTierRenderCallHardCap, objects: budgets.lowTierObjectHardCap }));
check('raw embedded core remains under review warning for this profile', assets.rawBytes <= mediaBudget.policy.currentReviewWarnBytes, assets.rawBytes + ' <= ' + mediaBudget.policy.currentReviewWarnBytes);
if (assets.rawBytes > mediaBudget.policy.rawEmbedSoftBytes) warn('raw embed tier remains above soft warning budget', assets.rawMB + ' MB');

let browserInfo = { mode: '' };
const server = await ensureServer();
const launch = await launchBrowser();
const browser = launch.browser;
browserInfo.mode = launch.mode;
const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
ctx.setDefaultTimeout(70000);
const page = await ctx.newPage();
const shared = { pe: [], con: [] };
page.on('pageerror', e => shared.pe.push(String(e.message)));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') shared.con.push('[' + m.type() + '] ' + m.text()); });

const profiles = [];
try {
  const start = Date.now();
  await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 70000 });
  browserInfo.domcontentloadedMs = Date.now() - start;
  await sleep(450);
  profiles.push(await runProfile(page, 'high', 'high', scenario, shared));
  profiles.push(await runProfile(page, 'low', 'low', scenario, shared));
  profiles.push(await runProfile(page, 'largest-low', 'low', largestScenario, shared));
} finally {
  if (server) {
    try { server.kill(); } catch {}
  }
}
try { await Promise.race([ctx.close().catch(() => {}), sleep(3000)]); } catch {}
try { await Promise.race([browser.close().catch(() => {}), sleep(3000)]); } catch {}

const high = profiles.find(p => p.label === 'high') || { detail: {} };
const low = profiles.find(p => p.label === 'low') || { detail: {} };
const largestLow = profiles.find(p => p.label === 'largest-low') || { detail: {} };
const allPageErrors = profiles.flatMap(p => p.pageerrors || []);
const allTextureWarnings = profiles.flatMap(p => p.textureWarnings || []);
check('high profile launched and rendered nonblank', high.ok === true, high.detail && high.detail.error || '');
check('low profile launched and rendered nonblank', low.ok === true, low.detail && low.detail.error || '');
check('E68 largest low-tier profile launched and rendered nonblank', largestLow.ok === true, largestLow.detail && largestLow.detail.error || '');
check('E68 largest low-tier profile covers the configured scene and full opening OOB',
  largestLow.detail.scenario === largestScenario &&
  largestLow.detail.fldLow === true &&
  Number(largestLow.detail.units || 0) === Number(coverage.scenarios[largestScenario] && coverage.scenarios[largestScenario].units || 0),
  JSON.stringify({ configured: largestScenario, actual: largestLow.detail.scenario, units: largestLow.detail.units, expectedUnits: coverage.scenarios[largestScenario] && coverage.scenarios[largestScenario].units, fldLow: largestLow.detail.fldLow }));
check('low tier reports fldLow() true and high tier reports false', high.detail.fldLow === false && low.detail.fldLow === true, 'high=' + high.detail.fldLow + ' low=' + low.detail.fldLow);
check('low tier gates out formation figures and peg ranks', low.detail.ffOff === true && low.detail.unitRender && low.detail.unitRender.formationFigures !== true && low.detail.unitRender.pegsVisible !== true, JSON.stringify(low.detail.unitRender || {}));
check('high tier formation figures use one shared instanced layer',
  high.detail.unitRender &&
  high.detail.unitRender.formationFiguresMode === 'shared-instanced' &&
  high.detail.unitRender.formationFiguresVisible === true &&
  high.detail.unitRender.formationFigureLayerMeshes === 5,
  JSON.stringify(high.detail.unitRender || {}));
check('high tier formation figures do not keep hidden resident peg ranks',
  high.detail.unitRender &&
  high.detail.unitRender.formationFiguresMode === 'shared-instanced' &&
  high.detail.unitRender.pegs === false &&
  high.detail.unitRender.pegsVisible !== true,
  JSON.stringify(high.detail.unitRender || {}));
check('contact shadows use one shared instanced layer in high and low tiers',
  high.detail.unitRender && low.detail.unitRender &&
  high.detail.unitRender.shadowMode === 'instanced' && low.detail.unitRender.shadowMode === 'instanced' &&
  high.detail.unitRender.shadowIndex >= 0 && low.detail.unitRender.shadowIndex >= 0,
  JSON.stringify({ high: high.detail.unitRender, low: low.detail.unitRender }));
check('default hillshade profile does not prebuild optional terrain overlays',
  high.detail.terrainOverlay && low.detail.terrainOverlay &&
  high.detail.terrainOverlay.available === true && low.detail.terrainOverlay.available === true &&
  high.detail.terrainOverlay.hypExists === false && high.detail.terrainOverlay.contourExists === false &&
  low.detail.terrainOverlay.hypExists === false && low.detail.terrainOverlay.contourExists === false,
  JSON.stringify({ high: high.detail.terrainOverlay, low: low.detail.terrainOverlay }));
check('default idle selection rings are not resident in high and low profile scenes',
  high.detail.unitRender && low.detail.unitRender &&
  high.detail.unitRender.selectionRing !== true && low.detail.unitRender.selectionRing !== true &&
  high.detail.markerResources && low.detail.markerResources &&
  high.detail.markerResources.ringCount === 0 && low.detail.markerResources.ringCount === 0,
  JSON.stringify({ high: high.detail.unitRender, low: low.detail.unitRender, markerResources: { high: high.detail.markerResources, low: low.detail.markerResources } }));
check('base 3D unit markers share immutable geometry while low tier uses one shared body layer',
  high.detail.markerResources && low.detail.markerResources &&
  high.detail.markerResources.cache === true && low.detail.markerResources.cache === true &&
  high.detail.markerResources.slabCount < high.detail.units && high.detail.markerResources.frontCount < high.detail.units &&
  low.detail.markerResources.slabCount === 0 && low.detail.markerResources.frontCount === 0 &&
  low.detail.markerResources.bodyLayer === true &&
  low.detail.markerResources.bodyLayerVisible === true &&
  low.detail.markerResources.bodyLayerCount >= low.detail.units &&
  (high.detail.markerResources.slabGeoShared === true || high.detail.markerResources.slabGeoShared === null) && low.detail.markerResources.slabGeoShared === null &&
  (high.detail.markerResources.frontGeoShared === true || high.detail.markerResources.frontGeoShared === null) && low.detail.markerResources.frontGeoShared === null &&
  high.detail.markerResources.ringCount === 0 && low.detail.markerResources.ringCount === 0 &&
  high.detail.markerResources.ringGeoShared === null && low.detail.markerResources.ringGeoShared === null &&
  high.detail.markerResources.poleCount < high.detail.units && (high.detail.markerResources.poleGeoShared === true || high.detail.markerResources.poleGeoShared === null) &&
  low.detail.markerResources.poleCount === 0 &&
  low.detail.markerResources.poleLayer === true &&
  low.detail.markerResources.poleLayerVisible === true &&
  low.detail.markerResources.poleLayerCount >= low.detail.units &&
  low.detail.markerResources.poleGeoShared === null &&
  low.detail.markerResources.topperCount === 0 && low.detail.markerResources.topperGeoShared === null &&
  (high.detail.markerResources.frontMatShared === false || high.detail.markerResources.frontMatShared === null) && low.detail.markerResources.frontMatShared === null &&
  (high.detail.markerResources.poleMatShared === false || high.detail.markerResources.poleMatShared === null) && low.detail.markerResources.poleMatShared === null &&
  low.detail.markerResources.topperMatShared === null &&
  (high.detail.markerResources.slabMatShared === false || high.detail.markerResources.slabMatShared === null) && low.detail.markerResources.slabMatShared === null,
  JSON.stringify({ high: high.detail.markerResources, low: low.detail.markerResources }));
check('default high-tier formation figures omit hidden marker body/poles/toppers and low tier keeps shared fallback marker readability',
  high.detail.unitRender && low.detail.unitRender &&
  high.detail.unitRender.formationFiguresMode === 'shared-instanced' &&
  high.detail.unitRender.slab === false &&
  high.detail.unitRender.front === false &&
  high.detail.unitRender.pole === false &&
  high.detail.unitRender.topper === false &&
  high.detail.unitRender.flagVisible === true &&
  high.detail.markerResources && high.detail.markerResources.slabCount < high.detail.units &&
  high.detail.markerResources && high.detail.markerResources.frontCount < high.detail.units &&
  high.detail.markerResources && high.detail.markerResources.poleCount < high.detail.units &&
  high.detail.markerResources && high.detail.markerResources.topperCount < high.detail.units &&
  low.detail.unitRender.slab === false &&
  low.detail.unitRender.front === false &&
  low.detail.unitRender.bodyLayer === true &&
  low.detail.unitRender.bodyLayerVisible === true &&
  low.detail.unitRender.bodyLayerSlotActive === true &&
  low.detail.unitRender.pole === false &&
  low.detail.unitRender.poleLayer === true &&
  low.detail.unitRender.poleLayerVisible === true &&
  low.detail.unitRender.poleLayerSlotActive === true &&
  low.detail.unitRender.topper === false &&
  low.detail.unitRender.topperVisible === null &&
  low.detail.unitRender.flagVisible === true &&
  low.detail.markerResources &&
  low.detail.markerResources.poleCount === 0 &&
  low.detail.markerResources.poleLayer === true &&
  low.detail.markerResources.poleLayerVisible === true &&
  low.detail.markerResources.poleLayerCount >= low.detail.units,
  JSON.stringify({ high: high.detail.unitRender, low: low.detail.unitRender }));
function smokeDrawRangeOk(profile) {
  const d = profile.detail || {};
  const s = d.atmoSmokeAfterBurst || {};
  const ri = d.renderInfo || {};
  if (s.available !== true || s.pointsExists !== true) return false;
  const active = Number(s.activeParticles || 0);
  const buffer = Number(s.bufferCount || 0);
  const draw = Number(s.drawRangeCount || 0);
  return buffer > 0 &&
    draw === Math.min(active, buffer) &&
    (s.visible === (draw > 0)) &&
    Number(ri.points || 0) === draw;
}
check('T16 atmoSmoke draw range tracks active smoke particles in high and low profile scenes',
  smokeDrawRangeOk(high) && smokeDrawRangeOk(low),
  JSON.stringify({ high: high.detail.atmoSmokeAfterBurst || {}, low: low.detail.atmoSmokeAfterBurst || {}, renderPoints: { high: high.detail.renderInfo && high.detail.renderInfo.points, low: low.detail.renderInfo && low.detail.renderInfo.points } }));
check('low tier atmoSmoke renders no more than the low particle budget',
  low.detail.atmoSmokeAfterBurst && Number(low.detail.atmoSmokeAfterBurst.drawRangeCount || 0) <= 84,
  JSON.stringify(low.detail.atmoSmokeAfterBurst || {}));
check('low tier stays below hard render-call cap', Number(low.detail.renderInfo && low.detail.renderInfo.calls || 0) <= Number(budgets.lowTierRenderCallHardCap || 360), 'calls=' + (low.detail.renderInfo && low.detail.renderInfo.calls));
check('low tier stays below hard scene-object cap', Number(low.detail.sceneCounts && low.detail.sceneCounts.objects || 0) <= Number(budgets.lowTierObjectHardCap || 1400), 'objects=' + (low.detail.sceneCounts && low.detail.sceneCounts.objects));
check('E68 largest low tier keeps formation/marker fallbacks and smoke within the existing low-tier contract',
  largestLow.detail.ffOff === true &&
  largestLow.detail.unitRender && largestLow.detail.unitRender.formationFigures !== true && largestLow.detail.unitRender.pegsVisible !== true &&
  largestLow.detail.unitRender.bodyLayer === true && largestLow.detail.unitRender.bodyLayerVisible === true &&
  largestLow.detail.unitRender.poleLayer === true && largestLow.detail.unitRender.poleLayerVisible === true &&
  smokeDrawRangeOk(largestLow) && Number(largestLow.detail.atmoSmokeAfterBurst && largestLow.detail.atmoSmokeAfterBurst.drawRangeCount || 0) <= 84,
  JSON.stringify({ unitRender: largestLow.detail.unitRender || {}, smoke: largestLow.detail.atmoSmokeAfterBurst || {}, renderPoints: largestLow.detail.renderInfo && largestLow.detail.renderInfo.points }));
check('E68 largest low tier stays below the unchanged hard render-call cap',
  Number(largestLow.detail.renderInfo && largestLow.detail.renderInfo.calls || 0) <= Number(budgets.lowTierRenderCallHardCap || 360),
  'calls=' + (largestLow.detail.renderInfo && largestLow.detail.renderInfo.calls));
check('E68 largest low tier stays below the unchanged hard scene-object cap',
  Number(largestLow.detail.sceneCounts && largestLow.detail.sceneCounts.objects || 0) <= Number(budgets.lowTierObjectHardCap || 1400),
  'objects=' + (largestLow.detail.sceneCounts && largestLow.detail.sceneCounts.objects));
check('zero pageerrors across profile scenes', allPageErrors.length === 0, allPageErrors.slice(0, 3).join(' | '));
check('zero Three.js undefined-texture warnings', allTextureWarnings.length === 0, allTextureWarnings.slice(0, 3).join(' | '));

for (const p of profiles) {
  const d = p.detail || {};
  if (d.launchMs > Number(budgets.launchWarningMs || 8000)) warn(p.label + ' launch exceeded profile warning', d.launchMs + 'ms');
  if (d.frameBurst && d.frameBurst.avgMs > Number(budgets.proxyFrameWarningMs || 33.4)) warn(p.label + ' frame-burst proxy exceeded profile warning', d.frameBurst.avgMs + 'ms avg');
}
if (high.detail.webgl && /SwiftShader/i.test(String(high.detail.webgl.renderer || ''))) {
  warn('profile renderer is SwiftShader, so timing is a proxy rather than the exact Intel UHD-617 path', high.detail.webgl.renderer);
}
const expectedHighSharedFigures =
  high.detail.unitRender &&
  high.detail.unitRender.formationFiguresMode === 'shared-instanced' &&
  (high.detail.unitRender.slabVisible === false || high.detail.unitRender.slab === false) &&
  low.detail.unitRender &&
  low.detail.unitRender.bodyLayer === true &&
  low.detail.unitRender.bodyLayerVisible === true &&
  low.detail.unitRender.bodyLayerSlotActive === true;
if (low.detail.renderInfo && high.detail.renderInfo && low.detail.renderInfo.calls > high.detail.renderInfo.calls && !expectedHighSharedFigures) {
  warn('low tier render calls exceeded high tier; inspect before adding more visual layers', 'low=' + low.detail.renderInfo.calls + ' high=' + high.detail.renderInfo.calls);
}

const ok = steps.every(s => s.ok);
const out = {
  ok,
  generatedAt: new Date().toISOString(),
  targetHardware: perf.targetHardware,
  method: perf.method,
  budgets,
  coverage,
  warnings,
  passed: steps.filter(s => s.ok).length,
  total: steps.length,
  assets,
  browser: browserInfo,
  profiles,
  steps
};
writeFileSync(join(OUT, 'probe-intel-uhd617-profile.json'), JSON.stringify(out, null, 2));
console.log('probe-intel-uhd617-profile ok=' + ok + ' steps=' + out.passed + '/' + out.total + ' warnings=' + warnings.length);
for (const p of profiles) {
  const d = p.detail || {};
  const ri = d.renderInfo || {};
  const fb = d.frameBurst || {};
  console.log('  ' + p.label + ' scenario=' + (d.scenario || 'n/a') + ' quality=' + p.quality + ' launchMs=' + (d.launchMs ?? 'n/a') + ' avgFrameMs=' + (fb.avgMs ?? 'n/a') + ' calls=' + (ri.calls ?? 'n/a') + ' objects=' + (d.sceneCounts && d.sceneCounts.objects || 'n/a'));
}
for (const w of warnings) console.log('  WARN ' + w);
for (const s of steps) if (!s.ok) console.log('  FAIL ' + s.name + (s.detail ? ' :: ' + s.detail : ''));
if (!ok) process.exit(1);
