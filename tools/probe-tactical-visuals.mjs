#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-tactical-visuals.mjs
// Dedicated real-time visual probe for the __FIELD tactical engine. It captures
// Shiloh, Malvern Hill, Gettysburg, and Chancellorsville in the 2D fallback renderer and the live Three.js 3D
// renderer, then checks that the canvas is active, nonblank, and visibly varied.

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

const scenes = [
  { name: 'visual-shiloh-2d', scenario: 'shiloh', renderer: '2d', seed: 21, steps: 520, settle: 350 },
  { name: 'visual-shiloh-3d', scenario: 'shiloh', renderer: '3d', seed: 21, steps: 520, settle: 900 },
  { name: 'visual-malvern-hill-2d', scenario: 'malvernHill', renderer: '2d', seed: 101, steps: 520, settle: 350 },
  { name: 'visual-malvern-hill-3d', scenario: 'malvernHill', renderer: '3d', seed: 101, steps: 520, settle: 1000 },
  { name: 'visual-gettysburg-2d', scenario: 'gettysburg', renderer: '2d', seed: 7, steps: 460, settle: 350 },
  { name: 'visual-gettysburg-3d', scenario: 'gettysburg', renderer: '3d', seed: 7, steps: 460, settle: 1000 },
  { name: 'visual-chancellorsville-2d', scenario: 'chancellorsville', renderer: '2d', seed: 21, steps: 520, settle: 350 },
  { name: 'visual-chancellorsville-3d', scenario: 'chancellorsville', renderer: '3d', seed: 21, steps: 520, settle: 1000 },
];

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill();
  throw new Error('Could not start static server on :' + cfg.port);
}

function setupSceneScript(scene) {
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function sample2d(ctx, cv) {
      var W = Math.max(1, cv.width), H = Math.max(1, cv.height), data = [];
      try { data = ctx.getImageData(Math.floor(W * 0.2), Math.floor(H * 0.2), Math.max(8, Math.floor(W * 0.6)), Math.max(8, Math.floor(H * 0.6))).data; }
      catch(e) { return { ok:false, error:'2d getImageData: ' + e.message }; }
      return summarizePixels(data);
    }
    function sample3d(renderer, cv) {
      try {
        var gl = renderer.getContext(), w = gl.drawingBufferWidth || cv.width, h = gl.drawingBufferHeight || cv.height;
        var sw = Math.max(12, Math.min(32, Math.floor(w * 0.18))), sh = Math.max(12, Math.min(32, Math.floor(h * 0.18)));
        var x = Math.max(0, Math.floor((w - sw) / 2)), y = Math.max(0, Math.floor((h - sh) / 2));
        var pix = new Uint8Array(sw * sh * 4);
        gl.readPixels(x, y, sw, sh, gl.RGBA, gl.UNSIGNED_BYTE, pix);
        return summarizePixels(pix);
      } catch(e) { return { ok:false, error:'3d readPixels: ' + e.message }; }
    }
    function summarizePixels(data) {
      var seen = {}, varied = 0, colored = 0, alpha = 0, total = Math.floor(data.length / 4);
      for (var i = 0; i < data.length; i += 4) {
        var r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a > 0) alpha++;
        if (r + g + b > 24) colored++;
        var key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4);
        if (!seen[key]) { seen[key] = 1; varied++; }
      }
      return { ok:true, total:total, alpha:alpha, colored:colored, buckets:varied };
    }
    try {
      G.settings = G.settings || {};
      G.settings.gfxQuality = 'high';
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;
      fldLaunchSandbox({ renderer:${JSON.stringify(scene.renderer)}, scenario:${JSON.stringify(scene.scenario)}, autoBoth:true, playerSide:'US', seed:${scene.seed} });
      if (${JSON.stringify(scene.renderer)} === '3d') {
        for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
        if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind + ' mode3d=' + __FIELD.mode3d);
      }
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      fldStepN(${scene.steps}, 0.05);
      __FIELD.paused = false;
      if (typeof fldRender === 'function') fldRender();
      if (typeof fldRenderTop === 'function') fldRenderTop();
      if (typeof fldRenderHud === 'function') fldRenderHud();
      await wait(${scene.settle});
      if (typeof fldRender === 'function') fldRender();
      var cv = document.getElementById('fldGl');
      if (!cv) throw new Error('no tactical canvas');
      var stats = __FIELD.mode3d ? sample3d(__FIELD.renderer, cv) : sample2d(__FIELD.ctx2d, cv);
      if (!stats.ok) throw new Error(stats.error || 'pixel sample failed');
      if (stats.colored < Math.max(20, stats.total * 0.25)) throw new Error('canvas too blank: ' + JSON.stringify(stats));
      if (stats.buckets < 6) throw new Error('canvas lacks visual variety: ' + JSON.stringify(stats));
      var beacon = null;
      if (__FIELD.mode3d) {
        beacon = __FIELD.scene && __FIELD.scene.getObjectByName ? __FIELD.scene.getObjectByName('objectiveBeacon') : null;
        if (!beacon) throw new Error('3D objective beacon missing');
        if (Math.abs(beacon.position.x - __FIELD.objective.x) > 2 || Math.abs(beacon.position.z - __FIELD.objective.z) > 2) throw new Error('3D objective beacon is not seated on the objective');
      }
      if (typeof cv.toDataURL !== 'function') throw new Error('canvas cannot export a PNG capture');
      var dataUrl = cv.toDataURL('image/png');
      if (!dataUrl || dataUrl.indexOf('data:image/png;base64,') !== 0 || dataUrl.length < 1024) throw new Error('canvas PNG export too small');
      return {
        ok:true,
        scenario:__FIELD.scenario,
        renderer:${JSON.stringify(scene.renderer)},
        mode3d:!!__FIELD.mode3d,
        phase:__FIELD.phase,
        paused:!!__FIELD.paused,
        t:Math.round(__FIELD.t),
        units:__FIELD.units.length,
        objective:__FIELD.objective && __FIELD.objective.name,
        pixelStats:stats,
        beacon: beacon ? { children:beacon.children.length, x:Math.round(beacon.position.x), z:Math.round(beacon.position.z) } : null,
        top:{
          title:(document.getElementById('fldTitle') || {}).textContent || '',
          sector:(document.getElementById('fldSector') || {}).textContent || '',
          obj:(document.getElementById('fldObj') || {}).textContent || '',
          phase:(document.getElementById('fldPhase') || {}).textContent || ''
        },
        dataUrl:dataUrl
      };
    } catch(e) {
      return { ok:false, error:String(e && e.message || e), scenario:${JSON.stringify(scene.scenario)}, renderer:${JSON.stringify(scene.renderer)} };
    }
  })()`;
}

async function launchBrowser() {
  try { return await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e) { return await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
}

async function runScene(page, scene) {
  const pageerrors = [];
  const consoleLines = [];
  const onErr = e => pageerrors.push(String(e.message));
  const onConsole = m => { if (m.type() === 'error' || m.type() === 'warning') consoleLines.push('[' + m.type() + '] ' + m.text()); };
  page.on('pageerror', onErr);
  page.on('console', onConsole);
  const url = cfg.baseUrl + '/' + cfg.file;
  let detail = { ok:false, error:'not run' };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(450);
    detail = await page.evaluate(setupSceneScript(scene));
    if (detail && detail.ok && detail.dataUrl) {
      const raw = detail.dataUrl.split(',')[1] || '';
      writeFileSync(join(OUT, scene.name + '.png'), Buffer.from(raw, 'base64'));
      delete detail.dataUrl;
      detail.shot = 'tools/shots/' + scene.name + '.png';
    }
  } catch (e) {
    detail = { ok:false, error:String(e && e.message || e), scenario:scene.scenario, renderer:scene.renderer };
  } finally {
    try { await page.evaluate(`(() => { try { if (typeof fldExit === 'function') fldExit(true); } catch(e) {} })()`); } catch(e) {}
    const textureWarnings = consoleLines.filter(line => THREE_TEXTURE_WARNING.test(line));
    if (textureWarnings.length) {
      detail.ok = false;
      detail.textureWarnings = textureWarnings;
      detail.error = (detail.error ? detail.error + '; ' : '') + 'Three.js texture warning: Texture marked for update but image is undefined';
    }
    detail.pageerrors = pageerrors;
    detail.console = consoleLines.slice(-12);
    try { page.off('pageerror', onErr); page.off('console', onConsole); } catch(e) {}
  }
  return { name:scene.name, ok:!!detail.ok && !pageerrors.length, detail };
}

(async () => {
  const server = await ensureServer();
  const results = [];
  const browser = await launchBrowser();
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(25000);
  const page = await ctx.newPage();
  try {
    for (const scene of scenes) {
      const r = await runScene(page, scene);
      results.push(r);
      writeFileSync(join(OUT, 'probe-tactical-visuals.json'), JSON.stringify({ ok:false, partial:true, generatedAt:new Date().toISOString(), results }, null, 2));
    }
  } finally {
    if (server) server.kill();
  }
  const out = { ok:results.every(r => r.ok), generatedAt:new Date().toISOString(), results };
  writeFileSync(join(OUT, 'probe-tactical-visuals.json'), JSON.stringify(out, null, 2));
  console.log('probe-tactical-visuals ok=' + out.ok);
  for (const r of results) {
    console.log((r.ok ? '  ok   ' : '  FAIL ') + r.name + ' -> ' + (r.detail.shot || '') + (r.detail.error ? ' :: ' + r.detail.error : ''));
  }
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch(e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch(e) {}
  process.exit(out.ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
