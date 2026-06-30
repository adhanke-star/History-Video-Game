/* ===========================================================================
   Phase F · 63-disease-medical.js — Disease and army medicine.

   Bounded D169 scope: disease/medicine becomes a War Effort teaching/system
   surface. It tracks a capped sickness/wound-pressure ledger, teaches disease
   deaths, Letterman's evacuation chain, anesthesia, and relief work, and offers
   one explicit medical-relief priority. Default bridge input is exact zero.
   =========================================================================== */

function _medNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _medClamp(v, lo, hi) {
  v = _medNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _medRound(v) { return Math.round(_medNum(v, 0)); }
function _medData() { return gameData("disease-medical") || {}; }
function _medCfg() { var D = _medData(); return D.config || {}; }

function _medProfile(side) {
  var D = _medData(), p = D.profiles || {};
  return p[side === "CS" ? "CS" : "US"] || {};
}

function _medYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  if (C && C.clock && typeof C.clock.year === "number") return C.clock.year;
  if (C && C.president && C.president.date && typeof C.president.date.year === "number") return C.president.date.year;
  return 1863;
}

function _medSafeCount(v) { return _medClamp(Math.round(_medNum(v, 0)), 0, 999999); }

function medicalInit(C) {
  if (!C) return null;
  if (!C.medical || typeof C.medical !== "object" || Array.isArray(C.medical)) C.medical = {};
  var M = C.medical;
  M.schema = "cw_disease_medical_v1";
  if (M.active !== true) M.active = false;
  if (M.priority !== "medicalRelief") M.priority = M.active ? "medicalRelief" : null;
  M.sick = _medSafeCount(M.sick);
  M.wounded = _medSafeCount(M.wounded);
  M.treated = _medSafeCount(M.treated);
  M.diseaseDeaths = _medSafeCount(M.diseaseDeaths);
  if (!Array.isArray(M.log)) M.log = [];
  if (M.log.length > 6) M.log.length = 6;
  if (M.lastTurn && (typeof M.lastTurn !== "object" || Array.isArray(M.lastTurn))) M.lastTurn = null;
  if (M.lastBridge && (typeof M.lastBridge !== "object" || Array.isArray(M.lastBridge))) M.lastBridge = null;
  return M;
}

function _medPressureWord(v) {
  v = _medClamp(v, 0, 100);
  if (v >= 78) return ["Hospital crisis", "#d07060"];
  if (v >= 58) return ["Crowded wards", "#c9712e"];
  if (v >= 36) return ["Strained relief", "#b8863b"];
  return ["Managed care", "#6f9e5a"];
}

function _medMeter(label, v, lowerBetter) {
  v = _medClamp(v, 0, 100);
  var color = lowerBetter ? _medPressureWord(v)[1] : _medPressureWord(100 - v)[1];
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + color + '">' + _medRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _medRound(v) + '%;background:' + color + '"></div></div></div>';
}

function medicalSnapshot(C) {
  var M = medicalInit(C);
  var side = (C && C.side === "CS") ? "CS" : "US";
  var year = _medYear(C, null);
  var profile = _medProfile(side);
  var wr = (C && C.warroom) || {};
  var clk = (C && C.clock) || {};
  var mp = (C && C.manpower) || {};
  var lootActive = !!(C && C.loot && C.loot.survival && C.loot.survival.enabled === true);
  var survivalDisease = lootActive ? _medClamp(C.loot.survival.disease, 0, 100) : 12;
  var supply = (typeof wr.supply === "number") ? wr.supply : 50;
  var strength = (typeof mp.strength === "number") ? mp.strength : (side === "CS" ? 80 : 95);
  var sickBurden = _medClamp((M ? M.sick : 0) / 120, 0, 100);
  var woundBurden = _medClamp((M ? M.wounded : 0) / 95, 0, 100);
  var prisonerPressure = 0;
  if (typeof prisonerExchangeSnapshot === "function") {
    try { prisonerPressure = prisonerExchangeSnapshot(C).mortalityRisk || 0; } catch (e) { prisonerPressure = 0; }
  }
  var baseCapacity = side === "CS" ? 44 : 62;
  var relief = (M && M.active) ? 12 : 0;
  var capacity = _medClamp(baseCapacity + supply * 0.18 + strength * 0.06 + relief - (year >= 1864 && side === "CS" ? 8 : 0), 0, 100);
  var w = (_medCfg().pressureWeights || {});
  var pressure = 20
    + sickBurden * _medNum(w.sick, 0.26)
    + woundBurden * _medNum(w.wounded, 0.20)
    + survivalDisease * _medNum(w.diseaseMeter, 0.18)
    + (100 - supply) * _medNum(w.supply, 0.16)
    + _medNum(clk.weariness, 30) * _medNum(w.weariness, 0.12)
    + prisonerPressure * _medNum(w.prisoners, 0.08)
    - relief * 0.35;
  pressure = _medClamp(pressure, 0, 100);
  var word = _medPressureWord(pressure);
  return {
    side: side,
    year: year,
    profileName: profile.name || side,
    pressure: _medRound(pressure),
    word: word[0],
    color: word[1],
    careCapacity: _medRound(capacity),
    sickBurden: _medRound(sickBurden),
    woundBurden: _medRound(woundBurden),
    diseaseMeter: _medRound(survivalDisease),
    supply: _medRound(supply),
    sick: M ? _medRound(M.sick) : 0,
    wounded: M ? _medRound(M.wounded) : 0,
    treated: M ? _medRound(M.treated) : 0,
    diseaseDeaths: M ? _medRound(M.diseaseDeaths) : 0,
    active: !!(M && M.active),
    lootActive: lootActive
  };
}

function medicalBridgeBonus(C) {
  var M = medicalInit(C);
  var snap = medicalSnapshot(C);
  var active = !!(M && M.active === true && M.priority === "medicalRelief");
  var out = {
    active: active,
    priority: active ? "medicalRelief" : null,
    morale: 0,
    supply: 0,
    fatigue: 0,
    fatigueRelief: 0,
    overall: 0,
    pressure: snap ? snap.pressure : 0,
    capacity: snap ? snap.careCapacity : 0,
    capped: true
  };
  if (active && snap) {
    var caps = (_medCfg().bridgeCaps || {});
    var moraleCap = _medNum(caps.morale, 2), fatigueCap = _medNum(caps.fatigueRelief, 3), supplyCap = _medNum(caps.supplyCost, 2), overallCap = _medNum(caps.overall, 1);
    var capacity = _medClamp(snap.careCapacity, 0, 100);
    var pressureRoom = _medClamp((100 - snap.pressure) / 35, 0, 3);
    out.morale = _medRound(_medClamp(0.7 + capacity / 75 + pressureRoom * 0.15, 0, moraleCap));
    out.fatigueRelief = _medRound(_medClamp(1 + capacity / 45, 0, fatigueCap));
    out.fatigue = -out.fatigueRelief;
    out.supply = -_medRound(_medClamp(1 + snap.pressure / 95, 0, supplyCap));
    out.overall = _medRound(_medClamp((out.morale + out.fatigueRelief - Math.abs(out.supply) * 0.5) / 4, 0, overallCap));
  }
  if (M) M.lastBridge = out;
  return out;
}

function medicalSetPriority(C, priority) {
  var M = medicalInit(C);
  if (!M) return null;
  if (priority === "medicalRelief" || priority === true) {
    M.active = true;
    M.priority = "medicalRelief";
  } else {
    M.active = false;
    M.priority = null;
  }
  M.lastBridge = medicalBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return M;
}

function _medCasualtiesFor(C, B) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  if (B && B.casualties && typeof B.casualties[side] === "number") return Math.max(0, B.casualties[side]);
  return 0;
}

function medicalOnResolve(winnerSide, type, B, C, win) {
  var M = medicalInit(C);
  if (!M) return;
  var snap0 = medicalSnapshot(C);
  var cfg = _medCfg(), rel = cfg.relief || {};
  var casualties = _medCasualtiesFor(C, B);
  var supply = snap0.supply;
  var disease = snap0.diseaseMeter;
  var sickAdd = _medRound(45 + casualties * 0.035 + (100 - supply) * 1.05 + disease * 1.4 + (snap0.year >= 1864 ? 16 : 0));
  var woundAdd = _medRound(casualties * 0.38);
  var active = M.active === true && M.priority === "medicalRelief";
  var treatedShare = active ? _medNum(rel.treatedShare, 0.18) : _medNum(rel.inactiveTreatedShare, 0.045);
  var poolSick = M.sick + sickAdd;
  var poolWounded = M.wounded + woundAdd;
  var treated = Math.floor((poolSick + poolWounded) * treatedShare);
  var treatedSick = Math.min(poolSick, Math.round(treated * 0.54));
  var treatedWounded = Math.min(poolWounded, Math.max(0, treated - treatedSick));
  var deathRate = _medClamp(_medNum(rel.diseaseDeathRate, 0.018) - (active ? _medNum(rel.reliefDeathReduction, 0.007) : 0), 0, 0.08);
  var diseaseDeaths = Math.floor(Math.max(0, poolSick - treatedSick) * deathRate);
  M.sick = _medSafeCount(poolSick - treatedSick - diseaseDeaths);
  M.wounded = _medSafeCount(poolWounded - treatedWounded);
  M.treated = _medSafeCount(M.treated + treated);
  M.diseaseDeaths = _medSafeCount(M.diseaseDeaths + diseaseDeaths);
  if (active && C && C.loot && C.loot.survival && C.loot.survival.enabled === true) {
    C.loot.survival.disease = _medClamp(C.loot.survival.disease - _medNum(rel.survivalDiseaseRelief, 4), 0, 100);
    C.loot.survival.fatigue = _medClamp(C.loot.survival.fatigue - _medNum(rel.survivalFatigueRelief, 1), 0, 100);
  }
  var snap = medicalSnapshot(C);
  M.lastTurn = {
    year: snap.year,
    pressure: snap.pressure,
    sickAdded: sickAdd,
    woundedAdded: woundAdd,
    treated: treated,
    diseaseDeaths: diseaseDeaths,
    sick: snap.sick,
    wounded: snap.wounded,
    active: active
  };
  logPush(M, "log", snap.word + ": " + snap.sick + " sick, " + snap.wounded + " wounded under care.");
}

function presMedicalBlock(C) {
  if (!C) return "";
  var M = medicalInit(C), snap = medicalSnapshot(C), D = _medData();
  var profile = _medProfile(snap.side);
  var on = !!(M && M.active && M.priority === "medicalRelief");
  var practices = D.practices || [];
  var disease = practices[0] || null, letterman = practices[1] || null, anesthesia = practices[2] || null, women = practices[3] || null;
  var debate = (D.debates && D.debates.length) ? D.debates[0] : null;
  var log = "";
  if (M.log && M.log.length) {
    for (var i = 0; i < M.log.length && i < 3; i++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(M.log[i]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Disease &amp; Army Medicine</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:650px">A War Effort ledger for sickness, wounds, evacuation, and relief without making war clean.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.pressure + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (on ? 'Medical relief active' : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _medMeter('Medical pressure', snap.pressure, true)
    + _medMeter('Care capacity', snap.careCapacity, false)
    + _medMeter('Disease meter', snap.diseaseMeter, true)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _medMeter('Sick burden', snap.sickBurden, true)
    + _medMeter('Wounded burden', snap.woundBurden, true)
    + _medMeter('Supply reach', snap.supply, false)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || snap.side) + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Under care: <b>' + snap.sick + '</b> sick, <b>' + snap.wounded + '</b> wounded; treated <b>' + snap.treated + '</b>; disease deaths estimated <b>' + snap.diseaseDeaths + '</b>.</div>'
    + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'
    + '<div style="font-size:12px"><b>Prioritize medical relief</b><div style="opacity:.72">Funds evacuation, hospital stores, nurses, sanitation, and medicine; it mitigates pressure but cannot erase disease.</div></div>'
    + '<button id="medToggleRelief" type="button" class="upg" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? 'Medical relief active &check;' : 'Prioritize medical relief') + '</button>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">When active, this can add at most +' + _medNum((_medCfg().bridgeCaps || {}).morale, 2)
    + ' morale, -' + _medNum((_medCfg().bridgeCaps || {}).fatigueRelief, 3) + ' fatigue, cost ' + _medNum((_medCfg().bridgeCaps || {}).supplyCost, 2)
    + ' supply, and add +' + _medNum((_medCfg().bridgeCaps || {}).overall, 1) + ' overall. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + (disease ? '<div style="margin-top:4px"><b>' + htmlEsc(disease.label) + ':</b> ' + htmlEsc(disease.summary) + '</div>' : '')
    + (letterman ? '<div style="margin-top:4px"><b>' + htmlEsc(letterman.label) + ':</b> ' + htmlEsc(letterman.summary) + '</div>' : '')
    + (anesthesia ? '<div style="margin-top:4px"><b>' + htmlEsc(anesthesia.label) + ':</b> ' + htmlEsc(anesthesia.summary) + '</div>' : '')
    + (women ? '<div style="margin-top:4px"><b>' + htmlEsc(women.label) + ':</b> ' + htmlEsc(women.summary) + '</div>' : '')
    + (debate ? '<div style="margin-top:4px"><b>' + htmlEsc(debate.title) + ':</b> ' + htmlEsc(debate.summary) + '</div>' : '')
    + '<div style="margin-top:4px">Evidence is consolidated in HISTORICAL-DATA.md, data/codex.json, and data/women-in-war.json: disease-death share, amputation/anesthesia, Letterman, the Sanitary Commission, Barton, Dix, and Walker.</div>'
    + '</details>'
    + '</div>';
}

function medicalWireOverview(C) {
  var b = document.getElementById("medToggleRelief");
  if (!b || !C) return;
  b.addEventListener("click", function () {
    var M = medicalInit(C);
    medicalSetPriority(C, !(M && M.active && M.priority === "medicalRelief"));
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
