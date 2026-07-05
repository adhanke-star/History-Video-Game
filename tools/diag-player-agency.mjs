#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/diag-player-agency.mjs — STANDING NON-BLOCKING PLAYER-AGENCY DIAGNOSTIC (Aaron directive
// 2026-07-05, D265; born from the D264 player-agency audit). Measures whether PLAYER input still
// moves battle outcomes — the repo's only harness that drives player ORDERS (every other outcome
// gate is AI-vs-AI autoBoth; the idle-player probe steps assert termination only). Runs scripted
// player-attacker legs and LOGS the reachability table so regressions in player agency become
// VISIBLE at every batch checkpoint.
//
// NON-BLOCKING BY DESIGN (Aaron, 2026-07-05): the reachability numbers are NEVER asserted — no
// direction gate binds a player-driven battle (that would mandate outcomes exactly the way the
// audit was checking for, and SL-7/D74 forbid tuning toward any table). This diagnostic reds ONLY
// on harness failure: a battle that fails to resolve, a pageerror, or a missing/stale artifact.
//
// The D264 audit baselines (2026-07-05, HEAD dba23e4 — re-read these when the table moves):
//   fredericksburg (US player): idle 0/8 · frontal 8/8 · flank 8/8 (cheaper) · autoBoth US 0/8
//   antietam (US player): idle 0 phase wins · frontal P1 8/8 (the 220s clock IS beatable where
//   history beat it) with P0/P2 holding (the historically-held phases resist the naive push).
// Interpretation guide: idle should stay ~0 (an idle player earns nothing); the ACTIVE legs going
// to 0 everywhere = player agency regressed (investigate); the historically-HELD positions falling
// to the NAIVE frontal leg = opponent quality too soft (E53 evidence, the Fredericksburg finding).
// The clock question rides E53's measurements (Aaron, 2026-07-05).
// Writes shots/diag-player-agency.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
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

const SEEDS = [1, 7, 21, 33, 49, 101, 202, 303];   // the default direction-gate seed set
// Both baseline battles are US-attacker scenarios; the player drives the ATTACKING side (the agency
// question is whether an attacker can still take ground the AI baseline says the defender holds).
const RUNS = [
  { battle: 'fredericksburg', legs: ['idle', 'frontal', 'flank'] },
  { battle: 'antietam', legs: ['idle', 'frontal'] },   // multi-phase; flank staging is P0-geometry-specific, deliberately not scripted
];

// Deterministic scripted-player order loop (no RNG — the seeded stream stays untouched): every 30
// sim-seconds re-order all steady player units. 'frontal' presses the CURRENT objective (multi-phase
// aware); 'flank' stages far left of the objective first, then pushes from the flank.
function legScript(leg, battle) {
  return `(async () => {
    var SEEDS = ${JSON.stringify(SEEDS)}, out = {};
    for (var k = 0; k < SEEDS.length; k++) {
      var seed = SEEDS[k];
      G.campaign = null;
      fldLaunchSandbox({ renderer:'none', scenario:'${battle}', seed:seed, playerSide:'US' });
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      function orderUS(mode){
        var o = __FIELD.objective; if (!o) return;
        var stageX = Math.max(60, o.x - 380), stageZ = o.z + 260;
        var idx = 0;
        for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i];
          if (u.side !== 'US' || !u.alive || u.state === 'routing') continue;
          var spread = (idx % 5 - 2) * 55; idx++;
          if (mode === 'frontal') fldOrderMove(u, o.x + spread, o.z + 20);
          else if (mode === 'stage') fldOrderMove(u, stageX + spread, stageZ);
          else if (mode === 'push') fldOrderMove(u, o.x - 60 + spread, o.z + 10);
        }
      }
      var n = 0;
      while ((__FIELD.phase === 'battle' || __FIELD.phase === 'interphase') && n < 120000) {
        if ('${leg}' === 'frontal' && n % 600 === 0) orderUS('frontal');
        if ('${leg}' === 'flank' && n % 600 === 0) orderUS(n < 2400 ? 'stage' : 'push');
        fldSimStep(0.05); n++;
      }
      var log = (__FIELD.phaseLog||[]).map(function(e){ return e.winner + '/' + e.winBy; });
      var cas = __FIELD.phases && __FIELD.battleCas ? __FIELD.battleCas : null;
      if (!cas) { cas = { US: 0, CS: 0 };
        for (var j = 0; j < __FIELD.units.length; j++) { var q = __FIELD.units[j];
          if (q.side !== 'US' && q.side !== 'CS') continue;
          var f = Math.max(0, q.maxMen || q.men || 0), left = q.alive ? Math.max(0, q.men || 0) : 0;
          cas[q.side] += Math.max(0, f - left); } }
      out['s' + seed] = { w: __FIELD.winner, by: __FIELD.winBy, steps: n, phases: log.length ? log : null,
        casUS: Math.round(cas.US), casCS: Math.round(cas.CS) };
    }
    return out;
  })()`;
}

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' }); for (let i = 0; i < 70; i++) { if (await up(probe)) break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] }); }
  catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--disable-dev-shm-usage'] }); }
  const ctx = await browser.newContext(); ctx.setDefaultTimeout(1800000);
  const page = await ctx.newPage();
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  const result = { ok: true, nonBlockingNote: 'reachability LOGGED never asserted (Aaron 2026-07-05, D265; SL-7/D74)', table: {}, results: {}, pageerrors };
  try {
    await page.goto(probe, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await sleep(500);
    for (const run of RUNS) {
      result.results[run.battle] = {};
      result.table[run.battle] = {};
      for (const leg of run.legs) {
        const rows = await page.evaluate(legScript(leg, run.battle));
        result.results[run.battle][leg] = rows;
        let us = 0, cs = 0, resolved = 0, cU = 0, cC = 0;
        const phaseUS = [0, 0, 0];
        for (const s of SEEDS) { const r = rows['s' + s]; if (!r) continue;
          if (['US', 'CS', 'draw'].indexOf(r.w) >= 0) resolved++;
          if (r.w === 'US') us++; if (r.w === 'CS') cs++;
          cU += r.casUS; cC += r.casCS;
          if (r.phases) for (let p = 0; p < Math.min(3, r.phases.length); p++) if (r.phases[p].indexOf('US/') === 0) phaseUS[p]++;
        }
        // the HARNESS gate (blocking): every seeded battle must RESOLVE with 0 pageerrors.
        if (resolved !== SEEDS.length) { result.ok = false; result.fail = run.battle + '/' + leg + ' resolved ' + resolved + '/' + SEEDS.length; }
        result.table[run.battle][leg] = { usWins: us, csWins: cs, meanCasUS: Math.round(cU / SEEDS.length), meanCasCS: Math.round(cC / SEEDS.length), phaseUSWins: rows['s1'] && rows['s1'].phases ? phaseUS : null };
        console.log((run.battle + '/' + leg).padEnd(26) + ' US ' + us + '/8 CS ' + cs + '/8  meanCasUS ' + Math.round(cU / SEEDS.length) + (rows['s1'] && rows['s1'].phases ? '  US phase wins ' + phaseUS.join('/') : ''));
      }
    }
  } catch (e) { result.ok = false; result.fatal = String(e && e.message || e); }
  finally {
    if (pageerrors.length) result.ok = false;
    writeFileSync(join(OUT, 'diag-player-agency.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('diag-player-agency ok=' + result.ok + ' pageerrors=' + pageerrors.length + (result.fatal ? ' FATAL ' + result.fatal : '') + (result.fail ? ' FAIL ' + result.fail : ''));
})();

/* ==== E37-class teeth (structural only — the reachability table is NEVER asserted): a standalone
   run must exit nonzero unless the artifact written THIS RUN reports ok (all battles resolved,
   0 pageerrors). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/diag-player-agency.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('diag-player-agency: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    if (j.ok !== true || pe > 0) { console.error('diag-player-agency: TEETH FAIL - ok=' + j.ok + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('diag-player-agency: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
