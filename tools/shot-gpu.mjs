#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/shot-gpu.mjs — REAL-GPU visual verification (sibling to shot.mjs).
// shot.mjs uses SwiftShader software-WebGL (deterministic but can't render bloom/SSAO/
// HDRI/PBR faithfully). THIS harness launches a GPU-backed Chrome on the Mac (Metal via
// ANGLE) so screenshots show the TRUE high-end look — bloom, ambient occlusion, tone-mapping,
// image-based lighting, post-processing. Costs nothing but Claude time; uses NO asset-gen credits.
//
//   node tools/shot-gpu.mjs                  # all scenes, real GPU
//   node tools/shot-gpu.mjs modern-antietam  # one/several by name
//
// NOTE: this opens a real (headed) Chrome window briefly on your screen for each scene —
// that's what gives us hardware rendering. Output: tools/shots/gpu-<name>.png + .log
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const wanted = process.argv.slice(2);
const scenes = wanted.length ? cfg.scenes.filter(s => wanted.includes(s.name)) : cfg.scenes;
if (!scenes.length) { console.error('No matching scenes.'); process.exit(2); }

// GPU args — the opposite of shot.mjs: let Chrome use the real Metal/ANGLE GPU backend.
const GPU_ARGS = ['--ignore-gpu-blocklist', '--enable-gpu', '--enable-webgl', '--use-angle=metal'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const up = async u => { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } };

async function ensureServer() {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { if (await up(probe)) return srv; await sleep(120); }
  srv.kill(); throw new Error(`server not up on :${cfg.port}`);
}

function buildSetup(scene) {
  return `(() => { try {
    if (typeof G === 'undefined') return 'ERR: G undefined';
    G.settings = G.settings || {};
    G.settings.gfx = ${JSON.stringify(scene.gfx)};
    if (${JSON.stringify(!!scene.tier)} && ${JSON.stringify(scene.tier)}) G.settings.gfxQuality = ${JSON.stringify(scene.tier)};
    var bd = (typeof BATTLES !== 'undefined') && BATTLES.find(b => b.id === ${JSON.stringify(scene.battle)});
    if (!bd) return 'ERR: battle not found';
    startBattleRuntime(bd, ${JSON.stringify(scene.side)}, false);
    if (G.settings.gfx === 'modern' && typeof _m3dActivate === 'function') _m3dActivate();
    else if (G.settings.gfx !== 'modern' && typeof _m3dDeactivate === 'function') _m3dDeactivate(); // modern is the boot default → un-hide #map for Classic shots
    var gg = document.getElementById('groundGo'); if (gg) gg.click();
    else { if (typeof closeSheet === 'function') closeSheet(); if (typeof showHud === 'function') showHud(); if (typeof draw === 'function') draw(); }
    return 'OK';
  } catch (e) { return 'ERR: ' + (e && e.message || e); } })()`;
}

async function shoot(browser, scene) {
  const log = [];
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => log.push(`[console.${m.type()}] ${m.text()}`));
  page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));
  const url = `${cfg.baseUrl}/${cfg.file}`;
  let verdict = 'unknown';
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await sleep(400);
    log.push(`[setup] ${await page.evaluate(buildSetup(scene))}`);
    if (scene.gfx === 'modern') {
      try {
        await page.waitForFunction('window.__M3D && (window.__M3D.ready || window.__M3D.failed)', { timeout: 20000 });
        const m = await page.evaluate('({ready:!!window.__M3D.ready, failed:!!window.__M3D.failed})');
        verdict = m.ready ? 'modern:ready' : (m.failed ? 'modern:FAILED' : 'modern:unknown');
      } catch (e) { verdict = 'modern:TIMEOUT'; }
    } else verdict = 'classic';
    // report the actual GL renderer string so we can confirm we're on the GPU, not SwiftShader
    const glInfo = await page.evaluate(`(()=>{try{var c=document.createElement('canvas');var gl=c.getContext('webgl2')||c.getContext('webgl');var dbg=gl.getExtension('WEBGL_debug_renderer_info');return dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);}catch(e){return 'glinfo ERR '+e.message;}})()`);
    log.push(`[GL renderer] ${glInfo}`);
    if (scene.postEval) log.push(`[postEval] ${await page.evaluate(scene.postEval)}`);
    await sleep(scene.settle || 1000);
    await page.screenshot({ path: join(OUT, `gpu-${scene.name}.png`), fullPage: false });
    log.push(`[shot] gpu-${scene.name}.png`);
  } catch (e) { verdict = 'ERROR: ' + e.message; }
  finally { writeFileSync(join(OUT, `gpu-${scene.name}.log`), `# ${scene.name} — ${verdict}\n` + log.join('\n') + '\n'); await ctx.close(); }
  return { name: scene.name, verdict };
}

(async () => {
  const srv = await ensureServer();
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: false, args: GPU_ARGS }); }
  catch { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false, args: GPU_ARGS }); }
  const results = [];
  for (const scene of scenes) results.push(await shoot(browser, scene));
  await browser.close();
  if (srv) srv.kill();
  console.log('\n=== GPU shot results ===');
  for (const r of results) console.log(`${r.name.padEnd(22)} ${r.verdict}`);
})().catch(e => { console.error(e); process.exit(1); });
