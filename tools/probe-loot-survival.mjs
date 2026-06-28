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
  try {
    var fns=['lootInit','lootAddItem','lootUseItem','lootEquipItem','lootSetSurvival','lootForage','lootSurvivalTick','lootOnResolve','lootSurvivalBridgeBonus','lootRenderTab','lootWireTab','ssPersonRegistry','ssFindPerson','ssStartJourney','bridgeArmy','_t1InitAll','_t1Resolve'];
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
      if(other){
        var blocked=ssStartJourney(C,other.pid,'antietam');
        if(blocked.ok || blocked.reason!=='journey-active') throw new Error('journey restart should be blocked, got '+JSON.stringify(blocked));
        if(C.loot.journey.personId!==target.pid || C.loot.journey.battleId!=='bullrun1') throw new Error('blocked restart changed active journey');
      }
      return { person:target.name, pid:target.pid, battle:C.loot.journey.battleId };
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

    step('UI: President desk exposes Campaign Kit tab and renders inventory/survival/Soldier sections', function(){
      var C=mkC('US'); G.campaign=C; _t1InitAll(C);
      lootAddItem(C,'commissary_rations',1,'probe');
      var reg=ssPersonRegistry(C);
      openWarDept();
      var tab=document.getElementById('wdTab_loot');
      if(!tab) throw new Error('missing Campaign Kit tab button');
      tab.click();
      var cont=document.getElementById('wdContent');
      var txt=cont ? cont.textContent : '';
      if(txt.indexOf('Campaign Kit')<0 || txt.indexOf('Inventory')<0 || txt.indexOf('Survival')<0 || txt.indexOf("The Soldier's Story")<0) throw new Error('missing loot tab sections: '+txt.slice(0,200));
      var sel=cont.querySelector('#ssPersonSelect');
      if(!sel || sel.options.length!==reg.people.length) throw new Error('full play-as selector missing people: '+(sel&&sel.options.length)+' vs '+reg.people.length);
      var last=reg.people[reg.people.length-1];
      sel.value=last.pid;
      var begin=cont.querySelector('#ssBeginSelected');
      if(!begin) throw new Error('missing begin selected control');
      if(begin.disabled) throw new Error('begin should be enabled before a journey starts');
      begin.click();
      if(!C.loot || !C.loot.journey || C.loot.journey.personId!==last.pid) throw new Error('UI did not start selected journey: '+(C.loot&&C.loot.journey&&C.loot.journey.personId)+' vs '+last.pid);
      cont=document.getElementById('wdContent');
      var disabled=cont && cont.querySelector('#ssBeginSelected');
      if(!disabled || !disabled.disabled || disabled.textContent.indexOf('Journey Active')<0) throw new Error('active journey UI should block restart');
      return { text:txt.slice(0,120), buttons:cont.querySelectorAll('button').length, options:sel.options.length, started:last.pid, restartDisabled:disabled.disabled };
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
