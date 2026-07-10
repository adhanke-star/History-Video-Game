#!/usr/bin/env node
// D330 planning/spec gate for the Kennesaw Mountain battle-build lane.
// This is intentionally filesystem-only: it guards the durable spec and future
// registry/probe obligations before data/kennesaw.json exists.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "kennesaw-battle-build-spec.md");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const ROSTER = join(ROOT, "tools", "probe-tactical-roster.mjs");
const BUILDER = join(ROOT, "tools", "probe-custom-battle-builder.mjs");
const DATA = join(ROOT, "data", "kennesaw.json");
const FOCUSED = join(ROOT, "tools", "probe-kennesaw.mjs");

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

step("SPEC: durable Kennesaw Mountain battle-build packet exists in docs/design", () => {
  if (!existsSync(SPEC)) throw new Error("missing " + SPEC);
  const text = read(SPEC);
  if (text.length < 9000) throw new Error("spec is too thin: " + text.length + " bytes");
  mustInclude(text, [
    "D330 planning/spec",
    "single-phase",
    "no `phases[]`",
    "attacker:\"US\"",
    "defender:\"CS\"",
    "defaultFog:false",
    "Pigeon Hill",
    "Little Kennesaw",
    "Cheatham's Hill",
    "Dead Angle",
    "ridge crest",
    "breastwork line"
  ], "spec");
  return { bytes: text.length };
});

step("SOURCES: citation register carries NPS/ABT anchors and sector-grain strength warnings", () => {
  const text = read(SPEC);
  const urls = Array.from(text.matchAll(/https?:\/\/[^)`\s]+/g)).map(m => m[0]);
  const required = [
    "nps.gov/kemo/index.htm",
    "nps.gov/kemo/learn/historyculture/union-order-of-battle.htm",
    "nps.gov/kemo/learn/historyculture/confederate-order-of-battle.htm",
    "npgallery.nps.gov/pdfhost/docs/NRHP/Text/66000063.pdf",
    "archivesweb.vmi.edu/record.php?ID=443",
    "battlefields.org/learn/civil-war/battles/kennesaw-mountain",
    "battlefields.org/learn/articles/cheatham-hill"
  ];
  for (const needle of required) {
    if (!urls.some(url => url.indexOf(needle) >= 0)) throw new Error("missing source URL " + needle);
  }
  mustInclude(text, [
    "5,500 Federals",
    "9,000 Federals",
    "150,000 vs 100,000",
    "campaign totals",
    "Verified identity; Inferred strength"
  ], "sector/source caveat");
  return { urls: urls.length };
});

step("HISTORY TEETH: rank, OOB, terrain, and anti-Lost-Cause traps are explicit", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "Sherman - Major General",
    "Johnston - General",
    "Relieved July 17, 1864",
    "Hood - not army commander at Kennesaw",
    "Hardee - Lieutenant General",
    "Cheatham - Major General",
    "Cleburne - Major General",
    "Maney - Brigadier General",
    "Vaughan - Brigadier General",
    "Alfred Jefferson Vaughan",
    "Harker - Brigadier General",
    "McCook - Colonel",
    "Mitchell - Colonel",
    "Mebane's two-gun Tennessee Battery",
    "chevaux-de-frise",
    "Schofield's demonstration"
  ], "history teeth");
  if (/\*\*Alfred J\. Vaughn\b|Vaughn - Brigadier General|Maney and Vaughn\b/.test(text)) {
    throw new Error("obsolete player-facing Vaughan spelling returned");
  }
  return { traps: 16, vaughanSpelling: true };
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
    "node tools/probe-kennesaw.mjs",
    "node tools/probe-tactical-roster.mjs",
    "node tools/probe-custom-battle-builder.mjs",
    "node tools/probe-chattanooga.mjs",
    "git diff --check"
  ], "D74/gate text");
  return { gate: "focused" };
});

step("SCAFFOLD: future Kennesaw implementation obligations include both registry baselines", () => {
  const text = read(SPEC);
  mustInclude(text, [
    "When `data/kennesaw.json` is added",
    "tools/probe-kennesaw.mjs",
    "tools/probe-tactical-roster.mjs",
    "tools/probe-custom-battle-builder.mjs",
    "Both-baselines gotcha",
    "US fails to seize in the majority",
    "US casualties exceed CS casualties"
  ], "future scaffold");
  return { scaffolded: true };
});

step("REGISTRY: D330 does not half-register Kennesaw; future implementation must update both EXPECTED baselines", () => {
  const hasData = existsSync(DATA);
  const hasFocused = existsSync(FOCUSED);
  const t1 = read(T1);
  const roster = read(ROSTER);
  const builder = read(BUILDER);
  const registryMentions = /R\.kennesaw|kennesaw\s*[:=]/.test(t1);
  const rosterExpected = parseExpected(roster);
  const builderExpected = parseExpected(builder);
  const rosterHas = rosterExpected.indexOf("kennesaw") >= 0;
  const builderHas = builderExpected.indexOf("kennesaw") >= 0;

  if (!hasData) {
    if (registryMentions || rosterHas || builderHas || hasFocused) {
      throw new Error("D330 planning slice should not half-register Kennesaw before data exists");
    }
    return { state: "planned-only", data: false, registry: false, rosterHas, builderHas, focused: hasFocused };
  }

  if (!registryMentions) throw new Error("data/kennesaw.json exists but T1 registry/menu rank does not mention kennesaw");
  if (!rosterHas) throw new Error("data/kennesaw.json exists but probe-tactical-roster EXPECTED lacks kennesaw");
  if (!builderHas) throw new Error("data/kennesaw.json exists but probe-custom-battle-builder EXPECTED lacks kennesaw");
  if (!hasFocused) throw new Error("data/kennesaw.json exists but tools/probe-kennesaw.mjs is missing");
  return { state: "implementation-present", data: true, registry: true, rosterHas, builderHas, focused: hasFocused };
});

writeFileSync(join(OUT, "probe-kennesaw-plan.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter(s => s.ok).length;
const fail = result.steps.length - ok;
console.log("probe-kennesaw-plan: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail"));
if (!result.ok) {
  for (const s of result.steps) {
    if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  }
  process.exit(1);
}
console.log("ALL OK");
