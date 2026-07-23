#!/usr/bin/env node
// D530 docs-only physical-corridor/landing existence-window audit for the exact water/sea candidate surface.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname=dirname(fileURLToPath(import.meta.url)),ROOT=resolve(__dirname,".."),OUT=join(__dirname,"shots"),ART=join(OUT,"probe-conquest-water-window-research.json");
mkdirSync(OUT,{recursive:true});
const read=rel=>readFileSync(join(ROOT,rel),"utf8"),hash=text=>createHash("sha256").update(text).digest("hex");
const packet=read("docs/design/strategic-water-transport-research-packet.md"),transportText=read("data/conquest-transport-evidence.json"),transport=JSON.parse(transportText);
const steps=[];function need(v,m){if(!v)throw new Error(m)}function count(t,x){return t.split(x).length-1}
function step(name,fn){try{const v=fn();steps.push({name,ok:true,v:v===undefined?null:v})}catch(e){steps.push({name,ok:false,err:String(e&&e.message||e)})}}
const ids=(p,n)=>Array.from({length:n},(_,i)=>p+String(i+1).padStart(2,"0"));
function between(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a+start.length);need(a>=0&&b>a,"missing ordered section markers: "+start+" / "+end);return text.slice(a,b)}
function tableRows(text,prefix){return text.split(/\r?\n/).filter(line=>line.startsWith("| "+prefix)).map(line=>line.slice(1,-1).split("|").map(cell=>cell.trim()))}
function rowById(rows,id){const row=rows.find(candidate=>candidate[0]===id);need(row,id+" audit row missing");return row}

const audit=between(packet,"<!-- D530 WATER WINDOW AUDIT:BEGIN -->","<!-- D530 WATER WINDOW AUDIT:END -->");
const auditRows=audit.split(/\r?\n/).filter(line=>/^\| CTS-[WS]-/.test(line)).map(line=>line.slice(1,-1).split("|").map(cell=>cell.trim()));
const sourceRows=tableRows(packet,"SW-"),sourceMap=new Map(sourceRows.map(row=>[row[0],row]));
const edgeRows=tableRows(packet,"WE-"),edgeMap=new Map(edgeRows.map(row=>[row[0],row]));
const waterEvidence=["WE-01","WE-03","WE-04","WE-05","WE-06","WE-07","WE-08","WE-09","WE-10","WE-11","WE-12","WE-14","WE-17","WE-21","WE-22"];
const orderedServices=[...transport.waterServices,...transport.seaServices];
const orderedIds=[...ids("CTS-W-",15),...ids("CTS-S-",2)];
const orderedEvidence=[...waterEvidence,"WE-24","WE-26"];
const claimRe=/\[familyKey=([^;\]]+);sw=(SW-\d{2});role=(presence|end_or_continuance|continuity|nonphysical_context);type=([^;\]]+);locator=([^;\]]+);precision=([^\]]+)\]/g;
function claims(cell){return Array.from(cell.matchAll(claimRe),match=>({raw:match[0],familyKey:match[1],sw:match[2],role:match[3],type:match[4],locator:match[5],precision:match[6]}))}
const familyPolicy=new Map([
  ["nps-fort-henry-battle-detail",{sw:"SW-04",types:new Set(["official_direct_physical_account"])}],
  ["nps-fort-donelson-artery",{sw:"SW-05",types:new Set(["federal_institutional_history"])}],
  ["nps-vicksburg-battery-bruinsburg",{sw:"SW-08",types:new Set(["official_direct_physical_account"])}],
  ["nps-gulf-coast",{sw:"SW-09",types:new Set(["federal_institutional_history"])}],
  ["nps-arkansas-post-timeline",{sw:"SW-13",types:new Set(["official_direct_physical_account","federal_institutional_history"])}],
  ["usace-bailey-red-river",{sw:"SW-15",types:new Set(["official_engineering_account","federal_engineering_history"])}],
  ["nps-civil-war-era-national-cemeteries",{sw:"SW-20",types:new Set(["federal_historic_resource_study"])}],
  ["nps-roanoke-island",{sw:"SW-22",types:new Set(["official_direct_physical_account","federal_institutional_history"])}],
  ["nps-ambrose-burnside",{sw:"SW-24",types:new Set(["official_direct_physical_account"])}],
  ["army-cmh-petersburg-appomattox",{sw:"SW-29",types:new Set(["federal_professional_military_history"])}]
]);
const physicalObservationTypes=new Set(["official_direct_physical_account","official_engineering_account","federal_historic_resource_study","federal_professional_military_history"]);
const directPhysicalTypes=new Set(["official_direct_physical_account","official_engineering_account","primary_hydrographic_survey","primary_channel_survey","primary_property_record","primary_inspection_record"]);

step("AUDIT SINGULAR + SOURCE APPEND",()=>{
  need(count(packet,"## 21. D530 water/sea physical-corridor/landing existence-window audit")===1,"D530 normative audit heading must be singular");
  need(count(packet,"<!-- D530 WATER WINDOW AUDIT:BEGIN -->")===1&&count(packet,"<!-- D530 WATER WINDOW AUDIT:END -->")===1,"D530 audit markers must be singular");
  need(audit.includes("docs/research only · zero runtime/data authority"),"docs/research-only status missing");
  need(audit.includes("READY_FOR_CONQUEST_LAW")&&audit.includes("D499 topology/category-input readiness"),"historic D499 verdict limit missing");
  need(audit.includes("Every claim source and locator below was manually accessed and\nread back during D530."),"manual source readback declaration missing");
  const originalIds=sourceRows.slice(0,32).map(row=>row[0]),appended=sourceRows.slice(32);
  need(JSON.stringify(originalIds)===JSON.stringify(ids("SW-",32)),"original SW-01..SW-32 source order moved");
  need(appended.length===0&&audit.includes("No source was appended"),"D530 shipped source-append result moved");
  const usedSources=new Set(auditRows.flatMap(row=>claims(row.slice(3,7).join(" ")).map(claim=>claim.sw)));
  need(appended.every(row=>row.length===8&&/^https:\/\//.test(row[5])&&/manually/i.test(row[6])&&usedSources.has(row[0])),"appended source lacks durable URL, readback, or audit use");
  return {audit:1,rows:auditRows.length,originalSources:originalIds.length,newSources:appended.length};
});

step("PRESERVATION BASELINES",()=>{
  const originalSources=packet.slice(packet.indexOf("| SW-01 "),packet.indexOf("## 8. Candidate water-node register"));
  const nodes=between(packet,"## 8. Candidate water-node register","## 9. Candidate water-edge register");
  const edges=between(packet,"## 9. Candidate water-edge register","## 10. Chokepoint, closure, and reopening register");
  const chokepoints=between(packet,"## 10. Chokepoint, closure, and reopening register","## 11. Amphibious and riverine transfer-case register");
  const transfers=between(packet,"## 11. Amphibious and riverine transfer-case register","## 12. Opening-, mid-, and late-war evidence summary");
  need(Buffer.byteLength(originalSources)===14505&&hash(originalSources)==="4f4a16384661412cdb3c78a315f45db45c28a71abb8bdcb79943977d2aafee5a","existing SW-01..SW-32 register moved");
  need(Buffer.byteLength(nodes)===11112&&hash(nodes)==="e4026a9d094d06196b0b773ecfcaf1bbfa00bccab5367035b0b61d19e325da7e","candidate-node register moved");
  need(Buffer.byteLength(edges)===10881&&hash(edges)==="b91b57830980156e0546b3c8dda1fd58de88381fe9efb0131abec992019176c0","candidate-edge register moved");
  need(Buffer.byteLength(chokepoints)===4129&&hash(chokepoints)==="7e22fe4888dd1c36c8a7a7585d98f4e454cded40fdc6f7c201a1d6d4b5e840ba","chokepoint register moved");
  need(Buffer.byteLength(transfers)===4407&&hash(transfers)==="3e506193d489c51693c921a85e1fbc333a14dbe4bd20fd9e347670dff3243229","transfer-case register moved");
  need(hash(transportText)==="7e484de1c1c59abc698b4cdfe3e599dd8e8c97207e611542eb965d54c38c90f6","transport evidence JSON moved");
  return {originalSources:14505,nodes:11112,edges:10881,chokepoints:4129,transfers:4407,transportHash:hash(transportText)};
});

step("SERVICE ORDER + EXACT MAPPING + DIRECTION + dateText",()=>{
  need(auditRows.every(row=>row.length===8),"water/sea audit row width moved");
  need(JSON.stringify(auditRows.map(row=>row[0]))===JSON.stringify(orderedIds),"water/sea audit order or IDs moved");
  need(transport.waterServices.length===15&&transport.seaServices.length===2,"water/sea service count moved");
  need(JSON.stringify(orderedServices.map(service=>service.evidenceRowIds[0]))===JSON.stringify(orderedEvidence),"15+2 evidence mapping moved");
  for(let i=0;i<orderedServices.length;i++){
    const service=orderedServices[i],row=auditRows[i],edge=edgeMap.get(orderedEvidence[i]),expectedId=orderedIds[i];
    need(service.id===expectedId&&service.evidenceRowIds.length===1&&service.evidenceRowIds[0]===orderedEvidence[i],expectedId+" service/evidence mapping moved");
    need(edge&&edge.length===9,orderedEvidence[i]+" candidate edge missing or malformed");
    need(JSON.stringify(service.endpointAnchorIds)===JSON.stringify(edge[1].match(/WN-\d{2}/g)),expectedId+" endpoint mapping moved");
    need(service.historicalEligibility.dateText===edge[2],expectedId+" dateText no longer byte-verbatim from candidate edge");
    need(service.direction==="one-way",expectedId+" direction moved");
    need(service.mode===(i<15?"inland-water":"sea"),expectedId+" mode moved");
    need(row[1]===edge[0]+" · "+edge[3]+" · "+service.endpointAnchorIds.join("—")+" · "+service.mode+" · "+service.direction,expectedId+" exact audit mapping moved");
  }
  return {services:17,water:15,sea:2,dateTexts:17,directions:17};
});

step("CLAIM METADATA / SOURCE RESOLUTION / ROLE SEPARATION",()=>{
  const roles=["presence","end_or_continuance","continuity","nonphysical_context"],familySource=new Map(),sourceFamily=new Map(),seenFamilies=new Set();let total=0;
  for(const row of auditRows){
    for(let i=3;i<=6;i++){
      const cellClaims=claims(row[i]),role=roles[i-3];
      if(!cellClaims.length){need(row[i].startsWith("NONE"),row[0]+" "+role+" lacks a claim token or explicit NONE");continue}
      const residue=cellClaims.reduce((text,claim)=>text.replace(claim.raw,""),row[i]).replaceAll("<br>","").trim();
      need(!residue,row[0]+" "+role+" contains evidence outside exact claim tokens");
      for(const claim of cellClaims){
        total++;
        need(claim.role===role,row[0]+" claim role is in the wrong column");
        need(sourceMap.has(claim.sw),row[0]+" unresolved source "+claim.sw);
        need(claim.familyKey.trim()===claim.familyKey&&claim.type.trim()===claim.type&&claim.locator.trim()===claim.locator&&claim.precision.trim()===claim.precision,row[0]+" claim field has boundary whitespace");
        need(!/[<>|\[\]]/.test(claim.familyKey+claim.sw+claim.role+claim.type+claim.locator+claim.precision),row[0]+" claim contains forbidden markup");
        const policy=familyPolicy.get(claim.familyKey);need(policy&&policy.sw===claim.sw&&policy.types.has(claim.type),row[0]+" claim violates canonical family/source/type resolution: "+claim.familyKey);
        if(familySource.has(claim.familyKey))need(familySource.get(claim.familyKey)===claim.sw,"familyKey resolves to multiple source rows: "+claim.familyKey);else familySource.set(claim.familyKey,claim.sw);
        if(sourceFamily.has(claim.sw))need(sourceFamily.get(claim.sw)===claim.familyKey,"one underlying work was split into multiple familyKeys: "+claim.sw);else sourceFamily.set(claim.sw,claim.familyKey);
        seenFamilies.add(claim.familyKey);
        if(role!=="nonphysical_context")need(physicalObservationTypes.has(claim.type),row[0]+" nonphysical source type used for a physical role: "+claim.type);
      }
    }
  }
  const rawTokens=count(auditRows.map(row=>row.join(" | ")).join("\n"),"[familyKey=");
  need(total===19&&total===rawTokens,"claim count moved or malformed claim token exists");
  need(seenFamilies.size===familyPolicy.size&&Array.from(familyPolicy.keys()).every(key=>seenFamilies.has(key)),"canonical cited family set moved");
  const claimSurface=auditRows.map(row=>[row[0],row[1],...row.slice(3,7)].join("\u001f")).join("\n")+"\n";
  need(Buffer.byteLength(claimSurface)===10391&&hash(claimSurface)==="d735083d76e996c3bdca493b0aa20fc05965dd247e08e9be2b5ff5ad6b82966f","ordered claim locators, roles, or bounded precision moved");
  return {claims:total,families:familySource.size,resolvedSources:sourceFamily.size};
});

step("DISPOSITION / POSITIVE FLOOR / CONTINUITY",()=>{
  const allowed=new Set(["PHYSICAL_CORRIDOR_WINDOW_ESTABLISHED","PHYSICAL_CORRIDOR_PRESENCE_SNAPSHOTS_ONLY","PHYSICAL_CORRIDOR_EXISTENCE_UNRESOLVED","PHYSICAL_CORRIDOR_EXISTENCE_DISPUTED"]),counts=Object.fromEntries(Array.from(allowed,key=>[key,0]));
  for(const row of auditRows){
    const disposition=(/`([^`]+)`/.exec(row[2])||[])[1];need(allowed.has(disposition),row[0]+" disposition invalid");
    const presence=claims(row[3]).filter(claim=>!/tertiary/i.test(claim.type)),ending=claims(row[4]).filter(claim=>!/tertiary/i.test(claim.type)),continuity=claims(row[5]).filter(claim=>!/tertiary/i.test(claim.type));
    const keys=list=>new Set(list.map(claim=>claim.familyKey)),presenceKeys=keys(presence),endKeys=keys(ending),continuityKeys=keys(continuity);
    const directFamily=Array.from(presenceKeys).some(key=>continuityKeys.has(key)&&presence.some(claim=>claim.familyKey===key&&directPhysicalTypes.has(claim.type))&&continuity.some(claim=>claim.familyKey===key&&directPhysicalTypes.has(claim.type)));
    const completeFloor=presenceKeys.size>=2&&endKeys.size>=2&&continuityKeys.size>=2&&directFamily;
    const materialConflict=/material conflict/i.test(row[7]);
    const expected=materialConflict?"PHYSICAL_CORRIDOR_EXISTENCE_DISPUTED":completeFloor?"PHYSICAL_CORRIDOR_WINDOW_ESTABLISHED":presence.length+ending.length+continuity.length?"PHYSICAL_CORRIDOR_PRESENCE_SNAPSHOTS_ONLY":"PHYSICAL_CORRIDOR_EXISTENCE_UNRESOLVED";
    need(disposition===expected,row[0]+" disposition violates deterministic floor: expected "+expected+", got "+disposition);
    counts[disposition]++;
  }
  need(counts.PHYSICAL_CORRIDOR_WINDOW_ESTABLISHED===0&&counts.PHYSICAL_CORRIDOR_PRESENCE_SNAPSHOTS_ONLY===11&&counts.PHYSICAL_CORRIDOR_EXISTENCE_UNRESOLVED===6&&counts.PHYSICAL_CORRIDOR_EXISTENCE_DISPUTED===0,"D530 disposition totals moved");
  for(const token of ["0 PHYSICAL_CORRIDOR_WINDOW_ESTABLISHED","11\nPHYSICAL_CORRIDOR_PRESENCE_SNAPSHOTS_ONLY","6 PHYSICAL_CORRIDOR_EXISTENCE_UNRESOLVED","0\nPHYSICAL_CORRIDOR_EXISTENCE_DISPUTED","`CTS-W-02`, `CTS-W-03`,\n`CTS-W-04`, `CTS-W-05`, `CTS-W-07`, and `CTS-S-01`","Two passages or snapshots do not establish"])
    need(audit.includes(token),"D530 result/floor summary missing: "+token.replace(/\n/g," "));
  return {established:0,snapshotOnly:11,unresolved:6,disputed:0};
});

step("NAMED WATER/SEA NEGATIVES",()=>{
  const finding=id=>rowById(auditRows,id)[7];
  need(/control change and qualitative later supply use cannot become physical-corridor continuity/i.test(finding("CTS-W-02")),"WE-03 control/supply negative moved");
  need(/temporary Island No\. 10 canal, battery-running gunboat path, and troop ferry remain distinct/i.test(finding("CTS-W-04")),"WE-05 split-path negative moved");
  need(/whole Memphis-Vicksburg reach/i.test(finding("CTS-W-06"))&&/Fort passage, city surrender, occupation, and lower-river control remain distinct/i.test(finding("CTS-W-07")),"WE-07/WE-08 approach/control negatives moved");
  need(/opening date, or physical continuity/i.test(finding("CTS-W-08"))&&/surrender language cannot prove the Port Hudson-Vicksburg reach/i.test(finding("CTS-W-09")),"WE-09/WE-10 surrender/through-navigation negatives moved");
  need(/Low water.*neither permanent physical absence nor a calendar rule/i.test(finding("CTS-W-11"))&&/low water cannot become permanent absence or a fabricated seasonal calendar/i.test(finding("CTS-W-12")),"WE-12/WE-14 low-water negatives moved");
  need(/do not prove Harrison's Bar clearance, standing James River service/i.test(finding("CTS-W-13")),"WE-17 clearance/landing negative moved");
  need(/do not create a complete sounds graph/i.test(finding("CTS-W-14"))&&/cannot create a sounds network/i.test(finding("CTS-W-15")),"WE-21/WE-22 sounds-graph negatives moved");
  need(/remains one-way and bounded to January 1865/i.test(finding("CTS-S-01")),"WE-24 one-way/date negative moved");
  need(/Closed thereafter.*closure to blockade runners after Fort Fisher, not physical disappearance or generic Union transport closure/i.test(finding("CTS-S-02")),"WE-26 closure parser negative moved");
  return {namedNegatives:10};
});

step("CTI EXCLUSION",()=>{
  need(tableRows(audit,"CTI-").length===0,"CTI row entered the water/sea audit");
  for(const row of auditRows)need(!/CTI-|interchange|rail face|handling connection/i.test(row.join(" ")),row[0]+" imported an interchange or rail-face assertion");
  need(audit.includes("All four `CTI-01` through `CTI-04` rows remain exactly\n`INTERCHANGE_WINDOW_UNADJUDICATED`"),"all-four CTI quarantine missing");
  need(audit.includes("No passage, landing, co-location, rail face, service date, or\nhandling assertion above adjudicates an interchange."),"water/service piggyback negative missing");
  return {interchangesAdjudicated:0,quarantined:4};
});

step("NO PROHIBITED AUTHORITY",()=>{
  for(const token of ["currentTurn","defaultTurn","nextTurn","legalNow","availabilityWindow","movementPoints","serviceCondition","controlState","routeEdges","receiptSchema","historicalOpen"])
    need(!audit.includes(token),"prohibited authority token entered audit: "+token);
  need(audit.includes("No row above is a runtime/data enum or an authorization to derive a campaign turn, current/default\ndate, service availability, navigability, control, condition, capacity, lift, adjacency, topology,\nroute, receipt, or movement."),"explicit no-authority terminal missing");
  need(audit.includes("D525 remains the product head")&&audit.includes("D530 changes no product, data, source,\nruntime, state, save, manifest, build, suite, or generated output."),"product/no-change terminal missing");
  return {runtimeFields:0,dataEnums:0,legalWindows:0};
});

step("D528 ARCHIVE",()=>{
  const legacy=read("legacy/HANDOFF-ARCHIVE.md"),begin="<!-- D530 SUPERSEDED HANDOFF HEAD D528 (BYTE-VERBATIM):BEGIN -->",end="<!-- D530 SUPERSEDED HANDOFF HEAD D528 (BYTE-VERBATIM):END -->";
  need(count(legacy,begin)===1&&count(legacy,end)===1,"D528 archive markers missing or duplicated");
  const archived=legacy.slice(legacy.indexOf(begin)+begin.length+1,legacy.indexOf(end));
  need(Buffer.byteLength(archived)===5925,"D528 archived block byte length moved");
  need(hash(archived)==="c4c96e7ef7e468532040e34bdec1ab6432aec4cb5b9a958a2ca7ec0b7ce941a4","D528 archived block hash moved");
  return {bytes:5925,sha256:hash(archived)};
});

step("D530 TERMINAL ROUTING",()=>{
  const handoff=read("HANDOFF.md"),laneText=read("COORDINATION.md"),law=read("docs/design/unlocked-but-judged-design.md"),decisions=read("DECISIONS.md"),log=read("RUN-LOG.md"),checklist=read("V1-CHECKLIST.md"),wake=read("WAKE-UP.md"),start=read("START-HERE.md"),auto=read("AUTONOMOUS-RUN.md");
  const lane=(/### LANE-019 · conquest-design-law[\s\S]*?(?=\n### LANE-\d+ ·|\n## 6 ·|$)/.exec(laneText)||[])[0]||"";
  need(/### LANE-019 · conquest-design-law — \*\*CONTRACT \(D530 WATER\/SEA RESEARCH COMPLETE; UNOWNED\)\*\*/.test(lane),"LANE-019 D530 terminal heading moved");
  need(/- \*\*Owning tool:\*\* none\b/.test(lane)&&/- \*\*State:\*\* CONTRACT\b/.test(lane),"LANE-019 must be CONTRACT / none");
  for(const token of ["D530 delivery record — water/sea physical-corridor research:","0 PHYSICAL_CORRIDOR_WINDOW_ESTABLISHED","11 PHYSICAL_CORRIDOR_PRESENCE_SNAPSHOTS_ONLY","6 PHYSICAL_CORRIDOR_EXISTENCE_UNRESOLVED","0 PHYSICAL_CORRIDOR_EXISTENCE_DISPUTED","CTS-W-02","CTS-S-01","tools/probe-conquest-water-window-research.mjs","D525 remains the product head","D530 releases LANE-019 at `CONTRACT` / `none`"])need(lane.includes(token),"LANE-019 D530 delivery missing: "+token);
  need(!/^### LANE-019[^\n]*SHIPPED/m.test(lane),"LANE-019 must not claim SHIPPED");
  const lawResult=(/### 8\.34 D530 water\/sea physical-corridor research result[\s\S]*$/.exec(law)||[])[0]||"";
  need(lawResult&&lawResult.includes("11 PHYSICAL_CORRIDOR_PRESENCE_SNAPSHOTS_ONLY")&&lawResult.includes("D525 remains the product head"),"Package A D530 result missing");
  need(decisions.includes("## D530 — WATER_SEA_PHYSICAL_CORRIDOR_RESEARCH_COMPLETE:")&&decisions.includes("6 PHYSICAL_CORRIDOR_EXISTENCE_UNRESOLVED"),"D530 decision result missing");
  need(log.includes("D530 water/sea physical-corridor research complete")&&checklist.includes("D530 water/sea physical-corridor research complete"),"D530 run-log/checklist result missing");
  for(const text of [handoff,wake,start,auto])for(const token of ["LIVE-HEAD decision=D530","LANE-019","CONTRACT","D525 remains the product head"])need(text.includes(token),"D530 live routing token missing: "+token);
  need(handoff.includes("11 PHYSICAL_CORRIDOR_PRESENCE_SNAPSHOTS_ONLY")&&handoff.includes("6 PHYSICAL_CORRIDOR_EXISTENCE_UNRESOLVED"),"D530 HANDOFF result totals missing");
  return {state:"CONTRACT",owner:"none",currentDecision:"D530",researchRows:17,established:0,snapshotOnly:11,unresolved:6,disputed:0,productHead:"D525"};
});

const failed=steps.filter(item=>!item.ok),result={ok:!failed.length,steps,failed:failed.map(item=>item.name),errors:[],pageerrors:[],realErrors:[],summary:{passed:steps.length-failed.length,total:steps.length}};
writeFileSync(ART,JSON.stringify(result,null,2)+"\n");
console.log(`probe-conquest-water-window-research: ${result.summary.passed}/${result.summary.total} steps ok, ${failed.length} fail`);
if(failed.length){for(const item of failed)console.error("FAIL",item.name,"-",item.err);process.exit(1)}
console.log("ALL OK");
