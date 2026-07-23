#!/usr/bin/env node
// D514 / LANE-020 filesystem-first ARC 9 pacing contract probe.
// Planning mode is intentionally green against the untouched runtime. Each shipped
// slice updates its declared owner hash/mode in the same commit as the green fix.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = join(HERE, "shots");
const ART = join(OUT, "probe-desk-pacing-plan.json");
mkdirSync(OUT, { recursive: true });

const read = rel => readFileSync(join(ROOT, rel), "utf8");
const hash = rel => createHash("sha256").update(readFileSync(join(ROOT, rel))).digest("hex");
const count = (text, token) => text.split(token).length - 1;
const need = (value, message) => { if (!value) throw new Error(message); };
const steps = [];
function step(name, fn) {
  try {
    const value = fn();
    steps.push({ name, ok: true, value: value === undefined ? null : value });
  } catch (error) {
    steps.push({ name, ok: false, error: String(error && error.message || error) });
  }
}
function includesAll(text, tokens, label) {
  const hay = String(text).replace(/\s+/g, " ").trim();
  for (const token of tokens) {
    const needle = String(token).replace(/\s+/g, " ").trim();
    need(hay.includes(needle), label + " missing " + JSON.stringify(token));
  }
}
function lane020(text) {
  const match = /### LANE-020 · desk-to-battle-pacing[\s\S]*?(?=\n### LANE-\d+ ·|\n## 6 ·|$)/.exec(text);
  need(match, "LANE-020 segment missing");
  return match[0];
}
function suiteRows(text) {
  const block = (/const SUITE = \[([\s\S]*?)\n\];/.exec(text) || [null, ""])[1];
  return (block.match(/^\s*\['/gm) || []).length;
}

const law = read("docs/design/unlocked-but-judged-design.md");
const decisions = read("DECISIONS.md");
const coordination = read("COORDINATION.md");
const lane = lane020(coordination);
const manifest = JSON.parse(read("src/00-manifest.json"));
const vet = read("tools/vet-no-regression.mjs");
const src90 = read("src/90-president-register.js");
const src99 = read("src/99-h0-president-desk.js");
const src109 = read("src/109-chief-of-staff.js");
const src91 = read("src/91-save-slots.js");
const base = read("build/base.html");
const focusedRel = "tools/probe-desk-pacing.mjs";
const focusedExists = existsSync(join(ROOT, focusedRel));
const runtimeMarker = [src90, src99, src109, src91].some(text => text.includes("ARC9_PACING_RUNTIME_V1"));
const slice2Marker = count(src109, "function cosNextAction(") === 1 &&
  count(src109, "function _cosLiveDeskTab(") === 1;
const slice3Marker = count(src99, "function h0DeskTabKnown(") === 1 &&
  count(src99, "function h0DeskLandingTab(") === 1 &&
  count(src99, "function h0DeskRememberTab(") === 1;
const mode = (focusedExists || runtimeMarker) ? "runtime" : "planning";

step("D514 and section 4g carry one executable ARC 9 law", () => {
  need(count(decisions, "## D514 —") === 1, "D514 heading not singular");
  need(count(law, "### 4g. Desk-to-battle pacing") === 1, "section 4g not singular");
  includesAll(law, [
    "No ARC 9 source module, task queue, clock, resolver, settings store, save snapshot, or notification bus is authorized.",
    "Measured latency and honest status",
    "One lawful next action",
    "Safe re-engagement",
    "Both proof paths begin pre-onboarded",
    "Session bookmarks",
    "fingerprint is canonical stable JSON",
    "Bounded batch turns",
    "no batch-runtime seam may fabricate a battle/result or silently auto-resolve one",
    "releases LANE-020 to `CONTRACT`/unowned"
  ], "section 4g");
  need(decisions.includes("### D514 execution contract after the live ARC 9 owner inventory"), "D514 execution contract missing");
  return { decision: "D514", law: "4g", mode };
});

step("LANE-020 is DRIVE-owned and contains every exact slice contract", () => {
  const state = /- \*\*State:\*\*\s*(LAW-DRAFT|CONTRACT|DRIVE|VERIFY|SHIPPED)\b/.exec(lane);
  const owner = /- \*\*Owning tool:\*\*\s*([^\n]+)/.exec(lane);
  need(state && state[1] === "DRIVE", "LANE-020 first State must be DRIVE");
  need(owner && /^ChatGPT\/Codex\b/.test(owner[1].trim()), "LANE-020 first owner must be ChatGPT/Codex");
  includesAll(lane, [
    "Slice 1 exact contract — profile/status only",
    "Slice 2 exact contract — one pure next action",
    "Slice 3 exact contract — measured one-click return and one safe preference",
    "Slice 4 exact contract — bookmark pointers over named slots",
    "Slice 5 dependency contract — no fabricated standalone turn",
    "pre-onboarded fixture",
    "v1:<canonical UTF-16 length>",
    "blocker commit moves LANE-020 to `CONTRACT` / `none`",
    "0→8", "8→14", "14→21", "21→31", "31→43", "140→141"
  ], "LANE-020 executable contract");
  return { state: state[1], owner: owner[1].trim(), slices: 5 };
});

step("live owners are singular and ARC 9 adds no parallel architecture", () => {
  need(count(src90, "function _t1Resolve(") === 1, "source resolver must be singular");
  need(count(src99, "openWarDept = function") === 1, "live H0 Desk override must be singular");
  need(count(src109, "function cosBriefLines(") === 1, "Chief reader must be singular");
  need(count(src91, "function _slValidSave(") === 1, "slot validator must be singular");
  need(manifest.modules.length === 111 && manifest.modules.at(-1) === "115-conquest-transport.js", "manifest baseline moved");
  need(!manifest.modules.some(name => /arc9|pacing/i.test(name)), "ARC 9 module must not exist");
  const source = [src90, src99, src109, src91, read("src/98-h0-main-menu.js")].join("\n");
  for (const token of ["gor_arc9", "cw_arc9", "gor_bookmark", "cw_bookmark"]) {
    need(!source.includes(token), "parallel storage key exists: " + token);
  }
  return { resolver: "src/90", desk: "src/99", chief: "src/109", saves: "src/91", modules: 111 };
});

step("resolver order and the battle-bound Slice-5 dependency are pinned", () => {
  const order = ["clkOnResolve", "politicsOnResolve", "econOnResolve", "wrOnResolve",
    "blockadeOnResolve", "prodOnResolve", "engOnResolve", "logisticsOnResolve",
    "manpowerOnResolve", "prisonerExchangeOnResolve", "medicalOnResolve",
    "hardWarOnResolve", "irregularWarOnResolve", "underToldOnResolve",
    "flagshipUnitsOnResolve", "csFinanceOnResolve", "realDiplomacyOnResolve",
    "humanCostOnResolve", "westernTheaterOnResolve", "mrOnResolve", "presOnResolve",
    "cabOnResolve", "cmdOnResolve", "campOnResolve", "lootOnResolve", "decOnResolve",
    "pressOnResolve", "moraleOnResolve", "vicOnResolve", "bridgeOnResolve"];
  let prior = -1;
  for (const name of order) {
    const at = src90.indexOf("typeof " + name);
    need(at > prior, "resolver order moved at " + name);
    prior = at;
  }
  const adv = base.slice(base.indexOf("function campaignAdvance("), base.indexOf("function warWonScreen("));
  need(adv.includes("_t1Resolve(winnerSide, type, B, C, win)"), "campaignAdvance no longer owns one real-result resolve");
  need(count(adv, "_t1Resolve(") === 1, "campaignAdvance resolve count moved");
  need(adv.indexOf("_t1Resolve(") < adv.indexOf("// ---- Funds award ----"), "resolver moved after funds");
  includesAll(lane, ["Calling `_t1Resolve` with invented winner/type/battle data or silently invoking delegated combat would violate"], "Slice-5 dependency rationale");
  return { hooks: order.length, campaignResolveCalls: 1, batchRuntimeAuthorized: false };
});

step("Slices 1-4 runtime owners and protected-boundary hashes are exact", () => {
  const expected = {
    "src/90-president-register.js": "3e9f44a1b9c78e7ff66cab1c4ed79cc839b55914d49fe075fe0ae3ea73e1ba19",
    "src/99-h0-president-desk.js": "dcb3b7341df72dab4dbed54cda75cce1da4ebe4e68b26cec5ce9fb2366b85295",
    "src/109-chief-of-staff.js": "352a326661a3ee1b21db863357a5da794a7a913a512f88b306ac17e274a32b38",
    "src/91-save-slots.js": "8af9f69da1ecb5a7f68a18d945ae1b64059993805bfc870cc7aea439405ba193",
    "src/98-h0-main-menu.js": "eb55217c4b05eb6dd0f0590754aa0ee9d3f8400f65a1e64ce8cb7d15a75ae96c",
    "src/00-manifest.json": "a94ae7f0bd5f09d9749195f88a5517fe4aeb45f41541a958713b1515273c8ace",
    "tools/save-shape.json": "548ab27f7d25aa006922e781ee0cd4d16b666ee070809174cef2719d4a92d33d",
    "build/base.html": "2531e68d2ed34250ba522a358009802076c7f55f54c78c8a560287dfa0bb96e7",
    "civil_war_generals.html": "858ce48499b966b27ee775df1964bab87e47d1791e828655f424eb7f27da47a7"
  };
  for (const [rel, value] of Object.entries(expected)) need(hash(rel) === value, rel + " Slice 4 hash moved");
  return { files: Object.keys(expected).length };
});

step("baseline counts, settings/save law, and UI caps are exact", () => {
  const dataCount = readdirSync(join(ROOT, "data")).filter(name => name.endsWith(".json")).length;
  const tabs = ((src99.match(/var H0_DESK_TABS = \[([\s\S]*?)\n  \];/) || [null, ""])[1].match(/^\s*\["/gm) || []).length;
  const saveShape = JSON.parse(read("tools/save-shape.json"));
  need(dataCount === 65, "data count moved");
  // D540 CF-1 re-pin: D539 enrolled the two LANE-022 probes and moved the release suite 140 -> 142.
  // This probe is a superseded, suite-EXCLUDED LANE-020 DRIVE-era contract probe (its lane was released
  // at D519) and is not a gate, but a stale pin is drift, so the count is re-anchored to the live suite.
  // Its three remaining reds are structural and PREDATE D539, verified against 0829d8d: LANE-020 is
  // CONTRACT not DRIVE after its own D519 release; the manifest is 112 with 116-conquest-state.js last
  // after D523; and src/00-manifest.json's sha256 drifted with it. Those belong to LANE-020 and are
  // deliberately left named rather than rewritten by a lane that does not own them.
  need(suiteRows(vet) === 142, "release suite moved before enrollment");
  need(tabs === 20, "H0 Desk tab count moved");
  need(/var _SL_MAX = 3\b/.test(src91), "named-slot count moved");
  need(/var cap = 3\b/.test(src109), "Chief cap moved");
  need(saveShape.saveVer === 1, "_SAVE_VER contract moved");
  return { data: 65, modules: 111, suite: 142, slots: 3, deskTabs: 20, chiefCap: 3, saveVersion: 1 };
});

step("all known literal/hash pin transitions are declared before runtime", () => {
  includesAll(lane, [
    "probe-open-history-mayhem-plan.mjs",
    "probe-war-career-loop-plan.mjs",
    "probe-conquest-transport-plan.mjs",
    "probe-mayhem-mode.mjs",
    "probe-women-in-war-arc-plan.mjs",
    "probe-war-career.mjs",
    "full-campaign 45/2/16 pacing bounds",
    "War Career row at index 38"
  ], "declared probe-pin inventory");
  return { sourceGamePins: 2, futureSuiteCountPins: 6 };
});

step("Slices 1-4 runtime mode has exactly thirty-one focused teeth and remains suite-excluded", () => {
  const focused = read(focusedRel);
  need(mode === "runtime", "Slice 4 runtime mode missing");
  need(focusedExists, focusedRel + " missing after Slice 4");
  need(runtimeMarker, "ARC 9 Slice 1 runtime marker missing");
  need(slice2Marker, "ARC 9 Slice 2 action/live-tab owners missing");
  need(slice3Marker, "ARC 9 Slice 3 preference owners missing");
  need(count(src91, "function _slBookmarkFingerprint(") === 1 &&
    count(src91, "function _slBookmarkPointer(") === 1 &&
    count(src91, "function _slBookmarkList(") === 1 &&
    count(src91, "function _slLoadSlot(") === 1 &&
    count(src91, "function _slBookmarkOpen(") === 1 &&
    src91.includes("ARC9_BIND_S4:FINGERPRINT_EQUALITY"),
    "Slice 4 bookmark fingerprint/list/shared-loader boundary missing");
  need(count(focused, "step(\"") === 3 && count(focused, "run(\"") === 24 &&
    count(focused, "browserEvidence.push(keyboardRow)") === 1 &&
    count(focused, "browserEvidence.push(deskInputRow)") === 1 &&
    count(focused, "browserEvidence.push(zoomRow)") === 1 &&
    count(focused, "browserEvidence.push(bookmarkInputRow)") === 1,
    "Slice 4 focused probe must carry exactly three static plus twenty-eight browser steps");
  need(!vet.includes(focusedRel), "focused ARC 9 probe must remain unenrolled before Slice 5 release");
  need(read("V1-CHECKLIST.md").includes("[x] Profile turn-processing latency and add honest progress feedback."), "Slice 1 checklist not closed");
  need(read("V1-CHECKLIST.md").includes("[x] Extend Chief of Staff into the live next-action pointer."), "Slice 2 checklist not closed");
  need(read("V1-CHECKLIST.md").includes("[x] Collapse repeated click paths, add one-click re-engagement, and remember safe preferences."), "Slice 3 checklist not closed");
  need(read("V1-CHECKLIST.md").includes("[x] Add session bookmarks."), "Slice 4 checklist not closed");
  return { focusedExists: true, focusedSteps: 31, suiteEnrolled: false, runtimeMarker: true, slice2Marker: true, slice3Marker: true, slice4Marker: true };
});

step("gates, binds, artifacts, and restoration law are complete", () => {
  includesAll(lane, [
    "Bind S1", "Bind S2", "Bind S3", "Bind S4",
    "byte-for-byte", "hash/`cmp`", "ok:true", "failed/page/real errors",
    "Browser gates remain serialized", "git diff --check", "commit/push/fetch/clean parity"
  ], "verification contract");
  return { binds: 4, focusedFinalSteps: 43, browserSerialized: true };
});

const failed = steps.filter(row => !row.ok);
const result = {
  schema: "cw_probe_desk_pacing_plan_v1",
  generatedAt: new Date().toISOString(),
  mode,
  ok: failed.length === 0,
  steps,
  failed: failed.map(row => row.name),
  errors: failed.map(row => row.error),
  pageerrors: [],
  realErrors: [],
  summary: { passed: steps.length - failed.length, total: steps.length }
};
writeFileSync(ART, JSON.stringify(result, null, 2) + "\n");
console.log(`probe-desk-pacing-plan: ${result.summary.passed}/${result.summary.total} steps ok, ${failed.length} fail mode=${mode}`);
if (failed.length) {
  for (const row of failed) console.error("FAIL", row.name, "-", row.error);
  process.exit(1);
}
console.log("ALL OK");
