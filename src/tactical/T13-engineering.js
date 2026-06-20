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

   EXTENSION POINTS (next increments, kept here so the corps grows in one place):
     - ABATIS / OBSTACLES: fldEngMoveFactor(x,z) slow seam + a cross-belt disorder
       step; engineer-unit placement.  (not yet built)
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
  DECAY_T: 28          // sim-seconds for abandoned works to fade fully
};

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
    if (!u.alive || (!u.digging && !(u.entrench > 0))) continue;
    // left the works? (marched off the dig site, or no site recorded)
    var leftWorks = (u.digX == null) ||
      ((u.x - u.digX) * (u.x - u.digX) + (u.z - u.digZ) * (u.z - u.digZ) > FLDE.WORKS_R * FLDE.WORKS_R);
    if (leftWorks) {
      u.digging = false;
      if (u.entrench > 0) u.entrench = Math.max(0, u.entrench - dt / FLDE.DECAY_T);
    } else if (u.digging && u.order && u.order.type === "hold" && u.state !== "routing") {
      u.entrench = Math.min(1, (u.entrench || 0) + rate * dt);
    }
    // a routed unit drops its tools but keeps any works it is standing in (no progress while routing)
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
  if (!dig && e <= 0) return "";
  var pct = Math.round(e * 100);
  var label = e >= 0.98 ? "Entrenched" : (dig ? "Digging in" : "Works (fading)");
  var cov = fldEngCover(u);
  var col = e >= 0.66 ? "#9cc66f" : e >= 0.33 ? "#d6b15a" : "#cda06a";
  return '<div style="margin-top:4px;color:' + col + ';font-size:12px;">⛏ ' + label +
    ' — ' + pct + '% · cover ×' + cov.toFixed(2) + '</div>';
}

/* ---- 2D render: a dirt parapet arc along the unit's front (toward its facing) ---- */
function fldEngDraw2d(ctx, v) {
  if (typeof __FIELD === "undefined" || !__FIELD.units) return;
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
}

function fld3dDisposeEng() {
  if (typeof __FIELD === "undefined") return;
  var meshes = __FIELD._engMeshes || {};
  for (var id in meshes) { if (Object.prototype.hasOwnProperty.call(meshes, id)) _fld3dEngDisposeOne(meshes[id]); }
  __FIELD._engMeshes = {};
  if (__FIELD._engGroup && __FIELD._engGroup.parent) __FIELD._engGroup.parent.remove(__FIELD._engGroup);
  __FIELD._engGroup = null;
}
