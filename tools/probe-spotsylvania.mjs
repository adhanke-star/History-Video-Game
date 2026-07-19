#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D391 playable Spotsylvania: The Bloody Angle (May 12, 1864). The focused guard binds the
// single-phase US-attacker data, THE ARTILLERY-WITHDRAWAL INPUT LAW (the gun-stripped tip:
// the initial CS OOB fields ZERO guns and CS artillery re-enters only with the re-formed
// line), the current 24/54/1512/24/129 integration surfaces after D397 (Petersburg initial
// assaults inserted at rank 69), the section-6 rank wall, and exactly
// eight shared-model historical direction seeds.
//
// CASUALTY-DIRECTION-NEUTRAL (D390 spec section 7, the Cedar Creek variant): the May 12
// sourced grain includes about 3,000 prisoners inside the CS total and no source recomputes
// a prisoners-excluded split, so this probe carries NO per-side casualty comparison tooth
// in either direction, aggregate or otherwise. The single direction guard is the sourced
// outcome: THE DEFENDER ULTIMATELY HOLDS the salient interior in at least 5 of 8 seeds.
//
// The direction battery runs on a direct-data override (the five-forks precedent), so it is
// independent of the T1 registration line: the registry-removal bind bites exactly the
// declared REGISTRY/LAUNCH/DOM/ARMY-REGISTER teeth while history stays green.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { Script } from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, "shots.json"), "utf8"));
const GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--disable-dev-shm-usage"];
const SEEDS = [3, 19, 31, 47, 73, 109, 223, 401];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function up(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok || r.status === 200;
  } catch {
    return false;
  }
}
function killChild(child) {
  if (!child) return;
  try { child.kill(); } catch {}
}
async function closeBrowserHard(browser) {
  if (!browser) return;
  const proc = typeof browser.process === "function" ? browser.process() : null;
  let closed = false;
  try {
    await Promise.race([
      browser.close().then(() => { closed = true; }, () => { closed = true; }),
      sleep(2500)
    ]);
  } catch {}
  if (!closed && proc && !proc.killed) {
    try { proc.kill("SIGKILL"); } catch {}
  }
}
function printResult(result) {
  console.log("probe-spotsylvania ok=" + result.ok + " steps=" + (result.steps || []).length + " pageerrors=" + (result.pageerrors || []).length);
  if (result.fatal) console.log("  FATAL " + result.fatal);
  for (const s of (result.steps || [])) {
    if (s.ok) console.log("  ok   " + s.name.slice(0, 96) + " :: " + JSON.stringify(s.v).slice(0, 320));
    else console.log("  FAIL " + s.name + " :: " + s.err);
  }
}

const SETUP = `(() => {
  var R = { ok:true, steps:[], errors:[] };
  function check(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message || ev.error || ev)); });
  var DATA = GAME_DATA.spotsylvania && GAME_DATA.spotsylvania.spotsylvania;
  var SEEDS = ${JSON.stringify(SEEDS)};
  function rows() {
    var out = [], sides = ['US','CS'];
    for (var si=0; si<sides.length; si++) {
      var side=sides[si], list=((DATA.oob||{})[side])||[];
      for (var i=0;i<list.length;i++) out.push({side:side,u:list[i]});
    }
    for (var r=0;r<(DATA.reinforcements||[]).length;r++) out.push({side:String(DATA.reinforcements[r].side||''),u:DATA.reinforcements[r]});
    return out;
  }
  function totals() {
    var out={US:0,CS:0,units:0,opening:((DATA.oob.US||[]).length+(DATA.oob.CS||[]).length),gunsUS:0,gunsCS:0,openGunsCS:0,openMenCS:0};
    rows().forEach(function(row){ out[row.side]+=(row.u.men||0); out.units++; if(row.u.arm==='art') out[row.side==='US'?'gunsUS':'gunsCS']+=(row.u.guns||0); });
    (DATA.oob.CS||[]).forEach(function(u){ out.openMenCS+=(u.men||0); if(u.arm==='art') out.openGunsCS+=(u.guns||0); });
    return out;
  }
  function sourceUrls(value) {
    var seen={},out=[]; if(!Array.isArray(value)) return out;
    value.forEach(function(u){if(typeof u==='string'&&/^https?:/.test(u)&&!seen[u]){seen[u]=1;out.push(u);}}); return out;
  }
  function keyScan(obj,path,bad) {
    if(!obj||typeof obj!=='object') return;
    var forbidden={damage:1,dmg:1,damagemult:1,firepower:1,firepowermult:1,firescale:1,firemult:1,firemultiplier:1,killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossscale:1,lossmult:1,capturescale:1,capturemult:1,surrenderscale:1,surrendermult:1,routscale:1,routmult:1,moralescale:1,moralemult:1,combatscale:1,battledamage:1,battlefire:1,powermult:1,scorebonus:1,scoremult:1,winner:1,winoverride:1,victoryoverride:1,outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,genius:1,geniusmult:1,ammopenalty:1,ammomult:1,supplymult:1,supplypenalty:1,exhaustionmult:1,fatiguemult:1,starvationmult:1,marchpenalty:1,surprisebonus:1,surprisemult:1,envelopmentbonus:1,envelopmentmult:1,panicmult:1,collapsemult:1,meleemult:1,handtohandbonus:1,prisonermult:1,capturebonus:1};
    for(var k in obj) if(Object.prototype.hasOwnProperty.call(obj,k)) { var p=path?path+'.'+k:k; if(forbidden[String(k).toLowerCase()]) bad.push(p); keyScan(obj[k],p,bad); }
  }
  function withDirectSpotsylvania(fn) {
    var oldScenarioData=fldScenarioData;
    try {
      fldScenarioData=function(id){ return id==='spotsylvania' ? DATA : oldScenarioData(id); };
      return fn();
    } finally { fldScenarioData=oldScenarioData; }
  }
  function runBattle(seed,autoBoth,playerSide) {
    return withDirectSpotsylvania(function(){
      G.campaign=null; G.settings=G.settings||{}; delete G.settings.tacticalFog;
      try{delete G.settings.tacticalPreset;}catch(e){}
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none',scenario:'spotsylvania',autoBoth:autoBoth!==false,playerSide:playerSide||'US',seed:seed});
      __FIELD.phase='battle'; __FIELD.paused=false;
      var n=0; while(__FIELD.phase==='battle'&&n<24000){fldSimStep(0.05);n++;}
      return {winner:__FIELD.winner,by:__FIELD.winBy,phase:__FIELD.phase,steps:n};
    });
  }
  function campaign() { return {side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[],nextId:1,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]}; }
  try {
    if(!DATA) throw new Error('GAME_DATA.spotsylvania.spotsylvania missing');

    check('DATA + OOB: single-phase US attacker, fog off, envelope totals 18,300/15,860 inside 14,000-25,000 and 8,000-16,000, 18 unique Inferred-strength units', function(){
      var t=totals(), ids={}, unitRows=rows();
      if(DATA.id!=='spotsylvania'||DATA.attacker!=='US'||DATA.defender!=='CS'||DATA.defaultFog!==false||Object.prototype.hasOwnProperty.call(DATA,'phases')) throw new Error('root shape wrong');
      if(!(t.US>=14000&&t.US<=25000)) throw new Error('US committed total outside the D390 envelope: '+t.US);
      if(!(t.CS>=8000&&t.CS<=16000)) throw new Error('CS committed total outside the D390 envelope: '+t.CS);
      if(!(t.openMenCS>=3500&&t.openMenCS<=5500)) throw new Error('initial Johnson-division defense outside 3,500-5,500: '+t.openMenCS);
      if(t.units!==18||t.opening!==10) throw new Error('unit shape wrong: '+JSON.stringify(t));
      unitRows.forEach(function(row){var k=row.side+':'+row.u.id;if(ids[k])throw new Error('duplicate '+k);ids[k]=1;if(String(row.u.note||'').indexOf('Inferred strength')<0)throw new Error('missing disclosure '+k);if(row.u.arm==='art'&&(!(row.u.guns>0)||row.u.men/row.u.guns>40))throw new Error('artillery envelope wrong '+k);});
      if(Object.keys(ids).length!==18) throw new Error('unique unit count wrong: '+Object.keys(ids).length);
      if(!DATA.weather||DATA.weather.sky!=='rain'||DATA.weather.provenance!=='Inferred') throw new Error('sourced-rain weather contract wrong');
      if(!/May 12, 1864/.test(DATA.date)) throw new Error('date wrong: '+DATA.date);
      return t;
    });

    check('ARTILLERY-WITHDRAWAL INPUT LAW: the initial CS OOB fields ZERO guns; CS artillery re-enters only as the re-formed-line reinforcement; the US fields true supporting weight', function(){
      var t=totals();
      if(t.openGunsCS!==0) throw new Error('the gun-stripped tip must open with ZERO CS guns, got '+t.openGunsCS);
      var csArtOpen=(DATA.oob.CS||[]).filter(function(u){return u.arm==='art';});
      if(csArtOpen.length!==0) throw new Error('CS opening OOB contains an artillery unit');
      var csArtRe=(DATA.reinforcements||[]).filter(function(u){return u.side==='CS'&&u.arm==='art';});
      if(csArtRe.length!==1||!(csArtRe[0].atSec>0)||!(csArtRe[0].guns>0)) throw new Error('exactly one timed re-formed-line CS artillery grouping required');
      if(String(csArtRe[0].note||'').indexOf('never re-enter')<0&&String(csArtRe[0].note||'').indexOf('NEVER re-enter')<0) throw new Error('captured-batteries-never-re-enter disclosure missing');
      if(!(t.gunsUS>=15)) throw new Error('US supporting weight too thin: '+t.gunsUS+' guns');
      var text=JSON.stringify(DATA);
      ['22 of 30','gun-stripped'].forEach(function(s){if(text.indexOf(s)<0)throw new Error('withdrawal-law teaching anchor missing: '+s);});
      return {openGunsCS:0,reformedGuns:csArtRe[0].guns,gunsUS:t.gunsUS};
    });

    check('REGISTRY + MENU: Spotsylvania remains rank 68 in the 27-scenario registry after Wilderness, before Cold Harbor', function(){
      var reg=fldScenarioRegistry(),order=fldScenarioMenuOrder(reg);
      if(Object.keys(reg).length!==27||reg.spotsylvania!==DATA) throw new Error('registry identity/count wrong');   // D397: 23 -> 24 — Petersburg initial assaults registers at rank 69. D393: 22 -> 23 — the Wilderness registered. D442: 24 -> 26 — Atlanta (D436, whose sweep missed this count pin — recorded honestly) and Cold Harbor (rank 68.5) both register. D463: 26 -> 27 — Fort Pillow registers at rank 66 between Chattanooga and the Wilderness (LANE-013 P4, the D455 SS3 row 6 unlock).
      if(fldScenarioMenuRank('spotsylvania')!==68) throw new Error('menu rank wrong: '+fldScenarioMenuRank('spotsylvania'));
      if(order.indexOf('fortPillow')!==order.indexOf('chattanooga')+1||order.indexOf('wilderness')!==order.indexOf('fortPillow')+1||order.indexOf('spotsylvania')!==order.indexOf('wilderness')+1||order.indexOf('coldHarbor')!==order.indexOf('spotsylvania')+1||order.indexOf('petersburgAssaults')!==order.indexOf('coldHarbor')+1||order.indexOf('kennesaw')!==order.indexOf('petersburgAssaults')+1) throw new Error('menu chronology wrong: '+order.join(' -> '));   // D463 reshape: Fort Pillow (rank 66) inserts between Chattanooga and the Wilderness; the seven-battle chronology stays guarded. D442 reshape: Cold Harbor (the documented 68.5) inserts between Spotsylvania and the Petersburg initial assaults; the six-battle chronology stays guarded. D397 reshape: Petersburg initial assaults (rank 69) between Spotsylvania and Kennesaw. D393 reshape: Wilderness between Chattanooga and Spotsylvania; D391 guarded the prior three-battle chronology.
      return {count:Object.keys(reg).length,rank:68,after:'wilderness',before:'coldHarbor'};
    });

    check('TERRAIN + OBJECTIVE: the Mule Shoe works, the Bloody Angle, the East Angle, the base line, and the INTERIOR McCoull objective are encoded; the tip is not the objective', function(){
      var text=JSON.stringify(DATA),markers=(DATA.terrain&&DATA.terrain.markers)||[],walls=(DATA.terrain&&DATA.terrain.walls)||[];
      ['Mule Shoe','Bloody Angle','East Angle','McCoull','Harrison','Landrum','Brown House',"Lee's final line",'BASE LINE','abatis','traverses'].forEach(function(s){if(text.toLowerCase().indexOf(s.toLowerCase())<0)throw new Error('missing landmark '+s);});
      if(walls.length!==10||markers.length<9) throw new Error('works/markers shape wrong: '+walls.length+'/'+markers.length);
      if(DATA.objective.name.indexOf('McCoull')<0||DATA.objective.name.indexOf('Interior')<0) throw new Error('objective is not the salient interior: '+DATA.objective.name);
      var tipZ=470;
      if(!(DATA.objective.z<tipZ-100)) throw new Error('objective anchor sits on the captured tip, not the interior');
      return {objective:DATA.objective.name,walls:walls.length,markers:markers.length};
    });

    check('RANK WALL: battle-date grades exact; Wright/Gordon brigadier; no Lt. Gen. Anderson, no full-General Grant, no Sedgwick or Longstreet or dead officer in any command seat', function(){
      var text=JSON.stringify(DATA);
      ['Lt. Gen. Ulysses S. Grant','Maj. Gen. Winfield S. Hancock','Brig. Gen. Horatio G. Wright','Lt. Gen. Richard S. Ewell','Brig. Gen. John B. Gordon','Brig. Gen. Francis C. Barlow','Maj. Gen. David B. Birney','Brig. Gen. Gershom Mott','Brig. Gen. John Gibbon','Brig. Gen. Nelson A. Miles','Col. John R. Brooke','Brig. Gen. Stephen D. Ramseur','Brig. Gen. Junius Daniel','Brig. Gen. Nathaniel H. Harris','Brig. Gen. Samuel McGowan','Col. William Monaghan','Col. William A. Witcher','Brig. Gen. James A. Walker','Maj. Gen. Jubal A. Early'].forEach(function(s){if(text.indexOf(s)<0)throw new Error('missing required rank rendering: '+s);});
      // The two quote-bearing names are checked at the object level (JSON.stringify escapes their inner quotes).
      var leaderNames=(((DATA.leaders||{}).US)||[]).concat(((DATA.leaders||{}).CS)||[]).map(function(l){return String(l.name||'');});
      var commanderNames=rows().map(function(row){return String(row.u.commander||'');});
      if(leaderNames.indexOf('Maj. Gen. Edward "Allegheny" Johnson')<0)throw new Error('missing required rank rendering: Johnson (Maj. Gen., quoted nickname)');
      if(commanderNames.indexOf('Brig. Gen. George H. "Maryland" Steuart')<0)throw new Error('missing required rank rendering: Steuart (Brig. Gen., quoted nickname)');
      [/Maj\\. Gen\\. (?:Horatio G?\\.? )?Wright/,/Major General (?:Horatio G?\\.? )?Wright/,/Lt\\. Gen\\. (?:Richard H?\\.? )?Anderson/,/Lieutenant General (?:Richard H?\\.? )?Anderson/,/Maj\\. Gen\\. (?:John B?\\.? )?Gordon/,/Major General (?:John B?\\.? )?Gordon/,/General Grant\\b(?! [a-z])/,/Lt\\. Gen\\. (?:James )?Longstreet.*(commander|leader)/].forEach(function(re){if(re.test(text))throw new Error('forbidden rank rendering: '+re);});
      var castText='';
      rows().forEach(function(row){castText+=' '+String(row.u.commander||'')+' '+String(row.u.name||'');});
      (((DATA.leaders||{}).US)||[]).concat(((DATA.leaders||{}).CS)||[]).forEach(function(l){castText+=' '+String(l.name||'');});
      [/Sedgwick/i,/Longstreet/i,/Stafford/i,/J\\. ?M\\. ?Jones/i,/Leroy/i,/Abner Perrin/i].forEach(function(re){if(re.test(castText))throw new Error('dead/absent officer holds a command seat: '+re);});
      var wr=(((DATA.leaders||{}).US)||[]).filter(function(l){return /Wright/.test(String(l.name||''));})[0];
      if(!wr||!(wr.atSec>0)) throw new Error('Wright must arrive with the timed VI Corps commitment');
      if(String(wr.note||'').indexOf('May 12')<0) throw new Error('Wright same-day paperwork nuance undisclosed');
      return {requiredRanks:21,wright:'Brig. Gen., timed arrival, same-day nuance disclosed',anderson:'absent by design',sedgwick:'teaching only'};
    });

    check('D74 NO-FUDGE: deep data scan finds no battle-specific output, fire, morale, surprise, melee, prisoner, or capture key of any name', function(){
      var bad=[];keyScan(DATA,'spotsylvania',bad);if(bad.length)throw new Error(bad.join(', '));return {bad:0};
    });

    check('REGISTERED LAUNCH + REINFORCEMENTS: canonical data launches single-phase, the 18-unit cast completes once, CS guns appear only with the re-formed line', function(){
      delete G.battle; G.mode='menu';
      G.campaign=null; G.settings=G.settings||{}; delete G.settings.tacticalFog;
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none',scenario:'spotsylvania',autoBoth:true,playerSide:'US',seed:22});
      if(__FIELD.scenData!==DATA||__FIELD.units.length!==10||(__FIELD.reinforce||[]).length!==8) throw new Error('registered launch wrong: '+__FIELD.units.length+'/'+(__FIELD.reinforce||[]).length);
      if(__FIELD.phases!==null) throw new Error('single-phase battle leaked phase machinery');
      if(__FIELD.attacker!=='US'||__FIELD.fog!==false) throw new Error('launch role/fog wrong');
      if(__FIELD.objective.name.indexOf('McCoull')<0) throw new Error('launch objective wrong: '+__FIELD.objective.name);
      var csGunsOnField=function(){var g=0;__FIELD.units.forEach(function(u){if(u.side==='CS'&&(u.guns>0))g+=u.guns;});return g;};
      if(csGunsOnField()!==0) throw new Error('CS guns on field before the re-formed line: '+csGunsOnField());
      __FIELD.t=120;fldScenarioTick(0.05);var once=__FIELD.units.length;fldScenarioTick(0.05);
      if(once!==18||__FIELD.units.length!==18||!__FIELD.reinforce.every(function(r){return r.done;})) throw new Error('reinforcement completion not idempotent: '+once+'/'+__FIELD.units.length);
      if(csGunsOnField()<=0) throw new Error('re-formed-line CS guns missing after arrival');
      if(G.battle&&G.battle.M) throw new Error('Classic battle state created');
      return {opening:10,fielded:18,reinforcements:8,csGunsAfterReform:csGunsOnField()};
    });

    check('SAME-SEED REPLAY: direct Spotsylvania runs reproduce winner and finish deterministically', function(){
      var a=runBattle(97,true,'US'),b=runBattle(97,true,'US');
      if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('same-seed drift: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      if(a.phase!=='over'||a.steps>=24000)throw new Error('run did not terminate');return a;
    });

    check('PASSIVE-SIDE TERMINATION: Union-passive and Confederate-passive direct launches both finish under the shared engine', function(){
      var usPassive=runBattle(131,false,'US'),csPassive=runBattle(137,false,'CS');
      if(usPassive.phase!=='over'||csPassive.phase!=='over'||usPassive.steps>=24000||csPassive.steps>=24000)throw new Error('passive launch did not terminate');
      return {usPassive:{winner:usPassive.winner,steps:usPassive.steps},csPassive:{winner:csPassive.winner,steps:csPassive.steps}};
    });

    check('historical direction: exactly eight seeds - the defender ultimately holds the salient interior in at least 5 of 8 (CASUALTY-DIRECTION-NEUTRAL: no per-side casualty tooth exists)', function(){
      if(SEEDS.length!==8) throw new Error('exactly eight seeds required');
      var uniq={};SEEDS.forEach(function(s){uniq[s]=1;});
      if(Object.keys(uniq).length!==8) throw new Error('seeds must be unique');
      var csHolds=0,samples=[];
      for(var i=0;i<SEEDS.length;i++){
        var r=runBattle(SEEDS[i],true,'US');
        if(r.phase!=='over')throw new Error('seed '+SEEDS[i]+' did not finish');
        if(r.winner==='CS')csHolds++;
        samples.push({seed:SEEDS[i],winner:r.winner,by:r.by});
      }
      if(!(csHolds>=5))throw new Error('defender holds below 5/8: '+csHolds+' :: '+JSON.stringify(samples));
      return {seeds:SEEDS,defenderHolds:csHolds+'/8',samples:samples};
    });

    check('TEACHING + CODEX: nine restrained two-source cards with exact provenance, the Butcher/guns/prisoner/Sedgwick threads, and Eastern / Overland Campaign / Inconclusive axes', function(){
      var cards=((DATA.teaching||{}).cards)||[],codex=(DATA.teaching||{}).codex||{},ids=[];
      if(cards.length<8)throw new Error('only '+cards.length+' cards');
      cards.forEach(function(c){ids.push(c.id);if(!/^(Verified|Inferred|Disputed)$/.test(String(c.provenance||''))||sourceUrls(c.sources).length<2)throw new Error('bad card '+c.id);});
      ['sp_grant_butcher','sp_guns_too_late','sp_first_hour','sp_nearly_full_day','sp_counterattacks','sp_sedgwick','sp_prisoners_east_face','sp_lees_last_line','sp_not_this_scenario'].forEach(function(id){if(ids.indexOf(id)<0)throw new Error('missing '+id);});
      var cardText=JSON.stringify(cards);
      ['Butcher','guns','prisoner','Sedgwick','bloody miscue','Rhea','nearly a full day','agency, not anecdote'].forEach(function(s){if(cardText.toLowerCase().indexOf(s.toLowerCase())<0)throw new Error('teaching thread missing: '+s);});
      if(!/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance||''))||sourceUrls(codex.sources).length<2)throw new Error('codex provenance/sources wrong');
      if(!codex.axes||codex.axes.theater!=='Eastern'||codex.axes.campaign!=='Overland Campaign'||codex.axes.result!=='Inconclusive')throw new Error('codex axes wrong');
      return {cards:ids.length,codex:codex.id,axes:codex.axes};
    });

    check('ARMY REGISTER PIN: canonical registry identity plus 18 Spotsylvania unit trios produce current total 1632', function(){
      var registry=fldScenarioRegistry();if(registry.spotsylvania!==DATA)throw new Error('declared registry dependency missing');
      var C=campaign();if(typeof _t1InitAll==='function')_t1InitAll(C);var reg=ssPersonRegistry(C),found=[],groups={};
      if(reg.people.length!==1632)throw new Error('Army Register total '+reg.people.length+' expected 1632');   // D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D393: 1380 -> 1434 — Wilderness adds 18 unique side-unit ids x 3 slots. D397: 1434 -> 1512 — Petersburg initial assaults adds 26 unique side-unit ids x 3 slots. D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots. D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots. D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7): Watie's 2nd CMR adds 1 unique side-unit id x 3 slots. D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (LANE-013 P4, the D455 SS3 row 6 unlock).
      for(var i=0;i<reg.people.length;i++){var p=reg.people[i],origin=p.replaces||p.pid;if(typeof origin==='string'&&origin.indexOf('ss:spotsylvania:')===0)found.push({p:p,origin:origin});}
      if(found.length!==54)throw new Error('Spotsylvania rows '+found.length+' expected 54');
      found.forEach(function(row){var m=row.origin.match(/^ss:spotsylvania:(US|CS):([^:]+):(cmd|nco|pvt)$/);if(!m)throw new Error('bad slot '+row.origin);var key=m[1]+':'+m[2];groups[key]=groups[key]||{};groups[key][m[3]]=1;if(row.p.source!=='scenario-oob'||row.p.generated!==true||row.p.provenance!=='Inferred')throw new Error('slot metadata '+row.origin);});
      var keys=Object.keys(groups);if(keys.length!==18)throw new Error('unit groups '+keys.length+' expected 18');keys.forEach(function(k){if(!groups[k].cmd||!groups[k].nco||!groups[k].pvt)throw new Error('incomplete trio '+k);});
      return {total:reg.people.length,spotsylvaniaRows:found.length,units:keys.length,slots:['cmd','nco','pvt']};
    });

    check('SCOPE: single-phase only; no unbuilt Cold Harbor/Crater/Overland-campaign tactical registration and no Spotsylvania-only combat function appears', function(){
      var ids=Object.keys(fldScenarioRegistry());if(ids.some(function(id){return /crater|overlandCampaign/i.test(id);}))throw new Error('forbidden tactical Overland id');   // D397 reshape: petersburgAssaults now has a ratified registration and leaves this scope tooth; the still-unbuilt Cold Harbor/Crater lanes stay forbidden. D393 dropped wilderness the same way. D454: coldHarbor (cold-harbor) is RATIFIED + registered as scenario 26 since D442 and leaves this tooth the same documented way — the D442 VETTING-DEFERRED slice never ran this probe; crater + overlandCampaign stay forbidden until their own ratified builds.
      if(DATA.phases)throw new Error('Spotsylvania became phased');
      var functions=['spotsylvaniaPenalty','spotsylvaniaBonus','muleShoeMult','bloodyAngleMult','handToHandBonus','prisonerMult'];functions.forEach(function(n){if(typeof window[n]==='function')throw new Error('battle-specific function '+n);});
      return {singlePhase:true,forbiddenIds:0,battleSpecificFunctions:0};
    });
  } catch(e) { R.ok=false;R.fatal=String(e&&e.message||e); }
  return JSON.stringify(R);
})()`;

const DOM = `(() => {
  var R={ok:true,steps:[],errors:[]};
  function check(name,fn){try{var v=fn();R.steps.push({name:name,ok:true,v:v===undefined?null:v});}catch(e){R.ok=false;R.steps.push({name:name,ok:false,err:String(e&&e.message||e)});}}
  try {
    G.settings=G.settings||{};G.mode='menu';
    check('RUNTIME MENU + SIDE CHOICE: Spotsylvania button is unique after Wilderness and before Kennesaw, and fldLaunchBattle preserves the chosen Confederate side',function(){
      if(typeof openMainMenu==='function')openMainMenu();fldInjectMenuButton();
      var btn=document.getElementById('fldScnBtn_spotsylvania');if(!btn||!btn.getAttribute('aria-label'))throw new Error('accessible Spotsylvania button missing');
      fldInjectMenuButton();if(document.querySelectorAll('#fldScnBtn_spotsylvania').length!==1)throw new Error('duplicate Spotsylvania button');
      var ids=Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){return b.id;});
      if(ids.indexOf('fldScnBtn_wilderness')!==ids.indexOf('fldScnBtn_chattanooga')+1||ids.indexOf('fldScnBtn_spotsylvania')!==ids.indexOf('fldScnBtn_wilderness')+1||ids.indexOf('fldScnBtn_coldHarbor')!==ids.indexOf('fldScnBtn_spotsylvania')+1||ids.indexOf('fldScnBtn_petersburgAssaults')!==ids.indexOf('fldScnBtn_coldHarbor')+1||ids.indexOf('fldScnBtn_kennesaw')!==ids.indexOf('fldScnBtn_petersburgAssaults')+1)throw new Error('button chronology wrong: '+ids.join(' -> '));   // D397 reshape DOM variant: preserve Chattanooga -> Wilderness -> Spotsylvania -> Petersburg initial assaults -> Kennesaw. D393 preserved the prior four-button chronology. D454 re-pin: D442 registered coldHarbor at rank 68.5 BETWEEN spotsylvania and petersburgAssaults (probe-tactical-roster pins the same order) — the chain now guards Chattanooga -> Wilderness -> Spotsylvania -> Cold Harbor -> Petersburg initial assaults -> Kennesaw.
      var got=null;fldScenarioSideChoice('spotsylvania',function(side){got=side;});var cards=document.querySelectorAll('[data-brside]');
      if(cards.length!==2)throw new Error('wanted two side cards, got '+cards.length);cards[1].click();if(got!=='CS')throw new Error('CS side card returned '+got);
      var captured=null,oldLaunch=window.fldLaunchSandbox,oldBrief=window.fldBullRunBriefing;
      try{window.fldLaunchSandbox=function(opts){captured=opts;};window.fldBullRunBriefing=function(){};fldLaunchBattle('spotsylvania','CS');}
      finally{window.fldLaunchSandbox=oldLaunch;window.fldBullRunBriefing=oldBrief;}
      if(!captured||captured.scenario!=='spotsylvania'||captured.playerSide!=='CS'||captured.renderer!=='3d')throw new Error('fldLaunchBattle options wrong: '+JSON.stringify(captured));
      return {button:btn.id,sideChoice:got,launch:captured};
    });
  } catch(e){R.ok=false;R.fatal=String(e&&e.message||e);}
  return JSON.stringify(R);
})()`;

function preparseCooked() {
  new Script(SETUP, { filename: "probe-spotsylvania-SETUP.js" });
  new Script(DOM, { filename: "probe-spotsylvania-DOM.js" });
}

async function main() {
  let server=null,browser=null;
  const url=cfg.baseUrl+"/"+cfg.file;
  const result={ok:false,steps:[],pageerrors:[]};
  try {
    preparseCooked();
    result.steps.push({name:"HARNESS PREPARSE: cooked SETUP and DOM compile before Chrome (S-03 amendment 8)",ok:true,v:{setup:true,dom:true}});
    const base=readFileSync(join(ROOT,"build","base.html"),"utf8");
    const classicRows=Array.from(base.matchAll(/\{id:"spotsylvania", name:"Spotsylvania"/g)).length;
    const classicExact=base.includes('{id:"spotsylvania", name:"Spotsylvania", year:1864, th:"E", atk:"US", us:100000, cs:52000')&&base.includes('wx:"rain"');
    const rail=JSON.parse(readFileSync(join(ROOT,"data","logistics-rail.json"),"utf8"));
    const route=(rail.routes||{}).spotsylvania;
    const routeOk=!!route&&route.label==="Overland railhead and wagon extension"&&route.theater==="E"&&route.provenance==="Inferred"&&route.friction&&route.friction.US===11&&route.friction.CS===14;
    const forbiddenData=readdirSync(join(ROOT,"data")).filter(f=>/crater/i.test(f));   // D397 reshape: data/petersburg-assaults.json is now ratified and leaves this scan; the still-unbuilt Cold Harbor/Crater lanes stay forbidden. D393: data/wilderness.json left the same way. D454: data/cold-harbor.json is RATIFIED since D442 (scenario 26) and leaves this scan the same documented way; crater stays forbidden until its own ratified build.
    const classicOk=classicRows===1&&classicExact&&routeOk&&forbiddenData.length===0;
    result.steps.push({name:"CLASSIC + RAIL COLLISION: the frozen lowercase Classic spotsylvania row and the pre-existing strategic rail route remain exact, separate layers (the shiloh/franklin same-name convention)",ok:!!classicOk,v:{classicRows,classicExact,route,forbiddenData}});
    if(!classicOk)throw new Error("Classic/rail collision contract changed");
    if(!(await up(url))){server=spawn("python3",["-m","http.server",String(cfg.port)],{cwd:ROOT,stdio:"ignore"});for(let i=0;i<80&&!(await up(url));i++)await sleep(250);}
    if(!(await up(url)))throw new Error("server not reachable at "+url);
    try{browser=await chromium.launch({channel:"chrome",headless:true,args:GL});}
    catch{browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:GL});}
    const page=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:1});
    page.on("pageerror",e=>result.pageerrors.push(String(e&&e.message||e)));
    page.on("console",msg=>{if(msg.type()==="error")result.pageerrors.push("console: "+msg.text());});
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForFunction(()=>typeof window.fldLaunchSandbox==="function"&&typeof window.fldScenarioRegistry==="function"&&window.GAME_DATA&&window.GAME_DATA.spotsylvania,null,{timeout:45000});
    const setup=JSON.parse(await page.evaluate(SETUP));
    const dom=JSON.parse(await page.evaluate(DOM));
    result.steps=result.steps.concat(setup.steps||[],dom.steps||[]);
    result.pageerrors=result.pageerrors.concat(setup.errors||[],dom.errors||[]);
    if(setup.fatal)result.pageerrors.push("SETUP fatal: "+setup.fatal);
    if(dom.fatal)result.pageerrors.push("DOM fatal: "+dom.fatal);
    result.ok=!!setup.ok&&!!dom.ok&&result.steps.every(s=>s.ok)&&result.pageerrors.length===0;
    try{
      await page.evaluate(`(() => { fldLaunchSandbox({renderer:'2d',scenario:'spotsylvania',autoBoth:true,playerSide:'US',seed:47});__FIELD.phase='battle';__FIELD.paused=true;fldStepN(1800,0.05);fld2dDraw();fldRenderTop();fldRenderHud(); })()`);
      await page.screenshot({path:join(OUT,"probe-spotsylvania.png"),fullPage:false,timeout:5000});
    }catch(e){result.screenshotWarning=String(e&&e.message||e);}
  } catch(e){result.fatal=String(e&&e.message||e);result.ok=false;}
  finally{
    try{writeFileSync(join(OUT,"probe-spotsylvania.json"),JSON.stringify(result,null,2));}catch{}
    printResult(result);await closeBrowserHard(browser);killChild(server);
  }
  if(!result.ok)process.exit(1);
  console.log("ALL OK");
}

main();
