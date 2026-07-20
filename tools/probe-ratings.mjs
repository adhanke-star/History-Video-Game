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

    step('R-4 X-FACTOR SURGE: off byte-identical; SPEED X-Factor surges ONLY _spdMul (no cmdBonus); NON-speed surges cmdBonus capped at the wall; COMBINED speed clamped to [0.75,1.30]; negative drags; realism-scaled; decays; non-X-Factor units untouched', function(){
      var need=['fldXFactorStep','fldXFactorApplyCmd','_fldUnitXFactors','_fldXFactorInZone','_fldXfDecay','fldMoveFactor','fldLaunchSandbox'];
      for(var i=0;i<need.length;i++) if(typeof window[need[i]]!=='function') throw new Error('missing R-4 fn '+need[i]);
      var CAP=(typeof FLDO!=='undefined'&&FLDO.CMD_BONUS_CAP)?FLDO.CMD_BONUS_CAP:0.9;
      function mk(extra){ var u={ id:'XF', side:'CS', name:'Test Bde', arm:'inf', alive:true, state:'steady', x:800, z:200, morale:78, maxMor:78, ammo:100, cmdBonus:0, order:{type:'move',tx:800,tz:1400} }; for(var k in extra) u[k]=extra[k]; return u; }
      function lastStand(extra){ var e={ order:{type:'hold',tx:800,tz:200}, morale:30, maxMor:78 }; for(var k in extra) e[k]=extra[k]; return mk(e); }
      var savedU=(typeof __FIELD!=='undefined')?__FIELD.units:undefined, savedB=(typeof __FIELD!=='undefined')?__FIELD.badges:undefined, savedT=(typeof __FIELD!=='undefined')?__FIELD.realismTier:undefined;
      try {
        fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});   // populate __FIELD.terrain so fldMoveFactor (fldInWoods) is safe; we overwrite __FIELD.units per sub-test
        __FIELD.realismTier='balanced';
        // (1) OFF: badges off -> fldXFactorStep is a no-op (the byte-identical guarantee)
        var off=mk({badges:['foot_cavalry']}); __FIELD.units=[off]; __FIELD.badges=false;
        fldXFactorStep(0.05);
        if(off._xfActive!==undefined||off._spdMul!==undefined||off._xfGlow!==undefined) throw new Error('badges OFF must leave the unit untouched');
        // (1b) a unit with NO X-Factor badge is untouched even when the engine is ON (byte-identical for every shipped scenario)
        __FIELD.badges=true; var plain=mk({badges:['marksman']}); __FIELD.units=[plain]; fldXFactorStep(0.05);
        if(plain._xfActive!==undefined||plain._spdMul!==undefined) throw new Error('a non-X-Factor unit must be untouched (byte-identical)');
        var amp=fldRatingRealismCap('balanced','xfactor');
        // (2) SPEED X-Factor (foot_cavalry, moving): surges ONLY _spdMul in (1,1.15]; does NOT surge the command aura; glows
        var fc=mk({badges:['foot_cavalry']}); __FIELD.units=[fc]; fldXFactorStep(0.05);
        if(!(fc._spdMul>1 && fc._spdMul<=1.15+1e-9)) throw new Error('foot_cavalry _spdMul out of (1,1.15]: '+fc._spdMul);
        if(fc._xfActive>1.0001) throw new Error('a SPEED X-Factor must NOT surge the command aura (declared lever honored): '+fc._xfActive);
        if(!(fc._xfGlow>0)) throw new Error('an active heroic surge should glow');
        // (3) NON-SPEED X-Factor (rock_of_chickamauga, holding + low morale): surges cmdBonus (_xfActive=amp), sets no _spdMul
        var rk=lastStand({badges:['rock_of_chickamauga']}); __FIELD.units=[rk]; fldXFactorStep(0.05);
        if(Math.abs(rk._xfActive-amp)>1e-9) throw new Error('rock_of_chickamauga should surge _xfActive to amp '+amp+', got '+rk._xfActive);
        if(rk._spdMul!==undefined) throw new Error('a non-speed X-Factor must not set _spdMul: '+rk._spdMul);
        if(!(rk._xfGlow>0)) throw new Error('rock surge should glow');
        // a holding unit OUT of the last-stand zone (full morale) does NOT surge
        var rkHold=mk({badges:['rock_of_chickamauga'], order:{type:'hold',tx:800,tz:200}}); __FIELD.units=[rkHold]; fldXFactorStep(0.05);
        if(rkHold._xfActive>1.0001) throw new Error('rock should not surge a steady holding unit: '+rkHold._xfActive);
        // (4) cmdBonus CAP: the surge scales the aura toward the wall, NEVER beyond
        var cu=lastStand({badges:['rock_of_chickamauga'], cmdBonus:0.8}); __FIELD.units=[cu]; __FIELD.realismTier='arcade'; fldXFactorStep(0.05); fldXFactorApplyCmd(cu);
        if(cu.cmdBonus>CAP+1e-9) throw new Error('X-Factor pushed cmdBonus past the cap '+CAP+': '+cu.cmdBonus);
        if(!(cu.cmdBonus>0.8-1e-9)) throw new Error('X-Factor should lift cmdBonus toward the cap, got '+cu.cmdBonus);
        var cu2=lastStand({badges:['rock_of_chickamauga'], cmdBonus:0.4}); __FIELD.units=[cu2]; fldXFactorStep(0.05); fldXFactorApplyCmd(cu2);
        if(!(cu2.cmdBonus>0.4 && cu2.cmdBonus<=CAP+1e-9)) throw new Error('small-aura surge out of (0.4,cap]: '+cu2.cmdBonus);
        __FIELD.realismTier='balanced';
        // (5) NEGATIVE speed X-Factor (the_slows): _spdMul drags <1, no aura surge, no glow (the named flaw, anti-Lost-Cause)
        var sl=mk({badges:['the_slows']}); __FIELD.units=[sl]; fldXFactorStep(0.05);
        if(!(sl._spdMul<1 && sl._spdMul>=0.85-1e-9)) throw new Error('the_slows _spdMul should drag into [0.85,1): '+sl._spdMul);
        if(sl._xfActive>1.0001) throw new Error('a negative X-Factor must not surge the aura: '+sl._xfActive);
        if(sl._xfGlow>0) throw new Error('the named-flaw drag must not glow');
        // (6) COMBINED SPEED CLAMP (fldMoveFactor): a heavy stack (foot_cavalry + hardy_marcher + horseman, in-zone, arcade)
        //     raw ~1.33 must clamp to <= 1.30; a drag stack must floor at >= 0.75. Ratio vs a plain unit cancels terrain.
        __FIELD.realismTier='arcade';
        var stk=mk({arm:'cav', badges:['foot_cavalry','hardy_marcher','horseman']}); __FIELD.units=[stk]; fldXFactorStep(0.05);
        var plainU=mk({arm:'cav'});
        var ratio=fldMoveFactor(stk.x,stk.z,stk)/fldMoveFactor(plainU.x,plainU.z,plainU);
        if(ratio>1.30+1e-6) throw new Error('COMBINED speed clamp breached: ratio '+ratio+' > 1.30');
        if(!(ratio>1.15)) throw new Error('a heavy speed stack should bind near the 1.30 clamp, got '+ratio);
        var slStk=mk({badges:['the_slows','green_levies']}); __FIELD.units=[slStk]; fldXFactorStep(0.05);
        var slRatio=fldMoveFactor(slStk.x,slStk.z,slStk)/fldMoveFactor(plainU.x,plainU.z,plainU);
        if(slRatio<0.75-1e-6) throw new Error('COMBINED speed drag floor breached: '+slRatio+' < 0.75');
        __FIELD.realismTier='balanced';
        // (7) REALISM-SCALED amp (non-speed rock): arcade > balanced > historian (D94-softcap)
        function ampAt(t){ var a=lastStand({badges:['rock_of_chickamauga']}); __FIELD.units=[a]; __FIELD.realismTier=t; fldXFactorStep(0.05); return a._xfActive; }
        var aa=ampAt('arcade'), ab=ampAt('balanced'), ah=ampAt('historian');
        if(!(aa>ab && ab>ah)) throw new Error('xfactor amp not realism-monotone arcade>balanced>historian: '+aa+'/'+ab+'/'+ah);
        __FIELD.realismTier='balanced';
        // (8) DECAY: a unit that leaves the zone decays _xfActive toward identity over ticks
        var dz=lastStand({badges:['rock_of_chickamauga']}); __FIELD.units=[dz]; fldXFactorStep(0.05); var hot=dz._xfActive;
        dz.morale=78;   // morale recovers -> out of the last-stand zone
        for(var s=0;s<80;s++) fldXFactorStep(0.05);
        if(!(dz._xfActive<hot)) throw new Error('decay: _xfActive should fall after leaving the zone');
        if(Math.abs(dz._xfActive-1)>1e-3) throw new Error('decay: _xfActive should converge to 1, got '+dz._xfActive);
        // (9) PURITY of fldXFactorApplyCmd guard: undefined _xfActive -> strict no-op
        var pu={cmdBonus:0.5}; fldXFactorApplyCmd(pu); if(pu.cmdBonus!==0.5) throw new Error('apply on a unit with no _xfActive must be a no-op');
        return { amp:amp, fcSpd:Math.round(fc._spdMul*1000)/1000, rockXf:Math.round(rk._xfActive*1000)/1000, capHi:Math.round(cu.cmdBonus*1000)/1000, slowsSpd:Math.round(sl._spdMul*1000)/1000, stackRatio:Math.round(ratio*1000)/1000, slStackRatio:Math.round(slRatio*1000)/1000, ampArc:aa, ampHis:ah, decayTo:Math.round(dz._xfActive*1000)/1000 };
      } finally { if(typeof __FIELD!=='undefined'){ __FIELD.units=savedU; __FIELD.badges=savedB; __FIELD.realismTier=savedT; } }
    });

    step('R-4 NO-FUDGE REPLAY GATE: deterministic seed-replay — an X-Factor shifts the outcome ONLY within the bounded lever band (never a scripted result); the cmdBonus wall holds', function(){
      var CAP=(typeof FLDO!=='undefined'&&FLDO.CMD_BONUS_CAP)?FLDO.CMD_BONUS_CAP:0.9;
      function runToEnd(maxSteps){ if(__FIELD.phase==='deploy'){__FIELD.phase='battle';__FIELD.paused=false;} var n=0; while(__FIELD.phase==='battle'&&n<maxSteps){ fldSimStep(0.05); n++; } return n; }
      function totalCas(){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; c+=(u.maxMen-u.men); } return Math.round(c); }
      function maxCmd(){ var m=0; for(var i=0;i<__FIELD.units.length;i++){ var b=__FIELD.units[i].cmdBonus||0; if(b>m)m=b; } return m; }
      var SEED=4242;
      // BASELINE: a plain sandbox (no badge assigned) — deterministic
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:SEED});
      var nA=runToEnd(8000), casA=totalCas(), winA=__FIELD.winner;
      // SAME seed, but one CS brigade carries the foot_cavalry X-Factor. Everything else identical.
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:SEED});
      __FIELD.badges=true;
      var tagged=null; for(var i=0;i<__FIELD.units.length;i++){ if(__FIELD.units[i].side==='CS'){ __FIELD.units[i].badges=['foot_cavalry']; tagged=__FIELD.units[i].id; break; } }
      if(!tagged) throw new Error('no CS unit to tag');
      var nB=runToEnd(8000), casB=totalCas(), winB=__FIELD.winner, mc=maxCmd();
      // (a) it BITES: the surge changes the deterministic replay (not a silent no-op)
      if(casA===casB && nA===nB) throw new Error('the X-Factor produced an IDENTICAL replay (it never bit)');
      // (b) BOUNDED: the shift stays inside the lever band — not a scripted blowout (the no-fudge keystone)
      var rel=Math.abs(casB-casA)/Math.max(1,casA);
      if(rel>0.5) throw new Error('casualty delta '+(rel*100).toFixed(1)+'% exceeds the bounded lever band (a scripted-result smell)');
      // (c) the WALL holds: no unit ever ended above CMD_BONUS_CAP
      if(mc>CAP+1e-9) throw new Error('a unit cmdBonus '+mc+' exceeded the no-fudge wall '+CAP);
      // valid winners both runs (no NaN / no deadlock)
      if(['US','CS','draw'].indexOf(winA)<0||['US','CS','draw'].indexOf(winB)<0) throw new Error('invalid winner A='+winA+' B='+winB);
      return { casBaseline:casA, casXfactor:casB, deltaPct:Math.round(rel*1000)/10, winA:winA, winB:winB, maxCmd:Math.round(mc*1000)/1000, tagged:tagged };
    });

    step('Q7 DUAL OVR + MATCHUP: dual tilt directional + fldDualOVR-consistent; force OVR from OOB (single- AND multi-phase); matchup board + edge; render triple-encoded; graceful when no OOB', function(){
      var need=['fldDualTilt','fldOOBSideOVR','fldMatchupBoard','fldMatchupEdgeWord','fldMatchupHtml','fldScenarioData'];
      for(var i=0;i<need.length;i++) if(typeof window[need[i]]!=='function') throw new Error('missing Q7 fn '+need[i]);
      function neutral(){ var p={},A=['tactical','command','initiative','resolve','discipline','marksmanship','vigor','charisma','aggression','grit','logistics','engineering','cavalry','artillery','political'];for(var i=0;i<A.length;i++)p[A[i]]=64;return p; }
      // (1) DUAL TILT directional: aggression -> attack tilt; resolve/grit -> defend tilt
      var atkP=neutral(); atkP.aggression=92; atkP.initiative=88;
      var defP=neutral(); defP.resolve=92; defP.grit=90;
      var ta=fldDualTilt(atkP), td=fldDualTilt(defP);
      if(!(ta.attack>0 && ta.attack>ta.defend)) throw new Error('aggressive persona attack tilt should dominate: '+JSON.stringify(ta));
      if(!(td.defend>0 && td.defend>td.attack)) throw new Error('steady persona defend tilt should dominate: '+JSON.stringify(td));
      // (1b) CONSISTENCY: fldDualOVR(p).attack === fldPersonaOVR(p) + fldDualTilt(p).attack (the refactor invariant)
      var dovr=fldDualOVR(atkP), head=fldPersonaOVR(atkP);
      if(dovr.attack!==head+ta.attack || dovr.defend!==head+ta.defend) throw new Error('fldDualTilt diverges from fldDualOVR: '+JSON.stringify({dovr:dovr,head:head,tilt:ta}));
      // (2) FORCE OVR from a SINGLE-phase OOB (bullrun): non-null, men>0, n>=2, plausible band
      var br=fldScenarioData('bullrun1'); if(!br) throw new Error('no bullrun1 scenario data');
      var us=fldOOBSideOVR(br,'US'), cs=fldOOBSideOVR(br,'CS');
      if(!us||!cs) throw new Error('fldOOBSideOVR null for bullrun');
      if(!(us.men>0 && us.n>=2 && us.ovr>=40 && us.ovr<=92)) throw new Error('bullrun US force OVR implausible: '+JSON.stringify({ovr:us.ovr,men:us.men,n:us.n}));
      if(!(us.brigades.length && us.brigades[0].ovr>=us.brigades[us.brigades.length-1].ovr)) throw new Error('brigades should be sorted strongest-first');
      // (3) FORCE OVR from a MULTI-phase OOB (antietam): scoped to the OPENING phase (NOT the all-phase sum,
      // which over-counts the attacker and falsely favoured the CS at Gettysburg — Q7 bug-hunt HIGH).
      var an=fldScenarioData('antietam'); if(!an) throw new Error('no antietam scenario data');
      var anUS=fldOOBSideOVR(an,'US');
      if(!anUS||!(anUS.n>=2 && anUS.men>0)) throw new Error('multi-phase force OVR failed (opening-phase path): '+JSON.stringify(anUS));
      var anB=fldMatchupBoard(an);
      if(!anB || anB.phased!==true) throw new Error('a multi-phase battle board must be flagged phased');
      // the opening-phase scoping must be STRICTLY less than the all-phase sum would be (proves we are not summing all phases)
      var anPhaseUnits=0; for(var pp=0;pp<an.phases.length;pp++){ var po=an.phases[pp].oob; if(po&&po.US) anPhaseUnits+=po.US.length; }
      if(!(anUS.n<anPhaseUnits || an.phases.length===1)) throw new Error('opening-phase force should be a SLICE, not the all-phase sum: n='+anUS.n+' vs allPhaseUnits='+anPhaseUnits);
      // the marquee multi-phase battles must keep their commander line (phase-0 leaders) and the "Opening Engagement" framing
      var anCmdr=_fldMatchupCommander(an,'CS');
      if(!anCmdr||!anCmdr.name) throw new Error('multi-phase commander line lost (should read phase-0 leaders)');
      var anHtml=fldMatchupHtml(an);
      if(anHtml.indexOf('Opening Engagement')<0) throw new Error('a multi-phase board must be labeled the Opening Engagement (anti-Lost-Cause framing)');
      // ANTI-LOST-CAUSE FRAMING GUARD: gettysburg (a multi-phase battle the larger Union army won) must NOT present
      // an un-caveated whole-battle verdict — its board is the OPENING (day 1) engagement, explicitly labeled.
      var gb=fldScenarioData('gettysburg');
      if(gb){ var gbB=fldMatchupBoard(gb); if(!gbB||gbB.phased!==true) throw new Error('gettysburg board must be phased (opening-engagement framing)');
        if(fldMatchupHtml(gb).indexOf('Opening Engagement')<0) throw new Error('gettysburg board must be labeled the Opening Engagement'); }
      // (4) MATCHUP BOARD: attacker US, both sides, fracUS in (0,1), edge has lead+word
      var b=fldMatchupBoard(br);
      if(!b||b.attacker!=='US') throw new Error('matchup attacker should be US for bullrun: '+(b&&b.attacker));
      if(!(b.fracUS>0 && b.fracUS<1)) throw new Error('fracUS out of (0,1): '+(b&&b.fracUS));
      if(!(b.edge && (b.edge.lead==='US'||b.edge.lead==='CS') && b.edge.word)) throw new Error('edge malformed: '+JSON.stringify(b&&b.edge));
      // (5) EDGE WORD: even at 0.5, a lead at 0.7
      if(fldMatchupEdgeWord(0.5).word!=='Evenly matched') throw new Error('0.5 should be Evenly matched');
      var e7=fldMatchupEdgeWord(0.72); if(!(e7.lead==='US' && e7.mag>0.2)) throw new Error('0.72 should be a US strong edge: '+JSON.stringify(e7));
      var e3=fldMatchupEdgeWord(0.28); if(e3.lead!=='CS') throw new Error('0.28 should lead CS');
      // (6) RENDER: non-empty + triple-encoded (FORCE OVR + Predicted edge + a grade word); graceful "" when no OOB
      var html=fldMatchupHtml(br);
      if(!html || html.indexOf('FORCE OVR')<0 || html.indexOf('Predicted edge')<0) throw new Error('matchup html missing the OVR/edge channels');
      if(html.indexOf(String(b.US.ovr))<0) throw new Error('matchup html missing the US force OVR number');
      if(fldMatchupHtml({})!=='' ) throw new Error('a scenario with no OOB should render "" (graceful)');
      if(fldMatchupHtml(null)!=='') throw new Error('null scenario should render "" (no crash)');
      // (7) byte-identity guard: fldMatchupBoard / fldOOBSideOVR must not mutate the scenario data (pure read)
      var snap=JSON.stringify(br.oob||br.phases); fldMatchupBoard(br); fldMatchupHtml(br);
      if(JSON.stringify(br.oob||br.phases)!==snap) throw new Error('matchup mutated the scenario OOB');
      return { dualTilt:{atk:ta,def:td}, brUSovr:us.ovr, brCSovr:cs.ovr, brUSmen:us.men, antietamN:anUS.n, fracUS:Math.round(b.fracUS*1000)/1000, edge:b.edge.lead+' '+b.edge.word, htmlLen:html.length }; });

    step('R-5 PROSOPOGRAPHY SCALE-OUT: one mean per token; LAZY materialization (sample<=6, never N rows); generated=Inferred + synth name + latent command; promotion surfaces command; team hook; Inferred hatched vs Verified solid; render triple-encoded; pure', function(){
      var need=['fldMenMeanOVR','fldMaterializePerson','fldBrigadeMuster','fldPromotePerson','fldPersonTeam','fldProvenanceStyle','fldMusterRollHtml','fldMusterHudLine'];
      for(var i=0;i<need.length;i++) if(typeof window[need[i]]!=='function') throw new Error('missing R-5 fn '+need[i]);
      // (1) ONE MEAN PER TOKEN: O(1) number, bounded [20,88], deterministic, veteran>green, never Legendary
      var vet=fldMenMeanOVR({id:'v',xp:3,arm:'inf'}), green=fldMenMeanOVR({id:'g',xp:0,arm:'inf'});
      if(!(vet>green)) throw new Error('veteran men-mean '+vet+' should exceed green '+green);
      if(fldMenMeanOVR({id:'v',xp:3,arm:'inf'})!==vet) throw new Error('men-mean not deterministic (RNG leak)');
      if(!(vet>=20 && vet<=88)) throw new Error('men-mean out of [20,88]: '+vet);
      if(fldMenMeanOVR({id:'cap',xp:20,arm:'art'})>=90) throw new Error('a brigade AVERAGE must never reach the Legendary ceiling');
      if(fldMenMeanOVR(null)!==64) throw new Error('null unit men-mean should be the 64 anchor');
      // (2) THE LAZY-MATERIALIZATION INVARIANT: a 100,000-man brigade still materializes a HARD-CAPPED sample
      //     (<=6), NEVER u.men rows. The token carries one recomputable mean; rows are built on demand only.
      var huge=fldBrigadeMuster({id:'huge',xp:2,men:100000,side:'CS'});
      if(!huge) throw new Error('muster null for a valid brigade');
      if(huge.sample.length>6) throw new Error('LAZY INVARIANT BREACHED: sample '+huge.sample.length+' > 6 (N-row build smell)');
      if(huge.represents!==100000) throw new Error('represents should record the true head-count: '+huge.represents);
      if(typeof huge.menMeanOVR!=='number') throw new Error('muster missing the one-per-token mean');
      if(fldBrigadeMuster({id:'h2',xp:2,men:5000},50).sample.length>6) throw new Error('explicit n must stay capped <=6');
      // (3) LAZY MATERIALIZE one row: generated private -> Inferred + generated + synth name + latent command seed
      var gp=fldMaterializePerson({pid:'gen_pvt_1',rank:'Private',branch:'inf',side:'US'},1862);
      if(!gp||gp.provenance!=='Inferred'||!gp.generated) throw new Error('generated private should be Inferred+generated');
      if(!gp.name||gp.name.length<3) throw new Error('generated person should get a synthesized name, got "'+(gp&&gp.name)+'"');
      if(fldMaterializePerson({pid:'gen_pvt_1',rank:'Private',branch:'inf'},1862).name!==gp.name) throw new Error('synth name not deterministic');
      if(!(gp.latentCommand>0 && gp.latentCommand<88)) throw new Error('latentCommand (the play-as seed) out of band: '+gp.latentCommand);
      if(typeof gp.ovr!=='number'||!gp.grade||!gp.grade.letter) throw new Error('materialized row missing ovr/grade');
      // an AUTHORED persona passes through Verified with its real name (no synth)
      var jp=fldMaterializePerson(D.personas.ld_jackson,1861);
      if(!jp||jp.provenance!=='Verified'||jp.generated) throw new Error('authored Jackson should materialize Verified, not generated');
      if(jp.name.indexOf('Jackson')<0) throw new Error('authored person should keep his real name, got '+jp.name);
      if(!(jp.ovr>gp.ovr)) throw new Error('Jackson OVR '+jp.ovr+' should exceed a generated private '+gp.ovr);
      // (4) LATENT-COMMAND PROMOTION (play-as-anyone): promotion surfaces the dormant command; PURE (original intact)
      var snapGp=JSON.stringify(gp);
      var promoted=fldPromotePerson(gp,'Captain');
      if(!(promoted.persona.command>gp.persona.command)) throw new Error('promotion should raise the latent command: '+promoted.persona.command+' vs '+gp.persona.command);
      if(!(promoted.ovr>=gp.ovr)) throw new Error('promotion should not lower OVR: '+promoted.ovr+' vs '+gp.ovr);
      if(promoted.officerTier!==true) throw new Error('a Captain should be officerTier');
      if(promoted.promotedFrom!=='Private') throw new Error('promotedFrom should record the prior rank');
      if(JSON.stringify(gp)!==snapGp) throw new Error('fldPromotePerson mutated the input (must be pure)');
      // (5) TEAM hook (journey mode): team{} surfaces army/corps; {side}-only -> side, null army
      var t1=fldPersonTeam({side:'CS',team:{army:'ANV',corps:'II Corps'}});
      if(!t1||t1.army!=='ANV'||t1.corps!=='II Corps'||t1.side!=='CS') throw new Error('team hook lost army/corps: '+JSON.stringify(t1));
      var t2=fldPersonTeam({side:'US'});
      if(!t2||t2.side!=='US'||t2.army!==null) throw new Error('side-only team should have null army: '+JSON.stringify(t2));
      // (6) PROVENANCE VISUAL DISTINCTION (§10): Inferred = HATCHED (repeating-linear-gradient), Verified = SOLID;
      //     meaning rides the PATTERN + glyph + word, NOT colour alone (CVD-safe). The two fills must differ.
      var pv=fldProvenanceStyle('Verified','#4a6b3a'), pi=fldProvenanceStyle('Inferred','#4a6b3a'), pd=fldProvenanceStyle('Disputed','#4a6b3a');
      if(pi.fill.indexOf('repeating-linear-gradient')<0) throw new Error('Inferred must render a hatch (repeating-linear-gradient)');
      if(pv.fill.indexOf('repeating-linear-gradient')>=0) throw new Error('Verified must render a SOLID fill (no hatch)');
      if(pv.fill===pi.fill) throw new Error('Verified and Inferred fills must be visually distinct');
      if(!pv.glyph||!pv.label||!pi.glyph||!pi.label||pv.glyph===pi.glyph) throw new Error('each provenance needs a distinct glyph + label (CVD-safe, not colour-alone)');
      if(pd.fill.indexOf('dashed')<0) throw new Error('Disputed should render a dashed outline');
      // (7) RENDER: the full muster roll + the compact HUD line — triple-encoded (number + grade letter + word),
      //     the hatch present, graceful "" for null
      var u={id:'br_test',arm:'inf',xp:3,men:1800,side:'US',commander:'Capt. Smith'};
      var html=fldMusterRollHtml(u), m=fldBrigadeMuster(u,3);
      if(!html||html.indexOf('Muster Roll')<0||html.indexOf('MEN OVR')<0) throw new Error('muster roll missing its header/MEN OVR channel');
      if(html.indexOf(String(m.menMeanOVR))<0) throw new Error('muster roll missing the men-mean OVR number');
      if(html.indexOf('repeating-linear-gradient')<0) throw new Error('muster roll should show the Inferred hatch');
      if(html.indexOf(m.grade.word)<0) throw new Error('muster roll missing the grade WORD (triple-encode)');
      var hud=fldMusterHudLine(u);
      if(!hud||hud.indexOf('MEN OVR')<0||hud.indexOf(String(m.menMeanOVR))<0) throw new Error('compact HUD line missing MEN OVR / number');
      if(fldMusterRollHtml(null)!=='') throw new Error('null unit -> "" (no crash)');
      if(fldMusterHudLine(null)!=='') throw new Error('null HUD line -> "" (no crash)');
      // (8) PURITY: the materialization path must not mutate the unit (pure read; byte-identical guarantee)
      var snapU=JSON.stringify(u); fldMenMeanOVR(u); fldBrigadeMuster(u); fldMusterRollHtml(u);
      if(JSON.stringify(u)!==snapU) throw new Error('R-5 materialization mutated the unit');
      // (9) BUG-HUNT HARDENING (all LOW, latent): a materialized AUTHORED person's persona + sources are COPIES,
      //     never the GAME_DATA reference (so a future career write can't corrupt canonical ratings); and
      //     fldPromotePerson guards an unknown rank (no garbage 64-anchor lift) + honors its no-mutate contract.
      var srcCmd=D.personas.ld_jackson.persona.command, srcSources=D.personas.ld_jackson.sources;
      var jp2=fldMaterializePerson(D.personas.ld_jackson,1861); jp2.persona.command=1;   // mutate the materialized copy
      if(D.personas.ld_jackson.persona.command!==srcCmd) throw new Error('materialized persona ALIASES GAME_DATA (mutation leaked to the source-of-truth)');
      if(jp2.sources===srcSources) throw new Error('materialized sources aliases the GAME_DATA array (should be a copy)');
      var noop=fldPromotePerson(gp,'NotARealRank');   // unknown rank -> a clean no-op clone, not a +64-anchor lift
      if(noop.persona.command!==gp.persona.command || noop.ovr!==gp.ovr) throw new Error('unknown-rank promotion changed stats (must be a no-op)');
      if(noop===gp) throw new Error('promotion must return a NEW object even on a no-op (purity contract)');
      var mal=fldPromotePerson({rank:'Private'},'Captain');   // persona-less person -> a clone, not the input ref
      if(mal===null) throw new Error('a persona-less person should clone, not crash');
      if(fldPromotePerson(null,'Captain')!==null) throw new Error('null person promotion should return null (no crash)');
      return { vetMean:vet, greenMean:green, hugeSample:huge.sample.length, represents:huge.represents, genName:gp.name, latentCmd:gp.latentCommand, promotedCmd:promoted.persona.command, jacksonOVR:jp.ovr, htmlLen:html.length, aliasGuarded:true }; });

    step('R-6 CITATION-PROVENANCE SWEEP (D103): every Verified badgeDef has >=2 sources; beloved held Inferred; grand_charge upgraded; catalog-wide gate clean', function(){
      var defs = D && D.badgeDefs ? D.badgeDefs : null;
      if(!defs || !defs.length) throw new Error('badgeDefs missing');
      if(defs.length < 26) throw new Error('badgeDefs count dropped below 26 ('+defs.length+') — a silent data deletion?');
      var bad=[];
      for(var i=0;i<defs.length;i++){ var b=defs[i]; if(b.prov==='Verified' && (!Array.isArray(b.sources)||b.sources.length<2)) bad.push(b.key+'('+((b.sources||[]).length)+')'); }
      if(bad.length) throw new Error('Verified badgeDef(s) with <2 sources: '+bad.join(', '));
      var by={}; for(var j=0;j<defs.length;j++) by[defs[j].key]=defs[j];
      if(!by.beloved || by.beloved.prov!=='Inferred') throw new Error('beloved should be held Inferred (the Lost-Cause Freeman cite was dropped)');
      if(!by.grand_charge || by.grand_charge.prov!=='Verified' || by.grand_charge.sources.length<2) throw new Error('grand_charge should be Verified with >=2 sources');
      if(!by.the_slows || by.the_slows.prov!=='Verified' || by.the_slows.sources.length<2) throw new Error('the_slows (a negative badge on a real man) must be firmly Verified with >=2 sources');
      // catalog-wide invariant (mirrors build gate 4e): no Verified record ANYWHERE in GAME_DATA carries <2 sources
      var nrm=function(v){ return (typeof v==='string')?v.trim().toLowerCase():''; };
      var off=0; (function walk(n){ if(Array.isArray(n)){ for(var a=0;a<n.length;a++) walk(n[a]); return; } if(n&&typeof n==='object'){ if(nrm(n.prov)==='verified'||nrm(n.provenance)==='verified'){ var sc=Array.isArray(n.sources)?n.sources.length:(Array.isArray(n.src)?n.src.length:0); if(sc<2) off++; } for(var k in n) if(n.hasOwnProperty(k)) walk(n[k]); } })(typeof GAME_DATA!=='undefined'?GAME_DATA:{});
      if(off>0) throw new Error(off+' Verified-with-<2-source record(s) remain in GAME_DATA (build gate 4e should have failed)');
      var verified=0; for(var m=0;m<defs.length;m++) if(defs[m].prov==='Verified') verified++;
      return { badgeDefs:defs.length, verifiedBadges:verified, belovedProv:by.beloved.prov, grandChargeSrc:by.grand_charge.sources.length, catalogVerifiedClean:true }; });

    step('R-6 ROSTER-BADGE ASSIGNMENT (D104): rosterBadges resolves to real defs; the seam STAMPS scenario units; byte-identical when off; anti-Lost-Cause balance (both sides carry +/-); chips triple-encoded', function(){
      if(typeof fldScenarioRosterBadges!=='function'||typeof fldRatingBadgesHtml!=='function') throw new Error('R-6 fns missing (fldScenarioRosterBadges/fldRatingBadgesHtml)');
      var RB = D && D.rosterBadges; if(!RB) throw new Error('rosterBadges missing from ratings data');
      var scns = Object.keys(RB);
      if(scns.length<9) throw new Error('expected all 9 shipped battles in rosterBadges, got '+scns.length);
      // (1) every assigned badge key resolves to a real badgeDef AND every assigned UNIT ID resolves to a real
      // token in THAT scenario's OOB (across all 9 battles — not just bullrun1; D104 bug-hunt MED: an OOB rename
      // could otherwise rot 39 of the 44 assignments to silent dead no-ops with no probe failing). Tally polarity.
      function _scnUnitIds(scn){ var data=(typeof fldScenarioData==='function')?fldScenarioData(scn):null; var ids={};
        function add(a){ if(a&&a.length) for(var k=0;k<a.length;k++){ if(a[k]&&a[k].id) ids[a[k].id]=1; } }
        if(data){ if(data.phases&&data.phases.length){ for(var p=0;p<data.phases.length;p++){ var ph=data.phases[p]; if(ph.oob){ add(ph.oob.US); add(ph.oob.CS); } add(ph.reinforcements); } }
          else { if(data.oob){ add(data.oob.US); add(data.oob.CS); } add(data.reinforcements); } }
        return ids; }
      var usPos=0,usNeg=0,csPos=0,csNeg=0,total=0,orphans=[];
      for(var si=0;si<scns.length;si++){ var s=RB[scns[si]], scnIds=_scnUnitIds(scns[si]); for(var uid in s){ if(!s.hasOwnProperty(uid)) continue;
        if(!scnIds[uid]) orphans.push(scns[si]+'/'+uid);   // <- the rot guard: the assigned unit no longer exists in the scenario
        var side = uid.indexOf('us_')===0?'US':(uid.indexOf('cs_')===0?'CS':'?');
        var arr=s[uid]; for(var bi=0;bi<arr.length;bi++){ total++; var def=fldBadgeDef(arr[bi]);
          if(!def) throw new Error('rosterBadges['+scns[si]+']['+uid+'] -> unknown badge key '+arr[bi]);
          var neg=def.polarity==='neg'; if(side==='US'){ neg?usNeg++:usPos++; } else if(side==='CS'){ neg?csNeg++:csPos++; } } } }
      if(orphans.length) throw new Error('rosterBadges assigned to unit id(s) absent from their scenario OOB (dead no-ops): '+orphans.join(', '));
      if(total<30) throw new Error('expected a substantial roster sweep, got '+total+' assignments');
      // (2) ANTI-LOST-CAUSE balance FLOORS (D104 bug-hunt LOW: lock the documented tally so a regression trips the
      // gate, not just nonzero). Both sides carry virtues AND flaws; the Union's flaws are named as plainly as the CS's.
      if(!(usNeg>=8 && csNeg>=4)) throw new Error('anti-Lost-Cause floor breach: US flaws '+usNeg+' (>=8) / CS flaws '+csNeg+' (>=4)');
      if(!(usPos>=6 && csPos>=8)) throw new Error('virtue floor breach: US '+usPos+' (>=6) / CS '+csPos+' (>=8)');
      // (3) fldScenarioRosterBadges resolves a marquee assignment + returns a FRESH array (never aliases canonical data)
      var jb=fldScenarioRosterBadges('bullrun1','cs_jackson');
      if(!jb||jb.indexOf('stonewall')<0) throw new Error('Jackson at Bull Run should carry stonewall');
      jb.push('TAINT'); if(fldScenarioRosterBadges('bullrun1','cs_jackson').indexOf('TAINT')>=0) throw new Error('fldScenarioRosterBadges must return a FRESH array (it aliased canonical rosterBadges)');
      if(fldScenarioRosterBadges('bullrun1','nonexistent_unit')!==null) throw new Error('an unassigned unit should resolve null');
      if(fldScenarioRosterBadges(null,null)!==null) throw new Error('null args -> null (no crash)');
      // (4) THE SEAM STAMPS: launching a scenario stamps the assigned badges onto the live units; unassigned -> null
      var saveB=(typeof __FIELD!=='undefined')?__FIELD.badges:undefined;
      fldLaunchSandbox({renderer:'none',autoBoth:true,seed:1,scenario:'bullrun1'});
      function _find(id){ for(var i=0;i<__FIELD.units.length;i++) if(__FIELD.units[i].id===id) return __FIELD.units[i]; return null; }
      var evans=_find('cs_evans'), plain=_find('us_porter');   // both in the INITIAL OOB
      if(!evans||!evans.badges||evans.badges.indexOf('stonewall')<0) throw new Error('the seam did not stamp stonewall onto cs_evans (initial OOB)');
      if(plain&&plain.badges) throw new Error('an unassigned unit (us_porter) must carry null badges (byte-identical)');
      // REINFORCEMENT stamping: step until cs_jackson (a Bull Run reinforcement) arrives — it must carry stonewall too
      __FIELD.badges=true; var jack=null; for(var st=0; st<6000 && !jack; st++){ fldStepN(1); jack=_find('cs_jackson'); }
      if(!jack) throw new Error('cs_jackson reinforcement never arrived (cannot verify reinforcement stamping)');
      if(!jack.badges||jack.badges.indexOf('stonewall')<0) throw new Error('the seam did not stamp stonewall onto the cs_jackson REINFORCEMENT (fldScenarioTick path)');
      // (5) BYTE-IDENTICAL WHEN OFF: with the engine off, a stamped unit's badge factor is identity 1
      __FIELD.badges=false;
      if(fldBadgeFactor(evans,'rally')!==1) throw new Error('badges OFF: a stamped unit must read identity 1 (byte-identical)');
      __FIELD.badges=true;
      // D481 R-7 chain: stonewall is now SITUATIONAL (defend_objective -> the defend posture), so this
      // live-unit sample is pinned to its documented situation — evans holds for the read, order restored.
      // Pre-D481 this line sampled whatever order the AI had issued (always-on made that safe; R-7 doesn't).
      var _evOrder=evans.order; evans.order={type:'hold',tx:evans.x,tz:evans.z};
      if(!(fldBadgeFactor(evans,'rally')>1)) throw new Error('badges ON: stonewall should lift cs_evans rally (holding — the R-7 defend posture)');
      // (6) the_slows on the antietam bridge assault (the marquee Union flaw; data has NO McClellan army token, D92)
      var slows=fldScenarioRosterBadges('antietam','us_sturgis');
      if(!slows||slows.indexOf('the_slows')<0) throw new Error('the_slows should sit on antietam us_sturgis');
      // (7) CHIPS: fldRatingBadgesHtml names the badge + carries a header; "" for a no-badge / null unit (byte-identical)
      var html=fldRatingBadgesHtml(evans);
      if(!html||html.indexOf('Stonewall')<0) throw new Error('badge chip should name the badge label');
      if(html.indexOf('Traits')<0) throw new Error('badge chip block missing its header');
      if(fldRatingBadgesHtml({badges:null})!=='') throw new Error('a no-badge unit -> "" (byte-identical)');
      if(fldRatingBadgesHtml(null)!=='') throw new Error('null unit -> "" (no crash)');
      var jr=Math.round(fldBadgeFactor(evans,'rally')*1000)/1000;
      evans.order=_evOrder;   // D481: restore the AI's live order after the pinned-situation reads
      if(typeof __FIELD!=='undefined') __FIELD.badges=saveB;
      return { battles:scns.length, assignments:total, usPos:usPos, usNeg:usNeg, csPos:csPos, csNeg:csNeg, jacksonRally:jr }; });

    step('T29 (D357): Muster Roll inspect-expand — HUD button wired, aria-correct, content-faithful, keyboard focus survives re-render, pure display', function(){
      if(typeof fldMusterRollHudToggle!=='function') return { skipped:'pre-T29' };
      fldLaunchSandbox({renderer:'2d', seed:7});   // '2d' builds the real DOM HUD ('none' is headless and skips it)
      var hud=document.getElementById('fldHud'); if(!hud) throw new Error('no #fldHud after launch');
      var ps=fldPlayerSide(), u=null;
      for(var i=0;i<__FIELD.units.length;i++){ var c=__FIELD.units[i]; if(c.side===ps&&c.alive&&!c.ai){u=c;break;} }
      if(!u) throw new Error('no selectable (non-AI) player unit in the sandbox');
      __FIELD.sel=[u.id]; __FIELD._mrOpen=false; fldRenderHud();
      var btn=document.getElementById('fldMrBtn');
      if(!btn) throw new Error('Muster Roll toggle button missing from the selected-unit HUD');
      if(btn.tagName!=='BUTTON') throw new Error('toggle must be a native <button> (keyboard activation for free)');
      if(btn.getAttribute('aria-expanded')!=='false') throw new Error('collapsed state must be aria-expanded=false');
      if(btn.getAttribute('aria-controls')!=='fldMrPanel') throw new Error('aria-controls must name the panel');
      var p0=document.getElementById('fldMrPanel');
      if(!p0||!p0.hidden) throw new Error('panel must exist in the DOM and be hidden when collapsed (4.1.2: aria-controls must never dangle)');
      btn.focus(); btn.click();
      var btn2=document.getElementById('fldMrBtn');
      if(!btn2||btn2.getAttribute('aria-expanded')!=='true') throw new Error('open state must be aria-expanded=true');
      if(document.activeElement!==btn2) throw new Error('keyboard focus must survive the toggle re-render (the S22 lesson)');
      var panel=document.getElementById('fldMrPanel');
      if(!panel||panel.hidden) throw new Error('panel missing/hidden when expanded');
      if(panel.getAttribute('role')!=='region'||!panel.getAttribute('aria-label')) throw new Error('panel must be a named region');
      var norm=document.createElement('div'); norm.innerHTML=fldMusterRollHtml(u);
      if(panel.innerHTML!==norm.innerHTML) throw new Error('panel content must equal fldMusterRollHtml(u) (normalized)');
      fldRenderHud();   // an unrelated event re-render: panel stays open, focus stays on the button
      var pr=document.getElementById('fldMrPanel');
      if(!pr||pr.hidden) throw new Error('panel must survive an event re-render');
      if(document.activeElement!==document.getElementById('fldMrBtn')) throw new Error('focus must survive an event re-render');
      document.getElementById('fldMrBtn').click();
      var pc=document.getElementById('fldMrPanel');
      if(!pc||!pc.hidden) throw new Error('panel must return to hidden on the second toggle');
      if(document.getElementById('fldMrBtn').getAttribute('aria-expanded')!=='false') throw new Error('closed state must return aria-expanded=false');
      var sim=JSON.stringify({men:u.men,morale:u.morale,ammo:u.ammo,fatigue:u.fatigue});
      fldMusterRollHudToggle(u);
      if(JSON.stringify({men:u.men,morale:u.morale,ammo:u.ammo,fatigue:u.fatigue})!==sim) throw new Error('toggle render mutated sim state');
      fldExit(true);
      return { wired:true, aria:true, faithful:true, focusStable:true }; });

    step('PURITY: rating fns do not mutate G or __FIELD (R-0 is inert / byte-identical)', function(){
      var beforeMode=(typeof G!=='undefined')?G.mode:null;
      var fu=(typeof __FIELD!=='undefined' && __FIELD.units)?__FIELD.units.length:null;
      fldPersonaOVR(neutralPersona()); fldDualOVR(D.personas.ld_jackson.persona); fldUnitRatingOVR({xp:2,weapon:'rifled'}); fldDerivePerson({rank:'Sgt',branch:'cav',pid:'z'},1863);
      if(typeof G!=='undefined' && G.mode!==beforeMode) throw new Error('rating fns mutated G.mode');
      if(typeof __FIELD!=='undefined' && __FIELD.units && __FIELD.units.length!==fu) throw new Error('rating fns mutated __FIELD.units');
      return { gMode:beforeMode, fieldUnits:fu }; });

    step('D478 one rarity language: badge-chip rung glyphs tint from cwRungTierInfo while glyph+sign+label redundancy holds', function(){
      if(typeof cwRungTierInfo!=='function') throw new Error('cwRungTierInfo missing (the D478 canonical helper)');
      var RB=D && D.rosterBadges && D.rosterBadges.bullrun1;
      if(!RB) throw new Error('rosterBadges.bullrun1 missing');
      var uid=null; for(var k in RB){ if(RB.hasOwnProperty(k) && RB[k] && RB[k].length){ uid=k; break; } }
      if(!uid) throw new Error('no badged bullrun1 unit');
      var html=fldRatingBadgesHtml({ badges:RB[uid] });
      var div=document.createElement('div'); div.innerHTML=html;
      var chips=div.querySelectorAll('[role="listitem"]');
      if(!chips.length) throw new Error('no chips rendered');
      var tinted=0;
      for(var i=0;i<chips.length;i++){
        var t=chips[i].textContent||'';
        if(!/[★◆⬥•]/.test(t)) throw new Error('chip missing its rung glyph');
        if(!/[+−]/.test(t)) throw new Error('chip missing its polarity sign');
        if(t.replace(/[★◆⬥•+−\s]/g,'').length<2) throw new Error('chip missing its word label');
        var g=chips[i].querySelector('span[aria-hidden]');
        if(g && /color:/.test(g.getAttribute('style')||'')) tinted++;
      }
      var def=fldBadgeDef(RB[uid][0]);
      var want=cwRungTierInfo(def.rung).color.toLowerCase();
      if(tinted<1) throw new Error('no chip glyph carries the canonical tier tint');
      if(html.toLowerCase().indexOf(want)<0) throw new Error('chip html does not use the canonical tier colour '+want);
      return { chips:chips.length, tinted:tinted, tier:want }; });

    step('D480 badge gallery: Madden-style cards render ONLY from resolved badgeDefs (unknown ids refused fail-closed) with hover/tap provenance present and keyboard focus', function(){
      if(typeof fldBadgeGalleryHtml!=='function'||typeof fldBadgeCardHtml!=='function') throw new Error('gallery helpers missing');
      var u={ badges:['marksman','foot_cavalry','__ghost_badge__'] };
      var div=document.createElement('div'); div.innerHTML=fldBadgeGalleryHtml(u);
      var cards=div.querySelectorAll('[data-badge-card]');
      if(cards.length!==2) throw new Error('gallery rendered a badge id absent from badgeDefs: expected 2 cards, got '+cards.length);
      if((div.textContent||'').indexOf('__ghost_badge__')>=0) throw new Error('gallery rendered a badge id absent from badgeDefs: ghost key leaked into text');
      for(var i=0;i<cards.length;i++){
        var c=cards[i];
        if(c.getAttribute('tabindex')!=='0') throw new Error('card not keyboard-focusable');
        var title=c.getAttribute('title')||'', aria=c.getAttribute('aria-label')||'';
        if(!title||!aria) throw new Error('card missing hover title / SR aria provenance');
        if(!/Verified|Inferred|Disputed/.test(aria)) throw new Error('card aria lacks a provenance word: '+aria);
        if(!/Verified|Inferred|Disputed/.test(c.textContent||'')) throw new Error('card visible text lacks the tap provenance line');
      }
      var fcCard=div.querySelector('[data-badge-card="foot_cavalry"]');
      if(!fcCard || (fcCard.getAttribute('aria-label')||'').indexOf('Robertson 1997')<0) throw new Error('foot_cavalry card provenance lacks its named source');
      var xfTint=cwRungTierInfo('xfactor').color.toLowerCase();
      if((fcCard.innerHTML||'').toLowerCase().indexOf(xfTint)<0) throw new Error('the X-Factor card glyph does not carry the canonical tier tint');
      var cat=document.createElement('div'); cat.innerHTML=fldBadgeGalleryHtml(null);
      var catCards=cat.querySelectorAll('[data-badge-card]');
      if(catCards.length!==D.badgeDefs.length) throw new Error('catalog gallery should render all '+D.badgeDefs.length+' defs, got '+catCards.length);
      if(!/Stars/.test(cat.textContent)||!/Superstars/.test(cat.textContent)||!/X-Factors/.test(cat.textContent)) throw new Error('catalog missing its rung sections');
      return { unitCards:cards.length, catalog:catCards.length };
    });

    step('D480 X-Factor showcase: LIVE activation state mirrors runtime truth (a fired trigger flips the showcase both ways); the render path never writes', function(){
      if(typeof fldXfShowcaseHtml!=='function') throw new Error('fldXfShowcaseHtml missing');
      var savedU=(typeof __FIELD!=='undefined')?__FIELD.units:undefined, savedB=(typeof __FIELD!=='undefined')?__FIELD.badges:undefined, savedT=(typeof __FIELD!=='undefined')?__FIELD.realismTier:undefined;
      try {
        fldLaunchSandbox({renderer:'none', autoBoth:true, seed:7});
        __FIELD.realismTier='balanced'; __FIELD.badges=true;
        var u={ id:'XFS', side:'CS', name:'Showcase Bde', arm:'inf', alive:true, state:'steady', x:800, z:200, morale:78, maxMor:78, ammo:100, cmdBonus:0, order:{type:'move',tx:800,tz:1400}, badges:['foot_cavalry'] };
        __FIELD.units=[u];
        var before=fldXfShowcaseHtml();
        var dv=document.createElement('div'); dv.innerHTML=before;
        var row=dv.querySelector('[data-xf-row="foot_cavalry"]');
        if(!row) throw new Error('showcase missing the armed X-Factor row');
        if(row.getAttribute('data-xf-active')!=='0'||/IN THE ZONE/.test(row.textContent)) throw new Error('showcase shows active with no trigger fired');
        var snap=JSON.stringify(u);
        fldXfShowcaseHtml();
        if(JSON.stringify(u)!==snap) throw new Error('the showcase render WROTE unit state');
        fldXFactorStep(0.05);   // the march_vigor trigger is live (the unit is moving)
        if(u._xfOn!=='foot_cavalry') throw new Error('fixture trigger did not fire: _xfOn='+u._xfOn);
        var dv2=document.createElement('div'); dv2.innerHTML=fldXfShowcaseHtml();
        var row2=dv2.querySelector('[data-xf-row="foot_cavalry"]');
        if(!row2||row2.getAttribute('data-xf-active')!=='1'||!/IN THE ZONE/.test(row2.textContent)) throw new Error('a fired trigger did not flip the showcase active');
        u.order=null;   // leave the zone -> the latch re-arms
        fldXFactorStep(0.05);
        var dv3=document.createElement('div'); dv3.innerHTML=fldXfShowcaseHtml();
        var row3=dv3.querySelector('[data-xf-row="foot_cavalry"]');
        if(!row3||row3.getAttribute('data-xf-active')!=='0') throw new Error('leaving the zone did not flip the showcase back to armed');
        if((row2.getAttribute('aria-label')||'').indexOf('in the zone')<0) throw new Error('showcase row aria does not speak the live state');
        return { armed:true, flipped:true, rearmed:true };
      } finally { if(typeof __FIELD!=='undefined'){ __FIELD.units=savedU; __FIELD.badges=savedB; __FIELD.realismTier=savedT; } }
    });

    step('D480 HUD disclosure: gallery + showcase ride native aria-correct T29-idiom buttons inside the badge read-out; the general pool carries the dev-trait chip', function(){
      var RB=D.rosterBadges.bullrun1, uid=null;
      for(var k in RB){ if(RB.hasOwnProperty(k)&&RB[k]&&RB[k].length){ uid=k; break; } }
      var html=fldRatingBadgesHtml({ badges:RB[uid] });
      var div=document.createElement('div'); div.innerHTML=html;
      var bg=div.querySelector('#fldBgBtn'), xf=div.querySelector('#fldXfBtn');
      if(!bg||!xf) throw new Error('disclosure buttons missing from the badge read-out');
      if(bg.tagName!=='BUTTON'||xf.tagName!=='BUTTON') throw new Error('disclosure controls must be native buttons');
      if(bg.getAttribute('aria-expanded')==null||bg.getAttribute('aria-controls')!=='fldBgPanel') throw new Error('gallery button aria wiring wrong');
      if(xf.getAttribute('aria-expanded')==null||xf.getAttribute('aria-controls')!=='fldXfPanel') throw new Error('showcase button aria wiring wrong');
      if(!div.querySelector('#fldBgPanel')||!div.querySelector('#fldXfPanel')) throw new Error('panels must be present in the DOM (hidden when closed)');
      if(typeof _cmdDevChipHTML!=='function') throw new Error('_cmdDevChipHTML missing');
      var cfg=D.devTraits, gid=null;
      for(var a in cfg.assign){ if(cfg.assign.hasOwnProperty(a)){ gid=a; break; } }
      if(!gid) throw new Error('no devTraits assignment to test');
      var gens=(typeof gameData==='function')?gameData('generals'):null;
      var gen=null, sides=['US','CS'];
      for(var s=0;s<sides.length&&!gen;s++){ var list=gens&&gens.sides&&gens.sides[sides[s]]&&gens.sides[sides[s]].generals; if(list) for(var gi=0;gi<list.length;gi++) if(list[gi].id===gid){ gen=list[gi]; break; } }
      if(!gen) throw new Error('assigned general '+gid+' not found in generals data');
      var chipHtml=_cmdDevChipHTML({ side:'US', president:{ command:{ reputation:{} } } }, gen);
      if(!chipHtml) throw new Error('dev-trait chip empty for an assigned general');
      var cd=document.createElement('div'); cd.innerHTML=chipHtml;
      var chip=cd.querySelector('[data-dev-chip]');
      if(!chip) throw new Error('dev-trait chip missing its data hook');
      if(chip.getAttribute('tabindex')!=='0'||!(chip.getAttribute('aria-label')||'').length) throw new Error('dev-trait chip not keyboard/SR operable');
      if(!/Verified|Inferred|Disputed/.test(chip.getAttribute('aria-label'))) throw new Error('dev-trait chip aria lacks provenance');
      var un={ badges:[] };
      if(fldBadgeGalleryHtml(un)!=='') throw new Error('an unbadged unit must render no gallery');
      return { buttons:2, devChipFor:gid };
    });

    step('D480 zero sim writes: the whole slice-3 render path (chips, gallery, catalog, showcase, disclosure) leaves the unit, __FIELD, and G byte-identical', function(){
      var savedU=(typeof __FIELD!=='undefined')?__FIELD.units:undefined, savedB=(typeof __FIELD!=='undefined')?__FIELD.badges:undefined;
      try {
        fldLaunchSandbox({renderer:'none', autoBoth:true, seed:9});
        __FIELD.badges=true;
        var u={ id:'PURE', side:'US', name:'Purity Bde', arm:'inf', alive:true, state:'steady', x:400, z:300, morale:60, maxMor:78, ammo:80, cmdBonus:0.2, order:{type:'move',tx:900,tz:900}, badges:['marksman','foot_cavalry'] };
        __FIELD.units=[u];
        fldXFactorStep(0.05);   // give the surge fields real values so the render reads live state
        var uSnap=JSON.stringify(u);
        var gMode=(typeof G!=='undefined')?G.mode:null;
        var fLen=__FIELD.units.length, fBadges=__FIELD.badges;
        fldRatingBadgesHtml(u); fldBadgeGalleryHtml(u); fldBadgeGalleryHtml(null); fldXfShowcaseHtml();
        if(typeof fldBadgeDeskHudHtml==='function') fldBadgeDeskHudHtml(u);
        if(JSON.stringify(u)!==uSnap) throw new Error('slice-3 render path mutated the unit');
        if(__FIELD.units.length!==fLen||__FIELD.badges!==fBadges) throw new Error('slice-3 render path mutated __FIELD');
        if(typeof G!=='undefined'&&G.mode!==gMode) throw new Error('slice-3 render path mutated G.mode');
        return { pure:true };
      } finally { if(typeof __FIELD!=='undefined'){ __FIELD.units=savedU; __FIELD.badges=savedB; } }
    });

    step('D481 R-7 SITUATIONAL GATING: every gated static trigger binds to its engine-observable situation BOTH ways; absent live state keeps the historical always-on; the gated stack still clamps at the T14 cap', function(){
      var savedB=__FIELD.badges, savedT=__FIELD.realismTier, savedTime=__FIELD.t, savedTerr=__FIELD.terrain;
      try {
        __FIELD.badges=true; __FIELD.realismTier='balanced';
        var cap=fldRatingRealismCap('balanced','badgeLever');
        // stonewall (defend_objective): the defend posture -> active; the committed attack -> inert (the D104 cs_colston_div lesson as law)
        if(!(fldBadgeFactor({badges:['stonewall'],order:{type:'hold',tx:0,tz:0}},'rally')>1)) throw new Error('stonewall must steady a HOLDING unit');
        if(fldBadgeFactor({badges:['stonewall'],order:{type:'charge',tx:0,tz:0}},'rally')!==1) throw new Error('stonewall must be INERT on a charging unit (R-7)');
        // green_levies (first_fire): unbloodied -> damper; blooded -> settles
        if(!(fldBadgeFactor({badges:['green_levies'],men:1000,maxMen:1000},'rally')<1)) throw new Error('green_levies must damp an unbloodied unit');
        if(fldBadgeFactor({badges:['green_levies'],men:800,maxMen:1000},'rally')!==1) throw new Error('green_levies must settle once blooded (R-7)');
        // THE ABSENT-STATE LAW: no live men/order/clock -> the historical always-on (pre-R-7 baselines unchanged)
        if(!(fldBadgeFactor({badges:['green_levies']},'rally')<1)) throw new Error('absent live state must keep the historical always-on (green_levies)');
        if(!(fldBadgeFactor({badges:['the_slows']},'speed')<1)) throw new Error('absent live state must keep the historical always-on (the_slows)');
        // powder_shy (surprised): shaky in the opening minutes; steadies after
        __FIELD.t=10;  if(!(fldBadgeFactor({badges:['powder_shy']},'rally')<1)) throw new Error('powder_shy must damp in the opening minutes');
        __FIELD.t=900; if(fldBadgeFactor({badges:['powder_shy']},'rally')!==1) throw new Error('powder_shy must steady after the opening (R-7)');
        __FIELD.t=savedTime;
        // piecemeal (his_attack) + the_slows (his_offensive): bite on the committed advance, inert holding
        if(!(fldBadgeFactor({badges:['piecemeal'],order:{type:'move',tx:0,tz:0}},'rally')<1)) throw new Error('piecemeal must drag the committed advance');
        if(fldBadgeFactor({badges:['piecemeal'],order:{type:'hold',tx:0,tz:0}},'rally')!==1) throw new Error('piecemeal must be inert on a holding unit (R-7)');
        if(!(fldBadgeFactor({badges:['the_slows'],order:{type:'move',tx:0,tz:0}},'speed')<1)) throw new Error('the_slows must drag the committed offensive');
        if(fldBadgeFactor({badges:['the_slows'],order:{type:'hold',tx:0,tz:0}},'speed')!==1) throw new Error('the_slows must be inert on a holding unit (R-7)');
        // rigid_plan (attack_fortified): the assault ONTO fortified ground (fort circle OR wall reach) -> damper; open ground -> inert
        __FIELD.terrain=Object.assign({}, savedTerr||{}, { walls:[{x1:500,z1:0,x2:500,z2:400}] });
        if(!(fldBadgeFactor({badges:['rigid_plan'],order:{type:'charge',tx:500,tz:200}},'fire')<1)) throw new Error('rigid_plan must dampen the assault on fortified ground');
        if(fldBadgeFactor({badges:['rigid_plan'],order:{type:'charge',tx:2400,tz:2400}},'fire')!==1) throw new Error('rigid_plan must be inert on open ground (R-7)');
        __FIELD.terrain=savedTerr;
        // THE GATED STACK STILL CLAMPS: a holding unit stacking gated + always rally positives
        // (.08+.06+.05+.06=.25) must clamp to EXACTLY 1+cap — gated triggers get no cap exemption.
        var gs=fldBadgeFactor({badges:['stonewall','disciplined','blooded','beloved'],order:{type:'hold',tx:0,tz:0}},'rally');
        if(Math.abs(gs-(1+cap))>1e-9) throw new Error('the gated stack must clamp to exactly 1+cap ('+(1+cap)+'), got '+gs);
        return { cap:cap, gatedStack:Math.round(gs*1000)/1000 };
      } finally { __FIELD.badges=savedB; __FIELD.realismTier=savedT; __FIELD.t=savedTime; __FIELD.terrain=savedTerr; }
    });

    step('D481 COVERAGE FLOOR: every registered scenario carries a rosterBadges entry (the slice-4 eastern batch; the pinned western/trans-Mississippi remainder lands in slice 5)', function(){
      // D481 chain: slice 4 covered the 10 eastern scenarios with the western remainder pinned here.
      // D482 chain: slice 5 (the western/trans-Mississippi batch) EMPTIED the list — the floor is now
      // the clean full registry. A battle shipped after this sweep must add its roster row (or join a
      // documented pending list) in the same commit — this tooth is the coverage law, and it is
      // EXPECTED to move with the registry.
      var PENDING=[];
      var reg=(typeof fldScenarioRegistry==='function')?fldScenarioRegistry():{};
      var ids=Object.keys(reg); if(ids.length<29) throw new Error('registry readback too small: '+ids.length);
      var RB=D&&D.rosterBadges; if(!RB) throw new Error('rosterBadges missing');
      var missing=[], stray=[];
      for(var i=0;i<ids.length;i++){ var id=ids[i];
        if(RB[id]){ if(PENDING.indexOf(id)>=0) stray.push(id); continue; }
        if(PENDING.indexOf(id)<0) missing.push(id); }
      if(missing.length) throw new Error('registered scenario(s) missing their rosterBadges row (coverage floor): '+missing.join(', '));
      if(stray.length) throw new Error('scenario(s) covered but still on the pending list (stale pin — empty the list): '+stray.join(', '));
      for(var s in RB){ if(RB.hasOwnProperty(s) && !reg[s]) throw new Error('rosterBadges names an unregistered scenario: '+s); }
      return { registry:ids.length, covered:Object.keys(RB).length, pendingWestern:PENDING.length };
    });

    step('D481 PER-ROW SOURCE FLOOR: every coverage-sweep assignment carries a rosterBadgeProv record — Verified >=2 named sources, Inferred/Disputed >=1, no orphan records (the original 9 D104-workflow battles are documented in _rosterNote)', function(){
      var ORIG9=['bullrun1','fredericksburg','antietam','gettysburg','shiloh','vicksburg','chancellorsville','malvernHill','chickamauga'];
      var RB=D&&D.rosterBadges, PV=D&&D.rosterBadgeProv;
      if(!RB) throw new Error('rosterBadges missing');
      var swept=Object.keys(RB).filter(function(s){ return ORIG9.indexOf(s)<0; });
      if(!swept.length) throw new Error('no coverage-sweep scenarios found (the slice-4 batch must be present)');
      if(!PV) throw new Error('rosterBadgeProv missing (the D481 per-row citation law)');
      var rows=0, verified=0;
      for(var si=0;si<swept.length;si++){ var s=swept[si], units=RB[s];
        for(var uid in units){ if(!units.hasOwnProperty(uid)) continue;
          var keys=units[uid];
          for(var ki=0;ki<keys.length;ki++){ rows++;
            var rec=(PV[s]&&PV[s][uid])?PV[s][uid].filter(function(r){return r&&r.key===keys[ki];})[0]:null;
            if(!rec) throw new Error('coverage-sweep row '+s+'/'+uid+'/'+keys[ki]+' has NO rosterBadgeProv record (the per-row source floor)');
            if(['Verified','Inferred','Disputed'].indexOf(rec.prov)<0) throw new Error(s+'/'+uid+'/'+keys[ki]+' invalid prov word: '+rec.prov);
            var srcs=(rec.sources||[]).filter(function(x){ return typeof x==='string' && x.length>2; });
            if(rec.prov==='Verified'){ if(srcs.length<2) throw new Error(s+'/'+uid+'/'+keys[ki]+' is Verified with fewer than 2 named sources ('+srcs.length+')'); verified++; }
            else if(srcs.length<1) throw new Error(s+'/'+uid+'/'+keys[ki]+' is '+rec.prov+' with no named source'); } } }
      // no orphan prov records: every record maps back to a live rosterBadges row
      for(var ps in PV){ if(!PV.hasOwnProperty(ps)) continue;
        for(var pu in PV[ps]){ if(!PV[ps].hasOwnProperty(pu)) continue;
          var list=PV[ps][pu];
          for(var pi=0;pi<list.length;pi++){ var pk=list[pi]&&list[pi].key;
            if(!RB[ps]||!RB[ps][pu]||RB[ps][pu].indexOf(pk)<0) throw new Error('orphan rosterBadgeProv record '+ps+'/'+pu+'/'+pk+' (no matching rosterBadges row)'); } } }
      if(!(verified*2>=rows)) throw new Error('the sweep should be majority-Verified: '+verified+' of '+rows);
      return { sweptScenarios:swept.length, rows:rows, verified:verified };
    });

    step('D481 ROW PROVENANCE DISPLAY: a coverage-sweep badge card carries its per-assignment provenance line (visible + hover + SR); absent record -> the card is byte-identical', function(){
      if(typeof fldRosterBadgeProv!=='function') throw new Error('fldRosterBadgeProv missing');
      var ORIG9=['bullrun1','fredericksburg','antietam','gettysburg','shiloh','vicksburg','chancellorsville','malvernHill','chickamauga'];
      var RB=D.rosterBadges, PV=D.rosterBadgeProv;
      var scn=null, uid=null, key=null;
      for(var s in PV){ if(!PV.hasOwnProperty(s)||ORIG9.indexOf(s)>=0) continue;
        for(var u in PV[s]){ if(!PV[s].hasOwnProperty(u)||!PV[s][u].length) continue; scn=s; uid=u; key=PV[s][u][0].key; break; }
        if(scn) break; }
      if(!scn) throw new Error('no sweep prov record to render');
      var rec=fldRosterBadgeProv(scn,uid,key);
      if(!rec||rec.key!==key) throw new Error('fldRosterBadgeProv did not resolve '+scn+'/'+uid+'/'+key);
      var def=fldBadgeDef(key);
      var withRow=fldBadgeCardHtml(def,rec), plain=fldBadgeCardHtml(def);
      if(withRow.indexOf('This assignment:')<0) throw new Error('card missing its per-assignment provenance line');
      var firstSrc=(rec.sources&&rec.sources[0])?rec.sources[0]:null;
      if(firstSrc){ var dv=document.createElement('div'); dv.innerHTML=withRow;
        var c=dv.querySelector('[data-badge-card]');
        if((c.getAttribute('aria-label')||'').indexOf(firstSrc)<0) throw new Error('card aria lacks the row source '+firstSrc);
        if((c.textContent||'').indexOf(firstSrc)<0) throw new Error('card visible text lacks the row source '+firstSrc); }
      if(plain.indexOf('This assignment:')>=0) throw new Error('a card with NO row record must render byte-identically to its pre-D481 form');
      if(fldRosterBadgeProv('bullrun1','cs_jackson','stonewall')!==null) throw new Error('the original-9 battles carry no row records (documented in _rosterNote) — expected null');
      // the live gallery path passes the record through for the running scenario
      var savedScn=__FIELD.scenario; __FIELD.scenario=scn;
      var gal=fldBadgeGalleryHtml({ id:uid, badges:[key] });
      __FIELD.scenario=savedScn;
      if(gal.indexOf('This assignment:')<0) throw new Error('the gallery did not thread the row provenance for the live scenario');
      return { scn:scn, uid:uid, key:key, prov:rec.prov };
    });
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


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-ratings.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-ratings.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-ratings: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-ratings: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-ratings: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
