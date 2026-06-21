#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-production.mjs — S1b war-production gate + FULL integration regression.
// Runs the real _t1Resolve (clk+econ+wr+mr+pres+prod, all six ticks) over 12 turns
// for each side and verifies the production asymmetry: the Union stays well-found
// (rail intact, equip high) while the Confederacy's railroads decay and its armies
// grow ragged. Writes tools/shots/probe-production.json + wareffort-us/cs.png.
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
  function run(side){ G.campaign=mkC(side); var C=G.campaign; _t1InitAll(C);
    var rail=[],equip=[]; for(var t=0;t<12;t++){ C.stats.battles++; _t1Resolve(side, t%3===0?'win':'draw', fakeB(side,1861+Math.floor(t/4)), C, t%3===0);
      rail.push(Math.round(C.production.railIntegrity)); equip.push(C.production.equipIndex); }
    return { rail:rail, equip:equip, finalRail:Math.round(C.production.railIntegrity), finalEquip:C.production.equipIndex,
      lastArms:C.production.lastTurn.arms, foodDist:Math.round(C.production.foodDist*100), inflation:Math.round(C.economy.inflation*10)/10 }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    var us, cs;
    step('US full 12-turn integration', function(){ us=run('US'); return us; });
    step('CS full 12-turn integration', function(){ cs=run('CS'); return cs; });
    step('PRODUCTION ASYMMETRY', function(){
      if (us.finalRail < 90) throw new Error('US rail should stay intact, got '+us.finalRail);
      if (us.finalEquip < 80) throw new Error('US equip should stay high, got '+us.finalEquip);
      if (cs.finalRail > 60) throw new Error('CS rail should decay below 60, got '+cs.finalRail);
      if (cs.rail[11] >= cs.rail[0]) throw new Error('CS rail not decaying');
      if (cs.finalEquip >= us.finalEquip) throw new Error('CS equip should fall below US: CS='+cs.finalEquip+' US='+us.finalEquip);
      if (cs.lastArms >= us.lastArms) throw new Error('CS arms should be throttled below US');
      return { usRail:us.finalRail, csRail:cs.finalRail, usEquip:us.finalEquip, csEquip:cs.finalEquip,
        usArms:us.lastArms, csArms:cs.lastArms, csFood:cs.foodDist, csInflation:cs.inflation }; });
    step('War Effort overview shows production', function(){ G.campaign=mkC('CS'); _t1InitAll(G.campaign);
      var C=G.campaign; for(var t=0;t<8;t++){ C.stats.battles++; _t1Resolve('CS','draw',fakeB('CS',1862),C,false); }
      openWarDept(); window._wdTab='economy'; _wdRefresh(); var h=document.getElementById('wdContent').innerHTML;
      if (h.indexOf('War Production')<0) throw new Error('no War Production block');
      if (h.indexOf('Railroad integrity')<0) throw new Error('no rail integrity meter');
      return { len:h.length }; });
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
    const shoot = async (side, turns, file) => {
      await page.evaluate(([s,n]) => { G.campaign={side:s,iron:false,idx:0,funds:s==='CS'?900:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
        var C=G.campaign; _t1InitAll(C); var e=(s==='US')?'CS':'US';
        for(var t=0;t<n;t++){ C.stats.battles++; var c={};c[s]=1500;c[e]=1800;var inf={};inf[s]=120;inf[e]=90;
          _t1Resolve(s,'draw',{playerSide:s,enemySide:e,bd:{id:'x',name:'Engagement',year:1863},casualties:c,infl:inf,units:[]},C,false); }
        openWarDept(); window._wdTab='economy'; _wdRefresh(); }, [side, turns]);
      await sleep(250); await page.screenshot({ path: join(OUT, file), fullPage:false });
    };
    await shoot('US', 6, 'wareffort-us.png');
    await shoot('CS', 10, 'wareffort-cs.png');
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-production.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-production ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
})();
