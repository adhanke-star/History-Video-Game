#!/usr/bin/env node
// D392 planning/spec gate for LANE-003 the Wilderness (1864-65 attrition lane, D382 3.5 order).
// Filesystem-first until data/wilderness.json exists. Runtime teeth ship with the runtime slice.
// The spec is hard-wrapped, so text anchors match on whitespace-normalized text (the D385 idiom).
// The pre-existing frozen Classic `wilderness` row, the strategic rail route, the strategic-probe
// fixtures, and the chancellorsville terrain-teaching text are separate layers (the
// shiloh/franklin precedent) — the runtime-seam scan targets TACTICAL identifiers only.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "wilderness-battle-build-spec.md");
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
const DATA = join(ROOT, "data", "wilderness.json");
const FOCUSED = join(ROOT, "tools", "probe-wilderness.mjs");
const KENNESAW_PROBE = join(ROOT, "tools", "probe-kennesaw.mjs");
const SPOTSY_PROBE = join(ROOT, "tools", "probe-spotsylvania.mjs");

// ---- research-adjudicated constants (D392 gather -> default-refute -> critic -> Fable adjudication) ----
const REQUIRED_URL_ANCHORS = [
  "battlefields.org/learn/civil-war/battles/wilderness",
  "en.wikipedia.org/wiki/Battle_of_the_Wilderness",
  "encyclopediavirginia.org/entries/wilderness-battle-of-the",
  "nps.gov/articles/000/grant-at-the-wilderness.htm",
  "npsfrsp.wordpress.com/2014/05/03/capturing-the-wildernesss-signature-horror-fire",
  "npsfrsp.wordpress.com/2012/02/13/a-rare-photograph-of-uscts-on-the-eve-of-the-overland-campaign",
  "civilwarintheeast.com",
  "en.wikipedia.org/wiki/Battle_of_the_Wilderness_order_of_battle:_Union",
  "archives.gov/legislative/features/grant",
  "emergingcivilwar.com/2019/05/03/ecw-weekender-where-grant-turned-south",
  "historynet.com/this-place-is-called-the-wilderness"
];
// Future committed-total envelopes (engine abstractions on the junction axis;
// every lower split ships Inferred). [min, max] per side, single phase.
const ENVELOPES = { US: [15000, 30000], CS: [12000, 26000] };
// Planning-mode baseline pins (the D391 playable-Spotsylvania boundary).
const PIN = {
  scenarios: 22, battleFiles: 22, totalDataFiles: 52, armyRegister: 1380,
  flags: 22, weather: 22, intel: 22, media: 22, suite: 127, sweep: 22,
  generatedMd5: "91b9979144731ae3299af4ebaca4628a",
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

// Battle-specific tactical branches outside the shared registry/metadata seams are forbidden (D74).
// Comments are stripped first: a documentation comment is not a combat branch. Today NO tactical
// module carries any wilderness text (verified at D392 authoring); only CODE references count.
function tacticalBattleBranches() {
  const hits = [];
  for (const file of readdirSync(join(ROOT, "src", "tactical")).filter(f => f.endsWith(".js"))) {
    if (file === "T1-bull-run.js" || file === "T10-flags.js") continue;
    const text = stripJsComments(read(join(ROOT, "src", "tactical", file)));
    if (/wilderness/i.test(text)) hits.push(file);
  }
  return hits;
}

// Tactical-only seam scan for the generated deliverable: the frozen Classic roster row
// ({id:"wilderness"...}), the embedded strategic rail route, and Classic/codex/teaching prose
// are PRE-EXISTING separate layers, so a plain substring scan would false-positive; these
// regexes match only the tactical integration surface.
const GENERATED_TACTICAL_SEAMS = [
  /R\.wilderness\s*=/,
  /GAME_DATA\.wilderness\b/,
  /\bwilderness\s*:\s*67\b/,
  /fldScnBtn_wilderness/,
  /probe-wilderness/,
  /["']wilderness\.json["']/
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
  // Plain tactical-identifier scan over integration files that today carry NO wilderness text
  // (verified at D392 authoring: t1/roster/builder/schema/flags/intel/vet/loot are all clean).
  const scanned = { t1, roster, builder, schema, flagsData, flagsProbe, intel, vet, lootRaw };
  const runtimeSeams = [];
  for (const [name, text] of Object.entries(scanned)) {
    if (/wilderness/i.test(text)) runtimeSeams.push(name);
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
    "Wilderness Battle-Build Spec (D392)",
    "This slice adds no Wilderness runtime data",
    "D392 stops before `data/wilderness.json`",
    "Cold Harbor, Petersburg, and the Crater remain outside this scenario",
    "D392 Completion Criteria"
  ], "spec status/boundary");
  const packet = read(PACKET);
  mustInclude(packet, [
    "Verdict:** READY_FOR_SPEC",
    "D392 Spec-Time Addendum",
    "THE JUNCTION INVARIANT",
    "a TOOTH exists, unlike Spotsylvania"
  ], "committed packet + D392 addendum");
  return { specBytes: text.length, packetAddendum: "present" };
});

step("SHAPE + ID + DATE", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "`wilderness` in `data/wilderness.json`",
    "**Player-facing title:** `The Wilderness`",
    "**May 5-7, 1864**, a standalone SINGLE PHASE",
    "no `phases[]` block, no T8 routing, no new engine capability",
    "`wilderness:67`, between `chattanooga:65` and `spotsylvania:68`",
    "No existing rank moves",
    "top-level `defaultFog:false`",
    "THE AXIS-SCOPE LAW",
    "ORANGE PLANK ROAD AXIS",
    "TAUGHT in cards, never fielded"
  ], "shape/id/date contract");
  // Classic/rail collision law: the pre-existing separate layers are pinned, not created.
  const base = read(BASE);
  const rows = Array.from(base.matchAll(/\{id:"wilderness", name:"The Wilderness"/g)).length;
  if (rows !== 1) throw new Error("expected exactly one frozen Classic wilderness row, got " + rows);
  mustInclude(base, [
    "{id:\"wilderness\", name:\"The Wilderness\", year:1864, th:\"E\", atk:\"US\", us:102000, cs:61000",
    "cmdUS:\"Grant\", cmdCS:\"Lee\""
  ], "frozen Classic row");
  const rail = JSON.parse(read(RAIL));
  const route = (rail.routes || {}).wilderness;
  if (!route || route.provenance !== "Inferred" || !/Orange and Alexandria corridor/.test(String(route.label || ""))) {
    throw new Error("the pre-existing strategic wilderness rail route must remain (Inferred, Orange and Alexandria corridor label)");
  }
  mustInclude(text, [
    "Frozen Classic And Rail-Route Collision Law",
    "the shiloh/franklin convention",
    "must not edit, rename, or delete it",
    "byte-for-byte",
    "never cited as a source",
    "never a source for the tactical roles"
  ], "collision contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).wilderness || {};
    if (sd.id !== "wilderness") throw new Error("runtime id must be wilderness, got " + sd.id);
    if (Array.isArray(sd.phases)) throw new Error("the Wilderness is single-phase; a phases[] block violates the contract");
    if (!/May 5\D{0,20}1864/.test(JSON.stringify(sd))) throw new Error("runtime data lacks the May 5, 1864 date grain");
  }
  return { id: "wilderness", title: "The Wilderness", menuRank: 67, phases: 1 };
});

step("ROLES + OBJECTIVE", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "`attacker:\"CS\"` / `defender:\"US\"`",
    "Hill's May 5 objective up the Plank Road was the junction itself",
    "Brock Road / Orange Plank Road junction",
    "the Union army's road south",
    "The Confederates never captured it",
    "briefly planted flags on the works",
    "retaken within about an hour",
    "deliberate, logged deviation from the packet's §2 CAMPAIGN phase-1 recipe",
    "the standalone models the sourced defensive invariant"
  ], "roles/objective contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).wilderness || {};
    if (sd.attacker !== "CS" || sd.defender !== "US") throw new Error("runtime roles must be CS attacker / US defender");
    if (sd.defaultFog !== false) throw new Error("runtime defaultFog must be false");
    if (!sd.objective) throw new Error("runtime objective missing");
  }
  return { attacker: "CS (Hill, then Longstreet)", defender: "US (Getty, then Hancock)", objective: "the Brock Road / Orange Plank Road junction" };
});

step("TERRAIN + WORKS", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "The Brock Road / Orange Plank Road junction",
    "The Brock Road works",
    "log breastworks",
    "The Orange Plank Road",
    "The Widow Tapp field",
    "The unfinished railroad grade",
    "The Chewning farm plateau",
    "Wilderness Tavern",
    "The dense second-growth thickets",
    "seventy square miles of tangled undergrowth",
    "Saunders Field",
    "TEACHING landmark only",
    "No terrain element writes casualties, morale, rout, score, or winner",
    "The Thicket Law",
    "dense-woods universal COVER terrain blankets the map",
    "honestly LOW deployed-gun counts",
    "FORBIDDEN encodings",
    "cover geometry, low gun counts, timing, and mass"
  ], "terrain/works + thicket-law contract");
  mustNotInclude(text, ["fog buff is acceptable", "visibility multiplier is acceptable"], "thicket law");
  if (existsSync(DATA)) {
    const runtimeText = JSON.stringify((JSON.parse(read(DATA)) || {}).wilderness || {});
    for (const term of ["Brock Road", "Orange Plank Road", "Widow Tapp", "railroad grade"]) {
      if (!runtimeText.includes(term)) throw new Error("runtime landmark tooth missing " + term);
    }
  }
  return { objective: "the junction and its Brock Road works line", inputLaw: "THE THICKET LAW (cover + low guns + fog OFF)" };
});

step("OOB + STRENGTHS", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "never army-present or whole-battle figures sold as committed totals",
    "ABT's 101,895 is labeled \"engaged\"",
    "shipped `Disputed` as a cluster, never one number",
    "No source pins committed axis totals or division-engaged strengths",
    "US committed 15,000-30,000",
    "CS committed 12,000-26,000",
    "Getty's opening stand small",
    "Heth and Wilcox",
    "Kershaw and Field",
    "Verified identity; Inferred strength",
    "veteran SUBSET",
    "Every lower split ships coarse",
    "Captures are outputs, never inputs",
    "Turnpike-axis formations",
    "teaching content only under THE AXIS-SCOPE LAW"
  ], "OOB/strength contract");
  let sums = null;
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).wilderness || {};
    const rows = unitRows(sd);
    if (!rows.length) throw new Error("runtime OOB is empty");
    sums = { US: 0, CS: 0 };
    for (const row of rows) {
      const id = String(row.unit.id || row.unit.name || "");
      if (!row.side || !id) throw new Error("Wilderness unit lacks side/id");
      sums[row.side] = (sums[row.side] || 0) + (+row.unit.men || 0);
      if (!/Inferred strength/.test(String(row.unit.note || ""))) throw new Error("unit lacks an Inferred-strength disclosure: " + id);
      // THE AXIS-SCOPE LAW: no Turnpike-axis formation may be fielded.
      const cmd = String(row.unit.commander || "") + " " + String(row.unit.name || "");
      if (/Ewell|Sedgwick|Warren|Saunders/i.test(cmd)) throw new Error("axis-scope violation (Turnpike formation fielded): " + cmd.slice(0, 80));
    }
    for (const side of ["US", "CS"]) {
      if (sums[side] < ENVELOPES[side][0] || sums[side] > ENVELOPES[side][1]) {
        throw new Error(side + " committed total " + sums[side] + " outside the contract envelope " + JSON.stringify(ENVELOPES[side]));
      }
    }
  }
  return { envelopes: ENVELOPES, runtimeSums: sums };
});

step("RANKS + COMMAND TRAPS", () => {
  const text = read(SPEC);
  // Section-scoped locks (the D383 hardening): the load-bearing rank locks must live inside
  // section 6's own body — a mention of a grade elsewhere can never mask a tamper.
  const s6 = section(text, "## 6. Battle-Date Ranks", "## 7.");
  const kershawLock = "- **Brig. Gen. Joseph B. Kershaw — THE SAME-CLASS TRAP, this battle's bind anchor:** commanding McLaws's old division of the First Corps as a BRIGADIER GENERAL";
  const normS6 = s6.replace(/\s+/g, " ");
  if (normS6.indexOf(kershawLock.replace(/\s+/g, " ")) < 0) throw new Error("exact Kershaw battle-date rank lock missing from section 6");
  mustInclude(s6, [
    "Lt. Gen. Ulysses S. Grant",
    "General-in-Chief (a ROLE, not a rank",
    "NEVER a full \"General\"",
    "Maj. Gen. George G. Meade",
    "Never the theater commander",
    "Maj. Gen. Winfield S. Hancock",
    "Maj. Gen. John Sedgwick — THE REVERSE DEAD-OFFICER GUARD",
    "ALIVE and commanding VI Corps throughout this battle",
    "killed May 9, 1864 at Spotsylvania, three days AFTER it",
    "no card may date his death inside May 5-7",
    "Maj. Gen. Ambrose E. Burnside",
    "INDEPENDENT command reporting directly to Grant",
    "ships `Disputed` (May 24",
    "Brig. Gen. Thomas G. Stevenson",
    "Crittenden is his SUCCESSOR",
    "Brig. Gen. George W. Getty",
    "WOUNDED May 6",
    "Brig. Gen. John Gibbon — THE ANACHRONISM CATCH",
    "June 7, 1864 — AFTER this battle",
    "Never `Maj. Gen. Gibbon` at the Wilderness",
    "Brig. Gen. James S. Wadsworth — MORTALLY WOUNDED May 6",
    "died May 8 in Confederate hands",
    "Brig. Gen. Alexander Hays — KILLED May 5",
    "Brig. Gen. Horatio G. Wright — THE FORWARD-REFERENCE TRAP",
    "VI Corps command comes only with Sedgwick's death on May 9",
    "Brig. Gens. Truman Seymour and Alexander Shaler — CAPTURED May 6 evening",
    "Col. Samuel S. Carroll",
    "Gen. Robert E. Lee",
    "Lt. Gen. Richard S. Ewell",
    "Lt. Gen. Ambrose Powell Hill — THE REVERSE ILLNESS TRAP",
    "PRESENT and commanding the Third Corps through May 5-6",
    "Never render Early commanding the Third Corps at the Wilderness",
    "Lt. Gen. James Longstreet — PRESENT, THEN WOUNDED",
    "wounded by his own troops about noon",
    "Press the enemy",
    "major-general date of rank is **June 2, 1864 — AFTER this battle**",
    "Never `Maj. Gen. Kershaw` at the Wilderness",
    "Maj. Gen. Charles W. Field",
    "Brig. Gen. John B. Gordon — THE OTHER-AXIS TRAP",
    "his division command dates May 8 and his major-generalcy May 14",
    "Brig. Gen. Micah Jenkins — KILLED May 6",
    "Brig. Gen. William Mahone",
    "never a general officer here",
    "Brig. Gen. John M. Jones KILLED May 5",
    "Brig. Gen. Leroy Stafford MORTALLY WOUNDED May 5",
    "Promotion-paperwork dates are disclosure-only"
  ], "rank/trap wall (section 6)");
  if (existsSync(DATA)) {
    const runtimeText = JSON.stringify((JSON.parse(read(DATA)) || {}).wilderness || {});
    for (const rank of [
      "Maj. Gen. Winfield S. Hancock", "Brig. Gen. George W. Getty",
      "Brig. Gen. Joseph B. Kershaw", "Maj. Gen. Charles W. Field"
    ]) if (!runtimeText.includes(rank)) throw new Error("runtime rank tooth missing " + rank);
    for (const re of [
      /Maj\. Gen\. (?:Joseph B?\.? )?Kershaw/, /Major General (?:Joseph B?\.? )?Kershaw/,
      /Maj\. Gen\. (?:John )?Gibbon/, /Major General (?:John )?Gibbon/,
      /Maj\. Gen\. (?:John B?\.? )?Gordon/, /Major General (?:John B?\.? )?Gordon/,
      /Maj\. Gen\. (?:Horatio G?\.? )?Wright/, /Lt\. Gen\. (?:Richard H?\.? )?Anderson/,
      /General Grant\b(?! [a-z])/
    ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank rendering: " + re);
  }
  return {
    kershaw: "Brig. Gen. (MG date of rank June 2, 1864 — after the battle)",
    gibbon: "Brig. Gen. (MG June 7 — after the battle)",
    gordon: "Brig. Gen., brigade command, other axis (division May 8; MG May 14)",
    hill: "Lt. Gen., PRESENT and commanding Third Corps (illness ~May 8)",
    sedgwick: "ALIVE throughout — killed May 9 at Spotsylvania"
  };
});

step("SOURCES + PROVENANCE", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  for (const anchor of REQUIRED_URL_ANCHORS) if (!urls.some(url => url.includes(anchor))) throw new Error("source register missing " + anchor);
  mustInclude(text, [
    "The single-scholar disclosure (the Rhea root, again)",
    "*The Battle of the Wilderness May 5-6, 1864*",
    "two genuinely independent source FAMILIES",
    "Two-source rule",
    "One family = `Inferred`; a real conflict = `Disputed` with both values shown",
    "Citation-integrity corrections this pass",
    "NOT on the fetched page",
    "is dropped",
    "re-cited to Wikipedia + NPS",
    "the packet-era `/entries/battle-of-the-wilderness/` slug 404s",
    "page-cited Rhea (1994) fetch",
    "official-returns/CWSAC compilation"
  ], "source/provenance contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).wilderness || {};
    const cards = (((sd.teaching || {}).cards) || []);
    for (const card of cards) {
      if (sourceUrls(card.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(card.provenance || ""))) {
        throw new Error("teaching card lacks two register URLs or exact provenance: " + String(card.title || "").slice(0, 60));
      }
    }
  }
  return { registerUrls: urls.length, anchors: REQUIRED_URL_ANCHORS.length };
});

step("JUNCTION + DIRECTION LAW", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "exactly eight shared-model deterministic seeds",
    "THE JUNCTION GUARD — the defender ultimately holds",
    "at least **5/8** seeds the US retains the Brock Road / Orange Plank Road junction",
    "THE AGGREGATE CASUALTY-DIRECTION TOOTH",
    "total US losses EXCEED total CS losses",
    "DIRECTION only, never a magnitude, ratio, or per-side count",
    "the anti-winner-bleeds-less class",
    "Disputed ~8,000-13,000",
    "The near-run reversals are EMERGENT requirements, not teeth",
    "No forced winner",
    "the engine's existing result/DRAW grain applies",
    "any prisoner, capture, gun-loss, surrender, or rout tooth",
    "old value, new value, and both observed guard counts",
    "HALT-and-surface",
    "never a fudge, never a weakened tooth"
  ], "junction-hold/direction law");
  mustInclude(text, [
    "the small opening stand",
    "the massed II Corps arrivals",
    "the timed First Corps relief",
    "the flank grouping's entry vector"
  ], "bistable recipe inputs");
  return { seeds: 8, guards: ["US holds the junction >=5/8", "aggregate casualty direction US>CS >=5/8"], casualtyDirection: "TOOTH (direction-only) — the honest split, unlike Spotsylvania" };
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
    "woodsMult", "blindnessMult", "visibilityPenalty", "smokeMult", "brushFireMult", "fireDamage",
    "flankBonus", "flankMult", "rollUpMult", "friendlyFireEvent", "confusionMult",
    "gamifying the brush fires",
    "scripting Longstreet's friendly-fire wounding",
    "any source branch that checks `wilderness` and writes combat output",
    "hardcoding ANY casualty magnitude anywhere"
  ], "D74 wall");
  const branches = tacticalBattleBranches();
  if (branches.length) throw new Error("Wilderness-specific tactical branch outside T1/T10: " + branches.join(", "));
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).wilderness || {};
    const forbidden = new Set([
      "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
      "killscale", "killmult", "casualtyscale", "casualtymult", "lossscale", "lossmult", "capturescale", "capturemult",
      "surrenderscale", "surrendermult", "routscale", "routmult", "moralescale", "moralemult", "combatscale",
      "battledamage", "battlefire", "powermult", "scorebonus", "scoremult", "winner", "winoverride",
      "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "genius", "geniusmult",
      "ammopenalty", "ammomult", "supplymult", "supplypenalty", "exhaustionmult", "fatiguemult", "starvationmult",
      "marchpenalty", "surprisebonus", "surprisemult", "envelopmentbonus", "envelopmentmult", "panicmult",
      "collapsemult", "meleemult", "handtohandbonus", "prisonermult", "capturebonus",
      "woodsmult", "blindnessmult", "visibilitypenalty", "smokemult", "brushfiremult", "firedamage",
      "flankbonus", "flankmult", "rollupmult", "friendlyfireevent", "confusionmult"
    ]);
    const hits = [];
    walk(sd, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) hits.push(path.join(".")); });
    if (hits.length) throw new Error("runtime Wilderness data contains D74-forbidden keys: " + hits.join(", "));
  }
  return { battleSpecificBranches: 0, dataScan: existsSync(DATA) ? "green" : "deferred" };
});

step("TEACHING + DIGNITY", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "at least eight restrained teaching cards plus one codex entry",
    "Human cost is rendered with gravity and without glory framing",
    "The thickets fought both armies",
    "THE BURNING-WOODS DIGNITY LAW",
    "about 200 wounded men burned or suffocated",
    "never a mechanic, a spread simulation, a spectacle, or a scoring lever",
    "Getty's race for the crossroads",
    "The dawn assault and the Texans",
    "memoir-root disclosure",
    "The flank attacks and the friendly fire",
    "like a wet blanket",
    "Grant does not retreat",
    "the spontaneous cheering",
    "tent-breakdown story ships `Disputed`",
    "The ledger of the two days",
    "Grant-the-Butcher is rebutted with proportions, not erasure",
    "The bones of Chancellorsville",
    "accuracy as dignity",
    "no directed USCT combat occurred here",
    "What this scenario deliberately is not",
    "No massacre content is playable anywhere in this lane"
  ], "teaching/dignity contract");
  mustInclude(text, [
    "`theater:\"Eastern\"`",
    "`campaign:\"Overland Campaign\"`",
    "`result:\"Inconclusive\"`",
    "both framings"
  ], "codex axes");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).wilderness || {};
    const cards = (((sd.teaching || {}).cards) || []);
    const codex = (sd.teaching || {}).codex || {};
    if (cards.length < 8) throw new Error("runtime teaching requires at least eight cards, got " + cards.length);
    const cardText = JSON.stringify(cards);
    for (const term of ["thicket", "fire", "junction", "cheer"]) {
      if (!new RegExp(term, "i").test(cardText)) throw new Error("mandatory teaching thread missing: " + term);
    }
    if (sourceUrls(codex.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance || ""))) {
      throw new Error("runtime codex requires two register URLs and exact provenance");
    }
    const codexText = JSON.stringify(codex);
    if (!codexText.includes("Eastern") || !codexText.includes("Overland Campaign") || !codexText.includes("Inconclusive")) {
      throw new Error("runtime codex lacks Eastern / Overland Campaign / Inconclusive axes");
    }
  }
  return { cards: 10, framing: "cost without glory; the fires are teaching, never a mechanic" };
});

step("FUTURE DIRECTION + INTEGRATION", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Future atomic integration contract",
    "tactical scenarios **22 -> 23**",
    "total schema files **52 -> 53**",
    "1380 + (unique Wilderness side-unit ids × 3)",
    "grep the OLD value `1380` across `tools/`",
    "THE SIX NAMED RESHAPE OBLIGATIONS",
    "`E / true / anv`",
    "coverage **22 -> 23**",
    "suite **127 -> 128**",
    "sweep comment **22 -> 23**",
    "R.wilderness = GAME_DATA.wilderness.wilderness",
    "fldScnBtn_wilderness",
    "`PHASE_COUNTS` gains NO entry",
    "tools/probe-wilderness.mjs",
    "US-holds-the- junction ≥5/8",
    "aggregate casualty-direction US>CS ≥5/8",
    "All surfaces arrive in one green runtime commit"
  ], "future integration contract");

  const s = integrationSnapshot();
  if (!s.hasData) {
    return { state: "contracted", future: { scenarios: 23, schema: 53, armyRegister: "1380 + 3U", coverage: 23, suite: 128 } };
  }

  const registryHas = /R\.wilderness\s*=\s*GAME_DATA\.wilderness\.wilderness/.test(s.t1);
  const menuRankHas = /\bwilderness\s*:\s*67\b/.test(s.t1);
  const rosterHas = s.rosterExpected.includes("wilderness");
  const builderHas = s.builderExpected.includes("wilderness");
  const rosterDomHas = /fldScnBtn_wilderness/.test(s.roster);
  const phaseCountHas = /\bwilderness\s*:/.test(s.phaseCounts);
  const schemaHas = s.battleFiles.includes("wilderness.json");
  const flagBody = (s.flags.block.match(/\bwilderness\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = s.explicitFlagIds.includes("wilderness")
    && /\btheater\s*:\s*['"]E['"]/.test(flagBody)
    && /\bbadges\s*:\s*true\b/.test(flagBody)
    && /\bcsFlag\s*:\s*['"]anv['"]/.test(flagBody);
  const vetHas = s.suiteRows.some(row => /wilderness/i.test(row[0]) && row[1] === "tools/probe-wilderness.mjs");
  const generatedHas = GENERATED_TACTICAL_SEAMS.slice(0, 2).every(re => re.test(s.generatedRaw));
  if (!registryHas || !menuRankHas) throw new Error("runtime data exists without exact T1 registry/menu integration");
  if (!rosterHas || s.rosterExpected.length < 23 || !rosterDomHas) throw new Error("runtime data exists without complete 23-scenario roster integration");
  if (phaseCountHas) throw new Error("the Wilderness is single-phase and must NOT gain a PHASE_COUNTS entry");
  if (!builderHas || s.builderExpected.length < 23) throw new Error("runtime data exists without complete custom-builder historical baseline");
  if (!schemaHas || s.battleFiles.length < 23 || s.totalDataFiles < 53) throw new Error("runtime data exists without 23-battle / 53-file schema integration");
  if (!s.hasFocused) throw new Error("runtime data exists but tools/probe-wilderness.mjs is missing");
  if (!flagMetaHas || s.explicitFlagIds.length < 23 || !s.flagTargets.some(n => n >= 23)) throw new Error("runtime flags lack Wilderness E/true/anv metadata or 23-scenario coverage");
  if (s.weatherCount < 23 || !s.intelTargets.some(n => n >= 23) || s.mediaCount < 23) throw new Error("runtime weather/Intel/media coverage is below 23");
  if (!vetHas || s.suiteRows.length < 128 || s.sweepCount < 23) throw new Error("runtime suite/sweep integration is incomplete");
  if (!generatedHas) throw new Error("generated HTML lacks the tactical Wilderness registry identifiers");
  if (s.tacticalBranches.length) throw new Error("runtime contains Wilderness-only tactical branches: " + s.tacticalBranches.join(", "));

  // THE SIX NAMED RESHAPE OBLIGATIONS (the D391 insertion-lesson class): downstream teeth must
  // carry the true four-battle chronology, and the shipped Spotsylvania scope scans must no
  // longer forbid the now-registered wilderness while still forbidding the unbuilt lanes.
  const kennesawText = read(KENNESAW_PROBE);
  const spotsyText = read(SPOTSY_PROBE);
  if (!/wilderness/i.test(kennesawText)) throw new Error("reshape obligation unmet: probe-kennesaw adjacency teeth do not carry the wilderness insertion");
  if (!/wilderness/i.test(spotsyText)) throw new Error("reshape obligation unmet: probe-spotsylvania adjacency teeth do not carry the wilderness insertion");
  if (/wilderness\|cold/i.test(spotsyText)) throw new Error("reshape obligation unmet: probe-spotsylvania SCOPE/forbiddenData regex still forbids the registered wilderness");
  if (!/coldharbor|cold-harbor/i.test(spotsyText)) throw new Error("probe-spotsylvania must keep forbidding the unbuilt Cold Harbor/Petersburg/Crater lanes");

  const sd = (JSON.parse(read(DATA)) || {}).wilderness || {};
  const rows = unitRows(sd);
  const unitKeys = new Set();
  for (const row of rows) unitKeys.add(row.side + ":" + String(row.unit.id || row.unit.name || ""));
  const expectedPin = 1380 + unitKeys.size * 3;
  const history = s.lootRaw.match(/D([0-9]+):[^\n]*?1380\s*->\s*([0-9]+)[^\n]*[Ww]ilderness/);
  const laterTransitions = Array.from(s.lootRaw.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => history && x.d > +history[1]).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const transition of laterTransitions) if (transition.from === documentedPin) documentedPin = transition.to;
  if (!history || +history[2] !== expectedPin || s.pin < expectedPin || s.pin !== documentedPin || s.pinUi[0] !== s.pin || s.pinUi[1] !== s.pin) {
    throw new Error("runtime Army Register must document 1380 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }

  const focused = read(FOCUSED);
  const seedBlock = (focused.match(/(?:const|var) SEEDS\s*=\s*\[([^\]]+)\]/) || [null, ""])[1];
  const seeds = Array.from(seedBlock.matchAll(/\b([0-9]+)\b/g)).map(m => +m[1]);
  if (seeds.length !== 8 || new Set(seeds).size !== 8) throw new Error("focused Wilderness probe requires exactly eight unique seeds");
  mustInclude(focused, [
    "historical direction", "pageerrors", "junction", "holds",
    "CASUALTY-DIRECTION", "US>CS"
  ], "focused Wilderness probe");
  if (!/>=\s*5/.test(focused) || !/process\.exit\(1\)/.test(focused)) {
    throw new Error("focused Wilderness probe lacks the 5/8 guards or fail-closed exit");
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
    "Bloody Angle",
    "Wilderness",
    "D389",
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
  if (s.hasFocused) leaks.push("tools/probe-wilderness.mjs");
  if (s.runtimeSeams.length) leaks.push(...s.runtimeSeams.map(name => "tactical identifier in " + name));
  if (s.tacticalBranches.length) leaks.push("battle-specific tactical branches: " + s.tacticalBranches.join(","));
  if (leaks.length) throw new Error("D392 planning branch contains runtime leakage: " + leaks.join("; "));
  if (s.rosterExpected.length !== PIN.scenarios || s.rosterExpected.includes("wilderness")) throw new Error("planned roster must remain exact 22 without wilderness");
  if (s.builderExpected.length !== PIN.scenarios || s.builderExpected.includes("wilderness")) throw new Error("planned builder must remain exact 22 without wilderness");
  if (s.battleFiles.length !== PIN.battleFiles || s.battleFiles.includes("wilderness.json") || s.totalDataFiles !== PIN.totalDataFiles) throw new Error("planned schema must remain 22 battles / 52 total files");
  if (s.explicitFlagIds.length !== PIN.flags || s.explicitFlagIds.includes("wilderness") || !s.flagTargets.includes(PIN.flags)) throw new Error("planned flag metadata/coverage must remain exact 22");
  if (s.weatherCount !== PIN.weather) throw new Error("planned weather hints must remain exact 22, got " + s.weatherCount);
  if (!s.intelTargets.includes(PIN.intel)) throw new Error("planned Intel coverage must remain exact 22");
  if (s.mediaCount !== PIN.media) throw new Error("planned media opening-scene coverage must remain exact 22, got " + s.mediaCount);
  if (s.suiteRows.length !== PIN.suite || s.suiteRows.some(row => row[1] === "tools/probe-wilderness.mjs") || s.sweepCount !== PIN.sweep) throw new Error("planned suite/sweep must remain 127 / 22");
  if (s.pin !== PIN.armyRegister || s.pinUi[0] !== PIN.armyRegister || s.pinUi[1] !== PIN.armyRegister) throw new Error("planned Army Register/UI pin must remain exact 1380");
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

writeFileSync(join(OUT, "probe-wilderness-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(row => row.ok).length;
const fail = result.steps.length - ok;
console.log("probe-wilderness-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.err);
  process.exit(1);
}
console.log("ALL OK");
