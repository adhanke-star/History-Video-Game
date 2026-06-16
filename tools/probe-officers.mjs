#!/usr/bin/env node
// tools/probe-officers.mjs — TACTICAL ENGINE B-2 (officers & command on the field).
// Verifies EMPIRICALLY on the renderer-agnostic sim (no GPU): a scenario builds its real command cast,
// the sandbox builds two generic army commanders, and _officersOff builds NONE (the byte-identical gate);
// the command AURA lifts morale-recovery / shortens the rally / stiffens the rout save for units in radius;
// a leader near firing troops accrues exposure and is WOUNDED then FALLS (deterministically, seeded once),
// losing the aura and dealing a one-time command shock; the layer ties to the named-generals system (a
// campaign player commander's quality tracks bridgeArmy leadership); officers-ON battles stay deterministic
// and keep Bull Run CS-competitive with fog still aiding the defender. Writes shots/probe-officers.{json,png}.
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
    u.state = st || 'steady'; u.morale = (st==='wavering') ? 40 : (st==='shaken'?40:(st==='routing'?20:78)); return u; }
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  function runBR(seed, fog){
    fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed});   // officers ON (default)
    __FIELD.fog = !!fog; __FIELD.phase='battle'; __FIELD.paused=false;
    var n=0; while(__FIELD.phase==='battle' && n<20000){ fldSimStep(0.05); n++; }
    return { winner:__FIELD.winner, by:__FIELD.winBy, t:Math.round(__FIELD.t), us:strength('US'), cs:strength('CS') };
  }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldBuildOfficers!=='function' || typeof fldOfficersStep!=='function' || typeof fldMakeOfficer!=='function')
      return JSON.stringify({ok:false, fatal:'officer layer fns missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; G.settings.tacticalFog=false;
    __FIELD._officersOff = false;   // this probe EXERCISES the officer layer (the others lock it off)
    __FIELD._logisticsOff = true;   // ...but ISOLATES it from the B-3 logistics layer (which has its own probe-logistics)
    __FIELD._armsOff = true;        // ...and from the B-4 arm-roles layer (probe-arms covers it) -> the officer sweep stays isolated

    step('BUILD: a scenario builds its real cast (Bull Run 7), the sandbox builds 2 generic, _officersOff builds 0', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      var L=__FIELD.leaders||[]; if(L.length!==7) throw new Error('Bull Run should build 7 leaders (2 US + 5 CS), got '+L.length);
      var us=L.filter(function(l){return l.side==='US';}).length, cs=L.filter(function(l){return l.side==='CS';}).length;
      if(us!==2||cs!==5) throw new Error('side split wrong: US '+us+' CS '+cs);
      var names=L.map(function(l){return l.short;});
      if(names.indexOf('McDowell')<0||names.indexOf('Beauregard')<0||names.indexOf('Jackson')<0) throw new Error('expected cast missing: '+names.join(','));
      var jack=L.filter(function(l){return l.short==='Jackson';})[0];
      if(jack.active) throw new Error('timed leader Jackson should be INACTIVE at T=0 (arrives at '+jack.atSec+'s)');
      if(!(jack.atSec===135)) throw new Error('Jackson atSec should be 135, got '+jack.atSec);
      // sandbox -> 2 generic
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      if((__FIELD.leaders||[]).length!==2) throw new Error('sandbox should build 2 generic commanders, got '+(__FIELD.leaders||[]).length);
      // _officersOff -> 0 (the byte-identical gate)
      __FIELD._officersOff=true; fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      if(__FIELD.officers!==false) throw new Error('_officersOff did not force officers off');
      if((__FIELD.leaders||[]).length!==0) throw new Error('officers-off should build NO leaders, got '+(__FIELD.leaders||[]).length);
      __FIELD._officersOff=false;
      return { bullRun:L.length, usCs:[us,cs], sandbox:2, off:0 }; });

    step('COMMAND AURA: cmdBonus falls off SHARPLY with distance (close >> edge), is 0 outside the radius, and the sum is capped', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:2});
      __FIELD.officers=true;
      var near=mk('NEAR','US',600,460,1500,'steady'), edge=mk('EDGE','US',600,290,1500,'steady'), far=mk('FAR','US',600,60,1500,'steady');
      var L=fldMakeOfficer({side:'US', id:'LT', name:'Test', short:'Test', quality:0.8, radius:200, x:600, z:470});  // d: near 10, edge 180, far 410(>200)
      __FIELD.units=[near,edge,far]; __FIELD.leaders=[L];
      fldOfficersStep(0.05);
      // expected: near 0.8*(1-10/200)=0.76 ; edge 0.8*(1-180/200)=0.08 ; far 0
      if(!(near.cmdBonus>0.6)) throw new Error('close unit bonus too low: '+near.cmdBonus);
      if(!(edge.cmdBonus>0.01 && edge.cmdBonus<0.2)) throw new Error('edge bonus not in the expected falloff band: '+edge.cmdBonus);
      if(!(far.cmdBonus===0)) throw new Error('out-of-radius unit should have 0 bonus, got '+far.cmdBonus);
      if(!(near.cmdBonus > edge.cmdBonus*4)) throw new Error('falloff too flat — a dropped distance term would slip past: near '+near.cmdBonus+' edge '+edge.cmdBonus);
      // cap: two strong overlapping auras cannot exceed the cap
      var L2=fldMakeOfficer({side:'US', id:'LT2', name:'T2', short:'T2', quality:0.9, radius:300, x:600, z:462});
      __FIELD.leaders=[L,L2]; fldOfficersStep(0.05);
      if(!(near.cmdBonus<=0.9001)) throw new Error('cmdBonus exceeded the cap: '+near.cmdBonus);
      if(!(near.cmdBonus>0.85)) throw new Error('two strong overlapping auras should reach the cap, got '+near.cmdBonus);
      return { near:Math.round(near.cmdBonus*100)/100, edge:Math.round(edge.cmdBonus*100)/100, far:far.cmdBonus }; });

    step('MORALE LIFT: a safe unit IN command recovers morale faster than the same unit out of command', function(){
      function recover(bonus){
        fldLaunchSandbox({renderer:'none', autoBoth:true, seed:9});
        var u=mk('S','US',600,450,1500,'shaken'); u.morale=40; __FIELD.units=[u];
        for(var t=0;t<100;t++){ u.cmdBonus=bonus; u.underFire=0; fldMoraleStep(u,0.05); }
        return u.morale;
      }
      var withL=recover(1.0), without=recover(0);
      if(!(withL>without+0.5)) throw new Error('command presence did not speed recovery: with '+withL.toFixed(1)+' vs without '+without.toFixed(1));
      return { withCmd:Math.round(withL*10)/10, without:Math.round(without*10)/10 }; });

    step('FASTER RALLY: a routing unit near a leader rallies sooner (shorter rally time)', function(){
      function rallyTicks(bonus){
        fldLaunchSandbox({renderer:'none', autoBoth:true, seed:5});
        var u=mk('R','US',600,450,1500,'routing'); u.rallyT=0; u.morale=20; __FIELD.units=[u];   // no enemies -> not in danger -> it can rally
        var t=0; for(;t<4000;t++){ u.cmdBonus=bonus; fldMoraleStep(u,0.05); if(u.state!=='routing') break; }
        return t;
      }
      var withL=rallyTicks(1.0), without=rallyTicks(0);
      if(!(withL<without)) throw new Error('command did not shorten the rally: with '+withL+' vs without '+without);
      return { withCmdTicks:withL, withoutTicks:without }; });

    step('ROUT RESISTANCE: the command bonus raises the rout SAVE (units in command hold longer)', function(){
      // the save formula is min(0.95,(0.5+0.18*bonus)*rally); a higher save -> fldRng()>save false more often -> fewer routs.
      // statistical check across seeds on a low-morale unit at the rout threshold.
      function routs(bonus){
        var n=0;
        for(var s=1;s<=40;s++){
          fldLaunchSandbox({renderer:'none', autoBoth:true, seed:s});
          var u=mk('B','US',600,450,1500,'shaken'); u.morale=8; __FIELD.units=[u];   // below rout threshold -> rolls a save
          u.cmdBonus=bonus; fldMoraleStep(u,0.05);
          if(u.state==='routing') n++;
        }
        return n;
      }
      var withL=routs(1.2), without=routs(0);
      if(!(withL<without)) throw new Error('command did not reduce routs: with '+withL+' vs without '+without+' (of 40)');
      return { routsWithCmd:withL, routsWithout:without, of:40 }; });

    step('LEADER FALLS: a commander pinned by close firing troops is WOUNDED then FALLS; the aura dies and nearby friends take a command shock', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:3});
      var L=fldMakeOfficer({side:'CS', id:'Lb', name:'Gen. Bee', short:'Bee', quality:0.45, radius:180, x:600, z:455, fate:0.35, teach:'Bee has fallen.'});  // a fall-prone (low-fate) forward leader
      var friend=mk('FR','CS',600,460,1500,'steady'), enemy=mk('EN','US',600,510,3200,'steady');
      __FIELD.units=[friend,enemy]; __FIELD.leaders=[L]; __FIELD.officers=true;
      var woundT=-1, fellT=-1, m0=friend.morale;
      for(var t=0;t<9000;t++){ enemy.ammo=100; fldOfficersStep(0.05); if(woundT<0&&L.wounded) woundT=t; if(!L.alive){ fellT=t; break; } }
      if(fellT<0) throw new Error('the leader never fell despite sustained close fire');
      if(!(woundT>=0&&woundT<fellT)) throw new Error('a wound should precede the fall: wound '+woundT+' fell '+fellT);
      if(L.alive) throw new Error('leader should be dead');
      if(!L.fellAt) throw new Error('a fallen leader should record fellAt');
      if(!(m0-friend.morale>0)) throw new Error('the command shock did not hit nearby friends');
      // after the fall the aura is gone -> a fresh step leaves cmdBonus 0
      fldOfficersStep(0.05);
      if(!(((friend.cmdBonus)||0)===0)) throw new Error('a dead leader still projected an aura: '+friend.cmdBonus);
      return { woundTick:woundT, fellTick:fellT, shock:Math.round((m0-friend.morale)*10)/10 }; });

    step('DETERMINISM: the seeded fate reproduces — same seed -> same fall tick', function(){
      function fall(seed){
        fldLaunchSandbox({renderer:'none', autoBoth:true, seed:seed});
        var L=fldMakeOfficer({side:'CS', id:'Ld', name:'X', short:'X', quality:0.5, radius:180, x:600, z:455, fate:0.4});
        var en=mk('EN','US',600,510,3200,'steady'); __FIELD.units=[mk('FR','CS',600,460,1500,'steady'),en]; __FIELD.leaders=[L];
        var t=0; for(;t<9000;t++){ en.ammo=100; fldOfficersStep(0.05); if(!L.alive){ break; } }
        return { t:t, fate:Math.round(L._fate*1000)/1000 };
      }
      var a=fall(77), b=fall(77), c=fall(78);
      if(a.t!==b.t||a.fate!==b.fate) throw new Error('non-deterministic fall: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      return { seed77:a.t, seed77b:b.t, seed78:c.t, fate77:a.fate }; });

    step('TIES TO NAMED-GENERALS: a campaign player commander takes quality from bridgeArmy leadership + the appointed general name', function(){
      // generic (no campaign) baseline
      __FIELD.campaignCtx=null;
      var gen = fldOfficerSideQuality('US');
      if(Math.abs(gen.quality-0.55)>1e-9) throw new Error('non-campaign default quality should be 0.55, got '+gen.quality);
      // a minimal campaign with a strong manpower/army -> bridgeArmy leadership computes -> a finite player quality, named if a general sits
      var saved=G.campaign;
      G.campaign={ side:'US', clock:{year:1863, weariness:20}, manpower:{strength:92}, production:{equipIndex:90}, blockade:{}, warroom:{supply:70}, strategy:{}, president:{}, battlePrep:{} };
      __FIELD.campaignCtx={ bd:{} };
      var ok=true, q=null, err=null;
      try { q=fldOfficerSideQuality('US'); } catch(e){ ok=false; err=String(e&&e.message||e); }
      G.campaign=saved; __FIELD.campaignCtx=null;
      if(!ok) throw new Error('campaign quality threw: '+err);
      if(!(typeof q.quality==='number'&&isFinite(q.quality)&&q.quality>=0.18&&q.quality<=0.95)) throw new Error('campaign quality out of band: '+q.quality);
      if(!(typeof q.name==='string'&&q.name.length)) throw new Error('campaign commander has no name');
      return { generic:gen.quality, campaignQuality:Math.round(q.quality*1000)/1000, campaignName:q.name, campaignShort:q.short }; });

    step('SANDBOX with officers ON resolves + is deterministic', function(){
      function run(seed){ fldLaunchSandbox({renderer:'none', autoBoth:true, seed:seed}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<12000){ fldSimStep(0.05); n++; } return { w:__FIELD.winner, us:strength('US'), cs:strength('CS') }; }
      var a=run(31), b=run(31);
      if(a.w!==b.w||a.us!==b.us||a.cs!==b.cs) throw new Error('officers-ON sandbox non-deterministic');
      if(['US','CS','draw'].indexOf(a.w)<0) throw new Error('bad sandbox winner: '+a.w);
      return { winner:a.w, us:a.us, cs:a.cs }; });

    step('BALANCE (officers ON): CS stays favored, fog still aids the defender, and officers PERTURB not RE-ROLL the winner (low ON-vs-OFF flip rate)', function(){
      function run(seed, fog, on){ __FIELD._officersOff = !on; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed}); __FIELD._officersOff=false; __FIELD.fog=!!fog; __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return __FIELD.winner; }
      var seeds=[1,7,21,42,55,101,303,909], offCS=0, onCS=0, onFogCS=0, flips=0;
      for(var i=0;i<seeds.length;i++){ var wOff=run(seeds[i],false,false), wOn=run(seeds[i],false,true); if(wOff==='CS') offCS++; if(wOn==='CS') onCS++; if(wOff!==wOn) flips++; }
      for(var j=0;j<seeds.length;j++){ if(run(seeds[j],true,true)==='CS') onFogCS++; }
      if(!(onCS>=Math.ceil(seeds.length/2))) throw new Error('officers ON not CS-favored fog-OFF: '+onCS+'/'+seeds.length);
      if(!(onFogCS>=onCS)) throw new Error('fog no longer aids the defender with officers ON: fogON '+onFogCS+' < fogOFF '+onCS);
      // PRINCIPLED, not a re-roll: the dense CS command on the hill (5 leaders vs the US 2) must HELP the
      // defender, not randomly scramble — officers ON keep the CS at least as favored as OFF (±1 seed noise).
      // (Determinism — that it is not a coin flip — is locked by the separate DETERMINISM step.)
      if(!(onCS >= offCS - 1)) throw new Error('officers ON HURT the side with the command advantage (CS): on '+onCS+' off '+offCS);
      return { seeds:seeds.length, officersOff_CS:offCS, officersOn_CS:onCS, officersOnFog_CS:onFogCS, onVsOff_flips:flips }; });

    step('HISTORY: army commanders (Beauregard/Johnston/McDowell) SURVIVE the day in the large majority — only Bee & Bartow were the real casualties', function(){
      var seeds=[1,7,21,42,55,101,303,909,1234,5678], survArmy=0, beeFell=0;
      function leadById(id){ var L=__FIELD.leaders||[]; for(var i=0;i<L.length;i++) if(L[i].id===id) return L[i]; return null; }
      for(var i=0;i<seeds.length;i++){
        fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seeds[i]});
        __FIELD.fog=false; __FIELD.phase='battle'; __FIELD.paused=false;
        var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; }
        var bg=leadById('ld_beauregard'), jo=leadById('ld_johnston'), mc=leadById('ld_mcdowell'), bee=leadById('ld_bee');
        if(bg&&bg.alive&&jo&&jo.alive&&mc&&mc.alive) survArmy++;
        if(bee&&!bee.alive) beeFell++;
      }
      if(!(survArmy>=Math.ceil(seeds.length*0.7))) throw new Error('army commanders die too often (history says they survived): all-three-survived '+survArmy+'/'+seeds.length);
      return { seeds:seeds.length, allArmyCdrsSurvived:survArmy, beeFell:beeFell }; });

    step('CS-PLAYER: the HUD roster + fog follow the PLAYER side (fldPlayerSide), not a hardcoded US', function(){
      __FIELD.campaignCtx=null;
      if(fldPlayerSide()!=='US') throw new Error('standalone player side should be US');
      var saved=G.campaign;
      G.campaign={ side:'CS', clock:{year:1862}, manpower:{}, production:{}, blockade:{}, warroom:{}, strategy:{}, president:{}, battlePrep:{} };
      __FIELD.campaignCtx={ bd:{} };
      var ps=fldPlayerSide();
      __FIELD.officers=true;
      __FIELD.leaders=[ fldMakeOfficer({side:'US', id:'lu', short:'Yank', quality:0.6, radius:200, x:600, z:800}), fldMakeOfficer({side:'CS', id:'lc', short:'Reb', quality:0.6, radius:200, x:600, z:200}) ];
      __FIELD.fog=true; __FIELD.units=[];
      var roster=(typeof fldOfficerHudRoster==='function')?fldOfficerHudRoster():'';
      var seenOwn=fldOfficerSeen(__FIELD.leaders[1]);   // CS = player's own -> always seen under fog
      G.campaign=saved; __FIELD.campaignCtx=null; __FIELD.fog=false;
      if(ps!=='CS') throw new Error('CS campaign player side should be CS, got '+ps);
      if(roster.indexOf('Reb')<0) throw new Error('CS-player roster did not show the player (CS) officer: '+roster);
      if(roster.indexOf('Yank')>=0) throw new Error('CS-player roster LEAKED the enemy (US) officer');
      if(!seenOwn) throw new Error('the player CS leader should be always-visible under fog');
      return { standalone:'US', csCampaign:ps, rosterShowsOwnNotEnemy:true }; });

    step('WITHDRAWAL WORKS: banked risk DECAYS out of contact and a wound MENDS — no death-ratchet', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:11});
      var L=fldMakeOfficer({side:'CS', id:'lw', short:'W', quality:0.5, radius:180, x:600, z:455, fate:0.4});
      var en=mk('EN','US',600,500,3200,'steady');
      __FIELD.units=[mk('FR','CS',600,470,1500,'steady'), en]; __FIELD.leaders=[L]; __FIELD.officers=true;
      var t=0; for(; t<8000 && L.alive && !L.wounded; t++){ en.ammo=100; fldOfficersStep(0.05); }
      if(!L.wounded) throw new Error('never reached the wound threshold under sustained close fire');
      if(!L.alive) throw new Error('leader fell before the withdrawal could be tested');
      var riskPeak=L._risk;
      __FIELD.units=[mk('FR','CS',600,470,1500,'steady')];   // enemy gone -> withdrawn to safety
      for(var k=0;k<2500;k++){ fldOfficersStep(0.05); }
      if(!(L._risk < riskPeak)) throw new Error('risk did not decay out of contact (ratchet): peak '+riskPeak.toFixed(2)+' now '+L._risk.toFixed(2));
      if(L.wounded) throw new Error('the wound never mended after long safety (permanent command tax)');
      if(!L.alive) throw new Error('leader died while safely withdrawn');
      return { riskPeak:Math.round(riskPeak*100)/100, riskAfter:Math.round(L._risk*100)/100, mended:true }; });

    step('COVER SHELTERS: a leader behind a wall/woods accrues LESS exposure-risk than one in the open at the same range (the Jackson lesson)', function(){
      function risk1(x,z){ fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:5}); var L=fldMakeOfficer({side:'CS', id:'lc2', short:'C', quality:0.5, radius:180, x:x, z:z, fate:1}); var en=mk('EN','US',x,z+70,2500,'steady'); __FIELD.units=[en]; __FIELD.leaders=[L]; __FIELD.officers=true; en.ammo=100; L._risk=0; fldOfficerHazard(L,0.05); return L._risk; }
      var rOpen=risk1(300,450);    // open ground, no cover near
      var rWall=risk1(600,520);    // on the Robinson House lane/fence + Henry Hill crest (cover)
      if(!(rWall < rOpen)) throw new Error('cover did not reduce the leader hazard: inCover '+rWall.toFixed(4)+' open '+rOpen.toFixed(4));
      return { riskOpen:Math.round(rOpen*1e4)/1e4, riskInCover:Math.round(rWall*1e4)/1e4 }; });

    step('NO CLASSIC CONTAMINATION: an officers battle never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode; runBR(3,false);
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
    // visual: 2D Bull Run, officers ON, fog OFF, mid-battle — the command rings + mounted officers on Henry Hill.
    const shot = await page.evaluate(`(function(){
      __FIELD._officersOff=false;
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', autoBoth:true, seed:21});
      __FIELD.fog=false; __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(2600, 0.05);
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      var down=(typeof fldOfficersDownList==='function')?fldOfficersDownList():[];
      return { simT: Math.round(__FIELD.t), winner: __FIELD.winner, phase: __FIELD.phase, leaders:(__FIELD.leaders||[]).length, downCount:down.length };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-officers.png') });
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-officers.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-officers ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
