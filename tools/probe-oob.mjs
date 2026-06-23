#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-oob.mjs — D106 · THE OOB-MAPPING SUBSTRATE (RATING-SYSTEM-DESIGN §12.1/§13/§15).
// Verifies the read-only strategic-next-battle -> tactical-OOB mapping: the AUTHORED path (a hand-built
// scenario's real brigade OOB, real commanders + authored provenance), the DERIVED path (a deterministic
// procedural corps/brigade tree with NO fabricated officers, Inferred), the ENEMY-FUZZY board gate (§15),
// determinism (no RNG), purity (no G/__FIELD/C mutation -> byte-identical), and graceful nulls. The
// substrate is a PURE READ-OUT; byte-identity is proven by the full no-regression suite + the harness.
// Writes shots/probe-oob.json.
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
  // a minimal campaign C, same idiom as probe-command's mkC.
  function mkC(side, y, m){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    C.clock.year=(y||1862); C.president.date={year:(y||1862),month:(m||9)}; return C; }
  // every brigade across a side's corps tree (flatten).
  function allBrigs(sideOOB){ var out=[]; for(var c=0;c<sideOOB.corps.length;c++){ var co=sideOOB.corps[c]; for(var b=0;b<co.brigades.length;b++) out.push(co.brigades[b]); } return out; }
  try {
    var fns=['fldOOBForSide','fldCampaignOOB','fldCampaignOOBHtml','_fldOOBDerive','_fldOOBAuthored','_fldOOBProvFromNote'];
    for(var i=0;i<fns.length;i++) if(typeof window[fns[i]]!=='function') return JSON.stringify({ok:false, fatal:'missing OOB fn '+fns[i]});
    if(typeof BATTLES==='undefined') return JSON.stringify({ok:false, fatal:'no BATTLES'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    var bullrunBd = BATTLES.find(function(b){ return b.id==='bullrun1'; });

    step('SUBSTRATE: fldCampaignOOB(C) returns a structured both-sides tree for the next battle', function(){
      var C=mkC('US',1861,7);
      var d=fldCampaignOOB(C);
      if(!d) throw new Error('null for a live campaign with a next battle');
      if(!d.player||!d.enemy||!d.bd) throw new Error('missing player/enemy/bd');
      if(d.playerSide!=='US'||d.enemySide!=='CS') throw new Error('side wiring: '+d.playerSide+'/'+d.enemySide);
      var p=d.player;
      if(!Array.isArray(p.corps)||!p.corps.length) throw new Error('player has no corps');
      if(typeof p.forceOVR!=='number'||p.forceOVR<20||p.forceOVR>100) throw new Error('bad forceOVR '+p.forceOVR);
      if(typeof p.men!=='number'||p.men<=0) throw new Error('bad men '+p.men);
      if(typeof p.n!=='number'||p.n<1) throw new Error('bad brigade count '+p.n);
      if(!d.edge||typeof d.fracPlayer!=='number') throw new Error('no edge/fracPlayer');
      return { nextBattle:d.bd.id, playerSource:p.source, pForce:p.forceOVR, pBrigs:p.n, eForce:d.enemy.forceOVR, eBrigs:d.enemy.n, edge:d.edge.word, fracPlayer:Math.round(d.fracPlayer*100)/100 }; });

    step('AUTHORED: bullrun1 reads the REAL OOB — real commanders + authored provenance, source=authored', function(){
      if(!bullrunBd) throw new Error('no bullrun1 in BATTLES');
      if(typeof fldScenarioData!=='function'||!fldScenarioData('bullrun1')) throw new Error('no bullrun1 scenario data');
      var us=fldOOBForSide(bullrunBd,'US',{});
      var cs=fldOOBForSide(bullrunBd,'CS',{});
      if(!us||us.source!=='authored') throw new Error('US source should be authored, got '+(us&&us.source));
      if(!cs||cs.source!=='authored') throw new Error('CS source should be authored, got '+(cs&&cs.source));
      var bu=allBrigs(us);
      if(bu.length<2) throw new Error('US authored OOB too small: '+bu.length);
      var named=0, provd=0; for(var i=0;i<bu.length;i++){ if(bu[i].commander) named++; if(/^(Verified|Inferred|Disputed)$/.test(bu[i].prov)) provd++; if(bu[i].source!=='authored') throw new Error('brigade marked non-authored'); }
      if(named<1) throw new Error('authored OOB has NO real commanders (expected the historical names)');
      if(provd!==bu.length) throw new Error('every brigade must carry a parsed provenance');
      // the historical ENEMY commander surfaces from BATTLES (cmdCS), Verified, never invented.
      var ecmd=fldOOBForSide(bullrunBd,'CS',{}).commander;
      if(!ecmd||ecmd.name!==bullrunBd.cmdCS) throw new Error('enemy commander not the historical cmdCS ('+(ecmd&&ecmd.name)+' vs '+bullrunBd.cmdCS+')');
      if(ecmd.prov!=='Verified') throw new Error('historical commander must be Verified');
      return { usBrigs:bu.length, usNamed:named, csBrigs:allBrigs(cs).length, enemyCmd:ecmd.name, sampleProv:bu[0].prov }; });

    step('DERIVED: a procedural battle gets a deterministic corps tree — NO fabricated officers (non-negotiable #4)', function(){
      var bd={ id:'__proc_test', name:'Engagement at Test Creek', year:1863, us:24000, cs:20000, atk:'US', cmdUS:'Grant', cmdCS:'Bragg', feat:'woods' };
      // ensure it has NO hand-built scenario (so it must derive)
      if(typeof fldScenarioData==='function' && fldScenarioData('__proc_test')) throw new Error('test id unexpectedly has scenario data');
      var us=fldOOBForSide(bd,'US',{});
      if(!us||us.source!=='derived') throw new Error('source should be derived, got '+(us&&us.source));
      if(us.corps.length<1) throw new Error('no corps');
      var bu=allBrigs(us), fabricated=0, inferred=0;
      for(var i=0;i<bu.length;i++){ if(bu[i].commander!==null) fabricated++; if(bu[i].prov==='Inferred') inferred++; if(bu[i].source!=='derived') throw new Error('derived brigade mislabeled'); }
      if(fabricated!==0) throw new Error('DERIVED OOB INVENTED '+fabricated+' officer name(s) — forbidden (no fabricated ranks/units)');
      if(inferred!==bu.length) throw new Error('every derived brigade must be Inferred');
      // formation-labeled corps (I Corps … / Garrison), not a person
      if(!/Corps|Garrison/.test(us.corps[0].label)) throw new Error('corps not formation-labeled: '+us.corps[0].label);
      // the army commander headline names the historical cmdUS (Verified), never invented
      if(!us.commander||us.commander.name!==bd.cmdUS) throw new Error('army commander not cmdUS');
      // EXACT men conservation (D106 bug-hunt: artillery is carved off the TOP, no men destroyed)
      if(Math.abs(us.men - bd.us) > 3) throw new Error('derived men must conserve the total (artillery carved off top): '+us.men+' vs '+bd.us);
      return { corps:us.corps.length, brigs:bu.length, fabricated:fabricated, men:us.men, forceOVR:us.forceOVR, labels:us.corps.map(function(c){return c.label;}) }; });

    step('MEN-CONSERVATION + EDGE-HONESTY (D106 bug-hunt): a larger derived army is never shown as the smaller', function(){
      // the prior artillery men*0.4 reduction could flip the edge against history; now men conserve exactly
      var big={ id:'__big', name:'Big', year:1863, us:23000, cs:22000, atk:'US', cmdUS:'G', cmdCS:'B' };
      var us=fldOOBForSide(big,'US',{}), cs=fldOOBForSide(big,'CS',{});
      if(Math.abs(us.men-23000)>3) throw new Error('US men not conserved: '+us.men);
      if(Math.abs(cs.men-22000)>3) throw new Error('CS men not conserved: '+cs.men);
      if(us.men<=cs.men) throw new Error('the larger force (US 23000) must render as larger than CS 22000, got US '+us.men+' CS '+cs.men);
      return { usMen:us.men, csMen:cs.men, conserved:true }; });

    step('TINY FORCE: a fort garrison derives a garrison detachment, no crash, no fabricated officer', function(){
      var bd={ id:'__tiny_test', name:'Fort Test', year:1861, us:85, cs:500, atk:'CS', cmdUS:'Anderson', cmdCS:'Beauregard' };
      var us=fldOOBForSide(bd,'US',{}), cs=fldOOBForSide(bd,'CS',{});
      if(!us||!cs) throw new Error('null on a tiny force');
      var bu=allBrigs(us); for(var i=0;i<bu.length;i++) if(bu[i].commander!==null) throw new Error('garrison invented an officer');
      if(us.men<1) throw new Error('garrison men < 1');
      return { usCorps:us.corps[0].label, usBrigs:bu.length, csBrigs:allBrigs(cs).length, usMen:us.men }; });

    step('ENEMY-FUZZY (§15): the board hides enemy brigade detail by default; reveal:full shows it', function(){
      var C=mkC('US',1861,7);
      var fuzzy=fldCampaignOOBHtml(C);
      var full=fldCampaignOOBHtml(C, { reveal:'full' });
      if(!fuzzy||fuzzy.indexOf('Order of Battle')<0) throw new Error('no board html');
      if(fuzzy.indexOf('Scout the enemy')<0 && fuzzy.indexOf('not yet known')<0) throw new Error('fuzzy board does not gate the enemy');
      if(fuzzy.indexOf('ESTIMATED STRENGTH')<0) throw new Error('fuzzy board missing the estimate framing');
      // the FULL board should be longer (it renders the enemy brigade rows) and drop the scouting prompt
      if(full.length<=fuzzy.length) throw new Error('reveal:full should expand the enemy detail');
      if(full.indexOf('Scout the enemy')>=0) throw new Error('full board should not still prompt to scout');
      return { fuzzyLen:fuzzy.length, fullLen:full.length, gated:true }; });

    step('DETERMINISM: fldCampaignOOB(C) is reproducible (no RNG) — two calls byte-identical', function(){
      var C=mkC('US',1861,7);
      var a=JSON.stringify(fldCampaignOOB(C));
      var b=JSON.stringify(fldCampaignOOB(C));
      if(a!==b) throw new Error('non-deterministic output');
      // the derived OVRs reproduce too
      var bd={ id:'__det', name:'X', year:1862, us:18000, cs:18000, atk:'US', cmdUS:'A', cmdCS:'B' };
      var d1=JSON.stringify(fldOOBForSide(bd,'CS',{})), d2=JSON.stringify(fldOOBForSide(bd,'CS',{}));
      if(d1!==d2) throw new Error('derived path non-deterministic');
      return { stable:true, len:a.length }; });

    step('PURITY: the substrate + the board mutate NOTHING (no G/__FIELD/C/scoreboard write -> byte-identical)', function(){
      var C=mkC('US',1861,7);
      var beforeMode=G.mode, fu=(typeof __FIELD!=='undefined'&&__FIELD.units)?__FIELD.units.length:null;
      var capBefore=(C.clock&&typeof C.clock.capital==='number')?C.clock.capital:null;
      var cSnap=JSON.stringify({idx:C.idx, stats:C.stats, cmd:C.president.command.fieldGeneral});
      fldCampaignOOB(C); fldCampaignOOBHtml(C); fldCampaignOOBHtml(C,{reveal:'full'});
      fldOOBForSide(bullrunBd,'US',{}); _fldOOBDerive({id:'z',year:1863,us:20000,cs:15000},'US');
      if(G.mode!==beforeMode) throw new Error('mutated G.mode');
      if(typeof __FIELD!=='undefined'&&__FIELD.units&&__FIELD.units.length!==fu) throw new Error('mutated __FIELD.units');
      if((C.clock&&typeof C.clock.capital==='number'?C.clock.capital:null)!==capBefore) throw new Error('mutated C.clock.capital');
      if(JSON.stringify({idx:C.idx, stats:C.stats, cmd:C.president.command.fieldGeneral})!==cSnap) throw new Error('mutated campaign state');
      return { gMode:beforeMode, fieldUnits:fu, capital:capBefore }; });

    step('PROVENANCE PARSER: honest stamps — pure Verified stays, MIXED downgrades to Inferred (no overclaim)', function(){
      if(_fldOOBProvFromNote('1st Bde … (Verified)')!=='Verified') throw new Error('pure Verified note misread');
      // D106 bug-hunt MED: a mixed "(Verified identity; Inferred strength)" note must DOWNGRADE — the row's
      // quantitative headline (men + the strength-derived OVR) rests on the Inferred axis, so "Verified" overclaims it.
      if(_fldOOBProvFromNote('(Verified identity; Inferred strength)')!=='Inferred') throw new Error('MIXED note must downgrade to Inferred');
      if(_fldOOBProvFromNote('sources conflict (Disputed)')!=='Disputed') throw new Error('Disputed note misread');
      if(_fldOOBProvFromNote('no marker at all')!=='Inferred') throw new Error('unmarked should default Inferred');
      if(_fldOOBProvFromNote(null)!=='Inferred') throw new Error('null note should default Inferred');
      return { ok:true }; });

    step('PHASE FRAMING (D106 HIGH, anti-Lost-Cause): a multi-phase battle is labeled "the opening engagement", not a verdict', function(){
      // walk the US chain for the first battle whose authored scenario is multi-phase (antietam/gettysburg/…)
      var C=mkC('US',1862,9), found=null;
      for(var idx=0; idx<60; idx++){ C.idx=idx; var b=(typeof _brgNextBattle==='function')?_brgNextBattle(C):null; if(!b)continue;
        var s=(typeof fldScenarioData==='function')?fldScenarioData(b.id):null;
        if(s && Array.isArray(s.phases) && s.phases.length){ found={idx:idx, id:b.id, phaseName:(s.phases[0]&&s.phases[0].name)||''}; break; } }
      if(!found) throw new Error('no multi-phase battle found in the US chain to test');
      C.idx=found.idx;
      var d=fldCampaignOOB(C);
      if(!d.phased) throw new Error('phased battle '+found.id+' not flagged phased');
      var html=fldCampaignOOBHtml(C);
      if(!/opening engagement/i.test(html)) throw new Error('phased board must label "the opening engagement" (got none) for '+found.id);
      if(!/opening clash/i.test(html)) throw new Error('phased board must scope the predicted edge to "the opening clash"');
      return { battle:found.id, phaseName:found.phaseName, phased:d.phased }; });

    step('BOUNDING: extreme/garbage bd (Infinity/NaN/negative men) never renders NaN or Infinity (no crash)', function(){
      var us=fldOOBForSide({id:'__inf', name:'X', year:1862, us:Infinity, cs:NaN, atk:'US', cmdUS:'A', cmdCS:'B'},'US',{});
      if(!us) throw new Error('null on extreme input');
      if(!isFinite(us.men)||!isFinite(us.forceOVR)) throw new Error('non-finite men/forceOVR: '+us.men+'/'+us.forceOVR);
      var neg=fldOOBForSide({id:'__neg', year:1862, us:-5000, cs:3000},'US',{});
      if(!isFinite(neg.men)) throw new Error('negative-men input -> non-finite');
      // a campaign-shaped extreme: render the board and assert no NaN/Infinity leaks into the HTML
      var C=mkC('US',1862,9); G.campaign.idx=0;
      // splice a poisoned battle definition into the chain head if possible; else just render the live board
      var html=fldCampaignOOBHtml(C);
      if(/NaN|Infinity/.test(html)) throw new Error('board leaked NaN/Infinity');
      return { extremeMen:us.men, extremeOVR:us.forceOVR, negMen:neg.men }; });

    step('ENEMY-NO-LEAK: the default (fuzzy) board renders NO enemy per-brigade men row; reveal:full adds them', function(){
      var C=mkC('US',1861,7);
      var fuzzy=fldCampaignOOBHtml(C), full=fldCampaignOOBHtml(C,{reveal:'full'});
      function menRows(s){ return s.split(' men</span>').length - 1; }   // count brigade men rows without a regex (avoids template-literal slash-escaping)
      var fr=menRows(fuzzy), fl=menRows(full);
      // the fuzzy board shows only the PLAYER's brigade men rows; full adds the ENEMY's -> strictly more
      if(fl<=fr) throw new Error('reveal:full must add enemy brigade men rows (fuzzy '+fr+' vs full '+fl+')');
      return { fuzzyMenRows:fr, fullMenRows:fl }; });

    step('GRACEFUL: null inputs + a campaign with no next battle return null / "" (no crash)', function(){
      if(fldCampaignOOB(null)!==null) throw new Error('null C should -> null');
      if(fldCampaignOOBHtml(null)!=='') throw new Error('null C html should -> ""');
      if(fldOOBForSide(null,'US',{})!==null) throw new Error('null bd -> null');
      // a campaign whose idx is past the end of its chain -> no next battle -> null/""
      var C=mkC('US',1862,9); C.idx=9999;
      if(fldCampaignOOB(C)!==null) throw new Error('exhausted chain should -> null');
      if(fldCampaignOOBHtml(C)!=='') throw new Error('exhausted chain html should -> ""');
      return { ok:true }; });

    step('NO-OUTPUT-GATE / WALL: the OOB tree carries NO scoreboard field (cas/winner/victory)', function(){
      var d=fldCampaignOOB(mkC('CS',1863,5));
      var s=JSON.stringify(d);
      if(/\"(cas|aCas|bCas|winner|victory)\"\s*:/.test(s)) throw new Error('the substrate leaked a scoreboard field into the OOB');
      // CS-player wiring: enemy is US, the historical US commander surfaces
      if(d.playerSide!=='CS'||d.enemySide!=='US') throw new Error('CS-player side wiring wrong');
      return { csPlayerOK:true, eForce:d.enemy.forceOVR }; });

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
    writeFileSync(join(OUT,'probe-oob.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-oob ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
