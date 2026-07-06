#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-auto-resolve.mjs — PM3 (D277): the SIM-BACKED auto-resolve. Verifies PL-1 (the old
// rating-margin model is GONE — bridgeResolveOutcome/_arEnemyRating undefined; the delegated outcome
// comes from a headless run of the same real-time battle through the shared compute/apply path),
// PL-6 (war-state-pure seed: deterministic replay, no Math.random/Date.now in the sim), PL-3
// (the bought loadout measurably shifts delegated outcomes — Aaron's rider), the honest result
// card (PL-8), the faithful Bull Run sub-decision (a delegated First Bull Run repeats history),
// flip preservation/consumption parity with the fought path, and UI/teardown hygiene.
// Writes shots/probe-auto-resolve.json.
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
  function setWar(C, strong){ if(C.manpower) C.manpower.strength=strong?100:35; if(C.production) C.production.equipIndex=strong?100:25;
    if(C.clock) C.clock.weariness=strong?0:95; if(C.warroom) C.warroom.supply=strong?100:30; if(C.blockade) C.blockade.importFactor=1.0; }
  function oKey(o){ return o ? [o.winnerSide,o.type,Math.round(o.pFrac*1e6),Math.round(o.eFrac*1e6),o.sim&&o.sim.seed].join('|') : 'null'; }
  function sheetHtml(){ var p=document.getElementById('sheetPad'); return (p&&p.innerHTML)||''; }
  try {
    if (typeof bridgeAutoResolve!=='function' || typeof _arRunHeadlessSim!=='function' || typeof _arSimSeed!=='function' || typeof BATTLES==='undefined')
      return JSON.stringify({ok:false,fatal:'PM3 sim-backed resolve missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('PL-1: the rating-margin model is GONE — no parallel outcome model may survive', function(){
      if (typeof bridgeResolveOutcome!=='undefined') throw new Error('bridgeResolveOutcome (the margin model) still exists');
      if (typeof _arEnemyRating!=='undefined') throw new Error('_arEnemyRating (the generic year curve) still exists');
      if (typeof _arApplyCasualties!=='function') throw new Error('_arApplyCasualties must remain (the shared apply path consumes it)');
      return { marginModelGone:true, yearCurveGone:true, applyKept:true }; });

    step('PL-6: determinism — same war state resolves the same field, twice (winner+fractions+seed)', function(){
      var C1=mkC('US'); C1.idx=9; var o1=_arRunHeadlessSim(C1);
      var C2=mkC('US'); C2.idx=9; var o2=_arRunHeadlessSim(C2);
      if(!o1||!o2) throw new Error('no outcome');
      if(oKey(o1)!==oKey(o2)) throw new Error('non-deterministic: '+oKey(o1)+' vs '+oKey(o2));
      if(['US','CS',null].indexOf(o1.winnerSide)<0) throw new Error('bad winnerSide');
      if(!(o1.pFrac>=0 && o1.pFrac<=0.92 && o1.eFrac>=0 && o1.eFrac<=0.92)) throw new Error('fractions out of range');
      return { w:o1.winnerSide, type:o1.type, seed:o1.sim.seed, by:o1.sim.winBy }; });

    step('PL-6: war-state purity — Math.random and Date.now are NEVER consulted by the headless sim', function(){
      var C=mkC('US'); C.idx=9;
      var mr=Math.random, dn=Date.now;
      Math.random=function(){ throw new Error('Math.random called during the headless sim'); };
      Date.now=function(){ throw new Error('Date.now called during the headless sim'); };
      var o=null, err=null;
      try { o=_arRunHeadlessSim(C); } catch(e){ err=e; } finally { Math.random=mr; Date.now=dn; }
      if(err) throw err;
      if(!o) throw new Error('no outcome under throwers');
      return { pure:true, w:o.winnerSide }; });

    step('PL-6: _arSimSeed is a pure war-state function — stable per state; battles/recovery/flip/side each move it; war STRENGTH does not', function(){
      var C=mkC('US'); C.idx=9; var bd=_brgNextBattle(C);
      var s1=_arSimSeed(C,bd,false);
      if(_arSimSeed(C,bd,false)!==s1) throw new Error('same state gave different seeds');
      setWar(C,true); if(_arSimSeed(C,bd,false)!==s1) throw new Error('war STRENGTH must not move the seed (strength reaches the field as INPUTS, not as a reroll)');
      C.stats.battles=3; var s3=_arSimSeed(C,bd,false);
      C.stats.battles=0; C.recovery=true; var s4=_arSimSeed(C,bd,false);
      C.recovery=false; var s5=_arSimSeed(C,bd,true);
      var C6=mkC('CS'); C6.idx=9; var s6=_arSimSeed(C6,bd,false);
      var uniq={}; [s1,s3,s4,s5,s6].forEach(function(s){ uniq[s]=1; });
      if(Object.keys(uniq).length!==5) throw new Error('seed collisions across state variants');
      return { base:s1, distinct:5 }; });

    step('PL-3 (Aaron rider): Spencers vs empty armory at Gettysburg 1863 — the bought loadout shifts the delegated outcome', function(){
      var C1=mkC('US'); C1.idx=15; setWar(C1,true); C1.armory.loadout={};            var o1=_arRunHeadlessSim(C1);
      var C2=mkC('US'); C2.idx=15; setWar(C2,true); C2.armory.loadout={spencer:1.0}; var o2=_arRunHeadlessSim(C2);
      if(!o1||!o2) throw new Error('no outcome');
      if(o1.sim.seed!==o2.sim.seed) throw new Error('the armory must not move the seed — same field, better arms');
      var shifted = (o1.winnerSide!==o2.winnerSide) || (Math.abs(o1.eFrac-o2.eFrac)>0.01) || (Math.abs(o1.pFrac-o2.pFrac)>0.01);
      if(!shifted) throw new Error('loadout did NOT measurably shift the outcome');
      if(!(o2.eFrac>o1.eFrac)) throw new Error('repeaters should RAISE enemy losses: '+o1.eFrac+' -> '+o2.eFrac);
      if(!(o2.pFrac<o1.pFrac)) throw new Error('repeaters should CUT player losses: '+o1.pFrac+' -> '+o2.pFrac);
      return { emptyE:Math.round(o1.eFrac*1000)/1000, spencerE:Math.round(o2.eFrac*1000)/1000, emptyP:Math.round(o1.pFrac*1000)/1000, spencerP:Math.round(o2.pFrac*1000)/1000 }; });

    step('PL-3: Henrys at the Wilderness 1864 FLIP a delegated loss into a hold win (fresh war, same seed)', function(){
      var C1=mkC('US'); C1.idx=18; C1.armory.loadout={};          var o1=_arRunHeadlessSim(C1);
      var C2=mkC('US'); C2.idx=18; C2.armory.loadout={henry:1.0}; var o2=_arRunHeadlessSim(C2);
      if(!(o1.winnerSide==='CS' && !o1.win)) throw new Error('empty-armory Wilderness should be a delegated loss, got '+o1.winnerSide);
      if(!(o2.winnerSide==='US' && o2.win)) throw new Error('a Henry-armed line should FLIP the Wilderness, got '+o2.winnerSide);
      return { empty:o1.winnerSide+'/'+o1.sim.winBy, henry:o2.winnerSide+'/'+o2.sim.winBy }; });

    step('sub-decision (D277): a delegated First Bull Run runs the FAITHFUL bullrun1 scenario and repeats history (CS holds)', function(){
      var C=mkC('US'); C.idx=1; setWar(C,true);
      var o=_arRunHeadlessSim(C);
      if(!o) throw new Error('no outcome');
      if(o.winnerSide!=='CS') throw new Error('the delegated (fog-on, cautious-McDowell) First Bull Run should stay CS — delegation repeats history; take command to change it. Got '+o.winnerSide);
      return { w:o.winnerSide, by:o.sim.winBy, t:o.sim.endT }; });

    step('flip parity (F6/F7): a recovery flip is preserved through the sim and consumed only at resolution', function(){
      var C=mkC('US'); setWar(C,true); C.idx=1; C.flipAtk=true;   // recovery at Bull Run -> flipped, procedural (F7)
      var o=bridgeAutoResolve(C);
      if(!o) throw new Error('no outcome');
      if(C.flipAtk!==true) throw new Error('the sim must NOT consume the flip (re-resolvable, like the fought abort)');
      if(o.bd.atk!=='CS') throw new Error('the flipped battle should have CS attacking, got '+o.bd.atk);
      var go=document.getElementById('arGo'); if(!go) throw new Error('no Continue');
      go.click();
      if(C.flipAtk!==false) throw new Error('resolution should CONSUME the flip');
      if(!G.battle || !G.battle.bd || G.battle.bd.atk!=='CS') throw new Error('the applied hex roster should carry the flipped orientation');
      return { flippedAtk:o.bd.atk, consumedAtApply:true, win:o.win }; });

    step('PL-8: the result card is honest — headless/neutral/inputs-vs-outcome copy; no rating claim; arGo applies via the SHARED path', function(){
      var C=mkC('US'); C.idx=9; var idx0=C.idx;
      var o=bridgeAutoResolve(C);
      if(!o) throw new Error('no outcome');
      var h=sheetHtml();
      if(h.indexOf('Delegated to the Field')<0) throw new Error('card heading missing');
      if(h.indexOf('same real-time engine')<0) throw new Error('one-battle-truth copy missing');
      if(h.indexOf('neutral Veteran')<0) throw new Error('PL-10 neutral-preset disclosure missing');
      if(h.indexOf('The field decided the outcome')<0) throw new Error('PL-8 inputs-vs-outcome line missing');
      if(h.indexOf('rating ')>=0) throw new Error('stale rating copy survives');
      var go=document.getElementById('arGo'); if(!go) throw new Error('no Continue button');
      go.click();
      if(C.stats.battles!==1) throw new Error('campaignAdvance did not record the battle');
      var coherent = o.win ? (C.idx===idx0+1 && !C.recovery) : (C.idx===idx0 && C.recovery===true);
      if(!coherent) throw new Error('idx/recovery incoherent after apply');
      if(!(C.stats.suff>0)) throw new Error('player casualties must feed the strategic tick');
      if(!(C.stats.infl>0)) throw new Error('inflicted casualties must be recorded');
      if(o.win){ var k=0; for(var i=0;i<G.battle.units.length;i++){ var u=G.battle.units[i]; if(u&&u.side==='US'&&u.alive&&u.type!=='hq'&&(u.kills||0)>0) k++; }
        if(!(k>0)) throw new Error('XP parity: a delegated win should credit kills to survivors'); }
      return { win:o.win, idx:idx0+'->'+C.idx, suff:C.stats.suff, infl:C.stats.infl }; });

    step('teardown hygiene: the headless resolve leaves NO tactical residue', function(){
      var C=mkC('US'); C.idx=9; _arRunHeadlessSim(C);
      if(__FIELD.launched!==false) throw new Error('field engine left launched');
      if(document.getElementById('fldRoot')) throw new Error('headless resolve built battle DOM');
      if(__FIELD.campaignCtx!==null) throw new Error('campaignCtx leaked');
      if(typeof __FIELD._returnFn==='function') throw new Error('_returnFn leaked from a headless resolve');
      return { clean:true }; });

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
  page.setDefaultTimeout(600000);
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });   // slow-Mac: 'load' stalls while embedded assets stream (D233 class)
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-auto-resolve.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-auto-resolve ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
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
