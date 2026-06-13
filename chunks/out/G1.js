/* ==== §17 — TERRAIN & LIGHT (CHUNK-G1) ==== */
// Override-by-append: this draw() supersedes the engine's. PALETTE is a NEW name (TCOL is never redeclared).
// Axonometric tilt is paint-only; pixelToColrow / colrowToPixel are UNTOUCHED.
// Seeded RNG only (mulberry / hashStr from engine). No Math.random anywhere.

/* ----------------------------------------------------------------
   PALETTE  —  3 skins × 13 terrain keys
   Skin 0: sunlit painterly (warm daylight, green-gold fields)
   Skin 1: miniatures (richer, more saturated)
   Skin 2: modern (cooler, desaturated)
   ---------------------------------------------------------------- */
const PALETTE = [
  { // skin 0 — sunlit painterly
    clear:  "#d9cf9e",
    field:  "#cfc17f",
    woods:  "#6e8f52",
    hills:  "#d2b97f",
    ridge:  "#c4a76a",
    town:   "#c8b488",
    road:   "#d4c08a",
    river:  "#5d93b8",
    ford:   "#7fb5c4",
    swamp:  "#8d9a6b",
    fort:   "#b09060",
    water:  "#4b7ea8",
    shoal:  "#7baec0",
  },
  { // skin 1 — miniatures
    clear:  "#cdb87f",
    field:  "#c2a85f",
    woods:  "#5f7a3e",
    hills:  "#bf9a55",
    ridge:  "#a07d3f",
    town:   "#9c8045",
    road:   "#d2b56a",
    river:  "#3f6f93",
    ford:   "#7f9aa0",
    swamp:  "#6f7a45",
    fort:   "#7a5f35",
    water:  "#2f5f83",
    shoal:  "#5f8aa0",
  },
  { // skin 2 — modern
    clear:  "#e3dcc6",
    field:  "#d8cfa8",
    woods:  "#86a06a",
    hills:  "#d4bd86",
    ridge:  "#c2a86a",
    town:   "#b9a988",
    road:   "#cfc4a0",
    river:  "#7fa8c4",
    ford:   "#a8c0c0",
    swamp:  "#94a070",
    fort:   "#a89060",
    water:  "#6f9fc4",
    shoal:  "#9fc0d0",
  }
];

/* ----------------------------------------------------------------
   FAMOUS_FEATURES
   Maps battle id → array of {tag, label} entries.
   tag: terrain type that acts as anchor; label: period-hand placename.
   Resolved at draw time by scanning M.map for hexes matching tag,
   picking plausible ones by position index (spread across map).
   ---------------------------------------------------------------- */
const FAMOUS_FEATURES = {
  antietam: [
    { tag:"field", label:"The Cornfield",      posHint:"top" },
    { tag:"town",  label:"Dunker Church",       posHint:"center" },
    { tag:"ford",  label:"Burnside's Bridge",   posHint:"right" },
    { tag:"road",  label:"Sunken Road",         posHint:"center-low" },
  ],
  gettysburg: [
    { tag:"field", label:"Peach Orchard",       posHint:"left" },
    { tag:"ridge", label:"Little Round Top",    posHint:"right" },
    { tag:"ridge", label:"Cemetery Ridge",      posHint:"center" },
    { tag:"woods", label:"Devil's Den",         posHint:"right-low" },
  ],
  shiloh: [
    { tag:"woods", label:"Hornet's Nest",       posHint:"center" },
    { tag:"river", label:"Pittsburg Landing",   posHint:"top" },
    { tag:"swamp", label:"Bloody Pond",         posHint:"right" },
  ],
  fredericksburg: [
    { tag:"ridge", label:"Marye's Heights",     posHint:"top" },
    { tag:"town",  label:"Stone Wall",          posHint:"top-left" },
    { tag:"river", label:"Rappahannock",        posHint:"bottom" },
  ],
  chickamauga: [
    { tag:"woods", label:"Brotherton Field",    posHint:"center" },
    { tag:"road",  label:"LaFayette Road",      posHint:"left" },
    { tag:"ridge", label:"Snodgrass Hill",      posHint:"top-right" },
  ],
  bullrun1: [
    { tag:"ford",  label:"Sudley Ford",         posHint:"left" },
    { tag:"hills", label:"Henry Hill",          posHint:"center" },
    { tag:"river", label:"Bull Run",            posHint:"bottom" },
  ],
  bullrun2: [
    { tag:"ridge", label:"Stony Ridge",         posHint:"top" },
    { tag:"road",  label:"Warrenton Pike",      posHint:"center" },
    { tag:"woods", label:"Groveton Woods",      posHint:"left" },
  ],
  franklin: [
    { tag:"town",  label:"Carter House",        posHint:"center" },
    { tag:"fort",  label:"Columbia Pike Line",  posHint:"top" },
    { tag:"river", label:"Harpeth River",       posHint:"bottom" },
  ],
  vicksburg: [
    { tag:"fort",  label:"Fort Hill",           posHint:"top-left" },
    { tag:"ridge", label:"Champion Hill",       posHint:"center" },
    { tag:"town",  label:"Vicksburg",           posHint:"top-right" },
    { tag:"river", label:"Mississippi",         posHint:"left" },
  ],
  chancellorsville: [
    { tag:"woods", label:"Wilderness Church",   posHint:"center" },
    { tag:"road",  label:"Plank Road",          posHint:"bottom" },
    { tag:"field", label:"Chancellor House",    posHint:"top" },
  ],
};

/* ----------------------------------------------------------------
   OFFSCREEN TERRAIN CACHE  — WORLD-SPACE
   The offscreen canvas is rendered in WORLD coordinates at bucketScale
   (no camera baked in). Pan reuses the canvas; only a zoom-bucket
   change, fog change, or ownership change triggers a re-render.

   Key: battleId | skin | zoomBucket | fogSig | objOwnerSig
   (screen size is intentionally excluded — camera-independent)

   zoomBucket: Math.floor(zoom * 4)
   fogSig: count of visible hexes (changes when visibility changes)
   objOwnerSig: join of obj owners (changes when objectives are captured)

   bucketScale: representative zoom for the bucket, clamped [0.5, 1.6]
   and further capped so the offscreen never exceeds ~3000 px on a side.
   ---------------------------------------------------------------- */
const _terrainCache = new Map(); // key → canvas (world-space)
const _CACHE_MAX = 12; // evict oldest when over limit

function _makeCacheKey(B, skin) {
  const zb = Math.floor(G.cam.z * 4);
  // fog signature: count of visible hexes (fast, good enough)
  const fogSig = B.vis ? B.vis.size : 0;
  // obj owner signature
  const objSig = B.M.objs.map(o => o.owner || "0").join("");
  // NOTE: NO screen-size dependency — camera-position-independent key
  return B.bd.id + "|" + skin + "|" + zb + "|" + fogSig + "|" + objSig;
}

/* Compute world extents of the map (unscaled, world coords).
   Returns { worldW, worldH, marginW, marginH } where:
   - marginW / marginH = one hex radius of padding on each side
   - worldW / worldH = total offscreen canvas size in WORLD units
     (i.e. the full tiled extent including the margin on both sides) */
function _worldExtents(M) {
  const marginW = HEX;          // one radius padding left and right
  const marginH = HEX;          // one radius padding top and bottom
  const corner  = colrowToPixel(M.GW - 1, M.GH - 1);
  // rightmost hex center.x  + half-hex-width  + margin right
  // (hexW()/2 accounts for the hex body beyond the center on the right)
  const worldW = corner.x + hexW() / 2 + marginW + marginW;
  // bottommost hex center.y + one hex-height below  + margin top (already 0)
  const worldH = corner.y + HEX + marginH + marginH;
  return { worldW, worldH, marginW, marginH };
}

/* Derive bucketScale from the zoom bucket (same bucket that keys the cache),
   clamped to [0.5, 1.6] then hard-capped so no side exceeds 3000 px. */
function _bucketScale(zb, M) {
  const { worldW, worldH } = _worldExtents(M);
  let bs = Math.max(0.5, Math.min(1.6, zb / 4));
  const CAP = 3000;
  if (worldW * bs > CAP) bs = CAP / worldW;
  if (worldH * bs > CAP) bs = CAP / worldH;
  // Always at least 0.25 so tiny maps still render
  return Math.max(0.25, bs);
}

function _evictCache() {
  if (_terrainCache.size > _CACHE_MAX) {
    // evict oldest (first inserted)
    const first = _terrainCache.keys().next().value;
    _terrainCache.delete(first);
  }
}

/* ----------------------------------------------------------------
   PRE-RENDERED GRAIN PATTERN TILE
   Built once per skin change; seeded via hashStr.
   Used as a repeating pattern over hex fills.
   ---------------------------------------------------------------- */
const _grainPatterns = {}; // skin → CanvasPattern

function _buildGrainPattern(skin, mainCtx) {
  const sz = 64;
  const off = document.createElement("canvas");
  off.width = sz; off.height = sz;
  const octx = off.getContext("2d");
  // clear
  octx.clearRect(0, 0, sz, sz);
  // seed based on skin
  const rng = mulberry(hashStr("grain_" + skin));
  const imageData = octx.createImageData(sz, sz);
  const d = imageData.data;
  for (let i = 0; i < sz * sz; i++) {
    const val = rng() < 0.18 ? (rng() * 28) | 0 : 0;
    const alpha = rng() < 0.15 ? (val * 1.4) | 0 : 0;
    d[i * 4]     = skin === 0 ? 60 : skin === 1 ? 40 : 80;
    d[i * 4 + 1] = skin === 0 ? 50 : skin === 1 ? 35 : 70;
    d[i * 4 + 2] = skin === 0 ? 30 : skin === 1 ? 20 : 60;
    d[i * 4 + 3] = alpha;
  }
  octx.putImageData(imageData, 0, 0);
  const pat = mainCtx.createPattern(off, "repeat");
  _grainPatterns[skin] = pat;
  return pat;
}

function _getGrainPattern(skin) {
  if (_grainPatterns[skin]) return _grainPatterns[skin];
  return _buildGrainPattern(skin, ctx);
}

/* ----------------------------------------------------------------
   HEX CLIP PATH helper (for clipping decorations inside a hex)
   ---------------------------------------------------------------- */
function _hexClipPath(offCtx, px, py, rad) {
  offCtx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 90);
    const x = px + rad * Math.cos(a);
    const y = py + rad * Math.sin(a);
    i ? offCtx.lineTo(x, y) : offCtx.moveTo(x, y);
  }
  offCtx.closePath();
}

/* ----------------------------------------------------------------
   TILT CONSTANTS
   Paint-only vertical squash and elevation y-offset.
   DO NOT touch pixelToColrow or colrowToPixel.
   ---------------------------------------------------------------- */
const TILT_SQUASH = 0.86;          // vertical squash factor
const TILT_ELEV_PX = 7;            // y-offset per elevation unit (at zoom 1)

function _tiledY(screenY, elev, zoom) {
  // elev: -1 (ford/river), 0 (flat), 1 (hills/ridge)
  return screenY + elev * (-TILT_ELEV_PX) * zoom;
}

/* ----------------------------------------------------------------
   DRAW HELPERS — terrain features
   All accept (octx, sx, sy, rad, rng, skin) or subset.
   ---------------------------------------------------------------- */

function _drawWoodsCanopy(octx, sx, sy, rad, rng, skin) {
  const count = 3 + ((rng() * 4) | 0); // 3-6 blobs
  const col0 = skin === 0 ? "#5a7f42" : skin === 1 ? "#4a6830" : "#76906c";
  const col1 = skin === 0 ? "#4a6b35" : skin === 1 ? "#3c5426" : "#667c5c";
  const rimCol = skin === 0 ? "#2e4a20" : "#233818";
  for (let k = 0; k < count; k++) {
    const bx = sx + (rng() - 0.5) * rad * 1.1;
    const by = sy + (rng() - 0.5) * rad * 0.7;
    const br = rad * (0.22 + rng() * 0.18);
    // dark rim first
    octx.beginPath();
    octx.arc(bx, by, br + 1.5, 0, 6.283);
    octx.fillStyle = rimCol;
    octx.fill();
    // canopy body
    const g = octx.createRadialGradient(bx - br * 0.2, by - br * 0.3, 0, bx, by, br);
    g.addColorStop(0, col0);
    g.addColorStop(1, col1);
    octx.beginPath();
    octx.arc(bx, by, br, 0, 6.283);
    octx.fillStyle = g;
    octx.fill();
  }
}

function _drawRiver(octx, sx, sy, rad, rng, skin) {
  // banded water
  const w1 = skin === 0 ? "#5d93b8" : skin === 1 ? "#3f6f93" : "#7fa8c4";
  const w2 = skin === 0 ? "#7ab0cc" : skin === 1 ? "#5a8aac" : "#9fc0d4";
  const bank = skin === 0 ? "#c4a05a" : skin === 1 ? "#a07a3a" : "#c8b888";
  // bank lip (sandy strip around hex edge)
  _hexClipPath(octx, sx, sy, rad);
  octx.fillStyle = bank;
  octx.fill();
  // inner water with bands
  _hexClipPath(octx, sx, sy, rad * 0.85);
  const gw = octx.createLinearGradient(sx - rad, sy, sx + rad, sy);
  gw.addColorStop(0, w2);
  gw.addColorStop(0.35, w1);
  gw.addColorStop(0.65, w1);
  gw.addColorStop(1, w2);
  octx.fillStyle = gw;
  octx.fill();
  // ripple lines
  octx.strokeStyle = "rgba(200,230,255,0.22)";
  octx.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    const ry = sy + (k - 1) * rad * 0.22;
    octx.beginPath();
    octx.moveTo(sx - rad * 0.6, ry);
    octx.quadraticCurveTo(sx, ry + 3, sx + rad * 0.6, ry);
    octx.stroke();
  }
}

function _drawFord(octx, sx, sy, rad, rng, skin) {
  // lighter ford with visible stones
  const w = skin === 0 ? "#90cad6" : skin === 1 ? "#6fa0b8" : "#aacfdc";
  const stone = skin === 0 ? "#a89878" : "#8a7860";
  _hexClipPath(octx, sx, sy, rad * 0.9);
  octx.fillStyle = w;
  octx.fill();
  // 4-6 stones
  const sc = 3 + ((rng() * 4) | 0);
  octx.fillStyle = stone;
  for (let k = 0; k < sc; k++) {
    const stx = sx + (rng() - 0.5) * rad * 1.0;
    const sty = sy + (rng() - 0.5) * rad * 0.5;
    const sr = rad * (0.06 + rng() * 0.06);
    octx.beginPath();
    octx.ellipse(stx, sty, sr * 1.4, sr, rng() * 1.5, 0, 6.283);
    octx.fill();
  }
}

function _drawTown(octx, sx, sy, rad, rng, skin) {
  // 2-4 gabled buildings — roof face visible per tilt
  const count = 2 + ((rng() * 3) | 0);
  const wallCol = skin === 0 ? "#c4a870" : skin === 1 ? "#a08050" : "#c8b888";
  const roofCol = skin === 0 ? "#7a4030" : skin === 1 ? "#5e2e1e" : "#8a5040";
  const roofFace = skin === 0 ? "#603020" : skin === 1 ? "#4a201a" : "#6a3a2a";
  for (let k = 0; k < count; k++) {
    const bx = sx + (rng() - 0.5) * rad * 0.8;
    const by = sy + (rng() - 0.5) * rad * 0.4;
    const bw = rad * (0.18 + rng() * 0.14);
    const bh = rad * (0.22 + rng() * 0.12);
    // wall
    octx.fillStyle = wallCol;
    octx.fillRect(bx - bw, by, bw * 2, bh * 0.8);
    // tilt: show gable face on south side (per axonometric view)
    octx.fillStyle = roofFace;
    octx.beginPath();
    octx.moveTo(bx - bw, by + bh * 0.8);
    octx.lineTo(bx + bw, by + bh * 0.8);
    octx.lineTo(bx + bw, by + bh * 1.0);
    octx.lineTo(bx - bw, by + bh * 1.0);
    octx.closePath();
    octx.fill();
    // roof triangle (gabled)
    octx.fillStyle = roofCol;
    octx.beginPath();
    octx.moveTo(bx - bw, by);
    octx.lineTo(bx + bw, by);
    octx.lineTo(bx, by - bh * 0.5);
    octx.closePath();
    octx.fill();
  }
}

function _drawFort(octx, sx, sy, rad, rng, skin) {
  const earth = skin === 0 ? "#96743a" : skin === 1 ? "#7a5828" : "#a08448";
  const dark  = skin === 0 ? "#6a4e24" : "#503c18";
  // earthwork ridge shapes
  const pts = 4 + ((rng() * 2) | 0);
  octx.fillStyle = earth;
  octx.beginPath();
  for (let k = 0; k < pts; k++) {
    const a = (k / pts) * 6.283;
    const r2 = rad * (0.4 + rng() * 0.25);
    const px = sx + Math.cos(a) * r2;
    const py = sy + Math.sin(a) * r2;
    k ? octx.lineTo(px, py) : octx.moveTo(px, py);
  }
  octx.closePath();
  octx.fill();
  // hatch lines
  octx.save();
  octx.clip();
  octx.strokeStyle = "rgba(40,28,16,0.45)";
  octx.lineWidth = 1;
  for (let i = -rad; i < rad; i += 4) {
    octx.beginPath();
    octx.moveTo(sx + i, sy - rad);
    octx.lineTo(sx + i + rad, sy + rad);
    octx.stroke();
  }
  octx.restore();
  // parapet ridge highlight (SE light)
  octx.strokeStyle = "rgba(200,170,100,0.35)";
  octx.lineWidth = 2;
  octx.beginPath();
  octx.arc(sx - rad * 0.15, sy - rad * 0.2, rad * 0.38, 3.8, 5.8);
  octx.stroke();
}

function _drawRoad(octx, sx, sy, rad, rng, skin) {
  // double wheel-ruts
  const dustCol = skin === 0 ? "#c8a860" : skin === 1 ? "#aa8840" : "#cec4a0";
  const rutCol  = "rgba(40,28,16,0.28)";
  const ew = rad * 0.12;
  // determine road orientation (use map tile neighbors via the same hex center)
  // paint horizontal band of dust
  octx.fillStyle = dustCol;
  octx.fillRect(sx - rad, sy - ew * 1.5, rad * 2, ew * 3);
  // two ruts
  octx.strokeStyle = rutCol;
  octx.lineWidth = ew * 0.6;
  octx.beginPath();
  octx.moveTo(sx - rad, sy - ew * 0.5);
  octx.lineTo(sx + rad, sy - ew * 0.5);
  octx.moveTo(sx - rad, sy + ew * 0.5);
  octx.lineTo(sx + rad, sy + ew * 0.5);
  octx.stroke();
}

function _drawSwamp(octx, sx, sy, rad, rng, skin) {
  // reed ticks
  const base  = skin === 0 ? "#8d9a6b" : skin === 1 ? "#6f7a45" : "#94a070";
  const water = skin === 0 ? "#6a8878" : skin === 1 ? "#507060" : "#7a9888";
  // base color already set; add dark puddles
  const pCount = 3 + ((rng() * 3) | 0);
  octx.fillStyle = water;
  for (let k = 0; k < pCount; k++) {
    const px = sx + (rng() - 0.5) * rad * 0.9;
    const py = sy + (rng() - 0.5) * rad * 0.5;
    const pr = rad * (0.08 + rng() * 0.08);
    octx.beginPath();
    octx.ellipse(px, py, pr * 1.6, pr, rng() * 1.2, 0, 6.283);
    octx.fill();
  }
  // reed strokes
  octx.strokeStyle = "rgba(40,55,20,0.55)";
  octx.lineWidth = 1;
  const rCount = 6 + ((rng() * 6) | 0);
  for (let k = 0; k < rCount; k++) {
    const rx = sx + (rng() - 0.5) * rad * 0.8;
    const ry = sy + (rng() - 0.5) * rad * 0.5;
    const rh = rad * (0.12 + rng() * 0.10);
    octx.beginPath();
    octx.moveTo(rx, ry + rh);
    octx.quadraticCurveTo(rx + (rng() - 0.5) * 4, ry, rx + (rng() - 0.5) * 3, ry - rh);
    octx.stroke();
    // reed head
    octx.beginPath();
    octx.ellipse(rx + (rng() - 0.5) * 3, ry - rh, 1.5, 3, 0.3, 0, 6.283);
    octx.fill();
  }
}

/* ----------------------------------------------------------------
   MICRO-DRESSING — seeded per battle
   Draws snake-rail fences, stone walls, orchards, farmstead,
   church+steeple, small graveyard onto the offscreen canvas.
   Each feature is placed once at a fixed seeded position.
   ---------------------------------------------------------------- */
function _drawMicroDressing(octx, M, battleSeed, bs, marginW, marginH, skin) {
  // bs       = bucketScale (world → offscreen pixels)
  // marginW/H = world-unit padding so hex(0,0) center is at (marginW*bs, marginH*bs)
  const rng = mulberry(battleSeed ^ 0xDECAF);
  const cw = hexW() * bs;   // cell width in offscreen pixels
  const ch = HEX * 1.5 * bs;
  const { GW, GH } = M;

  // Map world hex center → offscreen canvas coords (world-space, no camera)
  function hexCenter(c, r) {
    const p = colrowToPixel(c, r);
    // Offset by margin so the map's top-left padding starts at (0,0)
    return { x: (p.x + marginW) * bs, y: (p.y + marginH) * bs };
  }

  function fieldEdgeFences(type) {
    // snake-rail fences along field/clear boundaries — pick ~4 hexes
    const count = 3 + ((rng() * 3) | 0);
    for (let i = 0; i < count; i++) {
      const c = 1 + ((rng() * (GW - 2)) | 0);
      const r = 1 + ((rng() * (GH - 2)) | 0);
      const tile = M.map[M.key(c, r)];
      if (!tile || (tile.t !== "field" && tile.t !== "clear")) continue;
      const { x, y } = hexCenter(c, r);
      octx.save();
      octx.strokeStyle = skin === 0 ? "rgba(100,70,40,0.65)" : "rgba(80,55,30,0.55)";
      octx.lineWidth = 1.2;
      const hw = cw * 0.38;
      // zig-zag rail pattern
      octx.beginPath();
      for (let seg = 0; seg < 5; seg++) {
        const zx = x - hw + seg * (hw * 0.5);
        const zy = y + (seg % 2 === 0 ? -4 : 4);
        seg === 0 ? octx.moveTo(zx, zy) : octx.lineTo(zx, zy);
      }
      octx.stroke();
      octx.restore();
    }
  }

  function ridgeStoneWalls() {
    const count = 2 + ((rng() * 3) | 0);
    for (let i = 0; i < count; i++) {
      const c = 1 + ((rng() * (GW - 2)) | 0);
      const r = 1 + ((rng() * (GH - 2)) | 0);
      const tile = M.map[M.key(c, r)];
      if (!tile || tile.t !== "ridge") continue;
      const { x, y } = hexCenter(c, r);
      octx.save();
      octx.strokeStyle = "rgba(120,100,80,0.7)";
      octx.lineWidth = 2.5;
      octx.lineCap = "round";
      octx.beginPath();
      octx.moveTo(x - cw * 0.3, y + 2);
      octx.lineTo(x + cw * 0.3, y + 2);
      octx.stroke();
      // stone dots
      octx.fillStyle = "rgba(140,120,90,0.55)";
      for (let k = 0; k < 5; k++) {
        octx.beginPath();
        octx.arc(x - cw * 0.28 + k * cw * 0.14, y + 2, 1.5, 0, 6.283);
        octx.fill();
      }
      octx.restore();
    }
  }

  function orchardRows() {
    const c = 2 + ((rng() * (GW - 4)) | 0);
    const r = 2 + ((rng() * (GH - 4)) | 0);
    const tile = M.map[M.key(c, r)];
    if (!tile || (tile.t !== "field" && tile.t !== "clear")) return;
    const { x, y } = hexCenter(c, r);
    const treeCol = skin === 0 ? "rgba(80,110,50,0.8)" : "rgba(65,88,38,0.75)";
    octx.fillStyle = treeCol;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const tx = x - cw * 0.28 + col * cw * 0.28;
        const ty = y - ch * 0.15 + row * ch * 0.2;
        octx.beginPath();
        octx.arc(tx, ty, 4, 0, 6.283);
        octx.fill();
      }
    }
  }

  function farmstead() {
    const c = 2 + ((rng() * (GW - 4)) | 0);
    const r = 2 + ((rng() * (GH - 4)) | 0);
    const tile = M.map[M.key(c, r)];
    if (!tile || tile.t !== "clear") return;
    const { x, y } = hexCenter(c, r);
    // small barn
    const barnW = cw * 0.16, barnH = ch * 0.14;
    octx.fillStyle = skin === 0 ? "#8a4a30" : "#6a3020";
    octx.fillRect(x - barnW, y - barnH, barnW * 2, barnH * 1.2);
    // barn roof
    octx.fillStyle = skin === 0 ? "#4a2818" : "#3a1e10";
    octx.beginPath();
    octx.moveTo(x - barnW, y - barnH);
    octx.lineTo(x + barnW, y - barnH);
    octx.lineTo(x, y - barnH * 2);
    octx.closePath();
    octx.fill();
    // fence posts
    octx.strokeStyle = "rgba(100,70,40,0.5)";
    octx.lineWidth = 1;
    for (let f = 0; f < 4; f++) {
      octx.beginPath();
      octx.moveTo(x + barnW + f * 5, y - 3);
      octx.lineTo(x + barnW + f * 5, y + 5);
      octx.stroke();
    }
  }

  function church() {
    const c = ((GW / 2) | 0) + (((rng() - 0.5) * 4) | 0);
    const r = ((GH / 2) | 0) + (((rng() - 0.5) * 3) | 0);
    const tile = M.map[M.key(c, r)];
    if (!tile || (tile.t !== "town" && tile.t !== "clear")) return;
    const { x, y } = hexCenter(c, r);
    const bw = cw * 0.11, bh = ch * 0.18;
    // nave
    octx.fillStyle = skin === 0 ? "#c4b490" : "#a89870";
    octx.fillRect(x - bw, y - bh * 0.6, bw * 2, bh);
    // gable
    octx.fillStyle = skin === 0 ? "#7a4030" : "#5e2e20";
    octx.beginPath();
    octx.moveTo(x - bw, y - bh * 0.6);
    octx.lineTo(x + bw, y - bh * 0.6);
    octx.lineTo(x, y - bh);
    octx.closePath();
    octx.fill();
    // steeple
    const stx = x, sty = y - bh;
    const sh = bh * 0.9;
    octx.fillStyle = skin === 0 ? "#9a8060" : "#7a6040";
    octx.fillRect(stx - bw * 0.3, sty - sh * 0.5, bw * 0.6, sh * 0.5);
    octx.beginPath();
    octx.moveTo(stx - bw * 0.3, sty - sh * 0.5);
    octx.lineTo(stx + bw * 0.3, sty - sh * 0.5);
    octx.lineTo(stx, sty - sh);
    octx.closePath();
    octx.fillStyle = skin === 0 ? "#605040" : "#403020";
    octx.fill();
    // cross
    octx.strokeStyle = "rgba(50,35,20,0.8)";
    octx.lineWidth = 1;
    octx.beginPath();
    octx.moveTo(stx, sty - sh * 0.85);
    octx.lineTo(stx, sty - sh * 1.08);
    octx.moveTo(stx - bw * 0.2, sty - sh * 0.98);
    octx.lineTo(stx + bw * 0.2, sty - sh * 0.98);
    octx.stroke();
  }

  function graveyard() {
    const c = 1 + ((rng() * (GW - 2)) | 0);
    const r = 1 + ((rng() * (GH - 2)) | 0);
    const tile = M.map[M.key(c, r)];
    if (!tile || tile.t === "river" || tile.t === "water") return;
    const { x, y } = hexCenter(c, r);
    // small markers
    octx.fillStyle = "rgba(180,170,155,0.65)";
    for (let k = 0; k < 5; k++) {
      const mx = x + (k - 2) * 5;
      const my = y + (k % 2 === 0 ? 0 : -3);
      // headstone shape
      octx.fillRect(mx - 1.5, my - 5, 3, 5);
      octx.beginPath();
      octx.arc(mx, my - 5, 1.5, Math.PI, 0);
      octx.fill();
    }
    // low fence
    octx.strokeStyle = "rgba(120,110,90,0.5)";
    octx.lineWidth = 0.8;
    octx.strokeRect(x - 14, y - 8, 28, 14);
  }

  // Draw all micro features
  fieldEdgeFences();
  ridgeStoneWalls();
  orchardRows();
  farmstead();
  church();
  graveyard();
}

/* ----------------------------------------------------------------
   ELEVATION SHADOW — soft SE drop shadow under hills/ridge
   Painted as a semi-transparent gradient arc on the SE side.
   ---------------------------------------------------------------- */
function _drawElevShadow(octx, sx, sy, rad) {
  const grd = octx.createRadialGradient(
    sx + rad * 0.28, sy + rad * 0.3, rad * 0.2,
    sx + rad * 0.28, sy + rad * 0.3, rad * 0.9
  );
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(1, "rgba(0,0,0,0.18)");
  octx.fillStyle = grd;
  octx.fill(); // applied on existing path
}

/* ----------------------------------------------------------------
   COMPASS ROSE  (drawn directly on main ctx)
   ---------------------------------------------------------------- */
function _drawCompassRose(mainCtx, x, y, size) {
  const c = mainCtx;
  c.save();
  c.translate(x, y);
  // cardinal arms
  const arms = [
    [0, -1, "N"], [1, 0, "E"], [0, 1, "S"], [-1, 0, "W"]
  ];
  for (const [dx, dy, lbl] of arms) {
    const isN = lbl === "N";
    c.fillStyle = isN ? "#c9a85f" : "#e8dcc0";
    c.strokeStyle = "rgba(20,14,8,0.7)";
    c.lineWidth = 0.8;
    // arrow
    c.beginPath();
    c.moveTo(dx * size * 0.06, dy * size * 0.06);
    c.lineTo(dx * size + dy * size * 0.22, dy * size - dx * size * 0.22);
    c.lineTo(dx * size, dy * size);
    c.lineTo(dx * size - dy * size * 0.22, dy * size + dx * size * 0.22);
    c.closePath();
    c.fill();
    c.stroke();
    // label
    c.fillStyle = "#e8dcc0";
    c.font = `bold ${Math.round(size * 0.45)}px "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(lbl, dx * size * 1.55, dy * size * 1.55);
  }
  // center circle
  c.beginPath();
  c.arc(0, 0, size * 0.18, 0, 6.283);
  c.fillStyle = "#c9a85f";
  c.fill();
  c.strokeStyle = "#2b2118";
  c.lineWidth = 1;
  c.stroke();
  c.restore();
}

/* ----------------------------------------------------------------
   SCALE BAR  (drawn on main ctx)
   ---------------------------------------------------------------- */
function _drawScaleBar(mainCtx, x, y, zoom) {
  const c = mainCtx;
  // one hex = "1 mile" for display
  const hexPx = hexW() * zoom;
  const barLen = hexPx * 2; // 2 hexes = "2 mi"
  const h = 5;
  c.save();
  c.fillStyle = "#2b2118";
  c.strokeStyle = "#c9a85f";
  c.lineWidth = 1;
  // outer rect
  c.strokeRect(x, y, barLen, h);
  // left half — dark
  c.fillStyle = "#4a3c2c";
  c.fillRect(x, y, barLen / 2, h);
  // right half — light
  c.fillStyle = "#c9a85f";
  c.fillRect(x + barLen / 2, y, barLen / 2, h);
  // text
  c.fillStyle = "#e8dcc0";
  c.font = `${Math.round(Math.max(8, 9))}px "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`;
  c.textAlign = "left";
  c.textBaseline = "bottom";
  c.fillText("0", x, y);
  c.textAlign = "center";
  c.fillText("1 mi", x + barLen / 2, y);
  c.textAlign = "right";
  c.fillText("2 mi", x + barLen, y);
  c.restore();
}

/* ----------------------------------------------------------------
   _rrectPath helper — roundRect with safe fallback
   ---------------------------------------------------------------- */
function _rrectPath(c, x, y, w, h, r) {
  if (typeof c.roundRect === "function") {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  } else {
    // fallback: simple rect
    c.beginPath();
    c.rect(x, y, w, h);
  }
}

/* ----------------------------------------------------------------
   BATTLE-NAME CARTOUCHE  (drawn on main ctx)
   ---------------------------------------------------------------- */
function _drawCartouche(mainCtx, x, y, w, bd) {
  const c = mainCtx;
  const text = bd.name + ", " + bd.year;
  c.save();
  // parchment bg
  const pad = 8;
  c.font = `bold 14px "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`;
  const tw = c.measureText(text).width;
  const bw = Math.max(w, tw + pad * 2);
  const bh = 28;
  const bx = x - bw / 2;
  const by = y - bh / 2;
  // shadow
  c.fillStyle = "rgba(0,0,0,0.4)";
  _rrectPath(c, bx + 2, by + 2, bw, bh, 3);
  c.fill();
  // parchment
  const grd = c.createLinearGradient(bx, by, bx, by + bh);
  grd.addColorStop(0, "#e8dcc0");
  grd.addColorStop(1, "#d4c08a");
  c.fillStyle = grd;
  _rrectPath(c, bx, by, bw, bh, 3);
  c.fill();
  // border
  c.strokeStyle = "#9c7a3c";
  c.lineWidth = 1.5;
  c.stroke();
  // inner rule
  c.strokeStyle = "rgba(156,122,60,0.4)";
  c.lineWidth = 0.5;
  _rrectPath(c, bx + 3, by + 3, bw - 6, bh - 6, 2);
  c.stroke();
  // text
  c.fillStyle = "#2b2118";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, x, y + 1);
  c.restore();
}

/* ----------------------------------------------------------------
   FAMOUS FEATURES — resolve labels to hex positions and draw them
   ---------------------------------------------------------------- */
function _drawFamousFeatures(mainCtx, M, bd, zoom) {
  const features = FAMOUS_FEATURES[bd.id];
  if (!features || !features.length) return;

  // Gather hex candidates by terrain tag
  const byTag = {};
  for (const k in M.map) {
    const tile = M.map[k];
    if (!byTag[tile.t]) byTag[tile.t] = [];
    byTag[tile.t].push(tile);
  }

  const c = mainCtx;
  c.save();
  c.font = `italic ${Math.max(8, Math.round(9 + zoom * 2))}px "Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`;
  c.textAlign = "left";
  c.textBaseline = "middle";

  // Track used tiles to avoid overlap
  const usedHexes = new Set();

  for (const feat of features) {
    const candidates = (byTag[feat.tag] || []).filter(t => !usedHexes.has(M.key(t.c, t.r)));
    if (!candidates.length) continue;

    // posHint-based selection: divide map into quadrants and pick nearest
    let best = candidates[0];
    const { GW, GH } = M;
    const hint = feat.posHint || "center";
    let targetC = GW / 2, targetR = GH / 2;
    if (hint.includes("top"))    targetR = GH * 0.25;
    if (hint.includes("bottom")) targetR = GH * 0.75;
    if (hint.includes("left"))   targetC = GW * 0.25;
    if (hint.includes("right"))  targetC = GW * 0.75;
    if (hint === "center-low")   { targetC = GW * 0.5; targetR = GH * 0.55; }
    if (hint === "top-left")     { targetC = GW * 0.25; targetR = GH * 0.2; }
    if (hint === "top-right")    { targetC = GW * 0.75; targetR = GH * 0.2; }
    if (hint === "right-low")    { targetC = GW * 0.75; targetR = GH * 0.65; }

    let bestDist = 1e9;
    for (const t of candidates) {
      const d = (t.c - targetC) ** 2 + (t.r - targetR) ** 2;
      if (d < bestDist) { bestDist = d; best = t; }
    }
    usedHexes.add(M.key(best.c, best.r));

    // Compute screen position (including tilt)
    const wp = colrowToPixel(best.c, best.r);
    const sp = worldToScreen(wp.x, wp.y);
    const elev = best.elev || 0;
    const sy = _tiledY(sp.y, elev, zoom);
    const sx = sp.x;
    const rad = HEX * zoom * 0.98;

    // Leader line from center to label offset
    const lx = sx + rad * 0.6;
    const ly = sy - rad * 0.8;

    c.strokeStyle = "rgba(60,40,20,0.7)";
    c.lineWidth = 0.8;
    c.setLineDash([2, 2]);
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(lx, ly);
    c.stroke();
    c.setLineDash([]);

    // Label box
    const tw = c.measureText(feat.label).width;
    const lpad = 3;
    c.fillStyle = "rgba(232,220,192,0.88)";
    _rrectPath(c, lx - lpad, ly - 7, tw + lpad * 2, 13, 2);
    c.fill();
    c.strokeStyle = "rgba(156,122,60,0.6)";
    c.lineWidth = 0.6;
    c.stroke();
    // Text
    c.fillStyle = "#2b2118";
    c.fillText(feat.label, lx, ly);
  }
  c.restore();
}

/* ----------------------------------------------------------------
   RENDER TERRAIN LAYER TO OFFSCREEN CANVAS  — WORLD-SPACE
   Renders the ENTIRE map once per cache key into a world-space canvas.
   NO worldToScreen calls here — coordinates are raw colrowToPixel × bs.

   The offscreen origin (0,0) corresponds to world point (-marginW, -marginH)
   so hex(0,0) center lands at (marginW*bs, marginH*bs) inside the canvas.

   Called only on a cache miss; blit in draw() applies the camera transform.
   ---------------------------------------------------------------- */
function _renderTerrainToOffscreen(B, skin, zb) {
  const M = B.M;
  const { worldW, worldH, marginW, marginH } = _worldExtents(M);
  const bs = _bucketScale(zb, M);
  // bs-scaled radius for hex drawing (world-space, no camera)
  const rad = HEX * bs * 0.98;

  // Offscreen canvas: world extents × bucketScale (no DPR — intermediate buffer)
  const off = document.createElement("canvas");
  off.width  = Math.ceil(worldW * bs);
  off.height = Math.ceil(worldH * bs);
  const octx = off.getContext("2d");
  // No DPR transform — this canvas is a world-space buffer, not a display surface

  const grain = _getGrainPattern(skin);

  for (let r = 0; r < M.GH; r++) {
    for (let c = 0; c < M.GW; c++) {
      const t = M.map[M.key(c, r)];
      if (!t) continue;
      const wp = colrowToPixel(c, r);
      // World-space position in offscreen canvas coords (no camera, no worldToScreen)
      // The margin shifts world origin so the top-left of the map has padding.
      const sx = (wp.x + marginW) * bs;
      const elev = t.elev || 0;
      // Tilt: vertical squash applied via transform; elevation y-offset in world units × bs
      const sy = (wp.y + marginH) * bs + elev * (-TILT_ELEV_PX) * bs;

      const squash = TILT_SQUASH;
      // Draw hex with vertical squash
      octx.save();
      octx.translate(sx, sy);
      octx.scale(1, squash);
      octx.translate(-sx, -sy);

      const col = (PALETTE[skin] && PALETTE[skin][t.t]) || "#bbb";

      // Fill base
      _hexClipPath(octx, sx, sy, rad);
      octx.fillStyle = col;
      octx.fill();

      // Apply grain texture
      if (grain) {
        _hexClipPath(octx, sx, sy, rad);
        octx.fillStyle = grain;
        octx.fill();
      }

      octx.restore();

      // Draw terrain-specific details (no squash — billboard art on top)
      octx.save();
      const tileRng = mulberry(hashStr(B.bd.id + c + "," + r));

      // Terrain-specific features
      if (t.t === "woods") {
        _hexClipPath(octx, sx, sy, rad);
        octx.fillStyle = col;
        octx.fill();
        _drawWoodsCanopy(octx, sx, sy, rad, tileRng, skin);
      } else if (t.t === "river") {
        _drawRiver(octx, sx, sy, rad, tileRng, skin);
      } else if (t.t === "ford") {
        _drawFord(octx, sx, sy, rad, tileRng, skin);
      } else if (t.t === "town") {
        _drawTown(octx, sx, sy, rad, tileRng, skin);
      } else if (t.t === "fort") {
        _hexClipPath(octx, sx, sy, rad);
        octx.fillStyle = col;
        octx.fill();
        _drawFort(octx, sx, sy, rad, tileRng, skin);
      } else if (t.t === "road") {
        _hexClipPath(octx, sx, sy, rad);
        octx.fillStyle = col;
        octx.fill();
        _drawRoad(octx, sx, sy, rad, tileRng, skin);
      } else if (t.t === "swamp") {
        _hexClipPath(octx, sx, sy, rad);
        octx.fillStyle = col;
        octx.fill();
        _drawSwamp(octx, sx, sy, rad, tileRng, skin);
      }

      // Elevation SE shadow (hills, ridge)
      if (t.t === "hills" || t.t === "ridge") {
        _hexClipPath(octx, sx, sy, rad);
        octx.fillStyle = (PALETTE[skin] && PALETTE[skin][t.t]) || col;
        octx.fill();
        // highlight top-left (light NW)
        octx.fillStyle = "rgba(255,245,200,0.12)";
        octx.fill();
        _drawElevShadow(octx, sx, sy, rad);
      }

      // Water shimmer
      if (t.t === "water") {
        _hexClipPath(octx, sx, sy, rad);
        octx.fillStyle = col;
        octx.fill();
        const wg = octx.createLinearGradient(sx - rad, sy - rad, sx + rad, sy + rad);
        wg.addColorStop(0, "rgba(255,255,255,0.08)");
        wg.addColorStop(0.5, "rgba(255,255,255,0)");
        wg.addColorStop(1, "rgba(0,0,0,0.10)");
        octx.fillStyle = wg;
        octx.fill();
      }

      octx.restore();

      // Hex outline
      _hexClipPath(octx, sx, sy, rad);
      octx.lineWidth = skin === 2 ? 0.8 : 1.1;
      octx.strokeStyle = skin === 0 ? "rgba(43,33,24,0.45)" :
                         skin === 1 ? "rgba(20,14,8,0.55)" :
                                      "rgba(80,70,50,0.28)";
      octx.stroke();

      // Objective flag marker (baked into terrain layer since owner is in cache key)
      if (t.obj) {
        const oc = t.owner === "US" ? "#3d6098" : t.owner === "CS" ? "#9a7d62" : "#5a4a32";
        octx.fillStyle = oc;
        octx.strokeStyle = "#1a130c";
        octx.lineWidth = 1.5;
        const fx = sx, fy = sy - rad * 0.15;
        octx.beginPath();
        octx.moveTo(fx, fy + rad * 0.5);
        octx.lineTo(fx, fy - rad * 0.5);
        octx.stroke();
        octx.beginPath();
        octx.moveTo(fx, fy - rad * 0.5);
        octx.lineTo(fx + rad * 0.45, fy - rad * 0.32);
        octx.lineTo(fx, fy - rad * 0.14);
        octx.closePath();
        octx.fill();
        octx.fillStyle = "rgba(232,220,192,0.85)";
        octx.font = `${Math.max(8, rad * 0.32)}px serif`;
        octx.textAlign = "center";
        octx.fillText("★".repeat(t.obj.val), sx, sy + rad * 0.62);
      }

      // Fog veil (cool blue-grey soft wash — NOT black).
      // fogSig is part of the cache key so this is valid for the life of the cache entry.
      const vis = isVisible(c, r);
      if (!vis) {
        _hexClipPath(octx, sx, sy, rad);
        // Layered cool blue-grey wash
        octx.fillStyle = "rgba(80,100,130,0.55)";
        octx.fill();
        octx.fillStyle = "rgba(40,60,90,0.28)";
        octx.fill();
        octx.strokeStyle = "rgba(60,80,110,0.35)";
        octx.lineWidth = 1;
        octx.stroke();
      }
    }
  }

  // Micro-dressing on top (battle-seeded, drawn in world-space offscreen coords)
  const battleSeed = hashStr(B.bd.id);
  _drawMicroDressing(octx, M, battleSeed, bs, marginW, marginH, skin);

  return off;
}

/* ----------------------------------------------------------------
   MAIN draw() OVERRIDE
   Per-frame: get/build offscreen cache, blit, then draw dynamic layers.
   ---------------------------------------------------------------- */
function draw() {
  if (G.mode !== "battle" || !G.battle) {
    ctx.clearRect(0, 0, Wc, Hc);
    return;
  }

  const B = G.battle;
  const M = B.M;
  const skin = G.settings.render;
  const z = G.cam.z;
  const rad = HEX * z * 0.98;

  ctx.clearRect(0, 0, Wc, Hc);

  // --- TERRAIN CACHE: get or build world-space offscreen canvas ---
  const cacheKey = _makeCacheKey(B, skin);
  // Zoom bucket needed both for key lookup and for rendering
  const zb = Math.floor(z * 4);
  let cached = _terrainCache.get(cacheKey);

  if (!cached) {
    cached = _renderTerrainToOffscreen(B, skin, zb);
    _terrainCache.set(cacheKey, cached);
    _evictCache();
  }

  // --- BLIT: camera transform maps world-space canvas → screen ---
  // The world-space canvas origin corresponds to world point (-marginW, -marginH).
  // Its screen position is worldToScreen(-marginW, -marginH).
  // The canvas covers (worldW × worldH) world units, scaled to (worldW*z × worldH*z) screen px.
  // drawImage rescales from (worldW*bs) canvas pixels to (worldW*z) screen pixels automatically.
  //
  // Alignment proof: cached pixel for hex(c,r) is at x=(wp.x+marginW)*bs inside the canvas.
  // drawImage maps that to screen x = blitX + (wp.x+marginW)*bs * (worldW*z)/(worldW*bs)
  //                                        = blitX + (wp.x+marginW)*z
  // worldToScreen(wp.x, wp.y).x = (wp.x - cam.x)*z + Wc/2
  // Setting equal: blitX = (-marginW - cam.x)*z + Wc/2 = worldToScreen(-marginW, -marginH).x ✓
  // Same identity holds for y. Units and terrain are drawn from the same worldToScreen transform.
  const { worldW, worldH, marginW, marginH } = _worldExtents(M);
  const blitOrigin = worldToScreen(-marginW, -marginH);
  ctx.drawImage(cached, blitOrigin.x, blitOrigin.y, worldW * z, worldH * z);

  // --- DYNAMIC LAYER 1: Reach overlay (green) ---
  if (G.reach) {
    for (const k of G.reach.keys()) {
      const [c, r] = k.split(",").map(Number);
      const wp = colrowToPixel(c, r);
      const sp = worldToScreen(wp.x, wp.y);
      hexPath(sp.x, sp.y, rad * 0.9);
      ctx.fillStyle = "rgba(120,180,90,0.22)";
      ctx.fill();
      ctx.strokeStyle = "rgba(140,200,110,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // --- DYNAMIC LAYER 2: Fire / charge reticles ---
  function _drawTargetSet(set, col) {
    if (!set) return;
    for (const k of set) {
      const [c, r] = k.split(",").map(Number);
      const wp = colrowToPixel(c, r);
      const sp = worldToScreen(wp.x, wp.y);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, rad * 0.62, 0, 6.283);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sp.x - rad * 0.7, sp.y);
      ctx.lineTo(sp.x + rad * 0.7, sp.y);
      ctx.moveTo(sp.x, sp.y - rad * 0.7);
      ctx.lineTo(sp.x, sp.y + rad * 0.7);
      ctx.stroke();
    }
  }
  _drawTargetSet(G.fireT, "rgba(168,61,51,0.9)");
  _drawTargetSet(G.chargeT, "rgba(201,168,95,0.95)");

  // --- DYNAMIC LAYER 3: Units (after terrain blit, before selection rings) ---
  for (const u of B.units) {
    if (!u.alive) continue;
    if (u.side === B.enemySide && !u.spotted) continue;
    const wp = colrowToPixel(u.c, u.r);
    const sp = worldToScreen(wp.x, wp.y);
    if (sp.x < -rad * 2 || sp.x > Wc + rad * 2 ||
        sp.y < -rad * 2 || sp.y > Hc + rad * 2) continue;
    // Seam: use drawUnitSprite if G2 is loaded, else fallback to legacy drawUnit
    if (typeof drawUnitSprite === "function") {
      drawUnitSprite(u, sp.x, sp.y, rad, skin);
    } else {
      drawUnit(u, sp.x, sp.y, rad, skin);
    }
  }

  // --- DYNAMIC LAYER 4: Selection ring ---
  if (G.sel && G.sel.alive) {
    const wp = colrowToPixel(G.sel.c, G.sel.r);
    const sp = worldToScreen(wp.x, wp.y);
    ctx.strokeStyle = "#c9a85f";
    ctx.lineWidth = 3;
    hexPath(sp.x, sp.y, rad * 0.96);
    ctx.stroke();
    ctx.strokeStyle = "rgba(201,168,95,0.4)";
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  // --- DYNAMIC LAYER 5: Hover ring ---
  if (G.hover) {
    const wp = colrowToPixel(G.hover.c, G.hover.r);
    const sp = worldToScreen(wp.x, wp.y);
    ctx.strokeStyle = "rgba(232,220,192,0.4)";
    ctx.lineWidth = 1.5;
    hexPath(sp.x, sp.y, rad * 0.96);
    ctx.stroke();
  }

  // --- DYNAMIC LAYER 6: Anim flashes (G.anim fallback — G3 takes over when present) ---
  for (const f of G.anim) {
    const wp = colrowToPixel(f.c, f.r);
    const sp = worldToScreen(wp.x, wp.y);
    const a = f.t / f.max;
    ctx.globalAlpha = a;
    ctx.fillStyle = f.type === "fire" ? "rgba(220,120,40,0.8)" : "rgba(220,200,120,0.85)";
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, rad * (1.1 - a * 0.5), 0, 6.283);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // --- DYNAMIC LAYER 7: FX from G3 ---
  if (typeof drawFX === "function") {
    drawFX();
  }

  // --- MAP FURNITURE (drawn on top in screen corners) ---
  const compassSize = Math.max(16, Math.min(28, z * 24));
  _drawCompassRose(ctx, Wc - 48 - compassSize * 0.5, compassSize * 1.8 + 6, compassSize);
  _drawScaleBar(ctx, 12, Hc - 28, z);
  _drawCartouche(ctx, Wc / 2, 12, 240, B.bd);

  // --- FAMOUS FEATURES LABELS ---
  _drawFamousFeatures(ctx, M, B.bd, z);

  // --- MINIMAP (always last) ---
  drawMini();
}
