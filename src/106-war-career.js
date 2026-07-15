/* ===========================================================================
   D400 · 106-war-career.js — WAR_CAREER_RUNTIME_V1.

   D401 Slice B extends the canonical spine with consequence-only identity:
     - C.loot.journey remains the one mutable person-career record;
     - a source-owned scenario-unit slot proves participation across modes;
     - personal fate is classified purely before delegation and committed only
       in the post-undo result seam;
     - normal fallen careers enter deterministic COMRADE HAND-OFF;
     - role/capability readers are pure after idempotent initialization;
     - the live post-save-slot campaignAdvance binding is wrapped by assignment;
     - an Ironman campaign defeat is classified before any write and terminates
       without delegation, recovery, reward, undo, save, or upgrade.

   No combat input, aggregate-casualty inference, relationship mutation,
   political gate, command bonus, franchise store, or save-version change lives
   here. Slice C command projection remains locked.
   =========================================================================== */

var _WC_EVENT_MAX = 96;
var _WC_HANDOFF_MAX = 5;
var _wcRunSeq = 0;
var _wcLastTerminalSnapshot = null;
var _wcTerminalRenderKey = "";
var _wcPendingPreflight = null;

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
  var route = link && _wcRouteUnit(B && B.units, C.side, link.ref.unitId);
  if (route && route.ambiguous) return null;
  if (link && !route) route = _wcAssignRouteUnit(link, B && B.units);
  return route ? _wcResultEvidence(link, "classic", route, B && B.bd && B.bd.year, []) : null;
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
  var ref = _wcUnitRef(J.person.unitRef), raw = B.warCareerEvidence;
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
    participation.slotPid, "personal-fate"].join("|")) % 1000;
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
  var ref = participation && _wcUnitRef(participation), year = participation && participation.battleYear != null ? Number(participation.battleYear) : null;
  var selectionRank = _wcText(participation && participation.rankAtResult || "", 80);
  var basePid = _wcSafeId(basePersonId || J.personId, 180), canonicalBase = null, baseCount = 0;
  for (var bi = 0; bi < people.length; bi++) if (people[bi] && people[bi].pid === basePid) { canonicalBase = people[bi]; baseCount++; }
  if (!ref || !selectionRank || !isFinite(year) || year < 1860 || year > 1870 || baseCount !== 1 || !canonicalBase || canonicalBase.side !== C.side ||
      !_wcSameUnitRef(canonicalBase.unitRef, ref)) return [];
  if (basePid === J.personId && (!_wcSameUnitRef(J.person.unitRef, ref) || J.person.side !== C.side)) return [];
  var hierarchyBase = { unitRef:_wcUnitRef(canonicalBase.unitRef), team:canonicalBase.team || {}, rank:selectionRank };
  var prior = {}, pidCount = {}, slotCount = {}, i;
  for (i = 0; i < (J.lineage || []).length; i++) if (J.lineage[i] && J.lineage[i].personId) prior[J.lineage[i].personId] = true;
  for (i = 0; i < people.length; i++) {
    var countP = people[i], countRef = countP && _wcUnitRef(countP.unitRef);
    if (countP && countP.pid) pidCount[countP.pid] = (pidCount[countP.pid] || 0) + 1;
    if (countRef) slotCount[countRef.slotPid] = (slotCount[countRef.slotPid] || 0) + 1;
  }
  var currentRank = _wcRankOrdinal(hierarchyBase.rank), out = [];
  for (i = 0; i < people.length; i++) {
    var p = people[i], pr = p && _wcUnitRef(p.unitRef), provRank = _wcProvenanceRank(p);
    if (!p || !p.pid || p.pid === basePid || prior[p.pid] || pidCount[p.pid] !== 1 || !pr || slotCount[pr.slotPid] !== 1) continue;
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
    unitRef:_wcUnitRef(participation), candidateIds:ids, selectedPersonId:null,
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
  var note = recoveredCapture
    ? "The selected person returns from captivity after sitting out a distinct campaign result. This deterministic recovery is nonqualifying and grants no merit, promotion, command, or political authority."
    : preflight.qualifying
    ? "Explicit " + preflight.participation.mode + " participation recorded before delegation; personal fate " + fate + ". Slice B grants no merit, promotion, command, or political authority."
    : "Result observed for the War Career; explicit participation was not proved (" + preflight.reason + "), so this entry earns no advancement and infers no personal fate.";
  var event = {
    eventId:_wcEventId(C, J), ordinal:J.eventOrdinal, kind:"result", creditKey:key,
    personId:J.personId, scenarioId:bid || null, battleName:bname, outcome:outcome,
    type:_wcText(type || "", 32), status:fate, fate:preflight.qualifying ? fate : null,
    qualifying:preflight.qualifying, merit:0, reputation:0, note:note
  };
  if (preflight.qualifying) event.participation = preflight.participation;
  if (recoveredCapture) event.recoveryOfCreditKey = capturedCredit.creditKey;
  _wcPushEvent(J, event);

  if (!Array.isArray(J.creditLedger)) J.creditLedger = [];
  if (!credit && J.creditLedger.length < _wcFiniteRungs(C)) {
    credit = {
      creditKey:key, runId:C.runId, side:C.side, chainIndex:Math.max(0, Math.round(Number(C.idx) || 0)),
      scenarioId:bid || "", outcome:outcome, type:_wcText(type || "", 32), outcomeRank:rank,
      personId:J.personId, fate:preflight.qualifying ? fate : null,
      qualifying:preflight.qualifying, merit:0, reputation:0, eventId:event.eventId, eventDate:null
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
    credit.merit = 0; credit.reputation = 0; credit.eventDate = null;
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
  if (recoveredCapture) {
    capturedCredit.recoveredAtCreditKey = key;
    capturedCredit.recoveryEventId = event.eventId;
  }

  J.merit = 0;
  J.reputation = 0;
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
  if (typeof _ssSyncPersonCareer === "function") _ssSyncPersonCareer(C.loot);
  return { ok:true, eventId:event.eventId, creditKey:key, outcome:outcome, qualifying:preflight.qualifying,
    fate:preflight.qualifying ? fate : null, recoveredCapture:recoveredCapture,
    handoff:J.handoff && J.handoff.state || null, merit:0, reputation:0 };
}

function warCareerRole(C) {
  var J = warCareerInit(C);
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person) return { id:"legacy-or-inactive", label:"Legacy campaign", reason:"No explicit War Career is active." };
  var status = typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive";
  if (status === "captured" || status === "fallen" || status === "retired" || status === "war-ended") {
    return { id:"unavailable", label:"Unavailable", reason:"The active person is " + status + " and cannot exercise command authority.", status:status };
  }
  var r = typeof _ssRankNorm === "function" ? _ssRankNorm(J.person.rank) : _wcText(J.person.rank, 80).toLowerCase();
  var label = "Rank and file", id = "rank-and-file";
  if (/^(sergeant|sgt|first sergeant|1st sgt|sergeant major|lieutenant|lt|1st lt|2nd lt|first lieutenant|second lieutenant|captain|capt)$/.test(r)) { id = "junior-command"; label = "Junior command"; }
  else if (/^(major|maj|lt col|lt\. col|lieutenant colonel|colonel|col)$/.test(r)) { id = "field-command"; label = "Field command"; }
  else if (/^(brig gen|brig\. gen|brigadier|brigadier general|maj gen|maj\. gen|major general|lt gen|lt\. gen|lieutenant general|general|gen)$/.test(r)) { id = "general-command"; label = "General command"; }
  return { id:id, label:label, reason:"Role is derived from the current rank; Slice B grants no new authority.", status:status, rank:J.person.rank || "Soldier" };
}
function warCareerCapabilities(C) {
  var role = warCareerRole(C);
  var active = role.id !== "legacy-or-inactive" && role.id !== "unavailable";
  return {
    role:role.id,
    personalStory:active,
    armyRegister:true,
    strategicReadOnly:true,
    localOrders:false,
    fieldCommand:false,
    nationalDecisions:false,
    cabinetMutation:false,
    appointmentMutation:false,
    resourceMutation:false,
    reason:active ? "Slice B records proved participation and personal fate only; command and political mutations remain locked." : role.reason
  };
}
function warCareerCommandProjection(C) {
  warCareerRole(C);
  return 0;
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
    + '<div style="font-size:11px;line-height:1.45">Role: <b>' + _wcEsc(role.label) + '</b> · events ' + _wcEsc((J.events || []).length) + ' · distinct credits ' + _wcEsc(credits.length) + ' · qualifying ' + _wcEsc(qualifying) + '.</div>'
    + '<div style="font-size:11px;line-height:1.45;opacity:.78">Unproved observations remain nonqualifying. Slice B keeps merit 0, reputation 0, no promotion, command, or political authority.</div>'
    + warCareerHandoffHTML(C)
    + '</section>';
}
function warCareerReportHTML(C, opts) {
  var J = warCareerInit(C);
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
    + '<li>Unproved entries are nonqualifying. Slice B keeps merit 0, reputation 0, and no promotion, relationship, command, or political award.</li>'
    + '<li>Personal fate: ' + _wcEsc(typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive") + '; lineage hand-offs ' + _wcEsc((J.lineage || []).length) + '.</li>'
    + '</ul>' + warCareerHandoffHTML(C) + '</section>';
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
