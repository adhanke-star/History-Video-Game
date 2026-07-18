#!/usr/bin/env node
// D439 planning/spec gate for the Cold Harbor build (LANE-010 queue item 7; 1864-65 attrition
// lane; the D395 reorder gate satisfied by D431). Filesystem-first until data/cold-harbor.json
// exists; DUAL-MODE and fail-closed per spec §8 — a half-registered runtime is RED in both
// modes (the D390 pattern). AUTHORED under D431 (VETTING DEFERRED; the audit session runs it —
// AUDIT-DEBT AD-8). Text anchors match whitespace-normalized spec text (the D385 idiom).
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
mkdirSync(OUT, { recursive: true });

const SPEC = join(ROOT, "docs", "design", "cold-harbor-battle-build-spec.md");
const PACKET = join(ROOT, "docs", "design", "battle-build-research", "1864-65-attrition-battle-build-research.md");
const DATA = join(ROOT, "data", "cold-harbor.json");
const T1 = join(ROOT, "src", "tactical", "T1-bull-run.js");
const FLAGS = join(ROOT, "src", "tactical", "T10-flags.js");
const SCHEMA = join(ROOT, "tools", "validate-data-schemas.mjs");
const VET = join(ROOT, "tools", "vet-no-regression.mjs");
const FOCUSED = join(ROOT, "tools", "probe-cold-harbor.mjs");
const GENERATED = join(ROOT, "civil_war_generals.html");

const R = { mode: null, steps: [], ok: true };
const norm = s => s.replace(/\s+/g, " ");
function step(name, fn) {
  try { const v = fn(); R.steps.push({ name, ok: true, v: v === undefined ? null : v }); }
  catch (e) { R.ok = false; R.steps.push({ name, ok: false, err: String(e && e.message || e) }); }
}
const read = p => readFileSync(p, "utf8");

const runtimeExists = existsSync(DATA);
R.mode = runtimeExists ? "runtime" : "planning";

step("spec exists and carries the §1 shape contract", () => {
  const s = norm(read(SPEC));
  ["Single-phase doomed frontal assault", "Attacker = US, defender = CS",
   "CS victory — the attacker FAILS", "Fog OFF", "never a phase"].forEach(t => {
    if (s.indexOf(t) < 0) throw new Error("spec missing shape token: " + t);
  });
  return { ok: true };
});

step("§2 rank wall: Grant Lt. Gen. / Meade command frame / Wright-not-Sedgwick / the §9 obligations", () => {
  const s = norm(read(SPEC));
  ["Grant: Lieutenant General, USA", "Meade: Maj. Gen., USA", "Wright (VI, Maj. Gen. — succeeded Sedgwick after May 9",
   "ON LOAN from the Army of the James", "his exact dated title must be re-verified before the OOB ships",
   "no Sedgwick (d. May 9), no Stuart (d. May 12), no Longstreet (wounded May 6)"].forEach(t => {
    if (s.indexOf(norm(t)) < 0) throw new Error("spec missing rank-wall token: " + t);
  });
  return { ok: true };
});

step("§3 envelopes present and the 7,000 figure fenced as teaching-flavor only", () => {
  const s = norm(read(SPEC));
  if (s.indexOf("US [15000, 25000] / CS [10000, 18000]") < 0) throw new Error("committed envelopes missing");
  if (s.indexOf('teaching-flavor ONLY') < 0 || s.indexOf("never as a casualty count, seed, or guard") < 0)
    throw new Error("the 7,000-in-30-minutes fence is missing");
  return { ok: true };
});

step("§5 D74 law + the Grant regret-quote anchor + §7 pin table incl. the 68.5 rank exception", () => {
  const s = norm(read(SPEC));
  if (s.indexOf("NO `casualtyMult`/`lossMult`/ `fireMult`/winner gate".replace(/\s+/g, " ")) < 0 &&
      s.indexOf("winner gate to force the lopsided US loss") < 0) throw new Error("D74 law token missing");
  if (s.indexOf("I have always regretted that the last assault at Cold Harbor was ever made") < 0)
    throw new Error("the fetched Grant regret quote anchor is missing");
  if (s.indexOf("rank 68.5, the documented non-integer exception") < 0) throw new Error("the 68.5 rank exception is missing");
  if (s.indexOf("56 → 57") < 0 || s.indexOf("132 → 133") < 0 || s.indexOf("1566 → 1566 + U×3") < 0)
    throw new Error("pin-table transitions missing");
  return { ok: true };
});

step("the packet's Cold Harbor register rows stand unedited (the fetched ABT casualty splits + the CS victory)", () => {
  const p = norm(read(PACKET));
  ["12,737 US (1,844 k / 9,077 w / 1,816 m) vs 4,595 CS", "Confederate victory",
   "I have always regretted that the last assault at Cold Harbor was ever made"].forEach(t => {
    if (p.indexOf(norm(t)) < 0) throw new Error("packet anchor missing: " + t);
  });
  return { ok: true };
});

if (!runtimeExists) {
  step("PLANNING MODE: no tactical coldHarbor identifier exists yet (spec-first honesty)", () => {
    const t1 = read(T1);
    if (/R\.coldHarbor|coldHarbor:\s*68\.5/.test(t1)) throw new Error("T1 already carries coldHarbor without the data file — half-registration");
    if (/coldHarbor/.test(read(FLAGS))) throw new Error("T10 meta already carries coldHarbor");
    if (existsSync(FOCUSED)) throw new Error("the focused probe exists before the runtime — half-registration");
    if (/['"]cold harbor['"]/.test(read(VET))) throw new Error("the suite already enrolls cold harbor");
    return { clean: true };
  });
} else {
  step("RUNTIME MODE: every §7 transition is complete (any partial state is RED)", () => {
    const t1 = read(T1);
    if (!/GAME_DATA\["cold-harbor"\]/.test(t1) && !/GAME_DATA\.coldHarbor/.test(t1)) throw new Error("T1 registry line missing");
    if (!/coldHarbor:\s*68\.5/.test(t1)) throw new Error("menu rank 68.5 missing");
    if (!/coldHarbor:\s*\{ theater: "E", badges: true, csFlag: "anv" \}/.test(read(FLAGS))) throw new Error("T10 meta row missing");
    if (!/'cold-harbor\.json'/.test(read(SCHEMA))) throw new Error("schema enrollment missing");
    if (!existsSync(FOCUSED)) throw new Error("tools/probe-cold-harbor.mjs missing");
    if (!/tools\/probe-cold-harbor\.mjs/.test(read(VET))) throw new Error("suite row missing");
    const j = JSON.parse(read(DATA));
    const B = j.coldHarbor;
    if (!B || B.attacker !== "US" || B.defender !== "CS" || B.defaultFog !== false || B.phases) throw new Error("data shape violates the spec (§1)");
    if (!Array.isArray(B.sources) || B.sources.length < 2) throw new Error("4e-2 sources register missing");
    const raw = read(DATA);
    if (/"(damage|dmg|fireMult|fireMultiplier|casualtyMult|lossMult|killMult|powerMult|fudge)"\s*:/.test(raw)) throw new Error("forbidden D74 key present");
    if (/Sedgwick|Stuart/.test(raw)) throw new Error("dead-officer wall violated");
    return { registered: true };
  });
}

writeFileSync(join(OUT, "probe-cold-harbor-plan.json"), JSON.stringify(R, null, 2));
console.log("probe-cold-harbor-plan mode=" + R.mode + " ok=" + R.ok + " steps=" + R.steps.length);
for (const s of R.steps) if (!s.ok) console.log("  FAIL " + s.name + " :: " + s.err);
process.exit(R.ok ? 0 : 1);
