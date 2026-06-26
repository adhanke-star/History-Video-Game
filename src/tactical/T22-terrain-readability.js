/* ===========================================================================
   T22 — MODERN-ENGINE TERRAIN READABILITY  (Phase H · H5-i3 — the locked D138 arc)

   Aaron's directive (memory civilwar-terrain-readability + D138): the modern
   (non-hex) engine must make terrain EXPLICIT and READABLE — high/low ground at a
   glance, a player-chosen elevation render, and every topography type visually
   distinct. This module delivers three things, all PRESENTATION-ONLY:

     1. THREE ELEVATION MODES on G.settings.fldElevMode, cycled from the settings
        drawer / the R key / the legend's mode chip:
          · HILLSHADE (default) — soft light/shadow relief. In 3D this IS T21's
            existing slope-AO vertex relief (we add NOTHING to the 3D ground here,
            so the relief is never double-counted); in 2D (which had NO relief at
            all) T22 paints its own cached hillshade so ridges/hollows finally read.
          · CONTOURS — iso-elevation lines + a few elevation labels over the relief.
          · COLOR-BY-HEIGHT — a CVD-safe VIRIDIS hypsometric tint (Aaron's pick),
            low→high, layered over the relief shading (shaded-relief + tint, the
            classic topo combo).
        The 3D hypsometric + contour layers are built ONCE as overlay objects and
        just .visible-toggled on a mode change (snappy, no rebuild, no camera jerk).

     2. AN ELEVATION LEGEND + ON-HOVER READOUT — a compact always-on panel (Aaron's
        pick): the live mode, a low→high gradient bar, a per-pointer elevation+type
        readout (from __FIELD.hover + fldTerrainH), and a topography key of the types
        present this battle. CVD-safe (shape + label + number, never colour alone), AA.

     3. ALL TOPOGRAPHY DISTINCT — the modern engine already renders field / woods /
        hill-ridge / wall / water-ford-pontoon / road-creek distinctly; this adds the
        three Aaron asked for — SWAMP / TOWN / FORT — as new render types read from
        __FIELD.terrain.swamps[] / .towns[] / .forts[] (each {x,z,r}). They are PURE
        DECORATION this increment (no sim cover/move hook — that sim wiring is a later
        gameplay increment, per Aaron's fork), so combat stays byte-identical: no sim
        function reads those arrays. A demo set is placed in the sandbox showcase.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   like T16/T17/T18/T21 this module WRAPS the render seams by ASSIGNMENT
   (fld3dInit / fld3dBuildTerrain / fld2dInit / fldPointerMove / fldExit), reads ONLY
   read-only render + terrain fields (fldTerrainH, __FIELD.terrain.*, __FIELD.hover,
   __FIELD.ground.geometry), NEVER writes a sim field, NEVER calls fldRng, NEVER bumps
   _SAVE_VER. The elevation mode is a NEW G.settings key the sim never reads (additive,
   like renderRich / tacticalPreset). So the headless AI-vs-AI sim is unchanged —
   probe-presets 26/26 + probe-phased-ab 20/0-diff hold in every mode.

   ACCESSIBILITY / PERF (Intel UHD-617 floor): every layer is STATIC (no per-frame
   animation) → no reduceMotion concern (the T17/T18/T21 convention). VIRIDIS is the
   reference CVD-safe ramp; the relief/contours/key encode by luminance + shape +
   labels, never hue alone. The 2D relief/tint are cached canvases (one blit/frame);
   3D adds one overlay mesh + one LineSegments. fldLow() trims contour density + label
   count + the 2D grid. New CanvasTextures are drawn BEFORE wrap and left at default
   (linear) encoding (r128 has no SRGBColorSpace — the T21 lesson).
   =========================================================================== */

var FLDTR = {
  MODES: ["hillshade", "contours", "hypsometric"],
  LABELS: { hillshade: "Hillshade", contours: "Contours", hypsometric: "Color-by-height" },
  // VIRIDIS reference stops (Aaron's CVD-safe pick) — [pos, r,g,b] in 0..1
  VIRIDIS: [[0.0, 0.267, 0.005, 0.329], [0.25, 0.229, 0.322, 0.545], [0.5, 0.127, 0.566, 0.551], [0.75, 0.369, 0.788, 0.382], [1.0, 0.993, 0.906, 0.144]],
  HYP_MIX: 0.62,            // 3D hypsometric overlay opacity (lets the relief shading read through)
  CONTOUR_N_HI: 8, CONTOUR_N_LO: 5,   // contour bands per render tier
  CONTOUR_COL: 0xf3ead2,   // warm cream lines — read over the green relief base
  LABEL_MAX: 7,            // cap the 3D elevation labels
  SWAMP_COL: 0x33564d, SWAMP_REED: 0x6f7a3a,
  TOWN_WALL: 0x9a8a70, TOWN_ROOF: 0x6f5b46,
  FORT_BERM: 0x6b5538
};

var FLDTR_S = {
  hyp3d: null, contour3d: null, decor3d: null,   // 3D overlay objects (owned + disposed here)
  legend: null, hoverKey: null, collapsed: false, legendSig: null,
  hr: null, hrKey: null,                          // memoized field height range {min,max}
  shadeCv: null, shadeKey: null,                  // cached 2D hillshade canvas
  hypCv: null, hypKey: null,                      // cached 2D hypsometric canvas
  contourPath: null, contourKey: null, contourCv: null,   // cached 2D contour polylines + the rendered layer canvas
  hovCell: null,                                  // coarse hover cell (skip re-classifying the same cell)
  errN: 0, _warned: false
};

/* ---- mode state (a UI lever the sim never reads). Kept ONLY in G.settings (in-memory + rides the campaign
   save, the renderRich pattern) — NOT localStorage: so the documented DEFAULT (hillshade) holds every fresh
   session, while the choice still sticks within a session and across a loaded save. ---- */
function fldElevMode() {
  try { var m = G && G.settings && G.settings.fldElevMode; if (FLDTR.MODES.indexOf(m) >= 0) return m; } catch (e) {}
  return "hillshade";
}
function fldElevModeLabel(m) { return FLDTR.LABELS[m || fldElevMode()] || "Hillshade"; }
function _fldTrPersist(m) {
  try { if (typeof G !== "undefined") { G.settings = G.settings || {}; G.settings.fldElevMode = m; } } catch (e) {}
}
function fldCycleElevMode() {
  var i = FLDTR.MODES.indexOf(fldElevMode()); var m = FLDTR.MODES[(i + 1) % FLDTR.MODES.length];
  fldSetElevMode(m);
}
function fldSetElevMode(m) {
  if (FLDTR.MODES.indexOf(m) < 0) m = "hillshade";
  _fldTrPersist(m);
  // 3D: flip the prebuilt overlays (no rebuild). 2D: the cached canvases re-key + redraw next frame.
  fldTrApply3dVisibility();
  fldTrRefreshLegend();
  try { if (typeof fldAnnounce === "function") fldAnnounce("Elevation: " + fldElevModeLabel(m) + "."); } catch (e) {}
}

/* ===========================================================================
   HEIGHT RANGE + SAMPLERS — memoized per terrain signature so a phase advance (new
   terrain) recomputes, but a steady battle samples fldTerrainH only once.
   =========================================================================== */
function _fldTrTerrainSig() {
  try {
    var t = __FIELD.terrain; if (!t) return "0";
    var hs = (typeof fldHills === "function") ? fldHills() : (t.hill ? [t.hill] : []);
    var s = (FLD.FIELD_W | 0) + "x" + (FLD.FIELD_H | 0);
    for (var i = 0; i < hs.length; i++) { var h = hs[i]; s += "|" + (h.x | 0) + "," + (h.z | 0) + "," + h.h + "," + h.s; }
    return s;
  } catch (e) { return "0"; }
}
function fldTrHeightRange() {
  var sig = _fldTrTerrainSig();
  if (FLDTR_S.hr && FLDTR_S.hrKey === sig) return FLDTR_S.hr;
  var W = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_W : 1200, H = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_H : 900;
  var mn = Infinity, mx = -Infinity, NX = 28, NZ = 22;
  if (typeof fldTerrainH === "function" && __FIELD && __FIELD.terrain) {
    for (var zi = 0; zi <= NZ; zi++) for (var xi = 0; xi <= NX; xi++) {
      var hh = fldTerrainH(xi / NX * W, zi / NZ * H); if (hh < mn) mn = hh; if (hh > mx) mx = hh;
    }
  }
  if (!(mx > mn)) { mn = 0; mx = 1; }
  FLDTR_S.hr = { min: mn, max: mx }; FLDTR_S.hrKey = sig; return FLDTR_S.hr;
}
/* a 0..1 normalized height for a world point (clamped) */
function _fldTrNorm(h) { var r = fldTrHeightRange(); var t = (h - r.min) / (r.max - r.min); return t < 0 ? 0 : (t > 1 ? 1 : t); }
/* viridis ramp lookup: t in 0..1 -> [r,g,b] 0..1 */
function _fldTrViridis(t) {
  if (t <= 0) { var a0 = FLDTR.VIRIDIS[0]; return [a0[1], a0[2], a0[3]]; }
  if (t >= 1) { var a1 = FLDTR.VIRIDIS[FLDTR.VIRIDIS.length - 1]; return [a1[1], a1[2], a1[3]]; }
  for (var i = 1; i < FLDTR.VIRIDIS.length; i++) {
    var b = FLDTR.VIRIDIS[i]; if (t <= b[0]) { var a = FLDTR.VIRIDIS[i - 1]; var f = (t - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f]; }
  }
  var z = FLDTR.VIRIDIS[FLDTR.VIRIDIS.length - 1]; return [z[1], z[2], z[3]];
}
function _fldTrHex(t) { var c = _fldTrViridis(t); return "rgb(" + Math.round(c[0] * 255) + "," + Math.round(c[1] * 255) + "," + Math.round(c[2] * 255) + ")"; }

/* ===========================================================================
   TOPOGRAPHY CLASSIFICATION — name the dominant terrain type at a world point
   (used by the hover readout). Priority: man-made / hazard first.
   =========================================================================== */
function fldTrTypeAt(x, z) {
  var t = __FIELD && __FIELD.terrain; if (!t) return "Open field";
  function inAny(arr) { if (!arr) return false; for (var i = 0; i < arr.length; i++) { var f = arr[i]; var dx = x - f.x, dz = z - f.z; if (dx * dx + dz * dz < (f.r || 60) * (f.r || 60)) return true; } return false; }
  if (typeof fldNearWall === "function" && fldNearWall(x, z)) return "Stone wall";
  if (inAny(t.forts)) return "Fort / earthwork";
  if (inAny(t.towns)) return "Town";
  if (inAny(t.swamps)) return "Swamp";
  // water / fords (T13 live rivers)
  if (typeof fldEngCrossAt === "function") { try { var cr = fldEngCrossAt(x, z); if (cr) return cr.name || (cr.open ? "Ford" : "River"); } catch (e) {} }
  if (t.markers) { for (var i = 0; i < t.markers.length; i++) { var mk = t.markers[i]; if ((mk.kind === "ford" || mk.kind === "bridge") && typeof mk.x === "number") { var dx = x - mk.x, dz = z - mk.z; if (dx * dx + dz * dz < 40 * 40) return mk.kind === "bridge" ? "Bridge" : "Ford"; } } }
  if (typeof fldInWoods === "function" && fldInWoods(x, z)) return "Woods";
  // road / creek ribbon proximity
  if (t.markers) { for (var j = 0; j < t.markers.length; j++) { var m2 = t.markers[j]; if (m2.path && (m2.kind === "road" || m2.kind === "creek") && _fldTrNearPath(x, z, m2.path, m2.kind === "road" ? 22 : 16)) return m2.kind === "road" ? "Road" : "Creek"; } }
  return "Open field";
}
function _fldTrNearPath(x, z, path, w) {
  for (var p = 1; p < path.length; p++) {
    var a = path[p - 1], b = path[p], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
    var tt = L2 ? (((x - a[0]) * dx + (z - a[1]) * dz) / L2) : 0; tt = tt < 0 ? 0 : (tt > 1 ? 1 : tt);
    var px = a[0] + tt * dx, pz = a[1] + tt * dz, ex = x - px, ez = z - pz; if (ex * ex + ez * ez < w * w) return true;
  }
  return false;
}
function _fldTrElevWord(t01) { return t01 < 0.18 ? "hollow" : (t01 < 0.4 ? "low" : (t01 < 0.6 ? "level" : (t01 < 0.82 ? "rise" : "crest"))); }

/* which topography types are PRESENT this battle (for the legend key) */
function fldTrPresentTypes() {
  var t = __FIELD && __FIELD.terrain, out = { field: true };
  if (!t) return out;
  if ((typeof fldHills === "function" ? fldHills().length : (t.hill ? 1 : 0))) out.hill = true;
  if (t.woods && t.woods.length) out.woods = true;
  if ((typeof fldWalls === "function" ? fldWalls().length : (t.wall ? 1 : 0))) out.wall = true;
  if (t.swamps && t.swamps.length) out.swamp = true;
  if (t.towns && t.towns.length) out.town = true;
  if (t.forts && t.forts.length) out.fort = true;
  var hasWater = false, hasRoad = false;
  if (t.markers) for (var i = 0; i < t.markers.length; i++) { var k = t.markers[i].kind; if (k === "ford" || k === "bridge" || k === "creek") hasWater = true; if (k === "road") hasRoad = true; }
  if (typeof __FIELD !== "undefined" && __FIELD && __FIELD._waterGroup) hasWater = true;
  if (hasWater) out.water = true;
  if (hasRoad) out.road = true;
  return out;
}

/* ===========================================================================
   3D — HYPSOMETRIC OVERLAY + CONTOURS + SWAMP/TOWN/FORT DECOR. Built once after
   fld3dBuildTerrain (so we read T18+T21's final vertex colours + the heights),
   tracked + disposed here, .visible-toggled per mode.
   =========================================================================== */
function fldTrDispose3d() {
  var objs = [FLDTR_S.hyp3d, FLDTR_S.contour3d, FLDTR_S.decor3d];
  for (var i = 0; i < objs.length; i++) {
    var o = objs[i]; if (!o) continue;
    try {
      // traverse(cb) invokes cb(o) on the root FIRST, then its descendants — so this disposes a bare Mesh (hyp3d)
      // AND every child of a Group (contour3d/decor3d) exactly once. No separate explicit root dispose (that would
      // double-dispose hyp3d's cloned geometry/material). Matches the base fld3dDispose / T21 single-pass pattern.
      o.traverse && o.traverse(function (n) {
        if (n.geometry && n.geometry.dispose) n.geometry.dispose();
        if (n.material) { var m = n.material; if (Array.isArray(m)) { for (var j = 0; j < m.length; j++) m[j] && m[j].dispose && m[j].dispose(); } else if (m.dispose) m.dispose(); if (m.map && m.map.dispose) m.map.dispose(); }
      });
      if (o.parent) o.parent.remove(o);
    } catch (e) {}
  }
  FLDTR_S.hyp3d = null; FLDTR_S.contour3d = null; FLDTR_S.decor3d = null;
}
function fldTrBuild3d() {
  var T = window.THREE;
  if (!T || typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene) return;
  FLDTR_S.hr = null;                                  // fresh terrain -> recompute the range
  fldTrDispose3d();
  var grd = __FIELD.ground; if (!grd || !grd.geometry) return;
  // 1. HYPSOMETRIC OVERLAY — clone the ground geometry, recolour by viridis-of-height, lay it just above.
  try {
    var geo = grd.geometry.clone();
    var posA = geo.attributes.position, cnt = posA.count, cols = new Float32Array(cnt * 3);
    var r = fldTrHeightRange();
    for (var i = 0; i < cnt; i++) {
      var t01 = (posA.getY(i) - r.min) / (r.max - r.min); t01 = t01 < 0 ? 0 : (t01 > 1 ? 1 : t01);
      var c = _fldTrViridis(t01); cols[i * 3] = c[0]; cols[i * 3 + 1] = c[1]; cols[i * 3 + 2] = c[2];
    }
    geo.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
    var hmat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: FLDTR.HYP_MIX, depthWrite: false, fog: true });
    hmat.polygonOffset = true; hmat.polygonOffsetFactor = -1; hmat.polygonOffsetUnits = -2;
    var hmesh = new T.Mesh(geo, hmat); hmesh.name = "vfTrHyp";
    hmesh.position.copy(grd.position); hmesh.position.y += 0.6; hmesh.renderOrder = -0.4;
    __FIELD.scene.add(hmesh); FLDTR_S.hyp3d = hmesh;
  } catch (e) { FLDTR_S.errN++; }
  // 2. CONTOUR LINES + ELEVATION LABELS
  try { fldTrBuildContours3d(T, grd); } catch (e2) { FLDTR_S.errN++; }
  // 3. SWAMP / TOWN / FORT decoration (always shown when present; not an elevation mode)
  try { fldTrBuildDecor3d(T); } catch (e3) { FLDTR_S.errN++; }
  fldTrApply3dVisibility();
  fldTrSyncLegendKey();                                // a phase advance changes the sector -> refresh the legend key
}
function fldTrApply3dVisibility() {
  var m = fldElevMode();
  if (FLDTR_S.hyp3d) FLDTR_S.hyp3d.visible = (m === "hypsometric");
  if (FLDTR_S.contour3d) FLDTR_S.contour3d.visible = (m === "contours");
}
/* refresh the legend's topography KEY + height-range when the terrain CHANGES (a multi-phase phase advance gives
   a new sector with different woods/walls/swamps/etc.) — covers BOTH renderers: fldTrBuild3d calls it (3D), and
   fldTrDrawGround2d calls it per-frame (cheap: a sig compare; only refreshes on an actual change). */
// the legend KEY depends on the full topography (which types are present), not just the hills the height-range
// sig tracks — so it gets its OWN signature: the present-type set + the height sig. A phase advance that swaps in
// (say) a town with the same hills still changes this -> the key refreshes.
function _fldTrLegendSig() {
  var p = fldTrPresentTypes(), keys = "";
  for (var k in p) { if (p[k]) keys += k + ","; }
  return keys + "|" + _fldTrTerrainSig();
}
function fldTrSyncLegendKey() {
  if (!FLDTR_S.legend && (typeof document === "undefined" || !document.getElementById("fldElevLegend"))) return;
  var sig = _fldTrLegendSig();
  if (sig === FLDTR_S.legendSig) return;
  FLDTR_S.legendSig = sig; FLDTR_S.hr = null;       // new terrain -> drop the cached height range too
  fldTrRefreshLegend();
}
function fldTrBuildContours3d(T, grd) {
  var geo = grd.geometry, posA = geo.attributes.position, cnt = posA.count;
  var n = Math.round(Math.sqrt(cnt)); if (n < 2 || n * n !== cnt) return;     // square (seg+1)^2 grid
  var hg = new Float32Array(cnt);
  for (var i = 0; i < cnt; i++) hg[i] = posA.getY(i);
  var W = (typeof FLD !== "undefined" ? FLD.FIELD_W : 1200), H = (typeof FLD !== "undefined" ? FLD.FIELD_H : 900);
  var dx = W / (n - 1), dz = H / (n - 1), x0 = -W / 2, z0 = -H / 2;           // ground geometry local coords
  var r = fldTrHeightRange(), range = r.max - r.min;
  var lo = (typeof fldLow === "function") ? fldLow() : false;
  var NL = lo ? FLDTR.CONTOUR_N_LO : FLDTR.CONTOUR_N_HI;
  var verts = [], group = new T.Group(); group.name = "vfTrContours";
  var labels = [], labelN = 0;
  for (var L = 1; L < NL; L++) {
    var level = r.min + range * (L / NL);
    var labeled = false;
    for (var cz = 0; cz < n - 1; cz++) for (var cx = 0; cx < n - 1; cx++) {
      var i00 = cz * n + cx, i10 = i00 + 1, i01 = i00 + n, i11 = i01 + 1;
      var h00 = hg[i00], h10 = hg[i10], h01 = hg[i01], h11 = hg[i11];
      var ax0 = x0 + cx * dx, az0 = z0 + cz * dz, ax1 = ax0 + dx, az1 = az0 + dz, pts = [];
      _fldTrEdge(level, h00, h10, ax0, az0, ax1, az0, pts);   // bottom
      _fldTrEdge(level, h10, h11, ax1, az0, ax1, az1, pts);   // right
      _fldTrEdge(level, h01, h11, ax0, az1, ax1, az1, pts);   // top
      _fldTrEdge(level, h00, h01, ax0, az0, ax0, az1, pts);   // left
      if (pts.length >= 2) { verts.push(pts[0][0], level + 1.6, pts[0][1], pts[1][0], level + 1.6, pts[1][1]); if (pts.length === 4) verts.push(pts[2][0], level + 1.6, pts[2][1], pts[3][0], level + 1.6, pts[3][1]); }
      if (!labeled && pts.length >= 2 && labelN < FLDTR.LABEL_MAX && !lo) {
        labels.push({ x: pts[0][0], y: level + 6, z: pts[0][1], v: Math.round(level - r.min) }); labeled = true; labelN++;
      }
    }
  }
  if (verts.length) {
    var lg = new T.BufferGeometry(); lg.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
    var lm = new T.LineBasicMaterial({ color: FLDTR.CONTOUR_COL, transparent: true, opacity: 0.82, depthWrite: false });
    var lines = new T.LineSegments(lg, lm); lines.name = "vfTrContourLines"; lines.renderOrder = 2; group.add(lines);
  }
  for (var k = 0; k < labels.length; k++) { var sp = fldTrLabelSprite(T, "+" + labels[k].v); if (sp) { sp.position.set(labels[k].x, labels[k].y, labels[k].z); group.add(sp); } }
  group.position.copy(grd.position);
  __FIELD.scene.add(group); FLDTR_S.contour3d = group;
}
function _fldTrEdge(level, hA, hB, ax, az, bx, bz, out) {
  if ((hA < level) !== (hB < level)) { var d = hB - hA; var t = d === 0 ? 0.5 : (level - hA) / d; out.push([ax + (bx - ax) * t, az + (bz - az) * t]); }
}
function fldTrLabelSprite(T, text) {
  try {
    var c = document.createElement("canvas"); c.width = 64; c.height = 32; var g = c.getContext("2d");
    g.font = "bold 22px Georgia"; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 5; g.strokeStyle = "rgba(12,10,7,0.9)"; g.strokeText(text, 32, 17);
    g.fillStyle = "#f7efdd"; g.fillText(text, 32, 17);
    var tex = new T.CanvasTexture(c); tex.needsUpdate = true; tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = false;
    var sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(34, 17, 1); sp.renderOrder = 3; sp.name = "vfTrLabel"; return sp;
  } catch (e) { FLDTR_S.errN++; return null; }
}
function fldTrBuildDecor3d(T) {
  var t = __FIELD.terrain; if (!t) return;
  if ((!t.swamps || !t.swamps.length) && (!t.towns || !t.towns.length) && (!t.forts || !t.forts.length)) return;
  var grp = new T.Group(); grp.name = "vfTrDecor";
  var lo = (typeof fldLow === "function") ? fldLow() : false;
  function ground(x, z) { return (typeof fldTerrainH === "function") ? fldTerrainH(x, z) : 0; }
  // SWAMP — a dark wet sheen disc + sparse reed tufts (distinct from woods' green cones)
  var sw = t.swamps || [];
  for (var s = 0; s < sw.length; s++) {
    var f = sw[s], rr = f.r || 90;
    var disc = new T.Mesh(new T.CircleGeometry(rr, lo ? 16 : 28), new T.MeshBasicMaterial({ color: FLDTR.SWAMP_COL, transparent: true, opacity: 0.72, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(f.x, ground(f.x, f.z) + 0.5, f.z); disc.renderOrder = -0.3; grp.add(disc);
    var nreed = lo ? 6 : 12, reedGeo = new T.CylinderGeometry(0.6, 0.6, 14, 4), reedMat = new T.MeshLambertMaterial({ color: FLDTR.SWAMP_REED });
    var rim = new T.InstancedMesh(reedGeo, reedMat, nreed), dm = new T.Object3D();
    for (var ri = 0; ri < nreed; ri++) { var a = (ri / nreed) * 6.283 + ri, rad = (0.3 + ((ri * 41) % 60) / 100) * rr, tx = f.x + Math.cos(a) * rad, tz = f.z + Math.sin(a) * rad; dm.position.set(tx, ground(tx, tz) + 7, tz); dm.updateMatrix(); rim.setMatrixAt(ri, dm.matrix); }
    try { reedGeo.boundingSphere = new T.Sphere(new T.Vector3(f.x, ground(f.x, f.z) + 7, f.z), rr + 16); } catch (e) {}
    grp.add(rim);
  }
  // TOWN — a cluster of small buildings (warm walls + darker roofs)
  var tw = t.towns || [];
  for (var w = 0; w < tw.length; w++) {
    var ft = tw[w], tr = ft.r || 80, nb = lo ? 5 : 9;
    for (var bi = 0; bi < nb; bi++) {
      var ba = (bi / nb) * 6.283 + bi * 1.7, brad = (0.15 + ((bi * 53) % 70) / 100) * tr;
      var bx = ft.x + Math.cos(ba) * brad, bz = ft.z + Math.sin(ba) * brad;
      var bw = 18 + (bi % 3) * 7, bh = 16 + (bi % 4) * 7, bd = 16 + (bi % 2) * 8;
      var wall = new T.Mesh(new T.BoxGeometry(bw, bh, bd), new T.MeshLambertMaterial({ color: FLDTR.TOWN_WALL }));
      wall.position.set(bx, ground(bx, bz) + bh / 2, bz); wall.rotation.y = ba; grp.add(wall);
      var roof = new T.Mesh(new T.BoxGeometry(bw + 3, 4, bd + 3), new T.MeshLambertMaterial({ color: FLDTR.TOWN_ROOF }));
      roof.position.set(bx, ground(bx, bz) + bh + 2, bz); roof.rotation.y = ba; grp.add(roof);
    }
  }
  // FORT — a low angular earthwork berm ring + corner bastions (distinct from the thin stone wall)
  var fo = t.forts || [];
  for (var ff = 0; ff < fo.length; ff++) {
    var fr = fo[ff], R = fr.r || 70;
    var berm = new T.Mesh(new T.TorusGeometry(R, 7, lo ? 5 : 8, lo ? 10 : 18), new T.MeshLambertMaterial({ color: FLDTR.FORT_BERM }));
    berm.rotation.x = Math.PI / 2; berm.position.set(fr.x, ground(fr.x, fr.z) + 6, fr.z); grp.add(berm);
    for (var ci = 0; ci < 5; ci++) { var ca = (ci / 5) * 6.283 + 0.6, cx = fr.x + Math.cos(ca) * R, cz = fr.z + Math.sin(ca) * R; var bast = new T.Mesh(new T.ConeGeometry(13, 16, 4), new T.MeshLambertMaterial({ color: FLDTR.FORT_BERM })); bast.position.set(cx, ground(cx, cz) + 8, cz); bast.rotation.y = ca; grp.add(bast); }
  }
  __FIELD.scene.add(grp); FLDTR_S.decor3d = grp;
}

/* ===========================================================================
   2D — relief shading the top-down view never had, plus the hypsometric tint /
   contours / swamp-town-fort markers. Drawn UNDER the base's woods+units via the
   guarded fldTrDrawGround2d hook (called from fld2dDraw right after the field fill).
   =========================================================================== */
function fldTrDrawGround2d(ctx, v) {
  if (!ctx || !v) return;
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.terrain) return;
  // This is called from the BASE fld2dDraw (a direct T0 hook, not a try/catch seam wrapper), so guard the WHOLE
  // body: a render throw must never break the 2D loop. Count into FLDTR_S.errN (the probe asserts it is 0).
  try {
    var W = (typeof FLD !== "undefined" ? FLD.FIELD_W : 1200), H = (typeof FLD !== "undefined" ? FLD.FIELD_H : 900);
    var fx = v.ox, fz = v.oz, fw = W * v.s, fh = H * v.s; if (!(fw > 1) || !(fh > 1)) return;
    var mode = fldElevMode(), lo = (typeof fldLow === "function") ? fldLow() : false;
    var sig = _fldTrTerrainSig(), key = sig + "@" + v.s.toFixed(3) + (lo ? "L" : "H");
    fldTrSyncLegendKey();   // 2D phase advance -> refresh the stale legend key (no-op when the topography is unchanged)
    // (a) HILLSHADE base — present in every mode (cached canvas, one blit)
    if (FLDTR_S.shadeKey !== key) { FLDTR_S.shadeCv = _fldTrBuildShade2d(fw, fh, W, H, lo); FLDTR_S.shadeKey = key; }
    if (FLDTR_S.shadeCv) ctx.drawImage(FLDTR_S.shadeCv, fx, fz);
    // (b) HYPSOMETRIC tint (cached canvas)
    if (mode === "hypsometric") {
      if (FLDTR_S.hypKey !== key) { FLDTR_S.hypCv = _fldTrBuildHyp2d(fw, fh, W, H, lo); FLDTR_S.hypKey = key; }
      if (FLDTR_S.hypCv) { var pa = ctx.globalAlpha; ctx.globalAlpha = 0.6; ctx.drawImage(FLDTR_S.hypCv, fx, fz); ctx.globalAlpha = pa; }
    }
    // (c) CONTOUR lines + labels
    if (mode === "contours") fldTrDrawContours2d(ctx, v, W, H, key, lo);
    // (d) SWAMP / TOWN / FORT markers (always)
    fldTrDrawDecor2d(ctx, v);
  } catch (e) { FLDTR_S.errN++; if (!FLDTR_S._warned && typeof console !== "undefined" && console.warn) { FLDTR_S._warned = true; console.warn("T22 terrain-readability 2D:", (e && e.message) || e); } }
}
function _fldTrBuildShade2d(fw, fh, W, H, lo) {
  try {
    var c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(fw)); c.height = Math.max(1, Math.ceil(fh));
    var g = c.getContext("2d"); if (!g || typeof fldTerrainH !== "function") return null;
    var cell = lo ? 26 : 16, r = fldTrHeightRange(), range = r.max - r.min || 1;
    var sx = fw / W, sz = fh / H;
    for (var gy = 0; gy < fh; gy += cell) for (var gx = 0; gx < fw; gx += cell) {
      var wx = (gx + cell / 2) / sx, wz = (gy + cell / 2) / sz;
      var hc = fldTerrainH(wx, wz);
      // slope toward the NW light (dx from west neighbour, dz from north neighbour)
      var hl = fldTerrainH(wx - 26, wz), hu = fldTerrainH(wx, wz - 26);
      var slope = ((hc - hl) + (hc - hu)) * 0.5;     // >0 = NW-facing (lit), <0 = shadowed
      var rel = (hc - r.min) / range - 0.5;          // overall high/low
      var lum = rel * 0.5 + slope * 0.05;            // combine altitude + directional light
      var a = Math.min(0.28, Math.abs(lum) * 0.5 + Math.abs(slope) * 0.02);
      if (a > 0.012) { g.globalAlpha = a; g.fillStyle = lum >= 0 ? "#ffffff" : "#0a1006"; g.fillRect(gx, gy, cell + 1, cell + 1); }
    }
    g.globalAlpha = 1; return c;
  } catch (e) { return null; }
}
function _fldTrBuildHyp2d(fw, fh, W, H, lo) {
  try {
    var c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(fw)); c.height = Math.max(1, Math.ceil(fh));
    var g = c.getContext("2d"); if (!g || typeof fldTerrainH !== "function") return null;
    var cell = lo ? 22 : 14, sx = fw / W, sz = fh / H;
    for (var gy = 0; gy < fh; gy += cell) for (var gx = 0; gx < fw; gx += cell) {
      var wx = (gx + cell / 2) / sx, wz = (gy + cell / 2) / sz;
      g.fillStyle = _fldTrHex(_fldTrNorm(fldTerrainH(wx, wz))); g.fillRect(gx, gy, cell + 1, cell + 1);
    }
    return c;
  } catch (e) { return null; }
}
function fldTrDrawContours2d(ctx, v, W, H, key, lo) {
  // PERF (bug-hunt): the contour polylines are cached (contourPath), but the DRAWING was re-issued every frame —
  // ~600-1600 individual beginPath/stroke calls per frame, a real UHD-617 sink. Render the WHOLE contour layer
  // (batched into 2 strokes + the labels) into an offscreen canvas ONCE per cache key, then blit it (one drawImage
  // per frame, like the shade/hyp caches). contourPath stays populated for the probe's 2D-parity assertion.
  if (FLDTR_S.contourKey !== key || !FLDTR_S.contourCv) {
    FLDTR_S.contourPath = _fldTrComputeContours2d(W, H, lo);
    FLDTR_S.contourCv = _fldTrRenderContourCanvas(FLDTR_S.contourPath, W, H, v);
    FLDTR_S.contourKey = key;
  }
  if (FLDTR_S.contourCv) ctx.drawImage(FLDTR_S.contourCv, v.ox, v.oz);
}
function _fldTrRenderContourCanvas(data, W, H, v) {
  if (!data || !data.segs) return null;
  try {
    var fw = W * v.s, fh = H * v.s;
    var c = document.createElement("canvas"); c.width = Math.max(1, Math.ceil(fw)); c.height = Math.max(1, Math.ceil(fh));
    var g = c.getContext("2d"); if (!g) return null;
    var i, s;
    // ALL segments batched into ONE path per pass -> 2 stroke() calls total (dark underlay + cream line), not 2*N
    g.strokeStyle = "rgba(20,16,10,0.55)"; g.lineWidth = 2.6; g.beginPath();
    for (i = 0; i < data.segs.length; i++) { s = data.segs[i]; g.moveTo(s[0] * v.s, s[1] * v.s); g.lineTo(s[2] * v.s, s[3] * v.s); }
    g.stroke();
    g.strokeStyle = "rgba(243,234,210,0.92)"; g.lineWidth = 1.2; g.beginPath();
    for (i = 0; i < data.segs.length; i++) { s = data.segs[i]; g.moveTo(s[0] * v.s, s[1] * v.s); g.lineTo(s[2] * v.s, s[3] * v.s); }
    g.stroke();
    g.font = "bold 11px Georgia"; g.textAlign = "center"; g.textBaseline = "middle";
    for (i = 0; i < data.labels.length; i++) { var lb = data.labels[i], lx = lb.x * v.s, lz = lb.z * v.s; g.lineWidth = 3; g.strokeStyle = "rgba(12,10,7,0.9)"; g.strokeText("+" + lb.v, lx, lz); g.fillStyle = "#f7efdd"; g.fillText("+" + lb.v, lx, lz); }
    return c;
  } catch (e) { return null; }
}
function _fldTrComputeContours2d(W, H, lo) {
  if (typeof fldTerrainH !== "function") return null;
  var NX = lo ? 36 : 56, NZ = lo ? 27 : 42, dx = W / NX, dz = H / NZ;
  var hg = new Float32Array((NX + 1) * (NZ + 1));
  for (var zi = 0; zi <= NZ; zi++) for (var xi = 0; xi <= NX; xi++) hg[zi * (NX + 1) + xi] = fldTerrainH(xi * dx, zi * dz);
  var r = fldTrHeightRange(), range = r.max - r.min, NL = lo ? FLDTR.CONTOUR_N_LO : FLDTR.CONTOUR_N_HI;
  var segs = [], labels = [], labelN = 0;
  for (var L = 1; L < NL; L++) {
    var level = r.min + range * (L / NL), labeled = false;
    for (var cz = 0; cz < NZ; cz++) for (var cx = 0; cx < NX; cx++) {
      var i00 = cz * (NX + 1) + cx, i10 = i00 + 1, i01 = i00 + (NX + 1), i11 = i01 + 1;
      var h00 = hg[i00], h10 = hg[i10], h01 = hg[i01], h11 = hg[i11];
      var ax0 = cx * dx, az0 = cz * dz, ax1 = ax0 + dx, az1 = az0 + dz, pts = [];
      _fldTrEdge(level, h00, h10, ax0, az0, ax1, az0, pts);
      _fldTrEdge(level, h10, h11, ax1, az0, ax1, az1, pts);
      _fldTrEdge(level, h01, h11, ax0, az1, ax1, az1, pts);
      _fldTrEdge(level, h00, h01, ax0, az0, ax0, az1, pts);
      if (pts.length >= 2) { segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]); if (pts.length === 4) segs.push([pts[2][0], pts[2][1], pts[3][0], pts[3][1]]); if (!labeled && labelN < FLDTR.LABEL_MAX) { labels.push({ x: pts[0][0], z: pts[0][1], v: Math.round(level - r.min) }); labeled = true; labelN++; } }
    }
  }
  return { segs: segs, labels: labels };
}
function fldTrDrawDecor2d(ctx, v) {
  var t = __FIELD.terrain; if (!t) return;
  var sw = t.swamps || [], tw = t.towns || [], fo = t.forts || [];
  // SWAMP — murky teal fill + reed ticks + water glints
  for (var s = 0; s < sw.length; s++) {
    var f = sw[s], cx = v.ox + f.x * v.s, cz = v.oz + f.z * v.s, rr = (f.r || 90) * v.s;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cz, rr, 0, 7); ctx.clip();
    ctx.fillStyle = "#2c4a43"; ctx.fillRect(cx - rr, cz - rr, rr * 2, rr * 2);
    ctx.strokeStyle = "rgba(120,150,120,0.5)"; ctx.lineWidth = 1.5;
    for (var rk = 0; rk < 16; rk++) { var ang = rk * 2.7, px = cx + Math.cos(ang) * rr * ((rk % 5) / 5), py = cz + Math.sin(ang * 1.3) * rr * ((rk % 4) / 4); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 5 * v.s - 3); ctx.stroke(); }
    ctx.fillStyle = "rgba(150,180,180,0.35)"; for (var wg = 0; wg < 6; wg++) { var gx = cx + Math.cos(wg * 2.1) * rr * 0.6, gy = cz + Math.sin(wg * 1.7) * rr * 0.6; ctx.beginPath(); ctx.ellipse(gx, gy, 5 * v.s + 2, 2 * v.s + 1, 0, 0, 7); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = "rgba(40,70,62,0.8)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cz, rr, 0, 7); ctx.stroke();
  }
  // TOWN — clustered building blocks
  for (var w = 0; w < tw.length; w++) {
    var ft = tw[w], tx = ft.x, tz = ft.z, tR = ft.r || 80, nb = 9;
    for (var bi = 0; bi < nb; bi++) {
      var ba = (bi / nb) * 6.283 + bi * 1.7, brad = (0.15 + ((bi * 53) % 70) / 100) * tR;
      var bx = v.ox + (tx + Math.cos(ba) * brad) * v.s, bz = v.oz + (tz + Math.sin(ba) * brad) * v.s;
      var bw = (16 + (bi % 3) * 7) * v.s, bh = (14 + (bi % 2) * 8) * v.s;
      ctx.save(); ctx.translate(bx, bz); ctx.rotate(ba);
      ctx.fillStyle = "#9a8a70"; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.fillStyle = "#5f4d3a"; ctx.fillRect(-bw / 2, -bh / 2, bw, Math.max(1.5, bh * 0.32));
      ctx.restore();
    }
  }
  // FORT — angular earthwork outline + parapet
  for (var fi = 0; fi < fo.length; fi++) {
    var fr = fo[fi], fcx = v.ox + fr.x * v.s, fcz = v.oz + fr.z * v.s, fR = (fr.r || 70) * v.s;
    ctx.save();
    ctx.strokeStyle = "rgba(60,46,28,0.9)"; ctx.lineWidth = 6; ctx.beginPath();
    for (var ci = 0; ci <= 5; ci++) { var a2 = (ci / 5) * 6.283 + 0.6, px2 = fcx + Math.cos(a2) * fR, py2 = fcz + Math.sin(a2) * fR; if (ci === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2); }
    ctx.stroke();
    ctx.strokeStyle = "#8a6f48"; ctx.lineWidth = 2.5; ctx.beginPath();
    for (var cj = 0; cj <= 5; cj++) { var a3 = (cj / 5) * 6.283 + 0.6, px3 = fcx + Math.cos(a3) * fR, py3 = fcz + Math.sin(a3) * fR; if (cj === 0) ctx.moveTo(px3, py3); else ctx.lineTo(px3, py3); }
    ctx.stroke();
    ctx.restore();
  }
}

/* ===========================================================================
   LEGEND PANEL + ON-HOVER READOUT (DOM). Compact, always-on (Aaron's pick),
   docked bottom-right, collapsible. CVD-safe (shape + number + label), AA contrast.
   =========================================================================== */
function fldTrEnsureLegend() {
  if (typeof document === "undefined") return;
  var root = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.root : null; if (!root) return;
  if (document.getElementById("fldElevLegend")) { fldTrRefreshLegend(); return; }
  var d = document.createElement("div"); d.id = "fldElevLegend"; d.setAttribute("role", "region"); d.setAttribute("aria-label", "Terrain & elevation key");
  d.style.cssText = "position:absolute;right:12px;bottom:12px;z-index:40;min-width:172px;max-width:230px;background:#0c0f14ec;border:1px solid #745e3f;border-radius:6px;padding:8px 10px;font:12px Georgia,serif;color:#f2e8d5;box-shadow:0 4px 18px #0009;";
  root.appendChild(d); FLDTR_S.legend = d;
  FLDTR_S.legendSig = _fldTrLegendSig();   // the key is built for THIS topography; sync only refreshes on a change
  fldTrRefreshLegend();
}
function _fldTrGradientCss() {
  var stops = []; for (var i = 0; i < FLDTR.VIRIDIS.length; i++) { var s = FLDTR.VIRIDIS[i]; stops.push("rgb(" + Math.round(s[1] * 255) + "," + Math.round(s[2] * 255) + "," + Math.round(s[3] * 255) + ") " + Math.round(s[0] * 100) + "%"); }
  return "linear-gradient(90deg," + stops.join(",") + ")";
}
function _fldTrKeyHTML() {
  var p = fldTrPresentTypes(), rows = [];
  function keyRow(sym, col, label) { return '<span style="display:inline-flex;align-items:center;gap:4px;margin:1px 6px 1px 0;white-space:nowrap;"><span aria-hidden="true" style="display:inline-block;width:12px;text-align:center;color:' + col + ';font-weight:bold;">' + sym + '</span>' + label + '</span>'; }
  if (p.field) rows.push(keyRow("·", "#9fb27a", "Field"));
  if (p.hill) rows.push(keyRow("◢", "#cdb98a", "Hill/ridge"));
  if (p.woods) rows.push(keyRow("♣", "#7faf6a", "Woods"));
  if (p.wall) rows.push(keyRow("▓", "#c9bfa6", "Wall"));
  if (p.water) rows.push(keyRow("≈", "#7fb0d0", "Water/ford"));
  if (p.road) rows.push(keyRow("═", "#cfa86a", "Road"));
  if (p.swamp) rows.push(keyRow("▒", "#5f9484", "Swamp"));
  if (p.town) rows.push(keyRow("⌂", "#cbb38e", "Town"));
  if (p.fort) rows.push(keyRow("◰", "#b78a5a", "Fort"));
  return '<div style="display:flex;flex-wrap:wrap;font-size:11px;opacity:.92;margin-top:5px;border-top:1px solid #4a3c28;padding-top:5px;">' + rows.join("") + '</div>';
}
function fldTrRefreshLegend() {
  var d = FLDTR_S.legend || document.getElementById("fldElevLegend"); if (!d) return;
  if (FLDTR_S.collapsed) {
    d.innerHTML = '<button id="fldElevExpand" type="button" aria-label="Show terrain key" style="background:none;border:none;color:#f2e8d5;font:12px Georgia,serif;cursor:pointer;padding:0;">&#9650; Terrain</button>';
    // refresh rebuilds innerHTML (destroying the activated button) -> restore focus to the new control so a
    // keyboard user is never dropped to <body> (bug-hunt A11Y). The R-key + phase-advance refresh do NOT route
    // through these click handlers, so they never steal focus.
    var ex = document.getElementById("fldElevExpand"); if (ex) ex.addEventListener("click", function () { FLDTR_S.collapsed = false; fldTrRefreshLegend(); var n = document.getElementById("fldElevMode"); if (n) try { n.focus(); } catch (e) {} });
    return;
  }
  var mode = fldElevMode();
  d.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">'
    + '<button id="fldElevMode" type="button" aria-label="Elevation display: ' + fldElevModeLabel(mode) + ' — click to cycle (R)" title="Cycle elevation display (R)" style="background:#1c1610;color:#f4ead2;border:1px solid #766040;border-radius:4px;padding:3px 7px;font:bold 11px Georgia,serif;cursor:pointer;">&#9650; ' + fldElevModeLabel(mode) + '</button>'
    + '<button id="fldElevCollapse" type="button" aria-label="Hide terrain key" title="Hide" style="background:none;border:none;color:#cdbf9e;font:13px Georgia,serif;cursor:pointer;padding:0 2px;">&#9660;</button>'
    + '</div>'
    + '<div style="margin-top:5px;height:11px;border-radius:3px;border:1px solid #725e40;background:' + _fldTrGradientCss() + ';"></div>'
    /* wcag-auditor: contrast fix from #4a3c28 to #725e40 for AA compliance (1.4.11 UI component ≥3:1; was 1.80:1 on #0c0f14, now 3.10:1) */
    + '<div style="display:flex;justify-content:space-between;font-size:10px;opacity:.82;margin-top:1px;"><span>Low</span><span>High</span></div>'
    + '<div id="fldElevHover" aria-live="off" style="margin-top:5px;font-size:11px;min-height:14px;opacity:.95;">&#8982; <span style="opacity:.6;">hover the field</span></div>'
    + _fldTrKeyHTML();
  // restore focus after the innerHTML rebuild (fldCycleElevMode -> fldTrRefreshLegend wipes the clicked button) so
  // a keyboard user keeps their place on the control they just used (bug-hunt A11Y 4.0).
  var mb = document.getElementById("fldElevMode"); if (mb) mb.addEventListener("click", function () { fldCycleElevMode(); var n = document.getElementById("fldElevMode"); if (n) try { n.focus(); } catch (e) {} });
  var cb = document.getElementById("fldElevCollapse"); if (cb) cb.addEventListener("click", function () { FLDTR_S.collapsed = true; fldTrRefreshLegend(); var n2 = document.getElementById("fldElevExpand"); if (n2) try { n2.focus(); } catch (e) {} });
}
/* hover readout — driven by fldPointerMove (which sets __FIELD.hover); throttled by cell */
function fldTrUpdateHover() {
  if (typeof document === "undefined") return;
  var el = document.getElementById("fldElevHover"); if (!el) return;
  var hv = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.hover : null;
  if (!hv) { FLDTR_S.hovCell = null; if (FLDTR_S.hoverKey !== null) { FLDTR_S.hoverKey = null; el.innerHTML = '&#8982; <span style="opacity:.6;">hover the field</span>'; } return; }
  // pointermove can fire 60-120x/sec during a drag-order; skip the marker-iterating classify (fldTrTypeAt) +
  // sampler when the pointer is still in the same ~6yd cell. The readout is only yard-precise, so this is lossless.
  var cell = Math.round(hv.x / 6) + "," + Math.round(hv.z / 6);
  if (cell === FLDTR_S.hovCell) return; FLDTR_S.hovCell = cell;
  var h = (typeof fldTerrainH === "function") ? fldTerrainH(hv.x, hv.z) : 0;
  var r = fldTrHeightRange(), t01 = (h - r.min) / (r.max - r.min); t01 = t01 < 0 ? 0 : (t01 > 1 ? 1 : t01);
  var yards = Math.round(h - r.min), type = fldTrTypeAt(hv.x, hv.z), word = _fldTrElevWord(t01);
  var key = yards + "|" + type;
  if (key === FLDTR_S.hoverKey) return; FLDTR_S.hoverKey = key;
  el.innerHTML = '&#8982; <b>+' + yards + ' yd</b> &middot; ' + word + ' &middot; ' + type;
}

/* ===========================================================================
   TEARDOWN
   =========================================================================== */
function fldTrDispose() {
  try { fldTrDispose3d(); } catch (e) {}
  try { if (FLDTR_S.legend && FLDTR_S.legend.parentNode) FLDTR_S.legend.parentNode.removeChild(FLDTR_S.legend); } catch (e2) {}
  FLDTR_S.legend = null; FLDTR_S.hoverKey = null; FLDTR_S.hovCell = null; FLDTR_S.collapsed = false; FLDTR_S.legendSig = null;
  FLDTR_S.hr = null; FLDTR_S.hrKey = null;
  FLDTR_S.shadeCv = null; FLDTR_S.shadeKey = null; FLDTR_S.hypCv = null; FLDTR_S.hypKey = null;
  FLDTR_S.contourPath = null; FLDTR_S.contourKey = null; FLDTR_S.contourCv = null; FLDTR_S.errN = 0; FLDTR_S._warned = false;
}

/* ===========================================================================
   WIRE-IN — wrap the render seams by ASSIGNMENT (T16/T17/T18/T21 pattern). T22 loads
   LAST, so fld3d* are defined + already wrapped by T16/T17/T18/T21; we wrap OUTERMOST
   and carry every prior marker forward so the chain stays introspectable. Every wrap
   try/catches so a render throw can never crash the loop (counted into FLDTR_S.errN;
   the probe asserts it is 0). The 2D ground hook + the R key live in T0/T6 (UI wiring,
   never sim) and call our fns guarded.
   =========================================================================== */
(function () {
  function _trErr(e) { FLDTR_S.errN++; if (!FLDTR_S._warned && typeof console !== "undefined" && console.warn) { FLDTR_S._warned = true; console.warn("T22 terrain-readability:", (e && e.message) || e); } }
  function _carryTr(dst, src) { for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { try { dst[k] = src[k]; } catch (e) {} } } }

  if (typeof fld3dInit === "function" && !fld3dInit._tr) {
    var _oi = fld3dInit;
    fld3dInit = function () { var r = _oi.apply(this, arguments); try { fldTrEnsureLegend(); } catch (e) { _trErr(e); } return r; };
    _carryTr(fld3dInit, _oi); fld3dInit._tr = true;
  }
  if (typeof fld3dBuildTerrain === "function" && !fld3dBuildTerrain._tr) {
    var _ot = fld3dBuildTerrain;
    fld3dBuildTerrain = function () { var r = _ot.apply(this, arguments); try { fldTrBuild3d(); } catch (e) { _trErr(e); } return r; };
    _carryTr(fld3dBuildTerrain, _ot); fld3dBuildTerrain._tr = true;
  }
  if (typeof fld2dInit === "function" && !fld2dInit._tr) {
    var _o2 = fld2dInit;
    fld2dInit = function () { var r = _o2.apply(this, arguments); try { FLDTR_S.hr = null; fldTrEnsureLegend(); } catch (e) { _trErr(e); } return r; };
    _carryTr(fld2dInit, _o2); fld2dInit._tr = true;
  }
  if (typeof fldPointerMove === "function" && !fldPointerMove._tr) {
    var _op = fldPointerMove;
    fldPointerMove = function (e) { var r = _op.apply(this, arguments); try { fldTrUpdateHover(); } catch (ex) { _trErr(ex); } return r; };
    _carryTr(fldPointerMove, _op); fldPointerMove._tr = true;
  }
  if (typeof fldExit === "function" && !fldExit._tr) {
    var _oe = fldExit;
    fldExit = function () { try { fldTrDispose(); } catch (e) { _trErr(e); } return _oe.apply(this, arguments); };
    _carryTr(fldExit, _oe); fldExit._tr = true;
  }
})();
