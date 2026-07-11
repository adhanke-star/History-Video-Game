#!/usr/bin/env node
// D365 planning/spec gate for LANE-003 Stones River.
// Filesystem-only until data/stones-river.json exists. Runtime teeth ship with D366.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "stones-river-battle-build-spec.md");
const COORD = join(ROOT, "COORDINATION.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const ROSTER = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const LOOT = join(ROOT, "tools", "probe-loot-survival.mjs");
const SCHEMA = join(ROOT, "tools", "validate-data-schemas.mjs");
const FLAGS_DATA = join(ROOT, "src", "tactical", "T10-flags.js");
const FLAGS_PROBE = join(ROOT, "tools", "probe-flags.mjs");
const INTEL = join(ROOT, "tools", "probe-intel-uhd617-profile.mjs");
const MEDIA = join(ROOT, "data", "media-budget.json");
const VET = join(ROOT, "tools", "vet-no-regression.mjs");
const RAIL = join(ROOT, "data", "logistics-rail.json");
const DATA = join(ROOT, "data", "stones-river.json");
const FOCUSED = join(ROOT, "tools", "probe-stones-river.mjs");

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
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
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

step("SPEC: durable Stones River packet exists and locks a planning-only D365 boundary", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 16000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "Stones River Battle-Build Spec (D365)",
    "This slice adds no runtime data",
    "the two real combat days",
    "TEACHING INTERSTITIAL",
    "NEVER a scored phase",
    "attacker:\"CS\"",
    "defender:\"US\"",
    "defaultFog:false",
    "December 31 - The Dawn Attack and the Round Forest",
    "January 2 - Breckinridge at McFadden's Ford",
    "Score weights: 3 + 1 = 4",
    "stonesRiver:52",
    "after `shiloh:50` and before `vicksburg:55`",
    "Runtime work starts only from that clean D365 boundary"
  ], "spec");
  return { bytes: text.length };
});

step("LANE: LANE-003 carries the battle-ladder record past the D364 boundary", () => {
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
    "took DRIVE 2026-07-10",
    "Stones River"
  ], "LANE-003 record");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  if (state !== "CONTRACT" && state !== "DRIVE" && state !== "VERIFY" && state !== "SHIPPED") throw new Error("LANE-003 must carry a driveable contract for D365+: " + state);
  return { state };
});

step("SOURCES: the ABT aggregate lock, NPS landmark pages, Breckinridge's OR report, and Lincoln's letter bind the contract", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "battlefields.org/learn/civil-war/battles/stones-river",
    "nps.gov/stri/learn/historyculture/hellshalfacre.htm",
    "nps.gov/stri/learn/photosmultimedia/battle_stop3.htm",
    "nps.gov/stri/learn/photosmultimedia/battle_stop2.htm",
    "westerntheatercivilwar.com/post/in-his-own-words-john-c-breckinridge",
    "warfarehistorynetwork.com/article/final-attack-at-the-battle-of-stones-river",
    "en.wikipedia.org/wiki/Battle_of_Stones_River_order_of_battle:_Confederate",
    "quod.lib.umich.edu/l/lincoln"
  ];
  for (const anchor of required) {
    if (!urls.some(u => u.indexOf(anchor) >= 0)) throw new Error("source register missing anchor: " + anchor);
  }
  mustInclude(text, [
    "US 12,906",
    "CS 11,739",
    "41,400",
    "35,000",
    "Discrepancy register",
    "13,906",
    "12,706 / CS 9,870",
    "could not be located on any live ABT page",
    "attributed-only"
  ], "source honesty");
  return { urls: urls.length };
});

step("SHAPE: the two-day structure, the Jan-1 interstitial law, and the near-parity law are locked", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "The near-parity law",
    "The winner bled MORE",
    "FORBIDDEN: any guard, tooth, or tuning pass that forces US losses below CS",
    "max(totalUS, totalCS) / min(totalUS, totalCS)",
    "1.6",
    "DIRECTION ONLY",
    "No citation-grade Dec-31 casualty split exists",
    "Adams's and Jackson's brigades cross mid-morning",
    "Preston's and Palmer's brigades make the final ~4:00 p.m.",
    "Hanson's Orphan Brigade + Palmer's brigade under Brig. Gen. Gideon J. Pillow",
    "Adams's brigade under Col. Randall L. Gibson + Preston's brigade",
    "Negley's division (Miller's and Stanley's brigades) counterattacks"
  ], "shape");
  mustNotInclude(text, ["scoreWeight 5", "three scored phases"], "shape");
  return { phases: 2, interstitial: "Jan 1 teaching only" };
});

step("STRENGTH: engaged-strength bounds, the gun-range tooth, and label law are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Engaged strengths, not campaign paper totals",
    "Verified identity; Inferred strength",
    "phase-1 US total 38,000-41,400",
    "phase-1 CS total 30,000-35,000",
    "phase-2 CS total 4,200-5,000",
    "phase-2 US total 7,000-11,000",
    "total US phase-2 guns 45-58",
    "7,053",
    "~4,500",
    "the range IS the tooth",
    "The Jan 2 assault force is ~4,500, not 5,000"
  ], "strength contract");
  return { anchored: true };
});

step("HISTORY: rank locks, the lieutenant-general flip, and the refute-pass corrections are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "**Lt. Gen. Leonidas Polk** and **Lt. Gen. William J. Hardee** — THE HEADLINE FLIP",
    "effective Oct 10, 1862",
    "**Brig. Gen. Philip H. Sheridan** — THE TRAP",
    "BACKDATED date of rank",
    "Col. William B. Hazen",
    "Col. Samuel Beatty",
    "Maj. Gen. Patrick R. Cleburne",
    "promoted Dec 13, 1862",
    "Gen. Braxton Bragg",
    "Maj. Gen. John C. Breckinridge",
    "Brig. Gen. Roger W. Hanson",
    "Capt. John Mendenhall",
    "S.A.M. Wood's brigade belongs to CLEBURNE, not McCown",
    "Cheatham's fourth brigade is Preston Smith's",
    "Two Confederate generals fell at Stones River, not four",
    "The Imitation of Christ",
    "Reject `Robert W. Hanson`",
    "Garfield"
  ], "history locks");
  mustNotInclude(text, ["personal Bible of Garesch"], "history");
  return { flips: ["Polk/Hardee Lt. Gen.", "Cleburne MG", "Sheridan BG"], corrections: "refute pass applied" };
});

step("TEACHING: the won-by-holding core, the protest, the revolt, and the Emancipation interstitial are contracted with anti-Lost-Cause framing", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "sr_won_by_holding",
    "sr_dawn_breakfast",
    "sr_hells_half_acre",
    "sr_breckinridge_protest",
    "sr_mendenhall",
    "sr_garesche",
    "sr_generals_revolt",
    "sr_emancipation",
    "you gave us a hard earned victory",
    "never as doomed Southern gallantry",
    "unwise, in a high degree",
    "his official report",
    "Internal command failure, not bad luck",
    "secondary-attested"
  ], "teaching");
  return { cards: 8 };
});

step("D74 + GATES: the no-fudge wall, planning gate, runtime gate, and integration obligations are specified", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "valorMult",
    "heroism",
    "a parity-forcing casualty key",
    "a dawn-surprise `powerMult`",
    "an exact Mendenhall gun-count tooth",
    "Required D365 Planning Gate",
    "Required D366 Runtime Gate",
    "probe-stones-river-plan",
    "tools/probe-stones-river.mjs",
    "`stonesRiver: 2`",
    "990 + unique units",
    "15 to 16",
    "120 → 121",
    "csFlag:\"hardee\"",
    "largest-scene check",
    "NO change to `data/logistics-rail.json`"
  ], "gates");
  return { d74: "wall intact", gates: "specified" };
});

step("CLASSIC-LAYER GUARD: the strategic stonesriver rail route is untouched and documented as a separate layer", () => {
  const rail = JSON.parse(read(RAIL));
  const route = (rail.routes || {}).stonesriver;
  if (!route || route.theater !== "W") throw new Error("logistics-rail routes.stonesriver missing or altered");
  const text = read(SPEC);
  mustInclude(text, ["malvern`/`malvernHill` precedent", "do NOT rename either"], "classic-layer doc");
  return { route: route.label };
});

step("FORT PILLOW: the standing dignity guard holds — no playable massacre scenario anywhere", () => {
  const dataFiles = readdirSync(join(ROOT, "data")).filter(f => /pillow/i.test(f));
  if (dataFiles.length) throw new Error("fort-pillow data file present: " + dataFiles.join(", "));
  const t1 = read(T1);
  const vet = read(VET);
  const roster = read(ROSTER);
  if (/fortPillow|fort-pillow/i.test(stripJsComments(t1))) throw new Error("Fort Pillow appears in the T1 registry/menu code");
  if (/fort-?pillow/i.test(stripJsComments(vet))) throw new Error("Fort Pillow appears in the vet suite");
  if (/fortPillow/i.test(stripJsComments(roster))) throw new Error("Fort Pillow appears in the roster baseline");
  return { playable: false, guard: "teaching-only" };
});

step("REGISTRY: D365 stays planned-only; any future data file requires complete D366 integration", () => {
  const hasData = existsSync(DATA);
  const hasFocused = existsSync(FOCUSED);
  const t1 = stripJsComments(read(T1));
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
  const registryHas = /R\.stonesRiver\s*=\s*GAME_DATA\["stones-river"\]\.stonesRiver/.test(t1);
  const menuRankHas = /\bstonesRiver\s*:\s*52\b/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.indexOf("stonesRiver") >= 0;
  const builderHas = builderExpected.indexOf("stonesRiver") >= 0;
  const battleSet = (schema.match(/const BATTLE_FILES = new Set\(\[([\s\S]*?)\]\);/) || [null, ""])[1];
  const schemaHas = Array.from(battleSet.matchAll(/['"]([^'"]+\.json)['"]/g)).map(m => m[1]).indexOf("stones-river.json") >= 0;
  const flagBlock = (flagsData.match(/var _FLD_BATTLE_META = \{([\s\S]*?)\n\};/) || [null, ""])[1];
  const flagIds = Array.from(flagBlock.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)).map(m => m[1]);
  const srFlagBody = (flagBlock.match(/\bstonesRiver\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = flagIds.indexOf("stonesRiver") >= 0
    && /\btheater\s*:\s*['"]W['"]/.test(srFlagBody)
    && /\bbadges\s*:\s*false\b/.test(srFlagBody)
    && /\bcsFlag\s*:\s*['"]hardee['"]/.test(srFlagBody);
  const anyRuntimeSeam = /\bstonesRiver\b/.test(t1) || /\bstonesRiver\b/.test(roster)
    || /\bstonesRiver\b/.test(builder) || /\bstones-river\.json\b/.test(schema)
    || flagIds.indexOf("stonesRiver") >= 0 || /stones[-\s]?river/i.test(flagsProbe)
    || /stones[-\s]?river/i.test(intel) || /stones[-\s]?river/i.test(vet)
    || /stones[-\s]?river/i.test(loot) || /stones[-\s]?river/i.test(media);
  const flagCount16 = /P\.metaCoverage\.length\s*===\s*(?:1[6-9]|[2-9][0-9])/.test(flagsProbe);
  const intelCount16 = /coverage\.count\s*===\s*(?:1[6-9]|[2-9][0-9])/.test(intel);
  const mediaData = JSON.parse(media);
  const mediaCountMatch = String((mediaData.performanceProfile || {}).largestShippedSceneMetric || "").match(/largest of (?:the )?([0-9]+) shipped opening scenes/i);
  const mediaCount = mediaCountMatch ? +mediaCountMatch[1] : 0;
  const suiteBlock = (vet.match(/const SUITE = \[([\s\S]*?)\n\];/) || [null, ""])[1];
  const suiteRows = Array.from(suiteBlock.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g));
  const vetHas = suiteRows.length >= 121 && suiteRows.some(m => /stones river/i.test(m[1]) && m[2] === "tools/probe-stones-river.mjs");
  const sweepCountMatch = vetRaw.match(/sweep-all-battles\.mjs[^\n]*?([0-9]+) battles/i);
  const sweepCount = sweepCountMatch ? +sweepCountMatch[1] : 0;
  const pin = (loot.match(/reg\.people\.length!==([0-9]+)/) || [null, "0"])[1];
  const pinUi = (loot.match(/indexOf\('([0-9]+) of ([0-9]+)'\)/) || [null, "0", "0"]);
  const lootHistory = loot.match(/D366:[^\n]*990\s*->\s*([0-9]+)[^\n]*(Stones River|stonesRiver)/i);
  const plannedBaselines = flagIds.length === 16 && flagIds.indexOf("stonesRiver") < 0
    && /P\.metaCoverage\.length\s*===\s*15/.test(flagsProbe)
    && /coverage\.count\s*===\s*15/.test(intel)
    && mediaCount === 15
    && suiteRows.length === 120
    && sweepCount === 15
    && pin === "990" && pinUi[1] === "990" && pinUi[2] === "990"
    && !lootHistory;

  if (!hasData) {
    if (anyRuntimeSeam || !plannedBaselines || registryHas || menuRankHas || rosterHas || builderHas || schemaHas || flagMetaHas || hasFocused) {
      throw new Error("D365 planning slice must not half-register Stones River before data exists");
    }
    return { state: "planned-only", data: false, anyRuntimeSeam, plannedBaselines };
  }

  if (!registryHas) throw new Error("data exists but T1 registry lacks the exact GAME_DATA entry");
  if (!menuRankHas) throw new Error("runtime exists but fldScenarioMenuRank lacks stonesRiver:52");
  if (!rosterHas) throw new Error("runtime exists but probe-tactical-roster EXPECTED lacks stonesRiver");
  if (!builderHas) throw new Error("runtime exists but probe-custom-battle-builder EXPECTED lacks stonesRiver");
  if (!schemaHas) throw new Error("runtime exists but validate-data-schemas lacks stones-river.json");
  if (!hasFocused) throw new Error("runtime exists but tools/probe-stones-river.mjs is missing");
  if (!flagMetaHas || !flagCount16) throw new Error("runtime exists but T10/probe-flags lacks Stones River W/false/hardee coverage");
  if (!intelCount16 || mediaCount < 16) throw new Error("runtime exists but Intel/media opening-scene count is below 16");
  if (!vetHas || sweepCount < 16) throw new Error("runtime exists but vet-no-regression lacks enrollment or the 16-battle sweep note");
  const focusedText = read(FOCUSED);
  if (!/near-?parity/i.test(focusedText) || !/1\.6/.test(focusedText)) {
    throw new Error("the focused probe must carry the near-parity aggregate band, never a US<CS tooth");
  }
  const root = JSON.parse(read(DATA));
  const sd = root.stonesRiver || {};
  if (sd.id !== "stonesRiver" || sd.attacker !== "CS" || sd.defender !== "US" || sd.defaultFog !== false
      || !Array.isArray(sd.phases) || sd.phases.length !== 2) {
    throw new Error("runtime data violates the two-phase CS-attacker/US-defender contract (the Jan 1 lull is never a phase)");
  }
  const weights = sd.phases.map(p => (typeof p.scoreWeight === "number" ? p.scoreWeight : 1));
  if (weights[0] !== 3 || weights[1] !== 1) throw new Error("phase weights must be 3+1, got " + weights.join("+"));
  const names = sd.phases.map(p => String(p.name || ""));
  if (!/December 31/.test(names[0]) || !/January 2/.test(names[1])) throw new Error("phase names must carry December 31 then January 2: " + names.join(" | "));
  if (!sd.homeEdge || !["high", "low"].includes(sd.homeEdge.US) || !["high", "low"].includes(sd.homeEdge.CS) || sd.homeEdge.US === sd.homeEdge.CS) {
    throw new Error("runtime data lacks role-aware opposite home edges");
  }
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
      if (note.indexOf("Verified identity; Inferred strength") < 0) {
        throw new Error("unit lacks the exact strength-provenance label: " + id + " (phase " + pi + ")");
      }
    }
  });
  if (sums[0].US < 38000 || sums[0].US > 41400) throw new Error("phase-1 US strength out of contract: " + sums[0].US);
  if (sums[0].CS < 30000 || sums[0].CS > 35000) throw new Error("phase-1 CS strength out of contract: " + sums[0].CS);
  if (sums[1].CS < 4200 || sums[1].CS > 5000) throw new Error("phase-2 CS strength out of contract: " + sums[1].CS);
  if (sums[1].US < 7000 || sums[1].US > 11000) throw new Error("phase-2 US strength out of contract: " + sums[1].US);
  if (guns[1].US < 45 || guns[1].US > 58) throw new Error("phase-2 US gun mass out of the 45-58 sourced range: " + guns[1].US);
  if (guns[1].CS > 12) throw new Error("phase-2 CS guns exceed the never-deployed contract: " + guns[1].CS);
  const runtimeText = JSON.stringify(sd);
  for (const term of ["Nashville Pike", "Round Forest", "Hell's Half Acre", "Stones River", "McFadden", "Wilkinson Pike", "Slaughter Pen", "cotton field"]) {
    if (runtimeText.indexOf(term) < 0) throw new Error("landmark tooth missing " + term);
  }
  for (const name of [
    "Maj. Gen. William S. Rosecrans", "Gen. Braxton Bragg", "Lt. Gen. Leonidas Polk", "Lt. Gen. William J. Hardee",
    "Maj. Gen. John C. Breckinridge", "Maj. Gen. Patrick R. Cleburne", "Brig. Gen. Philip H. Sheridan",
    "Col. William B. Hazen", "Col. Samuel Beatty", "Brig. Gen. Roger W. Hanson", "Capt. John Mendenhall"
  ]) if (runtimeText.indexOf(name) < 0) throw new Error("runtime name/rank tooth missing " + name);
  for (const re of [
    /Maj\. Gen\. Philip H\. Sheridan/, /Brig\. Gen\. William B\. Hazen/, /Maj\. Gen\. Leonidas Polk/,
    /Maj\. Gen\. William J\. Hardee/, /Lt\. Gen\. John C\. Breckinridge/, /Brig\. Gen\. Patrick R\. Cleburne/,
    /Lt\. Gen\. Braxton Bragg/, /Maj\. Gen\. James S\. Negley/, /Robert W\. Hanson/, /four Confederate generals/i,
    /personal Bible/i
  ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank/name/fact rendering: " + re);
  const cards = (((sd.teaching || {}).cards) || []);
  const codex = (sd.teaching || {}).codex || {};
  if (cards.length < 7 || cards.some(card => sourceUrls(card.sources).length < 2) || sourceUrls(codex.sources).length < 2) {
    throw new Error("runtime teaching/codex requires at least seven cards and two source URLs each");
  }
  if (runtimeText.indexOf("you gave us a hard earned victory") < 0) throw new Error("the Lincoln letter quote is missing from teaching");
  const weather = sd.weather || {};
  if (weather.sky !== "rain" || weather.time !== "dawn" || !/^(Verified|Inferred)$/.test(String(weather.provenance || "")) || sourceUrls(weather.sources).length < 2) {
    throw new Error("runtime weather requires rain/dawn, exact provenance, and two source URLs (never snow)");
  }
  const expectedPin = 990 + unitKeys.size * 3;
  const laterTransitions = Array.from(loot.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => x.d > 366).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const tr of laterTransitions) if (tr.from === documentedPin) documentedPin = tr.to;
  if (+pin < expectedPin || +pin !== documentedPin || pinUi[1] !== pin || pinUi[2] !== pin || !lootHistory || +lootHistory[1] !== expectedPin) {
    throw new Error("runtime loot pins must document 990 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }
  return { state: "implementation-present", units: unitKeys.size, sums, guns, pin: +pin };
});

writeFileSync(join(OUT, "probe-stones-river-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-stones-river-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const s of result.steps) if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  process.exit(1);
}
console.log("ALL OK");
