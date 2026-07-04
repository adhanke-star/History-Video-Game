/* ===========================================================================
   T11 Custom Battle Builder (C4)
   Data-driven single-phase scenario authoring. Custom scenarios do not enter the
   canonical battle registry; fldScenarioData(id) asks this module only for IDs
   explicitly launched by the builder or loaded from local slots.
   =========================================================================== */

var FLDCB_STORE = "cw_custom_battles_v1";
var FLDCB_SCHEMA = "cw_custom_battle_v1";
var FLDCB_PACK_SCHEMA = "cw_custom_battle_pack_v1";
var FLDCB_SLOTS = 6;
var _fldCbState = null;
var _fldCbLast = null;
var _fldCbActiveScenario = null;

function _fldCbCopy(o) { return JSON.parse(JSON.stringify(o || {})); }
function _fldCbEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return c === "&" ? "&amp;" : (c === "<" ? "&lt;" : (c === ">" ? "&gt;" : (c === '"' ? "&quot;" : "&#39;")));
  });
}
function _fldCbNum(v, d, lo, hi) {
  var n = +v;
  if (!isFinite(n)) n = d;
  if (typeof lo === "number" && n < lo) n = lo;
  if (typeof hi === "number" && n > hi) n = hi;
  return n;
}
function _fldCbInt(v, d, lo, hi) { return Math.round(_fldCbNum(v, d, lo, hi)); }
function _fldCbSlug(s) {
  var out = String(s || "custom battle").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return out || "custom_battle";
}
function _fldCbSafeId(s, prefix) {
  var raw = String(s || "").trim();
  raw = raw.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  if (!raw) raw = prefix || "unit";
  if (!/^[A-Za-z]/.test(raw)) raw = (prefix || "id") + "_" + raw;
  return raw.slice(0, 48);
}
function _fldCbScenarioId(name, id) {
  var s = String(id || "").trim();
  if (!s) s = "custom_" + _fldCbSlug(name);
  s = s.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  if (s.indexOf("custom_") !== 0) s = "custom_" + s;
  return s.slice(0, 56);
}
function _fldCbSideName(s) { return s === "CS" ? "Confederacy" : "Union"; }
function _fldCbEnemy(s) { return s === "CS" ? "US" : "CS"; }
function _fldCbForbiddenRe() { return /^(damage|dmg|fireScale|killScale|combatScale|battleDamage|battleFire|casualtyScale|attritionScale|lethality|fireBase|moraleDamage|gunFireWeight)$/i; }
function _fldCbWalk(o, path, errors) {
  if (!o || typeof o !== "object") return;
  for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype" || k === "hasOwnProperty") { errors.push("Unsafe JSON key: " + (path ? path + "." : "") + k); continue; }
    if (_fldCbForbiddenRe().test(k)) errors.push("Forbidden battle-specific combat key: " + (path ? path + "." : "") + k);
    _fldCbWalk(o[k], path ? path + "." + k : k, errors);
  }
}
function _fldCbScrub(o) {
  if (Array.isArray(o)) {
    var a = [];
    for (var i = 0; i < o.length; i++) a.push(_fldCbScrub(o[i]));
    return a;
  }
  if (!o || typeof o !== "object") return o;
  var out = {};
  for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype" || k === "hasOwnProperty") continue;
    out[k] = _fldCbScrub(o[k]);
  }
  return out;
}
function _fldCbMarkerPath(v, field) {
  if (Array.isArray(v)) {
    var av = [];
    for (var vi = 0; vi < v.length && av.length < 64; vi++) {
      var q = v[vi];
      if (!Array.isArray(q) || q.length < 2) continue;
      av.push([_fldCbInt(q[0], 0, 0, field.w), _fldCbInt(q[1], 0, 0, field.h)]);
    }
    return av.length > 1 ? av : null;
  }
  var s = String(v || "").trim();
  if (!s) return null;
  var pts = [], chunks = s.split(";");
  for (var i = 0; i < chunks.length; i++) {
    var p = chunks[i].split(",");
    if (p.length < 2) continue;
    pts.push([_fldCbInt(p[0], 0, 0, field.w), _fldCbInt(p[1], 0, 0, field.h)]);
  }
  return pts.length > 1 ? pts : null;
}
function _fldCbPathString(path) {
  if (!Array.isArray(path) || path.length < 2) return "";
  var out = [];
  for (var i = 0; i < path.length; i++) out.push(Math.round(+path[i][0] || 0) + "," + Math.round(+path[i][1] || 0));
  return out.join(";");
}

function fldCustomDefaultDraft() {
  return {
    id: "custom_crossroads_ridge",
    name: "Crossroads Ridge",
    date: "Summer 1863",
    place: "Virginia crossroads",
    provenance: "Player-authored custom scenario.",
    attacker: "US",
    defender: "CS",
    defaultFog: false,
    assaultDoctrine: "standard",
    fieldW: 1200,
    fieldH: 900,
    timeLimitSec: 540,
    holdToWinSec: 100,
    objective: { name: "Crossroads Ridge", x: 600, z: 445, r: 125 },
    sideCopy: {
      US: { title: "Lead the Union attack", deck: "Press up the road, silence the ridge guns, and hold the crossroads." },
      CS: { title: "Hold for the Confederacy", deck: "Use the ridge, wall, and reserves to deny the crossroads." }
    },
    brief: {
      attack: "Your infantry must close on the ridge under artillery fire, then hold the crossroads long enough to settle the field.",
      defend: "Your line begins near the ridge. Hold the crest, protect the guns, and counterattack only when the assault is spent."
    },
    terrain: {
      hills: [{ x: 610, z: 405, h: 24, s: 210 }, { x: 410, z: 615, h: 12, s: 150 }],
      woods: [{ x: 280, z: 475, r: 135 }, { x: 915, z: 315, r: 150 }],
      walls: [{ x1: 455, z1: 360, x2: 745, z2: 350 }],
      markers: [
        { kind: "road", name: "Crossroads Road", path: "90,690;430,545;620,445;1110,315" },
        { kind: "bridge", name: "Stone Bridge", x: 385, z: 550 }
      ]
    },
    units: [
      { side: "US", id: "us_1", name: "1st Union Brigade", commander: "Col. Walker", arm: "inf", weapon: "rifled", men: 1900, xp: 2, x: 430, z: 730, facing: 0, formation: "line", atSec: 0 },
      { side: "US", id: "us_2", name: "2nd Union Brigade", commander: "Col. Finch", arm: "inf", weapon: "smooth", men: 1700, xp: 1, x: 690, z: 735, facing: 0, formation: "line", atSec: 0 },
      { side: "US", id: "us_guns", name: "Union Battery", commander: "Capt. Hale", arm: "art", weapon: "rifled", men: 120, guns: 6, xp: 2, x: 560, z: 790, facing: 0, formation: "line", atSec: 0 },
      { side: "US", id: "us_reserve", name: "Union Reserve Brigade", commander: "Col. Ames", arm: "inf", weapon: "rifled", men: 1500, xp: 2, x: 240, z: 910, facing: 0, formation: "column", atSec: 150 },
      { side: "CS", id: "cs_1", name: "1st Confederate Brigade", commander: "Brig. Gen. Cobb", arm: "inf", weapon: "rifled", men: 1750, xp: 2, x: 500, z: 315, facing: 3.14, formation: "line", atSec: 0 },
      { side: "CS", id: "cs_2", name: "2nd Confederate Brigade", commander: "Col. Pryor", arm: "inf", weapon: "smooth", men: 1650, xp: 2, x: 725, z: 305, facing: 3.14, formation: "line", atSec: 0 },
      { side: "CS", id: "cs_guns", name: "Confederate Battery", commander: "Capt. Poague", arm: "art", weapon: "smooth", men: 96, guns: 4, xp: 2, x: 620, z: 260, facing: 3.14, formation: "line", atSec: 0 },
      { side: "CS", id: "cs_reserve", name: "Confederate Reserve", commander: "Col. Branch", arm: "inf", weapon: "rifled", men: 1400, xp: 2, x: 960, z: -20, facing: 3.14, formation: "column", atSec: 185 }
    ],
    leaders: [
      { side: "US", id: "us_cmd", name: "Union Field Commander", quality: 1.08, radius: 190, x: 560, z: 710, attach: "us_1" },
      { side: "CS", id: "cs_cmd", name: "Confederate Field Commander", quality: 1.08, radius: 190, x: 630, z: 285, attach: "cs_1" }
    ],
    supply: {
      US: { name: "Union ammunition train", x: 585, z: 850 },
      CS: { name: "Confederate ammunition train", x: 615, z: 70 }
    },
    teachingCards: [
      { id: "custom_builder_note", head: "Custom battle", body: "A single-phase player-authored scenario using the shared tactical field model.", provenance: "Player-authored." }
    ]
  };
}

function _fldCbSource(raw) {
  var src = raw;
  if (src && src.scenario) src = src.scenario;
  if (src && src.customBattle) src = src.customBattle;
  return src || {};
}
function _fldCbFlatUnits(src) {
  if (Array.isArray(src.units)) return _fldCbCopy(src.units);
  var out = [], sides = ["US", "CS"], i, j, side, list, d;
  if (src.oob) for (i = 0; i < sides.length; i++) {
    side = sides[i]; list = src.oob[side] || [];
    for (j = 0; j < list.length; j++) { d = _fldCbCopy(list[j]); d.side = d.side || side; d.atSec = d.atSec || 0; out.push(d); }
  }
  list = src.reinforcements || [];
  for (j = 0; j < list.length; j++) { d = _fldCbCopy(list[j]); d.atSec = d.atSec || 1; out.push(d); }
  return out;
}
function _fldCbDraftFromScenario(sc) {
  sc = _fldCbSource(sc);
  var d = fldCustomDefaultDraft();
  d.id = sc.id || d.id;
  d.name = sc.name || d.name;
  d.date = sc.date || d.date;
  d.place = sc.place || d.place;
  d.provenance = sc.provenance || d.provenance;
  d.attacker = sc.attacker === "CS" ? "CS" : "US";
  d.defender = sc.defender === "US" ? "US" : "CS";
  d.defaultFog = !!sc.defaultFog;
  d.assaultDoctrine = sc.assaultDoctrine === "cautious" ? "cautious" : "standard";
  d.fieldW = sc.field && sc.field.w ? sc.field.w : d.fieldW;
  d.fieldH = sc.field && sc.field.h ? sc.field.h : d.fieldH;
  d.timeLimitSec = sc.timeLimitSec || d.timeLimitSec;
  d.holdToWinSec = sc.holdToWinSec || d.holdToWinSec;
  d.objective = _fldCbCopy(sc.objective || d.objective);
  d.sideCopy = _fldCbCopy(sc.sides || d.sideCopy);
  d.brief = _fldCbCopy(sc.brief || d.brief);
  d.terrain = _fldCbCopy(sc.terrain || d.terrain);
  if (d.terrain && d.terrain.markers) for (var m = 0; m < d.terrain.markers.length; m++) if (d.terrain.markers[m].path) d.terrain.markers[m].path = _fldCbPathString(d.terrain.markers[m].path);
  d.units = _fldCbFlatUnits(sc);
  d.leaders = [];
  if (sc.leaders) {
    var sides = ["US", "CS"], i, list, j, x;
    for (i = 0; i < sides.length; i++) {
      list = sc.leaders[sides[i]] || [];
      for (j = 0; j < list.length; j++) { x = _fldCbCopy(list[j]); x.side = sides[i]; d.leaders.push(x); }
    }
  }
  d.supply = _fldCbCopy(sc.supply || d.supply);
  d.teachingCards = sc.teaching && sc.teaching.cards ? _fldCbCopy(sc.teaching.cards) : d.teachingCards;
  return d;
}

function fldCustomValidate(raw) {
  var errors = [], warnings = [], src = _fldCbSource(raw || {});
  if (!src || typeof src !== "object" || Array.isArray(src)) return { ok: false, errors: ["Scenario JSON must be an object."], warnings: [], scenario: null, json: "" };
  _fldCbWalk(src, "", errors);
  if (src.phases) errors.push("Custom Battle Builder V1 exports one single-phase scenario; phase authoring is deferred.");
  var name = String(src.name || "").trim();
  var date = String(src.date || "").trim();
  var place = String(src.place || "").trim();
  if (!name) errors.push("Scenario name is required.");
  if (!date) errors.push("Scenario date is required.");
  if (!place) errors.push("Scenario place is required.");
  var id = _fldCbScenarioId(name, src.id);
  if (!/^custom_[A-Za-z0-9_-]{3,56}$/.test(id)) errors.push("Scenario ID must be safe and start with custom_.");
  var attacker = src.attacker === "CS" ? "CS" : "US";
  var defender = src.defender === "US" ? "US" : "CS";
  if (attacker === defender) errors.push("Attacker and defender must be different sides.");
  var field = { w: _fldCbInt(src.fieldW || (src.field && src.field.w), 1200, 700, 1800), h: _fldCbInt(src.fieldH || (src.field && src.field.h), 900, 550, 1400) };
  var objective = src.objective || {};
  objective = {
    name: String(objective.name || "").trim(),
    x: _fldCbInt(objective.x, field.w / 2, 40, field.w - 40),
    z: _fldCbInt(objective.z, field.h / 2, 40, field.h - 40),
    r: _fldCbInt(objective.r, 125, 50, 220)
  };
  if (!objective.name) errors.push("Objective name is required.");
  if (objective.x - objective.r < 0 || objective.x + objective.r > field.w || objective.z - objective.r < 0 || objective.z + objective.r > field.h) errors.push("Objective radius must fit inside the field.");
  var timeLimitSec = _fldCbInt(src.timeLimitSec, 540, 180, 1800);
  var holdToWinSec = _fldCbInt(src.holdToWinSec, 100, 20, Math.max(25, Math.min(600, timeLimitSec - 10)));
  // S27 (D233): the Hold-to-win field advertises max 600, but the real ceiling is timeLimit-10 — surface the
  // clamp instead of silently launching a different win condition than the field shows.
  var _cbHoldTyped = Math.round(Number(src.holdToWinSec));
  if (isFinite(_cbHoldTyped) && _cbHoldTyped > holdToWinSec) warnings.push("Hold-to-win " + _cbHoldTyped + "s exceeds the time limit's ceiling — clamped to " + holdToWinSec + "s (time limit minus 10s).");
  var terrainSrc = src.terrain || {};
  var terrain = { hills: [], woods: [], walls: [], markers: [] }, i, d, p;
  var hills = terrainSrc.hills || (terrainSrc.hill ? [terrainSrc.hill] : []);
  var _cbCapArr = function (arr, label) { if (Array.isArray(arr) && arr.length > 48) { errors.push("Too many " + label + " (" + arr.length + "); max 48."); return arr.slice(0, 48); } return arr; };
  hills = _cbCapArr(hills, "hills");
  for (i = 0; i < hills.length; i++) {
    d = hills[i] || {};
    terrain.hills.push({ x: _fldCbInt(d.x, field.w / 2, 0, field.w), z: _fldCbInt(d.z, field.h / 2, 0, field.h), h: _fldCbNum(d.h, 16, 0, 60), s: _fldCbInt(d.s || d.r, 180, 45, 420) });
  }
  var woods = _cbCapArr(terrainSrc.woods || [], "woods");
  for (i = 0; i < woods.length; i++) {
    d = woods[i] || {};
    terrain.woods.push({ x: _fldCbInt(d.x, field.w / 2, 0, field.w), z: _fldCbInt(d.z, field.h / 2, 0, field.h), r: _fldCbInt(d.r, 120, 25, 280) });
  }
  var walls = _cbCapArr(terrainSrc.walls || (terrainSrc.wall ? [terrainSrc.wall] : []), "walls");
  for (i = 0; i < walls.length; i++) {
    d = walls[i] || {};
    terrain.walls.push({ x1: _fldCbInt(d.x1, field.w / 2 - 80, 0, field.w), z1: _fldCbInt(d.z1, field.h / 2, 0, field.h), x2: _fldCbInt(d.x2, field.w / 2 + 80, 0, field.w), z2: _fldCbInt(d.z2, field.h / 2, 0, field.h) });
  }
  var markers = _cbCapArr(terrainSrc.markers || [], "markers");
  for (i = 0; i < markers.length; i++) {
    d = markers[i] || {};
    var mk = { kind: String(d.kind || "label").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 18) || "label", name: String(d.name || "").trim().slice(0, 80) };
    p = _fldCbMarkerPath(d.path, field);
    if (p) mk.path = p;
    else { mk.x = _fldCbInt(d.x, field.w / 2, 0, field.w); mk.z = _fldCbInt(d.z, field.h / 2, 0, field.h); }
    terrain.markers.push(mk);
  }
  var unitIds = {}, bySide = { US: [], CS: [] }, reinforcements = [], units = _fldCbFlatUnits(src);
  if (!units.length) errors.push("At least one unit per side is required.");
  if (units.length > 40) { errors.push("Too many units (" + units.length + "); max 40."); units = units.slice(0, 40); }
  for (i = 0; i < units.length; i++) {
    d = units[i] || {};
    var side = d.side === "CS" ? "CS" : "US";
    var atSec = _fldCbInt(d.atSec, 0, 0, timeLimitSec);
    var arm = d.arm === "art" ? "art" : (d.arm === "cav" ? "cav" : "inf");
    var uid = _fldCbSafeId(d.id, side.toLowerCase() + "_unit");
    if (unitIds[uid]) errors.push("Duplicate unit/leader ID: " + uid);
    unitIds[uid] = side;
    if (!d.id || !/^[A-Za-z][A-Za-z0-9_-]{1,48}$/.test(String(d.id))) warnings.push("Unit ID normalized to " + uid + ".");
    var guns = arm === "art" ? _fldCbInt(d.guns, 4, 1, 24) : 0;
    var rawMen = +d.men;
    var men = _fldCbInt(d.men, arm === "art" ? guns * 22 : 1500, arm === "art" ? guns * 12 : 80, arm === "art" ? guns * 40 : 7000);
    if (arm === "art") {
      if (isFinite(rawMen) && (rawMen < guns * 12 || rawMen > guns * 40)) errors.push(uid + " has unrealistic artillery crew count; use 12-40 men per gun.");
    }
    var u = {
      id: uid,
      side: side,
      name: String(d.name || uid).replace(/[<>]/g, "").trim().slice(0, 90),
      commander: String(d.commander || "").replace(/[<>]/g, "").trim().slice(0, 80),
      arm: arm,
      weapon: String(d.weapon || (arm === "cav" ? "carbine" : "rifled")).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24) || "rifled",
      men: men,
      guns: guns,
      xp: _fldCbInt(d.xp, 2, 1, 4),
      x: _fldCbInt(d.x, side === "US" ? field.w * 0.45 : field.w * 0.55, -80, field.w + 80),
      z: _fldCbInt(d.z, side === "US" ? field.h - 120 : 120, -120, field.h + 120),
      facing: _fldCbNum(d.facing, side === "US" ? 0 : 3.14, -6.29, 6.29),
      formation: d.formation === "column" ? "column" : "line",
      entry: String(d.entry || "").trim().slice(0, 100)
    };
    if (!u.name) errors.push(uid + " needs a unit name.");
    if (atSec > 0) { u.atSec = atSec; reinforcements.push(u); }
    else bySide[side].push(u);
  }
  if (!bySide.US.length && !reinforcements.some(function (u) { return u.side === "US"; })) errors.push("Union must have at least one unit.");
  if (!bySide.CS.length && !reinforcements.some(function (u) { return u.side === "CS"; })) errors.push("Confederacy must have at least one unit.");
  var leaders = { US: [], CS: [] }, leaderSrc = [];
  if (Array.isArray(src.leaders)) leaderSrc = src.leaders;
  else if (src.leaders) {
    ["US", "CS"].forEach(function (s) { var list = src.leaders[s] || []; for (var li = 0; li < list.length; li++) { var q = _fldCbCopy(list[li]); q.side = s; leaderSrc.push(q); } });
  }
  if (leaderSrc.length > 16) { errors.push("Too many leaders (" + leaderSrc.length + "); max 16."); leaderSrc = leaderSrc.slice(0, 16); }
  for (i = 0; i < leaderSrc.length; i++) {
    d = leaderSrc[i] || {};
    side = d.side === "CS" ? "CS" : "US";
    uid = _fldCbSafeId(d.id, side.toLowerCase() + "_leader");
    if (unitIds[uid]) errors.push("Duplicate unit/leader ID: " + uid);
    unitIds[uid] = side;
    var attach = String(d.attach || "").trim();
    if (attach && unitIds[attach] && unitIds[attach] !== side) errors.push(uid + " attaches to a unit owned by the other side.");
    if (attach && !unitIds[attach]) warnings.push(uid + " attach target is not a known unit.");
    leaders[side].push({
      id: uid,
      name: String(d.name || uid).replace(/[<>]/g, "").trim().slice(0, 80),
      quality: _fldCbNum(d.quality, 1.05, 0.7, 1.35),
      radius: _fldCbInt(d.radius, 180, 80, 340),
      x: _fldCbInt(d.x, side === "US" ? field.w * 0.48 : field.w * 0.52, 0, field.w),
      z: _fldCbInt(d.z, side === "US" ? field.h - 150 : 150, 0, field.h),
      attach: attach || "",
      fate: String(d.fate || "").trim().slice(0, 120)
    });
  }
  var sides = src.sides || src.sideCopy || {};
  sides = {
    US: { title: String((sides.US && sides.US.title) || "Lead the Union").trim(), deck: String((sides.US && sides.US.deck) || "Take and hold the objective.").trim() },
    CS: { title: String((sides.CS && sides.CS.title) || "Lead the Confederacy").trim(), deck: String((sides.CS && sides.CS.deck) || "Hold the objective and break the attack.").trim() }
  };
  var brief = src.brief || {};
  brief = {
    attack: String(brief.attack || ("Attack toward " + objective.name + " and hold it.")).trim(),
    defend: String(brief.defend || ("Defend " + objective.name + " until the clock runs out.")).trim()
  };
  var supplySrc = src.supply || {};
  var supply = {
    US: {
      name: String((supplySrc.US && supplySrc.US.name) || "Union ammunition train").trim(),
      x: _fldCbInt(supplySrc.US && supplySrc.US.x, field.w * 0.5, 0, field.w),
      z: _fldCbInt(supplySrc.US && supplySrc.US.z, field.h - 55, 0, field.h)
    },
    CS: {
      name: String((supplySrc.CS && supplySrc.CS.name) || "Confederate ammunition train").trim(),
      x: _fldCbInt(supplySrc.CS && supplySrc.CS.x, field.w * 0.5, 0, field.w),
      z: _fldCbInt(supplySrc.CS && supplySrc.CS.z, 55, 0, field.h)
    }
  };
  var cards = (src.teachingCards || (src.teaching && src.teaching.cards) || []);
  var teaching = { title: "Custom Battle Notes", cards: [] };
  for (i = 0; i < cards.length; i++) {
    d = cards[i] || {};
    if (!d.head && !d.body) continue;
    teaching.cards.push({ id: _fldCbSafeId(d.id || ("custom_note_" + (i + 1)), "custom_note"), head: String(d.head || "Custom note").replace(/[<>]/g, "").trim().slice(0, 80), body: String(d.body || "").replace(/[<>]/g, "").trim().slice(0, 520), provenance: String(d.provenance || src.provenance || "Player-authored.").replace(/[<>]/g, "").trim().slice(0, 220) });
  }
  var scenario = {
    id: id,
    name: name || "Custom Battle",
    date: date || "Undated",
    place: place || "Unspecified field",
    blurb: String(src.blurb || ("A player-authored single-phase battle at " + (place || "an unspecified field") + ".")).trim(),
    provenance: String(src.provenance || "Player-authored custom scenario.").trim(),
    field: field,
    attacker: attacker,
    defender: defender,
    defaultFog: !!src.defaultFog,
    assaultDoctrine: src.assaultDoctrine === "cautious" ? "cautious" : "standard",
    timeLimitSec: timeLimitSec,
    holdToWinSec: holdToWinSec,
    menu: { title: "Custom Battle - " + (name || "Untitled"), deck: (date || "Undated") + " - " + (place || "Unspecified field"), aria: "Custom Battle Builder scenario " + (name || "Untitled") },
    sides: sides,
    brief: brief,
    objective: objective,
    terrain: terrain,
    oob: { US: bySide.US, CS: bySide.CS },
    reinforcements: reinforcements.sort(function (a, b) { return a.atSec - b.atSec; }),
    leaders: leaders,
    supply: supply,
    teaching: teaching,
    endNote: { US: "The Union holds " + objective.name + ".", CS: "The Confederacy denies " + objective.name + ".", draw: "The fight ends inconclusively at " + objective.name + "." }
  };
  return { ok: !errors.length, errors: errors, warnings: warnings, scenario: scenario, json: JSON.stringify({ schema: FLDCB_SCHEMA, scenario: scenario }, null, 2) };
}

function fldCustomExportScenario(scenario) {
  var r = fldCustomValidate(scenario || _fldCbState || fldCustomDefaultDraft());
  return r.ok ? r.json : "";
}
function fldCustomTemplateJson() {
  return JSON.stringify({
    schema: FLDCB_SCHEMA,
    note: "Single-phase custom battle scenario. IDs must start with custom_. Phased battle authoring is deliberately deferred.",
    scenario: fldCustomDefaultDraft()
  }, null, 2);
}
function _fldCbPackSources(list) {
  var out = [], i, slots;
  if (Array.isArray(list)) {
    for (i = 0; i < list.length; i++) out.push(list[i]);
    return out;
  }
  if (_fldCbState) out.push(_fldCbState);
  slots = fldCustomListSlots();
  for (i = 0; i < slots.length; i++) if (slots[i] && slots[i].scenario) out.push(slots[i].scenario);
  return out;
}
function fldCustomExportPack(list, meta) {
  var sources = _fldCbPackSources(list), scenarios = [], seen = {}, warnings = [], errors = [];
  for (var i = 0; i < sources.length; i++) {
    var r = fldCustomValidate(sources[i]);
    if (!r.ok) { warnings.push("Skipped invalid scenario " + (i + 1) + ": " + r.errors.join("; ")); continue; }
    if (seen[r.scenario.id]) { warnings.push("Skipped duplicate scenario id " + r.scenario.id + "."); continue; }
    seen[r.scenario.id] = true;
    scenarios.push(r.scenario);
  }
  if (!scenarios.length) errors.push("Pack needs at least one valid custom scenario.");
  if (scenarios.length > FLDCB_SLOTS) errors.push("Pack is limited to " + FLDCB_SLOTS + " scenarios so it can install into local slots.");
  var pack = {
    schema: FLDCB_PACK_SCHEMA,
    format: FLDCB_SCHEMA,
    title: String((meta && meta.title) || "The Civil War custom battle pack").slice(0, 90),
    createdAt: new Date().toISOString(),
    scenarios: scenarios
  };
  return { ok: !errors.length, errors: errors, warnings: warnings, pack: pack, scenarios: scenarios, json: errors.length ? "" : JSON.stringify(pack, null, 2) };
}
function fldCustomImportJson(text) {
  var raw;
  try { raw = JSON.parse(String(text || "")); }
  catch (e) { return { ok: false, errors: ["Malformed JSON: " + (e && e.message ? e.message : e)], warnings: [], scenario: null, draft: null }; }
  raw = _fldCbScrub(raw);
  var r = fldCustomValidate(raw);
  if (r.ok) r.draft = _fldCbDraftFromScenario(r.scenario);
  return r;
}
function _fldCbPackPayload(raw) {
  if (raw && raw.customBattlePack) raw = raw.customBattlePack;
  if (raw && raw.schema === FLDCB_PACK_SCHEMA) return raw;
  if (raw && Array.isArray(raw.scenarios)) return raw;
  return null;
}
function fldCustomInstallPack(scenarios) {
  var errors = [], saved = [], st = fldCustomLoadStore(), i, r, existing = {}, incoming = {}, empty = [];
  while (st.slots.length < FLDCB_SLOTS) st.slots.push(null);
  for (i = 0; i < st.slots.length; i++) {
    if (st.slots[i] && st.slots[i].id) existing[st.slots[i].id] = true;
    else empty.push(i);
  }
  if (!Array.isArray(scenarios) || !scenarios.length) errors.push("Pack contains no scenarios to install.");
  if (scenarios && scenarios.length > empty.length) errors.push("Need " + scenarios.length + " empty custom slots; only " + empty.length + " available.");
  if (scenarios) for (i = 0; i < scenarios.length; i++) {
    r = fldCustomValidate(scenarios[i]);
    if (!r.ok) errors.push("Scenario " + (i + 1) + " invalid: " + r.errors.join("; "));
    else {
      if (incoming[r.scenario.id]) errors.push("Duplicate scenario id in pack: " + r.scenario.id);
      else incoming[r.scenario.id] = true;
      if (existing[r.scenario.id]) errors.push("Scenario id already saved: " + r.scenario.id);
    }
  }
  if (errors.length) return { ok: false, errors: errors, warnings: [], saved: 0, slots: [] };
  for (i = 0; i < scenarios.length; i++) {
    r = fldCustomValidate(scenarios[i]);
    var slot = empty[i];
    st.slots[slot] = { id: r.scenario.id, name: r.scenario.name, updatedAt: new Date().toISOString(), scenario: r.scenario };
    existing[r.scenario.id] = true;
    saved.push(slot);
  }
  if (!fldCustomWriteStore(st)) return { ok: false, errors: ["Could not write custom battle pack to local slots."], warnings: [], saved: 0, slots: [] };
  return { ok: true, errors: [], warnings: [], saved: saved.length, slots: saved };
}
function fldCustomImportPackJson(text, opts) {
  var raw, payload, candidates, scenarios = [], errors = [], warnings = [], seen = {}, install;
  try { raw = JSON.parse(String(text || "")); }
  catch (e) { return { ok: false, errors: ["Malformed JSON: " + (e && e.message ? e.message : e)], warnings: [], scenarios: [], drafts: [], saved: 0 }; }
  raw = _fldCbScrub(raw);
  payload = _fldCbPackPayload(raw);
  candidates = payload ? payload.scenarios : [_fldCbSource(raw)];
  if (!Array.isArray(candidates) || !candidates.length) errors.push("Pack needs a scenarios[] array.");
  if (candidates && candidates.length > FLDCB_SLOTS) errors.push("Pack is limited to " + FLDCB_SLOTS + " scenarios.");
  for (var i = 0; candidates && i < candidates.length; i++) {
    var r = fldCustomValidate(candidates[i]);
    if (!r.ok) { errors.push("Scenario " + (i + 1) + " invalid: " + r.errors.join("; ")); continue; }
    if (seen[r.scenario.id]) { errors.push("Duplicate scenario id in pack: " + r.scenario.id); continue; }
    seen[r.scenario.id] = true;
    scenarios.push(r.scenario);
    if (r.warnings && r.warnings.length) warnings = warnings.concat(r.warnings);
  }
  install = null;
  if (!errors.length && opts && opts.install) {
    install = fldCustomInstallPack(scenarios);
    if (!install.ok) errors = errors.concat(install.errors || []);
  }
  return {
    ok: !errors.length,
    errors: errors,
    warnings: warnings,
    scenarios: scenarios,
    drafts: scenarios.map(function (s) { return _fldCbDraftFromScenario(s); }),
    saved: install ? install.saved : 0,
    slots: install ? install.slots : []
  };
}
function fldCustomLoadStore() {
  try {
    var raw = localStorage.getItem(FLDCB_STORE);
    if (!raw) return { version: 1, slots: [] };
    var parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.slots)) return { version: 1, slots: [] };
    return parsed;
  } catch (e) { return { version: 1, slots: [] }; }
}
function fldCustomWriteStore(store) {
  try { localStorage.setItem(FLDCB_STORE, JSON.stringify(store || { version: 1, slots: [] })); return true; }
  catch (e) { return false; }
}
function fldCustomListSlots() {
  var st = fldCustomLoadStore(), out = [];
  for (var i = 0; i < FLDCB_SLOTS; i++) out.push(st.slots[i] || null);
  return out;
}
function fldCustomSaveScenario(slot, scenario) {
  slot = _fldCbInt(slot, 0, 0, FLDCB_SLOTS - 1);
  var r = fldCustomValidate(scenario || _fldCbState);
  if (!r.ok) return r;
  var st = fldCustomLoadStore();
  while (st.slots.length < FLDCB_SLOTS) st.slots.push(null);
  st.slots[slot] = { id: r.scenario.id, name: r.scenario.name, updatedAt: new Date().toISOString(), scenario: r.scenario };
  if (!fldCustomWriteStore(st)) return { ok: false, errors: ["Could not write local persistence slot."], warnings: [], scenario: r.scenario };
  return r;
}
function fldCustomDeleteSlot(slot) {
  slot = _fldCbInt(slot, 0, 0, FLDCB_SLOTS - 1);
  var st = fldCustomLoadStore();
  while (st.slots.length < FLDCB_SLOTS) st.slots.push(null);
  st.slots[slot] = null;
  return fldCustomWriteStore(st);
}
function fldCustomScenarioData(id) {
  if (!id || String(id).indexOf("custom_") !== 0) return null;
  if (_fldCbActiveScenario && _fldCbActiveScenario.id === id) return _fldCbActiveScenario;
  var slots = fldCustomListSlots();
  for (var i = 0; i < slots.length; i++) {
    if (slots[i] && slots[i].scenario && slots[i].scenario.id === id) {
      var r = fldCustomValidate(slots[i].scenario);
      if (r.ok) return r.scenario;
    }
  }
  return null;
}

function _fldCbEnsureState() { if (!_fldCbState) _fldCbState = fldCustomDefaultDraft(); }
function _fldCbVal(k) { return _fldCbEsc((_fldCbState && _fldCbState[k]) || ""); }
function _fldCbObjVal(obj, k) { return _fldCbEsc((obj && obj[k]) == null ? "" : obj[k]); }
function _fldCbNumInput(name, value, min, max, step) {
  return '<input type="number" data-cb-field="' + name + '" value="' + _fldCbEsc(value) + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '">';
}
/* S23 (D233): the status block is the announcement surface — role="alert" on a blocked result (announced on
   insertion) / role="status" otherwise, and tabindex="-1" so _fldCbRefresh can MOVE FOCUS onto it after
   Validate / a blocked Launch / an Import, making the outcome audible instead of a silent re-render. */
function _fldCbStatusHtml() {
  if (!_fldCbLast) return '<div class="fld-cb-status muted" role="status" tabindex="-1">Single-phase V1. Phase authoring is intentionally deferred until its editor can be probed as safely as authored phase data.</div>';
  var cls = _fldCbLast.ok ? "ok" : "bad";
  var html = '<div class="fld-cb-status ' + cls + '" role="' + (_fldCbLast.ok ? "status" : "alert") + '" tabindex="-1"><b>' + (_fldCbLast.ok ? "Valid scenario" : "Validation blocked") + '</b>';
  if (_fldCbLast.errors && _fldCbLast.errors.length) html += '<ul>' + _fldCbLast.errors.map(function (e) { return '<li>' + _fldCbEsc(e) + '</li>'; }).join("") + '</ul>';
  if (_fldCbLast.warnings && _fldCbLast.warnings.length) html += '<ul class="warn">' + _fldCbLast.warnings.slice(0, 8).map(function (e) { return '<li>' + _fldCbEsc(e) + '</li>'; }).join("") + '</ul>';
  html += '</div>';
  return html;
}
function _fldCbSelect(val, list, attr) {
  var h = '<select ' + attr + '>';
  for (var i = 0; i < list.length; i++) {
    var x = list[i], v = Array.isArray(x) ? x[0] : x, label = Array.isArray(x) ? x[1] : x;
    h += '<option value="' + _fldCbEsc(v) + '"' + (String(val) === String(v) ? " selected" : "") + '>' + _fldCbEsc(label) + '</option>';
  }
  return h + '</select>';
}
/* S21 (D233): every editor-table control carries an accessible name (row identity + column — WCAG 4.1.2 /
   3.3.2; a unit row was 13 fields a screen reader announced as "edit text, blank"). S26: numeric cells add
   inputmode so mobile pops the right keypad — pass "decimal" for FRACTIONAL fields (leader quality 0.7-1.35,
   facing radians, hill height): a plain "numeric" keypad has no decimal separator on iOS/Android. */
function _fldCbCell(list, idx, key, val, label, numeric) {
  var im = numeric ? (numeric === "decimal" ? ' inputmode="decimal"' : ' inputmode="numeric"') : "";
  return '<td><input data-cb-list="' + list + '" data-cb-idx="' + idx + '" data-cb-key="' + key + '" aria-label="' + _fldCbEsc(label) + '"' + im + ' value="' + val + '"></td>';
}
function _fldCbRowName(d, fallback) { return (d && d.name ? String(d.name) : fallback); }
function _fldCbTerrainRows(kind) {
  var arr = (_fldCbState.terrain && _fldCbState.terrain[kind]) || [], h = "";
  for (var i = 0; i < arr.length; i++) {
    var d = arr[i], rn = kind.replace(/s$/, "") + " " + (i + 1);
    h += '<tr>';
    if (kind === "hills") h += _fldCbCell("terrain.hills", i, "x", _fldCbObjVal(d, "x"), rn + " — x", true) + _fldCbCell("terrain.hills", i, "z", _fldCbObjVal(d, "z"), rn + " — z", true) + _fldCbCell("terrain.hills", i, "h", _fldCbObjVal(d, "h"), rn + " — height", "decimal") + _fldCbCell("terrain.hills", i, "s", _fldCbObjVal(d, "s"), rn + " — spread", true);
    if (kind === "woods") h += _fldCbCell("terrain.woods", i, "x", _fldCbObjVal(d, "x"), rn + " — x", true) + _fldCbCell("terrain.woods", i, "z", _fldCbObjVal(d, "z"), rn + " — z", true) + _fldCbCell("terrain.woods", i, "r", _fldCbObjVal(d, "r"), rn + " — radius", true);
    if (kind === "walls") h += _fldCbCell("terrain.walls", i, "x1", _fldCbObjVal(d, "x1"), rn + " — x1", true) + _fldCbCell("terrain.walls", i, "z1", _fldCbObjVal(d, "z1"), rn + " — z1", true) + _fldCbCell("terrain.walls", i, "x2", _fldCbObjVal(d, "x2"), rn + " — x2", true) + _fldCbCell("terrain.walls", i, "z2", _fldCbObjVal(d, "z2"), rn + " — z2", true);
    h += '<td><button class="mini" data-cb-act="del-' + kind + '" data-idx="' + i + '" aria-label="Remove ' + _fldCbEsc(rn) + '">Remove</button></td></tr>';
  }
  return h || '<tr><td colspan="5" class="muted">None</td></tr>';
}
function _fldCbMarkerRows() {
  var arr = (_fldCbState.terrain && _fldCbState.terrain.markers) || [], h = "";
  for (var i = 0; i < arr.length; i++) {
    var d = arr[i];
    var mn = _fldCbRowName(d, "marker " + (i + 1));
    h += '<tr><td>' + _fldCbSelect(d.kind || "label", [["label", "Label"], ["road", "Road"], ["creek", "Creek"], ["bridge", "Bridge"], ["ford", "Ford"]], 'data-cb-list="terrain.markers" data-cb-idx="' + i + '" data-cb-key="kind" aria-label="' + _fldCbEsc(mn + " — kind") + '"') + '</td>'
      + _fldCbCell("terrain.markers", i, "name", _fldCbObjVal(d, "name"), mn + " — name")
      + _fldCbCell("terrain.markers", i, "x", _fldCbObjVal(d, "x"), mn + " — x", true)
      + _fldCbCell("terrain.markers", i, "z", _fldCbObjVal(d, "z"), mn + " — z", true)
      + '<td><input data-cb-list="terrain.markers" data-cb-idx="' + i + '" data-cb-key="path" aria-label="' + _fldCbEsc(mn + " — path points") + '" value="' + _fldCbObjVal(d, "path") + '" placeholder="x,z;x,z"></td>'
      + '<td><button class="mini" data-cb-act="del-markers" data-idx="' + i + '" aria-label="Remove ' + _fldCbEsc(mn) + '">Remove</button></td></tr>';
  }
  return h || '<tr><td colspan="6" class="muted">None</td></tr>';
}
function _fldCbUnitRows() {
  var arr = _fldCbState.units || [], h = "";
  for (var i = 0; i < arr.length; i++) {
    var d = arr[i];
    var un = _fldCbRowName(d, "unit " + (i + 1));
    h += '<tr><td>' + _fldCbSelect(d.side || "US", ["US", "CS"], 'data-cb-list="units" data-cb-idx="' + i + '" data-cb-key="side" aria-label="' + _fldCbEsc(un + " — side") + '"') + '</td>'
      + _fldCbCell("units", i, "id", _fldCbObjVal(d, "id"), un + " — id")
      + _fldCbCell("units", i, "name", _fldCbObjVal(d, "name"), un + " — name")
      + _fldCbCell("units", i, "commander", _fldCbObjVal(d, "commander"), un + " — commander")
      + '<td>' + _fldCbSelect(d.arm || "inf", [["inf", "Inf"], ["art", "Art"], ["cav", "Cav"]], 'data-cb-list="units" data-cb-idx="' + i + '" data-cb-key="arm" aria-label="' + _fldCbEsc(un + " — arm") + '"') + '</td>'
      + '<td>' + _fldCbSelect(d.weapon || "rifled", ["rifled", "smooth", "carbine"], 'data-cb-list="units" data-cb-idx="' + i + '" data-cb-key="weapon" aria-label="' + _fldCbEsc(un + " — weapon") + '"') + '</td>'
      + _fldCbCell("units", i, "men", _fldCbObjVal(d, "men"), un + " — men", true)
      + _fldCbCell("units", i, "guns", _fldCbObjVal(d, "guns"), un + " — guns", true)
      + _fldCbCell("units", i, "x", _fldCbObjVal(d, "x"), un + " — x", true)
      + _fldCbCell("units", i, "z", _fldCbObjVal(d, "z"), un + " — z", true)
      + _fldCbCell("units", i, "facing", _fldCbObjVal(d, "facing"), un + " — facing", "decimal")
      + _fldCbCell("units", i, "xp", _fldCbObjVal(d, "xp"), un + " — experience", true)
      + _fldCbCell("units", i, "atSec", _fldCbObjVal(d, "atSec"), un + " — arrival second", true)
      + '<td><button class="mini" data-cb-act="del-unit" data-idx="' + i + '" aria-label="Remove ' + _fldCbEsc(un) + '">Remove</button></td></tr>';
  }
  return h || '<tr><td colspan="14" class="muted">No units</td></tr>';
}
function _fldCbLeaderRows() {
  var arr = _fldCbState.leaders || [], h = "";
  for (var i = 0; i < arr.length; i++) {
    var d = arr[i];
    var ln = _fldCbRowName(d, "leader " + (i + 1));
    h += '<tr><td>' + _fldCbSelect(d.side || "US", ["US", "CS"], 'data-cb-list="leaders" data-cb-idx="' + i + '" data-cb-key="side" aria-label="' + _fldCbEsc(ln + " — side") + '"') + '</td>'
      + _fldCbCell("leaders", i, "id", _fldCbObjVal(d, "id"), ln + " — id")
      + _fldCbCell("leaders", i, "name", _fldCbObjVal(d, "name"), ln + " — name")
      + _fldCbCell("leaders", i, "quality", _fldCbObjVal(d, "quality"), ln + " — quality", "decimal")
      + _fldCbCell("leaders", i, "radius", _fldCbObjVal(d, "radius"), ln + " — command radius", true)
      + _fldCbCell("leaders", i, "x", _fldCbObjVal(d, "x"), ln + " — x", true)
      + _fldCbCell("leaders", i, "z", _fldCbObjVal(d, "z"), ln + " — z", true)
      + _fldCbCell("leaders", i, "attach", _fldCbObjVal(d, "attach"), ln + " — attached unit id")
      + '<td><button class="mini" data-cb-act="del-leader" data-idx="' + i + '" aria-label="Remove ' + _fldCbEsc(ln) + '">Remove</button></td></tr>';
  }
  return h || '<tr><td colspan="9" class="muted">No leaders</td></tr>';
}
function _fldCbCardRows() {
  var arr = _fldCbState.teachingCards || [], h = "";
  for (var i = 0; i < arr.length; i++) {
    var d = arr[i];
    var cn = (d && d.head) ? String(d.head) : ("teaching card " + (i + 1));
    h += '<tr>' + _fldCbCell("teachingCards", i, "id", _fldCbObjVal(d, "id"), cn + " — id")
      + _fldCbCell("teachingCards", i, "head", _fldCbObjVal(d, "head"), cn + " — heading")
      + _fldCbCell("teachingCards", i, "body", _fldCbObjVal(d, "body"), cn + " — body")
      + _fldCbCell("teachingCards", i, "provenance", _fldCbObjVal(d, "provenance"), cn + " — provenance")
      + '<td><button class="mini" data-cb-act="del-card" data-idx="' + i + '" aria-label="Remove ' + _fldCbEsc(cn) + '">Remove</button></td></tr>';
  }
  return h || '<tr><td colspan="5" class="muted">No teaching cards</td></tr>';
}
function _fldCbSlotsHtml() {
  var slots = fldCustomListSlots(), h = "";
  for (var i = 0; i < slots.length; i++) {
    var s = slots[i], label = s ? _fldCbEsc(s.name) + '<small>' + _fldCbEsc(s.updatedAt || "") + '</small>' : '<span class="muted">Empty slot</span>';
    h += '<div class="fld-cb-slot"><b>Slot ' + (i + 1) + '</b><span>' + label + '</span><button class="mini" data-cb-act="save-slot" data-slot="' + i + '">Save</button><button class="mini" data-cb-act="load-slot" data-slot="' + i + '"' + (s ? "" : " disabled") + '>Load</button><button class="mini" data-cb-act="delete-slot" data-slot="' + i + '"' + (s ? "" : " disabled") + '>Delete</button></div>';
  }
  return h;
}
function _fldCbHtml() {
  _fldCbEnsureState();
  var o = _fldCbState.objective || {}, us = (_fldCbState.sideCopy && _fldCbState.sideCopy.US) || {}, cs = (_fldCbState.sideCopy && _fldCbState.sideCopy.CS) || {}, br = _fldCbState.brief || {}, sp = _fldCbState.supply || {};
  /* S25 (D245): the builder skin consumes the shared H0 --h0d-* token set (values pinned to the
     99-h0-president-desk definitions by a probe tooth) — the invented brass/parchment palette is gone.
     Contrast (worst pair, on the darker panel/sheet grounds): muted labels 9.9:1, warn text 7.5:1,
     brass input border 9.0:1, red status border 3.8:1 non-text — all ≥ AA. */
  return '<style>.fld-cb{--h0d-panel:#111918;--h0d-panel2:#17231f;--h0d-ink:#f3efe4;--h0d-muted:#c5cdc3;--h0d-brass:#d8b458;--h0d-green:#5f9273;--h0d-red:#b35a50;--h0d-warn:#d0a047;--h0d-focus:#ffe27a;--h0d-line:rgba(216,180,88,.27);max-width:1180px}.fld-cb h1{margin:0 0 8px}.fld-cb h2{font-size:18px;margin:16px 0 8px}.fld-cb-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.fld-cb label{display:grid;gap:4px;font-size:12px;color:var(--h0d-muted)}.fld-cb input,.fld-cb select,.fld-cb textarea{box-sizing:border-box;width:100%;background:var(--h0d-panel);color:var(--h0d-ink);border:1px solid var(--h0d-brass);border-radius:4px;padding:6px}.fld-cb textarea{min-height:190px;font:12px ui-monospace,Menlo,monospace}.fld-cb-table{overflow:auto;border:1px solid var(--h0d-line);border-radius:6px}.fld-cb table{width:100%;border-collapse:collapse;min-width:760px}.fld-cb th,.fld-cb td{border-bottom:1px solid var(--h0d-line);padding:4px;text-align:left}.fld-cb th{font-size:11px;color:var(--h0d-muted)}.fld-cb td input,.fld-cb td select{min-width:74px;padding:4px}.fld-cb-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.fld-cb .mini{padding:5px 8px;border-radius:4px}.fld-cb-status{padding:8px;border-radius:6px;border:1px solid var(--h0d-line);background:var(--h0d-panel)}.fld-cb-status.ok{border-color:var(--h0d-green)}.fld-cb-status.bad{border-color:var(--h0d-red)}.fld-cb-status ul{margin:6px 0 0 18px}.fld-cb-status .warn{color:var(--h0d-warn)}.fld-cb .muted{color:var(--h0d-muted)}.fld-cb-slot{display:grid;grid-template-columns:70px 1fr auto auto auto;gap:6px;align-items:center;border-bottom:1px solid var(--h0d-line);padding:5px 0}.fld-cb-slot small{display:block;color:var(--h0d-muted)}.fld-cb-wide{grid-column:span 2}@media(max-width:850px){.fld-cb-grid{grid-template-columns:1fr}.fld-cb-wide{grid-column:span 1}.fld-cb-slot{grid-template-columns:1fr 1fr}.fld-cb-slot span{grid-column:1/-1}}</style>'
    + '<div class="fld-cb upg"><h1>Custom Battle Builder</h1>' + _fldCbStatusHtml()
    + '<div class="fld-cb-actions"><button data-cb-act="validate">Validate</button><button data-cb-act="launch">Launch</button><button data-cb-act="export">Export Scenario</button><button data-cb-act="import">Import Scenario</button><button data-cb-act="export-pack">Export Pack</button><button data-cb-act="import-pack">Import Pack to Slots</button><button data-cb-act="template">Template</button><button data-cb-act="reset">New Draft</button><button onclick="openMainMenu()">Main Menu</button></div>'
    + '<h2>Scenario</h2><div class="fld-cb-grid"><label>Name<input data-cb-field="name" value="' + _fldCbVal("name") + '"></label><label>ID<input data-cb-field="id" value="' + _fldCbVal("id") + '"></label><label>Date<input data-cb-field="date" value="' + _fldCbVal("date") + '"></label><label>Place<input data-cb-field="place" value="' + _fldCbVal("place") + '"></label><label>Attacker' + _fldCbSelect(_fldCbState.attacker || "US", ["US", "CS"], 'data-cb-field="attacker"') + '</label><label>Defender' + _fldCbSelect(_fldCbState.defender || "CS", ["CS", "US"], 'data-cb-field="defender"') + '</label><label>Fog' + _fldCbSelect(_fldCbState.defaultFog ? "yes" : "no", [["no", "Off"], ["yes", "On"]], 'data-cb-field="defaultFog"') + '</label><label>Doctrine' + _fldCbSelect(_fldCbState.assaultDoctrine || "standard", [["standard", "Standard"], ["cautious", "Cautious"]], 'data-cb-field="assaultDoctrine"') + '</label><label>Field W' + _fldCbNumInput("fieldW", _fldCbState.fieldW, 700, 1800) + '</label><label>Field H' + _fldCbNumInput("fieldH", _fldCbState.fieldH, 550, 1400) + '</label><label>Time limit' + _fldCbNumInput("timeLimitSec", _fldCbState.timeLimitSec, 180, 1800) + '</label><label>Hold to win' + _fldCbNumInput("holdToWinSec", _fldCbState.holdToWinSec, 20, 600) + '</label></div>'
    + '<h2>Objective</h2><div class="fld-cb-grid"><label>Name<input data-cb-obj="objective" data-cb-key="name" value="' + _fldCbObjVal(o, "name") + '"></label><label>X<input data-cb-obj="objective" data-cb-key="x" value="' + _fldCbObjVal(o, "x") + '"></label><label>Z<input data-cb-obj="objective" data-cb-key="z" value="' + _fldCbObjVal(o, "z") + '"></label><label>Radius<input data-cb-obj="objective" data-cb-key="r" value="' + _fldCbObjVal(o, "r") + '"></label></div>'
    + '<h2>Sides</h2><div class="fld-cb-grid"><label class="fld-cb-wide">Union title<input data-cb-obj="sideCopy.US" data-cb-key="title" value="' + _fldCbObjVal(us, "title") + '"></label><label class="fld-cb-wide">Union deck<input data-cb-obj="sideCopy.US" data-cb-key="deck" value="' + _fldCbObjVal(us, "deck") + '"></label><label class="fld-cb-wide">Confederate title<input data-cb-obj="sideCopy.CS" data-cb-key="title" value="' + _fldCbObjVal(cs, "title") + '"></label><label class="fld-cb-wide">Confederate deck<input data-cb-obj="sideCopy.CS" data-cb-key="deck" value="' + _fldCbObjVal(cs, "deck") + '"></label><label class="fld-cb-wide">Attack brief<input data-cb-obj="brief" data-cb-key="attack" value="' + _fldCbObjVal(br, "attack") + '"></label><label class="fld-cb-wide">Defense brief<input data-cb-obj="brief" data-cb-key="defend" value="' + _fldCbObjVal(br, "defend") + '"></label></div>'
    + '<h2>Terrain</h2><div class="fld-cb-actions"><button class="mini" data-cb-act="add-hills">Add Hill</button><button class="mini" data-cb-act="add-woods">Add Woods</button><button class="mini" data-cb-act="add-walls">Add Wall</button><button class="mini" data-cb-act="add-marker">Add Marker</button></div><div class="fld-cb-table"><table><thead><tr><th colspan="5">Hills x z height spread</th></tr></thead><tbody>' + _fldCbTerrainRows("hills") + '</tbody></table><table><thead><tr><th colspan="4">Woods x z radius</th></tr></thead><tbody>' + _fldCbTerrainRows("woods") + '</tbody></table><table><thead><tr><th colspan="5">Walls x1 z1 x2 z2</th></tr></thead><tbody>' + _fldCbTerrainRows("walls") + '</tbody></table><table><thead><tr><th>Kind</th><th>Name</th><th>X</th><th>Z</th><th>Path</th><th></th></tr></thead><tbody>' + _fldCbMarkerRows() + '</tbody></table></div>'
    + '<h2>Order of Battle</h2><div class="fld-cb-actions"><button class="mini" data-cb-act="add-unit">Add Unit</button></div><div class="fld-cb-table"><table><thead><tr><th>Side</th><th>ID</th><th>Name</th><th>Commander</th><th>Arm</th><th>Weapon</th><th>Men</th><th>Guns</th><th>X</th><th>Z</th><th>Facing</th><th>XP</th><th>At sec</th><th></th></tr></thead><tbody>' + _fldCbUnitRows() + '</tbody></table></div>'
    + '<h2>Leaders, Supply, Teaching</h2><div class="fld-cb-actions"><button class="mini" data-cb-act="add-leader">Add Leader</button><button class="mini" data-cb-act="add-card">Add Teaching Card</button></div><div class="fld-cb-table"><table><thead><tr><th>Side</th><th>ID</th><th>Name</th><th>Quality</th><th>Radius</th><th>X</th><th>Z</th><th>Attach</th><th></th></tr></thead><tbody>' + _fldCbLeaderRows() + '</tbody></table><table><thead><tr><th>ID</th><th>Head</th><th>Body</th><th>Provenance</th><th></th></tr></thead><tbody>' + _fldCbCardRows() + '</tbody></table></div><div class="fld-cb-grid"><label>Union supply name<input data-cb-obj="supply.US" data-cb-key="name" value="' + _fldCbObjVal(sp.US, "name") + '"></label><label>Union supply X<input data-cb-obj="supply.US" data-cb-key="x" value="' + _fldCbObjVal(sp.US, "x") + '"></label><label>Union supply Z<input data-cb-obj="supply.US" data-cb-key="z" value="' + _fldCbObjVal(sp.US, "z") + '"></label><label>Provenance<input data-cb-field="provenance" value="' + _fldCbVal("provenance") + '"></label><label>Confed supply name<input data-cb-obj="supply.CS" data-cb-key="name" value="' + _fldCbObjVal(sp.CS, "name") + '"></label><label>Confed supply X<input data-cb-obj="supply.CS" data-cb-key="x" value="' + _fldCbObjVal(sp.CS, "x") + '"></label><label>Confed supply Z<input data-cb-obj="supply.CS" data-cb-key="z" value="' + _fldCbObjVal(sp.CS, "z") + '"></label></div>'
    + '<h2>Persistence</h2><div>' + _fldCbSlotsHtml() + '</div><h2>Import / Export</h2><textarea id="fldCbJson" spellcheck="false" aria-label="Custom battle scenario or pack JSON"></textarea></div>';
}
function _fldCbSetPath(path, key, val) {
  var parts = path.split("."), obj = _fldCbState;
  for (var i = 0; i < parts.length; i++) { obj[parts[i]] = obj[parts[i]] || {}; obj = obj[parts[i]]; }
  obj[key] = val;
}
function _fldCbReadForm() {
  _fldCbEnsureState();
  var nodes = document.querySelectorAll("[data-cb-field]");
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i], k = n.getAttribute("data-cb-field");
    if (k === "defaultFog") _fldCbState[k] = n.value === "yes";
    else _fldCbState[k] = n.value;
  }
  nodes = document.querySelectorAll("[data-cb-obj]");
  for (i = 0; i < nodes.length; i++) {
    n = nodes[i]; _fldCbSetPath(n.getAttribute("data-cb-obj"), n.getAttribute("data-cb-key"), n.value);
  }
  nodes = document.querySelectorAll("[data-cb-list]");
  for (i = 0; i < nodes.length; i++) {
    n = nodes[i];
    var list = n.getAttribute("data-cb-list"), idx = +n.getAttribute("data-cb-idx"), key = n.getAttribute("data-cb-key");
    var arr = null;
    if (list === "units") arr = _fldCbState.units;
    else if (list === "leaders") arr = _fldCbState.leaders;
    else if (list === "teachingCards") arr = _fldCbState.teachingCards;
    else if (list.indexOf("terrain.") === 0) arr = _fldCbState.terrain[list.split(".")[1]];
    if (arr && arr[idx]) arr[idx][key] = n.value;
  }
}
/* S22 (D233): openSheet rebuilds the whole sheet and dropped focus to <body> on EVERY edit action; restore
   it to the acted-on control (the T6 _fldPresetRerender convention) so keyboard users keep their place. */
function _fldCbRefresh(focusSel) {
  if (typeof openSheet === "function") {
    openSheet(_fldCbHtml()); _fldCbWire();
    if (focusSel) { try { var el = document.querySelector(focusSel); if (el) el.focus(); } catch (e) {} }
  }
}
/* S24 (D233): destructive actions (New Draft / Import / Import Pack / Load slot) confirm before discarding
   an UNSAVED in-progress draft. The clean baseline refreshes on first open, save, load, import, and reset —
   builder state was only ever persisted on an explicit Save-slot, so a misclick was unrecoverable. */
var _fldCbCleanJson = null;
/* the canonical compare stringifies every primitive — _fldCbReadForm coerces numbers to input-value STRINGS
   (1500 -> "1500"), so a raw JSON.stringify compare would false-dirty a draft the player never touched. The
   snapshot also runs a readForm pass first (when the form is mounted) so the baseline carries the same
   form-round-trip shape (readForm materializes empty supply/brief sub-objects) as every later compare —
   which is why call sites snapshot AFTER _fldCbRefresh renders the state they are baselining. */
function _fldCbCanon(o) { return JSON.stringify(o, function (k, v) { return (v == null || typeof v === "object") ? v : String(v); }); }
function _fldCbSnapshot() {
  try { if (document.querySelector(".fld-cb")) _fldCbReadForm(); } catch (e0) {}
  try { _fldCbCleanJson = _fldCbCanon(_fldCbState); } catch (e) { _fldCbCleanJson = null; }
}
function _fldCbConfirmDiscard(what) {
  _fldCbReadForm();
  var dirty = false;
  try { dirty = (_fldCbCleanJson != null && _fldCbCanon(_fldCbState) !== _fldCbCleanJson); } catch (e) {}
  if (!dirty) return true;
  try { return window.confirm(what + " will replace your unsaved draft. Continue?"); } catch (e2) { return true; }
}
function _fldCbAdd(kind) {
  _fldCbReadForm();
  if (kind === "hills") _fldCbState.terrain.hills.push({ x: 600, z: 450, h: 14, s: 150 });
  if (kind === "woods") _fldCbState.terrain.woods.push({ x: 300, z: 450, r: 120 });
  if (kind === "walls") _fldCbState.terrain.walls.push({ x1: 480, z1: 430, x2: 720, z2: 430 });
  if (kind === "marker") _fldCbState.terrain.markers.push({ kind: "label", name: "Marker", x: 600, z: 450, path: "" });
  if (kind === "unit") _fldCbState.units.push({ side: "US", id: "us_new", name: "New Brigade", commander: "", arm: "inf", weapon: "rifled", men: 1500, guns: 0, xp: 2, x: 500, z: 720, facing: 0, formation: "line", atSec: 0 });
  if (kind === "leader") _fldCbState.leaders.push({ side: "US", id: "us_leader_new", name: "New Leader", quality: 1.05, radius: 180, x: 520, z: 700, attach: "" });
  if (kind === "card") _fldCbState.teachingCards.push({ id: "custom_note_new", head: "Custom note", body: "", provenance: _fldCbState.provenance || "Player-authored." });
  _fldCbRefresh('[data-cb-act="add-' + (kind === "marker" ? "marker" : kind) + '"]');
}
function _fldCbDel(kind, idx) {
  _fldCbReadForm();
  var arr = null;
  if (kind === "unit") arr = _fldCbState.units;
  if (kind === "leader") arr = _fldCbState.leaders;
  if (kind === "card") arr = _fldCbState.teachingCards;
  if (kind === "hills" || kind === "woods" || kind === "walls" || kind === "markers") arr = _fldCbState.terrain[kind];
  if (arr) arr.splice(+idx, 1);
  var addAct = { unit: "add-unit", leader: "add-leader", card: "add-card", hills: "add-hills", woods: "add-woods", walls: "add-walls", markers: "add-marker" }[kind];
  _fldCbRefresh(addAct ? '[data-cb-act="' + addAct + '"]' : null);
}
function _fldCbWire() {
  var root = document.querySelector(".fld-cb"); if (!root) return;
  root.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-cb-act]"); if (!b) return;
    ev.preventDefault();
    var act = b.getAttribute("data-cb-act");
    if (act === "validate") { _fldCbReadForm(); _fldCbLast = fldCustomValidate(_fldCbState); _fldCbRefresh(".fld-cb-status"); return; }
    if (act === "export") { _fldCbReadForm(); _fldCbLast = fldCustomValidate(_fldCbState); _fldCbRefresh(_fldCbLast.ok ? "#fldCbJson" : ".fld-cb-status"); var ta = document.getElementById("fldCbJson"); if (ta && _fldCbLast.ok) ta.value = _fldCbLast.json; return; }
    if (act === "import") { if (!_fldCbConfirmDiscard("Import")) return; var ta2 = document.getElementById("fldCbJson"); _fldCbLast = fldCustomImportJson(ta2 ? ta2.value : ""); var impOk = _fldCbLast.ok; if (impOk) _fldCbState = _fldCbLast.draft; _fldCbRefresh(".fld-cb-status"); if (impOk) _fldCbSnapshot(); return; }
    if (act === "export-pack") { _fldCbReadForm(); var pk = fldCustomExportPack(); _fldCbLast = { ok: pk.ok, errors: pk.errors, warnings: pk.warnings, scenario: pk.scenarios[0] || null }; _fldCbRefresh(pk.ok ? "#fldCbJson" : ".fld-cb-status"); var ta3 = document.getElementById("fldCbJson"); if (ta3 && pk.ok) ta3.value = pk.json; return; }
    if (act === "import-pack") { if (!_fldCbConfirmDiscard("Import Pack")) return; var ta4 = document.getElementById("fldCbJson"); var pr = fldCustomImportPackJson(ta4 ? ta4.value : "", { install: true }); _fldCbLast = { ok: pr.ok, errors: pr.errors, warnings: pr.warnings.concat(pr.ok ? ["Installed " + pr.saved + " scenario(s) into empty local slots."] : []), scenario: pr.scenarios[0] || null }; var pkOk = pr.ok && pr.drafts[0]; if (pkOk) _fldCbState = pr.drafts[0]; _fldCbRefresh(".fld-cb-status"); if (pkOk) _fldCbSnapshot(); return; }
    if (act === "template") { _fldCbRefresh("#fldCbJson"); var ta5 = document.getElementById("fldCbJson"); if (ta5) ta5.value = fldCustomTemplateJson(); return; }
    // S23 (D233): a BLOCKED launch re-renders with focus moved onto the role="alert" status region, so a
    // non-sighted player hears why nothing launched instead of a silent no-op.
    if (act === "launch") { _fldCbReadForm(); _fldCbLast = fldCustomValidate(_fldCbState); if (_fldCbLast.ok) { _fldCbActiveScenario = _fldCbLast.scenario; if (typeof fldScenarioSideChoice === "function") fldScenarioSideChoice(_fldCbActiveScenario.id, function (side) { fldLaunchBattle(_fldCbActiveScenario.id, side); }); else if (typeof fldLaunchSandbox === "function") fldLaunchSandbox({ scenario: _fldCbActiveScenario.id, playerSide: "US" }); } else _fldCbRefresh(".fld-cb-status"); return; }
    if (act === "reset") { if (!_fldCbConfirmDiscard("New Draft")) return; _fldCbState = fldCustomDefaultDraft(); _fldCbLast = null; _fldCbRefresh('[data-cb-act="reset"]'); _fldCbSnapshot(); return; }
    if (act.indexOf("add-") === 0) { _fldCbAdd(act.replace("add-", "")); return; }
    if (act.indexOf("del-") === 0) { _fldCbDel(act.replace("del-", ""), b.getAttribute("data-idx")); return; }
    if (act === "save-slot") { _fldCbReadForm(); _fldCbLast = fldCustomSaveScenario(+b.getAttribute("data-slot"), _fldCbState); var svOk = _fldCbLast && _fldCbLast.ok; _fldCbRefresh('[data-cb-act="save-slot"][data-slot="' + b.getAttribute("data-slot") + '"]'); if (svOk) _fldCbSnapshot(); return; }
    if (act === "load-slot") { if (!_fldCbConfirmDiscard("Load slot")) return; var slots = fldCustomListSlots(), s = slots[+b.getAttribute("data-slot")]; var ldOk = !!(s && s.scenario); if (ldOk) { _fldCbState = _fldCbDraftFromScenario(s.scenario); _fldCbLast = fldCustomValidate(_fldCbState); } _fldCbRefresh('[data-cb-act="load-slot"][data-slot="' + b.getAttribute("data-slot") + '"]'); if (ldOk) _fldCbSnapshot(); return; }
    if (act === "delete-slot") { fldCustomDeleteSlot(+b.getAttribute("data-slot")); _fldCbRefresh('[data-cb-act="save-slot"][data-slot="' + b.getAttribute("data-slot") + '"]'); return; }   // focus the slot's SAVE button — the emptied slot's Delete/Load re-render disabled (focus() would no-op to body)
  });
}
function fldCustomBattleBuilderMenu() {
  _fldCbEnsureState();
  if (typeof openSheet !== "function") return;
  openSheet(_fldCbHtml());
  _fldCbWire();
  if (_fldCbCleanJson == null) _fldCbSnapshot();   // S24: baseline on FIRST open only (post-render, so it carries the form round-trip shape) — reopening must not launder unsaved edits
}
function fldCustomInjectBuilderButton() {
  try {
    if (document.getElementById("fldCustomBuilderBtn")) return;
    var afterBtn = document.getElementById("fldPresetBtn") || document.getElementById("fldSkirmishBtn") || document.getElementById("fldSandboxBtn") || document.getElementById("gnFree");
    if (!afterBtn || !afterBtn.parentNode) return;
    var b = document.createElement("button");
    b.className = "gn-btn"; b.id = "fldCustomBuilderBtn";
    b.setAttribute("aria-label", "Custom Battle Builder - author a data-driven tactical scenario.");
    b.innerHTML = '<span class="gn-hl">&#9876; CUSTOM BATTLE BUILDER</span><span class="gn-deck">Create, validate, save, import, export, and launch a single-phase field scenario.</span>';
    b.addEventListener("click", function () { fldCustomBattleBuilderMenu(); });
    if (afterBtn.nextSibling) afterBtn.parentNode.insertBefore(b, afterBtn.nextSibling); else afterBtn.parentNode.appendChild(b);
  } catch (e) {}
}
function fldCustomInstallMenuObserver() {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  try {
    fldCustomInjectBuilderButton();
    var obs = new MutationObserver(function () { fldCustomInjectBuilderButton(); });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
}
if (typeof window !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fldCustomInstallMenuObserver);
  else fldCustomInstallMenuObserver();
}
