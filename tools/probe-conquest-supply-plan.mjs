#!/usr/bin/env node
// D538 / LANE-022 Slice 1 filesystem-first contract probe — zero dependencies, no browser.
//
// Every tooth is anchored on DURABLE law and history: ratified decisions, the design-law boundary
// sentences, the committed acceptance contract, immutable substrate hashes, and live counts. NOTHING
// here reads a lane's current Owning tool or State, so a lane release or provider transfer can never
// red this probe (the D391 lane-transfer lesson). It also never reads the containment allowlist
// literal — that assertion belongs to the focused probe, which owns the declared D538 bind.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = join(HERE, "shots");
const ART = join(OUT, "probe-conquest-supply-plan.json");
mkdirSync(OUT, { recursive: true });
const read = rel => readFileSync(join(ROOT, rel), "utf8");
const md5 = rel => createHash("md5").update(readFileSync(join(ROOT, rel))).digest("hex");
const steps = [];
const need = (v, m) => { if (!v) throw new Error(m); };
const count = (t, x) => t.split(x).length - 1;
function step(name, fn) {
  try { const v = fn(); steps.push({ name, ok: true, v: v === undefined ? null : v }); }
  catch (e) { steps.push({ name, ok: false, err: String(e && e.message || e) }); }
}

const LANE = (/### LANE-022 · conquest-mayhem-supply-ladder[\s\S]*?(?=\n### LANE-\d+ ·|\n## \d+ ·|$)/
  .exec(read("COORDINATION.md")) || [])[0] || "";
const SRC61 = read("src/61-logistics-rail.js");
const LAW = read("docs/design/conquest-supply-chain-design.md");
const DEC = read("DECISIONS.md");

step("D537 ratification and the D538 Slice-1 contract are singular, durable records", () => {
  const handoff = read("HANDOFF.md"), archive = read("legacy/HANDOFF-ARCHIVE.md");
  need(count(DEC, "## D537 — AARON DECISION SESSION") === 1, "D537 heading not singular");
  need(count(DEC, "## D538 — CONTRACT_CONQUEST_TRACED_SUPPLY_ROUTE") === 1, "D538 contract heading not singular");
  need(count(read("COORDINATION.md"), "### LANE-022 · conquest-mayhem-supply-ladder") === 1, "LANE-022 not singular");
  need(LANE, "LANE-022 segment missing");
  need(/D538/.test(handoff) || /D538/.test(archive), "the D538 contract head is in neither HANDOFF nor its archive");
  for (const token of ["Build the transport/supply ladder on the Mayhem ruleset now",
    "Historical movement stays\n> evidence-gated"])
    need(LAW.includes(token.split("\n")[0]), "the ratified fork sentence moved: " + token.split("\n")[0]);
  need(count(LAW, "## 0 · Why this packet exists — the finding that forced the fork") === 1, "the design-law finding section moved");
  return { D537: 1, D538: 1, lane: 1 };
});

step("the design-law containment boundary is byte-exact and structural, never cosmetic", () => {
  const section = (/## 2 · THE NON-NEGOTIABLE BOUNDARY[\s\S]*?(?=\n## 3 ·)/.exec(LAW) || [])[0] || "";
  need(section, "design-law §2 containment section missing");
  for (const token of [
    "structural, not cosmetic",
    "**structurally incapable** of surfacing under the Historical ruleset",
    "label or a filter is insufficient; the boundary fails **closed** at the ruleset seam",
    "`INTERCHANGE_WINDOW_UNADJUDICATED` for\n   Historical **permanently**",
    "**read-only forever**",
    "never writes into it and never\n   merges with it in a shared namespace",
    "both** directions",
    "A negative bind must red exactly that tooth"
  ]) need(section.includes(token), "design-law §2 boundary sentence moved: " + token.replace(/\n\s*/g, " "));
  need(/D511's and D532's zero-road-service negative remains \*\*exact for Historical\*\*/.test(section), "the zero-road-service negative moved");
  need(/New\s+Orleans-origin, CT-36, the D503 endpoint quarantine/.test(section), "the permanent endpoint negatives moved");
  need(/Boonville, Arrow Rock and Glasgow/.test(section), "the permanent unassignment moved");
  return { boundarySentences: 8 };
});

step("LANE-022 carries the complete D538 Slice-1 acceptance contract", () => {
  for (const token of [
    "D538 exact Slice-1 seam:",
    "D538 exact Slice-1 containment seam (the declared bind target):",
    "D538 Slice-1 authored Mayhem content",
    "D538 Slice-1 honest result",
    "D538 Slice-1 read-only law:",
    "D538 Slice-1 probe design:",
    "D538 Slice-1 gate contract:",
    "`tools/probe-conquest-supply.mjs`",
    "`tools/probe-conquest-supply-plan.mjs`",
    "`node:vm`",
    "WITHOUT a rebuild",
    "never on the current lock\n  holder",
    "18f609d07b1190904ec0c11e4ca64675",
    "a38185fd371a7f181250eff3a6cbf76a",
    "140 → 142",
    // D540 Slice-2 contract clauses
    "D540 exact Slice-2 objective:",
    "D540 exact Slice-2 state seam:",
    "D540 exact Slice-2 resolution law",
    "D540 exact Slice-2 containment seam (the declared bind target):",
    "D540 Slice-2 authored Mayhem content",
    "D540 Slice-2 traversal law:",
    "D540 Slice-2 bounded-channel law",
    "D540 Slice-2 save law",
    "D540 Slice-2 CF-2 performance law",
    "D540 Slice-2 probe design:",
    "D540 Slice-2 gate contract:",
    "D540 carry-forward obligations",
    "`C.conquest.supply`",
    "SUBSTRATE_GAP",
    "purely additive",
    // D542 Slice-3 contract clauses
    "D542 exact Slice-3 objective:",
    "D542 exact Slice-3 state seam",
    "D542 exact Slice-3 repair seam",
    "D542 exact Slice-3 B-5 slider",
    "D542 exact Slice-3 containment seam (the declared bind target):",
    "D542 Slice-3 finite-capacity law",
    "D542 Slice-3 probe design:",
    "D542 Slice-3 gate contract:",
    "conquestRepairCapacity",
    "conquestSupplyRepairReport",
    "C.conquest.supply.repair",
    "fldPresetResolve().attrition",
    // D544 Slice-4 contract clauses
    "D544 exact Slice-4 objective:",
    "D544 exact Slice-4 seam",
    "D544 exact Slice-4 blockade lever",
    "D544 exact Slice-4 containment seam (the declared bind target):",
    "D544 Slice-4 save law",
    "D544 Slice-4 probe design:",
    "D544 Slice-4 gate contract:",
    "sea-import-port source model",
    "_lgSeaImportOpen",
    "C.blockade.portsOpen",
    "CTS-S-01"
  ]) need(LANE.includes(token.split("\n")[0]), "LANE-022 contract clause missing: " + token.replace(/\n\s*/g, " "));
  need(/which artery do you restore/.test(LANE.replace(/\s+/g, " ")),
    "the Slice-3 finite-capacity standing decision is not contracted in the lane");
  need(/no fourth (public )?mutator, no second (logistics\/engineering )?owner, no (new )?clock/i.test(LANE.replace(/\s+/g, " ")),
    "the Slice-3 no-second-owner / no-new-clock law is not contracted in the lane");
  const flat = LANE.replace(/\s+/g, " ");
  need(/`applied:false`\*{0,2}, `friction` keeps its shipped static number/.test(flat),
    "the load-bearing substrate-gap ruling is not contracted in the lane");
  need(/eleven-component gap is OUR evidence gap|evidence gap, not the player's doing/.test(flat),
    "the lane must record WHY a substrate gap may not be charged to the player");
  need(/never tuned toward a preferred number/.test(LANE.replace(/\s+/g, " ")),
    "the D92 accurate-inputs adjudication rule is not contracted for the sim-affecting leg");
  need(/ELEVEN disconnected components/.test(LANE), "the honest eleven-component finding is not contracted in the lane");
  need(/applied:false/.test(LANE) && /NOTHING consumes/.test(LANE), "the read-only law is not contracted in the lane");
  need(/no slice may absorb its successor/.test(LANE.replace(/\s+/g, " ")), "the standing no-absorption prohibition moved");
  // Scoped to the lane STATE token, not to the whole header line: a per-slice "SLICE n SHIPPED" note is
  // legitimate and expected while the ladder runs. What must never happen is the LANE itself claiming the
  // SHIPPED state before every slice lands. doc-coherence separately binds header state == first State.
  const headerState = /^### LANE-022 · [^\n]*?\*\*(LAW-DRAFT|CONTRACT|DRIVE|VERIFY|SHIPPED)\b/m.exec(LANE);
  const firstState = /^- \*\*State:\*\*\s*(LAW-DRAFT|CONTRACT|DRIVE|VERIFY|SHIPPED)\b/m.exec(LANE);
  need(headerState && firstState, "LANE-022 has no parseable header state or first declared State");
  need(headerState[1] !== "SHIPPED" && firstState[1] !== "SHIPPED",
    "LANE-022 claims the SHIPPED state while slices 2-7 remain unbuilt");
  return { clauses: 15, headerState: headerState[1], firstState: firstState[1] };
});

step("the authored Mayhem content lives ONLY in the seam and never in sourced data or the substrate", () => {
  // D540 re-anchor: Slice 2 adds the severed ceiling and the authored opening control map, and the
  // derived friction is now CONSUMED, so the "unconsumed" marker is retired rather than carried stale.
  const authored = ["_LG_TRACE_RULESETS", "_LG_TRACE_DEPOT", "_LG_TRACE_FRONT", "_LG_TRACE_COST",
    "_LG_SUPPLY_SEVERED", "_LG_SUPPLY_OPENING", "_LG_SUPPLY_SCHEMA", "_LG_REPAIR"];   // D542: + _LG_REPAIR
  for (const sym of authored) need(count(SRC61, "var " + sym + " =") === 1, "authored constant not declared exactly once: " + sym);
  need(count(SRC61, "authored, not sourced") === 6 && count(SRC61, "authored, unconsumed") === 0,   // D542: 5 -> 6 (the repair config constant)
    "the authored-vs-sourced provenance markers moved in the seam");
  const opening = (SRC61.match(/"CT-\d\d": "(US|CS)"/g) || []);
  need(opening.length === 28 && opening.filter(r => r.endsWith('"US"')).length === 4,
    "the authored opening control map moved: " + opening.length + " assigned");
  need(SRC61.includes("LANE022_CONTAINMENT_ALLOWLIST"), "the containment allowlist marker is missing from the seam");
  const s115 = read("src/115-conquest-transport.js"), s114 = read("src/114-conquest-board.js");
  for (const sym of authored.concat(["conquestSupplyTrace", "campaignKind"]))
    for (const [rel, text] of [["src/115", s115], ["src/114", s114]])
      need(!text.includes(sym), rel + " gained a LANE-022 authored symbol: " + sym);
  for (const f of readdirSync(join(ROOT, "data")).filter(n => n.endsWith(".json")))
    for (const sym of authored)
      need(!readFileSync(join(ROOT, "data", f), "utf8").includes(sym), "data/" + f + " gained authored trace content: " + sym);
  return { authoredConstants: 4, substrateLeaks: 0, dataLeaks: 0 };
});

step("the immutable read-only substrate is byte-unchanged and its Historical negatives are exact", () => {
  need(md5("src/115-conquest-transport.js") === "4a00eee8ffce00acdb9463ea34f8adaf", "the immutable transport substrate moved");
  need(md5("src/114-conquest-board.js") === "10d322aa23fda939bec4de7ff9e95005", "the read-only board module moved");
  need(md5("data/conquest-transport-evidence.json") === "7138a61b6cfc152d1051850831a27e92", "the sourced transport evidence moved");
  need(md5("data/conquest-territories.json") === "7dc40508ae2d7d68c96680cbeac42a6a", "the sourced territory registry moved");
  const pack = JSON.parse(read("data/conquest-transport-evidence.json"));
  need(pack.roadStatus === "ROAD_REQUIRES_BOUNDED_SOURCE_PASS" && !Object.hasOwn(pack, "roadServices"),
    "the zero-road-service authority moved");
  need(pack.railServices.length === 27 && pack.waterServices.length === 15 && pack.seaServices.length === 2
    && pack.interchanges.length === 4 && pack.nonLinks.length === 18, "the 27/15/2/4/18 substrate counts moved");
  need(/`CTI-01`\.\.`CTI-04` stay\s+`INTERCHANGE_WINDOW_UNADJUDICATED` for Historical/.test(LANE)
    || /`CTI-01`\.\.`CTI-04` stay `INTERCHANGE_WINDOW_UNADJUDICATED`/.test(LANE.replace(/\s+/g, " ")),
    "the permanent interchange quarantine moved out of LANE-022");
  return { substrateFrozen: true, rail: 27, water: 15, sea: 2, interchanges: 4, nonLinks: 18, roadServices: 0 };
});

step("Slice 1 creates no Historical authority and parses no qualitative date", () => {
  for (const forbidden of ["dateText", "historicalEligibility", "roadStatus", "roadServices", "interchanges",
    "nonLinks", "PHYSICAL_WINDOW", "INTERCHANGE_WINDOW", "RD-SI", "RD-E1"])
    need(!SRC61.includes(forbidden), "the seam reads or manufactures a Historical authority: " + forbidden);
  need(DEC.includes("## D526 — NEEDS_PHYSICAL_WINDOW_ADJUDICATION:"), "the D526 parser negative is missing");
  need(/Fort Fisher/.test(DEC.slice(0, DEC.indexOf("## D536 —"))), "the Fort Fisher counterexample is missing from the live D537/D538 record");
  need(/D528[\s\S]{0,400}0 established/.test(LANE.replace(/\s+/g, " ")) || /rail 0\/19\/7\/1/.test(LANE),
    "the three zero-established research results moved out of the lane");
  return { historicalAuthorityCreated: 0, dateParsers: 0 };
});

step("Slice 1 adds no module, no data file, and no save shape", () => {
  const manifest = JSON.parse(read("src/00-manifest.json"));
  need(manifest.modules.length === 112, "Slice 1 must add no module; manifest is " + manifest.modules.length);
  need(manifest.modules.at(-1) === "116-conquest-state.js", "manifest tail moved");
  need(manifest.modules.includes("61-logistics-rail.js"), "the seam module is not enrolled");
  need(readdirSync(join(ROOT, "data")).filter(n => n.endsWith(".json")).length === 65, "data file count moved");
  need(md5("build/base.html") === "c9db83fa99230ffb95bdfdfe059f3fb9", "the FROZEN base moved");
  // D540: C.conquest.supply IS the contracted Slice 2 namespace. What must stay true is that exactly
  // one guarded accessor owns the write and the two declared mutators are the only public writers.
  need(count(SRC61, "function _lgSupplyStore(") === 1, "the single guarded store accessor is missing or duplicated");
  need(count(SRC61, "function conquestSupplySetCondition(") === 1 &&
    count(SRC61, "function conquestSupplySetControl(") === 1, "the seam must expose exactly two mutators");
  need(!/C\.conquest\.supply\s*=/.test(SRC61), "the seam writes C.conquest.supply outside the guarded accessor");
  need(count(SRC61, "function _lgSupplyView(") === 1, "the single pure reader is missing or duplicated");
  need(!/_SAVE_VER|saveLocal\(\)|applySave|importSave|exportSave/.test(
    SRC61.slice(SRC61.indexOf("LANE-022 Slices 1-2"), SRC61.indexOf("function _lgWord("))),
    "the LANE-022 region touches a save owner");
  return { modules: 112, data: 65, baseFrozen: true, saveShapeMoved: false };
});

step("the shipped logistics owners are extended, never forked into a second store", () => {
  for (const owner of ["function logisticsInit(", "function logisticsSnapshot(", "function logisticsBridgeBonus(",
    "function logisticsSetPriority(", "function logisticsOnResolve(", "function presLogisticsBlock(",
    "function logisticsWireOverview("])
    need(count(SRC61, owner) === 1, "a shipped logistics owner is missing or duplicated: " + owner);
  need(count(SRC61, "function _lgRoute(") === 1, "the seam function is missing or duplicated");
  need(count(SRC61, "var traced = conquestSupplyTrace(C, null);") === 1, "the guarded route tail is missing or duplicated");
  need(count(SRC61, "out.trace = traced;") === 1, "the route tail must attach exactly one field, exactly once");
  need(count(SRC61, "if (traced.applied === true) out.friction = _lgClamp(traced.tracedFriction, 0, 100);") === 1,
    "the single D540 sim-affecting line is missing or duplicated");
  need(count(SRC61, "_lgSupplyBlockHTML(C)") === 2, "the guarded readout block must be defined once and wired once");
  need(/bridgeCaps/.test(SRC61), "the capped-bridge reference is gone");
  const caps = JSON.parse(read("data/logistics-rail.json")).config.bridgeCaps;
  need(caps.supply === 7 && caps.fatigueRelief === 5 && caps.overall === 2, "the shipped bridge caps moved");
  need(/supply \* 0\.15/.test(read("src/33-morale.js")), "the 0.15 troop-morale supply weight moved");
  return { owners: 7, secondStores: 0, caps };
});

step("suite enrolment and every re-anchored count pin agree with the live suite", () => {
  const vet = read("tools/vet-no-regression.mjs");
  const rows = ((/const SUITE = \[([\s\S]*?)\n\];/.exec(vet) || [null, ""])[1].match(/^\s*\['/gm) || []).length;
  need(rows === 142, "the live suite is " + rows + ", expected 142 after the two D538 rows");
  need(vet.includes("'tools/probe-conquest-supply-plan.mjs'") && vet.includes("'tools/probe-conquest-supply.mjs'"),
    "a D538 probe is not enrolled in the suite");
  // The exact re-anchored pin sites. tools/probe-desk-pacing-plan.mjs is DELIBERATELY excluded: it is a
  // superseded, non-enrolled LANE-020 DRIVE-era contract probe released by D519 and is not a gate.
  const pinned = {
    "tools/probe-conquest-transport-plan.mjs": [/need\(suite\.length===(\d+),"suite membership moved"\)/],
    "tools/probe-mayhem-mode.mjs": [/evidence\.suiteCount === (\d+) &&/],
    "tools/probe-open-history-mayhem-plan.mjs": [/suiteRows: (\d+),/],
    "tools/probe-war-career-loop-plan.mjs": [/if \(suite\.length !== (\d+)\) \{/, /requires suite (\d+), got/, /Slice-A suite must be (\d+), got/, /if \(suite\.length !== (\d+) \|\| !suite\[37\]/],
    "tools/probe-women-in-war-arc-plan.mjs": [/vet suite must stay (\d+), counted/],
    "tools/probe-war-career.mjs": [/check\("suite is (\d+)", rows\.length === (\d+)/, /expected: (\d+), actual: 0/, /expected: (\d+), actual: list\.length/, /&& list\.length === (\d+);/]
  };
  let checked = 0;
  for (const [rel, patterns] of Object.entries(pinned)) {
    const text = read(rel);
    for (const re of patterns) {
      const hit = re.exec(text);
      need(hit, rel + " lost its suite-count pin: " + re);
      for (let g = 1; g < hit.length; g++) need(Number(hit[g]) === rows, rel + " pins suite " + hit[g] + ", live suite is " + rows);
      checked++;
    }
  }
  return { suite: rows, pinSites: checked, excluded: "tools/probe-desk-pacing-plan.mjs (superseded, non-enrolled)" };
});

step("every generated-game hash pin equals the built deliverable on disk", () => {
  const game = md5("civil_war_generals.html");
  const sites = [];
  for (const rel of ["tools/probe-open-history-mayhem-plan.mjs", "tools/probe-war-career-loop-plan.mjs"]) {
    const text = read(rel);
    for (const hit of text.matchAll(/game\s*:\s*"([0-9a-f]{32})"/g)) sites.push([rel, hit[1]]);
  }
  need(sites.length === 3, "expected exactly three generated-game pin sites, found " + sites.length);
  for (const [rel, value] of sites) need(value === game, rel + " pins game " + value + " but the built deliverable is " + game);
  const src = [];
  for (const hit of read("tools/probe-war-career-loop-plan.mjs").matchAll(/srcTree\s*:\s*"([0-9a-f]{32})"/g)) src.push(hit[1]);
  need(src.length === 2 && src[0] === src[1], "the two srcTree pins disagree or moved");
  return { game, gamePinSites: 3, srcTreePinSites: 2 };
});

const failed = steps.filter(s => !s.ok);
const result = { ok: !failed.length, steps, failed: failed.map(s => s.name), errors: failed.map(s => s.err), pageerrors: [], realErrors: [], summary: { passed: steps.length - failed.length, total: steps.length } };
writeFileSync(ART, JSON.stringify(result, null, 2) + "\n");
console.log(`probe-conquest-supply-plan: ${result.summary.passed}/${result.summary.total} steps ok, ${failed.length} fail`);
if (failed.length) { for (const f of failed) console.error("FAIL", f.name, "-", f.err); process.exit(1); }
console.log("ALL OK");
