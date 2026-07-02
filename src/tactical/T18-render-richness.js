/* ===========================================================================
   T18 — TERRAIN & UNIT RENDER RICHNESS  (Phase H · H3-i3 — "make it come to life")

   Makes the battlefield itself feel alive: the ground stops being a flat two-tone
   wash and grows procedural texture (grass mottle, tilled crop-rows, damp/dry
   patches); the woods sway in the wind; each brigade's colors ripple on the pole;
   selected units pulse and marching columns bob; and a fallen brigade fades from
   the field instead of snapping out. 3D is the marquee (vertex recolor + per-cone
   sway + per-unit motion); the 2D top-down view gets a faint field grain, a
   selection pulse, and the same casualty fade.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   this module touches NO existing file. It WRAPS fld3dBuildTerrain / fld3dRender /
   fld3dSyncUnit / fld2dDraw / fldExit by ASSIGNMENT (the T9/T16/T17 seam) and reads
   ONLY render state + read-only sim fields (u.x/u.z/u.alive/u.state/u.id, __FIELD.sel).
   It NEVER writes a sim field, NEVER calls fldRng (all variation is analytic value
   noise + per-frame wall-clock sines — fully deterministic, no shared-RNG churn), and
   NEVER bumps _SAVE_VER. So the sim tick and every battle baseline are unchanged — the
   only diff is pixels. The ground enrichment recolors VERTICES only (never positions),
   so units — which seat on the analytic fldTerrainH, not the mesh — never float or sink.

   ACCESSIBILITY / PERF (Intel UHD-617 floor): every MOTION effect (woods sway, flag
   ripple, selection pulse, march bob, casualty fade) is suppressed under reduceMotion
   (the established T16/T17 convention) — the STATIC ground texture is faithful detail,
   not motion, so it stays (exactly as T17 keeps its static sky tint under reduceMotion).
   A G.settings.renderRich === "off" opt-out disables the WHOLE layer (back to the
   byte-identical default look). The woods sway recomputes each instance matrix from a
   cached base (no drift); fldLow() trims the sway amplitude. No new draw call, no Points,
   no shader — so no gl_PointSize concern. The texture carries no colour-encoded info → CVD-safe.
   =========================================================================== */

var FLDRR = {
  SWAY_HI: 0.055, SWAY_LO: 0.032,   // woods tilt amplitude (radians) per render tier
  FLAG_Y: 0.17, FLAG_Z: 0.075,      // banner twist / dip amplitude (radians)
  FADE_SECS: 0.85,      // casualty fade-out duration
  MOVE_YDPS: 8          // sim speed (yards/sec) above which a unit "marches" (bob)
};

/* ---- module-level state (woods buffers, per-frame dt, 2D casualty bookkeeping) ---- */
var FLDRR_S = { woods: [], swayed: false, dt3d: 0, last3d: 0,
                dt2d: 0, last2d: 0, prev2d: null, snap2d: null, dead2d: null,
                grainCanvas: null, grainKey: null, errN: 0,
                _Tbase: null, _Rx: null, _Rz: null, _Tup: null, _m: null };

/* ---- gates ---- */
function fldRrOff() {
  try { if (typeof G !== "undefined" && G && G.settings && G.settings.renderRich === "off") return true; } catch (e) {}
  return false;
}
function fldRrMotion() {
  if (fldRrOff()) return false;
  try { if (typeof fldReduceMotion === "function" && fldReduceMotion()) return false; } catch (e) {}
  return true;
}
function fldRrTime() {
  return ((typeof performance !== "undefined" && performance.now) ? performance.now() : 0) / 1000;
}
function fldRrDt3d() {
  var now = fldRrTime(), dt = FLDRR_S.last3d ? (now - FLDRR_S.last3d) : 0;
  FLDRR_S.last3d = now; if (!(dt > 0)) dt = 0; if (dt > 0.1) dt = 0.1; return dt;
}
function fldRrDt2d() {
  var now = fldRrTime(), dt = FLDRR_S.last2d ? (now - FLDRR_S.last2d) : 0;
  FLDRR_S.last2d = now; if (!(dt > 0)) dt = 0; if (dt > 0.1) dt = 0.1; return dt;
}

/* ===========================================================================
   ANALYTIC VALUE NOISE  (deterministic — no RNG, so probes stay reproducible and
   combat determinism is never perturbed). Integer-lattice hash + bilinear interp.
   =========================================================================== */
function _rrHash(ix, iz) {
  var h = (ix | 0) * 374761393 + (iz | 0) * 668265263;
  h = (h ^ (h >> 13)) >>> 0; h = (h * 1274126177) >>> 0; h = (h ^ (h >> 16)) >>> 0;
  return (h % 100000) / 100000;
}
function _rrVal(x, z) {
  var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  var sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);   // smoothstep
  var a = _rrHash(ix, iz), b = _rrHash(ix + 1, iz), c = _rrHash(ix, iz + 1), d = _rrHash(ix + 1, iz + 1);
  var ab = a + (b - a) * sx, cd = c + (d - c) * sx;
  return ab + (cd - ab) * sz;   // [0,1]
}
// a stable per-unit phase from its id string (no RNG; spreads flag/march phases apart)
function _rrPhase(id) {
  var s = String(id == null ? "" : id), h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return (h % 62832) / 10000;   // ~[0, 2pi)
}

/* ===========================================================================
   3D GROUND — enrich the terrain mesh's VERTEX COLOURS after fld3dBuildTerrain
   (positions untouched — units seat on analytic fldTerrainH, never the mesh).
   =========================================================================== */
function fldRrEnrichGround() {
  if (fldRrOff()) return;
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.ground || !__FIELD.ground.geometry) return;
  var geo = __FIELD.ground.geometry, posA = geo.attributes && geo.attributes.position, colA = geo.attributes && geo.attributes.color;
  if (!posA || !colA || colA._rr) return;   // idempotent — one enrich per fresh geometry
  var W = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_W : 1200;
  var H = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_H : 900;
  for (var i = 0; i < posA.count; i++) {
    var wx = posA.getX(i) + W / 2, wz = posA.getZ(i) + H / 2;
    var r = colA.getX(i), g = colA.getY(i), b = colA.getZ(i);
    var inW = (typeof fldInWoods === "function") ? fldInWoods(wx, wz) : false;
    var detail = _rrVal(wx * 0.045 + 7.1, wz * 0.045 - 3.3) - 0.5;     // [-0.5,0.5] fine grass grain
    var light = 1 + detail * 0.22;
    if (!inW) {
      // large soft patches give the open ground a CHARACTER: lush damp hollow / ordinary / dry ripe field
      var patch = _rrVal(wx * 0.006 + 30.2, wz * 0.006 - 12.7);
      var tr = 0, tg = 0, tb = 0, mix = 0;
      if (patch > 0.70) { tr = 0.62; tg = 0.55; tb = 0.30; mix = Math.min(0.42, (patch - 0.70) * 1.7); }       // sun-dried ochre grass / ripe wheat
      else if (patch < 0.27) { tr = 0.22; tg = 0.33; tb = 0.15; mix = Math.min(0.34, (0.27 - patch) * 1.4); }  // damp lush green
      // occasional trampled / bare earth where a second low-freq field spikes
      var mud = _rrVal(wx * 0.013 - 5.4, wz * 0.013 + 8.8);
      if (mud > 0.80) { var md = Math.min(0.46, (mud - 0.80) * 2.3); tr = 0.44; tg = 0.34; tb = 0.23; mix = mix > md ? mix : md; }
      if (mix > 0) { r = r * (1 - mix) + tr * mix; g = g * (1 - mix) + tg * mix; b = b * (1 - mix) + tb * mix; }
      // tilled crop furrows inside a "cultivated" mask (corduroy striping, open ground only)
      var cropMask = _rrVal(wx * 0.004 + 50.5, wz * 0.004 - 20.1) - 0.55;
      if (cropMask > 0) { var cm = Math.min(1, cropMask * 4), fr = Math.sin(wx * 0.5 + wz * 0.13); r += fr * 0.06 * cm; g += fr * 0.05 * cm; }
    }
    r *= light; g *= light; b *= light;
    colA.setXYZ(i, r < 0 ? 0 : (r > 1 ? 1 : r), g < 0 ? 0 : (g > 1 ? 1 : g), b < 0 ? 0 : (b > 1 ? 1 : b));
  }
  colA.needsUpdate = true; colA._rr = true;
}

/* ===========================================================================
   3D WOODS — cache the cone InstancedMeshes once, then sway them in the wind.
   =========================================================================== */
function fldRrCaptureWoods() {
  FLDRR_S.woods = [];
  var T = window.THREE; if (!T || typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene) return;
  var m = new T.Matrix4(), p = new T.Vector3();
  var kids = __FIELD.scene.children;
  for (var c = 0; c < kids.length; c++) {
    var o = kids[c];
    if (!o || !o.isInstancedMesh || !o.geometry || o.geometry.type !== "ConeGeometry") continue;   // woods cones only
    var cnt = o.count | 0, bases = new Array(cnt), phases = new Array(cnt);
    for (var i = 0; i < cnt; i++) {
      o.getMatrixAt(i, m); p.setFromMatrixPosition(m);
      bases[i] = { x: p.x, y: p.y, z: p.z };                        // cone CENTER (base sits 23 below)
      phases[i] = _rrHash(Math.round(p.x), Math.round(p.z)) * 6.283;
    }
    FLDRR_S.woods.push({ mesh: o, bases: bases, phases: phases, count: cnt });
  }
}
function _rrEnsureMats() {
  var T = window.THREE; if (!T) return false;
  if (!FLDRR_S._m) { FLDRR_S._Tbase = new T.Matrix4(); FLDRR_S._Rx = new T.Matrix4(); FLDRR_S._Rz = new T.Matrix4(); FLDRR_S._Tup = new T.Matrix4(); FLDRR_S._m = new T.Matrix4(); FLDRR_S._Tup.makeTranslation(0, 23, 0); }
  return true;
}
function fldRrSwayWoods() {
  if (!FLDRR_S.woods.length || !_rrEnsureMats()) return;
  if (!fldRrMotion()) {                       // reset to the upright base once when motion is off
    if (FLDRR_S.swayed) {
      for (var w0 = 0; w0 < FLDRR_S.woods.length; w0++) {
        var it0 = FLDRR_S.woods[w0]; if (!it0.mesh || !it0.mesh.instanceMatrix) continue;
        for (var j0 = 0; j0 < it0.count; j0++) { var b0 = it0.bases[j0]; FLDRR_S._m.makeTranslation(b0.x, b0.y, b0.z); it0.mesh.setMatrixAt(j0, FLDRR_S._m); }
        it0.mesh.instanceMatrix.needsUpdate = true;
      }
      FLDRR_S.swayed = false;
    }
    return;
  }
  var t = fldRrTime();
  var amp = (typeof fldLow === "function" && fldLow()) ? FLDRR.SWAY_LO : FLDRR.SWAY_HI;
  for (var wi = 0; wi < FLDRR_S.woods.length; wi++) {
    var it = FLDRR_S.woods[wi], mesh = it.mesh; if (!mesh || !mesh.instanceMatrix) continue;
    for (var i = 0; i < it.count; i++) {
      var bb = it.bases[i], ph = it.phases[i];
      var ax = amp * Math.sin(t * 0.9 + ph);
      var az = amp * 0.7 * Math.sin(t * 1.35 + ph * 1.7);
      // tilt the cone about its BASE: T(base) · Rz · Rx · T(0,+23,0)
      FLDRR_S._Tbase.makeTranslation(bb.x, bb.y - 23, bb.z);
      FLDRR_S._Rx.makeRotationX(ax); FLDRR_S._Rz.makeRotationZ(az);
      FLDRR_S._m.copy(FLDRR_S._Tbase).multiply(FLDRR_S._Rz).multiply(FLDRR_S._Rx).multiply(FLDRR_S._Tup);
      mesh.setMatrixAt(i, FLDRR_S._m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  FLDRR_S.swayed = true;
}

/* ---- once-per-frame 3D hook (wrapped onto fld3dRender, pre): advance dt + sway ---- */
function fldRrFrame3d() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.launched || !window.THREE || !__FIELD.scene) return;
  FLDRR_S.dt3d = fldRrDt3d();
  fldRrSwayWoods();
}

/* ===========================================================================
   3D UNITS — flag ripple, selection pulse, march bob, casualty fade (per unit,
   wrapped onto fld3dSyncUnit so it runs right after the base seats each group).
   =========================================================================== */
function _rrSetGroupOpacity(g, op, transparent) {
  g.traverse(function (o) {
    if (!o.material) return;
    var isFlag = o.name === "flag", isRing = o.name === "ring";
    var mats = Array.isArray(o.material) ? o.material : [o.material];
    for (var k = 0; k < mats.length; k++) {
      var mm = mats[k]; if (!mm) continue;
      // the flag + ring are created transparent:true ON PURPOSE (the flag's canvas texture needs alpha; the
      // ring is a faded halo) — NEVER flip their transparent flag (flipping it false would render the flag
      // texture opaquely + force a needless shader recompile). Only the opaque body meshes toggle transparent.
      if (!isFlag && !isRing && mm.transparent !== transparent) { mm.transparent = transparent; mm.needsUpdate = true; }
      mm.opacity = isRing ? mm.opacity : op;   // the ring's opacity is owned by the selection/fade logic
    }
  });
}
function fldRrEnsureFadeBody(u, g) {
  if (!u || !g || !window.THREE) return;
  if (g.getObjectByName && g.getObjectByName("slab")) return;
  try {
    if (typeof fld3dAddMarkerBody === "function" && typeof fld3dUnitMarkerResources === "function") {
      fld3dAddMarkerBody(window.THREE, g, u, fld3dUnitMarkerResources(window.THREE));
    }
  } catch (e) { FLDRR_S.errN++; }
}
function fldRrSyncUnit(u, g) {
  if (!u || !g) return;
  // NOTE: no early-return on renderRich="off" — fldRrMotion() returns false when off, which drives the
  // flag/ring RESET branches below, so toggling "off" mid-battle cleanly reverts the motion effects (the
  // 3D ground vertex tint is build-time and reverts on the next battle launch, the T16/T17 apply-time pattern).
  var rec = g.userData._t18 || (g.userData._t18 = { prevAlive: u.alive, wasVis: u.alive });
  if (!rec.refd) { rec.flag = g.getObjectByName("flag"); rec.ring = g.getObjectByName("ring"); rec.refd = true; }
  else if (!rec.ring) { rec.ring = g.getObjectByName("ring"); }
  var motion = fldRrMotion(), dt = FLDRR_S.dt3d;   // motion === false when reduceMotion OR renderRich="off"

  // CASUALTY FADE: catch the alive -> dead transition; keep the group visible and fade it out. Guarded on
  // rec.wasVis (the base's visibility on the LAST living frame) so a fog-hidden enemy that dies never
  // force-shows a fading ghost — no fog-of-war leak.
  if (rec.prevAlive && !u.alive && rec.wasVis && motion && !rec.fading && !rec.faded) { rec.fading = true; rec.fade = 1; }
  rec.prevAlive = u.alive;
  if (rec.fading) {
    if (!motion) { rec.fading = false; rec.faded = true; _rrSetGroupOpacity(g, 1, false); if (rec.ring) rec.ring.visible = false; g.visible = false; return; }
    rec.fade -= dt / FLDRR.FADE_SECS;
    if (rec.fade <= 0) { rec.fading = false; rec.faded = true; _rrSetGroupOpacity(g, 1, false); if (rec.ring) rec.ring.visible = false; g.visible = false; return; }
    var f = rec.fade < 0 ? 0 : rec.fade;
    g.visible = true;                                    // override the base's instant hide
    // Settle ABSOLUTELY toward the ground each frame. The base fld3dSyncUnit early-returns for a dead unit and
    // never re-seats g.position, so a cumulative `-=` would compound to tens of yards of sink (frame-rate
    // dependent) — re-base off the analytic terrain so the dip is bounded to the intended ~5 yards.
    var seatY = ((typeof fldTerrainH === "function") ? fldTerrainH(u.x, u.z) : 0) + 4;
    g.position.set(u.x, seatY - (1 - f) * 5, u.z);
    fldRrEnsureFadeBody(u, g);
    _rrSetGroupOpacity(g, f, true);
    if (rec.ring) {
      rec.ring.visible = true;
      if (rec.ring.material) rec.ring.material.opacity = f * 0.85;   // a SELECTED unit's ring fades with the corpse
    }
    return;
  }
  if (!u.alive) { if (rec.ring) rec.ring.visible = false; rec.wasVis = false; return; }   // base already hid it (dead-at-start or fog-hidden)

  rec.wasVis = g.visible;   // remember the base's visibility this living frame (drives the fade-ghost guard)

  // FLAG RIPPLE — twist + dip the colours on the pole (whichever flag mesh is present: base or T10)
  if (rec.flag) {
    if (motion) {
      var t = fldRrTime(), ph = _rrPhase(u.id);
      rec.flag.rotation.y = FLDRR.FLAG_Y * Math.sin(t * 2.3 + ph);
      rec.flag.rotation.z = FLDRR.FLAG_Z * Math.sin(t * 3.1 + ph * 1.4);
    } else if (rec.flag.rotation.y || rec.flag.rotation.z) { rec.flag.rotation.y = 0; rec.flag.rotation.z = 0; }
  }

  // SELECTION PULSE — the base sets ring opacity 0.85 when selected, 0 otherwise; pulse it when selected
  if (rec.ring && rec.ring.material) {
    var selected = __FIELD.sel && __FIELD.sel.indexOf(u.id) >= 0;
    if (selected) {
      rec.ring.visible = true;
      if (motion) { var p = 0.5 + 0.5 * Math.abs(Math.sin(fldRrTime() * 3.2)); rec.ring.material.opacity = 0.5 + 0.4 * p; var s = 1 + 0.06 * p; rec.ring.scale.set(s, 1, s); }
      else { rec.ring.material.opacity = 0.85; rec.ring.scale.set(1, 1, 1); }
    } else {
      rec.ring.visible = false;
      rec.ring.material.opacity = 0;
      if (rec.ring.scale.x !== 1) rec.ring.scale.set(1, 1, 1);
    }
  }

  // MARCH BOB — a gentle stride for a brigade actually moving (not routing)
  if (motion && u.state !== "routing") {
    var moved = 0;
    if (rec.lx !== undefined && dt > 0.001) { var dx = u.x - rec.lx, dz = u.z - rec.lz; moved = Math.sqrt(dx * dx + dz * dz) / dt; }
    rec.lx = u.x; rec.lz = u.z;
    if (moved > FLDRR.MOVE_YDPS) g.position.y += Math.abs(Math.sin(fldRrTime() * 7 + _rrPhase(u.id))) * 1.4;
  } else { rec.lx = u.x; rec.lz = u.z; }
}

/* ===========================================================================
   2D FALLBACK — a faint static field grain, a selection pulse, and casualty fade
   (wrapped onto fld2dDraw, after the base paints the field + units).
   =========================================================================== */
function _rr2dSnapshot(u) { return { x: u.x, z: u.z, facing: u.facing, formation: u.formation, men: u.men, maxMen: u.maxMen, side: u.side }; }
/* ---- build the static field grain ONCE into an offscreen canvas (field-rect sized) so the 2D fallback path
   blits it with a single drawImage instead of recomputing ~1300 fillRects every frame on the weakest GPU ---- */
function _rrBuildGrain(fw, fh, s) {
  try {
    var c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(fw)); c.height = Math.max(1, Math.ceil(fh));
    var g = c.getContext("2d"); if (!g) return null;
    var cell = (typeof fldLow === "function" && fldLow()) ? 40 : 30;
    for (var gy = 0; gy < fh; gy += cell) {
      for (var gx = 0; gx < fw; gx += cell) {
        var wx = (gx + cell / 2) / s, wz = (gy + cell / 2) / s;
        var patch = _rrVal(wx * 0.006 + 30.2, wz * 0.006 - 12.7);
        var mud = _rrVal(wx * 0.013 - 5.4, wz * 0.013 + 8.8);
        var col = null, a = 0;
        if (patch > 0.70) { col = "#b6a861"; a = Math.min(0.13, (patch - 0.70) * 0.55); }       // dry ochre
        else if (patch < 0.27) { col = "#243a18"; a = Math.min(0.13, (0.27 - patch) * 0.5); }    // lush
        if (mud > 0.80) { col = "#6b5538"; a = Math.min(0.14, (mud - 0.80) * 0.7); }              // bare earth (overrides)
        if (col && a > 0.006) { g.globalAlpha = a; g.fillStyle = col; g.fillRect(gx, gy, cell, cell); }
      }
    }
    return c;
  } catch (e) { return null; }
}
function fldRrDraw2d(ctx, v) {
  if (!ctx || !v || fldRrOff()) return;
  var W = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_W : 1200, H = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_H : 900;
  var fx = v.ox, fz = v.oz, fw = W * v.s, fh = H * v.s;
  if (!(fw > 0) || !(fh > 0)) return;
  var prevA = ctx.globalAlpha;

  // STATIC FIELD GRAIN — soft LARGE patches (dry ochre / lush / bare earth) so open ground reads as a real
  // field, not flat paint. The texture depends only on world coords + the view scale, so it is built once and
  // CACHED (rebuilt only when the field or scale changes), then blitted with one drawImage. Motion-free
  // (faithful texture, not motion) -> applies under reduceMotion, like T17's static tint.
  var gkey = W + "x" + H + "@" + (v.s ? v.s.toFixed(3) : "0") + ((typeof fldLow === "function" && fldLow()) ? "L" : "H");
  if (FLDRR_S.grainKey !== gkey) { FLDRR_S.grainCanvas = _rrBuildGrain(fw, fh, v.s); FLDRR_S.grainKey = gkey; }
  if (FLDRR_S.grainCanvas) ctx.drawImage(FLDRR_S.grainCanvas, fx, fz);
  ctx.globalAlpha = prevA;

  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.units) { ctx.globalAlpha = prevA; return; }
  var motion = fldRrMotion();
  // SELECTION PULSE — a pulsing dashed halo around selected, living units
  if (__FIELD.sel && __FIELD.sel.length) {
    var pulse = motion ? (0.5 + 0.5 * Math.abs(Math.sin(fldRrTime() * 3.2))) : 0.85;
    for (var s2 = 0; s2 < __FIELD.units.length; s2++) {
      var us = __FIELD.units[s2]; if (!us.alive || __FIELD.sel.indexOf(us.id) < 0) continue;
      var cx = fx + us.x * v.s, cz = fz + us.z * v.s;
      var rr = (Math.max(us.formation === "column" ? 36 : 96, 26) * 0.62) * v.s + 4 + (motion ? pulse * 4 : 2);
      ctx.save(); ctx.globalAlpha = 0.35 + 0.45 * pulse; ctx.strokeStyle = "#ffe9a8"; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(cx, cz, rr, 0, 7); ctx.stroke(); ctx.restore();
    }
    ctx.setLineDash([]);
  }

  // CASUALTY FADE — track the alive->dead transition and fade a ghosting block out over FADE_SECS
  if (!FLDRR_S.snap2d) { FLDRR_S.snap2d = {}; FLDRR_S.prev2d = {}; FLDRR_S.dead2d = {}; }
  var dt2 = fldRrDt2d();
  for (var u2 = 0; u2 < __FIELD.units.length; u2++) {
    var u = __FIELD.units[u2], wasAlive = FLDRR_S.prev2d[u.id];
    if (wasAlive && !u.alive && motion && !FLDRR_S.dead2d[u.id] && FLDRR_S.snap2d[u.id]) {
      FLDRR_S.dead2d[u.id] = { snap: FLDRR_S.snap2d[u.id], fade: 1 };
    }
    FLDRR_S.prev2d[u.id] = u.alive;
    if (u.alive) FLDRR_S.snap2d[u.id] = _rr2dSnapshot(u);
  }
  for (var id in FLDRR_S.dead2d) {
    if (!Object.prototype.hasOwnProperty.call(FLDRR_S.dead2d, id)) continue;
    var ent = FLDRR_S.dead2d[id]; if (!motion) { delete FLDRR_S.dead2d[id]; continue; }
    ent.fade -= dt2 / FLDRR.FADE_SECS;
    if (ent.fade <= 0) { delete FLDRR_S.dead2d[id]; continue; }
    var sp = ent.snap, dcx = fx + sp.x * v.s, dcz = fz + sp.z * v.s;
    var dw = (sp.formation === "column" ? 36 : 96) * v.s * (0.5 + 0.5 * (sp.men / (sp.maxMen || sp.men || 1)));
    var dd = (sp.formation === "column" ? 60 : 26) * v.s;
    ctx.save(); ctx.globalAlpha = 0.5 * ent.fade; ctx.translate(dcx, dcz); ctx.rotate(sp.facing || 0);
    ctx.fillStyle = sp.side === "US" ? "#5b79ad" : "#a85a4a"; ctx.fillRect(-dw / 2, -dd / 2, dw, dd); ctx.restore();
  }
  ctx.globalAlpha = prevA;
}

/* ---- teardown: drop woods refs + the 2D casualty bookkeeping + the grain cache on battle exit ---- */
function fldRrDispose() {
  FLDRR_S.woods = []; FLDRR_S.swayed = false; FLDRR_S.last3d = 0; FLDRR_S.last2d = 0;
  FLDRR_S.snap2d = null; FLDRR_S.prev2d = null; FLDRR_S.dead2d = null;
  FLDRR_S.grainCanvas = null; FLDRR_S.grainKey = null; FLDRR_S.errN = 0;
}

/* ===========================================================================
   WIRE-IN — wrap fld3dBuildTerrain (enrich + capture), fld3dRender (frame hook),
   fld3dSyncUnit (per-unit polish), fld2dDraw (2D), fldExit (dispose) by ASSIGNMENT.
   T18 loads after T17 — preserve the T16/T17 markers (._wx/._atmo) so the wrapper
   chain stays introspectable to any later layer.
   =========================================================================== */
(function () {
  // the wraps swallow exceptions so a per-unit/per-frame throw can never crash the render loop, BUT they
  // count them (FLDRR_S.errN) + warn ONCE so a partially-broken feature is detectable (probe asserts errN===0)
  // instead of silently passing the zero-pageerrors gate.
  function _rrErr(e) { FLDRR_S.errN++; if (!FLDRR._warned && typeof console !== "undefined" && console.warn) { FLDRR._warned = true; console.warn("T18 render-richness:", e && e.message || e); } }
  if (typeof fld3dBuildTerrain === "function" && !fld3dBuildTerrain._rr) {
    var _ot = fld3dBuildTerrain;
    fld3dBuildTerrain = function () { var r = _ot.apply(this, arguments); try { fldRrEnrichGround(); } catch (e) { _rrErr(e); } try { fldRrCaptureWoods(); } catch (e) { _rrErr(e); } return r; };
    fld3dBuildTerrain._rr = true;
  }
  if (typeof fld3dRender === "function" && !fld3dRender._rr) {
    var _orr = fld3dRender;
    fld3dRender = function () { try { fldRrFrame3d(); } catch (e) { _rrErr(e); } return _orr.apply(this, arguments); };
    fld3dRender._rr = true; fld3dRender._wx = _orr._wx; fld3dRender._atmo = _orr._atmo;
  }
  if (typeof fld3dSyncUnit === "function" && !fld3dSyncUnit._rr) {
    var _os = fld3dSyncUnit;
    fld3dSyncUnit = function (u, g) { var r = _os.apply(this, arguments); try { fldRrSyncUnit(u, g); } catch (e) { _rrErr(e); } return r; };
    fld3dSyncUnit._rr = true;
  }
  if (typeof fld2dDraw === "function" && !fld2dDraw._rr) {
    var _od = fld2dDraw;
    fld2dDraw = function () { var r = _od.apply(this, arguments); try { fldRrDraw2d(__FIELD.ctx2d, fld2dView()); } catch (e) { _rrErr(e); } return r; };
    fld2dDraw._rr = true; fld2dDraw._wx = _od._wx; fld2dDraw._atmo = _od._atmo;
  }
  if (typeof fldExit === "function" && !fldExit._rr) {
    var _oe = fldExit;
    fldExit = function () { try { fldRrDispose(); } catch (e) { _rrErr(e); } return _oe.apply(this, arguments); };
    fldExit._rr = true; fldExit._wx = _oe._wx; fldExit._atmo = _oe._atmo;
  }
})();
