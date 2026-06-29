/* ===========================================================================
   Phase F · 61-logistics-rail.js — Strategic rail and supply network.

   Bounded D159 scope: rail/supply feels like the arteries of the war without
   adding a campaign map. The module READS existing production, engineering,
   blockade, War Room, and battle-chain state; renders a War Effort readout; and
   contributes a capped bridge bonus ONLY when the player explicitly prioritizes
   railheads. Inactive/default returns exact zero bridge adjustments.
   =========================================================================== */

function _lgNum(v, d) {
  v = Number(v);
  return isFinite(v) ? v : (typeof d === "number" ? d : 0);
}

function _lgClamp(v, lo, hi) {
  v = _lgNum(v, lo);
  return v < lo ? lo : (v > hi ? hi : v);
}

function _lgRound(v) { return Math.round(_lgNum(v, 0)); }

function _lgData() {
  return gameData("logistics-rail") || {};
}

function _lgCfg() {
  var D = _lgData();
  return D.config || {};
}

function _lgProfile(side) {
  var D = _lgData(), p = D.profiles || {};
  return p[side === "CS" ? "CS" : "US"] || {};
}

function _lgNode(C, k) {
  return (C && C.warroom && C.warroom.nodes && typeof C.warroom.nodes[k] === "number") ? C.warroom.nodes[k] : 0;
}

function _lgBattle(C) {
  if (typeof _brgNextBattle === "function") return _brgNextBattle(C);
  try {
    if (typeof CHAINS === "undefined" || typeof BATTLES === "undefined" || !C) return null;
    var chain = CHAINS[C.side]; if (!chain) return null;
    var id = chain[C.idx]; if (!id) return null;
    return BATTLES.find(function (b) { return b.id === id; }) || null;
  } catch (e) { return null; }
}

function _lgRoute(C, bd) {
  var D = _lgData(), routes = D.routes || {}, theaters = D.theaters || {};
  var th = (bd && bd.th) || "E";
  var r = (bd && routes[bd.id]) ? routes[bd.id] : null;
  var t = theaters[(r && r.theater) || th] || {};
  var side = (C && C.side === "CS") ? "CS" : "US";
  var rf = (r && r.friction && typeof r.friction[side] === "number") ? r.friction[side]
    : (t.routeFriction && typeof t.routeFriction[side] === "number") ? t.routeFriction[side] : (side === "CS" ? 16 : 10);
  return {
    id: bd ? bd.id : "",
    label: (r && r.label) || (bd ? bd.name + " railheads" : "Next army railheads"),
    theater: (r && r.theater) || th,
    theaterName: t.name || th,
    friction: rf,
    note: t.note || ""
  };
}

function _lgWord(v) {
  v = _lgClamp(v, 0, 100);
  if (v >= 80) return ["Open arteries", "#6f9e5a"];
  if (v >= 62) return ["Working network", "#8f9853"];
  if (v >= 44) return ["Strained corridors", "#b8863b"];
  return ["Starved railheads", "#c9712e"];
}

function _lgMeter(label, v, lowerBetter) {
  v = _lgClamp(v, 0, 100);
  var score = lowerBetter ? 100 - v : v;
  var w = _lgWord(score);
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px"><span style="opacity:.82">' + htmlEsc(label)
    + '</span><span style="font-weight:bold;color:' + w[1] + '">' + _lgRound(v) + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + _lgRound(v) + '%;background:' + w[1] + '"></div></div></div>';
}

function logisticsInit(C) {
  if (!C) return null;
  if (!C.logistics || typeof C.logistics !== "object" || Array.isArray(C.logistics)) C.logistics = {};
  var L = C.logistics;
  L.schema = "cw_logistics_rail_v1";
  if (L.active !== true) L.active = false;
  if (L.priority !== "railheads") L.priority = L.active ? "railheads" : null;
  if (!Array.isArray(L.log)) L.log = [];
  if (L.log.length > 5) L.log.length = 5;
  if (L.lastTurn && (typeof L.lastTurn !== "object" || Array.isArray(L.lastTurn))) L.lastTurn = null;
  if (L.lastBridge && (typeof L.lastBridge !== "object" || Array.isArray(L.lastBridge))) L.lastBridge = null;
  return L;
}

function logisticsSnapshot(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var D = _lgData(), cfg = _lgCfg(), w = cfg.networkWeights || {};
  var p = _lgProfile(side), pr = (C && C.production) || {}, bl = (C && C.blockade) || {}, wr = (C && C.warroom) || {};
  var bd = _lgBattle(C), route = _lgRoute(C, bd);
  var rail = (typeof pr.railIntegrity === "number") ? pr.railIntegrity : _lgNum(p.startingRailIndex, side === "CS" ? 52 : 96);
  var food = (typeof pr.foodDist === "number") ? pr.foodDist * 100 : (side === "CS" ? 45 : 85);
  var imports = (side === "CS") ? _lgClamp(_lgNum(bl.importFactor, 0.62) * 100, 0, 100) : 100;
  var supply = (typeof wr.supply === "number") ? wr.supply : 50;
  var railNode = _lgNode(C, "rail"), depotNode = _lgNode(C, "depot"), provisionsNode = _lgNode(C, "provisions");
  var nodeReach = _lgClamp(42 + railNode * 7 + depotNode * 6 + provisionsNode * 4, 0, 100);
  var construction = (typeof engBranchBoost === "function") ? engBranchBoost(C, "construction") : 0;
  var pontoons = (typeof engBranchBoost === "function") ? engBranchBoost(C, "pontoons") : 0;
  var repair = _lgClamp(50 + construction * 5, 0, 100);
  var gauge = _lgNum(p.gaugeBreakPenalty, 0), fragmentation = _lgNum(p.fragmentationPenalty, 0);
  var network = rail * _lgNum(w.rail, 0.30)
    + supply * _lgNum(w.supply, 0.18)
    + food * _lgNum(w.food, 0.14)
    + imports * _lgNum(w.imports, 0.12)
    + nodeReach * _lgNum(w.nodes, 0.14)
    + repair * _lgNum(w.engineering, 0.12)
    - route.friction - gauge * 0.35 - fragmentation * 0.35;
  network = _lgClamp(network, 0, 100);
  var depotReach = _lgClamp(supply * 0.38 + rail * 0.25 + nodeReach * 0.22 + repair * 0.12 + food * 0.10 - route.friction * 0.35 - gauge * 0.15, 0, 100);
  var marchBurden = _lgClamp(18 + route.friction + (100 - network) * 0.18 + (100 - depotReach) * 0.08 - pontoons * 1.5, 0, 100);
  var artery = _lgClamp((network + depotReach + (100 - marchBurden)) / 3, 0, 100);
  var word = _lgWord(network);
  return {
    side: side,
    battleId: bd ? bd.id : "",
    battleName: bd ? bd.name : "Next engagement",
    routeLabel: route.label,
    theater: route.theater,
    theaterName: route.theaterName,
    routeFriction: _lgRound(route.friction),
    railIntegrity: _lgRound(rail),
    foodDistribution: _lgRound(food),
    importReach: _lgRound(imports),
    warSupply: _lgRound(supply),
    nodeReach: _lgRound(nodeReach),
    engineeringRepair: _lgRound(repair),
    depotReach: _lgRound(depotReach),
    marchBurden: _lgRound(marchBurden),
    network: _lgRound(network),
    arteryIndex: _lgRound(artery),
    status: word[0],
    color: word[1],
    note: route.note || "",
    profileName: p.name || side
  };
}

function logisticsBridgeBonus(C) {
  var L = logisticsInit(C);
  var snap = logisticsSnapshot(C);
  var active = !!(L && L.active === true && L.priority === "railheads");
  var out = {
    active: active,
    priority: active ? "railheads" : null,
    supply: 0,
    fatigue: 0,
    fatigueRelief: 0,
    overall: 0,
    index: snap ? snap.arteryIndex : 0,
    network: snap ? snap.network : 0,
    route: snap ? snap.routeLabel : "",
    capped: true
  };
  if (active && snap) {
    var caps = (_lgCfg().bridgeCaps || {});
    var capSupply = _lgNum(caps.supply, 7), capFatigue = _lgNum(caps.fatigueRelief, 5), capOverall = _lgNum(caps.overall, 2);
    var supply = _lgClamp((snap.depotReach - 45) / 8, 0, capSupply);
    var fatigueRelief = _lgClamp((snap.network - 48) / 12 + (100 - snap.marchBurden) / 35, 0, capFatigue);
    var overall = _lgClamp((supply + fatigueRelief) / 5, 0, capOverall);
    out.supply = _lgRound(supply);
    out.fatigueRelief = _lgRound(fatigueRelief);
    out.fatigue = -out.fatigueRelief;
    out.overall = _lgRound(overall);
  }
  if (L) L.lastBridge = out;
  return out;
}

function logisticsSetPriority(C, priority) {
  var L = logisticsInit(C);
  if (!L) return null;
  if (priority === "railheads" || priority === true) {
    L.active = true;
    L.priority = "railheads";
  } else {
    L.active = false;
    L.priority = null;
  }
  L.lastBridge = logisticsBridgeBonus(C);
  if (typeof saveLocal === "function") saveLocal();
  return L;
}

function logisticsOnResolve(winnerSide, type, B, C, win) {
  var L = logisticsInit(C);
  if (!L) return;
  var snap = logisticsSnapshot(C);
  L.lastTurn = snap;
  var line = snap.status + ": " + snap.routeLabel + " (" + snap.network + " network, " + snap.depotReach + " depot reach).";
  logPush(L, "log", line, 5);
}

function presLogisticsBlock(C) {
  if (!C) return "";
  var L = logisticsInit(C), snap = logisticsSnapshot(C), D = _lgData(), p = _lgProfile(snap.side);
  var on = !!(L && L.active && L.priority === "railheads");
  var w = _lgWord(snap.network);
  var profileFact = snap.side === "CS"
    ? "Confederate rails begin with fewer miles, far less rolling stock, gauge breaks, and no wartime rail-iron replacement at scale."
    : "Union rails begin with most track, rolling stock, shops, and the USMRR/Haupt repair machinery.";
  var bm = (D.benchmarks && D.benchmarks.length) ? D.benchmarks[0] : null;
  var debate = (D.debates && D.debates.length) ? D.debates[1] || D.debates[0] : null;
  var log = "";
  if (L.log && L.log.length) {
    for (var i = 0; i < L.log.length && i < 3; i++) log += '<div style="font-size:11px;opacity:.72;padding:1px 0">&bull; ' + htmlEsc(L.log[i]) + '</div>';
  }
  return ''
    + '<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">'
    + '<div><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">Rail &amp; Supply Network</div>'
    + '<div style="font-size:12px;opacity:.72;max-width:620px">No campaign map yet: this is the artery readout feeding the existing army bridge.</div></div>'
    + '<div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:' + w[1] + '">' + snap.network + ' &middot; ' + htmlEsc(w[0]) + '</div>'
    + '<div style="font-size:11px;opacity:.7">' + (on ? 'Railhead priority active' : 'Inactive: bridge input is zero') + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:8px">'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _lgMeter('Railroad integrity', snap.railIntegrity, false)
    + _lgMeter('Depot reach', snap.depotReach, false)
    + _lgMeter('Food distribution', snap.foodDistribution, false)
    + '</div>'
    + '<div style="flex:1 1 230px;min-width:210px">'
    + _lgMeter('Import reach', snap.importReach, false)
    + _lgMeter('March burden (lower is better)', snap.marchBurden, true)
    + _lgMeter('Rail artery index', snap.arteryIndex, false)
    + '</div>'
    + '</div>'
    + '<div style="margin-top:8px;padding:8px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">'
    + '<div style="font-size:12px"><b>' + htmlEsc(snap.routeLabel) + '</b><div style="opacity:.72">' + htmlEsc(snap.theaterName) + ' &middot; ' + htmlEsc(profileFact) + '</div></div>'
    + '<button id="lgToggleRailheads" type="button" class="upg" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? 'Railheads prioritized &check;' : 'Prioritize railheads') + '</button>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.68;margin-top:6px">When active, this can add at most +' + _lgNum((_lgCfg().bridgeCaps || {}).supply, 7)
    + ' supply, -' + _lgNum((_lgCfg().bridgeCaps || {}).fatigueRelief, 5) + ' fatigue, and +' + _lgNum((_lgCfg().bridgeCaps || {}).overall, 2)
    + ' overall. When inactive it returns exact zero.</div>'
    + '</div>'
    + (log ? '<div style="margin-top:8px">' + log + '</div>' : '')
    + '<details style="margin-top:8px;font-size:11px;opacity:.78"><summary style="cursor:pointer">Sources and teaching note</summary>'
    + '<div style="margin-top:4px;line-height:1.45">' + htmlEsc(p.teaching || profileFact) + '</div>'
    + (bm ? '<div style="margin-top:4px"><b>' + htmlEsc(bm.label) + ':</b> ' + htmlEsc(bm.lesson) + '</div>' : '')
    + (debate ? '<div style="margin-top:4px"><b>' + htmlEsc(debate.title) + ':</b> ' + htmlEsc(debate.summary) + '</div>' : '')
    + '<div style="margin-top:4px">Evidence is consolidated in HISTORICAL-DATA-ECONOMY.md: rail mileage, rolling stock, USMRR/Haupt repair, Confederate rail-iron collapse, gauge/transfer friction, and Chattanooga/Longstreet benchmarks.</div>'
    + '</details>'
    + '</div>';
}

function logisticsWireOverview(C) {
  var b = document.getElementById("lgToggleRailheads");
  if (!b || !C) return;
  b.addEventListener("click", function () {
    var L = logisticsInit(C);
    logisticsSetPriority(C, !(L && L.active && L.priority === "railheads"));
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
