#!/usr/bin/env node
// D385 planning/spec gate for LANE-003 M3 Women-in-War playable arc.
// Filesystem-first, dual-mode, fail-closed: with no arc data in
// data/women-in-war.json it guards the D385 planning boundary (the shipped
// 9-record lock intact, no half-registration anywhere); once any record
// carries an `arc` block it demands the COMPLETE D386 integration.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "women-in-war-arc-spec.md");
const DATA = join(ROOT, "data", "women-in-war.json");
const UNDERTOLD = join(ROOT, "data", "under-told-perspectives.json");
const UNDERTOLD_PROBE = join(ROOT, "tools", "probe-under-told-perspectives.mjs");
const IMPORTER = join(ROOT, "tools", "import-women-in-war.mjs");
const FOCUSED = join(ROOT, "tools", "probe-women-in-war.mjs");
const MODULE38 = join(ROOT, "src", "38-women-in-war.js");
const MODULE39 = join(ROOT, "src", "39-women-war-arc.js");
const MANIFEST = join(ROOT, "src", "00-manifest.json");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const LOOT = join(ROOT, "tools", "probe-loot-survival.mjs");
const SCHEMAS = join(ROOT, "tools", "validate-data-schemas.mjs");
const VET = join(ROOT, "tools", "vet-no-regression.mjs");
const BASE = join(ROOT, "build", "base.html");
const COORD = join(ROOT, "COORDINATION.md");

// The four arc figures (record ids) and the tie/register law adjudicated in the spec §3-§5.
const ARC_IDS = ["edmonds-sarah-emma", "cashier-albert-d-j", "clayton-frances", "barton-clara"];
const TIE_ALLOWLIST = {
  bullrun1: "bullrun1",
  malvernHill: "malvern",
  antietam: "antietam",
  fredericksburg: "fredericksburg",
  fortDonelson: "ftdonelson",
  stonesRiver: "stonesriver",
  vicksburg: "vicksburg"
};
const DOCUMENTED_TIES = { "barton-clara": ["antietam", "fredericksburg"], "cashier-albert-d-j": ["vicksburg"] };

function read(p) { return readFileSync(p, "utf8"); }
function md5(p) { return createHash("md5").update(readFileSync(p)).digest("hex"); }
function section(text, startHead, endHead) {
  const a = text.indexOf(startHead);
  if (a < 0) throw new Error("spec section missing: " + startHead);
  const b = endHead ? text.indexOf(endHead, a) : -1;
  return text.slice(a, b < 0 ? text.length : b);
}
function mustInclude(text, anchors, label) {
  // The spec is hard-wrapped, so anchors are matched on whitespace-normalized text;
  // the tooth still bites on any word-level tamper.
  const norm = String(text).replace(/\s+/g, " ");
  const missing = anchors.filter(a => !norm.includes(String(a).replace(/\s+/g, " ")));
  if (missing.length) throw new Error(label + " missing anchors: " + missing.map(a => JSON.stringify(a)).join(", "));
}
function wordCount(s) {
  const m = String(s == null ? "" : s).replace(/\s+/g, " ").trim().match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
  return m ? m.length : 0;
}
function parseSuite(text) {
  const block = (text.match(/const SUITE = \[([\s\S]*?)\n\];/) || [null, ""])[1];
  return Array.from(block.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g)).map(m => [m[1], m[2]]);
}

const result = { ok: true, steps: [] };
function step(name, fn) {
  try { const v = fn(); result.steps.push({ name, ok: true, v: v === undefined ? null : v }); }
  catch (e) { result.ok = false; result.steps.push({ name, ok: false, err: String(e && e.message || e) }); }
}

step("SPEC: the committed arc law exists with its load-bearing anchors", () => {
  if (!existsSync(SPEC)) throw new Error("docs/design/women-in-war-arc-spec.md missing");
  const text = read(SPEC);
  mustInclude(text, [
    "Women-in-War Playable Arc",
    "D153 (the women's presentation lane NEVER collapses into `ss:`",
    "D382 set-1",
    "journey/presentation seam",
    "no `ss:` ids, no `replacePid`, no `ssPersonRegistry` entry",
    "no battle-launch control",
    "no `_SAVE_VER`/E41/E50 touch",
    "suite stays 125",
    "nothing new rides the save"
  ], "spec core");
  return { bytes: text.length, md5: md5(SPEC) };
});

step("ADJUDICATIONS: the four TOP-LOOP calls are locked in spec section 4", () => {
  const s4 = section(read(SPEC), "## 4 ", "## 5 ");
  mustInclude(s4, [
    "AFFIRMED he/him under Albert D. J. Cashier",
    "No interior \"why\" may be authored",
    "D386 scrubs \"Irene\"",
    "DOCUMENTED MYSTERY, never implied-fraud",
    "Duty in the Defences of Washington, D.C., September 3 to October 11",
    "the NPS attribution, NEVER the NARA Prologue",
    "did NOT organize the expedition, did NOT personally identify the graves, did NOT establish the cemetery"
  ], "spec section 4 adjudications");
  return { section4Chars: s4.length };
});

step("STAGES: the locked per-figure stage sets are present in spec section 5", () => {
  const s5 = section(read(SPEC), "## 5 ", "## 6 ");
  mustInclude(s5, [
    "**Edmonds (8):**",
    "**Cashier (7):**",
    "**Clayton (5, ALL claimed-register where tied):**",
    "**Barton (8):**",
    "tie bullrun1/claimed",
    "tie antietam/claimed",
    "tie vicksburg/documented",
    "tie fortDonelson/claimed",
    "tie stonesRiver/claimed",
    "tie antietam/documented",
    "tie fredericksburg/documented"
  ], "spec section 5 stage sets");
  return { section5Chars: s5.length };
});

step("REGISTER LAW: the documented/claimed honesty device is spec law", () => {
  const text = read(SPEC);
  const s23 = section(text, "## 2 ", "## 4 ");
  mustInclude(s23, [
    "every non-Verified tied stage",
    "MUST carry",
    "may NEVER render the documented treatment"
  ], "spec register law");
  for (const key of Object.keys(TIE_ALLOWLIST)) {
    if (!s23.includes("`" + key + "`")) throw new Error("allowlist key missing from spec section 3: " + key);
  }
  return { allowlist: Object.keys(TIE_ALLOWLIST).length };
});

step("TIE MAP: every classic id in the allowlist exists in the frozen Classic BATTLES roster", () => {
  const base = read(BASE);
  const missing = Object.values(TIE_ALLOWLIST).filter(id => !base.includes('id:"' + id + '"'));
  if (missing.length) throw new Error("classic ids not found in build/base.html: " + missing.join(", "));
  return { classicIds: Object.values(TIE_ALLOWLIST) };
});

const pack = JSON.parse(read(DATA));
const records = Array.isArray(pack.records) ? pack.records : [];
const IMPL = records.some(r => r && typeof r === "object" && r.arc);

step("MODE: the lane is either the D385 planning boundary or the COMPLETE D386 integration", () => {
  const verified = records.filter(r => r.provenance === "Verified").length;
  const disputed = records.filter(r => r.provenance === "Disputed").length;
  const ids = records.map(r => r.id);
  const has39 = existsSync(MODULE39);
  const manifest39 = read(MANIFEST).includes("39-women-war-arc.js");
  const seam38 = /wiwArcSectionHTML|wiwWireArcs/.test(read(MODULE38));
  if (!IMPL) {
    if (records.length !== 9 || verified !== 8 || disputed !== 1) throw new Error("planning mode requires the shipped 9/8/1 lock, got " + records.length + "/" + verified + "/" + disputed);
    if (ids.includes("edmonds-sarah-emma") || ids.includes("clayton-frances")) throw new Error("planning mode must not carry the new records yet");
    if (has39 || manifest39 || seam38) throw new Error("half-registration: runtime arc seams present without arc data");
    if (read(FOCUSED).includes("records.length !== 11")) throw new Error("half-registration: focused probe pin moved before data");
    return { mode: "planning", records: 9, verified, disputed };
  }
  if (records.length !== 11 || verified !== 9 || disputed !== 2) throw new Error("integration mode requires 11/9/2, got " + records.length + "/" + verified + "/" + disputed);
  if (!has39) throw new Error("src/39-women-war-arc.js missing");
  if (!manifest39) throw new Error("manifest entry for 39-women-war-arc.js missing");
  if (!seam38) throw new Error("38-women-in-war.js guarded seam missing");
  return { mode: "integration", records: 11, verified, disputed };
});

step("DATA LAW: records and arcs obey the D153 separation and the register law", () => {
  // Both modes: separation invariants on every record present.
  for (const r of records) {
    if (String(r.id).indexOf("ss:") === 0) throw new Error(r.id + " uses the ss: namespace");
    if (Object.prototype.hasOwnProperty.call(r, "replacePid")) throw new Error(r.id + " carries replacePid");
    if (!r.registryMappable || r.registryMappable.canMap !== false) throw new Error(r.id + " canMap must be false");
  }
  if (!IMPL) return { mode: "planning", arcs: 0 };
  const arcRecords = records.filter(r => r.arc);
  const arcIds = arcRecords.map(r => r.id).sort();
  if (JSON.stringify(arcIds) !== JSON.stringify([...ARC_IDS].sort())) throw new Error("arc records must be exactly the four figures, got " + arcIds.join(","));
  const edmonds = records.find(r => r.id === "edmonds-sarah-emma");
  const clayton = records.find(r => r.id === "clayton-frances");
  if (!edmonds || edmonds.provenance !== "Verified") throw new Error("edmonds-sarah-emma must ship Verified (spine)");
  if (!clayton || clayton.provenance !== "Disputed" || !clayton.disputeNote) throw new Error("clayton-frances must ship Disputed with a disputeNote");
  const cashier = records.find(r => r.id === "cashier-albert-d-j");
  if (/Irene/.test(String(cashier && cashier.playerCopy))) throw new Error("the unsupported 'Irene' middle name still in Cashier playerCopy");
  for (const r of arcRecords) {
    const a = r.arc;
    if (!a || !Array.isArray(a.stages)) throw new Error(r.id + ".arc.stages missing");
    if (a.stages.length < 4 || a.stages.length > 8) throw new Error(r.id + " stage count out of 4..8: " + a.stages.length);
    if (wordCount(a.intro) < 30 || wordCount(a.intro) > 90) throw new Error(r.id + ".arc.intro must be 30-90 words");
    for (let i = 0; i < a.stages.length; i++) {
      const s = a.stages[i], label = r.id + ".arc.stages[" + i + "]";
      if (!s.title || !s.dateRange) throw new Error(label + " needs title+dateRange");
      const wc = wordCount(s.what);
      if (wc < 30 || wc > 130) throw new Error(label + ".what must be 30-130 words, got " + wc);
      if (!["Verified", "Inferred", "Disputed"].includes(s.stageProvenance)) throw new Error(label + " bad stageProvenance");
      if (s.stageProvenance === "Disputed" && !s.disputeNote) throw new Error(label + " Disputed stage needs disputeNote");
      if (!Array.isArray(s.sourceRefs) || !s.sourceRefs.length) throw new Error(label + " needs sourceRefs");
      for (const ref of s.sourceRefs) if (!Number.isInteger(ref) || ref < 0 || ref >= (r.sources || []).length) throw new Error(label + " sourceRef out of range: " + ref);
      if (s.gameBattleTie != null) {
        if (!(s.gameBattleTie in TIE_ALLOWLIST)) throw new Error(label + " tie not in allowlist: " + s.gameBattleTie);
        if (s.tieRegister !== "documented" && s.tieRegister !== "claimed") throw new Error(label + " tied stage needs tieRegister");
        if (s.tieRegister === "documented" && s.stageProvenance !== "Verified") throw new Error(label + " REGISTER LAW: documented tie on a non-Verified stage");
        if (r.id === "clayton-frances" && s.tieRegister !== "claimed") throw new Error(label + " Clayton ties must all be claimed");
        const wants = DOCUMENTED_TIES[r.id] || [];
        if (wants.includes(s.gameBattleTie) && s.tieRegister !== "documented") throw new Error(label + " " + s.gameBattleTie + " must be a documented tie for " + r.id);
      } else if (s.tieRegister != null) {
        throw new Error(label + " tieRegister without gameBattleTie");
      }
    }
  }
  return { mode: "integration", arcs: arcRecords.length, stages: arcRecords.map(r => r.id + ":" + r.arc.stages.length) };
});

step("PINS: the three shipped count locks agree with the current mode", () => {
  const focused = read(FOCUSED);
  const undertold = read(UNDERTOLD);
  const undertoldProbe = read(UNDERTOLD_PROBE);
  if (!IMPL) {
    mustInclude(focused, ["records.length !== 9", "verified !== 8 || disputed !== 1"], "focused probe planning lock");
    if (!undertold.includes("9 records, 8 Verified and 1 Disputed")) throw new Error("under-told women-lane text moved early");
    if (!/9 records, 8 Verified and 1 Disputed/.test(undertoldProbe)) throw new Error("under-told probe tooth moved early");
    return { mode: "planning", lock: "9/8/1 everywhere" };
  }
  mustInclude(focused, ["records.length !== 11", "verified !== 9 || disputed !== 2", "D386"], "focused probe integration lock (with the documented-history comment)");
  if (!undertold.includes("11 records, 9 Verified and 2 Disputed")) throw new Error("under-told women-lane text not moved to 11/9/2");
  if (!/11 records, 9 Verified and 2 Disputed/.test(undertoldProbe)) throw new Error("under-told probe tooth not moved to 11/9/2");
  const importer = read(IMPORTER);
  mustInclude(importer, ["tieRegister", "stageProvenance"], "importer arc validation");
  const mod39 = read(MODULE39);
  for (const bad of ["ssStartJourney", "ssPersonRegistry", "replacePid", "_SAVE_VER", "localStorage"]) {
    if (mod39.includes(bad)) throw new Error("src/39-women-war-arc.js references forbidden token: " + bad);
  }
  return { mode: "integration", lock: "11/9/2 everywhere" };
});

step("BASELINES: the current D400 whole-registry boundary the arc must not move still holds", () => {
  const t1 = read(T1);
  const registryBlock = (t1.match(/function fldScenarioRegistry\(\)[\s\S]*?\n\s*\}\s*catch/) || [null, ""])[0] || "";
  const scenarioCount = (registryBlock.match(/R\.[A-Za-z0-9]+\s*=\s*GAME_DATA/g) || []).length;
  if (scenarioCount !== 26) throw new Error("scenario registry must stay 26, counted " + scenarioCount);   // D391: 21 -> 22 — Spotsylvania registered as the twenty-second scenario. D393: 22 -> 23 — Wilderness registers after Chattanooga. D397: 23 -> 24 — Petersburg initial assaults registers at rank 69. D436: 24 -> 25 — Atlanta registers at rank 71. D442: 25 -> 26 — Cold Harbor registers at the documented 68.5.
  const loot = read(LOOT);
  if (!/people\.length\s*!==\s*1614/.test(loot) || !/1614 of 1614/.test(loot)) throw new Error("Army Register exact D442 whole-registry pin 1614 missing from probe-loot-survival");   // D391: 1326 -> 1380 — Spotsylvania adds 18 unique side-unit ids x 3 slots. D393: 1380 -> 1434 — Wilderness adds 18 unique side-unit ids x 3 slots. D397: 1434 -> 1512 — Petersburg initial assaults adds 26 unique side-unit ids x 3 slots. D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots. D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots.
  const schemas = read(SCHEMAS);
  if (!schemas.includes("['women-in-war.json', ['_meta', 'schema', 'records']]")) throw new Error("schema-validator women row changed");
  const suite = parseSuite(read(VET));
  if (suite.length !== 135) throw new Error("vet suite must stay 135, counted " + suite.length);   // D391: 126 -> 127 — probe-spotsylvania enrolled. D393: 127 -> 128 — probe-wilderness enrolls with the twenty-third battle. D397: 128 -> 129 — probe-petersburg-initial-assaults enrolls with the twenty-fourth battle. D400: 129 -> 130 — probe-war-career enrolls with Slice A. AD-7 re-pin (D443): 130 -> 131 — probe-mayhem-mode enrolls (D418); 131 -> 132 — probe-atlanta (D436); 132 -> 133 — probe-cold-harbor (D442), each appended at the END. D444: 133 -> 134 — probe-learn-battle (GEA-07). D445: 134 -> 135 — probe-chief-of-staff (GEA-08), both at the END.
  if (!suite.some(rw => rw[1] === "tools/probe-women-in-war.mjs")) throw new Error("focused women probe missing from the suite");
  if (suite.some(rw => rw[1] === "tools/probe-women-in-war-arc-plan.mjs")) throw new Error("plan probes never enroll in the suite");
  return { scenarios: scenarioCount, suite: suite.length };
});

step("LANE", () => {
  const text = read(COORD);
  const start = text.indexOf("### LANE-003");
  if (start < 0) throw new Error("LANE-003 missing from COORDINATION.md");
  const next = text.indexOf("\n### LANE-", start + 8);
  const lane = text.slice(start, next < 0 ? text.length : next);
  // Anchors are durable history/contract facts; the owner check binds the ROLE ROSTER
  // (any recognized TOP-LOOP tool), never today's lock holder (the D381 relay lesson).
  mustInclude(lane, [
    "battle-ladder",
    "M3",
    "Women-in-War",
    "D153 lane law is absolute",
    "D384",
    "no simultaneous edits by any provider"
  ], "LANE-003 M3 contract");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  const owner = (lane.match(/\*\*Owning tool:\*\*\s*([^\n]+)/) || [null, ""])[1];
  if (!["DRIVE", "VERIFY", "CONTRACT", "SHIPPED"].includes(state)) throw new Error("LANE-003 does not carry an M3-driveable state: " + state);
  if ((state === "DRIVE" || state === "VERIFY") && !/(ChatGPT\/Codex|Claude (?:Code|Fable))/.test(owner)) throw new Error("active lane owner is not a recognized TOP-LOOP tool: " + owner);
  if (state === "CONTRACT" && !/^none\b/.test(owner)) throw new Error("released CONTRACT lane must be unowned: " + owner);
  return { state, owner: owner.slice(0, 80) };
});

writeFileSync(join(OUT, "probe-women-in-war-arc-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(row => row.ok).length;
const fail = result.steps.length - ok;
console.log("probe-women-in-war-arc-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.err);
  process.exit(1);
}
console.log("ALL OK");
