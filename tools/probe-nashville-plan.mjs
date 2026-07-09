#!/usr/bin/env node
// D334 planning/spec gate for the Nashville battle-build lane.
// Filesystem-only: guards the durable spec and future registry/probe obligations
// before data/nashville.json exists.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "nashville-battle-build-spec.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const ROSTER = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const DATA = join(ROOT, "data", "nashville.json");
const FOCUSED = join(ROOT, "tools", "probe-nashville.mjs");

const result = { ok: true, steps: [] };

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

step("SPEC: durable Nashville battle-build packet exists in docs/design", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 11000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "D334 planning/spec",
    "two-phase T8",
    "attacker:\"US\"",
    "defender:\"CS\"",
    "defaultFog:false",
    "December 15 - Redoubts and Montgomery Hill",
    "December 16 - Shy's Hill and Peach Orchard Hill",
    "Score weights: 1 + 3 = 4",
    "Franklin remains a separate single-phase battle",
    "Spring Hill remains teaching-only"
  ], "spec");
  return { bytes: text.length };
});

step("SOURCES: Nashville-specific citation register carries ABT, Nashville Trust, and Nashville Metro anchors", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "battlefields.org/learn/civil-war/battles/nashville",
    "battlefields.org/learn/articles/battle-nashville-enemies-front-and-rear",
    "battleofnashvilletrust.org/peach-orchard-hill",
    "battleofnashvilletrust.org/shys-hill",
    "nashville.gov/departments/historic-preservation/programs/historical-markers/military-sites"
  ];
  for (const needle of required) {
    if (!urls.some(url => url.indexOf(needle) >= 0)) throw new Error("missing source URL " + needle);
  }
  mustInclude(text, [
    "D327 Franklin/Nashville packet",
    "Starting point only, not authority",
    "broad force figures",
    "Verified identity; Inferred strength"
  ], "source caveat");
  return { urls: urls.length };
});

step("SHAPE: source recheck locks two phases, score weights, landmarks, and D74-safe engine fit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "The D327 packet's Nashville shape survived recheck",
    "Dec. 15 redoubts/Montgomery Hill",
    "Dec. 16 Shy's Hill/Peach Orchard",
    "Redoubts #1-#5",
    "Montgomery Hill",
    "Shy's Hill / Compton's Hill",
    "Peach Orchard Hill / Overton Hill",
    "Granny White Pike",
    "Franklin Pike",
    "Nashville & Chattanooga Railroad",
    "Travellers Rest",
    "Wilson pressure"
  ], "shape/landmark teeth");
  return { phases: 2, scoreWeight: 4 };
});

step("HISTORY TEETH: rank, OOB, sector, USCT, Forrest, and anti-Lost-Cause traps are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "George H. Thomas - Major General",
    "Andrew J. Smith - Major General",
    "John McArthur - Brigadier General",
    "Thomas J. Wood - Brigadier General",
    "John M. Schofield - Major General",
    "James H. Wilson - Major General",
    "James B. Steedman - Major General",
    "Charles R. Thompson - Colonel",
    "12th, 13th, 100th USCT",
    "18th USCT",
    "John Bell Hood - General (temporary grade)",
    "Stephen D. Lee - Lieutenant General",
    "Alexander P. Stewart - Lieutenant General",
    "Benjamin F. Cheatham - Major General",
    "William B. Bate - Major General",
    "William L. Shy - Colonel / Lieutenant Colonel wording trap",
    "Nathan Bedford Forrest - absent from the main Nashville field",
    "S. D. Lee / Cheatham sector separation",
    "The end of Hood's offensive power",
    "USCT at Peach Orchard Hill"
  ], "history teeth");
  mustNotInclude(text, [
    "Forrest - playable",
    "Shy - Brigadier General",
    "Cheatham - Lieutenant General"
  ], "forbidden traps");
  return { traps: 20 };
});

step("D74: no-fudge and future gate sequence are specified", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Use the universal combat model only",
    "Forbidden examples include",
    "damage",
    "fireMult",
    "casualtyMult",
    "lossMult",
    "killMult",
    "powerMult",
    "fudge",
    "scoreBonus",
    "forceWin",
    "node tools/probe-nashville.mjs",
    "node tools/probe-tactical-roster.mjs",
    "node tools/probe-custom-battle-builder.mjs",
    "node tools/probe-franklin.mjs",
    "node tools/probe-kennesaw.mjs",
    "git diff --check"
  ], "D74/gate text");
  return { gate: "focused" };
});

step("SCAFFOLD: future Nashville implementation obligations include both registry baselines and adjacent probes", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "When `data/nashville.json` is added",
    "tools/probe-nashville.mjs",
    "phases.length === 2",
    "score weights 1 and 3",
    "total scoreWeight 4",
    "no literal active map use of 85,000 / 55,000",
    "no invented regiment-level placement at Shy's Hill",
    "Spring Hill is teaching-only",
    "no Franklin content is folded into Nashville runtime",
    "Both-baselines gotcha",
    "tools/probe-franklin.mjs",
    "tools/probe-kennesaw.mjs"
  ], "future scaffold");
  return { scaffolded: true };
});

step("REGISTRY: D334 does not half-register Nashville; future implementation must update both EXPECTED baselines", () => {
  const hasData = existsSync(DATA);
  const hasFocused = existsSync(FOCUSED);
  const t1 = read(T1);
  const roster = read(ROSTER);
  const builder = read(BUILDER);
  const registryMentions = /R\.nashville|nashville\s*[:=]/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.indexOf("nashville") >= 0;
  const builderHas = builderExpected.indexOf("nashville") >= 0;

  if (!hasData) {
    if (registryMentions || rosterHas || builderHas || hasFocused) {
      throw new Error("D334 planning slice should not half-register Nashville before data exists");
    }
    return { state: "planned-only", data: false, registry: false, rosterHas, builderHas, focused: hasFocused };
  }

  if (!registryMentions) throw new Error("data/nashville.json exists but T1 registry/menu rank does not mention nashville");
  if (!rosterHas) throw new Error("data/nashville.json exists but probe-tactical-roster EXPECTED lacks nashville");
  if (!builderHas) throw new Error("data/nashville.json exists but probe-custom-battle-builder EXPECTED lacks nashville");
  if (!hasFocused) throw new Error("data/nashville.json exists but tools/probe-nashville.mjs is missing");
  return { state: "implementation-present", data: true, registry: true, rosterHas, builderHas, focused: hasFocused };
});

writeFileSync(join(OUT, "probe-nashville-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-nashville-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const s of result.steps) {
    if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  }
  process.exit(1);
}
console.log("ALL OK");
