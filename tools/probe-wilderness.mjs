#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D393 playable Wilderness. This focused guard binds the single-phase CS-attacker / US-defender
// junction scenario, THE THICKET LAW, the current 24/54/1512/24/129 integration surfaces (D397:
// Petersburg initial assaults inserted at rank 69), the battle-date rank wall, and exactly eight
// shared-model historical-direction seeds.
//
// BIND A PREDECLARATION — removing only the T1 Wilderness registry line may red exactly:
//   REGISTRY + MENU
//   REGISTERED LAUNCH + REINFORCEMENTS
//   ARMY REGISTER PIN
//   RUNTIME MENU + SIDE CHOICE
// The D392 plan probe may red exactly FUTURE DIRECTION + INTEGRATION. SAME-SEED REPLAY,
// PASSIVE-SIDE TERMINATION, and historical direction use a direct-data override and must stay green.
//
// BIND B PREDECLARATION — changing only Kershaw's data rank from Brig. to Maj. may red exactly:
//   RANK WALL
// The D392 plan probe may red exactly RANKS + COMMAND TRAPS.
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
  console.log("probe-wilderness ok=" + result.ok + " steps=" + (result.steps || []).length + " pageerrors=" + (result.pageerrors || []).length);
  if (result.fatal) console.log("  FATAL " + result.fatal);
  for (const s of (result.steps || [])) {
    if (s.ok) console.log("  ok   " + s.name.slice(0, 96) + " :: " + JSON.stringify(s.v).slice(0, 320));
    else console.log("  FAIL " + s.name + " :: " + s.err);
  }
}

const SETUP = `(() => {
  var R={ok:true,steps:[],errors:[]};
  function check(name,fn){try{var v=fn();R.steps.push({name:name,ok:true,v:v===undefined?null:v});}catch(e){R.ok=false;R.steps.push({name:name,ok:false,err:String(e&&e.message||e)});}}
  window.addEventListener('error',function(ev){R.errors.push(String(ev.message||ev.error||ev));});
  var DATA=GAME_DATA.wilderness&&GAME_DATA.wilderness.wilderness;
  var SEEDS=${JSON.stringify(SEEDS)};
  function rows(){
    var out=[],sides=['US','CS'];
    for(var si=0;si<sides.length;si++){var side=sides[si],list=((DATA.oob||{})[side])||[];for(var i=0;i<list.length;i++)out.push({side:side,u:list[i]});}
    for(var r=0;r<(DATA.reinforcements||[]).length;r++)out.push({side:String(DATA.reinforcements[r].side||''),u:DATA.reinforcements[r]});
    return out;
  }
  function totals(){
    var out={US:0,CS:0,units:0,opening:((DATA.oob.US||[]).length+(DATA.oob.CS||[]).length),gunsUS:0,gunsCS:0};
    rows().forEach(function(row){out[row.side]+=(row.u.men||0);out.units++;if(row.u.arm==='art')out[row.side==='US'?'gunsUS':'gunsCS']+=(row.u.guns||0);});
    return out;
  }
  function sourceUrls(value){var seen={},out=[];if(!Array.isArray(value))return out;value.forEach(function(u){if(typeof u==='string'&&/^https?:/.test(u)&&!seen[u]){seen[u]=1;out.push(u);}});return out;}
  function keyScan(obj,path,bad){
    if(!obj||typeof obj!=='object')return;
    var forbidden={damage:1,dmg:1,damagemult:1,firepower:1,firepowermult:1,firescale:1,firemult:1,firemultiplier:1,killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossscale:1,lossmult:1,capturescale:1,capturemult:1,surrenderscale:1,surrendermult:1,routscale:1,routmult:1,moralescale:1,moralemult:1,combatscale:1,battledamage:1,battlefire:1,powermult:1,scorebonus:1,scoremult:1,winner:1,winoverride:1,victoryoverride:1,outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,genius:1,geniusmult:1,ammopenalty:1,ammomult:1,supplymult:1,supplypenalty:1,exhaustionmult:1,fatiguemult:1,starvationmult:1,marchpenalty:1,surprisebonus:1,surprisemult:1,envelopmentbonus:1,envelopmentmult:1,panicmult:1,collapsemult:1,meleemult:1,handtohandbonus:1,prisonermult:1,capturebonus:1,woodsmult:1,blindnessmult:1,visibilitypenalty:1,smokemult:1,brushfiremult:1,firedamage:1,flankbonus:1,flankmult:1,rollupmult:1,friendlyfireevent:1,confusionmult:1};
    for(var k in obj)if(Object.prototype.hasOwnProperty.call(obj,k)){var p=path?path+'.'+k:k;if(forbidden[String(k).toLowerCase()])bad.push(p);keyScan(obj[k],p,bad);}
  }
  function withDirectWilderness(fn){
    var oldScenarioData=fldScenarioData;
    try{fldScenarioData=function(id){return id==='wilderness'?DATA:oldScenarioData(id);};return fn();}
    finally{fldScenarioData=oldScenarioData;}
  }
  function runBattle(seed,autoBoth,playerSide){
    return withDirectWilderness(function(){
      G.campaign=null;G.settings=G.settings||{};delete G.settings.tacticalFog;try{delete G.settings.tacticalPreset;}catch(e){}
      __FIELD._officersOff=false;__FIELD._logisticsOff=false;__FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none',scenario:'wilderness',autoBoth:autoBoth!==false,playerSide:playerSide||'US',seed:seed});
      __FIELD.phase='battle';__FIELD.paused=false;
      var n=0;while(__FIELD.phase==='battle'&&n<24000){fldSimStep(0.05);n++;}
      var fielded={US:0,CS:0},survivors={US:0,CS:0};
      for(var i=0;i<__FIELD.units.length;i++){
        var u=__FIELD.units[i];if(u.side!=='US'&&u.side!=='CS')continue;
        fielded[u.side]+=Math.max(0,u.maxMen||0);if(u.alive)survivors[u.side]+=Math.max(0,u.men||0);
      }
      return {winner:__FIELD.winner,by:__FIELD.winBy,phase:__FIELD.phase,steps:n,fielded:fielded,survivors:survivors,losses:{US:Math.round(fielded.US-survivors.US),CS:Math.round(fielded.CS-survivors.CS)}};
    });
  }
  function campaign(){return {side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[],nextId:1,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};}
  try{
    if(!DATA)throw new Error('GAME_DATA.wilderness.wilderness missing');

    check('DATA + OOB: single-phase CS attacker, US defender, fog off, exact 23,580/21,240 totals, 18 unique Inferred-strength units, bounded guns',function(){
      var t=totals(),ids={},unitRows=rows();
      if(DATA.id!=='wilderness'||DATA.attacker!=='CS'||DATA.defender!=='US'||DATA.defaultFog!==false||Object.prototype.hasOwnProperty.call(DATA,'phases'))throw new Error('root shape wrong');
      if(t.US!==23580||t.CS!==21240||t.units!==18||t.opening!==6)throw new Error('totals/shape wrong: '+JSON.stringify(t));
      if(!(t.US>=15000&&t.US<=30000&&t.CS>=12000&&t.CS<=26000))throw new Error('committed totals outside D392 envelopes: '+JSON.stringify(t));
      unitRows.forEach(function(row){var k=row.side+':'+row.u.id;if(ids[k])throw new Error('duplicate '+k);ids[k]=1;if(String(row.u.note||'').indexOf('Inferred strength')<0)throw new Error('missing disclosure '+k);if(row.u.arm==='art'&&(!(row.u.guns>0)||row.u.men/row.u.guns>40))throw new Error('artillery envelope wrong '+k);});
      if(Object.keys(ids).length!==18||t.gunsUS!==6||t.gunsCS!==8)throw new Error('unit/gun count wrong: '+JSON.stringify(t));
      if(!DATA.weather||DATA.weather.sky!=='clear'||DATA.weather.time!=='midday'||DATA.weather.provenance!=='Inferred')throw new Error('weather disclosure wrong');
      if(!/May 5-7, 1864/.test(DATA.date))throw new Error('date wrong: '+DATA.date);
      return t;
    });

    check('THE THICKET LAW + OBJECTIVE: dense symmetric woods, low deployed guns, Brock Road works, and the junction road south are encoded without fog or fire mechanics',function(){
      var text=JSON.stringify(DATA),terrain=DATA.terrain||{},woods=terrain.woods||[],walls=terrain.walls||[],markers=terrain.markers||[];
      ['Brock Road','Orange Plank Road','Widow Tapp','Unfinished Railroad','Chewning','Wilderness Tavern','Saunders Field'].forEach(function(s){if(text.toLowerCase().indexOf(s.toLowerCase())<0)throw new Error('missing landmark '+s);});
      if(woods.length!==12||walls.length!==4||markers.length<8)throw new Error('terrain shape wrong: '+woods.length+'/'+walls.length+'/'+markers.length);
      if(!DATA.objective||DATA.objective.name!=='Brock Road / Orange Plank Road Junction')throw new Error('junction objective wrong');
      if(DATA.defaultFog!==false)throw new Error('weather fog became a mechanic');
      if(!markers.some(function(m){return /Saunders Field/.test(String(m.name||''))&&/teaching/i.test(String(m.name||'')+' '+String(m.note||''));}))throw new Error('Saunders Field is not teaching-only');
      return {objective:DATA.objective.name,woods:woods.length,walls:walls.length,guns:totals().gunsUS+'/'+totals().gunsCS,fog:DATA.defaultFog};
    });

    check('REGISTRY + MENU: Wilderness holds rank 67 between Fort Pillow and Spotsylvania in the 28-scenario registry',function(){
      var reg=fldScenarioRegistry(),order=fldScenarioMenuOrder(reg);
      if(Object.keys(reg).length!==28||reg.wilderness!==DATA)throw new Error('registry identity/count wrong');   // D397: 23 -> 24 — Petersburg initial assaults registers at rank 69. D393: 22 -> 23 — the Wilderness registered as the twenty-third scenario. D442: 24 -> 26 — Atlanta (D436, whose sweep missed this count pin — recorded honestly) and Cold Harbor (rank 68.5) both register. D463: 26 -> 27 — Fort Pillow registers at rank 66 between Chattanooga and the Wilderness (LANE-013 P4, the D455 SS3 row 6 unlock). D469: 27 -> 28 — The Crater registers at rank 71.5 between Atlanta and Cedar Creek (LANE-015, the D464 spec).
      if(fldScenarioMenuRank('wilderness')!==67)throw new Error('menu rank wrong: '+fldScenarioMenuRank('wilderness'));
      if(order.indexOf('fortPillow')!==order.indexOf('chattanooga')+1||order.indexOf('wilderness')!==order.indexOf('fortPillow')+1||order.indexOf('spotsylvania')!==order.indexOf('wilderness')+1||order.indexOf('coldHarbor')!==order.indexOf('spotsylvania')+1||order.indexOf('petersburgAssaults')!==order.indexOf('coldHarbor')+1||order.indexOf('kennesaw')!==order.indexOf('petersburgAssaults')+1)throw new Error('menu chronology wrong: '+order.join(' -> '));   // D463 reshape: Fort Pillow (rank 66) inserts between Chattanooga and the Wilderness; the seven-battle chronology stays guarded. D442 reshape: Cold Harbor (the documented 68.5) inserts between Spotsylvania and the Petersburg initial assaults; the six-battle chronology stays guarded. D397 reshape: Petersburg initial assaults (rank 69) between Spotsylvania and Kennesaw. D393 guarded the prior four-battle chronology.
      return {count:Object.keys(reg).length,rank:67,after:'chattanooga',before:'spotsylvania'};
    });

    check('RANK WALL: battle-date grades are exact; Kershaw and Gibbon remain brigadiers; Hill is present; absent-axis and later-command officers hold no field seat',function(){
      var text=JSON.stringify(DATA);
      ['Lt. Gen. Ulysses S. Grant','Maj. Gen. George G. Meade','Maj. Gen. Winfield S. Hancock','Brig. Gen. George W. Getty','Maj. Gen. David B. Birney','Brig. Gen. Francis C. Barlow','Brig. Gen. John Gibbon','Brig. Gen. James S. Wadsworth','Brig. Gen. Alexander Hays','Col. Samuel S. Carroll','Gen. Robert E. Lee','Lt. Gen. Ambrose Powell Hill','Lt. Gen. James Longstreet','Brig. Gen. Joseph B. Kershaw','Maj. Gen. Charles W. Field','Brig. Gen. Micah Jenkins','Brig. Gen. William Mahone'].forEach(function(s){if(text.indexOf(s)<0)throw new Error('missing required rank rendering: '+s);});
      [/Maj\\. Gen\\. (?:Joseph B?\\.? )?Kershaw/,/Major General (?:Joseph B?\\.? )?Kershaw/,/Maj\\. Gen\\. (?:John )?Gibbon/,/Major General (?:John )?Gibbon/,/Maj\\. Gen\\. (?:John B?\\.? )?Gordon/,/Major General (?:John B?\\.? )?Gordon/,/Maj\\. Gen\\. (?:Horatio G?\\.? )?Wright/,/Lt\\. Gen\\. (?:Richard H?\\.? )?Anderson/,/General Grant\\b(?! [a-z])/].forEach(function(re){if(re.test(text))throw new Error('forbidden rank rendering: '+re);});
      var cast='';rows().forEach(function(row){cast+=' '+String(row.u.commander||'')+' '+String(row.u.name||'');});(((DATA.leaders||{}).US)||[]).concat(((DATA.leaders||{}).CS)||[]).forEach(function(l){cast+=' '+String(l.name||'');});
      [/Ewell/i,/Warren/i,/Sedgwick/i,/Gordon/i,/Saunders/i,/Early/i].forEach(function(re){if(re.test(cast))throw new Error('absent-axis/later-command officer holds a field seat: '+re);});
      ['Sedgwick is alive through this battle','dies May 9','wounded by his own troops','Jenkins killed','mortally wounded May 6','killed May 5'].forEach(function(s){if(text.toLowerCase().indexOf(s.toLowerCase())<0)throw new Error('fate/command disclosure missing: '+s);});
      return {kershaw:'Brig. Gen.',gibbon:'Brig. Gen.',hill:'Lt. Gen., present',turnpikeCast:0};
    });

    check('D74 NO-FUDGE + AXIS SCOPE: deep data scan finds no battle-specific output, thicket, fog, fire, flank, friendly-fire, confusion, casualty, morale, or winner key',function(){
      var bad=[];keyScan(DATA,'wilderness',bad);if(bad.length)throw new Error(bad.join(', '));
      var branches=['wildernessPenalty','wildernessBonus','woodsMult','blindnessMult','visibilityPenalty','smokeMult','brushFireMult','fireDamage','flankBonus','flankMult','rollUpMult','friendlyFireEvent','confusionMult'];branches.forEach(function(n){if(typeof window[n]==='function')throw new Error('battle-specific function '+n);});
      return {badKeys:0,battleSpecificFunctions:0};
    });

    check('REGISTERED LAUNCH + REINFORCEMENTS: canonical data launches single-phase, the 18-unit cast completes exactly once, and no Classic state appears',function(){
      delete G.battle;G.mode='menu';G.campaign=null;G.settings=G.settings||{};delete G.settings.tacticalFog;
      __FIELD._officersOff=false;__FIELD._logisticsOff=false;__FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none',scenario:'wilderness',autoBoth:true,playerSide:'US',seed:22});
      if(__FIELD.scenData!==DATA||__FIELD.units.length!==6||(__FIELD.reinforce||[]).length!==12)throw new Error('registered launch wrong: '+__FIELD.units.length+'/'+(__FIELD.reinforce||[]).length);
      if(__FIELD.phases!==null||__FIELD.attacker!=='CS'||__FIELD.fog!==false)throw new Error('single-phase role/fog launch wrong');
      if(!__FIELD.objective||__FIELD.objective.name!=='Brock Road / Orange Plank Road Junction')throw new Error('launch objective wrong');
      var maxAt=0;(__FIELD.reinforce||[]).forEach(function(r){maxAt=Math.max(maxAt,+r.atSec||0);});__FIELD.t=maxAt;fldScenarioTick(0.05);var once=__FIELD.units.length;fldScenarioTick(0.05);
      var ids={};__FIELD.units.forEach(function(u){var k=u.side+':'+u.id;if(ids[k])throw new Error('duplicate launched id '+k);ids[k]=1;});
      if(once!==18||__FIELD.units.length!==18||!__FIELD.reinforce.every(function(r){return r.done;})||Object.keys(ids).length!==18)throw new Error('reinforcement completion not idempotent: '+once+'/'+__FIELD.units.length);
      if(G.battle&&G.battle.M)throw new Error('Classic battle state created');
      return {opening:6,fielded:18,reinforcements:12,unique:Object.keys(ids).length};
    });

    check('SAME-SEED REPLAY: direct Wilderness runs reproduce winner, finish, steps, and fielded-minus-survivor losses',function(){
      var a=runBattle(97,true,'US'),b=runBattle(97,true,'US');
      if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('same-seed drift: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      if(a.phase!=='over'||a.steps>=24000)throw new Error('run did not terminate');return a;
    });

    check('PASSIVE-SIDE TERMINATION: Union-passive and Confederate-passive direct launches both finish with finite shared-engine outcomes',function(){
      var usPassive=runBattle(131,false,'US'),csPassive=runBattle(137,false,'CS');
      if(usPassive.phase!=='over'||csPassive.phase!=='over'||usPassive.steps>=24000||csPassive.steps>=24000)throw new Error('passive launch did not terminate');
      if(!/^(US|CS|draw)$/.test(String(usPassive.winner||''))||!/^(US|CS|draw)$/.test(String(csPassive.winner||'')))throw new Error('passive launch winner invalid');
      return {usPassive:{winner:usPassive.winner,steps:usPassive.steps},csPassive:{winner:csPassive.winner,steps:csPassive.steps}};
    });

    check('historical direction: exactly eight seeds - the US holds the junction >= 5/8 and CASUALTY-DIRECTION US>CS >= 5/8',function(){
      if(SEEDS.length!==8)throw new Error('exactly eight seeds required');var uniq={};SEEDS.forEach(function(s){uniq[s]=1;});if(Object.keys(uniq).length!==8)throw new Error('seeds must be unique');
      var usHolds=0,usBleedsMore=0,samples=[];
      for(var i=0;i<SEEDS.length;i++){
        var r=runBattle(SEEDS[i],true,'US');if(r.phase!=='over')throw new Error('seed '+SEEDS[i]+' did not finish');
        if(r.winner==='US')usHolds++;if(r.losses.US>r.losses.CS)usBleedsMore++;
        samples.push({seed:SEEDS[i],winner:r.winner,by:r.by,lossUS:r.losses.US,lossCS:r.losses.CS});
      }
      if(!(usHolds>=5))throw new Error('US junction holds below 5/8: '+usHolds+' :: '+JSON.stringify(samples));
      if(!(usBleedsMore>=5))throw new Error('CASUALTY-DIRECTION US>CS below 5/8: '+usBleedsMore+' :: '+JSON.stringify(samples));
      return {seeds:SEEDS,junctionHolds:usHolds+'/8',casualtyDirectionUSgtCS:usBleedsMore+'/8',samples:samples};
    });

    check('TEACHING + CODEX: ten restrained two-source cards with exact provenance, fire dignity, junction, Texans, friendly fire, road-south, ledger, USCT, and Eastern axes',function(){
      var cards=((DATA.teaching||{}).cards)||[],codex=(DATA.teaching||{}).codex||{},ids=[];
      if(cards.length!==10)throw new Error('wanted ten cards, got '+cards.length);
      cards.forEach(function(c){ids.push(c.id);if(!/^(Verified|Inferred|Disputed)$/.test(String(c.provenance||''))||sourceUrls(c.sources).length<2)throw new Error('bad card '+c.id);});
      ['wild_thickets','wild_fires','wild_junction','wild_dawn_texans','wild_flank_fire','wild_south','wild_ledger','wild_bones','wild_usct','wild_not_here'].forEach(function(id){if(ids.indexOf(id)<0)throw new Error('missing '+id);});
      var cardText=JSON.stringify(cards);['about 200','never a mechanic','junction','Texas Brigade','friendly fire','cheering','Butcher','Chancellorsville','USCT','No massacre content'].forEach(function(s){if(cardText.toLowerCase().indexOf(s.toLowerCase())<0)throw new Error('teaching thread missing: '+s);});
      if(!/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance||''))||sourceUrls(codex.sources).length<2)throw new Error('codex provenance/sources wrong');
      if(!codex.axes||codex.axes.theater!=='Eastern'||codex.axes.campaign!=='Overland Campaign'||codex.axes.result!=='Inconclusive')throw new Error('codex axes wrong');
      return {cards:ids.length,codex:codex.id,axes:codex.axes};
    });

    check('ARMY REGISTER PIN: canonical registry identity plus 18 Wilderness unit trios produce current total 1671',function(){
      var registry=fldScenarioRegistry();if(registry.wilderness!==DATA)throw new Error('declared registry dependency missing');
      var C=campaign();if(typeof _t1InitAll==='function')_t1InitAll(C);var reg=ssPersonRegistry(C),found=[],groups={};
      if(reg.people.length!==1671)throw new Error('Army Register total '+reg.people.length+' expected 1671');   // D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D393: 1380 -> 1434 — Wilderness adds 18 unique side-unit ids x 3 slots. D397: 1434 -> 1512 — Petersburg initial assaults adds 26 unique side-unit ids x 3 slots. D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots. D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots. D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7): Watie's 2nd CMR adds 1 unique side-unit id x 3 slots. D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (LANE-013 P4, the D455 SS3 row 6 unlock). D469: 1632 -> 1671 — The Crater adds 13 unique side-unit ids x 3 slots (LANE-015, the D464 spec).
      for(var i=0;i<reg.people.length;i++){var p=reg.people[i],origin=p.replaces||p.pid;if(typeof origin==='string'&&origin.indexOf('ss:wilderness:')===0)found.push({p:p,origin:origin});}
      if(found.length!==54)throw new Error('Wilderness rows '+found.length+' expected 54');
      found.forEach(function(row){var m=row.origin.match(/^ss:wilderness:(US|CS):([^:]+):(cmd|nco|pvt)$/);if(!m)throw new Error('bad slot '+row.origin);var key=m[1]+':'+m[2];groups[key]=groups[key]||{};groups[key][m[3]]=1;if(row.p.source!=='scenario-oob'||row.p.generated!==true||row.p.provenance!=='Inferred')throw new Error('slot metadata '+row.origin);});
      var keys=Object.keys(groups);if(keys.length!==18)throw new Error('unit groups '+keys.length+' expected 18');keys.forEach(function(k){if(!groups[k].cmd||!groups[k].nco||!groups[k].pvt)throw new Error('incomplete trio '+k);});
      return {total:reg.people.length,wildernessRows:found.length,units:keys.length,slots:['cmd','nco','pvt']};
    });

    check('SCOPE: single-phase Plank Road axis only; no unbuilt Cold Harbor/Crater registration and no Wilderness-only combat function appears',function(){
      var ids=Object.keys(fldScenarioRegistry());if(ids.some(function(id){return /overlandCampaign/i.test(id);}))throw new Error('forbidden tactical Overland id');   // D397 reshape: petersburgAssaults now has a ratified registration and leaves this scope tooth; the still-unbuilt Cold Harbor/Crater lanes stay forbidden. D469: data/crater.json is RATIFIED (scenario 28, schema 61st file) and this scan now REQUIRES exactly that one file (the cedar-creek presence-flip idiom). D393 dropped wilderness the same way. D454: coldHarbor (cold-harbor) is RATIFIED + registered as scenario 26 since D442 and leaves this tooth the same documented way — the D442 VETTING-DEFERRED slice never ran this probe; crater + overlandCampaign stay forbidden until their own ratified builds. D469: crater is RATIFIED + registered as scenario 28 (rank 71.5) and leaves this tooth the same documented way; overlandCampaign stays forbidden until its own ratified build.
      if(DATA.phases)throw new Error('Wilderness became phased');
      var functions=['wildernessPenalty','wildernessBonus','woodsMult','blindnessMult','smokeMult','brushFireMult','flankMult','friendlyFireEvent'];functions.forEach(function(n){if(typeof window[n]==='function')throw new Error('battle-specific function '+n);});
      return {singlePhase:true,forbiddenIds:0,battleSpecificFunctions:0};
    });
  }catch(e){R.ok=false;R.fatal=String(e&&e.message||e);}
  return JSON.stringify(R);
})()`;

const DOM = `(() => {
  var R={ok:true,steps:[],errors:[]};
  function check(name,fn){try{var v=fn();R.steps.push({name:name,ok:true,v:v===undefined?null:v});}catch(e){R.ok=false;R.steps.push({name:name,ok:false,err:String(e&&e.message||e)});}}
  try{
    G.settings=G.settings||{};G.mode='menu';
    check('RUNTIME MENU + SIDE CHOICE: Wilderness button is unique between Chattanooga and Spotsylvania, and fldLaunchBattle preserves the chosen Confederate side',function(){
      if(typeof openMainMenu==='function')openMainMenu();fldInjectMenuButton();
      var btn=document.getElementById('fldScnBtn_wilderness');if(!btn||!btn.getAttribute('aria-label'))throw new Error('accessible Wilderness button missing');
      fldInjectMenuButton();if(document.querySelectorAll('#fldScnBtn_wilderness').length!==1)throw new Error('duplicate Wilderness button');
      var ids=Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){return b.id;});
      if(ids.indexOf('fldScnBtn_fortPillow')!==ids.indexOf('fldScnBtn_chattanooga')+1||ids.indexOf('fldScnBtn_wilderness')!==ids.indexOf('fldScnBtn_fortPillow')+1||ids.indexOf('fldScnBtn_spotsylvania')!==ids.indexOf('fldScnBtn_wilderness')+1||ids.indexOf('fldScnBtn_coldHarbor')!==ids.indexOf('fldScnBtn_spotsylvania')+1||ids.indexOf('fldScnBtn_petersburgAssaults')!==ids.indexOf('fldScnBtn_coldHarbor')+1||ids.indexOf('fldScnBtn_kennesaw')!==ids.indexOf('fldScnBtn_petersburgAssaults')+1)throw new Error('button chronology wrong: '+ids.join(' -> '));   // D463 reshape DOM variant: the fortPillow button inserts between chattanooga and wilderness; the chain now guards SEVEN buttons. D397 reshape DOM variant: the petersburgAssaults button inserts between spotsylvania and kennesaw; the five-button chronology stays guarded. D393 guarded the prior four-button chronology. D454 re-pin: D442 registered coldHarbor at rank 68.5 BETWEEN spotsylvania and petersburgAssaults (the documented non-integer exception; probe-tactical-roster pins the same order) — the VETTING-DEFERRED slice never ran this adjacency tooth; the chain now guards SIX buttons.
      var got=null;fldScenarioSideChoice('wilderness',function(side){got=side;});var cards=document.querySelectorAll('[data-brside]');
      if(cards.length!==2)throw new Error('wanted two side cards, got '+cards.length);cards[0].click();if(got!=='CS')throw new Error('CS side card returned '+got);
      var captured=null,oldLaunch=window.fldLaunchSandbox,oldBrief=window.fldBullRunBriefing;
      try{window.fldLaunchSandbox=function(opts){captured=opts;};window.fldBullRunBriefing=function(){};fldLaunchBattle('wilderness','CS');}
      finally{window.fldLaunchSandbox=oldLaunch;window.fldBullRunBriefing=oldBrief;}
      if(!captured||captured.scenario!=='wilderness'||captured.playerSide!=='CS'||captured.renderer!=='3d')throw new Error('fldLaunchBattle options wrong: '+JSON.stringify(captured));
      return {button:btn.id,sideChoice:got,launch:captured};
    });
  }catch(e){R.ok=false;R.fatal=String(e&&e.message||e);}
  return JSON.stringify(R);
})()`;

function preparseCooked() {
  new Script(SETUP, { filename: "probe-wilderness-SETUP.js" });
  new Script(DOM, { filename: "probe-wilderness-DOM.js" });
}

async function main() {
  let server=null,browser=null;
  const url=cfg.baseUrl+"/"+cfg.file;
  const result={ok:false,steps:[],pageerrors:[]};
  try {
    preparseCooked();
    result.steps.push({name:"HARNESS PREPARSE: cooked SETUP and DOM compile before Chrome",ok:true,v:{setup:true,dom:true}});
    const base=readFileSync(join(ROOT,"build","base.html"),"utf8");
    const classicRows=Array.from(base.matchAll(/\{id:"wilderness", name:"The Wilderness"/g)).length;
    const classicExact=base.includes('{id:"wilderness", name:"The Wilderness", year:1864, th:"E", atk:"US", us:102000, cs:61000')&&base.includes('cmdUS:"Grant", cmdCS:"Lee"');
    const rail=JSON.parse(readFileSync(join(ROOT,"data","logistics-rail.json"),"utf8"));
    const route=(rail.routes||{}).wilderness;
    const routeOk=!!route&&/Orange and Alexandria corridor/.test(String(route.label||''))&&route.theater==="E"&&route.provenance==="Inferred"&&route.friction&&route.friction.US===10&&route.friction.CS===14;
    const craterData=readdirSync(join(ROOT,"data")).filter(f=>/crater/i.test(f));   // D397 reshape: data/petersburg-assaults.json is now ratified and leaves this scan; the still-unbuilt Cold Harbor/Crater lanes stay forbidden. D393: data/wilderness.json left the same way. D454: data/cold-harbor.json is RATIFIED since D442 (scenario 26, schema 57th file) and leaves this scan the same documented way; crater stays forbidden until its own ratified build.
    const classicOk=classicRows===1&&classicExact&&routeOk&&craterData.join(",")==="crater.json";
    result.steps.push({name:"CLASSIC + RAIL COLLISION: the frozen lowercase Classic wilderness row and pre-existing strategic rail route remain exact, separate layers",ok:!!classicOk,v:{classicRows,classicExact,route,craterData}});
    if(!classicOk)throw new Error("Classic/rail collision contract changed");
    if(!(await up(url))){server=spawn("python3",["-m","http.server",String(cfg.port)],{cwd:ROOT,stdio:"ignore"});for(let i=0;i<80&&!(await up(url));i++)await sleep(250);}
    if(!(await up(url)))throw new Error("server not reachable at "+url);
    try{browser=await chromium.launch({channel:"chrome",headless:true,args:GL});}
    catch{browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:GL});}
    const page=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:1});
    page.on("pageerror",e=>result.pageerrors.push(String(e&&e.message||e)));
    page.on("console",msg=>{if(msg.type()==="error")result.pageerrors.push("console: "+msg.text());});
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForFunction(()=>typeof window.fldLaunchSandbox==="function"&&typeof window.fldScenarioRegistry==="function"&&window.GAME_DATA&&window.GAME_DATA.wilderness,null,{timeout:45000});
    const setup=JSON.parse(await page.evaluate(SETUP));
    const dom=JSON.parse(await page.evaluate(DOM));
    result.steps=result.steps.concat(setup.steps||[],dom.steps||[]);
    result.pageerrors=result.pageerrors.concat(setup.errors||[],dom.errors||[]);
    if(setup.fatal)result.pageerrors.push("SETUP fatal: "+setup.fatal);
    if(dom.fatal)result.pageerrors.push("DOM fatal: "+dom.fatal);
    result.ok=!!setup.ok&&!!dom.ok&&result.steps.every(s=>s.ok)&&result.pageerrors.length===0;
    try{
      await page.evaluate(`(() => { fldLaunchSandbox({renderer:'2d',scenario:'wilderness',autoBoth:true,playerSide:'US',seed:47});__FIELD.phase='battle';__FIELD.paused=true;fldStepN(1800,0.05);fld2dDraw();fldRenderTop();fldRenderHud(); })()`);
      await page.screenshot({path:join(OUT,"probe-wilderness.png"),fullPage:false,timeout:5000});
    }catch(e){result.screenshotWarning=String(e&&e.message||e);}
    result.ok=result.ok&&result.steps.every(s=>s.ok)&&result.pageerrors.length===0;
  } catch(e){result.fatal=String(e&&e.stack||e&&e.message||e);result.ok=false;}
  finally{
    try{writeFileSync(join(OUT,"probe-wilderness.json"),JSON.stringify(result,null,2));}catch{}
    printResult(result);await closeBrowserHard(browser);killChild(server);
  }
  if(!result.ok)process.exit(1);
  console.log("ALL OK");
}

main();
