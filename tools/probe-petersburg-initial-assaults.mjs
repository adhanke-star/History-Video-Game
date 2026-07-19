#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D397 playable Petersburg: The Initial Assaults. This focused guard binds the single-phase
// US-attacker / CS-defender defender-reinforcement race, THE REINFORCEMENT-RACE LAW (the opening
// CS on-map garrison strictly 2,200-5,400; every accession a timed arrival), the current
// 24/54/1512/24/129 integration surfaces, the D396 section-6 rank wall, and exactly eight
// shared-model historical-direction seeds under THE CITY GUARD and THE AGGREGATE
// CASUALTY-DIRECTION TOOTH (direction only, never magnitude - the spec section-7 law).
// FORBIDDEN teeth by contract: any casualty magnitude/ratio/per-side count, any prisoner/
// capture/gun-loss/battery-count tooth, any timing tooth on the June 15 breach, the night
// pause, the June 17-18 retirement, or the June 18 assaults, and any per-day casualty tooth.
//
// BIND A PREDECLARATION - removing only the T1 Petersburg registry line may red exactly:
//   REGISTRY + MENU
//   REGISTERED LAUNCH + REINFORCEMENTS
//   ARMY REGISTER PIN
//   RUNTIME MENU + SIDE CHOICE
// The D396 plan probe may red exactly FUTURE DIRECTION + INTEGRATION. SAME-SEED REPLAY,
// PASSIVE-SIDE TERMINATION, and historical direction use a direct-data override and must stay green.
//
// BIND B PREDECLARATION - changing only Beauregard's data rank from Gen. to Lt. Gen. may red exactly:
//   RANK WALL
// The D396 plan probe may red exactly RANKS + COMMAND TRAPS.
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
  console.log("probe-petersburg-initial-assaults ok=" + result.ok + " steps=" + (result.steps || []).length + " pageerrors=" + (result.pageerrors || []).length);
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
  var DATA=GAME_DATA['petersburg-assaults']&&GAME_DATA['petersburg-assaults'].petersburgAssaults;
  var SEEDS=${JSON.stringify(SEEDS)};
  function rows(){
    var out=[],sides=['US','CS'];
    for(var si=0;si<sides.length;si++){var side=sides[si],list=((DATA.oob||{})[side])||[];for(var i=0;i<list.length;i++)out.push({side:side,u:list[i],from:'oob'});}
    for(var r=0;r<(DATA.reinforcements||[]).length;r++)out.push({side:String(DATA.reinforcements[r].side||''),u:DATA.reinforcements[r],from:'reinforcements'});
    return out;
  }
  function totals(){
    var out={US:0,CS:0,units:0,openingUS:0,openingCS:0,openingUnits:((DATA.oob.US||[]).length+(DATA.oob.CS||[]).length),gunsUS:0,gunsCS:0};
    rows().forEach(function(row){out[row.side]+=(row.u.men||0);out.units++;if(row.from==='oob')out[row.side==='US'?'openingUS':'openingCS']+=(row.u.men||0);if(row.u.arm==='art')out[row.side==='US'?'gunsUS':'gunsCS']+=(row.u.guns||0);});
    return out;
  }
  function sourceUrls(value){var seen={},out=[];if(!Array.isArray(value))return out;value.forEach(function(u){if(typeof u==='string'&&/^https?:/.test(u)&&!seen[u]){seen[u]=1;out.push(u);}});return out;}
  function keyScan(obj,path,bad){
    if(!obj||typeof obj!=='object')return;
    var forbidden={damage:1,dmg:1,damagemult:1,firepower:1,firepowermult:1,firescale:1,firemult:1,firemultiplier:1,killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossscale:1,lossmult:1,capturescale:1,capturemult:1,surrenderscale:1,surrendermult:1,routscale:1,routmult:1,moralescale:1,moralemult:1,combatscale:1,battledamage:1,battlefire:1,powermult:1,scorebonus:1,scoremult:1,winner:1,winoverride:1,victoryoverride:1,outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,genius:1,geniusmult:1,ammopenalty:1,ammomult:1,supplymult:1,supplypenalty:1,exhaustionmult:1,fatiguemult:1,starvationmult:1,marchpenalty:1,surprisebonus:1,surprisemult:1,envelopmentbonus:1,envelopmentmult:1,panicmult:1,collapsemult:1,meleemult:1,handtohandbonus:1,prisonermult:1,capturebonus:1,hesitationmult:1,cautionmult:1,commandparalysis:1,delaypenalty:1,opportunitybonus:1,racebonus:1,nightmult:1,darknesspenalty:1,garrisonbonus:1,worksemptybonus:1,assaultrefusal:1,refusalmult:1,usctbonus:1,usctpenalty:1,valorbonus:1,greentroopmult:1};
    for(var k in obj)if(Object.prototype.hasOwnProperty.call(obj,k)){var p=path?path+'.'+k:k;if(forbidden[String(k).toLowerCase()])bad.push(p);keyScan(obj[k],p,bad);}
  }
  function withDirectPetersburg(fn){
    var oldScenarioData=fldScenarioData;
    try{fldScenarioData=function(id){return id==='petersburgAssaults'?DATA:oldScenarioData(id);};return fn();}
    finally{fldScenarioData=oldScenarioData;}
  }
  function runBattle(seed,autoBoth,playerSide){
    return withDirectPetersburg(function(){
      G.campaign=null;G.settings=G.settings||{};delete G.settings.tacticalFog;try{delete G.settings.tacticalPreset;}catch(e){}
      __FIELD._officersOff=false;__FIELD._logisticsOff=false;__FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none',scenario:'petersburgAssaults',autoBoth:autoBoth!==false,playerSide:playerSide||'US',seed:seed});
      __FIELD.phase='battle';__FIELD.paused=false;
      var n=0;while(__FIELD.phase==='battle'&&n<26000){fldSimStep(0.05);n++;}
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
    if(!DATA)throw new Error('GAME_DATA["petersburg-assaults"].petersburgAssaults missing');

    check('DATA + OOB: single-phase US attacker, CS defender, fog off, exact 55,540/27,460 committed totals, 26 unique Inferred-strength units, THE REINFORCEMENT-RACE LAW opening sub-envelopes',function(){
      var t=totals(),ids={},unitRows=rows();
      if(DATA.id!=='petersburgAssaults'||DATA.name!=='Petersburg: The Initial Assaults'||DATA.attacker!=='US'||DATA.defender!=='CS'||DATA.defaultFog!==false||Object.prototype.hasOwnProperty.call(DATA,'phases'))throw new Error('root shape wrong');
      if(!/June 15-18, 1864/.test(DATA.date))throw new Error('date wrong: '+DATA.date);
      if(t.US!==55540||t.CS!==27460||t.units!==26||t.openingUnits!==9)throw new Error('totals/shape wrong: '+JSON.stringify(t));
      if(!(t.US>=25000&&t.US<=62000&&t.CS>=14000&&t.CS<=30000))throw new Error('committed totals outside D396 envelopes: '+JSON.stringify(t));
      if(!(t.openingCS>=2200&&t.openingCS<=5400))throw new Error('THE REINFORCEMENT-RACE LAW broken: opening CS on-map garrison '+t.openingCS+' outside strict 2,200-5,400');
      if(!(t.openingUS>=10000&&t.openingUS<=18000))throw new Error('opening US wave '+t.openingUS+' outside 10,000-18,000');
      unitRows.forEach(function(row){var k=row.side+':'+row.u.id;if(ids[k])throw new Error('duplicate '+k);ids[k]=1;if(String(row.u.note||'').indexOf('Inferred strength')<0)throw new Error('missing disclosure '+k);if(row.u.arm==='art'&&(!(row.u.guns>0)||row.u.men/row.u.guns>40))throw new Error('artillery envelope wrong '+k);});
      if(Object.keys(ids).length!==26||t.gunsUS!==28||t.gunsCS!==38)throw new Error('unit/gun count wrong: '+JSON.stringify(t));   // D397 A/B iteration 3: cs_reformed_guns 18 -> 24 guns (spec section-7 enumerated coarse gun weight, crew 540 held <= 40/gun); CS guns 32 -> 38
      (DATA.reinforcements||[]).forEach(function(r){if(!(r.atSec>0))throw new Error('accession is not a timed arrival: '+r.id);});
      var csArrivals=(DATA.reinforcements||[]).filter(function(r){return r.side==='CS';});
      if(csArrivals.length<4)throw new Error('the race needs the timed CS accessions, got '+csArrivals.length);
      if(!DATA.weather||DATA.weather.sky!=='clear'||DATA.weather.time!=='afternoon'||DATA.weather.provenance!=='Inferred')throw new Error('weather disclosure wrong');
      return t;
    });

    check('TERRAIN + OBJECTIVE: the Dimmock Line, Harrison Creek line, and final line stand between the approach and the city ground; the objective anchors BEHIND the outer works',function(){
      var text=JSON.stringify(DATA),terrain=DATA.terrain||{},woods=terrain.woods||[],walls=terrain.walls||[],markers=terrain.markers||[];
      ['Dimmock','Battery 5','Battery 9',"Baylor's Farm",'Jordan Point Road','Harrison Creek','Prince George Court House Road','Appomattox River','City Point Railroad','ravine'].forEach(function(s){if(text.toLowerCase().indexOf(s.toLowerCase())<0)throw new Error('missing landmark '+s);});
      if(woods.length!==6||walls.length!==9||markers.length<10)throw new Error('terrain shape wrong: '+woods.length+'/'+walls.length+'/'+markers.length);
      if(!DATA.objective||DATA.objective.name!=='Petersburg - Eastern City Approach')throw new Error('objective wrong: '+(DATA.objective&&DATA.objective.name));
      if(!(DATA.objective.z<=200))throw new Error('objective must anchor on the inner city ground, z='+DATA.objective.z);
      var dimmockZ=0;walls.forEach(function(w){if(/DIMMOCK/.test(String(w.note||'')))dimmockZ=Math.max(dimmockZ,w.z1,w.z2);});
      if(!(dimmockZ>DATA.objective.z+DATA.objective.r))throw new Error('the outer Dimmock face must be losable while the objective holds');
      if(DATA.defaultFog!==false)throw new Error('fog became a mechanic');
      return {objective:DATA.objective.name,walls:walls.length,woods:woods.length,guns:totals().gunsUS+'/'+totals().gunsCS,fog:DATA.defaultFog};
    });

    check('REGISTRY + MENU: Petersburg initial assaults is rank 69 between Cold Harbor and Kennesaw in the 26-scenario registry',function(){
      var reg=fldScenarioRegistry(),order=fldScenarioMenuOrder(reg);
      if(Object.keys(reg).length!==26||reg.petersburgAssaults!==DATA)throw new Error('registry identity/count wrong');   // D442: 24 -> 26 — Atlanta (D436, whose sweep missed this count pin — recorded honestly) and Cold Harbor (rank 68.5) both register.
      if(fldScenarioMenuRank('petersburgAssaults')!==69)throw new Error('menu rank wrong: '+fldScenarioMenuRank('petersburgAssaults'));
      if(order.indexOf('coldHarbor')!==order.indexOf('spotsylvania')+1||order.indexOf('petersburgAssaults')!==order.indexOf('coldHarbor')+1||order.indexOf('kennesaw')!==order.indexOf('petersburgAssaults')+1||order.indexOf('spotsylvania')!==order.indexOf('wilderness')+1)throw new Error('menu chronology wrong: '+order.join(' -> '));   // D442 reshape: Cold Harbor (the documented 68.5) inserts between Spotsylvania and this battle.
      return {count:Object.keys(reg).length,rank:69,after:'coldHarbor',before:'kennesaw'};
    });

    check('RANK WALL: battle-date grades are exact - Beauregard full General commanding June 15-17, Smith restored Maj. Gen., Willcox/Griffin/Ayres/Crawford/Cutler brigadiers, Kershaw/Gibbon reversed to Maj. Gens., Dearing disclosed, Lee timed to June 18, and the absence walls hold',function(){
      var text=JSON.stringify(DATA);
      ['Gen. P. G. T. Beauregard','Brig. Gen. Henry A. Wise','Brig. Gen. James Dearing','Maj. Gen. Robert F. Hoke','Maj. Gen. Bushrod R. Johnson','Maj. Gen. Joseph B. Kershaw','Maj. Gen. Charles W. Field','Gen. Robert E. Lee','Lt. Gen. Ulysses S. Grant','Maj. Gen. George G. Meade','Maj. Gen. Winfield S. Hancock','Maj. Gen. David B. Birney','Maj. Gen. John Gibbon','Brig. Gen. Francis C. Barlow','Maj. Gen. Ambrose E. Burnside','Brig. Gen. James H. Ledlie','Brig. Gen. Robert B. Potter','Brig. Gen. Orlando B. Willcox','Maj. Gen. Gouverneur K. Warren','Brig. Gen. Charles Griffin','Brig. Gen. Romeyn B. Ayres','Brig. Gen. Samuel W. Crawford','Brig. Gen. Lysander Cutler','Brig. Gen. Edward W. Hinks','Brig. Gen. William T. H. Brooks','Brig. Gen. John H. Martindale','Brig. Gen. August Kautz'].forEach(function(s){if(text.indexOf(s)<0)throw new Error('missing required rank rendering: '+s);});
      var smithOk=(((DATA.leaders||{}).US)||[]).some(function(l){return l.name==='Maj. Gen. William F. "Baldy" Smith';});
      if(!smithOk)throw new Error('Smith must render as the restored Maj. Gen. William F. "Baldy" Smith');
      [/Lt\\. Gen\\. (?:P\\.? ?G\\.? ?T\\.? )?Beauregard/,/Lieutenant General (?:P\\.? ?G\\.? ?T\\.? )?Beauregard/,/Brig\\. Gen\\. (?:William F?\\.?|Baldy)[^,]{0,12}Smith/,/Brigadier General (?:William F?\\.?|Baldy)[^,]{0,12}Smith/,/Maj\\. Gen\\. (?:Orlando B?\\.? )?Willcox/,/Major General (?:Orlando B?\\.? )?Willcox/,/Brig\\. Gen\\. (?:Joseph B?\\.? )?Kershaw/,/Brigadier General (?:Joseph B?\\.? )?Kershaw/,/Brig\\. Gen\\. (?:John )?Gibbon/,/Brigadier General (?:John )?Gibbon/,/Maj\\. Gen\\. (?:James )?Dearing/,/Major General (?:James )?Dearing/,/Maj\\. Gen\\. (?:Henry A?\\.? )?Wise/,/Maj\\. Gen\\. (?:Edward W?\\.? )?Hinks/,/Maj\\. Gen\\. (?:Charles )?Griffin/,/Maj\\. Gen\\. (?:Romeyn B?\\.? )?Ayres/,/Maj\\. Gen\\. (?:Samuel W?\\.? )?Crawford/,/Maj\\. Gen\\. (?:Lysander )?Cutler/,/Longstreet/,/General Grant\\b(?! [a-z])/].forEach(function(re){if(re.test(text))throw new Error('forbidden rank rendering: '+re);});
      var cast='';rows().forEach(function(row){cast+=' '+String(row.u.commander||'')+' '+String(row.u.name||'');});(((DATA.leaders||{}).US)||[]).concat(((DATA.leaders||{}).CS)||[]).forEach(function(l){cast+=' '+String(l.name||'');});
      [/Pickett/i,/\\bWright\\b/i,/VI Corps/i,/Sixth Corps/i,/Longstreet/i].forEach(function(re){if(re.test(cast))throw new Error('absence-wall violation - a walled officer or corps holds a field seat: '+re);});
      if(String(DATA.brief.defend).indexOf('Gen. P. G. T. Beauregard')<0)throw new Error('the defense brief must credit Beauregard');
      var beau=(((DATA.leaders||{}).CS)||[]).filter(function(l){return /Beauregard/.test(String(l.name||''));})[0];
      var lee=(((DATA.leaders||{}).CS)||[]).filter(function(l){return l.name==='Gen. Robert E. Lee';})[0];
      if(!beau||typeof beau.atSec==='number')throw new Error('Beauregard must command from the start of the race');
      if(!lee||!(lee.atSec>=300))throw new Error('THE LATE-ARRIVAL TRAP: Lee must arrive as a timed June 18 input, got '+(lee&&lee.atSec));
      if(String(lee.note||'').toLowerCase().indexOf('june 18')<0)throw new Error('the Lee note must carry the 11 a.m. June 18 arrival');
      var dear=null;rows().forEach(function(row){if(/Dearing/.test(String(row.u.commander||'')))dear=row.u;});
      if(!dear||String(dear.note||'').toLowerCase().indexOf('never approved by the confederate congress')<0)throw new Error('Dearing must carry the unconfirmed-commission disclosure');
      return {beauregard:'full General, from the start',smith:'restored Maj. Gen.',kershaw:'Maj. Gen. (reversed)',gibbon:'Maj. Gen. (reversed)',willcox:'Brig. Gen.',dearing:'disclosed',lee:'timed June 18'};
    });

    check('D74 NO-FUDGE + RACE LAW: deep data scan finds no battle-specific output, hesitation, caution, paralysis, night, darkness, garrison, refusal, USCT, valor, or winner key',function(){
      var bad=[];keyScan(DATA,'petersburgAssaults',bad);if(bad.length)throw new Error(bad.join(', '));
      var branches=['petersburgPenalty','petersburgBonus','hesitationMult','cautionMult','commandParalysis','nightMult','darknessPenalty','garrisonBonus','worksEmptyBonus','assaultRefusal','refusalMult','usctBonus','usctPenalty','valorBonus','greenTroopMult','raceBonus','opportunityBonus'];branches.forEach(function(n){if(typeof window[n]==='function')throw new Error('battle-specific function '+n);});
      return {badKeys:0,battleSpecificFunctions:0};
    });

    check('REGISTERED LAUNCH + REINFORCEMENTS: canonical data launches single-phase, the 26-unit cast completes exactly once, and no Classic state appears',function(){
      delete G.battle;G.mode='menu';G.campaign=null;G.settings=G.settings||{};delete G.settings.tacticalFog;
      __FIELD._officersOff=false;__FIELD._logisticsOff=false;__FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none',scenario:'petersburgAssaults',autoBoth:true,playerSide:'US',seed:22});
      if(__FIELD.scenData!==DATA||__FIELD.units.length!==9||(__FIELD.reinforce||[]).length!==17)throw new Error('registered launch wrong: '+__FIELD.units.length+'/'+(__FIELD.reinforce||[]).length);
      if(__FIELD.phases!==null||__FIELD.attacker!=='US'||__FIELD.fog!==false)throw new Error('single-phase role/fog launch wrong');
      if(!__FIELD.objective||__FIELD.objective.name!=='Petersburg - Eastern City Approach')throw new Error('launch objective wrong');
      var maxAt=0;(__FIELD.reinforce||[]).forEach(function(r){maxAt=Math.max(maxAt,+r.atSec||0);});__FIELD.t=maxAt;fldScenarioTick(0.05);var once=__FIELD.units.length;fldScenarioTick(0.05);
      var ids={};__FIELD.units.forEach(function(u){var k=u.side+':'+u.id;if(ids[k])throw new Error('duplicate launched id '+k);ids[k]=1;});
      if(once!==26||__FIELD.units.length!==26||!__FIELD.reinforce.every(function(r){return r.done;})||Object.keys(ids).length!==26)throw new Error('reinforcement completion not idempotent: '+once+'/'+__FIELD.units.length);
      if(G.battle&&G.battle.M)throw new Error('Classic battle state created');
      return {opening:9,fielded:26,reinforcements:17,unique:Object.keys(ids).length};
    });

    check('SAME-SEED REPLAY: direct Petersburg runs reproduce winner, finish, steps, and fielded-minus-survivor losses',function(){
      var a=runBattle(97,true,'US'),b=runBattle(97,true,'US');
      if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('same-seed drift: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      if(a.phase!=='over'||a.steps>=26000)throw new Error('run did not terminate');return a;
    });

    check('PASSIVE-SIDE TERMINATION: Union-passive and Confederate-passive direct launches both finish with finite shared-engine outcomes',function(){
      var usPassive=runBattle(131,false,'US'),csPassive=runBattle(137,false,'CS');
      if(usPassive.phase!=='over'||csPassive.phase!=='over'||usPassive.steps>=26000||csPassive.steps>=26000)throw new Error('passive launch did not terminate');
      if(!/^(US|CS|draw)$/.test(String(usPassive.winner||''))||!/^(US|CS|draw)$/.test(String(csPassive.winner||'')))throw new Error('passive launch winner invalid');
      return {usPassive:{winner:usPassive.winner,steps:usPassive.steps},csPassive:{winner:csPassive.winner,steps:csPassive.steps}};
    });

    check('historical direction: exactly eight seeds - THE CITY GUARD: the CS defender holds the city approach >= 5/8, and CASUALTY-DIRECTION US>CS >= 5/8 (direction only, never magnitude)',function(){
      if(SEEDS.length!==8)throw new Error('exactly eight seeds required');var uniq={};SEEDS.forEach(function(s){uniq[s]=1;});if(Object.keys(uniq).length!==8)throw new Error('seeds must be unique');
      var csHolds=0,usBleedsMore=0,samples=[];
      for(var i=0;i<SEEDS.length;i++){
        var r=runBattle(SEEDS[i],true,'US');if(r.phase!=='over')throw new Error('seed '+SEEDS[i]+' did not finish');
        if(r.winner==='CS')csHolds++;if(r.losses.US>r.losses.CS)usBleedsMore++;
        samples.push({seed:SEEDS[i],winner:r.winner,by:r.by,lossUS:r.losses.US,lossCS:r.losses.CS});
      }
      if(!(csHolds>=5))throw new Error('THE CITY GUARD below 5/8: '+csHolds+' :: '+JSON.stringify(samples));
      if(!(usBleedsMore>=5))throw new Error('CASUALTY-DIRECTION US>CS below 5/8: '+usBleedsMore+' :: '+JSON.stringify(samples));
      return {seeds:SEEDS,cityHolds:csHolds+'/8',casualtyDirectionUSgtCS:usBleedsMore+'/8',samples:samples};
    });

    check('TEACHING + CODEX: ten restrained two-source cards with exact provenance - the race, the bridge, the USCT proving ground, the open night, Beauregard, the 1st Maine, the 11,386 ledger, the dual framing, the scope walls, and June 9 context',function(){
      var cards=((DATA.teaching||{}).cards)||[],codex=(DATA.teaching||{}).codex||{},ids=[];
      if(cards.length!==10)throw new Error('wanted ten cards, got '+cards.length);
      cards.forEach(function(c){ids.push(c.id);if(!/^(Verified|Inferred|Disputed)$/.test(String(c.provenance||''))||sourceUrls(c.sources).length<2)throw new Error('bad card '+c.id);});
      ['pete_race','pete_bridge','pete_usct','pete_night','pete_beauregard','pete_maine','pete_ledger','pete_decided','pete_not_here','pete_first'].forEach(function(id){if(ids.indexOf(id)<0)throw new Error('missing '+id);});
      var cardText=JSON.stringify(cards);['race','USCT','Beauregard','Maine','Never before tested in battle','378 killed and wounded','fullest confidence','at the mercy of the Federal commander','arguably his finest combat performance','632 of about 900','supremely disgusted','11,386','no massacre content','old men and young boys'].forEach(function(s){if(cardText.toLowerCase().indexOf(s.toLowerCase())<0)throw new Error('teaching thread missing: '+s);});
      if(!/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance||''))||sourceUrls(codex.sources).length<2)throw new Error('codex provenance/sources wrong');
      if(!codex.axes||codex.axes.theater!=='Eastern'||codex.axes.campaign!=='Richmond-Petersburg (Initial Assaults)'||codex.axes.result!=='Confederate victory')throw new Error('codex axes wrong');
      var ledger=cards.filter(function(c){return c.id==='pete_ledger';})[0];
      if(String(ledger.provenance)!=='Disputed')throw new Error('THE 11,386 SCOPE COLLISION must ship Disputed');
      return {cards:ids.length,codex:codex.id,axes:codex.axes};
    });

    check('ARMY REGISTER PIN: canonical registry identity plus 26 Petersburg unit trios produce current total 1617',function(){
      var registry=fldScenarioRegistry();if(registry.petersburgAssaults!==DATA)throw new Error('declared registry dependency missing');
      var C=campaign();if(typeof _t1InitAll==='function')_t1InitAll(C);var reg=ssPersonRegistry(C),found=[],groups={};
      if(reg.people.length!==1617)throw new Error('Army Register total '+reg.people.length+' expected 1617');   // D397: 1434 -> 1512 — Petersburg initial assaults adds 26 unique side-unit ids x 3 slots. D393: 1380 -> 1434 — Wilderness adds 18 unique side-unit ids x 3 slots. D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots. D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots. D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7): Watie's 2nd CMR adds 1 unique side-unit id x 3 slots.
      for(var i=0;i<reg.people.length;i++){var p=reg.people[i],origin=p.replaces||p.pid;if(typeof origin==='string'&&origin.indexOf('ss:petersburgAssaults:')===0)found.push({p:p,origin:origin});}
      if(found.length!==78)throw new Error('Petersburg rows '+found.length+' expected 78');
      found.forEach(function(row){var m=row.origin.match(/^ss:petersburgAssaults:(US|CS):([^:]+):(cmd|nco|pvt)$/);if(!m)throw new Error('bad slot '+row.origin);var key=m[1]+':'+m[2];groups[key]=groups[key]||{};groups[key][m[3]]=1;if(row.p.source!=='scenario-oob'||row.p.generated!==true||row.p.provenance!=='Inferred')throw new Error('slot metadata '+row.origin);});
      var keys=Object.keys(groups);if(keys.length!==26)throw new Error('unit groups '+keys.length+' expected 26');keys.forEach(function(k){if(!groups[k].cmd||!groups[k].nco||!groups[k].pvt)throw new Error('incomplete trio '+k);});
      return {total:reg.people.length,petersburgRows:found.length,units:keys.length,slots:['cmd','nco','pvt']};
    });

    check('SCOPE: single-phase June 15-18 only; no Cold Harbor/Crater/Fort Stedman/April-2 tactical registration and no Petersburg-only combat function appears',function(){
      var ids=Object.keys(fldScenarioRegistry());if(ids.some(function(id){return /crater|fortStedman|fort-stedman|overlandCampaign/i.test(id);}))throw new Error('forbidden tactical id');   // D454: coldHarbor (cold-harbor) is RATIFIED + registered as scenario 26 since D442 and leaves this tooth (the same documented way petersburgAssaults left the D393-era scans at D397); crater/fortStedman/overlandCampaign stay forbidden until their own ratified builds.
      if(DATA.phases)throw new Error('Petersburg initial assaults became phased');
      var functions=['petersburgPenalty','petersburgBonus','hesitationMult','nightMult','garrisonBonus','usctBonus','usctPenalty'];functions.forEach(function(n){if(typeof window[n]==='function')throw new Error('battle-specific function '+n);});
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
    check('RUNTIME MENU + SIDE CHOICE: Petersburg button is unique between Spotsylvania and Kennesaw, and fldLaunchBattle preserves the chosen Confederate side',function(){
      if(typeof openMainMenu==='function')openMainMenu();fldInjectMenuButton();
      var btn=document.getElementById('fldScnBtn_petersburgAssaults');if(!btn||!btn.getAttribute('aria-label'))throw new Error('accessible Petersburg button missing');
      fldInjectMenuButton();if(document.querySelectorAll('#fldScnBtn_petersburgAssaults').length!==1)throw new Error('duplicate Petersburg button');
      var ids=Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){return b.id;});
      if(ids.indexOf('fldScnBtn_coldHarbor')!==ids.indexOf('fldScnBtn_spotsylvania')+1||ids.indexOf('fldScnBtn_petersburgAssaults')!==ids.indexOf('fldScnBtn_coldHarbor')+1||ids.indexOf('fldScnBtn_kennesaw')!==ids.indexOf('fldScnBtn_petersburgAssaults')+1)throw new Error('button chronology wrong: '+ids.join(' -> '));   // D454 re-pin: D442 registered coldHarbor at rank 68.5 BETWEEN spotsylvania and petersburgAssaults (the documented non-integer exception; probe-tactical-roster pins the same order) — the pre-D442 spotsylvania+1 pin was stale on this tooth's first-ever run; the chain now guards Spotsylvania -> Cold Harbor -> Petersburg initial assaults -> Kennesaw.
      var got=null;fldScenarioSideChoice('petersburgAssaults',function(side){got=side;});var cards=document.querySelectorAll('[data-brside]');
      if(cards.length!==2)throw new Error('wanted two side cards, got '+cards.length);cards[1].click();if(got!=='CS')throw new Error('CS side card returned '+got);
      var captured=null,oldLaunch=window.fldLaunchSandbox,oldBrief=window.fldBullRunBriefing;
      try{window.fldLaunchSandbox=function(opts){captured=opts;};window.fldBullRunBriefing=function(){};fldLaunchBattle('petersburgAssaults','CS');}
      finally{window.fldLaunchSandbox=oldLaunch;window.fldBullRunBriefing=oldBrief;}
      if(!captured||captured.scenario!=='petersburgAssaults'||captured.playerSide!=='CS'||captured.renderer!=='3d')throw new Error('fldLaunchBattle options wrong: '+JSON.stringify(captured));
      return {button:btn.id,sideChoice:got,launch:captured};
    });
  }catch(e){R.ok=false;R.fatal=String(e&&e.message||e);}
  return JSON.stringify(R);
})()`;

function preparseCooked() {
  new Script(SETUP, { filename: "probe-petersburg-initial-assaults-SETUP.js" });
  new Script(DOM, { filename: "probe-petersburg-initial-assaults-DOM.js" });
}

async function main() {
  let server=null,browser=null;
  const url=cfg.baseUrl+"/"+cfg.file;
  const result={ok:false,steps:[],pageerrors:[]};
  try {
    preparseCooked();
    result.steps.push({name:"HARNESS PREPARSE: cooked SETUP and DOM compile before Chrome",ok:true,v:{setup:true,dom:true}});
    const base=readFileSync(join(ROOT,"build","base.html"),"utf8");
    const classicRows=Array.from(base.matchAll(/\{id:"petersburg-break", name:"Fall of Petersburg"/g)).length;
    const classicExact=base.includes('{id:"petersburg-break", name:"Fall of Petersburg", year:1865, th:"E", atk:"US", us:63000, cs:18000')&&base.includes('res:"The Sixth Corps breakthrough forced the evacuation of Richmond.", cmdUS:"Grant", cmdCS:"Lee"');
    const rail=JSON.parse(readFileSync(join(ROOT,"data","logistics-rail.json"),"utf8"));
    const route=(rail.routes||{})["petersburg-break"];
    const routeOk=!!route&&/Petersburg rail lifelines/.test(String(route.label||''))&&route.theater==="E"&&route.provenance==="Inferred"&&route.friction&&route.friction.US===7&&route.friction.CS===20;
    const noTacticalRoute=!(rail.routes||{}).petersburgAssaults&&!(rail.routes||{})["petersburg-assaults"];
    const forbiddenData=readdirSync(join(ROOT,"data")).filter(f=>/crater|fort-stedman/i.test(f));   // D454: data/cold-harbor.json is RATIFIED since D442 (scenario 26) and leaves this scan the same documented way; crater + fort-stedman stay forbidden until their own ratified builds.
    const classicOk=classicRows===1&&classicExact&&routeOk&&noTacticalRoute&&forbiddenData.length===0;
    result.steps.push({name:"CLASSIC + RAIL COLLISION: the frozen Classic petersburg-break row (the April 2, 1865 battle - a DIFFERENT fight) and its pre-existing strategic rail route remain exact, separate layers with no new tactical route",ok:!!classicOk,v:{classicRows,classicExact,route,noTacticalRoute,forbiddenData}});
    if(!classicOk)throw new Error("Classic/rail collision contract changed");
    if(!(await up(url))){server=spawn("python3",["-m","http.server",String(cfg.port)],{cwd:ROOT,stdio:"ignore"});for(let i=0;i<80&&!(await up(url));i++)await sleep(250);}
    if(!(await up(url)))throw new Error("server not reachable at "+url);
    try{browser=await chromium.launch({channel:"chrome",headless:true,args:GL});}
    catch{browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:GL});}
    const page=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:1});
    page.on("pageerror",e=>result.pageerrors.push(String(e&&e.message||e)));
    page.on("console",msg=>{if(msg.type()==="error")result.pageerrors.push("console: "+msg.text());});
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:90000});   // D397 harness capacity: the 24-scenario single-file page needs ~35s to evaluate on the 8 GB reference Mac; 45s left no headroom under fileproviderd churn (readiness budget only - no tooth or assertion changes)
    await page.waitForFunction(()=>typeof window.fldLaunchSandbox==="function"&&typeof window.fldScenarioRegistry==="function"&&window.GAME_DATA&&window.GAME_DATA["petersburg-assaults"],null,{timeout:90000});
    const setup=JSON.parse(await page.evaluate(SETUP));
    const dom=JSON.parse(await page.evaluate(DOM));
    result.steps=result.steps.concat(setup.steps||[],dom.steps||[]);
    result.pageerrors=result.pageerrors.concat(setup.errors||[],dom.errors||[]);
    if(setup.fatal)result.pageerrors.push("SETUP fatal: "+setup.fatal);
    if(dom.fatal)result.pageerrors.push("DOM fatal: "+dom.fatal);
    result.ok=!!setup.ok&&!!dom.ok&&result.steps.every(s=>s.ok)&&result.pageerrors.length===0;
    try{
      await page.evaluate(`(() => { fldLaunchSandbox({renderer:'2d',scenario:'petersburgAssaults',autoBoth:true,playerSide:'US',seed:47});__FIELD.phase='battle';__FIELD.paused=true;fldStepN(1800,0.05);fld2dDraw();fldRenderTop();fldRenderHud(); })()`);
      await page.screenshot({path:join(OUT,"probe-petersburg-initial-assaults.png"),fullPage:false,timeout:5000});
    }catch(e){result.screenshotWarning=String(e&&e.message||e);}
    result.ok=result.ok&&result.steps.every(s=>s.ok)&&result.pageerrors.length===0;
  } catch(e){result.fatal=String(e&&e.stack||e&&e.message||e);result.ok=false;}
  finally{
    try{writeFileSync(join(OUT,"probe-petersburg-initial-assaults.json"),JSON.stringify(result,null,2));}catch{}
    printResult(result);await closeBrowserHard(browser);killChild(server);
  }
  if(!result.ok)process.exit(1);
  console.log("ALL OK");
}

main();
