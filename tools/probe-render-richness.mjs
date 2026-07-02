#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-render-richness.mjs
// Focused probe for T18 terrain & unit render richness (Phase H · H3-i3). Verifies:
//  - the module + the five by-assignment wrappers (fld3dBuildTerrain/fld3dRender/fld3dSyncUnit/fld2dDraw/fldExit)
//    are installed (and the T16/T17 markers ._wx/._atmo stay propagated through the chain);
//  - GROUND: the terrain mesh's vertex COLOURS are enriched (a richer colour variance than the bare engine),
//    while vertex POSITIONS are UNTOUCHED (a sampled vertex Y still equals the analytic fldTerrainH -> units
//    never float/sink), and the enrich is idempotent (colA._rr latch);
//  - WOODS: the cone InstancedMeshes are captured and SWAY (a rotation matrix element becomes non-zero across
//    frames) with motion, and reset to the upright base (pure translation, rotation element == 0) under
//    reduceMotion / renderRich="off";
//  - FLAG: a unit's flag mesh ripples (rotation.y|z non-zero) with motion, and is held flat (0) under rm/off;
//  - SELECTION: a selected unit's ring opacity lifts above 0;
//  - CASUALTY FADE: an alive->dead unit stays visible with material opacity in (0,1) mid-fade, then hides;
//  - the BYTE-IDENTICAL DEFAULT: renderRich="off" leaves the ground un-enriched + woods unswayed + flags flat;
//  - the sim RNG (__FIELD.seed) is UNCHANGED across pure render frames (T18 uses analytic noise, never fldRng);
//  - a static scan proves NO combat/tactical file (except T18) references the rr layer, and T18 never calls fldRng;
//  - the 2D path (grain + selection pulse + casualty fade) paints without error or texture warning.
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
async function closeBounded(fn, ms = 2500) {
  let timedOut = false;
  await Promise.race([
    Promise.resolve().then(fn).catch(() => {}),
    sleep(ms).then(() => { timedOut = true; })
  ]);
  return timedOut;
}
async function withTimeout(promise, ms, label) {
  let timer = null;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve({ __timeout: true, label }), ms);
  });
  const out = await Promise.race([promise, timeout]);
  if (timer) clearTimeout(timer);
  return out;
}

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

/* ---------- 1) STATIC SCAN: combat purity ---------- */
function staticScan() {
  const tacDir = join(ROOT, 'src', 'tactical');
  // T18 owns the layer; T21-visual-fidelity (H5-i2) is a sibling PRESENTATION module that deliberately rides
  // T18's single public opt-out (fldRrOff()) so one renderRich="off" toggle reverts the whole visual stack — that
  // is the intended seam, not a combat leak. The scan still proves no COMBAT/SIM file references the rr layer.
  const SCAN_SKIP = ['T18-render-richness.js', 'T21-visual-fidelity.js'];
  const files = readdirSync(tacDir).filter(f => /\.js$/.test(f) && SCAN_SKIP.indexOf(f) < 0);
  const combatExtra = ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js'].map(f => join(ROOT, 'src', f));
  const all = files.map(f => join(tacDir, f)).concat(combatExtra);
  const leaks = [];
  for (const f of all) {
    let txt = ''; try { txt = readFileSync(f, 'utf8'); } catch (e) { continue; }
    if (/fldRr|FLDRR/.test(txt)) leaks.push(f.replace(ROOT + '/', ''));
  }
  check('static-scan: no combat/tactical file references the render-richness layer', leaks.length === 0, leaks.join(', '));
  let t18 = ''; try { t18 = readFileSync(join(tacDir, 'T18-render-richness.js'), 'utf8'); } catch (e) {}
  check('static-scan: T18 never calls fldRng (uses analytic noise + wall-clock only)', t18.length > 0 && !/fldRng\(/.test(t18));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

async function launchBrowser() {
  return await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
}

// opts: { rm, off, r2d, selectTest, fadeTest }
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
      if (${JSON.stringify(!!opts.off)}) G.settings.renderRich = 'off'; else { try { delete G.settings.renderRich; } catch(e){} }

      var wrappers = {
        bt: typeof fld3dBuildTerrain === 'function' && !!fld3dBuildTerrain._rr,
        r3: typeof fld3dRender === 'function' && !!fld3dRender._rr,
        su: typeof fld3dSyncUnit === 'function' && !!fld3dSyncUnit._rr,
        d2: typeof fld2dDraw === 'function' && !!fld2dDraw._rr,
        ex: typeof fldExit === 'function' && !!fldExit._rr,
        // the T16/T17 markers must survive T18's re-wrap (introspectable chain)
        chain: !!(fld3dRender._wx && fld3dRender._atmo && fld2dDraw._wx && fld2dDraw._atmo && fldExit._wx && fldExit._atmo),
        fns: ['fldRrEnrichGround','fldRrSwayWoods','fldRrSyncUnit','fldRrDraw2d','fldRrDispose'].every(function(n){ return eval('typeof '+n) === 'function'; })
      };

      fldLaunchSandbox({ renderer:${JSON.stringify(opts.r2d ? '2d' : '3d')}, scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      if (!${JSON.stringify(!!opts.r2d)}) {
        for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
        if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      }
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }

      // drive several real frames (enrich already ran in fld3dInit; this sways/ripples/paints)
      for (var f = 0; f < 5; f++) { fldRender(); await wait(70); }

      /* ---- GROUND: colour enrichment + position integrity ---- */
      var ground = { rr:null, colStd:null, posOk:null, vcount:0 };
      try {
        var gm = __FIELD.ground, geo = gm && gm.geometry, posA = geo && geo.attributes.position, colA = geo && geo.attributes.color;
        if (colA) {
          ground.rr = !!colA._rr; ground.vcount = posA.count;
          // colour std-dev across all channels
          var arr = colA.array, n = arr.length, mean = 0; for (var i=0;i<n;i++) mean += arr[i]; mean /= n;
          var vsum = 0; for (var i2=0;i2<n;i2++){ var d = arr[i2]-mean; vsum += d*d; } ground.colStd = Math.sqrt(vsum/n);
          ground.colArr = Array.from(arr);   // for the rich-vs-off per-vertex delta (stripped before the JSON is written)
          // sample a few vertices: world (x,z) -> analytic fldTerrainH must equal the stored Y (positions untouched)
          var W = FLD.FIELD_W, H = FLD.FIELD_H, posOk = true;
          for (var sv=0; sv<posA.count; sv += Math.max(1, Math.floor(posA.count/9))) {
            var wx = posA.getX(sv) + W/2, wz = posA.getZ(sv) + H/2, yA = fldTerrainH(wx, wz), yM = posA.getY(sv);
            if (Math.abs(yA - yM) > 0.01) { posOk = false; break; }
          }
          ground.posOk = posOk;
        }
      } catch(e) { ground.err = String(e&&e.message||e); }

      /* ---- WOODS: capture + sway (max rotation matrix element across frames) ---- */
      var woods = { count:0, maxRot:0 };
      try {
        if (typeof FLDRR_S !== 'undefined' && FLDRR_S.woods) {
          woods.count = FLDRR_S.woods.length;
          if (woods.count > 0) {
            var T = window.THREE, mm = new T.Matrix4();
            for (var fr=0; fr<6; fr++) {
              fldRender(); await wait(70);
              var w0 = FLDRR_S.woods[0]; if (!w0 || !w0.mesh) break;
              w0.mesh.getMatrixAt(0, mm);
              // elements 1,2,4,6,8,9 are off-diagonal rotation terms; pure translation keeps them 0
              var el = mm.elements, rot = Math.abs(el[1])+Math.abs(el[2])+Math.abs(el[4])+Math.abs(el[6])+Math.abs(el[8])+Math.abs(el[9]);
              if (rot > woods.maxRot) woods.maxRot = rot;
            }
          }
        }
      } catch(e) { woods.err = String(e&&e.message||e); }

      /* ---- FLAG: ripple magnitude on a living unit across frames ---- */
      var flag = { maxRot:0, found:false };
      try {
        var liveU = null; for (var lu=0; lu<__FIELD.units.length; lu++){ if (__FIELD.units[lu].alive){ liveU = __FIELD.units[lu]; break; } }
        if (liveU) {
          var g = __FIELD._u3d[liveU.id], fm = g && g.getObjectByName('flag');
          if (fm) { flag.found = true;
            for (var ff=0; ff<6; ff++){ fldRender(); await wait(70); var mr = Math.abs(fm.rotation.y)+Math.abs(fm.rotation.z); if (mr>flag.maxRot) flag.maxRot = mr; }
          }
        }
      } catch(e) { flag.err = String(e&&e.message||e); }

      /* ---- RING CULL: idle selection rings should not consume draw calls; selected rings still show ---- */
      var ringIdle = { visible:null, opacity:null };
      try {
        var ru = null; for (var ri=0; ri<__FIELD.units.length; ri++){ if (__FIELD.units[ri].alive){ ru = __FIELD.units[ri]; break; } }
        if (ru) {
          __FIELD.sel = [];
          fldRender(); await wait(70);
          var rg = __FIELD._u3d[ru.id], idleRing = rg && rg.getObjectByName('ring');
          if (idleRing) {
            ringIdle.visible = idleRing.visible !== false;
            ringIdle.opacity = idleRing.material ? idleRing.material.opacity : null;
          }
        }
      } catch(e) { ringIdle.err = String(e&&e.message||e); }

      /* ---- SELECTION: selected ring opacity ---- */
      var sel = { ringOpacity:-1, ringVisible:null };
      if (${JSON.stringify(!!opts.selectTest)}) {
        try {
          var su = null; for (var si=0; si<__FIELD.units.length; si++){ if (__FIELD.units[si].alive){ su = __FIELD.units[si]; break; } }
          if (su) {
            __FIELD.sel = [su.id];
            for (var sf=0; sf<4; sf++){ fldRender(); await wait(70); }
            var sg = __FIELD._u3d[su.id], ring = sg && sg.getObjectByName('ring');
            if (ring && ring.material) { sel.ringOpacity = ring.material.opacity; sel.ringVisible = ring.visible !== false; }
            __FIELD.sel = [];
          }
        } catch(e) { sel.err = String(e&&e.message||e); }
      }

      /* ---- CASUALTY FADE: alive->dead stays visible with opacity in (0,1) + the sink is BOUNDED (not the
             cumulative runaway through the terrain), then hides; plus a white-box fog-ghost guard check ---- */
      var fade = { mid:null, midVisible:null, finalVisible:null, maxSink:null, ghostGuarded:null };
      if (${JSON.stringify(!!opts.fadeTest)}) {
        try {
          var aliveU = []; for (var di=0; di<__FIELD.units.length; di++){ if (__FIELD.units[di].alive) aliveU.push(__FIELD.units[di]); }
          var du = aliveU[0];
          if (du) {
            var dg = __FIELD._u3d[du.id];
            fldRender(); await wait(70);                 // establish prevAlive=true + wasVis=true
            var preY = dg.position.y;                     // the last-living seated Y
            du.alive = false;                            // probe-only render poke (no sim step follows)
            var maxSink = 0;
            for (var ff=0; ff<4; ff++){ fldRender(); await wait(90); var sk = preY - dg.position.y; if (sk>maxSink) maxSink = sk; }
            var slab = dg.getObjectByName('slab');
            fade.midVisible = dg.visible; fade.mid = slab && slab.material ? slab.material.opacity : null;
            for (var fe=0; fe<14; fe++){ fldRender(); await wait(70); var sk2 = preY - dg.position.y; if (dg.visible && sk2>maxSink) maxSink = sk2; }
            fade.finalVisible = dg.visible; fade.maxSink = maxSink;
          }
          // FOG-GHOST GUARD (white-box): a unit the base was hiding while alive (wasVis=false) must NOT
          // force-show a fading ghost when it dies.
          var gu = aliveU.length > 1 ? aliveU[aliveU.length-1] : null;
          if (gu) {
            var gg = __FIELD._u3d[gu.id];
            fldRender(); await wait(60);                  // create the per-unit record
            if (gg.userData._t18) { gg.userData._t18.wasVis = false; gg.userData._t18.prevAlive = true; gg.userData._t18.fading = false; gg.userData._t18.faded = false; }
            gu.alive = false;
            for (var gf=0; gf<4; gf++){ fldRender(); await wait(60); }
            fade.ghostGuarded = (gg.visible === false);   // guard held: stayed hidden, no fading ghost
          }
        } catch(e) { fade.err = String(e&&e.message||e); }
      }

      /* ---- byte-identity: sim seed unchanged AND mutable sim fields invariant across a synchronous render
             burst (T18 reads u.* but must never write them; proves byte-identity beyond just RNG-call-count) ---- */
      function _simSnap(){ var s=[]; for (var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; s.push(u.x+','+u.z+','+u.men+','+u.morale+','+u.facing+','+u.formation); } return s.join('|'); }
      var seedBefore = __FIELD.seed, simBefore = _simSnap();
      for (var s2=0; s2<200; s2++) { fldRender(); }
      var seedAfter = __FIELD.seed, simAfter = _simSnap();
      var errN = (typeof FLDRR_S !== 'undefined' && FLDRR_S) ? FLDRR_S.errN : -1;

      var cv = document.getElementById('fldGl');
      var dataUrl = (cv && typeof cv.toDataURL === 'function') ? cv.toDataURL('image/png') : '';
      return { ok:true, scenario:${JSON.stringify(scenario)}, wrappers:wrappers, ground:ground, woods:woods, flag:flag, ringIdle:ringIdle, sel:sel, fade:fade,
        seedBefore:seedBefore, seedAfter:seedAfter, seedStable:(seedBefore===seedAfter),
        simStable:(simBefore===simAfter), errN:errN,
        mode3d:!!__FIELD.mode3d, phase:__FIELD.phase, dataUrl:dataUrl };
    } catch(e) {
      return { ok:false, error:String(e && e.message || e), scenario:${JSON.stringify(scenario)} };
    }
  })()`;
}

async function runScene(page, label, scenario, seed, opts, shared) {
  const peStart = shared.pe.length, conStart = shared.con.length;
  let d = { ok: false, error: 'not run' };
  try {
    d = await page.evaluate(sceneScript(scenario, seed, opts));
    if (d && d.ok && d.dataUrl && d.dataUrl.indexOf('data:image/png;base64,') === 0) {
      writeFileSync(join(OUT, 'rr-' + label + '.png'), Buffer.from(d.dataUrl.split(',')[1] || '', 'base64'));
      d.shot = 'tools/shots/rr-' + label + '.png';
    }
    if (d) delete d.dataUrl;
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  const pageerrors = shared.pe.slice(peStart), consoleLines = shared.con.slice(conStart);
  const texWarn = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
  return { label, detail: d, pageerrors, texWarn, console: consoleLines.slice(-10) };
}

async function runSceneFresh(label, scenario, seed, opts) {
  let browser = null, ctx = null, page = null;
  browser = await launchBrowser();
  ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(45000);
  page = await ctx.newPage();
  const shared = { pe: [], con: [] };
  page.on('pageerror', e => shared.pe.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') shared.con.push('[' + m.type() + '] ' + m.text()); });
  try {
    console.log('probe-render-richness scene=' + label + ' start');
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    const sceneTimeoutMs = 240000;
    const out = await withTimeout(runScene(page, label, scenario, seed, opts, shared), sceneTimeoutMs, label);
    if (out && out.__timeout) return { label, detail: { ok: false, error: 'scene timed out after ' + sceneTimeoutMs + 'ms' }, pageerrors: shared.pe, texWarn: [], console: shared.con.slice(-10) };
    console.log('probe-render-richness scene=' + label + ' ok=' + !!(out && out.detail && out.detail.ok));
    return out;
  } finally {
    if (page) await closeBounded(() => page.close());
    if (ctx) await closeBounded(() => ctx.close());
    if (browser) {
      const timedOut = await closeBounded(() => browser.close());
      if (timedOut) {
        try { const proc = browser.process && browser.process(); if (proc && !proc.killed) proc.kill('SIGKILL'); } catch {}
      }
    }
  }
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const scenes = [];
  try {
    scenes.push(await runSceneFresh('rich-3d', 'shiloh', 21, { selectTest: true, fadeTest: true }));
    scenes.push(await runSceneFresh('off-3d', 'shiloh', 21, { off: true }));
    scenes.push(await runSceneFresh('rm-3d', 'shiloh', 21, { rm: true }));
    scenes.push(await runSceneFresh('rich-2d', 'shiloh', 21, { r2d: true }));
  } finally { if (server) server.kill(); }

  const byLabel = {};
  for (const s of scenes) byLabel[s.label] = s;
  const allPe = scenes.reduce((a, s) => a + s.pageerrors.length, 0);
  const allTex = scenes.reduce((a, s) => a + s.texWarn.length, 0);

  const R = byLabel['rich-3d'].detail, OFF = byLabel['off-3d'].detail, RM = byLabel['rm-3d'].detail, T2 = byLabel['rich-2d'].detail;

  check('module + 5 by-assignment wrappers installed (chain markers preserved)',
    R.ok && R.wrappers && R.wrappers.bt && R.wrappers.r3 && R.wrappers.su && R.wrappers.d2 && R.wrappers.ex && R.wrappers.chain && R.wrappers.fns,
    JSON.stringify(R.wrappers || {}));

  // GROUND — per-vertex rich-vs-off delta isolates the enrichment (the bare engine's woods/grass two-tone
  // dominates the global std, so a raw std-ratio is a blunt, dilution-prone measure).
  let meanAbsDelta = 0, deltaPct = 0;
  if (R.ok && OFF.ok && Array.isArray(R.ground.colArr) && Array.isArray(OFF.ground.colArr)) {
    const a = R.ground.colArr, b = OFF.ground.colArr, m = Math.min(a.length, b.length);
    let sum = 0, changed = 0;
    for (let i = 0; i < m; i++) { const dd = Math.abs(a[i] - b[i]); sum += dd; if (dd > 0.002) changed++; }
    if (m > 0) { meanAbsDelta = sum / m; deltaPct = changed / m; }
  }
  check('ground: vertex colours ENRICHED (colA._rr latch set; colour variance present)',
    R.ok && R.ground.rr === true && R.ground.colStd > 0.02, 'rr=' + (R.ground && R.ground.rr) + ' colStd=' + (R.ground && R.ground.colStd));
  check('ground: enrichment MEANINGFULLY changes the ground (per-vertex rich-vs-off delta + variance up, not down)',
    R.ok && OFF.ok && meanAbsDelta > 0.012 && deltaPct > 0.5 && R.ground.colStd >= OFF.ground.colStd,
    'meanAbsDelta=' + meanAbsDelta.toFixed(4) + ' changedFrac=' + deltaPct.toFixed(2) + ' rich/off std=' + (R.ground && R.ground.colStd) + '/' + (OFF.ground && OFF.ground.colStd));
  check('ground: vertex POSITIONS untouched (sampled Y == analytic fldTerrainH -> units never float/sink)',
    R.ok && R.ground.posOk === true, 'posOk=' + (R.ground && R.ground.posOk));

  // WOODS
  check('woods: cone InstancedMeshes captured (> 0)', R.ok && R.woods.count > 0, 'count=' + (R.woods && R.woods.count));
  check('woods: SWAY active with motion (a rotation matrix element becomes non-zero across frames)',
    R.ok && R.woods.maxRot > 1e-4, 'maxRot=' + (R.woods && R.woods.maxRot));

  // FLAG
  check('flag: banner RIPPLES with motion (rotation magnitude > 0)', R.ok && R.flag.found && R.flag.maxRot > 1e-3, 'maxRot=' + (R.flag && R.flag.maxRot));

  // SELECTION
  check('selection: idle unit rings are visibility-culled when no unit is selected',
    R.ok && R.ringIdle.visible === false && R.ringIdle.opacity === 0,
    JSON.stringify(R.ringIdle || {}));
  check('selection: a selected unit ring is visible and opacity lifts above 0',
    R.ok && R.sel.ringVisible === true && R.sel.ringOpacity > 0.3,
    JSON.stringify(R.sel || {}));

  // CASUALTY FADE
  check('casualty fade: a fallen unit stays VISIBLE with material opacity in (0,1) mid-fade',
    R.ok && R.fade.midVisible === true && R.fade.mid > 0 && R.fade.mid < 1, 'visible=' + (R.fade && R.fade.midVisible) + ' opacity=' + (R.fade && R.fade.mid));
  check('casualty fade: the settle sink is BOUNDED (~5yd, not the cumulative runaway through the terrain)',
    R.ok && R.fade.maxSink !== null && R.fade.maxSink >= 0 && R.fade.maxSink <= 8, 'maxSink=' + (R.fade && R.fade.maxSink));
  check('casualty fade: the unit is hidden once the fade completes', R.ok && R.fade.finalVisible === false, 'finalVisible=' + (R.fade && R.fade.finalVisible));
  check('casualty fade: a fog-hidden unit (wasVis=false) does NOT force-show a fading ghost (no fog-of-war leak)',
    R.ok && R.fade.ghostGuarded === true, 'ghostGuarded=' + (R.fade && R.fade.ghostGuarded));

  // BYTE-IDENTITY (combat untouched)
  check('rich-3d: sim seed unchanged across a synchronous render burst (no fldRng)', R.ok && R.seedStable, R.seedBefore + ' -> ' + R.seedAfter);
  check('rich-3d: mutable sim fields (x/z/men/morale/facing/formation) INVARIANT across the render burst',
    R.ok && R.simStable === true, 'simStable=' + (R.ok && R.simStable));
  check('rich-3d: no swallowed per-unit/per-frame exceptions (FLDRR_S.errN === 0)', R.ok && R.errN === 0, 'errN=' + (R.ok && R.errN));

  // OFF SWITCH (byte-identical default look)
  check('renderRich="off": ground NOT enriched (colA._rr unset)', OFF.ok && OFF.ground.rr !== true, 'rr=' + (OFF.ground && OFF.ground.rr));
  check('renderRich="off": woods NOT swayed (matrices stay upright base)', OFF.ok && OFF.woods.maxRot < 1e-6, 'maxRot=' + (OFF.woods && OFF.woods.maxRot));
  check('renderRich="off": flag held flat (no ripple)', OFF.ok && OFF.flag.maxRot < 1e-6, 'maxRot=' + (OFF.flag && OFF.flag.maxRot));

  // REDUCED MOTION (static texture kept, motion suppressed)
  check('reduceMotion: ground texture STILL applied (static detail is faithful, not motion)', RM.ok && RM.ground.rr === true, 'rr=' + (RM.ground && RM.ground.rr));
  check('reduceMotion: woods sway SUPPRESSED (upright base)', RM.ok && RM.woods.maxRot < 1e-6, 'maxRot=' + (RM.woods && RM.woods.maxRot));
  check('reduceMotion: flag ripple SUPPRESSED (flat)', RM.ok && RM.flag.maxRot < 1e-6, 'maxRot=' + (RM.flag && RM.flag.maxRot));
  check('reduceMotion: sim seed unchanged', RM.ok && RM.seedStable, RM.seedBefore + ' -> ' + RM.seedAfter);

  // 2D
  check('2D: the render-richness path (cached grain + selection + casualty fade) paints without error', T2.ok && T2.shot, T2.ok ? ('shot=' + T2.shot) : ('err=' + (T2 && T2.error)));
  check('2D: sim seed unchanged across renders', T2.ok && T2.seedStable, T2.seedBefore + ' -> ' + T2.seedAfter);

  // BYTE-IDENTITY + robustness across EVERY scene
  check('all scenes: mutable sim fields invariant across the render burst (off/rm/2D too)',
    R.simStable === true && OFF.simStable === true && RM.simStable === true && T2.simStable === true,
    'rich=' + R.simStable + ' off=' + OFF.simStable + ' rm=' + RM.simStable + ' 2d=' + T2.simStable);
  check('all scenes: no swallowed exceptions (FLDRR_S.errN === 0 everywhere)',
    R.errN === 0 && OFF.errN === 0 && RM.errN === 0 && T2.errN === 0,
    'rich=' + R.errN + ' off=' + OFF.errN + ' rm=' + RM.errN + ' 2d=' + T2.errN);

  check('no Three.js texture warning across all scenes', allTex === 0, 'texWarnings=' + allTex);
  check('zero pageerrors across all scenes', allPe === 0, 'pageerrors=' + allPe);

  for (const s of scenes) { if (s.detail && s.detail.ground && s.detail.ground.colArr) delete s.detail.ground.colArr; }   // drop the bulky color arrays
  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), passed: steps.filter(s => s.ok).length, total: steps.length, steps, scenes };
  writeFileSync(join(OUT, 'probe-render-richness.json'), JSON.stringify(out, null, 2));
  console.log('probe-render-richness ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
