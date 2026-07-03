/* ===========================================================================
   Phase F · 62-prisoner-exchange.js — POW exchange-cartel collapse.

   Bounded D161 scope: the prisoner-exchange collapse becomes a War Effort
   teaching/system surface. It tracks a capped detained-prisoner pressure ledger,
   names the USCT equal-status fault line, and offers an explicit relief priority.
   The priority mitigates pressure; it does not reopen the cartel, force exchange,
   or trade away equal protection for Black U.S. soldiers. Default bridge input is
   exact zero.

   E35 (D236): besides the capped bridge bonus, an ACTIVE exchange also returns men —
   a SECOND, real combat-input channel (C.manpower.pool + C.manpower.strength; the
   strength facet feeds bridgeArmy at 0.22 weight and 70-manpower's replenish carries
   it forward). Historically intended (returned POWs are manpower), so it is kept —
   but BOUNDED like every other War Effort system: per-battle strength lift <= 1.2
   AND the cumulative campaign contribution <= _PX_STRENGTH_LIFT_CAP (6.0), tracked
   in P.strengthLiftUsed (additive save field, lazy default 0 — no _SAVE_VER bump).
   The pool write stays (it is the literal returned men, already bounded by captures).
   =========================================================================== */

function _pxNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _pxClamp(v, lo, hi) {
  v = _pxNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _pxRound(v) { return Math.round(_pxNum(v, 0)); }

function _pxData() { return gameData("prisoner-exchange") || {}; }
function _pxCfg() { var D = _pxData(); return D.config || {}; }

function _pxProfile(side) {
  var D = _pxData(), p = D.profiles || {};
  return p[side === "CS" ? "CS" : "US"] || {};
}

function _pxEnemy(side) { return side === "CS" ? "US" : "CS"; }

function _pxYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  return campaignYear(C);
}

function _pxUsctFault(C, year) {
  var em = C && C.president && C.president.emancipation;
  var issued = !!(em && em.issued);
  var declined = !!(em && em.declined);
  var usct = !!(C && C.manpower && C.manpower.usctUnlocked);
  return !declined && (usct || issued || year >= 1863);
}

function _pxStage(C, year) {
  var usct = _pxUsctFault(C, year);
  if (usct || year >= 1863) {
    return { key: "collapsed", label: "Cartel collapsed", exchangeRate: _pxNum((_pxCfg().exchangeRates || {}).collapsed, 0.035), mortalityRate: _pxNum((_pxCfg().mortalityRates || {}).collapsed, 0.028), basePressure: 58 };
  }
  if (year >= 1862) {
    return { key: "strained", label: "Cartel strained", exchangeRate: _pxNum((_pxCfg().exchangeRates || {}).strained, 0.18), mortalityRate: _pxNum((_pxCfg().mortalityRates || {}).strained, 0.012), basePressure: 34 };
  }
  return { key: "open", label: "Cartel functioning", exchangeRate: _pxNum((_pxCfg().exchangeRates || {}).open, 0.45), mortalityRate: _pxNum((_pxCfg().mortalityRates || {}).open, 0.004), basePressure: 12 };
}

function _pxSafeSideBag(v) {
  var out = { US: 0, CS: 0 };
  if (v && typeof v === "object" && !Array.isArray(v)) {
    out.US = _pxClamp(v.US, 0, 999999);
    out.CS = _pxClamp(v.CS, 0, 999999);
  }
  return out;
}

function prisonersInit(C) {
  if (!C) return null;
  if (!C.prisoners || typeof C.prisoners !== "object" || Array.isArray(C.prisoners)) C.prisoners = {};
  var P = C.prisoners;
  P.schema = "cw_prisoner_exchange_v1";
  if (P.active !== true) P.active = false;
  if (P.priority !== "cartelRelief") P.priority = P.active ? "cartelRelief" : null;
  P.detained = _pxSafeSideBag(P.detained);
  P.returned = _pxSafeSideBag(P.returned);
  P.deaths = _pxSafeSideBag(P.deaths);
  if (!Array.isArray(P.log)) P.log = [];
  if (P.log.length > 6) P.log.length = 6;
  if (P.lastTurn && (typeof P.lastTurn !== "object" || Array.isArray(P.lastTurn))) P.lastTurn = null;
  if (P.lastBridge && (typeof P.lastBridge !== "object" || Array.isArray(P.lastBridge))) P.lastBridge = null;
  return P;
}

function _pxPressureWord(v) {
  v = _pxClamp(v, 0, 100);
  if (v >= 75) return ["Crisis", "#d07060"];
  if (v >= 56) return ["Deadlock", "#c9712e"];
  if (v >= 34) return ["Strained", "#b8863b"];
  return ["Managed", "#6f9e5a"];
}

function _pxMeter(label, v, lowerBetter) {
  v = _pxClamp(v, 0, 100);
  var score = lowerBetter ? 100 - v : v;
  var w = _pxPressureWord(100 - score);
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + w[1] + '">' + _pxRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _pxRound(v) + '%;background:' + w[1] + '"></div></div></div>';
}

function prisonerExchangeSnapshot(C) {
  var P = prisonersInit(C);
  var side = (C && C.side === "CS") ? "CS" : "US";
  var enemy = _pxEnemy(side);
  var year = _pxYear(C, null);
  var stage = _pxStage(C, year);
  var det = P ? P.detained : { US: 0, CS: 0 };
  var total = _pxNum(det.US, 0) + _pxNum(det.CS, 0);
  var heldByUs = _pxNum(det[enemy], 0);
  var heldByEnemy = _pxNum(det[side], 0);
  var returned = P ? P.returned : { US: 0, CS: 0 };
  var deaths = P ? P.deaths : { US: 0, CS: 0 };
  var enemyWill = C && C.strategy && typeof C.strategy.enemyWill === "number" ? C.strategy.enemyWill : 70;
  var detainedPressure = _pxClamp(total / 90, 0, 100);
  var mortalityRisk = _pxClamp(stage.mortalityRate * 2600 + detainedPressure * 0.25, 0, 100);
  var usctPressure = _pxUsctFault(C, year) ? 100 : 0;
  var w = (_pxCfg().pressureWeights || {});
  var pressure = stage.basePressure
    + detainedPressure * _pxNum(w.detained, 0.34)
    + (year >= 1864 ? 12 : year >= 1863 ? 8 : 0) * _pxNum(w.year, 0.16)
    + usctPressure * _pxNum(w.usct, 0.24)
    + mortalityRisk * _pxNum(w.mortality, 0.16)
    + (100 - enemyWill) * _pxNum(w.enemyWill, 0.10);
  if (P && P.active) pressure -= 8;
  pressure = _pxClamp(pressure, 0, 100);
  var word = _pxPressureWord(pressure);
  return {
    side: side,
    enemy: enemy,
    year: year,
    stage: stage.key,
    status: stage.label,
    pressure: _pxRound(pressure),
    color: word[1],
    word: word[0],
    totalDetained: _pxRound(total),
    heldByUs: _pxRound(heldByUs),
    heldByEnemy: _pxRound(heldByEnemy),
    exchangeFunction: _pxRound(stage.exchangeRate * 100),
    mortalityRisk: _pxRound(mortalityRisk),
    usctFault: _pxUsctFault(C, year),
    returnedHome: _pxRound(returned[side]),
    deathsHome: _pxRound(deaths[side])
  };
}

function prisonerExchangeBridgeBonus(C) {
  var P = prisonersInit(C);
  var snap = prisonerExchangeSnapshot(C);
  var active = !!(P && P.active === true && P.priority === "cartelRelief");
  var out = {
    active: active,
    priority: active ? "cartelRelief" : null,
    morale: 0,
    supply: 0,
    fatigue: 0,
    fatigueRelief: 0,
    overall: 0,
    pressure: snap ? snap.pressure : 0,
    stage: snap ? snap.stage : "",
    capped: true
  };
  if (active && snap) {
    var caps = _pxCfg().bridgeCaps || {};
    var moraleCap = _pxNum(caps.morale, 2), fatigueCap = _pxNum(caps.fatigueRelief, 2), supplyCap = _pxNum(caps.supplyCost, 2), overallCap = _pxNum(caps.overall, 1);
    var reliefRoom = _pxClamp((100 - snap.pressure) / 28 + 0.6, 0, 4);
    out.morale = _pxRound(_pxClamp(reliefRoom, 0, moraleCap));
    out.fatigueRelief = _pxRound(_pxClamp(1 + (100 - snap.mortalityRisk) / 90, 0, fatigueCap));
    out.fatigue = -out.fatigueRelief;
    out.supply = -_pxRound(_pxClamp(1 + snap.totalDetained / 25000, 0, supplyCap));
    out.overall = _pxRound(_pxClamp((out.morale + out.fatigueRelief - Math.abs(out.supply) * 0.5) / 3, 0, overallCap));
  }
  if (P) P.lastBridge = out;
  return out;
}

function prisonerExchangeSetPriority(C, priority) {
  var P = prisonersInit(C);
  if (!P) return null;
  if (priority === "cartelRelief" || priority === true) {
    P.active = true;
    P.priority = "cartelRelief";
  } else {
    P.active = false;
    P.priority = null;
  }
  P.lastBridge = prisonerExchangeBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return P;
}

function _pxCaptureFor(side, winnerSide, type, casualties) {
  var cfg = _pxCfg().estimatedCaptureRatePct || {};
  var t = String(type || "").toLowerCase();
  var key = "draw";
  if (winnerSide === side) key = "win";
  else if (winnerSide === _pxEnemy(side)) key = (t === "decisive") ? "decisive" : "loss";
  var rate = _pxNum(cfg[key], key === "loss" ? 8 : 5) / 100;
  return Math.max(0, _pxNum(casualties && casualties[side], 0) * rate);
}

function prisonerExchangeOnResolve(winnerSide, type, B, C, win) {
  var P = prisonersInit(C);
  if (!P) return;
  var year = _pxYear(C, B);
  var stage = _pxStage(C, year);
  var rates = _pxCfg().exchangeRates || {}, morts = _pxCfg().mortalityRates || {};
  var reliefRate = P.active ? _pxNum(rates.reliefBonus, 0.055) : 0;
  var mortalityReduction = P.active ? _pxNum(morts.reliefReduction, 0.008) : 0;
  var exchangeRate = _pxClamp(stage.exchangeRate + reliefRate, 0, 0.65);
  var mortalityRate = _pxClamp(stage.mortalityRate - mortalityReduction, 0, 0.08);
  var casualties = (B && B.casualties) || {};
  var added = { US: _pxCaptureFor("US", winnerSide, type, casualties), CS: _pxCaptureFor("CS", winnerSide, type, casualties) };
  P.detained.US = _pxClamp(P.detained.US + added.US, 0, 999999);
  P.detained.CS = _pxClamp(P.detained.CS + added.CS, 0, 999999);
  var returned = { US: Math.floor(P.detained.US * exchangeRate), CS: Math.floor(P.detained.CS * exchangeRate) };
  var deaths = { US: Math.floor(P.detained.US * mortalityRate), CS: Math.floor(P.detained.CS * mortalityRate) };
  P.detained.US = _pxClamp(P.detained.US - returned.US - deaths.US, 0, 999999);
  P.detained.CS = _pxClamp(P.detained.CS - returned.CS - deaths.CS, 0, 999999);
  P.returned.US = _pxClamp(P.returned.US + returned.US, 0, 999999);
  P.returned.CS = _pxClamp(P.returned.CS + returned.CS, 0, 999999);
  P.deaths.US = _pxClamp(P.deaths.US + deaths.US, 0, 999999);
  P.deaths.CS = _pxClamp(P.deaths.CS + deaths.CS, 0, 999999);

  var side = (C && C.side === "CS") ? "CS" : "US";
  if (P.active && C.manpower && returned[side] > 0) {
    // E35 (D236): the returned-POW strength lift is a real second combat-input channel — bounded
    // per-battle (<=1.2) AND cumulatively (<=_PX_STRENGTH_LIFT_CAP over the whole campaign) so the
    // total exchange effect is capped like the other War Effort systems. Pool = literal men, uncapped
    // beyond its clamp (physically bounded by captures).
    var _PX_STRENGTH_LIFT_CAP = 6;
    var used = _pxClamp(_pxNum(P.strengthLiftUsed, 0), 0, _PX_STRENGTH_LIFT_CAP);
    var lift = Math.min(1.2, (returned[side] / 1000) * 0.35, _PX_STRENGTH_LIFT_CAP - used);
    C.manpower.pool = _pxClamp(_pxNum(C.manpower.pool, 0) + returned[side] / 1000, 0, 10000);
    if (lift > 0) {
      C.manpower.strength = _pxClamp(_pxNum(C.manpower.strength, 100) + lift, 5, 100);
      P.strengthLiftUsed = _pxClamp(used + lift, 0, _PX_STRENGTH_LIFT_CAP);
    }
  }

  var snap = prisonerExchangeSnapshot(C);
  P.lastTurn = {
    year: year,
    stage: stage.key,
    pressure: snap.pressure,
    detained: { US: _pxRound(P.detained.US), CS: _pxRound(P.detained.CS) },
    added: { US: _pxRound(added.US), CS: _pxRound(added.CS) },
    returned: returned,
    deaths: deaths,
    active: P.active === true
  };
  logPush(P, "log", snap.status + ": " + snap.totalDetained + " detained, " + snap.pressure + " pressure.");
}

function presPrisonerExchangeBlock(C) {
  if (!C) return "";
  var P = prisonersInit(C), snap = prisonerExchangeSnapshot(C), D = _pxData();
  var profile = _pxProfile(snap.side), enemyProfile = _pxProfile(snap.enemy);
  var on = !!(P && P.active && P.priority === "cartelRelief");
  var camp = (D.camps && D.camps.length) ? D.camps[0] : null;
  var debate = (D.debates && D.debates.length) ? D.debates[0] : null;
  var log = "";
  if (P.log && P.log.length) {
    for (var i = 0; i < P.log.length && i < 3; i++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(P.log[i]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Prisoner Exchange &amp; Camps</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:640px">A manpower and moral-pressure ledger for the exchange-cartel collapse, centered on USCT equal status.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.pressure + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (on ? 'Relief priority active' : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _pxMeter('Exchange function', snap.exchangeFunction, false)
    + _pxMeter('Detained burden', _pxClamp(snap.totalDetained / 90, 0, 100), true)
    + _pxMeter('Camp mortality risk', snap.mortalityRisk, true)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px;font-size:12px;line-height:1.45">'
    + '<div><b>' + htmlEsc(snap.status) + '</b> &middot; ' + htmlEsc(profile.name || snap.side) + '</div>'
    + '<div style="opacity:.75;margin-top:4px">Held by your government: <b>' + snap.heldByUs + '</b> &middot; held by the enemy: <b>' + snap.heldByEnemy + '</b></div>'
    + '<div style="opacity:.75;margin-top:4px">Returned home: <b>' + snap.returnedHome + '</b> &middot; died in captivity: <b>' + snap.deathsHome + '</b></div>'
    + '<div style="opacity:.75;margin-top:4px">' + (snap.usctFault ? 'USCT equal-status dispute is active.' : 'The USCT fault line has not yet fully opened.') + '</div>'
    + '</div>'
    + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'
    + '<div style="font-size:12px"><b>Honor cartel limits and prison relief</b><div style="opacity:.72">Mitigates suffering; never trades away USCT soldier status or reopens exchange by fiat.</div></div>'
    + '<button id="pxToggleRelief" type="button" class="upg" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? 'Relief priority active &check;' : 'Prioritize relief') + '</button>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">When active, this can add at most +' + _pxNum((_pxCfg().bridgeCaps || {}).morale, 2)
    + ' morale, -' + _pxNum((_pxCfg().bridgeCaps || {}).fatigueRelief, 2) + ' fatigue, cost ' + _pxNum((_pxCfg().bridgeCaps || {}).supplyCost, 2)
    + ' supply, and add +' + _pxNum((_pxCfg().bridgeCaps || {}).overall, 1) + ' overall. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(enemyProfile.teaching || '') + '</div>'
    + (camp ? '<div style="margin-top:4px"><b>' + htmlEsc(camp.name) + ':</b> ' + htmlEsc(camp.lesson) + '</div>' : '')
    + (debate ? '<div style="margin-top:4px"><b>' + htmlEsc(debate.title) + ':</b> ' + htmlEsc(debate.summary) + '</div>' : '')
    + '<div style="margin-top:4px">Evidence is consolidated in HISTORICAL-DATA.md and data/codex.json: General Order No. 60, General Order No. 252, USCT prisoner status, Andersonville, Elmira, and the exchange-cartel collapse.</div>'
    + '</details>'
    + '</div>';
}

function prisonerExchangeWireOverview(C) {
  var b = document.getElementById("pxToggleRelief");
  if (!b || !C) return;
  b.addEventListener("click", function () {
    var P = prisonersInit(C);
    prisonerExchangeSetPriority(C, !(P && P.active && P.priority === "cartelRelief"));
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
