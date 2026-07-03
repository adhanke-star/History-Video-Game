#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-endings.mjs — E1 ALTERNATE ENDINGS (the alt-history RESULTS a well-played war
// earns): D115 fantastical tier + D116 GROUNDED tier (CS-half) + D117 GROUNDED tier (US-half).
// Verifies: the module loads; a fresh campaign has no
// reached/near endings; an ending is EARNED — its gambit/precond OPENS it (within reach)
// and the performance GATE (momentum / victory / the 1864 election) SECURES it (reached);
// side-awareness (US endings only for US, CS only for CS); each carries a real (non-generic)
// counterfactual + a secure-hint when within reach; the section renders the CVD-safe chip
// (★ reached / ◇ within reach) + the "fantastical" label; endScan WRITES NOTHING (pure
// read-out); divRenderTab embeds the section (byte-identical guard when absent).
// Writes shots/probe-endings.json.
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
    if(typeof vicInit==='function') vicInit(C);
    C.clock.year=(y||1863); C.president.date={year:(y||1863),month:(m||6)}; return C; }
  // momentum knobs: vicMomentum = 0.55*winRate + 0.30*(1-weariness/100) + 0.15*(capital/120)
  function setMom(C, won, battles, weariness, capital){ C.stats.won=won; C.stats.battles=battles; C.clock.weariness=weariness; C.clock.capital=capital; }
  function has(list, id){ for(var i=0;i<list.length;i++) if(list[i].id===id) return list[i]; return null; }
  try {
    if (typeof endScan!=='function' || typeof endRenderSection!=='function')
      return JSON.stringify({ok:false,fatal:'endings module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('module loads; a FRESH campaign has NO reached/near endings (nothing opened yet)', function(){
      var C=mkC('US',1863,6); setMom(C,5,10,30,60);
      var sc=endScan(C);
      if(sc.reached.length!==0||sc.near.length!==0) throw new Error('a fresh campaign must have no endings opened, got '+JSON.stringify({r:sc.reached.length,n:sc.near.length}));
      var html=endRenderSection(C);
      if(html.indexOf('fantastical')<0) throw new Error('the empty section must still name the fantastical tier');
      if(html.indexOf('NaN')>=0||html.indexOf('undefined')>=0) throw new Error('fresh render leaked NaN/undefined');
      return { reached:0, near:0 }; });

    step('EARNED — a gambit OPENS an ending (within reach); the performance GATE SECURES it (reached)', function(){
      // us-russian played, momentum >= 0.5 -> reached; momentum < 0.5 -> within reach
      var Chi=mkC('US',1863,6); Chi.strategy.wildsPlayed=['us-russian']; setMom(Chi,5,10,30,60);   // momentum ~0.56
      var rHi=endScan(Chi); if(!has(rHi.reached,'us-russo-american')) throw new Error('us-russian + momentum>=0.5 must REACH the Russo-American ending');
      var Clo=mkC('US',1863,6); Clo.strategy.wildsPlayed=['us-russian']; setMom(Clo,2,10,60,0);     // momentum ~0.23
      var rLo=endScan(Clo); if(!has(rLo.near,'us-russo-american')) throw new Error('us-russian + low momentum must be WITHIN REACH (opened, not secured)');
      if(has(rLo.reached,'us-russo-american')) throw new Error('low momentum must NOT secure the ending');
      var n=has(rLo.near,'us-russo-american'); if(!n.secureHint) throw new Error('a within-reach ending must carry a secure-hint');
      return { reached:'us-russo-american', near:'us-russo-american' }; });

    step('SIDE-AWARE — US sees only US endings; CS only CS', function(){
      var U=mkC('US',1863,6); U.strategy.wildsPlayed=['us-russian','cs-trent']; setMom(U,8,10,20,100);
      var us=endScan(U); if(has(us.reached,'cs-british-war')||has(us.near,'cs-british-war')) throw new Error('a US campaign must not surface a CS ending');
      var S=mkC('CS',1862,2); S.strategy.wildsPlayed=['cs-trent','us-russian']; setMom(S,8,10,20,100); S.blockade.recognition=60;
      var cs=endScan(S); if(has(cs.reached,'us-russo-american')||has(cs.near,'us-russo-american')) throw new Error('a CS campaign must not surface a US ending');
      if(!has(cs.reached,'cs-british-war')) throw new Error('CS cs-trent + momentum + recognition>=45 must reach the British-war ending');
      return { usOnlyUS:true, csOnlyCS:true }; });

    step('CS — the Trent path needs recognition AND momentum; the Golden Circle needs a reachable victory + dominant momentum', function(){
      var Cb=mkC('CS',1862,2); Cb.strategy.wildsPlayed=['cs-trent']; setMom(Cb,8,10,20,100); Cb.blockade.recognition=20;   // recognition short
      var b=endScan(Cb); if(!has(b.near,'cs-british-war')) throw new Error('cs-trent with low recognition must be within reach, not reached');
      var Cg=mkC('CS',1865,2); Cg.strategy.victoryReady='will'; setMom(Cg,10,10,10,120);   // momentum ~0.97
      var g=endScan(Cg); if(!has(g.reached,'cs-golden-circle')) throw new Error('a reachable peace + dominant momentum must reach the Golden Circle');
      if(g.reached.filter(function(e){return e.id==='cs-golden-circle';})[0].hist.indexOf('May')<0 && g.reached.filter(function(e){return e.id==='cs-golden-circle';})[0].hist.indexOf('Golden Circle')<0)
        throw new Error('the Golden Circle counterfactual must name the historical ambition honestly');
      var Cg2=mkC('CS',1865,2); Cg2.strategy.victoryReady='will'; setMom(Cg2,5,10,40,0);   // momentum ~0.5 (< 0.66)
      if(has(endScan(Cg2).reached,'cs-golden-circle')) throw new Error('the Golden Circle needs DOMINANT momentum (>=0.66), not merely positive');
      return { ok:true }; });

    step('US — Lincoln lives needs emancipation + the 1864 election won + a winning war; the 13th-early needs an early Proclamation', function(){
      // emancipation issued, but election not yet won -> lincoln-lives within reach
      var Cn=mkC('US',1864,9); Cn.president.emancipation={issued:true,declined:false,year:1863,month:1}; setMom(Cn,8,10,20,100);
      var n=endScan(Cn); if(!has(n.near,'us-lincoln-lives')) throw new Error('emancipation without the won election must leave Lincoln-lives within reach');
      // election won + winning -> reached
      var Cr=mkC('US',1864,11); Cr.president.emancipation={issued:true,declined:false,year:1863,month:1}; Cr.clock.resolved1864=true; Cr.clock.elected=true; setMom(Cr,9,10,15,110);
      var r=endScan(Cr); if(!has(r.reached,'us-lincoln-lives')) throw new Error('emancipation + the won 1864 election + a winning war must REACH Lincoln-lives');
      if(r.reached.filter(function(e){return e.id==='us-lincoln-lives';})[0].hist.indexOf('Booth')<0) throw new Error('the Lincoln-lives counterfactual must name the historical assassination (Booth)');
      // an EARLY (1862) emancipation opens the 13th-early; a 1863 one does not
      var Ce=mkC('US',1863,6); Ce.president.emancipation={issued:true,declined:false,year:1862,month:9}; setMom(Ce,6,10,25,80);
      if(!has(endScan(Ce).reached,'us-13th-early')) throw new Error('an early (1862) emancipation + momentum must reach the 13th-early');
      var Ch=mkC('US',1863,6); Ch.president.emancipation={issued:true,declined:false,year:1863,month:1}; setMom(Ch,6,10,25,80);
      if(has(endScan(Ch).reached,'us-13th-early')||has(endScan(Ch).near,'us-13th-early')) throw new Error('a historical-date (1863) emancipation must NOT open the 13th-early');
      return { ok:true }; });

    step('the section renders the CVD-safe chip (glyph + word) + the fantastical label + the counterfactual; null-safe', function(){
      var C=mkC('CS',1862,2); C.strategy.wildsPlayed=['cs-trent','cs-stonewall']; setMom(C,8,10,15,110); C.blockade.recognition=60;
      var html=endRenderSection(C);
      if(html.indexOf('Reached')<0) throw new Error('a reached ending must render its "Reached" chip word');
      if(html.indexOf('\\u2605')<0 && html.indexOf('★')<0) throw new Error('the reached chip must carry its CVD glyph');
      if(html.indexOf('Howard Jones')<0 && html.indexOf('Robertson')<0) throw new Error('the section must show a counterfactual citation');
      if(html.indexOf('NaN')>=0||html.indexOf('>undefined')>=0) throw new Error('the rich render leaked NaN/undefined');
      // the compact (after-action) form
      var comp=endRenderSection(C,{compact:true});
      if(comp.indexOf('Alternate endings')<0) throw new Error('the compact form must name alternate endings');
      var safe=endRenderSection(null); if(safe!=='') throw new Error('a null campaign must render empty, not throw');
      return { len:html.length }; });

    step('PURE READ-OUT — endScan + endRenderSection WRITE NOTHING', function(){
      var C=mkC('US',1864,11); C.president.emancipation={issued:true,declined:false,year:1862,month:9}; C.strategy.wildsPlayed=['us-russian','us-gatling']; C.clock.resolved1864=true; C.clock.elected=true; setMom(C,9,10,15,110);
      function snap(){ return JSON.stringify({ idx:C.idx, stats:C.stats, emancipation:C.president.emancipation,
        wildsPlayed:C.strategy.wildsPlayed, victoryReady:C.strategy.victoryReady, funds:C.funds, clock:C.clock }); }
      var s0=snap(); endScan(C); endRenderSection(C); endRenderSection(C,{compact:true});
      if(snap()!==s0) throw new Error('endScan/endRenderSection mutated campaign state (must be a pure read-out)');
      return { pure:true }; });

    step('divRenderTab EMBEDS the endings section (the E1 wiring; byte-identical guard when absent)', function(){
      if(typeof divRenderTab!=='function') return { skipped:'no divRenderTab' };
      var C=mkC('CS',1862,2); C.strategy.wildsPlayed=['cs-trent']; setMom(C,8,10,15,110); C.blockade.recognition=60;
      var html=divRenderTab(C);
      if(html.indexOf('Alternate endings')<0) throw new Error('the "Your War vs History" tab must embed the alternate-endings section');
      return { embedded:true }; });

    step('D115 bug-hunt: the Howard Jones citation renders cleanly (single-escaped, no &amp;amp;) + the empty-state teaser is SIDE-FILTERED', function(){
      var Cb=mkC('CS',1862,2); Cb.strategy.wildsPlayed=['cs-trent']; setMom(Cb,8,10,15,110); Cb.blockade.recognition=60;
      var html=endRenderSection(Cb);
      if(html.indexOf('&amp;amp;')>=0) throw new Error('the citation must not double-escape (&amp;amp;)');
      if(html.indexOf('Blue &amp; Gray Diplomacy')<0) throw new Error('the Howard Jones source must render as "Blue & Gray Diplomacy"');
      var Ues=endRenderSection(mkC('US',1863,6));   // empty state, US
      if(Ues.indexOf('Maximilian')>=0||Ues.indexOf('British war')>=0) throw new Error('a US empty-state teaser must NOT promise CS-only endings');
      if(Ues.indexOf('Lincoln')<0&&Ues.indexOf('Tsar')<0&&Ues.indexOf('repeaters')<0) throw new Error('a US empty-state teaser should name US-side examples');
      // D117: the US GROUNDED tier now ships, so the US empty-state advertises the FULL labeled
      // spectrum (plausible -> long shot -> fantastical) with its OWN grounded examples, exactly
      // like the CS side (mirror the positive CS check below). It must still NOT leak CS-only
      // endings — the Maximilian/British-war guard above stays.
      if(Ues.indexOf('plausible, long shot')<0) throw new Error('the US empty-state should advertise the full plausible/long-shot/fantastical spectrum (the US grounded tier shipped, D117)');
      if(Ues.indexOf('Reconstruction that holds')<0) throw new Error('the US empty-state should name a US grounded example (e.g. a Reconstruction that holds)');
      if(Ues.indexOf('fantastical')<0) throw new Error('the US empty-state must still name the fantastical tier');
      // the CS side also ships grounded endings — keeps the full spectrum framing
      var Ccs=endRenderSection(mkC('CS',1863,6));
      if(Ccs.indexOf('plausible, long shot')<0) throw new Error('the CS empty-state should advertise the full plausible/long-shot/fantastical spectrum (the CS grounded tier shipped)');
      var Ces=endRenderSection(mkC('CS',1863,6));   // empty state, CS
      if(Ces.indexOf('Lincoln living')>=0||Ces.indexOf('Tsar')>=0) throw new Error('a CS empty-state teaser must NOT promise US-only endings');
      return { cleanCitation:true, sideFiltered:true }; });

    // ---- D116: the GROUNDED tier (CS-half) — 8 plausible/long-shot end-states. ----
    step('D116 fresh-CS: a fresh Confederate campaign (no levers/wilds, recog 0, 1862) opens NO grounded ending', function(){
      var C=mkC('CS',1862,2); setMom(C,1,2,30,40);   // early, light play, nothing chosen
      var sc=endScan(C);
      if(sc.reached.length!==0||sc.near.length!==0) throw new Error('a fresh CS campaign must open no ending, got '+JSON.stringify({r:sc.reached.map(function(e){return e.id;}),n:sc.near.map(function(e){return e.id;})}));
      return { reached:0, near:0 }; });

    step('D116 recognized-independence: courting Europe (recog 30) OPENS it; recog 60 SECURES it', function(){
      var Cn=mkC('CS',1862,9); Cn.blockade.recognition=30; Cn.blockade.recognitionForeclosed=false; setMom(Cn,4,8,30,60);
      var n=endScan(Cn); if(!has(n.near,'cs-recognized-independence')) throw new Error('recognition 30 (courted, not foreclosed) must put recognized-independence within reach');
      if(has(n.reached,'cs-recognized-independence')) throw new Error('recognition 30 must NOT secure recognized-independence (needs >=60)');
      var Cr=mkC('CS',1862,9); Cr.blockade.recognition=62; Cr.blockade.recognitionForeclosed=false; setMom(Cr,6,8,25,80);
      if(!has(endScan(Cr).reached,'cs-recognized-independence')) throw new Error('recognition 62 must REACH recognized-independence');
      var Cf=mkC('CS',1863,6); Cf.blockade.recognition=40; Cf.blockade.recognitionForeclosed=true; setMom(Cf,6,8,25,80);
      if(has(endScan(Cf).near,'cs-recognized-independence')||has(endScan(Cf).reached,'cs-recognized-independence')) throw new Error('a FORECLOSED recognition window must not open recognized-independence');
      return { ok:true }; });

    step('D116 negotiated-peace: cracking Northern will (enemyWill 50) OPENS it; a reachable peace SECURES it', function(){
      var Cn=mkC('CS',1864,8); Cn.strategy.enemyWill=50; Cn.strategy.victoryReady=null; setMom(Cn,5,9,40,60);
      var n=endScan(Cn); if(!has(n.near,'cs-negotiated-peace')) throw new Error('enemyWill 50 must put negotiated-peace within reach');
      if(has(n.reached,'cs-negotiated-peace')) throw new Error('enemyWill 50 alone (no reachable peace) must not secure negotiated-peace');
      var Cr=mkC('CS',1864,11); Cr.strategy.enemyWill=28; Cr.strategy.victoryReady='will'; setMom(Cr,7,9,30,80);
      if(!has(endScan(Cr).reached,'cs-negotiated-peace')) throw new Error('a reachable peace (victoryReady=will) must REACH negotiated-peace');
      if(endScan(Cr).reached.filter(function(e){return e.id==='cs-negotiated-peace';})[0].hist.indexOf('Atlanta')<0) throw new Error('the negotiated-peace counterfactual must name the fall of Atlanta');
      return { ok:true }; });

    step('D116 emancipated-Confederacy: arming the enslaved OPENS it; victory+momentum SECURES it; counterfactual names slavery (anti-Lost-Cause)', function(){
      var Cn=mkC('CS',1864,6); Cn.strategy.armEnslaved=true; Cn.strategy.victoryReady=null; setMom(Cn,4,9,45,40);
      if(!has(endScan(Cn).near,'cs-emancipated-confederacy')) throw new Error('armEnslaved must open emancipated-Confederacy (within reach)');
      var Cr=mkC('CS',1865,2); Cr.strategy.armEnslaved=true; Cr.strategy.victoryReady='will'; setMom(Cr,8,10,20,100);
      var r=endScan(Cr); if(!has(r.reached,'cs-emancipated-confederacy')) throw new Error('armEnslaved + a reachable victory + momentum must REACH emancipated-Confederacy');
      var h=r.reached.filter(function(e){return e.id==='cs-emancipated-confederacy';})[0].hist;
      if(h.indexOf('slavery')<0) throw new Error('the emancipated-Confederacy counterfactual must name slavery plainly (anti-Lost-Cause)');
      if(h.indexOf('Cleburne')<0) throw new Error('the emancipated-Confederacy counterfactual must cite the historical Cleburne proposal');
      return { ok:true }; });

    step('D116 wild-card grounded openers: King Cotton needs cs-cotton-inferno; the Northwest needs cs-copperhead', function(){
      var Cc=mkC('CS',1863,6); Cc.strategy.wildsPlayed=['cs-cotton-inferno']; Cc.blockade.recognition=20; setMom(Cc,5,9,35,60);
      if(!has(endScan(Cc).near,'cs-king-cotton')) throw new Error('cs-cotton-inferno with low recognition must put King Cotton within reach');
      var Cc2=mkC('CS',1863,6); Cc2.strategy.wildsPlayed=['cs-cotton-inferno']; Cc2.blockade.recognition=50; setMom(Cc2,6,9,30,80);
      if(!has(endScan(Cc2).reached,'cs-king-cotton')) throw new Error('cs-cotton-inferno + recognition>=45 + momentum must REACH King Cotton');
      var Cw=mkC('CS',1864,3); Cw.strategy.wildsPlayed=['cs-copperhead']; Cw.strategy.enemyWill=35; setMom(Cw,7,9,25,90);
      if(!has(endScan(Cw).reached,'cs-northwest-secedes')) throw new Error('cs-copperhead + broken Northern will + momentum must REACH the Northwest secedes');
      var Cn0=mkC('CS',1864,3); setMom(Cn0,7,9,25,90);   // no copperhead played
      if(has(endScan(Cn0).near,'cs-northwest-secedes')||has(endScan(Cn0).reached,'cs-northwest-secedes')) throw new Error('the Northwest secedes must NOT open without the Copperhead gambit');
      return { ok:true }; });

    step('D116 late-war endings: stalemate (even deadlock), Fabian (defensive lever), Trans-Miss (1865 survival)', function(){
      // stalemate — 1864+, >=3 wins, even momentum band, Northern will worn
      var Cs=mkC('CS',1864,9); Cs.strategy.enemyWill=45; setMom(Cs,4,8,45,40);   // momentum mid-band ~0.5
      if(!has(endScan(Cs).reached,'cs-stalemate')&&!has(endScan(Cs).near,'cs-stalemate')) throw new Error('a long even war must open stalemate');
      // Fabian — needs the husbanding amnesty lever + 1864+
      var Cf=mkC('CS',1864,9); Cf.strategy.amnesty=true; Cf.strategy.enemyWill=40; setMom(Cf,5,9,35,60);
      if(!has(endScan(Cf).reached,'cs-fabian-survival')) throw new Error('the husbanding amnesty lever + worn Northern will must REACH Fabian survival');
      var Cf0=mkC('CS',1864,9); Cf0.strategy.enemyWill=40; setMom(Cf0,5,9,35,60);   // no lever
      if(has(endScan(Cf0).near,'cs-fabian-survival')||has(endScan(Cf0).reached,'cs-fabian-survival')) throw new Error('Fabian survival must NOT open without the amnesty lever');
      // bug-hunt D116-LOW: fortifyPorts (HOLD the ports) is the conceptual OPPOSITE of Fabian trade-space-for-time — it must NOT open Fabian
      var Cf2=mkC('CS',1864,9); Cf2.strategy.fortifyPorts=true; Cf2.strategy.enemyWill=40; setMom(Cf2,5,9,35,60);
      if(has(endScan(Cf2).near,'cs-fabian-survival')||has(endScan(Cf2).reached,'cs-fabian-survival')) throw new Error('fortifyPorts must NOT open Fabian survival (only the husbanding amnesty lever does)');
      // Trans-Mississippi — survive into 1865 with an EARNED record (won>=3), no outright victory
      var Ct=mkC('CS',1865,4); Ct.strategy.victoryReady=null; setMom(Ct,4,7,30,70);
      if(!has(endScan(Ct).reached,'cs-trans-mississippi')&&!has(endScan(Ct).near,'cs-trans-mississippi')) throw new Error('surviving into 1865 with won>=3 and no outright win must open the Trans-Mississippi redoubt');
      var Ct2=mkC('CS',1863,4); setMom(Ct2,4,7,30,70);   // too early
      if(has(endScan(Ct2).near,'cs-trans-mississippi')||has(endScan(Ct2).reached,'cs-trans-mississippi')) throw new Error('the Trans-Mississippi redoubt must not open before 1865');
      // bug-hunt D116-MED: a LOST war that merely crawls to 1865 (won=0, no levers/wilds) must NOT open it (the precond needs an earned signal, not passage of time)
      var Ct3=mkC('CS',1865,4); Ct3.strategy.victoryReady=null; setMom(Ct3,0,8,70,10);
      if(has(endScan(Ct3).near,'cs-trans-mississippi')||has(endScan(Ct3).reached,'cs-trans-mississippi')) throw new Error('a losing 1865 campaign (won=0) must NOT open the Trans-Mississippi redoubt — passage of time is not an earned path');
      return { ok:true }; });

    step('D116 side-gate: a US campaign never surfaces a CS grounded ending; the labeled spectrum renders banded', function(){
      var U=mkC('US',1864,9); U.blockade.recognition=80; U.strategy.armEnslaved=true; U.strategy.enemyWill=20; U.strategy.wildsPlayed=['cs-cotton-inferno','cs-copperhead']; setMom(U,8,10,20,100);
      var us=endScan(U);
      var leak=['cs-recognized-independence','cs-negotiated-peace','cs-emancipated-confederacy','cs-stalemate','cs-fabian-survival','cs-trans-mississippi','cs-king-cotton','cs-northwest-secedes'];
      for(var i=0;i<leak.length;i++) if(has(us.reached,leak[i])||has(us.near,leak[i])) throw new Error('a US campaign must not surface the CS grounded ending '+leak[i]);
      // banded render — a CS war with a grounded reached + a fantastical reached shows both band labels
      var C=mkC('CS',1862,9); C.blockade.recognition=62; C.strategy.wildsPlayed=['cs-trent']; setMom(C,7,9,20,100);
      var html=endRenderSection(C);
      if(html.indexOf('Plausible')<0) throw new Error('the grounded recognized-independence must render under the Plausible band');
      if(html.indexOf('Fantastical')<0) throw new Error('the fantastical British-war must render under the Fantastical band');
      if(html.indexOf('NaN')>=0||html.indexOf('>undefined')>=0) throw new Error('the banded render leaked NaN/undefined');
      return { noLeak:true, banded:true }; });

    // ---- D117: the GROUNDED tier (US-half) — 8 plausible/long-shot end-states. ----
    step('D117 fresh-US: a fresh Union campaign (no wilds/levers/emancipation, 1862, light play) opens NO grounded ending', function(){
      var C=mkC('US',1862,2); setMom(C,1,2,30,40);   // early, light play, nothing chosen
      var sc=endScan(C);
      if(sc.reached.length!==0||sc.near.length!==0) throw new Error('a fresh US campaign must open no ending, got '+JSON.stringify({r:sc.reached.map(function(e){return e.id;}),n:sc.near.map(function(e){return e.id;})}));
      return { reached:0, near:0 }; });

    step('D117 reconstruction-holds: an emancipation war won (em.issued + won>=4) OPENS it; the 1864 verdict + momentum SECURES it', function(){
      var Cn=mkC('US',1864,9); Cn.president.emancipation={issued:true,declined:false,year:1863,month:1}; setMom(Cn,4,8,40,60);   // won 4, election not yet won
      var n=endScan(Cn); if(!has(n.near,'us-reconstruction-holds')) throw new Error('em.issued + won>=4 (election not yet won) must put a Reconstruction-that-holds within reach');
      if(has(n.reached,'us-reconstruction-holds')) throw new Error('without the won 1864 election a Reconstruction-that-holds must NOT be secured');
      var Cr=mkC('US',1864,11); Cr.president.emancipation={issued:true,declined:false,year:1863,month:1}; Cr.clock.resolved1864=true; Cr.clock.elected=true; setMom(Cr,8,10,15,110);   // mom ~0.83
      var r=endScan(Cr); if(!has(r.reached,'us-reconstruction-holds')) throw new Error('em.issued + won>=4 + the won 1864 election + momentum>=0.55 must REACH a Reconstruction that holds');
      if(r.reached.filter(function(e){return e.id==='us-reconstruction-holds';})[0].hist.indexOf('1877')<0) throw new Error('the Reconstruction-holds counterfactual must name the Compromise of 1877');
      var Cw=mkC('US',1864,9); Cw.president.emancipation={issued:true,declined:false,year:1863,month:1}; setMom(Cw,3,8,40,60);   // won 3 < 4
      if(has(endScan(Cw).near,'us-reconstruction-holds')||has(endScan(Cw).reached,'us-reconstruction-holds')) throw new Error('won<4 must NOT open a Reconstruction that holds');
      return { ok:true }; });

    step('D117 early-abolition: the radical-emancipation gambit OPENS it (NOT a bare 1863 usctUnlocked); momentum SECURES it', function(){
      var Cr=mkC('US',1862,6); Cr.strategy.wildsPlayed=['us-radical-emanc']; setMom(Cr,6,10,30,80);   // mom ~0.64
      if(!has(endScan(Cr).reached,'us-early-abolition')) throw new Error('the us-radical-emanc gambit + momentum>=0.5 must REACH an early abolition war');
      // a bare 1863 emancipation auto-trips M.usctUnlocked (70-manpower.js) but must NOT open early-abolition — the OPENER is the WILD, not the auto-unlock
      var Cb=mkC('US',1863,6); Cb.president.emancipation={issued:true,declined:false,year:1863,month:1}; setMom(Cb,6,10,30,80);
      if(has(endScan(Cb).near,'us-early-abolition')||has(endScan(Cb).reached,'us-early-abolition')) throw new Error('a bare 1863 emancipation (auto-unlocked USCT, no gambit) must NOT open early-abolition — only the us-radical-emanc gambit does');
      return { ok:true }; });

    step('D117 hard-war + general-strike: each opens on its gambit; a broken enemy will (or a will-victory) SECURES it', function(){
      var Ch=mkC('US',1864,6); Ch.strategy.wildsPlayed=['us-hardwar']; Ch.strategy.enemyWill=20; setMom(Ch,7,9,25,90);
      if(!has(endScan(Ch).reached,'us-hardwar-collapse')) throw new Error('us-hardwar + enemyWill<=25 must REACH a hard-war collapse');
      var Ch0=mkC('US',1863,6); Ch0.strategy.wildsPlayed=['us-hardwar']; Ch0.strategy.enemyWill=70; Ch0.strategy.victoryReady=null; setMom(Ch0,5,9,40,40);
      if(!has(endScan(Ch0).near,'us-hardwar-collapse')) throw new Error('us-hardwar with high enemy (Confederate) will + no will-victory must be within reach, not reached');
      if(has(endScan(Ch0).reached,'us-hardwar-collapse')) throw new Error('us-hardwar must not be secured without a broken will / will-victory');
      var Cg=mkC('US',1864,6); Cg.strategy.wildsPlayed=['us-genstrike']; Cg.strategy.victoryReady='will'; setMom(Cg,7,9,25,90);
      var g=endScan(Cg); if(!has(g.reached,'us-general-strike')) throw new Error('us-genstrike + a will-victory must REACH the general strike triumphant');
      if(g.reached.filter(function(e){return e.id==='us-general-strike';})[0].hist.indexOf('Du Bois')<0) throw new Error('the general-strike counterfactual must cite Du Bois');
      var Cn0=mkC('US',1864,6); setMom(Cn0,7,9,25,90);   // no gambit played
      if(has(endScan(Cn0).near,'us-hardwar-collapse')||has(endScan(Cn0).near,'us-general-strike')) throw new Error('neither hard-war nor general-strike may open without its gambit');
      return { ok:true }; });

    step('D117 reunion-without-emancipation: refusing emancipation OPENS it; the counterfactual names slavery + the moral failure (anti-Lost-Cause)', function(){
      var Cr=mkC('US',1864,9); Cr.president.emancipation={issued:false,declined:true}; Cr.strategy.victoryReady='will'; setMom(Cr,7,9,30,80);
      var r=endScan(Cr); if(!has(r.reached,'us-reunion-no-emancipation')) throw new Error('em.declined + a will-victory must REACH reunion-without-emancipation');
      var h=r.reached.filter(function(e){return e.id==='us-reunion-no-emancipation';})[0].hist;
      if(h.indexOf('slavery')<0) throw new Error('the reunion-without-emancipation counterfactual must name slavery plainly');
      if(h.indexOf('moral failure')<0) throw new Error('the reunion-without-emancipation counterfactual must name it as a moral failure, not a triumph (anti-Lost-Cause)');
      var Cn=mkC('US',1863,6); Cn.president.emancipation={issued:true,declined:false,year:1863,month:1}; setMom(Cn,7,9,30,80);   // emancipation issued, not declined
      if(has(endScan(Cn).near,'us-reunion-no-emancipation')||has(endScan(Cn).reached,'us-reunion-no-emancipation')) throw new Error('an emancipation war (not declined) must NOT open reunion-without-emancipation');
      return { ok:true }; });

    step('D117 1862-knockout: an overwhelming 1862 record (year<=1862 & won>=5) OPENS it; year>1862 is CLOSED', function(){
      var Cn=mkC('US',1862,6); Cn.strategy.victoryReady=null; setMom(Cn,5,8,40,40);   // mom ~0.57 (< 0.7); no reachable victory
      var n=endScan(Cn); if(!has(n.near,'us-1862-knockout')) throw new Error('year<=1862 & won>=5 (no reachable victory, mom<0.7) must put the 1862 knockout within reach');
      if(has(n.reached,'us-1862-knockout')) throw new Error('without a reachable victory (or mom>=0.7 & won>=7) the 1862 knockout must NOT be secured');
      var Cr=mkC('US',1862,6); Cr.strategy.victoryReady='will'; setMom(Cr,6,8,30,80);
      if(!has(endScan(Cr).reached,'us-1862-knockout')) throw new Error('year<=1862 & won>=5 + a reachable victory must REACH the 1862 knockout');
      var Cc=mkC('US',1863,6); Cc.strategy.victoryReady='will'; setMom(Cc,8,10,20,100);   // a year too late
      if(has(endScan(Cc).near,'us-1862-knockout')||has(endScan(Cc).reached,'us-1862-knockout')) throw new Error('the 1862 knockout must be CLOSED after 1862 (year>1862)');
      return { ok:true }; });

    step('D117 forty-acres + compensated-bloodless: the radical/early emancipation paths; cited to Foner/Du Bois/Lincoln', function(){
      // forty-acres — an emancipation war with the 1864 mandate + a reachable, dominant victory
      var Cf=mkC('US',1864,11); Cf.president.emancipation={issued:true,declined:false,year:1863,month:1}; Cf.clock.resolved1864=true; Cf.clock.elected=true; Cf.strategy.victoryReady='will'; setMom(Cf,8,10,15,110);
      var rf=endScan(Cf); if(!has(rf.reached,'us-forty-acres')) throw new Error('em.issued + the won 1864 election + a reachable victory + momentum>=0.6 + won>=5 must REACH forty-acres');
      var hf=rf.reached.filter(function(e){return e.id==='us-forty-acres';})[0].hist;
      if(hf.indexOf('Foner')<0 && hf.indexOf('Du Bois')<0) throw new Error('the forty-acres counterfactual must cite Foner / Du Bois');
      if(hf.indexOf('Field Order')<0 && hf.indexOf('40 acres')<0) throw new Error('the forty-acres counterfactual must name the historical Field Order No. 15 / "40 acres"');
      // compensated-bloodless — an early (1862) settlement with emancipation in hand
      var Cc=mkC('US',1862,9); Cc.president.emancipation={issued:true,declined:false,year:1862,month:4}; Cc.strategy.victoryReady='will'; setMom(Cc,7,9,20,90);
      var rc=endScan(Cc); if(!has(rc.reached,'us-compensated-bloodless')) throw new Error('year<=1862 + em.issued + a reachable victory + momentum>=0.6 must REACH a compensated, bloodless end');
      if(rc.reached.filter(function(e){return e.id==='us-compensated-bloodless';})[0].hist.indexOf('Lincoln')<0) throw new Error('the compensated-bloodless counterfactual must name Lincoln (who actually urged compensated emancipation)');
      var Cc2=mkC('US',1863,6); Cc2.president.emancipation={issued:true,declined:false,year:1863,month:1}; Cc2.strategy.victoryReady='will'; setMom(Cc2,7,9,20,90);   // 1863 — too late for a 1862 compensated end
      if(has(endScan(Cc2).near,'us-compensated-bloodless')||has(endScan(Cc2).reached,'us-compensated-bloodless')) throw new Error('a compensated, bloodless 1862 end must be CLOSED after 1862');
      return { ok:true }; });

    step('D117 side-gate: a CS campaign never surfaces a US grounded ending; the labeled spectrum renders banded for US', function(){
      var S=mkC('CS',1864,9); S.president.emancipation={issued:true,declined:true,year:1863,month:1}; S.clock.resolved1864=true; S.clock.elected=true; S.strategy.victoryReady='will'; S.strategy.wildsPlayed=['us-radical-emanc','us-hardwar','us-genstrike']; S.strategy.enemyWill=10; setMom(S,8,10,15,110);
      var cs=endScan(S);
      var leak=['us-reconstruction-holds','us-early-abolition','us-hardwar-collapse','us-reunion-no-emancipation','us-1862-knockout','us-forty-acres','us-compensated-bloodless','us-general-strike'];
      for(var i=0;i<leak.length;i++) if(has(cs.reached,leak[i])||has(cs.near,leak[i])) throw new Error('a CS campaign must not surface the US grounded ending '+leak[i]);
      // banded render — a US war with a grounded (plausible + long-shot) reached + a fantastical reached shows all three band labels
      var C=mkC('US',1864,11); C.president.emancipation={issued:true,declined:false,year:1863,month:1}; C.clock.resolved1864=true; C.clock.elected=true; C.strategy.victoryReady='will'; C.strategy.wildsPlayed=['us-russian']; setMom(C,9,10,15,110);
      var html=endRenderSection(C);
      if(html.indexOf('Plausible')<0) throw new Error('the grounded Reconstruction-holds must render under the Plausible band');
      if(html.indexOf('Long shot')<0) throw new Error('a US long-shot grounded ending (forty-acres) must render under the Long shot band');
      if(html.indexOf('Fantastical')<0) throw new Error('the fantastical Russo-American must render under the Fantastical band');
      if(html.indexOf('NaN')>=0||html.indexOf('>undefined')>=0) throw new Error('the banded US render leaked NaN/undefined');
      return { noLeak:true, banded:true }; });

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
    writeFileSync(join(OUT,'probe-endings.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-endings ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-endings.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-endings.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-endings: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-endings: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-endings: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
