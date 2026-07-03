#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-morale.mjs — S2 m3 three-layer morale + the 1864 election hinge.
// Verifies: moraleInit/moraleCompute build the troop/leader/public layers; the
// interactions hold (winning lifts leader+public; the accumulating casualty toll and
// CS inflation sink public; leadership lifts troops); casualtyToll accumulates; and the
// 1864 election CONSEQUENCE feeds the enemy-will system (re-elected -> enemyWill down;
// repudiated -> enemyWill up + public hit), once. Writes shots/probe-morale.json.
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
  function mkC(side, y, m){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    C.clock.year=(y||1863); C.president.date={year:(y||1863),month:(m||6)}; return C; }
  function setWar(C, won, battles, weary){ C.stats.won=won; C.stats.battles=battles; C.clock.weariness=weary;
    if(C.manpower) C.manpower.strength=80; if(C.warroom) C.warroom.supply=70; if(C.economy) C.economy.inflation=1.1; }
  try {
    if (typeof moraleCompute!=='function' || typeof moraleOnResolve!=='function') return JSON.stringify({ok:false,fatal:'morale module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('moraleInit builds the three layers + toll', function(){
      var C=mkC('US',1863,6);
      var M=C.morale; if(!M||typeof M.troop!=='number'||typeof M.leader!=='number'||typeof M.public!=='number') throw new Error('morale not initialized');
      if(typeof M.casualtyToll!=='number'||typeof M.electionApplied!=='boolean') throw new Error('toll/flag missing');
      return { troop:M.troop, leader:M.leader, public:M.public }; });

    step('WINNING lifts leader + public; losing sinks them', function(){
      var Cw=mkC('US',1863,6); setWar(Cw,8,10,10); var mw=moraleCompute(Cw);
      var Cl=mkC('US',1863,6); setWar(Cl,1,10,80); var ml=moraleCompute(Cl);
      if(!(mw.leader>ml.leader)) throw new Error('winning should lift leader: '+mw.leader+' vs '+ml.leader);
      if(!(mw.public>ml.public)) throw new Error('winning should lift public: '+mw.public+' vs '+ml.public);
      return { winLeader:mw.leader, loseLeader:ml.leader, winPublic:mw.public, losePublic:ml.public }; });

    step('the accumulating CASUALTY TOLL sinks public will (D35.6)', function(){
      var C0=mkC('US',1863,6); setWar(C0,5,10,30); C0.morale.casualtyToll=0; var p0=moraleCompute(C0).public;
      var C1=mkC('US',1863,6); setWar(C1,5,10,30); C1.morale.casualtyToll=120000; var p1=moraleCompute(C1).public;
      if(!(p1<p0)) throw new Error('a heavy toll should sink public will: '+p1+' vs '+p0);
      return { publicLowToll:p0, publicHighToll:p1 }; });

    step('CS INFLATION sinks public will (the home-front economy)', function(){
      var Cgood=mkC('CS',1863,6); setWar(Cgood,5,10,30); Cgood.economy.inflation=1.1; var pg=moraleCompute(Cgood).public;
      var Cbad=mkC('CS',1863,6); setWar(Cbad,5,10,30); Cbad.economy.inflation=8.0; var pb=moraleCompute(Cbad).public;
      if(!(pb<pg)) throw new Error('runaway inflation should sink public will: '+pb+' vs '+pg);
      return { publicLowInfl:pg, publicHighInfl:pb }; });

    step('LEADERSHIP lifts the troops (the cabinet interaction)', function(){
      // same side + war-state; vary only the sitting War Secretary (Stanton 1863 vs Cameron 1861)
      var Cs=mkC('US',1863,6); setWar(Cs,5,10,30); var ms=moraleCompute(Cs);
      var Cc=mkC('US',1861,6); setWar(Cc,5,10,30); var mc=moraleCompute(Cc);
      var lead_s=cabinetLeadership(Cs), lead_c=cabinetLeadership(Cc);
      if(!(lead_s>lead_c)) throw new Error('Stanton should out-lead Cameron: '+lead_s+' vs '+lead_c);
      if(!(ms.leader>mc.leader)) throw new Error('better cabinet -> higher leader morale: '+ms.leader+' vs '+mc.leader);
      if(!(ms.troop>=mc.troop)) throw new Error('leadership should lift troops: '+ms.troop+' vs '+mc.troop);
      return { stantonLead:lead_s, cameronLead:lead_c, stantonTroop:ms.troop, cameronTroop:mc.troop }; });

    step('casualtyToll ACCUMULATES across turns', function(){
      var C=mkC('US',1863,6); var t0=C.morale.casualtyToll;
      moraleOnResolve('US','win',{casualties:{US:5000,CS:3000}},C,true);
      moraleOnResolve('US','loss',{casualties:{US:7000,CS:2000}},C,false);
      if(C.morale.casualtyToll!==t0+12000) throw new Error('toll should accumulate to '+(t0+12000)+', got '+C.morale.casualtyToll);
      return { toll:C.morale.casualtyToll }; });

    step('1864 ELECTION: re-elected -> enemyWill DROPS (once); a 2nd tick is a no-op', function(){
      var C=mkC('US',1864,6); C.strategy.enemyWill=60; C.clock.resolved1864=true; C.clock.elected=true;
      moraleOnResolve('US','win',{casualties:{US:1000}},C,true);
      if(C.strategy.enemyWill!==52) throw new Error('re-elected should drop enemyWill 60->52, got '+C.strategy.enemyWill);
      if(!C.morale.electionApplied) throw new Error('electionApplied not set');
      moraleOnResolve('US','win',{casualties:{US:1000}},C,true);   // second tick: no double-apply
      if(C.strategy.enemyWill!==52) throw new Error('election consequence applied twice: '+C.strategy.enemyWill);
      return { enemyWill:C.strategy.enemyWill }; });

    step('1864 ELECTION: repudiated -> enemyWill RISES + public hit (the home front breaks)', function(){
      var C=mkC('US',1864,6); C.strategy.enemyWill=40; C.clock.resolved1864=true; C.clock.elected=false; C.morale.public=60;
      moraleOnResolve('US','loss',{casualties:{US:1000}},C,false);
      if(C.strategy.enemyWill!==52) throw new Error('repudiated should raise enemyWill 40->52, got '+C.strategy.enemyWill);
      if(!C.morale.repudiated) throw new Error('repudiation should set the durable M.repudiated flag');
      if(!(C.morale.public<=50)) throw new Error('repudiation should sink public will (durable penalty), got '+C.morale.public);
      return { enemyWill:C.strategy.enemyWill, public:C.morale.public, repudiated:C.morale.repudiated }; });

    step('D51 hardening: migration-safe latch + corrupt-toll + absent-strategy', function(){
      // (1) a legacy save ALREADY past the 1864 verdict must NOT re-fire the enemyWill nudge on load
      var C=mkC('US',1864,6); C.clock.resolved1864=true; C.clock.elected=false; C.strategy.enemyWill=30; delete C.morale;
      moraleInit(C);
      if(C.morale.electionApplied!==true) throw new Error('a legacy resolved verdict should seed electionApplied=true');
      moraleOnResolve('US','loss',{casualties:{US:500}},C,false);
      if(C.strategy.enemyWill!==30) throw new Error('the nudge must NOT re-fire on a legacy resolved save, got '+C.strategy.enemyWill);
      // (2) a corrupt negative toll must floor to 0, not pin public to 100
      var C2=mkC('US',1863,6); C2.morale.casualtyToll=-5000000; moraleInit(C2);
      if(C2.morale.casualtyToll!==0) throw new Error('negative toll should floor to 0, got '+C2.morale.casualtyToll);
      if(moraleCompute(C2).public>=100) throw new Error('public pinned to 100 via a negative toll');
      // (3) the consequence is NOT burned when C.strategy is absent at resolve time
      var C3=mkC('US',1864,6); C3.clock.resolved1864=true; C3.clock.elected=true; C3.strategy=undefined;
      moraleOnResolve('US','win',{casualties:{US:100}},C3,true);
      if(C3.morale.electionApplied!==false) throw new Error('latch must NOT burn when strategy is absent (the effect was lost)');
      return { legacyNoRefire:true, tollFloored:C2.morale.casualtyToll, latchHeld:true }; });

    step('presMoraleBlock renders the three meters + the 1864 forecast', function(){
      var C=mkC('US',1864,6); setWar(C,3,8,55);
      var html=presMoraleBlock(C);
      ['Troop morale','Leadership','Public will','1864 Election'].forEach(function(s){ if(html.indexOf(s)<0) throw new Error('block missing "'+s+'"'); });
      return { len:html.length }; });
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
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-morale.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-morale ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-morale.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-morale.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-morale: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-morale: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-morale: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
