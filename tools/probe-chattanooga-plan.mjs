#!/usr/bin/env node
// D325 planning/spec gate for the Chattanooga battle-build lane.
// This is intentionally filesystem-only: it guards the durable spec and future
// registry/probe obligations before data/chattanooga.json exists.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "chattanooga-battle-build-spec.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const ROSTER = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const DATA = join(ROOT, "data", "chattanooga.json");
const FOCUSED = join(ROOT, "tools", "probe-chattanooga.mjs");

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

function parseExpected(text) {
  const m = text.match(/var EXPECTED = \[([^\]]+)\]/) || text.match(/const EXPECTED = \[([^\]]+)\]/);
  if (!m) return [];
  return Array.from(m[1].matchAll(/['"]([^'"]+)['"]/g)).map(x => x[1]);
}

step("SPEC: durable Chattanooga battle-build packet exists in docs/design", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 7000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "D325 planning/spec",
    "Orchard Knob",
    "Lookout Mountain",
    "Missionary Ridge",
    "scoreWeight 3",
    "US attacker",
    "CS defender",
    "Tunnel Hill",
    "Ringgold Gap"
  ], "spec");
  return { bytes: text.length };
});

step("SOURCES: citation register carries reputable anchors and marks scratch as non-authority", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "npshistory.com/publications/civil_war_series/9/sec7.htm",
    "smdc.army.mil/Portals/38/Documents/Publications/History/Staff%20Ride/LookoutBook.pdf",
    "battlefields.org/learn/civil-war/battles/chattanooga",
    "battlefields.org/learn/maps/chattanooga-lookout-mountain-nov-24-1863",
    "nps.gov/chch/learn/historyculture/missionary-ridge.htm"
  ];
  for (const needle of required) {
    if (!urls.some(url => url.indexOf(needle) >= 0)) throw new Error("missing source URL " + needle);
  }
  mustInclude(text, ["`.tmp/chattanooga-factsheet.json`", "scratch only", "Must be re-verified"], "scratch caveat");
  return { urls: urls.length };
});

step("HISTORY TEETH: rank, OOB, terrain, and anti-Lost-Cause traps are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Major General at Chattanooga",
    "do not backdate lieutenant general",
    "Breckinridge",
    "Major General; center and left",
    "J. Patton Anderson",
    "Brigadier General at the battle",
    "Bate",
    "John K. Jackson",
    "Indian Hill",
    "not a second objective",
    "bench around the Cravens house below the palisade",
    "physical/topographic crest",
    "military-crest blind-zone",
    "Confederate total-loss edge is a capture/rout signature"
  ], "history teeth");
  return { traps: 12 };
});

step("D74: no-fudge and future gate sequence are specified", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Use the universal combat model only",
    "Forbidden examples include",
    "damage",
    "fireMult",
    "casualtyMult",
    "node tools/probe-chattanooga.mjs",
    "node tools/probe-tactical-roster.mjs",
    "node tools/probe-custom-battle-builder.mjs",
    "node tools/probe-vicksburg.mjs",
    "node tools/probe-chickamauga.mjs",
    "git diff --check"
  ], "D74/gate text");
  return { gate: "focused" };
});

step("SCAFFOLD: future Chattanooga implementation obligations include both registry baselines", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "When `data/chattanooga.json` is added",
    "tools/probe-chattanooga.mjs",
    "tools/probe-tactical-roster.mjs` `EXPECTED",
    "tools/probe-custom-battle-builder.mjs",
    "D86/D88/D90 recurring gotcha",
    "tools/probe-tactical-visuals.mjs",
    "tools/sweep-chattanooga.mjs"
  ], "future scaffold");
  return { scaffolded: true };
});

step("REGISTRY: D325 does not half-register Chattanooga; future implementation must update both EXPECTED baselines", () => {
  const hasData = existsSync(DATA);
  const hasFocused = existsSync(FOCUSED);
  const t1 = read(T1);
  const roster = read(ROSTER);
  const builder = read(BUILDER);
  const registryMentions = /R\.chattanooga|chattanooga\s*[:=]/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.indexOf("chattanooga") >= 0;
  const builderHas = builderExpected.indexOf("chattanooga") >= 0;

  if (!hasData) {
    if (registryMentions || rosterHas || builderHas || hasFocused) {
      throw new Error("D325 planning slice should not half-register Chattanooga before data exists");
    }
    return { state: "planned-only", data: false, registry: false, rosterHas, builderHas, focused: hasFocused };
  }

  if (!registryMentions) throw new Error("data/chattanooga.json exists but T1 registry/menu rank does not mention chattanooga");
  if (!rosterHas) throw new Error("data/chattanooga.json exists but probe-tactical-roster EXPECTED lacks chattanooga");
  if (!builderHas) throw new Error("data/chattanooga.json exists but probe-custom-battle-builder EXPECTED lacks chattanooga");
  if (!hasFocused) throw new Error("data/chattanooga.json exists but tools/probe-chattanooga.mjs is missing");
  return { state: "implementation-present", data: true, registry: true, rosterHas, builderHas, focused: hasFocused };
});

writeFileSync(join(OUT, "probe-chattanooga-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-chattanooga-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const s of result.steps) {
    if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  }
  process.exit(1);
}
console.log("ALL OK");
