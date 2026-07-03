#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-prisoner-exchange.mjs — D161 prisoner-exchange collapse gate.
// Verifies source-backed data, default exact-zero bridge input, capped relief,
// resolve-time detained/returned/death ledger, save sanitation, War Effort UI,
// and no tactical/classic contamination.
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

const sourceText = readFileSync(join(ROOT, 'src', '62-prisoner-exchange.js'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?2000:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock) C.clock.year=year||1864; if(C.president && C.president.date) C.president.date.year=year||1864;
    if(C.manpower) C.manpower.usctUnlocked = (year||1864) >= 1863; return C; }
  function fakeB(side, id, year, type){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=2400; c[e]=1800;
    return { playerSide:side, enemySide:e, bd:{id:id||'x',name:'Engagement',year:year||1864}, casualties:c, infl:{}, units:[], type:type||'loss' }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';

    step('data loads with Verified profiles, timeline, camps, and debates', function(){
      var D=GAME_DATA && GAME_DATA['prisoner-exchange'];
      if(!D || D.schema!=='cw_prisoner_exchange_v1') throw new Error('missing prisoner-exchange data/schema');
      ['US','CS'].forEach(function(s){ var p=D.profiles&&D.profiles[s]; if(!p) throw new Error('missing profile '+s);
        if(p.provenance!=='Verified') throw new Error('profile '+s+' not Verified');
        if(!Array.isArray(p.sources)||p.sources.length<2) throw new Error('profile '+s+' needs >=2 sources');
        if((p.teaching||'').indexOf('USCT')<0 && s==='US') throw new Error('US profile should name USCT fault line'); });
      if(!Array.isArray(D.policyTimeline)||D.policyTimeline.length<4) throw new Error('missing policy timeline');
      if(!Array.isArray(D.camps)||D.camps.length<2) throw new Error('missing camp cases');
      if(!Array.isArray(D.debates)||D.debates.length<2) throw new Error('missing debates');
      D.policyTimeline.concat(D.camps).concat(D.debates).forEach(function(x){ if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+x.id); });
      return { schema:D.schema, timeline:D.policyTimeline.length, camps:D.camps.length };
    });

    step('default bridge input is exact zero and does not move army facets', function(){
      var C=mkC('US',1864);
      C.prisoners.detained.US=5000; C.prisoners.detained.CS=4200;
      var a0=bridgeArmy(C);
      var b=prisonerExchangeBridgeBonus(C);
      var a1=bridgeArmy(C);
      if(b.morale!==0 || b.supply!==0 || b.fatigue!==0 || b.overall!==0) throw new Error('inactive bridge should be exact zero: '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(a0[k]!==a1[k]) throw new Error(k+' changed while inactive: '+a0[k]+'->'+a1[k]); });
      return { bridge:b, army:{overall:a1.overall,morale:a1.morale,supply:a1.supply,fatigue:a1.fatigue} };
    });

    step('active relief priority is bounded and explicit', function(){
      var C=mkC('US',1864);
      C.prisoners.detained.US=6000; C.prisoners.detained.CS=3500;
      var before=bridgeArmy(C);
      prisonerExchangeSetPriority(C,'cartelRelief');
      var bonus=prisonerExchangeBridgeBonus(C), after=bridgeArmy(C), caps=GAME_DATA['prisoner-exchange'].config.bridgeCaps;
      if(!bonus.active) throw new Error('bonus should be active');
      if(bonus.morale<0 || bonus.morale>caps.morale) throw new Error('morale outside cap '+bonus.morale);
      if(bonus.fatigue>0 || Math.abs(bonus.fatigue)>caps.fatigueRelief) throw new Error('fatigue outside cap '+bonus.fatigue);
      if(bonus.supply>0 || Math.abs(bonus.supply)>caps.supplyCost) throw new Error('supply cost outside cap '+bonus.supply);
      if(bonus.overall<0 || bonus.overall>caps.overall) throw new Error('overall outside cap '+bonus.overall);
      if(after.morale<before.morale) throw new Error('relief should not lower morale');
      if(after.fatigue>before.fatigue) throw new Error('relief should not raise fatigue');
      return { before:before, after:after, bonus:bonus };
    });

    step('resolve tracks cartel collapse without pretending exchange is fixed', function(){
      var C=mkC('US',1864);
      C.prisoners.detained.US=5000; C.prisoners.detained.CS=3000;
      var snap0=prisonerExchangeSnapshot(C);
      prisonerExchangeOnResolve('CS','loss',fakeB('US','wilderness',1864,'loss'),C,false);
      var snap1=prisonerExchangeSnapshot(C);
      if(snap1.stage!=='collapsed') throw new Error('1864 should be collapsed, got '+snap1.stage);
      if(!C.prisoners.lastTurn || C.prisoners.lastTurn.pressure<40) throw new Error('lastTurn pressure not recorded');
      if(C.prisoners.returned.US<=0 && C.prisoners.returned.CS<=0) throw new Error('some exchange trickle should still be recorded');
      if(snap1.pressure>100 || snap1.pressure<0) throw new Error('pressure outside bounds');
      return { before:snap0, after:snap1, last:C.prisoners.lastTurn };
    });

    step('active relief mitigates deaths/returns but does not reopen the cartel', function(){
      var I=mkC('US',1864), A=mkC('US',1864);
      I.prisoners.detained.US=9000; I.prisoners.detained.CS=7000;
      A.prisoners.detained.US=9000; A.prisoners.detained.CS=7000; prisonerExchangeSetPriority(A,'cartelRelief');
      prisonerExchangeOnResolve('CS','loss',fakeB('US','coldharbor',1864,'loss'),I,false);
      var inactive={ returned:I.prisoners.lastTurn.returned.US, deaths:I.prisoners.lastTurn.deaths.US, detained:I.prisoners.lastTurn.detained.US };
      var strengthBefore=A.manpower.strength;
      prisonerExchangeOnResolve('CS','loss',fakeB('US','coldharbor',1864,'loss'),A,false);
      var active={ returned:A.prisoners.lastTurn.returned.US, deaths:A.prisoners.lastTurn.deaths.US, detained:A.prisoners.lastTurn.detained.US, strength:A.manpower.strength };
      if(!(active.returned>inactive.returned)) throw new Error('relief should increase returns: '+JSON.stringify({inactive,active}));
      if(!(active.deaths<inactive.deaths)) throw new Error('relief should reduce deaths: '+JSON.stringify({inactive,active}));
      if(A.prisoners.lastTurn.stage!=='collapsed') throw new Error('relief must not reopen cartel');
      if(!(A.manpower.strength>=strengthBefore)) throw new Error('returned prisoners should not reduce strength');
      return { inactive:inactive, active:active };
    });

    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1864);
      C.prisoners={active:'yes', priority:'bad', detained:{US:-4,CS:'12'}, returned:'bad', deaths:[], log:'oops', lastTurn:'bad', lastBridge:[]};
      prisonersInit(C);
      if(C.prisoners.active!==false) throw new Error('active not sanitized');
      if(C.prisoners.priority!==null) throw new Error('priority not sanitized');
      if(C.prisoners.detained.US!==0 || C.prisoners.detained.CS!==12) throw new Error('detained not sanitized: '+JSON.stringify(C.prisoners.detained));
      if(!Array.isArray(C.prisoners.log)) throw new Error('log not array');
      if(C.prisoners.lastTurn!==null || C.prisoners.lastBridge!==null) throw new Error('last fields not nulled');
      return C.prisoners;
    });

    step('War Effort UI renders, teaches USCT fault line, and toggle wires', function(){
      var C=mkC('US',1864);
      C.prisoners.detained.US=4500; C.prisoners.detained.CS=3200;
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if(h.indexOf('Prisoner Exchange &amp; Camps')<0) throw new Error('prisoner block missing');
      if(h.indexOf('USCT')<0) throw new Error('USCT fault-line copy missing');
      if(h.indexOf('Andersonville')<0 || h.indexOf('Elmira')<0) throw new Error('camp teaching copy missing');
      var b=document.getElementById('pxToggleRelief'); if(!b) throw new Error('relief button absent');
      b.click();
      if(!C.prisoners || C.prisoners.active!==true || C.prisoners.priority!=='cartelRelief') throw new Error('toggle did not activate');
      var bb=prisonerExchangeBridgeBonus(C); if(!bb.active) throw new Error('bridge not active after click');
      return { active:C.prisoners.active, bridge:bb, len:h.length };
    });

    step('no tactical/classic contamination from the strategic module', function(){
      var src = ${JSON.stringify(sourceText)};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=|\\.men\\s*=/.test(src)) throw new Error('prisoner module touched tactical engine/output fields');
      return { tacticalTokens:false };
    });
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
    await page.evaluate(() => {
      G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); if(C.clock) C.clock.year=1864; if(C.president&&C.president.date) C.president.date.year=1864; if(C.manpower) C.manpower.usctUnlocked=true;
      C.prisoners.detained.US=6500; C.prisoners.detained.CS=4200; prisonerExchangeSetPriority(C,'cartelRelief');
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var b=document.getElementById('pxToggleRelief'); if(b && b.scrollIntoView) b.scrollIntoView({block:'center'});
    });
    await sleep(250); await page.screenshot({ path: join(OUT,'prisoner-exchange.png'), fullPage:false, timeout:90000 });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-prisoner-exchange.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-prisoner-exchange ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-prisoner-exchange.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-prisoner-exchange.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-prisoner-exchange: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-prisoner-exchange: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-prisoner-exchange: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
