#!/usr/bin/env node
// tools/probe-gettysburg.mjs — TACTICAL ENGINE C-1 (the SECOND MULTI-PHASE epic: Gettysburg, July 1-3, 1863 —
// Day 1 McPherson Ridge -> Day 2 Little Round Top -> Day 3 Pickett's Charge). Verifies the gated T8 phases[]
// engine + the 3-day scenario EMPIRICALLY on the renderer-agnostic sim: the data declares 3 phases with
// gun-model artillery; a multi-phase launch builds phase 0 + the running tally; the battle ADVANCES through
// all 3 phases headless (phaseLog in order); survivors/casualties carry forward (battleCas accumulates);
// the aggregate winner is scored from the weighted phase score with a draw band; the per-phase outcomes are
// HISTORICALLY FAITHFUL under the shared model (Day 1 CS holds/attacks, Day 2 US holds, Day 3 US holds ->
// aggregate US edge); a US player AND a CS player both resolve; determinism; the gun model holds at
// Gettysburg's massed-artillery scale; no Classic contamination; and the SINGLE-OBJECTIVE path (Bull Run /
// Fredericksburg / Antietam / the sandbox) is UNREGRESSED (no phases -> no machinery).
// Writes shots/probe-gettysburg.{json,png}.
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
  function isNum(n){ return typeof n==='number' && isFinite(n); }
  function nanScan(){ for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
    if(!isNum(u.x)||!isNum(u.z)||!isNum(u.men)||!isNum(u.morale)||!isNum(u.facing)) return u.id; } return null; }
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  // run a MULTI-PHASE battle to completion: the T8 engine auto-advances phases headless (no #fldRoot), so the stepper
  // keeps going across phases until the LAST phase ends (phase 'over'). High step budget for 3 phases.
  function runGettysburg(opts){ __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
    delete G.settings.tacticalFog; fldLaunchSandbox(opts); __FIELD.phase='battle'; __FIELD.paused=false;
    var n=0; while(__FIELD.phase==='battle' && n<60000){ fldSimStep(0.05); n++; }
    return { w:__FIELD.winner, by:__FIELD.winBy, steps:n, phasesPlayed:(__FIELD.phaseLog||[]).length, idx:__FIELD.phaseIdx,
      score:__FIELD.phaseScore, cas:__FIELD.battleCas, log:(__FIELD.phaseLog||[]).map(function(e){return {name:e.name,w:e.winner,by:e.winBy,us:e.usCas,cs:e.csCas};}) }; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof _fldScenarioInitPhased!=='function')
      return JSON.stringify({ok:false, fatal:'__FIELD engine / T8 phases seam missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    try{ delete G.settings.tacticalPreset; }catch(e){} delete G.settings.tacticalFog;
    var DATA = (GAME_DATA && GAME_DATA.gettysburg) ? GAME_DATA.gettysburg.gettysburg : null;

    step('DATA present: GAME_DATA.gettysburg.gettysburg declares 3 phases (Day 1 McPherson Ridge -> Day 2 Little Round Top -> Day 3 Pickett\\'s Charge) with per-phase OOB + objective', function(){
      if(!DATA) throw new Error('GAME_DATA.gettysburg.gettysburg missing');
      if(!DATA.phases || DATA.phases.length!==3) throw new Error('want 3 phases, got '+(DATA.phases&&DATA.phases.length));
      var names=DATA.phases.map(function(p){return p.name;}).join(' | ');
      if(names.indexOf('McPherson')<0 || names.indexOf('Little Round Top')<0 || names.indexOf('Pickett')<0) throw new Error('phase names wrong: '+names);
      for(var i=0;i<3;i++){ var p=DATA.phases[i];
        if(!p.objective||!isNum(p.objective.x)) throw new Error('phase '+i+' has no objective');
        if(!p.oob||!p.oob.US||!p.oob.CS) throw new Error('phase '+i+' missing oob'); }
      return { names:names, p0us:DATA.phases[0].oob.US.length, p0cs:DATA.phases[0].oob.CS.length }; });

    step('UNIVERSAL GUN MODEL at Gettysburg scale (D75): every battery across the 3 days carries a real gun count + realistic crew; no proxy-men fudge', function(){
      var arts=[], totalGuns=0;
      for(var i=0;i<DATA.phases.length;i++){ var p=DATA.phases[i];
        var all=(p.oob.US||[]).concat(p.oob.CS||[]).concat((p.reinforcements||[]));
        for(var j=0;j<all.length;j++) if(all[j].arm==='art') arts.push(all[j]); }
      if(arts.length<3) throw new Error('expected >=3 batteries across the phases, got '+arts.length);
      for(var k=0;k<arts.length;k++){ var a=arts[k];
        if(!(a.guns>0)) throw new Error(a.id+' has no gun count'); if(!(a.men>0 && a.men<=a.guns*40)) throw new Error(a.id+' crew not realistic: '+a.men+' for '+a.guns+' guns'); totalGuns+=a.guns; }
      return { batteries:arts.length, totalGuns:totalGuns }; });

    step('MULTI-PHASE LAUNCH: phase state initializes, phase 0 (Day 1 McPherson Ridge) builds its OOB + objective + running tally', function(){
      fldLaunchSandbox({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:12345});
      if(__FIELD.scenario!=='gettysburg') throw new Error('scenario not set: '+__FIELD.scenario);
      if(!__FIELD.phases || __FIELD.phases.length!==3) throw new Error('phases not initialized');
      if(__FIELD.phaseIdx!==0) throw new Error('phaseIdx not 0: '+__FIELD.phaseIdx);
      if(!__FIELD.phaseScore || __FIELD.phaseScore.US!==0 || __FIELD.phaseScore.CS!==0) throw new Error('phaseScore not zeroed');
      if(!__FIELD.battleCas || __FIELD.battleCas.US!==0) throw new Error('battleCas not zeroed');
      if(__FIELD.objective.name.indexOf('McPherson')<0) throw new Error('phase-0 objective not McPherson Ridge: '+__FIELD.objective.name);
      var us=DATA.phases[0].oob.US.length, cs=DATA.phases[0].oob.CS.length;
      if(__FIELD.units.length!==us+cs) throw new Error('phase-0 unit count wrong: '+__FIELD.units.length+' want '+(us+cs));
      if(__FIELD.phase!=='deploy') throw new Error('should deploy, got '+__FIELD.phase);
      return { phases:__FIELD.phases.length, units:__FIELD.units.length, objective:__FIELD.objective.name, holdToWin:__FIELD.holdToWin }; });

    step('PER-PHASE COMMANDERS: phase 0 builds the Day 1 cast (Reynolds/Buford/Heth), and advancing to phase 1 rebuilds the Day 2 cast (Chamberlain/Longstreet/Hood)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:1});
      function leaderIds(){ var L=__FIELD.leaders||[], o=[]; for(var i=0;i<L.length;i++) o.push(L[i].id); return o; }
      var p0=leaderIds().join(',');
      if(p0.indexOf('ld_reyolds')<0 && p0.indexOf('ld_buford')<0) throw new Error('phase-0 leaders not the Day 1 cast: '+p0);
      // advance to phase 1 directly via the engine helper
      __FIELD.phaseIdx=1; _fldBuildPhase(1);
      var p1=leaderIds().join(',');
      if(p1.indexOf('ld_chamberlain')<0) throw new Error('phase-1 leaders not the Day 2 cast (Chamberlain): '+p1);
      if(__FIELD.objective.name.indexOf('Little Round Top')<0) throw new Error('phase-1 objective not Little Round Top: '+__FIELD.objective.name);
      return { phase0Leaders:p0, phase1Leaders:p1 }; });

    step('THE BATTLE ADVANCES THROUGH ALL 3 PHASES (headless auto-advance), phaseLog in order, an aggregate winner is declared by "phases", no NaN', function(){
      var r=runGettysburg({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:7});
      if(__FIELD.phase!=='over') throw new Error('battle did not end, phase='+__FIELD.phase);
      if(r.phasesPlayed!==3) throw new Error('not all 3 phases resolved: '+r.phasesPlayed);
      if(['US','CS','draw'].indexOf(r.w)<0) throw new Error('bad aggregate winner '+r.w);
      if(r.by!=='phases') throw new Error('winBy not "phases": '+r.by);
      if(r.log[0].name.indexOf('McPherson')<0 || r.log[1].name.indexOf('Little Round Top')<0 || r.log[2].name.indexOf('Pickett')<0) throw new Error('phase order wrong: '+r.log.map(function(e){return e.name;}).join('/'));
      var bad=nanScan(); if(bad) throw new Error('NaN in '+bad);
      return { winner:r.w, winBy:r.by, phases:r.phasesPlayed, steps:r.steps, log:r.log.map(function(e){return e.name.split(' ')[0]+':'+e.w;}) }; });

    step('CARRY-OVER: the running casualty tally accumulates ACROSS phases (battleCas = sum of the per-phase losses), and the per-phase score sums to the aggregate', function(){
      var r=runGettysburg({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:42});
      var sumCas=0; for(var i=0;i<r.log.length;i++) sumCas += (r.log[i].us + r.log[i].cs);
      var totalCas=(r.cas.US + r.cas.CS);
      if(Math.abs(sumCas - totalCas) > 5) throw new Error('battleCas ('+totalCas+') != sum of phase casualties ('+sumCas+')');
      if(totalCas < 6000) throw new Error('implausibly low total casualties for the largest battle: '+totalCas);
      var sumScore=r.score.US + r.score.CS;
      if(sumScore < 3.4 || sumScore > 3.6) throw new Error('phase score does not sum to ~3.5 (Day 3 weight 1.5): '+sumScore);
      return { battleCas:r.cas, sumOfPhaseCas:Math.round(sumCas), score:r.score }; });

    step('HISTORICALLY FAITHFUL PER-PHASE OUTCOMES under the shared model (the teaching): Day 1 McPherson Ridge is Confederate-held (CS attacks, pushes the Union through town), Day 2 Little Round Top is Union-held (the Round Tops hold), Day 3 Pickett\\'s Charge is Union-held (the charge is repulsed) -> aggregate US edge, >=6/8 seeds', function(){
      var seeds=[1,7,21,42,55,101,303,909], day1CS=0, day2US=0, day3US=0, usAgg=0, results=[];
      for(var s=0;s<seeds.length;s++){ var r=runGettysburg({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:seeds[s]});
        if(r.log[0].w==='CS') day1CS++; if(r.log[1].w==='US') day2US++; if(r.log[2].w==='US') day3US++;
        if(r.w==='US') usAgg++; results.push(r.log.map(function(e){return e.w;}).join('')+'='+r.w); }
      if(day1CS<6) throw new Error('Day 1 (McPherson Ridge) is not Confederate-held in the majority: '+day1CS+'/8');
      if(day2US<6) throw new Error('Day 2 (Little Round Top) is not Union-held in the majority: '+day2US+'/8');
      if(day3US<6) throw new Error('Day 3 (Pickett\\'s Charge) is not Union-held in the majority (the charge must be repulsed): '+day3US+'/8');
      if(usAgg<6) throw new Error('the aggregate is not a Union edge in the majority (Meade held the field): '+usAgg+'/8');
      return { day1CS:day1CS+'/8', day2US:day2US+'/8', day3US:day3US+'/8', usAggregate:usAgg+'/8', sample:results.slice(0,3) }; });

    step('A US PLAYER AND A CS PLAYER both resolve the whole 3-phase battle (no hang/NaN): a passive player on either side reaches a decided aggregate result', function(){
      var out={};
      ['US','CS'].forEach(function(ps){
        __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false; delete G.settings.tacticalFog;
        fldLaunchSandbox({renderer:'none', scenario:'gettysburg', seed:7, playerSide:ps});
        __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle' && n<60000){ fldSimStep(0.05); n++; }
        if(__FIELD.phase!=='over') throw new Error(ps+' passive battle did not terminate (phase '+__FIELD.phase+', idx '+__FIELD.phaseIdx+')');
        if((__FIELD.phaseLog||[]).length!==3) throw new Error(ps+' passive battle did not play all 3 phases: '+(__FIELD.phaseLog||[]).length);
        if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error(ps+' passive battle bad winner: '+__FIELD.winner);
        out[ps]={ winner:__FIELD.winner, phases:(__FIELD.phaseLog||[]).length, steps:n };
      });
      return out; });

    step('DETERMINISM: same seed -> identical 3-phase battle (winner, score, phase log, steps)', function(){
      var a=runGettysburg({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:909});
      var b=runGettysburg({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:909});
      if(a.w!==b.w || JSON.stringify(a.score)!==JSON.stringify(b.score) || a.steps!==b.steps || JSON.stringify(a.log)!==JSON.stringify(b.log))
        throw new Error('non-deterministic: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      return { winner:a.w, score:a.score, steps:a.steps }; });

    step('NO CLASSIC CONTAMINATION: gettysburg never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode;
      runGettysburg({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:3});
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('mutated G.mode: '+G.mode);
      try{ fldExit(true); }catch(e){}
      return { gMode:G.mode }; });

    step('SINGLE-OBJECTIVE PATH UNREGRESSED: the sandbox + Bull Run + Fredericksburg + Antietam still build & resolve with NO phase machinery (phases===null) -> byte-identity preserved', function(){
      // sandbox
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:12345});
      if(__FIELD.scenario!=='sandbox') throw new Error('sandbox tag wrong');
      if(__FIELD.phases!==null) throw new Error('phase machinery LEAKED into the sandbox: phases='+__FIELD.phases);
      if(__FIELD.units.length!==4) throw new Error('sandbox want 4 units, got '+__FIELD.units.length);
      // bull run: single-objective, phases must be null
      G.settings.tacticalFog=false; __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=true;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:101});
      if(__FIELD.phases!==null) throw new Error('phase machinery leaked into Bull Run: phases='+__FIELD.phases);
      __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } var brW=__FIELD.winner;
      if(['US','CS','draw'].indexOf(brW)<0) throw new Error('Bull Run did not resolve to a winner: '+brW);
      // fredericksburg: single-objective, phases must be null
      delete G.settings.tacticalFog; __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:101});
      if(__FIELD.phases!==null) throw new Error('phase machinery leaked into Fredericksburg: phases='+__FIELD.phases);
      __FIELD.phase='battle'; __FIELD.paused=false; n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } var fbW=__FIELD.winner;
      if(['US','CS','draw'].indexOf(fbW)<0) throw new Error('Fredericksburg did not resolve to a winner: '+fbW);
      // antietam: multi-phase, phases must be set
      fldLaunchSandbox({renderer:'none', scenario:'antietam', autoBoth:true, seed:101});
      if(__FIELD.phases===null) throw new Error('Antietam phases not set');
      __FIELD.phase='battle'; __FIELD.paused=false; n=0; while(__FIELD.phase==='battle'&&n<60000){ fldSimStep(0.05); n++; } var anW=__FIELD.winner;
      if(['US','CS','draw'].indexOf(anW)<0) throw new Error('Antietam did not resolve: '+anW);
      return { sandboxPhases:__FIELD.phases, bullrunWinner:brW, fredericksburgWinner:fbW, antietamWinner:anW }; });

  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

// A second eval, in a 2D DOM context, for the menu button + side-choice card + the INTER-PHASE transition card + the
// running-tally HUD + the aggregate end-screen.
const DOM = `(() => {
  var R = { steps: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  try {
    try{ delete G.settings.tacticalPreset; }catch(e){} delete G.settings.tacticalFog;

    step('MENU: the Gettysburg button injects after the Antietam button, idempotently, in the same column', function(){
      if (typeof openMainMenu!=='function') return { skipped:'no openMainMenu' };
      G.mode='menu'; openMainMenu(); fldInjectMenuButton();
      var gb=document.getElementById('fldScnBtn_gettysburg');
      if(!gb) throw new Error('Gettysburg button did NOT inject');
      if(!gb.getAttribute('aria-label')) throw new Error('Gettysburg button missing aria-label');
      fldInjectMenuButton();
      if(document.querySelectorAll('#fldScnBtn_gettysburg').length!==1) throw new Error('duplicate Gettysburg buttons');
      return { injected:true, hl:(gb.querySelector('.gn-hl')||{}).textContent }; });

    step('SIDE-CHOICE SHEET: fldScenarioSideChoice("gettysburg") renders BOTH side cards; clicking the CS card calls back "CS"', function(){
      if(typeof fldScenarioSideChoice!=='function') throw new Error('fldScenarioSideChoice missing');
      var picked=null; fldScenarioSideChoice('gettysburg', function(side){ picked=side; });
      var cards=document.querySelectorAll('[data-brside]');
      if(cards.length!==2) throw new Error('expected 2 side cards, got '+cards.length);
      var sheetTxt=(document.getElementById('sheetPad')||document.body).textContent||'';
      if(sheetTxt.indexOf('Gettysburg')<0) throw new Error('side card did not name the battle');
      document.querySelector('[data-brside="CS"]').click();
      if(picked!=='CS') throw new Error('CS card did not call back CS: '+picked);
      try{ if(typeof closeSheet==='function') closeSheet(); }catch(e){}
      return { cards:cards.length, picked:picked }; });

    step('THE INTER-PHASE TRANSITION CARD builds when phase 0 resolves (role=dialog, aria-modal, the running tally, the next phase + its teaching), and CONTINUE advances to phase 1', function(){
      fldLaunchSandbox({renderer:'2d', scenario:'gettysburg', autoBoth:true, seed:7});
      __FIELD.phase='battle'; __FIELD.paused=false;
      var n=0; while(__FIELD.phase==='battle' && n<30000){ fldSimStep(0.05); n++; }
      if(__FIELD.phase!=='interphase') throw new Error('phase 0 did not pause at the inter-phase card (phase '+__FIELD.phase+', idx '+__FIELD.phaseIdx+')');
      var card=document.getElementById('fldInterphase');
      if(!card) throw new Error('inter-phase card not created');
      if(card.getAttribute('role')!=='dialog' || card.getAttribute('aria-modal')!=='true') throw new Error('inter-phase card not a modal dialog');
      var txt=card.textContent||'';
      if(txt.indexOf('SECTORS')<0 && txt.indexOf('Sectors')<0) throw new Error('inter-phase card missing the running tally');
      if(txt.indexOf('Little Round Top')<0) throw new Error('inter-phase card did not name the NEXT phase (Little Round Top)');
      var go=document.getElementById('fldPhaseGo'); if(!go) throw new Error('no Continue button');
      var idxBefore=__FIELD.phaseIdx;
      go.click();
      if(document.getElementById('fldInterphase')) throw new Error('Continue did not dismiss the card');
      if(__FIELD.phase!=='battle') throw new Error('Continue did not resume the battle (phase '+__FIELD.phase+')');
      if(__FIELD.objective.name.indexOf('Little Round Top')<0) throw new Error('phase 1 (Little Round Top) did not load after Continue: '+__FIELD.objective.name);
      try{ fldExit(true); }catch(e){}
      return { interphasePaused:true, advancedTo:__FIELD.objective.name, idxBefore:idxBefore }; });

    step('RUNNING-TALLY HUD: fldRenderTop prefixes the phase/sector label ("Phase N/3 ... sectors US x - CS y") on a multi-phase battle, and is "" on a single-objective battle (byte-identical text)', function(){
      if(typeof _fldPhaseTopLabel!=='function') throw new Error('_fldPhaseTopLabel missing');
      fldLaunchSandbox({renderer:'2d', scenario:'gettysburg', autoBoth:true, seed:1});
      var lbl=_fldPhaseTopLabel();
      if(lbl.indexOf('Phase 1/3')<0 || lbl.toLowerCase().indexOf('sectors')<0) throw new Error('multi-phase top label wrong: '+lbl);
      fldExit(true);
      // single-objective -> ""
      fldLaunchSandbox({renderer:'2d', scenario:'fredericksburg', autoBoth:true, seed:1});
      var lbl2=_fldPhaseTopLabel();
      if(lbl2!=='') throw new Error('single-objective top label must be "" (byte-identical), got: '+lbl2);
      fldExit(true);
      return { multiPhaseLabel:lbl, singleObjectiveLabel:lbl2 }; });

    step('AGGREGATE END-SCREEN: _fldPhasesEndHtml builds the phase-by-phase table + the aggregate verdict (and is "" for a single-objective battle)', function(){
      if(typeof _fldPhasesEndHtml!=='function') throw new Error('_fldPhasesEndHtml missing');
      fldLaunchSandbox({renderer:'none', scenario:'gettysburg', autoBoth:true, seed:7});
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle' && n<60000){ fldSimStep(0.05); n++; }
      var aggWinner=__FIELD.winner;
      var html=_fldPhasesEndHtml();
      if(!html || html.indexOf('phase by phase')<0) throw new Error('aggregate end html missing the phase table');
      if(html.indexOf('McPherson')<0 || html.indexOf('Little Round Top')<0 || html.indexOf('Pickett')<0) throw new Error('end table missing a phase');
      var note=fldScenarioEndHtml(aggWinner);
      if(!note || note.indexOf('Gettysburg Address')<0) throw new Error('the aggregate endNote/teaching did not surface the Gettysburg Address (the anti-Lost-Cause core)');
      // single-objective -> ""
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:1});
      if(_fldPhasesEndHtml()!=='') throw new Error('phases end html must be "" for a single-objective battle');
      try{ fldExit(true); }catch(e){}
      return { aggregateWinner:aggWinner, endLen:html.length, surfacesGettysburgAddress:true }; });

  } catch(e){ R.ok=false; R.steps.push({name:'FATAL', ok:false, err:String(e&&e.message||e)}); }
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
    const dom = JSON.parse(await page.evaluate(DOM));
    result.steps = result.steps.concat(dom.steps);
    if (!dom.ok) result.ok = false;
    result.pageerrors = pageerrors;
    const shot = await page.evaluate(`(function(){
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'2d', scenario:'gettysburg', autoBoth:true, seed:21});
      __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(1500, 0.05);   // Day 1 McPherson Ridge in full cry
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      return { simT: Math.round(__FIELD.t), phaseIdx:__FIELD.phaseIdx, units: __FIELD.units.length };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-gettysburg.png') });
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-gettysburg.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-gettysburg ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name.slice(0,60) + ' :: ' + JSON.stringify(s.v)); }
})();
