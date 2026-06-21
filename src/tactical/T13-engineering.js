/* ============================================================================
   src/tactical/T13-engineering.js  —  THE TACTICAL ENGINEERING CORPS

   Aaron's run-k directive: build the field-engineering effects (entrenchments,
   abatis/obstacles, pontoon bridging, obstacle clearing) that interact with the
   B-5 difficulty/realism sliders. This module hosts the whole corps; it ships in
   vetted increments.

   INCREMENT 1 — FIELD ENTRENCHMENTS (the spade):
     A player brigade ordered to ENTRENCH (key E) digs in where it stands and,
     over time, earns COVER that rises toward a parapet-grade multiplier — the war's
     defining drift toward trench warfare (Cold Harbor, Petersburg). Marching off the
     works abandons them (the cover fades). The dig SPEED and the COVER it yields read
     the B-5 realism slider: Arcade digs fast for modest cover, Historian digs slow
     for strong cover.

   GUARDED + BYTE-IDENTICAL: every seam in T0 is a `typeof fldEng* === "function"`
   call, and each engineering fn is a NO-OP for a unit that never entrenched
   (`u.entrench` is 0/undefined). No historical scenario or AI triggers entrenchment,
   so every existing AI-vs-AI baseline resolves byte-for-byte as before. Entrenchment
   is a PLAYER tool in this increment; scenario/AI-driven works are a later increment.

   FACING-AWARE: a parapet shelters its FRONT (fldEngCover takes the shooter/attacker
   bearing — full bonus in the front arc, half on the flank, none in the rear), so a
   flank/rear maneuver still counters fixed works (bug-hunt 2026-06-20).

   INCREMENT 2 — ABATIS / OBSTACLES (the axe):
     A selected infantry brigade's pioneer detail may build a capped timber belt across
     its front (B). Enemy troops forcing the belt are slowed and disordered; their
     immediate morale and fire cohesion suffer. A nearby brigade may clear a belt (X).
     Realism makes the obstacle bite harder and makes building/clearing slower.

   EXTENSION POINTS (next increment, kept here so the corps grows in one place):
     - PONTOON BRIDGING: a new river terrain feature + a bridge-laying engineer step
       + a crossing gate.  (not yet built)
     - AI / SCENARIO-driven entrenchment (currently player-only). When that lands, also
       carry entrench onto the fog last-seen ghost so a scouted-then-hidden enemy fieldwork
       persists as last-known intel, and re-init the 3D works on phase advance.
   ============================================================================ */

/* the realism coupling (B-5). Derive a realism scale from the live severity bundle
   (attrition is the cleanest realism proxy: Arcade 0.7 / Balanced 1.0 / Historian 1.3).
   Neutral 1.0 when no preset is set -> the entrenchment baseline. */
function fldEngRealism() {
  var a = (typeof __FIELD !== "undefined" && __FIELD.sev && typeof __FIELD.sev.attrition === "number") ? __FIELD.sev.attrition : 1;
  return Math.max(0.6, Math.min(1.4, a));
}

var FLDE = {
  DIG_TIME_BASE: 70,   // sim-seconds to a full parapet at Balanced realism (scaled by realism below)
  MAX_BONUS_BASE: 0.62, // full-entrench cover bonus at Balanced: cover x1.62 (rifle pits -> low parapet)
  WORKS_R: 26,         // yd: march beyond this from the dig site and the works are abandoned
  DECAY_T: 28,         // sim-seconds for abandoned works to fade fully
  ABATIS_BUILD_T: 48,  // balanced sim-seconds for a pioneer detail to finish one belt
  ABATIS_CLEAR_T: 34,  // balanced sim-seconds to open a passage
  ABATIS_HALF_W: 62,   // belt half-width across a brigade front
  ABATIS_DEPTH: 18,    // interaction band around the timber line
  ABATIS_FRONT: 52,    // belt center offset in front of its builder
  ABATIS_WORK_R: 82,   // builder/clearer must stay near the work
  ABATIS_MAX_SIDE: 4   // anti-spam / anti-stalemate cap
};

function fldEngReset() {
  if (typeof __FIELD === "undefined") return;
  __FIELD.engObstacles = null;
  __FIELD._engUsed = null;
  __FIELD._engObsSeq = null;
}

/* per-phase reset (multi-phase battles — Vicksburg/Antietam/Gettysburg): drop the prior sector's
   obstacle belts. Each phase is a fresh field and _fldBuildPhase rebuilds __FIELD.units, so the
   per-unit eng fields are moot. KEEP __FIELD._engUsed so the aggregate teaching card still fires
   if an abatis was used in ANY phase (bug-hunt 2026-06-20: belts were leaking across phases). */
function fldEngPhaseReset() {
  if (typeof __FIELD === "undefined") return;
  __FIELD.engObstacles = null;
  __FIELD._engObsSeq = null;
}

function _fldEngObs() { return (__FIELD.engObstacles || (__FIELD.engObstacles = [])); }
function _fldEngPointSeg(x, z, a) {
  var dx = a.x2 - a.x1, dz = a.z2 - a.z1, l2 = dx * dx + dz * dz;
  var t = l2 ? fldClamp(((x - a.x1) * dx + (z - a.z1) * dz) / l2, 0, 1) : 0;
  var px = a.x1 + t * dx, pz = a.z1 + t * dz, ex = x - px, ez = z - pz;
  return { d2: ex * ex + ez * ez, x: px, z: pz, t: t };
}
function _fldEngOrient(ax, az, bx, bz, cx, cz) { return (bx - ax) * (cz - az) - (bz - az) * (cx - ax); }
function _fldEngCross(ax, az, bx, bz, cx, cz, dx, dz) {
  var a = _fldEngOrient(ax, az, bx, bz, cx, cz), b = _fldEngOrient(ax, az, bx, bz, dx, dz);
  var c = _fldEngOrient(cx, cz, dx, dz, ax, az), d = _fldEngOrient(cx, cz, dx, dz, bx, bz);
  return ((a <= 0 && b >= 0) || (a >= 0 && b <= 0)) && ((c <= 0 && d >= 0) || (c >= 0 && d <= 0));
}

function fldSelAbatis() {
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [];
  if (!sel || !sel.length) return;
  var obs = _fldEngObs(), made = 0;
  for (var i = 0; i < sel.length; i++) {
    var u = sel[i];
    if (!u || !u.alive || u.state === "routing" || u.arm !== "inf") continue;
    var sideN = 0, already = false;
    for (var j = 0; j < obs.length; j++) { if (obs[j].side === u.side && obs[j].strength > 0) sideN++; if (obs[j].builderId === u.id && obs[j].building) already = true; }
    if (already || sideN >= FLDE.ABATIS_MAX_SIDE) continue;
    var fx = Math.sin(u.facing), fz = -Math.cos(u.facing), rx = Math.cos(u.facing), rz = Math.sin(u.facing);
    var cx = u.x + fx * FLDE.ABATIS_FRONT, cz = u.z + fz * FLDE.ABATIS_FRONT;
    var id = "abatis_" + u.side + "_" + (__FIELD._engObsSeq = (__FIELD._engObsSeq || 0) + 1);   // monotonic counter -> globally unique (no same-tick collisions)
    obs.push({ id: id, side: u.side, builderId: u.id, x1: cx - rx * FLDE.ABATIS_HALF_W, z1: cz - rz * FLDE.ABATIS_HALF_W,
      x2: cx + rx * FLDE.ABATIS_HALF_W, z2: cz + rz * FLDE.ABATIS_HALF_W, strength: 0.02, building: true });
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing };
    u.engBuildId = id; u.digging = false; made++;
  }
  if (made) {
    __FIELD._engUsed = __FIELD._engUsed || {}; __FIELD._engUsed.abatis = true;
    if (typeof fldAnnounce === "function") fldAnnounce("Abatis ordered — pioneer details fell timber across the front.");
  } else if (typeof fldAnnounce === "function") fldAnnounce("No infantry pioneer detail is free, or the four-belt limit is reached.");
  if (typeof fldRenderHud === "function") fldRenderHud();
}

function fldSelClearObstacle() {
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [], obs = __FIELD.engObstacles || [];
  if (!sel || !sel.length || !obs.length) return;
  var n = 0;
  for (var i = 0; i < sel.length; i++) {
    var u = sel[i], best = null, bd = FLDE.ABATIS_WORK_R * FLDE.ABATIS_WORK_R;
    if (!u || !u.alive || u.state === "routing" || u.arm !== "inf") continue;
    for (var j = 0; j < obs.length; j++) { var q = _fldEngPointSeg(u.x, u.z, obs[j]); if (obs[j].strength > 0 && q.d2 <= bd) { bd = q.d2; best = obs[j]; } }
    if (!best) continue;
    u.engClearId = best.id; u.engBuildId = null; u.digging = false;
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing }; n++;
  }
  if (n && typeof fldAnnounce === "function") fldAnnounce("Obstacle-clearing ordered — axes open a lane through the timber.");
  else if (typeof fldAnnounce === "function") fldAnnounce("Move infantry within 82 yards of an obstacle before ordering clearance.");
  if (typeof fldRenderHud === "function") fldRenderHud();
}

function fldEngMoveFactor(x, z, u) {
  var obs = (typeof __FIELD !== "undefined") ? __FIELD.engObstacles : null;
  if (!u || !obs || !obs.length) return 1;
  for (var i = 0; i < obs.length; i++) {
    var a = obs[i]; if (!(a.strength > 0.02) || a.side === u.side) continue;
    if (_fldEngPointSeg(x, z, a).d2 <= FLDE.ABATIS_DEPTH * FLDE.ABATIS_DEPTH) {
      var minF = Math.max(0.24, 0.80 - 0.40 * fldEngRealism());
      return 1 - (1 - minF) * a.strength;
    }
  }
  return 1;
}

function fldEngMoveGate(u, x0, z0, x1, z1, dt) {
  var obs = (typeof __FIELD !== "undefined") ? __FIELD.engObstacles : null;
  // a routed unit is already broken (and not slowed — the rout branch bypasses fldMoveFactor); don't
  // keep docking its morale/fatigue as it flees through a belt (matches the module's routing guards).
  if (!u || u.state === "routing" || !obs || !obs.length) return null;
  var touched = null;
  for (var i = 0; i < obs.length; i++) {
    var a = obs[i]; if (!(a.strength >= 0.2) || a.side === u.side) continue;
    if (_fldEngCross(x0, z0, x1, z1, a.x1, a.z1, a.x2, a.z2) || _fldEngPointSeg(x1, z1, a).d2 <= FLDE.ABATIS_DEPTH * FLDE.ABATIS_DEPTH) { touched = a; break; }
  }
  if (touched && u._engObsTouch !== touched.id) {
    u._engObsTouch = touched.id;
    u.engDisorder = Math.max(u.engDisorder || 0, 12 * fldEngRealism() * touched.strength);
    u.morale = Math.max(0, u.morale - (4 + 4 * fldEngRealism()) * touched.strength);
    u.fatigue = Math.min(100, u.fatigue + 5 * touched.strength);
  } else if (!touched) u._engObsTouch = null;
  return null;
}

function fldEngFireFactor(u) { return (u && u.engDisorder > 0) ? 0.72 : 1; }

/* the earned-cover multiplier for a unit (>=1). Returns EXACTLY 1 for any unit that
   is not entrenched -> the fire/melee cover seams are byte-identical for every baseline.
   FACING-AWARE: a parapet shelters the direction it FACES. Pass the shooter/attacker
   world position (fromX,fromZ) and the EARNED bonus is full in the front arc, half on the
   flank, and zero in the rear — so a flank/rear maneuver still counters fixed works (and
   matches the one-sided berm we render). With no bearing (the HUD call) it reads the
   nominal front-facing strength. */
function fldEngCover(u, fromX, fromZ) {
  if (!u || !u.entrench || u.entrench <= 0) return 1;
  var arc = 1;
  if (fromX != null && fromZ != null && typeof u.facing === "number" && typeof fldAngDiff === "function") {
    var bearing = Math.atan2(fromX - u.x, -(fromZ - u.z));   // world bearing from the unit toward the shooter
    var rel = Math.abs(fldAngDiff(bearing, u.facing));
    arc = rel > Math.PI * 0.72 ? 0 : (rel > Math.PI * 0.28 ? 0.5 : 1);   // front full / flank half / rear none
  }
  return 1 + u.entrench * (FLDE.MAX_BONUS_BASE * fldEngRealism()) * arc;
}

/* advance entrenchment each sim tick. NO-OP for any clean unit (the loop body never
   runs unless a unit is digging or already has works), so baselines are byte-identical. */
function fldEngStep(dt) {
  if (typeof __FIELD === "undefined" || !__FIELD.units) return;
  var rate = 1 / (FLDE.DIG_TIME_BASE * fldEngRealism());   // entrench progress per sim-second
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i];
    if (!u.alive) continue;
    if (u.engDisorder > 0) u.engDisorder = Math.max(0, u.engDisorder - dt);
    if (u.digging || u.entrench > 0) {
      // left the works? (marched off the dig site, or no site recorded)
      var leftWorks = (u.digX == null) ||
        ((u.x - u.digX) * (u.x - u.digX) + (u.z - u.digZ) * (u.z - u.digZ) > FLDE.WORKS_R * FLDE.WORKS_R);
      if (leftWorks) {
        u.digging = false;
        if (u.entrench > 0) u.entrench = Math.max(0, u.entrench - dt / FLDE.DECAY_T);
      } else if (u.digging && u.order && u.order.type === "hold" && u.state !== "routing") {
        u.entrench = Math.min(1, (u.entrench || 0) + rate * dt);
      }
    }
    // a routed unit drops its tools but keeps any works it is standing in (no progress while routing)
  }
  var obs = __FIELD.engObstacles;
  if (!obs || !obs.length) return;
  for (var j = obs.length - 1; j >= 0; j--) {
    var a = obs[j], b = (typeof fldById === "function") ? fldById(a.builderId) : null;
    if (a.building) {
      var midx = (a.x1 + a.x2) / 2, midz = (a.z1 + a.z2) / 2;
      var near = b && b.alive && b.state !== "routing" && b.order && b.order.type === "hold" &&
        ((b.x - midx) * (b.x - midx) + (b.z - midz) * (b.z - midz) <= FLDE.ABATIS_WORK_R * FLDE.ABATIS_WORK_R);
      if (near) a.strength = Math.min(1, a.strength + dt / (FLDE.ABATIS_BUILD_T * fldEngRealism()));
      else { a.building = false; if (b) b.engBuildId = null; }
      if (a.strength >= 1) { a.building = false; if (b) b.engBuildId = null; }
    } else if (a.strength < 0.2) {
      // an aborted, never-completed belt (builder marched off / fell before it matured past the
      // disorder threshold) falls apart instead of lingering as a free weak-slow stub that
      // permanently consumes a side's ABATIS_MAX_SIDE slot (matches abandoned-entrenchment decay).
      a.strength = Math.max(0, a.strength - dt / FLDE.DECAY_T);
      if (a.strength <= 0) { obs.splice(j, 1); continue; }
    }
    for (var k = 0; k < __FIELD.units.length; k++) {
      var c = __FIELD.units[k]; if (!c.alive || c.state === "routing" || c.engClearId !== a.id) continue;
      var q = _fldEngPointSeg(c.x, c.z, a);
      if (!c.order || c.order.type !== "hold" || q.d2 > FLDE.ABATIS_WORK_R * FLDE.ABATIS_WORK_R) { c.engClearId = null; continue; }
      a.building = false;
      a.strength = Math.max(0, a.strength - dt / (FLDE.ABATIS_CLEAR_T * fldEngRealism()));
      if (a.strength <= 0) { c.engClearId = null; obs.splice(j, 1); break; }
    }
  }
}

/* ORDER (key E): the selected player brigades take up the spade where they stand. */
function fldSelEntrench() {
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [];
  if (!sel || !sel.length) return;
  var n = 0;
  for (var i = 0; i < sel.length; i++) {
    var u = sel[i];
    if (!u || !u.alive || u.state === "routing") continue;
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing };
    u.digging = true; u.digX = u.x; u.digZ = u.z;
    n++;
  }
  if (n && typeof fldAnnounce === "function") fldAnnounce("Entrench ordered — the men take up the spade.");
  if (typeof fldRenderHud === "function") fldRenderHud();
}

/* HUD line for the selected unit. Empty (no extra markup) for a non-entrenching unit. */
function fldEngHudSelected(u) {
  if (!u) return "";
  var dig = !!u.digging, e = u.entrench || 0;
  var out = "";
  if (dig || e > 0) {
    var pct = Math.round(e * 100);
    var label = e >= 0.98 ? "Entrenched" : (dig ? "Digging in" : "Works (fading)");
    var cov = fldEngCover(u);
    var col = e >= 0.66 ? "#9cc66f" : e >= 0.33 ? "#d6b15a" : "#cda06a";
    out += '<div style="margin-top:4px;color:' + col + ';font-size:12px;">⛏ ' + label +
      ' — ' + pct + '% · cover ×' + cov.toFixed(2) + '</div>';
  }
  var obs = __FIELD.engObstacles || [], a = null;
  for (var i = 0; i < obs.length; i++) if (obs[i].id === u.engBuildId || obs[i].id === u.engClearId) { a = obs[i]; break; }
  if (a && u.engBuildId) out += '<div style="margin-top:4px;color:#e1bd76;font-size:12px;">▲ Building abatis — ' + Math.round(a.strength * 100) + '%</div>';
  if (a && u.engClearId) out += '<div style="margin-top:4px;color:#d9c9a5;font-size:12px;">✕ Clearing obstacle — ' + Math.round((1 - a.strength) * 100) + '%</div>';
  if (u.engDisorder > 0) out += '<div style="margin-top:4px;color:#f0a07d;font-size:12px;">⚠ Obstacle disorder — ragged fire (' + Math.ceil(u.engDisorder) + 's)</div>';
  return out;
}

/* ---- 2D render: a dirt parapet arc along the unit's front (toward its facing) ---- */
function fldEngDraw2d(ctx, v) {
  if (typeof __FIELD === "undefined" || !__FIELD.units) return;
  var obs = __FIELD.engObstacles || [];
  for (var oi = 0; oi < obs.length; oi++) {
    var a = obs[oi]; if (!(a.strength > 0.02)) continue;
    // fog: an enemy-owned belt whose builder is unscouted stays hidden (mirrors the entrenchment works)
    if (__FIELD.fog && a.side !== fldPlayerSide()) { var ab2 = (typeof fldById === "function") ? fldById(a.builderId) : null; if (ab2 && !fldVisible(fldPlayerSide(), ab2)) continue; }
    var x1 = v.ox + a.x1 * v.s, z1 = v.oz + a.z1 * v.s, x2 = v.ox + a.x2 * v.s, z2 = v.oz + a.z2 * v.s;
    var dx = x2 - x1, dz = z2 - z1, len = Math.max(1, Math.sqrt(dx * dx + dz * dz)), nx = -dz / len, nz = dx / len;
    ctx.save();
    ctx.strokeStyle = "rgba(46,31,18," + (0.45 + 0.5 * a.strength) + ")"; ctx.lineWidth = Math.max(2, 5 * v.s);
    ctx.beginPath(); ctx.moveTo(x1, z1); ctx.lineTo(x2, z2); ctx.stroke();
    ctx.strokeStyle = "rgba(189,155,101,0.95)"; ctx.lineWidth = Math.max(1, 1.5 * v.s);
    var stakes = 4 + Math.round(6 * a.strength);
    for (var si = 0; si <= stakes; si++) {
      var p = si / stakes, sx = x1 + dx * p, sz = z1 + dz * p, off = (si % 2 ? 8 : -8) * v.s * a.strength;
      ctx.beginPath(); ctx.moveTo(sx - nx * off, sz - nz * off); ctx.lineTo(sx + nx * off, sz + nz * off); ctx.stroke();
    }
    ctx.restore();
  }
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i];
    if (!u.alive || !(u.entrench > 0)) continue;
    if (__FIELD.fog && u.side !== fldPlayerSide() && !fldVisible(fldPlayerSide(), u)) continue;   // hidden enemy works
    var cx = v.ox + u.x * v.s, cz = v.oz + u.z * v.s;
    var frontW = (u.formation === "column" ? 36 : 96) * v.s * (0.5 + 0.5 * u.men / u.maxMen);
    var e = u.entrench;
    ctx.save(); ctx.translate(cx, cz); ctx.rotate(u.facing);
    // the parapet sits just in front of the block (front = -depth/2 side); height grows with progress
    var depth = (u.formation === "column" ? 60 : 26) * v.s;
    var y = -depth / 2 - 2 * v.s;
    var berm = (2 + 4 * e) * v.s;
    // earth body
    ctx.fillStyle = "rgba(74,56,33," + (0.55 + 0.35 * e) + ")";
    ctx.beginPath();
    ctx.moveTo(-frontW / 2, y);
    ctx.lineTo(frontW / 2, y);
    ctx.lineTo(frontW / 2, y - berm);
    ctx.lineTo(-frontW / 2, y - berm);
    ctx.closePath(); ctx.fill();
    // crest highlight (CVD-safe: shape + value, not color-only)
    ctx.strokeStyle = "rgba(150,124,82,0.9)"; ctx.lineWidth = Math.max(1, 1.4 * v.s);
    ctx.beginPath(); ctx.moveTo(-frontW / 2, y - berm); ctx.lineTo(frontW / 2, y - berm); ctx.stroke();
    // gabion/stake ticks along the crest grow in as the works mature
    var ticks = Math.round(3 + 5 * e);
    ctx.strokeStyle = "rgba(40,30,18,0.8)";
    for (var t = 0; t <= ticks; t++) {
      var tx = -frontW / 2 + (frontW * t / ticks);
      ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, y - berm); ctx.stroke();
    }
    ctx.restore();
  }
}

/* ---- 3D render: a low dirt berm in front of each entrenched unit (depth-correct,
   leak-managed: meshes are created lazily per unit and disposed when works fade) ---- */
function fld3dBuildEng() {
  if (typeof __FIELD === "undefined" || !window.THREE || !__FIELD.scene) return;
  var T = window.THREE;
  if (__FIELD._engGroup && __FIELD._engGroup.parent) __FIELD._engGroup.parent.remove(__FIELD._engGroup);
  __FIELD._engGroup = new T.Group();
  __FIELD._engGroup.name = "engWorks";
  __FIELD._engMeshes = {};   // unitId -> { mesh, geo, mat, lvl }
  __FIELD._engAbatisMeshes = {}; // obstacleId -> { group, geo, mat, lvl }
  __FIELD.scene.add(__FIELD._engGroup);
}

function _fld3dEngDisposeOne(rec) {
  try {
    if (!rec) return;
    if (rec.mesh && __FIELD._engGroup) __FIELD._engGroup.remove(rec.mesh);
    if (rec.geo && rec.geo.dispose) rec.geo.dispose();
    if (rec.mat && rec.mat.dispose) rec.mat.dispose();
  } catch (e) {}
}

function _fld3dEngDisposeAbatis(rec) {
  try {
    if (!rec) return;
    if (rec.group && __FIELD._engGroup) __FIELD._engGroup.remove(rec.group);
    if (rec.geo && rec.geo.dispose) rec.geo.dispose();
    if (rec.mat && rec.mat.dispose) rec.mat.dispose();
  } catch (e) {}
}

function fld3dSyncEng() {
  if (typeof __FIELD === "undefined" || !window.THREE || !__FIELD._engGroup) return;
  var T = window.THREE, meshes = __FIELD._engMeshes || (__FIELD._engMeshes = {});
  // mark all stale; refresh those that should exist
  var keep = {};
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i];
    if (!u.alive || !(u.entrench > 0.02)) continue;
    keep[u.id] = 1;
    var lvl = Math.round(u.entrench * 20) / 20;   // quantize so we only rebuild geometry on a real change
    var frontW = (u.formation === "column" ? 40 : 100);   // match the unit slab frontage (BoxGeometry 96 wide)
    var hgt = 4 + 10 * u.entrench;                          // parapet height: 4 -> 14 (the slab is 8 tall)
    var depthB = 6 + 8 * u.entrench;                        // earthwork thickness
    var rec = meshes[u.id];
    if (!rec || rec.lvl !== lvl) {
      _fld3dEngDisposeOne(rec);
      var geo = new T.BoxGeometry(frontW, hgt, depthB);
      var mat = new T.MeshStandardMaterial({ color: new T.Color("#5a4326"), roughness: 0.97, metalness: 0.0, flatShading: true });
      var mesh = new T.Mesh(geo, mat);
      mesh.castShadow = false; mesh.receiveShadow = true;
      __FIELD._engGroup.add(mesh);
      rec = meshes[u.id] = { mesh: mesh, geo: geo, mat: mat, lvl: lvl };
    }
    // place the berm just in front of the unit, along its facing (forward world = (sin f, -cos f))
    var slabHalf = (u.formation === "column" ? 29 : 13);
    var fwd = slabHalf + depthB * 0.5 + 3;
    var px = u.x + Math.sin(u.facing) * fwd, pz = u.z - Math.cos(u.facing) * fwd;
    var gy = (typeof fldTerrainH === "function") ? fldTerrainH(px, pz) : 0;
    rec.mesh.position.set(px, gy + hgt / 2, pz);
    rec.mesh.rotation.y = -u.facing;
    var hidden = (__FIELD.fog && u.side !== fldPlayerSide() && !fldVisible(fldPlayerSide(), u));   // hidden enemy works
    rec.mesh.visible = !hidden;
  }
  // dispose works whose unit is gone / no longer entrenched
  for (var id in meshes) {
    if (!Object.prototype.hasOwnProperty.call(meshes, id)) continue;
    if (!keep[id]) { _fld3dEngDisposeOne(meshes[id]); delete meshes[id]; }
  }
  // Abatis: low-poly crossed timber, rebuilt only when its quantized completion changes.
  var am = __FIELD._engAbatisMeshes || (__FIELD._engAbatisMeshes = {}), akeep = {}, obs = __FIELD.engObstacles || [];
  for (var ai = 0; ai < obs.length; ai++) {
    var a = obs[ai]; if (!(a.strength > 0.02)) continue;
    akeep[a.id] = 1;
    var alvl = Math.round(a.strength * 10) / 10, ar = am[a.id];
    if (!ar || ar.lvl !== alvl) {
      _fld3dEngDisposeAbatis(ar);
      var ag = new T.Group(), ageo = new T.BoxGeometry(20, 3.2, 3.2);
      var amat = new T.MeshStandardMaterial({ color: new T.Color("#4d321c"), roughness: 1, metalness: 0, flatShading: true });
      var count = (typeof fldLow === "function" && fldLow()) ? 6 : 11;
      for (var s = 0; s < count; s++) {
        var branch = new T.Mesh(ageo, amat), p = count === 1 ? 0.5 : s / (count - 1);
        branch.position.set((p - 0.5) * 124, 3 + (s % 3), (s % 2 ? 5 : -5) * a.strength);
        branch.rotation.z = (s % 2 ? 0.62 : -0.62); branch.rotation.y = (s % 3 - 1) * 0.42;
        branch.castShadow = false; branch.receiveShadow = true; ag.add(branch);
      }
      __FIELD._engGroup.add(ag); ar = am[a.id] = { group: ag, geo: ageo, mat: amat, lvl: alvl };
    }
    var acx = (a.x1 + a.x2) / 2, acz = (a.z1 + a.z2) / 2;
    ar.group.position.set(acx, fldTerrainH(acx, acz) + 1.5, acz);
    ar.group.rotation.y = -Math.atan2(a.z2 - a.z1, a.x2 - a.x1);
    // fog: hide an enemy-owned belt whose builder is unscouted (mirrors the 3D entrenchment works)
    var aHidden = (__FIELD.fog && a.side !== fldPlayerSide()); if (aHidden) { var ab3 = (typeof fldById === "function") ? fldById(a.builderId) : null; aHidden = !!(ab3 && !fldVisible(fldPlayerSide(), ab3)); }
    ar.group.visible = !aHidden;
  }
  for (var aid in am) {
    if (!Object.prototype.hasOwnProperty.call(am, aid)) continue;
    if (!akeep[aid]) { _fld3dEngDisposeAbatis(am[aid]); delete am[aid]; }
  }
}

function fld3dDisposeEng() {
  if (typeof __FIELD === "undefined") return;
  var meshes = __FIELD._engMeshes || {};
  for (var id in meshes) { if (Object.prototype.hasOwnProperty.call(meshes, id)) _fld3dEngDisposeOne(meshes[id]); }
  __FIELD._engMeshes = {};
  var am = __FIELD._engAbatisMeshes || {};
  for (var aid in am) { if (Object.prototype.hasOwnProperty.call(am, aid)) _fld3dEngDisposeAbatis(am[aid]); }
  __FIELD._engAbatisMeshes = {};
  if (__FIELD._engGroup && __FIELD._engGroup.parent) __FIELD._engGroup.parent.remove(__FIELD._engGroup);
  __FIELD._engGroup = null;
}

function fldEngEndHtml() {
  if (!__FIELD._engUsed || !__FIELD._engUsed.abatis) return "";
  return '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:6px;">The axe beside the spade</div>' +
    '<div style="font-size:12.5px;opacity:.88;line-height:1.48;">An abatis was not a magical wall: felled trees were laid with sharpened branches toward the attacker, breaking formation and holding troops under fire. Axemen could open a lane, but clearing took time and exposed the working party. The game models that friction as slow movement, temporary disorder, and deliberate clearance—not extra casualties from the timber itself.</div>' +
    '<div style="font-size:11px;opacity:.62;margin-top:4px;">Verified (high): Dennis Hart Mahan, <i>A Treatise on Field Fortification</i> (1861), obstacle and abatis construction; U.S. War Department engineering practice.</div></div>';
}
