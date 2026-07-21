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
    suiteBlock.matchAll(/^\s*\['([^']+)',\s*'([^']+)'\],?\s*(?:\/\/.*)?$/gm),   // D443 (AD-5, the D393 parser lesson): the D436/D442 rows carry trailing pin-history comments this parser silently dropped
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
      // D457 re-pin (documented chain): actions 2 -> 3 — LANE-012 Slice 2 adds the declared
      // `no-quarter-historical` consequence-only action (rulesetId "historical") beside the
      // shipped Mayhem pair. The closed schema, version, and operation registry hold.
      if (!declaration || declaration.schema !== "cw_mayhem_rules_v1" || declaration.version !== 1 || declaration.actions.length !== 3) throw new Error("Slice-C data document missing");
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
      // D457 chain (LANE-012 Slice 2 SPLITS this tooth's old meaning): the D420 pin read
      // "nothing no-quarter is reachable in Historical"; the SURVIVING HALF is that the
      // Mayhem REWARD context/apply still refuse under Historical with zero mutation —
      // KEPT below unchanged. The judged consequence-only action is now legal in
      // Historical and is toothed separately (the SLICE 2 step's t3/t4).
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

    // MAYHEM SLICE F (D452, AUDIT-DEBT AD-19): the skirmish standalone ruleset picker UI.
    // BIND A PREDECLARATION - removing T2's gated _fldSkOptRow("Ruleset", ...) row must red
    // exactly this step's segment-presence assert, nothing else.
    // BIND B PREDECLARATION - removing the launch's opts.ruleset pass must red exactly this
    // step's mayhem-choice-rides-opts assert.
    step("SLICE F SKIRMISH RULESET PICKER (gated segment; Historical default; §3.4 exact-copy opts; reset-on-open; Historical launch carries NO key)", () => {
      if (typeof fldSkirmishMenu !== "function" || typeof fldSkirmishLaunch !== "function" || typeof _fldSkMayhemAvail !== "function")
        throw new Error("skirmish Slice-F API missing");
      G.campaign = null;
      fldSkirmishMenu();
      const seg = document.querySelectorAll('[data-skg="ruleset"]');
      if (seg.length !== 2) throw new Error("ruleset segment buttons: " + seg.length);
      const hist = document.querySelector('[data-skg="ruleset"][data-skv="historical"]');
      if (!hist || hist.getAttribute("aria-pressed") !== "true") throw new Error("Historical is not the pressed default");
      document.querySelector('[data-skg="ruleset"][data-skv="mayhem"]').click();
      const may2 = document.querySelector('[data-skg="ruleset"][data-skv="mayhem"]');
      if (!may2 || may2.getAttribute("aria-pressed") !== "true") throw new Error("the Mayhem chip did not press");
      const orig = fldLaunchSandbox;
      let captured = null;
      try {
        fldLaunchSandbox = function (o) { captured = o; };
        fldSkirmishLaunch();
      } finally { fldLaunchSandbox = orig; }
      if (!captured || !captured.ruleset || captured.ruleset.id !== "mayhem" || captured.ruleset.version !== 1 || Object.keys(captured.ruleset).length !== 2)
        throw new Error("the Mayhem choice did not ride opts.ruleset exactly: " + JSON.stringify(captured && captured.ruleset));
      // reset-on-open (§3.4: never a sticky preference) + the Historical byte-equivalence key-absence
      fldSkirmishMenu();
      const hist2 = document.querySelector('[data-skg="ruleset"][data-skv="historical"]');
      if (!hist2 || hist2.getAttribute("aria-pressed") !== "true") throw new Error("reset-on-open failed — a sticky ruleset preference");
      captured = null;
      try {
        fldLaunchSandbox = function (o) { captured = o; };
        fldSkirmishLaunch();
      } finally { fldLaunchSandbox = orig; }
      if (!captured || ("ruleset" in captured)) throw new Error("a Historical skirmish launch must carry NO ruleset key");
      if (typeof closeSheet === "function") closeSheet();
      // D453 AUDIT ROOT-FIX TOOTH (design §8.2): a free-battle launch has no briefing sheet, so
      // the persistent HUD title is the "custom/free-battle launch" chip surface — a Mayhem
      // launch names itself; a Historical launch's title carries no Mayhem token (byte-identical).
      const sk = { playerSide: "US", year: 1862, countPlayer: 1, countEnemy: 1, menPlayer: 400, menEnemy: 400, terrain: "woods", name: "Skirmish" };
      G.campaign = null;
      fldLaunchSandbox({ renderer: "2d", autoBoth: true, seed: 7, skirmish: sk, ruleset: { id: "mayhem", version: 1 } });
      fldRenderTop();
      let ti = document.getElementById("fldTitle");
      if (!ti || ti.textContent.indexOf("MAYHEM RULESET") < 0) throw new Error("Mayhem free-battle launch missing the persistent HUD chip");
      fldExit(true);
      fldLaunchSandbox({ renderer: "2d", autoBoth: true, seed: 7, skirmish: sk });
      fldRenderTop();
      ti = document.getElementById("fldTitle");
      if (!ti || ti.textContent.indexOf("MAYHEM") >= 0) throw new Error("a Historical free-battle title must carry no Mayhem token");
      fldExit(true);
      return { gate: MAYHEM_PUBLIC_READY === true };
    });

    // LANE-012 SLICE 1 (D455 §4a.2 — the D416 amendment): the always-visible teaching
    // companion. The companion INFORMS; it never grades — Mayhem keeps its no-moral-GPA
    // charter while the sourced "In history…" juxtaposition rides every Mayhem AAR and
    // every Chronicle dispatch.
    // BIND A PREDECLARATION - the companion API absent must red exactly the presence asserts
    // here (+ the briefing probe's presence teeth); the guarded byte-equivalence asserts stay
    // green by construction. EXECUTED FORM (D### slice record): a manifest drop is REFUSED
    // fail-closed by the build's manifest-completeness gate (BUILD FAIL [5] proven at bind
    // time), so the bind renames the three tc* composers instead - same absence, build-legal.
    // BIND B PREDECLARATION - stripping the committed attribution tail from tcChronicleLine
    // must red exactly this step's Chronicle-attribution assert.
    step("SLICE 1 TEACHING COMPANION (D455 §4a.2 — always-visible both modes; informs never grades; Chronicle juxtaposition; guarded byte-equivalence)", () => {
      if (typeof tcMayhemPanel !== "function" || typeof tcChronicleLine !== "function" || typeof tcBriefingPanel !== "function")
        throw new Error("Slice-1 companion API missing");
      // (1) The Mayhem AAR carries the companion; a seeded divergence renders its COMMITTED hist line.
      const C = campaign(null, "CS"); mayhemInit(C, "mayhem", "new");
      C.timelineName = "timeline-1";
      C.strategy = { armEnslaved: true, wildsPlayed: [] };
      const before = JSON.stringify(C);
      const aarC = aarRenderReport(C, { final: false });
      if (JSON.stringify(C) !== before) throw new Error("the companion mutated the campaign (must be pure)");
      if (aarC.indexOf("tc-companion") < 0 || aarC.indexOf("In history") < 0) throw new Error("Mayhem AAR companion missing");
      if (aarC.indexOf("Cleburne") < 0) throw new Error("the seeded divergence's committed hist line is not rendered");
      const tcHtml = tcMayhemPanel(C);
      if (tcHtml.indexOf("informs; it does not grade") < 0) throw new Error("the no-grading contract line is missing");
      const verdict = ["Legendary", "Masterful", "Workmanlike", "Faltering", "A failure", "GPA", "report card"].filter(w => tcHtml.indexOf(w) >= 0);
      if (/\bgraded?\b/i.test(tcHtml.replace(/does not grade/g, ""))) verdict.push("grade");
      if (verdict.length) throw new Error("companion carries verdict vocabulary: " + verdict.join(","));
      if (tcHtml.indexOf("tc-src") < 0) throw new Error("companion sources line missing");
      // (2) The Chronicle juxtaposition: a real no-quarter dispatch carries the sourced In-history
      // line composed from the committed codex corpus (Forrest / USCT) with its attributions.
      const M = campaign(null, "US"); mayhemInit(M, "mayhem", "new"); lootInit(M);
      M.timelineName = "timeline-1";
      M.mayhemNoQuarterOffer = { timelineId: "timeline-1", battleId: "battle-1", captured: 120, consumed: false };
      if (!mayhemNoQuarterApply(M)) throw new Error("setup receipt failed");
      const chronM = mayhemChronicleHTML(M);
      if (chronM.indexOf("tc-chronicle-line") < 0 || chronM.indexOf("Fort Pillow") < 0) throw new Error("Chronicle juxtaposition missing");
      if (!/\(American Battlefield Trust[^)]*McPherson, Battle Cry of Freedom\.\)/.test(chronM)) throw new Error("the Chronicle line's committed attributions are missing");
      // (3) BOTH-MODES presence without double-render: Historical's AAR carries NO Mayhem
      // companion node (its own read-back already carries the corpus); the divergence tab
      // keeps the sourced corpus under BOTH rulesets.
      const H = campaign(null, "US"); mayhemInit(H, "historical", "new");
      if (tcMayhemPanel(H) !== "") throw new Error("the Mayhem companion must return '' for Historical");
      if (aarRenderReport(H, { final: false }).indexOf("tc-companion") >= 0) throw new Error("Historical AAR must not carry the Mayhem companion node");
      if (divRenderTab(C).indexOf("In history") < 0) throw new Error("divergence tab under Mayhem lost its In-history corpus");
      if (divRenderTab(C).indexOf("Sources: McPherson") < 0 || divRenderTab(H).indexOf("Sources: McPherson") < 0)
        throw new Error("the divergence tab's sources foot is missing in a mode");
      // (4) Guarded byte-equivalence: stubbing each composer off yields EXACTLY render-minus-node.
      const chronWith = mayhemChronicleHTML(M);
      const aarWith = aarRenderReport(C, { final: false });
      const aside = (aarWith.match(/<aside class="tc-companion"[\s\S]*?<\/aside>/) || [null])[0];
      const lineRe = /<div class="tc-chronicle-line"[\s\S]*?<\/div>/g;
      if (!aside || !lineRe.test(chronWith)) throw new Error("companion nodes not found for the guard proof");
      const savedP = tcMayhemPanel, savedL = tcChronicleLine;
      let aarWithout, chronWithout;
      try { tcMayhemPanel = 0; tcChronicleLine = 0; aarWithout = aarRenderReport(C, { final: false }); chronWithout = mayhemChronicleHTML(M); }
      finally { tcMayhemPanel = savedP; tcChronicleLine = savedL; }
      if (chronWithout !== chronWith.replace(lineRe, "")) throw new Error("guarded Chronicle absence is not byte-identical to render-minus-line");
      if (aarWithout !== aarWith.replace(aside, "")) throw new Error("guarded AAR absence is not byte-identical to render-minus-panel");
      return { companion: true };
    });

    // LANE-012 SLICE 2 (D455 §3 row 2 + §4a.1): the Historical surrender/no-quarter unlock —
    // JUDGED, NEVER REWARDED. The engine-level MASSACRE-BLOCK is LOAD-BEARING: a red on
    // t1/t2 is a design failure, never a tooth to move.
    // BIND A PREDECLARATION - disabling the engine's historical reward-family refusal (the
    // _MH_HISTORICAL_OPS massacre-block in _mhResolve) must red EXACTLY t1 + t2, nothing else.
    // BIND B PREDECLARATION - tampering the data action with a battle.score.add effect must
    // red EXACTLY t3 (the apply refuses; the thrown message carries the bytes-unchanged
    // proof) plus t5's offer-presence half, with zero campaign mutation.
    step("SLICE 2 HISTORICAL NO-QUARTER (t1 massacre-block; t2 sign law; t3 consequences-only; t4 reward split; t5 judged panel; t6 reprisal read)", () => {
      if (typeof mayhemHistoricalAdapters !== "function" || typeof mayhemNoQuarterHistApply !== "function" ||
          typeof _mhNoQuarterHistContext !== "function" || typeof mhJudgedNoQuarterPanel !== "function" ||
          typeof mayhemInfamyTotal !== "function") throw new Error("Slice-2 API missing");
      const dataDoc = GAME_DATA["mayhem-rules"];
      function fixtureAdapters() {
        const state = {}; const adapters = {};
        ["battle.score.add","morale.add","press.add","diplomacy.add","notoriety.add","modifier.add","chronicle.event"].forEach(id => {
          state[id] = 0;
          adapters[id] = { stage(op){ return { before:state[id], after:state[id]+op.value, token:{ id, after:state[id]+op.value } }; }, commit(t){ state[t.id]=t.after; }, rollback(){} };
        });
        return adapters;
      }
      function histCampaign(side) { const C = campaign(null, side || "US"); mayhemInit(C, "historical", "new"); return C; }
      function histFixture(id, effects) {
        return { id, rulesetId:"historical", availableWhen:[{id:"ruleset.is",value:"historical"},{id:"side.isActor"}], actorTags:[{namespace:"side",value:"actor"}], effects, presentation:{label:"F",summary:"f",tone:"t",icon:"i"} };
      }
      function histContext(C, adapters, seq) {
        return { campaign:C, ruleset:{id:"historical",version:1}, side:C.side, timelineId:"timeline-1", battleId:"battle-1", phaseId:"result", actorId:String(C.side).toLowerCase()+"-command", sequence:seq||1, actorTags:[{namespace:"side",value:String(C.side).toLowerCase()}], adapters };
      }
      // (t1) a fixture historical action carrying battle.score.add resolves null, bytes unchanged.
      // The fixture context supplies FULL adapter coverage so the massacre-block is the ONLY refuser.
      const savedActions = dataDoc.actions;
      try {
        dataDoc.actions = savedActions.concat([histFixture("fixture.hist-reward", [{operation:"battle.score.add",target:"actor",value:10}])]);
        const C1 = histCampaign("US"); const b1 = JSON.stringify(C1);
        if (_mhResolve("fixture.hist-reward", histContext(C1, fixtureAdapters(), 1)) !== null) throw new Error("t1: a historical action carrying battle.score.add must resolve null (the massacre-block)");
        if (mayhemApply("fixture.hist-reward", histContext(C1, fixtureAdapters(), 1)) !== null) throw new Error("t1: the apply must refuse");
        if (JSON.stringify(C1) !== b1) throw new Error("t1: the refusal mutated the campaign");
        // (t2) a consequence op with a reward-direction sign is refused (morale.add +5; notoriety.add -5)
        dataDoc.actions = savedActions.concat([histFixture("fixture.hist-sign", [{operation:"morale.add",target:"actor",value:5}])]);
        const C2 = histCampaign("US"); const b2 = JSON.stringify(C2);
        if (_mhResolve("fixture.hist-sign", histContext(C2, fixtureAdapters(), 1)) !== null) throw new Error("t2: morale.add +5 under historical must be refused (the sign law)");
        if (JSON.stringify(C2) !== b2) throw new Error("t2: the sign refusal mutated the campaign");
        dataDoc.actions = savedActions.concat([histFixture("fixture.hist-neg", [{operation:"notoriety.add",target:"actor",value:-5}])]);
        if (_mhResolve("fixture.hist-neg", histContext(histCampaign("US"), fixtureAdapters(), 1)) !== null) throw new Error("t2: notoriety.add -5 must be refused (the ledger only rises)");
      } finally { dataDoc.actions = savedActions; }
      // (t3) the applied receipt moves ONLY the four consequence targets; every reward
      // surface is byte-unchanged; vicMomentum after <= before. The before/after numbers in
      // this step's artifact value ARE the logged deterministic A/B evidence for the
      // magnitude balance call.
      const M = histCampaign("US"); lootInit(M);
      M.blockade = { recognition: 20 }; M.strategy = { enemyWill: 70 };
      moraleInit(M); pressInit(M);
      M.mayhemNoQuarterOffer = { timelineId:"timeline-1", battleId:"battle-1", captured:120, consumed:false };
      const publicBefore = moraleCompute(M).public, pressBefore = pressSentiment(M), recogBefore = M.blockade.recognition;
      const lootBytes = JSON.stringify(M.loot.inventory), statsBytes = JSON.stringify(M.stats), modifiersBytes = JSON.stringify(M.loot.modifiers);
      const momBefore = vicMomentum(M);
      const before = JSON.stringify(M);
      const receipt = mayhemNoQuarterHistApply(M);
      if (!receipt) throw new Error("t3: historical apply refused (bytes unchanged: " + (JSON.stringify(M) === before) + ")");
      const opIds = receipt.operations.map(o => o.operation).join(",");
      if (opIds !== "morale.add,press.add,diplomacy.add,notoriety.add") throw new Error("t3: the op set drifted: " + opIds);
      receipt.operations.forEach(o => { if (o.operation === "notoriety.add") { if (!(o.value >= 0)) throw new Error("t3: notoriety must be >= 0"); } else if (!(o.value <= 0)) throw new Error("t3: " + o.operation + " must be <= 0"); });
      if (!(M.morale.infamyShock < 0)) throw new Error("t3: M.infamyShock did not move");
      if (!(M.press.infamyShock < 0)) throw new Error("t3: the press infamyShock did not move");
      if (!(M.blockade.recognition > recogBefore)) throw new Error("t3: a US actor's recognition must move AGAINST the actor (up)");
      if (!(mayhemInfamyTotal(M) === 25 && M.infamy.events.length === 1)) throw new Error("t3: the infamy ledger did not open");
      if (M.stats.mayhemScore !== undefined) throw new Error("t3: mayhemScore must stay absent");
      if (JSON.stringify(M.stats) !== statsBytes) throw new Error("t3: stats moved (score/infl)");
      if (JSON.stringify(M.loot.inventory) !== lootBytes) throw new Error("t3: the loot inventory moved");
      if (JSON.stringify(M.loot.modifiers) !== modifiersBytes) throw new Error("t3: loot modifiers moved");
      const momAfter = vicMomentum(M);
      if (!(momAfter <= momBefore)) throw new Error("t3: vicMomentum rose");
      const publicAfter = moraleCompute(M).public, pressAfter = pressSentiment(M);
      if (!(publicAfter < publicBefore)) throw new Error("t3: public will must fall");
      if (!(pressAfter < pressBefore)) throw new Error("t3: press sentiment must fall");
      if (mayhemNoQuarterHistApply(M) !== null || M.mayhemReceipts.length !== 1) throw new Error("t3: a duplicate retry reapplied");
      // (t4) THE SURVIVING HALF of the "Historical refusal/bytes failed" family, re-pinned
      // with its documented chain (D457): the D420 tooth read "nothing no-quarter is
      // reachable in Historical"; Slice 2 SPLITS it — the Mayhem REWARD action still
      // refuses under Historical with zero mutation (KEPT here), while the judged
      // consequence-only action is legal (t3 above).
      const H = histCampaign("US"); H.mayhemNoQuarterOffer = { timelineId:"timeline-1", battleId:"battle-1", captured:120, consumed:false };
      const hb = JSON.stringify(H);
      if (_mhNoQuarterContext(H) !== null) throw new Error("t4: the Mayhem offer context must stay null under Historical");
      if (mayhemNoQuarterApply(H) !== null) throw new Error("t4: the Mayhem reward apply must still refuse under Historical");
      if (mayhemCan("no-quarter", _mhNoQuarterHistContext(H)) !== false) throw new Error("t4: the Mayhem reward action must refuse a historical context");
      if (JSON.stringify(H) !== hb) throw new Error("t4: the Historical refusal mutated bytes");
      // (t5) the judged panel: ALL consequences stated before confirmation; factual
      // condemnation with committed attributions on the applied receipt; the infamy ledger
      // while total > 0; the no-offer/no-infamy Historical AAR byte-identical (guard-exact).
      const J = histCampaign("US"); J.mayhemNoQuarterOffer = { timelineId:"timeline-1", battleId:"battle-1", captured:120, consumed:false };
      J.blockade = { recognition: 20 };
      const offerHtml = aarRenderReport(J, { final:false });
      if (offerHtml.indexOf("mh-judged") < 0) throw new Error("t5: the judged panel is missing with a live offer");
      if (offerHtml.indexOf("Judged, never rewarded") < 0) throw new Error("t5: the judged framing is missing");
      ["Your own public will","Your press standing","European standing","infamy ledger"].forEach(tok => { if (offerHtml.indexOf(tok) < 0) throw new Error("t5: the offer must state every consequence before confirmation: " + tok); });
      if (offerHtml.indexOf("data-mh-no-quarter") < 0) throw new Error("t5: the confirm button is missing");
      if (!mayhemNoQuarterHistApply(J)) throw new Error("t5: the setup apply failed");
      const appliedHtml = aarRenderReport(J, { final:false });
      if (appliedHtml.indexOf("Quarter was refused") < 0) throw new Error("t5: the applied receipt does not render");
      if (appliedHtml.indexOf("Fort Pillow") < 0) throw new Error("t5: the committed Fort Pillow condemnation is missing");
      if (!/\(American Battlefield Trust[^)]*McPherson, Battle Cry of Freedom\.\)/.test(appliedHtml)) throw new Error("t5: the condemnation's committed attributions are missing");
      if (appliedHtml.indexOf("General Order No. 252") < 0) throw new Error("t5: the committed GO 252 line is missing");
      if (appliedHtml.indexOf("The Infamy Ledger") < 0) throw new Error("t5: the infamy ledger section is missing while total > 0");
      if (appliedHtml.indexOf("Overall conduct of the war") < 0 || appliedHtml.indexOf("The report card") < 0) throw new Error("t5: the graded AAR frame moved (the round-5 law)");
      const K = histCampaign("US");
      if (mhJudgedNoQuarterPanel(K) !== "") throw new Error("t5: the panel must return '' with no offer and no infamy");
      const withFn = aarRenderReport(K, { final:false });
      const savedPanel = mhJudgedNoQuarterPanel;
      let withoutFn;
      try { mhJudgedNoQuarterPanel = 0; withoutFn = aarRenderReport(K, { final:false }); }
      finally { mhJudgedNoQuarterPanel = savedPanel; }
      if (withFn !== withoutFn) throw new Error("t5: the no-offer/no-infamy Historical AAR is not byte-identical to the panel-stubbed render");
      const MM = campaign(null, "US"); mayhemInit(MM, "mayhem", "new");
      if (mhJudgedNoQuarterPanel(MM) !== "") throw new Error("t5: the judged panel must return '' for Mayhem (its charter is the no-GPA readout)");
      // (t6) the reprisal read moves the exchange snapshot ONLY when C.infamy.total > 0
      const P0 = histCampaign("US"); const s0 = prisonerExchangeSnapshot(P0);
      const P1 = histCampaign("US"); P1.infamy = { total:25, events:[{battleId:"battle-1",value:25,sequence:1}] };
      const s1 = prisonerExchangeSnapshot(P1);
      if (!(s1.pressure > s0.pressure)) throw new Error("t6: infamy must raise cartel pressure");
      if (!(s1.exchangeFunction < s0.exchangeFunction)) throw new Error("t6: infamy must lower the exchange function");
      const P2 = histCampaign("US"); P2.infamy = { total:0, events:[] };
      if (JSON.stringify(prisonerExchangeSnapshot(P2)) !== JSON.stringify(s0)) throw new Error("t6: a zero ledger must be an exact no-op");
      function pxFixture(withInfamy) {
        const C = histCampaign("US");
        C.prisoners = { active:false, detained:{US:1000,CS:1000}, returned:{US:0,CS:0}, deaths:{US:0,CS:0}, log:[] };
        if (withInfamy) C.infamy = { total:100, events:[] };
        return C;
      }
      const pxA = pxFixture(false), pxB = pxFixture(true);
      prisonerExchangeOnResolve("US", "major", { casualties:{US:0,CS:0} }, pxA, true);
      prisonerExchangeOnResolve("US", "major", { casualties:{US:0,CS:0} }, pxB, true);
      if (!(pxB.prisoners.returned.US < pxA.prisoners.returned.US)) throw new Error("t6: infamy must durably reduce returned prisoners (the cartel-breakdown chain)");
      // the standing A/B at the offer seam: no captures -> no stamp -> bytes unchanged; the
      // captured chain stamps the same offer shape for Historical.
      const priorAdv = _MH_BASE_CAMPAIGN_ADVANCE;
      try {
        _MH_BASE_CAMPAIGN_ADVANCE = function () {};
        const N = histCampaign("US"); G.campaign = N; G.battle = { id:"battle-1" };
        const nb = JSON.stringify(N);
        campaignAdvance("US", "major");
        if (N.mayhemNoQuarterOffer !== undefined || JSON.stringify(N) !== nb) throw new Error("A/B: a no-captures Historical resolve must stamp nothing (bytes unchanged)");
        G.battle = { id:"battle-1", mayhemCapturedByPlayer:120 };
        campaignAdvance("US", "major");
        if (!N.mayhemNoQuarterOffer || N.mayhemNoQuarterOffer.captured !== 120) throw new Error("the Historical offer must stamp from the captured chain");
      } finally { _MH_BASE_CAMPAIGN_ADVANCE = priorAdv; G.campaign = null; G.battle = null; }
      return {
        ab: { publicBefore, publicAfter, pressBefore, pressAfter, recogBefore, recogAfter: M.blockade.recognition, infamy: mayhemInfamyTotal(M) },
        reprisal: { pressure0: s0.pressure, pressure1: s1.pressure, exchange0: s0.exchangeFunction, exchange1: s1.exchangeFunction, returnedClean: pxA.prisoners.returned.US, returnedInfamy: pxB.prisoners.returned.US }
      };
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
      evidence.applySaveSignature === "820f02da7a3e6341" &&   // D491: additive politics sanitation enrolled in applySave; _SAVE_VER remains 1
      evidence.dataCount === 64 &&   // D436: 55 -> 56 — atlanta.json. D442: 56 -> 57 — cold-harbor.json. D445: 57 -> 58 — chief-of-staff.json (GEA-08). D446: 58 -> 59 — concept-links.json (GEA-10). D463: 59 -> 60 — fort-pillow.json; D469: 60 -> 61 — crater.json (LANE-015); D470: 61 -> 62 — olustee.json (LANE-016); D491: 62 -> 63 — politics.json (LANE-018 Slice 3); D504: 63 -> 64 — conquest-territories.json (LANE-019 Slice 1)
      evidence.rosterIds.length === 29 &&   // D436: 24 -> 25 — atlanta. D442: 25 -> 26 — coldHarbor. D463: 26 -> 27 — fortPillow (LANE-013 P4). D469: 27 -> 28 — crater (LANE-015); D470: 28 -> 29 — olustee (LANE-016)
      evidence.builderIds.length === 29 &&
      JSON.stringify(evidence.rosterIds) === JSON.stringify(evidence.builderIds) &&
      evidence.suiteCount === 140 &&   // D436: 131 -> 132 — the atlanta row appends at the suite end so the row-38/57 pins hold. D442: 132 -> 133 — the cold harbor row appends at the end likewise. D444: 133 -> 134 — learn-battle. D445: 134 -> 135 — chief-of-staff. D446: 135 -> 136 — concept-links, each at the end likewise. D447: 136 -> 137 — memory-chain. D463: 137 -> 138 — fort-pillow; D469: 138 -> 139 — crater (LANE-015); D470: 139 -> 140 — olustee (LANE-016) (LANE-013 P4), each at the END so the row-38/57 pins hold
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
