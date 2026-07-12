#!/usr/bin/env node
// D361 planning/spec gate for LANE-003 Gaines' Mill.
// Filesystem-only until data/gaines-mill.json exists. Runtime teeth ship with D362.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "gaines-mill-battle-build-spec.md");
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
const DATA = join(ROOT, "data", "gaines-mill.json");
const FOCUSED = join(ROOT, "tools", "probe-gaines-mill.mjs");

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

step("SPEC: durable Gaines' Mill packet exists and locks a planning-only D361 boundary", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 12000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "Gaines' Mill Battle-Build Spec (D361)",
    "This slice adds no runtime data",
    "single-phase defender-hold",
    "attacker:\"CS\"",
    "defender:\"US\"",
    "defaultFog:false",
    "assaultDoctrine:\"standard\"",
    "gainesMill:15",
    "after `bullrun1:10` and before `malvernHill:18`",
    "Runtime work starts only from that clean D361 boundary"
  ], "spec");
  return { bytes: text.length };
});

step("LANE: LANE-003 records the current D377+ owner/state and retains the D362-to-Fable handoff boundary", () => {
  const text = read(COORD);
  const start = text.indexOf("### LANE-003");
  if (start < 0) throw new Error("LANE-003 missing from COORDINATION.md");
  const next = text.indexOf("\n### LANE-", start + 8);
  const lane = text.slice(start, next < 0 ? text.length : next);
  mustInclude(lane, [
    "battle-ladder",
    "D362 playable Gaines' Mill is the handoff boundary",
    "**Last-touched commit:** D362",
    "ChatGPT retains ownership only through the already-bounded D362 closeout",
    "D376 (SHIPPED",
    "Cedar Creek",
    "D377",
    "Cross Keys/Port Republic"
  ], "LANE-003 handoff");
  const state = (lane.match(/\*\*State:\*\*\s*([A-Z-]+)/) || [null, ""])[1];
  if (!["CONTRACT", "DRIVE", "VERIFY", "SHIPPED"].includes(state)) throw new Error("invalid LANE-003 state: " + state);
  const owner = (lane.match(/\*\*Owning tool:\*\*\s*([^\n]+)/) || [null, ""])[1];
  // D381 relay reshape: the DRIVE pin named the D377-era lock holder — the current-lock-holder
  // anti-pattern the relay ledger warns against. Active states now bind the ROLE ROSTER (any
  // recognized TOP-LOOP tool); the durable D362 handoff history above stays the real anchor.
  if ((state === "DRIVE" || state === "VERIFY") && !/(ChatGPT\/Codex|Claude (?:Code|Fable))/.test(owner)) throw new Error("active lane owner is not a recognized TOP-LOOP tool: " + owner);
  if (state === "CONTRACT" && !/^none\b/.test(owner)) throw new Error("released CONTRACT must be unowned: " + owner);
  return { owner: state === "CONTRACT" ? "none" : owner.slice(0, 60), state, boundary: "D362 retained", resume: "D377+ contract carried" };
});

step("SOURCES: NPS, ABT, Army CMH, and LOC anchors bind the decisive slice and rank corrections", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "nps.gov/rich/learn/historyculture/gainesmillbull.htm",
    "nps.gov/civilwar/search-battles-detail.htm?battleCode=va017",
    "battlefields.org/learn/civil-war/battles/gaines-mill",
    "battlefields.org/learn/maps/gaines-mill-june-27-1862-700-800-pm",
    "history.army.mil/portals/143/Images/Publications/catalog/75-5.pdf",
    "nps.gov/people/fitz-john-porter.htm",
    "battlefields.org/learn/biographies/p-hill",
    "encyclopediavirginia.org/entries/hill-a-p-1825-1865",
    "nps.gov/people/john-bell-hood.htm",
    "loc.gov/resource/g3884o.cw0558100"
  ];
  for (const needle of required) {
    if (!urls.some(url => url.indexOf(needle) >= 0)) throw new Error("missing source URL " + needle);
  }
  mustInclude(text, ["starting hypothesis", "control D362 runtime claims", "not a numerical strength source"], "source posture");
  return { urls: urls.length };
});

step("STRENGTH: active-map contract discloses the 32,000/50,000 dispute and the mixed-source abstraction", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "20,000-man V Corps line plus Slocum's 7,000-man division",
    "27,000-man modeled Union force is therefore a deliberate core-line abstraction",
    "32,000 Confederates in 16 brigades",
    "CMH says Lee had amassed 50,000",
    "31,500-32,500 Confederates only as the bounded 16-brigade ABT slice",
    "Disputed; modeled strength Inferred",
    "not claim that its 32,000-versus-27,000 game abstraction is a same-source snapshot",
    "Meagher and French did enter late",
    "must not put 57,018 Confederates into one synchronized game charge",
    "Verified identity; Inferred strength",
    "subtract captured and missing men"
  ], "strength contract");
  return { US: 27000, CS: "31500-32500", provenance: "mixed-source bounded abstraction; CS aggregate Disputed" };
});

step("HISTORY: ranks, terrain, direction, and anti-Lost-Cause teeth are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Brig. Gen. Fitz John Porter",
    "Reject `Maj. Gen. Fitz John Porter`",
    "Maj. Gen. A. P. Hill",
    "Reject `Brig. Gen. A. P. Hill` and `Lt. Gen. A. P. Hill`",
    "Brig. Gen. John B. Hood",
    "Reject major-general and lieutenant-general labels at Gaines' Mill",
    "Texas Brigade",
    "Reject a June 1862 lieutenant-general or corps label",
    "provisional status",
    "George B. McClellan",
    "must not appear as an on-map Gaines' Mill leader",
    "Boatswain's Creek / Boatswain's Swamp",
    "Watt House plateau",
    "Adams farm",
    "Chickahominy River",
    "A costly victory",
    "The Confederacy could not replace blood at the Union's rate",
    "Malvern Hill follows four days later"
  ], "history teeth");
  if (!/\*\*Turkey Hill:\*\*\s+excluded\./i.test(text)) throw new Error("history teeth missing anchored Turkey Hill exclusion");
  if (/\*\*Turkey Hill:\*\*\s+(verified|included)/i.test(text)) throw new Error("Turkey Hill must stay excluded");
  mustNotInclude(text, ["Lee's masterpiece"], "forbidden framing");
  return { rankTraps: 3, direction: "CS win and CS killed/wounded >= US" };
});

step("D74: no-fudge wall, A/B logging, registry baselines, loot pin, and focused gate are specified", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "The universal combat model owns the outcome",
    "Eligible inputs are OOB strength",
    "A result-derived multiplier is forbidden",
    "damage",
    "damageMult",
    "firepowerMult",
    "fireMult",
    "casualtyScale",
    "casualtyMult",
    "moraleMult",
    "captureMult",
    "scoreBonus",
    "scoreMult",
    "winner",
    "winOverride",
    "victoryOverride",
    "outcomeOverride",
    "forceWin",
    "winnerFudge",
    "tools/probe-tactical-roster.mjs",
    "tools/probe-custom-battle-builder.mjs",
    "tools/probe-loot-survival.mjs",
    "tools/probe-flags.mjs",
    "912 + units x 3",
    "node tools/probe-malvern-hill.mjs",
    "node tools/probe-nashville.mjs",
    "negative bind proof",
    "at least 5 of 8 deterministic seeds end with CS holding the objective",
    "at least 5 of 8 seeds produce Confederate killed/wounded greater than or equal to Union killed/wounded",
    "require `ok:true`, zero failed steps, and zero pageerrors",
    "The codex axes should include `theater:\"Eastern\"`",
    "log both values and the observed eight-seed direction result in `DECISIONS.md`",
    "Generated `civil_war_generals.html` rebuilt through `node tools/build.mjs` only",
    "Full `npm run vet:noreg` remains deferred",
    "owed after the final battle shipped in this LANE-003 session",
    "git diff --check"
  ], "D74/gate contract");
  return { gate: "focused", fullBattery: "release boundary" };
});

step("SCAFFOLD: D362 runtime obligations cover data, schema, registry, direction battery, teaching, and Army Register", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "`data/gaines-mill.json` with top-level key `gainesMill`",
    "`src/tactical/T1-bull-run.js` registry entry",
    "`tools/validate-data-schemas.mjs` battle-file enrollment",
    "`tools/probe-gaines-mill.mjs`",
    "`src/tactical/T10-flags.js` explicit Gaines' Mill battle metadata",
    "`theater:\"E\"`, `badges:false`, `csFlag:\"anv\"`",
    "`tools/probe-flags.mjs` registered-scenario metadata coverage from 13 to 14",
    "`tools/probe-intel-uhd617-profile.mjs` opening-scene coverage count from 13 to 14",
    "`tools/vet-no-regression.mjs` enrollment",
    "increasing the suite from 118 to 119 commands",
    "`tools/probe-weather.mjs` discovers the file without an id baseline",
    "`node tools/probe-media-budget.mjs`",
    "`tools/shots/data-schema-validation.html` regenerated with a substantive 44th row",
    "single-phase data and runtime state",
    "chronology order after Bull Run and before Malvern Hill",
    "more Union guns than Confederate guns",
    "role-aware home edges",
    "eight-seed split direction guard",
    "Jackson, Longstreet, D. H. Hill, Ewell, and Whiting as major generals",
    "each claim carrying at least two source URLs",
    "at least five teaching cards",
    "Army Register pin increase equals unique new Gaines' Mill unit ids times three"
  ], "future scaffold");
  return { scaffolded: true };
});

step("REGISTRY: D361 stays planned-only; any future data file requires complete D362 integration", () => {
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
  const registryHas = /R\.gainesMill\s*=\s*GAME_DATA\["gaines-mill"\]\.gainesMill/.test(t1);
  const menuRankHas = /\bgainesMill\s*:\s*15\b/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.indexOf("gainesMill") >= 0;
  const builderHas = builderExpected.indexOf("gainesMill") >= 0;
  const battleSet = (schema.match(/const BATTLE_FILES = new Set\(\[([\s\S]*?)\]\);/) || [null, ""])[1];
  const schemaHas = Array.from(battleSet.matchAll(/['"]([^'"]+\.json)['"]/g)).map(m => m[1]).indexOf("gaines-mill.json") >= 0;
  const flagBlock = (flagsData.match(/var _FLD_BATTLE_META = \{([\s\S]*?)\n\};/) || [null, ""])[1];
  const flagIds = Array.from(flagBlock.matchAll(/^\s*([A-Za-z0-9_]+)\s*:/gm)).map(m => m[1]);
  const anyRuntimeSeam = /\bgainesMill\b/.test(t1) || /\bgainesMill\b/.test(roster)
    || /\bgainesMill\b/.test(builder) || /\bgaines-mill\.json\b/.test(schema)
    || flagIds.indexOf("gainesMill") >= 0 || /gaines(?:Mill|[-' ]Mill)/i.test(flagsProbe)
    || /gaines(?:Mill|[-' ]Mill)/i.test(intel) || /gaines(?:Mill|[-' ]Mill)/i.test(vet)
    || /gaines(?:Mill|[-' ]Mill)/i.test(loot) || /gaines(?:Mill|[-' ]Mill)/i.test(media);
  const gainesFlagBody = (flagBlock.match(/\bgainesMill\s*:\s*\{([^}]*)\}/) || [null, ""])[1];
  const flagMetaHas = flagIds.indexOf("gainesMill") >= 0 && flagIds.length >= 15
    && /\btheater\s*:\s*['"]E['"]/.test(gainesFlagBody)
    && /\bbadges\s*:\s*false\b/.test(gainesFlagBody)
    && /\bcsFlag\s*:\s*['"]anv['"]/.test(gainesFlagBody);
  const flagCount14 = /P\.metaCoverage\.length\s*>=\s*14/.test(flagsProbe) || /P\.metaCoverage\.length\s*===\s*(?:1[4-9]|[2-9][0-9])/.test(flagsProbe);
  const flagSemantic = /P\.meta\s*&&\s*P\.meta\.gaines/.test(flagsProbe)
    && /P\.meta\.gaines\.theater\s*===\s*['"]E['"]/.test(flagsProbe)
    && /P\.meta\.gaines\.badges\s*===\s*false/.test(flagsProbe)
    && /P\.meta\.gaines\.csFlag\s*===\s*['"]anv['"]/.test(flagsProbe)
    && /P\.flag\.csGainesMill\s*===\s*['"]southern-cross['"]/.test(flagsProbe);
  const intelCount14 = /coverage\.count\s*>=\s*14/.test(intel) || /coverage\.count\s*===\s*(?:1[4-9]|[2-9][0-9])/.test(intel);
  const mediaData = JSON.parse(media);
  const mediaCountMatch = String((mediaData.performanceProfile || {}).largestShippedSceneMetric || "").match(/largest of (?:the )?([0-9]+) shipped opening scenes/i);
  const mediaCount = mediaCountMatch ? +mediaCountMatch[1] : 0;
  const mediaCount14 = !!mediaCountMatch && +mediaCountMatch[1] >= 14;
  const suiteBlock = (vet.match(/const SUITE = \[([\s\S]*?)\n\];/) || [null, ""])[1];
  const suiteRows = Array.from(suiteBlock.matchAll(/\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g));
  const vetHas = suiteRows.length >= 119 && suiteRows.some(m => m[1] === "gaines mill" && m[2] === "tools/probe-gaines-mill.mjs");
  const sweepCountMatch = vetRaw.match(/sweep-all-battles\.mjs[^\n]*?([0-9]+) battles/i);
  const sweepCount = sweepCountMatch ? +sweepCountMatch[1] : 0;
  const sweepCount14 = sweepCount >= 14;
  const pin = (loot.match(/reg\.people\.length!==([0-9]+)/) || [null, "0"])[1];
  const pinUi = (loot.match(/indexOf\('([0-9]+) of ([0-9]+)'\)/) || [null, "0", "0"]);
  const lootHistory = loot.match(/D362:[^\n]*912\s*->\s*([0-9]+)[^\n]*Gaines/i);
  const plannedBaselines = flagIds.length === 14
    && /P\.metaCoverage\.length\s*===\s*13/.test(flagsProbe)
    && /coverage\.count\s*===\s*13/.test(intel)
    && mediaCount === 13
    && suiteRows.length === 118
    && sweepCount === 13
    && pin === "912" && pinUi[1] === "912" && pinUi[2] === "912"
    && !lootHistory;

  if (!hasData) {
    if (anyRuntimeSeam || !plannedBaselines || registryHas || menuRankHas || rosterHas || builderHas || schemaHas || flagMetaHas || hasFocused) {
      throw new Error("D361 planning slice must not half-register Gaines' Mill before data exists");
    }
    return { state: "planned-only", data: false, anyRuntimeSeam, plannedBaselines, registryHas, menuRankHas, rosterHas, builderHas, schemaHas, flagMetaHas, focused: hasFocused };
  }

  if (!registryHas) throw new Error("data/gaines-mill.json exists but T1 registry lacks the exact GAME_DATA entry");
  if (!menuRankHas) throw new Error("runtime exists but fldScenarioMenuRank lacks gainesMill:15");
  if (!rosterHas) throw new Error("runtime exists but probe-tactical-roster EXPECTED lacks gainesMill");
  if (!builderHas) throw new Error("runtime exists but probe-custom-battle-builder EXPECTED lacks gainesMill");
  if (!schemaHas) throw new Error("runtime exists but validate-data-schemas lacks gaines-mill.json");
  if (!hasFocused) throw new Error("runtime exists but tools/probe-gaines-mill.mjs is missing");
  if (!flagMetaHas || !flagCount14 || !flagSemantic) throw new Error("runtime exists but T10/probe-flags lacks Gaines' Mill metadata coverage and an exact semantic tooth");
  if (!intelCount14 || !mediaCount14) throw new Error("runtime exists but Intel/media opening-scene count is below 14");
  if (!vetHas || !sweepCount14) throw new Error("runtime exists but vet-no-regression lacks Gaines enrollment or the 14-battle sweep note");
  const root = JSON.parse(read(DATA));
  const sd = root.gainesMill || {};
  const focused = stripJsComments(read(FOCUSED));
  const seedBlock = (focused.match(/const SEEDS\s*=\s*\[([^\]]+)\]/) || [null, ""])[1];
  const seeds = Array.from(seedBlock.matchAll(/\b([0-9]+)\b/g)).map(m => +m[1]);
  const focusedLabels = [
    "DATA CONTRACT", "REGISTRY + MENU", "TERRAIN + HOME EDGE", "RANK + SOURCES",
    "D74 NO-FUDGE", "RUNTIME SIDE CHOICE", "SAME-SEED REPLAY", "PASSIVE US",
    "PASSIVE CS", "HISTORICAL DIRECTION", "TEACHING", "ARMY REGISTER PIN"
  ];
  const focusedTeeth = seeds.length === 8 && new Set(seeds).size === 8
    && (focused.match(/\bcheck\s*\(/g) || []).length >= 12
    && focusedLabels.every(label => focused.indexOf(label) >= 0)
    && /from\s+['"]playwright(?:-core)?['"]/.test(focused)
    && /chromium\.launch\s*\(/.test(focused)
    && /page\.goto\s*\(/.test(focused)
    && /page\.evaluate\s*\(/.test(focused)
    && /fldLaunchBattle\s*\(\s*['"]gainesMill['"]/.test(focused)
    && /fldScenarioRegistry\s*\(\s*\)/.test(focused)
    && /fldScenarioSideChoice/.test(focused)
    && /runPassive\s*\(\s*['"]US['"]/.test(focused)
    && /runPassive\s*\(\s*['"]CS['"]/.test(focused)
    && /sameSeedReplay/.test(focused)
    && /csObjectiveWins\s*>=\s*5/.test(focused)
    && /csKilledWoundedWins\s*>=\s*5/.test(focused)
    && /captured/.test(focused) && /missing/.test(focused)
    && /pageerrors/.test(focused) && /process\.exit\(1\)/.test(focused);
  if (!focusedTeeth) throw new Error("focused Gaines probe lacks executable 8-seed/direction/cost/pageerror teeth");
  if (sd.id !== "gainesMill" || sd.attacker !== "CS" || sd.defender !== "US" || sd.defaultFog !== false
      || sd.assaultDoctrine !== "standard" || Object.prototype.hasOwnProperty.call(sd, "phases")) {
    throw new Error("runtime Gaines data violates the single-phase CS-attacker/US-defender contract");
  }
  if (!sd.homeEdge || sd.homeEdge.US !== "low" || sd.homeEdge.CS !== "high") {
    throw new Error("runtime Gaines data lacks the role-aware US-low/CS-high home edges");
  }
  const forbidden = new Set([
    "damage", "dmg", "damagemult", "firepower", "firepowermult", "firescale", "firemult", "firemultiplier",
    "killscale", "killmult", "casualtyscale", "casualtymult", "lossmult", "combatscale", "battledamage",
    "battlefire", "powermult", "moralemult", "routmult", "capturemult", "scorebonus", "scoremult", "winner",
    "winoverride", "victoryoverride", "outcomeoverride", "forcewin", "winnerfudge", "fudge"
  ]);
  const forbiddenHits = [];
  walk(sd, (key, _value, path) => { if (forbidden.has(key.toLowerCase())) forbiddenHits.push(path.join(".")); });
  if (forbiddenHits.length) throw new Error("runtime Gaines data contains D74-forbidden keys: " + forbiddenHits.join(", "));
  const unitKeys = new Set();
  const unitRows = [];
  for (const side of ["US", "CS"]) {
    for (const u of (((sd.oob || {})[side]) || [])) {
      unitKeys.add(side + ":" + String(u.id || u.name || ""));
      unitRows.push({ side, unit: u });
    }
  }
  for (const u of (sd.reinforcements || [])) {
    unitKeys.add(String(u.side || "") + ":" + String(u.id || u.name || ""));
    unitRows.push({ side: String(u.side || ""), unit: u });
  }
  if (Array.from(unitKeys).some(k => /:$/.test(k))) throw new Error("runtime Gaines' Mill unit lacks side/id-name for Army Register counting");
  const sums = { US: 0, CS: 0 };
  const guns = { US: 0, CS: 0 };
  for (const row of unitRows) {
    sums[row.side] = (sums[row.side] || 0) + (+row.unit.men || 0);
    if (row.unit.arm === "art") {
      if (!(+row.unit.guns > 0) || !(+row.unit.men > 0)) throw new Error("runtime artillery lacks positive guns/crew: " + String(row.unit.id || row.unit.name || "?"));
      guns[row.side] = (guns[row.side] || 0) + +row.unit.guns;
    }
    if (String(row.unit.note || "").indexOf("Verified identity; Inferred strength") < 0) {
      throw new Error("runtime unit lacks exact strength-provenance label: " + String(row.unit.id || row.unit.name || "?"));
    }
  }
  if (sums.US !== 27000 || sums.CS < 31500 || sums.CS > 32500) throw new Error("runtime modeled strengths violate 27,000 US / 31,500-32,500 CS: " + JSON.stringify(sums));
  if (!(guns.US > guns.CS && guns.CS > 0)) throw new Error("runtime must preserve the sourced Union gun advantage: " + JSON.stringify(guns));
  const runtimeText = JSON.stringify(sd);
  for (const terrainTerm of ["Watt House", "Boatswain", "Adams", "Chickahominy", "Old Cold Harbor", "New Cold Harbor"]) {
    if (runtimeText.indexOf(terrainTerm) < 0) throw new Error("runtime terrain/teaching tooth missing " + terrainTerm);
  }
  const onMapLeaderNames = [];
  for (const side of ["US", "CS"]) for (const leader of (((sd.leaders || {})[side]) || [])) onMapLeaderNames.push(String(leader.name || ""));
  for (const rank of [
    "Brig. Gen. Fitz John Porter", "Maj. Gen. A. P. Hill", "Brig. Gen. John B. Hood",
    "Maj. Gen. Thomas J. Jackson", "Maj. Gen. James Longstreet", "Maj. Gen. D. H. Hill",
    "Maj. Gen. Richard S. Ewell", "Maj. Gen. William H. C. Whiting"
  ]) if (!onMapLeaderNames.includes(rank)) throw new Error("runtime on-map leader rank tooth missing " + rank);
  const forbiddenRankText = [
    /Maj\. Gen\. Fitz John Porter/, /Brig\. Gen\. A\. P\. Hill/, /Lt\. Gen\. A\. P\. Hill/,
    /Maj\. Gen\. John B\. Hood/, /Lt\. Gen\. John B\. Hood/, /Longstreet's Corps/,
    /Jackson's Corps/, /A\. P\. Hill's Corps/, /\bFirst Corps\b/, /\bSecond Corps\b/, /\bThird Corps\b/
  ];
  if (forbiddenRankText.some(re => re.test(runtimeText))) throw new Error("runtime contains an anachronistic rank or later Confederate corps label");
  if (/Turkey Hill/i.test(runtimeText)) throw new Error("runtime must not claim Turkey Hill");
  const leaderText = JSON.stringify(sd.leaders || {});
  if (/McClellan/i.test(leaderText) || /Lt\. Gen\./.test(leaderText)) throw new Error("runtime on-map leaders contain McClellan or an anachronistic lieutenant general");
  const cards = (((sd.teaching || {}).cards) || []);
  const codex = (sd.teaching || {}).codex || {};
  if (cards.length < 5 || cards.some(card => sourceUrls(card.sources).length < 2) || sourceUrls(codex.sources).length < 2) {
    throw new Error("runtime teaching/codex claims require at least five cards and two source URLs each");
  }
  const weather = sd.weather || {};
  if (!weather.time || !weather.sky || !/^(Verified|Inferred)$/.test(String(weather.provenance || "")) || sourceUrls(weather.sources).length < 2) {
    throw new Error("runtime weather requires legal values, exact provenance, and two source URLs");
  }
  const expectedPin = 912 + unitKeys.size * 3;
  const laterTransitions = Array.from(loot.matchAll(/D([0-9]+):[^\n]*?([0-9]+)\s*->\s*([0-9]+)/gi))
    .map(m => ({ d: +m[1], from: +m[2], to: +m[3] })).filter(x => x.d > 362).sort((a, b) => a.d - b.d);
  let documentedPin = expectedPin;
  for (const tr of laterTransitions) if (tr.from === documentedPin) documentedPin = tr.to;
  if (+pin < expectedPin || +pin !== documentedPin || pinUi[1] !== pin || pinUi[2] !== pin || !lootHistory || +lootHistory[1] !== expectedPin) {
    throw new Error("runtime loot pins must be at least the Gaines D362 target, while D362 history must equal 912 + " + unitKeys.size + " unique units x3 = " + expectedPin);
  }
  return { state: "implementation-present", data: true, registryHas, menuRankHas, rosterHas, builderHas, schemaHas, flagMetaHas, strengths: sums, guns, units: unitKeys.size, pin: +pin, focusedTeeth };
});

writeFileSync(join(OUT, "probe-gaines-mill-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-gaines-mill-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const s of result.steps) if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  process.exit(1);
}
console.log("ALL OK");
