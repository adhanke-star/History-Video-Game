#!/usr/bin/env node
// tools/probe-weapons.mjs — The Armory: buy weapons with money, loot-style, feeding
// the battle bridge. Verifies procurement spends funds, better/more weapons raise the
// army weapon-score, partial vs whole-army loadout, year + side gates, the Armory tab
// renders, and bridgeArmy.firepower reflects the weapons bought. Writes shots/probe-weapons.json + armory.png.
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
  function mkC(side, year, funds){ var C={ side:side, iron:false, idx:0, funds:(funds||5000), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(year){ C.clock.year=year; C.president.date={year:year,month:1}; } return C; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    step('baseline army carries muskets (~30)', function(){ var C=mkC('CS',1863,5000); var s=armoryWeaponScore(C);
      if (s>40) throw new Error('baseline should be ~musket quality, got '+s); return { baseline:s }; });

    step('buying weapons SPENDS money', function(){ var C=mkC('CS',1863,5000); var f0=C.funds;
      var r=armoryBuy(C,'springfield','all'); if(!r.ok) throw new Error('buy failed: '+r.reason);
      if (!(C.funds < f0)) throw new Error('funds should drop after buying');
      return { before:f0, after:C.funds, spent:f0-C.funds }; });

    step('better weapons RAISE army firepower', function(){ var C=mkC('CS',1863,9000); var s0=armoryWeaponScore(C);
      armoryBuy(C,'springfield','all'); var s1=armoryWeaponScore(C);
      armoryBuy(C,'spencer','all'); var s2=armoryWeaponScore(C);
      if (!(s1>s0+20)) throw new Error('springfield should raise score: '+s0+'->'+s1);
      if (!(s2>s1)) throw new Error('spencer (legendary) should beat springfield: '+s1+'->'+s2);
      if (s2<85) throw new Error('a Spencer-armed line should be devastating, got '+s2);
      return { musket:s0, springfield:s1, spencer:s2 }; });

    step('PARTIAL arming: best brigades get repeaters, rest muskets', function(){ var C=mkC('CS',1863,9000);
      armoryBuy(C,'spencer','batch');   // 10% Spencers
      armoryBuy(C,'springfield','batch'); // 10% Springfields
      var total=0; for(var k in C.armory.loadout) total+=C.armory.loadout[k];
      if (Math.abs(total-0.2)>0.001) throw new Error('two batches should arm 20%, got '+Math.round(total*100)+'%');
      var s=armoryWeaponScore(C); // mix above musket baseline but below all-repeater
      if (!(s>30 && s<60)) throw new Error('a mostly-musket army with elite fractions should be mid, got '+s);
      return { issuedPct:Math.round(total*100), score:s }; });

    step('YEAR gate: Spencer unavailable in 1861', function(){ var C=mkC('CS',1861,9000);
      var r=armoryBuy(C,'spencer','batch'); if (r.ok) throw new Error('Spencer should be unavailable in 1861');
      var r2=armoryBuy(C,'springfield','batch'); if (!r2.ok) throw new Error('Springfield should be available in 1861');
      return { spencer1861:r.reason }; });

    step('SIDE gate + price: CS pays import premium; US cannot buy Richmond', function(){
      var Ccs=mkC('CS',1863,9000); var Cus=mkC('US',1863,9000);
      var f0=Ccs.funds; armoryBuy(Ccs,'enfield','batch'); var csCost=f0-Ccs.funds;
      var g0=Cus.funds; armoryBuy(Cus,'enfield','batch'); var usCost=g0-Cus.funds;
      if (!(csCost > usCost)) throw new Error('CS should pay more for imported Enfields: CS='+csCost+' US='+usCost);
      var rr=armoryBuy(Cus,'richmond','batch'); if (rr.ok) throw new Error('US should not buy Confederate Richmond rifles');
      return { csEnfield:csCost, usEnfield:usCost }; });

    step('bridge FIREPOWER reflects the weapons bought', function(){ var C=mkC('US',1863,9000);
      var fp0=bridgeArmy(C).firepower; armoryBuy(C,'spencer','all'); var fp1=bridgeArmy(C).firepower;
      if (!(fp1>fp0+30)) throw new Error('arming Spencers should lift bridge firepower: '+fp0+'->'+fp1);
      if (fp1!==armoryWeaponScore(C)) throw new Error('bridge firepower should equal the weapon score');
      return { before:fp0, after:fp1 }; });

    step('The Armory tab renders (catalog + rarity + buy)', function(){ mkC('CS',1863,9000);
      openWarDept(); window._wdTab='armory'; _wdRefresh(); var h=document.getElementById('wdContent').innerHTML;
      if (h.indexOf('The Armory')<0) throw new Error('no Armory header');
      if (h.indexOf('Spencer Repeater')<0) throw new Error('no Spencer in catalog');
      if (h.indexOf('legendary')<0) throw new Error('no rarity tiers');
      if (h.indexOf('Arm the line')<0) throw new Error('no buy buttons');
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
    await page.evaluate(() => { G.campaign={side:'US',iron:false,idx:0,funds:9000,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); C.clock.year=1863; C.president.date={year:1863,month:1};
      armoryBuy(C,'spencer','batch'); armoryBuy(C,'sharps','batch'); armoryBuy(C,'springfield','batch'); armoryBuy(C,'springfield','batch');
      openWarDept(); window._wdTab='armory'; _wdRefresh(); });
    await sleep(250); await page.screenshot({ path: join(OUT,'armory.png'), fullPage:false });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-weapons.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-weapons ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
