#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/shot.mjs — one-command visual-regression harness for The Civil War (Vol. I).
// Drives the locally-installed Google Chrome via playwright-core (NO browser download),
// software-WebGL via SwiftShader so the Modern (Three.js) renderer produces deterministic
// pixels even on a headless/GPU-less box. Reads named scenes from tools/shots.json.
//
//   node tools/shot.mjs                 # shoot every scene
//   node tools/shot.mjs modern-antietam # shoot one (or several) by name
//
// Output: tools/shots/<name>.png  +  tools/shots/<name>.log  (console + page errors + verdict)
// If a static server isn't already serving baseUrl, one is spawned for the run and torn down.

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
if (!scenes.length) {
  console.error('No matching scenes. Available:', cfg.scenes.map(s => s.name).join(', '));
  process.exit(2);
}

// SwiftShader software-GL flags — make WebGL render without a real GPU.
const GL_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--disable-dev-shm-usage',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function isServerUp(url) {
  try { const r = await fetch(url, { method: 'HEAD' }); return r.ok || r.status === 200; }
  catch { return false; }
}

async function ensureServer() {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  if (await isServerUp(probe)) return null; // reuse whatever's already serving
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { if (await isServerUp(probe)) return srv; await sleep(120); }
  srv.kill();
  throw new Error(`Could not start static server on :${cfg.port}`);
}

function buildSetup(scene) {
  // Runs in page context. Returns a status string; throws are captured by caller.
  return `(() => {
    try {
      if (typeof G === 'undefined') return 'ERR: G undefined';
      G.settings = G.settings || {};
      G.settings.gfx = ${JSON.stringify(scene.gfx)};
      if (${JSON.stringify(!!scene.tier)} && ${JSON.stringify(scene.tier)}) G.settings.gfxQuality = ${JSON.stringify(scene.tier)};
      var bd = (typeof BATTLES !== 'undefined') && BATTLES.find(b => b.id === ${JSON.stringify(scene.battle)});
      if (!bd) return 'ERR: battle not found: ' + ${JSON.stringify(scene.battle)};
      startBattleRuntime(bd, ${JSON.stringify(scene.side)}, false);
      if (G.settings.gfx === 'modern' && typeof _m3dActivate === 'function') _m3dActivate();
      else if (G.settings.gfx !== 'modern' && typeof _m3dDeactivate === 'function') _m3dDeactivate(); // modern is the boot default → un-hide #map for Classic shots
      // Dismiss the pre-battle "The Ground" briefing overlay so the battlefield is visible.
      var gg = document.getElementById('groundGo');
      if (gg) gg.click();
      else { if (typeof closeSheet === 'function') closeSheet(); if (typeof showHud === 'function') showHud(); if (typeof draw === 'function') draw(); }
      return 'OK';
    } catch (e) { return 'ERR: ' + (e && e.message || e); }
  })()`;
}

async function shoot(browser, scene) {
  const log = [];
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => log.push(`[console.${m.type()}] ${m.text()}`));
  page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', r => log.push(`[requestfailed] ${r.url()} — ${r.failure()?.errorText || ''}`));

  const url = `${cfg.baseUrl}/${cfg.file}`;
  let verdict = 'unknown';
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await sleep(300); // let the menu boot
    const status = await page.evaluate(buildSetup(scene));
    log.push(`[setup] ${status}`);

    if (scene.gfx === 'modern') {
      try {
        await page.waitForFunction(
          'window.__M3D && (window.__M3D.ready || window.__M3D.failed)',
          { timeout: 20000 }
        );
        const m = await page.evaluate('({ready: !!window.__M3D.ready, failed: !!window.__M3D.failed})');
        verdict = m.ready ? 'modern:ready' : (m.failed ? 'modern:FAILED(reverted to classic)' : 'modern:unknown');
        log.push(`[__M3D] ready=${m.ready} failed=${m.failed}`);
      } catch (e) {
        verdict = 'modern:TIMEOUT (never ready/failed)';
        log.push(`[__M3D] timeout waiting for ready/failed: ${e.message}`);
      }
    } else {
      verdict = 'classic';
    }

    // Optional per-scene camera/state tweak run in-page right before the shot
    // (e.g. dolly the 3D camera in for a hero close-up of the painted units).
    if (scene.postEval) {
      const pr = await page.evaluate(scene.postEval);
      log.push(`[postEval] ${pr}`);
    }

    await sleep(scene.settle || 1000);
    const png = join(OUT, `${scene.name}.png`);
    await page.screenshot({ path: png, fullPage: false });
    log.push(`[shot] ${png}`);
  } catch (e) {
    verdict = 'ERROR: ' + e.message;
    log.push(`[fatal] ${e.message}`);
  } finally {
    writeFileSync(join(OUT, `${scene.name}.log`), `# ${scene.name} — ${verdict}\n` + log.join('\n') + '\n');
    await ctx.close();
  }
  return { name: scene.name, verdict };
}

(async () => {
  const srv = await ensureServer();
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL_ARGS });
  } catch (e) {
    // Fallback: explicit macOS Chrome path if channel autodetect fails.
    browser = await chromium.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true, args: GL_ARGS,
    });
  }
  const results = [];
  for (const scene of scenes) results.push(await shoot(browser, scene));
  await browser.close();
  if (srv) srv.kill();

  console.log('\n=== shot results ===');
  for (const r of results) console.log(`${r.name.padEnd(22)} ${r.verdict}`);
  console.log(`\nPNGs + logs in ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
