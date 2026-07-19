#!/usr/bin/env node
// D363 planning/spec gate for LANE-003 New Market Heights.
// Filesystem-only until data/new-market-heights.json exists. Runtime teeth ship with D364.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "new-market-heights-battle-build-spec.md");
const COORD = join(ROOT, "COORDINATION.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const T13 = join(ROOT, "src", "tactical", "T13-engineering.js");
const ROSTER = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const LOOT = join(ROOT, "tools", "probe-loot-survival.mjs");
const SCHEMA = join(ROOT, "tools", "validate-data-schemas.mjs");
const FLAGS_DATA = join(ROOT, "src", "tactical", "T10-flags.js");
const FLAGS_PROBE = join(ROOT, "tools", "probe-flags.mjs");
const INTEL = join(ROOT, "tools", "probe-intel-uhd617-profile.mjs");
const MEDIA = join(ROOT, "data", "media-budget.json");
const VET = join(ROOT, "tools", "vet-no-regression.mjs");
const DATA = join(ROOT, "data", "new-market-heights.json");
const FOCUSED = join(ROOT, "tools", "probe-new-market-heights.mjs");

const result = { ok: true, pageerrors: [], steps: [] };

function step(name, fn) {
  try {
    const v = fn();
    result.steps.push({ name, ok: true, v: v === undefined ? null : v });
  } catch (err) {
    result.ok = false;
    result.steps.push({ name, ok: false, err: String(err && err.message || err) });
  }
}

function read(path) {
  return readFileSync(path, "utf8");
}

function mustInclude(text, terms, label) {
  const lower = text.toLowerCase();
  const missing = terms.filter(term => lower.indexOf(term.toLowerCase()) < 0);
  if (missing.length) throw new Error(label + " missing: " + missing.join(", "));
}

function mustNotInclude(text, terms, label) {
  const lower = text.toLowerCase();
  const present = terms.filter(term => lower.indexOf(term.toLowerCase()) >= 0);
  if (present.length) throw new Error(label + " should not include: " + present.join(", "));
}

function parseExpected(text) {
  const m = text.match(/var EXPECTED = \[([^\]]+)\]/) || text.match(/const EXPECTED = \[([^\]]+)\]/);
  if (!m) return [];
  return Array.from(m[1].matchAll(/['"]([^'"]+)['"]/g)).map(x => x[1]);
}

function stripJsComments(text) {
  // D458 root fix (the D456-surfaced family red on clean HEAD): the old two-pass regex ate
  // from any "/*" inside a line comment or string literal (e.g. the `data/*` glob in
  // validate-data-schemas.mjs line 2) to the FIRST real "*/", deleting whole declarations
  // (incl. BATTLE_FILES) before the scan. This single-pass scanner honors line comments,
  // block comments, string literals, AND regex literals (a quote inside /"/g must not open
  // a string — the src/100 lesson), so only REAL comments are removed and code survives
  // verbatim: the scans cover MORE text, never less (a tooth is never weakened).
  let out = "", i = 0, mode = "code", quote = "", inClass = false, sig = "";
  const rxPos = /(?:^|[^$\w.])(?:return|typeof|case|do|else|in|of|instanceof|new|delete|void|yield)$/;
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (mode === "code") {
      if (c === "/" && n === "/") { mode = "line"; i += 2; continue; }
      if (c === "/" && n === "*") { mode = "block"; i += 2; continue; }
      if (c === '"' || c === "'" || c === "`") { mode = "string"; quote = c; }
      else if (c === "/") {
        const prev = sig.slice(-1);
        if (prev === "" || "([{=,;:!?&|+-*%^~<>".indexOf(prev) >= 0 || rxPos.test(sig)) { mode = "regex"; inClass = false; }
      }
      out += c; if (!/\s/.test(c)) sig = (sig + c).slice(-12); i += 1; continue;
    }
    if (mode === "string") {
      if (c === "\\") { out += c + (n === undefined ? "" : n); i += 2; continue; }
      if (c === quote) mode = "code";
      out += c; i += 1; continue;
    }
    if (mode === "regex") {
      if (c === "\\") { out += c + (n === undefined ? "" : n); i += 2; continue; }
      if (c === "[") inClass = true;
      else if (c === "]") inClass = false;
      else if (c === "/" && !inClass) mode = "code";
      out += c; i += 1; continue;
    }
    if (mode === "line") { if (c === "\n") { mode = "code"; out += c; } i += 1; continue; }
    if (c === "*" && n === "/") { mode = "code"; i += 2; continue; }
    i += 1;
  }
  return out;
}

function walk(value, visit, path = []) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, visit, path.concat(String(i))));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    visit(key, child, path.concat(key));
    walk(child, visit, path.concat(key));
  }
}

function sourceUrls(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(x => typeof x === "string" && /^https?:\/\//.test(x)).map(x => x.trim())));
}

function phaseUnits(p) {
  const rows = [];
  for (const side of ["US", "CS"]) for (const u of (((p.oob || {})[side]) || [])) rows.push({ side, unit: u });
  for (const u of (p.reinforcements || [])) rows.push({ side: String(u.side || ""), unit: u });
  return rows;
}

step("SPEC: durable New Market Heights packet exists and locks a planning-only D363 boundary", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 14000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "New Market Heights Battle-Build Spec (D363)",
    "This slice adds no runtime data",
    "a two-phase T8 scenario over the SAME ground",
    "attacker:\"US\"",
    "defender:\"CS\"",
    "defaultFog:false",
    "Duncan's Assault - the Abatis",
    "Draper Carries the Heights",
    "Score weights: 1 + 3 = 4",
    "newMarketHeights:45",
    "after `gettysburg:40` and before `shiloh:50`",
    "Runtime work starts only from that clean D363 boundary"
  ], "spec");
  return { bytes: text.length };
});

step("LANE: LANE-003 carries the battle-ladder record and the D362 handoff boundary", () => {
  // 2026-07-11 relay boundary: Fable released the lock at D375 (D376 routed to Codex 5.6 Sol
  // Ultra), so CONTRACT joins the allowed states; the Fable tenure stays asserted via the
  // lane's history ("took DRIVE 2026-07-10"), which is durable fact rather than current lock.
  const text = read(COORD);
  const start = text.indexOf("### LANE-003");
  if (start < 0) throw new Error("LANE-003 missing from COORDINATION.md");
  const next = text.indexOf("\n### LANE-", start + 8);
  const lane = text.slice(start, next < 0 ? text.length : next);
  mustInclude(lane, [
    "battle-ladder",
    "D362 playable Gaines' Mill is the handoff boundary",
    "took DRIVE 2026-07-10"
  ], "LANE-003 record");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  if (state !== "CONTRACT" && state !== "DRIVE" && state !== "VERIFY" && state !== "SHIPPED") throw new Error("LANE-003 must carry a driveable contract for D363+: " + state);
  return { state };
});

step("SOURCES: NPS, ABT, Beyond the Crater, Stannard's OR, SHSP, and the preservation-site anchors bind the contract", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "nps.gov/rich/learn/historyculture/overview.htm",
    "nps.gov/rich/learn/historyculture/casualties.htm",
    "nps.gov/rich/learn/historyculture/usct.htm",
    "nps.gov/rich/learn/historyculture/mohrecip.htm",
    "battlefields.org/learn/articles/covered-glory",
    "battlefields.org/learn/civil-war/battles/new-market-heights",
    "beyondthecrater.com/resources/bat-sum/fifth-offensive-summaries/the-battle-of-new-market-heights",
    "beyondthecrater.com/resources/bat-sum/fifth-offensive-summaries/the-battle-of-chaffins-farm",
    "beyondthecrater.com/resources/other-pubs/deeds-of-valor-vol-1/dov-v1-434-christian-a-fleetwood",
    "beyondthecrater.com/resources/ors/vol-xlii/part-1-sn-87/or-xlii-p1-317-g-j-stannard",
    "warfarehistorynetwork.com/article/battle-of-new-market-heights",
    "battleofnewmarketheights.org/history-of-the-battle",
    "battleofnewmarketheights.org/medal-of-honor",
    "en.wikisource.org/wiki/Southern_Historical_Society_Papers"
  ];
  for (const needle of required) {
    if (!urls.some(url => url.indexOf(needle) >= 0)) throw new Error("missing source URL " + needle);
  }
  mustInclude(text, [
    "control D364 runtime claims",
    "count as ONE institution",
    "Cross-check, never sole source",
    "13-agent D363 research pass"
  ], "source posture");
  return { urls: urls.length };
});

step("SHAPE: the two-assault structure, the Fort Harrison deviation, and the withdrawal contract are locked", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Why NOT a Fort Harrison phase (adjudicated deviation from the packet default)",
    "about 200 defenders",
    "below the engine's brigade-scale grain",
    "Never fabricate a playable Fort Harrison garrison OOB",
    "The withdrawal contract (the load-bearing design decision)",
    "remains an explicitly stated historiographical controversy",
    "FORBIDDEN:** any clock-timed thinning trigger",
    "the phase boundary itself carries the withdrawal",
    "Verified withdrawal order; Inferred residual strength",
    "withdrawal-controversy card presents all three readings",
    "T13 pre-placed works seam",
    "two lines of abatis and one line of palisades",
    "no-op for every shipped battle, the sandbox, and custom battles"
  ], "shape/withdrawal contract");
  if (!/Phase 2 declares the same belts at reduced strength/i.test(text)) throw new Error("phase-2 breached-belt contract missing");
  mustNotInclude(text, ["Lee's masterpiece", "timed defender-thinning trigger at"], "forbidden framing");
  return { phases: 2, weights: [1, 3], fortHarrison: "teaching-only" };
});

step("STRENGTH: engaged-strength bounds, gun structure, and label law are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Engaged strengths, not campaign totals",
    "~700 effectives total",
    "361 (11 officers + 350 enlisted, Fleetwood's first-person figure)",
    "Duncan's two regiments 630-770 at T=0",
    "phase-1 US total including that arrival is bounded 630-1,000",
    "the US fields 0 guns",
    "phase-1 CS total 1,700-2,100 with exactly 8 CS guns",
    "Hardaway's two 4-gun batteries",
    "phase-2 US total 1,900-2,400",
    "phase-2 CS total 600-1,100",
    "Verified identity; Inferred strength",
    "14,500 Confederate figure is the whole two-day operation",
    "Duncan 387 + Draper 455 = 842",
    "NPS division tabulation of 961",
    "log both values and the observed 8-seed result in `DECISIONS.md`",
    "A result-derived multiplier is forbidden"
  ], "strength contract");
  return { p1: { US: "630-770", CS: "1700-2100", guns: "0 vs 8" }, p2: { US: "1900-2400", CS: "600-1100" } };
});

step("HISTORY: rank locks, Medal of Honor locks, fog handling, and direction guards are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Maj. Gen. Benjamin F. Butler",
    "Brig. Gen. Charles J. Paine",
    "reject `Maj. Gen. Charles J. Paine`",
    "Col. Samuel A. Duncan",
    "Col. Alonzo G. Draper",
    "Col. John H. Holman",
    "reject the artifact name \"Henry Holman",
    "Brig. Gen. John Gregg",
    "killed October 7, 1864",
    "Col. Frederick S. Bass",
    "Brig. Gen. Martin W. Gary",
    "Lt. Col. Robert A. Hardaway",
    "never name \"Maj. Richard C. Taylor\" as fact",
    "Christian A. Fleetwood",
    "Alfred B. Hilton",
    "Charles Veal",
    "Milton M. Holland",
    "Powhatan Beaty",
    "James H. Bronson",
    "Robert A. Pinn",
    "Thomas R. Hawkins (awarded 1870)",
    "Alexander Kelly",
    "James Gardiner",
    "Miles James",
    "Edward Ratcliff",
    "James H. Harris (awarded 1874)",
    "William H. Barnes",
    "Nathan H. Edgerton",
    "William H. Appleton",
    "The Butler Medal is a separate Army of the James decoration",
    "THICK DAWN FOG",
    "sky:\"fog\"",
    "time:\"dawn\"",
    "INVERTS \"the winner bleeds less\"",
    "phase 1 CS holds in a majority of 8 seeds",
    "phase 2 US carries in a majority",
    "total US losses exceed total CS losses in a majority"
  ], "history teeth");
  mustNotInclude(text, [
    "Maj. Gen. Charles J. Paine commanded",
    "Gen. Alonzo G. Draper",
    "Gen. Samuel A. Duncan",
    "Gen. John H. Holman"
  ], "forbidden rank renderings");
  return { rankLocks: 12, mohNamed: 16 };
});

step("DIGNITY: Black agency framing, no valor fudge, Fort Pillow absence guard, and sober CS card are law", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Dignity Law (travels with this battle)",
    "Black agency, not white validation",
    "No valor fudge",
    "Fort Pillow absence guard (hard tooth, both probes)",
    "no playable Fort Pillow scenario may exist",
    "Teaching-only treatment elsewhere may name the massacre accurately and directly",
    "The CS side-choice card is sober",
    "no Lost-Cause valor framing"
  ], "dignity law");
  mustInclude(text, ["valorMult", "heroism"], "valor-fudge key wall");
  return { dignity: true };
});

step("D74 + GATES: the no-fudge wall, planning gate, runtime gate, and integration obligations are specified", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "The universal combat model owns the outcome",
    "damageMult", "firepowerMult", "casualtyScale", "casualtyMult", "moraleMult", "captureMult",
    "scoreBonus", "scoreMult", "winOverride", "victoryOverride", "outcomeOverride", "forceWin", "winnerFudge",
    "`data/new-market-heights.json` with top-level key `newMarketHeights`",
    "`src/tactical/T1-bull-run.js` registry entry and menu rank `newMarketHeights:45`",
    "pre-placed obstacle-belt seam, no-op without the data key",
    "`theater:\"E\"`, `badges:false`, `csFlag:\"anv\"`",
    "Army of the Potomac's badge set only",
    "`tools/validate-data-schemas.mjs` battle-file enrollment",
    "45th row",
    "`tools/probe-new-market-heights.mjs`",
    "957 to `957 + unique units x 3`",
    "metadata coverage from 14 to 15",
    "opening-scene count from 14 to 15",
    "suite 119 → 120",
    "node tools/probe-gaines-mill-plan.mjs",
    "node tools/probe-nashville.mjs",
    "node tools/probe-gaines-mill.mjs",
    "git diff --check",
    "Full `npm run vet:noreg` remains deferred",
    "owed after the final battle shipped in this LANE-003 session",
    "negative bind proof"
  ], "D74/gate contract");
  return { gate: "focused", fullBattery: "release boundary" };
});

step("FORT PILLOW: the assault scenario is registered per D455 SS3 row 6 / D463 in data, registry, and suite", () => {
  /* D463 chain: this step was the Fort Pillow ABSENCE guard (data/T1/vet/roster refused any
     pillow token - the D135/D382 taught-only disposition). Aaron's D455 SS3 row 6 amends it;
     D463 registers the assault-only scenario and the scans flip to REGISTERED the documented
     D397/D454 way. The NMH spec-text pins above are NOT touched - that spec keeps its
     historical sentences, and the fort-pillow spec SS1 records the supersession. */
  const dataFiles = readdirSync(join(ROOT, "data")).filter(f => /pillow/i.test(f));
  if (dataFiles.join(",") !== "fort-pillow.json") throw new Error("expected exactly data/fort-pillow.json: " + dataFiles.join(", "));
  const t1 = read(T1);
  const vet = read(VET);
  const roster = read(ROSTER);
  if (!/fortPillow/.test(stripJsComments(t1))) throw new Error("fortPillow missing from the T1 registry/menu code (D463)");
  if (!/fort-pillow/.test(stripJsComments(vet))) throw new Error("the fort pillow row is missing from the vet suite (D463)");
  if (!/fortPillow/.test(stripJsComments(roster))) throw new Error("fortPillow missing from the roster baseline (D463)");
  return { playable: "fortPillow (D455 SS3 row 6 / D463)", massacre: "never in-scenario - the D457 machinery only" };
});

step("REGISTRY: D363 stays planned-only; any future data file requires complete D364 integration", () => {
  const hasData = existsSync(DATA);
  const hasFocused = existsSync(FOCUSED);
  const t1 = stripJsComments(read(T1));
  const t13 = stripJsComments(read(T13));
  const roster = stripJsComments(read(ROSTER));
  const builder = stripJsComments(read(BUILDER));
  const loot = read(LOOT);
  const schema = stripJsComments(read(SCHEMA));
  const flagsData = stripJsComments(read(FLAGS_DATA));
  const flagsProbe = stripJsComments(read(FLAGS_PROBE));
  const intel = stripJsComments(read(INTEL));
  const media = read(MEDIA);
  const vetRaw = read(VET);
  const vet = stripJsComments(vetRaw);
  const registryHas = /R\.newMarketHeights\s*=\s*GAME_DATA\["new-market-heights"\]\.newMarketHeights/.test(t1);
  const menuRankHas = /\bnewMarketHeights\s*:\s*45\b/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.indexOf("newMarketHeights") >= 0;
  const builderHas = builderExpected.indexOf("newMarketHeights") >= 0;
  const battleSet = (schema.match(/const BATTLE_FILES = new Set\(\[([\s\S]*?)\]\);/) || [null, ""])[1];
  const schemaHas = Array.from(battleSet.matchAll(/['"]([^'"]+\.json)['"]/g)).map(m => m[1]).indexOf("new-market-heights.json") >= 0;
  const flagBlock = (flagsData.match(/var _FLD_BATTLE_META = \{([\s\S]*?)\n\};/) || [null, ""])[1];
  const flagIds = Array.from(flagBlock.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)).map(m => m[1]);
  const nmhFlagBody = (flagBlock.match(/\bnewMarketHeights\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = flagIds.indexOf("newMarketHeights") >= 0 && flagIds.length >= 16
    && /\btheater\s*:\s*['"]E['"]/.test(nmhFlagBody)
    && /\bbadges\s*:\s*false\b/.test(nmhFlagBody)
    && /\bcsFlag\s*:\s*['"]anv['"]/.test(nmhFlagBody);
  const anyRuntimeSeam = /\bnewMarketHeights\b/.test(t1) || /\bnewMarketHeights\b/.test(roster)
    || /\bnewMarketHeights\b/.test(builder) || /\bnew-market-heights\.json\b/.test(schema)
    || flagIds.indexOf("newMarketHeights") >= 0 || /new[-\s]?market/i.test(flagsProbe)
    || /new[-\s]?market/i.test(intel) || /new[-\s]?market/i.test(vet)
    || /new[-\s]?market/i.test(loot) || /new[-\s]?market/i.test(media)
    || /preplacedObstacles|scenarioAbatis|engineering\.abatis/i.test(t13);
  const flagCount15 = /P\.metaCoverage\.length\s*>=\s*15/.test(flagsProbe) || /P\.metaCoverage\.length\s*===\s*(?:1[5-9]|[2-9][0-9])/.test(flagsProbe);
  const intelCount15 = /coverage\.count\s*>=\s*15/.test(intel) || /coverage\.count\s*===\s*(?:1[5-9]|[2-9][0-9])/.test(intel);
  const mediaData = JSON.parse(media);
  const mediaCountMatch = String((mediaData.performanceProfile || {}).largestShippedSceneMetric || "").match(/largest of (?:the )?([0-9]+) shipped opening scenes/i);
  const mediaCount = mediaCountMatch ? +mediaCountMatch[1] : 0;
  const suiteBlock = (vet.match(/const SUITE = \[([\s\S]*?)\n\];/) || [null, ""])[1];
  const suiteRows = Array.from(suiteBlock.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g));
  const vetHas = suiteRows.length >= 120 && suiteRows.some(m => /new market/i.test(m[1]) && m[2] === "tools/probe-new-market-heights.mjs");
  const sweepCountMatch = vetRaw.match(/sweep-all-battles\.mjs[^\n]*?([0-9]+) battles/i);
  const sweepCount = sweepCountMatch ? +sweepCountMatch[1] : 0;
  const pin = (loot.match(/reg\.people\.length!==([0-9]+)/) || [null, "0"])[1];
  const pinUi = (loot.match(/indexOf\('([0-9]+) of ([0-9]+)'\)/) || [null, "0", "0"]);
  const lootHistory = loot.match(/D364:[^\n]*957\s*->\s*([0-9]+)[^\n]*(New Market|Market Heights)/i);
  const plannedBaselines = flagIds.length === 15
    && /P\.metaCoverage\.length\s*===\s*14/.test(flagsProbe)
    && /coverage\.count\s*===\s*14/.test(intel)
    && mediaCount === 14
    && suiteRows.length === 119
    && sweepCount === 14
    && pin === "957" && pinUi[1] === "957" && pinUi[2] === "957"
    && !lootHistory;

  if (!hasData) {
    if (anyRuntimeSeam || !plannedBaselines || registryHas || menuRankHas || rosterHas || builderHas || schemaHas || flagMetaHas || hasFocused) {
      throw new Error("D363 planning slice must not half-register New Market Heights before data exists");
    }
    return { state: "planned-only", data: false, anyRuntimeSeam, plannedBaselines };
  }

  if (!registryHas) throw new Error("data exists but T1 registry lacks the exact GAME_DATA entry");
  if (!menuRankHas) throw new Error("runtime exists but fldScenarioMenuRank lacks newMarketHeights:45");
  if (!rosterHas) throw new Error("runtime exists but probe-tactical-roster EXPECTED lacks newMarketHeights");
  if (!builderHas) throw new Error("runtime exists but probe-custom-battle-builder EXPECTED lacks newMarketHeights");
  if (!schemaHas) throw new Error("runtime exists but validate-data-schemas lacks new-market-heights.json");
  if (!hasFocused) throw new Error("runtime exists but tools/probe-new-market-heights.mjs is missing");
  if (!flagMetaHas || !flagCount15) throw new Error("runtime exists but T10/probe-flags lacks New Market Heights metadata coverage");
  if (!intelCount15 || mediaCount < 15) throw new Error("runtime exists but Intel/media opening-scene count is below 15");
  if (!vetHas || sweepCount < 15) throw new Error("runtime exists but vet-no-regression lacks enrollment or the 15-battle sweep note");
  const root = JSON.parse(read(DATA));
  const sd = root.newMarketHeights || {};
  if (sd.id !== "newMarketHeights" || sd.attacker !== "US" || sd.defender !== "CS" || sd.defaultFog !== false
      || !Array.isArray(sd.phases) || sd.phases.length !== 2) {
    throw new Error("runtime data violates the two-phase US-attacker/CS-defender contract");
  }
  const weights = sd.phases.map(p => (typeof p.scoreWeight === "number" ? p.scoreWeight : 1));
  if (weights[0] !== 1 || weights[1] !== 3) throw new Error("phase weights must be 1+3, got " + weights.join("+"));
  const names = sd.phases.map(p => String(p.name || ""));
  if (!/Duncan/.test(names[0]) || !/Draper/.test(names[1])) throw new Error("phase names must carry Duncan then Draper: " + names.join(" | "));
  if (!sd.homeEdge || sd.homeEdge.US !== "high" || sd.homeEdge.CS !== "low") throw new Error("runtime data lacks the role-aware US-high/CS-low home edges");
  const forbidden = new Set([
    "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
    "killscale", "killmult", "casualtyscale", "casualtymult", "lossmult", "combatscale", "battledamage",
    "battlefire", "powermult", "moralemult", "routmult", "capturemult", "scorebonus", "scoremult", "winner",
    "winoverride", "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "valormult", "heroism"
  ]);
  const forbiddenHits = [];
  walk(sd, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) forbiddenHits.push(path.join(".")); });
  if (forbiddenHits.length) throw new Error("runtime data contains D74-forbidden keys: " + forbiddenHits.join(", "));
  const unitKeys = new Set();
  const sums = [{ US: 0, CS: 0 }, { US: 0, CS: 0 }];
  const guns = [{ US: 0, CS: 0 }, { US: 0, CS: 0 }];
  sd.phases.forEach((p, pi) => {
    for (const row of phaseUnits(p)) {
      const id = String(row.unit.id || row.unit.name || "");
      if (!row.side || !id) throw new Error("phase " + pi + " unit lacks side/id for Army Register counting");
      unitKeys.add(row.side + ":" + id);
      sums[pi][row.side] += (+row.unit.men || 0);
      if (row.unit.arm === "art") {
        if (!(+row.unit.guns > 0) || !(+row.unit.men > 0)) throw new Error("artillery lacks positive guns/crew: " + id);
        guns[pi][row.side] += +row.unit.guns;
      }
      const note = String(row.unit.note || "");
      const ok = note.indexOf("Verified identity; Inferred strength") >= 0
        || (pi === 1 && row.side === "CS" && note.indexOf("Verified withdrawal order; Inferred residual strength") >= 0);
      if (!ok) throw new Error("unit lacks exact strength-provenance label: " + id + " (phase " + pi + ")");
    }
  });
  const p1oobUS = ((sd.phases[0].oob || {}).US || []).reduce((n, u) => n + (+u.men || 0), 0);
  if (p1oobUS < 630 || p1oobUS > 770) throw new Error("phase-1 US opening OOB out of contract: " + p1oobUS);
  if (sums[0].US > 1000) throw new Error("phase-1 US total (with the sourced skirmish arrival) exceeds 1,000: " + sums[0].US);
  if (sums[0].CS < 1700 || sums[0].CS > 2100) throw new Error("phase-1 CS strength out of contract: " + sums[0].CS);
  if (sums[1].US < 1900 || sums[1].US > 2400) throw new Error("phase-2 US strength out of contract: " + sums[1].US);
  if (sums[1].CS < 600 || sums[1].CS > 1100) throw new Error("phase-2 CS strength out of contract: " + sums[1].CS);
  if (guns[0].US !== 0 || guns[0].CS !== 8) throw new Error("phase-1 gun contract failed: " + JSON.stringify(guns[0]));
  if (guns[1].CS > 4) throw new Error("phase-2 residual CS guns exceed the withdrawing-battery contract: " + guns[1].CS);
  for (const p of sd.phases) {
    const belts = ((p.engineering || {}).abatis) || [];
    if (belts.length < 2) throw new Error("phase lacks the two pre-placed abatis belts");
  }
  const p2belts = ((sd.phases[1].engineering || {}).abatis) || [];
  if (!p2belts.every(b => +b.strength < 1)) throw new Error("phase-2 belts must be partially breached (strength < 1)");
  const runtimeText = JSON.stringify(sd);
  for (const term of ["Four Mile Creek", "New Market Road", "Deep Bottom"]) {
    if (runtimeText.indexOf(term) < 0) throw new Error("terrain/teaching tooth missing " + term);
  }
  for (const name of [
    "Brig. Gen. Charles J. Paine", "Col. Samuel A. Duncan", "Col. Alonzo G. Draper", "Col. John H. Holman",
    "Brig. Gen. John Gregg", "Brig. Gen. Martin W. Gary",
    "Christian A. Fleetwood", "Alfred B. Hilton", "Charles Veal", "Milton M. Holland", "Powhatan Beaty",
    "James H. Bronson", "Robert A. Pinn", "Thomas R. Hawkins", "Alexander Kelly", "James Gardiner",
    "Miles James", "Edward Ratcliff", "James H. Harris", "William H. Barnes"
  ]) if (runtimeText.indexOf(name) < 0) throw new Error("runtime name/rank tooth missing " + name);
  for (const re of [
    /Maj\. Gen\. Charles J\. Paine/, /Gen\. Alonzo G\. Draper/, /Gen\. Samuel A\. Duncan/,
    /Gen\. John H\. Holman/, /Henry Holman/, /Richard C\. Taylor/, /Maj\. Gen\. John Gregg/
  ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank/name rendering: " + re);
  const cards = (((sd.teaching || {}).cards) || []);
  const codex = (sd.teaching || {}).codex || {};
  if (cards.length < 6 || cards.some(card => sourceUrls(card.sources).length < 2) || sourceUrls(codex.sources).length < 2) {
    throw new Error("runtime teaching/codex requires at least six cards and two source URLs each");
  }
  const weather = sd.weather || {};
  if (weather.sky !== "fog" || weather.time !== "dawn" || !/^(Verified|Inferred)$/.test(String(weather.provenance || "")) || sourceUrls(weather.sources).length < 2) {
    throw new Error("runtime weather requires fog/dawn, exact provenance, and two source URLs");
  }
  const expectedPin = 957 + unitKeys.size * 3;
  const laterTransitions = Array.from(loot.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => x.d > 364).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const tr of laterTransitions) if (tr.from === documentedPin) documentedPin = tr.to;
  if (+pin < expectedPin || +pin !== documentedPin || pinUi[1] !== pin || pinUi[2] !== pin || !lootHistory || +lootHistory[1] !== expectedPin) {
    throw new Error("runtime loot pins must document 957 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }
  return { state: "implementation-present", units: unitKeys.size, sums, guns, pin: +pin };
});

writeFileSync(join(OUT, "probe-new-market-heights-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-new-market-heights-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const s of result.steps) if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  process.exit(1);
}
console.log("ALL OK");
