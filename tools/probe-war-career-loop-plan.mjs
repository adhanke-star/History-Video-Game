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
const DATA = join(ROOT, "data");
const OUTFILE = join(OUT, "probe-war-career-loop-plan.json");

const MARKER = "WAR_CAREER_RUNTIME_V1";
const JOURNEY_MARKER = "WAR_CAREER_JOURNEY_ADAPTER_V1";
const RUNTIME_NAME = "106-war-career.js";

function read(path) {
  return readFileSync(path, "utf8");
}

function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
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
