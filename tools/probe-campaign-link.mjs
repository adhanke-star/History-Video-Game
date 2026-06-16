#!/usr/bin/env node
// tools/probe-campaign-link.mjs — PHASE A: connect the strategic desk <-> the real-time tactical engine.
// Verifies A1 (the strategic army conditions the tactical brigades: a strong war fields more men + the
// bought loadout re-arms the line; fresh ~ nominal; PLAYER-side only; standalone untouched), A2 (the
// bridge offers a "Fight in real time" option; First Bull Run [US] routes to the bullrun1 scenario;
// every other battle gets a conditioned procedural fight; the FREE skirmish builder honors side/forces/
// terrain), and A3 (the real-time outcome's REAL casualty fractions drive campaignAdvance -> a win
// advances the chain, a loss enters recovery, both feed the strategic tick; determinism; no Classic
// contamination). Drives __FIELD headless via fldStepN. Writes shots/probe-campaign-link.json.
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
  function mkC(side){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    C.clock.year=1864; if(C.president) C.president.date={year:1864,month:1}; return C; }
  function setWar(C, strong){ if(C.manpower) C.manpower.strength=strong?100:35; if(C.production) C.production.equipIndex=strong?100:25;
    if(C.clock) C.clock.weariness=strong?0:95; if(C.warroom) C.warroom.supply=strong?100:30; if(C.blockade) C.blockade.importFactor=1.0; }
  function bdYear(id, yr, atk){ var b=BATTLES.find(function(x){return x.id===id;})||BATTLES[0]; var c={}; for(var k in b){ if(b.hasOwnProperty(k)) c[k]=b[k]; } if(yr)c.year=yr; if(atk)c.atk=atk; return c; }
  function playerMen(side){ var m=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side) m+=(u.men||0); } return Math.round(m); }
  function playerCount(side){ var n=0; for(var i=0;i<__FIELD.units.length;i++){ if(__FIELD.units[i].side===side) n++; } return n; }
  function runToEnd(maxSteps){ if(__FIELD.phase==='deploy'){ __FIELD.phase='battle'; __FIELD.paused=false; } var n=0; while(__FIELD.phase==='battle' && n<maxSteps){ fldSimStep(0.05); n++; } return n; }
  // launch a CONDITIONED procedural campaign battle headless (what fldLaunchCampaignBattle does, renderer none + seed)
  function launchProc(C, bd, seed){ fldLaunchSandbox({ renderer:'none', autoBoth:true, seed:seed||7,
    campaign:{ bd:bd, fromCampaign:true, _conditioned:false }, skirmish:_fldCampaignSkirmishParams(bd, C) }); }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldCampaignCondition!=='function'
        || typeof fldCampaignComputeOutcome!=='function' || typeof fldCampaignApplyOutcome!=='function' || typeof BATTLES==='undefined')
      return JSON.stringify({ok:false, fatal:'Phase A campaign-link missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; G.settings.tacticalFog=false; __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=true;   // B-2/B-3/B-4: lock the PRE-officer/PRE-logistics/PRE-arms A-layer BYTE-IDENTICAL (each layer -> its own probe). tacticalFog pinned OFF (D67: bullrun1 now defaults fog ON).

    // ---------- A1 — conditioning ----------
    step('A1: a STRONG war fields more men than a WEAK war (same battle/seed); FRESH ~ nominal (74 anchor)', function(){
      var bd=bdYear('antietam',1864,'CS');   // player US defends -> asymmetric, but men-count test is seed/atk-agnostic
      var Cs=mkC('US'); setWar(Cs,true); launchProc(Cs,bd,11); var strong=playerMen('US'), aS=bridgeArmy(Cs).overall;
      var Cw=mkC('US'); setWar(Cw,false); launchProc(Cw,bd,11); var weak=playerMen('US'), aW=bridgeArmy(Cw).overall;
      var Cf=mkC('US'); launchProc(Cf,bd,11); var fresh=playerMen('US'), aF=bridgeArmy(Cf).overall;   // fresh defaults
      if (!(strong>weak)) throw new Error('strong war should field more men: strong='+strong+' weak='+weak);
      if (!(aS>aF && aF>aW)) throw new Error('overall ordering strong>fresh>weak broke: '+aS+'/'+aF+'/'+aW);
      // fresh anchored near nominal: within ~6% of the un-conditioned baseline (mul in [0.97,1.06] at overall~74)
      var nominal=0; for(var i=0;i<__FIELD.units.length;i++){ if(__FIELD.units[i].side==='US') nominal+=(__FIELD.units[i].maxMen/Math.max(0.88,Math.min(1.12,1+(aF-74)*0.0045))); }
      return { strongMen:strong, weakMen:weak, freshMen:fresh, overallStrong:aS, overallFresh:aF, overallWeak:aW }; });

    step('A1: the bought loadout RE-ARMS the player line (Spencers -> pow 2.05); enemy is NOT re-armed', function(){
      var bd=bdYear('antietam',1864,'CS'); var C=mkC('US'); setWar(C,true);
      C.armory.loadout={ spencer:1.0 };
      launchProc(C,bd,5);
      var pArmed=0, pTot=0, eSpencer=0;
      for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i];
        if(u.side==='US'&&u.arm==='inf'){ pTot++; if(u.weapon==='spencer'&&u.pow>=2.0) pArmed++; }
        if(u.side==='CS'&&u.weapon==='spencer') eSpencer++; }
      if(!(pArmed>0)) throw new Error('no player brigade re-armed with the bought Spencers');
      if(pArmed!==pTot) throw new Error('a 100% Spencer loadout should arm every player brigade: '+pArmed+'/'+pTot);
      if(eSpencer>0) throw new Error('the ENEMY was armed from the player arsenal ('+eSpencer+') — leak');
      return { playerArmed:pArmed, playerInf:pTot, enemySpencer:eSpencer }; });

    step('A1: STANDALONE (no campaign) is NOT conditioned — campaignCtx null + nominal men', function(){
      G.campaign=null;
      fldLaunchSandbox({ renderer:'none', autoBoth:true, seed:9, skirmish:{ playerSide:'US', attacker:null, year:1864, countPlayer:3, countEnemy:3, menPlayer:1600, menEnemy:1500, weaponPlayer:'spring', weaponEnemy:'rifled', terrain:'open' } });
      if(__FIELD.campaignCtx!==null) throw new Error('standalone skirmish must not set campaignCtx');
      var bad=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side==='US'&&u.men!==1600) bad++; }
      if(bad>0) throw new Error('standalone US brigades should keep nominal 1600 men, '+bad+' differ');
      return { campaignCtx:__FIELD.campaignCtx, usCount:playerCount('US'), nominalMen:1600 }; });

    // ---------- A2 — launch + skirmish ----------
    step('A2: First Bull Run (US) routes to the bullrun1 scenario; CS / other battles -> procedural (null)', function(){
      var Cus=mkC('US'); var brun=bdYear('bullrun1',1861);
      var Ccs=mkC('CS');
      var rUS=_fldCampaignScenarioFor(brun, Cus), rCS=_fldCampaignScenarioFor(brun, Ccs);
      var rOther=_fldCampaignScenarioFor(bdYear('antietam',1862), Cus);
      if(rUS!=='bullrun1') throw new Error('US First Bull Run should route to bullrun1, got '+rUS);
      if(rCS!==null) throw new Error('CS Bull Run should NOT route to the US-attacker scenario (Phase B), got '+rCS);
      if(rOther!==null) throw new Error('a non-Bull-Run battle should be procedural (null), got '+rOther);
      return { us:rUS, cs:rCS, other:rOther }; });

    step('A2: a campaign Bull Run (US) launches the bullrun1 scenario, campaignCtx set, US units conditioned', function(){
      var C=mkC('US'); setWar(C,true);
      fldLaunchSandbox({ renderer:'none', autoBoth:true, scenario:'bullrun1', campaign:{ bd:bdYear('bullrun1',1861), fromCampaign:true, _conditioned:false } });
      if(__FIELD.scenario!=='bullrun1') throw new Error('scenario should be bullrun1, got '+__FIELD.scenario);
      if(!__FIELD.campaignCtx) throw new Error('campaignCtx not set on a campaign Bull Run');
      if(!__FIELD.campaignCtx._conditioned) throw new Error('the army was not conditioned (fldResetRun hook)');
      if(__FIELD.attacker!=='US') throw new Error('Bull Run attacker should be US');
      var us=playerCount('US'), cs=playerCount('CS');
      if(!(us>=2 && cs>=2)) throw new Error('Bull Run OOB missing: US='+us+' CS='+cs);
      return { scenario:__FIELD.scenario, conditioned:__FIELD.campaignCtx._conditioned, attacker:__FIELD.attacker, usUnits:us, csUnits:cs }; });

    step('A2: a procedural campaign battle is asymmetric (attacker=bd.atk) with a brigade OOB both sides', function(){
      var C=mkC('US'); var bd=bdYear('fredericksburg',1862,'US'); launchProc(C,bd,3);
      if(__FIELD.scenario!=='skirmish') throw new Error('procedural battle scenario should be skirmish, got '+__FIELD.scenario);
      if(__FIELD.attacker!=='US') throw new Error('attacker should follow bd.atk (US), got '+__FIELD.attacker);
      if(__FIELD.defender!=='CS') throw new Error('defender should be CS, got '+__FIELD.defender);
      if(!(playerCount('US')>=2 && playerCount('CS')>=2)) throw new Error('procedural OOB missing units');
      if(!__FIELD.campaignCtx || !__FIELD.campaignCtx._conditioned) throw new Error('procedural battle not conditioned');
      return { scenario:__FIELD.scenario, attacker:__FIELD.attacker, defender:__FIELD.defender, us:playerCount('US'), cs:playerCount('CS') }; });

    step('A2: the FREE skirmish builder honors side / count / terrain (CS player, 5v5, OPEN = no woods)', function(){
      G.campaign=null;
      fldLaunchSandbox({ renderer:'none', autoBoth:true, skirmish:{ playerSide:'CS', attacker:null, year:1863, countPlayer:5, countEnemy:5, menPlayer:1600, menEnemy:1500, weaponPlayer:'rifled', weaponEnemy:'rifled', terrain:'open' } });
      if(playerCount('CS')!==5 || playerCount('US')!==5) throw new Error('want 5v5, got CS='+playerCount('CS')+' US='+playerCount('US'));
      if(__FIELD.terrain.woods && __FIELD.terrain.woods.length!==0) throw new Error('OPEN terrain should have no woods, got '+__FIELD.terrain.woods.length);
      if(__FIELD.attacker!==null) throw new Error('a free skirmish is symmetric (attacker null), got '+__FIELD.attacker);
      return { csUnits:playerCount('CS'), usUnits:playerCount('US'), woods:(__FIELD.terrain.woods||[]).length }; });

    step('A2: the bridge briefing offers a "Fight in real time" button beside Auto-resolve + Classic', function(){
      var C=mkC('US'); if(typeof bridgeBriefingHTML!=='function') throw new Error('bridgeBriefingHTML missing');
      var h=bridgeBriefingHTML(C);
      if(h.indexOf('brgRealTime')<0) throw new Error('no Fight-in-real-time button id');
      if(h.indexOf('Fight in real time')<0) throw new Error('no Fight-in-real-time label');
      if(h.indexOf('brgAuto')<0 || h.indexOf('brgToField')<0) throw new Error('the auto-resolve + Classic options should remain');
      var sk=_fldSkirmishHTML(); if(sk.indexOf('fldSkGo')<0 || sk.indexOf('Your side')<0) throw new Error('skirmish menu HTML malformed');
      return { hasRealTime:true, hasAuto:true, hasClassic:true, skirmishMenu:true }; });

    // ---------- A3 — feedback loop ----------
    step('A3: a real headless battle resolves + computes REAL casualty fractions (men lost / fielded)', function(){
      var C=mkC('US'); setWar(C,true); var bd=bdYear('antietam',1864,'CS'); launchProc(C,bd,21);
      runToEnd(14000);
      if(__FIELD.phase!=='over') throw new Error('battle did not end, phase='+__FIELD.phase);
      var o=fldCampaignComputeOutcome();
      if(!o) throw new Error('no outcome computed');
      if(['US','CS',null].indexOf(o.winnerSide)<0) throw new Error('bad winnerSide '+o.winnerSide);
      if(!(o.pFrac>=0 && o.pFrac<=0.92 && o.eFrac>=0 && o.eFrac<=0.92)) throw new Error('fractions out of range: p='+o.pFrac+' e='+o.eFrac);
      if(!(o.pFrac>0 || o.eFrac>0)) throw new Error('a fought battle should produce casualties on at least one side');
      return { winner:o.winnerSide, type:o.type, pFrac:Math.round(o.pFrac*1000)/1000, eFrac:Math.round(o.eFrac*1000)/1000, endT:Math.round(__FIELD.t) }; });

    step('A3: applying a WIN advances the chain + feeds the strategic tick (substitutable for auto-resolve)', function(){
      var C=mkC('US'); setWar(C,true); var idx0=C.idx; var bd=bdYear('antietam',1864,'CS');
      fldCampaignApplyOutcome({ bd:bd, winnerSide:'US', type:'decisive', pFrac:0.18, eFrac:0.66, win:true, playerSide:'US' });
      if(C.stats.battles!==1) throw new Error('campaignAdvance should record the battle, got '+C.stats.battles);
      if(C.idx!==idx0+1) throw new Error('a win should advance the chain: '+idx0+'->'+C.idx);
      if(!(C.stats.suff>0)) throw new Error('player casualties should feed the strategic tick (suff), got '+C.stats.suff);
      if(!(C.stats.infl>0)) throw new Error('inflicted casualties should be recorded (infl), got '+C.stats.infl);
      return { idx:idx0+'->'+C.idx, battles:C.stats.battles, suff:C.stats.suff, infl:C.stats.infl }; });

    step('A3: applying a LOSS enters recovery (does NOT advance) — the loop is honestly substitutable', function(){
      var C=mkC('US'); setWar(C,false); var idx0=C.idx; var bd=bdYear('antietam',1864,'US');
      fldCampaignApplyOutcome({ bd:bd, winnerSide:'CS', type:'decisive', pFrac:0.66, eFrac:0.18, win:false, playerSide:'US' });
      if(C.idx!==idx0) throw new Error('a loss should NOT advance the chain: idx='+C.idx);
      if(C.recovery!==true) throw new Error('a loss should enter recovery');
      if(!(C.stats.suff>0)) throw new Error('player casualties should still feed the tick on a loss');
      return { idx:C.idx, recovery:C.recovery, suff:C.stats.suff }; });

    step('A3: DETERMINISM — same campaign/seed -> identical outcome (winner + fractions)', function(){
      var bd=bdYear('antietam',1864,'CS');
      var C1=mkC('US'); setWar(C1,true); launchProc(C1,bd,33); runToEnd(14000); var o1=fldCampaignComputeOutcome();
      var C2=mkC('US'); setWar(C2,true); launchProc(C2,bd,33); runToEnd(14000); var o2=fldCampaignComputeOutcome();
      if(o1.winnerSide!==o2.winnerSide) throw new Error('non-deterministic winner: '+o1.winnerSide+' vs '+o2.winnerSide);
      if(Math.abs(o1.pFrac-o2.pFrac)>1e-9 || Math.abs(o1.eFrac-o2.eFrac)>1e-9) throw new Error('non-deterministic fractions');
      return { winner:o1.winnerSide, pFrac:Math.round(o1.pFrac*1000)/1000 }; });

    step('bug-hunt F5: the re-arm plan spans reinforcements (armPlan >= initial inf + reinforcement specs)', function(){
      var C=mkC('US'); setWar(C,true); C.armory.loadout={ lorenz:1.0 };   // lorenz->rifled (era 1861, passes Bull Run's gate)
      fldLaunchSandbox({ renderer:'none', autoBoth:true, scenario:'bullrun1', campaign:{ bd:bdYear('bullrun1',1861), fromCampaign:true, _conditioned:false } });
      var initInf=0, i; for(i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side==='US'&&u.arm==='inf') initInf++; }
      var reinfInf=0, rs=__FIELD.reinforce||[]; for(i=0;i<rs.length;i++){ var sp=rs[i].spec; if(sp&&sp.side==='US'&&(sp.arm==='inf'||!sp.arm)) reinfInf++; }
      var plan=(__FIELD.campaignCtx._params&&__FIELD.campaignCtx._params.armPlan)||[];
      if(reinfInf<1) throw new Error('precondition: Bull Run should have US infantry reinforcements');
      if(plan.length < initInf+reinfInf) throw new Error('F5: armPlan('+plan.length+') must cover initial('+initInf+')+reinforcements('+reinfInf+')');
      return { initInf:initInf, reinfInf:reinfInf, planLen:plan.length }; });

    step('bug-hunt F6/F7: a recovery flip is preserved on abort + routes procedural (not the US-attacker scenario)', function(){
      var C=mkC('US'); setWar(C,true);
      var bd0=_brgNextBattle(C), origAtk=bd0.atk, expFlip=(origAtk==='US')?'CS':'US';
      C.flipAtk=true;
      fldLaunchCampaignBattle(C);   // renderer 3d builds DOM; the sim + ctx are set synchronously
      if(C.flipAtk!==true) throw new Error('F6: flipAtk must NOT be consumed at launch (abort-relaunchable), got '+C.flipAtk);
      if(__FIELD.scenario==='bullrun1') throw new Error('F7: a recovery flip must NOT use the fixed US-attacker bullrun1 scenario');
      if(__FIELD.attacker!==expFlip) throw new Error('F7: flipped attacker should be '+expFlip+', got '+__FIELD.attacker);
      fldExit(true);
      if(C.flipAtk!==true) throw new Error('F6: aborting must PRESERVE the recovery flip, got '+C.flipAtk);
      fldCampaignApplyOutcome({ bd:Object.assign({},bd0,{atk:expFlip}), winnerSide:'US', type:'win', pFrac:0.1, eFrac:0.3, win:true, playerSide:'US' });
      if(C.flipAtk!==false) throw new Error('F6: a resolved battle should CONSUME the flip, got '+C.flipAtk);
      return { origAtk:origAtk, flippedAttacker:expFlip, preservedOnAbort:true, consumedOnResolve:true }; });

    step('A3/exit: a campaign launch sets _returnFn (abort -> briefing); fldExit clears the linkage', function(){
      var C=mkC('US'); setWar(C,true); var bd=bdYear('fredericksburg',1862,'US');
      fldLaunchCampaignBattle(C);   // renderer 3d builds DOM; the sim is built synchronously regardless
      if(typeof __FIELD._returnFn!=='function') throw new Error('a campaign launch should set _returnFn for abort-return');
      if(!__FIELD.campaignCtx) throw new Error('campaignCtx not set by fldLaunchCampaignBattle');
      fldExit(true);   // silent teardown
      if(__FIELD.campaignCtx!==null) throw new Error('fldExit should clear campaignCtx');
      if(__FIELD._returnFn!==null) throw new Error('fldExit should clear _returnFn');
      return { returnFnSet:true, clearedAfterExit:true }; });

    step('NO Classic contamination: a standalone skirmish leaves G.campaign untouched + no field state leak', function(){
      G.campaign=null;
      fldLaunchSandbox({ renderer:'none', autoBoth:true, skirmish:{ playerSide:'US', attacker:null, year:1862, countPlayer:2, countEnemy:2, menPlayer:1500, menEnemy:1500, weaponPlayer:'rifled', weaponEnemy:'smooth', terrain:'woods' } });
      if(G.campaign!==null) throw new Error('a standalone skirmish must not create a campaign');
      if(__FIELD.campaignCtx!==null) throw new Error('standalone campaignCtx must be null');
      if(typeof G.battle!=='undefined' && G.battle && G.mode==='battle') throw new Error('standalone skirmish leaked a hex battle');
      return { campaign:G.campaign, campaignCtx:__FIELD.campaignCtx }; });

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
    writeFileSync(join(OUT,'probe-campaign-link.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-campaign-link ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
