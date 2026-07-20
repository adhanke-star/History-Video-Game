#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-portraits.mjs — verifies the PD-photo portrait layer. Boots modern, waits for the
// photo cache to warm, then (1) classifies portraitFor() output per leader as PHOTO (jpeg) vs
// ENGRAVING (png), (2) renders a labeled montage of real names for a visual read. Reports
// pageerrors. The montage PNG is read by a human/agent to confirm correct faces in period frames.
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
const GPU_ARGS = ['--ignore-gpu-blocklist', '--enable-gpu', '--enable-webgl', '--use-angle=metal'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const up = async u => { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } };
async function ensureServer() {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { if (await up(probe)) return srv; await sleep(120); }
  srv.kill(); throw new Error('server'); }

// curated read list: [displayName, side, label]
const NAMES = [
  ['Lee','CS'],['Grant','US'],['Jackson','CS'],['Anderson','US'],['Anderson','CS'],['Custer','US'],
  ['Bragg','CS'],['Pemberton','CS'],['Hatcher','US'],['Welby','CS'],['Ashcombe','US'],['Marchmont','CS']
];

const setup = `(() => { try {
  G.settings=G.settings||{}; G.settings.gfx='modern'; G.settings.gfxQuality='high';
  var bd=BATTLES.find(b=>b.id==='antietam'); startBattleRuntime(bd,'US',false);
  if (typeof _m3dActivate==='function') _m3dActivate();
  var gg=document.getElementById('groundGo'); if(gg) gg.click();
  return 'OK';
} catch(e){ return 'ERR '+(e&&e.message||e); } })()`;

const buildMontage = (names) => `(() => { try {
  var list = ${JSON.stringify(names)};
  var host = document.createElement('div');
  host.id='__portMontage';
  host.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#140d06;padding:10px;display:flex;flex-wrap:wrap;gap:8px;width:760px;font-family:Georgia,serif';
  var cls={};
  for (var i=0;i<list.length;i++){
    var nm=list[i][0], sd=list[i][1];
    var url = window.portraitFor ? window.portraitFor(nm, sd, {cmd:false,named:false}) : '';
    cls[nm+'/'+sd] = url.slice(0,15);
    var cell=document.createElement('div'); cell.style.cssText='display:flex;flex-direction:column;align-items:center;color:#c9a85f;font-size:11px;width:110px';
    var img=document.createElement('img'); img.src=url; img.width=96; img.height=120; img.style.cssText='border:1px solid #000';
    var cap=document.createElement('div'); cap.textContent=nm+' ('+sd+')'; cap.style.marginTop='3px';
    var kind=document.createElement('div'); kind.textContent = url.indexOf('image/jpeg')>0?'PHOTO':'engraving'; kind.style.cssText='font-size:9px;color:'+(url.indexOf('image/jpeg')>0?'#7fc77f':'#a08050');
    cell.appendChild(img); cell.appendChild(cap); cell.appendChild(kind); host.appendChild(cell);
  }
  document.body.appendChild(host);
  return cls;
} catch(e){ return {err:String(e)}; } })()`;

(async () => {
  const srv = await ensureServer();
  const out = {}; let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: false, args: GPU_ARGS }); }
  catch { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false, args: GPU_ARGS }); }
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  try {
    await page.goto(`${cfg.baseUrl}/${cfg.file}`, { waitUntil: 'load', timeout: 30000 });
    await sleep(400);
    out.setup = await page.evaluate(setup);
    await page.waitForFunction('window.__M3D && (window.__M3D.ready||window.__M3D.failed)', { timeout: 20000 });
    // poll warm: portraitFor('Lee','CS') becomes a jpeg once the photo is cached
    let warm = false;
    for (let i = 0; i < 40; i++) {
      const t = await page.evaluate(`window.portraitFor?window.portraitFor('Lee','CS',{}).slice(0,15):''`);
      if (t.indexOf('image/jpeg') > 0) { warm = true; break; }
      await sleep(150);
    }
    out.warm = warm;
    out.classify = await page.evaluate(buildMontage(NAMES));
    await sleep(500);
    await page.screenshot({ path: join(OUT, 'portraits-montage.png'), clip: { x: 0, y: 0, width: 760, height: 290 } });
    // count how many of the curated names came back as photos
    out.photoCount = Object.values(out.classify || {}).filter(v => String(v).indexOf('image/jpeg') > 0).length;
    // D483: THE FLAG-CARD DEFAULT — no-photo people get a side-themed flag card, never the egg engraving.
    out.flag = await page.evaluate(`(() => { try {
      var pf = window.portraitFor;
      var chain = typeof pf === 'function' && pf._cwFlag === true && pf._prev && typeof window.cwFlagCardFor === 'function';
      var gBefore = (typeof G !== 'undefined') ? G.mode : null;
      var prevOut = chain ? pf._prev('Zzq Nobodyhere','US') : '';
      var outer   = chain ? pf('Zzq Nobodyhere','US') : '';
      var cardUS  = chain ? window.cwFlagCardFor('US','Zzq Nobodyhere') : '';
      var cardCS  = chain ? window.cwFlagCardFor('CS','Zzq Nobodyhere') : '';
      var cardUS2 = chain ? window.cwFlagCardFor('US','Zzq Nobodyhere') : '';
      var cardOther = chain ? window.cwFlagCardFor('US','Aa Bb') : '';
      var lee = chain ? pf('Lee','CS',{}) : '';
      return {
        chain: chain,
        cardReplacesEgg: !!(outer && prevOut && outer !== prevOut && outer === cardUS && outer.indexOf('data:image/png') === 0),
        sideDistinct: !!(cardUS && cardCS && cardUS !== cardCS),
        initialsVary: !!(cardOther && cardOther !== cardUS),
        cached: cardUS === cardUS2,
        photoNeverDowngraded: typeof lee === 'string' && lee.indexOf('data:image/jpeg') === 0,
        pure: (typeof G === 'undefined') || G.mode === gBefore
      };
    } catch(e){ return { err: String(e && e.message || e) }; } })()`);
    out.pageerrors = errs;
  } catch (e) { out.fatal = e.message; }
  finally {
    await ctx.close(); await browser.close(); if (srv) srv.kill();
    // D237 (E15 follow-through): write the shots artifact the vet-no-regression freshness gate
    // requires of every enrolled probe. ok = no fatal, no pageerrors, and the montage actually
    // classified at least one PD photo (a photoCount of 0 previously passed silently on exit code).
    // D483: the flag-card teeth join the ok conjunction — chain installed, the egg replaced by a
    // side-distinct, initials-varying, cached PNG card, real photos never downgraded, pure.
    const fl = out.flag || {};
    out.flagOk = fl.chain === true && fl.cardReplacesEgg === true && fl.sideDistinct === true
      && fl.initialsVary === true && fl.cached === true && fl.photoNeverDowngraded === true && fl.pure === true;
    out.ok = !out.fatal && (!out.pageerrors || out.pageerrors.length === 0) && (out.photoCount > 0) && out.flagOk;
    try { writeFileSync(join(OUT, 'probe-portraits.json'), JSON.stringify(out, null, 1)); } catch {}
    console.log(JSON.stringify(out, null, 1));
    if (!out.ok) process.exitCode = 1;
  }
})().catch(e => { console.error(e); process.exit(1); });
