#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-divergence.mjs — E1 (D111) "YOUR WAR vs HISTORY": the alternate-history
// DIVERGENCE LEDGER. Verifies: the module loads; a fresh campaign reads zero divergence
// (index 0, "on the historical track", empty-state copy); each canonical hinge is
// detected at the right category + tier (emancipation declined/early/1862, CS arm-the-
// enslaved, foreign recognition, the 1864 election repudiation, the CS war-trajectory);
// wild cards map plausibility -> divergence tier (plausible/longshot/fantastical ->
// minor/major/radical) with a real (non-generic) counterfactual; the index rises with
// divergence + saturates at 100; the EMERGENT-ONLY toggle withholds the wild-card section
// (byte-identical when OFF — the default still renders the gambits); divScan WRITES NOTHING
// (pure read-out); a tampered wild id is ignored, not faked; the render carries the CVD-safe
// tier chips and never leaks undefined/NaN. Writes shots/probe-divergence.json.
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
  function _scrubDataUris(h){ return String(h).replace(/data:[a-zA-Z0-9.+\/-]+;base64,[A-Za-z0-9+\/=]+/g, 'data:scrubbed'); }   // opaque data-URI payloads are image bytes, not rendered text - the NaN/undefined teeth scan the TEXT surface (D487: the D483 flag-card base64 false-positive class)
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, y, m){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(typeof vicInit==='function') vicInit(C);
    C.clock.year=(y||1862); C.president.date={year:(y||1862),month:(m||9)}; return C; }
  function entry(es, id){ for(var i=0;i<es.length;i++) if(es[i].id===id) return es[i]; return null; }
  function has(es, id){ return !!entry(es,id); }
  try {
    if (typeof divScan!=='function' || typeof divIndex!=='function' || typeof divRenderTab!=='function' || typeof divEmergentOnly!=='function')
      return JSON.stringify({ok:false,fatal:'divergence module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; delete G.settings.altHistoryEmergentOnly;

    step('module + tiers load; a FRESH campaign reads ZERO divergence (index 0, on the historical track, empty-state copy)', function(){
      var C=mkC('US',1862,9);
      var es=divScan(C);
      if(es.length!==0) throw new Error('a fresh campaign must have no divergences, got '+es.length+': '+es.map(function(e){return e.id;}).join(','));
      var ix=divIndex(es);
      if(ix.idx!==0) throw new Error('fresh index must be 0, got '+ix.idx);
      if(ix.word!=='On the historical track') throw new Error('fresh word should be "On the historical track", got '+ix.word);
      var html=divRenderTab(C);
      if(html.indexOf('followed the historical record')<0) throw new Error('empty state copy missing');
      if(_scrubDataUris(html).indexOf('NaN')>=0||_scrubDataUris(html).indexOf('undefined')>=0) throw new Error('fresh render leaked NaN/undefined');
      return { entries:0, idx:ix.idx, word:ix.word }; });

    step('EMANCIPATION declined -> a radical Emancipation divergence with a real counterfactual', function(){
      var C=mkC('US',1863,1); C.president.emancipation={ issued:false, declined:true };
      var es=divScan(C); var e=entry(es,'emanc-declined');
      if(!e) throw new Error('declined emancipation not detected');
      if(e.cat!=='Emancipation'||e.tier!=='radical') throw new Error('emanc-declined cat/tier wrong: '+e.cat+'/'+e.tier);
      if(e.hist.indexOf('January 1, 1863')<0) throw new Error('the counterfactual must anchor the historical Proclamation date');
      return { tier:e.tier, when:e.when }; });

    step('EMANCIPATION early 1861 -> radical; 1862 -> minor (the timing tiers)', function(){
      var Ce=mkC('US',1861,9); Ce.president.emancipation={ issued:true, declined:false, year:1861, month:9 };
      var e1=entry(divScan(Ce),'emanc-early'); if(!e1||e1.tier!=='radical') throw new Error('1861 emancipation should be a radical "emanc-early"');
      var Cm=mkC('US',1862,9); Cm.president.emancipation={ issued:true, declined:false, year:1862, month:9 };
      var e2=entry(divScan(Cm),'emanc-1862'); if(!e2||e2.tier!=='minor') throw new Error('1862 emancipation should be a minor "emanc-1862"');
      // a 1863 issue (the historical date) is NOT a divergence
      var Ch=mkC('US',1863,1); Ch.president.emancipation={ issued:true, declined:false, year:1863, month:1 };
      if(has(divScan(Ch),'emanc-early')||has(divScan(Ch),'emanc-1862')) throw new Error('the historical 1863 emancipation must not register as a divergence');
      return { early:e1.tier, mid:e2.tier, historicalClean:true }; });

    step('CS arm-the-enslaved -> a radical Emancipation divergence (Cleburne); US side never shows it', function(){
      var C=mkC('CS',1864,6); C.strategy.armEnslaved=true;
      var e=entry(divScan(C),'cs-arm-enslaved');
      if(!e||e.cat!=='Emancipation'||e.tier!=='radical') throw new Error('CS arm-the-enslaved not a radical Emancipation entry');
      if(e.hist.indexOf('March 1865')<0) throw new Error('the counterfactual must name the too-late March 1865 measure');
      var U=mkC('US',1864,6); U.strategy.armEnslaved=true;   // armEnslaved is a CS lever; a US campaign must not surface it
      if(has(divScan(U),'cs-arm-enslaved')) throw new Error('the CS arm-the-enslaved entry must be CS-only');
      return { tier:e.tier }; });

    step('FOREIGN RECOGNITION — >=60 is radical (achieved); 30..59 open past 1862 is major; foreclosed/low is clean', function(){
      var Ca=mkC('CS',1863,6); Ca.blockade.recognition=72; Ca.blockade.recognitionForeclosed=false;
      var ea=entry(divScan(Ca),'recog-achieved'); if(!ea||ea.tier!=='radical') throw new Error('recognition >=60 should be a radical "recog-achieved"');
      var Co=mkC('CS',1863,6); Co.blockade.recognition=40; Co.blockade.recognitionForeclosed=false;
      var eo=entry(divScan(Co),'recog-open'); if(!eo||eo.tier!=='major') throw new Error('recognition 30..59 open past 1862 should be a major "recog-open"');
      var Cf=mkC('CS',1863,6); Cf.blockade.recognition=40; Cf.blockade.recognitionForeclosed=true;
      if(has(divScan(Cf),'recog-open')||has(divScan(Cf),'recog-achieved')) throw new Error('a foreclosed window at low recognition must be clean');
      return { achieved:ea.tier, open:eo.tier }; });

    step('THE 1864 ELECTION — repudiation (resolved && !elected) is a radical Politics divergence; a sustained election is clean', function(){
      var C=mkC('US',1864,11); C.clock.resolved1864=true; C.clock.elected=false;
      var e=entry(divScan(C),'election-1864');
      if(!e||e.cat!=='Politics'||e.tier!=='radical') throw new Error('a repudiated 1864 election must be a radical Politics divergence');
      if(e.hist.indexOf('Atlanta')<0) throw new Error('the counterfactual must name Atlanta (what saved Lincoln)');
      var D=mkC('US',1864,11); D.clock.resolved1864=true; D.clock.elected=true;
      if(has(divScan(D),'election-1864')) throw new Error('a sustained (historical) re-election must not register as a divergence');
      return { tier:e.tier }; });

    step('THE 1864 ELECTION (bug-hunt HIGH) — the side gate: a CS home-front break does NOT fire the Northern "election-1864"/Lincoln entry; it fires the side-correct "cs-homefront-breaks" (no Lincoln/re-election, no CS-election fabrication)', function(){
      var C=mkC('CS',1864,11); C.clock.resolved1864=true; C.clock.elected=false;
      var es=divScan(C);
      if(has(es,'election-1864')) throw new Error('a CS campaign must NOT fire the Northern "election-1864" entry (the side gate)');
      var e=entry(es,'cs-homefront-breaks');
      if(!e||e.cat!=='Politics'||e.tier!=='radical') throw new Error('a CS home-front break should fire a radical Politics "cs-homefront-breaks" entry');
      if(/Lincoln|re-election|212/i.test(e.title+' '+e.hist)) throw new Error('the CS counterfactual must NOT mention Lincoln/re-election (a Northern fact)');
      if(e.hist.indexOf('1862')<0||e.hist.indexOf('no further presidential')<0&&e.hist.indexOf('no 1864 presidential')<0) throw new Error('the CS counterfactual must name the Feb-1862 six-year term + the no-CS-election fact');
      return { csEntry:e.id, when:e.when }; });

    step('EMANCIPATION late (bug-hunt MED) — a Proclamation dragged to 1864/65 fires a MAJOR "emanc-late" (a Union failing); 1863 stays clean', function(){
      var C=mkC('US',1864,6); C.president.emancipation={ issued:true, declined:false, year:1864, month:6 };
      var e=entry(divScan(C),'emanc-late');
      if(!e||e.cat!=='Emancipation'||e.tier!=='major') throw new Error('a late (1864) emancipation should be a major "emanc-late" entry');
      if(e.hist.indexOf('January 1, 1863')<0) throw new Error('the late-emancipation counterfactual must anchor the historical date');
      if(e.title.indexOf('delayed')<0) throw new Error('the late entry should frame it as a delay (a Union failing)');
      var Ch=mkC('US',1863,1); Ch.president.emancipation={ issued:true, declined:false, year:1863, month:1 };
      if(has(divScan(Ch),'emanc-late')||has(divScan(Ch),'emanc-early')||has(divScan(Ch),'emanc-1862')) throw new Error('the historical 1863 date must stay clean (no early/late/1862 entry)');
      return { tier:e.tier }; });

    step('THE WAR TRAJECTORY — a CS reachable peace/recognition is a radical Strategy divergence; a fresh CS war is clean', function(){
      var Cw=mkC('CS',1865,2); Cw.strategy.victoryReady='will';
      var ew=entry(divScan(Cw),'traj-cs-peace'); if(!ew||ew.tier!=='radical'||ew.cat!=='Strategy') throw new Error('CS victoryReady=will should be a radical Strategy divergence');
      if(ew.hist.indexOf('Appomattox')<0) throw new Error('the counterfactual must name Appomattox');
      var Cr=mkC('CS',1864,6); Cr.strategy.victoryReady='recognition';
      if(!has(divScan(Cr),'traj-cs-recog')) throw new Error('CS victoryReady=recognition should register');
      var Cf=mkC('CS',1863,6);   // no victoryReady
      if(has(divScan(Cf),'traj-cs-peace')||has(divScan(Cf),'traj-cs-recog')) throw new Error('a fresh CS war must not show a trajectory divergence');
      return { peace:ew.tier }; });

    step('WILD CARDS — plausibility maps to divergence tier (plausible->minor, longshot->major, fantastical->radical); each has a real counterfactual', function(){
      var C=mkC('US',1863,6);
      C.strategy.wildsPlayed=['us-hardwar','us-repeaters','us-gatling'];   // plausible / longshot / fantastical
      var es=divScan(C);
      var hw=entry(es,'wild-us-hardwar'), rp=entry(es,'wild-us-repeaters'), gt=entry(es,'wild-us-gatling');
      if(!hw||hw.tier!=='minor') throw new Error('a plausible wild card must be a MINOR divergence, got '+(hw&&hw.tier));
      if(!rp||rp.tier!=='major') throw new Error('a longshot wild card must be a MAJOR divergence, got '+(rp&&rp.tier));
      if(!gt||gt.tier!=='radical') throw new Error('a fantastical wild card must be a RADICAL divergence, got '+(gt&&gt.tier));
      [hw,rp,gt].forEach(function(e){ if(e.cat!=='Wild Card') throw new Error(e.id+' wrong category '+e.cat);
        if(!e.hist||e.hist.indexOf('never came to pass')>=0) throw new Error('wild card '+e.id+' missing a real (non-generic) counterfactual'); });
      // a tampered/unknown wild id is IGNORED, not faked
      var D=mkC('US',1863,6); D.strategy.wildsPlayed=['no-such-card-xyz'];
      if(divScan(D).length!==0) throw new Error('an unknown wild id must be ignored, not faked into a divergence');
      return { hardwar:hw.tier, repeaters:rp.tier, gatling:gt.tier }; });

    step('the DIVERGENCE INDEX rises with divergence + saturates at 100; the word ladder is monotone', function(){
      var es0=divIndex([]).idx;
      var es1=divIndex([{tier:'minor'}]).idx;
      var es2=divIndex([{tier:'major'}]).idx;
      var es3=divIndex([{tier:'radical'}]).idx;
      if(!(es0===0 && es1>0 && es2>es1 && es3>es2)) throw new Error('index must rise minor<major<radical: '+[es0,es1,es2,es3].join('/'));
      // many radicals saturate at the 100 cap
      var many=[]; for(var i=0;i<40;i++) many.push({tier:'radical'});
      if(divIndex(many).idx!==100) throw new Error('the index must saturate at 100, got '+divIndex(many).idx);
      if(divIndex(many).word!=='A war history would not recognize') throw new Error('a saturated index should read the strongest word');
      return { ladder:[es0,es1,es2,es3], saturated:100 }; });

    step('the EMERGENT-ONLY toggle withholds the wild-card section; OFF (default) renders the gambits byte-identically', function(){
      var C=mkC('US',1863,6);
      // default OFF: divEmergentOnly false; _vicWildSection renders the engageable gambits (the pre-E1 body)
      if(divEmergentOnly()!==false) throw new Error('emergent-only must default OFF');
      if(typeof _vicWildSection==='function'){
        var off=_vicWildSection(C);
        if(off.indexOf('wild_')<0 && off.indexOf('Engage')<0) throw new Error('with the toggle OFF the wild-card section must render the engageable gambits');
        if(off.indexOf('turned off')>=0) throw new Error('with the toggle OFF the section must NOT show the withheld placeholder');
      }
      // flip it on
      G.settings.altHistoryEmergentOnly=true;
      if(divEmergentOnly()!==true) throw new Error('the setting must read true after flipping');
      if(typeof _vicWildSection==='function'){
        var on=_vicWildSection(C);
        if(on.indexOf('wild_')>=0) throw new Error('with the toggle ON no wild-card Engage buttons may render');
        if(on.indexOf('turned off')<0) throw new Error('with the toggle ON the section must show the withheld placeholder');
      }
      // the tab reflects the toggle state + offers the control
      var html=divRenderTab(C);
      if(html.indexOf('divEmergentToggle')<0) throw new Error('the tab must render the emergent-only control');
      if(html.indexOf('aria-pressed')<0) throw new Error('the toggle must carry aria-pressed');
      G.settings.altHistoryEmergentOnly=false;   // restore
      return { defaultOff:true, withholdsWhenOn:true }; });

    step('PURE READ-OUT — divScan + divRenderTab WRITE NOTHING (no scoreboard, no strategy/president mutation)', function(){
      var C=mkC('US',1863,6); C.president.emancipation={ issued:false, declined:true }; C.strategy.wildsPlayed=['us-gatling'];
      function snap(){ return JSON.stringify({ idx:C.idx, stats:C.stats, strength:(C.manpower&&C.manpower.strength),
        emancipation:C.president.emancipation, wildsPlayed:C.strategy.wildsPlayed, enemyWill:C.strategy.enemyWill, victoryReady:C.strategy.victoryReady, funds:C.funds }); }
      var s0=snap(); divScan(C); divIndex(divScan(C)); divRenderTab(C);
      if(snap()!==s0) throw new Error('divScan/divRenderTab mutated campaign state (must be a pure read-out)');
      return { pure:true }; });

    step('the ledger render carries the CVD-safe tier chips (glyph + word) + groups + sources; null campaign is safe', function(){
      var C=mkC('CS',1865,2); C.strategy.armEnslaved=true; C.strategy.victoryReady='will'; C.blockade.recognition=72; C.strategy.wildsPlayed=['cs-stonewall'];
      var html=divRenderTab(C);
      if(html.indexOf('Radical')<0) throw new Error('a radical entry must render the "Radical" chip word');
      if(html.indexOf('\\u2605')<0 && html.indexOf('★')<0) throw new Error('the radical chip must carry its CVD glyph');
      if(html.indexOf('Emancipation')<0||html.indexOf('trajectory')<0) throw new Error('the ledger must show its category headers');
      if(html.indexOf('McPherson')<0) throw new Error('the footer must cite sources');
      if(_scrubDataUris(html).indexOf('NaN')>=0||_scrubDataUris(html).indexOf('>undefined')>=0) throw new Error('the rich render leaked NaN/undefined');
      var safe=divRenderTab(null);
      if(safe.indexOf('No active campaign')<0) throw new Error('a null campaign must render the safe placeholder');
      return { len:html.length }; });

    step('LANE-012 SLICE 1 (D455 4a.2) - the sourced "In history..." ledger renders under BOTH rulesets, byte-identically (the divergence tab is a mode-independent teaching carrier)', function(){
      if (typeof mayhemInit!=='function') throw new Error('mayhem kernel missing');
      var C=mkC('CS',1864,6); C.strategy.armEnslaved=true;                      // seeds the Cleburne hist line
      var M=JSON.parse(JSON.stringify(C)); delete M.ruleset; mayhemInit(M,'mayhem','new');
      if(typeof mayhemIsActive!=='function'||!mayhemIsActive(M)) throw new Error('mayhem fixture did not activate');
      var hH=divRenderTab(C), hM=divRenderTab(M);
      if(hH.indexOf('In history')<0) throw new Error('the Historical ledger lost its In-history corpus');
      if(hH.indexOf('McPherson')<0) throw new Error('the Historical ledger lost its sources foot');
      if(hH!==hM) throw new Error('the divergence tab must render byte-identically under both rulesets (always-visible in BOTH modes)');
      return { bothModes:true, len:hH.length }; });

    step('POLITICS TEACHING SIDE GATE — US election rows and CS home-front rows never cross', function(){
      var U=mkC('US',1864,11), S=mkC('CS',1864,11), uh=politicsTeachingHTML(U), sh=politicsTeachingHTML(S);
      if(uh.indexOf('212–21')<0||uh.indexOf('75–80')<0||uh.indexOf('Disputed')<0) throw new Error('US election teaching/provenance missing');
      if(/No Confederate presidential election|Dissent inside a slaveholding/.test(uh)) throw new Error('CS rows leaked to US');
      if(sh.indexOf('No Confederate presidential election')<0||sh.indexOf('committed to slavery')<0||sh.indexOf('Inferred')<0) throw new Error('CS home-front teaching missing');
      if(/212–21|Lincoln's military-vote/.test(sh)) throw new Error('Northern election language leaked to CS');
      return { us:true, cs:true }; });
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
    writeFileSync(join(OUT,'probe-divergence.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-divergence ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-divergence.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-divergence.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-divergence: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-divergence: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-divergence: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
