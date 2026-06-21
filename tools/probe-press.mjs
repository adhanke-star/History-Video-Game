#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-press.mjs — S2 m4 press / public-opinion. Verifies: the papers load
// side-correct; pressInit builds per-paper favor; the press stays NEUTRAL (50) until it
// reacts (so it perturbs nothing at init); pressOnResolve reacts to victory/defeat (the
// administration sheets rally, the Copperheads turn) and to emancipation ONCE; the
// aggregate sentiment feeds moraleCompute's public-will layer (anchored at 50); render
// works. Writes shots/probe-press.json.
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
    C.clock.year=(y||1863); C.president.date={year:(y||1863),month:(m||6)}; return C; }
  try {
    if (typeof _prsData!=='function' || typeof pressOnResolve!=='function') return JSON.stringify({ok:false,fatal:'press module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('press data loads + side-correct papers', function(){
      var d=_prsData(); if(!d||!d.papers||!d.papers.length) throw new Error('no GAME_DATA.press.papers');
      var us=_prsPapers('US'), cs=_prsPapers('CS');
      if(!us.length||!cs.length) throw new Error('missing papers for a side');
      for(var i=0;i<us.length;i++) if(us[i].side!=='US') throw new Error('US list has a non-US paper');
      // schema integrity
      var all=us.concat(cs);
      for(var j=0;j<all.length;j++){ var p=all[j]; if(!p.id||!p.name||!p.side||!p.lean||!p.editorials) throw new Error('paper missing field: '+(p&&p.id)); }
      return { us:us.length, cs:cs.length }; });

    step('pressInit builds per-paper favor; press is NEUTRAL until it reacts', function(){
      var C=mkC('US',1863,6);
      if(!C.press||typeof C.press.favor!=='object') throw new Error('press not initialized');
      if(C.press.reacted!==false) throw new Error('press should start un-reacted');
      if(pressSentiment(C)!==50) throw new Error('sentiment must be a neutral 50 until reacted, got '+pressSentiment(C));
      var us=_prsPapers('US'); for(var i=0;i<us.length;i++) if(typeof C.press.favor[us[i].id]!=='number') throw new Error('no favor for '+us[i].id);
      return { reacted:C.press.reacted, sentiment:pressSentiment(C) }; });

    step('pressOnResolve: a VICTORY rallies the press more than a DEFEAT', function(){
      var Cv=mkC('US',1863,6); pressOnResolve('US','win',{casualties:{US:2000}},Cv,true);
      var Cd=mkC('US',1863,6); pressOnResolve('US','loss',{casualties:{US:2000}},Cd,false);
      if(!Cv.press.reacted) throw new Error('press did not react');
      if(!(pressSentiment(Cv) > pressSentiment(Cd))) throw new Error('victory sentiment should beat defeat: '+pressSentiment(Cv)+' vs '+pressSentiment(Cd));
      if(!(Cv.press.headlines&&Cv.press.headlines.length)) throw new Error('no headlines generated');
      return { victorySentiment:pressSentiment(Cv), defeatSentiment:pressSentiment(Cd) }; });

    step('the Copperhead press turns hardest on a DEFEAT (lean-aware reaction)', function(){
      var C=mkC('US',1863,6);
      var world=_prsById('ny-world'); if(!world){ return { skipped:'minimal deck' }; }
      var before=C.press.favor['ny-world'];
      pressOnResolve('US','loss',{casualties:{US:2000}},C,false);
      var after=C.press.favor['ny-world'];
      if(!(after < before)) throw new Error('the Copperhead World should turn on a defeat: '+before+'->'+after);
      return { worldBefore:before, worldAfter:after }; });

    step('EMANCIPATION splits the press, and reacts only ONCE (latch)', function(){
      var C=mkC('US',1862,6); C.president.emancipation={issued:true,declined:false};
      var tribBefore=C.press.favor['ny-tribune'];
      pressOnResolve('US','win',{casualties:{US:1000}},C,true);
      if(!C.press.emancipationReacted) throw new Error('emancipation latch not set');
      var tribAfter=C.press.favor['ny-tribune'];
      if(_prsById('ny-tribune') && !(tribAfter>=tribBefore)) throw new Error('the radical Tribune should cheer emancipation');
      // a second tick must NOT re-fire the emancipation editorial (latch held)
      var headlines2;
      pressOnResolve('US','win',{casualties:{US:1000}},C,true);
      headlines2 = C.press.headlines.map(function(h){return h.headline;}).join(' || ');
      if(headlines2.toLowerCase().indexOf('twenty millions')>=0 && _prsById('ny-tribune')) throw new Error('emancipation editorial re-fired after the latch');
      return { latched:C.press.emancipationReacted }; });

    step('the press feeds moraleCompute public will (anchored at 50)', function(){
      // isolate the press channel: same war-state, different sentiment
      var Chi=mkC('US',1863,6); Chi.stats.won=4; Chi.stats.battles=8; Chi.clock.weariness=30;
      Chi.press.reacted=true; Chi.press.sentiment=85; var phi=moraleCompute(Chi).public;
      var Clo=mkC('US',1863,6); Clo.stats.won=4; Clo.stats.battles=8; Clo.clock.weariness=30;
      Clo.press.reacted=true; Clo.press.sentiment=15; var plo=moraleCompute(Clo).public;
      if(!(phi>plo)) throw new Error('a friendly press should lift public will: '+phi+' vs '+plo);
      // and a NEUTRAL/un-reacted press is a no-op vs an explicit 50
      var Cn=mkC('US',1863,6); Cn.stats.won=4; Cn.stats.battles=8; Cn.clock.weariness=30; var pn=moraleCompute(Cn).public;
      var C50=mkC('US',1863,6); C50.stats.won=4; C50.stats.battles=8; C50.clock.weariness=30; C50.press.reacted=true; C50.press.sentiment=50; var p50=moraleCompute(C50).public;
      if(pn!==p50) throw new Error('un-reacted press must equal sentiment-50: '+pn+' vs '+p50);
      return { pubFriendlyPress:phi, pubHostilePress:plo, pubNeutral:pn }; });

    step('CS player sees ONLY the Confederate press in the paper list', function(){
      var C=mkC('CS',1863,6); pressOnResolve('CS','win',{casualties:{CS:3000}},C,true);
      var cs=_prsPapers('CS'); if(!cs.length) throw new Error('no CS papers');
      // the real invariant: the player's paper LIST is side-correct (the cross-cutting
      // teaching card may name papers from both sides — that is intended teaching)
      if(cs.some(function(p){return p.side!=='CS';})) throw new Error('CS paper list has a non-CS paper');
      if(cs.some(function(p){return p.id==='ny-tribune';})) throw new Error('CS list includes a US paper');
      if(C.press.favor['ny-tribune']!==undefined) throw new Error('a US paper got CS favor state');
      var html=pressRenderTab(C);
      if(html.indexOf(cs[0].name)<0) throw new Error('CS press tab missing '+cs[0].name);
      return { csPapers:cs.length, reacted:C.press.reacted, len:html.length }; });

    step('D52 hardening: malformed headlines, NaN sentiment, emancipation-fired latch', function(){
      var C=mkC('US',1863,6); pressOnResolve('US','win',{casualties:{US:2000}},C,true);
      C.press.headlines=[null,{},{name:'X',headline:'ok'}]; pressInit(C);
      if(C.press.headlines.some(function(h){return !h||typeof h!=='object';})) throw new Error('malformed headline survived pressInit');
      var threw=false; try{ pressRenderTab(C); }catch(e){ threw=true; } if(threw) throw new Error('render crashed on headlines');
      var C2=mkC('US',1863,6); C2.press.reacted=true; C2.press.sentiment=NaN; pressInit(C2);
      if(pressSentiment(C2)!==50) throw new Error('NaN sentiment leaked: '+pressSentiment(C2));
      if(!isFinite(moraleCompute(C2).public)) throw new Error('NaN sentiment poisoned public will');
      var C4=mkC('US',1862,6); C4.president.emancipation={issued:true}; pressOnResolve('US','win',{casualties:{US:1000}},C4,true);
      if(!C4.press.emancipationReacted) throw new Error('emancipation latch should fire when a paper prints it');
      return { headlinesSanitized:C.press.headlines.length, nanGuarded:true, emancLatch:true }; });

    step('a BLOODY battle tempers the press (heavy-casualties editorial fires)', function(){
      var C=mkC('CS',1863,6); pressOnResolve('CS','win',{casualties:{CS:12000}},C,true);   // a bloody victory
      var heads=(C.press.headlines||[]).map(function(h){return h.headline;}).join(' || ');
      if(heads.toLowerCase().indexOf('mournful column')<0) throw new Error('a bloody day should run the heavy-casualties editorial, got: '+heads);
      return { ran:true }; });

    step('pressRenderTab renders the broadsheet + sentiment + a teaching card', function(){
      var C=mkC('US',1863,6); pressOnResolve('US','win',{casualties:{US:2000}},C,true);
      var html=pressRenderTab(C);
      if(html.indexOf('The press, on the whole')<0) throw new Error('no aggregate sentiment line');
      if(html.indexOf('New-York Tribune')<0) throw new Error('no paper listed');
      return { len:html.length }; });
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
    writeFileSync(join(OUT,'probe-press.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-press ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
