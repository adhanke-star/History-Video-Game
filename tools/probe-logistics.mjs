#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-logistics.mjs — TACTICAL ENGINE B-3 (in-battle logistics: ammo trains + resupply + exhaustion).
// Verifies EMPIRICALLY on the renderer-agnostic sim: a scenario builds a rear ammunition train per side (data
// positions; the sandbox procedural), _logisticsOff builds none; a low-ammo brigade out of close action refills
// from the train and drains its finite reserve; it does NOT refill while in close action or with the reserve dry;
// a low-ammo AI brigade not under assault falls back to the train (and stands to the bayonet when assaulted);
// exhaustion adds a deeper move penalty; the battle reserve scales with the strategic supply (and a raid cuts the
// enemy's); the layer is COUNT-NEUTRAL on the isolated Bull Run winner tally (logistics ON == OFF, the E62/D281
// invariant tooth, ON vector pinned) and deterministic; the sandbox is a no-op when off;
// no Classic contamination. Writes shots/probe-logistics.{json,png}.
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
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mk(id, side, x, z, men, st){ var u=fldMakeUnit({id:id, side:side, name:id, arm:'inf', weapon:'rifled', men:men, xp:2, x:x, z:z, facing:(side==='US'?0:Math.PI), ai:true});
    u.state = st || 'steady'; u.morale = 78; return u; }
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldBuildSupply!=='function' || typeof fldLogisticsStep!=='function' || typeof fldSupplyFor!=='function')
      return JSON.stringify({ok:false, fatal:'logistics layer fns missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; G.settings.tacticalFog=false;
    __FIELD._officersOff = true;    // ISOLATE: this probe exercises ONLY the B-3 logistics layer (officers off)
    __FIELD._logisticsOff = false;
    __FIELD._armsOff = true;        // ...and the B-4 arm-roles layer off (probe-arms covers it) -> logistics stays isolated

    step('BUILD: a scenario builds a rear train per side (data positions; CS = Manassas Junction); the sandbox builds 2 procedural; _logisticsOff builds none', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      var t=__FIELD.trains; if(!t||!t.US||!t.CS) throw new Error('Bull Run should build 2 trains');
      if(!(t.CS.z < t.US.z && t.CS.z < 320 && t.US.z > 600)) throw new Error('trains not in the rear behind the objective (US south high-z, CS north low-z): US '+t.US.z+' CS '+t.CS.z);
      if(t.CS.name.indexOf('Manassas')<0) throw new Error('CS train should be the Manassas data train, got '+t.CS.name);
      if(!(t.US.reserve>0 && t.CS.reserve>0)) throw new Error('trains should carry a reserve');
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      if(!(__FIELD.trains && __FIELD.trains.US && __FIELD.trains.CS)) throw new Error('sandbox should build 2 procedural trains');
      __FIELD._logisticsOff=true; fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      if(__FIELD.trains!==null) throw new Error('_logisticsOff should build NO trains, got '+JSON.stringify(__FIELD.trains));
      if(__FIELD.logistics!==false) throw new Error('_logisticsOff did not force logistics off');
      __FIELD._logisticsOff=false;
      return { bullRunTrains:2, csName:t.CS.name, sandbox:2, off:0 }; });

    step('RESUPPLY: a low-ammo brigade out of close action refills from its train and drains the reserve', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      __FIELD._atkCautious=false;   // E62/D281: these fixtures use US units at bullrun1, whose cautious ATTACKER is now resupply-choked — lift the posture to exercise the GENERIC mechanics (the choke has its own step below)
      __FIELD.logistics=true; var tr=fldSupplyFor('US');
      var u=mk('U','US', tr.x, tr.z-40, 1500, 'steady'); u.ammo=20;   // near the train, low, no enemy
      __FIELD.units=[u]; var a0=u.ammo, r0=tr.reserve;
      fldLogisticsStep(0.5);
      if(!(u.ammo>a0)) throw new Error('did not resupply near the train: '+u.ammo);
      if(!(tr.reserve<r0)) throw new Error('reserve did not drain: '+tr.reserve+' vs '+r0);
      if(!u.resupplying) throw new Error('resupplying flag not set');
      return { ammo:Math.round(u.ammo*10)/10, reserveDrained:Math.round((r0-tr.reserve)*10)/10 }; });

    step('NO RESUPPLY IN CLOSE ACTION (boundary-pinned at RESUPPLY_COMBAT_R=240): blocked just inside, refills just outside', function(){
      function tryAt(dz){ fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
        __FIELD._atkCautious=false;   // E62/D281: lift the bullrun1 cautious attacker choke — this step pins the generic 240yd boundary
        __FIELD.logistics=true; var tr=fldSupplyFor('US');
        var u=mk('U','US', tr.x, tr.z-40, 1500, 'steady'); u.ammo=20;            // near the train (within reach), low on ammo
        var en=mk('E','CS', tr.x, tr.z-40-dz, 1500, 'steady');                   // a steady enemy dz yds away (fog OFF -> no choke)
        __FIELD.units=[u,en]; var a0=u.ammo; fldLogisticsStep(0.5); return u.ammo - a0; }
      var inside=tryAt(230), outside=tryAt(250);                                 // RESUPPLY_COMBAT_R is 240 (T4-logistics.js)
      if(inside>0.001) throw new Error('refilled with a steady enemy at 230yd (inside the 240 close-action radius): +'+inside);
      if(!(outside>0)) throw new Error('did NOT refill with the enemy at 250yd (outside 240): +'+outside);
      return { blockedAt230:Math.round(inside*100)/100, refilledAt250:Math.round(outside*10)/10 }; });

    step('RESERVE FINITE: once the train reserve is dry, no more resupply (the army runs low — Little Round Top)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      __FIELD._atkCautious=false;   // E62/D281: lift the bullrun1 cautious attacker choke — this step pins the finite-reserve mechanic
      __FIELD.logistics=true; var tr=fldSupplyFor('US'); tr.reserve=2;
      var u=mk('U','US', tr.x, tr.z-30, 1500, 'steady'); u.ammo=0; __FIELD.units=[u];
      fldLogisticsStep(0.5);                       // drains the last of the reserve
      var aMid=u.ammo, rMid=tr.reserve;
      fldLogisticsStep(0.5);                       // reserve empty -> no further gain
      if(!(tr.reserve<=0.01)) throw new Error('reserve not exhausted: '+tr.reserve);
      if(!(u.ammo<=aMid+0.01)) throw new Error('resupplied with an empty reserve: '+u.ammo+' vs '+aMid);
      return { reserveEnd:Math.round(tr.reserve*100)/100, ammoEnd:Math.round(u.ammo*10)/10 }; });

    step('RESUPPLY DOCTRINE (AI): only a genuinely OUT brigade, safe + off the objective, falls back; it holds when assaulted, on the objective, at the train, or merely low', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      __FIELD._atkCautious=false;   // E62/D281: lift the bullrun1 cautious attacker choke — this step pins the generic fall-back doctrine
      __FIELD.logistics=true; var tr=fldSupplyFor('US'), obj=__FIELD.objective;
      // (a) far + OUT + safe + off the objective -> pull back to the train
      var u=mk('U','US', tr.x, obj.z+obj.r+30, 1500, 'steady'); u.ai=true; u.ammo=4;
      __FIELD.units=[u]; fldLogisticsStep(0.05);
      if(!fldLogisticsAiUnit(u)) throw new Error('an out-of-ammo safe brigade did not fall back to resupply');
      if(u.order.type!=='move' || Math.abs(u.order.tx-tr.x)>1 || Math.abs(u.order.tz-tr.z)>1) throw new Error('not heading to the train');
      // (b) under assault -> do NOT turn the back (normal AI holds / bayonets)
      var u2=mk('U2','US', tr.x, obj.z+obj.r+30, 1500, 'steady'); u2.ai=true; u2.ammo=4;
      var en=mk('E2','CS', tr.x, obj.z+obj.r+30-150, 1500, 'steady');   // within SAFE_PULLBACK_R (200)
      __FIELD.units=[u2,en]; fldLogisticsStep(0.05);
      if(fldLogisticsAiUnit(u2)) throw new Error('pulled back to resupply while under assault');
      // (c) HOLDING THE OBJECTIVE -> never abandon it to refill (fire dry, then the bayonet)
      var u3=mk('U3','US', obj.x, obj.z, 1500, 'steady'); u3.ai=true; u3.ammo=4;
      __FIELD.units=[u3]; fldLogisticsStep(0.05);
      if(fldLogisticsAiUnit(u3)) throw new Error('a brigade holding the objective abandoned it to resupply');
      // (d) already at the train -> let it refill in place (no override)
      var u4=mk('U4','US', tr.x, tr.z-30, 1500, 'steady'); u4.ai=true; u4.ammo=4;
      __FIELD.units=[u4]; fldLogisticsStep(0.05);
      if(fldLogisticsAiUnit(u4)) throw new Error('marched back while already at the train');
      // (e) merely LOW (not out) -> fights on, tops up in lulls (no pullback -> no cycling tempo weapon)
      var u5=mk('U5','US', tr.x, obj.z+obj.r+30, 1500, 'steady'); u5.ai=true; u5.ammo=20;
      __FIELD.units=[u5]; fldLogisticsStep(0.05);
      if(fldLogisticsAiUnit(u5)) throw new Error('a merely-low brigade left the line (cycling weapon not prevented)');
      return { pullbackWhenOut:true, holdWhenAssaulted:true, holdObjective:true, stayAtTrain:true, fightWhenLow:true }; });

    step('CAUTIOUS STAND-OFF CHOKE (E62/D281, the ATK_FOG_RESUPPLY fog-OFF analog): a cautious ATTACKER neither refills nor dry-errands to its train; the control legs prove the POSTURE is the gate; the DEFENDER is never choked', function(){
      // (i) the cautious US attacker at bullrun1 (posture from data, fog OFF): low-ammo brigade AT its own train
      //     gets NOTHING and the reserve does not drain — it fights with what it carries.
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      __FIELD.fog=false;                      // isolate the FOG-OFF branch (bullrun1 defaults fog ON since D67)
      __FIELD.logistics=true; var tr=fldSupplyFor('US');
      if(!__FIELD._atkCautious) throw new Error('bullrun1 did not stamp _atkCautious from data.assaultDoctrine');
      var u=mk('U','US', tr.x, tr.z-40, 1500, 'steady'); u.ammo=20;
      __FIELD.units=[u]; var r0=tr.reserve;
      fldLogisticsStep(0.5);
      if(u.ammo>20.001) throw new Error('a cautious fog-OFF attacker refilled at its train (the E62 inversion mechanism): '+u.ammo);
      if(tr.reserve<r0-0.001) throw new Error('the choked attacker train still drained: '+tr.reserve+' vs '+r0);
      if(u.resupplying) throw new Error('resupplying flag set on a choked brigade');
      // (ii) the AI stands rather than marching a dry errand: crit ammo, safe, off objective, far from train -> NO fall-back order
      var u2=mk('U2','US', tr.x+420, tr.z-420, 1500, 'steady'); u2.ai=true; u2.ammo=4;
      __FIELD.units=[u2]; fldLogisticsStep(0.05);
      if(fldLogisticsAiUnit(u2)) throw new Error('a choked cautious attacker abandoned the line for a train that gives nothing');
      // (ii-b) HUMAN CONTROL: a PLAYER-led (ai:false) brigade of the same cautious attacker refills normally —
      // the posture is an AI-COMMAND input and must bind ONLY the brigades the doctrine commands (no hidden
      // nerf on the human; the fredericksburg alt-history promise stays true). Catches any future
      // over-broadening of the _atkCautious gate to the whole side.
      var uP=mk('UP','US', tr.x, tr.z-40, 1500, 'steady'); uP.ai=false; uP.ammo=20;
      __FIELD.units=[uP]; fldLogisticsStep(0.5);
      if(!(uP.ammo>20)) throw new Error('a HUMAN-controlled attacker brigade got choked under the cautious posture (must bind AI-led brigades only): '+uP.ammo);
      // (iii) CONTROL: the same brigade with the posture lifted refills and falls back — the gate IS the posture
      __FIELD._atkCautious=false;
      var u3=mk('U3','US', tr.x, tr.z-40, 1500, 'steady'); u3.ammo=20;
      __FIELD.units=[u3]; fldLogisticsStep(0.5);
      if(!(u3.ammo>20)) throw new Error('posture lifted but still no refill — the choke is keyed on more than _atkCautious');
      var u4=mk('U4','US', tr.x+420, tr.z-420, 1500, 'steady'); u4.ai=true; u4.ammo=4;
      __FIELD.units=[u4]; fldLogisticsStep(0.05);
      if(!fldLogisticsAiUnit(u4)) throw new Error('posture lifted but the AI fall-back did not resume');
      __FIELD._atkCautious=true;
      // (iv) the CS DEFENDER refills normally under the same cautious launch (the defender is never choked)
      var cs=fldSupplyFor('CS');
      var d=mk('D','CS', cs.x, cs.z+40, 1500, 'steady'); d.ammo=20;
      __FIELD.units=[d]; var c0=cs.reserve; fldLogisticsStep(0.5);
      if(!(d.ammo>20)) throw new Error('the DEFENDER got choked (must never be): '+d.ammo);
      if(!(cs.reserve<c0)) throw new Error('defender train did not drain on refill');
      return { attackerChoked:true, aiStandsFast:true, humanUnchoked:true, postureControlWorks:true, defenderUnchoked:true }; });

    step('EXHAUSTION: a SPENT brigade (fatigue past the threshold) moves measurably slower (beyond the base fatigue slow)', function(){
      function stepMove(exh){ fldLaunchSandbox({renderer:'none', autoBoth:true, seed:7}); __FIELD.logistics=true;
        var u=mk('M','US',600,800,1500,'steady'); u.fatigue=50; u.formation='line'; u.order={type:'move',tx:600,tz:400,tface:0}; u.exhausted=exh;
        __FIELD.units=[u]; var z0=u.z; fldStepMovement(u,0.05); return Math.abs(u.z-z0); }
      var dN=stepMove(false), dE=stepMove(true);
      if(!(dE < dN*0.7)) throw new Error('exhaustion penalty not applied: spent '+dE.toFixed(3)+' vs fresh '+dN.toFixed(3));
      // and fldLogisticsStep SETS exhausted from fatigue
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:7}); __FIELD.logistics=true;
      var s=mk('S','US',600,800,1500,'steady'); s.fatigue=95; __FIELD.units=[s]; fldLogisticsStep(0.05);
      if(!s.exhausted) throw new Error('fldLogisticsStep did not flag a high-fatigue brigade as spent');
      return { spentStep:Math.round(dE*1000)/1000, freshStep:Math.round(dN*1000)/1000 }; });

    step('STRATEGIC TIE: the battle reserve follows the documented supply CURVE (not just ordering); raid cuts the enemy; no-campaign = nominal', function(){
      var saved=G.campaign;
      function C(sup, raid){ return { side:'US', clock:{}, manpower:{}, production:{}, blockade:{}, warroom:{supply:sup}, strategy:{}, president:{}, battlePrep:(raid?{raidSupply:true}:{}) }; }
      __FIELD.campaignCtx={ bd:{} };
      G.campaign=C(90,false); var rHi=fldSupplyReserve('US');
      // pin the CURVE: reserve == round(RESERVE_MAX*(0.55 + clamp(sup,0,100)/100*0.9)) for sup = bridgeArmy(C).supply
      // (the engineered value the fn actually reads — NOT the raw warroom 90; the bridge folds in a momentum term).
      var supEff = (typeof bridgeArmy==='function' && bridgeArmy(G.campaign)) ? bridgeArmy(G.campaign).supply : 90;
      var expect = Math.round(FLDL.RESERVE_MAX*(0.55 + Math.max(0,Math.min(100,supEff))/100*0.9));
      if(Math.abs(rHi-expect) > 2) throw new Error('player reserve off the documented curve: got '+rHi+' expect '+expect+' (bridgeArmy supply '+Math.round(supEff)+')');
      G.campaign=C(10,false); var rLo=fldSupplyReserve('US');
      G.campaign=C(50,false); var rEnemyNorm=fldSupplyReserve('CS');
      G.campaign=C(50,true);  var rEnemyRaid=fldSupplyReserve('CS');
      G.campaign=saved; __FIELD.campaignCtx=null;
      var rNominal=fldSupplyReserve('US');   // no campaign -> nominal full reserve
      if(!(rHi>rLo)) throw new Error('reserve did not scale with supply: hi '+rHi+' lo '+rLo);
      if(!(rEnemyRaid<rEnemyNorm)) throw new Error('raid-supply did not cut the enemy reserve: raid '+rEnemyRaid+' norm '+rEnemyNorm);
      if(rNominal!==FLDL.RESERVE_MAX) throw new Error('no-campaign reserve != RESERVE_MAX nominal: '+rNominal);
      return { reserveHiSupply:rHi, expectHi:expect, reserveLoSupply:rLo, enemyNormal:rEnemyNorm, enemyRaided:rEnemyRaid, nominal:rNominal }; });

    step('BALANCE v2 (E62/D281 — LAYER NEUTRALITY, officers/arms/badges OFF, fog OFF): logistics ON == OFF on the Bull Run winner tally; the ON vector is pinned; the cautious attacker cannot resupply a stand-off fire-trade', function(){
      // R-6 (D104): badges OFF here too — the default-ON badges layer shifts bullrun1, so isolate the LOGISTICS
      // layer (the probe top already pins officers/arms OFF + fog OFF; _logisticsOff toggles per leg below).
      // E62 DELIBERATE RE-ANCHOR (D281) — never a silent re-pin. Provenance: the old [4,6] band pinned the
      // D104-era CS ~5/8 measured on the AGGRESSIVE attacker; E49b shedding (D268-adjudicated) moved that
      // baseline honestly, and the Aaron-locked D272/D273 cautious posture then EXPOSED a real T4 defect this
      // tooth caught at the D279 checkpoint (CS 3/8): the cautious attacker freely resupplied a fog-OFF
      // stand-off fire-trade (US train ~300 -> ~0-54, LATE hold conversions) — logistics OFF read CS 8/8 vs ON
      // CS 3/8, a -5 layer-neutrality violation, the D66 class fog-free. The T4 ATK_STANDOFF_RESUPPLY choke
      // (the ATK_FOG_RESUPPLY analog) closes it. This tooth now asserts the INVARIANT ITSELF (the D279 panel
      // sharpenings, wf_c59e30a7-f43): BOTH legs run live and the winner tallies must match (|delta| <= 1
      // tolerates one knife-edge seed); the ON rows are ALSO pinned exactly ({w,us,cs,steps} from
      // .tmp/ab-e62-fix-results.json fix_cauON_logON, deterministic x2, 0 pe); CS wins must be genuine
      // full-clock timeouts with the defender field-competitive (>=7000 men) at the buzzer. A future red here
      // gets a fresh attribution A/B FIRST (.tmp/ab-e62-fix.mjs is the recipe), then a deliberate owner
      // adjudication — a D74-approved engine change that legitimately moves these rows re-anchors WITH
      // provenance, never silently.
      function runBR(seed, logOff){ __FIELD._officersOff=true; __FIELD._logisticsOff=logOff; __FIELD._badgesOff=true; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return { w:__FIELD.winner, by:(__FIELD.winBy||null), us:strength('US'), cs:strength('CS'), steps:n }; }
      var a=runBR(21,false), b=runBR(21,false);
      if(a.w!==b.w||a.us!==b.us||a.cs!==b.cs||a.steps!==b.steps) throw new Error('logistics-ON non-deterministic');
      // NOTE: these exact pins carry the ABSOLUTE anchor — the |delta|<=1 check below is RELATIVE, so a
      // symmetric CS/US drift that moves both legs together keeps delta==0 and only the pins would catch it.
      // Never loosen the pins to a band without adding an absolute floor in the same edit.
      var seeds=[1,7,21,42,55,101,303,909];
      var PIN = {
        1:  {w:'CS', us:16370, cs:10668, steps:9600},
        7:  {w:'CS', us:15962, cs:10782, steps:9600},
        21: {w:'CS', us:16110, cs:10984, steps:9600},
        42: {w:'CS', us:16528, cs:10947, steps:9600},
        55: {w:'CS', us:16403, cs:11438, steps:9600},
        101:{w:'CS', us:16237, cs:10306, steps:9600},
        303:{w:'CS', us:16166, cs:10912, steps:9600},
        909:{w:'CS', us:16301, cs:10853, steps:9600}
      };
      var csOn=0, csOff=0;
      for(var i=0;i<seeds.length;i++){
        var s=seeds[i], on=runBR(s,false), off=runBR(s,true);
        if(on.w==='CS') csOn++; if(off.w==='CS') csOff++;
        var p=PIN[s];
        if(on.w!==p.w||on.us!==p.us||on.cs!==p.cs||on.steps!==p.steps) throw new Error('logistics-ON row off the D281 pin at seed '+s+': got '+on.w+'|'+on.us+'|'+on.cs+'|'+on.steps+' want '+p.w+'|'+p.us+'|'+p.cs+'|'+p.steps+' — attribution A/B first (.tmp/ab-e62-fix.mjs recipe), then deliberate re-anchor');
        if(on.w==='CS'){
          if(on.by!=='timeout') throw new Error('logistics-ON CS win at seed '+s+' not a genuine full-clock hold (winBy '+on.by+')');
          if(!(on.cs>=7000)) throw new Error('logistics-ON CS timeout win at seed '+s+' below the 7000 defender-competitiveness floor: '+on.cs);
        }
        if(off.w==='CS' && off.by!=='timeout') throw new Error('logistics-OFF CS win at seed '+s+' not by timeout: '+off.by);
      }
      __FIELD._badgesOff=false; __FIELD._logisticsOff=false;
      if(Math.abs(csOn-csOff)>1) throw new Error('LAYER-NEUTRALITY VIOLATION (the E62 class): logistics ON CS '+csOn+'/8 vs OFF CS '+csOff+'/8 — the ammo economy is deciding battles the no-logistics engine decides the other way');
      return { deterministic:true, csOn:csOn+'/8', csOff:csOff+'/8', delta:Math.abs(csOn-csOff) }; });

    step('FOG REGRESSION GUARD: with FOG ON, logistics keeps the defender favoured (D58/D64) — the attacker-fog-choke prevents the ammo economy inverting "fog aids the defender"', function(){
      // R-6 (D104): badges OFF to isolate the logistics/fog interaction from the default-ON CS badges (which also aid the defender).
      function runBR(seed){ __FIELD._officersOff=true; __FIELD._logisticsOff=false; __FIELD._badgesOff=true; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed, fog:true}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return __FIELD.winner; }
      var seeds=[1,7,21,42,55,101,303,909], cs=0; for(var i=0;i<seeds.length;i++){ if(runBR(seeds[i])==='CS') cs++; }
      __FIELD._badgesOff=false;
      // fog-ON logistics-OFF is CS 8/8 (fog aids the defender). The fog-inversion bug (D66) made logistics-ON CS 0/8 —
      // the attacker freely resupplied its long fog fire-trade. FLDL.ATK_FOG_RESUPPLY (~0) restores it: the attacker
      // can't run its trains forward blind, so the fight stays cover-decided. CS must stay >=6 (currently 8/8).
      if(!(cs>=6)) throw new Error('FOG INVERSION REGRESSION: fog-ON logistics dropped the defender to '+cs+'/'+seeds.length+' (must stay >=6 — fog must keep aiding the defender)');
      return { fogOn_csWins:cs+'/'+seeds.length }; });

    step('PROCEDURAL ASYMMETRY (the culminating-point mechanic): an ATTACKER train sits FAR behind its start; a DEFENDER just behind the objective', function(){
      // exercise the procedural fldSupplyRearPos branch that bullrun bypasses via hand-authored data.supply (it IS
      // live in campaign skirmishes, which set an attacker and carry no data.supply).
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:5});   // sandbox: symmetric, attacker null, units on both edges
      var obj=__FIELD.objective;
      __FIELD.attacker='US';                                        // declare US the attacker for the position computation
      var atk=fldSupplyRearPos('US'), def=fldSupplyRearPos('CS');
      __FIELD.attacker=null;
      var atkBack=Math.abs(atk.z-obj.z), defBack=Math.abs(def.z-obj.z);
      if(!(atkBack > defBack + 150)) throw new Error('attacker train not markedly farther back than defender: atk '+Math.round(atkBack)+' def '+Math.round(defBack));
      if(!(defBack <= obj.r + 200)) throw new Error('defender train not just behind the objective: back '+Math.round(defBack)+' r '+obj.r);
      return { attackerBack:Math.round(atkBack), defenderBack:Math.round(defBack), objR:Math.round(obj.r) }; });

    step('FOG REVEAL: under fog the player always sees its OWN train; an ENEMY train only when a scouted enemy unit is near it', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1, fog:true});
      __FIELD.logistics=true; var us=fldSupplyFor('US'), cs=fldSupplyFor('CS');
      if(!fldSupplySeen(us, 'US')) throw new Error('player did not see its OWN train under fog');
      __FIELD.units=[]; __FIELD.vis=null; if(typeof fldComputeVisibility==='function') fldComputeVisibility();
      var hiddenWhenEmpty = !fldSupplySeen(cs, 'US');               // no enemy near the enemy train -> hidden
      var rebel=mk('R','CS', cs.x, cs.z+60, 1500, 'steady');        // a CS unit hugs its own train (within 200)
      var scout=mk('S','US', cs.x, cs.z+60, 1500, 'steady');        // a US unit on top of it -> US sees the rebel
      __FIELD.units=[rebel, scout]; __FIELD.vis=null; if(typeof fldComputeVisibility==='function') fldComputeVisibility();
      var revealed = fldSupplySeen(cs, 'US');
      if(!hiddenWhenEmpty) throw new Error('enemy train visible under fog with no enemy near it (info leak)');
      if(!revealed) throw new Error('enemy train not revealed when a scouted enemy unit hugged it');
      return { ownAlwaysSeen:true, hiddenWhenEmpty:hiddenWhenEmpty, revealedWhenScouted:revealed }; });

    step('REINFORCEMENT-ONLY SIDE gets a train: a side with no T=0 units but scheduled reinforcements is still supplied', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1}); __FIELD.logistics=true;
      __FIELD.units=__FIELD.units.filter(function(u){ return u.side==='US'; });   // strip CS from the field
      __FIELD.reinforce=[{ atSec:30, done:false, spec:{ id:'late', side:'CS', name:'Late Bde', arm:'inf', weapon:'rifled', men:1500, xp:1, x:600, z:205, facing:0 } }];
      fldBuildSupply();
      if(!(__FIELD.trains && __FIELD.trains.CS)) throw new Error('a reinforcement-only side got NO train');
      if(!__FIELD.trains.US) throw new Error('the present side lost its train');
      return { reinforcementOnlySideTrain:true }; });

    step('SANDBOX NO-OP when off + resolves; both layers ON also resolves', function(){
      __FIELD._logisticsOff=true; fldLaunchSandbox({renderer:'none', autoBoth:true, seed:99});
      if(__FIELD.trains!==null) throw new Error('logistics off should build no trains');
      __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<12000){ fldSimStep(0.05); n++; }
      if(__FIELD.phase!=='over') throw new Error('off sandbox did not finish');
      // both layers ON (officers + logistics) -> still resolves
      __FIELD._logisticsOff=false; __FIELD._officersOff=false;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:42}); __FIELD.phase='battle'; __FIELD.paused=false; var m=0; while(__FIELD.phase==='battle'&&m<20000){ fldSimStep(0.05); m++; }
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('both-layers battle bad winner: '+__FIELD.winner);
      __FIELD._officersOff=true;
      return { offWinner:'resolved', bothOnWinner:__FIELD.winner }; });

    step('NO CLASSIC CONTAMINATION: a logistics battle never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode;
      __FIELD._logisticsOff=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:3}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; }
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('mutated G.mode: '+G.mode);
      try{ fldExit(true); }catch(e){}
      return { gMode:G.mode }; });
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
    const shot = await page.evaluate(`(function(){
      __FIELD._officersOff=true; __FIELD._logisticsOff=false;
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', autoBoth:true, seed:21});
      __FIELD.fog=false; __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(2600, 0.05);
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      var t=__FIELD.trains;
      return { simT: Math.round(__FIELD.t), winner: __FIELD.winner, usReserve: t&&t.US?Math.round(t.US.reserve):null, csReserve: t&&t.CS?Math.round(t.CS.reserve):null };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-logistics.png') });
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-logistics.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-logistics ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-logistics.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-logistics.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-logistics: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-logistics: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-logistics: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
