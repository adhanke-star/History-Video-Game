/* ===========================================================================
   Phase F/G · 67-flagship-units.js — Flagship named units.

   Bounded D179 scope: famous regiments, brigades, and batteries become a War
   Effort teaching/system surface. This is not a new playable battle, not a
   tactical OOB rewrite, and not a super-unit bonus. Default bridge input is
   exact zero; the explicit unit-stewardship priority is capped and costly.
   =========================================================================== */

function _fguNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _fguClamp(v, lo, hi) {
  v = _fguNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _fguRound(v) { return Math.round(_fguNum(v, 0)); }
function _fguData() { return gameData("flagship-units") || {}; }
function _fguCfg() { var D = _fguData(); return D.config || {}; }
function _fguUnits() { var D = _fguData(); return Array.isArray(D.units) ? D.units : []; }

function _fguProfile(side) {
  var D = _fguData(), p = D.profiles || {};
  return p[side === "CS" ? "CS" : "US"] || {};
}

function _fguYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  if (C && C.clock && typeof C.clock.year === "number") return C.clock.year;
  if (C && C.president && C.president.date && typeof C.president.date.year === "number") return C.president.date.year;
  return campaignYear(C);
}

function _fguUnitBag(v) {
  var out = {}, units = _fguUnits();
  for (var i = 0; i < units.length; i++) out[units[i].id] = 0;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (var j = 0; j < units.length; j++) out[units[j].id] = _fguClamp(v[units[j].id], 0, 999999);
  }
  return out;
}

function flagshipUnitsInit(C) {
  if (!C) return null;
  if (!C.flagshipUnits || typeof C.flagshipUnits !== "object" || Array.isArray(C.flagshipUnits)) C.flagshipUnits = {};
  var F = C.flagshipUnits;
  F.schema = "cw_flagship_units_v1";
  if (F.active !== true) F.active = false;
  if (F.priority !== "unitStewardship") F.priority = F.active ? "unitStewardship" : null;
  F.readiness = _fguUnitBag(F.readiness);
  F.casualtyMemory = _fguUnitBag(F.casualtyMemory);
  F.colorsPreserved = _fguUnitBag(F.colorsPreserved);
  F.supported = _fguUnitBag(F.supported);
  if (!Array.isArray(F.log)) F.log = [];
  if (F.log.length > 6) F.log.length = 6;
  if (F.lastTurn && (typeof F.lastTurn !== "object" || Array.isArray(F.lastTurn))) F.lastTurn = null;
  if (F.lastBridge && (typeof F.lastBridge !== "object" || Array.isArray(F.lastBridge))) F.lastBridge = null;
  return F;
}

function _fguNextBattle(C) {
  if (typeof _brgNextBattle === "function") return _brgNextBattle(C);
  return null;
}

function _fguHasBattle(u, id) {
  if (!u || !id || !Array.isArray(u.battleIds)) return false;
  for (var i = 0; i < u.battleIds.length; i++) if (u.battleIds[i] === id) return true;
  return false;
}

function _fguSideUnits(side, includeVisibleLater) {
  var units = _fguUnits(), out = [];
  for (var i = 0; i < units.length; i++) {
    if (units[i].side === side || (includeVisibleLater && units[i].status === "visible-now-playable-later")) out.push(units[i]);
  }
  return out.length ? out : units.slice(0);
}

function _fguBattleFame(C, side) {
  var bd = _fguNextBattle(C), id = bd ? bd.id : "";
  var units = _fguSideUnits(side, true), max = 20;
  for (var i = 0; i < units.length; i++) {
    if (_fguHasBattle(units[i], id)) max = Math.max(max, 84);
    else if (units[i].status === "visible-now-playable-later" && _fguYear(C, null) >= 1863) max = Math.max(max, 58);
  }
  return max;
}

function _fguWord(v) {
  v = _fguClamp(v, 0, 100);
  if (v >= 78) return ["Colors steady", "#6f9e5a"];
  if (v >= 58) return ["Known by name", "#b8863b"];
  if (v >= 36) return ["Thinly held", "#c9712e"];
  return ["Anonymous ranks", "#d07060"];
}

function _fguPressureWord(v) {
  v = _fguClamp(v, 0, 100);
  if (v >= 78) return ["Names under strain", "#d07060"];
  if (v >= 58) return ["Cost visible", "#c9712e"];
  if (v >= 36) return ["Memory forming", "#b8863b"];
  return ["Stewarded", "#6f9e5a"];
}

function _fguMeter(label, v, lowerBetter) {
  v = _fguClamp(v, 0, 100);
  var color = lowerBetter ? _fguPressureWord(v)[1] : _fguWord(v)[1];
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + color + '">' + _fguRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _fguRound(v) + '%;background:' + color + '"></div></div></div>';
}

function flagshipUnitsSnapshot(C) {
  var F = flagshipUnitsInit(C);
  var side = (C && C.side === "CS") ? "CS" : "US";
  var year = _fguYear(C, null);
  var bd = _fguNextBattle(C);
  var units = _fguSideUnits(side, true);
  var ownUnits = _fguSideUnits(side, false);
  var w = (_fguCfg().pressureWeights || {});
  var casualties = 0, support = 0, colors = 0, readiness = 0;
  for (var i = 0; i < ownUnits.length; i++) {
    var id = ownUnits[i].id;
    casualties += F ? _fguNum(F.casualtyMemory[id], 0) : 0;
    support += F ? _fguNum(F.supported[id], 0) : 0;
    colors += F ? _fguNum(F.colorsPreserved[id], 0) : 0;
    readiness += 52 + _fguNum(F.readiness[id], 0) / 8 - _fguNum(F.casualtyMemory[id], 0) / 70 + (_fguHasBattle(ownUnits[i], bd ? bd.id : "") ? 10 : 0);
  }
  var count = Math.max(1, ownUnits.length);
  readiness = _fguClamp(readiness / count, 0, 100);
  var underCoverage = 50;
  if (typeof underToldSnapshot === "function") {
    try { underCoverage = underToldSnapshot(C).coverageIndex || 50; } catch (e) { underCoverage = 50; }
  }
  // Keep this read-only and non-recursive: moraleCompute() calls bridgeArmy(),
  // and bridgeArmy() reads flagshipUnitsBridgeBonus().
  var morale = (C && C.morale && typeof C.morale.troop === "number") ? C.morale.troop : 60;
  var yearScore = year >= 1864 ? 78 : (year >= 1863 ? 64 : 34);
  var battleFame = _fguBattleFame(C, side);
  var womenLane = 0;
  try {
    var W = gameData("women-in-war");
    womenLane = W && Array.isArray(W.records) && W.records.length >= 7 ? 100 : 0;
  } catch (e3) { womenLane = 0; }
  var memoryPressure = 15
    + yearScore * _fguNum(w.year, 0.16)
    + _fguClamp(casualties / 8, 0, 100) * _fguNum(w.casualties, 0.24)
    + (100 - underCoverage) * _fguNum(w.underTold, 0.12)
    + (100 - morale) * _fguNum(w.morale, 0.12)
    + battleFame * _fguNum(w.battleFame, 0.18)
    + womenLane * _fguNum(w.womenLane, -0.04);
  if (F && F.active) memoryPressure -= 7;
  memoryPressure = _fguClamp(memoryPressure, 0, 100);
  var identityIndex = _fguClamp(30 + readiness * 0.52 + colors / 4 + support / 16 - memoryPressure / 5, 0, 100);
  var word = _fguWord(identityIndex);
  var featured = units.length ? units[0] : null;
  for (var j = 0; j < units.length; j++) {
    if (_fguHasBattle(units[j], bd ? bd.id : "")) { featured = units[j]; break; }
  }
  return {
    side: side,
    year: year,
    battleId: bd ? bd.id : "",
    battleName: bd ? bd.name : "Next engagement",
    active: !!(F && F.active),
    identityIndex: _fguRound(identityIndex),
    readiness: _fguRound(readiness),
    memoryPressure: _fguRound(memoryPressure),
    casualtyMemory: _fguRound(casualties),
    stewardship: _fguRound(support + colors),
    visibleUnits: units.length,
    ownUnits: ownUnits.length,
    battleFame: _fguRound(battleFame),
    underToldCoverage: _fguRound(underCoverage),
    word: word[0],
    color: word[1],
    featured: featured
  };
}

function flagshipUnitsBridgeBonus(C) {
  var F = flagshipUnitsInit(C);
  var snap = flagshipUnitsSnapshot(C);
  var active = !!(F && F.active === true && F.priority === "unitStewardship");
  var out = {
    active: active,
    priority: active ? "unitStewardship" : null,
    morale: 0,
    supply: 0,
    fatigue: 0,
    overall: 0,
    identityIndex: snap ? snap.identityIndex : 0,
    memoryPressure: snap ? snap.memoryPressure : 0,
    capped: true
  };
  if (active && snap) {
    var caps = (_fguCfg().bridgeCaps || {});
    out.morale = _fguRound(_fguClamp(0.55 + snap.identityIndex / 140, 0, _fguNum(caps.morale, 1)));
    out.supply = -_fguRound(_fguClamp(1, 0, _fguNum(caps.supplyCost, 1)));
    out.fatigue = _fguRound(_fguClamp(snap.memoryPressure / 125, 0, _fguNum(caps.fatigueCost, 1)));
    out.overall = _fguRound(_fguClamp(0, 0, _fguNum(caps.overall, 0)));
  }
  if (F) F.lastBridge = out;
  return out;
}

function flagshipUnitsSetPriority(C, priority) {
  var F = flagshipUnitsInit(C);
  if (!F) return null;
  if (priority === "unitStewardship" || priority === true) {
    F.active = true;
    F.priority = "unitStewardship";
  } else {
    F.active = false;
    F.priority = null;
  }
  F.lastBridge = flagshipUnitsBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return F;
}

function _fguCasualties(C, B) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  if (B && B.casualties && typeof B.casualties[side] === "number") return Math.max(0, B.casualties[side]);
  return 0;
}

function _fguRelevantForBattle(side, battleId) {
  var units = _fguSideUnits(side, false), out = [];
  for (var i = 0; i < units.length; i++) if (_fguHasBattle(units[i], battleId)) out.push(units[i]);
  if (out.length) return out;
  for (var j = 0; j < units.length; j++) if (units[j].status === "fielded-in-current-roster") out.push(units[j]);
  return out.length ? out.slice(0, 2) : units.slice(0, 1);
}

function flagshipUnitsOnResolve(winnerSide, type, B, C, win) {
  var F = flagshipUnitsInit(C);
  if (!F) return;
  var side = (C && C.side === "CS") ? "CS" : "US";
  var battleId = B && B.bd && B.bd.id ? B.bd.id : "";
  var snap0 = flagshipUnitsSnapshot(C);
  var cfg = _fguCfg(), mit = cfg.mitigation || {};
  var active = F.active === true && F.priority === "unitStewardship";
  var relevant = _fguRelevantForBattle(side, battleId);
  var casualties = _fguCasualties(C, B);
  var memory = Math.round(4 + casualties / 18 + snap0.memoryPressure * 0.38 + (win ? 0 : 6));
  var readiness = active ? _fguNum(mit.readinessBoost, 12) : 2;
  var supported = active ? Math.round(_fguClamp(snap0.memoryPressure, 0, 100) * _fguNum(mit.stewardshipFactor, 8) / 100) : 1;
  if (active) {
    memory = Math.round(memory * (1 - _fguClamp(_fguNum(mit.memoryReduction, 0.22), 0, 0.75)));
    if (C && C.clock) C.clock.capital = _fguClamp(_fguNum(C.clock.capital, 0) - _fguNum(mit.capitalCost, 1), 0, 999999);
  }
  for (var i = 0; i < relevant.length; i++) {
    var id = relevant[i].id;
    F.casualtyMemory[id] = _fguClamp(F.casualtyMemory[id] + Math.max(1, Math.round(memory / Math.max(1, relevant.length))), 0, 999999);
    F.readiness[id] = _fguClamp(F.readiness[id] + readiness, 0, 999999);
    F.supported[id] = _fguClamp(F.supported[id] + supported, 0, 999999);
    if (active) F.colorsPreserved[id] = _fguClamp(F.colorsPreserved[id] + 1, 0, 999999);
  }
  var snap = flagshipUnitsSnapshot(C);
  F.lastTurn = {
    year: snap.year,
    battleId: battleId,
    memoryPressure: snap.memoryPressure,
    casualtyMemoryAdded: memory,
    readinessAdded: readiness,
    unitsTouched: relevant.length,
    active: active
  };
  logPush(F, "log", snap.word + ": " + snap.casualtyMemory + " unit-memory ledger, " + snap.stewardship + " stewardship.");
}

function _fguUnitCard(u, snap) {
  if (!u) return "";
  var isCurrent = _fguHasBattle(u, snap.battleId);
  var border = isCurrent ? "var(--brass-lt,#c9a85f)" : "var(--rule)";
  return '<div style="flex:1 1 210px;min-width:190px;border:1px solid ' + border + ';border-radius:5px;padding:8px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'
    + '<div><b>' + htmlEsc(u.label || u.id) + '</b><div style="font-size:11px;opacity:.7">' + htmlEsc(u.formation || "formation") + ' &middot; ' + htmlEsc(u.theater || "") + '</div></div>'
    + '<span style="font-size:10px;border:1px solid var(--rule);border-radius:999px;padding:1px 6px">' + htmlEsc(u.side || "") + '</span>'
    + '</div>'
    + '<div style="font-size:11px;line-height:1.4;margin-top:5px;opacity:.82">' + htmlEsc(u.summary || "") + '</div>'
    + '<div style="font-size:11px;line-height:1.4;margin-top:5px;opacity:.72">' + htmlEsc(u.humanCost || "") + '</div>'
    + '<div style="font-size:10px;opacity:.68;margin-top:5px">' + (isCurrent ? 'Current-battle memory thread' : htmlEsc(u.status || "visible")) + ' &middot; ' + htmlEsc(u.provenance || "Inferred") + '</div>'
    + '</div>';
}

function presFlagshipUnitsBlock(C) {
  if (!C) return "";
  var F = flagshipUnitsInit(C), snap = flagshipUnitsSnapshot(C), D = _fguData();
  var profile = _fguProfile(snap.side), on = !!(F && F.active && F.priority === "unitStewardship");
  var units = _fguSideUnits(snap.side, true), cards = "", shown = 0;
  for (var i = 0; i < units.length && shown < 4; i++) {
    if (_fguHasBattle(units[i], snap.battleId)) { cards += _fguUnitCard(units[i], snap); shown++; }
  }
  for (var j = 0; j < units.length && shown < 4; j++) {
    if (!_fguHasBattle(units[j], snap.battleId)) { cards += _fguUnitCard(units[j], snap); shown++; }
  }
  var debates = D.debates || [], superNote = debates[0] || null, costNote = debates[1] || null, usctNote = debates[2] || null;
  var log = "";
  if (F.log && F.log.length) {
    for (var k = 0; k < F.log.length && k < 3; k++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(F.log[k]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Flagship Named Units</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:650px">Famous regiments, brigades, and batteries with identity, battle history, and human cost. No hidden super-unit bonus.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.identityIndex + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (on ? 'Unit-stewardship priority active' : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _fguMeter('Unit identity index', snap.identityIndex, false)
    + _fguMeter('Readiness and colors', snap.readiness, false)
    + _fguMeter('Memory pressure', snap.memoryPressure, true)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _fguMeter('Human-cost ledger', Math.min(100, snap.casualtyMemory / 8), true)
    + _fguMeter('Stewardship ledger', Math.min(100, snap.stewardship / 5), false)
    + _fguMeter('Current-battle relevance', snap.battleFame, false)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || snap.side) + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Featured near ' + htmlEsc(snap.battleName) + ': <b>' + htmlEsc(snap.featured ? snap.featured.label : "none") + '</b>. Visible unit records: <b>' + snap.visibleUnits + '</b>.</div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:9px">' + cards + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'
    + '<div style="font-size:12px"><b>Steward colors, pay, and veterans</b><div style="opacity:.72">Keeps named formations visible, supports veterans, and records cost. It steadies morale modestly but costs supply, tempo, and capital.</div></div>'
    + '<button id="fguToggleStewardship" type="button" class="upg" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? 'Stewardship active &check;' : 'Steward units') + '</button>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">When active, this can add at most +' + _fguNum((_fguCfg().bridgeCaps || {}).morale, 1)
    + ' morale, cost ' + _fguNum((_fguCfg().bridgeCaps || {}).supplyCost, 1) + ' supply, add +' + _fguNum((_fguCfg().bridgeCaps || {}).fatigueCost, 1)
    + ' fatigue, and adds no direct overall bonus. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + (superNote ? '<div style="margin-top:4px"><b>' + htmlEsc(superNote.title) + ':</b> ' + htmlEsc(superNote.summary) + '</div>' : '')
    + (costNote ? '<div style="margin-top:4px"><b>' + htmlEsc(costNote.title) + ':</b> ' + htmlEsc(costNote.summary) + '</div>' : '')
    + (usctNote ? '<div style="margin-top:4px"><b>' + htmlEsc(usctNote.title) + ':</b> ' + htmlEsc(usctNote.summary) + '</div>' : '')
    + '<div style="margin-top:4px">The 54th Massachusetts is visible here only as a sourced unit-memory record; this slice does not start any USCT playable battle.</div>'
    + '</details>'
    + '</div>';
}

function flagshipUnitsWireOverview(C) {
  var b = document.getElementById("fguToggleStewardship");
  if (!b || !C) return;
  b.addEventListener("click", function () {
    var F = flagshipUnitsInit(C);
    flagshipUnitsSetPriority(C, !(F && F.active && F.priority === "unitStewardship"));
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
