#!/usr/bin/env node
// D377 planning/spec gate for LANE-003 Cross Keys / Port Republic.
// Filesystem-first until data/cross-keys-port-republic.json exists. Runtime teeth ship with D378.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "cross-keys-port-republic-battle-build-spec.md");
const PACKET = join(ROOT, "docs", "design", "battle-build-research", "shenandoah-1862-battle-build-research.md");
const COORD = join(ROOT, "COORDINATION.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
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
const GAINES = join(ROOT, "tools", "probe-gaines-mill.mjs");
const RAIL = join(ROOT, "data", "logistics-rail.json");
const BASE = join(ROOT, "build", "base.html");
const GENERATED = join(ROOT, "civil_war_generals.html");
const DATA = join(ROOT, "data", "cross-keys-port-republic.json");
const FOCUSED = join(ROOT, "tools", "probe-cross-keys-port-republic.mjs");

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
  return Array.from(block.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g));
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

function phaseUnits(phase) {
  const rows = [];
  for (const side of ["US", "CS"]) {
    for (const unit of (((phase.oob || {})[side]) || [])) rows.push({ side, unit });
  }
  for (const unit of (phase.reinforcements || [])) rows.push({ side: String(unit.side || ""), unit });
  return rows;
}

step("SPEC: durable Cross Keys / Port Republic contract exists and is planning-only", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 18000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "Cross Keys / Port Republic Battle-Build Spec (D377)",
    "This slice adds no runtime data",
    "one two-phase T8 scenario across two adjacent but distinct fields",
    "Cross Keys - Ewell Holds the Ridge",
    "Port Republic - The Coaling",
    "Score weights: 1 + 3 = 4",
    "The sum is 4, never 5",
    "crossKeysPortRepublic:12",
    "after `bullrun1:10` and before `gainesMill:15`",
    "LANE-003 returns to CONTRACT/unowned for D378 runtime"
  ], "spec");
  return { bytes: text.length };
});

step("LANE: LANE-003 carries the D377 contract through DRIVE and clean release states", () => {
  const text = read(COORD);
  const start = text.indexOf("### LANE-003");
  if (start < 0) throw new Error("LANE-003 missing from COORDINATION.md");
  const next = text.indexOf("\n### LANE-", start + 8);
  const lane = text.slice(start, next < 0 ? text.length : next);
  mustInclude(lane, ["battle-ladder", "D377", "Cross Keys/Port Republic", "shenandoah-1862"], "LANE-003 contract");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  if (!["CONTRACT", "DRIVE", "VERIFY", "SHIPPED"].includes(state)) throw new Error("LANE-003 must carry a driveable D377+ contract: " + state);
  return { state };
});

step("SOURCES: fetched anchors and every unresolved evidence boundary remain explicit", () => {
  const text = read(SPEC);
  const packet = read(PACKET);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "battlefields.org/learn/civil-war/battles/cross-keys",
    "battlefields.org/learn/civil-war/battles/port-republic",
    "encyclopediavirginia.org/entries/shenandoah-valley-campaign-of-1862",
    "encyclopediavirginia.org/entries/ashby-turner-1828-1862",
    "battlefields.org/learn/civil-war/battles/kernstown",
    "en.wikipedia.org/wiki/Battle_of_McDowell"
  ];
  for (const anchor of required) if (!urls.some(url => url.indexOf(anchor) >= 0)) throw new Error("source register missing " + anchor);
  mustInclude(text, [
    "pin Fremont's actually committed strength",
    "battery at The Coaling",
    "Inferred",
    "Unpinned",
    "Disputed",
    "No killed/wounded/captured split may ship as Verified",
    "foot-cavalry figures are not fetched scholarly numbers"
  ], "confidence law");
  mustInclude(packet, ["Verdict:** READY_FOR_SPEC", "Remaining Traps To Re-Verify Before Spec", "actually-committed OOB"], "committed packet");
  return { urls: urls.length };
});

step("SHAPE + DIRECTION: roles flip, doctrine changes honestly, and the packet's conservative four guards bind", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Top-level roles:** `attacker:\"US\"` / `defender:\"CS\"`",
    "scoreWeight 1, `attacker:\"US\"` / `defender:\"CS\"`, `defaultFog:false`, `assaultDoctrine:\"cautious\"`",
    "scoreWeight 3, **DECISIVE**, `attacker:\"CS\"` / `defender:\"US\"`, `defaultFog:false`, `assaultDoctrine:\"standard\"`",
    "role flip across two fields",
    "future 8-seed battery carries four source-derived direction guards",
    "Phase 1: CS holds Ewell's Ridge",
    "Phase 2: CS seizes The Coaling",
    "Aggregate: CS wins the 1+3 weighted scenario",
    "Phase 1: US losses exceed CS losses",
    "There is no phase-2 or aggregate casualty-direction tooth"
  ], "shape/direction");
  mustNotInclude(text, ["three scored phases", "scoreWeight 5"], "shape");
  return { phases: 2, weights: [1, 3], guards: 4 };
});

step("STRENGTH + OOB: present-vs-committed honesty, coarse grain, and Unpinned artillery are locked", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "11,500 present",
    "Model **6,000-9,500 committed**",
    "modeled fielded total **5,500-6,100**",
    "US **8-24 guns**, CS **8-20 guns**",
    "modeled total **5,700-6,300**",
    "modeled total **3,300-3,700**",
    "Taylor's Louisiana Brigade",
    "Winder's Brigade",
    "Tyler's Brigade",
    "Carroll's Command",
    "Union Artillery at The Coaling",
    "Verified emplacement; Unpinned battery identity; Inferred strength",
    "No 7th or 9th Louisiana regiment name may ship",
    "Model **6-12 US guns** and **6-18 CS guns**",
    "Inferred grouping; Inferred committed strength",
    "No runtime prose may upgrade `Inferred`, `Unpinned`, or `Disputed` to `Verified`"
  ], "strength/OOB contract");
  return { crossKeys: "CS 5500-6100 / US committed 6000-9500", portRepublic: "CS 5700-6300 / US 3300-3700" };
});

step("HISTORY: the scenario-scoped Jackson grade and every rank/absence trap are exact", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "- **Maj. Gen. Thomas J. Jackson** - overall Confederate commander",
    "Reject `Lt. Gen. Thomas J. Jackson` in this payload only",
    "his October 10, 1862 promotion makes lieutenant general correct at Fredericksburg and Chancellorsville",
    "**Maj. Gen. Richard S. Ewell**",
    "**Maj. Gen. John C. Fremont**",
    "**Brig. Gen. Erastus B. Tyler**",
    "**Col. Samuel S. Carroll**",
    "**Brig. Gen. Richard Taylor**",
    "**Brig. Gen. Charles S. Winder**",
    "**Turner Ashby - ABSENT BY LAW.**",
    "killed June 6"
  ], "history locks");
  return { ranks: 7, ashby: "absent" };
});

step("TERRAIN + TEACHING: both fields, operational limits, and anti-Lost-Cause posture are contracted", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Mill Creek",
    "Port Republic Road",
    "Union Church",
    "Trimble's ridge",
    "The Coaling",
    "Lewiston / Lewis farm and Lewiston Lane",
    "South Fork of the Shenandoah River",
    "North River bridge at Port Republic",
    "Wheat field / flats",
    "vk_two_day_finale",
    "vk_limited_commitment",
    "vk_the_coaling",
    "vk_three_armies_one_valley",
    "vk_foot_cavalry_not_deified",
    "vk_victorious_defeat",
    "without Lost-Cause sainthood",
    "operational maneuver is not simulated",
    "Front Royal's mass surrender",
    "never a scored capture objective"
  ], "terrain/teaching");
  return { cards: 6, codex: "Eastern / Confederate victory" };
});

step("D74 + GATES: no-fudge wall and complete D378 integration counts are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "geniusMult",
    "speedMult",
    "commitmentMult",
    "flankMult",
    "a Fremont hesitation/firepower nerf",
    "a Jackson speed/genius bonus",
    "a scripted Coaling seizure",
    "D378 complete future runtime integration contract",
    "crossKeysPortRepublic:12",
    "18 battle files and **48 total schema rows**",
    "1125 + unique Cross Keys / Port Republic side-unit ids x 3",
    "registered coverage **17 -> 18**",
    "suite **122 -> 123**",
    "Required D377 planning gate",
    "Required D378 runtime gate",
    "Full `npm run vet:noreg` is not owed for this planning slice",
    "nothing else competing on the 8 GB Mac"
  ], "D74/gates");
  return { planned: { scenarios: 17, schema: 47, people: 1125, suite: 122 }, runtime: { scenarios: 18, schema: 48, suite: 123 } };
});

step("CLASSIC-LAYER: frozen crosskeys/portrepublic remain separate and no rail route is introduced", () => {
  const base = read(BASE);
  const cross = Array.from(base.matchAll(/\{id:"crosskeys"/g)).length;
  const port = Array.from(base.matchAll(/\{id:"portrepublic"/g)).length;
  if (cross !== 1 || port !== 1) throw new Error("expected one frozen Classic row each, got crosskeys=" + cross + " portrepublic=" + port);
  const rail = JSON.parse(read(RAIL));
  const hits = Object.keys(rail.routes || {}).filter(key => /crosskeys|portrepublic|cross.?keys|port.?republic/i.test(key));
  if (hits.length) throw new Error("unexpected Cross Keys / Port Republic rail route: " + hits.join(", "));
  const text = read(SPEC);
  mustInclude(text, ["Classic-layer collision law", "separate Classic ids `crosskeys` and `portrepublic`", "no `crosskeys` or `portrepublic` rail route"], "classic-layer contract");
  return { classicRows: ["crosskeys", "portrepublic"], railRoutes: 0 };
});

step("DIGNITY: teaching-only boundaries and standing carve-outs remain intact", () => {
  const dataNames = readdirSync(join(ROOT, "data"));
  if (dataNames.some(name => /fort.?pillow|leetown/i.test(name))) throw new Error("forbidden dignity-lane data file present");
  const t1 = stripJsComments(read(T1));
  const vet = stripJsComments(read(VET));
  if (/fortPillow|fort-pillow|leetown/i.test(t1)) throw new Error("forbidden dignity-lane registry entry present");
  if (/fort-?pillow|leetown/i.test(vet)) throw new Error("forbidden dignity-lane suite row present");
  const text = read(SPEC);
  mustInclude(text, [
    "Valley campaign as a whole, Kernstown, McDowell, First Winchester, and Front Royal are not extra phases",
    "no-Leetown-Native-OOB and no-playable-Fort-Pillow carve-outs remain untouched"
  ], "dignity/scope");
  return { frontRoyal: "teaching-only", leetown: false, fortPillow: false };
});

step("REGISTRY: D377 remains exactly planned-only; future data requires complete D378 integration", () => {
  const hasData = existsSync(DATA);
  const hasFocused = existsSync(FOCUSED);
  const t1 = stripJsComments(read(T1));
  const roster = stripJsComments(read(ROSTER));
  const builder = stripJsComments(read(BUILDER));
  const loot = read(LOOT);
  const schema = stripJsComments(read(SCHEMA));
  const flagsData = stripJsComments(read(FLAGS_DATA));
  const flagsProbe = stripJsComments(read(FLAGS_PROBE));
  const weatherProbe = stripJsComments(read(WEATHER));
  const intel = stripJsComments(read(INTEL));
  const media = read(MEDIA);
  const vetRaw = read(VET);
  const vet = stripJsComments(vetRaw);
  const gaines = stripJsComments(read(GAINES));
  const generated = read(GENERATED);

  const registryHas = /R\.crossKeysPortRepublic\s*=\s*GAME_DATA\["cross-keys-port-republic"\]\.crossKeysPortRepublic/.test(t1);
  const menuRankHas = /\bcrossKeysPortRepublic\s*:\s*12\b/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.includes("crossKeysPortRepublic");
  const builderHas = builderExpected.includes("crossKeysPortRepublic");
  const phaseCountHas = /\bcrossKeysPortRepublic\s*:\s*2\b/.test(roster);
  const rosterDomHas = /fldScnBtn_crossKeysPortRepublic/.test(roster);
  const battleFiles = parseBattleFiles(schema);
  const schemaHas = battleFiles.includes("cross-keys-port-republic.json");
  const flags = parseFlagBlock(flagsData);
  const flagHas = flags.ids.includes("crossKeysPortRepublic");
  const flagBody = (flags.block.match(/\bcrossKeysPortRepublic\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = flagHas
    && /\btheater\s*:\s*['"]E['"]/.test(flagBody)
    && /\bbadges\s*:\s*false\b/.test(flagBody)
    && /\bcsFlag\s*:\s*['"]anv['"]/.test(flagBody);
  const flagCount18 = /P\.metaCoverage\.length\s*===\s*(?:1[8-9]|[2-9][0-9])/.test(flagsProbe);
  const weatherCount = weatherHintCount();
  const intelCount18 = /coverage\.count\s*===\s*(?:1[8-9]|[2-9][0-9])/.test(intel);
  const mediaData = JSON.parse(media);
  const mediaCountMatch = String((mediaData.performanceProfile || {}).largestShippedSceneMetric || "").match(/largest of (?:the )?([0-9]+) shipped opening scenes/i);
  const mediaCount = mediaCountMatch ? +mediaCountMatch[1] : 0;
  const suiteRows = parseSuite(vet);
  const vetHas = suiteRows.some(m => /cross keys|port republic/i.test(m[1]) && m[2] === "tools/probe-cross-keys-port-republic.mjs");
  const sweepCountMatch = vetRaw.match(/sweep-all-battles\.mjs[^\n]*?([0-9]+) battles/i);
  const sweepCount = sweepCountMatch ? +sweepCountMatch[1] : 0;
  const pin = (loot.match(/reg\.people\.length!==([0-9]+)/) || [null, "0"])[1];
  const pinUi = loot.match(/indexOf\('([0-9]+) of ([0-9]+)'\)/) || [null, "0", "0"];
  const lootHistory = loot.match(/D378:[^\n]*1125\s*->\s*([0-9]+)[^\n]*(Cross Keys|Port Republic|crossKeysPortRepublic)/i);
  const gainesChronologyHas = /order\.indexOf\('bullrun1'\)\s*\+\s*1\s*===\s*order\.indexOf\('crossKeysPortRepublic'\)/.test(gaines)
    && /order\.indexOf\('crossKeysPortRepublic'\)\s*\+\s*1\s*===\s*order\.indexOf\('gainesMill'\)/.test(gaines)
    && /ids\.indexOf\('fldScnBtn_crossKeysPortRepublic'\)\s*===\s*ids\.indexOf\('fldBullRunBtn'\)\s*\+\s*1/.test(gaines)
    && /ids\.indexOf\('fldScnBtn_gainesMill'\)\s*===\s*ids\.indexOf\('fldScnBtn_crossKeysPortRepublic'\)\s*\+\s*1/.test(gaines);
  const generatedHas = /crossKeysPortRepublic/.test(generated);
  const runtimeNameSurfaces = [t1, roster, builder, schema, flagsData, flagsProbe, intel, media, vet, loot, gaines, generated];
  const anyRuntimeSeam = runtimeNameSurfaces.some(text => /crossKeysPortRepublic|cross-keys-port-republic/i.test(text));

  const plannedBaselines = rosterExpected.length === 17 && !rosterHas
    && builderExpected.length === 17 && !builderHas
    && battleFiles.length === 17 && !schemaHas
    && dataFileCount() === 47
    && flags.ids.length === 18 && !flagHas
    && /P\.metaCoverage\.length\s*===\s*17/.test(flagsProbe)
    && weatherCount === 17
    && /coverage\.count\s*===\s*17/.test(intel)
    && mediaCount === 17
    && suiteRows.length === 122 && !vetHas
    && sweepCount === 17
    && pin === "1125" && pinUi[1] === "1125" && pinUi[2] === "1125"
    && !lootHistory && !gainesChronologyHas && !generatedHas
    && /realHints/.test(weatherProbe);

  if (!hasData) {
    if (hasFocused || anyRuntimeSeam || !plannedBaselines || registryHas || menuRankHas || phaseCountHas || rosterDomHas || flagMetaHas) {
      throw new Error("D377 planning slice must not half-register Cross Keys / Port Republic before data exists");
    }
    return {
      state: "planned-only",
      scenarios: rosterExpected.length,
      schema: dataFileCount(),
      battleFiles: battleFiles.length,
      armyRegister: +pin,
      flags: 17,
      weather: weatherCount,
      intel: 17,
      media: mediaCount,
      suite: suiteRows.length,
      sweep: sweepCount
    };
  }

  if (!registryHas || !menuRankHas) throw new Error("runtime data exists without exact T1 registry/menu integration");
  if (!rosterHas || rosterExpected.length < 18 || !phaseCountHas || !rosterDomHas) throw new Error("runtime data exists without complete 18-scenario roster EXPECTED/phase/DOM integration");
  if (!builderHas || builderExpected.length < 18) throw new Error("runtime data exists but custom-builder lacks the complete 18-scenario EXPECTED baseline");
  if (!schemaHas || battleFiles.length < 18 || dataFileCount() < 48) throw new Error("runtime data exists without the 18-battle / 48-row schema contract");
  if (!hasFocused) throw new Error("runtime data exists but tools/probe-cross-keys-port-republic.mjs is missing");
  if (!flagMetaHas || flags.ids.length < 19 || !flagCount18) throw new Error("runtime data exists without E/false/anv flags metadata, _default, and 18-scenario coverage");
  if (weatherCount < 18 || !intelCount18 || mediaCount < 18) throw new Error("runtime weather/Intel/media coverage is below 18");
  if (!vetHas || suiteRows.length < 123 || sweepCount < 18) throw new Error("runtime suite/sweep integration is incomplete");
  if (!gainesChronologyHas) throw new Error("Gaines' Mill adjacency teeth were not updated for the inserted scenario");
  if (!generatedHas) throw new Error("generated HTML lacks crossKeysPortRepublic after runtime registration");

  const root = JSON.parse(read(DATA));
  const scenario = root.crossKeysPortRepublic || {};
  if (scenario.id !== "crossKeysPortRepublic" || scenario.attacker !== "US" || scenario.defender !== "CS" || scenario.defaultFog !== false
      || !Array.isArray(scenario.phases) || scenario.phases.length !== 2) {
    throw new Error("runtime data violates the top-level two-phase US-opening contract");
  }
  const p0 = scenario.phases[0];
  const p1 = scenario.phases[1];
  if (p0.attacker !== "US" || p0.defender !== "CS" || p0.defaultFog !== false || p0.assaultDoctrine !== "cautious") {
    throw new Error("phase 1 must be US attack / CS defense / fog off / cautious doctrine");
  }
  if (p1.attacker !== "CS" || p1.defender !== "US" || p1.defaultFog !== false || p1.assaultDoctrine !== "standard") {
    throw new Error("phase 2 must be CS attack / US defense / fog off / standard doctrine");
  }
  const weights = scenario.phases.map(p => typeof p.scoreWeight === "number" ? p.scoreWeight : 1);
  if (weights[0] !== 1 || weights[1] !== 3 || weights[0] + weights[1] !== 4) throw new Error("phase weights must be 1+3=4, got " + weights.join("+"));
  if (!/Cross Keys - Ewell Holds the Ridge/.test(String(p0.name || "")) || !/Port Republic - The Coaling/.test(String(p1.name || ""))) {
    throw new Error("phase names violate the contract");
  }
  const p0Home = p0.homeEdge || {};
  const p1Home = p1.homeEdge || {};
  if (p0Home.US !== "low" || p0Home.CS !== "high" || p1Home.US !== "high" || p1Home.CS !== "low") {
    throw new Error("per-phase two-field home-edge maps violate the contract");
  }

  const forbidden = new Set([
    "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
    "killscale", "killmult", "casualtyscale", "casualtymult", "lossmult", "combatscale", "battledamage",
    "battlefire", "powermult", "moralemult", "routmult", "capturemult", "scorebonus", "scoremult", "winner",
    "winoverride", "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "valormult",
    "heroism", "geniusmult", "speedmult", "commitmentmult", "flankmult"
  ]);
  const forbiddenHits = [];
  walk(scenario, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) forbiddenHits.push(path.join(".")); });
  if (forbiddenHits.length) throw new Error("runtime data contains D74-forbidden keys: " + forbiddenHits.join(", "));

  const labels = [
    "Verified identity; Inferred strength",
    "Inferred grouping; Inferred committed strength",
    "Verified emplacement; Unpinned battery identity; Inferred strength",
    "Unpinned battery identity; Inferred guns and crew"
  ];
  const unitKeys = new Set();
  const sums = [{ US: 0, CS: 0 }, { US: 0, CS: 0 }];
  const guns = [{ US: 0, CS: 0 }, { US: 0, CS: 0 }];
  scenario.phases.forEach((phase, pi) => {
    for (const row of phaseUnits(phase)) {
      const id = String(row.unit.id || row.unit.name || "");
      if (!row.side || !id) throw new Error("phase " + pi + " unit lacks side/id");
      unitKeys.add(row.side + ":" + id);
      sums[pi][row.side] += +row.unit.men || 0;
      if (row.unit.arm === "art") {
        if (!(+row.unit.guns > 0) || !(+row.unit.men > 0)) throw new Error("artillery lacks positive guns/crew: " + id);
        guns[pi][row.side] += +row.unit.guns;
      }
      const note = String(row.unit.note || "");
      if (!labels.some(label => note.includes(label))) throw new Error("unit lacks an allowed provenance label: " + id);
    }
  });
  if (sums[0].CS < 5500 || sums[0].CS > 6100) throw new Error("Cross Keys CS total out of contract: " + sums[0].CS);
  if (sums[0].US < 6000 || sums[0].US > 9500 || sums[0].US >= 11500) throw new Error("Cross Keys committed US total out of contract: " + sums[0].US);
  if (sums[1].CS < 5700 || sums[1].CS > 6300) throw new Error("Port Republic CS total out of contract: " + sums[1].CS);
  if (sums[1].US < 3300 || sums[1].US > 3700) throw new Error("Port Republic US total out of contract: " + sums[1].US);
  if (guns[0].US < 8 || guns[0].US > 24 || guns[0].CS < 8 || guns[0].CS > 20) throw new Error("Cross Keys Inferred gun envelopes violated: " + JSON.stringify(guns[0]));
  if (guns[1].US < 6 || guns[1].US > 12 || guns[1].CS < 6 || guns[1].CS > 18) throw new Error("Port Republic Inferred gun envelopes violated: " + JSON.stringify(guns[1]));

  const runtimeText = JSON.stringify(scenario);
  for (const term of ["Mill Creek", "Port Republic Road", "Union Church", "Ewell's Ridge", "Trimble", "The Coaling", "Lewiston", "Lewiston Lane", "South Fork", "North River bridge", "wheat field"]) {
    if (!runtimeText.includes(term)) throw new Error("runtime landmark missing " + term);
  }
  for (const name of [
    "Maj. Gen. Thomas J. Jackson", "Maj. Gen. Richard S. Ewell", "Maj. Gen. John C. Fremont",
    "Brig. Gen. Erastus B. Tyler", "Col. Samuel S. Carroll", "Brig. Gen. Richard Taylor",
    "Brig. Gen. Charles S. Winder", "Taylor's Louisiana Brigade", "Winder's Brigade",
    "Tyler's Brigade", "Carroll's Command", "Union Artillery at The Coaling"
  ]) if (!runtimeText.includes(name)) throw new Error("runtime name/rank/OOB tooth missing " + name);
  for (const re of [
    /Lt\. Gen\. Thomas J\. Jackson/, /Brig\. Gen\. Richard S\. Ewell/, /Brig\. Gen\. John C\. Fremont/,
    /Maj\. Gen\. Erastus B\. Tyler/, /(?:Brig\.|Maj\.) Gen\. Samuel S\. Carroll/,
    /Maj\. Gen\. Richard Taylor/, /Maj\. Gen\. Charles S\. Winder/, /7th Louisiana/, /9th Louisiana/
  ]) if (re.test(runtimeText)) throw new Error("runtime contains forbidden rank or unpinned OOB rendering: " + re);
  const fieldedText = JSON.stringify(scenario.phases.map(phase => phaseUnits(phase).map(row => row.unit)));
  if (/Ashby/i.test(fieldedText)) throw new Error("Turner Ashby is fielded after his June 6 death");

  const cards = (((scenario.teaching || {}).cards) || []);
  const codex = (scenario.teaching || {}).codex || {};
  if (cards.length < 6 || cards.some(card => sourceUrls(card.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(card.provenance || "")))) {
    throw new Error("runtime teaching requires six cards, two packet URLs each, and exact provenance");
  }
  if (sourceUrls(codex.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance || ""))) {
    throw new Error("runtime codex requires two packet URLs and exact provenance");
  }
  const codexText = JSON.stringify(codex);
  if (!codexText.includes("Eastern") || !codexText.includes("Confederate victory") || !codexText.includes("Shenandoah Valley Campaign of 1862")) {
    throw new Error("runtime codex lacks Eastern / Confederate victory / Valley Campaign axes");
  }
  const weather = scenario.weather || {};
  if (weather.sky !== "haze" || weather.time !== "morning" || weather.provenance !== "Inferred" || sourceUrls(weather.sources).length < 2) {
    throw new Error("runtime weather requires haze/morning/Inferred with two packet URLs while tactical fog stays off");
  }

  const expectedPin = 1125 + unitKeys.size * 3;
  const laterTransitions = Array.from(loot.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => x.d > 378).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const transition of laterTransitions) if (transition.from === documentedPin) documentedPin = transition.to;
  if (+pin < expectedPin || +pin !== documentedPin || pinUi[1] !== pin || pinUi[2] !== pin || !lootHistory || +lootHistory[1] !== expectedPin) {
    throw new Error("runtime loot pins must document 1125 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }
  return { state: "implementation-present", units: unitKeys.size, sums, guns, pin: +pin };
});

writeFileSync(join(OUT, "probe-cross-keys-port-republic-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-cross-keys-port-republic-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.err);
  process.exit(1);
}
console.log("ALL OK");
