#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D518 / LANE-020 ARC 9 Slices 1-4: measured resolver pacing, one pure live
// Chief-of-Staff action, one live-registry-validated remembered Desk tab, and
// strict session-bookmark pointers over the existing named-slot authority.
// Writes focused JSON plus normal and 200%-zoom PNG evidence.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = join(HERE, "shots");
const ART = join(OUT, "probe-desk-pacing.json");
const BIND_ART = join(OUT, "probe-desk-pacing-bind-s1.json");
const BIND_S2_ART = join(OUT, "probe-desk-pacing-bind-s2.json");
const BIND_S3_ART = join(OUT, "probe-desk-pacing-bind-s3.json");
const BIND_S4_ART = join(OUT, "probe-desk-pacing-bind-s4.json");
const PNG = join(OUT, "probe-desk-pacing.png");
const ZOOM_PNG = join(OUT, "probe-desk-pacing-zoom-200.png");
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(HERE, "shots.json"), "utf8"));
const read = rel => readFileSync(join(ROOT, rel), "utf8");
const count = (text, token) => text.split(token).length - 1;
const need = (value, message) => { if (!value) throw new Error(message); };
const GL = [
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist", "--enable-webgl", "--disable-dev-shm-usage"
];
const HOOKS = [
  "clkOnResolve", "politicsOnResolve",
  "econOnResolve", "wrOnResolve", "blockadeOnResolve", "prodOnResolve",
  "engOnResolve", "logisticsOnResolve",
  "manpowerOnResolve", "prisonerExchangeOnResolve", "medicalOnResolve",
  "hardWarOnResolve", "irregularWarOnResolve", "underToldOnResolve",
  "flagshipUnitsOnResolve", "csFinanceOnResolve", "realDiplomacyOnResolve",
  "humanCostOnResolve", "westernTheaterOnResolve",
  "mrOnResolve", "presOnResolve", "cabOnResolve", "cmdOnResolve",
  "campOnResolve", "lootOnResolve",
  "decOnResolve", "pressOnResolve", "moraleOnResolve", "vicOnResolve",
  "bridgeOnResolve"
];
const GROUPS = [
  "calendar-politics", "economy-logistics", "human-cost-theaters",
  "leadership-people", "decisions-outcome"
];
const BASELINE = {
  head: "dc1654750079920f365b40ce9eb7e9595483f586",
  resolverSha256: "81e8996cba77b2c38acf22193969eb1999eaf29c3ff002af306c93e4f815e962",
  deskSha256: "2170b60bb648bbddcb7ff77b6ec0c217ff64182d5cfcb3e204a88420d7ce449e",
  battle: "bullrun1",
  freshSamples: 60,
  sequentialSamples: 36,
  freshP95Ms: 25.2,
  sequentialP95Ms: 15.4,
  thresholdMs: 50,
  optimizationDecision: "NOT_NEEDED"
};
const steps = [];
function step(name, fn) {
  try {
    const value = fn();
    steps.push({ name, ok: true, value: value === undefined ? null : value });
  } catch (error) {
    steps.push({ name, ok: false, error: String(error && error.message || error) });
  }
}
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));
function killChild(child) {
  if (!child) return;
  try { child.kill(); } catch (error) {}
}
async function closeBrowserHard(instance) {
  if (!instance) return;
  const proc = typeof instance.process === "function" ? instance.process() : null;
  let closed = false;
  try {
    await Promise.race([
      instance.close().then(() => { closed = true; }, () => { closed = true; }),
      sleep(2500)
    ]);
  } catch (error) {}
  if (!closed && proc && !proc.killed) {
    try { proc.kill("SIGKILL"); } catch (error) {}
  }
}
async function up(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok || response.status === 200;
  } catch (error) {
    return false;
  }
}

const resolverSource = read("src/90-president-register.js");
const deskSource = read("src/99-h0-president-desk.js");
const manifest = JSON.parse(read("src/00-manifest.json"));
const saveShape = JSON.parse(read("tools/save-shape.json"));
const resolveBody = resolverSource.slice(
  resolverSource.indexOf("function _t1Resolve("),
  resolverSource.length
);
const pacingOwner = resolverSource.slice(
  resolverSource.indexOf("/* ARC9_PACING_RUNTIME_V1"),
  resolverSource.indexOf("function _t1Resolve(")
);

step("one live owner preserves the exact 30-hook resolver order", () => {
  need(count(resolverSource, "function _t1Resolve(") === 1, "resolver owner is not singular");
  let prior = -1;
  for (const hook of HOOKS) {
    need(count(resolveBody, "typeof " + hook) === 1, "hook callback count moved at " + hook);
    const at = resolveBody.indexOf("typeof " + hook);
    need(at > prior, "hook order moved at " + hook);
    prior = at;
  }
  need(manifest.modules.length === 111 && manifest.modules.at(-1) === "115-conquest-transport.js", "manifest moved");
  return { hooks: HOOKS.length, modules: manifest.modules.length };
});

step("five contiguous marks are exact and timing remains ephemeral", () => {
  need(count(resolverSource, "ARC9_PACING_RUNTIME_V1") === 1, "runtime marker missing or duplicated");
  let prior = -1;
  for (const group of GROUPS) {
    const token = "_arc9PacingMark(_arc9Run, \"" + group + "\")";
    need(count(resolveBody, token) === 1, "group mark not exact: " + group);
    const at = resolveBody.indexOf(token);
    need(at > prior, "group mark order moved at " + group);
    prior = at;
  }
  need(count(resolveBody, "_arc9PacingMark(_arc9Run,") === 5, "group mark count moved");
  need(resolveBody.indexOf("_arc9PacingFinish(_arc9Run)") > prior, "finish does not follow the fifth mark");
  for (const forbidden of ["G.", "C.", "localStorage", "saveLocal", "RND", "Math.random", "Date.now", "setTimeout", "Promise"]) {
    need(!pacingOwner.includes(forbidden), "ephemeral timing owner contains " + forbidden);
  }
  need(saveShape.saveVer === 1, "save version moved");
  return { groups: GROUPS, saveVersion: saveShape.saveVer };
});

step("fresh untouched baseline earns NOT_NEEDED optimization", () => {
  need(BASELINE.freshSamples === 60 && BASELINE.sequentialSamples === 36, "baseline sample counts moved");
  need(BASELINE.freshP95Ms < BASELINE.thresholdMs, "fresh p95 crosses long-work threshold");
  need(BASELINE.sequentialP95Ms < BASELINE.thresholdMs, "sequential p95 crosses long-work threshold");
  need(BASELINE.optimizationDecision === "NOT_NEEDED", "speculative optimization was authorized");
  need(!/ARC9_PACING_OPTIMIZATION_V1/.test(resolverSource + deskSource), "unearned optimization marker exists");
  return BASELINE;
});

if (process.argv.includes("--bind-s1-static")) {
  const failed = steps.filter(row => row.ok === false);
  const expectedName = "five contiguous marks are exact and timing remains ephemeral";
  const isolated = steps.length === 3 && failed.length === 1 && failed[0].name === expectedName;
  const result = {
    schema: "cw_probe_desk_pacing_bind_s1_v1",
    generatedAt: new Date().toISOString(),
    mode: "bind-s1-static",
    ok: false,
    expectedRed: isolated,
    steps,
    failed: failed.map(row => row.name),
    errors: failed.map(row => row.error),
    pageerrors: [],
    realErrors: [],
    summary: { passed: steps.length - failed.length, total: steps.length }
  };
  writeFileSync(BIND_ART, JSON.stringify(result, null, 2) + "\n");
  console.log("probe-desk-pacing bind-s1-static: " + result.summary.passed + "/" + result.summary.total +
    " steps ok, " + failed.length + " fail expectedRed=" + isolated);
  for (const row of failed) console.error("EXPECTED RED " + row.name + " - " + row.error);
  if (!isolated) {
    console.error("FAIL Bind S1 must isolate only " + expectedName);
    process.exit(2);
  }
  process.exit(1);
}

const probeUrl = cfg.baseUrl + "/" + cfg.file;
let server = null;
let browser = null;
const pageerrors = [];
const realErrors = [];
const benignWarnings = [];
let browserEvidence = null;

try {
  if (!(await up(probeUrl))) {
    server = spawn("python3", ["-m", "http.server", String(cfg.port)], { cwd: ROOT, stdio: "ignore" });
    for (let i = 0; i < 60; i++) {
      if (await up(probeUrl)) break;
      await sleep(150);
    }
  }
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true, args: GL });
  } catch (error) {
    browser = await chromium.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: GL
    });
  }
  const context = await browser.newContext({ viewport: cfg.viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  page.on("pageerror", error => pageerrors.push(String(error && error.message || error)));
  page.on("console", message => {
    if (message.type() === "warning" || message.type() === "error") {
      const line = message.type() + ": " + message.text();
      const location = message.location ? message.location() : {};
      if (/AudioContext was not allowed to start|GL Driver Message/.test(line) ||
          (/Failed to load resource: the server responded with a status of 404/.test(line) && /favicon\.ico$/i.test(location.url || ""))) {
        benignWarnings.push(line);
      } else realErrors.push(line);
    }
  });
  await page.goto(probeUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
  await sleep(500);
  browserEvidence = await page.evaluate(({ groupNames, saveVersion }) => {
    const rows = [];
    let abSeed = null;
    function run(name, fn) {
      try {
        const value = fn();
        rows.push({ name, ok: true, value: value === undefined ? null : value });
      } catch (error) {
        rows.push({ name, ok: false, error: String(error && error.message || error) });
      }
    }
    function requireValue(value, message) {
      if (!value) throw new Error(message);
    }
    function campaign() {
      const C = {
        side: "US", iron: false, idx: 0, funds: 420, recovery: false, completed: [], runId: "arc9-probe-run",
        roster: [{ id: "R1", type: "inf", weapon: "springfield", xp: 1, name: "Core" }],
        nextId: 2, stats: { battles: 0, won: 0, infl: 0, suff: 0 },
        recoveryLossCount: 0, recoveryMode: false, flipAtk: false, captured: []
      };
      G.campaign = C;
      _t1InitAll(C);
      return C;
    }
    function chiefCrisis(C) {
      C.funds = 10;
      C.morale = C.morale || {}; C.morale.public = 20;
      C.manpower = C.manpower || {}; C.manpower.pool = 100;
      C.blockade = C.blockade || {}; C.blockade.recognition = 80;
      C.economy = C.economy || {}; C.economy.lastTurn = { inflRatePct: 25 };
      C.production = C.production || {}; C.production.railIntegrity = 30;
      C.president = C.president || {}; C.president.pendingChoices = ["a", "b"];
      C.president.onboarded = true;
      return C;
    }
    function chiefQuiet(C) {
      C.funds = 200000;
      C.morale = C.morale || {}; C.morale.public = 70;
      C.manpower = C.manpower || {}; C.manpower.pool = 4000;
      C.blockade = C.blockade || {}; C.blockade.recognition = 10;
      C.economy = C.economy || {}; C.economy.lastTurn = { inflRatePct: 2 };
      C.production = C.production || {}; C.production.railIntegrity = 96;
      C.president = C.president || {}; C.president.pendingChoices = [];
      C.president.onboarded = true;
      return C;
    }
    function clearChiefFixture() {
      const prior = document.getElementById("arc9ChiefFixture");
      if (prior) prior.remove();
    }
    function mountChiefFixture(C, tabs) {
      clearChiefFixture();
      const host = document.createElement("div");
      host.id = "arc9ChiefFixture";
      host.innerHTML = cosBriefHtml(C) + '<div id="wdTabs" role="group">'
        + tabs.map(tab => '<button id="wdTab_' + tab + '" type="button">' + tab + '</button>').join("")
        + '</div>';
      document.body.appendChild(host);
      cosWireBrief(C);
      return host;
    }
    function storageBytes() {
      return JSON.stringify(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]));
    }
    function battle() {
      const bd = BATTLES.find(item => item.id === "bullrun1") || BATTLES[0];
      return {
        bd,
        playerSide: "US",
        casualties: { US: 240, CS: 410 },
        infl: { US: 410, CS: 240 },
        units: [],
        captured: []
      };
    }
    function normalizedSave() {
      const save = serializeSave();
      save.when = 0;
      return JSON.stringify(save);
    }
    function clearBookmarkFixture() {
      try { if (typeof closeSheet === "function") closeSheet(); } catch (error) {}
      for (let i = 0; i < 3; i++) localStorage.removeItem("gor_slot_" + i);
      localStorage.removeItem("gor_undo_last");
      localStorage.removeItem("gor_save");
      G.settings = { gfx: "classic", diff: 1, speed: 1 };
      G.campaign = null;
    }
    function bookmarkFixture(slot) {
      clearBookmarkFixture();
      slot = typeof slot === "number" ? slot : 0;
      const C = campaign();
      C.runId = "arc9-bookmark-run";
      C.side = "US";
      C.iron = false;
      if (typeof mayhemInit === "function") mayhemInit(C, "historical", "new");
      requireValue(_slBookmarkRuleset(C) === "historical", "fixture ruleset authority missing");
      G.settings = { gfx: "classic", diff: 1, speed: 1, unrelatedBookmarkProbe: { keep: true } };
      G.campaign = C;
      saveLocal();
      const save = JSON.parse(JSON.stringify(serializeSave()));
      save.slotName = "March Checkpoint";
      save.when = 1710000000000;
      requireValue(_slWrite(slot, save), "fixture named-slot write failed");
      return { slot, C, save, slotKey: "gor_slot_" + slot };
    }
    function reversedKeys(value) {
      if (Array.isArray(value)) return value.map(reversedKeys);
      if (!value || typeof value !== "object") return value;
      const out = {};
      for (const key of Object.keys(value).sort().reverse()) out[key] = reversedKeys(value[key]);
      return out;
    }
    function bookmarkOracleCanonical(value) {
      if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
        const scalar = JSON.stringify(value);
        return typeof scalar === "string" ? scalar : null;
      }
      if (Array.isArray(value)) {
        const items = value.map(bookmarkOracleCanonical);
        return items.includes(null) ? null : "[" + items.join(",") + "]";
      }
      if (!value || typeof value !== "object") return null;
      const pairs = [];
      for (const key of Object.keys(value).sort()) {
        const nested = bookmarkOracleCanonical(value[key]);
        if (nested === null) return null;
        pairs.push(JSON.stringify(key) + ":" + nested);
      }
      return "{" + pairs.join(",") + "}";
    }
    function bookmarkOracleHash(text) {
      let value = 2166136261;
      for (let i = 0; i < text.length; i++) {
        value ^= text.charCodeAt(i);
        value = Math.imul(value, 16777619);
      }
      return value >>> 0;
    }
    function bookmarkOracleHex(value) {
      return ("00000000" + (value >>> 0).toString(16)).slice(-8);
    }
    function bookmarkOracleFingerprint(save) {
      const copy = JSON.parse(JSON.stringify(save));
      if (Object.prototype.hasOwnProperty.call(copy, "slotName")) delete copy.slotName;
      if (Object.prototype.hasOwnProperty.call(copy, "when")) delete copy.when;
      const canonical = bookmarkOracleCanonical(copy);
      requireValue(canonical !== null, "independent bookmark oracle could not canonicalize the fixture");
      return { canonical, fingerprint:"v1:" + canonical.length + ":" +
        bookmarkOracleHex(bookmarkOracleHash("arc9-a|" + canonical)) + ":" +
        bookmarkOracleHex(bookmarkOracleHash("arc9-b|" + canonical)) };
    }
    function countedBookmarkOpen(position) {
      const originalApply = applySave;
      const originalConfirm = window.confirm;
      let applyCalls = 0, confirmCalls = 0, result;
      applySave = function () { applyCalls += 1; return originalApply.apply(this, arguments); };
      window.confirm = function () { confirmCalls += 1; return true; };
      try { result = _slBookmarkOpen(position); }
      finally { applySave = originalApply; window.confirm = originalConfirm; }
      return { result, applyCalls, confirmCalls };
    }
    function receipts(C) {
      const out = [];
      function walk(value, path, depth) {
        if (!value || typeof value !== "object" || depth > 6) return;
        for (const key of Object.keys(value).sort()) {
          const next = path ? path + "." + key : key;
          if (/receipt|dispatch|log/i.test(key)) out.push([next, JSON.stringify(value[key])]);
          else walk(value[key], next, depth + 1);
        }
      }
      walk(C, "", 0);
      return JSON.stringify(out);
    }
    function byteDifference(a, b) {
      var n = Math.min(a.length, b.length), at = 0;
      while (at < n && a.charCodeAt(at) === b.charCodeAt(at)) at++;
      return "byte " + at + " enabled=" + a.slice(Math.max(0, at - 60), at + 140) +
        " disabled=" + b.slice(Math.max(0, at - 60), at + 140);
    }
    function resolveOnce(enabled) {
      arc9PacingSetEnabled(enabled);
      G.settings = { gfx: "classic", diff: 1, speed: 1 };
      const C = abSeed ? JSON.parse(abSeed) : campaign();
      G.campaign = C;
      const settingsBefore = JSON.stringify(G.settings);
      RND = mulberry(0x51ce);
      const mathRandom = mulberry(0x51ce);
      const originalMathRandom = Math.random;
      Math.random = function () { return mathRandom(); };
      try {
        _t1Resolve("US", "decisive", battle(), C, true);
      } finally {
        Math.random = originalMathRandom;
      }
      const rngTail = [RND(), RND(), RND()];
      const mathTail = [mathRandom(), mathRandom(), mathRandom()];
      return {
        campaign: JSON.stringify(C),
        settingsBefore,
        settingsAfter: JSON.stringify(G.settings),
        save: normalizedSave(),
        receipts: receipts(C),
        rngTail,
        mathTail,
        snapshot: arc9PacingSnapshot()
      };
    }
    G.settings = G.settings || {};
    G.settings.gfx = "classic";
    G.mode = "menu";
    abSeed = JSON.stringify(campaign());

    run("runtime snapshot has five finite nonnegative groups and is copy-safe", () => {
      const enabled = resolveOnce(true);
      const snap = enabled.snapshot;
      requireValue(snap && snap.completed === true, "enabled resolve produced no completed snapshot");
      requireValue(snap.groups.length === 5, "snapshot group count is not five");
      requireValue(snap.groups.map(row => row.name).join("|") === groupNames.join("|"), "snapshot group order moved");
      for (const row of snap.groups) {
        requireValue(typeof row.ms === "number" && isFinite(row.ms) && row.ms >= 0, "invalid timing for " + row.name);
      }
      requireValue(typeof snap.totalMs === "number" && isFinite(snap.totalMs) && snap.totalMs >= 0, "invalid total");
      snap.groups[0].name = "mutated-reader-copy";
      requireValue(arc9PacingSnapshot().groups[0].name === groupNames[0], "snapshot reader leaked mutable authority");
      return arc9PacingSnapshot();
    });

    run("enabled and disabled paths preserve campaign RNG receipts settings and serialization", () => {
      const enabled = resolveOnce(true);
      const disabled = resolveOnce(false);
      requireValue(disabled.snapshot === null, "disabled resolver retained timing state");
      for (const key of ["campaign", "settingsBefore", "settingsAfter", "save", "receipts", "rngTail", "mathTail"]) {
        const a = JSON.stringify(enabled[key]), b = JSON.stringify(disabled[key]);
        requireValue(a === b, key + " differs between A/B paths: " + byteDifference(a, b));
      }
      requireValue(enabled.settingsBefore === enabled.settingsAfter, "enabled timing wrote settings");
      requireValue(disabled.settingsBefore === disabled.settingsAfter, "disabled timing wrote settings");
      arc9PacingSetEnabled(true);
      return { campaignBytes: enabled.campaign.length, saveBytes: enabled.save.length, receiptBytes: enabled.receipts.length };
    });

    run("50 ms threshold is exact and short or disabled work renders no status", () => {
      requireValue(arc9PacingIsLong(49.999) === false, "sub-threshold value classified long");
      requireValue(arc9PacingIsLong(50) === true, "50 ms boundary did not classify long");
      const originalReader = arc9PacingSnapshot;
      arc9PacingSnapshot = function () {
        return {
          completed: true, totalMs: 49.999, thresholdMs: 50, long: false,
          groups: groupNames.map(name => ({ name, ms: 1 }))
        };
      };
      try {
        campaign();
        openWarDept();
        requireValue(!document.querySelector(".h0-desk-pacing-status"), "short work rendered a status");
      } finally {
        if (typeof closeSheet === "function") closeSheet();
        arc9PacingSnapshot = originalReader;
      }
      return { below: arc9PacingIsLong(49.999), boundary: arc9PacingIsLong(50), status: "absent" };
    });

    run("actual long resolver work surfaces one semantic non-color completion status", () => {
      arc9PacingSetEnabled(true);
      const C = campaign();
      const original = moraleOnResolve;
      moraleOnResolve = function () {
        const until = performance.now() + 55;
        while (performance.now() < until) {}
        return original.apply(this, arguments);
      };
      try {
        _t1Resolve("US", "decisive", battle(), C, true);
      } finally {
        moraleOnResolve = original;
      }
      const snap = arc9PacingSnapshot();
      requireValue(snap && snap.long && snap.totalMs >= 50, "forced long work did not cross threshold");
      openWarDept();
      const status = document.querySelector(".h0-desk-pacing-status");
      requireValue(status, "long work status missing");
      requireValue(status.getAttribute("role") === "status", "status role missing");
      requireValue(!status.hasAttribute("aria-live"), "role=status should own implicit polite semantics without duplicate aria-live");
      requireValue(!status.hasAttribute("aria-label"), "author label must not obscure the visible status text");
      requireValue(status.getAttribute("aria-atomic") === "true", "atomic live semantics missing");
      requireValue(/Strategic resolution complete/.test(status.textContent), "plain completion meaning missing");
      requireValue(/\d+ ms/.test(status.textContent), "measured duration missing");
      requireValue(!/%/.test(status.textContent), "fake percentage surfaced");
      requireValue(document.querySelectorAll(".h0-desk-pacing-status").length === 1, "status duplicated");
      return { totalMs: snap.totalMs, text: status.textContent.trim() };
    });

    run("reduced motion and focus stay safe", () => {
      const status = document.querySelector(".h0-desk-pacing-status");
      requireValue(status, "status precondition missing");
      const style = getComputedStyle(status);
      const animationName = style.animationName;
      const transitionDuration = style.transitionDuration;
      requireValue(animationName === "none", "status uses animation under reduced motion");
      requireValue(transitionDuration === "0s", "status uses a transition under reduced motion");
      requireValue(!status.hasAttribute("tabindex") && !status.hasAttribute("autofocus"), "status can steal focus");
      if (typeof closeSheet === "function") closeSheet();
      const probeButton = document.createElement("button");
      probeButton.id = "arc9FocusSentinel";
      probeButton.textContent = "Focus sentinel";
      document.body.appendChild(probeButton);
      probeButton.focus();
      const before = document.activeElement;
      _t1Resolve("US", "win", battle(), campaign(), true);
      requireValue(document.activeElement === before, "resolver timing moved focus");
      probeButton.remove();
      arc9PacingSetEnabled(true);
      const screenshotCampaign = campaign();
      const original = moraleOnResolve;
      moraleOnResolve = function () {
        const until = performance.now() + 55;
        while (performance.now() < until) {}
        return original.apply(this, arguments);
      };
      try {
        _t1Resolve("US", "decisive", battle(), screenshotCampaign, true);
      } finally {
        moraleOnResolve = original;
      }
      openWarDept();
      requireValue(document.querySelector(".h0-desk-pacing-status"), "screenshot status missing");
      return {
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        animationName,
        transitionDuration,
        focusRetained: true
      };
    });

    run("Chief unique top priority materializes exactly one action and lower facts stay plain", () => {
      if (typeof closeSheet === "function") closeSheet();
      const C = chiefCrisis(campaign());
      openWarDept();
      const panel = document.getElementById("cosBrief");
      const action = cosNextAction(C);
      requireValue(panel && action, "Chief action precondition missing");
      const facts = panel.querySelectorAll("[data-cos-rule]");
      const buttons = panel.querySelectorAll("button[data-costab]");
      requireValue(facts.length === 3, "Chief brief did not preserve three priority facts");
      requireValue(buttons.length === 1, "Chief brief did not expose exactly one action");
      requireValue(action.id === "cos-decisions" && action.tab === "decisions", "unique top priority moved");
      requireValue(buttons[0].getAttribute("data-cos-rule") === action.id, "action is not the top fact");
      requireValue(facts[0] === buttons[0], "top priority is not first");
      requireValue(!facts[1].querySelector("button") && !facts[2].querySelector("button"), "lower facts became actionable");
      return { facts: facts.length, actions: buttons.length, target: action.tab };
    });

    run("Chief ties invalid candidates and all-quiet reads fall back deterministically", () => {
      if (typeof closeSheet === "function") closeSheet();
      const C = chiefCrisis(campaign());
      const originalLines = cosBriefLines;
      let tieHtml = "";
      try {
        cosBriefLines = function () {
          return [
            { id: "tie-a", severity: 90, tab: "decisions", label: "Decisions", copy: "First equal fact." },
            { id: "tie-b", severity: 90, tab: "treasury", label: "Treasury", copy: "Second equal fact." }
          ];
        };
        tieHtml = cosBriefHtml(C);
        requireValue(tieHtml === cosBriefHtml(C), "equal-priority fallback bytes changed");
        let host = mountChiefFixture(C, ["decisions", "treasury"]);
        requireValue(cosNextAction(C) === null, "equal top priority produced authority");
        requireValue(!host.querySelector("button[data-costab]"), "equal top priority rendered an action");
        requireValue(host.querySelector("[data-cos-orientation]") && !host.querySelector("[data-cos-orientation]").hidden,
          "equal top priority omitted neutral orientation");

        cosBriefLines = function () {
          return [{ id: "bad", severity: 90, tab: "not-live", label: "Invalid", copy: "Invalid candidate." }];
        };
        host = mountChiefFixture(C, ["decisions"]);
        requireValue(cosNextAction(C) === null, "invalid target produced authority");
        requireValue(!host.querySelector("button[data-costab]"), "invalid target rendered an action");
        requireValue(host.querySelector("[data-cos-orientation]") && !host.querySelector("[data-cos-orientation]").hidden,
          "invalid target omitted neutral orientation");
      } finally {
        cosBriefLines = originalLines;
        clearChiefFixture();
      }

      const quiet = chiefQuiet(campaign());
      const quietOne = cosBriefHtml(quiet), quietTwo = cosBriefHtml(quiet);
      requireValue(quietOne === quietTwo, "all-quiet bytes changed");
      requireValue(cosNextAction(quiet) === null && quietOne.indexOf("data-costab") < 0,
        "all-quiet state produced an action");
      return { tieDeterministic: true, invalidNeutral: true, quietDeterministic: true };
    });

    run("Chief derivation render and wire preserve deep state save settings storage and RNG", () => {
      if (typeof closeSheet === "function") closeSheet();
      clearChiefFixture();
      const C = chiefCrisis(campaign());
      G.campaign = C;
      const before = {
        campaign: JSON.stringify(C), save: normalizedSave(), settings: JSON.stringify(G.settings), storage: storageBytes()
      };
      const domainNames = ["econRenderFinance", "blockadeRenderDiplomacy", "decRenderTab", "moraleCompute",
        "logisticsSnapshot", "econInit", "blockadeInit", "decInit", "realDiplomacySnapshot"];
      const originals = {}, domainCalls = [];
      for (const name of domainNames) {
        if (typeof globalThis[name] === "function") {
          originals[name] = globalThis[name];
          globalThis[name] = function () { domainCalls.push(name); throw new Error("domain renderer called: " + name); };
        }
      }
      const expectedRng = mulberry(0xc051), expectedRngTail = [expectedRng(), expectedRng(), expectedRng()];
      const expectedMath = mulberry(0xc052), expectedMathTail = [expectedMath(), expectedMath(), expectedMath()];
      const originalMathRandom = Math.random;
      RND = mulberry(0xc051);
      const mathStream = mulberry(0xc052);
      Math.random = function () { return mathStream(); };
      try {
        cosBriefLines(C);
        cosNextAction(C);
        cosBriefHtml(C);
        mountChiefFixture(C, ["decisions", "treasury", "economy"]);
      } finally {
        Math.random = originalMathRandom;
        for (const name of Object.keys(originals)) globalThis[name] = originals[name];
      }
      const rngTail = [RND(), RND(), RND()];
      const mathTail = [mathStream(), mathStream(), mathStream()];
      const after = {
        campaign: JSON.stringify(C), save: normalizedSave(), settings: JSON.stringify(G.settings), storage: storageBytes()
      };
      for (const key of Object.keys(before)) requireValue(before[key] === after[key], key + " changed during Chief read/wire");
      requireValue(JSON.stringify(rngTail) === JSON.stringify(expectedRngTail), "RND stream advanced");
      requireValue(JSON.stringify(mathTail) === JSON.stringify(expectedMathTail), "Math.random stream advanced");
      requireValue(domainCalls.length === 0, "domain renderer invoked: " + domainCalls.join(","));
      clearChiefFixture();
      return { campaignBytes: before.campaign.length, saveBytes: before.save.length, domainCalls: 0, rngStable: true };
    });

    run("Chief valid action routes once through the native Desk tab path", () => {
      if (typeof closeSheet === "function") closeSheet();
      const C = chiefCrisis(campaign());
      openWarDept();
      const button = document.querySelector("#cosBrief button[data-costab]");
      requireValue(button && button.getAttribute("data-costab") === "decisions", "valid Chief action missing");
      const originalRefresh = _wdRefresh;
      let refreshes = 0;
      _wdRefresh = function () { refreshes += 1; return originalRefresh.apply(this, arguments); };
      try { button.click(); } finally { _wdRefresh = originalRefresh; }
      const nativeTab = document.getElementById("wdTab_decisions");
      requireValue(refreshes === 1, "Chief action did not use exactly one refresh");
      requireValue(_wdTab === "decisions", "Chief action did not set the existing tab owner");
      requireValue(nativeTab && nativeTab.getAttribute("aria-pressed") === "true", "native destination did not become active");
      return { target: _wdTab, refreshes };
    });

    run("Chief stale target fails neutral with no action", () => {
      if (typeof closeSheet === "function") closeSheet();
      const C = chiefCrisis(campaign());
      let host = mountChiefFixture(C, ["treasury", "economy"]);
      try {
        let orientation = host.querySelector("[data-cos-orientation]");
        requireValue(!host.querySelector("button[data-costab]"), "stale target retained a live action");
        requireValue(orientation && !orientation.hidden, "stale target omitted neutral orientation");
        requireValue(!host.querySelector("[data-cos-candidate]"), "stale candidate retained latent authority");

        clearChiefFixture();
        host = mountChiefFixture(C, ["decisions", "treasury", "economy"]);
        const action = host.querySelector("button[data-costab=\"decisions\"]");
        const target = document.getElementById("wdTab_decisions");
        requireValue(action && target, "post-wire stale fixture did not begin live");
        action.focus();
        target.remove();
        action.click();
        orientation = host.querySelector("[data-cos-orientation]");
        const plainFact = host.querySelector("[data-cos-rule=\"cos-decisions\"]");
        requireValue(!host.querySelector("button[data-costab]"), "post-wire stale target retained a live action");
        requireValue(plainFact && plainFact.tagName === "DIV",
          "post-wire stale action did not demote to a plain fact");
        requireValue(orientation && !orientation.hidden, "post-wire stale target omitted neutral orientation");
        requireValue(!plainFact.hasAttribute("tabindex") && !orientation.hasAttribute("tabindex") &&
          document.activeElement !== plainFact && document.activeElement !== orientation,
          "stale fallback manufactured or forced a replacement focus target");
        return { targetPresent: false, actions: 0, neutral: true, postWireDemoted: true,
          replacementFocusForced: false };
      } finally {
        clearChiefFixture();
      }
    });

    run("remembered tab cuts both Desk return paths from two clicks to one", () => {
      if (typeof closeSheet === "function") closeSheet();
      _pdAfterDeskClose = null;
      G.settings = { gfx: "classic", diff: 1, speed: 1 };
      const C = campaign();
      C.president.onboarded = true;
      const defaultTab = psDefaultDeskTab();
      const preferred = defaultTab === "decisions" ? "treasury" : "decisions";
      delete G.settings.arc9DeskTab;
      saveLocal();

      openMainMenu();
      const baselineDesk = document.getElementById("gnWarDept");
      requireValue(baselineDesk, "saved-campaign Desk control missing");
      let baselineClicks = 0;
      baselineDesk.click(); baselineClicks += 1;
      requireValue(_wdTab === defaultTab, "absent preference did not open the current default");
      const preferredTab = document.getElementById("wdTab_" + preferred);
      requireValue(preferredTab, "preferred native tab missing");
      preferredTab.click(); baselineClicks += 1;
      requireValue(_wdTab === preferred && G.settings.arc9DeskTab === preferred,
        "second baseline click did not select and remember the preferred tab");
      requireValue(baselineClicks === 2, "baseline Desk-plus-tab path was not two clicks");

      _pdAfterDeskClose = null;
      closeSheet();
      openMainMenu();
      const returningDesk = document.getElementById("gnWarDept");
      requireValue(returningDesk, "returning main-menu Desk control missing");
      let menuClicks = 0;
      returningDesk.click(); menuClicks += 1;
      let active = document.getElementById("wdTab_" + preferred);
      requireValue(menuClicks === 1 && _wdTab === preferred && active && active.getAttribute("aria-pressed") === "true",
        "main-menu return did not land on the remembered tab in one click");

      _pdAfterDeskClose = null;
      closeSheet();
      _pdShowTurnInterstitial();
      const interstitialDesk = document.getElementById("pdGoDesk");
      requireValue(interstitialDesk, "turn-interstitial Desk control missing");
      let interstitialClicks = 0;
      interstitialDesk.click(); interstitialClicks += 1;
      active = document.getElementById("wdTab_" + preferred);
      requireValue(interstitialClicks === 1 && _wdTab === preferred && active && active.getAttribute("aria-pressed") === "true",
        "turn-interstitial return did not land on the remembered tab in one click");
      _pdAfterDeskClose = null;
      closeSheet();
      return { defaultTab, preferred, baselineClicks, menuClicks, interstitialClicks };
    });

    run("native selection writes only one validated setting through the existing save envelope", () => {
      if (typeof closeSheet === "function") closeSheet();
      _pdAfterDeskClose = null;
      G.settings = { gfx: "classic", diff: 1, speed: 1 };
      const C = campaign();
      C.president.onboarded = true;
      delete G.settings.arc9DeskTab;
      saveLocal();
      openWarDept();

      const target = "treasury";
      const button = document.getElementById("wdTab_" + target);
      requireValue(button, "validated native target missing");
      const settingsBefore = JSON.stringify(G.settings);
      const campaignBefore = JSON.stringify(C);
      const storageKeysBefore = JSON.stringify(Object.keys(localStorage).sort());
      const originalSave = saveLocal;
      let saveCalls = 0;
      saveLocal = function () { saveCalls += 1; return originalSave.apply(this, arguments); };
      try { button.click(); } finally { saveLocal = originalSave; }

      const before = JSON.parse(settingsBefore);
      const after = JSON.parse(JSON.stringify(G.settings));
      const added = Object.keys(after).filter(key => !Object.prototype.hasOwnProperty.call(before, key));
      const afterWithoutPreference = JSON.parse(JSON.stringify(after));
      delete afterWithoutPreference.arc9DeskTab;
      const stored = JSON.parse(localStorage.getItem("gor_save") || "null");
      requireValue(saveCalls === 1, "native selection did not use exactly one existing saveLocal write");
      requireValue(added.length === 1 && added[0] === "arc9DeskTab" && after.arc9DeskTab === target,
        "selection wrote more than the one Desk preference");
      requireValue(JSON.stringify(afterWithoutPreference) === settingsBefore,
        "a pre-existing setting changed during Desk preference selection");
      requireValue(stored && stored.ver === 1 && stored.settings.arc9DeskTab === target,
        "existing settings envelope did not carry the validated target");
      requireValue(JSON.stringify(stored.settings) === JSON.stringify(after),
        "stored settings diverged from the live settings envelope");
      requireValue(JSON.stringify(stored.campaign) === campaignBefore,
        "the preference save captured campaign bytes beyond the pre-refresh baseline");
      requireValue(JSON.stringify(Object.keys(localStorage).sort()) === storageKeysBefore,
        "preference created a second storage key");
      _pdAfterDeskClose = null;
      closeSheet();
      return { target, saveCalls, added, storageKeys: JSON.parse(storageKeysBefore) };
    });

    run("old save without a preference retains the play-style Desk default", () => {
      if (typeof closeSheet === "function") closeSheet();
      _pdAfterDeskClose = null;
      G.settings = { gfx: "classic", diff: 1, speed: 1, playStyle: "commander" };
      const C = campaign();
      C.president.onboarded = true;
      delete G.settings.arc9DeskTab;
      const oldSave = JSON.parse(JSON.stringify(serializeSave()));
      oldSave.when = 0;
      delete oldSave.settings.arc9DeskTab;
      const oldBytes = JSON.stringify(oldSave);
      localStorage.setItem("gor_save", oldBytes);
      G.campaign = null;
      G.settings = { gfx: "classic", diff: 1, speed: 1 };
      const originalSave = saveLocal;
      let saveCalls = 0;
      saveLocal = function () { saveCalls += 1; return originalSave.apply(this, arguments); };
      try { openWarDept(); } finally { saveLocal = originalSave; }
      const expected = psDefaultDeskTab();
      requireValue(expected === "command" && _wdTab === expected,
        "old-save landing did not retain psDefaultDeskTab");
      requireValue(!Object.prototype.hasOwnProperty.call(G.settings, "arc9DeskTab"),
        "absent old-save preference was manufactured");
      requireValue(saveCalls === 0 && localStorage.getItem("gor_save") === oldBytes,
        "opening an old save repaired or rewrote it");
      _pdAfterDeskClose = null;
      closeSheet();
      return { expected, landed: _wdTab, saveCalls, repaired: false };
    });

    run("invalid or removed preference falls neutral without repair", () => {
      if (typeof closeSheet === "function") closeSheet();
      _pdAfterDeskClose = null;
      const stale = "removed-office";
      G.settings = { gfx: "classic", diff: 1, speed: 1, playStyle: "commander", arc9DeskTab: stale };
      const C = campaign();
      C.president.onboarded = true;
      saveLocal();
      const staleBytes = localStorage.getItem("gor_save");
      const expected = psDefaultDeskTab();
      const originalSave = saveLocal;
      let saveCalls = 0;
      saveLocal = function () { saveCalls += 1; return originalSave.apply(this, arguments); };
      try { openWarDept(); } finally { saveLocal = originalSave; }
      try {
        requireValue(expected === "command" && _wdTab === expected,
          "invalid preference did not fall back to the current default");
        requireValue(G.settings.arc9DeskTab === stale, "invalid preference was repaired in memory");
        requireValue(saveCalls === 0 && localStorage.getItem("gor_save") === staleBytes,
          "invalid preference was repaired in storage");
        return { stale, expected, landed: _wdTab, saveCalls, repaired: false };
      } finally {
        _pdAfterDeskClose = null;
        closeSheet();
      }
    });

    run("pre-onboarded A B paths preserve campaign and save authority against the existing landing", () => {
      if (typeof closeSheet === "function") closeSheet();
      _pdAfterDeskClose = null;
      G.settings = { gfx: "classic", diff: 1, speed: 1, playStyle: "commander" };
      const seedCampaign = campaign();
      seedCampaign.president.onboarded = true;
      const seed = JSON.stringify(seedCampaign);
      const saveOwner = saveLocal;
      const serializeOwner = serializeSave;

      function exercise(preferred) {
        if (typeof closeSheet === "function") closeSheet();
        _pdAfterDeskClose = null;
        G.settings = { gfx: "classic", diff: 1, speed: 1, playStyle: "commander" };
        if (preferred) G.settings.arc9DeskTab = "command";
        G.campaign = JSON.parse(seed);
        requireValue(G.campaign.president.onboarded === true, "A/B fixture was not pre-onboarded");
        const storageBefore = storageBytes();
        const ownerBefore = saveLocal;
        openWarDept();
        const serialized = serializeSave();
        const result = {
          tab: _wdTab,
          campaign: JSON.stringify(G.campaign),
          saveCampaign: JSON.stringify(serialized.campaign),
          storageStable: storageBytes() === storageBefore,
          ownerStable: saveLocal === ownerBefore && saveLocal === saveOwner && serializeSave === serializeOwner,
          onboarded: G.campaign.president.onboarded,
          preferencePresent: Object.prototype.hasOwnProperty.call(G.settings, "arc9DeskTab")
        };
        _pdAfterDeskClose = null;
        closeSheet();
        return result;
      }

      const baselinePath = exercise(false);
      const preferredPath = exercise(true);
      requireValue(baselinePath.tab === "command" && preferredPath.tab === "command",
        "A/B paths did not land on the same current default tab");
      requireValue(baselinePath.campaign === preferredPath.campaign &&
        baselinePath.saveCampaign === preferredPath.saveCampaign,
        "remembered landing added campaign or save-campaign mutation");
      requireValue(baselinePath.storageStable && preferredPath.storageStable,
        "opening either landing path wrote storage");
      requireValue(baselinePath.ownerStable && preferredPath.ownerStable,
        "save authority identity moved from the baseline owners");
      requireValue(baselinePath.onboarded === true && preferredPath.onboarded === true,
        "pre-onboarded assignment changed authority");
      requireValue(!baselinePath.preferencePresent && preferredPath.preferencePresent,
        "A/B preference fixture did not isolate the one setting");
      return { tab: "command", campaignBytes: baselinePath.campaign.length,
        saveCampaignBytes: baselinePath.saveCampaign.length, ownerStable: true, storageStable: true };
    });

    run("bookmark pointers are six-field metadata only and preserve three-slot save version one", () => {
      let originalSave = null;
      try {
        const fixture = bookmarkFixture(0);
        const oracleTarget = JSON.parse(localStorage.getItem(fixture.slotKey));
        oracleTarget.campaign.arc9FingerprintOracle = { nested:"Caf\u00e9 \ud83c\udf96\ufe0f authority", order:["first", "second"] };
        localStorage.setItem(fixture.slotKey, JSON.stringify(oracleTarget));
        fixture.save = oracleTarget;
        const slotBefore = localStorage.getItem(fixture.slotKey);
        const keysBefore = JSON.stringify(Object.keys(localStorage).sort());
        originalSave = saveLocal;
        let saveCalls = 0;
        saveLocal = function () { saveCalls += 1; return originalSave.apply(this, arguments); };
        const made = _slBookmarkCreate(0, "  March   Headquarters  ");
        const list = _slBookmarkList();
        const pointer = list && list[0];
        const stored = JSON.parse(localStorage.getItem("gor_save") || "null");
        requireValue(made.ok && made.changed && saveCalls === 1, "bookmark creation did not use one existing settings-envelope write");
        requireValue(list && list.length === 1 && Object.keys(pointer).sort().join("|") ===
          "fingerprint|label|ruleset|runId|side|slot", "pointer is not the exact six-field shape");
        requireValue(pointer.label === "March Headquarters" && pointer.slot === 0 &&
          pointer.runId === fixture.C.runId && pointer.side === "US" && pointer.ruleset === "historical",
          "pointer metadata was not cleaned and authority-bound");
        requireValue(/^v1:\d+:[0-9a-f]{8}:[0-9a-f]{8}$/.test(pointer.fingerprint), "fingerprint shape moved");
        const oracle = bookmarkOracleFingerprint(oracleTarget);
        requireValue(pointer.fingerprint === oracle.fingerprint,
          "fingerprint moved from the independent canonical UTF-16/FNV-1a oracle");
        requireValue(new TextEncoder().encode(oracle.canonical).length !== oracle.canonical.length,
          "non-ASCII fixture did not distinguish UTF-16 length from byte length");
        requireValue(Object.keys(pointer).every(key => pointer[key] === null || typeof pointer[key] !== "object"),
          "pointer contains a nested save/campaign/settings snapshot");
        requireValue(!("campaign" in pointer) && !("settings" in pointer) && !("save" in pointer) && !("when" in pointer),
          "pointer contains save-envelope authority");
        requireValue(localStorage.getItem(fixture.slotKey) === slotBefore, "bookmark creation rewrote the named slot");
        requireValue(JSON.stringify(Object.keys(localStorage).sort()) === keysBefore, "bookmark creation added a storage key");
        requireValue(stored && stored.settings && JSON.stringify(stored.settings.arc9SessionBookmarks) === JSON.stringify(list),
          "bookmark did not persist only through the existing settings envelope");
        requireValue(_SL_MAX === 3 && _SAVE_VER === saveVersion && saveVersion === 1 &&
          fixture.save.ver === 1 && _slValidSave(fixture.save), "slot count or save-shape/version identity moved");
        requireValue(G.settings.unrelatedBookmarkProbe.keep === true, "unrelated setting moved");
        return { fields:Object.keys(pointer).sort(), label:pointer.label, slots:_SL_MAX, saveVersion:_SAVE_VER,
          storageKeys:JSON.parse(keysBefore), saveCalls, fingerprint:oracle.fingerprint,
          utf16Length:oracle.canonical.length, utf8Length:new TextEncoder().encode(oracle.canonical).length };
      } finally {
        if (originalSave) saveLocal = originalSave;
        clearBookmarkFixture();
      }
    });

    run("valid bookmark create and open are invariant to object key order", () => {
      try {
        const fixture = bookmarkFixture(0);
        const made = _slBookmarkCreate(0, "Advance Line");
        requireValue(made.ok, "valid bookmark creation failed");
        const pointer = _slBookmarkList()[0];
        const reordered = reversedKeys(JSON.parse(localStorage.getItem(fixture.slotKey)));
        localStorage.setItem(fixture.slotKey, JSON.stringify(reordered));
        requireValue(_slBookmarkFingerprint(_slRead(0)) === pointer.fingerprint,
          "canonical fingerprint changed with object key order");
        const opened = countedBookmarkOpen(0);
        requireValue(opened.result.ok && opened.applyCalls === 1 && opened.confirmCalls === 1,
          "valid canonical bookmark did not use one confirmed atomic apply");
        requireValue(G.campaign && G.campaign.runId === pointer.runId && G.campaign.side === pointer.side,
          "valid bookmark did not restore its bound campaign");
        return { canonical:true, applyCalls:opened.applyCalls, confirmCalls:opened.confirmCalls,
          runId:G.campaign.runId };
      } finally { clearBookmarkFixture(); }
    });

    run("top-level slot rename and timestamp changes do not stale a bookmark", () => {
      try {
        const fixture = bookmarkFixture(0);
        requireValue(_slBookmarkCreate(0, "Display-neutral").ok, "bookmark setup failed");
        const pointer = _slBookmarkList()[0];
        const changed = JSON.parse(localStorage.getItem(fixture.slotKey));
        changed.slotName = "Renamed Display Only";
        changed.when = 1999999999999;
        localStorage.setItem(fixture.slotKey, JSON.stringify(changed));
        requireValue(_slBookmarkFingerprint(_slRead(0)) === pointer.fingerprint,
          "display-only top-level fields entered the fingerprint");
        const opened = countedBookmarkOpen(0);
        requireValue(opened.result.ok && opened.applyCalls === 1,
          "rename/timestamp-tolerant bookmark did not open");
        return { rename:changed.slotName, when:changed.when, fingerprintStable:true, applyCalls:1 };
      } finally { clearBookmarkFixture(); }
    });

    run("deleted or missing bookmark targets fail closed and leave the pointer inert", () => {
      try {
        bookmarkFixture(0);
        requireValue(_slBookmarkCreate(0, "Delete boundary").ok, "bookmark setup failed");
        const pointerBefore = JSON.stringify(G.settings.arc9SessionBookmarks);
        _slDelete(0);
        const storageBefore = storageBytes();
        const opened = countedBookmarkOpen(0);
        requireValue(!opened.result.ok && opened.applyCalls === 0 && opened.confirmCalls === 0,
          "missing target reached confirmation or apply");
        requireValue(JSON.stringify(G.settings.arc9SessionBookmarks) === pointerBefore,
          "missing target silently repaired bookmark metadata");
        requireValue(storageBytes() === storageBefore, "missing target failure wrote storage");
        return { rejected:true, applyCalls:0, confirmCalls:0, repaired:false };
      } finally { clearBookmarkFixture(); }
    });

    run("foreign and changed bookmark authority fails closed before apply", () => {
      function rejectedCase(kind, mutateTarget, mutateLive) {
        try {
          const fixture = bookmarkFixture(0);
          requireValue(_slBookmarkCreate(0, "Authority boundary").ok, kind + " setup failed");
          if (mutateTarget) {
            const target = JSON.parse(localStorage.getItem(fixture.slotKey));
            mutateTarget(target);
            localStorage.setItem(fixture.slotKey, JSON.stringify(target));
          }
          if (mutateLive) mutateLive(fixture);
          const opened = countedBookmarkOpen(0);
          return { kind, ok:opened.result.ok, applyCalls:opened.applyCalls, confirmCalls:opened.confirmCalls };
        } finally { clearBookmarkFixture(); }
      }
      const cases = [
        rejectedCase("foreign-live-run", null, fixture => {
          const foreign = JSON.parse(JSON.stringify(fixture.C));
          foreign.runId = "arc9-foreign-live-run";
          G.campaign = foreign;
        }),
        rejectedCase("target-run", target => { target.campaign.runId = "arc9-replaced-run"; }),
        rejectedCase("target-side", target => { target.campaign.side = "CS"; }),
        rejectedCase("target-ruleset", target => { target.campaign.ruleset = { id:"mayhem", version:1 }; }),
        rejectedCase("authoritative-fingerprint", target => { target.campaign.funds += 17; })
      ];
      for (const row of cases) {
        requireValue(!row.ok && row.applyCalls === 0 && row.confirmCalls === 0,
          row.kind + " mismatch reached confirmation or apply");
      }
      return { rejected:cases.map(row => row.kind), applyCalls:0, confirmCalls:0 };
    });

    run("corrupt targets and malformed pointer metadata fail before confirmation or apply", () => {
      function corruptCase(metadata) {
        try {
          const fixture = bookmarkFixture(0);
          requireValue(_slBookmarkCreate(0, "Corruption boundary").ok, "corrupt-case setup failed");
          if (metadata) G.settings.arc9SessionBookmarks[0].campaign = { forbidden:true };
          else localStorage.setItem(fixture.slotKey, "{ malformed");
          const slotBefore = localStorage.getItem(fixture.slotKey);
          const opened = countedBookmarkOpen(0);
          return { ok:opened.result.ok, applyCalls:opened.applyCalls, confirmCalls:opened.confirmCalls,
            slotStable:localStorage.getItem(fixture.slotKey) === slotBefore,
            listMalformed:_slBookmarkList() === null };
        } finally { clearBookmarkFixture(); }
      }
      const target = corruptCase(false), metadata = corruptCase(true);
      let targetSettings, nonStringRun;
      try {
        const fixture = bookmarkFixture(0);
        const malformedTarget = JSON.parse(localStorage.getItem(fixture.slotKey));
        malformedTarget.settings.arc9SessionBookmarks = { malformed:true };
        localStorage.setItem(fixture.slotKey, JSON.stringify(malformedTarget));
        const storageBefore = storageBytes();
        const made = _slBookmarkCreate(0, "Malformed target settings");
        targetSettings = { ok:made.ok, target:_slBookmarkTarget(0, _slRead(0)), storageStable:storageBytes() === storageBefore };
      } finally { clearBookmarkFixture(); }
      try {
        bookmarkFixture(0);
        requireValue(_slBookmarkCreate(0, "Typed metadata").ok, "typed-metadata setup failed");
        G.settings.arc9SessionBookmarks[0].runId = 123;
        const opened = countedBookmarkOpen(0);
        nonStringRun = { ok:opened.result.ok, applyCalls:opened.applyCalls, confirmCalls:opened.confirmCalls,
          listMalformed:_slBookmarkList() === null };
      } finally { clearBookmarkFixture(); }
      requireValue(!target.ok && target.applyCalls === 0 && target.confirmCalls === 0 && target.slotStable,
        "corrupt target did not fail closed");
      requireValue(!metadata.ok && metadata.applyCalls === 0 && metadata.confirmCalls === 0 && metadata.listMalformed,
        "malformed pointer metadata did not fail closed");
      requireValue(targetSettings && !targetSettings.ok && targetSettings.target === null && targetSettings.storageStable,
        "malformed bookmark settings inside the target save were accepted or rewritten");
      requireValue(nonStringRun && !nonStringRun.ok && nonStringRun.applyCalls === 0 &&
        nonStringRun.confirmCalls === 0 && nonStringRun.listMalformed,
        "non-string bookmark run id was coerced or reached confirmation/apply");
      return { corruptTarget:true, malformedMetadata:true, malformedTargetSettings:true,
        nonStringRunRejected:true, applyCalls:0, confirmCalls:0 };
    });

    run("bookmark rejection applies zero partial campaign settings or storage state", () => {
      let originalApply = null, originalSave = null, originalConfirm = null;
      try {
        const fixture = bookmarkFixture(0);
        requireValue(_slBookmarkCreate(0, "Atomic boundary").ok, "atomic setup failed");
        const live = G.campaign;
        const before = { campaign:JSON.stringify(G.campaign), settings:JSON.stringify(G.settings), storage:storageBytes() };
        let storageAfterConfirm = null;
        let applyCalls = 0, saveCalls = 0, confirmCalls = 0;
        originalApply = applySave; originalSave = saveLocal; originalConfirm = window.confirm;
        applySave = function () { applyCalls += 1; return originalApply.apply(this, arguments); };
        saveLocal = function () { saveCalls += 1; return originalSave.apply(this, arguments); };
        window.confirm = function () {
          confirmCalls += 1;
          localStorage.removeItem(fixture.slotKey);
          storageAfterConfirm = storageBytes();
          return true;
        };
        const opened = _slBookmarkOpen(0);
        requireValue(!opened.ok && applyCalls === 0 && saveCalls === 0 && confirmCalls === 1,
          "post-confirmation slot deletion crossed the atomic apply boundary");
        requireValue(G.campaign === live && JSON.stringify(G.campaign) === before.campaign &&
          JSON.stringify(G.settings) === before.settings && storageBytes() === storageAfterConfirm,
          "post-confirmation rejection partially changed live/settings or wrote beyond the external deletion");
        return { campaignIdentity:true, settingsBytes:before.settings.length, storageBytes:before.storage.length,
          applyCalls, saveCalls, confirmCalls, postConfirmDeletion:true };
      } finally {
        if (originalApply) applySave = originalApply;
        if (originalSave) saveLocal = originalSave;
        if (originalConfirm) window.confirm = originalConfirm;
        clearBookmarkFixture();
      }
    });

    run("Ironman bookmarks fail closed while undo import and export owners stay independent", () => {
      let originalSave = null;
      try {
        const fixture = bookmarkFixture(0);
        const owners = { capture:_slCaptureUndo, restore:_slRestoreUndo, importText:_slImportText,
          importFile:_slImportFile, exportString:_slExportString };
        localStorage.setItem("gor_undo_last", "bookmark-undo-sentinel");
        const beforeIron = storageBytes();
        originalSave = saveLocal;
        let saveCalls = 0;
        saveLocal = function () { saveCalls += 1; return originalSave.apply(this, arguments); };
        G.campaign.iron = true;
        const blockedCreate = _slBookmarkCreate(0, "Ironman blocked");
        requireValue(!blockedCreate.ok && saveCalls === 0 && storageBytes() === beforeIron,
          "live Ironman created or wrote a bookmark");
        G.campaign.iron = false;
        const made = _slBookmarkCreate(0, "Non-Iron boundary");
        requireValue(made.ok && saveCalls === 1, "non-Iron bookmark setup failed");
        const target = JSON.parse(localStorage.getItem(fixture.slotKey));
        target.campaign.iron = true;
        localStorage.setItem(fixture.slotKey, JSON.stringify(target));
        const undoBefore = localStorage.getItem("gor_undo_last");
        const opened = countedBookmarkOpen(0);
        requireValue(!opened.result.ok && opened.applyCalls === 0 && opened.confirmCalls === 0,
          "Ironman target opened through a bookmark");
        requireValue(localStorage.getItem("gor_undo_last") === undoBefore,
          "rejected Ironman bookmark touched undo state");
        requireValue(owners.capture === _slCaptureUndo && owners.restore === _slRestoreUndo &&
          owners.importText === _slImportText && owners.importFile === _slImportFile &&
          owners.exportString === _slExportString, "bookmark feature replaced undo/import/export owners");
        return { liveIronBlocked:true, targetIronBlocked:true, undoStable:true,
          importOwnerStable:true, exportOwnerStable:true };
      } finally {
        if (originalSave) saveLocal = originalSave;
        clearBookmarkFixture();
      }
    });

    run("malformed bookmark settings preserve unrelated settings and raw named slots", () => {
      let originalSave = null;
      try {
        const fixture = bookmarkFixture(0);
        G.settings = { gfx:"classic", diff:1, speed:1, unrelatedBookmarkProbe:{ keep:"exact" },
          arc9SessionBookmarks:{ malformed:true } };
        G.campaign = fixture.C;
        saveLocal();
        const before = { settings:JSON.stringify(G.settings), slot:localStorage.getItem(fixture.slotKey), storage:storageBytes() };
        originalSave = saveLocal;
        let saveCalls = 0;
        saveLocal = function () { saveCalls += 1; return originalSave.apply(this, arguments); };
        const made = _slBookmarkCreate(0, "Must not repair");
        const opened = _slBookmarkOpen(0);
        _slOpenManager();
        const status = document.getElementById("slBookmarkStatus");
        const buttons = Array.from(document.querySelectorAll("[id^=slBookmark]:not(#slBookmarks):not(#slBookmarkTitle):not(#slBookmarkHelp):not(#slBookmarkStatus)"));
        requireValue(!made.ok && !opened.ok && _slBookmarkList() === null && saveCalls === 0,
          "malformed bookmark settings were accepted or repaired");
        requireValue(JSON.stringify(G.settings) === before.settings && localStorage.getItem(fixture.slotKey) === before.slot &&
          storageBytes() === before.storage, "malformed settings failure rewrote unrelated state or a raw slot");
        requireValue(status && /malformed/i.test(document.getElementById("slBookmarks").textContent) &&
          buttons.filter(button => /^slBookmark\d+$/.test(button.id)).every(button => button.disabled),
          "malformed bookmark UI did not stay visibly fail-closed");
        return { malformed:true, repaired:false, saveCalls, unrelated:G.settings.unrelatedBookmarkProbe.keep };
      } finally {
        if (originalSave) saveLocal = originalSave;
        clearBookmarkFixture();
      }
    });
    return rows;
  }, { groupNames: GROUPS, saveVersion: saveShape.saveVer });

  let keyboardRow = null;
  try {
    const setup = await page.evaluate(() => {
      if (typeof closeSheet === "function") closeSheet();
      const C = {
        side: "US", iron: false, idx: 0, funds: 420, recovery: false, completed: [], runId: "arc9-keyboard-run",
        roster: [{ id: "R1", type: "inf", weapon: "springfield", xp: 1, name: "Core" }],
        nextId: 2, stats: { battles: 0, won: 0, infl: 0, suff: 0 },
        recoveryLossCount: 0, recoveryMode: false, flipAtk: false, captured: []
      };
      G.campaign = C;
      _t1InitAll(C);
      C.funds = 10;
      C.morale = C.morale || {}; C.morale.public = 20;
      C.manpower = C.manpower || {}; C.manpower.pool = 100;
      C.blockade = C.blockade || {}; C.blockade.recognition = 80;
      C.economy = C.economy || {}; C.economy.lastTurn = { inflRatePct: 25 };
      C.production = C.production || {}; C.production.railIntegrity = 30;
      C.president.pendingChoices = ["a", "b"];
      C.president.onboarded = true;
      openWarDept();
      const action = cosNextAction(C);
      const button = document.querySelector("#cosBrief button[data-costab]");
      if (!action || !button || document.querySelectorAll("#cosBrief button[data-costab]").length !== 1) {
        throw new Error("native Chief action setup missing");
      }
      const label = button.getAttribute("aria-label") || "";
      if (button.tagName !== "BUTTON" || button.type !== "button" ||
          label.indexOf(action.copy) < 0 || label.indexOf(action.label) < 0 ||
          button.textContent.indexOf(action.copy) < 0 || button.textContent.indexOf(action.label) < 0) {
        throw new Error("native button name or visible label is incomplete");
      }
      const original = _wdRefresh;
      const state = { button, original, calls: 0, target: action.tab, label };
      window.__arc9ChiefKeyboard = state;
      _wdRefresh = function () { state.calls += 1; return original.apply(this, arguments); };
      button.focus();
      return { target: state.target, label: state.label, type: button.type };
    });

    await page.keyboard.press("Enter");
    const enter = await page.evaluate(() => {
      const state = window.__arc9ChiefKeyboard;
      const nativeTab = document.getElementById("wdTab_" + state.target);
      return { calls: state.calls, target: _wdTab, focus: document.activeElement === state.button,
        pressed: !!nativeTab && nativeTab.getAttribute("aria-pressed") === "true" };
    });
    await page.evaluate(() => {
      const state = window.__arc9ChiefKeyboard;
      state.calls = 0;
      _wdTab = "economy";
      state.original();
      state.button.focus();
    });
    await page.keyboard.press("Space");
    const space = await page.evaluate(() => {
      const state = window.__arc9ChiefKeyboard;
      const nativeTab = document.getElementById("wdTab_" + state.target);
      const value = { calls: state.calls, target: _wdTab, focus: document.activeElement === state.button,
        pressed: !!nativeTab && nativeTab.getAttribute("aria-pressed") === "true" };
      _wdRefresh = state.original;
      delete window.__arc9ChiefKeyboard;
      return value;
    });
    need(enter.calls === 1 && enter.target === setup.target && enter.focus && enter.pressed,
      "Enter did not retain focus and route exactly once");
    need(space.calls === 1 && space.target === setup.target && space.focus && space.pressed,
      "Space did not retain focus and route exactly once");
    keyboardRow = { name: "Chief native button has a complete name and Enter Space retain focus with route parity",
      ok: true, value: { type: setup.type, label: setup.label, enter, space } };
  } catch (error) {
    try {
      await page.evaluate(() => {
        const state = window.__arc9ChiefKeyboard;
        if (state && state.original) _wdRefresh = state.original;
        delete window.__arc9ChiefKeyboard;
      });
    } catch (cleanupError) {}
    keyboardRow = { name: "Chief native button has a complete name and Enter Space retain focus with route parity",
      ok: false, error: String(error && error.message || error) };
  }
  browserEvidence.push(keyboardRow);

  let deskInputRow = null;
  try {
    await page.evaluate(() => {
      if (typeof closeSheet === "function") closeSheet();
      _pdAfterDeskClose = null;
      G.settings = { gfx: "classic", diff: 1, speed: 1, arc9DeskTab: "economy" };
      const C = {
        side: "US", iron: false, idx: 0, funds: 420, recovery: false, completed: [], runId: "arc9-desk-input-run",
        roster: [{ id: "R1", type: "inf", weapon: "springfield", xp: 1, name: "Core" }],
        nextId: 2, stats: { battles: 0, won: 0, infl: 0, suff: 0 },
        recoveryLossCount: 0, recoveryMode: false, flipAtk: false, captured: []
      };
      G.campaign = C;
      _t1InitAll(C);
      C.president.onboarded = true;
      openWarDept();
      const button = document.getElementById("wdTab_treasury");
      if (!button || button.tagName !== "BUTTON" || button.type !== "button") {
        throw new Error("native Desk target setup missing");
      }
      const state = {
        button,
        target: "treasury",
        originalSave: saveLocal,
        originalRefresh: _wdRefresh,
        saveCalls: 0,
        refreshCalls: 0
      };
      window.__arc9DeskInput = state;
      saveLocal = function () { state.saveCalls += 1; return state.originalSave.apply(this, arguments); };
      _wdRefresh = function () { state.refreshCalls += 1; return state.originalRefresh.apply(this, arguments); };
      state.reset = function () {
        G.settings.arc9DeskTab = "economy";
        _wdTab = "economy";
        state.saveCalls = 0;
        state.refreshCalls = 0;
        state.originalRefresh();
        state.button.focus();
      };
      state.reset();
    });

    async function deskInputState() {
      return page.evaluate(() => {
        const state = window.__arc9DeskInput;
        const stored = JSON.parse(localStorage.getItem("gor_save") || "null");
        return {
          saveCalls: state.saveCalls,
          refreshCalls: state.refreshCalls,
          target: _wdTab,
          preference: G.settings.arc9DeskTab,
          storedPreference: stored && stored.settings && stored.settings.arc9DeskTab,
          focus: document.activeElement === state.button,
          pressed: state.button.getAttribute("aria-pressed") === "true"
        };
      });
    }
    function requireDeskParity(value, label) {
      need(value.saveCalls === 1 && value.refreshCalls === 1, label + " did not save and refresh exactly once");
      need(value.target === "treasury" && value.preference === "treasury" && value.storedPreference === "treasury",
        label + " did not select and persist the same validated target");
      need(value.focus && value.pressed, label + " did not retain native focus and pressed state");
    }

    await page.click("#wdTab_treasury");
    const pointer = await deskInputState();
    requireDeskParity(pointer, "Pointer");
    await page.evaluate(() => window.__arc9DeskInput.reset());
    await page.keyboard.press("Enter");
    const enter = await deskInputState();
    requireDeskParity(enter, "Enter");
    await page.evaluate(() => window.__arc9DeskInput.reset());
    await page.keyboard.press("Space");
    const space = await deskInputState();
    requireDeskParity(space, "Space");
    await page.evaluate(() => {
      const state = window.__arc9DeskInput;
      saveLocal = state.originalSave;
      _wdRefresh = state.originalRefresh;
      delete window.__arc9DeskInput;
    });
    deskInputRow = {
      name: "native Desk pointer Enter and Space retain focus with selection persistence parity",
      ok: true,
      value: { pointer, enter, space }
    };
  } catch (error) {
    try {
      await page.evaluate(() => {
        const state = window.__arc9DeskInput;
        if (state) {
          if (state.originalSave) saveLocal = state.originalSave;
          if (state.originalRefresh) _wdRefresh = state.originalRefresh;
        }
        delete window.__arc9DeskInput;
      });
    } catch (cleanupError) {}
    deskInputRow = {
      name: "native Desk pointer Enter and Space retain focus with selection persistence parity",
      ok: false,
      error: String(error && error.message || error)
    };
  }
  browserEvidence.push(deskInputRow);

  let zoomRow = null;
  try {
    await page.setViewportSize({ width: 780, height: 900 });
    const zoom = await page.evaluate(() => {
      if (typeof closeSheet === "function") closeSheet();
      _pdAfterDeskClose = null;
      G.settings = { gfx: "classic", diff: 1, speed: 1, reduceMotion: true, arc9DeskTab: "treasury" };
      const C = {
        side: "US", iron: false, idx: 0, funds: 420, recovery: false, completed: [], runId: "arc9-desk-zoom-run",
        roster: [{ id: "R1", type: "inf", weapon: "springfield", xp: 1, name: "Core" }],
        nextId: 2, stats: { battles: 0, won: 0, infl: 0, suff: 0 },
        recoveryLossCount: 0, recoveryMode: false, flipAtk: false, captured: []
      };
      G.campaign = C;
      _t1InitAll(C);
      C.president.onboarded = true;
      openWarDept();
      document.documentElement.style.zoom = "2";
      const shell = document.querySelector(".h0-desk-shell");
      const tabs = document.getElementById("wdTabs");
      const sheet = document.getElementById("sheetPad");
      const active = document.getElementById("wdTab_treasury");
      if (!shell || !tabs || !sheet || !active) throw new Error("200% Desk fixture missing");
      active.focus();
      const shellStyle = getComputedStyle(shell);
      const activeStyle = getComputedStyle(active);
      const rect = active.getBoundingClientRect();
      return {
        shellOverflow: shell.scrollWidth - shell.clientWidth,
        tabsOverflow: tabs.scrollWidth - tabs.clientWidth,
        sheetOverflow: sheet.scrollWidth - sheet.clientWidth,
        activeWidth: rect.width,
        activeHeight: rect.height,
        activePressed: active.getAttribute("aria-pressed"),
        focus: document.activeElement === active,
        reducedMedia: matchMedia("(prefers-reduced-motion: reduce)").matches,
        reducedSetting: G.settings.reduceMotion === true,
        shellAnimation: shellStyle.animationName,
        activeAnimation: activeStyle.animationName,
        activeTransition: activeStyle.transitionDuration
      };
    });
    await sleep(150);
    /* Playwright's screenshot wrapper can wait forever on this 9 MB single-file
       build's font set after CSS zoom. Direct CDP capture preserves the same
       rendered viewport without weakening any reflow or motion assertion. */
    const cdp = await context.newCDPSession(page);
    const captured = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    writeFileSync(ZOOM_PNG, Buffer.from(captured.data, "base64"));
    const screenshotBytes = statSync(ZOOM_PNG).size;
    need(zoom.shellOverflow <= 2 && zoom.tabsOverflow <= 2 && zoom.sheetOverflow <= 2,
      "200% Desk reflow overflowed: " + JSON.stringify(zoom));
    need(zoom.activeWidth > 20 && zoom.activeHeight > 20 && zoom.activePressed === "true" && zoom.focus,
      "remembered target was unreadable or lost state at 200% zoom");
    need(zoom.reducedMedia && zoom.reducedSetting && zoom.shellAnimation === "none" &&
      zoom.activeAnimation === "none" && zoom.activeTransition === "0s",
      "200% remembered landing was not reduced-motion safe");
    need(screenshotBytes >= 5000, "200% Desk screenshot is unexpectedly small");
    zoomRow = {
      name: "remembered landing reflows at 200 percent zoom with reduced-motion safety",
      ok: true,
      value: { ...zoom, screenshotBytes }
    };
  } catch (error) {
    zoomRow = {
      name: "remembered landing reflows at 200 percent zoom with reduced-motion safety",
      ok: false,
      error: String(error && error.message || error)
    };
  } finally {
    try { await page.evaluate(() => { document.documentElement.style.zoom = ""; }); } catch (cleanupError) {}
    try { await page.setViewportSize(cfg.viewport); } catch (cleanupError) {}
  }
  browserEvidence.push(zoomRow);

  let bookmarkInputRow = null;
  try {
    await page.evaluate(() => {
      if (typeof closeSheet === "function") closeSheet();
      const state = { originalSave:saveLocal, saveCalls:0, keys:null };
      state.reset = function () {
        saveLocal = state.originalSave;
        for (let i = 0; i < 3; i++) localStorage.removeItem("gor_slot_" + i);
        localStorage.removeItem("gor_undo_last");
        localStorage.removeItem("gor_save");
        G.settings = { gfx:"classic", diff:1, speed:1, unrelatedBookmarkProbe:{ keep:true } };
        const C = {
          side:"US", iron:false, idx:0, funds:420, recovery:false, completed:[], runId:"arc9-bookmark-input-run",
          roster:[{ id:"R1", type:"inf", weapon:"springfield", xp:1, name:"Core" }],
          nextId:2, stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0,
          recoveryMode:false, flipAtk:false, captured:[]
        };
        G.campaign = C;
        _t1InitAll(C);
        if (typeof mayhemInit === "function") mayhemInit(C, "historical", "new");
        state.originalSave();
        const slot = JSON.parse(JSON.stringify(serializeSave()));
        slot.slotName = "Input Boundary";
        slot.when = 1710000000000;
        if (!_slWrite(0, slot)) throw new Error("bookmark input slot setup failed");
        _slOpenManager();
        const name = document.getElementById("slName0");
        const button = document.getElementById("slBookmark0");
        if (!name || !button || button.disabled) throw new Error("bookmark input control setup missing");
        name.value = "  Field   Headquarters  ";
        state.keys = JSON.stringify(Object.keys(localStorage).sort());
        state.saveCalls = 0;
        saveLocal = function () { state.saveCalls += 1; return state.originalSave.apply(this, arguments); };
        button.focus();
      };
      window.__arc9BookmarkInput = state;
      state.reset();
    });

    async function bookmarkInputState() {
      return page.evaluate(() => {
        const state = window.__arc9BookmarkInput;
        const list = _slBookmarkList();
        const pointer = list && list[0];
        const button = document.getElementById("slBookmark0");
        const open = document.getElementById("slBookmarkOpen0");
        const status = document.getElementById("slBookmarkStatus");
        const stored = JSON.parse(localStorage.getItem("gor_save") || "null");
        return {
          saveCalls:state.saveCalls,
          pointer,
          storedPointer:stored && stored.settings && stored.settings.arc9SessionBookmarks &&
            stored.settings.arc9SessionBookmarks[0],
          storageStable:JSON.stringify(Object.keys(localStorage).sort()) === state.keys,
          buttonType:button && button.type,
          buttonName:button && button.getAttribute("aria-label"),
          openType:open && open.type,
          openName:open && open.getAttribute("aria-label"),
          focus:document.activeElement === button,
          statusRole:status && status.getAttribute("role"),
          statusAtomic:status && status.getAttribute("aria-atomic"),
          statusText:status && status.textContent.trim()
        };
      });
    }
    function requireBookmarkParity(value, label) {
      need(value.saveCalls === 1, label + " did not use exactly one existing settings write");
      need(value.pointer && value.pointer.label === "Field Headquarters" && value.pointer.slot === 0 &&
        JSON.stringify(value.pointer) === JSON.stringify(value.storedPointer),
        label + " did not create and persist the same cleaned pointer");
      need(value.storageStable, label + " created a second storage key");
      need(value.buttonType === "button" && /Update Bookmark for save slot 1/.test(value.buttonName || "") &&
        value.openType === "button" && /Open session bookmark Field Headquarters/.test(value.openName || ""),
        label + " controls lack complete native names");
      need(value.focus && value.statusRole === "status" && value.statusAtomic === "true" &&
        /Bookmark saved for slot 1/.test(value.statusText || ""),
        label + " did not retain focus and surface an atomic status");
    }

    await page.click("#slBookmark0");
    const pointer = await bookmarkInputState();
    requireBookmarkParity(pointer, "Pointer");
    await page.evaluate(() => window.__arc9BookmarkInput.reset());
    await page.keyboard.press("Enter");
    const enter = await bookmarkInputState();
    requireBookmarkParity(enter, "Enter");
    await page.evaluate(() => window.__arc9BookmarkInput.reset());
    await page.keyboard.press("Space");
    const space = await bookmarkInputState();
    requireBookmarkParity(space, "Space");
    await page.evaluate(() => {
      const state = window.__arc9BookmarkInput;
      if (state && state.originalSave) saveLocal = state.originalSave;
      delete window.__arc9BookmarkInput;
    });
    bookmarkInputRow = {
      name:"bookmark native pointer Enter and Space keep complete names status and focus parity",
      ok:true,
      value:{ pointer, enter, space }
    };
  } catch (error) {
    try {
      await page.evaluate(() => {
        const state = window.__arc9BookmarkInput;
        if (state && state.originalSave) saveLocal = state.originalSave;
        delete window.__arc9BookmarkInput;
      });
    } catch (cleanupError) {}
    bookmarkInputRow = {
      name:"bookmark native pointer Enter and Space keep complete names status and focus parity",
      ok:false,
      error:String(error && error.message || error)
    };
  }
  browserEvidence.push(bookmarkInputRow);
  for (const row of browserEvidence) steps.push(row);
  await page.screenshot({ path: PNG, fullPage: false, timeout: 90000 });
} catch (error) {
  realErrors.push("FATAL " + String(error && error.stack || error));
} finally {
  await closeBrowserHard(browser);
  killChild(server);
}

const failed = steps.filter(row => row.ok === false);
const bindS2 = process.argv.includes("--bind-s2");
const bindS3 = process.argv.includes("--bind-s3");
const bindS4 = process.argv.includes("--bind-s4");
const bindMode = bindS2 ? "bind-s2" : bindS3 ? "bind-s3" : bindS4 ? "bind-s4" : "runtime";
const bindS2Tooth = "Chief stale target fails neutral with no action";
const bindS3Tooth = "invalid or removed preference falls neutral without repair";
const bindS4Tooth = "foreign and changed bookmark authority fails closed before apply";
const bindTooth = bindS2 ? bindS2Tooth : bindS3 ? bindS3Tooth : bindS4 ? bindS4Tooth : "";
const expectedRed = (bindS2 || bindS3 || bindS4) && steps.length === 31 && failed.length === 1 &&
  failed[0].name === bindTooth && pageerrors.length === 0 && realErrors.length === 0;
const result = {
  schema: bindS2 ? "cw_probe_desk_pacing_bind_s2_v1" :
    bindS3 ? "cw_probe_desk_pacing_bind_s3_v1" :
      bindS4 ? "cw_probe_desk_pacing_bind_s4_v1" : "cw_probe_desk_pacing_v1",
  generatedAt: new Date().toISOString(),
  mode: bindMode,
  ok: !bindS2 && !bindS3 && !bindS4 && steps.length === 31 && failed.length === 0 && pageerrors.length === 0 && realErrors.length === 0,
  expectedRed,
  baseline: BASELINE,
  steps,
  failed: failed.map(row => row.name),
  errors: failed.map(row => row.error),
  pageerrors,
  realErrors,
  benignWarnings,
  artifacts: {
    json: bindS2 ? "tools/shots/probe-desk-pacing-bind-s2.json" :
      bindS3 ? "tools/shots/probe-desk-pacing-bind-s3.json" :
        bindS4 ? "tools/shots/probe-desk-pacing-bind-s4.json" : "tools/shots/probe-desk-pacing.json",
    png: "tools/shots/probe-desk-pacing.png",
    zoomPng: "tools/shots/probe-desk-pacing-zoom-200.png"
  },
  summary: { passed: steps.length - failed.length, total: steps.length }
};
writeFileSync(bindS2 ? BIND_S2_ART : bindS3 ? BIND_S3_ART : bindS4 ? BIND_S4_ART : ART, JSON.stringify(result, null, 2) + "\n");
console.log("probe-desk-pacing" + (bindS2 ? " bind-s2" : bindS3 ? " bind-s3" : bindS4 ? " bind-s4" : "") + ": " + result.summary.passed + "/" + result.summary.total +
  " steps ok, " + failed.length + " fail pageerrors=" + pageerrors.length +
  " realErrors=" + realErrors.length + ((bindS2 || bindS3 || bindS4) ? " expectedRed=" + expectedRed : ""));
if (bindS2 || bindS3 || bindS4) {
  for (const row of failed) console.error("EXPECTED RED " + row.name + " - " + row.error);
  if (!expectedRed) {
    console.error("FAIL " + (bindS2 ? "Bind S2" : bindS3 ? "Bind S3" : "Bind S4") + " must isolate only " + bindTooth);
    process.exit(2);
  }
  process.exit(1);
}
if (!result.ok) {
  if (steps.length !== 31) console.error("FAIL expected exactly 31 steps, got " + steps.length);
  for (const row of failed) console.error("FAIL " + row.name + " - " + row.error);
  for (const message of pageerrors) console.error("PAGEERROR " + message);
  for (const message of realErrors) console.error("REALERROR " + message);
  process.exit(1);
}
console.log("ALL OK");
