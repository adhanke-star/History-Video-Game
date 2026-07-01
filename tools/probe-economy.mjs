#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-economy.mjs — functional + visual gate for S1 finance core.
// Verifies the EMERGENT inflation asymmetry (Union stays anchored, Confederacy
// spirals into hyperinflation) — the marquee S1 teaching mechanic — plus the
// Treasury tab render + the lever/delegate interactions.
// Writes tools/shots/probe-economy.json + treasury-us.png / treasury-cs-selfmanaged.png.
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
  function mkCampaign(side){ return { side:side, iron:false, idx:0, funds:(side==='CS'?900:6500),
    recovery:false, completed:[], roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],
    nextId:2, stats:{battles:0,won:0,infl:0,suff:0}, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; }
  function runInflation(side, turns){
    G.campaign = mkCampaign(side); var C = G.campaign; _t1InitAll(C);
    var series=[]; for (var t=0; t<turns; t++){ econOnResolve(side,'draw',{},C,false); series.push(Math.round(C.economy.inflation*100)/100); }
    return { startMix:_t1InitAll && C.economy.mix, finalInflation:C.economy.inflation, series:series,
      weariness:(C.clock?C.clock.weariness:null), lastTurn:C.economy.lastTurn }; }
  try {
    if (typeof G === 'undefined') return JSON.stringify({ok:false, fatal:'G undefined'});
    G.mode='menu';
    step('GAME_DATA present', function(){ if (typeof GAME_DATA==='undefined'||!GAME_DATA.economy) throw new Error('GAME_DATA.economy missing'); return { keys:Object.keys(GAME_DATA), econKeys:Object.keys(GAME_DATA.economy) }; });
    var us, cs;
    step('US 12-turn inflation', function(){ us = runInflation('US',12); return us; });
    step('CS 12-turn inflation', function(){ cs = runInflation('CS',12); return cs; });
    step('ASYMMETRY: US anchored, CS spirals', function(){
      if (us.finalInflation > 3.0) throw new Error('US inflation too high: '+us.finalInflation+' (expected anchored < 3)');
      if (cs.finalInflation < us.finalInflation*3) throw new Error('CS did not spiral relative to US: CS='+cs.finalInflation+' US='+us.finalInflation);
      if (cs.series[11] <= cs.series[0]) throw new Error('CS inflation not rising');
      return { usFinal:Math.round(us.finalInflation*100)/100, csFinal:Math.round(cs.finalInflation*100)/100,
        ratio:Math.round(cs.finalInflation/us.finalInflation*10)/10, csWeariness:cs.weariness, usWeariness:us.weariness }; });
    // Treasury tab (US campaign)
    step('treasury tab renders', function(){ G.campaign=mkCampaign('US'); _t1InitAll(G.campaign);
      openWarDept(); window._wdTab='treasury'; _wdRefresh();
      var c=document.getElementById('wdContent'); var h=c?c.innerHTML:'';
      if (h.indexOf('The Treasury')<0) throw new Error('no Treasury header');
      if (h.indexOf('Printing Press')<0) throw new Error('no printing lever');
      return { len:h.length, hasDelegate:!!document.getElementById('ecDelegate'), hasWhy:!!document.getElementById('ecWhy') }; });
    step('delegate off → levers appear', function(){ var C=G.campaign; var b=document.getElementById('ecDelegate'); b.click();
      // after refresh, lever buttons should exist
      var levers=document.querySelectorAll('[data-eclever]');
      if (levers.length<2) throw new Error('no lever controls after taking control: '+levers.length);
      return { delegated:C.economy.delegated, leverBtns:levers.length }; });
    step('printing+ shifts the mix', function(){ var C=G.campaign; var before=C.economy.mix.printing;
      var btn=document.querySelector('[data-eclever="printing"][data-ecdir="1"]'); if(!btn) throw new Error('no printing+ button'); btn.click();
      if (C.economy.mix.printing <= before) throw new Error('printing mix did not increase');
      return { printingBefore:Math.round(before*100)/100, printingAfter:Math.round(C.economy.mix.printing*100)/100 }; });
    step('war-finance civics readout names Union bonds/taxes/printing and Confederate currency collapse', function(){
      window._wdTab='treasury'; _wdRefresh();
      var w=document.getElementById('ecWhy'); if(!w) throw new Error('missing US why button'); w.click();
      var box=document.getElementById('ecWhyBox'); var usText=(box&&box.textContent)||'';
      ['War finance is civics','war bonds','Legal Tender Act','legal tender','Revenue Acts','National Banking Acts','Office of the Comptroller','Borrowing and taxing','printing'].forEach(function(token){
        if(usText.indexOf(token)<0) throw new Error('US finance readout missing token: '+token);
      });
      G.campaign=mkCampaign('CS'); _t1InitAll(G.campaign); openWarDept(); window._wdTab='treasury'; _wdRefresh();
      var cw=document.getElementById('ecWhy'); if(!cw) throw new Error('missing CS why button'); cw.click();
      var cbox=document.getElementById('ecWhyBox'); var csText=(cbox&&cbox.textContent)||'';
      ['printing paper money','~60%','Currency Reform Act','repudiated','collapsing paper','civilians'].forEach(function(token){
        if(csText.indexOf(token)<0) throw new Error('CS finance readout missing token: '+token);
      });
      return { usLen:usText.length, csLen:csText.length }; });
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
  const pageerrors = [];
  page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'load', timeout:60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    // visual: US treasury (delegated)
    await page.evaluate(`(function(){ G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]}; _t1InitAll(G.campaign); openWarDept(); window._wdTab='treasury'; _wdRefresh(); })()`);
    await sleep(250); await page.screenshot({ path: join(OUT,'treasury-us.png'), fullPage:false });
    // visual: CS treasury after spiral, self-managed
    await page.evaluate(`(function(){ G.campaign={side:'CS',iron:false,idx:0,funds:900,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]}; var C=G.campaign; _t1InitAll(C); for(var t=0;t<10;t++) econOnResolve('CS','draw',{},C,false); C.economy.delegated=false; openWarDept(); window._wdTab='treasury'; _wdRefresh(); })()`);
    await sleep(250); await page.screenshot({ path: join(OUT,'treasury-cs-selfmanaged.png'), fullPage:false });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-economy.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-economy ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
