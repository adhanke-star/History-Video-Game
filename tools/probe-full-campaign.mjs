#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-full-campaign.mjs — the owner-mode war is playable end-to-end BY DELEGATION under the
// PM3 (D277) sim-backed resolve. The old "a dominant war wins EVERY battle" pins were margin-model
// artifacts (the E42 defect: the rating ignored the authored OOB); under ONE battle-truth model a
// dominant delegating Union completes the chain WITH bounded recoveries (First Bull Run repeats
// history, the recovery converges), while a dominant delegating Confederacy progresses deep into the
// late war and honestly STALLS at the terminal odds (Nashville/Bentonville) — the out at that wall
// is TAKE COMMAND (fight it in either engine); the political victoryReady path exists (exercised
// below) but is not guaranteed reachable by delegation alone (losses net-stiffen Northern resolve
// via vicOnResolve — the D277 panel's history-lens finding). Verifies per-
// battle bookkeeping (stats/idx/completed/recovery), recovery convergence, and the final graded
// report. Writes shots/probe-full-campaign.json.
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
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C); return C; }
  function setDominant(C){
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
  function clickIf(id){ var b=document.getElementById(id); if(b){ b.click(); return true; } return false; }
  function clearOverlays(){ if(typeof closeSheet==='function') closeSheet(); }
  function chain(side){ return (typeof CHAINS!=='undefined' && CHAINS && CHAINS[side]) ? CHAINS[side] : []; }
  function driveChain(side, cap){
    var C=mkC(side), ch=chain(side), n=0, wins=0, losses=0, recEntries=0, maxConsecLoss=0, consec=0;
    var firstInterstitial=false, sawOffer=false, maxIdx=0;
    if(!ch.length) throw new Error('no campaign chain for '+side);
    while(G.campaign && n<cap){
      C=G.campaign; setDominant(C);
      var beforeIdx=C.idx, beforeBattles=C.stats.battles, beforeRec=C.recovery;
      var o=bridgeAutoResolve(C);
      if(!o) throw new Error('bridgeAutoResolve returned null at idx '+C.idx);
      if(!document.getElementById('arGo')) throw new Error('auto-resolve did not render Continue at idx '+beforeIdx);
      click('arGo');
      n++;
      if(G.campaign){
        C=G.campaign;
        if(C.stats.battles !== beforeBattles + 1) throw new Error('stats.battles did not advance at idx '+beforeIdx);
        if(o.win){ wins++; consec=0;
          if(C.idx !== beforeIdx + 1) throw new Error('a delegated win must advance idx: '+beforeIdx+' -> '+C.idx);
          if(C.completed.indexOf(ch[beforeIdx]) < 0) throw new Error('completed[] missing '+ch[beforeIdx]);
          if(C.recovery || C.recoveryMode) throw new Error('a win must clear recovery flags');
        } else { losses++; consec++;
          if(C.idx !== beforeIdx) throw new Error('a delegated non-win must NOT advance idx');
          if(C.recovery !== true) throw new Error('a delegated non-win must enter recovery');
          if(!beforeRec) recEntries++;
        }
        if(consec>maxConsecLoss) maxConsecLoss=consec;
        if(C.idx>maxIdx) maxIdx=C.idx;
        if(document.getElementById('pdConcludeWar')) sawOffer = true;
        if(document.getElementById('pdGoOn')) { firstInterstitial = true; clickIf('pdGoOn'); }
        clearOverlays();
      } else { wins++; if((beforeIdx+1)>maxIdx) maxIdx=beforeIdx+1; }
    }
    return { side:side, chainLen:ch.length, resolved:n, wins:wins, losses:losses, recoveries:recEntries,
      maxConsecLoss:maxConsecLoss, maxIdx:maxIdx, completedWar:(G.campaign===null),
      firstInterstitial:firstInterstitial, sawOffer:sawOffer };
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
    // the delegated recovery: flipped orientation (player DEFENDS), new seed per attempt (stats.battles
    // moves the war-state-pure seed) -> a dominant defender converges in a bounded number of attempts.
    var attempts=0;
    while(attempts<6){
      setDominant(C);
      var o=bridgeAutoResolve(C);
      if(!o) throw new Error('recovery auto-resolve returned null');
      if(o.bd.atk!=='CS') throw new Error('recovery should fight the FLIPPED battle (CS attacks), got '+o.bd.atk);
      click('arGo');
      attempts++;
      if(o.win){
        if(C.idx!==2) throw new Error('recovery win should advance from idx 1 to 2, got '+C.idx);
        if(C.recovery || C.recoveryMode || C.flipAtk) throw new Error('recovery win should clear recovery flags');
        clearOverlays();
        return { attempts:attempts, advanced:true, flippedAtk:'CS' };
      }
      if(C.flipAtk!==true) throw new Error('a lost DEFENSIVE recovery at Bull Run should keep the flip (original attacker was the player)');
      clickIf('pdGoOn'); clearOverlays();
    }
    throw new Error('dominant flipped recovery did not converge within 6 attempts');
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
    step('US dominant delegation completes the FULL chain (bounded recoveries; Bull Run repeats history once)', function(){
      clearOverlays();
      var r=driveChain('US', 72);
      if(!r.completedWar) throw new Error('dominant US delegation should complete the chain, stalled at idx '+r.maxIdx+' after '+r.resolved);
      var h=sheetHtml();
      if(h.indexOf('wwReport')<0 || h.indexOf('Final Reckoning')<0) throw new Error('final graded report missing');
      if(h.indexOf('wwMainMenu')<0) throw new Error('final report missing Main Menu button');
      if(r.resolved>45) throw new Error('pacing: completion took '+r.resolved+' resolutions (>45) for a 31-battle chain');
      if(r.maxConsecLoss>2) throw new Error('pacing: a delegated loss should recover within 2 attempts, saw '+r.maxConsecLoss);
      if(!r.firstInterstitial) throw new Error('President interstitial never appeared');
      return r; });
    step('CS dominant delegation progresses DEEP into the late war; the terminal stall is honest (one battle-truth)', function(){
      clearOverlays();
      var r=driveChain('CS', 40);
      if(r.wins<15) throw new Error('CS delegation should win most of the early/mid war, got '+r.wins);
      if(r.completedWar){   // future engines may make this completable — not a failure, but never a free pass (D277 panel)
        var hc=sheetHtml();
        if(hc.indexOf('Final Reckoning')<0) throw new Error('completedWar without the final graded report — spurious null campaign');
        return r;
      }
      if(r.maxIdx<20) throw new Error('CS delegation should reach the late war (idx>=20 of '+r.chainLen+'), got '+r.maxIdx);
      G.campaign=null; clearOverlays();   // release the stalled war before the next step
      return r; });
    step('loss recovery branch holds idx, flips attacker, and CONVERGES back onto the chain', function(){ clearOverlays(); return fakeLossThenRecovery(); });
    step('strategic victoryReady offer concludes the war before chain completion (the political path — reachable state injected; delegation alone does not guarantee it)', function(){ clearOverlays(); return strategicOfferFlow(); });
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
  page.setDefaultTimeout(900000);
  const pageerrors = [];
  page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });   // slow-Mac: the 'load' wait stalls while embedded assets stream (the documented gotcha, D233 class; fixed in D244); inline scripts are all the probe needs
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
