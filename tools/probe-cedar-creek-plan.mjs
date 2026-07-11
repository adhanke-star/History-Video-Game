#!/usr/bin/env node
// D375 planning/spec gate for LANE-003 Cedar Creek.
// Filesystem-only until data/cedar-creek.json exists. Runtime teeth ship with D376.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "cedar-creek-battle-build-spec.md");
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
const DATA = join(ROOT, "data", "cedar-creek.json");
const FOCUSED = join(ROOT, "tools", "probe-cedar-creek.mjs");

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

step("SPEC: durable Cedar Creek packet exists and locks a planning-only D375 boundary", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 16000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "Cedar Creek Battle-Build Spec (D375)",
    "This slice adds no runtime data",
    "roles REVERSE between phases",
    "attacker:\"CS\"",
    "defender:\"US\"",
    "Gordon's Dawn Assault",
    "Sheridan's Counterattack",
    "Score weights: 1 + 3 = 4",
    "The sum is 4, NOT 5",
    "per-phase `defaultFog:true`",
    "per-phase `defaultFog:false`",
    "cedarCreek:72",
    "after `kennesaw:70` and before `franklin:75`",
    "Runtime work starts only from that clean D375 boundary"
  ], "spec");
  return { bytes: text.length };
});

step("LANE: LANE-003 carries the ratified Cedar Creek contract past the D375 boundary", () => {
  // 2026-07-11 relay boundary: Fable released the lock at D375 and Aaron routed D376 to the
  // chartered Codex 5.6 Sol Ultra session, so CONTRACT joins the allowed states — the tooth's
  // guarantee is "the ratified contract is carried and driveable", not who holds the lock today.
  const text = read(COORD);
  const start = text.indexOf("### LANE-003");
  if (start < 0) throw new Error("LANE-003 missing from COORDINATION.md");
  const next = text.indexOf("\n### LANE-", start + 8);
  const lane = text.slice(start, next < 0 ? text.length : next);
  mustInclude(lane, [
    "battle-ladder",
    "Cedar Creek",
    "shenandoah-1864",
    "D375 (2026-07-11) locked the Cedar Creek contract"
  ], "LANE-003 contract");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  if (state !== "CONTRACT" && state !== "DRIVE" && state !== "VERIFY" && state !== "SHIPPED") throw new Error("LANE-003 must carry a driveable D375+ contract: " + state);
  return { state };
});

step("SOURCES: the CMH strength anchor, both NPS dispute articles, the OOB registers, and the D375 Kitching pass bind the contract", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "battlefields.org/learn/civil-war/battles/cedar-creek",
    "nps.gov/articles/000/battle-of-cedar-creek.htm",
    "history.army.mil/books/Staff-Rides/CedarCreek/ccob.htm",
    "web.archive.org/web/20230928113544",
    "history.army.mil/books/Staff-Rides/CedarCreek/ccbattle.htm",
    "ccbf.us/order-of-battle",
    "nps.gov/articles/000/fatal-halt.htm",
    "nps.gov/articles/000/sheridan-arrives.htm",
    "docsouth.unc.edu/fpn/gordon",
    "nps.gov/mono/learn/historyculture/jubalearly.htm",
    "en.wikipedia.org/wiki/Battle_of_Cedar_Creek",
    "nps.gov/people/j-howard-kitching.htm",
    "museum.dmna.ny.gov/unit-history/artillery/6th-heavy-artillery-regiment"
  ];
  for (const anchor of required) {
    if (!urls.some(u => u.indexOf(anchor) >= 0)) throw new Error("source register missing anchor: " + anchor);
  }
  mustInclude(text, [
    "Discrepancy register",
    "8,824",
    "8,575",
    "7,682",
    "NO per-side split",
    "all three agree US > CS",
    "31,945 / 21,000",
    "31,610 / 21,102",
    "an ABT ERROR",
    "\"twenty miles away\" is Read's 1865 propaganda inflation"
  ], "source honesty");
  return { urls: urls.length };
});

step("SHAPE: the role reversal, the two-phase weights, the fog law, and the count-free pursuit are locked", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "The direction-neutral casualty law",
    "US bled MORE and WON",
    "FORBIDDEN: any aggregate casualty tooth in either direction",
    "the surprised/flanked side bleeds in the phase it is struck",
    "DIRECTION ONLY",
    "Pursuit prose is COUNT-FREE",
    "McInturff's and Bowman's Fords",
    "wades Cedar Creek unopposed at 04:30",
    "Wharton advances up the Valley Pike at Hupp's Hill",
    "the cemetery-hill stand",
    "XIX Corps (Emory) the Union right, VI Corps (Wright) the left, Merritt's cavalry the left flank, Custer the far right, Crook's VIII in reserve",
    "Rosser opposes Custer on the Back Road",
    "Inferred-grade only",
    "NO probe tooth asserts the order"
  ], "shape");
  mustNotInclude(text, ["scoreWeight 5", "three scored phases"], "shape");
  return { phases: 2, reversal: "CS dawn attacker -> US afternoon attacker" };
});

step("STRENGTH: the CMH unit-grain anchors, the phase bounds, and label law are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Engaged strengths, not campaign paper totals",
    "Verified identity; Inferred strength",
    "total 31,610 / 90 guns",
    "total 21,102",
    "Kershaw 3,071",
    "No official report is available",
    "15,680",
    "phase-1 CS total 12,500-14,500",
    "phase-1 US total 27,000-31,610",
    "phase-2 US total 22,000-28,500",
    "phase-2 CS total 13,000-19,000",
    "~14,000-attacking anchor",
    "Lomax (3,121) is NOT fielded"
  ], "strength contract");
  return { anchored: true };
});

step("HISTORY: the substantive-grade rank table, the Emory correction, and the D375 Kitching resolution are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "**Brig. Gen. William H. Emory (Bvt. Maj. Gen.)** — XIX Corps. THE §12 C73-CLASS CORRECTION",
    "Reject `Maj. Gen. William H. Emory`",
    "**Lieutenant General (temporary grade)**, appointed May 31 1864",
    "Reject `Maj. Gen. Jubal A. Early` (the ABT facts-box ERROR)",
    "His MG dates Oct 21 1864 — two days AFTER the battle",
    "NOT a lieutenant general until 1869",
    "never backdate",
    "The NPS OOB's \"Maj. Gen. Rosser\" is an ERROR (refute-confirmed)",
    "his brevet BG was awarded POSTHUMOUSLY",
    "Reject `Brig. Gen. J. Howard Kitching`",
    "never encode him killed-in-action",
    "The \"commission made out the day of his death\" claim is DROPPED",
    "His brigadier star was POSTHUMOUS — he never held the grade in life",
    "Custer's MG is 1865",
    "**Devin led a BRIGADE under Merritt**",
    "TEACHING FLAVOR ONLY, never a scripted-death mechanic",
    "his death is Hatcher's Run, Feb 1865",
    "Format law: brevet parentheticals follow the NAME"
  ], "history locks");
  return { corrections: ["Emory Brig. Gen. (Bvt. MG)", "Rosser Brig. Gen.", "Kitching Col. (posthumous-brevet trap)"] };
});

step("TEACHING: the two-primary Fatal Halt dispute, the ride/poem split, and the Burning dignity line are contracted", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "cc_fatal_halt",
    "cc_sheridans_ride",
    "cc_the_burning",
    "cc_ramseur",
    "cc_gordons_march",
    "cc_lost_cause_architect",
    "cc_election_1864",
    "cc_lowell",
    "glory enough for one day",
    "attribute to Gordon's Reminiscences, NEVER state as fact",
    "the dispute IS the lesson",
    "DIGNITY LINE: teaching-only — never a scored or gamified objective",
    "Thomas Buchanan Read's 1865 propaganda",
    "marble man",
    "overwhelmed by numbers",
    "Card-claims law",
    "the D366 pre-authoring workflow pattern"
  ], "teaching");
  return { cards: 8 };
});

step("D74 + GATES: the no-fudge wall, planning gate, runtime gate, and integration obligations are specified", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "valorMult",
    "heroism",
    "a dawn-surprise `powerMult`/readiness fudge",
    "a plunder/straggle mechanic encoding Early's blame theory",
    "a gun/wagon/prisoner capture-count tooth",
    "an aggregate casualty-direction tooth in EITHER direction",
    "Required D375 Planning Gate",
    "Required D376 Runtime Gate",
    "probe-cedar-creek-plan",
    "tools/probe-cedar-creek.mjs",
    "`cedarCreek: 2`",
    "1068 + unique units",
    "the pin-bump idiom",
    "16 to 17",
    "121 → 122",
    "csFlag:\"anv\"",
    "largest-scene check",
    "nothing runs concurrently with a probe battery (the D373 lesson)"
  ], "gates");
  return { d74: "wall intact", gates: "specified" };
});

step("CLASSIC-LAYER GUARD: no cedarcreek rail route exists and the spec documents the collision grep", () => {
  const rail = JSON.parse(read(RAIL));
  const hit = Object.keys(rail.routes || {}).filter(k => /cedar/i.test(k));
  if (hit.length) throw new Error("unexpected Classic-layer cedar route: " + hit.join(", "));
  const text = read(SPEC);
  mustInclude(text, ["NO change to `data/logistics-rail.json` expected", "greps the frozen Classic layer"], "classic-layer doc");
  return { routes: "no cedar collision" };
});

step("DIGNITY: the standing Fort Pillow guard holds and the Burning stays teaching-only", () => {
  const dataFiles = readdirSync(join(ROOT, "data")).filter(f => /pillow/i.test(f));
  if (dataFiles.length) throw new Error("fort-pillow data file present: " + dataFiles.join(", "));
  const t1 = read(T1);
  const vet = read(VET);
  const roster = read(ROSTER);
  if (/fortPillow|fort-pillow/i.test(stripJsComments(t1))) throw new Error("Fort Pillow appears in the T1 registry/menu code");
  if (/fort-?pillow/i.test(stripJsComments(vet))) throw new Error("Fort Pillow appears in the vet suite");
  if (/fortPillow/i.test(stripJsComments(roster))) throw new Error("Fort Pillow appears in the roster baseline");
  const text = read(SPEC);
  mustInclude(text, ["never a scored or gamified objective", "no Leetown Native OOB, no playable Fort Pillow"], "dignity doc");
  return { playable: false, burning: "teaching-only" };
});

step("REGISTRY: D375 stays planned-only; any future data file requires complete D376 integration", () => {
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
  const registryHas = /R\.cedarCreek\s*=\s*GAME_DATA\["cedar-creek"\]\.cedarCreek/.test(t1);
  const menuRankHas = /\bcedarCreek\s*:\s*72\b/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.indexOf("cedarCreek") >= 0;
  const builderHas = builderExpected.indexOf("cedarCreek") >= 0;
  const battleSet = (schema.match(/const BATTLE_FILES = new Set\(\[([\s\S]*?)\]\);/) || [null, ""])[1];
  const schemaHas = Array.from(battleSet.matchAll(/['"]([^'"]+\.json)['"]/g)).map(m => m[1]).indexOf("cedar-creek.json") >= 0;
  const flagBlock = (flagsData.match(/var _FLD_BATTLE_META = \{([\s\S]*?)\n\};/) || [null, ""])[1];
  const flagIds = Array.from(flagBlock.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)).map(m => m[1]);
  const ccFlagBody = (flagBlock.match(/\bcedarCreek\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = flagIds.indexOf("cedarCreek") >= 0
    && /\btheater\s*:\s*['"]E['"]/.test(ccFlagBody)
    && /\bbadges\s*:\s*false\b/.test(ccFlagBody)
    && /\bcsFlag\s*:\s*['"]anv['"]/.test(ccFlagBody);
  const anyRuntimeSeam = /\bcedarCreek\b/.test(t1) || /\bcedarCreek\b/.test(roster)
    || /\bcedarCreek\b/.test(builder) || /\bcedar-creek\.json\b/.test(schema)
    || flagIds.indexOf("cedarCreek") >= 0 || /cedar[-\s]?creek/i.test(flagsProbe)
    || /cedar[-\s]?creek/i.test(intel) || /cedar[-\s]?creek/i.test(vet)
    || /cedar[-\s]?creek/i.test(loot) || /cedar[-\s]?creek/i.test(media);
  const flagCount17 = /P\.metaCoverage\.length\s*===\s*(?:1[7-9]|[2-9][0-9])/.test(flagsProbe);
  const intelCount17 = /coverage\.count\s*===\s*(?:1[7-9]|[2-9][0-9])/.test(intel);
  const mediaData = JSON.parse(media);
  const mediaCountMatch = String((mediaData.performanceProfile || {}).largestShippedSceneMetric || "").match(/largest of (?:the )?([0-9]+) shipped opening scenes/i);
  const mediaCount = mediaCountMatch ? +mediaCountMatch[1] : 0;
  const suiteBlock = (vet.match(/const SUITE = \[([\s\S]*?)\n\];/) || [null, ""])[1];
  const suiteRows = Array.from(suiteBlock.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g));
  const vetHas = suiteRows.length >= 122 && suiteRows.some(m => /cedar creek/i.test(m[1]) && m[2] === "tools/probe-cedar-creek.mjs");
  const sweepCountMatch = vetRaw.match(/sweep-all-battles\.mjs[^\n]*?([0-9]+) battles/i);
  const sweepCount = sweepCountMatch ? +sweepCountMatch[1] : 0;
  const pin = (loot.match(/reg\.people\.length!==([0-9]+)/) || [null, "0"])[1];
  const pinUi = (loot.match(/indexOf\('([0-9]+) of ([0-9]+)'\)/) || [null, "0", "0"]);
  const lootHistory = loot.match(/D376:[^\n]*1068\s*->\s*([0-9]+)[^\n]*(Cedar Creek|cedarCreek)/i);
  const plannedBaselines = flagIds.length === 17 && flagIds.indexOf("cedarCreek") < 0
    && /P\.metaCoverage\.length\s*===\s*16/.test(flagsProbe)
    && /coverage\.count\s*===\s*16/.test(intel)
    && mediaCount === 16
    && suiteRows.length === 121
    && sweepCount === 16
    && pin === "1068" && pinUi[1] === "1068" && pinUi[2] === "1068"
    && !lootHistory;

  if (!hasData) {
    if (anyRuntimeSeam || !plannedBaselines || registryHas || menuRankHas || rosterHas || builderHas || schemaHas || flagMetaHas || hasFocused) {
      throw new Error("D375 planning slice must not half-register Cedar Creek before data exists");
    }
    return { state: "planned-only", data: false, anyRuntimeSeam, plannedBaselines };
  }

  if (!registryHas) throw new Error("data exists but T1 registry lacks the exact GAME_DATA entry");
  if (!menuRankHas) throw new Error("runtime exists but fldScenarioMenuRank lacks cedarCreek:72");
  if (!rosterHas) throw new Error("runtime exists but probe-tactical-roster EXPECTED lacks cedarCreek");
  if (!builderHas) throw new Error("runtime exists but probe-custom-battle-builder EXPECTED lacks cedarCreek");
  if (!schemaHas) throw new Error("runtime exists but validate-data-schemas lacks cedar-creek.json");
  if (!hasFocused) throw new Error("runtime exists but tools/probe-cedar-creek.mjs is missing");
  if (!flagMetaHas || !flagCount17) throw new Error("runtime exists but T10/probe-flags lacks Cedar Creek E/false/anv coverage");
  if (!intelCount17 || mediaCount < 17) throw new Error("runtime exists but Intel/media opening-scene count is below 17");
  if (!vetHas || sweepCount < 17) throw new Error("runtime exists but vet-no-regression lacks enrollment or the 17-battle sweep note");
  const focusedText = read(FOCUSED);
  if (!/direction-?neutral/i.test(focusedText)) {
    throw new Error("the focused probe must carry the direction-neutral casualty law (the winner bled more; no aggregate direction tooth)");
  }
  const root = JSON.parse(read(DATA));
  const sd = root.cedarCreek || {};
  if (sd.id !== "cedarCreek" || sd.attacker !== "CS" || sd.defender !== "US"
      || !Array.isArray(sd.phases) || sd.phases.length !== 2) {
    throw new Error("runtime data violates the two-phase top-level-CS-opening contract");
  }
  const p0 = sd.phases[0], p1 = sd.phases[1];
  if (p0.attacker !== "CS" || p0.defender !== "US" || p0.defaultFog !== true) {
    throw new Error("phase 1 must be the CS dawn attack under fog (attacker CS / defender US / defaultFog true)");
  }
  if (p1.attacker !== "US" || p1.defender !== "CS" || p1.defaultFog !== false) {
    throw new Error("phase 2 must be the US counterattack in the clear (attacker US / defender CS / defaultFog false)");
  }
  const weights = sd.phases.map(p => (typeof p.scoreWeight === "number" ? p.scoreWeight : 1));
  if (weights[0] !== 1 || weights[1] !== 3) throw new Error("phase weights must be 1+3, got " + weights.join("+"));
  if (weights[0] + weights[1] !== 4) throw new Error("phase weights must sum to 4, never 5");
  const names = sd.phases.map(p => String(p.name || ""));
  if (!/Gordon's Dawn Assault/.test(names[0]) || !/Sheridan's Counterattack/.test(names[1])) {
    throw new Error("phase names must carry Gordon's Dawn Assault then Sheridan's Counterattack: " + names.join(" | "));
  }
  if (!sd.homeEdge || !["high", "low"].includes(sd.homeEdge.US) || !["high", "low"].includes(sd.homeEdge.CS) || sd.homeEdge.US === sd.homeEdge.CS) {
    throw new Error("runtime data lacks role-aware opposite home edges (side-keyed, constant across the role reversal)");
  }
  const forbidden = new Set([
    "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
    "killscale", "killmult", "casualtyscale", "casualtymult", "lossmult", "combatscale", "battledamage",
    "battlefire", "powermult", "moralemult", "routmult", "capturemult", "scorebonus", "scoremult", "winner",
    "winoverride", "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "valormult",
    "heroism", "scripteddeath", "plunder", "straggle"
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
  if (sums[0].CS < 12500 || sums[0].CS > 14500) throw new Error("phase-1 CS strength out of contract: " + sums[0].CS);
  if (sums[0].US < 27000 || sums[0].US > 31610) throw new Error("phase-1 US strength out of contract: " + sums[0].US);
  if (sums[1].US < 22000 || sums[1].US > 28500) throw new Error("phase-2 US strength out of contract: " + sums[1].US);
  if (sums[1].CS < 13000 || sums[1].CS > 19000) throw new Error("phase-2 CS strength out of contract: " + sums[1].CS);
  if (guns[0].CS < 30 || guns[0].CS > 48) throw new Error("phase-1 CS guns out of the 30-48 sourced range: " + guns[0].CS);
  if (guns[0].US < 60 || guns[0].US > 90) throw new Error("phase-1 US guns out of the 60-90 sourced range: " + guns[0].US);
  if (guns[1].US < 40 || guns[1].US > 90) throw new Error("phase-2 US guns out of the 40-90 range: " + guns[1].US);
  if (guns[1].CS < 15 || guns[1].CS > 48) throw new Error("phase-2 CS guns out of the 15-48 range: " + guns[1].CS);
  const runtimeText = JSON.stringify(sd);
  for (const term of ["Belle Grove", "Valley Pike", "Massanutten", "Cedar Creek", "Middletown", "Miller's Mill", "Hupp's Hill", "Bowman's Mill Ford"]) {
    if (runtimeText.indexOf(term) < 0) throw new Error("landmark tooth missing " + term);
  }
  for (const name of [
    "Maj. Gen. Philip H. Sheridan", "Lt. Gen. Jubal A. Early", "Maj. Gen. Horatio G. Wright",
    "Brig. Gen. William H. Emory", "Brig. Gen. George Crook", "Brig. Gen. Alfred T. A. Torbert",
    "Brig. Gen. Wesley Merritt", "Brig. Gen. George A. Custer", "Brig. Gen. George W. Getty",
    "Brig. Gen. Frank Wheaton", "Brig. Gen. James B. Ricketts", "Brig. Gen. William Dwight",
    "Brig. Gen. Cuvier Grover", "Col. William H. Powell", "Col. Joseph Thoburn",
    "Col. Rutherford B. Hayes", "Col. J. Howard Kitching", "Col. J. Warren Keifer",
    "Col. Charles Russell Lowell", "Maj. Gen. John B. Gordon", "Maj. Gen. Joseph B. Kershaw",
    "Maj. Gen. Stephen D. Ramseur", "Maj. Gen. Lunsford L. Lomax", "Brig. Gen. John Pegram",
    "Brig. Gen. Gabriel C. Wharton", "Brig. Gen. Thomas L. Rosser", "temporary grade"
  ]) if (runtimeText.indexOf(name) < 0) throw new Error("runtime name/rank tooth missing " + name);
  for (const re of [
    /Lt\. Gen\. Philip H\. Sheridan/, /Maj\. Gen\. Jubal A\. Early/, /Maj\. Gen\. William H\. Emory/,
    /Maj\. Gen\. George Crook/, /Maj\. Gen\. Alfred T\. A\. Torbert/, /Maj\. Gen\. George A\. Custer/,
    /Maj\. Gen\. Wesley Merritt/, /Brig\. Gen\. Joseph Thoburn/, /Brig\. Gen\. Rutherford B\. Hayes/,
    /Brig\. Gen\. J\. Howard Kitching/, /Lt\. Gen\. John B\. Gordon/, /Brig\. Gen\. Stephen D\. Ramseur/,
    /Maj\. Gen\. John Pegram/, /Maj\. Gen\. Gabriel C\. Wharton/, /Maj\. Gen\. Thomas L\. Rosser/,
    /\b43 guns\b/, /\b24 recaptured\b/, /\b200 wagons\b/, /\b1,000 prisoners\b/i
  ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank/name/count rendering: " + re);
  for (const p of sd.phases) {
    if (/burning/i.test(String((p.objective || {}).name || ""))) throw new Error("The Burning may never be an objective");
  }
  const cards = (((sd.teaching || {}).cards) || []);
  const codex = (sd.teaching || {}).codex || {};
  if (cards.length < 7 || cards.some(card => sourceUrls(card.sources).length < 2) || sourceUrls(codex.sources).length < 2) {
    throw new Error("runtime teaching/codex requires at least seven cards and two source URLs each");
  }
  const codexText = JSON.stringify(codex);
  if (codexText.indexOf("Eastern") < 0 || codexText.indexOf("Union victory") < 0) {
    throw new Error("codex must carry theater Eastern and result Union victory");
  }
  const halt = cards.find(c => JSON.stringify(c).indexOf("glory enough") >= 0);
  if (runtimeText.indexOf("glory enough") >= 0) {
    if (!halt) throw new Error("the glory-enough line appears outside any teaching card");
    const haltText = JSON.stringify(halt);
    if (!/Reminiscences/.test(haltText) || !/Gordon/.test(haltText) || !/Early/.test(haltText)) {
      throw new Error("the Fatal Halt card must attribute the glory-enough line to Gordon's Reminiscences beside Early's account");
    }
    const stripped = JSON.stringify({ ...sd, teaching: undefined });
    if (stripped.indexOf("glory enough") >= 0) throw new Error("the glory-enough line may live only in teaching");
  } else {
    throw new Error("the Fatal Halt dispute (with the attributed glory-enough line) is missing from teaching");
  }
  const weather = sd.weather || {};
  if (weather.sky !== "fog" || weather.time !== "dawn" || !/^(Verified|Inferred)$/.test(String(weather.provenance || "")) || sourceUrls(weather.sources).length < 2) {
    throw new Error("runtime weather requires fog/dawn, exact provenance, and two source URLs");
  }
  const expectedPin = 1068 + unitKeys.size * 3;
  const laterTransitions = Array.from(loot.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => x.d > 376).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const tr of laterTransitions) if (tr.from === documentedPin) documentedPin = tr.to;
  if (+pin < expectedPin || +pin !== documentedPin || pinUi[1] !== pin || pinUi[2] !== pin || !lootHistory || +lootHistory[1] !== expectedPin) {
    throw new Error("runtime loot pins must document 1068 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }
  return { state: "implementation-present", units: unitKeys.size, sums, guns, pin: +pin };
});

writeFileSync(join(OUT, "probe-cedar-creek-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-cedar-creek-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const s of result.steps) if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  process.exit(1);
}
console.log("ALL OK");
