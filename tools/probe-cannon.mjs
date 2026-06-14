#!/usr/bin/env node
// tools/probe-cannon.mjs — A1 The Cannon Corps: raise artillery batteries with money,
// feeding the battle bridge. Verifies the corps starts near-empty, buying batteries spends
// funds, raising batteries + better guns raises the artillery score, coverage scales it,
// year + side(import premium) gates hold, bridgeArmy gains an `artillery` facet and the
// Cannon Corps adds punch to overall, and the section renders inside The Armory tab.
// Reads the live GAME_DATA.artillery catalog so it is robust to the data values.
// Writes shots/probe-cannon.json + cannon.png.
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
  function mkC(side, year, funds){ var C={ side:side, iron:false, idx:0, funds:(funds||60000), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(year){ C.clock.year=year; C.president.date={year:year,month:1}; } return C; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    var D = (typeof GAME_DATA!=='undefined' && GAME_DATA && GAME_DATA.artillery) ? GAME_DATA.artillery : null;
    if (!D || !D.guns || !D.guns.length) return JSON.stringify({ok:false,fatal:'GAME_DATA.artillery missing/empty'});
    var guns = D.guns;
    // pick representative guns from the live catalog
    var cheap = null;                 // a common, available-1861, both-sides gun (the Napoleon)
    for (var i=0;i<guns.length;i++){ var g=guns[i]; if (!g.csOnly && !g.usOnly && (!g.year||g.year<=1861) && (g.rarity==='common'||cheap===null)) { if(cheap===null||g.rarity==='common'){cheap=g;} } }
    if(!cheap) cheap=guns[0];
    var best = guns[0]; for (var j=1;j<guns.length;j++){ if ((guns[j].quality||0) > (best.quality||0)) best=guns[j]; }
    var importer = null; for (var k=0;k<guns.length;k++){ if (guns[k].csImport){ importer=guns[k]; break; } }
    var gated = null; for (var m=0;m<guns.length;m++){ if (guns[m].year && guns[m].year>1861){ gated=guns[m]; break; } }
    R.picks = { cheap:cheap.id, best:best.id, importer:importer?importer.id:null, gated:gated?gated.id:null };

    step('empty corps scores near the baseline', function(){ var C=mkC('US',1863,60000); var s=artBatteryScore(C);
      if (s > Math.max(20, D.baselineArtilleryScore+6)) throw new Error('an empty park should be near baseline, got '+s);
      return { baseline:D.baselineArtilleryScore, score:s }; });

    step('raising a battery SPENDS money', function(){ var C=mkC('US',1863,60000); var f0=C.funds;
      var r=artBuy(C, cheap.id, 1); if(!r.ok) throw new Error('buy failed: '+r.reason);
      if (!(C.funds < f0)) throw new Error('funds should drop after raising a battery');
      if (C.artillery.batteries[cheap.id]!==1) throw new Error('should own 1 battery, got '+C.artillery.batteries[cheap.id]);
      return { before:f0, after:C.funds, spent:f0-C.funds }; });

    step('more batteries RAISE the artillery score (coverage)', function(){ var C=mkC('US',1863,300000);
      var s0=artBatteryScore(C); artBuy(C, cheap.id, 1); var s1=artBatteryScore(C);
      artBuy(C, cheap.id, 3); artBuy(C, cheap.id, 3); var s2=artBatteryScore(C);
      if (!(s1>s0)) throw new Error('one battery should beat empty: '+s0+'->'+s1);
      if (!(s2>s1)) throw new Error('a fuller park should beat one battery: '+s1+'->'+s2);
      return { empty:s0, one:s1, seven:s2 }; });

    step('BETTER guns score higher than common ones', function(){
      var Ca=mkC('US',1864,400000); for(var a=0;a<D.fullComplementBatteries;a++) artBuy(Ca, cheap.id, 1); var sCheap=artBatteryScore(Ca);
      var Cb=mkC('US',1864,400000); var got=0; for(var b=0;b<D.fullComplementBatteries;b++){ var rr=artBuy(Cb, best.id, 1); if(rr.ok) got++; } var sBest=artBatteryScore(Cb);
      if (got<1) throw new Error('could not buy the best gun ('+best.id+')');
      if (!(sBest >= sCheap)) throw new Error('a full park of the best gun ('+best.quality+') should score >= the common gun ('+cheap.quality+'): '+sCheap+' vs '+sBest);
      return { cheapFull:sCheap, bestFull:sBest, cheapQ:cheap.quality, bestQ:best.quality }; });

    step('YEAR gate holds (a later gun is unavailable early)', function(){
      if (!gated) return { skipped:'no year-gated gun in catalog' };
      var C=mkC('US',1861,400000); var r=artBuy(C, gated.id, 1);
      if (r.ok) throw new Error(gated.id+' should be unavailable in 1861 (year '+gated.year+')');
      return { gated:gated.id, year:gated.year, reason:r.reason }; });

    step('SIDE gate + import premium: CS pays more for imported guns', function(){
      if (!importer) return { skipped:'no csImport gun in catalog' };
      var yr = importer.year||1862;
      var Ccs=mkC('CS',yr,400000); var f0=Ccs.funds; var rc=artBuy(Ccs, importer.id, 1); var csCost=f0-Ccs.funds;
      var Cus=mkC('US',yr,400000); var g0=Cus.funds; var ru=artBuy(Cus, importer.id, 1); var usCost=g0-Cus.funds;
      if(!rc.ok) throw new Error('CS import buy failed: '+rc.reason);
      if(!ru.ok && !importer.csOnly) throw new Error('US import buy failed: '+ru.reason);
      if (ru.ok && !(csCost > usCost)) throw new Error('CS should pay an import premium: CS='+csCost+' US='+usCost);
      return { importer:importer.id, csCost:csCost, usCost:usCost }; });

    step('bridge gains an ARTILLERY facet; the corps adds punch to overall', function(){ var C=mkC('US',1864,400000);
      var a0=bridgeArmy(C); if (typeof a0.artillery!=='number') throw new Error('bridgeArmy has no artillery facet');
      var o0=a0.overall;
      for(var a=0;a<D.fullComplementBatteries;a++) artBuy(C, cheap.id, 1);
      var a1=bridgeArmy(C);
      if (!(a1.artillery > a0.artillery + 20)) throw new Error('a full park should lift the artillery facet: '+a0.artillery+'->'+a1.artillery);
      if (!(a1.overall > o0)) throw new Error('the Cannon Corps should add punch to overall: '+o0+'->'+a1.overall);
      return { artBefore:a0.artillery, artAfter:a1.artillery, overallBefore:o0, overallAfter:a1.overall }; });

    step('the Cannon Corps section renders inside The Armory tab', function(){ mkC('US',1863,60000);
      openWarDept(); window._wdTab='armory'; _wdRefresh(); var h=document.getElementById('wdContent').innerHTML;
      if (h.indexOf('The Armory')<0) throw new Error('Armory header missing');
      if (h.indexOf('The Cannon Corps')<0) throw new Error('Cannon Corps section missing');
      if (h.indexOf('Raise a battery')<0) throw new Error('no raise-a-battery button');
      if (h.indexOf(cheap.name)<0) throw new Error('catalog gun '+cheap.name+' not shown');
      return { len:h.length }; });

    step('CS fields a WEAKER artillery arm than the US for identical batteries (the 4-vs-6 handicap bites)', function(){
      var yr=1863, nbuy=6;
      var Cus=mkC('US',yr,400000), Ccs=mkC('CS',yr,400000);
      for(var i=0;i<nbuy;i++){ artBuy(Cus, cheap.id, 1); artBuy(Ccs, cheap.id, 1); }
      var sUS=artBatteryScore(Cus), sCS=artBatteryScore(Ccs);
      if(!(sUS>sCS)) throw new Error('US should out-gun CS for identical batteries: US='+sUS+' CS='+sCS);
      // and the CS still fields a real arm (accessible default — not crushed to baseline)
      if(sCS <= D.baselineArtilleryScore) throw new Error('CS artillery collapsed to baseline: '+sCS);
      return { gun:cheap.id, batteries:nbuy, usScore:sUS, csScore:sCS }; });
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
    await page.evaluate(() => { G.campaign={side:'US',iron:false,idx:0,funds:200000,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); C.clock.year=1864; C.president.date={year:1864,month:1};
      var guns=GAME_DATA.artillery.guns; var n=Math.min(4,guns.length);
      for(var i=0;i<n;i++){ artBuy(C, guns[i].id, i===0?3:1); }
      openWarDept(); window._wdTab='armory'; _wdRefresh(); });
    await sleep(250); await page.screenshot({ path: join(OUT,'cannon.png'), fullPage:false });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-cannon.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-cannon ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
