/* ===========================================================================
   D400 · 106-war-career.js — WAR_CAREER_RUNTIME_V1.

   D401 Slice B extends the canonical spine with consequence-only identity.
   D405 adds the coexisting WAR_CAREER_RECEIPT_V2 prerequisite:
     - canonical Army Register source history remains immutable;
     - a frozen exact-id "Your Timeline" assignment may prove one later rung;
     - source and timeline references validate independently;
     - D401 v1 ids, fields, same-source-rung behavior, and bytes remain legal.
   D406 Slice C adds ledger-derived advancement and one command projection.
   D407 Slice D adds bounded, provenance-bearing relationship memory from one
   exact high-command result target, rendered only as Your Timeline.

   The shared consequence spine still guarantees:
     - C.loot.journey remains the one mutable person-career record;
     - a source-owned scenario-unit slot proves participation across modes;
     - personal fate is classified purely before delegation and committed only
       in the post-undo result seam;
     - normal fallen careers enter deterministic COMRADE HAND-OFF;
     - role/capability readers are pure after idempotent initialization;
     - the live post-save-slot campaignAdvance binding is wrapped by assignment;
     - an Ironman campaign defeat is classified before any write and terminates
       without delegation, recovery, reward, undo, save, or upgrade.

   No combat input, aggregate-casualty inference, political gate, franchise
   store, or save-version change lives here. Slice C contributes only through
   the existing commandLeadership clamp; Slice D only records and reports an
   exact-id high-command response under Your Timeline.
   =========================================================================== */

var _WC_EVENT_MAX = 96;
var _WC_HANDOFF_MAX = 5;
var _WC_REL_EDGE_MAX = 24;
var _WC_REL_HISTORY_MAX = 4;
var _WC_REL_TARGET_NAMESPACE = "command-general-v1";
var _wcRunSeq = 0;
var _wcLastTerminalSnapshot = null;
var _wcTerminalRenderKey = "";
var _wcPendingPreflight = null;

/* Authored alternate-timeline input, not a person registry or mutable ledger.
   The phase id is validation-only and is never persisted in a receipt. */
var _WC_TIMELINE_ASSIGNMENTS_V1 = _wcDeepFreeze([{
  personId:"person_gettysburg_us_17me_haley",
  sourceSlotPid:"ss:gettysburg:US:us_birney_iii:pvt",
  scenarioId:"chickamauga", phaseId:"snodgrass-horseshoe", side:"US",
  unitId:"us_harker_rock", slot:"pvt",
  slotPid:"ss:chickamauga:US:us_harker_rock:pvt",
  chainIndex:16, serviceStart:null, serviceEnd:null, serviceYear:1863,
  timelineGrade:"Private", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"ss:chancellorsville:US:us_battery_chanc:cmd",
  sourceSlotPid:"ss:chancellorsville:US:us_battery_chanc:cmd",
  scenarioId:"vicksburg", phaseId:"forlorn-hope", side:"US",
  unitId:"us_deg_battery", slot:"cmd",
  slotPid:"ss:vicksburg:US:us_deg_battery:cmd",
  chainIndex:14, serviceStart:null, serviceEnd:null, serviceYear:1863,
  timelineGrade:"Major", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"ss:chancellorsville:US:us_battery_chanc:cmd",
  sourceSlotPid:"ss:chancellorsville:US:us_battery_chanc:cmd",
  scenarioId:"gettysburg", phaseId:"day1", side:"US",
  unitId:"us_hall_battery", slot:"cmd",
  slotPid:"ss:gettysburg:US:us_hall_battery:cmd",
  chainIndex:15, serviceStart:null, serviceEnd:null, serviceYear:1863,
  timelineGrade:"Lt. Col.", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"ss:chancellorsville:US:us_battery_chanc:cmd",
  sourceSlotPid:"ss:chancellorsville:US:us_battery_chanc:cmd",
  scenarioId:"chickamauga", phaseId:"the-woods", side:"US",
  unitId:"us_lilly_battery", slot:"cmd",
  slotPid:"ss:chickamauga:US:us_lilly_battery:cmd",
  chainIndex:16, serviceStart:null, serviceEnd:null, serviceYear:1863,
  timelineGrade:"Colonel", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"person_bullrun_us_2ri_rhodes",
  sourceSlotPid:"ss:bullrun1:US:us_burnside:pvt",
  scenarioId:"antietam", phaseId:"sunkenroad", side:"US",
  unitId:"us_french", slot:"nco",
  slotPid:"ss:antietam:US:us_french:nco",
  chainIndex:9, serviceStart:null, serviceEnd:null, serviceYear:1862,
  timelineGrade:"Sergeant", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"person_bullrun_us_2ri_rhodes",
  sourceSlotPid:"ss:bullrun1:US:us_burnside:pvt",
  scenarioId:"vicksburg", phaseId:"forlorn-hope", side:"US",
  unitId:"us_deg_battery", slot:"cmd",
  slotPid:"ss:vicksburg:US:us_deg_battery:cmd",
  chainIndex:14, serviceStart:null, serviceEnd:null, serviceYear:1863,
  timelineGrade:"Captain", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"person_bullrun_us_2ri_rhodes",
  sourceSlotPid:"ss:bullrun1:US:us_burnside:pvt",
  scenarioId:"gettysburg", phaseId:"day1", side:"US",
  unitId:"us_hall_battery", slot:"cmd",
  slotPid:"ss:gettysburg:US:us_hall_battery:cmd",
  chainIndex:15, serviceStart:null, serviceEnd:null, serviceYear:1863,
  timelineGrade:"Major", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"person_bullrun_us_2ri_rhodes",
  sourceSlotPid:"ss:bullrun1:US:us_burnside:pvt",
  scenarioId:"chickamauga", phaseId:"the-woods", side:"US",
  unitId:"us_lilly_battery", slot:"cmd",
  slotPid:"ss:chickamauga:US:us_lilly_battery:cmd",
  chainIndex:16, serviceStart:null, serviceEnd:null, serviceYear:1863,
  timelineGrade:"Lt. Col.", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"person_bullrun_us_2ri_rhodes",
  sourceSlotPid:"ss:bullrun1:US:us_burnside:pvt",
  scenarioId:"chattanooga", phaseId:"missionary-ridge", side:"US",
  unitId:"us_hazen_mr", slot:"cmd",
  slotPid:"ss:chattanooga:US:us_hazen_mr:cmd",
  chainIndex:17, serviceStart:null, serviceEnd:null, serviceYear:1863,
  timelineGrade:"Colonel", provenance:"Inferred", label:"Your Timeline"
},{
  personId:"person_bullrun_us_2ri_rhodes",
  sourceSlotPid:"ss:bullrun1:US:us_burnside:pvt",
  scenarioId:"nashville", phaseId:"redoubts-montgomery-hill", side:"US",
  unitId:"us_r_battery", slot:"cmd",
  slotPid:"ss:nashville:US:us_r_battery:cmd",
  chainIndex:27, serviceStart:null, serviceEnd:null, serviceYear:1864,
  timelineGrade:"Brig. Gen.", provenance:"Inferred", label:"Your Timeline"
}]);

function _wcText(v, max) {
  if (typeof _lootCleanText === "function") return _lootCleanText(v, max);
  var s = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  return max && s.length > max ? s.slice(0, max) : s;
}
function _wcEsc(v) {
  if (typeof _lootEsc === "function") return _lootEsc(v);
  if (typeof htmlEsc === "function") return htmlEsc(v);
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function _wcSafeId(v, max) {
  var s = _wcText(v, max || 180);
  return /^[A-Za-z0-9][A-Za-z0-9._:@|/-]*$/.test(s) ? s : "";
}
function _wcOwn(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function _wcPlain(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
function _wcUnitRef(src) {
  if (!_wcPlain(src)) return null;
  var battleId = _wcSafeId(src.battleId, 120), unitId = _wcSafeId(src.unitId, 120);
  var side = src.side === "CS" ? "CS" : (src.side === "US" ? "US" : "");
  var slot = /^(cmd|nco|pvt)$/.test(String(src.slot || "")) ? String(src.slot) : "";
  var slotPid = _wcSafeId(src.slotPid, 180), expected = battleId && side && unitId && slot ? ["ss", battleId, side, unitId, slot].join(":") : "";
  if (!battleId || !unitId || !side || !slot || !slotPid || slotPid !== expected) return null;
  return { battleId:battleId, side:side, unitId:unitId, slot:slot, slotPid:slotPid };
}
function _wcSameUnitRef(a, b) {
  a = _wcUnitRef(a); b = _wcUnitRef(b);
  return !!(a && b && a.battleId === b.battleId && a.side === b.side && a.unitId === b.unitId && a.slot === b.slot && a.slotPid === b.slotPid);
}
function warCareerRunIdValid(v) {
  return /^[A-Za-z0-9][A-Za-z0-9._:@|/-]{0,95}$/.test(String(v == null ? "" : v));
}
function _wcHash(v) {
  if (typeof _lootHash === "function") return _lootHash(v);
  var s = String(v == null ? "" : v), h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h >>> 0;
}
function warCareerEnsureRunId(C) {
  if (!C || typeof C !== "object") return "";
  if (warCareerRunIdValid(C.runId)) return C.runId;
  var now = Date.now ? Date.now() : 0;
  _wcRunSeq++;
  var side = C.side === "CS" ? "cs" : "us";
  var seed = [side, now, _wcRunSeq, C.idx || 0, C.nextId || 0].join(":");
  C.runId = "run-" + side + "-" + Number(now).toString(36) + "-" + _wcHash(seed).toString(36);
  return C.runId;
}

function warCareerInit(C) {
  if (!C || typeof C !== "object") return null;
  warCareerEnsureRunId(C);
  var L = (typeof lootInit === "function") ? lootInit(C) : null;
  if (!L) {
    if (!C.loot || typeof C.loot !== "object" || Array.isArray(C.loot)) C.loot = {};
    if (!C.loot.journey || typeof C.loot.journey !== "object" || Array.isArray(C.loot.journey)) C.loot.journey = {};
    L = C.loot;
  }
  return L.journey || null;
}

function _wcAllowedStartRank(rank) {
  var r = typeof _ssRankNorm === "function" ? _ssRankNorm(rank) : _wcText(rank, 80).toLowerCase();
  var allowed = {
    "private":1, "pvt":1, "bugler":1, "musician":1, "drummer":1,
    "corporal":1, "cpl":1, "sergeant":1, "sgt":1, "first sergeant":1,
    "1st sgt":1, "sergeant major":1, "lieutenant":1, "lt":1, "1st lt":1,
    "2nd lt":1, "first lieutenant":1, "second lieutenant":1,
    "captain":1, "capt":1
  };
  return !!allowed[r];
}
function _wcTeamAnchor(p) {
  var t = p && p.team;
  if (!t || typeof t !== "object" || Array.isArray(t)) return "";
  return _wcText(t.company || t.regiment || t.brigade || t.division || t.corps || t.army || "", 120);
}
function warCareerCanStartPerson(C, p, J) {
  if (!C) return { ok:false, reason:"no-campaign", reasonText:"Start a campaign before beginning a War Career.", label:"Begin War Career" };
  if (!p || !p.pid) return { ok:false, reason:"unknown-person", reasonText:"This Army Register identity is unavailable.", label:"Begin War Career" };
  J = J || (C.loot && C.loot.journey) || null;
  if (J && J.enabled && J.careerVersion === 1) {
    return { ok:false, reason:"career-active", reasonText:"A War Career is already active.", label:"War Career Active" };
  }
  if (p.side !== C.side) return { ok:false, reason:"wrong-side", reasonText:"War Career service must match the campaign side.", label:"Begin War Career" };
  if (!_wcAllowedStartRank(p.rank)) return { ok:false, reason:"rank-out-of-range", reasonText:"War Career starts are limited to Private through Captain.", label:"Begin War Career" };
  if (!_wcTeamAnchor(p)) return { ok:false, reason:"unstable-team", reasonText:"A stable unit assignment is required before this career can begin.", label:"Begin War Career" };
  if (p.team && p.team.side && p.team.side !== C.side) return { ok:false, reason:"wrong-team-side", reasonText:"The recorded unit side does not match this campaign.", label:"Begin War Career" };
  var unitRef = _wcUnitRef(p.unitRef);
  if (!unitRef || unitRef.side !== C.side) return { ok:false, reason:"no-explicit-unit", reasonText:"This identity has no exact scenario-unit service slot, so participation cannot be proved.", label:"Begin War Career" };
  if ((p.status && _wcText(p.status, 24).toLowerCase() !== "alive") || (J && J.enabled && J.status && J.status !== "alive")) {
    return { ok:false, reason:"not-present", reasonText:"Only an alive, present person may begin a War Career.", label:"Begin War Career" };
  }
  if (J && J.enabled && J.personId !== p.pid) {
    return { ok:false, reason:"journey-active", reasonText:"Another Soldier's Story is already active.", label:"Begin War Career" };
  }
  var converting = !!(J && J.enabled && J.personId === p.pid && J.careerVersion !== 1);
  return {
    ok:true,
    converting:converting,
    reason:converting ? "explicit-legacy-conversion" : "eligible",
    reasonText:converting ? "Convert this eligible Journey explicitly; its existing record is preserved." : "Eligible Private-through-Captain start with an exact same-side scenario-unit service slot.",
    label:converting ? "Convert to War Career" : "Begin War Career",
    anchor:_wcTeamAnchor(p), unitRef:unitRef
  };
}
function warCareerCanStart(C, pid) {
  // Eligibility is a read. Initialization belongs to explicit start/load lanes.
  var J = C && C.loot && C.loot.journey ? C.loot.journey : null;
  var p = (C && typeof ssFindPerson === "function") ? ssFindPerson(C, pid) : null;
  return warCareerCanStartPerson(C, p, J);
}

function _wcBattleId(B, C) {
  var id = B && (B.id || (B.bd && B.bd.id));
  if (!id && typeof CHAINS !== "undefined" && CHAINS && C && Array.isArray(CHAINS[C.side])) id = CHAINS[C.side][C.idx || 0];
  return _wcSafeId(id, 120);
}
function _wcBattleName(B, id) {
  return _wcText((B && (B.name || B.label || (B.bd && B.bd.name))) || id || "the field", 120);
}
function _wcEventId(C, J) {
  var used = {}, rows = Array.isArray(J.events) ? J.events : [], credits = Array.isArray(J.creditLedger) ? J.creditLedger : [];
  for (var i = 0; i < rows.length; i++) if (rows[i] && rows[i].eventId) used[rows[i].eventId] = true;
  for (var ci = 0; ci < credits.length; ci++) if (credits[ci] && credits[ci].eventId) used[credits[ci].eventId] = true;
  var next = Math.max(0, Math.round(Number(J.eventOrdinal) || 0)) + 1;
  var id = C.runId + ":event:" + next;
  while (used[id]) { next++; id = C.runId + ":event:" + next; }
  J.eventOrdinal = next;
  return id;
}
function _wcPushEvent(J, row) {
  if (!Array.isArray(J.events)) J.events = [];
  J.events.push(row);
  while (J.events.length > _WC_EVENT_MAX) {
    var protectedIds = {}, credits = Array.isArray(J.creditLedger) ? J.creditLedger : [];
    for (var ci = 0; ci < credits.length; ci++) if (credits[ci] && credits[ci].qualifying) {
      if (credits[ci].eventId) protectedIds[credits[ci].eventId] = true;
      if (credits[ci].recoveryEventId) protectedIds[credits[ci].recoveryEventId] = true;
    }
    var drop = -1;
    for (var ei = 0; ei < J.events.length; ei++) if (!protectedIds[J.events[ei] && J.events[ei].eventId]) { drop = ei; break; }
    J.events.splice(drop >= 0 ? drop : 0, 1);
  }
}
function _wcOutcome(winnerSide, C, B, win) {
  if (winnerSide === null) return "draw";
  if (win === true) return "victory";
  if (win === false) return "defeat";
  var side = (B && B.playerSide) || (C && C.side);
  return winnerSide === side ? "victory" : "defeat";
}
function _wcOutcomeRank(outcome, type) {
  if (outcome === "victory") return type === "decisive" ? 3 : 2;
  return outcome === "draw" ? 1 : 0;
}
function _wcCreditKey(C, B) {
  return [C.runId, C.side, Math.max(0, Math.round(Number(C.idx) || 0)), _wcBattleId(B, C) || "unknown"].join("|");
}
function _wcCreditFor(J, key) {
  var rows = Array.isArray(J.creditLedger) ? J.creditLedger : [];
  for (var i = 0; i < rows.length; i++) if (rows[i] && rows[i].creditKey === key) return rows[i];
  return null;
}
function _wcUnrecoveredCapture(J, personId) {
  var rows = J && Array.isArray(J.creditLedger) ? J.creditLedger : [], found = null;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (!row || !row.qualifying || row.personId !== personId || row.fate !== "captured" || row.recoveredAtCreditKey) continue;
    if (!found || Number(row.chainIndex) > Number(found.chainIndex)) found = row;
  }
  return found;
}
function _wcRecoveredCaptureForKey(J, creditKey) {
  var rows = J && Array.isArray(J.creditLedger) ? J.creditLedger : [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (row && row.qualifying && row.fate === "captured" && row.recoveredAtCreditKey === creditKey && row.recoveryEventId) return row;
  }
  return null;
}
function _wcFiniteRungs(C) {
  if (typeof CHAINS !== "undefined" && CHAINS && C && Array.isArray(CHAINS[C.side])) return CHAINS[C.side].length;
  return 64;
}

var _WC_SOURCE_REF_KEYS = [
  "battleId","side","unitId","slot","slotPid","sourceGrade",
  "serviceStart","serviceEnd","serviceYear","provenance"
];
var _WC_TIMELINE_REF_KEYS = [
  "assignmentId","scenarioId","side","unitId","slot","slotPid","chainIndex",
  "serviceStart","serviceEnd","serviceYear","timelineGrade","provenance","label"
];
var _WC_V2_KEYS = [
  "schema","resultId","mode","runId","creditKey","personId","chainIndex",
  "battleId","side","sourceRef","timelineAssignmentRef","representedFieldUnitId",
  "fieldMapping","battleYear","rankAtResult"
];

function _wcExactKeys(src, keys) {
  if (!_wcPlain(src) || Object.keys(src).length !== keys.length) return false;
  for (var i = 0; i < keys.length; i++) if (!_wcOwn(src, keys[i])) return false;
  return true;
}
function _wcHasKeys(src, keys) {
  if (!_wcPlain(src)) return false;
  for (var i = 0; i < keys.length; i++) if (!_wcOwn(src, keys[i])) return false;
  return true;
}
function _wcFieldsSame(a, b, keys) {
  if (!_wcPlain(a) || !_wcPlain(b)) return false;
  for (var i = 0; i < keys.length; i++) if (a[keys[i]] !== b[keys[i]]) return false;
  return true;
}
function _wcServiceValue(v) {
  if (v == null) return null;
  return typeof v === "number" && isFinite(v) && Math.floor(v) === v && v >= 1800 && v <= 1900 ? v : undefined;
}
function _wcServiceWindowValid(src, year) {
  if (!_wcPlain(src) || !isFinite(year)) return false;
  var start = _wcServiceValue(src.serviceStart), end = _wcServiceValue(src.serviceEnd), one = _wcServiceValue(src.serviceYear);
  if (start === undefined || end === undefined || one === undefined || (start != null && end != null && start > end)) return false;
  year = Math.round(Number(year));
  if (start != null && year < start) return false;
  if (end != null && year > end) return false;
  if (one != null && year !== one) return false;
  return true;
}
function _wcCleanSourceRef(src) {
  if (!_wcHasKeys(src, _WC_SOURCE_REF_KEYS)) return null;
  var ref = _wcUnitRef(src), sourceGrade = _wcText(src.sourceGrade || "", 80);
  var start = _wcServiceValue(src.serviceStart), end = _wcServiceValue(src.serviceEnd), one = _wcServiceValue(src.serviceYear);
  var provenance = _wcText(src.provenance || "", 40);
  if (!ref || !sourceGrade || !provenance || start === undefined || end === undefined || one === undefined) return null;
  return {
    battleId:ref.battleId, side:ref.side, unitId:ref.unitId, slot:ref.slot, slotPid:ref.slotPid,
    sourceGrade:sourceGrade, serviceStart:start, serviceEnd:end, serviceYear:one, provenance:provenance
  };
}
function _wcSourceRefFromPerson(p) {
  var ref = p && _wcUnitRef(p.unitRef), sourceGrade = _wcText(p && p.rank || "", 80);
  var start = _wcServiceValue(p && _wcOwn(p, "serviceStart") ? p.serviceStart : null);
  var end = _wcServiceValue(p && _wcOwn(p, "serviceEnd") ? p.serviceEnd : null);
  var one = _wcServiceValue(p && _wcOwn(p, "serviceYear") ? p.serviceYear : null);
  var provenance = _wcText(p && p.provenance || "", 40);
  if (!ref || !sourceGrade || !provenance || start === undefined || end === undefined || one === undefined) return null;
  return {
    battleId:ref.battleId, side:ref.side, unitId:ref.unitId, slot:ref.slot, slotPid:ref.slotPid,
    sourceGrade:sourceGrade, serviceStart:start, serviceEnd:end, serviceYear:one, provenance:provenance
  };
}
function _wcValidateCanonicalSource(C, personId, side, sourceRef) {
  var clean = _wcCleanSourceRef(sourceRef), safePersonId = _wcSafeId(personId, 180);
  var reg = C && typeof ssPersonRegistry === "function" ? ssPersonRegistry(C) : null;
  var people = reg && Array.isArray(reg.people) ? reg.people : [], person = null, personCount = 0, slotCount = 0, slotPerson = null;
  if (!clean || !safePersonId || (side !== "US" && side !== "CS")) return null;
  for (var i = 0; i < people.length; i++) {
    var p = people[i], ref = p && _wcUnitRef(p.unitRef);
    if (p && p.pid === safePersonId) { person = p; personCount++; }
    if (ref && ref.slotPid === clean.slotPid) { slotPerson = p; slotCount++; }
  }
  var expected = personCount === 1 ? _wcSourceRefFromPerson(person) : null;
  if (!expected || slotCount !== 1 || slotPerson !== person || person.side !== side || clean.side !== side ||
      !_wcFieldsSame(clean, expected, _WC_SOURCE_REF_KEYS)) return null;
  return { person:person, sourceRef:expected };
}
function _wcTimelineAssignmentId(row) {
  if (!_wcPlain(row)) return "";
  return "wcta-" + _wcHash([
    row.personId, row.sourceSlotPid, row.scenarioId, row.side, row.unitId, row.slot, row.slotPid,
    row.chainIndex, row.serviceStart == null ? "" : row.serviceStart,
    row.serviceEnd == null ? "" : row.serviceEnd,
    row.serviceYear == null ? "" : row.serviceYear,
    row.timelineGrade, "timeline-assignment-v1"
  ].join("|")).toString(36);
}
function _wcTimelineAssignmentUnique(personId, side, chainIndex, scenarioId) {
  var found = null, count = 0;
  for (var i = 0; i < _WC_TIMELINE_ASSIGNMENTS_V1.length; i++) {
    var row = _WC_TIMELINE_ASSIGNMENTS_V1[i];
    if (row && row.personId === personId && row.side === side && row.chainIndex === chainIndex && row.scenarioId === scenarioId) {
      found = row; count++;
    }
  }
  return count === 1 ? found : null;
}
function _wcTimelineRefFromRow(row) {
  if (!_wcPlain(row)) return null;
  var ref = _wcUnitRef({ battleId:row.scenarioId, side:row.side, unitId:row.unitId, slot:row.slot, slotPid:row.slotPid });
  var assignmentId = _wcTimelineAssignmentId(row), chainIndex = Number(row.chainIndex);
  var start = _wcServiceValue(row.serviceStart), end = _wcServiceValue(row.serviceEnd), one = _wcServiceValue(row.serviceYear);
  var timelineGrade = _wcText(row.timelineGrade || "", 80), provenance = _wcText(row.provenance || "", 40), label = _wcText(row.label || "", 80);
  if (!ref || !_wcSafeId(assignmentId, 96) || !isFinite(chainIndex) || Math.floor(chainIndex) !== chainIndex || chainIndex < 0 ||
      start === undefined || end === undefined || one === undefined || !timelineGrade || provenance !== "Inferred" || label !== "Your Timeline") return null;
  return {
    assignmentId:assignmentId, scenarioId:ref.battleId, side:ref.side, unitId:ref.unitId,
    slot:ref.slot, slotPid:ref.slotPid, chainIndex:chainIndex,
    serviceStart:start, serviceEnd:end, serviceYear:one,
    timelineGrade:timelineGrade, provenance:provenance, label:label
  };
}
function _wcCleanTimelineRef(src) {
  if (!_wcHasKeys(src, _WC_TIMELINE_REF_KEYS)) return null;
  var ref = _wcUnitRef({ battleId:src.scenarioId, side:src.side, unitId:src.unitId, slot:src.slot, slotPid:src.slotPid });
  var assignmentId = _wcSafeId(src.assignmentId, 96), chainIndex = Number(src.chainIndex);
  var start = _wcServiceValue(src.serviceStart), end = _wcServiceValue(src.serviceEnd), one = _wcServiceValue(src.serviceYear);
  var timelineGrade = _wcText(src.timelineGrade || "", 80), provenance = _wcText(src.provenance || "", 40), label = _wcText(src.label || "", 80);
  if (!ref || !assignmentId || !isFinite(chainIndex) || Math.floor(chainIndex) !== chainIndex || chainIndex < 0 ||
      start === undefined || end === undefined || one === undefined || !timelineGrade || !provenance || !label) return null;
  return {
    assignmentId:assignmentId, scenarioId:ref.battleId, side:ref.side, unitId:ref.unitId,
    slot:ref.slot, slotPid:ref.slotPid, chainIndex:chainIndex,
    serviceStart:start, serviceEnd:end, serviceYear:one,
    timelineGrade:timelineGrade, provenance:provenance, label:label
  };
}
function _wcCanonicalBattleYear(battleId) {
  var year = typeof _ssCareerBattleYear === "function" ? _ssCareerBattleYear(battleId) : null;
  if (year != null) return year;
  var reg = typeof fldScenarioRegistry === "function" ? fldScenarioRegistry() : null;
  var scenario = reg && reg[battleId], n = Number(scenario && scenario.year);
  return isFinite(n) && n >= 1860 && n <= 1870 ? Math.round(n) : null;
}
function _wcTimelineTarget(row) {
  var reg = typeof fldScenarioRegistry === "function" ? fldScenarioRegistry() : null;
  var scenario = reg && row && reg[row.scenarioId], phases = scenario && Array.isArray(scenario.phases) ? scenario.phases : [];
  var phaseCount = 0, totalCount = 0, target = null, phaseMatches = 0;
  for (var pi = 0; pi < phases.length; pi++) {
    var phase = phases[pi], rows = [];
    if (!phase) continue;
    if (phase.id === row.phaseId) phaseMatches++;
    if (phase.oob && Array.isArray(phase.oob[row.side])) {
      for (var oi = 0; oi < phase.oob[row.side].length; oi++) rows.push({ unit:phase.oob[row.side][oi], side:row.side });
    }
    if (Array.isArray(phase.reinforcements)) for (var ri = 0; ri < phase.reinforcements.length; ri++) {
      var reinforcement = phase.reinforcements[ri];
      if (reinforcement && reinforcement.side === row.side) rows.push({ unit:reinforcement, side:reinforcement.side });
    }
    for (var ui = 0; ui < rows.length; ui++) {
      var unit = rows[ui].unit;
      if (unit && unit.id === row.unitId && rows[ui].side === row.side) {
        totalCount++;
        if (phase.id === row.phaseId) { phaseCount++; target = unit; }
      }
    }
  }
  if (phaseMatches !== 1 || phaseCount !== 1 || totalCount !== 1 || !target || target.type === "hq" || target.arm === "hq") return null;
  return target;
}
function _wcRankCompatible(rankAtResult, timelineGrade) {
  var a = typeof _ssRankNorm === "function" ? _ssRankNorm(rankAtResult) : _wcText(rankAtResult, 80).toLowerCase();
  var b = typeof _ssRankNorm === "function" ? _ssRankNorm(timelineGrade) : _wcText(timelineGrade, 80).toLowerCase();
  return !!a && a === b;
}
function _wcValidateTimelineAssignment(C, personId, sourceRef, timelineRef, representedFieldUnitId, battleYear, rankAtResult, current) {
  var clean = _wcCleanTimelineRef(timelineRef), represented = _wcSafeId(representedFieldUnitId, 180);
  if (!clean || !represented || represented !== clean.unitId) return null;
  var row = _wcTimelineAssignmentUnique(personId, clean.side, clean.chainIndex, clean.scenarioId);
  var expected = row && _wcTimelineRefFromRow(row);
  var chain = typeof CHAINS !== "undefined" && CHAINS && Array.isArray(CHAINS[clean.side]) ? CHAINS[clean.side] : null;
  var canonicalYear = _wcCanonicalBattleYear(clean.scenarioId);
  if (!row || !expected || !_wcFieldsSame(clean, expected, _WC_TIMELINE_REF_KEYS) ||
      row.sourceSlotPid !== sourceRef.slotPid || !chain || clean.chainIndex >= chain.length || chain[clean.chainIndex] !== clean.scenarioId ||
      canonicalYear == null || Number(battleYear) !== canonicalYear || !_wcTimelineTarget(row) ||
      !_wcServiceWindowValid(sourceRef, canonicalYear) || !_wcServiceWindowValid(clean, canonicalYear) ||
      !_wcRankCompatible(rankAtResult, clean.timelineGrade)) return null;
  if (current) {
    var J = current.J, sourceUnit = J && J.person && _wcUnitRef(J.person.unitRef);
    if (!J || !J.enabled || J.careerVersion !== 1 || J.personId !== personId || !J.person || J.person.pid !== personId ||
        (J.status !== "alive" && J.status !== "wounded") ||
        (J.handoff && (J.handoff.state === "pending" || J.handoff.state === "ended")) ||
        current.side !== clean.side || current.chainIndex !== clean.chainIndex || current.battleId !== clean.scenarioId ||
        !warCareerRunIdValid(current.runId) || current.runId !== C.runId ||
        current.creditKey !== [current.runId, clean.side, clean.chainIndex, clean.scenarioId].join("|") ||
        !sourceUnit || !_wcSameUnitRef(sourceUnit, sourceRef) || _wcText(J.person.rank || "", 80) !== rankAtResult) return null;
  }
  return { row:row, timelineAssignmentRef:expected };
}
function _wcResultIdV2(runId, creditKey, mode, personId, sourceRef, timelineRef, representedFieldUnitId, fieldMapping, battleYear, rankAtResult) {
  var parts = ["participation-v2", runId, creditKey, mode, personId];
  for (var si = 0; si < _WC_SOURCE_REF_KEYS.length; si++) parts.push(sourceRef[_WC_SOURCE_REF_KEYS[si]] == null ? "" : sourceRef[_WC_SOURCE_REF_KEYS[si]]);
  for (var ti = 0; ti < _WC_TIMELINE_REF_KEYS.length; ti++) parts.push(timelineRef[_WC_TIMELINE_REF_KEYS[ti]] == null ? "" : timelineRef[_WC_TIMELINE_REF_KEYS[ti]]);
  parts.push(representedFieldUnitId, fieldMapping, battleYear, rankAtResult);
  return "wcr-" + _wcHash(parts.join("|")).toString(36);
}
function _wcSanitizeParticipationV2(src, C) {
  if (!_wcPlain(src) || src.schema !== "cw_war_career_participation_v2" || !C || !_wcHasKeys(src, _WC_V2_KEYS)) return null;
  var resultId = _wcSafeId(src.resultId, 96), mode = src.mode === "classic" ? "classic" : "";
  var runId = _wcSafeId(src.runId, 96), creditKey = _wcSafeId(src.creditKey, 220), personId = _wcSafeId(src.personId, 180);
  var chainIndex = Number(src.chainIndex), battleId = _wcSafeId(src.battleId, 120);
  var side = src.side === "CS" ? "CS" : (src.side === "US" ? "US" : "");
  var sourceRef = _wcCleanSourceRef(src.sourceRef), timelineRef = _wcCleanTimelineRef(src.timelineAssignmentRef);
  var representedFieldUnitId = _wcSafeId(src.representedFieldUnitId, 180);
  var fieldMapping = src.fieldMapping === "exact-timeline-unit" ? "exact-timeline-unit" : "";
  var battleYear = Number(src.battleYear), rankAtResult = _wcText(src.rankAtResult || "", 80);
  if (!resultId || !mode || !runId || runId !== _wcSafeId(C.runId, 96) || !creditKey || !personId ||
      !isFinite(chainIndex) || Math.floor(chainIndex) !== chainIndex || chainIndex < 0 || !battleId || !side || side !== C.side ||
      !sourceRef || !timelineRef || !representedFieldUnitId || !fieldMapping || !isFinite(battleYear) || !rankAtResult ||
      battleId !== timelineRef.scenarioId || side !== timelineRef.side || chainIndex !== timelineRef.chainIndex ||
      creditKey !== [runId, side, chainIndex, battleId].join("|") || Math.round(battleYear) !== battleYear) return null;
  var source = _wcValidateCanonicalSource(C, personId, side, sourceRef);
  var timeline = source && _wcValidateTimelineAssignment(C, personId, source.sourceRef, timelineRef, representedFieldUnitId, battleYear, rankAtResult, null);
  if (!source || !timeline) return null;
  var expectedResultId = _wcResultIdV2(runId, creditKey, mode, personId, source.sourceRef, timeline.timelineAssignmentRef,
    representedFieldUnitId, fieldMapping, battleYear, rankAtResult);
  if (resultId !== expectedResultId) return null;
  return {
    schema:"cw_war_career_participation_v2", resultId:resultId, mode:mode, runId:runId,
    creditKey:creditKey, personId:personId, chainIndex:chainIndex, battleId:battleId, side:side,
    sourceRef:source.sourceRef, timelineAssignmentRef:timeline.timelineAssignmentRef,
    representedFieldUnitId:representedFieldUnitId, fieldMapping:fieldMapping,
    battleYear:battleYear, rankAtResult:rankAtResult
  };
}
function _wcTimelineLink(C, battleId) {
  var J = C && C.loot && C.loot.journey, chainIndex = Number(C && C.idx);
  var side = C && (C.side === "CS" ? "CS" : (C.side === "US" ? "US" : ""));
  var chain = side && typeof CHAINS !== "undefined" && CHAINS && Array.isArray(CHAINS[side]) ? CHAINS[side] : null;
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person || J.personId !== J.person.pid ||
      (J.status !== "alive" && J.status !== "wounded") ||
      (J.handoff && (J.handoff.state === "pending" || J.handoff.state === "ended")) ||
      !side || !warCareerRunIdValid(C.runId) || !isFinite(chainIndex) || Math.floor(chainIndex) !== chainIndex || chainIndex < 0 ||
      !chain || chainIndex >= chain.length || chain[chainIndex] !== battleId) return null;
  var person = _wcRegistryPersonUnique(C, J.personId), sourceRef = person && _wcSourceRefFromPerson(person);
  var source = sourceRef && _wcValidateCanonicalSource(C, J.personId, side, sourceRef);
  var row = source && _wcTimelineAssignmentUnique(J.personId, side, chainIndex, battleId);
  var timelineRef = row && _wcTimelineRefFromRow(row), battleYear = _wcCanonicalBattleYear(battleId);
  var creditKey = [C.runId, side, chainIndex, battleId].join("|");
  var rankAtResult = _wcText(J.person.rank || "", 80);
  var timeline = timelineRef && _wcValidateTimelineAssignment(C, J.personId, source.sourceRef, timelineRef, timelineRef.unitId,
    battleYear, rankAtResult, { J:J, runId:C.runId, creditKey:creditKey, side:side, chainIndex:chainIndex, battleId:battleId });
  if (!source || !timeline || !person || !_wcSameUnitRef(J.person.unitRef, source.sourceRef)) return null;
  return {
    J:J, runId:C.runId, person:person, sourceRef:source.sourceRef,
    timelineAssignmentRef:timeline.timelineAssignmentRef, chainIndex:chainIndex,
    creditKey:creditKey, battleYear:battleYear, rankAtResult:rankAtResult
  };
}
function _wcResultEvidenceV2(link, mode, year) {
  year = Number(year);
  if (!link || mode !== "classic" || !isFinite(year) || Math.round(year) !== link.battleYear) return null;
  var representedFieldUnitId = link.timelineAssignmentRef.unitId, fieldMapping = "exact-timeline-unit";
  var resultId = _wcResultIdV2(link.runId, link.creditKey, mode, link.person.pid, link.sourceRef,
    link.timelineAssignmentRef, representedFieldUnitId, fieldMapping, link.battleYear, link.rankAtResult);
  return {
    schema:"cw_war_career_result_v2", resultId:resultId, mode:mode, runId:link.runId,
    creditKey:link.creditKey, personId:link.person.pid, chainIndex:link.chainIndex,
    battleId:link.timelineAssignmentRef.scenarioId, side:link.timelineAssignmentRef.side,
    sourceRef:link.sourceRef, timelineAssignmentRef:link.timelineAssignmentRef,
    representedFieldUnitId:representedFieldUnitId, fieldMapping:fieldMapping,
    battleYear:link.battleYear, rankAtResult:link.rankAtResult
  };
}

function _wcResultId(runId, creditKey, mode, personId, slotPid, routeUnitId, mapping, battleYear, rankAtResult, assignmentId) {
  return "wcr-" + _wcHash([runId, creditKey, mode, personId, slotPid, routeUnitId,
    mapping || "", battleYear == null ? "" : battleYear, rankAtResult || "", assignmentId || "", "result-v1"].join("|")).toString(36);
}
function _wcAssignmentId(link, routeUnitId) {
  return "wca-" + _wcHash([link.runId, link.creditKey, link.person.pid, link.ref.slotPid, routeUnitId, "assignment-v1"].join("|")).toString(36);
}
function _wcActiveLink(C, battleId) {
  var J = C && C.loot && C.loot.journey;
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person || J.personId !== J.person.pid) return null;
  if (J.status !== "alive" && J.status !== "wounded") return null;
  if (J.handoff && (J.handoff.state === "pending" || J.handoff.state === "ended")) return null;
  var ref = _wcUnitRef(J.person.unitRef), p = ref && _wcRegistryPersonUnique(C, J.personId);
  if (!ref || !p || !_wcSameUnitRef(p.unitRef, ref) || p.side !== C.side || ref.side !== C.side || ref.battleId !== battleId) return null;
  var chainIndex = Number(C.idx), chain = typeof CHAINS !== "undefined" && CHAINS && Array.isArray(CHAINS[C.side]) ? CHAINS[C.side] : null;
  if (!warCareerRunIdValid(C.runId) || !isFinite(chainIndex) || Math.floor(chainIndex) !== chainIndex || chainIndex < 0 ||
      !chain || chainIndex >= chain.length || chain[chainIndex] !== battleId) return null;
  return { J:J, runId:C.runId, person:p, ref:ref, chainIndex:chainIndex, creditKey:[C.runId, C.side, chainIndex, battleId].join("|") };
}
function _wcRouteUnit(units, side, exactId) {
  var exact = [];
  for (var i = 0; i < (units || []).length; i++) {
    var u = units[i], id = u && _wcSafeId(u.id, 180);
    if (!u || u.side !== side || !id || u.type === "hq") continue;
    if (id === exactId) exact.push({ id:id, unit:u, ordinal:i });
  }
  if (exact.length === 1) return { id:exact[0].id, unit:exact[0].unit, mapping:"exact-source-unit", assignmentId:null };
  if (exact.length > 1) return { ambiguous:true };
  return null;
}
function _wcAssignRouteUnit(link, units) {
  if (!link) return null;
  var rows = [], counts = {};
  for (var i = 0; i < (units || []).length; i++) {
    var u = units[i], id = u && _wcSafeId(u.id, 180);
    if (!u || u.side !== link.ref.side || !id || u.type === "hq") continue;
    rows.push({ id:id, unit:u, ordinal:i });
    counts[id] = (counts[id] || 0) + 1;
  }
  rows.sort(function (a, b) { return a.id < b.id ? -1 : (a.id > b.id ? 1 : a.ordinal - b.ordinal); });
  var selected = null;
  for (var ri = 0; ri < rows.length && !selected; ri++) if (counts[rows[ri].id] === 1) selected = rows[ri];
  if (!selected) return null;
  var assignmentId = _wcAssignmentId(link, selected.id);
  var existing = selected.unit.warCareerAssignment;
  if (existing && (!_wcPlain(existing) || existing.assignmentId !== assignmentId)) return null;
  selected.unit.warCareerAssignment = {
    schema:"cw_war_career_assignment_v1", assignmentId:assignmentId,
    runId:link.runId, creditKey:link.creditKey, personId:link.person.pid,
    battleId:link.ref.battleId, side:link.ref.side, sourceUnitId:link.ref.unitId,
    slotPid:link.ref.slotPid, routeUnitId:selected.id
  };
  return { id:selected.id, unit:selected.unit, mapping:"explicit-career-assignment", assignmentId:assignmentId };
}
function _wcAssignmentMatches(unit, link, route) {
  var a = unit && unit.warCareerAssignment;
  return !!(_wcPlain(a) && route && route.mapping === "explicit-career-assignment" &&
    a.schema === "cw_war_career_assignment_v1" && a.assignmentId === route.assignmentId &&
    a.runId === link.runId && a.creditKey === link.creditKey && a.personId === link.person.pid &&
    a.battleId === link.ref.battleId && a.side === link.ref.side && a.sourceUnitId === link.ref.unitId &&
    a.slotPid === link.ref.slotPid && a.routeUnitId === route.id);
}
function _wcResultEvidence(link, mode, route, year, leaders) {
  year = Number(year);
  var rankAtResult = _wcText(link && link.J && link.J.person && link.J.person.rank || "", 80);
  if (!link || !route || route.ambiguous || !/^(classic|auto|realtime)$/.test(mode) ||
      !/^(exact-source-unit|explicit-career-assignment)$/.test(String(route.mapping || "")) ||
      !isFinite(year) || year < 1860 || year > 1870 || !rankAtResult) return null;
  year = Math.round(year);
  var assignmentId = route.mapping === "explicit-career-assignment" ? _wcSafeId(route.assignmentId, 96) : null;
  if (route.mapping === "explicit-career-assignment" && !assignmentId) return null;
  var resultId = _wcResultId(link.runId, link.creditKey, mode, link.person.pid, link.ref.slotPid, route.id, route.mapping, year, rankAtResult, assignmentId);
  var leaderRows = [];
  for (var li = 0; li < (leaders || []).length; li++) {
    var src = leaders[li], copy = {};
    if (!_wcPlain(src)) continue;
    for (var lk in src) if (_wcOwn(src, lk)) copy[lk] = src[lk];
    copy.resultId = resultId;
    leaderRows.push(copy);
  }
  return {
    schema:"cw_war_career_result_v1", mode:mode, resultId:resultId,
    runId:link.runId, creditKey:link.creditKey,
    battleId:link.ref.battleId, side:link.ref.side, fieldComplete:mode !== "classic",
    participants:[{
      resultId:resultId, personId:link.person.pid, battleId:link.ref.battleId, side:link.ref.side,
      unitId:link.ref.unitId, slot:link.ref.slot, slotPid:link.ref.slotPid,
      routeUnitId:route.id, mapping:route.mapping, assignmentId:assignmentId,
      rankAtResult:rankAtResult, participated:true, active:true, arrived:true
    }],
    leaders:leaderRows,
    battleYear:year
  };
}

/* Classic has no historical unit ids in its R# roster. This guarded adapter
   records an explicit, deterministic source-slot -> field-unit representation;
   it never renames a unit or feeds combat. Result validation later requires the
   linked field unit to remain uniquely present in the completed B. */
function warCareerBuildClassicEvidence(C, B) {
  var bid = _wcBattleId(B, C), link = bid && _wcActiveLink(C, bid);
  if (link) {
    var route = _wcRouteUnit(B && B.units, C.side, link.ref.unitId);
    if (route && route.ambiguous) return null;
    if (!route) route = _wcAssignRouteUnit(link, B && B.units);
    return route ? _wcResultEvidence(link, "classic", route, B && B.bd && B.bd.year, []) : null;
  }
  var timelineLink = bid && _wcTimelineLink(C, bid);
  return timelineLink ? _wcResultEvidenceV2(timelineLink, "classic", B && B.bd && B.bd.year) : null;
}

/* Called once from the campaign conditioning seam. The context-only link is
   inert to combat and identifies the actual tactical unit representing the
   active source-owned slot. */
function warCareerLinkField(C, ctx, field) {
  var bid = _wcSafeId(ctx && ctx.bd && ctx.bd.id, 120), link = bid && _wcActiveLink(C, bid);
  var route = link && _wcRouteUnit(field && field.units, C.side, link.ref.unitId);
  if (route && route.ambiguous) return null;
  if (link && !route && ctx && ctx.scn) route = { id:link.ref.unitId, mapping:"exact-source-unit", assignmentId:null, pending:true };
  if (link && !route) route = _wcAssignRouteUnit(link, field && field.units);
  if (!ctx || !route) return null;
  ctx.warCareerLink = {
    runId:C.runId, creditKey:link.creditKey, personId:link.person.pid,
    battleId:link.ref.battleId, side:link.ref.side, unitId:link.ref.unitId,
    slot:link.ref.slot, slotPid:link.ref.slotPid, routeUnitId:route.id,
    mapping:route.mapping, assignmentId:route.assignmentId || null
  };
  return ctx.warCareerLink;
}

/* A realtime command-slot link is explicit only when the authored leader
   already carries the selected Army Register pid in the same namespace and is
   attached to that person's exact source unit. Same-unit proximity is not
   identity authority; procedural command representatives never qualify. */
function warCareerLinkRealtimeOfficerRoster(C, ctx, roster) {
  if (!Array.isArray(roster)) return roster;
  var bid = _wcSafeId(ctx && ctx.bd && ctx.bd.id, 120), link = bid && _wcActiveLink(C, bid);
  if (!link || link.ref.slot !== "cmd" || !ctx || !ctx.scn) return roster;
  var matches = [], i;
  for (i = 0; i < roster.length; i++) {
    var row = roster[i];
    if (!row || row.side !== C.side) continue;
    if (row.pid === link.person.pid && row.attach === link.ref.unitId) matches.push(i);
  }
  if (matches.length !== 1) return roster;
  var out = roster.slice(), src = roster[matches[0]], copy = {};
  for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) copy[k] = src[k];
  copy.careerPersonId = link.person.pid;
  copy.careerSlotPid = link.ref.slotPid;
  copy.careerUnitId = link.ref.unitId;
  copy.careerBattleId = link.ref.battleId;
  copy.careerRunId = C.runId;
  copy.careerCreditKey = link.creditKey;
  out[matches[0]] = copy;
  return out;
}

function warCareerBuildFieldEvidence(C, ctx, mode, field) {
  if (!ctx || !ctx.warCareerLink || !field || field.phase !== "over" || !/^(auto|realtime)$/.test(mode)) return null;
  var raw = ctx.warCareerLink, bid = _wcSafeId(ctx.bd && ctx.bd.id, 120), link = bid && _wcActiveLink(C, bid);
  if (!link || raw.runId !== C.runId || raw.creditKey !== link.creditKey || raw.personId !== link.person.pid ||
      raw.battleId !== link.ref.battleId || raw.side !== link.ref.side || raw.unitId !== link.ref.unitId ||
      raw.slot !== link.ref.slot || raw.slotPid !== link.ref.slotPid) return null;
  var present = [];
  for (var i = 0; i < (field.units || []).length; i++) {
    var u = field.units[i];
    if (u && u.side === C.side && _wcSafeId(u.id, 180) === raw.routeUnitId && u.type !== "hq") present.push(u);
  }
  if (present.length !== 1) return null;
  var route = { id:raw.routeUnitId, mapping:raw.mapping, assignmentId:raw.assignmentId || null };
  if (raw.mapping === "exact-source-unit") {
    if (raw.routeUnitId !== link.ref.unitId) return null;
  } else if (raw.mapping === "explicit-career-assignment") {
    if (!_wcAssignmentMatches(present[0], link, route)) return null;
  } else return null;
  var leaders = [];
  if (mode === "realtime") for (var li = 0; li < (field.leaders || []).length; li++) {
    var ld = field.leaders[li];
    if (!ld || ld.careerPersonId !== link.person.pid || ld.careerRunId !== link.runId ||
        ld.careerCreditKey !== link.creditKey || ld.careerBattleId !== link.ref.battleId ||
        ld.careerUnitId !== link.ref.unitId || ld.careerSlotPid !== link.ref.slotPid) continue;
    leaders.push({
      personId:ld.careerPersonId, leaderId:_wcSafeId(ld.id, 180),
      runId:ld.careerRunId, creditKey:ld.careerCreditKey,
      battleId:ld.careerBattleId, side:ld.side, unitId:ld.careerUnitId, slotPid:ld.careerSlotPid,
      participated:ld._everActive === true, active:ld._everActive === true, arrived:ld._everActive === true,
      fate:ld.alive === false ? "fallen" : (ld.wounded === true ? "wounded" : "alive")
    });
  }
  return _wcResultEvidence(link, mode, route, ctx.bd && ctx.bd.year, leaders);
}

function _wcParticipationV2FromResult(raw) {
  if (!_wcPlain(raw)) return null;
  return {
    schema:"cw_war_career_participation_v2", resultId:raw.resultId, mode:raw.mode,
    runId:raw.runId, creditKey:raw.creditKey, personId:raw.personId,
    chainIndex:raw.chainIndex, battleId:raw.battleId, side:raw.side,
    sourceRef:raw.sourceRef, timelineAssignmentRef:raw.timelineAssignmentRef,
    representedFieldUnitId:raw.representedFieldUnitId, fieldMapping:raw.fieldMapping,
    battleYear:raw.battleYear, rankAtResult:raw.rankAtResult
  };
}
function _wcParticipationEvidenceV2(C, B, J, raw, fail) {
  if (!_wcExactKeys(raw, _WC_V2_KEYS) || !_wcExactKeys(raw.sourceRef, _WC_SOURCE_REF_KEYS) ||
      !_wcExactKeys(raw.timelineAssignmentRef, _WC_TIMELINE_REF_KEYS)) return fail("malformed-v2-result-evidence");
  var bid = _wcBattleId(B, C), playerSide = B.playerSide || C.side, key = _wcCreditKey(C, B);
  var canonicalYear = Number(B && B.bd && B.bd.year), chainIndex = Number(C.idx);
  if (raw.mode !== "classic" || B.over !== true) return fail("v2-classic-result-incomplete");
  if (!bid || raw.battleId !== bid || (playerSide !== "US" && playerSide !== "CS") || playerSide !== C.side || raw.side !== C.side) return fail("v2-wrong-rung-or-side");
  if (!warCareerRunIdValid(C.runId) || raw.runId !== C.runId || raw.creditKey !== key || raw.personId !== J.personId ||
      raw.chainIndex !== chainIndex || !isFinite(canonicalYear) || Math.round(canonicalYear) !== raw.battleYear) return fail("v2-stale-result-evidence");
  var link = _wcTimelineLink(C, bid);
  if (!link || !_wcFieldsSame(raw.sourceRef, link.sourceRef, _WC_SOURCE_REF_KEYS) ||
      !_wcFieldsSame(raw.timelineAssignmentRef, link.timelineAssignmentRef, _WC_TIMELINE_REF_KEYS) ||
      raw.representedFieldUnitId !== link.timelineAssignmentRef.unitId || raw.fieldMapping !== "exact-timeline-unit" ||
      raw.rankAtResult !== link.rankAtResult) return fail("v2-source-or-timeline-mismatch");
  var participation = _wcSanitizeParticipationV2(_wcParticipationV2FromResult(raw), C);
  if (!participation || participation.resultId !== raw.resultId) return fail("invalid-v2-result-identity");
  return { ok:true, qualifying:true, reason:"explicit-classic-timeline-result", participation:participation };
}

/* A result-owned receipt, not the static catalog, is the cross-mode authority.
   The catalog is used only to verify that the named person and slot are still
   unique. This is a pure read and aggregate casualties are never consulted. */
function warCareerParticipationEvidence(C, B) {
  var fail = function (reason) { return { ok:false, qualifying:false, reason:reason, participation:null }; };
  if (!C || !B || B.fromCampaign !== true) return fail("noncampaign");
  var J = C.loot && C.loot.journey;
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person || J.personId !== J.person.pid) return fail("inactive-or-aliased");
  if (J.status !== "alive" && J.status !== "wounded") return fail("person-not-present");
  if (J.handoff && (J.handoff.state === "pending" || J.handoff.state === "ended")) return fail("handoff-unresolved");
  var raw = B.warCareerEvidence;
  if (_wcPlain(raw) && raw.schema === "cw_war_career_result_v2") return _wcParticipationEvidenceV2(C, B, J, raw, fail);
  var ref = _wcUnitRef(J.person.unitRef);
  if (!ref) return fail("missing-unit-ref");
  if (!_wcPlain(raw) || raw.schema !== "cw_war_career_result_v1" || !/^(classic|auto|realtime)$/.test(String(raw.mode || "")) ||
      !Array.isArray(raw.participants) || raw.participants.length !== 1 || !Array.isArray(raw.leaders)) return fail("missing-or-malformed-result-evidence");
  var bid = _wcBattleId(B, C), playerSide = (B.playerSide || C.side), key = _wcCreditKey(C, B), row = raw.participants[0];
  if (!bid || bid !== ref.battleId || raw.battleId !== bid) return fail("nonparticipating-unit");
  if ((playerSide !== "US" && playerSide !== "CS") || playerSide !== C.side || ref.side !== playerSide || raw.side !== playerSide) return fail("wrong-side");
  if (!warCareerRunIdValid(C.runId) || raw.runId !== C.runId || raw.creditKey !== key) return fail("stale-result-evidence");
  if (!_wcPlain(row) || row.personId !== J.personId || row.battleId !== bid || row.side !== ref.side || row.unitId !== ref.unitId ||
      row.slot !== ref.slot || row.slotPid !== ref.slotPid || row.participated !== true || row.active !== true || row.arrived !== true) return fail("mismatched-participant-link");
  var routeUnitId = _wcSafeId(row.routeUnitId, 180), mapping = /^(exact-source-unit|explicit-career-assignment)$/.test(String(row.mapping || "")) ? String(row.mapping) : "";
  var assignmentId = mapping === "explicit-career-assignment" ? _wcSafeId(row.assignmentId, 96) : null;
  var rankAtResult = _wcText(row.rankAtResult || "", 80), currentRank = _wcText(J.person.rank || "", 80);
  var canonicalYear = Number(B && B.bd && B.bd.year), year = Number(raw.battleYear);
  if (!isFinite(canonicalYear) || canonicalYear < 1860 || canonicalYear > 1870 || !isFinite(year) || Math.round(year) !== Math.round(canonicalYear)) return fail("invalid-battle-year");
  canonicalYear = Math.round(canonicalYear);
  var resultId = _wcResultId(C.runId, key, raw.mode, J.personId, ref.slotPid, routeUnitId, mapping, canonicalYear, rankAtResult, assignmentId);
  if (!routeUnitId || !mapping || !rankAtResult || rankAtResult !== currentRank || (mapping === "exact-source-unit" && (routeUnitId !== ref.unitId || row.assignmentId != null)) ||
      (mapping === "explicit-career-assignment" && !assignmentId) || raw.resultId !== resultId || row.resultId !== resultId) return fail("invalid-result-identity");
  if (raw.mode === "classic") {
    var routeMatches = [];
    for (var ui = 0; ui < (B.units || []).length; ui++) {
      var u = B.units[ui];
      if (u && u.side === C.side && u.type !== "hq" && _wcSafeId(u.id, 180) === routeUnitId) routeMatches.push(u);
    }
    if (B.over !== true || routeMatches.length !== 1) return fail("classic-unit-not-in-result");
    var route = { id:routeUnitId, mapping:mapping, assignmentId:assignmentId };
    var classicLink = _wcActiveLink(C, bid);
    if (!classicLink || (mapping === "explicit-career-assignment" && !_wcAssignmentMatches(routeMatches[0], classicLink, route))) return fail("classic-assignment-missing");
  } else if (raw.fieldComplete !== true || B.over !== true) return fail("field-result-incomplete");
  var chainIndex = Number(C.idx), chain = typeof CHAINS !== "undefined" && CHAINS && Array.isArray(CHAINS[C.side]) ? CHAINS[C.side] : null;
  if (!isFinite(chainIndex) || Math.floor(chainIndex) !== chainIndex || chainIndex < 0 || !chain || chainIndex >= chain.length || chain[chainIndex] !== bid) return fail("stale-rung");
  var p = _wcRegistryPersonUnique(C, J.personId);
  if (!p || !_wcSameUnitRef(p.unitRef, ref) || p.side !== C.side) return fail("ambiguous-person-unit");
  var year = Number(raw.battleYear);
  return {
    ok:true, qualifying:true, reason:"explicit-" + raw.mode + "-result",
    participation:{
      schema:"cw_war_career_participation_v1", resultId:resultId, mode:raw.mode,
      runId:C.runId, creditKey:key, personId:J.personId, chainIndex:chainIndex,
      battleId:bid, side:ref.side, unitId:ref.unitId, slot:ref.slot, slotPid:ref.slotPid,
      routeUnitId:routeUnitId, mapping:mapping, assignmentId:assignmentId,
      battleYear:canonicalYear, rankAtResult:rankAtResult
    }
  };
}

function _wcParticipationResultRef(participation) {
  if (participation && participation.schema === "cw_war_career_participation_v2") {
    var timeline = participation.timelineAssignmentRef;
    return _wcUnitRef(timeline && {
      battleId:timeline.scenarioId, side:timeline.side, unitId:timeline.unitId,
      slot:timeline.slot, slotPid:timeline.slotPid
    });
  }
  return _wcUnitRef(participation);
}
function _wcParticipationSourceRef(participation) {
  if (participation && participation.schema === "cw_war_career_participation_v2") return _wcUnitRef(participation.sourceRef);
  return _wcUnitRef(participation);
}
function _wcParticipationSlotPid(participation) {
  var ref = _wcParticipationResultRef(participation);
  return ref ? ref.slotPid : "";
}

function _wcLeaderFateEvidence(J, B, participation) {
  var raw = B && B.warCareerEvidence;
  if (!participation || participation.mode !== "realtime" || participation.slot !== "cmd" || !_wcPlain(raw) || !Array.isArray(raw.leaders)) return { ok:false, reason:"missing-realtime-leader-link" };
  var matches = [];
  for (var i = 0; i < raw.leaders.length; i++) {
    var row = raw.leaders[i];
    if (!_wcPlain(row)) return { ok:false, reason:"malformed-leader-row" };
    if (row.personId === J.personId) matches.push(row);
  }
  if (matches.length !== 1) return { ok:false, reason:matches.length ? "ambiguous-leader-id" : "wrong-leader-person-id" };
  var m = matches[0], fate = /^(alive|wounded|captured|fallen)$/.test(String(m.fate || "")) ? String(m.fate) : "";
  if (!fate || !_wcSafeId(m.leaderId, 180) || m.participated !== true || m.active !== true || m.arrived !== true ||
      m.resultId !== participation.resultId || m.runId !== participation.runId || m.creditKey !== participation.creditKey ||
      m.personId !== participation.personId || m.battleId !== participation.battleId || m.side !== participation.side ||
      m.unitId !== participation.unitId || m.slotPid !== participation.slotPid) return { ok:false, reason:"mismatched-leader-link" };
  return { ok:true, fate:fate, leaderId:m.leaderId };
}

function warCareerDeterministicFate(participation, outcome, type) {
  if (!participation) return null;
  var roll = _wcHash([participation.runId, participation.creditKey, participation.personId,
    _wcParticipationSlotPid(participation), "personal-fate"].join("|")) % 1000;
  var fallen = 8, captured = 0, wounded = 140;
  if (outcome === "defeat") {
    fallen = type === "decisive" ? 35 : 20;
    captured = type === "decisive" ? 180 : 100;
    wounded = type === "decisive" ? 430 : 300;
  } else if (outcome === "draw") { fallen = 10; wounded = 180; }
  else if (outcome === "victory" && type === "decisive") { fallen = 5; wounded = 100; }
  if (roll < fallen) return "fallen";
  if (captured && roll < captured) return "captured";
  if (roll < wounded) return "wounded";
  return "alive";
}

/* PURE-FIRST: no init, ordinal, save, storage, campaign, or battle write. */
function warCareerPreflightFate(C, B, winnerSide, type) {
  var J = C && C.loot && C.loot.journey, key = C && B ? _wcCreditKey(C, B) : "";
  var outcome = _wcOutcome(winnerSide, C, B, winnerSide === null ? null : winnerSide === (B && (B.playerSide || (C && C.side))));
  var existing = J && key ? _wcCreditFor(J, key) : null;
  if (existing && existing.qualifying) return { qualifying:false, fate:null, reason:"credit-already-qualified", participation:null, duplicate:true, outcome:outcome };
  if (J && key && _wcRecoveredCaptureForKey(J, key)) return { qualifying:false, fate:null, reason:"recovery-rung-closed", participation:null, duplicate:true, outcome:outcome };
  var participation = warCareerParticipationEvidence(C, B);
  if (!participation.ok) return { qualifying:false, fate:null, reason:participation.reason, participation:null, outcome:outcome };
  var leader = null;
  if (participation.participation.mode === "realtime" && participation.participation.slot === "cmd") {
    leader = _wcLeaderFateEvidence(J, B, participation.participation);
    if (!leader.ok) return { qualifying:false, fate:null, reason:leader.reason, participation:null, outcome:outcome };
  }
  var fate = leader ? leader.fate : warCareerDeterministicFate(participation.participation, outcome, _wcText(type || "", 32));
  return { qualifying:true, fate:fate, reason:leader ? "exact-realtime-leader" : "explicit-unit-deterministic", participation:participation.participation, outcome:outcome, leaderId:leader && leader.leaderId || null };
}

function _wcRankOrdinal(rank) {
  var r = typeof _ssRankNorm === "function" ? _ssRankNorm(rank) : _wcText(rank, 80).toLowerCase();
  var rows = [
    ["private","pvt","bugler","musician","drummer"], ["corporal","cpl"],
    ["sergeant","sgt","first sergeant","1st sgt","sergeant major"],
    ["lieutenant","lt","1st lt","2nd lt","first lieutenant","second lieutenant"],
    ["captain","capt"], ["major","maj"], ["lt col","lt. col","lieutenant colonel"],
    ["colonel","col"], ["brig gen","brig. gen","brigadier","brigadier general"],
    ["maj gen","maj. gen","major general"], ["lt gen","lt. gen","lieutenant general"], ["general","gen"]
  ];
  for (var i = 0; i < rows.length; i++) for (var j = 0; j < rows[i].length; j++) if (rows[i][j] === r) return i;
  return 99;
}

/* D406 advancement is reconstructed from receipts. Saved totals, alternate
   rank, billet rows, and promotion count are projections, never authority. */
var _WC_BILLET_KEYS = [
  "schema","billetId","ordinal","personId","side","rank","roleId",
  "billetCode","label","provenance","timelineLabel","authority",
  "creditKey","eventId","chainIndex","scenarioId","battleYear"
];
function _wcRoleBand(rank) {
  var n = _wcRankOrdinal(rank), code = "", label = "", role = "";
  if (n === 0 || n === 1) { role = "rank-and-file"; code = "company-ranks"; label = "Company ranks"; }
  else if (n === 2) { role = "junior-command"; code = "company-nco"; label = "Company noncommissioned officer"; }
  else if (n === 3 || n === 4) { role = "junior-command"; code = "company-officer"; label = "Company officer"; }
  else if (n >= 5 && n <= 7) { role = "field-command"; code = "field-officer"; label = "Field officer"; }
  else if (n === 8) { role = "general-command"; code = "general-officer"; label = "General officer"; }
  return role ? { roleId:role, billetCode:code, label:label } : null;
}
function _wcBilletId(row) {
  return "wcb-" + _wcHash([
    "billet-v1", row.ordinal, row.personId, row.side, row.rank, row.roleId,
    row.billetCode, row.authority, row.creditKey || "", row.eventId || "",
    row.chainIndex == null ? "" : row.chainIndex, row.scenarioId || "",
    row.battleYear == null ? "" : row.battleYear
  ].join("|")).toString(36);
}
function _wcBilletRow(personId, side, rank, ordinal, authority, credit, eventId, scenarioId, battleYear) {
  var band = _wcRoleBand(rank), chainIndex = credit ? Number(credit.chainIndex) : null;
  if (!band || !_wcSafeId(personId, 180) || (side !== "US" && side !== "CS") ||
      !isFinite(ordinal) || Math.floor(ordinal) !== ordinal || ordinal < 1 || ordinal > 12 ||
      !/^(career-start|qualifying-credit)$/.test(String(authority || ""))) return null;
  if (authority === "qualifying-credit" && (!credit || !_wcSafeId(credit.creditKey, 220) ||
      !_wcSafeId(eventId, 180) || !isFinite(chainIndex) || Math.floor(chainIndex) !== chainIndex || chainIndex < 0)) return null;
  var row = {
    schema:"cw_war_career_billet_v1", billetId:"", ordinal:ordinal,
    personId:personId, side:side, rank:_wcText(rank, 80), roleId:band.roleId,
    billetCode:band.billetCode, label:band.label, provenance:"Inferred",
    timelineLabel:"Your Timeline", authority:authority,
    creditKey:authority === "qualifying-credit" ? credit.creditKey : null,
    eventId:authority === "qualifying-credit" ? eventId : (eventId || null),
    chainIndex:authority === "qualifying-credit" ? chainIndex : null,
    scenarioId:_wcSafeId(scenarioId, 120) || null,
    battleYear:battleYear != null && isFinite(battleYear) ? Math.round(Number(battleYear)) : null
  };
  row.billetId = _wcBilletId(row);
  return row;
}
function _wcBilletValid(row) {
  if (!_wcExactKeys(row, _WC_BILLET_KEYS) || row.schema !== "cw_war_career_billet_v1" ||
      !_wcSafeId(row.billetId, 96) || !_wcSafeId(row.personId, 180) ||
      (row.side !== "US" && row.side !== "CS") || !_wcText(row.rank, 80) ||
      row.provenance !== "Inferred" || row.timelineLabel !== "Your Timeline" ||
      !isFinite(row.ordinal) || Math.floor(row.ordinal) !== row.ordinal || row.ordinal < 1 || row.ordinal > 12) return false;
  var band = _wcRoleBand(row.rank);
  if (!band || band.roleId !== row.roleId || band.billetCode !== row.billetCode || band.label !== row.label) return false;
  if (row.authority === "career-start") {
    if (row.creditKey !== null || row.chainIndex !== null) return false;
  } else if (row.authority === "qualifying-credit") {
    if (!_wcSafeId(row.creditKey, 220) || !_wcSafeId(row.eventId, 180) ||
        !isFinite(row.chainIndex) || Math.floor(row.chainIndex) !== row.chainIndex || row.chainIndex < 0) return false;
  } else return false;
  if (row.scenarioId != null && !_wcSafeId(row.scenarioId, 120)) return false;
  if (row.battleYear != null && (!isFinite(row.battleYear) || Math.floor(row.battleYear) !== row.battleYear || row.battleYear < 1860 || row.battleYear > 1870)) return false;
  return row.billetId === _wcBilletId(row);
}
function _wcBilletSame(a, b) {
  if (!_wcBilletValid(a) || !_wcBilletValid(b)) return false;
  for (var i = 0; i < _WC_BILLET_KEYS.length; i++) if (a[_WC_BILLET_KEYS[i]] !== b[_WC_BILLET_KEYS[i]]) return false;
  return true;
}
function _wcBilletCopy(row) {
  if (!_wcBilletValid(row)) return null;
  var out = {};
  for (var i = 0; i < _WC_BILLET_KEYS.length; i++) out[_WC_BILLET_KEYS[i]] = row[_WC_BILLET_KEYS[i]];
  return out;
}
function warCareerCreditAward(credit) {
  if (!credit || credit.qualifying !== true || credit.fate !== "alive") return { merit:0, reputation:0 };
  if (credit.outcome === "victory" && credit.type === "decisive") return { merit:4, reputation:3 };
  if (credit.outcome === "victory") return { merit:3, reputation:2 };
  if (credit.outcome === "draw") return { merit:1, reputation:0 };
  if (credit.outcome === "defeat") return { merit:0, reputation:-1 };
  return { merit:0, reputation:0 };
}
function _wcNextCareerRank(rank) {
  var n = _wcRankOrdinal(rank);
  if (n === 0 || n === 1) return "Sergeant";
  if (n === 2 || n === 3) return "Captain";
  if (n === 4) return "Major";
  if (n === 5) return "Lt. Col.";
  if (n === 6) return "Colonel";
  if (n === 7) return "Brig. Gen.";
  return "";
}
function _wcPromotionSlotEligible(rank, next, slot) {
  var n = _wcRankOrdinal(rank);
  if (!/^(pvt|nco|cmd)$/.test(String(slot || ""))) return false;
  if (next === "Sergeant") return true;
  if (next === "Captain" && n === 2) return slot === "nco" || slot === "cmd";
  if (next === "Captain" && n === 3) return slot === "cmd";
  return slot === "cmd";
}
function _wcCareerOrigin(J, personId) {
  var events = J && Array.isArray(J.events) ? J.events : [];
  for (var i = 0; i < events.length; i++) if (events[i] && events[i].kind === "start" && events[i].personId === personId) return events[i].eventId || null;
  var H = J && J.handoff, lineage = J && Array.isArray(J.lineage) ? J.lineage : [];
  if (H && H.state === "completed" && H.selectedPersonId === personId) {
    for (var li = 0; li < lineage.length; li++) if (lineage[li] && lineage[li].successorId === personId &&
        lineage[li].personId === H.fallenPersonId && lineage[li].resultEventId === H.resultEventId &&
        lineage[li].creditKey === H.creditKey) return null;
  }
  return false;
}
function _wcCanonicalCareerPerson(C, personId) {
  var person = _wcRegistryPersonUnique(C, personId), source = person && _wcSourceRefFromPerson(person);
  if (!person || !source || person.pid !== personId || person.side !== C.side || source.side !== C.side) return null;
  return { person:person, sourceRef:source };
}
function _wcAdvancementAuthority(C, J, credit, event, derivedRank, canonical) {
  var p = credit && credit.participation, ref = _wcParticipationResultRef(p);
  if (!C || !J || !credit || !event || !canonical || credit.qualifying !== true || credit.fate !== "alive" ||
      event.qualifying !== true || event.fate !== "alive" || event.status !== "alive" ||
      credit.personId !== canonical.person.pid || event.personId !== canonical.person.pid ||
      credit.side !== C.side || event.creditKey !== credit.creditKey || credit.eventId !== event.eventId ||
      event.outcome !== credit.outcome || event.type !== credit.type || !p || !event.participation ||
      event.participation.resultId !== p.resultId || JSON.stringify(event.participation) !== JSON.stringify(p) ||
      p.personId !== canonical.person.pid || p.runId !== C.runId || p.creditKey !== credit.creditKey ||
      p.side !== C.side || p.chainIndex !== credit.chainIndex || p.battleId !== credit.scenarioId ||
      credit.creditKey !== [C.runId, C.side, credit.chainIndex, credit.scenarioId].join("|") || !ref || ref.side !== C.side ||
      !_wcRankCompatible(p.rankAtResult, derivedRank) || !_wcServiceWindowValid(canonical.sourceRef, p.battleYear)) return null;
  if (p.schema === "cw_war_career_participation_v2") {
    var sourceProof = _wcValidateCanonicalSource(C, canonical.person.pid, C.side, p.sourceRef);
    if (!sourceProof || !_wcValidateTimelineAssignment(C, canonical.person.pid, sourceProof.sourceRef,
        p.timelineAssignmentRef, p.representedFieldUnitId, p.battleYear, p.rankAtResult, null)) return null;
  } else if (p.schema === "cw_war_career_participation_v1") {
    var canonicalRef = _wcUnitRef(canonical.person.unitRef);
    if (!canonicalRef || !_wcSameUnitRef(canonicalRef, p) || !_wcSameUnitRef(ref, p)) return null;
  } else return null;
  return { event:event, participation:p, resultRef:ref, battleYear:Number(p.battleYear) };
}
function _wcCalculateAdvancement(C, J, personId) {
  var canonical = C && J ? _wcCanonicalCareerPerson(C, personId) : null;
  var origin = canonical ? _wcCareerOrigin(J, personId) : false;
  var result = { ok:false, rank:canonical ? canonical.person.rank : "", merit:0, reputation:0,
    promotionCount:0, roleHistory:[], currentBillet:null, awards:[], latestQualifying:null };
  if (!canonical || origin === false) return result;
  var startRef = _wcUnitRef(canonical.person.unitRef), startYear = startRef ? _wcCanonicalBattleYear(startRef.battleId) : null;
  if (startYear == null && canonical.sourceRef.serviceYear != null) startYear = canonical.sourceRef.serviceYear;
  var first = _wcBilletRow(personId, C.side, result.rank, 1, "career-start", null,
    typeof origin === "string" ? origin : null, startRef && startRef.battleId, startYear);
  if (first) result.roleHistory.push(first);
  var events = Array.isArray(J.events) ? J.events : [], eventsById = {};
  for (var ei = 0; ei < events.length; ei++) if (events[ei] && events[ei].eventId) eventsById[events[ei].eventId] = events[ei];
  var credits = Array.isArray(J.creditLedger) ? J.creditLedger : [];
  for (var ci = 0; ci < credits.length; ci++) {
    var credit = credits[ci];
    if (!credit || credit.personId !== personId) continue;
    var authority = _wcAdvancementAuthority(C, J, credit, eventsById[credit.eventId], result.rank, canonical);
    var award = authority ? warCareerCreditAward(credit) : { merit:0, reputation:0 };
    result.awards.push({ credit:credit, event:eventsById[credit.eventId] || null, merit:award.merit, reputation:award.reputation });
    if (!authority) continue;
    result.merit = Math.max(0, Math.min(128, result.merit + award.merit));
    result.reputation = Math.max(-64, Math.min(96, result.reputation + award.reputation));
    /* D408 §17: the latest independently validated qualifying receipt (highest chain
       rung) is the ONLY date authority for political access. Derived here, never saved. */
    if (!result.latestQualifying || Number(credit.chainIndex) > result.latestQualifying.chainIndex) {
      result.latestQualifying = { chainIndex:Number(credit.chainIndex), scenarioId:credit.scenarioId,
        creditKey:credit.creditKey, battleYear:authority.battleYear };
    }
    var next = _wcNextCareerRank(result.rank), threshold = 4 * (result.promotionCount + 1);
    if (!next || result.merit < threshold || result.reputation < 0 ||
        !_wcPromotionSlotEligible(result.rank, next, authority.resultRef.slot)) continue;
    result.rank = next;
    result.promotionCount++;
    var billet = _wcBilletRow(personId, C.side, result.rank, result.roleHistory.length + 1,
      "qualifying-credit", credit, credit.eventId, credit.scenarioId, authority.battleYear);
    if (billet) result.roleHistory.push(billet);
  }
  result.currentBillet = result.roleHistory.length ? _wcBilletCopy(result.roleHistory[result.roleHistory.length - 1]) : null;
  result.ok = true;
  return result;
}
function warCareerDeriveAdvancement(C, J) {
  if (!J || !Array.isArray(J.events) || !Array.isArray(J.creditLedger)) return null;
  for (var ei = 0; ei < J.events.length; ei++) if (J.events[ei]) { J.events[ei].merit = 0; J.events[ei].reputation = 0; }
  for (var ci = 0; ci < J.creditLedger.length; ci++) if (J.creditLedger[ci]) { J.creditLedger[ci].merit = 0; J.creditLedger[ci].reputation = 0; }
  var derived = _wcCalculateAdvancement(C, J, J.personId);
  J.merit = derived.ok ? derived.merit : 0;
  J.reputation = derived.ok ? derived.reputation : 0;
  J.promotionCount = derived.ok ? derived.promotionCount : 0;
  J.roleHistory = derived.ok ? derived.roleHistory : [];
  J.currentBillet = derived.ok ? derived.currentBillet : null;
  if (derived.rank && J.person) {
    var sourceRank = _wcCanonicalCareerPerson(C, J.personId);
    J.person.rank = derived.rank;
    delete J.person.promotedFrom;
    if (sourceRank && _wcRankOrdinal(sourceRank.person.rank) !== _wcRankOrdinal(derived.rank)) J.person.promotedFrom = sourceRank.person.rank;
    if (sourceRank) {
      var serviceKeys = ["serviceStart","serviceEnd","serviceYear"];
      for (var sk = 0; sk < serviceKeys.length; sk++) {
        var key = serviceKeys[sk], value = _wcServiceValue(sourceRank.person[key]);
        if (value == null) delete J.person[key]; else if (value !== undefined) J.person[key] = value;
      }
    }
  }
  for (var ai = 0; ai < derived.awards.length; ai++) {
    var row = derived.awards[ai];
    row.credit.merit = row.merit; row.credit.reputation = row.reputation;
    if (row.event) { row.event.merit = row.merit; row.event.reputation = row.reputation; }
  }
  return derived;
}
function _wcProvenanceRank(p) {
  var prov = _wcText(p && p.provenance || "", 40);
  if (prov === "Verified") return 0;
  if (prov === "Disputed") return 1;
  if (prov === "Inferred") return 2;
  return 99;
}
function _wcKnownPresent(p, year) {
  if (!p || p.present === false) return false;
  if (p.status && _wcText(p.status, 24).toLowerCase() !== "alive") return false;
  var start = Number(p.serviceStart), end = Number(p.serviceEnd), one = Number(p.serviceYear);
  if (isFinite(start) && year != null && year < start) return false;
  if (isFinite(end) && year != null && year > end) return false;
  if (isFinite(one) && year != null && one !== year) return false;
  return true;
}
function _wcHierarchyDistance(base, candidate) {
  var br = _wcUnitRef(base && base.unitRef), cr = _wcUnitRef(candidate && candidate.unitRef);
  if (!br || !cr || br.battleId !== cr.battleId || br.side !== cr.side) return 99;
  var bt = base && base.team || {}, ct = candidate && candidate.team || {};
  var bb = _wcText(bt.brigade || "", 120), cb = _wcText(ct.brigade || "", 120);
  var brg = _wcText(bt.regiment || "", 120), crg = _wcText(ct.regiment || "", 120);
  var bc = _wcText(bt.company || "", 80), cc = _wcText(ct.company || "", 80);
  var placeholder = { "Representative company":1, "Battery":1 };
  if (bc && cc && !placeholder[bc] && !placeholder[cc] && bc === cc &&
      (!brg || brg === crg) && (!bb || bb === cb)) return 0;
  if (brg && crg && brg === crg && (!bb || bb === cb)) return 1;
  if (bb && cb && bb === cb) return 2;
  return 99;
}

/* Pure candidate materialization. The persisted handoff stores only these first
   bounded ids; render/load never reruns this selector. */
function warCareerComradeCandidates(C, J, people, participation, basePersonId) {
  if (!C || !J || !J.person) return [];
  if (!Array.isArray(people)) {
    var reg = typeof ssPersonRegistry === "function" ? ssPersonRegistry(C) : null;
    people = reg && Array.isArray(reg.people) ? reg.people : [];
  }
  participation = participation || J.lastParticipation;
  var isV2 = !!(participation && participation.schema === "cw_war_career_participation_v2");
  var ref = participation && _wcParticipationResultRef(participation), sourceRef = participation && _wcParticipationSourceRef(participation);
  var year = participation && participation.battleYear != null ? Number(participation.battleYear) : null;
  var selectionRank = _wcText(participation && participation.rankAtResult || "", 80);
  var basePid = _wcSafeId(basePersonId || J.personId, 180), canonicalBase = null, baseCount = 0;
  for (var bi = 0; bi < people.length; bi++) if (people[bi] && people[bi].pid === basePid) { canonicalBase = people[bi]; baseCount++; }
  if (!ref || !sourceRef || !selectionRank || !isFinite(year) || year < 1860 || year > 1870 || baseCount !== 1 || !canonicalBase || canonicalBase.side !== C.side) return [];
  if (isV2) {
    if (basePid !== participation.personId || !_wcSameUnitRef(canonicalBase.unitRef, sourceRef)) return [];
    if (basePid === J.personId && (!_wcSameUnitRef(J.person.unitRef, sourceRef) || J.person.side !== C.side)) return [];
  } else {
    if (!_wcSameUnitRef(canonicalBase.unitRef, ref)) return [];
    if (basePid === J.personId && (!_wcSameUnitRef(J.person.unitRef, ref) || J.person.side !== C.side)) return [];
  }
  var prior = {}, pidCount = {}, slotCount = {}, i;
  for (i = 0; i < (J.lineage || []).length; i++) if (J.lineage[i] && J.lineage[i].personId) prior[J.lineage[i].personId] = true;
  for (i = 0; i < people.length; i++) {
    var countP = people[i], countRef = countP && _wcUnitRef(countP.unitRef);
    if (countP && countP.pid) pidCount[countP.pid] = (pidCount[countP.pid] || 0) + 1;
    if (countRef) slotCount[countRef.slotPid] = (slotCount[countRef.slotPid] || 0) + 1;
  }
  var representedBase = canonicalBase;
  if (isV2) {
    representedBase = null;
    for (i = 0; i < people.length; i++) {
      var representedRef = people[i] && _wcUnitRef(people[i].unitRef);
      if (representedRef && representedRef.slotPid === ref.slotPid) {
        if (representedBase) return [];
        representedBase = people[i];
      }
    }
    if (!representedBase || representedBase.side !== C.side) return [];
  }
  var hierarchyBase = { unitRef:ref, team:representedBase.team || {}, rank:selectionRank };
  var currentRank = _wcRankOrdinal(hierarchyBase.rank), out = [];
  for (i = 0; i < people.length; i++) {
    var p = people[i], pr = p && _wcUnitRef(p.unitRef), provRank = _wcProvenanceRank(p);
    if (!p || !p.pid || p.pid === basePid || (isV2 && pr && pr.slotPid === ref.slotPid) || prior[p.pid] || pidCount[p.pid] !== 1 || !pr || slotCount[pr.slotPid] !== 1) continue;
    if (p.side !== C.side || pr.side !== C.side || !_wcKnownPresent(p, year)) continue;
    if (provRank === 99 || (!p.generated && (!Array.isArray(p.sources) || !p.sources.length))) continue;
    var distance = _wcHierarchyDistance(hierarchyBase, p);
    if (distance > 2) continue;
    out.push({ pid:p.pid, hierarchyDistance:distance, generated:p.generated ? 1 : 0,
      rankDistance:Math.abs(_wcRankOrdinal(p.rank) - currentRank) });
  }
  out.sort(function (a, b) {
    if (a.hierarchyDistance !== b.hierarchyDistance) return a.hierarchyDistance - b.hierarchyDistance;
    if (a.generated !== b.generated) return a.generated - b.generated;
    if (a.rankDistance !== b.rankDistance) return a.rankDistance - b.rankDistance;
    return a.pid < b.pid ? -1 : (a.pid > b.pid ? 1 : 0);
  });
  return out.slice(0, _WC_HANDOFF_MAX);
}

function warCareerStart(C, pid) {
  var J = warCareerInit(C);
  var p = (C && typeof ssFindPerson === "function") ? ssFindPerson(C, pid) : null;
  var can = warCareerCanStartPerson(C, p, J);
  if (!can.ok) return can;
  var L = C.loot;
  var bid = _wcBattleId(null, C);
  var bname = _wcBattleName(null, bid);
  if (!can.converting) {
    J = {
      enabled:true,
      personId:p.pid,
      battleId:bid || null,
      startBattleId:bid || null,
      currentBattleId:bid || null,
      lastBattleId:null,
      lastBattleName:"",
      lastOutcome:"",
      lastTurn:typeof _lootTurn === "function" ? _lootTurn(C) : 0,
      startedTurn:typeof _lootTurn === "function" ? _lootTurn(C) : 0,
      status:"alive",
      battles:0,
      promotionCount:0,
      person:typeof _ssJourneySnapshot === "function" ? _ssJourneySnapshot(p, true) : p,
      log:[],
      career:[]
    };
    L.journey = J;
  }
  J.careerVersion = 1;
  J.merit = 0;
  J.reputation = 0;
  J.eventOrdinal = Math.max(0, Math.round(Number(J.eventOrdinal) || 0));
  if (!Array.isArray(J.events)) J.events = [];
  if (!Array.isArray(J.creditLedger)) J.creditLedger = [];
  J.roleHistory = [];
  J.relationships = {};
  J.lineage = [];
  J.handoff = null;
  J.lastParticipation = null;
  J.terminal = null;
  J.currentBillet = null;
  var note = can.converting
    ? "This existing Journey was explicitly converted to War Career v1; prior entries remain compatibility history."
    : "War Career begins with " + p.name + (bname ? " before " + bname : "") + ".";
  var startEvent = {
    eventId:_wcEventId(C, J), ordinal:J.eventOrdinal, kind:"start", creditKey:null,
    personId:p.pid,
    scenarioId:bid || null, battleName:bname, outcome:"start", type:"", status:"alive",
    fate:"alive", qualifying:false, merit:0, reputation:0, note:note
  };
  _wcPushEvent(J, startEvent);
  if (typeof _ssPushCareer === "function") {
    _ssPushCareer(J, {
      turn:typeof _lootTurn === "function" ? _lootTurn(C) : 0,
      battleId:bid || null, battleName:bname, outcome:"start", status:"alive",
      rankAfter:p.rank || "Soldier", promoted:false, note:note
    });
  }
  if (typeof _ssCleanJourney === "function") _ssCleanJourney(C, L);
  J = L.journey;
  if (typeof _ssSyncPersonCareer === "function") _ssSyncPersonCareer(L);
  if (typeof _pdLog === "function") _pdLog(C, "War Career: " + note);
  return { ok:true, converting:can.converting, person:p, journey:J };
}

function _wcLineageRow(J, handoff, successorId, participation) {
  var p = J && J.person || {}, ref = _wcUnitRef(handoff && handoff.unitRef);
  var rankAtResult = _wcText(participation && participation.rankAtResult || "", 80);
  if (!handoff || !ref || !p.pid || !rankAtResult || !participation ||
      participation.personId !== p.pid || participation.creditKey !== handoff.creditKey) return null;
  return {
    lineageId:handoff.handoffId + ":lineage", personId:p.pid, name:_wcText(p.name || "", 120),
    rank:rankAtResult, side:ref.side,
    provenance:_wcText(p.provenance || "", 40), status:"fallen", unitRef:ref,
    resultEventId:handoff.resultEventId, creditKey:handoff.creditKey,
    successorId:successorId || null
  };
}
function _wcBeginHandoff(C, J, event, participation) {
  var rows = warCareerComradeCandidates(C, J, null, participation), ids = [];
  for (var i = 0; i < rows.length; i++) ids.push(rows[i].pid);
  J.handoff = {
    handoffId:event.eventId + ":handoff", state:ids.length ? "pending" : "ended",
    fallenPersonId:J.personId, resultEventId:event.eventId, creditKey:event.creditKey,
    scenarioId:participation.battleId, side:participation.side,
    unitRef:_wcParticipationResultRef(participation), candidateIds:ids, selectedPersonId:null,
    reason:ids.length ? null : "No eligible comrade could be identified"
  };
  return J.handoff;
}
function _wcRegistryPersonUnique(C, pid) {
  var reg = typeof ssPersonRegistry === "function" ? ssPersonRegistry(C) : null;
  var people = reg && Array.isArray(reg.people) ? reg.people : [], found = null, n = 0;
  for (var i = 0; i < people.length; i++) if (people[i] && people[i].pid === pid) { found = people[i]; n++; }
  return n === 1 ? found : null;
}

/* D407 relationship memory. The command system supplies one exact result
   target before this module observes the result. Its reputation and every
   other command field remain separate NPC state. */
function _wcRelationshipRegistryTarget(C, targetId, actorPersonId) {
  targetId = _wcSafeId(targetId, 180);
  actorPersonId = _wcSafeId(actorPersonId, 180);
  if (!C || !targetId || !actorPersonId || targetId === actorPersonId) return null;
  var p = _wcRegistryPersonUnique(C, targetId);
  if (!p || p.pid !== targetId || p.side !== C.side || p.role !== "army commander") return null;
  return p;
}
function _wcRelationshipCommandTarget(C, J) {
  var commandState = C && C.president && C.president.command;
  var targetId = _wcSafeId(commandState && commandState._activeId, 180);
  if (!targetId || !J || J.personId === targetId ||
      typeof cmdActiveId !== "function" || cmdActiveId(C) !== targetId ||
      typeof cmdActiveGeneral !== "function") return null;
  var general = cmdActiveGeneral(C);
  if (!general || general.id !== targetId) return null;
  return _wcRelationshipRegistryTarget(C, targetId, J.personId);
}
function _wcRelationshipEventLaw(outcome, type) {
  outcome = String(outcome || "");
  type = _wcText(type || "", 32);
  if (outcome === "victory" && type === "decisive") return { code:"high-command-decisive-victory", delta:2 };
  if (outcome === "victory") return { code:"high-command-victory", delta:1 };
  if (outcome === "draw") return { code:"high-command-draw", delta:0 };
  if (outcome === "defeat" && type === "decisive") return { code:"high-command-decisive-defeat", delta:-2 };
  if (outcome === "defeat") return { code:"high-command-defeat", delta:-1 };
  return null;
}
function _wcRelationshipTransitionId(C, owner, targetId, eventCode) {
  if (!C || !owner) return "";
  var runId = _wcSafeId(C.runId, 96), creditKey = _wcSafeId(owner.creditKey, 220);
  var eventId = _wcSafeId(owner.eventId, 180), actorPersonId = _wcSafeId(owner.personId, 180);
  targetId = _wcSafeId(targetId, 180); eventCode = _wcSafeId(eventCode, 80);
  if (!runId || !creditKey || !eventId || !actorPersonId || !targetId || !eventCode) return "";
  return "wcrs-" + _wcHash([runId, creditKey, eventId, actorPersonId,
    _WC_REL_TARGET_NAMESPACE, targetId, eventCode].join("|")).toString(36);
}
function _wcRelationshipSignalForTarget(C, J, event, targetId) {
  if (!C || !J || !event || event.qualifying !== true || event.fate !== "alive" ||
      event.status !== "alive" || event.personId !== J.personId) return null;
  var target = _wcRelationshipRegistryTarget(C, targetId, event.personId);
  var law = _wcRelationshipEventLaw(event.outcome, event.type);
  if (!target || !law) return null;
  var transitionId = _wcRelationshipTransitionId(C, event, target.pid, law.code);
  if (!transitionId) return null;
  var origin = "emergent-timeline"; // WAR_CAREER_RELATIONSHIP_PROVENANCE_BIND:EMERGENT_ONLY
  return {
    schema:"cw_war_career_relationship_signal_v1", transitionId:transitionId,
    actorPersonId:event.personId, targetId:target.pid, targetNamespace:_WC_REL_TARGET_NAMESPACE,
    eventCode:law.code, rapportDelta:law.delta, origin:origin,
    timelineLabel:"Your Timeline", sourceRefs:[]
  };
}
function warCareerRelationshipSignal(C, J, event) {
  var target = _wcRelationshipCommandTarget(C, J);
  return target ? _wcRelationshipSignalForTarget(C, J, event, target.pid) : null;
}
function warCareerRelationshipSignalClean(row, C, owner) {
  if (!_wcPlain(row) || !C || !owner || owner.qualifying !== true || owner.fate !== "alive") return null;
  var actorPersonId = _wcSafeId(row.actorPersonId, 180), targetId = _wcSafeId(row.targetId, 180);
  var eventCode = _wcSafeId(row.eventCode, 80), transitionId = _wcSafeId(row.transitionId, 180);
  var law = _wcRelationshipEventLaw(owner.outcome, owner.type);
  if (row.schema !== "cw_war_career_relationship_signal_v1" ||
      row.targetNamespace !== _WC_REL_TARGET_NAMESPACE || actorPersonId !== owner.personId ||
      !law || eventCode !== law.code || typeof row.rapportDelta !== "number" ||
      !isFinite(row.rapportDelta) || row.rapportDelta !== law.delta ||
      !_wcRelationshipRegistryTarget(C, targetId, actorPersonId) ||
      transitionId !== _wcRelationshipTransitionId(C, owner, targetId, eventCode)) return null;
  // No immutable authored relationship packet ships in D407. Unsupported
  // historical labels or saved sources are stripped; the exact result remains
  // only an emergent Your Timeline transition.
  return {
    schema:"cw_war_career_relationship_signal_v1", transitionId:transitionId,
    actorPersonId:actorPersonId, targetId:targetId, targetNamespace:_WC_REL_TARGET_NAMESPACE,
    eventCode:eventCode, rapportDelta:law.delta, origin:"emergent-timeline",
    timelineLabel:"Your Timeline", sourceRefs:[]
  };
}
function _wcLex(a, b) {
  a = String(a); b = String(b);
  return a < b ? -1 : (a > b ? 1 : 0);
}
function _wcRelationshipReduce(transitions, J) {
  transitions = Array.isArray(transitions) ? transitions.slice() : [];
  var lineageActors = Object.create(null), i;
  for (i = 0; i < (J && J.lineage || []).length; i++) if (J.lineage[i] && J.lineage[i].personId) {
    lineageActors[J.lineage[i].personId] = true;
  }
  transitions.sort(function (a, b) {
    return a.ordinal - b.ordinal || _wcLex(a.signal.transitionId, b.signal.transitionId);
  });
  var buckets = Object.create(null);
  for (i = 0; i < transitions.length; i++) {
    var transition = transitions[i], s = transition.signal;
    if (!s || s.targetNamespace !== _WC_REL_TARGET_NAMESPACE) continue;
    var key = _WC_REL_TARGET_NAMESPACE + "|" + s.targetId;
    var bucket = buckets[key];
    if (!bucket) bucket = buckets[key] = { key:key, targetId:s.targetId, personal:0, remembered:0, rows:[], lastOrdinal:0 };
    if (s.actorPersonId === J.personId) bucket.personal += Number(s.rapportDelta) || 0;
    else if (lineageActors[s.actorPersonId]) bucket.remembered += Number(s.rapportDelta) || 0; // WAR_CAREER_RELATIONSHIP_HANDOFF_BIND:REMEMBERED_ONLY
    else continue;
    bucket.rows.push({ transitionId:s.transitionId, eventId:transition.eventId,
      creditKey:transition.creditKey, actorPersonId:s.actorPersonId,
      eventCode:s.eventCode, rapportDelta:s.rapportDelta });
    bucket.lastOrdinal = transition.ordinal;
  }
  var ranked = [];
  for (var bucketKey in buckets) if (_wcOwn(buckets, bucketKey) && buckets[bucketKey].rows.length) ranked.push(buckets[bucketKey]);
  ranked.sort(function (a, b) { return b.lastOrdinal - a.lastOrdinal || _wcLex(a.key, b.key); });
  if (ranked.length > _WC_REL_EDGE_MAX) ranked = ranked.slice(0, _WC_REL_EDGE_MAX);
  ranked.sort(function (a, b) { return _wcLex(a.key, b.key); });

  var out = {};
  for (i = 0; i < ranked.length; i++) {
    var b = ranked[i], last = b.rows[b.rows.length - 1];
    out[b.key] = {
      schema:"cw_war_career_relationship_edge_v1", targetId:b.targetId,
      targetNamespace:_WC_REL_TARGET_NAMESPACE,
      rapport:Math.max(-8, Math.min(8, Math.round(b.personal))),
      rememberedRapport:Math.max(-8, Math.min(8, Math.round(b.remembered))),
      lastEventId:last.eventId, lastCreditKey:last.creditKey,
      eventHistory:b.rows.slice(Math.max(0, b.rows.length - _WC_REL_HISTORY_MAX)),
      origin:"emergent-timeline", timelineLabel:"Your Timeline", sourceRefs:[]
    };
  }
  J.relationships = out;
  return out;
}
function warCareerRebuildRelationships(C, J) {
  var events = J && Array.isArray(J.events) ? J.events : [];
  var credits = J && Array.isArray(J.creditLedger) ? J.creditLedger : [];
  var byEvent = Object.create(null), eventCounts = Object.create(null);
  var creditCounts = Object.create(null), allowedActors = Object.create(null), i;
  if (!J) return {};
  if (!J.personId) {
    for (i = 0; i < events.length; i++) if (events[i] && events[i].relationshipSignal) delete events[i].relationshipSignal;
    for (i = 0; i < credits.length; i++) if (credits[i] && credits[i].relationshipSignal) delete credits[i].relationshipSignal;
    J.relationships = {};
    return J.relationships;
  }
  allowedActors[J.personId] = true;
  for (i = 0; i < (J.lineage || []).length; i++) if (J.lineage[i] && J.lineage[i].personId) {
    allowedActors[J.lineage[i].personId] = true;
  }
  for (i = 0; i < events.length; i++) if (events[i] && typeof events[i].eventId === "string" && events[i].eventId) {
    var indexedEventId = events[i].eventId;
    eventCounts[indexedEventId] = (eventCounts[indexedEventId] || 0) + 1;
    byEvent[indexedEventId] = eventCounts[indexedEventId] === 1 ? events[i] : null;
  }
  for (i = 0; i < credits.length; i++) if (credits[i] && typeof credits[i].creditKey === "string" && credits[i].creditKey) {
    creditCounts[credits[i].creditKey] = (creditCounts[credits[i].creditKey] || 0) + 1;
  }

  var transitions = [], seenCopies = Object.create(null);
  var validEventRows = [], validCreditRows = [];
  for (var ci = 0; ci < credits.length; ci++) {
    var credit = credits[ci], event = credit && byEvent[credit.eventId];
    var rawEventSignal = event && event.relationshipSignal, rawCreditSignal = credit && credit.relationshipSignal;
    var eventSignal = rawEventSignal ? warCareerRelationshipSignalClean(rawEventSignal, C, event) : null;
    var creditSignal = rawCreditSignal ? warCareerRelationshipSignalClean(rawCreditSignal, C, credit) : null;
    if (!credit || !event || eventCounts[credit.eventId] !== 1 || creditCounts[credit.creditKey] !== 1 ||
        credit.qualifying !== true || event.qualifying !== true ||
        credit.fate !== "alive" || event.fate !== "alive" || event.status !== "alive" ||
        credit.creditKey !== event.creditKey || credit.personId !== event.personId ||
        credit.outcome !== event.outcome || credit.type !== event.type ||
        allowedActors[credit.personId] !== true || !eventSignal || !creditSignal ||
        JSON.stringify(eventSignal) !== JSON.stringify(creditSignal)) continue;
    event.relationshipSignal = eventSignal;
    credit.relationshipSignal = creditSignal;
    validEventRows.push(event); validCreditRows.push(credit);
    var copies = [eventSignal, creditSignal];
    for (var copyIndex = 0; copyIndex < copies.length; copyIndex++) {
      var signal = copies[copyIndex], dedupeKey = signal.transitionId;
      if (seenCopies[dedupeKey] === true) continue; // WAR_CAREER_RELATIONSHIP_DEDUPE_BIND:PAIR_ONCE
      seenCopies[dedupeKey] = true;
      transitions.push({ ordinal:Number(event.ordinal) || 0, eventId:event.eventId,
        creditKey:credit.creditKey, signal:signal });
    }
  }
  for (i = 0; i < events.length; i++) if (events[i] && events[i].relationshipSignal && validEventRows.indexOf(events[i]) < 0) delete events[i].relationshipSignal;
  for (i = 0; i < credits.length; i++) if (credits[i] && credits[i].relationshipSignal && validCreditRows.indexOf(credits[i]) < 0) delete credits[i].relationshipSignal;

  return _wcRelationshipReduce(transitions, J);
}
function warCareerAcceptHandoff(C, pid) {
  var J = warCareerInit(C), safePid = _wcSafeId(pid, 180);
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.handoff || J.handoff.state !== "pending") return { ok:false, reason:"no-pending-handoff" };
  if (!safePid || !Array.isArray(J.handoff.candidateIds) || J.handoff.candidateIds.indexOf(safePid) < 0) return { ok:false, reason:"candidate-not-offered" };
  var p = _wcRegistryPersonUnique(C, safePid), ref = p && _wcUnitRef(p.unitRef), baseRef = _wcUnitRef(J.handoff.unitRef);
  var year = J.lastParticipation && J.lastParticipation.battleYear != null ? Number(J.lastParticipation.battleYear) : null;
  var canonical = warCareerComradeCandidates(C, J, null, J.lastParticipation), canonicalIds = [];
  for (var ci = 0; ci < canonical.length; ci++) canonicalIds.push(canonical[ci].pid);
  if (JSON.stringify(canonicalIds) !== JSON.stringify(J.handoff.candidateIds)) return { ok:false, reason:"candidate-set-invalid" };
  // The exact canonical candidate list above already proves hierarchy,
  // presence, service window, side, and uniqueness. Do not reconsult the
  // mutable saved person/team snapshot after that authority check.
  if (!p || !ref || !baseRef || p.side !== C.side || !_wcKnownPresent(p, year)) return { ok:false, reason:"candidate-unavailable" };
  var prior = _wcLineageRow(J, J.handoff, safePid, J.lastParticipation);
  if (!prior) return { ok:false, reason:"lineage-unavailable" };
  if (!Array.isArray(J.lineage)) J.lineage = [];
  for (var li = 0; li < J.lineage.length; li++) if (J.lineage[li] && (J.lineage[li].lineageId === prior.lineageId || J.lineage[li].personId === prior.personId)) return { ok:false, reason:"handoff-already-recorded" };
  J.lineage.push(prior);
  J.person = typeof _ssJourneySnapshot === "function" ? _ssJourneySnapshot(p, true) : p;
  J.personId = p.pid;
  J.status = "alive";
  J.battles = 0;
  J.promotionCount = 0;
  J.merit = 0;
  J.reputation = 0;
  J.roleHistory = [];
  J.currentBillet = null;
  // Legacy compatibility rows are identity-personal. Shared War Career events,
  // credits, lineage, and last-participation context remain; wounds/ranks/logs
  // from the fallen identity never populate the successor's people cache.
  J.career = [];
  J.log = [];
  J.handoff.state = "completed";
  J.handoff.selectedPersonId = p.pid;
  J.handoff.reason = null;
  if (typeof _ssCleanJourney === "function") _ssCleanJourney(C, C.loot);
  J = C.loot.journey;
  if (typeof _ssSyncPersonCareer === "function") _ssSyncPersonCareer(C.loot);
  return { ok:true, person:J.person, lineage:J.lineage.length, creditCount:J.creditLedger.length };
}

function warCareerObserveResolve(winnerSide, type, B, C, win) {
  var J = warCareerInit(C);
  if (!J || !J.enabled || J.careerVersion !== 1) return { ok:false, reason:"inactive" };
  if (!B || B.fromCampaign !== true) return { ok:false, reason:"noncampaign" };
  if (J.handoff && (J.handoff.state === "pending" || J.handoff.state === "ended")) return { ok:false, reason:"handoff-unresolved" };
  var bid = _wcBattleId(B, C), bname = _wcBattleName(B, bid);
  var rankBefore = J.person && J.person.rank || "Soldier";
  var outcome = _wcOutcome(winnerSide, C, B, win), rank = _wcOutcomeRank(outcome, type), key = _wcCreditKey(C, B);
  var credit = _wcCreditFor(J, key);
  var recoveredOwner = _wcRecoveredCaptureForKey(J, key);
  // A qualifying rung is immutable. Recovery, reload, mode-switching, or a
  // successor on the same rung cannot reroll fate, mint an event, or replace a
  // completed/pending candidate set.
  if (credit && credit.qualifying) return { ok:true, duplicate:true, creditKey:key, outcome:credit.outcome, qualifying:false, fate:null, handoff:J.handoff && J.handoff.state || null, merit:0, reputation:0 };
  if (credit && recoveredOwner) return { ok:true, duplicate:true, creditKey:key, outcome:credit.outcome, qualifying:false, fate:null, recoveredCapture:false, handoff:J.handoff && J.handoff.state || null, merit:0, reputation:0 };
  var carried = _wcPendingPreflight;
  var carriedOk = !!(carried && !carried.consumed && carried.C === C && carried.B === B &&
    carried.winnerSide === winnerSide && carried.type === _wcText(type || "", 32) &&
    carried.runId === C.runId && carried.creditKey === key && carried.personId === J.personId &&
    carried.outcome === outcome && carried.resultId === (carried.preflight && carried.preflight.participation ? carried.preflight.participation.resultId : null));
  if (carriedOk && carried.preflight && carried.preflight.qualifying) {
    var cp = carried.preflight.participation;
    carriedOk = !!(cp && cp.runId === C.runId && cp.creditKey === key && cp.personId === J.personId &&
      cp.resultId === carried.resultId && cp.battleId === bid && cp.side === C.side);
  }
  var preflight = carriedOk ? carried.preflight : { qualifying:false, fate:null, reason:"missing-predelegate-preflight", participation:null };
  if (carriedOk) carried.consumed = true;
  if (carriedOk) outcome = preflight.outcome;
  var capturedCredit = _wcUnrecoveredCapture(J, J.personId);
  var recoveredCapture = !!(carriedOk && capturedCredit && capturedCredit.creditKey !== key &&
    Number(capturedCredit.chainIndex) < Number(C.idx) && !preflight.qualifying);
  var fate = preflight.qualifying ? preflight.fate : (recoveredCapture ? "alive" : (typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive"));
  var resultAward = warCareerCreditAward({
    qualifying:preflight.qualifying, fate:preflight.qualifying ? fate : null,
    outcome:outcome, type:_wcText(type || "", 32)
  });
  var note = recoveredCapture
    ? "The selected person returns from captivity after sitting out a distinct campaign result. This deterministic recovery is nonqualifying and grants no merit, promotion, command, or political authority."
    : preflight.qualifying
    ? "Explicit " + preflight.participation.mode + " participation recorded before delegation; personal fate " + fate + ". Slice C reconstructs merit, reputation, rank, and billet from this one receipt under Your Timeline."
    : "Result observed for the War Career; explicit participation was not proved (" + preflight.reason + "), so this entry earns no advancement and infers no personal fate.";
  var event = {
    eventId:_wcEventId(C, J), ordinal:J.eventOrdinal, kind:"result", creditKey:key,
    personId:J.personId, scenarioId:bid || null, battleName:bname, outcome:outcome,
    type:_wcText(type || "", 32), status:fate, fate:preflight.qualifying ? fate : null,
    qualifying:preflight.qualifying, merit:resultAward.merit, reputation:resultAward.reputation, note:note
  };
  if (preflight.qualifying) event.participation = preflight.participation;
  if (recoveredCapture) event.recoveryOfCreditKey = capturedCredit.creditKey;
  var relationshipSignal = preflight.qualifying && fate === "alive"
    ? warCareerRelationshipSignal(C, J, event) : null; // WAR_CAREER_RELATIONSHIP_TRANSITION_BIND:SOLE_CALL
  if (relationshipSignal) event.relationshipSignal = relationshipSignal;
  _wcPushEvent(J, event);

  if (!Array.isArray(J.creditLedger)) J.creditLedger = [];
  if (!credit && J.creditLedger.length < _wcFiniteRungs(C)) {
    credit = {
      creditKey:key, runId:C.runId, side:C.side, chainIndex:Math.max(0, Math.round(Number(C.idx) || 0)),
      scenarioId:bid || "", outcome:outcome, type:_wcText(type || "", 32), outcomeRank:rank,
      personId:J.personId, fate:preflight.qualifying ? fate : null,
      qualifying:preflight.qualifying, merit:resultAward.merit, reputation:resultAward.reputation, eventId:event.eventId, eventDate:null
    };
    if (preflight.qualifying) credit.participation = preflight.participation;
    J.creditLedger.push(credit);
  } else if (credit && preflight.qualifying) {
    // The first proved observation owns every qualifying field. A prior
    // unproved best-narrative result cannot be laundered into this receipt.
    credit.outcome = outcome; credit.type = _wcText(type || "", 32);
    credit.outcomeRank = rank; credit.eventId = event.eventId;
    credit.qualifying = true; credit.personId = J.personId; credit.fate = fate;
    credit.participation = preflight.participation;
    credit.merit = resultAward.merit; credit.reputation = resultAward.reputation; credit.eventDate = null;
  } else if (credit && recoveredCapture) {
    // The dispatcher-owned recovery event must also own the nonqualifying
    // recovery credit. A prior observer-only row on this rung cannot remain as
    // the credit owner and be cross-paired with a later recovery event.
    credit.outcome = outcome; credit.type = _wcText(type || "", 32);
    credit.outcomeRank = rank; credit.eventId = event.eventId;
    credit.personId = J.personId; credit.fate = null;
    credit.qualifying = false; delete credit.participation;
    credit.merit = 0; credit.reputation = 0; credit.eventDate = null;
  } else if (credit) {
    // Before a rung qualifies, retain only its best narrative observation.
    if (rank > Number(credit.outcomeRank || 0)) {
      credit.outcome = outcome; credit.type = _wcText(type || "", 32);
      credit.outcomeRank = rank; credit.eventId = event.eventId;
    }
    credit.merit = 0; credit.reputation = 0; credit.eventDate = null;
  }
  if (credit && credit.eventId === event.eventId) {
    if (relationshipSignal) credit.relationshipSignal = JSON.parse(JSON.stringify(relationshipSignal));
    else delete credit.relationshipSignal;
  }
  if (recoveredCapture) {
    capturedCredit.recoveredAtCreditKey = key;
    capturedCredit.recoveryEventId = event.eventId;
  }

  J.currentBattleId = bid || null;
  J.lastBattleId = bid || null;
  J.lastBattleName = bname;
  J.lastOutcome = outcome;
  J.lastTurn = typeof _lootTurn === "function" ? _lootTurn(C) : 0;
  J.battles = Math.max(0, Math.round(Number(J.battles) || 0)) + 1;
  if (preflight.qualifying || recoveredCapture) J.status = fate;
  if (preflight.qualifying) J.lastParticipation = preflight.participation;
  if (preflight.qualifying && fate === "fallen") _wcBeginHandoff(C, J, event, preflight.participation);
  if (typeof _ssPushCareer === "function") {
    _ssPushCareer(J, {
      turn:J.lastTurn, battleId:bid || null, battleName:bname, outcome:outcome,
      type:_wcText(type || "", 32), status:J.status, rankBefore:J.person && J.person.rank,
      rankAfter:J.person && J.person.rank, promoted:false, note:event.note
    });
  }
  if (typeof _ssCleanJourney === "function") _ssCleanJourney(C, C.loot);
  J = C.loot.journey;
  var lastCareer = J && Array.isArray(J.career) && J.career.length ? J.career[J.career.length - 1] : null;
  if (lastCareer) {
    lastCareer.rankBefore = rankBefore;
    lastCareer.rankAfter = J.person && J.person.rank || rankBefore;
    lastCareer.promoted = _wcRankOrdinal(lastCareer.rankBefore) !== _wcRankOrdinal(lastCareer.rankAfter);
  }
  if (typeof _ssSyncPersonCareer === "function") _ssSyncPersonCareer(C.loot);
  var committedEvent = null;
  for (var cei = 0; cei < (J.events || []).length; cei++) if (J.events[cei] && J.events[cei].eventId === event.eventId) { committedEvent = J.events[cei]; break; }
  return { ok:true, eventId:event.eventId, creditKey:key, outcome:outcome, qualifying:preflight.qualifying,
    fate:preflight.qualifying ? fate : null, recoveredCapture:recoveredCapture,
    handoff:J.handoff && J.handoff.state || null,
    merit:committedEvent ? committedEvent.merit : 0,
    reputation:committedEvent ? committedEvent.reputation : 0 };
}

function _wcStoredAdvancementMatches(J, derived) {
  if (!J || !derived || !derived.ok || !J.person || J.person.rank !== derived.rank ||
      Number(J.merit) !== derived.merit || Number(J.reputation) !== derived.reputation ||
      Number(J.promotionCount) !== derived.promotionCount || !Array.isArray(J.roleHistory) ||
      J.roleHistory.length !== derived.roleHistory.length) return false;
  for (var hi = 0; hi < derived.roleHistory.length; hi++) if (!_wcBilletSame(J.roleHistory[hi], derived.roleHistory[hi])) return false;
  if ((J.currentBillet == null) !== (derived.currentBillet == null) ||
      (derived.currentBillet && !_wcBilletSame(J.currentBillet, derived.currentBillet))) return false;
  for (var ai = 0; ai < derived.awards.length; ai++) {
    var award = derived.awards[ai];
    if (Number(award.credit.merit) !== award.merit || Number(award.credit.reputation) !== award.reputation ||
        !award.event || Number(award.event.merit) !== award.merit || Number(award.event.reputation) !== award.reputation) return false;
  }
  var credits = Array.isArray(J.creditLedger) ? J.creditLedger : [], events = Array.isArray(J.events) ? J.events : [];
  for (var ci = 0; ci < credits.length; ci++) if (credits[ci] && credits[ci].personId !== J.personId &&
      (Number(credits[ci].merit) !== 0 || Number(credits[ci].reputation) !== 0)) return false;
  for (var ei = 0; ei < events.length; ei++) if (events[ei] && events[ei].personId !== J.personId &&
      (Number(events[ei].merit) !== 0 || Number(events[ei].reputation) !== 0)) return false;
  return true;
}
function _wcCareerAuthority(C, allowedProjectionStatus) {
  var J = C && C.loot && C.loot.journey;
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person || J.personId !== J.person.pid || J.person.side !== C.side) {
    return { ok:false, id:"legacy-or-inactive", label:"Legacy campaign", reason:"No explicit War Career is active." };
  }
  var canonical = _wcCanonicalCareerPerson(C, J.personId), savedRef = _wcUnitRef(J.person.unitRef);
  if (!canonical || !savedRef || !_wcSameUnitRef(savedRef, canonical.person.unitRef)) {
    return { ok:false, id:"unavailable", label:"Unavailable", reason:"The current identity or canonical source reference is malformed." };
  }
  var derived = _wcCalculateAdvancement(C, J, J.personId);
  if (!_wcStoredAdvancementMatches(J, derived)) {
    return { ok:false, id:"unavailable", label:"Unavailable", reason:"The saved advancement or billet projection does not match the sanitized receipt ledger." };
  }
  var status = String(J.status || "");
  // The second argument exists only as a negative-bind seam: every shipped caller
  // passes no override, so captured/fallen/wounded authority remains unavailable.
  if (status !== "alive" && allowedProjectionStatus !== status) {
    return { ok:false, id:"unavailable", label:"Unavailable", reason:"The active person is " + (status || "not present") + " and cannot exercise command authority.", status:status || null };
  }
  if (J.handoff && (J.handoff.state === "pending" || J.handoff.state === "ended")) {
    return { ok:false, id:"unavailable", label:"Unavailable", reason:"COMRADE HAND-OFF must resolve before command authority can return.", status:status };
  }
  var band = _wcRoleBand(J.person.rank);
  if (!band) return { ok:false, id:"unavailable", label:"Unavailable", reason:"The current rank is outside Slice C's legal rank sequence.", status:status };
  var labels = { "rank-and-file":"Rank and file", "junior-command":"Junior command", "field-command":"Field command", "general-command":"General command" };
  if (band.roleId === "field-command" || band.roleId === "general-command") {
    var last = J.roleHistory.length ? J.roleHistory[J.roleHistory.length - 1] : null;
    if (!last || !_wcBilletValid(last) || !_wcBilletSame(last, J.currentBillet) ||
        last.authority !== "qualifying-credit" || last.personId !== J.personId || last.side !== C.side ||
        last.rank !== J.person.rank || last.roleId !== band.roleId ||
        (band.roleId === "field-command" && last.billetCode !== "field-officer") ||
        (band.roleId === "general-command" && last.billetCode !== "general-officer")) {
      return { ok:false, id:"unavailable", label:"Unavailable", reason:"The current field or general rank has no exact qualifying billet." };
    }
    var owner = null;
    for (var ci = 0; ci < J.creditLedger.length; ci++) if (J.creditLedger[ci] &&
        J.creditLedger[ci].creditKey === last.creditKey && J.creditLedger[ci].eventId === last.eventId) { owner = J.creditLedger[ci]; break; }
    if (!owner || owner.personId !== J.personId || owner.qualifying !== true || owner.fate !== "alive" ||
        owner.chainIndex !== last.chainIndex || owner.scenarioId !== last.scenarioId ||
        !owner.participation || Number(owner.participation.battleYear) !== Number(last.battleYear)) {
      return { ok:false, id:"unavailable", label:"Unavailable", reason:"The current billet is not bound to one qualifying current-person receipt." };
    }
    var chain = typeof CHAINS !== "undefined" && CHAINS && Array.isArray(CHAINS[C.side]) ? CHAINS[C.side] : null;
    var index = Number(C.idx), currentBattle = chain && isFinite(index) && Math.floor(index) === index && index >= 0 && index < chain.length ? chain[index] : "";
    var currentYear = currentBattle ? _wcCanonicalBattleYear(currentBattle) : null;
    if (currentYear == null || !_wcServiceWindowValid(canonical.sourceRef, currentYear)) {
      return { ok:false, id:"unavailable", label:"Unavailable", reason:"The current campaign date is outside this identity's canonical service window.", status:"service-ended" };
    }
  }
  return { ok:true, id:band.roleId, label:labels[band.roleId],
    reason:"Role and billet are reconstructed from the current person's sanitized Your Timeline receipts.",
    status:status, rank:J.person.rank, billet:J.currentBillet, derived:derived, journey:J };
}
function warCareerRole(C) {
  var authority = _wcCareerAuthority(C);
  var out = { id:authority.id, label:authority.label, reason:authority.reason };
  if (authority.status != null) out.status = authority.status;
  if (authority.rank) out.rank = authority.rank;
  if (authority.billet) out.billetId = authority.billet.billetId;
  return out;
}
function warCareerCapabilities(C) {
  var role = warCareerRole(C);
  var active = role.id !== "legacy-or-inactive" && role.id !== "unavailable";
  var field = role.id === "field-command" || role.id === "general-command";
  var decisions = warCareerDecisionAccess(C);
  return {
    role:role.id,
    personalStory:active,
    armyRegister:true,
    strategicReadOnly:true,
    localOrders:false,
    fieldCommand:field,
    nationalDecisions:decisions.career === true && decisions.unlocked === true,
    cabinetMutation:false,
    appointmentMutation:false,
    resourceMutation:false,
    reason:active ? (field ? "Slice C exposes one bounded leadership projection; command appointments and political mutations remain locked." : "This role has no command projection yet.") : role.reason
  };
}
/* D408 §17 (Slice E) — the ONE consumed political capability: `nationalDecisions`,
   human-facing Matters of State. WAR_CAREER_POLITICAL_DATE_BIND:QUALIFYING_RECEIPT_YEAR_1864_OR_LATER —
   unlock requires BOTH the reconstructed current-person general-command role AND a
   latest independently validated qualifying current-person receipt whose canonical
   battleYear >= _WC_POLITICAL_DATE_YEAR. Everything is re-derived from the sanitized
   receipt ledger on every read: the live clock, President date, saved booleans/scalars,
   rank text, rapport, names, and source rewriting can never grant authority, and no
   authority field is ever persisted. Legacy/no-career campaigns bypass the gate and
   keep the shipped President experience byte-identically. Cabinet, appointment, and
   resource capabilities stay false and unconsumed. */
var _WC_POLITICAL_DATE_YEAR = 1864;
function warCareerDecisionAccess(C) {
  var J = C && C.loot && C.loot.journey;
  if (!J || J.enabled !== true || J.careerVersion !== 1) {
    return { schema:"cw_war_career_decision_access_v1", career:false, unlocked:true,
      missingDate:false, missingAuthority:false, latestQualifyingYear:null,
      requiredYear:_WC_POLITICAL_DATE_YEAR,
      reason:"No active War Career: Matters of State keep the shipped President experience." };
  }
  var authority = _wcCareerAuthority(C);
  var latest = authority.ok === true && authority.derived ? authority.derived.latestQualifying : null;
  var year = latest && isFinite(Number(latest.battleYear)) ? Math.round(Number(latest.battleYear)) : null;
  var missingAuthority = !(authority.ok === true && authority.id === "general-command");
  var missingDate = !(year != null && year >= _WC_POLITICAL_DATE_YEAR);
  return {
    schema:"cw_war_career_decision_access_v1", career:true,
    unlocked:!missingAuthority && !missingDate,
    missingDate:missingDate, missingAuthority:missingAuthority,
    latestQualifyingYear:year, requiredYear:_WC_POLITICAL_DATE_YEAR,
    reason:!missingAuthority && !missingDate
      ? "General Command and a qualifying " + _WC_POLITICAL_DATE_YEAR + "-or-later receipt are both reconstructed; Matters of State are open."
      : "Matters of State are deferred: " + (missingAuthority && missingDate
        ? "earned General Command authority and a qualifying " + _WC_POLITICAL_DATE_YEAR + "-or-later receipt are both missing."
        : (missingDate
          ? "no qualifying receipt of " + _WC_POLITICAL_DATE_YEAR + " or later stands in the sanitized ledger."
          : "earned General Command authority has not been reconstructed from the current person's receipts."))
  };
}
function warCareerStrategicGeneral(C) {
  var authority = _wcCareerAuthority(C), J = authority.journey;
  if (!authority.ok || authority.id !== "general-command" || !J || !authority.billet) return null;
  return {
    schema:"cw_war_career_strategic_general_v1",
    id:"wcsg-" + _wcHash([C.runId, J.personId, authority.billet.billetId, "strategic-general-v1"].join("|")).toString(36),
    personId:J.personId, name:_wcText(J.person.name || "", 120), side:C.side,
    rank:J.person.rank, roleId:"general-command", billetId:authority.billet.billetId,
    provenance:"Inferred", timelineLabel:"Your Timeline"
  };
}
function warCareerCommandProjection(C) {
  var authority = _wcCareerAuthority(C), J = authority.journey;
  if (!authority.ok || !J || (authority.id !== "field-command" && authority.id !== "general-command")) return 0;
  var reputation = Number(J.reputation);
  if (!isFinite(reputation)) return 0;
  reputation = Math.max(0, reputation);
  if (authority.id === "field-command") return Math.min(2, 1 + Math.floor(reputation / 4));
  return Math.min(4, 2 + Math.floor(reputation / 4));
}

function warCareerHandoffHTML(C) {
  var J = C && C.loot && C.loot.journey, H = J && J.handoff;
  if (!J || !H) return "";
  if (H.state === "ended") return '<div data-war-career-handoff="ended" role="status" style="margin-top:7px;padding:7px;border:1px solid #da6a5a;border-radius:4px"><b>Personal career ended.</b> No eligible comrade could be identified.</div>';
  if (H.state === "completed") return '<div data-war-career-handoff="completed" role="status" style="margin-top:7px;opacity:.78">COMRADE HAND-OFF completed; the prior identity is retained in the immutable lineage.</div>';
  if (H.state !== "pending") return "";
  var rows = "", available = 0;
  for (var i = 0; i < H.candidateIds.length; i++) {
    var p = _wcRegistryPersonUnique(C, H.candidateIds[i]);
    if (!p) continue;
    available++;
    rows += '<li style="margin:5px 0"><button type="button" class="upg" data-wc-handoff="' + _wcEsc(p.pid) + '">Continue as ' + _wcEsc(p.name) + ' — ' + _wcEsc(p.rank || "Soldier") + '</button></li>';
  }
  return '<section data-war-career-handoff="pending" aria-labelledby="wcHandoffHead" style="margin-top:8px;padding:8px;border:1px solid #da6a5a;border-radius:5px">'
    + '<h4 id="wcHandoffHead" style="font-size:12px;margin:0 0 4px">COMRADE HAND-OFF</h4>'
    + '<p style="font-size:11px;margin:0">The prior identity has fallen. Choose from the fixed same-unit candidate set; reload cannot reroll its order.</p>'
    + (available ? '<ul style="margin:5px 0 0;padding-left:18px">' + rows + '</ul>' : '<p role="status" style="font-size:11px;margin:5px 0 0">The saved candidate identities are no longer available; no replacement has been fabricated.</p>')
    + '</section>';
}

function warCareerSummaryHTML(C) {
  var J = warCareerInit(C);
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person) return "";
  var role = warCareerRole(C), credits = J.creditLedger || [], qualifying = 0;
  for (var i = 0; i < credits.length; i++) if (credits[i] && credits[i].qualifying) qualifying++;
  return '<section data-war-career-summary="1" aria-labelledby="wcSummaryHead" style="margin-top:9px;padding:9px;border:1px solid rgba(184,134,59,.62);border-radius:5px">'
    + '<h3 id="wcSummaryHead" style="font-size:12px;margin:0 0 4px">War Career — Your Timeline</h3>'
    + '<div style="font-size:11px;line-height:1.45">Role: <b>' + _wcEsc(role.label) + '</b> · merit ' + _wcEsc(J.merit || 0) + ' · reputation ' + _wcEsc(J.reputation || 0) + ' · qualifying ' + _wcEsc(qualifying) + '.</div>'
    + '<div style="font-size:11px;line-height:1.45;opacity:.78">Rank and billet are reconstructed from one qualifying receipt per rung. Alternate advancement is Your Timeline, not a rewrite of source history.</div>'
    + warCareerHandoffHTML(C)
    + '</section>';
}
function _wcRelationshipSigned(value) {
  var n = Math.max(-8, Math.min(8, Math.round(Number(value) || 0)));
  return n > 0 ? "+" + n : String(n);
}
function _wcRelationshipEventLabel(code) {
  var labels = {
    "high-command-decisive-victory":"decisive-victory response",
    "high-command-victory":"victory response",
    "high-command-draw":"draw response",
    "high-command-defeat":"defeat response",
    "high-command-decisive-defeat":"decisive-defeat response"
  };
  return labels[code] || "recorded response";
}
function _wcRelationshipReportHTML(C, J) {
  var map = J && _wcPlain(J.relationships) ? J.relationships : {}, keys = Object.keys(map).sort();
  var rows = "";
  for (var i = 0; i < keys.length; i++) {
    var edge = map[keys[i]], target = edge && _wcRegistryPersonUnique(C, edge.targetId);
    if (!edge || edge.schema !== "cw_war_career_relationship_edge_v1" || !target) continue;
    var history = Array.isArray(edge.eventHistory) ? edge.eventHistory : [];
    var newest = history.length ? history[history.length - 1] : null;
    rows += '<li style="margin:4px 0"><b>' + _wcEsc(target.name || edge.targetId) + '</b> — '
      + 'Personal rapport ' + _wcEsc(_wcRelationshipSigned(edge.rapport)) + '; '
      + 'Remembered network ' + _wcEsc(_wcRelationshipSigned(edge.rememberedRapport)) + '. '
      + 'Newest: ' + _wcEsc(_wcRelationshipEventLabel(newest && newest.eventCode)) + '.</li>';
  }
  return '<section data-war-career-relationships="1" aria-labelledby="wcRelationshipsHead" style="margin-top:8px;padding-top:7px;border-top:1px solid var(--rule);overflow-wrap:anywhere">'
    + '<h4 id="wcRelationshipsHead" style="font-size:11.5px;margin:0 0 4px">Relationship memory — Your Timeline</h4>'
    + '<p style="font-size:10.5px;line-height:1.45;margin:0;opacity:.82">These are emergent high-command responses in this playthrough, not documented historical friendships.</p>'
    + (rows ? '<ul style="font-size:11px;line-height:1.45;margin:5px 0 0;padding-left:18px">' + rows + '</ul>'
      : '<p style="font-size:11px;line-height:1.45;margin:5px 0 0">No qualifying high-command relationship memory has been recorded.</p>')
    + '</section>';
}
function warCareerReportHTML(C, opts) {
  var J = C && C.loot && C.loot.journey;
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person) return "";
  var role = warCareerRole(C), events = Array.isArray(J.events) ? J.events : [], credits = Array.isArray(J.creditLedger) ? J.creditLedger : [], qualifying = 0;
  for (var qi = 0; qi < credits.length; qi++) if (credits[qi] && credits[qi].qualifying) qualifying++;
  var last = events.length ? events[events.length - 1] : null;
  return '<section data-war-career-report="1" aria-labelledby="wcReportHead" style="margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10);overflow-wrap:anywhere">'
    + '<h3 id="wcReportHead" style="font-size:12.5px;margin:0 0 4px">War Career — Your Timeline</h3>'
    + '<div style="font-size:11px;line-height:1.5"><b>' + _wcEsc(J.person.name || "Selected person") + '</b> · ' + _wcEsc(J.person.rank || "Soldier") + ' · ' + _wcEsc(role.label) + ' · ' + _wcEsc(typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive") + '.</div>'
    + '<ul style="font-size:11px;line-height:1.5;margin:6px 0 0;padding-left:18px">'
    + '<li>' + _wcEsc(events.length) + ' narrative observation' + (events.length === 1 ? "" : "s") + '; newest: ' + _wcEsc(last ? (last.battleName || last.kind) : "career start") + '.</li>'
    + '<li>' + _wcEsc(credits.length) + ' distinct campaign credit' + (credits.length === 1 ? "" : "s") + '; ' + _wcEsc(qualifying) + ' proved participation; recovery retries cannot stack credit.</li>'
    + '<li>Your Timeline totals: merit ' + _wcEsc(J.merit || 0) + '; reputation ' + _wcEsc(J.reputation || 0) + '; promotions ' + _wcEsc(J.promotionCount || 0) + '. Unproved or excluded-life entries score zero.</li>'
    + '<li>Nonqualifying observations grant no merit, no reputation, no promotion, no billet, and no command authority.</li>'
    + '<li>Personal fate: ' + _wcEsc(typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive") + '; lineage hand-offs ' + _wcEsc((J.lineage || []).length) + '.</li>'
    + '</ul>' + _wcRelationshipReportHTML(C, J) + warCareerHandoffHTML(C) + '</section>';
}

function warCareerIsTerminalLoss(C, B, winnerSide) {
  return !!(C && C.iron && B && B.fromCampaign && winnerSide !== null && winnerSide !== (B.playerSide || C.side));
}
function _wcBuildTerminalSnapshot(C, B, winnerSide, type, preflight, reason) {
  var J = C && C.loot && C.loot.journey;
  var p = J && J.person;
  var runId = warCareerRunIdValid(C && C.runId) ? C.runId : null;
  return {
    schema:"cw_war_career_terminal_v1",
    reason:reason === "career-ironman-fallen" ? "career-ironman-fallen" : "ironman-campaign-defeat",
    runId:runId,
    side:C && C.side === "CS" ? "CS" : "US",
    battleId:_wcBattleId(B, C) || null,
    battleName:_wcBattleName(B, _wcBattleId(B, C)),
    winnerSide:winnerSide === "CS" ? "CS" : (winnerSide === "US" ? "US" : null),
    resultType:_wcText(type || "", 32),
    personalFate:preflight && preflight.qualifying ? preflight.fate : null,
    stats:{
      battles:Math.max(0, Math.round(Number(C && C.stats && C.stats.battles) || 0)),
      won:Math.max(0, Math.round(Number(C && C.stats && C.stats.won) || 0)),
      infl:Math.max(0, Math.round(Number(C && C.stats && C.stats.infl) || 0)),
      suff:Math.max(0, Math.round(Number(C && C.stats && C.stats.suff) || 0))
    },
    rosterCount:Array.isArray(C && C.roster) ? C.roster.length : 0,
    person:p ? { pid:_wcSafeId(p.pid || (J && J.personId), 180) || null, name:_wcText(p.name || "", 120), rank:_wcText(p.rank || "", 80), status:preflight && preflight.fate === "fallen" ? "fallen" : (typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive") } : null,
    participation:preflight && preflight.qualifying ? preflight.participation : null,
    events:J && Array.isArray(J.events) ? J.events.length : 0,
    credits:J && Array.isArray(J.creditLedger) ? J.creditLedger.length : 0,
    storage:{ autosaveRemoved:false, undoRemoved:false, matchingSlotsRemoved:0, resumable:false }
  };
}
function _wcDeepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  var keys = Object.keys(value);
  for (var i = 0; i < keys.length; i++) _wcDeepFreeze(value[keys[i]]);
  try { Object.freeze(value); } catch (e) {}
  return value;
}
function warCareerTerminalPersist(C, B, winnerSide, type, preflight, reason) {
  var snapshot = _wcBuildTerminalSnapshot(C, B, winnerSide, type, preflight, reason);
  var autosaveRemoved = false, undoRemoved = false, removed = 0;
  try { localStorage.removeItem("gor_save"); autosaveRemoved = localStorage.getItem("gor_save") == null; } catch (e1) {}
  try { localStorage.removeItem("gor_undo_last"); undoRemoved = localStorage.getItem("gor_undo_last") == null; } catch (e2) {}
  if (snapshot.runId && typeof _slInvalidateRunSlots === "function") removed = _slInvalidateRunSlots(snapshot.runId);
  if (typeof G !== "undefined" && G) G.campaign = null;
  var resumable = false;
  try {
    var loaded = typeof loadLocal === "function" ? loadLocal() : null;
    resumable = !!(loaded && loaded.campaign);
  } catch (e3) { resumable = false; }
  snapshot.storage = {
    autosaveRemoved:autosaveRemoved,
    undoRemoved:undoRemoved,
    matchingSlotsRemoved:removed,
    resumable:resumable
  };
  _wcLastTerminalSnapshot = _wcDeepFreeze(snapshot);
  return _wcLastTerminalSnapshot;
}
function warCareerRenderTerminal(snapshot) {
  if (!snapshot) return false;
  var key = [snapshot.runId || "ambiguous", snapshot.battleId || "battle", snapshot.reason].join("|");
  if (_wcTerminalRenderKey === key) return false;
  _wcTerminalRenderKey = key;
  var sideLabel = snapshot.side === "CS" ? "Confederate" : "Union";
  var personal = snapshot.reason === "career-ironman-fallen";
  var personNote = "";
  if (snapshot.person) {
    if (snapshot.personalFate === "fallen") personNote = "The exact participation record classified this personal fate before any campaign write.";
    else personNote = "No personal death is inferred from this campaign result.";
  }
  var html = '<div id="wcTerminalScreen" data-war-career-terminal="1" role="region" aria-labelledby="wcTerminalHead">'
    + '<h1 id="wcTerminalHead" class="title-xl" style="text-align:center">' + (personal ? "The War Career Has Ended" : "The Campaign Has Ended") + '</h1>'
    + '<p class="title-sub" style="text-align:center">' + _wcEsc(sideLabel) + ' Ironman Campaign — Final Field Dispatch</p>'
    + '<hr class="rule"><div class="verdict loss">' + (personal ? "Fallen at " : "Defeat at ") + _wcEsc(snapshot.battleName || "the field") + '</div>'
    + '<p class="lede" style="text-align:center">Ironman permits no recovery. This campaign is closed; no battle reward, upgrade, retry, or Continue save was created.</p>'
    + (snapshot.person ? '<p style="font-size:12px;text-align:center">War Career record: ' + _wcEsc(snapshot.person.name) + ' · ' + _wcEsc(snapshot.person.rank) + '. ' + personNote + '</p>' : '')
    + '<div class="btn-row" style="margin-top:14px"><button id="wcTerminalMainMenu" type="button" class="bigbtn">Return to Main Menu</button></div></div>';
  if (typeof hideHud === "function") hideHud();
  if (typeof G !== "undefined" && G) G.mode = "terminal";
  if (typeof openSheet === "function") openSheet(html);
  else {
    var pad = typeof document !== "undefined" ? document.getElementById("sheetPad") : null;
    var ov = typeof document !== "undefined" ? document.getElementById("overlay") : null;
    if (pad) pad.innerHTML = html;
    if (ov) ov.classList.remove("hidden");
  }
  var btn = typeof document !== "undefined" ? document.getElementById("wcTerminalMainMenu") : null;
  if (btn) btn.addEventListener("click", function () { if (typeof openMainMenu === "function") openMainMenu(); });
  return true;
}

function warCareerInstallDispatcher() {
  if (typeof campaignAdvance !== "function") return null;
  if (campaignAdvance._warCareerWrapped) return campaignAdvance;
  var delegate = campaignAdvance;
  var wrapped = function (winnerSide, type) {
    var C = (typeof G !== "undefined" && G) ? G.campaign : null;
    var B = (typeof G !== "undefined" && G) ? G.battle : null;
    var preflight = warCareerPreflightFate(C, B, winnerSide, type);
    var campaignLoss = warCareerIsTerminalLoss(C, B, winnerSide);
    var careerFallen = !!(C && C.iron && preflight.qualifying && preflight.fate === "fallen");
    var terminal = campaignLoss || careerFallen;
    if (!terminal) {
      var activeJ = C && C.loot && C.loot.journey;
      var token = {
        C:C, B:B, winnerSide:winnerSide, type:_wcText(type || "", 32), preflight:preflight, consumed:false,
        runId:C && C.runId || null, creditKey:C && B ? _wcCreditKey(C, B) : null,
        personId:activeJ && activeJ.personId || null, outcome:preflight.outcome,
        resultId:preflight.participation ? preflight.participation.resultId : null
      };
      var priorToken = _wcPendingPreflight;
      _wcPendingPreflight = token;
      try { return delegate.apply(this, arguments); }
      finally { if (_wcPendingPreflight === token) _wcPendingPreflight = priorToken; }
    }
    var snapshot = warCareerTerminalPersist(C, B, winnerSide, type, preflight, campaignLoss ? "ironman-campaign-defeat" : "career-ironman-fallen");
    warCareerRenderTerminal(snapshot);
    return snapshot;
  };
  wrapped._warCareerWrapped = true;
  wrapped._warCareerDelegate = delegate;
  wrapped._slUndoWrapped = delegate._slUndoWrapped === true;
  campaignAdvance = wrapped;
  return wrapped;
}

function warCareerInstallBattleStart() {
  if (typeof startBattleRuntime !== "function") return null;
  if (startBattleRuntime._warCareerEvidenceWrapped) return startBattleRuntime;
  var delegate = startBattleRuntime;
  var wrapped = function (bd, playerSide, fromCampaign) {
    var result = delegate.apply(this, arguments);
    var C = (typeof G !== "undefined" && G) ? G.campaign : null;
    var B = (typeof G !== "undefined" && G) ? G.battle : null;
    if (fromCampaign === true && C && B && typeof warCareerBuildClassicEvidence === "function") {
      var evidence = warCareerBuildClassicEvidence(C, B);
      if (evidence) B.warCareerEvidence = evidence;
    }
    return result;
  };
  wrapped._warCareerEvidenceWrapped = true;
  wrapped._warCareerDelegate = delegate;
  startBattleRuntime = wrapped;
  return wrapped;
}

function warCareerInstallHandoffUI() {
  if (typeof document === "undefined" || document._warCareerHandoffDelegated) return false;
  document._warCareerHandoffDelegated = true;
  document.addEventListener("click", function (ev) {
    var node = ev && ev.target;
    while (node && node !== document && !(node.getAttribute && node.getAttribute("data-wc-handoff"))) node = node.parentNode;
    if (!node || node === document || typeof warCareerAcceptHandoff !== "function") return;
    var C = (typeof G !== "undefined" && G) ? G.campaign : null;
    var res = warCareerAcceptHandoff(C, node.getAttribute("data-wc-handoff"));
    if (!res.ok) { if (typeof toast === "function") toast(res.reasonText || res.reason || "Comrade hand-off could not be completed.", 2600); return; }
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
  return true;
}

(function () {
  if (typeof G !== "undefined" && G && G.campaign) warCareerInit(G.campaign);
  warCareerInstallBattleStart();
  warCareerInstallDispatcher();
  warCareerInstallHandoffUI();
})();

/* ================= SLICE F (D438, design §19): WAR END AND FRANCHISE ARCHIVE =================
   ARCHIVE_CANONICAL_OWNER:localStorage.cw_career_archive_v1 — ONE device-local archive owner,
   deliberately OUTSIDE the campaign save envelope (_SAVE_VER untouched; nothing rides the save;
   legacy campaigns byte-equivalent). Pure-read capture at the single war-end chokepoint BEFORE
   campaign nullification (chain + D119 strategic ends both funnel through warWonScreen); read-
   side sanitation drops malformed records, never repairs; every localStorage failure is silent-
   safe in both directions. No combat/political/decision/appointment/resource change. */
var _WC_ARCHIVE_KEY = "cw_career_archive_v1";
var _WC_ARCHIVE_CAP = 20;
function _wcArcStr(v, max) { return (typeof v === "string" && v.length > 0 && v.length <= (max || 80) && v.indexOf("<") < 0) ? v : null; }
function _wcArcNum(v) { return (typeof v === "number" && isFinite(v) && v >= 0) ? Math.round(v) : 0; }
function _wcArchiveSanitizeRecord(r) {
  var KEYS = ["archiveVersion", "side", "final", "endReason", "battles", "won", "suff", "infl", "gradeLetter", "iron", "ruleset", "timelineName", "career", "capturedAt"];
  var CKEYS = ["name", "rank", "role", "promotions", "credits", "lineageLen", "handoffState", "mattersOfState"];
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  var k;
  for (k in r) if (Object.prototype.hasOwnProperty.call(r, k) && KEYS.indexOf(k) < 0) return null;
  if (r.archiveVersion !== 1 || (r.side !== "US" && r.side !== "CS") || r.final !== true) return null;
  if (["chain", "will", "recognition"].indexOf(r.endReason) < 0) return null;
  var nums = [r.battles, r.won, r.suff, r.infl, r.capturedAt], ni;
  for (ni = 0; ni < nums.length; ni++) if (!(typeof nums[ni] === "number" && isFinite(nums[ni]) && nums[ni] >= 0)) return null;
  if (r.gradeLetter !== null && !(typeof r.gradeLetter === "string" && r.gradeLetter.length >= 1 && r.gradeLetter.length <= 2)) return null;
  if (typeof r.iron !== "boolean" || (r.ruleset !== "historical" && r.ruleset !== "mayhem")) return null;
  if (r.timelineName !== null && _wcArcStr(r.timelineName) === null) return null;
  if (r.career !== null) {
    var c = r.career;
    if (!c || typeof c !== "object" || Array.isArray(c)) return null;
    for (k in c) if (Object.prototype.hasOwnProperty.call(c, k) && CKEYS.indexOf(k) < 0) return null;
    if (c.name !== null && _wcArcStr(c.name) === null) return null;
    if (c.rank !== null && _wcArcStr(c.rank) === null) return null;
    if (c.role !== null && _wcArcStr(c.role) === null) return null;
    if (!(typeof c.promotions === "number" && isFinite(c.promotions) && c.promotions >= 0)) return null;
    if (!(typeof c.credits === "number" && isFinite(c.credits) && c.credits >= 0)) return null;
    if (!(typeof c.lineageLen === "number" && isFinite(c.lineageLen) && c.lineageLen >= 0)) return null;
    if (c.handoffState !== null && _wcArcStr(c.handoffState, 16) === null) return null;
    if (typeof c.mattersOfState !== "boolean") return null;
  }
  return r;
}
function warCareerArchiveRead() {
  var raw = null;
  try { raw = localStorage.getItem(_WC_ARCHIVE_KEY); } catch (e) { return []; }
  if (!raw) return [];
  var j = null;
  try { j = JSON.parse(raw); } catch (e2) { return []; }
  if (!j || typeof j !== "object" || Array.isArray(j) || j.version !== 1 || !Array.isArray(j.records)) return [];
  var out = [];
  for (var i = 0; i < j.records.length && out.length < _WC_ARCHIVE_CAP; i++) {
    var r = _wcArchiveSanitizeRecord(j.records[i]);
    if (r) out.push(r);
  }
  return out;
}
/* Assemble the closed §19 record by PURE reads — every subsystem guarded; never throws out. */
function warCareerArchiveRecord(C) {
  if (!C || typeof C !== "object") return null;
  var st = C.stats || {};
  var rec = {
    archiveVersion: 1,
    side: (C.side === "CS") ? "CS" : "US",
    final: true,
    endReason: "chain",
    battles: _wcArcNum(st.battles), won: _wcArcNum(st.won), suff: _wcArcNum(st.suff), infl: _wcArcNum(st.infl),
    gradeLetter: null,
    iron: C.iron === true,
    ruleset: "historical",
    timelineName: _wcArcStr(C.timelineName),
    career: null,
    capturedAt: Date.now()
  };
  // the D119 one-shot, read BEFORE the base consumes it (this runs pre-delegate)
  try { if (typeof _aarEndReason !== "undefined" && (_aarEndReason === "will" || _aarEndReason === "recognition")) rec.endReason = _aarEndReason; } catch (e0) {}
  try { if (typeof _aarDomains === "function" && typeof aarOverall === "function") { var ov = aarOverall(_aarDomains(C)); rec.gradeLetter = (ov && ov.grade && typeof ov.grade.letter === "string") ? ov.grade.letter.slice(0, 2) : null; } } catch (e1) {}
  try { if (typeof mayhemRuleset === "function") { var rs = mayhemRuleset(C); if (rs && rs.id === "mayhem") rec.ruleset = "mayhem"; } } catch (e2) {}
  try {
    var J = C.loot && C.loot.journey;
    if (J && J.careerVersion === 1) {
      var p = J.person || {};
      var caps = null;
      try { if (typeof warCareerCapabilities === "function") caps = warCareerCapabilities(C); } catch (e3) { caps = null; }
      rec.career = {
        name: _wcArcStr(String(p.name || "")), rank: _wcArcStr(String(p.rank || "")),
        role: _wcArcStr(String(J.role || p.role || "")),
        promotions: _wcArcNum(J.promotionCount),
        credits: _wcArcNum(Array.isArray(J.creditLedger) ? J.creditLedger.length : 0),
        lineageLen: _wcArcNum(Array.isArray(J.lineage) ? J.lineage.length : 0),
        handoffState: J.handoff ? _wcArcStr(String(J.handoff.state || ""), 16) : null,
        mattersOfState: !!(caps && caps.nationalDecisions === true)
      };
    }
  } catch (e4) { rec.career = null; }
  return _wcArchiveSanitizeRecord(rec);
}
function warCareerArchiveCapture(C) {
  var rec = warCareerArchiveRecord(C);
  if (!rec) return false;
  var records = warCareerArchiveRead();
  records.unshift(rec);
  if (records.length > _WC_ARCHIVE_CAP) records = records.slice(0, _WC_ARCHIVE_CAP);
  try { localStorage.setItem(_WC_ARCHIVE_KEY, JSON.stringify({ version: 1, records: records })); return true; }
  catch (e) { return false; }   // quota/private mode: silently safe — the war-end screen must render regardless
}
/* The Franchise Record gallery — renders ONLY what the sanitized read returns; empty -> "". */
function warCareerArchiveHTML() {
  var records = warCareerArchiveRead();
  if (!records.length) return "";
  var esc = (typeof _wcEsc === "function") ? _wcEsc : function (v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var REASON = { chain: "the war fought through", will: "a negotiated peace", recognition: "recognized independence" };
  var rows = "";
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var line = (r.side === "CS" ? "Confederate" : "Union") + " · " + (REASON[r.endReason] || r.endReason)
      + (r.gradeLetter ? " · grade " + esc(r.gradeLetter) : "") + " · " + r.won + "/" + r.battles + " battles"
      + (r.iron ? " · Ironman" : "") + (r.ruleset === "mayhem" ? " · Mayhem" : "");
    if (r.career) {
      var cLine = [r.career.rank, r.career.name].filter(function (x) { return !!x; }).join(" ");
      if (cLine) line += "<br><span style=\"opacity:.75;font-size:11px\">" + esc(cLine)
        + (r.career.promotions ? " · " + r.career.promotions + " promotion" + (r.career.promotions === 1 ? "" : "s") : "")
        + (r.career.lineageLen ? " · " + r.career.lineageLen + " hand-off" + (r.career.lineageLen === 1 ? "" : "s") : "")
        + (r.career.mattersOfState ? " · Matters of State" : "") + "</span>";
    }
    rows += '<li style="margin:4px 0">' + line + "</li>";
  }
  return '<div class="wcArchive" role="region" aria-label="The Franchise Record - your finished wars" style="margin-top:14px;padding:11px;border:1px solid var(--rule,#6b5a3e);border-radius:5px">'
    + '<b style="font-size:13px">The Franchise Record</b>'
    + '<div style="font-size:11px;opacity:.72">Every war this device has fought to its end, newest first. A device-local record - it never rides a save.</div>'
    + '<ol style="margin:6px 0 0;padding-left:20px;font-size:12px">' + rows + "</ol></div>";
}
/* The single-chokepoint wrapper (the D425 idiom: markers + delegate propagated). */
(function warCareerArchiveInstall() {
  if (typeof warWonScreen !== "function" || warWonScreen._warCareerArchiveWrapped === true) return;
  var base = warWonScreen;
  var wrapped = function () {
    try { var C = (typeof G !== "undefined" && G) ? G.campaign : null; if (C) warCareerArchiveCapture(C); } catch (e) {}
    var ret = base.apply(this, arguments);
    try {
      var rep = document.getElementById("wwReport");
      if (rep && rep.parentNode) {
        var html = warCareerArchiveHTML();
        if (html) { var d = document.createElement("div"); d.innerHTML = html; rep.parentNode.insertBefore(d, rep.nextSibling); }
      }
    } catch (e2) {}
    return ret;
  };
  for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) { try { wrapped[k] = base[k]; } catch (e3) {} }
  wrapped._warCareerArchiveWrapped = true;
  wrapped._warCareerArchiveDelegate = base;
  warWonScreen = wrapped;
})();
