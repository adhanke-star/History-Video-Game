#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-decisions.mjs — S2 m2 executive decisions + the pendingChoices loop.
// Verifies: the deck loads; decOnResolve surfaces cards by side + year and OWNS the
// queue (persists across turns, drops resolved/expired); decResolve applies bounded
// clamped effects + records + dequeues; EMANCIPATION is a dated decision that gates
// the manpower USCT pool (issue -> unlocks even pre-1863; decline -> never; no-decision
// -> the 1863 calendar default holds = no regression); render + wire don't throw.
// Writes shots/probe-decisions.json.
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
    C.clock.year=(y||1863); C.president.date={year:(y||1863),month:(m||6)};
    C.clock.intervention=20; C.clock.capital=20; C.clock.weariness=40; return C; }
  function pend(C){ return (C.president.pendingChoices||[]).slice(); }
  try {
    if (typeof _decData!=='function' || typeof decOnResolve!=='function') return JSON.stringify({ok:false,fatal:'decisions module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('decision deck loads + schema integrity', function(){
      var d=_decData(); if(!d||!d.cards||!d.cards.length) throw new Error('no GAME_DATA.decisions.cards');
      var seenIds={};
      for(var i=0;i<d.cards.length;i++){ var c=d.cards[i];
        if(seenIds[c.id]) throw new Error('duplicate card id (the second is dead data): '+c.id); seenIds[c.id]=1;
        if(!c.id||!c.side||!c.category||!c.title||!c.trigger||!c.situation||!c.options||!c.options.length||!c.card) throw new Error('card missing field (id/side/category/title/trigger/situation/options/card): '+(c&&c.id));
        for(var j=0;j<c.options.length;j++){ var o=c.options[j]; if(!o.id||!o.label) throw new Error('option missing field in '+c.id); } }
      return { cards:d.cards.length, ids:d.cards.map(function(c){return c.id;}) }; });

    step('decInit creates the state (queue / resolved / emancipation)', function(){
      var C=mkC('US',1863,6);
      if(!Array.isArray(C.president.pendingChoices)) throw new Error('no pendingChoices array');
      if(typeof C.president.decisionsResolved!=='object') throw new Error('no decisionsResolved');
      if(typeof C.president.emancipation!=='object') throw new Error('no emancipation state');
      return { ok:true }; });

    step('decOnResolve surfaces cards by SIDE + YEAR; the queue is side-correct', function(){
      var Cu=mkC('US',1863,6); decOnResolve('US','win',{bd:{year:1863}},Cu,true); var pu=pend(Cu);
      if(pu.indexOf('emancipation-proclamation')<0) throw new Error('US 1863 should surface emancipation, got '+pu);
      if(pu.indexOf('us-habeas-corpus')<0) throw new Error('US should surface habeas, got '+pu);
      if(pu.indexOf('cs-bread-riot')>=0) throw new Error('US must NOT see a CS card');
      var Cc=mkC('CS',1863,6); decOnResolve('CS','win',{bd:{year:1863}},Cc,true); var pc=pend(Cc);
      if(pc.indexOf('cs-bread-riot')<0) throw new Error('CS 1863 should surface bread-riot, got '+pc);
      if(pc.indexOf('emancipation-proclamation')>=0) throw new Error('CS must NOT see the US emancipation card');
      return { usPending:pu, csPending:pc }; });

    step('YEAR gating: emancipation not before 1862; habeas expires after 1864', function(){
      var C61=mkC('US',1861,6); decOnResolve('US','win',{bd:{year:1861}},C61,true); var p61=pend(C61);
      if(p61.indexOf('emancipation-proclamation')>=0) throw new Error('emancipation must NOT surface in 1861');
      if(p61.indexOf('us-habeas-corpus')<0) throw new Error('habeas SHOULD surface in 1861');
      var C65=mkC('US',1865,6); decOnResolve('US','win',{bd:{year:1865}},C65,true); var p65=pend(C65);
      if(p65.indexOf('us-habeas-corpus')>=0) throw new Error('habeas (latest 1864) must NOT surface in 1865');
      return { y1861:p61, y1865:p65 }; });

    step('CADENCE: <=2 new non-hinge cards per turn; the hinge always surfaces', function(){
      var C=mkC('US',1863,6);   // US 1863 eligible non-hinge: habeas, vallandigham, draft-riots (3) + emancipation (hinge)
      decOnResolve('US','win',{bd:{year:1863}},C,true);
      var p1=pend(C), nh1=p1.filter(function(id){ var c=_decById(id); return c && !(c.trigger&&c.trigger.hinge); });
      if(nh1.length>2) throw new Error('more than 2 non-hinge surfaced in one turn: '+nh1);
      if(p1.indexOf('emancipation-proclamation')<0) throw new Error('the hinge should always surface, even past the non-hinge cap');
      decOnResolve('US','win',{bd:{year:1863}},C,true);   // a later turn surfaces the held-back card
      var p2=pend(C), nh2=p2.filter(function(id){ var c=_decById(id); return c && !(c.trigger&&c.trigger.hinge); });
      if(!(nh2.length>nh1.length)) throw new Error('a later turn should surface more non-hinge cards: '+nh1.length+' -> '+nh2.length);
      return { turn1NonHinge:nh1.length, turn2NonHinge:nh2.length, pendingTurn1:p1 }; });

    step('the queue PERSISTS across turns (presOnResolve no longer wipes it)', function(){
      var C=mkC('US',1863,6); decOnResolve('US','win',{bd:{year:1863}},C,true);
      var before=pend(C).length; if(!(before>0)) throw new Error('nothing pending to test persistence');
      presOnResolve('US','win',{bd:{name:'X',year:1863}},C,true);   // the old S0 stub used to clear here
      if(C.president.pendingChoices.length!==before) throw new Error('presOnResolve wiped the queue: '+before+' -> '+C.president.pendingChoices.length);
      return { persisted:before }; });

    step('decResolve applies bounded effects + records + dequeues', function(){
      var C=mkC('US',1863,6); decOnResolve('US','win',{bd:{year:1863}},C,true);
      var iv0=C.clock.intervention, cap0=C.clock.capital;
      decResolve(C,'emancipation-proclamation','issue');
      if(C.president.decisionsResolved['emancipation-proclamation']!=='issue') throw new Error('choice not recorded');
      if(C.president.pendingChoices.indexOf('emancipation-proclamation')>=0) throw new Error('resolved card still pending');
      if(C.clock.intervention!==iv0-5) throw new Error('intervention effect wrong: '+iv0+'->'+C.clock.intervention+' (expected -5)');
      if(C.clock.capital!==cap0-3) throw new Error('capital effect wrong: '+cap0+'->'+C.clock.capital+' (expected -3)');
      return { intervention:C.clock.intervention, capital:C.clock.capital }; });

    step('EMANCIPATION gates the USCT pool: ISSUE unlocks (even pre-1863)', function(){
      var C=mkC('US',1862,6);
      manpowerOnResolve('US','win',{bd:{year:1862}},C,true);
      if(C.manpower.usctUnlocked) throw new Error('USCT should NOT unlock at 1862 with no emancipation');
      decOnResolve('US','win',{bd:{year:1862}},C,true);    // surface the card (decResolve only resolves a pending card)
      decResolve(C,'emancipation-proclamation','issue');   // issue early
      if(!(C.president.emancipation.issued===true)) throw new Error('issue did not set emancipation.issued');
      manpowerOnResolve('US','win',{bd:{year:1862}},C,true);
      if(!C.manpower.usctUnlocked) throw new Error('USCT should unlock once emancipation is issued, even in 1862');
      return { unlocked:C.manpower.usctUnlocked, emYear:C.president.emancipation.year }; });

    step('EMANCIPATION gates the USCT pool: DECLINE never unlocks (even 1864+)', function(){
      var C=mkC('US',1864,6);
      decOnResolve('US','win',{bd:{year:1864}},C,true);    // surface the card first
      decResolve(C,'emancipation-proclamation','refuse');
      if(!(C.president.emancipation.declined===true)) throw new Error('refuse did not set emancipation.declined');
      manpowerOnResolve('US','win',{bd:{year:1864}},C,true);
      if(C.manpower.usctUnlocked) throw new Error('USCT must NOT unlock when emancipation was declined, even in 1864');
      return { unlocked:C.manpower.usctUnlocked }; });

    step('NO-REGRESSION: no decision -> the 1863 calendar default still unlocks USCT', function(){
      var C=mkC('US',1863,6);
      manpowerOnResolve('US','win',{bd:{year:1863}},C,true);
      if(!C.manpower.usctUnlocked) throw new Error('USCT should unlock by the 1863 calendar default when no decision is made');
      return { unlocked:C.manpower.usctUnlocked }; });

    step('decResolve is IDEMPOTENT + pending-gated (D50.6/.7) — no re-apply, no emancipation flip', function(){
      var C=mkC('US',1863,6); decOnResolve('US','win',{bd:{year:1863}},C,true);
      var iv0=C.clock.intervention;
      decResolve(C,'emancipation-proclamation','issue');
      var iv1=C.clock.intervention, em1=C.president.emancipation.issued;
      decResolve(C,'emancipation-proclamation','refuse');   // re-resolve attempt with a DIFFERENT option
      if(C.clock.intervention!==iv1) throw new Error('re-resolve re-applied effects: '+iv1+'->'+C.clock.intervention);
      if(C.president.emancipation.issued!==em1) throw new Error('re-resolve flipped emancipation: '+em1+'->'+C.president.emancipation.issued);
      if(C.president.decisionsResolved['emancipation-proclamation']!=='issue') throw new Error('re-resolve changed the record');
      // resolving a non-pending card is a no-op
      var cap0=C.clock.capital; decResolve(C,'us-press-censorship','suppress');
      if(C.clock.capital!==cap0) throw new Error('resolving a non-pending card applied an effect');
      return { stableIntervention:C.clock.intervention, stillIssued:C.president.emancipation.issued }; });

    step('capital is FLOOR-only, not destroyed above 100 (D50.8)', function(){
      var C=mkC('US',1863,6); decOnResolve('US','win',{bd:{year:1863}},C,true);
      C.clock.capital=98;   // near the display cap; the clock treats capital as unbounded-above
      decResolve(C,'emancipation-proclamation','refuse');   // refuse gives capital +5
      if(C.clock.capital!==103) throw new Error('capital should reach 103 (floor-only), got '+C.clock.capital);
      return { capital:C.clock.capital }; });

    step('corrupt / round-tripped saves are hardened (D50.1/.2/.3/.12)', function(){
      // (1) a primitive emancipation does not crash the USCT gate; degrades to no-decision
      var C=mkC('US',1862,6); C.president.emancipation='decline';   // a corrupt non-object value
      var threw=false; try{ manpowerOnResolve('US','win',{bd:{year:1862}},C,true); }catch(e){ threw=true; }
      if(threw) throw new Error('primitive emancipation crashed manpower');
      if(typeof C.president.emancipation!=='object') throw new Error('manpower did not sanitize emancipation');
      if(C.manpower.usctUnlocked) throw new Error('primitive emancipation should degrade to no-decision (no unlock at 1862)');
      // (2) a proper {declined:true} object DOES block the unlock at 1864 (the real player path)
      var Cd=mkC('US',1864,6); Cd.president.emancipation={issued:false,declined:true};
      manpowerOnResolve('US','win',{bd:{year:1864}},Cd,true);
      if(Cd.manpower.usctUnlocked) throw new Error('a proper decline must block the USCT unlock at 1864');
      // (3) decInit dedups a corrupt repeated pendingChoices id
      var Cq=mkC('US',1863,6); Cq.president.pendingChoices=['emancipation-proclamation','emancipation-proclamation'];
      decInit(Cq);
      if(Cq.president.pendingChoices.length!==1) throw new Error('decInit did not dedup pendingChoices: '+Cq.president.pendingChoices.length);
      // (4) a JSON round-trip of president survives decInit
      var Cr=mkC('US',1863,6); decOnResolve('US','win',{bd:{year:1863}},Cr,true); decResolve(Cr,'emancipation-proclamation','issue');
      Cr.president=JSON.parse(JSON.stringify(Cr.president));   // simulate serializeSave -> applySave
      var rt=false; try{ decInit(Cr); decRenderTab(Cr); }catch(e){ rt=true; }
      if(rt) throw new Error('round-tripped save threw');
      if(Cr.president.decisionsResolved['emancipation-proclamation']!=='issue') throw new Error('round-trip lost the resolved record');
      return { sanitized:true, declineBlocks:true, deduped:Cq.president.pendingChoices.length, roundTrip:true }; });

    step('render + wire: tab and interstitial render pending cards and wire without throwing', function(){
      var C=mkC('US',1863,6); decOnResolve('US','win',{bd:{year:1863}},C,true);
      var tab=decRenderTab(C); if(tab.indexOf('The Question of Emancipation')<0) throw new Error('tab missing the emancipation card TITLE');
      if(tab.indexOf('decChoose_tab_')<0) throw new Error('tab missing a Decide button');
      var inter=decInterstitialHTML(C); if(inter.indexOf('decChoose_int_')<0) throw new Error('interstitial missing a Decide button');
      var wrap=document.createElement('div'); wrap.id='wdContent'; wrap.innerHTML=tab; document.body.appendChild(wrap);
      var threw=false; try{ decWireTab(C); }catch(e){ threw=true; }
      var hasBtn=!!document.querySelector('[id^="decChoose_tab_"]');
      document.body.removeChild(wrap);
      if(threw) throw new Error('decWireTab threw');
      if(!hasBtn) throw new Error('Decide button not in DOM');
      return { tabLen:tab.length, interLen:inter.length, wired:true }; });

    // ---- D118: the 4 new strategic HINGE-FORK cards that STEER toward the endings ----
    step('D118 new strategic hinges load with full schema, 3 options, + a named+countered myth voice', function(){
      var ids=['us-hard-war','us-reconstruction-terms','cs-king-cotton','cs-peace-feelers'];
      for(var i=0;i<ids.length;i++){ var c=_decById(ids[i]);
        if(!c) throw new Error('missing new card '+ids[i]);
        if(!(c.trigger&&c.trigger.hinge)) throw new Error(ids[i]+' must be a hinge');
        if(!c.card||!c.card.claim||!Array.isArray(c.card.perspectives)||c.card.perspectives.length<3) throw new Error(ids[i]+' missing rich card content');
        if(c.options.length!==3) throw new Error(ids[i]+' must have exactly 3 options');
        var hasMyth=c.card.perspectives.some(function(p){ return /myth|lost cause|dunning/i.test(p.voice); });
        if(!hasMyth) throw new Error(ids[i]+' must carry a named+countered myth voice (anti-Lost-Cause)'); }
      return { ok:true }; });

    step('D118 SIDE-gate: US hinges surface for US 1864 (not CS); CS hinges for CS (not US)', function(){
      var U=mkC('US',1864,9); decOnResolve('US','win',{bd:{year:1864}},U,true); var pu=pend(U);
      if(pu.indexOf('us-hard-war')<0) throw new Error('us-hard-war should surface for US 1864');
      if(pu.indexOf('us-reconstruction-terms')<0) throw new Error('us-reconstruction-terms should surface for US 1864');
      if(pu.indexOf('cs-king-cotton')>=0||pu.indexOf('cs-peace-feelers')>=0) throw new Error('a US campaign must not surface a CS hinge');
      var S=mkC('CS',1864,9); decOnResolve('CS','win',{bd:{year:1864}},S,true); var ps=pend(S);
      if(ps.indexOf('cs-peace-feelers')<0) throw new Error('cs-peace-feelers should surface for CS 1864');
      if(ps.indexOf('us-hard-war')>=0||ps.indexOf('us-reconstruction-terms')>=0) throw new Error('a CS campaign must not surface a US hinge');
      return { usPending:pu, csPending:ps }; });

    step('D118 YEAR-gate: cs-king-cotton (1861-1862) opens early + CLOSES in 1863+; the US hinges are 1864+', function(){
      var S62=mkC('CS',1862,3); decOnResolve('CS','win',{bd:{year:1862}},S62,true);
      if(pend(S62).indexOf('cs-king-cotton')<0) throw new Error('cs-king-cotton should surface for CS 1862');
      var S63=mkC('CS',1863,6); decOnResolve('CS','win',{bd:{year:1863}},S63,true);
      if(pend(S63).indexOf('cs-king-cotton')>=0) throw new Error('cs-king-cotton (latest 1862) must NOT surface in 1863');
      var U62=mkC('US',1862,6); decOnResolve('US','win',{bd:{year:1862}},U62,true);
      if(pend(U62).indexOf('us-hard-war')>=0) throw new Error('us-hard-war (1864+) must NOT surface in 1862');
      return { ok:true }; });

    step('D118 effects apply bounded+clamped (momentum / foreign / blockade levers)', function(){
      // us-hard-war "total" -> weariness -5, capital +2 (lifts momentum)
      var U=mkC('US',1864,9); decOnResolve('US','win',{bd:{year:1864}},U,true);
      var w0=U.clock.weariness, cap0=U.clock.capital;
      decResolve(U,'us-hard-war','total');
      if(U.clock.weariness!==w0-5) throw new Error('us-hard-war total weariness '+w0+'->'+U.clock.weariness+' (expected -5)');
      if(U.clock.capital!==cap0+2) throw new Error('us-hard-war total capital '+cap0+'->'+U.clock.capital+' (expected +2)');
      // cs-king-cotton "embargo" -> intervention +3, importFactor -0.05 (clamped), capital -3
      var S=mkC('CS',1862,3); decOnResolve('CS','win',{bd:{year:1862}},S,true);
      if(!S.blockade) S.blockade={}; S.blockade.importFactor=0.5;
      var iv0=S.clock.intervention, scap0=S.clock.capital;
      decResolve(S,'cs-king-cotton','embargo');
      if(S.clock.intervention!==iv0+3) throw new Error('king-cotton embargo intervention '+iv0+'->'+S.clock.intervention+' (expected +3)');
      if(Math.abs(S.blockade.importFactor-0.45)>1e-9) throw new Error('king-cotton embargo importFactor expected 0.45, got '+S.blockade.importFactor);
      if(S.clock.capital!==Math.max(0,scap0-3)) throw new Error('king-cotton embargo capital '+scap0+'->'+S.clock.capital+' (expected -3)');
      return { ok:true }; });

    step('D118 CADENCE unchanged: all US hinges surface past the non-hinge cap', function(){
      var C=mkC('US',1864,9); decOnResolve('US','win',{bd:{year:1864}},C,true);
      var p=pend(C);
      var nh=p.filter(function(id){ var c=_decById(id); return c && !(c.trigger&&c.trigger.hinge); });
      if(nh.length>2) throw new Error('more than 2 non-hinge surfaced in one turn: '+nh);
      if(p.indexOf('us-hard-war')<0||p.indexOf('us-reconstruction-terms')<0||p.indexOf('emancipation-proclamation')<0) throw new Error('all US hinges must surface even past the non-hinge cap');
      return { nonHinge:nh.length, pending:p.length }; });
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
    writeFileSync(join(OUT,'probe-decisions.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-decisions ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-decisions.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-decisions.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-decisions: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-decisions: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-decisions: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
