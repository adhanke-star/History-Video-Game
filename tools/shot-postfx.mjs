#!/usr/bin/env node
// tools/shot-postfx.mjs — focused real-GPU verification of the post-processing pipeline.
// Waits for the EffectComposer to actually build (post scripts load async from the CDN),
// then screenshots the TRUE full-stack frame. Reports GL renderer, composer pass list,
// postLoaded, and any pageerrors.
//
//   node tools/shot-postfx.mjs [battle] [tier]
//     battle: a BATTLES id (default antietam)   tier: auto|high|low (default auto)
//
// Output: tools/shots/postfx-<battle>-<tier>.png + .log
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
const battle = process.argv[2] || 'antietam';
const tier = process.argv[3] || 'auto';
const wx = process.argv[4] || '';   // force weather: rain|snow|fog|clear (optional)
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

const setup = `(() => { try {
  if (typeof G === 'undefined') return 'ERR: G undefined';
  G.settings = G.settings || {};
  G.settings.gfx = 'modern';
  G.settings.gfxQuality = ${JSON.stringify(tier)};
  var bd = (typeof BATTLES !== 'undefined') && BATTLES.find(b => b.id === ${JSON.stringify(battle)});
  if (!bd) return 'ERR: battle not found';
  startBattleRuntime(bd, 'US', false);
  if (${JSON.stringify(!!wx)} && G.battle) { G.battle.wx = ${JSON.stringify(wx)}; if (typeof _m3dApplyAtmosphere === 'function') { try { _m3dApplyAtmosphere(); } catch(e){} } }
  if (typeof _m3dActivate === 'function') _m3dActivate();
  var gg = document.getElementById('groundGo'); if (gg) gg.click();
  return 'OK';
} catch (e) { return 'ERR: ' + (e && e.message || e); } })()`;

(async () => {
  const srv = await ensureServer();
  const log = [];
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: false, args: GPU_ARGS }); }
  catch { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false, args: GPU_ARGS }); }
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => log.push(`[console.${m.type()}] ${m.text()}`));
  page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));
  let verdict = 'unknown';
  try {
    await page.goto(`${cfg.baseUrl}/${cfg.file}`, { waitUntil: 'load', timeout: 30000 });
    await sleep(400);
    log.push(`[setup] ${await page.evaluate(setup)}`);
    await page.waitForFunction('window.__M3D && (window.__M3D.ready || window.__M3D.failed)', { timeout: 20000 });
    // poll until the composer builds (post scripts load async), up to ~15s
    let built = false;
    for (let i = 0; i < 75; i++) {
      const st = await page.evaluate('({loaded:!!(window.__M3D&&window.__M3D.postLoaded), comp:!!(window.__M3D&&window.__M3D.composer), tier:window.__M3D&&window.__M3D.postTier})');
      if (st.comp || st.tier === 'low') { built = true; break; }
      await sleep(200);
    }
    const info = await page.evaluate(`(()=>{ try {
      var m = window.__M3D || {};
      var passes = (m.composer && m.composer.passes) ? m.composer.passes.map(function(p){return p.constructor && p.constructor.name || 'Pass';}) : [];
      var gl; try{var c=document.createElement('canvas');var g=c.getContext('webgl2')||c.getContext('webgl');var dbg=g.getExtension('WEBGL_debug_renderer_info');gl=dbg?g.getParameter(dbg.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);}catch(e){gl='glERR';}
      return { ready:!!m.ready, failed:!!m.failed, postLoaded:!!m.postLoaded, postTier:m.postTier||null, toneMapping:(m.renderer&&m.renderer.toneMapping), passes:passes, gl:gl };
    } catch(e){ return {err:String(e)}; } })()`);
    log.push('[info] ' + JSON.stringify(info));
    verdict = info.failed ? 'FAILED' : (info.composer === false && info.postTier !== 'low' ? 'no-composer' : 'ok');
    if (process.argv[5] === 'fx') {
      // inject fire/smoke events INTO THE RUNNING LOOP so smoke banks seed live, then let them grow
      const seeded = await page.evaluate(`(()=>{ try { var n=0; if (typeof emitFX==='function' && G.battle && G.battle.units){ for(var i=0;i<G.battle.units.length && n<16;i++){var u=G.battle.units[i]; if(!u||!u.alive)continue; emitFX('fire',u.c,u.r,null); emitFX('smoke',u.c,u.r,null); n++; } } return n; } catch(e){ return 'ERR '+e.message; } })()`);
      log.push('[fx-seed] ' + seeded);
      await sleep(2600); // banks spawn + grow toward peak opacity
      const banks = await page.evaluate('(window.__M3D&&window.__M3D.banks)?window.__M3D.banks.length:0');
      log.push('[banks] live=' + banks);
    }
    await sleep(900); // let a few composed frames settle
    await page.screenshot({ path: join(OUT, `postfx-${battle}-${tier}${wx?'-'+wx:''}.png`), fullPage: false });
    log.push(`[shot] postfx-${battle}-${tier}.png  built=${built}`);
  } catch (e) { verdict = 'ERROR: ' + e.message; log.push('[err] ' + e.message); }
  finally {
    writeFileSync(join(OUT, `postfx-${battle}-${tier}${wx?'-'+wx:''}.log`), `# ${battle}/${tier} — ${verdict}\n` + log.join('\n') + '\n');
    await ctx.close(); await browser.close(); if (srv) srv.kill();
    const errs = log.filter(l => l.startsWith('[pageerror]')).length;
    console.log(JSON.stringify({ battle, tier, wx, verdict, pageerrors: errs }));
  }
})().catch(e => { console.error(e); process.exit(1); });
