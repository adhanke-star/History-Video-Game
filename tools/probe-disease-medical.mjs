#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-disease-medical.mjs — D169 disease/medical War Effort gate.
// Verifies source-backed data, default exact-zero bridge input, capped active
// relief, sickness/wound ledger, Campaign Kit disease mitigation only when
// explicit, save sanitation, War Effort UI, and no tactical contamination.
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

const sourceText = readFileSync(join(ROOT, 'src', '63-disease-medical.js'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?2000:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock) C.clock.year=year||1864; if(C.president && C.president.date) C.president.date.year=year||1864;
    return C; }
  function fakeB(side, id, year, type){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=2600; c[e]=1800;
    return { playerSide:side, enemySide:e, bd:{id:id||'x',name:'Engagement',year:year||1864}, casualties:c, infl:{}, units:[], type:type||'loss' }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';

    step('data loads with Verified profiles, practices, and debates', function(){
      var D=GAME_DATA && GAME_DATA['disease-medical'];
      if(!D || D.schema!=='cw_disease_medical_v1') throw new Error('missing disease-medical data/schema');
      ['US','CS'].forEach(function(s){ var p=D.profiles&&D.profiles[s]; if(!p) throw new Error('missing profile '+s);
        if(p.provenance!=='Verified') throw new Error('profile '+s+' not Verified');
        if(!Array.isArray(p.sources)||p.sources.length<2) throw new Error('profile '+s+' needs >=2 sources');
        if((p.teaching||'').indexOf('Disease')<0 && (p.teaching||'').indexOf('disease')<0) throw new Error('profile '+s+' should teach disease pressure'); });
      if(!Array.isArray(D.practices)||D.practices.length<4) throw new Error('missing medical practices');
      if(!Array.isArray(D.debates)||D.debates.length<2) throw new Error('missing debates');
      D.practices.concat(D.debates).forEach(function(x){ if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+x.id); });
      var labels=D.practices.map(function(p){return p.id;}).join(',');
      if(labels.indexOf('disease-death')<0 || labels.indexOf('letterman-system')<0 || labels.indexOf('amputation-anesthesia')<0) throw new Error('missing required medical teaching beats: '+labels);
      return { schema:D.schema, practices:D.practices.length, debates:D.debates.length };
    });

    step('default bridge input is exact zero and does not move army facets', function(){
      var C=mkC('US',1864);
      C.medical.sick=3500; C.medical.wounded=2600;
      var a0=bridgeArmy(C);
      var b=medicalBridgeBonus(C);
      var a1=bridgeArmy(C);
      if(b.morale!==0 || b.supply!==0 || b.fatigue!==0 || b.overall!==0) throw new Error('inactive bridge should be exact zero: '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(a0[k]!==a1[k]) throw new Error(k+' changed while inactive: '+a0[k]+'->'+a1[k]); });
      return { bridge:b, army:{overall:a1.overall,morale:a1.morale,supply:a1.supply,fatigue:a1.fatigue} };
    });

    step('active medical relief is bounded and explicit', function(){
      var C=mkC('US',1864);
      C.medical.sick=5000; C.medical.wounded=3200; C.warroom.supply=72;
      var before=bridgeArmy(C);
      medicalSetPriority(C,'medicalRelief');
      var bonus=medicalBridgeBonus(C), after=bridgeArmy(C), caps=GAME_DATA['disease-medical'].config.bridgeCaps;
      if(!bonus.active) throw new Error('bonus should be active');
      if(bonus.morale<0 || bonus.morale>caps.morale) throw new Error('morale outside cap '+bonus.morale);
      if(bonus.fatigue>0 || Math.abs(bonus.fatigue)>caps.fatigueRelief) throw new Error('fatigue outside cap '+bonus.fatigue);
      if(bonus.supply>0 || Math.abs(bonus.supply)>caps.supplyCost) throw new Error('supply cost outside cap '+bonus.supply);
      if(bonus.overall<0 || bonus.overall>caps.overall) throw new Error('overall outside cap '+bonus.overall);
      if(after.morale<before.morale) throw new Error('medical relief should not lower morale');
      if(after.fatigue>before.fatigue) throw new Error('medical relief should not raise fatigue');
      return { before:before, after:after, bonus:bonus };
    });

    step('resolve records sickness and active relief mitigates pressure without erasing it', function(){
      var I=mkC('US',1864), A=mkC('US',1864);
      I.warroom.supply=50; A.warroom.supply=50;
      I.medical.sick=5000; I.medical.wounded=2600;
      A.medical.sick=5000; A.medical.wounded=2600; medicalSetPriority(A,'medicalRelief');
      medicalOnResolve('CS','loss',fakeB('US','wilderness',1864,'loss'),I,false);
      medicalOnResolve('CS','loss',fakeB('US','wilderness',1864,'loss'),A,false);
      if(!I.medical.lastTurn || !A.medical.lastTurn) throw new Error('lastTurn not recorded');
      if(!(A.medical.lastTurn.treated>I.medical.lastTurn.treated)) throw new Error('active relief should treat more men');
      if(!(A.medical.lastTurn.diseaseDeaths<I.medical.lastTurn.diseaseDeaths)) throw new Error('active relief should reduce disease deaths');
      if(!(A.medical.sick>0 && A.medical.wounded>0)) throw new Error('relief must not erase sickness/wounds');
      return { inactive:I.medical.lastTurn, active:A.medical.lastTurn };
    });

    step('medical relief mitigates Campaign Kit disease only when explicitly active', function(){
      var I=mkC('US',1864), A=mkC('US',1864);
      lootSetSurvival(I,true); lootSetSurvival(A,true);
      I.loot.survival.disease=74; I.loot.survival.fatigue=42;
      A.loot.survival.disease=74; A.loot.survival.fatigue=42; medicalSetPriority(A,'medicalRelief');
      medicalOnResolve('CS','loss',fakeB('US','antietam',1864,'loss'),I,false);
      medicalOnResolve('CS','loss',fakeB('US','antietam',1864,'loss'),A,false);
      if(I.loot.survival.disease!==74) throw new Error('inactive medical system should not change survival disease, got '+I.loot.survival.disease);
      if(!(A.loot.survival.disease<74)) throw new Error('active medical relief should reduce survival disease');
      if(!(A.loot.survival.fatigue<42)) throw new Error('active medical relief should reduce survival fatigue');
      return { inactive:I.loot.survival, active:A.loot.survival };
    });

    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1864);
      C.medical={active:'yes', priority:'bad', sick:-4, wounded:'12', treated:'5', diseaseDeaths:[], log:'oops', lastTurn:'bad', lastBridge:[]};
      medicalInit(C);
      if(C.medical.active!==false) throw new Error('active not sanitized');
      if(C.medical.priority!==null) throw new Error('priority not sanitized');
      if(C.medical.sick!==0 || C.medical.wounded!==12 || C.medical.treated!==5 || C.medical.diseaseDeaths!==0) throw new Error('counts not sanitized: '+JSON.stringify(C.medical));
      if(!Array.isArray(C.medical.log)) throw new Error('log not array');
      if(C.medical.lastTurn!==null || C.medical.lastBridge!==null) throw new Error('last fields not nulled');
      return C.medical;
    });

    step('War Effort UI renders medical teaching and toggle wires', function(){
      var C=mkC('US',1864);
      C.medical.sick=4200; C.medical.wounded=2600; C.warroom.supply=68;
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if(h.indexOf('Disease &amp; Army Medicine')<0) throw new Error('medical block missing');
      if(h.indexOf('Letterman')<0 || h.indexOf('Sanitary Commission')<0) throw new Error('medical teaching copy missing');
      var b=document.getElementById('medToggleRelief'); if(!b) throw new Error('medical relief button absent');
      b.click();
      if(!C.medical || C.medical.active!==true || C.medical.priority!=='medicalRelief') throw new Error('toggle did not activate');
      var bb=medicalBridgeBonus(C); if(!bb.active) throw new Error('bridge not active after click');
      return { active:C.medical.active, bridge:bb, len:h.length };
    });

    step('no tactical/classic contamination from the strategic module', function(){
      var src = ${JSON.stringify(sourceText)};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=|\\.men\\s*=/.test(src)) throw new Error('medical module touched tactical engine/output fields');
      return { tacticalTokens:false };
    });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<80;i++){ if(await up(probe))break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:90000 });
    await sleep(700);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    await page.evaluate(() => {
      G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); if(C.clock) C.clock.year=1864; if(C.president&&C.president.date) C.president.date.year=1864;
      C.medical.sick=6400; C.medical.wounded=3600; C.warroom.supply=68; medicalSetPriority(C,'medicalRelief');
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var b=document.getElementById('medToggleRelief'); if(b && b.scrollIntoView) b.scrollIntoView({block:'center'});
    });
    await sleep(300); await page.screenshot({ path: join(OUT,'disease-medical.png'), fullPage:false, timeout:90000 });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-disease-medical.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-disease-medical ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
