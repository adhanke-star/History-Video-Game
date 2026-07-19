#!/usr/bin/env node
// D390 planning/spec gate for LANE-003 Spotsylvania "Bloody Angle" (1864-65 attrition lane).
// Filesystem-first until data/spotsylvania.json exists. Runtime teeth ship with the runtime slice.
// The spec is hard-wrapped, so text anchors match on whitespace-normalized text (the D385 idiom).
// The pre-existing frozen Classic `spotsylvania` row and the strategic rail route are separate
// layers (the shiloh/franklin precedent) — the runtime-seam scan targets TACTICAL identifiers only.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "spotsylvania-battle-build-spec.md");
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
const DATA = join(ROOT, "data", "spotsylvania.json");
const FOCUSED = join(ROOT, "tools", "probe-spotsylvania.mjs");

// ---- research-adjudicated constants (D390 gather -> default-refute -> Fable adjudication) ----
const REQUIRED_URL_ANCHORS = [
  "nps.gov/places/bloody-angle.htm",
  "nps.gov/places/east-face-of-salient.htm",
  "npshistory.com/publications/civil_war_series/25/sec16.htm",
  "battlefields.org/learn/articles/unions-bloody-miscue-spotsylvanias-muleshoe",
  "battlefields.org/learn/articles/certain-death",
  "battlefields.org/learn/articles/men-fell-heaps",
  "battlefields.org/learn/civil-war/battles/spotsylvania-court-house",
  "encyclopediavirginia.org/entries/spotsylvania-court-house-battle-of",
  "archives.gov/legislative/features/grant",
  "civilwarintheeast.com"
];
// Future committed-total envelopes (engine abstractions inside the whole-battle frame;
// every lower split ships Inferred). [min, max] per side, single phase.
const ENVELOPES = { US: [14000, 25000], CS: [8000, 16000] };
// Planning-mode baseline pins (the D389 verified-release boundary).
const PIN = {
  scenarios: 21, battleFiles: 21, totalDataFiles: 51, armyRegister: 1326,
  flags: 21, weather: 21, intel: 21, media: 21, suite: 126, sweep: 21,
  generatedMd5: "21544e26c8871bc47e26ff117cce1f32",
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
// Comments are stripped first: the frozen Classic CAMPAIGN chain includes Spotsylvania as a
// strategic node, and T2 carries a pre-existing D288 documentation comment naming it — a comment
// is not a combat branch. Only CODE references count as leakage.
function tacticalBattleBranches() {
  const hits = [];
  for (const file of readdirSync(join(ROOT, "src", "tactical")).filter(f => f.endsWith(".js"))) {
    if (file === "T1-bull-run.js" || file === "T10-flags.js") continue;
    const text = stripJsComments(read(join(ROOT, "src", "tactical", file)));
    if (/spotsylvania/i.test(text)) hits.push(file);
  }
  return hits;
}

// Tactical-only seam scan for the generated deliverable: the frozen Classic roster row
// ({id:"spotsylvania"...}) and the embedded strategic rail route are PRE-EXISTING separate
// layers, so a plain substring scan would false-positive; these regexes match only the
// tactical integration surface.
const GENERATED_TACTICAL_SEAMS = [
  /R\.spotsylvania\s*=/,
  /GAME_DATA\.spotsylvania\b/,
  /\bspotsylvania\s*:\s*68\b/,
  /fldScnBtn_spotsylvania/,
  /probe-spotsylvania/,
  /["']spotsylvania\.json["']/
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
  // Plain tactical-identifier scan over integration files that today carry NO spotsylvania text.
  const scanned = { t1, roster, builder, schema, flagsData, flagsProbe, intel, vet, lootRaw };
  const runtimeSeams = [];
  for (const [name, text] of Object.entries(scanned)) {
    if (/spotsylvania/i.test(text)) runtimeSeams.push(name);
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
    "Spotsylvania Battle-Build Spec (D390)",
    "This slice adds no Spotsylvania runtime data",
    "D390 stops before `data/spotsylvania.json`",
    "The Crater and Cold Harbor remain outside this scenario",
    "D390 Completion Criteria"
  ], "spec status/boundary");
  const packet = read(PACKET);
  mustInclude(packet, [
    "Verdict:** READY_FOR_SPEC",
    "D390 Spec-Time Addendum",
    "CASUALTY-DIRECTION-NEUTRAL",
    "UPTON'S MAY 10"
  ], "committed packet + D390 addendum");
  return { specBytes: text.length, packetAddendum: "present" };
});

step("SHAPE + ID + DATE", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "`spotsylvania` in `data/spotsylvania.json`",
    "`Spotsylvania: The Bloody Angle`",
    "**May 12, 1864**, a standalone SINGLE PHASE",
    "no `phases[]` block, no T8 routing, no new engine capability",
    "`spotsylvania:68`, between `chattanooga:65` and `kennesaw:70`",
    "No existing rank moves",
    "top-level `defaultFog:false`",
    "one phase, one day"
  ], "shape/id/date contract");
  // Classic/rail collision law: the pre-existing separate layers are pinned, not created.
  const base = read(BASE);
  const rows = Array.from(base.matchAll(/\{id:"spotsylvania", name:"Spotsylvania"/g)).length;
  if (rows !== 1) throw new Error("expected exactly one frozen Classic spotsylvania row, got " + rows);
  mustInclude(base, [
    "{id:\"spotsylvania\", name:\"Spotsylvania\", year:1864, th:\"E\", atk:\"US\", us:100000, cs:52000",
    "cmdUS:\"Grant\", cmdCS:\"Lee\""
  ], "frozen Classic row");
  const rail = JSON.parse(read(RAIL));
  const route = (rail.routes || {}).spotsylvania;
  if (!route || route.provenance !== "Inferred" || !/Overland railhead/.test(String(route.label || ""))) {
    throw new Error("the pre-existing strategic spotsylvania rail route must remain (Inferred, Overland railhead label)");
  }
  mustInclude(text, [
    "Frozen Classic And Rail-Route Collision Law",
    "the shiloh/franklin convention",
    "must not edit, rename, or delete it",
    "byte-for-byte",
    "never cited as a source"
  ], "collision contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).spotsylvania || {};
    if (sd.id !== "spotsylvania") throw new Error("runtime id must be spotsylvania, got " + sd.id);
    if (Array.isArray(sd.phases)) throw new Error("Spotsylvania is single-phase; a phases[] block violates the contract");
    if (!/May 12, 1864|May 12 1864/.test(JSON.stringify(sd))) throw new Error("runtime data lacks the May 12, 1864 date");
  }
  return { id: "spotsylvania", title: "Spotsylvania: The Bloody Angle", menuRank: 68, phases: 1 };
});

step("ROLES + OBJECTIVE", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "`attacker:\"US\"` / `defender:\"CS\"`",
    "Hancock's II Corps assault column joined by Wright's VI Corps",
    "Ewell's Second Corps on the Mule Shoe",
    "break or hold the Bloody Angle / Mule Shoe works",
    "The objective anchor sits on the salient's INTERIOR ground",
    "not on the captured tip",
    "a spectacular break-in that never became a breakthrough",
    "the day's question was whether the Union could push THROUGH, and it could not"
  ], "roles/objective contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).spotsylvania || {};
    if (sd.attacker !== "US" || sd.defender !== "CS") throw new Error("runtime roles must be US attacker / CS defender");
    if (sd.defaultFog !== false) throw new Error("runtime defaultFog must be false");
    if (!sd.objective) throw new Error("runtime objective missing");
  }
  return { attacker: "US (Hancock II + Wright VI)", defender: "CS (Ewell)", objective: "break or hold the Bloody Angle / Mule Shoe works" };
});

step("TERRAIN + WORKS", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "The Mule Shoe salient",
    "The Bloody Angle (the west angle)",
    "The East Angle / East Face",
    "stacked-log breastworks with earth banking, sharpened abatis, and internal traverses",
    "The McCoull house",
    "The Harrison house",
    "The Landrum house/farm",
    "The Brown house ground",
    "Lee's final line (the base line)",
    "The oak stump",
    "Teaching flavor ONLY",
    "No terrain element writes casualties, morale, rout, score, or winner",
    "The Artillery-Withdrawal Input Law",
    "22 of 30 guns had been withdrawn",
    "about twenty guns were captured, one unlimbering to fire a single round of canister",
    "the gun-stripped tip",
    "FORBIDDEN encodings",
    "The break-in must emerge from strength mass, gun counts, works geometry, and timing"
  ], "terrain/works contract");
  mustNotInclude(text, ["surprise bonus is acceptable", "scripted break-in event is acceptable"], "works law");
  if (existsSync(DATA)) {
    const runtimeText = JSON.stringify((JSON.parse(read(DATA)) || {}).spotsylvania || {});
    for (const term of ["Mule Shoe", "Bloody Angle", "McCoull", "Landrum"]) {
      if (!runtimeText.includes(term)) throw new Error("runtime landmark tooth missing " + term);
    }
  }
  return { objective: "the salient interior (McCoull ground toward the base line)", inputLaw: "gun-stripped tip (22 of 30 withdrawn)" };
});

step("OOB + STRENGTHS", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "never the full-battle May 8-21 aggregates as May 12 figures",
    "18,399 US against 12,687 CS (ABT) or 12,421 CS (Encyclopedia Virginia) belong to May 8-21 and are NEVER encoded",
    "No source pins a committed May 12 axis total for either side",
    "TRAP — the Upton conflation",
    "UPTON'S MAY 10 assault and must never be encoded as a May 12 VI Corps figure",
    "US committed 14,000-25,000",
    "CS committed 8,000-16,000",
    "Johnson's division on the tip, 3,500-5,500, its guns stripped",
    "the sourced piecemeal counterattack",
    "Verified identity; Inferred strength",
    "Gibbon's combat role at the Angle is UNRESOLVED",
    "Every lower split ships coarse",
    "Prisoners are outputs, never inputs"
  ], "OOB/strength contract");
  let sums = null;
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).spotsylvania || {};
    const rows = unitRows(sd);
    if (!rows.length) throw new Error("runtime OOB is empty");
    sums = { US: 0, CS: 0 };
    for (const row of rows) {
      const id = String(row.unit.id || row.unit.name || "");
      if (!row.side || !id) throw new Error("Spotsylvania unit lacks side/id");
      sums[row.side] = (sums[row.side] || 0) + (+row.unit.men || 0);
      if (!/Inferred strength/.test(String(row.unit.note || ""))) throw new Error("unit lacks an Inferred-strength disclosure: " + id);
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
  const andersonLock = "- **Richard H. Anderson: Major General** — commanding Longstreet's First Corps in temporary succession";
  const normS6 = s6.replace(/\s+/g, " ");
  if (normS6.indexOf(andersonLock.replace(/\s+/g, " ")) < 0) throw new Error("exact Anderson battle-date rank lock missing from section 6");
  mustInclude(s6, [
    "Lt. Gen. Ulysses S. Grant",
    "General-in-Chief (a ROLE, not a rank",
    "the Senate confirmed March 2, 1864 (NARA, fetched)",
    "NEVER a full \"General\"",
    "Maj. Gen. George G. Meade",
    "Never the theater commander",
    "Maj. Gen. Winfield S. Hancock",
    "Brig. Gen. Horatio G. Wright — THE SAME-DAY TRAP",
    "May 12, 1864 — the assault day itself",
    "never rendered as the settled morning-of grade",
    "Maj. Gen. John Sedgwick — THE DEAD-OFFICER GUARD",
    "killed May 9, 1864",
    "VI Corps under anyone but Wright, is a probe-fatal error",
    "Maj. Gen. Ambrose E. Burnside",
    "formally assigned to the Army of the Potomac only on May 25, 1864",
    "never drawn under Meade",
    "Lt. Gen. Richard S. Ewell",
    "Lt. Gen. James Longstreet — THE ABSENCE GUARD",
    "wounded by friendly fire May 6, 1864",
    "temporary lieutenant-general appointment is effective May 31, 1864",
    "never confirmed by the Confederate Congress",
    "Never render `Lt. Gen. Anderson` on any date inside May 8-21",
    "Maj. Gen. Edward \"Allegheny\" Johnson",
    "Brig. Gen. George H. \"Maryland\" Steuart",
    "Brig. Gen. John B. Gordon — THE OTHER SAME-WEEK TRAP",
    "major-general promotion is dated May 14, 1864",
    "Never `Maj. Gen. Gordon` at the Bloody Angle",
    "Maj. Gen. Jubal A. Early",
    "A. P. Hill too ill",
    "Brig. Gen. Abner Perrin (KILLED May 12",
    "Brig. Gen. Junius Daniel (MORTALLY wounded May 12",
    "Never render Stafford or J. M. Jones alive on May 12",
    "Promotion-paperwork dates are disclosure-only"
  ], "rank/trap wall (section 6)");
  if (existsSync(DATA)) {
    const runtimeText = JSON.stringify((JSON.parse(read(DATA)) || {}).spotsylvania || {});
    for (const rank of [
      "Lt. Gen. Ulysses S. Grant", "Maj. Gen. Winfield S. Hancock",
      "Brig. Gen. Horatio G. Wright", "Lt. Gen. Richard S. Ewell"
    ]) if (!runtimeText.includes(rank)) throw new Error("runtime rank tooth missing " + rank);
    for (const re of [
      /Maj\. Gen\. (?:Horatio G?\.? )?Wright/, /Major General (?:Horatio G?\.? )?Wright/,
      /Lt\. Gen\. (?:Richard H?\.? )?Anderson/, /Lieutenant General (?:Richard H?\.? )?Anderson/,
      /Maj\. Gen\. (?:John B?\.? )?Gordon/, /Major General (?:John B?\.? )?Gordon/,
      /General Grant\b(?! [a-z])/
    ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank rendering: " + re);
    const sd = (JSON.parse(read(DATA)) || {}).spotsylvania || {};
    for (const row of unitRows(sd)) {
      const cmd = String(row.unit.commander || "") + " " + String(row.unit.name || "");
      if (/Sedgwick|Longstreet/i.test(cmd)) throw new Error("dead/absent-officer guard: " + cmd.slice(0, 80));
    }
  }
  return {
    anderson: "Maj. Gen. (temp Lt. Gen. only May 31, 1864, never confirmed)",
    wright: "Brig. Gen. (MG dated May 12 itself — disclosure only)",
    gordon: "Brig. Gen. (MG May 14)",
    sedgwick: "dead May 9 — VI Corps to Wright",
    longstreet: "absent (wounded May 6)"
  };
});

step("SOURCES + PROVENANCE", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  for (const anchor of REQUIRED_URL_ANCHORS) if (!urls.some(url => url.includes(anchor))) throw new Error("source register missing " + anchor);
  mustInclude(text, [
    "The single-scholar disclosure (the Rhea root)",
    "Gordon Rhea's Overland Campaign scholarship",
    "collapses to ONE scholarly root",
    "two genuinely independent source FAMILIES",
    "Two-source rule",
    "One family = `Inferred`; a real conflict = `Disputed` with both values shown",
    "remains bot-403/cite-pending and is NOT load-bearing",
    "the fetched NARA page substitutes",
    "`Disputed` (March 9 per the secondary consensus vs the packet-era March 10) and never load-bearing",
    "now 404s and is retired",
    "per-fact sourcing",
    "page-cited Rhea (1997) fetch"
  ], "source/provenance contract");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).spotsylvania || {};
    const cards = (((sd.teaching || {}).cards) || []);
    for (const card of cards) {
      if (sourceUrls(card.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(card.provenance || ""))) {
        throw new Error("teaching card lacks two register URLs or exact provenance: " + String(card.title || "").slice(0, 60));
      }
    }
  }
  return { registerUrls: urls.length, anchors: REQUIRED_URL_ANCHORS.length };
});

step("D90 DEFENDER-HOLD LAW", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "exactly eight shared-model deterministic seeds",
    "THE ONE OUTCOME GUARD — the defender ultimately holds",
    "at least **5/8** seeds the CS retains the objective",
    "THE CASUALTY-DIRECTION-NEUTRAL LAW",
    "no per-side casualty tooth in either direction, aggregate or otherwise",
    "INCLUDING about 3,000 prisoners",
    "stripping prisoners flips the direction",
    "fabricated precision in either direction",
    "The refute pass's recommendation is adopted verbatim: ship NEUTRAL",
    "The initial break-in is an EMERGENT requirement, not a tooth",
    "No forced winner",
    "the engine's existing result/DRAW grain applies",
    "any prisoner, capture, gun-loss, surrender, or rout tooth",
    "old value, new value, and both observed guard counts"
  ], "defender-hold/direction law");
  mustInclude(text, [
    "the small first-line defense",
    "timed reinforcements",
    "the sourced piecemeal counterattack and the VI Corps arrival"
  ], "D90 recipe inputs");
  return { seeds: 8, threshold: "5/8", guards: ["defender ultimately holds"], casualtyDirection: "NEUTRAL (the Cedar Creek precedent)" };
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
    "a hand-to-hand melee multiplier for the",
    "scripting Johnson's capture or the prisoner haul",
    "any source branch that checks `spotsylvania` and writes combat output",
    "hardcoding ANY casualty magnitude anywhere"
  ], "D74 wall");
  const branches = tacticalBattleBranches();
  if (branches.length) throw new Error("Spotsylvania-specific tactical branch outside T1/T10: " + branches.join(", "));
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).spotsylvania || {};
    const forbidden = new Set([
      "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
      "killscale", "killmult", "casualtyscale", "casualtymult", "lossscale", "lossmult", "capturescale", "capturemult",
      "surrenderscale", "surrendermult", "routscale", "routmult", "moralescale", "moralemult", "combatscale",
      "battledamage", "battlefire", "powermult", "scorebonus", "scoremult", "winner", "winoverride",
      "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "genius", "geniusmult",
      "ammopenalty", "ammomult", "supplymult", "supplypenalty", "exhaustionmult", "fatiguemult", "starvationmult",
      "marchpenalty", "surprisebonus", "surprisemult", "envelopmentbonus", "envelopmentmult", "panicmult",
      "collapsemult", "meleemult", "handtohandbonus", "prisonermult", "capturebonus"
    ]);
    const hits = [];
    walk(sd, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) hits.push(path.join(".")); });
    if (hits.length) throw new Error("runtime Spotsylvania data contains D74-forbidden keys: " + hits.join(", "));
  }
  return { battleSpecificBranches: 0, dataScan: existsSync(DATA) ? "green" : "deferred" };
});

step("TEACHING + DIGNITY", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "at least eight restrained teaching cards plus one codex entry",
    "Human cost is rendered with gravity and without glory framing",
    "taught as cost, never as spectacle",
    "Grant the Butcher — the myth rebutted, the errors kept",
    "proportionally worse",
    "WITHOUT hiding the real Union tactical errors",
    "bloody miscue",
    "The guns were ordered back too late",
    "The first hour",
    "Nearly a full day at the Angle",
    "honest about the spread",
    "The counterattacks that re-formed the line",
    "Sedgwick, three days before",
    "The prisoners and the East Face",
    "USCT soldiers guarding the captured generals",
    "taught as agency, not anecdote",
    "Lee's last line",
    "What this scenario deliberately is not",
    "No massacre content is playable anywhere in this lane"
  ], "teaching/dignity contract");
  mustInclude(text, [
    "`theater:\"Eastern\"`",
    "`campaign:\"Overland Campaign\"`",
    "`result:\"Inconclusive\"`"
  ], "codex axes");
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).spotsylvania || {};
    const cards = (((sd.teaching || {}).cards) || []);
    const codex = (sd.teaching || {}).codex || {};
    if (cards.length < 8) throw new Error("runtime teaching requires at least eight cards, got " + cards.length);
    const cardText = JSON.stringify(cards);
    for (const term of ["Butcher", "guns", "prisoner", "Sedgwick"]) {
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
  return { cards: 9, framing: "attrition rebutted honestly; cost without glory" };
});

step("FUTURE DIRECTION + INTEGRATION", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Future atomic integration contract",
    "tactical scenarios **21 -> 22**",
    "total schema files **51 -> 52**",
    "1326 + (unique Spotsylvania side-unit ids × 3)",
    "`E / true / anv`",
    "coverage **21 -> 22**",
    "suite **126 -> 127**",
    "sweep comment **21 -> 22**",
    "R.spotsylvania = GAME_DATA.spotsylvania.spotsylvania",
    "fldScnBtn_spotsylvania",
    "`PHASE_COUNTS` gains NO entry",
    "tools/probe-spotsylvania.mjs",
    "defender ultimately holds ≥5/8",
    "All surfaces arrive in one green runtime commit"
  ], "future integration contract");

  const s = integrationSnapshot();
  if (!s.hasData) {
    return { state: "contracted", future: { scenarios: 22, schema: 52, armyRegister: "1326 + 3U", coverage: 22, suite: 127 } };
  }

  const registryHas = /R\.spotsylvania\s*=\s*GAME_DATA\.spotsylvania\.spotsylvania/.test(s.t1);
  const menuRankHas = /\bspotsylvania\s*:\s*68\b/.test(s.t1);
  const rosterHas = s.rosterExpected.includes("spotsylvania");
  const builderHas = s.builderExpected.includes("spotsylvania");
  const rosterDomHas = /fldScnBtn_spotsylvania/.test(s.roster);
  const phaseCountHas = /\bspotsylvania\s*:/.test(s.phaseCounts);
  const schemaHas = s.battleFiles.includes("spotsylvania.json");
  const flagBody = (s.flags.block.match(/\bspotsylvania\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = s.explicitFlagIds.includes("spotsylvania")
    && /\btheater\s*:\s*['"]E['"]/.test(flagBody)
    && /\bbadges\s*:\s*true\b/.test(flagBody)
    && /\bcsFlag\s*:\s*['"]anv['"]/.test(flagBody);
  const vetHas = s.suiteRows.some(row => /spotsylvania/i.test(row[0]) && row[1] === "tools/probe-spotsylvania.mjs");
  const generatedHas = GENERATED_TACTICAL_SEAMS.slice(0, 2).every(re => re.test(s.generatedRaw));
  if (!registryHas || !menuRankHas) throw new Error("runtime data exists without exact T1 registry/menu integration");
  if (!rosterHas || s.rosterExpected.length < 22 || !rosterDomHas) throw new Error("runtime data exists without complete 22-scenario roster integration");
  if (phaseCountHas) throw new Error("Spotsylvania is single-phase and must NOT gain a PHASE_COUNTS entry");
  if (!builderHas || s.builderExpected.length < 22) throw new Error("runtime data exists without complete custom-builder historical baseline");
  if (!schemaHas || s.battleFiles.length < 22 || s.totalDataFiles < 52) throw new Error("runtime data exists without 22-battle / 52-file schema integration");
  if (!s.hasFocused) throw new Error("runtime data exists but tools/probe-spotsylvania.mjs is missing");
  if (!flagMetaHas || s.explicitFlagIds.length < 22 || !s.flagTargets.some(n => n >= 22)) throw new Error("runtime flags lack Spotsylvania E/true/anv metadata or 22-scenario coverage");
  if (s.weatherCount < 22 || !s.intelTargets.some(n => n >= 22) || s.mediaCount < 22) throw new Error("runtime weather/Intel/media coverage is below 22");
  if (!vetHas || s.suiteRows.length < 127 || s.sweepCount < 22) throw new Error("runtime suite/sweep integration is incomplete");
  if (!generatedHas) throw new Error("generated HTML lacks the tactical Spotsylvania registry identifiers");
  if (s.tacticalBranches.length) throw new Error("runtime contains Spotsylvania-only tactical branches: " + s.tacticalBranches.join(", "));

  const sd = (JSON.parse(read(DATA)) || {}).spotsylvania || {};
  const rows = unitRows(sd);
  const unitKeys = new Set();
  for (const row of rows) unitKeys.add(row.side + ":" + String(row.unit.id || row.unit.name || ""));
  const expectedPin = 1326 + unitKeys.size * 3;
  const history = s.lootRaw.match(/D([0-9]+):[^\n]*?1326\s*->\s*([0-9]+)[^\n]*[Ss]potsylvania/);
  const laterTransitions = Array.from(s.lootRaw.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => history && x.d > +history[1]).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const transition of laterTransitions) if (transition.from === documentedPin) documentedPin = transition.to;
  if (!history || +history[2] !== expectedPin || s.pin < expectedPin || s.pin !== documentedPin || s.pinUi[0] !== s.pin || s.pinUi[1] !== s.pin) {
    throw new Error("runtime Army Register must document 1326 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }

  const focused = read(FOCUSED);
  const seedBlock = (focused.match(/(?:const|var) SEEDS\s*=\s*\[([^\]]+)\]/) || [null, ""])[1];
  const seeds = Array.from(seedBlock.matchAll(/\b([0-9]+)\b/g)).map(m => +m[1]);
  if (seeds.length !== 8 || new Set(seeds).size !== 8) throw new Error("focused Spotsylvania probe requires exactly eight unique seeds");
  mustInclude(focused, [
    "historical direction", "pageerrors", "defender", "holds",
    "CASUALTY-DIRECTION-NEUTRAL"
  ], "focused Spotsylvania probe");
  if (!/>=\s*5/.test(focused) || !/process\.exit\(1\)/.test(focused)) {
    throw new Error("focused Spotsylvania probe lacks the 5/8 defender-holds guard or fail-closed exit");
  }
  if (/(aCas|bCas|casualt)[^\n]*(>|<)[^\n]*(aCas|bCas|casualt)/i.test(focused)) {
    throw new Error("focused probe appears to carry a per-side casualty-direction comparison — the neutral law forbids it");
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
    "D389",
    "no simultaneous edits by any provider"
  ], "LANE-003 D390 contract");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  const owner = (lane.match(/\*\*Owning tool:\*\*\s*([^\n]+)/) || [null, ""])[1];
  if (!["DRIVE", "VERIFY", "CONTRACT", "SHIPPED"].includes(state)) throw new Error("LANE-003 does not carry a D390-driveable state: " + state);
  if ((state === "DRIVE" || state === "VERIFY") && !/(ChatGPT\/Codex|Claude (?:Code|Fable))/.test(owner)) throw new Error("active lane owner is not a recognized TOP-LOOP tool: " + owner);
  if (state === "CONTRACT" && !/^none\b/.test(owner)) throw new Error("released CONTRACT lane must be unowned: " + owner);

  const s = integrationSnapshot();
  if (s.hasData) {
    return { state, owner: owner.slice(0, 80), baselines: "implementation-present — delegated to FUTURE DIRECTION + INTEGRATION" };
  }
  const leaks = [];
  if (s.hasFocused) leaks.push("tools/probe-spotsylvania.mjs");
  if (s.runtimeSeams.length) leaks.push(...s.runtimeSeams.map(name => "tactical identifier in " + name));
  if (s.tacticalBranches.length) leaks.push("battle-specific tactical branches: " + s.tacticalBranches.join(","));
  if (leaks.length) throw new Error("D390 planning branch contains runtime leakage: " + leaks.join("; "));
  if (s.rosterExpected.length !== PIN.scenarios || s.rosterExpected.includes("spotsylvania")) throw new Error("planned roster must remain exact 21 without spotsylvania");
  if (s.builderExpected.length !== PIN.scenarios || s.builderExpected.includes("spotsylvania")) throw new Error("planned builder must remain exact 21 without spotsylvania");
  if (s.battleFiles.length !== PIN.battleFiles || s.battleFiles.includes("spotsylvania.json") || s.totalDataFiles !== PIN.totalDataFiles) throw new Error("planned schema must remain 21 battles / 51 total files");
  if (s.explicitFlagIds.length !== PIN.flags || s.explicitFlagIds.includes("spotsylvania") || !s.flagTargets.includes(PIN.flags)) throw new Error("planned flag metadata/coverage must remain exact 21");
  if (s.weatherCount !== PIN.weather) throw new Error("planned weather hints must remain exact 21, got " + s.weatherCount);
  if (!s.intelTargets.includes(PIN.intel)) throw new Error("planned Intel coverage must remain exact 21");
  if (s.mediaCount !== PIN.media) throw new Error("planned media opening-scene coverage must remain exact 21, got " + s.mediaCount);
  if (s.suiteRows.length !== PIN.suite || s.suiteRows.some(row => row[1] === "tools/probe-spotsylvania.mjs") || s.sweepCount !== PIN.sweep) throw new Error("planned suite/sweep must remain 126 / 21");
  if (s.pin !== PIN.armyRegister || s.pinUi[0] !== PIN.armyRegister || s.pinUi[1] !== PIN.armyRegister) throw new Error("planned Army Register/UI pin must remain exact 1326");
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

writeFileSync(join(OUT, "probe-spotsylvania-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(row => row.ok).length;
const fail = result.steps.length - ok;
console.log("probe-spotsylvania-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.err);
  process.exit(1);
}
console.log("ALL OK");
