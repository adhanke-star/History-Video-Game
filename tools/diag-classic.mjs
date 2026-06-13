#!/usr/bin/env node
// Diagnostic: does the Classic 2D renderer actually paint the #map canvas?
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const up = async u => { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok; } catch { return false; } };
const srv = (await up(`${cfg.baseUrl}/${cfg.file}`)) ? null : spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
if (srv) for (let i = 0; i < 50; i++) { if (await up(`${cfg.baseUrl}/${cfg.file}`)) break; await sleep(120); }
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: cfg.viewport });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 100)); });
await page.goto(`${cfg.baseUrl}/${cfg.file}`, { waitUntil: 'load' });
await sleep(400);
const setup = await page.evaluate(`(()=>{try{
  G.settings=G.settings||{}; G.settings.gfx='classic';
  var bd=BATTLES.find(b=>b.id==='antietam'); startBattleRuntime(bd,'US',false);
  if(typeof _m3dDeactivate==='function') _m3dDeactivate();
  var gg=document.getElementById('groundGo'); if(gg) gg.click();
  if(typeof draw==='function') draw();
  return 'OK';
}catch(e){return 'ERR '+e.message;}})()`);
await sleep(1200);
const diag = await page.evaluate(`(()=>{ try {
  var m=document.getElementById('map'); var info={setup:1};
  if(!m) return {err:'no #map'};
  info.mapTag=m.tagName; info.w=m.width; info.h=m.height; info.cw=m.clientWidth; info.ch=m.clientHeight;
  info.display=getComputedStyle(m).display; info.vis=getComputedStyle(m).visibility;
  info.gfx=G.settings.gfx; info.mode=G.mode; info.hasBattle=!!G.battle;
  info.drawFn=(typeof draw); info.m3dActive=(typeof _m3dModern==='function'?_m3dModern():'na');
  // sample canvas pixels for non-blank content
  if(m.tagName==='CANVAS'){ try{ var ctx=m.getContext('2d'); var d=ctx.getImageData(m.width/2,m.height/2,1,1).data; info.centerPx=[d[0],d[1],d[2],d[3]];
    // count non-uniform pixels on a coarse grid
    var nb=0,N=0; for(var y=20;y<m.height-20;y+=40){for(var x=20;x<m.width-20;x+=40){var p=ctx.getImageData(x,y,1,1).data;N++; if(p[0]>8||p[1]>8||p[2]>8)nb++;}} info.grid=N; info.nonBlank=nb; }catch(e){info.pxErr=e.message;} }
  return info;
} catch(e){ return {err:String(e)}; } })()`);
console.log('setup:', setup);
console.log('diag:', JSON.stringify(diag));
console.log('errors:', errs.slice(0, 8));
await browser.close(); if (srv) srv.kill();
