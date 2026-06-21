#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-csplayer.mjs — TACTICAL ENGINE B-6 (COMMAND EITHER SIDE). Verifies that the player can command
// EITHER army: the authoritative __FIELD.playerSide resolves from the launch (US default), fldPlayerSide() reads
// it, the scenario AI flags flip by side (a CS player DEFENDS; the US side becomes the B-1 attacker AI), the
// control + render/HUD layers read the player's side, the CS defense is winnable, the standalone Bull Run side
// choice + the side-aware briefing/objective/end framing build, and — the headline guard — a US-default launch
// stays BYTE-IDENTICAL (the live stacked Bull Run is unperturbed) so none of the 9 prior baselines move.
// Writes shots/probe-csplayer.{json,png}.
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
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  function aiFlags(side){ var out=[]; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side) out.push(!!u.ai); } return out; }
  function allTrue(a){ for(var i=0;i<a.length;i++) if(!a[i]) return false; return a.length>0; }
  function allFalse(a){ for(var i=0;i<a.length;i++) if(a[i]) return false; return a.length>0; }
  // run a Bull Run to completion AI-vs-AI (all units AI), honouring whatever playerSide/fog is set.
  function runBR(opts){ __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false; fldLaunchSandbox(opts); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return { w:__FIELD.winner, us:strength('US'), cs:strength('CS'), steps:n, atk:__FIELD.attacker, ps:__FIELD.playerSide }; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldPlayerSide!=='function')
      return JSON.stringify({ok:false, fatal:'tactical layer fns missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    try{ delete G.settings.tacticalPreset; }catch(e){} delete G.settings.tacticalFog;

    step('SIDE-NAME HELPERS: _fldSideName / _fldSideNameFull map US->Union, CS->Rebel/Confederate', function(){
      if(typeof _fldSideName!=='function'||typeof _fldSideNameFull!=='function') throw new Error('side-name helpers missing');
      if(_fldSideName('US')!=='Union'||_fldSideName('CS')!=='Rebel') throw new Error('_fldSideName wrong: '+_fldSideName('US')+'/'+_fldSideName('CS'));
      if(_fldSideNameFull('US')!=='Union'||_fldSideNameFull('CS')!=='Confederate') throw new Error('_fldSideNameFull wrong');
      return { us:_fldSideName('US'), cs:_fldSideName('CS') }; });

    step('DEFAULT player side = US (byte-identical): a plain bullrun1 launch -> playerSide US, US units PLAYER (ai false), CS units AI', function(){
      delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', seed:1});   // NOT autoBoth -> the human side is non-AI
      if(__FIELD.playerSide!=='US') throw new Error('default playerSide != US: '+__FIELD.playerSide);
      if(fldPlayerSide()!=='US') throw new Error('fldPlayerSide() != US: '+fldPlayerSide());
      if(__FIELD.attacker!=='US') throw new Error('attacker should be US (the historical assault): '+__FIELD.attacker);
      var us=aiFlags('US'), cs=aiFlags('CS');
      if(!allFalse(us)) throw new Error('US units should be PLAYER-controlled (ai=false) by default: '+JSON.stringify(us));
      if(!allTrue(cs)) throw new Error('CS units should be AI by default: '+JSON.stringify(cs));
      return { playerSide:__FIELD.playerSide, usPlayer:us.length, csAI:cs.length }; });

    step('CS-PLAYER FLIP: launching playerSide:CS makes the CS units PLAYER (ai false) and the US side the ATTACKER AI', function(){
      delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', seed:1, playerSide:'CS'});
      if(__FIELD.playerSide!=='CS') throw new Error('playerSide != CS: '+__FIELD.playerSide);
      if(fldPlayerSide()!=='CS') throw new Error('fldPlayerSide() != CS: '+fldPlayerSide());
      if(__FIELD.attacker!=='US') throw new Error('attacker must STILL be US (the CS player DEFENDS, faces the B-1 attacker AI): '+__FIELD.attacker);
      var cs=aiFlags('CS'), us=aiFlags('US');
      if(!allFalse(cs)) throw new Error('CS units should be PLAYER-controlled (ai=false): '+JSON.stringify(cs));
      if(!allTrue(us)) throw new Error('US units should be AI (the attacker): '+JSON.stringify(us));
      return { playerSide:__FIELD.playerSide, csPlayer:cs.length, usAI:us.length, attacker:__FIELD.attacker }; });

    // NOTE (byte-identity coverage): this step proves playerSide does not perturb the AI-vs-AI sim. The
    // NON-autoBoth human-US trajectory's byte-identity is covered by the frozen golden in probe-bullrun.mjs
    // (15/15, required in the no-regression gate) — the two probes together pin invariant #1.
    step('BYTE-IDENTITY GUARD: an AI-vs-AI (autoBoth) bullrun1 is identical seed-for-seed regardless of playerSide (the sim does not depend on whose flag it is when all units are AI)', function(){
      var seeds=[1,7,21,42,55,101,303,909], a=[], b=[];
      delete G.settings.tacticalFog; for(var i=0;i<seeds.length;i++) a.push(runBR({renderer:'none',scenario:'bullrun1',autoBoth:true,seed:seeds[i]}));
      delete G.settings.tacticalFog; for(var j=0;j<seeds.length;j++) b.push(runBR({renderer:'none',scenario:'bullrun1',autoBoth:true,seed:seeds[j],playerSide:'CS'}));
      for(var k=0;k<seeds.length;k++){ if(a[k].w!==b[k].w||a[k].us!==b[k].us||a[k].cs!==b[k].cs||a[k].steps!==b[k].steps) throw new Error('autoBoth bullrun differs by playerSide at seed '+seeds[k]+': '+JSON.stringify(a[k])+' vs '+JSON.stringify(b[k])); }
      return { seedForSeedIdentical:true, seeds:seeds.length }; });

    step('LIVE STACKED DEFAULT unchanged: the live Bull Run (fog ON default, all layers) stays CS-FAVOURED 8/8 — B-6 did not move the shipped balance', function(){
      delete G.settings.tacticalFog;
      var seeds=[1,7,21,42,55,101,303,909], cs=0;
      for(var i=0;i<seeds.length;i++){ if(runBR({renderer:'none',scenario:'bullrun1',autoBoth:true,seed:seeds[i]}).w==='CS') cs++; }
      if(cs<6) throw new Error('live stacked default not CS-favoured (>=6): '+cs+'/8 — B-6 perturbed the balance');
      return { liveCS:cs+'/8' }; });

    step('CS DEFENSE IS WINNABLE: under fog (the faithful field), a competently-handled CS defense (the role-aware defender doctrine, which a human can match) HOLDS the hill', function(){
      delete G.settings.tacticalFog;
      // playerSide CS + autoBoth -> the CS units run the DEFENDER doctrine vs the US attacker AI; CS should hold.
      var seeds=[1,7,21,42,55,101,303,909], cs=0;
      for(var i=0;i<seeds.length;i++){ if(runBR({renderer:'none',scenario:'bullrun1',autoBoth:true,seed:seeds[i],playerSide:'CS'}).w==='CS') cs++; }
      if(cs<6) throw new Error('the CS side is not winnable as a defender (>=6 fog-ON): '+cs+'/8');
      return { csDefenseHolds:cs+'/8' }; });

    step('PASSIVE CS PLAYER RESOLVES (no hang/NaN): a CS player who issues NO orders (CS units idle, US attacker AI presses) still reaches a decided result in bounded time', function(){
      delete G.settings.tacticalFog;
      // playerSide CS, NOT autoBoth -> CS units are non-AI and (with no human) idle; the US attacker AI runs.
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', seed:7, playerSide:'CS'});
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      __FIELD.phase='battle'; __FIELD.paused=false; var n=0;
      while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; }
      if(__FIELD.phase!=='over') throw new Error('passive CS battle did not terminate (phase '+__FIELD.phase+' after '+n+' steps)');
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('passive CS battle bad winner: '+__FIELD.winner);
      if(!isFinite(strength('US'))||!isFinite(strength('CS'))) throw new Error('NaN strength after passive CS battle');
      return { winner:__FIELD.winner, steps:n, us:strength('US'), cs:strength('CS') }; });

    step('SKIRMISH PATH honours CS: a CS-side skirmish builds CS units as PLAYER (ai false) + US as AI; playerSide CS', function(){
      delete G.settings.tacticalFog;
      var sk={ playerSide:'CS', attacker:null, year:1862, countPlayer:3, countEnemy:3, menPlayer:1600, menEnemy:1500, weaponPlayer:'rifled', weaponEnemy:'rifled', terrain:'woods', name:'Skirmish' };
      fldLaunchSandbox({renderer:'none', skirmish:sk, seed:1});
      if(__FIELD.playerSide!=='CS') throw new Error('skirmish playerSide != CS: '+__FIELD.playerSide);
      var cs=aiFlags('CS'), us=aiFlags('US');
      if(!allFalse(cs)) throw new Error('skirmish CS units not player-controlled: '+JSON.stringify(cs));
      if(!allTrue(us)) throw new Error('skirmish US units not AI: '+JSON.stringify(us));
      // and a US skirmish stays the default
      var sk2={ playerSide:'US', attacker:null, year:1862, countPlayer:3, countEnemy:3, menPlayer:1600, menEnemy:1500, weaponPlayer:'rifled', weaponEnemy:'rifled', terrain:'woods', name:'Skirmish' };
      fldLaunchSandbox({renderer:'none', skirmish:sk2, seed:1});
      if(__FIELD.playerSide!=='US' || !allFalse(aiFlags('US')) || !allTrue(aiFlags('CS'))) throw new Error('US skirmish default broke');
      return { csSkirmish:'ok', usSkirmish:'ok' }; });

    step('OBJECTIVE COPY is side-aware: fldBriefObjectiveHtml -> US "seize and hold"; CS "HOLD"/"deny"', function(){
      if(typeof fldBriefObjectiveHtml!=='function') throw new Error('fldBriefObjectiveHtml missing');
      var sd={ objective:{ name:'Henry House Hill' } };
      __FIELD.attacker='US';
      var usH=fldBriefObjectiveHtml('US', sd, 45), csH=fldBriefObjectiveHtml('CS', sd, 45);
      if(usH.indexOf('seize and hold')<0) throw new Error('US objective copy not attack-framed: '+usH);
      if(csH.indexOf('HOLD')<0 || csH.toLowerCase().indexOf('deny')<0) throw new Error('CS objective copy not defend-framed: '+csH);
      if(usH===csH) throw new Error('objective copy did not change with side');
      return { usLen:usH.length, csLen:csH.length }; });

    step('END "YOU" LINE is role-aware: fldPlayerOutcomeLine reads playerSide x attacker x winner', function(){
      if(typeof fldPlayerOutcomeLine!=='function') throw new Error('fldPlayerOutcomeLine missing');
      __FIELD.attacker='US';
      __FIELD.playerSide='US'; var usWin=fldPlayerOutcomeLine('US'), usLose=fldPlayerOutcomeLine('CS');
      __FIELD.playerSide='CS'; var csWin=fldPlayerOutcomeLine('CS'), csLose=fldPlayerOutcomeLine('US');
      var draw=fldPlayerOutcomeLine('draw');
      // US is the attacker: a US win "carried", a US loss "repulsed"; CS is the defender: a CS win "held", a CS loss "forced"
      if(usWin.toLowerCase().indexOf('carried')<0) throw new Error('US attacker win line wrong: '+usWin);
      if(usLose.toLowerCase().indexOf('repulsed')<0) throw new Error('US attacker loss line wrong: '+usLose);
      if(csWin.toLowerCase().indexOf('held')<0) throw new Error('CS defender win line wrong: '+csWin);
      if(csLose.toLowerCase().indexOf('forced')<0) throw new Error('CS defender loss line wrong: '+csLose);
      if(!draw) throw new Error('draw line empty');
      __FIELD.playerSide='US';
      return { usWin:usWin, csWin:csWin }; });

    step('BULL RUN SIDE CARDS build well-formed + accessible (both side cards, data-brside, ARIA, ATTACK/DEFEND badges, CVD-safe text)', function(){
      if(typeof _fldBrSideCard!=='function') throw new Error('_fldBrSideCard missing');
      var us=_fldBrSideCard('US','Lead the Union','&#9876; ATTACK','storm the hill'), cs=_fldBrSideCard('CS','Hold for the Confederacy','&#9819; DEFEND','hold the hill');
      ['data-brside="US"','aria-label','ATTACK','type="button"'].forEach(function(t){ if(us.indexOf(t)<0) throw new Error('US card missing: '+t); });
      ['data-brside="CS"','aria-label','DEFEND','type="button"'].forEach(function(t){ if(cs.indexOf(t)<0) throw new Error('CS card missing: '+t); });
      return { usLen:us.length, csLen:cs.length }; });

    step('DETERMINISM: a CS-player autoBoth bullrun1 twice (same seed) -> identical battle', function(){
      delete G.settings.tacticalFog;
      var a=runBR({renderer:'none',scenario:'bullrun1',autoBoth:true,seed:42,playerSide:'CS'});
      var b=runBR({renderer:'none',scenario:'bullrun1',autoBoth:true,seed:42,playerSide:'CS'});
      if(a.w!==b.w||a.us!==b.us||a.cs!==b.cs||a.steps!==b.steps) throw new Error('CS-player battle non-deterministic: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      return { winner:a.w, us:a.us, cs:a.cs, steps:a.steps }; });

    step('NO CLASSIC CONTAMINATION: a CS-player battle never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode; delete G.settings.tacticalFog;
      runBR({renderer:'none',scenario:'bullrun1',autoBoth:true,seed:3,playerSide:'CS'});
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('mutated G.mode: '+G.mode);
      try{ fldExit(true); }catch(e){}
      return { gMode:G.mode }; });

  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

// A second eval, in a 2D DOM context, for the HUD friend/foe + side-choice DOM (needs a rendered field + sheet).
const DOM = `(() => {
  var R = { steps: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  try {
    try{ delete G.settings.tacticalPreset; }catch(e){} delete G.settings.tacticalFog;

    step('HUD FRIEND/FOE is player-relative (2D DOM): a US player reads "Union vs ... Rebel"; a CS player reads "Confederate vs ... Union"', function(){
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', seed:1});   // US default
      __FIELD.fog=false; __FIELD.sel=[]; fldRenderHud();
      var usHud=(document.getElementById('fldHud')||{}).innerHTML||'';
      try{ fldExit(true); }catch(e){}
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', seed:1, playerSide:'CS'});
      __FIELD.fog=false; __FIELD.sel=[]; fldRenderHud();
      var csHud=(document.getElementById('fldHud')||{}).innerHTML||'';
      try{ fldExit(true); }catch(e){}
      if(usHud.indexOf('Union vs')<0) throw new Error('US HUD did not read "Union vs": '+usHud.slice(0,160));
      if(usHud.indexOf('Rebel brigades')<0) throw new Error('US HUD enemy not "Rebel": '+usHud.slice(0,160));
      if(csHud.indexOf('Confederate vs')<0) throw new Error('CS HUD did not read "Confederate vs" (friendly full name): '+csHud.slice(0,160));
      if(csHud.indexOf('Union brigades')<0) throw new Error('CS HUD enemy not "Union": '+csHud.slice(0,160));
      return { usHasUnionVs:true, csHasConfederateVs:true }; });

    step('FOG RENDER VIEWER is the PLAYER side (invariant #2, render layer): the render-hide predicate keys off fldPlayerSide() — it HIDES an enemy unseen-by-the-player, NEVER a friendly, and is NOT the hardcoded US viewer; fld2dDraw does not throw', function(){
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', seed:1, playerSide:'CS', fog:true});
      fldStepN(40, 0.05); __FIELD.paused=true; fldComputeVisibility();
      if(__FIELD.fog!==true) throw new Error('fog not on'); if(fldPlayerSide()!=='CS') throw new Error('playerSide not CS');
      var usU=null, csU=null;
      for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(!u.alive) continue; if(u.side==='US'&&!usU) usU=u; if(u.side==='CS'&&!csU) csU=u; }
      if(!usU||!csU) throw new Error('need both a live US and a live CS unit');
      // FORCE the per-side visibility deterministically: the US enemy is unseen-by-CS but seen-by-US; the CS friendly is unseen-by-US.
      __FIELD.vis=__FIELD.vis||{US:{},CS:{}}; __FIELD.vis.US=__FIELD.vis.US||{}; __FIELD.vis.CS=__FIELD.vis.CS||{};
      delete __FIELD.vis.CS[usU.id]; __FIELD.vis.US[usU.id]=1; delete __FIELD.vis.US[csU.id];
      // the render-hide predicate (mirrors fld2dDraw / fld3dSyncUnit), parameterized by the VIEWER side:
      function hidden(viewer,u){ return __FIELD.fog && u.side!==viewer && !fldVisible(viewer,u); }
      if(!hidden('CS',usU)) throw new Error('render(CS) did NOT hide an enemy US unit unseen by CS — viewer wrong or leak');
      if(hidden('CS',csU)) throw new Error('render(CS) HID a FRIENDLY CS unit — friendly must never be fog-hidden');
      if(hidden('US',usU)) throw new Error('sanity: the US unit is seen by US, so a US viewer would NOT hide it — proves the player-side viewer (CS) is what hides it, not a hardcoded US viewer');
      var threw=null; try{ fld2dDraw(); }catch(e){ threw=String(e&&e.message||e); }
      try{ fldExit(true); }catch(e){}
      if(threw) throw new Error('fld2dDraw threw under fog (CS viewer): '+threw);
      return { csHidesEnemy:true, csKeepsFriendly:true, viewerIsPlayerSide:true }; });

    step('SIDE-CHOICE SHEET (2D DOM): fldBullRunSideChoice renders BOTH side cards; clicking the CS card calls back with "CS"', function(){
      if(typeof fldBullRunSideChoice!=='function') throw new Error('fldBullRunSideChoice missing');
      var picked=null;
      fldBullRunSideChoice(function(side){ picked=side; });
      var cards=document.querySelectorAll('[data-brside]');
      if(cards.length!==2) throw new Error('expected 2 side cards, got '+cards.length+(typeof openSheet!=='function'?' (openSheet unavailable; fallback picked '+picked+')':''));
      var csCard=document.querySelector('[data-brside="CS"]'); if(!csCard) throw new Error('no CS card');
      csCard.click();
      if(picked!=='CS') throw new Error('clicking the CS card did not call back "CS": '+picked);
      try{ if(typeof closeSheet==='function') closeSheet(); }catch(e){}
      return { cards:cards.length, picked:picked }; });

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
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', seed:21, playerSide:'CS'});
      __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(2200, 0.05);
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      return { simT: Math.round(__FIELD.t), winner: __FIELD.winner, playerSide:__FIELD.playerSide, fog:__FIELD.fog };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-csplayer.png') });
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-csplayer.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-csplayer ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
