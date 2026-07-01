/* ===========================================================================
   Group 4 · 72-human-cost.js - human-cost-with-gravity treatment.

   Bounded D190 scope: a live War Effort ledger for the war's human cost.
   It aggregates already-existing campaign casualties, disease/medical ledgers,
   prisoner deaths, displacement, and public-will pressure beside sourced
   historical scale anchors. It is readout-only: no battle, OOB, casualty,
   winner, bridge, morale, economy, or save-version output path changes.
   =========================================================================== */

function _hcNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _hcClamp(v, lo, hi) {
  v = _hcNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _hcRound(v) { return Math.round(_hcNum(v, 0)); }
function _hcData() { return gameData("human-cost") || {}; }
function _hcScale() { var D = _hcData(); return D.historicalScale || {}; }
function _hcSide(C) { return (C && C.side === "CS") ? "CS" : "US"; }

function _hcYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  if (C && C.clock && typeof C.clock.year === "number") return C.clock.year;
  if (C && C.president && C.president.date && typeof C.president.date.year === "number") return C.president.date.year;
  return campaignYear(C);
}

function _hcSafeObj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function _hcSideValue(v, side) {
  v = _hcSafeObj(v);
  return _hcClamp(_hcNum(v[side], 0), 0, 999999);
}

function _hcFmt(v) {
  v = _hcRound(v);
  try { return v.toLocaleString(); } catch (e) { return String(v); }
}

function _hcWord(v) {
  v = _hcClamp(v, 0, 100);
  if (v >= 78) return ["National grief", "#d07060"];
  if (v >= 58) return ["Severe toll", "#c9712e"];
  if (v >= 36) return ["Mounting cost", "#b8863b"];
  return ["Early ledger", "#6f9e5a"];
}

function _hcMeter(label, v, lowerBetter) {
  v = _hcClamp(v, 0, 100);
  var color = lowerBetter ? _hcWord(v)[1] : _hcWord(100 - v)[1];
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + color + '">' + _hcRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _hcRound(v) + '%;background:' + color + '"></div></div></div>';
}

function humanCostInit(C) {
  if (!C) return null;
  if (!C.humanCost || typeof C.humanCost !== "object" || Array.isArray(C.humanCost)) C.humanCost = {};
  var H = C.humanCost;
  H.schema = "cw_human_cost_v1";
  if (!Array.isArray(H.log)) H.log = [];
  if (H.log.length > 6) H.log.length = 6;
  if (H.lastTurn && (typeof H.lastTurn !== "object" || Array.isArray(H.lastTurn))) H.lastTurn = null;
  if (H.lastBridge && (typeof H.lastBridge !== "object" || Array.isArray(H.lastBridge))) H.lastBridge = null;
  return H;
}

function humanCostBridgeBonus(C) {
  var H = humanCostInit(C);
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
  if (H) H.lastBridge = out;
  return out;
}

function humanCostSnapshot(C) {
  var H = humanCostInit(C);
  var side = _hcSide(C);
  var scale = _hcScale();
  var revisedDeaths = _hcClamp(_hcNum(scale.revisedDeaths, 750000), 1, 9999999);
  var rangeLow = _hcClamp(_hcNum(scale.rangeLow, 650000), 0, revisedDeaths);
  var rangeHigh = _hcClamp(_hcNum(scale.rangeHigh, 850000), revisedDeaths, 9999999);
  var stats = _hcSafeObj(C && C.stats);
  var morale = _hcSafeObj(C && C.morale);
  var medical = _hcSafeObj(C && C.medical);
  var prisoners = _hcSafeObj(C && C.prisoners);
  var hardWar = _hcSafeObj(C && C.hardWar);
  var irregular = _hcSafeObj(C && C.irregularWar);
  var campaignLosses = Math.max(_hcNum(stats.suff, 0), _hcNum(morale.casualtyToll, 0));
  var publicWill = _hcClamp(_hcNum(morale.public, 55), 0, 100);
  var publicPenalty = _hcClamp(campaignLosses / 4000, 0, 30);
  var inflictedLosses = _hcClamp(_hcNum(stats.infl, 0), 0, 999999);
  var sickness = _hcClamp(_hcNum(medical.sick, 0), 0, 999999);
  var woundedCare = _hcClamp(_hcNum(medical.wounded, 0), 0, 999999);
  var treated = _hcClamp(_hcNum(medical.treated, 0), 0, 999999);
  var diseaseDeaths = _hcClamp(_hcNum(medical.diseaseDeaths, 0), 0, 999999);
  var prisonerDeaths = _hcSideValue(prisoners.deaths, side);
  var detained = _hcSideValue(prisoners.detained, side);
  var displaced = _hcSideValue(hardWar.displaced, side);
  var propertyPressure = _hcSideValue(hardWar.propertyDestroyed, side);
  var civilianDanger = _hcClamp(_hcNum(irregular.civilianHarm, 0), 0, 999999);
  var battleBurden = _hcClamp(campaignLosses / 650, 0, 100);
  var medicalBurden = _hcClamp((sickness + woundedCare) / 125, 0, 100);
  var deathBurden = _hcClamp((diseaseDeaths + prisonerDeaths) / 50, 0, 100);
  var homeBurden = _hcClamp(displaced / 140 + propertyPressure / 260 + civilianDanger / 180 + publicPenalty * 1.4, 0, 100);
  var index = _hcClamp(battleBurden * 0.34 + medicalBurden * 0.22 + deathBurden * 0.20 + homeBurden * 0.16 + (100 - publicWill) * 0.08, 0, 100);
  var word = _hcWord(index);
  return {
    side: side,
    year: _hcYear(C, null),
    index: _hcRound(index),
    word: word[0],
    color: word[1],
    campaignLosses: _hcRound(campaignLosses),
    inflictedLosses: _hcRound(inflictedLosses),
    sickness: _hcRound(sickness),
    woundedCare: _hcRound(woundedCare),
    treated: _hcRound(treated),
    diseaseDeaths: _hcRound(diseaseDeaths),
    prisonerDeaths: _hcRound(prisonerDeaths),
    detained: _hcRound(detained),
    displaced: _hcRound(displaced),
    propertyPressure: _hcRound(propertyPressure),
    civilianDanger: _hcRound(civilianDanger),
    publicWill: _hcRound(publicWill),
    publicPenalty: _hcRound(publicPenalty),
    battleBurden: _hcRound(battleBurden),
    medicalBurden: _hcRound(medicalBurden),
    deathBurden: _hcRound(deathBurden),
    homeBurden: _hcRound(homeBurden),
    historicalDeaths: _hcRound(revisedDeaths),
    historicalRangeLow: _hcRound(rangeLow),
    historicalRangeHigh: _hcRound(rangeHigh),
    historicalSharePct: Math.round(_hcClamp(campaignLosses / revisedDeaths * 1000, 0, 9999)) / 10,
    diseaseSharePct: _hcRound(_hcNum(scale.diseaseSharePct, 66)),
    readoutOnly: !!H
  };
}

function humanCostOnResolve(winnerSide, type, B, C, win) {
  var H = humanCostInit(C);
  if (!H) return;
  var snap = humanCostSnapshot(C);
  H.lastTurn = {
    year: snap.year,
    index: snap.index,
    campaignLosses: snap.campaignLosses,
    diseaseDeaths: snap.diseaseDeaths,
    prisonerDeaths: snap.prisonerDeaths,
    displaced: snap.displaced,
    publicWill: snap.publicWill,
    readoutOnly: true
  };
  logPush(H, "log", snap.word + ": " + _hcFmt(snap.campaignLosses) + " campaign losses, " + _hcFmt(snap.diseaseDeaths + snap.prisonerDeaths) + " recorded deaths beyond the field.");
}

function _hcAnchorCard(a) {
  if (!a) return "";
  return '<div style="flex:1 1 200px;min-width:190px;border:1px solid var(--rule);border-radius:5px;padding:8px;background:rgba(0,0,0,.10)">'
    + '<b>' + htmlEsc(a.label || a.id || "") + '</b>'
    + '<div style="font-size:11px;line-height:1.42;margin-top:5px;opacity:.82">' + htmlEsc(a.summary || "") + '</div>'
    + '</div>';
}

function presHumanCostBlock(C) {
  if (!C) return "";
  var H = humanCostInit(C), snap = humanCostSnapshot(C), D = _hcData();
  var profile = D.profile || {}, anchors = Array.isArray(D.anchors) ? D.anchors : [], debates = Array.isArray(D.debates) ? D.debates : [];
  var cards = "";
  for (var i = 0; i < anchors.length && i < 4; i++) cards += _hcAnchorCard(anchors[i]);
  var debateHTML = "";
  for (var d = 0; d < debates.length; d++) {
    if (debates[d]) debateHTML += '<div style="margin-top:4px"><b>' + htmlEsc(debates[d].title || debates[d].id || "") + ':</b> ' + htmlEsc(debates[d].summary || "") + '</div>';
  }
  var log = "";
  if (H.log && H.log.length) {
    for (var j = 0; j < H.log.length && j < 3; j++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(H.log[j]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Human Cost Ledger</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:650px">A restrained live treatment of casualties, sickness, prisoner deaths, displacement, and public grief - gravity, not spectacle.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.index + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">Readout only: bridge input is zero</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _hcMeter('Campaign casualty burden', snap.battleBurden, true)
    + _hcMeter('Medical burden', snap.medicalBurden, true)
    + _hcMeter('Deaths beyond the field', snap.deathBurden, true)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _hcMeter('Home-front burden', snap.homeBurden, true)
    + _hcMeter('Public will', snap.publicWill, false)
    + _hcMeter('Scale against history', snap.historicalSharePct, true)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || 'Human cost') + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Your side has recorded roughly <b>' + _hcFmt(snap.campaignLosses) + '</b> men fallen, wounded, or lost; under care: <b>' + _hcFmt(snap.sickness)
    + '</b> sick and <b>' + _hcFmt(snap.woundedCare) + '</b> wounded; disease and prison deaths recorded here: <b>' + _hcFmt(snap.diseaseDeaths + snap.prisonerDeaths) + '</b>.</div>'
    + '<div style="margin-top:4px">Historical anchor: about <b>' + _hcFmt(snap.historicalDeaths) + '</b> military deaths, often shown as a <b>' + _hcFmt(snap.historicalRangeLow)
    + '-' + _hcFmt(snap.historicalRangeHigh) + '</b> estimate range; about <b>' + snap.diseaseSharePct + '%</b> died of disease.</div>'
    + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="font-size:12px"><b>No priority lever</b><div style="opacity:.72">This panel does not buy morale, reduce casualties, award points, or tune battles. It only records cost already produced by the campaign and existing War Effort ledgers.</div></div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">humanCostBridgeBonus returns exact zero by contract.</div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:9px">' + cards + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + debateHTML
    + '<div style="margin-top:4px">Evidence is consolidated in HISTORICAL-DATA.md, data/disease-medical.json, data/codex.json, data/primary-sources.json, and the after-action report.</div>'
    + '</details>'
    + '</div>';
}
