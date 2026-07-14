#!/usr/bin/env node
// D396 planning/spec gate for LANE-003 Petersburg initial assaults (1864-65 attrition lane,
// the D395 Aaron-named 3.5 rung). Filesystem-first until data/petersburg-assaults.json exists.
// Runtime teeth ship with the runtime slice. The spec is hard-wrapped, so text anchors match on
// whitespace-normalized text (the D385 idiom). The pre-existing frozen Classic `petersburg-break`
// row (the April 2, 1865 Classic battle), its strategic rail route, and the shipped teaching
// prose naming Petersburg (T13's pontoon card, codex/generals/divergence content) are separate
// layers — the runtime-seam scans target TACTICAL identifiers only (petersburgAssaults /
// petersburg-assaults), never the bare place name.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "petersburg-initial-assaults-battle-build-spec.md");
const PACKET = join(ROOT, "docs", "design", "battle-build-research", "1864-65-attrition-battle-build-research.md");
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
const BASE = join(ROOT, "build", "base.html");
const RAIL = join(ROOT, "data", "logistics-rail.json");
const GENERATED = join(ROOT, "civil_war_generals.html");
const DATA = join(ROOT, "data", "petersburg-assaults.json");
const FOCUSED = join(ROOT, "tools", "probe-petersburg-initial-assaults.mjs");
const KENNESAW_PROBE = join(ROOT, "tools", "probe-kennesaw.mjs");
const SPOTSY_PROBE = join(ROOT, "tools", "probe-spotsylvania.mjs");
const WILD_PROBE = join(ROOT, "tools", "probe-wilderness.mjs");
const FIVEFORKS_PROBE = join(ROOT, "tools", "probe-five-forks.mjs");

// ---- research-adjudicated constants (D396 gather -> default-refute -> critic + gap pass -> Fable adjudication) ----
const REQUIRED_URL_ANCHORS = [
  "battlefields.org/learn/civil-war/battles/petersburg",
  "battlefields.org/learn/maps/petersburg-opening-assaults-june-16-1864",
  "battlefields.org/learn/articles/storming-battery-9-petersburg-june-15-1864",
  "battlefields.org/visit/heritage-sites/baylors-farm",
  "nps.gov/pete/learn/historyculture/the-opening-assaults.htm",
  "nps.gov/places/battery-5.htm",
  "nps.gov/places/battery-9.htm",
  "npshistory.com/publications/civil_war_series/20/sec5.htm",
  "npshistory.com/handbooks/historical/13/hh13d.htm",
  "nps.gov/civilwar/search-battle-units-detail.htm",
  "en.wikipedia.org/wiki/Second_Battle_of_Petersburg",
  "encyclopediavirginia.org/entries/dimmock-line-the",
  "essentialcivilwarcurriculum.com",
  "emergingcivilwar.com/2021/06/18/petersburg-day-four-saturday-june-18-1864",
  "emergingcivilwar.com/2021/10/22/under-fire-battlefield-guide-map-for-the-charge-of-the-first-maine-heavy-artillery",
  "beyondthecrater.com",
  "archives.gov/legislative/features/grant"
];
// Future committed-total envelopes (engine abstractions across the four-day arc; every lower
// split ships Inferred). THE REINFORCEMENT-RACE LAW pins the opening on-map splits separately.
const ENVELOPES = { US: [25000, 62000], CS: [14000, 30000] };
const OPENING = { US: [10000, 18000], CS: [2200, 5400] };
// Planning-mode baseline pins (the D393/D394 playable-Wilderness release boundary).
const PIN = {
  scenarios: 23, battleFiles: 23, totalDataFiles: 53, armyRegister: 1434,
  flags: 23, weather: 23, intel: 23, media: 23, suite: 128, sweep: 23,
  generatedMd5: "4fc16d813663f9e2285583fca1bc2939",
  baseMd5: "c9db83fa99230ffb95bdfdfe059f3fb9"
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

// Whitespace-normalized anchor matching (the D385 idiom): the spec is hard-wrapped,
// so anchors collapse whitespace on both sides — the tooth still bites on any word-level tamper.
function mustInclude(text, terms, label) {
  const norm = String(text).replace(/\s+/g, " ").toLowerCase();
  const missing = terms.filter(term => norm.indexOf(String(term).replace(/\s+/g, " ").toLowerCase()) < 0);
  if (missing.length) throw new Error(label + " missing: " + missing.join(" | "));
}

function mustNotInclude(text, terms, label) {
  const norm = String(text).replace(/\s+/g, " ").toLowerCase();
  const present = terms.filter(term => norm.indexOf(String(term).replace(/\s+/g, " ").toLowerCase()) >= 0);
  if (present.length) throw new Error(label + " should not include: " + present.join(" | "));
}

function section(text, startHead, endHead) {
  const a = text.indexOf(startHead);
  if (a < 0) throw new Error("spec section missing: " + startHead);
  const b = endHead ? text.indexOf(endHead, a) : -1;
  return text.slice(a, b < 0 ? text.length : b);
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
  const hits = [];
  let m;
  const scan = new RegExp(objectName.replace(/\./g, "\\.") + "\\s*(?:===|>=)\\s*([0-9]+)", "g");
  while ((m = scan.exec(text))) hits.push(+m[1]);
  return hits;
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

// Single-phase unit rows: top-level oob.US / oob.CS plus side-keyed reinforcements.
function unitRows(sd) {
  const rows = [];
  for (const side of ["US", "CS"]) {
    for (const unit of (((sd.oob || {})[side]) || [])) rows.push({ side, unit, from: "oob" });
  }
  for (const unit of (sd.reinforcements || [])) rows.push({ side: String(unit.side || ""), unit, from: "reinforcements" });
  return rows;
}

// Battle-specific tactical branches outside the shared registry/metadata seams are forbidden
// (D74). Comments are stripped first. T13's pontoon-bridge teaching STRING names Petersburg as
// shipped prose (a separate teaching layer, verified at D396 authoring), so this scan targets
// TACTICAL IDENTIFIERS and quoted-bare-id branch temptations, never the prose place name.
const TACTICAL_ID_RE = /petersburgassaults|petersburg-assaults|["']petersburg["']/i;
function tacticalBattleBranches() {
  const hits = [];
  for (const file of readdirSync(join(ROOT, "src", "tactical")).filter(f => f.endsWith(".js"))) {
    if (file === "T1-bull-run.js" || file === "T10-flags.js") continue;
    const text = stripJsComments(read(join(ROOT, "src", "tactical", file)));
    if (TACTICAL_ID_RE.test(text)) hits.push(file);
  }
  return hits;
}

// Tactical-only seam scan for the generated deliverable: the frozen Classic petersburg-break
// roster row, the embedded strategic rail route, and Classic/codex/teaching prose are
// PRE-EXISTING separate layers, so a plain substring scan would false-positive; these
// regexes match only the tactical integration surface.
const GENERATED_TACTICAL_SEAMS = [
  /R\.petersburgAssaults\s*=/,
  /GAME_DATA\[["']petersburg-assaults["']\]/,
  /\bpetersburgAssaults\s*:\s*69\b/,
  /fldScnBtn_petersburgAssaults/,
  /probe-petersburg-initial-assaults/,
  /["']petersburg-assaults\.json["']/
];

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
  // Plain tactical-identifier scan over integration files that today carry NO petersburg text
  // (verified at D396 authoring: t1/roster/builder/schema/flags/intel/vet/loot are all clean;
  // the bare place name lives only in separate teaching/Classic layers, never these files).
  const scanned = { t1, roster, builder, schema, flagsData, flagsProbe, intel, vet, lootRaw };
  const runtimeSeams = [];
  for (const [name, text] of Object.entries(scanned)) {
    if (/petersburg/i.test(text)) runtimeSeams.push(name);
  }
  if (GENERATED_TACTICAL_SEAMS.some(re => re.test(generatedRaw))) runtimeSeams.push("generatedRaw");
  return {
    hasData: existsSync(DATA),
    hasFocused: existsSync(FOCUSED),
    t1, roster, builder, lootRaw, schema, flagsData, flagsProbe, weatherProbe, intel,
    mediaRaw, vetRaw, vet, generatedRaw,
    rosterExpected, builderExpected,
    phaseCounts: parsePhaseCounts(roster),
    battleFiles, flags, explicitFlagIds,
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
    baseMd5: md5(BASE),
    runtimeSeams,
    tacticalBranches: tacticalBattleBranches()
  };
}

step("FILES + STATUS", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  if (!existsSync(PACKET)) throw new Error("missing " + PACKET);
  const text = read(SPEC);
  if (text.length < 20000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "Petersburg Initial Assaults Battle-Build Spec (D396)",
    "This slice adds no Petersburg runtime data",
    "D396 stops before `data/petersburg-assaults.json`",
    "remain outside this scenario",
    "THE REDUNDANCY DISCHARGE (D395 obligation 1)",
    "D396 Completion Criteria"
  ], "spec status/boundary");
  const packet = read(PACKET);
  mustInclude(packet, [
    "Verdict:** READY_FOR_SPEC",
    "D396 Spec-Time Addendum",
    "THE REDUNDANCY FLAG",
    "DISCHARGED — REFUTED by the gathered evidence",
    "DEFENDER-REINFORCEMENT RACE"
  ], "committed packet + D396 addendum");
  return { specBytes: text.length, packetAddendum: "present" };
});

step("SHAPE + ID + DATE", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "`petersburgAssaults` in `data/petersburg-assaults.json`",
    "**Player-facing title:** `Petersburg: The Initial Assaults`",
    "**June 15-18, 1864**, a standalone SINGLE PHASE",
    "no `phases[]` block, no T8 routing, no new engine capability",
    "`petersburgAssaults:69`, between `spotsylvania:68` and `kennesaw:70`",
    "No existing rank moves",
    "top-level `defaultFog:false`",
    "THE COLD HARBOR RANK DISCLOSURE",
    "rank-renumber obligation"
  ], "shape/id/date contract");
  // Classic/rail collision law: the pre-existing separate layers are pinned, not created.
  const base = read(BASE);
  const rows = Array.from(base.matchAll(/\{id:"petersburg-break", name:"Fall of Petersburg"/g)).length;
  if (rows !== 1) throw new Error("expected exactly one frozen Classic petersburg-break row, got " + rows);
  const rail = JSON.parse(read(RAIL));
  const route = (rail.routes || {})["petersburg-break"];
  if (!route || route.provenance !== "Inferred" || !/Petersburg rail lifelines/.test(String(route.label || ""))) {
    throw new Error("the pre-existing strategic petersburg-break rail route must remain (Inferred, Petersburg rail lifelines label)");
  }
  if ((rail.routes || {}).petersburgAssaults || (rail.routes || {})["petersburg-assaults"]) {
    throw new Error("no tactical Petersburg rail route may exist");
  }
  mustInclude(text, [
    "Frozen Classic And Rail-Route Collision Law",
    "petersburg-break",
    "APRIL 2, 1865",
    "must not edit, rename, or delete it",
    "byte-for-byte",
    "never a source for this scenario",
    "TACTICAL IDENTIFIERS only"
  ], "collision contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).petersburgAssaults || {};
    if (sd.id !== "petersburgAssaults") throw new Error("runtime id must be petersburgAssaults, got " + sd.id);
    if (Array.isArray(sd.phases)) throw new Error("Petersburg initial assaults is single-phase; a phases[] block violates the contract");
    if (!/June 15\D{0,20}1864/.test(JSON.stringify(sd))) throw new Error("runtime data lacks the June 15, 1864 date grain");
  }
  return { id: "petersburgAssaults", title: "Petersburg: The Initial Assaults", menuRank: 69, phases: 1 };
});

step("ROLES + OBJECTIVE", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "`attacker:\"US\"` / `defender:\"CS\"`",
    "the eastern approach into Petersburg — the city ground behind the Dimmock",
    "The objective anchor sits on the INNER ground, NOT on the outer works",
    "a breached outer line and a held city",
    "Beauregard's improvised defense is the sourced defensive invariant"
  ], "roles/objective contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).petersburgAssaults || {};
    if (sd.attacker !== "US" || sd.defender !== "CS") throw new Error("runtime roles must be US attacker / CS defender");
    if (sd.defaultFog !== false) throw new Error("runtime defaultFog must be false");
    if (!sd.objective) throw new Error("runtime objective missing");
  }
  return { attacker: "US (Smith, then Hancock/Burnside/Warren)", defender: "CS (Wise, then the race)", objective: "the eastern approach into Petersburg behind the Dimmock Line" };
});

step("TERRAIN + WORKS", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "The Dimmock Line",
    "10-mile, 55-battery fortified arc",
    "Capt. Charles Dimmock",
    "Battery 5",
    "The ravine",
    "Battery 9",
    "Baylor's Farm",
    "The Jordan Point Road",
    "The breach frontage",
    "1.5-mile-long",
    "two mile-long",
    "nearly three miles",
    "Harrison Creek",
    "The final line",
    "500-800 yards",
    "The Prince George Court House Road",
    "the Appomattox River",
    "No terrain element writes casualties, morale, rout, score, or winner",
    "The Reinforcement-Race Law",
    "the opening CS on-map garrison is HONESTLY TINY",
    "TIMED REINFORCEMENT on the sourced clock",
    "FORBIDDEN encodings",
    "garrison size, works geometry, arrival clocks, and mass"
  ], "terrain/works + reinforcement-race-law contract");
  mustNotInclude(text, ["a hesitation stat is acceptable", "a night penalty is acceptable"], "race law");
  if (existsSync(DATA)) {
    const runtimeText = JSON.stringify((JSON.parse(read(DATA)) || {}).petersburgAssaults || {});
    for (const term of ["Dimmock", "Battery 5", "Baylor", "Harrison Creek"]) {
      if (!runtimeText.includes(term)) throw new Error("runtime landmark tooth missing " + term);
    }
  }
  return { objective: "the city ground behind the breached outer works", inputLaw: "THE REINFORCEMENT-RACE LAW (tiny opening garrison + timed accessions + fog OFF)" };
});

step("OOB + STRENGTHS", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "never army-present or whole-campaign figures sold as committed totals",
    "THE PER-DAY LADDER",
    "2,200 ON THE DIMMOCK LINE",
    "~5,400 WHOLE FORCE",
    "US committed 25,000-62,000",
    "CS committed 14,000-30,000",
    "OPENING ON-MAP GARRISON STRICTLY 2,200-5,400",
    "10,000-18,000",
    "Verified identity; Inferred strength",
    "Every lower split ships coarse",
    "Captures are outputs, never inputs",
    "THE VI CORPS ABSENCE WALL",
    "THE PICKETT/BERMUDA HUNDRED SCOPE WALL",
    "NO source pins per-day committed axis totals"
  ], "OOB/strength contract");
  let sums = null;
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).petersburgAssaults || {};
    const rows = unitRows(sd);
    if (!rows.length) throw new Error("runtime OOB is empty");
    sums = { US: 0, CS: 0 };
    const opening = { US: 0, CS: 0 };
    for (const row of rows) {
      const id = String(row.unit.id || row.unit.name || "");
      if (!row.side || !id) throw new Error("Petersburg unit lacks side/id");
      sums[row.side] = (sums[row.side] || 0) + (+row.unit.men || 0);
      if (row.from === "oob") opening[row.side] = (opening[row.side] || 0) + (+row.unit.men || 0);
      if (!/Inferred strength/.test(String(row.unit.note || ""))) throw new Error("unit lacks an Inferred-strength disclosure: " + id);
      // The absence walls: VI Corps and Pickett may never be fielded.
      const cmd = String(row.unit.commander || "") + " " + String(row.unit.name || "");
      if (/Pickett|Horatio|Wright|VI Corps|Sixth Corps/i.test(cmd)) throw new Error("absence-wall violation (VI Corps/Pickett fielded): " + cmd.slice(0, 80));
    }
    for (const side of ["US", "CS"]) {
      if (sums[side] < ENVELOPES[side][0] || sums[side] > ENVELOPES[side][1]) {
        throw new Error(side + " committed total " + sums[side] + " outside the contract envelope " + JSON.stringify(ENVELOPES[side]));
      }
      if (opening[side] < OPENING[side][0] || opening[side] > OPENING[side][1]) {
        throw new Error(side + " OPENING on-map total " + opening[side] + " outside the race-law envelope " + JSON.stringify(OPENING[side]));
      }
    }
  }
  return { envelopes: ENVELOPES, opening: OPENING, runtimeSums: sums };
});

step("RANKS + COMMAND TRAPS", () => {
  const text = read(SPEC);
  // Section-scoped locks (the D383 hardening): the load-bearing rank locks must live inside
  // section 6's own body — a mention of a grade elsewhere can never mask a tamper.
  const s6 = section(text, "## 6. Battle-Date Ranks", "## 7.");
  const beauregardLock = "- **Gen. P. G. T. Beauregard — THE FULL-GENERAL ANCHOR, this battle's bind anchor:** commanding the initial defense of Petersburg as a full GENERAL, CSA — one of only seven officers appointed to that grade, his date of rank July 21, 1861, fifth in seniority.";
  const normS6 = s6.replace(/\s+/g, " ");
  if (normS6.indexOf(beauregardLock.replace(/\s+/g, " ")) < 0) throw new Error("exact Beauregard battle-date rank lock missing from section 6");
  mustInclude(s6, [
    "Lt. Gen. Ulysses S. Grant",
    "General-in-Chief (a ROLE, not a rank",
    "NEVER a full \"General\"",
    "Maj. Gen. George G. Meade",
    "Never the theater commander",
    "Maj. Gen. William F. \"Baldy\" Smith — THE RESTORED-COMMISSION TRAP",
    "EXPIRED March 4, 1863",
    "March 9, 1864",
    "the stale-grade error class",
    "Maj. Gen. Winfield S. Hancock",
    "THE SENIORITY-DEFERENCE FACT",
    "Hancock deferred to him because Smith knew the ground",
    "Maj. Gen. David B. Birney",
    "Maj. Gen. John Gibbon — THE REVERSE ANACHRONISM",
    "June 7, 1864 — BEFORE this battle",
    "Brig. Gen. Francis C. Barlow",
    "Maj. Gen. Ambrose E. Burnside",
    "Brig. Gen. James H. Ledlie — THE SUCCESSOR-CHAIN LOCK",
    "June 9, 1864",
    "succeeding Brig. Gen. Thomas G. Stevenson",
    "his Crater infamy belongs to a DIFFERENT lane",
    "Brig. Gen. Robert B. Potter",
    "Brig. Gen. Orlando B. Willcox — THE ANACHRONISM CATCH",
    "August 1, 1864 — AFTER this battle",
    "Never `Maj. Gen. Willcox` at the initial assaults",
    "Maj. Gen. Gouverneur K. Warren",
    "Griffin, Ayres, Crawford, and Cutler are ALL BRIGADIER GENERALS",
    "Brig. Gen. Edward W. Hinks",
    "composed entirely of United States Colored Troops",
    "Brig. Gens. William T. H. Brooks and John H. Martindale",
    "Brig. Gen. August Kautz",
    "THE VI CORPS ABSENCE WALL",
    "NOT in the June 15-18 assaults",
    "Gen. Robert E. Lee — THE LATE-ARRIVAL TRAP",
    "3:00 a.m. June 18",
    "11:00 a.m. June 18",
    "Customs House",
    "Never render Lee commanding the Petersburg defense on June 15-17",
    "Brig. Gen. Henry A. Wise",
    "2,200 on the line",
    "Maj. Gen. Robert F. Hoke",
    "Clingman, Johnson Hagood, James G. Martin, and Alfred H. Colquitt",
    "Maj. Gen. Bushrod R. Johnson",
    "Elliott's, Ransom's, and Gracie's",
    "James Dearing — THE UNCONFIRMED-COMMISSION TRAP",
    "NEVER approved by the Confederate Congress",
    "Maj. Gen. Joseph B. Kershaw — THE REVERSE OF THE WILDERNESS BIND",
    "June 2, 1864 — BEFORE this battle",
    "Maj. Gen. Charles W. Field",
    "ships `Inferred` — no card may state it as settled",
    "THE PICKETT/BERMUDA HUNDRED SCOPE WALL",
    "NEVER in the Petersburg assaults proper",
    "Promotion-paperwork dates are disclosure-only"
  ], "rank/trap wall (section 6)");
  if (existsSync(DATA)) {
    const runtimeText = JSON.stringify((JSON.parse(read(DATA)) || {}).petersburgAssaults || {});
    for (const rank of [
      "Gen. P. G. T. Beauregard", "Brig. Gen. Edward W. Hinks", "Brig. Gen. Henry A. Wise"
    ]) if (!runtimeText.includes(rank)) throw new Error("runtime rank tooth missing " + rank);
    for (const re of [
      /Lt\. Gen\. (?:P\.? ?G\.? ?T\.? )?Beauregard/, /Lieutenant General (?:P\.? ?G\.? ?T\.? )?Beauregard/,
      /Brig\. Gen\. (?:William F?\.?|Baldy)[^,]{0,12}Smith/, /Brigadier General (?:William F?\.?|Baldy)[^,]{0,12}Smith/,
      /Maj\. Gen\. (?:Orlando B?\.? )?Willcox/, /Major General (?:Orlando B?\.? )?Willcox/,
      /Brig\. Gen\. (?:Joseph B?\.? )?Kershaw/, /Brigadier General (?:Joseph B?\.? )?Kershaw/,
      /Brig\. Gen\. (?:John )?Gibbon/, /Brigadier General (?:John )?Gibbon/,
      /Maj\. Gen\. (?:James )?Dearing/, /Lt\. Gen\. (?:James )?Longstreet/,
      /General Grant\b(?! [a-z])/
    ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank rendering: " + re);
  }
  return {
    beauregard: "full General, CSA (July 21, 1861) — the bind anchor",
    smith: "Maj. Gen. (restored March 9, 1864 — the expired-commission trap)",
    willcox: "Brig. Gen. (brevet MG dated Aug 1, 1864 — after the battle)",
    kershaw: "Maj. Gen. (June 2, 1864 — the Wilderness lock reversed)",
    gibbon: "Maj. Gen. (June 7, 1864 — the Wilderness lock reversed)",
    dearing: "unconfirmed Brig. Gen. (disclosure required)",
    lee: "arrives 11 a.m. June 18 — never the June 15-17 defense commander"
  };
});

step("SOURCES + PROVENANCE", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  for (const anchor of REQUIRED_URL_ANCHORS) if (!urls.some(url => url.includes(anchor))) throw new Error("source register missing " + anchor);
  mustInclude(text, [
    "The single-scholar disclosure (the Howe/Chick roots)",
    "*Wasted Valor: The Battle of Petersburg, June 15-18, 1864*",
    "Sean Michael Chick",
    "two genuinely independent source FAMILIES",
    "Two-source rule",
    "One family = `Inferred`; a real conflict = `Disputed` with both values shown",
    "Citation-integrity corrections this pass",
    "the fetched-page rule",
    "\"six-18\" slug typo",
    "official-returns/CWSAC root",
    "page-cited Howe (1988) fetch"
  ], "source/provenance contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).petersburgAssaults || {};
    const cards = (((sd.teaching || {}).cards) || []);
    for (const card of cards) {
      if (sourceUrls(card.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(card.provenance || ""))) {
        throw new Error("teaching card lacks two register URLs or exact provenance: " + String(card.title || "").slice(0, 60));
      }
    }
  }
  return { registerUrls: urls.length, anchors: REQUIRED_URL_ANCHORS.length };
});

step("CITY + DIRECTION LAW", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "exactly eight shared-model deterministic seeds",
    "THE CITY GUARD — the defender ultimately holds",
    "at least **5/8** seeds the CS retains the Petersburg city-approach objective",
    "THE AGGREGATE CASUALTY-DIRECTION TOOTH",
    "total US losses EXCEED total CS losses",
    "DIRECTION only, never a magnitude, ratio, or per-side count",
    "THE 11,386 SCOPE COLLISION",
    "the attacker bled more and failed",
    "Stones-River inversion check",
    "The race textures are EMERGENT requirements, not teeth",
    "No forced winner",
    "the engine's existing result/DRAW grain applies",
    "any prisoner, capture, gun-loss, surrender, or battery-count tooth",
    "any per-day casualty tooth",
    "old value, new value, and both observed guard counts",
    "HALT-and-surface",
    "never a fudge, never a weakened tooth"
  ], "city-hold/direction law");
  mustInclude(text, [
    "the tiny opening garrison",
    "the timed accessions",
    "the ravine geometry",
    "the massed but staggered Union weight"
  ], "race recipe inputs");
  return { seeds: 8, guards: ["CS holds the city approach >=5/8", "aggregate casualty direction US>CS >=5/8"], casualtyDirection: "TOOTH (direction-only) — the attacker-bleeds-and-fails class" };
});

step("D74 NO-FUDGE WALL", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "D74 No-Fudge Acceptance Wall",
    "damageMult", "firepowerMult", "casualtyMult", "lossMult", "killMult",
    "moraleMult", "winner", "forceWin", "scoreMult",
    "ammoPenalty", "ammoMult", "supplyMult", "exhaustionMult", "fatigueMult",
    "surpriseBonus", "surpriseMult", "envelopmentBonus", "envelopmentMult",
    "panicMult", "collapseMult", "meleeMult", "handToHandBonus", "prisonerMult", "captureBonus",
    "hesitationMult", "cautionMult", "commandParalysis", "delayPenalty", "opportunityBonus",
    "raceBonus", "nightMult", "darknessPenalty", "garrisonBonus", "worksEmptyBonus",
    "assaultRefusal", "refusalMult", "usctBonus", "usctPenalty", "valorBonus", "greenTroopMult",
    "ANY USCT-specific combat modifier in either direction",
    "scripting the June 15 halt",
    "a mine, bombardment, or special-assault event",
    "any source branch that checks `petersburgAssaults` and writes combat output",
    "hardcoding ANY casualty magnitude anywhere"
  ], "D74 wall");
  const branches = tacticalBattleBranches();
  if (branches.length) throw new Error("Petersburg-specific tactical branch outside T1/T10: " + branches.join(", "));
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).petersburgAssaults || {};
    const forbidden = new Set([
      "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
      "killscale", "killmult", "casualtyscale", "casualtymult", "lossscale", "lossmult", "capturescale", "capturemult",
      "surrenderscale", "surrendermult", "routscale", "routmult", "moralescale", "moralemult", "combatscale",
      "battledamage", "battlefire", "powermult", "scorebonus", "scoremult", "winner", "winoverride",
      "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "genius", "geniusmult",
      "ammopenalty", "ammomult", "supplymult", "supplypenalty", "exhaustionmult", "fatiguemult", "starvationmult",
      "marchpenalty", "surprisebonus", "surprisemult", "envelopmentbonus", "envelopmentmult", "panicmult",
      "collapsemult", "meleemult", "handtohandbonus", "prisonermult", "capturebonus",
      "hesitationmult", "cautionmult", "commandparalysis", "delaypenalty", "opportunitybonus",
      "racebonus", "nightmult", "darknesspenalty", "garrisonbonus", "worksemptybonus",
      "assaultrefusal", "refusalmult", "usctbonus", "usctpenalty", "valorbonus", "greentroopmult"
    ]);
    const hits = [];
    walk(sd, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) hits.push(path.join(".")); });
    if (hits.length) throw new Error("runtime Petersburg data contains D74-forbidden keys: " + hits.join(", "));
  }
  return { battleSpecificBranches: 0, dataScan: existsSync(DATA) ? "green" : "deferred" };
});

step("TEACHING + DIGNITY", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "at least eight restrained teaching cards plus one codex entry",
    "Human cost is rendered with gravity and without glory framing",
    "The race for the works",
    "The bridge that made it possible",
    "THE USCT PROVING GROUND — accuracy as dignity",
    "Never before tested in battle",
    "378 killed and wounded",
    "fullest confidence in the fighting qualities",
    "the first major USCT combat validation in Virginia",
    "The night Petersburg stood open",
    "at the mercy of the Federal commander",
    "Beauregard's finest hours",
    "The defense of June 15-17 is Beauregard's, not Lee's",
    "June 18 — the price of the lost race",
    "632 of about 900",
    "the war's worst single-action regimental loss",
    "supremely disgusted",
    "the soldiers' learned judgment, not mockery of it",
    "The ledger of the four days",
    "a lesson in reading sources",
    "What the race decided",
    "What this scenario deliberately is not",
    "First Petersburg as context",
    "No massacre content is playable anywhere in this lane"
  ], "teaching/dignity contract");
  mustInclude(text, [
    "`theater:\"Eastern\"`",
    "`campaign:\"Richmond-Petersburg (Initial",
    "`result:\"Confederate victory\"`",
    "both framings"
  ], "codex axes");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).petersburgAssaults || {};
    const cards = (((sd.teaching || {}).cards) || []);
    const codex = (sd.teaching || {}).codex || {};
    if (cards.length < 8) throw new Error("runtime teaching requires at least eight cards, got " + cards.length);
    const cardText = JSON.stringify(cards);
    for (const term of ["race", "USCT", "Beauregard", "Maine"]) {
      if (!new RegExp(term, "i").test(cardText)) throw new Error("mandatory teaching thread missing: " + term);
    }
    if (sourceUrls(codex.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance || ""))) {
      throw new Error("runtime codex requires two register URLs and exact provenance");
    }
    const codexText = JSON.stringify(codex);
    if (!codexText.includes("Eastern") || !codexText.includes("Richmond-Petersburg") || !codexText.includes("Confederate victory")) {
      throw new Error("runtime codex lacks Eastern / Richmond-Petersburg / Confederate victory axes");
    }
  }
  return { cards: 10, framing: "the race, the missed opportunity, the USCT proving ground, the June 18 cost" };
});

step("FUTURE DIRECTION + INTEGRATION", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Future atomic integration contract",
    "tactical scenarios **23 -> 24**",
    "total schema files **53 -> 54**",
    "1434 + (unique Petersburg side-unit ids × 3)",
    "grep the OLD value `1434` across `tools/`",
    "THIRTEEN sites at D396 authoring",
    "THE TEN NAMED RESHAPE OBLIGATIONS",
    "`E / true / anv`",
    "coverage **23 -> 24**",
    "suite **128 -> 129**",
    "sweep comment **23 -> 24**",
    "R.petersburgAssaults = GAME_DATA[\"petersburg-assaults\"].petersburgAssaults",
    "fldScnBtn_petersburgAssaults",
    "`PHASE_COUNTS` gains NO entry",
    "tools/probe-petersburg-initial-assaults.mjs",
    "CS-holds-the-city ≥5/8",
    "aggregate casualty-direction US>CS ≥5/8",
    "All surfaces arrive in one green runtime commit"
  ], "future integration contract");

  const s = integrationSnapshot();
  if (!s.hasData) {
    return { state: "contracted", future: { scenarios: 24, schema: 54, armyRegister: "1434 + 3U", coverage: 24, suite: 129 } };
  }

  const registryHas = /R\.petersburgAssaults\s*=\s*GAME_DATA\[["']petersburg-assaults["']\]\.petersburgAssaults/.test(s.t1);
  const menuRankHas = /\bpetersburgAssaults\s*:\s*69\b/.test(s.t1);
  const rosterHas = s.rosterExpected.includes("petersburgAssaults");
  const builderHas = s.builderExpected.includes("petersburgAssaults");
  const rosterDomHas = /fldScnBtn_petersburgAssaults/.test(s.roster);
  const phaseCountHas = /\bpetersburgAssaults\s*:/.test(s.phaseCounts);
  const schemaHas = s.battleFiles.includes("petersburg-assaults.json");
  const flagBody = (s.flags.block.match(/\bpetersburgAssaults\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = s.explicitFlagIds.includes("petersburgAssaults")
    && /\btheater\s*:\s*['"]E['"]/.test(flagBody)
    && /\bbadges\s*:\s*true\b/.test(flagBody)
    && /\bcsFlag\s*:\s*['"]anv['"]/.test(flagBody);
  const vetHas = s.suiteRows.some(row => /petersburg/i.test(row[0]) && row[1] === "tools/probe-petersburg-initial-assaults.mjs");
  const generatedHas = GENERATED_TACTICAL_SEAMS.slice(0, 2).every(re => re.test(s.generatedRaw));
  if (!registryHas || !menuRankHas) throw new Error("runtime data exists without exact T1 registry/menu integration");
  if (!rosterHas || s.rosterExpected.length < 24 || !rosterDomHas) throw new Error("runtime data exists without complete 24-scenario roster integration");
  if (phaseCountHas) throw new Error("Petersburg initial assaults is single-phase and must NOT gain a PHASE_COUNTS entry");
  if (!builderHas || s.builderExpected.length < 24) throw new Error("runtime data exists without complete custom-builder historical baseline");
  if (!schemaHas || s.battleFiles.length < 24 || s.totalDataFiles < 54) throw new Error("runtime data exists without 24-battle / 54-file schema integration");
  if (!s.hasFocused) throw new Error("runtime data exists but tools/probe-petersburg-initial-assaults.mjs is missing");
  if (!flagMetaHas || s.explicitFlagIds.length < 24 || !s.flagTargets.some(n => n >= 24)) throw new Error("runtime flags lack Petersburg E/true/anv metadata or 24-scenario coverage");
  if (s.weatherCount < 24 || !s.intelTargets.some(n => n >= 24) || s.mediaCount < 24) throw new Error("runtime weather/Intel/media coverage is below 24");
  if (!vetHas || s.suiteRows.length < 129 || s.sweepCount < 24) throw new Error("runtime suite/sweep integration is incomplete");
  if (!generatedHas) throw new Error("generated HTML lacks the tactical Petersburg registry identifiers");
  if (s.tacticalBranches.length) throw new Error("runtime contains Petersburg-only tactical branches: " + s.tacticalBranches.join(", "));

  // THE TEN NAMED RESHAPE OBLIGATIONS (the D391/D393 insertion-lesson class): the three
  // downstream chronology probes must carry the rank-69 insertion in BOTH menu and DOM teeth,
  // the shipped wilderness/spotsylvania scope scans must no longer forbid the now-registered
  // petersburg while still forbidding the unbuilt lanes, and the five-forks whole-registry
  // count pin must move to 24.
  const kennesawText = read(KENNESAW_PROBE);
  const spotsyText = read(SPOTSY_PROBE);
  const wildText = read(WILD_PROBE);
  const fiveForksText = read(FIVEFORKS_PROBE);
  if (!/petersburgAssaults/.test(kennesawText)) throw new Error("reshape obligation unmet: probe-kennesaw adjacency teeth do not carry the petersburg insertion");
  if (!/petersburgAssaults/.test(spotsyText)) throw new Error("reshape obligation unmet: probe-spotsylvania chronology teeth do not carry the petersburg insertion");
  if (!/petersburgAssaults/.test(wildText)) throw new Error("reshape obligation unmet: probe-wilderness chronology teeth do not carry the petersburg insertion");
  for (const [name, probeText] of [["probe-spotsylvania", spotsyText], ["probe-wilderness", wildText]]) {
    if (/cold-harbor\|petersburg/i.test(probeText) || /petersburg\|crater/i.test(probeText)) {
      throw new Error("reshape obligation unmet: " + name + " SCOPE/forbiddenData regex still forbids the registered petersburg");
    }
    if (!/coldharbor|cold-harbor/i.test(probeText)) throw new Error(name + " must keep forbidding the unbuilt Cold Harbor/Crater lanes");
  }
  if (/Object\.keys\(reg\)\.length!==\s*23\b/.test(fiveForksText.replace(/\s+/g, ""))) {
    throw new Error("reshape obligation unmet: probe-five-forks whole-registry count pin still expects 23");
  }

  const sd = (JSON.parse(read(DATA)) || {}).petersburgAssaults || {};
  const rows = unitRows(sd);
  const unitKeys = new Set();
  for (const row of rows) unitKeys.add(row.side + ":" + String(row.unit.id || row.unit.name || ""));
  const expectedPin = 1434 + unitKeys.size * 3;
  const history = s.lootRaw.match(/D([0-9]+):[^\n]*?1434\s*->\s*([0-9]+)[^\n]*[Pp]etersburg/);
  const laterTransitions = Array.from(s.lootRaw.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => history && x.d > +history[1]).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const transition of laterTransitions) if (transition.from === documentedPin) documentedPin = transition.to;
  if (!history || +history[2] !== expectedPin || s.pin < expectedPin || s.pin !== documentedPin || s.pinUi[0] !== s.pin || s.pinUi[1] !== s.pin) {
    throw new Error("runtime Army Register must document 1434 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }

  const focused = read(FOCUSED);
  const seedBlock = (focused.match(/(?:const|var) SEEDS\s*=\s*\[([^\]]+)\]/) || [null, ""])[1];
  const seeds = Array.from(seedBlock.matchAll(/\b([0-9]+)\b/g)).map(m => +m[1]);
  if (seeds.length !== 8 || new Set(seeds).size !== 8) throw new Error("focused Petersburg probe requires exactly eight unique seeds");
  mustInclude(focused, [
    "historical direction", "pageerrors", "city", "holds",
    "CASUALTY-DIRECTION", "US>CS"
  ], "focused Petersburg probe");
  if (!/>=\s*5/.test(focused) || !/process\.exit\(1\)/.test(focused)) {
    throw new Error("focused Petersburg probe lacks the 5/8 guards or fail-closed exit");
  }

  return {
    state: "implementation-present",
    scenarios: s.rosterExpected.length,
    schema: s.totalDataFiles,
    units: unitKeys.size,
    armyRegister: s.pin,
    coverage: { flags: s.explicitFlagIds.length, weather: s.weatherCount, media: s.mediaCount },
    suite: s.suiteRows.length
  };
});

step("LANE + BASELINES", () => {
  const text = read(COORD);
  const start = text.indexOf("### LANE-003");
  if (start < 0) throw new Error("LANE-003 missing from COORDINATION.md");
  const next = text.indexOf("\n### LANE-", start + 8);
  const lane = text.slice(start, next < 0 ? text.length : next);
  // Anchors are durable history/contract facts and the owner check binds the ROLE ROSTER
  // (any recognized TOP-LOOP tool), never today's lock holder (the D381 relay lesson).
  mustInclude(lane, [
    "battle-ladder",
    "Spotsylvania",
    "Wilderness",
    "Petersburg",
    "D394",
    "no simultaneous edits by any provider"
  ], "LANE-003 durable ladder history");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  const owner = (lane.match(/\*\*Owning tool:\*\*\s*([^\n]+)/) || [null, ""])[1];
  if (!["DRIVE", "VERIFY", "CONTRACT", "SHIPPED"].includes(state)) throw new Error("LANE-003 does not carry a driveable state: " + state);
  if ((state === "DRIVE" || state === "VERIFY") && !/(ChatGPT\/Codex|Claude (?:Code|Fable))/.test(owner)) throw new Error("active lane owner is not a recognized TOP-LOOP tool: " + owner);
  if (state === "CONTRACT" && !/^none\b/.test(owner)) throw new Error("released CONTRACT lane must be unowned: " + owner);

  const s = integrationSnapshot();
  if (s.hasData) {
    return { state, owner: owner.slice(0, 80), baselines: "implementation-present — delegated to FUTURE DIRECTION + INTEGRATION" };
  }
  const leaks = [];
  if (s.hasFocused) leaks.push("tools/probe-petersburg-initial-assaults.mjs");
  if (s.runtimeSeams.length) leaks.push(...s.runtimeSeams.map(name => "tactical identifier in " + name));
  if (s.tacticalBranches.length) leaks.push("battle-specific tactical branches: " + s.tacticalBranches.join(","));
  if (leaks.length) throw new Error("D396 planning branch contains runtime leakage: " + leaks.join("; "));
  if (s.rosterExpected.length !== PIN.scenarios || s.rosterExpected.includes("petersburgAssaults")) throw new Error("planned roster must remain exact 23 without petersburgAssaults");
  if (s.builderExpected.length !== PIN.scenarios || s.builderExpected.includes("petersburgAssaults")) throw new Error("planned builder must remain exact 23 without petersburgAssaults");
  if (s.battleFiles.length !== PIN.battleFiles || s.battleFiles.includes("petersburg-assaults.json") || s.totalDataFiles !== PIN.totalDataFiles) throw new Error("planned schema must remain 23 battles / 53 total files");
  if (s.explicitFlagIds.length !== PIN.flags || s.explicitFlagIds.includes("petersburgAssaults") || !s.flagTargets.includes(PIN.flags)) throw new Error("planned flag metadata/coverage must remain exact 23");
  if (s.weatherCount !== PIN.weather) throw new Error("planned weather hints must remain exact 23, got " + s.weatherCount);
  if (!s.intelTargets.includes(PIN.intel)) throw new Error("planned Intel coverage must remain exact 23");
  if (s.mediaCount !== PIN.media) throw new Error("planned media opening-scene coverage must remain exact 23, got " + s.mediaCount);
  if (s.suiteRows.length !== PIN.suite || s.suiteRows.some(row => row[1] === "tools/probe-petersburg-initial-assaults.mjs") || s.sweepCount !== PIN.sweep) throw new Error("planned suite/sweep must remain 128 / 23");
  if (s.pin !== PIN.armyRegister || s.pinUi[0] !== PIN.armyRegister || s.pinUi[1] !== PIN.armyRegister) throw new Error("planned Army Register/UI pin must remain exact 1434");
  if (s.generatedMd5 !== PIN.generatedMd5) throw new Error("generated HTML md5 changed: " + s.generatedMd5);
  if (s.baseMd5 !== PIN.baseMd5) throw new Error("frozen base md5 changed: " + s.baseMd5);
  if (!/realHints/.test(s.weatherProbe)) throw new Error("weather probe no longer derives real hints");
  return {
    state, owner: owner.slice(0, 80),
    baselines: {
      scenarios: PIN.scenarios,
      schema: { battleFiles: PIN.battleFiles, total: PIN.totalDataFiles },
      armyRegister: PIN.armyRegister,
      coverage: { flags: PIN.flags, weather: PIN.weather, intel: PIN.intel, media: PIN.media },
      suite: PIN.suite, sweep: PIN.sweep,
      generatedMd5: s.generatedMd5, baseMd5: s.baseMd5
    }
  };
});

writeFileSync(join(OUT, "probe-petersburg-initial-assaults-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(row => row.ok).length;
const fail = result.steps.length - ok;
console.log("probe-petersburg-initial-assaults-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.err);
  process.exit(1);
}
console.log("ALL OK");
