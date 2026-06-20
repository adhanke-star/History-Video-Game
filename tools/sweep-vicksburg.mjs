#!/usr/bin/env node
// tools/sweep-vicksburg.mjs - headless A/B balance sweep for the Vicksburg 3-phase siege.
// Runs N seeds AI-vs-AI and reports, per phase, who held + US/CS casualties (and the
// attacker-pays ratio), plus the aggregate winner/score. Used to tune the data so the
// failed May assaults cost the ATTACKER (the Fredericksburg teaching), not the defender.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }
const SEEDS = (process.argv[2] ? process.argv[2].split(',').map(Number) : [1, 7, 21, 33, 49, 101, 202, 303]);

const RUN = `(function(seeds) {
  function runVicksburg(seed) {
    __FIELD._officersOff = false; __FIELD._logisticsOff = false; __FIELD._armsOff = false;
    delete G.settings.tacticalFog;
    fldLaunchSandbox({ renderer: 'none', scenario: 'vicksburg', autoBoth: true, seed: seed });
    __FIELD.phase = 'battle'; __FIELD.paused = false;
    var n = 0;
    while (__FIELD.phase === 'battle' && n < 90000) { fldSimStep(0.05); n++; }
    return {
      seed: seed, w: __FIELD.winner, by: __FIELD.winBy, score: __FIELD.phaseScore, cas: __FIELD.battleCas,
      log: (__FIELD.phaseLog || []).map(function(e) { return { name: e.name, w: e.winner, us: e.usCas, cs: e.csCas }; })
    };
  }
  try {
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';
    try { delete G.settings.tacticalPreset; } catch (e) {}
    var runs = seeds.map(runVicksburg);
    return JSON.stringify({ ok: true, runs: runs });
  } catch (e) { return JSON.stringify({ ok: false, err: String(e && e.message || e) }); }
})(${JSON.stringify(SEEDS)})`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null, browser = null;
  if (!(await up(probe))) {
    srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 70; i++) { if (await up(probe)) break; await sleep(150); }
  }
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
  catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch (e) {} });
  await page.goto(probe, { waitUntil: 'load', timeout: 60000 });
  await sleep(500);
  const out = JSON.parse(await page.evaluate(RUN));
  if (!out.ok) { console.log('SWEEP FATAL:', out.err); process.exit(1); }

  const nPhases = out.runs[0].log.length;
  const agg = { US: 0, CS: 0, draw: 0 };
  const phaseHold = []; // per phase: count of CS-held
  const phaseCas = [];  // per phase: summed us/cs
  for (let p = 0; p < nPhases; p++) { phaseHold.push({ US: 0, CS: 0, draw: 0 }); phaseCas.push({ us: 0, cs: 0 }); }

  for (const r of out.runs) {
    agg[r.w] = (agg[r.w] || 0) + 1;
    r.log.forEach((e, p) => {
      phaseHold[p][e.w] = (phaseHold[p][e.w] || 0) + 1;
      phaseCas[p].us += e.us; phaseCas[p].cs += e.cs;
    });
  }
  const N = out.runs.length;
  console.log('VICKSBURG SWEEP — ' + N + ' seeds [' + SEEDS.join(',') + ']');
  console.log('aggregate winner: US ' + (agg.US || 0) + '/' + N + ' · CS ' + (agg.CS || 0) + '/' + N + ' · draw ' + (agg.draw || 0) + '/' + N);
  for (let p = 0; p < nPhases; p++) {
    const us = Math.round(phaseCas[p].us / N), cs = Math.round(phaseCas[p].cs / N);
    const atk = out.runs[0].log[p].name; // attacker is US in all Vicksburg phases
    const ratioAtkPays = cs > 0 ? (us / cs).toFixed(2) : 'inf'; // >1 means attacker bleeds more (good for assault)
    console.log('  P' + p + ' ' + (out.runs[0].log[p].name).slice(0, 26).padEnd(26) +
      ' | held: US ' + (phaseHold[p].US || 0) + ' CS ' + (phaseHold[p].CS || 0) + ' draw ' + (phaseHold[p].draw || 0) +
      ' | meanCas US ' + us + ' / CS ' + cs + ' | US:CS ' + ratioAtkPays);
  }
  // aggregate casualties
  let aUS = 0, aCS = 0; out.runs.forEach(r => { aUS += r.cas.US; aCS += r.cas.CS; });
  console.log('  aggregate meanCas: US ' + Math.round(aUS / N) + ' / CS ' + Math.round(aCS / N) + ' (US:CS ' + (aUS / aCS).toFixed(2) + ')');
  console.log('  sample scores:', out.runs.slice(0, 3).map(r => 'US' + r.score.US + '/CS' + r.score.CS + '=' + r.w).join('  '));

  if (browser) try { await Promise.race([browser.close(), sleep(2500)]); } catch (e) {}
  if (srv) srv.kill();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
