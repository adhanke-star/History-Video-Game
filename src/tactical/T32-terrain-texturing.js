/* ===========================================================================
   T32 — TERRAIN TEXTURING  (ARC 3 · LANE-014 slice 2 — audited albedo on the ground)

   Applies the audited Poly Haven CC0 terrain albedo maps (assets/3d/provenance.json
   is the license ledger; the media-budget assets3d wall enforces it) to the 3D
   ground mesh as ONE baked composite texture, keyed to the NINE analytic region
   predicates (clear / field / woods / hills / ridge / town / road / swamp / fort).
   The bake samples the region predicates on a coarse world grid, composites the
   matching albedo tiles into a single canvas with soft mask edges, normalizes each
   tile's exposure so the map MODULATES the authored palette instead of repainting
   it, and attaches the canvas as the existing Lambert material's map. Lambert
   multiplies map × vertex colours, so the grain pass (T18) and the relief/AO pass
   (T21) keep full effect — their vertex-colour work shows THROUGH the texture.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   wraps fld3dBuildTerrain / fldExit by ASSIGNMENT (the established seam law), reads
   ONLY render state + the analytic terrain accessors (fldTerrainH, fldInWoods,
   fldInSwamp, fldInTown, fldInFort, __FIELD.terrain.markers). It NEVER writes a sim
   field, NEVER touches geometry (vertex POSITIONS and vertex COLOURS both stay
   exactly as the earlier passes left them — only material.map changes), never uses
   the shared sim RNG, and never bumps the save format. Terrain heights stay
   analytic; unit seating/cover/mobility never read this layer.

   FAIL-CLOSED (the progressive-enhancement law): every early-out leaves the ground
   BYTE-IDENTICAL to the current shipped look —
     · renderRich === "off"            -> no map (the single visual-stack opt-out);
     · fldLow()                        -> no map (no low-tier profile evidence yet:
                                          the contract's "off or one cheap map —
                                          profile decides" resolves to OFF until a
                                          profile justifies the cheap-map branch);
     · non-http(s) protocol (file://)  -> no map (a local-file image taints the
                                          canvas and WebGL upload would throw — the
                                          offline single-file build keeps today's
                                          ground exactly);
     · any of the 9 albedos absent/blocked/unreadable -> no map at all (no partial
                                          bake; the fetch failure is the fail-closed
                                          path, NOT an error — errN stays 0).

   PERF (Intel UHD-617 floor): ZERO new scene objects, ZERO new draw calls — the
   map rides the existing ground mesh/material. The bake is a one-time canvas
   composite per battle terrain (re-baked only when the terrain signature changes);
   the texture is a single 1024×1024 POT canvas (mipmapped, clamped). Static —
   no per-frame work, so reduceMotion needs no suppression (the static-detail
   convention shared by the sibling presentation layers).
   =========================================================================== */

var FLDTT = {
  BASE: "assets/3d/materials/terrain/",         // ledgered CC0 albedos (provenance.json)
  KEYS: ["clear", "field", "woods", "hills", "ridge", "town", "road", "swamp", "fort"],
  BAKE: 1024,          // POT bake canvas (mipmap-safe on WebGL1)
  GRID: 128,           // region-classification grid (soft mask edges come from upscale)
  TILE: 256,           // per-key normalized tile size
  TILE_PX: 96,         // tile repeat size on the bake canvas (~112yd per repeat)
  TARGET_LUM: 232,     // per-tile mean-exposure target (map modulates, never repaints)
  FLAT_RANGE: 6,       // height range (yd) below which hills/ridge keys are skipped
  HILL_T: 0.62, RIDGE_T: 0.85,   // normalized-height thresholds
  ROAD_W: 12           // road-ribbon half-width (yd) for the marker-path predicate
};

var FLDTT_S = {
  imgs: null,          // { key: HTMLImageElement } once loading kicked
  tiles: null,         // { key: normalized 256x256 canvas } once prepared
  loadState: "idle",   // idle | loading | ready | failed  (failed => fail-closed, not an error)
  waiters: [],
  bake: null,          // { canvas, keys, cells, grid, sig } for the live battle
  tex: null, sig: null,
  errN: 0, _warned: false
};

/* ---- gates (each early-out is the byte-identical current ground) ---- */
function fldTtOff() {
  try { if (typeof G !== "undefined" && G && G.settings && G.settings.renderRich === "off") return true; } catch (e) {}
  return false;
}
function fldTtEligible() {
  if (fldTtOff()) return false;
  try { if (typeof fldLow === "function" && fldLow()) return false; } catch (e) {}
  try {
    var pr = (typeof location !== "undefined" && location && location.protocol) ? location.protocol : "";
    if (pr !== "http:" && pr !== "https:") return false;   // file:// would taint the bake canvas
  } catch (e2) { return false; }
  return true;
}

/* ---- deterministic analytic value noise (own lattice hash — no shared RNG).
   The cultivated-field mask uses the SAME lattice constants as the grain pass's
   crop mask, so the baked field texture lands under the furrow striping. ---- */
function _ttHash(ix, iz) {
  var h = (ix | 0) * 374761393 + (iz | 0) * 668265263;
  h = (h ^ (h >> 13)) >>> 0; h = (h * 1274126177) >>> 0; h = (h ^ (h >> 16)) >>> 0;
  return (h % 100000) / 100000;
}
function _ttVal(x, z) {
  var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  var sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  var a = _ttHash(ix, iz), b = _ttHash(ix + 1, iz), c = _ttHash(ix, iz + 1), d = _ttHash(ix + 1, iz + 1);
  var ab = a + (b - a) * sx, cd = c + (d - c) * sx;
  return ab + (cd - ab) * sz;
}

/* ---- road predicate from the scenario marker paths (render-side read only) ---- */
function _ttNearRoad(x, z) {
  var t = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.terrain : null;
  if (!t || !t.markers) return false;
  for (var i = 0; i < t.markers.length; i++) {
    var mk = t.markers[i];
    if (mk.kind !== "road" || !mk.path || mk.path.length < 2) continue;
    for (var p = 1; p < mk.path.length; p++) {
      var a = mk.path[p - 1], b = mk.path[p], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
      var tt = L2 ? (((x - a[0]) * dx + (z - a[1]) * dz) / L2) : 0; tt = tt < 0 ? 0 : (tt > 1 ? 1 : tt);
      var px = a[0] + tt * dx, pz = a[1] + tt * dz, ex = x - px, ez = z - pz;
      if (ex * ex + ez * ez < FLDTT.ROAD_W * FLDTT.ROAD_W) return true;
    }
  }
  return false;
}

/* ---- terrain signature (re-bake only when the sector actually changes) ---- */
function fldTtSig() {
  try {
    var t = __FIELD.terrain; if (!t) return "0";
    var s = (FLD.FIELD_W | 0) + "x" + (FLD.FIELD_H | 0);
    var hs = (typeof fldHills === "function") ? fldHills() : [];
    for (var i = 0; i < hs.length; i++) { var h = hs[i]; s += "|h" + (h.x | 0) + "," + (h.z | 0) + "," + h.h + "," + h.s; }
    if (t.woods) for (var w = 0; w < t.woods.length; w++) { var wd = t.woods[w]; s += "|w" + (wd.x | 0) + "," + (wd.z | 0) + "," + (wd.r | 0); }
    if (t.markers) s += "|m" + t.markers.length;
    return s;
  } catch (e) { return "0"; }
}

/* ---- image loading: all nine albedos or nothing (no partial bake) ---- */
function fldTtEnsureImages(cb) {
  if (FLDTT_S.loadState === "ready") { if (cb) cb(); return; }
  if (FLDTT_S.loadState === "failed") return;               // fail-closed for the session
  if (cb) FLDTT_S.waiters.push(cb);
  if (FLDTT_S.loadState === "loading") return;
  FLDTT_S.loadState = "loading";
  FLDTT_S.imgs = {};
  var left = FLDTT.KEYS.length, failed = false;
  function settle() {
    left--;
    if (left > 0) return;
    FLDTT_S.loadState = failed ? "failed" : "ready";
    if (failed) { FLDTT_S.waiters = []; return; }           // absent/blocked => byte-identical ground
    var ws = FLDTT_S.waiters; FLDTT_S.waiters = [];
    for (var i = 0; i < ws.length; i++) { try { ws[i](); } catch (e) { _ttErr(e); } }
  }
  for (var k = 0; k < FLDTT.KEYS.length; k++) {
    (function (key) {
      var img = new Image();
      img.onload = function () { settle(); };
      img.onerror = function () { failed = true; settle(); };
      img.src = FLDTT.BASE + key + "_albedo.png";
      FLDTT_S.imgs[key] = img;
    })(FLDTT.KEYS[k]);
  }
}

/* ---- per-key tile prep: downscale + normalize mean exposure toward TARGET_LUM ---- */
function fldTtPrepareTiles() {
  if (FLDTT_S.tiles) return FLDTT_S.tiles;
  var tiles = {};
  for (var k = 0; k < FLDTT.KEYS.length; k++) {
    var key = FLDTT.KEYS[k], img = FLDTT_S.imgs && FLDTT_S.imgs[key];
    if (!img || !img.complete || !img.naturalWidth) return null;
    var c = document.createElement("canvas"); c.width = c.height = FLDTT.TILE;
    var g = c.getContext("2d"); if (!g) return null;
    g.drawImage(img, 0, 0, FLDTT.TILE, FLDTT.TILE);
    var id;
    try { id = g.getImageData(0, 0, FLDTT.TILE, FLDTT.TILE); }
    catch (e) { FLDTT_S.loadState = "failed"; return null; } // tainted canvas => fail-closed
    var d = id.data, sum = 0, n = d.length / 4;
    for (var i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    var mean = sum / n, s = FLDTT.TARGET_LUM / Math.max(20, mean);
    for (var j = 0; j < d.length; j += 4) {
      var r = d[j] * s, gg = d[j + 1] * s, b = d[j + 2] * s;
      d[j] = r > 255 ? 255 : r; d[j + 1] = gg > 255 ? 255 : gg; d[j + 2] = b > 255 ? 255 : b;
      d[j + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    tiles[key] = c;
  }
  FLDTT_S.tiles = tiles;
  return tiles;
}

/* ---- region classification: one key per grid cell, strongest feature wins ---- */
function fldTtClassify() {
  var N = FLDTT.GRID, W = FLD.FIELD_W, H = FLD.FIELD_H;
  var cells = new Uint8Array(N * N);                        // index into FLDTT.KEYS
  var KI = {}; for (var q = 0; q < FLDTT.KEYS.length; q++) KI[FLDTT.KEYS[q]] = q;
  var hMin = Infinity, hMax = -Infinity, hs = new Float32Array(N * N);
  for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
    var h = fldTerrainH((i + 0.5) / N * W, (j + 0.5) / N * H);
    hs[j * N + i] = h; if (h < hMin) hMin = h; if (h > hMax) hMax = h;
  }
  var range = hMax - hMin, flat = !(range > FLDTT.FLAT_RANGE);
  for (var z = 0; z < N; z++) {
    for (var x = 0; x < N; x++) {
      var wx = (x + 0.5) / N * W, wz = (z + 0.5) / N * H, key;
      if (typeof fldInFort === "function" && fldInFort(wx, wz)) key = "fort";
      else if (typeof fldInTown === "function" && fldInTown(wx, wz)) key = "town";
      else if (typeof fldInSwamp === "function" && fldInSwamp(wx, wz)) key = "swamp";
      else if (typeof fldInWoods === "function" && fldInWoods(wx, wz)) key = "woods";
      else if (_ttNearRoad(wx, wz)) key = "road";
      else {
        var t01 = flat ? 0 : (hs[z * N + x] - hMin) / range;
        if (t01 > FLDTT.RIDGE_T) key = "ridge";
        else if (t01 > FLDTT.HILL_T) key = "hills";
        else if (_ttVal(wx * 0.004 + 50.5, wz * 0.004 - 20.1) > 0.55) key = "field";
        else key = "clear";
      }
      cells[z * N + x] = KI[key];
    }
  }
  return cells;
}

/* ---- the bake: clear base + one soft-masked composite pass per present key ---- */
function fldTtBake(sig) {
  var tiles = fldTtPrepareTiles(); if (!tiles) return null;
  var N = FLDTT.GRID, B = FLDTT.BAKE;
  var cells = fldTtClassify();
  var counts = {}; for (var c = 0; c < cells.length; c++) { var kk = FLDTT.KEYS[cells[c]]; counts[kk] = (counts[kk] || 0) + 1; }
  var canvas = document.createElement("canvas"); canvas.width = canvas.height = B;
  var ctx = canvas.getContext("2d"); if (!ctx) return null;
  function patternFill(target, key) {
    var g2 = target.getContext("2d"), pat = g2.createPattern(tiles[key], "repeat");
    if (!pat) return;
    var sc = FLDTT.TILE_PX / FLDTT.TILE;
    g2.save(); g2.scale(sc, sc); g2.fillStyle = pat; g2.fillRect(0, 0, B / sc, B / sc); g2.restore();
  }
  patternFill(canvas, "clear");                              // base everywhere
  var used = ["clear"];
  for (var k = 0; k < FLDTT.KEYS.length; k++) {
    var key = FLDTT.KEYS[k];
    if (key === "clear" || !counts[key]) continue;
    var mask = document.createElement("canvas"); mask.width = mask.height = N;
    var mg = mask.getContext("2d"), mid = mg.createImageData(N, N), md = mid.data;
    for (var ci = 0; ci < cells.length; ci++) {
      if (cells[ci] !== k) continue;
      var o = ci * 4; md[o] = md[o + 1] = md[o + 2] = 255; md[o + 3] = 255;
    }
    mg.putImageData(mid, 0, 0);
    var tmp = document.createElement("canvas"); tmp.width = tmp.height = B;
    patternFill(tmp, key);
    var tg = tmp.getContext("2d");
    tg.globalCompositeOperation = "destination-in";
    tg.imageSmoothingEnabled = true;
    tg.drawImage(mask, 0, 0, B, B);                          // soft edges from the upscale
    ctx.drawImage(tmp, 0, 0);
    used.push(key);
  }
  FLDTT_S.bake = { canvas: canvas, keys: used, cells: counts, grid: N, sig: sig };
  return canvas;
}

/* ---- attach: bake (or reuse) the texture and set it as the ground material map ---- */
function fldTtAttach() {
  var T = window.THREE;
  if (!T || typeof __FIELD === "undefined" || !__FIELD || !__FIELD.ground || !__FIELD.ground.material) return;
  if (!fldTtEligible()) return;
  var sig = fldTtSig();
  if (!FLDTT_S.tex || FLDTT_S.sig !== sig) {
    var canvas = fldTtBake(sig); if (!canvas) return;        // tiles unready/tainted => fail-closed
    if (FLDTT_S.tex && FLDTT_S.tex.dispose) { try { FLDTT_S.tex.dispose(); } catch (e) {} }
    var tex = new T.CanvasTexture(canvas); tex.needsUpdate = true;  // canvas fully drawn BEFORE upload
    tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = true;
    FLDTT_S.tex = tex; FLDTT_S.sig = sig;
  }
  var mat = __FIELD.ground.material;
  if (mat.map !== FLDTT_S.tex) { mat.map = FLDTT_S.tex; mat.needsUpdate = true; }
}

/* the build-time hook: attach now if the albedos are cached, else finish async once
   they arrive (re-validated against the live launch/gate/signature at that point) */
function fldTtApply() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.ground) return;
  if (!fldTtEligible()) return;
  if (FLDTT_S.loadState === "ready") { fldTtAttach(); return; }
  fldTtEnsureImages(function () {
    try {
      if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.launched || !__FIELD.ground) return;
      fldTtAttach();
    } catch (e) { _ttErr(e); }
  });
}

/* ---- teardown: drop the battle-scoped texture/bake (tiles + images stay cached) ---- */
function fldTtDispose() {
  if (FLDTT_S.tex && FLDTT_S.tex.dispose) { try { FLDTT_S.tex.dispose(); } catch (e) {} }
  FLDTT_S.tex = null; FLDTT_S.sig = null; FLDTT_S.bake = null;
}

function _ttErr(e) {
  FLDTT_S.errN++;
  if (!FLDTT_S._warned && typeof console !== "undefined" && console.warn) {
    FLDTT_S._warned = true; console.warn("T32 terrain-texturing:", (e && e.message) || e);
  }
}

/* ===========================================================================
   WIRE-IN — wrap fld3dBuildTerrain (attach after every fresh ground build) and
   fldExit (dispose) by ASSIGNMENT, outermost, carrying every prior wrapper marker
   forward so the chain stays introspectable. Each hook try/catches into errN.
   =========================================================================== */
(function () {
  function _carryTt(dst, src) { for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { try { dst[k] = src[k]; } catch (e) {} } } }
  if (typeof fld3dBuildTerrain === "function" && !fld3dBuildTerrain._tt) {
    var _ot = fld3dBuildTerrain;
    fld3dBuildTerrain = function () { var r = _ot.apply(this, arguments); try { fldTtApply(); } catch (e) { _ttErr(e); } return r; };
    _carryTt(fld3dBuildTerrain, _ot); fld3dBuildTerrain._tt = true;
  }
  if (typeof fldExit === "function" && !fldExit._tt) {
    var _oe = fldExit;
    fldExit = function () { try { fldTtDispose(); } catch (e) { _ttErr(e); } return _oe.apply(this, arguments); };
    _carryTt(fldExit, _oe); fldExit._tt = true;
  }
})();
