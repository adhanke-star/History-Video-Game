#!/usr/bin/env node
// tools/probe-armory-field.mjs — A4 wire The Armory -> the battlefield. Verifies the
// strategic armory ids map to valid engine WEAPONS keys quality-monotonically, that the
// genForce override re-arms the PLAYER's fresh infantry with the weapons bought in
// C.armory.loadout (and NOT the enemy's), that the bought fraction is respected, that
// veterans keep their earned weapon, that a re-armed unit fires harder (WEAPONS.pow), and
// that off-campaign genForce is unchanged (no crash, no re-arm). Reads live GAME_DATA.weapons
// + WEAPONS + BATTLES. Writes shots/probe-armory-field.json.
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
  function mkC(side, year, loadout){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(year){ C.clock.year=year; C.president.date={year:year,month:1}; }
    if(loadout){ C.armory.loadout = loadout; } return C; }
  function getBM(year){ if(typeof BATTLES==='undefined'||!BATTLES.length) throw new Error('no BATTLES');
    var b0=BATTLES.find(function(b){return b.id==='antietam';})||BATTLES[0];
    var M=(typeof authoredMap==='function'&&authoredMap(b0))||(typeof genMap==='function'&&genMap(b0));
    if(!M) throw new Error('no map for '+b0.id);
    var bd={}; for(var k in b0){ if(b0.hasOwnProperty(k)) bd[k]=b0[k]; } if(year) bd.year=year;   // clone + set year (era-legal tests)
    return {bd:bd,M:M}; }
  function core1(){ return [{id:'V1',type:'inf',weapon:'rifled',xp:1,name:'core'}]; }   // a non-empty campaign core (player force discriminator)
  function countInf(units, wkey){ var t=0,w=0; for(var i=0;i<units.length;i++){ var u=units[i];
    if(u&&u.type==='inf'&&!u.vetId&&!u.leader){ t++; if(u.weapon===wkey) w++; } } return {fresh:t, withW:w}; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';
    if (typeof WEAPONS==='undefined') return JSON.stringify({ok:false,fatal:'WEAPONS undefined'});
    var WD = (typeof GAME_DATA!=='undefined'&&GAME_DATA&&GAME_DATA.weapons&&GAME_DATA.weapons.weapons) ? GAME_DATA.weapons.weapons : null;
    if (!WD) return JSON.stringify({ok:false,fatal:'GAME_DATA.weapons missing'});

    step('armory ids map to valid engine WEAPONS keys, quality-monotonic', function(){
      if (typeof _afEngineKey!=='function') throw new Error('_afEngineKey missing');
      var sorted = WD.slice().sort(function(a,b){return (a.quality||0)-(b.quality||0);});
      var lastPow=-1, rows=[];
      for (var i=0;i<sorted.length;i++){ var id=sorted[i].id, ek=_afEngineKey(id);
        if(!ek) throw new Error('no engine key for '+id);
        if(!WEAPONS[ek]) throw new Error(id+' -> '+ek+' not in WEAPONS');
        var pow=WEAPONS[ek].pow; if(pow < lastPow - 1e-9) throw new Error('non-monotonic: '+id+'(q'+sorted[i].quality+')->'+ek+' pow '+pow+' < prev '+lastPow);
        lastPow=pow; rows.push(id+'->'+ek+'('+pow+')'); }
      return { mapping:rows }; });

    step('buying Spencers re-arms the PLAYER campaign force, not the enemy', function(){
      var C=mkC('US',1863,{spencer:0.5}); var bm=getBM(1863);   // era-legal: spencer era 1863
      var pForce=genForce(bm.bd,'US',true,bm.M,core1());          // player gets a campaign core -> re-arm fires
      var eForce=genForce(bm.bd,'CS',false,bm.M,null);            // enemy core null -> no re-arm
      var p=countInf(pForce,'spencer'), e=countInf(eForce,'spencer');
      if (!(p.withW>=1)) throw new Error('player should carry Spencers, got '+p.withW+'/'+p.fresh);
      if (e.withW!==0) throw new Error('enemy should NOT carry the player armory weapon, got '+e.withW);
      return { playerSpencer:p.withW, playerFresh:p.fresh, enemySpencer:e.withW, enemyFresh:e.fresh }; });

    step('the bought FRACTION is respected (~half carry Spencer)', function(){
      var C=mkC('US',1863,{spencer:0.5}); var bm=getBM(1863);
      var pForce=genForce(bm.bd,'US',true,bm.M,core1()); var p=countInf(pForce,'spencer');
      // the bought fraction is a LOWER bound: floor(fresh*0.5) are re-armed; the unbought remainder keeps
      // its random standard issue, which at 1863 can ALSO include Spencers — so assert >=, not ==.
      var expect=Math.floor(p.fresh*0.5 + 1e-9);
      if (!(p.withW>=expect)) throw new Error('expected >= floor('+p.fresh+'*0.5)='+expect+' Spencers, got '+p.withW);
      if (p.withW>p.fresh) throw new Error('more spencer than fresh inf?! '+p.withW+'/'+p.fresh);
      return { fresh:p.fresh, spencerAtLeast:expect, spencer:p.withW }; });

    step('arming the WHOLE army issues the bought weapon to ALL the line (float-drift safe)', function(){
      var C=mkC('US',1863,{sharps:0.9999999999999999}); var bm=getBM(1863);   // simulate 0.1*10 accumulation; sharps era 1863
      var pForce=genForce(bm.bd,'US',true,bm.M,core1()); var ek=_afEngineKey('sharps');
      var p=countInf(pForce,ek);
      if (!(p.fresh>0 && p.withW===p.fresh)) throw new Error('whole-army loadout should arm ALL fresh inf with '+ek+': '+p.withW+'/'+p.fresh);
      return { engineKey:ek, armed:p.withW, fresh:p.fresh }; });

    step('veterans KEEP their earned weapon (not overwritten by the loadout)', function(){
      var C=mkC('US',1864,{smoothbore:1.0}); var bm=getBM(1864);
      var core=[{id:'V1',type:'inf',weapon:'henry',xp:2,name:'Iron Brigade'}];
      var pForce=genForce(bm.bd,'US',true,bm.M,core);
      var vet=null; for(var i=0;i<pForce.length;i++){ if(pForce[i].vetId==='V1') vet=pForce[i]; }
      if(!vet) throw new Error('veteran not in force');
      if(vet.weapon!=='henry') throw new Error('veteran weapon overwritten: '+vet.weapon);
      return { vetWeapon:vet.weapon }; });

    step('the engine ERA gate holds: a weapon the engine would not yet issue is NOT fielded early', function(){
      var C=mkC('US',1861,{sharps:1.0}); var bm=getBM(1861);   // sharps engine era 1863 > 1861
      var pForce=genForce(bm.bd,'US',true,bm.M,core1()); var ek=_afEngineKey('sharps');
      var p=countInf(pForce,ek);
      if (p.withW!==0) throw new Error('era-gated weapon should NOT be fielded at 1861, got '+p.withW+' '+ek);
      return { year:1861, engineKey:ek, era:WEAPONS[ek].era, fielded:p.withW, freshKeptDefault:p.fresh }; });

    step('FREE-BATTLE isolation: a live {spencer:1.0} campaign loadout does NOT leak into a non-campaign battle', function(){
      var C=mkC('US',1863,{spencer:1.0}); var bm=getBM(1863);   // campaign live in memory, whole army Spencers...
      var pForce=genForce(bm.bd,'US',true,bm.M,null);            // ...but core=null (Free Battle) -> gate blocks re-arm
      var eForce=genForce(bm.bd,'CS',false,bm.M,null);           // and the enemy never leaks either
      var p=countInf(pForce,'spencer'), e=countInf(eForce,'spencer');
      // a LEAK would force EVERY fresh inf to spencer (withW===fresh); with the gate working, only the
      // engine's random 1863 baseline carries a few — so withW < fresh proves the loadout did NOT apply.
      if (!(p.fresh>0 && p.withW < p.fresh)) throw new Error('Free Battle player force looks re-armed by the campaign loadout: '+p.withW+'/'+p.fresh);
      if (e.withW!==0) throw new Error('Free Battle enemy should NOT carry Spencers (CS never rolls them), got '+e.withW);
      return { freePlayerSpencer:p.withW, freePlayerFresh:p.fresh, freeEnemySpencer:e.withW }; });

    step('a re-armed unit fires harder (engine pow reflects the upgrade)', function(){
      var sm=_afEngineKey('smoothbore'), sp=_afEngineKey('spencer');
      if (!(WEAPONS[sp].pow > WEAPONS[sm].pow)) throw new Error('Spencer should out-power the smoothbore: '+WEAPONS[sp].pow+' vs '+WEAPONS[sm].pow);
      return { smoothPow:WEAPONS[sm].pow, spencerPow:WEAPONS[sp].pow, gainPct:Math.round((WEAPONS[sp].pow/WEAPONS[sm].pow-1)*100) }; });

    step('off-campaign genForce is unchanged (no crash, no re-arm)', function(){
      G.campaign=null; var bm=getBM();
      var f=genForce(bm.bd,'US',true,bm.M,null);
      if (!(f && f.length>0)) throw new Error('genForce returned no units off-campaign');
      if (typeof _afWireUnits==='function'){ var n=_afWireUnits(f,'US',null); if(n!==0) throw new Error('off-campaign re-arm should be a no-op'); }
      return { units:f.length }; });
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
    writeFileSync(join(OUT,'probe-armory-field.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-armory-field ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
