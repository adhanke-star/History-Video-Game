#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/t1probe.mjs — functional gate for the §24 War Department (1864 Clock / Muster Roll / War Room).
// Boots the real game in Chrome, builds a realistic campaign, ticks _t1Resolve across several
// battles (incl. a 1864 election trigger + a fallen regiment + an unnamed auto-fill veteran),
// opens openWarDept(), exercises each tab + a build/spend action, and writes:
//   tools/shots/t1probe.json   (structured result — read this)
//   tools/shots/t1-clock.png  t1-muster.png  t1-warroom.png   (visual)
// All output goes to disk (project dir), so it is robust to stdout-capture failures.

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
  try {
    if (typeof G === 'undefined') return JSON.stringify({ok:false, fatal:'G undefined'});
    // ---- a realistic campaign (matches G.campaign shape) ----
    G.mode = 'menu';
    G.campaign = { side:'US', iron:false, idx:0, funds:300, recovery:false, completed:[],
      roster:[ {id:'R1',type:'inf',weapon:'springfield',xp:1,name:null},
               {id:'R2',type:'art',weapon:'napoleon',xp:0,name:'Washington Artillery'} ],
      nextId:3, stats:{battles:0,won:0,infl:0,suff:0}, recoveryLossCount:0,
      recoveryMode:false, flipAtk:false, captured:[] };
    var C = G.campaign;
    step('exports present', function(){
      ['clkInit','clkOnResolve','clkRenderHTML','clkWire','mrInit','mrOnResolve','mrRenderHTML','mrWire',
       'wrInit','wrOnResolve','wrRenderHTML','wrWire','_t1InitAll','_t1Resolve','openWarDept','_wdRefresh']
        .forEach(function(n){ if (typeof window[n] !== 'function') throw new Error('missing '+n); });
      return 'all 16 present';
    });
    step('_t1InitAll', function(){ _t1InitAll(C); return {clock:!!C.clock, muster:!!C.muster, warroom:!!C.warroom}; });
    // S0 President's-Desk state must be initialised as a sibling of clock/muster/warroom.
    step('president init (S0)', function(){
      if(!C.president) throw new Error('C.president missing after _t1InitAll');
      if(C.president.cabinet.length!==4) throw new Error('cabinet size '+C.president.cabinet.length);
      return { year:C.president.date.year, month:C.president.date.month,
        cabinetN:C.president.cabinet.length, sec1:C.president.cabinet[0].name,
        head:C.president.head.name, turn:C.president.turn }; });
    // build some economy so War Room output is non-trivial
    step('build nodes', function(){ C.warroom.nodes.industry=2; C.warroom.nodes.rail=1; C.warroom.nodes.provisions=1; return C.warroom.nodes; });
    function fakeB(name, year, cas, units){
      return { playerSide:'US', enemySide:'CS', bd:{id:'x',name:name,year:year},
        casualties:{US:cas, CS:1200}, infl:{US:200, CS:80}, units:units }; }
    // battle 1 (win, 1862): R1 survives (engine stamped generic name '3rd Infantry'),
    // R2 falls, R5 is a new unnamed auto-fill veteran.
    step('resolve b1 (win 1862)', function(){
      C.stats.battles++; C.stats.won++;
      _t1Resolve('US','win', fakeB('Antietam',1862,2500,[
        {side:'US',alive:true,type:'inf',vetId:'R1',vetName:null,name:'3rd Infantry',kills:2},
        {side:'US',alive:false,type:'art',vetId:'R2',vetName:'Washington Artillery',name:'Washington Artillery',kills:1},
        {side:'US',alive:true,type:'cav',vetId:'R5',vetName:null,name:'5th Cavalry',kills:0},
        {side:'CS',alive:false,type:'inf',vetId:null,name:'enemy',kills:0} ]), C, true);
      return { clockYear:C.clock.year, weariness:C.clock.weariness, capital:C.clock.capital,
        funds:C.funds, supply:C.warroom.supply,
        r1name:(C.muster.rolls.R1||{}).name, r1kills:(C.muster.rolls.R1||{}).kills,
        r2status:(C.muster.rolls.R2||{}).status, fallen:C.muster.fallen.length,
        r5name:(C.muster.rolls.R5||{}).name };
    });
    // battle 2 (loss, 1863): R1 gains more kills (per-battle, must accumulate)
    step('resolve b2 (loss 1863)', function(){
      C.stats.battles++;
      _t1Resolve('CS','loss', fakeB('Chickamauga',1863,5000,[
        {side:'US',alive:true,type:'inf',vetId:'R1',vetName:null,name:'3rd Infantry',kills:1} ]), C, false);
      return { r1kills:(C.muster.rolls.R1||{}).name + ' k=' + (C.muster.rolls.R1||{}).kills,
        weariness:C.clock.weariness };
    });
    // battle 3 (win, 1864): triggers the 1864 referendum
    step('resolve b3 (win 1864 → election)', function(){
      C.stats.battles++; C.stats.won++;
      _t1Resolve('US','decisive', fakeB('Cedar Creek',1864,1500,[
        {side:'US',alive:true,type:'inf',vetId:'R1',vetName:null,name:'3rd Infantry',kills:0} ]), C, true);
      return { resolved1864:C.clock.resolved1864, elected:C.clock.elected, year:C.clock.year };
    });
    // S0 strategic-turn loop: presOnResolve must have advanced the date + logged each battle.
    step('president after 3 turns (S0)', function(){
      if(C.president.turn!==3) throw new Error('expected turn 3, got '+C.president.turn);
      if(C.president.date.year!==1864) throw new Error('date.year should track clock 1864, got '+C.president.date.year);
      if(C.president.log.length<1) throw new Error('president log empty');
      return { turn:C.president.turn, year:C.president.date.year, month:C.president.date.month,
        logLen:C.president.log.length, lastDispatch:C.president.log[0],
        choices:C.president.pendingChoices.length }; });
    step('open War Department', function(){ openWarDept(); var ov=document.getElementById('overlay');
      return { overlayShown: ov && !ov.classList.contains('hidden') }; });
    step('clock tab renders', function(){ _wdTab='clock'; _wdRefresh();
      var c=document.getElementById('wdContent'); return { len:(c?c.innerHTML.length:0), hasBond: !!document.getElementById('clkBond') }; });
    step('muster tab renders', function(){ _wdTab='muster'; _wdRefresh();
      var c=document.getElementById('wdContent'); return { len:(c?c.innerHTML.length:0), txt:(c?c.textContent.slice(0,120):'') }; });
    step('warroom tab renders', function(){ _wdTab='warroom'; _wdRefresh();
      var c=document.getElementById('wdContent'); return { len:(c?c.innerHTML.length:0), hasBuild: !!document.getElementById('wrBuild_industry') }; });
    step('war-room build click (spend funds)', function(){ var before=C.funds; var b=document.getElementById('wrBuild_industry');
      if(!b) throw new Error('no build button'); b.click(); return { fundsBefore:before, fundsAfter:C.funds, industryLv:C.warroom.nodes.industry }; });
    step('clock bond click (after refresh)', function(){ _wdTab='clock'; _wdRefresh(); var b=document.getElementById('clkBond');
      var capBefore=C.clock.capital, fundsBefore=C.funds; if(b) b.click();
      return { capBefore:capBefore, capAfter:C.clock.capital, fundsBefore:fundsBefore, fundsAfter:C.funds }; });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<50;i++){ if(await up(probe))break; await sleep(120); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const consoleErrs = [];
  page.on('pageerror', e => consoleErrs.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'load', timeout:60000 });
    await sleep(400);
    const raw = await page.evaluate(SETUP);
    result = JSON.parse(raw);
    result.pageerrors = consoleErrs;
    // screenshots per tab
    for (const tab of ['clock','muster','warroom']) {
      await page.evaluate(t => { window._wdTab = t; if (typeof _wdRefresh==='function') _wdRefresh(); }, tab);
      await sleep(300);
      await page.screenshot({ path: join(OUT, `t1-${tab}.png`), fullPage:false });
    }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors:consoleErrs }; }
  finally {
    writeFileSync(join(OUT,'t1probe.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
})();
