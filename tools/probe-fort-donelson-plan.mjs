#!/usr/bin/env node
// D383 planning/spec gate for LANE-003 Fort Donelson.
// Filesystem-first until data/fort-donelson.json exists. Runtime teeth ship with D384.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "fort-donelson-battle-build-spec.md");
const PACKET = join(ROOT, "docs", "design", "battle-build-research", "naval-river-battle-build-research.md");
const COORD = join(ROOT, "COORDINATION.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const T8 = join(ROOT, "src", "tactical", "T8-phases.js");
const ROSTER = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const LOOT = join(ROOT, "tools", "probe-loot-survival.mjs");
const SCHEMA = join(ROOT, "tools", "validate-data-schemas.mjs");
const FLAGS_DATA = join(ROOT, "src", "tactical", "T10-flags.js");
const FLAGS_PROBE = join(ROOT, "tools", "probe-flags.mjs");
const WEATHER = join(ROOT, "tools", "probe-weather.mjs");
const INTEL = join(ROOT, "tools", "probe-intel-uhd617-profile.mjs");
const MEDIA = join(ROOT, "data", "media-budget.json");
const VET = join(ROOT, "tools", "vet-no-regression.mjs");
const BASE = join(ROOT, "build", "base.html");
const RAIL = join(ROOT, "data", "logistics-rail.json");
const GENERATED = join(ROOT, "civil_war_generals.html");
const DATA = join(ROOT, "data", "fort-donelson.json");
const FOCUSED = join(ROOT, "tools", "probe-fort-donelson.mjs");

// ---- research-adjudicated constants (D383 gather -> default-refute -> Fable adjudication) ----
// Source-register URL anchors the spec must carry (filled from the adjudicated register).
const REQUIRED_URL_ANCHORS = [
  "battlefields.org/learn/civil-war/battles/fort-donelson",
  "en.wikipedia.org/wiki/Battle_of_Fort_Donelson",
  "britannica.com/event/Battle-of-Fort-Donelson",
  "nps.gov/fodo",
  "history.navy.mil"
];
// Future per-phase committed-total envelopes (engine abstractions inside the army-total anchors;
// every lower split ships Inferred). [min, max] per side per phase index.
const PHASE_ENVELOPES = {
  0: { US: [9000, 16000], CS: [7000, 13000] },
  1: { US: [8000, 15000], CS: [8000, 14000] },
  2: { US: [7000, 14000], CS: [2000, 8000] }
};

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

function parseExpected(text) {
  const m = text.match(/var EXPECTED = \[([^\]]+)\]/) || text.match(/const EXPECTED = \[([^\]]+)\]/);
  if (!m) return [];
  return Array.from(m[1].matchAll(/['"]([^'"]+)['"]/g)).map(x => x[1]);
}

function parsePhaseCounts(text) {
  const m = text.match(/var PHASE_COUNTS = \{([^}]*)\}/) || text.match(/const PHASE_COUNTS = \{([^}]*)\}/);
  return m ? m[1] : "";
}

function parseBattleFiles(text) {
  const block = (text.match(/const BATTLE_FILES = new Set\(\[([\s\S]*?)\]\);/) || [null, ""])[1];
  return Array.from(block.matchAll(/['"]([^'"]+\.json)['"]/g)).map(m => m[1]);
}

function parseFlagBlock(text) {
  const block = (text.match(/var _FLD_BATTLE_META = \{([\s\S]*?)\n\};/) || [null, ""])[1];
  return {
    block,
    ids: Array.from(block.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)).map(m => m[1])
  };
}

function parseSuite(text) {
  const block = (text.match(/const SUITE = \[([\s\S]*?)\n\];/) || [null, ""])[1];
  return Array.from(block.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g)).map(m => [m[1], m[2]]);
}

function parseCoverageTargets(text, objectName) {
  const re = new RegExp(objectName.replace(".", "\\.") + "\\s*(?:===|>=)\\s*([0-9]+)", "g");
  return Array.from(text.matchAll(re)).map(m => +m[1]);
}

function dataFileCount() {
  return readdirSync(join(ROOT, "data")).filter(f => f.endsWith(".json")).length;
}

function weatherHintCount() {
  let count = 0;
  for (const file of readdirSync(join(ROOT, "data")).filter(f => f.endsWith(".json"))) {
    let root;
    try { root = JSON.parse(read(join(ROOT, "data", file))); } catch (_err) { continue; }
    for (const value of Object.values(root || {})) {
      if (value && typeof value === "object" && !Array.isArray(value) && value.weather && typeof value.weather === "object") count++;
    }
  }
  return count;
}

function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
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

function phaseUnitRows(sd) {
  const rows = [];
  const phases = Array.isArray(sd.phases) ? sd.phases : [];
  phases.forEach((p, idx) => {
    for (const side of ["US", "CS"]) {
      for (const unit of (((p.oob || {})[side]) || [])) rows.push({ phase: idx, side, unit });
    }
    for (const unit of (p.reinforcements || [])) rows.push({ phase: idx, side: String(unit.side || ""), unit });
  });
  return rows;
}

function tacticalBattleBranches() {
  const hits = [];
  for (const file of readdirSync(join(ROOT, "src", "tactical")).filter(f => f.endsWith(".js"))) {
    if (file === "T1-bull-run.js" || file === "T10-flags.js") continue;
    const text = read(join(ROOT, "src", "tactical", file));
    if (text.includes("fortDonelson") || text.includes("fort-donelson")) hits.push(file);
  }
  return hits;
}

function integrationSnapshot() {
  const t1 = stripJsComments(read(T1));
  const roster = stripJsComments(read(ROSTER));
  const builder = stripJsComments(read(BUILDER));
  const lootRaw = read(LOOT);
  const schema = stripJsComments(read(SCHEMA));
  const flagsData = stripJsComments(read(FLAGS_DATA));
  const flagsProbe = stripJsComments(read(FLAGS_PROBE));
  const weatherProbe = stripJsComments(read(WEATHER));
  const intel = stripJsComments(read(INTEL));
  const mediaRaw = read(MEDIA);
  const vetRaw = read(VET);
  const vet = stripJsComments(vetRaw);
  const generatedRaw = read(GENERATED);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const battleFiles = parseBattleFiles(schema);
  const flags = parseFlagBlock(flagsData);
  const explicitFlagIds = flags.ids.filter(id => id !== "_default");
  const suiteRows = parseSuite(vet);
  const mediaData = JSON.parse(mediaRaw);
  const mediaCountMatch = String((mediaData.performanceProfile || {}).largestShippedSceneMetric || "").match(/largest of (?:the )?([0-9]+) shipped opening scenes/i);
  const sweepCountMatch = vetRaw.match(/sweep-all-battles\.mjs[^\n]*?([0-9]+) battles/i);
  const pin = (lootRaw.match(/reg\.people\.length!==([0-9]+)/) || [null, "0"])[1];
  const pinUi = lootRaw.match(/indexOf\('([0-9]+) of ([0-9]+)'\)/) || [null, "0", "0"];
  const scanned = { t1, roster, builder, schema, flagsData, flagsProbe, intel, mediaRaw, vet, lootRaw, generatedRaw };
  const runtimeSeams = [];
  for (const [name, text] of Object.entries(scanned)) {
    if (text.includes("fortDonelson") || text.includes("fort-donelson.json") || text.includes("tools/probe-fort-donelson.mjs")) runtimeSeams.push(name);
  }
  return {
    hasData: existsSync(DATA),
    hasFocused: existsSync(FOCUSED),
    t1,
    roster,
    builder,
    lootRaw,
    schema,
    flagsData,
    flagsProbe,
    weatherProbe,
    intel,
    mediaRaw,
    vetRaw,
    vet,
    generatedRaw,
    rosterExpected,
    builderExpected,
    phaseCounts: parsePhaseCounts(roster),
    battleFiles,
    flags,
    explicitFlagIds,
    flagTargets: parseCoverageTargets(flagsProbe, "P.metaCoverage.length"),
    weatherCount: weatherHintCount(),
    intelTargets: parseCoverageTargets(intel, "coverage.count"),
    mediaCount: mediaCountMatch ? +mediaCountMatch[1] : 0,
    suiteRows,
    sweepCount: sweepCountMatch ? +sweepCountMatch[1] : 0,
    pin: +pin,
    pinUi: [+pinUi[1], +pinUi[2]],
    totalDataFiles: dataFileCount(),
    generatedMd5: md5(GENERATED),
    runtimeSeams,
    tacticalBranches: tacticalBattleBranches()
  };
}

step("SPEC SHAPE", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 24000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "Fort Donelson Battle-Build Spec (D383)",
    "This slice adds no Fort Donelson runtime data",
    "three-phase T8 combined land siege",
    "`attacker:\"US\"` / `defender:\"CS\"`",
    "fortDonelson:48",
    "before `shiloh:50`",
    "top-level `defaultFog:false`",
    "no ship-vs-ship engine",
    "D383 stops before `data/fort-donelson.json`",
    "D383 Completion Criteria"
  ], "spec shape");
  return { bytes: text.length, id: "fortDonelson", phases: 3, menuRank: 48 };
});

step("PHASES + WEIGHTS + INTERSTITIAL", () => {
  const text = read(SPEC);
  const packet = read(PACKET);
  const t8 = read(T8);
  mustInclude(text, [
    "The Investment",
    "The Breakout",
    "The Recapture",
    "`scoreWeight` array is `[1, 1, 3]`",
    "weights sum 5",
    "decisive index = 2",
    "deviates from the packet's `[1, 3, 1]`",
    "the sourced phase leans (CS holds, CS seizes, US seizes) under `[1, 3, 1]` would make the AGGREGATE a Confederate victory",
    "the sourced aggregate result is a Union victory",
    "Feb 14 naval repulse is a TEACHING INTERSTITIAL",
    "never a scored phase",
    "transition.lead",
    "No T8 code change is required"
  ], "phase/weight/interstitial contract");
  mustInclude(packet, ["1 + 3 + 1 = 5", "Phase 2", "Breakout"], "packet weight record (the deviation is documented against it)");
  mustInclude(t8, ["function _fldPhaseView", "if (p.leaders) v.leaders = p.leaders", "fldResetRun()"], "live T8 phase seams");
  return { weights: [1, 1, 3], decisiveIdx: 2, interstitial: "Feb 14 naval repulse (transition card only)" };
});

step("SOURCES + STRENGTH", () => {
  const text = read(SPEC);
  const packet = read(PACKET);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  for (const anchor of REQUIRED_URL_ANCHORS) if (!urls.some(url => url.includes(anchor))) throw new Error("source register missing " + anchor);
  mustInclude(text, [
    "US engaged anchor:** about **24,531",
    "CS engaged anchor:** about **16,171",
    "40,702 is the COMBINED two-side engaged total",
    "the packet's \"US 40,702 total\" line is a documented misreading",
    "engaged forces on the active map, not campaign-wide present figures",
    "committed-total envelopes",
    "remain coarse and `Inferred`",
    "Artillery ceiling",
    "Two-source rule"
  ], "source/strength contract");
  mustInclude(packet, ["Verdict:** READY_FOR_SPEC", "Fort Donelson", "40,702", "16,171", "12,392"], "committed packet");
  return { urls: urls.length, engaged: { US: 24531, CS: 16171 }, combined: 40702 };
});

step("TERRAIN", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Cumberland",
    "water batter",
    "Hickman Creek",
    "Indian Creek",
    "Lick Creek",
    "Dudley's Hill",
    "Wynn's Ferry Road",
    "Forge Road",
    "Charlotte",
    "Dover",
    "never a damage source",
    "teaching context"
  ], "terrain contract");
  return { objectivePhases: ["the landward works ring", "the escape-road exit", "the outer works on the CS right"] };
});

step("GUNBOAT-SUPPORT INPUTS", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Flag Officer Andrew H. Foote",
    "no ship-vs-ship engine",
    "gunboats enter the land model ONLY as inputs",
    "transport",
    "reinforcement timing",
    "never a battle-only firepower switch",
    "The water batteries are terrain and teaching, never land OOB artillery",
    "beaten at close range",
    "the Feb 14 naval repulse must be taught honestly"
  ], "gunboat-support input contract");
  mustNotInclude(text, ["gunboat bombardment unit", "naval damage bonus"], "gunboat contract");
  return { gunboats: "inputs-only (transports/reinforcement timing + teaching)", waterBatteries: "terrain/teaching" };
});

step("RANKS + TRAPS", () => {
  const text = read(SPEC);
  // D383 bind hardening: the first tamper pass exposed a substring weakness — section 13's
  // bind-procedure QUOTATION of the lock line satisfied a whole-document includes(). The
  // tooth now requires the bulleted lock line inside section 6's own body, so tampering the
  // law can never be masked by the procedure that describes how to tamper it.
  const s6start = text.indexOf("## 6. Battle-Date Ranks");
  const s6end = text.indexOf("## 7.", s6start);
  if (s6start < 0 || s6end < 0) throw new Error("section 6 rank wall missing");
  const s6 = text.slice(s6start, s6end);
  const grant = "- **Grant battle-date rank — Brig. Gen. Ulysses S. Grant; the Major General of Volunteers promotion was the immediate reward for this surrender and postdates the fight — never render Maj. Gen. during the battle.**";
  if (!s6.includes(grant)) throw new Error("exact Grant battle-date rank lock missing from section 6");
  mustInclude(text, [
    "Brig. Gen. John B. Floyd",
    "Brig. Gen. Gideon J. Pillow",
    "Brig. Gen. Simon B. Buckner",
    "Reject `Lt. Gen. Simon B. Buckner`",
    "Lt. Col. Nathan Bedford Forrest",
    "Reject `Col. Forrest`",
    "Reject `Gen. Forrest`",
    "Flag Officer Andrew H. Foote",
    "Reject `Admiral Foote`",
    "Brig. Gen. Charles F. Smith",
    "Brig. Gen. John A. McClernand",
    "Brig. Gen. Lew Wallace",
    "Brig. Gen. Bushrod R. Johnson",
    "colonels are rendered as colonels"
  ], "rank/trap locks");
  return { grant: "Brig. Gen. (MG dated Feb 16, 1862)", forrest: "Lt. Col.", foote: "Flag Officer" };
});

step("HISTORY + DIGNITY", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "No terms except an unconditional and immediate surrender",
    "I propose to move immediately upon your works",
    "Unconditional Surrender",
    "command collapse, stated plainly",
    "Floyd and Pillow abandoned their own men",
    "Buckner",
    "Forrest",
    "rode out",
    "The River War Won the West",
    "Nashville",
    "Fort Henry is teaching-only",
    "Tilghman",
    "Fort Pillow",
    "DO_NOT_BUILD",
    "no USCT unit existed in February 1862",
    "Every claim obeys the two-source/provenance rule"
  ], "history/dignity contract");
  /* D463 split: the Fort Henry half is KEPT (teaching-only, no data, no registry entry); the
     Fort Pillow half flips to REGISTERED per Aaron's D455 SS3 row 6 / D463 (assault-only, the
     massacre never in-scenario) - the documented D397/D454 split-and-chain idiom. The spec-text
     pins above ("Fort Pillow", "DO_NOT_BUILD") are NOT touched: this packet keeps its
     historical sentences and the fort-pillow spec SS1 records the supersession. */
  const forbiddenData = readdirSync(join(ROOT, "data")).filter(name => /^(?:fort-henry|forthenry)(?:[-_.]|$)/i.test(name));
  if (forbiddenData.length) throw new Error("teaching-only lane battle has runtime data: " + forbiddenData.join(", "));
  if (/R\.fortHenry\s*=/.test(stripJsComments(read(T1)))) throw new Error("teaching-only lane battle has a registry entry");
  if (!/R\.fortPillow\s*=/.test(stripJsComments(read(T1)))) throw new Error("fortPillow missing from the T1 registry (registered per D455 SS3 row 6 / D463)");
  return { cards: 8, fortHenry: "teaching-only", fortPillow: "registered (D455 SS3 row 6 / D463)" };
});

step("D74 NO-FUDGE", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "D74 No-Fudge Acceptance Wall",
    "damageMult",
    "firepowerMult",
    "casualtyMult",
    "lossMult",
    "killMult",
    "captureMult",
    "surrenderMult",
    "routMult",
    "moraleMult",
    "winner",
    "forceWin",
    "scoreMult",
    "gunboatMult",
    "bombardMult",
    "navalBarrage",
    "surrenderForce",
    "paralysisMult",
    "commandCollapseMult",
    "weatherDamage",
    "frostbiteMult",
    "floydPenalty",
    "escapeBonus",
    "any source branch that checks `fortDonelson` and writes combat output"
  ], "D74 wall");
  const branches = tacticalBattleBranches();
  if (branches.length) throw new Error("Fort-Donelson-specific tactical branch outside T1/T10: " + branches.join(", "));
  if (existsSync(DATA)) {
    const root = JSON.parse(read(DATA));
    const sd = root.fortDonelson || {};
    const forbidden = new Set([
      "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
      "killscale", "killmult", "casualtyscale", "casualtymult", "lossscale", "lossmult", "capturescale", "capturemult",
      "surrenderscale", "surrendermult", "routscale", "routmult", "moralescale", "moralemult", "combatscale",
      "battledamage", "battlefire", "powermult", "scorebonus", "scoremult", "winner", "winoverride",
      "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "genius", "geniusmult",
      "gunboatmult", "bombardmult", "navalbarrage", "surrenderforce", "paralysismult", "commandcollapsemult",
      "weatherdamage", "frostbitemult", "floydpenalty", "escapebonus", "prisonercount"
    ]);
    const hits = [];
    walk(sd, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) hits.push(path.join(".")); });
    if (hits.length) throw new Error("runtime Fort Donelson data contains D74-forbidden keys: " + hits.join(", "));
  }
  return { battleSpecificBranches: 0, dataScan: existsSync(DATA) ? "green" : "deferred" };
});

step("DIRECTION LAW", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "exactly eight shared-model deterministic seeds",
    "at least **5/8** for each independent direction guard",
    "the CS holds the works",
    "the CS seizes the escape-road exit",
    "the US seizes the outer works",
    "the aggregate battle winner is the US",
    "NO casualty-direction tooth anywhere",
    "killed-and-wounded accounting shows the US bled more",
    "the accounting conflict is the teaching, never a guard",
    "Do **not** guard casualty magnitude",
    "prisoner count",
    "surrender count",
    "old value, new value, and both observed guard counts"
  ], "direction law");
  return { seeds: 8, threshold: 5, guards: ["P1 CS holds", "P2 CS seizes", "P3 US seizes", "aggregate US"] };
});

step("CLASSIC/RAIL COLLISION", () => {
  const base = read(BASE);
  const rows = Array.from(base.matchAll(/\{id:"ftdonelson", name:"Fort Donelson"/g)).length;
  if (rows !== 1) throw new Error("expected exactly one frozen Classic ftdonelson row, got " + rows);
  mustInclude(base, [
    "{id:\"ftdonelson\", name:\"Fort Donelson\", year:1862, th:\"W\", atk:\"US\", us:25000, cs:21000",
    "cmdUS:\"Grant\", cmdCS:\"Floyd\""
  ], "frozen Classic row");
  const rail = JSON.parse(read(RAIL));
  const route = (rail.routes || {}).ftdonelson;
  if (!route) throw new Error("existing lowercase ftdonelson rail route missing");
  if (route.label !== "Cumberland-Tennessee river-rail junctions" || route.theater !== "W" || route.provenance !== "Inferred"
      || !route.friction || route.friction.US !== 10 || route.friction.CS !== 15) {
    throw new Error("existing lowercase ftdonelson rail route changed: " + JSON.stringify(route));
  }
  if (Object.prototype.hasOwnProperty.call(rail.routes || {}, "fortDonelson") || Object.prototype.hasOwnProperty.call(rail.routes || {}, "fort-donelson")) {
    throw new Error("tactical Fort Donelson id must not create or replace a rail route");
  }
  const text = read(SPEC);
  mustInclude(text, ["Frozen Classic And Rail-Route Collision Law", "camel-case `fortDonelson`", "hyphenated `fort-donelson.json`", "separate layers"], "collision contract");
  return { classicRows: 1, railRoute: { id: "ftdonelson", friction: route.friction } };
});

step("PLANNED-ONLY BASELINES", () => {
  const s = integrationSnapshot();
  if (s.hasData) return { state: "implementation-present", delegated: "step 12" };
  const leaks = [];
  if (s.hasFocused) leaks.push("tools/probe-fort-donelson.mjs");
  if (s.runtimeSeams.length) leaks.push(...s.runtimeSeams.map(name => "runtime identifier in " + name));
  if (s.tacticalBranches.length) leaks.push("battle-specific tactical branches: " + s.tacticalBranches.join(","));
  if (leaks.length) throw new Error("D383 planning branch contains runtime leakage: " + leaks.join("; "));
  if (s.rosterExpected.length !== 19 || s.rosterExpected.includes("fortDonelson")) throw new Error("planned roster must remain exact 19 without fortDonelson");
  if (s.builderExpected.length !== 19 || s.builderExpected.includes("fortDonelson")) throw new Error("planned builder must remain exact 19 without fortDonelson");
  if (s.battleFiles.length !== 19 || s.battleFiles.includes("fort-donelson.json") || s.totalDataFiles !== 49) throw new Error("planned schema must remain 19 battles / 49 total files");
  if (s.explicitFlagIds.length !== 19 || s.explicitFlagIds.includes("fortDonelson") || !s.flagTargets.includes(19)) throw new Error("planned flag metadata/coverage must remain exact 19");
  if (s.weatherCount !== 19) throw new Error("planned weather hints must remain exact 19, got " + s.weatherCount);
  if (!s.intelTargets.includes(19)) throw new Error("planned Intel coverage must remain exact 19");
  if (s.mediaCount !== 19) throw new Error("planned media opening-scene coverage must remain exact 19, got " + s.mediaCount);
  if (s.suiteRows.length !== 124 || s.suiteRows.some(row => row[1] === "tools/probe-fort-donelson.mjs") || s.sweepCount !== 19) throw new Error("planned suite/sweep must remain 124 / 19");
  if (s.pin !== 1200 || s.pinUi[0] !== 1200 || s.pinUi[1] !== 1200) throw new Error("planned Army Register/UI pin must remain exact 1200");
  if (s.generatedMd5 !== "10a64a20394521efdc94b7edb1646686") throw new Error("generated HTML md5 changed: " + s.generatedMd5);
  if (!/realHints/.test(s.weatherProbe)) throw new Error("weather probe no longer derives real hints");
  return {
    state: "planned-only",
    scenarios: 19,
    schema: { battleFiles: 19, total: 49 },
    armyRegister: 1200,
    coverage: { flags: 19, weather: 19, intel: 19, media: 19 },
    suite: 124,
    sweep: 19,
    generatedMd5: s.generatedMd5
  };
});

step("FUTURE COMPLETE-INTEGRATION CONTRACT", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "D384 future atomic integration contract",
    "tactical scenarios **19 -> 20**",
    "total schema files **49 -> 50**",
    "1200 + (unique Fort Donelson side-unit ids × 3)",
    "W / false / first-national",
    "coverage **19 -> 20**",
    "suite **124 -> 125**",
    "sweep comment **19 -> 20**",
    "PHASE_COUNTS",
    "fortDonelson: 3",
    "tools/probe-fort-donelson.mjs",
    "All surfaces arrive in one green runtime commit"
  ], "future integration contract");

  const s = integrationSnapshot();
  if (!s.hasData) {
    return { state: "contracted", future: { scenarios: 20, schema: 50, armyRegister: "1200 + 3U", coverage: 20, suite: 125 } };
  }

  const registryHas = /R\.fortDonelson\s*=\s*GAME_DATA\["fort-donelson"\]\.fortDonelson/.test(s.t1);
  const menuRankHas = /\bfortDonelson\s*:\s*48\b/.test(s.t1);
  const rosterHas = s.rosterExpected.includes("fortDonelson");
  const builderHas = s.builderExpected.includes("fortDonelson");
  const rosterDomHas = /fldScnBtn_fortDonelson/.test(s.roster);
  const phaseCountHas = /\bfortDonelson\s*:\s*3\b/.test(s.phaseCounts);
  const schemaHas = s.battleFiles.includes("fort-donelson.json");
  const flagBody = (s.flags.block.match(/\bfortDonelson\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = s.explicitFlagIds.includes("fortDonelson")
    && /\btheater\s*:\s*['"]W['"]/.test(flagBody)
    && /\bbadges\s*:\s*false\b/.test(flagBody)
    && /\bcsFlag\s*:\s*['"]first-national['"]/.test(flagBody);
  const vetHas = s.suiteRows.some(row => /fort donelson/i.test(row[0]) && row[1] === "tools/probe-fort-donelson.mjs");
  const generatedHas = s.generatedRaw.includes("fortDonelson") && s.generatedRaw.includes("fort-donelson");
  if (!registryHas || !menuRankHas) throw new Error("runtime data exists without exact T1 registry/menu integration");
  if (!rosterHas || s.rosterExpected.length < 20 || !rosterDomHas || !phaseCountHas) throw new Error("runtime data exists without complete three-phase 20-scenario roster integration");
  if (!builderHas || s.builderExpected.length < 20) throw new Error("runtime data exists without complete custom-builder historical baseline");
  if (!schemaHas || s.battleFiles.length < 20 || s.totalDataFiles < 50) throw new Error("runtime data exists without 20-battle / 50-file schema integration");
  if (!s.hasFocused) throw new Error("runtime data exists but tools/probe-fort-donelson.mjs is missing");
  if (!flagMetaHas || s.explicitFlagIds.length < 20 || !s.flagTargets.some(n => n >= 20)) throw new Error("runtime flags lack Fort Donelson W/false/first-national metadata or 20-scenario coverage");
  if (s.weatherCount < 20 || !s.intelTargets.some(n => n >= 20) || s.mediaCount < 20) throw new Error("runtime weather/Intel/media coverage is below 20");
  if (!vetHas || s.suiteRows.length < 125 || s.sweepCount < 20) throw new Error("runtime suite/sweep integration is incomplete");
  if (!generatedHas) throw new Error("generated HTML lacks exact fortDonelson/fort-donelson runtime identifiers");
  if (s.tacticalBranches.length) throw new Error("runtime contains Fort-Donelson-only tactical branches: " + s.tacticalBranches.join(", "));

  const root = JSON.parse(read(DATA));
  const sd = root.fortDonelson || {};
  if (sd.id !== "fortDonelson" || sd.attacker !== "US" || sd.defender !== "CS" || sd.defaultFog !== false
      || !Array.isArray(sd.phases) || sd.phases.length !== 3) {
    throw new Error("runtime Fort Donelson data violates the three-phase US-attacker/CS-defender/fog-off contract");
  }
  const weights = sd.phases.map(p => +p.scoreWeight || 1);
  if (weights[0] !== 1 || weights[1] !== 1 || weights[2] !== 3) throw new Error("runtime phase weights must be [1,1,3], got " + JSON.stringify(weights));
  const roles = sd.phases.map(p => (p.attacker || sd.attacker) + ">" + (p.defender || sd.defender));
  if (roles[0] !== "US>CS" || roles[1] !== "CS>US" || roles[2] !== "US>CS") throw new Error("runtime phase roles must be US>CS / CS>US / US>CS, got " + JSON.stringify(roles));
  if (!sd.phases[1].transition || !String(sd.phases[1].transition.lead || "").match(/Foote|gunboat|water batter/i)) {
    throw new Error("phase-2 transition card must carry the Feb 14 naval-repulse interstitial");
  }
  if (!sd.phases[2].transition || !String(sd.phases[2].transition.lead || "").match(/recall|threw|abandon|back into the works/i)) {
    throw new Error("phase-3 transition card must carry the recall / thrown-away escape teaching");
  }

  const rows = phaseUnitRows(sd);
  const unitKeys = new Set();
  const phaseSums = {};
  for (const row of rows) {
    const id = String(row.unit.id || row.unit.name || "");
    if (!row.side || !id) throw new Error("Fort Donelson unit lacks side/id");
    unitKeys.add(row.side + ":" + id);
    const key = row.phase + ":" + row.side;
    phaseSums[key] = (phaseSums[key] || 0) + (+row.unit.men || 0);
    if (!/Inferred strength/.test(String(row.unit.note || ""))) throw new Error("Fort Donelson unit lacks an Inferred-strength disclosure: " + id);
  }
  for (const [idx, env] of Object.entries(PHASE_ENVELOPES)) {
    for (const side of ["US", "CS"]) {
      const sum = phaseSums[idx + ":" + side] || 0;
      if (sum < env[side][0] || sum > env[side][1]) {
        throw new Error("phase " + idx + " " + side + " committed total " + sum + " outside the contract envelope " + JSON.stringify(env[side]));
      }
    }
  }

  const runtimeText = JSON.stringify(sd);
  for (const term of ["Cumberland", "water batter", "Hickman Creek", "Indian Creek", "Dudley's Hill", "Wynn's Ferry Road", "Forge Road", "Charlotte", "Dover", "Unconditional Surrender"]) {
    if (!runtimeText.includes(term)) throw new Error("runtime landmark/teaching tooth missing " + term);
  }
  for (const rank of [
    "Brig. Gen. Ulysses S. Grant", "Brig. Gen. John B. Floyd", "Brig. Gen. Gideon J. Pillow",
    "Brig. Gen. Simon B. Buckner", "Lt. Col. Nathan Bedford Forrest", "Flag Officer Andrew H. Foote",
    "Brig. Gen. Charles F. Smith", "Brig. Gen. John A. McClernand", "Brig. Gen. Lew Wallace"
  ]) if (!runtimeText.includes(rank)) throw new Error("runtime rank tooth missing " + rank);
  for (const re of [
    /Maj\. Gen\. Ulysses S\. Grant/, /Major General Ulysses S\. Grant/,
    /Lt\. Gen\. Simon B(?:olivar)?\.? Buckner/, /Lieutenant General .{0,20}Buckner/,
    /(?<!Lt\. )Col\. Nathan Bedford Forrest/, /(?<!Lieutenant )Colonel Nathan Bedford Forrest/,
    /(?:Brig\.|Maj\.|Lt\.)? ?Gen(?:\.|eral) Nathan Bedford Forrest/,
    /Admiral (?:Andrew H\. )?Foote/, /Rear Adm(?:\.|iral) (?:Andrew H\. )?Foote/
  ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank rendering: " + re);

  const cards = (((sd.teaching || {}).cards) || []);
  const codex = (sd.teaching || {}).codex || {};
  if (cards.length < 8 || cards.some(card => sourceUrls(card.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(card.provenance || "")))) {
    throw new Error("runtime teaching requires eight cards, two register URLs each, and exact provenance");
  }
  if (sourceUrls(codex.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance || ""))) {
    throw new Error("runtime codex requires two register URLs and exact provenance");
  }
  const codexText = JSON.stringify(codex);
  if (!codexText.includes("Western") || !codexText.includes("Henry-Donelson Campaign") || !codexText.includes("Union victory")) {
    throw new Error("runtime codex lacks Western / Henry-Donelson Campaign / Union victory axes");
  }

  const expectedPin = 1200 + unitKeys.size * 3;
  const history = s.lootRaw.match(/D384:[^\n]*1200\s*->\s*([0-9]+)[^\n]*(Fort Donelson|fortDonelson)/i);
  const laterTransitions = Array.from(s.lootRaw.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => x.d > 384).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const transition of laterTransitions) if (transition.from === documentedPin) documentedPin = transition.to;
  if (!history || +history[1] !== expectedPin || s.pin < expectedPin || s.pin !== documentedPin || s.pinUi[0] !== s.pin || s.pinUi[1] !== s.pin) {
    throw new Error("runtime Army Register must document 1200 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }

  const focused = read(FOCUSED);
  const seedBlock = (focused.match(/(?:const|var) SEEDS\s*=\s*\[([^\]]+)\]/) || [null, ""])[1];
  const seeds = Array.from(seedBlock.matchAll(/\b([0-9]+)\b/g)).map(m => +m[1]);
  if (seeds.length !== 8 || new Set(seeds).size !== 8) throw new Error("focused Fort Donelson probe requires exactly eight unique seeds");
  mustInclude(focused, [
    "historical direction", "pageerrors", "playwright", "fldLaunchBattle",
    "CS holds", "CS seizes", "US seizes", "aggregate"
  ], "focused Fort Donelson probe");
  if ((focused.match(/>=\s*5/g) || []).length < 4 || !/process\.exit\(1\)/.test(focused)) {
    throw new Error("focused Fort Donelson probe lacks all four 5/8 direction guards or fail-closed exit");
  }

  return {
    state: "implementation-present",
    scenarios: s.rosterExpected.length,
    schema: s.totalDataFiles,
    units: unitKeys.size,
    armyRegister: s.pin,
    coverage: { flags: s.explicitFlagIds.length, weather: s.weatherCount, media: s.mediaCount },
    suite: s.suiteRows.length,
    phaseSums
  };
});

step("LANE", () => {
  const text = read(COORD);
  const start = text.indexOf("### LANE-003");
  if (start < 0) throw new Error("LANE-003 missing from COORDINATION.md");
  const next = text.indexOf("\n### LANE-", start + 8);
  const lane = text.slice(start, next < 0 ? text.length : next);
  // Anchors are durable history/contract facts and the owner check binds the ROLE ROSTER
  // (any recognized TOP-LOOP tool), never today's lock holder (the D381 relay lesson).
  mustInclude(lane, [
    "battle-ladder",
    "Fort Donelson",
    "naval-river",
    "D381",
    "npm run vet:noreg",
    "no simultaneous edits by any provider"
  ], "LANE-003 D383 contract");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  const owner = (lane.match(/\*\*Owning tool:\*\*\s*([^\n]+)/) || [null, ""])[1];
  if (!["DRIVE", "VERIFY", "CONTRACT", "SHIPPED"].includes(state)) throw new Error("LANE-003 does not carry a D383-driveable state: " + state);
  if ((state === "DRIVE" || state === "VERIFY") && !/(ChatGPT\/Codex|Claude (?:Code|Fable))/.test(owner)) throw new Error("active lane owner is not a recognized TOP-LOOP tool: " + owner);
  if (state === "CONTRACT" && !/^none\b/.test(owner)) throw new Error("released CONTRACT lane must be unowned: " + owner);
  return { state, owner: owner.slice(0, 80) };
});

writeFileSync(join(OUT, "probe-fort-donelson-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(row => row.ok).length;
const fail = result.steps.length - ok;
console.log("probe-fort-donelson-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.err);
  process.exit(1);
}
console.log("ALL OK");
