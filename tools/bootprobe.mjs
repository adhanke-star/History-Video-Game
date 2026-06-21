#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/bootprobe.mjs — verifies the DEFAULT boot path (no forced gfx override).
// Confirms: (1) a fresh profile defaults to Modern, (2) the menu boots with no
// pageerror, (3) entering a battle brings up the 3D renderer (__M3D.ready) cleanly.
// Writes tools/shots/bootprobe.json (read this) + bootprobe-battle.png.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:8765', FILE = 'civil_war_generals.html', PORT = 8765;
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const up = async u => { try { const r = await fetch(u, {method:'HEAD'}); return r.ok||r.status===200; } catch { return false; } };

(async () => {
  const probe = `${BASE}/${FILE}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:ROOT,stdio:'ignore'}); for (let i=0;i<50;i++){ if(await up(probe))break; await sleep(120);} }
  const out = { errors: [], steps: {} };
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch { browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const ctx = await browser.newContext({ viewport:{width:1366,height:850}, deviceScaleFactor:1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => out.errors.push('[pageerror] ' + e.message));
  page.on('console', m => { if (m.type()==='error') out.errors.push('[console.error] ' + m.text()); });
  try {
    await page.goto(probe, { waitUntil:'load', timeout:60000 }); // headless-swiftshader 3D boot is slow; was 30s (too tight, flaky false-reds)
    await sleep(600); // boot + the two setTimeout(0) boot hooks fire
    // (1) default took? (2) menu booted with no throw?
    // NB: the game declares G as a lexical global (let/const), so it is NOT on window —
    // reference it by bare name (it is in scope inside page.evaluate), never window.G.
    out.steps.menu = await page.evaluate(`(()=>({gfx:(typeof G!=='undefined'&&G.settings&&G.settings.gfx)||'?', m3dReady:!!(window.__M3D&&__M3D.ready), m3dFailed:!!(window.__M3D&&__M3D.failed), hasMenu:!!document.querySelector('body')}))()`);
    // (3) enter a battle on the DEFAULT renderer (do NOT set gfx — let the default ride)
    out.steps.enter = await page.evaluate(`(()=>{try{var bd=BATTLES.find(b=>b.id==='antietam');if(!bd)return 'no battle';startBattleRuntime(bd,'US',false);if(G.settings.gfx==='modern'&&typeof _m3dActivate==='function')_m3dActivate();var gg=document.getElementById('groundGo');if(gg)gg.click();return 'entered gfx='+G.settings.gfx;}catch(e){return 'ERR '+(e&&e.message||e);}})()`);
    try { await page.waitForFunction('window.__M3D && (window.__M3D.ready || window.__M3D.failed)', { timeout:20000 }); } catch {}
    await sleep(1400);
    out.steps.battle = await page.evaluate(`(()=>({gfx:G.settings.gfx, m3dReady:!!(window.__M3D&&__M3D.ready), m3dFailed:!!(window.__M3D&&__M3D.failed), units:(G.battle&&G.battle.units&&G.battle.units.length)||0}))()`);
    await page.screenshot({ path: join(OUT,'bootprobe-battle.png'), fullPage:false });
    // The ~7 asset 404s (absent .glb/HDRI under assets/3d/) are the EXPECTED one-time probe,
    // not real errors — exclude them from the gate; only genuine errors/pageerrors count.
    out.realErrors = out.errors.filter(e => !/Failed to load resource.*404/.test(e));
    out.ok = (out.steps.battle.gfx === 'modern') && out.realErrors.length === 0 && out.steps.battle.m3dReady === true;
  } catch (e) { out.fatal = e.message; out.ok = false; }
  finally {
    writeFileSync(join(OUT,'bootprobe.json'), JSON.stringify(out, null, 2));
    await ctx.close(); await browser.close(); if (srv) srv.kill();
  }
  console.log('bootprobe ok=' + out.ok + ' errors=' + out.errors.length);
})().catch(e => { console.error(e); process.exit(1); });
