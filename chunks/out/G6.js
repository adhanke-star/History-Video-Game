/* ==== §22 — PORTRAIT ENGRAVINGS (G6) ==== */

(function () {
  // ---- Internal seeded-RNG from mulberry + hashStr (engine-defined) ----
  // mulberry(seed) and hashStr(s) are guaranteed present at integration time.
  // We call them directly — no fallback needed (G-wave rule: splice before __ENGINE_END__).

  // ---- Portrait cache (Map, cap 96, LRU-eviction via insertion order) ----
  const _CACHE = new Map(); // key → dataURL
  const _CACHE_MAX = 96;

  function _cacheGet(key) {
    if (!_CACHE.has(key)) return null;
    // Refresh insertion order for LRU
    const v = _CACHE.get(key);
    _CACHE.delete(key);
    _CACHE.set(key, v);
    return v;
  }

  function _cacheSet(key, val) {
    if (_CACHE.size >= _CACHE_MAX) {
      // Evict oldest (first inserted key)
      _CACHE.delete(_CACHE.keys().next().value);
    }
    _CACHE.set(key, val);
  }

  // ---- Colour constants: sepia ink on parchment ----
  // Parchment ground
  const PARCH_LIGHT  = "#f2e8ce";
  const PARCH_BASE   = "#e8dcc0";
  const PARCH_DARK   = "#d8c9a4";
  // Ink family (#3a2c1c)
  const INK_DARK     = "#1e1510";
  const INK_BASE     = "#3a2c1c";
  const INK_MID      = "#5a4030";
  const INK_LIGHT    = "#7a5a40";
  // Brass border
  const BRASS        = "#9c7a3c";
  const BRASS_LT     = "#c9a85f";
  // Tintype plate
  const TINT_DARK    = "#1a1410";
  const TINT_MID     = "#2e2416";

  // ---- Canvas dimensions ----
  const W = 96, H = 120;
  // Portrait oval centre and radii
  const OX = W / 2, OY = 56;
  const ORX = 40, ORY = 50;

  // ---- Feature tables (seeded selection, not Math.random) ----

  // Face oval shapes: [widthFrac, heightFrac, chinShift]
  const FACE_SHAPES = [
    [0.38, 0.44, 0],        // oval
    [0.40, 0.42, 3],        // round
    [0.34, 0.46, -2],       // narrow long
    [0.41, 0.40, 2],        // broad short
    [0.36, 0.45, 1],        // slightly narrow
  ];

  // Hair styles: functions receiving (ctx, rng, fx, fy, fw, fh, inkCol)
  // fx,fy = face oval center, fw,fh = face oval half-widths
  const HAIR_STYLES = [
    // 0: side-parted swept back
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      // top mass
      ctx.beginPath();
      ctx.ellipse(fx, fy - fh * 0.82, fw * 0.82, fh * 0.28, 0, Math.PI, 0);
      ctx.fill();
      // side temples
      ctx.beginPath();
      ctx.ellipse(fx - fw * 0.78, fy - fh * 0.3, fw * 0.22, fh * 0.38, -0.3, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(fx + fw * 0.78, fy - fh * 0.3, fw * 0.22, fh * 0.38, 0.3, 0, Math.PI);
      ctx.fill();
    },
    // 1: short cropped
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(fx, fy - fh * 0.88, fw * 0.88, fh * 0.22, 0, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(fx - fw * 0.72, fy - fh * 0.55, fw * 0.18, fh * 0.24, -0.2, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(fx + fw * 0.72, fy - fh * 0.55, fw * 0.18, fh * 0.24, 0.2, 0, Math.PI);
      ctx.fill();
    },
    // 2: wavy medium length
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(fx, fy - fh * 0.78, fw * 0.90, fh * 0.34, 0, Math.PI, 0);
      ctx.fill();
      // wave strokes at sides
      for (let s = 0; s < 2; s++) {
        const sx = s === 0 ? fx - fw * 0.88 : fx + fw * 0.88;
        const dir = s === 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(sx, fy - fh * 0.5);
        ctx.bezierCurveTo(sx + dir * 6, fy - fh * 0.25, sx, fy, sx + dir * 4, fy + fh * 0.2);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = ink;
        ctx.stroke();
      }
    },
    // 3: high pompadour
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(fx, fy - fh * 0.96, fw * 0.80, fh * 0.36, 0, Math.PI, 0);
      ctx.fill();
      // raised front
      ctx.beginPath();
      ctx.ellipse(fx, fy - fh * 1.04, fw * 0.50, fh * 0.22, 0, Math.PI, 0);
      ctx.fill();
    },
    // 4: receding / thin on top
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      // thin band at crown
      ctx.beginPath();
      ctx.ellipse(fx, fy - fh * 0.86, fw * 0.65, fh * 0.14, 0, Math.PI, 0);
      ctx.fill();
      // side puffs
      ctx.beginPath();
      ctx.ellipse(fx - fw * 0.70, fy - fh * 0.55, fw * 0.28, fh * 0.30, -0.3, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(fx + fw * 0.70, fy - fh * 0.55, fw * 0.28, fh * 0.30, 0.3, 0, Math.PI);
      ctx.fill();
    },
  ];

  // Beard styles (6 including none)
  // returns true if brow gap needed (moustache covers upper lip)
  const BEARD_STYLES = [
    // 0: clean shaven (none)
    function (ctx, rng, fx, fy, fw, fh, ink) { /* no beard */ },
    // 1: full bushy beard
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(fx, fy + fh * 0.44, fw * 0.80, fh * 0.44, 0, 0, Math.PI);
      ctx.fill();
      // moustache bar
      ctx.fillRect(fx - fw * 0.36, fy + fh * 0.02, fw * 0.72, fh * 0.12);
    },
    // 2: neat moustache only
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(fx, fy + fh * 0.06, fw * 0.32, fh * 0.09, 0, 0, Math.PI);
      ctx.fill();
    },
    // 3: chinstrap + moustache
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx, fy + fh * 0.15, fw * 0.76, 0.15, Math.PI - 0.15);
      ctx.stroke();
      // moustache
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(fx, fy + fh * 0.06, fw * 0.30, fh * 0.08, 0, 0, Math.PI);
      ctx.fill();
    },
    // 4: short trimmed beard
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(fx, fy + fh * 0.38, fw * 0.58, fh * 0.30, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillRect(fx - fw * 0.30, fy + fh * 0.04, fw * 0.60, fh * 0.10);
    },
    // 5: goatee + moustache (Van Dyke)
    function (ctx, rng, fx, fy, fw, fh, ink) {
      ctx.fillStyle = ink;
      // goatee
      ctx.beginPath();
      ctx.ellipse(fx, fy + fh * 0.42, fw * 0.26, fh * 0.26, 0, 0, Math.PI);
      ctx.fill();
      // moustache wings
      ctx.beginPath();
      ctx.moveTo(fx - fw * 0.10, fy + fh * 0.08);
      ctx.bezierCurveTo(fx - fw * 0.28, fy + fh * 0.02, fx - fw * 0.42, fy + fh * 0.10, fx - fw * 0.38, fy + fh * 0.06);
      ctx.lineWidth = 4;
      ctx.strokeStyle = ink;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx + fw * 0.10, fy + fh * 0.08);
      ctx.bezierCurveTo(fx + fw * 0.28, fy + fh * 0.02, fx + fw * 0.42, fy + fh * 0.10, fx + fw * 0.38, fy + fh * 0.06);
      ctx.stroke();
    },
  ];

  // ---- Core rendering function ----
  function _renderPortrait(name, side, opts) {
    const isTintype = !!(opts && opts.tintype);
    const isNamed   = !!(opts && opts.named);
    const isCmd     = !!(opts && opts.cmd);

    // Seed: name+side, same as contract spec — deterministic forever
    const seed = hashStr(name + side);
    const rng  = mulberry(seed);

    // Offscreen canvas
    const oc  = document.createElement("canvas");
    oc.width  = W;
    oc.height = H;
    const ctx = oc.getContext("2d");

    // ---- Background: parchment or tintype plate ----
    if (isTintype) {
      // Darker collodion plate
      ctx.fillStyle = TINT_DARK;
      ctx.fillRect(0, 0, W, H);
      // subtle warm gradient
      const platGrad = ctx.createRadialGradient(W * 0.45, H * 0.35, 4, W * 0.5, H * 0.5, W * 0.7);
      platGrad.addColorStop(0, "rgba(80,60,30,0.55)");
      platGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = platGrad;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Parchment ground
      ctx.fillStyle = PARCH_BASE;
      ctx.fillRect(0, 0, W, H);
      // Warm gradient
      const pgGrad = ctx.createRadialGradient(W * 0.4, H * 0.3, 2, W * 0.5, H * 0.5, W * 0.72);
      pgGrad.addColorStop(0, PARCH_LIGHT);
      pgGrad.addColorStop(1, PARCH_DARK);
      ctx.fillStyle = pgGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // ---- Fine cross-hatch background (engraved ground texture) ----
    // Use deterministic offsets baked from seed, not per-frame Math.random
    const bgRng = mulberry(seed ^ 0xBACKG001);
    ctx.save();
    ctx.globalAlpha = isTintype ? 0.28 : 0.14;
    const hatchInk = isTintype ? "#5a4828" : INK_MID;
    ctx.strokeStyle = hatchInk;
    ctx.lineWidth   = 0.4;
    // Horizontal fine lines
    for (let y = 0; y < H; y += 3 + Math.floor(bgRng() * 2)) {
      const jx = (bgRng() - 0.5) * 1.2;
      ctx.beginPath();
      ctx.moveTo(jx, y);
      ctx.lineTo(W + jx, y);
      ctx.stroke();
    }
    // Vertical fine lines (cross-hatch)
    for (let x = 0; x < W; x += 4 + Math.floor(bgRng() * 2)) {
      const jy = (bgRng() - 0.5) * 1.0;
      ctx.beginPath();
      ctx.moveTo(x, jy);
      ctx.lineTo(x, H + jy);
      ctx.stroke();
    }
    ctx.restore();

    // ---- Oval vignette mask setup ----
    // We'll apply the oval clip for the portrait area and render the bust inside it.
    // Then we'll draw the oval border separately.

    // ---- Determine face features from seed ----
    const faceIdx   = Math.floor(rng() * FACE_SHAPES.length);
    const hairIdx   = Math.floor(rng() * HAIR_STYLES.length);
    const beardIdx  = Math.floor(rng() * BEARD_STYLES.length);
    // Brow variant: 0=flat, 1=arched, 2=heavy
    const browVar   = Math.floor(rng() * 3);
    // Nose variant: 0=straight, 1=aquiline, 2=button
    const noseVar   = Math.floor(rng() * 3);
    // Jaw variant: 0=square, 1=rounded, 2=pointed
    const jawVar    = Math.floor(rng() * 3);
    // Ear prominence
    const earProm   = 0.5 + rng() * 0.5;
    // Eye spacing
    const eyeSpace  = 0.24 + rng() * 0.10;
    // Age lines intensity (0..1)
    const ageLine   = rng();

    const [fwF, fhF, chinShift] = FACE_SHAPES[faceIdx];

    // Face centre — placed slightly above canvas mid
    const fx = OX;
    const fy = OY - 8;
    const fw = W * fwF;
    const fh = H * fhF;

    const ink      = isTintype ? "#c8b08a" : INK_BASE;
    const inkLight = isTintype ? "#a09070" : INK_MID;
    const inkDark  = isTintype ? "#2a1e10" : INK_DARK;

    // ---- Save and clip to portrait oval for all bust content ----
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(OX, OY, ORX - 1, ORY - 1, 0, 0, Math.PI * 2);
    ctx.clip();

    // ---- Uniform collar by side (inside oval clip) ----
    _drawCollar(ctx, rng, fx, fy, fw, fh, side, isCmd, ink, inkDark, isTintype);

    // ---- Shoulder boards by side ----
    _drawShoulderBoards(ctx, rng, fx, fy, fw, fh, side, isCmd, ink, inkLight, inkDark, isTintype);

    // ---- Neck ----
    const neckW = fw * 0.30;
    const neckTop = fy + fh * 0.40;
    const neckBot = fy + fh * 0.68;
    ctx.fillStyle = isTintype ? "#a08060" : "#c8a87a";
    ctx.beginPath();
    ctx.ellipse(fx, (neckTop + neckBot) / 2, neckW / 2, (neckBot - neckTop) / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- Face oval ----
    ctx.fillStyle = isTintype ? "#a88c68" : "#d4a870";
    ctx.beginPath();
    ctx.ellipse(fx, fy + chinShift * 0.5, fw, fh, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- Face shading: 3-direction hatch passes ----
    // Pass 1: general side lighting (vertical strokes on shadow side, left)
    _hatchOval(ctx, fx, fy + chinShift * 0.5, fw, fh,
      "vertical", 0, fw * 0.25, 3.5, isTintype ? 0.40 : 0.22, ink, rng);

    // Pass 2: contour shading (diagonal NE, right face edge)
    _hatchOval(ctx, fx, fy + chinShift * 0.5, fw, fh,
      "diag_ne", fw * 0.28, fw, 4.0, isTintype ? 0.30 : 0.16, ink, rng);

    // Pass 3: chin/jaw cross-hatch
    _hatchOval(ctx, fx, fy + chinShift * 0.5 + fh * 0.3, fw * 0.80, fh * 0.35,
      "cross", -fw, fw, 3.5, isTintype ? 0.28 : 0.13, ink, rng);

    // ---- Age / character lines ----
    if (ageLine > 0.3) {
      ctx.save();
      ctx.strokeStyle = ink;
      ctx.globalAlpha = ageLine * (isTintype ? 0.50 : 0.30);
      ctx.lineWidth = 0.6;
      // Forehead lines
      const lcount = Math.floor(ageLine * 3) + 1;
      for (let li = 0; li < lcount; li++) {
        const ly = fy - fh * 0.44 + li * 5;
        ctx.beginPath();
        ctx.moveTo(fx - fw * 0.55 + li * 2, ly);
        ctx.bezierCurveTo(fx - fw * 0.15, ly - 2, fx + fw * 0.15, ly - 2, fx + fw * 0.55 - li * 2, ly);
        ctx.stroke();
      }
      // Nasolabial fold
      ctx.globalAlpha = ageLine * (isTintype ? 0.40 : 0.22);
      for (let s = 0; s < 2; s++) {
        const sx = s === 0 ? fx - fw * 0.32 : fx + fw * 0.32;
        ctx.beginPath();
        ctx.moveTo(sx, fy + fh * 0.02);
        ctx.bezierCurveTo(sx - (s === 0 ? 4 : -4), fy + fh * 0.20, sx, fy + fh * 0.30, sx + (s === 0 ? 2 : -2), fy + fh * 0.38);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ---- Ear ----
    for (let s = 0; s < 2; s++) {
      const ex = s === 0 ? fx - fw - 2 : fx + fw + 2;
      const dir = s === 0 ? -1 : 1;
      ctx.fillStyle = isTintype ? "#9a7854" : "#c8a060";
      ctx.beginPath();
      ctx.ellipse(ex, fy - fh * 0.05, fw * 0.12 * earProm, fh * 0.18, dir * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(ex, fy - fh * 0.05, fw * 0.07 * earProm, fh * 0.12, dir * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ---- Hair ----
    HAIR_STYLES[hairIdx](ctx, rng, fx, fy, fw, fh, ink);

    // ---- Brow variant ----
    ctx.strokeStyle = inkDark;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    for (let s = 0; s < 2; s++) {
      const bx = s === 0 ? fx - fw * eyeSpace - fw * 0.08 : fx + fw * eyeSpace + fw * 0.08;
      const dir = s === 0 ? 1 : -1;
      ctx.beginPath();
      if (browVar === 0) {
        // flat
        ctx.moveTo(bx - fw * 0.16, fy - fh * 0.42);
        ctx.lineTo(bx + fw * 0.16, fy - fh * 0.42);
      } else if (browVar === 1) {
        // arched
        ctx.moveTo(bx - fw * 0.16, fy - fh * 0.40);
        ctx.quadraticCurveTo(bx, fy - fh * 0.50, bx + fw * 0.16, fy - fh * 0.40);
      } else {
        // heavy — double stroke
        ctx.moveTo(bx - fw * 0.18, fy - fh * 0.41);
        ctx.lineTo(bx + fw * 0.18, fy - fh * 0.43);
        ctx.lineWidth = 2.4;
      }
      ctx.stroke();
      ctx.lineWidth = 1.6;
    }

    // ---- Eyes ----
    for (let s = 0; s < 2; s++) {
      const ex = s === 0 ? fx - fw * eyeSpace : fx + fw * eyeSpace;
      const ey = fy - fh * 0.25;
      // eye white
      ctx.fillStyle = isTintype ? "#d0c4a8" : "#f0e8d4";
      ctx.beginPath();
      ctx.ellipse(ex, ey, fw * 0.12, fh * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      // iris
      ctx.fillStyle = inkDark;
      ctx.beginPath();
      ctx.arc(ex, ey, fw * 0.07, 0, Math.PI * 2);
      ctx.fill();
      // highlight
      ctx.fillStyle = "rgba(255,240,220,0.7)";
      ctx.beginPath();
      ctx.arc(ex - fw * 0.025, ey - fh * 0.025, fw * 0.022, 0, Math.PI * 2);
      ctx.fill();
      // eyelid lines
      ctx.strokeStyle = inkDark;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(ex - fw * 0.14, ey);
      ctx.bezierCurveTo(ex - fw * 0.05, ey - fh * 0.085, ex + fw * 0.05, ey - fh * 0.085, ex + fw * 0.14, ey);
      ctx.stroke();
    }

    // ---- Nose ----
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.1;
    ctx.lineCap = "round";
    const nx = fx, ny = fy - fh * 0.04;
    if (noseVar === 0) {
      // straight
      ctx.beginPath();
      ctx.moveTo(nx, ny - fh * 0.14);
      ctx.lineTo(nx, ny + fh * 0.02);
      ctx.moveTo(nx - fw * 0.10, ny + fh * 0.02);
      ctx.bezierCurveTo(nx - fw * 0.14, ny + fh * 0.08, nx + fw * 0.14, ny + fh * 0.08, nx + fw * 0.10, ny + fh * 0.02);
      ctx.stroke();
    } else if (noseVar === 1) {
      // aquiline
      ctx.beginPath();
      ctx.moveTo(nx - fw * 0.04, ny - fh * 0.15);
      ctx.bezierCurveTo(nx - fw * 0.02, ny - fh * 0.04, nx + fw * 0.06, ny + fh * 0.00, nx + fw * 0.04, ny + fh * 0.04);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(nx - fw * 0.10, ny + fh * 0.04);
      ctx.bezierCurveTo(nx - fw * 0.12, ny + fh * 0.09, nx + fw * 0.12, ny + fh * 0.09, nx + fw * 0.08, ny + fh * 0.03);
      ctx.stroke();
    } else {
      // button (rounder)
      ctx.beginPath();
      ctx.arc(nx, ny + fh * 0.02, fw * 0.10, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ---- Mouth ----
    ctx.strokeStyle = inkDark;
    ctx.lineWidth = 1.2;
    const mouthY = fy + fh * 0.16;
    ctx.beginPath();
    ctx.moveTo(fx - fw * 0.20, mouthY);
    ctx.bezierCurveTo(fx - fw * 0.06, mouthY + fh * 0.03, fx + fw * 0.06, mouthY + fh * 0.03, fx + fw * 0.20, mouthY);
    ctx.stroke();
    // lower lip hint
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(fx - fw * 0.14, mouthY + fh * 0.05);
    ctx.bezierCurveTo(fx - fw * 0.04, mouthY + fh * 0.09, fx + fw * 0.04, mouthY + fh * 0.09, fx + fw * 0.14, mouthY + fh * 0.05);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ---- Jaw variant lines ----
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = isTintype ? 0.55 : 0.35;
    if (jawVar === 0) {
      // square — straight jaw line hints
      ctx.beginPath();
      ctx.moveTo(fx - fw * 0.80, fy + fh * 0.28);
      ctx.lineTo(fx - fw * 0.80, fy + fh * 0.56);
      ctx.moveTo(fx + fw * 0.80, fy + fh * 0.28);
      ctx.lineTo(fx + fw * 0.80, fy + fh * 0.56);
      ctx.stroke();
    } else if (jawVar === 2) {
      // pointed — V hint at chin
      ctx.beginPath();
      ctx.moveTo(fx - fw * 0.22, fy + fh * 0.56);
      ctx.lineTo(fx, fy + fh * 0.72);
      ctx.lineTo(fx + fw * 0.22, fy + fh * 0.56);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ---- Beard (drawn on top of skin/shading) ----
    BEARD_STYLES[beardIdx](ctx, rng, fx, fy, fw, fh, ink);

    // ---- Restore clip ----
    ctx.restore();

    // ---- Oval vignette ----
    if (isTintype) {
      // Heavy vignette for tintype
      const vig = ctx.createRadialGradient(OX, OY, ORX * 0.35, OX, OY, Math.max(ORX, ORY) * 1.35);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(0.72, "rgba(0,0,0,0.22)");
      vig.addColorStop(1, "rgba(0,0,0,0.78)");
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(OX, OY, ORX + 6, ORY + 6, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
      // 1px soft edge blur simulation — darkened thin ring
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(OX, OY, ORX - 0.5, ORY - 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // Standard vignette
      const vig = ctx.createRadialGradient(OX, OY, ORX * 0.5, OX, OY, Math.max(ORX, ORY) * 1.28);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(0.68, "rgba(26,18,10,0.10)");
      vig.addColorStop(1, "rgba(26,18,10,0.68)");
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(OX, OY, ORX + 4, ORY + 4, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // ---- Oval mask: clip outside oval to parchment/plate background ----
    // Punch out everything outside the oval
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    // oval + full canvas alpha keep: draw white rect then oval white
    // Better: use "destination-out" to erase outside
    ctx.restore();
    // Draw background outside oval directly (simpler than compositing)
    ctx.save();
    ctx.fillStyle = isTintype ? TINT_DARK : PARCH_BASE;
    // Fill corners not inside oval using evenodd rule
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.ellipse(OX, OY, ORX, ORY, 0, 0, Math.PI * 2, true); // counter-clockwise = hole
    ctx.fillStyle = isTintype ? TINT_DARK : PARCH_DARK;
    ctx.fill("evenodd");
    ctx.restore();

    // ---- Brass-line border ----
    // Outer rectangle border
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 2;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
    // Inner fine line
    ctx.strokeStyle = BRASS_LT;
    ctx.lineWidth = 0.7;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // ---- Oval portrait border (brass ring) ----
    ctx.strokeStyle = BRASS;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(OX, OY, ORX, ORY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(201,168,95,0.35)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(OX, OY, ORX + 2, ORY + 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // ---- Nameplate ----
    if (isNamed) {
      const npH = 17;
      const npY = H - npH - 2;
      // Plate background
      ctx.fillStyle = isTintype ? "#2a1e0e" : PARCH_DARK;
      ctx.fillRect(4, npY, W - 8, npH);
      ctx.strokeStyle = BRASS;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(4, npY, W - 8, npH);
      // Name text — truncate if necessary
      ctx.fillStyle = isTintype ? BRASS_LT : INK_DARK;
      ctx.font = "bold 8px 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Trim name to fit (~20 chars at 8px)
      let displayName = name;
      if (displayName.length > 20) displayName = displayName.slice(0, 18) + "…";
      ctx.fillText(displayName, W / 2, npY + npH / 2);
    }

    return oc.toDataURL("image/png");
  }

  // ---- Helper: directional hatch lines over an elliptical region ----
  // direction: "vertical" | "diag_ne" | "cross"
  // xMin, xMax: relative to fx — x range for hatch coverage
  function _hatchOval(ctx, fx, fy, fw, fh, direction, xMin, xMax, spacing, alpha, ink, rng) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.55;
    ctx.lineCap = "butt";

    // Clip to ellipse
    ctx.beginPath();
    ctx.ellipse(fx, fy, fw, fh, 0, 0, Math.PI * 2);
    ctx.clip();

    if (direction === "vertical") {
      const startX = fx + xMin;
      const endX   = fx + xMax;
      for (let x = startX; x < endX; x += spacing) {
        // tiny jitter baked via rng to avoid grid artifacting
        const jx = (rng() - 0.5) * 0.7;
        ctx.beginPath();
        ctx.moveTo(x + jx, fy - fh - 2);
        ctx.lineTo(x + jx, fy + fh + 2);
        ctx.stroke();
      }
    } else if (direction === "diag_ne") {
      const startX = fx + xMin;
      const endX   = fx + xMax;
      for (let x = startX; x < endX; x += spacing) {
        const jx = (rng() - 0.5) * 0.6;
        ctx.beginPath();
        ctx.moveTo(x + jx, fy - fh - 2);
        ctx.lineTo(x + jx + fh * 0.6, fy + fh + 2);
        ctx.stroke();
      }
    } else if (direction === "cross") {
      // Horizontal strokes
      for (let y = fy - fh; y < fy + fh; y += spacing) {
        const jy = (rng() - 0.5) * 0.5;
        ctx.beginPath();
        ctx.moveTo(fx - fw - 2, y + jy);
        ctx.lineTo(fx + fw + 2, y + jy);
        ctx.stroke();
      }
      // Diagonal cross
      for (let x = fx - fw; x < fx + fw; x += spacing * 1.2) {
        const jx = (rng() - 0.5) * 0.6;
        ctx.beginPath();
        ctx.moveTo(x + jx, fy - fh - 2);
        ctx.lineTo(x + jx + fh * 0.5, fy + fh + 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---- Collar: Union = dark blue standing collar, CS = grey/butternut ----
  function _drawCollar(ctx, rng, fx, fy, fw, fh, side, isCmd, ink, inkDark, isTintype) {
    const collarY  = fy + fh * 0.50;
    const collarW  = fw * 1.40;
    const collarH  = fh * 0.60;
    const baseCol  = isTintype
      ? (side === "US" ? "#1a2c44" : "#3a3020")
      : (side === "US" ? "#1f3a5f" : "#6b5444");
    const trimCol  = isTintype ? "#4a6080" : (side === "US" ? "#3d6098" : "#9a7d62");

    // Coat body (trapezoid shape)
    ctx.fillStyle = baseCol;
    ctx.beginPath();
    ctx.moveTo(fx - collarW * 0.5, collarY);
    ctx.lineTo(fx + collarW * 0.5, collarY);
    ctx.lineTo(fx + collarW * 0.55, collarY + collarH);
    ctx.lineTo(fx - collarW * 0.55, collarY + collarH);
    ctx.closePath();
    ctx.fill();

    // Collar facings / revers
    ctx.fillStyle = trimCol;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(fx - fw * 0.10, collarY + 2);
    ctx.lineTo(fx - fw * 0.38, collarY + fh * 0.30);
    ctx.lineTo(fx - fw * 0.18, collarY + fh * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx + fw * 0.10, collarY + 2);
    ctx.lineTo(fx + fw * 0.38, collarY + fh * 0.30);
    ctx.lineTo(fx + fw * 0.18, collarY + fh * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Standing collar top edge
    ctx.strokeStyle = trimCol;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx - fw * 0.28, collarY);
    ctx.lineTo(fx - fw * 0.08, collarY - fh * 0.04);
    ctx.lineTo(fx + fw * 0.08, collarY - fh * 0.04);
    ctx.lineTo(fx + fw * 0.28, collarY);
    ctx.stroke();

    // Buttons (centre line)
    ctx.fillStyle = isTintype ? "#a0843c" : BRASS_LT;
    const btnCount = 3;
    for (let b = 0; b < btnCount; b++) {
      const by = collarY + fh * (0.06 + b * 0.12);
      ctx.beginPath();
      ctx.arc(fx, by, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hatch lines on coat (engraving texture)
    ctx.save();
    ctx.strokeStyle = inkDark;
    ctx.lineWidth = 0.45;
    ctx.globalAlpha = isTintype ? 0.55 : 0.38;
    ctx.beginPath();
    ctx.moveTo(fx - collarW * 0.5, collarY);
    ctx.lineTo(fx + collarW * 0.5, collarY);
    ctx.lineTo(fx + collarW * 0.55, collarY + collarH);
    ctx.lineTo(fx - collarW * 0.55, collarY + collarH);
    ctx.closePath();
    ctx.clip();
    for (let lx = fx - collarW; lx < fx + collarW; lx += 4) {
      ctx.beginPath();
      ctx.moveTo(lx, collarY);
      ctx.lineTo(lx + collarH * 0.4, collarY + collarH);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- Shoulder boards ----
  function _drawShoulderBoards(ctx, rng, fx, fy, fw, fh, side, isCmd, ink, inkLight, inkDark, isTintype) {
    const boardY   = fy + fh * 0.55;
    const boardCol = isTintype ? "#8a7230" : BRASS;
    const boardLt  = isTintype ? "#b09040" : BRASS_LT;
    const boardW   = fw * 0.32;
    const boardH   = fh * 0.10;

    for (let s = 0; s < 2; s++) {
      const bx = s === 0 ? fx - fw * 0.80 : fx + fw * 0.80;

      // Board rectangle
      ctx.fillStyle = boardCol;
      ctx.fillRect(bx - boardW / 2, boardY, boardW, boardH);
      ctx.strokeStyle = boardLt;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(bx - boardW / 2, boardY, boardW, boardH);

      // Stars when cmd
      if (isCmd) {
        const starCount = side === "US" ? 2 : 2; // 2 stars for general
        const starSpacing = boardW / (starCount + 1);
        ctx.fillStyle = boardLt;
        for (let st = 0; st < starCount; st++) {
          const sx = bx - boardW / 2 + starSpacing * (st + 1);
          const sy = boardY + boardH / 2;
          _miniStar(ctx, sx, sy, 2.2);
        }
      } else {
        // Single bar for officer
        ctx.fillStyle = boardLt;
        ctx.fillRect(bx - boardW * 0.35, boardY + boardH * 0.3, boardW * 0.70, boardH * 0.40);
      }
    }
  }

  function _miniStar(ctx, cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 180) * (36 * i - 90);
      const rv  = i % 2 === 0 ? r : r * 0.42;
      const x   = cx + rv * Math.cos(ang);
      const y   = cy + rv * Math.sin(ang);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- Public API ----

  /**
   * portraitFor(name, side, opts) → cached dataURL
   * Deterministic: same name+side always produces identical output.
   * opts: { cmd: bool, named: bool, tintype: bool }
   */
  function portraitFor(name, side, opts) {
    opts = opts || {};
    const key = name + "|" + side + "|" + (opts.cmd ? "1" : "0")
              + "|" + (opts.named ? "1" : "0") + "|" + (opts.tintype ? "1" : "0");
    const cached = _cacheGet(key);
    if (cached) return cached;
    const url = _renderPortrait(name, side, opts);
    _cacheSet(key, url);
    return url;
  }

  // Expose globally
  window.portraitFor = portraitFor;

  // ---- MutationObserver: insert portrait into .lead-badge when leader shown ----
  // #ufBody is the container. refreshUI() sets its innerHTML to include .lead-badge
  // with .lnm containing the leader name (possibly with " ★" suffix).
  // We must NOT self-trigger: inserting an <img> mutates the DOM, so we guard with
  // a data-flag attribute ("data-portrait-done") on the .lead-badge element.

  function _installObserver() {
    const ufBody = document.getElementById("ufBody");
    if (!ufBody) return; // not ready — caller ensures DOM is present

    // Observe subtree for added nodes (refreshUI replaces innerHTML entirely)
    const observer = new MutationObserver(function (mutations) {
      // Collect added nodes across all mutations this batch
      const toProcess = [];
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue; // elements only
          // Direct .lead-badge?
          if (node.classList && node.classList.contains("lead-badge")) {
            toProcess.push(node);
          }
          // .lead-badge inside a larger subtree added at once
          if (node.querySelectorAll) {
            for (const lb of node.querySelectorAll(".lead-badge")) {
              toProcess.push(lb);
            }
          }
        }
      }

      for (const badge of toProcess) {
        // Guard: already processed
        if (badge.hasAttribute("data-portrait-done")) continue;
        // Guard: already has a portrait img as first child
        if (badge.firstChild && badge.firstChild.tagName === "IMG") continue;

        // Get name from .lnm — text may have " ★" suffix, strip it
        const lnmEl = badge.querySelector(".lnm");
        if (!lnmEl) continue;
        const rawName = lnmEl.textContent || "";
        const leaderName = rawName.replace(/\s*★\s*$/, "").trim();
        if (!leaderName) continue;

        // Determine side and cmd from G.sel if available
        let side = "US";
        let isCmd = false;
        let isTintype = false;
        if (typeof G !== "undefined" && G.sel && G.sel.leader) {
          side     = G.sel.side || "US";
          isCmd    = !!(G.sel.leader.cmd);
          // Tintype variant for player's own line (campaign)
          isTintype = !!(typeof G !== "undefined" && G.campaign &&
                         G.sel.side === G.battle && G.battle && G.sel.side === G.battle.playerSide);
          // Simpler: tintype if player side
          if (typeof G !== "undefined" && G.battle) {
            isTintype = G.sel.side === G.battle.playerSide;
          }
        }

        // Mark as processed BEFORE DOM insertion to prevent re-entry
        badge.setAttribute("data-portrait-done", "1");

        // Generate portrait
        let dataURL;
        try {
          dataURL = portraitFor(leaderName, side, { cmd: isCmd, named: false, tintype: isTintype });
        } catch (e) {
          // Portrait generation must never crash the game
          continue;
        }

        // Build img element
        const img = document.createElement("img");
        img.src    = dataURL;
        img.width  = 48;
        img.height = 60;
        img.style.cssText = [
          "display:block",
          "float:left",
          "margin:0 7px 4px 0",
          "border:1px solid #9c7a3c",
          "border-radius:2px",
          "flex:none",
          "image-rendering:pixelated",
        ].join(";");
        img.alt    = leaderName;

        // Insert as first child of badge (before .lnm)
        badge.insertBefore(img, badge.firstChild);
      }
    });

    observer.observe(ufBody, {
      childList: true,
      subtree:   true,
    });
  }

  // Start observer only after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _installObserver);
  } else {
    _installObserver();
  }

})();
