#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-attacker-parity.mjs — E53-v2 (D272) focused structural probe.
// The full direction/capture battery lives in .tmp/ab-e53-v2.mjs; this probe
// asserts the shipped runtime teeth that are cheap enough for vet:noreg.
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
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v:v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });

  function runBattle(opts, maxSteps, beforeLaunch, afterLaunch){
    if (beforeLaunch) beforeLaunch();
    G.campaign = null;
    fldLaunchSandbox(Object.assign({ renderer:'none', autoBoth:true }, opts));
    if (afterLaunch) afterLaunch();
    if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
    var n = 0, cap = maxSteps || 60000;
    while (__FIELD.phase === 'battle' && n < cap) { fldSimStep(0.05); n++; }
    function led(src){ src = src || {US:0,CS:0}; return [Math.round(src.US||0), Math.round(src.CS||0)]; }
    var cas;
    if (__FIELD.phases && __FIELD.battleCas) cas = led(__FIELD.battleCas);
    else { cas = [0,0];
      for (var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
        if (u.side!=='US'&&u.side!=='CS') continue;
        var f=Math.max(0,u.maxMen||0), left=u.alive?Math.max(0,u.men||0):0;
        cas[u.side==='US'?0:1]+=Math.max(0,f-left); }
      cas=[Math.round(cas[0]),Math.round(cas[1])]; }
    var capd = led((__FIELD.phases && __FIELD.battleCaptured) ? __FIELD.battleCaptured : __FIELD.captured);
    var mis = led((__FIELD.phases && __FIELD.battleMissing) ? __FIELD.battleMissing : __FIELD.missing);
    var st = (__FIELD._e53 && __FIELD._e53.gen === __FIELD._gen) ? __FIELD._e53 : null;
    var wingFlags = 0;
    for (var j=0;j<__FIELD.units.length;j++) if (__FIELD.units[j]._e53Wing) wingFlags++;
    return { w:__FIELD.winner, by:__FIELD.winBy, steps:n, endT:Math.round(__FIELD.t),
      cas:cas, cap:capd, mis:mis, parity:__FIELD.attackerParity,
      cautious:__FIELD._atkCautious, fog:__FIELD.fog,
      e53: st ? { wing:st.wingDeploys, wave:st.waveTicks, wingByPhase:st.wingByPhase } : null,
      wingFlags: wingFlags };
  }
  function tuple(r){ return JSON.stringify([r.w, r.by, r.steps, r.endT, r.cas, r.cap, r.mis]); }
  function offOn(opts, maxSteps){
    __FIELD._parityOff = true;  var off = runBattle(opts, maxSteps);
    __FIELD._parityOff = false; var on  = runBattle(opts, maxSteps);
    return { off: off, on: on };
  }
  function toothFlags(){
    __FIELD._officersOff = true; __FIELD._logisticsOff = true;
    __FIELD._armsOff = true; __FIELD._badgesOff = true;
    G.settings = G.settings || {}; G.settings.tacticalFog = false;
  }

  try {
    if (typeof fldLaunchSandbox !== 'function') return JSON.stringify({ ok:false, fatal:'engine missing' });
    G.settings = G.settings || {}; G.settings.gfx = 'classic';

    step('CONTRACT: T26 v2 seam, constants, and E53-only valve exist; C is absent', function(){
      if (typeof fldParityAiUnit !== 'function' || typeof fldParityState !== 'function' || typeof fldParityRecompute !== 'function')
        throw new Error('T26 functions missing');
      if (typeof fldParityCaptureValveActive !== 'function' || typeof fldSurrenderBlockedE53 !== 'function')
        throw new Error('E53 valve functions missing');
      if (FLD.E53_WING_DEPTH !== 180) throw new Error('E53_WING_DEPTH != 180: ' + FLD.E53_WING_DEPTH);
      if (FLD.E53_WING_X !== 120) throw new Error('E53_WING_X != 120: ' + FLD.E53_WING_X);
      if ('E53_ABANDON_X' in FLD) throw new Error('abandonment constant still present');
      var src = String(fldParityRecompute) + String(fldParityAiUnit);
      if (/abandon|routSince|denom/.test(src)) throw new Error('C/abandonment path still present in T26');
      return { depth:180, wingX:120, cAbsent:true }; });

    step('GATE FLAG: attackerParity defaults ON per launch; sticky _parityOff forces it OFF', function(){
      fldLaunchSandbox({ renderer:'none', scenario:'shiloh', autoBoth:true, seed:1, fog:false });
      if (__FIELD.attackerParity !== true) throw new Error('default not ON: ' + __FIELD.attackerParity);
      __FIELD._parityOff = true;
      fldLaunchSandbox({ renderer:'none', scenario:'shiloh', autoBoth:true, seed:1, fog:false });
      if (__FIELD.attackerParity !== false) throw new Error('_parityOff not honored');
      __FIELD._parityOff = false;
      return { defaultOn:true, hookOff:true }; });

    step('SYMMETRIC SANDBOX inert: parity-on == parity-off and no seam state', function(){
      var r = offOn({ seed:7 }, 20000);
      if (tuple(r.off) !== tuple(r.on)) throw new Error('sandbox differs: off ' + tuple(r.off) + ' on ' + tuple(r.on));
      if (r.on.e53 !== null) throw new Error('seam state created in sandbox');
      if (r.on.wingFlags !== 0) throw new Error('wing flags in sandbox');
      return { w:r.on.w, steps:r.on.steps }; });

    step('FOG-ON inert: parity-on == parity-off at fog-on Antietam', function(){
      var r = offOn({ scenario:'antietam', seed:1, fog:true }, 60000);
      if (tuple(r.off) !== tuple(r.on)) throw new Error('fog-on antietam differs: off ' + tuple(r.off) + ' on ' + tuple(r.on));
      if (r.on.e53 !== null) throw new Error('seam state created under fog');
      return { w:r.on.w, steps:r.on.steps }; });

    step('CAUTIOUS parity-inert: Fredericksburg, Malvern Hill, and Bull Run create no E53 seam state', function(){
      var ids = ['fredericksburg','malvernHill','bullrun1'], out = {};
      for (var i=0;i<ids.length;i++) {
        var r = offOn({ scenario:ids[i], seed:1, fog:false }, 60000);
        if (tuple(r.off) !== tuple(r.on)) throw new Error(ids[i] + ' parity-on/off differs: off ' + tuple(r.off) + ' on ' + tuple(r.on));
        if (r.on.e53 !== null || r.on.wingFlags !== 0) throw new Error('seam state/wing at cautious ' + ids[i]);
        out[ids[i]] = { w:r.on.w, steps:r.on.steps, cautious:r.on.cautious };
      }
      return out; });

    step('VALVE ISOLATION: E53 sidestep valve is parity/fog gated and still protects cautious capture ledgers', function(){
      fldLaunchSandbox({ renderer:'none', scenario:'shiloh', autoBoth:true, seed:1, fog:false });
      if (!fldParityCaptureValveActive()) throw new Error('valve inactive in active shiloh parity row');
      __FIELD._parityOff = true; fldLaunchSandbox({ renderer:'none', scenario:'shiloh', autoBoth:true, seed:1, fog:false });
      if (fldParityCaptureValveActive()) throw new Error('valve active while _parityOff');
      __FIELD._parityOff = false; fldLaunchSandbox({ renderer:'none', scenario:'shiloh', autoBoth:true, seed:1, fog:true });
      if (fldParityCaptureValveActive()) throw new Error('valve active under fog');
      fldLaunchSandbox({ renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1, fog:false });
      if (!fldParityCaptureValveActive()) throw new Error('valve should stay parity-active in cautious Bull Run');
      return { activeOnly:true, cautiousCaptureLedger:true }; });

    step('VALVE TOOTH: real lane alone can block, but x±RALLY_R sidestep lanes must also fail for E53 capture', function(){
      fldLaunchSandbox({ renderer:'none', scenario:'shiloh', autoBoth:true, seed:1, fog:false });
      var side = fldHomeEdgeZ('US') > 400 ? 'US' : 'CS';
      var enemy = fldEnemy(side), dir = (fldHomeEdgeZ(side) > 400) ? 1 : -1;
      var u = { id:'router', side:side, alive:true, state:'routing', x:600, z:400, men:100, maxMen:100 };
      __FIELD.units = [
        u,
        { id:'block-real', side:enemy, alive:true, state:'steady', x:600 + FLD.RALLY_R / 2, z:400 + dir * 90, men:100, maxMen:100 },
        { id:'friend-far', side:side, alive:true, state:'steady', x:600, z:400 - dir * 400, men:100, maxMen:100 }
      ];
      if (!fldSurrenderBlocked(u)) throw new Error('control real lane not blocked');
      if (fldSurrenderBlockedE53(u)) throw new Error('E53 valve captured despite open sidestep lanes');
      __FIELD.units.push({ id:'block-left', side:enemy, alive:true, state:'steady', x:600 - FLD.RALLY_R, z:400 + dir * 90, men:100, maxMen:100 });
      if (!fldSurrenderBlockedE53(u)) throw new Error('E53 valve did not capture when all three lanes blocked');
      return { realLane:true, sidestepValve:true }; });

    step('BULL RUN cautious-v2 tooth: clean fog-off accurate-input row stays CS 8/8', function(){
      var seeds = [1,7,21,42,55,101,303,909], wins = {}, vec = {};
      for (var i=0;i<seeds.length;i++) {
        var s = seeds[i];
        var r = runBattle({ scenario:'bullrun1', seed:s, fog:false }, 20000, toothFlags);
        vec['s'+s] = r.w; wins[r.w] = (wins[r.w] || 0) + 1;
        if (r.e53 !== null) throw new Error('E53 seam state on cautious Bull Run s' + s);
      }
      if ((wins.CS || 0) !== 8) throw new Error('Bull Run cautious-v2 tooth not CS 8/8: ' + JSON.stringify(vec));
      return { vector:vec }; });

    step('BULL RUN fog guard: cautious posture under fog is row-identical to stock fog doctrine', function(){
      var a = runBattle({ scenario:'bullrun1', seed:1, fog:true }, 60000);
      var b = runBattle({ scenario:'bullrun1', seed:1, fog:true }, 60000, null, function(){ __FIELD._atkCautious = false; });
      if (tuple(a) !== tuple(b)) throw new Error('fog cautious differs from stock fog: cautious ' + tuple(a) + ' stock ' + tuple(b));
      return { w:a.w, steps:a.steps }; });

    step('WING REACHABILITY: wing deploys at unflipped Shiloh and wave ticks advance', function(){
      var r = runBattle({ scenario:'shiloh', seed:1, fog:false }, 60000);
      if (!r.e53) throw new Error('no seam state at Shiloh');
      if (!(r.e53.wing > 0)) throw new Error('wingDeploys not >0: ' + JSON.stringify(r.e53));
      if (!(r.e53.wave > 0)) throw new Error('waveTicks not >0');
      return { w:r.w, by:r.by, wing:r.e53.wing, wave:r.e53.wave }; });

    step('WING GEOMETRY: attacker-only, half cap, defender-side station', function(){
      G.campaign = null;
      fldLaunchSandbox({ renderer:'none', scenario:'shiloh', autoBoth:true, seed:1, fog:false });
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      var n = 0; while (__FIELD.phase === 'battle' && n < 1200) { fldSimStep(0.05); n++; }
      var atk = __FIELD.attacker, o = __FIELD.objective, sgnA = (fldHomeEdgeZ(atk) > o.z) ? 1 : -1;
      var nAtk = 0, nWing = 0, badSide = 0, badStation = 0;
      for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i];
        if (u.side === atk && u.alive) nAtk++;
        if (!u._e53Wing) continue;
        nWing++;
        if (u.side !== atk) badSide++;
        if (u.alive && u.state !== 'routing' && u.order && u.order.type === 'move') {
          if ((u.order.tz - o.z) * sgnA >= 0) badStation++;
        }
      }
      if (badSide) throw new Error('wing flag on non-attacker');
      if (nWing > Math.floor(nAtk / 2)) throw new Error('wing exceeds half cap: ' + nWing + '/' + nAtk);
      if (nWing > 0 && badStation > 0) throw new Error('wing station on attacker side: ' + badStation);
      return { nAtk:nAtk, nWing:nWing, halfCap:Math.floor(nAtk/2) }; });

    step('PLAYER AGENCY: a player-commanded attacker never creates seam state', function(){
      G.campaign = null;
      fldLaunchSandbox({ renderer:'none', scenario:'antietam', seed:1, fog:false, playerSide:'US' });
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      var gen = __FIELD._gen;
      var n = 0; while (__FIELD.phase === 'battle' && n < 2400) { fldSimStep(0.05); n++; }
      if (__FIELD._e53 && __FIELD._e53.gen === gen) throw new Error('seam state created for player attacker');
      var flags = 0; for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i]._e53Wing) flags++;
      if (flags) throw new Error('wing flags on player attacker');
      return { seamInert:true, steps:n }; });

    step('DETERMINISM x2: same Shiloh seed reproduces byte-identically', function(){
      var a = runBattle({ scenario:'shiloh', seed:21, fog:false }, 60000);
      var b = runBattle({ scenario:'shiloh', seed:21, fog:false }, 60000);
      if (tuple(a) !== tuple(b)) throw new Error('row nondeterministic: ' + tuple(a) + ' vs ' + tuple(b));
      if (JSON.stringify(a.e53) !== JSON.stringify(b.e53)) throw new Error('diag nondeterministic');
      return { w:a.w, steps:a.steps, wing:a.e53 ? a.e53.wing : 0 }; });

  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<60;i++){ if(await up(probe))break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-attacker-parity.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-attacker-parity ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  const _pe = Array.isArray(result.pageerrors) ? result.pageerrors.length : 0;
  process.exit((result.ok && _pe === 0) ? 0 : 1);
})();
