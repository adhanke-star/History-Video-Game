#!/usr/bin/env node
// D504 / LANE-019 Slice 1 filesystem-first contract probe.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
const ART = join(OUT, "probe-conquest-layer-plan.json");
mkdirSync(OUT, { recursive:true });
const read = rel => readFileSync(join(ROOT, rel), "utf8");
const pack = JSON.parse(read("data/conquest-territories.json"));
const steps = [], errors = [];
function step(name, fn) {
  try { const v=fn(); steps.push({name,ok:true,v:v===undefined?null:v}); }
  catch (e) { steps.push({name,ok:false,err:String(e&&e.message||e)}); }
}
function need(ok,msg){ if(!ok) throw new Error(msg); }
function count(text, token){ return text.split(token).length-1; }
function idsFromSection(text, prefix){
  return Array.from(text.matchAll(new RegExp("^\\| ("+prefix+"-\\d{2}) ","gm")),m=>m[1]);
}

const expectedNames = [
  "Baltimore-Washington Corridor","Upper Potomac-Harpers Ferry","Northern Virginia-Manassas","Shenandoah Valley-Strasburg",
  "Richmond Capital District","Petersburg-City Point","Virginia Southside-Lynchburg","Hampton Roads-Peninsula",
  "North Carolina Sounds-Weldon","Cape Fear-Wilmington","Charleston-Port Royal Lowcountry","Savannah-Coastal Georgia",
  "Augusta-Upper Savannah","Atlanta-North Georgia","Macon-Central Georgia","Montgomery-Central Alabama",
  "Mobile Bay-Lower Alabama","Louisville-Ohio Falls","Cairo-Paducah-Western Kentucky","Nashville-Middle Tennessee",
  "Chattanooga-East Tennessee","Tennessee River-Shiloh","Memphis-West Tennessee","Corinth-North Mississippi",
  "Vicksburg-Mississippi Bend","Jackson-Central Mississippi","Meridian-East Mississippi","Lower Mississippi-New Orleans",
  "Missouri River-St. Louis","Missouri Ozarks","Lower Arkansas-Arkansas Post","Little Rock-Central Arkansas",
  "Alexandria-Lower Red River","Shreveport-North Louisiana","Marshall-East Texas","Houston-Galveston"
];

step("D455, D502, D503, and Aaron Package-A lock are singular in the live law boundary",()=>{
  const law=read("docs/design/unlocked-but-judged-design.md");
  const d=read("DECISIONS.md"), lane=read("COORDINATION.md");
  need(count(law,"### 8.11 D503 final adjudication — Package A is Aaron-locked")===1,"D503 Package-A law heading not singular");
  need(count(d,"## D503 — AARON LOCKS ARC 7 PACKAGE A")===1,"D503 decision heading not singular");
  need(count(d,"## D502 — ARC 6 RESEARCH IS COMPLETE")===1,"D502 decision heading not singular");
  need(count(lane,"### LANE-019 · conquest-design-law")===1,"LANE-019 not singular");
  need(law.includes("D455") && law.includes("Aaron answered **\"execute option a\"**"),"D455/Aaron selection missing");
  return {law:true,decision:true,lane:true};
});

step("registry has exact 36 ids, names, and order",()=>{
  need(pack.schema==="cw_conquest_territories_v1"&&pack.version===1,"schema/version mismatch");
  need(pack.enablement&&pack.enablement.mode==="read-only"&&pack.enablement.enabled===true,"read-only enablement mismatch");
  need(Array.isArray(pack.territories)&&pack.territories.length===36,"territory count not 36");
  pack.territories.forEach((r,i)=>{
    need(r.id==="CT-"+String(i+1).padStart(2,"0"),"id mismatch at "+(i+1));
    need(r.name===expectedNames[i],"name mismatch at "+r.id);
    need(r.displayOrder===i+1,"order mismatch at "+r.id);
  });
  return {territories:36};
});

step("RN/WN/battle-library anchors are complete, unique, and packet-resolved",()=>{
  const rail=read("docs/design/strategic-rail-conquest-research-packet.md");
  const water=read("docs/design/strategic-water-transport-research-packet.md");
  const expected=[...idsFromSection(rail,"RN"),...idsFromSection(water,"WN"),"BATTLE-WILSONS-CREEK","BATTLE-ELKHORN-TAVERN"];
  need(expected.length===78,"expected anchor inventory must be 78, got "+expected.length);
  const got=pack.territories.flatMap(r=>r.anchors);
  need(got.length===expected.length&&new Set(got).size===got.length,"anchor assignment duplicated/missing");
  expected.forEach(id=>need(got.includes(id),"missing anchor "+id));
  return {anchors:got.length,rail:35,water:41,battleLibrary:2};
});

step("sources, provenance, uncertainty, and explicit non-links resolve",()=>{
  const sourceIds=new Set(pack.sourceRegisters.map(s=>s.id));
  need(sourceIds.size===pack.sourceRegisters.length,"duplicate source register id");
  let nonLinks=0;
  pack.territories.forEach(r=>{
    need(["Verified","Inferred","Disputed"].includes(r.provenance),r.id+" bad provenance");
    need(typeof r.uncertainty==="string"&&r.uncertainty.trim(),r.id+" missing uncertainty");
    need(Array.isArray(r.sources)&&r.sources.length>=2&&r.sources.every(s=>sourceIds.has(s)),r.id+" unresolved sources");
    need(Array.isArray(r.nonLinks)&&r.nonLinks.length,r.id+" missing non-link");
    r.nonLinks.forEach(n=>{ nonLinks++; need(n.claim&&Array.isArray(n.sourceRefs)&&n.sourceRefs.length>=2&&n.sourceRefs.every(s=>sourceIds.has(s)),r.id+" malformed non-link"); });
  });
  const ct29=pack.territories[28],ct30=pack.territories[29];
  need(ct29.sources.includes("MO-01")&&ct29.sources.includes("MO-02"),"CT-29 lacks direct Missouri sources");
  need(ct30.sources.includes("MO-01")&&ct30.sources.includes("MO-03"),"CT-30 lacks direct battle/research sources");
  need(/no rail or water service/i.test(ct29.nonLinks[0].claim)&&/No packet-unsupported rail or water service/i.test(ct30.nonLinks[0].claim),"CT-29/30 transport absence lost");
  return {sources:sourceIds.size,nonLinks};
});

step("no unsupported connection, inferred interchange, or later-slice authority exists",()=>{
  const text=JSON.stringify(pack);
  const forbidden=["movementPoints","capacity","ownership","control","condition","economy","reinforcement","objective","save","armies","casualties","winner","score","surrender","tacticalOutput","interchanges","edges"];
  forbidden.forEach(k=>need(!new RegExp('"'+k+'"','i').test(text),"forbidden field "+k));
  const keys=[];(function walk(v){if(Array.isArray(v))return v.forEach(walk);if(v&&typeof v==="object")for(const k of Object.keys(v)){keys.push(k);walk(v[k]);}})(pack);
  need(!keys.some(k=>/^(adjacency|adjacent|throughService|bidirectional|interchange|connection)$/i.test(k)),"data manufactures connection/interchange fields");
  return {laterSliceFields:0,connectionFields:0};
});

step("existing owners remain separate and the board is read-only",()=>{
  const board=read("src/114-conquest-board.js");
  ["blockadeInit","logisticsInit","realDiplomacyInit","westernTheaterInit","bridgeArmy","bridgeAutoResolve","warCareerStart","fldCustom"].forEach(sym=>need(!board.includes(sym),"board duplicates owner "+sym));
  need(!/\bG\b|\bC\b|localStorage|settings|applySave|saveLocal|importSave|exportSave/.test(board),"board references state/save authority");
  need(board.includes("Object.freeze")&&board.includes("conquestBoardNormalized"),"immutable normalization missing");
  return {ownerLeaks:0};
});

step("manifest and build enroll the board plus closed registry validation",()=>{
  const manifest=JSON.parse(read("src/00-manifest.json")),build=read("tools/build.mjs");
  need(manifest.modules.includes("114-conquest-board.js"),"board module is not enrolled in manifest");
  need(build.includes("D504 conquest territory registry gate")&&build.includes("conquest territories: ' + conquestTerritoryCount + '/36"),"build validator/readback missing");
  return {module:manifest.modules.indexOf("114-conquest-board.js")+1,modules:manifest.modules.length};
});

step("H0 exposes exactly one fail-closed entry and no campaign-start action",()=>{
  const h0=read("src/98-h0-main-menu.js"),board=read("src/114-conquest-board.js");
  need(count(h0,'h0Action("gnConquestBoard"')===1,"H0 conquest entry not exactly one");
  need(h0.includes('typeof conquestBoardReady === "function"')&&h0.includes('typeof conquestBoardOpen === "function"')&&h0.includes("conquestBoardReady()"),"H0 helper/registry guard incomplete");
  need(board.includes("read-only foundation; conquest play not yet enabled"),"exact status absent");
  need(!/start conquest|start campaign/i.test(board),"board contains start action");
  return {entryControls:1,startActions:0};
});

const failed=steps.filter(s=>!s.ok);
const result={ok:failed.length===0,steps,failed:failed.map(s=>s.name),errors,summary:{passed:steps.length-failed.length,total:steps.length}};
writeFileSync(ART,JSON.stringify(result,null,2)+"\n");
console.log(`probe-conquest-layer-plan: ${result.summary.passed}/${result.summary.total} steps ok, ${failed.length} fail`);
if(!result.ok){ for(const f of failed) console.error("FAIL",f.name,"-",f.err); process.exit(1); }
console.log("ALL OK");
