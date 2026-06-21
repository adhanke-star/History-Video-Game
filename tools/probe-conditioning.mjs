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
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-conditioning.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-conditioning ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
