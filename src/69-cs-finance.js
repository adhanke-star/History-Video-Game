/* ===========================================================================
   Phase F/G · 69-cs-finance.js — Confederate finance toolkit.

   Bounded D188 scope: Confederate finance becomes a War Effort teaching/system
   surface with Erlanger loan, cotton bonds, produce loan, impressment, and the
   printing spiral. Confederate-side only. Default bridge input is exact zero;
   active priorities are capped, costly strategic inputs, never output gates.
   =========================================================================== */

function _csfNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _csfClamp(v, lo, hi) {
  v = _csfNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _csfRound(v) { return Math.round(_csfNum(v, 0)); }
function _csfData() { return gameData("cs-finance") || {}; }
function _csfCfg() { var D = _csfData(); return D.config || {}; }
function _csfInstruments() {
  var D = _csfData();
  return Array.isArray(D.instruments) ? D.instruments : [];
}

function _csfInstrument(id) {
  var list = _csfInstruments();
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
  return null;
}

function _csfYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  if (C && C.clock && typeof C.clock.year === "number") return C.clock.year;
  if (C && C.president && C.president.date && typeof C.president.date.year === "number") return C.president.date.year;
  return campaignYear(C);
}

function _csfSide(C) { return (C && C.side === "CS") ? "CS" : "US"; }

function _csfLedger(v, hi) { return _csfClamp(v, 0, typeof hi === "number" ? hi : 100); }

function csFinanceInit(C) {
  if (!C) return null;
  if (!C.csFinance || typeof C.csFinance !== "object" || Array.isArray(C.csFinance)) C.csFinance = {};
  var F = C.csFinance, caps = (_csfCfg().ledgerCaps || {});
  F.schema = "cw_cs_finance_v1";
  if (F.active !== true) F.active = false;
  if (!_csfInstrument(F.priority)) F.priority = F.active ? "printing-spiral" : null;
  if (!F.active) F.priority = null;
  F.cashRaised = _csfLedger(F.cashRaised, _csfNum(caps.cashRaised, 99999));
  F.debtBurden = _csfLedger(F.debtBurden, _csfNum(caps.debtBurden, 100));
  F.cottonPledged = _csfLedger(F.cottonPledged, _csfNum(caps.cottonPledged, 100));
  F.impressmentPressure = _csfLedger(F.impressmentPressure, _csfNum(caps.impressmentPressure, 100));
  F.civilianPressure = _csfLedger(F.civilianPressure, _csfNum(caps.civilianPressure, 100));
  F.creditIndex = _csfLedger(typeof F.creditIndex === "number" ? F.creditIndex : 72, _csfNum(caps.creditIndex, 100));
  if (!F.used || typeof F.used !== "object" || Array.isArray(F.used)) F.used = {};
  var list = _csfInstruments();
  for (var i = 0; i < list.length; i++) F.used[list[i].id] = F.used[list[i].id] === true;
  if (!Array.isArray(F.log)) F.log = [];
  if (F.log.length > 6) F.log.length = 6;
  if (F.lastTurn && (typeof F.lastTurn !== "object" || Array.isArray(F.lastTurn))) F.lastTurn = null;
  if (F.lastBridge && (typeof F.lastBridge !== "object" || Array.isArray(F.lastBridge))) F.lastBridge = null;
  return F;
}

function _csfInflationScore(E) {
  var m = _csfNum(E && E.inflation, 1);
  if (m <= 1) return 0;
  return _csfClamp((Math.log(m) / Math.log(90)) * 100, 0, 100);
}

function _csfWord(v) {
  v = _csfClamp(v, 0, 100);
  if (v >= 78) return ["Fiscal collapse", "#d07060"];
  if (v >= 58) return ["Credit breaking", "#c9712e"];
  if (v >= 36) return ["Strained finance", "#b8863b"];
  return ["Borrowing room", "#6f9e5a"];
}

function _csfBridgeCostWord(v) {
  v = _csfClamp(v, 0, 100);
  if (v >= 78) return ["Ruinous", "#d07060"];
  if (v >= 58) return ["Severe", "#c9712e"];
  if (v >= 36) return ["Costly", "#b8863b"];
  return ["Limited", "#6f9e5a"];
}

function _csfMeter(label, v, lowerBetter) {
  v = _csfClamp(v, 0, 100);
  var color = lowerBetter ? _csfBridgeCostWord(v)[1] : _csfWord(100 - v)[1];
  if (label === "Credit window") color = _csfWord(100 - v)[1];
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + color + '">' + _csfRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _csfRound(v) + '%;background:' + color + '"></div></div></div>';
}

function csFinanceSnapshot(C) {
  var F = csFinanceInit(C);
  var side = _csfSide(C);
  var year = _csfYear(C, null);
  var E = (C && C.economy) || {};
  var B = (C && C.blockade) || {};
  var weights = (_csfCfg().stressWeights || {});
  var printShare = E && E.mix && typeof E.mix.printing === "number" ? E.mix.printing * 100 : (side === "CS" ? 60 : 13);
  var inflScore = _csfInflationScore(E);
  var blockadeStress = side === "CS" ? _csfClamp((1 - _csfNum(B.importFactor, 0.62)) * 100, 0, 100) : 0;
  var credit = F ? _csfLedger(F.creditIndex, 100) : 72;
  var debt = F ? _csfLedger(F.debtBurden, 100) : 0;
  var impress = F ? _csfLedger(F.impressmentPressure, 100) : 0;
  var yearStress = year >= 1865 ? 16 : (year >= 1864 ? 10 : (year >= 1863 ? 5 : 0));
  var pressure = 14 + yearStress
    + printShare * _csfNum(weights.printing, 0.22)
    + inflScore * _csfNum(weights.inflation, 0.24)
    + blockadeStress * _csfNum(weights.blockade, 0.18)
    + (100 - credit) * _csfNum(weights.credit, 0.16)
    + debt * _csfNum(weights.debt, 0.12)
    + impress * _csfNum(weights.impressment, 0.08);
  pressure = side === "CS" ? _csfClamp(pressure, 0, 100) : 0;
  var word = _csfWord(pressure);
  var selected = F && F.priority ? _csfInstrument(F.priority) : null;
  var procurement = _csfClamp(20 + _csfNum(F && F.cashRaised, 0) / 9 + (F && F.active ? 12 : 0) - pressure / 7, 0, 100);
  return {
    side: side,
    year: year,
    active: !!(F && F.active && selected && side === "CS"),
    priority: selected ? selected.id : null,
    priorityLabel: selected ? selected.label : "None selected",
    pressure: _csfRound(pressure),
    word: word[0],
    color: word[1],
    printingShare: _csfRound(printShare),
    inflationScore: _csfRound(inflScore),
    blockadeStress: _csfRound(blockadeStress),
    creditIndex: _csfRound(credit),
    debtBurden: _csfRound(debt),
    cottonPledged: _csfRound(F && F.cottonPledged),
    impressmentPressure: _csfRound(impress),
    civilianPressure: _csfRound(F && F.civilianPressure),
    cashRaised: _csfRound(F && F.cashRaised),
    procurement: _csfRound(procurement),
    available: side === "CS"
  };
}

function csFinanceBridgeBonus(C) {
  var F = csFinanceInit(C);
  var snap = csFinanceSnapshot(C);
  var inst = F && F.priority ? _csfInstrument(F.priority) : null;
  var active = !!(snap && snap.side === "CS" && F && F.active === true && inst);
  var out = {
    active: active,
    priority: active && inst ? inst.id : null,
    morale: 0,
    supply: 0,
    fatigue: 0,
    overall: 0,
    pressure: snap ? snap.pressure : 0,
    creditIndex: snap ? snap.creditIndex : 0,
    capped: true
  };
  if (active && inst) {
    var caps = (_csfCfg().bridgeCaps || {});
    var capSupply = _csfNum(caps.supply, 3);
    var capMorale = _csfNum(caps.moraleCost, 2);
    var capFatigue = _csfNum(caps.fatigueCost, 2);
    out.supply = _csfRound(_csfClamp(inst.supplyBridge, 0, capSupply));
    out.morale = -_csfRound(_csfClamp(Math.abs(_csfNum(inst.moraleBridge, 0)), 0, capMorale));
    out.fatigue = _csfRound(_csfClamp(inst.fatigueBridge, 0, capFatigue));
    out.overall = 0;
  }
  if (F) F.lastBridge = out;
  return out;
}

function csFinanceSetPriority(C, priority) {
  var F = csFinanceInit(C);
  if (!F) return null;
  if (_csfSide(C) !== "CS") {
    F.active = false;
    F.priority = null;
  } else if (_csfInstrument(priority)) {
    F.active = true;
    F.priority = priority;
  } else {
    F.active = false;
    F.priority = null;
  }
  F.lastBridge = csFinanceBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return F;
}

function csFinanceOnResolve(winnerSide, type, B, C, win) {
  var F = csFinanceInit(C);
  if (!F) return;
  var side = _csfSide(C);
  var snap0 = csFinanceSnapshot(C);
  var inst = F.priority ? _csfInstrument(F.priority) : null;
  var active = side === "CS" && F.active === true && inst;
  var repeat = active && inst.oneShot && F.used[inst.id] ? 0.18 : 1;
  var gain = 0, inflationNudge = 0, capitalCost = 0;
  if (active) {
    gain = _csfRound(_csfNum(inst.fundsGain, 0) * repeat);
    C.funds = _csfClamp(_csfNum(C.funds, 0) + gain, 0, 999999);
    F.cashRaised = _csfLedger(_csfNum(F.cashRaised, 0) + gain, _csfNum((_csfCfg().ledgerCaps || {}).cashRaised, 99999));
    F.debtBurden = _csfLedger(_csfNum(F.debtBurden, 0) + _csfNum(inst.debtPressure, 0) * repeat, 100);
    F.cottonPledged = _csfLedger(_csfNum(F.cottonPledged, 0) + _csfNum(inst.cottonPledged, 0) * repeat, 100);
    F.impressmentPressure = _csfLedger(_csfNum(F.impressmentPressure, 0) + _csfNum(inst.impressmentPressure, 0) * repeat, 100);
    F.civilianPressure = _csfLedger(_csfNum(F.civilianPressure, 0) + _csfNum(inst.civilianPressure, 0) * repeat, 100);
    F.creditIndex = _csfLedger(_csfNum(F.creditIndex, 72) - _csfNum(inst.creditDamage, 0) * repeat - (snap0.pressure >= 70 ? 2 : 0), 100);
    inflationNudge = _csfNum(inst.inflationPressure, 0) * repeat;
    if (C.economy) {
      C.economy.inflation = _csfClamp(_csfNum(C.economy.inflation, 1) * (1 + inflationNudge / 100), 1, 200);
      if (inst.id === "printing-spiral") C.economy.hiPrintTurns = _csfClamp(_csfNum(C.economy.hiPrintTurns, 0) + 1, 0, 999);
    }
    if (C.clock) {
      capitalCost = _csfNum(inst.capitalCost, 0);
      C.clock.capital = _csfClamp(_csfNum(C.clock.capital, 0) - capitalCost, 0, 999999);
      C.clock.weariness = _csfClamp(_csfNum(C.clock.weariness, 0) + _csfNum(inst.civilianPressure, 0) / 8 + inflationNudge / 3, 0, 100);
    }
    if (inst.oneShot) F.used[inst.id] = true;
  }
  var snap = csFinanceSnapshot(C);
  F.lastTurn = {
    year: snap.year,
    active: active,
    priority: active && inst ? inst.id : null,
    pressure: snap.pressure,
    fundsRaised: gain,
    inflationNudgePct: Math.round(inflationNudge * 10) / 10,
    creditIndex: snap.creditIndex,
    capitalCost: capitalCost,
    repeatFactor: repeat
  };
  var line = active && inst
    ? inst.shortLabel + ": +" + gain + " funds, " + snap.pressure + " finance pressure."
    : snap.word + ": Confederate finance pressure " + snap.pressure + ".";
  logPush(F, "log", line, 6);
}

function _csfInstrumentCard(inst, snap, F) {
  if (!inst) return "";
  var selected = F && F.active && F.priority === inst.id && snap.side === "CS";
  var used = F && F.used && F.used[inst.id] === true;
  var disabled = snap.side !== "CS";
  var state = selected ? "Active" : (used && inst.oneShot ? "Spent" : "Available");
  var border = selected ? "var(--brass-lt,#c9a85f)" : "var(--rule)";
  return '<div style="flex:1 1 215px;min-width:200px;border:1px solid ' + border + ';border-radius:5px;padding:8px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">'
    + '<div><b>' + htmlEsc(inst.label || inst.id) + '</b><div style="font-size:11px;opacity:.68">Unlocks ' + htmlEsc(inst.unlockYear || 1861) + ' &middot; ' + htmlEsc(state) + '</div></div>'
    + '<span style="font-size:10px;border:1px solid var(--rule);border-radius:999px;padding:1px 6px">' + (inst.oneShot ? 'one shot' : 'repeat') + '</span>'
    + '</div>'
    + '<div style="font-size:11px;line-height:1.4;margin-top:5px;opacity:.82">' + htmlEsc(inst.summary || '') + '</div>'
    + '<div style="font-size:11px;line-height:1.4;margin-top:5px;opacity:.72">' + htmlEsc(inst.playerTradeoff || '') + '</div>'
    + '<button type="button" class="upg" data-csfpriority="' + htmlEsc(inst.id) + '" aria-pressed="' + (selected ? 'true' : 'false') + '" '
    + (disabled ? 'disabled ' : '') + 'style="margin-top:7px;padding:4px 8px">' + (selected ? 'Priority active' : 'Prioritize') + '</button>'
    + '</div>';
}

function presCsFinanceBlock(C) {
  if (!C || _csfSide(C) !== "CS") return "";
  var F = csFinanceInit(C), snap = csFinanceSnapshot(C), D = _csfData();
  var profile = D.profile || {}, on = !!(F && F.active && F.priority);
  var list = _csfInstruments(), cards = "";
  for (var i = 0; i < list.length; i++) cards += _csfInstrumentCard(list[i], snap, F);
  var debates = D.debates || [], debateHTML = "";
  for (var d = 0; d < debates.length; d++) {
    if (debates[d]) debateHTML += '<div style="margin-top:4px"><b>' + htmlEsc(debates[d].title) + ':</b> ' + htmlEsc(debates[d].summary) + '</div>';
  }
  var log = "";
  if (F.log && F.log.length) {
    for (var j = 0; j < F.log.length && j < 3; j++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(F.log[j]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Confederate Finance Toolkit</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:650px">Erlanger loan, cotton bonds, produce loan, impressment, and the printing spiral as state capacity under stress.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.pressure + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (on ? 'Finance priority active: ' + htmlEsc(snap.priorityLabel) : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _csfMeter('Printing share', snap.printingShare, true)
    + _csfMeter('Inflation spiral', snap.inflationScore, true)
    + _csfMeter('Credit window', snap.creditIndex, false)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _csfMeter('Cotton pledged', snap.cottonPledged, true)
    + _csfMeter('Impressment pressure', snap.impressmentPressure, true)
    + _csfMeter('Procurement capacity', snap.procurement, false)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || 'Confederate finance') + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Ledger: <b>' + snap.cashRaised + '</b> funds raised, <b>' + snap.debtBurden
    + '</b> debt burden, <b>' + snap.civilianPressure + '</b> civilian price pressure.</div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:9px">' + cards + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="font-size:12px"><b>Capped bridge contract</b><div style="opacity:.72">An active finance priority can buy supply, but it can also cost morale or fatigue. It never writes winners, casualties, OOB, or a direct overall bonus.</div></div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">Caps: +' + _csfNum((_csfCfg().bridgeCaps || {}).supply, 3)
    + ' supply, -' + _csfNum((_csfCfg().bridgeCaps || {}).moraleCost, 2) + ' morale, +' + _csfNum((_csfCfg().bridgeCaps || {}).fatigueCost, 2)
    + ' fatigue, and +' + _csfNum((_csfCfg().bridgeCaps || {}).overall, 0) + ' direct overall. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + debateHTML
    + '<div style="margin-top:4px">Evidence is consolidated in data/economy.json, data/diplomacy.json, HISTORICAL-DATA-ECONOMY.md, and HISTORICAL-DATA-DIPLOMACY.md. The Erlanger net-proceeds correction uses the later audit: roughly 45% of face, not the stale 72% figure.</div>'
    + '</details>'
    + '</div>';
}

function csFinanceWireOverview(C) {
  if (!C) return;
  var btns = document.querySelectorAll('[data-csfpriority]');
  for (var i = 0; i < btns.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-csfpriority");
        var F = csFinanceInit(C);
        if (F && F.active && F.priority === id) csFinanceSetPriority(C, null);
        else csFinanceSetPriority(C, id);
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(btns[i]);
  }
}
