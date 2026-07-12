#!/usr/bin/env node
// D379 planning/spec gate for LANE-003 Five Forks.
// Filesystem-first until data/five-forks.json exists. Runtime teeth ship with D380.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "five-forks-battle-build-spec.md");
const PACKET = join(ROOT, "docs", "design", "battle-build-research", "appomattox-campaign-battle-build-research.md");
const COORD = join(ROOT, "COORDINATION.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const T3 = join(ROOT, "src", "tactical", "T3-officers.js");
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
const OFFICER_PROBE = join(ROOT, "tools", "probe-officers.mjs");
const BASE = join(ROOT, "build", "base.html");
const RAIL = join(ROOT, "data", "logistics-rail.json");
const GENERATED = join(ROOT, "civil_war_generals.html");
const DATA = join(ROOT, "data", "five-forks.json");
const FOCUSED = join(ROOT, "tools", "probe-five-forks.mjs");

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
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
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

function unitRows(sd) {
  const rows = [];
  for (const side of ["US", "CS"]) {
    for (const unit of (((sd.oob || {})[side]) || [])) rows.push({ side, unit });
  }
  for (const unit of (sd.reinforcements || [])) rows.push({ side: String(unit.side || ""), unit });
  return rows;
}

function tacticalBattleBranches() {
  const hits = [];
  for (const file of readdirSync(join(ROOT, "src", "tactical")).filter(f => f.endsWith(".js"))) {
    if (file === "T1-bull-run.js" || file === "T10-flags.js") continue;
    const text = read(join(ROOT, "src", "tactical", file));
    if (text.includes("fiveForks") || text.includes("five-forks")) hits.push(file);
  }
  return hits;
}

function integrationSnapshot() {
  const t1 = stripJsComments(read(T1));
  const t3Raw = read(T3);
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
  const officerProbeRaw = read(OFFICER_PROBE);
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
    if (text.includes("fiveForks") || text.includes("five-forks.json") || text.includes("tools/probe-five-forks.mjs")) runtimeSeams.push(name);
  }
  return {
    hasData: existsSync(DATA),
    hasFocused: existsSync(FOCUSED),
    t1,
    t3Raw,
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
    officerProbeRaw,
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
    t3Replacement: /\breplaces\b|\brelieved\b/.test(t3Raw),
    officerReplacement: /\breplaces\b|\brelieved\b/.test(officerProbeRaw),
    tacticalBranches: tacticalBattleBranches()
  };
}

step("SPEC SHAPE", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 24000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "Five Forks Battle-Build Spec (D379)",
    "This slice adds no Five Forks runtime data",
    "one single-phase attacker-seize scenario",
    "`attacker:\"US\"` / `defender:\"CS\"`",
    "no `phases[]`",
    "Reject the research packet's optional T8 form",
    "defaultFog:false",
    "Five Forks Crossroads",
    "fiveForks:85",
    "after `nashville:80`",
    "D379 stops before `data/five-forks.json`",
    "D379 Completion Criteria"
  ], "spec shape");
  return { bytes: text.length, id: "fiveForks", phases: 1, menuRank: 85 };
});

step("SOURCES + STRENGTH", () => {
  const text = read(SPEC);
  const packet = read(PACKET);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "encyclopediavirginia.org/entries/five-forks-battle-of",
    "battlefields.org/learn/civil-war/battles/five-forks",
    "nps.gov/apco/learn/historyculture/united-states-colored-troops-at-appomattox.htm",
    "en.wikipedia.org/wiki/Charles_Griffin",
    "en.wikipedia.org/wiki/Battle_of_Appomattox_Court_House"
  ];
  for (const anchor of required) if (!urls.some(url => url.includes(anchor))) throw new Error("source register missing " + anchor);
  mustInclude(text, [
    "US engaged anchor:** about **21,000**",
    "CS engaged anchor:** about **9,200**",
    "Rejected active-map figures",
    "32,600 US / 22,000 CS",
    "lower-grain ceiling",
    "remain coarse and `Inferred`",
    "Artillery ceiling",
    "Two-source rule"
  ], "source/strength contract");
  mustInclude(packet, ["Verdict:** READY_FOR_SPEC", "Five Forks", "21,000 US", "9,200 CS", "32,600 US", "22,000 CS"], "committed packet");
  return { urls: urls.length, activeMap: { US: 21000, CS: 9200 }, rejectedBroad: { US: 32600, CS: 22000 } };
});

step("TERRAIN", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Five Forks",
    "White Oak Road",
    "the return / the Angle",
    "Ford's Road or Scott's Road",
    "Gravelly Run",
    "Hatcher's Run",
    "Dinwiddie Court House",
    "the shad-bake site",
    "never a damage source",
    "teaching context"
  ], "terrain contract");
  return { objective: "Five Forks Crossroads", scoredLandmarks: 1, teachingOnly: ["Dinwiddie Court House", "shad-bake site"] };
});

step("COMMAND EVENT", () => {
  const text = read(SPEC);
  const t3 = read(T3);
  const t8 = read(T8);
  mustInclude(text, [
    "Approved Future Generic Leader-Replacement Contract",
    "id: \"ld_griffin\"",
    "replaces: \"ld_warren\"",
    "atSec: <relief time>",
    "Sheridan relieves Warren; Griffin assumes command of V Corps.",
    "current-cast/phase-local",
    "validation/prepass before any aura accumulation",
    "Validate the whole due batch before applying any event",
    "active:false` and `relieved:true` while remaining `alive:true",
    "There is no gap and no overlap",
    "fail closed",
    "consumes no extra RNG",
    "throws no exception/pageerror",
    "Never call `fldOfficerWounded` or `fldOfficerFalls` for relief",
    "HUD roster, selected-unit command attribution, 2D marker/label, 3D marker/aura, and end reporting",
    "missing `replaces` field follows the current timed-arrival path byte-for-byte",
    "No `fiveForksPenalty`",
    "Custom Battle authoring/serialization surface does not carry"
  ], "generic replacement contract");
  mustInclude(t3, ["function fldOfficerRoster", "function fldMakeOfficer", "function fldOfficersStep", "function fldOfficerActivate", "function fldOfficerFalls", "function fldOfficerEndHtml", "function fldDrawOfficers", "function fld3dSyncOfficers"], "live T3 seams");
  mustInclude(t8, ["function _fldPhaseView", "if (p.leaders) v.leaders = p.leaders", "fldResetRun()"], "live T8 phase-cast seams");
  if (!existsSync(DATA) && (/\breplaces\b|\brelieved\b/.test(t3))) throw new Error("D379 planning branch must not implement replaces/relieved in T3");
  return { implementation: existsSync(DATA) ? "future branch present" : "specified only", event: "ld_warren -> ld_griffin" };
});

step("RANKS + ABSENCES", () => {
  const text = read(SPEC);
  const griffin = "**Griffin April 1 rank — Brig. Gen. (brevet Maj. Gen.); never a firm Maj. Gen. of Volunteers on April 1.**";
  if (!text.includes(griffin)) throw new Error("exact Griffin April 1 rank lock missing");
  mustInclude(text, [
    "Maj. Gen. Philip H. Sheridan",
    "Reject `Lt. Gen. Philip H. Sheridan`",
    "Maj. Gen. Gouverneur K. Warren",
    "Maj. Gen. George E. Pickett",
    "Maj. Gen. Fitzhugh Lee",
    "Maj. Gen. Thomas L. Rosser",
    "Lt. Gen. Ulysses S. Grant",
    "Reject `Maj. Gen. Ulysses S. Grant`",
    "must not be active on-map aura sources"
  ], "rank/absence locks");
  return { griffin: "Brig. Gen. (brevet Maj. Gen.)", absentAura: ["Pickett", "Fitzhugh Lee", "Rosser"] };
});

step("HISTORY + DIGNITY", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "December 9, 1879",
    "August 8, 1882",
    "November 1882",
    "The shad bake, carefully",
    "Exact culpability, the acoustic-shadow mechanism, and blame remain `Disputed`",
    "Why the line broke",
    "Northern manpower, industry, and emancipation context",
    "Appomattox remains teaching-only",
    "XXV Corps / USCT at the end",
    "Reconciliation memory",
    "David Blight",
    "Prisoner totals conflict",
    "Every claim obeys the two-source/provenance rule"
  ], "history/dignity contract");
  const forbiddenData = readdirSync(join(ROOT, "data")).filter(name => /^(?:appomattox|surrender)(?:[-_.]|$)/i.test(name));
  if (forbiddenData.length) throw new Error("new tactical Appomattox/surrender data present: " + forbiddenData.join(", "));
  if (/R\.(?:appomattox|surrender)\s*=/.test(stripJsComments(read(T1)))) throw new Error("new tactical Appomattox/surrender registry entry present");
  return { cards: 7, appomattox: "teaching-only", prisonerCounts: "conflicting" };
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
    "geniusMult",
    "hesitationMult",
    "flankMult",
    "commandFailureMult",
    "shadBakeMult",
    "fiveForksPenalty",
    "any source branch that checks `fiveForks` and writes combat output"
  ], "D74 wall");
  const branches = tacticalBattleBranches();
  if (branches.length) throw new Error("Five-Forks-specific tactical branch outside T1/T10: " + branches.join(", "));
  if (existsSync(DATA)) {
    const root = JSON.parse(read(DATA));
    const sd = root.fiveForks || {};
    const forbidden = new Set([
      "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
      "killscale", "killmult", "casualtyscale", "casualtymult", "lossscale", "lossmult", "capturescale", "capturemult",
      "surrenderscale", "surrendermult", "routscale", "routmult", "moralescale", "moralemult", "combatscale",
      "battledamage", "battlefire", "powermult", "scorebonus", "scoremult", "winner", "winoverride",
      "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "genius", "geniusmult",
      "hesitation", "hesitationmult", "flank", "flankmult", "commandfailure", "commandfailuremult", "shadbake",
      "shadbakemult", "fiveforkspenalty"
    ]);
    const hits = [];
    walk(sd, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) hits.push(path.join(".")); });
    if (hits.length) throw new Error("runtime Five Forks data contains D74-forbidden keys: " + hits.join(", "));
  }
  return { battleSpecificBranches: 0, dataScan: existsSync(DATA) ? "green" : "deferred" };
});

step("DIRECTION LAW", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "exactly eight shared-model deterministic seeds",
    "at least **5/8** for each independent direction guard",
    "the US seizes the Five Forks crossroads",
    "Confederate total losses exceed Union total losses",
    "direction-only",
    "Do **not** guard casualty magnitude",
    "prisoner count",
    "captured-general count",
    "rout count",
    "old value, new value, and both observed guard counts"
  ], "direction law");
  return { seeds: 8, threshold: 5, guards: ["US objective", "CS total losses > US"] };
});

step("CLASSIC/RAIL COLLISION", () => {
  const base = read(BASE);
  const rows = Array.from(base.matchAll(/\{id:"fiveforks", name:"Five Forks"/g)).length;
  if (rows !== 1) throw new Error("expected exactly one frozen Classic fiveforks row, got " + rows);
  mustInclude(base, [
    "{id:\"fiveforks\", name:\"Five Forks\", year:1865, th:\"E\", atk:\"US\", us:22000, cs:10000",
    "cmdUS:\"Sheridan\", cmdCS:\"Pickett\""
  ], "frozen Classic row");
  const rail = JSON.parse(read(RAIL));
  const route = (rail.routes || {}).fiveforks;
  if (!route) throw new Error("existing lowercase fiveforks rail route missing");
  if (route.label !== "South Side Railroad pressure" || route.theater !== "E" || route.provenance !== "Inferred"
      || !route.friction || route.friction.US !== 8 || route.friction.CS !== 18) {
    throw new Error("existing lowercase fiveforks rail route changed: " + JSON.stringify(route));
  }
  if (Object.prototype.hasOwnProperty.call(rail.routes || {}, "fiveForks") || Object.prototype.hasOwnProperty.call(rail.routes || {}, "five-forks")) {
    throw new Error("tactical Five Forks id must not create or replace a rail route");
  }
  const text = read(SPEC);
  mustInclude(text, ["Frozen Classic And Rail-Route Collision Law", "camel-case `fiveForks`", "hyphenated `five-forks.json`", "separate layers"], "collision contract");
  return { classicRows: 1, railRoute: { id: "fiveforks", friction: route.friction } };
});

step("PLANNED-ONLY BASELINES", () => {
  const s = integrationSnapshot();
  if (s.hasData) return { state: "implementation-present", delegated: "step 11" };
  const leaks = [];
  if (s.hasFocused) leaks.push("tools/probe-five-forks.mjs");
  if (s.runtimeSeams.length) leaks.push(...s.runtimeSeams.map(name => "runtime identifier in " + name));
  if (s.t3Replacement) leaks.push("T3 replaces/relieved implementation");
  if (s.officerReplacement) leaks.push("probe-officers replacement teeth");
  if (s.tacticalBranches.length) leaks.push("battle-specific tactical branches: " + s.tacticalBranches.join(","));
  if (leaks.length) throw new Error("D379 planning branch contains runtime leakage: " + leaks.join("; "));
  if (s.rosterExpected.length !== 18 || s.rosterExpected.includes("fiveForks")) throw new Error("planned roster must remain exact 18 without fiveForks");
  if (s.builderExpected.length !== 18 || s.builderExpected.includes("fiveForks")) throw new Error("planned builder must remain exact 18 without fiveForks");
  if (s.battleFiles.length !== 18 || s.battleFiles.includes("five-forks.json") || s.totalDataFiles !== 48) throw new Error("planned schema must remain 18 battles / 48 total files");
  if (s.explicitFlagIds.length !== 18 || s.explicitFlagIds.includes("fiveForks") || !s.flagTargets.includes(18)) throw new Error("planned flag metadata/coverage must remain exact 18");
  if (s.weatherCount !== 18) throw new Error("planned weather hints must remain exact 18, got " + s.weatherCount);
  if (!s.intelTargets.includes(18)) throw new Error("planned Intel coverage must remain exact 18");
  if (s.mediaCount !== 18) throw new Error("planned media opening-scene coverage must remain exact 18, got " + s.mediaCount);
  if (s.suiteRows.length !== 123 || s.suiteRows.some(row => row[1] === "tools/probe-five-forks.mjs") || s.sweepCount !== 18) throw new Error("planned suite/sweep must remain 123 / 18");
  if (s.pin !== 1170 || s.pinUi[0] !== 1170 || s.pinUi[1] !== 1170) throw new Error("planned Army Register/UI pin must remain exact 1170");
  if (s.generatedMd5 !== "097eabeea06387e47bd819d125950f0d") throw new Error("generated HTML md5 changed: " + s.generatedMd5);
  if (!/realHints/.test(s.weatherProbe)) throw new Error("weather probe no longer derives real hints");
  return {
    state: "planned-only",
    scenarios: 18,
    schema: { battleFiles: 18, total: 48 },
    armyRegister: 1170,
    coverage: { flags: 18, weather: 18, intel: 18, media: 18 },
    suite: 123,
    sweep: 18,
    generatedMd5: s.generatedMd5
  };
});

step("FUTURE COMPLETE-INTEGRATION CONTRACT", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "D380 future atomic integration contract",
    "tactical scenarios **18 -> 19**",
    "total schema files **48 -> 49**",
    "1170 + (unique Five Forks side-unit ids × 3)",
    "E / true / anv",
    "coverage **18 -> 19**",
    "suite **123 -> 124**",
    "sweep comment **18 -> 19**",
    "tools/probe-five-forks.mjs",
    "tools/probe-officers.mjs",
    "All surfaces arrive in one green runtime commit"
  ], "future integration contract");

  const s = integrationSnapshot();
  if (!s.hasData) {
    return { state: "contracted", future: { scenarios: 19, schema: 49, armyRegister: "1170 + 3U", coverage: 19, suite: 124 } };
  }

  const registryHas = /R\.fiveForks\s*=\s*GAME_DATA\["five-forks"\]\.fiveForks/.test(s.t1);
  const menuRankHas = /\bfiveForks\s*:\s*85\b/.test(s.t1);
  const rosterHas = s.rosterExpected.includes("fiveForks");
  const builderHas = s.builderExpected.includes("fiveForks");
  const rosterDomHas = /fldScnBtn_fiveForks/.test(s.roster);
  const phaseCountWrong = /\bfiveForks\s*:/.test(s.phaseCounts);
  const schemaHas = s.battleFiles.includes("five-forks.json");
  const flagBody = (s.flags.block.match(/\bfiveForks\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = s.explicitFlagIds.includes("fiveForks")
    && /\btheater\s*:\s*['"]E['"]/.test(flagBody)
    && /\bbadges\s*:\s*true\b/.test(flagBody)
    && /\bcsFlag\s*:\s*['"]anv['"]/.test(flagBody);
  const vetHas = s.suiteRows.some(row => /five forks/i.test(row[0]) && row[1] === "tools/probe-five-forks.mjs");
  const generatedHas = s.generatedRaw.includes("fiveForks") && s.generatedRaw.includes("five-forks");
  if (!registryHas || !menuRankHas) throw new Error("runtime data exists without exact T1 registry/menu integration");
  if (!rosterHas || s.rosterExpected.length < 19 || !rosterDomHas || phaseCountWrong) throw new Error("runtime data exists without complete single-phase 19-scenario roster integration");
  if (!builderHas || s.builderExpected.length < 19) throw new Error("runtime data exists without complete custom-builder historical baseline");
  if (!schemaHas || s.battleFiles.length < 19 || s.totalDataFiles < 49) throw new Error("runtime data exists without 19-battle / 49-file schema integration");
  if (!s.hasFocused) throw new Error("runtime data exists but tools/probe-five-forks.mjs is missing");
  if (!flagMetaHas || s.explicitFlagIds.length < 19 || !s.flagTargets.some(n => n >= 19)) throw new Error("runtime flags lack Five Forks E/true/anv metadata or 19-scenario coverage");
  if (s.weatherCount < 19 || !s.intelTargets.some(n => n >= 19) || s.mediaCount < 19) throw new Error("runtime weather/Intel/media coverage is below 19");
  if (!vetHas || s.suiteRows.length < 124 || s.sweepCount < 19) throw new Error("runtime suite/sweep integration is incomplete");
  if (!generatedHas) throw new Error("generated HTML lacks exact fiveForks/five-forks runtime identifiers");
  if (!s.t3Replacement || !s.officerReplacement) throw new Error("runtime exists without generic T3 replacement implementation and officer tests");
  if (s.tacticalBranches.length) throw new Error("runtime contains Five-Forks-only tactical branches: " + s.tacticalBranches.join(", "));

  const t3 = s.t3Raw;
  mustInclude(t3, ["replaces", "relieved", "entry", "function fldOfficersStep", "function fldOfficerActivate"], "future generic T3 implementation");
  if (t3.includes("fiveForks") || t3.includes("five-forks") || /fiveForksPenalty/.test(t3)) throw new Error("shared T3 implementation contains a Five-Forks-specific branch");
  const officerProbe = s.officerProbeRaw;
  mustInclude(officerProbe, [
    "replaces", "relieved", "cross-side", "self-replacement", "duplicate", "missing target", "repeated",
    "no overlap", "no gap", "byte-identical", "pageerrors"
  ], "future generic officer probe");

  const root = JSON.parse(read(DATA));
  const sd = root.fiveForks || {};
  if (sd.id !== "fiveForks" || sd.attacker !== "US" || sd.defender !== "CS" || sd.defaultFog !== false
      || Object.prototype.hasOwnProperty.call(sd, "phases")) {
    throw new Error("runtime Five Forks data violates the single-phase US-attacker/CS-defender/fog-off contract");
  }
  const rows = unitRows(sd);
  const unitKeys = new Set();
  const sums = { US: 0, CS: 0 };
  for (const row of rows) {
    const id = String(row.unit.id || row.unit.name || "");
    if (!row.side || !id) throw new Error("Five Forks unit lacks side/id");
    unitKeys.add(row.side + ":" + id);
    sums[row.side] += +row.unit.men || 0;
    if (!/Inferred strength/.test(String(row.unit.note || ""))) throw new Error("Five Forks unit lacks an Inferred-strength disclosure: " + id);
  }
  if (sums.US < 20500 || sums.US > 21500 || sums.CS < 8900 || sums.CS > 9500) throw new Error("runtime engaged totals miss the 21,000 / 9,200 anchors: " + JSON.stringify(sums));
  const runtimeText = JSON.stringify(sd);
  for (const term of ["Five Forks", "White Oak Road", "the Angle", "Gravelly Run", "Hatcher's Run", "Dinwiddie Court House", "shad bake"]) {
    if (!runtimeText.includes(term)) throw new Error("runtime landmark/teaching tooth missing " + term);
  }
  for (const rank of [
    "Maj. Gen. Philip H. Sheridan", "Maj. Gen. Gouverneur K. Warren", "Brig. Gen. Charles Griffin",
    "Maj. Gen. George E. Pickett", "Maj. Gen. Fitzhugh Lee", "Maj. Gen. Thomas L. Rosser", "Lt. Gen. Ulysses S. Grant"
  ]) if (!runtimeText.includes(rank)) throw new Error("runtime rank tooth missing " + rank);
  for (const re of [
    /Lt\. Gen\. Philip H\. Sheridan/, /Maj\. Gen\. Charles Griffin(?!.*brevet)/,
    /Lt\. Gen\. George E\. Pickett/, /Maj\. Gen\. Ulysses S\. Grant/, /General Ulysses S\. Grant/
  ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank rendering: " + re);

  const leaders = (sd.leaders || {});
  const usLeaders = Array.isArray(leaders.US) ? leaders.US : [];
  const csLeaders = Array.isArray(leaders.CS) ? leaders.CS : [];
  const warren = usLeaders.find(ld => ld && ld.id === "ld_warren");
  const griffin = usLeaders.find(ld => ld && ld.id === "ld_griffin");
  if (!warren || !griffin) throw new Error("future US cast requires ld_warren and ld_griffin");
  if (typeof griffin.atSec !== "number" || !Number.isFinite(griffin.atSec) || griffin.atSec < 0
      || griffin.replaces !== "ld_warren"
      || griffin.entry !== "Sheridan relieves Warren; Griffin assumes command of V Corps.") {
    throw new Error("future Griffin replacement record violates the exact generic contract");
  }
  if (csLeaders.some(ld => /Pickett|Fitzhugh Lee|Thomas L\. Rosser/.test(String(ld && ld.name || "")))) {
    throw new Error("absent Confederate senior command appears as an active Five Forks aura source");
  }

  const cards = (((sd.teaching || {}).cards) || []);
  const codex = (sd.teaching || {}).codex || {};
  if (cards.length < 7 || cards.some(card => sourceUrls(card.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(card.provenance || "")))) {
    throw new Error("runtime teaching requires seven cards, two packet URLs each, and exact provenance");
  }
  if (sourceUrls(codex.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance || ""))) {
    throw new Error("runtime codex requires two packet URLs and exact provenance");
  }
  const codexText = JSON.stringify(codex);
  if (!codexText.includes("Eastern") || !codexText.includes("Appomattox Campaign") || !codexText.includes("Union victory")) {
    throw new Error("runtime codex lacks Eastern / Appomattox Campaign / Union victory axes");
  }

  const expectedPin = 1170 + unitKeys.size * 3;
  const history = s.lootRaw.match(/D380:[^\n]*1170\s*->\s*([0-9]+)[^\n]*(Five Forks|fiveForks)/i);
  const laterTransitions = Array.from(s.lootRaw.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => x.d > 380).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const transition of laterTransitions) if (transition.from === documentedPin) documentedPin = transition.to;
  if (!history || +history[1] !== expectedPin || s.pin < expectedPin || s.pin !== documentedPin || s.pinUi[0] !== s.pin || s.pinUi[1] !== s.pin) {
    throw new Error("runtime Army Register must document 1170 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }

  const focused = read(FOCUSED);
  const seedBlock = (focused.match(/(?:const|var) SEEDS\s*=\s*\[([^\]]+)\]/) || [null, ""])[1];
  const seeds = Array.from(seedBlock.matchAll(/\b([0-9]+)\b/g)).map(m => +m[1]);
  if (seeds.length !== 8 || new Set(seeds).size !== 8) throw new Error("focused Five Forks probe requires exactly eight unique seeds");
  mustInclude(focused, [
    "ld_warren", "ld_griffin", "relieved", "Warren before", "Griffin after", "no overlap", "no gap",
    "historical direction", "pageerrors", "playwright", "fldLaunchBattle"
  ], "focused Five Forks probe");
  if ((focused.match(/>=\s*5/g) || []).length < 2 || !/process\.exit\(1\)/.test(focused)) {
    throw new Error("focused Five Forks probe lacks both 5/8 direction guards or fail-closed exit");
  }

  return {
    state: "implementation-present",
    scenarios: s.rosterExpected.length,
    schema: s.totalDataFiles,
    units: unitKeys.size,
    armyRegister: s.pin,
    coverage: { flags: s.explicitFlagIds.length, weather: s.weatherCount, media: s.mediaCount },
    suite: s.suiteRows.length,
    sums
  };
});

step("LANE", () => {
  const text = read(COORD);
  const start = text.indexOf("### LANE-003");
  if (start < 0) throw new Error("LANE-003 missing from COORDINATION.md");
  const next = text.indexOf("\n### LANE-", start + 8);
  const lane = text.slice(start, next < 0 ? text.length : next);
  // D381 relay reshape: the original tooth grepped the CURRENT lock holder's serialization
  // sentence ("No simultaneous Claude Code edits") and pinned VERIFY/DRIVE ownership to the
  // D379-era owner — both broke on the legitimate provider transfer, the exact failure class
  // the Contract Relay predicts. Anchors are now durable history/contract facts and the
  // owner check binds the ROLE ROSTER (any recognized TOP-LOOP tool), never today's lock.
  mustInclude(lane, [
    "battle-ladder",
    "D379",
    "Five Forks",
    "Appomattox Campaign",
    "18 registered scenarios",
    "schema 48",
    "Army Register 1170",
    "suite 123",
    "npm run vet:noreg",
    "no simultaneous edits by any provider"
  ], "LANE-003 D379 contract");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  const owner = (lane.match(/\*\*Owning tool:\*\*\s*([^\n]+)/) || [null, ""])[1];
  if (!["DRIVE", "VERIFY", "CONTRACT", "SHIPPED"].includes(state)) throw new Error("LANE-003 does not carry a D379-driveable state: " + state);
  if ((state === "DRIVE" || state === "VERIFY") && !/(ChatGPT\/Codex|Claude (?:Code|Fable))/.test(owner)) throw new Error("active lane owner is not a recognized TOP-LOOP tool: " + owner);
  if (state === "CONTRACT" && !/^none\b/.test(owner)) throw new Error("released D379 CONTRACT lane must be unowned: " + owner);
  return { state, owner };
});

writeFileSync(join(OUT, "probe-five-forks-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(row => row.ok).length;
const fail = result.steps.length - ok;
console.log("probe-five-forks-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.err);
  process.exit(1);
}
console.log("ALL OK");
