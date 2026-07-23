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

/* --- LANE-022 Slices 1-2 (D538/D539 trace, D540 receipts and cuts) + Slice 3 (D542 repair) ---
   A guarded seam. Every carrier that does not declare an exact conquest
   campaign kind takes none of this and gets the shipped static route with its
   object untouched, so the capped bridge, the troop-morale weight, camp and
   loot stay byte-identical in every shipped campaign. A conquest carrier on the
   open ruleset gains ONE extra derived field holding a real path across the
   read-only 36-territory board; the identical query on the gated ruleset fails
   CLOSED at the allowlist below and gains nothing, because five research passes
   established no physical service period for that side. The board and the
   transport evidence are READ here, never written and never namespace-shared.

   Slice 2 turns territory control and per-segment service condition into real
   state and lets supply BITE: a base walk over the full open projection and a
   live walk filtered by cuts and control resolve into three bounded states.
   TRACED and SEVERED set `applied` true, so the derived friction replaces the
   shipped static number and `depotReach` falls for every army downstream of a
   cut. SUBSTRATE_GAP does NOT: when no sourced service links the pair at all,
   the shortfall is OUR evidence gap rather than anything the player did, and
   wagons in fact carried such routes throughout the war, so the shipped number
   stands and the reason is taught instead. Penalising a player for a hole in
   our own sources would invent the history backwards and is exactly the output
   gate the no-fudge law forbids.

   Slice 3 makes repair cost time and FINITE engineering capacity. Clearing a cut
   runs through the shipped conquestSupplySetCondition and now consults a pure
   capacity reader over the Engineering Corps levels, scaled by the B-5 realism
   lever, plus a per-pass ledger; a repair the corps cannot afford this pass, or
   lacks the branch for, is REFUSED so the cut stands. That is the standing decision
   finite capacity forces: which artery do you restore, or accept the longer water
   route? The capacity/repair state is control-class and stays out of the CF-2 memo,
   rides the existing save envelope, and fails closed on the gated ruleset like the
   rest of the seam.
   ------------------------------------------------------------------------ */

var _LG_TRACE_RULESETS = { mayhem: 1 };                                            // LANE022_CONTAINMENT_ALLOWLIST
var _LG_TRACE_DEPOT = { US: "CT-01", CS: "CT-05" };                                // authored, not sourced
var _LG_TRACE_FRONT = { E: "CT-03", W: "CT-20", TM: "CT-32", N: "CT-19" };         // authored, not sourced
var _LG_TRACE_COST = { "inland-water": 2, rail: 3, sea: 4, road: 6 };              // authored, not sourced
var _LG_SUPPLY_SEVERED = 40;                                                       // authored, not sourced
var _LG_SUPPLY_SCHEMA = "cw_conquest_supply_v1";

/* The authored opening control map: four Union, twenty-four Confederate, and
   eight deliberately unassigned as the contested frontier. This is openly
   authored game content for the open ruleset only — never a sourced claim, and
   structurally unreachable on the gated side, where unsourced opening control
   values stay closed. */
var _LG_SUPPLY_OPENING = {                                                         // authored, not sourced
  "CT-01": "US", "CT-18": "US", "CT-19": "US", "CT-29": "US",
  "CT-05": "CS", "CT-06": "CS", "CT-07": "CS", "CT-10": "CS", "CT-11": "CS",
  "CT-12": "CS", "CT-13": "CS", "CT-14": "CS", "CT-15": "CS", "CT-16": "CS",
  "CT-17": "CS", "CT-20": "CS", "CT-21": "CS", "CT-23": "CS", "CT-24": "CS",
  "CT-25": "CS", "CT-26": "CS", "CT-27": "CS", "CT-28": "CS", "CT-32": "CS",
  "CT-33": "CS", "CT-34": "CS", "CT-35": "CS", "CT-36": "CS"
};

/* Slice 3 repair capacity (D542). Capacity is repair points per pass, built from
   the shipped Engineering Corps levels (Construction + Pontoon branches) and divided
   by the B-5 realism lever, then clamped to a ceiling. Per-mode repair costs make a
   water crossing (pontoon work) dearer than a rail line. Openly authored Mayhem
   content for the open ruleset only, exactly like the D539/D540 constants. */
var _LG_REPAIR = { base: 4, perConstruction: 6, perPontoon: 5, cap: 40,               // authored, not sourced
  cost: { rail: 4, "inland-water": 6, sea: 9 }, costDefault: 5, realismLo: 0.6, realismHi: 1.4 };

function _lgConquestKind(C) {
  var k = C && C.campaignKind;
  if (!k || typeof k !== "object" || Array.isArray(k)) return false;
  return k.id === "conquest" && k.version === 1;
}

/* THE CONTAINMENT GATE (the D538 declared bind target). An ALLOWLIST, never a
   denylist: it admits only the id carried in _LG_TRACE_RULESETS and returns null
   for every other value BEFORE any board or evidence read happens, so authored
   content is structurally unreachable on any other ruleset. The declaration must
   be OWN and DATA-VALUED on both sides — an inherited name or an accessor is not
   an authoritative ruleset declaration and never opens the gate (the shipped
   _trRulesetId / _ccsRecord discipline, which this must not fall short of). */
function _lgTraceRuleset(C) {
  var rv = C && C.ruleset, own = Object.prototype.hasOwnProperty, id, version;
  if (!rv || typeof rv !== "object" || Array.isArray(rv)) return null;
  if (!own.call(rv, "id") || !own.call(rv, "version")) return null;
  try {
    id = Object.getOwnPropertyDescriptor(rv, "id");
    version = Object.getOwnPropertyDescriptor(rv, "version");
  } catch (e) { return null; }
  if (!id || !own.call(id, "value") || !version || !own.call(version, "value")) return null;
  if (typeof id.value !== "string" || version.value !== 1) return null;
  if (!own.call(_LG_TRACE_RULESETS, id.value) || _LG_TRACE_RULESETS[id.value] !== 1) return null;
  return { id: id.value, version: 1 };
}

function _lgTraceEdgeOrder(a, b) {
  if (a.to !== b.to) return a.to < b.to ? -1 : 1;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return 0;
}

/* Projects each evidence row's existing territoryRefs into a directed graph,
   honouring that row's existing direction. A row naming a single territory
   contributes no edge. Neighbour order is sorted so the walk is deterministic.
   Pure over its argument: it performs no lookup of its own. */
function _lgTraceProject(pack) {
  var adj = {}, i, j, k, row, refs, keys;
  for (i = 0; i < pack.services.length; i++) {
    row = pack.services[i];
    refs = row && row.territoryRefs;
    if (!Array.isArray(refs) || refs.length < 2) continue;
    for (j = 0; j < refs.length; j++) {
      for (k = 0; k < refs.length; k++) {
        if (j === k) continue;
        if (row.direction === "one-way" && k < j) continue;
        if (!adj[refs[j]]) adj[refs[j]] = [];
        adj[refs[j]].push({ to: refs[k], id: row.id, mode: row.mode });
      }
    }
  }
  keys = Object.keys(adj);
  for (i = 0; i < keys.length; i++) adj[keys[i]].sort(_lgTraceEdgeOrder);
  return adj;
}

function _lgTracePack(view) {
  if (typeof conquestTransportPhysicalServices !== "function") return null;
  var pack = conquestTransportPhysicalServices(view);
  if (!pack || !Array.isArray(pack.services) || !pack.services.length) return null;
  return pack;
}

function _lgTraceGraph(view) {
  var pack = _lgTracePack(view);
  return pack ? _lgTraceProject(pack) : null;
}

/* THE MEMO (D540). Measurement, not assumption, put it here: re-deriving the
   projection costs about 15ms per call on a conquest carrier against 0.04ms on
   every other carrier, and almost all of it is the substrate's own revalidation
   and deep clone rather than the projection itself. Slice 2 makes that path hot
   — per army, per condition change, per turn — so the pure part is cached once.

   The cache holds ONLY inputs that cannot change under play: the admitted
   ruleset id and the two injected packs, compared by REFERENCE identity so a
   swapped or reloaded pack misses immediately. Control and service condition
   are deliberately NOT part of it and are applied per walk instead, which makes
   a cache that outlives a cut structurally impossible rather than merely
   unlikely. It is module-scoped derived data: never campaign state, never
   serialized, and never carried across a ruleset change. */
var _lgTraceMemo = null;

function _lgTraceInjected(name) {
  try { return (typeof GAME_DATA === "object" && GAME_DATA) ? GAME_DATA[name] : null; }
  catch (e) { return null; }
}

function _lgTraceBase(view) {
  var evidence = _lgTraceInjected("conquest-transport-evidence");
  var territories = _lgTraceInjected("conquest-territories");
  var memo = _lgTraceMemo, pack, board, names = {}, services = {}, i;
  if (memo && memo.rulesetId === view.id && memo.evidence === evidence && memo.territories === territories) return memo;
  pack = _lgTracePack(view);
  if (!pack) return null;
  if (typeof conquestBoardNormalized !== "function") return null;
  board = conquestBoardNormalized();
  if (!board || !Array.isArray(board.territories) || board.territories.length !== 36) return null;
  for (i = 0; i < board.territories.length; i++) names[board.territories[i].id] = board.territories[i].name;
  for (i = 0; i < pack.services.length; i++) if (pack.services[i] && pack.services[i].id) services[pack.services[i].id] = pack.services[i].mode;
  memo = {
    rulesetId: view.id, evidence: evidence, territories: territories,
    adj: _lgTraceFreeze(_lgTraceProject(pack)), names: _lgTraceFreeze(names), services: _lgTraceFreeze(services)
  };
  _lgTraceMemo = memo;
  return memo;
}

/* Breadth-first over sorted neighbours, so the chosen path is deterministic.
   `block` is consulted per edge; when it is absent this is byte-for-byte the
   Slice 1 walk over the full open projection. */
function _lgTraceWalk(adj, from, to, block) {
  var prev = {}, seen = {}, queue = [from], reached = 1, node, edges, i, e, segs, terr, cur, p;
  seen[from] = 1;
  if (from === to) return { reachable: true, segments: [], territories: [from], reached: 1 };
  while (queue.length) {
    node = queue.shift();
    edges = adj[node] || [];
    for (i = 0; i < edges.length; i++) {
      e = edges[i];
      if (seen[e.to]) continue;
      if (block && block(e, node)) continue;
      seen[e.to] = 1; reached++;
      prev[e.to] = { from: node, id: e.id, mode: e.mode };
      if (e.to === to) {
        segs = []; terr = [to]; cur = to;
        while (cur !== from) {
          p = prev[cur];
          segs.unshift({ id: p.id, mode: p.mode, from: p.from, to: cur });
          terr.unshift(p.from);
          cur = p.from;
        }
        return { reachable: true, segments: segs, territories: terr, reached: reached };
      }
      queue.push(e.to);
    }
  }
  return { reachable: false, segments: [], territories: [from], reached: reached };
}

function _lgTraceTheater(C) {
  var bd = null, D = _lgData(), routes = D.routes || {}, r, th;
  try { bd = _lgBattle(C); } catch (e) { bd = null; }
  r = (bd && routes[bd.id]) ? routes[bd.id] : null;
  th = (r && r.theater) || (bd && bd.th) || "E";
  return _LG_TRACE_FRONT[th] ? th : "E";
}

function _lgTraceFreeze(v) {
  if (!v || typeof v !== "object") return v;
  var keys = Object.keys(v), i;
  for (i = 0; i < keys.length; i++) _lgTraceFreeze(v[keys[i]]);
  try { return Object.freeze(v); } catch (e) { return v; }
}

function _lgSupplySide(v) { return (v === "US" || v === "CS") ? v : null; }

/* THE ONE READER (D540). Pure by construction: it inspects the carrier and
   returns a frozen normalized value, and it never writes a byte anywhere. A
   missing, wrong-shaped or malformed payload FAILS CLOSED to the authored
   opening rather than being partially adopted, so a damaged save can degrade
   the readout but can never smuggle in a control or condition claim. The whole
   value is unreachable unless the carrier declares an exact conquest campaign
   kind AND an admitted ruleset, so authored content stays contained. */
function _lgSupplyView(C) {
  if (!_lgConquestKind(C) || !_lgTraceRuleset(C)) return null;
  var own = Object.prototype.hasOwnProperty, control = {}, cut = {}, adopted = false, repairSpent = 0;
  var q = (C && C.conquest && typeof C.conquest === "object" && !Array.isArray(C.conquest)) ? C.conquest : null;
  var raw = q ? q.supply : null, keys, i, ok, rc, rk, rr;
  for (i in _LG_SUPPLY_OPENING) if (own.call(_LG_SUPPLY_OPENING, i)) control[i] = _LG_SUPPLY_OPENING[i];
  if (raw && typeof raw === "object" && !Array.isArray(raw) && raw.schema === _LG_SUPPLY_SCHEMA) {
    rc = raw.control; rk = raw.cut; rr = raw.repair; ok = true;
    if (rc !== undefined && (!rc || typeof rc !== "object" || Array.isArray(rc))) ok = false;
    if (ok && rk !== undefined && (!rk || typeof rk !== "object" || Array.isArray(rk))) ok = false;
    // Slice 3 (D542): a malformed repair ledger fails CLOSED exactly as a malformed control/cut does.
    if (ok && rr !== undefined && (!rr || typeof rr !== "object" || Array.isArray(rr)
      || typeof rr.spent !== "number" || !isFinite(rr.spent) || rr.spent < 0)) ok = false;
    if (ok && rc) {
      keys = Object.keys(rc);
      for (i = 0; i < keys.length; i++) if (!/^CT-\d\d$/.test(keys[i]) || !_lgSupplySide(rc[keys[i]])) { ok = false; break; }
    }
    if (ok && rk) {
      keys = Object.keys(rk);
      for (i = 0; i < keys.length; i++) if (!/^CTS-[RWS]-\d\d$/.test(keys[i]) || rk[keys[i]] !== 1) { ok = false; break; }
    }
    if (ok) {
      adopted = true;
      if (rc) { keys = Object.keys(rc); for (i = 0; i < keys.length; i++) control[keys[i]] = rc[keys[i]]; }
      if (rk) { keys = Object.keys(rk); for (i = 0; i < keys.length; i++) cut[keys[i]] = 1; }
      if (rr) repairSpent = rr.spent;
    }
  }
  return _lgTraceFreeze({
    schema: _LG_SUPPLY_SCHEMA, control: control, cut: cut,
    adopted: adopted, cutCount: Object.keys(cut).length, repairSpent: repairSpent
  });
}

/* THE ONLY WRITERS (D540). Both take the same conquest-kind plus allowlist gate
   as the reader, so authored control and condition state can never be written
   on a carrier the gate refuses. Neither calls a save owner: the value rides
   the existing campaign envelope through the shipped serializer, so no second
   save owner and no second logistics store is created. A carrier whose conquest
   namespace is absent, sealed or hostile fails closed to null. */
function _lgSupplyStore(C) {
  if (!_lgConquestKind(C) || !_lgTraceRuleset(C)) return null;
  var q = C.conquest, s;
  if (!q || typeof q !== "object" || Array.isArray(q)) return null;
  try {
    s = q.supply;
    if (!s || typeof s !== "object" || Array.isArray(s) || s.schema !== _LG_SUPPLY_SCHEMA) {
      s = { schema: _LG_SUPPLY_SCHEMA, control: {}, cut: {} };
      q.supply = s;
      if (q.supply !== s) return null;
    }
    if (!s.control || typeof s.control !== "object" || Array.isArray(s.control)) s.control = {};
    if (!s.cut || typeof s.cut !== "object" || Array.isArray(s.cut)) s.cut = {};
    if (!s.control || !s.cut) return null;
  } catch (e) { return null; }
  return s;
}

/* Slice 3 (D542): the per-pass repair capacity ledger, materialized LAZILY and ONLY
   when a repair op runs — never on a read path — so a pre-Slice-3 save round-trips
   byte-identically. Rides the same guarded store `s`; not a second owner. */
function _lgRepairLedger(s) {
  if (!s.repair || typeof s.repair !== "object" || Array.isArray(s.repair)
    || typeof s.repair.spent !== "number" || !isFinite(s.repair.spent) || s.repair.spent < 0) {
    s.repair = { spent: 0 };
  }
  return s.repair;
}

function conquestSupplySetCondition(C, serviceId, cut) {
  var s = _lgSupplyStore(C), view = _lgTraceRuleset(C), base = view ? _lgTraceBase(view) : null;
  if (!s || !base || typeof serviceId !== "string" ||
      !Object.prototype.hasOwnProperty.call(base.services, serviceId)) return null;
  try {
    if (cut === true) {
      s.cut[serviceId] = 1;
    } else if (Object.prototype.hasOwnProperty.call(s.cut, serviceId)) {
      /* REPAIR (Slice 3). Clearing a cut costs finite engineering capacity: the
         Construction Corps clears a rail line, the Pontoon Train a water crossing. A
         repair the corps cannot afford this pass, or lacks the branch for, is REFUSED
         — the cut stands — which is the standing decision finite capacity forces
         (design law §5). Repairing a service that is not cut is a no-op. */
      var cap = conquestRepairCapacity(C);
      if (cap) {
        var led = _lgRepairLedger(s);
        var mode = base.services[serviceId], water = (mode === "inland-water" || mode === "sea");
        var cost = (typeof _LG_REPAIR.cost[mode] === "number") ? _LG_REPAIR.cost[mode] : _LG_REPAIR.costDefault;
        var branchLevel = water ? cap.pontoons : cap.construction;
        if (branchLevel >= 1 && (led.spent + cost) <= cap.capacity) {
          delete s.cut[serviceId];
          led.spent = led.spent + cost;
        }
      }
    }
  } catch (e) { return null; }
  return _lgSupplyView(C);
}

function conquestSupplySetControl(C, territoryId, side) {
  var s = _lgSupplyStore(C), view = _lgTraceRuleset(C), base = view ? _lgTraceBase(view) : null;
  var held = _lgSupplySide(side);
  if (!s || !base || typeof territoryId !== "string" ||
      !Object.prototype.hasOwnProperty.call(base.names, territoryId)) return null;
  try {
    if (held) s.control[territoryId] = held; else delete s.control[territoryId];
  } catch (e) { return null; }
  return _lgSupplyView(C);
}

/* Slice 3 (D542): the per-pass repair boundary. The sequential-turn loop (Slice 6/7)
   will call this at turn advance to refresh the pass budget; it is UNWIRED today, so
   live play is byte-identical. Routes through the same guarded store — not a second
   owner, not a fourth public mutator, and not a new clock. */
function _lgSupplyRepairReset(C) {
  var s = _lgSupplyStore(C);
  if (!s) return null;
  try { _lgRepairLedger(s).spent = 0; } catch (e) { return null; }
  return _lgSupplyView(C);
}

function conquestSupplyTrace(C, targetId) {
  if (!_lgConquestKind(C)) return null;
  var view = _lgTraceRuleset(C);
  if (!view) return null;
  var base = _lgTraceBase(view);
  if (!base) return null;
  var state = _lgSupplyView(C);
  if (!state) return null;
  var own = Object.prototype.hasOwnProperty, names = base.names, i, m, cost = 0;
  var side = (C && C.side === "CS") ? "CS" : "US", foe = (side === "CS") ? "US" : "CS";
  var depot = _LG_TRACE_DEPOT[side], theater = _lgTraceTheater(C);
  var target = (typeof targetId === "string" && own.call(names, targetId)) ? targetId : _LG_TRACE_FRONT[theater];
  if (!own.call(names, depot) || !own.call(names, target)) return null;

  /* A segment carries for this side only if its service is sound AND neither
     end is held by the enemy. Supply lines reach INTO contested ground — an
     army does not have to own the ground it fights on — but enemy-held country
     astride the line cuts it. */
  var blocked = function (e, from) {
    return state.cut[e.id] === 1 || state.control[e.to] === foe || state.control[from] === foe;
  };
  var depotHeld = state.control[depot] !== foe;
  var openWalk = _lgTraceWalk(base.adj, depot, target, null);
  var liveWalk = depotHeld ? _lgTraceWalk(base.adj, depot, target, blocked)
    : { reachable: false, segments: [], territories: [depot], reached: 1 };

  var walk, applied, supplyState, severedBy = [], reason, friction;
  if (!openWalk.reachable) {
    walk = openWalk; applied = false; supplyState = "SUBSTRATE_GAP";
    reason = "No sourced rail, river or coastal service links " + names[depot] + " to " + names[target]
      + ". Wagon trains carried routes like this one throughout the war, and the authored Mayhem road"
      + " network is not built yet, so supply keeps its shipped value here instead of being penalised"
      + " for a gap in our own evidence. Building that road layer is what closes this.";
  } else if (liveWalk.reachable) {
    walk = liveWalk; applied = true; supplyState = "TRACED";
    reason = "Supply runs " + walk.segments.length + (walk.segments.length === 1 ? " segment" : " segments")
      + " from " + names[depot] + " to " + names[target] + ".";
  } else {
    walk = openWalk; applied = true; supplyState = "SEVERED";
    for (i = 0; i < openWalk.segments.length; i++) {
      if (blocked(openWalk.segments[i], openWalk.segments[i].from)) severedBy.push(openWalk.segments[i].id);
    }
    reason = depotHeld
      ? ("The line from " + names[depot] + " to " + names[target] + " is broken at "
         + (severedBy.length ? severedBy.join(", ") : "an intermediate stage")
         + ". Until it is restored the army falls back on wagon roads, which is slower and carries far less.")
      : (names[depot] + " is in enemy hands, so nothing moves forward from the depot at all.");
  }
  for (i = 0; i < walk.segments.length; i++) {
    m = walk.segments[i].mode;
    cost += (typeof _LG_TRACE_COST[m] === "number") ? _LG_TRACE_COST[m] : _LG_TRACE_COST.road;
  }
  var mix = { rail: 0, "inland-water": 0, sea: 0, road: 0 };
  for (i = 0; i < walk.segments.length; i++) {
    m = walk.segments[i].mode;
    if (typeof mix[m] === "number") mix[m]++;
  }
  friction = (supplyState === "SEVERED") ? _LG_SUPPLY_SEVERED
    : walk.reachable ? _lgClamp(4 + cost, 0, 100) : 100;

  return _lgTraceFreeze({
    rulesetId: view.id,
    authored: true,
    applied: applied,
    supplyState: supplyState,
    side: side,
    theater: theater,
    depot: depot,
    depotName: names[depot],
    depotHeld: depotHeld,
    target: target,
    targetName: names[target],
    reachable: walk.reachable === true,
    segments: walk.segments,
    territories: walk.territories,
    modeMix: mix,
    segmentCount: walk.segments.length,
    reachedCount: walk.reached,
    severedBy: severedBy,
    cutCount: state.cutCount,
    tracedFriction: _lgClamp(friction, 0, 100),
    label: names[depot] + " to " + names[target]
      + (walk.reachable ? (" (" + walk.segments.length + (walk.segments.length === 1 ? " segment)" : " segments)")) : " (no traced path)"),
    reason: reason
  });
}

/* Slice 3 (D542) B-5 coupling. Repair magnitude reads the shipped effectiveness/
   realism lever fldPresetResolve().attrition — the exact lever T13's fldEngRealism
   couples engineering dig speed to (Arcade 0.7 / Balanced 1.0 / Historian 1.3) —
   clamped identically to [0.6, 1.4]. Higher realism divides capacity down, so a
   stricter setting rebuilds slower. Guarded and neutral 1.0 when no preset is set,
   so a probe or a no-preset launch is deterministic. */
function _lgRepairRealism() {
  var c = (typeof fldPresetResolve === "function") ? fldPresetResolve() : null;
  var a = (c && typeof c.attrition === "number" && isFinite(c.attrition)) ? c.attrition : 1;
  return _lgClamp(a, _LG_REPAIR.realismLo, _LG_REPAIR.realismHi);
}

/* A PURE read of a shipped Engineering Corps level (0..3). engBranchLevel would run
   engInit and MUTATE the carrier, which a read path may never do, so this mirrors
   its clamp without the init — the corps store (engInit/engBuy) stays the sole owner
   of C.engineering; this only reads it. */
function _lgEngLevel(C, id) {
  try {
    var e = C && C.engineering, lv = (e && typeof e === "object" && !Array.isArray(e)) ? e.levels : null;
    var n = (lv && typeof lv === "object" && !Array.isArray(lv)) ? lv[id] : 0;
    n = (typeof n === "number" || typeof n === "string") ? Math.floor(Number(n)) : 0;
    return (isFinite(n) && n > 0) ? (n > 3 ? 3 : n) : 0;
  } catch (err) { return 0; }
}

/* The finite repair capacity for this carrier, in repair points per pass, from the
   shipped Construction and Pontoon branch levels divided by the B-5 realism lever and
   clamped to an authored ceiling. Gated through _lgSupplyView, so it fails CLOSED on a
   non-conquest or evidence-gated carrier BEFORE any read. Pure: no write, no engInit,
   and control-class — never cached in the CF-2 memo. */
function conquestRepairCapacity(C) {
  if (!_lgSupplyView(C)) return null;
  var construction = _lgEngLevel(C, "construction"), pontoons = _lgEngLevel(C, "pontoons");
  var realism = _lgRepairRealism();
  var raw = (_LG_REPAIR.base + construction * _LG_REPAIR.perConstruction + pontoons * _LG_REPAIR.perPontoon) / realism;
  return _lgTraceFreeze({
    construction: construction, pontoons: pontoons, realism: realism,
    capacity: _lgClamp(_lgRound(raw), 0, _LG_REPAIR.cap)
  });
}

/* The player-facing standing decision (design law §5): for every live cut, its mode,
   repair cost, the branch that clears it, whether it is repairable within the
   remaining pass budget, and WHY when it is not. When multiple cuts exceed one pass's
   capacity, `exhausted` is true and the player must choose which artery to restore.
   Pure and frozen; fails CLOSED off a conquest campaign. */
function conquestSupplyRepairReport(C) {
  var state = _lgSupplyView(C), cap = conquestRepairCapacity(C);
  var view = _lgTraceRuleset(C), base = view ? _lgTraceBase(view) : null;
  if (!state || !cap || !base) return null;
  var own = Object.prototype.hasOwnProperty, ids = Object.keys(state.cut).sort();
  var remaining = _lgClamp(cap.capacity - state.repairSpent, 0, cap.capacity);
  var cuts = [], repairableCount = 0, capacityBlocked = 0, i, id, mode, water, cost, branchLevel, hasBranch, repairable, reason;
  for (i = 0; i < ids.length; i++) {
    id = ids[i];
    mode = own.call(base.services, id) ? base.services[id] : "";
    water = (mode === "inland-water" || mode === "sea");
    cost = (typeof _LG_REPAIR.cost[mode] === "number") ? _LG_REPAIR.cost[mode] : _LG_REPAIR.costDefault;
    branchLevel = water ? cap.pontoons : cap.construction;
    hasBranch = branchLevel >= 1;
    repairable = hasBranch && cost <= remaining;
    if (repairable) repairableCount++;
    else if (hasBranch) capacityBlocked++;
    reason = !hasBranch ? (water ? "Needs a Pontoon Train — raise the Pontoon branch in the Armory."
                                 : "Needs the Construction Corps — raise the Construction branch in the Armory.")
      : (cost <= remaining ? "Restorable this pass." : "Engineering capacity is spent for this pass.");
    cuts.push({ id: id, mode: mode, cost: cost, branch: water ? "pontoons" : "construction", repairable: repairable, reason: reason });
  }
  return _lgTraceFreeze({
    schema: _LG_SUPPLY_SCHEMA,
    capacity: cap.capacity, spent: state.repairSpent, remaining: remaining,
    construction: cap.construction, pontoons: cap.pontoons, realism: cap.realism,
    cutCount: ids.length, repairableCount: repairableCount, capacityBlocked: capacityBlocked,
    exhausted: capacityBlocked > 0, cuts: cuts
  });
}

/* The player-facing half of Slice 2: a conquest carrier must be able to see WHY
   supply failed, and the three states must read differently. Returns the empty
   string for every carrier the gate refuses, so the shipped readout below stays
   byte-identical outside a conquest campaign. */
function _lgSupplyBlockHTML(C) {
  var t = conquestSupplyTrace(C, null);
  if (!t) return "";
  var tone = t.supplyState === "TRACED" ? "#6f9e5a" : (t.supplyState === "SEVERED" ? "#c9712e" : "#b8863b");
  var word = t.supplyState === "TRACED" ? "Traced" : (t.supplyState === "SEVERED" ? "Severed" : "Unmapped");
  var chain = "", i;
  for (i = 0; i < t.segments.length; i++) {
    chain += (i ? " &rarr; " : "") + htmlEsc(t.segments[i].id) + ' <span style="opacity:.6">(' + htmlEsc(t.segments[i].mode) + ')</span>';
  }
  /* Slice 3 (D542): when the map has cuts, teach the standing decision — the pass
     capacity, how many arteries are restorable now, and WHY each cut can or cannot
     be cleared. Presentation only; conquestSupplyRepairReport is a pure read. */
  var repairHTML = "";
  if (t.cutCount) {
    var rr = conquestSupplyRepairReport(C);
    if (rr) {
      var lines = "", j, cc, mk;
      for (j = 0; j < rr.cuts.length; j++) {
        cc = rr.cuts[j]; mk = cc.repairable ? "#6f9e5a" : "#c9712e";
        lines += '<div style="font-size:11px;opacity:.82;margin-top:2px"><span style="color:' + mk + '">'
          + (cc.repairable ? "&check;" : "&times;") + '</span> ' + htmlEsc(cc.id)
          + ' <span style="opacity:.6">(' + htmlEsc(cc.mode) + ', cost ' + _lgRound(cc.cost) + ')</span> &mdash; ' + htmlEsc(cc.reason) + '</div>';
      }
      repairHTML = '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--rule)">'
        + '<div style="font-size:11px;font-weight:bold">Engineering repair &middot; capacity ' + _lgRound(rr.remaining) + '/' + _lgRound(rr.capacity)
        + ' &middot; ' + _lgRound(rr.repairableCount) + ' of ' + _lgRound(rr.cutCount) + ' restorable this pass'
        + (rr.exhausted ? ' <span style="color:#c9712e">&middot; capacity exhausted &mdash; choose which artery to restore</span>' : '') + '</div>'
        + lines + '</div>';
    }
  }
  return ''
    + '<div style="margin-top:10px;padding:8px;border:1px solid var(--rule);border-left:4px solid ' + tone + ';border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline">'
    + '<div style="font-size:12px"><b>Conquest supply line</b> &middot; ' + htmlEsc(t.label) + '</div>'
    + '<div style="font-size:12px;font-weight:bold;color:' + tone + '">' + word
    + (t.applied ? (' &middot; friction ' + _lgRound(t.tracedFriction)) : ' &middot; shipped friction held') + '</div>'
    + '</div>'
    + (chain ? '<div style="font-size:11px;opacity:.8;margin-top:4px">' + chain + '</div>' : '')
    + '<div style="font-size:11px;opacity:.72;margin-top:4px">' + htmlEsc(t.reason) + '</div>'
    + (t.cutCount ? '<div style="font-size:11px;opacity:.72;margin-top:3px">Cut services on this map: ' + _lgRound(t.cutCount) + '</div>' : '')
    + repairHTML
    + '</div>';
}

function _lgRoute(C, bd) {
  var D = _lgData(), routes = D.routes || {}, theaters = D.theaters || {};
  var th = (bd && bd.th) || "E";
  var r = (bd && routes[bd.id]) ? routes[bd.id] : null;
  var t = theaters[(r && r.theater) || th] || {};
  var side = (C && C.side === "CS") ? "CS" : "US";
  var rf = (r && r.friction && typeof r.friction[side] === "number") ? r.friction[side]
    : (t.routeFriction && typeof t.routeFriction[side] === "number") ? t.routeFriction[side] : (side === "CS" ? 16 : 10);
  var out = {
    id: bd ? bd.id : "",
    label: (r && r.label) || (bd ? bd.name + " railheads" : "Next army railheads"),
    theater: (r && r.theater) || th,
    theaterName: t.name || th,
    friction: rf,
    note: t.note || ""
  };
  var traced = conquestSupplyTrace(C, null);
  if (traced) {
    out.trace = traced;
    /* The ONE sim-affecting line of Slice 2. It is a clamped conditioning input
       feeding the already-capped bridge, never a new combat channel. */
    if (traced.applied === true) out.friction = _lgClamp(traced.tracedFriction, 0, 100);
  }
  return out;
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
    + _lgSupplyBlockHTML(C)
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
