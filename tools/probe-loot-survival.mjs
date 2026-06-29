#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D148 Phase I: loot/survival/Soldier's Story MVP probe. Writes shots/probe-loot-survival.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';

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
  function step(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v:v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side){ return { side:side||'US', iron:false, idx:0, funds:(side==='CS'?3000:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; }
  function facets(a){ return { overall:a.overall, morale:a.morale, firepower:a.firepower, supply:a.supply, fatigue:a.fatigue }; }
  function clone(o){ return JSON.parse(JSON.stringify(o)); }
  function fire(el,type){ el.dispatchEvent(new Event(type,{bubbles:true})); }
  function visibleCards(root){
    var all=root.querySelectorAll('[data-ss-card]'), out=[];
    for(var i=0;i<all.length;i++) if(all[i].style.display!=='none') out.push(all[i]);
    return out;
  }
  function cardByPid(root,pid){
    var all=root.querySelectorAll('[data-ss-card]');
    for(var i=0;i<all.length;i++) if(all[i].getAttribute('data-ss-pid')===pid) return all[i];
    return null;
  }
  function findPerson(reg,fn){
    for(var i=0;i<reg.people.length;i++) if(fn(reg.people[i])) return reg.people[i];
    return null;
  }
  function neutralPersona(){
    var attrs=['tactical','command','initiative','resolve','discipline','marksmanship','vigor','charisma','aggression','grit','logistics','engineering','cavalry','artillery','political'];
    var p={}; for(var i=0;i<attrs.length;i++) p[attrs[i]]=64;
    return p;
  }
  function replacementPack(target, extra){
    var rec={
      pid:'person_d152_probe_replacement',
      replacePid:target.pid,
      name:'D152 Probe Replacement',
      side:target.side,
      rank:target.rank || 'Private',
      branch:target.branch || 'inf',
      role:target.role || 'private soldier',
      year:1861,
      provenance:'Verified',
      team:target.team,
      persona:neutralPersona(),
      sources:[
        {title:'D152 probe source A',repository:'Probe fixture',locator:'A',type:'primary',note:'Probe-only validation fixture'},
        {title:'D152 probe source B',repository:'Probe fixture',locator:'B',type:'secondary',note:'Probe-only validation fixture'}
      ],
      sourceNote:'Probe-only fixture; not canonical content.'
    };
    if(extra) for(var k in extra) rec[k]=extra[k];
    return {schema:'cw_soldier_replacements_v1',records:[rec]};
  }
  function setCtl(el,val,type){ el.value=val; fire(el,type||'change'); }
  try {
    var fns=['lootInit','lootAddItem','lootUseItem','lootEquipItem','lootSetSurvival','lootForage','lootSurvivalTick','lootOnResolve','lootSurvivalBridgeBonus','lootRenderTab','lootWireTab','ssPersonRegistry','ssFindPerson','ssStartJourney','ssJourneyOnResolve','ssPersonDetailHTML','ssJourneyReportHTML','ssValidateSoldierReplacementPack','aarRenderReport','bridgeArmy','_t1InitAll','_t1Resolve'];
    for(var i=0;i<fns.length;i++) if(typeof window[fns[i]]!=='function') return JSON.stringify({ok:false, fatal:'missing fn '+fns[i]});
    if(!GAME_DATA || !GAME_DATA['loot-survival']) return JSON.stringify({ok:false, fatal:'missing loot-survival data'});

    step('INIT/SAVE SHAPE: lootInit seeds plain serializable state and sanitizes corrupt inventory', function(){
      var C=mkC('US'); _t1InitAll(C);
      if(!C.loot || !Array.isArray(C.loot.inventory)) throw new Error('loot inventory missing');
      if(C.loot.survival.enabled !== false) throw new Error('survival should default off');
      C.loot.inventory = [
        {id:'bad_item',qty:99},
        {id:'battle_flag_fragment',qty:9},
        {id:'battle_flag_fragment',qty:4},
        {id:'commissary_rations',qty:99}
      ];
      C.loot.equipped = JSON.parse('{"hasOwnProperty":"shadowed","keepsake":"bad_item","kit":"field_glass","__proto__":"pollute"}');
      C.loot.survival = { enabled:'yes', rations:999, exposure:-100, disease:'bad', fatigue:10, lastTurn:'0', forageTurn:null };
      C.loot.journey = { enabled:'true', personId:'probe', person:{name:'<bad>'}, log:new Array(40).fill('x'.repeat(400)) };
      lootInit(C);
      var flag=0, bad=0, ration=0;
      for(var i=0;i<C.loot.inventory.length;i++){ if(C.loot.inventory[i].id==='battle_flag_fragment') flag++; if(C.loot.inventory[i].id==='bad_item') bad++; if(C.loot.inventory[i].id==='commissary_rations') ration=C.loot.inventory[i].qty; }
      if(flag!==1 || bad!==0) throw new Error('sanitize failed: '+JSON.stringify(C.loot.inventory));
      if(ration!==12) throw new Error('stack cap should clamp rations to 12, got '+ration);
      if(C.loot.equipped.kit || C.loot.equipped.keepsake) throw new Error('invalid equipped slots should be cleared');
      if(C.loot.survival.enabled !== false || C.loot.survival.rations!==100 || C.loot.survival.exposure!==0 || C.loot.survival.disease!==12) throw new Error('survival tamper not sanitized: '+JSON.stringify(C.loot.survival));
      if(C.loot.journey.enabled !== false || C.loot.journey.log.length>20) throw new Error('journey tamper not sanitized: '+JSON.stringify(C.loot.journey));
      var sv = JSON.parse(JSON.stringify(C));
      if(!sv.loot || typeof sv.loot.survival.rations !== 'number') throw new Error('loot not JSON-saveable');
      return { inv:C.loot.inventory, survival:C.loot.survival.enabled };
    });

    step('INVENTORY: add/use/equip is bounded, unique-safe, overflow-safe, and stack-safe', function(){
      var C=mkC('US'); _t1InitAll(C);
      C.loot.inventory = [];
      var ids = GAME_DATA['loot-survival'].items.map(function(it){ return it.id; });
      for(var oi=0; oi<96; oi++) C.loot.inventory.push({ id:ids[oi%ids.length], qty:999, found:'x'.repeat(300) });
      lootInit(C);
      if(C.loot.inventory.length > 18) throw new Error('overflow inventory survived: '+C.loot.inventory.length);
      for(var ci=0; ci<C.loot.inventory.length; ci++) {
        var row=C.loot.inventory[ci], item=GAME_DATA['loot-survival'].items.filter(function(it){return it.id===row.id;})[0];
        var max=item.unique ? 1 : (item.stack || 1);
        if(row.qty > max) throw new Error('stack overflow survived for '+row.id+': '+row.qty+' > '+max);
        if(row.found && row.found.length > 120) throw new Error('found note not capped');
      }
      C=mkC('US'); _t1InitAll(C);
      var a=lootAddItem(C,'commissary_rations',2,'probe');
      var b=lootAddItem(C,'commissary_rations',20,'probe');
      var q=C.loot.inventory.filter(function(x){return x.id==='commissary_rations';})[0].qty;
      if(!a.ok || !b.ok || q!==12) throw new Error('rations should stack to cap 12, got '+q);
      if(b.qty!==10) throw new Error('stack add should report actual added qty 10, got '+b.qty);
      var full=lootAddItem(C,'commissary_rations',1,'probe');
      if(full.ok || full.reason!=='stack-full') throw new Error('adding past stack cap should fail cleanly');
      C.loot.survival.rations=10;
      lootUseItem(C,'commissary_rations');
      if(!(C.loot.survival.rations>10)) throw new Error('using rations should raise rations');
      lootAddItem(C,'wool_blankets',1,'probe');
      var eq=lootEquipItem(C,'wool_blankets');
      if(!eq.ok || C.loot.equipped.kit!=='wool_blankets') throw new Error('blankets should equip to kit');
      lootAddItem(C,'battle_flag_fragment',1,'probe');
      var dup=lootAddItem(C,'battle_flag_fragment',1,'probe');
      if(dup.ok || dup.reason!=='unique-duplicate') throw new Error('unique duplicate should be rejected');
      return { rations:C.loot.survival.rations, equipped:C.loot.equipped };
    });

    step('DEFAULT-OFF BRIDGE: disabled and tampered loot/survival changes no bridge facets', function(){
      var C=mkC('CS'); _t1InitAll(C);
      lootAddItem(C,'captured_enfield_crate',1,'probe');
      lootEquipItem(C,'captured_enfield_crate');
      var withDisabled=facets(bridgeArmy(C));
      var saved=C.loot; delete C.loot;
      var withoutLoot=facets(bridgeArmy(C));
      C.loot=saved;
      var bonus=lootSurvivalBridgeBonus(C);
      if(JSON.stringify(withDisabled)!==JSON.stringify(withoutLoot)) throw new Error('disabled loot changed bridge: '+JSON.stringify(withDisabled)+' vs '+JSON.stringify(withoutLoot));
      if(JSON.stringify(bonus)!==JSON.stringify({supply:0,morale:0,fatigue:0,firepower:0,overall:0})) throw new Error('disabled bridge bonus not zero: '+JSON.stringify(bonus));
      C.loot = { inventory:[{id:'captured_enfield_crate',qty:1}], equipped:{weapon:'captured_enfield_crate'}, survival:{enabled:'true',rations:100,morale:100,fatigue:0,exposure:0,disease:0}, journey:{enabled:'true',personId:'tamper'} };
      var tampered=lootSurvivalBridgeBonus(C);
      if(JSON.stringify(tampered)!==JSON.stringify({supply:0,morale:0,fatigue:0,firepower:0,overall:0})) throw new Error('tampered string flags leaked bridge bonus: '+JSON.stringify(tampered));
      return { bridge:withDisabled, tampered:tampered };
    });

    step('SURVIVAL ACTIVE: tick is once per strategic turn; forage is once per turn; active bridge effect is bounded', function(){
      var C=mkC('US'); _t1InitAll(C);
      lootAddItem(C,'wool_blankets',1,'probe'); lootEquipItem(C,'wool_blankets');
      lootSetSurvival(C,true);
      C.loot.survival.lastTurn=999;
      C.loot.survival.forageTurn=999;
      var before=clone(C.loot.survival);
      var t1=lootSurvivalTick(C,{id:'probe',name:'Probe Field'},true);
      var mid=clone(C.loot.survival);
      var t2=lootSurvivalTick(C,{id:'probe',name:'Probe Field'},true);
      if(!t1.ok || t2.ok || t2.reason!=='already-ticked') throw new Error('tick guard failed');
      if(!(mid.rations < before.rations)) throw new Error('tick should consume rations');
      var f1=lootForage(C), f2=lootForage(C);
      if(!f1.ok || f2.ok || f2.reason!=='already-foraged') throw new Error('forage once-per-turn guard failed');
      var bonus=lootSurvivalBridgeBonus(C);
      var keys=['supply','morale','fatigue','firepower','overall'];
      for(var i=0;i<keys.length;i++) if(Math.abs(bonus[keys[i]])>8) throw new Error('bonus too large: '+JSON.stringify(bonus));
      return { before:before, after:mid, bonus:bonus };
    });

    step('RESOLVE REWARD: battle outcome grants deterministic loot; survival remains inactive unless toggled', function(){
      var C=mkC('US'); _t1InitAll(C);
      var last=C.loot.survival.lastTurn;
      lootOnResolve('US','win',{id:'bullrun1',name:'First Bull Run',casualties:{US:800,CS:1800}},C,true);
      if(!C.loot.inventory.length) throw new Error('win should recover at least one item');
      if(C.loot.survival.lastTurn!==last) throw new Error('survival should not tick while inactive');
      var ids=C.loot.inventory.map(function(x){return x.id;}).join(',');
      return { count:C.loot.inventory.length, ids:ids };
    });

    step('PROSOPOGRAPHY: registry covers modeled generals and every tactical brigade token with provenance', function(){
      var C=mkC('CS'); _t1InitAll(C);
      var before=JSON.stringify(GAME_DATA.ratings);
      var reg=ssPersonRegistry(C);
      var after=JSON.stringify(GAME_DATA.ratings);
      if(before!==after) throw new Error('ssPersonRegistry mutated canonical ratings data');
      if(!(reg.people.length>80)) throw new Error('expected broad registry, got '+reg.people.length);
      if(!(reg.brigades>20)) throw new Error('expected modeled brigades, got '+reg.brigades);
      if(!(reg.authored>10 && reg.generated>50)) throw new Error('unexpected authored/generated split: '+JSON.stringify({a:reg.authored,g:reg.generated}));
      var gen=0;
      for(var i=0;i<reg.people.length;i++){ if(reg.people[i].generated){ gen++; if(reg.people[i].provenance!=='Inferred') throw new Error('generated person without Inferred provenance'); } }
      var sample=reg.people[0];
      var p=ssFindPerson(C,sample.pid);
      if(!p || p.pid!==sample.pid) throw new Error('ssFindPerson failed');
      return { people:reg.people.length, brigades:reg.brigades, authored:reg.authored, generated:reg.generated, first:sample.name };
    });

    step('D157 REPLACEMENTS: canonical Rhodes, McCarter, Watkins, and Chamberlain records overlay generated slots and hostile packs still reject', function(){
      var C=mkC('US'); _t1InitAll(C);
      var original=GAME_DATA['soldier-replacements'];
      if(!original || original.schema!=='cw_soldier_replacements_v1' || !Array.isArray(original.records)) throw new Error('missing D152 canonical pack');
      if(original.records.length!==4) throw new Error('canonical D157 pack should ship exactly four records, got '+original.records.length);
      var canonByPid={}, canonReplace={};
      for(var cr=0;cr<original.records.length;cr++){ canonByPid[original.records[cr].pid]=original.records[cr]; canonReplace[original.records[cr].replacePid]=1; }
      if(!canonByPid.person_bullrun_us_2ri_rhodes || canonByPid.person_bullrun_us_2ri_rhodes.replacePid!=='ss:bullrun1:US:us_burnside:pvt') throw new Error('missing D154 Rhodes canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_fredericksburg_us_116pa_mccarter || canonByPid.person_fredericksburg_us_116pa_mccarter.replacePid!=='ss:fredericksburg:US:us_irish:pvt') throw new Error('missing D155 McCarter canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_1tn_watkins || canonByPid.person_chickamauga_cs_1tn_watkins.replacePid!=='ss:chickamauga:CS:cs_cheatham_woods:pvt') throw new Error('missing D156 Watkins canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_us_20me_chamberlain || canonByPid.person_gettysburg_us_20me_chamberlain.replacePid!=='ss:gettysburg:US:us_20th_maine:cmd') throw new Error('missing D157 Chamberlain canonical record: '+JSON.stringify(original.records));
      GAME_DATA['soldier-replacements']={schema:'cw_soldier_replacements_v1',records:[]};
      var rawBase=ssPersonRegistry(C);
      GAME_DATA['soldier-replacements']=original;
      var canonical=ssValidateSoldierReplacementPack(original,{basePeople:rawBase.people});
      if(!canonical.ok || canonical.records.length!==4) throw new Error('canonical D157 pack should validate against raw generated registry: '+JSON.stringify(canonical));
      var base=ssPersonRegistry(C);
      if(base.people.length!==rawBase.people.length) throw new Error('canonical replacement should preserve registry length');
      if(base.replacements.applied!==4 || base.replacements.rejected!==0) throw new Error('canonical replacement should apply four rows cleanly: '+JSON.stringify(base.replacements));
      if(base.generated!==rawBase.generated-4 || base.authored!==rawBase.authored+4) throw new Error('canonical replacement should move four rows generated->authored: '+JSON.stringify({raw:{a:rawBase.authored,g:rawBase.generated},base:{a:base.authored,g:base.generated}}));
      var rhodesOld=ssFindPerson(C,'ss:bullrun1:US:us_burnside:pvt');
      var rhodes=ssFindPerson(C,'person_bullrun_us_2ri_rhodes');
      if(!rhodes || !rhodesOld || rhodesOld.pid!==rhodes.pid) throw new Error('Rhodes alias lookup failed');
      if(rhodes.generated || !rhodes.replacement || rhodes.provenance!=='Verified' || rhodes.name!=='Elisha Hunt Rhodes') throw new Error('Rhodes row not sourced/verified: '+JSON.stringify(rhodes));
      if(rhodes.rank!=='Private' || rhodes.team.regiment!=='2nd Rhode Island Infantry' || rhodes.team.company!=='Company D') throw new Error('Rhodes rank/unit mismatch: '+JSON.stringify(rhodes.team));
      if(!rhodes.bio || rhodes.bio.indexOf('First Bull Run')<0 || !rhodes.sourceNote || rhodes.sources.length<4) throw new Error('Rhodes source/bio payload missing');
      if(!rhodes.portrait || rhodes.portrait.assetKey!=='portraits/elisharhodes') throw new Error('Rhodes portrait metadata missing: '+JSON.stringify(rhodes.portrait));
      var mccarterOld=ssFindPerson(C,'ss:fredericksburg:US:us_irish:pvt');
      var mccarter=ssFindPerson(C,'person_fredericksburg_us_116pa_mccarter');
      if(!mccarter || !mccarterOld || mccarterOld.pid!==mccarter.pid) throw new Error('McCarter alias lookup failed');
      if(mccarter.generated || !mccarter.replacement || mccarter.provenance!=='Verified' || mccarter.name!=='William McCarter') throw new Error('McCarter row not sourced/verified: '+JSON.stringify(mccarter));
      if(mccarter.rank!=='Private' || mccarter.team.regiment!=='116th Pennsylvania Infantry' || mccarter.team.brigade.indexOf('Irish Brigade')<0 || mccarter.team.company) throw new Error('McCarter rank/unit mismatch: '+JSON.stringify(mccarter.team));
      if(!mccarter.bio || mccarter.bio.indexOf('Fredericksburg')<0 || mccarter.bio.indexOf('Marye')<0 || !mccarter.sourceNote || mccarter.sources.length<4) throw new Error('McCarter source/bio payload missing');
      if(mccarter.portrait) throw new Error('McCarter should not assert an unverified portrait: '+JSON.stringify(mccarter.portrait));
      var watkinsOld=ssFindPerson(C,'ss:chickamauga:CS:cs_cheatham_woods:pvt');
      var watkins=ssFindPerson(C,'person_chickamauga_cs_1tn_watkins');
      if(!watkins || !watkinsOld || watkinsOld.pid!==watkins.pid) throw new Error('Watkins alias lookup failed');
      if(watkins.generated || !watkins.replacement || watkins.provenance!=='Verified' || watkins.name!=='Sam R. Watkins') throw new Error('Watkins row not sourced/verified: '+JSON.stringify(watkins));
      if(watkins.rank!=='Private' || watkins.side!=='CS' || watkins.team.regiment!=='1st/27th Tennessee Infantry' || watkins.team.company!=='Company H, 1st Tennessee Infantry' || watkins.team.brigade!=='Maney\\'s Brigade' || watkins.team.division!=='Cheatham\\'s Division') throw new Error('Watkins rank/unit mismatch: '+JSON.stringify(watkins.team));
      if(!watkins.bio || watkins.bio.indexOf('Chickamauga')<0 || watkins.bio.indexOf('Co. Aytch')<0 || watkins.bio.indexOf('slavery')<0 || !watkins.sourceNote || watkins.sources.length<3) throw new Error('Watkins source/bio payload missing');
      if(watkins.portrait) throw new Error('Watkins should not assert an unverified portrait: '+JSON.stringify(watkins.portrait));
      var chamberlainOld=ssFindPerson(C,'ss:gettysburg:US:us_20th_maine:cmd');
      var chamberlain=ssFindPerson(C,'person_gettysburg_us_20me_chamberlain');
      if(!chamberlain || !chamberlainOld || chamberlainOld.pid!==chamberlain.pid) throw new Error('Chamberlain alias lookup failed');
      if(chamberlain.generated || !chamberlain.replacement || chamberlain.provenance!=='Verified' || chamberlain.name!=='Joshua L. Chamberlain') throw new Error('Chamberlain row not sourced/verified: '+JSON.stringify(chamberlain));
      if(chamberlain.rank!=='Col.' || chamberlain.side!=='US' || chamberlain.team.regiment!=='20th Maine Infantry' || chamberlain.team.brigade!=='Vincent\\'s Brigade' || chamberlain.team.corps!=='V Corps' || chamberlain.team.company) throw new Error('Chamberlain rank/unit mismatch: '+JSON.stringify(chamberlain.team));
      if(!chamberlain.bio || chamberlain.bio.indexOf('Little Round Top')<0 || chamberlain.bio.indexOf('bayonet')<0 || chamberlain.bio.indexOf('one man')<0 || !chamberlain.sourceNote || chamberlain.sources.length<4) throw new Error('Chamberlain source/bio payload missing');
      if(chamberlain.portrait) throw new Error('Chamberlain should not assert an unverified portrait: '+JSON.stringify(chamberlain.portrait));
      var target=findPerson(rawBase,function(p){ return p.generated && p.side==='US' && p.pid.indexOf(':pvt')>0 && !canonReplace[p.pid] && p.team && p.team.army; });
      var authored=findPerson(rawBase,function(p){ return !p.generated && p.provenance==='Verified'; });
      if(!target) throw new Error('no generated replacement target found');
      if(!authored) throw new Error('no authored row found for invalid target guard');
      var good=replacementPack(target);
      var valid=ssValidateSoldierReplacementPack(good,{basePeople:rawBase.people});
      if(!valid.ok || valid.records.length!==1) throw new Error('valid replacement fixture rejected: '+JSON.stringify(valid));
      var under=replacementPack(target,{sources:good.records[0].sources.slice(0,1)});
      if(ssValidateSoldierReplacementPack(under,{basePeople:rawBase.people}).ok) throw new Error('under-cited replacement should reject');
      var dup=replacementPack(target);
      dup.records.push(JSON.parse(JSON.stringify(dup.records[0])));
      dup.records[1].pid='person_d152_probe_replacement_2';
      if(ssValidateSoldierReplacementPack(dup,{basePeople:rawBase.people}).ok) throw new Error('duplicate replacePid should reject');
      var generatedBad=replacementPack(target,{generated:true});
      if(ssValidateSoldierReplacementPack(generatedBad,{basePeople:rawBase.people}).ok) throw new Error('generated-mislabelled replacement should reject');
      var inferredBad=replacementPack(target,{provenance:'Inferred'});
      if(ssValidateSoldierReplacementPack(inferredBad,{basePeople:rawBase.people}).ok) throw new Error('Inferred replacement should reject');
      var badTarget=replacementPack(target,{replacePid:authored.pid,pid:'person_d152_bad_authored_target'});
      if(ssValidateSoldierReplacementPack(badTarget,{basePeople:rawBase.people}).ok) throw new Error('replacement targeting authored row should reject');
      var badPortrait=replacementPack(target,{portrait:{assetKey:'../bad',alt:'x',caption:'x',credit:'x'}});
      if(ssValidateSoldierReplacementPack(badPortrait,{basePeople:rawBase.people}).ok) throw new Error('bad portrait assetKey should reject');
      var polluted=JSON.parse('{"schema":"cw_soldier_replacements_v1","records":[{"__proto__":{"polluted":true}}]}');
      var poll=ssValidateSoldierReplacementPack(polluted,{basePeople:rawBase.people});
      if(poll.ok || poll.errors.join('|').indexOf('forbidden key')<0) throw new Error('prototype-polluted pack should reject with forbidden-key error: '+JSON.stringify(poll));
      try {
        GAME_DATA['soldier-replacements']=good;
        var over=ssPersonRegistry(C);
        if(over.people.length!==rawBase.people.length) throw new Error('replacement should preserve registry length');
        if(over.generated!==rawBase.generated-1 || over.authored!==rawBase.authored+1) throw new Error('replacement should move one row generated->authored: '+JSON.stringify({base:{a:rawBase.authored,g:rawBase.generated},over:{a:over.authored,g:over.generated}}));
        if(!over.replacements || over.replacements.applied!==1 || over.replacements.rejected!==0) throw new Error('replacement apply summary wrong: '+JSON.stringify(over.replacements));
        var byOld=ssFindPerson(C,target.pid), byNew=ssFindPerson(C,'person_d152_probe_replacement');
        if(!byOld || !byNew || byOld.pid!==byNew.pid) throw new Error('replacement alias lookup failed');
        if(byNew.generated || !byNew.replacement || byNew.replaces!==target.pid || byNew.provenance!=='Verified' || byNew.sources.length!==2) throw new Error('replacement row not sourced/verified: '+JSON.stringify(byNew));
      } finally {
        GAME_DATA['soldier-replacements']=original;
      }
      var restored=ssPersonRegistry(C);
      if(restored.generated!==base.generated || restored.authored!==base.authored) throw new Error('canonical pack restore changed registry');
      return { canonicalRecords:original.records.length, rhodes:rhodes.pid, mccarter:mccarter.pid, watkins:watkins.pid, chamberlain:chamberlain.pid, target:target.pid, applied:base.replacements.applied, hostileRejected:true };
    });

    step('JOURNEY: play-as-anyone start enables survival and stores a saveable selected person without mutating canonical data', function(){
      var C=mkC('US'); _t1InitAll(C);
      var reg=ssPersonRegistry(C);
      var target=null, other=null;
      for(var i=0;i<reg.people.length;i++){ if(reg.people[i].side==='US' && !target){ target=reg.people[i]; } else if(reg.people[i].side==='US' && target && !other) { other=reg.people[i]; break; } }
      if(!target) throw new Error('no US person');
      var before=JSON.stringify(GAME_DATA.ratings);
      var res=ssStartJourney(C,target.pid,'bullrun1');
      var after=JSON.stringify(GAME_DATA.ratings);
      if(!res.ok || !C.loot.journey.enabled || C.loot.journey.personId!==target.pid) throw new Error('journey did not start');
      if(!lootSurvivalActive(C) || !C.loot.survival.enabled) throw new Error('journey should activate survival');
      if(before!==after) throw new Error('journey mutated canonical ratings data');
      var sv=JSON.parse(JSON.stringify(C.loot.journey));
      if(!sv.person || sv.person.pid!==target.pid) throw new Error('journey snapshot not saveable');
      if(sv.status!=='alive' || !Array.isArray(sv.career) || sv.career.length!==1 || sv.career[0].outcome!=='start') throw new Error('D151 journey start career/status missing: '+JSON.stringify(sv));
      if(!C.loot.people || !C.loot.people[target.pid] || C.loot.people[target.pid].status!=='alive') throw new Error('selected-person career summary missing from loot.people');
      if(other){
        var blocked=ssStartJourney(C,other.pid,'antietam');
        if(blocked.ok || blocked.reason!=='journey-active') throw new Error('journey restart should be blocked, got '+JSON.stringify(blocked));
        if(C.loot.journey.personId!==target.pid || C.loot.journey.battleId!=='bullrun1') throw new Error('blocked restart changed active journey');
      }
      return { person:target.name, pid:target.pid, battle:C.loot.journey.battleId, career:C.loot.journey.career.length, restartLocked:!!other };
    });

    step('JOURNEY D151: battle career persists, status/survival consequences apply, promotion hook is pure, report tie-in renders, and restart stays locked after load', function(){
      var C=mkC('US'); G.campaign=C; _t1InitAll(C);
      var reg=ssPersonRegistry(C);
      var target=findPerson(reg,function(p){ return p.side==='US' && p.generated && p.rank==='Private' && p.persona; });
      var other=findPerson(reg,function(p){ return p.side==='US' && p.pid!==target.pid; });
      if(!target) throw new Error('no generated US private with persona');
      var beforeRatings=JSON.stringify(GAME_DATA.ratings);
      var start=ssStartJourney(C,target.pid,'bullrun1');
      if(!start.ok) throw new Error('journey start failed: '+JSON.stringify(start));
      C.loot.survival.rations=90; C.loot.survival.exposure=10; C.loot.survival.disease=8; C.loot.survival.fatigue=10; C.loot.survival.morale=55;
      var first={ id:'bullrun1', name:'First Bull Run', playerSide:'US', enemySide:'CS', casualties:{US:500,CS:2200}, infl:{US:2200,CS:500}, bd:{id:'bullrun1',name:'First Bull Run'} };
      var r1=lootOnResolve('US','decisive',first,C,true);
      var J=C.loot.journey;
      if(!J.enabled || J.personId!==target.pid) throw new Error('journey lost after resolve');
      if(J.battles!==1 || J.lastBattleId!=='bullrun1' || J.lastOutcome!=='victory') throw new Error('battle association missing after win: '+JSON.stringify(J));
      if(J.status!=='alive') throw new Error('low-risk victory should leave soldier alive, got '+J.status);
      if(J.person.rank!=='Sergeant' || J.promotionCount!==1) throw new Error('decisive win should promote Private to Sergeant through fldPromotePerson: '+JSON.stringify({rank:J.person.rank,promos:J.promotionCount}));
      if(!J.person.persona || J.person.persona.command < target.persona.command) throw new Error('promoted journey person should retain lifted persona copy');
      if(!J.career || J.career.length<2 || !J.career[J.career.length-1].promoted) throw new Error('promoted career entry missing: '+JSON.stringify(J.career));
      if(JSON.stringify(GAME_DATA.ratings)!==beforeRatings) throw new Error('D151 promotion mutated canonical ratings');
      var afterWinBridge=lootSurvivalBridgeBonus(C);
      C.president.turn=1;
      var beforeLoss=clone(C.loot.survival);
      var second={ id:'antietam', name:'Antietam', playerSide:'US', enemySide:'CS', casualties:{US:2500,CS:300}, infl:{US:300,CS:2500}, bd:{id:'antietam',name:'Antietam'} };
      lootOnResolve('CS','decisive',second,C,false);
      J=C.loot.journey;
      if(J.battles!==2 || J.lastBattleId!=='antietam' || J.lastOutcome!=='defeat') throw new Error('battle association missing after defeat: '+JSON.stringify(J));
      if(J.status!=='captured') throw new Error('decisive high-casualty defeat should mark captured, got '+J.status);
      if(!(C.loot.survival.fatigue > beforeLoss.fatigue) || !(C.loot.survival.morale < beforeLoss.morale) || !(C.loot.survival.rations < beforeLoss.rations)) throw new Error('captured status did not apply bounded survival consequences: '+JSON.stringify({before:beforeLoss,after:C.loot.survival}));
      var capturedBridge=lootSurvivalBridgeBonus(C);
      if(!(capturedBridge.morale < afterWinBridge.morale || capturedBridge.fatigue > afterWinBridge.fatigue)) throw new Error('captured status should affect active bridge facets: '+JSON.stringify({afterWinBridge:afterWinBridge,capturedBridge:capturedBridge}));
      if(!C.loot.people[target.pid] || C.loot.people[target.pid].status!=='captured' || C.loot.people[target.pid].career.length<2) throw new Error('loot.people selected career summary did not persist latest status');
      var report=ssJourneyReportHTML(C,{compact:true});
      if(report.indexOf("The Soldier&apos;s Story")<0 || report.indexOf('Antietam')<0 || report.indexOf('Captured')<0 || report.indexOf('Sergeant')<0) throw new Error('journey report tie-in missing details: '+report);
      var aar=aarRenderReport(C,{final:false});
      if(aar.indexOf("The Soldier&apos;s Story")<0 || aar.indexOf('Antietam')<0) throw new Error('after-action report missing Soldier Story tie-in');
      var sv=serializeSave();
      applySave(JSON.parse(JSON.stringify(sv)));
      lootInit(G.campaign);
      if(G.campaign.loot.journey.personId!==target.pid || G.campaign.loot.journey.status!=='captured' || G.campaign.loot.journey.career.length<3) throw new Error('save/load lost D151 journey state');
      var blocked=ssStartJourney(G.campaign,other.pid,'gettysburg');
      if(blocked.ok || blocked.reason!=='journey-active' || G.campaign.loot.journey.personId!==target.pid) throw new Error('D149/D150 restart lock failed after D151 save/load');
      var bad=serializeSave();
      bad.campaign.loot.journey.career=new Array(50).fill({turn:999,battleId:'x'.repeat(300),battleName:'y'.repeat(300),outcome:'bogus',status:'ghost',note:'z'.repeat(500),casualties:{suffered:9999999,inflicted:9999999}});
      bad.campaign.loot.journey.status='ghost';
      bad.campaign.loot.journey.person.persona={command:999,tactical:-5,constructor:77};
      applySave(JSON.parse(JSON.stringify(bad)));
      lootInit(G.campaign);
      if(G.campaign.loot.journey.career.length!==18) throw new Error('tampered career should cap at 18');
      if(G.campaign.loot.journey.status!=='alive') throw new Error('tampered status should sanitize to alive');
      if(G.campaign.loot.journey.person.persona.command!==100 || G.campaign.loot.journey.person.persona.tactical!==0 || Object.prototype.hasOwnProperty.call(G.campaign.loot.journey.person.persona,'constructor')) throw new Error('tampered persona should clamp and scrub bad keys: '+JSON.stringify(G.campaign.loot.journey.person.persona));
      return { pid:target.pid, rank:J.person.rank, status:'captured', career:J.career.length, report:true };
    });

    step('SAVE/LOAD TAMPERING: save-slot import rejects bad settings and restored loot is sanitized before use', function(){
      if(typeof serializeSave!=='function' || typeof applySave!=='function' || typeof _slImportText!=='function') throw new Error('save-slot helpers missing');
      var C=mkC('US'); G.campaign=C; _t1InitAll(C);
      lootAddItem(C,'captured_enfield_crate',1,'probe');
      var sv=serializeSave();
      var bad=clone(sv);
      bad.settings = JSON.parse('{"hasOwnProperty":"shadow"}');
      var badRes=_slImportText(JSON.stringify(bad));
      if(badRes.ok) throw new Error('bad settings import should be rejected');
      sv.campaign.loot = {
        inventory:[{id:'captured_enfield_crate',qty:99},{id:'captured_enfield_crate',qty:99},{id:'battle_flag_fragment',qty:50}],
        equipped:JSON.parse('{"weapon":"captured_enfield_crate","hasOwnProperty":"shadow"}'),
        survival:{enabled:'true',rations:100,morale:100,fatigue:0,exposure:0,disease:0,lastTurn:999,forageTurn:999},
        journey:{enabled:'true',personId:'ghost',person:{pid:'ghost',name:'Ghost',side:'US',rank:'Private',ovr:999},log:['tampered']}
      };
      var ok=_slImportText(JSON.stringify(sv));
      if(!ok.ok) throw new Error('valid save import failed: '+JSON.stringify(ok));
      var leak=lootSurvivalBridgeBonus(G.campaign);
      if(JSON.stringify(leak)!==JSON.stringify({supply:0,morale:0,fatigue:0,firepower:0,overall:0})) throw new Error('pre-init restored tamper leaked: '+JSON.stringify(leak));
      openWarDept();
      lootInit(G.campaign);
      var q=G.campaign.loot.inventory.filter(function(x){return x.id==='captured_enfield_crate';})[0].qty;
      if(q!==1) throw new Error('restored equip stack should clamp to 1, got '+q);
      if(G.campaign.loot.survival.enabled!==false) throw new Error('restored string enabled should sanitize false');
      if(G.campaign.loot.journey.enabled!==false) throw new Error('restored string journey should sanitize false');
      return { imported:true, q:q, survival:G.campaign.loot.survival.enabled };
    });

    step('UI D150: Army Register is searchable, filterable, detailed, provenance-marked, and journey-start locked', function(){
      var C=mkC('US'); G.campaign=C; _t1InitAll(C);
      lootAddItem(C,'commissary_rations',1,'probe');
      var reg=ssPersonRegistry(C);
      if(reg.people.length!==603) throw new Error('expected current 603-person registry, got '+reg.people.length);
      var generated=findPerson(reg,function(p){ return p.generated && p.team && p.team.brigade && p.team.company; });
      var authored=findPerson(reg,function(p){ return !p.generated && p.provenance==='Verified'; });
      if(!generated) throw new Error('no generated person with brigade/company team hierarchy');
      if(!authored) throw new Error('no authored Verified person for provenance display');
      openWarDept();
      var tab=document.getElementById('wdTab_loot');
      if(!tab) throw new Error('missing Campaign Kit tab button');
      tab.click();
      var cont=document.getElementById('wdContent');
      var txt=cont ? cont.textContent : '';
      if(txt.indexOf('Campaign Kit')<0 || txt.indexOf('Inventory')<0 || txt.indexOf('Survival')<0 || txt.indexOf("The Soldier's Story")<0) throw new Error('missing loot tab sections: '+txt.slice(0,200));
      var sel=cont.querySelector('#ssPersonSelect');
      if(!sel || sel.options.length!==reg.people.length) throw new Error('full play-as selector missing people: '+(sel&&sel.options.length)+' vs '+reg.people.length);
      var root=cont.querySelector('#ssArmyRegister');
      if(!root) throw new Error('missing Army Register root');
      var cards=root.querySelectorAll('[data-ss-card]');
      if(cards.length!==reg.people.length) throw new Error('register card count mismatch '+cards.length+' vs '+reg.people.length);
      var count=root.querySelector('#ssRegCount');
      if(!count || count.textContent.indexOf('603 of 603')<0) throw new Error('full registry count missing: '+(count&&count.textContent));
      var gCard=cardByPid(root,generated.pid), aCard=cardByPid(root,authored.pid);
      if(!gCard || !aCard) throw new Error('target cards missing');
      if(gCard.textContent.indexOf('Generated')<0 || gCard.textContent.indexOf('Inferred')<0) throw new Error('generated/Inferred card display missing: '+gCard.textContent);
      if(aCard.textContent.indexOf('Authored')<0 || aCard.textContent.indexOf('Verified')<0) throw new Error('authored/Verified card display missing: '+aCard.textContent);
      var rhodesCard=cardByPid(root,'person_bullrun_us_2ri_rhodes');
      if(!rhodesCard) throw new Error('Rhodes sourced replacement card missing');
      if(rhodesCard.textContent.indexOf('Elisha Hunt Rhodes')<0 || rhodesCard.textContent.indexOf('Sourced')<0 || rhodesCard.textContent.indexOf('Verified')<0) throw new Error('Rhodes card source/provenance missing: '+rhodesCard.textContent);
      rhodesCard.querySelector('[data-ss-pick]').click();
      var rhodesDetail=root.querySelector('#ssPersonDetailCard');
      if(!rhodesDetail || rhodesDetail.getAttribute('data-ss-detail-pid')!=='person_bullrun_us_2ri_rhodes') throw new Error('Rhodes detail did not select');
      var rtxt=rhodesDetail.textContent;
      if(rtxt.indexOf('2nd Rhode Island Infantry')<0 || rtxt.indexOf('Company D')<0 || rtxt.indexOf('First Bull Run')<0 || rtxt.indexOf('Source note:')<0 || rtxt.indexOf('Sources (4)')<0) throw new Error('Rhodes detail source/bio/unit payload missing: '+rtxt);
      var rimg=rhodesDetail.querySelector('.ss-person-portrait img');
      if(!rimg || (rimg.getAttribute('src')||'').indexOf('data:image/jpeg')!==0 || (rimg.getAttribute('alt')||'').indexOf('officer uniform')<0) throw new Error('Rhodes portrait did not render from embedded JPEG');
      var mccarterCard=cardByPid(root,'person_fredericksburg_us_116pa_mccarter');
      if(!mccarterCard) throw new Error('McCarter sourced replacement card missing');
      if(mccarterCard.textContent.indexOf('William McCarter')<0 || mccarterCard.textContent.indexOf('Sourced')<0 || mccarterCard.textContent.indexOf('Verified')<0) throw new Error('McCarter card source/provenance missing: '+mccarterCard.textContent);
      mccarterCard.querySelector('[data-ss-pick]').click();
      var mccarterDetail=root.querySelector('#ssPersonDetailCard');
      if(!mccarterDetail || mccarterDetail.getAttribute('data-ss-detail-pid')!=='person_fredericksburg_us_116pa_mccarter') throw new Error('McCarter detail did not select');
      var mtxt=mccarterDetail.textContent;
      if(mtxt.indexOf('116th Pennsylvania Infantry')<0 || mtxt.indexOf('Irish Brigade')<0 || mtxt.indexOf('Fredericksburg')<0 || mtxt.indexOf('Source note:')<0 || mtxt.indexOf('Sources (4)')<0) throw new Error('McCarter detail source/bio/unit payload missing: '+mtxt);
      if(mccarterDetail.querySelector('.ss-person-portrait')) throw new Error('McCarter should not render an unverified portrait');
      var watkinsCard=cardByPid(root,'person_chickamauga_cs_1tn_watkins');
      if(!watkinsCard) throw new Error('Watkins sourced replacement card missing');
      if(watkinsCard.textContent.indexOf('Sam R. Watkins')<0 || watkinsCard.textContent.indexOf('Sourced')<0 || watkinsCard.textContent.indexOf('Verified')<0) throw new Error('Watkins card source/provenance missing: '+watkinsCard.textContent);
      watkinsCard.querySelector('[data-ss-pick]').click();
      var watkinsDetail=root.querySelector('#ssPersonDetailCard');
      if(!watkinsDetail || watkinsDetail.getAttribute('data-ss-detail-pid')!=='person_chickamauga_cs_1tn_watkins') throw new Error('Watkins detail did not select');
      var wtxt=watkinsDetail.textContent;
      if(wtxt.indexOf('1st/27th Tennessee Infantry')<0 || wtxt.indexOf('Company H, 1st Tennessee Infantry')<0 || wtxt.indexOf('Maney')<0 || wtxt.indexOf('Cheatham')<0 || wtxt.indexOf('Chickamauga')<0 || wtxt.indexOf('Co. Aytch')<0 || wtxt.indexOf('Source note:')<0 || wtxt.indexOf('Sources (3)')<0) throw new Error('Watkins detail source/bio/unit payload missing: '+wtxt);
      if(watkinsDetail.querySelector('.ss-person-portrait')) throw new Error('Watkins should not render an unverified portrait');
      var chamberlainCard=cardByPid(root,'person_gettysburg_us_20me_chamberlain');
      if(!chamberlainCard) throw new Error('Chamberlain sourced replacement card missing');
      if(chamberlainCard.textContent.indexOf('Joshua L. Chamberlain')<0 || chamberlainCard.textContent.indexOf('Sourced')<0 || chamberlainCard.textContent.indexOf('Verified')<0) throw new Error('Chamberlain card source/provenance missing: '+chamberlainCard.textContent);
      chamberlainCard.querySelector('[data-ss-pick]').click();
      var chamberlainDetail=root.querySelector('#ssPersonDetailCard');
      if(!chamberlainDetail || chamberlainDetail.getAttribute('data-ss-detail-pid')!=='person_gettysburg_us_20me_chamberlain') throw new Error('Chamberlain detail did not select');
      var ctxt=chamberlainDetail.textContent;
      if(ctxt.indexOf('20th Maine Infantry')<0 || ctxt.indexOf('Vincent')<0 || ctxt.indexOf('V Corps')<0 || ctxt.indexOf('Little Round Top')<0 || ctxt.indexOf('bayonet')<0 || ctxt.indexOf('Source note:')<0 || ctxt.indexOf('Sources (4)')<0) throw new Error('Chamberlain detail source/bio/unit payload missing: '+ctxt);
      if(chamberlainDetail.querySelector('.ss-person-portrait')) throw new Error('Chamberlain should not render an unverified portrait');

      var search=root.querySelector('#ssRegSearch'), side=root.querySelector('#ssRegSide'), rank=root.querySelector('#ssRegRank'), prov=root.querySelector('#ssRegProv'), unit=root.querySelector('#ssRegUnit');
      if(!search || !side || !rank || !prov || !unit) throw new Error('missing register controls');
      setCtl(search, generated.name, 'input');
      var vis=visibleCards(root);
      if(!vis.length || !cardByPid(root,generated.pid) || cardByPid(root,generated.pid).style.display==='none') throw new Error('search did not reveal target '+generated.name);
      if(!(vis.length<cards.length)) throw new Error('search did not narrow registry');
      setCtl(search,'','input');
      setCtl(side,'CS');
      vis=visibleCards(root);
      if(!vis.length) throw new Error('side filter empty');
      for(var si=0;si<vis.length;si++) if(vis[si].getAttribute('data-ss-side')!=='CS') throw new Error('side filter leaked '+vis[si].getAttribute('data-ss-side'));
      setCtl(side,'');
      setCtl(rank,generated.rank);
      vis=visibleCards(root);
      if(!vis.length) throw new Error('rank filter empty for '+generated.rank);
      for(var ri=0;ri<vis.length;ri++) if(vis[ri].getAttribute('data-ss-rank')!==generated.rank) throw new Error('rank filter leaked '+vis[ri].getAttribute('data-ss-rank'));
      setCtl(rank,'');
      setCtl(prov,'Verified');
      vis=visibleCards(root);
      if(!vis.length) throw new Error('provenance filter empty');
      for(var pi=0;pi<vis.length;pi++) if(vis[pi].getAttribute('data-ss-prov')!=='Verified') throw new Error('provenance filter leaked '+vis[pi].getAttribute('data-ss-prov'));
      setCtl(prov,'');
      setCtl(unit,generated.team.brigade);
      vis=visibleCards(root);
      if(!vis.length) throw new Error('unit filter empty for '+generated.team.brigade);
      for(var ui=0;ui<vis.length;ui++) if(vis[ui].getAttribute('data-ss-unit')!==generated.team.brigade) throw new Error('unit filter leaked '+vis[ui].getAttribute('data-ss-unit'));

      gCard=cardByPid(root,generated.pid);
      var details=gCard.querySelector('[data-ss-pick]');
      if(!details) throw new Error('missing card detail button');
      details.click();
      var detail=root.querySelector('#ssPersonDetailCard');
      if(!detail || detail.getAttribute('data-ss-detail-pid')!==generated.pid) throw new Error('detail card did not select generated target');
      var dt=detail.textContent;
      if(dt.indexOf(generated.name)<0 || dt.indexOf('Team Hierarchy')<0 || dt.indexOf('Brigade')<0 || dt.indexOf('Company')<0) throw new Error('detail hierarchy missing: '+dt);
      if(dt.indexOf('Generated')<0 || dt.indexOf('Inferred')<0) throw new Error('detail provenance/source missing: '+dt);

      var start=gCard.querySelector('[data-ss-start]');
      if(!start || start.disabled) throw new Error('missing enabled card journey start');
      start.click();
      if(!C.loot || !C.loot.journey || C.loot.journey.personId!==generated.pid) throw new Error('card did not start selected journey: '+(C.loot&&C.loot.journey&&C.loot.journey.personId)+' vs '+generated.pid);
      if(!lootSurvivalActive(C)) throw new Error('card journey should activate survival');
      cont=document.getElementById('wdContent');
      var disabled=cont && cont.querySelector('#ssBeginSelected');
      if(!disabled || !disabled.disabled || disabled.textContent.indexOf('Journey Active')<0) throw new Error('active journey UI should block restart');
      var disabledCard=cont && cont.querySelector('[data-ss-start]');
      if(!disabledCard || !disabledCard.disabled || disabledCard.textContent.indexOf('Journey Active')<0) throw new Error('active journey card starts should be disabled');
      return { text:txt.slice(0,120), cards:cards.length, search:generated.name, unit:generated.team.brigade, started:generated.pid, restartDisabled:disabled.disabled };
    });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) {
    srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'});
    for(let i=0;i<80;i++){ if(await up(probe)) break; await sleep(150); }
  }
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
    const shotPath = join(OUT, 'probe-loot-survival.png');
    await page.screenshot({ path: shotPath, fullPage:false });
    const shot = statSync(shotPath);
    result.screenshot = { path: shotPath, bytes: shot.size };
    if (!shot.size) result.ok = false;
    result.pageerrors = pageerrors;
    if (pageerrors.length) result.ok = false;
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-loot-survival.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-loot-survival ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.screenshot) console.log('  screenshot ' + result.screenshot.path + ' bytes=' + result.screenshot.bytes);
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
