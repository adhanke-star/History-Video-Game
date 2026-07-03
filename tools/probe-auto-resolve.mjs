#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-auto-resolve.mjs — A6b the bridge auto-resolve (playable end-to-end). Verifies the
// outcome is decided by the army the war fielded: a strong war out-resolves a weak one; both sides
// take casualties (the loser more); the enemy rating reflects the historical asymmetry; the result
// drives the engine's campaignAdvance so the war progresses (idx advances on a win, casualties feed
// the strategic tick); and the pre-battle briefing offers an Auto-resolve button. Boots real battles
// via startBattleRuntime + bridgeResolveOutcome. Writes shots/probe-auto-resolve.json.
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
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    C.clock.year=1864; C.president.date={year:1864,month:1}; return C; }
  function setWar(C, strong){ if(C.manpower) C.manpower.strength=strong?100:35; if(C.production) C.production.equipIndex=strong?100:25;
    if(C.clock) C.clock.weariness=strong?0:95; if(C.warroom) C.warroom.supply=strong?100:30; if(C.blockade) C.blockade.importFactor=1.0; }
  function totalStr(B,side){ var s=0; for(var i=0;i<B.units.length;i++){ var u=B.units[i]; if(u&&u.side===side) s+=(u.strength||0); } return s; }
  try {
    if (typeof startBattleRuntime!=='function' || typeof bridgeResolveOutcome!=='function' || typeof BATTLES==='undefined') return JSON.stringify({ok:false,fatal:'engine/A6b missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    var bd=BATTLES.find(function(b){return b.id==='antietam';})||BATTLES[0];
    var bd64={}; for(var bk in bd){ if(bd.hasOwnProperty(bk)) bd64[bk]=bd[bk]; } bd64.year=1864;   // late-war (enemy weaker) for a reliable strong-win test

    step('a STRONG war out-resolves a WEAK war, with REAL jeopardy (the army your war fielded decides it)', function(){
      var Cs=mkC('US'); setWar(Cs,true); startBattleRuntime(bd64,'US',true); var oS=bridgeResolveOutcome(Cs, G.battle);
      var Cw=mkC('US'); setWar(Cw,false); startBattleRuntime(bd64,'US',true); var oW=bridgeResolveOutcome(Cw, G.battle);
      if (!oS || !oW) throw new Error('no outcome');
      if (!(oS.me > oW.me)) throw new Error('strong army rating should exceed weak: '+oS.me+' vs '+oW.me);
      if (!(oS.margin > oW.margin)) throw new Error('strong should out-margin weak: '+oS.margin+' vs '+oW.margin);
      if (oS.win !== true) throw new Error('a strong 1864 Union war should win, got '+oS.type+' (margin '+oS.margin+')');
      if (oW.win === true) throw new Error('a WEAK war should NOT reliably win (jeopardy), got a win at margin '+oW.margin);
      return { strongMe:oS.me, weakMe:oW.me, strongMargin:oS.margin, weakMargin:oW.margin, strongType:oS.type, weakResult:(oW.draw?'draw':'loss') }; });

    step('both sides take casualties; the winner shatters the loser (units destroyed); the LOSER bleeds more', function(){
      var C=mkC('US'); setWar(C,true); startBattleRuntime(bd64,'US',true); var B=G.battle, ps=B.playerSide, es=B.enemySide;
      var pBefore=totalStr(B,ps), eBefore=totalStr(B,es);
      var o=bridgeResolveOutcome(C, B);
      var pAfter=totalStr(B,ps), eAfter=totalStr(B,es);
      if (!(o.playerCas>0 && o.enemyCas>0)) throw new Error('both sides should take casualties: p='+o.playerCas+' e='+o.enemyCas);
      if (!(pAfter < pBefore && eAfter < eBefore)) throw new Error('unit strength should drop both sides');
      if (o.win && !(o.enemyCas > o.playerCas)) throw new Error('on a win the enemy should bleed more: enemy='+o.enemyCas+' player='+o.playerCas);
      // a win shatters the loser hard (inflicted-blood parity): enemy losses are a big slice of its start
      if (o.win && !(o.enemyCas > eBefore*0.30)) throw new Error('a win should inflict heavy enemy losses (funds/infl parity): '+o.enemyCas+'/'+eBefore);
      return { playerCas:o.playerCas, enemyCas:o.enemyCas, enemyStart:eBefore, win:o.win, type:o.type }; });

    step('a win attributes KILLS to survivors (XP parity; decisive => +2 via kills>=2)', function(){
      var C=mkC('US'); setWar(C,true); startBattleRuntime(bd64,'US',true); var B=G.battle, ps=B.playerSide;
      var o=bridgeResolveOutcome(C, B);
      if (!o.win) return { skipped:'this seed did not yield a win' };
      var maxKills=0, withKills=0; for(var i=0;i<B.units.length;i++){ var u=B.units[i]; if(u&&u.side===ps&&u.type!=='hq'&&(u.kills||0)>0){ withKills++; if(u.kills>maxKills) maxKills=u.kills; } }
      if (!(withKills>0)) throw new Error('a win should credit kills to surviving regiments (else XP capped at +1 vs the fought path)');
      if (o.type==='decisive' && !(maxKills>=2)) throw new Error('a decisive win should credit kills>=2 (xpGain +2), got max '+maxKills);
      return { survivorsWithKills:withKills, maxKills:maxKills, decisive:(o.type==='decisive') }; });

    step('a recovery role-flip (C.flipAtk) is honored, mirroring the tactical relaunch', function(){
      var C=mkC('US'); setWar(C,true); var bdNext=_brgNextBattle(C); if(!bdNext) return { skipped:'no next battle' };
      var origAtk=bdNext.atk; C.flipAtk=true;
      var o=bridgeAutoResolve(C);   // builds + resolves; should clone bd with atk reversed + clear the flag
      if (C.flipAtk!==false) throw new Error('C.flipAtk should be consumed by the auto-resolve');
      if (G.battle && G.battle.bd && G.battle.bd.atk===origAtk) throw new Error('recovery battle should have the attacker flipped, still '+origAtk);
      return { origAtk:origAtk, resolvedAtk:(G.battle&&G.battle.bd)?G.battle.bd.atk:null, flipConsumed:(C.flipAtk===false) }; });

    step('the enemy rating reflects the historical asymmetry (CS foe declines by year; US foe grows)', function(){
      if (typeof _arEnemyRating!=='function') throw new Error('_arEnemyRating missing');
      var Cus=mkC('US'); var foeEarly=_arEnemyRating(Cus,{year:1861},'US'), foeLate=_arEnemyRating(Cus,{year:1865},'US');
      var Ccs=mkC('CS'); var foeUSearly=_arEnemyRating(Ccs,{year:1861},'CS'), foeUSlate=_arEnemyRating(Ccs,{year:1865},'CS');
      if (!(foeLate < foeEarly)) throw new Error('the Confederate enemy should weaken over the war: '+foeEarly+'->'+foeLate);
      if (!(foeUSlate > foeUSearly)) throw new Error('the Union enemy should grow stronger: '+foeUSearly+'->'+foeUSlate);
      return { csFoeEarly:foeEarly, csFoeLate:foeLate, usFoeEarly:foeUSearly, usFoeLate:foeUSlate }; });

    step('auto-resolve drives campaignAdvance: a win advances the war + feeds the strategic tick', function(){
      var C=mkC('US'); setWar(C,true); var idx0=C.idx;
      startBattleRuntime(bd64,'US',true); var B=G.battle, ps=B.playerSide;
      var o=bridgeResolveOutcome(C, B);
      campaignAdvance(o.winnerSide, o.type);
      if (C.stats.battles!==1) throw new Error('campaignAdvance should record the battle, stats.battles='+C.stats.battles);
      if (o.win && C.idx!==idx0+1) throw new Error('a win should advance the chain: idx '+idx0+'->'+C.idx);
      if (!o.win && C.idx!==idx0) throw new Error('a non-win should NOT advance (recovery): idx '+C.idx);
      if (C.stats.suff !== o.playerCas) throw new Error('the strategic tick should record the player casualties: suff='+C.stats.suff+' cas='+o.playerCas);
      return { idxBefore:idx0, idxAfter:C.idx, win:o.win, statsBattles:C.stats.battles, suff:C.stats.suff }; });

    step('the pre-battle briefing offers an Auto-resolve option', function(){
      var C=mkC('US'); setWar(C,true);
      if (typeof bridgeBriefingHTML!=='function') throw new Error('bridgeBriefingHTML missing');
      var h=bridgeBriefingHTML(C);
      if (h.indexOf('brgAuto')<0) throw new Error('no Auto-resolve button id in the briefing');
      if (h.indexOf('Auto-resolve')<0) throw new Error('no Auto-resolve label in the briefing');
      if (h.indexOf('brgToField')<0) throw new Error('the To-the-Field (fight it) option should remain');
      return { hasAuto:true, hasFight:true }; });
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
    writeFileSync(join(OUT,'probe-auto-resolve.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-auto-resolve ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-auto-resolve.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-auto-resolve.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-auto-resolve: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-auto-resolve: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-auto-resolve: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
