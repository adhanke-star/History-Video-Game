#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-afteraction.mjs — E4 (D112) THE GRADED AFTER-ACTION REPORT. Verifies:
// the module loads; the A-F report-card scale maps correctly (neutral 64 -> C; >=90 -> A+;
// each grade carries letter+label+colour, CVD-safe); a FRESH campaign reports an honest
// baseline (battlefield "no battle yet", no NaN/undefined); per-domain grades compute from
// resolved aggregate state and a STRONG war out-grades a WEAK one; the US war-aims domain is
// graded by emancipation TIMING (declined < late < 1863) while the CS side renders a
// NON-graded, anti-Lost-Cause "Confederate Cause" panel (Stephens/cornerstone, excluded from
// the GPA); the report reads back the D111 divergence ledger (index + "your war vs history");
// the human cost cites the ~750,000 historical toll; the Reconstruction coda is keyed to the
// emancipation choice (Foner); the report + tab + grade fns WRITE NOTHING (pure read-out);
// and the warWonScreen OVERRIDE renders the FINAL report, wires a Main-Menu button, and
// nullifies the campaign (base behavior preserved) with 0 pageerrors.
// Writes shots/probe-afteraction.json.
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
    C.clock.year=(y||1864); C.president.date={year:(y||1864),month:(m||9)}; return C; }
  function dom(C, key){ var ds=_aarDomains(C); for(var i=0;i<ds.length;i++) if(ds[i].key===key) return ds[i]; return null; }
  try {
    if (typeof aarGrade!=='function' || typeof _aarDomains!=='function' || typeof aarOverall!=='function'
        || typeof aarRenderReport!=='function' || typeof aarRenderTab!=='function' || typeof warWonScreen!=='function')
      return JSON.stringify({ok:false,fatal:'after-action module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; delete G.settings.altHistoryEmergentOnly;

    step('module loads; the A-F report-card scale maps correctly (64 -> C; >=90 -> A+; <44 -> F) with letter+label+colour', function(){
      var c=aarGrade(64), ap=aarGrade(95), f=aarGrade(20), b=aarGrade(72), d=aarGrade(48);
      if(c.letter!=='C') throw new Error('neutral 64 must be a C, got '+c.letter);
      if(ap.letter!=='A+') throw new Error('>=90 must be A+, got '+ap.letter);
      if(f.letter!=='F') throw new Error('<44 must be F, got '+f.letter);
      if(b.letter!=='B'||d.letter!=='D') throw new Error('mid-band mapping wrong: '+b.letter+'/'+d.letter);
      [c,ap,f,b,d].forEach(function(g){ if(!g.label||!g.col) throw new Error('a grade must carry a label + colour (CVD triple-encode)'); });
      // out-of-range + NaN coerce safely
      if(aarGrade(999).letter!=='A+'||aarGrade(-50).letter!=='F'||aarGrade(NaN).letter!=='C') throw new Error('grade must clamp/coerce extremes (NaN -> neutral C)');
      return { c:c.letter, ap:ap.letter, f:f.letter }; });

    step('a FRESH campaign reports an honest baseline (no battle yet; overall renders; no NaN/undefined)', function(){
      var C=mkC('US',1862,9);
      var b=dom(C,'field'); if(!b||b.detail.indexOf('No battle')<0) throw new Error('a fresh battlefield domain must say no battle yet');
      var ov=aarOverall(_aarDomains(C)); if(!ov.grade||!ov.grade.letter) throw new Error('overall grade missing on a fresh campaign');
      var html=aarRenderTab(C);
      if(html.indexOf('After-Action')<0) throw new Error('the live tab must carry its heading');
      if(html.indexOf('NaN')>=0||html.indexOf('undefined')>=0) throw new Error('fresh render leaked NaN/undefined');
      var safe=aarRenderTab(null); if(safe.indexOf('No active campaign')<0) throw new Error('a null campaign must render the safe placeholder');
      return { overall:ov.grade.letter }; });

    step('per-domain grades compute from resolved state; a STRONG war out-grades a WEAK war', function(){
      var Cs=mkC('US',1864,11);
      Cs.stats={battles:10,won:9,infl:55000,suff:20000}; Cs.economy.inflation=1.1;
      Cs.blockade.recognition=0; Cs.blockade.recognitionForeclosed=true; Cs.blockade.importFactor=0.9;
      Cs.clock.weariness=15; Cs.clock.capital=80; Cs.clock.resolved1864=true; Cs.clock.elected=true;
      Cs.president.emancipation={issued:true,declined:false,year:1863,month:1};
      var os=aarOverall(_aarDomains(Cs));
      var Cw=mkC('US',1864,11);
      Cw.stats={battles:10,won:1,infl:20000,suff:60000}; Cw.economy.inflation=2.7;
      Cw.blockade.recognition=70; Cw.blockade.recognitionForeclosed=false; Cw.blockade.importFactor=0.3;
      Cw.clock.weariness=85; Cw.clock.capital=0; Cw.clock.resolved1864=true; Cw.clock.elected=false;
      Cw.president.emancipation={issued:false,declined:true};
      var ow=aarOverall(_aarDomains(Cw));
      if(!(os.score>ow.score)) throw new Error('a strong war must out-grade a weak war: '+Math.round(os.score)+' vs '+Math.round(ow.score));
      // the strong battlefield + treasury individually out-grade the weak ones
      if(!(dom(Cs,'field').score>dom(Cw,'field').score)) throw new Error('strong battlefield must out-grade weak');
      if(!(dom(Cs,'treasury').score>dom(Cw,'treasury').score)) throw new Error('low inflation must out-grade the spiral');
      return { strong:os.grade.letter+' ('+Math.round(os.score)+')', weak:ow.grade.letter+' ('+Math.round(ow.score)+')' }; });

    step('US war-aims is graded by emancipation TIMING (declined < late < 1863)', function(){
      var Cd=mkC('US',1865,1); Cd.president.emancipation={issued:false,declined:true};
      var Cl=mkC('US',1864,6); Cl.president.emancipation={issued:true,declined:false,year:1864,month:6};
      var Ch=mkC('US',1863,1); Ch.president.emancipation={issued:true,declined:false,year:1863,month:1};
      var sd=dom(Cd,'purpose').score, sl=dom(Cl,'purpose').score, sh=dom(Ch,'purpose').score;
      if(!(sd<sl && sl<sh)) throw new Error('emancipation timing must order declined<late<1863: '+[sd,sl,sh].join('/'));
      if(dom(Ch,'purpose').label.indexOf('Emancipation')<0) throw new Error('the US war-aims domain should be labeled Emancipation & War Aims');
      return { declined:sd, late:sl, historical:sh }; });

    step('the CS side renders a NON-graded, anti-Lost-Cause "Confederate Cause" panel (Stephens/cornerstone), excluded from the GPA', function(){
      var C=mkC('CS',1864,6);
      var p=dom(C,'purpose');
      if(!p||p.score!==null) throw new Error('the CS war-purpose domain must be non-graded (score null)');
      if(p.label.indexOf('Confederate Cause')<0) throw new Error('the CS panel must be "The Confederate Cause"');
      if(p.note.indexOf('Stephens')<0||p.note.toLowerCase().indexOf('cornerstone')<0) throw new Error('the CS cause must name Stephens + the cornerstone (anti-Lost-Cause)');
      // excluded from GPA: aarOverall averages only graded domains, so adding the null panel does not change n
      var ds=_aarDomains(C); var graded=ds.filter(function(d){return typeof d.score==='number';}).length;
      var ov=aarOverall(ds);
      if(!(ov.grade&&ov.grade.letter)) throw new Error('CS overall must still compute over the graded domains');
      var html=aarRenderReport(C,{final:false});
      if(html.indexOf('An honest accounting')<0) throw new Error('the non-graded panel must show the "honest accounting" tag, not a letter');
      return { graded:graded, overall:ov.grade.letter }; });

    step('the report reads back the D111 divergence ledger (index + "your war vs history") + the ~750,000 historical toll', function(){
      var C=mkC('US',1864,11); C.president.emancipation={issued:false,declined:true}; C.strategy.wildsPlayed=['us-gatling']; C.stats={battles:5,won:3,infl:9000,suff:7000};
      var html=aarRenderReport(C,{final:false});
      if(html.indexOf('Your war vs history')<0) throw new Error('the report must read back the divergence ledger');
      if(html.indexOf('Divergence index')<0) throw new Error('the report must show the divergence index');
      if(html.indexOf('750,000')<0) throw new Error('the human-cost panel must cite the ~750,000 historical toll');
      if(html.indexOf('Hacker')<0) throw new Error('the human-cost anchor must cite its source');
      // a perfectly historical war reads the "followed the record" line
      var Cc=mkC('US',1863,1); Cc.president.emancipation={issued:true,declined:false,year:1863,month:1};
      var clean=aarRenderReport(Cc,{final:false});
      if(clean.indexOf('followed the documented record')<0) throw new Error('a historical war must report it has followed the record');
      return { ok:true }; });

    step('the Reconstruction coda is keyed to the emancipation choice (Foner; anti-Lost-Cause)', function(){
      var Cd=mkC('US',1865,4); Cd.president.emancipation={issued:false,declined:true};
      var hd=aarRenderReport(Cd,{final:true});
      if(hd.indexOf('slavery intact')<0) throw new Error('a Union that declined emancipation must name "slavery intact" in the coda');
      if(hd.indexOf('Reconstruction to Come')<0) throw new Error('the final report must title the Reconstruction coda');
      var Ci=mkC('US',1865,4); Ci.president.emancipation={issued:true,declined:false,year:1863,month:1};
      var hi=aarRenderReport(Ci,{final:true});
      if(hi.indexOf('Reconstruction')<0||hi.indexOf('Foner')<0) throw new Error('the issued-emancipation coda must reach Reconstruction + cite Foner');
      if(hi.indexOf('Redemption')<0&&hi.indexOf('Jim Crow')<0) throw new Error('the coda must name the betrayal of Reconstruction (Redemption / Jim Crow)');
      ['Dec. 6, 1865','July 9, 1868','March 30, 1870'].forEach(function(token){ if(hi.indexOf(token)<0) throw new Error('the coda must surface amendment date: '+token); });
      if(hi.indexOf('Black Codes')<0||hi.indexOf('Klan terror')<0) throw new Error('the coda must name Black Codes and Klan terror');
      // a CS reachable peace names the moral cost of an independent slaveholding republic
      var Cp=mkC('CS',1865,2); Cp.strategy.victoryReady='will';
      var hp=aarRenderReport(Cp,{final:true});
      if(hp.indexOf('slaveholding republic')<0) throw new Error('a CS independence coda must name the slaveholding republic (the moral cost)');
      return { ok:true }; });

    step('PURE READ-OUT — _aarDomains/aarOverall/aarRenderReport/aarRenderTab WRITE NOTHING', function(){
      var C=mkC('US',1864,11); C.president.emancipation={issued:false,declined:true}; C.strategy.wildsPlayed=['us-gatling']; C.stats={battles:6,won:4,infl:8000,suff:5000};
      function snap(){ return JSON.stringify({ idx:C.idx, stats:C.stats, emancipation:C.president.emancipation,
        wildsPlayed:C.strategy.wildsPlayed, enemyWill:C.strategy.enemyWill, victoryReady:C.strategy.victoryReady,
        funds:C.funds, inflation:C.economy.inflation, recognition:C.blockade.recognition, morale:C.morale }); }
      var s0=snap();
      _aarDomains(C); aarOverall(_aarDomains(C)); aarRenderReport(C,{final:false}); aarRenderReport(C,{final:true}); aarRenderTab(C);
      if(snap()!==s0) throw new Error('the after-action read-out mutated campaign state (must be pure)');
      return { pure:true }; });

    step('bug-hunt (D112 LOW) — a NaN moraleCompute().public is sanitized: the home-front domain stays GRADED + finite, no "NaN" leaks, the graded-count matches the GPA', function(){
      var saved = (typeof moraleCompute==='function') ? moraleCompute : null;
      try {
        window.moraleCompute = function(){ return { public: NaN, troop:50, leader:50 }; };   // force the non-finite path
        var C=mkC('US',1864,11); C.morale.public=61; C.clock.resolved1864=true; C.clock.elected=true;
        var d=dom(C,'homefront');
        if(typeof d.score!=='number'||!isFinite(d.score)) throw new Error('the home-front score must stay finite when moraleCompute returns NaN, got '+d.score);
        var html=aarRenderReport(C,{final:false});
        if(html.indexOf('NaN')>=0) throw new Error('a NaN public-will must not leak into the render');
        if(html.indexOf('An honest accounting')>=0) throw new Error('the graded home-front row must not mis-render as the non-graded panel under NaN');
        var ds=_aarDomains(C); var graded=ds.filter(function(x){return typeof x.score==='number'&&isFinite(x.score);}).length;
        if(html.indexOf('Across '+graded+' graded domains')<0) throw new Error('the overall-panel count must equal the isFinite-graded divisor (no off-by-one under NaN)');
        return { homefrontScore:Math.round(d.score), graded:graded };
      } finally { if(saved) window.moraleCompute = saved; }
    });

    step('the warWonScreen OVERRIDE renders the FINAL graded report, wires a Main-Menu button, and nullifies the campaign', function(){
      var C=mkC('US',1865,4);
      C.stats={battles:12,won:11,infl:60000,suff:25000}; C.president.emancipation={issued:true,declined:false,year:1863,month:1};
      C.clock.resolved1864=true; C.clock.elected=true;
      if(typeof openSheet!=='function') throw new Error('openSheet missing — cannot exercise the war-won screen');
      warWonScreen();
      var rep=document.getElementById('wwReport');
      if(!rep) throw new Error('the war-won screen must render the #wwReport block');
      var t=rep.innerHTML;
      if(t.indexOf('Final Reckoning')<0) throw new Error('the war-end report must carry the final framing');
      if(t.indexOf('Reconstruction to Come')<0) throw new Error('the war-end report must carry the Reconstruction coda');
      if(t.indexOf('Overall conduct')<0) throw new Error('the war-end report must carry the overall grade panel');
      if(!document.getElementById('wwMainMenu')) throw new Error('the war-won screen must wire a Main-Menu button');
      if(G.campaign!==null) throw new Error('warWonScreen must nullify the campaign (base behavior preserved)');
      if(typeof closeSheet==='function') closeSheet();
      return { rendered:true }; });

    // ---- GEA-02 (D434): plain-text export controls over the rendered report. ----
    step('GEA-02 (D434) the export bar renders with accessible controls + render-time context, outside the text root', function(){
      if(typeof _aarExportBar!=='function'||typeof _aarExportBuildText!=='function'||typeof _aarExportHandle!=='function')
        throw new Error('GEA-02 export functions missing');
      var C=mkC('US',1864,9); C.stats={battles:7,won:5,infl:1000,suff:900}; C.iron=true;
      var html=aarRenderReport(C,{final:false});
      if(html.indexOf('aarReportWrap')<0||html.indexOf('aarReportRoot')<0) throw new Error('the report must render inside the export wrapper/root pair');
      if(html.indexOf('aarCopyBtn')<0||html.indexOf('Copy Report')<0) throw new Error('the Copy Report control is missing');
      if(html.indexOf('aarDlBtn')<0||html.indexOf('Download Text')<0) throw new Error('the Download Text control is missing');
      if(html.indexOf('aria-live="polite"')<0||html.indexOf('role="status"')<0) throw new Error('the export status region must be role=status aria-live=polite');
      if(html.indexOf('role="group"')<0||html.indexOf('Share this report')<0) throw new Error('the export bar must be a labeled group');
      if(html.indexOf('data-battles="7"')<0) throw new Error('render-time completed-battle count missing');
      if(html.indexOf('data-iron="1"')<0) throw new Error('render-time Ironman status missing');
      if(html.indexOf('data-final="0"')<0) throw new Error('a live report must stamp data-final=0');
      var fin=aarRenderReport(C,{final:true});
      if(fin.indexOf('data-final="1"')<0) throw new Error('a final report must stamp data-final=1');
      // the bar sits OUTSIDE the text root so the export never contains its own controls
      var d=document.createElement('div'); d.innerHTML=html;
      var root=d.querySelector('.aarReportRoot');
      if(root && root.querySelector('.aarExport')) throw new Error('the export bar must sit outside .aarReportRoot');
      return { ok:true }; });

    step('GEA-02 the plain-text builder carries the context header + visible report text and excludes the controls (secret-free)', function(){
      var C=mkC('CS',1864,9); C.stats={battles:3,won:1,infl:500,suff:800};
      try { if (typeof closeSheet==='function') closeSheet(); } catch(e){}   // D443 (AD-2 fixture fix, never-run authoring bug): earlier war-end steps leave the sheet overlay open, rendering body-appended nodes hidden — innerText of a non-rendered node is empty, so the WYSIWYG body read came back blank
      var host=document.createElement('div'); host.innerHTML=aarRenderReport(C,{final:false}); document.body.appendChild(host);
      try {
        var bar=host.querySelector('.aarExport'), root=host.querySelector('.aarReportRoot');
        if(!bar||!root) throw new Error('bar/root missing after DOM insertion');
        var text=_aarExportBuildText(bar,root);
        if(text.indexOf('AFTER-ACTION REPORT')<0) throw new Error('the export header is missing');
        if(text.indexOf('Side: Confederate')<0) throw new Error('the side context is missing');
        if(text.indexOf('Status: Live campaign')<0) throw new Error('the live/final status is missing');
        if(text.indexOf('Battles fought: 3')<0) throw new Error('the completed-battle count is missing');
        if(text.indexOf('Ironman: Off')<0) throw new Error('the Ironman status is missing');
        if(text.indexOf('Copy Report')>=0||text.indexOf('Download Text')>=0) throw new Error('the export text must not contain the controls themselves');
        if(text.indexOf('cw_llm')>=0) throw new Error('the export text leaked a device-local secret key');
        if(text.toUpperCase().indexOf('OVERALL CONDUCT')<0) throw new Error('the export text must carry the visible report body');   // D443 (AD-2 root fix, never-run authoring bug): the panel label renders under CSS text-transform:uppercase and innerText is WYSIWYG — the export deliberately carries the RENDERED casing
        return { len:text.length };
      } finally { document.body.removeChild(host); } });

    // ---- E4-i2 (D119): the STRATEGIC war-END — a reached victoryReady concludes the war. ----
    // ---- GEA-14 (D451, AUDIT-DEBT AD-18): the classroom session packet on the GEA-02 bar. ----
    // BIND A PREDECLARATION - removing the bar's guarded spPacketButtonHtml seam must red
    // exactly this step's button-presence assert, nothing else.
    // BIND B PREDECLARATION - removing the packet's white-paper print stylesheet must red
    // exactly this step's print-CSS ink-trap assert.
    step('GEA-14 (D451) the Session Packet: button rides the GEA-02 bar (existing controls untouched); the packet composes ONLY existing surfaces (AAR text, divScan ledger, registry teaching cards, GEA-10 concept index) with sources verbatim; print CSS is white-paper with NO dark ink trap; generation is a pure read', function(){
      if (typeof spPacketHtml!=='function' || typeof spPacketButtonHtml!=='function') throw new Error('session-packet API missing');
      var C=mkC('US',1864,9); C.stats={battles:3,won:2,infl:500,suff:400}; C.iron=false;
      C.completed=['bullrun1'];   // registry-resolvable -> its teaching cards must compose
      var bar=aarRenderReport(C,{final:false});
      if (bar.indexOf('aarPacketBtn')<0 || bar.indexOf('Session Packet')<0) throw new Error('the Session Packet button is missing from the bar');
      if (bar.indexOf('aarCopyBtn')<0 || bar.indexOf('aarDlBtn')<0) throw new Error('the existing GEA-02 controls moved');
      var before=JSON.stringify(C);
      var pk=spPacketHtml(C);
      if (JSON.stringify(C)!==before) throw new Error('packet generation wrote the campaign');
      if (!pk || pk.indexOf('<!DOCTYPE html')!==0) throw new Error('not a self-contained document');
      if (pk.indexOf('AFTER-ACTION')<0 && pk.indexOf('After-action')<0) throw new Error('the AAR section is missing');
      if (pk.indexOf('Divergence ledger')<0) throw new Error('the divergence section is missing');
      if (pk.indexOf('Concept index')<0 || pk.indexOf('concept:union-blockade')<0) throw new Error('the GEA-10 concept index is missing');
      // sources verbatim: bullrun1's citations ride untouched. Its cards are ANCESTOR-COVERED
      // (D430/D433: the source register lives on the battle object, not the card), so the
      // battle-level register must print (the D453 audit root-fix); any card-level list
      // (spec-era battles) still rides per card.
      var sd=(typeof fldScenarioData==='function')?fldScenarioData('bullrun1'):null;
      var card=sd&&sd.teaching&&sd.teaching.cards&&sd.teaching.cards[0];
      if (card&&card.sources&&card.sources.length){
        var probeSrc=String(card.sources[0]);
        if (pk.indexOf(probeSrc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'))<0 && pk.indexOf(probeSrc)<0)
          throw new Error('a battle-card source did not ride verbatim');
      }
      if (!sd||!sd.sources||!sd.sources.length) throw new Error('bullrun1 carries no battle-level source register');
      var breg=String(sd.sources[0]);
      if (pk.indexOf('Battle source register')<0) throw new Error('the battle source register section is missing');
      if (pk.indexOf(breg.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'))<0 && pk.indexOf(breg)<0)
        throw new Error('the battle-level source register did not ride verbatim');
      // print-CSS sanity: white paper declared; NO dark background token anywhere in the stylesheet
      if (pk.indexOf('background:#fff')<0) throw new Error('white-paper background missing');
      var css=pk.slice(pk.indexOf('<style>'),pk.indexOf('</style>'));
      if (/background:#(0|1|2)[0-9a-f]{2}/i.test(css)) throw new Error('a dark ink-trap background in the print stylesheet');
      if (pk.indexOf('@media print')<0) throw new Error('print rules missing');
      return { bytes: pk.length };
    });

    step('D119 strategic-end availability is side-correct (will = either side; recognition = CS-only)', function(){
      if(typeof aarStrategicEndAvailable!=='function') throw new Error('aarStrategicEndAvailable missing');
      var U=mkC('US',1864,9); U.strategy.victoryReady='will';
      if(aarStrategicEndAvailable(U)!=='will') throw new Error('US victoryReady=will must offer a strategic end (the rebellion sues for terms)');
      var S=mkC('CS',1864,9); S.strategy.victoryReady='will';
      if(aarStrategicEndAvailable(S)!=='will') throw new Error('CS victoryReady=will must offer a strategic end');
      var Sr=mkC('CS',1863,6); Sr.strategy.victoryReady='recognition';
      if(aarStrategicEndAvailable(Sr)!=='recognition') throw new Error('CS victoryReady=recognition must offer a strategic end');
      var Ur=mkC('US',1863,6); Ur.strategy.victoryReady='recognition';
      if(aarStrategicEndAvailable(Ur)!==null) throw new Error('the Union must NOT win by the Confederacy gaining recognition (recognition is CS-only)');
      var Cn=mkC('US',1864,9); Cn.strategy.victoryReady=null;
      if(aarStrategicEndAvailable(Cn)!==null) throw new Error('no victoryReady -> no strategic end');
      if(aarStrategicEndAvailable(null)!==null) throw new Error('null campaign -> no strategic end (no throw)');
      return { ok:true }; });

    step('D119 the offer copy is side-aware (CS: let the South go; US: end the rebellion)', function(){
      var S=mkC('CS',1864,9); S.strategy.victoryReady='will'; var so=aarStrategicEndOffer(S);
      if(!so||so.reason!=='will'||!so.line||!so.btn) throw new Error('CS will offer must carry reason/line/btn');
      if(so.line.indexOf('Northern')<0) throw new Error('the CS negotiated-peace offer should name the breaking Northern will');
      var U=mkC('US',1864,9); U.strategy.victoryReady='will'; var uo=aarStrategicEndOffer(U);
      if(uo.line.indexOf('rebellion')<0) throw new Error('the US negotiated-peace offer should name ending the rebellion');
      if(so.line===uo.line) throw new Error('the offer copy must be side-aware (CS vs US lines must differ)');
      var Sr=mkC('CS',1863,6); Sr.strategy.victoryReady='recognition'; var ro=aarStrategicEndOffer(Sr);
      if(!ro||ro.reason!=='recognition'||ro.line.toLowerCase().indexOf('recogn')<0) throw new Error('the CS recognition offer should name recognition');
      if(aarStrategicEndOffer(mkC('US',1864,9))!==null) throw new Error('a fresh campaign (victoryReady null) -> no offer');
      return { ok:true }; });

    step('D119 the between-battles interstitial surfaces the Conclude-the-war offer ONLY when available', function(){
      if(typeof _pdInterstitialHTML!=='function') return { skipped:'no interstitial' };
      var C=mkC('US',1864,9); C.strategy.victoryReady='will';
      var h=_pdInterstitialHTML(C);
      if(h.indexOf('pdConcludeWar')<0) throw new Error('the interstitial must surface the Conclude-the-war button when a strategic end is reached');
      if(h.indexOf('The war can be concluded')<0) throw new Error('the offer banner heading must render');
      if(h.indexOf('data-reason="will"')<0) throw new Error('the offer button must carry its reason');
      var C0=mkC('US',1864,9); C0.strategy.victoryReady=null;
      if(_pdInterstitialHTML(C0).indexOf('pdConcludeWar')>=0) throw new Error('no strategic end -> NO offer button (byte-identical interstitial)');
      return { ok:true }; });

    step('D119 aarConcludeWar fires the graded report with side-aware framing + ENDS the war', function(){
      if(typeof openSheet!=='function') throw new Error('openSheet missing — cannot exercise the strategic war-end');
      // CS negotiated peace
      function sheet(){ var p=document.getElementById('sheetPad'); return (p?p.innerHTML:'')||''; }   // openSheet REPLACES #sheetPad — scope to it (document.body retains stale prior sheets)
      var S=mkC('CS',1864,11); S.strategy.victoryReady='will'; S.stats={battles:10,won:7,infl:30000,suff:25000};
      aarConcludeWar('will');
      var b1=sheet();
      if(b1.indexOf('A Negotiated Peace')<0) throw new Error('a will-conclusion must title "A Negotiated Peace"');
      if(b1.indexOf('let the South go')<0) throw new Error('the CS negotiated-peace verdict must name letting the South go');
      if(b1.indexOf('Reconstruction to Come')<0) throw new Error('the strategic conclusion must still render the graded final report (the Reconstruction coda)');
      if(b1.indexOf('The War is Won')>=0) throw new Error('a strategic conclusion must NOT use the chain-completion title');
      if(G.campaign!==null) throw new Error('aarConcludeWar must END the war (nullify the campaign)');
      if(typeof closeSheet==='function') closeSheet();
      // CS recognized independence
      var Sr=mkC('CS',1863,6); Sr.strategy.victoryReady='recognition'; Sr.stats={battles:8,won:6,infl:20000,suff:15000};
      aarConcludeWar('recognition');
      var b2=sheet();
      if(b2.indexOf('Recognized Independence')<0) throw new Error('a recognition-conclusion must title "Recognized Independence"');
      if(G.campaign!==null) throw new Error('the recognition conclusion must END the war');
      if(typeof closeSheet==='function') closeSheet();
      // bug-hunt LOW (D119): a strategic conclude must reset _pdTurnAck so the NEXT campaign surfaces its first interstitial
      if(typeof _pdTurnAck!=='undefined'){
        _pdTurnAck=true; var Sx=mkC('CS',1864,11); Sx.strategy.victoryReady='will'; aarConcludeWar('will');
        if(_pdTurnAck!==false) throw new Error('a strategic conclude must reset _pdTurnAck=false (else the next campaign skips its first interstitial)');
        if(typeof closeSheet==='function') closeSheet();
      }
      return { ok:true }; });

    step('D119 chain-completion (no strategic reason) keeps the byte-identical "The War is Won / Victory!" framing', function(){
      if(typeof openSheet!=='function') throw new Error('openSheet missing');
      var C=mkC('US',1865,4); C.stats={battles:12,won:11,infl:60000,suff:25000};
      C.president.emancipation={issued:true,declined:false,year:1863,month:1}; C.clock.resolved1864=true; C.clock.elected=true;
      warWonScreen();   // the base chain-completion path — _aarEndReason is null
      var p=document.getElementById('sheetPad'); var b=(p?p.innerHTML:'')||'';
      if(b.indexOf('The War is Won')<0) throw new Error('chain completion must keep the "The War is Won" title (D112 byte-identical)');
      if(b.indexOf('Victory!')<0) throw new Error('chain completion must keep the "Victory!" verdict');
      if(b.indexOf('A Negotiated Peace')>=0||b.indexOf('Recognized Independence')>=0) throw new Error('chain completion must NOT use a strategic-conclusion title');
      if(G.campaign!==null) throw new Error('warWonScreen must nullify the campaign');
      if(typeof closeSheet==='function') closeSheet();
      // bug-hunt LOW (D119): the CS chain-completion subtitle stays side-correct
      var Cs=mkC('CS',1865,4); Cs.stats={battles:12,won:11,infl:60000,suff:25000};
      warWonScreen();
      var pc=document.getElementById('sheetPad'); var bc=(pc?pc.innerHTML:'')||'';
      if(bc.indexOf('Confederate Campaign')<0) throw new Error('a CS chain completion must carry the "Confederate Campaign" subtitle (side-correct)');
      if(typeof closeSheet==='function') closeSheet();
      return { ok:true }; });

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
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-afteraction.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-afteraction ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-afteraction.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-afteraction.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-afteraction: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-afteraction: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-afteraction: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
