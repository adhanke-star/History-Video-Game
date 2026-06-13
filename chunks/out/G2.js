/* ==== §18 — SPRITE THEATER (G2) ==== */

// G2 contract: define drawUnitSprite(u, sx, sy, rad, skin) only.
// Never redeclares draw() or drawUnit(). No Math.random — all randomness
// seeded from u.id via mulberry32. Offscreen sprite cache (Map, cap 64).
// LOD from G.cam.z + (G.lodBias||0). spriteBudgetCheck(dt) implements
// the 22ms/30-frame rule. Flag sine ripple gated on !G.settings.reduceMotion
// and battle-active. Badges compact above formation (morale, ammo, xp).
// Union #2b4d7e, CS butternut #8a7d66, parchment accents.

// ── Sprite cache ──────────────────────────────────────────────────────────
const _spriteCache = new Map(); // key → {cv, width, height}
const _SPRITE_CAP = 64;

function _spriteEvict() {
  // evict oldest entries to stay under cap
  const keys = Array.from(_spriteCache.keys());
  while (_spriteCache.size > _SPRITE_CAP) {
    _spriteCache.delete(keys.shift());
  }
}

// ── LOD tiers ─────────────────────────────────────────────────────────────
// 0 = full (zoom ≥ 0.9): 20+ figures
// 1 = half (0.55–0.9):   ~10 figures
// 2 = block (<0.55):     massed block + flag only
function _lodTier(zoom) {
  const bias = (typeof G !== "undefined" && G.lodBias) ? (G.lodBias | 0) : 0;
  let tier;
  if (zoom >= 0.9)      tier = 0;
  else if (zoom >= 0.55) tier = 1;
  else                   tier = 2;
  return Math.min(2, tier + bias);
}

// ── Figure count from strength + LOD ──────────────────────────────────────
function _figureCount(u, tier) {
  const strFrac = (u.maxStr > 0) ? Math.max(0, Math.min(1, u.strength / u.maxStr)) : 1;
  // full count by type
  const full = (u.type === "inf") ? 22
             : (u.type === "cav") ? 14
             : (u.type === "art") ? 9   // 3 guns × 3 crew
             : (u.type === "nav") ? 1
             : (u.type === "fort") ? 5
             : (u.type === "hq")   ? 2
             : 10;
  const lodMult = tier === 0 ? 1.0 : tier === 1 ? 0.5 : 0;
  if (tier === 2) return 0; // block mode — no individual figures
  let count = Math.round(full * lodMult * strFrac);
  // floor 4 before block tier kicks in (block only at tier 2)
  if (tier <= 1) count = Math.max(4, count);
  return count;
}

// ── Pose bucket ───────────────────────────────────────────────────────────
// Encodes state variants that change the sprite shape.
// 0=normal, 1=routed, 2=done(acted), 3=ent>0, 4=ammo-out
function _poseBucket(u) {
  if (u.routed)    return 1;
  if (u.done)      return 2;
  if (u.ent > 0)   return 3;
  if (u.ammo === 0 && u.maxAmmo > 0) return 4;
  return 0;
}

// ── Cache key ─────────────────────────────────────────────────────────────
// Encodes everything that can change sprite shape.
// Format: "type|side|lodTier|poseBucket|skin|strBucket"
// strBucket: 0=full(>0.75), 1=mid(0.40-0.75), 2=thin(<0.40)
// (strength affects figure count so must be in key)
function _cacheKey(u, tier, skin) {
  const strFrac = (u.maxStr > 0) ? u.strength / u.maxStr : 1;
  const strBucket = strFrac > 0.75 ? 0 : strFrac > 0.40 ? 1 : 2;
  return u.type + "|" + u.side + "|" + tier + "|" + _poseBucket(u) + "|" + skin + "|" + strBucket;
}

// ── lodBias bump machinery ─────────────────────────────────────────────────
let _slowFrames = 0;
const _SLOW_THRESHOLD = 22; // ms
const _SLOW_RUN = 30;       // consecutive frames before bumping bias

function spriteBudgetCheck(dt) {
  if (dt > _SLOW_THRESHOLD) {
    _slowFrames++;
    if (_slowFrames >= _SLOW_RUN) {
      _slowFrames = 0;
      if (typeof G !== "undefined") {
        G.lodBias = Math.min(2, (G.lodBias || 0) + 1);
      }
    }
  } else {
    _slowFrames = 0;
  }
}

// ── Color constants ────────────────────────────────────────────────────────
const _COL = {
  US_COAT:   "#2b4d7e",   // Union coat (contract lock)
  US_LT:     "#4a72a8",   // Union lighter accent
  US_TROUSE: "#1e3560",   // Union trousers
  CS_COAT:   "#8a7d66",   // CS butternut (contract lock)
  CS_LT:     "#a89c82",   // CS lighter accent
  CS_TROUSE: "#6e6150",   // CS trousers
  PARCH:     "#e8dcc0",   // parchment
  PARCH_DK:  "#c9b487",   // dark parchment
  BRASS:     "#c9a85f",   // brass accent
  SKIN_TONE: "#c9a07a",   // face/hand
  KEPI_US:   "#1e3050",   // Union kepi
  KEPI_CS:   "#5a5040",   // CS kepi
  MUSKET:    "#5a4020",   // musket wood
  METAL:     "#888070",   // musket/gun metal
  HORSE_LT:  "#7a6040",   // horse body light
  HORSE_DK:  "#4a3820",   // horse body dark
  WHEEL:     "#4a3820",   // gun wheel
  HULL_US:   "#2a3a5a",   // US naval hull
  HULL_CS:   "#5a4a30",   // CS naval hull
  SMOKE:     "rgba(180,170,160,0.55)",
  FLAG_US:   ["#2b4d7e","#c0392b","#e8dcc0"],  // blue, red, white
  FLAG_CS:   ["#c0392b","#4a3820","#e8dcc0"],  // red, brown, white
  EARTH:     "#8a7050",   // entrench spoil
  BLOOD_LOW: "#a83d33",   // morale low pip
  AMMO_OUT:  "#7a2420",   // ammo pip
};

// ── Offscreen sprite renderer ──────────────────────────────────────────────
function _buildSprite(u, tier, skin, rng) {
  const key = _cacheKey(u, tier, skin);
  if (_spriteCache.has(key)) return _spriteCache.get(key);

  // canvas size proportional to render radius (we normalise to a fixed size
  // and blit scaled at draw time)
  const W = 120, H = 100;
  const oc = document.createElement("canvas");
  oc.width = W; oc.height = H;
  const ox = oc.getContext("2d");

  const cx = W / 2, cy = H / 2;

  if (tier === 2) {
    // ── BLOCK MODE ─────────────────────────────────────────────────────────
    _drawBlock(ox, u, W, H, cx, cy, skin, rng);
  } else {
    // ── FIGURE MODE ────────────────────────────────────────────────────────
    const count = _figureCount(u, tier);
    const pose  = _poseBucket(u);
    _drawFormation(ox, u, W, H, count, pose, skin, rng);
  }

  const entry = { cv: oc, width: W, height: H };
  _spriteCache.set(key, entry);
  _spriteEvict();
  return entry;
}

// ── Block mode (LOD 2) ────────────────────────────────────────────────────
function _drawBlock(ox, u, W, H, cx, cy, skin, rng) {
  const us = (u.side === "US");
  const coat  = us ? _COL.US_COAT : _COL.CS_COAT;
  const coatL = us ? _COL.US_LT   : _COL.CS_LT;

  // massed rectangle
  const bw = W * 0.80, bh = H * 0.50;
  const bx = cx - bw / 2, by = cy - bh / 2 + 6;

  // shadow
  ox.fillStyle = "rgba(0,0,0,0.28)";
  ox.fillRect(bx + 3, by + 3, bw, bh);

  // body gradient
  const g = ox.createLinearGradient(0, by, 0, by + bh);
  g.addColorStop(0, coatL);
  g.addColorStop(1, coat);
  ox.fillStyle = g;
  ox.fillRect(bx, by, bw, bh);

  // outline
  ox.strokeStyle = "rgba(0,0,0,0.55)";
  ox.lineWidth = 1.5;
  ox.strokeRect(bx, by, bw, bh);

  // entrench ridge before the block
  if (u.ent > 0) {
    _drawEntrenchRidge(ox, cx, by + bh - 2, bw * 0.9, u.ent, rng);
  }

  // small flag on top centre
  _drawFlag(ox, u, cx, by - 10, 8, rng, 0 /* no ripple at block tier */);
}

// ── Full formation dispatching ─────────────────────────────────────────────
function _drawFormation(ox, u, W, H, count, pose, skin, rng) {
  const cx = W / 2, cy = H / 2;

  if (u.type === "inf")  _drawInfantry(ox, u, W, H, cx, cy, count, pose, skin, rng);
  else if (u.type === "cav")  _drawCavalry(ox, u, W, H, cx, cy, count, pose, skin, rng);
  else if (u.type === "art")  _drawArtillery(ox, u, W, H, cx, cy, count, pose, skin, rng);
  else if (u.type === "nav")  _drawNaval(ox, u, W, H, cx, cy, skin, rng);
  else if (u.type === "fort") _drawFort(ox, u, W, H, cx, cy, count, pose, skin, rng);
  else if (u.type === "hq")   _drawHQ(ox, u, W, H, cx, cy, skin, rng);
}

// ── Infantry: two ranks ≤11 wide ──────────────────────────────────────────
function _drawInfantry(ox, u, W, H, cx, cy, count, pose, skin, rng) {
  const us = (u.side === "US");
  const coat    = us ? _COL.US_COAT : _COL.CS_COAT;
  const trouse  = us ? _COL.US_TROUSE : _COL.CS_TROUSE;
  const kepi    = us ? _COL.KEPI_US : _COL.KEPI_CS;

  const routed = (pose === 1);
  const acted  = (pose === 2);
  const ent    = (pose === 3);
  const ammoOut= (pose === 4);

  // layout
  const cols   = Math.min(11, Math.ceil(count / 2));
  const rows   = 2;
  const figW   = Math.min(10, (W - 16) / cols);
  const figH   = 16;
  const startX = cx - (cols * figW) / 2 + figW / 2;
  const startY = routed ? cy + 4 : cy;

  // entrench ridge behind front rank (in front visually = lower y since
  // we draw top-down, so render before figures)
  if (ent) {
    const ridgeY = startY + rows * (figH + 2) - 4;
    _drawEntrenchRidge(ox, cx, ridgeY, cols * figW * 0.95, u.ent, rng);
  }

  // colors line (regimental flag on left end of front rank)
  const flagX = startX - figW * 0.5;
  const flagY = startY - 18;
  _drawFlag(ox, u, flagX, flagY, 11, rng, 0);

  // figures
  let drawn = 0;
  for (let row = 0; row < rows && drawn < count; row++) {
    for (let col = 0; col < cols && drawn < count; col++) {
      // seeded per-figure jitter
      const fjitter = mulberry(rng() * 0x100000 | 0);
      const jx = (fjitter() - 0.5) * 1.2;
      const jy = (fjitter() - 0.5) * 0.8;
      // shade variation for depth
      const shade = fjitter() < 0.45 ? -12 : 0;

      const fx = startX + col * figW + jx;
      const fy = startY + row * (figH + 2) + jy;

      if (routed) {
        _drawFigureRouted(ox, fx, fy, figH, coat, kepi, trouse, shade);
      } else if (ammoOut) {
        _drawFigureHeld(ox, fx, fy, figH, coat, kepi, trouse, shade);
      } else {
        _drawFigureMarch(ox, fx, fy, figH, coat, kepi, trouse, shade, row === 0);
      }
      drawn++;
    }
  }

  // dropped colors if routed
  if (routed) {
    _drawDroppedFlag(ox, u, cx, cy - 8, rng);
  }

  // acted alpha applied by blitter
}

// ── Individual figure: marching pose ──────────────────────────────────────
function _drawFigureMarch(ox, fx, fy, fh, coat, kepi, trouse, shade, isFront) {
  const sc = fh / 16; // scale factor
  ox.save();
  ox.translate(fx, fy);

  // kepi
  ox.fillStyle = _shadeHex(kepi, shade);
  ox.beginPath();
  ox.ellipse(0, -fh * 0.42, sc * 2.4, sc * 1.0, 0, Math.PI, 0);
  ox.fill();
  ox.fillRect(-sc * 1.5, -fh * 0.42, sc * 3, sc * 0.8);

  // head (face)
  ox.fillStyle = _COL.SKIN_TONE;
  ox.beginPath();
  ox.arc(0, -fh * 0.28, sc * 1.5, 0, Math.PI * 2);
  ox.fill();

  // coat / body
  ox.fillStyle = _shadeHex(coat, shade);
  ox.fillRect(-sc * 1.8, -fh * 0.18, sc * 3.6, fh * 0.38);

  // trousers
  ox.fillStyle = _shadeHex(trouse, shade);
  ox.fillRect(-sc * 1.4, fh * 0.18, sc * 1.3, fh * 0.28);
  ox.fillRect( sc * 0.1, fh * 0.18, sc * 1.3, fh * 0.28);

  // musket (right shoulder, upright for rear rank, angled for front)
  ox.strokeStyle = _COL.MUSKET;
  ox.lineWidth = sc * 0.9;
  ox.lineCap = "round";
  if (isFront) {
    ox.beginPath();
    ox.moveTo(sc * 1.4, fh * 0.1);
    ox.lineTo(sc * 2.0, -fh * 0.45);
    ox.stroke();
  } else {
    ox.beginPath();
    ox.moveTo(sc * 1.5, fh * 0.05);
    ox.lineTo(sc * 1.8, -fh * 0.50);
    ox.stroke();
  }
  // bayonet glint
  ox.strokeStyle = _COL.METAL;
  ox.lineWidth = sc * 0.5;
  if (isFront) {
    ox.beginPath();
    ox.moveTo(sc * 2.0, -fh * 0.45);
    ox.lineTo(sc * 2.2, -fh * 0.60);
    ox.stroke();
  }

  ox.restore();
}

// ── Figure: held-fire pose (ammo out) ─────────────────────────────────────
function _drawFigureHeld(ox, fx, fy, fh, coat, kepi, trouse, shade) {
  const sc = fh / 16;
  ox.save();
  ox.translate(fx, fy);

  // kepi
  ox.fillStyle = _shadeHex(kepi, shade);
  ox.fillRect(-sc * 1.5, -fh * 0.42, sc * 3, sc * 0.8);

  // head
  ox.fillStyle = _COL.SKIN_TONE;
  ox.beginPath();
  ox.arc(0, -fh * 0.28, sc * 1.5, 0, Math.PI * 2);
  ox.fill();

  // coat — slightly desaturated tint for ammo-out state
  ox.fillStyle = _shadeHex(coat, shade - 20);
  ox.fillRect(-sc * 1.8, -fh * 0.18, sc * 3.6, fh * 0.38);

  // trousers
  ox.fillStyle = _shadeHex(trouse, shade);
  ox.fillRect(-sc * 1.4, fh * 0.18, sc * 2.6, fh * 0.28);

  // musket lowered
  ox.strokeStyle = _COL.MUSKET;
  ox.lineWidth = sc * 0.9;
  ox.lineCap = "round";
  ox.beginPath();
  ox.moveTo(sc * 1.5, fh * 0.20);
  ox.lineTo(sc * 2.2, fh * 0.10);
  ox.stroke();

  ox.restore();
}

// ── Figure: routed (fleeing) ───────────────────────────────────────────────
function _drawFigureRouted(ox, fx, fy, fh, coat, kepi, trouse, shade) {
  const sc = fh / 16;
  ox.save();
  ox.translate(fx, fy);
  ox.rotate(0.35); // leaning forward, running

  // kepi askew
  ox.fillStyle = _shadeHex(kepi, shade);
  ox.save();
  ox.rotate(-0.3);
  ox.fillRect(-sc * 1.5, -fh * 0.42, sc * 3, sc * 0.8);
  ox.restore();

  // head
  ox.fillStyle = _COL.SKIN_TONE;
  ox.beginPath();
  ox.arc(0, -fh * 0.28, sc * 1.5, 0, Math.PI * 2);
  ox.fill();

  // coat
  ox.fillStyle = _shadeHex(coat, shade + 10);
  ox.fillRect(-sc * 1.8, -fh * 0.18, sc * 3.6, fh * 0.38);

  // trousers running spread
  ox.fillStyle = _shadeHex(trouse, shade);
  ox.fillRect(-sc * 2.0, fh * 0.18, sc * 1.2, fh * 0.25);
  ox.fillRect( sc * 0.4, fh * 0.05, sc * 1.2, fh * 0.25);

  ox.restore();
}

// ── Cavalry: mounted riders in two staggered rows ─────────────────────────
function _drawCavalry(ox, u, W, H, cx, cy, count, pose, skin, rng) {
  const us = (u.side === "US");
  const coat  = us ? _COL.US_COAT   : _COL.CS_COAT;
  const kepi  = us ? _COL.KEPI_US   : _COL.KEPI_CS;
  const trouse= us ? _COL.US_TROUSE : _COL.CS_TROUSE;
  const routed = (pose === 1);

  const cols = Math.ceil(count / 2);
  const figW = Math.min(14, (W - 12) / cols);
  const startX = cx - (cols * figW) / 2 + figW / 2;

  if (routed) {
    _drawDroppedFlag(ox, u, cx, cy - 8, rng);
  } else {
    _drawFlag(ox, u, startX - figW * 0.3, cy - 26, 12, rng, 0);
  }

  let drawn = 0;
  for (let row = 0; row < 2 && drawn < count; row++) {
    const rowOff = row * 2; // stagger
    for (let col = 0; col < cols && drawn < count; col++) {
      const fjitter = mulberry(rng() * 0x100000 | 0);
      const jx = (fjitter() - 0.5) * 1.5 + (row === 1 ? figW * 0.5 : 0);
      const jy = (fjitter() - 0.5) * 0.8;
      const fx = startX + col * figW + jx;
      const fy = cy - 10 + row * 18 + jy;

      const hShade = fjitter() < 0.5 ? 0 : -15;
      _drawMountedFigure(ox, fx, fy, coat, kepi, trouse, hShade, routed);
      drawn++;
    }
  }
}

function _drawMountedFigure(ox, fx, fy, coat, kepi, trouse, hShade, routed) {
  ox.save();
  ox.translate(fx, fy);
  if (routed) ox.rotate(0.25);

  // horse body
  const hcol = _shadeHex(_COL.HORSE_LT, hShade);
  ox.fillStyle = hcol;
  ox.beginPath();
  ox.ellipse(0, 4, 7, 4, 0, 0, Math.PI * 2);
  ox.fill();

  // horse legs
  ox.strokeStyle = _COL.HORSE_DK;
  ox.lineWidth = 1.2;
  ox.lineCap = "round";
  if (routed) {
    // galloping legs spread
    ox.beginPath(); ox.moveTo(-5, 6); ox.lineTo(-7, 14); ox.stroke();
    ox.beginPath(); ox.moveTo(-2, 8); ox.lineTo(-4, 15); ox.stroke();
    ox.beginPath(); ox.moveTo(2,  8); ox.lineTo( 5, 13); ox.stroke();
    ox.beginPath(); ox.moveTo(5,  6); ox.lineTo( 8, 12); ox.stroke();
  } else {
    ox.beginPath(); ox.moveTo(-5, 6); ox.lineTo(-5, 14); ox.stroke();
    ox.beginPath(); ox.moveTo(-2, 8); ox.lineTo(-2, 14); ox.stroke();
    ox.beginPath(); ox.moveTo( 2, 8); ox.lineTo( 2, 14); ox.stroke();
    ox.beginPath(); ox.moveTo( 5, 6); ox.lineTo( 5, 14); ox.stroke();
  }

  // head
  ox.fillStyle = hcol;
  ox.beginPath();
  ox.ellipse(7, 0, 4, 2.5, -0.3, 0, Math.PI * 2);
  ox.fill();

  // rider body
  ox.fillStyle = coat;
  ox.fillRect(-2, -10, 5, 10);

  // rider head
  ox.fillStyle = _COL.SKIN_TONE;
  ox.beginPath();
  ox.arc(0, -12, 2.5, 0, Math.PI * 2);
  ox.fill();

  // kepi
  ox.fillStyle = kepi;
  ox.fillRect(-2, -14, 5, 2);

  // saber (if not routed)
  if (!routed) {
    ox.strokeStyle = _COL.METAL;
    ox.lineWidth = 1.0;
    ox.beginPath();
    ox.moveTo(3, -8);
    ox.quadraticCurveTo(7, -12, 10, -6);
    ox.stroke();
  }

  ox.restore();
}

// ── Artillery: 2–3 guns with 3 crew each ──────────────────────────────────
function _drawArtillery(ox, u, W, H, cx, cy, count, pose, skin, rng) {
  const us = (u.side === "US");
  const coat  = us ? _COL.US_COAT   : _COL.CS_COAT;
  const kepi  = us ? _COL.KEPI_US   : _COL.KEPI_CS;
  const trouse= us ? _COL.US_TROUSE : _COL.CS_TROUSE;
  const routed= (pose === 1);

  const guns = Math.min(3, Math.max(1, Math.ceil(count / 3)));
  const gapW = W / (guns + 1);

  if (routed) {
    _drawDroppedFlag(ox, u, cx, cy - 12, rng);
  } else {
    _drawFlag(ox, u, cx - gapW * (guns / 2), cy - 28, 11, rng, 0);
  }

  for (let g = 0; g < guns; g++) {
    const gx = gapW * (g + 1);
    const gy = cy;

    if (!routed) {
      _drawGun(ox, gx, gy, rng);
      // 3 crew around the gun
      for (let c = 0; c < 3; c++) {
        const fjitter = mulberry(rng() * 0x100000 | 0);
        const cr = [
          {dx: -18, dy: -4},
          {dx:  12, dy: -6},
          {dx:   2, dy:  6},
        ][c];
        _drawFigureMarch(ox, gx + cr.dx + (fjitter()-0.5)*1.5,
                             gy + cr.dy + (fjitter()-0.5)*1.5,
                             13, coat, kepi, trouse, 0, false);
      }
    } else {
      // abandoned gun + fleeing crew
      ox.save();
      ox.globalAlpha = 0.55;
      _drawGun(ox, gx, gy, rng);
      ox.restore();
      for (let c = 0; c < 2; c++) {
        const fjitter = mulberry(rng() * 0x100000 | 0);
        _drawFigureRouted(ox, gx + (fjitter()-0.5)*20, gy - 8 + c*10,
                          12, coat, kepi, trouse, 0);
      }
    }
  }
}

function _drawGun(ox, gx, gy, rng) {
  // wheel
  ox.strokeStyle = _COL.WHEEL;
  ox.lineWidth = 2.0;
  ox.beginPath();
  ox.arc(gx - 8, gy + 4, 6, 0, Math.PI * 2);
  ox.stroke();
  // spokes
  for (let s = 0; s < 4; s++) {
    const a = (s / 4) * Math.PI * 2;
    ox.beginPath();
    ox.moveTo(gx - 8, gy + 4);
    ox.lineTo(gx - 8 + Math.cos(a) * 6, gy + 4 + Math.sin(a) * 6);
    ox.stroke();
  }
  // barrel
  ox.strokeStyle = _COL.METAL;
  ox.lineWidth = 3.5;
  ox.lineCap = "round";
  ox.beginPath();
  ox.moveTo(gx - 4, gy + 2);
  ox.lineTo(gx + 12, gy - 5);
  ox.stroke();
  // trail
  ox.strokeStyle = _COL.WHEEL;
  ox.lineWidth = 1.8;
  ox.beginPath();
  ox.moveTo(gx - 8, gy + 4);
  ox.lineTo(gx - 16, gy + 8);
  ox.stroke();
}

// ── Naval: hull + casemate or stack + wake ─────────────────────────────────
function _drawNaval(ox, u, W, H, cx, cy, skin, rng) {
  const us = (u.side === "US");
  const hullCol = us ? _COL.HULL_US : _COL.HULL_CS;
  const ironclad = (u.weapon === "ironclad");
  const pose = _poseBucket(u);
  const routed = (pose === 1);

  // wake / water lines
  ox.strokeStyle = "rgba(100,160,200,0.4)";
  ox.lineWidth = 1.2;
  for (let w = 0; w < 3; w++) {
    ox.beginPath();
    ox.moveTo(cx - 36 - w * 4, cy + 8 + w * 4);
    ox.quadraticCurveTo(cx, cy + 12 + w * 3, cx + 36 + w * 4, cy + 8 + w * 4);
    ox.stroke();
  }

  // hull
  ox.fillStyle = _shadeHex(hullCol, routed ? 20 : 0);
  ox.beginPath();
  ox.moveTo(cx - 32, cy + 2);
  ox.lineTo(cx + 38, cy + 2);
  ox.lineTo(cx + 30, cy + 12);
  ox.lineTo(cx - 26, cy + 12);
  ox.closePath();
  ox.fill();
  ox.strokeStyle = "rgba(0,0,0,0.5)";
  ox.lineWidth = 1.2;
  ox.stroke();

  if (ironclad) {
    // casemate (sloped armour)
    ox.fillStyle = _shadeHex(hullCol, -15);
    ox.beginPath();
    ox.moveTo(cx - 22, cy + 2);
    ox.lineTo(cx + 22, cy + 2);
    ox.lineTo(cx + 16, cy - 10);
    ox.lineTo(cx - 16, cy - 10);
    ox.closePath();
    ox.fill();
    ox.strokeStyle = "rgba(0,0,0,0.45)";
    ox.lineWidth = 1;
    ox.stroke();
    // gun ports
    ox.fillStyle = "#1a1410";
    ox.fillRect(cx - 14, cy - 6, 5, 4);
    ox.fillRect(cx +  9, cy - 6, 5, 4);
  } else {
    // wooden gunboat: stack
    ox.fillStyle = "#3a3028";
    ox.fillRect(cx - 4, cy - 18, 8, 18);
    // smoke wisp
    ox.fillStyle = _COL.SMOKE;
    ox.beginPath();
    ox.ellipse(cx + 2, cy - 22, 5, 3, 0, 0, Math.PI * 2);
    ox.fill();
    // gun on deck
    ox.strokeStyle = _COL.METAL;
    ox.lineWidth = 3;
    ox.lineCap = "round";
    ox.beginPath();
    ox.moveTo(cx + 10, cy + 0);
    ox.lineTo(cx + 24, cy - 5);
    ox.stroke();
  }

  // national ensign (small)
  _drawFlag(ox, u, cx + 28, cy - 16, 7, rng, 0);
}

// ── Fort: parapet + gun + crew ────────────────────────────────────────────
function _drawFort(ox, u, W, H, cx, cy, count, pose, skin, rng) {
  const us = (u.side === "US");
  const coat  = us ? _COL.US_COAT : _COL.CS_COAT;
  const kepi  = us ? _COL.KEPI_US : _COL.KEPI_CS;
  const trouse= us ? _COL.US_TROUSE : _COL.CS_TROUSE;

  // earthwork parapet
  ox.fillStyle = _COL.EARTH;
  ox.beginPath();
  ox.moveTo(cx - 44, cy + 14);
  ox.lineTo(cx - 44, cy - 2);
  ox.lineTo(cx - 30, cy - 8);
  ox.lineTo(cx + 30, cy - 8);
  ox.lineTo(cx + 44, cy - 2);
  ox.lineTo(cx + 44, cy + 14);
  ox.closePath();
  ox.fill();
  ox.strokeStyle = "rgba(0,0,0,0.35)";
  ox.lineWidth = 1.5;
  ox.stroke();

  // parapet crest line
  ox.strokeStyle = _shadeHex(_COL.EARTH, -20);
  ox.lineWidth = 2;
  ox.beginPath();
  ox.moveTo(cx - 44, cy - 2);
  ox.lineTo(cx - 30, cy - 8);
  ox.lineTo(cx + 30, cy - 8);
  ox.lineTo(cx + 44, cy - 2);
  ox.stroke();

  // main gun
  _drawGun(ox, cx, cy + 2, rng);

  // crew (up to 3)
  const crewCount = Math.min(3, count - 1);
  const crewPos = [
    {dx: -26, dy: 2},
    {dx:  20, dy: 2},
    {dx:  -6, dy: 6},
  ];
  for (let i = 0; i < crewCount; i++) {
    const fjitter = mulberry(rng() * 0x100000 | 0);
    _drawFigureMarch(ox,
      cx + crewPos[i].dx + (fjitter()-0.5)*1.5,
      cy + crewPos[i].dy + (fjitter()-0.5)*1.5,
      11, coat, kepi, trouse, 0, false);
  }

  // flag
  _drawFlag(ox, u, cx, cy - 28, 11, rng, 0);
}

// ── HQ: mounted officer + standard bearer ────────────────────────────────
function _drawHQ(ox, u, W, H, cx, cy, skin, rng) {
  const us = (u.side === "US");
  const coat  = us ? _COL.US_COAT   : _COL.CS_COAT;
  const kepi  = us ? _COL.KEPI_US   : _COL.KEPI_CS;
  const trouse= us ? _COL.US_TROUSE : _COL.CS_TROUSE;

  // standard bearer (left) with oversized flag
  _drawMountedFigure(ox, cx - 16, cy + 4, coat, kepi, trouse, 0, false);
  _drawFlag(ox, u, cx - 16, cy - 24, 18, rng, 0); // oversized

  // mounted officer (right) — slightly larger
  ox.save();
  ox.scale(1.08, 1.08);
  _drawMountedFigure(ox, (cx + 12) / 1.08, (cy + 2) / 1.08, coat, kepi, trouse, -10, false);
  ox.restore();
}

// ── Flag: two-segment sine ripple ─────────────────────────────────────────
// ripplePhase = 0 means static. During blit pass, ripple is drawn live.
function _drawFlag(ox, u, fx, fy, height, rng, ripplePhase) {
  const us = (u.side === "US");
  const cols = us ? _COL.FLAG_US : _COL.FLAG_CS;
  const staffH = height * 2.2;
  const flagW  = height * 1.4;
  const segH   = height / 2;

  // staff
  ox.strokeStyle = _COL.PARCH_DK;
  ox.lineWidth = 1.2;
  ox.lineCap = "butt";
  ox.beginPath();
  ox.moveTo(fx, fy);
  ox.lineTo(fx, fy + staffH);
  ox.stroke();

  // honor ticks for xp ≥ 2
  if (u.xp >= 2) {
    ox.strokeStyle = _COL.BRASS;
    ox.lineWidth = 0.8;
    for (let t = 0; t < Math.min(u.xp - 1, 3); t++) {
      const ty = fy + staffH * 0.5 + t * 4;
      ox.beginPath();
      ox.moveTo(fx - 2, ty);
      ox.lineTo(fx + 2, ty);
      ox.stroke();
    }
  }

  // flag body (2 segments, static in sprite — ripple added at blit time)
  const seg0y = fy;
  const seg1y = fy + segH;

  if (ripplePhase === 0) {
    // flat in pre-rendered sprite
    ox.fillStyle = cols[0];
    ox.fillRect(fx, seg0y, flagW, segH);
    ox.fillStyle = cols[1];
    ox.fillRect(fx, seg1y, flagW, segH);
  } else {
    // wavy — used in live-draw path, not sprite cache
    _drawWavyFlag(ox, fx, seg0y, flagW, segH, cols[0], ripplePhase);
    _drawWavyFlag(ox, fx, seg1y, flagW, segH, cols[1], ripplePhase);
  }

  // finial
  ox.fillStyle = _COL.BRASS;
  ox.beginPath();
  ox.arc(fx, fy - 2, 2, 0, Math.PI * 2);
  ox.fill();
}

function _drawWavyFlag(ox, fx, fy, fw, fh, col, phase) {
  ox.fillStyle = col;
  ox.beginPath();
  ox.moveTo(fx, fy);
  const steps = 8;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const wx = fx + t * fw;
    const wy = fy + Math.sin(t * Math.PI * 2 + phase) * (fh * 0.18);
    s === 0 ? ox.moveTo(wx, wy) : ox.lineTo(wx, wy);
  }
  for (let s = steps; s >= 0; s--) {
    const t = s / steps;
    const wx = fx + t * fw;
    const wy = fy + fh + Math.sin(t * Math.PI * 2 + phase + 0.4) * (fh * 0.18);
    ox.lineTo(wx, wy);
  }
  ox.closePath();
  ox.fill();
}

function _drawDroppedFlag(ox, u, fx, fy, rng) {
  const us = (u.side === "US");
  const cols = us ? _COL.FLAG_US : _COL.FLAG_CS;
  // staff lying diagonally
  ox.save();
  ox.translate(fx, fy);
  ox.rotate(0.7);
  ox.strokeStyle = _COL.PARCH_DK;
  ox.lineWidth = 1.2;
  ox.beginPath();
  ox.moveTo(0, 0);
  ox.lineTo(0, 18);
  ox.stroke();
  ox.fillStyle = cols[0];
  ox.fillRect(0, 0, 10, 8);
  ox.fillStyle = cols[1];
  ox.fillRect(0, 8, 10, 8);
  ox.restore();
}

// ── Entrenchment ridge ────────────────────────────────────────────────────
function _drawEntrenchRidge(ox, cx, ridgeY, width, entLevel, rng) {
  const ridgeH = 5 + entLevel * 2;
  const x0 = cx - width / 2;
  // dirt mound
  ox.fillStyle = _COL.EARTH;
  ox.beginPath();
  ox.moveTo(x0, ridgeY);
  // bumpy top
  const steps = 10;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const rx = x0 + t * width;
    const ry = ridgeY - ridgeH * (0.5 + 0.5 * Math.abs(Math.sin(s * 1.3)));
    s === 0 ? ox.moveTo(rx, ry) : ox.lineTo(rx, ry);
  }
  ox.lineTo(x0 + width, ridgeY);
  ox.closePath();
  ox.fill();

  // texture ticks (abatis / stakes)
  ox.strokeStyle = _shadeHex(_COL.EARTH, -25);
  ox.lineWidth = 0.8;
  for (let s = 0; s < 6; s++) {
    const ex = x0 + (s / 6) * width + rng() * 4;
    ox.beginPath();
    ox.moveTo(ex, ridgeY - 2);
    ox.lineTo(ex + 3, ridgeY - 7);
    ox.stroke();
  }
}

// ── Hex-colour shade helper ───────────────────────────────────────────────
// Very lightweight: parses 6-digit hex, shifts r/g/b by amount (+ = lighter)
function _shadeHex(hex, amt) {
  if (!hex || hex[0] !== "#") return hex;
  const r = clamp(parseInt(hex.slice(1,3),16) + amt, 0, 255);
  const g = clamp(parseInt(hex.slice(3,5),16) + amt, 0, 255);
  const b = clamp(parseInt(hex.slice(5,7),16) + amt, 0, 255);
  return "#" + (r<16?"0":"") + r.toString(16) + (g<16?"0":"") + g.toString(16) + (b<16?"0":"") + b.toString(16);
}

// ── Badge drawing (compact, above formation) ──────────────────────────────
// Mirrors old drawUnit badge positions, re-expressed for sprite space.
// Called in live pass (not cached) since morale/ammo can change mid-turn.
function _drawBadges(ctx, u, sx, sy, rad) {
  const sz = rad * 0.74;

  // morale pip (low)  — matches old: arc at +sz*0.62, -sz*0.5 (right)
  if (u.morale < u.maxMor * 0.4) {
    ctx.fillStyle = _COL.BLOOD_LOW;
    ctx.beginPath();
    ctx.arc(sx + sz * 0.62, sy - sz * 0.82, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ammo-out pip — matches old: arc at -sz*0.62, -sz*0.5 (left)
  if (u.type !== "hq" && u.ammo <= 0 && u.maxAmmo > 0) {
    ctx.fillStyle = _COL.AMMO_OUT;
    ctx.beginPath();
    ctx.arc(sx - sz * 0.62, sy - sz * 0.82, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // xp dots — matches old: row of arcs above
  if (u.xp > 0) {
    ctx.fillStyle = _COL.BRASS;
    for (let i = 0; i < Math.min(u.xp, 5); i++) {
      ctx.beginPath();
      ctx.arc(sx - sz * 0.55 + i * 5, sy - sz * 0.96, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── Flag ripple (live pass, not cached) ───────────────────────────────────
function _drawLiveFlagRipple(ctx, u, sx, sy, rad) {
  const sz = rad * 0.74;
  const flagX = sx - sz * 0.5;
  const flagY = sy - sz * 1.3;
  const flagH  = rad * 0.45;
  const flagW  = rad * 0.55;
  const phase  = (Date.now() * 0.003) % (Math.PI * 2);
  const us = (u.side === "US");
  const cols = us ? _COL.FLAG_US : _COL.FLAG_CS;

  // staff
  ctx.strokeStyle = _COL.PARCH_DK;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(flagX, flagY);
  ctx.lineTo(flagX, flagY + flagH * 2.4);
  ctx.stroke();

  // two wavy segments
  _drawWavyFlag(ctx, flagX, flagY,          flagW, flagH / 2, cols[0], phase);
  _drawWavyFlag(ctx, flagX, flagY + flagH/2, flagW, flagH / 2, cols[1], phase + 0.3);

  // finial
  ctx.fillStyle = _COL.BRASS;
  ctx.beginPath();
  ctx.arc(flagX, flagY - 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

// ── Main entry point ──────────────────────────────────────────────────────
function drawUnitSprite(u, sx, sy, rad, skin) {
  // resolve LOD
  const zoom = (typeof G !== "undefined" && G.cam) ? G.cam.z : 1;
  const tier  = _lodTier(zoom);

  // seeded RNG for this unit (deterministic from u.id, no Math.random)
  const rng = mulberry(hashStr("sp" + u.id));

  // acted / routed alpha
  const acted  = (u.done && u.side === (G && G.battle ? G.battle.playerSide : ""));
  const routed = u.routed;
  const baseAlpha = routed ? 0.70 : acted ? 0.82 : 1.0;

  // build or retrieve sprite
  const entry = _buildSprite(u, tier, skin, mulberry(hashStr("sp" + u.id)));

  // blit: scale sprite to current rad
  const scale = (rad * 2.2) / entry.width;
  const dw = entry.width  * scale;
  const dh = entry.height * scale;
  const dx = sx - dw / 2;
  const dy = sy - dh * 0.58; // offset so base of formation sits on hex centre

  const ctx = (typeof G !== "undefined" && G.battle) ? document.getElementById("map").getContext("2d") : null;
  if (!ctx) return;

  ctx.save();
  ctx.globalAlpha = baseAlpha;

  // routed lean
  if (routed) {
    ctx.translate(sx, sy);
    ctx.rotate(-0.18);
    ctx.translate(-sx, -sy);
  }

  ctx.drawImage(entry.cv, dx, dy, dw, dh);

  ctx.restore();

  // ── Live layers (not cached) ────────────────────────────────────────────

  // flag ripple (only when battle active and !reduceMotion)
  const battleActive = (typeof G !== "undefined" && G.battle && !G.battle.over);
  const reduceMotion = (typeof G !== "undefined" && G.settings && G.settings.reduceMotion);
  const shouldAnimate = battleActive && !reduceMotion;

  if (shouldAnimate && tier <= 1) {
    _drawLiveFlagRipple(ctx, u, sx, sy, rad);
    if (typeof G !== "undefined") G.spriteAnim = true;
  }

  // compact badges (always live — they change without cache invalidation)
  _drawBadges(ctx, u, sx, sy, rad);

  // done dim (player side) — drawn live like old drawUnit
  if (acted && u.side === (G && G.battle ? G.battle.playerSide : "")) {
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = "rgba(13,10,7,1)";
    const sz = rad * 0.74;
    // match old rrect bounds
    ctx.fillRect(sx - sz * 0.8, sy - sz * 0.62 - rad * 0.5, sz * 1.6, sz * 1.24 + rad);
    ctx.restore();
  }
}
