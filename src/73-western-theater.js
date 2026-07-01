/* ===========================================================================
   Group 4 - 73-western-theater.js - Western Theater strategic readouts.

   Bounded D191 scope: a War Effort and Theater Map readout for the Western
   arc. It reads existing campaign, logistics, morale, hard-war, and playable
   Western battle context; it creates no battle, OOB, registry, tactical launch,
   casualty/winner output, or bridge effect.
   =========================================================================== */

function _wtNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _wtClamp(v, lo, hi) {
  v = _wtNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _wtRound(v) { return Math.round(_wtNum(v, 0)); }
function _wtData() { return gameData("western-theater") || {}; }
function _wtSide(C) { return (C && C.side === "CS") ? "CS" : "US"; }

function _wtSafeObj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function _wtSideValue(v, side) {
  v = _wtSafeObj(v);
  return _wtClamp(_wtNum(v[side], 0), 0, 999999);
}

function _wtFmt(v) {
  v = _wtRound(v);
  try { return v.toLocaleString(); } catch (e) { return String(v); }
}

function _wtWord(v) {
  v = _wtClamp(v, 0, 100);
  if (v >= 76) return ["Theater decisive", "#6f9e5a"];
  if (v >= 56) return ["Strategic leverage", "#8f9853"];
  if (v >= 34) return ["Contested corridor", "#b8863b"];
  return ["Unsettled theater", "#c9712e"];
}

function _wtMeter(label, v, lowerBetter) {
  v = _wtClamp(v, 0, 100);
  var score = lowerBetter ? 100 - v : v;
  var w = _wtWord(score);
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + w[1] + '">' + _wtRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _wtRound(v) + '%;background:' + w[1] + '"></div></div></div>';
}

function westernTheaterInit(C) {
  if (!C) return null;
  if (!C.westernTheater || typeof C.westernTheater !== "object" || Array.isArray(C.westernTheater)) C.westernTheater = {};
  var W = C.westernTheater;
  W.schema = "cw_western_theater_v1";
  if (!Array.isArray(W.log)) W.log = [];
  if (W.log.length > 6) W.log.length = 6;
  if (W.lastTurn && (typeof W.lastTurn !== "object" || Array.isArray(W.lastTurn))) W.lastTurn = null;
  if (W.lastBridge && (typeof W.lastBridge !== "object" || Array.isArray(W.lastBridge))) W.lastBridge = null;
  return W;
}

function westernTheaterBridgeBonus(C) {
  var W = westernTheaterInit(C);
  var out = {
    active: false,
    priority: null,
    morale: 0,
    supply: 0,
    fatigue: 0,
    overall: 0,
    readoutOnly: true,
    capped: true
  };
  if (W) W.lastBridge = out;
  return out;
}

function westernTheaterSnapshot(C) {
  var W = westernTheaterInit(C);
  var side = _wtSide(C);
  var D = _wtData();
  var prod = _wtSafeObj(C && C.production);
  var blockade = _wtSafeObj(C && C.blockade);
  var morale = _wtSafeObj(C && C.morale);
  var manpower = _wtSafeObj(C && C.manpower);
  var hardWar = _wtSafeObj(C && C.hardWar);
  var stats = _wtSafeObj(C && C.stats);
  var clock = _wtSafeObj(C && C.clock);
  var rail = _wtClamp(_wtNum(prod.railIntegrity, side === "CS" ? 52 : 92), 0, 100);
  var equip = _wtClamp(_wtNum(prod.equipIndex, side === "CS" ? 48 : 82), 0, 100);
  var imports = side === "CS" ? _wtClamp(_wtNum(blockade.importFactor, 0.62) * 100, 0, 100) : 100;
  var supply = (C && C.warroom && typeof C.warroom.supply === "number") ? C.warroom.supply : (side === "CS" ? 48 : 72);
  var publicWill = _wtClamp(_wtNum(morale.public, side === "CS" ? 52 : 58), 0, 100);
  var strength = _wtClamp(_wtNum(manpower.strength, side === "CS" ? 55 : 78), 0, 100);
  var losses = _wtClamp(Math.max(_wtNum(stats.suff, 0), _wtNum(morale.casualtyToll, 0)), 0, 999999);
  var displaced = _wtSideValue(hardWar.displaced, side);
  var propertyPressure = _wtSideValue(hardWar.propertyDestroyed, side);
  var year = _wtNum(clock.year, _wtNum(C && C.president && C.president.date && C.president.date.year, 1863));
  var riverRailIndex = _wtClamp(rail * 0.36 + supply * 0.24 + imports * 0.18 + equip * 0.14 + strength * 0.08, 0, 100);
  var chattanoogaPressure = _wtClamp((100 - riverRailIndex) * 0.28 + losses / 900 + (year >= 1863 ? 18 : 7), 0, 100);
  var georgiaPressure = _wtClamp((year >= 1864 ? 40 : year >= 1863 ? 22 : 9) + (100 - rail) * 0.18 + propertyPressure / 360 + displaced / 220 + (100 - publicWill) * 0.12, 0, 100);
  var armyTennesseeStrain = _wtClamp((100 - strength) * 0.34 + (100 - equip) * 0.22 + losses / 850 + (side === "CS" ? 16 : 8), 0, 100);
  var westernLeverage = _wtClamp(riverRailIndex * 0.34 + (100 - chattanoogaPressure) * 0.18 + georgiaPressure * 0.22 + armyTennesseeStrain * 0.16 + (year >= 1864 ? 10 : 3), 0, 100);
  var word = _wtWord(westernLeverage);
  return {
    side: side,
    year: _wtRound(year),
    index: _wtRound(westernLeverage),
    word: word[0],
    color: word[1],
    riverRailIndex: _wtRound(riverRailIndex),
    chattanoogaPressure: _wtRound(chattanoogaPressure),
    georgiaPressure: _wtRound(georgiaPressure),
    armyTennesseeStrain: _wtRound(armyTennesseeStrain),
    railIntegrity: _wtRound(rail),
    supply: _wtRound(supply),
    imports: _wtRound(imports),
    equipment: _wtRound(equip),
    publicWill: _wtRound(publicWill),
    strength: _wtRound(strength),
    losses: _wtRound(losses),
    displaced: _wtRound(displaced),
    propertyPressure: _wtRound(propertyPressure),
    playableWesternCount: Array.isArray(D.currentArc) ? D.currentArc.length : 0,
    futureLockedCount: Array.isArray(D.futureLocks) ? D.futureLocks.length : 0,
    battleBuildLocked: true,
    readoutOnly: !!W
  };
}

function westernTheaterOnResolve(winnerSide, type, B, C, win) {
  var W = westernTheaterInit(C);
  if (!W) return;
  var snap = westernTheaterSnapshot(C);
  W.lastTurn = {
    year: snap.year,
    index: snap.index,
    riverRailIndex: snap.riverRailIndex,
    chattanoogaPressure: snap.chattanoogaPressure,
    georgiaPressure: snap.georgiaPressure,
    armyTennesseeStrain: snap.armyTennesseeStrain,
    playableWesternCount: snap.playableWesternCount,
    futureLockedCount: snap.futureLockedCount,
    readoutOnly: true
  };
  logPush(W, "log", "Western Theater: " + snap.playableWesternCount + " playable fields now, " + snap.futureLockedCount + " future battle locks held.");
}

function _wtCard(item, tone) {
  if (!item) return "";
  return '<div style="flex:1 1 210px;min-width:195px;border:1px solid var(--rule);border-radius:5px;padding:8px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>' + htmlEsc(item.label || item.title || item.id || "") + '</b>'
    + '<span style="font-size:10px;text-transform:uppercase;color:' + (tone || '#b8863b') + ';font-weight:bold">' + htmlEsc(item.status || item.readoutMetric || "") + '</span></div>'
    + '<div style="font-size:11px;line-height:1.42;margin-top:5px;opacity:.82">' + htmlEsc(item.summary || "") + '</div>'
    + '</div>';
}

function _wtCards(items, max, tone) {
  var html = "";
  items = Array.isArray(items) ? items : [];
  for (var i = 0; i < items.length && i < max; i++) html += _wtCard(items[i], tone);
  return html;
}

function _wtGuardrailHTML(items) {
  var html = "";
  items = Array.isArray(items) ? items : [];
  for (var i = 0; i < items.length; i++) {
    html += '<div style="margin-top:4px"><b>' + htmlEsc(items[i].title || items[i].id || "") + ':</b> ' + htmlEsc(items[i].summary || "") + '</div>';
  }
  return html;
}

function presWesternTheaterBlock(C) {
  if (!C) return "";
  var W = westernTheaterInit(C), snap = westernTheaterSnapshot(C), D = _wtData();
  var profile = D.profile || {}, current = Array.isArray(D.currentArc) ? D.currentArc : [];
  var hinges = Array.isArray(D.strategicHinges) ? D.strategicHinges : [], locks = Array.isArray(D.futureLocks) ? D.futureLocks : [];
  var guardrails = Array.isArray(D.guardrails) ? D.guardrails : [];
  var log = "";
  if (W.log && W.log.length) {
    for (var j = 0; j < W.log.length && j < 3; j++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(W.log[j]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Western Theater Strategic Readout</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:680px">Shiloh, Vicksburg, and Chickamauga are playable now; Chattanooga, Atlanta, Franklin, Nashville, and USCT playable work remain locked future battle queue.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.index + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">Readout only: bridge input is zero</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _wtMeter('River and rail leverage', snap.riverRailIndex, false)
    + _wtMeter('Chattanooga sequel pressure', snap.chattanoogaPressure, true)
    + _wtMeter('Georgia campaign pressure', snap.georgiaPressure, false)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _wtMeter('Army of Tennessee strain', snap.armyTennesseeStrain, false)
    + _wtMeter('Rail integrity', snap.railIntegrity, false)
    + _wtMeter('Public will', snap.publicWill, false)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || 'Western Theater') + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Current ledger: <b>' + snap.playableWesternCount + '</b> playable Western fields, <b>' + snap.futureLockedCount
    + '</b> future battle locks, river/rail index <b>' + snap.riverRailIndex + '</b>, and campaign losses recorded at <b>' + _wtFmt(snap.losses) + '</b>.</div>'
    + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="font-size:12px"><b>No battle-build in this slice</b><div style="opacity:.72">This panel does not add Chattanooga, Atlanta, Franklin, Nashville, a USCT field, a tactical registry row, a side-choice card, an OOB, or a combat modifier.</div></div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">westernTheaterBridgeBonus returns exact zero by contract.</div>'
    + '</div>'
    + '<div style="margin-top:9px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);font-weight:bold">Playable Western arc now</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + _wtCards(current, 3, '#6f9e5a') + '</div></div>'
    + '<div style="margin-top:9px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);font-weight:bold">Strategic hinges</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + _wtCards(hinges, 4, '#b8863b') + '</div></div>'
    + '<div style="margin-top:9px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);font-weight:bold">Locked future battle queue</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">' + _wtCards(locks, 4, '#c9712e') + '</div></div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and guardrails</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + _wtGuardrailHTML(guardrails)
    + '<div style="margin-top:4px">Evidence is consolidated in data/shiloh.json, data/vicksburg.json, data/chickamauga.json, data/logistics-rail.json, data/hard-war.json, data/codex.json, and the cited ABT/NPS source trails.</div>'
    + '</details>'
    + '</div>';
}

function presWesternTheaterMapBlock(C) {
  if (!C) return "";
  var snap = westernTheaterSnapshot(C), D = _wtData();
  var current = Array.isArray(D.currentArc) ? D.currentArc : [];
  var locks = Array.isArray(D.futureLocks) ? D.futureLocks : [];
  return ''
    + '<div style="margin-top:12px;border:1px solid var(--rule);border-radius:6px;background:rgba(0,0,0,.12);padding:10px">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">'
    + '<div><div style="font-weight:bold;font-size:14px">Western Theater Strategic Readout</div>'
    + '<div style="font-size:12px;opacity:.76">River corridors, rail junctions, Tennessee-Georgia pressure, and the locked battle-build order.</div></div>'
    + '<div style="text-align:right;font-size:12px"><b style="color:' + snap.color + '">' + snap.index + ' &middot; ' + htmlEsc(snap.word) + '</b><br><span style="opacity:.68">No tactical launch added</span></div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">' + _wtCards(current, 3, '#6f9e5a') + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">' + _wtCards(locks, 4, '#c9712e') + '</div>'
    + '</div>';
}

function westernTheaterWireOverview(C) {
  return C;
}
