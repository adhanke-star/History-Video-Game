/* ===========================================================================
   Phase F/G · 71-real-diplomacy.js — real diplomacy system.

   Bounded D189 scope: diplomacy becomes a War Effort teaching/system surface
   beyond King Cotton: Trent, mediation, Laird rams, Russian fleet, King Wheat,
   and side-specific diplomatic priorities. Default bridge input is exact zero;
   active priorities are capped strategic tradeoffs that feed recognition /
   intervention pressure, never battle outputs.
   =========================================================================== */

function _rdNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _rdClamp(v, lo, hi) {
  v = _rdNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _rdRound(v) { return Math.round(_rdNum(v, 0)); }
function _rdData() {
  var D = gameData("diplomacy") || {};
  return D.realDiplomacy || {};
}
function _rdCfg() { var D = _rdData(); return D.config || {}; }
function _rdPriorities() {
  var D = _rdData();
  return Array.isArray(D.priorities) ? D.priorities : [];
}
function _rdCrises() {
  var D = _rdData();
  return Array.isArray(D.crises) ? D.crises : [];
}
function _rdPriority(id) {
  var list = _rdPriorities();
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
  return null;
}
function _rdSide(C) { return (C && C.side === "CS") ? "CS" : "US"; }
function _rdYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  if (C && C.clock && typeof C.clock.year === "number") return C.clock.year;
  if (C && C.president && C.president.date && typeof C.president.date.year === "number") return C.president.date.year;
  return campaignYear(C);
}
function _rdUnlocked(p, year) { return !!(p && _rdNum(p.unlockYear, 1861) <= year); }
function _rdAllowed(p, side, year) { return !!(p && (p.side === side || p.side === "both") && _rdUnlocked(p, year)); }

function realDiplomacyInit(C) {
  if (!C) return null;
  if (!C.realDiplomacy || typeof C.realDiplomacy !== "object" || Array.isArray(C.realDiplomacy)) C.realDiplomacy = {};
  var R = C.realDiplomacy, side = _rdSide(C), year = _rdYear(C, null);
  R.schema = "cw_real_diplomacy_v1";
  if (R.active !== true) R.active = false;
  if (!_rdAllowed(_rdPriority(R.priority), side, year)) R.priority = null;
  if (!R.priority) R.active = false;
  var caps = (_rdCfg().ledgerCaps || {});
  var capInfluence = _rdNum(caps.recognitionInfluence, 100);
  R.recognitionInfluence = _rdClamp(_rdNum(R.recognitionInfluence, 0), -capInfluence, capInfluence);
  R.crisisRisk = _rdClamp(_rdNum(R.crisisRisk, 0), 0, _rdNum(caps.crisisRisk, 100));
  R.neutralGoodwill = _rdClamp(_rdNum(R.neutralGoodwill, side === "US" ? 58 : 42), 0, _rdNum(caps.neutralGoodwill, 100));
  R.commercePressure = _rdClamp(_rdNum(R.commercePressure, 0), 0, _rdNum(caps.commercePressure, 100));
  if (!R.used || typeof R.used !== "object" || Array.isArray(R.used)) R.used = {};
  var list = _rdPriorities();
  for (var i = 0; i < list.length; i++) R.used[list[i].id] = R.used[list[i].id] === true;
  if (!Array.isArray(R.log)) R.log = [];
  if (R.log.length > 6) R.log.length = 6;
  if (R.lastTurn && (typeof R.lastTurn !== "object" || Array.isArray(R.lastTurn))) R.lastTurn = null;
  if (R.lastBridge && (typeof R.lastBridge !== "object" || Array.isArray(R.lastBridge))) R.lastBridge = null;
  return R;
}

function _rdWord(v, side) {
  v = _rdClamp(v, 0, 100);
  if (side === "CS") {
    if (v >= 75) return ["Recognition bid", "#6f9e5a"];
    if (v >= 50) return ["Window open", "#b8863b"];
    if (v >= 25) return ["Distant chance", "#c9712e"];
    return ["Isolated", "#d07060"];
  }
  if (v >= 75) return ["Neutrality held", "#6f9e5a"];
  if (v >= 50) return ["Watched closely", "#b8863b"];
  if (v >= 25) return ["Crisis weathered", "#c9712e"];
  return ["War scare", "#d07060"];
}

function _rdRiskWord(v) {
  v = _rdClamp(v, 0, 100);
  if (v >= 75) return ["Explosive", "#d07060"];
  if (v >= 50) return ["Dangerous", "#c9712e"];
  if (v >= 25) return ["Tense", "#b8863b"];
  return ["Contained", "#6f9e5a"];
}

function _rdMeter(label, v, lowerBetter) {
  v = _rdClamp(v, 0, 100);
  var color = lowerBetter ? _rdRiskWord(v)[1] : _rdWord(v, "US")[1];
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + color + '">' + _rdRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _rdRound(v) + '%;background:' + color + '"></div></div></div>';
}

function realDiplomacySnapshot(C) {
  var R = realDiplomacyInit(C);
  var side = _rdSide(C), year = _rdYear(C, null);
  var BL = (C && C.blockade) || {}, clk = (C && C.clock) || {};
  var mom = (typeof vicMomentum === "function") ? vicMomentum(C) : 0.5;
  var rawRecognition = _rdClamp(_rdNum(BL.recognition, 0) + (side === "CS" ? R.recognitionInfluence * 0.55 : R.recognitionInfluence * 0.25), 0, 100);
  var intervention = _rdClamp(_rdNum(clk.intervention, 0), 0, 100);
  var mediationBase = year === 1862 ? 58 : (year >= 1863 ? 18 : 34);
  var mediationWindow = _rdClamp(mediationBase + (side === "CS" ? (mom - 0.5) * 55 : (0.5 - mom) * 18) + rawRecognition * 0.18, 0, 100);
  var goodwill = _rdClamp(R.neutralGoodwill, 0, 100);
  var crisis = _rdClamp(10 + intervention * 0.36 + rawRecognition * 0.25 + R.crisisRisk * 0.45 - goodwill * 0.14 + (year === 1861 ? 8 : 0), 0, 100);
  var commerce = _rdClamp(R.commercePressure + (side === "CS" ? (1 - _rdNum(BL.importFactor, 0.85)) * 34 : R.commercePressure * 0.12), 0, 100);
  var score = side === "CS"
    ? _rdClamp(rawRecognition * 0.54 + mediationWindow * 0.24 + intervention * 0.22 - crisis * 0.12, 0, 100)
    : _rdClamp(100 - crisis * 0.45 - rawRecognition * 0.28 + goodwill * 0.22 + Math.max(0, -R.recognitionInfluence) * 0.18, 0, 100);
  var word = _rdWord(score, side);
  var active = !!(R && R.active && _rdAllowed(_rdPriority(R.priority), side, year));
  var p = active ? _rdPriority(R.priority) : null;
  return {
    side: side,
    year: year,
    score: _rdRound(score),
    word: word[0],
    color: word[1],
    recognitionPressure: _rdRound(rawRecognition),
    interventionRisk: _rdRound(intervention),
    crisisRisk: _rdRound(crisis),
    neutralGoodwill: _rdRound(goodwill),
    mediationWindow: _rdRound(mediationWindow),
    commercePressure: _rdRound(commerce),
    active: active,
    priority: p ? p.id : null,
    priorityLabel: p ? p.label : "None selected"
  };
}

function realDiplomacyBridgeBonus(C) {
  var R = realDiplomacyInit(C), snap = realDiplomacySnapshot(C);
  var p = R && R.priority ? _rdPriority(R.priority) : null;
  var active = !!(snap && R && R.active === true && _rdAllowed(p, snap.side, snap.year));
  var caps = (_rdCfg().bridgeCaps || {});
  var capMorale = _rdNum(caps.morale, 1), capSupply = _rdNum(caps.supply, 1), capFatigue = _rdNum(caps.fatigueCost, 1);
  var out = { active: active, priority: active && p ? p.id : null, morale: 0, supply: 0, fatigue: 0, overall: 0, capped: true };
  if (active && p) {
    out.morale = _rdRound(_rdClamp(_rdNum(p.moraleBridge, 0), -capMorale, capMorale));
    out.supply = _rdRound(_rdClamp(_rdNum(p.supplyBridge, 0), -capSupply, capSupply));
    out.fatigue = _rdRound(_rdClamp(_rdNum(p.fatigueBridge, 0), 0, capFatigue));
    out.overall = 0;
  }
  if (R) R.lastBridge = out;
  return out;
}

function realDiplomacySetPriority(C, priority) {
  var R = realDiplomacyInit(C);
  if (!R) return null;
  var side = _rdSide(C), year = _rdYear(C, null), p = _rdPriority(priority);
  if (_rdAllowed(p, side, year)) {
    R.active = true;
    R.priority = p.id;
  } else {
    R.active = false;
    R.priority = null;
  }
  R.lastBridge = realDiplomacyBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return R;
}

function realDiplomacyOnResolve(winnerSide, type, B, C, win) {
  var R = realDiplomacyInit(C);
  if (!R) return;
  var side = _rdSide(C), year = _rdYear(C, B), p = R.priority ? _rdPriority(R.priority) : null;
  var active = !!(R.active && _rdAllowed(p, side, year));
  var rec = 0, intr = 0, crisis = 0, goodwill = 0, commerce = 0, cap = 0;
  if (active && p) {
    rec = _rdNum(p.recognitionDelta, 0);
    intr = _rdNum(p.interventionDelta, 0);
    crisis = _rdNum(p.crisisDelta, 0);
    goodwill = _rdNum(p.goodwillDelta, 0);
    commerce = _rdNum(p.commerceDelta, 0);
    cap = _rdNum(p.capitalCost, 0);
    var caps = (_rdCfg().ledgerCaps || {});
    R.recognitionInfluence = _rdClamp(_rdNum(R.recognitionInfluence, 0) + rec, -_rdNum(caps.recognitionInfluence, 100), _rdNum(caps.recognitionInfluence, 100));
    R.crisisRisk = _rdClamp(_rdNum(R.crisisRisk, 0) + crisis, 0, _rdNum(caps.crisisRisk, 100));
    R.neutralGoodwill = _rdClamp(_rdNum(R.neutralGoodwill, 50) + goodwill, 0, _rdNum(caps.neutralGoodwill, 100));
    R.commercePressure = _rdClamp(_rdNum(R.commercePressure, 0) + commerce, 0, _rdNum(caps.commercePressure, 100));
    if (C.blockade && typeof C.blockade.recognition === "number") {
      C.blockade.recognition = _rdClamp(C.blockade.recognition + rec * 0.45, 0, 100);
      if (rec > 0 && C.blockade.recognitionForeclosed && year <= 1862) C.blockade.recognitionForeclosed = false;
    }
    if (C.clock) {
      C.clock.intervention = _rdClamp(_rdNum(C.clock.intervention, 0) + intr, 0, 100);
      C.clock.capital = _rdClamp(_rdNum(C.clock.capital, 0) - cap, 0, 999999);
    }
    R.used[p.id] = true;
  }
  var snap = realDiplomacySnapshot(C);
  R.lastTurn = {
    year: snap.year,
    active: active,
    priority: active && p ? p.id : null,
    recognitionDelta: rec,
    interventionDelta: intr,
    crisisDelta: crisis,
    goodwillDelta: goodwill,
    commerceDelta: commerce,
    capitalCost: cap,
    score: snap.score,
    crisisRisk: snap.crisisRisk
  };
  var line = active && p
    ? p.shortLabel + ": recognition " + (rec >= 0 ? "+" : "") + rec + ", intervention " + (intr >= 0 ? "+" : "") + intr + "."
    : snap.word + ": diplomacy score " + snap.score + ", crisis " + snap.crisisRisk + ".";
  logPush(R, "log", line, 6);
}

function _rdPriorityCard(p, snap, R) {
  if (!p) return "";
  var allowed = _rdAllowed(p, snap.side, snap.year);
  var selected = !!(allowed && R && R.active && R.priority === p.id);
  var border = selected ? "var(--brass-lt,#c9a85f)" : "var(--rule)";
  return '<div style="flex:1 1 215px;min-width:200px;border:1px solid ' + border + ';border-radius:5px;padding:8px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'
    + '<div><b>' + htmlEsc(p.label || p.id) + '</b><div style="font-size:11px;opacity:.68">' + htmlEsc(p.side || "") + ' &middot; unlocks ' + htmlEsc(p.unlockYear || 1861) + '</div></div>'
    + '<span style="font-size:10px;border:1px solid var(--rule);border-radius:999px;padding:1px 6px">' + (allowed ? "available" : "later") + '</span>'
    + '</div>'
    + '<div style="font-size:11px;line-height:1.4;margin-top:5px;opacity:.82">' + htmlEsc(p.summary || "") + '</div>'
    + '<div style="font-size:11px;line-height:1.4;margin-top:5px;opacity:.72">' + htmlEsc(p.playerTradeoff || "") + '</div>'
    + '<button type="button" class="upg" data-rdpriority="' + htmlEsc(p.id) + '" aria-pressed="' + (selected ? 'true' : 'false') + '" '
    + (!allowed ? 'disabled ' : '') + 'style="margin-top:7px;padding:4px 8px">' + (selected ? 'Priority active' : 'Prioritize') + '</button>'
    + '</div>';
}

function _rdCrisisCard(c, currentYear) {
  if (!c) return "";
  var live = _rdNum(c.year, 1861) === currentYear;
  return '<div style="flex:1 1 190px;min-width:180px;border:1px solid var(--rule);border-radius:5px;padding:8px;background:' + (live ? 'rgba(184,134,59,.16)' : 'rgba(0,0,0,.10)') + '">'
    + '<div style="display:flex;justify-content:space-between;gap:8px"><b>' + htmlEsc(c.label || c.id) + '</b><span style="font-size:10px;opacity:.72">' + htmlEsc(c.year || "") + '</span></div>'
    + '<div style="font-size:11px;line-height:1.4;margin-top:5px;opacity:.82">' + htmlEsc(c.summary || "") + '</div>'
    + '<div style="font-size:11px;line-height:1.4;margin-top:5px;opacity:.68">' + htmlEsc(c.gameMeaning || "") + '</div>'
    + '</div>';
}

function presRealDiplomacyBlock(C) {
  if (!C) return "";
  var R = realDiplomacyInit(C), snap = realDiplomacySnapshot(C), D = _rdData();
  var profile = D.profile || {}, priorities = _rdPriorities(), cards = "", shown = 0;
  for (var i = 0; i < priorities.length; i++) {
    if (priorities[i] && priorities[i].side === snap.side) { cards += _rdPriorityCard(priorities[i], snap, R); shown++; }
  }
  if (!shown) cards = '<p class="lede" style="font-size:12px;opacity:.7">No active diplomatic priorities for this side.</p>';
  var crises = _rdCrises(), crisisHTML = "";
  for (var c = 0; c < crises.length; c++) crisisHTML += _rdCrisisCard(crises[c], snap.year);
  var debates = D.debates || [], debateHTML = "";
  for (var d = 0; d < debates.length; d++) {
    if (debates[d]) debateHTML += '<div style="margin-top:4px"><b>' + htmlEsc(debates[d].title) + ':</b> ' + htmlEsc(debates[d].summary) + '</div>';
  }
  var log = "";
  if (R.log && R.log.length) {
    for (var j = 0; j < R.log.length && j < 3; j++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(R.log[j]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Real Diplomacy System</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:650px">Trent, mediation, Laird rams, Russian fleet, King Wheat, and recognition pressure on the same foreign-affairs board.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.score + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (snap.active ? 'Diplomatic priority active: ' + htmlEsc(snap.priorityLabel) : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _rdMeter('Recognition pressure', snap.recognitionPressure, true)
    + _rdMeter('Intervention risk', snap.interventionRisk, true)
    + _rdMeter('Crisis risk', snap.crisisRisk, true)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _rdMeter('Neutral goodwill', snap.neutralGoodwill, false)
    + _rdMeter('Mediation window', snap.mediationWindow, snap.side === "US")
    + _rdMeter('Commerce pressure', snap.commercePressure, true)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || 'World diplomacy') + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Ledger: recognition influence <b>' + _rdRound(R.recognitionInfluence) + '</b>, crisis risk <b>' + _rdRound(R.crisisRisk)
    + '</b>, neutral goodwill <b>' + _rdRound(R.neutralGoodwill) + '</b>, commerce pressure <b>' + _rdRound(R.commercePressure) + '</b>.</div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:9px">' + cards + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:9px">' + crisisHTML + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="font-size:12px"><b>Capped bridge contract</b><div style="opacity:.72">An active diplomatic priority can affect morale, supply, or fatigue at tiny caps. It never writes winners, casualties, OOB, or a direct overall bonus.</div></div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">Caps: +/-' + _rdNum((_rdCfg().bridgeCaps || {}).morale, 1)
    + ' morale, +/-' + _rdNum((_rdCfg().bridgeCaps || {}).supply, 1) + ' supply, +' + _rdNum((_rdCfg().bridgeCaps || {}).fatigueCost, 1)
    + ' fatigue, and +' + _rdNum((_rdCfg().bridgeCaps || {}).overall, 0) + ' direct overall. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + debateHTML
    + '<div style="margin-top:4px">Evidence is consolidated in data/diplomacy.json, HISTORICAL-DATA-DIPLOMACY.md, HISTORICAL-DATA-ECONOMY.md, and the codex foreign-recognition / King Cotton entries.</div>'
    + '</details>'
    + '</div>';
}

function realDiplomacyTabBlock(C) {
  return presRealDiplomacyBlock(C);
}

function realDiplomacyWireOverview(C) {
  if (!C) return;
  var btns = document.querySelectorAll('[data-rdpriority]');
  for (var i = 0; i < btns.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-rdpriority");
        var R = realDiplomacyInit(C);
        if (R && R.active && R.priority === id) realDiplomacySetPriority(C, null);
        else realDiplomacySetPriority(C, id);
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(btns[i]);
  }
}

function realDiplomacyWireDiplomacyTab(C) {
  realDiplomacyWireOverview(C);
}
