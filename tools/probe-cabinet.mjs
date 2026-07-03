#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-cabinet.mjs — S2 m1 cabinet & advisor system. Verifies: the data loads;
// the CHURN is date-aware (Cameron->Stanton, Walker->...->Breckinridge, Benjamin's rotation);
// advisor stances are selected by war-state condition; ambition surfaces for the schemers and
// not the loyal; Heed is a once-per-turn bounded nudge; cabOnResolve logs office handovers;
// the cabinet renders the sitting secretaries and wires without error. Writes shots/probe-cabinet.json.
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
    C.clock.year=y||1863; C.president.date={year:(y||1863),month:(m||6)}; return C; }
  function dnum(d){ return d.year*12 + d.month; }
  try {
    if (typeof _cabData!=='function' || typeof _cabHolder!=='function') return JSON.stringify({ok:false,fatal:'cabinet module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('cabinet data loads with US + CS rosters and 2 cross-cards', function(){
      var d=_cabData(); if(!d) throw new Error('no GAME_DATA.cabinet');
      var us=_cabSideRoster('US'), cs=_cabSideRoster('CS');
      if (us.length < 12) throw new Error('US roster too small: '+us.length);
      if (cs.length < 14) throw new Error('CS roster too small: '+cs.length);
      if (!d.crossCards || d.crossCards.length < 2) throw new Error('expected >=2 cross-cards');
      // schema integrity: every advisor has id/name/domain/tenure/stances/card
      var all=us.concat(cs);
      for (var i=0;i<all.length;i++){ var a=all[i];
        if(!a.id||!a.name||!a.domain||!a.tenure||!a.tenure.start) throw new Error('advisor missing core field: '+(a&&a.name));
        if(!a.stances||!a.stances.length) throw new Error('advisor missing stances: '+a.name);
        if(!a.card) throw new Error('advisor missing card: '+a.name); }
      return { usCount:us.length, csCount:cs.length, crossCards:d.crossCards.length }; });

    step('the CHURN is date-aware: US War Cameron(1861) -> Stanton(1862+)', function(){
      var c61=_cabHolder('US','war',{year:1861,month:4});
      var c62=_cabHolder('US','war',{year:1862,month:6});
      var c64=_cabHolder('US','war',{year:1864,month:6});
      if(!c61||c61.name!=='Cameron') throw new Error('1861 War should be Cameron, got '+(c61&&c61.name));
      if(!c62||c62.name!=='Stanton') throw new Error('1862 War should be Stanton, got '+(c62&&c62.name));
      if(!c64||c64.name!=='Stanton') throw new Error('1864 War should be Stanton, got '+(c64&&c64.name));
      return { y1861:c61.name, y1862:c62.name, y1864:c64.name }; });

    step('the CHURN is date-aware: CS War revolving door + Benjamin rotation', function(){
      var w=function(y,m){ var h=_cabHolder('CS','war',{year:y,month:m}); return h?h.name:null; };
      var s=function(y,m){ var h=_cabHolder('CS','state',{year:y,month:m}); return h?h.name:null; };
      var seq={ war1861_04:w(1861,4), war1861_10:w(1861,10), war1862_06:w(1862,6), war1863_01:w(1863,1), war1865_03:w(1865,3),
                state1861_04:s(1861,4), state1862_06:s(1862,6) };
      if(seq.war1861_04!=='Walker') throw new Error('CS War 1861-04 should be Walker, got '+seq.war1861_04);
      if(seq.war1861_10!=='Benjamin') throw new Error('CS War 1861-10 should be Benjamin, got '+seq.war1861_10);
      if(seq.war1862_06!=='Randolph') throw new Error('CS War 1862-06 should be Randolph, got '+seq.war1862_06);
      if(seq.war1863_01!=='Seddon') throw new Error('CS War 1863-01 should be Seddon, got '+seq.war1863_01);
      if(seq.war1865_03!=='Breckinridge') throw new Error('CS War 1865-03 should be Breckinridge, got '+seq.war1865_03);
      if(seq.state1861_04!=='Toombs') throw new Error('CS State 1861-04 should be Toombs, got '+seq.state1861_04);
      if(seq.state1862_06!=='Benjamin') throw new Error('CS State 1862-06 should be Benjamin (rotation), got '+seq.state1862_06);
      return seq; });

    step('advisor stance is selected by war-state condition (inflationHigh / armyWeak / always)', function(){
      // Treasury: high inflation -> Memminger presses the inflationHigh stance
      var Ci=mkC('CS',1862,6); Ci.economy.inflation=50;
      var mem=_cabHolder('CS','treasury',Ci.president.date); var sI=_cabActiveStance(mem,Ci);
      if(!sI||sI.condition!=='inflationHigh') throw new Error('high inflation should select inflationHigh stance, got '+(sI&&sI.condition));
      // War: weak army -> Stanton presses the armyWeak stance
      var Cw=mkC('US',1863,6); Cw.manpower.strength=20; Cw.production.equipIndex=20; Cw.clock.weariness=95; Cw.warroom.supply=30; Cw.blockade.importFactor=0.3;
      var ov=bridgeArmy(Cw).overall; var st=_cabHolder('US','war',Cw.president.date); var sW=_cabActiveStance(st,Cw);
      if(!(ov<60)) throw new Error('test setup: weak overall not <60 ('+ov+')');
      if(!sW||sW.condition!=='armyWeak') throw new Error('weak army should select armyWeak stance, got '+(sW&&sW.condition));
      // War: strong army -> the "always" stance
      var Cs=mkC('US',1863,6); Cs.manpower.strength=100; Cs.production.equipIndex=100; Cs.clock.weariness=0; Cs.warroom.supply=100; Cs.blockade.importFactor=1.0;
      var ov2=bridgeArmy(Cs).overall; var sS=_cabActiveStance(_cabHolder('US','war',Cs.president.date),Cs);
      if(!(ov2>=60)) throw new Error('test setup: strong overall not >=60 ('+ov2+')');
      if(!sS||sS.condition!=='always') throw new Error('strong army should fall to the always stance, got '+(sS&&sS.condition));
      return { weakOverall:ov, strongOverall:ov2, inflStance:sI.condition, weakStance:sW.condition, strongStance:sS.condition }; });

    step('AMBITION surfaces for the schemers (Chase) and not the loyal (Welles)', function(){
      var C=mkC('US',1863,6);
      var chase=_cabHolder('US','treasury',C.president.date);
      var welles=_cabHolder('US','navy',C.president.date);
      var seward=_cabHolder('US','state',C.president.date);
      if(chase.name!=='Chase') throw new Error('treasury 1863 should be Chase, got '+chase.name);
      if(!_cabAmbitionActive(chase,C)) throw new Error('Chase ambition (92) should surface');
      if(_cabAmbitionActive(welles,C)) throw new Error('Welles ambition (20) should NOT surface');
      // CS: Toombs (80) surfaces in 1861
      var Cc=mkC('CS',1861,4); var toombs=_cabHolder('CS','state',Cc.president.date);
      if(toombs.name!=='Toombs'||!_cabAmbitionActive(toombs,Cc)) throw new Error('Toombs ambition should surface in 1861');
      return { chaseAmb:chase.ambition, wellesAmb:welles.ambition, toombsAmb:toombs.ambition }; });

    step('HEED is a bounded, once-per-turn nudge (treasury -> weariness, capital)', function(){
      var C=mkC('US',1863,6); C.clock.weariness=50; C.clock.capital=10; C.president.turn=0;
      _cabHeed(C,'treasury');
      var w1=C.clock.weariness, cap1=C.clock.capital, ht=C.president.cabinetState.treasury.heededTurn;
      if(w1!==48) throw new Error('treasury heed should drop weariness 50->48, got '+w1);
      if(cap1!==11) throw new Error('heed should raise capital 10->11, got '+cap1);
      if(ht!==0) throw new Error('heededTurn should record turn 0, got '+ht);
      _cabHeed(C,'treasury');  // second heed same turn = no-op
      if(C.clock.weariness!==48) throw new Error('second heed same turn should be a no-op, weariness='+C.clock.weariness);
      // delegated domain cannot be heeded
      C.president.cabinetState.war.delegated=true; var s0=C.warroom.supply;
      _cabHeed(C,'war'); if(C.warroom.supply!==s0) throw new Error('delegated war should not be heeded');
      return { weariness:w1, capital:cap1, heededTurn:ht }; });

    step('cabOnResolve LOGS an office handover (churn dispatch) and updates the snapshot', function(){
      var C=mkC('US',1861,12);  // Cameron still at War
      if(C.president.cabHolders.war!=='us-cameron') throw new Error('snapshot should start at Cameron, got '+C.president.cabHolders.war);
      var logLen0=C.president.log.length;
      C.president.date={year:1862,month:3};  // simulate the date advancing across the handover
      cabOnResolve('US','win',{},C,true);
      if(C.president.cabHolders.war!=='us-stanton') throw new Error('snapshot should update to Stanton, got '+C.president.cabHolders.war);
      var logged=C.president.log.join(' || ');
      if(logged.indexOf('Stanton')<0) throw new Error('handover should log Stanton, log='+logged);
      if(!(C.president.log.length>logLen0)) throw new Error('a dispatch should have been logged');
      return { newHolder:C.president.cabHolders.war, logLine:C.president.log[0] }; });

    step('presRenderCabinet shows the sitting secretaries + the ambition tell; wire does not throw', function(){
      var C=mkC('US',1863,6);
      var html=presRenderCabinet(C);
      ['Stanton','Chase','Seward','Welles'].forEach(function(n){ if(html.indexOf(n)<0) throw new Error('render missing '+n); });
      if(html.indexOf('Ambition')<0) throw new Error('Chase ambition tell should render');
      if(html.indexOf('Heed')<0) throw new Error('a Heed action should render for a non-delegated advisor');
      // inject + wire (exercise getElementById paths)
      var wrap=document.createElement('div'); wrap.id='wdContent'; wrap.innerHTML=html; document.body.appendChild(wrap);
      var threw=false; try{ presWireCabinet(C); }catch(e){ threw=true; }
      var hasBtn=!!document.getElementById('cabAcc_treasury');
      document.body.removeChild(wrap);
      if(threw) throw new Error('presWireCabinet threw');
      if(!hasBtn) throw new Error('Heed button (cabAcc_treasury) not in DOM');
      return { rendered:true, wired:true, len:html.length }; });

    step('cabinetLeadership is bounded and reflects the sitting War Secretary', function(){
      var Cgood=mkC('US',1863,6);   // Stanton at War
      var Cbad=mkC('CS',1861,4);    // Walker at War
      var lg=cabinetLeadership(Cgood), lb=cabinetLeadership(Cbad);
      if(!(lg>=40&&lg<=85)||!(lb>=40&&lb<=85)) throw new Error('leadership out of bounds: '+lg+'/'+lb);
      if(!(lg>lb)) throw new Error('Stanton-led cabinet should out-lead Walker-led: '+lg+' vs '+lb);
      return { stantonLead:lg, walkerLead:lb }; });

    step('HEED political capital is capped once-per-turn across ALL domains (D49.5)', function(){
      var C=mkC('US',1863,6); C.clock.capital=10; C.clock.weariness=50; C.warroom.supply=40; C.clock.intervention=30; C.president.turn=0;
      ['war','treasury','state','navy'].forEach(function(d){ C.president.cabinetState[d].delegated=false; });
      _cabHeed(C,'treasury'); _cabHeed(C,'war'); _cabHeed(C,'state');
      if(C.clock.capital!==11) throw new Error('capital should rise by exactly 1 across 3 heeds (once/turn), got '+C.clock.capital+' from 10');
      if(C.clock.weariness!==48) throw new Error('treasury micro-effect should still apply: weariness '+C.clock.weariness);
      if(C.warroom.supply!==42) throw new Error('war micro-effect should still apply: supply '+C.warroom.supply);
      if(C.clock.intervention!==28) throw new Error('state micro-effect should still apply: intervention '+C.clock.intervention);
      return { capital:C.clock.capital, weariness:C.clock.weariness, supply:C.warroom.supply, intervention:C.clock.intervention }; });

    step('corrupt save shapes are hardened — no crash, no silent dead UI (D49.1/2)', function(){
      var C=mkC('US',1863,6); C.president.date='1863-06';   // primitive date: strict-mode TypeError risk
      var threw=false; try{ presInit(C); cabInit(C); }catch(e){ threw=true; }
      if(threw) throw new Error('primitive date crashed presInit/cabInit');
      if(typeof C.president.date!=='object') throw new Error('primitive date not repaired to an object');
      var html=''; try{ html=presRenderCabinet(C); }catch(e){ throw new Error('render threw on the repaired save'); }
      if(!html || html.length<100) throw new Error('render produced no content after repair');
      var C2=mkC('US',1863,6); C2.president.cabinetState=[1,2,3];   // array cabinetState: silent dead UI risk
      cabInit(C2);
      if(Array.isArray(C2.president.cabinetState)) throw new Error('array cabinetState survived cabInit');
      if(typeof C2.president.cabinetState.war!=='object') throw new Error('cabinetState.war not a real object after rebuild');
      C2.clock.weariness=50; C2.president.turn=0; _cabHeed(C2,'treasury');
      if(C2.clock.weariness!==48) throw new Error('Heed was a silent no-op after the array rebuild');
      return { datePrimitiveRepaired:true, arrayRebuilt:true, heedWorks:true }; });

    step('cabOnResolve names the TENURE-predecessor, not the stale snapshot, on a multi-tenure date LEAP (D49.3)', function(){
      var C=mkC('CS',1862,6);   // cabHolders snapshots at the INIT date (1861-04) -> Walker (the stale snapshot)
      if(C.president.cabHolders.war!=='cs-walker') throw new Error('init snapshot should be Walker (1861-04), got '+C.president.cabHolders.war);
      C.president.date={year:1863,month:6};   // LEAP across Benjamin + Randolph to Seddon in one tick
      cabOnResolve('CS','win',{},C,true);
      if(C.president.cabHolders.war!=='cs-seddon') throw new Error('snapshot should advance to Seddon, got '+C.president.cabHolders.war);
      var log=C.president.log.join(' || ');
      if(log.indexOf('Seddon')<0) throw new Error('handover should name Seddon, log='+log);
      if(log.indexOf('Randolph')<0) throw new Error('predecessor should be the tenure-immediate Randolph, log='+log);
      if(log.indexOf('Walker')>=0) throw new Error('predecessor must NOT be the stale-snapshot Walker (the D49.3 bug), log='+log);
      return { newHolder:C.president.cabHolders.war, logLine:C.president.log[0] }; });
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
    writeFileSync(join(OUT,'probe-cabinet.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-cabinet ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-cabinet.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-cabinet.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-cabinet: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-cabinet: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-cabinet: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
