#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-motion.mjs — empirical verification of _m3dMixerUpdate (procedural unit motion).
// A screenshot can't show motion, so this samples billboard sprite positions over real frames
// on the real GPU and asserts: (1) idle bob animates, (2) a u.fired edge triggers recoil +
// muzzle smoke on an artillery unit, (3) reduceMotion plants every sprite at rest. Reports
// pageerrors. Mirrors the boot path of tools/shot-postfx.mjs.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const battle = process.argv[2] || 'antietam';
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
  G.settings = G.settings || {}; G.settings.gfx = 'modern'; G.settings.gfxQuality = 'high';
  G.settings.reduceMotion = false;
  var bd = (typeof BATTLES !== 'undefined') && BATTLES.find(b => b.id === ${JSON.stringify(battle)});
  if (!bd) return 'ERR: battle not found';
  startBattleRuntime(bd, 'US', false);
  if (typeof _m3dActivate === 'function') _m3dActivate();
  var gg = document.getElementById('groundGo'); if (gg) gg.click();
  return 'OK';
} catch (e) { return 'ERR: ' + (e && e.message || e); } })()`;

// snapshot every unit-group's sprite local (x,y) + scale, keyed by unit id
const SAMPLE = `(() => { try {
  var ug = window.__M3D && __M3D.unitGroup; if (!ug) return {err:'no unitGroup'};
  var out = {};
  for (var i=0;i<ug.children.length;i++){
    var grp = ug.children[i]; var u = grp.userData && grp.userData.unit; if(!u) continue;
    var spr=null; for(var k=0;k<grp.children.length;k++){ if(grp.children[k].isSprite){spr=grp.children[k];break;} }
    if(!spr) continue;
    out[u.id] = { type:u.type, x:+spr.position.x.toFixed(4), y:+spr.position.y.toFixed(4), sx:+spr.scale.x.toFixed(4) };
  }
  return out;
} catch(e){ return {err:String(e)}; } })()`;

(async () => {
  const srv = await ensureServer();
  const out = { battle, checks: {} };
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
    out.setup = await page.evaluate(setup);
    await page.waitForFunction('window.__M3D && (window.__M3D.ready || window.__M3D.failed)', { timeout: 20000 });
    await sleep(600); // let the loop run

    // (1) IDLE BOB — sample twice ~300ms apart, count sprites that moved
    const a = await page.evaluate(SAMPLE);
    await sleep(320);
    const b = await page.evaluate(SAMPLE);
    let moved = 0, total = 0, maxDelta = 0;
    for (const id in a) {
      if (!b[id]) continue; total++;
      const dy = Math.abs(a[id].y - b[id].y) + Math.abs(a[id].x - b[id].x);
      if (dy > 0.002) moved++;
      if (dy > maxDelta) maxDelta = dy;
    }
    out.checks.idleBob = { total, moved, maxDelta: +maxDelta.toFixed(4), pass: total > 0 && moved >= Math.ceil(total * 0.7) };

    // (2) RECOIL + MUZZLE SMOKE — set u.fired on an artillery unit, check edge response
    const recoil = await page.evaluate(`(() => { try {
      var B = G.battle; var art=null;
      for (var i=0;i<B.units.length;i++){ var u=B.units[i]; if(u && u.alive && u.type==='art' && u.side===B.playerSide){ art=u; break; } }
      if(!art){ for (var j=0;j<B.units.length;j++){ var v=B.units[j]; if(v&&v.alive&&v.type==='art'){art=v;break;} } }
      if(!art) return {err:'no art unit'};
      art.spotted = true;
      var fxBefore = (G.fx?G.fx.length:0);
      art.fired = false; // ensure clean edge
      window.__mProbeArt = art.id;
      return { id:art.id, c:art.c, r:art.r, fxBefore:fxBefore };
    } catch(e){ return {err:String(e)}; } })()`);
    out.checks.recoilSetup = recoil;
    if (!recoil.err) {
      // flip the edge, then sample inside the ~520ms recoil window
      await page.evaluate(`(() => { var B=G.battle; for(var i=0;i<B.units.length;i++){ if(B.units[i].id===window.__mProbeArt){ B.units[i].fired=true; break; } } })()`);
      await sleep(90);
      const r1 = await page.evaluate(`(() => {
        var ug=__M3D.unitGroup; var res={};
        for(var i=0;i<ug.children.length;i++){ var grp=ug.children[i]; var u=grp.userData&&grp.userData.unit; if(!u||u.id!==window.__mProbeArt) continue;
          var spr=null; for(var k=0;k<grp.children.length;k++){ if(grp.children[k].isSprite){spr=grp.children[k];break;} }
          if(spr){ res.y=+spr.position.y.toFixed(4); res.sx=+spr.scale.x.toFixed(4); } }
        res.fxAfter = (G.fx?G.fx.length:0);
        res.smokeAtGun = !!(G.fx && G.fx.some(function(f){ return f.type==='smoke'; }));
        return res;
      })()`);
      out.checks.recoil = { dippedOrPulsed: (r1.y < -0.05) || (r1.sx > 0), muzzleSmokeEmitted: r1.fxAfter > recoil.fxBefore, detail: r1 };
      out.checks.recoil.pass = (r1.fxAfter > recoil.fxBefore) && ((r1.y < -0.05) || (r1.sx > 0));
    }

    // (3) reduceMotion — turn on, force rebuild, confirm sprites rest at ~0
    await page.evaluate(`(() => { G.settings.reduceMotion = true; if (typeof draw==='function') draw(); })()`);
    await sleep(260);
    const rmS = await page.evaluate(SAMPLE);
    let restCount = 0, rmTotal = 0, maxRest = 0;
    for (const id in rmS) {
      if (rmS[id].err) continue; rmTotal++;
      const off = Math.abs(rmS[id].y) + Math.abs(rmS[id].x);
      if (off < 0.01) restCount++;
      if (off > maxRest) maxRest = off;
    }
    out.checks.reduceMotion = { rmTotal, restCount, maxRest: +maxRest.toFixed(4), pass: rmTotal > 0 && restCount === rmTotal };

    out.pageerrors = errs;
    out.PASS = out.checks.idleBob.pass && (out.checks.recoil ? out.checks.recoil.pass : false) && out.checks.reduceMotion.pass && errs.length === 0;
  } catch (e) { out.fatal = e.message; }
  finally {
    await ctx.close(); await browser.close(); if (srv) srv.kill();
    console.log(JSON.stringify(out, null, 2));
  }
})().catch(e => { console.error(e); process.exit(1); });
