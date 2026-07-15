#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D401 Slice B focused gate: D400 canonical/terminal invariants plus explicit
// scenario-unit participation, pure personal fate, and deterministic hand-off.

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
  const campaignLink = readFileSync(join(ROOT, "src", "tactical", "T2-campaign-link.js"), "utf8");
  const officers = readFileSync(join(ROOT, "src", "tactical", "T3-officers.js"), "utf8");
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
  check("live field evidence producer", campaignLink.includes("warCareerLinkField(C, ctx, __FIELD)") && campaignLink.includes("warCareerBuildFieldEvidence(C, ctx, wcMode, __FIELD)") && campaignLink.includes("B.warCareerEvidence = o.warCareerEvidence"), null);
  check("live exact officer link", officers.includes("warCareerLinkRealtimeOfficerRoster") && officers.includes("ld.careerPersonId") && officers.includes("ld._everActive"), null);
  check("explicit assignment is not a namespace alias", runtime.includes("cw_war_career_assignment_v1") && runtime.includes("explicit-career-assignment") && !runtime.includes("campaign-representative"), null);
  check("procedural army commander is never the career Captain", runtime.includes('link.ref.slot !== "cmd" || !ctx || !ctx.scn'), null);
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
  function currentPerson(C, rank, slot) {
    var bid = CHAINS[C.side][C.idx], people = ssPersonRegistry(C).people;
    for (var i = 0; i < people.length; i++) {
      var p = people[i], ref = p && p.unitRef;
      if (p.side === C.side && ref && ref.battleId === bid && ref.side === C.side &&
          (!rank || p.rank === rank) && (!slot || ref.slot === slot) && _wcTeamAnchor(p)) return p;
    }
    return null;
  }
  function otherBattlePerson(C, rank) {
    var bid = CHAINS[C.side][C.idx], people = ssPersonRegistry(C).people;
    for (var i = 0; i < people.length; i++) {
      var p = people[i], ref = p && p.unitRef;
      if (p.side === C.side && p.rank === (rank || 'Private') && ref && ref.battleId !== bid && _wcTeamAnchor(p)) return p;
    }
    return null;
  }
  function startCurrent(C, rank, slot) {
    var p = currentPerson(C, rank, slot);
    if (!p) {
      var original = C.idx;
      for (var i = 0; i < CHAINS[C.side].length && !p; i++) { C.idx = i; p = currentPerson(C, rank, slot); }
      if (!p) C.idx = original;
    }
    if (!p) throw new Error('no current-battle ' + (rank || slot || 'eligible') + ' person');
    var result = warCareerStart(C, p.pid);
    if (!result || !result.ok) throw new Error('current War Career start failed: ' + bytes(result));
    return { person:p, result:result };
  }
  function exactLeaderEvidence(C, B, fate, changes) {
    var J = C.loot.journey, ref = J.person.unitRef, link = _wcActiveLink(C, ref.battleId);
    var route = link && _wcRouteUnit(B.units, C.side, ref.unitId);
    if (route && route.ambiguous) route = null;
    if (link && !route) route = _wcAssignRouteUnit(link, B.units);
    if (!link || !route) throw new Error('could not build exact participant control');
    var row = {
      personId:J.personId, leaderId:'probe-leader', battleId:ref.battleId, side:ref.side,
      unitId:ref.unitId, slotPid:ref.slotPid, runId:C.runId, creditKey:link.creditKey,
      participated:true, active:true, arrived:true, fate:fate
    };
    changes = changes || {};
    Object.keys(changes).forEach(function(key) { row[key] = changes[key]; });
    B.over = true;
    B.warCareerEvidence = _wcResultEvidence(link, 'realtime', route, B.bd && B.bd.year, [row]);
    return row;
  }
  function participantEvidence(C, B, mode) {
    var J = C.loot.journey, ref = J.person.unitRef, link = _wcActiveLink(C, ref.battleId);
    var route = link && _wcRouteUnit(B.units, C.side, ref.unitId);
    if (route && route.ambiguous) route = null;
    if (link && !route) route = _wcAssignRouteUnit(link, B.units);
    if (!link || !route) throw new Error('could not build participant evidence');
    B.over = true;
    B.warCareerEvidence = _wcResultEvidence(link, mode || 'classic', route, B.bd && B.bd.year, []);
    if (mode !== 'classic') B.warCareerEvidence.fieldComplete = true;
    return B.warCareerEvidence;
  }
  function resolveResult(C, B, winnerSide, type) {
    G.campaign = C; G.battle = B;
    var oldObserve = window.warCareerObserveResolve, observed = null, returned;
    window.warCareerObserveResolve = function() { observed = oldObserve.apply(this, arguments); return observed; };
    try { returned = stubResultUi(function() { return campaignAdvance(winnerSide, type); }); }
    finally { window.warCareerObserveResolve = oldObserve; }
    return observed || returned;
  }
  function fieldOutcome(C, mode, fate, authoredScenario) {
    var bd = battleRow(C), fightBd = clone(bd);
    var ctx = { bd:fightBd, scn:authoredScenario || null, fromCampaign:true, _conditioned:false, simResolve:mode === 'auto' };
    var opts = { renderer:'none', autoBoth:true, campaign:ctx, neutralPreset:true, seed:7331 };
    if (authoredScenario) opts.scenario = authoredScenario;
    else opts.skirmish = _fldCampaignSkirmishParams(fightBd, C);
    fldLaunchSandbox(opts);
    var linked = [];
    for (var i = 0; i < (__FIELD.leaders || []).length; i++) if (__FIELD.leaders[i].careerPersonId === C.loot.journey.personId) linked.push(__FIELD.leaders[i]);
    if (fate && linked.length === 1) {
      linked[0].alive = fate !== 'fallen'; linked[0].wounded = fate === 'wounded'; linked[0]._everActive = true;
    }
    __FIELD.phase = 'over'; __FIELD.winner = C.side; __FIELD.winBy = 'hold';
    var out = fldCampaignComputeOutcome();
    fldExit(true);
    return { outcome:out, linked:linked.length };
  }
  function latestCredit(C) {
    var rows = C && C.loot && C.loot.journey && C.loot.journey.creditLedger || [];
    return rows.length ? rows[rows.length - 1] : null;
  }
  function stubResultUi(fn) {
    var oldUpgrade = window.openUpgrade, oldLaunch = window.launchCampaignBattle, oldWon = window.warWonScreen;
    window.openUpgrade = function() {};
    window.launchCampaignBattle = function() {};
    window.warWonScreen = function() {};
    try { return fn(); }
    finally { window.openUpgrade = oldUpgrade; window.launchCampaignBattle = oldLaunch; window.warWonScreen = oldWon; }
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
        'warCareerParticipationEvidence', 'warCareerPreflightFate', 'warCareerDeterministicFate',
        'warCareerBuildClassicEvidence', 'warCareerLinkField', 'warCareerLinkRealtimeOfficerRoster', 'warCareerBuildFieldEvidence',
        'warCareerComradeCandidates', 'warCareerAcceptHandoff', 'warCareerHandoffHTML',
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

    step('NO-CAREER T3 CONSEQUENCE BYTE PARITY', function() {
      var spec = { id:'probe_plain_officer', side:'US', name:'Plain Officer', short:'Plain', quality:0.55, radius:210, x:100, z:100 };
      var roster = [clone(spec)], rosterBefore = bytes(roster);
      var linked = warCareerLinkRealtimeOfficerRoster(null, null, roster);
      if (bytes(linked) !== rosterBefore || bytes(roster) !== rosterBefore) throw new Error('no-career roster gained consequence metadata');
      var specBefore = bytes(spec), leader = fldMakeOfficer(spec);
      if (bytes(spec) !== specBefore || !leader || own(leader, '_everActive') || own(leader, 'careerPersonId')) throw new Error('no-career leader shape changed');
      fldOfficerActivate(leader);
      if (own(leader, '_everActive') || own(leader, 'careerPersonId')) throw new Error('no-career activation gained career state');
      return { rosterBytes:true, leaderMetadataAbsent:true, activationMetadataAbsent:true };
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
      if (own(old.journey.person, 'unitRef') || own(old.journey.person, 'serviceYear') || own(old.journey.person, 'serviceStart') || own(old.journey.person, 'serviceEnd') || own(old.journey.person, 'replaces')) throw new Error('D401 evidence fields leaked into a D360 snapshot');
      var legacyBytes = bytes(legacy.loot.journey); warCareerInit(legacy);
      if (bytes(legacy.loot.journey) !== legacyBytes || own(legacy.loot.journey, 'careerVersion')) throw new Error('warCareerInit changed legacy Journey bytes');

      var ui = mkC('US', false), eligible = anyEligible(ui), highUi = anyHighRank(ui);
      var html = ssPersonDetailHTML(ui, eligible.pid);
      var host = document.createElement('div'); host.innerHTML = html;
      var button = host.querySelector('[data-wc-start]');
      if (!button || button.disabled || !/War Career/i.test(button.textContent) || !button.getAttribute('aria-label')) throw new Error('eligible accessible War Career action missing');
      html = ssPersonDetailHTML(ui, highUi.pid); host.innerHTML = html; button = host.querySelector('[data-wc-start]');
      if (!button || !button.disabled || button.getAttribute('aria-disabled') !== 'true' || !button.getAttribute('title')) throw new Error('ineligible action lacks disabled reason');
      return { actual:found, legacy:high.name, legacyByteParity:true, accessible:true };
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
        { name:'no-battle legacy call', iron:false, noBattle:true, winner:'US', type:'win' }
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

    step('EXPLICIT PARTICIPATION FAIL-CLOSED MATRIX', function() {
      var C = mkC('US', false), started = startCurrent(C, 'Private', 'pvt'), B = mkB(C, true);
      participantEvidence(C, B, 'classic');
      var good = warCareerParticipationEvidence(C, B);
      if (!good.ok || !good.qualifying || good.participation.personId !== started.person.pid || good.participation.slotPid !== started.person.unitRef.slotPid) throw new Error('exact current scenario-unit did not qualify');
      var stale = clone(B); stale.warCareerEvidence.runId = 'run-stale';
      if (warCareerParticipationEvidence(C, stale).qualifying) throw new Error('stale receipt qualified');
      var wrongYear = clone(B); wrongYear.warCareerEvidence.battleYear += 1;
      if (warCareerParticipationEvidence(C, wrongYear).qualifying) throw new Error('wrong battle year qualified');
      var missingYear = clone(B); delete missingYear.warCareerEvidence.battleYear;
      if (warCareerParticipationEvidence(C, missingYear).qualifying) throw new Error('missing battle year qualified');
      var wrong = clone(B); wrong.playerSide = 'CS'; wrong.warCareerEvidence.side = 'CS';
      if (warCareerParticipationEvidence(C, wrong).qualifying) throw new Error('wrong side qualified');
      var absent = clone(B); delete absent.warCareerEvidence;
      if (warCareerParticipationEvidence(C, absent).qualifying) throw new Error('missing result receipt qualified');
      var inactive = clone(B); inactive.warCareerEvidence.participants[0].active = false;
      if (warCareerParticipationEvidence(C, inactive).qualifying) throw new Error('inactive result participant qualified');
      var duplicateReceipt = clone(B); duplicateReceipt.warCareerEvidence.participants.push(clone(duplicateReceipt.warCareerEvidence.participants[0]));
      if (warCareerParticipationEvidence(C, duplicateReceipt).qualifying) throw new Error('duplicate result participant qualified');
      var assignmentMissing = clone(B), assignedRow = assignmentMissing.warCareerEvidence.participants[0];
      if (assignedRow.mapping === 'explicit-career-assignment') {
        for (var ami = 0; ami < assignmentMissing.units.length; ami++) if (assignmentMissing.units[ami].id === assignedRow.routeUnitId) delete assignmentMissing.units[ami].warCareerAssignment;
        if (warCareerParticipationEvidence(C, assignmentMissing).qualifying) throw new Error('missing explicit field assignment qualified');
      }
      var savedRef = C.loot.journey.person.unitRef; delete C.loot.journey.person.unitRef;
      if (warCareerParticipationEvidence(C, B).qualifying) throw new Error('missing unit reference qualified');
      C.loot.journey.person.unitRef = savedRef;
      var oldRegistry = window.ssPersonRegistry, baseReg = oldRegistry(C), duplicate = clone(started.person);
      window.ssPersonRegistry = function() { var copy = { people:baseReg.people.slice() }; copy.people.push(duplicate); return copy; };
      try { if (warCareerParticipationEvidence(C, B).qualifying) throw new Error('duplicate person/unit alias qualified'); }
      finally { window.ssPersonRegistry = oldRegistry; }
      var duplicateExact = mkB(C, true), exactUnit = { id:savedRef.unitId, side:C.side, type:'inf', alive:true };
      duplicateExact.units.push(clone(exactUnit), clone(exactUnit));
      if (warCareerBuildClassicEvidence(C, duplicateExact) !== null) throw new Error('duplicate exact source-unit ids fell through to an assignment');
      var authoredCtx = { bd:clone(B.bd), scn:'authored-probe', fromCampaign:true }, authoredInitial = { phase:'active', units:[{ id:'other-live-unit', side:C.side, type:'inf', alive:true }], leaders:[] };
      var authoredLink = warCareerLinkField(C, authoredCtx, authoredInitial);
      if (!authoredLink || authoredLink.mapping !== 'exact-source-unit' || authoredLink.routeUnitId !== savedRef.unitId) throw new Error('authored reinforcement did not retain its exact source id');
      var authoredAbsent = { phase:'over', units:clone(authoredInitial.units), leaders:[] };
      if (warCareerBuildFieldEvidence(C, authoredCtx, 'auto', authoredAbsent) !== null) throw new Error('unarrived authored source unit produced evidence');
      var authoredArrived = { phase:'over', units:clone(authoredInitial.units).concat([clone(exactUnit)]), leaders:[] };
      var authoredEvidence = warCareerBuildFieldEvidence(C, authoredCtx, 'auto', authoredArrived);
      if (!authoredEvidence || authoredEvidence.participants[0].routeUnitId !== savedRef.unitId) throw new Error('arrived authored source unit did not produce exact evidence');
      authoredArrived.units.push(clone(exactUnit));
      if (warCareerBuildFieldEvidence(C, authoredCtx, 'auto', authoredArrived) !== null) throw new Error('duplicate authored source units qualified');
      var C2 = mkC('US', false), other = otherBattlePerson(C2, 'Private');
      if (!other || !warCareerStart(C2, other.pid).ok) throw new Error('other-battle control could not start');
      if (warCareerParticipationEvidence(C2, mkB(C2, true)).qualifying) throw new Error('nonparticipating scenario unit qualified');
      function observedReject(mutator, label) {
        var cx = mkC('US', false); startCurrent(cx, 'Private', 'pvt'); var bx = mkB(cx, true); participantEvidence(cx, bx, 'classic');
        mutator(cx, bx); var beforeStatus = cx.loot.journey.status; resolveResult(cx, bx, 'CS', 'win');
        var jx = cx.loot.journey, last = latestCredit(cx), ev = jx.events[jx.events.length - 1];
        if (jx.status !== beforeStatus || jx.merit || jx.reputation || (last && last.qualifying) || !ev || ev.qualifying || ev.fate != null || ev.note.indexOf('infers no personal fate') < 0) throw new Error(label + ' did not remain a nonqualifying narrative');
      }
      observedReject(function(cx, bx) { delete bx.warCareerEvidence; }, 'missing');
      observedReject(function(cx, bx) { bx.warCareerEvidence.runId = 'run-stale'; }, 'stale');
      observedReject(function(cx, bx) { bx.playerSide = 'CS'; }, 'wrong-side');
      observedReject(function(cx, bx) { bx.warCareerEvidence.participants.push(clone(bx.warCareerEvidence.participants[0])); }, 'duplicate');
      observedReject(function(cx, bx) { bx.warCareerEvidence.participants[0].participated = false; }, 'nonparticipating');
      return { receipt:good.participation, staleRejected:true, wrongYearRejected:true, missingYearRejected:true, wrongSideRejected:true, missingRejected:true, inactiveRejected:true, duplicateRejected:true, assignmentRequired:true, exactRouteAmbiguityRejected:true, authoredArrivalRequired:true, ambiguousRejected:true, nonparticipantRejected:true, narrativeRoutes:5 };
    });

    step('AGGREGATE CASUALTIES NEVER NAME FATE', function() {
      var C = mkC('US', false); startCurrent(C, 'Private', 'pvt');
      var low = mkB(C, true), high = mkB(C, true); participantEvidence(C, low, 'classic'); participantEvidence(C, high, 'classic');
      low.casualties.US = 1; low.casualties.CS = 2; high.casualties.US = 999999; high.casualties.CS = 777777;
      var lowFate = warCareerPreflightFate(C, low, 'CS', 'decisive'), highFate = warCareerPreflightFate(C, high, 'CS', 'decisive');
      if (!lowFate.qualifying || bytes(lowFate) !== bytes(highFate)) throw new Error('aggregate totals changed deterministic named fate');
      var C2 = mkC('US', false), p = otherBattlePerson(C2, 'Private');
      if (!p || !warCareerStart(C2, p.pid).ok) throw new Error('aggregate control start failed');
      var B = mkB(C2, true); B.casualties.US = 999999; B.infl.CS = 999999;
      var beforeStatus = C2.loot.journey.status, preflight = warCareerPreflightFate(C2, B, 'CS', 'decisive');
      if (preflight.qualifying || preflight.fate != null) throw new Error('aggregate casualty total asserted named fate without participation');
      resolveResult(C2, B, 'CS', 'decisive'); var credit = latestCredit(C2), event = C2.loot.journey.events[C2.loot.journey.events.length - 1];
      if (C2.loot.journey.status !== beforeStatus || !credit || credit.qualifying || credit.fate != null || !event || event.fate != null) throw new Error('aggregate-only observation did not stay fail-closed');
      return { low:low.casualties.US, high:high.casualties.US, identicalFate:lowFate.fate, missingReceiptRejected:true, status:C2.loot.journey.status };
    });

    step('AUTO + CLASSIC + REALTIME PARTICIPATION MATRIX', function() {
      function totals(B) { B.casualties.US = 80; B.casualties.CS = 160; B.infl.US = 160; B.infl.CS = 80; }
      var C = mkC('US', false), bd = battleRow(C); startCurrent(C, 'Private', 'pvt');
      bd = battleRow(C);
      startBattleRuntime(bd, 'US', true); totals(G.battle); G.battle.over = true;
      stubResultUi(function() { campaignAdvance('US', 'win'); });
      if (!latestCredit(C) || !latestCredit(C).qualifying) throw new Error('Classic exact unit did not qualify: ' + bytes({ idx:C.idx, battle:G.battle && G.battle.bd && G.battle.bd.id, journey:C.loot && C.loot.journey, credit:latestCredit(C) }));
      var classicReceipt = latestCredit(C).participation;

      C = mkC('US', false); startCurrent(C, 'Private', 'pvt');
      var realtime = fieldOutcome(C, 'realtime');
      if (!realtime.outcome || !realtime.outcome.warCareerEvidence || realtime.outcome.warCareerEvidence.mode !== 'realtime') throw new Error('live realtime producer omitted result evidence');
      stubResultUi(function() { fldCampaignApplyOutcome(realtime.outcome); });
      if (!latestCredit(C) || !latestCredit(C).qualifying) throw new Error('realtime shared consequence path did not qualify');
      var realtimeReceipt = latestCredit(C).participation;

      C = mkC('US', false); startCurrent(C, 'Private', 'pvt');
      var auto = fieldOutcome(C, 'auto');
      if (!auto.outcome || !auto.outcome.warCareerEvidence || auto.outcome.warCareerEvidence.mode !== 'auto') throw new Error('live Auto producer omitted result evidence');
      stubResultUi(function() { fldCampaignApplyOutcome(auto.outcome); });
      if (!latestCredit(C) || !latestCredit(C).qualifying) throw new Error('Auto shared consequence path did not qualify');
      var autoReceipt = latestCredit(C).participation;
      return { classic:classicReceipt, realtime:realtimeReceipt, auto:autoReceipt, sharedEvidence:'explicit result-owned person/unit receipts' };
    });

    step('REALTIME OFFICER EXACT-ID FATE', function() {
      var C = mkC('US', false); startCurrent(C, 'Captain', 'cmd');
      var B = mkB(C, true), ref = C.loot.journey.person.unitRef;
      B.units[0].id = ref.unitId;
      var ctx = { bd:clone(B.bd), scn:'probe-exact-authored', fromCampaign:true, _conditioned:true };
      var field = { phase:'over', units:B.units, leaders:[] };
      if (!warCareerLinkField(C, ctx, field) || ctx.warCareerLink.mapping !== 'exact-source-unit') throw new Error('exact authored unit link unavailable');
      var roster = [{ pid:C.loot.journey.personId, id:'probe-exact-leader', side:C.side, name:'Exact probe officer',
        attach:ref.unitId, quality:0.55, radius:180, x:100, z:100 }];
      var linkedRoster = warCareerLinkRealtimeOfficerRoster(C, ctx, roster);
      if (linkedRoster === roster || linkedRoster[0].careerPersonId !== C.loot.journey.personId || roster[0].careerPersonId) throw new Error('exact source pid did not produce a cloned consequence link');
      var wrongPidRoster = clone(roster); wrongPidRoster[0].pid += ':other';
      if (warCareerLinkRealtimeOfficerRoster(C, ctx, wrongPidRoster) !== wrongPidRoster || wrongPidRoster[0].careerPersonId) throw new Error('same-unit wrong source pid was aliased');
      var duplicateRoster = clone(roster); duplicateRoster.push(clone(duplicateRoster[0])); duplicateRoster[1].id += ':duplicate';
      if (warCareerLinkRealtimeOfficerRoster(C, ctx, duplicateRoster) !== duplicateRoster || duplicateRoster[0].careerPersonId) throw new Error('duplicate exact leader source ids did not fail closed');
      var proceduralRoster = [{ id:'ld_' + C.side, side:C.side, name:'Procedural commander', quality:0.55, radius:250, x:100, z:100 }];
      if (warCareerLinkRealtimeOfficerRoster(C, { bd:clone(B.bd), scn:null }, proceduralRoster) !== proceduralRoster || proceduralRoster[0].careerPersonId) throw new Error('procedural commander was aliased to the selected Captain');
      var oldUnits = __FIELD.units, oldSeed = __FIELD.seed, runtimeLeader;
      try {
        __FIELD.units = field.units; __FIELD.seed = 7331;
        runtimeLeader = fldMakeOfficer(linkedRoster[0]);
      } finally { __FIELD.units = oldUnits; __FIELD.seed = oldSeed; }
      if (!runtimeLeader || runtimeLeader.careerPersonId !== C.loot.journey.personId || runtimeLeader._everActive !== true) throw new Error('T3 dropped exact source-owned person id');
      runtimeLeader.alive = true; runtimeLeader.wounded = true;
      field.leaders = [runtimeLeader];
      B.warCareerEvidence = warCareerBuildFieldEvidence(C, ctx, 'realtime', field);
      if (!B.warCareerEvidence || B.warCareerEvidence.leaders.length !== 1) throw new Error('T2 dropped exact realtime leader result evidence');
      var exact = warCareerPreflightFate(C, B, 'US', 'win');
      if (!exact.qualifying || exact.fate !== 'wounded' || exact.reason !== 'exact-realtime-leader') throw new Error('exact realtime leader fate rejected');
      var wrong = clone(B); wrong.warCareerEvidence.leaders[0].personId = C.loot.journey.personId + ':wrong';
      if (warCareerPreflightFate(C, wrong, 'US', 'win').qualifying) throw new Error('wrong leader person id qualified');
      var staleRun = clone(B); staleRun.warCareerEvidence.leaders[0].runId = 'run-stale';
      if (warCareerPreflightFate(C, staleRun, C.side, 'win').qualifying) throw new Error('stale leader run id qualified');
      var staleKey = clone(B); staleKey.warCareerEvidence.leaders[0].creditKey += ':stale';
      if (warCareerPreflightFate(C, staleKey, C.side, 'win').qualifying) throw new Error('stale leader credit key qualified');
      var staleResult = clone(B); staleResult.warCareerEvidence.leaders[0].resultId += 'x';
      if (warCareerPreflightFate(C, staleResult, C.side, 'win').qualifying) throw new Error('stale leader result id qualified');
      var duplicate = clone(B); duplicate.warCareerEvidence.leaders.push(clone(duplicate.warCareerEvidence.leaders[0]));
      if (warCareerPreflightFate(C, duplicate, 'US', 'win').qualifying) throw new Error('duplicate leader person id qualified');
      var unarrived = clone(B); unarrived.warCareerEvidence.leaders[0].arrived = false;
      if (warCareerPreflightFate(C, unarrived, 'US', 'win').qualifying) throw new Error('unarrived leader qualified');
      var inactive = clone(B); inactive.warCareerEvidence.leaders[0].active = false;
      if (warCareerPreflightFate(C, inactive, 'US', 'win').qualifying) throw new Error('inactive leader qualified');
      var missing = clone(B); missing.warCareerEvidence.leaders = [];
      if (warCareerPreflightFate(C, missing, 'US', 'win').qualifying) throw new Error('missing realtime cmd leader fell back to deterministic fate');
      return { exactSourcePid:true, sameUnitWrongPidRejected:true, proceduralAliasRejected:true, t3T2Producer:true, exact:true, wrongIdRejected:true, staleRunRejected:true, staleKeyRejected:true, staleResultRejected:true, duplicateRejected:true, unarrivedRejected:true, inactiveRejected:true, missingRejected:true };
    });

    step('PURE PREFLIGHT FATE MATRIX', function() {
      var fates = ['alive','wounded','captured','fallen'], seen = {}, C = mkC('US', false); startCurrent(C, 'Captain', 'cmd');
      for (var i = 0; i < fates.length; i++) {
        var B = mkB(C, true); exactLeaderEvidence(C, B, fates[i]);
        var before = bytes([C, B]); deepFreeze(C); deepFreeze(B);
        var a = warCareerPreflightFate(C, B, 'US', 'win'), b = warCareerPreflightFate(C, B, 'US', 'win');
        if (!a.qualifying || a.fate !== fates[i] || bytes(a) !== bytes(b) || bytes([C, B]) !== before) throw new Error('pure fate failed for ' + fates[i]);
        seen[fates[i]] = true;
      }
      C = mkC('US', false); startCurrent(C, 'Captain', 'cmd');
      var malformed = mkB(C, true); exactLeaderEvidence(C, malformed, 'invented');
      if (warCareerPreflightFate(C, malformed, 'US', 'win').qualifying) throw new Error('unsupported fate qualified');
      return { states:Object.keys(seen), deterministic:true, noWrites:true, malformedRejected:true };
    });

    step('PREFLIGHT BEFORE DELEGATE + POST-UNDO COMMIT', function() {
      var C = mkC('US', false); startCurrent(C, 'Captain', 'cmd');
      var B = mkB(C, true); exactLeaderEvidence(C, B, 'wounded'); G.battle = B;
      var oldPreflight = window.warCareerPreflightFate, oldUndo = window._slCaptureUndo, oldObserve = window.warCareerObserveResolve;
      var trace = [], before = bytes([C, B, G.settings, storeSnapshot()]);
      window.warCareerPreflightFate = function() { trace.push('preflight'); return oldPreflight.apply(this, arguments); };
      window._slCaptureUndo = function() { if (bytes([C, B, G.settings, storeSnapshot()]) !== before || C.loot.journey.status !== 'alive') throw new Error('write before undo capture'); trace.push('undo'); return oldUndo.apply(this, arguments); };
      window.warCareerObserveResolve = function() { trace.push('observe'); return oldObserve.apply(this, arguments); };
      try { stubResultUi(function() { campaignAdvance('US', 'win'); }); }
      finally { window.warCareerPreflightFate = oldPreflight; window._slCaptureUndo = oldUndo; window.warCareerObserveResolve = oldObserve; }
      if (trace[0] !== 'preflight' || trace.indexOf('undo') < 0 || trace.indexOf('observe') <= trace.indexOf('undo') || C.loot.journey.status !== 'wounded') throw new Error('preflight/delegate/undo/commit order wrong: ' + trace.join(','));
      var C2 = mkC('US', false); startCurrent(C2, 'Captain', 'cmd'); var B2 = mkB(C2, true); exactLeaderEvidence(C2, B2, 'captured');
      resolveResult(C2, B2, 'CS', 'win');
      if (C2.loot.journey.status !== 'captured') throw new Error('captured fate did not commit post-undo');
      var captureKey = latestCredit(C2).creditKey, captureCredit = _wcCreditFor(C2.loot.journey, captureKey), sameRung = mkB(C2, true), same = resolveResult(C2, sameRung, 'US', 'win');
      captureCredit = _wcCreditFor(C2.loot.journey, captureKey);
      if (!same.duplicate || C2.loot.journey.status !== 'captured' || captureCredit.recoveredAtCreditKey) throw new Error('same-rung retry recovered capture or rerolled credit');
      var recoveryBattle = mkB(C2, true), directRecovery = warCareerObserveResolve('US', 'win', recoveryBattle, C2, true);
      captureCredit = _wcCreditFor(C2.loot.journey, captureKey);
      if (directRecovery.recoveredCapture || C2.loot.journey.status !== 'captured' || captureCredit.recoveredAtCreditKey) throw new Error('observer without carried dispatcher token recovered capture');
      var recovered = resolveResult(C2, recoveryBattle, 'CS', 'win');
      captureCredit = _wcCreditFor(C2.loot.journey, captureKey);
      if (!recovered.recoveredCapture || C2.loot.journey.status !== 'alive' || !captureCredit.recoveredAtCreditKey || !captureCredit.recoveryEventId || C2.loot.journey.merit || C2.loot.journey.reputation) throw new Error('distinct-result deterministic captured recovery failed');
      var recoveryCredit = _wcCreditFor(C2.loot.journey, captureCredit.recoveredAtCreditKey), recoveryCreditBeforeRetry = bytes(recoveryCredit);
      var betterRetryBattle = mkB(C2, true), betterRetry = resolveResult(C2, betterRetryBattle, 'US', 'decisive');
      recoveryCredit = _wcCreditFor(C2.loot.journey, captureCredit.recoveredAtCreditKey);
      if (!betterRetry.duplicate || bytes(recoveryCredit) !== recoveryCreditBeforeRetry || C2.loot.journey.status !== 'alive') throw new Error('better same-rung retry rewrote recovery owner or reabsorbed capture');
      var recoveredSave = envelope(C2, 'captured-recovery-after-better-retry'); applySave(clone(recoveredSave)); warCareerInit(G.campaign);
      if (G.campaign.loot.journey.status !== 'alive' || !_wcCreditFor(G.campaign.loot.journey, captureCredit.creditKey).recoveredAtCreditKey) throw new Error('captured recovery did not survive save/load');

      var C3 = mkC('US', false); startCurrent(C3, 'Captain', 'cmd'); var B3 = mkB(C3, true); exactLeaderEvidence(C3, B3, 'wounded'); G.battle = B3;
      var oldUndo3 = window._slCaptureUndo, replacement = currentPerson(C3, 'Private', 'pvt');
      if (!replacement || replacement.pid === C3.loot.journey.personId) throw new Error('TOCTOU replacement control unavailable');
      window._slCaptureUndo = function() {
        var undoResult = oldUndo3.apply(this, arguments), J3 = C3.loot.journey;
        J3.personId = replacement.pid; J3.person = _ssJourneySnapshot(replacement, true); J3.status = 'alive';
        return undoResult;
      };
      try { stubResultUi(function() { campaignAdvance('US', 'win'); }); } finally { window._slCaptureUndo = oldUndo3; }
      var tokenCredit = latestCredit(C3), tokenEvent = C3.loot.journey.events[C3.loot.journey.events.length - 1];
      if (C3.loot.journey.status !== 'alive' || !tokenCredit || tokenCredit.qualifying || tokenCredit.fate != null || !tokenEvent || tokenEvent.fate != null) throw new Error('preflight token crossed an identity/key change');
      return { trace:trace, committed:C.loot.journey.status, capturedCommitted:true, sameRungCaptureHeld:true, directObserverRecoveryRejected:true, capturedRecoveredOnLoss:true, betterSameRungRetryFrozen:true, recoverySaveLoad:true, tokenTupleBound:true };
    });

    step('CAREER-IRONMAN FALLEN SHARES TERMINAL PATH', function() {
      cleanStore(); _wcTerminalRenderKey = '';
      var C = mkC('US', true); startCurrent(C, 'Captain', 'cmd');
      var B = mkB(C, true); exactLeaderEvidence(C, B, 'fallen'); G.battle = B;
      localStorage.setItem('gor_save', JSON.stringify(envelope(C, 'live')));
      localStorage.setItem('gor_undo_last', JSON.stringify({ ver:1, save:envelope(C, 'undo') }));
      var spies = spyGlobals(['_slCaptureUndo','warCareerObserveResolve']);
      var snapshot;
      try { snapshot = campaignAdvance('US', 'win'); } finally { spies.restore(); }
      if (!snapshot || snapshot.reason !== 'career-ironman-fallen' || !snapshot.person || snapshot.person.status !== 'fallen') throw new Error('personal Ironman fallen did not use terminal snapshot');
      if (G.campaign !== null || snapshot.stats.battles !== 0 || spies.calls._slCaptureUndo || spies.calls.warCareerObserveResolve || localStorage.getItem('gor_save') != null || localStorage.getItem('gor_undo_last') != null) throw new Error('personal terminal delegated or left resumable state');
      if (!Object.isFrozen(snapshot) || document.querySelectorAll('[data-war-career-terminal="1"]').length !== 1) throw new Error('personal terminal was not immutable/single-rendered');
      return { reason:snapshot.reason, delegateWrites:0, renderCount:1 };
    });

    step('NORMAL FALLEN ENTERS HANDOFF', function() {
      var C = mkC('US', false); startCurrent(C, 'Captain', 'cmd');
      var B = mkB(C, true); exactLeaderEvidence(C, B, 'fallen'); G.battle = B;
      var oldRender = window.warCareerRenderTerminal, renders = 0;
      window.warCareerRenderTerminal = function() { renders++; return oldRender.apply(this, arguments); };
      try { stubResultUi(function() { campaignAdvance('US', 'win'); }); } finally { window.warCareerRenderTerminal = oldRender; }
      var J = C.loot.journey;
      if (G.campaign !== C || J.status !== 'fallen' || !J.handoff || J.handoff.state !== 'pending' || !J.handoff.candidateIds.length || renders || C.stats.battles !== 1) throw new Error('normal fallen did not enter live pending handoff');
      if (J.merit !== 0 || J.reputation !== 0) throw new Error('fallen created reward');
      return { campaignLive:true, state:J.handoff.state, candidates:J.handoff.candidateIds.length, terminalRenders:renders };
    });

    step('COMRADE ORDER + EXCLUSIONS', function() {
      var C = mkC('US', false), started = startCurrent(C, 'Captain', 'cmd'), J = C.loot.journey, baseRef = clone(J.person.unitRef);
      var B = mkB(C, true); participantEvidence(C, B, 'classic'); var part = warCareerParticipationEvidence(C, B).participation;
      var canonicalBase = clone(J.person);
      canonicalBase.team = { side:'US', army:'Probe Army', brigade:'Stable Brigade', regiment:'Stable Regiment', company:'Stable Company' };
      J.person.team = { side:'US', army:'Tampered Save', brigade:'Tampered Brigade', regiment:'Tampered Regiment', company:'Tampered Company' };
      function ref(slot, unit) { unit = unit || baseRef.unitId; return { battleId:baseRef.battleId, side:'US', unitId:unit, slot:slot, slotPid:['ss',baseRef.battleId,'US',unit,slot].join(':') }; }
      function person(pid, level, generated, rank) {
        var team = { side:'US', army:'Probe Army', brigade:'Stable Brigade', regiment:'Stable Regiment', company:'Stable Company' };
        if (level === 'regiment') team.company = 'Other Company';
        if (level === 'brigade') { team.company = 'Other Company'; team.regiment = 'Other Regiment'; }
        if (level === 'distant') { team.company = 'Elsewhere'; team.regiment = 'Elsewhere'; team.brigade = 'Other Brigade'; }
        var unit = 'unit-' + pid, slot = /Captain|Lieutenant/.test(rank || '') ? 'cmd' : (/Sergeant/.test(rank || '') ? 'nco' : 'pvt');
        return { pid:pid, name:pid, rank:rank || 'Private', side:'US', status:'alive', provenance:generated ? 'Inferred' : 'Verified', generated:!!generated, sources:generated ? [] : [{ title:'Probe source' }], unitRef:ref(slot, unit), team:team, serviceYear:part.battleYear };
      }
      var companyDoc = person('z-company-doc','company',false,'Private');
      var companyGen = person('a-company-gen','company',true,'Captain');
      var regimentNear = person('b-regiment-near','regiment',false,'Sergeant');
      var regimentFar = person('a-regiment-far','regiment',false,'Private');
      var brigadeB = person('b-brigade-tie','brigade',false,'Captain');
      var brigadeA = person('a-brigade-tie','brigade',false,'Captain');
      var people = [clone(canonicalBase), brigadeB, companyGen, regimentFar, companyDoc, brigadeA, regimentNear];
      var ordered = warCareerComradeCandidates(C, J, people, part).map(function(row) { return row.pid; });
      var expected = ['z-company-doc','a-company-gen','b-regiment-near','a-regiment-far','a-brigade-tie'];
      if (bytes(ordered) !== bytes(expected)) throw new Error('stable hierarchy/documented/rank/pid/bound order wrong: ' + bytes(ordered));
      J.lineage = [{ personId:'z-company-doc' }];
      var lineExcluded = warCareerComradeCandidates(C, J, people, part).map(function(row) { return row.pid; });
      J.lineage = [];
      if (lineExcluded.indexOf('z-company-doc') >= 0) throw new Error('lineage identity remained eligible');
      var wrongSide = person('wrong-side','company',false,'Sergeant'); wrongSide.side = 'CS'; wrongSide.unitRef.side = 'CS'; wrongSide.unitRef.slotPid = ['ss',baseRef.battleId,'CS',wrongSide.unitRef.unitId,'nco'].join(':');
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), wrongSide], part).length) throw new Error('wrong-side candidate survived');
      var dead = person('dead','company',false,'Sergeant'); dead.status = 'captured';
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), dead], part).length) throw new Error('nonalive candidate survived');
      var woundedCandidate = person('wounded','company',false,'Sergeant'); woundedCandidate.status = 'wounded';
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), woundedCandidate], part).length) throw new Error('wounded candidate survived alive-only law');
      var absentCandidate = person('absent','company',false,'Sergeant'); absentCandidate.present = false;
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), absentCandidate], part).length) throw new Error('absent candidate survived');
      var future = person('future','company',false,'Sergeant'); future.serviceStart = Number(part.battleYear) + 1; delete future.serviceYear;
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), future], part).length) throw new Error('out-of-window candidate survived');
      var expired = person('expired','company',false,'Sergeant'); expired.serviceEnd = Number(part.battleYear) - 1; delete expired.serviceYear;
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), expired], part).length) throw new Error('expired service candidate survived');
      var oneYear = person('wrong-year','company',false,'Sergeant'); oneYear.serviceYear = Number(part.battleYear) + 1;
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), oneYear], part).length) throw new Error('one-year service mismatch survived');
      var noProvenance = person('no-provenance','company',false,'Sergeant'); noProvenance.provenance = '';
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), noProvenance], part).length) throw new Error('unknown provenance survived');
      var noSources = person('no-sources','company',false,'Sergeant'); noSources.sources = [];
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), noSources], part).length) throw new Error('undocumented authored candidate survived');
      var dupA = person('duplicate','company',false,'Sergeant'), dupB = clone(dupA);
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), dupA, dupB], part).length) throw new Error('duplicate identity survived');
      var slotA = person('slot-a','company',false,'Sergeant'), slotB = clone(slotA); slotB.pid = 'slot-b'; slotB.name = 'slot-b';
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), slotA, slotB], part).length) throw new Error('distinct identities sharing one slot survived');
      var distant = person('distant','distant',false,'Sergeant');
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), distant], part).length) throw new Error('different-unit candidate survived');
      var sameBrigadeDifferentUnit = person('same-brigade-different-unit','brigade',false,'Sergeant');
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), sameBrigadeDifferentUnit], part).length !== 1) throw new Error('stable same-brigade fallback was excluded by unit id');
      var missingYearPart = clone(part); delete missingYearPart.battleYear;
      if (warCareerComradeCandidates(C, J, [clone(canonicalBase), companyDoc], missingYearPart).length) throw new Error('missing result year bypassed service-window law');
      if (ordered.length !== 5) throw new Error('candidate bound did not select exact first five');
      return { order:ordered, bounded:ordered.length, canonicalHierarchy:true, mutableSnapshotIgnored:true, orthogonalComparator:true, lineageExcluded:true, sideExcluded:true, nonaliveExcluded:true, absentExcluded:true, serviceStartEndYearExcluded:true, missingYearRejected:true, provenanceRequired:true, duplicatePidAndSlotExcluded:true, distantHierarchyExcluded:true, sameBrigadeFallback:true };
    });

    step('HANDOFF SAVE/LOAD + SINGLE IDENTITY + NO-CANDIDATE', function() {
      var C = mkC('US', false); startCurrent(C, 'Captain', 'cmd');
      C.loot.journey.person.ovr = 97; C.loot.journey.person.status = 'wounded'; C.loot.journey.merit = 77;
      var B = mkB(C, true); exactLeaderEvidence(C, B, 'fallen');
      var observed = resolveResult(C, B, 'CS', 'win'), J = C.loot.journey;
      if (!observed.ok || !J.handoff || J.handoff.state !== 'pending') throw new Error('pending handoff setup failed');
      var fixed = J.handoff.candidateIds.slice(), creditCount = J.creditLedger.length, eventCount = J.events.length, saved = envelope(C, 'handoff');
      var rankChoices = ['Private','Sergeant','Colonel','General'], forgedRank = null, forgedRankIds = null, selectedId = null;
      for (var rci = 0; rci < rankChoices.length && !forgedRankIds; rci++) {
        var alternatePart = clone(saved.campaign.loot.journey.lastParticipation); alternatePart.rankAtResult = rankChoices[rci];
        var alternateIds = warCareerComradeCandidates(saved.campaign, saved.campaign.loot.journey, null, alternatePart).map(function(row) { return row.pid; });
        if (alternateIds.length && bytes(alternateIds) !== bytes(fixed)) {
          for (var fci = 0; fci < fixed.length && !selectedId; fci++) if (alternateIds.indexOf(fixed[fci]) >= 0) selectedId = fixed[fci];
          if (selectedId) { forgedRank = rankChoices[rci]; forgedRankIds = alternateIds; }
        }
      }
      if (!forgedRankIds || !selectedId) throw new Error('rank-reroll tamper control unavailable');
      var rankTamper = clone(saved), rankTamperJ = rankTamper.campaign.loot.journey;
      rankTamperJ.person.rank = forgedRank; rankTamperJ.handoff.candidateIds = forgedRankIds.slice();
      warCareerInit(rankTamper.campaign);
      if (rankTamper.campaign.loot.journey.handoff !== null || rankTamper.campaign.loot.journey.status !== 'fallen') throw new Error('saved display rank plus candidate ids rerolled pending handoff');
      var receiptRankTamper = clone(saved), receiptRankJ = receiptRankTamper.campaign.loot.journey;
      var receiptPart = receiptRankJ.lastParticipation;
      receiptPart.rankAtResult = forgedRank;
      receiptPart.resultId = _wcResultId(receiptPart.runId, receiptPart.creditKey, receiptPart.mode, receiptPart.personId,
        receiptPart.slotPid, receiptPart.routeUnitId, receiptPart.mapping, receiptPart.battleYear,
        receiptPart.rankAtResult, receiptPart.assignmentId);
      receiptRankJ.handoff.candidateIds = forgedRankIds.slice();
      warCareerInit(receiptRankTamper.campaign);
      if (receiptRankTamper.campaign.loot.journey.handoff !== null || receiptRankTamper.campaign.loot.journey.lastParticipation !== null ||
          receiptRankTamper.campaign.loot.journey.status !== 'fallen' || !receiptRankTamper.campaign.loot.journey.creditLedger.some(function(row) { return row.qualifying; })) {
        throw new Error('divergent last-participation receipt plus candidate ids rerolled pending handoff');
      }
      var teamTamper = clone(saved); teamTamper.campaign.loot.journey.person.team = { side:'US', army:'Forged Army', brigade:'Forged Brigade', regiment:'Forged Regiment', company:'Forged Company' };
      applySave(teamTamper); warCareerInit(G.campaign);
      if (!G.campaign.loot.journey.handoff || bytes(G.campaign.loot.journey.handoff.candidateIds) !== bytes(fixed)) throw new Error('mutable snapshot hierarchy rerolled or erased canonical candidate ids');
      if (!warCareerAcceptHandoff(G.campaign, fixed[0]).ok) throw new Error('mutable snapshot hierarchy blocked a canonical saved candidate');
      var refTamper = clone(saved), refReplacement = _wcRegistryPersonUnique(refTamper.campaign, fixed[0]);
      if (!refReplacement || !refReplacement.unitRef) throw new Error('unit-ref tamper control unavailable');
      refTamper.campaign.loot.journey.person.unitRef = clone(refReplacement.unitRef);
      applySave(refTamper); warCareerInit(G.campaign);
      if (G.campaign.loot.journey.handoff !== null || G.campaign.loot.journey.status !== 'fallen') throw new Error('tampered fallen unit reference preserved a rerolled handoff or resurrected identity');
      applySave(clone(saved)); C = G.campaign; J = C.loot.journey;
      var oldRegistry = window.ssPersonRegistry, reg = oldRegistry(C), reversed = reg.people.slice().reverse();
      window.ssPersonRegistry = function() { return { people:reversed.slice() }; };
      try { warCareerInit(C); } finally { window.ssPersonRegistry = oldRegistry; }
      if (bytes(J.handoff.candidateIds) !== bytes(fixed)) throw new Error('load/registry order rerolled candidate ids');
      var selected = _wcRegistryPersonUnique(C, selectedId), ownRank = selected.rank, ownOvr = selected.ovr;
      var accepted = warCareerAcceptHandoff(C, selectedId);
      J = C.loot.journey;
      if (!accepted.ok || J.personId !== selectedId || J.person.rank !== ownRank || J.person.ovr !== ownOvr || J.person.ovr === 97 || J.status !== 'alive' || J.lineage.length !== 1 || J.lineage[0].rank !== J.lastParticipation.rankAtResult || J.handoff.state !== 'completed' || J.creditLedger.length !== creditCount || J.events.length !== eventCount || J.merit || J.reputation || J.career.length || J.log.length) throw new Error('handoff did not preserve one successor with own attributes and separated personal history');
      var completedRankTamper = envelope(C, 'completed-rank-tamper'), completedRankJ = completedRankTamper.campaign.loot.journey;
      completedRankJ.lineage[completedRankJ.lineage.length - 1].rank = forgedRank;
      completedRankJ.handoff.candidateIds = forgedRankIds.slice();
      warCareerInit(completedRankTamper.campaign);
      if (completedRankTamper.campaign.loot.journey.handoff !== null || completedRankTamper.campaign.loot.journey.lineage.length ||
          completedRankTamper.campaign.loot.journey.creditLedger.some(function(row) { return row.qualifying; })) throw new Error('saved lineage rank plus candidate ids rerolled completed handoff');
      var once = bytes(C), repeated = warCareerAcceptHandoff(C, selectedId);
      if (repeated.ok || bytes(C) !== once) throw new Error('repeated handoff mutated state');
      var retryB = mkB(C, true); participantEvidence(C, retryB, 'classic'); var journeyBeforeRetry = bytes(J);
      resolveResult(C, retryB, 'CS', 'win'); J = C.loot.journey;
      if (bytes(J) !== journeyBeforeRetry || J.creditLedger.length !== creditCount || J.events.length !== eventCount || J.handoff.state !== 'completed') throw new Error('same-rung recovery rerolled fate/candidates/credit after handoff');

      var C2 = mkC('US', false); startCurrent(C2, 'Captain', 'cmd');
      var B2 = mkB(C2, true); exactLeaderEvidence(C2, B2, 'fallen');
      var noCandidatePerson = _wcRegistryPersonUnique(C2, C2.loot.journey.personId), oldRegistry2 = window.ssPersonRegistry;
      window.ssPersonRegistry = function() { return { people:[clone(noCandidatePerson)], authored:noCandidatePerson.generated ? 0 : 1, generated:noCandidatePerson.generated ? 1 : 0, brigades:1 }; };
      try { resolveResult(C2, B2, 'CS', 'win'); } finally { window.ssPersonRegistry = oldRegistry2; }
      var J2 = C2.loot.journey, html = warCareerHandoffHTML(C2);
      if (!J2.handoff || J2.handoff.state !== 'ended' || J2.handoff.candidateIds.length || J2.personId !== J2.person.pid || html.indexOf('No eligible comrade could be identified') < 0) throw new Error('no-candidate ending fabricated or hid identity');
      return { fixedOrder:fixed, rankAtResult:J.lastParticipation.rankAtResult, pendingAndCompletedRankTamperRejected:true, divergentLastParticipationRejected:true, canonicalHierarchySurvivesTeamTamper:true, tamperedSnapshotCannotBlockCanonicalCandidate:true, unitRefTamperRejected:true, lineage:J.lineage.length, oneActive:J.personId, personalHistorySeparated:true, repeatRejected:true, recoveryRerollRejected:true, realNoCandidate:J2.handoff.reason };
    });

    step('QUALIFYING CREDIT ONE-PER-RUNG', function() {
      var C = mkC('US', false); startCurrent(C, 'Captain', 'cmd');
      var B = mkB(C, true); exactLeaderEvidence(C, B, 'alive');
      var first = resolveResult(C, B, 'CS', 'win'), J = C.loot.journey;
      var firstBytes = bytes({ credit:J.creditLedger[0], events:J.events, status:J.status, handoff:J.handoff });
      var retry = mkB(C, true); exactLeaderEvidence(C, retry, 'fallen'); var second = resolveResult(C, retry, 'US', 'decisive'); J = C.loot.journey;
      if (!first.qualifying || !second.duplicate || J.creditLedger.length !== 1 || !J.creditLedger[0].qualifying || J.creditLedger[0].outcomeRank !== 0 || bytes({ credit:J.creditLedger[0], events:J.events, status:J.status, handoff:J.handoff }) !== firstBytes) throw new Error('qualifying rung rerolled or accepted a later outcome/fate');
      if (J.merit || J.reputation || J.promotionCount || warCareerCommandProjection(C) !== 0 || warCareerCapabilities(C).fieldCommand) throw new Error('Slice B qualification unlocked advancement/authority');
      var saved = envelope(C, 'qualified'), count = J.creditLedger.length; applySave(clone(saved)); warCareerInit(G.campaign);
      if (G.campaign.loot.journey.creditLedger.length !== count || !G.campaign.loot.journey.creditLedger[0].qualifying) throw new Error('save/load changed qualifying credit');
      var loadedC = G.campaign, loadedJ = loadedC.loot.journey, ownerEventId = loadedJ.creditLedger[0].eventId;
      for (var si = 0; si < 110; si++) {
        var saturationId = _wcEventId(loadedC, loadedJ);
        _wcPushEvent(loadedJ, { eventId:saturationId, ordinal:loadedJ.eventOrdinal, kind:'result', creditKey:null,
          personId:loadedJ.personId, scenarioId:null, battleName:'Nonqualifying observation ' + si,
          outcome:'draw', type:'draw', status:loadedJ.status, fate:null, qualifying:false, merit:0, reputation:0, note:'ring saturation control' });
      }
      if (loadedJ.events.length !== 96 || !loadedJ.events.some(function(row) { return row.eventId === ownerEventId; })) throw new Error('event ring evicted qualifying owner');
      var saturatedSave = envelope(loadedC, 'saturated'); applySave(clone(saturatedSave)); warCareerInit(G.campaign);
      loadedC = G.campaign; loadedJ = loadedC.loot.journey;
      var saturatedCredit = loadedJ.creditLedger[0], saturatedCreditBytes = bytes(saturatedCredit), ownerStillPresent = loadedJ.events.some(function(row) { return row.eventId === ownerEventId; });
      if (!saturatedCredit.qualifying || !ownerStillPresent) throw new Error('save sanitation demoted saturated qualifying credit');
      loadedC.idx = saturatedCredit.chainIndex; loadedC.completed = []; loadedC.recovery = false; loadedC.recoveryMode = false;
      var saturatedRetry = mkB(loadedC, true); exactLeaderEvidence(loadedC, saturatedRetry, 'fallen'); var saturatedResult = resolveResult(loadedC, saturatedRetry, 'US', 'decisive');
      if (!saturatedResult.duplicate || bytes(_wcCreditFor(loadedC.loot.journey, saturatedCredit.creditKey)) !== saturatedCreditBytes) throw new Error('saturated owner loss reopened fate/qualification reroll');
      var C2 = mkC('US', false); startCurrent(C2, 'Private', 'pvt'); var originalIdx = C2.idx;
      var unproved = mkB(C2, true); resolveResult(C2, unproved, 'US', 'decisive');
      C2.idx = originalIdx; C2.completed = [];
      var proved = mkB(C2, true); participantEvidence(C2, proved, 'classic'); resolveResult(C2, proved, 'CS', 'win');
      var bound = latestCredit(C2);
      if (!bound || !bound.qualifying || bound.outcome !== 'defeat' || bound.outcomeRank !== 0 || bound.type !== 'win') throw new Error('unproved decisive result laundered into later qualifying loss');
      return { firstQualifyingOwnsFate:true, duplicateSuppressed:true, qualifyingOwnerRetainedAcrossRing:true, saturationSaveLoad:true, saturationRerollRejected:true, credits:count, exactOutcomeBound:true, merit:0, reputation:0, projection:0 };
    });

    step('SLICE-B SANITIZER + HANDOFF A11Y', function() {
      var C = mkC('US', false); startCurrent(C, 'Captain', 'cmd');
      var B = mkB(C, true); exactLeaderEvidence(C, B, 'alive'); resolveResult(C, B, 'US', 'win');
      var J = C.loot.journey;
      var people = ssPersonRegistry(C).people, other = null;
      for (var oi = 0; oi < people.length && !other; oi++) {
        var candidate = people[oi], candidateRef = candidate && candidate.unitRef;
        if (candidate && candidate.pid !== J.personId && candidate.side === C.side && candidateRef &&
            candidateRef.side === C.side && CHAINS[C.side].indexOf(candidateRef.battleId) >= 0) other = candidate;
      }
      if (!other) throw new Error('coherent forge control unavailable');
      var ref = other.unitRef, chainIndex = CHAINS[C.side].indexOf(ref.battleId), scenarioId = ref.battleId;
      var forgedKey = [C.runId,C.side,chainIndex,scenarioId].join('|');
      var routeUnitId = 'FORGE1', forgedMapping = 'explicit-career-assignment', forgedYear = _ssCareerBattleYear(scenarioId), forgedRank = other.rank;
      var forgedLink = { runId:C.runId, creditKey:forgedKey, person:other, ref:ref }, forgedAssignmentId = _wcAssignmentId(forgedLink, routeUnitId);
      var resultId = _wcResultId(C.runId, forgedKey, 'classic', other.pid, ref.slotPid, routeUnitId, forgedMapping, forgedYear, forgedRank, forgedAssignmentId);
      var forgedPart = { schema:'cw_war_career_participation_v1', resultId:resultId, mode:'classic', runId:C.runId, creditKey:forgedKey,
        personId:other.pid, chainIndex:chainIndex, battleId:scenarioId, side:'US', unitId:ref.unitId, slot:ref.slot, slotPid:ref.slotPid,
        routeUnitId:routeUnitId, mapping:forgedMapping, assignmentId:forgedAssignmentId, battleYear:forgedYear, rankAtResult:forgedRank };
      var forgedEventId = C.runId + ':event:coherent-forge';
      J.events.push({ eventId:forgedEventId, ordinal:J.eventOrdinal + 1, kind:'result', creditKey:forgedKey, scenarioId:scenarioId, battleName:'Forged', outcome:'victory', type:'win', personId:other.pid, status:'alive', fate:'alive', qualifying:true, merit:99, reputation:99, participation:forgedPart, note:'forged' });
      J.creditLedger.push({ creditKey:forgedKey, runId:C.runId, side:'US', chainIndex:chainIndex, scenarioId:scenarioId, outcome:'victory', type:'win', qualifying:true, merit:99, reputation:99, personId:other.pid, fate:'alive', eventId:forgedEventId, participation:forgedPart });
      J.handoff = { handoffId:forgedEventId + ':handoff', state:'pending', fallenPersonId:other.pid, resultEventId:forgedEventId, creditKey:forgedKey, scenarioId:scenarioId, side:'US', unitRef:ref, candidateIds:[J.personId] };
      warCareerInit(C); J = C.loot.journey;
      var forged = null; for (var i = 0; i < J.creditLedger.length; i++) if (J.creditLedger[i].creditKey === forgedKey) forged = J.creditLedger[i];
      if (!J.creditLedger[0].qualifying || !forged || forged.qualifying || forged.merit || forged.fate != null || J.handoff !== null || !J.lastParticipation) throw new Error('Slice-B sanitizer trusted coherent forged qualification/handoff or erased valid receipt');
      var stable = bytes(C); warCareerInit(C); if (bytes(C) !== stable) throw new Error('Slice-B sanitizer not idempotent');
      var yearTamper = clone(C), validCredit = null;
      for (var yci = 0; yci < yearTamper.loot.journey.creditLedger.length; yci++) if (yearTamper.loot.journey.creditLedger[yci].qualifying) { validCredit = yearTamper.loot.journey.creditLedger[yci]; break; }
      var validEvent = null;
      for (var yei = 0; yei < yearTamper.loot.journey.events.length; yei++) if (validCredit && yearTamper.loot.journey.events[yei].eventId === validCredit.eventId) { validEvent = yearTamper.loot.journey.events[yei]; break; }
      if (!validCredit || !validEvent) throw new Error('year-tamper control unavailable');
      delete validCredit.participation.battleYear; delete validEvent.participation.battleYear;
      if (yearTamper.loot.journey.lastParticipation) delete yearTamper.loot.journey.lastParticipation.battleYear;
      warCareerInit(yearTamper);
      if (yearTamper.loot.journey.creditLedger.some(function(row) { return row.qualifying; }) || yearTamper.loot.journey.lastParticipation) throw new Error('missing canonical battle year survived save sanitation');

      var capturedC = mkC('US', false); startCurrent(capturedC, 'Captain', 'cmd');
      var capturedB = mkB(capturedC, true); exactLeaderEvidence(capturedC, capturedB, 'captured'); resolveResult(capturedC, capturedB, 'CS', 'win');
      capturedC.loot.journey.status = 'alive'; capturedC.loot.journey.handoff = null; warCareerInit(capturedC);
      if (capturedC.loot.journey.status !== 'captured' || _wcActiveLink(capturedC, capturedC.loot.journey.person.unitRef.battleId)) throw new Error('save edit resurrected captured identity');
      var captureForge = clone(capturedC), captureJ = captureForge.loot.journey, capturedOwner = null;
      for (var cfi = 0; cfi < captureJ.creditLedger.length && !capturedOwner; cfi++) if (captureJ.creditLedger[cfi].qualifying && captureJ.creditLedger[cfi].fate === 'captured') capturedOwner = captureJ.creditLedger[cfi];
      var recoveryIndex = capturedOwner && capturedOwner.chainIndex + 1;
      if (!capturedOwner || recoveryIndex >= CHAINS[captureForge.side].length) throw new Error('capture cross-link control unavailable');
      var recoveryScenario = CHAINS[captureForge.side][recoveryIndex], recoveryKey = [captureForge.runId,captureForge.side,recoveryIndex,recoveryScenario].join('|');
      var forgedRecoveryEventId = captureForge.runId + ':event:forged-recovery';
      captureJ.eventOrdinal += 1;
      captureJ.events.push({ eventId:forgedRecoveryEventId, ordinal:captureJ.eventOrdinal, kind:'result', creditKey:recoveryKey,
        personId:captureJ.personId, scenarioId:recoveryScenario, battleName:'Forged recovery', outcome:'victory', type:'win',
        status:'alive', fate:null, qualifying:false, merit:0, reputation:0, recoveryOfCreditKey:capturedOwner.creditKey, note:'forged cross-link' });
      captureJ.creditLedger.push({ creditKey:recoveryKey, runId:captureForge.runId, side:captureForge.side, chainIndex:recoveryIndex,
        scenarioId:recoveryScenario, outcome:'victory', type:'win', personId:captureJ.personId + ':other', fate:null,
        qualifying:false, merit:0, reputation:0, eventId:forgedRecoveryEventId });
      capturedOwner.recoveredAtCreditKey = recoveryKey; capturedOwner.recoveryEventId = forgedRecoveryEventId;
      warCareerInit(captureForge);
      var cleanedCapture = _wcCreditFor(captureForge.loot.journey, capturedOwner.creditKey);
      if (!cleanedCapture || cleanedCapture.recoveredAtCreditKey || cleanedCapture.recoveryEventId || captureForge.loot.journey.status !== 'captured') throw new Error('cross-person recovery credit suppressed captured status');

      var wrongOwnerForge = clone(capturedC), wrongOwnerJ = wrongOwnerForge.loot.journey, wrongOwnerCapture = null;
      for (var wci = 0; wci < wrongOwnerJ.creditLedger.length && !wrongOwnerCapture; wci++) if (wrongOwnerJ.creditLedger[wci].qualifying && wrongOwnerJ.creditLedger[wci].fate === 'captured') wrongOwnerCapture = wrongOwnerJ.creditLedger[wci];
      var wrongOwnerIndex = wrongOwnerCapture && wrongOwnerCapture.chainIndex + 1;
      if (!wrongOwnerCapture || wrongOwnerIndex >= CHAINS[wrongOwnerForge.side].length) throw new Error('wrong-owner recovery control unavailable');
      var wrongOwnerScenario = CHAINS[wrongOwnerForge.side][wrongOwnerIndex];
      var wrongOwnerKey = [wrongOwnerForge.runId,wrongOwnerForge.side,wrongOwnerIndex,wrongOwnerScenario].join('|');
      var recoveryOwnerId = wrongOwnerForge.runId + ':event:recovery-owner';
      var unrelatedOwnerId = wrongOwnerForge.runId + ':event:unrelated-owner';
      wrongOwnerJ.eventOrdinal += 1;
      wrongOwnerJ.events.push({ eventId:recoveryOwnerId, ordinal:wrongOwnerJ.eventOrdinal, kind:'result', creditKey:wrongOwnerKey,
        personId:wrongOwnerJ.personId, scenarioId:wrongOwnerScenario, battleName:'Forged recovery owner', outcome:'victory', type:'win',
        status:'alive', fate:null, qualifying:false, merit:0, reputation:0, recoveryOfCreditKey:wrongOwnerCapture.creditKey, note:'forged recovery owner' });
      wrongOwnerJ.eventOrdinal += 1;
      wrongOwnerJ.events.push({ eventId:unrelatedOwnerId, ordinal:wrongOwnerJ.eventOrdinal, kind:'result', creditKey:wrongOwnerKey,
        personId:wrongOwnerJ.personId, scenarioId:wrongOwnerScenario, battleName:'Unrelated owner', outcome:'victory', type:'win',
        status:'alive', fate:null, qualifying:false, merit:0, reputation:0, note:'different event owns the credit' });
      wrongOwnerJ.creditLedger.push({ creditKey:wrongOwnerKey, runId:wrongOwnerForge.runId, side:wrongOwnerForge.side, chainIndex:wrongOwnerIndex,
        scenarioId:wrongOwnerScenario, outcome:'victory', type:'win', personId:wrongOwnerJ.personId, fate:null,
        qualifying:false, merit:0, reputation:0, eventId:unrelatedOwnerId });
      wrongOwnerCapture.recoveredAtCreditKey = wrongOwnerKey; wrongOwnerCapture.recoveryEventId = recoveryOwnerId;
      warCareerInit(wrongOwnerForge);
      var wrongOwnerClean = _wcCreditFor(wrongOwnerForge.loot.journey, wrongOwnerCapture.creditKey);
      if (!wrongOwnerClean || wrongOwnerClean.recoveredAtCreditKey || wrongOwnerClean.recoveryEventId || wrongOwnerForge.loot.journey.status !== 'captured') throw new Error('wrong-owner recovery event suppressed captured status');

      var chainRows = [
        { personId:'line-a', successorId:'line-b', resultEventId:'line-event-a', creditKey:'line-credit-a' },
        { personId:'line-b', successorId:'line-c', resultEventId:'line-event-b', creditKey:'line-credit-b' }
      ];
      var chainEvents = { 'line-event-a':{ ordinal:10 }, 'line-event-b':{ ordinal:20 } };
      var chainCredits = { 'line-credit-a':{ chainIndex:1 }, 'line-credit-b':{ chainIndex:2 } };
      if (!_ssCareerLineageChainValid(chainRows, chainEvents, chainCredits, 'line-c')) throw new Error('valid two-hop lineage chain rejected');
      var disconnectedRows = clone(chainRows); disconnectedRows[0].successorId = 'line-d';
      if (_ssCareerLineageChainValid(disconnectedRows, chainEvents, chainCredits, 'line-c')) throw new Error('disconnected two-hop successor link survived');
      var nonmonotonicCredits = clone(chainCredits); nonmonotonicCredits['line-credit-b'].chainIndex = 1;
      if (_ssCareerLineageChainValid(chainRows, chainEvents, nonmonotonicCredits, 'line-c')) throw new Error('nonmonotonic two-hop credit order survived');

      var fallenC = mkC('US', false); startCurrent(fallenC, 'Captain', 'cmd');
      var fallenB = mkB(fallenC, true); exactLeaderEvidence(fallenC, fallenB, 'fallen'); resolveResult(fallenC, fallenB, 'CS', 'win');
      fallenC.loot.journey.status = 'alive'; fallenC.loot.journey.handoff = null; warCareerInit(fallenC);
      if (fallenC.loot.journey.status !== 'fallen' || _wcActiveLink(fallenC, fallenC.loot.journey.person.unitRef.battleId)) throw new Error('save edit resurrected fallen identity');

      var C2 = mkC('US', false); startCurrent(C2, 'Captain', 'cmd');
      var B2 = mkB(C2, true); exactLeaderEvidence(C2, B2, 'fallen'); resolveResult(C2, B2, 'CS', 'win');
      openSheet('<div id="wcSliceBA11y">' + warCareerSummaryHTML(C2) + '</div>');
      var host = document.getElementById('wcSliceBA11y'), panel = host && host.querySelector('[data-war-career-handoff="pending"]');
      if (!panel || !panel.querySelector('h4') || !panel.querySelector('ul') || !panel.querySelector('button[data-wc-handoff]') || !/fallen|hand-off/i.test(panel.textContent)) throw new Error('pending handoff semantics/a11y missing');
      var handoffButton = panel.querySelector('button[data-wc-handoff]'), buttonBox = handoffButton.getBoundingClientRect();
      handoffButton.focus();
      if (document.activeElement !== handoffButton || buttonBox.width < 24 || buttonBox.height < 24 || /animation|transition/i.test(handoffButton.getAttribute('style') || '')) throw new Error('handoff focus/target/reduced-motion contract missing');
      handoffButton.click();
      if (!C2.loot.journey.handoff || C2.loot.journey.handoff.state !== 'completed') throw new Error('delegated AAR/summary handoff control was inert');
      var completedSave = envelope(C2, 'completed-handoff'), distantSuccessor = otherBattlePerson(C2, 'Private');
      var chainGateForge = clone(completedSave), oldChainGate = window._ssCareerLineageChainValid;
      window._ssCareerLineageChainValid = function() { return false; };
      try { warCareerInit(chainGateForge.campaign); } finally { window._ssCareerLineageChainValid = oldChainGate; }
      if (chainGateForge.campaign.loot.journey.lineage.length || chainGateForge.campaign.loot.journey.handoff ||
          chainGateForge.campaign.loot.journey.creditLedger.some(function(row) { return row.qualifying; })) throw new Error('sanitizer did not consume lineage-chain authority');
      if (!distantSuccessor) throw new Error('completed-handoff distant successor control unavailable');
      var distantForge = clone(completedSave), distantJ = distantForge.campaign.loot.journey;
      distantJ.personId = distantSuccessor.pid; distantJ.person = _ssJourneySnapshot(distantSuccessor, true); distantJ.status = 'alive';
      distantJ.handoff.selectedPersonId = distantSuccessor.pid; distantJ.handoff.candidateIds = [distantSuccessor.pid]; distantJ.lineage[distantJ.lineage.length - 1].successorId = distantSuccessor.pid;
      applySave(distantForge); warCareerInit(G.campaign);
      if (G.campaign.loot.journey.handoff !== null || G.campaign.loot.journey.lineage.length || G.campaign.loot.journey.creditLedger.some(function(row) { return row.qualifying; })) throw new Error('coherent distant completed-handoff forge survived');
      var wrongSide = null, allPeople = ssPersonRegistry(C2).people;
      for (var wsi = 0; wsi < allPeople.length && !wrongSide; wsi++) if (allPeople[wsi].side !== C2.side && allPeople[wsi].unitRef) wrongSide = allPeople[wsi];
      if (!wrongSide) throw new Error('wrong-side successor control unavailable');
      var sideForge = clone(completedSave), sideJ = sideForge.campaign.loot.journey;
      sideJ.personId = wrongSide.pid; sideJ.person = _ssJourneySnapshot(wrongSide, true); sideJ.status = 'alive';
      sideJ.handoff.selectedPersonId = wrongSide.pid; sideJ.handoff.candidateIds = [wrongSide.pid]; sideJ.lineage[sideJ.lineage.length - 1].successorId = wrongSide.pid;
      applySave(sideForge); warCareerInit(G.campaign);
      if (G.campaign.loot.journey.enabled || G.campaign.loot.journey.handoff) throw new Error('wrong-side completed successor remained active');
      var deadForge = clone(completedSave); deadForge.campaign.loot.journey.status = 'captured';
      applySave(deadForge); warCareerInit(G.campaign);
      if (G.campaign.loot.journey.handoff !== null || G.campaign.loot.journey.status !== 'captured') throw new Error('captured completed successor retained handoff authority');
      return { validReceipt:true, coherentForgeRejected:true, missingYearRejected:true, capturedAndFallenResurrectionRejected:true, crossPersonCaptureRecoveryRejected:true, wrongOwnerCaptureRecoveryRejected:true, twoHopLineageChainEnforced:true, lineageChainIntegrationBound:true, completedDistantWrongSideDeadRejected:true, malformedHandoffRejected:true, idempotent:true, heading:true, list:true, nativeButton:true, focus:true, target24:true, delegatedControl:true };
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

    const audioAutoplayNoise = "[warning] The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page. https://developer.chrome.com/blog/autoplay/#web_audio";
    const readbackNoise = /^\[warning\] \[\.WebGL-[^\]]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels(?: \(this message will no longer repeat\))?$/;
    const realErrors = consoleLines.filter(line =>
      line !== audioAutoplayNoise && !readbackNoise.test(line) &&
      !(line.startsWith("[error]") && /Failed to load resource:.*404/i.test(line))
    );
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
