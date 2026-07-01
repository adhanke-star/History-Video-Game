/* ===========================================================================
   Phase F/G · 66-under-told-perspectives.js — Under-told perspectives.

   Bounded D178 scope: the remaining D34.1 perspective threads become a War
   Effort teaching/system surface. Women in the war stays the separate D153 lane.
   Default bridge input is exact zero; the explicit perspective-liaison priority
   is capped and costly, with no battle output or Soldier's Story replacement.
   =========================================================================== */

function _utpNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _utpClamp(v, lo, hi) {
  v = _utpNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _utpRound(v) { return Math.round(_utpNum(v, 0)); }
function _utpData() { return gameData("under-told-perspectives") || {}; }
function _utpCfg() { var D = _utpData(); return D.config || {}; }

function _utpProfile(side) {
  var D = _utpData(), p = D.profiles || {};
  return p[side === "CS" ? "CS" : "US"] || {};
}

function _utpYear(C, B) {
  if (B && B.bd && typeof B.bd.year === "number") return B.bd.year;
  if (C && C.clock && typeof C.clock.year === "number") return C.clock.year;
  if (C && C.president && C.president.date && typeof C.president.date.year === "number") return C.president.date.year;
  return campaignYear(C);
}

function _utpThreadBag(v) {
  var keys = ["enslavedAgency", "immigrantEthnic", "nativeNations", "womenLane"];
  var out = {};
  for (var i = 0; i < keys.length; i++) out[keys[i]] = 0;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (var j = 0; j < keys.length; j++) out[keys[j]] = _utpClamp(v[keys[j]], 0, 999999);
  }
  return out;
}

function underToldInit(C) {
  if (!C) return null;
  if (!C.underTold || typeof C.underTold !== "object" || Array.isArray(C.underTold)) C.underTold = {};
  var U = C.underTold;
  U.schema = "cw_under_told_perspectives_v1";
  if (U.active !== true) U.active = false;
  if (U.priority !== "perspectiveLiaison") U.priority = U.active ? "perspectiveLiaison" : null;
  U.covered = _utpThreadBag(U.covered);
  U.omitted = _utpThreadBag(U.omitted);
  U.liaisonContacts = _utpThreadBag(U.liaisonContacts);
  if (!Array.isArray(U.log)) U.log = [];
  if (U.log.length > 6) U.log.length = 6;
  if (U.lastTurn && (typeof U.lastTurn !== "object" || Array.isArray(U.lastTurn))) U.lastTurn = null;
  if (U.lastBridge && (typeof U.lastBridge !== "object" || Array.isArray(U.lastBridge))) U.lastBridge = null;
  return U;
}

function _utpNextBattle(C) {
  if (typeof _brgNextBattle === "function") return _brgNextBattle(C);
  return null;
}

function _utpIsWestern(bd) {
  if (!bd || !bd.id) return false;
  return /shiloh|vicksburg|chickamauga|franklin|nashville|atlanta|chattanooga/i.test(bd.id);
}

function _utpEmancipationActive(C, year) {
  var em = C && C.president && C.president.emancipation;
  return !!(em && em.issued) || year >= 1863;
}

function _utpWord(v) {
  v = _utpClamp(v, 0, 100);
  if (v >= 78) return ["Voices centered", "#6f9e5a"];
  if (v >= 58) return ["Threaded in", "#b8863b"];
  if (v >= 36) return ["Partly visible", "#c9712e"];
  return ["Omitted", "#d07060"];
}

function _utpMeter(label, v, lowerBetter) {
  v = _utpClamp(v, 0, 100);
  var color = lowerBetter ? _utpWord(100 - v)[1] : _utpWord(v)[1];
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + color + '">' + _utpRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _utpRound(v) + '%;background:' + color + '"></div></div></div>';
}

function underToldSnapshot(C) {
  var U = underToldInit(C);
  var side = (C && C.side === "CS") ? "CS" : "US";
  var year = _utpYear(C, null);
  var bd = _utpNextBattle(C);
  var w = (_utpCfg().pressureWeights || {});
  var emancipation = _utpEmancipationActive(C, year);
  var mpStrength = C && C.manpower && typeof C.manpower.strength === "number" ? C.manpower.strength : (side === "CS" ? 80 : 95);
  var weary = C && C.clock && typeof C.clock.weariness === "number" ? C.clock.weariness : 30;
  var press = 50;
  if (typeof pressCompute === "function") {
    try { press = pressCompute(C).public || 50; } catch (e) { press = 50; }
  }
  var irregular = 0;
  if (typeof irregularWarSnapshot === "function") {
    try { irregular = irregularWarSnapshot(C).pressure || 0; } catch (e2) { irregular = 0; }
  }
  var womenLane = 0;
  try {
    var W = gameData("women-in-war");
    womenLane = W && Array.isArray(W.records) && W.records.length >= 9 ? 100 : 0;
  } catch (e3) { womenLane = 0; }
  var yearScore = year >= 1864 ? 74 : (year >= 1863 ? 64 : 32);
  var westScore = _utpIsWestern(bd) ? 62 : 28;
  var omissionPressure = 22
    + yearScore * _utpNum(w.year, 0.18)
    + (emancipation ? 100 : 35) * _utpNum(w.emancipation, 0.18)
    + (100 - mpStrength) * _utpNum(w.manpower, 0.14)
    + weary * _utpNum(w.warWeariness, 0.12)
    + westScore * _utpNum(w.west, 0.12)
    + (100 - press) * _utpNum(w.press, 0.10)
    + irregular * _utpNum(w.irregularWar, 0.10)
    + womenLane * _utpNum(w.womenLane, -0.08);
  if (U && U.active) omissionPressure -= 8;
  omissionPressure = _utpClamp(omissionPressure, 0, 100);
  var coveredTotal = 0, omittedTotal = 0, contactsTotal = 0;
  if (U) {
    coveredTotal = U.covered.enslavedAgency + U.covered.immigrantEthnic + U.covered.nativeNations + U.covered.womenLane;
    omittedTotal = U.omitted.enslavedAgency + U.omitted.immigrantEthnic + U.omitted.nativeNations + U.omitted.womenLane;
    contactsTotal = U.liaisonContacts.enslavedAgency + U.liaisonContacts.immigrantEthnic + U.liaisonContacts.nativeNations + U.liaisonContacts.womenLane;
  }
  var coverageIndex = _utpClamp(28 + coveredTotal / 45 + contactsTotal / 30 + (womenLane ? 12 : 0) - omittedTotal / 85, 0, 100);
  var agencyIndex = _utpClamp(30 + coverageIndex * 0.42 + (emancipation ? 16 : 0) + (side === "US" ? 10 : -4), 0, 100);
  var immigrantVisibility = _utpClamp(24 + (C && C.command && C.command.active === "sigel" ? 12 : 0) + coveredTotal / 70 + (side === "US" ? 16 : 2), 0, 100);
  var nativeVisibility = _utpClamp(18 + U.liaisonContacts.nativeNations / 16 + (_utpIsWestern(bd) ? 15 : 0), 0, 100);
  var word = _utpWord(coverageIndex);
  return {
    side: side,
    year: year,
    battleId: bd ? bd.id : "",
    battleName: bd ? bd.name : "Next engagement",
    active: !!(U && U.active),
    emancipation: emancipation,
    womenLane: womenLane,
    omissionPressure: _utpRound(omissionPressure),
    coverageIndex: _utpRound(coverageIndex),
    agencyIndex: _utpRound(agencyIndex),
    immigrantVisibility: _utpRound(immigrantVisibility),
    nativeVisibility: _utpRound(nativeVisibility),
    coveredTotal: _utpRound(coveredTotal),
    omittedTotal: _utpRound(omittedTotal),
    contactsTotal: _utpRound(contactsTotal),
    word: word[0],
    color: word[1]
  };
}

function underToldBridgeBonus(C) {
  var U = underToldInit(C);
  var snap = underToldSnapshot(C);
  var active = !!(U && U.active === true && U.priority === "perspectiveLiaison");
  var out = {
    active: active,
    priority: active ? "perspectiveLiaison" : null,
    morale: 0,
    supply: 0,
    fatigue: 0,
    overall: 0,
    coverageIndex: snap ? snap.coverageIndex : 0,
    omissionPressure: snap ? snap.omissionPressure : 0,
    capped: true
  };
  if (active && snap) {
    var caps = (_utpCfg().bridgeCaps || {});
    out.morale = _utpRound(_utpClamp(0.55 + snap.coverageIndex / 140, 0, _utpNum(caps.morale, 1)));
    out.supply = -_utpRound(_utpClamp(1, 0, _utpNum(caps.supplyCost, 1)));
    out.fatigue = _utpRound(_utpClamp(snap.omissionPressure / 120, 0, _utpNum(caps.fatigueCost, 1)));
    out.overall = _utpRound(_utpClamp(0, 0, _utpNum(caps.overall, 0)));
  }
  if (U) U.lastBridge = out;
  return out;
}

function underToldSetPriority(C, priority) {
  var U = underToldInit(C);
  if (!U) return null;
  if (priority === "perspectiveLiaison" || priority === true) {
    U.active = true;
    U.priority = "perspectiveLiaison";
  } else {
    U.active = false;
    U.priority = null;
  }
  U.lastBridge = underToldBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return U;
}

function underToldOnResolve(winnerSide, type, B, C, win) {
  var U = underToldInit(C);
  if (!U) return;
  var snap0 = underToldSnapshot(C);
  var cfg = _utpCfg(), mit = cfg.mitigation || {};
  var active = U.active === true && U.priority === "perspectiveLiaison";
  var omissionBase = 5 + snap0.omissionPressure * 0.38 + (snap0.year >= 1863 ? 4 : 1);
  var omission = omissionBase;
  var coverage = active ? _utpNum(mit.coverageBoost, 14) : 2;
  var contacts = active ? Math.round(_utpClamp(snap0.omissionPressure, 0, 100) * _utpNum(mit.liaisonFactor, 9) / 100) : 1;
  if (active) {
    omission *= 1 - _utpClamp(_utpNum(mit.omissionReduction, 0.26), 0, 0.75);
    if (C && C.clock) C.clock.capital = _utpClamp(_utpNum(C.clock.capital, 0) - _utpNum(mit.capitalCost, 1), 0, 999999);
  }
  var omitted = Math.round(omission);
  var covered = Math.round(coverage);
  var liaison = Math.max(0, contacts);
  U.omitted.enslavedAgency = _utpClamp(U.omitted.enslavedAgency + omitted, 0, 999999);
  U.omitted.immigrantEthnic = _utpClamp(U.omitted.immigrantEthnic + Math.round(omitted * 0.75), 0, 999999);
  U.omitted.nativeNations = _utpClamp(U.omitted.nativeNations + Math.round(omitted * (snap0.nativeVisibility < 35 ? 1.2 : 0.8)), 0, 999999);
  U.covered.enslavedAgency = _utpClamp(U.covered.enslavedAgency + covered + (snap0.emancipation ? 4 : 0), 0, 999999);
  U.covered.immigrantEthnic = _utpClamp(U.covered.immigrantEthnic + covered, 0, 999999);
  U.covered.nativeNations = _utpClamp(U.covered.nativeNations + Math.max(1, Math.round(covered * 0.65)), 0, 999999);
  U.covered.womenLane = _utpClamp(U.covered.womenLane + (snap0.womenLane ? 2 : 0), 0, 999999);
  U.liaisonContacts.enslavedAgency = _utpClamp(U.liaisonContacts.enslavedAgency + liaison, 0, 999999);
  U.liaisonContacts.immigrantEthnic = _utpClamp(U.liaisonContacts.immigrantEthnic + Math.max(0, liaison - 1), 0, 999999);
  U.liaisonContacts.nativeNations = _utpClamp(U.liaisonContacts.nativeNations + Math.max(0, Math.round(liaison * 0.75)), 0, 999999);
  var snap = underToldSnapshot(C);
  U.lastTurn = {
    year: snap.year,
    omissionPressure: snap.omissionPressure,
    coveredAdded: covered,
    omittedAdded: omitted,
    liaisonContacts: liaison,
    active: active
  };
  logPush(U, "log", snap.word + ": " + snap.coveredTotal + " coverage, " + snap.omittedTotal + " omissions.");
}

function presUnderToldBlock(C) {
  if (!C) return "";
  var U = underToldInit(C), snap = underToldSnapshot(C), D = _utpData();
  var profile = _utpProfile(snap.side), on = !!(U && U.active && U.priority === "perspectiveLiaison");
  var threads = D.threads || [], debates = D.debates || [];
  var enslaved = threads[0] || null, immigrants = threads[1] || null, nativeThread = threads[2] || null, women = threads[3] || null;
  var agencyDebate = debates[0] || null, nativeDebate = debates[3] || null;
  var log = "";
  if (U.log && U.log.length) {
    for (var i = 0; i < U.log.length && i < 3; i++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(U.log[i]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Under-Told Perspectives</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:650px">Enslaved agency, immigrant and ethnic units, Native nations, and the separate D153 women lane woven in without tokenizing people.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + snap.color + '">' + snap.coverageIndex + ' &middot; ' + htmlEsc(snap.word) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (on ? 'Perspective-liaison priority active' : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _utpMeter('Coverage index', snap.coverageIndex, false)
    + _utpMeter('Omission pressure', snap.omissionPressure, true)
    + _utpMeter('Enslaved agency visibility', snap.agencyIndex, false)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _utpMeter('Immigrant-unit visibility', snap.immigrantVisibility, false)
    + _utpMeter('Native-nations visibility', snap.nativeVisibility, false)
    + _utpMeter('D153 women lane coverage', snap.womenLane, false)
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px;line-height:1.45;margin-top:7px;opacity:.78">'
    + '<b>' + htmlEsc(profile.name || snap.side) + ':</b> ' + htmlEsc(profile.summary || '')
    + '<div style="margin-top:4px">Ledger: <b>' + snap.coveredTotal + '</b> coverage, <b>' + snap.omittedTotal
    + '</b> omissions, <b>' + snap.contactsTotal + '</b> liaison contacts. Women in the war stays the D153 card lane.</div>'
    + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'
    + '<div style="font-size:12px"><b>Fund perspective-liaison work</b><div style="opacity:.72">Pay for scouts, guides, interpreters, immigrant outreach, and Native/diplomatic liaison. It improves morale modestly but costs supply, tempo, and capital.</div></div>'
    + '<button id="utpToggleLiaison" type="button" class="upg" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? 'Liaison active &check;' : 'Fund liaison') + '</button>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">When active, this can add at most +' + _utpNum((_utpCfg().bridgeCaps || {}).morale, 1)
    + ' morale, cost ' + _utpNum((_utpCfg().bridgeCaps || {}).supplyCost, 1) + ' supply, add +' + _utpNum((_utpCfg().bridgeCaps || {}).fatigueCost, 1)
    + ' fatigue, and adds no direct overall bonus. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(profile.teaching || '') + '</div>'
    + (enslaved ? '<div style="margin-top:4px"><b>' + htmlEsc(enslaved.label) + ':</b> ' + htmlEsc(enslaved.summary) + '</div>' : '')
    + (immigrants ? '<div style="margin-top:4px"><b>' + htmlEsc(immigrants.label) + ':</b> ' + htmlEsc(immigrants.summary) + '</div>' : '')
    + (nativeThread ? '<div style="margin-top:4px"><b>' + htmlEsc(nativeThread.label) + ':</b> ' + htmlEsc(nativeThread.summary) + '</div>' : '')
    + (women ? '<div style="margin-top:4px"><b>' + htmlEsc(women.label) + ':</b> ' + htmlEsc(women.summary) + '</div>' : '')
    + (agencyDebate ? '<div style="margin-top:4px"><b>' + htmlEsc(agencyDebate.title) + ':</b> ' + htmlEsc(agencyDebate.summary) + '</div>' : '')
    + (nativeDebate ? '<div style="margin-top:4px"><b>' + htmlEsc(nativeDebate.title) + ':</b> ' + htmlEsc(nativeDebate.summary) + '</div>' : '')
    + '<div style="margin-top:4px">Evidence is consolidated from the existing manpower, codex, women-in-war, Chancellorsville, decision-card, and M4 Native dossier source trails. Native nations are now source-anchored but still narrow; this is not a playable Trans-Mississippi battle or OOB pass.</div>'
    + '</details>'
    + '</div>';
}

function underToldWireOverview(C) {
  var b = document.getElementById("utpToggleLiaison");
  if (!b || !C) return;
  b.addEventListener("click", function () {
    var U = underToldInit(C);
    underToldSetPriority(C, !(U && U.active && U.priority === "perspectiveLiaison"));
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
