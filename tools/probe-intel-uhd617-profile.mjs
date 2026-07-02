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

function profileScript(label, quality) {
  const opts = {
    label,
    quality,
    scenario,
    seed: label === 'low' ? 41 : 40,
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
        var pegs = g.getObjectByName('vfPegs');
        var shadow = g.getObjectByName('vfShadow');
        var slab = g.getObjectByName('slab');
        out = {
          found: true,
          unitId: u.id,
          formation: u.formation || '',
          formationFigures: !!ff,
          formationFiguresVisible: !!(ff && ff.visible),
          pegs: !!pegs,
          pegsVisible: !!(pegs && pegs.visible !== false),
          shadow: !!shadow,
          slabVisible: slab ? slab.visible !== false : null
        };
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

async function runProfile(page, label, quality, shared) {
  const peStart = shared.pe.length;
  const conStart = shared.con.length;
  let detail = { ok: false, error: 'not run' };
  try {
    detail = await page.evaluate(profileScript(label, quality));
  } catch (e) {
    detail = { ok: false, error: String(e && e.message || e), label, quality };
  } finally {
    try { await page.evaluate(`(() => { try { if (typeof fldExit === 'function') fldExit(true); } catch(e) {} })()`); } catch {}
  }
  const pageerrors = shared.pe.slice(peStart);
  const consoleLines = shared.con.slice(conStart);
  const textureWarnings = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
  return { label, quality, ok: !!detail.ok && !pageerrors.length && !textureWarnings.length, detail, pageerrors, textureWarnings, console: consoleLines.slice(-12) };
}

const assets = assetMetrics();
check('performance policy is present in data/media-budget.json', perf.targetHardware === 'Intel UHD Graphics 617 / 8 GB RAM floor' && perf.probe === 'tools/probe-intel-uhd617-profile.mjs', perf.targetHardware || '');
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
  profiles.push(await runProfile(page, 'high', 'high', shared));
  profiles.push(await runProfile(page, 'low', 'low', shared));
} finally {
  if (server) {
    try { server.kill(); } catch {}
  }
}
try { await Promise.race([ctx.close().catch(() => {}), sleep(3000)]); } catch {}
try { await Promise.race([browser.close().catch(() => {}), sleep(3000)]); } catch {}

const high = profiles.find(p => p.label === 'high') || { detail: {} };
const low = profiles.find(p => p.label === 'low') || { detail: {} };
const allPageErrors = profiles.flatMap(p => p.pageerrors || []);
const allTextureWarnings = profiles.flatMap(p => p.textureWarnings || []);
check('high profile launched and rendered nonblank', high.ok === true, high.detail && high.detail.error || '');
check('low profile launched and rendered nonblank', low.ok === true, low.detail && low.detail.error || '');
check('low tier reports fldLow() true and high tier reports false', high.detail.fldLow === false && low.detail.fldLow === true, 'high=' + high.detail.fldLow + ' low=' + low.detail.fldLow);
check('low tier gates out formation figures and peg ranks', low.detail.ffOff === true && low.detail.unitRender && low.detail.unitRender.formationFigures !== true && low.detail.unitRender.pegsVisible !== true, JSON.stringify(low.detail.unitRender || {}));
check('low tier stays below hard render-call cap', Number(low.detail.renderInfo && low.detail.renderInfo.calls || 0) <= Number(budgets.lowTierRenderCallHardCap || 360), 'calls=' + (low.detail.renderInfo && low.detail.renderInfo.calls));
check('low tier stays below hard scene-object cap', Number(low.detail.sceneCounts && low.detail.sceneCounts.objects || 0) <= Number(budgets.lowTierObjectHardCap || 1400), 'objects=' + (low.detail.sceneCounts && low.detail.sceneCounts.objects));
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
if (low.detail.renderInfo && high.detail.renderInfo && low.detail.renderInfo.calls > high.detail.renderInfo.calls) {
  warn('low tier render calls exceeded high tier; inspect before adding more visual layers', 'low=' + low.detail.renderInfo.calls + ' high=' + high.detail.renderInfo.calls);
}

const ok = steps.every(s => s.ok);
const out = {
  ok,
  generatedAt: new Date().toISOString(),
  targetHardware: perf.targetHardware,
  method: perf.method,
  budgets,
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
  console.log('  ' + p.label + ' quality=' + p.quality + ' launchMs=' + (d.launchMs ?? 'n/a') + ' avgFrameMs=' + (fb.avgMs ?? 'n/a') + ' calls=' + (ri.calls ?? 'n/a') + ' objects=' + (d.sceneCounts && d.sceneCounts.objects || 'n/a'));
}
for (const w of warnings) console.log('  WARN ' + w);
for (const s of steps) if (!s.ok) console.log('  FAIL ' + s.name + (s.detail ? ' :: ' + s.detail : ''));
if (!ok) process.exit(1);
