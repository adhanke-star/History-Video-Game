#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/ab-badge-direction.mjs — D481 (LANE-017 slices 4+5): the badge OFF↔ON A/B evidence
// instrument for the coverage sweep + the R-7 situational-gating step. For each named scenario
// it runs the 8-seed AI-vs-AI battery TWICE per seed — badges OFF (opts.badges:false) and
// badges ON (the shipped default) — and asserts:
//   1. every run completes with a valid winner (the sweep-all-battles validation idiom);
//   2. R-7 ACTIVATION EVIDENCE (the D391 instrument-one-seed practice generalized): every
//      carrier of an R-7-gated NON-extremis badge in the touched battles must actually satisfy
//      its situational trigger at least once across the ON seeds — a gated badge that never
//      fires at its home battle is a silent deactivation, which adjudication 9 forbids.
//      Extremis triggers (ammo_low_defend / last_stand_defend) are RECORDED, never asserted.
// DIRECTION IS RECORDED, NOT ASSERTED HERE (the D481 first-run lesson): the off/on winner
// distributions and casualty means land in the artifact as A/B evidence, but the original
// "ON may not move against the OFF-majority" heuristic was WRONG — the raw headless-sweep
// majority is not the historical direction for near-run battles (proof: the Wilderness OFF
// majority is CS 5/3 while the documented D392/D393 law is US-holds-the-junction, so a
// badge-driven move toward US is a move TOWARD history that the heuristic flagged as a flip).
// THE DIRECTION AUTHORITY IS EACH TOUCHED BATTLE'S OWN SUITE PROBE (probe-<battle>.mjs) —
// their 8-seed direction batteries encode the documented guards with the correct win/hold
// semantics and run badges-ON; they are the teeth the contract names, run at the slice gate
// for every battle whose A/B distributions moved, and for the whole roster at the battery.
// This is a slice-gate instrument (the D104 A/B sweep modernized), NOT a suite row.
// Usage: node tools/ab-badge-direction.mjs id1,id2,... [--seeds=1,7,...]
// Writes tools/shots/ab-badge-direction.json.
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
const idArg = ARGS.find(a => !a.startsWith('--'));
if (!idArg) { console.error('FATAL: pass a comma-separated scenario id list'); process.exit(2); }
const IDS = idArg.split(',').map(s => s.trim()).filter(Boolean);
const seedsArg = ARGS.find(a => a.startsWith('--seeds='));
const SEEDS = (seedsArg ? seedsArg.slice(8).split(',').map(Number) : [1, 7, 21, 33, 49, 101, 202, 303]).filter(Number.isFinite);
if (!SEEDS.length) { console.error('FATAL: no valid seeds'); process.exit(2); }

// the R-7 trigger split (mirrors _fldBadgeTrig, D481): asserted = must fire at its home battle;
// recorded = in-extremis by design, evidence only.
const ASSERT_TRIGGERS = ['defend_objective', 'first_fire', 'surprised', 'his_attack', 'his_offensive', 'attack_fortified', 'usct_assault', 'march_vigor'];
const RECORD_TRIGGERS = ['ammo_low_defend', 'last_stand_defend'];

function killChild(child) { if (!child) return; try { child.kill(); } catch (e) {} }
async function closeBrowserHard(browser) {
  if (!browser) return;
  const proc = typeof browser.process === 'function' ? browser.process() : null;
  let closed = false;
  try { await Promise.race([browser.close().then(() => { closed = true; }, () => { closed = true; }), sleep(2500)]); } catch (e) {}
  if (!closed && proc && !proc.killed) { try { proc.kill('SIGKILL'); } catch (e) {} }
}

const RUN = `(function(ids, seeds, gatedTrigs) {
  function strength(side){ var c=0,U=__FIELD.units; for(var i=0;i<U.length;i++){ var u=U[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  function fieldedSide(side){ var c=0,U=__FIELD.units; for(var i=0;i<U.length;i++){ var u=U[i]; if(u.side===side) c+=(u.maxMen||u.men); }
    var rf=__FIELD.reinforce||[]; for(var j=0;j<rf.length;j++){ if(rf[j].spec && rf[j].spec.side===side) c+=(rf[j].spec.men||0); } return c; }
  function runOne(id, seed, badgesOn){
    __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
    try { delete G.settings.tacticalFog; } catch(e){}
    var opts = { renderer:'none', scenario:id, autoBoth:true, seed:seed };
    if (!badgesOn) opts.badges = false;
    fldLaunchSandbox(opts);
    var multi = !!(__FIELD.phases && __FIELD.phases.length);
    var preUS = fieldedSide('US'), preCS = fieldedSide('CS');
    // activation sampling map for the ON side: "unitId:badgeKey" -> {trigger, fired}
    var act = {};
    if (badgesOn) {
      var U0=__FIELD.units; for(var i0=0;i0<U0.length;i0++){ var u0=U0[i0]; if(!u0.badges||!u0.badges.length) continue;
        for(var b0=0;b0<u0.badges.length;b0++){ var d0=fldBadgeDef(u0.badges[b0]); if(!d0) continue;
          if(gatedTrigs.indexOf(d0.trigger)<0) continue; act[u0.id+':'+d0.key]={trigger:d0.trigger, fired:false}; } }
    }
    __FIELD.phase='battle'; __FIELD.paused=false;
    var n=0; while(__FIELD.phase==='battle' && n<200000){ fldSimStep(0.05); n++;
      if (badgesOn && (n % 40 === 0)) {
        var U=__FIELD.units; for(var i=0;i<U.length;i++){ var u=U[i]; if(!u.badges||!u.badges.length||!u.alive) continue;
          for(var b=0;b<u.badges.length;b++){ var d=fldBadgeDef(u.badges[b]); if(!d) continue;
            var k=u.id+':'+d.key; if(act[k] && !act[k].fired && _fldBadgeTrig(u,d)) act[k].fired=true; } }
      }
    }
    var usCas, csCas, log=null;
    if(multi){ usCas=__FIELD.battleCas.US; csCas=__FIELD.battleCas.CS;
      log=(__FIELD.phaseLog||[]).map(function(e){ return { name:e.name, w:e.winner, us:e.usCas, cs:e.csCas }; }); }
    else { usCas=Math.max(0, preUS-strength('US')); csCas=Math.max(0, preCS-strength('CS')); }
    return { seed:seed, w:__FIELD.winner, by:__FIELD.winBy, phase:__FIELD.phase, multi:multi,
             usCas:Math.round(usCas), csCas:Math.round(csCas), steps:n, log:log, act:(badgesOn?act:null) };
  }
  try {
    G.settings = G.settings || {}; G.settings.gfx='classic'; G.mode='menu';
    try { delete G.settings.tacticalPreset; } catch(e){}
    var reg = fldScenarioRegistry();
    var out = {};
    for(var k=0;k<ids.length;k++){
      var id=ids[k];
      if(!reg[id]) { out[id]={err:'not in registry'}; continue; }
      var offRuns=[], onRuns=[];
      for(var s=0;s<seeds.length;s++){ offRuns.push(runOne(id, seeds[s], false)); }
      for(var s2=0;s2<seeds.length;s2++){ onRuns.push(runOne(id, seeds[s2], true)); }
      out[id]={off:offRuns, on:onRuns};
    }
    return JSON.stringify({ ok:true, runs:out });
  } catch(e){ return JSON.stringify({ ok:false, err:String(e&&e.message||e), stack:String(e&&e.stack||'') }); }
})(${JSON.stringify(IDS)}, ${JSON.stringify(SEEDS)}, ${JSON.stringify(ASSERT_TRIGGERS.concat(RECORD_TRIGGERS))})`;

function majority(winners) {
  const dist = {};
  for (const w of winners) dist[w] = (dist[w] || 0) + 1;
  let best = null, bestN = -1, tie = false;
  for (const w of Object.keys(dist)) { if (dist[w] > bestN) { best = w; bestN = dist[w]; tie = false; } else if (dist[w] === bestN) tie = true; }
  return tie ? null : best;
}

function validate(res, artifact) {
  const failures = [];
  if (!res || res.ok !== true) { failures.push('in-page A/B failed: ' + String(res && res.err || 'unknown')); return failures; }
  for (const id of IDS) {
    const pair = res.runs[id];
    if (!pair || pair.err) { failures.push(id + ': ' + (pair && pair.err || 'no runs')); continue; }
    let bFail = 0;   // D481 fix: per-battle failure count (the first run's global-array `continue` skipped every later battle's validation)
    for (const sideName of ['off', 'on']) {
      const runs = pair[sideName];
      if (!Array.isArray(runs) || runs.length !== SEEDS.length) { failures.push(id + ' ' + sideName + ' run count wrong'); bFail++; continue; }
      for (const r of runs) {
        if (r.phase !== 'over') { failures.push(id + ' ' + sideName + ' seed=' + r.seed + ' did not finish (steps=' + r.steps + ')'); bFail++; }
        if (!['US', 'CS', 'draw'].includes(r.w)) { failures.push(id + ' ' + sideName + ' seed=' + r.seed + ' invalid winner=' + String(r.w)); bFail++; }
      }
    }
    if (bFail) continue;
    // MOVEMENT is recorded (off vs on, top-level + per-phase); direction authority = the battle's own probe (header).
    const moved = [];
    for (let s = 0; s < SEEDS.length; s++) {
      const off = pair.off[s], on = pair.on[s];
      if (off.w !== on.w) moved.push('seed=' + SEEDS[s] + ' top ' + off.w + '->' + on.w);
      if (off.multi && Array.isArray(off.log) && Array.isArray(on.log)) {
        for (let p = 0; p < Math.min(off.log.length, on.log.length); p++) {
          if (off.log[p].w !== on.log[p].w) moved.push('seed=' + SEEDS[s] + ' P' + p + ' ' + off.log[p].w + '->' + on.log[p].w);
        }
      }
    }
    // activation evidence: union across ON seeds; assert the non-extremis set (adjudication 9)
    const actUnion = {};
    for (const r of pair.on) { if (!r.act) continue; for (const k of Object.keys(r.act)) { if (!actUnion[k]) actUnion[k] = { trigger: r.act[k].trigger, fired: false }; if (r.act[k].fired) actUnion[k].fired = true; } }
    const never = [], neverRec = [];
    for (const k of Object.keys(actUnion)) {
      if (actUnion[k].fired) continue;
      if (ASSERT_TRIGGERS.includes(actUnion[k].trigger)) never.push(k + ' (' + actUnion[k].trigger + ')');
      else neverRec.push(k + ' (' + actUnion[k].trigger + ')');
    }
    if (never.length) failures.push(id + ' R-7 SILENT DEACTIVATION — gated badge never fired across ' + SEEDS.length + ' seeds: ' + never.join(' · '));
    const offDist = {}, onDist = {};
    for (const r of pair.off) offDist[r.w] = (offDist[r.w] || 0) + 1;
    for (const r of pair.on) onDist[r.w] = (onDist[r.w] || 0) + 1;
    const mean = (runs, k) => Math.round(runs.reduce((a, r) => a + r[k], 0) / runs.length);
    artifact.summary[id] = {
      offMajority: majority(pair.off.map(r => r.w)), offDist, onDist, moved,
      meanCas: { offUS: mean(pair.off, 'usCas'), offCS: mean(pair.off, 'csCas'), onUS: mean(pair.on, 'usCas'), onCS: mean(pair.on, 'csCas') },
      activation: Object.fromEntries(Object.entries(actUnion).map(([k, v]) => [k, (v.fired ? 'FIRED' : 'never') + ':' + v.trigger])),
      extremisNeverFired: neverRec,
    };
  }
  return failures;
}

async function main() {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null, browser = null;
  const artifact = { ok: false, ids: IDS, seeds: SEEDS, pageerrors: [], failures: [], summary: {}, raw: {} };
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
    const res = JSON.parse(await page.evaluate(RUN));
    await sleep(100);
    artifact.raw = res.runs || {};
    artifact.failures = validate(res, artifact);
    if (artifact.pageerrors.length) artifact.failures.push('pageerrors=' + artifact.pageerrors.length);
    console.log('BADGE A/B DIRECTION — ' + IDS.length + ' battles × ' + SEEDS.length + ' seeds × off/on');
    for (const id of Object.keys(artifact.summary)) {
      const s = artifact.summary[id];
      const d = x => ['US', 'CS', 'draw'].map(w => w + ' ' + (x[w] || 0)).join('/');
      console.log(id.padEnd(24) + ' OFF ' + d(s.offDist).padEnd(18) + ' ON ' + d(s.onDist).padEnd(18)
        + ' cas off US ' + s.meanCas.offUS + '/CS ' + s.meanCas.offCS + ' -> on US ' + s.meanCas.onUS + '/CS ' + s.meanCas.onCS);
      const neverKeys = Object.entries(s.activation).filter(([, v]) => v.startsWith('never')).map(([k, v]) => k + '(' + v.slice(6) + ')');
      if (neverKeys.length) console.log('    never-fired (extremis-only allowed): ' + neverKeys.join(' · '));
    }
    artifact.ok = artifact.failures.length === 0;
  } catch (e) {
    artifact.failures.push('fatal: ' + String(e && e.message || e));
    console.error('FATAL', e);
  } finally {
    writeFileSync(join(OUT, 'ab-badge-direction.json'), JSON.stringify(artifact, null, 2));
    console.log('\nwrote tools/shots/ab-badge-direction.json ok=' + artifact.ok + ' failures=' + artifact.failures.length + ' pageerrors=' + artifact.pageerrors.length);
    for (const f of artifact.failures) console.error('  AB FAIL:', f);
    await closeBrowserHard(browser);
    killChild(srv);
  }
  return artifact.ok;
}

main().then(ok => process.exit(ok ? 0 : 1)).catch(e => { console.error('FATAL', e); process.exit(1); });
