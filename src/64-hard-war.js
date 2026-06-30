/* ===========================================================================
   Phase F/G · 64-hard-war.js — Hard war and civilian protection.

   Bounded D175 scope: hard war becomes a War Effort teaching/system surface.
   It tracks property destruction, displacement, and freedpeople/refugee
   protection pressure without adding a playable battle or forcing outcomes.
   Default bridge input is exact zero; the explicit protection priority is
   capped, costly, and cannot make hard war clean.
   =========================================================================== */

function _hwNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _hwClamp(v, lo, hi) {
  v = _hwNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _hwRound(v) { return Math.round(_hwNum(v, 0)); }
function _hwData() { return gameData("hard-war") || {}; }
function _hwCfg() { var D = _hwData(); return D.config || {}; }

function _hwProfile(side) {
  var D = _hwData(), p = D.profiles || {};
  return p[side === "CS" ? "CS" : "US"] || {};
}

function _hwYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  if (C && C.clock && typeof C.clock.year === "number") return C.clock.year;
  if (C && C.president && C.president.date && typeof C.president.date.year === "number") return C.president.date.year;
  return campaignYear(C);
}

function _hwSideBag(v) {
  var out = { US: 0, CS: 0 };
  if (v && typeof v === "object" && !Array.isArray(v)) {
    out.US = _hwClamp(v.US, 0, 999999);
    out.CS = _hwClamp(v.CS, 0, 999999);
  }
  return out;
}

function hardWarInit(C) {
  if (!C) return null;
  if (!C.hardWar || typeof C.hardWar !== "object" || Array.isArray(C.hardWar)) C.hardWar = {};
  var H = C.hardWar;
  H.schema = "cw_hard_war_v1";
  if (H.active !== true) H.active = false;
  if (H.priority !== "civilianProtection") H.priority = H.active ? "civilianProtection" : null;
  H.propertyDestroyed = _hwSideBag(H.propertyDestroyed);
  H.displaced = _hwSideBag(H.displaced);
  H.freedpeopleProtected = _hwSideBag(H.freedpeopleProtected);
  if (!Array.isArray(H.log)) H.log = [];
  if (H.log.length > 6) H.log.length = 6;
  if (H.lastTurn && (typeof H.lastTurn !== "object" || Array.isArray(H.lastTurn))) H.lastTurn = null;
  if (H.lastBridge && (typeof H.lastBridge !== "object" || Array.isArray(H.lastBridge))) H.lastBridge = null;
  return H;
}

function _hwNextBattle(C) {
  if (typeof _brgNextBattle === "function") return _brgNextBattle(C);
  return null;
}

function _hwPolicyStage(year) {
  if (year >= 1864) return { key: "hard-war", label: "Hard-war campaigns", base: 58 };
  if (year >= 1863) return { key: "turning", label: "War-support economy targeted", base: 34 };
  return { key: "limited", label: "Limited conciliation", base: 16 };
}

function _hwWord(v) {
  v = _hwClamp(v, 0, 100);
  if (v >= 78) return ["Severe", "#d07060"];
  if (v >= 58) return ["Hard war", "#c9712e"];
  if (v >= 36) return ["Escalating", "#b8863b"];
  return ["Limited", "#6f9e5a"];
}

function _hwMeter(label, v, lowerBetter) {
  v = _hwClamp(v, 0, 100);
  var color = lowerBetter ? _hwWord(v)[1] : _hwWord(100 - v)[1];
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + color + '">' + _hwRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _hwRound(v) + '%;background:' + color + '"></div></div></div>';
}

function hardWarSnapshot(C) {
  var H = hardWarInit(C);
  var side = (C && C.side === "CS") ? "CS" : "US";
  var year = _hwYear(C, null);
  var stage = _hwPolicyStage(year);
  var mom = (typeof vicMomentum === "function") ? vicMomentum(C) : 0.5;
  var bd = _hwNextBattle(C);
  var logNet = 50;
  if (typeof logisticsSnapshot === "function") {
    try { logNet = logisticsSnapshot(C).network || 50; } catch (e) { logNet = 50; }
  }
  var enemyWill = C && C.strategy && typeof C.strategy.enemyWill === "number" ? C.strategy.enemyWill : 70;
  var em = C && C.president && C.president.emancipation;
  var emancipation = !!(em && em.issued) || year >= 1863;
  var weary = C && C.clock && typeof C.clock.weariness === "number" ? C.clock.weariness : 30;
  var w = (_hwCfg().pressureWeights || {});
  var yearScore = year >= 1864 ? 100 : (year >= 1863 ? 58 : 20);
  var momentumScore = side === "US" ? mom * 100 : (1 - mom) * 100;
  var pressure = stage.base
    + yearScore * _hwNum(w.year, 0.26)
    + momentumScore * _hwNum(w.momentum, 0.22)
    + (100 - logNet) * _hwNum(w.logistics, 0.18)
    + (100 - enemyWill) * _hwNum(w.enemyWill, 0.14)
    + (emancipation ? 100 : 25) * _hwNum(w.emancipation, 0.12)
    + weary * _hwNum(w.weariness, 0.08);
  if (H && H.active) pressure -= 7;
  pressure = _hwClamp(pressure, 0, 100);
  var word = _hwWord(pressure);
  var prop = H ? _hwNum(H.propertyDestroyed[side], 0) : 0;
  var disp = H ? _hwNum(H.displaced[side], 0) : 0;
  var freed = H ? _hwNum(H.freedpeopleProtected[side], 0) : 0;
  var propertyBurden = _hwClamp(prop / 130, 0, 100);
  var displacementBurden = _hwClamp(disp / 85, 0, 100);
  var freedRisk = _hwClamp(18 + pressure * 0.42 + (emancipation ? 24 : 0) - (H && H.active ? 12 : 0), 0, 100);
  return {
    side: side,
    year: year,
    stage: stage.key,
    status: stage.label,
    pressure: _hwRound(pressure),
    word: word[0],
    color: word[1],
    battleId: bd ? bd.id : "",
    battleName: bd ? bd.name : "Next engagement",
    logisticsNetwork: _hwRound(logNet),
    enemyWill: _hwRound(enemyWill),
    propertyDestroyed: _hwRound(prop),
    displaced: _hwRound(disp),
    freedpeopleProtected: _hwRound(freed),
    propertyBurden: _hwRound(propertyBurden),
    displacementBurden: _hwRound(displacementBurden),
    freedpeopleRisk: _hwRound(freedRisk),
    emancipation: emancipation,
    active: !!(H && H.active)
  };
}

function hardWarBridgeBonus(C) {
  var H = hardWarInit(C);
  var snap = hardWarSnapshot(C);
  var active = !!(H && H.active === true && H.priority === "civilianProtection");
  var out = {
    active: active,
    priority: active ? "civilianProtection" : null,
    morale: 0,
    supply: 0,
    fatigue: 0,
    overall: 0,
    pressure: snap ? snap.pressure : 0,
    capped: true
  };
  if (active && snap) {
    var caps = (_hwCfg().bridgeCaps || {});
    out.morale = _hwRound(_hwClamp(0.6 + (100 - snap.freedpeopleRisk) / 120, 0, _hwNum(caps.morale, 1)));
    out.supply = -_hwRound(_hwClamp(1 + snap.pressure / 85, 0, _hwNum(caps.supplyCost, 2)));
    out.fatigue = _hwRound(_hwClamp(snap.pressure / 95, 0, _hwNum(caps.fatigueCost, 1)));
    out.overall = _hwRound(_hwClamp(0, 0, _hwNum(caps.overall, 0)));
  }
  if (H) H.lastBridge = out;
  return out;
}

function hardWarSetPriority(C, priority) {
  var H = hardWarInit(C);
  if (!H) return null;
  if (priority === "civilianProtection" || priority === true) {
    H.active = true;
    H.priority = "civilianProtection";
  } else {
    H.active = false;
    H.priority = null;
  }
  H.lastBridge = hardWarBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return H;
}

function _hwCasualties(C, B) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  if (B && B.casualties && typeof B.casualties[side] === "number") return Math.max(0, B.casualties[side]);
  return 0;
}

function hardWarOnResolve(winnerSide, type, B, C, win) {
  var H = hardWarInit(C);
  if (!H) return;
  var side = (C && C.side === "CS") ? "CS" : "US";
  var snap0 = hardWarSnapshot(C);
  var cfg = _hwCfg(), mit = cfg.mitigation || {};
  var active = H.active === true && H.priority === "civilianProtection";
  var casualties = _hwCasualties(C, B);
  var property = 35 + snap0.pressure * 4 + casualties * 0.018 + (snap0.year >= 1864 ? 95 : 18);
  var displaced = 12 + snap0.pressure * 1.7 + casualties * 0.008 + (snap0.emancipation ? 22 : 0);
  var protectedFreed = 0;
  if (active) {
    property *= 1 - _hwClamp(_hwNum(mit.propertyReduction, 0.30), 0, 0.75);
    displaced *= 1 - _hwClamp(_hwNum(mit.displacementReduction, 0.25), 0, 0.75);
    protectedFreed = Math.round(_hwClamp(snap0.freedpeopleRisk, 0, 100) * (side === "US" ? 14 : 8));
    if (C && C.clock) {
      C.clock.weariness = _hwClamp(_hwNum(C.clock.weariness, 0) - _hwNum(mit.wearinessRelief, 1), 0, 100);
      C.clock.capital = _hwClamp(_hwNum(C.clock.capital, 0) - _hwNum(mit.capitalCost, 1), 0, 999999);
    }
  }
  H.propertyDestroyed[side] = _hwClamp(H.propertyDestroyed[side] + Math.round(property), 0, 999999);
  H.displaced[side] = _hwClamp(H.displaced[side] + Math.round(displaced), 0, 999999);
  H.freedpeopleProtected[side] = _hwClamp(H.freedpeopleProtected[side] + protectedFreed, 0, 999999);
  var snap = hardWarSnapshot(C);
  H.lastTurn = {
    year: snap.year,
    pressure: snap.pressure,
    propertyAdded: Math.round(property),
    displacedAdded: Math.round(displaced),
    freedpeopleProtected: protectedFreed,
    active: active
  };
  logPush(H, "log", snap.word + ": " + snap.propertyDestroyed + " property-pressure, " + snap.displaced + " displaced.");
}

function presHardWarBlock(C) {
  if (!C) return "";
  var H = hardWarInit(C), snap = hardWarSnapshot(C), D = _hwData();
  var profile = _hwProfile(snap.side), on = !!(H && H.active && H.priority === "civilianProtection");
  var policies = D.policies || [], debates = D.debates || [];
  var sherman = policies[0] || null, sheridan = policies[1] || null, freed = policies[3] || null, debate = debates[0] || null;
  var log = "";
  if (H.log && H.log.length) {
    for (var i = 0; i < H.log.length && i < 3; i++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(H.log[i]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Hard War &amp; Civilian Protection</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:650px">A restrained ledger for destroying war-supporting resources without turning civilian suffering into spectacle.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.pressure + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (on ? 'Protection priority active' : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _hwMeter('Hard-war pressure', snap.pressure, true)
    + _hwMeter('Property-destruction burden', snap.propertyBurden, true)
    + _hwMeter('Displacement burden', snap.displacementBurden, true)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _hwMeter('Freedpeople/refugee risk', snap.freedpeopleRisk, true)
    + _hwMeter('Logistics network', snap.logisticsNetwork, false)
    + _hwMeter('Enemy will broken', 100 - snap.enemyWill, false)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || snap.side) + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Ledger: <b>' + snap.propertyDestroyed + '</b> property-pressure, <b>' + snap.displaced
    + '</b> displaced, <b>' + snap.freedpeopleProtected + '</b> freedpeople/refugees protected.</div>'
    + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'
    + '<div style="font-size:12px"><b>Protect civilians and freedpeople</b><div style="opacity:.72">Adds guards, discipline, food, transport, and refugee protection. It costs supply and tempo; it does not make hard war clean.</div></div>'
    + '<button id="hwToggleProtection" type="button" class="upg" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? 'Protection active &check;' : 'Protect civilians') + '</button>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">When active, this can add at most +' + _hwNum((_hwCfg().bridgeCaps || {}).morale, 1)
    + ' morale, cost ' + _hwNum((_hwCfg().bridgeCaps || {}).supplyCost, 2) + ' supply, add +' + _hwNum((_hwCfg().bridgeCaps || {}).fatigueCost, 1)
    + ' fatigue, and adds no direct overall bonus. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + (sherman ? '<div style="margin-top:4px"><b>' + htmlEsc(sherman.label) + ':</b> ' + htmlEsc(sherman.summary) + '</div>' : '')
    + (sheridan ? '<div style="margin-top:4px"><b>' + htmlEsc(sheridan.label) + ':</b> ' + htmlEsc(sheridan.summary) + '</div>' : '')
    + (freed ? '<div style="margin-top:4px"><b>' + htmlEsc(freed.label) + ':</b> ' + htmlEsc(freed.summary) + '</div>' : '')
    + (debate ? '<div style="margin-top:4px"><b>' + htmlEsc(debate.title) + ':</b> ' + htmlEsc(debate.summary) + '</div>' : '')
    + '<div style="margin-top:4px">Evidence is consolidated in data/codex.json: hard war, Sherman, Sheridan, contraband, and emancipation. This surface rejects Lost Cause inversion while naming civilian suffering plainly.</div>'
    + '</details>'
    + '</div>';
}

function hardWarWireOverview(C) {
  var b = document.getElementById("hwToggleProtection");
  if (!b || !C) return;
  b.addEventListener("click", function () {
    var H = hardWarInit(C);
    hardWarSetPriority(C, !(H && H.active && H.priority === "civilianProtection"));
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
