#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D420 / LANE-007 Slice C focused gate. Preserves the Historical/Mayhem
// ruleset kernel, campaign-start routing, immutable owner, save/timeline
// isolation, accessible picker, persistent labels, and Historical A/B.
import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
const ART = join(OUT, "probe-mayhem-mode.json");
const TEETH_T0 = Date.now();
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, "shots.json"), "utf8"));
const GL = [
  "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist", "--enable-webgl", "--disable-dev-shm-usage"
];
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));
async function up(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok || response.status === 200;
  } catch {
    return false;
  }
}
function md5(text) {
  return createHash("md5").update(text).digest("hex");
}
function expectedIds(rel) {
  const text = readFileSync(join(ROOT, rel), "utf8");
  const match = /var EXPECTED = \[([^\]]+)\]/.exec(text);
  if (!match) return [];
  return Array.from(match[1].matchAll(/'([^']+)'/g), item => item[1]);
}
function staticEvidence() {
  const base = readFileSync(join(ROOT, "build", "base.html"), "utf8");
  const h0 = readFileSync(join(ROOT, "src", "98-h0-main-menu.js"), "utf8");
  const suiteText = readFileSync(join(ROOT, "tools", "vet-no-regression.mjs"), "utf8");
  const suiteBlock = (/const SUITE = \[([\s\S]*?)\n\];/.exec(suiteText) || [null, ""])[1];
  const suiteRows = Array.from(
    suiteBlock.matchAll(/^\s*\['([^']+)',\s*'([^']+)'\],?\s*$/gm),
    item => [item[1], item[2]]
  );
  const manifest = JSON.parse(readFileSync(join(ROOT, "src", "00-manifest.json"), "utf8"));
  const shape = JSON.parse(readFileSync(join(ROOT, "tools", "save-shape.json"), "utf8"));
  const rosterIds = expectedIds("tools/probe-tactical-roster.mjs");
  const builderIds = expectedIds("tools/probe-custom-battle-builder.mjs");
  const dataCount = readdirSync(join(ROOT, "data")).filter(name => name.endsWith(".json")).length;
  const mayhemIndex = suiteRows.findIndex(row => row[0] === "mayhem mode");
  const careerIndex = suiteRows.findIndex(row => row[0] === "war career");
  const moduleIndex = manifest.modules.indexOf("107-mayhem-rules.js");
  return {
    routes: {
      legacyUS: base.includes('var btnNewUS = document.getElementById("mmNewUS");') && base.includes('_openMusterChoice("US");'),
      legacyCS: base.includes('var btnNewCS = document.getElementById("mmNewCS");') && base.includes('_openMusterChoice("CS");'),
      h0US: h0.includes('btnNewUS.addEventListener("click", function () { if (typeof _openMusterChoice === "function") _openMusterChoice("US"); });'),
      h0CS: h0.includes('btnNewCS.addEventListener("click", function () { if (typeof _openMusterChoice === "function") _openMusterChoice("CS"); });')
    },
    baseMd5: md5(base),
    saveVer: shape.saveVer,
    applySaveSignature: shape.signatures && shape.signatures["src/105-save-guard.js::applySave"],
    dataCount,
    rosterIds,
    builderIds,
    suiteCount: suiteRows.length,
    mayhemRow: mayhemIndex + 1,
    mayhemFile: mayhemIndex >= 0 ? suiteRows[mayhemIndex][1] : "",
    warCareerRow: careerIndex + 1,
    moduleAfter106: moduleIndex === manifest.modules.indexOf("106-war-career.js") + 1
  };
}

async function browserSetup() {
  const R = { ok: true, steps: [], errors: [] };
  function step(name, fn) {
    try {
      const value = fn();
      R.steps.push({ name, ok: true, v: value === undefined ? null : value });
    } catch (error) {
      R.ok = false;
      R.steps.push({ name, ok: false, err: String(error && error.message || error) });
    }
  }
  async function asyncStep(name, fn) {
    try {
      const value = await fn();
      R.steps.push({ name, ok: true, v: value === undefined ? null : value });
    } catch (error) {
      R.ok = false;
      R.steps.push({ name, ok: false, err: String(error && error.message || error) });
    }
  }
  function eq(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function campaign(id, side) {
    const C = {
      side: side === "CS" ? "CS" : "US",
      iron: false,
      idx: 0,
      funds: 300,
      recovery: false,
      completed: [],
      roster: [],
      nextId: 1,
      stats: { battles: 0, won: 0, infl: 0, suff: 0 },
      recoveryLossCount: 0,
      recoveryMode: false,
      flipAtk: false,
      captured: [],
      president: { turn: 0 }
    };
    if (id) C.ruleset = { id, version: 1 };
    return C;
  }
  function save(id, label) {
    return {
      ver: 1,
      when: 424242,
      settings: { diff: 1, gfx: "classic" },
      campaign: campaign(id, "US"),
      slotName: label || ""
    };
  }
  function cleanStorage() {
    ["gor_save", "gor_slot_0", "gor_slot_1", "gor_slot_2", "gor_undo_last", "ruleset", "mayhemMode"]
      .forEach(key => { try { localStorage.removeItem(key); } catch (error) {} });
  }

  window.addEventListener("error", event => {
    R.errors.push(String(event.message || event.error || event));
  });

  try {
    if (typeof mayhemRuleset !== "function" || typeof mayhemIsActive !== "function" ||
        typeof mayhemModeLabel !== "function" || typeof mayhemInit !== "function" ||
        typeof _mhNamedFork !== "function" || typeof _mhOpenRulesetPicker !== "function") {
      return { ok: false, fatal: "Mayhem Slice-A API missing", steps: [], errors: [] };
    }
    G.settings = G.settings || {};
    G.mode = "menu";
    cleanStorage();

    step("RULESET SHAPE + IDS", () => {
      const historical = mayhemRuleset({ ruleset: { id: "historical", version: 1 } });
      const mayhem = mayhemRuleset({ ruleset: { id: "mayhem", version: 1 } });
      if (!eq(Object.keys(historical).sort(), ["id", "version"])) throw new Error("Historical shape is not exact");
      if (!eq(Object.keys(mayhem).sort(), ["id", "version"])) throw new Error("Mayhem shape is not exact");
      if (!eq(historical, { id: "historical", version: 1 })) throw new Error("Historical view drifted");
      if (!eq(mayhem, { id: "mayhem", version: 1 })) throw new Error("Mayhem view drifted");
      if (mayhemIsActive({ ruleset: historical })) throw new Error("Historical reported active Mayhem");
      if (!mayhemIsActive({ ruleset: mayhem })) throw new Error("Mayhem did not report active");
      if (mayhemModeLabel({ ruleset: historical }) !== "Historical Campaign") throw new Error("Historical label drifted");
      if (mayhemModeLabel({ ruleset: mayhem }) !== "Mayhem Campaign") throw new Error("Mayhem label drifted");
      mayhem.id = "historical";
      if (!mayhemIsActive({ ruleset: { id: "mayhem", version: 1 } })) throw new Error("reader returned live authority instead of a view");
      return { ids: ["historical", "mayhem"], version: 1 };
    });

    step("HISTORICAL FALLBACK", () => {
      const malformed = [
        null, {}, [], { id: "mayhem" }, { id: "unknown", version: 1 },
        { id: "mayhem", version: 2 }, { id: "mayhem", version: 1, extra: true }
      ];
      for (let i = 0; i < malformed.length; i++) {
        if (mayhemRuleset({ ruleset: malformed[i] }).id !== "historical") throw new Error("reader fallback failed at " + i);
        const C = { ruleset: malformed[i] };
        if (mayhemInit(C, null, "load").id !== "historical") throw new Error("load fallback failed at " + i);
      }
      const legacy = {};
      mayhemInit(legacy, null, "load");
      if (mayhemRuleset(legacy).id !== "historical") throw new Error("legacy campaign did not become Historical");
      const valid = { ruleset: { id: "mayhem", version: 1 } };
      mayhemInit(valid, null, "load");
      if (!mayhemIsActive(valid)) throw new Error("valid Mayhem load was not preserved");
      return { malformed: malformed.length, legacy: "historical" };
    });

    step("IMMUTABLE OWNER", () => {
      const C = {};
      mayhemInit(C, "mayhem", "new");
      let descriptor = Object.getOwnPropertyDescriptor(C, "ruleset");
      if (!descriptor || descriptor.writable !== false || descriptor.configurable !== false) throw new Error("campaign owner is writable/configurable");
      if (typeof Object.isFrozen === "function" && !Object.isFrozen(C.ruleset)) throw new Error("ruleset value is not frozen");
      try { C.ruleset.id = "historical"; } catch (error) {}
      try { C.ruleset = { id: "historical", version: 1 }; } catch (error) {}
      mayhemInit(C, "historical", "new");
      if (!mayhemIsActive(C)) throw new Error("mid-run mutation changed Mayhem");

      const edge = {};
      Object.defineProperty(edge, "ruleset", {
        value: { id: "mayhem", version: 1 }, enumerable: false, writable: true, configurable: false
      });
      mayhemInit(edge, null, "load");
      descriptor = Object.getOwnPropertyDescriptor(edge, "ruleset");
      if (!descriptor || descriptor.writable !== false || !mayhemIsActive(edge)) throw new Error("non-configurable writable owner was not safely locked");
      return { id: C.ruleset.id, frozen: true };
    });

    step("ATTACH BEFORE INIT + FIRST LAUNCH", () => {
      const priorInit = _MH_BASE_INIT;
      let seen = null;
      try {
        _MH_BASE_INIT = function (C) {
          seen = C && C.ruleset ? JSON.parse(JSON.stringify(C.ruleset)) : null;
          C.probeInitRan = true;
        };
        _mhPendingStart = { side: "US", id: "mayhem" };
        const C = campaign(null, "US");
        _t1InitAll(C);
        if (!eq(seen, { id: "mayhem", version: 1 })) throw new Error("initializer ran before Mayhem attached: " + JSON.stringify(seen));
        if (!C.probeInitRan || !mayhemIsActive(C)) throw new Error("wrapped initializer did not complete with Mayhem");
      } finally {
        _MH_BASE_INIT = priorInit;
        _mhClearPending();
      }
      return { atInit: seen };
    });

    step("DIRECT START IS HISTORICAL + FINALLY CLEARS", () => {
      const priorStart = _MH_BASE_START;
      const priorInit = _MH_BASE_INIT;
      try {
        _MH_BASE_INIT = function (C) { C.probeInitRan = true; };
        _MH_BASE_START = function (side, iron) {
          G.campaign = campaign(null, side);
          G.campaign.iron = !!iron;
          _t1InitAll(G.campaign);
          return G.campaign;
        };
        _mhStartToken = null;
        startCampaign("US", false);
        if (mayhemRuleset(G.campaign).id !== "historical") throw new Error("direct two-argument start was not Historical");
        if (_mhPendingStart !== null || _mhStartToken !== null) throw new Error("direct start leaked pending state");

        _MH_BASE_START = function () { throw new Error("probe throw"); };
        _mhStartToken = { side: "US", id: "mayhem" };
        try { startCampaign("US", false); } catch (error) {}
        if (_mhPendingStart !== null || _mhStartToken !== null) throw new Error("throw path did not clear pending state in finally");
      } finally {
        _MH_BASE_START = priorStart;
        _MH_BASE_INIT = priorInit;
        _mhClearPending();
      }
      return { direct: "historical", finallyCleared: true };
    });

    step("HISTORICAL A/B BYTE EQUIVALENCE", () => {
      const priorStart = _MH_BASE_START;
      const priorInit = _MH_BASE_INIT;
      const priorSettings = G.settings;
      const priorNow = Date.now;
      function controlledStart(side, iron) {
        G.campaign = campaign(null, side);
        G.campaign.iron = !!iron;
        _t1InitAll(G.campaign);
        return G.campaign;
      }
      try {
        G.settings = { diff: 1, gfx: "classic", playStyle: "free", altHistoryEmergentOnly: false };
        Date.now = function () { return 424242; };
        _MH_BASE_INIT = function (C) { C.probeInitialized = true; };
        _MH_BASE_START = controlledStart;
        _mhStartToken = null;
        startCampaign("US", false);
        const legacy = JSON.stringify(serializeSave());
        _mhStartToken = { side: "US", id: "historical" };
        startCampaign("US", false);
        const explicit = JSON.stringify(serializeSave());
        if (legacy !== explicit) throw new Error("legacy/explicit Historical vectors differ");
        return { bytes: legacy.length, equal: true };
      } finally {
        Date.now = priorNow;
        G.settings = priorSettings;
        _MH_BASE_START = priorStart;
        _MH_BASE_INIT = priorInit;
        _mhClearPending();
      }
    });

    step("NAMED FORK LAW", () => {
      const historical = campaign(null, "US");
      mayhemInit(historical, "historical", "new");
      const fork = _mhNamedFork(historical, "Grant Takes Richmond", "mayhem");
      if (!fork || fork === historical || !mayhemIsActive(fork)) throw new Error("Historical to named Mayhem fork failed");
      if (mayhemIsActive(historical)) throw new Error("fork mutated the Historical source");
      if (fork.timelineName !== "Grant Takes Richmond") throw new Error("fork name was not preserved");
      if (_mhNamedFork(historical, " ", "mayhem") !== null) throw new Error("blank fork name accepted");
      if (_mhNamedFork(fork, "Back to History", "historical") !== null) throw new Error("Mayhem to Historical conversion accepted");
      return { source: "historical", fork: "mayhem" };
    });

    step("NO SETTINGS OR LOCALSTORAGE AUTHORITY", () => {
      const C = campaign(null, "US");
      mayhemInit(C, "mayhem", "new");
      G.settings.ruleset = "historical";
      G.settings.mayhemMode = false;
      G.settings.playStyle = "president";
      G.settings.altHistoryEmergentOnly = true;
      localStorage.setItem("ruleset", "historical");
      localStorage.setItem("mayhemMode", "false");
      if (!mayhemIsActive(C)) throw new Error("mutable settings/storage overrode campaign Mayhem");
      const H = campaign(null, "US");
      mayhemInit(H, "historical", "new");
      G.settings.ruleset = "mayhem";
      G.settings.mayhemMode = true;
      localStorage.setItem("ruleset", "mayhem");
      if (mayhemIsActive(H)) throw new Error("mutable settings/storage activated Mayhem");
      return { authority: "campaign-only" };
    });

    step("SAVE + IMPORT + UNDO + CROSS-SLOT ISOLATION", () => {
      const A = save("historical", "Timeline A");
      const B = save("mayhem", "Timeline B");
      try {
        cleanStorage();
        G.campaign = null;
        applySave(JSON.parse(JSON.stringify(A)));
        if (mayhemRuleset(G.campaign).id !== "historical") throw new Error("A did not load Historical");
        applySave(JSON.parse(JSON.stringify(B)));
        if (!mayhemIsActive(G.campaign)) throw new Error("B did not load Mayhem");
        applySave(JSON.parse(JSON.stringify(A)));
        if (mayhemRuleset(G.campaign).id !== "historical") throw new Error("B leaked into reloaded A");

        if (!_slWrite(0, A) || !_slWrite(1, B)) throw new Error("slot write failed");
        applySave(_slClone(_slRead(1)));
        if (!mayhemIsActive(G.campaign)) throw new Error("Mayhem slot load failed");
        applySave(_slClone(_slRead(0)));
        if (mayhemIsActive(G.campaign)) throw new Error("Mayhem leaked across slots");

        const imported = _slImportText(JSON.stringify(B));
        if (!imported.ok || !mayhemIsActive(G.campaign)) throw new Error("Mayhem import failed");
        const exported = JSON.parse(_slExportString(B));
        if (!exported.campaign || exported.campaign.ruleset.id !== "mayhem") throw new Error("export lost Mayhem");

        localStorage.setItem(_SL_UNDO_KEY, JSON.stringify({
          ver: 1, when: 424242, winnerSide: "US", type: "major", save: A
        }));
        if (!_slRestoreUndo()) throw new Error("Historical undo restore refused");
        if (mayhemIsActive(G.campaign)) throw new Error("Mayhem leaked through undo restore");

        localStorage.setItem(_SAVE_KEY, JSON.stringify(B));
        const auto = loadLocal();
        if (!auto) throw new Error("Mayhem autosave was rejected");
        applySave(auto);
        if (!mayhemIsActive(G.campaign)) throw new Error("Mayhem autosave did not restore");
        return { autosave: "mayhem", slots: ["historical", "mayhem"], undo: "historical" };
      } finally {
        cleanStorage();
      }
    });

    step("TEXT MODE LABELS", () => {
      const B = save("mayhem", "Label B");
      const A = save("historical", "Label A");
      try {
        cleanStorage();
        G.campaign = null;
        applySave(JSON.parse(JSON.stringify(B)));
        localStorage.setItem(_SAVE_KEY, JSON.stringify(B));
        if (!_slWrite(0, B)) throw new Error("label slot write failed");
        if ((_slMeta(0) || {}).rulesetLabel !== "Mayhem Campaign") throw new Error("slot metadata lacks Mayhem");
        if (_slDefaultSlotName().indexOf("Mayhem Campaign") < 0) throw new Error("default slot name lacks Mayhem");
        if (!_slImportPreview(JSON.stringify(B)).ok || _slImportPreview(JSON.stringify(B)).label !== "Mayhem Campaign") throw new Error("import preview lacks Mayhem");
        openMainMenu();
        const menuText = document.body.textContent || "";
        if (menuText.indexOf("Mode") < 0 || menuText.indexOf("Mayhem Campaign") < 0) throw new Error("H0 current-save menu lacks Mayhem text");

        _slOpenManager();
        const managerText = document.body.textContent || "";
        if (managerText.indexOf("Current mode: Mayhem Campaign") < 0) throw new Error("manager current-mode label missing");
        if (managerText.indexOf("Mode: Mayhem Campaign") < 0) throw new Error("slot row mode label missing");

        localStorage.setItem(_SL_UNDO_KEY, JSON.stringify({
          ver: 1, when: 424242, winnerSide: "US", type: "major", save: A
        }));
        const undoText = _slUndoHTML();
        if (undoText.indexOf("Mode: Historical Campaign") < 0) throw new Error("undo metadata lacks Historical label");
        return { h0: "Mayhem Campaign", slot: "Mayhem Campaign", undo: "Historical Campaign" };
      } finally {
        cleanStorage();
      }
    });

    step("FOUR CAMPAIGN ROUTES", () => {
      const priorMuster = _openMusterChoice;
      const calls = [];
      try {
        cleanStorage();
        G.campaign = null;
        _openMusterChoice = function (side) { calls.push(side); };
        openMainMenu();
        const us = document.getElementById("gnNewUS");
        const cs = document.getElementById("gnNewCS");
        if (!us || !cs) throw new Error("H0 campaign buttons missing");
        us.click();
        cs.click();
        if (!eq(calls, ["US", "CS"])) throw new Error("H0 routes bypassed shared picker seam: " + JSON.stringify(calls));
      } finally {
        _openMusterChoice = priorMuster;
      }
      return { h0: calls, legacy: "static-verified" };
    });

    step("PUBLIC COMPLETE-VERTICAL-SLICE GATE", () => {
      if (MAYHEM_PUBLIC_READY !== true) throw new Error("complete Slice C is not public");
      if (typeof mayhemProductionAdapters !== "function" || typeof mayhemNoQuarterApply !== "function") throw new Error("production surface missing");
      _mhClearPending();
      _openMusterChoice("US");
      if (!document.getElementById("mhRulesetPicker")) throw new Error("public chooser did not expose Mayhem");
      _mhClearPending();
      return { public: "historical+mayhem", ready: true };
    });

    step("HIDDEN PICKER CONTROL + A11Y SEMANTICS", () => {
      let announcements = 0;
      const priorAnnounce = typeof a11yAnnounce === "function" ? a11yAnnounce : null;
      try {
        a11yAnnounce = function () { announcements++; };
        _mhOpenRulesetPicker("CS");
        const picker = document.getElementById("mhRulesetPicker");
        const radios = Array.from(document.querySelectorAll('[data-mh-mode]'));
        const start = document.getElementById("mhStart");
        if (!picker || radios.length !== 2 || !start) throw new Error("picker controls missing");
        if (!radios.every(node => node.tagName === "BUTTON" && node.getAttribute("role") === "radio")) throw new Error("mode cards are not real radio buttons");
        if (radios.some(node => node.getAttribute("aria-checked") !== "false")) throw new Error("picker preselected a ruleset");
        if (!start.disabled || start.getAttribute("aria-disabled") !== "true") throw new Error("start enabled before selection");
        if (!document.getElementById("mhHistoricalDesc") || !document.getElementById("mhMayhemDesc")) throw new Error("mode descriptions missing");
        if (announcements !== 0) throw new Error("picker announced during render");

        radios[0].focus();
        radios[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
        if (radios[1].getAttribute("aria-checked") !== "true" || document.activeElement !== radios[1]) throw new Error("arrow-key selection/focus failed");
        if (start.textContent !== "Start Mayhem Campaign" || start.disabled) throw new Error("Mayhem confirmation copy/state failed");
        if (announcements !== 1) throw new Error("selection did not announce exactly once");
        const a = radios[0].getBoundingClientRect();
        const b = radios[1].getBoundingClientRect();
        if (Math.abs(a.width - b.width) > 3 || Math.abs(a.height - b.height) > 3) throw new Error("mode cards lost equal visual weight");

        document.documentElement.setAttribute("data-a11y-contrast", "high");
        const border = getComputedStyle(radios[0]).borderColor;
        document.documentElement.removeAttribute("data-a11y-contrast");
        if (!border || border === "rgba(0, 0, 0, 0)") throw new Error("high-contrast border disappeared");
        const css = (document.getElementById("mhPickerCss") || {}).textContent || "";
        if (css.indexOf("prefers-reduced-motion:reduce") < 0 || css.indexOf("@media(max-width:420px)") < 0) throw new Error("reduced-motion/narrow CSS missing");
        return { controls: 2, selected: "mayhem", announcements };
      } finally {
        if (priorAnnounce) a11yAnnounce = priorAnnounce;
      }
    });

    await asyncStep("BACK + ESCAPE + FOCUS RESTORATION", async () => {
      try {
        function prepare(id) {
          openMainMenu();
          const target = document.getElementById(id);
          if (!target) throw new Error("menu focus target missing: " + id);
          target.focus();
          _mhRememberFocus();
          _mhOpenRulesetPicker("US");
        }
        prepare("gnNewUS");
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await new Promise(resolveWait => setTimeout(resolveWait, 20));
        if (!document.getElementById("gnNewUS") || document.activeElement.id !== "gnNewUS") throw new Error("Escape did not restore focus");

        prepare("gnNewCS");
        const back = document.getElementById("mhBack");
        if (!back) throw new Error("Back control missing");
        back.click();
        await new Promise(resolveWait => setTimeout(resolveWait, 20));
        if (!document.getElementById("gnNewCS") || document.activeElement.id !== "gnNewCS") throw new Error("Back did not restore focus");
        return { escape: true, back: true };
      } finally {
        _mhClearPending();
        try { openMainMenu(); } catch (error) {}
      }
    });

    step("SLICE B CLOSED SCHEMA + ATOMIC RECEIPTS", () => {
      const declaration = GAME_DATA && GAME_DATA["mayhem-rules"];
      const expectedOps = [
        "battle.score.add","phase.score.add","objective.resolve","casualty.apply","casualty.credit","capture.credit",
        "result.declare","result.reclassify","campaign.victoryProgress.add","enemyWill.add","morale.add","discipline.add",
        "press.add","diplomacy.add","funds.add","resource.add","loot.grant","technology.unlock","weapon.grant",
        "career.promote","reputation.add","notoriety.add","achievement.unlock","modifier.add","roster.add",
        "roster.transfer","reinforcement.add","scenario.unlock","timeline.branch","chronicle.event"
      ];
      if (!declaration || declaration.schema !== "cw_mayhem_rules_v1" || declaration.version !== 1 || declaration.actions.length !== 2) throw new Error("Slice-C data document missing");
      const fixtureDeclaration = declaration.actions.find(x => x.id === "fixture.closed-pipeline");
      if (!fixtureDeclaration || !eq(fixtureDeclaration.effects.map(x => x.operation), expectedOps)) throw new Error("operation-family registry drifted");
      function fixture(failStage, failCommit) {
        const state = {}; const order = []; const adapters = {};
        expectedOps.forEach((id, index) => {
          state[id] = 0;
          adapters[id] = {
            stage(op) {
              order.push("stage:" + id);
              if (index === failStage) throw new Error("stage fixture");
              return { before: state[id], after: state[id] + op.value, token: { id, before: state[id], after: state[id] + op.value } };
            },
            commit(token) { order.push("commit:" + id); state[id] = token.after; if (index === failCommit) throw new Error("commit fixture"); },
            rollback(token) { order.push("rollback:" + id); state[id] = token.before; }
          };
        });
        return { state, order, adapters };
      }
      function makeContext(C, adapters, sequence) {
        return { campaign:C, ruleset:{id:"mayhem",version:1}, side:"US", timelineId:"timeline-1", battleId:"battle-1", phaseId:"phase-1", actorId:"actor-1", sequence, actorTags:[{namespace:"side",value:"us"},{namespace:"timeline",value:"active"}], adapters };
      }
      const C = campaign(null, "US"); mayhemInit(C, "mayhem", "new");
      const fx = fixture(-1, -1); const ctx = makeContext(C, fx.adapters, 1);
      const beforeCan = JSON.stringify(C);
      if (!mayhemCan("fixture.closed-pipeline", ctx) || JSON.stringify(C) !== beforeCan) throw new Error("mayhemCan is not pure/available");
      const receipt = mayhemApply("fixture.closed-pipeline", ctx);
      if (!receipt || receipt.operations.length !== expectedOps.length || receipt.id !== _mhReceiptId(ctx, "fixture.closed-pipeline")) throw new Error("deterministic receipt failed");
      if (!eq(receipt.operations.map(x => x.operation), expectedOps)) throw new Error("normalized operation order drifted");
      const receiptBytes = JSON.stringify(receipt);
      if (mayhemApply("fixture.closed-pipeline", ctx) !== null || C.mayhemReceipts.length !== 1) throw new Error("duplicate retry reapplied");
      const loaded = JSON.parse(JSON.stringify(C)); mayhemInit(loaded, null, "load");
      if (mayhemApply("fixture.closed-pipeline", makeContext(loaded, fx.adapters, 1)) !== null || JSON.stringify(loaded.mayhemReceipts[0]) !== receiptBytes) throw new Error("reload idempotency failed");
      const H = campaign(null,"US"); mayhemInit(H,"historical","new"); const hBytes=JSON.stringify(H);
      if (mayhemCan("fixture.closed-pipeline", makeContext(H,fx.adapters,1)) || mayhemApply("fixture.closed-pipeline",makeContext(H,fx.adapters,1)) !== null || JSON.stringify(H)!==hBytes) throw new Error("Historical refusal/bytes failed");
      const wrong = makeContext(C,fx.adapters,2); wrong.side="CS"; if(mayhemCan("fixture.closed-pipeline",wrong))throw new Error("wrong side accepted");
      const forged = makeContext(C,fx.adapters,2); forged.ruleset={id:"historical",version:1}; if(mayhemCan("fixture.closed-pipeline",forged))throw new Error("forged ruleset accepted");
      const stale = makeContext(C,fx.adapters,99); if(mayhemCan("fixture.closed-pipeline",stale))throw new Error("stale sequence accepted");
      const consumed = makeContext(C,fx.adapters,2); consumed.consumed=true; if(mayhemCan("fixture.closed-pipeline",consumed))throw new Error("consumed context accepted");
      const unknown = makeContext(C,fx.adapters,2); if(mayhemCan("fixture.unknown",unknown))throw new Error("unknown action accepted");
      const sf = fixture(5,-1), C2=campaign(null,"US"); mayhemInit(C2,"mayhem","new"); const s0=JSON.stringify(sf.state); if(mayhemApply("fixture.closed-pipeline",makeContext(C2,sf.adapters,1))!==null||JSON.stringify(sf.state)!==s0||C2.mayhemReceipts.length)throw new Error("stage failure was not atomic");
      const cf = fixture(-1,5), C3=campaign(null,"US"); mayhemInit(C3,"mayhem","new"); const c0=JSON.stringify(cf.state); if(mayhemApply("fixture.closed-pipeline",makeContext(C3,cf.adapters,1))!==null||JSON.stringify(cf.state)!==c0||C3.mayhemReceipts.length)throw new Error("commit failure was not rolled back");
      const dirty=campaign(null,"US"); dirty.ruleset={id:"mayhem",version:1}; dirty.mayhemReceipts=[{bad:true}]; mayhemInit(dirty,null,"load"); if(dirty.mayhemReceipts.length!==0)throw new Error("malformed loaded receipt survived");
      const capped=campaign(null,"US"); capped.ruleset={id:"mayhem",version:1}; capped.mayhemReceipts=[]; for(let i=1;i<=MAYHEM_RECEIPT_CAP+3;i++)capped.mayhemReceipts.push({id:"mh:cap-"+i,actionId:"fixture.closed-pipeline",sequence:i,operations:[]}); mayhemInit(capped,null,"load"); if(capped.mayhemReceipts.length!==MAYHEM_RECEIPT_CAP||capped.mayhemReceipts[0].sequence!==4)throw new Error("receipt cap/eviction failed");
      return { operations:expectedOps.length, receiptId:receipt.id, receiptBytes:receiptBytes.length, cap:MAYHEM_RECEIPT_CAP, ordering:fx.order.slice(0,3) };
    });

    step("SLICE C PRODUCTION ADAPTERS + NO-JUDGMENT RESULT", () => {
      const C=campaign(null,"US");mayhemInit(C,"mayhem","new");lootInit(C);
      C.mayhemNoQuarterOffer={timelineId:"timeline-1",battleId:"battle-1",captured:120,consumed:false};
      const ctx=_mhNoQuarterContext(C);if(!ctx||!mayhemCan("no-quarter",ctx))throw new Error("valid action unavailable");
      const receipt=mayhemNoQuarterApply(C);if(!receipt||receipt.operations.length!==4)throw new Error("production receipt missing");
      if(C.stats.mayhemScore!==25||C.stats.infl!==40)throw new Error("score/casualty values drifted");
      const ration=C.loot.inventory.find(x=>x.id==="commissary_rations");if(!ration||ration.qty!==1)throw new Error("reward missing");
      if(!Array.isArray(C.loot.modifiers)||C.loot.modifiers.length!==1||C.loot.modifiers[0].key!=="side:us:no-quarter-momentum")throw new Error("tagged advantage missing");
      if(mayhemNoQuarterApply(C)!==null||C.mayhemReceipts.length!==1)throw new Error("duplicate retry reapplied");
      const loaded=JSON.parse(JSON.stringify(C));mayhemInit(loaded,null,"load");if(mayhemNoQuarterApply(loaded)!==null)throw new Error("reload retry reapplied");
      const html=aarRenderReport(C,{final:false});if(!/Mayhem Campaign/.test(html)||!/Performance, consequences, rewards, and chaos/.test(html)||!/without a moral or plausibility grade/.test(html)||/Overall conduct of the war|Report-card grade|Moral GPA\s*:|Plausibility GPA\s*:/i.test(html))throw new Error("no-judgment result drifted");
      const H=campaign(null,"US");mayhemInit(H,"historical","new");H.mayhemNoQuarterOffer={timelineId:"timeline-1",battleId:"battle-1",captured:120,consumed:false};const hb=JSON.stringify(H);if(_mhNoQuarterContext(H)!==null||mayhemNoQuarterApply(H)!==null||JSON.stringify(H)!==hb)throw new Error("Historical refusal/bytes failed");
      const F=campaign(null,"US");mayhemInit(F,"mayhem","new");lootInit(F);F.mayhemNoQuarterOffer={timelineId:"timeline-1",battleId:"battle-1",captured:120,consumed:false};const fa=mayhemProductionAdapters(F);fa["modifier.add"].commit=function(){throw new Error("forced later commit");};const fctx=_mhNoQuarterContext(F);fctx.adapters=fa;const fb=JSON.stringify(F);if(mayhemApply("no-quarter",fctx)!==null||JSON.stringify(F)!==fb)throw new Error("production rollback/no-receipt failed");
      return{score:C.stats.mayhemScore,casualtyCredit:C.stats.infl,reward:ration.id,modifier:C.loot.modifiers[0].key,receiptId:receipt.id};
    });

    // ---- SLICE D (D437): standalone ruleset carry + the custom-content allowlist ----
    step("SLICE D STANDALONE RULESET CARRY (fail-closed; immutable snapshot)", () => {
      if (typeof mayhemStandaloneRuleset !== "function" || typeof mayhemBattleRuleset !== "function" || typeof mayhemBattleModeLabel !== "function") throw new Error("Slice D readers missing");
      // sanitizer law: exact copy or Historical
      if (mayhemStandaloneRuleset({ id:"mayhem", version:1 }).id !== "mayhem") throw new Error("exact mayhem snapshot rejected");
      [undefined, null, "mayhem", { id:"mayhem" }, { id:"mayhem", version:2 }, { id:"mayhem", version:1, extra:1 }, { id:"wild", version:1 }].forEach(bad => {
        if (mayhemStandaloneRuleset(bad).id !== "historical") throw new Error("malformed standalone ruleset did not fail closed: " + JSON.stringify(bad));
      });
      // launch carry: opts.ruleset stamps the live snapshot; default launch is Historical
      G.campaign = null;
      fldLaunchSandbox({ renderer:"none", autoBoth:true, seed:7, ruleset:{ id:"mayhem", version:1 } });
      if (!__FIELD.ruleset || __FIELD.ruleset.id !== "mayhem") throw new Error("opts.ruleset not carried into the live battle state");
      if (mayhemBattleRuleset().id !== "mayhem" || mayhemBattleModeLabel() !== "Mayhem") throw new Error("battle readers wrong under mayhem");
      fldExit(true);
      fldLaunchSandbox({ renderer:"none", autoBoth:true, seed:7 });
      if (mayhemBattleRuleset().id !== "historical") throw new Error("default standalone launch must be Historical");
      fldExit(true);
      return { carried:true };
    });

    step("SLICE D CUSTOM-SCENARIO ALLOWLIST (T11 fail-closed; local content never registers)", () => {
      if (typeof fldCustomValidate !== "function" || typeof mayhemKnownActionIds !== "function") throw new Error("custom validate/allowlist missing");
      const base = fldCustomDefaultDraft();
      // historical default: no ruleset field -> historical, empty action ids
      let r = fldCustomValidate(base);
      if (!r.ok || r.scenario.ruleset !== "historical" || r.scenario.mayhemActionIds.length !== 0) throw new Error("default draft must validate historical/empty");
      // declared mayhem ruleset passes and is carried
      r = fldCustomValidate(Object.assign({}, r.scenario, { ruleset:"mayhem" }));
      if (!r.ok || r.scenario.ruleset !== "mayhem") throw new Error("mayhem ruleset rejected");
      // known action id under mayhem passes; unknown id fails; ids under historical fail
      const known = mayhemKnownActionIds();
      if (!known.length || known.indexOf("no-quarter") < 0) throw new Error("declared catalog missing no-quarter");
      r = fldCustomValidate(Object.assign({}, fldCustomValidate(base).scenario, { ruleset:"mayhem", mayhemActionIds:["no-quarter"] }));
      if (!r.ok || r.scenario.mayhemActionIds.join(",") !== "no-quarter") throw new Error("known action id rejected under mayhem");
      r = fldCustomValidate(Object.assign({}, fldCustomValidate(base).scenario, { ruleset:"mayhem", mayhemActionIds:["invented-action"] }));
      if (r.ok || !r.errors.some(e => /not a registered Mayhem action id/.test(e))) throw new Error("invented action id not refused");
      r = fldCustomValidate(Object.assign({}, fldCustomValidate(base).scenario, { mayhemActionIds:["no-quarter"] }));
      if (r.ok || !r.errors.some(e => /requires ruleset "mayhem"/.test(e))) throw new Error("historical scenario with mayhem ids not refused");
      // the canonical registry stays clean: no custom/mayhem id may appear in fldScenarioRegistry
      const reg = fldScenarioRegistry();
      Object.keys(reg).forEach(id => { if (/^custom_/.test(id)) throw new Error("custom scenario leaked into the canonical registry: " + id); });
      return { known:known.length };
    });

    step("SLICE E CHRONICLE (pure reader over Slice-B receipts; named timeline; no history GPA)", () => {
      if (typeof mayhemChronicleHTML !== "function") throw new Error("mayhemChronicleHTML missing");
      const C=campaign(null,"US");mayhemInit(C,"mayhem","new");lootInit(C);
      C.timelineName="timeline-1";
      C.mayhemNoQuarterOffer={timelineId:"timeline-1",battleId:"battle-1",captured:120,consumed:false};
      const receipt=mayhemNoQuarterApply(C);if(!receipt)throw new Error("setup receipt failed");
      const before=JSON.stringify(C);
      const html=mayhemChronicleHTML(C);
      if(JSON.stringify(C)!==before)throw new Error("the Chronicle reader mutated the campaign (must be pure)");
      if(html.indexOf("Living War Chronicle")<0)throw new Error("Chronicle heading missing");
      if(html.indexOf("timeline-1")<0)throw new Error("the named timeline is not rendered");
      if(html.indexOf("Dispatch 1:")<0)throw new Error("the receipt dispatch row is missing");
      if(!/\(\d+ &rarr; \d+\)/.test(html))throw new Error("before/after values missing from the dispatch row");
      if(/plausib|moral/i.test(html))throw new Error("the Chronicle must carry no moral/plausibility judgment");
      // rendered inside the Mayhem AAR; absent for Historical (byte-equivalence holds upstream)
      const aar=aarRenderReport(C,{final:false});
      if(aar.indexOf("Living War Chronicle")<0)throw new Error("Chronicle not rendered in the Mayhem AAR");
      const H=campaign(null,"US");mayhemInit(H,"historical","new");
      if(mayhemChronicleHTML(H)!=="")throw new Error("Historical must render no Chronicle");
      // a tampered receipt is skipped, never rendered or repaired
      C.mayhemReceipts.push({id:"forged",actionId:"no-quarter",sequence:99,operations:[{operation:"result.declare",target:"x",value:1,before:0,after:1,extra:1}]});
      if(mayhemChronicleHTML(C).indexOf("Dispatch 99")>=0)throw new Error("a malformed receipt was rendered");
      return { dispatches:1 };
    });

    cleanStorage();
  } catch (error) {
    R.ok = false;
    R.errors.push("FATAL " + String(error && error.message || error));
  }
  return R;
}

async function inspectNarrowLayout(browser, probeUrl) {
  const page = await browser.newPage({ viewport: { width: 390, height: 820 } });
  const errors = [];
  page.on("pageerror", error => errors.push(String(error.message || error)));
  page.on("console", message => {
    if (message.type() === "error" && !/Failed to load resource.*404/.test(message.text())) errors.push("console:" + message.text());
  });
  try {
    await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" }).catch(() => {});
    await page.addInitScript(() => {
      try {
        localStorage.setItem("gor_welcomed", "1");
        localStorage.setItem("gor_tutorial_seen", "1");
        localStorage.removeItem("gor_save");
      } catch (error) {}
    });
    await page.goto(probeUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
    await sleep(700);
    const value = await page.evaluate(() => {
      _mhOpenRulesetPicker("US");
      document.body.style.zoom = "2";
      const picker = document.getElementById("mhRulesetPicker");
      const cards = Array.from(document.querySelectorAll(".mh-mode"));
      const actions = document.querySelector(".mh-picker-actions");
      if (!picker || cards.length !== 2 || !actions) throw new Error("narrow picker did not render");
      const pr = picker.getBoundingClientRect();
      const escaped = cards.concat(Array.from(actions.querySelectorAll("button"))).filter(node => {
        const r = node.getBoundingClientRect();
        return r.left < pr.left - 2 || r.right > pr.right + 2 || r.width < 44 || r.height < 44;
      });
      const overlap = (() => {
        const a = cards[0].getBoundingClientRect();
        const b = cards[1].getBoundingClientRect();
        return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
      })();
      const motion = getComputedStyle(cards[0]);
      const overflow = picker.scrollWidth > picker.clientWidth + 2;
      return {
        ok: escaped.length === 0 && !overlap && !overflow &&
          (motion.animationDuration === "0s" || motion.animationName === "none") &&
          (motion.transitionDuration === "0s" || motion.transitionProperty === "none"),
        escaped: escaped.map(node => node.id || node.className),
        overlap,
        overflow,
        animationDuration: motion.animationDuration,
        transitionDuration: motion.transitionDuration
      };
    });
    if (errors.length) return { ok: false, errors, value };
    return value;
  } finally {
    await page.close({ runBeforeUnload: false }).catch(() => {});
  }
}

(async () => {
  const probeUrl = cfg.baseUrl + "/" + cfg.file;
  let server = null;
  let browser = null;
  const pageerrors = [];
  const realErrors = [];
  let result = { ok: false, steps: [], errors: [] };
  try {
    if (!(await up(probeUrl))) {
      server = spawn("python3", ["-m", "http.server", String(cfg.port)], { cwd: ROOT, stdio: "ignore" });
      for (let i = 0; i < 80; i++) {
        if (await up(probeUrl)) break;
        await sleep(150);
      }
    }
    try {
      browser = await chromium.launch({ channel: "chrome", headless: true, args: GL });
    } catch {
      browser = await chromium.launch({
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: true,
        args: GL
      });
    }
    const page = await browser.newPage({ viewport: cfg.viewport });
    page.on("pageerror", error => pageerrors.push(String(error.message || error)));
    page.on("console", message => {
      if (message.type() === "error" && !/Failed to load resource.*404/.test(message.text())) realErrors.push(message.text());
    });
    await page.addInitScript(() => {
      try {
        localStorage.setItem("gor_welcomed", "1");
        localStorage.setItem("gor_tutorial_seen", "1");
        localStorage.removeItem("gor_save");
      } catch (error) {}
    });
    await page.goto(probeUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
    await sleep(900);
    result = await page.evaluate(browserSetup);
    await page.close({ runBeforeUnload: false }).catch(() => {});

    const evidence = staticEvidence();
    const routes = result.steps.find(item => item.name === "FOUR CAMPAIGN ROUTES");
    if (!routes || Object.values(evidence.routes).some(value => !value)) {
      result.ok = false;
      if (routes) {
        routes.ok = false;
        routes.err = "route source bindings drifted: " + JSON.stringify(evidence.routes);
      } else {
        result.steps.push({ name: "FOUR CAMPAIGN ROUTES", ok: false, err: "browser route step missing" });
      }
    } else {
      routes.v.static = evidence.routes;
    }

    const baselineOk =
      evidence.baseMd5 === "c9db83fa99230ffb95bdfdfe059f3fb9" &&
      evidence.saveVer === 1 &&
      evidence.applySaveSignature === "201fa746ea8e8755" &&
      evidence.dataCount === 57 &&   // D436: 55 -> 56 — atlanta.json. D442: 56 -> 57 — cold-harbor.json
      evidence.rosterIds.length === 26 &&   // D436: 24 -> 25 — atlanta. D442: 25 -> 26 — coldHarbor
      evidence.builderIds.length === 26 &&
      JSON.stringify(evidence.rosterIds) === JSON.stringify(evidence.builderIds) &&
      evidence.suiteCount === 133 &&   // D436: 131 -> 132 — the atlanta row appends at the suite end so the row-38/57 pins hold. D442: 132 -> 133 — the cold harbor row appends at the end likewise
      evidence.mayhemRow === 57 &&
      evidence.mayhemFile === "tools/probe-mayhem-mode.mjs" &&
      evidence.warCareerRow === 38 &&
      evidence.moduleAfter106;
    result.steps.push({
      name: "EXCLUSIONS + BASELINES + SUITE",
      ok: baselineOk,
      v: evidence,
      ...(baselineOk ? {} : { err: "Slice-A frozen baseline or suite placement drifted" })
    });
    if (!baselineOk) result.ok = false;

    const layout = await inspectNarrowLayout(browser, probeUrl);
    result.steps.push({
      name: "NARROW + 200% + HIGH-CONTRAST + REDUCED-MOTION",
      ok: layout.ok === true,
      v: layout,
      ...(layout.ok === true ? {} : { err: "accessible narrow layout failed" })
    });
    if (layout.ok !== true) result.ok = false;
  } catch (error) {
    result = { ok: false, fatal: String(error && error.message || error), steps: result.steps || [], errors: result.errors || [] };
  } finally {
    result.pageerrors = pageerrors;
    result.realErrors = realErrors;
    if (pageerrors.length || realErrors.length) result.ok = false;
    writeFileSync(ART, JSON.stringify(result, null, 2));
    if (browser) await browser.close().catch(() => {});
    if (server) {
      try { server.kill(); } catch {}
    }
  }
  const passed = (result.steps || []).filter(item => item.ok).length;
  const failed = (result.steps || []).filter(item => !item.ok).length;
  console.log("probe-mayhem-mode: " + passed + "/" + (result.steps || []).length +
    " steps ok" + (failed ? ", " + failed + " FAIL" : ", 0 fail") +
    " pageerrors=" + pageerrors.length + " realErrors=" + realErrors.length);
  for (const item of result.steps || []) {
    if (!item.ok) console.error("  FAIL:", item.name, item.err || "");
  }
})();

// D230/E37 standalone teeth: the process cannot exit green on a stale, unreadable,
// ok:false, pageerror, realError, or failed-step artifact.
process.on("beforeExit", code => {
  if (code !== 0) return;
  try {
    if (statSync(ART).mtimeMs < TEETH_T0 - 2000) throw new Error("artifact not rewritten this run");
    const artifact = JSON.parse(readFileSync(ART, "utf8"));
    const failed = Array.isArray(artifact.steps) ? artifact.steps.filter(item => item && item.ok === false).length : 0;
    const pageErrorCount = Array.isArray(artifact.pageerrors) ? artifact.pageerrors.length : 0;
    const realErrorCount = Array.isArray(artifact.realErrors) ? artifact.realErrors.length : 0;
    if (artifact.ok === false || failed || pageErrorCount || realErrorCount) {
      throw new Error("ok=" + artifact.ok + " failedSteps=" + failed +
        " pageerrors=" + pageErrorCount + " realErrors=" + realErrorCount);
    }
  } catch (error) {
    console.error("probe-mayhem-mode: TEETH FAIL - " + String(error && error.message || error));
    process.exit(1);
  }
});
