#!/usr/bin/env node
// tools/probe-bridge.mjs — S5(seed) strategy->battle bridge (pre-battle half).
// Verifies the conditioned army (bridgeArmy) reflects the strategic state (a winning
// South fields a strong army; a collapsing one fields a brittle army), the pre-battle
// briefing renders with prep options, prep toggles store in C.battlePrep, and the
// interstitial shows "the army you will field". Writes shots/probe-bridge.json + briefing.png.
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
  function drive(side, mode, turns){ G.campaign=mkC(side); var C=G.campaign; _t1InitAll(C); var e=(side==='US')?'CS':'US';
    for(var t=0;t<turns;t++){ C.stats.battles++; var win=(mode==='win'); if(win) C.stats.won++;
      var c={}; c[side]=win?900:2000; c[e]=win?2400:800;
      _t1Resolve(side, win?'win':'loss', {playerSide:side,enemySide:e,bd:{name:'x',year:1861+Math.floor(t/4)},casualties:c,infl:{},units:[]}, C, win); }
    return C; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    var winA, loseA;
    step('conditioning reflects a WINNING war', function(){ var C=drive('CS','win',16); winA=bridgeArmy(C);
      // un-armed (muskets, firepower ~30) but a strong war-state -> "Fair+" overall
      if (winA.overall < 54) throw new Error('a winning South should field a solid army, got '+winA.overall);
      return winA; });
    step('conditioning reflects a LOSING war', function(){ var C=drive('CS','lose',16); loseA=bridgeArmy(C);
      if (loseA.overall > 50) throw new Error('a losing South should field a brittle army, got '+loseA.overall);
      return loseA; });
    step('the bridge SEPARATES the two armies', function(){
      if (!(winA.overall > loseA.overall + 15)) throw new Error('winning army ('+winA.overall+') should far exceed losing ('+loseA.overall+')');
      if (!(winA.morale > loseA.morale)) throw new Error('winning morale should exceed losing');
      if (!(winA.strength > loseA.strength)) throw new Error('winning strength should exceed losing');
      return { winOverall:winA.overall, loseOverall:loseA.overall }; });
    step('forced-march prep raises fatigue (preview)', function(){
      var C=drive('CS','win',6); var before=bridgeArmy(C).fatigue;
      C.battlePrep.forcedMarch=true; var after=bridgeArmy(C).fatigue;
      if (!(after > before)) throw new Error('forced march should raise fatigue: '+before+' -> '+after);
      return { before:before, after:after }; });
    step('pre-battle briefing renders (army + prep + to-the-field)', function(){
      var C=drive('CS','win',6); var h=bridgeBriefingHTML(C);
      if (h.indexOf('Pre-Battle Briefing')<0) throw new Error('no briefing title');
      if (h.indexOf('The army you field')<0) throw new Error('no conditioned army');
      if (h.indexOf('Entrench')<0 || h.indexOf('Forced march')<0) throw new Error('no prep options');
      if (h.indexOf('To the Field')<0) throw new Error('no to-the-field button');
      return { len:h.length }; });
    step('interstitial shows the army you will field', function(){
      var C=drive('CS','win',4); var h=_pdInterstitialHTML(C);
      if (h.indexOf('The army you will field')<0) throw new Error('interstitial missing army summary');
      return { len:h.length }; });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  R.winA=winA; R.loseA=loseA;
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
    await page.evaluate(() => { G.campaign={side:'CS',iron:false,idx:0,funds:3000,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); for(var t=0;t<5;t++){ C.stats.battles++; C.stats.won++; var c={CS:900,US:2400};
        _t1Resolve('CS','win',{playerSide:'CS',enemySide:'US',bd:{name:'x',year:1862},casualties:c,infl:{},units:[]},C,true); }
      if (typeof openSheet==='function') openSheet(bridgeBriefingHTML(C)); });
    await sleep(250); await page.screenshot({ path: join(OUT,'briefing.png'), fullPage:false });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-bridge.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-bridge ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
