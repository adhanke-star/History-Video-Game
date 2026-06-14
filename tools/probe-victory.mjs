#!/usr/bin/env node
// tools/probe-victory.mjs — S1e Paths-to-Victory: prove the South's collapse is
// PERFORMANCE-driven, not scripted (design law §5 / Aaron). A WINNING South escapes
// the death spiral (desertion ~stops, ranks refill, ports hold, recognition stays
// open) while a LOSING South still collapses historically; the counter-levers work;
// the Paths-to-Victory tab renders. Writes shots/probe-victory.json + paths-cs/us.png.
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
  function mkC(side){ return { side:side, iron:false, idx:0, funds:(side==='CS'?3000:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; }
  // mode: 'win' (South wins, enemy bleeds) | 'lose' (South bleeds, loses). lev = strategy levers to preset.
  function run(side, mode, lev){ G.campaign=mkC(side); var C=G.campaign; _t1InitAll(C);
    if(lev){ for(var k in lev) C.strategy[k]=lev[k]; }
    var e=(side==='US')?'CS':'US'; var series=[];
    for(var t=0;t<20;t++){ C.stats.battles++; var win=(mode==='win'); var type=win?(t%2?'win':'decisive'):'loss';
      if(win) C.stats.won++;
      var c={}; c[side]= win?900:2000; c[e]= win?2400:800;
      _t1Resolve(side, type, {playerSide:side,enemySide:e,bd:{name:'x',year:1861+Math.floor(t/4)},casualties:c,infl:{},units:[]}, C, win);
      var P=C.manpower, BL=C.blockade, S=C.strategy;
      series.push({ t:t, year:1861+Math.floor(t/4), mom:Math.round(vicMomentum(C)*100)/100,
        strength:Math.round(P.strength), ratio:Math.round(P.replacementRatio*100)/100, desert:Math.round(P.desertionTotal),
        pool:Math.round(P.pool), ports:BL.portsOpen, recog:Math.round(BL.recognition), foreclosed:BL.recognitionForeclosed,
        impF:Math.round(BL.importFactor*100)/100, enemyWill:Math.round(S.enemyWill), vr:S.victoryReady }); }
    var L=series[19];
    return { series:series, strength:L.strength, ratio:L.ratio, desertion:L.desert, pool:L.pool, ports:L.ports,
      recog:L.recog, foreclosed:L.foreclosed, impF:L.impF, enemyWill:L.enemyWill, victoryReady:L.vr, mom:L.mom }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    var winS, loseS, leverS, armS;
    step('CS winning run', function(){ winS=run('CS','win'); return { strength:winS.strength, ratio:winS.ratio, desertion:winS.desertion, ports:winS.ports, foreclosed:winS.foreclosed, enemyWill:winS.enemyWill, victoryReady:winS.victoryReady, mom:winS.mom }; });
    step('CS losing run', function(){ loseS=run('CS','lose'); return { strength:loseS.strength, ratio:loseS.ratio, desertion:loseS.desertion, ports:loseS.ports, foreclosed:loseS.foreclosed, enemyWill:loseS.enemyWill, mom:loseS.mom }; });
    step('CS losing + counter-levers', function(){ leverS=run('CS','lose',{runnerInvestment:true,fortifyPorts:true,pursueRecognition:true}); return { impF:leverS.impF, ports:leverS.ports, foreclosed:leverS.foreclosed }; });
    step('CS losing + arm the enslaved', function(){ armS=run('CS','lose',{armEnslaved:true}); return { pool:armS.pool, ratio:armS.ratio }; });

    step('WINNING South ESCAPES the death spiral', function(){
      if (winS.strength < 72) throw new Error('winning strength should hold, got '+winS.strength);
      if (winS.desertion > 60) throw new Error('winning desertion should be low (winning -> no desertion), got '+winS.desertion);
      if (winS.ratio < 0.6) throw new Error('winning replacement ratio should stay high, got '+winS.ratio);
      if (winS.ports < 1) throw new Error('winning South should hold its ports, got '+winS.ports);
      if (winS.foreclosed) throw new Error('winning South should keep the recognition window OPEN');
      return { strength:winS.strength, desertion:winS.desertion, ratio:winS.ratio, ports:winS.ports }; });

    step('LOSING South still COLLAPSES (history as default)', function(){
      if (loseS.strength > 58) throw new Error('losing strength should collapse, got '+loseS.strength);
      if (loseS.ratio > 0.45) throw new Error('losing replacement ratio should fall, got '+loseS.ratio);
      if (loseS.ports !== 0) throw new Error('losing South loses its ports by 1865, got '+loseS.ports);
      if (!loseS.foreclosed) throw new Error('losing South recognition should foreclose');
      return { strength:loseS.strength, ratio:loseS.ratio, ports:loseS.ports }; });

    step('the contrast: winning vs losing is dramatic', function(){
      if (!(winS.desertion + 80 < loseS.desertion)) throw new Error('winning desertion ('+winS.desertion+') should be far below losing ('+loseS.desertion+')');
      if (!(winS.strength > loseS.strength + 20)) throw new Error('winning strength should far exceed losing');
      if (!(winS.ratio > loseS.ratio + 0.2)) throw new Error('winning ratio should far exceed losing');
      return { winDes:winS.desertion, loseDes:loseS.desertion, winStr:winS.strength, loseStr:loseS.strength }; });

    step('winning BREAKS Northern will -> victory path opens', function(){
      if (!(winS.enemyWill < loseS.enemyWill - 15)) throw new Error('winning should erode enemy will far more: win='+winS.enemyWill+' lose='+loseS.enemyWill);
      if (!winS.victoryReady) throw new Error('a dominant winning South should reach a victory path');
      return { winEnemyWill:winS.enemyWill, loseEnemyWill:loseS.enemyWill, path:winS.victoryReady }; });

    step('counter-blockade levers raise the lifeline', function(){
      if (!(leverS.impF > loseS.impF)) throw new Error('runner investment should raise importFactor: lever='+leverS.impF+' base='+loseS.impF);
      if (!(leverS.ports > loseS.ports)) throw new Error('fortified ports should stay open vs base '+loseS.ports);
      if (leverS.foreclosed) throw new Error('pursuing recognition should keep the window open');
      return { leverImpF:leverS.impF, baseImpF:loseS.impF, leverPorts:leverS.ports }; });

    step('arm-the-enslaved surges the manpool + replacement', function(){
      if (!(armS.pool > loseS.pool + 300)) throw new Error('arming the enslaved should add a large pool: armed='+armS.pool+' base='+loseS.pool);
      if (!(armS.ratio > loseS.ratio)) throw new Error('arming should raise the replacement ratio');
      return { armedPool:armS.pool, basePool:loseS.pool, armedRatio:armS.ratio }; });

    step('Paths-to-Victory tab renders (CS levers + US mirror + Trent wild card)', function(){
      G.campaign=mkC('CS'); _t1InitAll(G.campaign); var C=G.campaign;
      C.president.date={year:1864,month:6};
      openWarDept(); window._wdTab='victory'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if (h.indexOf('Break Northern Will')<0) throw new Error('no Break Northern Will path');
      if (h.indexOf('blockade-runners')<0) throw new Error('no runner-investment lever');
      if (h.indexOf('Arm')<0) throw new Error('no arm-the-enslaved lever');
      // early-war CS shows the Trent wild card
      G.campaign=mkC('CS'); _t1InitAll(G.campaign); var C2=G.campaign; C2.stats.battles++; _t1Resolve('CS','win',{playerSide:'CS',enemySide:'US',bd:{name:'x',year:1861},casualties:{CS:800,US:2000},infl:{},units:[]},C2,true);
      openWarDept(); window._wdTab='victory'; _wdRefresh(); var h1=document.getElementById('wdContent').innerHTML;
      var trent = h1.indexOf('Trent')>=0;
      // US mirror
      G.campaign=mkC('US'); _t1InitAll(G.campaign); openWarDept(); window._wdTab='victory'; _wdRefresh();
      var hu=document.getElementById('wdContent').innerHTML;
      if (hu.indexOf('How the Union wins')<0) throw new Error('no US victory paths');
      return { csLen:h.length, trentEarly:trent, usLen:hu.length }; });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  R.winS=winS; R.loseS=loseS;
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
    const shoot = async (side, file) => {
      await page.evaluate((s) => { G.campaign={side:s,iron:false,idx:0,funds:s==='CS'?3000:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
        var C=G.campaign; _t1InitAll(C); var e=(s==='US')?'CS':'US';
        for(var t=0;t<7;t++){ C.stats.battles++; C.stats.won++; var c={};c[s]=900;c[e]=2200;
          _t1Resolve(s,(t%2?'win':'decisive'),{playerSide:s,enemySide:e,bd:{name:'x',year:1861+Math.floor(t/3)},casualties:c,infl:{},units:[]},C,true); }
        C.president.date={year:1864,month:6}; openWarDept(); window._wdTab='victory'; _wdRefresh(); }, side);
      await sleep(250); await page.screenshot({ path: join(OUT, file), fullPage:false });
    };
    await shoot('CS', 'paths-cs.png');
    await shoot('US', 'paths-us.png');
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-victory.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-victory ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
