#!/usr/bin/env node
// D528 docs-only physical construction/existence-window audit for the exact rail candidate surface.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname=dirname(fileURLToPath(import.meta.url)),ROOT=resolve(__dirname,".."),OUT=join(__dirname,"shots"),ART=join(OUT,"probe-conquest-rail-window-research.json");
mkdirSync(OUT,{recursive:true});
const read=rel=>readFileSync(join(ROOT,rel),"utf8"),hash=text=>createHash("sha256").update(text).digest("hex");
const packet=read("docs/design/strategic-rail-conquest-research-packet.md"),transportText=read("data/conquest-transport-evidence.json"),transport=JSON.parse(transportText);
const steps=[];function need(v,m){if(!v)throw new Error(m)}function count(t,x){return t.split(x).length-1}
function step(name,fn){try{const v=fn();steps.push({name,ok:true,v:v===undefined?null:v})}catch(e){steps.push({name,ok:false,err:String(e&&e.message||e)})}}
const ids=(p,n)=>Array.from({length:n},(_,i)=>p+String(i+1).padStart(2,"0"));
function between(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a+start.length);need(a>=0&&b>a,"missing ordered section markers: "+start+" / "+end);return text.slice(a,b)}
function tableRows(text,prefix){return text.split(/\r?\n/).filter(line=>line.startsWith("| "+prefix)).map(line=>line.slice(1,-1).split("|").map(cell=>cell.trim()))}

const audit=between(packet,"<!-- D528 RAIL WINDOW AUDIT:BEGIN -->","<!-- D528 RAIL WINDOW AUDIT:END -->");
const railRows=tableRows(audit,"CTS-R-"),ctiRows=tableRows(audit,"CTI-");
const sourceRows=tableRows(packet,"SR-"),sourceMap=new Map(sourceRows.map(row=>[row[0],row]));
const edgeRows=tableRows(packet,"RE-"),edgeMap=new Map(edgeRows.map(row=>[row[0],row]));
const claimRe=/\[familyKey=([^;\]]+);sr=(SR-\d{2});role=(presence|end_or_continuance|continuity|nonphysical_context);type=([^;\]]+);locator=([^;\]]+);precision=([^\]]+)\]/g;
function claims(cell){return Array.from(cell.matchAll(claimRe),match=>({raw:match[0],familyKey:match[1],sr:match[2],role:match[3],type:match[4],locator:match[5],precision:match[6]}))}
function rowById(rows,id){const row=rows.find(candidate=>candidate[0]===id);need(row,id+" audit row missing");return row}
const familyPolicy=new Map([
  ["nps-harpers-ferry-civil-war-chronology",{sr:"SR-11",types:new Set(["official_direct_physical_account","federal_institutional_history"])}],
  ["nara-pfeiffer-usmrr-2011",{sr:"SR-04",types:new Set(["federal_archival_synthesis"])}],
  ["loc-brady-oanda-destroyed-track-photo",{sr:"SR-13",types:new Set(["primary_photograph_catalog"])}],
  ["nps-petersburg-railroads-2024",{sr:"SR-05",types:new Set(["official_direct_physical_account","federal_institutional_history"])}],
  ["nps-appomattox-campaign",{sr:"SR-06",types:new Set(["federal_institutional_history"])}],
  ["nps-stones-rails-plenty",{sr:"SR-28",types:new Set(["federal_institutional_history"])}],
  ["nps-stones-railroad",{sr:"SR-27",types:new Set(["official_direct_physical_account"])}],
  ["nps-chattanooga-train-town",{sr:"SR-08",types:new Set(["official_direct_physical_account","federal_institutional_history"])}],
  ["nps-atlanta-nrhp-66000063",{sr:"SR-09",types:new Set(["federal_historic_resource_study"])}],
  ["nps-ocmulgee-old-fields-ea-2014",{sr:"SR-32",types:new Set(["federal_historic_resource_study"])}],
  ["nps-industry-economy",{sr:"SR-23",types:new Set(["federal_institutional_history"])}],
  ["nps-nrhp-valley-west-point-1999",{sr:"SR-33",types:new Set(["federal_state_historic_context"])}],
  ["nps-corinth-crossroads",{sr:"SR-07",types:new Set(["official_direct_physical_account","federal_institutional_history"])}],
  ["nps-vicksburg-inland",{sr:"SR-29",types:new Set(["federal_institutional_history"])}],
  ["nps-vicksburg-jackson",{sr:"SR-30",types:new Set(["official_direct_physical_account"])}],
  ["nps-meridian-ms012",{sr:"SR-31",types:new Set(["official_direct_physical_account"])}],
  ["tsha-civil-war",{sr:"SR-15",types:new Set(["state_institutional_history"])}],
  ["tsha-texas-new-orleans",{sr:"SR-17",types:new Set(["state_institutional_scholarship"])}]
]);
const physicalObservationTypes=new Set(["official_direct_physical_account","federal_historic_resource_study","federal_state_historic_context","state_institutional_scholarship","primary_wartime_cartography","primary_photograph_catalog"]);
const directPhysicalTypes=new Set(["official_direct_physical_account","primary_company_record","primary_engineering_record","primary_property_record","primary_inspection_record","official_construction_account","official_engineering_account","official_property_account","official_inspection_account","official_company_account"]);

step("AUDIT SINGULAR + SOURCE APPEND",()=>{
  need(count(packet,"## 20. D528 rail physical construction/existence-window audit")===1,"D528 normative audit heading must be singular");
  need(count(packet,"<!-- D528 RAIL WINDOW AUDIT:BEGIN -->")===1&&count(packet,"<!-- D528 RAIL WINDOW AUDIT:END -->")===1,"D528 audit markers must be singular");
  need(audit.includes("docs/research only · zero runtime/data authority"),"docs/research-only status missing");
  need(audit.includes("READY_FOR_CONQUEST_LAW")&&audit.includes("D497 topology/category-input readiness"),"historic D497 verdict limit missing");
  need(audit.includes("All cited claim locators below were manually accessed and read back."),"manual source readback declaration missing");
  const appended=sourceRows.filter(row=>/^SR-(?:2[7-9]|3[0-3])$/.test(row[0]));
  need(JSON.stringify(appended.map(row=>row[0]))===JSON.stringify(ids("SR-",33).slice(26)),"D528 source append must be exact contiguous SR-27..SR-33");
  need(appended.every(row=>row.length===8&&/^https:\/\//.test(row[5])&&/manually/i.test(row[6])),"D528 source row lacks URL/manual-readback record");
  const appendedText=packet.split(/\r?\n/).filter(line=>/^\| SR-(?:2[7-9]|3[0-3]) \|/.test(line)).join("\n")+"\n";
  need(Buffer.byteLength(appendedText)===3374&&hash(appendedText)==="792b26c96f21b06a0078cf21d55d457f1a2c202326dd4a736067834cdd0f41f4","D528 source-register rows or exact readback gloss moved");
  const usedSources=new Set([...railRows,...ctiRows].flatMap(row=>claims(row.slice(3,7).join(" ")).map(claim=>claim.sr)));
  need(appended.every(row=>usedSources.has(row[0])),"appended source is not genuinely used by a D528 claim");
  return {audit:1,railRows:railRows.length,ctiRows:ctiRows.length,newSources:appended.length};
});

step("PRESERVATION BASELINES",()=>{
  const node=between(packet,"## 7. Candidate-node register","## 8. Candidate-edge register");
  const edge=between(packet,"## 8. Candidate-edge register","## 9. Cut, repair, reroute, and concentration case studies");
  const cases=between(packet,"## 9. Cut, repair, reroute, and concentration case studies","## 10. Opening-, mid-, and late-war change summary");
  const originalSources=packet.slice(packet.indexOf("| SR-01 "),packet.indexOf("| SR-27 "));
  need(Buffer.byteLength(node)===9188&&hash(node)==="9287f673221fd6aef8ac58104b40f25b750a5b1b1c4dcaa89f61acf47f02ae08","candidate-node table moved");
  need(Buffer.byteLength(edge)===11323&&hash(edge)==="a44c386f47b357ec14340151d69f0c41c1f7fc5efbff1b6fa9eae27453744ffb","candidate-edge table moved");
  need(Buffer.byteLength(cases)===3360&&hash(cases)==="37f555edb9343edd197d352a744f992c1544db36d414c0af46b1f0d8aa52a26d","case-study table moved");
  need(Buffer.byteLength(originalSources)===9505&&hash(originalSources)==="19650bb16dd653eb715107f5a1f1c5b53cea704ae1da468febeaa3fbb189577c","existing SR-01..SR-26 register moved");
  need(hash(transportText)==="7e484de1c1c59abc698b4cdfe3e599dd8e8c97207e611542eb965d54c38c90f6","transport evidence JSON moved");
  return {nodes:9188,edges:11323,cases:3360,originalSources:9505,transportHash:hash(transportText)};
});

step("SERVICE ORDER + EXACT MAPPING + dateText",()=>{
  need(railRows.every(row=>row.length===8),"rail audit row width moved");
  need(JSON.stringify(railRows.map(row=>row[0]))===JSON.stringify(ids("CTS-R-",27)),"rail audit order/IDs moved");
  need(edgeRows.length===29,"candidate edge register count moved");
  need(transport.railServices.length===27,"transport rail-service count moved");
  for(let i=0;i<27;i++){
    const service=transport.railServices[i],expectedId="CTS-R-"+String(i+1).padStart(2,"0"),expectedEdge="RE-"+String(i+1).padStart(2,"0"),edge=edgeMap.get(expectedEdge),row=railRows[i];
    need(service.id===expectedId&&service.evidenceRowIds.length===1&&service.evidenceRowIds[0]===expectedEdge,expectedId+" service/evidence mapping moved");
    need(edge&&edge.length===10,expectedEdge+" candidate row missing or malformed");
    need(JSON.stringify(service.endpointAnchorIds)===JSON.stringify(edge[1].split("—")),expectedId+" endpoint mapping moved");
    need(service.historicalEligibility.dateText===edge[3],expectedId+" dateText no longer byte-verbatim from candidate row");
    need(row[1]===expectedEdge+" · "+edge[2]+" · "+edge[1],expectedId+" audit mapping moved");
  }
  return {services:27,dateTexts:27,mappings:27};
});

step("CLAIM METADATA / SOURCE RESOLUTION / ROLE SEPARATION",()=>{
  const roles=["presence","end_or_continuance","continuity","nonphysical_context"],familySource=new Map(),sourceFamily=new Map(),seenFamilies=new Set();let total=0;
  for(const row of [...railRows,...ctiRows]){
    need(row.length===8,row[0]+" audit row width moved");
    for(let i=3;i<=6;i++){
      const cellClaims=claims(row[i]),role=roles[i-3];
      if(!cellClaims.length){need(row[i].startsWith("NONE"),row[0]+" "+role+" lacks a claim token or explicit NONE");continue}
      const residue=cellClaims.reduce((text,claim)=>text.replace(claim.raw,""),row[i]).replaceAll("<br>","").trim();
      need(!residue,row[0]+" "+role+" contains evidence outside exact claim tokens");
      for(const claim of cellClaims){
        total++;
        need(claim.role===role,row[0]+" claim role is in the wrong column");
        need(sourceMap.has(claim.sr),row[0]+" unresolved source "+claim.sr);
        need(claim.familyKey.trim()===claim.familyKey&&claim.type.trim()===claim.type&&claim.locator.trim()===claim.locator&&claim.precision.trim()===claim.precision,row[0]+" claim field has boundary whitespace");
        need(!/[<>]/.test(claim.familyKey+claim.sr+claim.role+claim.type+claim.locator+claim.precision),row[0]+" claim contains forbidden markup");
        const policy=familyPolicy.get(claim.familyKey);need(policy&&policy.sr===claim.sr&&policy.types.has(claim.type),row[0]+" claim violates canonical family/source/type resolution: "+claim.familyKey);
        if(familySource.has(claim.familyKey))need(familySource.get(claim.familyKey)===claim.sr,"familyKey resolves to multiple source rows: "+claim.familyKey);else familySource.set(claim.familyKey,claim.sr);
        if(sourceFamily.has(claim.sr))need(sourceFamily.get(claim.sr)===claim.familyKey,"one underlying work was split into multiple familyKeys: "+claim.sr);else sourceFamily.set(claim.sr,claim.familyKey);
        seenFamilies.add(claim.familyKey);
        if(role!=="nonphysical_context"){
          need(physicalObservationTypes.has(claim.type),row[0]+" nonphysical source type used as a physical observation: "+claim.type);
          need(!/\b(troops?|military use|control|capture|service|operation|suppl(?:y|ied)|abandon(?:ed|ment))\b/i.test(claim.precision),row[0]+" military/operational evidence used as a physical bound");
          need(/\b(complet|construct|built|bridge|track|railroad|railway|line|rails?|remov|destroy|rebuild|inspection|physical|terminus|cross|approach|reach|met|open)/i.test(claim.precision),row[0]+" physical claim lacks a bounded physical observation");
        }
      }
    }
  }
  const rawTokens=count([...railRows,...ctiRows].map(row=>row.join(" | ")).join("\n"),"[familyKey=");
  need(total===rawTokens,"malformed or unparsed claim token exists");
  need(seenFamilies.size===familyPolicy.size&&Array.from(familyPolicy.keys()).every(key=>seenFamilies.has(key)),"canonical cited family set moved");
  const claimSurface=[...railRows,...ctiRows].map(row=>[row[0],row[1],...row.slice(3,7)].join("\u001f")).join("\n")+"\n";
  need(Buffer.byteLength(claimSurface)===19788&&hash(claimSurface)==="8f017adbd621a818c74001f82db2f70d22387daa1a47b452ce49af1307befdbc","ordered claim locators, roles, or bounded precision moved");
  return {claims:total,families:familySource.size,resolvedSources:new Set(Array.from(familySource.values())).size};
});

step("DISPOSITION / POSITIVE FLOOR / CONTINUITY",()=>{
  const allowed=new Set(["PHYSICAL_WINDOW_ESTABLISHED","PHYSICAL_PRESENCE_SNAPSHOTS_ONLY","PHYSICAL_EXISTENCE_UNRESOLVED","PHYSICAL_EXISTENCE_DISPUTED"]),counts=Object.fromEntries(Array.from(allowed,key=>[key,0]));
  for(const row of railRows){
    const disposition=(/`([^`]+)`/.exec(row[2])||[])[1];need(allowed.has(disposition),row[0]+" disposition invalid");
    const presence=claims(row[3]).filter(claim=>!/tertiary/i.test(claim.type)),ending=claims(row[4]).filter(claim=>!/tertiary/i.test(claim.type)),continuity=claims(row[5]).filter(claim=>!/tertiary/i.test(claim.type));
    const keys=list=>new Set(list.map(claim=>claim.familyKey)),presenceKeys=keys(presence),endKeys=keys(ending),continuityKeys=keys(continuity);
    const directFamily=Array.from(presenceKeys).some(key=>continuityKeys.has(key)&&presence.some(claim=>claim.familyKey===key&&directPhysicalTypes.has(claim.type))&&continuity.some(claim=>claim.familyKey===key&&directPhysicalTypes.has(claim.type)));
    const completeFloor=presenceKeys.size>=2&&endKeys.size>=2&&continuityKeys.size>=2&&directFamily;
    const conflictClaim=ending.some(claim=>claim.familyKey==="tsha-texas-new-orleans"&&claim.sr==="SR-17"&&/removal claims conflict with a cited 1870 inspection/i.test(claim.precision));
    const materialConflict=row[0]==="CTS-R-27"&&conflictClaim&&/material conflict/i.test(row[7]);
    need(/material conflict/i.test(row[7])===materialConflict,row[0]+" material-conflict prose is not tied to the exact SR-17 removal/inspection claim");
    const physicalObservations=presence.length+ending.length+continuity.length;
    const expected=materialConflict?"PHYSICAL_EXISTENCE_DISPUTED":completeFloor?"PHYSICAL_WINDOW_ESTABLISHED":physicalObservations?"PHYSICAL_PRESENCE_SNAPSHOTS_ONLY":"PHYSICAL_EXISTENCE_UNRESOLVED";
    need(disposition===expected,row[0]+" disposition violates deterministic floor: expected "+expected+", got "+disposition);
    counts[disposition]++;
  }
  need(counts.PHYSICAL_WINDOW_ESTABLISHED===0&&counts.PHYSICAL_PRESENCE_SNAPSHOTS_ONLY===19&&counts.PHYSICAL_EXISTENCE_UNRESOLVED===7&&counts.PHYSICAL_EXISTENCE_DISPUTED===1,"D528 disposition totals moved");
  for(const token of ["0 PHYSICAL_WINDOW_ESTABLISHED","19 PHYSICAL_PRESENCE_SNAPSHOTS_ONLY","7 PHYSICAL_EXISTENCE_UNRESOLVED","1 PHYSICAL_EXISTENCE_DISPUTED","`CTS-R-02`, `CTS-R-03`, `CTS-R-04`, `CTS-R-10`, `CTS-R-11`, `CTS-R-25`, and `CTS-R-26`","`CTS-R-27` is the sole disputed row","Two snapshots never prove continuity."])
    need(audit.includes(token),"D528 result/floor summary missing: "+token);
  return {established:0,snapshotOnly:19,unresolved:7,disputed:1};
});

step("CTI RAIL FACES + HANDLING LIMIT",()=>{
  const exact={"CTI-01":"Rail face RE-06 · RN-08—WN-22","CTI-02":"Rail face RE-22 · RN-24—WN-12","CTI-03":"Rail face RE-11 · RN-12—WN-03","CTI-04":"Rail faces RE-11 plus RE-12 · RN-13—WN-04"};
  const admitted={"CTI-01":new Set(["nps-petersburg-railroads-2024"]),"CTI-02":new Set(["nps-vicksburg-inland"]),"CTI-03":new Set(["nps-stones-rails-plenty"]),"CTI-04":new Set(["nps-stones-railroad","nps-stones-rails-plenty"])};
  need(JSON.stringify(ctiRows.map(row=>row[0]))===JSON.stringify(ids("CTI-",4)),"CTI audit order/IDs moved");
  for(const row of ctiRows){
    need(row[1]===exact[row[0]],row[0]+" rail-face mapping moved");
    need(row[2]==="`RAIL_FACE_EVIDENCE_ONLY` / `INTERCHANGE_WINDOW_UNADJUDICATED`",row[0]+" handling limit moved");
    const rowClaims=claims(row.slice(3,7).join(" "));
    need(rowClaims.length>0&&rowClaims.every(claim=>admitted[row[0]].has(claim.familyKey)),row[0]+" imports a source outside its admitted rail face");
    need(claims(row[4]).length===0&&claims(row[5]).length===0,row[0]+" improperly claims a handling end or continuity");
  }
  need(audit.includes("no `SW-*`, landing, or service date establishes CTI-01")&&audit.includes("no `SW-*`, river event, or service date establishes CTI-02"),"CTI water/service negative moved");
  return {railFaces:4,fullInterchangesAdjudicated:0};
});

step("NAMED NEGATIVES",()=>{
  const finding=id=>rowById(railRows,id)[7];
  need(/no Strasburg-Harpers Ferry rail edge exists/i.test(finding("CTS-R-04")),"RE-04 exact non-link negative moved");
  need(/August 1861 direct connection proves neither an earlier seamless transfer nor.*later physical end/i.test(finding("CTS-R-05")),"RE-05 connection negative moved");
  need(/Rebuilding is not proof of original construction continuity.*CTI-01/i.test(finding("CTS-R-06")),"RE-06 rebuild/interchange negative moved");
  need(/Degradation, seizure, or a wagon bypass is not physical absence/i.test(finding("CTS-R-07")),"RE-07 degradation negative moved");
  need(/RE-17 and RE-18 remain separate.*cannot create through service/i.test(finding("CTS-R-17")),"RE-17 through-service negative moved");
  need(/RE-17 plus RE-18 do not become through service/i.test(finding("CTS-R-18")),"RE-18 through-service negative moved");
  need(/no uninterrupted New Orleans-Jackson through chain/i.test(finding("CTS-R-25")),"RE-25 continuity negative moved");
  need(/Material conflict takes precedence.*Removal remains disputed.*no Louisiana through rail/is.test(finding("CTS-R-27")),"RE-27 dispute/non-link negative moved");
  need(/CTS-S-02` \/ `WE-26` Cape Fear control\/operation parser counterexample remains binding/.test(audit),"Cape Fear parser counterexample moved");
  return {namedNegatives:9};
});

step("NO PROHIBITED AUTHORITY",()=>{
  for(const token of ["currentTurn","defaultTurn","nextTurn","legalNow","availabilityWindow","movementPoints","serviceCondition","controlState","routeEdges","receiptSchema","historicalOpen"])
    need(!audit.includes(token),"prohibited authority token entered audit: "+token);
  need(audit.includes("No row above is a runtime/data enum or an authorization to derive a campaign turn, current/default date, service availability, control, condition, route, receipt, or movement."),"explicit no-authority terminal missing");
  return {runtimeFields:0,dataEnums:0,legalWindows:0};
});

step("D526 ARCHIVE",()=>{
  const legacy=read("legacy/HANDOFF-ARCHIVE.md"),begin="<!-- D528 SUPERSEDED HANDOFF HEAD D526 (BYTE-VERBATIM):BEGIN -->",end="<!-- D528 SUPERSEDED HANDOFF HEAD D526 (BYTE-VERBATIM):END -->";
  need(count(legacy,begin)===1&&count(legacy,end)===1,"D526 archive markers missing or duplicated");
  const archived=legacy.slice(legacy.indexOf(begin)+begin.length+1,legacy.indexOf(end));
  need(Buffer.byteLength(archived)===4723,"D526 archived block byte length moved");
  need(hash(archived)==="c156b0bbfbbddd6448a36a9fcedff3621def8819f13e4d18886a7a0a3391c044","D526 archived block hash moved");
  return {bytes:4723,sha256:hash(archived)};
});

step("D528 TERMINAL ROUTING",()=>{
  const handoff=read("HANDOFF.md"),laneText=read("COORDINATION.md"),law=read("docs/design/unlocked-but-judged-design.md"),decisions=read("DECISIONS.md"),log=read("RUN-LOG.md"),checklist=read("V1-CHECKLIST.md");
  const lane=(/### LANE-019 · conquest-design-law[\s\S]*?(?=\n### LANE-\d+ ·|\n## 6 ·|$)/.exec(laneText)||[])[0]||"";
  need(/### LANE-019 · conquest-design-law — \*\*CONTRACT \(D528 RAIL RESEARCH COMPLETE; UNOWNED\)\*\*/.test(lane),"LANE-019 D528 terminal heading moved");
  need(/- \*\*Owning tool:\*\* none\./.test(lane)&&/- \*\*State:\*\* CONTRACT\/unowned\./.test(lane),"LANE-019 must release CONTRACT/unowned");
  for(const token of ["D528 delivery record — rail physical-window research:","0 PHYSICAL_WINDOW_ESTABLISHED","19 PHYSICAL_PRESENCE_SNAPSHOTS_ONLY","7 PHYSICAL_EXISTENCE_UNRESOLVED","1 PHYSICAL_EXISTENCE_DISPUTED","all four rail faces remain `INTERCHANGE_WINDOW_UNADJUDICATED`","D525 remains the product head","D528 research proof:"])
    need(lane.includes(token),"LANE-019 D528 delivery evidence missing: "+token);
  need(count(handoff,"**⚡ AMENDMENT")===2&&handoff.includes("D528: THE 27-ROW RAIL PHYSICAL-WINDOW AUDIT CLOSES")&&handoff.includes("D527: LANE-019 TAKES DOCS/RESEARCH DRIVE")&&!handoff.includes("D526: QUALITATIVE TRANSPORT DATES"),"HANDOFF must retain exact D528+D527 live heads");
  need(decisions.includes("## D528 — RAIL_PHYSICAL_WINDOW_AUDIT_ZERO_POSITIVE:")&&log.includes("D528: RAIL PHYSICAL-WINDOW AUDIT CLOSES ZERO-POSITIVE"),"D528 decision/run record missing");
  need(law.includes("### 8.32 D528 rail physical-window research result")&&checklist.includes("D528 closes the exact 27-row rail audit"),"D528 Package A/checklist terminal missing");
  for(const rel of ["HANDOFF.md","START-HERE.md","WAKE-UP.md","AUTONOMOUS-RUN.md","V1-CHECKLIST.md","RUN-LOG.md"]){const text=read(rel);need(text.includes("<!-- LIVE-HEAD decision=D528 next-lane=LANE-019 state=CONTRACT owner=none -->"),rel+" live summary not at D528 terminal")}
  need(!/D528[^\n]*lane-level `SHIPPED` claim/i.test(lane),"D528 improperly claims lane-level SHIPPED");
  return {decision:"D528",lane:"LANE-019",state:"CONTRACT",owner:"none",productHead:"D525"};
});

const failed=steps.filter(item=>!item.ok),result={ok:!failed.length,steps,failed:failed.map(item=>item.name),errors:[],pageerrors:[],realErrors:[],summary:{passed:steps.length-failed.length,total:steps.length}};
writeFileSync(ART,JSON.stringify(result,null,2)+"\n");
console.log(`probe-conquest-rail-window-research: ${result.summary.passed}/${result.summary.total} steps ok, ${failed.length} fail`);
if(failed.length){for(const item of failed)console.error("FAIL",item.name,"-",item.err);process.exit(1)}
console.log("ALL OK");
