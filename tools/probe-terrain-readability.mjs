#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-terrain-readability.mjs
// Focused probe for T22 modern-engine TERRAIN READABILITY (Phase H · H5-i3). Verifies, live:
//  - the module + its 5 by-assignment wrappers (fld3dInit/fld3dBuildTerrain/fld2dInit/fldPointerMove/fldExit)
//    are installed AND every prior marker (._wx/._atmo/._rr/._vf) is carried forward (the chain stays intact);
//  - THE 3 MODES render + the toggle reverts:
//      hillshade (default) -> 3D hyp + contour overlays BOTH hidden (only T21 relief; no double-count);
//      contours            -> a "vfTrContourLines" LineSegments (count>0) + elevation-label sprites are SHOWN;
//      color-by-height     -> a viridis "vfTrHyp" overlay SHOWN whose LOW vertex is darker than its HIGH vertex;
//      back to hillshade   -> both overlays hidden again (the toggle reverts to the default look);
//  - LEGEND + HOVER: a #fldElevLegend panel with the mode chip + gradient + key; the #fldElevHover readout
//    reports the right elevation + terrain TYPE for the hill / swamp / town / fort the sandbox carries;
//  - ALL TOPOGRAPHY DISTINCT: the swamp/town/fort decor group is built (decor3d children > 0) and the legend
//    key lists field/hill/woods/wall/swamp/town/fort; the new types are present in fldTrPresentTypes();
//  - CVD-safe: the viridis ramp is MONOTONIC in luminance low->high (information by luminance, never hue alone);
//  - BYTE-IDENTITY: the sim seed + a unit's mutable sim fields are INVARIANT across a render burst WITH mode
//    toggles (T22 never calls fldRng), FLDTR_S.errN===0, and a static scan proves the readability layer is still
//    render-only while swamp/town/fort sim effects stay confined to T0's universal cover/move hooks;
//  - 2D PARITY: the 2D top-down path runs the elevation render (errN===0) + shows the legend + hover;
//  - low tier trims the 3D labels; zero pageerrors; a screenshot is captured.
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
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

/* ---------- STATIC SCAN: presentation purity + universal terrain hooks ---------- */
function staticScan() {
  const tacDir = join(ROOT, 'src', 'tactical');
  const tacFiles = readdirSync(tacDir).filter(f => /\.js$/.test(f));
  const combatFiles = ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js'].map(f => join(ROOT, 'src', f));
  // 1. only T22 + the wiring seams (T0 render/hotkey/data, T6 drawer) may reference the readability layer.
  const layerLeaks = [];
  for (const f of tacFiles) {
    if (f === 'T22-terrain-readability.js' || f === 'T0-field-sandbox.js' || f === 'T6-presets.js') continue;
    let txt = ''; try { txt = readFileSync(join(tacDir, f), 'utf8'); } catch (e) { continue; }
    if (/fldTr[A-Z]|FLDTR|fldElevMode/.test(txt)) layerLeaks.push(f);
  }
  for (const f of combatFiles) { let txt = ''; try { txt = readFileSync(f, 'utf8'); } catch (e) { continue; } if (/fldTr[A-Z]|FLDTR|fldElevMode/.test(txt)) layerLeaks.push(f.replace(ROOT + '/', '')); }
  check('static-scan: no module beyond T22 + its UI seams (T0/T6) references the readability layer', layerLeaks.length === 0, layerLeaks.join(', '));
  // 2. swamp/town/fort arrays may be read only by T0's universal terrain hooks and T22's renderer.
  const decorLeaks = [];
  for (const f of tacFiles.concat(['58-terrain-cover.js'])) {
    const p = f.includes('/') || f.startsWith('5') ? join(ROOT, 'src', f) : join(tacDir, f);
    if (f === 'T22-terrain-readability.js' || f === 'T0-field-sandbox.js') continue;
    let txt = ''; try { txt = readFileSync(p, 'utf8'); } catch (e) { continue; }
    if (/\.swamps\b|\.towns\b|\.forts\b/.test(txt)) decorLeaks.push(f);
  }
  check('static-scan: swamp/town/fort sim reads are confined to T0 universal hooks; render reads stay in T22', decorLeaks.length === 0, decorLeaks.join(', '));
  let t0 = ''; try { t0 = readFileSync(join(tacDir, 'T0-field-sandbox.js'), 'utf8'); } catch (e) {}
  check('static-scan: T0 wires swamp/town/fort into universal cover + move hooks',
    /function\s+fldInSwamp\b/.test(t0) && /function\s+fldInTown\b/.test(t0) && /function\s+fldInFort\b/.test(t0) &&
    /function\s+fldCoverAt[\s\S]*fldInFort[\s\S]*fldInTown[\s\S]*fldInSwamp/.test(t0) &&
    /function\s+fldMoveFactor[\s\S]*fldInSwamp[\s\S]*fldInTown[\s\S]*fldInFort/.test(t0),
    'T0 terrain hook scan');
  // 3. T22 never calls fldRng + never bumps _SAVE_VER (presentation-only, no sim perturbation).
  let t22 = ''; try { t22 = readFileSync(join(tacDir, 'T22-terrain-readability.js'), 'utf8'); } catch (e) {}
  check('static-scan: T22 never calls fldRng + never writes _SAVE_VER', t22.length > 0 && !/fldRng\(/.test(t22) && !/_SAVE_VER\s*=/.test(t22));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

// opts: { low, twoD }
function sceneScript(seed, opts) {
  opts = opts || {};
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function lum(r,g,b){ return 0.299*r + 0.587*g + 0.114*b; }
    var out = { ok:false };
    try {
      try { if (typeof fldExit === 'function' && typeof __FIELD !== 'undefined' && __FIELD && __FIELD.launched) fldExit(true); } catch(e){}
      await wait(120);
      G.settings = G.settings || {};
      G.settings.gfxQuality = ${JSON.stringify(opts.low ? 'low' : 'high')};
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;
      G.settings.reduceMotion = false;
      try { delete G.settings.renderRich; } catch(e){}
      try { delete G.settings.fldElevMode; } catch(e){}                 // start at the DEFAULT (hillshade)

      out.wrappers = {
        init: typeof fld3dInit === 'function' && !!fld3dInit._tr,
        bt: typeof fld3dBuildTerrain === 'function' && !!fld3dBuildTerrain._tr,
        i2: typeof fld2dInit === 'function' && !!fld2dInit._tr,
        pm: typeof fldPointerMove === 'function' && !!fldPointerMove._tr,
        ex: typeof fldExit === 'function' && !!fldExit._tr,
        // prior markers must survive T22's outer re-wrap (the chain stays introspectable)
        chain: !!(fld3dBuildTerrain._vf && fld3dBuildTerrain._rr && fldExit._vf && fldExit._rr && fldExit._wx),
        fns: ['fldElevMode','fldCycleElevMode','fldTrBuild3d','fldTrUpdateHover','fldTrPresentTypes','fldTrDrawGround2d'].every(function(n){ return eval('typeof '+n) === 'function'; })
      };

      // viridis monotonic luminance (CVD-safe)
      var vl = [0,0.25,0.5,0.75,1].map(function(t){ var c=_fldTrViridis(t); return lum(c[0],c[1],c[2]); });
      out.viridisMono = vl[0]<vl[1] && vl[1]<vl[2] && vl[2]<vl[3] && vl[3]<vl[4];
      out.viridisLums = vl.map(function(x){return +x.toFixed(3);});

      var kind = ${JSON.stringify(opts.twoD ? '2d' : '3d')};
      fldLaunchSandbox({ renderer:kind, autoBoth:true, playerSide:'US', seed:${seed} });   // NO scenario -> sandbox (carries swamp/town/fort)
      if (kind === '3d') { for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100); if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind); }
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      for (var f = 0; f < 5; f++) { fldRender(); await wait(60); }

      // present-types + legend
      out.present = (typeof fldTrPresentTypes === 'function') ? fldTrPresentTypes() : {};
      var lg = document.getElementById('fldElevLegend');
      out.legend = { found: !!lg, mode: (document.getElementById('fldElevMode') ? document.getElementById('fldElevMode').textContent.trim() : null), hover: !!document.getElementById('fldElevHover') };

      // hover readout: the sandbox hill (600,450) high; swamp (250,150); town (960,700); fort (600,200)
      function readHover(x,z){ __FIELD.hover = { x:x, z:z }; if (typeof fldTrUpdateHover==='function') fldTrUpdateHover(); var el=document.getElementById('fldElevHover'); return el ? el.textContent.replace(/\\s+/g,' ').trim() : ''; }
      out.hover = { hill: readHover(600,450), swamp: readHover(250,150), town: readHover(960,700), fort: readHover(600,200), off: (function(){ __FIELD.hover=null; if (typeof fldTrUpdateHover==='function') fldTrUpdateHover(); var el=document.getElementById('fldElevHover'); return el?el.textContent.trim():''; })() };

      var su = (__FIELD.units && __FIELD.units[0]) ? __FIELD.units[0] : { side:'US' };
      out.simTerrain = {
        cover: {
          clear: fldCoverAt(80, 80),
          swamp: fldCoverAt(250, 150),
          town: fldCoverAt(960, 700),
          fort: fldCoverAt(600, 200)
        },
        move: {
          clear: fldMoveFactor(80, 80, su),
          swamp: fldMoveFactor(250, 150, su),
          town: fldMoveFactor(960, 700, su),
          fort: fldMoveFactor(600, 200, su)
        }
      };

      if (kind === '3d') {
        var T = window.THREE;
        function lineCount(grp){ var n=0; if(grp) grp.traverse(function(o){ if(o.name==='vfTrContourLines' && o.geometry && o.geometry.attributes.position) n=o.geometry.attributes.position.count; }); return n; }
        function labelCount(grp){ var n=0; if(grp) grp.traverse(function(o){ if(o.name==='vfTrLabel') n++; }); return n; }
        function decorCount(){ var g=FLDTR_S.decor3d, n=0; if(g) g.traverse(function(o){ if(o!==g) n++; }); return n; }
        // DEFAULT (hillshade): both overlays hidden
        out.hillshade = { hyp: !!(FLDTR_S.hyp3d && FLDTR_S.hyp3d.visible), con: !!(FLDTR_S.contour3d && FLDTR_S.contour3d.visible), hypExists: !!FLDTR_S.hyp3d, conExists: !!FLDTR_S.contour3d, decor: decorCount() };
        // CONTOURS
        fldSetElevMode('contours');
        out.contours = { conVisible: !!(FLDTR_S.contour3d && FLDTR_S.contour3d.visible), hypVisible: !!(FLDTR_S.hyp3d && FLDTR_S.hyp3d.visible), lines: lineCount(FLDTR_S.contour3d), labels: labelCount(FLDTR_S.contour3d) };
        // COLOR-BY-HEIGHT (hypsometric): low vertex darker than high vertex
        fldSetElevMode('hypsometric');
        var hm = FLDTR_S.hyp3d, hypLowLum=null, hypHiLum=null;
        if (hm && hm.geometry) { var pa=hm.geometry.attributes.position, ca=hm.geometry.attributes.color, loi=0,hii=0,loy=Infinity,hiy=-Infinity; for (var i=0;i<pa.count;i++){ var y=pa.getY(i); if(y<loy){loy=y;loi=i;} if(y>hiy){hiy=y;hii=i;} } hypLowLum=lum(ca.getX(loi),ca.getY(loi),ca.getZ(loi)); hypHiLum=lum(ca.getX(hii),ca.getY(hii),ca.getZ(hii)); }
        out.hypso = { hypVisible: !!(hm && hm.visible), conVisible: !!(FLDTR_S.contour3d && FLDTR_S.contour3d.visible), lowLum:hypLowLum, hiLum:hypHiLum, reads:(hypLowLum!=null && hypHiLum!=null && hypLowLum<hypHiLum) };
        // TOGGLE REVERTS: back to hillshade hides both overlays
        fldSetElevMode('hillshade');
        out.revert = { hyp: !!(FLDTR_S.hyp3d && FLDTR_S.hyp3d.visible), con: !!(FLDTR_S.contour3d && FLDTR_S.contour3d.visible) };
        // render each mode once for the screenshot + to exercise the draw paths
        fldSetElevMode('contours'); fldRender(); await wait(40);
        fldSetElevMode('hypsometric'); fldRender(); await wait(40);

        // BYTE-IDENTITY: a synchronous render burst WITH mode toggles must not perturb the sim
        __FIELD.paused = true;
        var su0 = (__FIELD.units && __FIELD.units[0]) ? __FIELD.units[0] : null;
        var snap0 = su0 ? [su0.x, su0.z, su0.men, su0.morale, su0.facing].join(',') : '';
        out.seedBefore = (__FIELD.seed >>> 0);
        for (var b=0;b<3;b++){ fldSetElevMode(FLDTR.MODES[b%3]); fld3dRender(); }
        out.seedAfter = (__FIELD.seed >>> 0);
        out.seedStable = (out.seedBefore === out.seedAfter);
        var snap1 = su0 ? [su0.x, su0.z, su0.men, su0.morale, su0.facing].join(',') : '';
        out.simStable = (snap0 === snap1);

        // TEARDOWN + RELAUNCH (lifecycle): fldExit must remove the legend + null the GPU overlays; a relaunch
        // must rebuild exactly ONE legend (no leak, no duplicate). (Closes the bug-hunt coverage gap.)
        fldExit(true); await wait(120);
        out.teardown = { legendGone: !document.getElementById('fldElevLegend'), overlaysNull: (FLDTR_S.hyp3d === null && FLDTR_S.contour3d === null && FLDTR_S.decor3d === null) };
        fldLaunchSandbox({ renderer:'3d', autoBoth:true, playerSide:'US', seed:${seed} });
        for (var w2 = 0; w2 < 160 && !(__FIELD.mode3d && __FIELD.renderer); w2++) await wait(100);
        if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
        fldRender(); await wait(40);
        out.teardown.legendCountAfterRelaunch = document.querySelectorAll('#fldElevLegend').length;

        // A11Y (bug-hunt 4.0): activating the mode chip rebuilds the legend innerHTML — focus must NOT drop to <body>
        var mb = document.getElementById('fldElevMode');
        if (mb) { mb.focus(); mb.click(); }
        out.focusRestored = !!(document.activeElement && document.activeElement.id === 'fldElevMode');

        // legend KEY refresh on a topography change (bug-hunt 5.0/5.1): remove the town, sync, the key must drop "Town"
        var keyHadTown = (document.getElementById('fldElevLegend').textContent.indexOf('Town') >= 0);
        var savedTowns = __FIELD.terrain.towns; __FIELD.terrain.towns = [];
        if (typeof fldTrSyncLegendKey === 'function') fldTrSyncLegendKey();
        var keyDroppedTown = (document.getElementById('fldElevLegend').textContent.indexOf('Town') < 0);
        __FIELD.terrain.towns = savedTowns; if (typeof fldTrSyncLegendKey === 'function') fldTrSyncLegendKey();
        var keyRestoredTown = (document.getElementById('fldElevLegend').textContent.indexOf('Town') >= 0);
        out.legendKeyLive = { hadTown: keyHadTown, droppedTown: keyDroppedTown, restoredTown: keyRestoredTown };
      } else {
        // 2D path: exercise the elevation render in each mode (no throw -> errN stays 0)
        for (var m=0;m<3;m++){ fldSetElevMode(FLDTR.MODES[m]); fld2dDraw(); }
        out.twoD = { shade: !!FLDTR_S.shadeCv, hyp: !!FLDTR_S.hypCv, contour: !!(FLDTR_S.contourPath && FLDTR_S.contourPath.segs && FLDTR_S.contourPath.segs.length) };
      }

      out.errN = (typeof FLDTR_S !== 'undefined' && FLDTR_S) ? FLDTR_S.errN : -1;
      out.ok = true;
    } catch (e) { out.ok = false; out.error = String(e && e.message || e); }
    return out;
  })();`;
}

async function runScene(page, label, seed, opts, shared) {
  const peStart = shared.pe.length;
  let d = { ok: false, error: 'not run' };
  try {
    d = await page.evaluate(sceneScript(seed, opts));
    try { await page.screenshot({ path: join(OUT, 'tr-' + label + '.png') }); d.shot = 'tools/shots/tr-' + label + '.png'; } catch (e) {}
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  return { label, detail: d, pageerrors: shared.pe.slice(peStart) };
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(45000);
  const page = await ctx.newPage();
  const shared = { pe: [] };
  page.on('pageerror', e => shared.pe.push(String(e.message)));
  const scenes = [];
  try {
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    scenes.push(await runScene(page, '3d', 7, {}, shared));
    scenes.push(await runScene(page, '2d', 7, { twoD: true }, shared));
    scenes.push(await runScene(page, 'low', 7, { low: true }, shared));
  } finally { if (server) server.kill(); }

  const byLabel = {}; for (const s of scenes) byLabel[s.label] = s;
  const allPe = scenes.reduce((a, s) => a + s.pageerrors.length, 0);
  const R = byLabel['3d'].detail, D2 = byLabel['2d'].detail, LO = byLabel['low'].detail;

  // wrappers + chain
  check('module + 5 by-assignment wrappers installed (prior ._wx/._atmo/._rr/._vf markers carried forward)',
    R.ok && R.wrappers && R.wrappers.init && R.wrappers.bt && R.wrappers.i2 && R.wrappers.pm && R.wrappers.ex && R.wrappers.chain && R.wrappers.fns, JSON.stringify(R.wrappers || {}));

  // 3 modes
  check('mode HILLSHADE (default): the hyp + contour overlays both EXIST but are HIDDEN (only T21 relief — no double-count)',
    R.ok && R.hillshade.hypExists && R.hillshade.conExists && R.hillshade.hyp === false && R.hillshade.con === false, JSON.stringify(R.hillshade || {}));
  check('mode CONTOURS: a "vfTrContourLines" LineSegments is SHOWN with vertices > 0 + elevation-label sprites',
    R.ok && R.contours.conVisible === true && R.contours.hypVisible === false && R.contours.lines > 0 && R.contours.labels > 0, JSON.stringify(R.contours || {}));
  check('mode COLOR-BY-HEIGHT: a viridis "vfTrHyp" overlay is SHOWN whose LOW vertex reads darker than its HIGH vertex',
    R.ok && R.hypso.hypVisible === true && R.hypso.conVisible === false && R.hypso.reads === true, 'lowLum=' + (R.hypso && R.hypso.lowLum && R.hypso.lowLum.toFixed(3)) + ' hiLum=' + (R.hypso && R.hypso.hiLum && R.hypso.hiLum.toFixed(3)));
  check('toggle REVERTS: back to hillshade hides BOTH overlays (the default look returns)',
    R.ok && R.revert.hyp === false && R.revert.con === false, JSON.stringify(R.revert || {}));

  // legend + hover
  check('legend: a #fldElevLegend panel with a mode chip + a hover readout slot is present',
    R.ok && R.legend.found && R.legend.hover && /Hillshade|Contours|Color/.test(R.legend.mode || ''), JSON.stringify(R.legend || {}));
  check('hover readout: HIGH ground (the hill crest) reports a positive elevation in yards',
    R.ok && /\+\d+\s*yd/.test(R.hover.hill) && /crest|rise/.test(R.hover.hill), R.hover && R.hover.hill);
  check('hover readout: terrain TYPE is named correctly over swamp / town / fort',
    R.ok && /Swamp/.test(R.hover.swamp) && /Town/.test(R.hover.town) && /Fort/.test(R.hover.fort), JSON.stringify({ s: R.hover && R.hover.swamp, t: R.hover && R.hover.town, f: R.hover && R.hover.fort }));
  check('hover readout: clears to the hint when the pointer leaves the field',
    R.ok && /hover the field/.test(R.hover.off), R.hover && R.hover.off);

  // topography distinct
  check('all topography distinct: the swamp/town/fort decor group is built (children > 0)', R.ok && R.hillshade.decor > 0, 'decorChildren=' + (R.hillshade && R.hillshade.decor));
  check('all topography distinct: the legend key lists field+hill+woods+wall+swamp+town+fort for this battle',
    R.ok && R.present.field && R.present.hill && R.present.woods && R.present.wall && R.present.swamp && R.present.town && R.present.fort, JSON.stringify(R.present || {}));
  check('H5-i4 sim hook: cover ladder now treats fort > town > swamp > clear through the universal fldCoverAt hook',
    R.ok && R.simTerrain && R.simTerrain.cover.clear === 1 && R.simTerrain.cover.swamp > R.simTerrain.cover.clear && R.simTerrain.cover.town > R.simTerrain.cover.swamp && R.simTerrain.cover.fort > R.simTerrain.cover.town,
    JSON.stringify(R.simTerrain && R.simTerrain.cover || {}));
  check('H5-i4 sim hook: movement now slows swamp, town, and fort through the universal fldMoveFactor hook',
    R.ok && R.simTerrain && R.simTerrain.move.clear === 1 && R.simTerrain.move.swamp < R.simTerrain.move.town && R.simTerrain.move.town < R.simTerrain.move.clear && R.simTerrain.move.fort < R.simTerrain.move.clear,
    JSON.stringify(R.simTerrain && R.simTerrain.move || {}));

  // CVD-safe
  check('CVD-safe: the viridis ramp is MONOTONIC in luminance low->high (read by luminance, not hue alone)', R.ok && R.viridisMono === true, JSON.stringify(R.viridisLums || []));

  // byte-identity
  check('byte-identity: sim seed UNCHANGED across a render burst WITH mode toggles (T22 never calls fldRng)', R.ok && R.seedStable === true, R.seedBefore + ' -> ' + R.seedAfter);
  check('byte-identity: a unit’s mutable sim fields (x/z/men/morale/facing) INVARIANT across the burst', R.ok && R.simStable === true, 'simStable=' + (R.ok && R.simStable));
  check('byte-identity: no swallowed exceptions in the 3D layer (FLDTR_S.errN === 0)', R.ok && R.errN === 0, 'errN=' + (R.ok && R.errN));

  // lifecycle: exit + relaunch
  check('lifecycle: fldExit removes the legend + nulls the GPU overlays; relaunch rebuilds exactly ONE legend (no leak/dup)',
    R.ok && R.teardown && R.teardown.legendGone === true && R.teardown.overlaysNull === true && R.teardown.legendCountAfterRelaunch === 1, JSON.stringify(R.teardown || {}));
  // a11y: focus restore on the legend mode chip (no drop to <body> on the innerHTML rebuild)
  check('a11y: activating the legend mode chip keeps keyboard focus on it (no drop to <body> on rebuild)', R.ok && R.focusRestored === true, 'focusRestored=' + (R.ok && R.focusRestored));
  // legend key stays LIVE with the topography (phase-advance staleness fix)
  check('legend key LIVE: a topography change (remove town) refreshes the key, and restoring it brings the row back',
    R.ok && R.legendKeyLive && R.legendKeyLive.hadTown && R.legendKeyLive.droppedTown && R.legendKeyLive.restoredTown, JSON.stringify(R.legendKeyLive || {}));

  // 2D parity
  check('2D parity: the elevation render runs in all 3 modes without error (legend + hover + caches)',
    D2.ok && D2.legend.found && D2.twoD && D2.twoD.shade && D2.twoD.hyp && D2.twoD.contour && D2.errN === 0, JSON.stringify({ twoD: D2.twoD, errN: D2.errN, legend: D2.legend && D2.legend.found }));
  check('2D parity: the hover readout names the swamp/town/fort types in the top-down view too',
    D2.ok && /Swamp/.test(D2.hover.swamp) && /Town/.test(D2.hover.town) && /Fort/.test(D2.hover.fort), JSON.stringify({ s: D2.hover && D2.hover.swamp, t: D2.hover && D2.hover.town }));

  // low tier
  check('low tier: contours still render but the 3D elevation LABELS are trimmed out (UHD-617 floor)',
    LO.ok && LO.contours.lines > 0 && LO.contours.labels === 0 && LO.errN === 0, JSON.stringify({ lines: LO.contours && LO.contours.lines, labels: LO.contours && LO.contours.labels, errN: LO.errN }));

  // health
  check('a screenshot was captured for visual confirmation', !!byLabel['3d'].detail.shot, byLabel['3d'].detail.shot || '');
  check('zero pageerrors across all scenes', allPe === 0, 'pageerrors=' + allPe + (allPe ? ' :: ' + scenes.flatMap(s => s.pageerrors).slice(0, 3).join(' | ') : ''));

  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), passed: steps.filter(s => s.ok).length, total: steps.length, steps, scenes };
  writeFileSync(join(OUT, 'probe-terrain-readability.json'), JSON.stringify(out, null, 2));
  console.log('probe-terrain-readability ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
