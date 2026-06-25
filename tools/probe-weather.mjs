#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-weather.mjs
// Focused probe for T17 weather + time-of-day atmosphere (Phase H · H3-i2). Verifies:
//  - the module + the four by-assignment wrappers (fld3dInit/fld3dRender/fld2dDraw/fldExit) are installed;
//  - the BYTE-IDENTICAL DEFAULT: weather="off" (or no hint) -> resolve null -> the scene keeps the engine
//    default background "#acc2d6" (no tint), no precipitation;
//  - each sky palette APPLIES to the live 3D scene (background/fog/sun re-tinted) via synthetic injection;
//  - rain/snow build the named "wxPrecip" THREE.Points cloud with NO texture warning;
//  - reduceMotion SUPPRESSES precipitation but KEEPS the static tint (faithful + accessible);
//  - the sim RNG (__FIELD.seed) is UNCHANGED across pure render frames (wx uses its own LCG, never fldRng);
//  - a static scan proves NO combat-execution file references the wx layer, and T17 never calls fldRng;
//  - the REAL scenario data carries citation-grade weather hints (valid enums + >=1 source + provenance),
//    and a hinted battle actually re-tints the live scene (real-data wiring).
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
const SKY_ENUM = ['clear', 'overcast', 'rain', 'fog', 'haze', 'snow'];
const TIME_ENUM = ['dawn', 'morning', 'midday', 'afternoon', 'dusk'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

/* ---------- 1) STATIC SCAN: combat purity + citation-grade real-data hints ---------- */
const realHints = [];   // {file, battleKey, weather}
function staticScan() {
  const tacDir = join(ROOT, 'src', 'tactical');
  const files = readdirSync(tacDir).filter(f => /\.js$/.test(f) && f !== 'T17-weather.js');
  const combatExtra = ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js'].map(f => join(ROOT, 'src', f));
  const all = files.map(f => join(tacDir, f)).concat(combatExtra);
  const leaks = [];
  for (const f of all) {
    let txt = ''; try { txt = readFileSync(f, 'utf8'); } catch (e) { continue; }
    if (/fldWx|FLDWX/.test(txt)) leaks.push(f.replace(ROOT + '/', ''));
  }
  check('static-scan: no combat/tactical file references the wx layer', leaks.length === 0, leaks.join(', '));
  let t17 = ''; try { t17 = readFileSync(join(tacDir, 'T17-weather.js'), 'utf8'); } catch (e) {}
  check('static-scan: T17 never calls fldRng (uses its own LCG)', t17.length > 0 && !/fldRng\(/.test(t17));

  // citation-grade real hints in the scenario data
  const dataDir = join(ROOT, 'data');
  const jsons = readdirSync(dataDir).filter(f => /\.json$/.test(f));
  const invalid = [];
  for (const f of jsons) {
    let obj; try { obj = JSON.parse(readFileSync(join(dataDir, f), 'utf8')); } catch (e) { continue; }
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (v && typeof v === 'object' && v.weather && typeof v.weather === 'object') {
        const w = v.weather;
        const ok = SKY_ENUM.includes(String(w.sky)) && TIME_ENUM.includes(String(w.time)) &&
          typeof w.note === 'string' && Array.isArray(w.sources) && w.sources.length >= 1 &&
          (w.provenance === 'Verified' || w.provenance === 'Inferred');
        if (!ok) invalid.push(f + ':' + k);
        else realHints.push({ file: f, key: k, weather: w });
      }
    }
  }
  check('real-data: >= 3 shipped battles carry a structured weather hint', realHints.length >= 3, 'hinted=' + realHints.length + ' [' + realHints.map(h => h.key).join(',') + ']');
  check('real-data: every weather hint is well-formed (enum sky/time, >=1 source, provenance)', invalid.length === 0, invalid.join(', '));
  // at least one hint must be non-default (resolves to a real tint), else nothing is visible
  const nonDefault = realHints.filter(h => !(h.weather.sky === 'clear' && h.weather.time === 'midday'));
  check('real-data: >= 1 hint is non-default (clear/midday is a no-op)', nonDefault.length >= 1, 'nonDefault=' + nonDefault.length);
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

// renderer always 3d here (except the explicit 2d scene). `inject` = a {sky,time} synthetic hint or null;
// `real` = launch and read the scenario's OWN data hint (no injection); `off` sets weather="off".
function sceneScript(scenario, seed, opts) {
  opts = opts || {};
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    try {
      try { if (typeof fldExit === 'function' && typeof __FIELD !== 'undefined' && __FIELD && __FIELD.launched) fldExit(true); } catch(e){}
      await wait(120);
      G.settings = G.settings || {};
      G.settings.gfxQuality = 'high';
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;
      G.settings.reduceMotion = ${opts.rm ? 'true' : 'false'};
      if (${JSON.stringify(!!opts.off)}) G.settings.weather = 'off'; else { try { delete G.settings.weather; } catch(e){} }
      var wrappers = {
        i3: typeof fld3dInit === 'function' && !!fld3dInit._wx,
        r3: typeof fld3dRender === 'function' && !!fld3dRender._wx,
        d2: typeof fld2dDraw === 'function' && !!fld2dDraw._wx,
        ex: typeof fldExit === 'function' && !!fldExit._wx,
        fns: ['fldWxResolve','fldWxApply3d','fldWxPre3d','fldWxDraw2d','fldWxDispose'].every(function(n){ return eval('typeof '+n) === 'function'; })
      };
      fldLaunchSandbox({ renderer:${JSON.stringify(opts.r2d ? '2d' : '3d')}, scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      if (!${JSON.stringify(!!opts.r2d)}) {
        for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
        if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      }
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }

      var inj = ${JSON.stringify(opts.inject || null)};
      if (inj) {
        // inject onto a SHALLOW COPY (not the shared GAME_DATA object) so one scene never pollutes the
        // pristine weather another scene relies on (e.g. the note-once scene reads shiloh's real hint).
        __FIELD.scenData = Object.assign({}, __FIELD.scenData, { weather: inj });   // resolve reads _scenTop first, then scenData
        __FIELD._scenTop = null;
      }
      // default palette values straight from the page (no hardcoding in the probe)
      var SKY = (typeof FLDWX !== 'undefined' && FLDWX.SKY) ? FLDWX.SKY : null;
      var defaultBg = SKY ? SKY.clear.bg.replace('#','').toLowerCase() : 'acc2d6';

      var resolved = (typeof fldWxResolve === 'function') ? fldWxResolve() : null;
      // re-apply the 3D tint with the (possibly injected) weather
      if (typeof fldWxApply3d === 'function') fldWxApply3d();

      // drive the real render path a few frames (builds/updates precip, paints 2D, fires the note)
      for (var f = 0; f < 5; f++) { fldRender(); await wait(60); }
      // RNG-ISOLATION (combat byte-identity lock): run the wx compute/render path SYNCHRONOUSLY — no await,
      // so the live RAF sim loop cannot interleave on single-threaded JS — and assert the sim seed is untouched.
      // fldWxPre3d drives the precip LCG (fldWxRnd) hundreds of times here; if any call reached fldRng the
      // sim seed (__FIELD.seed) would move. (await-gated frames would let the RAF sim tick it — a false fail.)
      var seedBefore = __FIELD.seed;
      for (var s2 = 0; s2 < 220; s2++) {
        if (typeof fldWxPre3d === 'function') fldWxPre3d();
        if (typeof fldWxApply3d === 'function') fldWxApply3d();
        if (typeof fldWxDraw2d === 'function' && __FIELD.ctx2d) { try { fldWxDraw2d(__FIELD.ctx2d, fld2dView()); } catch(e){} }
      }
      var seedAfter = __FIELD.seed;

      var bgHex = null, fogNear = null, fogFar = null, sunI = null, hemiI = null;
      if (__FIELD.scene) {
        if (__FIELD.scene.background && __FIELD.scene.background.getHexString) bgHex = __FIELD.scene.background.getHexString().toLowerCase();
        if (__FIELD.scene.fog) { fogNear = __FIELD.scene.fog.near; fogFar = __FIELD.scene.fog.far; }
        __FIELD.scene.traverse(function(o){ if (o.isDirectionalLight) sunI = o.intensity; else if (o.isHemisphereLight) hemiI = o.intensity; });
      }
      var precip = null, ptsCount = -1, maxPtUniform = -1, glCap = -1;
      if (__FIELD.scene && __FIELD.scene.getObjectByName) {
        var pp = __FIELD.scene.getObjectByName('wxPrecip');
        precip = !!pp;
        if (pp && pp.geometry && pp.geometry.attributes && pp.geometry.attributes.aAlpha) ptsCount = pp.geometry.attributes.aAlpha.count;
        try { if (pp && pp.material && pp.material.uniforms && pp.material.uniforms.uMaxPoint) maxPtUniform = pp.material.uniforms.uMaxPoint.value; } catch(e) {}
      }
      try { var glx = __FIELD.renderer.getContext(); var rr = glx.getParameter(glx.ALIASED_POINT_SIZE_RANGE); glCap = rr && rr[1]; } catch(e) {}

      // expected default-sky bg for the resolved sky (for the apply-assertion), read from the page
      var expectBgForSky = null;
      if (resolved && SKY && SKY[resolved.sky]) expectBgForSky = SKY[resolved.sky].bg.replace('#','').toLowerCase();

      // NOTE RE-FIRE GUARD: reset the note state, then render several frames while the live sim ticks (so the
      // sim seed MUTATES between frames). A correct once-per-launch note creates exactly ONE weather banner;
      // the seed-keyed bug re-fired one banner PER FRAME (we count only banners whose text === the weather note,
      // so reinforcement banners don't pollute the count).
      var noteBanners = -1;
      if (${JSON.stringify(!!opts.noteTest)}) {
        try {
          var rootEl = document.getElementById('fldRoot');
          if (rootEl && resolved && resolved.note) {
            var ex = rootEl.querySelectorAll('.fldBanner'); for (var q = 0; q < ex.length; q++) ex[q].remove();
            if (typeof FLDWX_S !== 'undefined' && FLDWX_S) { FLDWX_S.launchKey = null; FLDWX_S.noted = false; }
            for (var nf = 0; nf < 6; nf++) { fldRender(); await wait(70); }
            var all = rootEl.querySelectorAll('.fldBanner'); noteBanners = 0;
            for (var ai = 0; ai < all.length; ai++) { if (all[ai].textContent === resolved.note) noteBanners++; }
          }
        } catch (e) {}
      }

      // MALFORMED-INPUT SAFETY: a garbage hint (inherited-property names, missing fields) must NOT throw and must
      // degrade to a safe default (unknown sky -> clear; clear/midday -> null). A partial hint keeps its valid sky.
      var malformed = null;
      if (${JSON.stringify(!!opts.malformedTest)}) {
        try {
          try { delete G.settings.weather; } catch(e){}   // ensure the layer is ON so the sky validator (not the off-gate) is what's exercised
          // shallow copies (never the shared GAME_DATA object) so this probe-only mutation can't leak to later scenes
          __FIELD.scenData = Object.assign({}, __FIELD.scenData, { weather: { sky: 'constructor', time: '__proto__', note: 'x' } });
          var rGarbage = fldWxResolve();
          __FIELD.scenData = Object.assign({}, __FIELD.scenData, { weather: { sky: 'rain' } });   // missing time/note
          var rPartial = fldWxResolve();
          malformed = { garbageNull: (rGarbage === null), partialSky: rPartial && rPartial.sky, threw: false };
        } catch (e) { malformed = { threw: true, err: String(e && e.message || e) }; }
      }

      // PRECIP DISPOSAL: after fldExit the precip GPU buffers must be released (FLDWX_S.points === null).
      var precipDisposed = null;
      if (${JSON.stringify(!!opts.disposeTest)}) {
        try {
          var hadPrecip = !!(typeof FLDWX_S !== 'undefined' && FLDWX_S && FLDWX_S.points);
          if (typeof fldExit === 'function') fldExit(true);
          await wait(60);
          precipDisposed = { hadPrecip: hadPrecip, pointsNull: (typeof FLDWX_S !== 'undefined' && FLDWX_S ? (FLDWX_S.points === null) : true) };
        } catch (e) { precipDisposed = { threw: true }; }
      }

      var cv = document.getElementById('fldGl');
      var dataUrl = (cv && typeof cv.toDataURL === 'function') ? cv.toDataURL('image/png') : '';
      return { ok:true, scenario:${JSON.stringify(scenario)}, wrappers:wrappers,
        resolvedNull: (resolved === null), resolvedSky: resolved && resolved.sky, resolvedTime: resolved && resolved.time,
        bgHex:bgHex, defaultBg:defaultBg, expectBgForSky:expectBgForSky, fogNear:fogNear, fogFar:fogFar, sunI:sunI, hemiI:hemiI,
        precip:precip, ptsCount:ptsCount, maxPtUniform:maxPtUniform, glCap:glCap,
        seedBefore:seedBefore, seedAfter:seedAfter, seedStable:(seedBefore===seedAfter),
        noteBanners:noteBanners, malformed:malformed, precipDisposed:precipDisposed,
        mode3d:!!__FIELD.mode3d, phase:__FIELD.phase, dataUrl:dataUrl };
    } catch(e) {
      return { ok:false, error:String(e && e.message || e), scenario:${JSON.stringify(scenario)} };
    }
  })()`;
}

// the page is loaded ONCE in main (THREE stays resident); each scene tears down the prior battle (fldExit
// at the top of sceneScript) and relaunches in the same context — far faster than a goto-per-scene.
async function runScene(page, label, scenario, seed, opts, shared) {
  const peStart = shared.pe.length, conStart = shared.con.length;
  let d = { ok: false, error: 'not run' };
  try {
    d = await page.evaluate(sceneScript(scenario, seed, opts));
    if (d && d.ok && d.dataUrl && d.dataUrl.indexOf('data:image/png;base64,') === 0) {
      writeFileSync(join(OUT, 'wx-' + label + '.png'), Buffer.from(d.dataUrl.split(',')[1] || '', 'base64'));
      d.shot = 'tools/shots/wx-' + label + '.png';
    }
    if (d) delete d.dataUrl;
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  const pageerrors = shared.pe.slice(peStart), consoleLines = shared.con.slice(conStart);
  const texWarn = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
  return { label, detail: d, pageerrors, texWarn, console: consoleLines.slice(-10) };
}

(async () => {
  staticScan();
  // pick a real battle whose hint resolves non-null (clear/midday is a no-op) for the wiring test; the JSON
  // top-level key IS the launchable scenario id (e.g. "gettysburg", "malvernHill", "fredericksburg").
  const realHint = realHints.find(h => !(h.weather.sky === 'clear' && h.weather.time === 'midday'));
  const realBattle = realHint ? realHint.key : 'gettysburg';
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(35000);
  const page = await ctx.newPage();
  const shared = { pe: [], con: [] };
  page.on('pageerror', e => shared.pe.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') shared.con.push('[' + m.type() + '] ' + m.text()); });
  const scenes = [];
  try {
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    scenes.push(await runScene(page, 'off-default', 'shiloh', 21, { off: true, inject: { sky: 'fog', time: 'midday', note: 'should not apply (weather off)' }, malformedTest: true }, shared));
    scenes.push(await runScene(page, 'note-once', 'shiloh', 21, { noteTest: true }, shared));
    scenes.push(await runScene(page, 'synth-overcast', 'shiloh', 21, { inject: { sky: 'overcast', time: 'midday', note: 'overcast' } }, shared));
    scenes.push(await runScene(page, 'synth-fog', 'shiloh', 21, { inject: { sky: 'fog', time: 'midday', note: 'fog' } }, shared));
    scenes.push(await runScene(page, 'synth-rain', 'shiloh', 21, { inject: { sky: 'rain', time: 'midday', note: 'rain' }, disposeTest: true }, shared));
    scenes.push(await runScene(page, 'synth-rain-rm', 'shiloh', 21, { rm: true, inject: { sky: 'rain', time: 'midday', note: 'rain rm' } }, shared));
    scenes.push(await runScene(page, 'synth-snow', 'shiloh', 21, { inject: { sky: 'snow', time: 'midday', note: 'snow' } }, shared));
    scenes.push(await runScene(page, 'synth-dawn', 'shiloh', 21, { inject: { sky: 'clear', time: 'dawn', note: 'dawn' } }, shared));
    scenes.push(await runScene(page, 'real-data', realBattle, 7, {}, shared));
    scenes.push(await runScene(page, 'fog-2d', 'fredericksburg', 13, { r2d: true, inject: { sky: 'fog', time: 'midday', note: 'fog 2d' } }, shared));
  } finally { if (server) server.kill(); }

  const byLabel = {};
  for (const s of scenes) byLabel[s.label] = s;
  const allPe = scenes.reduce((a, s) => a + s.pageerrors.length, 0);
  const allTex = scenes.reduce((a, s) => a + s.texWarn.length, 0);

  const off = byLabel['off-default'].detail;
  check('module + 4 by-assignment wrappers installed', off.ok && off.wrappers && off.wrappers.i3 && off.wrappers.r3 && off.wrappers.d2 && off.wrappers.ex && off.wrappers.fns, JSON.stringify(off.wrappers || {}));
  check('weather="off": resolve is null (whole layer disabled)', off.ok && off.resolvedNull === true, 'resolvedNull=' + (off && off.resolvedNull));
  check('weather="off": scene keeps the engine DEFAULT background (no tint)', off.ok && off.bgHex === off.defaultBg, 'bg=' + (off && off.bgHex) + ' default=' + (off && off.defaultBg));
  check('weather="off": no precipitation cloud', off.ok && off.precip === false, 'precip=' + (off && off.precip));
  check('weather="off": sim seed unchanged', off.ok && off.seedStable, (off && off.seedBefore) + ' -> ' + (off && off.seedAfter));
  check('malformed weather degrades safely (no throw; inherited-name sky→clear→null; partial keeps its valid sky)',
    off.ok && off.malformed && off.malformed.threw === false && off.malformed.garbageNull === true && off.malformed.partialSky === 'rain',
    JSON.stringify(off.malformed || {}));

  const no = byLabel['note-once'].detail;
  check('note fires EXACTLY ONCE per launch across sim-ticking frames (no per-frame re-fire)', no.ok && no.noteBanners === 1, 'weatherBanners=' + (no && no.noteBanners));

  const ov = byLabel['synth-overcast'].detail;
  check('overcast: background re-tinted to the overcast palette', ov.ok && ov.bgHex === ov.expectBgForSky && ov.bgHex !== ov.defaultBg, 'bg=' + (ov && ov.bgHex) + ' expect=' + (ov && ov.expectBgForSky));
  check('overcast: sun dimmed below the clear default (1.15)', ov.ok && ov.sunI !== null && ov.sunI < 1.15, 'sunI=' + (ov && ov.sunI));

  const fg = byLabel['synth-fog'].detail;
  check('fog: background + fog range re-tinted (far kept >= 1500 for readability)', fg.ok && fg.bgHex === fg.expectBgForSky && fg.fogFar >= 1500, 'bg=' + (fg && fg.bgHex) + ' fogFar=' + (fg && fg.fogFar));
  check('fog: sim seed unchanged across renders', fg.ok && fg.seedStable, (fg && fg.seedBefore) + ' -> ' + (fg && fg.seedAfter));

  const rn = byLabel['synth-rain'].detail;
  check('rain: named "wxPrecip" cloud built + populated', rn.ok && rn.precip === true && rn.ptsCount > 0, 'precip=' + (rn && rn.precip) + ' count=' + (rn && rn.ptsCount));
  check('rain: background re-tinted to the rain palette', rn.ok && rn.bgHex === rn.expectBgForSky, 'bg=' + (rn && rn.bgHex) + ' expect=' + (rn && rn.expectBgForSky));
  check('rain: gl_PointSize clamp wired (uMaxPoint = driver ALIASED_POINT_SIZE_RANGE max)', rn.ok && rn.maxPtUniform > 0 && rn.glCap > 0 && rn.maxPtUniform === rn.glCap, 'uMaxPoint=' + (rn && rn.maxPtUniform) + ' glCap=' + (rn && rn.glCap));
  check('rain: sim seed unchanged across renders (precip uses its own LCG)', rn.ok && rn.seedStable, (rn && rn.seedBefore) + ' -> ' + (rn && rn.seedAfter));
  check('rain: precip GPU buffers DISPOSED on fldExit (no leak)', rn.precipDisposed && rn.precipDisposed.hadPrecip === true && rn.precipDisposed.pointsNull === true, JSON.stringify(rn.precipDisposed || {}));

  const rrm = byLabel['synth-rain-rm'].detail;
  check('reduceMotion: precipitation SUPPRESSED (no wxPrecip cloud)', rrm.ok && rrm.precip === false, 'precip=' + (rrm && rrm.precip));
  check('reduceMotion: the static tint STILL applies (faithful + accessible)', rrm.ok && rrm.bgHex === rrm.expectBgForSky && rrm.bgHex !== rrm.defaultBg, 'bg=' + (rrm && rrm.bgHex) + ' expect=' + (rrm && rrm.expectBgForSky));

  const sn = byLabel['synth-snow'].detail;
  check('snow: named "wxPrecip" cloud built + populated', sn.ok && sn.precip === true && sn.ptsCount > 0, 'precip=' + (sn && sn.precip) + ' count=' + (sn && sn.ptsCount));

  const dw = byLabel['synth-dawn'].detail;
  check('time-of-day (clear/dawn): resolves non-null + warm-shifts the sky off the default', dw.ok && dw.resolvedNull === false && dw.bgHex !== dw.defaultBg, 'sky=' + (dw && dw.resolvedSky) + ' time=' + (dw && dw.resolvedTime) + ' bg=' + (dw && dw.bgHex));

  const rd = byLabel['real-data'].detail;
  check('real-data: a shipped battle hint re-tints the live scene (wiring)', rd.ok && rd.resolvedNull === false && rd.bgHex !== rd.defaultBg, 'sky=' + (rd && rd.resolvedSky) + ' bg=' + (rd && rd.bgHex) + ' default=' + (rd && rd.defaultBg));
  check('real-data: the shipped battle keeps fog far >= 1500 (objective stays readable)', rd.ok && rd.fogFar >= 1500, 'fogFar=' + (rd && rd.fogFar));

  const t2 = byLabel['fog-2d'].detail;
  check('2D: the weather wash path runs without error (fog over the canvas)', t2.ok && t2.shot, 'shot=' + (t2 && t2.shot));

  check('no Three.js texture warning across all scenes', allTex === 0, 'texWarnings=' + allTex);
  check('zero pageerrors across all scenes', allPe === 0, 'pageerrors=' + allPe);

  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), passed: steps.filter(s => s.ok).length, total: steps.length, steps, realHints, scenes };
  writeFileSync(join(OUT, 'probe-weather.json'), JSON.stringify(out, null, 2));
  console.log('probe-weather ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
