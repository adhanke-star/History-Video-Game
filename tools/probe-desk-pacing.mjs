#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D515 / LANE-020 ARC 9 Slice 1: measured strategic-resolver pacing.
// Writes tools/shots/probe-desk-pacing.json + probe-desk-pacing.png.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = join(HERE, "shots");
const ART = join(OUT, "probe-desk-pacing.json");
const BIND_ART = join(OUT, "probe-desk-pacing-bind-s1.json");
const PNG = join(OUT, "probe-desk-pacing.png");
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
    return rows;
  }, { groupNames: GROUPS });
  for (const row of browserEvidence) steps.push(row);
  await page.screenshot({ path: PNG, fullPage: false, timeout: 90000 });
  await context.close();
} catch (error) {
  realErrors.push("FATAL " + String(error && error.stack || error));
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}

const failed = steps.filter(row => row.ok === false);
const result = {
  schema: "cw_probe_desk_pacing_v1",
  generatedAt: new Date().toISOString(),
  ok: steps.length === 8 && failed.length === 0 && pageerrors.length === 0 && realErrors.length === 0,
  baseline: BASELINE,
  steps,
  failed: failed.map(row => row.name),
  errors: failed.map(row => row.error),
  pageerrors,
  realErrors,
  benignWarnings,
  artifacts: { json: "tools/shots/probe-desk-pacing.json", png: "tools/shots/probe-desk-pacing.png" },
  summary: { passed: steps.length - failed.length, total: steps.length }
};
writeFileSync(ART, JSON.stringify(result, null, 2) + "\n");
console.log("probe-desk-pacing: " + result.summary.passed + "/" + result.summary.total +
  " steps ok, " + failed.length + " fail pageerrors=" + pageerrors.length +
  " realErrors=" + realErrors.length);
if (!result.ok) {
  if (steps.length !== 8) console.error("FAIL expected exactly 8 steps, got " + steps.length);
  for (const row of failed) console.error("FAIL " + row.name + " - " + row.error);
  for (const message of pageerrors) console.error("PAGEERROR " + message);
  for (const message of realErrors) console.error("REALERROR " + message);
  process.exit(1);
}
console.log("ALL OK");
