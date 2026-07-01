#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-manpower.mjs — S1d manpower/conscription gate + integration regression.
// Runs the real _t1Resolve (clk+econ+wr+blockade+prod+manpower+mr+pres) over 20 turns
// per side and verifies the decisive demographic asymmetry: the Union refills its
// armies (strength holds, deep pool, USCT unlocks) while the Confederate replacement
// ratio collapses 0.9->0.1 and its armies melt away. Writes shots/probe-manpower.json
// + wareffort-manpower-us/cs.png.
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
  function mkC(side){ return { side:side, iron:false, idx:0, funds:(side==='CS'?900:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; }
  function fakeB(side, year){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=1500; c[e]=1800; var inf={}; inf[side]=120; inf[e]=90;
    return { playerSide:side, enemySide:e, bd:{id:'x',name:'Engagement',year:year}, casualties:c, infl:inf, units:[] }; }
  // Drive a LOSING South (the historical-default trajectory): the collapse is now
  // PERFORMANCE-driven (S1e), so the doom only befalls a Confederacy that is losing.
  // (probe-victory.mjs proves a WINNING South escapes it.)
  function run(side){ G.campaign=mkC(side); var C=G.campaign; _t1InitAll(C);
    var series=[]; for(var t=0;t<20;t++){ C.stats.battles++;
      _t1Resolve(side, 'loss', fakeB(side,1861+Math.floor(t/4)), C, false);
      var P=C.manpower, lt=P.lastTurn||{};
      series.push({ t:t, year:lt.year, strength:Math.round(P.strength), pool:Math.round(P.pool),
        ratio:P.replacementRatio, recruits:lt.recruits, draft:P.draftActive, usct:P.usctUnlocked,
        desertion:Math.round(P.desertionTotal), enlisted:Math.round(P.enlisted) }); }
    return { series:series, finalStrength:Math.round(C.manpower.strength), finalPool:Math.round(C.manpower.pool),
      finalRatio:C.manpower.replacementRatio, usct:C.manpower.usctUnlocked, desertion:Math.round(C.manpower.desertionTotal),
      enlisted:Math.round(C.manpower.enlisted) }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    var us, cs;
    step('US 20-turn integration', function(){ us=run('US'); return { finalStrength:us.finalStrength, finalPool:us.finalPool, usct:us.usct, enlisted:us.enlisted }; });
    step('CS 20-turn integration', function(){ cs=run('CS'); return { finalStrength:cs.finalStrength, finalPool:cs.finalPool, finalRatio:cs.finalRatio, desertion:cs.desertion, enlisted:cs.enlisted }; });

    step('US replaces casualties — strength HOLDS', function(){
      if (us.finalStrength < 85) throw new Error('US strength should hold >=85, got '+us.finalStrength);
      if (us.finalPool < 1000) throw new Error('US pool should stay deep, got '+us.finalPool);
      return { strength:us.finalStrength, pool:us.finalPool }; });

    step('a LOSING CS sees its replacement ratio COLLAPSE', function(){
      var r0=cs.series[0].ratio, r19=cs.series[19].ratio;
      if (cs.series[19].year!==1865) throw new Error('turn-19 should be 1865, got '+cs.series[19].year);
      if (!(r19 < 0.32)) throw new Error('losing CS 1865 ratio should collapse (<0.32), got '+r19);
      if (!(r19 < r0 - 0.3)) throw new Error('CS ratio should fall sharply: '+r0+' -> '+r19);
      return { early:r0, late:r19 }; });

    step('a LOSING CS army MELTS — strength collapses below US', function(){
      if (cs.finalStrength >= us.finalStrength) throw new Error('CS strength should fall below US: CS='+cs.finalStrength+' US='+us.finalStrength);
      if (cs.finalStrength > 66) throw new Error('losing CS late-war strength should be low, got '+cs.finalStrength);
      if (!(cs.series[19].strength < cs.series[3].strength)) throw new Error('CS strength not declining over the war');
      return { csStrength:cs.finalStrength, usStrength:us.finalStrength }; });

    step('US-only pools: USCT unlocks, immigrants flow', function(){
      if (!us.usct) throw new Error('USCT should unlock for US by 1863');
      var unlockTurn=us.series.find(function(s){return s.usct;});
      if (!unlockTurn || unlockTurn.year<1863) throw new Error('USCT should unlock at 1863');
      if (cs.usct) throw new Error('CS should NOT have USCT');
      return { usEnlisted:us.enlisted }; });

    step('CS desertion rises late-war', function(){
      if (cs.desertion <= 0) throw new Error('CS desertion should accumulate');
      if (!(cs.series[19].desertion > cs.series[7].desertion)) throw new Error('CS desertion should rise over time');
      return { desertion:cs.desertion }; });

    step('War Effort overview shows The Ranks', function(){
      G.campaign=mkC('CS'); _t1InitAll(G.campaign); var C=G.campaign;
      for(var t=0;t<12;t++){ C.stats.battles++; _t1Resolve('CS','draw',fakeB('CS',1864),C,false); }
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if (h.indexOf('The Ranks')<0) throw new Error('no The Ranks block');
      if (h.indexOf('Army strength')<0) throw new Error('no army strength line');
      return { len:h.length }; });

    step('teaching content surfaces (research injected)', function(){
      var why=_mpWhyText({side:'CS'});
      if (!why || why.length<600) throw new Error('CS why text too short/richness missing');
      if (why.indexOf('Consensus')<0) throw new Error('CS why text missing Consensus lane');
      if (why.indexOf('Scholarly dissent')<0) throw new Error('CS why text missing scholarly dissent lane');
      if (why.indexOf('Lost Cause claim named and countered')<0) throw new Error('CS why text missing Lost Cause counter lane');
      if (why.indexOf('Primary documents')<0) throw new Error('CS why text missing primary documents lane');
      var card=_mpCard('mp-arm-the-enslaved');
      if (!card || !card.dissent) throw new Error('GAME_DATA[manpower-teaching] cards not loaded');
      var card2=_mpCard('mp-draft-supply');
      if (!card2) throw new Error('draft-supply card missing');
      G.campaign=mkC('CS'); _t1InitAll(G.campaign);
      var block=presManpowerBlock(G.campaign);
      if (block.indexOf('mp-why-box')<0 || block.indexOf('Primary documents')<0) throw new Error('War Effort manpower block did not surface the rich debate card');
      return { whyLen:why.length, cards:true }; });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  R.us=us; R.cs=cs;
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
    await page.goto(probe, { waitUntil:'load', timeout:120000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    const shoot = async (side, turns, year, file) => {
      await page.evaluate(([s,n,y]) => { G.campaign={side:s,iron:false,idx:0,funds:s==='CS'?900:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
        var C=G.campaign; _t1InitAll(C); var e=(s==='US')?'CS':'US';
        for(var t=0;t<n;t++){ C.stats.battles++; var c={};c[s]=1500;c[e]=1800;var inf={};inf[s]=120;inf[e]=90;
          _t1Resolve(s,'draw',{playerSide:s,enemySide:e,bd:{id:'x',name:'Engagement',year:y},casualties:c,infl:inf,units:[]},C,false); }
        openWarDept(); window._wdTab='economy'; _wdRefresh(); }, [side, turns, year]);
      await sleep(250); await page.screenshot({ path: join(OUT, file), fullPage:false, timeout:120000 });
    };
    await shoot('US', 10, 1864, 'wareffort-manpower-us.png');
    await shoot('CS', 18, 1865, 'wareffort-manpower-cs.png');
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-manpower.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-manpower ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
