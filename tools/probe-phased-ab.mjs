#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-phased-ab.mjs — D132 byte-identity A/B sweep for the multi-phase 3D rebuild.
//
// The D132 fix touches a COMBAT-PATH file (T8 _fldAdvancePhase). The change is a single guarded
// branch — `if (__FIELD.mode3d && ...) fld3dRebuildPhaseScene()` — that is SKIPPED in the headless
// renderer ('none' -> mode3d false), so the sim must be byte-identical. This sweep PROVES it: it runs
// each of the 4 multi-phase battles to completion across several seeds on BOTH the committed pre-fix
// build (HEAD:civil_war_generals.html, copied to .tmp/_ab_baseline.html) and the FIXED build, and
// asserts the full outcome dict (winner / winBy / battleCas / phaseScore / per-phase log / steps) is
// IDENTICAL number-for-number. Any divergence fails the probe.

import { chromium } from 'playwright-core';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const BATTLES = ['antietam', 'gettysburg', 'chickamauga', 'vicksburg'];
const SEEDS = [1, 7, 12345, 42, 909];

// write the committed (pre-fix) build to a temp file the static server can reach
execSync('git show HEAD:civil_war_generals.html > .tmp/_ab_baseline.html', { cwd: ROOT, shell: '/bin/bash' });

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('no server');
}

function sweepScript() {
  return `(async () => {
    var BATTLES = ${JSON.stringify(BATTLES)}, SEEDS = ${JSON.stringify(SEEDS)};
    function runOne(scenario, seed) {
      try { delete G.settings.tacticalFog; } catch(e) {}
      fldLaunchSandbox({ renderer:'none', scenario:scenario, autoBoth:true, seed:seed });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      var n = 0; while (__FIELD.phase === 'battle' && n < 80000) { fldSimStep(0.05); n++; }
      return {
        w: __FIELD.winner, by: __FIELD.winBy, steps: n,
        score: __FIELD.phaseScore, cas: __FIELD.battleCas,
        log: (__FIELD.phaseLog || []).map(function(e){ return e.idx + ':' + e.winner + ':' + e.winBy + ':' + e.usCas + ':' + e.csCas; }).join('|')
      };
    }
    var rows = {};
    for (var b = 0; b < BATTLES.length; b++) for (var s = 0; s < SEEDS.length; s++) {
      var key = BATTLES[b] + '#' + SEEDS[s];
      rows[key] = runOne(BATTLES[b], SEEDS[s]);
    }
    return rows;
  })()`;
}

async function sweepFile(page, fileName) {
  await page.goto(cfg.baseUrl + '/' + fileName, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await sleep(400);
  return await page.evaluate(sweepScript());
}

(async () => {
  const server = await ensureServer();
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] });
  } catch (e) {
    browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--disable-dev-shm-usage'] });
  }
  const ctx = await browser.newContext();
  ctx.setDefaultTimeout(120000);
  const page = await ctx.newPage();
  const diffs = [];
  let baseRows = {}, fixRows = {};
  try {
    baseRows = await sweepFile(page, '.tmp/_ab_baseline.html');
    fixRows = await sweepFile(page, cfg.file);
  } finally {
    if (server) server.kill();
  }
  const keys = Object.keys(fixRows);
  for (const k of keys) {
    const a = baseRows[k], z = fixRows[k];
    const as = JSON.stringify(a), zs = JSON.stringify(z);
    if (as !== zs) diffs.push({ key: k, base: a, fix: z });
  }
  const out = { ok: diffs.length === 0, comparisons: keys.length, diffs, baseRows, fixRows, generatedAt: new Date().toISOString() };
  writeFileSync(join(OUT, 'probe-phased-ab.json'), JSON.stringify(out, null, 2));
  console.log('probe-phased-ab ok=' + out.ok + ' comparisons=' + keys.length + ' diffs=' + diffs.length);
  for (const k of keys) {
    const z = fixRows[k];
    console.log('  ' + (diffs.find(d => d.key === k) ? 'DIFF ' : 'ok   ') + k.padEnd(20) + ' w=' + z.w + ' by=' + z.by + ' US' + z.cas.US + '/CS' + z.cas.CS + ' score US' + z.score.US + '/CS' + z.score.CS + ' steps=' + z.steps);
  }
  for (const d of diffs) console.log('  >>> ' + d.key + '\n      base=' + JSON.stringify(d.base) + '\n      fix =' + JSON.stringify(d.fix));
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2000)]); } catch (e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2000)]); } catch (e) {}
  process.exit(out.ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
