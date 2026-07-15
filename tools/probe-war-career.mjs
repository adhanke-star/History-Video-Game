#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D400 Slice A focused gate: canonical War Career spine, nonqualifying
// observations, terminal Ironman honesty, named-slot law, and route parity.

import { chromium } from "playwright-core";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = join(__dirname, "shots");
const OUTFILE = join(OUT, "probe-war-career.json");
const SHOT = join(OUT, "probe-war-career.png");
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
function md5(path) {
  return createHash("md5").update(readFileSync(path)).digest("hex");
}
function occurrences(text, token) {
  return text.split(token).length - 1;
}

function staticPreflight() {
  const runtime = readFileSync(join(ROOT, "src", "106-war-career.js"), "utf8");
  const journey = readFileSync(join(ROOT, "src", "37-loot-survival.js"), "utf8");
  const aar = readFileSync(join(ROOT, "src", "82-after-action.js"), "utf8");
  const slots = readFileSync(join(ROOT, "src", "91-save-slots.js"), "utf8");
  const manifest = JSON.parse(readFileSync(join(ROOT, "src", "00-manifest.json"), "utf8"));
  const vet = readFileSync(join(ROOT, "tools", "vet-no-regression.mjs"), "utf8");
  const list = execFileSync(process.execPath, [join(ROOT, "tools", "vet-no-regression.mjs"), "--list"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const rows = list.trim().split(/\r?\n/).filter(Boolean);
  const checks = [];
  function check(name, ok, detail) {
    checks.push({ name, ok: !!ok, detail: detail == null ? null : detail });
  }

  const modules = manifest.modules || [];
  const index105 = modules.indexOf("105-save-guard.js");
  const index106 = modules.indexOf("106-war-career.js");
  check("runtime marker exactly once", occurrences(runtime, "WAR_CAREER_RUNTIME_V1") === 1, occurrences(runtime, "WAR_CAREER_RUNTIME_V1"));
  check("journey marker exactly once", occurrences(journey, "WAR_CAREER_JOURNEY_ADAPTER_V1") === 1, occurrences(journey, "WAR_CAREER_JOURNEY_ADAPTER_V1"));
  check("AAR seam marker exactly once", occurrences(aar, "WAR_CAREER_AAR_SEAM_V1") === 1, occurrences(aar, "WAR_CAREER_AAR_SEAM_V1"));
  check("106 follows 105", index105 >= 0 && index106 === index105 + 1, { index105, index106 });
  check("campaignAdvance not an override", !(manifest.overrides || []).includes("campaignAdvance"), manifest.overrides || []);
  check("assignment wrapper only", !/function\s+campaignAdvance\s*\(/.test(runtime), null);
  check("suite is 130", rows.length === 130, rows.length);
  check("focused row is 38", /^38\s+war career\s+::\s+tools\/probe-war-career\.mjs$/.test(rows[37] || ""), rows[37] || "missing");
  check("focused probe enrolled once", occurrences(vet, "tools/probe-war-career.mjs") === 1, occurrences(vet, "tools/probe-war-career.mjs"));
  check("plan probe unenrolled", !vet.includes("['war career plan'") && !vet.includes('tools/probe-war-career-loop-plan.mjs'), null);
  check("one canonical owner", !/\bC\.(?:career|warCareer)\b/.test(runtime + "\n" + journey), null);
  check("save version untouched", !/\b_SAVE_VER\s*=/.test(runtime), null);
  check("save envelope functions not rebound", !/(?:^|[;\n])\s*(?:saveLocal|serializeSave|loadLocal|applySave)\s*=(?!=)/m.test(runtime), null);
  check("save guard still has two declarations", (readFileSync(join(ROOT, "src", "105-save-guard.js"), "utf8").match(/^function\s+(?:loadLocal|applySave)\s*\(/gm) || []).length === 2, null);
  check("AAR v1 composition guarded", aar.includes('typeof warCareerReportHTML === "function"') && aar.includes("careerVersion === 1"), null);
  check("Ironman direct and UI slot guards", slots.includes("_slIronmanNamedSaveBlocked") && slots.includes("slIronmanLaw") && slots.includes('aria-disabled="true"'), null);
  check("frozen base hash", md5(join(ROOT, "build", "base.html")) === "c9db83fa99230ffb95bdfdfe059f3fb9", md5(join(ROOT, "build", "base.html")));

  return { ok: checks.every(row => row.ok), checks };
}

const SETUP = `(() => {
  var R = { ok:true, steps:[], matrix:{ classifier:[], nonterminalParity:[], routes:[] }, storage:{} };
  function step(name, fn) {
    try {
      var value = fn();
      R.steps.push({ name:name, ok:true, value:value === undefined ? null : value });
    } catch (error) {
      R.ok = false;
      R.steps.push({ name:name, ok:false, error:String(error && error.message || error) });
    }
  }
  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function bytes(value) { return JSON.stringify(value); }
  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function(key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function firstDiff(a, b, path) {
    path = path || '$';
    if (a === b) return '';
    if (typeof a !== typeof b || a == null || b == null || typeof a !== 'object') return path + ': ' + bytes(a) + ' != ' + bytes(b);
    var keys = Object.keys(a).concat(Object.keys(b)).filter(function(key, index, all) { return all.indexOf(key) === index; }).sort();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!own(a, key) || !own(b, key)) return path + '.' + key + ': key presence differs';
      var diff = firstDiff(a[key], b[key], path + '.' + key);
      if (diff) return diff;
    }
    return path + ': object bytes differ';
  }
  function cleanStore() {
    try {
      localStorage.removeItem('gor_save');
      localStorage.removeItem('gor_undo_last');
      for (var i = 0; i < 3; i++) localStorage.removeItem('gor_slot_' + i);
      localStorage.setItem('gor_welcomed', '1');
    } catch (error) {}
  }
  function storeSnapshot() {
    var rows = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (/^gor_(?:save|undo_last|slot_)/.test(key || '')) rows.push([key, localStorage.getItem(key)]);
    }
    rows.sort(function(a, b) { return a[0].localeCompare(b[0]); });
    return rows;
  }
  function mkC(side, iron) {
    cleanStore();
    var C = {
      side:side || 'US', iron:iron === true, idx:0, funds:6500, recovery:false,
      completed:[], roster:[{ id:'R1', type:'inf', weapon:'rifled', xp:1, name:'Probe Infantry' }],
      nextId:2, stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0,
      recoveryMode:false, flipAtk:false, captured:[]
    };
    G.settings = G.settings || {};
    G.settings.diff = 1;
    G.settings.gfx = 'classic';
    G.campaign = C;
    G.battle = null;
    if (typeof _t1InitAll === 'function') _t1InitAll(C);
    if (typeof warCareerInit === 'function') warCareerInit(C);
    return C;
  }
  function battleRow(C) {
    var id = CHAINS[C.side][Math.max(0, Math.min(CHAINS[C.side].length - 1, C.idx || 0))];
    for (var i = 0; i < BATTLES.length; i++) if (BATTLES[i].id === id) return clone(BATTLES[i]);
    return { id:id, name:id, year:1861, atk:C.side };
  }
  function mkB(C, fromCampaign) {
    var side = C.side === 'CS' ? 'CS' : 'US';
    var enemy = side === 'CS' ? 'US' : 'CS';
    var bd = battleRow(C);
    var casualties = { US:0, CS:0 }, infl = { US:0, CS:0 };
    casualties[side] = 120; casualties[enemy] = 220;
    infl[side] = 220; infl[enemy] = 120;
    return {
      id:bd.id, name:bd.name || bd.id, bd:bd, fromCampaign:fromCampaign !== false,
      playerSide:side, enemySide:enemy, over:true, casualties:casualties, infl:infl,
      units:[
        { id:'U1', side:side, alive:true, type:'inf', vetId:'R1', weapon:'rifled', xp:1, kills:1, name:'Probe Infantry' },
        { id:'E1', side:enemy, alive:true, type:'inf', weapon:'rifled', xp:0, kills:0, name:'Probe Enemy' }
      ]
    };
  }
  function envelope(C, label) {
    return { ver:_SAVE_VER, when:1700000000000, settings:{ diff:1, gfx:'classic' }, campaign:clone(C), slotName:label || '' };
  }
  function registryPerson(C, rank) {
    var people = ssPersonRegistry(C).people;
    for (var i = 0; i < people.length; i++) {
      var p = people[i];
      if (p.side === C.side && p.rank === rank && _wcTeamAnchor(p) && (!p.status || String(p.status).toLowerCase() === 'alive')) return p;
    }
    return null;
  }
  function anyEligible(C) {
    return registryPerson(C, 'Private') || registryPerson(C, 'Sergeant') || registryPerson(C, 'Captain');
  }
  function anyHighRank(C) {
    var people = ssPersonRegistry(C).people;
    for (var i = 0; i < people.length; i++) {
      var p = people[i];
      if (p.side === C.side && !_wcAllowedStartRank(p.rank)) return p;
    }
    return null;
  }
  function startV1(C, rank) {
    var p = registryPerson(C, rank || 'Private') || anyEligible(C);
    if (!p) throw new Error('no eligible actual Army Register person');
    var result = warCareerStart(C, p.pid);
    if (!result || !result.ok) throw new Error('War Career start failed: ' + bytes(result));
    return { person:p, result:result };
  }
  function spyGlobals(names) {
    var saved = {}, calls = {};
    names.forEach(function(name) {
      saved[name] = window[name]; calls[name] = 0;
      window[name] = function() { calls[name]++; return null; };
    });
    return {
      calls:calls,
      restore:function() { names.forEach(function(name) { window[name] = saved[name]; }); }
    };
  }

  try {
    step('API + DISPATCHER INSTALL', function() {
      var names = [
        'warCareerInit', 'warCareerCanStart', 'warCareerStart', 'warCareerObserveResolve',
        'warCareerRole', 'warCareerCapabilities', 'warCareerCommandProjection',
        'warCareerIsTerminalLoss', 'warCareerTerminalPersist', 'warCareerReportHTML',
        'warCareerInstallDispatcher'
      ];
      names.forEach(function(name) { if (typeof window[name] !== 'function') throw new Error('missing ' + name); });
      if (_SAVE_VER !== 1) throw new Error('_SAVE_VER moved from 1');
      if (!campaignAdvance._warCareerWrapped) throw new Error('outer dispatcher is not installed');
      if (!campaignAdvance._warCareerDelegate || !campaignAdvance._warCareerDelegate._slUndoWrapped) throw new Error('captured delegate is not the live save-slot wrapper');
      if (!campaignAdvance._slUndoWrapped) throw new Error('outer wrapper did not propagate undo marker');
      var first = campaignAdvance;
      var second = warCareerInstallDispatcher();
      if (second !== first || campaignAdvance !== first) throw new Error('dispatcher install is not idempotent');
      return { wrapped:true, capturedUndo:true, saveVersion:_SAVE_VER };
    });

    step('RUN ID + SANITIZER IDEMPOTENCE', function() {
      var C = mkC('US', false);
      if (!warCareerRunIdValid(C.runId)) throw new Error('new campaign lacks stable runId');
      var runId = C.runId;
      warCareerInit(C);
      var once = bytes(C);
      warCareerInit(C);
      if (bytes(C) !== once) throw new Error('second init changed campaign bytes');
      var saved = envelope(C, 'roundtrip');
      applySave(clone(saved));
      warCareerInit(G.campaign);
      if (G.campaign.runId !== runId) throw new Error('save/apply changed runId');

      C = mkC('US', false);
      var high = anyHighRank(C);
      if (!high || !ssStartJourney(C, high.pid).ok) throw new Error('legacy high-rank setup failed');
      warCareerInit(C);
      if (own(C.loot.journey, 'careerVersion')) throw new Error('legacy Journey was silently converted');

      C = mkC('US', false);
      var p = anyEligible(C);
      var events = [], credits = [];
      for (var i = 0; i < 110; i++) {
        events.push({ eventId:'evt-' + i, ordinal:i + 1, kind:'result', outcome:'victory', status:i % 6 === 0 ? 'fallen' : 'alive', qualifying:true, merit:99 });
        var chainIndex = i % CHAINS.US.length, scenarioId = CHAINS.US[chainIndex];
        credits.push({ creditKey:[C.runId, 'US', chainIndex, scenarioId].join('|'), runId:C.runId, side:'US', chainIndex:chainIndex, scenarioId:scenarioId, outcome:'victory', type:'win', outcomeRank:99, qualifying:true, merit:99 });
      }
      events.push({ eventId:'evt-109', ordinal:999, kind:'result', outcome:'defeat', status:'captured' });
      credits.push({ creditKey:[C.runId, 'US', 0, CHAINS.US[0]].join('|'), runId:C.runId, side:'US', chainIndex:0, scenarioId:CHAINS.US[0], outcome:'victory', type:'decisive' });
      credits.push({ creditKey:'forged-safe-key', runId:C.runId, side:'US', chainIndex:0, scenarioId:CHAINS.US[0], outcome:'victory', type:'decisive' });
      C.loot.journey = {
        enabled:true, personId:p.pid, person:clone(p), status:'fallen', careerVersion:1,
        merit:999, reputation:999, eventOrdinal:1, events:events, creditLedger:credits,
        roleHistory:[{ forged:true }], relationships:{ forged:true }, lineage:[{ forged:true }],
        terminal:{ forged:true }, currentBillet:{ forged:true }, promotionCount:7
      };
      warCareerInit(C);
      var J = C.loot.journey;
      if (J.status !== 'fallen') throw new Error('legal fallen state was erased');
      var legal = ['alive','wounded','captured','fallen','retired','war-ended'];
      for (var si = 0; si < legal.length; si++) if (_ssStatus(legal[si]) !== legal[si]) throw new Error('legal state not preserved: ' + legal[si]);
      if (_ssStatus('invented') !== 'alive') throw new Error('unknown status did not fail closed');
      if (J.events.length !== 96) throw new Error('event ring should retain 96, got ' + J.events.length);
      var eventIds = {}; J.events.forEach(function(row) { if (eventIds[row.eventId]) throw new Error('duplicate event id survived'); eventIds[row.eventId] = 1; });
      if (J.creditLedger.length !== CHAINS.US.length) throw new Error('credit ledger not capped to finite US chain: ' + J.creditLedger.length);
      var creditKeys = {}; J.creditLedger.forEach(function(row) { if (creditKeys[row.creditKey]) throw new Error('duplicate credit survived'); creditKeys[row.creditKey] = 1; if (row.qualifying || row.merit || row.reputation) throw new Error('smuggled credit award survived'); });
      if (creditKeys['forged-safe-key']) throw new Error('noncanonical safe credit survived');
      if (J.merit !== 0 || J.reputation !== 0 || J.roleHistory.length || Object.keys(J.relationships).length || J.lineage.length || J.terminal !== null || J.currentBillet !== null) throw new Error('later-slice authority survived sanitation');
      var sanitized = bytes(C);
      warCareerInit(C);
      if (bytes(C) !== sanitized) throw new Error('malformed v1 did not converge idempotently');

      var aliased = mkC('US', false), valid = anyEligible(aliased), impostor = clone(valid);
      impostor.pid = valid.pid + ':impostor';
      aliased.loot.journey = { enabled:true, personId:valid.pid, person:impostor, status:'alive', careerVersion:1, events:[], creditLedger:[] };
      warCareerInit(aliased);
      if (aliased.loot.journey.enabled || aliased.loot.journey.person || aliased.loot.journey.personId) throw new Error('mismatched v1 person alias remained active');
      var restarted = warCareerStart(aliased, valid.pid);
      if (!restarted.ok || aliased.loot.journey.personId !== valid.pid || aliased.loot.journey.person.pid !== valid.pid) throw new Error('fail-closed alias could not restart from a valid identity');

      var missing = mkC('US', false), missingPerson = anyEligible(missing);
      missing.loot.journey = { enabled:true, personId:missingPerson.pid, person:null, status:'alive', careerVersion:1, events:[], creditLedger:[] };
      warCareerInit(missing);
      if (!missing.loot.journey.enabled || !missing.loot.journey.person || missing.loot.journey.person.pid !== missingPerson.pid) throw new Error('resolvable missing v1 snapshot did not materialize safely');

      var replacementCampaign = mkC('US', false), replacementPeople = ssPersonRegistry(replacementCampaign).people, replacement = null;
      for (var rp = 0; rp < replacementPeople.length; rp++) if (replacementPeople[rp].replaces) { replacement = replacementPeople[rp]; break; }
      if (!replacement) throw new Error('no explicit replacement alias available');
      replacementCampaign.loot.journey = { enabled:true, personId:replacement.replaces, person:clone(replacement), status:'alive', careerVersion:1, events:[], creditLedger:[] };
      warCareerInit(replacementCampaign);
      if (!replacementCampaign.loot.journey.enabled || replacementCampaign.loot.journey.personId !== replacement.pid || replacementCampaign.loot.journey.person.pid !== replacement.pid) throw new Error('explicit replacement alias did not normalize');

      var promoted = mkC('US', false), promotedPerson = anyEligible(promoted), promotedSnapshot = clone(promotedPerson);
      promotedSnapshot.rank = 'Major';
      promoted.loot.journey = { enabled:true, personId:promotedPerson.pid, person:promotedSnapshot, status:'alive', careerVersion:1, events:[], creditLedger:[] };
      warCareerInit(promoted);
      if (!promoted.loot.journey.enabled || promoted.loot.journey.person.rank !== 'Major') throw new Error('matching alternate-timeline rank snapshot was overwritten');

      var blocked = mkC('US', false); startV1(blocked, 'Private');
      blocked.loot.journey.creditLedger = [];
      for (var fc = 0; fc < CHAINS.US.length; fc++) blocked.loot.journey.creditLedger.push({ creditKey:'forged-' + fc, runId:'foreign-run', side:'CS', chainIndex:0, scenarioId:CHAINS.US[0], outcome:'victory', type:'decisive' });
      warCareerInit(blocked);
      if (blocked.loot.journey.creditLedger.length !== 0) throw new Error('foreign full ledger survived canonical tuple validation');
      var blockedBattle = mkB(blocked, true), observed = warCareerObserveResolve('CS', 'win', blockedBattle, blocked, false);
      if (!observed.ok || blocked.loot.journey.creditLedger.length !== 1 || blocked.loot.journey.creditLedger[0].creditKey !== observed.creditKey) throw new Error('rejected forged ledger still blocked genuine observation');

      var saturated = mkC('US', false); startV1(saturated, 'Private');
      saturated.loot.journey.events = [];
      for (var se = 0; se < 96; se++) saturated.loot.journey.events.push({ eventId:se === 80 ? saturated.runId + ':event:97' : 'saturated-' + se, ordinal:999905 + se, kind:'result', outcome:'defeat', status:'alive' });
      saturated.loot.journey.eventOrdinal = 1000000;
      warCareerInit(saturated);
      if (saturated.loot.journey.eventOrdinal !== 96) throw new Error('saturated event ordinals did not rebase');
      var saturationBattle = mkB(saturated, true);
      var firstObserved = warCareerObserveResolve('CS', 'win', saturationBattle, saturated, false);
      var secondObserved = warCareerObserveResolve('US', 'win', saturationBattle, saturated, true);
      if (!firstObserved.ok || !secondObserved.ok || firstObserved.eventId === secondObserved.eventId) throw new Error('saturated allocator reused an event id');
      var retainedIds = {}; saturated.loot.journey.events.forEach(function(row) { retainedIds[row.eventId] = 1; });
      if (!retainedIds[firstObserved.eventId] || !retainedIds[secondObserved.eventId]) throw new Error('post-saturation observations did not both persist');
      var saturatedBytes = bytes(saturated); warCareerInit(saturated);
      if (bytes(saturated) !== saturatedBytes) throw new Error('post-saturation sanitizer was not idempotent');
      return { runId:runId, states:legal.length, events:J.events.length, credits:J.creditLedger.length, aliasRejected:true, missingRecovered:true, replacementNormalized:true, promotedPreserved:true, forgedLedgerRejected:true, saturationUnique:true };
    });

    step('EXPLICIT START + LEGACY COMPATIBILITY', function() {
      var ranks = ['Private','Sergeant','Captain'], found = {};
      for (var i = 0; i < ranks.length; i++) {
        var C = mkC('US', false), p = registryPerson(C, ranks[i]);
        if (!p) throw new Error('missing actual ' + ranks[i] + ' register row');
        found[ranks[i]] = p.pid;
        warCareerInit(C);
        var before = bytes(C), can = warCareerCanStart(C, p.pid);
        if (!can.ok || bytes(C) !== before) throw new Error(ranks[i] + ' eligibility is not pure/allowed: ' + bytes(can));
        var survival = C.loot.survival.enabled;
        var started = warCareerStart(C, p.pid);
        if (!started.ok || C.loot.journey.careerVersion !== 1 || C.loot.journey.personId !== p.pid) throw new Error(ranks[i] + ' explicit start failed');
        if (C.loot.survival.enabled !== survival) throw new Error('v1 start silently forced survival');
        if (C.loot.journey.events.length !== 1 || C.loot.journey.events[0].qualifying || C.loot.journey.events[0].merit) throw new Error('start event awarded progression');
      }

      var Cx = mkC('US', false), good = anyEligible(Cx);
      var wrong = clone(good); wrong.side = 'CS';
      var noTeam = clone(good); noTeam.team = {};
      var major = clone(good); major.rank = 'Major';
      if (warCareerCanStartPerson(Cx, null, Cx.loot.journey).reason !== 'unknown-person') throw new Error('unknown person did not reject');
      if (warCareerCanStartPerson(Cx, wrong, Cx.loot.journey).reason !== 'wrong-side') throw new Error('cross-side person did not reject');
      if (warCareerCanStartPerson(Cx, noTeam, Cx.loot.journey).reason !== 'unstable-team') throw new Error('missing-team person did not reject');
      if (warCareerCanStartPerson(Cx, major, Cx.loot.journey).reason !== 'rank-out-of-range') throw new Error('high-rank person did not reject');
      var raw = { side:'US' }, rawBefore = bytes(raw);
      warCareerCanStart(raw, 'missing');
      if (bytes(raw) !== rawBefore) throw new Error('eligibility initialized or mutated raw campaign state');

      var legacy = mkC('US', false), high = anyHighRank(legacy);
      var old = ssStartJourney(legacy, high && high.pid);
      if (!old.ok || old.journey.careerVersion === 1 || legacy.loot.survival.enabled !== true) throw new Error('D360 high-rank legacy path changed');

      var ui = mkC('US', false), eligible = anyEligible(ui), highUi = anyHighRank(ui);
      var html = ssPersonDetailHTML(ui, eligible.pid);
      var host = document.createElement('div'); host.innerHTML = html;
      var button = host.querySelector('[data-wc-start]');
      if (!button || button.disabled || !/War Career/i.test(button.textContent) || !button.getAttribute('aria-label')) throw new Error('eligible accessible War Career action missing');
      html = ssPersonDetailHTML(ui, highUi.pid); host.innerHTML = html; button = host.querySelector('[data-wc-start]');
      if (!button || !button.disabled || button.getAttribute('aria-disabled') !== 'true' || !button.getAttribute('title')) throw new Error('ineligible action lacks disabled reason');
      return { actual:found, legacy:high.name, accessible:true };
    });

    step('ROLE/CAPABILITY PURITY', function() {
      var C = mkC('US', false), started = startV1(C, 'Private');
      warCareerInit(C);
      var before = bytes(C), role = warCareerRole(C), caps = warCareerCapabilities(C), projection = warCareerCommandProjection(C);
      if (role.id !== 'rank-and-file') throw new Error('Private role wrong: ' + bytes(role));
      if (caps.fieldCommand || caps.nationalDecisions || caps.cabinetMutation || caps.appointmentMutation || caps.resourceMutation || projection !== 0) throw new Error('Slice A leaked authority: ' + bytes({ caps:caps, projection:projection }));
      if (bytes(C) !== before) throw new Error('role/capability readers mutated campaign');

      C.loot.journey.person.rank = 'Sergeant'; warCareerInit(C);
      if (warCareerRole(C).id !== 'junior-command') throw new Error('Sergeant should summarize as junior command');
      C.loot.journey.person.rank = 'Captain'; warCareerInit(C);
      if (warCareerRole(C).id !== 'junior-command') throw new Error('Captain should summarize as junior command');
      C.loot.journey.person.rank = 'Major'; C.loot.journey.creditLedger = [{ creditKey:C.runId + '|US|0|x', runId:C.runId, side:'US', chainIndex:0, scenarioId:'x', outcome:'victory', type:'win', qualifying:false, merit:0 }]; warCareerInit(C);
      if (warCareerCapabilities(C).fieldCommand || warCareerCommandProjection(C) !== 0) throw new Error('forged rank/nonqualifying credit unlocked command');
      ['captured','fallen','retired','war-ended'].forEach(function(status) {
        C.loot.journey.status = status; warCareerInit(C);
        var r = warCareerRole(C), c = warCareerCapabilities(C);
        if (r.id !== 'unavailable' || c.fieldCommand || c.nationalDecisions) throw new Error(status + ' retained authority');
      });
      return { privateRole:role.id, projection:projection, inactiveStates:4, person:started.person.pid };
    });

    step('NONQUALIFYING EVENT/CREDIT LEDGER', function() {
      var C = mkC('US', false), started = startV1(C, 'Private'), B = mkB(C, true);
      var J = C.loot.journey, rankBefore = J.person.rank, promotionBefore = J.promotionCount;
      var results = [];
      results.push(warCareerObserveResolve('CS', 'win', B, C, false));
      results.push(warCareerObserveResolve('CS', 'win', B, C, false));
      results.push(warCareerObserveResolve(null, 'draw', B, C, null));
      results.push(warCareerObserveResolve('US', 'win', B, C, true));
      results.push(warCareerObserveResolve('US', 'decisive', B, C, true));
      results.push(warCareerObserveResolve('CS', 'win', B, C, false));
      J = C.loot.journey;
      if (J.creditLedger.length !== 1) throw new Error('recovery retries stacked credit: ' + J.creditLedger.length);
      if (J.creditLedger[0].outcomeRank !== 3 || J.creditLedger[0].outcome !== 'victory' || J.creditLedger[0].type !== 'decisive') throw new Error('credit did not improve upward/retain best result: ' + bytes(J.creditLedger[0]));
      results.forEach(function(result) { if (!result.ok || result.qualifying !== false || result.merit !== 0 || result.reputation !== 0) throw new Error('observer returned an award: ' + bytes(result)); });
      J.events.forEach(function(event) { if (event.qualifying || event.merit || event.reputation) throw new Error('event awarded progression'); });
      J.creditLedger.forEach(function(credit) { if (credit.qualifying || credit.merit || credit.reputation) throw new Error('credit awarded progression'); });
      if (J.merit || J.reputation || J.person.rank !== rankBefore || J.promotionCount !== promotionBefore) throw new Error('result observation changed advancement');
      for (var i = 0; i < 110; i++) warCareerObserveResolve(i % 3 === 0 ? null : (i % 2 ? 'US' : 'CS'), i % 5 === 0 ? 'decisive' : (i % 3 === 0 ? 'draw' : 'win'), B, C, i % 3 === 0 ? null : i % 2 === 1);
      J = C.loot.journey;
      if (J.events.length !== 96) throw new Error('event ring size ' + J.events.length);
      var ids = {}; J.events.forEach(function(event) { if (ids[event.eventId]) throw new Error('event id duplicated'); ids[event.eventId] = 1; });
      var campaignBytes = bytes(C), save = envelope(C, 'ledger');
      applySave(clone(save)); warCareerInit(G.campaign);
      if (bytes(G.campaign) !== campaignBytes) throw new Error('save/apply/init changed ledger bytes');
      return { observations:116, retainedEvents:J.events.length, credits:J.creditLedger.length, bestRank:J.creditLedger[0].outcomeRank, person:started.person.pid };
    });

    step('PURE TERMINAL CLASSIFIER MATRIX', function() {
      var cases = [
        ['US enemy win', { side:'US', iron:true }, { fromCampaign:true, playerSide:'US' }, 'CS', true],
        ['US enemy decisive type irrelevant', { side:'US', iron:true }, { fromCampaign:true, playerSide:'US' }, 'CS', true],
        ['battle player side overrides campaign side loss', { side:'US', iron:true }, { fromCampaign:true, playerSide:'CS' }, 'US', true],
        ['battle player side overrides campaign side win', { side:'US', iron:true }, { fromCampaign:true, playerSide:'CS' }, 'CS', false],
        ['mirrored battle-side override loss', { side:'CS', iron:true }, { fromCampaign:true, playerSide:'US' }, 'CS', true],
        ['mirrored battle-side override win', { side:'CS', iron:true }, { fromCampaign:true, playerSide:'US' }, 'US', false],
        ['fallback to campaign side', { side:'CS', iron:true }, { fromCampaign:true }, 'US', true],
        ['empty battle side falls back', { side:'US', iron:true }, { fromCampaign:true, playerSide:'' }, 'CS', true],
        ['truthy flags follow exact predicate', { side:'US', iron:1 }, { fromCampaign:1, playerSide:'US' }, 'CS', true],
        ['undefined winner follows exact non-null predicate', { side:'US', iron:true }, { fromCampaign:true, playerSide:'US' }, undefined, true],
        ['player win despite objloss type', { side:'US', iron:true }, { fromCampaign:true, playerSide:'US' }, 'US', false],
        ['draw', { side:'US', iron:true }, { fromCampaign:true, playerSide:'US' }, null, false],
        ['standard loss', { side:'US', iron:false }, { fromCampaign:true, playerSide:'US' }, 'CS', false],
        ['free battle', { side:'US', iron:true }, { fromCampaign:false, playerSide:'US' }, 'CS', false],
        ['missing battle', { side:'US', iron:true }, null, 'CS', false],
        ['missing campaign', null, { fromCampaign:true, playerSide:'US' }, 'CS', false]
      ];
      cases.forEach(function(row) {
        var C = row[1], B = row[2], before = bytes([C, B]);
        deepFreeze(C); deepFreeze(B);
        var actual = warCareerIsTerminalLoss(C, B, row[3]);
        if (actual !== row[4]) throw new Error(row[0] + ' expected ' + row[4] + ' got ' + actual);
        if (bytes([C, B]) !== before) throw new Error(row[0] + ' classifier mutated input');
        R.matrix.classifier.push({ case:row[0], terminal:actual });
      });
      return { cases:cases.length };
    });

    step('NONTERMINAL DELEGATE BYTE PARITY', function() {
      var outer = campaignAdvance;
      var delegate = campaignAdvance._warCareerDelegate || campaignAdvance;
      function run(fn, baseC, baseB, winner, type, checkOrder) {
        cleanStore();
        G.settings = { diff:1, gfx:'classic' };
        G.campaign = clone(baseC); G.battle = clone(baseB); G.mode = 'result';
        var oldNow = Date.now, oldRandom = Math.random, oldUpgrade = window.openUpgrade, oldLaunch = window.launchCampaignBattle, oldWon = window.warWonScreen;
        var oldUndo = window._slCaptureUndo, oldObserve = window.warCareerObserveResolve, beforeUndo = bytes(G.campaign);
        var trace = [];
        Date.now = function() { return 1700000000123; };
        Math.random = function() { return 0.3141592653589793; };
        window.openUpgrade = function() { trace.push('upgrade'); };
        window.launchCampaignBattle = function() { trace.push('launch'); };
        window.warWonScreen = function() { trace.push('won'); };
        if (checkOrder) {
          window._slCaptureUndo = function() {
            if (bytes(G.campaign) !== beforeUndo) throw new Error('career/campaign write occurred before undo capture');
            trace.push('undo');
            return oldUndo.apply(this, arguments);
          };
          window.warCareerObserveResolve = function() {
            trace.push('career');
            return oldObserve.apply(this, arguments);
          };
        }
        var returned;
        try { returned = fn(winner, type); }
        finally { Date.now = oldNow; Math.random = oldRandom; window.openUpgrade = oldUpgrade; window.launchCampaignBattle = oldLaunch; window.warWonScreen = oldWon; window._slCaptureUndo = oldUndo; window.warCareerObserveResolve = oldObserve; }
        if (checkOrder && (trace.indexOf('undo') < 0 || trace.indexOf('career') <= trace.indexOf('undo'))) throw new Error('active-v1 order is not undo-before-career: ' + trace.join(','));
        return { campaign:clone(G.campaign), battle:clone(G.battle), settings:clone(G.settings), mode:G.mode, storage:storeSnapshot(), trace:trace, returned:returned == null ? null : clone(returned) };
      }
      var configs = [
        { name:'standard win', iron:false, from:true, winner:'US', type:'win' },
        { name:'standard loss/recovery', iron:false, from:true, winner:'CS', type:'win' },
        { name:'draw', iron:true, from:true, winner:null, type:'draw' },
        { name:'Ironman win', iron:true, from:true, winner:'US', type:'decisive' },
        { name:'Ironman free-battle loss', iron:true, from:false, winner:'CS', type:'win' },
        { name:'no-battle legacy call', iron:false, noBattle:true, winner:'US', type:'win' },
        { name:'active-v1 win', iron:false, from:true, winner:'US', type:'win', career:true }
      ];
      configs.forEach(function(cfg) {
        var C = mkC('US', cfg.iron), B = cfg.noBattle ? null : mkB(C, cfg.from);
        if (cfg.career) startV1(C, 'Private');
        var baseC = clone(C), baseB = clone(B);
        var a = run(outer, baseC, baseB, cfg.winner, cfg.type, cfg.career);
        var b = run(delegate, baseC, baseB, cfg.winner, cfg.type, cfg.career);
        var equal = bytes(a) === bytes(b);
        R.matrix.nonterminalParity.push({ case:cfg.name, equal:equal });
        if (!equal) throw new Error(cfg.name + ' outer/delegate mismatch at ' + firstDiff(a, b));
      });
      return { cases:configs.length, byteParity:true };
    });

    step('TERMINAL STORAGE + CONTINUE + SINGLE RENDER', function() {
      cleanStore();
      var C = mkC('US', true), B = mkB(C, true), runId = C.runId;
      G.battle = B;
      var auto = JSON.stringify(envelope(C, 'auto'));
      var undo = JSON.stringify({ ver:1, when:1700000000001, save:envelope(C, 'undo') });
      var matching = JSON.stringify(envelope(C, 'matching'));
      var otherC = clone(C); otherC.runId = 'run-us-unrelated';
      var unrelated = JSON.stringify(envelope(otherC, 'unrelated'));
      var malformed = '{"ver":1,"campaign":';
      localStorage.setItem('gor_save', auto);
      localStorage.setItem('gor_undo_last', undo);
      localStorage.setItem('gor_slot_0', matching);
      localStorage.setItem('gor_slot_1', unrelated);
      localStorage.setItem('gor_slot_2', malformed);
      var campaignBefore = bytes(C), battleBefore = bytes(B), settingsBefore = bytes(G.settings);
      var spies = spyGlobals(['_t1Resolve','lootOnResolve','saveLocal','openUpgrade','launchCampaignBattle','warWonScreen','_slCaptureUndo','_pdLog']);
      var snapshot;
      try { snapshot = campaignAdvance('CS', 'win'); }
      finally { spies.restore(); }
      Object.keys(spies.calls).forEach(function(name) { if (spies.calls[name] !== 0) throw new Error('terminal called ' + name + ' ' + spies.calls[name] + ' time(s)'); });
      if (bytes(C) !== campaignBefore) throw new Error('terminal path mutated campaign input at ' + firstDiff(JSON.parse(campaignBefore), C));
      if (bytes(B) !== battleBefore) throw new Error('terminal path mutated battle input at ' + firstDiff(JSON.parse(battleBefore), B));
      if (bytes(G.settings) !== settingsBefore) throw new Error('terminal path mutated settings');
      if (G.campaign !== null) throw new Error('terminal campaign remains live');
      if (localStorage.getItem('gor_save') !== null || localStorage.getItem('gor_undo_last') !== null) throw new Error('autosave/undo survived terminal');
      if (localStorage.getItem('gor_slot_0') !== null) throw new Error('matching run slot survived');
      if (localStorage.getItem('gor_slot_1') !== unrelated || localStorage.getItem('gor_slot_2') !== malformed) throw new Error('unrelated/malformed slot bytes changed');
      if (loadLocal() !== null) throw new Error('direct load still finds a resumable campaign');
      if (!snapshot || !Object.isFrozen(snapshot) || !Object.isFrozen(snapshot.storage) || snapshot.runId !== runId) throw new Error('terminal snapshot not immutable/identified');
      if (document.querySelectorAll('[data-war-career-terminal="1"]').length !== 1) throw new Error('terminal screen did not render exactly once');
      var terminalText = document.getElementById('wcTerminalScreen').textContent;
      if (!/no recovery/i.test(terminalText) || /Continue Campaign/i.test(terminalText)) throw new Error('terminal copy is dishonest');
      var terminalButton = document.getElementById('wcTerminalMainMenu');
      if (!terminalButton || terminalButton.tagName !== 'BUTTON' || terminalButton.disabled) throw new Error('terminal dismissal is not a native focusable button');
      if (warCareerRenderTerminal(snapshot) !== false || document.querySelectorAll('[data-war-career-terminal="1"]').length !== 1) throw new Error('terminal screen double-rendered');
      terminalButton.click();
      if (document.getElementById('gnContinue') || document.getElementById('gnWarDept')) throw new Error('main menu exposes Continue/President Desk after terminal');

      cleanStore();
      C = mkC('US', true); B = mkB(C, true); delete C.runId; G.battle = B; _wcTerminalRenderKey = '';
      var raws = ['slot-zero-ambiguous','slot-one-ambiguous','slot-two-ambiguous'];
      for (var si = 0; si < raws.length; si++) localStorage.setItem('gor_slot_' + si, raws[si]);
      localStorage.setItem('gor_save', JSON.stringify(envelope(C, 'ambiguous-auto')));
      localStorage.setItem('gor_undo_last', JSON.stringify({ ver:1, save:envelope(C, 'ambiguous-undo') }));
      deepFreeze(C); deepFreeze(B);
      campaignAdvance('CS', 'decisive');
      if (own(C, 'runId')) throw new Error('pure-first terminal minted an ambiguous runId');
      for (var sj = 0; sj < raws.length; sj++) if (localStorage.getItem('gor_slot_' + sj) !== raws[sj]) throw new Error('missing-runId terminal deleted ambiguous slot ' + sj);
      if (localStorage.getItem('gor_save') !== null || localStorage.getItem('gor_undo_last') !== null || G.campaign !== null) throw new Error('missing-runId terminal did not clear live resume state');
      R.storage = { matchingRemoved:true, unrelatedPreserved:true, malformedPreserved:true, missingRunIdSlotsPreserved:true, continueAbsent:true };
      return { calls:spies.calls, snapshot:snapshot.storage, missingRunIdSlots:raws.length };
    });

    step('IRONMAN NAMED-SLOT LAW', function() {
      cleanStore();
      var C = mkC('US', true), sv = envelope(C, 'Ironman Copy');
      if (_slWrite(0, sv) !== false || localStorage.getItem('gor_slot_0') !== null) throw new Error('direct Ironman named write succeeded');
      [1, 'true'].forEach(function(flag) {
        cleanStore();
        var truthy = mkC('US', false); truthy.iron = flag;
        if (_slWrite(0, envelope(truthy, 'Truthy Ironman')) !== false || localStorage.getItem('gor_slot_0') !== null) throw new Error('truthy imported Ironman named write succeeded: ' + flag);
      });
      localStorage.setItem('gor_slot_0', JSON.stringify(envelope((function(){ var x=clone(C); x.iron=false; return x; })(), 'Existing')));
      if (_slWrite(0, sv, { existingMetadata:true }) !== false) throw new Error('Ironman direct-write bypass option survived');
      localStorage.removeItem('gor_slot_0');
      _slOpenManager();
      var save = document.getElementById('slSave0');
      if (!save || !save.disabled || save.getAttribute('aria-disabled') !== 'true' || !document.getElementById('slIronmanLaw')) throw new Error('Ironman UI save law not exposed accessibly');
      var sentinel = JSON.stringify(envelope((function(){ var x=clone(C); x.iron=false; return x; })(), 'Sentinel'));
      localStorage.setItem('gor_slot_0', sentinel);
      save.click();
      if (localStorage.getItem('gor_slot_0') !== sentinel) throw new Error('disabled Ironman Save clobbered an existing slot');
      if (!_slSetSlotName(0, 'Renamed Sentinel') || (_slRead(0) || {}).slotName !== 'Renamed Sentinel') throw new Error('allowed rename path was blocked');
      [false, 0].forEach(function(flag, index) {
        C = mkC('US', false); C.iron = flag; sv = envelope(C, 'Standard Copy');
        if (!_slWrite(index + 1, sv) || !_slRead(index + 1)) throw new Error('falsy standard named save stopped working: ' + flag);
      });
      return { directBlocked:true, truthyImportedBlocked:2, uiBlocked:true, renameAllowed:true, falsyStandardAllowed:2 };
    });

    step('AUTO + CLASSIC + REALTIME ROUTE MATRIX', function() {
      function routeResult(name, terminal, detail) { R.matrix.routes.push({ route:name, terminal:terminal, detail:detail }); }
      function setBattleTotals(B) {
        if (!B.casualties) B.casualties = { US:0, CS:0 };
        if (!B.infl) B.infl = { US:0, CS:0 };
        B.casualties.US = 100; B.casualties.CS = 200; B.infl.US = 200; B.infl.CS = 100;
      }

      var C = mkC('US', true), bd = battleRow(C); _wcTerminalRenderKey = '';
      startBattleRuntime(bd, 'US', true); setBattleTotals(G.battle); campaignAdvance('CS', 'win');
      if (G.campaign !== null) throw new Error('Classic Ironman loss did not terminate');
      routeResult('Classic loss', true, 'closed');

      C = mkC('US', true); bd = battleRow(C); var idx = C.idx;
      startBattleRuntime(bd, 'US', true); setBattleTotals(G.battle); campaignAdvance('US', 'win');
      if (!G.campaign || C.idx !== idx + 1 || C.stats.battles !== 1) throw new Error('Classic nonterminal win changed');
      routeResult('Classic win', false, C.idx);

      C = mkC('US', true); bd = battleRow(C); _wcTerminalRenderKey = '';
      fldCampaignApplyOutcome({ bd:bd, winnerSide:'CS', type:'win', pFrac:0.34, eFrac:0.16, win:false, playerSide:'US' });
      if (G.campaign !== null) throw new Error('realtime Ironman loss did not terminate');
      routeResult('Realtime loss', true, 'closed');

      C = mkC('US', true); bd = battleRow(C);
      fldCampaignApplyOutcome({ bd:bd, winnerSide:null, type:'draw', pFrac:0.18, eFrac:0.18, win:false, playerSide:'US' });
      if (!G.campaign || C.stats.battles !== 1 || C.recovery !== true) throw new Error('realtime Ironman draw did not delegate to existing recovery behavior');
      routeResult('Realtime draw', false, 'delegated');

      C = mkC('US', true); bd = battleRow(C); _wcTerminalRenderKey = '';
      _arShowResult(C, { bd:bd, winnerSide:'CS', type:'win', pFrac:0.32, eFrac:0.12, win:false, playerSide:'US', sim:{} });
      var go = document.getElementById('arGo'); if (!go) throw new Error('Auto result Continue missing'); go.click();
      if (G.campaign !== null) throw new Error('Auto Ironman loss did not terminate');
      routeResult('Auto loss', true, 'closed');

      C = mkC('US', true); bd = battleRow(C); idx = C.idx;
      _arShowResult(C, { bd:bd, winnerSide:'US', type:'win', pFrac:0.12, eFrac:0.32, win:true, playerSide:'US', sim:{} });
      go = document.getElementById('arGo'); if (!go) throw new Error('Auto win Continue missing'); go.click();
      if (!G.campaign || C.idx !== idx + 1 || C.stats.battles !== 1) throw new Error('Auto nonterminal win changed');
      routeResult('Auto win', false, C.idx);
      return { routes:R.matrix.routes.length };
    });

    step('AAR GUARDED COMPOSITION + A11Y', function() {
      var empty = mkC('US', false), emptyHtml = aarRenderReport(empty, { compact:true });
      if (/data-war-career-report|The Soldier(?:&apos;|')s Story/.test(emptyHtml)) throw new Error('empty campaign fabricated a career panel');

      var legacy = mkC('US', false), high = anyHighRank(legacy);
      if (!ssStartJourney(legacy, high.pid).ok) throw new Error('legacy AAR setup failed');
      var legacyHtml = aarRenderReport(legacy, { compact:true });
      if (legacyHtml.indexOf('The Soldier&apos;s Story') < 0 || legacyHtml.indexOf('data-war-career-report') >= 0) throw new Error('legacy AAR composition changed');

      var C = mkC('US', false); startV1(C, 'Private');
      C.loot.journey.person.name = '<img src=x onerror=window.__wcInjected=1>' + new Array(180).join('X');
      warCareerInit(C);
      var beforeObj = clone(C), careerOne = warCareerReportHTML(C, { compact:true }), careerTwo = warCareerReportHTML(C, { compact:true });
      if (bytes(C) !== bytes(beforeObj) || careerOne !== careerTwo) throw new Error('career report mutated at ' + firstDiff(beforeObj, C));
      var report = aarRenderReport(C, { compact:true }), afterFirst = clone(C), report2 = aarRenderReport(C, { compact:true });
      if (bytes(C) !== bytes(afterFirst) || report !== report2) throw new Error('composed AAR mutated at ' + firstDiff(afterFirst, C));
      if ((report.match(/data-war-career-report="1"/g) || []).length !== 1) throw new Error('v1 AAR must contain exactly one War Career section');
      if (report.indexOf('The Soldier&apos;s Story') >= 0) throw new Error('v1 AAR duplicated legacy Journey panel');
      if (report.indexOf('<img src=x') >= 0 || report.indexOf('&lt;img') < 0) throw new Error('hostile identity text was not escaped');
      if (report.indexOf('nonqualifying') < 0 || report.indexOf('merit 0') < 0 || report.indexOf('reputation 0') < 0 || report.indexOf('no promotion') < 0) throw new Error('AAR does not distinguish observation from advancement');
      openSheet('<div id="wcProbeAar" style="max-width:100%;overflow-wrap:anywhere">' + warCareerReportHTML(C, { compact:true }) + '</div>');
      var host = document.getElementById('wcProbeAar');
      if (!host || host.querySelectorAll('h3').length !== 1 || host.querySelectorAll('ul > li').length < 3 || host.querySelector('img')) throw new Error('AAR semantic/escaping structure missing');
      if (!/War Career|Your Timeline/.test(host.textContent) || !/nonqualifying/i.test(host.textContent)) throw new Error('AAR text does not carry state without color');
      window.__wcAarCampaign = C;
      return { legacy:true, v1:true, headings:host.querySelectorAll('h3').length, listItems:host.querySelectorAll('ul > li').length };
    });
  } catch (fatal) {
    R.ok = false;
    R.fatal = String(fatal && fatal.message || fatal);
  }
  return JSON.stringify(R);
})()`;

async function main() {
  const staticResult = staticPreflight();
  const url = cfg.baseUrl + "/" + cfg.file;
  let server = null;
  let browser = null;
  let page = null;
  let result = {
    schema: "cw_probe_war_career_v1",
    generatedAt: new Date().toISOString(),
    ok: false,
    suite: { expected: 130, actual: 0, index: 38 },
    static: staticResult,
    steps: [],
    pageerrors: [],
    realErrors: [],
    console: [],
    screenshots: []
  };

  try {
    if (!(await up(url))) {
      server = spawn("python3", ["-m", "http.server", String(cfg.port)], { cwd: ROOT, stdio: "ignore" });
      for (let i = 0; i < 80; i++) {
        if (await up(url)) break;
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
    page = await browser.newPage({ viewport: cfg.viewport });
    const pageerrors = [];
    const consoleLines = [];
    page.on("pageerror", error => pageerrors.push(String(error && error.message || error)));
    page.on("console", message => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleLines.push("[" + message.type() + "] " + message.text());
      }
    });
    await page.addInitScript(() => {
      try { localStorage.setItem("gor_welcomed", "1"); } catch {}
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(500);
    const runtime = JSON.parse(await page.evaluate(SETUP));
    const staticStep = {
      name: "STATIC REGISTRATION + WALLS",
      ok: staticResult.ok,
      value: { checks: staticResult.checks.length, passing: staticResult.checks.filter(row => row.ok).length },
      error: staticResult.ok ? undefined : staticResult.checks.filter(row => !row.ok).map(row => row.name + ": " + JSON.stringify(row.detail)).join("; ")
    };
    runtime.steps.unshift(staticStep);

    await page.setViewportSize({ width: 390, height: 700 });
    const zoom = await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
      const root = document.getElementById("wcProbeAar") || document.getElementById("sheetPad");
      return root ? { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, clientHeight: root.clientHeight, scrollHeight: root.scrollHeight } : null;
    });
    await sleep(150);
    await page.screenshot({ path: SHOT, fullPage: false, timeout: 120000 });
    const shotBytes = statSync(SHOT).size;
    const aarStep = runtime.steps.find(row => row.name === "AAR GUARDED COMPOSITION + A11Y");
    if (!zoom || zoom.scrollWidth > zoom.clientWidth + 2 || shotBytes < 5000) {
      runtime.ok = false;
      if (aarStep) {
        aarStep.ok = false;
        aarStep.error = "200% zoom/screenshot failed: " + JSON.stringify({ zoom, shotBytes });
      }
    } else if (aarStep) {
      aarStep.value = Object.assign({}, aarStep.value || {}, { zoom, screenshotBytes: shotBytes });
    }

    const realErrors = consoleLines.filter(line => line.startsWith("[error]") && !/Failed to load resource:.*404/i.test(line));
    const list = execFileSync(process.execPath, [join(ROOT, "tools", "vet-no-regression.mjs"), "--list"], { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
    result = Object.assign(result, runtime, {
      schema: "cw_probe_war_career_v1",
      generatedAt: new Date().toISOString(),
      suite: { expected: 130, actual: list.length, index: 38 },
      static: staticResult,
      pageerrors,
      realErrors,
      console: consoleLines.slice(-30),
      screenshots: [{ path: SHOT, bytes: shotBytes, viewport: { width:390, height:700 }, zoom:200 }]
    });
    const failed = result.steps.filter(row => !row.ok);
    result.ok = !!runtime.ok && staticResult.ok && !failed.length && !pageerrors.length && !realErrors.length && list.length === 130;
  } catch (error) {
    result.ok = false;
    result.fatal = String(error && error.stack || error);
  } finally {
    writeFileSync(OUTFILE, JSON.stringify(result, null, 2) + "\n");
    if (page) try { await Promise.race([page.close(), sleep(2000)]); } catch {}
    if (browser) try { await Promise.race([browser.close(), sleep(3500)]); } catch {}
    if (server) server.kill();
  }

  const passing = result.steps.filter(row => row.ok).length;
  const failing = result.steps.length - passing;
  console.log("probe-war-career: " + passing + "/" + result.steps.length + " steps ok" + (failing ? ", " + failing + " FAIL" : ", 0 fail") + " pageerrors=" + result.pageerrors.length + " realErrors=" + result.realErrors.length);
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.error);
  for (const error of result.pageerrors) console.error("  PAGE ERROR:", error);
  for (const error of result.realErrors) console.error("  CONSOLE:", error);
  if (result.fatal) console.error("  FATAL:", result.fatal);
  if (!result.ok) process.exit(1);
  console.log("ALL OK");
}

main().catch(error => {
  console.error("FATAL:", error);
  process.exit(1);
});
