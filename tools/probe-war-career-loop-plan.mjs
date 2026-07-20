#!/usr/bin/env node
// D453 re-pin (the AD-7 idiom, at the FINAL audit head): the VETTING-DEFERRED D444-D452 slices plus the D453 audit root-fixes legitimately moved these surfaces — t2 25b7c205->57e82cd4 (D448 critical-cue tag + D452 skirmish Ruleset segment); auto 4f0bd097->9396ff63 (D448 cue tag); srcTree 1e973caa->d1792e99 and game baa37b96->4f9adfe5 (D444-D452 + the D453 live-owner fixes in src/99/src/100/src/40/src/60/T0/T2-adjacent probes); focused 87ce5226->a29a5351 (D444-D447 suite sweeps + the D453 e9bc7de wall re-pins); dataTree a0b26ed6->108961c5 (D444 learnMeta on 26 files + D445 chief-of-staff.json + D446 concept-links.json); manifest 442b440c->60f73b23 (D445 109 / D446 110 / D447 111 / D451 112); suite cc91894f->69987b22 (rows 134-137, D444-D447). base/runtime/journey/command/commandProbe/t3 did NOT move.
// D408 Slice-E-contract gate for the D382 war-career loop.
// Filesystem-first, runtime-only, fail-closed. This plan probe never enters the
// release suite and keeps the dual-reference, command-isolation, and later-slice walls.

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
const D408_CONTRACT_ALLOWED = new Set([
  "AUTONOMOUS-RUN.md",
  "COORDINATION.md",
  "DECISIONS.md",
  "HANDOFF.md",
  "RUN-LOG.md",
  "START-HERE.md",
  "V1-CHECKLIST.md",
  "WAKE-UP.md",
  "docs/design/war-career-loop-design.md",
  "tools/probe-war-career-loop-plan.mjs",
  // D411 transition: the D410 planning allowlist gains exactly the §18-contracted
  // runtime surface (DECISIONS D410/D411; nothing else may move in the take).
  "civil_war_generals.html",
  "data/soldier-replacements.json",
  "src/106-war-career.js",
  "src/37-loot-survival.js",
  "tools/probe-war-career.mjs",
  // D411 documented exception (Aaron-approved in-take, 2026-07-16): the loot probe's
  // Rhodes detail card pinned 'Sources (4)'; the contracted end-bound source row makes
  // it 5, so that single stale pin moved with history (DECISIONS D411).
  "tools/probe-loot-survival.mjs",
  // D413 transition: the D408 §17 Matters-of-State runtime allowlist gains exactly the
  // one §17-contracted seam file (DECISIONS D408 item 5 / D413; nothing else may move).
  "src/32-decisions.js",
  // D413 transition (discovered at gate, documented in DECISIONS D413): the D412
  // HISTORY ARCHIVAL RULE moves each canonical doc's now-second prior head verbatim to
  // legacy/<DOC>-ARCHIVE.md at EVERY release closeout — those archive targets postdate
  // this allowlist's authoring and are docs-lane surface, so they are admitted here.
  "legacy/AUTONOMOUS-RUN-ARCHIVE.md",
  "legacy/HANDOFF-ARCHIVE.md",
  "legacy/START-HERE-ARCHIVE.md",
  "legacy/V1-CHECKLIST-ARCHIVE.md",
  "legacy/WAKE-UP-ARCHIVE.md"
]);

function read(path) {
  return readFileSync(path, "utf8");
}

function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

function occurrences(text, token) {
  return text.split(token).length - 1;
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
  const ends = [
    text.indexOf("\n### LANE-", start + 12),
    text.indexOf("\n## ", start + 12)
  ].filter(index => index >= 0);
  const end = ends.length ? Math.min(...ends) : text.length;
  return text.slice(start, end);
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
  if (suite.length !== 140) {   // D470: 139 -> 140 — the olustee row appends at the END (LANE-016). D469: 138 -> 139 — the crater row appends at the END (LANE-015). AD-7 re-pin (D443): 130 -> 131 D418 mayhem row; 131 -> 132 D436 atlanta; 132 -> 133 D442 cold harbor; D444: 133 -> 134 learn-battle; D445: 134 -> 135 chief-of-staff; D446: 135 -> 136 concept-links; D447: 136 -> 137 memory-chain; D463: 137 -> 138 fort-pillow — each appended at the END so the War Career row 38 holds
    throw new Error("complete Slice A requires suite 140, got " + suite.length);
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

  if (t1Count !== 29) throw new Error("scenario baseline must be 29, got " + t1Count);   // D436: 24 -> 25 — Atlanta registers at rank 71. D442: 25 -> 26 — Cold Harbor registers at rank 68.5. D463: 26 -> 27 — Fort Pillow registers at rank 66 (LANE-013 P4). D469: 27 -> 28 — The Crater registers at rank 71.5 (LANE-015). D470: 28 -> 29 — Olustee registers at rank 65.5 (LANE-016)
  if (schemaCount !== 62) throw new Error("schema/data baseline must be 62, got " + schemaCount);   // D436: 54 -> 56 — mayhem-rules.json (D418, pin missed then) + atlanta.json (D436); documented honestly. D442: 56 -> 57 — cold-harbor.json. D445: 57 -> 58 — chief-of-staff.json (GEA-08). D446: 58 -> 59 — concept-links.json (GEA-10). D463: 59 -> 60 — fort-pillow.json (LANE-013 P4). D469: 60 -> 61 — crater.json (LANE-015). D470: 61 -> 62 — olustee.json (LANE-016)
  if (!/people\.length\s*!==\s*1710/.test(loot) || !loot.includes("1710 of 1710")) {   // D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7); D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (the AD-7 chain idiom)
    throw new Error("Army Register 1710 pins missing");
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
    if (suite.length !== 140) throw new Error("Slice-A suite must be 140, got " + suite.length);   // D470: 139 -> 140 — the olustee row appends at the END (LANE-016). D469: 138 -> 139 — the crater row appends at the END (LANE-015). AD-7 re-pin (D443): 130 -> 133 (D418 mayhem, D436 atlanta, D442 cold harbor rows append at the END). D444: 133 -> 134 (learn-battle). D445: 134 -> 135 (chief-of-staff). D446: 135 -> 136 (concept-links). D447: 136 -> 137 (memory-chain). D463: 137 -> 138 (fort-pillow, at the END)
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
  const s14 = section(read(SPEC), "## 14 ", "## 15 ");
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
  const runtime = read(RUNTIME), journey = read(JOURNEY);
  mustInclude(runtime, [
    "WAR_CAREER_RECEIPT_V2",
    "cw_war_career_result_v2",
    "cw_war_career_participation_v2",
    "function _wcResultIdV2(",
    "function _wcParticipationEvidenceV2(",
    "function _wcResultId(",
    "function _wcAssignmentId("
  ], "receipt runtime");
  if ((runtime.match(/function _wcResultId\(/g) || []).length !== 1 ||
      (runtime.match(/function _wcAssignmentId\(/g) || []).length !== 1 ||
      !journey.includes("function _ssCareerParticipationV1(src, C)")) {
    throw new Error("D401 v1 helper boundary moved");
  }
  return { selected:"coexisting participation-v2", legacy:"D401 v1 unchanged", runtime:true };
});

step("EXACT ASSIGNMENT OWNER", () => {
  const s14 = section(read(SPEC), "## 14 ", "## 15 ");
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
  const runtime = read(RUNTIME);
  mustInclude(runtime, [
    "var _WC_TIMELINE_ASSIGNMENTS_V1 = _wcDeepFreeze([{",
    "person_gettysburg_us_17me_haley",
    "ss:gettysburg:US:us_birney_iii:pvt",
    "phaseId:\"snodgrass-horseshoe\"",
    "ss:chickamauga:US:us_harker_rock:pvt",
    "timelineGrade:\"Private\", provenance:\"Inferred\", label:\"Your Timeline\"",
    "function _wcTimelineAssignmentId(row)",
    "function _wcTimelineAssignmentUnique(personId, side, chainIndex, scenarioId)"
  ], "exact assignment runtime");
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
  const s14 = section(text, "## 14 ", "## 15 ");
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
  const runtime = read(RUNTIME);
  mustInclude(runtime, [
    "function _wcValidateCanonicalSource(",
    "function _wcValidateTimelineAssignment(",
    "function _wcSourceRefFromPerson(",
    "function _wcTimelineRefFromRow(",
    "fieldMapping = \"exact-timeline-unit\""
  ], "source versus timeline runtime");
  if (/J\.person\.unitRef\s*=/.test(runtime)) throw new Error("runtime rewrites journey.person.unitRef");
  return { bindTokenCount:bindCount, source:"immutable canonical", timeline:"exact alternate assignment", runtime:true };
});

step("SERVICE WINDOW + FAIL CLOSED", () => {
  const s14 = section(read(SPEC), "## 14 ", "## 15 ");
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
  const runtime = read(RUNTIME), journey = read(JOURNEY);
  if (!runtime.includes("function _wcKnownPresent(p, year)") ||
      !runtime.includes("function _wcServiceWindowValid(src, year)") ||
      !runtime.includes("function _wcTimelineTarget(row)") ||
      !journey.includes("if (r.year != null) p.serviceYear = r.year;")) {
    throw new Error("service-window validator seam missing");
  }
  return { sourceYear, targetYear, sourceProvenance:person.provenance, sources:person.sources.length, runtime:true };
});

step("HANDOFF + ONE-CREDIT ISOLATION", () => {
  const s14 = section(read(SPEC), "## 14 ", "## 15 ");
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
  const runtime = read(RUNTIME), journey = read(JOURNEY);
  mustInclude(runtime, [
    "function _wcParticipationResultRef(participation)",
    "_wcTimelineAssignmentUnique(J.personId, side, chainIndex, battleId)",
    "unitRef:_wcParticipationResultRef(participation)"
  ], "handoff isolation runtime");
  mustInclude(journey, [
    "function _ssCareerParticipationResultRef(participation)",
    "lineCredit.participation.schema === \"cw_war_career_participation_v2\"",
    "_ssCareerParticipationSame(ownerEvent.participation, credit.participation)"
  ], "handoff isolation sanitizer");
  return { owner:"creditKey", transfer:"none", resultLocation:true };
});

step("SAVE SANITATION + VERSION LOCK", () => {
  const s14 = section(read(SPEC), "## 14 ", "## 15 ");
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
  const journey = read(JOURNEY), runtime = read(RUNTIME);
  mustInclude(journey, [
    "function _ssCareerParticipation(src, C)",
    "src.schema === \"cw_war_career_participation_v1\"",
    "src.schema === \"cw_war_career_participation_v2\"",
    "_wcSanitizeParticipationV2(src, C)"
  ], "schema-dispatch sanitizer");
  mustInclude(runtime, [
    "function _wcSanitizeParticipationV2(src, C)",
    "cw_war_career_participation_v2",
    "_wcResultIdV2(runId, creditKey, mode, personId"
  ], "v2 sanitation runtime");
  return { saveVersion:1, sanitation:"eager deterministic idempotent fail-closed", dispatcher:true };
});

step("T2/T3/AUTO CLOSED", () => {
  const locks = {
    t2:md5(T2),
    t3:md5(T3),
    auto:md5(AUTO)
  };
  const expected = {
    // AD-7 re-pin (D443): t2 feef8a3c1ecf5fb28a120d2398ee61fc -> 57e82cd4b9873d8b56ecba51f05a4111 —
    // moved exactly once after this plan-time pin, at the LANE-007 Mayhem Slice C ship (aa2f58c,
    // D420: the authorized ruleset seam edit in T2). t3 and auto did NOT move (the closed seams held).
    t2:"57e82cd4b9873d8b56ecba51f05a4111",
    t3:"56e2cd1060a40eb0754b19e8d56bacdb",
    auto:"9396ff63e2feb299a90c2640c29ace51"
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
  // D411 transition history (design §18 count/pin table): srcTree moved
  // 13544d1904aaa1ff3ade0c6deaa2f2d5 -> a48ceb72a951d516404f5eec29ec2d2b,
  // runtime adc2dd9583c85cde86bbfb142cb6d666 -> 91bd8cd3c80e59b510726e29a16c89bb,
  // journey d9bc846734683c4ebcb00babbcc161ab -> 25c1226edb05f9a1186d0ae4f301656d,
  // focused 23e67503bed073d46f9f31ff3b715012 -> 5e856b3f21e371f867ce99f848c0a155;
  // command and commandProbe NEVER move.
  // D413 transition history (D408 §17 Matters-of-State runtime): srcTree moved
  // a48ceb72a951d516404f5eec29ec2d2b -> a4a46fbcff478c239de037f4a63105a4
  // (src/106 political reader + src/32 seam guards), runtime
  // 91bd8cd3c80e59b510726e29a16c89bb -> 8e09ebbf56ba3433712f91936f438e5d,
  // focused 5e856b3f21e371f867ce99f848c0a155 -> b7d6246e10357afc2a4e8f07f8c5dcea;
  // journey, command, and commandProbe did NOT move.
  const expected = {
    // AD-7 re-pin (D443) at the audit head: srcTree a4a46fbcff478c239de037f4a63105a4 ->
    // d1792e99f3ecbff70a3ba3cfd87eecb6 (the D414-D442 release train: D418/D420 Mayhem A-C,
    // D423-D430 FIX-NOW incl. src/107, D433-D441 overnight run incl. src/108 + the D443
    // latch fix, D442 Cold Harbor T1/T10); runtime 8e09ebbf56ba3433712f91936f438e5d ->
    // ee83045eaaa20c96c3c09579599614c8 (D438 §19 franchise archive in src/106); focused
    // b7d6246e10357afc2a4e8f07f8c5dcea -> a29a53516ea00c7a2f3aa4602c786dc8 (D425 pin fixes,
    // D436 1566, D438 §19 step, D442 1614). journey, command, and commandProbe did NOT move.
    // D456 re-pin (the AD-7 idiom, at the LANE-012 Slice-1 head): srcTree d1792e99 ->
    // 28d894d9 (D456 teaching companion — src/113 enrolls at manifest 113; guarded seams in
    // src/100 briefing + src/107 AAR/Chronicle). runtime/journey/command/focused/commandProbe
    // did NOT move — the war-career surface itself is untouched.
    // D457 re-pin (the AD-7 idiom, at the LANE-012 Slice-2 head): srcTree 28d894d9 ->
    // 41ee94b1 (D457 Historical no-quarter unlock — the src/107 massacre-block/adapters/
    // judged panel, the src/33+34 infamy-shock reads, the src/62 reprisal read, the src/82
    // guarded seam). runtime/journey/command/focused/commandProbe did NOT move.
    // D463 re-pin (the AD-7 idiom, at the LANE-013 P4 head): srcTree 41ee94b1 -> 916d7e72
    // (the Fort Pillow runtime — the T1 rank-66 registry line + the T10 W/false/anv meta
    // row; zero engine code). runtime/journey/command/commandProbe did NOT move.
    // D468 re-pin (the AD-7 idiom, at the LANE-014 slice-2 head): srcTree 916d7e72 ->
    // 03c2cdba (terrain texturing T32 — src/tactical/T32-terrain-texturing.js enrolls after
    // T31 in the manifest; presentation-only, no war-career surface touched).
    // runtime/journey/command/focused/commandProbe did NOT move.
    // D469 re-pin (the AD-7 idiom, at the LANE-015 Crater head): srcTree 03c2cdba -> bab9cca1
    // (the T1 rank-71.5 registry line + the T10 E/true/anv meta row; zero engine code).
    // runtime/journey/command/commandProbe did NOT move.
    // D470 re-pin (the AD-7 idiom, at the LANE-016 Olustee head): srcTree bab9cca1 -> 4564d84d
    // (the T1 rank-65.5 registry line + the T10 meta row; zero engine code).
    // D470 battery root-fix 3 re-pin: srcTree 4564d84d -> cc403e85 — T23's async GLB apply
    // routes through the wrapped fld3dSyncUnit seam (atomic sibling hide/park with the
    // attach; presentation-only, no war-career surface touched).
    // D472 re-pin (the AD-7 idiom, at the LANE-014 slice-3 head): srcTree cc403e85 ->
    // b0a88e93 (HDRI sky T33 — src/tactical/T33-hdri-sky.js enrolls after T32 in the
    // manifest; presentation-only, no war-career surface touched).
    // runtime/journey/command/focused/commandProbe did NOT move.
    // D473 re-pin (the AD-7 idiom, at the LANE-014 slice-4 head): srcTree b0a88e93 ->
    // a7d2eef4 (ground camera T34 — src/tactical/T34-ground-camera.js enrolls after T33;
    // presentation-only, no war-career surface touched).
    // runtime/journey/command/focused/commandProbe did NOT move.
    // D474 battery root-fix re-pin: srcTree a7d2eef4 -> 8395da0a (T34's wrapped reposition
    // commands expose _gcDelegate for probe-field's GEA-03 source tooth; introspection only).
    // D476 re-pin (LANE-014 slice 5): srcTree 8395da0a -> 7cc295df (T24 distance-LOD near
    // set + T23 runtime license wall; presentation-only, no war-career surface touched).
    // D478 re-pin (LANE-017 slice 1): srcTree 7cc295df -> ce48e9ae (the cwTierInfo one-rarity-language
    // helpers in src/37 + the T14 tier-tinted rung glyph; presentation-only, no war-career surface).
    // D479 re-pin (LANE-017 slice 2): srcTree ce48e9ae -> 4eed52e8 (drop feel in src/37 —
    // announcement panel + flip/glow + view-side sort/filter + the additive recentDrops
    // sanitizer; presentation-only, no war-career surface).
    srcTree:"4eed52e8afc6cf2b5b836607e5757455",
    runtime:"ee83045eaaa20c96c3c09579599614c8",
    // D478 re-pin: journey 25c1226e -> a527600d (LANE-017 slice 1 adds the cwTierInfo/cwRungTierInfo
    // one-rarity-language helpers + the glyph-redundant card chip to src/37 — presentation-only;
    // the journey/war-career logic surfaces are untouched, proven by this probe's own runtime steps).
    // D479 re-pin: journey a527600d -> 1689c4a2 (LANE-017 slice 2 drop feel in src/37 — the
    // recentDrops presentation record + announcement/flip/glow renderers + view-side sort/filter;
    // the journey/war-career logic surfaces are untouched, proven by this probe's own runtime steps).
    journey:"1689c4a205df5efad47d28e21962e0d5",
    command:"8f12c49f7129b3a9be0203677822e048",
    // D460 re-pin (the AD-7 idiom): focused a29a5351 -> 2816a82c — probe-war-career.mjs
    // carries the D460 register chain (1614 -> 1617, Elkhorn Cherokee OOB); the war-career
    // runtime surface itself did NOT move. D463 re-pin: focused 2816a82c -> 664ca996 —
    // probe-war-career.mjs carries the D463 register chain (1617 -> 1632) and the suite
    // 138 pins; the runtime surface held.
    // D466 re-pin: focused 664ca996 -> 3da0dbc0 (the src/82 frozen-pin chain moved with
    // the D457 seam acknowledgment; the war-career runtime surface held).
    // D469 re-pin: focused 3da0dbc0 -> bb7a1bc9 — probe-war-career.mjs carries the D469
    // register chain (1632 -> 1671, The Crater); the war-career runtime surface held.
    // D470 re-pin: focused bb7a1bc9 -> 78633570 — probe-war-career.mjs carries the D470
    // register chain (1671 -> 1710, Olustee); the war-career runtime surface held.
    // D470 battery root-fix re-pin: focused 78633570 -> 65e9c8730dfa6cb0250feddd3adabf6f — the probe's own suite-count
    // tooth (138 -> 140) missed by the D469/D470 sweeps, fixed at its exact label (the
    // D443 AD-6 precedent); the war-career runtime surface held.
    focused:"65e9c8730dfa6cb0250feddd3adabf6f",
    commandProbe:"5ffd40fd221179f2e01cad59ef43bf7d"
  };
  for (const key of Object.keys(expected)) {
    if (locks[key] !== expected[key]) throw new Error(key + " D411-complete lock moved: " + locks[key]);
  }
  const changed = gitChangedPaths();
  const forbidden = changed.filter(path => !D408_CONTRACT_ALLOWED.has(path));
  if (forbidden.length) {
    throw new Error("D408 contract allowlist violation: " + forbidden.join(", "));
  }
  const runtimeText = read(RUNTIME), journeyText = read(JOURNEY), commandText = read(COMMAND);
  const focusedText = read(FOCUSED), commandProbeText = read(COMMAND_PROBE);
  for (const token of [
    "cw_war_career_participation_v2",
    "cw_war_career_result_v2",
    "_WC_TIMELINE_ASSIGNMENTS_V1",
    "_wcResultIdV2",
    "cw_war_career_billet_v1",
    "function warCareerCreditAward(credit)",
    "function warCareerDeriveAdvancement(C, J)",
    "function warCareerStrategicGeneral(C)",
    "function warCareerCommandProjection(C)",
    "cw_war_career_relationship_signal_v1",
    "cw_war_career_relationship_edge_v1",
    "function warCareerRelationshipSignal(C, J, event)",
    "function warCareerRelationshipSignalClean(row, C, owner)",
    "function _wcRelationshipReduce(transitions, J)",
    "function warCareerRebuildRelationships(C, J)"
  ]) {
    if (!runtimeText.includes(token)) throw new Error("Slice-D runtime missing: " + token);
  }
  mustInclude(runtimeText, [
    "if (credit.outcome === \"victory\" && credit.type === \"decisive\") return { merit:4, reputation:3 }",
    "if (credit.outcome === \"defeat\") return { merit:0, reputation:-1 }",
    "Math.max(0, Math.min(128, result.merit + award.merit))",
    "Math.max(-64, Math.min(96, result.reputation + award.reputation))",
    "4 * (result.promotionCount + 1)",
    "timelineLabel:\"Your Timeline\"",
    "schema:\"cw_war_career_strategic_general_v1\"",
    "Math.min(2, 1 + Math.floor(reputation / 4))",
    "Math.min(4, 2 + Math.floor(reputation / 4))",
    "var _WC_REL_EDGE_MAX = 24",
    "var _WC_REL_HISTORY_MAX = 4",
    "var _WC_REL_TARGET_NAMESPACE = \"command-general-v1\"",
    "return { code:\"high-command-decisive-victory\", delta:2 }",
    "return { code:\"high-command-victory\", delta:1 }",
    "return { code:\"high-command-draw\", delta:0 }",
    "return { code:\"high-command-defeat\", delta:-1 }",
    "return { code:\"high-command-decisive-defeat\", delta:-2 }",
    "event.relationshipSignal = eventSignal",
    "credit.relationshipSignal = creditSignal",
    "origin:\"emergent-timeline\"",
    "timelineLabel:\"Your Timeline\"",
    "sourceRefs:[]",
    "Relationship memory — Your Timeline",
    "Personal rapport",
    "Remembered network"
  ], "Slice-D advancement, relationship, and projection runtime");
  if (!journeyText.includes("warCareerRebuildRelationships(C, clean)")) {
    throw new Error("journey sanitizer does not rebuild relationship authority");
  }
  const transitionBlock = (runtimeText.match(/function _wcRelationshipTransitionId[\s\S]*?\n\}/) || [""])[0];
  mustInclude(transitionBlock, [
    "runId, creditKey, eventId, actorPersonId",
    "_WC_REL_TARGET_NAMESPACE, targetId, eventCode",
    "].join(\"|\")"
  ], "relationship transition identity");
  if (/\bordinal\b/.test(transitionBlock)) throw new Error("relationship transition identity includes ordinal");
  const cleanBlock = (runtimeText.match(/function warCareerRelationshipSignalClean[\s\S]*?\n\}/) || [""])[0];
  const reducerBlock = (runtimeText.match(/function _wcRelationshipReduce[\s\S]*?\n\}/) || [""])[0];
  if (!cleanBlock.includes('typeof row.rapportDelta !== "number"') || !cleanBlock.includes("!isFinite(row.rapportDelta)") ||
      occurrences(reducerBlock, "Math.max(-8, Math.min(8, Math.round(") !== 2 ||
      !runtimeText.includes("b.rows.slice(Math.max(0, b.rows.length - _WC_REL_HISTORY_MAX))") ||
      !runtimeText.includes("ranked.length > _WC_REL_EDGE_MAX") ||
      !runtimeText.includes("function _wcLex(a, b)") || /localeCompare/.test(reducerBlock)) {
    throw new Error("relationship sanitation, clamps, bounds, or canonical lexical ordering moved");
  }
  if ((runtimeText.match(/\?\s*warCareerRelationshipSignal\(C,\s*J,\s*event\)\s*:\s*null;/g) || []).length !== 1) {
    throw new Error("relationship transition producer is not exactly one shipped call");
  }
  for (const marker of [
    "WAR_CAREER_RELATIONSHIP_TRANSITION_BIND:SOLE_CALL",
    "WAR_CAREER_RELATIONSHIP_DEDUPE_BIND:PAIR_ONCE",
    "WAR_CAREER_RELATIONSHIP_PROVENANCE_BIND:EMERGENT_ONLY",
    "WAR_CAREER_RELATIONSHIP_HANDOFF_BIND:REMEMBERED_ONLY"
  ]) {
    if (occurrences(runtimeText, marker) !== 1) throw new Error("relationship bind marker moved: " + marker);
  }
  if (/\bP\.command\b/.test(runtimeText) || /J\.roleHistory\.push/.test(runtimeText)) {
    throw new Error("Slice D crossed the player/NPC owner wall or mutates saved billet history incrementally");
  }
  const commandTargetSelector = (runtimeText.match(/function _wcRelationshipCommandTarget[\s\S]*?\n\}/) || [""])[0];
  if (occurrences(runtimeText, "C.president.command") !== 1 || occurrences(commandTargetSelector, "commandState.") !== 1 ||
      occurrences(commandTargetSelector, "cmdActiveId(C)") !== 1 || occurrences(commandTargetSelector, "cmdActiveGeneral(C)") !== 1 ||
      !commandTargetSelector.includes("commandState._activeId") || !commandTargetSelector.includes("general.id !== targetId") ||
      /commandState\s*\[/.test(commandTargetSelector) ||
      /(?:delete\s+commandState\b|commandState\s*(?:\.|\[)[^;\n]*(?:\+\+|--|(?:[+\-*/%&|^]|<<|>>)?=(?!=))|Object\.(?:assign|defineProperty)\s*\(\s*commandState)/.test(commandTargetSelector)) {
    throw new Error("Slice D command target selector crossed its one-read no-write wall");
  }
  const consumerCount = (commandText.match(/Number\(warCareerCommandProjection\(C\)\)/g) || []).length;
  if (consumerCount !== 1 || !commandText.includes("career = Math.max(0, Math.min(4, career))") ||
      !commandText.includes("lead += career") || !commandText.includes("Math.max(42, Math.min(88, Math.round(lead)))")) {
    throw new Error("commandLeadership must carry exactly one capped contribution before its existing clamp");
  }
  for (const token of ["warCareerMerit", "warCareerReputation", "careerMerit", "careerReputation"]) {
    if (commandText.includes(token)) throw new Error("forbidden player-career alias under P.command: " + token);
  }
  for (const name of [
    "D406 LEDGER-DERIVED ADVANCEMENT",
    "D406 REACHABLE FIELD + GENERAL COMMAND",
    "D406 BILLET SANITATION + ZERO MATRIX",
    "D406 HANDOFF + NO-STACK ISOLATION"
  ]) {
    if (!focusedText.includes(name)) throw new Error("focused War Career tooth missing: " + name);
  }
  const d407Rows = [
    "D407 RELATIONSHIP TRANSITIONS + ONE-CREDIT",
    "D407 PROVENANCE + SOURCE HONESTY",
    "D407 SANITATION + BOUNDED DEDUPE",
    "D407 HANDOFF MEMORY + OWNER ISOLATION + AAR"
  ];
  for (const name of d407Rows) {
    if (occurrences(focusedText, "step('" + name + "'") !== 1) throw new Error("focused D407 row moved: " + name);
  }
  // D411: one reachability browser row (42 literal steps -> 43/43 with the static
  // preflight row) and one bounds-carry static wall (30/30) joined the D407 structure.
  // D413: the ONE D408 §17 Matters-of-State browser row joined (42 -> 43 literal steps,
  // 44/44 with the static preflight row); static walls stayed 30/30.
  // AD-7 re-pin (D443): the ONE D438 §19 franchise-archive browser row joined (43 -> 44
  // literal steps, 45/45 with the static preflight row); check( walls stayed 31.
  if ((focusedText.match(/\bstep\('/g) || []).length !== 44 || (focusedText.match(/\bcheck\(/g) || []).length !== 31) {
    throw new Error("focused source row/static structure moved from 44 literal steps + 31 checks");
  }
  if (occurrences(focusedText, "step('D411 REACHABILITY + SOURCE-BOUNDED SERVICE'") !== 1) {
    throw new Error("focused D411 reachability row moved");
  }
  if (occurrences(focusedText, "step('D408 MATTERS OF STATE + VISIBLE DEFER'") !== 1) {
    throw new Error("focused D408 Matters-of-State row moved");
  }
  for (const name of [
    "D406: default, legacy, and excluded careers contribute zero — commandLeadership is byte-identical",
    "D406: commandLeadership consumes one projection exactly once — exact unclamped delta and repeated reads do not stack",
    "D406: the existing 42..88 commandLeadership clamp stays authoritative after the career contribution",
    "D406: player journey and NPC P.command ledgers stay byte-separate in both directions"
  ]) {
    if (!commandProbeText.includes(name)) throw new Error("focused Command tooth missing: " + name);
  }
  const s15 = section(read(SPEC), "## 15 ", "## 16 ");
  mustInclude(s15, [
    "D406 Slice C runtime contract",
    "decisive victory",
    "4 * (prior promotions + 1)",
    "cw_war_career_billet_v1",
    "wcta-144pyv4",
    "wcta-11pxx98",
    "wcta-9be2qw",
    "commandLeadership(C)",
    "exactly once",
    "P.command",
    "T2, T3, Auto",
    "Slice D-F"
  ], "Slice-C-complete contract");
  const s16 = section(read(SPEC), "## 16 ", "## 17 ");
  mustInclude(s16, [
    "D407 Slice D runtime contract",
    "command-general-v1|<targetId>",
    "-8..8",
    "24 edges",
    "four event-history rows",
    "high-command-decisive-victory",
    "emergent-timeline",
    "Your Timeline",
    "historical-authored",
    "event.relationshipSignal",
    "credit.relationshipSignal",
    "COMRADE HAND-OFF",
    "Personal rapport",
    "Remembered network",
    "Slice E"
  ], "Slice-D-complete contract");
  const s17 = section(read(SPEC), "## 17 ", null);
  mustInclude(s17, [
    "D408 Slice E political-pull contract",
    "nationalDecisions",
    "Matters of State",
    "has no production consumer at this boundary",
    "WAR_CAREER_POLITICAL_DATE_BIND:QUALIFYING_RECEIPT_YEAR_1864_OR_LATER",
    "warCareerRole(C).id === \"general-command\"",
    "battleYear >= 1864",
    "Visible defer",
    "decOnResolve",
    "decRenderTab",
    "decInterstitialHTML",
    "_decWireCards",
    "decResolve",
    "_decApply",
    "Legacy or no-career campaigns bypass the capability gate",
    "src/106-war-career.js",
    "src/32-decisions.js",
    "src/30-president-shell.js",
    "Five byte-restored negative binds",
    "Slice F stays closed"
  ], "D408 Slice-E contract");
  if (occurrences(read(SPEC), "WAR_CAREER_POLITICAL_DATE_BIND:QUALIFYING_RECEIPT_YEAR_1864_OR_LATER") !== 1) {
    throw new Error("D408 political-date bind token moved");
  }
  return { ...locks, changed, commandConsumers:consumerCount, relationshipRows:d407Rows.length,
    status:"D407 runtime locked; D408 Slice E contracted" };
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
  if (t1Count !== 29 || schemaCount !== 62) {   // D436: 24/54 -> 25/56 (atlanta + the D418 mayhem-rules pin catch-up). D442: 25/56 -> 26/57 (cold harbor). D445: 57 -> 58 (chief-of-staff.json). D446: 58 -> 59 (concept-links.json; scenarios stay 26). D463: 26/59 -> 27/60 (fort-pillow, LANE-013 P4). D469: 27/60 -> 28/61 (crater, LANE-015). D470: 28/61 -> 29/62 (olustee, LANE-016)
    throw new Error("scenario/schema baseline moved: " + t1Count + "/" + schemaCount);
  }
  if (!/people\.length\s*!==\s*1710/.test(loot) || !loot.includes("1710 of 1710")) {   // D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7); D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (the AD-7 chain idiom)
    throw new Error("Army Register 1710 pins missing");
  }
  if (rosterExpected.length !== 29 || builderExpected.length !== 29 ||   // D442: 25 -> 26 — coldHarbor inserts between spotsylvania and petersburgAssaults. D463: 26 -> 27 — fortPillow inserts between chattanooga and wilderness. D469: 27 -> 28 — crater inserts between atlanta and cedarCreek (LANE-015). D470: 28 -> 29 — olustee inserts between chattanooga and fortPillow (LANE-016)
      normalize(rosterExpected.join(" ")) !== normalize(builderExpected.join(" "))) {
    throw new Error("coverage baselines moved");
  }
  if (suite.length !== 140 || !suite[37] || suite[37][1] !== "tools/probe-war-career.mjs") {   // D436: 130 -> 132 (mayhem row D418 missed this pin; atlanta row appends at the end so row 38 holds). D442: 132 -> 133 (cold harbor row appends at the end; row 38 still holds). D444: 133 -> 134 (learn-battle). D445: 134 -> 135 (chief-of-staff). D446: 135 -> 136 (concept-links). D447: 136 -> 137 (memory-chain). D463: 137 -> 138 (fort-pillow, each at the end; row 38 still holds)
    throw new Error("suite 137 / War Career row 38 moved");
  }
  if (!read(SWEEP).includes("var reg = fldScenarioRegistry()") ||
      !read(SWEEP).includes("var order = (typeof fldScenarioMenuOrder==='function')")) {
    throw new Error("24-scenario sweep registry seam moved");
  }
  // D411 transition history (design §18 count/pin table): game moved
  // 502aee3fc5867b970225a59c06cd6102 -> 7de51b310e09a710eb83ade276952203 and
  // dataTree b0d7f440836b60a4f18401b2d7b03f48 -> 3250a3f555de5e648471897978646daf;
  // base, manifest, and suite NEVER move.
  // D413 transition history (D408 §17 runtime): game moved
  // 7de51b310e09a710eb83ade276952203 -> 9d7d91078dd8fceea847f1c2aff4dc5f;
  // dataTree, base, manifest, and suite did NOT move.
  const expectedHashes = {
    // AD-7 re-pin (D443) at the audit head: game/dataTree moved across the D414-D442
    // release train (Mayhem A-C, FIX-NOW, the overnight run, Cold Harbor + the D443
    // audit root-fixes); manifest 7924da858de403cac58caabf8c9fcce8 ->
    // 60f73b23f03f08b978011100f6dea14d (D440 enrolls src/108); suite
    // 4bcdc6f252389a4bfd6bed269b52f8f0 -> 69987b22cda2916fb42f0a3f04b96a1b (D418 row 131,
    // D431 900s budget, D436 row 132, D442 row 133). base NEVER moves (frozen).
    // D454 re-pin (the AD-7 idiom, at the AD-0 completion head): the D454 battery root
    // fixes legitimately moved three surfaces — dataTree 108961c5 -> 379d4223 and game
    // 4f9adfe5 -> 6113bc2c (the row-'weather' fix: cold-harbor.json weather provenance
    // decorated-string -> exact "Verified" enum, bbffcb4, + rebuild); suite 69987b22 ->
    // edba2bd9 (the row-'gettysburg' 600s slow-Mac budget in timeoutFor, 7916d14).
    // base/manifest/srcTree/runtime/journey/focused did NOT move (no src edit all night).
    // D456 re-pin (the AD-7 idiom, at the LANE-012 Slice-1 head): game 6113bc2c -> 2171f60d
    // and manifest 60f73b23 -> bb5d7903 (D456 teaching companion — src/113 enrolls, guarded
    // seams in src/100 + src/107, rebuild). base/dataTree/suite did NOT move.
    // D457 re-pin (the AD-7 idiom, at the LANE-012 Slice-2 head): game 2171f60d -> a6cbfd2d
    // and dataTree 379d4223 -> 8647e586 (D457 Historical no-quarter unlock — the declared
    // `no-quarter-historical` consequence-only action in data/mayhem-rules.json + the
    // src/107/33/34/62/82 slice, rebuild). base/manifest/suite did NOT move.
    // D460 chain (the AD-7 idiom): game a6cbfd2d -> 7c13850e and dataTree 8647e586 -> d1c6557f
    // — LANE-013 P2 Elkhorn Cherokee OOB (data/elkhorn-tavern.json only: Watie's 2nd CMR
    // phase-2 unit + source rows + the Drew transition record; rebuild). base/manifest/suite
    // and srcTree did NOT move.
    // D463 re-pin (the AD-7 idiom, at the LANE-013 P4 head): game 7c13850e -> 7e212198,
    // dataTree d1c6557f -> abee76fa (data/fort-pillow.json enrolls + rebuild), suite
    // edba2bd9 -> 0f8550a5 (the fort pillow row at the END, 137 -> 138). base/manifest hold.
    // D466 re-pin (the AD-7 idiom, at the P6 battery head): game 7e212198 -> f0228c4b and
    // dataTree abee76fa -> e33afffc — the S44-forced western-theater currentArc copy
    // update (Fort Pillow arc entry + rebuild; the battery's one red, root-fixed at its
    // exact label). base/manifest/suite/srcTree/focused hold.
    // D467 re-pin (the AD-7 idiom, at the LANE-014 slice-1 head): game f0228c4b -> 11099dac
    // and dataTree e33afffc -> 23ccef52 — the assets3d provenance wall (media-budget 1.9
    // policy + ledgerClasses; rebuild; zero src). base/manifest/suite/srcTree/focused hold.
    // D468 re-pin (the AD-7 idiom, at the LANE-014 slice-2 head): game 11099dac -> 9fca6932
    // and manifest bb5d7903 -> bf29b44f — terrain texturing T32 enrolls after T31
    // (presentation-only src module + rebuild). base/dataTree/suite hold.
    // D469 re-pin (the AD-7 idiom, at the LANE-015 Crater head): game 9fca6932 -> 1757fdbf,
    // dataTree 23ccef52 -> 3cd4ccb2 (data/crater.json enrolls + rebuild), suite 0f8550a5 ->
    // 7b36f51e (the crater row at the END, 138 -> 139, + the 600s budget). base/manifest hold.
    // D470 re-pin (the AD-7 idiom, at the LANE-016 Olustee head): game 1757fdbf -> 21a5216d,
    // dataTree 3cd4ccb2 -> 4bbdebe5 (data/olustee.json enrolls + rebuild), suite 7b36f51e ->
    // cf5de9f6 (the olustee row at the END, 139 -> 140, + the 600s budget). base/manifest hold.
    // D470 battery root-fix 3 re-pin: game 21a5216d -> b26238de — T23's async GLB apply
    // routes through the wrapped fld3dSyncUnit seam (rebuild). base/dataTree/manifest/suite hold.
    // D472 re-pin (the AD-7 idiom, at the LANE-014 slice-3 head): game b26238de -> c72c7585,
    // manifest bf29b44f -> 2fdf5fb3, suite cf5de9f6 -> 69681d6f — HDRI sky T33 enrolls after
    // T32 (presentation-only src module + rebuild; + the probe-visual-fidelity 600s slow-Mac
    // budget line). base/dataTree hold.
    // D473 re-pin (the AD-7 idiom, at the LANE-014 slice-4 head): game c72c7585 -> 584e5c6f,
    // manifest 2fdf5fb3 -> 4625dca9 — ground camera T34 enrolls after T33 (presentation-only
    // src module + rebuild). base/dataTree/suite hold.
    // D474 battery root-fix re-pin: game 584e5c6f -> bcfd6454 (T34 _gcDelegate exposure for
    // probe-field's GEA-03 source tooth + rebuild). base/dataTree/manifest/suite hold.
    // D476 re-pin (LANE-014 slice 5): game bcfd6454 -> a234c52a (T24 near-LOD + T23 runtime
    // license wall + rebuild). base/dataTree/manifest/suite hold.
    // D478 re-pin (LANE-017 slice 1): game a234c52a -> 9dd15ca2 (rarity glyphs/reserved hexes in
    // data/loot-survival.json + the src/37 helpers + T14 tint + rebuild). base/manifest/suite hold.
    // D479 re-pin (LANE-017 slice 2): game 9dd15ca2 -> b74053aa (drop feel in src/37 + rebuild;
    // presentation-only). base/dataTree/manifest/suite hold.
    game:"b74053aadec893d499dd5e96198fb542",
    base:"c9db83fa99230ffb95bdfdfe059f3fb9",
    // D478 re-pin: dataTree 4bbdebe5 -> b3b323fa (LANE-017 slice 1: rarity glyphs + reserved tier
    // hexes + rungTiers in data/loot-survival.json — presentation data only, no war-career data).
    dataTree:"b3b323faa7e2e92137504d94bd568044",
    manifest:"4625dca91b9b2cd8e65c1a9439160cf2",
    suite:"69681d6f2216fe1dcfd594ffc4a757b7"
  };
  for (const key of Object.keys(expectedHashes)) {
    if (hashes[key] !== expectedHashes[key]) throw new Error(key + " baseline moved: " + hashes[key]);
  }
  mustInclude(lane, [
    "Owner: none",
    "State: CONTRACT",
    "D408 Slice E",
    "nationalDecisions",
    "Matters of State",
    "battleYear >= 1864",
    "general-command",
    "Visible defer",
    "Five byte-restored negative binds",
    "cw_war_career_relationship_signal_v1",
    "cw_war_career_relationship_edge_v1",
    "command-general-v1",
    "emergent-timeline",
    "Your Timeline",
    "War Career 42/42",
    "static 29/29",
    "Command 94/94",
    "plan 19/19",
    "Bind A",
    "Bind B",
    "Bind C",
    "Bind D",
    "D406",
    "source/command/save/T2/T3/Auto isolation",
    "D398 remains the latest full release battery",
    "`npm run vet:noreg` was not run",
    "Slice E runtime",
    "separate",
    "/private/tmp/codex-vg-recovery-019f62fe",
    "No simultaneous edits"
  ], "D407 release lane");
  mustInclude(decision, [
    "RESOLVED by the D404 planning contract",
    "coexisting `cw_war_career_participation_v2`",
    "wcta-1pav4ac",
    "SHIPPED by D405",
    "T2, T3, Auto, data, command projection, and later slices remain closed"
  ], "receipt decision resolution");
  const expectedStepNames = [
    "SPEC CORE", "SEAM INVENTORY", "STATE OWNERSHIP", "TRANSITIONS", "DEATH + IRONMAN",
    "POLITICAL PULL", "ARCHETYPES", "IMPLEMENTATION LADDER", "EXCLUSIONS + BASELINES", "LANE",
    "RECEIPT CONTINUITY LAW", "EXACT ASSIGNMENT OWNER", "SOURCE VS YOUR TIMELINE",
    "SERVICE WINDOW + FAIL CLOSED", "HANDOFF + ONE-CREDIT ISOLATION", "SAVE SANITATION + VERSION LOCK",
    "T2/T3/AUTO CLOSED", "SLICE C RUNTIME STILL LOCKED", "BASELINES + LANE"
  ];
  const actualStepNames = result.steps.map(row => row.name).concat("BASELINES + LANE");
  if (JSON.stringify(actualStepNames) !== JSON.stringify(expectedStepNames)) {
    throw new Error("plan probe 19-row names moved: " + JSON.stringify(actualStepNames));
  }
  return {
    scenarios:t1Count,
    schemas:schemaCount,
    armyRegister:1512,
    coverage:rosterExpected.length,
    suite:suite.length,
    sweep:t1Count,
    warCareerRow:38,
    saveVersion:1,
    planRows:expectedStepNames.length,
    hashes
  };
});

/* ── D410 reachability-contract steps (appended; the original 19 names/order above
   are retained exactly and this probe stays out of the release suite). These teeth
   pin the §18 contract, the source-bounded Rhodes fixture, the adapter carry law,
   and the count/pin transition table so the D411 runtime take cannot drift. */

const DECISIONS = join(ROOT, "DECISIONS.md");
const ANTIETAM = join(DATA, "antietam.json");
const VICKSBURG = join(DATA, "vicksburg.json");
const CHATTANOOGA = join(DATA, "chattanooga.json");
const NASHVILLE = join(DATA, "nashville.json");
const D410_BIND = "WAR_CAREER_REACHABILITY_BIND:SERVICE_BOUNDS_ARE_SOURCED_NEVER_INVENTED";
const D410_APPROVAL = "Aaron approved DECISIONS.md D409 option 1 on 2026-07-16";
const D410_PERSON = "person_bullrun_us_2ri_rhodes";
const D410_SOURCE_SLOT = "ss:bullrun1:US:us_burnside:pvt";
const D410_RUN_ID = "run-us-d410-1";
const D410_LADDER = [
  { rung:1, idx:1,  scenarioId:"bullrun1",    phaseId:null,                       unitId:"us_burnside",     slot:"pvt", grade:"Private",    year:1861, assignmentId:null,          dataPath:null,        roll:196 },
  { rung:2, idx:9,  scenarioId:"antietam",    phaseId:"sunkenroad",               unitId:"us_french",       slot:"nco", grade:"Sergeant",   year:1862, assignmentId:"wcta-fa53w4", dataPath:ANTIETAM,    roll:204 },
  { rung:3, idx:14, scenarioId:"vicksburg",   phaseId:"forlorn-hope",             unitId:"us_deg_battery",  slot:"cmd", grade:"Captain",    year:1863, assignmentId:"wcta-inib47", dataPath:VICKSBURG,   roll:264 },
  { rung:4, idx:15, scenarioId:"gettysburg",  phaseId:"day1",                     unitId:"us_hall_battery", slot:"cmd", grade:"Major",      year:1863, assignmentId:"wcta-154xy3w", dataPath:GETTYSBURG, roll:380 },
  { rung:5, idx:16, scenarioId:"chickamauga", phaseId:"the-woods",                unitId:"us_lilly_battery",slot:"cmd", grade:"Lt. Col.",   year:1863, assignmentId:"wcta-azt21w", dataPath:CHICKAMAUGA, roll:855 },
  { rung:6, idx:17, scenarioId:"chattanooga", phaseId:"missionary-ridge",         unitId:"us_hazen_mr",     slot:"cmd", grade:"Colonel",    year:1863, assignmentId:"wcta-7u1ul0", dataPath:CHATTANOOGA, roll:688 },
  { rung:7, idx:27, scenarioId:"nashville",   phaseId:"redoubts-montgomery-hill", unitId:"us_r_battery",    slot:"cmd", grade:"Brig. Gen.", year:1864, assignmentId:"wcta-9cpe74", dataPath:NASHVILLE,   roll:736 }
];

function d410Section() {
  return section(read(SPEC), "## 18 ", null);
}
function d410SlotPid(row) {
  return ["ss", row.scenarioId, "US", row.unitId, row.slot].join(":");
}
function d410TotalUnitCount(value, side, unitId) {
  let total = 0;
  for (const phase of value.phases) {
    if (!phase) continue;
    const rows = [];
    if (phase.oob && Array.isArray(phase.oob[side])) rows.push(...phase.oob[side]);
    if (Array.isArray(phase.reinforcements)) {
      rows.push(...phase.reinforcements.filter(row => row && row.side === side));
    }
    total += rows.filter(row => row && row.id === unitId).length;
  }
  return total;
}
function d410PhaseUnit(value, phaseId, side, unitId) {
  const phase = value.phases.find(row => row && row.id === phaseId);
  if (!phase) throw new Error("D410 phase missing: " + phaseId);
  const rows = [];
  if (phase.oob && Array.isArray(phase.oob[side])) rows.push(...phase.oob[side]);
  if (Array.isArray(phase.reinforcements)) {
    rows.push(...phase.reinforcements.filter(row => row && row.side === side));
  }
  const matches = rows.filter(row => row && row.id === unitId);
  return matches.length === 1 ? matches[0] : null;
}

step("REACHABILITY LAW", () => {
  const s18 = d410Section();
  mustInclude(s18, [
    "D410 reachability contract",
    D410_APPROVAL,
    "citation-grade multi-year service bounds on a documented replacement record",
    "the narrow src/37 replacement-adapter carry, and an authored",
    "nashville-1864 assignment ladder",
    "then a fresh DRIVE take implementing the unchanged D408 §17",
    "authorization the D411 reachability runtime cites for its data-lane",
    "D411's exact runtime surface is three files",
    "data/soldier-replacements.json",
    "src/37-loot-survival.js",
    "src/106-war-career.js",
    "tools/probe-war-career.mjs",
    "tools/probe-war-career-loop-plan.mjs",
    "D411 gets its own fresh",
    "committed LANE-005 DRIVE take",
    "**D410 ships none of it** — D410 is planning only and moves no",
    "runtime, data, probe-suite, or generated byte",
    "D408 §17 Matters-of-State runtime unchanged"
  ], "D410 reachability law");
  const decisions = read(DECISIONS);
  const d410 = section(decisions, "## D410 ", "## D409 ");
  mustInclude(d410, [
    D410_APPROVAL,
    "planning contract only",
    "reachability",
    D410_RUN_ID,
    "Slice F"
  ], "DECISIONS D410 entry");
  if (occurrences(read(COORD), D410_APPROVAL) !== 1) {
    throw new Error("LANE-005 must record the D409-option-1 approval line exactly once");
  }
  return { approval:"recorded", decisionsEntry:true };
});

step("SOURCE-BOUNDED SERVICE", () => {
  const s18 = d410Section();
  if (occurrences(read(SPEC), D410_BIND) !== 1) {
    throw new Error("D410 reachability bind token moved");
  }
  mustInclude(s18, [
    "Service bounds are documented facts, never invented",
    "enlisted as a private in the 2nd Rhode Island Infantry on",
    "June 5, 1861",
    "mustering out in 1865 as colonel of the regiment",
    "serviceStart:1861, serviceEnd:1865",
    "the 1861 start bound is already supported",
    "no existing source row states the",
    "1865 muster-out, so D411 must add exactly one normalized citation-grade source row",
    "All for the Union: The Civil War Diary and Letters of Elisha Hunt Rhodes",
    "Elisha Hunt Rhodes; Robert Hunt Rhodes, ed.",
    "ISBN 0-679-73828-2",
    "never rounded, widened, or inferred",
    "D411 must HALT"
  ], "source-bounded service law");
  const records = json(REPLACEMENTS).records || [];
  const rhodes = records.filter(row => row && row.pid === D410_PERSON);
  if (rhodes.length !== 1 || rhodes[0].replacePid !== D410_SOURCE_SLOT) {
    throw new Error("Rhodes source identity/slot is not unique");
  }
  const record = rhodes[0];
  if (record.year !== 1861 || record.provenance !== "Verified" || record.rank !== "Private") {
    throw new Error("Rhodes canonical year/provenance/rank moved");
  }
  const sources = Array.isArray(record.sources) ? record.sources : [];
  if (sources.length < 2) throw new Error("Rhodes record lost its independent sources");
  if (!sources.some(row => row && String(row.note || "").includes("June 5, 1861"))) {
    throw new Error("Rhodes 1861 start-bound source note missing");
  }
  // D411 shipped (was: contracted-not-landed at D410): the sourced bounds and the
  // exactly-named end-bound source row are landed data law.
  if (record.serviceStart !== 1861 || record.serviceEnd !== 1865) {
    throw new Error("Rhodes service bounds are not exactly 1861-1865: " +
      record.serviceStart + "-" + record.serviceEnd);
  }
  const endBound = sources.filter(row => row &&
    String(row.title || "") === "All for the Union: The Civil War Diary and Letters of Elisha Hunt Rhodes");
  if (endBound.length !== 1 ||
      endBound[0].author !== "Elisha Hunt Rhodes; Robert Hunt Rhodes, ed." ||
      endBound[0].repository !== "Vintage Books (Vintage Civil War Library)" ||
      endBound[0].locator !== "ISBN 0-679-73828-2" ||
      endBound[0].type !== "primary" ||
      !/1865 muster-out/.test(String(endBound[0].note || "")) ||
      !/colonel/.test(String(endBound[0].note || ""))) {
    throw new Error("the exactly-named All for the Union end-bound source row is missing or drifted");
  }
  if (records.some(row => row && row.replacePid !== D410_SOURCE_SLOT &&
      (row.serviceStart != null || row.serviceEnd != null))) {
    throw new Error("a non-Rhodes replacement record carries service bounds");
  }
  return { pid:D410_PERSON, replacePid:D410_SOURCE_SLOT, sources:sources.length, bounds:"landed-1861-1865" };
});

step("LADDER FIXTURE + ASSIGNMENT IDS", () => {
  const s18 = d410Section();
  mustInclude(s18, [
    "seven-rung Rhodes path on the US chain",
    "sourceSlotPid:\"ss:bullrun1:US:us_burnside:pvt\"",
    "serviceStart:null, serviceEnd:null, serviceYear:<rung year>",
    "provenance:\"Inferred\"",
    "label:\"Your Timeline\"",
    "unique non-hq `_wcTimelineTarget`",
    "exactly once across ALL phases",
    "wcta-fa53w4", "wcta-inib47", "wcta-154xy3w", "wcta-azt21w", "wcta-7u1ul0", "wcta-9cpe74",
    "4 * (promotions + 1)",
    "4/8/12/16/20/24",
    "run-us-d410-1",
    "196, 204, 264, 380, 855, 688, 736",
    "1861, 1862, 1863, 1863, 1863, 1863, 1864"
  ], "ladder fixture");
  const chain = campaignChain(read(BASE), "US");
  const records = json(REPLACEMENTS).records || [];
  const rolls = [];
  let merit = 0, promotions = 0;
  for (const row of D410_LADDER) {
    if (chain[row.idx] !== row.scenarioId) {
      throw new Error("US chain[" + row.idx + "] is " + chain[row.idx] + ", not " + row.scenarioId);
    }
    const slotPid = d410SlotPid(row);
    if (row.assignmentId) {
      const value = scenario(row.dataPath, row.scenarioId);
      if (d410TotalUnitCount(value, "US", row.unitId) !== 1) {
        throw new Error(row.scenarioId + " unit " + row.unitId + " is not unique across all phases");
      }
      const unit = d410PhaseUnit(value, row.phaseId, "US", row.unitId);
      if (!unit) throw new Error(row.scenarioId + " unit missing from phase " + row.phaseId);
      if (unit.type === "hq" || unit.arm === "hq") throw new Error(row.scenarioId + " target is an hq unit");
      if (records.some(record => record && record.replacePid === slotPid)) {
        throw new Error(row.scenarioId + " target slot is not open: " + slotPid);
      }
      const idParts = [
        D410_PERSON, D410_SOURCE_SLOT, row.scenarioId, "US", row.unitId, row.slot, slotPid,
        row.idx, "", "", row.year, row.grade, "timeline-assignment-v1"
      ];
      const assignmentId = "wcta-" + wcHash(idParts.join("|")).toString(36);
      if (assignmentId !== row.assignmentId) {
        throw new Error(row.scenarioId + " assignment id drifted: " + assignmentId);
      }
    }
    const creditKey = [D410_RUN_ID, "US", row.idx, row.scenarioId].join("|");
    const roll = wcHash([D410_RUN_ID, creditKey, D410_PERSON, slotPid, "personal-fate"].join("|")) % 1000;
    if (roll !== row.roll || roll < 100) {
      throw new Error(row.scenarioId + " fate roll drifted or non-alive: " + roll);
    }
    rolls.push(roll);
    merit += 4;
    if (row.rung <= 6) {
      if (merit < 4 * (promotions + 1)) {
        throw new Error("rung " + row.rung + " misses the D406 merit threshold");
      }
      promotions++;
    }
  }
  if (promotions !== 6 || merit !== 28) throw new Error("ladder does not reach Brig. Gen. at merit 28");
  return { runId:D410_RUN_ID, rolls, promotions, merit,
    assignmentIds:D410_LADDER.filter(row => row.assignmentId).map(row => row.assignmentId) };
});

step("ADAPTER CARRY + CONSUMERS", () => {
  const s18 = d410Section();
  mustInclude(s18, [
    "no `serviceYear` pin",
    "keeps today's single-`year` law byte-for-byte",
    "both present, both finite integers within",
    "1800-1900",
    "serviceStart <= serviceEnd",
    "inside",
    "[serviceStart, serviceEnd]",
    "dropped through reconstruction",
    "never widen a window",
    "if (r.year != null) p.serviceYear = r.year;",
    "_ssUnitSpecs", "_ssAddPerson", "_ssApplySoldierReplacements", "ssValidateSoldierReplacementPack",
    "_ssJourneySnapshot", "_ssCleanJourney",
    "_wcServiceWindowValid", "_wcSourceRefFromPerson", "_wcTimelineAssignmentId",
    "_wcCalculateAdvancement", "warCareerDeriveAdvancement", "_wcKnownPresent",
    "The Army Register count stays exactly **1512**",
    "no new",
    "person, row, or slot is created"
  ], "adapter carry law");
  const journeyText = read(JOURNEY), runtimeText = read(RUNTIME);
  if (occurrences(journeyText, "if (r.year != null) p.serviceYear = r.year;") !== 1) {
    throw new Error("the single-year replacement law literal moved in src/37");
  }
  for (const token of [
    "function _ssApplySoldierReplacements(C, reg, year)",
    "function ssValidateSoldierReplacementPack(pack, opts)",
    "function _ssJourneySnapshot(p, warCareerV1)",
    "function _ssCleanJourney(C, L)"
  ]) {
    if (!journeyText.includes(token)) throw new Error("src/37 consumer seam missing: " + token);
  }
  for (const token of [
    "function _wcServiceWindowValid(src, year)",
    "function _wcSourceRefFromPerson(p)",
    "function _wcTimelineAssignmentId(row)",
    "function _wcKnownPresent(p, year)"
  ]) {
    if (!runtimeText.includes(token)) throw new Error("src/106 consumer seam missing: " + token);
  }
  // D411 shipped (was: contracted-not-landed at D410): the six frozen Rhodes ladder
  // rows and the fail-closed bounds carry are landed runtime law.
  if (occurrences(runtimeText, "sourceSlotPid:") !== 10) {
    throw new Error("_WC_TIMELINE_ASSIGNMENTS_V1 moved from its ten shipped rows");
  }
  if (occurrences(runtimeText, 'sourceSlotPid:"' + D410_SOURCE_SLOT + '"') !== 6 ||
      occurrences(runtimeText, 'personId:"' + D410_PERSON + '"') !== 6) {
    throw new Error("the six frozen Rhodes ladder rows are missing or drifted");
  }
  if (!journeyText.includes("if (r.serviceStart != null && r.serviceEnd != null) {") ||
      !journeyText.includes("r.serviceStart <= r.serviceEnd && year >= r.serviceStart && year <= r.serviceEnd")) {
    throw new Error("the D411 bounds validity/carry law is missing from src/37");
  }
  return { singleYearLaw:"byte-identical", shippedTimelineRows:10, rhodesRows:6, boundsCarry:"landed" };
});

step("REACHABILITY BASELINES", () => {
  const s18 = d410Section();
  mustInclude(s18, [
    "Move at D411, with documented history",
    "13544d1904aaa1ff3ade0c6deaa2f2d5",
    "adc2dd9583c85cde86bbfb142cb6d666",
    "d9bc846734683c4ebcb00babbcc161ab",
    "23e67503bed073d46f9f31ff3b715012",
    "b0d7f440836b60a4f18401b2d7b03f48",
    "502aee3fc5867b970225a59c06cd6102",
    "Never move",
    "c9db83fa99230ffb95bdfdfe059f3fb9",
    "43/43",
    "30/30",
    "44/44",
    "supersedes the stale",
    "suite 130 with War Career row 38",
    "_SAVE_VER=1",
    "NOT run in D410 or D411"
  ], "count and pin transitions");
  const hashes = {
    game:md5(GAME), dataTree:dataTreeMd5(), srcTree:treeMd5(SRC),
    runtime:md5(RUNTIME), journey:md5(JOURNEY), focused:md5(FOCUSED)
  };
  // D411 transition history — the §18 "Move at D411" pins moved exactly once, here:
  // game 502aee3fc5867b970225a59c06cd6102 -> 7de51b310e09a710eb83ade276952203,
  // dataTree b0d7f440836b60a4f18401b2d7b03f48 -> 3250a3f555de5e648471897978646daf,
  // srcTree 13544d1904aaa1ff3ade0c6deaa2f2d5 -> a48ceb72a951d516404f5eec29ec2d2b,
  // runtime adc2dd9583c85cde86bbfb142cb6d666 -> 91bd8cd3c80e59b510726e29a16c89bb,
  // journey d9bc846734683c4ebcb00babbcc161ab -> 25c1226edb05f9a1186d0ae4f301656d,
  // focused 23e67503bed073d46f9f31ff3b715012 -> 5e856b3f21e371f867ce99f848c0a155.
  // D413 transition history — the D408 §17 runtime moved exactly the reader/seam/proof
  // surface: game 7de51b310e09a710eb83ade276952203 -> 9d7d91078dd8fceea847f1c2aff4dc5f,
  // srcTree a48ceb72a951d516404f5eec29ec2d2b -> a4a46fbcff478c239de037f4a63105a4,
  // runtime 91bd8cd3c80e59b510726e29a16c89bb -> 8e09ebbf56ba3433712f91936f438e5d,
  // focused 5e856b3f21e371f867ce99f848c0a155 -> b7d6246e10357afc2a4e8f07f8c5dcea;
  // dataTree and journey did NOT move.
  const expected = {
    // AD-7 re-pin (D443) at the audit head — the D414-D442 release train plus the D443
    // audit root-fixes moved game/dataTree/srcTree/runtime/focused (chains above and in
    // DECISIONS D443); journey (src/37) did NOT move — the save-vector purity surface held.
    // D454 re-pin (chain in the D411-complete block above): game 4f9adfe5 -> 6113bc2c and
    // dataTree 108961c5 -> 379d4223 (the bbffcb4 cold-harbor weather-provenance enum fix +
    // rebuild); srcTree/runtime/journey/focused did NOT move.
    // D456 re-pin (the AD-7 idiom, at the LANE-012 Slice-1 head): game 6113bc2c -> 2171f60d
    // and srcTree d1792e99 -> 28d894d9 (D456 teaching companion — src/113 + guarded seams in
    // src/100/src/107 + rebuild); dataTree/runtime/journey/focused did NOT move — the D411
    // war-career reachability surface itself is untouched.
    // D457 re-pin (the AD-7 idiom, at the LANE-012 Slice-2 head): game 2171f60d -> a6cbfd2d,
    // dataTree 379d4223 -> 8647e586, srcTree 28d894d9 -> 41ee94b1 (D457 Historical
    // no-quarter unlock — data action + src/107/33/34/62/82 + rebuild);
    // runtime/journey/focused did NOT move — the war-career surface held.
    // D460 re-pin (the AD-7 idiom, at the LANE-013 P2 head): game a6cbfd2d -> 7c13850e,
    // dataTree 8647e586 -> d1c6557f (Elkhorn Cherokee OOB, data-only + rebuild);
    // srcTree/runtime/journey/focused did NOT move — the war-career surface held.
    // D463 re-pin (the AD-7 idiom, at the LANE-013 P4 head): game 7c13850e -> 7e212198,
    // dataTree d1c6557f -> abee76fa, srcTree 41ee94b1 -> 916d7e72 (the Fort Pillow runtime:
    // data/fort-pillow.json + the T1/T10 rows + rebuild; zero engine code);
    // runtime/journey did NOT move — the war-career surface held.
    // D466 re-pin: game 7e212198 -> f0228c4b, dataTree abee76fa -> e33afffc (the
    // S44-forced western-theater copy update; srcTree/runtime/journey/focused held).
    // D467 re-pin: game f0228c4b -> 11099dac, dataTree e33afffc -> 23ccef52 (the assets3d
    // provenance wall, data-only; srcTree/runtime/journey/focused held).
    // D468 re-pin: game 11099dac -> 9fca6932, srcTree 916d7e72 -> 03c2cdba (terrain
    // texturing T32 enrolls; dataTree/runtime/journey/focused held).
    // D469 re-pin: game 9fca6932 -> 1757fdbf, dataTree 23ccef52 -> 3cd4ccb2, srcTree
    // 03c2cdba -> bab9cca1 (the Crater runtime: data/crater.json + the T1/T10 rows +
    // rebuild; zero engine code); runtime/journey did NOT move.
    // D470 re-pin: game 1757fdbf -> 21a5216d, dataTree 3cd4ccb2 -> 4bbdebe5, srcTree
    // bab9cca1 -> 4564d84d (the Olustee runtime: data/olustee.json + the T1/T10 rows +
    // rebuild; zero engine code); runtime/journey did NOT move.
    // D470 battery root-fix 3 re-pin: game 21a5216d -> b26238de, srcTree 4564d84d ->
    // cc403e85 (T23's async GLB apply routes through the wrapped fld3dSyncUnit seam;
    // rebuild); dataTree/runtime/journey did NOT move.
    // D472 re-pin: game b26238de -> c72c7585, srcTree cc403e85 -> b0a88e93 (HDRI sky T33
    // enrolls after T32; presentation-only + rebuild); dataTree/runtime/journey did NOT move.
    // D473 re-pin: game c72c7585 -> 584e5c6f, srcTree b0a88e93 -> a7d2eef4 (ground camera
    // T34 enrolls after T33; presentation-only + rebuild); dataTree/runtime/journey did NOT move.
    // D474 re-pin: game 584e5c6f -> bcfd6454, srcTree a7d2eef4 -> 8395da0a (T34 _gcDelegate
    // exposure for probe-field's GEA-03 tooth); dataTree/runtime/journey did NOT move.
    // D476 re-pin: game bcfd6454 -> a234c52a, srcTree 8395da0a -> 7cc295df (LANE-014 slice 5:
    // T24 near-LOD + T23 runtime license wall); dataTree/runtime/journey did NOT move.
    // D478 re-pin: game a234c52a -> 9dd15ca2, dataTree 4bbdebe5 -> b3b323fa, srcTree 7cc295df ->
    // ce48e9ae (LANE-017 slice 1: the one rarity language - data glyphs/reserved hexes + cw helpers
    // + T14 tint); runtime/journey did NOT move.
    // D479 re-pin: game 9dd15ca2 -> b74053aa, srcTree ce48e9ae -> 4eed52e8 (LANE-017 slice 2:
    // drop feel in src/37 — announcement/flip/glow + view-side sort/filter + the additive
    // recentDrops sanitizer + rebuild); dataTree/runtime did NOT move.
    game:"b74053aadec893d499dd5e96198fb542",
    dataTree:"b3b323faa7e2e92137504d94bd568044",
    srcTree:"4eed52e8afc6cf2b5b836607e5757455",
    runtime:"ee83045eaaa20c96c3c09579599614c8",
    // D478 re-pin: journey 25c1226e -> a527600d (LANE-017 slice 1 adds the cwTierInfo/cwRungTierInfo
    // one-rarity-language helpers + the glyph-redundant card chip to src/37 — presentation-only;
    // the journey/war-career logic surfaces are untouched, proven by this probe's own runtime steps).
    // D479 re-pin: journey a527600d -> 1689c4a2 (LANE-017 slice 2 drop feel in src/37; the
    // journey/war-career logic surfaces are untouched, proven by this probe's own runtime steps).
    journey:"1689c4a205df5efad47d28e21962e0d5",
    // D460 re-pin: focused a29a5351 -> 2816a82c (Elkhorn Cherokee, 1614 -> 1617). D463
    // re-pin: focused 2816a82c -> 664ca996 (the D463 register chain 1617 -> 1632 + the
    // suite-138 pins; the war-career runtime surface untouched).
    // D466 re-pin: focused 664ca996 -> 3da0dbc0 (the src/82 frozen-pin chain acknowledgment).
    // D469 re-pin: focused 3da0dbc0 -> bb7a1bc9 (the 1632 -> 1671 Crater register chain).
    // D470 re-pin: focused bb7a1bc9 -> 78633570 (the 1671 -> 1710 Olustee register chain).
    // D470 battery root-fix: focused 78633570 -> 65e9c8730dfa6cb0250feddd3adabf6f (the suite-count tooth 138 -> 140 AND its silent list.length conjunct in result.ok).
    focused:"65e9c8730dfa6cb0250feddd3adabf6f"
  };
  for (const key of Object.keys(expected)) {
    if (hashes[key] !== expected[key]) throw new Error("D411 shipped baseline moved: " + key + " " + hashes[key]);
  }
  const changed = gitChangedPaths();
  const forbidden = changed.filter(path => !D408_CONTRACT_ALLOWED.has(path));
  if (forbidden.length) throw new Error("D410 planning allowlist violation: " + forbidden.join(", "));
  const lane = lane005(read(COORD));
  mustInclude(lane, [
    "D410 reachability planning contract",
    "take a fresh committed LANE-005 DRIVE lock for the D411",
    "reachability runtime",
    "Rhodes bounds + adapter carry + six authored rows + one",
    "focused reachability row, 43/43",
    "then a further separate take implements D408 §17",
    "unchanged at 44/44",
    D410_RUN_ID,
    // D411 release boundary tokens (the D410 tokens above stay as retained history):
    "take a fresh committed LANE-005 DRIVE lock to implement D408 §17 unchanged",
    "Matters of State",
    "five byte-restored binds per §17",
    "44/44",
    "Slice F stays closed"
  ], "D411 release lane");
  const expectedD410Names = [
    "SPEC CORE", "SEAM INVENTORY", "STATE OWNERSHIP", "TRANSITIONS", "DEATH + IRONMAN",
    "POLITICAL PULL", "ARCHETYPES", "IMPLEMENTATION LADDER", "EXCLUSIONS + BASELINES", "LANE",
    "RECEIPT CONTINUITY LAW", "EXACT ASSIGNMENT OWNER", "SOURCE VS YOUR TIMELINE",
    "SERVICE WINDOW + FAIL CLOSED", "HANDOFF + ONE-CREDIT ISOLATION", "SAVE SANITATION + VERSION LOCK",
    "T2/T3/AUTO CLOSED", "SLICE C RUNTIME STILL LOCKED", "BASELINES + LANE",
    "REACHABILITY LAW", "SOURCE-BOUNDED SERVICE", "LADDER FIXTURE + ASSIGNMENT IDS",
    "ADAPTER CARRY + CONSUMERS", "REACHABILITY BASELINES"
  ];
  const actualNames = result.steps.map(row => row.name).concat("REACHABILITY BASELINES");
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedD410Names)) {
    throw new Error("D410 24-row names moved: " + JSON.stringify(actualNames));
  }
  return { planRows:expectedD410Names.length, hashes, changed, status:"D411 shipped; D408 §17 runtime next" };
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
