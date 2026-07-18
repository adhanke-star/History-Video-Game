#!/usr/bin/env node
import "./guard-probe-browser.mjs";
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
async function settlesWithin(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise.then(() => true, () => true),
      new Promise(resolve => { timer = setTimeout(() => resolve(false), ms); })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function closePage(page) {
  if (!page) return;
  try {
    await settlesWithin(page.close({ runBeforeUnload:false }), 2500);
  } catch {}
}
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }
async function closeBrowser(browser){
  if (!browser) return;
  try {
    await settlesWithin(browser.close(), 3000);
  } catch {}
  // Chrome can exit before Playwright receives the close reply, leaving the
  // transport callback live until the outer 360s guard. Finalize the standalone
  // probe's client connection even when browser.close() reports that it settled;
  // Connection.close is idempotent and rejects any orphaned callbacks locally.
  if (browser._connection && typeof browser._connection.close === 'function') {
    try { browser._connection.close('probe-gettysburg bounded cleanup'); } catch {}
  }
}
function printResult(result){
  console.log('probe-gettysburg ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name.slice(0,60) + ' :: ' + JSON.stringify(s.v)); }
}

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

    step('C28/C30/C43 (D235) ACCURATE SEATING + SCALE + ARMS: every phase seats the US DEFENDER nearer the objective than the CS attacker (mean deploy distance), all CS infantry across all 3 days are rifle-armed, and Heth\\'s two-brigade force carries the corrected ~3,400', function(){
      var out=[];
      for(var i=0;i<DATA.phases.length;i++){ var p=DATA.phases[i];
        var meanD=function(list){ var s=0,n=0; for(var j=0;j<list.length;j++){ var u=list[j], dx=u.x-p.objective.x, dz=u.z-p.objective.z; s+=Math.sqrt(dx*dx+dz*dz); n++; } return n?s/n:1e9; };
        var dUS=meanD(p.oob.US), dCS=meanD(p.oob.CS);
        if(!(dUS<dCS)) throw new Error('phase '+i+': US defender (mean '+Math.round(dUS)+') is NOT seated nearer the objective than the CS attacker (mean '+Math.round(dCS)+') — the C28 inversion is back');
        var csAll=(p.oob.CS||[]).concat((p.reinforcements||[]).filter(function(r){return r.side==='CS';}));
        for(var k=0;k<csAll.length;k++){ var u=csAll[k]; if(u.arm==='inf' && u.weapon!=='rifled') throw new Error('phase '+i+' CS infantry '+u.id+' tagged '+u.weapon+' — the C43 smooth/rifled contradiction is back'); }
        out.push('p'+i+':'+Math.round(dUS)+'<'+Math.round(dCS)); }
      var heth=null, l0=DATA.phases[0].oob.CS; for(var m=0;m<l0.length;m++) if(l0[m].id==='cs_heth_division') heth=l0[m];
      if(!heth) throw new Error('cs_heth_division missing');
      if(!(heth.men>=3000 && heth.men<=3800)) throw new Error('cs_heth_division men='+heth.men+' outside the corrected ~3,400 two-brigade band (C30)');
      return { seating:out.join(' | '), hethMen:heth.men }; });

    step('C64 (D239) STANNARD NOT DOUBLE-COUNTED: Day 3 keeps BOTH Vermont entries (the line + the famous wheel — the teaching survives) but their combined strength stays in the brigade\\'s real engaged band (~1,790-1,950), not the old ~4,000', function(){
      var p3=DATA.phases[2];
      var line=null, us=p3.oob.US; for(var i=0;i<us.length;i++) if(us[i].id==='us_stannard') line=us[i];
      var flank=null, rf=p3.reinforcements||[]; for(var j=0;j<rf.length;j++) if(rf[j].id==='us_stannard_flank') flank=rf[j];
      if(!line) throw new Error('us_stannard missing from Day 3 OOB');
      if(!flank) throw new Error('us_stannard_flank missing from Day 3 reinforcements — the wheel teaching entry was lost');
      if(!(line.men>0 && line.men<=800)) throw new Error('us_stannard men='+line.men+' — the line entry should carry only the 14th Vermont (~650)');
      if(!(flank.men>0 && flank.men<=1300)) throw new Error('us_stannard_flank men='+flank.men+' — the flank entry should carry only the 13th+16th (~1,140)');
      var total=line.men+flank.men;
      if(!(total>=1700 && total<=2000)) throw new Error('Stannard entries total '+total+' — outside the 1,700-2,000 tolerance around the sourced ~1,790-1,950 engaged band (C64 double-count regression)');
      var trimble=null, osborn=null;
      for(var k=0;k<us.length;k++) if(us[k].id==='us_osborn_hill') osborn=us[k];
      var cs=p3.oob.CS; for(var m=0;m<cs.length;m++) if(cs[m].id==='cs_trimble_div') trimble=cs[m];
      if(!trimble || !(trimble.men>=1500 && trimble.men<=2200)) throw new Error('cs_trimble_div men='+(trimble&&trimble.men)+' — outside the 1,500-2,200 tolerance around the sourced ~1,724-1,916 two-brigade force (only Lane + Lowrance charged)');
      if(!osborn || !(osborn.guns>=15 && osborn.guns<=22)) throw new Error('us_osborn_hill missing or guns='+(osborn&&osborn.guns)+' — the documented Cemetery Hill northern enfilade (18 guns) must stay on the board');
      return { line:line.men, flank:flank.men, total:total, trimble:trimble.men, osbornGuns:osborn.guns }; });

    step('C66/C67/C68 (D338) GETTYSBURG TRUTH TEETH: no Lost Cause sole-blame Longstreet framing, no unsourced Meade take-command quote, Kemper wounded-and-captured (not killed)', function(){
      var S=JSON.stringify(GAME_DATA.gettysburg);
      if(/foot-dragging/i.test(S)) throw new Error('C66 regression: "foot-dragging" is back');
      if(/delay and reluctance/i.test(S)) throw new Error('C66 regression: "delay and reluctance" is back');
      if(/costs the Confederacy Little Round Top/i.test(S)) throw new Error('C66 regression: the sole-cause "costs the Confederacy Little Round Top" teach is back');
      var ls=null, csL=DATA.phases[1].leaders.CS; for(var i=0;i<csL.length;i++) if(csL[i].id==='ld_longstreet') ls=csL[i];
      if(!ls) throw new Error('ld_longstreet missing from Day 2');
      if(ls.note.indexOf('Lost Cause')<0) throw new Error('C66: the Day-2 Longstreet note lost the Lost Cause scapegoating context');
      if(/I will take command/i.test(S)) throw new Error('C67 regression: the unsourced "General, I will take command" quote is back');
      var hk=null, usL=DATA.phases[2].leaders.US; for(var j=0;j<usL.length;j++) if(usL[j].id==='ld_hancock') hk=usL[j];
      if(!hk) throw new Error('ld_hancock missing from Day 3');
      if(hk.note.indexOf('July 1')<0) throw new Error('C67: the Hancock note no longer teaches the July 1 field-command assignment separately from the July 3 wound');
      if(/three brigade commanders were killed or mortally wounded/i.test(S)) throw new Error('C68 regression: the Pickett summary again kills all three brigade commanders');
      var pk=null, csL3=DATA.phases[2].leaders.CS; for(var k=0;k<csL3.length;k++) if(csL3[k].id==='ld_pickett') pk=csL3[k];
      if(!pk) throw new Error('ld_pickett missing from Day 3');
      if(pk.note.indexOf('Kemper')<0 || pk.note.indexOf('captured')<0) throw new Error('C68: the Pickett note no longer records Kemper wounded and captured');
      return { longstreetLostCause:true, hancockJuly1:true, kemperCaptured:true }; });

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

    step('SINGLE-OBJECTIVE PATH UNREGRESSED: the sandbox + Bull Run + Fredericksburg still build & resolve with NO phase machinery, while Antietam still uses phases', function(){
      // sandbox
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:12345});
      if(__FIELD.scenario!=='sandbox') throw new Error('sandbox tag wrong');
      if(__FIELD.phases!==null) throw new Error('phase machinery LEAKED into the sandbox: phases='+__FIELD.phases);
      if(__FIELD.units.length!==4) throw new Error('sandbox want 4 units, got '+__FIELD.units.length);
      var sandboxPhases=__FIELD.phases;
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
      var antietamPhases=__FIELD.phases.length;
      __FIELD.phase='battle'; __FIELD.paused=false; n=0; while(__FIELD.phase==='battle'&&n<60000){ fldSimStep(0.05); n++; } var anW=__FIELD.winner;
      if(['US','CS','draw'].indexOf(anW)<0) throw new Error('Antietam did not resolve: '+anW);
      return { sandboxPhases:sandboxPhases, bullrunWinner:brW, fredericksburgWinner:fbW, antietamPhases:antietamPhases, antietamWinner:anW }; });

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

    step('RUNNING-TALLY HUD: fldRenderTop exposes the compact phase/sector chip ("Phase N/3 ... US x / CS y") on a multi-phase battle, and is "" on a single-objective battle (byte-identical text)', function(){
      if(typeof _fldPhaseTopLabel!=='function') throw new Error('_fldPhaseTopLabel missing');
      fldLaunchSandbox({renderer:'2d', scenario:'gettysburg', autoBoth:true, seed:1});
      var lbl=_fldPhaseTopLabel();
      if(lbl.indexOf('Phase 1/3')<0 || lbl.indexOf('US ')<0 || lbl.indexOf(' / CS ')<0) throw new Error('multi-phase top label wrong: '+lbl);
      if(!document.getElementById('fldSector')) throw new Error('compact phase chip #fldSector missing from tactical top bar');
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
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });   // slow-Mac: the 'load' wait stalls while embedded assets stream (the documented gotcha, D233 class; fixed in D247); inline scripts are all the probe needs
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
    await page.screenshot({ path: join(OUT,'probe-gettysburg.png'), timeout: 120000 });   // slow-Mac budget (D232 class, fixed in D247): the default 30s flaked under WebGL/asset load
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-gettysburg.json'), JSON.stringify(result, null, 2));
    printResult(result);
    await closePage(page);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  // D454 battery root fix (the D398 owning-process class): a fully-green run relied on the event
  // loop draining naturally, and a live handle (Playwright transport remnant / fetch agent) held
  // the green process hostage until the harness 360s guard SIGTERMed it — the exact hang the
  // bounded-close comment above describes. Exit EXPLICITLY on both paths after the artifact is
  // written and teardown attempted (the probe-weather idiom); the 19 asserts + pageerrors gating
  // still solely decide the code.
  process.exit((!result.ok || result.fatal || (result.pageerrors && result.pageerrors.length)) ? 1 : 0);
})();
