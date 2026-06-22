#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-camp.mjs — Q8 the between-battle CAMP LOOP (D100). Verifies drilling raises the army's
// training toward the ceiling, fatigue limits it, delegating auto-drills, combat seasons / attrition erodes,
// the bridge conditioning is BYTE-IDENTICAL until the player engages the camp (the no-fudge / byte-identity
// keystone), and the bonus is bounded + the dev-trait read-out renders. Writes shots/probe-camp.json.
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
  function mkC(side){ return { side:side, iron:false, idx:0, funds:(side==='CS'?3000:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; }
  function drive(side, mode, turns){ G.campaign=mkC(side); var C=G.campaign; _t1InitAll(C); var e=(side==='US')?'CS':'US';
    for(var t=0;t<turns;t++){ C.stats.battles++; var win=(mode==='win'); if(win) C.stats.won++;
      var c={}; c[side]=win?900:2000; c[e]=win?2400:800;
      _t1Resolve(side, win?'win':'loss', {playerSide:side,enemySide:e,bd:{name:'x',year:1861+Math.floor(t/4)},casualties:c,infl:{},units:[]}, C, win); }
    return C; }
  function facets(a){ return { overall:a.overall, morale:a.morale, firepower:a.firepower, supply:a.supply, fatigue:a.fatigue }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    var fns=['campInit','campDrill','campSetDelegate','campOnResolve','campTrainingBonus','campRenderTab','_campMeanDrill','bridgeArmy'];
    for(var i=0;i<fns.length;i++) if(typeof window[fns[i]]!=='function') return JSON.stringify({ok:false, fatal:'missing camp fn '+fns[i]});
    G.mode='menu';

    step('INIT: campInit seeds C.president.camp with 4 zero focuses + fatigue 0 + not engaged (idempotent)', function(){
      var C=mkC('US'); _t1InitAll(C); var c=C.president.camp;
      if(!c||!c.drill) throw new Error('camp not initialized');
      var foci=['musketry','maneuver','entrenching','endurance'];
      for(var i=0;i<foci.length;i++) if(c.drill[foci[i]]!==0) throw new Error(foci[i]+' should init to 0');
      if(c.fatigue!==0||c.engaged!==false) throw new Error('fatigue/engaged should init 0/false');
      campInit(C); campInit(C);   // idempotent
      if(c.drill.musketry!==0) throw new Error('idempotent init changed drill');
      return { drill:c.drill, fatigue:c.fatigue, engaged:c.engaged }; });

    step('BYTE-IDENTITY: an UN-ENGAGED campaign conditions identically with vs without the camp (the keystone)', function(){
      var C=drive('CS','win',12);   // fights 12 battles but NEVER drills -> camp stays inert
      if(C.president.camp.engaged) throw new Error('camp should be un-engaged after battles with no drilling');
      var withCamp=facets(bridgeArmy(C));
      var tb=campTrainingBonus(C);
      if(tb.firepower!==0||tb.morale!==0||tb.supply!==0||tb.fatigueRelief!==0||tb.overall!==0) throw new Error('un-drilled campTrainingBonus must be all zeroes, got '+JSON.stringify(tb));
      // remove the camp entirely and re-condition: must be byte-identical (the seam is exactly 0)
      var saved=C.president.camp; delete C.president.camp;
      var noCamp=facets(bridgeArmy(C));
      C.president.camp=saved;
      if(JSON.stringify(withCamp)!==JSON.stringify(noCamp)) throw new Error('un-engaged camp changed the conditioning: '+JSON.stringify(withCamp)+' vs '+JSON.stringify(noCamp));
      return { conditioning:withCamp }; });

    step('DRILL: a manual drill raises the focus toward the ceiling + adds fatigue + engages the loop', function(){
      var C=mkC('US'); _t1InitAll(C);
      campDrill(C,'musketry');
      var c=C.president.camp;
      if(!(c.drill.musketry>0)) throw new Error('musketry should rise after a drill');
      if(!(c.fatigue>0)) throw new Error('drilling should add fatigue');
      if(!c.engaged) throw new Error('drilling should engage the camp loop');
      if(c.drill.maneuver!==0) throw new Error('drilling musketry should not raise maneuver');
      // drill to the ceiling
      for(var k=0;k<20;k++) campDrill(C,'musketry');
      if(c.drill.musketry>90) throw new Error('manual drill should top out at the CEIL (90), got '+c.drill.musketry);
      return { musketry:c.drill.musketry, fatigue:c.fatigue }; });

    step('BONUS: a drilled army lifts its conditioning facets, BOUNDED, and fatigue DRAGS the gain', function(){
      var C=mkC('US'); _t1InitAll(C);
      // drill musketry hard but DON'T let fatigue drag (reset fatigue to isolate the lift)
      for(var k=0;k<10;k++) campDrill(C,'musketry'); C.president.camp.fatigue=0;
      var hi=campTrainingBonus(C);
      if(!(hi.firepower>0 && hi.firepower<=8)) throw new Error('musketry lift should be in (0,8]: '+hi.firepower);
      if(hi.morale!==0||hi.supply!==0) throw new Error('a musketry-only drill should not lift morale/supply: '+JSON.stringify(hi));
      // now pile on fatigue: the SAME drill yields a SMALLER lift (the drag)
      C.president.camp.fatigue=100;
      var lo=campTrainingBonus(C);
      if(!(lo.firepower<hi.firepower)) throw new Error('fatigue should drag the lift down: '+lo.firepower+' vs '+hi.firepower);
      // bridge: a drilled (rested) army fields stronger than the same army un-drilled, but bounded
      var Cu=mkC('US'); _t1InitAll(Cu); var base=bridgeArmy(Cu).overall;
      var Cd=mkC('US'); _t1InitAll(Cd); for(var j=0;j<10;j++){ campDrill(Cd,'musketry'); campDrill(Cd,'maneuver'); campDrill(Cd,'entrenching'); campDrill(Cd,'endurance'); } Cd.president.camp.fatigue=0;
      var drilled=bridgeArmy(Cd).overall;
      if(!(drilled>base)) throw new Error('a fully-drilled army should field stronger: '+drilled+' vs '+base);
      if(drilled-base>14) throw new Error('the drill lift should be bounded/meaningful-not-dominant (<=~14 overall), got +'+(drilled-base));
      return { hiFire:hi.firepower, loFire:lo.firepower, baseOverall:base, drilledOverall:drilled, lift:drilled-base }; });

    step('DELEGATE: an army with delegate ON auto-drills every turn (engaged); OFF + un-engaged stays inert', function(){
      var C=mkC('US'); _t1InitAll(C); campSetDelegate(C,true);
      if(!C.president.camp.engaged) throw new Error('delegate-on should engage');
      var before=_campMeanDrill(C);
      campOnResolve('US','win',{casualties:{US:900,CS:2400}},C,true);
      var after=_campMeanDrill(C);
      if(!(after>before)) throw new Error('a delegated army should auto-drill on a turn: '+before+' -> '+after);
      return { before:before, after:after }; });

    step('SEASONING / ATTRITION by casualty SHARE: a clean win (realistic casualties) seasons up; a mauled loss erodes; a PYRRHIC win (this side bled the lion\\'s share) ALSO erodes; deterministic', function(){
      function run(mode, casMe, casEnemy){ var C=mkC('CS'); _t1InitAll(C); campDrill(C,'musketry'); var start=C.president.camp.drill.musketry; C.president.camp.fatigue=0;
        var win=(mode==='win'); var c={CS:casMe, US:casEnemy};
        campOnResolve('CS', win?'win':'loss', {casualties:c}, C, win); return { start:start, end:C.president.camp.drill.musketry }; }
      var w=run('win', 1800, 2600);   // a clean win at REALISTIC battle magnitude (CS share 0.41) -> seasons up (this FAILED under the old men/index dimensional bug)
      var l=run('loss', 3000, 600);   // a mauled loss (CS share 0.83) -> erodes
      var p=run('win', 3200, 1200);   // a PYRRHIC win (CS share 0.73) -> bloody -> erodes despite the victory (the share, not the win flag, decides bloodiness)
      if(!(w.end>w.start)) throw new Error('a clean realistic win should season the drill upward: '+JSON.stringify(w));
      if(!(l.end<l.start)) throw new Error('a bloody loss should erode the drill: '+JSON.stringify(l));
      if(!(p.end<p.start)) throw new Error('a pyrrhic win (lion-share casualties) should erode, not season: '+JSON.stringify(p));
      var d1=run('win',1800,2600), d2=run('win',1800,2600); if(d1.end!==d2.end) throw new Error('seasoning not deterministic');
      return { win:w, loss:l, pyrrhic:p }; });

    step('PURITY: campTrainingBonus does not mutate the camp (pure read)', function(){
      var C=mkC('US'); _t1InitAll(C); for(var k=0;k<5;k++) campDrill(C,'maneuver');
      var snap=JSON.stringify(C.president.camp); campTrainingBonus(C); campTrainingBonus(C);
      if(JSON.stringify(C.president.camp)!==snap) throw new Error('campTrainingBonus mutated the camp');
      return { ok:true }; });

    step('RENDER: the Camp tab shows the DRILL headline + 4 focus drills + the delegate toggle + the commander record', function(){
      var C=mkC('US'); _t1InitAll(C); campDrill(C,'musketry');
      var h=campRenderTab(C);
      if(!h) throw new Error('empty camp tab');
      if(h.indexOf('DRILL')<0) throw new Error('no DRILL headline');
      if(h.indexOf('campDrill_musketry')<0||h.indexOf('campDrill_endurance')<0) throw new Error('missing drill-focus buttons');
      if(h.indexOf('campDelegate')<0) throw new Error('missing delegate toggle');
      if(h.indexOf('Fatigue')<0) throw new Error('missing the fatigue meter');
      return { len:h.length }; });
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
    await sleep(400);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-camp.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-camp ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
