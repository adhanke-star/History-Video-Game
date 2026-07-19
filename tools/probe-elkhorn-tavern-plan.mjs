#!/usr/bin/env node
// D387 planning/spec gate for LANE-003 M4 Elkhorn Tavern (Pea Ridge, non-Leetown axis — D359).
// Filesystem-first until data/elkhorn-tavern.json exists. Runtime teeth ship with D388.
// The spec is hard-wrapped, so text anchors match on whitespace-normalized text (the D385 idiom).

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "elkhorn-tavern-battle-build-spec.md");
const PACKET = join(ROOT, "docs", "design", "battle-build-research", "trans-mississippi-battle-build-research.md");
const COORD = join(ROOT, "COORDINATION.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const T8 = join(ROOT, "src", "tactical", "T8-phases.js");
const T4 = join(ROOT, "src", "tactical", "T4-logistics.js");
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
const DATA = join(ROOT, "data", "elkhorn-tavern.json");
const FOCUSED = join(ROOT, "tools", "probe-elkhorn-tavern.mjs");

// ---- research-adjudicated constants (D387 gather -> default-refute -> critic -> Fable adjudication) ----
const REQUIRED_URL_ANCHORS = [
  "nps.gov/peri/learn/historyculture/order-of-battle.htm",
  "nps.gov/peri/",
  "npshistory.com/publications/civil_war_series/19/sec8.htm",
  "battlefields.org/learn/civil-war/battles/pea-ridge",
  "encyclopediaofarkansas.net/entries/battle-of-pea-ridge-508",
  "encyclopediaofarkansas.net/entries/indian-soldiers-6392",
  "battlefields.org/learn/articles/cherokees-pea-ridge",
  "okhistory.org/publications/enc/entry?entry=PE001",
  "en.wikipedia.org/wiki/Battle_of_Pea_Ridge"
];
// Future per-phase committed-total envelopes (engine abstractions inside the whole-army anchors;
// every lower split ships Inferred). [min, max] per side per phase index.
const PHASE_ENVELOPES = {
  0: { US: [2000, 5500], CS: [4000, 6500] },
  1: { US: [7500, 10500], CS: [5000, 11000] }
};
// The Leetown absence guard (D359): no fielded Native formation, name-scanned on OOB unit rows only
// (teaching cards may — and must — name Pike/Watie/Drew honestly; those live under `teaching`).
const NATIVE_UNIT_RE = /cherokee|mounted rifles|\bwatie\b|\bdrew'?s\b|indian brigade|pike'?s (?:brigade|indian)/i;

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
  const re = new RegExp(objectName.replace(".", "\\."), "g");
  const hits = [];
  let m;
  const scan = new RegExp(objectName.replace(/\./g, "\\.") + "\\s*(?:===|>=)\\s*([0-9]+)", "g");
  while ((m = scan.exec(text))) hits.push(+m[1]);
  void re;
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
    if (text.includes("elkhornTavern") || text.includes("elkhorn-tavern")) hits.push(file);
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
    if (text.includes("elkhornTavern") || text.includes("elkhorn-tavern.json") || text.includes("tools/probe-elkhorn-tavern.mjs")) runtimeSeams.push(name);
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
    "Elkhorn Tavern Battle-Build Spec (D387)",
    "This slice adds no Elkhorn Tavern runtime data",
    "two-phase T8 battle with the attacker/defender ROLE REVERSAL",
    "`elkhornTavern` in `data/elkhorn-tavern.json`",
    "elkhornTavern:49",
    "between `fortDonelson:48` and `shiloh:50`",
    "top-level `defaultFog:false`",
    "The Leetown fight is TAUGHT, never fielded",
    "D387 stops before `data/elkhorn-tavern.json`",
    "D387 Completion Criteria"
  ], "spec shape");
  return { bytes: text.length, id: "elkhornTavern", phases: 2, menuRank: 49 };
});

step("PHASES + WEIGHTS + AUDIT", () => {
  const text = read(SPEC);
  const t8 = read(T8);
  mustInclude(text, [
    "Elkhorn Tavern - March 7",
    "Curtis's Counterattack - March 8",
    "`scoreWeight` array is `[1, 3]`",
    "weights sum 4 (the two-phase convention, never 5)",
    "decisive index = 1",
    "The D92 phase-weight audit, written down BEFORE the weights",
    "the sourced aggregate result is a Union victory",
    "The packet's recommended weighting SURVIVES the audit unchanged",
    "Phase 1 sets per-phase `defaultFog:true`; Phase 2 stays fog OFF",
    "no literal weather fog is sourced for March 7",
    "The overnight interstitial",
    "transition.lead",
    "Never a scored phase",
    "the CS home edge is NORTH",
    "the US home edge is SOUTH"
  ], "phase/weight/audit contract");
  mustInclude(t8, ["function _fldPhaseView", "if (typeof p.defaultFog === \"boolean\"", "fldResetRun()"], "live T8 phase/fog seams");
  return { weights: [1, 3], decisiveIdx: 1, fog: "P1 per-phase ON (operational-surprise abstraction), P2 OFF" };
});

step("SOURCES + STRENGTH", () => {
  const text = read(SPEC);
  const packet = read(PACKET);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  for (const anchor of REQUIRED_URL_ANCHORS) if (!urls.some(url => url.includes(anchor))) throw new Error("source register missing " + anchor);
  mustInclude(text, [
    "The single-scholar disclosure",
    "William L. Shea",
    "collapses to ONE scholarly root",
    "two genuinely independent source FAMILIES",
    "US about **10,500**",
    "CS about **16,000-16,500**",
    "12,000-13,000",
    "never conflated",
    "Price's wing ~7,000",
    "no source pins an Elkhorn-axis engaged figure for either day",
    "is REJECTED outright",
    "Phase committed-total envelopes (engine abstractions, all `Inferred`)",
    "21 Federal guns massed (six batteries) on Welfley's Knoll against 12 Confederate guns",
    "Two-source rule",
    "page-cited Shea & Hess"
  ], "source/strength contract");
  mustInclude(packet, ["Verdict:** READY_FOR_SPEC", "D387 Spec-Time Addendum", "March 6, 1862", "POSTHUMOUS", "Welfley's Knoll", "1st = Drew, 2nd = Watie"], "committed packet + D387 addendum");
  return { urls: urls.length, anchors: { US: 10500, CS: "16000-16500" }, envelopes: PHASE_ENVELOPES };
});

step("TERRAIN", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Elkhorn Tavern",
    "Telegraph Road (Wire Road)",
    "Huntsville Road",
    "Cross Timber Hollow",
    "Big Mountain",
    "Clemons' farm",
    "Ruddick's field",
    "The tanyard",
    "Welfley's Knoll",
    "Little Sugar Creek",
    "Bentonville Detour and Camp Stephens",
    "Ford Road and Leetown",
    "teaching context only",
    "No terrain element writes casualties, morale, rout, score, or winner"
  ], "terrain contract");
  return { objectives: ["Elkhorn Tavern (P1, CS seizes)", "the tavern + Telegraph/Huntsville junction (P2, US retakes)"] };
});

step("SUPPLY-COLLAPSE INPUTS", () => {
  const text = read(SPEC);
  const t4 = read(T4);
  mustInclude(text, [
    "Supply-Collapse Input Contract (The Ammunition Law)",
    "mistakenly ordered back to Camp Stephens",
    "a dozen miles distant",
    "six-hour march",
    "T4 logistics reads the per-phase `supply` positions",
    "the shipped Fort Donelson pattern",
    "The US trains sit close behind their line in both phases",
    "FORBIDDEN encodings",
    "never through the count",
    "the ammunition was twelve miles away"
  ], "supply-collapse contract");
  mustNotInclude(text, ["ammunition multiplier is acceptable", "scripted out-of-ammo"], "supply contract");
  if (!/dataSup|sd\.supply|scenData.*supply/.test(t4) && !/supply/.test(t4)) throw new Error("T4 supply seam not found");
  if (!/(sd && sd\.supply)/.test(read(T4))) throw new Error("T4 per-phase scenario supply read (sd.supply) missing");
  return { lever: "per-phase supply train POSITION (T4)", p2CS: "the trains — ordered back to Camp Stephens" };
});

step("RANKS + TRAPS", () => {
  const text = read(SPEC);
  // Section-scoped lock (the D383 hardening): the bulleted Curtis lock line must live inside
  // section 6's own body — a quotation of it elsewhere (e.g. the section 13 bind procedure)
  // can never mask a tamper.
  const s6 = section(text, "## 6. Battle-Date Ranks", "## 7.");
  const curtisLock = "- **Curtis battle-date rank — Brig. Gen. Samuel R. Curtis; the Major General promotion (date of rank March 21, 1862) was the reward FOR this victory and postdates the fight — never render Maj. Gen. during the battle.**";
  const normS6 = s6.replace(/\s+/g, " ");
  if (normS6.indexOf(curtisLock.replace(/\s+/g, " ")) < 0) throw new Error("exact Curtis battle-date rank lock missing from section 6");
  mustInclude(s6, [
    "Brig. Gen. Franz Sigel",
    "Brig. Gen. Alexander Asboth",
    "Col. Peter J. Osterhaus",
    "Col. Jefferson C. Davis",
    "Reject `Brig. Gen. Jefferson C. Davis`",
    "Col. Eugene A. Carr",
    "Reject `Brig. Gen. Carr`",
    "BACKDATED to March 7, 1862",
    "awarded January 16, 1894",
    "Col. Grenville M. Dodge",
    "Col. William Vandever",
    "Maj. Gen. Earl Van Dorn",
    "Maj. Gen. Sterling Price — THE COMMISSION NUANCE",
    "March 6, 1862 — the eve of this battle",
    "Col. Henry Little",
    "Reject `Brig. Gen. Little`",
    "Col. William Y. Slack",
    "POSTHUMOUS (appointed April 17, to date from April 12",
    "Never render `Brig. Gen. Slack`",
    "Brig. Gen. Daniel M. Frost — the REVERSE trap",
    "commissioned March 3, 1862, four days before",
    "Col. Elijah Gates",
    "Col. Elkanah Greer",
    "Col. Stand Watie",
    "COLONEL in March 1862",
    "never backdated",
    "Col. John Drew",
    "Promotion-paperwork dates are disclosure-only"
  ], "rank/trap wall (section 6)");
  return { curtis: "Brig. Gen. (MG date-of-rank Mar 21, 1862)", carr: "Col. (BG backdated to Mar 7; MoH 1894)", price: "Maj. Gen. CSA (commission Mar 6, 1862)", slack: "Col. (posthumous BG)" };
});

step("HISTORY + DIGNITY", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "most pivotal Civil War battle west of the Mississippi River",
    "NEVER \"largest\"",
    "over 23,000 soldiers",
    "A State Army, Not a Confederate One",
    "rejected secession 98-1",
    "The Envelopment and the About-Face",
    "Three Days of Snow, Fifty Miles, No Trains",
    "Carr Holds the Hollow",
    "several times wounded",
    "Twenty-One Guns on Welfley's Knoll",
    "The Ammunition Was Twelve Miles Away",
    "never as exculpatory accident",
    "Never \"a gallant army betrayed by bad luck.\"",
    "Leetown: The Other Field",
    "Native Nations at Pea Ridge — Agency, Not Exotica",
    "The Scalping and Its Weaponization",
    "ships `Inferred` with that attribution",
    "neither \"Native savagery\" nor \"Union innocence\" is laundered",
    "Every claim obeys the two-source/provenance rule"
  ], "history/dignity contract");
  mustInclude(text, [
    "`theater:\"Trans-Mississippi\"`",
    "`campaign:\"Pea Ridge Campaign\"`",
    "`result:\"Union victory\"`"
  ], "codex axes");
  return { cards: 10, superlative: "most pivotal (NPS verbatim), never largest" };
});

step("LEETOWN ABSENCE GUARD", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Dignity boundaries (executable)",
    "NO Leetown scenario, data file, registry entry, or fielded Native unit may exist — the D359 carve-out",
    "LEETOWN ABSENCE GUARD on the Fort Pillow pattern",
    "no `data/leetown*` file",
    "argument from silence",
    "dignity-by-design, not erasure",
    "HALT-and-surface event"
  ], "Leetown absence contract");
  // Executable now, both modes: no Leetown data file, no Leetown/Wilson's-Creek/Glorieta registry line.
  const forbiddenData = readdirSync(join(ROOT, "data")).filter(name => /^leetown/i.test(name));
  if (forbiddenData.length) throw new Error("Leetown runtime data exists: " + forbiddenData.join(", "));
  const t1 = stripJsComments(read(T1));
  if (/R\.(?:leetown|wilsonsCreek|glorieta)\s*=/i.test(t1)) throw new Error("a barred/queued trans-Mississippi lane has a registry entry");
  /* D460 CHAIN (LANE-013 P2; Aaron's D455 SS3 row 7 unlock amends the D359 carve-out): the old
     tooth barred ANY fielded Native formation from the whole Elkhorn OOB. It now enforces the
     sourced-fielding contract instead: phase 1 (index 0 — the March 7 Elkhorn axis, while both
     Cherokee regiments verifiably fought at Leetown) still fields NO Native formation; phase 2
     (index 1 — March 8) fields EXACTLY ONE, Watie's 2nd Cherokee Mounted Rifles at its sourced
     Big Mountain station (a colonel, never the 1864 brigadier backdate); Drew's 1st CMR is never
     a combat marker (every account agrees it saw no combat March 8 — its station lives in the
     phase-2 transition record). The spec's original D359 text is preserved above as the
     historical record; the spec addendum SS13 records the supersession. */
  let scanned = 0, nativeIds = [];
  if (existsSync(DATA)) {
    const sd = (JSON.parse(read(DATA)) || {}).elkhornTavern || {};
    for (const row of phaseUnitRows(sd)) {
      scanned++;
      const probeText = [row.unit.name, row.unit.commander, row.unit.note, row.unit.entry].map(x => String(x || "")).join(" | ");
      if (NATIVE_UNIT_RE.test(probeText)) {
        if (row.phase !== 1) throw new Error("Native formation fielded outside the sourced March 8 station (phase " + row.phase + ", " + row.side + "): " + probeText.slice(0, 120));
        nativeIds.push(row.unit.id);
      }
    }
    if (nativeIds.length !== 1 || nativeIds[0] !== "cs_et_watie_2cmr") {
      throw new Error("phase 2 must field exactly cs_et_watie_2cmr (D460): " + nativeIds.join(","));
    }
    if (!/John Drew|Drew's 1st/.test(JSON.stringify(((sd.phases || [])[1] || {}).transition || {}))) {
      throw new Error("Drew's sourced non-combat station record is missing from the phase-2 transition (D460)");
    }
    if (existsSync(FOCUSED) && !/NATIVE|cherokee|leetown/i.test(read(FOCUSED))) {
      throw new Error("focused runtime probe lacks its own Leetown/Native scope tooth");
    }
  }
  return { mode: existsSync(DATA) ? "integration" : "planning", unitRowsScanned: scanned, fieldedNative: nativeIds };
});

step("D74 NO-FUDGE", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "D74 No-Fudge Acceptance Wall",
    "damageMult", "firepowerMult", "casualtyMult", "lossMult", "killMult",
    "moraleMult", "winner", "forceWin", "scoreMult",
    "ammoPenalty", "ammoMult", "supplyMult", "supplyPenalty", "exhaustionMult",
    "fatigueMult", "starvationMult", "marchPenalty", "surpriseBonus", "surpriseMult",
    "envelopmentBonus", "envelopmentMult", "panicMult", "collapseMult",
    "any Native super-unit (doubly barred",
    "any source branch that checks `elkhornTavern` and writes combat output"
  ], "D74 wall");
  const branches = tacticalBattleBranches();
  if (branches.length) throw new Error("Elkhorn-specific tactical branch outside T1/T10: " + branches.join(", "));
  if (existsSync(DATA)) {
    const root = JSON.parse(read(DATA));
    const sd = root.elkhornTavern || {};
    const forbidden = new Set([
      "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
      "killscale", "killmult", "casualtyscale", "casualtymult", "lossscale", "lossmult", "capturescale", "capturemult",
      "surrenderscale", "surrendermult", "routscale", "routmult", "moralescale", "moralemult", "combatscale",
      "battledamage", "battlefire", "powermult", "scorebonus", "scoremult", "winner", "winoverride",
      "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge", "genius", "geniusmult",
      "ammopenalty", "ammomult", "supplymult", "supplypenalty", "exhaustionmult", "fatiguemult", "starvationmult",
      "marchpenalty", "surprisebonus", "surprisemult", "envelopmentbonus", "envelopmentmult", "panicmult", "collapsemult"
    ]);
    const hits = [];
    walk(sd, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) hits.push(path.join(".")); });
    if (hits.length) throw new Error("runtime Elkhorn data contains D74-forbidden keys: " + hits.join(", "));
  }
  return { battleSpecificBranches: 0, dataScan: existsSync(DATA) ? "green" : "deferred" };
});

step("DIRECTION LAW", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "exactly eight shared-model deterministic seeds",
    "at least **5/8** for each independent direction guard",
    "the CS seizes Elkhorn Tavern",
    "the US seizes the objective",
    "The aggregate battle winner is the US",
    "Aggregate casualty DIRECTION only: CS total losses exceed US total losses",
    "US 1,384 is firm",
    "~2,000 against ABT 2,500",
    "no casualty MAGNITUDE, ratio, or split tooth",
    "no per-phase casualty tooth in either phase in either direction",
    "fabricated precision",
    "old value, new value, and both observed guard counts"
  ], "direction law");
  return { seeds: 8, threshold: 5, guards: ["P1 CS seizes", "P2 US seizes", "aggregate US", "aggregate CS>US losses (direction only)"] };
});

step("CLASSIC/RAIL COLLISION", () => {
  const base = read(BASE);
  const rows = Array.from(base.matchAll(/\{id:"peariver", name:"Pea Ridge"/g)).length;
  if (rows !== 1) throw new Error("expected exactly one frozen Classic peariver row, got " + rows);
  mustInclude(base, [
    "{id:\"peariver\", name:\"Pea Ridge\", year:1862, th:\"TM\", atk:\"CS\", us:10500, cs:16000",
    "cmdUS:\"Curtis\", cmdCS:\"Van Dorn\""
  ], "frozen Classic row");
  const rail = JSON.parse(read(RAIL));
  for (const key of ["peariver", "elkhornTavern", "elkhorn-tavern", "pearidge"]) {
    if (Object.prototype.hasOwnProperty.call(rail.routes || {}, key)) {
      throw new Error("Pea Ridge / Elkhorn Tavern must not have a rail route: " + key);
    }
  }
  const text = read(SPEC);
  mustInclude(text, [
    "Frozen Classic And Rail-Route Collision Law",
    "camel-case `elkhornTavern`",
    "hyphenated `elkhorn-tavern.json`",
    "byte-for-byte",
    "never cited as a source"
  ], "collision contract");
  return { classicRows: 1, railRoute: "none (correct — no rail line to model)" };
});

step("PLANNED-ONLY BASELINES", () => {
  const s = integrationSnapshot();
  if (s.hasData) return { state: "implementation-present", delegated: "step 13" };
  const leaks = [];
  if (s.hasFocused) leaks.push("tools/probe-elkhorn-tavern.mjs");
  if (s.runtimeSeams.length) leaks.push(...s.runtimeSeams.map(name => "runtime identifier in " + name));
  if (s.tacticalBranches.length) leaks.push("battle-specific tactical branches: " + s.tacticalBranches.join(","));
  if (leaks.length) throw new Error("D387 planning branch contains runtime leakage: " + leaks.join("; "));
  if (s.rosterExpected.length !== 20 || s.rosterExpected.includes("elkhornTavern")) throw new Error("planned roster must remain exact 20 without elkhornTavern");
  if (s.builderExpected.length !== 20 || s.builderExpected.includes("elkhornTavern")) throw new Error("planned builder must remain exact 20 without elkhornTavern");
  if (s.battleFiles.length !== 20 || s.battleFiles.includes("elkhorn-tavern.json") || s.totalDataFiles !== 50) throw new Error("planned schema must remain 20 battles / 50 total files");
  if (s.explicitFlagIds.length !== 20 || s.explicitFlagIds.includes("elkhornTavern") || !s.flagTargets.includes(20)) throw new Error("planned flag metadata/coverage must remain exact 20");
  if (s.weatherCount !== 20) throw new Error("planned weather hints must remain exact 20, got " + s.weatherCount);
  if (!s.intelTargets.includes(20)) throw new Error("planned Intel coverage must remain exact 20");
  if (s.mediaCount !== 20) throw new Error("planned media opening-scene coverage must remain exact 20, got " + s.mediaCount);
  if (s.suiteRows.length !== 125 || s.suiteRows.some(row => row[1] === "tools/probe-elkhorn-tavern.mjs") || s.sweepCount !== 20) throw new Error("planned suite/sweep must remain 125 / 20");
  if (s.pin !== 1281 || s.pinUi[0] !== 1281 || s.pinUi[1] !== 1281) throw new Error("planned Army Register/UI pin must remain exact 1281");
  if (s.generatedMd5 !== "a9b42b69c1c735b81fff7c9c878c1bc0") throw new Error("generated HTML md5 changed: " + s.generatedMd5);
  if (!/realHints/.test(s.weatherProbe)) throw new Error("weather probe no longer derives real hints");
  return {
    state: "planned-only",
    scenarios: 20,
    schema: { battleFiles: 20, total: 50 },
    armyRegister: 1281,
    coverage: { flags: 20, weather: 20, intel: 20, media: 20 },
    suite: 125,
    sweep: 20,
    generatedMd5: s.generatedMd5
  };
});

step("FUTURE COMPLETE-INTEGRATION CONTRACT", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "D388 future atomic integration contract",
    "tactical scenarios **20 -> 21**",
    "total schema files **50 -> 51**",
    "1281 + (unique Elkhorn Tavern side-unit ids × 3)",
    "first-national",
    "coverage **20 -> 21**",
    "suite **125 -> 126**",
    "sweep comment **20 -> 21**",
    "PHASE_COUNTS",
    "elkhornTavern: 2",
    "tools/probe-elkhorn-tavern.mjs",
    "All surfaces arrive in one green runtime commit",
    "the LEETOWN ABSENCE GUARD green"
  ], "future integration contract");

  const s = integrationSnapshot();
  if (!s.hasData) {
    return { state: "contracted", future: { scenarios: 21, schema: 51, armyRegister: "1281 + 3U", coverage: 21, suite: 126 } };
  }

  const registryHas = /R\.elkhornTavern\s*=\s*GAME_DATA\["elkhorn-tavern"\]\.elkhornTavern/.test(s.t1);
  const menuRankHas = /\belkhornTavern\s*:\s*49\b/.test(s.t1);
  const rosterHas = s.rosterExpected.includes("elkhornTavern");
  const builderHas = s.builderExpected.includes("elkhornTavern");
  const rosterDomHas = /fldScnBtn_elkhornTavern/.test(s.roster);
  const phaseCountHas = /\belkhornTavern\s*:\s*2\b/.test(s.phaseCounts);
  const schemaHas = s.battleFiles.includes("elkhorn-tavern.json");
  const flagBody = (s.flags.block.match(/\belkhornTavern\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = s.explicitFlagIds.includes("elkhornTavern")
    && /\btheater\s*:\s*['"](?:TM|W)['"]/.test(flagBody)
    && /\bbadges\s*:\s*false\b/.test(flagBody)
    && /\bcsFlag\s*:\s*['"]first-national['"]/.test(flagBody);
  const vetHas = s.suiteRows.some(row => /elkhorn/i.test(row[0]) && row[1] === "tools/probe-elkhorn-tavern.mjs");
  const generatedHas = s.generatedRaw.includes("elkhornTavern") && s.generatedRaw.includes("elkhorn-tavern");
  if (!registryHas || !menuRankHas) throw new Error("runtime data exists without exact T1 registry/menu integration");
  if (!rosterHas || s.rosterExpected.length < 21 || !rosterDomHas || !phaseCountHas) throw new Error("runtime data exists without complete two-phase 21-scenario roster integration");
  if (!builderHas || s.builderExpected.length < 21) throw new Error("runtime data exists without complete custom-builder historical baseline");
  if (!schemaHas || s.battleFiles.length < 21 || s.totalDataFiles < 51) throw new Error("runtime data exists without 21-battle / 51-file schema integration");
  if (!s.hasFocused) throw new Error("runtime data exists but tools/probe-elkhorn-tavern.mjs is missing");
  if (!flagMetaHas || s.explicitFlagIds.length < 21 || !s.flagTargets.some(n => n >= 21)) throw new Error("runtime flags lack Elkhorn Tavern TM|W/false/first-national metadata or 21-scenario coverage");
  if (s.weatherCount < 21 || !s.intelTargets.some(n => n >= 21) || s.mediaCount < 21) throw new Error("runtime weather/Intel/media coverage is below 21");
  if (!vetHas || s.suiteRows.length < 126 || s.sweepCount < 21) throw new Error("runtime suite/sweep integration is incomplete");
  if (!generatedHas) throw new Error("generated HTML lacks exact elkhornTavern/elkhorn-tavern runtime identifiers");
  if (s.tacticalBranches.length) throw new Error("runtime contains Elkhorn-only tactical branches: " + s.tacticalBranches.join(", "));

  const root = JSON.parse(read(DATA));
  const sd = root.elkhornTavern || {};
  if (sd.id !== "elkhornTavern" || sd.attacker !== "CS" || sd.defender !== "US" || sd.defaultFog !== false
      || !Array.isArray(sd.phases) || sd.phases.length !== 2) {
    throw new Error("runtime Elkhorn data violates the two-phase CS-attacker/US-defender/fog-off-top contract");
  }
  const weights = sd.phases.map(p => +p.scoreWeight || 1);
  if (weights[0] !== 1 || weights[1] !== 3) throw new Error("runtime phase weights must be [1,3], got " + JSON.stringify(weights));
  const roles = sd.phases.map(p => (p.attacker || sd.attacker) + ">" + (p.defender || sd.defender));
  if (roles[0] !== "CS>US" || roles[1] !== "US>CS") throw new Error("runtime phase roles must be CS>US / US>CS, got " + JSON.stringify(roles));
  if (sd.phases[0].defaultFog !== true) throw new Error("phase 1 must set per-phase defaultFog:true (the operational-surprise abstraction)");
  if (sd.phases[1].defaultFog === true) throw new Error("phase 2 must stay fog OFF");
  if (!sd.phases[1].transition || !String(sd.phases[1].transition.lead || "").match(/Camp Stephens|ammunition|Greer/i)) {
    throw new Error("phase-2 transition card must carry the overnight interstitial (the train ordered back / Greer / the re-formed line)");
  }
  for (let i = 0; i < 2; i++) {
    const sup = sd.phases[i].supply || {};
    if (!sup.US || !sup.CS) throw new Error("phase " + i + " lacks the per-phase supply train positions");
  }
  if (!/Camp Stephens/i.test(String((sd.phases[1].supply || {}).CS && sd.phases[1].supply.CS.name || ""))) {
    throw new Error("phase-2 CS supply marker must carry the Camp Stephens teaching name");
  }

  const rows = phaseUnitRows(sd);
  const unitKeys = new Set();
  const phaseSums = {};
  for (const row of rows) {
    const id = String(row.unit.id || row.unit.name || "");
    if (!row.side || !id) throw new Error("Elkhorn unit lacks side/id");
    unitKeys.add(row.side + ":" + id);
    const key = row.phase + ":" + row.side;
    phaseSums[key] = (phaseSums[key] || 0) + (+row.unit.men || 0);
    if (!/Inferred strength/.test(String(row.unit.note || ""))) throw new Error("Elkhorn unit lacks an Inferred-strength disclosure: " + id);
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
  for (const term of ["Elkhorn Tavern", "Telegraph Road", "Huntsville Road", "Cross Timber Hollow", "Big Mountain", "Ruddick", "Welfley's Knoll", "Little Sugar Creek", "Camp Stephens"]) {
    if (!runtimeText.includes(term)) throw new Error("runtime landmark/teaching tooth missing " + term);
  }
  for (const rank of [
    "Brig. Gen. Samuel R. Curtis", "Brig. Gen. Franz Sigel", "Col. Eugene A. Carr",
    "Col. Grenville M. Dodge", "Col. William Vandever", "Maj. Gen. Earl Van Dorn",
    "Maj. Gen. Sterling Price", "Col. Henry Little", "Col. William Y. Slack"
  ]) if (!runtimeText.includes(rank)) throw new Error("runtime rank tooth missing " + rank);
  for (const re of [
    /Maj\. Gen\. Samuel R\. Curtis/, /Major General Samuel R\. Curtis/,
    /Brig\. Gen\. (?:Eugene A?\.? )?Carr\b/, /Brigadier General (?:Eugene A?\.? )?Carr\b/,
    /Brig\. Gen\. (?:Henry )?Little\b/, /Brig\. Gen\. (?:William Y?\.? )?Slack\b/,
    /Brig\. Gen\. Jefferson C\. Davis/, /Brig\. Gen\. (?:Peter J?\.? )?Osterhaus\b/,
    /Brig\. Gen\. (?:Grenville M?\.? )?Dodge\b/, /Brig\. Gen\. (?:William )?Vandever\b/,
    /(?:Brig\.|Maj\.) Gen\. Stand Watie/, /General Stand Watie/
  ]) if (re.test(runtimeText)) throw new Error("runtime contains a forbidden rank rendering: " + re);

  const cards = (((sd.teaching || {}).cards) || []);
  const codex = (sd.teaching || {}).codex || {};
  if (cards.length < 8 || cards.some(card => sourceUrls(card.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(card.provenance || "")))) {
    throw new Error("runtime teaching requires eight cards, two register URLs each, and exact provenance");
  }
  const cardText = JSON.stringify(cards);
  if (!/Leetown/.test(cardText) || !/Watie|Cherokee/.test(cardText)) {
    throw new Error("the mandatory Leetown/Native teaching cards are missing (omission must be dignity-by-design, not erasure)");
  }
  if (sourceUrls(codex.sources).length < 2 || !/^(Verified|Inferred|Disputed)$/.test(String(codex.provenance || ""))) {
    throw new Error("runtime codex requires two register URLs and exact provenance");
  }
  const codexText = JSON.stringify(codex);
  if (!codexText.includes("Trans-Mississippi") || !codexText.includes("Pea Ridge Campaign") || !codexText.includes("Union victory")) {
    throw new Error("runtime codex lacks Trans-Mississippi / Pea Ridge Campaign / Union victory axes");
  }

  /* D460 CHAIN: this tooth assumed every Elkhorn unit id entered at the one D388 transition
     (1281 + 15x3 = 1326). Aaron's D455 SS3 row 7 fields Watie's 2nd CMR as the SIXTEENTH
     elkhorn unit id at its own documented transition (D460: 1614 -> 1617). The tooth now
     pins BOTH: the historical D388 transition (1281 -> 1326, 15 units) AND the D460
     transition, and the documented chain from 1326 must still reach the live pin exactly. */
  const D388_UNITS = 15;
  const expectedPin = 1281 + D388_UNITS * 3;
  if (unitKeys.size !== 16) throw new Error("Elkhorn unit ids must be D388's 15 + D460's Watie: " + unitKeys.size);
  if (!/D460:[^\n]*1614\s*->\s*1617[^\n]*(Elkhorn|Cherokee)/i.test(s.lootRaw)) {
    throw new Error("the D460 Cherokee register transition (1614 -> 1617) is undocumented in the loot-survival chain");
  }
  const history = s.lootRaw.match(/D388:[^\n]*1281\s*->\s*([0-9]+)[^\n]*(Elkhorn Tavern|elkhornTavern)/i);
  const laterTransitions = Array.from(s.lootRaw.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => x.d > 388).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const transition of laterTransitions) if (transition.from === documentedPin) documentedPin = transition.to;
  if (!history || +history[1] !== expectedPin || s.pin < expectedPin || s.pin !== documentedPin || s.pinUi[0] !== s.pin || s.pinUi[1] !== s.pin) {
    throw new Error("runtime Army Register must document 1281 + " + D388_UNITS + " unique units x3 = " + expectedPin + " with the documented chain reaching the live pin (" + s.pin + " vs " + documentedPin + ")");
  }

  const focused = read(FOCUSED);
  const seedBlock = (focused.match(/(?:const|var) SEEDS\s*=\s*\[([^\]]+)\]/) || [null, ""])[1];
  const seeds = Array.from(seedBlock.matchAll(/\b([0-9]+)\b/g)).map(m => +m[1]);
  if (seeds.length !== 8 || new Set(seeds).size !== 8) throw new Error("focused Elkhorn probe requires exactly eight unique seeds");
  mustInclude(focused, [
    "historical direction", "pageerrors", "playwright", "fldLaunchBattle",
    "CS seizes", "US seizes", "aggregate"
  ], "focused Elkhorn probe");
  if ((focused.match(/>=\s*5/g) || []).length < 4 || !/process\.exit\(1\)/.test(focused)) {
    throw new Error("focused Elkhorn probe lacks all four 5/8 direction guards or fail-closed exit");
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
    "Elkhorn Tavern",
    "non-Leetown axis",
    "D359",
    "D386",
    "npm run vet:noreg",
    "no simultaneous edits by any provider"
  ], "LANE-003 D387 contract");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  const owner = (lane.match(/\*\*Owning tool:\*\*\s*([^\n]+)/) || [null, ""])[1];
  if (!["DRIVE", "VERIFY", "CONTRACT", "SHIPPED"].includes(state)) throw new Error("LANE-003 does not carry a D387-driveable state: " + state);
  if ((state === "DRIVE" || state === "VERIFY") && !/(ChatGPT\/Codex|Claude (?:Code|Fable))/.test(owner)) throw new Error("active lane owner is not a recognized TOP-LOOP tool: " + owner);
  if (state === "CONTRACT" && !/^none\b/.test(owner)) throw new Error("released CONTRACT lane must be unowned: " + owner);
  return { state, owner: owner.slice(0, 80) };
});

writeFileSync(join(OUT, "probe-elkhorn-tavern-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(row => row.ok).length;
const fail = result.steps.length - ok;
console.log("probe-elkhorn-tavern-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.err);
  process.exit(1);
}
console.log("ALL OK");
