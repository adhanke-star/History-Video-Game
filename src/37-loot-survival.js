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
function _lootAttr(s) { return _lootEsc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
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
function _ssCleanPersona(src) {
  if (!_lootPlain(src)) return null;
  var out = {}, n = 0;
  for (var k in src) {
    if (!_lootOwn(src, k) || _lootBadKey(k)) continue;
    if (typeof src[k] === "number" && isFinite(src[k])) { out[k] = _lootClamp(Math.round(src[k]), 0, 100); n++; }
  }
  return n ? out : null;
}
function _ssCleanDual(src) {
  if (!_lootPlain(src)) return null;
  return {
    headline: _lootClamp(Math.round(_lootNum(src.headline, 64)), 0, 100),
    attack: _lootClamp(Math.round(_lootNum(src.attack, 64)), 0, 100),
    defend: _lootClamp(Math.round(_lootNum(src.defend, 64)), 0, 100)
  };
}
function _ssStatus(s) {
  s = _lootCleanText(s || "", 24).toLowerCase();
  if (s === "wounded" || s === "captured" || s === "alive") return s;
  return "alive";
}
function _ssOutcome(s) {
  s = _lootCleanText(s || "", 24).toLowerCase();
  if (s === "victory" || s === "defeat" || s === "draw" || s === "start") return s;
  return "";
}
function _ssCleanCasualties(c) {
  if (!_lootPlain(c)) return null;
  return {
    suffered: Math.round(_lootClamp(c.suffered, 0, 1000000)),
    inflicted: Math.round(_lootClamp(c.inflicted, 0, 1000000))
  };
}
function _ssCareerEntry(e) {
  if (!_lootPlain(e)) return null;
  var out = {
    turn: Math.max(0, _lootCleanTurn(e.turn)),
    battleId: e.battleId == null ? null : _lootCleanText(e.battleId, 120),
    battleName: _lootCleanText(e.battleName || "", 120),
    outcome: _ssOutcome(e.outcome),
    type: _lootCleanText(e.type || "", 32),
    status: _ssStatus(e.status),
    rankBefore: _lootCleanText(e.rankBefore || "", 80),
    rankAfter: _lootCleanText(e.rankAfter || "", 80),
    note: _lootCleanText(e.note || "", 240),
    promoted: e.promoted === true
  };
  var cas = _ssCleanCasualties(e.casualties);
  if (cas) out.casualties = cas;
  return (out.battleId || out.battleName || out.note || out.outcome) ? out : null;
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
  var dual = _ssCleanDual(p.dual);
  var persona = _ssCleanPersona(p.persona);
  if (dual) snap.dual = dual;
  if (persona) snap.persona = persona;
  if (p.status) snap.status = _ssStatus(p.status);
  if (p.officerTier === true) snap.officerTier = true;
  if (p.promotedFrom) snap.promotedFrom = _lootCleanText(p.promotedFrom, 80);
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
function _ssCleanPeopleState(L) {
  var src = _lootPlain(L.people) ? L.people : {}, out = {}, n = 0;
  for (var pid in src) {
    if (!_lootOwn(src, pid) || _lootBadKey(pid) || n >= 24 || !_lootPlain(src[pid])) continue;
    var row = src[pid], clean = {
      pid: _lootCleanText(row.pid || pid, 180),
      name: _lootCleanText(row.name || "", 120),
      rank: _lootCleanText(row.rank || "", 80),
      status: _ssStatus(row.status),
      battles: Math.round(_lootClamp(row.battles, 0, 999)),
      lastBattleId: row.lastBattleId == null ? null : _lootCleanText(row.lastBattleId, 120),
      lastBattleName: _lootCleanText(row.lastBattleName || "", 120)
    };
    clean.career = [];
    if (Array.isArray(row.career)) {
      for (var i = 0; i < row.career.length && clean.career.length < 12; i++) {
        var ce = _ssCareerEntry(row.career[i]);
        if (ce) clean.career.push(ce);
      }
    }
    if (clean.pid) { out[clean.pid] = clean; n++; }
  }
  L.people = out;
}
function _ssSyncPersonCareer(L) {
  var J = L && L.journey;
  if (!J || !J.personId) return;
  var p = J.person || {};
  L.people[J.personId] = {
    pid: J.personId,
    name: _lootCleanText(p.name || "", 120),
    rank: _lootCleanText(p.rank || "", 80),
    status: _ssStatus(J.status),
    battles: Math.round(_lootClamp(J.battles, 0, 999)),
    lastBattleId: J.lastBattleId || null,
    lastBattleName: J.lastBattleName || "",
    career: (J.career || []).slice(-12)
  };
}
function _ssCleanJourney(C, L) {
  var J = _lootPlain(L.journey) ? L.journey : {};
  var clean = {
    enabled: J.enabled === true,
    personId: _lootCleanText(J.personId || "", 180),
    battleId: J.battleId == null ? null : _lootCleanText(J.battleId, 120),
    startBattleId: J.startBattleId == null ? null : _lootCleanText(J.startBattleId, 120),
    currentBattleId: J.currentBattleId == null ? null : _lootCleanText(J.currentBattleId, 120),
    lastBattleId: J.lastBattleId == null ? null : _lootCleanText(J.lastBattleId, 120),
    lastBattleName: _lootCleanText(J.lastBattleName || "", 120),
    lastOutcome: _ssOutcome(J.lastOutcome),
    lastTurn: _lootCleanTurn(J.lastTurn),
    startedTurn: _lootCleanTurn(J.startedTurn),
    status: _ssStatus(J.status),
    battles: Math.round(_lootClamp(J.battles, 0, 999)),
    promotionCount: Math.round(_lootClamp(J.promotionCount, 0, 24))
  };
  if (clean.startedTurn < 0) clean.startedTurn = _lootTurn(C);
  if (clean.lastTurn < 0) clean.lastTurn = clean.startedTurn;
  if (!clean.startBattleId) clean.startBattleId = clean.battleId;
  if (!clean.currentBattleId) clean.currentBattleId = clean.lastBattleId || clean.battleId;
  clean.person = _ssJourneySnapshot(J.person);
  if (!clean.personId && clean.person) clean.personId = clean.person.pid;
  if (!clean.personId) clean.enabled = false;
  if (!clean.enabled) clean.status = "alive";
  clean.log = [];
  if (Array.isArray(J.log)) {
    for (var i = 0; i < J.log.length && clean.log.length < 20; i++) {
      var line = _lootCleanText(J.log[i], 240);
      if (line) clean.log.push(line);
    }
  }
  clean.career = [];
  if (Array.isArray(J.career)) {
    for (var ci = 0; ci < J.career.length && clean.career.length < 18; ci++) {
      var row = _ssCareerEntry(J.career[ci]);
      if (row) clean.career.push(row);
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
  _ssCleanPeopleState(L);
  _ssSyncPersonCareer(L);
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
  if (typeof ssJourneyOnResolve === "function") ssJourneyOnResolve(winnerSide, type, B, C, win);
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
  var st = L.journey && L.journey.enabled ? L.journey.status : "";
  if (st === "wounded") { morale -= 1; fatigue += 2; overall -= 1; }
  if (st === "captured") { supply -= 2; morale -= 3; fatigue += 3; overall -= 2; }
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
  var team = { side: side, army: label || id, corps: null, division: null, brigade: unit && unit.name ? unit.name : uid, regiment: null, company: arm === "art" ? "Battery" : "Representative company" };
  var base = "ss:" + id + ":" + side + ":" + uid;
  return [
    { pid: base + ":cmd", name: cname || null, rank: "Captain", branch: arm, side: side, role: "company officer", team: team, year: year },
    { pid: base + ":nco", rank: "Sergeant", branch: arm, side: side, role: "noncommissioned officer", team: team, year: year },
    { pid: base + ":pvt", rank: "Private", branch: arm, side: side, role: "private soldier", team: team, year: year }
  ];
}

var _SS_REPLACEMENT_SCHEMA = "cw_soldier_replacements_v1";
var _SS_REPLACEMENT_ATTRS = ["tactical", "command", "initiative", "resolve", "discipline", "marksmanship", "vigor", "charisma", "aggression", "grit", "logistics", "engineering", "cavalry", "artillery", "political"];

function _ssReplacementData() { return (typeof gameData === "function") ? gameData("soldier-replacements") : null; }
function _ssReplacementAttrList() {
  var rat = (typeof gameData === "function") ? gameData("ratings") : null;
  return (rat && Array.isArray(rat.attributes) && rat.attributes.length) ? rat.attributes : _SS_REPLACEMENT_ATTRS;
}
function _ssReplacementErr(errors, msg) { errors.push(String(msg || "invalid replacement record")); }
function _ssReplacementBadKeyScan(node, errors, path, depth) {
  if (depth > 12) { _ssReplacementErr(errors, path + " exceeds the allowed nesting depth"); return; }
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) _ssReplacementBadKeyScan(node[i], errors, path + "[" + i + "]", depth + 1);
    return;
  }
  if (!_lootPlain(node)) return;
  for (var k in node) {
    if (!_lootOwn(node, k)) continue;
    if (_lootBadKey(k)) { _ssReplacementErr(errors, path + "." + k + " uses a forbidden key"); continue; }
    _ssReplacementBadKeyScan(node[k], errors, path ? path + "." + k : k, depth + 1);
  }
}
function _ssReplacementPid(s) {
  s = _lootCleanText(s, 160);
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/.test(s) ? s : "";
}
function _ssReplacementSourceKey(src) {
  return _lootCleanText((src.title || "") + "|" + (src.repository || "") + "|" + (src.locator || "") + "|" + (src.url || ""), 420).toLowerCase();
}
function _ssCleanReplacementSources(src, errors, label) {
  var out = [], seen = {};
  if (!Array.isArray(src)) { _ssReplacementErr(errors, label + ".sources must be an array"); return out; }
  for (var i = 0; i < src.length && out.length < 12; i++) {
    var s = src[i];
    if (!_lootPlain(s)) { _ssReplacementErr(errors, label + ".sources[" + i + "] must be an object"); continue; }
    var row = {
      title: _lootCleanText(s.title || "", 160),
      author: _lootCleanText(s.author || "", 120),
      repository: _lootCleanText(s.repository || "", 140),
      locator: _lootCleanText(s.locator || "", 140),
      url: _lootCleanText(s.url || "", 240),
      type: _lootCleanText(s.type || "", 40),
      note: _lootCleanText(s.note || "", 220)
    };
    if (!(row.title || row.repository)) _ssReplacementErr(errors, label + ".sources[" + i + "] needs title or repository");
    if (!(row.locator || row.url)) _ssReplacementErr(errors, label + ".sources[" + i + "] needs locator or URL");
    var key = _ssReplacementSourceKey(row);
    if (key && seen[key]) _ssReplacementErr(errors, label + ".sources[" + i + "] duplicates another source");
    if (key) seen[key] = 1;
    out.push(row);
  }
  if (out.length < 2) _ssReplacementErr(errors, label + " needs at least two independent sources");
  return out;
}
function _ssCleanReplacementPersona(src, errors, label) {
  var attrs = _ssReplacementAttrList(), out = {};
  if (!_lootPlain(src)) { _ssReplacementErr(errors, label + ".persona must include the full rating attribute set"); return out; }
  for (var i = 0; i < attrs.length; i++) {
    var k = attrs[i], v = src[k];
    if (typeof v !== "number" || !isFinite(v)) {
      _ssReplacementErr(errors, label + ".persona." + k + " must be a number");
      continue;
    }
    out[k] = _lootClamp(Math.round(v), 0, 100);
  }
  return out;
}
function _ssCleanReplacementTeam(src, side, errors, label) {
  if (!_lootPlain(src)) { _ssReplacementErr(errors, label + ".team must be an object"); return null; }
  var t = {
    side: src.side === "CS" ? "CS" : (src.side === "US" ? "US" : side),
    army: _lootCleanText(src.army || "", 120),
    corps: _lootCleanText(src.corps || "", 120),
    division: _lootCleanText(src.division || "", 120),
    brigade: _lootCleanText(src.brigade || "", 120),
    regiment: _lootCleanText(src.regiment || "", 120),
    company: _lootCleanText(src.company || "", 40)
  };
  if (t.side !== side) _ssReplacementErr(errors, label + ".team.side must match record side");
  if (!t.army) _ssReplacementErr(errors, label + ".team.army is required");
  if (!(t.brigade || t.regiment || t.company)) _ssReplacementErr(errors, label + ".team needs brigade, regiment, or company");
  return t;
}
function _ssReplacementBaseContext(basePeople) {
  var byPid = {}, generated = {};
  if (Array.isArray(basePeople)) {
    for (var i = 0; i < basePeople.length; i++) {
      var p = basePeople[i]; if (!p || !p.pid) continue;
      byPid[p.pid] = p;
      if (p.generated) generated[p.pid] = p;
    }
  }
  return { byPid: byPid, generated: generated };
}
function ssValidateSoldierReplacementPack(pack, opts) {
  opts = opts || {};
  var errors = [], clean = [], seenPid = {}, seenReplace = {};
  if (!pack) pack = { schema: _SS_REPLACEMENT_SCHEMA, records: [] };
  _ssReplacementBadKeyScan(pack, errors, "pack", 0);
  if (!pack || !_lootPlain(pack)) _ssReplacementErr(errors, "pack must be a plain object");
  if (_lootPlain(pack) && pack.schema !== _SS_REPLACEMENT_SCHEMA) _ssReplacementErr(errors, "schema must be " + _SS_REPLACEMENT_SCHEMA);
  var records = _lootPlain(pack) && Array.isArray(pack.records) ? pack.records : [];
  if (_lootPlain(pack) && !Array.isArray(pack.records)) _ssReplacementErr(errors, "records must be an array");
  var ctx = _ssReplacementBaseContext(opts.basePeople);
  for (var i = 0; i < records.length; i++) {
    var r = records[i], label = "records[" + i + "]";
    if (!_lootPlain(r)) { _ssReplacementErr(errors, label + " must be an object"); continue; }
    var pid = _ssReplacementPid(r.pid);
    if (!pid) _ssReplacementErr(errors, label + ".pid must be a stable safe id");
    if (pid.indexOf("ss:") === 0) _ssReplacementErr(errors, label + ".pid must not use the generated ss: namespace");
    var replacePid = _lootCleanText(r.replacePid || "", 220);
    if (replacePid.indexOf("ss:") !== 0) _ssReplacementErr(errors, label + ".replacePid must target a generated ss: slot");
    if (pid && seenPid[pid]) _ssReplacementErr(errors, label + ".pid duplicates " + pid);
    if (replacePid && seenReplace[replacePid]) _ssReplacementErr(errors, label + ".replacePid duplicates " + replacePid);
    if (pid) seenPid[pid] = 1;
    if (replacePid) seenReplace[replacePid] = 1;
    if (ctx.byPid[pid]) _ssReplacementErr(errors, label + ".pid collides with an existing registry person");
    if (opts.basePeople && (!ctx.generated[replacePid])) _ssReplacementErr(errors, label + ".replacePid does not target a current generated row");
    if (r.generated === true || r.source === "Generated") _ssReplacementErr(errors, label + " cannot mark a sourced replacement as generated");
    var prov = _lootCleanText(r.provenance || "", 40);
    if (prov !== "Verified" && prov !== "Disputed") _ssReplacementErr(errors, label + ".provenance must be Verified or Disputed");
    if (prov === "Disputed" && !_lootCleanText(r.disputeNote || "", 300)) _ssReplacementErr(errors, label + ".disputeNote is required for Disputed records");
    var side = r.side === "CS" ? "CS" : (r.side === "US" ? "US" : "");
    if (!side) _ssReplacementErr(errors, label + ".side must be US or CS");
    var name = _lootCleanText(r.name || "", 120);
    if (name.length < 3 || /[<>]/.test(name)) _ssReplacementErr(errors, label + ".name is required and must be plain text");
    var rank = _lootCleanText(r.rank || "", 80);
    if (!rank) _ssReplacementErr(errors, label + ".rank is required");
    var branch = _lootCleanText(r.branch || "inf", 20);
    if (branch !== "inf" && branch !== "art" && branch !== "cav") _ssReplacementErr(errors, label + ".branch must be inf, art, or cav");
    var year = Math.round(_lootNum(r.year, NaN));
    if (typeof r.year !== "number" || !isFinite(r.year) || year < 1861 || year > 1865) _ssReplacementErr(errors, label + ".year must be 1861-1865");
    var sources = _ssCleanReplacementSources(r.sources, errors, label);
    var persona = _ssCleanReplacementPersona(r.persona, errors, label);
    var team = _ssCleanReplacementTeam(r.team, side, errors, label);
    clean.push({
      pid: pid,
      id: pid,
      replacePid: replacePid,
      name: name,
      rank: rank,
      branch: branch,
      side: side,
      role: _lootCleanText(r.role || "", 80),
      year: year,
      persona: persona,
      provenance: prov,
      generated: false,
      sources: sources,
      sourceNote: _lootCleanText(r.sourceNote || "", 360),
      disputeNote: _lootCleanText(r.disputeNote || "", 360),
      bio: _lootCleanText(r.bio || "", 800),
      team: team
    });
  }
  return { ok: errors.length === 0, schema: _SS_REPLACEMENT_SCHEMA, records: errors.length ? [] : clean, errors: errors };
}
function _ssApplySoldierReplacements(C, reg, year) {
  var pack = _ssReplacementData();
  var validation = ssValidateSoldierReplacementPack(pack || { schema: _SS_REPLACEMENT_SCHEMA, records: [] }, { basePeople: reg.people });
  reg.replacements = { applied: 0, rejected: validation.errors.length, errors: validation.errors.slice(0, 10) };
  if (!validation.ok || !validation.records.length) return reg;
  var index = {};
  for (var i = 0; i < reg.people.length; i++) if (reg.people[i] && reg.people[i].pid) index[reg.people[i].pid] = i;
  for (var ri = 0; ri < validation.records.length; ri++) {
    var r = validation.records[ri], idx = index[r.replacePid];
    if (idx == null || !reg.people[idx] || !reg.people[idx].generated) continue;
    var p = (typeof fldMaterializePerson === "function") ? fldMaterializePerson(r, r.year || year) : null;
    if (!p || p.generated || p.provenance !== r.provenance) continue;
    p.replacement = true;
    p.replaces = r.replacePid;
    p.source = "soldier-replacements";
    p.sourceNote = r.sourceNote;
    p.disputeNote = r.disputeNote;
    p.bio = r.bio;
    reg.people[idx] = p;
    reg.replacements.applied++;
  }
  reg.people.sort(function (a, b) {
    if (a.side !== b.side) return a.side === "US" ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  });
  reg.authored = 0; reg.generated = 0;
  for (var ci = 0; ci < reg.people.length; ci++) { if (reg.people[ci].generated) reg.generated++; else reg.authored++; }
  return reg;
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
  return _ssApplySoldierReplacements(C, { people: people, authored: authored, generated: generated, brigades: brigades.length }, year);
}

function ssFindPerson(C, pid) {
  var reg = ssPersonRegistry(C), list = reg.people;
  for (var i = 0; i < list.length; i++) if (list[i].pid === pid || list[i].replaces === pid) return list[i];
  return null;
}

function _ssBattleById(id) {
  if (!id || typeof BATTLES === "undefined" || !BATTLES) return null;
  for (var i = 0; i < BATTLES.length; i++) if (BATTLES[i] && BATTLES[i].id === id) return BATTLES[i];
  return null;
}
function _ssBattleId(B) {
  return (B && (B.id || (B.bd && B.bd.id))) ? (B.id || B.bd.id) : null;
}
function _ssBattleName(B, id) {
  var bd = B && B.bd ? B.bd : null;
  return _lootCleanText((B && (B.name || B.label)) || (bd && bd.name) || (_ssBattleById(id) && _ssBattleById(id).name) || id || "the field", 120);
}
function _ssPlayerSide(C, B) {
  if (B && (B.playerSide === "US" || B.playerSide === "CS")) return B.playerSide;
  return C && C.side === "CS" ? "CS" : "US";
}
function _ssSideCas(B, side) {
  return Math.round(_lootClamp(B && B.casualties ? B.casualties[side] : 0, 0, 1000000));
}
function _ssCareerWins(J) {
  var n = 0, arr = J && J.career ? J.career : [];
  for (var i = 0; i < arr.length; i++) if (arr[i] && arr[i].outcome === "victory") n++;
  return n;
}
function _ssPromotionRank(J, outcome, type, status) {
  if (!J || outcome !== "victory" || status !== "alive") return null;
  var p = J.person || {}, rank = _lootCleanText(p.rank || "", 80).toLowerCase();
  var wins = _ssCareerWins(J) + 1;
  if (rank === "private" && (type === "decisive" || wins >= 2)) return "Sergeant";
  if (rank === "sergeant" && wins >= 3) return "Captain";
  return null;
}
function _ssHydrateJourneyPerson(C, J) {
  if (!J) return null;
  if (J.person && J.person.persona) return J.person;
  var p = ssFindPerson(C, J.personId);
  if (p) J.person = _ssJourneySnapshot(p) || p;
  return J.person || null;
}
function _ssMaybePromoteJourney(C, J, outcome, type, status) {
  var next = _ssPromotionRank(J, outcome, type, status);
  if (!next || typeof fldPromotePerson !== "function") return null;
  var cur = _ssHydrateJourneyPerson(C, J);
  var before = cur && cur.rank;
  var promoted = fldPromotePerson(cur, next);
  if (!promoted || promoted.rank !== next || promoted.rank === before) return null;
  J.person = _ssJourneySnapshot(promoted) || promoted;
  J.promotionCount = Math.round(_lootClamp((J.promotionCount || 0) + 1, 0, 24));
  return next;
}
function _ssJourneyStatusFor(J, C, B, win, type, suffered, inflicted) {
  var S = C && C.loot && C.loot.survival ? C.loot.survival : {};
  if (J && J.status === "captured") return "captured";
  if (!win && type === "decisive" && suffered >= 1200 && suffered >= inflicted) return "captured";
  if (!win && suffered >= 650) return "wounded";
  if (_lootNum(S.disease, 0) >= 82 || _lootNum(S.exposure, 0) >= 86 || _lootNum(S.fatigue, 0) >= 94) return "wounded";
  return "alive";
}
function _ssApplyStatusSurvival(C, status, win) {
  var S = C && C.loot && C.loot.survival;
  if (!S) return;
  if (status === "captured") {
    S.rations = _lootClamp(S.rations - 6, 0, 100);
    S.fatigue = _lootClamp(S.fatigue + 12, 0, 100);
    S.morale = _lootClamp(S.morale - 8, 0, 100);
  } else if (status === "wounded") {
    S.fatigue = _lootClamp(S.fatigue + 8, 0, 100);
    S.disease = _lootClamp(S.disease + 3, 0, 100);
    S.morale = _lootClamp(S.morale - 3, 0, 100);
  } else if (win) {
    S.fatigue = _lootClamp(S.fatigue - 1, 0, 100);
    S.morale = _lootClamp(S.morale + 1, 0, 100);
  }
}
function _ssPushCareer(J, entry) {
  if (!J) return;
  if (!Array.isArray(J.career)) J.career = [];
  var row = _ssCareerEntry(entry);
  if (!row) return;
  J.career.push(row);
  while (J.career.length > 18) J.career.shift();
  if (!Array.isArray(J.log)) J.log = [];
  if (row.note) J.log.push(row.note);
  while (J.log.length > 20) J.log.shift();
}

function ssStartJourney(C, pid, battleId, opts) {
  var L = lootInit(C); if (!L) return { ok: false };
  opts = opts || {};
  if (L.journey && L.journey.enabled && !opts.force) return { ok: false, reason: "journey-active", journey: L.journey };
  var p = ssFindPerson(C, pid);
  if (!p) return { ok: false, reason: "unknown-person" };
  var bd = battleId ? _ssBattleById(battleId) : ((typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null);
  var bid = battleId || (bd && bd.id) || null;
  var bname = _ssBattleName(bd, bid);
  L.journey = {
    enabled: true,
    personId: p.pid,
    battleId: bid,
    startBattleId: bid,
    currentBattleId: bid,
    startedTurn: _lootTurn(C),
    lastTurn: _lootTurn(C),
    status: "alive",
    battles: 0,
    promotionCount: 0,
    person: _ssJourneySnapshot(p) || p,
    log: ["Journey begins with " + p.name + "."],
    career: []
  };
  _ssPushCareer(L.journey, {
    turn: _lootTurn(C), battleId: bid, battleName: bname, outcome: "start", status: "alive",
    rankAfter: p.rank || "Soldier", note: "Journey begins with " + p.name + (bname ? " before " + bname : "") + "."
  });
  _ssSyncPersonCareer(L);
  lootSetSurvival(C, true);
  if (typeof _pdLog === "function") _pdLog(C, "The Soldier's Story begins: " + p.name + ".");
  return { ok: true, person: p, journey: L.journey };
}

function ssJourneyOnResolve(winnerSide, type, B, C, win) {
  var L = lootInit(C); if (!L || !L.journey || !L.journey.enabled) return { ok: false, reason: "inactive" };
  var J = L.journey, bid = _ssBattleId(B) || J.currentBattleId || J.battleId;
  var bname = _ssBattleName(B, bid), side = _ssPlayerSide(C, B), enemy = side === "CS" ? "US" : "CS";
  var suffered = _ssSideCas(B, side), inflicted = _ssSideCas(B, enemy);
  var outcome = (type === "draw" || winnerSide === null) ? "draw" : (win ? "victory" : "defeat");
  var before = _ssHydrateJourneyPerson(C, J) || J.person || {};
  var rankBefore = _lootCleanText(before.rank || "Soldier", 80);
  var status = _ssJourneyStatusFor(J, C, B, win, type, suffered, inflicted);
  _ssApplyStatusSurvival(C, status, win);
  J.status = status;
  var promoted = _ssMaybePromoteJourney(C, J, outcome, type, status);
  var after = J.person || before || {};
  var rankAfter = _lootCleanText(after.rank || rankBefore, 80);
  J.currentBattleId = bid || null;
  J.lastBattleId = bid || null;
  J.lastBattleName = bname;
  J.lastOutcome = outcome;
  J.lastTurn = _lootTurn(C);
  J.battles = Math.round(_lootClamp((J.battles || 0) + 1, 0, 999));
  var name = _lootCleanText(after.name || before.name || "The selected soldier", 120);
  var note = name + " marked " + (outcome || "the result") + " at " + bname + "; status " + status + ".";
  if (promoted) note += " Field promotion to " + promoted + ".";
  _ssPushCareer(J, {
    turn: _lootTurn(C), battleId: bid, battleName: bname, outcome: outcome, type: type || "",
    status: status, rankBefore: rankBefore, rankAfter: rankAfter, promoted: !!promoted,
    casualties: { suffered: suffered, inflicted: inflicted }, note: note
  });
  _ssSyncPersonCareer(L);
  if (typeof _pdLog === "function") _pdLog(C, "Soldier's Story: " + note);
  return { ok: true, status: status, promoted: promoted || null, battleId: bid, outcome: outcome, battles: J.battles };
}

function _lootPill(label, value, color) {
  return '<div style="border:1px solid var(--rule);border-radius:6px;padding:8px;background:rgba(0,0,0,.12)">'
    + '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">' + _lootEsc(label) + '</div>'
    + '<div style="font-size:18px;font-weight:bold;color:' + (color || "inherit") + '">' + _lootEsc(value) + '</div></div>';
}

function _ssRankLabel(p) { return _lootCleanText(p && p.rank ? p.rank : "Soldier", 80); }
function _ssProvLabel(p) { return _lootCleanText(p && p.provenance ? p.provenance : (p && p.generated ? "Inferred" : "Unstated"), 40); }
function _ssSourceLabel(p) { return (p && p.replacement) ? "Sourced" : ((p && p.generated) ? "Generated" : "Authored"); }
function _ssTeamParts(p) {
  var t = p && p.team ? p.team : {};
  return [
    ["Army", t.army],
    ["Corps", t.corps],
    ["Division", t.division],
    ["Brigade", t.brigade],
    ["Regiment", t.regiment],
    ["Company", t.company]
  ];
}
function _ssPrimaryUnit(p) {
  var t = p && p.team ? p.team : {};
  return _lootCleanText(t.brigade || t.regiment || t.division || t.corps || t.army || "", 120);
}
function _ssTeamLabel(p) {
  var bits = [];
  var parts = _ssTeamParts(p);
  for (var i = 0; i < parts.length; i++) if (parts[i][1]) bits.push(parts[i][1]);
  return bits.join(" / ");
}
function _ssCap(s) {
  s = _ssStatus(s);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function _ssStatusColor(s) {
  s = _ssStatus(s);
  if (s === "captured") return "#da6a5a";
  if (s === "wounded") return "#c9712e";
  return "#6f9e5a";
}
function _ssOutcomeWord(s) {
  s = _ssOutcome(s);
  if (s === "victory") return "Victory";
  if (s === "defeat") return "Defeat";
  if (s === "draw") return "Draw";
  return "Start";
}
function _ssCareerHTML(J, maxRows) {
  var arr = J && Array.isArray(J.career) ? J.career.slice(-Math.max(1, maxRows || 5)) : [];
  if (!arr.length) return '<div style="font-size:11px;opacity:.7">No career entries yet.</div>';
  var h = '<div style="display:grid;gap:5px;margin-top:6px">';
  for (var i = arr.length - 1; i >= 0; i--) {
    var e = arr[i] || {}, cas = e.casualties || null;
    var sub = [];
    if (e.rankAfter) sub.push(e.rankAfter);
    sub.push(_ssCap(e.status));
    if (cas) sub.push("cas. " + cas.suffered + " / " + cas.inflicted);
    h += '<div style="border-top:1px solid rgba(120,92,62,.32);padding-top:5px">'
      + '<div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:11.5px">' + _lootEsc(e.battleName || e.battleId || "Journey") + '</b>'
      + '<span style="font-size:10px;color:' + _ssStatusColor(e.status) + ';font-weight:bold">' + _lootEsc(_ssOutcomeWord(e.outcome)) + '</span></div>'
      + '<div style="font-size:10.5px;opacity:.73">' + _lootEsc(sub.join(" · ")) + (e.promoted ? ' · <b>Promoted</b>' : '') + '</div>'
      + (e.note ? '<div style="font-size:10.5px;opacity:.62">' + _lootEsc(e.note) + '</div>' : '')
      + '</div>';
  }
  return h + '</div>';
}
function _ssJourneyActiveHTML(C) {
  var L = lootInit(C), J = L.journey;
  if (!J || !J.enabled || !J.person) return "";
  var p = J.person, status = _ssStatus(J.status), last = J.lastBattleName || J.lastBattleId || J.currentBattleId || J.battleId || "Not yet blooded";
  return '<div id="ssJourneyPanel" style="border:1px solid #b8863b;border-radius:6px;padding:10px;background:rgba(184,134,59,.10);margin:8px 0">'
    + '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start">'
    + '<div style="min-width:0"><b style="overflow-wrap:anywhere">' + _lootEsc(p.name) + '</b><div style="font-size:11px;opacity:.78">'
    + _lootEsc(p.rank || "Soldier") + ' · ' + _lootEsc(p.side || "") + ' · OVR ' + _lootEsc(p.ovr) + ' ' + _lootEsc(p.grade && p.grade.letter || "") + '</div></div>'
    + '<span style="font-size:11px;font-weight:bold;color:' + _ssStatusColor(status) + ';border:1px solid ' + _ssStatusColor(status) + ';border-radius:4px;padding:2px 7px">' + _lootEsc(_ssCap(status)) + '</span></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:7px;margin-top:8px">'
    + _lootPill("Battles", J.battles || 0, "#b8863b")
    + _lootPill("Last field", last, "#9a9184")
    + _lootPill("Promotions", J.promotionCount || 0, "#6f9e5a")
    + '</div>'
    + '<div class="gn-col-head" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:9px 0 2px">Career Log</div>'
    + _ssCareerHTML(J, 5)
    + '</div>';
}
function ssJourneyReportHTML(C, opts) {
  opts = opts || {};
  var J = C && C.loot && _lootPlain(C.loot.journey) ? C.loot.journey : null;
  if (!J || !J.personId || !J.person) return "";
  var p = J.person, status = _ssStatus(J.status), max = opts.compact ? 3 : 5;
  var last = J.lastBattleName || J.lastBattleId || J.currentBattleId || J.battleId || "Not yet blooded";
  return '<div style="margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><b style="font-size:12.5px">The Soldier&apos;s Story</b>'
    + '<span style="font-size:11px;font-weight:bold;color:' + _ssStatusColor(status) + '">' + _lootEsc(_ssCap(status)) + '</span></div>'
    + '<div style="font-size:11px;opacity:.74;margin-top:2px">' + _lootEsc(p.name || "Selected soldier") + ' · ' + _lootEsc(p.rank || "Soldier")
    + ' · ' + _lootEsc((J.battles || 0) + " battle" + (J.battles === 1 ? "" : "s")) + ' · last field: ' + _lootEsc(last) + '.</div>'
    + _ssCareerHTML(J, max)
    + '</div>';
}
function _ssTeamHierarchyHTML(p) {
  var parts = _ssTeamParts(p), rows = "";
  for (var i = 0; i < parts.length; i++) {
    if (!parts[i][1]) continue;
    rows += '<div style="display:grid;grid-template-columns:72px minmax(0,1fr);gap:8px;padding:3px 0;border-top:1px solid rgba(120,92,62,.32)">'
      + '<span style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--rule)">' + _lootEsc(parts[i][0]) + '</span>'
      + '<span style="font-size:12px;min-width:0;overflow-wrap:anywhere">' + _lootEsc(parts[i][1]) + '</span></div>';
  }
  return rows || '<div style="font-size:12px;opacity:.72">No unit assignment recorded.</div>';
}
function _ssFacetValues(people, keyFn) {
  var seen = {}, vals = [];
  for (var i = 0; i < people.length; i++) {
    var v = _lootCleanText(keyFn(people[i]), 120);
    if (!v || seen[v]) continue;
    seen[v] = 1; vals.push(v);
  }
  vals.sort(function (a, b) { return String(a).localeCompare(String(b)); });
  return vals;
}
function _ssOptionHTML(values, allLabel) {
  var h = '<option value="">' + _lootEsc(allLabel) + '</option>';
  for (var i = 0; i < values.length; i++) h += '<option value="' + _lootAttr(values[i]) + '">' + _lootEsc(values[i]) + '</option>';
  return h;
}
function _ssRegisterText(p) {
  return [
    p && p.name, _ssRankLabel(p), p && p.side, p && p.role, _ssProvLabel(p), _ssSourceLabel(p), _ssPrimaryUnit(p), _ssTeamLabel(p)
  ].join(" ").toLowerCase();
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
    html += '<option value="' + _lootAttr(op.pid) + '"' + (op.pid === activeId ? " selected" : "") + '>' + _lootEsc(label) + '</option>';
  }
  html += '</select><button id="ssBeginSelected" type="button" class="bigbtn"' + (locked ? ' disabled aria-disabled="true"' : '') + '>' + (locked ? "Journey Active" : "Begin Journey") + '</button></div></div>';
  if (active) html += _ssJourneyActiveHTML(C);
  var selected = activeId || (people[0] && people[0].pid) || "";
  html += '<div id="ssArmyRegister" style="margin-top:10px">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:6px 0">Army Register</div>'
    + _ssRegisterControlsHTML(people)
    + '<div id="ssPersonDetail" style="margin:8px 0">' + ssPersonDetailHTML(C, selected) + '</div>'
    + '<div id="ssRegCount" style="font-size:11px;opacity:.74;margin:6px 0">' + people.length + ' people</div>'
    + '<div id="ssRegResults" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px;max-height:460px;overflow:auto;padding-right:2px">';
  for (var i = 0; i < people.length; i++) html += _ssRegisterCardHTML(people[i], locked, activeId);
  return html + '</div></div>';
}

function ssPersonDetailHTML(C, pid) {
  var L = lootInit(C), reg = ssPersonRegistry(C), p = pid ? ssFindPerson(C, pid) : null;
  if (!p && L.journey && L.journey.personId) p = ssFindPerson(C, L.journey.personId) || L.journey.person;
  if (!p && reg.people.length) p = reg.people[0];
  if (!p) return '<div id="ssPersonDetailCard" style="border:1px solid var(--rule);border-radius:6px;padding:10px;background:rgba(0,0,0,.12)">No person selected.</div>';
  var locked = L.journey && L.journey.enabled, activeSame = locked && L.journey.personId === p.pid;
  var grade = p.grade || { letter: "", word: "", color: "#b8863b" };
  var ps = (typeof fldProvenanceStyle === "function") ? fldProvenanceStyle(_ssProvLabel(p), grade.color) : { fill: "background:#8a7350", glyph: "", label: _ssProvLabel(p), title: _ssProvLabel(p) };
  var dual = p.dual || {};
  return '<div id="ssPersonDetailCard" data-ss-detail-pid="' + _lootAttr(p.pid) + '" style="border:1px solid var(--rule);border-left:5px solid ' + (grade.color || "#b8863b") + ';border-radius:6px;padding:10px;background:rgba(0,0,0,.14)">'
    + '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start">'
    + '<div style="min-width:0"><div style="display:flex;align-items:center;gap:8px;min-width:0"><span aria-hidden="true" title="' + _lootAttr(ps.title) + '" style="flex:none;display:inline-block;width:6px;height:30px;border-radius:2px;' + ps.fill + '"></span><div style="min-width:0"><b style="font-size:18px;overflow-wrap:anywhere">' + _lootEsc(p.name) + '</b><div style="font-size:12px;opacity:.78">' + _lootEsc(_ssRankLabel(p)) + ' &middot; ' + _lootEsc(p.side || "") + (p.role ? ' &middot; ' + _lootEsc(p.role) : '') + '</div></div></div></div>'
    + '<button type="button" class="bigbtn" data-ss-start="' + _lootAttr(p.pid) + '"' + (locked ? ' disabled aria-disabled="true"' : '') + '>' + (activeSame ? "Journey Active" : (locked ? "Journey Active" : "Begin Journey")) + '</button></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:7px;margin-top:9px">'
    + _lootPill("OVR", p.ovr, grade.color || "#b8863b")
    + _lootPill("Grade", (grade.letter || "") + " " + (grade.word || ""), grade.color || "#b8863b")
    + _lootPill("Attack", dual.attack != null ? dual.attack : "-", "#8aa0c8")
    + _lootPill("Defend", dual.defend != null ? dual.defend : "-", "#8aa0c8")
    + _lootPill("Source", _ssSourceLabel(p), p.generated ? "#6f9e5a" : "#9a86f0")
    + _lootPill("Provenance", _ssProvLabel(p), grade.color || "#b8863b")
    + '</div>'
    + '<div class="gn-col-head" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:10px 0 3px">Team Hierarchy</div>'
    + _ssTeamHierarchyHTML(p)
    + '<div style="font-size:11px;opacity:.72;margin-top:7px">Latent command ' + _lootEsc(p.latentCommand != null ? p.latentCommand : "-") + ' &middot; Sources ' + _lootEsc(p.sources && p.sources.length ? p.sources.length : 0) + ' &middot; ' + _lootEsc(ps.glyph + " " + ps.label) + '</div>'
    + '</div>';
}

function _ssRegisterControlsHTML(people) {
  var ranks = _ssFacetValues(people, _ssRankLabel);
  var provs = _ssFacetValues(people, _ssProvLabel);
  var units = _ssFacetValues(people, _ssPrimaryUnit);
  var lab = 'display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:3px';
  var ctl = 'width:100%;min-width:0;padding:8px;border-radius:6px;border:1px solid var(--rule);background:#21190f;color:var(--ink)';
  return '<div id="ssRegControls" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;align-items:end">'
    + '<label style="min-width:0"><span style="' + lab + '">Search</span><input id="ssRegSearch" type="search" autocomplete="off" style="' + ctl + '" aria-label="Search Army Register"></label>'
    + '<label style="min-width:0"><span style="' + lab + '">Side</span><select id="ssRegSide" style="' + ctl + '" aria-label="Filter by side"><option value="">All sides</option><option value="US">US</option><option value="CS">CS</option></select></label>'
    + '<label style="min-width:0"><span style="' + lab + '">Rank</span><select id="ssRegRank" style="' + ctl + '" aria-label="Filter by rank">' + _ssOptionHTML(ranks, "All ranks") + '</select></label>'
    + '<label style="min-width:0"><span style="' + lab + '">Provenance</span><select id="ssRegProv" style="' + ctl + '" aria-label="Filter by provenance">' + _ssOptionHTML(provs, "All provenance") + '</select></label>'
    + '<label style="min-width:0"><span style="' + lab + '">Unit</span><select id="ssRegUnit" style="' + ctl + '" aria-label="Filter by unit">' + _ssOptionHTML(units, "All units") + '</select></label>'
    + '</div>';
}

function _ssRegisterCardHTML(p, locked, activeId) {
  var grade = p.grade || { letter: "", word: "", color: "#b8863b" };
  var prov = _ssProvLabel(p), unit = _ssPrimaryUnit(p), source = _ssSourceLabel(p);
  var ps = (typeof fldProvenanceStyle === "function") ? fldProvenanceStyle(prov, grade.color) : { fill: "background:#8a7350", glyph: "", label: prov, title: prov };
  var team = _ssTeamLabel(p);
  var text = _ssRegisterText(p);
  return '<div data-ss-card="1" data-ss-pid="' + _lootAttr(p.pid) + '" data-ss-side="' + _lootAttr(p.side || "") + '" data-ss-rank="' + _lootAttr(_ssRankLabel(p)) + '" data-ss-prov="' + _lootAttr(prov) + '" data-ss-unit="' + _lootAttr(unit) + '" data-ss-text="' + _lootAttr(text) + '" style="border:1px solid var(--rule);border-left:4px solid ' + (grade.color || "#b8863b") + ';border-radius:6px;padding:9px;background:rgba(0,0,0,.13);min-width:0">'
    + '<div style="display:flex;align-items:start;gap:7px;min-width:0"><span aria-hidden="true" title="' + _lootAttr(ps.title) + '" style="flex:none;display:inline-block;width:5px;height:28px;border-radius:2px;' + ps.fill + '"></span>'
    + '<div style="min-width:0;flex:1 1 auto"><div style="display:flex;justify-content:space-between;gap:8px"><b style="overflow-wrap:anywhere">' + _lootEsc(p.name) + '</b><span style="font-size:12px;color:' + (grade.color || "#b8863b") + '">' + _lootEsc(grade.letter || "") + '</span></div>'
    + '<div style="font-size:11px;opacity:.76">' + _lootEsc(_ssRankLabel(p)) + ' &middot; ' + _lootEsc(p.side || "") + ' &middot; OVR ' + _lootEsc(p.ovr) + '</div>'
    + '<div style="font-size:11px;opacity:.72;overflow-wrap:anywhere">' + _lootEsc(unit || team || "No unit assignment") + '</div>'
    + '<div style="font-size:10px;opacity:.7;margin-top:3px">' + _lootEsc(source) + ' &middot; ' + _lootEsc(prov) + '</div></div></div>'
    + '<div class="btn-row" style="margin-top:7px;justify-content:flex-start;gap:6px"><button type="button" class="upg" data-ss-pick="' + _lootAttr(p.pid) + '">Details</button><button type="button" class="upg" data-ss-start="' + _lootAttr(p.pid) + '"' + (locked ? ' disabled aria-disabled="true"' : '') + '>' + ((activeId && activeId === p.pid) ? "Journey Active" : (locked ? "Journey Active" : "Begin Journey")) + '</button></div>'
    + '</div>';
}

function _ssClosestAttr(el, attr, stop) {
  while (el && el !== stop && el.nodeType === 1) {
    if (el.getAttribute && el.getAttribute(attr) != null) return el;
    el = el.parentNode;
  }
  if (el === stop && el.getAttribute && el.getAttribute(attr) != null) return el;
  return null;
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
  var regRoot = document.getElementById("ssArmyRegister");
  if (!regRoot) return;
  var detail = document.getElementById("ssPersonDetail");
  var count = document.getElementById("ssRegCount");
  var search = document.getElementById("ssRegSearch");
  var side = document.getElementById("ssRegSide");
  var rank = document.getElementById("ssRegRank");
  var prov = document.getElementById("ssRegProv");
  var unit = document.getElementById("ssRegUnit");
  var selectedPid = (pick && pick.value) || "";
  function filterVal(el) { return el ? String(el.value || "") : ""; }
  function showDetail(pid) {
    if (!pid || !detail) return;
    selectedPid = pid;
    detail.innerHTML = ssPersonDetailHTML(C, pid);
    if (pick) pick.value = pid;
  }
  function currentDetailPid() {
    if (!detail) return selectedPid;
    var card = detail.querySelector("#ssPersonDetailCard");
    return (card && card.getAttribute("data-ss-detail-pid")) || selectedPid;
  }
  function cardMatches(card, q, s, r, p, u) {
    var txt = String(card.getAttribute("data-ss-text") || "").toLowerCase();
    if (q && txt.indexOf(q) < 0) return false;
    if (s && card.getAttribute("data-ss-side") !== s) return false;
    if (r && card.getAttribute("data-ss-rank") !== r) return false;
    if (p && card.getAttribute("data-ss-prov") !== p) return false;
    if (u && card.getAttribute("data-ss-unit") !== u) return false;
    return true;
  }
  function applyRegisterFilters() {
    var cards = regRoot.querySelectorAll("[data-ss-card]");
    var q = filterVal(search).toLowerCase();
    var s = filterVal(side), r = filterVal(rank), p = filterVal(prov), u = filterVal(unit);
    var shown = 0, firstPid = "", cur = currentDetailPid(), curVisible = false;
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i], ok = cardMatches(card, q, s, r, p, u), pid = card.getAttribute("data-ss-pid") || "";
      card.style.display = ok ? "" : "none";
      if (ok) {
        shown++;
        if (!firstPid) firstPid = pid;
        if (pid === cur) curVisible = true;
      }
    }
    if (count) count.textContent = shown + " of " + cards.length + " people";
    if (!shown && detail) {
      detail.innerHTML = '<div id="ssPersonDetailCard" style="border:1px solid var(--rule);border-radius:6px;padding:10px;background:rgba(0,0,0,.12)">No people match the current register filters.</div>';
    } else if (shown && !curVisible) {
      showDetail(firstPid);
    }
  }
  if (pick) pick.addEventListener("change", function () { if (pick.value) showDetail(pick.value); });
  var filterEls = [search, side, rank, prov, unit];
  for (var ri = 0; ri < filterEls.length; ri++) if (filterEls[ri]) {
    filterEls[ri].addEventListener(filterEls[ri] === search ? "input" : "change", applyRegisterFilters);
  }
  regRoot.addEventListener("click", function (ev) {
    var start = _ssClosestAttr(ev.target, "data-ss-start", regRoot);
    if (start && start.getAttribute("disabled") == null) {
      ev.preventDefault();
      ssStartJourney(C, start.getAttribute("data-ss-start"));
      refresh();
      return;
    }
    var picked = _ssClosestAttr(ev.target, "data-ss-pick", regRoot);
    if (picked) {
      ev.preventDefault();
      showDetail(picked.getAttribute("data-ss-pick"));
      applyRegisterFilters();
    }
  });
  applyRegisterFilters();
}
