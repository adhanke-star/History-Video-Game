#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/sweep-all-battles.mjs - a CONSOLIDATED current-state balance + casualty-DIRECTION snapshot
// across the whole shipped tactical roster. For each registered scenario it runs N seeds AI-vs-AI and
// reports: top-level attacker/defender, the winner distribution, mean US/CS casualties, and the
// casualty DIRECTION (does the ATTACKER pay more, or the defender?). Single-phase battles compute
// casualties as committed-force minus survivors; multi-phase read __FIELD.battleCas. This is the
// ground-truth audit instrument for the roster-hardening pass (find the Vicksburg-class inversions).
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
const SEEDS = (process.argv[2] ? process.argv[2].split(',').map(Number) : [1, 7, 21, 33, 49, 101, 202, 303]);

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
    return { seed:seed, w:__FIELD.winner, by:__FIELD.winBy, atk:(__FIELD.attacker||'US'), def:(__FIELD.defender||'CS'),
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
    return JSON.stringify({ ok:true, order:order, runs:out });
  } catch(e){ return JSON.stringify({ ok:false, err:String(e&&e.message||e), stack:String(e&&e.stack||'') }); }
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
  const res = JSON.parse(await page.evaluate(RUN));
  if (!res.ok) { console.log('SWEEP FATAL:', res.err, res.stack); process.exit(1); }

  const N = SEEDS.length;
  console.log('CONSOLIDATED ROSTER SWEEP — ' + N + ' seeds [' + SEEDS.join(',') + ']');
  console.log('legend: ATK=top-level attacker; "dir" = who BLED MORE (attacker/defender) by mean total casualties; ratio = atkCas/defCas (>1 attacker pays)');
  console.log('');
  const summary = {};
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
    summary[id] = { atk, def, multi, winDist, meanUS, meanCS, atkCas, defCas, ratio: Number(ratio.toFixed(2)), dir };
    console.log((id + (multi ? ' [multi]' : '')).padEnd(22) + ' ATK=' + atk +
      ' | win: ' + winStr.padEnd(20) + ' | meanCas US ' + String(meanUS).padStart(5) + ' / CS ' + String(meanCS).padStart(5) +
      ' | ' + dir + ' (atk/def ' + ratio.toFixed(2) + ')');
    if (multi) {
      const np = runs[0].log.length;
      for (let p = 0; p < np; p++) {
        const ph = {}; let pus = 0, pcs = 0;
        for (const r of runs) { const e = r.log[p]; ph[e.w] = (ph[e.w] || 0) + 1; pus += e.us; pcs += e.cs; }
        console.log('    P' + p + ' ' + String(runs[0].log[p].name).slice(0, 26).padEnd(26) +
          ' held: US ' + (ph.US || 0) + ' CS ' + (ph.CS || 0) + ' draw ' + (ph.draw || 0) +
          ' | meanCas US ' + Math.round(pus / N) + ' / CS ' + Math.round(pcs / N));
      }
    }
  }
  writeFileSync(join(OUT, 'sweep-all-battles.json'), JSON.stringify({ seeds: SEEDS, summary, raw: res.runs }, null, 2));
  console.log('\nwrote tools/shots/sweep-all-battles.json');
  if (browser) try { await Promise.race([browser.close(), sleep(2500)]); } catch (e) {}
  if (srv) srv.kill();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
