#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-conditioning.mjs — A6a battle-day conditioning. Verifies the strategic war shapes
// the army that takes the field: a strong war fields stronger, steadier player units than a weak
// one (same battle, deterministic baseline); the conditioning applies ONLY to campaign battles
// (Free Battle / Classic untouched); battlePrep.entrench raises player ent (defense); raidSupply
// saps the enemy's morale; and Field Fortifications (A2) stamps trench cover on the player's
// deploy zone. Boots real battles via startBattleRuntime. Writes shots/probe-conditioning.json.
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
  function mkC(side){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    C.clock.year=1863; C.president.date={year:1863,month:1}; return C; }
  function setWar(C, strong){ // drive bridgeArmy.overall high or low via the inputs it reads
    if(C.manpower) C.manpower.strength = strong?100:35;
    if(C.production) C.production.equipIndex = strong?100:25;
    if(C.clock) C.clock.weariness = strong?0:95;
    if(C.warroom) C.warroom.supply = strong?100:30;
    if(C.blockade) C.blockade.importFactor = 1.0; }
  function playerStats(side){ var B=G.battle, S=0, M=0, n=0, ent=0, ne=0;
    for(var i=0;i<B.units.length;i++){ var u=B.units[i]; if(!u||u.side!==side) continue;
      if(u.type!=='hq'){ S+=u.strength; ne++; ent+=(u.ent||0); } M+=u.morale; n++; }
    return { total:S, avgMor:n?Math.round(M/n):0, count:n, avgEnt:ne?(ent/ne):0, infCount:ne }; }
  function enemyAvgMorale(){ var B=G.battle, M=0,n=0; for(var i=0;i<B.units.length;i++){ var u=B.units[i];
    if(u&&u.side===B.enemySide){ M+=u.morale; n++; } } return n?M/n:0; }
  try {
    if (typeof startBattleRuntime!=='function' || typeof BATTLES==='undefined') return JSON.stringify({ok:false,fatal:'engine missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    var bd=BATTLES.find(function(b){return b.id==='antietam';})||BATTLES[0];

    step('a STRONG war fields a stronger, steadier army than a WEAK war (same battle)', function(){
      var Cs=mkC('US'); setWar(Cs,true); var aS=bridgeArmy(Cs);
      startBattleRuntime(bd,'US',true); var ps=G.battle.playerSide; var strong=playerStats(ps);
      var Cw=mkC('US'); setWar(Cw,false); var aW=bridgeArmy(Cw);
      startBattleRuntime(bd,'US',true); var weak=playerStats(ps);
      if (!(aS.overall > aW.overall)) throw new Error('test setup: strong overall not > weak ('+aS.overall+' vs '+aW.overall+')');
      if (strong.count!==weak.count) throw new Error('non-deterministic unit count: '+strong.count+' vs '+weak.count);
      if (!(strong.total > weak.total)) throw new Error('strong army should field more strength: '+strong.total+' vs '+weak.total);
      if (!(strong.avgMor > weak.avgMor)) throw new Error('strong army should have higher morale: '+strong.avgMor+' vs '+weak.avgMor);
      return { strongOverall:aS.overall, weakOverall:aW.overall, strongTotal:strong.total, weakTotal:weak.total, strongMor:strong.avgMor, weakMor:weak.avgMor }; });

    step('conditioning applies ONLY to campaign battles (Free Battle untouched)', function(){
      var C=mkC('US'); setWar(C,true);
      startBattleRuntime(bd,'US',false);   // Free Battle (fromCampaign=false)
      if (G.battle.fromCampaign!==false) throw new Error('free battle should have fromCampaign=false');
      if (typeof _a6Condition==='function'){ var r=_a6Condition(); if (r!==null) throw new Error('_a6Condition should no-op on a free battle, got '+JSON.stringify(r)); }
      return { fromCampaign:G.battle.fromCampaign }; });

    step('battlePrep ENTRENCH raises the player ent (defense)', function(){
      var C0=mkC('US'); setWar(C0,true); C0.battlePrep={entrench:false};
      startBattleRuntime(bd,'US',true); var noEnt=playerStats(G.battle.playerSide).avgEnt;
      var C=mkC('US'); setWar(C,true); C.battlePrep={entrench:true};
      startBattleRuntime(bd,'US',true); var ent=playerStats(G.battle.playerSide).avgEnt;
      if (!(ent > noEnt)) throw new Error('entrench should raise ent: '+ent+' vs '+noEnt);
      if (!(ent >= 2)) throw new Error('entrench should add ~2 ent, got '+ent);
      return { entAvg:Math.round(ent*100)/100, noEntAvg:Math.round(noEnt*100)/100 }; });

    step('battlePrep RAID SUPPLY saps the enemy morale', function(){
      var C0=mkC('US'); setWar(C0,true); C0.battlePrep={raidSupply:false};
      startBattleRuntime(bd,'US',true); var foeBase=enemyAvgMorale();
      var C=mkC('US'); setWar(C,true); C.battlePrep={raidSupply:true};
      startBattleRuntime(bd,'US',true); var foeRaid=enemyAvgMorale();
      if (!(foeRaid < foeBase)) throw new Error('raid supply should lower enemy morale: '+foeRaid+' vs '+foeBase);
      return { enemyMoraleBase:Math.round(foeBase), enemyMoraleRaided:Math.round(foeRaid) }; });

    step('a FRESH campaign army plays ~like Classic (no silent buff — §27)', function(){
      var Cf=mkC('US'); var aFresh=bridgeArmy(Cf);   // fresh defaults, zero strategic investment
      startBattleRuntime(bd,'US',true); var camp=playerStats(G.battle.playerSide).total;
      startBattleRuntime(bd,'US',false); var free=playerStats(G.battle.playerSide).total;
      var ratio=free?camp/free:0;
      if (!(ratio>=0.95 && ratio<=1.08)) throw new Error('fresh campaign should ~match Classic, ratio='+ratio.toFixed(3)+' (overall '+aFresh.overall+')');
      return { freshOverall:aFresh.overall, campTotal:camp, freeTotal:free, ratio:Math.round(ratio*1000)/1000 }; });

    step('E05 edge: a fully COLLAPSED war (overall 0, a legitimate clamped value) keeps the FULL floor penalty', function(){
      var C=mkC('US'); setWar(C,true);
      var _bA=bridgeArmy, neutral, ruined;
      try {
        bridgeArmy=function(){ return { overall:74, morale:60 }; };   // the exact neutral anchor -> mul 1.0
        startBattleRuntime(bd,'US',true); neutral=playerStats(G.battle.playerSide);
        bridgeArmy=function(){ return { overall:0, morale:0 }; };     // collapsed war -> mul floor 0.88, morale -18
        startBattleRuntime(bd,'US',true); ruined=playerStats(G.battle.playerSide);
      } finally { bridgeArmy=_bA; }
      if (neutral.count!==ruined.count) throw new Error('non-deterministic unit count: '+neutral.count+' vs '+ruined.count);
      var ratio=neutral.total?ruined.total/neutral.total:1;
      // the old (a.overall || 74) bug swapped 0 for the neutral anchor -> ratio 1.0 and NO penalty
      if (!(ratio<=0.92)) throw new Error('collapsed war took no real strength penalty: ratio='+ratio.toFixed(3)+' (the 0||74 bug)');
      if (!(ratio>=0.85)) throw new Error('collapsed-war penalty overshot the 0.88 floor: ratio='+ratio.toFixed(3));
      if (!(ruined.avgMor <= neutral.avgMor-10)) throw new Error('collapsed war morale not penalized: '+ruined.avgMor+' vs '+neutral.avgMor);
      return { neutralTotal:neutral.total, ruinedTotal:ruined.total, ratio:Math.round(ratio*1000)/1000, neutralMor:neutral.avgMor, ruinedMor:ruined.avgMor }; });

    step('Field Fortifications (A2) stamps trench cover when the player ENTRENCHES', function(){
      if (typeof engBuy!=='function') return { skipped:'no engineering module' };
      var C=mkC('US'); setWar(C,true); C.battlePrep={entrench:true};   // trench auto-stamp is gated on the entrench order now
      for(var l=0;l<3;l++) engBuy(C,'fortifications');   // max the Field Fortifications branch
      startBattleRuntime(bd,'US',true);
      var B=G.battle, ps=B.playerSide, dz=B.M.deploy&&B.M.deploy[ps]; if(!dz) return { skipped:'no deploy zone on this map' };
      var trench=0,total=0; dz.forEach(function(k){ total++; var t=B.M.map[k]; if(t&&t.t==='trench') trench++; });
      if (!(trench>0)) throw new Error('fortifications L3 + entrench should dig in part of the line, got '+trench+'/'+total);
      // and NOT when the player does NOT order entrench (deliberate-choice gate)
      var C2=mkC('US'); setWar(C2,true); C2.battlePrep={entrench:false}; for(var m=0;m<3;m++) engBuy(C2,'fortifications');
      startBattleRuntime(bd,'US',true); var B2=G.battle, dz2=B2.M.deploy&&B2.M.deploy[B2.playerSide], noEnt=0;
      if(dz2) dz2.forEach(function(k){ var t=B2.M.map[k]; if(t&&t.t==='trench') noEnt++; });
      if (noEnt!==0) throw new Error('trench should NOT stamp without the entrench order, got '+noEnt);
      return { fortLevel:engBranchLevel(C,'fortifications'), trenchWhenEntrenched:trench, deployTiles:total, trenchWithoutOrder:noEnt }; });

    step('PM2 (D250): bridgeEnemyWillStrengthMul contract — baselines exact-1.0 both sides, debuff-only, 0.0015/pt (US will 30 -> x0.94), floor 0.90 pinned at will 0 both sides, NaN/type/missing-strategy safe', function(){
      if (typeof bridgeEnemyWillStrengthMul!=='function') throw new Error('bridgeEnemyWillStrengthMul missing');
      var Cu=mkC('US'), Cc=mkC('CS');
      if (Cu.strategy.enemyWill!==70) throw new Error('US-player fresh baseline should be 70, got '+Cu.strategy.enemyWill);
      if (Cc.strategy.enemyWill!==72) throw new Error('CS-player fresh baseline should be 72, got '+Cc.strategy.enemyWill);
      if (bridgeEnemyWillStrengthMul(Cu)!==1) throw new Error('US fresh must be EXACT 1.0, got '+bridgeEnemyWillStrengthMul(Cu));
      if (bridgeEnemyWillStrengthMul(Cc)!==1) throw new Error('CS fresh must be EXACT 1.0, got '+bridgeEnemyWillStrengthMul(Cc));
      Cu.strategy.enemyWill=95; if (bridgeEnemyWillStrengthMul(Cu)!==1) throw new Error('debuff-only: will ABOVE baseline must stay 1.0');
      Cu.strategy.enemyWill=30; var m30=bridgeEnemyWillStrengthMul(Cu);
      if (Math.abs(m30-0.94)>1e-12) throw new Error('US will 30 should be x0.94, got '+m30);
      Cu.strategy.enemyWill=0; if (bridgeEnemyWillStrengthMul(Cu)!==0.90) throw new Error('US will 0 must pin the 0.90 floor, got '+bridgeEnemyWillStrengthMul(Cu));
      Cc.strategy.enemyWill=0; if (bridgeEnemyWillStrengthMul(Cc)!==0.90) throw new Error('CS will 0 must pin the 0.90 floor, got '+bridgeEnemyWillStrengthMul(Cc));
      Cu.strategy.enemyWill=NaN; if (bridgeEnemyWillStrengthMul(Cu)!==1) throw new Error('NaN will must read as baseline -> 1.0');
      Cu.strategy.enemyWill='collapsed'; if (bridgeEnemyWillStrengthMul(Cu)!==1) throw new Error('non-number will must read as baseline -> 1.0');
      delete Cu.strategy; if (bridgeEnemyWillStrengthMul(Cu)!==1) throw new Error('missing strategy must read as baseline -> 1.0');
      if (bridgeEnemyWillStrengthMul(null)!==1) throw new Error('null campaign must read 1.0');
      return { freshUS:1, freshCS:1, us30:m30, floorBothSides:0.90 }; });

    step('PM2 (D250): the CLASSIC leg thins the ENEMY at will 30 — every enemy non-hq unit exactly round(fresh x0.94); hq + player + enemy MORALE untouched', function(){
      function snap(side){ var B=G.battle, out=[]; for(var i=0;i<B.units.length;i++){ var u=B.units[i]; if(u&&u.side===side) out.push({type:u.type, s:u.strength, ms:u.maxStr, mor:u.morale}); } return out; }
      var C1=mkC('US'); setWar(C1,true);
      startBattleRuntime(bd,'US',true); var es=G.battle.enemySide; var freshE=snap(es), freshP=JSON.stringify(snap(G.battle.playerSide));
      var C2=mkC('US'); setWar(C2,true); C2.strategy.enemyWill=30;
      startBattleRuntime(bd,'US',true); if(G.battle.enemySide!==es) throw new Error('enemy side changed');
      var erodE=snap(es), erodP=JSON.stringify(snap(G.battle.playerSide));
      if (freshE.length!==erodE.length) throw new Error('non-deterministic enemy unit count: '+freshE.length+' vs '+erodE.length);
      var thinned=0, freshTot=0, erodTot=0;
      for (var i2=0;i2<freshE.length;i2++){ var f=freshE[i2], e=erodE[i2];
        if (f.type!==e.type) throw new Error('unit order changed at '+i2);
        if (e.mor!==f.mor) throw new Error('enemy MORALE must be untouched (the D249 inversion class): '+e.mor+' vs '+f.mor);
        if (f.type==='hq'){ if (e.s!==f.s) throw new Error('hq strength must be untouched: '+e.s+' vs '+f.s); continue; }
        freshTot+=f.s; erodTot+=e.s;
        var want=Math.max(1, Math.round(f.s*0.94));
        if (e.s!==want) throw new Error('enemy unit '+i2+' should be round(fresh*0.94)='+want+', got '+e.s+' (fresh '+f.s+')');
        var wantMs=Math.max(want, Math.round(f.ms*0.94));
        if (e.ms!==wantMs) throw new Error('enemy maxStr '+i2+' should be '+wantMs+', got '+e.ms);
        thinned++; }
      if (!(erodTot<freshTot)) throw new Error('erosion should thin the enemy total: '+erodTot+' vs '+freshTot);
      if (erodP!==freshP) throw new Error('the PLAYER line must be untouched by enemy-will erosion');
      return { enemyUnits:freshE.length, thinned:thinned, freshTotal:freshTot, erodedTotal:erodTot }; });
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
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });   // slow-Mac: the 'load' wait stalls while embedded assets stream (the documented gotcha, D233 class; fixed in D249); inline scripts are all the probe needs
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-conditioning.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-conditioning ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  const _pe = Array.isArray(result.pageerrors) ? result.pageerrors.length : 0;
  process.exit((result.ok && _pe === 0) ? 0 : 1);
})();
