#!/usr/bin/env node
// D453 re-pin (the AD-7 idiom, at the FINAL audit head): the VETTING-DEFERRED D444-D452 slices plus the D453 audit root-fixes legitimately moved these surfaces — t2 25b7c205->57e82cd4 (D448 critical-cue tag + D452 skirmish Ruleset segment); auto 4f0bd097->9396ff63 (D448 cue tag); srcTree 1e973caa->d1792e99 and game baa37b96->4f9adfe5 (D444-D452 + the D453 live-owner fixes in src/99/src/100/src/40/src/60/T0/T2-adjacent probes); focused 87ce5226->a29a5351 (D444-D447 suite sweeps + the D453 e9bc7de wall re-pins); dataTree a0b26ed6->108961c5 (D444 learnMeta on 26 files + D445 chief-of-staff.json + D446 concept-links.json); manifest 442b440c->60f73b23 (D445 109 / D446 110 / D447 111 / D451 112); suite cc91894f->69987b22 (rows 134-137, D444-D447). base/runtime/journey/command/commandProbe/t3 did NOT move.
// D416 / LANE-007 dual-ruleset planning gate.
// Filesystem-first, fail-closed, suite-excluded. Runtime mode teeth belong to
// the later implementation commit, never to this planning slice.

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
mkdirSync(OUT, { recursive:true });

const SPEC = join(ROOT, "docs", "design", "open-history-mayhem-mode-design.md");
const COORD = join(ROOT, "COORDINATION.md");
const DECISIONS = join(ROOT, "DECISIONS.md");
const BASE = join(ROOT, "build", "base.html");
const GAME = join(ROOT, "civil_war_generals.html");
const MANIFEST = join(ROOT, "src", "00-manifest.json");
const VET = join(ROOT, "tools", "vet-no-regression.mjs");
const ROSTER = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const LOOT = join(ROOT, "tools", "probe-loot-survival.mjs");
const DATA = join(ROOT, "data");
const OUTFILE = join(OUT, "probe-open-history-mayhem-plan.json");

const PIN = {
  // AD-7 re-pin at the audit head (D443; the D393 chronological-chain lesson): the D416
  // plan-time values froze the D413 boundary; the D414-D442 release train legitimately
  // moved every non-frozen surface. game 9d7d91078dd8fceea847f1c2aff4dc5f -> (D418/D420
  // Mayhem A-C, D423-D430 FIX-NOW, D433-D441 overnight run, D442 Cold Harbor, D443 audit
  // root-fixes) -> re-pinned live; manifest 7924da858de403cac58caabf8c9fcce8 ->
  // 60f73b23f03f08b978011100f6dea14d (D440 enrolls src/108); suite
  // 4bcdc6f252389a4bfd6bed269b52f8f0 -> 69987b22cda2916fb42f0a3f04b96a1b (D418 mayhem row
  // 131, D431 war-career 900s budget, D436 atlanta row 132, D442 cold harbor row 133).
  // base NEVER moves (frozen). warCareerRow 38 and _SAVE_VER 1 hold.
  // D454 re-pin (the AD-7 idiom, at the AD-0 completion head): game 4f9adfe5 -> 6113bc2c
  // (the bbffcb4 cold-harbor weather-provenance enum fix + rebuild); suite 69987b22 ->
  // edba2bd9 (the 7916d14 gettysburg 600s slow-Mac budget). base/manifest hold.
  // D456 re-pin (the AD-7 idiom, at the LANE-012 Slice-1 head): game 6113bc2c -> 2171f60d
  // and manifest 60f73b23 -> bb5d7903 (D456 teaching companion — src/113 enrolls at
  // manifest 113; guarded seams in src/100 + src/107; rebuild). base/suite hold.
  // D457 re-pin (the AD-7 idiom, at the LANE-012 Slice-2 head): game 2171f60d -> a6cbfd2d
  // (D457 Historical no-quarter unlock — the `no-quarter-historical` consequence-only data
  // action + the src/107 massacre-block/adapters/judged panel + the src/33/34/62 reader
  // seams + the src/82 guarded seam; rebuild). base/manifest/suite hold.
  // D460 chain (the AD-7 idiom): game a6cbfd2d -> 7c13850e — LANE-013 P2 Elkhorn Cherokee OOB
  // (data/elkhorn-tavern.json: Watie's 2nd CMR phase-2 unit + three source rows + the Drew
  // transition record + the _comment amendment; rebuild). base/manifest/suite hold; src did
  // NOT move.
  // D463 re-pin (the AD-7 idiom, at the LANE-013 P4 head): game 7c13850e -> 7e212198 and
  // suite edba2bd9 -> 0f8550a5 — the Fort Pillow runtime (data/fort-pillow.json + the T1
  // rank-66 registry line + the T10 W/false/anv meta row; the fort pillow suite row appends
  // at the END, 137 -> 138; rebuild). base/manifest hold.
  game: "7e2121989c0e179af3a9b534def7ebfc",
  base: "c9db83fa99230ffb95bdfdfe059f3fb9",
  manifest: "bb5d7903507c8fccf53addf981c2023e",
  suite: "0f8550a5e120772d89777d7459029e7e",
  scenarios: 27,   // D436: 24 -> 25 atlanta; D442: 25 -> 26 coldHarbor; D463: 26 -> 27 fortPillow (LANE-013 P4, the D455 SS3 row 6 unlock)
  schemas: 60,   // D418: 54 -> 55 mayhem-rules.json; D436: 55 -> 56 atlanta.json; D442: 56 -> 57 cold-harbor.json; D445: 57 -> 58 chief-of-staff.json; D446: 58 -> 59 concept-links.json; D463: 59 -> 60 fort-pillow.json
  armyRegister: 1632,   // D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots. D442: 1566 -> 1614 — Cold Harbor adds 16 unique side-unit ids x 3 slots. D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7) adds 1 unique side-unit id x 3 slots. D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (LANE-013 P4)
  suiteRows: 138,   // D418: 130 -> 131; D436: 131 -> 132; D442: 132 -> 133; D444: 133 -> 134; D445: 134 -> 135; D446: 135 -> 136; D447: 136 -> 137; D463: 137 -> 138 (each appended at the END so row 38 holds)
  warCareerRow: 38,
  saveVersion: 1
};

const ALLOWED = new Set([
  "AUTONOMOUS-RUN.md",
  "COORDINATION.md",
  "DECISIONS.md",
  "HANDOFF.md",
  "RUN-LOG.md",
  "START-HERE.md",
  "V1-CHECKLIST.md",
  "WAKE-UP.md",
  "docs/design/open-history-mayhem-mode-design.md",
  "tools/probe-open-history-mayhem-plan.mjs",
  "legacy/AUTONOMOUS-RUN-ARCHIVE.md",
  "legacy/HANDOFF-ARCHIVE.md",
  "legacy/START-HERE-ARCHIVE.md",
  "legacy/V1-CHECKLIST-ARCHIVE.md",
  "legacy/WAKE-UP-ARCHIVE.md"
]);

function read(path) {
  if (!existsSync(path)) throw new Error("missing file: " + path);
  return readFileSync(path, "utf8");
}

function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}

function normalize(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function mustInclude(text, anchors, label) {
  const hay = normalize(text);
  const missing = anchors.filter(anchor => !hay.includes(normalize(anchor)));
  if (missing.length) {
    throw new Error(label + " missing anchors: " + missing.map(v => JSON.stringify(v)).join(", "));
  }
}

function section(text, startToken, endToken) {
  const start = text.indexOf(startToken);
  if (start < 0) throw new Error("section missing: " + startToken);
  const end = endToken ? text.indexOf(endToken, start + startToken.length) : -1;
  return text.slice(start, end < 0 ? text.length : end);
}

function gitChangedPaths() {
  const options = { cwd:ROOT, encoding:"utf8" };
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD", "--"], options)
    .split(/\r?\n/).filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], options)
    .split(/\r?\n/).filter(Boolean);
  return Array.from(new Set(tracked.concat(untracked))).sort();
}

function expectedCount(text) {
  const block = (text.match(/var EXPECTED = \[([\s\S]*?)\];/) || [null, ""])[1];
  return Array.from(block.matchAll(/["']([^"']+)["']/g)).length;
}

function suiteRows(text) {
  const block = (text.match(/const SUITE = \[([\s\S]*?)\n\];/) || [null, ""])[1];
  return Array.from(block.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g))
    .map(match => [match[1], match[2]]);
}

const result = { ok:true, steps:[], pins:PIN };
function step(name, fn) {
  try {
    const value = fn();
    result.steps.push({ name, ok:true, value:value === undefined ? null : value });
  } catch (error) {
    result.ok = false;
    result.steps.push({ name, ok:false, error:String(error && error.message || error) });
  }
}

let spec = "";
let coord = "";
let decisions = "";
try {
  spec = read(SPEC);
  coord = read(COORD);
  decisions = read(DECISIONS);
} catch (error) {
  result.ok = false;
  result.fatal = String(error && error.message || error);
  writeFileSync(OUTFILE, JSON.stringify(result, null, 2) + "\n");
  console.error("probe-open-history-mayhem-plan: fatal: " + result.fatal);
  process.exit(1);
}

step("SCOPE + SUPERSESSION", () => {
  mustInclude(spec, [
    "D416 planning law",
    "**Supersedes:** D382's universal consequence-only / never-scored interpretation",
    "short-lived surrender-consequences contract committed at `41b6051`",
    "This is not a second game"
  ], "scope");
  if (!(decisions.indexOf("## D416") >= 0 && decisions.indexOf("## D416") < decisions.indexOf("## D415"))) {
    throw new Error("D416 is not the latest append-only decision");
  }
  const changed = gitChangedPaths();
  const outside = changed.filter(path => !ALLOWED.has(path));
  if (outside.length) throw new Error("planning scope moved forbidden paths: " + outside.join(", "));
  return { changed };
});

step("MODE MATRIX", () => {
  mustInclude(spec, [
    "**Historical** — the current teaching wargame",
    "**Mayhem** — an opt-in, high-agency alternate-history sandbox",
    "These are rulesets, not difficulty levels",
    "Previously teaching-only people/events/battles",
    "One persistent Mayhem ruleset label; no warning on every card"
  ], "mode matrix");
});

step("MAYHEM AUTHORITY", () => {
  mustInclude(spec, [
    "MAYHEM_MODE_BIND:DECLARED_ACTIONS_MAY_SCORE_CREDIT_AND_GRANT_TAGGED_ADVANTAGE",
    "battlefield, phase, objective, campaign, or style score",
    "casualties and casualty credit",
    "winner/result classification and victory progress",
    "The Mayhem engine is deliberately broad",
    "result.declare",
    "career.promote"
  ], "Mayhem authority");
});

step("IDENTITY + FACTION TAGS", () => {
  mustInclude(spec, [
    "Faction, cultural, and identity-tag powers",
    "rather than a single universal `race` number",
    "identity:black-soldiers",
    "identity:native-alliance",
    "No universal symmetry rule requires an opposite-side mirror"
  ], "identity/faction tags");
});

step("NO-JUDGMENT UX", () => {
  mustInclude(spec, [
    "Mayhem Campaign — Break the Timeline",
    "does not grade your morality or historical plausibility",
    "Historical comparison is optional and off by default",
    "no moral or plausibility GPA",
    "`Borderlands-like` is an internal tone reference"
  ], "no-judgment UX");
});

step("STATE + SAVE ISOLATION", () => {
  mustInclude(spec, [
    "C.ruleset = {",
    "id: \"historical\" | \"mayhem\"",
    "version: 1",
    "No live combat, score, action-availability, or AAR rule reads `G.settings`",
    "old save with no ruleset -> Historical",
    "Historical -> Mayhem requires a newly named forked timeline",
    "Mayhem -> Historical conversion is rejected",
    "offline, user-owned save file, not a security boundary"
  ], "state/save");
});

step("SEAM OWNERSHIP", () => {
  mustInclude(spec, [
    "startCampaign(side, iron)",
    "campaignAdvance(winnerSide, type)",
    "`serializeSave()` / `_SAVE_VER=1`",
    "src/105-save-guard.js",
    "src/91-save-slots.js",
    "src/tactical/T2-campaign-link.js",
    "src/tactical/T25-surrender.js",
    "src/82-after-action.js",
    "Living War Chronicle is planned by D382 but not yet a shipped runtime owner"
  ], "seam ownership");
});

step("SINGLE ENGINE", () => {
  mustInclude(spec, [
    "one campaign, one battle engine, one result bridge, one save envelope, and one effect pipeline",
    "One declared pipeline",
    "If any operation is invalid, nothing applies",
    "D74 remains the single-engine rule, not a ban on Mayhem power",
    "A scattered `if (battleId === ...)` damage/winner hack remains illegal"
  ], "single engine");
});

step("SANDBOX SURFACES", () => {
  mustInclude(spec, [
    "Standalone launches",
    "opts.ruleset = { id: \"historical\" | \"mayhem\", version: 1 }",
    "Free battle, skirmish, and custom battle",
    "imports reference allowlisted ids, never code",
    "local Mayhem scenarios without polluting the canonical"
  ], "sandbox surfaces");
});

step("ACCESSIBILITY + PERSONAS", () => {
  mustInclude(spec, [
    "real buttons or radio-group controls",
    "200% zoom",
    "high contrast",
    "reduced motion",
    "Newcomer",
    "History buff / teacher",
    "Wargame veteran",
    "Game-theory min-maxer"
  ], "accessibility/personas");
});

step("IMPLEMENTATION LADDER", () => {
  const ladder = section(spec, "## 11. Runtime implementation ladder", "## 12.");
  mustInclude(ladder, [
    "Slice A — ruleset kernel, picker, and save isolation",
    "Slice B — effect schema, atomic pipeline, and receipts",
    "Slice C — first public Mayhem action and no-judgment result readout",
    "Slice D — procedural, custom, and free-battle unlocks",
    "Slice E — Mayhem AAR, timeline gallery, and Living War Chronicle",
    "Slice F — content packs and balance",
    "Slices A-C are one public feature bundle",
    "MAYHEM_PUBLIC_READY=false"
  ], "implementation ladder");
});

step("EXCLUSIONS + BASELINES", () => {
  const paths = [GAME, BASE, MANIFEST, VET];
  const actual = paths.map(md5);
  const expected = [PIN.game, PIN.base, PIN.manifest, PIN.suite];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("frozen md5 moved: " + JSON.stringify({ actual, expected }));
  }
  const dataCount = readdirSync(DATA).filter(name => name.endsWith(".json")).length;
  if (dataCount !== PIN.schemas) throw new Error("data JSON count " + dataCount + " != " + PIN.schemas);
  const rosterCount = expectedCount(read(ROSTER));
  const builderCount = expectedCount(read(BUILDER));
  if (rosterCount !== PIN.scenarios || builderCount !== PIN.scenarios) {
    throw new Error("scenario baselines moved: roster=" + rosterCount + " builder=" + builderCount);
  }
  const suite = suiteRows(read(VET));
  if (suite.length !== PIN.suiteRows) throw new Error("suite rows " + suite.length + " != " + PIN.suiteRows);
  if (!suite[PIN.warCareerRow - 1] || suite[PIN.warCareerRow - 1][0] !== "war career") {
    throw new Error("War Career row " + PIN.warCareerRow + " moved");
  }
  const version = Number((read(BASE).match(/var _SAVE_VER = (\d+);/) || [null, NaN])[1]);
  if (version !== PIN.saveVersion) throw new Error("_SAVE_VER moved: " + version);
  const loot = read(LOOT);
  if (!/people\.length\s*!==\s*1632/.test(loot) || !loot.includes("1632 of 1632")) {   // D460: 1614 -> 1617 — Elkhorn Cherokee OOB (D455 SS3 row 7); D463: 1617 -> 1632 — Fort Pillow adds 5 unique side-unit ids x 3 slots (the AD-7 chain idiom)
    throw new Error("Army Register 1632 pins missing");
  }
  mustInclude(spec, [
    "This planning slice changes no runtime, data, manifest, suite, generated HTML, frozen base",
    "24 historical scenarios",
    "54 data JSON files",
    "Army Register 1614",
    "suite 130 with War Career row 38",
    "`_SAVE_VER=1`"
  ], "exclusions/baselines");
  return { md5:actual, dataCount, rosterCount, builderCount, suiteRows:suite.length, version };
});

step("LANE", () => {
  const lane = section(coord, "### LANE-007 · open-history-mayhem", "\n---");
  const owner = (lane.match(/- \*\*Owning tool:\*\* ([^\n]+)/) || [null, ""])[1];
  const state = (lane.match(/- \*\*State:\*\* ([^\n]+)/) || [null, ""])[1];
  const sliceADrive = owner.startsWith("ChatGPT/Codex 5.6 Sol Ultra TOP LOOP") &&
    state.startsWith("DRIVE for Slice A only — Slice B remains closed");
  const released = owner.startsWith("unowned") &&
    state.startsWith("CONTRACT — D417 planning shipped");
  const shipped = state.startsWith("SHIPPED");   // AD-7 re-pin (D443): LANE-007 flipped SHIPPED at the D420 A-C public bundle — a legitimate later state this plan-time pin predates
  if (!sliceADrive && !released && !shipped) {
    throw new Error("LANE-007 state moved: " + state);
  }
  mustInclude(lane, [
    "D416 and this lane are the forward law",
    "docs/design/open-history-mayhem-mode-design.md",
    "tools/probe-open-history-mayhem-plan.mjs",
    "MAYHEM_MODE_BIND:DECLARED_ACTIONS_MAY_SCORE_CREDIT_AND_GRANT_TAGGED_ADVANTAGE",
    "Runtime Slice A acceptance criteria",
    "MAYHEM_PUBLIC_READY=false"
  ], "lane");
  if (released) {
    mustInclude(lane, [
      "Planning release evidence",
      "exactly MAYHEM AUTHORITY red and 12/13 green",
      "**Resume pointer:** exact next is Slice A"
    ], "released lane");
  }
  if (sliceADrive) {
    mustInclude(lane, [
      "Runtime Slice A acceptance criteria",
      "**Resume pointer:** implement Slice A exactly; Slice B remains closed"
    ], "Slice A DRIVE lane");
  }
  return { mode:released ? "released" : "slice-a-drive", owner:normalize(owner), state:normalize(state) };
});

writeFileSync(OUTFILE, JSON.stringify(result, null, 2) + "\n");
const passed = result.steps.filter(row => row.ok).length;
const failed = result.steps.length - passed;
console.log("probe-open-history-mayhem-plan: " + passed + "/" + result.steps.length + " steps ok, " + failed + " fail");
for (const row of result.steps) {
  if (!row.ok) console.error("RED " + row.name + ": " + row.error);
}
if (!result.ok || result.steps.length !== 13) process.exit(1);
console.log("ALL OK");
