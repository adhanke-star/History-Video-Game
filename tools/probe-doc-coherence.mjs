#!/usr/bin/env node
// D510 canonical-doc live-summary coherence gate. Zero dependencies by design.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE=dirname(fileURLToPath(import.meta.url)), ROOT=resolve(HERE,".."), OUT=join(HERE,"shots"), ART=join(OUT,"probe-doc-coherence.json");
const files=["HANDOFF.md","START-HERE.md","WAKE-UP.md","AUTONOMOUS-RUN.md","V1-CHECKLIST.md","RUN-LOG.md"];
const states=new Set(["LAW-DRAFT","CONTRACT","DRIVE","VERIFY","SHIPPED"]);
const read=rel=>readFileSync(join(ROOT,rel),"utf8");
const steps=[];
const need=(v,m)=>{if(!v)throw new Error(m)};
const step=(name,fn)=>{try{const value=fn();steps.push({name,ok:true,value:value===undefined?null:value});}catch(e){steps.push({name,ok:false,error:String(e&&e.message||e)});}};

let markerBlock, marker;
function extract(rel){
  const text=read(rel), begin="<!-- LIVE-HEAD-SUMMARY:BEGIN -->", end="<!-- LIVE-HEAD-SUMMARY:END -->";
  const starts=text.split(begin).length-1, ends=text.split(end).length-1;
  need(starts===1&&ends===1,rel+" must contain exactly one live-summary begin/end marker pair");
  const from=text.indexOf(begin), to=text.indexOf(end,from);
  need(to>from,rel+" live-summary markers are out of order");
  const block=text.slice(from,to+end.length);
  const lines=block.split(/\r?\n/).filter(line=>line.startsWith("<!-- LIVE-HEAD decision="));
  need(lines.length===1,rel+" live-summary block must contain exactly one decision marker line");
  const hit=/^<!-- LIVE-HEAD decision=(D\d+) next-lane=(LANE-\d{3}) state=(LAW-DRAFT|CONTRACT|DRIVE|VERIFY|SHIPPED) owner=([A-Za-z0-9._\/-]+) -->$/.exec(lines[0]);
  need(hit,rel+" decision marker has invalid exact form");
  return {block,marker:{decision:hit[1],lane:hit[2],state:hit[3],owner:hit[4]}};
}

step("six canonical docs carry one byte-identical live-summary marker",()=>{
  const extracted=files.map(rel=>({rel,...extract(rel)}));
  markerBlock=extracted[0].block; marker=extracted[0].marker;
  for(const row of extracted.slice(1)) need(row.block===markerBlock,row.rel+" live-summary marker differs from HANDOFF.md byte-for-byte");
  return {files:files.length,decision:marker.decision,nextLane:marker.lane,state:marker.state,owner:marker.owner};
});

step("marker decision matches first HANDOFF amendment and DECISIONS heading",()=>{
  need(marker,"marker extraction did not complete");
  const handoff=read("HANDOFF.md"), decisions=read("DECISIONS.md");
  const amendment=/^\*\*⚡ AMENDMENT[^\n]*?, (D\d+):/m.exec(handoff);
  const decision=/^## (D\d+)\b/m.exec(decisions);
  need(amendment,"HANDOFF.md has no parseable first amendment");
  need(decision,"DECISIONS.md has no parseable first decision heading");
  need(amendment[1]===marker.decision,"first HANDOFF amendment is "+amendment[1]+", marker is "+marker.decision);
  need(decision[1]===marker.decision,"first DECISIONS heading is "+decision[1]+", marker is "+marker.decision);
  return {decision:marker.decision};
});

step("HANDOFF keeps exactly two amendment blocks",()=>{
  const amendments=(read("HANDOFF.md").match(/^\*\*⚡ AMENDMENT[^\n]*?\*\*/gm)||[]).length;
  need(amendments===2,"HANDOFF.md has "+amendments+" amendment blocks (expected 2)");
  return {amendments};
});

let lanes=[];
step("lane headers match first declared State and SHIPPED owners are unowned",()=>{
  const text=read("COORDINATION.md");
  const headers=[...text.matchAll(/^### (LANE-\d+) · [^\n]*?\*\*(LAW-DRAFT|CONTRACT|DRIVE|VERIFY|SHIPPED)\b[^\n]*\*\*/gm)];
  need(headers.length>0,"COORDINATION.md has no parseable lane headers");
  lanes=headers.map((hit,index)=>{
    const segment=text.slice(hit.index,index+1<headers.length?headers[index+1].index:text.length);
    const state=/^- \*\*State:\*\*\s*(LAW-DRAFT|CONTRACT|DRIVE|VERIFY|SHIPPED)\b/m.exec(segment);
    const owner=/^- \*\*Owning tool:\*\*\s*([^\n]+)/m.exec(segment);
    need(state,hit[1]+" has no first declared State");
    need(owner,hit[1]+" has no first Owning tool");
    need(states.has(state[1])&&state[1]===hit[2],hit[1]+" header state "+hit[2]+" disagrees with first State "+state[1]);
    if(hit[2]==="SHIPPED") need(/^(none|unowned)\b/i.test(owner[1].trim()),hit[1]+" is SHIPPED but first Owning tool is not none/unowned");
    return {id:hit[1],state:state[1],owner:owner[1].trim()};
  });
  return {lanes:lanes.length};
});

step("declared next lane matches its first State and Owning tool",()=>{
  need(marker&&lanes.length,"marker or lane parsing did not complete");
  const lane=lanes.find(row=>row.id===marker.lane);
  need(lane,"marker names missing "+marker.lane);
  need(lane.state===marker.state,marker.lane+" first State is "+lane.state+", marker declares "+marker.state);
  need(new RegExp("^"+marker.owner.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","i").test(lane.owner),marker.lane+" first Owning tool is "+lane.owner+", marker declares "+marker.owner);
  return {lane:lane.id,state:lane.state,owner:lane.owner};
});

const failed=steps.filter(step=>!step.ok);
const result={ok:failed.length===0,steps,failed:failed.map(step=>step.name),errors:failed.map(step=>step.error),pageerrors:[],realErrors:[],summary:{passed:steps.length-failed.length,total:steps.length}};
mkdirSync(OUT,{recursive:true}); writeFileSync(ART,JSON.stringify(result,null,2)+"\n");
for(const row of steps) console.log((row.ok?"OK  ":"FAIL ")+row.name+(row.ok?"":" — "+row.error));
console.log("probe-doc-coherence: "+result.summary.passed+"/"+result.summary.total+" steps ok, "+failed.length+" fail");
if(failed.length) process.exit(1);
console.log("ALL OK");
