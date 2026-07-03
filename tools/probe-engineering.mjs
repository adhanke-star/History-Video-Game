#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-engineering.mjs — A2 The Engineering Works Corps: build engineer capability
// with money, feeding the battle bridge + slowing CS rail decay. Verifies the corps starts
// near baseline, raising a branch spends funds + lifts the level + the engineering score,
// construction raises the bridge SUPPLY facet while pontoons lower FATIGUE, the bridge gains
// an `engineering` facet that adds punch to overall, the CS pays the materials premium, a
// Construction Corps repairs rail each turn (CS rail stays higher than without), the level
// cap holds, and the section renders inside The Armory tab. Reads the live GAME_DATA.engineering.
// Writes shots/probe-engineering.json + engineering.png.
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
  function mkC(side, year, funds){ var C={ side:side, iron:false, idx:0, funds:(funds||400000), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(year){ C.clock.year=year; C.president.date={year:year,month:1}; } return C; }
  function fakeB(side, year){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=1500; c[e]=1800;
    return { playerSide:side, enemySide:e, bd:{id:'x',name:'Engagement',year:year}, casualties:c, infl:{}, units:[] }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    var D = (typeof GAME_DATA!=='undefined' && GAME_DATA && GAME_DATA.engineering) ? GAME_DATA.engineering : null;
    if (!D || !D.branches || !D.branches.length) return JSON.stringify({ok:false,fatal:'GAME_DATA.engineering missing/empty'});
    var br = D.branches;
    var construction = null, pontoons = null;
    for (var i=0;i<br.length;i++){ if(br[i].id==='construction') construction=br[i]; if(br[i].id==='pontoons') pontoons=br[i]; }
    var first = br[0];
    R.picks = { first:first.id, hasConstruction:!!construction, hasPontoons:!!pontoons };

    step('empty corps scores near the baseline', function(){ var C=mkC('US',1863,400000); var s=engScore(C);
      if (s > Math.max(22, D.baselineEngineeringScore+6)) throw new Error('empty corps should be near baseline, got '+s);
      return { baseline:D.baselineEngineeringScore, score:s }; });

    step('raising a branch SPENDS money + lifts the level', function(){ var C=mkC('US',1863,400000); var f0=C.funds;
      var r=engBuy(C, first.id); if(!r.ok) throw new Error('buy failed: '+r.reason);
      if (!(C.funds < f0)) throw new Error('funds should drop');
      if (engBranchLevel(C, first.id)!==1) throw new Error('level should be 1, got '+engBranchLevel(C, first.id));
      return { before:f0, after:C.funds, spent:f0-C.funds, level:1 }; });

    step('more levels RAISE the engineering score', function(){ var C=mkC('US',1864,400000);
      var s0=engScore(C);
      var got=0; for(var i=0;i<br.length;i++){ for(var l=0;l<3;l++){ var rr=engBuy(C, br[i].id); if(rr.ok) got++; } }
      var s1=engScore(C);
      if (got<1) throw new Error('could not raise any branch');
      if (!(s1>s0)) throw new Error('raising branches should beat empty: '+s0+'->'+s1);
      return { empty:s0, full:s1, levelsRaised:got }; });

    step('construction raises bridge SUPPLY; pontoons lower bridge FATIGUE', function(){ var C=mkC('US',1863,400000);
      var a0=bridgeArmy(C);
      if (construction) for(var l=0;l<3;l++) engBuy(C,'construction');
      if (pontoons) for(var p=0;p<3;p++) engBuy(C,'pontoons');
      var a1=bridgeArmy(C);
      if (construction){ if (!(engBranchBoost(C,'construction')>0)) throw new Error('construction boost should be >0');
        if (!(a1.supply >= a0.supply)) throw new Error('supply should not fall: '+a0.supply+'->'+a1.supply);
        if (!(a1.supply > a0.supply || a0.supply >= 95)) throw new Error('construction should raise supply: '+a0.supply+'->'+a1.supply); }
      if (pontoons){ if (!(a1.fatigue < a0.fatigue)) throw new Error('pontoons should lower fatigue: '+a0.fatigue+'->'+a1.fatigue); }
      return { supply0:a0.supply, supply1:a1.supply, fatigue0:a0.fatigue, fatigue1:a1.fatigue }; });

    step('bridge gains an ENGINEERING facet; the corps adds punch to overall', function(){ var C=mkC('US',1864,400000);
      var a0=bridgeArmy(C); if (typeof a0.engineering!=='number') throw new Error('bridgeArmy has no engineering facet');
      var o0=a0.overall;
      for(var i=0;i<br.length;i++){ for(var l=0;l<3;l++) engBuy(C, br[i].id); }
      var a1=bridgeArmy(C);
      if (!(a1.engineering > a0.engineering + 20)) throw new Error('a full corps should lift engineering: '+a0.engineering+'->'+a1.engineering);
      if (!(a1.overall > o0)) throw new Error('the Engineer Corps should add punch to overall: '+o0+'->'+a1.overall);
      return { engBefore:a0.engineering, engAfter:a1.engineering, overallBefore:o0, overallAfter:a1.overall }; });

    step('CS pays the materials premium for engineering', function(){
      var Cus=mkC('US',1863,400000); var u0=Cus.funds; engBuy(Cus, first.id); var usCost=u0-Cus.funds;
      var Ccs=mkC('CS',1863,400000); var c0=Ccs.funds; engBuy(Ccs, first.id); var csCost=c0-Ccs.funds;
      if (!(csCost > usCost)) throw new Error('CS should pay a premium: CS='+csCost+' US='+usCost);
      return { branch:first.id, usCost:usCost, csCost:csCost, premium:Math.round(csCost/usCost*100)/100 }; });

    step('the Construction Corps SLOWS but never stops/reverses CS rail decay (no equilibrium / pin-at-100)', function(){
      if (!construction) return { skipped:'no construction branch' };
      var TURNS=14;
      // control: CS, rail War-Room node funded high, NO construction
      var Cc=mkC('CS',1862,400000);
      if (Cc.warroom && Cc.warroom.nodes) Cc.warroom.nodes.rail = 5;
      for(var t=0;t<TURNS;t++){ Cc.stats.battles++; _t1Resolve('CS','draw',fakeB('CS',1862),Cc,false); }
      var railNo=Math.round(Cc.production.railIntegrity);
      // treatment: CS, construction maxed AND rail node funded high — the case that pinned rail at 100
      var Cy=mkC('CS',1862,400000);
      for(var b=0;b<3;b++) engBuy(Cy,'construction');
      if (Cy.warroom && Cy.warroom.nodes) Cy.warroom.nodes.rail = 5;
      var railStart=Cy.production.railIntegrity, prev=railStart, declining=true;
      for(var u=0;u<TURNS;u++){ Cy.stats.battles++; _t1Resolve('CS','draw',fakeB('CS',1862),Cy,false);
        if (Cy.production.railIntegrity > prev + 0.001) declining=false; prev=Cy.production.railIntegrity; }
      var railYes=Math.round(Cy.production.railIntegrity);
      if (!(railYes > railNo)) throw new Error('Construction should keep rail higher than without: with='+railYes+' without='+railNo);
      if (railYes >= 100) throw new Error('rail must NOT pin at 100 (equilibrium bug): '+railYes);
      if (railYes >= Math.round(railStart)) throw new Error('rail must still decline from start: start='+Math.round(railStart)+' end='+railYes);
      if (!declining) throw new Error('rail must be monotonically non-increasing turn to turn');
      return { railWithout:railNo, railWith:railYes, railStart:Math.round(railStart), monotoneDecline:declining }; });

    step('the level CAP holds (cannot exceed max)', function(){ var C=mkC('US',1864,400000);
      var max=(typeof first.maxLevel==='number'&&first.maxLevel>0)?first.maxLevel:(first.costPerLevel?first.costPerLevel.length-1:3);
      for(var l=0;l<max+3;l++) engBuy(C, first.id);
      var lvl=engBranchLevel(C, first.id);
      if (lvl!==max) throw new Error('level should cap at '+max+', got '+lvl);
      var over=engBuy(C, first.id); if (over.ok) throw new Error('buying past max should fail');
      return { max:max, level:lvl, overReason:over.reason }; });

    step('the Engineering Works section renders inside The Armory tab', function(){ mkC('US',1863,400000);
      openWarDept(); window._wdTab='armory'; _wdRefresh(); var h=document.getElementById('wdContent').innerHTML;
      if (h.indexOf('The Engineering Works Corps')<0) throw new Error('Engineering section missing');
      if (h.indexOf('data-engbuy')<0) throw new Error('no raise-branch button');
      if (h.indexOf(first.name)<0) throw new Error('branch '+first.name+' not shown');
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
    await page.evaluate(() => { G.campaign={side:'US',iron:false,idx:0,funds:400000,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); C.clock.year=1864; C.president.date={year:1864,month:1};
      var br=GAME_DATA.engineering.branches; for(var i=0;i<br.length;i++){ engBuy(C, br[i].id); if(i<2) engBuy(C, br[i].id); }
      openWarDept(); window._wdTab='armory'; _wdRefresh(); });
    await sleep(250); await page.screenshot({ path: join(OUT,'engineering.png'), fullPage:false });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-engineering.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-engineering ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-engineering.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-engineering.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-engineering: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-engineering: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-engineering: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
