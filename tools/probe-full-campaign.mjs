#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-full-campaign.mjs - Phase J full-campaign playthrough gate.
// Drives the existing campaign bridge end to end: a dominant war auto-resolves every
// battle in the historical chain, advances through the President's interstitial, and
// reaches the D112/D119 final graded report. Also locks the recovery-loss branch and
// the strategic-end offer so this probe guards the cross-layer loop, not battle math.
// Writes tools/shots/probe-full-campaign.json.
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
  function mkC(side){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[
      {id:'R1',type:'inf',weapon:'spencer',xp:5,name:'Veteran Brigade'},
      {id:'R2',type:'inf',weapon:'springfield',xp:4,name:'Second Brigade'},
      {id:'R3',type:'art',weapon:'napoleon',xp:3,name:'Reserve Battery'}
    ],
    nextId:4, stats:{battles:0,won:0,infl:0,suff:0}, recoveryLossCount:0,
    recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C); setDominant(C);
    if(C.president) C.president.date={year:1861,month:4};
    return C; }
  function setDominant(C){ if(!C) return;
    C.funds=200000;
    if(C.clock){ C.clock.capital=120; C.clock.weariness=0; C.clock.intervention=0; }
    if(C.warroom){ C.warroom.supply=100; if(C.warroom.nodes){ for(var nk in C.warroom.nodes) C.warroom.nodes[nk]=5; } }
    if(C.manpower){ C.manpower.strength=100; C.manpower.replacementRatio=1; C.manpower.pool=999999; C.manpower.desertionTotal=0; }
    if(C.production){ C.production.equipIndex=100; C.production.material=100; }
    if(C.blockade){ C.blockade.importFactor=1; C.blockade.recognition=0; C.blockade.recognitionForeclosed=false; C.blockade.portsOpen=4; }
    if(C.morale){ C.morale.public=95; C.morale.troop=95; C.morale.leader=95; }
    if(C.strategy){ C.strategy.enemyWill=100; C.strategy.victoryReady=null; }
    if(C.armory) C.armory.loadout={henry:1};
    if(C.artillery) C.artillery.batteries={whitworth:12, ordnance3in:12, napoleon:12};
    if(C.engineering) C.engineering.levels={construction:3, fortifications:3, pontoons:3, siege:3};
    if(C.president && C.president.command) C.president.command.fieldGeneral = null;
  }
  function sheetHtml(){ var p=document.getElementById('sheetPad'); return (p&&p.innerHTML)||''; }
  function click(id){ var b=document.getElementById(id); if(!b) throw new Error('missing #'+id); b.click(); }
  function clearOverlays(){ if(typeof closeSheet==='function') closeSheet(); }
  function chain(side){ return (typeof CHAINS!=='undefined' && CHAINS && CHAINS[side]) ? CHAINS[side] : []; }
  function nextBattleId(C){ var ch=chain(C.side); return ch[C.idx] || null; }
  function playAutoChain(side){
    var C=mkC(side), ch=chain(side), log=[], guard=0, firstInterstitial=false, sawOffer=false;
    if(!ch.length) throw new Error('no campaign chain for '+side);
    while(G.campaign && guard < ch.length + 3){
      C=G.campaign; setDominant(C);
      var beforeIdx=C.idx, beforeBattles=C.stats.battles, bid=nextBattleId(C);
      if(!bid) throw new Error('missing next battle at idx '+beforeIdx+' for '+side);
      var o=bridgeAutoResolve(C);
      if(!o) throw new Error('bridgeAutoResolve returned null at '+bid);
      if(o.win!==true) throw new Error('dominant '+side+' campaign should win '+bid+', got '+JSON.stringify({type:o.type,margin:o.margin,me:o.me,foe:o.foe}));
      if(!document.getElementById('arGo')) throw new Error('auto-resolve did not render Continue for '+bid);
      click('arGo');
      log.push({ id:bid, type:o.type, cas:o.playerCas, enemy:o.enemyCas });
      if(G.campaign){
        C=G.campaign;
        if(C.stats.battles !== beforeBattles + 1) throw new Error('stats.battles did not advance after '+bid);
        if(C.idx !== beforeIdx + 1) throw new Error('idx did not advance after '+bid+': '+beforeIdx+' -> '+C.idx);
        if(C.completed.indexOf(bid) < 0) throw new Error('completed[] missing '+bid);
        if(C.recovery || C.recoveryMode || C.flipAtk) throw new Error('winning chain should clear recovery flags after '+bid);
        if(document.getElementById('pdConcludeWar')) sawOffer = true;
        if(document.getElementById('pdGoOn')) { firstInterstitial = true; click('pdGoOn'); }
        clearOverlays();
      }
      guard++;
    }
    if(G.campaign !== null) throw new Error('campaign should be null after final chain victory for '+side);
    var h=sheetHtml();
    if(h.indexOf('wwReport')<0 || h.indexOf('Final Reckoning')<0) throw new Error('final graded report missing after '+side+' chain');
    if(h.indexOf('wwMainMenu')<0) throw new Error('final report missing Main Menu button after '+side+' chain');
    if(log.length !== ch.length) throw new Error('resolved '+log.length+' battles; expected '+ch.length+' for '+side);
    if(!firstInterstitial) throw new Error('President interstitial never appeared during '+side+' chain');
    return { side:side, resolved:log.length, first:log[0].id, last:log[log.length-1].id, totalCas:log.reduce(function(a,x){return a+x.cas;},0), sawStrategicOffer:sawOffer };
  }
  function fakeLossThenRecovery(){
    var C=mkC('US'); C.idx=1; setDominant(C); var bd=BATTLES.find(function(b){return b.id==='bullrun1';});
    if(!bd) throw new Error('missing bullrun1');
    startBattleRuntime(bd, 'US', true);
    campaignAdvance('CS','win');
    if(C.idx!==1) throw new Error('loss should not advance idx, got '+C.idx);
    if(C.recovery!==true || C.recoveryMode!==true) throw new Error('loss should enter recovery');
    if(C.flipAtk!==true) throw new Error('Bull Run attacker loss should set recovery flip');
    if(document.getElementById('pdGoOn')) click('pdGoOn');
    clearOverlays();
    setDominant(C);
    var o=bridgeAutoResolve(C);
    if(!o || !o.win) throw new Error('dominant recovery auto-resolve should win');
    if(!G.battle || !G.battle.bd || G.battle.bd.atk!=='CS') throw new Error('recovery auto-resolve should fight the flipped attacker, got '+(G.battle&&G.battle.bd&&G.battle.bd.atk));
    click('arGo');
    if(C.idx!==2) throw new Error('recovery win should advance from idx 1 to 2, got '+C.idx);
    if(C.recovery || C.recoveryMode || C.flipAtk) throw new Error('recovery win should clear recovery flags');
    return { lossHeldIdx:1, recoveryAdvanced:C.idx, flippedAtk:'CS' };
  }
  function strategicOfferFlow(){
    var C=mkC('US'); C.idx=4; C.strategy.victoryReady='will'; C.strategy.enemyWill=20; C.clock.year=1864; C.president.date={year:1864,month:9};
    window._pdTurnAck=false; openUpgrade();
    var h=sheetHtml();
    if(h.indexOf('pdConcludeWar')<0) throw new Error('strategic victoryReady should surface a conclude-war offer');
    if(h.indexOf('The war can be concluded')<0) throw new Error('offer heading missing');
    click('pdConcludeWar');
    var end=sheetHtml();
    if(end.indexOf('A Negotiated Peace')<0) throw new Error('strategic end should render negotiated-peace framing');
    if(end.indexOf('Final Reckoning')<0) throw new Error('strategic end should render the graded final report');
    if(G.campaign!==null) throw new Error('strategic conclusion should nullify campaign');
    return { concluded:true };
  }
  try {
    if (typeof G==='undefined' || typeof bridgeAutoResolve!=='function' || typeof campaignAdvance!=='function' ||
        typeof warWonScreen!=='function' || typeof CHAINS==='undefined' || typeof BATTLES==='undefined')
      return JSON.stringify({ok:false,fatal:'full-campaign prerequisites missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    step('US full auto-resolve campaign reaches final graded report', function(){ clearOverlays(); return playAutoChain('US'); });
    step('CS full auto-resolve campaign reaches final graded report', function(){ clearOverlays(); return playAutoChain('CS'); });
    step('loss recovery branch holds idx, flips attacker, then rejoins the chain on a win', function(){ clearOverlays(); return fakeLossThenRecovery(); });
    step('strategic victoryReady offer can conclude the war before chain completion', function(){ clearOverlays(); return strategicOfferFlow(); });
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
  page.setDefaultTimeout(120000);
  const pageerrors = [];
  page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'load', timeout:60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-full-campaign.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-full-campaign ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || pageerrors.length) process.exit(1);
})();
