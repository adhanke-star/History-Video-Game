#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D523 / LANE-019 Slice-3A focused detached conquest-state contract proof.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname=dirname(fileURLToPath(import.meta.url)),ROOT=resolve(__dirname,".."),OUT=join(__dirname,"shots"),ART=join(OUT,"probe-conquest-state.json");
mkdirSync(OUT,{recursive:true});
const cfg=JSON.parse(readFileSync(join(__dirname,"shots.json"),"utf8"));
const result={ok:true,steps:[],failed:[],errors:[],pageerrors:[],realErrors:[],summary:null};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const need=(ok,msg)=>{if(!ok)throw new Error(msg);};
async function up(url){try{const response=await fetch(url,{method:"HEAD"});return response.ok||response.status===200;}catch{return false;}}
async function step(name,fn){
  try{const v=await fn();result.steps.push({name,ok:true,v:v===undefined?null:v});console.log("  OK "+name);}
  catch(error){const err=String(error&&error.message||error);result.ok=false;result.steps.push({name,ok:false,err});console.error("  FAIL "+name+" :: "+err);}
}

let server=null,browser=null;
try{
  const url=`${cfg.baseUrl}/${cfg.file}`;
  if(!(await up(url))){
    server=spawn("python3",["-m","http.server",String(cfg.port)],{cwd:ROOT,stdio:"ignore"});
    for(let i=0;i<80&&!await up(url);i++)await sleep(150);
  }
  try{browser=await chromium.launch({channel:"chrome",headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--disable-dev-shm-usage"]});}
  catch{browser=await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:["--disable-dev-shm-usage"]});}
  const page=await browser.newPage({viewport:{width:1180,height:900}});
  page.setDefaultTimeout(10000);
  page.on("pageerror",error=>result.pageerrors.push(String(error&&error.message||error)));
  page.on("console",message=>{if(message.type()==="error"&&!/Failed to load resource.*404/.test(message.text()))result.realErrors.push(message.text());});
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
  await sleep(350);

  await step("API / MANIFEST: module 116 is sole enrolled state owner",async()=>{
    const manifest=JSON.parse(readFileSync(join(ROOT,"src/00-manifest.json"),"utf8"));
    const modules=manifest.modules;
    need(Array.isArray(modules)&&modules.length===112,"manifest must contain 112 modules");
    need(modules[modules.length-1]==="116-conquest-state.js","module 116 is not last");
    return page.evaluate(()=>{
      if(typeof conquestCampaignFoundation!=="function"||typeof conquestCampaignFoundationView!=="function")throw new Error("detached state API missing");
      return {modules:112,last:"116-conquest-state.js",globals:["conquestCampaignFoundation","conquestCampaignFoundationView"]};
    });
  });

  await step("STRICT FACTORY INPUT: exact plain/null data only and never invoke accessors",()=>page.evaluate(()=>{
    const factory=conquestCampaignFoundation;
    const nullRules=Object.assign(Object.create(null),{id:"mayhem",version:1});
    const nullInput=Object.assign(Object.create(null),{side:"CS",ruleset:nullRules});
    if(!factory({side:"US",ruleset:{id:"historical",version:1}})||!factory(nullInput))throw new Error("ordinary or null-prototype valid input rejected");
    let calls=0;
    const accessor={ruleset:{id:"historical",version:1}};
    Object.defineProperty(accessor,"side",{enumerable:true,get(){calls++;return "US";}});
    const nestedAccessor={side:"US",ruleset:{version:1}};
    Object.defineProperty(nestedAccessor.ruleset,"id",{enumerable:true,get(){calls++;return "historical";}});
    const inherited=Object.create({side:"US"});inherited.ruleset={id:"historical",version:1};
    const custom=Object.assign(Object.create({authority:true}),{side:"US",ruleset:{id:"historical",version:1}});
    const hidden={side:"US",ruleset:{id:"historical",version:1}};Object.defineProperty(hidden,"hidden",{value:true});
    const symbolic={side:"US",ruleset:{id:"historical",version:1}};symbolic[Symbol("extra")]=true;
    const extra={side:"US",ruleset:{id:"historical",version:1},extra:true};
    const missing={side:"US"};
    const wrongSide={side:"UK",ruleset:{id:"historical",version:1}};
    const wrongRule={side:"US",ruleset:{id:"future",version:1}};
    const revoked=Proxy.revocable({side:"US",ruleset:{id:"historical",version:1}},{});revoked.revoke();
    for(const candidate of [null,undefined,[],inherited,custom,hidden,symbolic,accessor,nestedAccessor,extra,missing,wrongSide,wrongRule,revoked.proxy])if(factory(candidate)!==null)throw new Error("invalid factory input accepted");
    if(calls!==0)throw new Error("factory invoked accessor "+calls+" times");
    return {accepted:["Object.prototype","null"],rejected:14,accessorCalls:calls,revokedProxy:true};
  }));

  await step("EXACT ROOT: US and CS results have only the four lawful fields",()=>page.evaluate(()=>{
    for(const side of ["US","CS"]){
      const value=conquestCampaignFoundation({side,ruleset:{id:"historical",version:1}});
      if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).join(",")!=="side,campaignKind,ruleset,conquest")throw new Error("root shape drift for "+side);
      if(value.side!==side||Object.getOwnPropertyNames(value).sort().join(",")!=="campaignKind,conquest,ruleset,side"||Object.getOwnPropertySymbols(value).length)throw new Error("root own fields drift for "+side);
      for(const key of ["campaignKind","ruleset","conquest"]){const d=Object.getOwnPropertyDescriptor(value,key);if(!d||d.writable||d.configurable||!d.enumerable)throw new Error(key+" root descriptor drift");}
    }
    return {sides:["US","CS"],keys:["side","campaignKind","ruleset","conquest"]};
  }));

  await step("CAMPAIGN KIND: exact immutable conquest discriminator and descriptors",()=>page.evaluate(()=>{
    for(const side of ["US","CS"]){
      const value=conquestCampaignFoundation({side,ruleset:{id:"mayhem",version:1}}),kind=value.campaignKind,d=Object.getOwnPropertyDescriptor(value,"campaignKind");
      if(!kind||Object.getPrototypeOf(kind)!==Object.prototype||Object.keys(kind).join(",")!=="id,version"||kind.id!=="conquest"||kind.version!==1||!Object.isFrozen(kind))throw new Error("campaignKind values/freeze drift");
      if(!d||d.writable||d.configurable||!d.enumerable)throw new Error("campaignKind root descriptor drift");
      for(const key of ["id","version"]){const kd=Object.getOwnPropertyDescriptor(kind,key);if(!kd||kd.writable||kd.configurable||!kd.enumerable)throw new Error("campaignKind nested descriptor drift "+key);}
    }
    return {id:"conquest",version:1,frozen:true};
  }));

  await step("RULESET OWNER: disposable Mayhem carrier transfers only its immutable ruleset",()=>page.evaluate(()=>{
    const original=mayhemInit;let carrier=null;
    try{
      mayhemInit=function(target,id,phase){carrier=target;const out=original(target,id,phase);target.incidentalReceipt="must-not-transfer";target.incidentalSequence=7;return out;};
      const value=conquestCampaignFoundation({side:"US",ruleset:{id:"mayhem",version:1}});
      const source=Object.getOwnPropertyDescriptor(carrier,"ruleset"),final=Object.getOwnPropertyDescriptor(value,"ruleset");
      if(!carrier||carrier===value||!source||!final||final.value!==source.value||source.writable||source.configurable||!source.enumerable||!Object.isFrozen(source.value))throw new Error("Mayhem ruleset descriptor was not transferred exactly");
      if(Object.keys(value).join(",")!=="side,campaignKind,ruleset,conquest"||Object.prototype.hasOwnProperty.call(value,"incidentalReceipt")||Object.prototype.hasOwnProperty.call(value,"incidentalSequence"))throw new Error("carrier incidental fields leaked to final root");
      if(value.ruleset.id!=="mayhem"||value.ruleset.version!==1)throw new Error("Mayhem-owned ruleset values drifted");
      return {carrierDisposable:true,rulesetOwner:"mayhemInit",incidentalFinalFields:0};
    }finally{mayhemInit=original;}
  }));

  await step("NAMESPACE / VIEW: factory stays extendable; locked and JSON forms yield frozen snapshots",()=>page.evaluate(()=>{
    const factory=conquestCampaignFoundation({side:"US",ruleset:{id:"historical",version:1}});
    if(Object.getPrototypeOf(factory.conquest)!==Object.prototype||Object.keys(factory.conquest).length||Object.isFrozen(factory.conquest)||!Object.isExtensible(factory.conquest))throw new Error("factory namespace not exact empty extensible plain object");
    const round=JSON.parse(JSON.stringify(factory)),locked=conquestCampaignFoundationView(factory),ordinary=conquestCampaignFoundationView(round);
    const mixed=JSON.parse(JSON.stringify(factory));Object.defineProperty(mixed,"campaignKind",{value:mixed.campaignKind,writable:false,configurable:false,enumerable:true});
    let calls=0;const accessor=JSON.parse(JSON.stringify(factory));Object.defineProperty(accessor,"side",{enumerable:true,get(){calls++;return "US";}});
    const custom=JSON.parse(JSON.stringify(factory));Object.setPrototypeOf(custom,Object.create(null));
    const nullPrototype=JSON.parse(JSON.stringify(factory));Object.setPrototypeOf(nullPrototype,null);
    for(const invalid of [null,custom,nullPrototype,mixed,accessor])if(conquestCampaignFoundationView(invalid)!==null)throw new Error("invalid view form accepted");
    const frozenNamespaceFactory=conquestCampaignFoundation({side:"CS",ruleset:{id:"mayhem",version:1}});
    Object.freeze(frozenNamespaceFactory.conquest);
    const frozenBefore=JSON.stringify(frozenNamespaceFactory);
    if(conquestCampaignFoundationView(frozenNamespaceFactory)!==null)throw new Error("locked factory with frozen conquest namespace accepted");
    if(JSON.stringify(frozenNamespaceFactory)!==frozenBefore)throw new Error("frozen namespace rejection mutated factory candidate");
    const sealedRootFactory=conquestCampaignFoundation({side:"US",ruleset:{id:"historical",version:1}});
    Object.preventExtensions(sealedRootFactory);
    const sealedRootBefore=JSON.stringify(sealedRootFactory);
    if(conquestCampaignFoundationView(sealedRootFactory)!==null)throw new Error("non-extensible locked factory root accepted");
    if(JSON.stringify(sealedRootFactory)!==sealedRootBefore)throw new Error("non-extensible root rejection mutated factory candidate");
    const looseKind={id:"conquest",version:1},looseRuleset={id:"historical",version:1},looseFactory={side:"CS"};
    for(const [key,value] of [["campaignKind",looseKind],["ruleset",looseRuleset],["conquest",{}]])Object.defineProperty(looseFactory,key,{value,enumerable:true,writable:false,configurable:false});
    const looseBefore=JSON.stringify(looseFactory);
    if(conquestCampaignFoundationView(looseFactory)!==null)throw new Error("factory root with extensible nested identities accepted");
    if(JSON.stringify(looseFactory)!==looseBefore)throw new Error("loose nested identity rejection mutated candidate");
    if(calls!==0)throw new Error("view invoked accessor "+calls+" times");
    for(const snapshot of [locked,ordinary]){
      if(!snapshot||Object.keys(snapshot).join(",")!=="side,campaignKind,ruleset,conquest"||!Object.isFrozen(snapshot)||!Object.isFrozen(snapshot.campaignKind)||!Object.isFrozen(snapshot.ruleset)||!Object.isFrozen(snapshot.conquest)||Object.keys(snapshot.conquest).length)throw new Error("view snapshot not deeply frozen exact shape");
      for(const key of ["campaignKind","ruleset","conquest"]){const d=Object.getOwnPropertyDescriptor(snapshot,key);if(!d||d.writable||d.configurable||!d.enumerable)throw new Error("view root descriptor drift "+key);}
    }
    return {factoryNamespace:{empty:true,extensible:true},viewForms:["locked","json"],frozen:true,frozenNamespaceRejected:true,sealedRootRejected:true,looseNestedIdentityRejected:true,accessorCalls:calls};
  }));

  await step("REJECTION / NO MUTATION: legacy, malformed, mixed, and invalid discriminator fail closed",async()=>{
    const proof=await page.evaluate(()=>{
    const factory=conquestCampaignFoundation({side:"CS",ruleset:{id:"historical",version:1}}),base=JSON.parse(JSON.stringify(factory));
    const legacy={side:"CS",ruleset:{id:"historical",version:1},conquest:{}};
    const missing=JSON.parse(JSON.stringify(base));delete missing.conquest;
    const extra=JSON.parse(JSON.stringify(base));extra.control="US";
    const malformed=JSON.parse(JSON.stringify(base));malformed.ruleset.version=2;
    const mixed=JSON.parse(JSON.stringify(base));Object.defineProperty(mixed,"conquest",{value:{},writable:false,configurable:false,enumerable:true});
    const invalidDiscriminator=JSON.parse(JSON.stringify(base));invalidDiscriminator.campaignKind.version=2;
    const candidates=[legacy,missing,extra,malformed,mixed,invalidDiscriminator];
    for(const candidate of candidates){const before=JSON.stringify(candidate);const view=conquestCampaignFoundationView(candidate);if(view!==null)throw new Error(candidate===invalidDiscriminator?"invalid discriminator accepted":"malformed candidate accepted");if(JSON.stringify(candidate)!==before)throw new Error("rejection mutated candidate");}
    const revoked=Proxy.revocable(JSON.parse(JSON.stringify(base)),{});revoked.revoke();
    if(conquestCampaignFoundationView(revoked.proxy)!==null)throw new Error("revoked proxy view accepted");
    return {rejected:candidates.length+1,invalidDiscriminator:"version-2 rejected",mutations:0,revokedProxy:true};
    });
    const source=readFileSync(join(ROOT,"src/116-conquest-state.js"),"utf8");
    need((source.match(/candidateKind\.version !== 1/g)||[]).length===1,"Bind A discriminator guard is not unique");
    return proof;
  });

  await step("CONTROLLED SERIALIZATION: detached view carries alone and restores G/settings exactly",()=>page.evaluate(()=>{
    const originalJson=JSON.stringify(G),settingsDescriptor=Object.getOwnPropertyDescriptor(G,"settings"),campaignDescriptor=Object.getOwnPropertyDescriptor(G,"campaign"),fixtureSettings={probeSetting:"keep"},snapshot=conquestCampaignFoundationView(conquestCampaignFoundation({side:"CS",ruleset:{id:"mayhem",version:1}}));
    const restore=(key,descriptor)=>{if(descriptor)Object.defineProperty(G,key,descriptor);else delete G[key];};
    try{
      G.settings=fixtureSettings;G.campaign=snapshot;
      const save=serializeSave();
      if(Object.keys(save).sort().join(",")!=="campaign,settings,ver,when"||save.ver!==_SAVE_VER||save.settings!==fixtureSettings||save.campaign!==snapshot)throw new Error("serializeSave did not carry only fixture campaign/settings");
      if(Object.keys(save.campaign).join(",")!=="side,campaignKind,ruleset,conquest"||save.campaign.side!=="CS")throw new Error("serialized campaign shape drifted");
      return {campaignKeys:Object.keys(save.campaign),saveVersion:save.ver,liveApply:false};
    }finally{restore("settings",settingsDescriptor);restore("campaign",campaignDescriptor);if(JSON.stringify(G)!==originalJson)throw new Error("G restoration failed");}
  }));

  await step("PURITY: repeated factory/view calls leave G, storage, DOM, board, and transport unchanged",()=>page.evaluate(()=>{
    const storage=()=>{const out={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);out[key]=localStorage.getItem(key);}return out;};
    const snapshot=()=>({g:typeof G==="undefined"?"__absent__":JSON.stringify(G),storage:JSON.stringify(storage()),dom:document.body.innerHTML,board:typeof conquestBoardNormalized==="function"?JSON.stringify(conquestBoardNormalized()):"__absent__",transport:typeof conquestTransportPhysicalServices==="function"?JSON.stringify(conquestTransportPhysicalServices({id:"historical",version:1})):"__absent__"});
    const before=snapshot();
    for(let i=0;i<5;i++){const value=conquestCampaignFoundation({side:i%2?"CS":"US",ruleset:{id:i%2?"mayhem":"historical",version:1}}),view=conquestCampaignFoundationView(value);if(!value||!view)throw new Error("valid repeated call failed");}
    if(JSON.stringify(snapshot())!==JSON.stringify(before))throw new Error("detached foundation changed an external authority");
    return {factoryCalls:5,viewCalls:5,writes:0};
  }));

  await step("NO OPERATIONAL SURFACE: outputs, actions, and UI expose no conquest gameplay authority",()=>page.evaluate(()=>{
    const value=conquestCampaignFoundation({side:"US",ruleset:{id:"historical",version:1}}),view=conquestCampaignFoundationView(value);
    const barred=["control","services","army","armies","date","turn","order","movement","topology","adjacency","nodeOperation","serviceCondition","capacity","cut","repair","economy","ai","battle","chronicle","career","slots","bookmarks","undo","ironman","import","migration","runId","applySave"];
    const walk=(node,path)=>{if(!node||typeof node!=="object")return;for(const key of Object.keys(node)){if(barred.includes(key))throw new Error("barred operational field "+path+key);walk(node[key],path+key+".");}};
    walk(value,"");walk(view,"");
    const ui=document.body.innerText||"";
    if(/start conquest|continue conquest|conquest campaign|move by rail|move by water|repair service|conquest save/i.test(ui))throw new Error("operational conquest UI trace");
    const source=String(conquestCampaignFoundation)+"\n"+String(conquestCampaignFoundationView);
    if(/(?:startCampaign|applySave|localStorage|document\.|G\.)/.test(source))throw new Error("factory/view reaches barred live authority");
    return {operationalFields:0,actions:0,uiTrace:0};
  }));

  if(result.pageerrors.length||result.realErrors.length){result.ok=false;result.errors.push("browser errors present");}
}catch(error){result.ok=false;result.errors.push("FATAL "+String(error&&error.stack||error));}
finally{
  if(browser)await browser.close().catch(()=>{});
  if(server)server.kill("SIGTERM");
  result.failed=result.steps.filter(step=>!step.ok).map(step=>step.name);
  result.summary={passed:result.steps.length-result.failed.length,total:result.steps.length};
  writeFileSync(ART,JSON.stringify(result,null,2)+"\n");
}

console.log(`probe-conquest-state: ${result.summary.passed}/${result.summary.total} steps ok; pageerrors=${result.pageerrors.length}; realErrors=${result.realErrors.length}`);
for(const failure of result.steps.filter(step=>!step.ok))console.error("FAIL",failure.name,"-",failure.err);
if(!result.ok||result.failed.length||result.pageerrors.length||result.realErrors.length)process.exit(1);
console.log("ALL OK");
