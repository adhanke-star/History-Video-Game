#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-ratings.mjs — D94 RATING SYSTEM, increment R-0 (the data spine + pure functions).
// Verifies the OVR / grade / dual-OVR / derivation math, the A-F bands, the realism-scaled input
// caps, and THE CALIBRATION ORACLE (a persona's derived officer-quality reproduces the authored
// leader quality shipped in data/bullrun.json). R-0 wires NOTHING into combat, so this probe only
// exercises the pure functions; byte-identity is proven by the full no-regression suite staying green.
// Writes shots/probe-ratings.json.
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
  function near(a,b,tol){ return Math.abs(a-b)<=tol; }
  function neutralPersona(){ var p={}, A=['tactical','command','initiative','resolve','discipline','marksmanship','vigor','charisma','aggression','grit','logistics','engineering','cavalry','artillery','political']; for(var i=0;i<A.length;i++)p[A[i]]=64; return p; }
  // recursively collect every {id, quality} object in the live Bull Run data (the authored truth).
  function collectQuality(node, out){ if(!node||typeof node!=='object')return; if(node.id&&typeof node.quality==='number')out[node.id]=node.quality;
    if(Array.isArray(node)){ for(var i=0;i<node.length;i++)collectQuality(node[i],out); } else { for(var k in node){ if(node.hasOwnProperty(k))collectQuality(node[k],out); } } }
  try {
    var fns=['fldPersonaOVR','fldRatingGrade','fldDualOVR','fldOfficerSkillSeed','fldPersonaQuality','fldDerivePerson','fldUnitRatingOVR','fldRatingRealismCap','fldBadgeDef','fldRatSeededJitter'];
    for(var i=0;i<fns.length;i++) if(typeof window[fns[i]]!=='function') return JSON.stringify({ok:false, fatal:'missing rating fn '+fns[i]});

    var D = (typeof GAME_DATA!=='undefined' && GAME_DATA) ? GAME_DATA.ratings : null;

    step('DATA: GAME_DATA.ratings with 15 attributes, badgeDefs, personas', function(){
      if(!D) throw new Error('GAME_DATA.ratings missing');
      if(!D.attributes || D.attributes.length!==15) throw new Error('want 15 attributes, got '+(D.attributes&&D.attributes.length));
      if(!D.badgeDefs || D.badgeDefs.length<18) throw new Error('want >=18 badgeDefs, got '+(D.badgeDefs&&D.badgeDefs.length));
      if(!D.personas) throw new Error('no personas');
      var posBadges=0,negBadges=0,xf=0; for(var i=0;i<D.badgeDefs.length;i++){ var b=D.badgeDefs[i]; if(b.polarity==='neg')negBadges++; else posBadges++; if(b.rung==='xfactor')xf++; }
      if(negBadges<4) throw new Error('want >=4 negative badges (anti-Lost-Cause), got '+negBadges);
      if(xf<4) throw new Error('want >=4 X-Factor badges, got '+xf);
      return { attrs:D.attributes.length, badges:D.badgeDefs.length, neg:negBadges, xfactor:xf, personas:Object.keys(D.personas).filter(function(k){return k!=='_note';}).length }; });

    step('NEUTRAL persona (all 64) -> OVR 64 -> grade C / Steady (the 64-anchor)', function(){
      var ovr=fldPersonaOVR(neutralPersona());
      if(ovr!==64) throw new Error('neutral OVR should be 64, got '+ovr);
      var g=fldRatingGrade(ovr);
      if(g.letter!=='C' || g.word!=='Steady') throw new Error('neutral grade should be C/Steady, got '+g.letter+'/'+g.word);
      return { neutralOVR:ovr, grade:g.letter, word:g.word }; });

    step('A-F GRADE bands (A+ >=90 Legendary; reuse _cmdLeadWord words; neutral 64 = C)', function(){
      var cases=[[95,'A+','Legendary'],[85,'A','Masterful'],[75,'B','Able'],[64,'C','Steady'],[50,'D','Uneven'],[40,'F','Faltering']];
      for(var i=0;i<cases.length;i++){ var g=fldRatingGrade(cases[i][0]);
        if(g.letter!==cases[i][1]||g.word!==cases[i][2]) throw new Error('OVR '+cases[i][0]+' -> '+g.letter+'/'+g.word+', want '+cases[i][1]+'/'+cases[i][2]); }
      // word/color must agree with _cmdLeadWord for the lower 5 bands (one vocabulary)
      if(typeof _cmdLeadWord==='function'){ var w=_cmdLeadWord(85); if(fldRatingGrade(85).word!==w[0]) throw new Error('grade word diverges from _cmdLeadWord'); }
      return { bandsOK:true }; });

    step('CALIBRATION ORACLE: each persona-quality reproduces the AUTHORED leader quality (<=0.10)', function(){
      var live={}; if(GAME_DATA && GAME_DATA.bullrun) collectQuality(GAME_DATA.bullrun, live);
      var rows=[], maxDelta=0;
      for(var pid in D.personas){ if(!D.personas.hasOwnProperty(pid)||pid==='_note')continue; var rec=D.personas[pid]; if(!rec.persona)continue;
        var derived=fldPersonaQuality(rec.persona);
        var authored=(typeof rec.authoredQuality==='number')?rec.authoredQuality:null;
        var liveQ=(typeof live[pid]==='number')?live[pid]:null;
        var target=(liveQ!=null)?liveQ:authored;
        if(target==null) continue;
        var d=Math.abs(derived-target); if(d>maxDelta)maxDelta=d;
        rows.push({pid:pid, derived:Math.round(derived*1000)/1000, authored:authored, live:liveQ});
        if(d>0.10) throw new Error(pid+': derived quality '+derived.toFixed(3)+' vs authored '+target+' (delta '+d.toFixed(3)+' > 0.10)');
        // guard: the persona's authoredQuality field must MATCH the live shipped value (no drift)
        if(liveQ!=null && authored!=null && Math.abs(liveQ-authored)>0.001) throw new Error(pid+': authoredQuality '+authored+' != live bullrun quality '+liveQ);
      }
      if(rows.length<6) throw new Error('want >=6 calibrated personas, got '+rows.length);
      return { calibrated:rows.length, maxDelta:Math.round(maxDelta*1000)/1000, sample:rows.slice(0,3) }; });

    step('DUAL OVR: aggression drives Attack, resolve/grit drive Defend (matchups)', function(){
      var base=neutralPersona();
      var atkP={}; for(var k in base)atkP[k]=base[k]; atkP.aggression=92; atkP.initiative=88;
      var defP={}; for(var k2 in base)defP[k2]=base[k2]; defP.resolve=92; defP.grit=90;
      var a=fldDualOVR(atkP), d=fldDualOVR(defP);
      if(!(a.attack>a.headline)) throw new Error('aggressive persona attack '+a.attack+' should exceed headline '+a.headline);
      if(!(a.attack>a.defend)) throw new Error('aggressive persona should have attack>defend: '+a.attack+'/'+a.defend);
      if(!(d.defend>d.headline)) throw new Error('steady persona defend '+d.defend+' should exceed headline '+d.headline);
      if(!(d.defend>d.attack)) throw new Error('steady persona should have defend>attack: '+d.defend+'/'+d.attack);
      // aggression is EXCLUDED from the headline (anti-Lost-Cause): two personas differing ONLY in aggression have the SAME headline
      var h1={}; for(var k3 in base)h1[k3]=base[k3]; h1.aggression=20;
      var h2={}; for(var k4 in base)h2[k4]=base[k4]; h2.aggression=95;
      if(fldPersonaOVR(h1)!==fldPersonaOVR(h2)) throw new Error('aggression leaked into the headline OVR');
      return { aggHeadline:a.headline, aggAttack:a.attack, aggDefend:a.defend, defDefend:d.defend, defAttack:d.attack }; });

    step('DERIVE generated person: Inferred, near rank-base, deterministic, never Legendary', function(){
      var r1=fldDerivePerson({rank:'Private', branch:'inf', pid:'test_pvt_1'}, 1862);
      var r2=fldDerivePerson({rank:'Private', branch:'inf', pid:'test_pvt_1'}, 1862);
      if(!r1||r1.provenance!=='Inferred'||!r1.generated) throw new Error('generated private should be Inferred+generated');
      if(JSON.stringify(r1.persona)!==JSON.stringify(r2.persona)) throw new Error('derivation not deterministic (RNG leak)');
      var vals=[]; for(var k in r1.persona){ vals.push(r1.persona[k]); if(r1.persona[k]>=90) throw new Error('generated attr hit Legendary: '+k+'='+r1.persona[k]); }
      var ovr=fldPersonaOVR(r1.persona);
      if(ovr<38||ovr>62) throw new Error('private OVR out of plausible band: '+ovr);   // ~48 base +/- jitter
      // authored persona passes through with its provenance
      var jr=fldDerivePerson(D.personas.ld_jackson, 1861);
      if(!jr||jr.provenance!=='Verified'||jr.generated) throw new Error('authored Jackson should pass through Verified');
      return { privateOVR:ovr, provenance:r1.provenance, jacksonProv:jr.provenance }; });

    step('REALISM-SCALED INPUT CAPS: arcade > balanced > historian (D94-softcap)', function(){
      var a=fldRatingRealismCap('arcade','cmdBonus'), b=fldRatingRealismCap('balanced','cmdBonus'), h=fldRatingRealismCap('historian','cmdBonus');
      if(!(a>b && b>h)) throw new Error('cmdBonus caps not monotone arcade>balanced>historian: '+a+'/'+b+'/'+h);
      if(!(h<=0.92)) throw new Error('historian cmdBonus cap should stay near the tight historical wall (~0.72-0.9), got '+h);
      var ax=fldRatingRealismCap('arcade','xfactor'), hx=fldRatingRealismCap('historian','xfactor');
      if(!(ax>hx)) throw new Error('xfactor cap should be more generous at arcade');
      return { arcade:a, balanced:b, historian:h, xfArcade:ax, xfHistorian:hx }; });

    step('SEEDED JITTER deterministic + bounded [-span,+span]', function(){
      var s1=fldRatSeededJitter('abc',6), s2=fldRatSeededJitter('abc',6);
      if(s1!==s2) throw new Error('jitter not deterministic');
      for(var i=0;i<200;i++){ var v=fldRatSeededJitter('seed'+i,6); if(v<-6||v>6) throw new Error('jitter out of range: '+v); }
      return { sample:s1 }; });

    step('BRIGADE OVR (display): pure read of unit fields; veteran+rifled > green+smooth', function(){
      var vet=fldUnitRatingOVR({xp:3, weapon:'rifled', morale:100, maxMor:100, fatigue:0, cmdBonus:0.3});
      var green=fldUnitRatingOVR({xp:0, weapon:'smooth', morale:70, maxMor:100, fatigue:20, cmdBonus:0});
      if(!(vet>green)) throw new Error('veteran brigade OVR '+vet+' should exceed green '+green);
      if(vet<70) throw new Error('a veteran rifled brigade with a colonel should grade well, got '+vet);
      return { veteranOVR:vet, greenOVR:green }; });

    step('R-1 STRATEGIC: every general effective-skill is persona-DERIVED yet reproduces gen.skill EXACTLY (byte-identical pipe; appoint-pool words match history)', function(){
      if(typeof _cmdEffectiveSkill!=='function'||typeof _cmdGenPersona!=='function'||typeof _cmdSideGenerals!=='function'||typeof _cmdLeadWord!=='function') throw new Error('command pipe fns missing');
      var GP=D.generalPersonas; if(!GP) throw new Error('no generalPersonas in GAME_DATA.ratings');
      var rated=0, all=0, sides=['US','CS'], sample=[];
      for(var s=0;s<sides.length;s++){ var roster=_cmdSideGenerals(sides[s]);
        for(var i=0;i<roster.length;i++){ var g=roster[i]; all++;
          var eff=_cmdEffectiveSkill(g);
          if(eff!==g.skill) throw new Error(g.id+': effective skill '+eff+' != authored gen.skill '+g.skill+' (pipe not byte-identical)');
          var rec=_cmdGenPersona(g);
          if(rec){ rated++;
            var seed=Math.round(fldOfficerSkillSeed(rec.persona));
            if(seed!==g.skill) throw new Error(g.id+': persona seed '+seed+' != gen.skill '+g.skill+' (calibration drift)');
            if(typeof rec.skill==='number' && rec.skill!==g.skill) throw new Error(g.id+': generalPersonas.skill '+rec.skill+' != gen.skill '+g.skill);
            // the leadership WORD from the derived spine must equal the pre-R-1 authored spine (history match)
            var rW=_cmdLeadWord(0.55*eff+0.45*60), aW=_cmdLeadWord(0.55*g.skill+0.45*60);
            if(rW[0]!==aW[0]) throw new Error(g.id+': derived word '+rW[0]+' != authored '+aW[0]);
            if(sample.length<3) sample.push({id:g.id, skill:g.skill, word:rW[0]});
          }
        }
      }
      if(rated<9) throw new Error('want >=9 rated strategic generals (the D92-hardened commanders), got '+rated);
      return { generals:all, rated:rated, sample:sample }; });

    step('R-1 STRATEGIC: an UNRATED general (no persona) keeps his authored skill -> byte-identical', function(){
      var us=_cmdSideGenerals('US').concat(_cmdSideGenerals('CS')), unrated=null;
      for(var i=0;i<us.length;i++){ if(!_cmdGenPersona(us[i])){ unrated=us[i]; break; } }
      if(!unrated) throw new Error('expected at least one unrated general (only 9 of 20 are authored)');
      if(_cmdEffectiveSkill(unrated)!==unrated.skill) throw new Error(unrated.id+': unrated effective skill changed from '+unrated.skill);
      return { unrated:unrated.id, skill:unrated.skill }; });

    step('R-1 TACTICAL: a RATED field leader takes quality/radius/fate from his persona (aura shifts ~authored); an UNRATED leader is byte-identical', function(){
      if(typeof fldMakeOfficer!=='function'||typeof fldPersonaQuality!=='function') throw new Error('officer/rating fns missing');
      if(typeof __FIELD!=='undefined') __FIELD.seed=999;   // make fldRng deterministic for the seeded _fate
      var rec=D.personas.ld_jackson; if(!rec||!rec.persona) throw new Error('no ld_jackson field persona'); var authoredQ=rec.authoredQuality;
      // RATED: the leader OPTS IN via pid -> quality is DERIVED (the input 0.5 is overridden by history)
      var rated=fldMakeOfficer({ side:'CS', pid:'ld_jackson', id:'ld_jackson', name:'Jackson', short:'Jackson', quality:0.5, radius:205, fate:1.0 });
      var pq=fldPersonaQuality(rec.persona);
      if(Math.abs(rated.quality-pq)>1e-9) throw new Error('rated quality '+rated.quality+' != persona-derived '+pq);
      if(Math.abs(rated.quality-authoredQ)>0.02) throw new Error('rated quality '+rated.quality+' drifted from authored '+authoredQ+' (calibration)');
      if(Math.abs(rated.quality-0.5)<1e-9) throw new Error('rated quality should follow the persona, not the input 0.5');
      if(!(rated.radius>=160 && rated.radius<=290)) throw new Error('rated radius out of the 160-290 band: '+rated.radius);
      // COLLISION GUARD: the SAME id but NO pid must NOT derive -> a reused id (ld_jackson also
      // appears at Antietam/Chancellorsville) cannot leak the Bull Run persona across scenarios.
      var noPid=fldMakeOfficer({ side:'CS', id:'ld_jackson', name:'Jackson', short:'Jackson', quality:0.5, radius:205, fate:1.0 });
      if(Math.abs(noPid.quality-0.5)>1e-9) throw new Error('id-only (no pid) leader derived a persona — cross-scenario id leak: '+noPid.quality);
      if(noPid.radius!==205) throw new Error('id-only (no pid) radius changed from 205: '+noPid.radius);
      // UNRATED: a synthetic id with no persona/pid -> every authored value preserved (byte-identical)
      var un=fldMakeOfficer({ side:'US', id:'SYN_TEST_LT', name:'Test', short:'Test', quality:0.8, radius:200, fate:1.5 });
      if(Math.abs(un.quality-0.8)>1e-9) throw new Error('unrated quality changed from 0.8: '+un.quality);
      if(un.radius!==200) throw new Error('unrated radius changed from 200: '+un.radius);
      return { ratedQ:Math.round(rated.quality*1000)/1000, authoredQ:authoredQ, ratedRadius:rated.radius, noPidQ:noPid.quality, unratedQ:un.quality, unratedRadius:un.radius }; });

    step('R-2 UI: fldRatingHudSelected renders a brigade OVR + A-F grade, TRIPLE-encoded (number + letter + word)', function(){
      if(typeof fldRatingHudSelected!=='function') throw new Error('fldRatingHudSelected missing');
      var u={xp:3, weapon:'rifled', morale:100, maxMor:100, fatigue:0, cmdBonus:0.3};
      var ovr=fldUnitRatingOVR(u), g=fldRatingGrade(ovr);
      var html=fldRatingHudSelected(u);
      if(!html) throw new Error('expected a non-empty HUD line for a unit with ratings data');
      if(html.indexOf(String(ovr))<0) throw new Error('HUD missing the OVR number '+ovr);
      if(html.indexOf('OVR')<0) throw new Error('HUD missing the OVR label');
      if(html.indexOf(g.letter)<0) throw new Error('HUD missing the grade letter '+g.letter);
      if(html.indexOf(g.word)<0) throw new Error('HUD missing the grade word '+g.word);
      if(fldRatingHudSelected(null)!=='') throw new Error('a null unit should yield an empty HUD line (no crash)');
      return { ovr:ovr, letter:g.letter, word:g.word, len:html.length }; });

    step('R-3 BADGE ENGINE: off byte-identical (factor 1); on bounded + data-reversible; the per-lever stacking cap holds; negatives DAMP; realism-scaled; pure', function(){
      if(typeof fldBadgeFactor!=='function'||typeof fldUnitCohesion!=='function'||typeof fldRatingRealismCap!=='function') throw new Error('badge fns missing');
      var savedB=(typeof __FIELD!=='undefined')?__FIELD.badges:undefined, savedT=(typeof __FIELD!=='undefined')?__FIELD.realismTier:undefined;
      try {
        // OFF: the engine off -> IDENTITY even with badges on the unit (byte-identical guarantee)
        __FIELD.badges=false; __FIELD.realismTier='balanced';
        if(fldBadgeFactor({badges:['marksman','woods_fighter'],xp:2,arm:'inf'},'fire')!==1) throw new Error('badges OFF must be identity 1.0');
        // ON but no badge data -> identity (this is what keeps every shipped scenario byte-identical)
        __FIELD.badges=true;
        if(fldBadgeFactor({badges:[],xp:2},'fire')!==1) throw new Error('empty badges must be identity 1.0');
        if(fldBadgeFactor({xp:2},'fire')!==1) throw new Error('absent badges must be identity 1.0');
        var cap=fldRatingRealismCap('balanced','badgeLever');
        // ON: a single fire badge lifts, inside (1, 1+cap]
        var one=fldBadgeFactor({badges:['marksman'],xp:2,arm:'inf'},'fire');
        if(!(one>1 && one<=1+cap+1e-9)) throw new Error('single fire badge out of (1,1+cap]: '+one);
        // STACKING CAP (tested on the rally lever, which has 3 always-on positives): disciplined(.06)+blooded(.05)
        // +beloved(.06)=.17 -> clamped to the balanced cap .10 -> exactly 1.10. "Stack every positive" cannot breach.
        var STK=['disciplined','blooded','beloved'];
        var stack=fldBadgeFactor({badges:STK,xp:2},'rally');
        if(Math.abs(stack-(1+cap))>1e-9) throw new Error('stacked rally factor should clamp to exactly 1+cap ('+(1+cap)+'), got '+stack);
        if(!(stack>fldBadgeFactor({badges:['disciplined'],xp:2},'rally'))) throw new Error('a 3-badge stack should exceed a single badge (pre-clamp)');
        // DATA-REVERSIBLE: remove the data -> identity restored
        if(fldBadgeFactor({badges:[],xp:2},'rally')!==1) throw new Error('removing badge data must restore identity');
        // NEGATIVE = a DAMPER (factor<1), bounded by 1-cap, never an enemy buff
        var neg=fldBadgeFactor({badges:['green_levies'],xp:2},'rally');
        if(!(neg<1 && neg>=1-cap-1e-9)) throw new Error('negative rally badge out of [1-cap,1): '+neg);
        if(!(fldBadgeFactor({badges:['the_slows']},'speed')<1)) throw new Error('the_slows must drag speed');
        if(!(fldBadgeFactor({badges:['hardy_marcher']},'speed')>1)) throw new Error('hardy_marcher must quicken speed');
        if(!(fldBadgeFactor({badges:['rigid_plan']},'fire')<1)) throw new Error('rigid_plan must dampen fire');
        // REALISM-SCALED cap: arcade(.16) allows a bigger stack than balanced(.10) than historian(.06) (D94-softcap)
        __FIELD.realismTier='arcade'; var arc=fldBadgeFactor({badges:STK,xp:2},'rally');
        __FIELD.realismTier='historian'; var his=fldBadgeFactor({badges:STK,xp:2},'rally');
        if(!(arc>stack && stack>his)) throw new Error('cap not realism-monotone arcade>balanced>historian: '+arc+'/'+stack+'/'+his);
        // PURITY: fldBadgeFactor must not mutate the unit (it only seeds inputs by RETURNING a factor)
        var pu={badges:['marksman'],xp:2,arm:'inf'}, snap=JSON.stringify(pu); fldBadgeFactor(pu,'fire'); if(JSON.stringify(pu)!==snap) throw new Error('fldBadgeFactor mutated the unit');
        // COHESION rally term: absent -> 0 (byte-identical); set -> (c-50)/50 clamped [-1,1]
        if(fldUnitCohesion({})!==0) throw new Error('absent cohesion must be 0 (byte-identical)');
        if(Math.abs(fldUnitCohesion({cohesion:75})-0.5)>1e-9) throw new Error('cohesion 75 -> 0.5');
        if(fldUnitCohesion({cohesion:200})!==1 || fldUnitCohesion({cohesion:-50})!==-1) throw new Error('cohesion must clamp to [-1,1]');
        return { cap:cap, single:Math.round(one*1000)/1000, balStack:Math.round(stack*1000)/1000, arcStack:Math.round(arc*1000)/1000, hisStack:Math.round(his*1000)/1000, greenLevies:Math.round(neg*1000)/1000 };
      } finally { if(typeof __FIELD!=='undefined'){ __FIELD.badges=savedB; __FIELD.realismTier=savedT; } }
    });

    step('PURITY: rating fns do not mutate G or __FIELD (R-0 is inert / byte-identical)', function(){
      var beforeMode=(typeof G!=='undefined')?G.mode:null;
      var fu=(typeof __FIELD!=='undefined' && __FIELD.units)?__FIELD.units.length:null;
      fldPersonaOVR(neutralPersona()); fldDualOVR(D.personas.ld_jackson.persona); fldUnitRatingOVR({xp:2,weapon:'rifled'}); fldDerivePerson({rank:'Sgt',branch:'cav',pid:'z'},1863);
      if(typeof G!=='undefined' && G.mode!==beforeMode) throw new Error('rating fns mutated G.mode');
      if(typeof __FIELD!=='undefined' && __FIELD.units && __FIELD.units.length!==fu) throw new Error('rating fns mutated __FIELD.units');
      return { gMode:beforeMode, fieldUnits:fu }; });
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
    writeFileSync(join(OUT,'probe-ratings.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-ratings ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
