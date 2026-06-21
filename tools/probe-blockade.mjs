#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-blockade.mjs — S1c cotton/blockade/foreign gate + integration regression.
// Runs the real _t1Resolve (clk+econ+wr+blockade+prod+mr+pres) over 16 turns per side
// and verifies the Confederate cotton/blockade traps:
//   (1) the 1861 self-embargo earns ~no cotton revenue (King-Cotton trap),
//   (2) the blockade importFactor declines as the war drags (and gates CS arms in prod),
//   (3) foreign recognition is foreclosed after Antietam+Emancipation (1863+),
//   (4) the Union side earns no cotton + keeps full imports.
// Writes tools/shots/probe-blockade.json + diplomacy-cs.png / diplomacy-us.png.
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
  function run(side, depth){ G.campaign=mkC(side); var C=G.campaign; _t1InitAll(C); if(depth) C.blockade.depth=depth;
    var series=[]; for(var t=0;t<16;t++){ C.stats.battles++; var winFlag=(t%3===0);
      _t1Resolve(side, winFlag?'win':'draw', fakeB(side,1861+Math.floor(t/4)), C, winFlag);
      var bl=C.blockade, lt=bl.lastTurn||{};
      series.push({ t:t, year:lt.year, revenue:lt.revenue, importFactor:bl.importFactor,
        recognition:Math.round(bl.recognition), foreclosed:bl.recognitionForeclosed,
        intervention:Math.round(C.clock.intervention), arms:C.production.lastTurn?C.production.lastTurn.arms:null,
        ports:bl.portsOpen, cottonRev:bl.cottonRevenueTotal }); }
    return { series:series, finalImportF:Math.round(C.blockade.importFactor*100)/100,
      cottonRevenueTotal:C.blockade.cottonRevenueTotal, foreclosed:C.blockade.recognitionForeclosed,
      finalRecognition:Math.round(C.blockade.recognition), finalIntervention:Math.round(C.clock.intervention),
      finalArms:C.production.lastTurn?C.production.lastTurn.arms:null }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    var cs, us, csOff;
    step('CS 16-turn (embargo default ON, full blockade)', function(){ cs=run('CS'); return { finalImportF:cs.finalImportF, cottonRev:cs.cottonRevenueTotal, foreclosed:cs.foreclosed, finalIntervention:cs.finalIntervention }; });
    step('US 16-turn', function(){ us=run('US'); return { finalImportF:us.finalImportF, cottonRev:us.cottonRevenueTotal }; });
    step('CS 16-turn (blockade OFF — sandbox)', function(){ csOff=run('CS','off'); return { finalImportF:csOff.finalImportF, finalArms:csOff.finalArms }; });

    step('TRAP: 1861 embargo earns ~no cotton revenue', function(){
      var t0=cs.series[0];
      if (t0.year!==1861) throw new Error('turn-0 year should be 1861, got '+t0.year);
      if (t0.revenue>10) throw new Error('embargo turn should earn ~0, got '+t0.revenue);
      return { t0Revenue:t0.revenue }; });

    step('embargo auto-lifts by 1862 → revenue flows', function(){
      var t5=cs.series[5];
      if (t5.year!==1862) throw new Error('turn-5 should be 1862, got '+t5.year);
      if (t5.revenue<=0) throw new Error('post-embargo revenue should be >0, got '+t5.revenue);
      return { t5Revenue:t5.revenue, t5Year:t5.year }; });

    step('importFactor DECLINES as blockade tightens', function(){
      var early=cs.series[0].importFactor, late=cs.series[15].importFactor;
      if (!(late < early)) throw new Error('importFactor should fall: early='+early+' late='+late);
      if (cs.finalImportF >= 0.6) throw new Error('1864 importFactor should be well below 0.6, got '+cs.finalImportF);
      return { early:Math.round(early*100)/100, late:cs.finalImportF }; });

    step('recognition FORECLOSED after 1862 (Antietam/Emancipation)', function(){
      if (!cs.foreclosed) throw new Error('recognition should be foreclosed by end');
      if (cs.finalRecognition > 10) throw new Error('foreclosed recognition should be low, got '+cs.finalRecognition);
      // King Cotton failed to buy intervention — should not have run away high
      if (cs.finalIntervention > 50) throw new Error('cotton diplomacy should not yield high intervention, got '+cs.finalIntervention);
      return { foreclosed:cs.foreclosed, finalRecognition:cs.finalRecognition, finalIntervention:cs.finalIntervention }; });

    step('US: no cotton revenue, full imports', function(){
      if (us.cottonRevenueTotal!==0) throw new Error('US should earn 0 cotton revenue, got '+us.cottonRevenueTotal);
      if (us.finalImportF!==1) throw new Error('US importFactor should be 1.0, got '+us.finalImportF);
      return { ok:true }; });

    step('PROD WIRING: blockade gates CS arms (off > full late-war)', function(){
      var fullArms=cs.finalArms, offArms=csOff.finalArms;
      if (!(offArms > fullArms)) throw new Error('blockade-off CS arms should exceed full-blockade: off='+offArms+' full='+fullArms);
      return { fullArms:fullArms, offArms:offArms }; });

    step('Diplomacy tab renders (CS King Cotton + US Anaconda)', function(){
      G.campaign=mkC('CS'); _t1InitAll(G.campaign); var C=G.campaign;
      for(var t=0;t<6;t++){ C.stats.battles++; _t1Resolve('CS','draw',fakeB('CS',1863),C,false); }
      openWarDept(); window._wdTab='diplomacy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if (h.indexOf('King Cotton')<0) throw new Error('no King Cotton panel for CS');
      if (h.indexOf('Blockade')<0 && h.indexOf('blockade')<0) throw new Error('no blockade content');
      G.campaign=mkC('US'); _t1InitAll(G.campaign); openWarDept(); window._wdTab='diplomacy'; _wdRefresh();
      var hu=document.getElementById('wdContent').innerHTML;
      if (hu.indexOf('Anaconda')<0) throw new Error('no Anaconda panel for US');
      return { csLen:h.length, usLen:hu.length }; });

    step('teaching card surfaces (research content injected)', function(){
      G.campaign=mkC('CS'); _t1InitAll(G.campaign);
      var why=_blkWhyText(G.campaign);
      if (!why || why.length<200) throw new Error('why text too short: '+(why?why.length:0));
      if (why.indexOf('Owsley')<0 && why.indexOf('Surdam')<0 && why.indexOf('Consensus')<0) throw new Error('no scholarly multi-voice content in why text');
      var card=_blkCard('cotton-erlanger');
      if (!card || !card.dissent) throw new Error('GAME_DATA.diplomacy cards not loaded');
      return { whyLen:why.length, hasErlanger:!!card }; });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  R.cs=cs; R.us=us;
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
    const shoot = async (side, turns, year, file) => {
      await page.evaluate(([s,n,y]) => { G.campaign={side:s,iron:false,idx:0,funds:s==='CS'?900:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
        var C=G.campaign; _t1InitAll(C); var e=(s==='US')?'CS':'US';
        for(var t=0;t<n;t++){ C.stats.battles++; var c={};c[s]=1500;c[e]=1800;var inf={};inf[s]=120;inf[e]=90;
          _t1Resolve(s,'draw',{playerSide:s,enemySide:e,bd:{id:'x',name:'Engagement',year:y},casualties:c,infl:inf,units:[]},C,false); }
        openWarDept(); window._wdTab='diplomacy'; _wdRefresh(); }, [side, turns, year]);
      await sleep(250); await page.screenshot({ path: join(OUT, file), fullPage:false });
    };
    await shoot('CS', 10, 1864, 'diplomacy-cs.png');
    await shoot('US', 6, 1863, 'diplomacy-us.png');
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-blockade.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-blockade ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
