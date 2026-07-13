#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused probe for the local Tripo-compatible GLB unit asset bridge.

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
const canonicalPack = JSON.parse(readFileSync(join(ROOT, 'data', 'tripo-unit-assets.json'), 'utf8'));
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

function staticScan() {
  const mod = readFileSync(join(ROOT, 'src', 'tactical', 'T23-tripo-unit-assets.js'), 'utf8');
  const manifest = JSON.parse(readFileSync(join(ROOT, 'src', '00-manifest.json'), 'utf8'));
  const t22 = manifest.modules.indexOf('tactical/T22-terrain-readability.js');
  const t23 = manifest.modules.indexOf('tactical/T23-tripo-unit-assets.js');
  check('static: T23 is in manifest after T22 and before register modules', t23 > t22 && t23 >= 0, 'T22=' + t22 + ' T23=' + t23);
  check('static: runtime module contains no live Tripo/API/account calls', !/(fetch\s*\(|XMLHttpRequest|tripo3d\.ai|platform\.tripo|Authorization|api[-_ ]?key)/i.test(mod));
  check('static: runtime module does not reference sibling visual-layer internals', !/(fldRr|FLDRR|fldVf|FLDVF|fldTr[A-Z]|FLDTR)/.test(mod));
  check('static: canonical asset pack has the expected schema', canonicalPack.schema === 'cw_tripo_unit_assets_v1');
  check('static: canonical Tripo slots are disabled until local files + license proof land',
    Array.isArray(canonicalPack.records) && canonicalPack.records.length >= 8 && canonicalPack.records.every(r => r.enabled === false),
    'records=' + (canonicalPack.records || []).length);
  check('static: canonical Tripo slots require Ultra/detailed source quality',
    Array.isArray(canonicalPack.records) && canonicalPack.records.length >= 8 && canonicalPack.records.every(r =>
      r && r.generation &&
      r.generation.geometryQuality === 'detailed' &&
      r.generation.textureQuality === 'detailed' &&
      r.generation.pbr === true &&
      r.generation.smartLowPoly === true &&
      /\/tripo\/.*_ultra\.(glb|gltf)$/i.test(String(r.ultraSourcePath || ''))),
    'records=' + (canonicalPack.records || []).length);
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

function sceneScript(label, opts) {
  opts = opts || {};
  const canonical = JSON.stringify(canonicalPack);
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function tinyGltfDataUri(){
      var f = new Float32Array([
        -0.55, 0.00, -0.35,
         0.55, 0.00, -0.35,
         0.00, 1.10,  0.45
      ]);
      var u = new Uint8Array(f.buffer), s = "";
      for (var i=0;i<u.length;i++) s += String.fromCharCode(u[i]);
      var b64 = btoa(s);
      var gltf = {
        asset:{version:"2.0", generator:"probe-tripo-unit-assets"},
        buffers:[{uri:"data:application/octet-stream;base64," + b64, byteLength:u.length}],
        bufferViews:[{buffer:0, byteOffset:0, byteLength:u.length}],
        accessors:[{bufferView:0, componentType:5126, count:3, type:"VEC3", min:[-0.55,0,-0.35], max:[0.55,1.1,0.45]}],
        meshes:[{primitives:[{attributes:{POSITION:0}, mode:4}]}],
        nodes:[{mesh:0}],
        scenes:[{nodes:[0]}],
        scene:0
      };
      return "data:model/gltf+json;base64," + btoa(JSON.stringify(gltf));
    }
    function fixturePack(){
      return {
        schema:"cw_tripo_unit_assets_v1",
        version:1,
        policy:{runtimeMode:"local-files-only", maxRuntimeBytes:1500000, maxRuntimeVertices:20, maxRuntimeTriangles:10},
        records:[{
          id:"probe_unit_glb",
          label:"Probe unit glTF",
          enabled:true,
          side:"US",
          arm:"inf",
          runtimePath:tinyGltfDataUri(),
          targetHeight:36,
          rotationY:0,
          hideBaseMarker:true,
          generation:{provider:"tripo", modelVersion:"probe", geometryQuality:"standard", textureQuality:"standard", pbr:false, smartLowPoly:true, runtimeFaceLimit:10},
          license:{status:"clear", name:"probe fixture", attribution:"probe fixture", requiresAttribution:false, commercialUse:"not-applicable"}
        }]
      };
    }
    function firstUnit(){
      if (!__FIELD || !__FIELD.units || !__FIELD._u3d) return null;
      for (var i=0;i<__FIELD.units.length;i++) {
        var u = __FIELD.units[i];
        if (u && u.side === "US" && (u.arm === "inf" || !u.arm)) return u;
      }
      return __FIELD.units[0] || null;
    }
    function snapUnit(){
      var u = firstUnit();
      var g = u && __FIELD._u3d && __FIELD._u3d[u.id];
      if (!u || !g) return { found:false };
      var m = g.getObjectByName("unitGlbModel");
      var slab = g.getObjectByName("slab");
      var front = g.getObjectByName("front");
      var flag = g.getObjectByName("flag");
      var ring = g.getObjectByName("ring");
      var ff = g.getObjectByName("ffFormation");
      var bodySlabLayer = null;
      var bodyFrontLayer = null;
      try { if (typeof __FIELD !== "undefined" && __FIELD && __FIELD.scene) __FIELD.scene.traverse(function(o){ if (o && o.name === "markerBodySlabLayer") bodySlabLayer = o; if (o && o.name === "markerBodyFrontLayer") bodyFrontLayer = o; }); } catch(e){}
      var bodyLayerSlot = (g.userData && g.userData._markerBodySlot != null) ? g.userData._markerBodySlot : -1;
      var bodyLayerSlotActive = false;
      var formationLayerSlotActive = false;
      try {
        if (bodySlabLayer && bodyLayerSlot >= 0 && window.THREE) {
          var bodyMat = new window.THREE.Matrix4();
          bodySlabLayer.getMatrixAt(bodyLayerSlot, bodyMat);
          var bodyEl = bodyMat.elements || [];
          bodyLayerSlotActive = Math.abs(Number(bodyEl[0] || 0)) > 0.01 && Number(bodyEl[13] || -9999) > -1000;
        }
        var ffState = g.userData && g.userData._ff;
        if (ffState && ffState.layer && ffState.layer.body && ffState.slot >= 0 && window.THREE) {
          var ffMat = new window.THREE.Matrix4();
          ffState.layer.body.getMatrixAt(ffState.slot, ffMat);
          var ffEl = ffMat.elements || [];
          var ffScale = Math.sqrt(Math.pow(Number(ffEl[0] || 0), 2) + Math.pow(Number(ffEl[1] || 0), 2) + Math.pow(Number(ffEl[2] || 0), 2));
          formationLayerSlotActive = ffScale > 0.01 && Number(ffEl[13] || -9999) > -1000;
        }
      } catch(e) {}
      return {
        found:true,
        unitId:u.id,
        model:!!m,
        modelVisible:!!(m && m.visible),
        formationFigures:!!ff,
        formationFiguresVisible:!!(ff && ff.visible),
        slabVisible:slab ? slab.visible !== false : null,
        frontVisible:front ? front.visible !== false : null,
        bodyLayer:!!(bodySlabLayer && bodyFrontLayer),
        bodyLayerVisible:bodySlabLayer && bodyFrontLayer ? (bodySlabLayer.visible !== false && bodyFrontLayer.visible !== false) : null,
        bodyLayerSlotActive:bodyLayerSlotActive,
        formationLayerSlotActive:formationLayerSlotActive,
        flagVisible:flag ? flag.visible !== false : null,
        ringExists:!!ring,
        stats:(m && m.userData && m.userData.unitGlb && m.userData.unitGlb.stats) || null
      };
    }
    var out = { ok:false, label:${JSON.stringify(label)} };
    try {
      try { if (typeof fldExit === 'function' && typeof __FIELD !== 'undefined' && __FIELD && __FIELD.launched) fldExit(true); } catch(e){}
      await wait(120);
      GAME_DATA["tripo-unit-assets"] = ${opts.fixture ? 'fixturePack()' : canonical};
      G.settings = G.settings || {};
      G.settings.gfxQuality = ${JSON.stringify(opts.low ? 'low' : 'high')};
      G.settings.reduceMotion = false;
      if (${JSON.stringify(!!opts.off)}) G.settings.renderRich = 'off'; else { try { delete G.settings.renderRich; } catch(e){} }
      try { delete G.settings.unitGlbModels; } catch(e) {}

      out.wrappers = {
        build: typeof fld3dBuildUnits === 'function' && !!fld3dBuildUnits._unitGlb,
        sync: typeof fld3dSyncUnit === 'function' && !!fld3dSyncUnit._unitGlb,
        fns: ['fldUnitGlbOff','fldUnitGlbSlot','fldUnitGlbRequest','fldUnitGlbBuildUnits','fldUnitGlbSyncUnit'].every(function(n){ return eval('typeof '+n) === 'function'; })
      };
      fldLaunchSandbox({ renderer:'3d', autoBoth:true, playerSide:'US', seed:27 });
      for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
      if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }

      var attached = false;
      for (var f=0; f<90; f++) {
        fldRender();
        await wait(80);
        var su = snapUnit();
        if (su.model) { attached = true; break; }
      }
      out.unit = snapUnit();
      out.attached = attached;
      out.state = {
        off: (typeof fldUnitGlbOff === 'function') ? fldUnitGlbOff() : null,
        errN: (typeof FLDGLB_S !== 'undefined' && FLDGLB_S) ? FLDGLB_S.errN : -1,
        stats: (typeof FLDGLB_S !== 'undefined' && FLDGLB_S) ? FLDGLB_S.stats : null,
        failed: (typeof FLDGLB_S !== 'undefined' && FLDGLB_S) ? Object.keys(FLDGLB_S.failed || {}) : []
      };
      if (${JSON.stringify(!!opts.fixture && !opts.off && !opts.low)}) {
        var fu = firstUnit(), fg = fu && __FIELD._u3d && __FIELD._u3d[fu.id];
        G.settings.renderRich = 'off';
        if (fu && fg && typeof fld3dSyncUnit === 'function') fld3dSyncUnit(fu, fg);
        out.offCheck = { off:(typeof fldUnitGlbOff === 'function') ? fldUnitGlbOff() : null, unit:snapUnit() };
        try { delete G.settings.renderRich; } catch(e) {}
        G.settings.gfxQuality = 'low';
        if (fu && fg && typeof fld3dSyncUnit === 'function') fld3dSyncUnit(fu, fg);
        out.lowCheck = { off:(typeof fldUnitGlbOff === 'function') ? fldUnitGlbOff() : null, unit:snapUnit() };
      }
      out.ok = true;
    } catch(e) { out.error = String(e && e.message || e); }
    return out;
  })();`;
}

async function runScene(browser, label, opts) {
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(50000);
  const page = await ctx.newPage();
  const shared = { pe: [], con: [] };
  page.on('pageerror', e => shared.pe.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') shared.con.push('[' + m.type() + '] ' + m.text()); });
  let d = { ok: false, error: 'not run' };
  try {
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(350);
    d = await page.evaluate(sceneScript(label, opts));
    try { await page.screenshot({ path: join(OUT, 'tripo-unit-' + label + '.png') }); d.shot = 'tools/shots/tripo-unit-' + label + '.png'; } catch {}
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch {}
  return { label, detail: d, pageerrors: shared.pe, console: shared.con };
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));

  const scenes = [];
  try {
    scenes.push(await runScene(browser, 'canonical', {}));
    scenes.push(await runScene(browser, 'fixture', { fixture: true }));
  } finally {
    if (server) server.kill();
  }

  const by = {}; for (const s of scenes) by[s.label] = s.detail;
  const allPe = scenes.reduce((n, s) => n + s.pageerrors.length, 0);
  const C = by.canonical, F = by.fixture;

  check('runtime: wrappers and helper functions are installed', F.ok && F.wrappers && F.wrappers.build && F.wrappers.sync && F.wrappers.fns, JSON.stringify(F.wrappers || {}));
  check('canonical pack: disabled slots make no request and preserve the local fallback marker/formation',
    C.ok && C.unit && C.unit.found && C.unit.model === false && (C.unit.slabVisible === true || C.unit.bodyLayerSlotActive === true || C.unit.formationFiguresVisible === true) && C.state.stats.requested === 0,
    JSON.stringify({ unit: C.unit, stats: C.state && C.state.stats }));
  check('fixture pack: a local glTF model attaches to the infantry group',
    F.ok && F.unit && F.unit.model === true && F.unit.modelVisible === true && F.unit.stats && F.unit.stats.vertices === 3,
    JSON.stringify(F.unit || {}));
  check('fixture pack: hideBaseMarker hides every base representation but keeps flag and ring cues',
    F.ok && F.unit && F.unit.modelVisible === true && F.unit.formationFiguresVisible !== true && F.unit.formationLayerSlotActive !== true && F.unit.slabVisible !== true && F.unit.frontVisible !== true && F.unit.bodyLayerSlotActive !== true && F.unit.flagVisible === true && F.unit.ringExists === true,
    JSON.stringify(F.unit || {}));
  check('renderRich="off": GLB layer is disabled and base marker is restored',
    F.ok && F.offCheck && F.offCheck.off === true && F.offCheck.unit && F.offCheck.unit.modelVisible !== true && F.offCheck.unit.formationFiguresVisible !== true && F.offCheck.unit.slabVisible === true,
    JSON.stringify(F.offCheck || {}));
  check('low tier: GLB layer is disabled by default and base marker is restored',
    F.ok && F.lowCheck && F.lowCheck.off === true && F.lowCheck.unit && F.lowCheck.unit.modelVisible !== true && F.lowCheck.unit.formationFiguresVisible !== true && F.lowCheck.unit.slabVisible !== true && F.lowCheck.unit.bodyLayer === true && F.lowCheck.unit.bodyLayerVisible === true && F.lowCheck.unit.bodyLayerSlotActive === true,
    JSON.stringify(F.lowCheck || {}));
  check('runtime: no swallowed GLB-layer exceptions', F.ok && F.state.errN === 0, 'err=' + (F.state && F.state.errN));
  check('runtime: screenshots captured for canonical + fixture scenes',
    !!(C.shot && F.shot), [C.shot, F.shot].join(', '));
  check('runtime: zero pageerrors across scenes', allPe === 0, 'pageerrors=' + allPe + (allPe ? ' :: ' + scenes.flatMap(s => s.pageerrors).slice(0, 3).join(' | ') : ''));

  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), passed: steps.filter(s => s.ok).length, total: steps.length, steps, scenes };
  writeFileSync(join(OUT, 'probe-tripo-unit-assets.json'), JSON.stringify(out, null, 2));
  console.log('probe-tripo-unit-assets ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch {}
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
