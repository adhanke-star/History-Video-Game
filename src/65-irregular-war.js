/* ===========================================================================
   Phase F/G · 65-irregular-war.js — Irregular war and civilian security.

   Bounded D177 scope: irregular war becomes a War Effort teaching/system
   surface. It tracks partisan pressure, civilian danger, reprisals, and local
   security without adding a playable battle, forcing outcomes, or romanticizing
   guerrilla violence. Default bridge input is exact zero; the explicit civilian
   security priority is capped and costly.
   =========================================================================== */

function _iwNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _iwClamp(v, lo, hi) {
  v = _iwNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _iwRound(v) { return Math.round(_iwNum(v, 0)); }
function _iwData() { return gameData("irregular-war") || {}; }
function _iwCfg() { var D = _iwData(); return D.config || {}; }

function _iwProfile(side) {
  var D = _iwData(), p = D.profiles || {};
  return p[side === "CS" ? "CS" : "US"] || {};
}

function _iwYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  if (C && C.clock && typeof C.clock.year === "number") return C.clock.year;
  if (C && C.president && C.president.date && typeof C.president.date.year === "number") return C.president.date.year;
  return campaignYear(C);
}

function _iwSideBag(v) {
  var out = { US: 0, CS: 0 };
  if (v && typeof v === "object" && !Array.isArray(v)) {
    out.US = _iwClamp(v.US, 0, 999999);
    out.CS = _iwClamp(v.CS, 0, 999999);
  }
  return out;
}

function irregularWarInit(C) {
  if (!C) return null;
  if (!C.irregularWar || typeof C.irregularWar !== "object" || Array.isArray(C.irregularWar)) C.irregularWar = {};
  var I = C.irregularWar;
  I.schema = "cw_irregular_war_v1";
  if (I.active !== true) I.active = false;
  if (I.priority !== "civilianSecurity") I.priority = I.active ? "civilianSecurity" : null;
  I.incidents = _iwSideBag(I.incidents);
  I.reprisals = _iwSideBag(I.reprisals);
  I.civilianHarm = _iwSideBag(I.civilianHarm);
  I.protectedCivilians = _iwSideBag(I.protectedCivilians);
  I.localIntelligence = _iwSideBag(I.localIntelligence);
  if (!Array.isArray(I.log)) I.log = [];
  if (I.log.length > 6) I.log.length = 6;
  if (I.lastTurn && (typeof I.lastTurn !== "object" || Array.isArray(I.lastTurn))) I.lastTurn = null;
  if (I.lastBridge && (typeof I.lastBridge !== "object" || Array.isArray(I.lastBridge))) I.lastBridge = null;
  return I;
}

function _iwNextBattle(C) {
  if (typeof _brgNextBattle === "function") return _brgNextBattle(C);
  return null;
}

function _iwBorderPressure(bd) {
  if (!bd || !bd.id) return 28;
  if (/shiloh|vicksburg|chickamauga|franklin|nashville/i.test(bd.id)) return 42;
  if (/malvern|chancellorsville|gettysburg|antietam|bullrun|fredericksburg/i.test(bd.id)) return 34;
  return 30;
}

function _iwPolicyStage(year, pressure) {
  if (year >= 1865) return { key: "surrender", label: "Guerrilla endgame pressure", base: 60 };
  if (pressure >= 70) return { key: "crackdown", label: "Counter-guerrilla crackdown", base: 50 };
  if (year >= 1863) return { key: "border-war", label: "Border-war violence", base: 42 };
  return { key: "partisan", label: "Partisan disruption", base: 24 };
}

function _iwWord(v) {
  v = _iwClamp(v, 0, 100);
  if (v >= 78) return ["Lawless spiral", "#d07060"];
  if (v >= 58) return ["Border war", "#c9712e"];
  if (v >= 36) return ["Partisan pressure", "#b8863b"];
  return ["Contained", "#6f9e5a"];
}

function _iwMeter(label, v, lowerBetter) {
  v = _iwClamp(v, 0, 100);
  var color = lowerBetter ? _iwWord(v)[1] : _iwWord(100 - v)[1];
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + color + '">' + _iwRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _iwRound(v) + '%;background:' + color + '"></div></div></div>';
}

function irregularWarSnapshot(C) {
  var I = irregularWarInit(C);
  var side = (C && C.side === "CS") ? "CS" : "US";
  var year = _iwYear(C, null);
  var bd = _iwNextBattle(C);
  var mom = (typeof vicMomentum === "function") ? vicMomentum(C) : 0.5;
  var logNet = 50;
  if (typeof logisticsSnapshot === "function") {
    try { logNet = logisticsSnapshot(C).network || 50; } catch (e) { logNet = 50; }
  }
  var enemyWill = C && C.strategy && typeof C.strategy.enemyWill === "number" ? C.strategy.enemyWill : 70;
  var weary = C && C.clock && typeof C.clock.weariness === "number" ? C.clock.weariness : 30;
  var hard = 0;
  if (typeof hardWarSnapshot === "function") {
    try { hard = hardWarSnapshot(C).pressure || 0; } catch (e) { hard = 0; }
  }
  var border = _iwBorderPressure(bd);
  var w = (_iwCfg().pressureWeights || {});
  var yearScore = year >= 1865 ? 100 : (year >= 1863 ? 68 : 30);
  var momentumScore = side === "CS" ? (1 - mom) * 100 : mom * 70;
  var pressure = 15
    + yearScore * _iwNum(w.year, 0.20)
    + momentumScore * _iwNum(w.momentum, 0.16)
    + (100 - logNet) * _iwNum(w.logistics, 0.14)
    + (100 - enemyWill) * _iwNum(w.enemyWill, 0.10)
    + hard * _iwNum(w.hardWar, 0.15)
    + weary * _iwNum(w.weariness, 0.12)
    + border * _iwNum(w.border, 0.13);
  if (I && I.active) pressure -= 6;
  pressure = _iwClamp(pressure, 0, 100);
  var stage = _iwPolicyStage(year, pressure);
  var word = _iwWord(pressure);
  var inc = I ? _iwNum(I.incidents[side], 0) : 0;
  var rep = I ? _iwNum(I.reprisals[side], 0) : 0;
  var harm = I ? _iwNum(I.civilianHarm[side], 0) : 0;
  var protectedCount = I ? _iwNum(I.protectedCivilians[side], 0) : 0;
  var intel = I ? _iwNum(I.localIntelligence[side], 0) : 0;
  var incidentBurden = _iwClamp(inc / 22, 0, 100);
  var reprisalRisk = _iwClamp(18 + pressure * 0.62 + rep / 35 - (I && I.active ? 9 : 0), 0, 100);
  var civilianDanger = _iwClamp(20 + pressure * 0.58 + harm / 45 - protectedCount / 120, 0, 100);
  var intelligence = _iwClamp(34 + intel / 18 + (I && I.active ? 14 : 0) + (side === "US" ? logNet / 12 : 0), 0, 100);
  return {
    side: side,
    year: year,
    stage: stage.key,
    status: stage.label,
    pressure: _iwRound(pressure),
    word: word[0],
    color: word[1],
    battleId: bd ? bd.id : "",
    battleName: bd ? bd.name : "Next engagement",
    logisticsNetwork: _iwRound(logNet),
    enemyWill: _iwRound(enemyWill),
    hardWarPressure: _iwRound(hard),
    incidents: _iwRound(inc),
    reprisals: _iwRound(rep),
    civilianHarm: _iwRound(harm),
    protectedCivilians: _iwRound(protectedCount),
    localIntelligence: _iwRound(intel),
    incidentBurden: _iwRound(incidentBurden),
    reprisalRisk: _iwRound(reprisalRisk),
    civilianDanger: _iwRound(civilianDanger),
    intelligence: _iwRound(intelligence),
    active: !!(I && I.active)
  };
}

function irregularWarBridgeBonus(C) {
  var I = irregularWarInit(C);
  var snap = irregularWarSnapshot(C);
  var active = !!(I && I.active === true && I.priority === "civilianSecurity");
  var out = {
    active: active,
    priority: active ? "civilianSecurity" : null,
    morale: 0,
    supply: 0,
    fatigue: 0,
    overall: 0,
    pressure: snap ? snap.pressure : 0,
    reprisalRisk: snap ? snap.reprisalRisk : 0,
    capped: true
  };
  if (active && snap) {
    var caps = (_iwCfg().bridgeCaps || {});
    out.morale = _iwRound(_iwClamp(0.5 + (100 - snap.civilianDanger) / 140, 0, _iwNum(caps.morale, 1)));
    out.supply = -_iwRound(_iwClamp(1 + snap.pressure / 95, 0, _iwNum(caps.supplyCost, 2)));
    out.fatigue = _iwRound(_iwClamp(1 + snap.reprisalRisk / 120, 0, _iwNum(caps.fatigueCost, 2)));
    out.overall = _iwRound(_iwClamp(0, 0, _iwNum(caps.overall, 0)));
  }
  if (I) I.lastBridge = out;
  return out;
}

function irregularWarSetPriority(C, priority) {
  var I = irregularWarInit(C);
  if (!I) return null;
  if (priority === "civilianSecurity" || priority === true) {
    I.active = true;
    I.priority = "civilianSecurity";
  } else {
    I.active = false;
    I.priority = null;
  }
  I.lastBridge = irregularWarBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return I;
}

function _iwCasualties(C, B) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  if (B && B.casualties && typeof B.casualties[side] === "number") return Math.max(0, B.casualties[side]);
  return 0;
}

function irregularWarOnResolve(winnerSide, type, B, C, win) {
  var I = irregularWarInit(C);
  if (!I) return;
  var side = (C && C.side === "CS") ? "CS" : "US";
  var snap0 = irregularWarSnapshot(C);
  var cfg = _iwCfg(), mit = cfg.mitigation || {};
  var active = I.active === true && I.priority === "civilianSecurity";
  var casualties = _iwCasualties(C, B);
  var incidents = 4 + snap0.pressure * 0.85 + casualties * 0.004 + (snap0.year >= 1863 ? 9 : 3);
  var reprisals = 2 + snap0.reprisalRisk * 0.55 + casualties * 0.002;
  var harm = 14 + snap0.civilianDanger * 1.4 + casualties * 0.006 + (snap0.stage === "crackdown" ? 18 : 0);
  var protectedCount = 0;
  var intel = 2 + snap0.intelligence * 0.08;
  if (active) {
    incidents *= 1 - _iwClamp(_iwNum(mit.incidentReduction, 0.18), 0, 0.75);
    reprisals *= 1 - _iwClamp(_iwNum(mit.reprisalReduction, 0.30), 0, 0.75);
    harm *= 1 - _iwClamp(_iwNum(mit.civilianHarmReduction, 0.28), 0, 0.75);
    protectedCount = Math.round(_iwClamp(snap0.civilianDanger, 0, 100) * _iwNum(mit.protectedCivilianFactor, 10));
    intel += 5;
    if (C && C.clock) C.clock.capital = _iwClamp(_iwNum(C.clock.capital, 0) - _iwNum(mit.capitalCost, 1), 0, 999999);
  }
  I.incidents[side] = _iwClamp(I.incidents[side] + Math.round(incidents), 0, 999999);
  I.reprisals[side] = _iwClamp(I.reprisals[side] + Math.round(reprisals), 0, 999999);
  I.civilianHarm[side] = _iwClamp(I.civilianHarm[side] + Math.round(harm), 0, 999999);
  I.protectedCivilians[side] = _iwClamp(I.protectedCivilians[side] + protectedCount, 0, 999999);
  I.localIntelligence[side] = _iwClamp(I.localIntelligence[side] + Math.round(intel), 0, 999999);
  var snap = irregularWarSnapshot(C);
  I.lastTurn = {
    year: snap.year,
    pressure: snap.pressure,
    incidentsAdded: Math.round(incidents),
    reprisalsAdded: Math.round(reprisals),
    civilianHarmAdded: Math.round(harm),
    protectedCivilians: protectedCount,
    active: active
  };
  logPush(I, "log", snap.word + ": " + snap.incidents + " incidents, " + snap.civilianHarm + " civilian-danger ledger.");
}

function presIrregularWarBlock(C) {
  if (!C) return "";
  var I = irregularWarInit(C), snap = irregularWarSnapshot(C), D = _iwData();
  var profile = _iwProfile(snap.side), on = !!(I && I.active && I.priority === "civilianSecurity");
  var threads = D.threads || [], debates = D.debates || [];
  var mosby = threads[0] || null, lawrence = threads[1] || null, order11 = threads[2] || null, lieber = threads[3] || null;
  var debateHTML = "";
  for (var d = 0; d < debates.length; d++) {
    if (debates[d]) debateHTML += '<div style="margin-top:4px"><b>' + htmlEsc(debates[d].title) + ':</b> ' + htmlEsc(debates[d].summary) + '</div>';
  }
  var log = "";
  if (I.log && I.log.length) {
    for (var i = 0; i < I.log.length && i < 3; i++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(I.log[i]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Irregular War &amp; Civilian Security</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:650px">A contained ledger for partisans, bushwhackers, reprisals, and civilian protection without turning raids into romance.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.pressure + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (on ? 'Civilian-security priority active' : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _iwMeter('Irregular-war pressure', snap.pressure, true)
    + _iwMeter('Incident burden', snap.incidentBurden, true)
    + _iwMeter('Reprisal risk', snap.reprisalRisk, true)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _iwMeter('Civilian danger', snap.civilianDanger, true)
    + _iwMeter('Local intelligence', snap.intelligence, false)
    + _iwMeter('Hard-war spillover', snap.hardWarPressure, true)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || snap.side) + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Ledger: <b>' + snap.incidents + '</b> incidents, <b>' + snap.reprisals
    + '</b> reprisals, <b>' + snap.civilianHarm + '</b> civilian-danger, <b>' + snap.protectedCivilians + '</b> civilians protected.</div>'
    + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'
    + '<div style="font-size:12px"><b>Discipline counter-guerrilla policy</b><div style="opacity:.72">Protect civilians, screen railroads, gather lawful intelligence, and restrain reprisals. It costs supply, tempo, and political capital.</div></div>'
    + '<button id="iwToggleSecurity" type="button" class="upg" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? 'Security active &check;' : 'Protect civilians') + '</button>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">When active, this can add at most +' + _iwNum((_iwCfg().bridgeCaps || {}).morale, 1)
    + ' morale, cost ' + _iwNum((_iwCfg().bridgeCaps || {}).supplyCost, 2) + ' supply, add +' + _iwNum((_iwCfg().bridgeCaps || {}).fatigueCost, 2)
    + ' fatigue, and adds no direct overall bonus. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + (mosby ? '<div style="margin-top:4px"><b>' + htmlEsc(mosby.label) + ':</b> ' + htmlEsc(mosby.summary) + '</div>' : '')
    + (lawrence ? '<div style="margin-top:4px"><b>' + htmlEsc(lawrence.label) + ':</b> ' + htmlEsc(lawrence.summary) + '</div>' : '')
    + (order11 ? '<div style="margin-top:4px"><b>' + htmlEsc(order11.label) + ':</b> ' + htmlEsc(order11.summary) + '</div>' : '')
    + (lieber ? '<div style="margin-top:4px"><b>' + htmlEsc(lieber.label) + ':</b> ' + htmlEsc(lieber.summary) + '</div>' : '')
    + debateHTML
    + '<div style="margin-top:4px">Evidence is consolidated from NPS, Civil War on the Western Border, the Lieber Code source trail, and existing Breckinridge data. Mosby, Lawrence, General Order No. 11, and the law-of-war distinction all stay visible.</div>'
    + '</details>'
    + '</div>';
}

function irregularWarWireOverview(C) {
  var b = document.getElementById("iwToggleSecurity");
  if (!b || !C) return;
  b.addEventListener("click", function () {
    var I = irregularWarInit(C);
    irregularWarSetPriority(C, !(I && I.active && I.priority === "civilianSecurity"));
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
