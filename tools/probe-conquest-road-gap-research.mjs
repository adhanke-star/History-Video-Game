#!/usr/bin/env node
// D532 docs-only claim-specific road-gap audit. This guard is suite-excluded.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname=dirname(fileURLToPath(import.meta.url)),ROOT=resolve(__dirname,".."),OUT=join(__dirname,"shots"),ART=join(OUT,"probe-conquest-road-gap-research.json");
mkdirSync(OUT,{recursive:true});
const read=rel=>readFileSync(join(ROOT,rel),"utf8"),hash=text=>createHash("sha256").update(text).digest("hex");
const packet=read("docs/design/strategic-road-transport-research-packet.md"),steps=[];
function need(v,m){if(!v)throw new Error(m)}
function count(t,x){return t.split(x).length-1}
function step(name,fn){try{const v=fn();steps.push({name,ok:true,v:v===undefined?null:v})}catch(e){steps.push({name,ok:false,err:String(e&&e.message||e)})}}
function between(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a+start.length);need(a>=0&&b>a,"missing ordered section markers: "+start+" / "+end);return text.slice(a,b)}
function rowById(rows,id){const row=rows.find(row=>row.id===id);need(row,id+" audit row missing");return row}
function sourceSegments(row){
  const hits=Array.from(row.cells[2].matchAll(/`(RDS-\d{2})`/g));
  const segments=new Map();
  for(let i=0;i<hits.length;i++)segments.set(hits[i][1],row.cells[2].slice(hits[i].index,i+1<hits.length?hits[i+1].index:undefined));
  return segments;
}

const heading="## 13. D532 claim-specific road-gap audit (normative append)",audit=packet.slice(packet.indexOf(heading));
// The frozen D511 packet ended with one separator newline; the D532 heading begins after it.
const prefix=packet.slice(0,packet.indexOf(heading)-1);
const lineRows=audit.split(/\r?\n/).filter(line=>/^\| `RD-(?:E11|E15|E17|E18|SI06|SI13)` \|/.test(line));
const rows=lineRows.map(line=>{const cells=line.slice(1,-1).split("|").map(cell=>cell.trim());return{id:cells[0].replaceAll("`",""),cells,line}});
const ordered=["RD-E11","RD-E15","RD-E17","RD-E18","RD-SI06","RD-SI13"];
const rowSourceIds={
  "RD-E11":["RDS-54","RDS-63"],
  "RD-E15":["RDS-66","RDS-67","RDS-68"],
  "RD-E17":["RDS-47","RDS-61"],
  "RD-E18":["RDS-60","RDS-65","RDS-56"],
  "RD-SI06":["RDS-27","RDS-50","RDS-69"],
  "RD-SI13":["RDS-27","RDS-69","RDS-50"]
};
const sources=new Map([
  ["RDS-54",{family:"THC-Marshall-stage-marker",type:"state-marker source"}],
  ["RDS-63",{family:"OR-S1-V34",type:"primary official source"}],
  ["RDS-66",{family:"Boyer-diary-1862",type:"primary diary partial"}],
  ["RDS-67",{family:"Piston-Rutherford-Marmaduke-2022",type:"public-history interview partial"}],
  ["RDS-68",{family:"Monks-southern-Missouri-1907",type:"participant-history partial"}],
  ["RDS-47",{family:"Breck-columns-ch7",type:"primary officer correspondence"}],
  ["RDS-61",{family:"OR-S1-V12-pt3",type:"primary official source"}],
  ["RDS-60",{family:"Collins-Price-atlas",type:"federal professional-military history"}],
  ["RDS-65",{family:"Cooper-County-history-1876",type:"county history"}],
  ["RDS-27",{family:"Platter-diary",type:"primary diary"}],
  ["RDS-69",{family:"Chamberlin-81st-Ohio-1865",type:"contemporary compiled regimental history"}],
  ["RDS-50",{family:"OR-S1-V47",type:"primary official commander report"}]
]);
const appendedPolicies=new Map([
  ["RDS-66",["familyKey=Boyer-diary-1862","role=RD-E15 claim-specific partial","sourceType=primary soldier diary","locator PDF pp. 3-4","entries 17-23 February","manualReadback=YES:2026-07-22","Boyer_Fred_N_Diary_Transcription_508-2.pdf"]],
  ["RDS-67",["familyKey=Piston-Rutherford-Marmaduke-2022","role=RD-E15 corridor-formulation partial","sourceType=public-history interview transcript","locator PBS page transcript","lines 223-248, especially 245-248","linked closed-caption text line 18","manualReadback=YES:2026-07-22","pbs.org/video/the-civil-war-raid-of-general-john-s-marmaduke"]],
  ["RDS-68",["familyKey=Monks-southern-Missouri-1907","role=RD-E15 route-and-supply partial","sourceType=participant local history","locator printed pp. 153-155","manualReadback=YES:2026-07-22","gutenberg.org/files/51118"]],
  ["RDS-69",["familyKey=Chamberlin-81st-Ohio-1865","role=RD-SI06 and RD-SI13 claim-specific partial","sourceType=contemporary compiled regimental history","locator preface pp. 3-4","roster p. 171","narrative pp. 158-159 and 161-162","manualReadback=YES:2026-07-22","chamberlin81st00chamrich"]]
]);
const rowSourcePolicies={
  "RD-E11":{
    "RDS-54":["familyKey=THC-Marshall-stage-marker","route-identity role","state-marker source","THC marker 10197 text","manually read:"],
    "RDS-63":["familyKey=OR-S1-V34","exclusion role","primary official source","printed p. 485","manually read:"]
  },
  "RD-E15":{
    "RDS-66":["familyKey=Boyer-diary-1862","primary diary partial","PDF pp. 3-4 / 17-23 Feb. entries","manually read:"],
    "RDS-67":["familyKey=Piston-Rutherford-Marmaduke-2022","public-history interview partial","PBS page transcript lines 223-248 / linked caption line 18","manually read:"],
    "RDS-68":["familyKey=Monks-southern-Missouri-1907","participant-history partial","printed pp. 153-155","manually read:"]
  },
  "RD-E17":{
    "RDS-47":["familyKey=Breck-columns-ch7","exact-operation role","primary officer correspondence","Harpers Ferry 7 June and Kernstown 10 June letters","manually read:"],
    "RDS-61":["familyKey=OR-S1-V12-pt3","exclusion role","primary official source","printed pp. 350-351","manually read:"]
  },
  "RD-E18":{
    "RDS-60":["familyKey=Collins-Price-atlas","operation role","federal professional-military history","printed p. 63 and note 24","manually read:"],
    "RDS-65":["familyKey=Cooper-County-history-1876","road/crossing-context role","county history","printed p. 106","manually read:"],
    "RDS-56":["could not be manually read cleanly and therefore does not count in D532","frozen D511 row is not rewritten"]
  },
  "RD-SI06":{
    "RDS-27":["familyKey=Platter-diary","exact-handling role","primary diary","DLG pp. 102-104 / 10-11 Feb. entries","manually read:"],
    "RDS-50":["familyKey=OR-S1-V47","independent exact-division handling role","primary official commander report","Series I vol. 47 pt. I","Report No. 32 of Bvt. Maj. Gen. John M. Corse","printed pp. 337-338","manually read:"],
    "RDS-69":["familyKey=Chamberlin-81st-Ohio-1865","compatible-locality partial","contemporary compiled regimental history","preface pp. 3-4","roster p. 171","narrative pp. 158-159","manually read:"]
  },
  "RD-SI13":{
    "RDS-27":["familyKey=Platter-diary","exact-handling role","primary diary","DLG pp. 133-135 / 8-9 Mar. entries","manually read:"],
    "RDS-69":["familyKey=Chamberlin-81st-Ohio-1865","compatible same-regiment partial","contemporary compiled regimental history","printed pp. 161-162","manually read:"],
    "RDS-50":["familyKey=OR-S1-V47","independent exact-division handling role","primary official commander report","Series I vol. 47 pt. I","Report No. 32 of Bvt. Maj. Gen. John M. Corse","printed pp. 340-342","manually read:"]
  }
};

step("AUDIT SINGULAR + FROZEN PREFIX",()=>{
  need(count(packet,heading)===1,"D532 normative audit heading must be singular");
  need(Buffer.byteLength(prefix)===75108&&hash(prefix)==="df962dd6addb3a4ec167a3e2b218c1dede0eb4917e7ea4bd81565603f0e418c8","original sections 1-12 prefix moved");
  need((prefix.match(/^\| RDS-/gm)||[]).length===65,"frozen RDS-01..RDS-65 register count moved");
  for(let i=1;i<=65;i++)need(prefix.includes("| RDS-"+String(i).padStart(2,"0")+" |"),"frozen source row missing RDS-"+String(i).padStart(2,"0"));
  for(const token of ["## 4. Candidate road-node register","## 5. Candidate road-edge and service-evidence register","## 6. Explicit non-link register","## 7. Road/rail/water/ferry/depot interchange register","## 8. Theater coverage","## 9. Known gaps and unresolved claims","## 10. Consumer eligibility and prohibited inferences","## 11. Validation concept for a possible later read-only substrate","## 12. Final verdict"])need(prefix.includes(token),"frozen section missing: "+token);
  return {prefixBytes:75108,sha256:hash(prefix),frozenSources:65};
});

step("APPENDED SOURCES / ACCESS / USE",()=>{
  need(count(audit,"- **RDS-66**")===1&&count(audit,"- **RDS-67**")===1&&count(audit,"- **RDS-68**")===1&&count(audit,"- **RDS-69**")===1,"appended RDS-66..69 must be singular");
  const appRecords=new Map();
  for(let i=66;i<=69;i++){
    const id="RDS-"+i,start="- **"+id+"**",next=i===69?"\n\nEvery source treated":"\n- **RDS-"+(i+1)+"**";
    const record=between(audit,start,next);appRecords.set(id,record);
    for(const token of ["familyKey=","role=","sourceType=","locator","precision=bounded","manualReadback=YES:2026-07-22","Stable reference:","https://"])need(record.includes(token),id+" missing source metadata: "+token);
  }
  for(const [id,tokens] of appendedPolicies){
    const record=appRecords.get(id);need(record,id+" appended record missing");
    for(const token of tokens)need(record.includes(token),id+" appended record identity moved: "+token);
    need(rows.some(row=>sourceSegments(row).has(id)),id+" is not genuinely used by an audit row");
  }
  return {appendedSources:4,contiguous:"RDS-66..RDS-69",manualReadback:4};
});

step("EXACT SIX-ROW ORDER + INHERITED FACTS",()=>{
  need(rows.length===6&&JSON.stringify(rows.map(row=>row.id))===JSON.stringify(ordered),"six-row D532 order moved");
  for(const row of rows)need(row.cells.length===5,row.id+" table width moved");
  const facts={
    "RD-E11":["RD-N26","RD-N25","CT-35","CT-34","Marshall-Waskom-Shreveport Stagecoach Road","D511 `Inferred`"],
    "RD-E15":["RD-N31","RD-N32","Lebanon","CT-30","Union wagon-supply corridor","D511 `Inferred`"],
    "RD-E17":["RD-N05","RD-N06","Charles Town","Berryville","CT-02","CT-04","6-8 June 1862","sixty-team","Harpers Ferry","D511 `Inferred`"],
    "RD-E18":["RD-N35","RD-N36","Unassigned","D503","Clark brigade plus 500 Jackman","Arrow Rock","14 Oct. 1864","Glasgow target only","D511 `Inferred`"],
    "RD-SI06":["5-11 Feb. 1865","Corse Fourth Division","XV Corps","Orangeburg","Buford Bridge","South Edisto ferry","D511 `Inferred`"],
    "RD-SI13":["8-9 Mar. 1865","Fourth Division XV Corps","Cheraw","Fayetteville","Laurensburgh","Laurel Hill-Juniper Creek","D511 `Inferred`"]
  };
  for(const row of rows)for(const token of facts[row.id])need(row.cells[1].includes(token),row.id+" inherited claim/mapping fact moved: "+token);
  return {rows:6,orderedIds:ordered};
});

step("SOURCE / FAMILY / TYPE / LOCATOR RESOLUTION",()=>{
  for(const row of rows){
    const actualIds=Array.from(row.cells[2].matchAll(/`(RDS-\d{2})`/g),m=>m[1]);
    need(JSON.stringify(actualIds)===JSON.stringify(rowSourceIds[row.id]),row.id+" exact claim-source IDs moved: "+JSON.stringify(actualIds));
    const segments=sourceSegments(row),policies=rowSourcePolicies[row.id];
    need(policies&&JSON.stringify(Object.keys(policies))===JSON.stringify(actualIds),row.id+" source-policy order moved");
    for(const id of actualIds){
      const segment=segments.get(id);need(segment,row.id+" source segment missing: "+id);
      if(id==="RDS-56"){
        need(row.id==="RD-E18"&&prefix.includes("| RDS-56 |"),"RDS-56 must remain an explicit frozen-source exclusion");
      }else{
        const policy=sources.get(id);need(policy,row.id+" has unknown claim-source ID: "+id);
        need(segment.includes("familyKey="+policy.family),row.id+" does not resolve "+id+" to canonical family in its own segment");
        need(segment.includes(policy.type),row.id+" does not state source type for "+id+" in its own segment");
      }
      for(const token of policies[id])need(segment.includes(token),row.id+" "+id+" identity/role/type/locator/readback moved: "+token);
    }
    need(/partial|exact|bounded|broad|no named-road|route breadth/i.test(row.cells[2]+row.cells[3]),row.id+" lacks bounded precision");
  }
  return {resolvedSources:sources.size,sourceUses:15,excludedSources:1,locators:15,manualReadback:"per claim-bearing source segment"};
});

step("DISPOSITION / SOURCE-ENDPOINT FLOOR",()=>{
  const expected={"RD-E11":"ROAD_GAP_UNRESOLVED","RD-E15":"ROAD_GAP_UNRESOLVED","RD-E17":"ROAD_GAP_UNRESOLVED","RD-E18":"ROAD_GAP_UNRESOLVED","RD-SI06":"ROAD_GAP_CURED","RD-SI13":"ROAD_GAP_CURED"};
  const found={ROAD_GAP_CURED:0,ROAD_GAP_UNRESOLVED:0,ROAD_GAP_DISPUTED:0};
  for(const row of rows){
    const value=(/`(ROAD_GAP_(?:CURED|UNRESOLVED|DISPUTED))`/.exec(row.cells[4])||[])[1];
    need(value===expected[row.id],row.id+" disposition violates conflict/floor precedence: expected "+expected[row.id]+", got "+value);
    found[value]++;
    const floorMarker=value==="ROAD_GAP_CURED"?"PASS":value==="ROAD_GAP_DISPUTED"?"CONFLICT":"FAIL";
    need(row.cells[4].includes("`SOURCE-ENDPOINT FLOOR: "+floorMarker+"`"),row.id+" exact final floor marker moved");
  }
  need(found.ROAD_GAP_CURED===2&&found.ROAD_GAP_UNRESOLVED===4&&found.ROAD_GAP_DISPUTED===0,"D532 disposition totals moved");
  const e11=rowById(rows,"RD-E11");need(/military passage families `0\/2`, crossing set absent/.test(e11.cells[4]),"RD-E11 complete floor deficit moved");
  const e15=rowById(rows,"RD-E15");need(/same-operation family pairing `0\/2`/.test(e15.cells[4]),"RD-E15 complete floor deficit moved");
  const e17=rowById(rows,"RD-E17");need(/exact movement family `1\/2`; loading-side\/depot handling absent/.test(e17.cells[4]),"RD-E17 complete floor deficit moved");
  const e18=rowById(rows,"RD-E18");need(/named-road detached-force families `0\/2`; endpoints remain `Unassigned` to `Unassigned`/.test(e18.cells[4]),"RD-E18 complete floor deficit moved");
  const si06=rowById(rows,"RD-SI06");need(si06.cells[3].includes("Corse supplies the load-bearing same-division route and handling chain")&&/Binnaker locality/.test(si06.cells[3])&&/independent exact-unit\/date handling families `2\/2`/.test(si06.cells[4]),"RD-SI06 complete cure floor moved");
  const si13=rowById(rows,"RD-SI13");need(si13.cells[3].includes("Corse supplies the load-bearing same-division weather and delay chain")&&/D531 requires an exact bridge, ferry, corduroy, weather, wagon, or delay chain/.test(si13.cells[3])&&/independent exact-unit\/date handling families `2\/2`/.test(si13.cells[4]),"RD-SI13 complete cure floor moved");
  need(audit.includes("Deterministic precedence yields exactly `2 ROAD_GAP_CURED`,\n`4 ROAD_GAP_UNRESOLVED`, and `0 ROAD_GAP_DISPUTED`."),"D532 deterministic result summary moved");
  return {cured:2,unresolved:4,disputed:0,precedence:"conflict > complete floor > unresolved"};
});

step("PERMANENT NEGATIVES + NO PRODUCT AUTHORITY",()=>{
  const compact=audit.replace(/\s+/g," ");
  for(const token of ["New Orleans-origin and `CT-36` road claims stay closed","Boonville, Arrow Rock, and Glasgow remain unassigned","`RD-E18` ends at Arrow Rock and Glasgow is only its target","Harpers Ferry, Williamsport, Shepherdstown, and Boteler's Ford remain distinct","cannot cross modes, compose segments, collapse Sherman units/dates/handling chains, or create a road/interchange claim","D532 creates no data, registry, schema, parser, runtime enum, Historical window, Mayhem service, eligibility, adjacency, topology, route, movement, control, condition, capacity, state, save, receipt, UI, or gameplay authority.","D503 and D525 remain exact."])need(compact.includes(token),"permanent negative/no-authority moved: "+token);
  return {newOrleans:"closed",ct36:"closed",endpoints:"unassigned",productAuthority:0};
});

step("FROZEN REGISTERS / NO RETROACTIVE PROMOTION",()=>{
  need(prefix.includes("RD-E11 remains Inferred.")&&prefix.includes("RD-E17 and RD-E18 still lack claim-specific second\nfamilies.")&&prefix.includes("RD-SI06 and RD-SI13 retain one-family handling details"),"D511 frozen gap verdict moved");
  need(/The thirteen-row\s+register is now 11 Verified and 2 Inferred/.test(prefix),"frozen Sherman register result moved");
  need(audit.includes("they do not rewrite the frozen\ncandidate-edge or Sherman-interval registers"),"D532 retroactive-promotion negative missing");
  need(audit.includes("Zero road services remain. `NEEDS_MORE_RESEARCH` remains\nthe packet's product verdict."),"D532 product verdict moved");
  return {candidateRewrites:0,shermanRewrites:0,roadServices:0};
});

step("D530 ARCHIVE",()=>{
  const legacy=read("legacy/HANDOFF-ARCHIVE.md"),begin="<!-- D532 SUPERSEDED HANDOFF HEAD D530 (BYTE-VERBATIM):BEGIN -->",end="<!-- D532 SUPERSEDED HANDOFF HEAD D530 (BYTE-VERBATIM):END -->";
  need(count(legacy,begin)===1&&count(legacy,end)===1,"D530 archive markers missing or duplicated");
  const archived=legacy.slice(legacy.indexOf(begin)+begin.length+1,legacy.indexOf(end));
  need(Buffer.byteLength(archived)===6365&&hash(archived)==="0c7df72906c5801ea936831e35590c2f5720dea29ecbcface6f1a55f77120fdf","D530 archived HANDOFF block moved");
  return {bytes:6365,sha256:hash(archived)};
});

step("D532 TERMINAL ROUTING",()=>{
  const handoff=read("HANDOFF.md"),laneText=read("COORDINATION.md"),law=read("docs/design/unlocked-but-judged-design.md"),decisions=read("DECISIONS.md"),log=read("RUN-LOG.md"),checklist=read("V1-CHECKLIST.md"),wake=read("WAKE-UP.md"),start=read("START-HERE.md"),auto=read("AUTONOMOUS-RUN.md"),plan=read("tools/probe-conquest-transport-plan.mjs");
  const lane=(/### LANE-019 · conquest-design-law[\s\S]*?(?=\n### LANE-\d+ ·|\n## 6 ·|$)/.exec(laneText)||[])[0]||"";
  need(/D532 ROAD-GAP RESEARCH COMPLETE; UNOWNED/.test(lane)&&/\*\*Owning tool:\*\* none\b/.test(lane)&&/\*\*State:\*\* CONTRACT\b/.test(lane),"LANE-019 must release D532 CONTRACT / none");
  for(const token of ["D532 delivery record","2 ROAD_GAP_CURED","4 ROAD_GAP_UNRESOLVED","0 ROAD_GAP_DISPUTED","RD-SI06","RD-SI13","tools/probe-conquest-road-gap-research.mjs","D525 remains the product head","CONTRACT"])need(lane.includes(token),"LANE-019 D532 delivery missing: "+token);
  const handoffHeads=Array.from(handoff.matchAll(/^\*\*⚡ AMENDMENT — 2026-07-22, (D\d+):/gm),m=>m[1]);
  need(JSON.stringify(handoffHeads)===JSON.stringify(["D532","D531"]),"HANDOFF must retain exact ordered D532+D531 live heads");
  need(decisions.includes("## D532")&&log.includes("D532")&&law.includes("### 8.36 D532")&&checklist.includes("D532"),"D532 decision/law/log/checklist delivery missing");
  for(const [rel,text] of [["HANDOFF.md",handoff],["START-HERE.md",start],["WAKE-UP.md",wake],["AUTONOMOUS-RUN.md",auto],["V1-CHECKLIST.md",checklist],["RUN-LOG.md",log]])need(text.includes("<!-- LIVE-HEAD decision=D532 next-lane=LANE-019 state=CONTRACT owner=none -->"),rel+" live summary not at D532 terminal");
  need(/D532/.test(plan)&&/ROAD_GAP_CURED/.test(plan),"transport-plan current-boundary tooth not at D532 result");
  need(!/D532[^\n]*lane-level `SHIPPED` claim/i.test(lane),"D532 may not claim lane-level SHIPPED");
  return {decision:"D532",lane:"LANE-019",state:"CONTRACT",owner:"none",productHead:"D525"};
});

step("ALLOWLIST / GUARD BOUNDARY",()=>{
  const handoff=read("HANDOFF.md"),lane=read("COORDINATION.md");
  for(const text of [handoff,lane])for(const token of ["docs/design/strategic-road-transport-research-packet.md","tools/probe-conquest-road-gap-research.mjs","exact thirteen-file allowlist","suite-excluded"])need(text.includes(token),"D532 allowed/boundary token missing: "+token);
  return {allowlist:13,guard:"suite-excluded",ownedFiles:2};
});

const failed=steps.filter(item=>!item.ok),result={ok:!failed.length,steps,failed:failed.map(item=>item.name),errors:[],pageerrors:[],realErrors:[],summary:{passed:steps.length-failed.length,total:steps.length}};
writeFileSync(ART,JSON.stringify(result,null,2)+"\n");
console.log(`probe-conquest-road-gap-research: ${result.summary.passed}/${result.summary.total} steps ok, ${failed.length} fail`);
if(failed.length){for(const item of failed)console.error("FAIL",item.name,"-",item.err);process.exit(1)}
console.log("ALL OK");
