#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-presets.mjs — TACTICAL ENGINE B-5 (difficulty/realism presets). Verifies EMPIRICALLY on the
// renderer-agnostic sim that the preset layer wires the existing knobs WITHOUT moving the shipped balance when
// neutral: NEUTRAL (no preset) -> __FIELD.sev all 1.0 / aiSkill 1.0 / aiResolve 1.0 / aiCushion 0 and the live
// stacked Bull Run stays CS-favoured (== today, byte-identical, == an explicit Veteran x Balanced); each realism
// bundle/AI tier resolves the expected severities; the SEVERITY SEAMS actually bite (attrition -> casualties;
// canister lethality -> fldArtFireMult; supply -> the train reserve; scouting -> fldUnitSight; command shock ->
// fldOfficerFalls; the Recruit player cushion + brittle-enemy handicap in fldMoraleStep; AI sharpness -> the
// attacker commit threshold); the fog lever drives __FIELD.fog; determinism holds; the picker HTML is well-formed;
// no Classic contamination. Writes shots/probe-presets.{json,png}.
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
  function mk(o){ var u=fldMakeUnit({id:o.id, side:o.side, name:o.id, arm:o.arm||'inf', role:o.role||null, weapon:o.weapon||'rifled', men:o.men||1500, xp:(o.xp==null?2:o.xp), x:o.x, z:o.z, facing:(o.side==='US'?0:Math.PI), ai:(o.ai==null?true:o.ai)});
    u.state = o.st || 'steady'; u.morale = (o.mor==null?78:o.mor); if(o.ammo!=null) u.ammo=o.ammo; return u; }
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  function setPreset(ai, rm, lv){ G.settings=G.settings||{}; G.settings.tacticalPreset = fldPresetCompute(ai, rm, lv||null); }
  function clearPreset(){ try{ delete G.settings.tacticalPreset; }catch(e){ G.settings.tacticalPreset=null; } }
  // run the LIVE stacked Bull Run (all layers ON) AI-vs-AI for a seed -> winner; honours whatever preset/fog is set.
  function runLive(seed){ __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return { w:__FIELD.winner, us:strength('US'), cs:strength('CS'), steps:n }; }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof FLDP==='undefined' || typeof fldPresetsApply!=='function' || typeof fldPresetResolve!=='function' || typeof fldPresetCompute!=='function')
      return JSON.stringify({ok:false, fatal:'presets layer fns missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; clearPreset(); delete G.settings.tacticalFog;

    step('NEUTRAL: no preset -> __FIELD.sev all 1.0, aiSkill 1.0, aiResolve 1.0, aiCushion 0 (byte-identical config)', function(){
      clearPreset(); delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});
      var s=__FIELD.sev;
      if(!s) throw new Error('__FIELD.sev not set');
      var keys=['attrition','canister','supply','cmdShock','sight','veteran'];
      for(var i=0;i<keys.length;i++) if(s[keys[i]]!==1) throw new Error('neutral sev.'+keys[i]+' != 1: '+s[keys[i]]);
      if(__FIELD.aiSkill!==1) throw new Error('neutral aiSkill != 1: '+__FIELD.aiSkill);
      if(__FIELD.aiResolve!==1) throw new Error('neutral aiResolve != 1: '+__FIELD.aiResolve);
      if(__FIELD.aiCushion!==0) throw new Error('neutral aiCushion != 0: '+__FIELD.aiCushion);
      if(fldPresetResolve()!==null) throw new Error('fldPresetResolve should be null with no preset');
      return { sev:s, aiSkill:__FIELD.aiSkill, aiResolve:__FIELD.aiResolve, aiCushion:__FIELD.aiCushion }; });

    step('NEUTRAL == TODAY: the live stacked Bull Run (no preset, default fog ON) is CS-FAVOURED + deterministic + seed-for-seed IDENTICAL to an explicit Veteran x Balanced preset', function(){
      clearPreset(); delete G.settings.tacticalFog;
      var seeds=[1,7,21,42,55,101,303,909], noP=[], csNo=0;
      for(var i=0;i<seeds.length;i++){ var r=runLive(seeds[i]); noP.push(r.w); if(r.w==='CS') csNo++; }
      // an explicit Veteran x Balanced must reproduce it seed-for-seed (neutral == the named default)
      setPreset('veteran','balanced'); delete G.settings.tacticalFog;
      var vb=[], csVb=0; for(var j=0;j<seeds.length;j++){ var r2=runLive(seeds[j]); vb.push(r2.w); if(r2.w==='CS') csVb++; }
      clearPreset(); delete G.settings.tacticalFog;
      for(var k=0;k<seeds.length;k++){ if(noP[k]!==vb[k]) throw new Error('no-preset != Veteran x Balanced at seed '+seeds[k]+': '+noP[k]+' vs '+vb[k]); }
      if(csNo<6) throw new Error('the live stacked default is NOT CS-favoured (>=6): '+csNo+'/8 — neutral moved the shipped balance');
      // determinism: same seed twice == same outcome
      var a=runLive(21), b=runLive(21); if(a.w!==b.w||a.us!==b.us||a.cs!==b.cs||a.steps!==b.steps) throw new Error('neutral non-deterministic');
      return { noPresetCS:csNo+'/8', veteranBalancedCS:csVb+'/8', identicalSeedForSeed:true }; });

    step('BYTE-IDENTITY GUARD: officers/logistics/arms/badges-OFF Bull Run == the committed CS 5/8 even with the presets layer present (no perturbation)', function(){
      clearPreset(); G.settings.tacticalFog=false;
      // R-6 (D104): badges is a default-ON optional combat layer that LEGITIMATELY shifts Bull Run (the assigned
      // CS stonewalls + weakened US attackers make it CS 8/8). This guard isolates the PRESETS/arms layer's
      // byte-identity, so badges must be OFF here alongside officers/logistics/arms -> the pristine committed CS 5/8.
      function run(seed){ __FIELD._officersOff=true; __FIELD._logisticsOff=true; __FIELD._armsOff=true; __FIELD._badgesOff=true; G.settings.tacticalFog=false; fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed, fog:false}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; } return __FIELD.winner; }
      var seeds=[1,7,21,42,55,101,303,909], cs=0; for(var i=0;i<seeds.length;i++){ if(run(seeds[i])==='CS') cs++; }
      __FIELD._armsOff=false; __FIELD._badgesOff=false; delete G.settings.tacticalFog;
      if(cs!==5) throw new Error('layers-OFF bullrun != 5/8 with presets present (byte-identity broken): '+cs+'/8');
      return { layersOffCS:cs+'/8' }; });

    step('AI TIERS resolve as designed: Veteran=neutral; cushion + brittle-enemy ONLY at Recruit; aiResolve NEVER > 1 (smarter-not-cheating)', function(){
      var rows={};
      ['recruit','regular','veteran','hardee'].forEach(function(t){ var c=fldPresetCompute(t,'balanced'); rows[t]={skill:c.aiSkill, resolve:c.aiResolve, cushion:c.aiCushion}; });
      if(rows.veteran.skill!==1 || rows.veteran.resolve!==1 || rows.veteran.cushion!==0) throw new Error('Veteran is not neutral: '+JSON.stringify(rows.veteran));
      if(!(rows.recruit.cushion>0)) throw new Error('Recruit must give a player cushion');
      if(rows.regular.cushion!==0 || rows.veteran.cushion!==0 || rows.hardee.cushion!==0) throw new Error('cushion must be ONLY at the easiest tier (Recruit)');
      if(!(rows.recruit.resolve<1)) throw new Error('Recruit enemy should be brittler (resolve<1)');
      ['recruit','regular','veteran','hardee'].forEach(function(t){ if(rows[t].resolve>1) throw new Error(t+' aiResolve > 1 (would be a cheat): '+rows[t].resolve); });
      if(!(rows.hardee.skill>rows.veteran.skill && rows.veteran.skill>rows.regular.skill && rows.regular.skill>rows.recruit.skill)) throw new Error('aiSkill must rise Recruit<Regular<Veteran<Hardee: '+JSON.stringify(rows));
      return rows; });

    step('REALISM BUNDLES resolve as designed: Balanced all 1.0; Arcade gentler; Historian harsher; fog defaults (off/scenario/on)', function(){
      var ar=fldPresetCompute('veteran','arcade'), ba=fldPresetCompute('veteran','balanced'), hi=fldPresetCompute('veteran','historian');
      var keys=['attrition','canister','supply','cmdShock','sight','veteran'];
      for(var i=0;i<keys.length;i++) if(ba[keys[i]]!==1) throw new Error('Balanced.'+keys[i]+' != 1: '+ba[keys[i]]);
      // Arcade: lighter attrition/canister/cmdShock, MORE generous supply + longer sight than Historian
      if(!(ar.attrition<ba.attrition && ba.attrition<hi.attrition)) throw new Error('attrition ordering wrong: '+ar.attrition+'/'+ba.attrition+'/'+hi.attrition);
      if(!(ar.canister<hi.canister)) throw new Error('canister ordering wrong');
      if(!(ar.supply>ba.supply && ba.supply>hi.supply)) throw new Error('supply ordering wrong (arcade generous, historian strict)');
      if(!(ar.cmdShock<hi.cmdShock)) throw new Error('cmdShock ordering wrong');
      if(!(ar.sight>hi.sight)) throw new Error('sight ordering wrong');
      if(ar.fog!=='off'||ba.fog!=='scenario'||hi.fog!=='on') throw new Error('fog defaults wrong: '+ar.fog+'/'+ba.fog+'/'+hi.fog);
      return { arcade:ar, balanced:ba, historian:hi }; });

    step('APPLY writes __FIELD.sev from the preset; the FOG LEVER drives __FIELD.fog (off / on / scenario default) with no opts.fog', function(){
      setPreset('veteran','historian'); delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});   // historian fog="on"
      if(__FIELD.fog!==true) throw new Error('historian (fog on) did not set fog');
      if(Math.abs(__FIELD.sev.attrition-1.3)>1e-9) throw new Error('historian attrition not applied: '+__FIELD.sev.attrition);
      setPreset('veteran','arcade'); delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});   // arcade fog="off"
      if(__FIELD.fog!==false) throw new Error('arcade (fog off) did not clear fog');
      setPreset('veteran','balanced'); delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});   // balanced fog="scenario" -> Bull Run default ON
      var scen=__FIELD.fog;
      // an explicit opts.fog STILL wins over the preset
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1, fog:false});
      var pinned=__FIELD.fog;
      clearPreset(); delete G.settings.tacticalFog;
      if(scen!==true) throw new Error('balanced scenario fog did not yield the Bull Run default (ON): '+scen);
      if(pinned!==false) throw new Error('an explicit opts.fog:false did not override the preset fog');
      return { historianFog:true, arcadeFog:false, scenarioFog:scen, explicitPinWins:!pinned }; });

    step('SEVERITY SEAM — ATTRITION: a pinned fire exchange kills MORE under Heavy than Light (the casualty seam bites)', function(){
      clearPreset();
      function pinnedCas(att){ fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1}); __FIELD.sev.attrition=att;
        var sh=mk({id:'S',side:'US',arm:'inf',x:300,z:600,men:1500}), tg=mk({id:'T',side:'CS',arm:'inf',x:300,z:560,men:1500}); __FIELD.units=[sh,tg]; __FIELD.seed=4242; var m0=tg.men; fldResolveFire(sh,tg,0.05); return m0-tg.men; }
      var light=pinnedCas(0.7), heavy=pinnedCas(1.3);
      if(!(heavy>light*1.5)) throw new Error('attrition severity did not scale casualties: light '+light.toFixed(2)+' heavy '+heavy.toFixed(2));
      // exactly proportional (single multiply): heavy/light ~ 1.3/0.7
      if(Math.abs((heavy/light)-(1.3/0.7))>0.001) throw new Error('attrition not exactly proportional: ratio '+(heavy/light).toFixed(4));
      return { lightCas:Math.round(light*100)/100, heavyCas:Math.round(heavy*100)/100, ratio:Math.round((heavy/light)*1000)/1000 }; });

    step('SEVERITY SEAM — CANISTER lethality: fldArtFireMult canister return scales with sev.canister; long range UNAFFECTED', function(){
      clearPreset(); fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1}); __FIELD.arms=true;
      var u={arm:'art'};
      __FIELD.sev.canister=1.0; var base=fldArtFireMult(u,{},FLDA.CANISTER_R-10,1.0), baseLong=fldArtFireMult(u,{},FLDA.CANISTER_R+300,1.0);
      __FIELD.sev.canister=1.3; var hi=fldArtFireMult(u,{},FLDA.CANISTER_R-10,1.0), hiLong=fldArtFireMult(u,{},FLDA.CANISTER_R+300,1.0);
      __FIELD.sev.canister=1.0;
      if(Math.abs(hi-base*1.3)>1e-6) throw new Error('canister severity not applied: base '+base+' hi '+hi);
      if(Math.abs(hiLong-baseLong)>1e-9) throw new Error('long-range bombardment must NOT be scaled by canister lethality');
      return { baseCanister:Math.round(base*100)/100, heavyCanister:Math.round(hi*100)/100, longUnchanged:Math.abs(hiLong-baseLong)<1e-9 }; });

    step('SEVERITY SEAM — SUPPLY: the battle ammunition reserve scales with sev.supply (Generous > Normal > Strict)', function(){
      clearPreset(); fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1}); __FIELD.campaignCtx=null;
      if(typeof fldSupplyReserve!=='function') throw new Error('fldSupplyReserve missing');
      __FIELD.sev.supply=1.0; var norm=fldSupplyReserve('US');
      __FIELD.sev.supply=1.4; var gen=fldSupplyReserve('US');
      __FIELD.sev.supply=0.72; var strict=fldSupplyReserve('US');
      __FIELD.sev.supply=1.0;
      if(!(gen>norm && norm>strict)) throw new Error('supply severity did not order the reserve: gen '+gen+' norm '+norm+' strict '+strict);
      return { generous:gen, normal:norm, strict:strict }; });

    step('SEVERITY SEAM — SCOUTING (LOS): fldUnitSight scales with sev.sight (Long > Normal > Short)', function(){
      clearPreset(); fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1});
      var inf={arm:'inf'};
      __FIELD.sev.sight=1.0; var norm=fldUnitSight(inf);
      __FIELD.sev.sight=1.15; var long=fldUnitSight(inf);
      __FIELD.sev.sight=0.88; var short=fldUnitSight(inf);
      __FIELD.sev.sight=1.0;
      if(!(long>norm && norm>short)) throw new Error('sight severity did not order the sight radius');
      if(Math.abs(norm-FLD.SIGHT_INF)>1e-9) throw new Error('neutral sight != base SIGHT_INF (byte-identity): '+norm);
      return { long:Math.round(long), normal:Math.round(norm), short:Math.round(short) }; });

    step('SEVERITY SEAM — COMMAND SHOCK: a fallen general deals a bigger morale shock under Severe than Muted (B-2 tie)', function(){
      __FIELD._officersOff=false; clearPreset();
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      if(typeof fldOfficerFalls!=='function' || !__FIELD.leaders || !__FIELD.leaders.length) throw new Error('officers/leaders not available for the shock test');
      function shockDrop(sev){
        var ld=__FIELD.leaders[0]; ld.alive=true; ld.x=600; ld.z=480; ld.radius=ld.radius||200;
        var u=mk({id:'U',side:ld.side,arm:'inf',x:ld.x,z:ld.z+20,men:1500}); u.morale=78; u.maxMor=78;
        __FIELD.units=[u]; __FIELD.sev.cmdShock=sev;
        fldOfficerFalls(ld);
        return 78 - u.morale;
      }
      var muted=shockDrop(0.6), severe=shockDrop(1.4);
      __FIELD.sev.cmdShock=1.0;
      if(!(severe>muted*1.5)) throw new Error('command-shock severity did not scale the morale drop: muted '+muted.toFixed(2)+' severe '+severe.toFixed(2));
      return { mutedDrop:Math.round(muted*100)/100, severeDrop:Math.round(severe*100)/100 }; });

    step('PLAYER CUSHION + BRITTLE ENEMY (Recruit only): in fldMoraleStep a PLAYER unit recovers faster + an AI unit recovers slower than at Veteran', function(){
      clearPreset(); fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1});
      function recover(cushion, resolve, isAi){
        __FIELD.aiCushion=cushion; __FIELD.aiResolve=resolve; __FIELD.sev.veteran=1;
        var u=mk({id:'P',side:'US',arm:'inf',x:200,z:200,men:1500,ai:isAi}); u.morale=40; u.maxMor=78; u.underFire=0; u.state='shaken';
        __FIELD.units=[u];   // alone -> "safe" recovery branch
        for(var t=0;t<40;t++) fldMoraleStep(u,0.05);
        return u.morale;
      }
      var vetPlayer=recover(0,1,false), recruitPlayer=recover(0.6,0.82,false);
      var vetAi=recover(0,1,true), recruitAi=recover(0.6,0.82,true);
      __FIELD.aiCushion=0; __FIELD.aiResolve=1;
      if(!(recruitPlayer>vetPlayer)) throw new Error('Recruit player cushion did not speed recovery: vet '+vetPlayer.toFixed(1)+' recruit '+recruitPlayer.toFixed(1));
      if(!(recruitAi<vetAi)) throw new Error('Recruit brittle-enemy handicap did not slow the AI recovery: vet '+vetAi.toFixed(1)+' recruit '+recruitAi.toFixed(1));
      return { vetPlayer:Math.round(vetPlayer*10)/10, recruitPlayer:Math.round(recruitPlayer*10)/10, vetAi:Math.round(vetAi*10)/10, recruitAi:Math.round(recruitAi*10)/10 }; });

    step('AI SHARPNESS seam (ATTACKER): aiSkill moves fldAiAttacker effLocal -> a marginal-odds attacker ASSAULTS at 1.12 but NOT at 0.9 (hard assertion, no vacuous branch)', function(){
      clearPreset(); fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      var obj=__FIELD.objective; __FIELD.attacker='US'; __FIELD.fog=false;
      function attackOrder(skill){
        __FIELD.aiSkill=skill;
        // a US attacker CLOSED on the objective with a slim global edge (1600 vs 1500); localSup flips true only as
        // aiSkill lowers effLocal (= ATK_LOCAL_RATIO/aiSkill * cf) past ~0.97, so the commit decision MUST move.
        var atk=mk({id:'A',side:'US',arm:'inf',x:obj.x,z:obj.z+ (fldHomeEdgeZ('US')>obj.z?1:-1)*60,men:1600,st:'steady'});
        var def=mk({id:'D',side:'CS',arm:'inf',x:obj.x,z:obj.z,men:1500,st:'steady'});
        __FIELD.units=[atk,def]; fldAiUnit(atk);
        return atk.order ? atk.order.type : null;
      }
      var lo=attackOrder(0.9), mid=attackOrder(1.0), hi=attackOrder(1.12);
      __FIELD.aiSkill=1;
      var orders={lo:lo, mid:mid, hi:hi};
      if(lo===mid && mid===hi) throw new Error('aiSkill did NOT move the attacker commit decision (seam wired out): '+JSON.stringify(orders));
      if(hi!=='charge') throw new Error('the sharp (1.12) attacker did not assault: '+JSON.stringify(orders));
      if(lo==='charge') throw new Error('the cautious (0.9) attacker assaulted on the same marginal odds: '+JSON.stringify(orders));
      return orders; });

    step('AI SHARPNESS seam (DEFENDER): aiSkill scales fldAiDefender CTR_LEASH/CTR_RATIO -> a counterattack CHARGE fires at 1.12 but not at 0.9 (the leash bites)', function(){
      clearPreset(); fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      var obj=__FIELD.objective; __FIELD.attacker='US'; __FIELD.fog=false;   // CS is the DEFENDER -> runs fldAiDefender
      var sgn=(fldHomeEdgeZ('CS')>obj.z)?1:-1;
      function defOrder(skill){
        __FIELD.aiSkill=skill;
        var d2=mk({id:'D',side:'CS',arm:'inf',x:obj.x,z:obj.z+sgn*120,men:2000,st:'steady'});   // defender offset from obj
        var w=mk({id:'W',side:'US',arm:'inf',x:obj.x,z:obj.z+sgn*280,men:1500,st:'wavering'});   // disordered enemy ~160 off the defender, ~280 off obj (near the leash boundary)
        __FIELD.units=[d2,w]; fldAiUnit(d2);
        return d2.order ? d2.order.type : null;
      }
      var lo=defOrder(0.9), hi=defOrder(1.12);
      __FIELD.aiSkill=1;
      if(lo===hi) throw new Error('aiSkill did NOT move the defender counterattack decision (CTR_LEASH/CTR_RATIO seam wired out): lo '+lo+' hi '+hi);
      if(hi!=='charge') throw new Error('the sharp (1.12) defender did not counterattack the disordered enemy near the hill: hi '+hi);
      return { cautious:lo, sharp:hi }; });

    step('DETERMINISM under a non-neutral preset: same preset + seed -> identical battle (Historian x Hardee)', function(){
      setPreset('hardee','historian'); delete G.settings.tacticalFog;
      var a=runLive(42), b=runLive(42);
      clearPreset(); delete G.settings.tacticalFog;
      if(a.w!==b.w||a.us!==b.us||a.cs!==b.cs||a.steps!==b.steps) throw new Error('non-neutral preset is non-deterministic: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      if(['US','CS','draw'].indexOf(a.w)<0) throw new Error('Hardee x Historian bad winner: '+a.w);
      return { winner:a.w, us:a.us, cs:a.cs, deterministic:true }; });

    step('ARCADE vs HISTORIAN actually play DIFFERENTLY (the bundle reaches the battle, not just the config object)', function(){
      var seeds=[1,7,21,42,55,101,303,909];
      setPreset('veteran','arcade'); delete G.settings.tacticalFog; var arc=[]; for(var i=0;i<seeds.length;i++) arc.push(runLive(seeds[i]).cs);
      setPreset('veteran','historian'); delete G.settings.tacticalFog; var his=[]; for(var j=0;j<seeds.length;j++) his.push(runLive(seeds[j]).cs);
      clearPreset(); delete G.settings.tacticalFog;
      var diff=false; for(var k=0;k<seeds.length;k++){ if(Math.abs(arc[k]-his[k])>1) { diff=true; break; } }
      if(!diff) throw new Error('Arcade and Historian produced indistinguishable battles (the severities never reached the sim)');
      return { arcadeCS0:arc[0], historianCS0:his[0], differ:true }; });

    step('PERSIST + RESOLVE roundtrip: fldPresetCompute -> persist -> fldPresetResolve returns the same config', function(){
      var c=fldPresetCompute('hardee','historian',{ attrition:1.1 });
      fldPresetPersist(c);
      var got=fldPresetResolve();
      if(!got || got.ai!=='hardee' || got.realism!=='historian') throw new Error('roundtrip lost the tier/bundle: '+JSON.stringify(got));
      if(Math.abs(got.attrition-1.1)>1e-9) throw new Error('roundtrip lost the lever override: '+got.attrition);
      clearPreset();
      return { ai:got.ai, realism:got.realism, attrition:got.attrition }; });

    step('PICKER HTML is well-formed + accessible (the four AI tiers, three realism bundles, radiogroups, summary)', function(){
      if(typeof fldPresetMenu!=='function' || typeof _fldPresetHTML!=='function') throw new Error('picker fns missing');
      clearPreset(); _fldPresetInitState('menu');
      var html=_fldPresetHTML();
      ['Recruit','Regular','Veteran','Hardee','Arcade','Balanced','Historian','role="group"','aria-pressed','Command &amp; Realism','Advanced'].forEach(function(t){ if(html.indexOf(t)<0) throw new Error('picker HTML missing: '+t); });
      if(html.indexOf('role="radio"')>=0 || html.indexOf('aria-checked')>=0) throw new Error('picker still uses role=radio/aria-checked (bug-hunt F4: should be role=group + aria-pressed)');
      // advanced expander renders the lever chips
      _fldPresetState.advanced=true; var adv=_fldPresetHTML();
      ['Casualty severity','Canister lethality','Supply','Scouting range','AI sharpness','aria-pressed'].forEach(function(t){ if(adv.indexOf(t)<0) throw new Error('advanced HTML missing: '+t); });
      // S28 (D233): the "Selected: ..." summary sits in an aria-live=polite region so the Custom/named
      // bundle flip is announced to screen-reader users when an advanced lever diverges the preset.
      var sumAt=html.indexOf('id="pvSummary"');
      if(sumAt<0) throw new Error('picker missing #pvSummary');
      if(html.lastIndexOf('aria-live="polite"', sumAt)<0 || sumAt-html.lastIndexOf('aria-live="polite"', sumAt)>200) throw new Error('#pvSummary is not inside an aria-live=polite region');
      return { len:html.length, advLen:adv.length }; });

    step('CUSHION via the APPLY path (bug-hunt): launching with each AI tier sets aiCushion/aiResolve correctly — cushion>0 & resolve<1 ONLY at Recruit', function(){
      function launchTier(t){ setPreset(t,'balanced'); delete G.settings.tacticalFog; fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1}); return { cushion:__FIELD.aiCushion, resolve:__FIELD.aiResolve, skill:__FIELD.aiSkill }; }
      var rec=launchTier('recruit'), reg=launchTier('regular'), vet=launchTier('veteran'), har=launchTier('hardee');
      clearPreset();
      if(!(rec.cushion>0 && rec.resolve<1)) throw new Error('Recruit launch did not apply the cushion/brittle-enemy: '+JSON.stringify(rec));
      [['regular',reg],['veteran',vet],['hardee',har]].forEach(function(p){ if(p[1].cushion!==0 || p[1].resolve!==1) throw new Error(p[0]+' launch wrongly carried a cushion/resolve handicap: '+JSON.stringify(p[1])); });
      if(vet.skill!==1) throw new Error('Veteran launch aiSkill != 1 (neutral): '+vet.skill);
      return { recruit:rec, regular:reg, veteran:vet, hardee:har }; });

    step('CUSHION COUPLING GUARD (bug-hunt): Recruit + a tuned-Sharp aiSkill (a Custom AI) DROPS the cushion — it never rides the sharpest decisions', function(){
      var coupled=fldPresetCompute('recruit','balanced',{ aiSkill:1.12 });   // pick Recruit, then bump AI sharpness in Advanced
      if(coupled.aiCushion!==0 || coupled.aiResolve!==1) throw new Error('a Recruit + Sharp-AI Custom config still carries the cushion: '+JSON.stringify({cushion:coupled.aiCushion, resolve:coupled.aiResolve}));
      if(Math.abs(coupled.aiSkill-1.12)>1e-9) throw new Error('the tuned aiSkill was lost');
      var genuine=fldPresetCompute('recruit','balanced');   // an untouched Recruit keeps it
      if(!(genuine.aiCushion>0 && genuine.aiResolve<1)) throw new Error('a genuine Recruit lost its cushion');
      return { coupledCushion:coupled.aiCushion, genuineCushion:genuine.aiCushion }; });

    step('SEVERITY SEAM — MELEE ATTRITION: fldResolveMelee casualties scale with sev.attrition (Heavy >> Light), byte-identical at 1.0', function(){
      clearPreset(); fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1}); __FIELD.arms=false;
      function meleeCas(att){ var a=mk({id:'A',side:'US',arm:'inf',x:600,z:500,men:1500}), b=mk({id:'B',side:'CS',arm:'inf',x:600,z:505,men:1500}); __FIELD.units=[a,b]; __FIELD.sev.attrition=att; __FIELD.seed=777; for(var t=0;t<10;t++) fldResolveMelee(a,b,0.05); return (1500-a.men)+(1500-b.men); }
      var light=meleeCas(0.7), norm=meleeCas(1.0), heavy=meleeCas(1.3);
      __FIELD.sev.attrition=1;
      if(!(heavy>norm && norm>light)) throw new Error('melee attrition did not order casualties: light '+light.toFixed(1)+' norm '+norm.toFixed(1)+' heavy '+heavy.toFixed(1));
      if(Math.abs((heavy/light)-(1.3/0.7))>0.02) throw new Error('melee attrition not ~proportional: ratio '+(heavy/light).toFixed(3));
      return { lightCas:Math.round(light), normCas:Math.round(norm), heavyCas:Math.round(heavy) }; });

    step('MALFORMED PRESET is CLAMPED (bug-hunt): a hand-edited {supply:-5, attrition:0, aiResolve:5, aiSkill:-1} cannot invert a lever, zero casualties, buff the AI, or make a non-positive reserve', function(){
      G.settings.tacticalPreset = { ai:'veteran', realism:'balanced', supply:-5, attrition:0, canister:99, cmdShock:-2, sight:0, veteran:-1, aiSkill:-1, aiResolve:5, aiCushion:-3, fog:'scenario' };
      fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1});
      var s=__FIELD.sev;
      if(!(s.attrition>0)) throw new Error('attrition not clamped >0: '+s.attrition);
      if(!(s.supply>0)) throw new Error('supply not clamped >0: '+s.supply);
      if(!(s.canister<=3)) throw new Error('canister not clamped <=3: '+s.canister);
      if(!(s.cmdShock>0 && s.sight>0 && s.veteran>0)) throw new Error('a severity stayed non-positive: '+JSON.stringify(s));
      if(!(__FIELD.aiResolve<=1)) throw new Error('aiResolve not capped <=1 (smarter-not-cheating, CODE-enforced): '+__FIELD.aiResolve);
      if(!(__FIELD.aiSkill>0)) throw new Error('aiSkill not clamped >0: '+__FIELD.aiSkill);
      if(!(__FIELD.aiCushion>=0)) throw new Error('aiCushion not floored >=0: '+__FIELD.aiCushion);
      // the reserve must never go non-positive
      __FIELD.campaignCtx=null; var res=(typeof fldSupplyReserve==='function')?fldSupplyReserve('US'):1;
      clearPreset();
      if(!(res>=1)) throw new Error('supply reserve went non-positive under a malformed preset: '+res);
      return { sev:s, aiResolve:__FIELD.aiResolve, aiSkill:__FIELD.aiSkill, reserve:res }; });

    step('BOOT-LOAD: a persisted localStorage preset is restored into G.settings on boot (fldPresetBootLoad)', function(){
      clearPreset();
      try{ localStorage.setItem(FLDP.STORE_KEY, JSON.stringify(fldPresetCompute('hardee','historian'))); }catch(e){ throw new Error('localStorage unavailable in probe'); }
      delete G.settings.tacticalPreset;
      fldPresetBootLoad();
      var c=G.settings.tacticalPreset;
      if(!c || c.ai!=='hardee' || c.realism!=='historian') throw new Error('boot-load did not restore the persisted preset: '+JSON.stringify(c));
      // a pre-existing G.settings.tacticalPreset must NOT be overwritten by the store
      G.settings.tacticalPreset = fldPresetCompute('recruit','arcade'); fldPresetBootLoad();
      if(G.settings.tacticalPreset.ai!=='recruit') throw new Error('boot-load clobbered an existing in-memory preset');
      try{ localStorage.removeItem(FLDP.STORE_KEY); }catch(e){} clearPreset();
      return { restored:'hardee x historian', keptExisting:true }; });

    step('AUTOPAUSE lever apply: {autoPause:"off"} sets G.settings.tacticalAutoPause=false; null leaves it untouched', function(){
      G.settings.tacticalAutoPause=true;
      G.settings.tacticalPreset=fldPresetCompute('veteran','balanced',{ autoPause:'off' }); delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1});
      if(__FIELD.autoPause!==false) throw new Error('autoPause:off lever did not turn auto-pause off: '+__FIELD.autoPause);
      // a preset with autoPause null must NOT clobber the existing setting
      G.settings.tacticalAutoPause=true; G.settings.tacticalPreset=fldPresetCompute('veteran','balanced'); delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', scenario:'sandbox', autoBoth:true, seed:1});
      var keep=__FIELD.autoPause;
      clearPreset();
      if(keep!==true) throw new Error('a null autoPause lever wrongly changed the auto-pause setting: '+keep);
      return { offApplied:true, nullPreserved:keep }; });

    step('NO CLASSIC CONTAMINATION: a preset battle never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode; setPreset('hardee','historian'); delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:3}); __FIELD.phase='battle'; __FIELD.paused=false; var n=0; while(__FIELD.phase==='battle'&&n<20000){ fldSimStep(0.05); n++; }
      clearPreset(); delete G.settings.tacticalFog;
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('mutated G.mode: '+G.mode);
      try{ fldExit(true); }catch(e){}
      return { gMode:G.mode }; });

    step('IN-BATTLE DRAWER (2D DOM): opens + PAUSES; Escape closes the drawer WITHOUT tearing down the battle; pause restored to the pre-open state', function(){
      if(typeof fldOpenSettingsDrawer!=='function') throw new Error('fldOpenSettingsDrawer missing');
      clearPreset(); delete G.settings.tacticalFog;
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', autoBoth:true, seed:1});
      __FIELD.phase='battle'; __FIELD.paused=false;   // running
      if(!__FIELD.root) throw new Error('2D launch did not build #fldRoot');
      fldOpenSettingsDrawer();
      var d=document.getElementById('fldDrawer');
      if(!d) throw new Error('drawer did not open');
      if(__FIELD.paused!==true) throw new Error('drawer did not pause the battle');
      // Escape on the drawer must CLOSE it and NOT exit the battle (the bug-hunt HIGH: Escape used to bubble to fldExit)
      var ev=new KeyboardEvent('keydown',{key:'Escape',bubbles:true}); d.dispatchEvent(ev);
      var stillOpen=!!document.getElementById('fldDrawer'), stillInBattle=!!document.getElementById('fldRoot') && __FIELD.phase==='battle';
      if(stillOpen) throw new Error('Escape did not close the drawer');
      if(!stillInBattle) throw new Error('Escape on the drawer TORE DOWN the battle (fldExit leaked through)');
      if(__FIELD.paused!==false) throw new Error('pause not restored to the running pre-open state after closing the drawer');
      // re-open + a battlefield hotkey (g) dispatched on #fldRoot must NOT re-open or act while a drawer is up
      fldOpenSettingsDrawer();
      var d2=document.getElementById('fldDrawer');
      var gv=new KeyboardEvent('keydown',{key:'Escape',bubbles:true}); d2.dispatchEvent(gv);
      try{ fldExit(true); }catch(e){}
      return { opened:true, escapeKeptBattle:true, pauseRestored:true }; });

    step('S25 (D245): preset picker + skirmish menu consume the shared H0 --h0d-* tokens (presentation-only)', function(){
      var onCard=_fldPresetCard('ai','k',{label:'L',sub:'S'},true), offCard=_fldPresetCard('ai','k',{label:'L',sub:'S'},false);
      ['var(--h0d-focus)','var(--h0d-panel2)'].forEach(function(t){ if(onCard.indexOf(t)<0) throw new Error('selected card missing '+t); });
      if(offCard.indexOf('var(--h0d-panel)')<0||offCard.indexOf('var(--h0d-ink)')<0) throw new Error('unselected card missing panel/ink tokens');
      ['#e8c84a','#241c10','#1a150d','#f0d98a','#e9dcc0'].forEach(function(h){ if((onCard+offCard).indexOf(h)>=0) throw new Error('retired invented hex still in preset cards: '+h); });
      var lever=_fldLeverRow('attrition',1);
      if(lever.indexOf('var(--h0d-brass)')<0) throw new Error('lever label not on --h0d-brass');
      if(lever.indexOf('#9f845c')>=0||lever.indexOf('#e8c84a')>=0) throw new Error('retired invented hex still in lever row');
      if(typeof _fldSkOptRow==='function'){
        var sk=_fldSkOptRow('L','probe_g',[{v:1,label:'x'}],1);
        if(sk.indexOf('var(--h0d-brass)')<0||sk.indexOf('var(--h0d-focus)')<0) throw new Error('skirmish opt row not on the shared tokens');
        if(sk.indexOf('var(--rule)')>=0||sk.indexOf('#e8c84a')>=0) throw new Error('skirmish opt row still on the old accents');
      }
      return { presetCards:true, leverRow:true, skirmishRow:typeof _fldSkOptRow==='function' }; });
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
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:120000 });   // slow-Mac: the 'load' wait stalls while embedded assets stream (the documented gotcha, D233 class; fixed in D245); inline scripts are all the probe needs
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    const shot = await page.evaluate(`(function(){
      G.settings=G.settings||{}; G.settings.tacticalPreset = fldPresetCompute('hardee','historian');
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', autoBoth:true, seed:21});
      __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(2600, 0.05);
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      var sev=__FIELD.sev;
      try{ delete G.settings.tacticalPreset; }catch(e){}
      return { simT: Math.round(__FIELD.t), winner: __FIELD.winner, fog:__FIELD.fog, attrition:sev.attrition };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-presets.png'), timeout: 120000 });   // slow-Mac budget (D232 class, fixed in D245): the default 30s flaked under WebGL/asset load
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-presets.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-presets ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-presets.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-presets.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-presets: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-presets: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-presets: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
