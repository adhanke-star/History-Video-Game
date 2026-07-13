#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D380 playable Five Forks. The focused guard binds the single-phase US attacker-seize
// data, the generic Warren-to-Griffin current-cast relief event, the 19/49/1200/19/124
// integration surfaces, and exactly eight shared-model historical direction seeds.
// Direction remains independent of the T1 registration line so bind B bites only the
// declared registry/menu/launch/Army-Register teeth while history remains green.
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
const SEEDS = [5, 17, 29, 43, 71, 113, 211, 389];
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
  console.log("probe-five-forks ok=" + result.ok + " steps=" + (result.steps || []).length + " pageerrors=" + (result.pageerrors || []).length);
  if (result.fatal) console.log("  FATAL " + result.fatal);
  for (const s of (result.steps || [])) {
    if (s.ok) console.log("  ok   " + s.name.slice(0, 90) + " :: " + JSON.stringify(s.v).slice(0, 320));
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
  var DATA = GAME_DATA['five-forks'] && GAME_DATA['five-forks'].fiveForks;
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
    var out={US:0,CS:0,units:0,opening:((DATA.oob.US||[]).length+(DATA.oob.CS||[]).length),gunsUS:0,gunsCS:0};
    rows().forEach(function(row){ out[row.side]+=(row.u.men||0); out.units++; if(row.u.arm==='art') out[row.side==='US'?'gunsUS':'gunsCS']+=(row.u.guns||0); });
    return out;
  }
  function sourceUrls(value) {
    var seen={},out=[]; if(!Array.isArray(value)) return out;
    value.forEach(function(u){if(typeof u==='string'&&/^https?:/.test(u)&&!seen[u]){seen[u]=1;out.push(u);}}); return out;
  }
  function keyScan(obj,path,bad) {
    if(!obj||typeof obj!=='object') return;
    var forbidden={damage:1,dmg:1,damagemult:1,firepower:1,firepowermult:1,firescale:1,firemult:1,firemultiplier:1,killscale:1,killmult:1,casualtyscale:1,casualtymult:1,lossscale:1,lossmult:1,capturescale:1,capturemult:1,surrenderscale:1,surrendermult:1,routscale:1,routmult:1,moralescale:1,moralemult:1,combatscale:1,battledamage:1,battlefire:1,powermult:1,scorebonus:1,scoremult:1,winner:1,winoverride:1,victoryoverride:1,outcomeoverride:1,forcewin:1,winnerfudge:1,fudge:1,genius:1,geniusmult:1,hesitation:1,hesitationmult:1,flank:1,flankmult:1,commandfailure:1,commandfailuremult:1,shadbake:1,shadbakemult:1,fiveforkspenalty:1};
    for(var k in obj) if(Object.prototype.hasOwnProperty.call(obj,k)) { var p=path?path+'.'+k:k; if(forbidden[String(k).toLowerCase()]) bad.push(p); keyScan(obj[k],p,bad); }
  }
  function byLeader(id) { var L=__FIELD.leaders||[]; for(var i=0;i<L.length;i++) if(L[i].id===id) return L[i]; return null; }
  function withDirectFiveForks(fn) {
    var oldScenarioData=fldScenarioData;
    try {
      fldScenarioData=function(id){ return id==='fiveForks' ? DATA : oldScenarioData(id); };
      return fn();
    } finally { fldScenarioData=oldScenarioData; }
  }
  function resultSnapshot() {
    var units=(__FIELD.units||[]).map(function(u){return {id:u.id,men:u.men,morale:u.morale,state:u.state,alive:u.alive};});
    return JSON.stringify({winner:__FIELD.winner,winBy:__FIELD.winBy,hold:__FIELD.holdT,captured:__FIELD.captured,missing:__FIELD.missing,routs:__FIELD.routs,surrender:__FIELD.surrender,battleCas:__FIELD.battleCas,classic:G.battle&&G.battle.M,campaign:G.campaign&&G.campaign.phase,units:units});
  }
  function runBattle(seed,autoBoth,playerSide) {
    return withDirectFiveForks(function(){
      G.campaign=null; G.settings=G.settings||{}; delete G.settings.tacticalFog;
      try{delete G.settings.tacticalPreset;}catch(e){}
      __FIELD._officersOff=false; __FIELD._logisticsOff=false; __FIELD._armsOff=false;
      fldLaunchSandbox({renderer:'none',scenario:'fiveForks',autoBoth:autoBoth!==false,playerSide:playerSide||'US',seed:seed});
      __FIELD.phase='battle'; __FIELD.paused=false;
      var n=0; while(__FIELD.phase==='battle'&&n<20000){fldSimStep(0.05);n++;}
      var fielded={US:0,CS:0},survivors={US:0,CS:0};
      for(var i=0;i<__FIELD.units.length;i++){
        var u=__FIELD.units[i]; if(u.side!=='US'&&u.side!=='CS') continue;
        fielded[u.side]+=Math.max(0,u.maxMen||0); if(u.alive) survivors[u.side]+=Math.max(0,u.men||0);
      }
      return {winner:__FIELD.winner,by:__FIELD.winBy,phase:__FIELD.phase,steps:n,fielded:fielded,survivors:survivors,losses:{US:fielded.US-survivors.US,CS:fielded.CS-survivors.CS}};
    });
  }
  function campaign() { return {side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[],nextId:1,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]}; }
  try {
    if(!DATA) throw new Error('GAME_DATA five-forks.fiveForks missing');

    check('DATA + OOB: single-phase US attacker, fog off, 21,000/9,200 anchors, ten unique Inferred-strength units, bounded guns',function(){
      var t=totals(), ids={}, unitRows=rows();
      if(DATA.id!=='fiveForks'||DATA.attacker!=='US'||DATA.defender!=='CS'||DATA.defaultFog!==false||Object.prototype.hasOwnProperty.call(DATA,'phases')) throw new Error('root shape wrong');
      if(t.US!==21000||t.CS!==9200||t.units!==10||t.opening!==9) throw new Error('totals/shape wrong: '+JSON.stringify(t));
      unitRows.forEach(function(row){var k=row.side+':'+row.u.id;if(ids[k])throw new Error('duplicate '+k);ids[k]=1;if(String(row.u.note||'').indexOf('Inferred strength')<0)throw new Error('missing disclosure '+k);if(row.u.arm==='art'&&(!(row.u.guns>0)||row.u.men/row.u.guns>40))throw new Error('artillery envelope wrong '+k);});
      if(Object.keys(ids).length!==10||t.gunsUS!==25||t.gunsCS!==15) throw new Error('unit/gun count wrong: '+JSON.stringify(t));
      if(!DATA.weather||DATA.weather.time!=='afternoon'||DATA.weather.sky!=='haze'||DATA.weather.provenance!=='Inferred') throw new Error('late-afternoon weather contract wrong');
      return t;
    });

    check('REGISTRY + MENU: Five Forks is scenario 19 at rank 85 after Nashville',function(){
      var reg=fldScenarioRegistry(),order=fldScenarioMenuOrder(reg);
      if(Object.keys(reg).length!==22||reg.fiveForks!==DATA) throw new Error('registry identity/count wrong');   // D391: 21 -> 22 — Spotsylvania registers as the twenty-second scenario. D388: 20 -> 21 — Elkhorn Tavern registers as the twenty-first scenario; Five Forks' own rank-85 teeth remain stable.
      if(fldScenarioMenuRank('fiveForks')!==85||order.indexOf('fiveForks')!==order.indexOf('nashville')+1) throw new Error('menu chronology wrong: '+order.join(' -> '));
      return {count:Object.keys(reg).length,rank:85,order:order.indexOf('fiveForks')};
    });

    check('TERRAIN: Five Forks, White Oak Road, the Angle, Gravelly Run, and Hatcher\\'s Run are encoded without turning teaching sites into objectives',function(){
      var text=JSON.stringify(DATA),markers=(DATA.terrain&&DATA.terrain.markers)||[],walls=(DATA.terrain&&DATA.terrain.walls)||[];
      ['Five Forks','White Oak Road','the Angle','Gravelly Run',"Hatcher's Run","Ford's Road / Scott's Road"].forEach(function(s){if(text.indexOf(s)<0)throw new Error('missing '+s);});
      if(DATA.objective.name!=='Five Forks Crossroads'||walls.length!==3||markers.length<6) throw new Error('objective/works shape wrong');
      if(/Dinwiddie Court House|shad bake/.test(DATA.objective.name)) throw new Error('teaching site became objective');
      return {objective:DATA.objective.name,walls:walls.length,markers:markers.length};
    });

    check('RANKS + ABSENCE: battle-date grades are exact and Pickett/Fitz Lee/Rosser have no active aura records',function(){
      var text=JSON.stringify(DATA),required=['Maj. Gen. Philip H. Sheridan','Maj. Gen. Gouverneur K. Warren','Brig. Gen. Charles Griffin','Maj. Gen. George E. Pickett','Maj. Gen. Fitzhugh Lee','Maj. Gen. Thomas L. Rosser','Lt. Gen. Ulysses S. Grant'];
      required.forEach(function(s){if(text.indexOf(s)<0)throw new Error('missing '+s);});
      [/Lt\. Gen\. Philip H\. Sheridan/,/Maj\. Gen\. Charles Griffin(?!.*brevet)/,/Lt\. Gen\. George E\. Pickett/,/Maj\. Gen\. Ulysses S\. Grant/,/General Ulysses S\. Grant/].forEach(function(re){if(re.test(text))throw new Error('forbidden rank '+re);});
      var cs=((DATA.leaders||{}).CS)||[]; if(cs.some(function(l){return /Pickett|Fitzhugh Lee|Thomas L\. Rosser/.test(String(l.name||''));})) throw new Error('absent senior commander has aura');
      return {us:DATA.leaders.US.map(function(l){return l.name;}),cs:cs.length};
    });

    check('D74 NO-FUDGE: deep data scan finds no battle-specific output, casualty, morale, fire, surrender, rout, or command-failure key',function(){
      var bad=[];keyScan(DATA,'fiveForks',bad);if(bad.length)throw new Error(bad.join(', '));return {bad:0};
    });

    check('REGISTERED LAUNCH + REINFORCEMENT: canonical data launches, the ten-unit cast completes once, and no Classic state appears',function(){
      delete G.battle; G.mode='menu';
      fldLaunchSandbox({renderer:'none',scenario:'fiveForks',autoBoth:true,playerSide:'US',seed:19});
      if(__FIELD.scenData!==DATA||__FIELD.units.length!==9||(__FIELD.reinforce||[]).length!==1||(__FIELD.leaders||[]).length!==3) throw new Error('registered launch wrong');
      __FIELD.t=45;fldScenarioTick(0.05);var once=__FIELD.units.length;fldScenarioTick(0.05);
      if(once!==10||__FIELD.units.length!==10||!__FIELD.reinforce[0].done) throw new Error('reinforcement not idempotent');
      if(G.battle&&G.battle.M) throw new Error('Classic battle state created');
      return {opening:9,fielded:10,reinforcements:1};
    });

    check('COMMAND EVENT: Warren before, Griffin after; no overlap, no gap, Warren alive+relieved, and relief is output-neutral',function(){
      return withDirectFiveForks(function(){
        fldLaunchSandbox({renderer:'none',scenario:'fiveForks',autoBoth:true,playerSide:'US',seed:23});
        var w=byLeader('ld_warren'),g=byLeader('ld_griffin'); if(!w||!g)throw new Error('relief leaders missing');
        __FIELD.t=g.atSec-0.01;fldOfficersStep(0.05);
        if(!w.active||g.active||[w,g].filter(function(l){return l.active;}).length!==1)throw new Error('Warren before no overlap/no gap state wrong');
        var before=resultSnapshot();__FIELD.t=g.atSec;fldOfficersStep(0.05);var after=resultSnapshot();
        if(before!==after)throw new Error('relief changed result/output ledger');
        if(w.active||!w.alive||!w.relieved||w.fellAt||!g.active||[w,g].filter(function(l){return l.active;}).length!==1)throw new Error('Griffin after no overlap/no gap state wrong');
        fldOfficersStep(0.05);if(!g.active||w.active)throw new Error('repeat tick changed relief');
        return {before:'Warren',after:'Griffin',warren:{alive:w.alive,relieved:w.relieved,active:w.active},activeCount:1};
      });
    });

    check('SAME-SEED REPLAY: direct Five Forks runs reproduce winner, finish, and fielded-minus-survivor losses',function(){
      var a=runBattle(97,true,'US'),b=runBattle(97,true,'US');
      if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('same-seed drift: '+JSON.stringify(a)+' vs '+JSON.stringify(b));
      if(a.phase!=='over'||a.steps>=20000)throw new Error('run did not terminate');return a;
    });

    check('PASSIVE-SIDE TERMINATION: Union-passive and Confederate-passive direct launches both finish under the shared engine',function(){
      var usPassive=runBattle(131,false,'US'),csPassive=runBattle(137,false,'CS');
      if(usPassive.phase!=='over'||csPassive.phase!=='over'||usPassive.steps>=20000||csPassive.steps>=20000)throw new Error('passive launch did not terminate');
      return {usPassive:{winner:usPassive.winner,steps:usPassive.steps},csPassive:{winner:csPassive.winner,steps:csPassive.steps}};
    });

    check('historical direction: exactly eight seeds produce at least 5/8 US objective seizures and 5/8 CS total losses above US',function(){
      var usSeizes=0,csBleedsMore=0,samples=[];
      for(var i=0;i<SEEDS.length;i++){
        var r=runBattle(SEEDS[i],true,'US');
        if(r.winner==='US'&&r.by==='hold')usSeizes++;
        if(r.losses.CS>r.losses.US)csBleedsMore++;
        samples.push({seed:SEEDS[i],winner:r.winner,by:r.by,lossUS:r.losses.US,lossCS:r.losses.CS});
      }
      if(usSeizes>=5===false)throw new Error('US objective seizures below 5/8: '+usSeizes+' :: '+JSON.stringify(samples));
      if(csBleedsMore>=5===false)throw new Error('CS losses above US below 5/8: '+csBleedsMore+' :: '+JSON.stringify(samples));
      return {seeds:SEEDS,usSeizes:usSeizes+'/8',csBleedsMore:csBleedsMore+'/8',samples:samples};
    });

    check('TEACHING + CODEX: seven restrained two-source cards, exact provenance labels, Appomattox limits, USCT agency, and Eastern campaign axes',function(){
      var cards=((DATA.teaching||{}).cards)||[],codex=(DATA.teaching||{}).codex||{},ids=[];
      if(cards.length<7)throw new Error('only '+cards.length+' cards');
      cards.forEach(function(c){ids.push(c.id);if(!/^(Verified|Inferred|Disputed)$/.test(String(c.provenance||''))||sourceUrls(c.sources).length<2)throw new Error('bad card '+c.id);});
      ['ff_warren_inquiry','ff_shad_bake','ff_attrition_state_capacity','ff_appomattox_teaching_only','ff_usct_at_end','ff_reconciliation_memory','ff_prisoner_conflict'].forEach(function(id){if(ids.indexOf(id)<0)throw new Error('missing '+id);});
      if(!/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance||''))||sourceUrls(codex.sources).length<2)throw new Error('codex provenance/sources wrong');
      if(!codex.axes||codex.axes.theater!=='Eastern'||codex.axes.campaign!=='Appomattox Campaign'||codex.axes.result!=='Union victory')throw new Error('codex axes wrong');
      var text=JSON.stringify(DATA.teaching);['Dinwiddie Court House','shad bake','2nd Division, XXV Corps','seven United States Colored Troops','race-and-reunion','prisoner'].forEach(function(s){if(text.indexOf(s)<0)throw new Error('teaching term missing '+s);});
      return {cards:ids,codex:codex.id,axes:codex.axes};
    });

    check('ARMY REGISTER PIN: canonical registry identity plus ten Five Forks unit trios produce current total 1380',function(){
      var registry=fldScenarioRegistry();if(registry.fiveForks!==DATA)throw new Error('declared registry dependency missing');
      var C=campaign();if(typeof _t1InitAll==='function')_t1InitAll(C);var reg=ssPersonRegistry(C),found=[],groups={};
      if(reg.people.length!==1380)throw new Error('Army Register total '+reg.people.length+' expected 1380');   // D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D388: 1281 -> 1326 — Elkhorn Tavern adds 15 unique side-unit ids x 3 slots. D384: 1200 -> 1281 — Fort Donelson adds 27 unique units x 3 slots. D380: 1170 -> 1200 — Five Forks adds 10 unique units x 3 slots; Five Forks' own 30-row/10-trio teeth below remain stable.
      for(var i=0;i<reg.people.length;i++){var p=reg.people[i],origin=p.replaces||p.pid;if(typeof origin==='string'&&origin.indexOf('ss:fiveForks:')===0)found.push({p:p,origin:origin});}
      if(found.length!==30)throw new Error('Five Forks rows '+found.length+' expected 30');
      found.forEach(function(row){var m=row.origin.match(/^ss:fiveForks:(US|CS):([^:]+):(cmd|nco|pvt)$/);if(!m)throw new Error('bad slot '+row.origin);var key=m[1]+':'+m[2];groups[key]=groups[key]||{};groups[key][m[3]]=1;if(row.p.source!=='scenario-oob'||row.p.generated!==true||row.p.provenance!=='Inferred')throw new Error('slot metadata '+row.origin);});
      var keys=Object.keys(groups);if(keys.length!==10)throw new Error('unit groups '+keys.length+' expected 10');keys.forEach(function(k){if(!groups[k].cmd||!groups[k].nco||!groups[k].pvt)throw new Error('incomplete trio '+k);});
      return {total:reg.people.length,fiveForksRows:found.length,units:keys.length,slots:['cmd','nco','pvt']};
    });

    check('SCOPE: tactical Five Forks stays single-phase; no tactical Appomattox/surrender registration, new data, or Five-Forks-only combat function appears',function(){
      var ids=Object.keys(fldScenarioRegistry());if(ids.some(function(id){return /appomattox|surrender/i.test(id);}))throw new Error('forbidden tactical surrender/Appomattox id');
      if(DATA.phases)throw new Error('Five Forks became phased');
      var functions=['fiveForksPenalty','fiveForksBonus','shadBakeMult','commandFailureMult'];functions.forEach(function(n){if(typeof window[n]==='function')throw new Error('battle-specific function '+n);});
      return {singlePhase:true,tacticalAppomattox:false,battleSpecificFunctions:0};
    });
  } catch(e) { R.ok=false;R.fatal=String(e&&e.message||e); }
  return JSON.stringify(R);
})()`;

const DOM = `(() => {
  var R={ok:true,steps:[],errors:[]};
  function check(name,fn){try{var v=fn();R.steps.push({name:name,ok:true,v:v===undefined?null:v});}catch(e){R.ok=false;R.steps.push({name:name,ok:false,err:String(e&&e.message||e)});}}
  try {
    G.settings=G.settings||{};G.mode='menu';
    check('RUNTIME MENU + SIDE CHOICE: Five Forks button is unique and fldLaunchBattle preserves the chosen Confederate side',function(){
      if(typeof openMainMenu==='function')openMainMenu();fldInjectMenuButton();
      var btn=document.getElementById('fldScnBtn_fiveForks');if(!btn||!btn.getAttribute('aria-label'))throw new Error('accessible Five Forks button missing');
      fldInjectMenuButton();if(document.querySelectorAll('#fldScnBtn_fiveForks').length!==1)throw new Error('duplicate Five Forks button');
      var ids=Array.prototype.slice.call(document.querySelectorAll('.gn-btn')).map(function(b){return b.id;});
      if(ids.indexOf('fldScnBtn_fiveForks')!==ids.indexOf('fldScnBtn_nashville')+1)throw new Error('button chronology wrong: '+ids.join(' -> '));
      var got=null;fldScenarioSideChoice('fiveForks',function(side){got=side;});var cards=document.querySelectorAll('[data-brside]');
      if(cards.length!==2)throw new Error('wanted two side cards, got '+cards.length);cards[1].click();if(got!=='CS')throw new Error('CS side card returned '+got);
      var captured=null,oldLaunch=window.fldLaunchSandbox,oldBrief=window.fldBullRunBriefing;
      try{window.fldLaunchSandbox=function(opts){captured=opts;};window.fldBullRunBriefing=function(){};fldLaunchBattle('fiveForks','CS');}
      finally{window.fldLaunchSandbox=oldLaunch;window.fldBullRunBriefing=oldBrief;}
      if(!captured||captured.scenario!=='fiveForks'||captured.playerSide!=='CS'||captured.renderer!=='3d')throw new Error('fldLaunchBattle options wrong: '+JSON.stringify(captured));
      return {button:btn.id,sideChoice:got,launch:captured};
    });
  } catch(e){R.ok=false;R.fatal=String(e&&e.message||e);}
  return JSON.stringify(R);
})()`;

function preparseCooked() {
  new Script(SETUP, { filename: "probe-five-forks-SETUP.js" });
  new Script(DOM, { filename: "probe-five-forks-DOM.js" });
}

async function main() {
  let server=null,browser=null;
  const url=cfg.baseUrl+"/"+cfg.file;
  const result={ok:false,steps:[],pageerrors:[]};
  try {
    preparseCooked();
    result.steps.push({name:"HARNESS PREPARSE: cooked SETUP and DOM compile before Chrome",ok:true,v:{setup:true,dom:true}});
    const base=readFileSync(join(ROOT,"build","base.html"),"utf8");
    const classicRows=Array.from(base.matchAll(/\{id:"fiveforks", name:"Five Forks"/g)).length;
    const rail=JSON.parse(readFileSync(join(ROOT,"data","logistics-rail.json"),"utf8"));
    const route=(rail.routes||{}).fiveforks;
    const forbiddenData=readdirSync(join(ROOT,"data")).filter(f=>/appomattox|surrender/i.test(f));
    const classicOk=classicRows===1&&route&&route.label==="South Side Railroad pressure"&&route.theater==="E"&&route.provenance==="Inferred"&&route.friction&&route.friction.US===8&&route.friction.CS===18&&!Object.prototype.hasOwnProperty.call(rail.routes||{},"fiveForks")&&!Object.prototype.hasOwnProperty.call(rail.routes||{},"five-forks")&&forbiddenData.length===0;
    result.steps.push({name:"CLASSIC + RAIL COLLISION: lowercase fiveforks layers remain exact and separate from tactical fiveForks",ok:!!classicOk,v:{classicRows,route,forbiddenData}});
    if(!classicOk)throw new Error("Classic/rail collision contract changed");
    if(!(await up(url))){server=spawn("python3",["-m","http.server",String(cfg.port)],{cwd:ROOT,stdio:"ignore"});for(let i=0;i<80&&!(await up(url));i++)await sleep(250);}
    if(!(await up(url)))throw new Error("server not reachable at "+url);
    try{browser=await chromium.launch({channel:"chrome",headless:true,args:GL});}
    catch{browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:GL});}
    const page=await browser.newPage({viewport:{width:1440,height:950},deviceScaleFactor:1});
    page.on("pageerror",e=>result.pageerrors.push(String(e&&e.message||e)));
    page.on("console",msg=>{if(msg.type()==="error")result.pageerrors.push("console: "+msg.text());});
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
    await page.waitForFunction(()=>typeof window.fldLaunchSandbox==="function"&&typeof window.fldScenarioRegistry==="function"&&window.GAME_DATA&&window.GAME_DATA["five-forks"],null,{timeout:45000});
    const setup=JSON.parse(await page.evaluate(SETUP));
    const dom=JSON.parse(await page.evaluate(DOM));
    result.steps=result.steps.concat(setup.steps||[],dom.steps||[]);
    result.pageerrors=result.pageerrors.concat(setup.errors||[],dom.errors||[]);
    if(setup.fatal)result.pageerrors.push("SETUP fatal: "+setup.fatal);
    if(dom.fatal)result.pageerrors.push("DOM fatal: "+dom.fatal);
    result.ok=!!setup.ok&&!!dom.ok&&result.steps.every(s=>s.ok)&&result.pageerrors.length===0;
    try{
      await page.evaluate(`(() => { fldLaunchSandbox({renderer:'2d',scenario:'fiveForks',autoBoth:true,playerSide:'US',seed:43});__FIELD.phase='battle';__FIELD.paused=true;fldStepN(1800,0.05);fld2dDraw();fldRenderTop();fldRenderHud(); })()`);
      await page.screenshot({path:join(OUT,"probe-five-forks.png"),fullPage:false,timeout:5000});
    }catch(e){result.screenshotWarning=String(e&&e.message||e);}
  } catch(e){result.fatal=String(e&&e.message||e);result.ok=false;}
  finally{
    try{writeFileSync(join(OUT,"probe-five-forks.json"),JSON.stringify(result,null,2));}catch{}
    printResult(result);await closeBrowserHard(browser);killChild(server);
  }
  if(!result.ok)process.exit(1);
  console.log("ALL OK");
}

main();
