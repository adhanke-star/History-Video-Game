#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-llm-commander.mjs — Q-D270-5 slice 1 (D283 law §4.3) focused probe.
// Pins the T27 LLM-commander engine seam OFFLINE: (a) digest purity ×2 + fog
// masking + band quantization; (b) the validation wall via the _t27MockPlan
// hook (legal plan lands exact; illegal orders fall to the engine field-for-
// field; malformed → whole-cycle fallback, last good plan stands; cadence is
// per-interval, never per-tick); (c) inertness — _llmOff / no-config /
// autoBoth / headless-renderer each independently yield ZERO _t27 state and a
// byte-identical outcome vs baseline; (d) the zero-network tooth — an in-page
// fetch/XHR/WebSocket/beacon spy PLUS a playwright request listener assert 0
// network calls across every leg (the mock is the only plan source). Network
// NEVER enters a probe (law §2.4/§4.3).
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

  // (d) THE ZERO-NETWORK SPY — installed before any leg runs. The seam's only
  // plan source is the mock hook, so every leg (armed legs included) must
  // drive the counter to exactly 0.
  var NET = { count: 0, calls: [] };
  (function(){
    var f0 = window.fetch;
    window.fetch = function(){ NET.count++; NET.calls.push('fetch:' + String(arguments[0]).slice(0,80)); return f0.apply(this, arguments); };
    var xo = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(m, u){ NET.count++; NET.calls.push('xhr:' + String(u).slice(0,80)); return xo.apply(this, arguments); };
    if (navigator.sendBeacon) { var b0 = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = function(u){ NET.count++; NET.calls.push('beacon:' + String(u).slice(0,80)); return b0.apply(null, arguments); }; }
    if (window.WebSocket) { var W0 = window.WebSocket; window.WebSocket = function(u){ NET.count++; NET.calls.push('ws:' + String(u).slice(0,80)); return new W0(u); }; }
  })();

  function clean(){ __FIELD._t27MockPlan = null; __FIELD._llmOff = false; __FIELD.llmCommander = false; __FIELD._t27 = null; }
  function csUnits(){ var out = []; for (var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if (u.side==='CS' && u.alive && u.ai) out.push(u); } return out; }
  function ordersJSON(side){ var out = []; for (var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
    if (u.side!==side) continue; out.push({ id:u.id, alive:u.alive, x:u.x, z:u.z, men:u.men, state:u.state, formation:u.formation, order:u.order }); }
    return JSON.stringify(out); }
  // run a NON-autoBoth 2D-renderer bullrun1 leg (the only context the armed
  // seam may live in): launch, optionally hook/arm, force battle phase (paused
  // stays true so the RAF loop never steps — all stepping is manual and
  // deterministic), step N ticks, snapshot, exit.
  function leg2d(mod, steps){
    G.campaign = null;
    clean();
    fldLaunchSandbox({ renderer:'2d', scenario:'bullrun1', seed:1, fog:false, playerSide:'US', autoPause:false });
    if (mod) mod();
    __FIELD.phase = 'battle';
    for (var n=0;n<steps;n++) fldSimStep(0.05);
    var snap = { orders: ordersJSON('CS'), us: ordersJSON('US'),
      t27: __FIELD._t27 ? { cycles:__FIELD._t27.cycles, applied:__FIELD._t27.applied, droppedN:__FIELD._t27.droppedN, malformed:__FIELD._t27.malformed, planN:__FIELD._t27.planN, side:__FIELD._t27.side } : null,
      llm: __FIELD.llmCommander };
    clean();
    fldExit(true);
    return snap;
  }
  function runHeadless(opts, mod, maxSteps){
    G.campaign = null;
    clean();
    fldLaunchSandbox(Object.assign({ renderer:'none' }, opts));
    if (mod) mod();
    if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
    var n = 0, cap = maxSteps || 60000;
    while (__FIELD.phase === 'battle' && n < cap) { fldSimStep(0.05); n++; }
    var cas = [0,0];
    for (var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
      if (u.side!=='US'&&u.side!=='CS') continue;
      var f=Math.max(0,u.maxMen||0), left=u.alive?Math.max(0,u.men||0):0;
      cas[u.side==='US'?0:1]+=Math.max(0,f-left); }
    var snap = { w:__FIELD.winner, by:__FIELD.winBy, steps:n, endT:Math.round(__FIELD.t),
      cas:[Math.round(cas[0]),Math.round(cas[1])],
      cap:[Math.round(__FIELD.captured.US||0),Math.round(__FIELD.captured.CS||0)],
      t27: __FIELD._t27 || null, llm: __FIELD.llmCommander };
    clean();
    return snap;
  }
  try {
    if (typeof fldLaunchSandbox !== 'function') return JSON.stringify({ ok:false, fatal:'engine missing' });
    G.settings = G.settings || {}; G.settings.gfx = 'classic';

    step('CONTRACT: T27 seam functions + constants + dispatch placement + source hygiene', function(){
      var fns = [fldLlmAiUnit, fldLlmDigest, fldLlmValidatePlan, fldLlmState, fldLlmRequestPlan, fldLlmCycle, fldLlmConfigured, fldLlmSide, fldLlmBand, fldLlmCompass];
      for (var i=0;i<fns.length;i++) if (typeof fns[i] !== 'function') throw new Error('T27 function ' + i + ' missing');
      if (FLD.LLM_PLAN_INTERVAL !== 25) throw new Error('LLM_PLAN_INTERVAL != 25: ' + FLD.LLM_PLAN_INTERVAL);
      if (FLD.LLM_BAND_MEN !== 250) throw new Error('LLM_BAND_MEN != 250');
      if (fldLlmConfigured() !== false) throw new Error('slice-1 fldLlmConfigured must be false (no connector exists)');
      var ai = String(fldAiUnit), iL = ai.indexOf('llmCommander'), iD = ai.indexOf('fldAiDefender');
      if (iL < 0 || iD < 0 || iL > iD) throw new Error('dispatch line not above fldAiDefender (llm@' + iL + ' def@' + iD + ')');
      var src = fns.map(String).join('');
      if (/fldRng/.test(src)) throw new Error('T27 touches fldRng');
      if (/playerCharge/.test(src)) throw new Error('T27 references playerCharge');
      if (/fetch\\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/.test(src)) throw new Error('network primitive in slice-1 T27 source');
      return { fns: fns.length, interval: 25, dispatchAboveDefender: true, srcClean: true }; });

    step('DIGEST PURITY: pure function of state — identical ×2, creates no _t27, writes nothing', function(){
      G.campaign = null; clean();
      fldLaunchSandbox({ renderer:'none', scenario:'bullrun1', seed:1, fog:false, autoBoth:true });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      for (var n=0;n<400;n++) fldSimStep(0.05);
      var before = ordersJSON('CS') + ordersJSON('US');
      var d1 = JSON.stringify(fldLlmDigest());
      var d2 = JSON.stringify(fldLlmDigest());
      if (d1 !== d2) throw new Error('digest not deterministic ×2');
      if (__FIELD._t27) throw new Error('digest created _t27 state');
      if (ordersJSON('CS') + ordersJSON('US') !== before) throw new Error('digest mutated unit state');
      var d = JSON.parse(d1);
      if (d.side !== 'CS') throw new Error('digest side wrong: ' + d.side);
      if (!d.own.length || !d.enemy.length) throw new Error('digest empty: own ' + d.own.length + ' enemy ' + d.enemy.length);
      return { side:d.side, own:d.own.length, enemy:d.enemy.length }; });

    step('DIGEST BANDS: men %250, positions %25, clock %5 — never an exact citable figure', function(){
      G.campaign = null; clean();
      fldLaunchSandbox({ renderer:'none', scenario:'bullrun1', seed:1, fog:false, autoBoth:true });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      for (var n=0;n<400;n++) fldSimStep(0.05);
      var d = fldLlmDigest(), i, differs = 0;
      var all = d.own.concat(d.enemy);
      if (!all.length) throw new Error('empty digest');
      for (i=0;i<all.length;i++){ var e = all[i];
        if (e.men % 250 !== 0) throw new Error('men not banded: ' + e.men);
        if (e.x % 25 !== 0 || e.z % 25 !== 0) throw new Error('pos not banded: ' + e.x + ',' + e.z);
        if (['N','NE','E','SE','S','SW','W','NW'].indexOf(e.facing) < 0) throw new Error('facing not compass-banded');
      }
      if (d.clock % 5 !== 0) throw new Error('clock not banded: ' + d.clock);
      for (i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
        if (u.alive && (u.side==='US'||u.side==='CS') && Math.round(u.men/250)*250 !== u.men) differs++; }
      if (differs === 0) throw new Error('no unit differs from its band mid-battle — band tooth vacuous');
      return { units: all.length, clock: d.clock, bandDiffers: differs }; });

    step('DIGEST FOG MASK: unseen enemies are simply absent (the D58/D64 fog law binds the LLM)', function(){
      G.campaign = null; clean();
      fldLaunchSandbox({ renderer:'none', scenario:'bullrun1', seed:1, fog:true, autoBoth:true });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      // step (deterministically) to the first state where the CS side has a genuinely
      // HIDDEN live US enemy, so the mask assertion cannot pass vacuously.
      function hiddenCount(){ var vis = (__FIELD.vis && __FIELD.vis.CS) || {}, h = 0;
        for (var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
          if (u.side==='US' && u.alive && !vis[u.id]) h++; } return h; }
      var n = 0;
      while (hiddenCount() === 0 && n < 4000 && __FIELD.phase === 'battle') { fldSimStep(0.05); n++; }
      var hidden = hiddenCount(), atT = Math.round(__FIELD.t);
      if (hidden === 0) throw new Error('fog tooth vacuous — no hidden enemy within 200 sim-s');
      var d = fldLlmDigest();
      var vis = (__FIELD.vis && __FIELD.vis.CS) || {};
      var expect = [], i;
      for (i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
        if (u.side!=='US' || !u.alive) continue;
        if (vis[u.id]) expect.push(u.id); }
      var got = d.enemy.map(function(e){ return e.id; });
      if (JSON.stringify(got.slice().sort()) !== JSON.stringify(expect.slice().sort()))
        throw new Error('digest enemies != visible set: got ' + JSON.stringify(got) + ' want ' + JSON.stringify(expect));
      fldLaunchSandbox({ renderer:'none', scenario:'bullrun1', seed:1, fog:false, autoBoth:true });
      var d2 = fldLlmDigest(), aliveUS = 0;
      for (i=0;i<__FIELD.units.length;i++){ var w=__FIELD.units[i]; if (w.side==='US' && w.alive) aliveUS++; }
      if (d2.enemy.length !== aliveUS) throw new Error('fog-off digest hides enemies: ' + d2.enemy.length + '/' + aliveUS);
      return { atT: atT, visible: expect.length, hidden: hidden, fogOffSees: d2.enemy.length }; });

    step('WALL LEGAL: a legal mock plan lands as EXACT u.order/u.formation writes, no playerCharge, no men/morale touch', function(){
      G.campaign = null; clean();
      fldLaunchSandbox({ renderer:'2d', scenario:'bullrun1', seed:1, fog:false, playerSide:'US', autoPause:false });
      __FIELD.phase = 'battle';
      var cs = csUnits(); if (cs.length < 3) throw new Error('need 3 CS AI units');
      var c1 = cs[0], c2 = cs[1], c3 = cs[2];
      var m1 = c1.men, mo1 = c1.morale, m2 = c2.men, m3 = c3.men;
      __FIELD._t27MockPlan = { orders: [
        { id: c1.id, type: 'move',   tx: 600, tz: 450, tface: 1.25, formation: 'column' },
        { id: c2.id, type: 'hold',   formation: 'line' },
        { id: c3.id, type: 'charge', tx: 610, tz: 440 } ] };
      __FIELD.llmCommander = true; __FIELD._t27 = null;
      var f2 = c2.facing, x2 = c2.x, z2 = c2.z;
      if (fldLlmAiUnit(c1) !== true) throw new Error('legal move not applied');
      if (JSON.stringify(c1.order) !== JSON.stringify({ type:'move', tx:600, tz:450, tface:1.25 })) throw new Error('move order not exact: ' + JSON.stringify(c1.order));
      if (c1.formation !== 'column') throw new Error('formation not applied');
      if (fldLlmAiUnit(c2) !== true) throw new Error('legal hold not applied');
      if (JSON.stringify(c2.order) !== JSON.stringify({ type:'hold', tx:x2, tz:z2, tface:f2 })) throw new Error('hold not anchored: ' + JSON.stringify(c2.order));
      if (c2.formation !== 'line') throw new Error('hold formation not applied');
      if (fldLlmAiUnit(c3) !== true) throw new Error('legal charge not applied');
      if (c3.order.type !== 'charge' || c3.order.tx !== 610 || c3.order.tz !== 440) throw new Error('charge not exact');
      if ('playerCharge' in c1.order || 'playerCharge' in c2.order || 'playerCharge' in c3.order) throw new Error('playerCharge leaked into an AI order');
      if (c1.men !== m1 || c1.morale !== mo1 || c2.men !== m2 || c3.men !== m3) throw new Error('order application touched men/morale');
      var st = __FIELD._t27;
      if (!st || st.cycles !== 1 || st.planN !== 3 || st.applied !== 3 || st.malformed !== 0) throw new Error('diagnostics wrong: ' + JSON.stringify(st && {c:st.cycles,p:st.planN,a:st.applied,m:st.malformed}));
      if (st.side !== 'CS') throw new Error('commanded side wrong: ' + st.side);
      clean(); fldExit(true);
      return { applied: 3, exact: true }; });

    step('WALL ILLEGAL: unknown/off-map/bad-enum/player-side/non-finite orders ALL drop and fall to the engine FIELD-FOR-FIELD', function(){
      var base = leg2d(null, 10);
      var armedSnap = null;
      var r = leg2d(function(){
        var cs = csUnits();
        var usId = null; for (var i=0;i<__FIELD.units.length;i++) if (__FIELD.units[i].side==='US') { usId = __FIELD.units[i].id; break; }
        __FIELD._t27MockPlan = { orders: [
          { id: 'no-such-brigade', type: 'move', tx: 600, tz: 450 },
          { id: cs[0].id, type: 'move', tx: -50, tz: 450 },
          { id: cs[1].id, type: 'retreat', tx: 600, tz: 450 },
          { id: cs[2].id, type: 'move', tx: 600, tz: 450, formation: 'square' },
          { id: usId, type: 'move', tx: 600, tz: 450 },
          { id: cs[0].id, type: 'move', tx: 600, tz: NaN } ] };
        __FIELD.llmCommander = true; __FIELD._t27 = null;
      }, 10);
      if (!r.t27) throw new Error('armed seam grew no state');
      if (r.t27.planN !== 0 || r.t27.applied !== 0 || r.t27.droppedN !== 6 || r.t27.malformed !== 0)
        throw new Error('wall verdicts wrong: ' + JSON.stringify(r.t27));
      if (r.orders !== base.orders) throw new Error('illegal-plan run diverged from the engine baseline');
      if (r.us !== base.us) throw new Error('player side perturbed');
      return { dropped: 6, fieldForField: true }; });

    step('WALL MALFORMED + CADENCE + CONTINUITY: garbage cycle → whole-cycle fallback, LAST GOOD PLAN stands; pulls are per-interval, never per-tick', function(){
      var calls = 0, dSides = [];
      var r = leg2d(function(){
        var cs = csUnits(), c1 = cs[0];
        __FIELD._probeC1 = c1.id;
        __FIELD._t27MockPlan = function(digest){
          calls++; dSides.push(digest && digest.side);
          if (calls === 1) return { orders: [ { id: c1.id, type: 'move', tx: 600, tz: 450, tface: 1.25 } ] };
          return 'not a plan';
        };
        __FIELD.llmCommander = true; __FIELD._t27 = null;
      }, 530);   // 26.5 sim-seconds: cycle 1 at the first AI pass, cycle 2 past LLM_PLAN_INTERVAL
      var c1id = __FIELD._probeC1; delete __FIELD._probeC1;
      if (calls !== 2) throw new Error('mock pulled ' + calls + ' times in 26.5s — cadence broken');
      if (dSides[0] !== 'CS') throw new Error('digest not passed to the plan source');
      if (!r.t27 || r.t27.cycles !== 2 || r.t27.malformed !== 1) throw new Error('malformed verdict wrong: ' + JSON.stringify(r.t27));
      if (r.t27.planN !== 1) throw new Error('last good plan not kept: planN=' + (r.t27 && r.t27.planN));
      if (r.t27.applied < 2) throw new Error('planned brigade not continuously commanded: applied=' + r.t27.applied);
      var rows = JSON.parse(r.orders), c1row = null;
      for (var i=0;i<rows.length;i++) if (rows[i].id === c1id) c1row = rows[i];
      if (!c1row || !c1row.alive) throw new Error('planned brigade missing/dead at 26.5s');
      // the engine converts an ARRIVED move to hold-in-place at the target (T0 fldStepMovement,
      // order-queue arrival), keeping tx/tz/tface — either form proves the LAST GOOD plan stands.
      var o = c1row.order;
      if (!o || (o.type !== 'move' && o.type !== 'hold') || o.tx !== 600 || o.tz !== 450 || o.tface !== 1.25)
        throw new Error('last good order not standing: ' + JSON.stringify(o));
      var ddx = c1row.x - 600, ddz = c1row.z - 450;
      if (Math.sqrt(ddx*ddx + ddz*ddz) > 120) throw new Error('planned brigade did not execute the standing order: ' + Math.round(Math.sqrt(ddx*ddx+ddz*ddz)) + 'yd off target');
      return { pulls: 2, malformed: 1, lastGoodStands: true, orderType: o.type }; });

    step('INERT _llmOff: the sticky hook alone yields zero _t27 + byte-identical vs baseline', function(){
      var base = leg2d(null, 400);
      var r = leg2d(function(){
        __FIELD._t27MockPlan = { orders: [ { id: csUnits()[0].id, type: 'move', tx: 600, tz: 450 } ] };
        __FIELD.llmCommander = true; __FIELD._t27 = null; __FIELD._llmOff = true;
      }, 400);
      if (r.t27 !== null) throw new Error('_llmOff leg grew _t27 state');
      if (r.llm !== false) throw new Error('_llmOff leg did not disarm');
      if (r.orders !== base.orders || r.us !== base.us) throw new Error('_llmOff leg diverged from baseline');
      return { inert: true }; });

    step('INERT NO-CONFIG: armed with NO plan source (slice 1 has no connector) yields zero _t27 + byte-identical', function(){
      var base = leg2d(null, 400);
      var r = leg2d(function(){ __FIELD.llmCommander = true; __FIELD._t27 = null; }, 400);
      if (r.t27 !== null) throw new Error('no-config leg grew _t27 state');
      if (r.llm !== false) throw new Error('no-config leg did not disarm');
      if (r.orders !== base.orders || r.us !== base.us) throw new Error('no-config leg diverged from baseline');
      return { inert: true }; });

    step('INERT autoBoth (the PM3 lock): a full armed autoBoth battle is byte-identical with zero _t27', function(){
      var base = runHeadless({ scenario:'bullrun1', seed:1, fog:false, autoBoth:true }, null, 20000);
      var r = runHeadless({ scenario:'bullrun1', seed:1, fog:false, autoBoth:true }, function(){
        var cs = csUnits();
        __FIELD._t27MockPlan = { orders: [ { id: cs[0].id, type: 'move', tx: 600, tz: 450 } ] };
        __FIELD.llmCommander = true; __FIELD._t27 = null;
      }, 20000);
      if (r.t27 !== null) throw new Error('autoBoth leg grew _t27 state');
      if (r.llm !== false) throw new Error('autoBoth leg did not disarm');
      var tb = JSON.stringify([base.w, base.by, base.steps, base.endT, base.cas, base.cap]);
      var tr = JSON.stringify([r.w, r.by, r.steps, r.endT, r.cas, r.cap]);
      if (tb !== tr) throw new Error('autoBoth armed differs: ' + tr + ' vs ' + tb);
      return { w: r.w, steps: r.steps }; });

    step('INERT HEADLESS RENDERER (the double lock): armed renderer-none playerSide battle refuses with zero _t27', function(){
      G.campaign = null; clean();
      fldLaunchSandbox({ renderer:'none', scenario:'bullrun1', seed:1, fog:false, playerSide:'US' });
      __FIELD._t27MockPlan = { orders: [ { id: csUnits()[0].id, type: 'move', tx: 600, tz: 450 } ] };
      __FIELD.llmCommander = true; __FIELD._t27 = null;
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      for (var n=0;n<400;n++) fldSimStep(0.05);
      var armedOrders = ordersJSON('CS'), t27 = __FIELD._t27, llm = __FIELD.llmCommander;
      clean();
      fldLaunchSandbox({ renderer:'none', scenario:'bullrun1', seed:1, fog:false, playerSide:'US' });
      __FIELD.phase = 'battle'; __FIELD.paused = false;
      for (n=0;n<400;n++) fldSimStep(0.05);
      var baseOrders = ordersJSON('CS');
      if (t27 !== null) throw new Error('headless leg grew _t27 state');
      if (llm !== false) throw new Error('headless leg did not disarm');
      if (armedOrders !== baseOrders) throw new Error('headless armed leg diverged from baseline');
      return { inert: true }; });

    step('DETERMINISM ×2: the ARMED active seam reproduces byte-identically', function(){
      function armedLeg(){ return leg2d(function(){
        var cs = csUnits();
        __FIELD._t27MockPlan = { orders: [
          { id: cs[0].id, type: 'move', tx: 600, tz: 450, formation: 'column' },
          { id: cs[1].id, type: 'hold' } ] };
        __FIELD.llmCommander = true; __FIELD._t27 = null;
      }, 400); }
      var a = armedLeg(), b = armedLeg();
      if (a.orders !== b.orders || a.us !== b.us) throw new Error('armed run nondeterministic');
      if (JSON.stringify(a.t27) !== JSON.stringify(b.t27)) throw new Error('diagnostics nondeterministic');
      if (!a.t27 || a.t27.applied < 2) throw new Error('armed seam did not command: ' + JSON.stringify(a.t27));
      return { applied: a.t27.applied, cycles: a.t27.cycles }; });

    step('ZERO NETWORK: 0 fetch/XHR/WebSocket/beacon calls across every leg (armed legs included)', function(){
      if (NET.count !== 0) throw new Error('network calls observed: ' + JSON.stringify(NET.calls));
      return { count: 0 }; });

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
    // the playwright half of tooth (d): only the frozen base engine's DOCUMENTED THREE-CDN script
    // loader (base.html _m3dLoadScripts, boot-triggered, pre-existing for every probe) is tolerated;
    // ANY other http(s) request — and any in-page fetch/XHR/WS/beacon at all (the spy) — is a red.
    const reqs = []; page.on('request', r => { const u = r.url();
      if (/^https?:/.test(u) && !u.startsWith('https://cdn.jsdelivr.net/npm/three@0.128.0/')) reqs.push(u); });
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    result.networkRequests = reqs;
    if (reqs.length) { result.ok = false; result.errors = (result.errors||[]).concat('PLAYWRIGHT network requests during legs: ' + JSON.stringify(reqs)); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-llm-commander.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-llm-commander ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0) + ' net=' + (result.networkRequests?result.networkRequests.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  const _pe = Array.isArray(result.pageerrors) ? result.pageerrors.length : 0;
  process.exit((result.ok && _pe === 0) ? 0 : 1);
})();
