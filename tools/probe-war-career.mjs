#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D407 relationship-memory gate: every D401-D406 receipt, advancement, billet,
// hand-off, and pull-only authority row remains, plus bounded source-honest ties.

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
  check("suite is 131", rows.length === 131, rows.length);   // D425: 130 -> 131 (D418 enrolled the Mayhem row; this probe had not rerun since D413)
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
  check("dual-reference schemas registered", runtime.includes("cw_war_career_result_v2") && runtime.includes("cw_war_career_participation_v2") && runtime.includes("_WC_TIMELINE_ASSIGNMENTS_V1"), null);
  check("replacement source year owns canonical history", journey.includes("if (r.year != null) p.serviceYear = r.year;"), null);
  check("replacement bounds pair carries with no single-year pin",
    journey.includes("if (r.serviceStart != null && r.serviceEnd != null) {") &&
    journey.includes("p.serviceStart = r.serviceStart;") && journey.includes("p.serviceEnd = r.serviceEnd;") &&
    journey.includes("r.serviceStart <= r.serviceEnd && year >= r.serviceStart && year <= r.serviceEnd") &&
    occurrences(journey, "if (r.year != null) p.serviceYear = r.year;") === 1, null);
  const commandTargetSelector = (runtime.match(/function _wcRelationshipCommandTarget[\s\S]*?\n\}/) || [""])[0];
  check("player career never owns NPC command state",
    !/\bP\.command\b/.test(runtime) && occurrences(runtime, "C.president.command") === 1 &&
    occurrences(commandTargetSelector, "commandState.") === 1 &&
    occurrences(commandTargetSelector, "cmdActiveId(C)") === 1 && occurrences(commandTargetSelector, "cmdActiveGeneral(C)") === 1 &&
    commandTargetSelector.includes("commandState._activeId") && commandTargetSelector.includes("general.id !== targetId") &&
    !/commandState\s*\[/.test(commandTargetSelector) &&
    !/(?:delete\s+commandState\b|commandState\s*(?:\.|\[)[^;\n]*(?:\+\+|--|(?:[+\-*/%&|^]|<<|>>)?=(?!=))|Object\.(?:assign|defineProperty)\s*\(\s*commandState)/.test(commandTargetSelector) &&
    !/(?:commandState|C\.president\.command)\s*\.[A-Za-z_$][\w$]*\s*=(?!=)/.test(runtime),
    { commandReads: occurrences(runtime, "C.president.command"), targetOnly: !!commandTargetSelector });
  check("after-action file frozen", md5(join(ROOT, "src", "82-after-action.js")) === "e2a4739946b20b1a725a08d55b4825f6", md5(join(ROOT, "src", "82-after-action.js")));
  check("Auto file frozen", md5(join(ROOT, "src", "87-auto-resolve.js")) === "4f0bd0970ef96c09b62ea44694387f80", md5(join(ROOT, "src", "87-auto-resolve.js")));
  check("T2 file frozen", md5(join(ROOT, "src", "tactical", "T2-campaign-link.js")) === "25b7c20563be53cadd7ee1ba98a62a3b", md5(join(ROOT, "src", "tactical", "T2-campaign-link.js")));   // D425: feef8a3c -> 25b7c205 (the recorded D420/LANE-007 Slice C consequence-metadata carry in fldCampaignComputeOutcome/ApplyOutcome; this probe had not rerun since D413)
  check("T3 file frozen", md5(join(ROOT, "src", "tactical", "T3-officers.js")) === "56e2cd1060a40eb0754b19e8d56bacdb", md5(join(ROOT, "src", "tactical", "T3-officers.js")));
  const commandProbe = readFileSync(join(ROOT, "tools", "probe-command.mjs"), "utf8");
  check("command probe carries player/NPC isolation tooth", commandProbe.includes("D406: player journey and NPC P.command ledgers stay byte-separate in both directions"), null);

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
  function exactPerson(C, pid) {
    var people = ssPersonRegistry(C).people, found = null, count = 0;
    for (var i = 0; i < people.length; i++) if (people[i] && people[i].pid === pid) { found = people[i]; count++; }
    if (count !== 1) throw new Error('exact person count ' + count + ' for ' + pid);
    return found;
  }
  function v2RunForFate(wanted, outcome, type) {
    var pid = 'person_gettysburg_us_17me_haley';
    for (var i = 0; i < 5000; i++) {
      var runId = 'run-d405-' + wanted + '-' + i;
      var participation = {
        schema:'cw_war_career_participation_v2', runId:runId,
        creditKey:runId + '|US|16|chickamauga', personId:pid,
        timelineAssignmentRef:{
          scenarioId:'chickamauga', side:'US', unitId:'us_harker_rock', slot:'pvt',
          slotPid:'ss:chickamauga:US:us_harker_rock:pvt'
        }
      };
      if (warCareerDeterministicFate(participation, outcome, type) === wanted) return runId;
    }
    throw new Error('no deterministic v2 ' + wanted + ' run id');
  }
  function haleyTimelineFixture(options) {
    options = options || {};
    var C = mkC('US', false), pid = 'person_gettysburg_us_17me_haley';
    C.idx = 15;
    var person = exactPerson(C, pid), sourceBefore = _wcSourceRefFromPerson(person), unitRefBefore = bytes(person.unitRef);
    C.runId = options.fate
      ? v2RunForFate(options.fate, options.outcome || 'defeat', options.type || 'win')
      : (options.runId || 'run-d405-haley');
    var started = warCareerStart(C, pid);
    if (!started.ok) throw new Error('Haley War Career start failed: ' + bytes(started));
    C.idx = 16;
    var B = mkB(C, true);
    var combatBefore = bytes({ bd:B.bd, casualties:B.casualties, infl:B.infl, units:B.units });
    B.warCareerEvidence = warCareerBuildClassicEvidence(C, B);
    if (!B.warCareerEvidence) throw new Error('Haley v2 Classic evidence missing');
    return { C:C, B:B, person:person, sourceBefore:sourceBefore, unitRefBefore:unitRefBefore, combatBefore:combatBefore };
  }
  function haleyV1Fixture() {
    var C = mkC('US', false), pid = 'person_gettysburg_us_17me_haley';
    C.idx = 15;
    C.runId = 'run-d401-byte-compat';
    if (!warCareerStart(C, pid).ok) throw new Error('Haley v1 compatibility start failed');
    var B = mkB(C, true);
    participantEvidence(C, B, 'classic');
    var proof = warCareerParticipationEvidence(C, B);
    if (!proof.qualifying) throw new Error('Haley v1 compatibility receipt failed');
    return { C:C, B:B, participation:proof.participation };
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
  function d406Fixture(options) {
    options = options || {};
    var pid = 'ss:chancellorsville:US:us_battery_chanc:cmd';
    var C = mkC('US', false); C.idx = 12; C.runId = options.runId || 'run-d406-general-1';
    var canonical = exactPerson(C, pid), sourceBefore = clone(_wcSourceRefFromPerson(canonical));
    var sourceOvr = canonical.ovr, started = warCareerStart(C, pid);
    if (!started.ok || _wcRankOrdinal(C.loot.journey.person.rank) !== 4) throw new Error('D406 exact Captain start failed: ' + bytes(started));
    var initial = {
      rank:C.loot.journey.person.rank, merit:C.loot.journey.merit, reputation:C.loot.journey.reputation,
      role:warCareerRole(C), caps:warCareerCapabilities(C), projection:warCareerCommandProjection(C),
      history:clone(C.loot.journey.roleHistory), billet:clone(C.loot.journey.currentBillet)
    };
    var rungs = [
      { index:12, scenarioId:'chancellorsville', schema:'cw_war_career_participation_v1' },
      { index:14, scenarioId:'vicksburg', assignmentId:'wcta-144pyv4' },
      { index:15, scenarioId:'gettysburg', assignmentId:'wcta-11pxx98' },
      { index:16, scenarioId:'chickamauga', assignmentId:'wcta-9be2qw' }
    ];
    var limit = options.fallenAt == null ? rungs.length : Number(options.fallenAt) + 1;
    if (options.limit != null) limit = Math.max(0, Math.min(limit, Math.round(Number(options.limit) || 0)));
    var stages = [];
    for (var i = 0; i < limit; i++) {
      C.idx = rungs[i].index;
      var B = mkB(C, true), fallen = options.fallenAt === i;
      var winner = fallen ? 'CS' : 'US', type = 'decisive';
      B.warCareerEvidence = warCareerBuildClassicEvidence(C, B);
      if (!B.warCareerEvidence) throw new Error('D406 evidence missing at ' + rungs[i].scenarioId);
      var proof = warCareerParticipationEvidence(C, B), preflight = warCareerPreflightFate(C, B, winner, type);
      if (!proof.qualifying || !preflight.qualifying || preflight.fate !== (fallen ? 'fallen' : 'alive')) {
        throw new Error('D406 deterministic preflight mismatch at ' + rungs[i].scenarioId + ': ' + bytes({ proof:proof, preflight:preflight }));
      }
      var resolved = resolveResult(C, B, winner, type), J = C.loot.journey, credit = latestCredit(C);
      stages.push({
        rung:rungs[i], B:clone(B), proof:clone(proof), preflight:clone(preflight), resolved:clone(resolved),
        rank:J.person.rank, merit:J.merit, reputation:J.reputation, promotionCount:J.promotionCount,
        role:clone(warCareerRole(C)), caps:clone(warCareerCapabilities(C)), projection:warCareerCommandProjection(C),
        history:clone(J.roleHistory), billet:clone(J.currentBillet), credit:clone(credit), ovr:J.person.ovr,
        commandTarget:C.president && C.president.command && C.president.command._activeId || null
      });
    }
    return { C:C, pid:pid, canonical:canonical, sourceBefore:sourceBefore, sourceOvr:sourceOvr,
      initial:initial, rungs:rungs.slice(0, limit), stages:stages };
  }
  function d407Pair(J, result) {
    var event = null, credit = null;
    for (var i = 0; i < (J.events || []).length; i++) if (J.events[i] && J.events[i].eventId === result.eventId) event = J.events[i];
    for (var ci = 0; ci < (J.creditLedger || []).length; ci++) if (J.creditLedger[ci] && J.creditLedger[ci].creditKey === result.creditKey) credit = J.creditLedger[ci];
    if (!event || !credit || credit.eventId !== event.eventId) throw new Error('D407 exact event/credit pair missing');
    return { event:event, credit:credit };
  }
  function d407StripSignals(J) {
    (J.events || []).forEach(function(row) { if (row) delete row.relationshipSignal; });
    (J.creditLedger || []).forEach(function(row) { if (row) delete row.relationshipSignal; });
    J.relationships = {};
  }
  function d407SeedSignal(C, J, event, credit, targetId) {
    var signal = _wcRelationshipSignalForTarget(C, J, event, targetId);
    if (!signal) throw new Error('D407 literal signal could not be built for ' + targetId);
    event.relationshipSignal = clone(signal);
    credit.relationshipSignal = clone(signal);
    return signal;
  }
  function d407LiveCase(winnerSide, type, label) {
    var pid = 'ss:chancellorsville:US:us_battery_chanc:cmd';
    for (var attempt = 0; attempt < 96; attempt++) {
      var C = mkC('US', false); C.idx = 12; C.runId = 'run-d407-' + label + '-' + attempt;
      if (!warCareerStart(C, pid).ok) throw new Error('D407 exact Captain start failed');
      var B = mkB(C, true);
      B.warCareerEvidence = warCareerBuildClassicEvidence(C, B);
      if (!B.warCareerEvidence) throw new Error('D407 classic evidence missing');
      var proof = warCareerParticipationEvidence(C, B), preflight = warCareerPreflightFate(C, B, winnerSide, type);
      if (!proof.qualifying || !preflight.qualifying) throw new Error('D407 qualifying preflight missing');
      if (preflight.fate !== 'alive') continue;
      var resolved = resolveResult(C, B, winnerSide, type), J = C.loot.journey;
      if (!resolved || !resolved.qualifying || resolved.fate !== 'alive') throw new Error('D407 qualifying result did not commit');
      var pair = d407Pair(J, resolved);
      return { C:C, B:B, J:J, resolved:resolved, pair:pair,
        commandTarget:C.president && C.president.command && C.president.command._activeId || null };
    }
    throw new Error('D407 could not find deterministic alive fixture for ' + label);
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
        'warCareerCreditAward', 'warCareerDeriveAdvancement',
        'warCareerRelationshipSignal', 'warCareerRelationshipSignalClean', 'warCareerRebuildRelationships',
        'warCareerRole', 'warCareerCapabilities', 'warCareerStrategicGeneral', 'warCareerCommandProjection',
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
      if (!promoted.loot.journey.enabled || promoted.loot.journey.person.rank !== promotedPerson.rank ||
          promoted.loot.journey.promotionCount || promoted.loot.journey.roleHistory.length || promoted.loot.journey.currentBillet) {
        throw new Error('unsupported saved promotion was not rebuilt from canonical rank and an empty receipt ledger');
      }

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
      return { runId:runId, states:legal.length, events:J.events.length, credits:J.creditLedger.length, aliasRejected:true, missingRecovered:true, replacementNormalized:true, unsupportedPromotionRejected:true, forgedLedgerRejected:true, saturationUnique:true };
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

      var sergeant = mkC('US', false), sergeantStart = startV1(sergeant, 'Sergeant');
      if (_wcRankOrdinal(sergeantStart.person.rank) !== 2 || warCareerRole(sergeant).id !== 'junior-command') throw new Error('canonical Sergeant should summarize as junior command');
      var captain = mkC('US', false), captainStart = startV1(captain, 'Captain');
      if (_wcRankOrdinal(captainStart.person.rank) !== 4 || warCareerRole(captain).id !== 'junior-command') throw new Error('canonical Captain should summarize as junior command');
      C.loot.journey.person.rank = 'Major'; C.loot.journey.creditLedger = [{ creditKey:C.runId + '|US|0|x', runId:C.runId, side:'US', chainIndex:0, scenarioId:'x', outcome:'victory', type:'win', qualifying:false, merit:0 }]; warCareerInit(C);
      if (C.loot.journey.person.rank !== started.person.rank || warCareerCapabilities(C).fieldCommand || warCareerCommandProjection(C) !== 0) throw new Error('forged rank/nonqualifying credit unlocked command');
      ['wounded','captured','fallen','retired','war-ended'].forEach(function(status) {
        C.loot.journey.status = status; warCareerInit(C);
        var r = warCareerRole(C), c = warCareerCapabilities(C);
        if (r.id !== 'unavailable' || c.fieldCommand || c.nationalDecisions) throw new Error(status + ' retained authority');
      });
      return { privateRole:role.id, projection:projection, inactiveStates:5, person:started.person.pid };
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
      if (J.merit !== 0 || J.reputation !== -1 || first.merit !== 0 || first.reputation !== -1 ||
          J.promotionCount || warCareerCommandProjection(C) !== 0 || warCareerCapabilities(C).fieldCommand) {
        throw new Error('D406 alive-defeat award or command closure moved: ' + bytes({ first:first, journey:{ merit:J.merit, reputation:J.reputation, promotions:J.promotionCount } }));
      }
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
      return { firstQualifyingOwnsFate:true, duplicateSuppressed:true, qualifyingOwnerRetainedAcrossRing:true, saturationSaveLoad:true, saturationRerollRejected:true, credits:count, exactOutcomeBound:true, merit:0, reputation:-1, projection:0 };
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

    step('V2 SOURCE IMMUTABILITY', function() {
      var fixture = haleyTimelineFixture({ fate:'alive', outcome:'victory', type:'win' }), C = fixture.C, evidence = fixture.B.warCareerEvidence;
      var resolved = resolveResult(C, fixture.B, 'US', 'win');
      var canonicalAfter = _wcSourceRefFromPerson(exactPerson(C, C.loot.journey.personId));
      if (!resolved || !resolved.qualifying) throw new Error('later-rung result did not commit a qualifying v2 receipt');
      if (!Object.isFrozen(_WC_TIMELINE_ASSIGNMENTS_V1) || !Object.isFrozen(_WC_TIMELINE_ASSIGNMENTS_V1[0])) throw new Error('timeline assignment input is not deeply frozen');
      if (bytes(fixture.sourceBefore) !== bytes(canonicalAfter) || bytes(fixture.sourceBefore) !== bytes(evidence.sourceRef)) throw new Error('canonical source reference changed across later-rung evidence');
      if (fixture.unitRefBefore !== bytes(C.loot.journey.person.unitRef) || C.loot.journey.person.unitRef.battleId !== 'gettysburg') throw new Error('journey source unit was rewritten as the live rung');
      if (evidence.sourceRef.provenance !== 'Verified' || evidence.sourceRef.serviceYear !== 1863 ||
          evidence.timelineAssignmentRef.provenance !== 'Inferred' || evidence.timelineAssignmentRef.label !== 'Your Timeline') throw new Error('source/timeline provenance labels collapsed');
      if (evidence.sourceRef.battleId === evidence.timelineAssignmentRef.scenarioId) throw new Error('source and timeline authorities were aliased');
      return { sourceBattle:evidence.sourceRef.battleId, sourceProvenance:evidence.sourceRef.provenance, timelineBattle:evidence.timelineAssignmentRef.scenarioId, timelineProvenance:evidence.timelineAssignmentRef.provenance, resultCommitted:true, frozen:true };
    });

    step('V2 EXACT LATER-RUNG PARTICIPATION', function() {
      var fixture = haleyTimelineFixture(), raw = fixture.B.warCareerEvidence;
      var proof = warCareerParticipationEvidence(fixture.C, fixture.B), participation = proof.participation;
      var topKeys = ['schema','resultId','mode','runId','creditKey','personId','chainIndex','battleId','side','sourceRef','timelineAssignmentRef','representedFieldUnitId','fieldMapping','battleYear','rankAtResult'];
      var sourceKeys = ['battleId','side','unitId','slot','slotPid','sourceGrade','serviceStart','serviceEnd','serviceYear','provenance'];
      var timelineKeys = ['assignmentId','scenarioId','side','unitId','slot','slotPid','chainIndex','serviceStart','serviceEnd','serviceYear','timelineGrade','provenance','label'];
      if (!proof.qualifying || !participation || participation.schema !== 'cw_war_career_participation_v2' || raw.schema !== 'cw_war_career_result_v2') throw new Error('exact later-rung v2 did not qualify');
      if (bytes(Object.keys(participation)) !== bytes(topKeys) || bytes(Object.keys(participation.sourceRef)) !== bytes(sourceKeys) || bytes(Object.keys(participation.timelineAssignmentRef)) !== bytes(timelineKeys)) throw new Error('persisted v2 shape drifted');
      if (participation.timelineAssignmentRef.assignmentId !== 'wcta-1pav4ac' || _wcTimelineAssignmentId(_WC_TIMELINE_ASSIGNMENTS_V1[0]) !== 'wcta-1pav4ac') throw new Error('deterministic assignment id drifted');
      if (participation.chainIndex !== 16 || participation.battleId !== 'chickamauga' || participation.representedFieldUnitId !== 'us_harker_rock' || participation.fieldMapping !== 'exact-timeline-unit' || !_wcTimelineTarget(_WC_TIMELINE_ASSIGNMENTS_V1[0])) throw new Error('current-rung target was not represented exactly');
      var recomputed = _wcResultIdV2(participation.runId, participation.creditKey, participation.mode, participation.personId,
        participation.sourceRef, participation.timelineAssignmentRef, participation.representedFieldUnitId,
        participation.fieldMapping, participation.battleYear, participation.rankAtResult);
      if (recomputed !== participation.resultId || raw.resultId !== participation.resultId) throw new Error('v2 result identity did not bind the complete receipt');
      return { schema:participation.schema, resultId:participation.resultId, assignmentId:participation.timelineAssignmentRef.assignmentId, chainIndex:participation.chainIndex, mapping:participation.fieldMapping };
    });

    step('V2 MALFORMED MATRIX FAIL CLOSED', function() {
      var fixture = haleyTimelineFixture(), C = fixture.C, B = fixture.B, rejected = [];
      function reject(label, mutate) {
        var candidate = clone(B);
        mutate(candidate);
        if (warCareerParticipationEvidence(C, candidate).qualifying) throw new Error(label + ' v2 qualified');
        rejected.push(label);
      }
      reject('partial', function(b) { delete b.warCareerEvidence.sourceRef; b.warCareerEvidence.unitId = 'us_birney_iii'; });
      reject('unknown-schema', function(b) { b.warCareerEvidence.schema = 'cw_war_career_result_v3'; });
      reject('unknown-top-field', function(b) { b.warCareerEvidence.forged = true; });
      reject('unknown-source-field', function(b) { b.warCareerEvidence.sourceRef.forged = true; });
      reject('stale-run', function(b) { b.warCareerEvidence.runId = 'run-stale'; });
      reject('stale-credit', function(b) { b.warCareerEvidence.creditKey += ':stale'; });
      reject('stale-rung', function(b) { b.warCareerEvidence.chainIndex = 15; });
      reject('wrong-result-side', function(b) { b.warCareerEvidence.side = 'CS'; });
      reject('wrong-result-scenario', function(b) { b.warCareerEvidence.battleId = 'gettysburg'; });
      reject('wrong-source', function(b) { b.warCareerEvidence.sourceRef.unitId = 'us_harker_rock'; });
      reject('wrong-source-slot', function(b) { b.warCareerEvidence.sourceRef.slot = 'nco'; });
      reject('wrong-source-grade', function(b) { b.warCareerEvidence.sourceRef.sourceGrade = 'Sergeant'; });
      reject('wrong-source-year', function(b) { b.warCareerEvidence.sourceRef.serviceYear = 1862; });
      reject('wrong-source-provenance', function(b) { b.warCareerEvidence.sourceRef.provenance = 'Inferred'; });
      reject('wrong-assignment', function(b) { b.warCareerEvidence.timelineAssignmentRef.assignmentId = 'wcta-forged'; });
      reject('wrong-timeline-side', function(b) { b.warCareerEvidence.timelineAssignmentRef.side = 'CS'; });
      reject('wrong-timeline-scenario', function(b) { b.warCareerEvidence.timelineAssignmentRef.scenarioId = 'gettysburg'; });
      reject('wrong-timeline-rung', function(b) { b.warCareerEvidence.timelineAssignmentRef.chainIndex = 15; });
      reject('wrong-target-unit', function(b) { b.warCareerEvidence.timelineAssignmentRef.unitId = 'us_brannan_rock'; });
      reject('wrong-target-slot', function(b) { b.warCareerEvidence.timelineAssignmentRef.slot = 'nco'; });
      reject('wrong-target-slot-pid', function(b) { b.warCareerEvidence.timelineAssignmentRef.slotPid += ':forged'; });
      reject('wrong-timeline-service-start', function(b) { b.warCareerEvidence.timelineAssignmentRef.serviceStart = 1864; });
      reject('wrong-timeline-service-end', function(b) { b.warCareerEvidence.timelineAssignmentRef.serviceEnd = 1862; });
      reject('wrong-timeline-service-year', function(b) { b.warCareerEvidence.timelineAssignmentRef.serviceYear = 1862; });
      reject('wrong-timeline-grade', function(b) { b.warCareerEvidence.timelineAssignmentRef.timelineGrade = 'Sergeant'; });
      reject('wrong-timeline-provenance', function(b) { b.warCareerEvidence.timelineAssignmentRef.provenance = 'Verified'; });
      reject('wrong-timeline-label', function(b) { b.warCareerEvidence.timelineAssignmentRef.label = 'Historical'; });
      reject('wrong-represented-unit', function(b) { b.warCareerEvidence.representedFieldUnitId = 'us_brannan_rock'; });
      reject('source-timeline-cross-reference', function(b) { b.warCareerEvidence.timelineAssignmentRef.slotPid = b.warCareerEvidence.sourceRef.slotPid; });
      var original = _WC_TIMELINE_ASSIGNMENTS_V1;
      try {
        _WC_TIMELINE_ASSIGNMENTS_V1 = deepFreeze([]);
        if (warCareerParticipationEvidence(C, B).qualifying) throw new Error('absent mapping qualified');
        rejected.push('absent-mapping');
        _WC_TIMELINE_ASSIGNMENTS_V1 = deepFreeze([clone(original[0]), clone(original[0])]);
        if (warCareerParticipationEvidence(C, B).qualifying) throw new Error('duplicate mapping qualified');
        rejected.push('duplicate-mapping');
      } finally { _WC_TIMELINE_ASSIGNMENTS_V1 = original; }
      if (!Object.isFrozen(original) || !Object.isFrozen(original[0])) throw new Error('mapping restore lost freeze');
      return { rejected:rejected, count:rejected.length, mappingRestored:true };
    });

    step('V2 SANITATION IDEMPOTENT', function() {
      var fixture = haleyTimelineFixture({ fate:'alive', outcome:'victory', type:'win' });
      var result = resolveResult(fixture.C, fixture.B, 'US', 'win'), C = fixture.C, J = C.loot.journey;
      var credit = _wcCreditFor(J, fixture.B.warCareerEvidence.creditKey), event = credit && J.events.filter(function(row) { return row.eventId === credit.eventId; })[0];
      if (!result.qualifying || !credit || !credit.qualifying || !event || !event.qualifying || !J.lastParticipation) throw new Error('valid v2 sanitation setup failed');
      if (bytes(event.participation) !== bytes(credit.participation) || bytes(credit.participation) !== bytes(J.lastParticipation) ||
          event.participation.resultId !== credit.participation.resultId) throw new Error('event/credit/last v2 copies diverged');
      event.participation.unknownTop = true; event.participation.sourceRef.unknownSource = true;
      credit.participation.unknownTop = true; credit.participation.timelineAssignmentRef.unknownTimeline = true;
      J.lastParticipation.unknownLast = true;
      warCareerInit(C); J = C.loot.journey; credit = _wcCreditFor(J, fixture.B.warCareerEvidence.creditKey);
      event = J.events.filter(function(row) { return row.eventId === credit.eventId; })[0];
      if (!credit.qualifying || own(event.participation, 'unknownTop') || own(event.participation.sourceRef, 'unknownSource') ||
          own(credit.participation, 'unknownTop') || own(credit.participation.timelineAssignmentRef, 'unknownTimeline') || own(J.lastParticipation, 'unknownLast')) throw new Error('unknown v2 fields were not stripped through reconstruction');
      var once = bytes(C); warCareerInit(C); var twice = bytes(C);
      if (once !== twice) throw new Error('second v2 init changed bytes');
      applySave(clone(envelope(C, 'v2-idempotent'))); warCareerInit(G.campaign);
      if (bytes(G.campaign) !== once) throw new Error('v2 save/apply/init changed canonical bytes');

      var mixed = haleyV1Fixture(), mixedC = mixed.C, mixedJ = mixedC.loot.journey, v1Part = clone(mixed.participation);
      var v1EventId = mixedC.runId + ':event:2';
      mixedJ.events.push({ eventId:v1EventId, ordinal:2, kind:'result', creditKey:v1Part.creditKey, scenarioId:v1Part.battleId,
        battleName:'Gettysburg', outcome:'victory', type:'win', personId:v1Part.personId, status:'alive', fate:'alive', qualifying:true,
        merit:0, reputation:0, note:'valid v1 control', participation:clone(v1Part) });
      mixedJ.creditLedger.push({ creditKey:v1Part.creditKey, runId:mixedC.runId, side:'US', chainIndex:15, scenarioId:'gettysburg',
        outcome:'victory', type:'win', outcomeRank:2, personId:v1Part.personId, fate:'alive', qualifying:true, merit:0, reputation:0,
        eventId:v1EventId, eventDate:null, participation:clone(v1Part) });
      mixedJ.lastParticipation = clone(v1Part); mixedJ.eventOrdinal = 2; G.campaign = mixedC; warCareerInit(mixedC);
      mixedJ = mixedC.loot.journey;
      var validV1Bytes = bytes(_wcCreditFor(mixedJ, v1Part.creditKey).participation);
      var badFixture = haleyTimelineFixture(), bad = _wcParticipationV2FromResult(clone(badFixture.B.warCareerEvidence));
      var badKey = mixedC.runId + '|US|16|chickamauga', badEventId = mixedC.runId + ':event:3';
      bad.runId = mixedC.runId; bad.creditKey = badKey; delete bad.timelineAssignmentRef;
      mixedJ.events.push({ eventId:badEventId, ordinal:3, kind:'result', creditKey:badKey, scenarioId:'chickamauga', battleName:'Chickamauga',
        outcome:'defeat', type:'win', personId:v1Part.personId, status:'fallen', fate:'fallen', qualifying:true, merit:0, reputation:0,
        note:'malformed v2 control', participation:bad });
      mixedJ.creditLedger.push({ creditKey:badKey, runId:mixedC.runId, side:'US', chainIndex:16, scenarioId:'chickamauga',
        outcome:'defeat', type:'win', outcomeRank:0, personId:v1Part.personId, fate:'fallen', qualifying:true, merit:0, reputation:0,
        eventId:badEventId, eventDate:null, participation:clone(bad) });
      mixedJ.handoff = { handoffId:badEventId + ':handoff', state:'ended', fallenPersonId:v1Part.personId,
        resultEventId:badEventId, creditKey:badKey, scenarioId:'chickamauga', side:'US',
        unitRef:{ battleId:'chickamauga', side:'US', unitId:'us_harker_rock', slot:'pvt', slotPid:'ss:chickamauga:US:us_harker_rock:pvt' },
        candidateIds:[], selectedPersonId:null, reason:'No eligible comrade could be identified' };
      G.campaign = mixedC; warCareerInit(mixedC); mixedJ = mixedC.loot.journey;
      var goodV1 = _wcCreditFor(mixedJ, v1Part.creditKey), badCredit = _wcCreditFor(mixedJ, badKey);
      var badEvent = mixedJ.events.filter(function(row) { return row.eventId === badEventId; })[0];
      if (!goodV1 || !goodV1.qualifying || bytes(goodV1.participation) !== validV1Bytes || !badCredit || badCredit.qualifying || badCredit.fate != null || badCredit.participation || !badEvent || badEvent.qualifying || badEvent.fate != null || mixedJ.handoff) throw new Error('malformed v2 was not demoted independently of valid v1: ' + bytes({ goodV1:goodV1, validV1Bytes:validV1Bytes, badCredit:badCredit, badEvent:badEvent, handoff:mixedJ.handoff }));
      return { resultId:credit.participation.resultId, copiesIdentical:true, unknownsStripped:true, secondInit:true, saveRoundtrip:true, malformedDemoted:true, validV1Preserved:true };
    });

    step('V2 ONE CREDIT + RETRY', function() {
      var fixture = haleyTimelineFixture({ fate:'alive', outcome:'victory', type:'win' }), C = fixture.C;
      var first = resolveResult(C, fixture.B, 'US', 'win'), J = C.loot.journey;
      var firstCredit = _wcCreditFor(J, fixture.B.warCareerEvidence.creditKey);
      var frozen = bytes({ credit:firstCredit, events:J.events, status:J.status, handoff:J.handoff, last:J.lastParticipation });
      C.idx = 16;
      var retryB = clone(fixture.B), second = resolveResult(C, retryB, 'CS', 'decisive'); J = C.loot.journey;
      if (!first.qualifying || !second.duplicate || J.creditLedger.length !== 1 || bytes({ credit:J.creditLedger[0], events:J.events, status:J.status, handoff:J.handoff, last:J.lastParticipation }) !== frozen) throw new Error('v2 same-rung retry replaced receipt, outcome, or fate');
      var v1 = haleyV1Fixture().participation, forged = clone(J.creditLedger[0]);
      forged.participation = clone(v1); forged.personId = v1.personId; forged.qualifying = true; forged.fate = 'fallen';
      J.creditLedger.push(forged); G.campaign = C; warCareerInit(C); J = C.loot.journey;
      if (J.creditLedger.length !== 1 || J.creditLedger[0].participation.schema !== 'cw_war_career_participation_v2' || bytes(J.creditLedger[0]) !== bytes(firstCredit)) throw new Error('cross-schema duplicate replaced the first qualifying owner');
      return { creditKey:J.creditLedger[0].creditKey, credits:J.creditLedger.length, firstSchema:J.creditLedger[0].participation.schema, duplicate:true, fateFrozen:true };
    });

    step('V2 HANDOFF ASSIGNMENT ISOLATION', function() {
      var fixture = haleyTimelineFixture({ fate:'fallen', outcome:'defeat', type:'win' }), C = fixture.C;
      var resolved = resolveResult(C, fixture.B, 'CS', 'win'), J = C.loot.journey;
      if (!resolved.qualifying || J.status !== 'fallen' || !J.handoff || J.handoff.state !== 'pending' || !J.handoff.candidateIds.length) throw new Error('v2 fallen result did not enter deterministic handoff');
      if (J.handoff.unitRef.battleId !== 'chickamauga' || J.handoff.unitRef.unitId !== 'us_harker_rock' || own(J.handoff, 'timelineAssignmentRef') || own(J.handoff, 'sourceRef')) throw new Error('handoff did not store only the result-location reference');
      var selected = J.handoff.candidateIds[0], accepted = warCareerAcceptHandoff(C, selected); J = C.loot.journey;
      if (!accepted.ok || J.personId !== selected || J.personId === 'person_gettysburg_us_17me_haley' || !J.handoff || J.handoff.state !== 'completed' || J.lineage.length !== 1) throw new Error('v2 successor handoff failed: ' + bytes({ accepted:accepted, personId:J.personId, selected:selected, handoff:J.handoff, lineage:J.lineage }));
      if (own(J.person, 'sourceRef') || own(J.person, 'timelineAssignmentRef') || own(J.person, 'timelineGrade') ||
          _wcTimelineAssignmentUnique(J.personId, 'US', 16, 'chickamauga')) throw new Error('Haley mapping authority transferred to successor');
      C.idx = 16;
      if (_wcTimelineLink(C, 'chickamauga')) throw new Error('successor borrowed Haley current-rung mapping');
      var owner = _wcCreditFor(J, fixture.B.warCareerEvidence.creditKey);
      if (!owner || !owner.qualifying || owner.personId !== 'person_gettysburg_us_17me_haley' || owner.participation.timelineAssignmentRef.assignmentId !== 'wcta-1pav4ac') throw new Error('handoff rewrote the owning v2 receipt');
      return { successor:selected, lineage:J.lineage.length, resultLocation:J.handoff.unitRef.slotPid, successorMapping:false, ownerPreserved:true };
    });

    step('V2 STATUS + SERVICE EXCLUSIONS', function() {
      var fixture = haleyTimelineFixture(), C = fixture.C, B = fixture.B, J = C.loot.journey;
      J.status = 'wounded';
      if (!warCareerParticipationEvidence(C, B).qualifying) throw new Error('wounded active person should remain eligible');
      var rejected = [];
      ['fallen','captured','retired','war-ended'].forEach(function(status) {
        J.status = status;
        if (warCareerParticipationEvidence(C, B).qualifying) throw new Error(status + ' person qualified');
        rejected.push(status);
      });
      J.status = 'alive'; J.handoff = { state:'pending' };
      if (warCareerParticipationEvidence(C, B).qualifying) throw new Error('unresolved handoff qualified');
      rejected.push('unresolved-handoff'); J.handoff = null;
      var oldRegistry = window.ssPersonRegistry, registry = oldRegistry(C), altered = clone(registry);
      for (var i = 0; i < altered.people.length; i++) if (altered.people[i].pid === J.personId) altered.people[i].serviceYear = 1862;
      window.ssPersonRegistry = function() { return clone(altered); };
      try {
        if (warCareerParticipationEvidence(C, B).qualifying) throw new Error('outside-service source person qualified');
      } finally { window.ssPersonRegistry = oldRegistry; }
      rejected.push('outside-service');
      var originalPid = J.personId; J.personId = originalPid + ':foreign';
      if (warCareerParticipationEvidence(C, B).qualifying) throw new Error('foreign person qualified');
      J.personId = originalPid; rejected.push('foreign-person');
      return { wounded:true, rejected:rejected, count:rejected.length };
    });

    step('V1 RECEIPT BYTE COMPATIBILITY', function() {
      var fixture = haleyV1Fixture(), participation = fixture.participation;
      var expected = '{"schema":"cw_war_career_participation_v1","resultId":"wcr-190t2s","mode":"classic","runId":"run-d401-byte-compat","creditKey":"run-d401-byte-compat|US|15|gettysburg","personId":"person_gettysburg_us_17me_haley","chainIndex":15,"battleId":"gettysburg","side":"US","unitId":"us_birney_iii","slot":"pvt","slotPid":"ss:gettysburg:US:us_birney_iii:pvt","routeUnitId":"U1","mapping":"explicit-career-assignment","assignmentId":"wca-kz638l","battleYear":1863,"rankAtResult":"Private"}';
      if (participation.resultId !== 'wcr-190t2s' || bytes(participation) !== expected) throw new Error('D401 persisted receipt bytes moved: ' + bytes(participation));
      var recomputed = _wcResultId(participation.runId, participation.creditKey, participation.mode, participation.personId,
        participation.slotPid, participation.routeUnitId, participation.mapping, participation.battleYear,
        participation.rankAtResult, participation.assignmentId);
      if (recomputed !== 'wcr-190t2s' || fixture.B.warCareerEvidence.schema !== 'cw_war_career_result_v1') throw new Error('D401 result-id helper or schema moved');
      var preserved = [];
      ['classic','auto','realtime'].forEach(function(mode) {
        [true,false].forEach(function(exactRoute) {
          var C = mkC('US', false); startCurrent(C, 'Private', 'pvt');
          var B = mkB(C, true), J = C.loot.journey;
          if (exactRoute) B.units[0].id = J.person.unitRef.unitId;
          participantEvidence(C, B, mode);
          var proof = warCareerParticipationEvidence(C, B), p = proof.participation;
          var expectedMapping = exactRoute ? 'exact-source-unit' : 'explicit-career-assignment';
          if (!proof.qualifying || !p || p.schema !== 'cw_war_career_participation_v1' || p.mapping !== expectedMapping) throw new Error('D401 ' + mode + '/' + expectedMapping + ' fixture moved');
          var clean = _ssCareerParticipation(clone(p), C);
          var id = _wcResultId(p.runId, p.creditKey, p.mode, p.personId, p.slotPid, p.routeUnitId,
            p.mapping, p.battleYear, p.rankAtResult, p.assignmentId);
          if (!clean || bytes(clean) !== bytes(p) || id !== p.resultId) throw new Error('D401 ' + mode + '/' + expectedMapping + ' receipt bytes/id changed');
          preserved.push(mode + ':' + expectedMapping);
        });
      });
      return { schema:participation.schema, resultId:participation.resultId, assignmentId:participation.assignmentId, bytes:expected.length, preservedFixtures:preserved };
    });

    step('V2 COMMAND + COMBAT CLOSED', function() {
      var fixture = haleyTimelineFixture({ fate:'alive', outcome:'victory', type:'win' }), C = fixture.C, B = fixture.B, J = C.loot.journey;
      var coreBefore = fixture.combatBefore, rankBefore = J.person.rank;
      var closedBefore = bytes({ promotionCount:J.promotionCount,
        roleHistory:J.roleHistory, currentBillet:J.currentBillet,
        role:warCareerRole(C), capabilities:warCareerCapabilities(C), projection:warCareerCommandProjection(C) });
      var proof = warCareerParticipationEvidence(C, B), preflight = warCareerPreflightFate(C, B, 'US', 'win');
      var resolved = resolveResult(C, B, 'US', 'win'); J = C.loot.journey;
      var coreAfter = bytes({ bd:B.bd, casualties:B.casualties, infl:B.infl, units:B.units });
      var caps = warCareerCapabilities(C);
      var closedAfter = bytes({ promotionCount:J.promotionCount,
        roleHistory:J.roleHistory, currentBillet:J.currentBillet,
        role:warCareerRole(C), capabilities:caps, projection:warCareerCommandProjection(C) });
      var careerRow = J.career && J.career[J.career.length - 1];
      if (!proof.qualifying || !preflight.qualifying || !resolved || !resolved.qualifying || coreAfter !== coreBefore) throw new Error('v2 consequence changed combat inputs or failed to commit');
      if (closedAfter !== closedBefore || J.person.rank !== rankBefore || J.merit !== 3 || J.reputation !== 2 ||
          resolved.merit !== 3 || resolved.reputation !== 2 || !careerRow || careerRow.promoted || careerRow.rankBefore !== careerRow.rankAfter) throw new Error('v2 consequence award or closed rank/billet authority moved');
      if (B.units.some(function(unit) { return own(unit, 'warCareerAssignment'); }) || C.loot.journey.promotionCount ||
          warCareerCommandProjection(C) !== 0 || caps.localOrders || caps.fieldCommand || caps.nationalDecisions || caps.cabinetMutation || caps.appointmentMutation || caps.resourceMutation) throw new Error('v2 receipt opened command, reward, politics, or combat authority');
      return { qualifying:true, resultCommitted:true, combatBytes:true, commandProjection:0, merit:3, reputation:2, promotionCount:0, roleHistory:J.roleHistory.length, relationships:Object.keys(J.relationships || {}).length, billet:J.currentBillet && J.currentBillet.billetCode, fieldCommand:false };
    });

    step('D406 LEDGER-DERIVED ADVANCEMENT', function() {
      var fixture = d406Fixture({ runId:'run-d406-general-1' }), C = fixture.C, J = C.loot.journey;
      var expectedRanks = ['Major','Lt. Col.','Colonel','Brig. Gen.'];
      var expectedAtResult = ['Captain','Major','Lt. Col.','Colonel'];
      if (J.creditLedger.length !== 4 || J.merit !== 16 || J.reputation !== 12 || J.promotionCount !== 4 || J.person.rank !== 'Brig. Gen.') {
        throw new Error('four-rung totals/rank moved: ' + bytes({ credits:J.creditLedger.length, merit:J.merit, reputation:J.reputation, promotions:J.promotionCount, rank:J.person.rank }));
      }
      for (var i = 0; i < fixture.stages.length; i++) {
        var stage = fixture.stages[i], credit = J.creditLedger[i];
        var event = J.events.filter(function(row) { return row.eventId === credit.eventId; })[0];
        if (!stage.resolved.qualifying || stage.resolved.fate !== 'alive' || stage.resolved.merit !== 4 || stage.resolved.reputation !== 3 ||
            stage.rank !== expectedRanks[i] || !credit || credit.merit !== 4 || credit.reputation !== 3 || !event || event.merit !== 4 || event.reputation !== 3 ||
            credit.participation.rankAtResult !== expectedAtResult[i]) throw new Error('rung ' + i + ' advancement mismatch: ' + bytes(stage));
        if (i && _wcRankOrdinal(stage.rank) - _wcRankOrdinal(fixture.stages[i - 1].rank) !== 1) throw new Error('one receipt crossed more than one legal rank at rung ' + i);
      }
      var canonicalAfter = _wcSourceRefFromPerson(exactPerson(C, fixture.pid));
      if (bytes(canonicalAfter) !== bytes(fixture.sourceBefore) || canonicalAfter.sourceGrade !== 'Captain' || J.person.ovr !== fixture.sourceOvr) throw new Error('alternate promotion rewrote source grade or OVR');
      var frozen = bytes({ credits:J.creditLedger, events:J.events, merit:J.merit, reputation:J.reputation,
        promotionCount:J.promotionCount, rank:J.person.rank, roleHistory:J.roleHistory, currentBillet:J.currentBillet, status:J.status });
      C.idx = 16;
      var retry = resolveResult(C, clone(fixture.stages[3].B), 'CS', 'decisive'); J = C.loot.journey;
      if (!retry.duplicate || bytes({ credits:J.creditLedger, events:J.events, merit:J.merit, reputation:J.reputation,
          promotionCount:J.promotionCount, rank:J.person.rank, roleHistory:J.roleHistory, currentBillet:J.currentBillet, status:J.status }) !== frozen) {
        throw new Error('same-rung retry stacked or rewrote D406 authority');
      }
      return { merit:J.merit, reputation:J.reputation, promotions:J.promotionCount, rank:J.person.rank,
        sourceGrade:canonicalAfter.sourceGrade, sourceOvr:fixture.sourceOvr, retryNoStack:true };
    });

    step('D406 REACHABLE FIELD + GENERAL COMMAND', function() {
      var fixture = d406Fixture({ runId:'run-d406-general-1' }), C = fixture.C, J = C.loot.journey;
      if (fixture.initial.role.id !== 'junior-command' || fixture.initial.projection !== 0 || fixture.initial.history.length !== 1 ||
          !fixture.initial.billet || fixture.initial.billet.billetCode !== 'company-officer') throw new Error('Captain initial billet/role moved');
      var roles = ['field-command','field-command','field-command','general-command'];
      var projections = [1,2,2,4];
      for (var i = 0; i < fixture.stages.length; i++) {
        if (fixture.stages[i].role.id !== roles[i] || fixture.stages[i].projection !== projections[i] || !fixture.stages[i].caps.fieldCommand) {
          throw new Error('field/general role or projection moved at rung ' + i + ': ' + bytes(fixture.stages[i]));
        }
      }
      var expectedKeys = _WC_BILLET_KEYS.slice();
      if (J.roleHistory.length !== 5 || bytes(J.currentBillet) !== bytes(J.roleHistory[4])) throw new Error('bounded billet history/current projection moved');
      for (var hi = 0; hi < J.roleHistory.length; hi++) {
        var row = J.roleHistory[hi];
        if (bytes(Object.keys(row)) !== bytes(expectedKeys) || !_wcBilletValid(row) || row.ordinal !== hi + 1 ||
            row.provenance !== 'Inferred' || row.timelineLabel !== 'Your Timeline' ||
            row.authority !== (hi ? 'qualifying-credit' : 'career-start')) throw new Error('billet schema/sequence moved at ' + hi + ': ' + bytes(row));
        if (hi) {
          var owner = J.creditLedger[hi - 1];
          if (row.creditKey !== owner.creditKey || row.eventId !== owner.eventId || row.personId !== J.personId) throw new Error('billet lost receipt ownership at ' + hi);
        }
      }
      var assignments = fixture.stages.slice(1).map(function(stage) { return stage.credit.participation.timelineAssignmentRef.assignmentId; });
      if (bytes(assignments) !== bytes(['wcta-144pyv4','wcta-11pxx98','wcta-9be2qw'])) throw new Error('exact progression assignments moved: ' + bytes(assignments));
      var strategic = warCareerStrategicGeneral(C);
      if (!strategic || strategic.schema !== 'cw_war_career_strategic_general_v1' || strategic.personId !== J.personId ||
          strategic.side !== 'US' || strategic.rank !== 'Brig. Gen.' || strategic.roleId !== 'general-command' ||
          strategic.billetId !== J.currentBillet.billetId || strategic.provenance !== 'Inferred' || strategic.timelineLabel !== 'Your Timeline') {
        throw new Error('strategic-general identity adapter moved: ' + bytes(strategic));
      }
      var before = bytes(C), readsOne = bytes({ role:warCareerRole(C), caps:warCareerCapabilities(C), projection:warCareerCommandProjection(C), strategic:warCareerStrategicGeneral(C) });
      var readsTwo = bytes({ role:warCareerRole(C), caps:warCareerCapabilities(C), projection:warCareerCommandProjection(C), strategic:warCareerStrategicGeneral(C) });
      if (bytes(C) !== before || readsOne !== readsTwo) throw new Error('role/capability/projection/general selectors mutate or drift');
      return { path:roles, projections:projections, billets:J.roleHistory.length, strategicId:strategic.id, pure:true };
    });

    step('D406 BILLET SANITATION + ZERO MATRIX', function() {
      var fixture = d406Fixture({ runId:'run-d406-general-1' }), clean = clone(fixture.C);
      G.campaign = clean; warCareerInit(clean);
      var canonicalJourney = bytes(clean.loot.journey), forged = clone(clean), F = forged.loot.journey;
      F.merit = 127; F.reputation = 95; F.promotionCount = 23; F.person.rank = 'General';
      F.roleHistory = [{ schema:'forged', personId:F.personId }]; F.currentBillet = { forged:true };
      F.strategicGeneral = { personId:F.personId, projection:99 };
      G.campaign = forged; warCareerInit(forged);
      if (bytes(forged.loot.journey) !== canonicalJourney) throw new Error('eager sanitation did not reconstruct saved totals/rank/billet authority');
      var once = bytes(forged); warCareerInit(forged);
      if (bytes(forged) !== once) throw new Error('second D406 sanitation pass changed bytes');
      applySave(envelope(forged, 'd406-sanitize')); warCareerInit(G.campaign);
      if (bytes(G.campaign.loot.journey) !== canonicalJourney) throw new Error('save/apply/init changed reconstructed D406 bytes');
      var base = clone(clean), rejected = [];
      function zero(label, mutate) {
        var X = clone(base); mutate(X, X.loot.journey); G.campaign = X;
        var before = bytes(X), role = warCareerRole(X), caps = warCareerCapabilities(X);
        var projection = warCareerCommandProjection(X), general = warCareerStrategicGeneral(X);
        if (projection !== 0 || general !== null || caps.fieldCommand || role.id !== 'unavailable' && role.id !== 'legacy-or-inactive' || bytes(X) !== before) {
          throw new Error(label + ' did not fail closed/pure: ' + bytes({ role:role, caps:caps, projection:projection, general:general }));
        }
        rejected.push(label);
      }
      ['wounded','captured','fallen','retired','war-ended'].forEach(function(status) { zero(status, function(X, J) { J.status = status; }); });
      zero('service-ended', function(X) { X.idx = 18; });
      zero('malformed-billet', function(X, J) { J.currentBillet.billetId = 'wcb-forged'; });
      zero('billet-less', function(X, J) { J.currentBillet = null; });
      zero('wrong-billet-person', function(X, J) { J.currentBillet.personId = J.personId + ':foreign'; });
      zero('wrong-billet-rank', function(X, J) { J.currentBillet.rank = 'Captain'; });
      zero('foreign-owner', function(X, J) { J.creditLedger[J.creditLedger.length - 1].personId = J.personId + ':foreign'; });
      zero('nonqualifying-owner', function(X, J) { J.creditLedger[J.creditLedger.length - 1].qualifying = false; });
      zero('legacy', function(X, J) { delete J.careerVersion; });
      zero('inactive', function(X, J) { J.enabled = false; });
      return { reconstructed:true, secondPass:true, saveRoundtrip:true, rejected:rejected, count:rejected.length };
    });

    step('D406 HANDOFF + NO-STACK ISOLATION', function() {
      var fixture = d406Fixture({ runId:'run-d406-handoff-27', fallenAt:2 }), C = fixture.C, J = C.loot.journey;
      if (J.merit !== 8 || J.reputation !== 6 || J.promotionCount !== 2 || J.person.rank !== 'Lt. Col.' ||
          J.status !== 'fallen' || !J.handoff || J.handoff.state !== 'pending' || !J.handoff.candidateIds.length) {
        throw new Error('pre-handoff D406 state moved: ' + bytes({ merit:J.merit, reputation:J.reputation, promotions:J.promotionCount, rank:J.person.rank, status:J.status, handoff:J.handoff }));
      }
      var selected = J.handoff.candidateIds[0], successor = clone(_wcRegistryPersonUnique(C, selected));
      var creditCount = J.creditLedger.length, eventCount = J.events.length;
      var commandBefore = bytes(C.president && C.president.command || null), accepted = warCareerAcceptHandoff(C, selected); J = C.loot.journey;
      if (!accepted.ok || J.personId !== selected || !successor || J.person.rank !== successor.rank || J.person.ovr !== successor.ovr ||
          J.merit !== 0 || J.reputation !== 0 || J.promotionCount !== 0 || J.roleHistory.length !== 1 ||
          !J.currentBillet || bytes(J.currentBillet) !== bytes(J.roleHistory[0]) || J.currentBillet.authority !== 'career-start' ||
          J.creditLedger.length !== creditCount || J.events.length !== eventCount || warCareerCommandProjection(C) !== 0 || warCareerStrategicGeneral(C) !== null ||
          bytes(C.president && C.president.command || null) !== commandBefore) throw new Error('handoff copied advancement/billet/command authority: ' + bytes({ accepted:accepted, journey:J }));
      if (J.creditLedger.some(function(row) { return row.merit || row.reputation; }) || J.events.some(function(row) { return row.personId !== J.personId && (row.merit || row.reputation); })) {
        throw new Error('fallen identity award copies survived as successor authority');
      }
      var save = envelope(C, 'd406-handoff'); applySave(clone(save)); C = G.campaign; warCareerInit(C); J = C.loot.journey;
      var loaded = bytes(J), repeated = warCareerAcceptHandoff(C, selected);
      if (repeated.ok || bytes(J) !== loaded) throw new Error('repeated handoff mutated successor state');
      C.idx = 15;
      var retry = resolveResult(C, clone(fixture.stages[2].B), 'US', 'decisive'); J = C.loot.journey;
      if (!retry.duplicate || bytes(J) !== loaded) throw new Error('same-rung retry stacked after handoff');
      return { successor:selected, canonicalRank:successor.rank, canonicalOvr:successor.ovr, sharedCredits:creditCount,
        sharedEvents:eventCount, personalTotalsReset:true, oneStartBillet:true, commandOwnerIsolated:true, saveRoundtrip:true, retryNoStack:true };
    });

    step('D411 REACHABILITY + SOURCE-BOUNDED SERVICE', function() {
      var pid = 'person_bullrun_us_2ri_rhodes';
      var C = mkC('US', false); C.idx = 1; C.runId = 'run-us-d410-1';
      var people = ssPersonRegistry(C).people;
      if (people.length !== 1566) throw new Error('Army Register moved: ' + people.length);   // D436: 1512 -> 1566 — Atlanta adds 18 unique side-unit ids x 3 slots
      var boundsCarriers = people.filter(function(p) { return p && (own(p, 'serviceStart') || own(p, 'serviceEnd')); });
      if (boundsCarriers.length !== 1 || boundsCarriers[0].pid !== pid) {
        throw new Error('non-Rhodes bounds movement: ' + bytes(boundsCarriers.map(function(p) { return p.pid; })));
      }
      function nonRhodesBytes(X) {
        var rows = ssPersonRegistry(X).people.filter(function(p) { return p && p.pid !== pid; });
        return bytes(rows);
      }
      var nonRhodesBefore = nonRhodesBytes(C);
      var person = exactPerson(C, pid);
      if (person.serviceStart !== 1861 || person.serviceEnd !== 1865 || own(person, 'serviceYear') ||
          person.rank !== 'Private' || person.provenance !== 'Verified' || person.generated) {
        throw new Error('Rhodes source-bounded law moved: ' + bytes({ start:person.serviceStart, end:person.serviceEnd,
          pinned:own(person, 'serviceYear'), rank:person.rank, provenance:person.provenance }));
      }
      var endBound = (person.sources || []).filter(function(row) {
        return row && row.title === 'All for the Union: The Civil War Diary and Letters of Elisha Hunt Rhodes';
      });
      if (endBound.length !== 1 || endBound[0].locator !== 'ISBN 0-679-73828-2' || endBound[0].type !== 'primary' ||
          endBound[0].author !== 'Elisha Hunt Rhodes; Robert Hunt Rhodes, ed.') {
        throw new Error('All for the Union end-bound source row law moved: ' + bytes(endBound));
      }
      var cleanWith = function(mutate) {
        var pack = clone(_ssReplacementData());
        var record = pack.records.filter(function(row) { return row && row.pid === pid; })[0];
        mutate(record);
        var validated = ssValidateSoldierReplacementPack(pack, {});
        if (!validated.ok) return { ok:false, errors:validated.errors.slice(0, 3) };
        var out = validated.records.filter(function(row) { return row && row.pid === pid; })[0];
        return { ok:true, start:own(out, 'serviceStart') ? out.serviceStart : null, end:own(out, 'serviceEnd') ? out.serviceEnd : null };
      };
      var carried = cleanWith(function() {});
      if (!carried.ok || carried.start !== 1861 || carried.end !== 1865) throw new Error('valid bounds pair did not carry: ' + bytes(carried));
      [
        ['start > end', function(row) { row.serviceStart = 1865; row.serviceEnd = 1861; }],
        ['half a pair', function(row) { delete row.serviceEnd; }],
        ['non-integer', function(row) { row.serviceStart = 1861.5; }],
        ['below 1800', function(row) { row.serviceStart = 1799; }],
        ['above 1900', function(row) { row.serviceEnd = 1901; }],
        ['year outside pair', function(row) { row.serviceStart = 1862; }]
      ].forEach(function(caseRow) {
        var dropped = cleanWith(caseRow[1]);
        if (!dropped.ok || dropped.start !== null || dropped.end !== null) {
          throw new Error('malformed bounds (' + caseRow[0] + ') did not drop to single-year law: ' + bytes(dropped));
        }
      });
      var sourceBefore = clone(_wcSourceRefFromPerson(person)), sourceOvr = person.ovr;
      if (sourceBefore.serviceStart !== 1861 || sourceBefore.serviceEnd !== 1865 || sourceBefore.serviceYear !== null) {
        throw new Error('Rhodes sourceRef window law moved: ' + bytes(sourceBefore));
      }
      var started = warCareerStart(C, pid);
      if (!started.ok || C.loot.journey.person.rank !== 'Private') throw new Error('Rhodes career start failed: ' + bytes(started));
      var rungs = [
        { index:1, scenarioId:'bullrun1', unitId:'us_burnside', slot:'pvt', assignmentId:null },
        { index:9, scenarioId:'antietam', unitId:'us_french', slot:'nco', assignmentId:'wcta-fa53w4' },
        { index:14, scenarioId:'vicksburg', unitId:'us_deg_battery', slot:'cmd', assignmentId:'wcta-inib47' },
        { index:15, scenarioId:'gettysburg', unitId:'us_hall_battery', slot:'cmd', assignmentId:'wcta-154xy3w' },
        { index:16, scenarioId:'chickamauga', unitId:'us_lilly_battery', slot:'cmd', assignmentId:'wcta-azt21w' },
        { index:17, scenarioId:'chattanooga', unitId:'us_hazen_mr', slot:'cmd', assignmentId:'wcta-7u1ul0' },
        { index:27, scenarioId:'nashville', unitId:'us_r_battery', slot:'cmd', assignmentId:'wcta-9cpe74' }
      ];
      var expectedRolls = [196, 204, 264, 380, 855, 688, 736];
      var expectedRanks = ['Sergeant', 'Captain', 'Major', 'Lt. Col.', 'Colonel', 'Brig. Gen.', 'Brig. Gen.'];
      var expectedAtResult = ['Private', 'Sergeant', 'Captain', 'Major', 'Lt. Col.', 'Colonel', 'Brig. Gen.'];
      var expectedYears = [1861, 1862, 1863, 1863, 1863, 1863, 1864];
      for (var i = 0; i < rungs.length; i++) {
        var rung = rungs[i];
        C.idx = rung.index;
        var creditKey = [C.runId, 'US', rung.index, rung.scenarioId].join('|');
        var slotPid = ['ss', rung.scenarioId, 'US', rung.unitId, rung.slot].join(':');
        var roll = _wcHash([C.runId, creditKey, pid, slotPid, 'personal-fate'].join('|')) % 1000;
        if (roll !== expectedRolls[i]) throw new Error(rung.scenarioId + ' fate roll drifted: ' + roll);
        var B = mkB(C, true);
        B.warCareerEvidence = warCareerBuildClassicEvidence(C, B);
        if (!B.warCareerEvidence) throw new Error('evidence missing at ' + rung.scenarioId);
        var proof = warCareerParticipationEvidence(C, B), preflight = warCareerPreflightFate(C, B, 'US', 'decisive');
        if (!proof.qualifying || !preflight.qualifying || preflight.fate !== 'alive') {
          throw new Error(rung.scenarioId + ' preflight not qualifying/alive: ' + bytes({ proof:proof, preflight:preflight }));
        }
        var resolved = resolveResult(C, B, 'US', 'decisive'), J = C.loot.journey, credit = latestCredit(C);
        if (!resolved || !resolved.qualifying || resolved.fate !== 'alive' || J.person.rank !== expectedRanks[i] ||
            !credit || credit.scenarioId !== rung.scenarioId || credit.participation.rankAtResult !== expectedAtResult[i] ||
            Number(credit.participation.battleYear) !== expectedYears[i]) {
          throw new Error(rung.scenarioId + ' rung outcome moved: ' + bytes({ resolved:resolved, rank:J.person.rank, credit:credit }));
        }
        var assignment = credit.participation.timelineAssignmentRef;
        if (rung.assignmentId ? (!assignment || assignment.assignmentId !== rung.assignmentId || assignment.slotPid !== slotPid) : !!assignment) {
          throw new Error(rung.scenarioId + ' assignment identity moved: ' + bytes(assignment || null));
        }
      }
      var J = C.loot.journey;
      if (J.creditLedger.length !== 7 || J.merit !== 28 || J.reputation !== 21 || J.promotionCount !== 6 || J.person.rank !== 'Brig. Gen.') {
        throw new Error('seven-rung totals moved: ' + bytes({ credits:J.creditLedger.length, merit:J.merit,
          reputation:J.reputation, promotions:J.promotionCount, rank:J.person.rank }));
      }
      var role = warCareerRole(C), latest = latestCredit(C);
      if (role.id !== 'general-command' || latest.scenarioId !== 'nashville' || Number(latest.participation.battleYear) !== 1864) {
        throw new Error('the D408 unlock pair did not coexist: ' + bytes({ role:role.id, latest:latest.scenarioId,
          battleYear:latest.participation.battleYear }));
      }
      var canonicalAfter = _wcSourceRefFromPerson(exactPerson(C, pid));
      if (bytes(canonicalAfter) !== bytes(sourceBefore) || canonicalAfter.sourceGrade !== 'Private' ||
          exactPerson(C, pid).ovr !== sourceOvr) {
        throw new Error('reachability run rewrote canonical Rhodes source state');
      }
      var frozen = bytes(J);
      G.campaign = C; warCareerInit(C); J = C.loot.journey;
      if (bytes(J) !== frozen) throw new Error('sanitation not byte-idempotent after the ladder: ' + firstDiff(JSON.parse(frozen), J));
      applySave(envelope(C, 'd411-reachability')); warCareerInit(G.campaign);
      var loadedJourney = G.campaign.loot.journey;
      if (bytes(loadedJourney) !== frozen || loadedJourney.person.rank !== 'Brig. Gen.' ||
          warCareerRole(G.campaign).id !== 'general-command') {
        throw new Error('save/apply/init lost the reachability state');
      }
      // Zero non-Rhodes movement: a fresh campaign at the same fresh clock re-derives
      // the identical canonical registry — the ladder run mutated no canonical person.
      var freshAfter = mkC('US', false); freshAfter.idx = 1;
      if (nonRhodesBytes(freshAfter) !== nonRhodesBefore) {
        throw new Error('non-Rhodes registry people moved across the reachability run');
      }
      return { runId:C.runId, rolls:expectedRolls, merit:28, reputation:21, promotions:6, rank:'Brig. Gen.',
        role:role.id, latestScenario:'nashville', latestBattleYear:1864, register:1566, boundsCarriers:1,
        malformedDropped:6, sourceImmutable:true, nonRhodesFrozen:true, idempotent:true, saveRoundtrip:true };
    });

    step('D408 MATTERS OF STATE + VISIBLE DEFER', function() {
      var LOCK_RX = /aria-disabled="true"|data-dec-locked="1"|data-dec-defer="1"|decLock_/;
      function pend(X) { return (X.president.pendingChoices || []).slice(); }
      function surface(X, year) {
        decInit(X); X.president.date.year = year; X.president.date.month = 6;
        decOnResolve(X.side, 'win', { bd:{ year:year } }, X, true);
        return pend(X);
      }
      function counts(html) {
        return {
          decide:(html.match(/id="decChoose_/g) || []).length,
          disabled:(html.match(/aria-disabled="true"/g) || []).length,
          described:(html.match(/aria-describedby="decLock_/g) || []).length,
          notes:(html.match(/data-dec-defer="1"/g) || []).length
        };
      }
      function decideCount(X) {
        var total = 0;
        pend(X).forEach(function(id) { var c = _decById(id); if (c && Array.isArray(c.options)) total += c.options.length; });
        return total;
      }
      function titlesPresent(X, html) {
        return pend(X).every(function(id) { var c = _decById(id); return c && html.indexOf(_decEsc(c.title)) >= 0; });
      }
      function effectsState(X) {
        return bytes({ capital:X.clock && X.clock.capital, weariness:X.clock && X.clock.weariness,
          intervention:X.clock && X.clock.intervention, importFactor:X.blockade && X.blockade.importFactor,
          strength:X.manpower && X.manpower.strength, resolved:X.president.decisionsResolved,
          emancipation:X.president.emancipation, pending:X.president.pendingChoices });
      }
      // (0) The bind token and both surfaces' routing survive UNEDITED in the built game:
      // Desk (openWarDept/_wdRefresh/H0_DESK_TABS) and between-battle (h0iDecisions/legacy
      // interstitial) still converge on the guarded decRenderTab/decInterstitialHTML seam.
      var src = Array.prototype.map.call(document.scripts, function(s) { return s.textContent || ''; }).join(' ');
      ['WAR_CAREER_POLITICAL_DATE_BIND:QUALIFYING_RECEIPT_YEAR_1864_OR_LATER',
       'function openWarDept()', '_wdTab === "decisions"', 'decRenderTab(C)', 'decWireInterstitial',
       'H0_DESK_TABS', '["decisions", "Decisions"]', 'h0iDecisions(C)', 'decInterstitialHTML(C)'
      ].forEach(function(token) {
        if (src.indexOf(token) < 0) throw new Error('routing/bind anchor missing from the built game: ' + token);
      });
      // (1) LEGACY / NO-CAREER BYPASS: zero lock artifacts, shipped resolve behavior.
      var L = mkC('US', false);
      var accessL = warCareerDecisionAccess(L);
      if (accessL.career !== false || accessL.unlocked !== true || accessL.missingDate || accessL.missingAuthority) {
        throw new Error('legacy access law moved: ' + bytes(accessL));
      }
      surface(L, 1864);
      if (!pend(L).length) throw new Error('no pending 1864 matters for the legacy control');
      var legacyTab = decRenderTab(L), legacyInt = decInterstitialHTML(L);
      if (LOCK_RX.test(legacyTab + legacyInt)) throw new Error('legacy render carries D408 lock artifacts');
      if (!titlesPresent(L, legacyTab)) throw new Error('legacy tab lost a pending card');
      var legacyCard = _decById(pend(L)[0]), legacyOpt = legacyCard.options[0];
      decResolve(L, legacyCard.id, legacyOpt.id);
      if (L.president.decisionsResolved[legacyCard.id] !== legacyOpt.id || pend(L).indexOf(legacyCard.id) >= 0) {
        throw new Error('legacy direct decResolve stopped applying');
      }
      // (2) Fresh Rhodes career: BOTH prerequisites missing; reads stay pure.
      var pid = 'person_bullrun_us_2ri_rhodes';
      var C = mkC('US', false); C.idx = 1; C.runId = 'run-us-d410-1';
      if (!warCareerStart(C, pid).ok) throw new Error('Rhodes career start failed');
      var a0 = warCareerDecisionAccess(C);
      if (!(a0.career === true && a0.unlocked === false && a0.missingDate === true && a0.missingAuthority === true &&
            a0.requiredYear === 1864 && a0.latestQualifyingYear === null)) {
        throw new Error('fresh-career access law moved: ' + bytes(a0));
      }
      surface(C, 1862);
      var bothTab = decRenderTab(C);
      if (bothTab.indexOf('both earned General Command authority and a qualifying participation receipt from 1864 or later') < 0) {
        throw new Error('both-missing defer copy moved');
      }
      var pureBefore = bytes(C);
      warCareerDecisionAccess(C); warCareerCapabilities(C); decRenderTab(C); decInterstitialHTML(C);
      if (bytes(C) !== pureBefore) throw new Error('access/render reads mutated the campaign');
      // (3) Rungs 1-6 -> reconstructed General Command with latest receipt 1863: DATE-ONLY missing.
      var rungs = [
        { index:1, scenarioId:'bullrun1' }, { index:9, scenarioId:'antietam' },
        { index:14, scenarioId:'vicksburg' }, { index:15, scenarioId:'gettysburg' },
        { index:16, scenarioId:'chickamauga' }, { index:17, scenarioId:'chattanooga' }
      ];
      for (var i = 0; i < rungs.length; i++) {
        C.idx = rungs[i].index;
        var B = mkB(C, true);
        B.warCareerEvidence = warCareerBuildClassicEvidence(C, B);
        if (!B.warCareerEvidence) throw new Error('evidence missing at ' + rungs[i].scenarioId);
        var resolved = resolveResult(C, B, 'US', 'decisive');
        if (!resolved || !resolved.qualifying || resolved.fate !== 'alive') {
          throw new Error(rungs[i].scenarioId + ' rung did not qualify: ' + bytes(resolved));
        }
      }
      if (C.loot.journey.person.rank !== 'Brig. Gen.' || warCareerRole(C).id !== 'general-command') {
        throw new Error('rungs 1-6 did not reconstruct General Command');
      }
      var a6 = warCareerDecisionAccess(C);
      if (!(a6.career && a6.unlocked === false && a6.missingDate === true && a6.missingAuthority === false &&
            a6.latestQualifyingYear === 1863)) throw new Error('date-only access law moved: ' + bytes(a6));
      var caps6 = warCareerCapabilities(C);
      if (caps6.nationalDecisions !== false || caps6.cabinetMutation || caps6.appointmentMutation || caps6.resourceMutation) {
        throw new Error('locked capability law moved: ' + bytes(caps6));
      }
      // The live clock never grants; decOnResolve keeps the queue current while locked.
      surface(C, 1864);
      if (!pend(C).length || pend(C).indexOf('us-press-censorship') < 0) {
        throw new Error('the 1864-window card did not surface while locked: ' + bytes(pend(C)));
      }
      var a6clock = warCareerDecisionAccess(C);
      if (a6clock.unlocked !== false || a6clock.missingDate !== true) throw new Error('the live 1864 clock granted date authority');
      surface(C, 1865);
      if (pend(C).indexOf('us-press-censorship') >= 0) throw new Error('decOnResolve stopped expiring while locked');
      surface(C, 1864);
      if (pend(C).indexOf('us-press-censorship') < 0) throw new Error('decOnResolve stopped enqueueing while locked');
      // Visible defer on BOTH surfaces: readable cards, focusable aria-disabled Decide
      // controls, one describing defer note per card, the date named — not authority.
      var tab6 = decRenderTab(C), int6 = decInterstitialHTML(C);
      var ct = counts(tab6), ci = counts(int6), decides = decideCount(C), cards6 = pend(C).length;
      if (ct.decide !== decides || ct.disabled !== decides || ct.described !== decides || ct.notes !== cards6) {
        throw new Error('tab defer marks moved: ' + bytes({ marks:ct, decides:decides, cards:cards6 }));
      }
      if (ci.decide !== decides || ci.disabled !== decides || ci.described !== decides || ci.notes !== cards6) {
        throw new Error('interstitial defer marks moved: ' + bytes({ marks:ci, decides:decides, cards:cards6 }));
      }
      if (!titlesPresent(C, tab6) || !titlesPresent(C, int6)) throw new Error('a locked card stopped rendering');
      if (tab6.indexOf('your latest qualifying receipt is from 1863') < 0 ||
          int6.indexOf('your latest qualifying receipt is from 1863') < 0) throw new Error('date-only defer copy moved');
      if (tab6.indexOf('earned General Command authority reconstructed') >= 0) throw new Error('date-only defer wrongly names authority');
      var sampleCard = _decById(pend(C)[0]);
      if (tab6.indexOf('decWhyBox_tab_') < 0 || tab6.indexOf(_decEsc(sampleCard.situation)) < 0) {
        throw new Error('teaching/situation stopped rendering while locked');
      }
      // (4) Live DOM: the activation guard refuses, explains, and mutates nothing;
      // the direct mutator refuses before _decApply; forged state never grants.
      var host = document.createElement('div'); host.id = 'd408ProbeHost';
      document.body.appendChild(host);
      try {
        host.innerHTML = tab6 + int6;
        G.campaign = C;
        var fired = 0;
        _decWireCards(C, 'tab', pend(C), function() { fired++; });
        _decWireCards(C, 'int', pend(C), function() { fired++; });
        var lockedState = effectsState(C);
        var firstCard = _decById(pend(C)[0]), firstOpt = firstCard.options[0];
        var btn = document.getElementById('decChoose_tab_' + _decIdSafe(firstCard.id) + '_' + _decIdSafe(firstOpt.id));
        if (!btn) throw new Error('locked Decide button missing from the DOM');
        if (btn.getAttribute('aria-disabled') !== 'true' || btn.disabled) {
          throw new Error('locked Decide is not a focusable aria-disabled native button');
        }
        btn.focus();
        if (document.activeElement !== btn) throw new Error('locked Decide button is not keyboard focusable');
        btn.click();
        var note = document.getElementById('decLock_tab_' + _decIdSafe(firstCard.id));
        if (!note) throw new Error('the defer explanation note is missing');
        if (document.activeElement !== note) throw new Error('the activation guard did not move focus to the defer explanation');
        var btnInt = document.getElementById('decChoose_int_' + _decIdSafe(firstCard.id) + '_' + _decIdSafe(firstOpt.id));
        if (!btnInt) throw new Error('locked interstitial Decide button missing from the DOM');
        btnInt.click();
        if (fired !== 0) throw new Error('afterChoose fired while locked');
        if (effectsState(C) !== lockedState) throw new Error('a locked activation mutated state');
        decResolve(C, firstCard.id, firstOpt.id);
        if (effectsState(C) !== lockedState) throw new Error('direct decResolve applied while locked');
        var env6 = envelope(C, 'd408-locked');
        C.loot.journey.person.rank = 'Maj. Gen.';
        C.loot.journey.promotionCount = 9;
        C.president.politicalUnlocked = true;
        C.loot.journey.politicalAccess = { unlocked:true };
        if (warCareerDecisionAccess(C).unlocked !== false) throw new Error('forged rank/scalars/booleans granted authority');
        applySave(env6); warCareerInit(G.campaign); C = G.campaign;
        var aRestored = warCareerDecisionAccess(C);
        if (!(aRestored.career && aRestored.unlocked === false && aRestored.missingDate && !aRestored.missingAuthority)) {
          throw new Error('the locked state did not survive save/apply/init: ' + bytes(aRestored));
        }
        // (5) AUTHORITY-ONLY missing: a nashville private earns an 1864 receipt at Sergeant.
        var A = mkC('US', false); A.idx = 27;
        var ap = currentPerson(A, 'Private');
        if (!ap) throw new Error('no nashville Private for the authority-only case');
        var aRun = null;
        for (var ri = 0; ri < 200 && !aRun; ri++) {
          var cand = 'run-d408-auth-' + ri;
          var key = [cand, 'US', 27, 'nashville'].join('|');
          if (_wcHash([cand, key, ap.pid, ap.unitRef.slotPid, 'personal-fate'].join('|')) % 1000 >= 100) aRun = cand;
        }
        if (!aRun) throw new Error('no deterministic alive run id for the authority-only case');
        A.runId = aRun;
        if (!warCareerStart(A, ap.pid).ok) throw new Error('nashville career start failed');
        var AB = mkB(A, true);
        AB.warCareerEvidence = warCareerBuildClassicEvidence(A, AB);
        if (!AB.warCareerEvidence) throw new Error('nashville own-source evidence missing');
        var aResolved = resolveResult(A, AB, 'US', 'decisive');
        if (!aResolved || !aResolved.qualifying || aResolved.fate !== 'alive') {
          throw new Error('the nashville rung did not qualify: ' + bytes(aResolved));
        }
        var aa = warCareerDecisionAccess(A);
        if (!(aa.career && aa.unlocked === false && aa.missingDate === false && aa.missingAuthority === true &&
              aa.latestQualifyingYear === 1864)) throw new Error('authority-only access law moved: ' + bytes(aa));
        surface(A, 1864);
        var tabA = decRenderTab(A);
        if (tabA.indexOf('earned General Command authority reconstructed from your receipts') < 0) {
          throw new Error('authority-only defer copy moved');
        }
        if (tabA.indexOf('participation receipt from 1864 or later') >= 0) {
          throw new Error('authority-only defer wrongly names the date');
        }
        // (6) UNLOCK: rung 7 completes the D408 pair; shipped choice/effect behavior returns.
        C.idx = 27;
        var B7 = mkB(C, true);
        B7.warCareerEvidence = warCareerBuildClassicEvidence(C, B7);
        if (!B7.warCareerEvidence) throw new Error('rung-7 evidence missing');
        var r7 = resolveResult(C, B7, 'US', 'decisive');
        if (!r7 || !r7.qualifying || r7.fate !== 'alive') throw new Error('rung 7 did not commit');
        var a7 = warCareerDecisionAccess(C);
        if (!(a7.career && a7.unlocked === true && a7.missingDate === false && a7.missingAuthority === false &&
              a7.latestQualifyingYear === 1864)) throw new Error('the D408 unlock pair did not open: ' + bytes(a7));
        var caps7 = warCareerCapabilities(C);
        if (caps7.nationalDecisions !== true || caps7.cabinetMutation || caps7.appointmentMutation || caps7.resourceMutation) {
          throw new Error('unlock capability law moved: ' + bytes(caps7));
        }
        surface(C, 1864);
        if (!pend(C).length) throw new Error('no pending matters after unlock');
        var tab7 = decRenderTab(C), int7 = decInterstitialHTML(C);
        if (LOCK_RX.test(tab7 + int7)) throw new Error('unlocked render still carries lock artifacts');
        var env7 = envelope(C, 'd408-unlocked');
        applySave(env7); warCareerInit(G.campaign); C = G.campaign;
        if (warCareerDecisionAccess(C).unlocked !== true) throw new Error('the unlock did not survive save/apply/init');
        ['unlocked', 'missingDate', 'missingAuthority', 'latestQualifyingYear', 'requiredYear'].forEach(function(k) {
          if (own(C.loot.journey, k)) throw new Error('a derived authority field was persisted: ' + k);
        });
        host.innerHTML = decRenderTab(C);
        var fired7 = 0;
        _decWireCards(C, 'tab', pend(C), function() { fired7++; });
        var uCard = _decById(pend(C)[0]), uOpt = uCard.options[0];
        var ubtn = document.getElementById('decChoose_tab_' + _decIdSafe(uCard.id) + '_' + _decIdSafe(uOpt.id));
        if (!ubtn || ubtn.getAttribute('aria-disabled')) throw new Error('unlocked Decide button carries the lock');
        ubtn.click();
        if (fired7 !== 1 || C.president.decisionsResolved[uCard.id] !== uOpt.id || pend(C).indexOf(uCard.id) >= 0) {
          throw new Error('unlocked Decide did not resolve exactly once');
        }
      } finally { if (host.parentNode) host.parentNode.removeChild(host); }
      return { legacyBypass:true, bothMissing:true, dateOnly:{ latest:1863 }, authorityOnly:{ latest:1864 },
        clockNeverGrants:true, queueCurrentWhileLocked:true, deferMarks:{ tab:ct, interstitial:ci },
        activationGuard:'focus-to-explanation', directResolveGuarded:true, forgeryFailsClosed:true,
        unlocked:{ latest:1864, nationalDecisions:true }, saveRoundtrips:2, routingUnedited:true };
    });

    step('D407 RELATIONSHIP TRANSITIONS + ONE-CREDIT', function() {
      var laws = [
        { outcome:'victory', type:'decisive', code:'high-command-decisive-victory', delta:2 },
        { outcome:'victory', type:'win', code:'high-command-victory', delta:1 },
        { outcome:'draw', type:'draw', code:'high-command-draw', delta:0 },
        { outcome:'defeat', type:'win', code:'high-command-defeat', delta:-1 },
        { outcome:'defeat', type:'decisive', code:'high-command-decisive-defeat', delta:-2 }
      ];
      laws.forEach(function(expected) {
        var actual = _wcRelationshipEventLaw(expected.outcome, expected.type);
        if (!actual || actual.code !== expected.code || actual.delta !== expected.delta) throw new Error('D407 event-code law moved: ' + bytes({ expected:expected, actual:actual }));
      });
      var fixture = d407LiveCase('US', 'decisive', 'one-credit'), C = fixture.C, J = fixture.J;
      var pair = fixture.pair, signal = pair.event.relationshipSignal, targetId = fixture.commandTarget;
      if (!targetId || !signal || bytes(signal) !== bytes(pair.credit.relationshipSignal) ||
          signal.actorPersonId !== J.personId || signal.targetId !== targetId ||
          signal.targetNamespace !== 'command-general-v1' || signal.eventCode !== laws[0].code || signal.rapportDelta !== 2) {
        throw new Error('production result did not create one exact matching relationship signal: ' + bytes({ targetId:targetId, signal:signal }));
      }
      var target = _wcRegistryPersonUnique(C, targetId), edgeKey = 'command-general-v1|' + targetId, edge = J.relationships[edgeKey];
      var signalKeys = ['schema','transitionId','actorPersonId','targetId','targetNamespace','eventCode','rapportDelta','origin','timelineLabel','sourceRefs'];
      var edgeKeys = ['schema','targetId','targetNamespace','rapport','rememberedRapport','lastEventId','lastCreditKey','eventHistory','origin','timelineLabel','sourceRefs'];
      var historyKeys = ['transitionId','eventId','creditKey','actorPersonId','eventCode','rapportDelta'];
      if (!target || target.role !== 'army commander' || target.side !== C.side || Object.keys(J.relationships).length !== 1 || !edge ||
          bytes(Object.keys(signal)) !== bytes(signalKeys) || bytes(Object.keys(edge)) !== bytes(edgeKeys) ||
          edge.rapport !== 2 || edge.rememberedRapport !== 0 || edge.eventHistory.length !== 1 ||
          bytes(Object.keys(edge.eventHistory[0])) !== bytes(historyKeys) || edge.lastEventId !== pair.event.eventId ||
          edge.lastCreditKey !== pair.credit.creditKey || J.creditLedger.length !== 1) {
        throw new Error('D407 edge shape/one-credit arithmetic moved: ' + bytes({ edge:edge, credits:J.creditLedger.length }));
      }
      var authorityRejected = [], commandOwnerBytes = bytes(C.president && C.president.command || null);
      function rejectedAuthority(label, invoke) {
        var value = invoke();
        if (value || bytes(C.president && C.president.command || null) !== commandOwnerBytes) throw new Error(label + ' command-target authority leaked');
        authorityRejected.push(label);
      }
      var realActiveId = window.cmdActiveId;
      try {
        window.cmdActiveId = function() { return targetId + '-mismatch'; };
        rejectedAuthority('active-id-mismatch', function() { return warCareerRelationshipSignal(C, J, pair.event); });
      } finally { window.cmdActiveId = realActiveId; }
      var realActiveGeneral = window.cmdActiveGeneral;
      try {
        window.cmdActiveGeneral = function() { return null; };
        rejectedAuthority('missing-active-general', function() { return warCareerRelationshipSignal(C, J, pair.event); });
        window.cmdActiveGeneral = function() { return { id:targetId + '-wrong' }; };
        rejectedAuthority('wrong-active-general', function() { return warCareerRelationshipSignal(C, J, pair.event); });
      } finally { window.cmdActiveGeneral = realActiveGeneral; }
      var realRegistry = window.ssPersonRegistry;
      try {
        window.ssPersonRegistry = function() {
          var reg = clone(realRegistry.apply(this, arguments)), duplicate = clone(target);
          reg.people.push(duplicate); return reg;
        };
        rejectedAuthority('duplicate-registry-target', function() { return warCareerRelationshipSignal(C, J, pair.event); });
        window.ssPersonRegistry = function() {
          var reg = clone(realRegistry.apply(this, arguments));
          reg.people.forEach(function(row) { if (row && row.pid === targetId) row.role = 'corps commander'; });
          return reg;
        };
        rejectedAuthority('wrong-role-target', function() { return warCareerRelationshipSignal(C, J, pair.event); });
      } finally { window.ssPersonRegistry = realRegistry; }
      var before = bytes({ relationships:J.relationships, eventSignal:pair.event.relationshipSignal, creditSignal:pair.credit.relationshipSignal });
      C.idx = pair.credit.chainIndex;
      var retry = resolveResult(C, clone(fixture.B), 'US', 'decisive'); J = C.loot.journey;
      var retryPair = d407Pair(J, fixture.resolved);
      var after = bytes({ relationships:J.relationships, eventSignal:retryPair.event.relationshipSignal, creditSignal:retryPair.credit.relationshipSignal });
      if (!retry.duplicate || before !== after || J.creditLedger.length !== 1) throw new Error('retry duplicated relationship memory');
      return { targetId:targetId, laws:laws.map(function(row) { return row.code + ':' + row.delta; }), rapport:edge.rapport,
        history:edge.eventHistory.length, authorityRejected:authorityRejected, retryNoStack:true };
    });

    step('D407 PROVENANCE + SOURCE HONESTY', function() {
      var fixture = d407LiveCase('US', 'decisive', 'provenance'), C = fixture.C, J = fixture.J, pair = fixture.pair;
      var raw = _wcRelationshipSignalForTarget(C, J, pair.event, fixture.commandTarget);
      if (!raw || raw.origin !== 'emergent-timeline' || raw.timelineLabel !== 'Your Timeline' || !Array.isArray(raw.sourceRefs) || raw.sourceRefs.length) {
        throw new Error('raw D407 producer is not emergent-only: ' + bytes(raw));
      }
      var X = clone(C), XJ = X.loot.journey, XPair = d407Pair(XJ, fixture.resolved), forged = clone(raw);
      forged.origin = 'historical-authored'; forged.timelineLabel = 'Historical'; forged.sourceRefs = [
        { title:'Source A', author:'A', repository:'Archive A', locator:'p. 1', url:'https://example.test/a', type:'book', note:'probe' },
        { title:'Source B', author:'B', repository:'Archive B', locator:'p. 2', url:'https://example.test/b', type:'book', note:'probe' }
      ];
      XPair.event.relationshipSignal = clone(forged); XPair.credit.relationshipSignal = clone(forged); XJ.relationships = { forged:{ rapport:99, origin:'historical-authored' } };
      G.campaign = X; warCareerInit(X); XJ = X.loot.journey; XPair = d407Pair(XJ, fixture.resolved);
      var edge = XJ.relationships['command-general-v1|' + fixture.commandTarget];
      if (!edge || edge.origin !== 'emergent-timeline' || edge.timelineLabel !== 'Your Timeline' || edge.sourceRefs.length ||
          XPair.event.relationshipSignal.origin !== 'emergent-timeline' || XPair.credit.relationshipSignal.origin !== 'emergent-timeline' ||
          XPair.event.relationshipSignal.sourceRefs.length || XPair.credit.relationshipSignal.sourceRefs.length) {
        throw new Error('unsupported historical claim was not normalized to emergent memory: ' + bytes({ edge:edge, event:XPair.event.relationshipSignal }));
      }
      var rejected = [];
      [
        { label:'missing-target', mutate:function(s) { s.targetId = 'missing-command-general'; } },
        { label:'self-target', mutate:function(s) { s.targetId = s.actorPersonId; } },
        { label:'string-delta', mutate:function(s) { s.rapportDelta = String(s.rapportDelta); } }
      ].forEach(function(test) {
        var Y = clone(C), YJ = Y.loot.journey, YPair = d407Pair(YJ, fixture.resolved), bad = clone(raw);
        test.mutate(bad);
        bad.transitionId = _wcRelationshipTransitionId(Y, YPair.event, bad.targetId, bad.eventCode);
        YPair.event.relationshipSignal = clone(bad); YPair.credit.relationshipSignal = clone(bad); YJ.relationships = {};
        G.campaign = Y; warCareerInit(Y); YJ = Y.loot.journey;
        if (Object.keys(YJ.relationships).length || own(d407Pair(YJ, fixture.resolved).event, 'relationshipSignal') || own(d407Pair(YJ, fixture.resolved).credit, 'relationshipSignal')) {
          throw new Error(test.label + ' relationship signal survived sanitation');
        }
        rejected.push(test.label);
      });
      var selfRegistry = window.ssPersonRegistry;
      try {
        window.ssPersonRegistry = function() {
          var reg = clone(selfRegistry.apply(this, arguments));
          reg.people.forEach(function(row) { if (row && row.pid === J.personId) row.role = 'army commander'; });
          return reg;
        };
        if (_wcRelationshipRegistryTarget(C, J.personId, J.personId) !== null) throw new Error('self target survived an otherwise valid army-commander registry row');
      } finally { window.ssPersonRegistry = selfRegistry; }
      return { rawOrigin:raw.origin, persistedOrigin:edge.origin, historicalAuthority:false, sources:edge.sourceRefs.length, rejected:rejected };
    });

    step('D407 SANITATION + BOUNDED DEDUPE', function() {
      var fixture = d406Fixture({ runId:'run-d406-general-1' }), C = fixture.C, J = C.loot.journey;
      d407StripSignals(J);
      var targetId = fixture.stages[0].commandTarget;
      var directC = clone(C), directJ = directC.loot.journey, directCredit = directJ.creditLedger[0];
      var directEvent = directJ.events.filter(function(row) { return row.eventId === directCredit.eventId; })[0];
      var directForged = _wcRelationshipSignalForTarget(directC, directJ, directEvent, targetId);
      directForged.schema = 'forged-signal'; directForged.rapportDelta = 99;
      directEvent.relationshipSignal = clone(directForged); directCredit.relationshipSignal = clone(directForged);
      warCareerRebuildRelationships(directC, directJ);
      if (Object.keys(directJ.relationships).length || own(directEvent, 'relationshipSignal') || own(directCredit, 'relationshipSignal')) {
        throw new Error('public rebuild trusted an unclean forged pair');
      }
      var mismatchC = clone(C), mismatchJ = mismatchC.loot.journey, mismatchCredit = mismatchJ.creditLedger[0];
      var mismatchEvent = mismatchJ.events.filter(function(row) { return row.eventId === mismatchCredit.eventId; })[0];
      var armyTargets = ssPersonRegistry(mismatchC).people.filter(function(row) { return row && row.side === mismatchC.side && row.role === 'army commander' && row.pid !== targetId; });
      var mismatchEventSignal = _wcRelationshipSignalForTarget(mismatchC, mismatchJ, mismatchEvent, targetId);
      var mismatchCreditSignal = armyTargets.length ? _wcRelationshipSignalForTarget(mismatchC, mismatchJ, mismatchEvent, armyTargets[0].pid) : null;
      if (!mismatchEventSignal || !mismatchCreditSignal) throw new Error('independent valid-copy mismatch fixture missing');
      mismatchEvent.relationshipSignal = mismatchEventSignal; mismatchCredit.relationshipSignal = mismatchCreditSignal;
      warCareerRebuildRelationships(mismatchC, mismatchJ);
      if (Object.keys(mismatchJ.relationships).length || own(mismatchEvent, 'relationshipSignal') || own(mismatchCredit, 'relationshipSignal')) {
        throw new Error('mismatched valid event/credit copies created an edge');
      }
      var missingC = clone(C), missingJ = missingC.loot.journey, missingCredit = missingJ.creditLedger[0];
      var missingEvent = missingJ.events.filter(function(row) { return row.eventId === missingCredit.eventId; })[0];
      d407SeedSignal(missingC, missingJ, missingEvent, missingCredit, targetId);
      missingJ.personId = null; missingJ.relationships = { forged:{ rapport:99 } };
      warCareerRebuildRelationships(missingC, missingJ);
      if (Object.keys(missingJ.relationships).length || own(missingEvent, 'relationshipSignal') || own(missingCredit, 'relationshipSignal')) {
        throw new Error('public rebuild retained authority without a current person');
      }
      var duplicateC = clone(C), duplicateJ = duplicateC.loot.journey, duplicateCredit = duplicateJ.creditLedger[0];
      var duplicateEvent = duplicateJ.events.filter(function(row) { return row.eventId === duplicateCredit.eventId; })[0];
      d407SeedSignal(duplicateC, duplicateJ, duplicateEvent, duplicateCredit, targetId);
      duplicateJ.events.push(clone(duplicateEvent)); duplicateJ.creditLedger.push(clone(duplicateCredit));
      duplicateJ.relationships = { forged:{ rapport:99 } };
      warCareerRebuildRelationships(duplicateC, duplicateJ);
      if (Object.keys(duplicateJ.relationships).length ||
          duplicateJ.events.some(function(row) { return own(row, 'relationshipSignal'); }) ||
          duplicateJ.creditLedger.some(function(row) { return own(row, 'relationshipSignal'); })) {
        throw new Error('public rebuild retained authority across duplicate event/credit identifiers');
      }
      for (var i = 0; i < J.creditLedger.length; i++) {
        var credit = J.creditLedger[i], event = J.events.filter(function(row) { return row.eventId === credit.eventId; })[0];
        d407SeedSignal(C, J, event, credit, targetId);
        event.relationshipSignal.unknown = 'strip'; credit.relationshipSignal.unknown = 'strip';
      }
      J.relationships = { forged:{ schema:'forged', rapport:999, rememberedRapport:-999, aliasUnderCommand:true } };
      G.campaign = C; warCareerInit(C); J = C.loot.journey;
      var key = 'command-general-v1|' + targetId, edge = J.relationships[key];
      var exactSignalKeys = ['schema','transitionId','actorPersonId','targetId','targetNamespace','eventCode','rapportDelta','origin','timelineLabel','sourceRefs'];
      if (Object.keys(J.relationships).length !== 1 || !edge || edge.rapport !== 8 || edge.rememberedRapport !== 0 ||
          edge.eventHistory.length !== 4 || J.events.some(function(row) { return row.relationshipSignal && bytes(Object.keys(row.relationshipSignal)) !== bytes(exactSignalKeys); }) ||
          J.creditLedger.some(function(row) { return row.relationshipSignal && bytes(Object.keys(row.relationshipSignal)) !== bytes(exactSignalKeys); })) {
        throw new Error('D407 sanitation did not rebuild exact bounded authority: ' + bytes(edge));
      }
      var canonicalJourney = bytes(J), once = bytes(C); warCareerInit(C);
      if (bytes(C) !== once) throw new Error('second D407 sanitation pass changed bytes');
      applySave(envelope(C, 'd407-sanitize')); warCareerInit(G.campaign);
      if (bytes(G.campaign.loot.journey) !== canonicalJourney) throw new Error('D407 save/apply/init changed reconstructed bytes');

      function syntheticTransition(target, index, delta, code, ordinal) {
        return { ordinal:ordinal == null ? index + 1 : ordinal, eventId:'probe-event-' + index,
          creditKey:'probe-credit-' + index, signal:{ transitionId:'probe-transition-' + index,
            actorPersonId:'probe-actor', targetId:target, targetNamespace:'command-general-v1',
            eventCode:code, rapportDelta:delta } };
      }
      var capTransitions = [];
      for (var cap = 0; cap < 25; cap++) capTransitions.push(syntheticTransition('probe-' + String(cap).padStart(2, '0'), cap, 1, 'high-command-victory', 1));
      var capJ = { personId:'probe-actor', lineage:[], relationships:{} };
      _wcRelationshipReduce(capTransitions, capJ);
      var capKeys = Object.keys(capJ.relationships), expectedCapKeys = [];
      for (var ek = 0; ek < 24; ek++) expectedCapKeys.push('command-general-v1|probe-' + String(ek).padStart(2, '0'));
      if (bytes(capKeys) !== bytes(expectedCapKeys)) throw new Error('24-edge lexical eviction moved: ' + bytes(capKeys));
      var recencyTransitions = [];
      for (var rc = 0; rc < 25; rc++) recencyTransitions.push(syntheticTransition('recent-' + String(rc).padStart(2, '0'), 400 + rc, 1, 'high-command-victory', rc === 0 ? 1 : 100 + rc));
      var recencyJ = { personId:'probe-actor', lineage:[], relationships:{} };
      _wcRelationshipReduce(recencyTransitions, recencyJ);
      var recencyKeys = Object.keys(recencyJ.relationships);
      if (recencyKeys.length !== 24 || recencyKeys.indexOf('command-general-v1|recent-00') >= 0 || recencyKeys.indexOf('command-general-v1|recent-24') < 0) {
        throw new Error('24-edge recency eviction moved: ' + bytes(recencyKeys));
      }
      var historyTransitions = [], negativeTransitions = [];
      for (var hi = 0; hi < 5; hi++) {
        historyTransitions.push(syntheticTransition('history-target', 100 + hi, 2, 'high-command-decisive-victory', hi + 1));
        negativeTransitions.push(syntheticTransition('negative-target', 200 + hi, -2, 'high-command-decisive-defeat', hi + 1));
      }
      var historyJ = { personId:'probe-actor', lineage:[], relationships:{} }, negativeJ = { personId:'probe-actor', lineage:[], relationships:{} };
      _wcRelationshipReduce(historyTransitions, historyJ); _wcRelationshipReduce(negativeTransitions, negativeJ);
      var historyEdge = historyJ.relationships['command-general-v1|history-target'];
      var negativeEdge = negativeJ.relationships['command-general-v1|negative-target'];
      if (!historyEdge || historyEdge.rapport !== 8 || historyEdge.eventHistory.length !== 4 || historyEdge.eventHistory[0].transitionId !== 'probe-transition-101' ||
          !negativeEdge || negativeEdge.rapport !== -8 || negativeEdge.eventHistory.length !== 4) throw new Error('rapport/history clamp moved');
      if (_wcRelationshipReduce.toString().indexOf('localeCompare') >= 0 || _wcLex('A', 'a') !== -1 || _wcLex('a', 'A') !== 1 || _wcLex('A', 'A') !== 0) {
        throw new Error('relationship serialization is not canonical code-unit order');
      }
      return { rebuilt:true, directForgedRejected:true, copyMismatchRejected:true, missingPersonRejected:true,
        duplicateIdentifiersRejected:true, secondPass:true, saveRoundtrip:true,
        rapport:edge.rapport, edges:capKeys.length, recencyEviction:true, history:historyEdge.eventHistory.length,
        positiveClamp:historyEdge.rapport, negativeClamp:negativeEdge.rapport, codeUnitOrder:true };
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
      if (!/nonqualifying/i.test(report) || report.indexOf('merit 0') < 0 || report.indexOf('reputation 0') < 0 || report.indexOf('no promotion') < 0) throw new Error('AAR does not distinguish observation from advancement');
      openSheet('<div id="wcProbeAar" style="max-width:100%;overflow-wrap:anywhere">' + warCareerReportHTML(C, { compact:true }) + '</div>');
      var host = document.getElementById('wcProbeAar');
      if (!host || host.querySelectorAll('h3').length !== 1 || host.querySelectorAll('ul > li').length < 3 || host.querySelector('img')) throw new Error('AAR semantic/escaping structure missing');
      if (!/War Career|Your Timeline/.test(host.textContent) || !/nonqualifying/i.test(host.textContent)) throw new Error('AAR text does not carry state without color');
      window.__wcAarCampaign = C;
      return { legacy:true, v1:true, headings:host.querySelectorAll('h3').length, listItems:host.querySelectorAll('ul > li').length };
    });

    step('D407 HANDOFF MEMORY + OWNER ISOLATION + AAR', function() {
      var fixture = d406Fixture({ runId:'run-d406-handoff-27', fallenAt:2 }), C = fixture.C, J = C.loot.journey;
      d407StripSignals(J);
      var targetId = fixture.stages[0].commandTarget;
      for (var i = 0; i < 2; i++) {
        var credit = J.creditLedger[i], event = J.events.filter(function(row) { return row.eventId === credit.eventId; })[0];
        if (!credit || !event || credit.fate !== 'alive' || event.fate !== 'alive') throw new Error('predecessor alive signal fixture moved');
        d407SeedSignal(C, J, event, credit, targetId);
      }
      G.campaign = C; warCareerInit(C); J = C.loot.journey;
      var key = 'command-general-v1|' + targetId, predecessorEdge = J.relationships[key];
      if (!predecessorEdge || predecessorEdge.rapport <= 0 || predecessorEdge.rememberedRapport !== 0 || predecessorEdge.eventHistory.length < 2) {
        throw new Error('predecessor relationship memory did not reconstruct: ' + bytes(predecessorEdge));
      }
      var predecessorRapport = predecessorEdge.rapport, predecessorHistory = bytes(predecessorEdge.eventHistory);
      function reducerTransition(actor, target, index, delta, code) {
        return { ordinal:index, eventId:'handoff-event-' + index, creditKey:'handoff-credit-' + index,
          signal:{ transitionId:'handoff-transition-' + index, actorPersonId:actor, targetId:target,
            targetNamespace:'command-general-v1', eventCode:code, rapportDelta:delta } };
      }
      var rememberedTransitions = [], negativeRemembered = [];
      for (var ri = 0; ri < 5; ri++) {
        rememberedTransitions.push(reducerTransition('predecessor', 'memory-target', ri + 1, 2, 'high-command-decisive-victory'));
        negativeRemembered.push(reducerTransition('predecessor', 'negative-memory-target', ri + 11, -2, 'high-command-decisive-defeat'));
      }
      var rememberedJ = { personId:'successor', lineage:[{ personId:'predecessor' }], relationships:{} };
      var negativeRememberedJ = { personId:'successor', lineage:[{ personId:'predecessor' }], relationships:{} };
      var unlinkedJ = { personId:'successor', lineage:[], relationships:{} };
      _wcRelationshipReduce(rememberedTransitions, rememberedJ); _wcRelationshipReduce(negativeRemembered, negativeRememberedJ);
      _wcRelationshipReduce(rememberedTransitions, unlinkedJ);
      var rememberedClamp = rememberedJ.relationships['command-general-v1|memory-target'];
      var negativeRememberedClamp = negativeRememberedJ.relationships['command-general-v1|negative-memory-target'];
      if (!rememberedClamp || rememberedClamp.rapport !== 0 || rememberedClamp.rememberedRapport !== 8 ||
          !negativeRememberedClamp || negativeRememberedClamp.rapport !== 0 || negativeRememberedClamp.rememberedRapport !== -8 ||
          Object.keys(unlinkedJ.relationships).length) throw new Error('remembered lineage clamp/authorization moved');
      var mixedJ = { personId:'successor', lineage:[{ personId:'predecessor' }], relationships:{} };
      _wcRelationshipReduce([reducerTransition('successor', 'mixed-target', 30, 2, 'high-command-decisive-victory'),
        reducerTransition('predecessor', 'mixed-target', 31, -1, 'high-command-defeat')], mixedJ);
      var mixedEdge = mixedJ.relationships['command-general-v1|mixed-target'];
      if (!mixedEdge || mixedEdge.rapport !== 2 || mixedEdge.rememberedRapport !== -1) throw new Error('personal and remembered totals were aliased');
      var selected = J.handoff && J.handoff.candidateIds && J.handoff.candidateIds[0];
      var commandBefore = bytes(C.president && C.president.command || null), accepted = warCareerAcceptHandoff(C, selected); J = C.loot.journey;
      var edge = J.relationships[key], commandAfter = bytes(C.president && C.president.command || null);
      if (!accepted.ok || !edge || J.personId !== selected || edge.rapport !== 0 || edge.rememberedRapport !== predecessorRapport ||
          bytes(edge.eventHistory) !== predecessorHistory || commandAfter !== commandBefore ||
          own(C.president.command, 'relationships') || own(C.president.command, 'warCareerRelationships') || own(C.president.command, 'rapport')) {
        throw new Error('handoff copied personal rapport or crossed command ownership: ' + bytes({ accepted:accepted, edge:edge }));
      }
      var before = bytes(C), directOne = warCareerReportHTML(C, { compact:true }), directTwo = warCareerReportHTML(C, { compact:true });
      if (bytes(C) !== before) throw new Error('D407 direct report mutated campaign at ' + firstDiff(JSON.parse(before), C));
      if (directOne !== directTwo) throw new Error('D407 direct report bytes changed across repeated reads');
      var composedBefore = bytes({ relationships:J.relationships, events:J.events, credits:J.creditLedger,
        command:C.president && C.president.command || null });
      var composedOne = aarRenderReport(C, { compact:true }), composedTwo = aarRenderReport(C, { compact:true });
      var composedAfter = bytes({ relationships:J.relationships, events:J.events, credits:J.creditLedger,
        command:C.president && C.president.command || null });
      if (composedAfter !== composedBefore) throw new Error('D407 composed AAR mutated relationship or command authority');
      if (composedOne !== composedTwo) throw new Error('D407 composed AAR bytes changed across repeated reads');
      var target = _wcRegistryPersonUnique(C, targetId);
      if (!target || directOne.indexOf('Relationship memory') < 0 || directOne.indexOf('Your Timeline') < 0 ||
          directOne.indexOf('Personal rapport 0') < 0 || directOne.indexOf('Remembered network +' + predecessorRapport) < 0 ||
          directOne.indexOf(_wcEsc(target.name)) < 0 || directOne.indexOf('decisive-victory response') < 0 ||
          (composedOne.match(/data-war-career-relationships="1"/g) || []).length !== 1) {
        throw new Error('D407 AAR labels or exact target display missing');
      }
      openSheet('<div id="wcProbeAar" style="max-width:100%;overflow-wrap:anywhere">' + directOne + '</div>');
      var host = document.getElementById('wcProbeAar'), section = host && host.querySelector('[data-war-career-relationships="1"]');
      if (!section || section.querySelectorAll('h4').length !== 1 || section.querySelectorAll('ul > li').length !== 1 ||
          !/Your Timeline/.test(section.textContent) || !/Personal rapport/.test(section.textContent) || !/Remembered network/.test(section.textContent)) {
        throw new Error('D407 semantic relationship report structure missing');
      }
      window.__wcAarCampaign = C;
      return { successor:selected, targetId:targetId, personal:edge.rapport, remembered:edge.rememberedRapport,
        history:edge.eventHistory.length, rememberedClamp:rememberedClamp.rememberedRapport,
        negativeRememberedClamp:negativeRememberedClamp.rememberedRapport, mixedIndependent:true,
        commandOwnerIsolated:true, directPure:true, composedPure:true, semantic:true };
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
    suite: { expected: 131, actual: 0, index: 38 },   // D425: 130 -> 131 (D418 Mayhem row)
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
      suite: { expected: 131, actual: list.length, index: 38 },   // D425: 130 -> 131 (D418 Mayhem row)
      static: staticResult,
      pageerrors,
      realErrors,
      console: consoleLines.slice(-30),
      screenshots: [{ path: SHOT, bytes: shotBytes, viewport: { width:390, height:700 }, zoom:200 }]
    });
    const failed = result.steps.filter(row => !row.ok);
    result.ok = !!runtime.ok && staticResult.ok && !failed.length && !pageerrors.length && !realErrors.length && list.length === 131;   // D425: 130 -> 131 (D418 Mayhem row)
  } catch (error) {
    result.ok = false;
    result.fatal = String(error && error.stack || error);
  } finally {
    writeFileSync(OUTFILE, JSON.stringify(result, null, 2) + "\n");
    if (server) server.kill();
  }

  const passing = result.steps.filter(row => row.ok).length;
  const failing = result.steps.length - passing;
  console.log("probe-war-career: " + passing + "/" + result.steps.length + " steps ok" + (failing ? ", " + failing + " FAIL" : ", 0 fail") + " pageerrors=" + result.pageerrors.length + " realErrors=" + result.realErrors.length);
  for (const row of result.steps) if (!row.ok) console.error("  FAIL:", row.name, "::", row.error);
  for (const error of result.pageerrors) console.error("  PAGE ERROR:", error);
  for (const error of result.realErrors) console.error("  CONSOLE:", error);
  if (result.fatal) console.error("  FATAL:", result.fatal);
  if (result.ok) console.log("ALL OK");
  // This is a standalone probe. Playwright can leave an already-closed
  // transport handle referenced on macOS; the artifact and cleanup are complete
  // here, so exit explicitly with the verified result instead of false-hanging.
  process.exit(result.ok ? 0 : 1);
}

main().catch(error => {
  console.error("FATAL:", error);
  process.exit(1);
});
