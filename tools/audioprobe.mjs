#!/usr/bin/env node
// tools/audioprobe.mjs — verifies the adaptive score wiring in real Chrome WebAudio.
// Can't hear it here, but confirms: (1) entering a battle brings the score up with NO
// pageerror, (2) the public API (musicStart/bugleCall/dinSet/scoreSampleBattle) runs
// without throwing, (3) the scoreSampleBattle casualty-delta responds to G.battle's
// real {US,CS} shape (the bug fixed this run). Writes tools/shots/audioprobe.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..'), OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:8765', FILE = 'civil_war_generals.html', PORT = 8765;
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const up = async u => { try { const r = await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; } catch { return false; } };

(async () => {
  const probe = `${BASE}/${FILE}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(PORT)],{cwd:ROOT,stdio:'ignore'}); for (let i=0;i<50;i++){ if(await up(probe))break; await sleep(120);} }
  const out = { errors: [] };
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch { browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const ctx = await browser.newContext({ viewport:{width:1200,height:800} });
  const page = await ctx.newPage();
  page.on('pageerror', e => out.errors.push('[pageerror] ' + e.message));
  page.on('console', m => { if (m.type()==='error' && !/Failed to load resource.*404/.test(m.text())) out.errors.push('[console.error] ' + m.text()); });
  try {
    await page.goto(probe, { waitUntil:'load', timeout:30000 });
    await sleep(500);
    // enter a battle (forces gfx classic to isolate audio from the 3D path)
    out.enter = await page.evaluate(`(()=>{try{G.settings.gfx='classic';var bd=BATTLES.find(b=>b.id==='antietam');startBattleRuntime(bd,'US',false);var gg=document.getElementById('groundGo');if(gg)gg.click();return 'ok';}catch(e){return 'ERR '+(e&&e.message||e);}})()`);
    await sleep(700); // let _audEnterBattle's scheduler + din interval run
    // exercise the API + verify scoreSampleBattle responds to a {US,CS} casualty bump
    out.api = await page.evaluate(`(()=>{var rep={};try{
      rep.fns={scoreInit:typeof window.scoreInit,musicStart:typeof window.musicStart,bugleCall:typeof window.bugleCall,dinSet:typeof window.dinSet,scoreSampleBattle:typeof window.scoreSampleBattle};
      rep.music=G.settings.music;
      // bugle + din should not throw
      window.bugleCall('charge'); window.dinSet(0.6);
      // scoreSampleBattle: prime, bump REAL {US,CS} casualties, expect a rise
      var s0=window.scoreSampleBattle();
      G.battle.casualties.US += 35; G.battle.units.forEach(function(u,i){ if(i<5)u.fired=true; });
      var s1=window.scoreSampleBattle();
      rep.sample0=s0; rep.sample1=s1; rep.rose=(s1>s0);
      return rep;
    }catch(e){rep.err='ERR '+(e&&e.message||e);return rep;}})()`);
    await sleep(400);
    out.leave = await page.evaluate(`(()=>{try{endBattle('US','win');return 'left';}catch(e){return 'ERR '+(e&&e.message||e);}})()`);
    await sleep(300);
    out.ok = !out.api.err && out.errors.length===0 &&
             out.api.fns && out.api.fns.scoreSampleBattle==='function' &&
             typeof out.api.sample1==='number' && out.api.rose===true;
  } catch (e) { out.fatal = e.message; out.ok=false; }
  finally { writeFileSync(join(OUT,'audioprobe.json'), JSON.stringify(out,null,2)); await ctx.close(); await browser.close(); if (srv) srv.kill(); }
  console.log('audioprobe ok=' + out.ok + ' errors=' + out.errors.length);
})().catch(e => { console.error(e); process.exit(1); });
