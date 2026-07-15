#!/usr/bin/env node
// D399 planning gate for the D382 war-career loop.
// Filesystem-first, dual-mode, fail-closed. This plan probe never enters the
// release suite. Planning mode forbids early runtime/save movement; runtime
// mode begins only when the exact Slice-A marker appears.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "war-career-loop-design.md");
const COORD = join(ROOT, "COORDINATION.md");
const MANIFEST = join(ROOT, "src", "00-manifest.json");
const RUNTIME = join(ROOT, "src", "106-war-career.js");
const JOURNEY = join(ROOT, "src", "37-loot-survival.js");
const FOCUSED = join(ROOT, "tools", "probe-war-career.mjs");
const VET = join(ROOT, "tools", "vet-no-regression.mjs");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const LOOT_PROBE = join(ROOT, "tools", "probe-loot-survival.mjs");
const REVIEW = join(ROOT, "REVIEW-QUEUE.md");
const BASE = join(ROOT, "build", "base.html");
const GAME = join(ROOT, "civil_war_generals.html");
const SRC = join(ROOT, "src");
const DATA = join(ROOT, "data");
const RECEIPT_DECISION = join(ROOT, "DECISION-NEEDED-war-career-receipt-continuity.md");
const COMMAND = join(ROOT, "src", "35-command.js");
const AUTO = join(ROOT, "src", "87-auto-resolve.js");
const T2 = join(ROOT, "src", "tactical", "T2-campaign-link.js");
const T3 = join(ROOT, "src", "tactical", "T3-officers.js");
const COMMAND_PROBE = join(ROOT, "tools", "probe-command.mjs");
const ROSTER_PROBE = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER_PROBE = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const SWEEP = join(ROOT, "tools", "sweep-all-battles.mjs");
const REPLACEMENTS = join(DATA, "soldier-replacements.json");
const GETTYSBURG = join(DATA, "gettysburg.json");
const CHICKAMAUGA = join(DATA, "chickamauga.json");
const OUTFILE = join(OUT, "probe-war-career-loop-plan.json");

const MARKER = "WAR_CAREER_RUNTIME_V1";
const JOURNEY_MARKER = "WAR_CAREER_JOURNEY_ADAPTER_V1";
const RUNTIME_NAME = "106-war-career.js";
const RECEIPT_BIND = "WAR_CAREER_RECEIPT_BIND:SOURCE_REF_NEVER_EQUALS_TIMELINE_AUTHORITY";
const D404_PLANNING_ALLOWED = new Set([
  "AUTONOMOUS-RUN.md",
  "COORDINATION.md",
  "DECISION-NEEDED-war-career-receipt-continuity.md",
  "DECISIONS.md",
  "HANDOFF.md",
  "RUN-LOG.md",
  "START-HERE.md",
  "V1-CHECKLIST.md",
  "WAKE-UP.md",
  "docs/design/war-career-loop-design.md",
  "tools/probe-war-career-loop-plan.mjs"
]);

function read(path) {
  return readFileSync(path, "utf8");
}

function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

function json(path) {
  return JSON.parse(read(path));
}

function dataTreeMd5() {
  const hash = createHash("md5");
  const names = readdirSync(DATA).filter(name => name.endsWith(".json")).sort();
  for (const name of names) {
    hash.update(name);
    hash.update("\0");
    hash.update(readFileSync(join(DATA, name)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function treeMd5(root) {
  const hash = createHash("md5");
  function walk(dir, prefix) {
    const entries = readdirSync(dir, { withFileTypes:true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relative = prefix ? prefix + "/" + entry.name : entry.name;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, relative);
      } else {
        hash.update(relative);
        hash.update("\0");
        hash.update(readFileSync(full));
        hash.update("\0");
      }
    }
  }
  walk(root, "");
  return hash.digest("hex");
}

function gitChangedPaths() {
  const options = { cwd:ROOT, encoding:"utf8" };
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD", "--"], options)
    .split(/\r?\n/).filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], options)
    .split(/\r?\n/).filter(Boolean);
  return Array.from(new Set(tracked.concat(untracked))).sort();
}

function campaignChain(text, side) {
  const block = (text.match(/const CHAINS = \{([\s\S]*?)\n\};/) || [null, ""])[1];
  const match = block.match(new RegExp(side + ":\\s*\\[([\\s\\S]*?)\\]"));
  if (!match) throw new Error("campaign chain missing: " + side);
  return Array.from(match[1].matchAll(/[\"']([^\"']+)[\"']/g)).map(row => row[1]);
}

function expectedIds(text) {
  const block = (text.match(/var EXPECTED = \[([\s\S]*?)\];/) || [null, ""])[1];
  return Array.from(block.matchAll(/[\"']([^\"']+)[\"']/g)).map(row => row[1]);
}

function scenario(path, key) {
  const value = json(path)[key];
  if (!value || !Array.isArray(value.phases)) throw new Error("scenario missing: " + key);
  return value;
}

function phaseUnitCount(value, phaseId, side, unitId) {
  const phase = value.phases.find(row => row && row.id === phaseId);
  if (!phase) throw new Error("phase missing: " + phaseId);
  const rows = [];
  if (phase.oob && Array.isArray(phase.oob[side])) rows.push(...phase.oob[side]);
  if (Array.isArray(phase.reinforcements)) {
    rows.push(...phase.reinforcements.filter(row => row && row.side === side));
  }
  return rows.filter(row => row && row.id === unitId).length;
}

function scenarioYear(value) {
  const match = String(value && value.date || "").match(/\b(18\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function wcHash(value) {
  const text = String(value == null ? "" : value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash >>> 0;
}

function section(text, startHead, endHead) {
  const start = text.indexOf(startHead);
  if (start < 0) throw new Error("section missing: " + startHead);
  const end = endHead ? text.indexOf(endHead, start + startHead.length) : -1;
  return text.slice(start, end < 0 ? text.length : end);
}

function normalize(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function mustInclude(text, anchors, label) {
  const hay = normalize(text);
  const missing = anchors.filter(anchor => !hay.includes(normalize(anchor)));
  if (missing.length) {
    throw new Error(
      label + " missing anchors: " +
      missing.map(anchor => JSON.stringify(anchor)).join(", ")
    );
  }
}

function parseSuite(text) {
  const block = (text.match(/const SUITE = \[([\s\S]*?)\n\];/) || [null, ""])[1];
  return Array.from(
    block.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g)
  ).map(match => [match[1], match[2]]);
}

function scenarioCount(text) {
  const block = (
    text.match(/function fldScenarioRegistry\(\)[\s\S]*?\n\s*\}\s*catch/) ||
    [null, ""]
  )[0] || "";
  return (block.match(/R\.[A-Za-z0-9]+\s*=\s*GAME_DATA/g) || []).length;
}

function e71Block(text) {
  const start = text.indexOf("- **E71**");
  if (start < 0) throw new Error("REVIEW-QUEUE E71 missing");
  const end = text.indexOf("\n- **", start + 8);
  return text.slice(start, end < 0 ? text.length : end);
}

function lane005(text) {
  const start = text.indexOf("### LANE-005");
  if (start < 0) throw new Error("LANE-005 missing");
  const end = text.indexOf("\n### LANE-", start + 12);
  return text.slice(start, end < 0 ? text.length : end);
}

const manifestText = read(MANIFEST);
const runtimeExists = existsSync(RUNTIME);
const focusedExists = existsSync(FOCUSED);
const manifestHasRuntime = manifestText.includes(RUNTIME_NAME);
const runtimeHasMarker = runtimeExists && read(RUNTIME).includes(MARKER);
const journeyHasMarker = read(JOURNEY).includes(JOURNEY_MARKER);
const IMPLEMENTED = runtimeExists || focusedExists || manifestHasRuntime ||
  runtimeHasMarker || journeyHasMarker;

const result = {
  ok: true,
  mode: IMPLEMENTED ? "runtime" : "planning",
  steps: []
};

function step(name, fn) {
  try {
    const value = fn();
    result.steps.push({ name, ok: true, value: value === undefined ? null : value });
  } catch (error) {
    result.ok = false;
    result.steps.push({
      name,
      ok: false,
      error: String(error && error.message || error)
    });
  }
}

step("SPEC CORE", () => {
  if (!existsSync(SPEC)) throw new Error("war-career design contract missing");
  const text = read(SPEC);
  mustInclude(text, [
    "War Career Loop — Runtime Contract (D399)",
    "CONTRACTED planning boundary",
    "one person enters the war at soldier or junior-officer scale",
    "retired S3-S5 grand-strategy monolith",
    "D382 item 4",
    "No runtime, save-version, generated-game, or political-engine change belongs to D399"
  ], "spec core");
  return { bytes: text.length, md5: md5(SPEC) };
});

step("SEAM INVENTORY", () => {
  const s1 = section(read(SPEC), "## 1 ", "## 2 ");
  mustInclude(s1, [
    "src/37-loot-survival.js",
    "ssJourneyOnResolve",
    "ssPersonRegistry",
    "src/tactical/T14-ratings.js",
    "src/tactical/T3-officers.js",
    "campaignAdvance",
    "_t1Resolve",
    "G.campaign.roster",
    "C.muster",
    "src/35-command.js",
    "P.command",
    "src/30-president-shell.js",
    "src/82-after-action.js",
    "src/91-save-slots.js",
    "105-save-guard.js",
    "Identity namespaces that remain separate",
    "No name-based join is legal",
    "A player relationship graph is net-new"
  ], "seam inventory");
  return { sectionChars: s1.length };
});

step("STATE OWNERSHIP", () => {
  const s2 = section(read(SPEC), "## 2 ", "## 3 ");
  mustInclude(s2, [
    "CAREER_CANONICAL_OWNER:C.loot.journey",
    "sole mutable war-career record",
    "second local-storage career record",
    "journey.person",
    "journey.lineage",
    "journey.events",
    "journey.creditLedger",
    "C.loot.people",
    "remains authoritative for NPC command appointments",
    "Role and capability are pure selectors",
    "Lazy additive shape",
    JOURNEY_MARKER,
    "warCareerInit(C)",
    "Running init twice yields the same bytes",
    "Legacy saves remain playable",
    "careerVersion:1",
    "warCareerCanStart(pid)",
    "warCareerStart(pid)",
    "survival conditioning become separate selectors"
  ], "state ownership");
  const tokenCount = (read(SPEC).match(/CAREER_CANONICAL_OWNER/g) || []).length;
  if (tokenCount !== 1) throw new Error("bind token must occur exactly once, got " + tokenCount);
  return { owner: "C.loot.journey", bindTokenCount: tokenCount };
});

step("TRANSITIONS", () => {
  const s3 = section(read(SPEC), "## 3 ", "## 4 ");
  mustInclude(s3, [
    "Rank, role, and billet are distinct",
    "Rank and file",
    "Junior command",
    "Field command",
    "General command",
    "Political-strategic overlay",
    "year 1864 or later",
    "Date alone never unlocks authority",
    "recorded date on the latest qualifying credit",
    "eventId",
    "creditKey",
    "eventOrdinal",
    "at most 96 observations",
    "strictly higher declared outcome class",
    "At most one merit/promotion credit",
    "qualifying:false",
    "Your Timeline",
    "may never read or modify",
    "casualty multipliers",
    "winner selection"
  ], "transition law");
  return { sectionChars: s3.length };
});

step("DEATH + IRONMAN", () => {
  const s4 = section(read(SPEC), "## 4 ", "## 5 ");
  mustInclude(s4, [
    "Legal life states are",
    "war-ended",
    "stable person-to-participating-unit link",
    "Aggregate player-side casualties alone",
    "personal fate and qualifying advancement remain disabled fail-closed",
    "E71 and career death share one source-owned terminal-result dispatcher",
    "campaignAdvance(winnerSide, type)",
    "B.fromCampaign",
    "winnerSide !== null",
    "winnerSide !== (B.playerSide || C.side)",
    "Draws are nonterminal",
    "never treated as player outcome",
    "without a pre-delegation ordinal, result, or career write",
    "no recovery, retry, live save, upgrade screen",
    "pure preflight fate classifier",
    "warCareerTerminalPersist",
    "gor_save",
    "gor_undo_last",
    "campaign.runId",
    "no resumable campaign",
    "COMRADE HAND-OFF",
    "share the most specific stable unit hierarchy",
    "not already in the lineage",
    "does not copy rank, OVR, wounds, personal merit",
    "The game does not fabricate a person"
  ], "death and Ironman law");
  return { sectionChars: s4.length };
});

step("POLITICAL PULL", () => {
  const s6 = section(read(SPEC), "## 6 ", "## 7 ");
  mustInclude(s6, [
    "political world continues to initialize and resolve",
    "warCareerRole(C)",
    "warCareerCapabilities(C)",
    "warCareerCommandProjection(C)",
    "_wdRefresh",
    "openWarDept",
    "Hiding a control without guarding its underlying function fails",
    "visible defer",
    "historically sourced automatic administration",
    "explicit unavailable-with-consequence",
    "No replacement President simulation",
    "Legacy campaigns with no active war career retain the shipped President experience exactly"
  ], "political pull law");
  return { sectionChars: s6.length };
});

step("ARCHETYPES", () => {
  const s8 = section(read(SPEC), "## 8 ", "## 10 ");
  mustInclude(s8, [
    "Newcomer",
    "History buff / teacher",
    "Wargame veteran",
    "Game-theory min-maxer",
    "keyboard/screen-reader path",
    "No invented relationship or death",
    "No universal stat buff",
    "Stable credit ledger blocks retry/save farming",
    "text, not color alone",
    "at least 24×24 CSS pixels",
    "same unresolved hand-off",
    "No surprise modal chain",
    "200% zoom"
  ], "archetype and accessibility matrix");
  return { sectionChars: s8.length };
});

step("IMPLEMENTATION LADDER", () => {
  const s10 = section(read(SPEC), "## 10 ", "## 11 ");
  mustInclude(s10, [
    "Slice A — terminal honesty + minimal canonical spine (exact next runtime)",
    "src/106-war-career.js",
    MARKER,
    JOURNEY_MARKER,
    "src/37-loot-survival.js",
    "src/82-after-action.js",
    "src/91-save-slots.js",
    "do not add `campaignAdvance` to manifest `overrides`",
    "tools/probe-war-career.mjs",
    "129→130",
    "_SAVE_VER",
    "warCareerCanStart",
    "_ssStatus",
    "all six legal life states",
    "96-event ring",
    "qualifying:false",
    "B.fromCampaign",
    "matching/unrelated slots",
    "close E71",
    "no personal death roll, qualifying advancement, relationship mutation, political gate",
    "Slice B — participation and personal fate",
    "Slice C — field/general command projection",
    "Slice D — relationship memory",
    "Slice E — late-war political pull",
    "Slice F — war end and franchise archive"
  ], "implementation ladder");

  const suite = parseSuite(read(VET));
  const focusedInSuite = suite.some(row => row[1] === "tools/probe-war-career.mjs");
  const planInSuite = suite.some(row => row[1] === "tools/probe-war-career-loop-plan.mjs");
  if (planInSuite) throw new Error("plan probe must never be enrolled in release suite");

  if (!IMPLEMENTED) {
    if (runtimeExists || focusedExists || manifestHasRuntime || runtimeHasMarker || journeyHasMarker) {
      throw new Error("planning mode carries an early Slice-A runtime signal");
    }
    if (focusedInSuite) throw new Error("planning mode enrolled focused runtime probe early");
    return { mode: "planning", runtimeSignals: 0, suite: suite.length };
  }

  const missing = [];
  if (!runtimeExists) missing.push(RUNTIME_NAME);
  if (!runtimeHasMarker) missing.push(MARKER);
  if (!journeyHasMarker) missing.push(JOURNEY_MARKER);
  if (!manifestHasRuntime) missing.push("manifest entry");
  if (!focusedExists) missing.push("tools/probe-war-career.mjs");
  if (!focusedInSuite) missing.push("focused suite row");
  if (missing.length) throw new Error("half-registration: " + missing.join(", "));
  const runtime = read(RUNTIME);
  if (/\bC\.(?:career|warCareer)\b/.test(runtime)) {
    throw new Error("runtime creates a parallel C.career/C.warCareer owner");
  }
  mustInclude(runtime, [
    "warCareerInit",
    "warCareerCanStart",
    "warCareerStart",
    "warCareerTerminalPersist"
  ], "Slice-A runtime API");
  const overrides = (manifestText.match(/"overrides"\s*:\s*\[([\s\S]*?)\]/) || [null, ""])[1];
  if (/"campaignAdvance"/.test(overrides)) {
    throw new Error("assignment wrapper must not register campaignAdvance as a declaration override");
  }
  if (suite.length !== 130) {
    throw new Error("complete Slice A requires suite 130, got " + suite.length);
  }
  return { mode: "runtime", suite: suite.length, marker: MARKER };
});

step("EXCLUSIONS + BASELINES", () => {
  const s12 = section(read(SPEC), "## 12 ", null);
  mustInclude(s12, [
    "a second mutable career owner or name-based identity join",
    "hand-editing",
    "build/base.html",
    "changing combat, casualty, winner, score, AI, objective, reinforcement, or balance inputs",
    "inventing a historical promotion, relationship, quotation, service, death, or comrade",
    "rewarding death, capture, terminal loss, restart, or repeated recovery",
    "using date alone for political access",
    "rebuilding President, cabinet, economy, diplomacy, divergence, ending, or S3-S5 systems",
    "save-version movement without the complete same-commit migration contract",
    "HALT instead of guessing"
  ], "exclusions");

  const t1Count = scenarioCount(read(T1));
  const schemaCount = readdirSync(DATA).filter(name => name.endsWith(".json")).length;
  const loot = read(LOOT_PROBE);
  const suite = parseSuite(read(VET));
  const saveVersionOne = /var\s+_SAVE_VER\s*=\s*1\s*;/.test(read(BASE));
  const e71 = e71Block(read(REVIEW));
  const gameHash = md5(GAME);
  const baseHash = md5(BASE);

  if (t1Count !== 24) throw new Error("scenario baseline must be 24, got " + t1Count);
  if (schemaCount !== 54) throw new Error("schema/data baseline must be 54, got " + schemaCount);
  if (!/people\.length\s*!==\s*1512/.test(loot) || !loot.includes("1512 of 1512")) {
    throw new Error("Army Register 1512 pins missing");
  }
  if (!saveVersionOne) throw new Error("_SAVE_VER moved from 1");
  if (baseHash !== "c9db83fa99230ffb95bdfdfe059f3fb9") {
    throw new Error("frozen base hash moved: " + baseHash);
  }
  if (suite.some(row => row[1] === "tools/probe-war-career-loop-plan.mjs")) {
    throw new Error("plan probe enrolled in release suite");
  }

  if (!IMPLEMENTED) {
    if (suite.length !== 129) throw new Error("planning suite must stay 129, got " + suite.length);
    if (gameHash !== "e669982913feb54032253bf19bcd2b8b") {
      throw new Error("planning generated HTML moved: " + gameHash);
    }
    if (!e71.includes("PENDING")) throw new Error("planning boundary must leave E71 pending");
  } else {
    if (suite.length !== 130) throw new Error("Slice-A suite must be 130, got " + suite.length);
    if (!e71.includes("FIXED")) throw new Error("Slice A marker exists but E71 is not FIXED");
  }

  return {
    mode: IMPLEMENTED ? "runtime" : "planning",
    scenarios: t1Count,
    schemas: schemaCount,
    armyRegister: 1512,
    suite: suite.length,
    saveVersion: 1,
    gameMd5: gameHash,
    baseMd5: baseHash
  };
});

step("LANE", () => {
  const lane = lane005(read(COORD));
  mustInclude(lane, [
    "war-career-loop",
    "planning contract only",
    "D382 item 4",
    "ONE CAREER ACROSS ROLES",
    "COMRADE HAND-OFF",
    "optional Ironman terminal death",
    "pull-based",
    "tools/probe-war-career-loop-plan.mjs",
    "No simultaneous edits by any provider",
    "/private/tmp/codex-vg-recovery-019f62fe"
  ], "LANE-005 contract");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  const ownerLine = (lane.match(/\*\*Owning tool:\*\*\s*([^\n]+)/) || [null, ""])[1];
  if (!["DRIVE", "VERIFY", "CONTRACT"].includes(state)) {
    throw new Error("LANE-005 state not driveable/released: " + state);
  }
  if ((state === "DRIVE" || state === "VERIFY") &&
      !/(ChatGPT\/Codex|Claude (?:Code|Fable))/.test(ownerLine)) {
    throw new Error("active LANE-005 has no recognized TOP LOOP owner");
  }
  if (state === "CONTRACT" && !/^none\b/i.test(ownerLine)) {
    throw new Error("released LANE-005 must be unowned");
  }
  return { state, owner: ownerLine.slice(0, 100) };
});

step("RECEIPT CONTINUITY LAW", () => {
  const s14 = section(read(SPEC), "## 14 ", null);
  mustInclude(s14, [
    "D404 dual-reference receipt contract",
    "A — extend `cw_war_career_participation_v1`",
    "Rejected",
    "B — coexist with `cw_war_career_participation_v2`",
    "Selected",
    "smaller compatibility risk",
    "preserves the D401 contract byte-for-byte",
    "Schema dispatch is explicit",
    "cw_war_career_result_v2",
    "cw_war_career_participation_v2",
    "_wcResultIdV2",
    "do not change the old id functions",
    "receipt-continuity prerequisite"
  ], "receipt continuity law");
  return { selected:"coexisting participation-v2", legacy:"D401 v1 unchanged" };
});

step("EXACT ASSIGNMENT OWNER", () => {
  const s14 = section(read(SPEC), "## 14 ", null);
  mustInclude(s14, [
    "_WC_TIMELINE_ASSIGNMENTS_V1",
    "immutable array of authored exact-id mappings",
    "never saved, mutated, appended from a result, or queried by name/rank/proximity",
    "not a person registry or a second career ledger",
    "C.loot.journey",
    "sole mutable player-career owner",
    "personId + side + chainIndex + scenarioId",
    "wcta-",
    "timeline-assignment-v1",
    "wcta-1pav4ac"
  ], "exact assignment owner");

  const records = json(REPLACEMENTS).records || [];
  const personRows = records.filter(row => row && row.pid === "person_gettysburg_us_17me_haley");
  const sourceSlot = "ss:gettysburg:US:us_birney_iii:pvt";
  const targetSlot = "ss:chickamauga:US:us_harker_rock:pvt";
  if (personRows.length !== 1 || personRows[0].replacePid !== sourceSlot) {
    throw new Error("Haley source identity/slot is not unique");
  }
  if (records.filter(row => row && row.replacePid === sourceSlot).length !== 1) {
    throw new Error("Haley source slot has ambiguous replacements");
  }
  if (records.some(row => row && row.replacePid === targetSlot)) {
    throw new Error("target private slot is no longer open");
  }

  const base = read(BASE);
  const chain = campaignChain(base, "US");
  if (chain[15] !== "gettysburg" || chain[16] !== "chickamauga") {
    throw new Error("exact US adjacent rungs moved");
  }
  const gettysburg = scenario(GETTYSBURG, "gettysburg");
  const chickamauga = scenario(CHICKAMAUGA, "chickamauga");
  if (phaseUnitCount(gettysburg, "day2", "US", "us_birney_iii") !== 1) {
    throw new Error("Gettysburg source unit is not exact");
  }
  if (phaseUnitCount(chickamauga, "snodgrass-horseshoe", "US", "us_harker_rock") !== 1) {
    throw new Error("Chickamauga target unit is not exact");
  }

  const idParts = [
    "person_gettysburg_us_17me_haley",
    sourceSlot,
    "chickamauga",
    "US",
    "us_harker_rock",
    "pvt",
    targetSlot,
    16,
    "",
    "",
    1863,
    "Private",
    "timeline-assignment-v1"
  ];
  const assignmentId = "wcta-" + wcHash(idParts.join("|")).toString(36);
  if (assignmentId !== "wcta-1pav4ac") {
    throw new Error("fixture assignment id drifted: " + assignmentId);
  }
  return {
    personId:personRows[0].pid,
    sourceSlot,
    targetSlot,
    sourceRung:15,
    targetRung:16,
    assignmentId
  };
});

step("SOURCE VS YOUR TIMELINE", () => {
  const text = read(SPEC);
  const s14 = section(text, "## 14 ", null);
  const bindCount = text.split(RECEIPT_BIND).length - 1;
  if (bindCount !== 1) throw new Error("receipt bind token must occur exactly once, got " + bindCount);
  mustInclude(s14, [
    RECEIPT_BIND,
    "Changing canonical source history is not alternate-timeline gameplay",
    "Neither can be inferred from, rewritten as, or substituted for the other",
    "sourceRef",
    "battleId, side, unitId, slot, slotPid, sourceGrade, serviceStart, serviceEnd, serviceYear",
    "timelineAssignmentRef",
    "assignmentId, scenarioId, side, unitId, slot, slotPid, chainIndex",
    "journey.person.unitRef",
    "is never rewritten",
    "Your Timeline",
    "source grade, timeline grade, and assignment are six distinct concepts",
    "not a claim that John W. Haley served at Chickamauga"
  ], "source versus timeline law");
  return { bindTokenCount:bindCount, source:"immutable canonical", timeline:"exact alternate assignment" };
});

step("SERVICE WINDOW + FAIL CLOSED", () => {
  const s14 = section(read(SPEC), "## 14 ", null);
  mustInclude(s14, [
    "serviceStart:null, serviceEnd:null, serviceYear:1863",
    "Both exact rungs are 1863",
    "without expanding the runtime record to Haley's wider documented 1862-1865 service",
    "Absent, duplicate, malformed, unknown-schema, stale-rung, stale-run, wrong-credit, wrong-side",
    "wrong-scenario, wrong-chain-index, wrong-unit, wrong-slot, wrong-slot-pid, wrong-assignment-id",
    "outside-service, foreign-person, fallen, captured, retired, war-ended, unresolved-hand-off",
    "produces no qualifying receipt",
    "Names, ranks, namespaces, aliases, proximity, aggregate casualties",
    "never repair it"
  ], "service and fail-closed law");
  const person = (json(REPLACEMENTS).records || []).find(
    row => row && row.pid === "person_gettysburg_us_17me_haley"
  );
  const sourceYear = scenarioYear(scenario(GETTYSBURG, "gettysburg"));
  const targetYear = scenarioYear(scenario(CHICKAMAUGA, "chickamauga"));
  if (!person || person.year !== 1863 || sourceYear !== 1863 || targetYear !== 1863) {
    throw new Error("fixture service-year proof moved");
  }
  if (person.provenance !== "Verified" || !Array.isArray(person.sources) || person.sources.length !== 6) {
    throw new Error("fixture source provenance moved");
  }
  if (!read(RUNTIME).includes("function _wcKnownPresent(p, year)")) {
    throw new Error("service-window validator seam missing");
  }
  return { sourceYear, targetYear, sourceProvenance:person.provenance, sources:person.sources.length };
});

step("HANDOFF + ONE-CREDIT ISOLATION", () => {
  const s14 = section(read(SPEC), "## 14 ", null);
  mustInclude(s14, [
    "one-credit-per-rung owner across both receipt schemas",
    "A v1 and v2 row cannot claim the same key twice",
    "cannot replace its receipt or reroll fate",
    "COMRADE HAND-OFF",
    "never copies a mapping row",
    "successor's own exact mapping",
    "future assignments, source reference, timeline grade, receipts, merit, reputation, rank, billet, and authority never transfer",
    "game does not borrow the prior identity's assignment",
    "A fallen-person hand-off gives the successor no Haley assignment"
  ], "handoff and one-credit law");
  return { owner:"creditKey", transfer:"none" };
});

step("SAVE SANITATION + VERSION LOCK", () => {
  const s14 = section(read(SPEC), "## 14 ", null);
  mustInclude(s14, [
    "_ssCareerParticipation",
    "explicit schema dispatcher",
    "v1 branch preserves the D401 parser and result-id calculation exactly",
    "v2 branch reconstructs only the declared v2 keys",
    "Unknown fields are stripped through reconstruction",
    "cross-schema copies cannot cross-validate",
    "Init/load performs sanitation eagerly",
    "One pass converges to canonical bytes",
    "second `warCareerInit` and save/apply/init cycle produce the same bytes",
    "No lazy authority repair",
    "_SAVE_VER=1",
    "careerVersion:1"
  ], "save sanitation law");
  if (!/var\s+_SAVE_VER\s*=\s*1\s*;/.test(read(BASE))) throw new Error("_SAVE_VER moved from 1");
  return { saveVersion:1, sanitation:"eager deterministic idempotent fail-closed" };
});

step("T2/T3/AUTO CLOSED", () => {
  const locks = {
    t2:md5(T2),
    t3:md5(T3),
    auto:md5(AUTO)
  };
  const expected = {
    t2:"feef8a3c1ecf5fb28a120d2398ee61fc",
    t3:"56e2cd1060a40eb0754b19e8d56bacdb",
    auto:"4f0bd0970ef96c09b62ea44694387f80"
  };
  for (const key of Object.keys(expected)) {
    if (locks[key] !== expected[key]) throw new Error(key + " closed-seam hash moved: " + locks[key]);
  }
  const spec = read(SPEC);
  mustInclude(spec, [
    "Classic consequence-only and does not authorize T2, T3, Auto",
    "It may not edit T2, T3, Auto, data, the manifest, the suite manifest"
  ], "closed tactical producers");
  return locks;
});

step("SLICE C RUNTIME STILL LOCKED", () => {
  const locks = {
    srcTree:treeMd5(SRC),
    runtime:md5(RUNTIME),
    journey:md5(JOURNEY),
    command:md5(COMMAND),
    focused:md5(FOCUSED),
    commandProbe:md5(COMMAND_PROBE)
  };
  const expected = {
    srcTree:"c0e7fbbd36d59f1fe53147f9561b9954",
    runtime:"c69f405c0469abe7eca67fc0fff99575",
    journey:"d526f33a7649d378d2062b931b933884",
    command:"55bd7b5a30f22470e1abd7a993b3cbb4",
    focused:"54e6a095eb81095ede3d46e5bd523f62",
    commandProbe:"bbfeaa69db333fddee2741882abff245"
  };
  for (const key of Object.keys(expected)) {
    if (locks[key] !== expected[key]) throw new Error(key + " planning lock moved: " + locks[key]);
  }
  const changed = gitChangedPaths();
  const forbidden = changed.filter(path => !D404_PLANNING_ALLOWED.has(path));
  if (forbidden.length) {
    throw new Error("D404 planning allowlist violation: " + forbidden.join(", "));
  }
  const runtimeText = read(RUNTIME);
  for (const token of [
    "cw_war_career_participation_v2",
    "cw_war_career_result_v2",
    "_WC_TIMELINE_ASSIGNMENTS_V1",
    "_wcResultIdV2"
  ]) {
    if (runtimeText.includes(token)) throw new Error("receipt runtime landed during planning: " + token);
  }
  const s10 = section(read(SPEC), "## 10 ", "## 11 ");
  mustInclude(s10, [
    "Receipt-continuity prerequisite",
    "exact next runtime",
    "Before Slice C",
    "src/106-war-career.js",
    "src/37-loot-survival.js",
    "tools/probe-war-career.mjs",
    "does not authorize T2, T3, Auto, command projection",
    "HALT with the exact missing seam"
  ], "receipt prerequisite");
  return { ...locks, changed };
});

step("BASELINES + LANE", () => {
  const t1Count = scenarioCount(read(T1));
  const schemaCount = readdirSync(DATA).filter(name => name.endsWith(".json")).length;
  const suite = parseSuite(read(VET));
  const rosterExpected = expectedIds(read(ROSTER_PROBE));
  const builderExpected = expectedIds(read(BUILDER_PROBE));
  const loot = read(LOOT_PROBE);
  const lane = lane005(read(COORD));
  const decision = read(RECEIPT_DECISION);
  const hashes = {
    game:md5(GAME),
    base:md5(BASE),
    dataTree:dataTreeMd5(),
    manifest:md5(MANIFEST),
    suite:md5(VET)
  };
  if (t1Count !== 24 || schemaCount !== 54) {
    throw new Error("scenario/schema baseline moved: " + t1Count + "/" + schemaCount);
  }
  if (!/people\.length\s*!==\s*1512/.test(loot) || !loot.includes("1512 of 1512")) {
    throw new Error("Army Register 1512 pins missing");
  }
  if (rosterExpected.length !== 24 || builderExpected.length !== 24 ||
      normalize(rosterExpected.join(" ")) !== normalize(builderExpected.join(" "))) {
    throw new Error("coverage baselines moved");
  }
  if (suite.length !== 130 || !suite[37] || suite[37][1] !== "tools/probe-war-career.mjs") {
    throw new Error("suite 130 / War Career row 38 moved");
  }
  if (!read(SWEEP).includes("var reg = fldScenarioRegistry()") ||
      !read(SWEEP).includes("var order = (typeof fldScenarioMenuOrder==='function')")) {
    throw new Error("24-scenario sweep registry seam moved");
  }
  const expectedHashes = {
    game:"4560dfc4f22b5907429e6a5c7d303e4f",
    base:"c9db83fa99230ffb95bdfdfe059f3fb9",
    dataTree:"b0d7f440836b60a4f18401b2d7b03f48",
    manifest:"7924da858de403cac58caabf8c9fcce8",
    suite:"4bcdc6f252389a4bfd6bed269b52f8f0"
  };
  for (const key of Object.keys(expectedHashes)) {
    if (hashes[key] !== expectedHashes[key]) throw new Error(key + " baseline moved: " + hashes[key]);
  }
  mustInclude(lane, [
    "D404 planning-only acceptance contract",
    "cw_war_career_participation_v2",
    "sourceRef",
    "timelineAssignmentRef",
    "wcta-1pav4ac",
    "T2/T3/AUTO CLOSED",
    "SLICE C RUNTIME STILL LOCKED",
    "D398 remains the latest full release battery",
    "do not run `npm run vet:noreg`"
  ], "D404 lane");
  mustInclude(decision, [
    "RESOLVED by the D404 planning contract",
    "coexisting `cw_war_career_participation_v2`",
    "wcta-1pav4ac",
    "smallest next runtime prerequisite",
    "T2, T3, Auto, data, command projection, and later slices remain closed"
  ], "receipt decision resolution");
  return {
    scenarios:t1Count,
    schemas:schemaCount,
    armyRegister:1512,
    coverage:rosterExpected.length,
    suite:suite.length,
    sweep:t1Count,
    warCareerRow:38,
    saveVersion:1,
    hashes
  };
});

writeFileSync(OUTFILE, JSON.stringify(result, null, 2) + "\n");

const passing = result.steps.filter(row => row.ok).length;
const failing = result.steps.length - passing;
console.log(
  "probe-war-career-loop-plan: " + passing + "/" + result.steps.length +
  " steps ok" + (failing ? ", " + failing + " FAIL" : ", 0 fail") +
  " [" + result.mode + "]"
);
if (!result.ok) {
  for (const row of result.steps) {
    if (!row.ok) console.error("  FAIL:", row.name, "::", row.error);
  }
  process.exit(1);
}
console.log("ALL OK");
