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
  function fireKey(target,key,opts){ opts=opts||{}; var ev=new KeyboardEvent('keydown',{key:key,bubbles:true,cancelable:true,shiftKey:!!opts.shiftKey}); (target||document.getElementById('fldRoot')).dispatchEvent(ev); return ev; }
  function firePointer(type,x,z,shift){
    var cv=document.getElementById('fldGl'), v=fld2dView(), r=cv.getBoundingClientRect();
    var cx=r.left+v.ox+x*v.s, cy=r.top+v.oz+z*v.s, C=(typeof PointerEvent==='function'?PointerEvent:MouseEvent);
    var ev=new C(type,{clientX:cx,clientY:cy,bubbles:true,cancelable:true,shiftKey:!!shift,button:0});
    (type==='pointerup'?window:cv).dispatchEvent(ev); return ev;
  }
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

    step('E23 LOCK RELEASE: melee contact with a NON-target (interposing) enemy returns the brigade to control', function(){
      fldLaunchSandbox({renderer:'none', seed:31});
      var u=playerUnit(); var es=enemies(); if(!u||es.length<2) throw new Error('need player + 2 enemies');
      var A=es[0], B=es[1];
      __FIELD.sel=[u.id]; __FIELD.t=10;
      fldOrderCharge(u, A, { player:true });
      __FIELD.t += FLD_CHARGE_GRACE + 0.1; fldChargeStep(u);
      if(!fldChargeLocked(u)) throw new Error('charge did not commit');
      fldChargeContact(u, B);   // the T0 melee-loop seam: contact with interposer B, NOT the charged target A
      if(u.order.playerCharge) throw new Error('interposer contact did not clear playerCharge');
      if(!u.order.contact) throw new Error('interposer contact did not set the contact flag');
      if(fldChargeLocked(u)) throw new Error('lock survived melee contact with a non-target enemy');
      if(!fldApplyOrder(u, { type:'move', tx:u.x+50, tz:u.z, tface:0 })) throw new Error('release did not allow a fresh move');
      return { releasedOnInterposer:true }; });

    step('E03 LOCK RELEASE: a charge stalled at impassable water settles to HOLD at the bank (no soft-lock)', function(){
      fldLaunchSandbox({renderer:'none', seed:32});
      var u=playerUnit(), e=enemies()[0]; if(!u||!e) throw new Error('need player unit and enemy');
      if(typeof fldEngMoveGate!=='function') throw new Error('T13 move gate missing');
      __FIELD.sel=[u.id]; __FIELD.t=10;
      fldOrderCharge(u, e, { player:true });
      __FIELD.t += FLD_CHARGE_GRACE + 0.1; fldChargeStep(u);
      if(!fldChargeLocked(u)) throw new Error('charge did not commit');
      var _gate=fldEngMoveGate;
      try {   // stage the T13 river-bank clamp: the gate returns the start point -> ~zero forward progress
        fldEngMoveGate=function(uu,x0,z0){ return { x:x0, z:z0 }; };
        fldStepMovement(u, 0.1);
      } finally { fldEngMoveGate=_gate; }
      if(u.order.type!=='hold') throw new Error('stalled charge did not settle to hold: '+u.order.type);
      if(fldChargeLocked(u)) throw new Error('lock survived the stall at the bank');
      if(!fldApplyOrder(u, { type:'move', tx:u.x+50, tz:u.z, tface:0 })) throw new Error('stall release did not allow a fresh move');
      return { releasedAtBank:true }; });

    step('E34 LOCK RELEASE is PERMANENT through rout->rally (no re-lock into the broken charge)', function(){
      fldLaunchSandbox({renderer:'none', seed:33});
      var u=playerUnit(), e=enemies()[0]; if(!u||!e) throw new Error('need player unit and enemy');
      __FIELD.sel=[u.id]; __FIELD.t=10;
      fldOrderCharge(u, e, { player:true });
      __FIELD.t += FLD_CHARGE_GRACE + 0.1; fldChargeStep(u);
      if(!fldChargeLocked(u)) throw new Error('charge did not commit');
      // break the brigade, then rally it far from danger via the REAL state machine (fldMoraleStep)
      u.state='routing'; u.rallyT=0; u.x=40; u.z=40;
      for(var i=0;i<__FIELD.units.length;i++){ var en=__FIELD.units[i]; if(en.side!==u.side){ en.x=FLD.FIELD_W-20; en.z=FLD.FIELD_H-20; } }
      var guard=0; while(u.state==='routing' && guard<4000){ fldMoraleStep(u, 0.25); guard++; }
      if(u.state==='routing') throw new Error('unit never rallied (guard exhausted)');
      if(u.order.type!=='hold') throw new Error('rally did not settle to hold under player control: '+u.order.type+' playerCharge='+!!(u.order&&u.order.playerCharge));
      if(fldChargeLocked(u)) throw new Error('lock re-engaged after rally');
      if(!fldApplyOrder(u, { type:'move', tx:u.x+50, tz:u.z, tface:0 })) throw new Error('rallied unit refused a fresh order');
      return { ralliedUnderControl:true, rallySteps:guard }; });

    step('S10 PIVOT-IN-PLACE: a HOLDING line has a grabbable handle and re-faces without moving the men', function(){
      fldLaunchSandbox({renderer:'none', seed:34});
      var u=playerUnit(); __FIELD.sel=[u.id];
      u.order={type:'hold', tx:u.x, tz:u.z, tface:0}; u.facing=0; u.state='steady';
      if(!fldOrderHasHandle(u)) throw new Error('holding unit has no facing handle');
      var hit=fldHandleHit({ x:u.order.tx, z:u.order.tz-70 });   // tface 0 -> tip at (tx, tz-70)
      if(!hit || hit.id!==u.id) throw new Error('hold handle not found at its tip');
      var px=u.x, pz=u.z;
      fldResolveOrderGesture([u], { aimUid:u.id, x0:u.x, z0:u.z, x:u.x+120, z:u.z });   // pointer at +x -> tface pi/2
      if(u.order.type!=='hold') throw new Error('re-aim changed the order type: '+u.order.type);
      if(!near(u.order.tx,px)||!near(u.order.tz,pz)) throw new Error('re-aim displaced the held position');
      if(!near(u.order.tface, Math.PI/2, 0.01)) throw new Error('pivot facing wrong: '+u.order.tface);
      fldStepMovement(u, 0.5);   // the arrival branch turns toward tface without moving
      if(!near(u.x,px,0.001)||!near(u.z,pz,0.001)) throw new Error('pivot moved the men');
      if(!(Math.abs(u.facing)>0.001)) throw new Error('facing did not begin turning toward the pivot');
      // NO DEAD-ZONE: a TAP on the hold handle (no real drag) falls through to a plain forward MOVE,
      // so the ~70-116yd band ahead of a standing line still nudges the men exactly as pre-S10
      u.order={type:'hold', tx:u.x, tz:u.z, tface:0}; u.facing=0;
      var mx=u.x, mz=u.z-90;   // press ~90yd dead ahead, inside the handle-grab band
      fldResolveOrderGesture([u], { aimUid:u.id, x0:mx, z0:mz, x:mx+3, z:mz+2 });
      if(u.order.type!=='move') throw new Error('hold-handle TAP did not fall through to a move: '+u.order.type);
      if(!near(u.order.tx,mx)||!near(u.order.tz,mz)) throw new Error('tap-nudge went to the wrong point: '+u.order.tx+','+u.order.tz);
      if(!near(u.order.tface,0,0.001)) throw new Error('tap-nudge changed facing: '+u.order.tface);
      return { pivotedTface:Math.round(Math.PI/2*1000)/1000, turned:'yes', tapNudge:'move' }; });

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

    step('S40 REAL KEYS — M + arrows choose an endpoint, brackets set facing, Enter commits through the T20 resolver', function(){
      fldLaunchSandbox({renderer:'2d', seed:140});
      var u=playerUnit(); if(!u) throw new Error('no player unit');
      __FIELD.phase='battle'; __FIELD.paused=true; __FIELD.sel=[u.id];
      u.state='steady'; u.facing=0; u.order={type:'hold',tx:u.x,tz:u.z,tface:0}; u.queue=null;
      var root=document.getElementById('fldRoot'); root.focus();
      var sx=u.x, sz=u.z, oldRm=G.settings.reduceMotion; G.settings.reduceMotion=true;
      fireKey(root,'m');
      var c=__FIELD.orderCursor, badge=document.getElementById('fldOrderKey');
      if(!c) throw new Error('M did not open the keyboard order cursor');
      if(!badge || badge.textContent.indexOf('Shift+Enter waypoint')<0) throw new Error('visible keyboard-order instructions missing');
      var bcs=getComputedStyle(badge);
      if(bcs.animationName!=='none' || parseFloat(bcs.transitionDuration||'0')>0) throw new Error('keyboard cursor UI animates under reduceMotion');
      fireKey(root,'ArrowRight'); fireKey(root,'ArrowRight'); fireKey(root,'ArrowUp');
      if(!near(c.x,sx+60,0.01)||!near(c.z,sz-30,0.01)) throw new Error('arrow endpoint wrong: '+c.x+','+c.z+' want '+(sx+60)+','+(sz-30));
      fireKey(root,']'); fireKey(root,']');
      if(!near(c.facing,Math.PI/6,0.001)) throw new Error('bracket facing wrong: '+c.facing);
      if(String((document.getElementById('fldLive')||{}).textContent||'').indexOf('30 degrees clockwise from north')<0) throw new Error('screen-reader facing status is not exact');
      var ghost=fldOrderGhostGesture(); if(!ghost || !ghost.keyboard) throw new Error('keyboard cursor did not reach the order ghost');
      fld2dDraw();
      fireKey(root,'Enter');
      if(__FIELD.orderCursor || document.getElementById('fldOrderKey')) throw new Error('commit left keyboard cursor UI/state behind');
      if(u.order.type!=='move'||!near(u.order.tx,sx+60,0.01)||!near(u.order.tz,sz-30,0.01)) throw new Error('committed endpoint wrong: '+JSON.stringify(u.order));
      if(!near(u.order.tface,Math.PI/6,0.001)) throw new Error('committed facing wrong: '+u.order.tface);
      if(String((document.getElementById('fldLive')||{}).textContent||'').indexOf('March ordered')<0) throw new Error('commit was not announced');
      if(oldRm==null) delete G.settings.reduceMotion; else G.settings.reduceMotion=oldRm;
      return { dx:60, dz:-30, facingDeg:30, committed:true, staticUnderReduceMotion:true }; });

    step('S40 REAL KEYS — Escape cancels the pending endpoint/facing edit without exiting or changing the order', function(){
      var u=playerUnit(), root=document.getElementById('fldRoot');
      u.order={type:'move',tx:u.x+90,tz:u.z-20,tface:0.4}; u.queue=null; __FIELD.sel=[u.id];
      var before=JSON.stringify(u.order);
      fireKey(root,'m'); fireKey(root,'ArrowLeft'); fireKey(root,'['); fireKey(root,'Escape');
      if(__FIELD.orderCursor || document.getElementById('fldOrderKey')) throw new Error('Escape left cursor UI/state behind');
      if(JSON.stringify(u.order)!==before) throw new Error('cancel mutated the live order: '+JSON.stringify(u.order)+' vs '+before);
      if(!__FIELD.launched || __FIELD.phase!=='battle' || !document.getElementById('fldRoot')) throw new Error('Escape canceled the battle instead of the cursor');
      if(String((document.getElementById('fldLive')||{}).textContent||'').indexOf('Keyboard order canceled')<0) throw new Error('cancel was not announced');
      return { orderUntouched:true, battleStayedOpen:true }; });

    step('S40 REAL KEYS — Shift+Enter appends one waypoint without disturbing the active order', function(){
      var u=playerUnit(), root=document.getElementById('fldRoot');
      u.order={type:'move',tx:u.x+100,tz:u.z-40,tface:0.2}; u.queue=null; __FIELD.sel=[u.id];
      var ax=u.order.tx, az=u.order.tz, af=u.order.tface;
      fireKey(root,'m'); fireKey(root,'ArrowDown'); fireKey(root,'Enter',{shiftKey:true});
      if(!u.queue || u.queue.length!==1) throw new Error('Shift+Enter did not append exactly one waypoint: '+(u.queue?u.queue.length:'null'));
      if(!near(u.order.tx,ax,0.001)||!near(u.order.tz,az,0.001)||!near(u.order.tface,af,0.001)) throw new Error('queued keyboard order disturbed the active order');
      if(!near(u.queue[0].tx,ax,0.001)||!near(u.queue[0].tz,az+30,0.001)) throw new Error('queued endpoint wrong: '+JSON.stringify(u.queue[0]));
      if(String((document.getElementById('fldLive')||{}).textContent||'').indexOf('Waypoint queued')<0) throw new Error('waypoint was not announced');
      return { queued:u.queue.length, activeUntouched:true, queuedDz:30 }; });

    step('S40 FOCUS GUARDS — editable controls, visible modals, and inactive tactical state suppress the keyboard cursor', function(){
      var u=playerUnit(), root=document.getElementById('fldRoot'); __FIELD.sel=[u.id];
      fireKey(root,'m'); var c=__FIELD.orderCursor, x0=c.x, z0=c.z, before=JSON.stringify(u.order);
      var inp=document.createElement('input'); inp.type='text'; root.appendChild(inp); inp.focus();
      fireKey(inp,'ArrowRight'); fireKey(inp,'Enter');
      if(!__FIELD.orderCursor || c.x!==x0 || c.z!==z0 || JSON.stringify(u.order)!==before) throw new Error('editable focus leaked a battlefield key');
      if(inp.parentNode) inp.parentNode.removeChild(inp);
      var modal=document.createElement('div'); modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.style.cssText='display:block;position:absolute;inset:0;z-index:99';
      var mb=document.createElement('button'); mb.textContent='Modal control'; modal.appendChild(mb); root.appendChild(modal); mb.focus();
      fireKey(mb,'ArrowRight'); fireKey(mb,'Enter'); fireKey(mb,'Escape');
      if(!__FIELD.orderCursor || c.x!==x0 || c.z!==z0 || JSON.stringify(u.order)!==before) throw new Error('visible modal leaked a battlefield key');
      if(!__FIELD.launched || __FIELD.phase!=='battle') throw new Error('modal Escape reached the battle exit path');
      if(modal.parentNode) modal.parentNode.removeChild(modal);
      root.focus(); fireKey(root,'Escape'); fldExit(true);
      if(fldOrderKeyStart()!==false || fldOrderKeyActive()) throw new Error('keyboard order cursor started while tactical play was inactive');
      return { editableSuppressed:true, modalSuppressed:true, inactiveSuppressed:true }; });

    step('S40 POINTER PARITY — real pointer tap/drag, Shift queue, handle facing, and drag-to-foe charge stay unchanged when keyboard mode is unused', function(){
      fldLaunchSandbox({renderer:'2d', seed:141}); __FIELD.phase='battle'; __FIELD.paused=true;
      var u=playerUnit(); __FIELD.sel=[u.id]; u.state='steady'; u.facing=0.6; u.order={type:'hold',tx:u.x,tz:u.z,tface:0.6}; u.queue=null;
      var tapX=u.x+130, tapZ=u.z;
      firePointer('pointerdown',tapX,tapZ,false); firePointer('pointerup',tapX,tapZ,false);
      if(u.order.type!=='move'||!near(u.order.tx,tapX,0.5)||!near(u.order.tface,0.6,0.001)) throw new Error('pointer tap parity failed: '+JSON.stringify(u.order));
      // Reset to a standing line before the separate drag fixture; otherwise this next press can honestly
      // land inside the facing-handle hit circle created by the tap above and exercise re-aim instead of move.
      u.order={type:'hold',tx:u.x,tz:u.z,tface:0.6}; u.queue=null;
      var tx=u.x+140, tz=u.z-70;
      firePointer('pointerdown',tx,tz,false); firePointer('pointermove',tx+90,tz,false); firePointer('pointerup',tx+90,tz,false);
      if(u.order.type!=='move'||!near(u.order.tx,tx,0.5)||!near(u.order.tz,tz,0.5)||!near(u.order.tface,Math.PI/2,0.01)) throw new Error('pointer drag/facing parity failed: '+JSON.stringify(u.order));
      var activeTx=u.order.tx, activeTz=u.order.tz, qx=u.x+170, qz=u.z-150;
      firePointer('pointerdown',qx,qz,true); firePointer('pointerup',qx,qz,true);
      if(!u.queue||u.queue.length!==1||!near(u.order.tx,activeTx,0.5)||!near(u.order.tz,activeTz,0.5)) throw new Error('pointer Shift-queue parity failed');
      var hx=u.order.tx+Math.sin(u.order.tface)*FLD_HANDLE_LEN, hz=u.order.tz-Math.cos(u.order.tface)*FLD_HANDLE_LEN;
      firePointer('pointerdown',hx,hz,false); firePointer('pointermove',u.order.tx,u.order.tz-100,false); firePointer('pointerup',u.order.tx,u.order.tz-100,false);
      if(!near(u.order.tx,activeTx,0.5)||!near(u.order.tz,activeTz,0.5)||!near(u.order.tface,0,0.01)) throw new Error('pointer handle parity failed: '+JSON.stringify(u.order));
      fldExit(true);
      fldLaunchSandbox({renderer:'2d', seed:142}); __FIELD.phase='battle'; __FIELD.paused=true;
      u=playerUnit(); __FIELD.sel=[u.id]; var es=enemies(); es.sort(function(a,b){return Math.hypot(a.x-u.x,a.z-u.z)-Math.hypot(b.x-u.x,b.z-u.z);}); var far=es[es.length-1];
      firePointer('pointerdown',far.x,far.z,false); firePointer('pointerup',far.x,far.z,false);
      if(u.order.type!=='charge'||u.order.tid!==far.id) throw new Error('pointer drag-to-foe parity failed: '+JSON.stringify(u.order));
      if(fldOrderKeyActive()) throw new Error('pointer-only flow created keyboard cursor state');
      fldExit(true);
      return { tap:true, dragFace:true, shiftQueue:true, handle:true, chosenFoe:far.id }; });

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
    // The embedded-photo tier can keep the window "load" event open while
    // local assets stream; the probe only needs inline scripts ready.
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    // a 2D ghost screenshot for the eye
    try {
      const cap = await page.evaluate(`(function(){
        fldLaunchSandbox({renderer:'2d', seed:42});
        var u=null; for(var i=0;i<__FIELD.units.length;i++){ if(__FIELD.units[i].side==='US'&&!__FIELD.units[i].ai){u=__FIELD.units[i];break;} }
        __FIELD.sel=[u.id]; __FIELD.phase='battle'; __FIELD.paused=true;
        var root=document.getElementById('fldRoot'); root.focus();
        root.dispatchEvent(new KeyboardEvent('keydown',{key:'m',bubbles:true,cancelable:true}));
        root.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
        root.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
        root.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true}));
        root.dispatchEvent(new KeyboardEvent('keydown',{key:']',bubbles:true,cancelable:true}));
        root.dispatchEvent(new KeyboardEvent('keydown',{key:']',bubbles:true,cancelable:true}));
        fld2dDraw(); fldRenderTop(); fldRenderHud();
        var cv = document.getElementById('fldGl');
        if (!cv || typeof cv.toDataURL !== 'function') return { ok:false, err:'no tactical canvas export' };
        var dataUrl = cv.toDataURL('image/png');
        if (!dataUrl || dataUrl.indexOf('data:image/png;base64,') !== 0 || dataUrl.length < 1024) return { ok:false, err:'canvas PNG export too small' };
        return { ok:true, dataUrl:dataUrl };
      })()`);
      if (!cap || !cap.ok) throw new Error(cap && cap.err ? cap.err : 'capture failed');
      writeFileSync(join(OUT,'probe-order-feel.png'), Buffer.from(String(cap.dataUrl || '').split(',')[1] || '', 'base64'));
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
  if (!result.ok || result.fatal || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
