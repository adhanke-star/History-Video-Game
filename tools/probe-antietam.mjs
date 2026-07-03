#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-antietam.mjs — TACTICAL ENGINE C-2 (the FIRST MULTI-PHASE epic: Antietam / Sharpsburg, Sep 17 1862 —
// the Cornfield -> the Sunken Road 'Bloody Lane' -> Burnside's Bridge). Verifies the gated T8 phases[] engine + the
// 3-phase scenario EMPIRICALLY on the renderer-agnostic sim: the data declares 3 phases with gun-model artillery; a
// multi-phase launch builds phase 0 + the running tally; the battle ADVANCES through all 3 phases headless (phaseLog in
// order); survivors/casualties carry forward (battleCas accumulates); the aggregate winner is scored from the weighted
// phase score with a draw band; the per-phase outcomes are HISTORICALLY FAITHFUL under the shared model (Cornfield CS
// holds, Sunken Road US carries, Burnside's Bridge CS holds via A.P. Hill) -> aggregate CS 2-1; a US player AND a CS
// player both resolve; determinism; the gun model holds at Antietam's massed-artillery scale; no Classic contamination;
// and the SINGLE-OBJECTIVE path (Bull Run / Fredericksburg / the sandbox) is UNREGRESSED (no phases -> no machinery).
// Writes shots/probe-antietam.{json,png}.
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
  function runAntietam(opts){ __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
    delete G.settings.tacticalFog; fldLaunchSandbox(opts); __FIELD.phase='battle'; __FIELD.paused=false;
    var n=0; while(__FIELD.phase==='battle' && n<60000){ fldSimStep(0.05); n++; }
    return { w:__FIELD.winner, by:__FIELD.winBy, steps:n, phasesPlayed:(__FIELD.phaseLog||[]).length, idx:__FIELD.phaseIdx,
      score:__FIELD.phaseScore, cas:__FIELD.battleCas, log:(__FIELD.phaseLog||[]).map(function(e){return {name:e.name,w:e.winner,by:e.winBy,us:e.usCas,cs:e.csCas};}) }; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof _fldScenarioInitPhased!=='function')
      return JSON.stringify({ok:false, fatal:'__FIELD engine / T8 phases seam missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    try{ delete G.settings.tacticalPreset; }catch(e){} delete G.settings.tacticalFog;
    var DATA = (GAME_DATA && GAME_DATA.antietam) ? GAME_DATA.antietam.antietam : null;

    step('DATA present: GAME_DATA.antietam.antietam declares 3 phases (Cornfield -> Sunken Road -> Burnside\\'s Bridge) with per-phase OOB + objective', function(){
      if(!DATA) throw new Error('GAME_DATA.antietam.antietam missing');
      if(!DATA.phases || DATA.phases.length!==3) throw new Error('want 3 phases, got '+(DATA.phases&&DATA.phases.length));
      var names=DATA.phases.map(function(p){return p.name;}).join(' | ');
      if(names.indexOf('Cornfield')<0 || names.indexOf('Sunken Road')<0 || names.indexOf('Bridge')<0) throw new Error('phase names wrong: '+names);
      for(var i=0;i<3;i++){ var p=DATA.phases[i];
        if(!p.objective||!isNum(p.objective.x)) throw new Error('phase '+i+' has no objective');
        if(!p.oob||!p.oob.US||!p.oob.CS) throw new Error('phase '+i+' missing oob'); }
      return { names:names, p0us:DATA.phases[0].oob.US.length, p0cs:DATA.phases[0].oob.CS.length }; });

    step('UNIVERSAL GUN MODEL at Antietam scale (D75): every battery across the 3 phases carries a real gun count + realistic crew (S.D. Lee\\'s ~12-gun "Artillery Hell" battalion; no proxy-men fudge)', function(){
      var arts=[], totalGuns=0;
      for(var i=0;i<DATA.phases.length;i++){ var p=DATA.phases[i];
        var all=(p.oob.US||[]).concat(p.oob.CS||[]).concat((p.reinforcements||[]));
        for(var j=0;j<all.length;j++) if(all[j].arm==='art') arts.push(all[j]); }
      if(arts.length<3) throw new Error('expected >=3 batteries across the phases, got '+arts.length);
      for(var k=0;k<arts.length;k++){ var a=arts[k];
        if(!(a.guns>0)) throw new Error(a.id+' has no gun count'); if(!(a.men>0 && a.men<=a.guns*40)) throw new Error(a.id+' crew not realistic: '+a.men+' for '+a.guns+' guns'); totalGuns+=a.guns; }
      var sdLee=null; for(var m=0;m<arts.length;m++) if(arts[m].id==='cs_sd_lee_arty') sdLee=arts[m];
      if(!sdLee || sdLee.guns<10) throw new Error("S.D. Lee's battalion not modeled at ~12 guns");
      return { batteries:arts.length, totalGuns:totalGuns, sdLeeGuns:sdLee.guns }; });

    step('MULTI-PHASE LAUNCH: phase state initializes, phase 0 (the Cornfield) builds its OOB + objective + running tally', function(){
      fldLaunchSandbox({renderer:'none', scenario:'antietam', autoBoth:true, seed:12345});
      if(__FIELD.scenario!=='antietam') throw new Error('scenario not set: '+__FIELD.scenario);
      if(!__FIELD.phases || __FIELD.phases.length!==3) throw new Error('phases not initialized');
      if(__FIELD.phaseIdx!==0) throw new Error('phaseIdx not 0: '+__FIELD.phaseIdx);
      if(!__FIELD.phaseScore || __FIELD.phaseScore.US!==0 || __FIELD.phaseScore.CS!==0) throw new Error('phaseScore not zeroed');
      if(!__FIELD.battleCas || __FIELD.battleCas.US!==0) throw new Error('battleCas not zeroed');
      if(__FIELD.objective.name.indexOf('Dunker')<0) throw new Error('phase-0 objective not the Dunker Church plateau: '+__FIELD.objective.name);
      var us=DATA.phases[0].oob.US.length, cs=DATA.phases[0].oob.CS.length;
      if(__FIELD.units.length!==us+cs) throw new Error('phase-0 unit count wrong: '+__FIELD.units.length+' want '+(us+cs));
      if(__FIELD.phase!=='deploy') throw new Error('should deploy, got '+__FIELD.phase);
      return { phases:__FIELD.phases.length, units:__FIELD.units.length, objective:__FIELD.objective.name, holdToWin:__FIELD.holdToWin }; });

    step('PER-PHASE COMMANDERS: phase 0 builds the Cornfield cast (Hooker/Jackson), and advancing to phase 1 rebuilds the Sunken-Road cast (D.H. Hill) — the per-phase scenData view drives the officers layer', function(){
      fldLaunchSandbox({renderer:'none', scenario:'antietam', autoBoth:true, seed:1});
      function leaderIds(){ var L=__FIELD.leaders||[], o=[]; for(var i=0;i<L.length;i++) o.push(L[i].id); return o; }
      var p0=leaderIds().join(',');
      if(p0.indexOf('ld_jackson')<0 && p0.indexOf('ld_hooker')<0) throw new Error('phase-0 leaders not the Cornfield cast: '+p0);
      // advance to phase 1 directly via the engine helper
      __FIELD.phaseIdx=1; _fldBuildPhase(1);
      var p1=leaderIds().join(',');
      if(p1.indexOf('ld_dh_hill')<0) throw new Error('phase-1 leaders not the Sunken-Road cast (D.H. Hill): '+p1);
      if(__FIELD.objective.name.indexOf('Sunken Road')<0) throw new Error('phase-1 objective not the Sunken Road: '+__FIELD.objective.name);
      return { phase0Leaders:p0, phase1Leaders:p1 }; });

    step('THE BATTLE ADVANCES THROUGH ALL 3 PHASES (headless auto-advance), phaseLog in order, an aggregate winner is declared by "phases", no NaN', function(){
      var r=runAntietam({renderer:'none', scenario:'antietam', autoBoth:true, seed:7});
      if(__FIELD.phase!=='over') throw new Error('battle did not end, phase='+__FIELD.phase);
      if(r.phasesPlayed!==3) throw new Error('not all 3 phases resolved: '+r.phasesPlayed);
      if(['US','CS','draw'].indexOf(r.w)<0) throw new Error('bad aggregate winner '+r.w);
      if(r.by!=='phases') throw new Error('winBy not "phases": '+r.by);
      if(r.log[0].name.indexOf('Cornfield')<0 || r.log[1].name.indexOf('Sunken')<0 || r.log[2].name.indexOf('Bridge')<0) throw new Error('phase order wrong: '+r.log.map(function(e){return e.name;}).join('/'));
      var bad=nanScan(); if(bad) throw new Error('NaN in '+bad);
      return { winner:r.w, winBy:r.by, phases:r.phasesPlayed, steps:r.steps, log:r.log.map(function(e){return e.name.split(' ')[0]+':'+e.w;}) }; });

    step('CARRY-OVER: the running casualty tally accumulates ACROSS phases (battleCas = sum of the per-phase losses), and the per-phase score sums to the aggregate', function(){
      var r=runAntietam({renderer:'none', scenario:'antietam', autoBoth:true, seed:42});
      var sumCas=0; for(var i=0;i<r.log.length;i++) sumCas += (r.log[i].us + r.log[i].cs);
      var totalCas=(r.cas.US + r.cas.CS);
      if(Math.abs(sumCas - totalCas) > 5) throw new Error('battleCas ('+totalCas+') != sum of phase casualties ('+sumCas+')');
      if(totalCas < 4000) throw new Error('implausibly low total casualties for the bloodiest day: '+totalCas);
      var sumScore=r.score.US + r.score.CS;
      if(sumScore < 2.9 || sumScore > 3.1) throw new Error('phase score does not sum to ~3 (one weighted point per phase): '+sumScore);
      return { battleCas:r.cas, sumOfPhaseCas:Math.round(sumCas), score:r.score }; });

    step('HISTORICALLY FAITHFUL PER-PHASE OUTCOMES under the shared model (the teaching): the CORNFIELD is held by the Confederacy, the SUNKEN ROAD is CARRIED by the Union (Bloody Lane), and BURNSIDE\\'S BRIDGE is held by the Confederacy (A.P. Hill) -> aggregate CS edge, >=6/8 seeds', function(){
      var seeds=[1,7,21,42,55,101,303,909], cornfieldCS=0, laneUS=0, bridgeCS=0, csAgg=0, results=[];
      for(var s=0;s<seeds.length;s++){ var r=runAntietam({renderer:'none', scenario:'antietam', autoBoth:true, seed:seeds[s]});
        if(r.log[0].w==='CS') cornfieldCS++; if(r.log[1].w==='US') laneUS++; if(r.log[2].w==='CS') bridgeCS++;
        if(r.w==='CS') csAgg++; results.push(r.log.map(function(e){return e.w;}).join('')+'='+r.w); }
      if(cornfieldCS<6) throw new Error('the Cornfield is not Confederate-held in the majority: '+cornfieldCS+'/8');
      if(laneUS<6) throw new Error('the Union does not carry the Sunken Road in the majority (the Bloody Lane should fall): '+laneUS+'/8');
      if(bridgeCS<6) throw new Error("Burnside's Bridge is not Confederate-held in the majority (A.P. Hill must halt the breakthrough): "+bridgeCS+'/8');
      if(csAgg<6) throw new Error('the aggregate is not a Confederate tactical edge in the majority (Lee held the field): '+csAgg+'/8');
      return { cornfieldCS:cornfieldCS+'/8', laneUS:laneUS+'/8', bridgeCS:bridgeCS+'/8', csAggregate:csAgg+'/8', sample:results.slice(0,3) }; });

    step('A US PLAYER AND A CS PLAYER both resolve the whole 3-phase battle (no hang/NaN): a passive player on either side reaches a decided aggregate result', function(){
      var out={};
      ['US','CS'].forEach(function(ps){
        __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false; delete G.settings.tacticalFog;
        fldLaunchSandbox({renderer:'none', scenario:'antietam', seed:7, playerSide:ps});   // NOT autoBoth -> the player side idles, the other runs its AI
        __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle' && n<60000){ fldSimStep(0.05); n++; }
        if(__FIELD.phase!=='over') throw new Error(ps+' passive battle did not terminate (phase '+__FIELD.phase+', idx '+__FIELD.phaseIdx+')');
        if((__FIELD.phaseLog||[]).length!==3) throw new Error(ps+' passive battle did not play all 3 phases: '+(__FIELD.phaseLog||[]).length);
        if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error(ps+' passive battle bad winner: '+__FIELD.winner);
        out[ps]={ winner:__FIELD.winner, phases:(__FIELD.phaseLog||[]).length, steps:n };
      });
      return out; });

    step('DETERMINISM: same seed -> identical 3-phase battle (winner, score, phase log, steps)', function(){
      var a=runAntietam({renderer:'none', scenario:'antietam', autoBoth:true, seed:909});
      var b=runAntietam({renderer:'none', scenario:'antietam', autoBoth:true, seed:909});
      if(a.w!==b.w || JSON.stringify(a.score)!==JSON.stringify(b.score) || a.steps!==b.steps || JSON.stringify(a.log)!==JSON.stringify(b.log))
        throw new Error('non-deterministic: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      return { winner:a.w, score:a.score, steps:a.steps }; });

    step('NO CLASSIC CONTAMINATION: antietam never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode;
      runAntietam({renderer:'none', scenario:'antietam', autoBoth:true, seed:3});
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('mutated G.mode: '+G.mode);
      try{ fldExit(true); }catch(e){}
      return { gMode:G.mode }; });

    step('SINGLE-OBJECTIVE PATH UNREGRESSED: the sandbox + Bull Run + Fredericksburg still build & resolve with NO phase machinery (phases===null) -> byte-identity preserved', function(){
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
      return { sandboxPhases:__FIELD.phases, bullrunWinner:brW, fredericksburgWinner:fbW }; });

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

    step('MENU: the Antietam button injects after the sandbox/Bull Run/Fredericksburg buttons, idempotently, in the same column', function(){
      if (typeof openMainMenu!=='function') return { skipped:'no openMainMenu' };
      G.mode='menu'; openMainMenu(); fldInjectMenuButton();
      var ab=document.getElementById('fldScnBtn_antietam');
      if(!ab) throw new Error('Antietam button did NOT inject');
      if(!ab.getAttribute('aria-label')) throw new Error('Antietam button missing aria-label');
      fldInjectMenuButton();
      if(document.querySelectorAll('#fldScnBtn_antietam').length!==1) throw new Error('duplicate Antietam buttons');
      return { injected:true, hl:(ab.querySelector('.gn-hl')||{}).textContent }; });

    step('SIDE-CHOICE SHEET: fldScenarioSideChoice("antietam") renders BOTH side cards; clicking the CS card calls back "CS"', function(){
      if(typeof fldScenarioSideChoice!=='function') throw new Error('fldScenarioSideChoice missing');
      var picked=null; fldScenarioSideChoice('antietam', function(side){ picked=side; });
      var cards=document.querySelectorAll('[data-brside]');
      if(cards.length!==2) throw new Error('expected 2 side cards, got '+cards.length);
      var sheetTxt=(document.getElementById('sheetPad')||document.body).textContent||'';
      if(sheetTxt.indexOf('Antietam')<0) throw new Error('side card did not name the battle');
      document.querySelector('[data-brside="CS"]').click();
      if(picked!=='CS') throw new Error('CS card did not call back CS: '+picked);
      try{ if(typeof closeSheet==='function') closeSheet(); }catch(e){}
      return { cards:cards.length, picked:picked }; });

    step('THE INTER-PHASE TRANSITION CARD builds when phase 0 resolves (role=dialog, aria-modal, the running tally, the next phase + its teaching), and CONTINUE advances to phase 1', function(){
      fldLaunchSandbox({renderer:'2d', scenario:'antietam', autoBoth:true, seed:7});
      __FIELD.phase='battle'; __FIELD.paused=false;
      // run until the FIRST phase resolves -> the engine sets phase 'interphase' + shows the card (UI path: #fldRoot exists)
      var n=0; while(__FIELD.phase==='battle' && n<30000){ fldSimStep(0.05); n++; }
      if(__FIELD.phase!=='interphase') throw new Error('phase 0 did not pause at the inter-phase card (phase '+__FIELD.phase+', idx '+__FIELD.phaseIdx+')');
      var card=document.getElementById('fldInterphase');
      if(!card) throw new Error('inter-phase card not created');
      if(card.getAttribute('role')!=='dialog' || card.getAttribute('aria-modal')!=='true') throw new Error('inter-phase card not a modal dialog');
      var txt=card.textContent||'';
      if(txt.indexOf('SECTORS')<0 && txt.indexOf('Sectors')<0) throw new Error('inter-phase card missing the running tally');
      if(txt.indexOf('Sunken Road')<0) throw new Error('inter-phase card did not name the NEXT phase (the Sunken Road)');
      var go=document.getElementById('fldPhaseGo'); if(!go) throw new Error('no Continue button');
      var idxBefore=__FIELD.phaseIdx;
      go.click();   // advance
      if(document.getElementById('fldInterphase')) throw new Error('Continue did not dismiss the card');
      if(__FIELD.phase!=='battle') throw new Error('Continue did not resume the battle (phase '+__FIELD.phase+')');
      if(__FIELD.objective.name.indexOf('Sunken Road')<0) throw new Error('phase 1 (the Sunken Road) did not load after Continue: '+__FIELD.objective.name);
      try{ fldExit(true); }catch(e){}
      return { interphasePaused:true, advancedTo:__FIELD.objective.name, idxBefore:idxBefore }; });

    step('RUNNING-TALLY HUD: fldRenderTop exposes the compact phase/sector chip ("Phase N/3 ... US x / CS y") on a multi-phase battle, with fuller sector tooltip text available, and is "" on a single-objective battle (byte-identical text)', function(){
      if(typeof _fldPhaseTopLabel!=='function') throw new Error('_fldPhaseTopLabel missing');
      fldLaunchSandbox({renderer:'2d', scenario:'antietam', autoBoth:true, seed:1});
      var lbl=_fldPhaseTopLabel(), parts=(typeof _fldPhaseTopParts==='function')?_fldPhaseTopParts():null;
      if(lbl.indexOf('Phase 1/3')<0 || lbl.indexOf('US ')<0 || lbl.indexOf(' / CS ')<0) throw new Error('multi-phase top label wrong: '+lbl);
      if(!parts || parts.chip!==lbl || !parts.full || parts.full.toLowerCase().indexOf('sectors')<0) throw new Error('phase top parts wrong: '+JSON.stringify(parts));
      if(!document.getElementById('fldSector')) throw new Error('compact phase chip #fldSector missing from tactical top bar');
      fldExit(true);
      // single-objective -> ""
      fldLaunchSandbox({renderer:'2d', scenario:'fredericksburg', autoBoth:true, seed:1});
      var lbl2=_fldPhaseTopLabel();
      if(lbl2!=='') throw new Error('single-objective top label must be "" (byte-identical), got: '+lbl2);
      fldExit(true);
      return { multiPhaseLabel:lbl, fullLabel:parts.full, singleObjectiveLabel:lbl2 }; });

    step('AGGREGATE END-SCREEN: _fldPhasesEndHtml builds the phase-by-phase table + the aggregate verdict (and is "" for a single-objective battle)', function(){
      if(typeof _fldPhasesEndHtml!=='function') throw new Error('_fldPhasesEndHtml missing');
      // run a full battle headless-style in the DOM context to populate the phaseLog, then render the end html
      fldLaunchSandbox({renderer:'none', scenario:'antietam', autoBoth:true, seed:7});
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle' && n<60000){ fldSimStep(0.05); n++; }
      var aggWinner=__FIELD.winner;
      var html=_fldPhasesEndHtml();
      if(!html || html.indexOf('phase by phase')<0) throw new Error('aggregate end html missing the phase table');
      if(html.indexOf('Cornfield')<0 || html.indexOf('Sunken Road')<0 || html.indexOf('Bridge')<0) throw new Error('end table missing a phase');
      // the data-driven endNote (top-level) must also render via fldScenarioEndHtml on the aggregate winner
      var note=fldScenarioEndHtml(aggWinner);
      if(!note || note.indexOf('Emancipation')<0) throw new Error('the aggregate endNote/teaching did not surface the Emancipation Proclamation (the anti-Lost-Cause core)');
      // single-objective -> ""
      fldLaunchSandbox({renderer:'none', scenario:'fredericksburg', autoBoth:true, seed:1});
      if(_fldPhasesEndHtml()!=='') throw new Error('phases end html must be "" for a single-objective battle');
      try{ fldExit(true); }catch(e){}
      return { aggregateWinner:aggWinner, endLen:html.length, surfacesEmancipation:true }; });

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
      fldLaunchSandbox({renderer:'2d', scenario:'antietam', autoBoth:true, seed:21});
      __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(1500, 0.05);   // the Cornfield in full cry
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      return { simT: Math.round(__FIELD.t), phaseIdx:__FIELD.phaseIdx, units: __FIELD.units.length };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-antietam.png') });
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-antietam.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-antietam ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name.slice(0,60) + ' :: ' + JSON.stringify(s.v)); }
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-antietam.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-antietam.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-antietam: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-antietam: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-antietam: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
