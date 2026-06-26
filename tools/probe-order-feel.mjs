#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-order-feel.mjs — H5-i1 (D139): the GAMEPLAY vetting for the UG:G movement & ordering FEEL.
// This is the D74 carve-out: movement/order changes alter the PLAYER control surface, so they are vetted as
// gameplay (synthetic-gesture assertions on the resulting u.order/u.queue) — NOT via byte-identity. The byte-
// identity of the headless AI-vs-AI sim is proven SEPARATELY (probe-presets + probe-phased-ab staying 0-diff)
// and re-pinned here by the no-AI-queue / no-AI-dig invariant step. Drives the resolver (fldResolveOrderGesture)
// + the queue advance (fldStepMovement hook) + the dig-rate buff (fldEngStep) on the renderer-agnostic sim.
// Writes shots/probe-order-feel.json (+ a 2D ghost screenshot).
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
  var R = { steps: [], errors: [], ok: true, logs: {} };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function near(a,b,eps){ return Math.abs(a-b) <= (eps||0.5); }
  function playerUnit(){ for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side==='US'&&u.alive&&!u.ai) return u; } return null; }
  function enemies(){ var o=[]; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side==='CS'&&u.alive) o.push(u); } return o; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldResolveOrderGesture!=='function')
      return JSON.stringify({ok:false, fatal:'T20 order-feel engine missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('PLACE+FACE: drag from open ground sets a MOVE order with facing from the drag', function(){
      fldLaunchSandbox({renderer:'none', seed:12345});   // not autoBoth -> US is the player side
      var u=playerUnit(); if(!u) throw new Error('no player unit');
      u.facing=0; __FIELD.sel=[u.id];
      var px=u.x+40, pz=u.z-60;
      // drag "north" from the press point (px,pz): facing = atan2(0, -(-90)) = 0 ... use a +x drag for a clear angle
      fldResolveOrderGesture(fldPlayerSel(), { x0:px, z0:pz, x:px+90, z:pz });
      if(u.order.type!=='move') throw new Error('want move, got '+u.order.type);
      if(!near(u.order.tx,px)||!near(u.order.tz,pz)) throw new Error('destination wrong: '+u.order.tx+','+u.order.tz+' want '+px+','+pz);
      var want=Math.atan2(90,0);  // a +x drag
      if(!near(u.order.tface, want, 0.01)) throw new Error('facing not from drag: '+u.order.tface+' want '+want);
      return { type:u.order.type, tface:Math.round(u.order.tface*1000)/1000 }; });

    step('TAP keeps facing (a short drag = a tap; destination only)', function(){
      var u=playerUnit(); u.facing=1.234; __FIELD.sel=[u.id];
      var px=u.x-30, pz=u.z+20;
      fldResolveOrderGesture(fldPlayerSel(), { x0:px, z0:pz, x:px+4, z:pz+3 });  // < FLD_DRAG_MIN
      if(u.order.type!=='move') throw new Error('want move');
      if(!near(u.order.tface, 1.234, 0.001)) throw new Error('tap changed facing: '+u.order.tface);
      return { keptFacing:Math.round(u.order.tface*1000)/1000 }; });

    step('DRAG-ONTO-ENEMY charges THAT brigade (the chosen foe, not nearest)', function(){
      var u=playerUnit(); __FIELD.sel=[u.id];
      var es=enemies(); if(es.length<2) throw new Error('need 2 enemies, got '+es.length);
      // pick the FARTHER enemy so "charge the dropped-on foe" is distinguishable from "charge nearest"
      es.sort(function(a,b){ return Math.hypot(a.x-u.x,a.z-u.z)-Math.hypot(b.x-u.x,b.z-u.z); });
      var near0=es[0], far=es[es.length-1];
      if(near(near0.x, far.x, 1)) throw new Error('two enemies share an x; test not meaningful');
      fldResolveOrderGesture(fldPlayerSel(), { x0:far.x, z0:far.z, x:far.x, z:far.z });
      if(u.order.type!=='charge') throw new Error('want charge, got '+u.order.type);
      if(!near(u.order.tx, far.x, 1)) throw new Error('charged the wrong foe: tx='+u.order.tx+' wantFar='+far.x+' near='+near0.x);
      return { charged:'far', tx:Math.round(u.order.tx) }; });

    step('CHARGE default (no explicit target) still hits the NEAREST foe — invariant #2 byte-identity', function(){
      var u=playerUnit(); var es=enemies();
      es.sort(function(a,b){ return Math.hypot(a.x-u.x,a.z-u.z)-Math.hypot(b.x-u.x,b.z-u.z); });
      var nearest=es[0];
      fldOrderCharge(u);   // no target -> the verbatim nearest-enemy scan
      if(u.order.type!=='charge') throw new Error('want charge');
      if(!near(u.order.tx, nearest.x, 1)||!near(u.order.tz, nearest.z, 1)) throw new Error('default charge not nearest');
      return { nearestX:Math.round(nearest.x) }; });

    step('CHARGE LOCK: player charge has a grace window, then blocks move/hold/queue/re-aim until contact or target loss', function(){
      fldLaunchSandbox({renderer:'none', seed:22});
      var u=playerUnit(), e=enemies()[0]; if(!u||!e) throw new Error('need player unit and enemy');
      __FIELD.sel=[u.id]; __FIELD.t=10;
      fldOrderCharge(u, e, { player:true });
      if(!u.order.playerCharge || u.order.tid!==e.id) throw new Error('player charge was not primed');
      if(fldChargeLocked(u)) throw new Error('charge locked during grace window');
      fldApplyOrder(u, { type:'move', tx:u.x+80, tz:u.z, tface:u.facing });
      if(u.order.type!=='move') throw new Error('grace window should allow a correction move');
      fldOrderCharge(u, e, { player:true });
      __FIELD.t += FLD_CHARGE_GRACE + 0.1;
      fldChargeStep(u);
      if(!fldChargeLocked(u) || !u.order.committed) throw new Error('charge did not commit after grace');
      var oldTx=u.order.tx, oldFace=u.order.tface, oldQ=u.queue?u.queue.length:0;
      fldApplyOrder(u, { type:'move', tx:u.x+220, tz:u.z+20, tface:1.1 });
      if(u.order.type!=='charge' || !near(u.order.tx, oldTx, 0.01)) throw new Error('committed charge accepted an immediate move');
      if(fldEnqueueOrder(u, { type:'move', tx:u.x+300, tz:u.z, tface:0 }) !== false) throw new Error('committed charge accepted a queued order');
      if((u.queue?u.queue.length:0)!==oldQ) throw new Error('queue length changed under committed charge');
      fldResolveOrderGesture([u], { aimUid:u.id, x0:u.x, z0:u.z, x:u.x+90, z:u.z });
      if(!near(u.order.tface, oldFace, 0.001)) throw new Error('committed charge accepted a re-aim gesture');
      fldSelHold();
      if(u.order.type!=='charge') throw new Error('committed charge accepted hold');
      u.state='routing';
      if(fldChargeLocked(u)) throw new Error('own rout should release the charge lock');
      u.state='steady';
      if(!fldChargeLocked(u)) throw new Error('lock should resume after restoring steady pre-contact');
      u.alive=false;
      if(fldChargeLocked(u)) throw new Error('own death should release the charge lock');
      u.alive=true;
      if(!fldChargeLocked(u)) throw new Error('lock should resume after restoring alive pre-contact');
      e.state='routing';
      if(fldChargeLocked(u)) throw new Error('target loss should release the lock');
      fldApplyOrder(u, { type:'move', tx:u.x+120, tz:u.z, tface:0.4 });
      if(u.order.type!=='move') throw new Error('target-loss release did not allow a fresh move');
      return { grace:'correction allowed', committed:true, queueBlocked:true, releasedOnOwnRoutDeath:true, releasedOnTargetLoss:true }; });

    step('SHIFT-QUEUE: a shift-drag appends a waypoint without disturbing the active order', function(){
      var u=playerUnit(); u.facing=0; __FIELD.sel=[u.id]; u.queue=null;
      // immediate move first
      fldResolveOrderGesture(fldPlayerSel(), { x0:u.x+100, z0:u.z, x:u.x+100, z:u.z, shift:false });
      var firstTx=u.order.tx;
      if(u.queue) throw new Error('immediate order should clear the queue');
      // now a SHIFT order while moving -> queued, the active order untouched
      fldResolveOrderGesture(fldPlayerSel(), { x0:u.x+200, z0:u.z+50, x:u.x+200, z:u.z+50, shift:true });
      if(!u.queue || u.queue.length!==1) throw new Error('shift did not enqueue: '+(u.queue?u.queue.length:'null'));
      if(!near(u.order.tx, firstTx)) throw new Error('shift disturbed the active order');
      return { queued:u.queue.length, activeTx:Math.round(u.order.tx) }; });

    step('QUEUE ADVANCE: arriving at a waypoint pops the next one (fldStepMovement hook)', function(){
      var u=playerUnit(); u.state='steady';
      // arrive at the current order, with one queued waypoint waiting
      u.order={type:'move', tx:u.x, tz:u.z, tface:0};
      var Q={ type:'move', tx:u.x+300, tz:u.z-120, tface:0.5 };
      u.queue=[Q];
      fldStepMovement(u, 0.05);   // dd<ARRIVE -> the arrival branch advances the queue
      if(u.order.tx!==Q.tx || u.order.tz!==Q.tz) throw new Error('queue did not advance: order.tx='+u.order.tx+' want '+Q.tx);
      if(u.queue.length!==0) throw new Error('queue not consumed: len='+u.queue.length);
      return { advancedToTx:Math.round(u.order.tx), queueLen:u.queue.length }; });

    step('RE-AIM HANDLE: an aim gesture swings facing toward the pointer, keeps the destination', function(){
      var u=playerUnit(); var px=u.x+150, pz=u.z-40;
      u.order={type:'move', tx:px, tz:pz, tface:0}; __FIELD.sel=[u.id];
      // pointer to the +x of the destination -> facing = atan2(+dx, 0) = +pi/2
      fldResolveOrderGesture(fldPlayerSel(), { aimUid:u.id, x0:px, z0:pz, x:px+120, z:pz });
      if(!near(u.order.tx, px)||!near(u.order.tz, pz)) throw new Error('re-aim moved the destination');
      if(!near(u.order.tface, Math.PI/2, 0.01)) throw new Error('re-aim facing wrong: '+u.order.tface);
      return { tface:Math.round(u.order.tface*1000)/1000 }; });

    step('HANDLE HIT-TEST: a press near a unit\\'s facing handle finds it; a far press does not', function(){
      var u=playerUnit(); u.order={type:'move', tx:u.x, tz:u.z, tface:0}; __FIELD.sel=[u.id];
      // tface 0 -> handle tip at (tx + sin0*70, tz - cos0*70) = (tx, tz-70)
      var hit=fldHandleHit({ x:u.order.tx, z:u.order.tz-70 });
      if(!hit || hit.id!==u.id) throw new Error('handle not found at its tip');
      var miss=fldHandleHit({ x:u.order.tx+400, z:u.order.tz+400 });
      if(miss) throw new Error('handle falsely found far away');
      return { hit:hit.id }; });

    step('fldEnemyAt respects fog (no peeking at unscouted foes) + range', function(){
      fldLaunchSandbox({renderer:'none', seed:7});
      var es=enemies(); var e=es[0];
      var got=fldEnemyAt(e.x, e.z, 'US', 58); if(!got || got.id!==e.id) throw new Error('did not find an in-range visible enemy');
      var none=fldEnemyAt(e.x+5000, e.z, 'US', 58); if(none) throw new Error('found an enemy out of range');
      // with fog ON and the foe unscouted, the cursor must not reveal it
      __FIELD.fog=true; __FIELD.vis={US:{},CS:{}};   // empty visibility -> nothing scouted
      var hidden=fldEnemyAt(e.x, e.z, 'US', 58); if(hidden) throw new Error('fog leak: charged a hidden enemy');
      __FIELD.fog=false;
      return { fogHeld:true }; });

    step('FASTER DIGGING (D139 dig-rate buff): a player parapet completes by ~42s @ Balanced (was ~70s)', function(){
      fldLaunchSandbox({renderer:'none', seed:3});
      var u=playerUnit();
      // a clean (non-digging) unit stays at entrench 0 -> byte-identical baseline
      if(typeof fldEngStep==='function'){ fldEngStep(0.5); if(u.entrench) throw new Error('clean unit gained entrench: '+u.entrench); }
      // now dig in place at Balanced realism (sev.attrition 1) and time it
      __FIELD.sev = __FIELD.sev || {}; __FIELD.sev.attrition=1;
      u.state='steady'; u.order={type:'hold',tx:u.x,tz:u.z,tface:0}; u.digging=true; u.digX=u.x; u.digZ=u.z; u.entrench=0;
      var full=-1; for(var k=0;k<200;k++){ fldEngStep(0.5); if(full<0 && u.entrench>=0.999) { full=(k+1)*0.5; break; } }
      R.logs.digToFullSecBalanced = full;
      R.logs.digToFullSecOld = 70;
      if(full<0 || full>43) throw new Error('parapet did not complete by ~42s: '+full);
      if(full<30) throw new Error('parapet suspiciously fast (<30s): '+full);
      return { digToFullSec:full, prevBase:70 }; });

    step('NO-AI-QUEUE / NO-AI-DIG invariant: a full AI-vs-AI battle leaves every unit queue-less + un-dug', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:99});
      fldStepN(120, 0.05);   // flip deploy->battle and get the AI maneuvering before the run-to-end loop
      var n=120; while(__FIELD.phase==='battle' && n<12000){ fldSimStep(0.05); n++; }
      if(n<=120) throw new Error('AI battle never ran (phase='+__FIELD.phase+')');
      var withQueue=0, withDig=0;
      for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
        if(u.queue && u.queue.length) withQueue++;
        if(u.digging || (u.entrench && u.entrench>0)) withDig++; }
      if(withQueue!==0) throw new Error(withQueue+' AI units carried a queue (byte-identity invariant broken)');
      if(withDig!==0) throw new Error(withDig+' AI units dug in (dig-rate would become balance-affecting)');
      return { steps:n, queued:withQueue, dug:withDig }; });

    step('2D GHOST renders without throwing (drag move, drag-to-charge, and re-aim)', function(){
      fldLaunchSandbox({renderer:'2d', seed:42});
      var u=playerUnit(); __FIELD.sel=[u.id];
      __FIELD.phase='battle'; __FIELD.paused=true;
      // a move-place ghost
      __FIELD.drag={ x0:u.x+60, z0:u.z-40, x:u.x+120, z:u.z-40, shift:false };
      fld2dDraw();
      // a queued (shift) ghost
      __FIELD.drag.shift=true; fld2dDraw();
      // a drag-onto-enemy ghost
      var e=enemies()[0]; __FIELD.drag={ x0:u.x, z0:u.z, x:e.x, z:e.z };
      fld2dDraw();
      // a re-aim ghost (handle drag)
      u.order={type:'move',tx:u.x+100,tz:u.z,tface:0};
      __FIELD.drag={ aimUid:u.id, x0:u.x+100, z0:u.z, x:u.x+160, z:u.z };
      fld2dDraw();
      __FIELD.drag=null; fld2dDraw();   // idle (no drag) — standing handles only
      fldExit(true);
      return { drew:true }; });

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
    await page.goto(probe, { waitUntil:'load', timeout:60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    // a 2D ghost screenshot for the eye
    try {
      await page.evaluate(`(function(){
        fldLaunchSandbox({renderer:'2d', seed:42});
        var u=null; for(var i=0;i<__FIELD.units.length;i++){ if(__FIELD.units[i].side==='US'&&!__FIELD.units[i].ai){u=__FIELD.units[i];break;} }
        __FIELD.sel=[u.id]; __FIELD.phase='battle'; __FIELD.paused=true;
        __FIELD.drag={ x0:u.x+30, z0:u.z-30, x:u.x+140, z:u.z-90, shift:false };
        fld2dDraw(); fldRenderTop(); fldRenderHud();
      })()`);
      await sleep(200);
      await page.screenshot({ path: join(OUT,'probe-order-feel.png') });
      await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
    } catch(e){ result.shotErr = String(e&&e.message||e); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-order-feel.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-order-feel ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.logs) console.log('  logs ' + JSON.stringify(result.logs));
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
