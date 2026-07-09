#!/usr/bin/env node
// D332 planning/spec gate for the Franklin battle-build lane.
// This is intentionally filesystem-only: it guards the durable spec and future
// registry/probe obligations before data/franklin.json exists.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "franklin-battle-build-spec.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const ROSTER = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const DATA = join(ROOT, "data", "franklin.json");
const FOCUSED = join(ROOT, "tools", "probe-franklin.mjs");

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

step("SPEC: durable Franklin battle-build packet exists in docs/design", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 9000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "D332 planning/spec",
    "single-phase",
    "defender-hold",
    "attacker:\"CS\"",
    "defender:\"US\"",
    "defaultFog:false",
    "Carter House",
    "Carter cotton gin",
    "Columbia Pike",
    "breastworks",
    "Osage-orange abatis",
    "Winstead Hill"
  ], "spec");
  return { bytes: text.length };
});

step("SOURCES: citation register carries ABT, Battle of Franklin Trust, NPS, and OR anchors", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "battlefields.org/learn/civil-war/battles/franklin",
    "boft.org/history",
    "npshistory.com/publications/srs/bafr-srs.pdf"
  ];
  for (const needle of required) {
    if (!urls.some(url => url.indexOf(needle) >= 0)) throw new Error("missing source URL " + needle);
  }
  mustInclude(text, [
    "Official Records",
    "War of the Rebellion",
    "18,000-20,000",
    "roughly 20,000 Confederates",
    "Verified identity; Inferred strength"
  ], "source caveat");
  return { urls: urls.length };
});

step("HISTORY TEETH: rank, OOB, terrain, and anti-Lost-Cause traps are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Schofield - Major General",
    "Cox - Brigadier General",
    "Stanley - Major General",
    "Wagner - Brigadier General",
    "Opdycke - Colonel",
    "Hood - General (temporary grade)",
    "Cheatham - Major General",
    "Cleburne - Major General",
    "John C. Brown - Major General",
    "Stewart and Stephen D. Lee - Lieutenant Generals",
    "six general-officer death nuance",
    "Spring Hill",
    "Harpeth River",
    "Fort Granger",
    "Hood's charge, not noble tragedy"
  ], "history teeth");
  mustNotInclude(text, [
    "Opdycke - Brigadier General, USA. His brigade refuses",
    "Cleburne - Lieutenant General"
  ], "rank trap text");
  return { traps: 15 };
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
    "node tools/probe-franklin.mjs",
    "node tools/probe-tactical-roster.mjs",
    "node tools/probe-custom-battle-builder.mjs",
    "node tools/probe-kennesaw.mjs",
    "git diff --check"
  ], "D74/gate text");
  return { gate: "focused" };
});

step("SCAFFOLD: future Franklin implementation obligations include both registry baselines and adjacent Kennesaw", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "When `data/franklin.json` is added",
    "tools/probe-franklin.mjs",
    "tools/probe-tactical-roster.mjs",
    "tools/probe-custom-battle-builder.mjs",
    "Both-baselines gotcha",
    "Union defender holds in the majority",
    "Confederate casualties exceed Union casualties",
    "no `33,000` as the active Confederate assaulting force",
    "`tools/probe-kennesaw.mjs` must stay green"
  ], "future scaffold");
  return { scaffolded: true };
});

step("NASHVILLE: follow-on battle remains queued and not folded into Franklin", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Nashville should be a later two-phase T8 battle",
    "December 15 redoubts / Montgomery Hill",
    "December 16 Shy's Hill / Peach Orchard Hill",
    "USCT presence",
    "Steedman"
  ], "Nashville queue note");
  return { queued: true };
});

step("REGISTRY: D332 does not half-register Franklin; future implementation must update both EXPECTED baselines", () => {
  const hasData = existsSync(DATA);
  const hasFocused = existsSync(FOCUSED);
  const t1 = read(T1);
  const roster = read(ROSTER);
  const builder = read(BUILDER);
  const registryMentions = /R\.franklin|franklin\s*[:=]/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.indexOf("franklin") >= 0;
  const builderHas = builderExpected.indexOf("franklin") >= 0;

  if (!hasData) {
    if (registryMentions || rosterHas || builderHas || hasFocused) {
      throw new Error("D332 planning slice should not half-register Franklin before data exists");
    }
    return { state: "planned-only", data: false, registry: false, rosterHas, builderHas, focused: hasFocused };
  }

  if (!registryMentions) throw new Error("data/franklin.json exists but T1 registry/menu rank does not mention franklin");
  if (!rosterHas) throw new Error("data/franklin.json exists but probe-tactical-roster EXPECTED lacks franklin");
  if (!builderHas) throw new Error("data/franklin.json exists but probe-custom-battle-builder EXPECTED lacks franklin");
  if (!hasFocused) throw new Error("data/franklin.json exists but tools/probe-franklin.mjs is missing");
  return { state: "implementation-present", data: true, registry: true, rosterHas, builderHas, focused: hasFocused };
});

writeFileSync(join(OUT, "probe-franklin-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-franklin-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const s of result.steps) {
    if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  }
  process.exit(1);
}
console.log("ALL OK");
