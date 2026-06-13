#!/usr/bin/env node
// tools/shot-ui.mjs — boots modern, selects a player unit so the orders panel + info panel +
// lead-badge render, then screenshots the full HUD. Verifies the M3D_UI_SKIN2 art pass
// (drawn order-icons, engraved frames, portrait mat). Reports pageerrors + which panels showed.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const battle = process.argv[2] || 'gettysburg';
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
  G.settings = G.settings || {}; G.settings.gfx='modern'; G.settings.gfxQuality='high';
  var bd = BATTLES.find(b=>b.id===${JSON.stringify(battle)});
  if(!bd) return 'ERR no battle';
  startBattleRuntime(bd,'US',false);
  if (typeof _m3dActivate==='function') _m3dActivate();
  var gg=document.getElementById('groundGo'); if(gg) gg.click();
  return 'OK';
} catch(e){ return 'ERR '+(e&&e.message||e); } })()`;

const selectUnit = `(() => { try {
  var B=G.battle; var side=B.playerSide||'US'; var u=null;
  // prefer a unit WITH a leader so the lead-badge + portrait render
  for (var i=0;i<B.units.length;i++){ var v=B.units[i]; if(v&&v.alive&&v.side===side&&v.leader&&v.leader.name){ u=v; break; } }
  if(!u) for (var j=0;j<B.units.length;j++){ var w=B.units[j]; if(w&&w.alive&&w.side===side){ u=w; break; } }
  if(!u) return 'ERR no player unit';
  if (typeof onHexClick==='function') onHexClick(u.c,u.r);
  if (!G.sel && typeof selectUnit==='function') selectUnit(u);
  if (!G.sel) { G.sel=u; }
  if (typeof refreshUI==='function') refreshUI();
  if (typeof draw==='function') draw();
  var orders=document.querySelector('#obMove,#obFire,.obtn');
  var ordersVisible = !!(orders && orders.offsetParent !== null);
  var badge=document.querySelector('.lead-badge');
  return JSON.stringify({ sel:!!G.sel, leader: u.leader&&u.leader.name||null, ordersVisible:ordersVisible, badge:!!badge });
} catch(e){ return 'ERR '+(e&&e.message||e); } })()`;

(async () => {
  const srv = await ensureServer();
  const log = [];
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: false, args: GPU_ARGS }); }
  catch { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false, args: GPU_ARGS }); }
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  try {
    await page.goto(`${cfg.baseUrl}/${cfg.file}`, { waitUntil: 'load', timeout: 30000 });
    await sleep(400);
    log.push('[setup] ' + await page.evaluate(setup));
    await page.waitForFunction('window.__M3D && (window.__M3D.ready || window.__M3D.failed)', { timeout: 20000 });
    await sleep(600);
    // let portrait photos warm so the badge shows a photo not the engraving
    for (let i = 0; i < 30; i++) { const t = await page.evaluate(`window.portraitFor?window.portraitFor('Lee','CS',{}).slice(0,15):''`); if (t.indexOf('image/jpeg') > 0) break; await sleep(150); }
    log.push('[select] ' + await page.evaluate(selectUnit));
    await sleep(900);
    // capture the info panel (holds the lead-badge + portrait)
    const irect = await page.evaluate(`(()=>{var e=document.getElementById('info');if(!e)return null;var r=e.getBoundingClientRect();return {x:Math.max(0,r.left-6),y:Math.max(0,r.top-6),width:Math.min(320,r.width+12),height:Math.min(520,r.height+12)};})()`);
    if (irect && irect.width > 4) { await page.screenshot({ path: join(OUT, `ui-${battle}-info.png`), clip: irect }); log.push('[info-rect] ' + JSON.stringify(irect)); }
    await page.screenshot({ path: join(OUT, `ui-${battle}.png`), fullPage: false });
    // crop tightly to the orders container (where the drawn icons live)
    const rect = await page.evaluate(`(() => {
      var b=document.querySelector('#obMove'); if(!b) return null;
      var p=b.parentElement || b; var r=p.getBoundingClientRect();
      return { x:Math.max(0,r.left-10), y:Math.max(0,r.top-10), width:Math.min(420,r.width+20), height:Math.min(360,r.height+20) };
    })()`);
    if (rect && rect.width > 4 && rect.height > 4) {
      await page.screenshot({ path: join(OUT, `ui-${battle}-orders.png`), clip: rect });
      log.push('[orders-rect] ' + JSON.stringify(rect));
    }
  } catch (e) { log.push('[err] ' + e.message); }
  finally {
    await ctx.close(); await browser.close(); if (srv) srv.kill();
    console.log(JSON.stringify({ battle, pageerrors: errs.length, log }));
  }
})().catch(e => { console.error(e); process.exit(1); });
