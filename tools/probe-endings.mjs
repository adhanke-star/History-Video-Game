#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-endings.mjs — E1 (D115) ALTERNATE ENDINGS (the fantastical-tier alt-history
// RESULTS a well-played war earns). Verifies: the module loads; a fresh campaign has no
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
      var Ces=endRenderSection(mkC('CS',1863,6));   // empty state, CS
      if(Ces.indexOf('Lincoln living')>=0||Ces.indexOf('Tsar')>=0) throw new Error('a CS empty-state teaser must NOT promise US-only endings');
      return { cleanCitation:true, sideFiltered:true }; });

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
