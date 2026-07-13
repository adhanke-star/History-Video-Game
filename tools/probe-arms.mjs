#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-arms.mjs — TACTICAL ENGINE B-4 (distinct arm roles: artillery canister/bombardment + battery
// doctrine; cavalry scout/flank/screen/raid; the ARM melee table; the Cannon-Corps->field-battery bridge).
// Verifies EMPIRICALLY on the renderer-agnostic sim: bullrun1 fields art (Griffin/Ricketts) + cav (Stuart) and
// _armsOff makes the layer inert; the ARM melee table (art 0.35 overrun, cav 1.4 shock / 0.9 braced, inf 1.0
// byte-identical); canister is murderous in the open + defeated by cover + falls to a long-range bombardment
// beyond CANISTER_R; the battery doctrine stands then DISPLACES when rushed unscreened; cavalry flank charges a
// disordered line, scout avoids+ranges, raid drains the enemy ammunition train (the B-3 tie), screen interposes;
// the bought Cannon Corps conditions the field battery (Napoleon->canister, Whitworth->long-range no spike);
// arms-ON Bull Run is deterministic + CS-favoured-but-competitive (fog-OFF) and fog still aids the defender
// (fog-ON); the sandbox is a no-op when off; no Classic contamination. Writes shots/probe-arms.{json,png}.
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
async function withTimeout(label, promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms); })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function closePage(page) {
  try { await withTimeout('page.close', page.close({ runBeforeUnload:false }), 2500); } catch (e) {}
}
async function closeBrowser(browser) {
  try { await withTimeout('browser.close', browser.close(), 5000); } catch (e) {}
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mk(o){ var u=fldMakeUnit({id:o.id, side:o.side, name:o.id, arm:o.arm||'inf', role:o.role||null, weapon:o.weapon||'rifled', men:o.men||1500, xp:(o.xp==null?2:o.xp), x:o.x, z:o.z, facing:(o.side==='US'?0:Math.PI), ai:true});
    u.state = o.st || 'steady'; u.morale = (o.mor==null?78:o.mor); if(o.ammo!=null) u.ammo=o.ammo; return u; }
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  function countArm(arm, alive){ var n=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.arm===arm && (!alive || u.alive)) n++; } return n; }
  // a minimal THREE stub so the 3D arm-mesh BUILD path (fld3dBuildArms/Dispose) can run headless (renderer:'none')
  function stubScene(){ return { add:function(o){ o.parent=this; }, remove:function(){} }; }
  function stubTHREE(){
    function Node(){ this.children=[]; this.position={x:0,y:0,z:0,set:function(x,y,z){this.x=x;this.y=y;this.z=z;}}; this.rotation={x:0,y:0,z:0}; this.name=''; this.visible=true; this.parent=null; }
    Node.prototype.add=function(o){ o.parent=this; this.children.push(o); };
    Node.prototype.getObjectByName=function(n){ for(var i=0;i<this.children.length;i++){ if(this.children[i].name===n) return this.children[i]; } return null; };
    Node.prototype.traverse=function(f){ f(this); for(var i=0;i<this.children.length;i++) this.children[i].traverse(f); };
    function Mesh(g,m){ Node.call(this); this.geometry=g; this.material=m; } Mesh.prototype=Object.create(Node.prototype);
    function Group(){ Node.call(this); } Group.prototype=Object.create(Node.prototype);
    function geo(){ return { dispose:function(){} }; }
    function mat(o){ return { color:{set:function(){}}, opacity:(o&&o.opacity!=null)?o.opacity:1, dispose:function(){} }; }
    return { Group:Group, Mesh:Mesh,
      CylinderGeometry:function(){return geo();}, BoxGeometry:function(){return geo();}, SphereGeometry:function(){return geo();}, RingGeometry:function(){return geo();},
      MeshLambertMaterial:function(o){return mat(o);}, MeshBasicMaterial:function(o){return mat(o);} };
  }
  // a recording 2D ctx that captures fill/stroke colours so we can assert what the draw helpers emit (reduceMotion)
  function recCtx(){ var ops=[]; var o={ _ops:ops, save:function(){},restore:function(){},translate:function(){},rotate:function(){},beginPath:function(){},moveTo:function(){},lineTo:function(){},closePath:function(){},arc:function(){},fill:function(){},stroke:function(){},fillRect:function(){},setLineDash:function(){} };
    Object.defineProperty(o,'fillStyle',{set:function(v){ops.push(v);},get:function(){return '';}});
    Object.defineProperty(o,'strokeStyle',{set:function(v){ops.push(v);},get:function(){return '';}});
    Object.defineProperty(o,'lineWidth',{set:function(){},get:function(){return 1;}});
    Object.defineProperty(o,'globalAlpha',{set:function(){},get:function(){return 1;}});
    return o; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldArmMelee!=='function' || typeof fldArtFireMult!=='function' || typeof fldArmsAiUnit!=='function' || typeof FLDA==='undefined')
      return JSON.stringify({ok:false, fatal:'arms layer fns missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; G.settings.tacticalFog=false;
    __FIELD._officersOff = true;     // ISOLATE: this probe exercises ONLY the B-4 arm-roles layer
    __FIELD._logisticsOff = true;    // (officers + logistics off; each has its own probe) — toggled ON only for the raid step
    __FIELD._armsOff = false;

    step('BUILD: bullrun1 fields art (Griffin/Ricketts) + cav (Stuart); arms ON by default; _armsOff makes the layer inert', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      if(__FIELD.arms!==true) throw new Error('arms should default ON');
      // detrain the scheduled reinforcements so art+cav are on the field
      __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.t<200 && n<6000){ fldSimStep(0.05); n++; }
      var art=countArm('art',false), cav=countArm('cav',false);
      if(art<2) throw new Error('bullrun1 should field >=2 batteries (Griffin/Ricketts), got '+art);
      if(cav<1) throw new Error('bullrun1 should field >=1 cavalry (Stuart), got '+cav);
      __FIELD._armsOff=true; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      if(__FIELD.arms!==false) throw new Error('_armsOff did not force arms off');
      __FIELD._armsOff=false;
      return { batteries:art, cavalry:cav, offForcesOff:true }; });

    step('ARM MELEE TABLE: art 0.35 (overrun), cav 1.4 vs disordered / 0.9 vs a steady braced line, inf 1.0; arms OFF -> all 1.0 (byte-identical)', function(){
      __FIELD.arms=true;
      var inf={arm:'inf'}, art={arm:'art'}, cav={arm:'cav'};
      var steady={state:'steady'}, wav={state:'wavering'};
      var mInf=fldArmMelee(inf, steady), mArt=fldArmMelee(art, steady), mCavBrace=fldArmMelee(cav, steady), mCavShock=fldArmMelee(cav, wav);
      if(mInf!==1.0) throw new Error('infantry melee must stay 1.0 (byte-identity), got '+mInf);
      if(Math.abs(mArt-FLDA.ART_MELEE)>1e-9) throw new Error('art melee != ART_MELEE: '+mArt);
      if(Math.abs(mCavBrace-FLDA.CAV_BRACE)>1e-9) throw new Error('cav vs steady != CAV_BRACE: '+mCavBrace);
      if(Math.abs(mCavShock-FLDA.CAV_CHARGE)>1e-9) throw new Error('cav vs disordered != CAV_CHARGE: '+mCavShock);
      if(!(mCavShock>mInf && mInf>mCavBrace && mCavBrace>mArt)) throw new Error('melee ordering wrong: shock '+mCavShock+' inf '+mInf+' brace '+mCavBrace+' art '+mArt);
      __FIELD.arms=false;
      if(fldArmMelee(art, steady)!==1.0 || fldArmMelee(cav, wav)!==1.0) throw new Error('arms OFF must yield 1.0 (byte-identity)');
      __FIELD.arms=true;
      return { inf:mInf, art:mArt, cavBrace:mCavBrace, cavShock:mCavShock }; });

    step('END-TO-END MELEE: a battery caught in melee is OVERRUN (loses far more men than the infantry that took it)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1}); __FIELD.arms=true;
      var gun=mk({id:'G',side:'US',arm:'art',x:600,z:480,men:160}); var inf=mk({id:'I',side:'CS',arm:'inf',x:600,z:485,men:1500});
      __FIELD.units=[gun,inf]; __FIELD.seed=999;
      for(var t=0;t<20;t++) fldResolveMelee(gun, inf, 0.05);
      var gunLossFrac=(160-gun.men)/160, infLossFrac=(1500-inf.men)/1500;
      if(!(gunLossFrac > infLossFrac*2)) throw new Error('battery not overrun: gun lost '+(gunLossFrac*100).toFixed(0)+'% vs inf '+(infLossFrac*100).toFixed(0)+'%');
      return { gunLossPct:Math.round(gunLossFrac*100), infLossPct:Math.round(infLossFrac*100) }; });

    step('CANISTER (fldArtFireMult): murderous in the open <=CANISTER_R, sharply defeated by cover, falls to a bombardment beyond', function(){
      __FIELD.arms=true;
      var u={arm:'art'};
      var openClose = fldArtFireMult(u, {}, FLDA.CANISTER_R-10, 1.0);     // open, canister band
      var coverClose = fldArtFireMult(u, {}, FLDA.CANISTER_R-10, 1.7);    // heavy cover, canister band
      var longOpen = fldArtFireMult(u, {}, FLDA.CANISTER_R+300, 1.0);     // beyond canister
      if(Math.abs(openClose-FLDA.CANISTER_MULT)>1e-6) throw new Error('open canister != CANISTER_MULT: '+openClose);
      if(!(openClose > coverClose*2)) throw new Error('cover did not blunt canister: open '+openClose.toFixed(2)+' cover '+coverClose.toFixed(2));
      if(!(openClose > longOpen*2)) throw new Error('canister not >> long range: open '+openClose.toFixed(2)+' long '+longOpen.toFixed(2));
      if(Math.abs(longOpen-FLDA.LONG_MULT)>1e-6) throw new Error('long range != LONG_MULT: '+longOpen);
      // non-art / arms-off -> 1.0 (no perturbation)
      if(fldArtFireMult({arm:'inf'}, {}, 100, 1.0)!==1.0) throw new Error('non-art got a canister mult');
      __FIELD.arms=false; if(fldArtFireMult(u, {}, 100, 1.0)!==1.0) throw new Error('arms off must be 1.0'); __FIELD.arms=true;
      return { openCanister:Math.round(openClose*100)/100, coverCanister:Math.round(coverClose*100)/100, longRange:Math.round(longOpen*100)/100 }; });

    step('END-TO-END FIRE: a battery kills FAR more in the open at canister range than at long range or behind cover (seed-pinned)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1}); __FIELD.arms=true;
      function fireOnce(shooter, tgt, seed){ __FIELD.units=[shooter,tgt]; __FIELD.seed=seed; var m0=tgt.men; fldResolveFire(shooter, tgt, 0.05); return m0 - tgt.men; }
      // open spot far from the centre hill/wall/woods
      var sx=200, sz=750;
      var openCas = fireOnce(mk({id:'A',side:'US',arm:'art',x:sx,z:sz,men:160}), mk({id:'B',side:'CS',arm:'inf',x:sx,z:sz-100,men:1500}), 4242);   // d=100 open
      var longCas = fireOnce(mk({id:'A',side:'US',arm:'art',x:sx,z:sz,men:160}), mk({id:'B',side:'CS',arm:'inf',x:sx,z:sz-420,men:1500}), 4242); // d=420 open
      // cover: target on the stone wall (x 490..720 at z=380) -> high fldCoverAt
      var covPt={x:600,z:380}; var cov=fldCoverAt(covPt.x, covPt.z);
      var coverCas = fireOnce(mk({id:'A',side:'US',arm:'art',x:600,z:480,men:160}), mk({id:'B',side:'CS',arm:'inf',x:covPt.x,z:covPt.z,men:1500}), 4242);  // d=100 in cover
      if(!(cov>1.3)) throw new Error('cover test point not actually in cover: '+cov);
      if(!(openCas > longCas*1.5)) throw new Error('open canister not >> long range: open '+openCas.toFixed(1)+' long '+longCas.toFixed(1));
      if(!(openCas > coverCas*1.5)) throw new Error('open canister not >> behind cover: open '+openCas.toFixed(1)+' cover '+coverCas.toFixed(1));
      return { openCas:Math.round(openCas*10)/10, longCas:Math.round(longCas*10)/10, coverCas:Math.round(coverCas*10)/10, coverMul:Math.round(cov*100)/100 }; });

    step('BATTERY DOCTRINE (asymmetric by role): a DEFENDING battery sits safe + displaces early when rushed unscreened; an ATTACKING battery pushes FORWARD to a canister post; never charges', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1}); __FIELD.arms=true;
      var obj=__FIELD.objective; __FIELD.attacker='US';   // Bull Run attacker is US -> a CS gun is the DEFENDER, a US gun the ATTACKER
      // (a) DEFENDER: an unscreened enemy within BATTERY_DISPLACE_R -> displace to the rear (don't be overrun)
      var hzCS=fldHomeEdgeZ('CS'), dirCS=(hzCS>obj.z)?1:-1;
      var defGun=mk({id:'D',side:'CS',arm:'art',x:obj.x,z:obj.z+dirCS*40,men:120});
      var foeD=mk({id:'FE',side:'US',arm:'inf',x:obj.x,z:defGun.z - dirCS*150,men:1500});   // ~150yd off, unscreened (< 200)
      __FIELD.units=[defGun,foeD]; fldArmsAiUnit(defGun);
      if(defGun.order.type!=='move' || (defGun.order.tz-defGun.z)*dirCS<=0) throw new Error('defending battery did not displace rearward, order='+defGun.order.type+' tz '+Math.round(defGun.order.tz));
      // ...with a friendly SCREEN it stands and fires (hold)
      var scr=mk({id:'SC',side:'CS',arm:'inf',x:obj.x,z:defGun.z - dirCS*70,men:1500});
      __FIELD.units=[defGun,foeD,scr]; defGun.order={type:'hold',tx:defGun.x,tz:defGun.z,tface:defGun.facing}; fldArmsAiUnit(defGun);
      if(defGun.order.type!=='hold') throw new Error('screened defending battery did not stand, order='+defGun.order.type);
      // (b) ATTACKER: a US battery far from the objective pushes FORWARD to its canister post (a move toward the objective)
      var hzUS=fldHomeEdgeZ('US'), dirUS=(hzUS>obj.z)?1:-1;
      var atkGun=mk({id:'A',side:'US',arm:'art',x:obj.x,z:obj.z+dirUS*400,men:160});
      __FIELD.units=[atkGun]; fldArmsAiUnit(atkGun);
      if(atkGun.order.type!=='move' || (atkGun.z-atkGun.order.tz)*dirUS<=0) throw new Error('attacking battery did not push forward toward the objective, order='+atkGun.order.type+' tz '+Math.round(atkGun.order.tz));
      if(defGun.order.type==='charge'||atkGun.order.type==='charge') throw new Error('a battery issued a charge order');
      return { defender:'displace+hold', attacker:'push forward' }; });

    step('CAVALRY FLANK: charges a catchable disordered enemy in reach; rides for the open wing otherwise', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1}); __FIELD.arms=true;
      var cav=mk({id:'C',side:'CS',arm:'cav',role:'flank',x:600,z:500,men:300});
      var wav=mk({id:'W',side:'US',arm:'inf',x:600,z:500+100,men:1200,st:'wavering'});  // within CAV_CHARGE_R, disordered
      __FIELD.units=[cav,wav]; fldArmsAiUnit(cav);
      if(cav.order.type!=='charge') throw new Error('cavalry did not charge a disordered enemy in reach, order='+cav.order.type);
      // a steady enemy far off -> ride for the flank (a move, not a charge)
      var steady=mk({id:'T',side:'US',arm:'inf',x:600,z:850,men:2000,st:'steady'});
      __FIELD.units=[cav,steady]; cav.order={type:'hold',tx:cav.x,tz:cav.z,tface:cav.facing}; fldArmsAiUnit(cav);
      if(cav.order.type==='charge') throw new Error('cavalry charged a steady distant line frontally');
      return { disordered:'charge', steadyFar:cav.order.type }; });

    step('CAVALRY SCOUT: avoids a stronger enemy that closes (does not get caught)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1}); __FIELD.arms=true;
      var sc=mk({id:'C',side:'US',arm:'cav',role:'scout',x:600,z:500,men:300});
      var strong=mk({id:'E',side:'CS',arm:'inf',x:600,z:500-120,men:2000});  // within SCOUT_AVOID, stronger
      __FIELD.units=[sc,strong]; var d0=fldDist(sc, strong); fldArmsAiUnit(sc);
      // the ordered destination should be FARTHER from the strong enemy than the scout's current position
      var dDest=Math.sqrt(Math.pow(sc.order.tx-strong.x,2)+Math.pow(sc.order.tz-strong.z,2));
      if(!(sc.order.type==='move' && dDest>d0)) throw new Error('scout did not peel away from the stronger enemy: d0 '+Math.round(d0)+' dest '+Math.round(dDest));
      return { peeledAway:true, d0:Math.round(d0), dDest:Math.round(dDest) }; });

    step('CAVALRY RAID drains the enemy ammunition train (the B-3 tie): a raider on the depot draws down its reserve', function(){
      __FIELD._logisticsOff=false;   // the raid needs trains (B-3) -> turn logistics ON for this step only
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1}); __FIELD.arms=true; __FIELD.logistics=true;
      if(typeof fldBuildSupply!=='function' || !__FIELD.trains) throw new Error('logistics trains not built for the raid test');
      var et=__FIELD.trains.US;   // a CS raider attacks the Union train
      var raider=mk({id:'R',side:'CS',arm:'cav',role:'raid',x:et.x,z:et.z,men:300});
      __FIELD.units=[raider]; var r0=et.reserve;
      fldArmsStep(0.5);
      if(!(et.reserve < r0)) throw new Error('raider on the depot did not drain the reserve: '+et.reserve+' vs '+r0);
      if(!raider._raiding) throw new Error('raiding flag not set on the depot');
      // a raider far from the train does NOT drain it
      var et2v=et.reserve; raider.x=et.x+600; fldArmsStep(0.5);
      if(et.reserve < et2v-0.001) throw new Error('reserve drained with the raider far away');
      __FIELD._logisticsOff=true;
      return { drained:Math.round((r0-et.reserve)*10)/10, raidingFlag:true }; });

    step('CAVALRY SCREEN: interposes between the enemy and the objective (denies the enemy a clean flanking lane)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1}); __FIELD.arms=true;
      var obj=__FIELD.objective;
      var scr=mk({id:'C',side:'CS',arm:'cav',role:'screen',x:obj.x-300,z:obj.z,men:300});
      var threat=mk({id:'EC',side:'US',arm:'cav',x:obj.x-500,z:obj.z,men:300});
      __FIELD.units=[scr,threat]; fldArmsAiUnit(scr);
      // the ordered destination sits between the threat and the objective (its x between the two on the x axis)
      var tx=scr.order.tx, between = (tx > Math.min(threat.x,obj.x)-1) && (tx < Math.max(threat.x,obj.x)+1);
      if(!(scr.order.type==='move' && between)) throw new Error('screen did not interpose between the threat and the objective: tx '+Math.round(tx)+' threat '+Math.round(threat.x)+' obj '+Math.round(obj.x));
      return { interposed:true, tx:Math.round(tx) }; });

    step('TARGET BIAS: artillery prefers a dense EXPOSED target over a sheltered one; cavalry prefers a disordered one', function(){
      __FIELD.arms=true;
      var art=mk({id:'A',side:'US',arm:'art',x:200,z:750,men:160});
      var exposed=mk({id:'X',side:'CS',arm:'inf',x:200,z:650,men:1800});   // open
      var sheltered=mk({id:'Y',side:'CS',arm:'inf',x:600,z:380,men:1800}); // on the wall (cover)
      var frX={mult:1,frontW:1,isFlank:false}, frY={mult:1,frontW:1,isFlank:false};
      var bX=fldArmTargetBias(art, exposed, 100, frX), bY=fldArmTargetBias(art, sheltered, 100, frY);
      if(!(bX > bY)) throw new Error('artillery did not prefer the exposed target: exposed '+bX.toFixed(2)+' sheltered '+bY.toFixed(2));
      var cav=mk({id:'C',side:'US',arm:'cav',x:200,z:750,men:300});
      var bWav=fldArmTargetBias(cav, mk({id:'W',side:'CS',arm:'inf',x:200,z:700,men:1500,st:'wavering'}), 60, {mult:1,frontW:1,isFlank:false});
      var bSt=fldArmTargetBias(cav, mk({id:'S',side:'CS',arm:'inf',x:200,z:700,men:1500,st:'steady'}), 60, {mult:1,frontW:1,isFlank:false});
      if(!(bWav > bSt)) throw new Error('cavalry did not prefer the disordered target');
      // infantry returns 0 (baseline targeting unchanged)
      if(fldArmTargetBias(mk({id:'I',side:'US',arm:'inf',x:0,z:0}), exposed, 100, frX)!==0) throw new Error('infantry target bias must be 0 (byte-identity)');
      return { artExposed:Math.round(bX*100)/100, artSheltered:Math.round(bY*100)/100, cavWav:Math.round(bWav*100)/100, cavSteady:Math.round(bSt*100)/100 }; });

    step('CANNON-CORPS BRIDGE: a Napoleon park -> canister; a Whitworth park -> long range, NO close spike; no batteries -> nominal (null)', function(){
      if(typeof _fldArtProfile!=='function') throw new Error('_fldArtProfile missing');
      function C(batteries){ return { side:'US', artillery:{ batteries:batteries } }; }
      var nap=_fldArtProfile(C({napoleon:4})), whit=_fldArtProfile(C({whitworth:4})), none=_fldArtProfile(C({}));
      if(none!==null) throw new Error('no batteries should give a null (nominal) profile, got '+JSON.stringify(none));
      if(!nap || !nap.hasCanister) throw new Error('Napoleon park should have canister');
      if(!whit || whit.hasCanister) throw new Error('Whitworth park should have NO canister');
      if(!(whit.rng > nap.rng)) throw new Error('Whitworth should out-range the Napoleon: whit '+Math.round(whit.rng)+' nap '+Math.round(nap.rng));
      if(!(nap.canisterScale > whit.canisterScale*2)) throw new Error('Napoleon canister not >> Whitworth: nap '+nap.canisterScale.toFixed(2)+' whit '+whit.canisterScale.toFixed(2));
      // and it actually conditions a field battery via fldCampaignConditionUnit
      var saved=G.campaign; G.campaign={ side:'US', clock:{year:1862}, manpower:{}, production:{}, blockade:{}, warroom:{}, strategy:{}, president:{}, artillery:{batteries:{napoleon:4}}, armory:{} };
      __FIELD.campaignCtx={ bd:{year:1862}, _params:{ playerSide:'US', strengthMul:1, moraleAdd:0, fatigueAdd:0, entrench:false, armPlan:[], _armIdx:0, artProfile: nap } };
      __FIELD.arms=true;
      var gun=mk({id:'g',side:'US',arm:'art',x:600,z:480,men:160}); var rng0=gun.rng;
      fldCampaignConditionUnit(gun);
      if(gun._canisterScale==null) throw new Error('art unit not conditioned by the bought Cannon Corps');
      G.campaign=saved; __FIELD.campaignCtx=null;
      return { napCanister:Math.round(nap.canisterScale*100)/100, napRng:Math.round(nap.rng), whitCanister:Math.round(whit.canisterScale*100)/100, whitRng:Math.round(whit.rng), conditioned:Math.round(gun._canisterScale*100)/100 }; });

    step('3D ARM MESHES build per art/cav after reinforcements detrain (bug-hunt HIGH: Griffin/Ricketts/Stuart all DETRAIN, so the once-at-init build missed them)', function(){
      var savedTHREE = (typeof window!=='undefined') ? window.THREE : undefined, savedScene=__FIELD.scene;
      try {
        window.THREE = stubTHREE();
        __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=false;
        fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
        __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.t<200 && n<6000){ fldSimStep(0.05); n++; }   // detrain Griffin(60)/Ricketts(80)/Stuart(180)
        __FIELD.scene = stubScene();
        if(typeof fld3dBuildArms!=='function') throw new Error('fld3dBuildArms missing');
        fld3dBuildArms();
        var m=__FIELD._arm3d||{}, missing=[];
        for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if((u.arm==='art'||u.arm==='cav') && u.alive && !m[u.id]) missing.push(u.id+'/'+u.arm); }
        if(missing.length) throw new Error('art/cav units with no 3D arm mesh: '+missing.join(','));
        var built=Object.keys(m).length;
        if(!(built>=2)) throw new Error('expected >=2 arm meshes (batteries + cavalry), got '+built);
        fld3dBuildArms();   // a second build must self-dispose + rebuild without throwing (leak-safe)
        if(typeof fld3dDisposeArms==='function') fld3dDisposeArms();
        return { armMeshes:built, missing:0 };
      } finally { window.THREE = savedTHREE; __FIELD.scene = savedScene; }
    });

    step('BYTE-IDENTITY: an arms-ON pure-INFANTRY sandbox == arms-OFF (winner / strength / step-count — same seeded fldRng stream)', function(){
      function runSandbox(off, seed){ __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=off; fldLaunchSandbox({renderer:'none', autoBoth:true, seed:seed}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<12000){ fldSimStep(0.05); n++; } return { w:__FIELD.winner, us:strength('US'), cs:strength('CS'), steps:n }; }
      var aOff=runSandbox(true, 7), aOn=runSandbox(false, 7);
      if(aOff.w!==aOn.w || aOff.us!==aOn.us || aOff.cs!==aOn.cs || aOff.steps!==aOn.steps) throw new Error('arms-ON pure-inf sandbox != arms-OFF: off '+JSON.stringify(aOff)+' on '+JSON.stringify(aOn));
      __FIELD._armsOff=false;
      return { winner:aOff.w, identical:true, steps:aOff.steps }; });

    step('BYTE-IDENTITY (the art/cav scenario): arms/badges-OFF bullrun1 AI-vs-AI == the committed CS 8/8 full-row baseline (the base.html ARM melee table is honoured, NOT 1.0)', function(){
      // R-6 (D104): badges is a default-ON optional combat layer that legitimately shifts bullrun1 (its assigned
      // CS stonewalls -> CS 8/8). This guard isolates the ARMS layer's byte-identity, so badges is OFF here too.
      function run(seed){ __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=true; __FIELD._badgesOff=true; G.settings.tacticalFog=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed, fog:false}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return { w:__FIELD.winner, us:strength('US'), cs:strength('CS'), steps:n }; }
      // EXACT FULL-ROW pin (winner/us/cs/steps per seed — the D278 probe-presets style). The old 7/8 vector kept
      // seed 55's US hold as a knife-edge discriminator; with the vector now uniform CS-timeout, winner-only would
      // lose byte-identity sensitivity to the tooth's target bug (the ARM melee table silently dropping to 1.0
      // perturbs trajectories -> strengths), so the strengths themselves are pinned.
      var expect={1:{w:'CS',us:16263,cs:10673,steps:9600},7:{w:'CS',us:16231,cs:10689,steps:9600},21:{w:'CS',us:16511,cs:10951,steps:9600},42:{w:'CS',us:16475,cs:11148,steps:9600},55:{w:'CS',us:16375,cs:10682,steps:9600},101:{w:'CS',us:16029,cs:10323,steps:9600},303:{w:'CS',us:16515,cs:11215,steps:9600},909:{w:'CS',us:16256,cs:11092,steps:9600}};
      var seeds=[1,7,21,42,55,101,303,909], cs=0, misses=[];
      for(var i=0;i<seeds.length;i++){ var r=run(seeds[i]), e=expect[seeds[i]];
        if(r.w==='CS') cs++;
        if(r.w!==e.w||r.us!==e.us||r.cs!==e.cs||r.steps!==e.steps) misses.push('s'+seeds[i]+'='+r.w+'|'+r.us+'|'+r.cs+'|'+r.steps+' (expect '+e.w+'|'+e.us+'|'+e.cs+'|'+e.steps+')'); }
      __FIELD._armsOff=false; __FIELD._badgesOff=false;
      // arms OFF must reproduce the committed bare bullrun rows EXACTLY. A miss means the arms-OFF path is not
      // byte-identical — e.g. the base.html ARM melee table (art 0.40 / cav 1.05) was dropped to 1.0 (the bug the
      // asymmetric melee fallback fixes). bullrun1 FIELDS art+cav, so it exercises it.
      // BASELINE PROVENANCE (E56 -> D268 -> the 2026-07-06 batch checkpoint): committed CS 5/8 through D251;
      // E49b first-break straggler-shedding (D261) moved it to CS 7/8 with US on 55 — deliberately re-anchored in
      // D268 (.tmp/ab-e56.mjs attribution). The Aaron-locked D272/D273 accurate-input cautious posture (bullrun1
      // assaultDoctrine:"cautious" + cautious-v2) then flipped seed 55 back -> CS 8/8, ALL full-clock timeout holds —
      // measured by the D278 attribution A/B (.tmp/ab-e60.mjs: pre-D273 deliverable 629f6fa reads the D268 vector
      // verbatim, US on 55 @5012 steps; HEAD reads these exact rows; _parityOff full-row identical -> T26 attacker
      // parity is EXACTLY ZERO here, cautious-gated) and re-anchored at this checkpoint (D279) when the tooth,
      // not in D273's or D278's focused sets, surfaced red in the full battery. probe-presets' layers-OFF tooth
      // pins this same config independently (D278). A future drop toward 5/8 still signals an E49b regression;
      // a strength/step drift with winners intact signals a trajectory-level change (the melee-table class); any
      // D74-approved retune of E49b or the cautious band legitimately reds this tooth. Either way, NEVER re-pin
      // silently: a future miss needs its own attribution A/B against the last-green deliverable
      // (git show <last-green>:civil_war_generals.html). NOTE (panel sharpening, D279): the us/cs strength integers
      // are engine-FP-trajectory values verified on the documented probe environment (the 8GB Mac) — a CROSS-PLATFORM
      // strength-only drift with winners+steps intact is triaged as environment (V8/CPU float rounding), not a
      // melee-table regression.
      if(misses.length) throw new Error('arms-OFF bullrun full-row baseline broken (committed CS 8/8, D279 rows): '+misses.join(', '));
      if(cs!==8) throw new Error('arms-OFF bullrun balance != the committed 8/8 (byte-identity broken): '+cs+'/8');
      return { armsOffCS:cs+'/8', perSeedVector:'full-row pinned' }; });

    step('REDUCE-MOTION honored: the battery/trooper draw helpers emit NO muzzle-flash / canister-cone / charge-trail when reduceMotion', function(){
      __FIELD.arms=true;
      var gun=mk({id:'G',side:'US',arm:'art',x:300,z:300,men:160}); gun._artFlash=0.4; gun._canisterLive=0.4;
      var trooper=mk({id:'C',side:'CS',arm:'cav',x:300,z:300,men:300}); trooper.order={type:'charge',tx:1,tz:1,tface:0};
      var rm=recCtx(); fldDrawBattery(rm, gun, 100, 100, true); fldDrawTrooper(rm, trooper, 100, 100, true);
      var rs=rm._ops.join('|');
      if(rs.indexOf('#ffe2a0')>=0 || rs.indexOf('#e8b85a')>=0 || rs.indexOf('#d8c89a')>=0) throw new Error('reduceMotion did NOT suppress the flash/cone/trail: '+rs);
      var mo=recCtx(); fldDrawBattery(mo, gun, 100, 100, false); fldDrawTrooper(mo, trooper, 100, 100, false);
      var ms=mo._ops.join('|');
      if(ms.indexOf('#ffe2a0')<0 || ms.indexOf('#e8b85a')<0 || ms.indexOf('#d8c89a')<0) throw new Error('motion-ON did not draw the flash + cone + trail: '+ms);
      return { reduceMotionSuppressed:true, motionDrew:true }; });

    step('CAVALRY RAID AI DISPATCH: fldArmsAiUnit(role:raid) heads for the enemy train; falls back to flanker with no train (no throw)', function(){
      __FIELD._logisticsOff=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1}); __FIELD.arms=true; __FIELD.logistics=true;
      var et=__FIELD.trains.US;
      var raider=mk({id:'R',side:'CS',arm:'cav',role:'raid',x:et.x-300,z:et.z-300,men:300});
      __FIELD.units=[raider]; var handled=fldArmsAiUnit(raider);
      if(!handled) throw new Error('fldArmsAiUnit did not handle the cav raider');
      if(raider.order.type!=='move') throw new Error('raider did not move toward the train, order='+raider.order.type);
      var dToTrain=Math.sqrt(Math.pow(raider.order.tx-et.x,2)+Math.pow(raider.order.tz-et.z,2));
      if(!(dToTrain < fldDist(raider, et))) throw new Error('raid move not toward the enemy train');
      __FIELD.trains=null; raider.order={type:'hold',tx:raider.x,tz:raider.z,tface:0};   // no train -> fall back, no throw
      var ok2=fldArmsAiUnit(raider);
      if(!ok2 || !raider.order) throw new Error('raid no-train fallback failed');
      __FIELD._logisticsOff=true;
      return { raidMovesToTrain:true, noTrainFallback:raider.order.type }; });

    step('BRIDGE TIE-BREAK is order-independent (bug-hunt LOW): equal-count battery types -> a deterministic, sorted pick', function(){
      function C(b){ return { side:'US', artillery:{ batteries:b } }; }
      var a=_fldArtProfile(C({whitworth:2, napoleon:2})), b=_fldArtProfile(C({napoleon:2, whitworth:2}));
      if(!a || !b) throw new Error('tie profile null');
      if(a.gun!==b.gun) throw new Error('tie-break depends on key order: '+a.gun+' vs '+b.gun);
      return { tiePick:a.gun }; });

    step('BULL RUN DEFAULTS TO FOG ON (D67): unspecified fog -> fog ON; an explicit pin still wins; the STACKED live config (officers+logistics+arms) stays CS-FAVOURED', function(){
      delete G.settings.tacticalFog;   // clear the SETUP pin so the SCENARIO default applies (the live launch path)
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});   // NO opts.fog -> scenario default
      var defaulted = __FIELD.fog;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1, fog:false});   // an explicit pin still wins
      var pinnedOff = __FIELD.fog;
      if(!defaulted) throw new Error('Bull Run did not default to fog ON');
      if(pinnedOff) throw new Error('an explicit fog:false did not override the scenario default');
      // the stacked LIVE config (ALL layers on, default fog) must be CS-FAVOURED (the D67 fix: fog aids the defender)
      function runLive(seed){ delete G.settings.tacticalFog; __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return __FIELD.winner; }
      var seeds=[1,7,21,42,55,101,303,909], cs=0; for(var i=0;i<seeds.length;i++){ if(runLive(seeds[i])==='CS') cs++; }
      G.settings.tacticalFog=false;   // restore the SETUP pin for the remaining (clear-weather) steps
      if(!(cs>=6)) throw new Error('the STACKED live config (default fog ON) is NOT CS-favoured: '+cs+'/8');
      return { defaultsFogOn:!!defaulted, explicitPinWins:!pinnedOff, liveStackedCS:cs+'/8' }; });

    step('BALANCE (arms ON, officers+logistics OFF): Bull Run is deterministic + CS-FAVOURED-BUT-COMPETITIVE (fog OFF)', function(){
      function runBR(seed, fog){ __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed, fog:!!fog}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return { w:__FIELD.winner, us:strength('US'), cs:strength('CS') }; }
      var a=runBR(21,false), b=runBR(21,false);
      if(a.w!==b.w||a.us!==b.us||a.cs!==b.cs) throw new Error('arms-ON non-deterministic');
      var seeds=[1,7,21,42,55,101,303,909], cs=0; for(var i=0;i<seeds.length;i++){ if(runBR(seeds[i],false).w==='CS') cs++; }
      // arms adds canister/cavalry texture but must keep Bull Run CS-favoured (historical) AND competitive (the US can break):
      // CS in [4,7] of 8 fog-OFF — catches BOTH a defender-wrecking regression AND canister/cav over-favouring the defender.
      if(!(cs>=4 && cs<=7)) throw new Error('arms ON moved CS out of the CS-favoured-but-competitive band (fog OFF): '+cs+'/'+seeds.length);
      return { deterministic:true, cs_of:seeds.length, csWins:cs }; });

    step('FOG REGRESSION GUARD (arms ON): fog still AIDS THE DEFENDER (D58/D64) — canister/cavalry do not invert it', function(){
      function runBR(seed){ __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed, fog:true}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return __FIELD.winner; }
      var seeds=[1,7,21,42,55,101,303,909], cs=0; for(var i=0;i<seeds.length;i++){ if(runBR(seeds[i])==='CS') cs++; }
      if(!(cs>=6)) throw new Error('FOG INVERSION: arms-ON fog-ON dropped the defender to '+cs+'/'+seeds.length+' (must stay >=6 — fog must keep aiding the defender)');
      return { fogOn_csWins:cs+'/'+seeds.length }; });

    step('SANDBOX NO-OP when off + resolves; arms ON also resolves (no infinite loop)', function(){
      __FIELD._armsOff=true; fldLaunchSandbox({renderer:'none', autoBoth:true, seed:99});
      if(__FIELD.arms!==false) throw new Error('off sandbox did not force arms off');
      __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<12000){ fldSimStep(0.05); n++; }
      if(__FIELD.phase!=='over') throw new Error('off sandbox did not finish');
      __FIELD._armsOff=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:42}); __FIELD.phase='battle'; __FIELD.paused=false; var m=0; while(__FIELD.phase==='battle'&&m<20000){ fldSimStep(0.05); m++; }
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('arms-ON battle bad winner: '+__FIELD.winner);
      return { offWinner:'resolved', onWinner:__FIELD.winner }; });

    step('NO CLASSIC CONTAMINATION: an arms battle never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode;
      __FIELD._armsOff=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:3}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; }
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
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });   // slow-Mac: the 'load' wait stalls while embedded assets stream (the documented D233 class, repaired in D251; was harness-red at HEAD, steps=0); inline scripts are all the probe needs
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    const shot = await page.evaluate(`(function(){
      __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', autoBoth:true, seed:21});
      __FIELD.fog=false; __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(3400, 0.05);
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      var art=0,cav=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.arm==='art') art++; if(u.arm==='cav') cav++; }
      return { simT: Math.round(__FIELD.t), winner: __FIELD.winner, batteries:art, cavalry:cav };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-arms.png'), timeout: 240000 });   // slow-Mac WebGL ReadPixels stall: preserve the required full screenshot, but allow the 8 GB Mac's observed capture window
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-arms.json'), JSON.stringify(result, null, 2));
    await closePage(page);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  console.log('probe-arms ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-arms.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-arms.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-arms: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-arms: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-arms: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
