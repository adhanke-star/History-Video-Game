/* ===========================================================================
   D400 · 106-war-career.js — WAR_CAREER_RUNTIME_V1.

   Slice A owns only the minimal canonical spine and terminal honesty:
     - C.loot.journey remains the one mutable person-career record;
     - result observations are nonqualifying and award nothing;
     - role/capability readers are pure after idempotent initialization;
     - the live post-save-slot campaignAdvance binding is wrapped by assignment;
     - an Ironman campaign defeat is classified before any write and terminates
       without delegation, recovery, reward, undo, save, or upgrade.

   No combat input, personal-fate roll, relationship mutation, political gate,
   command bonus, franchise store, or save-version change lives here.
   =========================================================================== */

var _WC_EVENT_MAX = 96;
var _wcRunSeq = 0;
var _wcLastTerminalSnapshot = null;
var _wcTerminalRenderKey = "";

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
    reasonText:converting ? "Convert this eligible Journey explicitly; its existing record is preserved." : "Eligible Private-through-Captain start with a stable same-side unit.",
    label:converting ? "Convert to War Career" : "Begin War Career",
    anchor:_wcTeamAnchor(p)
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
  while (J.events.length > _WC_EVENT_MAX) J.events.shift();
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
function _wcFiniteRungs(C) {
  if (typeof CHAINS !== "undefined" && CHAINS && C && Array.isArray(CHAINS[C.side])) return CHAINS[C.side].length;
  return 64;
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
      person:typeof _ssJourneySnapshot === "function" ? _ssJourneySnapshot(p) : p,
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
  J.terminal = null;
  J.currentBillet = null;
  var note = can.converting
    ? "This existing Journey was explicitly converted to War Career v1; prior entries remain compatibility history."
    : "War Career begins with " + p.name + (bname ? " before " + bname : "") + ".";
  var startEvent = {
    eventId:_wcEventId(C, J), ordinal:J.eventOrdinal, kind:"start", creditKey:null,
    scenarioId:bid || null, battleName:bname, outcome:"start", type:"", status:"alive",
    qualifying:false, merit:0, reputation:0, note:note
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

function warCareerObserveResolve(winnerSide, type, B, C, win) {
  var J = warCareerInit(C);
  if (!J || !J.enabled || J.careerVersion !== 1) return { ok:false, reason:"inactive" };
  if (!B || B.fromCampaign !== true) return { ok:false, reason:"noncampaign" };
  var bid = _wcBattleId(B, C), bname = _wcBattleName(B, bid);
  var outcome = _wcOutcome(winnerSide, C, B, win);
  var rank = _wcOutcomeRank(outcome, type);
  var key = _wcCreditKey(C, B);
  var event = {
    eventId:_wcEventId(C, J), ordinal:J.eventOrdinal, kind:"result", creditKey:key,
    scenarioId:bid || null, battleName:bname, outcome:outcome,
    type:_wcText(type || "", 32), status:typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive",
    qualifying:false, merit:0, reputation:0,
    note:"Result observed for the War Career; no participation evidence exists, so this entry earns no advancement."
  };
  _wcPushEvent(J, event);

  if (!Array.isArray(J.creditLedger)) J.creditLedger = [];
  var credit = _wcCreditFor(J, key);
  if (!credit && J.creditLedger.length < _wcFiniteRungs(C)) {
    credit = {
      creditKey:key, runId:C.runId, side:C.side, chainIndex:Math.max(0, Math.round(Number(C.idx) || 0)),
      scenarioId:bid || "", outcome:outcome, type:_wcText(type || "", 32), outcomeRank:rank,
      qualifying:false, merit:0, reputation:0, eventId:event.eventId, eventDate:null
    };
    J.creditLedger.push(credit);
  } else if (credit && rank > Number(credit.outcomeRank || 0)) {
    credit.outcome = outcome;
    credit.type = _wcText(type || "", 32);
    credit.outcomeRank = rank;
    credit.eventId = event.eventId;
    credit.qualifying = false;
    credit.merit = 0;
    credit.reputation = 0;
    credit.eventDate = null;
  }

  J.merit = 0;
  J.reputation = 0;
  J.currentBattleId = bid || null;
  J.lastBattleId = bid || null;
  J.lastBattleName = bname;
  J.lastOutcome = outcome;
  J.lastTurn = typeof _lootTurn === "function" ? _lootTurn(C) : 0;
  J.battles = Math.max(0, Math.round(Number(J.battles) || 0)) + 1;
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
  return { ok:true, eventId:event.eventId, creditKey:key, outcome:outcome, qualifying:false, merit:0, reputation:0 };
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
  return { id:id, label:label, reason:"Role is derived from the current rank; Slice A grants no new authority.", status:status, rank:J.person.rank || "Soldier" };
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
    reason:active ? "Slice A records nonqualifying observations only; command and political mutations remain locked." : role.reason
  };
}
function warCareerCommandProjection(C) {
  warCareerRole(C);
  return 0;
}

function warCareerSummaryHTML(C) {
  var J = warCareerInit(C);
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person) return "";
  var role = warCareerRole(C);
  return '<section data-war-career-summary="1" aria-labelledby="wcSummaryHead" style="margin-top:9px;padding:9px;border:1px solid rgba(184,134,59,.62);border-radius:5px">'
    + '<h3 id="wcSummaryHead" style="font-size:12px;margin:0 0 4px">War Career — Your Timeline</h3>'
    + '<div style="font-size:11px;line-height:1.45">Role: <b>' + _wcEsc(role.label) + '</b> · events ' + _wcEsc((J.events || []).length) + ' · distinct credits ' + _wcEsc((J.creditLedger || []).length) + '.</div>'
    + '<div style="font-size:11px;line-height:1.45;opacity:.78">Slice A observations are nonqualifying: merit 0, reputation 0, no promotion or political authority.</div>'
    + '</section>';
}
function warCareerReportHTML(C, opts) {
  var J = warCareerInit(C);
  if (!J || !J.enabled || J.careerVersion !== 1 || !J.person) return "";
  var role = warCareerRole(C), events = Array.isArray(J.events) ? J.events : [], credits = Array.isArray(J.creditLedger) ? J.creditLedger : [];
  var last = events.length ? events[events.length - 1] : null;
  return '<section data-war-career-report="1" aria-labelledby="wcReportHead" style="margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10);overflow-wrap:anywhere">'
    + '<h3 id="wcReportHead" style="font-size:12.5px;margin:0 0 4px">War Career — Your Timeline</h3>'
    + '<div style="font-size:11px;line-height:1.5"><b>' + _wcEsc(J.person.name || "Selected person") + '</b> · ' + _wcEsc(J.person.rank || "Soldier") + ' · ' + _wcEsc(role.label) + ' · ' + _wcEsc(typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive") + '.</div>'
    + '<ul style="font-size:11px;line-height:1.5;margin:6px 0 0;padding-left:18px">'
    + '<li>' + _wcEsc(events.length) + ' narrative observation' + (events.length === 1 ? "" : "s") + '; newest: ' + _wcEsc(last ? (last.battleName || last.kind) : "career start") + '.</li>'
    + '<li>' + _wcEsc(credits.length) + ' distinct campaign credit' + (credits.length === 1 ? "" : "s") + '; recovery retries cannot stack credit.</li>'
    + '<li>All Slice-A entries are nonqualifying — merit 0, reputation 0, and no promotion, death, relationship, command, or political award.</li>'
    + '</ul></section>';
}

function warCareerIsTerminalLoss(C, B, winnerSide) {
  return !!(C && C.iron && B && B.fromCampaign && winnerSide !== null && winnerSide !== (B.playerSide || C.side));
}
function _wcBuildTerminalSnapshot(C, B, winnerSide, type) {
  var J = C && C.loot && C.loot.journey;
  var p = J && J.person;
  var runId = warCareerRunIdValid(C && C.runId) ? C.runId : null;
  return {
    schema:"cw_war_career_terminal_v1",
    reason:"ironman-campaign-defeat",
    runId:runId,
    side:C && C.side === "CS" ? "CS" : "US",
    battleId:_wcBattleId(B, C) || null,
    battleName:_wcBattleName(B, _wcBattleId(B, C)),
    winnerSide:winnerSide === "CS" ? "CS" : (winnerSide === "US" ? "US" : null),
    resultType:_wcText(type || "", 32),
    stats:{
      battles:Math.max(0, Math.round(Number(C && C.stats && C.stats.battles) || 0)),
      won:Math.max(0, Math.round(Number(C && C.stats && C.stats.won) || 0)),
      infl:Math.max(0, Math.round(Number(C && C.stats && C.stats.infl) || 0)),
      suff:Math.max(0, Math.round(Number(C && C.stats && C.stats.suff) || 0))
    },
    rosterCount:Array.isArray(C && C.roster) ? C.roster.length : 0,
    person:p ? { pid:_wcSafeId(p.pid || (J && J.personId), 180) || null, name:_wcText(p.name || "", 120), rank:_wcText(p.rank || "", 80), status:typeof _ssStatus === "function" ? _ssStatus(J.status) : "alive" } : null,
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
function warCareerTerminalPersist(C, B, winnerSide, type) {
  var snapshot = _wcBuildTerminalSnapshot(C, B, winnerSide, type);
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
  var html = '<div id="wcTerminalScreen" data-war-career-terminal="1" role="region" aria-labelledby="wcTerminalHead">'
    + '<h1 id="wcTerminalHead" class="title-xl" style="text-align:center">The Campaign Has Ended</h1>'
    + '<p class="title-sub" style="text-align:center">' + _wcEsc(sideLabel) + ' Ironman Campaign — Final Field Dispatch</p>'
    + '<hr class="rule"><div class="verdict loss">Defeat at ' + _wcEsc(snapshot.battleName || "the field") + '</div>'
    + '<p class="lede" style="text-align:center">Ironman permits no recovery. This campaign is closed; no battle reward, upgrade, retry, or Continue save was created.</p>'
    + (snapshot.person ? '<p style="font-size:12px;text-align:center">War Career record: ' + _wcEsc(snapshot.person.name) + ' · ' + _wcEsc(snapshot.person.rank) + '. No personal death is inferred from this campaign result.</p>' : '')
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
    var terminal = warCareerIsTerminalLoss(C, B, winnerSide);
    if (!terminal) return delegate.apply(this, arguments);
    var snapshot = warCareerTerminalPersist(C, B, winnerSide, type);
    warCareerRenderTerminal(snapshot);
    return snapshot;
  };
  wrapped._warCareerWrapped = true;
  wrapped._warCareerDelegate = delegate;
  wrapped._slUndoWrapped = delegate._slUndoWrapped === true;
  campaignAdvance = wrapped;
  return wrapped;
}

(function () {
  if (typeof G !== "undefined" && G && G.campaign) warCareerInit(G.campaign);
  warCareerInstallDispatcher();
})();
