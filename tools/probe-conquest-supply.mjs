#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D538/D539 + D540 + D542 + D544 / LANE-022 Slices 1-4 focused proof — the traced conquest supply route, the
// control/service receipts and cuts that make it bite, the finite-capacity repair, and the blockade sea edge.
//
// Two halves by design. The STATIC half rebuilds the seam in a node:vm context from the ON-DISK
// src/115 + src/114 + src/61, so a source mutation reds it WITHOUT a rebuild (that is what makes the
// declared negative bind meaningful). The BROWSER half proves the identical behavior in the built
// deliverable. The declared D540 bind target is the single CONTAINMENT-B step, which is deliberately
// the ONLY step that queries the seam on a non-admitted ruleset AND the only one that reads the
// allowlist literal from source — a bind that reds two steps means the tooth is too broad (D539).
//
// The vm context is created EMPTY on purpose: injecting a host Object breaks the substrate's
// prototype-identity ruleset check, which would silently fail every query closed.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { createContext, runInContext } from "node:vm";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
const ART = join(OUT, "probe-conquest-supply.json");
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, "shots.json"), "utf8"));
const read = rel => readFileSync(join(ROOT, rel), "utf8");
const result = { ok: true, steps: [], failed: [], errors: [], pageerrors: [], realErrors: [], summary: null };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const need = (v, m) => { if (!v) throw new Error(m); };
async function up(u) { try { const r = await fetch(u, { method: "HEAD" }); return r.ok || r.status === 200; } catch { return false; } }
async function step(name, fn) {
  try { const v = await fn(); result.steps.push({ name, ok: true, v: v === undefined ? null : v }); console.log("  OK   " + name); }
  catch (e) { const err = String(e && e.message || e); result.ok = false; result.failed.push(name); result.steps.push({ name, ok: false, err }); console.error("  FAIL " + name + " :: " + err); }
}

/* ---- the on-disk seam, rebuilt from source ------------------------------- */
const SRC61 = "src/61-logistics-rail.js";
const DATA = {
  "conquest-territories": JSON.parse(read("data/conquest-territories.json")),
  "conquest-transport-evidence": JSON.parse(read("data/conquest-transport-evidence.json")),
  "logistics-rail": JSON.parse(read("data/logistics-rail.json"))
};
function diskSeam() {
  const ctx = createContext({});
  runInContext("var GAME_DATA=" + JSON.stringify(DATA) + "; function gameData(n){return GAME_DATA[n]||null;}"
    + " function htmlEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}"
    + " function logPush(){}"
    // D542: a settable B-5 realism stub so the repair-capacity slider math is deterministic node-side.
    + " var __preset=null; function fldPresetResolve(){return __preset;}", ctx);
  for (const f of ["src/115-conquest-transport.js", "src/114-conquest-board.js", SRC61]) runInContext(read(f), ctx);
  runInContext([
    "function mkPlain(side){return {side:side};}",
    "function mkConquest(side,id){return {side:side,campaignKind:{id:'conquest',version:1},ruleset:{id:id,version:1},conquest:{}};}"
  ].join("\n"), ctx);
  return expr => runInContext("JSON.stringify((function(){" + expr + "})())", ctx);
}
const SHIPPED_ROUTE_KEYS = ["id", "label", "theater", "theaterName", "friction", "note"];
// D540: the field set grows by supplyState / depotHeld / severedBy / cutCount / reason.
const TRACE_KEYS = ["rulesetId", "authored", "applied", "supplyState", "side", "theater", "depot", "depotName",
  "depotHeld", "target", "targetName", "reachable", "segments", "territories", "modeMix", "segmentCount",
  "reachedCount", "severedBy", "importClosed", "cutCount", "tracedFriction", "label", "reason"];  // D546: + importClosed
const SUPPLY_KEYS = ["schema", "control", "cut", "adopted", "cutCount", "repairSpent"];  // D542: + repairSpent

let server = null, browser = null;
try {
  /* ===================== STATIC / ON-DISK HALF ============================ */

  await step("SEAM SHAPE: a non-conquest carrier keeps the shipped six-key route and gets no trace", () => {
    const run = diskSeam();
    const v = JSON.parse(run("var r=_lgRoute(mkPlain('US'),null);return {keys:Object.keys(r),trace:conquestSupplyTrace(mkPlain('US'),null),supply:_lgSupplyView(mkPlain('US')),hasTrace:Object.prototype.hasOwnProperty.call(r,'trace'),friction:r.friction,block:_lgSupplyBlockHTML(mkPlain('US'))};"));
    need(JSON.stringify(v.keys) === JSON.stringify(SHIPPED_ROUTE_KEYS), "non-conquest route keys drifted: " + JSON.stringify(v.keys));
    need(v.hasTrace === false, "non-conquest route attached a trace");
    need(v.trace === null, "non-conquest carrier produced a trace object");
    need(v.supply === null, "non-conquest carrier produced a control/condition view");
    need(v.block === "", "non-conquest carrier rendered a conquest supply block");
    return { keys: v.keys.length, trace: null, supply: null, friction: v.friction };
  });

  await step("CONTAINMENT-A: authored trace AND authored control/condition state are reachable on the open ruleset", () => {
    const run = diskSeam();
    const v = JSON.parse(run("var C=mkConquest('US','mayhem');var t=conquestSupplyTrace(C,null);var s=_lgSupplyView(C);var r=_lgRoute(C,null);"
      // D544: the authored CS sea-import route is reachable on the open ruleset (Charleston via CTS-S-01).
      + "var seaC=mkConquest('CS','mayhem');seaC.blockade={portsOpen:4};var sea=conquestSupplyTrace(seaC,'CT-11');"
      // D546: the authored road layer is reachable on the open ruleset and nowhere else.
      + "var roadC=mkConquest('CS','mayhem');var road=conquestSupplyTrace(roadC,'CT-03');"
      + "var bs=_lgTraceBase({id:'mayhem',version:1});"
      + "return {t:t,s:s,routeKeys:Object.keys(r),sameRef:r.trace&&r.trace.depot===t.depot,frozen:[Object.isFrozen(t),Object.isFrozen(t.segments),Object.isFrozen(t.segments[0]),Object.isFrozen(t.modeMix),Object.isFrozen(s),Object.isFrozen(s.control),Object.isFrozen(s.cut)],openingUS:s.control['CT-01'],openingCS:s.control['CT-05'],openingCount:Object.keys(s.control).length,"
      + "sea:{state:sea.supplyState,applied:sea.applied,depot:sea.depot,seg:sea.segments.map(function(x){return x.id+':'+x.mode;}),f:sea.tracedFriction},"
      + "road:{state:road.supplyState,applied:road.applied,depot:road.depot,seg:road.segments.map(function(x){return x.id+':'+x.mode;}),f:road.tracedFriction},"
      + "roadServices:_LG_ROADS.length,baseServices:Object.keys(bs.services).length,sourcedServices:Object.keys(_lgTraceBase({id:'mayhem',version:1}).services).filter(function(k){return k.indexOf('CTS-')===0;}).length};"));
    need(v.road && v.road.state === "TRACED" && v.road.applied === true && v.road.depot === "CT-05"
      && JSON.stringify(v.road.seg) === JSON.stringify(["RDA-01:road"]) && v.road.f === 10,
      "the authored road layer is not reachable on the open ruleset — the CS Eastern front must trace over one authored road segment: " + JSON.stringify(v.road));
    need(v.roadServices === 17 && v.baseServices === 61 && v.sourcedServices === 44,
      "the authored road roster moved: " + v.roadServices + " roads, " + v.baseServices + " base services, " + v.sourcedServices + " sourced");
    need(v.sea && v.sea.state === "TRACED" && v.sea.applied === true && v.sea.depot === "CT-12"
      && JSON.stringify(v.sea.seg) === JSON.stringify(["CTS-S-01:sea"]) && v.sea.f === 8,
      "the authored CS sea-import route (Savannah -> Charleston via CTS-S-01) is not reachable on the open ruleset: " + JSON.stringify(v.sea));
    need(v.t && typeof v.t === "object", "the open ruleset produced no trace object");
    need(JSON.stringify(Object.keys(v.t)) === JSON.stringify(TRACE_KEYS), "trace field set drifted: " + JSON.stringify(Object.keys(v.t)));
    need(JSON.stringify(Object.keys(v.s)) === JSON.stringify(SUPPLY_KEYS), "control/condition field set drifted: " + JSON.stringify(Object.keys(v.s)));
    need(v.t.rulesetId === "mayhem" && v.t.authored === true, "trace is not stamped as authored open-ruleset content");
    need(v.t.depot === "CT-01" && v.t.target === "CT-03", "authored depot/front pair moved");
    need(v.t.supplyState === "TRACED" && v.t.applied === true, "the shipped default US route must TRACE and APPLY at Slice 2");
    need(v.t.reachable === true && v.t.segmentCount === 1 && v.t.segments[0].id === "CTS-R-02" && v.t.segments[0].mode === "rail",
      "the sourced Washington-Manassas rail segment no longer carries the default US route");
    need(JSON.stringify(v.t.territories) === JSON.stringify(["CT-01", "CT-03"]), "traced territory chain moved");
    need(v.routeKeys.length === 7 && v.routeKeys[6] === "trace", "the guarded route tail did not attach exactly one field");
    need(v.sameRef === true, "the route tail does not carry the same traced value");
    need(v.frozen.every(Boolean), "the trace or the control/condition view is not deeply frozen");
    need(v.openingUS === "US" && v.openingCS === "CS" && v.openingCount === 28,
      "the authored opening control map moved: " + v.openingCount + " assigned");
    need(v.s.adopted === false && v.s.cutCount === 0, "an empty conquest namespace must adopt nothing and carry no cut");
    return { reachable: true, supplyState: v.t.supplyState, applied: true, openingAssigned: v.openingCount, frozen: true };
  });

  // *** THE D540 DECLARED NEGATIVE-BIND TARGET ***
  // Mutating the containment allowlist in src/61 so the evidence-gated side would leak authored
  // control/condition state must red THIS step and no other. It is deliberately the ONLY step that
  // queries the seam on a non-admitted ruleset, and the only one that reads the allowlist literal.
  await step("CONTAINMENT-B: the IDENTICAL query on every non-admitted ruleset returns the absent result", () => {
    const run = diskSeam();
    const src = read(SRC61);
    need(/var _LG_TRACE_RULESETS = \{ mayhem: 1 \};/.test(src),
      "the containment allowlist is no longer the exact single-id allowlist — authored content may leak");
    need(!/["']historical["']/.test(src),
      "the seam names a second ruleset id — containment must be an allowlist, never a denylist");
    const v = JSON.parse(run([
      "var C=mkConquest('US','historical');",
      "var r=_lgRoute(C,null);",
      "var closed=[];",
      "var probes=[{side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'historical',version:1}},",
      " {side:'CS',campaignKind:{id:'conquest',version:1},ruleset:{id:'historical',version:1}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'MAYHEM',version:1}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'mayhem',version:2}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'constructor',version:1}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:{id:'toString',version:1}},",
      " {side:'US',campaignKind:{id:'conquest',version:1},ruleset:null},",
      " {side:'US',campaignKind:{id:'conquest',version:1}}];",
      "for(var i=0;i<probes.length;i++)closed.push(conquestSupplyTrace(probes[i],'CT-03')===null);",
      "var inherited={side:'US',campaignKind:{id:'conquest',version:1},ruleset:Object.create({id:'mayhem',version:1})};",
      "closed.push(conquestSupplyTrace(inherited,'CT-03')===null);",
      "var calls=0,accessor={version:1};Object.defineProperty(accessor,'id',{enumerable:true,get:function(){calls++;return 'mayhem';}});",
      "closed.push(conquestSupplyTrace({side:'US',campaignKind:{id:'conquest',version:1},ruleset:accessor},'CT-03')===null&&calls===0);",
      "var partial={side:'US',campaignKind:{id:'conquest',version:1},ruleset:Object.assign(Object.create({version:1}),{id:'mayhem'})};",
      "closed.push(conquestSupplyTrace(partial,'CT-03')===null);",
      // D540/D542: the SAME gate must close authored control/condition/repair state and every writer AND reader.
      // D544: and the authored CS sea-import route stays closed even with live blockade state on the carrier.
      "var G2=mkConquest('US','historical');G2.engineering={levels:{construction:3,pontoons:3}};",
      "var SEA=mkConquest('CS','historical');SEA.blockade={portsOpen:4};",
      "var stateClosed=[_lgSupplyView(G2)===null,",
      " conquestSupplySetCondition(G2,'CTS-R-02',true)===null,",
      " conquestSupplySetControl(G2,'CT-03','CS')===null,",
      " conquestRepairCapacity(G2)===null,",
      " conquestSupplyRepairReport(G2)===null,",
      " _lgSupplyRepairReset(G2)===null,",
      " _lgSupplyBlockHTML(G2)==='',",
      " conquestSupplyTrace(SEA,'CT-11')===null,",
      // D546: the authored road layer is unreachable on the evidence-gated ruleset.
      " conquestSupplyTrace(mkConquest('CS','historical'),'CT-03')===null,",
      " Object.keys(G2.conquest).length===0];",
      "return {trace:conquestSupplyTrace(C,'CT-03'),routeKeys:Object.keys(r),hasTrace:Object.prototype.hasOwnProperty.call(r,'trace'),closed:closed,stateClosed:stateClosed};"
    ].join("")));
    need(v.trace === null, "the evidence-gated ruleset produced an authored trace object — CONTAINMENT LEAK");
    need(v.hasTrace === false, "_lgRoute attached a trace on the evidence-gated ruleset — CONTAINMENT LEAK");
    need(JSON.stringify(v.routeKeys) === JSON.stringify(SHIPPED_ROUTE_KEYS), "evidence-gated route keys drifted");
    need(v.closed.length === 11 && v.closed.every(Boolean), "a non-admitted ruleset shape opened the gate: " + JSON.stringify(v.closed));
    need(v.stateClosed.length === 10 && v.stateClosed.every(Boolean),
      "authored control/condition/repair/sea-import state surfaced on the evidence-gated ruleset — CONTAINMENT LEAK: " + JSON.stringify(v.stateClosed));
    return { absent: true, closedShapes: v.closed.length, stateClosed: v.stateClosed.length, allowlist: "single-id", accessorsInvoked: 0 };
  });

  await step("BOUNDED OUTCOME: non-conquest play is byte-identical and every conquest state stays inside the shipped caps", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "function active(C){var L=logisticsInit(C);L.active=true;L.priority='railheads';return C;}",
      // non-conquest carriers must not move a single byte
      "var a=logisticsBridgeBonus(mkPlain('US')),sa=logisticsSnapshot(mkPlain('US'));",
      "var a2=logisticsBridgeBonus(active(mkPlain('US'))),sa2=logisticsSnapshot(active(mkPlain('US')));",
      "var pr=_lgRoute(mkPlain('US'),null);",
      // every reachable conquest state, with the bridge switched ON
      "var caps=_lgCfg().bridgeCaps,rows=[],bad=[];",
      "function scen(name,mk){var C=active(mk());var b=logisticsBridgeBonus(C),s=logisticsSnapshot(C),t=conquestSupplyTrace(C,null);",
      " rows.push({name:name,state:t.supplyState,applied:t.applied,friction:_lgRoute(C,null).friction,depotReach:s.depotReach,network:s.network,supply:b.supply,fatigueRelief:b.fatigueRelief,overall:b.overall});",
      " if(b.supply<0||b.supply>caps.supply||b.fatigueRelief<0||b.fatigueRelief>caps.fatigueRelief||b.overall<0||b.overall>caps.overall)bad.push(name);",
      " if(s.depotReach<0||s.depotReach>100||s.network<0||s.network>100||s.marchBurden<0||s.marchBurden>100)bad.push(name+':snapshot');}",
      "scen('us-traced',function(){return mkConquest('US','mayhem');});",
      "scen('cs-road-traced',function(){return mkConquest('CS','mayhem');});",
      "scen('us-severed-cut',function(){var C=mkConquest('US','mayhem');conquestSupplySetCondition(C,'CTS-R-02',true);return C;});",
      "scen('us-severed-enemy-target',function(){var C=mkConquest('US','mayhem');conquestSupplySetControl(C,'CT-03','CS');return C;});",
      "scen('us-severed-depot-lost',function(){var C=mkConquest('US','mayhem');conquestSupplySetControl(C,'CT-01','CS');return C;});",
      "scen('us-all-cut',function(){var C=mkConquest('US','mayhem');var g=_lgTraceBase({id:'mayhem',version:1});for(var k in g.services)conquestSupplySetCondition(C,k,true);return C;});",
      "return {plainBridge:JSON.stringify(a),plainBridgeActive:JSON.stringify(a2),plainSnap:JSON.stringify(sa),plainSnapActive:JSON.stringify(sa2),plainRoute:JSON.stringify(pr),caps:caps,rows:rows,bad:bad};"
    ].join("")));
    need(v.bad.length === 0, "a conquest state pushed a capped or clamped value out of range: " + JSON.stringify(v.bad));
    need(v.caps.supply === 7 && v.caps.fatigueRelief === 5 && v.caps.overall === 2, "the shipped bridge caps moved");
    const traced = v.rows.find(r => r.name === "us-traced");
    const road = v.rows.find(r => r.name === "cs-road-traced");
    const severed = v.rows.find(r => r.name === "us-severed-cut");
    need(traced.state === "TRACED" && traced.applied === true, "the default US conquest route must TRACE and apply");
    // D546: the CS Eastern pair was the load-bearing substrate gap; one authored road closes it.
    need(road.state === "TRACED" && road.applied === true,
      "the CS Eastern pair must trace over the authored road layer: " + JSON.stringify(road));
    // The no-penalty LAW is kept as a general invariant over every measured row rather than as a
    // fixture that only held while the board was disconnected.
    for (const r of v.rows)
      need(r.state !== "SUBSTRATE_GAP" || r.applied === false,
        "an unreachable-on-the-open-graph pair applied a penalty — our evidence gap may not become the player's: " + JSON.stringify(r));
    need(severed.state === "SEVERED" && severed.applied === true && severed.friction === 40,
      "a cut on the traced segment must SEVER and apply the bounded ceiling: " + JSON.stringify(severed));
    need(severed.depotReach < traced.depotReach,
      "a cut segment must degrade depotReach downstream: severed " + severed.depotReach + " vs traced " + traced.depotReach);
    return { nonConquestFrozen: true, caps: v.caps, rows: v.rows, outOfRange: 0 };
  });

  await step("CUT DEGRADES DOWNSTREAM: the cut bites only the armies whose line actually used it", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var base=mkConquest('US','mayhem');",
      "var beforeE=conquestSupplyTrace(base,'CT-03'),beforeSelf=conquestSupplyTrace(base,'CT-01');",
      "var C=mkConquest('US','mayhem');conquestSupplySetCondition(C,'CTS-R-02',true);",
      "var afterE=conquestSupplyTrace(C,'CT-03'),afterSelf=conquestSupplyTrace(C,'CT-01');",
      // an unrelated service cut must not touch the CT-03 line at all
      "var U=mkConquest('US','mayhem');conquestSupplySetCondition(U,'CTS-R-20',true);",
      "var unrelated=conquestSupplyTrace(U,'CT-03');",
      "var restored=mkConquest('US','mayhem');restored.engineering={levels:{construction:3}};conquestSupplySetCondition(restored,'CTS-R-02',true);conquestSupplySetCondition(restored,'CTS-R-02',false);",
      "var back=conquestSupplyTrace(restored,'CT-03');",
      "var rejected=[conquestSupplySetCondition(mkConquest('US','mayhem'),'CTS-R-99',true),conquestSupplySetCondition(mkConquest('US','mayhem'),'nonsense',true),conquestSupplySetControl(mkConquest('US','mayhem'),'CT-99','US')];",
      "return {beforeE:{s:beforeE.supplyState,f:beforeE.tracedFriction},afterE:{s:afterE.supplyState,f:afterE.tracedFriction,by:afterE.severedBy,cutCount:afterE.cutCount},",
      " beforeSelf:{s:beforeSelf.supplyState,f:beforeSelf.tracedFriction},afterSelf:{s:afterSelf.supplyState,f:afterSelf.tracedFriction},",
      " unrelated:{s:unrelated.supplyState,f:unrelated.tracedFriction,cutCount:unrelated.cutCount},back:{s:back.supplyState,f:back.tracedFriction,cutCount:back.cutCount},rejected:rejected};"
    ].join("")));
    need(v.beforeE.s === "TRACED" && v.afterE.s === "SEVERED", "cutting the traced segment did not sever the line");
    need(v.afterE.f > v.beforeE.f, "severing did not raise friction: " + v.beforeE.f + " -> " + v.afterE.f);
    need(JSON.stringify(v.afterE.by) === JSON.stringify(["CTS-R-02"]), "severedBy must name the exact cut service: " + JSON.stringify(v.afterE.by));
    need(v.afterE.cutCount === 1, "cutCount must count the live cut set");
    need(v.afterSelf.s === v.beforeSelf.s && v.afterSelf.f === v.beforeSelf.f,
      "the cut moved an army that was never downstream of it: " + JSON.stringify([v.beforeSelf, v.afterSelf]));
    need(v.unrelated.s === "TRACED" && v.unrelated.f === v.beforeE.f && v.unrelated.cutCount === 1,
      "an unrelated service cut changed the traced line: " + JSON.stringify(v.unrelated));
    need(v.back.s === "TRACED" && v.back.f === v.beforeE.f && v.back.cutCount === 0, "restoring a cut did not restore the line");
    need(v.rejected.every(x => x === null), "a mutator accepted an id that is not a live service or territory");
    return { severed: true, severedBy: v.afterE.by, unaffectedArmyHeld: true, restoreWorks: true, badIdsRejected: 3 };
  });

  // D546 CONTRACTED RESHAPE. This tooth asserted that a cross-component target "must stay an
  // un-applied gap until the road layer lands" and that the reason says the layer is "not built
  // yet" — both were the pre-Slice-5 truth BY CONSTRUCTION, and Slice 5 is the slice that lands
  // it. So it now proves the road layer CLOSES the gap, while the SUBSTRATE_GAP branch and its
  // no-penalty law stay present and correct as the defensive result for a genuinely unlinked pair.
  await step("THE ROAD LAYER CLOSES THE SUBSTRATE GAP: the eleven islands become one board and the no-penalty law survives", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var cs=mkConquest('CS','mayhem'),plainCS=mkPlain('CS');",
      "var t=conquestSupplyTrace(cs,null);",
      "var far=conquestSupplyTrace(mkConquest('US','mayhem'),'CT-20');",
      // every ordered CT pair must now be base-reachable from a depot: the board is ONE component
      "var B=_lgTraceBase({id:'mayhem',version:1}),ids=[],n,gapless=true;",
      "for(n=1;n<=36;n++)ids.push('CT-'+(n<10?'0':'')+n);",
      "for(n=0;n<ids.length;n++){if(!_lgTraceWalk(B.adj,'CT-05',ids[n],null).reachable){gapless=false;break;}}",
      // The board is now connected, so no live pair can produce SUBSTRATE_GAP. Rather than fake
      // one, prove the WALK still reports unreachability honestly on an empty projection — the
      // exact condition the branch keys on — and assert the branch's law from source below.
      "var isolated=_lgTraceWalk({},'CT-05','CT-03',null);",
      "var gap={reachable:isolated.reachable,segs:isolated.segments.length};",
      "return {t:{s:t.supplyState,applied:t.applied,f:t.tracedFriction,reachable:t.reachable,reached:t.reachedCount,reason:t.reason,label:t.label,depotName:t.depotName,segCount:t.segmentCount,modes:t.segments.map(function(x){return x.mode;})},",
      " far:{s:far.supplyState,applied:far.applied,f:far.tracedFriction}, gapless:gapless, gap:gap,",
      " frictionSame:_lgRoute(cs,null).friction===_lgRoute(plainCS,null).friction,",
      " conquestFriction:_lgRoute(cs,null).friction,plainFriction:_lgRoute(plainCS,null).friction,",
      " reachSame:logisticsSnapshot(cs).depotReach===logisticsSnapshot(plainCS).depotReach,",
      " netSame:logisticsSnapshot(cs).network===logisticsSnapshot(plainCS).network,",
      " block:_lgSupplyBlockHTML(cs)};"
    ].join("")));
    // The CS Eastern pair was the load-bearing SUBSTRATE_GAP at ca6b63e. One authored road closes it.
    need(v.t.s === "TRACED" && v.t.applied === true && v.t.f === 10 && v.t.reachable === true,
      "the CS/E pair must now trace over the authored road layer: " + JSON.stringify(v.t));
    need(v.t.segCount === 1 && v.t.modes.length === 1 && v.t.modes[0] === "road",
      "the CS/E line must run over exactly one authored road segment: " + JSON.stringify(v.t.modes));
    // The cross-component Western target likewise stops being a gap. It SEVERS rather than TRACES
    // because Nashville is Confederate in the authored opening and an enemy-held destination cuts
    // the line under the shipped traversal law — a real state, not an evidence hole.
    need(v.far.s === "SEVERED" && v.far.applied === true && v.far.f === 40,
      "the cross-component US/W target must resolve as a real severed line once the roads land: " + JSON.stringify(v.far));
    need(v.gapless === true, "no CT-nn pair may remain base-unreachable once the authored road layer lands");
    need(v.gap && v.gap.reachable === false && v.gap.segs === 0,
      "the walk no longer reports honest unreachability, so the SUBSTRATE_GAP branch could never fire");
    // The no-penalty law survives IN THE SEAM: the branch is still there, still un-applied, still
    // teaching, and it no longer tells the player the road layer is unbuilt (it is built now).
    const seam = read(SRC61);
    const gapBranch = seam.slice(seam.indexOf("if (!openWalk.reachable)"), seam.indexOf("} else if (liveWalk.reachable)"));
    need(/supplyState = "SUBSTRATE_GAP"/.test(gapBranch) && /applied = false/.test(gapBranch),
      "the SUBSTRATE_GAP branch must remain first-class and un-applied");
    need(/wagon/i.test(gapBranch) && /penalised/i.test(gapBranch),
      "the substrate-gap reason must still refuse to charge our own evidence hole to the player");
    need(!/not built yet/.test(seam), "the seam still claims the authored road layer is unbuilt");
    need(v.block.indexOf("Wagon road") >= 0 && v.block.indexOf("RDA-01") >= 0,
      "the player-facing block must name the road the line actually runs over");
    return { csEast: "TRACED", friction: 10, roadSegments: 1, gapStillFirstClass: true, boardConnected: true };
  });

  await step("TRACE CORRECTNESS: the sourced substrate is ELEVEN components and the walk is deterministic", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var g=_lgTraceGraph({id:'mayhem',version:1});",
      "var ids=[];for(var n=1;n<=36;n++)ids.push('CT-'+(n<10?'0':'')+n);",
      "var seen={},comps=[];",
      "var und={};for(var k in g){for(var e=0;e<g[k].length;e++){(und[k]=und[k]||[]).push(g[k][e].to);(und[g[k][e].to]=und[g[k][e].to]||[]).push(k);}}",
      "for(var i=0;i<ids.length;i++){if(seen[ids[i]])continue;var q=[ids[i]],c=[];seen[ids[i]]=1;",
      " while(q.length){var x=q.shift();c.push(x);var nb=und[x]||[];for(var j=0;j<nb.length;j++)if(!seen[nb[j]]){seen[nb[j]]=1;q.push(nb[j]);}}",
      " comps.push(c.length);}",
      "var t1=conquestSupplyTrace(mkConquest('US','mayhem'),null),t2=conquestSupplyTrace(mkConquest('US','mayhem'),null);",
      "var self=conquestSupplyTrace(mkConquest('US','mayhem'),'CT-01');",
      "var bogus=conquestSupplyTrace(mkConquest('US','mayhem'),'CT-99');",
      "return {comps:comps.sort(function(a,b){return b-a;}),det:JSON.stringify(t1)===JSON.stringify(t2),",
      " self:{r:self.reachable,seg:self.segmentCount},bogusTarget:bogus.target,us:{f:t1.tracedFriction,mix:t1.modeMix},services:Object.keys(_lgTraceBase({id:'mayhem',version:1}).services).length,",
      // D546: the ROADED base is one board; the SOURCED projection above is untouched at eleven.
      " roaded:(function(){var B=_lgTraceBase({id:'mayhem',version:1}),u={},sn={},o=[];for(var k in B.adj)for(var e=0;e<B.adj[k].length;e++){(u[k]=u[k]||[]).push(B.adj[k][e].to);(u[B.adj[k][e].to]=u[B.adj[k][e].to]||[]).push(k);}for(var i=0;i<ids.length;i++){if(sn[ids[i]])continue;var q=[ids[i]],c=0;sn[ids[i]]=1;while(q.length){var x=q.shift();c++;var nb=u[x]||[];for(var j=0;j<nb.length;j++)if(!sn[nb[j]]){sn[nb[j]]=1;q.push(nb[j]);}}o.push(c);}return o;})()};"
    ].join("")));
    need(v.comps.length === 11, "the sourced substrate no longer resolves to ELEVEN components: " + JSON.stringify(v.comps));
    need(JSON.stringify(v.comps) === JSON.stringify([18, 5, 4, 2, 1, 1, 1, 1, 1, 1, 1]), "component sizes moved: " + JSON.stringify(v.comps));
    need(v.det === true, "the walk is not deterministic across repeated calls");
    // D546 re-pin, CONSCIOUS: the base roster is 44 sourced services + the 17 authored road rows.
    // The ELEVEN-component / sourced assertions above read _lgTraceGraph and are DELIBERATELY
    // untouched — that is precisely why the road merge lives in _lgTraceBase and not in the
    // sourced projection, so the evidence substrate keeps proving itself unchanged.
    need(v.services === 61, "the base service roster moved: " + v.services + " (expected 44 sourced + 17 road rows)");
    need(JSON.stringify(v.roaded) === JSON.stringify([36]),
      "the authored road layer must join every territory into ONE board: " + JSON.stringify(v.roaded));
    need(v.self.r === true && v.self.seg === 0, "a depot-to-itself trace must resolve with zero segments");
    need(v.bogusTarget === "CT-03", "an unknown target must fall back to the authored theatre front");
    need(v.us.f === 7 && v.us.mix.rail === 1 && v.us.mix["inland-water"] === 0 && v.us.mix.sea === 0 && v.us.mix.road === 0,
      "the default US derivation moved: " + JSON.stringify(v.us));
    return { sourcedComponents: v.comps, roadedComponents: v.roaded, deterministic: true, baseServices: 61, sourcedServices: 44, usFriction: 7 };
  });

  await step("CF-2 MEMO: the cache equals a cold recompute, invalidates on a substrate swap, and is never state", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var view={id:'mayhem',version:1};",
      "_lgTraceMemo=null;",
      // D546: the memo now holds the sourced projection MERGED with the authored road graph, so
      // the cold comparison is the same merged construction. Roads are static and control- and
      // condition-independent, which is exactly the class the memo is contracted to hold.
      "var cold=_lgTraceRoadAdj(_lgTraceGraph(view));",
      "var first=_lgTraceBase(view);",
      "var second=_lgTraceBase(view);",
      "var hitSameRecord=(first===second);",
      "var equalsCold=(JSON.stringify(first.adj)===JSON.stringify(cold));",
      "var frozen=[Object.isFrozen(first.adj),Object.isFrozen(first.names),Object.isFrozen(first.services)];",
      // a swapped injected pack (new reference, identical content) MUST miss and recompute
      "GAME_DATA['conquest-transport-evidence']=JSON.parse(JSON.stringify(GAME_DATA['conquest-transport-evidence']));",
      "var afterSwap=_lgTraceBase(view);",
      "var recomputed=(afterSwap!==first);",
      "var stillEqual=(JSON.stringify(afterSwap.adj)===JSON.stringify(cold));",
      "GAME_DATA['conquest-territories']=JSON.parse(JSON.stringify(GAME_DATA['conquest-territories']));",
      "var afterSwap2=_lgTraceBase(view);",
      "var recomputed2=(afterSwap2!==afterSwap);",
      // the cache must never depend on, or outlive, control/condition
      "var C=mkConquest('US','mayhem');var before=conquestSupplyTrace(C,null).supplyState;",
      "conquestSupplySetCondition(C,'CTS-R-02',true);",
      "var after=conquestSupplyTrace(C,null).supplyState;",
      "var memoKeys=Object.keys(_lgTraceMemo);",
      "return {hitSameRecord:hitSameRecord,equalsCold:equalsCold,frozen:frozen,recomputed:recomputed,stillEqual:stillEqual,recomputed2:recomputed2,before:before,after:after,memoKeys:memoKeys};"
    ].join("")));
    need(v.equalsCold === true, "the memoized projection does not deep-equal a cold recompute");
    need(v.hitSameRecord === true, "a second call did not hit the cache");
    need(v.frozen.every(Boolean), "the cached projection is not frozen — it could be mutated in place");
    need(v.recomputed === true, "a swapped evidence pack did NOT invalidate the cache — a stale cache is a correctness bug");
    need(v.recomputed2 === true, "a swapped territory pack did NOT invalidate the cache");
    need(v.stillEqual === true, "the recomputed projection disagrees with the cold projection");
    need(v.before === "TRACED" && v.after === "SEVERED",
      "the cache masked a cut — control and condition must never be cached: " + v.before + " -> " + v.after);
    need(!v.memoKeys.includes("control") && !v.memoKeys.includes("cut") && !v.memoKeys.includes("supply"),
      "the cache holds mutable control/condition state: " + JSON.stringify(v.memoKeys));
    const src = read(SRC61);
    need(!/_lgTraceMemo[^\n]*(saveLocal|serializ|localStorage)/.test(src), "the cache is wired to a save owner");
    need(/var _lgTraceMemo = null;/.test(src), "the cache is not a single module-scoped declaration");
    return { equalsCold: true, cacheHit: true, invalidatesOnSwap: true, cutNeverCached: true, memoKeys: v.memoKeys };
  });

  await step("SAVE SHAPE: the envelope is purely additive, legacy bytes round-trip exactly, and a bad payload fails closed", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      // A LEGACY (pre-Slice-2, non-conquest) campaign. Every path Slice 2 introduces must leave its
      // bytes EXACTLY as found. `logisticsBridgeBonus` writing `logistics.lastBridge` is shipped D159
      // behavior that long predates this lane, so it is asserted separately and precisely: the shipped
      // owners may touch ONLY their own `logistics` namespace and may never create `conquest`.
      "var mkLegacy=function(){return {side:'US',idx:0,logistics:{schema:'cw_logistics_rail_v1',active:false,priority:null,log:[],lastTurn:null,lastBridge:null},warroom:{supply:50,nodes:{}},production:{},blockade:{}};};",
      "var legacy=mkLegacy();",
      "var before=JSON.stringify(legacy);",
      "var roundTrip=JSON.stringify(JSON.parse(before));",
      "_lgRoute(legacy,null);conquestSupplyTrace(legacy,null);_lgSupplyView(legacy);_lgSupplyBlockHTML(legacy);",
      "var afterCalls=JSON.stringify(legacy);",
      "var shipped=mkLegacy();logisticsSnapshot(shipped);logisticsBridgeBonus(shipped);presLogisticsBlock(shipped);",
      "var movedKeys=[];var baseline=mkLegacy();",
      "for(var kk in shipped)if(JSON.stringify(shipped[kk])!==JSON.stringify(baseline[kk]))movedKeys.push(kk);",
      "var gainedConquest=Object.prototype.hasOwnProperty.call(legacy,'conquest')||Object.prototype.hasOwnProperty.call(shipped,'conquest');",
      // fail-closed sanitizing: every malformed payload falls back to the authored opening, never partially adopted
      "function view(p){var C=mkConquest('US','mayhem');C.conquest.supply=p;return _lgSupplyView(C);}",
      "var bad=[view({schema:'wrong',cut:{'CTS-R-02':1}}),view({schema:'cw_conquest_supply_v1',control:{'CT-01':'XX'},cut:{}}),",
      " view({schema:'cw_conquest_supply_v1',control:{'nope':'US'},cut:{}}),view({schema:'cw_conquest_supply_v1',control:{},cut:{'CTS-R-02':2}}),",
      " view({schema:'cw_conquest_supply_v1',control:{},cut:{'bogus':1}}),view({schema:'cw_conquest_supply_v1',control:[],cut:{}}),",
      " view('nonsense'),view(null),view(42),",
      // D542: a malformed repair ledger fails CLOSED exactly like a malformed control/cut — the whole payload is rejected.
      " view({schema:'cw_conquest_supply_v1',control:{},cut:{},repair:{spent:-1}}),view({schema:'cw_conquest_supply_v1',control:{},cut:{},repair:{spent:'x'}}),",
      " view({schema:'cw_conquest_supply_v1',control:{},cut:{},repair:[]}),view({schema:'cw_conquest_supply_v1',control:{},cut:{},repair:5})];",
      "var good=view({schema:'cw_conquest_supply_v1',control:{'CT-03':'CS'},cut:{'CTS-R-02':1},repair:{spent:7}});",
      // a sealed conquest namespace must fail closed rather than throw
      "var sealed=mkConquest('US','mayhem');Object.freeze(sealed.conquest);",
      "var sealedWrite=conquestSupplySetCondition(sealed,'CTS-R-02',true);",
      "var sealedTrace=conquestSupplyTrace(sealed,null);",
      "return {legacyRoundTrip:before===roundTrip,legacyUntouched:before===afterCalls,gainedConquest:gainedConquest,movedKeys:movedKeys,",
      " badAdopted:bad.map(function(b){return b.adopted;}),badCuts:bad.map(function(b){return b.cutCount;}),badSpent:bad.map(function(b){return b.repairSpent;}),",
      " goodAdopted:good.adopted,goodCut:good.cutCount,goodControl:good.control['CT-03'],goodSpent:good.repairSpent,",
      " sealedWrite:sealedWrite,sealedTraceState:sealedTrace?sealedTrace.supplyState:null};"
    ].join("")));
    need(v.legacyRoundTrip === true, "a legacy campaign did not round-trip byte-identically");
    need(v.legacyUntouched === true, "a Slice 2 path mutated a legacy campaign — legacy save bytes MUST NOT move");
    need(v.gainedConquest === false, "the logistics path created a conquest namespace on a legacy campaign");
    need(JSON.stringify(v.movedKeys) === JSON.stringify(["logistics"]),
      "the shipped logistics owners touched a namespace other than their own: " + JSON.stringify(v.movedKeys));
    need(v.badAdopted.length === 13 && v.badAdopted.every(a => a === false),
      "a malformed control/condition/repair payload was adopted: " + JSON.stringify(v.badAdopted));
    need(v.badCuts.every(c => c === 0), "a malformed payload leaked a cut into the live view: " + JSON.stringify(v.badCuts));
    need(v.badSpent.every(s => s === 0), "a malformed repair payload leaked spent into the live view: " + JSON.stringify(v.badSpent));
    need(v.goodAdopted === true && v.goodCut === 1 && v.goodControl === "CS" && v.goodSpent === 7, "a well-formed control/cut/repair payload was not adopted");
    need(v.sealedWrite === null, "a sealed conquest namespace accepted a write");
    need(v.sealedTraceState === "TRACED", "a sealed conquest namespace must still read the authored opening");
    const shape = JSON.parse(read("tools/save-shape.json"));
    need(shape.saveVer === 1, "_SAVE_VER moved without a conscious decision; save-shape says " + shape.saveVer);
    need(Object.keys(shape.signatures).length === 7, "the save-shape signature set changed size");
    const region = read(SRC61).slice(read(SRC61).indexOf("LANE-022 Slices 1-2"), read(SRC61).indexOf("function _lgWord("));
    need(!/_SAVE_VER|saveLocal|applySave|importSave|exportSave|localStorage/.test(region),
      "the LANE-022 region touches a save owner — the state must ride the shipped envelope");
    return { saveVer: 1, additive: true, legacyByteIdentical: true, badPayloadsRejected: 13, signatures: 7 };
  });

  await step("REPAIR + FINITE CAPACITY (D542): repair costs bounded capacity, exhaustion forces the standing decision, the reset regenerates, and the B-5 slider governs magnitude", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "function mkC(cons,pon){var C=mkConquest('US','mayhem');C.engineering={levels:{construction:cons,pontoons:pon}};return C;}",
      "__preset=null;",
      // capacity derives from the shipped engineering levels; the B-5 realism lever scales it
      "var cap0=conquestRepairCapacity(mkC(0,0)),cap32=conquestRepairCapacity(mkC(3,2)),capMax=conquestRepairCapacity(mkC(3,3));",
      "__preset={attrition:1.3};var capHi=conquestRepairCapacity(mkC(3,3));",
      "__preset={attrition:0.7};var capLo=conquestRepairCapacity(mkC(3,3));",
      "__preset=null;",
      // a rail repair clears the cut and charges the rail mode-cost through the ledger
      "var C=mkC(3,0);conquestSupplySetCondition(C,'CTS-R-02',true);var before=_lgSupplyView(C).cutCount;var r=conquestSupplySetCondition(C,'CTS-R-02',false);",
      "var railRepaired={before:before,after:r.cutCount,spent:r.repairSpent};",
      // no corps -> refused, the cut stands, nothing charged
      "var N=mkC(0,0);conquestSupplySetCondition(N,'CTS-R-02',true);var nr=conquestSupplySetCondition(N,'CTS-R-02',false);var refused={after:nr.cutCount,spent:nr.repairSpent};",
      // finite capacity: cut every rail service with a small corps -> only SOME restorable this pass
      "var g=_lgTraceBase({id:'mayhem',version:1});var rail=[];for(var k in g.services)if(g.services[k]==='rail')rail.push(k);",
      "var F=mkC(1,0);for(var i=0;i<rail.length;i++)conquestSupplySetCondition(F,rail[i],true);",
      "var fcap=conquestRepairCapacity(F).capacity;",
      "var cleared=0;for(var i=0;i<rail.length;i++){var b=_lgSupplyView(F).cutCount;conquestSupplySetCondition(F,rail[i],false);if(_lgSupplyView(F).cutCount<b)cleared++;}",
      "var remAfter=_lgSupplyView(F).cutCount;var repExhausted=conquestSupplyRepairReport(F);",
      // the pass reset regenerates the budget and lets more repair proceed
      "_lgSupplyRepairReset(F);var spentReset=_lgSupplyView(F).repairSpent;for(var i=0;i<rail.length;i++)conquestSupplySetCondition(F,rail[i],false);var remReset=_lgSupplyView(F).cutCount;",
      // a water cut routes to the Pontoon branch and is unrepairable with zero pontoons
      "var W=mkC(3,0);var water=null;for(var k in g.services)if(g.services[k]==='inland-water'){water=k;break;}",
      "var waterRep=null;if(water){conquestSupplySetCondition(W,water,true);var wr=conquestSupplyRepairReport(W);waterRep={hasCut:_lgSupplyView(W).cutCount,firstBranch:wr.cuts[0].branch,firstRepairable:wr.cuts[0].repairable};}",
      "return {cap0:cap0.capacity,cap32:cap32.capacity,capMax:capMax.capacity,capHi:capHi.capacity,capLo:capLo.capacity,realismHi:capHi.realism,realismLo:capLo.realism,",
      " railRepaired:railRepaired,refused:refused,fcap:fcap,railCount:rail.length,cleared:cleared,remAfter:remAfter,",
      " repExhausted:repExhausted.exhausted,repRemaining:repExhausted.remaining,spentReset:spentReset,remReset:remReset,waterRep:waterRep};"
    ].join("")));
    need(v.cap0 === 4, "capacity with no engineering must be the authored base: " + v.cap0);
    need(v.cap32 === 32 && v.capMax === 37, "capacity must derive from Construction+Pontoon levels: " + JSON.stringify([v.cap32, v.capMax]));
    need(v.realismHi === 1.3 && v.realismLo === 0.7 && v.capHi < v.capMax && v.capLo >= v.capMax,
      "the B-5 slider (fldPresetResolve().attrition) must scale capacity — higher realism rebuilds slower: hi " + v.capHi + " mid " + v.capMax + " lo " + v.capLo);
    need(v.railRepaired.before === 1 && v.railRepaired.after === 0 && v.railRepaired.spent === 4,
      "a repair must clear the cut and charge the rail mode-cost: " + JSON.stringify(v.railRepaired));
    need(v.refused.after === 1 && v.refused.spent === 0,
      "a repair with no engineering corps must be refused, leaving the cut: " + JSON.stringify(v.refused));
    need(v.cleared > 0 && v.cleared < v.railCount && v.remAfter > 0,
      "finite capacity must clear SOME but not ALL cuts in one pass (the standing decision): fcap " + v.fcap + " cleared " + v.cleared + " of " + v.railCount);
    need(v.repExhausted === true && v.repRemaining < 4,
      "the report must mark the pass exhausted when a cut remains over budget: " + JSON.stringify([v.repExhausted, v.repRemaining]));
    need(v.spentReset === 0 && v.remReset < v.remAfter,
      "the pass reset must zero spent and let more repair proceed: " + JSON.stringify([v.spentReset, v.remReset, v.remAfter]));
    need(!v.waterRep || (v.waterRep.hasCut === 1 && v.waterRep.firstBranch === "pontoons" && v.waterRep.firstRepairable === false),
      "a water cut must route to the Pontoon branch and be unrepairable with zero pontoons: " + JSON.stringify(v.waterRep));
    return { capacity: [v.cap0, v.cap32, v.capMax], b5: [v.capHi, v.capMax, v.capLo], cleared: v.cleared, railCount: v.railCount, exhausted: v.repExhausted, resetWorks: v.spentReset === 0 };
  });

  // D546: the step NAME is re-pinned with the tooth. It said a sealed blockade SEVERS the import,
  // which was the pre-road truth; with the authored Carolina coastal road the seal now forces the
  // dearer interior line instead. A green step whose name asserts the opposite of what it checks
  // misleads every future reader of the log, so the name moves in the same commit as the assertion.
  await step("BLOCKADE SEA EDGE (D544/D546): an open runner port TRACES the CS coastal import, a sealed blockade forces the dearer interior road and flags it, US is unaffected, and the read is pure", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "function cs(ports){var C=mkConquest('CS','mayhem');if(ports!==undefined)C.blockade={portsOpen:ports};return C;}",
      "function tr(C,t){var x=conquestSupplyTrace(C,t);return {s:x.supplyState,ap:x.applied,f:x.tracedFriction,by:x.severedBy,imp:x.importClosed,seg:x.segments.map(function(y){return y.id+':'+y.mode;}),depot:x.depot,reason:x.reason};}",
      // D546: Charleston is no longer sea-ONLY — the authored Carolina coastal road gives the interior a dearer alternative
      "var charOpen=tr(cs(4),'CT-11'),charSealed=tr(cs(0),'CT-11'),charDefault=tr(cs(),'CT-11');",
      "var westOpen=tr(cs(4),'CT-20'),westSealed=tr(cs(0),'CT-20');",
      // both directions: a reopened blockade restores the line
      "var reopened=tr(cs(2),'CT-11');",
      // US has no Confederate import source, so the blockade never moves it (still a gap)
      "var usSealed=conquestSupplyTrace((function(){var C=mkConquest('US','mayhem');C.blockade={portsOpen:0};return C;})(),'CT-11');",
      "var usOpen=conquestSupplyTrace((function(){var C=mkConquest('US','mayhem');C.blockade={portsOpen:4};return C;})(),'CT-11');",
      // capturing the import port removes it as a source (not a free pass, not a sea sever)
      "var LOST=mkConquest('CS','mayhem');LOST.blockade={portsOpen:4};conquestSupplySetControl(LOST,'CT-12','US');var portLost=tr(LOST,'CT-11');",
      // a malformed blockade defaults OPEN, the 1861 opening
      "var bad=tr((function(){var C=mkConquest('CS','mayhem');C.blockade={portsOpen:'x'};return C;})(),'CT-11');",
      // the sea-edge read is PURE over C.blockade — the sibling state is never mutated
      "var P=cs(0);var before=JSON.stringify(P.blockade);conquestSupplyTrace(P,'CT-11');conquestSupplyTrace(P,'CT-20');var pure=JSON.stringify(P.blockade)===before&&!Object.prototype.hasOwnProperty.call(P.conquest,'supply');",
      // the CS carrier's capped bridge stays inside the shipped caps in both blockade states
      "function active(C){var L=logisticsInit(C);L.active=true;L.priority='railheads';return C;}",
      "var caps=_lgCfg().bridgeCaps,bo=logisticsBridgeBonus(active(cs(4))),bs=logisticsBridgeBonus(active(cs(0)));",
      "var capsOk=[bo,bs].every(function(b){return b.supply>=0&&b.supply<=caps.supply&&b.fatigueRelief>=0&&b.fatigueRelief<=caps.fatigueRelief&&b.overall>=0&&b.overall<=caps.overall;});",
      "return {charOpen:charOpen,charSealed:charSealed,charDefault:charDefault,westOpen:westOpen,westSealed:westSealed,reopened:reopened,",
      " usSealed:usSealed.supplyState,usOpen:usOpen.supplyState,usSealedF:usSealed.tracedFriction,usOpenF:usOpen.tracedFriction,",
      " usModes:usSealed.segments.map(function(y){return y.mode;}),usImp:usSealed.importClosed,",
      " portLost:portLost,bad:bad,pure:pure,capsOk:capsOk};"
    ].join("")));
    // Charleston, the sea-only target
    need(v.charOpen.s === "TRACED" && v.charOpen.ap === true && v.charOpen.f === 8
      && JSON.stringify(v.charOpen.seg) === JSON.stringify(["CTS-S-01:sea"]) && v.charOpen.depot === "CT-12",
      "an open blockade must TRACE the Charleston sea import via CTS-S-01: " + JSON.stringify(v.charOpen));
    // D546 CONTRACTED RE-PIN. Before the road layer a sealed blockade left Charleston with no line
    // at all, so it severed at the ceiling. The authored Carolina coastal road now gives the
    // interior a real, dearer alternative, so sealing the ports moves the line from one sea segment
    // at 8 to a four-segment interior haul at 19 and flags the closed import instead of severing.
    // The lever still bites, and it now teaches the §5 point: the road is there, and it costs you.
    need(v.charSealed.s === "TRACED" && v.charSealed.ap === true && v.charSealed.f === 19
      && v.charSealed.depot === "CT-05" && v.charSealed.imp === true && /blockade/i.test(v.charSealed.reason),
      "a sealed blockade must push the Charleston import onto the dearer interior road line and flag the closed import: " + JSON.stringify(v.charSealed));
    need(v.charSealed.f > v.charOpen.f,
      "sealing the blockade must still raise Charleston's friction: open " + v.charOpen.f + " vs sealed " + v.charSealed.f);
    need(v.charSealed.seg.some(x => x.indexOf(":road") >= 0) && !v.charSealed.seg.some(x => x.indexOf(":sea") >= 0),
      "the sealed-blockade fallback must run overland and use no sea segment: " + JSON.stringify(v.charSealed.seg));
    need(v.charDefault.s === "TRACED", "a CS carrier with no blockade state must default OPEN (the 1861 opening): " + JSON.stringify(v.charDefault));
    // the Western front, import-sourced rail from Savannah
    // D546 CONTRACTED RE-PIN: the Great Valley road lets the interior depot reach Nashville
    // overland, so the Western front is no longer import-sourced and the blockade cannot close it.
    // That is the honest post-road result — the blockade shuts a COASTAL door, not an inland one.
    need(v.westOpen.s === "TRACED" && v.westOpen.ap === true && v.westSealed.s === "TRACED"
      && v.westSealed.f === v.westOpen.f,
      "the Western front must trace overland in BOTH blockade states once the Great Valley road lands: " + JSON.stringify([v.westOpen, v.westSealed]));
    need(v.westSealed.seg.some(x => x.indexOf(":road") >= 0),
      "the Western front's overland line must actually use the authored road: " + JSON.stringify(v.westSealed.seg));
    // both directions
    need(v.reopened.s === "TRACED" && v.reopened.f === v.charOpen.f, "a reopened blockade must restore the traced import line: " + JSON.stringify(v.reopened));
    // US is never moved by the blockade
    // D546 CONTRACTED RE-PIN. The old fixture read SUBSTRATE_GAP because before the roads the Union
    // could not reach Charleston at all. The LAW it was standing in for is what matters and is
    // unchanged: the Confederate import edge is Confederate, so the blockade must move the US side
    // by exactly nothing, and no US line may ever run over a sea segment or flag a closed import.
    need(v.usSealed === v.usOpen && v.usSealedF === v.usOpenF,
      "the blockade moved the US side: sealed " + v.usSealed + "/" + v.usSealedF + " open " + v.usOpen + "/" + v.usOpenF);
    need(!v.usModes.some(m => m === "sea") && v.usImp === false,
      "the US side gained a Confederate sea import: " + JSON.stringify(v.usModes) + " importClosed=" + v.usImp);
    // Losing the port removes the source. D546 CONTRACTED RE-PIN: the fallback used to be a
    // substrate gap because the interior could not reach the coast at all; the authored Carolina
    // coastal road now carries it, dearer, so the fallback is a real interior line instead.
    need(v.portLost.depot === "CT-05" && v.portLost.s === "TRACED"
      && !v.portLost.seg.some(x => x.indexOf(":sea") >= 0) && v.portLost.f > v.charOpen.f,
      "capturing the import port must remove it as a source, falling back to the dearer interior depot line: " + JSON.stringify(v.portLost));
    need(v.bad.s === "TRACED", "a malformed blockade payload must default OPEN, never crash or seal: " + JSON.stringify(v.bad));
    need(v.pure === true, "the sea-edge read mutated C.blockade or wrote into C.conquest — the path must be pure");
    need(v.capsOk === true, "a blockade state pushed the capped bridge outside the shipped caps");
    // D546: the reported value is MEASURED, not a literal. It was hardcoded "SUBSTRATE_GAP" from
    // the Slice-4 build, so after this slice's re-pin the artifact recorded the exact opposite of
    // what the assertion above it proved. A green artifact that contradicts its own tooth is worse
    // than a red one, so the reported values now come from the measurement.
    return { charleston: [v.charOpen.f, v.charSealed.f], charSealedImportClosed: v.charSealed.imp,
      west: [v.westOpen.f, v.westSealed.f], usUnmoved: true,
      portLost: { state: v.portLost.s, depot: v.portLost.depot, friction: v.portLost.f },
      pureRead: true, capsHeld: true };
  });

  await step("SUBSTRATE IMMUTABILITY: tracing never writes the evidence pack, the board, or module 115", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var before=[JSON.stringify(conquestTransportNormalized()),JSON.stringify(conquestBoardNormalized()),JSON.stringify(GAME_DATA)];",
      "for(var i=0;i<5;i++){conquestSupplyTrace(mkConquest('US','mayhem'),null);conquestSupplyTrace(mkConquest('CS','mayhem'),'CT-20');_lgRoute(mkConquest('US','mayhem'),null);",
      " var C=mkConquest('US','mayhem');conquestSupplySetCondition(C,'CTS-R-02',true);conquestSupplySetControl(C,'CT-03','CS');conquestSupplyTrace(C,null);}",
      "var after=[JSON.stringify(conquestTransportNormalized()),JSON.stringify(conquestBoardNormalized()),JSON.stringify(GAME_DATA)];",
      "return {same:before[0]===after[0]&&before[1]===after[1]&&before[2]===after[2],road:conquestTransportNormalized().roadStatus};"
    ].join("")));
    need(v.same === true, "tracing or cutting mutated the read-only substrate, the board, or the injected data");
    need(v.road === "ROAD_REQUIRES_BOUNDED_SOURCE_PASS", "the zero-road authority moved");
    const s115 = read("src/115-conquest-transport.js");
    for (const token of ["conquestSupplyTrace", "_LG_TRACE", "_LG_SUPPLY", "campaignKind", "logisticsInit", "_lgRoute"])
      need(!s115.includes(token), "the immutable substrate gained a LANE-022 token: " + token);
    return { substrateUnchanged: true, roadServices: 0 };
  });

  await step("NO NEW AUTHORITY: the seam consumes services only, and creates no period, road, or interchange", () => {
    const run = diskSeam();
    const v = JSON.parse(run([
      "var C=mkConquest('US','mayhem');conquestSupplySetCondition(C,'CTS-R-02',true);",
      "var text=JSON.stringify([conquestSupplyTrace(mkConquest('US','mayhem'),null),conquestSupplyTrace(mkConquest('CS','mayhem'),null),conquestSupplyTrace(C,null),_lgSupplyView(C)]);",
      "var pack=conquestTransportNormalized();",
      "var ctiSeen=false,nlSeen=false;",
      "for(var i=0;i<pack.interchanges.length;i++)if(text.indexOf(pack.interchanges[i].id)>=0)ctiSeen=true;",
      "for(var j=0;j<pack.nonLinks.length;j++)if(text.indexOf(pack.nonLinks[j].id)>=0)nlSeen=true;",
      "return {text:text,cti:ctiSeen,nl:nlSeen,modes:conquestSupplyTrace(mkConquest('US','mayhem'),null).segments.map(function(s){return s.mode;})};"
    ].join("")));
    need(v.cti === false, "an interchange face leaked into the seam — CTI-01..CTI-04 stay unadjudicated");
    need(v.nl === false, "an explicit non-link leaked into the seam as a usable segment");
    for (const forbidden of ["dateText", "historicalEligibility", "eligibility", "window", "roadService", "RD-E1", "legalNow", "availability"])
      need(v.text.indexOf(forbidden) < 0, "the seam manufactured a forbidden authority field: " + forbidden);
    // D546 CONTRACTED RESHAPE, strictly tighter than the blanket "RD-" ban it replaces: Slice 5
    // legitimately surfaces the two CURED road rows, so the rule is now that every road id the
    // seam can emit is one of those two or the authored RDA- namespace, and never one of the four
    // rows the road research left UNRESOLVED (still banned outright, above).
    const emitted = [...new Set((v.text.match(/\b(?:RD-[A-Z]+\d\d|RDA-\d\d)\b/g) || []))];
    for (const id of emitted)
      need(/^RD-SI(06|13)$/.test(id) || /^RDA-\d\d$/.test(id), "the seam emitted an unauthorised road id: " + id);
    need(v.modes.every(m => m === "rail" || m === "inland-water" || m === "sea"), "a non-service mode entered the trace: " + JSON.stringify(v.modes));
    const src = read(SRC61);
    for (const forbidden of ["dateText", "historicalEligibility", "roadStatus", "interchanges", "nonLinks"])
      need(!src.includes(forbidden), "the seam reads an authority it may not consume: " + forbidden);
    return { interchanges: 0, nonLinks: 0, forbiddenFields: 0 };
  });

  await step("D74: the seam writes no scoreboard, no save owner, no DOM and no RNG", () => {
    const src = read(SRC61);
    const from = src.indexOf("LANE-022 Slices 1-2");
    const to = src.indexOf("function _lgWord(");
    need(from > 0 && to > from, "the LANE-022 region markers are missing from the seam");
    const region = src.slice(from, to);
    const forbidden = [
      [/\.(men|cas|aCas|bCas)\s*(\+=|-=|=)(?!=)/, "a strength or casualty count"],
      [/\.victory\s*=(?!=)/, "the victory result"],
      [/\.(strength|maxStr|morale|maxMor|ammo)\s*(\+=|-=|=)(?!=)/, "a Classic or modern combat field"],
      [/\bsev\./, "a severity lever"],
      [/saveLocal|applySave|importSave|exportSave|localStorage|_SAVE_VER/, "a save owner"],
      [/\bdocument\b|openSheet|innerHTML/, "a DOM or UI owner"],
      [/Math\.random|\bRNG\b|_rng/, "RNG state"],
      [/\bG\.|\bwindow\./, "a global campaign authority"]
    ];
    for (const [re, what] of forbidden) need(!re.test(region), "the LANE-022 region writes/reads " + what + ": " + String((region.match(re) || [""])[0]).trim());
    // D540: C.conquest.supply IS the contracted namespace, but ONLY the two declared mutators may write it.
    const writes = (region.match(/\bq\.supply\s*=|\bs\.(control|cut)\s*=|\bs\.(control|cut)\[/g) || []).length;
    need(/function _lgSupplyStore\(/.test(region), "the single guarded store accessor is missing");
    need((region.match(/function conquestSupplySet(Condition|Control)\(/g) || []).length === 2, "the seam must expose exactly two mutators");
    need(!/C\.conquest\.supply\s*=/.test(region), "the seam writes C.conquest.supply outside the guarded store accessor");
    need(writes > 0 && writes <= 8, "unexpected number of store writes in the region: " + writes);
    const run = diskSeam();
    const v = JSON.parse(run([
      // Every READ path Slice 2 introduces must be pure over its carrier. `logisticsInit` creating
      // `C.logistics` inside presLogisticsBlock is shipped D159 behavior and is asserted separately:
      // the shipped readout may add its own owner but must never reach the conquest namespace.
      "var C=mkConquest('US','mayhem');var before=JSON.stringify(C);",
      "conquestSupplyTrace(C,null);_lgRoute(C,null);_lgSupplyView(C);_lgSupplyBlockHTML(C);",
      "var readsPure=JSON.stringify(C)===before;",
      "var D=mkConquest('US','mayhem');var q=JSON.stringify(D.conquest);",
      "logisticsSnapshot(D);presLogisticsBlock(D);",
      "return {readsPure:readsPure,keys:Object.keys(C),conquestUntouched:JSON.stringify(D.conquest)===q,shippedKeys:Object.keys(D)};"
    ].join("")));
    need(v.readsPure === true, "a Slice 2 READ path mutated its own carrier: " + JSON.stringify(v.keys));
    need(v.conquestUntouched === true, "the shipped readout wrote into the conquest namespace: " + JSON.stringify(v.shippedKeys));
    return { scoreboardWrites: 0, saveWrites: 0, readPathsPure: true, mutators: 2, regionBytes: region.length };
  });

  await step("ENROLMENT: no new module, no new probe, no data change, and the suite is unmoved", () => {
    const manifest = JSON.parse(read("src/00-manifest.json"));
    const vet = read("tools/vet-no-regression.mjs");
    const rows = ((/const SUITE = \[([\s\S]*?)\n\];/.exec(vet) || [null, ""])[1].match(/^\s*\['/gm) || []).length;
    need(manifest.modules.length === 112, "Slice 2 must add no module; manifest is " + manifest.modules.length);
    need(manifest.modules.at(-1) === "116-conquest-state.js", "manifest tail moved");
    need(rows === 142, "Slice 2 adds no probe; the suite must stay 142, counted " + rows);
    need(vet.includes("tools/probe-conquest-supply.mjs") && vet.includes("tools/probe-conquest-supply-plan.mjs"), "a LANE-022 probe is not enrolled");
    return { modules: 112, last: manifest.modules.at(-1), suite: rows };
  });

  /* ===================== BROWSER / BUILT-DELIVERABLE HALF ================= */

  const url = `${cfg.baseUrl}/${cfg.file}`;
  if (!(await up(url))) {
    server = spawn("python3", ["-m", "http.server", String(cfg.port)], { cwd: ROOT, stdio: "ignore" });
    for (let i = 0; i < 80 && !await up(url); i++) await sleep(150);
  }
  try { browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-dev-shm-usage"] }); }
  catch { browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--disable-dev-shm-usage"] }); }
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  page.setDefaultTimeout(10000);
  page.on("pageerror", e => result.pageerrors.push(String(e && e.message || e)));
  page.on("console", m => { if (m.type() === "error" && !/Failed to load resource.*404/.test(m.text())) result.realErrors.push(m.text()); });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(350);

  await step("IN PAGE: the built deliverable carries the seam and holds containment in both directions", () => page.evaluate(() => {
    if (typeof conquestSupplyTrace !== "function") throw new Error("conquestSupplyTrace is absent from the built game");
    if (typeof conquestSupplySetCondition !== "function" || typeof conquestSupplySetControl !== "function") throw new Error("the D540 mutators are absent from the built game");
    const mk = (side, id) => ({ side, campaignKind: { id: "conquest", version: 1 }, ruleset: { id, version: 1 }, conquest: {} });
    const open = conquestSupplyTrace(mk("US", "mayhem"), null);
    const gated = conquestSupplyTrace(mk("US", "historical"), null);
    const plain = conquestSupplyTrace({ side: "US" }, null);
    if (!open || open.rulesetId !== "mayhem" || open.authored !== true) throw new Error("open-ruleset trace missing in page");
    if (open.supplyState !== "TRACED" || open.applied !== true) throw new Error("in-page default route did not TRACE and apply");
    if (open.segments.length !== 1 || open.segments[0].id !== "CTS-R-02") throw new Error("in-page default route moved");
    if (gated !== null) throw new Error("IN-PAGE CONTAINMENT LEAK: the evidence-gated ruleset produced a trace");
    if (plain !== null) throw new Error("a non-conquest carrier produced a trace in page");
    const gatedState = mk("US", "historical");
    if (conquestSupplySetCondition(gatedState, "CTS-R-02", true) !== null) throw new Error("IN-PAGE CONTAINMENT LEAK: a cut was written on the gated ruleset");
    if (conquestSupplySetControl(gatedState, "CT-03", "CS") !== null) throw new Error("IN-PAGE CONTAINMENT LEAK: control was written on the gated ruleset");
    if (Object.keys(gatedState.conquest).length !== 0) throw new Error("IN-PAGE CONTAINMENT LEAK: the gated carrier gained supply state");
    const r = _lgRoute(mk("US", "mayhem"), null), g = _lgRoute(mk("US", "historical"), null), p = _lgRoute({ side: "US" }, null);
    if (Object.keys(r).length !== 7 || Object.keys(g).length !== 6 || Object.keys(p).length !== 6) throw new Error("in-page route key counts drifted");
    if (g.friction !== p.friction) throw new Error("in-page friction moved on a gated conquest carrier");
    if (r.friction !== open.tracedFriction) throw new Error("in-page applied friction was not adopted from the trace");
    // the cut must bite in page too
    const cut = mk("US", "mayhem");
    conquestSupplySetCondition(cut, "CTS-R-02", true);
    const severed = conquestSupplyTrace(cut, null);
    if (severed.supplyState !== "SEVERED" || severed.applied !== true) throw new Error("in-page cut did not sever the line");
    if (_lgRoute(cut, null).friction <= r.friction) throw new Error("in-page severed friction did not rise");
    return { open: open.segments[0].id, gated: null, routeKeys: [7, 6, 6], traced: r.friction, severed: _lgRoute(cut, null).friction };
  }));

  await step("IN PAGE (D542): repair costs finite engineering capacity, exhaustion forces a choice, and the live B-5 preset governs magnitude", () => page.evaluate(() => {
    if (typeof conquestRepairCapacity !== "function" || typeof conquestSupplyRepairReport !== "function" || typeof _lgSupplyRepairReset !== "function")
      throw new Error("the D542 repair surface is absent from the built game");
    if (typeof G === "undefined" || !G) throw new Error("no live G to read the B-5 preset from");
    const mk = (cons, pon) => ({ side: "US", campaignKind: { id: "conquest", version: 1 }, ruleset: { id: "mayhem", version: 1 }, conquest: {}, engineering: { levels: { construction: cons, pontoons: pon } } });
    const saved = G.settings ? G.settings.tacticalPreset : undefined;
    G.settings = G.settings || {};
    try {
      // a corps clears a rail cut and charges the ledger; no corps refuses and the cut stands
      const rep = mk(3, 0); conquestSupplySetCondition(rep, "CTS-R-02", true);
      const done = conquestSupplySetCondition(rep, "CTS-R-02", false);
      if (done.cutCount !== 0 || done.repairSpent !== 4) throw new Error("in-page repair did not clear and charge: " + JSON.stringify(done));
      const noCorps = mk(0, 0); conquestSupplySetCondition(noCorps, "CTS-R-02", true);
      if (conquestSupplySetCondition(noCorps, "CTS-R-02", false).cutCount !== 1) throw new Error("in-page repair with no corps was not refused");
      // the LIVE B-5 preset scales capacity: a stricter realism rebuilds slower
      G.settings.tacticalPreset = { attrition: 1.3 };
      const capHi = conquestRepairCapacity(mk(3, 3)).capacity;
      G.settings.tacticalPreset = { attrition: 0.7 };
      const capLo = conquestRepairCapacity(mk(3, 3)).capacity;
      if (!(capHi < capLo)) throw new Error("in-page B-5 slider did not scale repair capacity: hi " + capHi + " lo " + capLo);
      // finite capacity in page: a small corps clears only SOME of many cuts, then the reset regenerates
      const g = _lgTraceBase({ id: "mayhem", version: 1 });
      const rail = Object.keys(g.services).filter(k => g.services[k] === "rail");
      const F = mk(1, 0); for (const k of rail) conquestSupplySetCondition(F, k, true);
      let cleared = 0; for (const k of rail) { const b = _lgSupplyView(F).cutCount; conquestSupplySetCondition(F, k, false); if (_lgSupplyView(F).cutCount < b) cleared++; }
      const remAfter = _lgSupplyView(F).cutCount, rep2 = conquestSupplyRepairReport(F);
      _lgSupplyRepairReset(F);
      if (_lgSupplyView(F).repairSpent !== 0) throw new Error("in-page reset did not zero the pass ledger");
      if (!(cleared > 0 && cleared < rail.length && remAfter > 0 && rep2.exhausted === true)) throw new Error("in-page finite capacity failed: cleared " + cleared + " of " + rail.length);
      return { capHi, capLo, cleared, railCount: rail.length, remAfter, refused: true, exhausted: rep2.exhausted };
    } finally {
      if (saved === undefined) delete G.settings.tacticalPreset; else G.settings.tacticalPreset = saved;
    }
  }));

  await step("IN PAGE (D544): the blockade opens and seals the CS coastal import in the built deliverable, and US is unaffected", () => page.evaluate(() => {
    if (typeof conquestSupplyTrace !== "function") throw new Error("conquestSupplyTrace is absent from the built game");
    const cs = ports => ({ side: "CS", campaignKind: { id: "conquest", version: 1 }, ruleset: { id: "mayhem", version: 1 }, conquest: {}, blockade: { portsOpen: ports } });
    const open = conquestSupplyTrace(cs(4), "CT-11");
    const sealed = conquestSupplyTrace(cs(0), "CT-11");
    if (!open || open.supplyState !== "TRACED" || open.segments.length !== 1 || open.segments[0].id !== "CTS-S-01" || open.tracedFriction !== 8)
      throw new Error("in-page open blockade did not TRACE the Charleston sea import: " + JSON.stringify(open && { s: open.supplyState, f: open.tracedFriction }));
    // D546 contracted re-pin: the authored road gives the interior a dearer alternative, so sealing
    // the ports pushes Charleston overland at higher friction and flags the closed import.
    if (!sealed || sealed.supplyState !== "TRACED" || sealed.tracedFriction !== 19 || sealed.importClosed !== true
      || sealed.depot !== "CT-05" || !sealed.segments.some(x => x.mode === "road") || sealed.segments.some(x => x.mode === "sea"))
      throw new Error("in-page sealed blockade did not push the Charleston import onto the interior road: " + JSON.stringify(sealed && { s: sealed.supplyState, f: sealed.tracedFriction, imp: sealed.importClosed }));
    if (!(sealed.tracedFriction > open.tracedFriction))
      throw new Error("in-page sealing the blockade did not raise Charleston friction");
    const westOpen = conquestSupplyTrace(cs(4), "CT-20"), westSealed = conquestSupplyTrace(cs(0), "CT-20");
    if (westOpen.supplyState !== "TRACED" || westSealed.supplyState !== "TRACED" || westSealed.tracedFriction !== westOpen.tracedFriction)
      throw new Error("in-page Western front must trace overland in both blockade states once the road lands");
    const usSealed = conquestSupplyTrace({ side: "US", campaignKind: { id: "conquest", version: 1 }, ruleset: { id: "mayhem", version: 1 }, conquest: {}, blockade: { portsOpen: 0 } }, "CT-11");
    const usOpenPage = conquestSupplyTrace({ side: "US", campaignKind: { id: "conquest", version: 1 }, ruleset: { id: "mayhem", version: 1 }, conquest: {}, blockade: { portsOpen: 4 } }, "CT-11");
    if (usSealed.supplyState !== usOpenPage.supplyState || usSealed.tracedFriction !== usOpenPage.tracedFriction
      || usSealed.segments.some(x => x.mode === "sea") || usSealed.importClosed !== false)
      throw new Error("in-page US side moved with the Confederate blockade: " + JSON.stringify({ s: usSealed.supplyState, f: usSealed.tracedFriction, imp: usSealed.importClosed }));
    return { open: open.tracedFriction, sealed: sealed.tracedFriction, west: [westOpen.tracedFriction, westSealed.tracedFriction], usUnmoved: true };
  }));

  await step("IN PAGE: repeated tracing is pure — no G, C, save, storage, DOM, or board movement", () => page.evaluate(() => {
    const snap = () => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); storage[k] = localStorage.getItem(k); }
      return {
        g: typeof G === "undefined" ? "__absent__" : JSON.stringify(G),
        storage: JSON.stringify(storage),
        dom: document.body.innerHTML.length,
        board: typeof conquestBoardNormalized === "function" ? JSON.stringify(conquestBoardNormalized()) : "__absent__",
        transport: typeof conquestTransportNormalized === "function" ? JSON.stringify(conquestTransportNormalized()) : "__absent__"
      };
    };
    const mk = (side, id) => ({ side, campaignKind: { id: "conquest", version: 1 }, ruleset: { id, version: 1 }, conquest: {} });
    const before = snap();
    for (let i = 0; i < 5; i++) {
      conquestSupplyTrace(mk("US", "mayhem"), null);
      conquestSupplyTrace(mk("CS", "mayhem"), "CT-20");
      _lgRoute(mk("US", "mayhem"), null);
      _lgSupplyView(mk("US", "mayhem"));
      const c = mk("US", "mayhem"); conquestSupplySetCondition(c, "CTS-R-02", true); conquestSupplyTrace(c, null);
    }
    const after = snap();
    for (const k of Object.keys(before)) if (before[k] !== after[k]) throw new Error("repeated tracing or cutting moved " + k);
    const a = JSON.stringify(logisticsBridgeBonus({ side: "US" }));
    const b = JSON.stringify(logisticsBridgeBonus({ side: "US" }));
    if (a !== b) throw new Error("in-page non-conquest capped bridge is not stable");
    return { calls: 25, writes: 0, nonConquestStable: true };
  }));

  await step("IN PAGE: the shipped readout is byte-identical off-conquest and gains exactly one guarded block on it", () => page.evaluate(() => {
    if (typeof presLogisticsBlock !== "function") throw new Error("presLogisticsBlock is absent");
    const plain = presLogisticsBlock({ side: "US" });
    const plain2 = presLogisticsBlock({ side: "US" });
    if (plain !== plain2) throw new Error("the shipped readout is not stable on a non-conquest carrier");
    if (/CT-\d\d|CTS-[RWS]-\d\d|Conquest supply line/.test(plain)) throw new Error("a conquest surface leaked into the NON-conquest readout");
    if (!/Rail &amp; Supply Network/.test(plain)) throw new Error("the shipped readout heading is gone");
    const mk = { side: "US", campaignKind: { id: "conquest", version: 1 }, ruleset: { id: "mayhem", version: 1 }, conquest: {} };
    const conquest = presLogisticsBlock(mk);
    if (conquest === plain) throw new Error("the conquest carrier did not gain the supply-line block");
    if (!conquest.startsWith(plain.slice(0, 400))) throw new Error("the shipped readout head changed on a conquest carrier");
    const blocks = (conquest.match(/Conquest supply line/g) || []).length;
    if (blocks !== 1) throw new Error("expected exactly one guarded conquest block, found " + blocks);
    if (!/Traced/.test(conquest) || !/CTS-R-02/.test(conquest)) throw new Error("the conquest block does not show the traced state and its segment");
    const gated = presLogisticsBlock({ side: "US", campaignKind: { id: "conquest", version: 1 }, ruleset: { id: "historical", version: 1 }, conquest: {} });
    if (gated !== plain) throw new Error("IN-PAGE CONTAINMENT LEAK: the gated ruleset rendered a conquest supply block");
    const cut = { side: "US", campaignKind: { id: "conquest", version: 1 }, ruleset: { id: "mayhem", version: 1 }, conquest: {} };
    conquestSupplySetCondition(cut, "CTS-R-02", true);
    const severedHtml = presLogisticsBlock(cut);
    if (!/Severed/.test(severedHtml)) throw new Error("a cut line does not read as severed in the readout");
    return { plainBytes: plain.length, conquestBytes: conquest.length, blocks: 1, gatedIdenticalToPlain: true };
  }));

  if (result.pageerrors.length || result.realErrors.length) { result.ok = false; result.errors.push("browser errors present"); }
} catch (e) {
  result.ok = false;
  result.errors.push(String(e && e.stack || e));
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill("SIGTERM");
}

result.summary = { passed: result.steps.filter(s => s.ok).length, total: result.steps.length };
writeFileSync(ART, JSON.stringify(result, null, 2) + "\n");
console.log(`probe-conquest-supply: ${result.summary.passed}/${result.summary.total} steps ok, ${result.failed.length} fail; pageerrors=${result.pageerrors.length}; realErrors=${result.realErrors.length}`);
if (!result.ok) { for (const f of result.failed) console.error("FAIL", f); process.exit(1); }
console.log("ALL OK");
