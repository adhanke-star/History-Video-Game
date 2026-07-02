#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused probe for T24 formation figures: procedural miniature infantry ranks.

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
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

function staticScan() {
  const modPath = join(ROOT, 'src', 'tactical', 'T24-formation-figures.js');
  const mod = readFileSync(modPath, 'utf8');
  const manifest = JSON.parse(readFileSync(join(ROOT, 'src', '00-manifest.json'), 'utf8'));
  const t23 = manifest.modules.indexOf('tactical/T23-tripo-unit-assets.js');
  const t24 = manifest.modules.indexOf('tactical/T24-formation-figures.js');
  const reg = manifest.modules.indexOf('90-president-register.js');
  check('static: T24 is in manifest after T23 and before register modules', t24 > t23 && t24 < reg, 'T23=' + t23 + ' T24=' + t24 + ' register=' + reg);
  check('static: T24 contains no remote asset/API/account calls', !/(fetch\s*\(|XMLHttpRequest|tripo3d\.ai|platform\.tripo|Authorization|api[-_ ]?key)/i.test(mod));
  check('static: T24 never calls fldRng and never writes _SAVE_VER', !/fldRng\s*\(/.test(mod) && !/_SAVE_VER\s*=/.test(mod));

  const tacDir = join(ROOT, 'src', 'tactical');
  // T0/T21 are adjacent presentation layers: they may ask T24 whether formation figures will replace the slab so
  // they can skip hidden fallback marker/peg meshes. The scan still forbids combat/sim sibling leakage.
  const SCAN_SKIP = ['T24-formation-figures.js', 'T21-visual-fidelity.js', 'T0-field-sandbox.js'];
  const files = readdirSync(tacDir).filter(f => /\.js$/.test(f) && SCAN_SKIP.indexOf(f) < 0);
  const leaks = [];
  for (const f of files) {
    const txt = readFileSync(join(tacDir, f), 'utf8');
    if (/fldFf|FLDFF/.test(txt)) leaks.push('src/tactical/' + f);
  }
  check('static: no combat/sim sibling tactical file references the formation-figures layer', leaks.length === 0, leaks.join(', '));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 90; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

async function launchProbeBrowser() {
  return chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
}

function sceneScript(label, opts) {
  opts = opts || {};
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function firstInf(){
      if (!__FIELD || !__FIELD.units) return null;
      for (var i=0;i<__FIELD.units.length;i++) {
        var u = __FIELD.units[i];
        var a = String((u && (u.arm || u.type)) || "inf").toLowerCase();
        if (u && u.alive && (a === "inf" || a === "infantry")) return u;
      }
      return null;
    }
    function firstEnemy(u){
      if (!u || !__FIELD || !__FIELD.units) return null;
      for (var i=0;i<__FIELD.units.length;i++) { var e = __FIELD.units[i]; if (e && e.alive && e.side !== u.side) return e; }
      return null;
    }
    function snap(){
      var u = firstInf();
      var g = u && __FIELD._u3d && __FIELD._u3d[u.id];
      if (!u || !g) return { found:false };
      var ff = g.getObjectByName("ffFormation");
      var meta = (ff && ff.userData && ff.userData.ff) || {};
      var layer = (typeof __FIELD !== "undefined" && __FIELD && __FIELD._ffLayer) || null;
      var bodies = layer && layer.body;
      var heads = layer && layer.head;
      var rifles = layer && layer.rifle;
      var bay = layer && layer.bayonet;
      var slab = g.getObjectByName("slab");
      var front = g.getObjectByName("front");
      var flag = g.getObjectByName("flag");
      var pole = g.getObjectByName("pole");
      var topper = g.getObjectByName("topper");
      var pegs = g.getObjectByName("vfPegs");
      var bodySlabLayer = null;
      var bodyFrontLayer = null;
      try { if (typeof __FIELD !== "undefined" && __FIELD && __FIELD.scene) __FIELD.scene.traverse(function(o){ if (o && o.name === "markerBodySlabLayer") bodySlabLayer = o; if (o && o.name === "markerBodyFrontLayer") bodyFrontLayer = o; }); } catch(e){}
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
      try { if (typeof __FIELD !== "undefined" && __FIELD && __FIELD.scene) __FIELD.scene.traverse(function(o){ if (o && o.name === "markerPoleLayer") poleLayer = o; }); } catch(e){}
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
      return {
        found:true,
        unitId:u.id,
        formation:u.formation,
        pose:ff && ff.userData && ff.userData.ff ? ff.userData.ff.pose : null,
        mode:meta.mode || null,
        slot:meta.slot == null ? -1 : meta.slot,
        layer:!!layer,
        layerMeshCount:layer && layer.grp && layer.grp.children ? layer.grp.children.length : 0,
        layerCount:layer ? layer.nextSlot : 0,
        ff:!!ff,
        ffVisible:!!(ff && ff.visible),
        active:meta.active || 0,
        width:meta.width || 0,
        depth:meta.depth || 0,
        bodies:!!bodies,
        heads:!!heads,
        rifles:!!rifles,
        bayonets:!!bay,
        bodyCount:bodies ? (meta.active || 0) : 0,
        headCount:heads ? (meta.active || 0) : 0,
        rifleCount:rifles ? (meta.active || 0) : 0,
        bayonetCount:bay ? (meta.active || 0) : 0,
        layerDrawCount:bodies ? bodies.count : 0,
        slab:!!slab,
        slabVisible:slab ? slab.visible !== false : null,
        front:!!front,
        frontVisible:front ? front.visible !== false : null,
        flagVisible:flag ? flag.visible !== false : null,
        bodyLayer:!!(bodySlabLayer && bodyFrontLayer),
        bodyLayerVisible:bodySlabLayer && bodyFrontLayer ? (bodySlabLayer.visible !== false && bodyFrontLayer.visible !== false) : null,
        bodyLayerCount:bodySlabLayer ? bodySlabLayer.count : 0,
        bodyLayerSlot:bodyLayerSlot,
        bodyLayerSlotActive:bodyLayerSlotActive,
        pole:!!pole,
        poleVisible:pole ? pole.visible !== false : null,
        poleLayer:!!poleLayer,
        poleLayerVisible:poleLayer ? poleLayer.visible !== false : null,
        poleLayerCount:poleLayer ? poleLayer.count : 0,
        poleLayerSlot:poleLayerSlot,
        poleLayerSlotActive:poleLayerSlotActive,
        topper:!!topper,
        topperVisible:topper ? topper.visible !== false : null,
        pegsResident:!!pegs,
        pegsVisible:pegs ? pegs.visible !== false : null
      };
    }
    function simSnap(){
      var a = [];
      for (var i=0;i<__FIELD.units.length;i++) { var u=__FIELD.units[i]; a.push([u.id,u.x,u.z,u.men,u.morale,u.facing,u.formation,u.state,u.targetId,u.order&&u.order.type].join(",")); }
      return a.join("|");
    }
    var out = { ok:false, label:${JSON.stringify(label)} };
    try {
      try { if (typeof fldExit === 'function' && typeof __FIELD !== 'undefined' && __FIELD && __FIELD.launched) fldExit(true); } catch(e){}
      await wait(120);
      G.settings = G.settings || {};
      G.settings.gfxQuality = ${JSON.stringify(opts.low ? 'low' : 'high')};
      G.settings.reduceMotion = false;
      if (${JSON.stringify(!!opts.off)}) G.settings.renderRich = 'off'; else { try { delete G.settings.renderRich; } catch(e){} }
      try { delete G.settings.formationFigures; } catch(e) {}

      out.wrappers = {
        build: typeof fld3dBuildUnits === 'function' && !!fld3dBuildUnits._ff,
        sync: typeof fld3dSyncUnit === 'function' && !!fld3dSyncUnit._ff,
        exit: typeof fldExit === 'function' && !!fldExit._ff,
        fns: ['fldFfOff','fldFfShowFor','fldFfEnsure','fldFfSyncUnit','fldFfLayer'].every(function(n){ return eval('typeof '+n) === 'function'; })
      };

      fldLaunchSandbox({ renderer:'3d', scenario:'shiloh', autoBoth:true, playerSide:'US', seed:39 });
      for (var w=0; w<200 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
      if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      for (var f=0; f<8; f++) { fldRender(); await wait(80); }
      out.initial = snap();

      var u = firstInf(), e = firstEnemy(u), g = u && __FIELD._u3d && __FIELD._u3d[u.id];
      if (u && e && g && !${JSON.stringify(!!opts.off || !!opts.low)}) {
        u.formation = 'column'; u.order = { type:'move', tx:u.x, tz:u.z - 100, tface:u.facing }; u.targetId = null;
        fld3dSyncUnit(u, g); out.column = snap();
        u.formation = 'line'; u.order = { type:'hold', tx:u.x, tz:u.z, tface:u.facing }; u.targetId = e.id;
        fld3dSyncUnit(u, g); out.firing = snap();
        u.targetId = null; u.order = { type:'charge', tx:e.x, tz:e.z, tface:u.facing };
        fld3dSyncUnit(u, g); out.charge = snap();
        u.order = { type:'hold', tx:u.x, tz:u.z, tface:u.facing }; u.targetId = null;
        fld3dSyncUnit(u, g);
      }

      __FIELD.paused = true;
      var seed0 = __FIELD.seed >>> 0, ss0 = simSnap();
      for (var b=0; b<60; b++) fld3dRender();
      out.seedStable = (seed0 === (__FIELD.seed >>> 0));
      out.simStable = (ss0 === simSnap());
      out.errN = (typeof FLDFF_S !== 'undefined' && FLDFF_S) ? FLDFF_S.errN : -1;
      out.off = (typeof fldFfOff === 'function') ? fldFfOff() : null;
      out.ok = true;
    } catch(e) { out.error = String(e && e.message || e); }
    return out;
  })();`;
}

async function runScene(label, opts) {
  const browser = await launchProbeBrowser();
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(60000);
  const page = await ctx.newPage();
  const shared = { pe: [], con: [] };
  page.on('pageerror', e => shared.pe.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') shared.con.push('[' + m.type() + '] ' + m.text()); });
  let d = { ok: false, error: 'not run' };
  try {
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(400);
    d = await page.evaluate(sceneScript(label, opts));
    try { await page.screenshot({ path: join(OUT, 'formation-figures-' + label + '.png'), timeout: 120000 }); d.shot = 'tools/shots/formation-figures-' + label + '.png'; } catch {}
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  try { await Promise.race([ctx.close().catch(() => {}), sleep(3000)]); } catch {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(3000)]); } catch {}
  return { label, detail: d, pageerrors: shared.pe, console: shared.con };
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const scenes = [];
  try {
    scenes.push(await runScene('high', {}));
    scenes.push(await runScene('off', { off: true }));
    scenes.push(await runScene('low', { low: true }));
  } finally {
    if (server) server.kill();
  }

  const by = {}; for (const s of scenes) by[s.label] = s.detail;
  const allPe = scenes.reduce((n, s) => n + s.pageerrors.length, 0);
  const H = by.high, OFF = by.off, LOW = by.low;

  check('runtime: wrappers and helper functions are installed', H.ok && H.wrappers && H.wrappers.build && H.wrappers.sync && H.wrappers.exit && H.wrappers.fns, JSON.stringify(H.wrappers || {}));
  check('high tier: formation figures use one shared scene-level instanced layer',
    H.ok && H.initial && H.initial.mode === 'shared-instanced' && H.initial.layer === true && H.initial.layerMeshCount === 5 && H.initial.slot >= 0,
    JSON.stringify(H.initial || {}));
  check('high tier: infantry group gains visible procedural formation figures',
    H.ok && H.initial && H.initial.ffVisible && H.initial.active >= 10 && H.initial.bodies && H.initial.heads && H.initial.rifles && H.initial.bayonets,
    JSON.stringify(H.initial || {}));
  check('high tier: figures replace the slab/front/pole/topper without hidden resident marker body while preserving flag cue',
    H.ok && H.initial && H.initial.slab === false && H.initial.front === false && H.initial.slabVisible === null && H.initial.frontVisible === null && H.initial.pole === false && H.initial.topper === false && H.initial.flagVisible === true,
    JSON.stringify(H.initial || {}));
  check('high tier: T21 peg ranks are not resident when richer figures replace the slab',
    H.ok && H.initial && H.initial.pegsResident === false && H.initial.pegsVisible !== true,
    'pegsResident=' + (H.initial && H.initial.pegsResident) + ' pegsVisible=' + (H.initial && H.initial.pegsVisible));
  check('line formation reads wide; column formation reads deep',
    H.ok && H.initial && H.column && H.initial.width > H.initial.depth * 1.8 && H.column.depth > H.column.width * 1.35,
    'line=' + JSON.stringify({ w:H.initial && H.initial.width, d:H.initial && H.initial.depth }) + ' column=' + JSON.stringify({ w:H.column && H.column.width, d:H.column && H.column.depth }));
  check('pose state: targetId switches the figure layer to firing pose',
    H.ok && H.firing && H.firing.pose === 'firing' && H.firing.rifleCount === H.firing.active,
    JSON.stringify(H.firing || {}));
  check('pose state: charge order switches to charge pose with bayonets active',
    H.ok && H.charge && H.charge.pose === 'charge' && H.charge.bayonetCount === H.charge.active,
    JSON.stringify(H.charge || {}));
  check('byte-identity: synchronous render burst leaves seed and mutable unit fields unchanged',
    H.ok && H.seedStable === true && H.simStable === true && H.errN === 0,
    JSON.stringify({ seedStable:H.seedStable, simStable:H.simStable, errN:H.errN }));
  check('renderRich="off": formation figures are gated out and the slab fallback remains',
    OFF.ok && OFF.off === true && OFF.initial && OFF.initial.ff !== true && OFF.initial.slabVisible === true && OFF.initial.pole === true && OFF.initial.poleVisible === true && OFF.initial.topper === true && OFF.initial.topperVisible === true,
    JSON.stringify(OFF.initial || {}));
  check('low tier: formation figures are gated out and the shared slab/front fallback keeps a shared pole cue',
    LOW.ok && LOW.off === true && LOW.initial && LOW.initial.ff !== true && LOW.initial.slab === false && LOW.initial.front === false && LOW.initial.bodyLayer === true && LOW.initial.bodyLayerVisible === true && LOW.initial.bodyLayerSlotActive === true && LOW.initial.pole === false && LOW.initial.poleLayer === true && LOW.initial.poleLayerVisible === true && LOW.initial.poleLayerSlotActive === true && LOW.initial.topper === false,
    JSON.stringify(LOW.initial || {}));
  check('a screenshot was captured for visual confirmation', !!(H && H.shot), H && H.shot);
  check('zero pageerrors across all scenes', allPe === 0, 'pageerrors=' + allPe + (allPe ? ' :: ' + scenes.flatMap(s => s.pageerrors).slice(0, 3).join(' | ') : ''));

  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), passed: steps.filter(s => s.ok).length, total: steps.length, steps, scenes };
  writeFileSync(join(OUT, 'probe-formation-figures.json'), JSON.stringify(out, null, 2));
  console.log('probe-formation-figures ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
