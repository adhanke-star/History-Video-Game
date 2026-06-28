/* ===========================================================================
   Phase I (D148) · 37-loot-survival.js - loot, survival, and Soldier's Story MVP.

   Contract:
     lootInit(C)                 - idempotent save-shape sanitizer
     lootOnResolve(...)          - deterministic campaign reward + optional survival tick
     lootSurvivalBridgeBonus(C)  - ZERO unless survival/journey is explicitly active
     lootRenderTab / lootWireTab - first playable inventory + journey UI

   The tactical engine is not touched here. Rewards are campaign inventory state;
   survival pressure is default-off; bridge facets are additive and gated.
   Prosopography reuses the R-5 person materializer/promotion substrate.
   =========================================================================== */

function _lootData() { return (typeof gameData === "function") ? gameData("loot-survival") : null; }
function _lootItems() { var d = _lootData(); return (d && d.items && d.items.length) ? d.items : []; }
function _lootSurvCfg() { var d = _lootData(); return (d && d.survival) ? d.survival : {}; }
function _lootDropsCfg() { var d = _lootData(); return (d && d.drops) ? d.drops : {}; }
function _lootEsc(s) { return (typeof htmlEsc === "function") ? htmlEsc(s) : String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function _lootOwn(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
function _lootPlain(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
function _lootBadKey(k) { return k === "__proto__" || k === "constructor" || k === "prototype" || k === "hasOwnProperty"; }
function _lootCleanText(s, max) {
  s = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  return max && s.length > max ? s.slice(0, max) : s;
}
function _lootNum(v, d) { return (typeof v === "number" && isFinite(v)) ? v : d; }
function _lootClamp(v, lo, hi) { v = _lootNum(v, lo); return v < lo ? lo : (v > hi ? hi : v); }
function _lootHash(s) {
  s = String(s == null ? "" : s);
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h >>> 0;
}
function _lootItem(id) {
  var list = _lootItems();
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
  return null;
}
function _lootRarity(id) {
  var d = _lootData(), r = d && d.rarities && d.rarities[id];
  return r || { label: id || "Common", color: "#9a9184", weight: 1 };
}
function _lootRarityColor(item) { return _lootRarity(item && item.rarity).color || "#9a9184"; }
function _lootTurn(C) {
  if (C && C.president && typeof C.president.turn === "number") return C.president.turn;
  if (C && typeof C.idx === "number") return C.idx;
  return 0;
}
function _lootBattleLabel(B) { return (B && (B.name || B.id)) ? (B.name || B.id) : "the field"; }
function _lootHasItem(C, id) {
  var inv = C && C.loot && C.loot.inventory;
  if (!inv) return false;
  for (var i = 0; i < inv.length; i++) if (inv[i] && inv[i].id === id && inv[i].qty > 0) return true;
  return false;
}
function _lootSlotLimit() {
  var s = _lootSurvCfg();
  return Math.max(6, Math.min(48, Math.round(_lootNum(s.maxInventorySlots, 18))));
}
function _lootInitMeter(obj, key, dflt) {
  if (typeof obj[key] !== "number" || !isFinite(obj[key])) obj[key] = dflt;
  obj[key] = _lootClamp(obj[key], 0, 100);
}
function _lootCleanTurn(v) {
  v = Math.floor(_lootNum(v, -1));
  return v < -1 ? -1 : v;
}
function _ssJourneySnapshot(p) {
  if (!_lootPlain(p)) return null;
  var snap = {
    pid: _lootCleanText(p.pid || p.id, 180),
    name: _lootCleanText(p.name, 120),
    rank: _lootCleanText(p.rank || "Soldier", 80),
    side: p.side === "CS" ? "CS" : (p.side === "US" ? "US" : ""),
    role: _lootCleanText(p.role || "", 80),
    provenance: _lootCleanText(p.provenance || (p.generated ? "Inferred" : ""), 40),
    generated: !!p.generated,
    ovr: _lootClamp(Math.round(_lootNum(p.ovr, 64)), 0, 100)
  };
  if (_lootPlain(p.grade)) snap.grade = { letter: _lootCleanText(p.grade.letter || "", 4), word: _lootCleanText(p.grade.word || "", 40) };
  if (_lootPlain(p.team)) {
    snap.team = {
      side: p.team.side === "CS" ? "CS" : (p.team.side === "US" ? "US" : ""),
      army: _lootCleanText(p.team.army || "", 120),
      corps: _lootCleanText(p.team.corps || "", 120),
      division: _lootCleanText(p.team.division || "", 120),
      brigade: _lootCleanText(p.team.brigade || "", 120),
      regiment: _lootCleanText(p.team.regiment || "", 120),
      company: _lootCleanText(p.team.company || "", 40)
    };
  }
  return snap.pid && snap.name ? snap : null;
}
function _ssCleanJourney(C, L) {
  var J = _lootPlain(L.journey) ? L.journey : {};
  var clean = {
    enabled: J.enabled === true,
    personId: _lootCleanText(J.personId || "", 180),
    battleId: J.battleId == null ? null : _lootCleanText(J.battleId, 120),
    startedTurn: _lootCleanTurn(J.startedTurn)
  };
  if (clean.startedTurn < 0) clean.startedTurn = _lootTurn(C);
  clean.person = _ssJourneySnapshot(J.person);
  if (!clean.personId && clean.person) clean.personId = clean.person.pid;
  if (!clean.personId) clean.enabled = false;
  clean.log = [];
  if (Array.isArray(J.log)) {
    for (var i = 0; i < J.log.length && clean.log.length < 20; i++) {
      var line = _lootCleanText(J.log[i], 240);
      if (line) clean.log.push(line);
    }
  }
  L.journey = clean;
}

function lootInit(C) {
  if (!C) return null;
  if (!C.loot || typeof C.loot !== "object" || Array.isArray(C.loot)) C.loot = {};
  var L = C.loot, cfg = _lootSurvCfg();
  if (!Array.isArray(L.inventory)) L.inventory = [];
  if (!_lootPlain(L.equipped)) L.equipped = {};
  if (!L.survival || typeof L.survival !== "object" || Array.isArray(L.survival)) L.survival = {};
  if (!_lootPlain(L.journey)) L.journey = {};
  if (!_lootPlain(L.people)) L.people = {};
  var eqClean = {};
  for (var es in L.equipped) {
    if (!_lootOwn(L.equipped, es) || _lootBadKey(es)) continue;
    if (typeof L.equipped[es] === "string") eqClean[es] = _lootCleanText(L.equipped[es], 80);
  }
  L.equipped = eqClean;

  var S = L.survival;
  if (typeof S.enabled !== "boolean") S.enabled = !!cfg.enabledByDefault;
  _lootInitMeter(S, "rations", _lootNum(cfg.baselineRations, 62));
  _lootInitMeter(S, "exposure", _lootNum(cfg.baselineExposure, 18));
  _lootInitMeter(S, "disease", _lootNum(cfg.baselineDisease, 12));
  _lootInitMeter(S, "fatigue", _lootNum(cfg.baselineFatigue, 10));
  _lootInitMeter(S, "forage", 18);
  _lootInitMeter(S, "morale", 55);
  S._touched = true;
  S.lastTurn = _lootCleanTurn(S.lastTurn);
  S.forageTurn = _lootCleanTurn(S.forageTurn);

  var clean = [], seen = {};
  for (var i = 0; i < L.inventory.length; i++) {
    var row = L.inventory[i];
    if (!row || !row.id) continue;
    var it = _lootItem(row.id);
    if (!it) continue;
    var id = it.id, max = it.unique ? 1 : Math.max(1, Math.round(_lootNum(it.stack, 1)));
    var qty = Math.max(1, Math.min(max, Math.round(_lootNum(row.qty, 1))));
    if (seen[id] != null) {
      clean[seen[id]].qty = Math.min(max, clean[seen[id]].qty + qty);
    } else if (clean.length < _lootSlotLimit()) {
      seen[id] = clean.length;
      clean.push({ id: id, qty: qty, found: row.found ? _lootCleanText(row.found, 120) : null });
    }
  }
  L.inventory = clean;
  _ssCleanJourney(C, L);
  for (var slot in L.equipped) {
    if (!_lootOwn(L.equipped, slot) || _lootBadKey(slot)) continue;
    var eq = _lootItem(L.equipped[slot]);
    if (!eq || eq.slot !== slot || !_lootHasItem(C, eq.id)) delete L.equipped[slot];
  }
  return L;
}

function lootSurvivalActive(C) {
  var L = C && C.loot;
  return !!(L && ((L.survival && L.survival.enabled === true) || (L.journey && L.journey.enabled === true)));
}

function lootSetSurvival(C, on) {
  var L = lootInit(C); if (!L) return false;
  var was = !!L.survival.enabled;
  L.survival.enabled = !!on;
  if (was !== L.survival.enabled && typeof _pdLog === "function") {
    _pdLog(C, L.survival.enabled ? "The army takes the hard road: rations, exposure, disease, and fatigue now matter." : "The campaign kit returns to inventory-only bookkeeping.");
  }
  return L.survival.enabled;
}

function lootAddItem(C, id, qty, note) {
  var L = lootInit(C); if (!L) return { ok: false, reason: "no-campaign" };
  var it = _lootItem(id); if (!it) return { ok: false, reason: "unknown-item" };
  qty = Math.max(1, Math.round(_lootNum(qty, 1)));
  if (it.unique && _lootHasItem(C, it.id)) return { ok: false, reason: "unique-duplicate", item: it };
  var max = it.unique ? 1 : Math.max(1, Math.round(_lootNum(it.stack, 1)));
  for (var i = 0; i < L.inventory.length; i++) {
    var row = L.inventory[i];
    if (row.id === it.id) {
      var add = Math.min(max - row.qty, qty);
      if (add <= 0) return { ok: false, reason: "stack-full", item: it };
      row.qty = Math.min(max, row.qty + add);
      if (note) row.found = _lootCleanText(note, 120);
      return { ok: true, item: it, qty: add, stacked: true };
    }
  }
  if (L.inventory.length >= _lootSlotLimit()) return { ok: false, reason: "inventory-full", item: it };
  var added = Math.min(max, qty);
  L.inventory.push({ id: it.id, qty: added, found: note ? _lootCleanText(note, 120) : null });
  return { ok: true, item: it, qty: added, stacked: false };
}

function lootRemoveItem(C, id, qty) {
  var L = lootInit(C); if (!L) return false;
  qty = Math.max(1, Math.round(_lootNum(qty, 1)));
  for (var i = 0; i < L.inventory.length; i++) {
    if (L.inventory[i].id !== id) continue;
    L.inventory[i].qty -= qty;
    if (L.inventory[i].qty <= 0) {
      L.inventory.splice(i, 1);
      for (var slot in L.equipped) if (_lootOwn(L.equipped, slot) && L.equipped[slot] === id) delete L.equipped[slot];
    }
    return true;
  }
  return false;
}

function lootEquipItem(C, id) {
  var L = lootInit(C); if (!L) return { ok: false };
  var it = _lootItem(id);
  if (!it || !it.slot || !_lootHasItem(C, id)) return { ok: false, reason: "not-equippable" };
  if (L.equipped[it.slot] === id) delete L.equipped[it.slot];
  else L.equipped[it.slot] = id;
  if (typeof _pdLog === "function") _pdLog(C, (L.equipped[it.slot] === id ? "Equipped " : "Stowed ") + it.name + ".");
  return { ok: true, item: it, equipped: L.equipped[it.slot] === id };
}

function lootUseItem(C, id) {
  var L = lootInit(C); if (!L) return { ok: false };
  var it = _lootItem(id);
  if (!it || !_lootHasItem(C, id)) return { ok: false, reason: "missing" };
  if (!it.use) return lootEquipItem(C, id);
  var S = L.survival, u = it.use;
  if (typeof u.rations === "number") S.rations = _lootClamp(S.rations + u.rations, 0, 100);
  if (typeof u.forage === "number") S.forage = _lootClamp(S.forage + u.forage, 0, 100);
  if (typeof u.disease === "number") S.disease = _lootClamp(S.disease + u.disease, 0, 100);
  if (typeof u.exposure === "number") S.exposure = _lootClamp(S.exposure + u.exposure, 0, 100);
  if (typeof u.fatigue === "number") S.fatigue = _lootClamp(S.fatigue + u.fatigue, 0, 100);
  if (typeof u.morale === "number") S.morale = _lootClamp(S.morale + u.morale, 0, 100);
  lootRemoveItem(C, id, 1);
  if (typeof _pdLog === "function") _pdLog(C, "Used " + it.name + ".");
  return { ok: true, item: it, survival: S };
}

function _lootEquippedEffect(C, key) {
  var L = C && C.loot;
  if (!L || !L.equipped) return 0;
  var sum = 0;
  for (var slot in L.equipped) {
    if (!_lootOwn(L.equipped, slot) || _lootBadKey(slot)) continue;
    var it = _lootItem(L.equipped[slot]);
    if (it && it.effect && typeof it.effect[key] === "number") sum += it.effect[key];
  }
  return sum;
}

function lootForage(C) {
  var L = lootInit(C); if (!L) return { ok: false };
  if (!lootSurvivalActive(C)) return { ok: false, reason: "inactive" };
  var turn = _lootTurn(C), S = L.survival;
  if (S.forageTurn > turn) S.forageTurn = turn - 1;
  if (S.forageTurn === turn) return { ok: false, reason: "already-foraged" };
  var gain = _lootNum(_lootSurvCfg().forageRations, 14);
  S.forageTurn = turn;
  S.rations = _lootClamp(S.rations + gain, 0, 100);
  S.forage = _lootClamp(S.forage + Math.round(gain * 0.4), 0, 100);
  S.fatigue = _lootClamp(S.fatigue + 4, 0, 100);
  S.exposure = _lootClamp(S.exposure + 2, 0, 100);
  if (typeof _pdLog === "function") _pdLog(C, "Foragers bring in food for the next march.");
  return { ok: true, rations: S.rations };
}

function _lootWinter(C) {
  var m = C && C.president && C.president.date ? C.president.date.month : null;
  return (m === 12 || m === 1 || m === 2) ? true : false;
}

function lootSurvivalTick(C, B, win) {
  var L = lootInit(C); if (!L) return { ok: false };
  if (!lootSurvivalActive(C)) return { ok: false, reason: "inactive" };
  var S = L.survival, turn = _lootTurn(C);
  if (S.lastTurn > turn) S.lastTurn = turn - 1;
  if (S.lastTurn === turn) return { ok: false, reason: "already-ticked" };
  var cfg = _lootSurvCfg(), tick = cfg.tick || {};
  S.lastTurn = turn;
  var rationUse = _lootNum(tick.rationUse, 8);
  var winter = _lootWinter(C);
  var exposure = _lootNum(tick.battleFatigue, 6) + (winter ? _lootNum(tick.winterExposure, 8) : 0);
  exposure += _lootEquippedEffect(C, "exposure");
  S.rations = _lootClamp(S.rations - rationUse, 0, 100);
  S.exposure = _lootClamp(S.exposure + exposure, 0, 100);
  S.fatigue = _lootClamp(S.fatigue + _lootNum(tick.battleFatigue, 6) - _lootEquippedEffect(C, "fatigueRelief"), 0, 100);
  if (S.rations < 25) {
    S.disease = _lootClamp(S.disease + _lootNum(tick.lowRationDisease, 5), 0, 100);
    S.morale = _lootClamp(S.morale + _lootNum(tick.lowRationMorale, -2), 0, 100);
  } else {
    S.disease = _lootClamp(S.disease - 1 + _lootEquippedEffect(C, "disease"), 0, 100);
    S.morale = _lootClamp(S.morale + (win ? 2 : -1), 0, 100);
  }
  if (typeof _pdLog === "function") _pdLog(C, "Campaign kit updated after " + _lootBattleLabel(B) + ".");
  return { ok: true, survival: S };
}

function _lootWeightedPick(seed) {
  var items = _lootItems(), d = _lootData(), rar = (d && d.rarities) ? d.rarities : {};
  var total = 0, pool = [];
  for (var i = 0; i < items.length; i++) {
    var it = items[i]; if (!it || !it.id) continue;
    var w = _lootNum(rar[it.rarity] && rar[it.rarity].weight, 1);
    if (w <= 0) continue;
    pool.push({ item: it, weight: w });
    total += w;
  }
  if (!pool.length) return null;
  var roll = _lootHash(seed) % total, acc = 0;
  for (var j = 0; j < pool.length; j++) { acc += pool[j].weight; if (roll < acc) return pool[j].item; }
  return pool[pool.length - 1].item;
}

function lootOnResolve(winnerSide, type, B, C, win) {
  var L = lootInit(C); if (!L) return;
  var dc = _lootDropsCfg();
  var n = 1 + (win ? _lootNum(dc.winBonus, 2) : (type === "draw" ? _lootNum(dc.drawBonus, 1) : _lootNum(dc.lossBonus, 0)));
  var got = [], base = (B && (B.id || B.name)) || "battle";
  for (var i = 0; i < n; i++) {
    var it = _lootWeightedPick(base + ":" + _lootTurn(C) + ":" + i + ":" + (win ? "W" : "L"));
    if (!it) continue;
    if (it.unique && _lootHasItem(C, it.id)) it = _lootItem("commissary_rations");
    var res = lootAddItem(C, it.id, 1, _lootBattleLabel(B));
    if (res.ok && res.item) got.push(res.item.name);
  }
  lootSurvivalTick(C, B, win);
  if (got.length && typeof _pdLog === "function") _pdLog(C, "Recovered from " + _lootBattleLabel(B) + ": " + got.join(", ") + ".");
}

function lootSurvivalBridgeBonus(C) {
  var zero = { supply: 0, morale: 0, fatigue: 0, firepower: 0, overall: 0 };
  if (!C || !C.loot || !lootSurvivalActive(C)) return zero;
  var L = lootInit(C), S = L && L.survival;
  if (!S) return zero;
  var cfg = _lootSurvCfg().bridge || {}, cap = Math.max(2, Math.min(12, Math.round(_lootNum(cfg.maxFacetShift, 8))));
  var supply = Math.round((S.rations - 50) / 12) + _lootEquippedEffect(C, "supply");
  var morale = Math.round((S.morale - 55) / 10) - Math.round(S.disease / 40) - Math.round(S.exposure / 45) + _lootEquippedEffect(C, "morale");
  var fatigue = Math.round(S.fatigue / 12) + Math.round(S.exposure / 35) - Math.round(_lootEquippedEffect(C, "fatigueRelief"));
  var firepower = _lootEquippedEffect(C, "firepower");
  var overall = _lootEquippedEffect(C, "overall") + Math.round((supply + morale - fatigue) / 4);
  return {
    supply: _lootClamp(supply, -cap, cap),
    morale: _lootClamp(morale, -cap, cap),
    fatigue: _lootClamp(fatigue, -cap, cap),
    firepower: _lootClamp(firepower, -cap, cap),
    overall: _lootClamp(overall, -cap, cap)
  };
}

function _ssAddPerson(out, seen, spec, year, source) {
  if (!spec) return;
  var pid = spec.pid || spec.id || spec.name;
  if (!pid || seen[pid]) return;
  var p = (typeof fldMaterializePerson === "function") ? fldMaterializePerson(spec, year) : null;
  if (!p) return;
  if (source) p.source = source;
  seen[p.pid] = 1;
  out.push(p);
}

function _ssGeneralSpec(g, side, gp) {
  if (!g && !gp) return null;
  var src = gp || g;
  var id = (gp && gp.pid) || (g && g.id) || src.id || src.pid;
  return {
    pid: id,
    id: id,
    name: (gp && gp.name) || (g && (g.fullName || g.name)) || src.name,
    rank: (gp && gp.rank) || (g && g.rank) || "General",
    branch: (gp && gp.branch) || "inf",
    side: side || src.side,
    role: "army commander",
    persona: gp && gp.persona,
    provenance: (gp && gp.provenance) || (g && g.provenance) || "Inferred",
    sources: (gp && gp.sources) || (g && g.sources) || [],
    team: { side: side || src.side, army: "General officers", corps: null }
  };
}

function _ssUnitSpecs(id, label, side, unit, year) {
  var uid = unit && (unit.id || unit.name) ? (unit.id || unit.name) : "unit";
  var cname = unit && unit.commander ? unit.commander : null;
  var arm = unit && unit.arm ? unit.arm : "inf";
  var team = { side: side, army: label || id, corps: unit && unit.name ? unit.name : uid };
  var base = "ss:" + id + ":" + side + ":" + uid;
  return [
    { pid: base + ":cmd", name: cname || null, rank: "Captain", branch: arm, side: side, role: "company officer", team: team, year: year },
    { pid: base + ":nco", rank: "Sergeant", branch: arm, side: side, role: "noncommissioned officer", team: team, year: year },
    { pid: base + ":pvt", rank: "Private", branch: arm, side: side, role: "private soldier", team: team, year: year }
  ];
}

function _ssCollectScenarioUnits(out, seenBrigades, sid, sd) {
  if (!sd) return;
  function addArr(arr, side, phaseName) {
    if (!arr || !arr.length) return;
    for (var i = 0; i < arr.length; i++) {
      var u = arr[i]; if (!u) continue;
      var s = u.side || side; if (s !== "US" && s !== "CS") continue;
      var uid = u.id || u.name || ("u" + i);
      var key = sid + ":" + (phaseName || "main") + ":" + s + ":" + uid;
      if (seenBrigades[key]) continue;
      seenBrigades[key] = { side: s, unit: u, scenario: sid, phase: phaseName || "main" };
      out.push({ key: key, side: s, unit: u, scenario: sid, phase: phaseName || "main", label: sd.name || sid, year: sd.year });
    }
  }
  if (sd.phases && sd.phases.length) {
    for (var p = 0; p < sd.phases.length; p++) {
      var ph = sd.phases[p], pname = ph && (ph.id || ph.name || ("phase" + (p + 1)));
      if (ph && ph.oob) { addArr(ph.oob.US, "US", pname); addArr(ph.oob.CS, "CS", pname); }
      if (ph && ph.reinforcements) addArr(ph.reinforcements, null, pname);
    }
  } else {
    if (sd.oob) { addArr(sd.oob.US, "US", "main"); addArr(sd.oob.CS, "CS", "main"); }
    if (sd.reinforcements) addArr(sd.reinforcements, null, "main");
  }
}

function ssPersonRegistry(C) {
  var people = [], seen = {}, brigades = [], seenBrigades = {};
  var year = (typeof campaignYear === "function") ? campaignYear(C) : 1861;
  var rat = (typeof gameData === "function") ? gameData("ratings") : null;
  var personas = rat && rat.personas ? rat.personas : {};
  for (var pk in personas) {
    if (!personas.hasOwnProperty(pk) || pk.charAt(0) === "_") continue;
    if (personas[pk] && typeof personas[pk] === "object") _ssAddPerson(people, seen, personas[pk], year, "ratings.personas");
  }
  var gens = (typeof gameData === "function") ? gameData("generals") : null;
  var gp = rat && rat.generalPersonas ? rat.generalPersonas : {};
  if (gens && gens.sides) {
    for (var sideKey in gens.sides) {
      if (!gens.sides.hasOwnProperty(sideKey)) continue;
      var side = gens.sides[sideKey];
      var pools = [side.generals || [], side.commissionPool || []];
      for (var pi = 0; pi < pools.length; pi++) {
        for (var gi = 0; gi < pools[pi].length; gi++) {
          var g = pools[pi][gi];
          var spec = _ssGeneralSpec(g, sideKey, gp && gp[g.id]);
          _ssAddPerson(people, seen, spec, year, "generals");
        }
      }
    }
  }
  var reg = (typeof fldScenarioRegistry === "function") ? fldScenarioRegistry() : {};
  for (var sid in reg) if (reg.hasOwnProperty(sid)) _ssCollectScenarioUnits(brigades, seenBrigades, sid, reg[sid]);
  for (var bi = 0; bi < brigades.length; bi++) {
    var b = brigades[bi], specs = _ssUnitSpecs(b.scenario, b.label, b.side, b.unit, b.year || year);
    for (var si = 0; si < specs.length; si++) _ssAddPerson(people, seen, specs[si], b.year || year, "scenario-oob");
  }
  people.sort(function (a, b) {
    if (a.side !== b.side) return a.side === "US" ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  });
  var authored = 0, generated = 0;
  for (var ci = 0; ci < people.length; ci++) { if (people[ci].generated) generated++; else authored++; }
  return { people: people, authored: authored, generated: generated, brigades: brigades.length };
}

function ssFindPerson(C, pid) {
  var reg = ssPersonRegistry(C), list = reg.people;
  for (var i = 0; i < list.length; i++) if (list[i].pid === pid) return list[i];
  return null;
}

function ssStartJourney(C, pid, battleId, opts) {
  var L = lootInit(C); if (!L) return { ok: false };
  opts = opts || {};
  if (L.journey && L.journey.enabled && !opts.force) return { ok: false, reason: "journey-active", journey: L.journey };
  var p = ssFindPerson(C, pid);
  if (!p) return { ok: false, reason: "unknown-person" };
  var bd = battleId ? null : ((typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null);
  L.journey = {
    enabled: true,
    personId: p.pid,
    battleId: battleId || (bd && bd.id) || null,
    startedTurn: _lootTurn(C),
    person: _ssJourneySnapshot(p) || p,
    log: ["Journey begins with " + p.name + "."]
  };
  lootSetSurvival(C, true);
  if (typeof _pdLog === "function") _pdLog(C, "The Soldier's Story begins: " + p.name + ".");
  return { ok: true, person: p, journey: L.journey };
}

function _lootPill(label, value, color) {
  return '<div style="border:1px solid var(--rule);border-radius:6px;padding:8px;background:rgba(0,0,0,.12)">'
    + '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">' + _lootEsc(label) + '</div>'
    + '<div style="font-size:18px;font-weight:bold;color:' + (color || "inherit") + '">' + _lootEsc(value) + '</div></div>';
}

function _ssTeamLabel(p) {
  var t = p && p.team ? p.team : {};
  var bits = [];
  if (t.army) bits.push(t.army);
  if (t.corps) bits.push(t.corps);
  return bits.join(" / ");
}

function _lootInventoryHTML(C) {
  var L = lootInit(C), inv = L.inventory;
  if (!inv.length) return '<p class="lede" style="font-size:12px;text-align:center;opacity:.72">No campaign kit recovered yet.</p>';
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px">';
  for (var i = 0; i < inv.length; i++) {
    var row = inv[i], it = _lootItem(row.id); if (!it) continue;
    var col = _lootRarityColor(it), rar = _lootRarity(it.rarity), equipped = "";
    if (it.slot && L.equipped[it.slot] === it.id) equipped = ' &middot; Equipped';
    html += '<div style="border:1px solid ' + col + ';border-left:4px solid ' + col + ';border-radius:6px;padding:9px;background:rgba(0,0,0,.14)">'
      + '<div style="display:flex;justify-content:space-between;gap:8px"><b>' + _lootEsc(it.name) + '</b><span style="color:' + col + ';font-size:12px">' + _lootEsc(rar.label) + '</span></div>'
      + '<div style="font-size:11px;opacity:.74">' + _lootEsc(it.category || "Item") + ' x' + row.qty + equipped + '</div>'
      + '<div style="font-size:11px;margin-top:5px;min-height:28px">' + _lootEsc(it.blurb || "") + '</div>'
      + '<div class="btn-row" style="margin-top:7px;justify-content:flex-start;gap:6px">'
      + (it.use ? '<button type="button" class="upg" data-loot-use="' + _lootEsc(it.id) + '">Use</button>' : '')
      + (it.slot ? '<button type="button" class="upg" data-loot-equip="' + _lootEsc(it.id) + '">' + (L.equipped[it.slot] === it.id ? "Stow" : "Equip") + '</button>' : '')
      + '</div></div>';
  }
  return html + '</div>';
}

function _lootSurvivalHTML(C) {
  var L = lootInit(C), S = L.survival, active = lootSurvivalActive(C);
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin:8px 0">'
    + _lootPill("Rations", Math.round(S.rations), S.rations < 25 ? "#da6a5a" : "#6f9e5a")
    + _lootPill("Exposure", Math.round(S.exposure), S.exposure > 65 ? "#da6a5a" : "#b8863b")
    + _lootPill("Disease", Math.round(S.disease), S.disease > 50 ? "#da6a5a" : "#b8863b")
    + _lootPill("Fatigue", Math.round(S.fatigue), S.fatigue > 55 ? "#da6a5a" : "#b8863b")
    + _lootPill("Morale", Math.round(S.morale), S.morale < 42 ? "#da6a5a" : "#6f9e5a")
    + '</div>'
    + '<div class="btn-row" style="justify-content:flex-start;gap:8px;margin:8px 0">'
    + '<button id="lootSurvToggle" type="button" class="bigbtn" aria-pressed="' + (active ? "true" : "false") + '">' + (active ? "Survival On" : "Survival Off") + '</button>'
    + '<button id="lootForage" type="button" class="upg"' + (active ? "" : " disabled") + '>Forage</button>'
    + '</div>';
}

function _ssPeopleHTML(C) {
  var L = lootInit(C), reg = ssPersonRegistry(C), people = reg.people, active = L.journey && L.journey.enabled ? L.journey.person : null;
  var activeId = L.journey && L.journey.personId ? L.journey.personId : "";
  var locked = L.journey && L.journey.enabled;
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:8px 0">'
    + _lootPill("People", people.length, "#b8863b")
    + _lootPill("Authored", reg.authored, "#9a86f0")
    + _lootPill("Inferred", reg.generated, "#6f9e5a")
    + _lootPill("Brigades", reg.brigades, "#9a9184")
    + '</div>';
  html += '<div style="border:1px solid var(--rule);border-radius:6px;padding:9px;background:rgba(0,0,0,.12);margin:8px 0">'
    + '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center">'
    + '<select id="ssPersonSelect" aria-label="Soldier&apos;s Story person" style="width:100%;min-width:0;padding:8px;border-radius:6px;border:1px solid var(--rule);background:#21190f;color:var(--ink)">';
  for (var oi = 0; oi < people.length; oi++) {
    var op = people[oi], team = _ssTeamLabel(op);
    var label = (op.side || "?") + " · " + op.name + " · " + (op.rank || "Soldier") + " · OVR " + op.ovr + (team ? " · " + team : "");
    html += '<option value="' + _lootEsc(op.pid) + '"' + (op.pid === activeId ? " selected" : "") + '>' + _lootEsc(label) + '</option>';
  }
  html += '</select><button id="ssBeginSelected" type="button" class="bigbtn"' + (locked ? ' disabled aria-disabled="true"' : '') + '>' + (locked ? "Journey Active" : "Begin Journey") + '</button></div></div>';
  if (active) {
    html += '<div style="border:1px solid #b8863b;border-radius:6px;padding:9px;background:rgba(184,134,59,.10);margin:8px 0">'
      + '<b>' + _lootEsc(active.name) + '</b><div style="font-size:11px;opacity:.78">'
      + _lootEsc(active.rank || "Soldier") + ' &middot; ' + _lootEsc(active.side || "") + ' &middot; OVR ' + active.ovr + ' ' + _lootEsc(active.grade && active.grade.letter || "") + '</div></div>';
  }
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px">';
  var limit = Math.min(12, people.length);
  for (var i = 0; i < limit; i++) {
    var p = people[i], col = p.generated ? "#6f9e5a" : "#9a86f0";
    html += '<div style="border:1px solid var(--rule);border-left:4px solid ' + col + ';border-radius:6px;padding:9px;background:rgba(0,0,0,.14)">'
      + '<div style="display:flex;justify-content:space-between;gap:8px"><b>' + _lootEsc(p.name) + '</b><span style="font-size:12px;color:' + col + '">' + _lootEsc(p.provenance || "Inferred") + '</span></div>'
      + '<div style="font-size:11px;opacity:.76">' + _lootEsc(p.rank || "Soldier") + ' &middot; ' + _lootEsc(p.side || "") + ' &middot; OVR ' + p.ovr + ' ' + _lootEsc(p.grade && p.grade.letter || "") + '</div>'
      + '<button type="button" class="upg" style="margin-top:7px" data-ss-start="' + _lootEsc(p.pid) + '"' + (locked ? ' disabled aria-disabled="true"' : '') + '>' + (locked ? "Journey Active" : "Begin Journey") + '</button>'
      + '</div>';
  }
  return html + '</div>';
}

function lootRenderTab(C) {
  lootInit(C);
  return '<h2 class="title-lg" style="text-align:center">Campaign Kit</h2>'
    + '<p class="title-sub" style="text-align:center">Loot, survival, and The Soldier\'s Story</p>'
    + '<hr class="rule">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:5px">Inventory</div>'
    + _lootInventoryHTML(C)
    + '<hr class="rule">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:5px">Survival</div>'
    + _lootSurvivalHTML(C)
    + '<hr class="rule">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:5px">The Soldier\'s Story</div>'
    + _ssPeopleHTML(C);
}

function lootWireTab(C) {
  function refresh() {
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  }
  var uses = document.querySelectorAll("[data-loot-use]");
  for (var i = 0; i < uses.length; i++) uses[i].addEventListener("click", function () { lootUseItem(C, this.getAttribute("data-loot-use")); refresh(); });
  var eqs = document.querySelectorAll("[data-loot-equip]");
  for (var j = 0; j < eqs.length; j++) eqs[j].addEventListener("click", function () { lootEquipItem(C, this.getAttribute("data-loot-equip")); refresh(); });
  var tog = document.getElementById("lootSurvToggle");
  if (tog) tog.addEventListener("click", function () { lootSetSurvival(C, !lootSurvivalActive(C)); refresh(); });
  var forage = document.getElementById("lootForage");
  if (forage) forage.addEventListener("click", function () { lootForage(C); refresh(); });
  var pick = document.getElementById("ssPersonSelect");
  var begin = document.getElementById("ssBeginSelected");
  if (pick && begin) begin.addEventListener("click", function () { if (pick.value) ssStartJourney(C, pick.value); refresh(); });
  var starts = document.querySelectorAll("[data-ss-start]");
  for (var k = 0; k < starts.length; k++) starts[k].addEventListener("click", function () { ssStartJourney(C, this.getAttribute("data-ss-start")); refresh(); });
}
