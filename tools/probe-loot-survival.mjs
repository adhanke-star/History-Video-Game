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

    step('D421 REPLACEMENTS: forty-two canonical sourced records overlay generated slots and hostile packs still reject', function(){
      var C=mkC('US'); _t1InitAll(C);
      var original=GAME_DATA['soldier-replacements'];
      if(!original || original.schema!=='cw_soldier_replacements_v1' || !Array.isArray(original.records)) throw new Error('missing D152 canonical pack');
      if(original.records.length!==42) throw new Error('canonical pack should ship exactly forty-two records, got '+original.records.length);   // D421: 39 -> 42 — Fleetwood/Beaty/Gardiner at New Market Heights; D358: 31 -> 39
      var canonByPid={}, canonReplace={};
      for(var cr=0;cr<original.records.length;cr++){ canonByPid[original.records[cr].pid]=original.records[cr]; canonReplace[original.records[cr].replacePid]=1; }
      if(!canonByPid.person_bullrun_us_2ri_rhodes || canonByPid.person_bullrun_us_2ri_rhodes.replacePid!=='ss:bullrun1:US:us_burnside:pvt') throw new Error('missing D154 Rhodes canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_fredericksburg_us_116pa_mccarter || canonByPid.person_fredericksburg_us_116pa_mccarter.replacePid!=='ss:fredericksburg:US:us_irish:pvt') throw new Error('missing D155 McCarter canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_1tn_watkins || canonByPid.person_chickamauga_cs_1tn_watkins.replacePid!=='ss:chickamauga:CS:cs_cheatham_woods:pvt') throw new Error('missing D156 Watkins canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_us_20me_chamberlain || canonByPid.person_gettysburg_us_20me_chamberlain.replacePid!=='ss:gettysburg:US:us_20th_maine:cmd') throw new Error('missing D157 Chamberlain canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_us_battery_a_cushing || canonByPid.person_gettysburg_us_battery_a_cushing.replacePid!=='ss:gettysburg:US:us_cushing_battery:cmd') throw new Error('missing D158 Cushing canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_us_vincent_bde || canonByPid.person_gettysburg_us_vincent_bde.replacePid!=='ss:gettysburg:US:us_vincent_bde:cmd') throw new Error('missing D172 Vincent canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_shiloh_us_61il_stillwell || canonByPid.person_shiloh_us_61il_stillwell.replacePid!=='ss:shiloh:US:us_prentiss:nco') throw new Error('missing D214 Stillwell canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_antietam_us_battery_b_cook || canonByPid.person_antietam_us_battery_b_cook.replacePid!=='ss:antietam:US:us_battery_b:nco') throw new Error('missing D215 Cook canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_vicksburg_us_55il_howe || canonByPid.person_vicksburg_us_55il_howe.replacePid!=='ss:vicksburg:US:us_blair_stockade:pvt') throw new Error('missing D216 Howe canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_us_6wi_waller || canonByPid.person_gettysburg_us_6wi_waller.replacePid!=='ss:gettysburg:US:us_iron_bde:nco') throw new Error('missing D217 Waller canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_antietam_us_battery_e_benjamin || canonByPid.person_antietam_us_battery_e_benjamin.replacePid!=='ss:antietam:US:us_benjamin:cmd') throw new Error('missing D218 Benjamin canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_antietam_us_61ny_barlow || canonByPid.person_antietam_us_61ny_barlow.replacePid!=='ss:antietam:US:us_barlow:cmd') throw new Error('missing D219 Barlow canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_antietam_cs_21va_worsham || canonByPid.person_antietam_cs_21va_worsham.replacePid!=='ss:antietam:CS:cs_jr_jones:pvt') throw new Error('missing D220 Worsham canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_us_2ri_ballou || canonByPid.person_bullrun_us_2ri_ballou.replacePid!=='ss:bullrun1:US:us_burnside:cmd') throw new Error('missing D221 Ballou canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_us_webb_phila_bde || canonByPid.person_gettysburg_us_webb_phila_bde.replacePid!=='ss:gettysburg:US:us_phila_bde:cmd') throw new Error('missing D222 Webb canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chancellorsville_cs_33va_casler || canonByPid.person_chancellorsville_cs_33va_casler.replacePid!=='ss:chancellorsville:CS:cs_colston_div:pvt') throw new Error('missing D239 Casler canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_shiloh_cs_6ar_stanley || canonByPid.person_shiloh_cs_6ar_stanley.replacePid!=='ss:shiloh:CS:cs_hardee_corps:pvt') throw new Error('missing D289 Stanley canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_cs_1va_dooley || canonByPid.person_gettysburg_cs_1va_dooley.replacePid!=='ss:gettysburg:CS:cs_pickett_div:cmd') throw new Error('missing D289 Dooley canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_us_19ma_decastro || canonByPid.person_gettysburg_us_19ma_decastro.replacePid!=='ss:gettysburg:US:us_gibbon_bdes:nco') throw new Error('missing D289 De Castro canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chancellorsville_cs_1sc_benson || canonByPid.person_chancellorsville_cs_1sc_benson.replacePid!=='ss:chancellorsville:CS:cs_ap_hill_div:nco') throw new Error('missing D290 Benson canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_9ky_green || canonByPid.person_chickamauga_cs_9ky_green.replacePid!=='ss:chickamauga:CS:cs_breck_rock:nco') throw new Error('missing D290 Green canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_vicksburg_cs_3la_tunnard || canonByPid.person_vicksburg_cs_3la_tunnard.replacePid!=='ss:vicksburg:CS:cs_3rd_louisiana:nco') throw new Error('missing D290 Tunnard canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_4tx_giles || canonByPid.person_chickamauga_cs_4tx_giles.replacePid!=='ss:chickamauga:CS:cs_law_gap:nco') throw new Error('missing D291 Giles canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_vicksburg_cs_46ms_chambers || canonByPid.person_vicksburg_cs_46ms_chambers.replacePid!=='ss:vicksburg:CS:cs_smith_stockade:nco') throw new Error('missing D291 Chambers canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_shiloh_cs_2tx_houston || canonByPid.person_shiloh_cs_2tx_houston.replacePid!=='ss:shiloh:CS:cs_bragg_corps:pvt') throw new Error('missing D291 Houston canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_9ky_jackman || canonByPid.person_chickamauga_cs_9ky_jackman.replacePid!=='ss:chickamauga:CS:cs_breck_rock:pvt') throw new Error('missing D293 Jackman canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_4tx_west || canonByPid.person_chickamauga_cs_4tx_west.replacePid!=='ss:chickamauga:CS:cs_law_gap:pvt') throw new Error('missing D294 West canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_3sc_simpson || canonByPid.person_chickamauga_cs_3sc_simpson.replacePid!=='ss:chickamauga:CS:cs_kershaw_rock:nco') throw new Error('missing D295 Simpson canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_gettysburg_us_17me_haley || canonByPid.person_gettysburg_us_17me_haley.replacePid!=='ss:gettysburg:US:us_birney_iii:pvt') throw new Error('missing D296 Haley canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_johnson_gap || canonByPid.person_chickamauga_cs_johnson_gap.replacePid!=='ss:chickamauga:CS:cs_johnson_gap:cmd') throw new Error('missing D297 Johnson canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_chickamauga_cs_hood_arrives || canonByPid.person_chickamauga_cs_hood_arrives.replacePid!=='ss:chickamauga:CS:cs_hood_arrives:cmd') throw new Error('missing D298 Hood canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_us_sherman_bde || canonByPid.person_bullrun_us_sherman_bde.replacePid!=='ss:bullrun1:US:us_sherman:cmd') throw new Error('missing D358 Sherman canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_us_porter_bde || canonByPid.person_bullrun_us_porter_bde.replacePid!=='ss:bullrun1:US:us_porter:cmd') throw new Error('missing D358 Porter canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_us_howard_bde || canonByPid.person_bullrun_us_howard_bde.replacePid!=='ss:bullrun1:US:us_howard:cmd') throw new Error('missing D358 Howard canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_us_griffin_battery || canonByPid.person_bullrun_us_griffin_battery.replacePid!=='ss:bullrun1:US:us_griffin:cmd') throw new Error('missing D358 Griffin canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_cs_evans_demibde || canonByPid.person_bullrun_cs_evans_demibde.replacePid!=='ss:bullrun1:CS:cs_evans:cmd') throw new Error('missing D358 Evans canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_cs_bee_bde || canonByPid.person_bullrun_cs_bee_bde.replacePid!=='ss:bullrun1:CS:cs_bee:cmd') throw new Error('missing D358 Bee canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_cs_bartow_bde || canonByPid.person_bullrun_cs_bartow_bde.replacePid!=='ss:bullrun1:CS:cs_bartow:cmd') throw new Error('missing D358 Bartow canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_bullrun_cs_hampton_legion || canonByPid.person_bullrun_cs_hampton_legion.replacePid!=='ss:bullrun1:CS:cs_hampton:cmd') throw new Error('missing D358 Hampton canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_new_market_heights_us_4usct_fleetwood || canonByPid.person_new_market_heights_us_4usct_fleetwood.replacePid!=='ss:newMarketHeights:US:us_4th:nco') throw new Error('missing D421 Fleetwood canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_new_market_heights_us_5usct_beaty || canonByPid.person_new_market_heights_us_5usct_beaty.replacePid!=='ss:newMarketHeights:US:us_5th:nco') throw new Error('missing D421 Beaty canonical record: '+JSON.stringify(original.records));
      if(!canonByPid.person_new_market_heights_us_36usct_gardiner || canonByPid.person_new_market_heights_us_36usct_gardiner.replacePid!=='ss:newMarketHeights:US:us_36th:pvt') throw new Error('missing D421 Gardiner canonical record: '+JSON.stringify(original.records));
      GAME_DATA['soldier-replacements']={schema:'cw_soldier_replacements_v1',records:[]};
      var rawBase=ssPersonRegistry(C);
      GAME_DATA['soldier-replacements']=original;
      var canonical=ssValidateSoldierReplacementPack(original,{basePeople:rawBase.people});
      if(!canonical.ok || canonical.records.length!==42) throw new Error('canonical pack should validate against raw generated registry: '+JSON.stringify(canonical));   // D421: 39 -> 42
      var base=ssPersonRegistry(C);
      if(base.people.length!==rawBase.people.length) throw new Error('canonical replacement should preserve registry length');
      if(base.replacements.applied!==42 || base.replacements.rejected!==0) throw new Error('canonical replacement should apply forty-two rows cleanly: '+JSON.stringify(base.replacements));   // D421: 39 -> 42
      if(base.generated!==rawBase.generated-42 || base.authored!==rawBase.authored+42) throw new Error('canonical replacement should move forty-two rows generated->authored: '+JSON.stringify({raw:{a:rawBase.authored,g:rawBase.generated},base:{a:base.authored,g:base.generated}}));   // D421: 39 -> 42
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
      var cushingOld=ssFindPerson(C,'ss:gettysburg:US:us_cushing_battery:cmd');
      var cushing=ssFindPerson(C,'person_gettysburg_us_battery_a_cushing');
      if(!cushing || !cushingOld || cushingOld.pid!==cushing.pid) throw new Error('Cushing alias lookup failed');
      if(cushing.generated || !cushing.replacement || cushing.provenance!=='Verified' || cushing.name!=='Alonzo H. Cushing') throw new Error('Cushing row not sourced/verified: '+JSON.stringify(cushing));
      if(cushing.rank!=='1st Lt.' || cushing.side!=='US' || cushing.branch!=='art' || cushing.team.regiment!=='4th U.S. Artillery' || cushing.team.company!=='Battery A' || cushing.team.corps!=='II Corps') throw new Error('Cushing rank/unit mismatch: '+JSON.stringify(cushing.team));
      if(!cushing.bio || cushing.bio.indexOf('Battery A')<0 || cushing.bio.indexOf('Pickett')<0 || cushing.bio.indexOf('killed')<0 || !cushing.sourceNote || cushing.sources.length<3) throw new Error('Cushing source/bio payload missing');
      if(cushing.portrait) throw new Error('Cushing should not assert an unverified portrait: '+JSON.stringify(cushing.portrait));
      var vincentOld=ssFindPerson(C,'ss:gettysburg:US:us_vincent_bde:cmd');
      var vincent=ssFindPerson(C,'person_gettysburg_us_vincent_bde');
      if(!vincent || !vincentOld || vincentOld.pid!==vincent.pid) throw new Error('Vincent alias lookup failed');
      if(vincent.generated || !vincent.replacement || vincent.provenance!=='Verified' || vincent.name!=='Strong Vincent') throw new Error('Vincent row not sourced/verified: '+JSON.stringify(vincent));
      if(vincent.rank!=='Col.' || vincent.side!=='US' || vincent.branch!=='inf' || vincent.team.brigade!=='Vincent\\'s Brigade' || vincent.team.division!=='First Division' || vincent.team.corps!=='V Corps' || vincent.team.company || vincent.team.regiment) throw new Error('Vincent rank/unit mismatch: '+JSON.stringify(vincent.team));
      if(!vincent.bio || vincent.bio.indexOf('Little Round Top')<0 || vincent.bio.indexOf('20th Maine')<0 || vincent.bio.indexOf('died on July 7')<0 || !vincent.sourceNote || vincent.sources.length<3) throw new Error('Vincent source/bio payload missing');
      if(vincent.sourceNote.indexOf('no company')<0 || vincent.sourceNote.indexOf('no portrait')<0 || vincent.sourceNote.indexOf('brigadier-rank-at-battle')<0) throw new Error('Vincent honesty caveats missing: '+vincent.sourceNote);
      if(vincent.portrait) throw new Error('Vincent should not assert an unverified portrait: '+JSON.stringify(vincent.portrait));
      var stillwellOld=ssFindPerson(C,'ss:shiloh:US:us_prentiss:nco');
      var stillwell=ssFindPerson(C,'person_shiloh_us_61il_stillwell');
      if(!stillwell || !stillwellOld || stillwellOld.pid!==stillwell.pid) throw new Error('Stillwell alias lookup failed');
      if(stillwell.generated || !stillwell.replacement || stillwell.provenance!=='Verified' || stillwell.name!=='Leander Stillwell') throw new Error('Stillwell row not sourced/verified: '+JSON.stringify(stillwell));
      if(stillwell.rank!=='Corporal' || stillwell.side!=='US' || stillwell.branch!=='inf' || stillwell.team.regiment!=='61st Illinois Infantry' || stillwell.team.company!=='Company D' || stillwell.team.division.indexOf('Prentiss')<0) throw new Error('Stillwell rank/unit mismatch: '+JSON.stringify(stillwell.team));
      if(!stillwell.bio || stillwell.bio.indexOf('Shiloh')<0 || stillwell.bio.indexOf('Common Soldier')<0 || !stillwell.sourceNote || stillwell.sources.length<4) throw new Error('Stillwell source/bio payload missing');
      if(stillwell.sourceNote.indexOf('no higher rank')<0 || stillwell.sourceNote.indexOf('no portrait')<0) throw new Error('Stillwell honesty caveats missing: '+stillwell.sourceNote);
      if(stillwell.portrait) throw new Error('Stillwell should not assert an unverified portrait: '+JSON.stringify(stillwell.portrait));
      var cookOld=ssFindPerson(C,'ss:antietam:US:us_battery_b:nco');
      var cook=ssFindPerson(C,'person_antietam_us_battery_b_cook');
      if(!cook || !cookOld || cookOld.pid!==cook.pid) throw new Error('Cook alias lookup failed');
      if(cook.generated || !cook.replacement || cook.provenance!=='Verified' || cook.name!=='John Cook') throw new Error('Cook row not sourced/verified: '+JSON.stringify(cook));
      if(cook.rank!=='Bugler' || cook.side!=='US' || cook.branch!=='art' || cook.team.regiment!=='4th U.S. Artillery' || cook.team.company!=='Battery B' || cook.team.corps!=='I Corps' || cook.team.division!=='First Division') throw new Error('Cook rank/unit mismatch: '+JSON.stringify(cook.team));
      if(!cook.bio || cook.bio.indexOf('Antietam')<0 || cook.bio.indexOf('acting cannoneer')<0 || !cook.sourceNote || cook.sources.length<4) throw new Error('Cook source/bio payload missing');
      if(cook.sourceNote.indexOf('no higher rank')<0 || cook.sourceNote.indexOf('no portrait')<0) throw new Error('Cook honesty caveats missing: '+cook.sourceNote);
      if(cook.portrait) throw new Error('Cook should not assert an unverified portrait: '+JSON.stringify(cook.portrait));
      var howeOld=ssFindPerson(C,'ss:vicksburg:US:us_blair_stockade:pvt');
      var howe=ssFindPerson(C,'person_vicksburg_us_55il_howe');
      if(!howe || !howeOld || howeOld.pid!==howe.pid) throw new Error('Howe alias lookup failed');
      if(howe.generated || !howe.replacement || howe.provenance!=='Verified' || howe.name!=='Orion P. Howe') throw new Error('Howe row not sourced/verified: '+JSON.stringify(howe));
      if(howe.rank!=='Musician' || howe.side!=='US' || howe.branch!=='inf' || howe.team.regiment!=='55th Illinois Infantry' || howe.team.company!=='Company C' || howe.team.corps!=='XV Corps' || howe.team.division!=='Blair\\'s Second Division') throw new Error('Howe rank/unit mismatch: '+JSON.stringify(howe.team));
      if(!howe.bio || howe.bio.indexOf('Vicksburg')<0 || howe.bio.indexOf('cartridge')<0 || howe.bio.indexOf('Blair')<0 || !howe.sourceNote || howe.sources.length<5) throw new Error('Howe source/bio payload missing');
      if(howe.sourceNote.indexOf('no higher rank')<0 || howe.sourceNote.indexOf('no portrait')<0) throw new Error('Howe honesty caveats missing: '+howe.sourceNote);
      if(howe.portrait) throw new Error('Howe should not assert an unverified portrait: '+JSON.stringify(howe.portrait));
      var wallerOld=ssFindPerson(C,'ss:gettysburg:US:us_iron_bde:nco');
      var waller=ssFindPerson(C,'person_gettysburg_us_6wi_waller');
      if(!waller || !wallerOld || wallerOld.pid!==waller.pid) throw new Error('Waller alias lookup failed');
      if(waller.generated || !waller.replacement || waller.provenance!=='Verified' || waller.name!=='Francis A. Waller') throw new Error('Waller row not sourced/verified: '+JSON.stringify(waller));
      if(waller.rank!=='Corporal' || waller.side!=='US' || waller.branch!=='inf' || waller.team.regiment!=='6th Wisconsin Infantry' || waller.team.company!=='Company I' || waller.team.corps!=='I Corps' || waller.team.division!=='First Division' || waller.team.brigade.indexOf('Iron Brigade')<0) throw new Error('Waller rank/unit mismatch: '+JSON.stringify(waller.team));
      if(!waller.bio || waller.bio.indexOf('Gettysburg')<0 || waller.bio.indexOf('Railroad Cut')<0 || waller.bio.indexOf('2nd Mississippi')<0 || waller.bio.indexOf('memory')<0 || !waller.sourceNote || waller.sources.length<3) throw new Error('Waller source/bio payload missing');
      if(waller.sourceNote.indexOf('Wallar')<0 || waller.sourceNote.indexOf('no higher rank')<0 || waller.sourceNote.indexOf('no portrait')<0) throw new Error('Waller honesty caveats missing: '+waller.sourceNote);
      if(waller.portrait) throw new Error('Waller should not assert an unverified portrait: '+JSON.stringify(waller.portrait));
      var benjaminOld=ssFindPerson(C,'ss:antietam:US:us_benjamin:cmd');
      var benjamin=ssFindPerson(C,'person_antietam_us_battery_e_benjamin');
      if(!benjamin || !benjaminOld || benjaminOld.pid!==benjamin.pid) throw new Error('Benjamin alias lookup failed');
      if(benjamin.generated || !benjamin.replacement || benjamin.provenance!=='Verified' || benjamin.name!=='Samuel N. Benjamin') throw new Error('Benjamin row not sourced/verified: '+JSON.stringify(benjamin));
      if(benjamin.rank!=='1st Lt.' || benjamin.side!=='US' || benjamin.branch!=='art' || benjamin.team.regiment!=='2nd U.S. Artillery' || benjamin.team.company!=='Battery E' || benjamin.team.corps!=='IX Corps' || benjamin.team.division!=='First Division') throw new Error('Benjamin rank/unit mismatch: '+JSON.stringify(benjamin.team));
      if(!benjamin.bio || benjamin.bio.indexOf('Antietam')<0 || benjamin.bio.indexOf('Stone Bridge')<0 || benjamin.bio.indexOf('last six rounds')<0 || !benjamin.sourceNote || benjamin.sources.length<4) throw new Error('Benjamin source/bio payload missing');
      if(benjamin.sourceNote.indexOf('no captain-rank-at-Antietam')<0 || benjamin.sourceNote.indexOf('no portrait')<0) throw new Error('Benjamin honesty caveats missing: '+benjamin.sourceNote);
      if(benjamin.portrait) throw new Error('Benjamin should not assert an unverified portrait: '+JSON.stringify(benjamin.portrait));
      var barlowOld=ssFindPerson(C,'ss:antietam:US:us_barlow:cmd');
      var barlow=ssFindPerson(C,'person_antietam_us_61ny_barlow');
      if(!barlow || !barlowOld || barlowOld.pid!==barlow.pid) throw new Error('Barlow alias lookup failed');
      if(barlow.generated || !barlow.replacement || barlow.provenance!=='Verified' || barlow.name!=='Francis C. Barlow') throw new Error('Barlow row not sourced/verified: '+JSON.stringify(barlow));
      if(barlow.rank!=='Col.' || barlow.side!=='US' || barlow.branch!=='inf' || barlow.team.regiment!=='61st and 64th New York Infantry' || barlow.team.brigade!=='Caldwell\\'s Brigade' || barlow.team.corps!=='II Corps' || barlow.team.division!=='First Division' || barlow.team.company) throw new Error('Barlow rank/unit mismatch: '+JSON.stringify(barlow.team));
      if(!barlow.bio || barlow.bio.indexOf('Antietam')<0 || barlow.bio.indexOf('Sunken Road')<0 || barlow.bio.indexOf('one-man event')<0 || !barlow.sourceNote || barlow.sources.length<4) throw new Error('Barlow source/bio payload missing');
      if(barlow.sourceNote.indexOf('no brigadier-rank-at-Antietam')<0 || barlow.sourceNote.indexOf('no single-company')<0 || barlow.sourceNote.indexOf('no portrait')<0) throw new Error('Barlow honesty caveats missing: '+barlow.sourceNote);
      if(barlow.portrait) throw new Error('Barlow should not assert an unverified portrait: '+JSON.stringify(barlow.portrait));
      var worshamOld=ssFindPerson(C,'ss:antietam:CS:cs_jr_jones:pvt');
      var worsham=ssFindPerson(C,'person_antietam_cs_21va_worsham');
      if(!worsham || !worshamOld || worshamOld.pid!==worsham.pid) throw new Error('Worsham alias lookup failed');
      if(worsham.generated || !worsham.replacement || worsham.provenance!=='Verified' || worsham.name!=='John H. Worsham') throw new Error('Worsham row not sourced/verified: '+JSON.stringify(worsham));
      if(worsham.rank!=='Private' || worsham.side!=='CS' || worsham.branch!=='inf' || worsham.team.regiment!=='21st Virginia Infantry' || worsham.team.company!=='Company F' || worsham.team.brigade!=="Jones' Brigade" || worsham.team.division!=="Jackson's Division" || worsham.team.corps!=="Jackson's Command") throw new Error('Worsham rank/unit mismatch: '+JSON.stringify(worsham.team));
      if(!worsham.bio || worsham.bio.indexOf('Antietam')<0 || worsham.bio.indexOf('Maryland Campaign')<0 || worsham.bio.indexOf('soldier-life')<0 || !worsham.sourceNote || worsham.sources.length<5) throw new Error('Worsham source/bio payload missing');
      if(worsham.sourceNote.indexOf('no later sergeant/adjutant rank')<0 || worsham.sourceNote.indexOf('no First Manassas claim')<0 || worsham.sourceNote.indexOf('no portrait')<0) throw new Error('Worsham honesty caveats missing: '+worsham.sourceNote);
      if(worsham.portrait) throw new Error('Worsham should not assert an unverified portrait: '+JSON.stringify(worsham.portrait));
      var ballouOld=ssFindPerson(C,'ss:bullrun1:US:us_burnside:cmd');
      var ballou=ssFindPerson(C,'person_bullrun_us_2ri_ballou');
      if(!ballou || !ballouOld || ballouOld.pid!==ballou.pid) throw new Error('Ballou alias lookup failed');
      if(ballou.generated || !ballou.replacement || ballou.provenance!=='Verified' || ballou.name!=='Sullivan Ballou') throw new Error('Ballou row not sourced/verified: '+JSON.stringify(ballou));
      if(ballou.rank!=='Major' || ballou.side!=='US' || ballou.branch!=='inf' || ballou.team.regiment!=='2nd Rhode Island Infantry' || ballou.team.brigade!=="Burnside's Brigade" || ballou.team.division!=="Hunter's Second Division" || ballou.team.company) throw new Error('Ballou rank/unit mismatch: '+JSON.stringify(ballou.team));
      if(!ballou.bio || ballou.bio.indexOf('First Bull Run')<0 || ballou.bio.indexOf('Sarah')<0 || ballou.bio.indexOf('Matthews Hill')<0 || !ballou.sourceNote || ballou.sources.length<3) throw new Error('Ballou source/bio payload missing');
      if(ballou.sourceNote.indexOf('no company command')<0 || ballou.sourceNote.indexOf('no autograph-original claim')<0 || ballou.sourceNote.indexOf('no portrait')<0) throw new Error('Ballou honesty caveats missing: '+ballou.sourceNote);
      if(ballou.portrait) throw new Error('Ballou should not assert an unverified portrait: '+JSON.stringify(ballou.portrait));
      var webbOld=ssFindPerson(C,'ss:gettysburg:US:us_phila_bde:cmd');
      var webb=ssFindPerson(C,'person_gettysburg_us_webb_phila_bde');
      if(!webb || !webbOld || webbOld.pid!==webb.pid) throw new Error('Webb alias lookup failed');
      if(webb.generated || !webb.replacement || webb.provenance!=='Verified' || webb.name!=='Alexander S. Webb') throw new Error('Webb row not sourced/verified: '+JSON.stringify(webb));
      if(webb.rank!=='Brig. Gen.' || webb.side!=='US' || webb.branch!=='inf' || webb.team.brigade!=='Philadelphia Brigade' || webb.team.corps!=='II Corps' || webb.team.division!=='Second Division' || webb.team.company || webb.team.regiment) throw new Error('Webb rank/unit mismatch: '+JSON.stringify(webb.team));
      if(!webb.bio || webb.bio.indexOf('Gettysburg')<0 || webb.bio.indexOf('Pickett')<0 || webb.bio.indexOf('Angle')<0 || !webb.sourceNote || webb.sources.length<3) throw new Error('Webb source/bio payload missing');
      if(webb.sourceNote.indexOf('No company command')<0 || webb.sourceNote.indexOf('no major-general-at-Gettysburg rank')<0 || webb.sourceNote.indexOf('no portrait')<0) throw new Error('Webb honesty caveats missing: '+webb.sourceNote);
      if(webb.portrait) throw new Error('Webb should not assert an unverified portrait: '+JSON.stringify(webb.portrait));
      var caslerOld=ssFindPerson(C,'ss:chancellorsville:CS:cs_colston_div:pvt');
      var casler=ssFindPerson(C,'person_chancellorsville_cs_33va_casler');
      if(!casler || !caslerOld || caslerOld.pid!==casler.pid) throw new Error('Casler alias lookup failed');
      if(casler.generated || !casler.replacement || casler.provenance!=='Verified' || casler.name!=='John O. Casler') throw new Error('Casler row not sourced/verified: '+JSON.stringify(casler));
      if(casler.rank!=='Private' || casler.side!=='CS' || casler.branch!=='inf' || casler.team.regiment!=='33rd Virginia Infantry' || casler.team.brigade!=="Paxton's Brigade (Stonewall Brigade)" || casler.team.company!=='Company A') throw new Error('Casler rank/unit mismatch: '+JSON.stringify(casler.team));
      if(!casler.bio || casler.bio.indexOf('Chancellorsville')<0 || casler.bio.indexOf('Pioneer Corps')<0 || casler.bio.indexOf('Stonewall Brigade')<0 || !casler.sourceNote || casler.sources.length<3) throw new Error('Casler source/bio payload missing');
      if(casler.sourceNote.indexOf('did not witness Paxton')<0 || casler.sourceNote.indexOf('secondhand')<0 || casler.sourceNote.indexOf('No portrait')<0 || casler.sourceNote.indexOf('inferred from the absence')<0) throw new Error('Casler honesty caveats missing: '+casler.sourceNote);
      if(casler.portrait) throw new Error('Casler should not assert an unverified portrait: '+JSON.stringify(casler.portrait));
      var stanleyOld=ssFindPerson(C,'ss:shiloh:CS:cs_hardee_corps:pvt');
      var stanley=ssFindPerson(C,'person_shiloh_cs_6ar_stanley');
      if(!stanley || !stanleyOld || stanleyOld.pid!==stanley.pid) throw new Error('Stanley alias lookup failed');
      if(stanley.generated || !stanley.replacement || stanley.provenance!=='Verified' || stanley.name!=='Henry M. Stanley') throw new Error('Stanley row not sourced/verified: '+JSON.stringify(stanley));
      if(stanley.rank!=='Private' || stanley.side!=='CS' || stanley.branch!=='inf' || stanley.team.regiment!=='6th Arkansas Infantry' || stanley.team.company!=='Company E (Dixie Grays)' || stanley.team.brigade!=="Hindman's Brigade (Shaver's)" || stanley.team.corps.indexOf('Hardee')<0) throw new Error('Stanley rank/unit mismatch: '+JSON.stringify(stanley.team));
      if(!stanley.bio || stanley.bio.indexOf('Shiloh')<0 || stanley.bio.indexOf('Dixie Grays')<0 || stanley.bio.indexOf('galvanized Yankee')<0 || !stanley.sourceNote || stanley.sources.length<4) throw new Error('Stanley source/bio payload missing');
      if(stanley.sourceNote.indexOf('self-mythologizing')<0 || stanley.sourceNote.indexOf('no portrait')<0 || stanley.sourceNote.indexOf('contested later career')<0) throw new Error('Stanley honesty caveats missing: '+stanley.sourceNote);
      if(stanley.portrait) throw new Error('Stanley should not assert an unverified portrait: '+JSON.stringify(stanley.portrait));
      var dooleyOld=ssFindPerson(C,'ss:gettysburg:CS:cs_pickett_div:cmd');
      var dooley=ssFindPerson(C,'person_gettysburg_cs_1va_dooley');
      if(!dooley || !dooleyOld || dooleyOld.pid!==dooley.pid) throw new Error('Dooley alias lookup failed');
      if(dooley.generated || !dooley.replacement || dooley.provenance!=='Verified' || dooley.name!=='John Dooley') throw new Error('Dooley row not sourced/verified: '+JSON.stringify(dooley));
      if(dooley.rank!=='1st Lt.' || dooley.side!=='CS' || dooley.branch!=='inf' || dooley.team.regiment!=='1st Virginia Infantry' || dooley.team.company!=='Company C' || dooley.team.brigade!=="Kemper's Brigade" || dooley.team.division!=="Pickett's Division" || dooley.team.corps!=='First Corps') throw new Error('Dooley rank/unit mismatch: '+JSON.stringify(dooley.team));
      if(!dooley.bio || dooley.bio.indexOf('Gettysburg')<0 || dooley.bio.indexOf('Pickett')<0 || dooley.bio.indexOf('Montgomery Guard')<0 || !dooley.sourceNote || dooley.sources.length<4) throw new Error('Dooley source/bio payload missing');
      if(dooley.sourceNote.indexOf('backdated')<0 || dooley.sourceNote.indexOf('no portrait')<0 || dooley.sourceNote.indexOf('not a Lost Cause')<0) throw new Error('Dooley honesty caveats missing: '+dooley.sourceNote);
      if(dooley.portrait) throw new Error('Dooley should not assert an unverified portrait: '+JSON.stringify(dooley.portrait));
      var decastroOld=ssFindPerson(C,'ss:gettysburg:US:us_gibbon_bdes:nco');
      var decastro=ssFindPerson(C,'person_gettysburg_us_19ma_decastro');
      if(!decastro || !decastroOld || decastroOld.pid!==decastro.pid) throw new Error('De Castro alias lookup failed');
      if(decastro.generated || !decastro.replacement || decastro.provenance!=='Verified' || decastro.name!=='Joseph H. De Castro') throw new Error('De Castro row not sourced/verified: '+JSON.stringify(decastro));
      if(decastro.rank!=='Corporal' || decastro.side!=='US' || decastro.branch!=='inf' || decastro.team.regiment!=='19th Massachusetts Infantry' || decastro.team.company!=='Company I' || decastro.team.brigade!=="Hall's Brigade" || decastro.team.division!=='Second Division' || decastro.team.corps!=='II Corps') throw new Error('De Castro rank/unit mismatch: '+JSON.stringify(decastro.team));
      if(!decastro.bio || decastro.bio.indexOf('Gettysburg')<0 || decastro.bio.indexOf('Pickett')<0 || decastro.bio.indexOf('19th Virginia')<0 || !decastro.sourceNote || decastro.sources.length<4) throw new Error('De Castro source/bio payload missing');
      if(decastro.sourceNote.indexOf('widely credited')<0 || decastro.sourceNote.indexOf('No later sergeant rank')<0 || decastro.sourceNote.indexOf('no portrait')<0) throw new Error('De Castro honesty caveats missing: '+decastro.sourceNote);
      if(decastro.portrait) throw new Error('De Castro should not assert an unverified portrait: '+JSON.stringify(decastro.portrait));
      var bensonOld=ssFindPerson(C,'ss:chancellorsville:CS:cs_ap_hill_div:nco');
      var benson=ssFindPerson(C,'person_chancellorsville_cs_1sc_benson');
      if(!benson || !bensonOld || bensonOld.pid!==benson.pid) throw new Error('Benson alias lookup failed');
      if(benson.generated || !benson.replacement || benson.provenance!=='Verified' || benson.name!=='Berry Benson') throw new Error('Benson row not sourced/verified: '+JSON.stringify(benson));
      if(benson.rank!=='Corporal' || benson.side!=='CS' || benson.branch!=='inf' || benson.team.regiment!=='1st South Carolina Infantry' || benson.team.company!=='Company H' || benson.team.brigade!=="McGowan's Brigade" || benson.team.division!=="A. P. Hill's Light Division") throw new Error('Benson rank/unit mismatch: '+JSON.stringify(benson.team));
      if(!benson.bio || benson.bio.indexOf('Chancellorsville')<0 || benson.bio.indexOf('McGowan')<0 || benson.bio.indexOf('Elmira')<0 || !benson.sourceNote || benson.sources.length<4) throw new Error('Benson source/bio payload missing');
      if(benson.sourceNote.indexOf('inferred as Corporal')<0 || benson.sourceNote.indexOf('late-1864')<0 || benson.sourceNote.indexOf('no portrait')<0) throw new Error('Benson honesty caveats missing: '+benson.sourceNote);
      if(benson.portrait) throw new Error('Benson should not assert an unverified portrait: '+JSON.stringify(benson.portrait));
      var greenOld=ssFindPerson(C,'ss:chickamauga:CS:cs_breck_rock:nco');
      var green=ssFindPerson(C,'person_chickamauga_cs_9ky_green');
      if(!green || !greenOld || greenOld.pid!==green.pid) throw new Error('Green alias lookup failed');
      if(green.generated || !green.replacement || green.provenance!=='Verified' || green.name!=='John W. Green') throw new Error('Green row not sourced/verified: '+JSON.stringify(green));
      if(green.rank!=='Sergeant' || green.side!=='CS' || green.branch!=='inf' || green.team.regiment!=='9th Kentucky Infantry' || green.team.brigade!=="Helm's Kentucky 'Orphan Brigade'" || green.team.division!=="Breckinridge's Division" || green.team.corps.indexOf('Polk')<0) throw new Error('Green rank/unit mismatch: '+JSON.stringify(green.team));
      if(!green.bio || green.bio.indexOf('Chickamauga')<0 || green.bio.indexOf('Orphan Brigade')<0 || green.bio.indexOf('Breckinridge')<0 || green.bio.indexOf('sergeant-major')<0 || !green.sourceNote || green.sources.length<4) throw new Error('Green source/bio payload missing');
      if(green.sourceNote.indexOf('exact grade at Chickamauga is not documented')<0 || green.sourceNote.indexOf('without asserting Sergeant-Major at the battle')<0 || green.sourceNote.indexOf('no portrait')<0) throw new Error('Green honesty caveats missing: '+green.sourceNote);
      if(green.portrait) throw new Error('Green should not assert an unverified portrait: '+JSON.stringify(green.portrait));
      var tunnardOld=ssFindPerson(C,'ss:vicksburg:CS:cs_3rd_louisiana:nco');
      var tunnard=ssFindPerson(C,'person_vicksburg_cs_3la_tunnard');
      if(!tunnard || !tunnardOld || tunnardOld.pid!==tunnard.pid) throw new Error('Tunnard alias lookup failed');
      if(tunnard.generated || !tunnard.replacement || tunnard.provenance!=='Verified' || tunnard.name!=='William H. Tunnard') throw new Error('Tunnard row not sourced/verified: '+JSON.stringify(tunnard));
      if(tunnard.rank!=='Sergeant' || tunnard.side!=='CS' || tunnard.branch!=='inf' || tunnard.team.regiment!=='3rd Louisiana Infantry' || tunnard.team.company!=='Company K' || tunnard.team.brigade!=="Hebert's Brigade" || tunnard.team.division!=="Forney's Division") throw new Error('Tunnard rank/unit mismatch: '+JSON.stringify(tunnard.team));
      if(!tunnard.bio || tunnard.bio.indexOf('Vicksburg')<0 || tunnard.bio.indexOf('3rd Louisiana Redan')<0 || tunnard.bio.indexOf('A Southern Record')<0 || tunnard.bio.indexOf('Pelican Rifles')<0 || !tunnard.sourceNote || tunnard.sources.length<4) throw new Error('Tunnard source/bio payload missing');
      if(tunnard.sourceNote.indexOf('personally in a mine crater')<0 || tunnard.sourceNote.indexOf('no portrait')<0) throw new Error('Tunnard honesty caveats missing: '+tunnard.sourceNote);
      if(tunnard.portrait) throw new Error('Tunnard should not assert an unverified portrait: '+JSON.stringify(tunnard.portrait));
      var gilesOld=ssFindPerson(C,'ss:chickamauga:CS:cs_law_gap:nco');
      var giles=ssFindPerson(C,'person_chickamauga_cs_4tx_giles');
      if(!giles || !gilesOld || gilesOld.pid!==giles.pid) throw new Error('Giles alias lookup failed');
      if(giles.generated || !giles.replacement || giles.provenance!=='Verified' || giles.name!=='Val C. Giles') throw new Error('Giles row not sourced/verified: '+JSON.stringify(giles));
      if(giles.rank!=='Sergeant' || giles.side!=='CS' || giles.branch!=='inf' || giles.team.regiment!=='4th Texas Infantry' || giles.team.company!=="Company B ('Tom Green Rifles')" || giles.team.brigade!=="Robertson's Texas Brigade" || giles.team.division.indexOf("Hood's Division")<0) throw new Error('Giles rank/unit mismatch: '+JSON.stringify(giles.team));
      if(!giles.bio || giles.bio.indexOf('Chickamauga')<0 || giles.bio.indexOf('Hood')<0 || giles.bio.indexOf('Rags and Hope')<0 || giles.bio.indexOf('Wauhatchie')<0 || !giles.sourceNote || giles.sources.length<4) throw new Error('Giles source/bio payload missing');
      if(giles.sourceNote.indexOf('Ships at Sergeant')<0 || giles.sourceNote.indexOf('no portrait')<0) throw new Error('Giles honesty caveats missing: '+giles.sourceNote);
      if(giles.portrait) throw new Error('Giles should not assert an unverified portrait: '+JSON.stringify(giles.portrait));
      var chambersOld=ssFindPerson(C,'ss:vicksburg:CS:cs_smith_stockade:nco');
      var chambers=ssFindPerson(C,'person_vicksburg_cs_46ms_chambers');
      if(!chambers || !chambersOld || chambersOld.pid!==chambers.pid) throw new Error('Chambers alias lookup failed');
      if(chambers.generated || !chambers.replacement || chambers.provenance!=='Verified' || chambers.name!=='William Pitt Chambers') throw new Error('Chambers row not sourced/verified: '+JSON.stringify(chambers));
      if(chambers.rank!=='Sergeant' || chambers.side!=='CS' || chambers.branch!=='inf' || chambers.team.regiment!=='46th Mississippi Infantry' || chambers.team.company!=='Company B' || chambers.team.brigade!=="Baldwin's Brigade" || chambers.team.division!=="Smith's Division") throw new Error('Chambers rank/unit mismatch: '+JSON.stringify(chambers.team));
      if(!chambers.bio || chambers.bio.indexOf('Vicksburg')<0 || chambers.bio.indexOf('46th Mississippi')<0 || chambers.bio.indexOf('Blood and Sacrifice')<0 || chambers.bio.indexOf('Baldwin')<0 || !chambers.sourceNote || chambers.sources.length<4) throw new Error('Chambers source/bio payload missing');
      if(chambers.sourceNote.indexOf('Stockade Redan')<0 || chambers.sourceNote.indexOf('no portrait')<0) throw new Error('Chambers honesty caveats missing: '+chambers.sourceNote);
      if(chambers.portrait) throw new Error('Chambers should not assert an unverified portrait: '+JSON.stringify(chambers.portrait));
      var houstonOld=ssFindPerson(C,'ss:shiloh:CS:cs_bragg_corps:pvt');
      var houston=ssFindPerson(C,'person_shiloh_cs_2tx_houston');
      if(!houston || !houstonOld || houstonOld.pid!==houston.pid) throw new Error('Houston alias lookup failed');
      if(houston.generated || !houston.replacement || houston.provenance!=='Verified' || houston.name!=='Sam Houston Jr.') throw new Error('Houston row not sourced/verified: '+JSON.stringify(houston));
      if(houston.rank!=='Private' || houston.side!=='CS' || houston.branch!=='inf' || houston.team.regiment!=='2nd Texas Infantry' || houston.team.company.indexOf('Bayland')<0 || houston.team.brigade!=="Jackson's Brigade" || houston.team.division!=="Withers' Division" || houston.team.corps.indexOf('Bragg')<0) throw new Error('Houston rank/unit mismatch: '+JSON.stringify(houston.team));
      if(!houston.bio || houston.bio.indexOf('Shiloh')<0 || houston.bio.indexOf('2nd Texas')<0 || houston.bio.indexOf('Bible')<0 || houston.bio.indexOf('Camp Douglas')<0 || !houston.sourceNote || houston.sources.length<4) throw new Error('Houston source/bio payload missing');
      if(houston.sourceNote.indexOf('Ships at Private')<0 || houston.sourceNote.indexOf('no portrait')<0) throw new Error('Houston honesty caveats missing: '+houston.sourceNote);
      if(houston.portrait) throw new Error('Houston should not assert an unverified portrait: '+JSON.stringify(houston.portrait));
      var jackmanOld=ssFindPerson(C,'ss:chickamauga:CS:cs_breck_rock:pvt');
      var jackman=ssFindPerson(C,'person_chickamauga_cs_9ky_jackman');
      if(!jackman || !jackmanOld || jackmanOld.pid!==jackman.pid) throw new Error('Jackman alias lookup failed');
      if(jackman.generated || !jackman.replacement || jackman.provenance!=='Verified' || jackman.name!=='John S. Jackman') throw new Error('Jackman row not sourced/verified: '+JSON.stringify(jackman));
      if(jackman.rank!=='Private' || jackman.side!=='CS' || jackman.branch!=='inf' || jackman.team.regiment!=='9th Kentucky Infantry' || jackman.team.company!=='Company B' || jackman.team.brigade!=="Helm's Kentucky 'Orphan Brigade'" || jackman.team.division!=="Breckinridge's Division" || jackman.team.corps.indexOf('Polk')<0) throw new Error('Jackman rank/unit mismatch: '+JSON.stringify(jackman.team));
      if(!jackman.bio || jackman.bio.indexOf('Chickamauga')<0 || jackman.bio.indexOf('Orphan Brigade')<0 || jackman.bio.indexOf('Breckinridge')<0 || jackman.bio.indexOf('private slot beside')<0 || !jackman.sourceNote || jackman.sources.length<4) throw new Error('Jackman source/bio payload missing');
      if(jackman.sourceNote.indexOf('Ships at Private')<0 || jackman.sourceNote.indexOf('No portrait')<0) throw new Error('Jackman honesty caveats missing: '+jackman.sourceNote);
      if(jackman.portrait) throw new Error('Jackman should not assert an unverified portrait: '+JSON.stringify(jackman.portrait));
      var westOld=ssFindPerson(C,'ss:chickamauga:CS:cs_law_gap:pvt');
      var west=ssFindPerson(C,'person_chickamauga_cs_4tx_west');
      if(!west || !westOld || westOld.pid!==west.pid) throw new Error('West alias lookup failed');
      if(west.generated || !west.replacement || west.provenance!=='Verified' || west.name!=='John Camden West') throw new Error('West row not sourced/verified: '+JSON.stringify(west));
      if(west.rank!=='Private' || west.side!=='CS' || west.branch!=='inf' || west.team.regiment!=='4th Texas Infantry' || west.team.company!=='Company E' || west.team.brigade!=="Robertson's Texas Brigade" || west.team.division.indexOf("Hood's Division")<0 || west.team.corps.indexOf('Longstreet')<0) throw new Error('West rank/unit mismatch: '+JSON.stringify(west.team));
      if(!west.bio || west.bio.indexOf('Chickamauga')<0 || west.bio.indexOf('Company E')<0 || west.bio.indexOf('4th Texas')<0 || west.bio.indexOf('Val C. Giles')<0 || !west.sourceNote || west.sources.length<5) throw new Error('West source/bio payload missing');
      if(west.sourceNote.indexOf('Ships at Private')<0 || west.sourceNote.indexOf('No portrait')<0) throw new Error('West honesty caveats missing: '+west.sourceNote);
      if(west.portrait) throw new Error('West should not assert an unverified portrait: '+JSON.stringify(west.portrait));
      var simpsonOld=ssFindPerson(C,'ss:chickamauga:CS:cs_kershaw_rock:nco');
      var simpson=ssFindPerson(C,'person_chickamauga_cs_3sc_simpson');
      if(!simpson || !simpsonOld || simpsonOld.pid!==simpson.pid) throw new Error('Simpson alias lookup failed');
      if(simpson.generated || !simpson.replacement || simpson.provenance!=='Verified' || simpson.name!=='Taliaferro N. "Tally" Simpson') throw new Error('Simpson row not sourced/verified: '+JSON.stringify(simpson));
      if(simpson.rank!=='Corporal' || simpson.side!=='CS' || simpson.branch!=='inf' || simpson.team.regiment!=='3rd South Carolina Infantry' || simpson.team.company.indexOf('Company A')<0 || simpson.team.company.indexOf('Company B')<0 || simpson.team.brigade!=="Kershaw's Brigade" || simpson.team.division!=="McLaws' Division" || simpson.team.corps.indexOf('Longstreet')<0) throw new Error('Simpson rank/unit mismatch: '+JSON.stringify(simpson.team));
      if(!simpson.bio || simpson.bio.indexOf('Chickamauga')<0 || simpson.bio.indexOf('Kershaw')<0 || simpson.bio.indexOf('Horseshoe Ridge')<0 || simpson.bio.indexOf('enslaved Zion')<0 || !simpson.sourceNote || simpson.sources.length<5) throw new Error('Simpson source/bio payload missing');
      if(simpson.sourceNote.indexOf('Ships at Corporal')<0 || simpson.sourceNote.indexOf('No portrait')<0) throw new Error('Simpson honesty caveats missing: '+simpson.sourceNote);
      if(simpson.portrait) throw new Error('Simpson should not assert an unverified portrait: '+JSON.stringify(simpson.portrait));
      var haleyOld=ssFindPerson(C,'ss:gettysburg:US:us_birney_iii:pvt');
      var haley=ssFindPerson(C,'person_gettysburg_us_17me_haley');
      if(!haley || !haleyOld || haleyOld.pid!==haley.pid) throw new Error('Haley alias lookup failed');
      if(haley.generated || !haley.replacement || haley.provenance!=='Verified' || haley.name!=='John W. Haley') throw new Error('Haley row not sourced/verified: '+JSON.stringify(haley));
      if(haley.rank!=='Private' || haley.side!=='US' || haley.branch!=='inf' || haley.team.regiment!=='17th Maine Infantry' || haley.team.company!=='Company I' || haley.team.brigade.indexOf('Trobriand')<0 || haley.team.division.indexOf('Birney')<0 || haley.team.corps!=='III Corps') throw new Error('Haley rank/unit mismatch: '+JSON.stringify(haley.team));
      if(!haley.bio || haley.bio.indexOf('Gettysburg')<0 || haley.bio.indexOf('Wheatfield')<0 || haley.bio.indexOf('Birney')<0 || haley.bio.indexOf('private slot')<0 || !haley.sourceNote || haley.sources.length<6) throw new Error('Haley source/bio payload missing');
      if(haley.sourceNote.indexOf('Ships at Private')<0 || haley.sourceNote.indexOf('No corporal-at-Gettysburg')<0 || haley.sourceNote.indexOf('No portrait')<0) throw new Error('Haley honesty caveats missing: '+haley.sourceNote);
      if(haley.portrait) throw new Error('Haley should not assert an unverified portrait: '+JSON.stringify(haley.portrait));
      var johnsonOld=ssFindPerson(C,'ss:chickamauga:CS:cs_johnson_gap:cmd');
      var johnson=ssFindPerson(C,'person_chickamauga_cs_johnson_gap');
      if(!johnson || !johnsonOld || johnsonOld.pid!==johnson.pid) throw new Error('Johnson alias lookup failed');
      if(johnson.generated || !johnson.replacement || johnson.provenance!=='Verified' || johnson.name!=='Bushrod R. Johnson') throw new Error('Johnson row not sourced/verified: '+JSON.stringify(johnson));
      if(johnson.rank!=='Brig. Gen.' || johnson.side!=='CS' || johnson.branch!=='inf' || johnson.team.army!=='Army of Tennessee' || johnson.team.corps.indexOf('Longstreet')<0 || johnson.team.division!=="Johnson's Provisional Division" || johnson.team.brigade.indexOf("Johnson's Division")<0 || johnson.team.company) throw new Error('Johnson rank/unit mismatch: '+JSON.stringify(johnson.team));
      if(!johnson.bio || johnson.bio.indexOf('Chickamauga')<0 || johnson.bio.indexOf('Brotherton')<0 || johnson.bio.indexOf('Horseshoe Ridge')<0 || johnson.bio.indexOf('command-row replacement')<0 || !johnson.sourceNote || johnson.sources.length<5) throw new Error('Johnson source/bio payload missing');
      if(johnson.sourceNote.indexOf('Ships at Brig. Gen.')<0 || johnson.sourceNote.indexOf('No major-general-at-Chickamauga')<0 || johnson.sourceNote.indexOf('No portrait')<0) throw new Error('Johnson honesty caveats missing: '+johnson.sourceNote);
      if(johnson.portrait) throw new Error('Johnson should not assert an unverified portrait: '+JSON.stringify(johnson.portrait));
      var hoodOld=ssFindPerson(C,'ss:chickamauga:CS:cs_hood_arrives:cmd');
      var hood=ssFindPerson(C,'person_chickamauga_cs_hood_arrives');
      if(!hood || !hoodOld || hoodOld.pid!==hood.pid) throw new Error('Hood alias lookup failed');
      if(hood.generated || !hood.replacement || hood.provenance!=='Verified' || hood.name!=='John Bell Hood') throw new Error('Hood row not sourced/verified: '+JSON.stringify(hood));
      if(hood.rank!=='Maj. Gen.' || hood.side!=='CS' || hood.branch!=='inf' || hood.team.army!=='Army of Tennessee' || hood.team.corps.indexOf('Longstreet')<0 || hood.team.division!=="Hood's Division" || hood.team.brigade!=="Hood's Arriving Brigades" || hood.team.company) throw new Error('Hood rank/unit mismatch: '+JSON.stringify(hood.team));
      if(!hood.bio || hood.bio.indexOf('Chickamauga')<0 || hood.bio.indexOf('Brotherton')<0 || hood.bio.indexOf('right leg')<0 || hood.bio.indexOf("Hood's Arriving Brigades")<0 || !hood.sourceNote || hood.sources.length<5) throw new Error('Hood source/bio payload missing');
      if(hood.sourceNote.indexOf('Ships at Maj. Gen.')<0 || hood.sourceNote.indexOf('No lieutenant-general-at-Chickamauga')<0 || hood.sourceNote.indexOf('No portrait')<0) throw new Error('Hood honesty caveats missing: '+hood.sourceNote);
      if(hood.portrait) throw new Error('Hood should not assert an unverified portrait: '+JSON.stringify(hood.portrait));
      /* D358: eight Bull Run command rows — every replaced cmd slot previously carried the generated hardcoded 'Captain' rank */
      var sherman=ssFindPerson(C,'person_bullrun_us_sherman_bde');
      var shermanOld=ssFindPerson(C,'ss:bullrun1:US:us_sherman:cmd');
      if(!sherman || !shermanOld || shermanOld.pid!==sherman.pid) throw new Error('Sherman alias lookup failed');
      if(sherman.generated || !sherman.replacement || sherman.provenance!=='Verified' || sherman.name!=='William T. Sherman') throw new Error('Sherman row not sourced/verified: '+JSON.stringify(sherman));
      if(sherman.rank!=='Col.' || sherman.side!=='US' || sherman.branch!=='inf' || sherman.team.army!=='Army of Northeastern Virginia' || sherman.team.division!=="Tyler's First Division" || sherman.team.brigade!=="Sherman's Brigade" || sherman.team.company) throw new Error('Sherman rank/unit mismatch: '+JSON.stringify(sherman.team));
      if(!sherman.bio || sherman.bio.indexOf('First Bull Run')<0 || sherman.bio.indexOf('Henry House Hill')<0 || sherman.bio.indexOf('one regiment at a time')<0 || sherman.bio.indexOf('command-row replacement')<0 || !sherman.sourceNote || sherman.sources.length<3) throw new Error('Sherman source/bio payload missing');
      if(sherman.sourceNote.indexOf('Ships at Col.')<0 || sherman.sourceNote.indexOf('No brigadier-general-at-Bull-Run')<0 || sherman.sourceNote.indexOf('No portrait')<0) throw new Error('Sherman honesty caveats missing: '+sherman.sourceNote);
      if(sherman.portrait) throw new Error('Sherman should not assert an unverified portrait: '+JSON.stringify(sherman.portrait));
      var porter=ssFindPerson(C,'person_bullrun_us_porter_bde');
      var porterOld=ssFindPerson(C,'ss:bullrun1:US:us_porter:cmd');
      if(!porter || !porterOld || porterOld.pid!==porter.pid) throw new Error('Porter alias lookup failed');
      if(porter.generated || !porter.replacement || porter.provenance!=='Verified' || porter.name!=='Andrew Porter') throw new Error('Porter row not sourced/verified: '+JSON.stringify(porter));
      if(porter.rank!=='Col.' || porter.side!=='US' || porter.branch!=='inf' || porter.team.division!=="Hunter's Second Division" || porter.team.brigade!=="Porter's Brigade" || porter.team.company) throw new Error('Porter rank/unit mismatch: '+JSON.stringify(porter.team));
      if(!porter.bio || porter.bio.indexOf('Matthews Hill')<0 || porter.bio.indexOf('16th U.S. Infantry')<0 || porter.bio.indexOf('command of the division')<0 || !porter.sourceNote || porter.sources.length<3) throw new Error('Porter source/bio payload missing');
      if(porter.sourceNote.indexOf('Ships at Col.')<0 || porter.sourceNote.indexOf('No brigade casualty figure')<0 || porter.sourceNote.indexOf('No portrait')<0) throw new Error('Porter honesty caveats missing: '+porter.sourceNote);
      if(porter.portrait) throw new Error('Porter should not assert an unverified portrait: '+JSON.stringify(porter.portrait));
      var howardB=ssFindPerson(C,'person_bullrun_us_howard_bde');
      var howardBOld=ssFindPerson(C,'ss:bullrun1:US:us_howard:cmd');
      if(!howardB || !howardBOld || howardBOld.pid!==howardB.pid) throw new Error('Howard alias lookup failed');
      if(howardB.generated || !howardB.replacement || howardB.provenance!=='Verified' || howardB.name!=='Oliver O. Howard') throw new Error('Howard row not sourced/verified: '+JSON.stringify(howardB));
      if(howardB.rank!=='Col.' || howardB.side!=='US' || howardB.branch!=='inf' || howardB.team.division!=="Heintzelman's Third Division" || howardB.team.brigade!=="Howard's Brigade" || howardB.team.company) throw new Error('Howard rank/unit mismatch: '+JSON.stringify(howardB.team));
      if(!howardB.bio || howardB.bio.indexOf('Chinn Ridge')<0 || howardB.bio.indexOf('Elzey')<0 || howardB.bio.indexOf('unhurt')<0 || !howardB.sourceNote || howardB.sources.length<4) throw new Error('Howard source/bio payload missing');
      if(howardB.sourceNote.indexOf('Ships at Col.')<0 || howardB.sourceNote.indexOf('No brigadier-at-Bull-Run')<0 || howardB.sourceNote.indexOf('No portrait')<0) throw new Error('Howard honesty caveats missing: '+howardB.sourceNote);
      if(howardB.portrait) throw new Error('Howard should not assert an unverified portrait: '+JSON.stringify(howardB.portrait));
      var griffin=ssFindPerson(C,'person_bullrun_us_griffin_battery');
      var griffinOld=ssFindPerson(C,'ss:bullrun1:US:us_griffin:cmd');
      if(!griffin || !griffinOld || griffinOld.pid!==griffin.pid) throw new Error('Griffin alias lookup failed');
      if(griffin.generated || !griffin.replacement || griffin.provenance!=='Verified' || griffin.name!=='Charles Griffin') throw new Error('Griffin row not sourced/verified: '+JSON.stringify(griffin));
      if(griffin.rank!=='Capt.' || griffin.side!=='US' || griffin.branch!=='art' || griffin.team.regiment!=='Battery D, 5th U.S. Artillery' || griffin.team.brigade!=="Porter's Brigade" || griffin.team.company) throw new Error('Griffin rank/unit mismatch: '+JSON.stringify(griffin.team));
      if(!griffin.bio || griffin.bio.indexOf('West Point Battery')<0 || griffin.bio.indexOf('Henry House')<0 || griffin.bio.indexOf('turning point')<0 || !griffin.sourceNote || griffin.sources.length<3) throw new Error('Griffin source/bio payload missing');
      if(griffin.sourceNote.indexOf('Ships at Capt.')<0 || griffin.sourceNote.indexOf('No field-grade-at-Bull-Run')<0 || griffin.sourceNote.indexOf('No portrait')<0) throw new Error('Griffin honesty caveats missing: '+griffin.sourceNote);
      if(griffin.portrait) throw new Error('Griffin should not assert an unverified portrait: '+JSON.stringify(griffin.portrait));
      var evans=ssFindPerson(C,'person_bullrun_cs_evans_demibde');
      var evansOld=ssFindPerson(C,'ss:bullrun1:CS:cs_evans:cmd');
      if(!evans || !evansOld || evansOld.pid!==evans.pid) throw new Error('Evans alias lookup failed');
      if(evans.generated || !evans.replacement || evans.provenance!=='Verified' || evans.name!=='Nathan G. Evans') throw new Error('Evans row not sourced/verified: '+JSON.stringify(evans));
      if(evans.rank!=='Col.' || evans.side!=='CS' || evans.branch!=='inf' || evans.team.army!=='Confederate Army of the Potomac' || evans.team.brigade!=="Evans's Demi-Brigade" || evans.team.company) throw new Error('Evans rank/unit mismatch: '+JSON.stringify(evans.team));
      if(!evans.bio || evans.bio.indexOf('Stone Bridge')<0 || evans.bio.indexOf('Matthews Hill')<0 || evans.bio.indexOf('temporary colonel')<0 || !evans.sourceNote || evans.sources.length<3) throw new Error('Evans source/bio payload missing');
      if(evans.sourceNote.indexOf('Ships at Col.')<0 || evans.sourceNote.indexOf('No brigadier-at-Bull-Run')<0 || evans.sourceNote.indexOf('No portrait')<0) throw new Error('Evans honesty caveats missing: '+evans.sourceNote);
      if(evans.portrait) throw new Error('Evans should not assert an unverified portrait: '+JSON.stringify(evans.portrait));
      var bee=ssFindPerson(C,'person_bullrun_cs_bee_bde');
      var beeOld=ssFindPerson(C,'ss:bullrun1:CS:cs_bee:cmd');
      if(!bee || !beeOld || beeOld.pid!==bee.pid) throw new Error('Bee alias lookup failed');
      if(bee.generated || !bee.replacement || bee.provenance!=='Verified' || bee.name!=='Barnard E. Bee') throw new Error('Bee row not sourced/verified: '+JSON.stringify(bee));
      if(bee.rank!=='Brig. Gen.' || bee.side!=='CS' || bee.branch!=='inf' || bee.team.army!=='Army of the Shenandoah' || bee.team.brigade!=="Bee's Brigade" || bee.team.company) throw new Error('Bee rank/unit mismatch: '+JSON.stringify(bee.team));
      if(!bee.bio || bee.bio.indexOf('Henry House Hill')<0 || bee.bio.indexOf('contested')<0 || bee.bio.indexOf('died the next day')<0 || !bee.sourceNote || bee.sources.length<4) throw new Error('Bee source/bio payload missing');
      if(bee.sourceNote.indexOf('Ships at Brig. Gen.')<0 || bee.sourceNote.indexOf('No verbatim stone-wall-quotation')<0 || bee.sourceNote.indexOf('No portrait')<0) throw new Error('Bee honesty caveats missing: '+bee.sourceNote);
      if(bee.portrait) throw new Error('Bee should not assert an unverified portrait: '+JSON.stringify(bee.portrait));
      var bartow=ssFindPerson(C,'person_bullrun_cs_bartow_bde');
      var bartowOld=ssFindPerson(C,'ss:bullrun1:CS:cs_bartow:cmd');
      if(!bartow || !bartowOld || bartowOld.pid!==bartow.pid) throw new Error('Bartow alias lookup failed');
      if(bartow.generated || !bartow.replacement || bartow.provenance!=='Verified' || bartow.name!=='Francis S. Bartow') throw new Error('Bartow row not sourced/verified: '+JSON.stringify(bartow));
      if(bartow.rank!=='Col.' || bartow.side!=='CS' || bartow.branch!=='inf' || bartow.team.army!=='Army of the Shenandoah' || bartow.team.brigade!=="Bartow's Brigade" || bartow.team.company) throw new Error('Bartow rank/unit mismatch: '+JSON.stringify(bartow.team));
      if(!bartow.bio || bartow.bio.indexOf('8th Georgia')<0 || bartow.bio.indexOf('7th Georgia')<0 || bartow.bio.indexOf('memorial rank')<0 || !bartow.sourceNote || bartow.sources.length<5) throw new Error('Bartow source/bio payload missing');
      if(bartow.sourceNote.indexOf('Ships at Col.')<0 || bartow.sourceNote.indexOf("No general's-rank claim")<0 || bartow.sourceNote.indexOf('No portrait')<0) throw new Error('Bartow honesty caveats missing: '+bartow.sourceNote);
      if(bartow.portrait) throw new Error('Bartow should not assert an unverified portrait: '+JSON.stringify(bartow.portrait));
      var hampton=ssFindPerson(C,'person_bullrun_cs_hampton_legion');
      var hamptonOld=ssFindPerson(C,'ss:bullrun1:CS:cs_hampton:cmd');
      if(!hampton || !hamptonOld || hamptonOld.pid!==hampton.pid) throw new Error('Hampton alias lookup failed');
      if(hampton.generated || !hampton.replacement || hampton.provenance!=='Verified' || hampton.name!=='Wade Hampton') throw new Error('Hampton row not sourced/verified: '+JSON.stringify(hampton));
      if(hampton.rank!=='Col.' || hampton.side!=='CS' || hampton.branch!=='inf' || hampton.team.army!=='Confederate Army of the Potomac' || hampton.team.brigade!=="Hampton's Legion" || hampton.team.company) throw new Error('Hampton rank/unit mismatch: '+JSON.stringify(hampton.team));
      if(!hampton.bio || hampton.bio.indexOf('Robinson farmstead')<0 || hampton.bio.indexOf('600')<0 || hampton.bio.indexOf('wounded')<0 || !hampton.sourceNote || hampton.sources.length<4) throw new Error('Hampton source/bio payload missing');
      if(hampton.sourceNote.indexOf('Ships at Col.')<0 || hampton.sourceNote.indexOf('No brigadier-at-Bull-Run')<0 || hampton.sourceNote.indexOf('No portrait')<0) throw new Error('Hampton honesty caveats missing: '+hampton.sourceNote);
      if(hampton.portrait) throw new Error('Hampton should not assert an unverified portrait: '+JSON.stringify(hampton.portrait));
      var fleetwood=ssFindPerson(C,'person_new_market_heights_us_4usct_fleetwood');
      var fleetwoodOld=ssFindPerson(C,'ss:newMarketHeights:US:us_4th:nco');
      if(!fleetwood || !fleetwoodOld || fleetwoodOld.pid!==fleetwood.pid) throw new Error('Fleetwood alias lookup failed');
      if(fleetwood.generated || !fleetwood.replacement || fleetwood.provenance!=='Verified' || fleetwood.name!=='Christian A. Fleetwood') throw new Error('Fleetwood row not sourced/verified: '+JSON.stringify(fleetwood));
      if(fleetwood.rank!=='Sergeant Major' || fleetwood.side!=='US' || fleetwood.team.regiment!=='4th U.S. Colored Infantry' || fleetwood.team.brigade!=='Third Brigade (Duncan)' || fleetwood.team.company) throw new Error('Fleetwood rank/unit mismatch: '+JSON.stringify(fleetwood.team));
      if(!fleetwood.bio || fleetwood.bio.indexOf('two color bearers')<0 || !fleetwood.sourceNote || fleetwood.sources.length<3 || fleetwood.portrait) throw new Error('Fleetwood source/bio/portrait payload mismatch');
      var beaty=ssFindPerson(C,'person_new_market_heights_us_5usct_beaty');
      var beatyOld=ssFindPerson(C,'ss:newMarketHeights:US:us_5th:nco');
      if(!beaty || !beatyOld || beatyOld.pid!==beaty.pid) throw new Error('Beaty alias lookup failed');
      if(beaty.generated || !beaty.replacement || beaty.provenance!=='Verified' || beaty.name!=='Powhatan Beaty') throw new Error('Beaty row not sourced/verified: '+JSON.stringify(beaty));
      if(beaty.rank!=='First Sergeant' || beaty.side!=='US' || beaty.team.regiment!=='5th U.S. Colored Infantry' || beaty.team.brigade!=='Second Brigade (Draper)' || beaty.team.company!=='Company G') throw new Error('Beaty rank/unit mismatch: '+JSON.stringify(beaty.team));
      if(!beaty.bio || beaty.bio.indexOf('officers were killed or wounded')<0 || !beaty.sourceNote || beaty.sources.length<4 || beaty.portrait) throw new Error('Beaty source/bio/portrait payload mismatch');
      var gardiner=ssFindPerson(C,'person_new_market_heights_us_36usct_gardiner');
      var gardinerOld=ssFindPerson(C,'ss:newMarketHeights:US:us_36th:pvt');
      if(!gardiner || !gardinerOld || gardinerOld.pid!==gardiner.pid) throw new Error('Gardiner alias lookup failed');
      if(gardiner.generated || !gardiner.replacement || gardiner.provenance!=='Verified' || gardiner.name!=='James Gardiner') throw new Error('Gardiner row not sourced/verified: '+JSON.stringify(gardiner));
      if(gardiner.rank!=='Private' || gardiner.side!=='US' || gardiner.team.regiment!=='36th U.S. Colored Infantry' || gardiner.team.brigade!=='Second Brigade (Draper)' || gardiner.team.company!=='Company I') throw new Error('Gardiner rank/unit mismatch: '+JSON.stringify(gardiner.team));
      if(!gardiner.bio || gardiner.bio.indexOf("Army citation's James Gardiner")<0 || !gardiner.sourceNote || gardiner.sources.length<4 || gardiner.portrait) throw new Error('Gardiner source/bio/portrait payload mismatch');
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
      return { canonicalRecords:original.records.length, rhodes:rhodes.pid, mccarter:mccarter.pid, watkins:watkins.pid, chamberlain:chamberlain.pid, cushing:cushing.pid, vincent:vincent.pid, stillwell:stillwell.pid, cook:cook.pid, howe:howe.pid, waller:waller.pid, benjamin:benjamin.pid, barlow:barlow.pid, worsham:worsham.pid, ballou:ballou.pid, webb:webb.pid, casler:casler.pid, stanley:stanley.pid, dooley:dooley.pid, decastro:decastro.pid, benson:benson.pid, green:green.pid, tunnard:tunnard.pid, giles:giles.pid, chambers:chambers.pid, houston:houston.pid, jackman:jackman.pid, west:west.pid, simpson:simpson.pid, haley:haley.pid, johnson:johnson.pid, hood:hood.pid, sherman:sherman.pid, porter:porter.pid, howard:howardB.pid, griffin:griffin.pid, evans:evans.pid, bee:bee.pid, bartow:bartow.pid, hampton:hampton.pid, fleetwood:fleetwood.pid, beaty:beaty.pid, gardiner:gardiner.pid, target:target.pid, applied:base.replacements.applied, hostileRejected:true };
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

    step('JOURNEY D360 TRAJECTORY: the start-anywhere rank lattice promotes every tier, the requirement read-out is honest, and the summit caps', function(){
      var C=mkC('US'); G.campaign=C; _t1InitAll(C);
      var reg=ssPersonRegistry(C);
      var sherman=findPerson(reg,function(p){ return p.pid==='person_bullrun_us_sherman_bde'; });
      if(!sherman || sherman.rank!=='Col.') throw new Error('D358 Sherman row missing for trajectory test: '+JSON.stringify(sherman&&sherman.rank));
      var beforeRatings=JSON.stringify(GAME_DATA.ratings);
      var start=ssStartJourney(C,sherman.pid,'bullrun1');
      if(!start.ok) throw new Error('colonel journey start failed: '+JSON.stringify(start));
      C.loot.survival.rations=90; C.loot.survival.exposure=10; C.loot.survival.disease=8; C.loot.survival.fatigue=10; C.loot.survival.morale=60;
      var req0=_ssNextRankReq(C.loot.journey);
      if(!req0 || req0.next!=='Brig. Gen.' || req0.winsNeeded!==4 || req0.winsHave!==0 || req0.remaining!==4) throw new Error('colonel requirement read-out wrong: '+JSON.stringify(req0));
      var activeBefore=_ssJourneyActiveHTML(C);
      if(activeBefore.indexOf('Career Trajectory')<0 || activeBefore.indexOf('Brig. Gen.')<0 || activeBefore.indexOf('4 more victories')<0) throw new Error('trajectory read-out missing before first battle: '+activeBefore);
      var fields=['bullrun1','antietam','fredericksburg','gettysburg'];
      for(var i=0;i<fields.length;i++){
        var B={ id:fields[i], name:fields[i], playerSide:'US', enemySide:'CS', casualties:{US:300,CS:900}, bd:{id:fields[i],name:fields[i]} };
        lootOnResolve('US','tactical',B,C,true);
      }
      var J=C.loot.journey;
      if(J.person.rank!=='Brig. Gen.' || J.promotionCount!==1) throw new Error('four cumulative victories should promote Col. to Brig. Gen. (D151 cumulative-wins semantic preserved): '+JSON.stringify({rank:J.person.rank,promos:J.promotionCount}));
      if(J.person.promotedFrom!=='Col.') throw new Error('promotion provenance lost: '+JSON.stringify(J.person.promotedFrom));
      var lastEntry=J.career[J.career.length-1];
      if(!lastEntry || !lastEntry.promoted || lastEntry.rankAfter!=='Brig. Gen.') throw new Error('promoted career entry missing for the trajectory: '+JSON.stringify(lastEntry));
      var req1=_ssNextRankReq(J);
      if(!req1 || req1.next!=='Maj. Gen.' || req1.remaining!==0) throw new Error('post-promotion requirement should point at Maj. Gen. with the streak banked: '+JSON.stringify(req1));
      var active=_ssJourneyActiveHTML(C);
      if(active.indexOf('Career Trajectory')<0 || active.indexOf('Maj. Gen.')<0 || active.indexOf('Arc so far')<0) throw new Error('trajectory read-out missing after promotion: '+active);
      var report=ssJourneyReportHTML(C,{});
      if(report.indexOf('Career Trajectory')<0) throw new Error('full journey report should carry the trajectory block');
      var compact=ssJourneyReportHTML(C,{compact:true});
      if(compact.indexOf('Career Trajectory')>=0) throw new Error('compact report should stay lean (no trajectory block)');
      if(_ssRankLadderStep('General')!==null || !_ssRankAtSummit('General')) throw new Error('General must cap the ladder');
      if(_ssPromotionRank({person:{rank:'General'},career:[{outcome:'victory'},{outcome:'victory'},{outcome:'victory'},{outcome:'victory'},{outcome:'victory'},{outcome:'victory'},{outcome:'victory'}]},'victory','decisive','alive')!==null) throw new Error('a full General must never promote further');
      var offLadder=_ssTrajectoryHTML({person:{rank:'Chaplain',name:'X'},career:[]});
      if(offLadder.indexOf('outside the standard promotion ladder')<0) throw new Error('off-ladder ranks must be labeled honestly: '+offLadder);
      var lieutenant=_ssRankLadderStep('1st Lt.');
      if(!lieutenant || lieutenant.next!=='Captain') throw new Error('company-officer tier missing from the ladder');
      var bugler=_ssRankLadderStep('Bugler');
      if(!bugler || bugler.next!=='Sergeant' || !bugler.decisive) throw new Error('enlisted specialists must keep the legacy fast track');
      if(JSON.stringify(GAME_DATA.ratings)!==beforeRatings) throw new Error('D360 trajectory mutated canonical ratings');
      lootSetSurvival(C,false); C.loot.journey={enabled:false};
      return { promoted:J.person.rank, promotions:J.promotionCount, nextReq:req1.next, summitCapped:true, offLadderHonest:true };
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
      // E50/D353 (fixture updated D355): an own "hasOwnProperty" ANYWHERE in the campaign envelope
      // is now REJECTED at the import door (the deep guard) — the pre-D353 fixture planted it in
      // loot.equipped and expected the D149 import-then-sanitize posture, which door rejection has
      // superseded for exactly this poison class (serializeSave can never write such a key, so no
      // legitimate save is affected). Assert the rejection:
      var bad2=clone(sv);
      bad2.campaign.loot = { equipped:JSON.parse('{"weapon":"captured_enfield_crate","hasOwnProperty":"shadow"}') };
      var bad2Res=_slImportText(JSON.stringify(bad2));
      if(bad2Res.ok) throw new Error('deep hasOwnProperty-shadow loot import should be rejected (E50)');
      // The sanitize-on-init teeth keep full coverage with NON-poison tampers (dup stacks, qty
      // overflow, string booleans, ghost journey, ovr 999) — these still import, then lootInit
      // must clean them before use.
      sv.campaign.loot = {
        inventory:[{id:'captured_enfield_crate',qty:99},{id:'captured_enfield_crate',qty:99},{id:'battle_flag_fragment',qty:50}],
        equipped:JSON.parse('{"weapon":"captured_enfield_crate"}'),
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
      if(reg.people.length!==1566) throw new Error('expected current 1566-person registry, got '+reg.people.length);   // D362: 912 -> 957 — Gaines' Mill adds 15 unique units x 3 slots (fragment dropped by a later pin bump; restored in D381 — the pin-bump idiom requires the full documented chain). D364: 957 -> 990 — New Market Heights adds 11 unique units x 3 slots. D366: 990 -> 1068 — Stones River adds 26 unique units x 3 slots. D376: 1068 -> 1125 — Cedar Creek adds 19 unique units x 3 slots. D378: 1125 -> 1170 — Cross Keys / Port Republic adds 15 unique units x 3 slots. D380: 1170 -> 1200 — Five Forks adds 10 unique side-unit ids x 3 slots. D384: 1200 -> 1281 — Fort Donelson adds 27 unique side-unit ids x 3 slots. D388: 1281 -> 1326 — Elkhorn Tavern adds 15 unique side-unit ids x 3 Soldier's Story slots. D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 Soldier's Story slots. D393: 1380 -> 1434 — Wilderness adds 18 unique side-unit ids x 3 Soldier's Story slots. D397: 1434 -> 1512 — Petersburg initial assaults adds 26 unique side-unit ids x 3 Soldier's Story slots. D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots.
      var generated=findPerson(reg,function(p){ return p.generated && p.team && p.team.brigade && p.team.company; });
      var authored=findPerson(reg,function(p){ return !p.generated && !p.replacement && p.provenance==='Verified'; });
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
      if(!count || count.textContent.indexOf('1566 of 1566')<0) throw new Error('full registry count missing: '+(count&&count.textContent));   // D436: tracks the 1566-person registry (Atlanta +18x3); D397 tracked 1512; D393 tracked 1434, D391 tracked 1380 (see the count assertion above).
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
      if(rtxt.indexOf('2nd Rhode Island Infantry')<0 || rtxt.indexOf('Company D')<0 || rtxt.indexOf('First Bull Run')<0 || rtxt.indexOf('Source note:')<0 || rtxt.indexOf('Sources (5)')<0) throw new Error('Rhodes detail source/bio/unit payload missing: '+rtxt);   // D411: 4 -> 5 — the exactly-named "All for the Union" end-bound source row landed with the sourced 1861-1865 bounds (stale-pin bump approved by Aaron in the D411 take, 2026-07-16; same idiom as the D394 Five Forks stale-count fix).
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
      var cushingCard=cardByPid(root,'person_gettysburg_us_battery_a_cushing');
      if(!cushingCard) throw new Error('Cushing sourced replacement card missing');
      if(cushingCard.textContent.indexOf('Alonzo H. Cushing')<0 || cushingCard.textContent.indexOf('Sourced')<0 || cushingCard.textContent.indexOf('Verified')<0) throw new Error('Cushing card source/provenance missing: '+cushingCard.textContent);
      cushingCard.querySelector('[data-ss-pick]').click();
      var cushingDetail=root.querySelector('#ssPersonDetailCard');
      if(!cushingDetail || cushingDetail.getAttribute('data-ss-detail-pid')!=='person_gettysburg_us_battery_a_cushing') throw new Error('Cushing detail did not select');
      var cutxt=cushingDetail.textContent;
      if(cutxt.indexOf('Battery A')<0 || cutxt.indexOf('4th U.S. Artillery')<0 || cutxt.indexOf('II Corps')<0 || cutxt.indexOf('Pickett')<0 || cutxt.indexOf('Source note:')<0 || cutxt.indexOf('Sources (3)')<0) throw new Error('Cushing detail source/bio/unit payload missing: '+cutxt);
      if(cushingDetail.querySelector('.ss-person-portrait')) throw new Error('Cushing should not render an unverified portrait');
      var cookCard=cardByPid(root,'person_antietam_us_battery_b_cook');
      if(!cookCard) throw new Error('Cook sourced replacement card missing');
      if(cookCard.textContent.indexOf('John Cook')<0 || cookCard.textContent.indexOf('Sourced')<0 || cookCard.textContent.indexOf('Verified')<0) throw new Error('Cook card source/provenance missing: '+cookCard.textContent);
      cookCard.querySelector('[data-ss-pick]').click();
      var cookDetail=root.querySelector('#ssPersonDetailCard');
      if(!cookDetail || cookDetail.getAttribute('data-ss-detail-pid')!=='person_antietam_us_battery_b_cook') throw new Error('Cook detail did not select');
      var cookTxt=cookDetail.textContent;
      if(cookTxt.indexOf('Battery B')<0 || cookTxt.indexOf('4th U.S. Artillery')<0 || cookTxt.indexOf('I Corps')<0 || cookTxt.indexOf('Antietam')<0 || cookTxt.indexOf('acting cannoneer')<0 || cookTxt.indexOf('Source note:')<0 || cookTxt.indexOf('Sources (4)')<0) throw new Error('Cook detail source/bio/unit payload missing: '+cookTxt);
      if(cookTxt.indexOf('no higher rank')<0 || cookTxt.indexOf('no portrait')<0) throw new Error('Cook honesty caveats missing from detail: '+cookTxt);
      if(cookDetail.querySelector('.ss-person-portrait')) throw new Error('Cook should not render an unverified portrait');
      var howeCard=cardByPid(root,'person_vicksburg_us_55il_howe');
      if(!howeCard) throw new Error('Howe sourced replacement card missing');
      if(howeCard.textContent.indexOf('Orion P. Howe')<0 || howeCard.textContent.indexOf('Sourced')<0 || howeCard.textContent.indexOf('Verified')<0) throw new Error('Howe card source/provenance missing: '+howeCard.textContent);
      howeCard.querySelector('[data-ss-pick]').click();
      var howeDetail=root.querySelector('#ssPersonDetailCard');
      if(!howeDetail || howeDetail.getAttribute('data-ss-detail-pid')!=='person_vicksburg_us_55il_howe') throw new Error('Howe detail did not select');
      var howeTxt=howeDetail.textContent;
      if(howeTxt.indexOf('55th Illinois Infantry')<0 || howeTxt.indexOf('Company C')<0 || howeTxt.indexOf('XV Corps')<0 || howeTxt.indexOf('Vicksburg')<0 || howeTxt.indexOf('cartridge')<0 || howeTxt.indexOf('Blair')<0 || howeTxt.indexOf('Source note:')<0 || howeTxt.indexOf('Sources (5)')<0) throw new Error('Howe detail source/bio/unit payload missing: '+howeTxt);
      if(howeTxt.indexOf('no higher rank')<0 || howeTxt.indexOf('no portrait')<0) throw new Error('Howe honesty caveats missing from detail: '+howeTxt);
      if(howeDetail.querySelector('.ss-person-portrait')) throw new Error('Howe should not render an unverified portrait');
      var wallerCard=cardByPid(root,'person_gettysburg_us_6wi_waller');
      if(!wallerCard) throw new Error('Waller sourced replacement card missing');
      if(wallerCard.textContent.indexOf('Francis A. Waller')<0 || wallerCard.textContent.indexOf('Sourced')<0 || wallerCard.textContent.indexOf('Verified')<0) throw new Error('Waller card source/provenance missing: '+wallerCard.textContent);
      wallerCard.querySelector('[data-ss-pick]').click();
      var wallerDetail=root.querySelector('#ssPersonDetailCard');
      if(!wallerDetail || wallerDetail.getAttribute('data-ss-detail-pid')!=='person_gettysburg_us_6wi_waller') throw new Error('Waller detail did not select');
      var wallerTxt=wallerDetail.textContent;
      if(wallerTxt.indexOf('6th Wisconsin Infantry')<0 || wallerTxt.indexOf('Company I')<0 || wallerTxt.indexOf('Iron Brigade')<0 || wallerTxt.indexOf('Gettysburg')<0 || wallerTxt.indexOf('Railroad Cut')<0 || wallerTxt.indexOf('2nd Mississippi')<0 || wallerTxt.indexOf('Source note:')<0 || wallerTxt.indexOf('Sources (3)')<0) throw new Error('Waller detail source/bio/unit payload missing: '+wallerTxt);
      if(wallerTxt.indexOf('Wallar')<0 || wallerTxt.indexOf('no higher rank')<0 || wallerTxt.indexOf('no portrait')<0 || wallerTxt.indexOf('memory')<0) throw new Error('Waller honesty caveats missing from detail: '+wallerTxt);
      if(wallerDetail.querySelector('.ss-person-portrait')) throw new Error('Waller should not render an unverified portrait');
      var benjaminCard=cardByPid(root,'person_antietam_us_battery_e_benjamin');
      if(!benjaminCard) throw new Error('Benjamin sourced replacement card missing');
      if(benjaminCard.textContent.indexOf('Samuel N. Benjamin')<0 || benjaminCard.textContent.indexOf('Sourced')<0 || benjaminCard.textContent.indexOf('Verified')<0) throw new Error('Benjamin card source/provenance missing: '+benjaminCard.textContent);
      benjaminCard.querySelector('[data-ss-pick]').click();
      var benjaminDetail=root.querySelector('#ssPersonDetailCard');
      if(!benjaminDetail || benjaminDetail.getAttribute('data-ss-detail-pid')!=='person_antietam_us_battery_e_benjamin') throw new Error('Benjamin detail did not select');
      var btxt=benjaminDetail.textContent;
      if(btxt.indexOf('2nd U.S. Artillery')<0 || btxt.indexOf('Battery E')<0 || btxt.indexOf('IX Corps')<0 || btxt.indexOf('Antietam')<0 || btxt.indexOf('Stone Bridge')<0 || btxt.indexOf('last six rounds')<0 || btxt.indexOf('Source note:')<0 || btxt.indexOf('Sources (4)')<0) throw new Error('Benjamin detail source/bio/unit payload missing: '+btxt);
      if(btxt.indexOf('no captain-rank-at-Antietam')<0 || btxt.indexOf('no portrait')<0) throw new Error('Benjamin honesty caveats missing from detail: '+btxt);
      if(benjaminDetail.querySelector('.ss-person-portrait')) throw new Error('Benjamin should not render an unverified portrait');
      var barlowCard=cardByPid(root,'person_antietam_us_61ny_barlow');
      if(!barlowCard) throw new Error('Barlow sourced replacement card missing');
      if(barlowCard.textContent.indexOf('Francis C. Barlow')<0 || barlowCard.textContent.indexOf('Sourced')<0 || barlowCard.textContent.indexOf('Verified')<0) throw new Error('Barlow card source/provenance missing: '+barlowCard.textContent);
      barlowCard.querySelector('[data-ss-pick]').click();
      var barlowDetail=root.querySelector('#ssPersonDetailCard');
      if(!barlowDetail || barlowDetail.getAttribute('data-ss-detail-pid')!=='person_antietam_us_61ny_barlow') throw new Error('Barlow detail did not select');
      var barlowTxt=barlowDetail.textContent;
      if(barlowTxt.indexOf('61st and 64th New York Infantry')<0 || barlowTxt.indexOf('Caldwell')<0 || barlowTxt.indexOf('II Corps')<0 || barlowTxt.indexOf('Antietam')<0 || barlowTxt.indexOf('Sunken Road')<0 || barlowTxt.indexOf('one-man event')<0 || barlowTxt.indexOf('Source note:')<0 || barlowTxt.indexOf('Sources (4)')<0) throw new Error('Barlow detail source/bio/unit payload missing: '+barlowTxt);
      if(barlowTxt.indexOf('no brigadier-rank-at-Antietam')<0 || barlowTxt.indexOf('no single-company')<0 || barlowTxt.indexOf('no portrait')<0) throw new Error('Barlow honesty caveats missing from detail: '+barlowTxt);
      if(barlowDetail.querySelector('.ss-person-portrait')) throw new Error('Barlow should not render an unverified portrait');
      var worshamCard=cardByPid(root,'person_antietam_cs_21va_worsham');
      if(!worshamCard) throw new Error('Worsham sourced replacement card missing');
      if(worshamCard.textContent.indexOf('John H. Worsham')<0 || worshamCard.textContent.indexOf('Sourced')<0 || worshamCard.textContent.indexOf('Verified')<0) throw new Error('Worsham card source/provenance missing: '+worshamCard.textContent);
      worshamCard.querySelector('[data-ss-pick]').click();
      var worshamDetail=root.querySelector('#ssPersonDetailCard');
      if(!worshamDetail || worshamDetail.getAttribute('data-ss-detail-pid')!=='person_antietam_cs_21va_worsham') throw new Error('Worsham detail did not select');
      var worshamTxt=worshamDetail.textContent;
      if(worshamTxt.indexOf('21st Virginia Infantry')<0 || worshamTxt.indexOf('Company F')<0 || worshamTxt.indexOf("Jones' Brigade")<0 || worshamTxt.indexOf("Jackson's Division")<0 || worshamTxt.indexOf("Jackson's Command")<0 || worshamTxt.indexOf('Antietam')<0 || worshamTxt.indexOf('Maryland Campaign')<0 || worshamTxt.indexOf('Source note:')<0 || worshamTxt.indexOf('Sources (5)')<0) throw new Error('Worsham detail source/bio/unit payload missing: '+worshamTxt);
      if(worshamTxt.indexOf('no later sergeant/adjutant rank')<0 || worshamTxt.indexOf('no First Manassas claim')<0 || worshamTxt.indexOf('no portrait')<0) throw new Error('Worsham honesty caveats missing from detail: '+worshamTxt);
      if(worshamDetail.querySelector('.ss-person-portrait')) throw new Error('Worsham should not render an unverified portrait');
      var ballouCard=cardByPid(root,'person_bullrun_us_2ri_ballou');
      if(!ballouCard) throw new Error('Ballou sourced replacement card missing');
      if(ballouCard.textContent.indexOf('Sullivan Ballou')<0 || ballouCard.textContent.indexOf('Sourced')<0 || ballouCard.textContent.indexOf('Verified')<0) throw new Error('Ballou card source/provenance missing: '+ballouCard.textContent);
      ballouCard.querySelector('[data-ss-pick]').click();
      var ballouDetail=root.querySelector('#ssPersonDetailCard');
      if(!ballouDetail || ballouDetail.getAttribute('data-ss-detail-pid')!=='person_bullrun_us_2ri_ballou') throw new Error('Ballou detail did not select');
      var ballouTxt=ballouDetail.textContent;
      if(ballouTxt.indexOf('2nd Rhode Island Infantry')<0 || ballouTxt.indexOf("Burnside's Brigade")<0 || ballouTxt.indexOf("Hunter's Second Division")<0 || ballouTxt.indexOf('First Bull Run')<0 || ballouTxt.indexOf('Sarah')<0 || ballouTxt.indexOf('Matthews Hill')<0 || ballouTxt.indexOf('Source note:')<0 || ballouTxt.indexOf('Sources (3)')<0) throw new Error('Ballou detail source/bio/unit payload missing: '+ballouTxt);
      if(ballouTxt.indexOf('no company command')<0 || ballouTxt.indexOf('no autograph-original claim')<0 || ballouTxt.indexOf('no portrait')<0) throw new Error('Ballou honesty caveats missing from detail: '+ballouTxt);
      if(ballouDetail.querySelector('.ss-person-portrait')) throw new Error('Ballou should not render an unverified portrait');
      var webbCard=cardByPid(root,'person_gettysburg_us_webb_phila_bde');
      if(!webbCard) throw new Error('Webb sourced replacement card missing');
      if(webbCard.textContent.indexOf('Alexander S. Webb')<0 || webbCard.textContent.indexOf('Sourced')<0 || webbCard.textContent.indexOf('Verified')<0) throw new Error('Webb card source/provenance missing: '+webbCard.textContent);
      webbCard.querySelector('[data-ss-pick]').click();
      var webbDetail=root.querySelector('#ssPersonDetailCard');
      if(!webbDetail || webbDetail.getAttribute('data-ss-detail-pid')!=='person_gettysburg_us_webb_phila_bde') throw new Error('Webb detail did not select');
      var webbTxt=webbDetail.textContent;
      if(webbTxt.indexOf('Philadelphia Brigade')<0 || webbTxt.indexOf('Second Division')<0 || webbTxt.indexOf('II Corps')<0 || webbTxt.indexOf('Gettysburg')<0 || webbTxt.indexOf('Pickett')<0 || webbTxt.indexOf('Angle')<0 || webbTxt.indexOf('Source note:')<0 || webbTxt.indexOf('Sources (3)')<0) throw new Error('Webb detail source/bio/unit payload missing: '+webbTxt);
      if(webbTxt.indexOf('No company command')<0 || webbTxt.indexOf('no major-general-at-Gettysburg rank')<0 || webbTxt.indexOf('no portrait')<0) throw new Error('Webb honesty caveats missing from detail: '+webbTxt);
      if(webbDetail.querySelector('.ss-person-portrait')) throw new Error('Webb should not render an unverified portrait');
      var caslerCard=cardByPid(root,'person_chancellorsville_cs_33va_casler');
      if(!caslerCard) throw new Error('Casler sourced replacement card missing');
      if(caslerCard.textContent.indexOf('John O. Casler')<0 || caslerCard.textContent.indexOf('Sourced')<0 || caslerCard.textContent.indexOf('Verified')<0) throw new Error('Casler card source/provenance missing: '+caslerCard.textContent);
      caslerCard.querySelector('[data-ss-pick]').click();
      var caslerDetail=root.querySelector('#ssPersonDetailCard');
      if(!caslerDetail || caslerDetail.getAttribute('data-ss-detail-pid')!=='person_chancellorsville_cs_33va_casler') throw new Error('Casler detail did not select');
      var caslerTxt=caslerDetail.textContent;
      if(caslerTxt.indexOf('33rd Virginia Infantry')<0 || caslerTxt.indexOf("Paxton's Brigade (Stonewall Brigade)")<0 || caslerTxt.indexOf('Chancellorsville')<0 || caslerTxt.indexOf('Pioneer Corps')<0 || caslerTxt.indexOf('Source note:')<0 || caslerTxt.indexOf('Sources (3)')<0) throw new Error('Casler detail source/bio/unit payload missing: '+caslerTxt);
      if(caslerTxt.indexOf('did not witness Paxton')<0 || caslerTxt.indexOf('secondhand')<0 || caslerTxt.indexOf('No portrait')<0) throw new Error('Casler honesty caveats missing from detail: '+caslerTxt);
      if(caslerDetail.querySelector('.ss-person-portrait')) throw new Error('Casler should not render an unverified portrait');
      var vincentCard=cardByPid(root,'person_gettysburg_us_vincent_bde');
      if(!vincentCard) throw new Error('Vincent sourced replacement card missing');
      if(vincentCard.textContent.indexOf('Strong Vincent')<0 || vincentCard.textContent.indexOf('Sourced')<0 || vincentCard.textContent.indexOf('Verified')<0) throw new Error('Vincent card source/provenance missing: '+vincentCard.textContent);
      vincentCard.querySelector('[data-ss-pick]').click();
      var vincentDetail=root.querySelector('#ssPersonDetailCard');
      if(!vincentDetail || vincentDetail.getAttribute('data-ss-detail-pid')!=='person_gettysburg_us_vincent_bde') throw new Error('Vincent detail did not select');
      var vtxt=vincentDetail.textContent;
      if(vtxt.indexOf('Vincent\\'s Brigade')<0 || vtxt.indexOf('First Division')<0 || vtxt.indexOf('V Corps')<0 || vtxt.indexOf('Little Round Top')<0 || vtxt.indexOf('20th Maine')<0 || vtxt.indexOf('Source note:')<0 || vtxt.indexOf('Sources (3)')<0) throw new Error('Vincent detail source/bio/unit payload missing: '+vtxt);
      if(vtxt.indexOf('no company')<0 || vtxt.indexOf('no portrait')<0) throw new Error('Vincent honesty caveats missing from detail: '+vtxt);
      if(vincentDetail.querySelector('.ss-person-portrait')) throw new Error('Vincent should not render an unverified portrait');

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
    await page.screenshot({ path: shotPath, fullPage:false, timeout:90000 });
    const shot = statSync(shotPath);
    result.screenshot = { path: shotPath, bytes: shot.size };
    if (!shot.size) result.ok = false;
    result.pageerrors = pageerrors;
    if (pageerrors.length) result.ok = false;
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-loot-survival.json'), JSON.stringify(result, null, 2));
    if (srv) srv.kill();
    await Promise.race([browser.close(), sleep(5000)]).catch(() => {});
  }
  console.log('probe-loot-survival ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.screenshot) console.log('  screenshot ' + result.screenshot.path + ' bytes=' + result.screenshot.bytes);
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
  process.exit(0);
})();
