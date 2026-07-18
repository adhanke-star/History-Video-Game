#!/usr/bin/env node
/* record-cpu-session.mjs — D454/D455 session deliverable for Aaron: a recorded
   CPU-vs-CPU (autoBoth) Bull Run battle with periodic stills and a feature log.
   Read-only driver over the shipped game: launches via the same fldLaunchSandbox
   seam the probes use (autoBoth = both sides AI, the documented demo mode;
   autoPause:false per the D453 harness note), records the page via Playwright's
   recordVideo, captures stills at named beats, and polls sim state into a JSON
   sidecar. Touches NO game state beyond a normal play session; never runs inside
   the vet battery. Output: tools/shots/session-video/*.webm (gitignored),
   tools/shots/cpu-vs-cpu-*.png stills, tools/shots/cpu-vs-cpu-log.json. */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tools', 'shots');
const VID = join(OUT, 'session-video');
mkdirSync(VID, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const URLBASE = 'http://127.0.0.1:8765';

async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok; }catch{ return false; } }

const log = { startedAt: new Date().toISOString(), scenario: 'bullrun1', mode: 'autoBoth (CPU vs CPU)', beats: [] };
function note(name, v){ log.beats.push({ name, v }); console.log('  * ' + name + (v ? ' :: ' + JSON.stringify(v).slice(0, 220) : '')); }

(async () => {
  let srv = null;
  const url = URLBASE + '/civil_war_generals.html';
  if (!(await up(url))) {
    srv = spawn('python3', ['-m', 'http.server', '8765'], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 60 && !(await up(url)); i++) await sleep(250);
  }
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal'] }); }
  catch { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true }); }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: VID, size: { width: 1280, height: 800 } } });
  const page = await ctx.newPage();
  const pageerrors = [];
  page.on('pageerror', e => pageerrors.push(String(e && e.message || e)));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.fldLaunchSandbox === 'function' && typeof window.fldScenarioRegistry === 'function' && !!window.fldScenarioRegistry().bullrun1, null, { timeout: 60000 });
  note('game booted');

  async function poll() {
    return JSON.parse(await page.evaluate(`(() => {
      var F = __FIELD || {};
      var men = { US: 0, CS: 0 }, units = { US: 0, CS: 0 }, routing = 0, xf = 0;
      (F.units || []).forEach(function(u){ if (!u) return; units[u.side] = (units[u.side]||0)+1; men[u.side] = (men[u.side]||0) + Math.max(0, u.men|0); if (u.routed || u.morale === 'routed') routing++; if (u._xfActive) xf++; });
      return JSON.stringify({ t: Math.round(F.t||0), phase: F.phase, winner: F.winner, speed: F.speed, men: men, units: units, routing: routing, xfActive: xf });
    })()`));
  }

  // ---- Segment 1: 3D, real time ----
  await page.evaluate(`(() => { fldLaunchSandbox({ renderer: '3d', scenario: 'bullrun1', autoBoth: true, autoPause: false, playerSide: 'US', seed: 47 }); __FIELD.phase = 'battle'; __FIELD.paused = false; })()`);   // probe idiom: enter the battle phase directly (live play clicks Begin)
  await sleep(4000);
  note('3D launch (opening lines)', await poll());
  await page.screenshot({ path: join(OUT, 'cpu-vs-cpu-01-3d-opening.png'), timeout: 60000 });
  await sleep(25000);
  note('3D early fight, 1x speed', await poll());
  await page.screenshot({ path: join(OUT, 'cpu-vs-cpu-02-3d-contact.png'), timeout: 60000 });
  await page.evaluate(`(() => { __FIELD.speed = 3; })()`);
  await sleep(30000);
  note('3D mid-battle, 3x speed', await poll());
  await page.screenshot({ path: join(OUT, 'cpu-vs-cpu-03-3d-midbattle.png'), timeout: 60000 });
  await page.evaluate(`(() => { __FIELD.speed = 1; })()`);
  await sleep(15000);
  note('3D late, back to 1x', await poll());
  await page.screenshot({ path: join(OUT, 'cpu-vs-cpu-04-3d-late.png'), timeout: 60000 });

  // ---- Segment 2: 2D Classic paint, same seed ----
  await page.evaluate(`(() => { try { fldExit(true); } catch(e) {} })()`);
  await sleep(1500);
  await page.evaluate(`(() => { fldLaunchSandbox({ renderer: '2d', scenario: 'bullrun1', autoBoth: true, autoPause: false, playerSide: 'US', seed: 47 }); __FIELD.phase = 'battle'; __FIELD.paused = false; __FIELD.speed = 2; })()`);
  await sleep(4000);
  note('2D launch, same seed, 2x', await poll());
  await page.screenshot({ path: join(OUT, 'cpu-vs-cpu-05-2d-opening.png'), timeout: 60000 });
  await sleep(25000);
  note('2D mid-battle', await poll());
  await page.screenshot({ path: join(OUT, 'cpu-vs-cpu-06-2d-midbattle.png'), timeout: 60000 });

  // ---- Fast-forward to the end screen (bounded) ----
  for (let i = 0; i < 14; i++) {
    const s = await poll();
    if (s.phase === 'over') break;
    await page.evaluate(`(() => { __FIELD.paused = true; fldStepN(1200, 0.05); __FIELD.paused = false; })()`);
    await sleep(1200);
  }
  const end = await poll();
  note('end state', end);
  await sleep(2500);
  await page.screenshot({ path: join(OUT, 'cpu-vs-cpu-07-endscreen.png'), timeout: 60000 });

  log.endState = end;
  log.pageerrors = pageerrors;
  await ctx.close();   // finalizes the video file
  await browser.close().catch(() => {});
  const vids = readdirSync(VID).filter(f => f.endsWith('.webm')).map(f => join(VID, f));
  if (vids.length) {
    const dest = join(OUT, 'cpu-vs-cpu-bullrun.webm');
    renameSync(vids.sort().pop(), dest);
    log.video = dest;
  }
  writeFileSync(join(OUT, 'cpu-vs-cpu-log.json'), JSON.stringify(log, null, 2));
  console.log('VIDEO: ' + (log.video || 'MISSING'));
  console.log('pageerrors=' + pageerrors.length + ' winner=' + (end.winner || '(in progress)'));
  if (srv) srv.kill();
  process.exit(pageerrors.length ? 1 : 0);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
