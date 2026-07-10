#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/sweep-all-battles.mjs - a CONSOLIDATED current-state balance + casualty-DIRECTION snapshot
// across the whole shipped tactical roster. For each registered scenario it runs N seeds AI-vs-AI and
// reports: top-level attacker/defender, the winner distribution, mean US/CS casualties, and the
// casualty DIRECTION (does the ATTACKER pay more, or the defender?). Single-phase battles compute
// casualties as committed-force minus survivors; multi-phase read __FIELD.battleCas. This is the
// ground-truth audit instrument for the roster-hardening pass (find the Vicksburg-class inversions).
// E63 makes it a real gate: complete/finite runs, pageerrors, artifact ok, and exit status all bind.
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
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }
const ARGS = process.argv.slice(2);
const DIAGNOSTIC_PAGEERROR = ARGS.includes('--diagnostic-pageerror');
const seedArg = ARGS.find(arg => !arg.startsWith('--'));
const SEEDS = (seedArg ? seedArg.split(',').map(Number) : [1, 7, 21, 33, 49, 101, 202, 303]).filter(Number.isFinite);
if (!SEEDS.length) {
  console.error('FATAL no valid numeric seeds');
  process.exit(2);
}

function killChild(child) {
  if (!child) return;
  try { child.kill(); } catch (e) {}
}

async function closeBrowserHard(browser) {
  if (!browser) return;
  const proc = typeof browser.process === 'function' ? browser.process() : null;
  let closed = false;
  try {
    await Promise.race([
      browser.close().then(() => { closed = true; }, () => { closed = true; }),
      sleep(2500)
    ]);
  } catch (e) {}
  if (!closed && proc && !proc.killed) {
    try { proc.kill('SIGKILL'); } catch (e) {}
  }
}

const RUN = `(function(seeds) {
  function strength(side){ var c=0,U=__FIELD.units; for(var i=0;i<U.length;i++){ var u=U[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  function fielded(side){ var c=0,U=__FIELD.units; for(var i=0;i<U.length;i++){ var u=U[i]; if(u.side===side) c+=(u.maxMen||u.men); }
    var rf=__FIELD.reinforce||[]; for(var j=0;j<rf.length;j++){ if(rf[j].spec && rf[j].spec.side===side) c+=(rf[j].spec.men||0); } return c; }
  function runOne(id, seed){
    __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
    try { delete G.settings.tacticalFog; } catch(e){}
    var opts = (id==='bullrun1') ? { renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed }
                                 : { renderer:'none', scenario:id, autoBoth:true, seed:seed };
    fldLaunchSandbox(opts);
    var multi = !!(__FIELD.phases && __FIELD.phases.length);
    // pre-battle committed force (single-phase only; multi-phase uses battleCas)
    var preUS = fielded('US'), preCS = fielded('CS');
    __FIELD.phase='battle'; __FIELD.paused=false;
    var n=0; while(__FIELD.phase==='battle' && n<200000){ fldSimStep(0.05); n++; }
    var usCas, csCas, log=null;
    if(multi){ usCas=__FIELD.battleCas.US; csCas=__FIELD.battleCas.CS;
      log=(__FIELD.phaseLog||[]).map(function(e){ return { name:e.name, w:e.winner, us:e.usCas, cs:e.csCas }; }); }
    else { usCas=Math.max(0, preUS-strength('US')); csCas=Math.max(0, preCS-strength('CS')); }
    return { seed:seed, w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase,
             atk:(__FIELD.attacker||'US'), def:(__FIELD.defender||'CS'),
             multi:multi, usCas:Math.round(usCas), csCas:Math.round(csCas), steps:n, log:log };
  }
  try {
    G.settings = G.settings || {}; G.settings.gfx='classic'; G.mode='menu';
    try { delete G.settings.tacticalPreset; } catch(e){}
    var reg = fldScenarioRegistry();
    var order = (typeof fldScenarioMenuOrder==='function') ? fldScenarioMenuOrder(reg) : Object.keys(reg);
    var out = {};
    for(var k=0;k<order.length;k++){
      var id=order[k]; if(!reg[id]) continue;
      var runs=[]; for(var s=0;s<seeds.length;s++){ runs.push(runOne(id, seeds[s])); }
      out[id]=runs;
    }
    return JSON.stringify({ ok:true, order:order, registryIds:Object.keys(reg), runs:out });
  } catch(e){ return JSON.stringify({ ok:false, err:String(e&&e.message||e), stack:String(e&&e.stack||'') }); }
})(${JSON.stringify(SEEDS)})`;

function validateSweep(res) {
  const failures = [];
  if (!res || res.ok !== true) {
    failures.push('in-page sweep failed: ' + String(res && res.err || 'unknown failure'));
    return failures;
  }
  if (!Array.isArray(res.order) || !res.order.length) failures.push('registered scenario order is empty');
  const order = Array.isArray(res.order) ? res.order : [];
  const registryIds = Array.isArray(res.registryIds) ? res.registryIds : [];
  if (!registryIds.length) failures.push('registry id readback is empty');
  const duplicateOrder = order.filter((id, i) => order.indexOf(id) !== i);
  if (duplicateOrder.length) failures.push('registered order has duplicates: ' + Array.from(new Set(duplicateOrder)).join(', '));
  const missingFromOrder = registryIds.filter(id => !order.includes(id));
  const absentFromRegistry = order.filter(id => !registryIds.includes(id));
  if (missingFromOrder.length) failures.push('registered scenarios omitted from sweep order: ' + missingFromOrder.join(', '));
  if (absentFromRegistry.length) failures.push('sweep order includes unregistered scenarios: ' + absentFromRegistry.join(', '));
  const runsById = res.runs && typeof res.runs === 'object' ? res.runs : {};
  for (const id of order) {
    const runs = runsById[id];
    if (!Array.isArray(runs)) {
      failures.push(id + ' has no run array');
      continue;
    }
    if (runs.length !== SEEDS.length) failures.push(id + ' run count ' + runs.length + ' != seeds ' + SEEDS.length);
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i] || {};
      const label = id + ' seed=' + String(SEEDS[i]);
      if (r.seed !== SEEDS[i]) failures.push(label + ' seed readback mismatch: ' + String(r.seed));
      if (r.phase !== 'over') failures.push(label + ' did not finish: phase=' + String(r.phase) + ' steps=' + String(r.steps));
      if (!['US', 'CS', 'draw'].includes(r.w)) failures.push(label + ' invalid winner=' + String(r.w));
      if (typeof r.by !== 'string' || !r.by) failures.push(label + ' missing winBy');
      if (!['US', 'CS'].includes(r.atk) || !['US', 'CS'].includes(r.def) || r.atk === r.def) {
        failures.push(label + ' invalid attacker/defender=' + String(r.atk) + '/' + String(r.def));
      }
      if (!Number.isFinite(r.usCas) || r.usCas < 0) failures.push(label + ' invalid US casualties=' + String(r.usCas));
      if (!Number.isFinite(r.csCas) || r.csCas < 0) failures.push(label + ' invalid CS casualties=' + String(r.csCas));
      if (!Number.isFinite(r.steps) || r.steps <= 0 || r.steps > 200000) failures.push(label + ' invalid steps=' + String(r.steps));
      if (r.multi && !Array.isArray(r.log)) failures.push(label + ' multi-phase run missing phase log');
    }
  }
  const extras = Object.keys(runsById).filter(id => !order.includes(id));
  if (extras.length) failures.push('runs emitted outside registered order: ' + extras.join(', '));
  return failures;
}

async function main() {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null, browser = null;
  const artifact = {
    ok: false,
    diagnostic: DIAGNOSTIC_PAGEERROR ? 'pageerror' : null,
    seeds: SEEDS,
    order: [],
    registryIds: [],
    pageerrors: [],
    failures: [],
    summary: {},
    raw: {}
  };
  try {
    if (!(await up(probe))) {
      srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 70; i++) { if (await up(probe)) break; await sleep(150); }
    }
    if (!(await up(probe))) throw new Error('server not reachable at ' + probe);
    try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
    catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }
    const page = await browser.newPage({ viewport: cfg.viewport });
    page.on('pageerror', err => artifact.pageerrors.push(String(err && err.message || err)));
    await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch (e) {} });
    await page.goto(probe, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(500);
    if (DIAGNOSTIC_PAGEERROR) {
      await page.evaluate(() => { setTimeout(() => { throw new Error('E63 diagnostic pageerror'); }, 0); });
      await sleep(100);
    }
    const res = JSON.parse(await page.evaluate(RUN));
    await sleep(100); // let any final asynchronous pageerror event reach the Playwright listener
    artifact.order = Array.isArray(res.order) ? res.order : [];
    artifact.registryIds = Array.isArray(res.registryIds) ? res.registryIds : [];
    artifact.raw = res.runs && typeof res.runs === 'object' ? res.runs : {};
    artifact.failures = validateSweep(res);
    if (artifact.pageerrors.length) artifact.failures.push('pageerrors=' + artifact.pageerrors.length);

    const N = SEEDS.length;
    console.log('CONSOLIDATED ROSTER SWEEP — ' + N + ' seeds [' + SEEDS.join(',') + ']');
    console.log('legend: ATK=top-level attacker; "dir" = who BLED MORE (attacker/defender) by mean total casualties; ratio = atkCas/defCas (>1 attacker pays)');
    console.log('');
    if (res.ok) {
      for (const id of res.order) {
        const runs = res.runs[id]; if (!runs || !runs.length) continue;
        const atk = runs[0].atk, def = runs[0].def, multi = runs[0].multi;
        const winDist = {}; let usC = 0, csC = 0;
        for (const r of runs) { winDist[r.w] = (winDist[r.w] || 0) + 1; usC += r.usCas; csC += r.csCas; }
        const meanUS = Math.round(usC / N), meanCS = Math.round(csC / N);
        const atkCas = atk === 'US' ? meanUS : meanCS, defCas = atk === 'US' ? meanCS : meanUS;
        const ratio = defCas > 0 ? (atkCas / defCas) : Infinity;
        const dir = atkCas > defCas ? 'ATTACKER pays' : (defCas > atkCas ? 'DEFENDER pays' : 'even');
        const winStr = ['US', 'CS', 'draw'].map(w => w + ' ' + (winDist[w] || 0)).join(' / ');
        artifact.summary[id] = { atk, def, multi, winDist, meanUS, meanCS, atkCas, defCas, ratio: Number(ratio.toFixed(2)), dir };
        console.log((id + (multi ? ' [multi]' : '')).padEnd(22) + ' ATK=' + atk +
          ' | win: ' + winStr.padEnd(20) + ' | meanCas US ' + String(meanUS).padStart(5) + ' / CS ' + String(meanCS).padStart(5) +
          ' | ' + dir + ' (atk/def ' + ratio.toFixed(2) + ')');
        if (multi) {
          const np = Array.isArray(runs[0].log) ? runs[0].log.length : 0;
          for (let p = 0; p < np; p++) {
            const ph = {}; let pus = 0, pcs = 0;
            for (const r of runs) { const e = r.log[p]; ph[e.w] = (ph[e.w] || 0) + 1; pus += e.us; pcs += e.cs; }
            console.log('    P' + p + ' ' + String(runs[0].log[p].name).slice(0, 26).padEnd(26) +
              ' held: US ' + (ph.US || 0) + ' CS ' + (ph.CS || 0) + ' draw ' + (ph.draw || 0) +
              ' | meanCas US ' + Math.round(pus / N) + ' / CS ' + Math.round(pcs / N));
          }
        }
      }
    }
    artifact.ok = artifact.failures.length === 0;
  } catch (e) {
    artifact.failures.push('fatal: ' + String(e && e.message || e));
    console.error('FATAL', e);
  } finally {
    writeFileSync(join(OUT, 'sweep-all-battles.json'), JSON.stringify(artifact, null, 2));
    console.log('\nwrote tools/shots/sweep-all-battles.json ok=' + artifact.ok +
      ' failures=' + artifact.failures.length + ' pageerrors=' + artifact.pageerrors.length);
    for (const failure of artifact.failures) console.error('  SWEEP FAIL:', failure);
    await closeBrowserHard(browser);
    killChild(srv);
  }
  return artifact.ok;
}

main().then(ok => process.exit(ok ? 0 : 1)).catch(e => { console.error('FATAL', e); process.exit(1); });
