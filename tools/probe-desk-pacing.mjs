#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D517 / LANE-020 ARC 9 Slices 1-3: measured resolver pacing, one pure live
// Chief-of-Staff action, and one live-registry-validated remembered Desk tab.
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
  browserEvidence = await page.evaluate(({ groupNames }) => {
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
    return rows;
  }, { groupNames: GROUPS });

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
const bindMode = bindS2 ? "bind-s2" : bindS3 ? "bind-s3" : "runtime";
const bindS2Tooth = "Chief stale target fails neutral with no action";
const bindS3Tooth = "invalid or removed preference falls neutral without repair";
const bindTooth = bindS2 ? bindS2Tooth : bindS3 ? bindS3Tooth : "";
const expectedRed = (bindS2 || bindS3) && steps.length === 21 && failed.length === 1 &&
  failed[0].name === bindTooth && pageerrors.length === 0 && realErrors.length === 0;
const result = {
  schema: bindS2 ? "cw_probe_desk_pacing_bind_s2_v1" :
    bindS3 ? "cw_probe_desk_pacing_bind_s3_v1" : "cw_probe_desk_pacing_v1",
  generatedAt: new Date().toISOString(),
  mode: bindMode,
  ok: !bindS2 && !bindS3 && steps.length === 21 && failed.length === 0 && pageerrors.length === 0 && realErrors.length === 0,
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
      bindS3 ? "tools/shots/probe-desk-pacing-bind-s3.json" : "tools/shots/probe-desk-pacing.json",
    png: "tools/shots/probe-desk-pacing.png",
    zoomPng: "tools/shots/probe-desk-pacing-zoom-200.png"
  },
  summary: { passed: steps.length - failed.length, total: steps.length }
};
writeFileSync(bindS2 ? BIND_S2_ART : bindS3 ? BIND_S3_ART : ART, JSON.stringify(result, null, 2) + "\n");
console.log("probe-desk-pacing" + (bindS2 ? " bind-s2" : bindS3 ? " bind-s3" : "") + ": " + result.summary.passed + "/" + result.summary.total +
  " steps ok, " + failed.length + " fail pageerrors=" + pageerrors.length +
  " realErrors=" + realErrors.length + ((bindS2 || bindS3) ? " expectedRed=" + expectedRed : ""));
if (bindS2 || bindS3) {
  for (const row of failed) console.error("EXPECTED RED " + row.name + " - " + row.error);
  if (!expectedRed) {
    console.error("FAIL " + (bindS2 ? "Bind S2" : "Bind S3") + " must isolate only " + bindTooth);
    process.exit(2);
  }
  process.exit(1);
}
if (!result.ok) {
  if (steps.length !== 21) console.error("FAIL expected exactly 21 steps, got " + steps.length);
  for (const row of failed) console.error("FAIL " + row.name + " - " + row.error);
  for (const message of pageerrors) console.error("PAGEERROR " + message);
  for (const message of realErrors) console.error("REALERROR " + message);
  process.exit(1);
}
console.log("ALL OK");
