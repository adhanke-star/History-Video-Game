#!/usr/bin/env node
// D327 guard for the durable battle-build research library.
// Filesystem-only: it verifies that docs/design/battle-build-research/ carries a
// README index plus one buildable research packet per remaining battle lane, that
// each packet is a real research packet (source register, OOB/rank traps, playable
// shape, D74/no-fudge, probe teeth, verdict), and that no packet claims
// READY_FOR_SPEC without >=2 source-register entries and explicit remaining traps.
// It does NOT implement any battle, add data, or touch runtime.

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const DIR = join(ROOT, "docs", "design", "battle-build-research");
const README = join(DIR, "README.md");
const PACKETS = [
  // D327 forward lanes
  "atlanta-march-battle-build-research.md",
  "franklin-nashville-battle-build-research.md",
  "usct-battle-build-research.md",
  "naval-river-battle-build-research.md",
  "1864-65-attrition-battle-build-research.md",
  // D329 coverage-completion lanes (every remaining unbuilt, uncovered battle/campaign)
  "eastern-1862-battle-build-research.md",
  "shenandoah-1862-battle-build-research.md",
  "shenandoah-1864-battle-build-research.md",
  "western-gaps-battle-build-research.md",
  "trans-mississippi-battle-build-research.md",
  "appomattox-campaign-battle-build-research.md",
];

const VERDICTS = ["READY_FOR_SPEC", "NEEDS_MORE_RESEARCH", "DO_NOT_BUILD_NOW"];

// D328 built-battle audit subfolder (research/audit of the already-built battles)
const BUILT_DIR = join(DIR, "built-battles");
const BUILT_README = join(BUILT_DIR, "README.md");
const BUILT_PACKETS = [
  "bullrun-built-battle-audit.md",
  "antietam-built-battle-audit.md",
  "fredericksburg-built-battle-audit.md",
  "chancellorsville-built-battle-audit.md",
  "malvern-hill-built-battle-audit.md",
  "gettysburg-built-battle-audit.md",
  "shiloh-built-battle-audit.md",
  "vicksburg-built-battle-audit.md",
  "chickamauga-built-battle-audit.md",
  "chattanooga-built-battle-audit.md",
];
const BUILT_VERDICTS = ["SOLID_AS_IS", "MINOR_REVISIONS", "NEEDS_REVISION"];

const result = { ok: true, steps: [] };

function step(name, fn) {
  try {
    const v = fn();
    result.steps.push({ name, ok: true, v: v === undefined ? null : v });
  } catch (err) {
    result.ok = false;
    result.steps.push({ name, ok: false, err: String((err && err.message) || err) });
  }
}

function read(path) {
  return readFileSync(path, "utf8");
}

function mustInclude(text, terms, label) {
  const lower = text.toLowerCase();
  const missing = terms.filter((t) => lower.indexOf(t.toLowerCase()) < 0);
  if (missing.length) throw new Error(label + " missing: " + missing.join(", "));
}

// Slice a markdown section body from a heading substring to the next "## " heading.
function sectionBody(text, headingNeedle) {
  const lower = text.toLowerCase();
  const at = lower.indexOf(headingNeedle.toLowerCase());
  if (at < 0) return "";
  // find the end of that heading's line, then the next "## " at column 0
  const lineEnd = text.indexOf("\n", at);
  const rest = text.slice(lineEnd < 0 ? text.length : lineEnd + 1);
  const next = rest.search(/\n##\s/);
  return next < 0 ? rest : rest.slice(0, next);
}

function countSourceRows(text) {
  const body = sectionBody(text, "source register");
  const rows = body
    .split("\n")
    .filter((ln) => /^\s*\|/.test(ln) && /https?:\/\//.test(ln));
  return rows.length;
}

function parseVerdict(text) {
  const m = text.match(/\*\*Verdict:\*\*\s*`?(READY_FOR_SPEC|NEEDS_MORE_RESEARCH|DO_NOT_BUILD_NOW)`?/);
  return m ? m[1] : null;
}

function parseBuiltVerdict(text) {
  const m = text.match(/\*\*Audit verdict:\*\*\s*`?(SOLID_AS_IS|MINOR_REVISIONS|NEEDS_REVISION)`?/);
  return m ? m[1] : null;
}

function bulletCount(body) {
  return body.split("\n").filter((ln) => /^\s*[-*]\s+\S/.test(ln)).length;
}

step("FOLDER: docs/design/battle-build-research exists", () => {
  if (!existsSync(DIR)) throw new Error("missing folder " + DIR);
  const entries = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  return { mdFiles: entries.length, entries };
});

step("PACKETS: all required lane packets exist and are substantial", () => {
  const sizes = {};
  for (const p of PACKETS) {
    const fp = join(DIR, p);
    if (!existsSync(fp)) throw new Error("missing packet " + p);
    const text = read(fp);
    if (text.length < 3000) throw new Error(p + " too thin: " + text.length + " bytes");
    sizes[p] = text.length;
  }
  return sizes;
});

step("STRUCTURE: each packet has the required research sections", () => {
  for (const p of PACKETS) {
    const text = read(join(DIR, p));
    mustInclude(
      text,
      [
        "candidate battles",       // ranked candidates
        "playable shape",          // recommended playable shape
        "source register",         // sources with URLs
        "rank trap",               // OOB/rank traps (matches "OOB And Rank Traps")
        "landmark",                // terrain/objective landmarks
        "teaching card",           // teaching cards
        "anti-lost-cause",         // framing
        "d74",                     // no-fudge law
        "fudge",                   // no-fudge risks
        "probe teeth",             // candidate probe teeth
        "remaining traps",         // residual unknowns
        "verdict",                 // final verdict
        "next recommended slice",  // exact next slice
      ],
      p
    );
  }
  return { checked: PACKETS.length };
});

step("SOURCES: every packet's Source Register carries >=2 URL rows", () => {
  const counts = {};
  for (const p of PACKETS) {
    const text = read(join(DIR, p));
    const n = countSourceRows(text);
    if (n < 2) throw new Error(p + " has only " + n + " source-register URL rows (need >=2)");
    counts[p] = n;
  }
  return counts;
});

step("VERDICT: every packet declares a parseable, valid verdict", () => {
  const verdicts = {};
  for (const p of PACKETS) {
    const text = read(join(DIR, p));
    const v = parseVerdict(text);
    if (!v) throw new Error(p + " has no parseable **Verdict:** line");
    if (VERDICTS.indexOf(v) < 0) throw new Error(p + " has invalid verdict " + v);
    verdicts[p] = v;
  }
  return verdicts;
});

step("READY_FOR_SPEC guard: no packet claims READY_FOR_SPEC without >=2 sources + explicit remaining traps", () => {
  const checked = {};
  for (const p of PACKETS) {
    const text = read(join(DIR, p));
    const v = parseVerdict(text);
    if (v !== "READY_FOR_SPEC") {
      checked[p] = { verdict: v, enforced: false };
      continue;
    }
    const sources = countSourceRows(text);
    if (sources < 2) throw new Error(p + " is READY_FOR_SPEC but has < 2 source rows");
    const traps = sectionBody(text, "remaining traps");
    if (bulletCount(traps) < 2) {
      throw new Error(p + " is READY_FOR_SPEC but its Remaining Traps section lists < 2 explicit items");
    }
    checked[p] = { verdict: v, sources, remainingTraps: bulletCount(traps) };
  }
  return checked;
});

step("README: indexes every packet", () => {
  if (!existsSync(README)) throw new Error("missing README " + README);
  const text = read(README);
  if (text.length < 800) throw new Error("README too thin: " + text.length + " bytes");
  const missing = PACKETS.filter((p) => text.indexOf(p) < 0);
  if (missing.length) throw new Error("README does not index: " + missing.join(", "));
  mustInclude(text, ["battle-build research", "READY_FOR_SPEC", "D327"], "README");
  return { bytes: text.length, indexed: PACKETS.length };
});

step("HYGIENE: no leaked JSON-escape artifacts in any packet", () => {
  // Packets authored through a JSON-carrying pipeline can leak \" or literal \n
  // sequences into the prose. Those are silent corruption, so fail loudly.
  const dirty = {};
  for (const p of PACKETS.concat(BUILT_PACKETS.map((b) => join("built-battles", b)))) {
    const text = read(join(DIR, p));
    const escQuote = (text.match(/\\"/g) || []).length;
    const escNewline = (text.match(/\\n/g) || []).length;
    if (escQuote || escNewline) dirty[p] = { escQuote, escNewline };
  }
  const bad = Object.keys(dirty);
  if (bad.length) throw new Error("leaked JSON-escape artifacts in: " + JSON.stringify(dirty));
  return { checked: PACKETS.length + BUILT_PACKETS.length, clean: true };
});

step("DOCS-ONLY: this library must not smuggle in battle data or a registry line", () => {
  // The library is research/docs only. Guard that no lane packet accidentally became a data file.
  for (const p of PACKETS) {
    if (!p.endsWith(".md")) throw new Error("unexpected non-markdown packet " + p);
  }
  const stray = readdirSync(DIR).filter((f) => f.endsWith(".json"));
  if (stray.length) throw new Error("battle-build-research must be docs only; found JSON: " + stray.join(", "));
  return { ok: true };
});

// ---- D328 built-battle audit subfolder ----

step("BUILT: docs/design/battle-build-research/built-battles exists with all 10 audits", () => {
  if (!existsSync(BUILT_DIR)) throw new Error("missing folder " + BUILT_DIR);
  const sizes = {};
  for (const p of BUILT_PACKETS) {
    const fp = join(BUILT_DIR, p);
    if (!existsSync(fp)) throw new Error("missing built-battle audit " + p);
    const text = read(fp);
    if (text.length < 2500) throw new Error(p + " too thin: " + text.length + " bytes");
    sizes[p] = text.length;
  }
  return sizes;
});

step("BUILT STRUCTURE: each audit has the required sections", () => {
  for (const p of BUILT_PACKETS) {
    const text = read(join(BUILT_DIR, p));
    mustInclude(
      text,
      [
        "source register",             // sources
        "confirmed solid",             // what checks out
        "revision checklist for codex", // actionable fixes (or "no revisions required")
        "no-fudge",                    // D74/D92 adherence section
        "audit verdict",               // final verdict
      ],
      p
    );
  }
  return { checked: BUILT_PACKETS.length };
});

step("BUILT SOURCES: every audit's Source Register carries >=2 URL rows", () => {
  const counts = {};
  for (const p of BUILT_PACKETS) {
    const n = countSourceRows(read(join(BUILT_DIR, p)));
    if (n < 2) throw new Error(p + " has only " + n + " source-register URL rows (need >=2)");
    counts[p] = n;
  }
  return counts;
});

step("BUILT VERDICT: every audit declares a parseable, valid audit verdict", () => {
  const verdicts = {};
  for (const p of BUILT_PACKETS) {
    const v = parseBuiltVerdict(read(join(BUILT_DIR, p)));
    if (!v) throw new Error(p + " has no parseable **Audit verdict:** line");
    if (BUILT_VERDICTS.indexOf(v) < 0) throw new Error(p + " has invalid audit verdict " + v);
    verdicts[p] = v;
  }
  return verdicts;
});

step("BUILT README: indexes every audit", () => {
  if (!existsSync(BUILT_README)) throw new Error("missing built-battles README " + BUILT_README);
  const text = read(BUILT_README);
  if (text.length < 800) throw new Error("built-battles README too thin: " + text.length + " bytes");
  const missing = BUILT_PACKETS.filter((p) => text.indexOf(p) < 0);
  if (missing.length) throw new Error("built-battles README does not index: " + missing.join(", "));
  mustInclude(text, ["built-battle", "D328", "SOLID_AS_IS"], "built-battles README");
  return { bytes: text.length, indexed: BUILT_PACKETS.length };
});

step("BUILT LINK: parent README points to the built-battles subfolder", () => {
  const text = read(README);
  if (text.indexOf("built-battles/") < 0) throw new Error("parent README does not link built-battles/");
  return { ok: true };
});

writeFileSync(join(OUT, "probe-battle-build-research.json"), JSON.stringify(result, null, 2));

const ok = result.steps.filter((s) => s.ok).length;
const fail = result.steps.length - ok;
console.log(
  "probe-battle-build-research: " + ok + "/" + result.steps.length + " steps ok" + (fail ? ", " + fail + " FAIL" : ", 0 fail")
);
if (!result.ok) {
  for (const s of result.steps) {
    if (!s.ok) console.error("  FAIL:", s.name, "::", s.err);
  }
  process.exit(1);
}
console.log("ALL OK");
