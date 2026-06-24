/* ===========================================================================
   T16 — BATTLEFIELD ATMOSPHERICS  (Phase H · H3-i1 — "make it come to life")

   Procedural black-powder GUNSMOKE for the real-time tactical engine: the
   iconic Civil-War visual (the dense white pall that literally WAS the
   "fog of war" — a teaching tie-in), plus the artillery muzzle-belch and the
   dust kicked up where rounds strike home. Renders in BOTH the 2D fallback
   canvas and the live Three.js 3D scene.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   this module touches NO existing file. It WRAPS fld2dDraw / fld3dRender / fldExit
   by assignment (the T9-audio seam pattern) and reads firing/impact state
   READ-ONLY off the live units. It never writes a sim field, never calls fldRng
   (its own private LCG keeps combat determinism intact), and never bumps _SAVE_VER.
   So the sim tick (fldSimStep) and every battle baseline are unchanged — the only
   diff is pixels.

   ACCESSIBILITY / PERF: honors reduceMotion (no atmospherics at all under it —
   the established T5 convention) and a G.settings.atmospherics === "off" opt-out;
   the particle budget + the 3D point cloud both shrink on the fldLow() tier
   (the Intel UHD-617 floor). Fog-aware: a hidden enemy emits no smoke, so the
   effect can never betray a position the player has not scouted.
   =========================================================================== */

var FLDAT = {
  CAP_HI: 200, CAP_LO: 84,                 // live-particle ceiling per render tier
  RATE_ART: 16, RATE_INF: 9, RATE_DUST: 5, // emissions/sec while a unit is firing / under fire
  // per-kind colour (0..1 rgb): 0 = small-arms smoke, 1 = artillery belch, 2 = impact dust
  COL: [[0.85, 0.83, 0.79], [0.93, 0.92, 0.89], [0.69, 0.61, 0.46]],
  // per-kind spawn envelope: base height/jitter, rise + drift jitter, start/grow size, lifetime, alpha
  // rise (vy*) deliberately gentle so the pall hangs LOW over the field in 3D (where it reads against
  // terrain, not the bright sky); the 2D top-down path ignores y entirely, so vy* affects only 3D.
  SPEC: [
    { y0: 9,  yj: 9,  vy0: 7,  vyj: 6, vj: 8,  s0: 12, sj: 8,  s1: 42, life0: 2.4, life1: 3.6, a0: 0.26, aj: 0.10 },
    { y0: 11, yj: 9,  vy0: 10, vyj: 7, vj: 12, s0: 18, sj: 10, s1: 66, life0: 2.8, life1: 4.2, a0: 0.34, aj: 0.12 },
    { y0: 3,  yj: 5,  vy0: 4,  vyj: 5, vj: 10, s0: 9,  sj: 6,  s1: 26, life0: 1.1, life1: 1.9, a0: 0.20, aj: 0.10 }
  ]
};

/* ---- private RNG (LCG) — independent of fldRng so combat stays byte-identical ---- */
function fldAtmoRnd(A) {
  A.rs = (A.rs * 1664525 + 1013904223) % 4294967296;
  return A.rs / 4294967296;
}

/* ---- gates ---- */
function fldAtmoOff() {
  try {
    if (typeof fldReduceMotion === "function" && fldReduceMotion()) return true;
    if (typeof G !== "undefined" && G && G.settings && G.settings.atmospherics === "off") return true;
  } catch (e) {}
  return false;
}

/* ---- lazy per-battle state (cleared on fldExit) ---- */
function fldAtmoState() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.launched) return null;
  var A = __FIELD._atmo;
  if (!A) {
    var seed = (((__FIELD.seed || 0) >>> 0) || 123456789);
    A = { parts: [], rs: seed, last: 0, sprS: null, sprD: null,
          points: null, scene: null, geo: null, mat: null, tex: null,
          _pos: null, _al: null, _sz: null, _col: null, _cap: FLDAT.CAP_HI,
          wind: { x: 5, z: 2 } };
    var r0 = fldAtmoRnd(A), r1 = fldAtmoRnd(A);
    A.wind = { x: 5 + (r0 - 0.5) * 12, z: 2 + (r1 - 0.5) * 8 };   // a gentle per-battle drift
    __FIELD._atmo = A;
  }
  return A;
}

/* ---- per-frame wall-clock delta (so smoke drifts/clears even while paused) ---- */
function fldAtmoTick(A) {
  var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : 0;
  var dt = A.last ? (now - A.last) / 1000 : 0;
  A.last = now;
  if (!(dt > 0)) dt = 0;
  if (dt > 0.1) dt = 0.1;     // clamp tab-switch / settle spikes
  return dt;
}

/* ---- particle alpha/size over its life (quick fade-in, linear fade-out, smoke expands) ---- */
function fldAtmoAlpha(q) {
  var frac = q.age / q.life;
  if (frac >= 1) return 0;
  var fadeIn = q.age < 0.18 ? (q.age / 0.18) : 1;
  var a = q.a0 * (1 - frac) * fadeIn;
  return a > 0 ? a : 0;
}
function fldAtmoSize(q) {
  var frac = q.age / q.life; if (frac < 0) frac = 0; if (frac > 1) frac = 1;
  return q.s0 + (q.s1 - q.s0) * frac;
}

/* ---- emit one puff at a firing/struck unit ---- */
function fldAtmoEmit(A, u, kind) {
  var sp = FLDAT.SPEC[kind]; if (!sp) return;
  var jx = (fldAtmoRnd(A) - 0.5) * 46, jz = (fldAtmoRnd(A) - 0.5) * 30;
  var fwd = kind === 2 ? 0 : 18;   // small-arms/art smoke billows a touch forward; dust at the feet
  var fx = u.x + Math.sin(u.facing) * fwd + jx;
  var fz = u.z - Math.cos(u.facing) * fwd + jz;
  if (!isFinite(fx) || !isFinite(fz)) return;
  A.parts.push({
    x: fx, z: fz, y: sp.y0 + fldAtmoRnd(A) * sp.yj,
    vx: A.wind.x + (fldAtmoRnd(A) - 0.5) * sp.vj,
    vz: A.wind.z + (fldAtmoRnd(A) - 0.5) * sp.vj,
    vy: sp.vy0 + fldAtmoRnd(A) * sp.vyj,
    age: 0, life: sp.life0 + fldAtmoRnd(A) * (sp.life1 - sp.life0),
    s0: sp.s0 + fldAtmoRnd(A) * sp.sj, s1: sp.s1, a0: sp.a0 + fldAtmoRnd(A) * sp.aj, kind: kind
  });
}

/* ---- advance the shared particle field: age + compact, then spawn from live fire ---- */
function fldAtmoStep(A, dt) {
  // age + in-place compaction (drop dead, no allocation)
  var p = A.parts, w = 0;
  for (var i = 0; i < p.length; i++) {
    var q = p[i]; q.age += dt;
    if (q.age >= q.life) continue;
    q.x += q.vx * dt; q.z += q.vz * dt; q.y += q.vy * dt; q.vy *= 0.992;
    if (w !== i) p[w] = q;
    w++;
  }
  p.length = w;
  // spawn only while the battle is actually being fought
  if (__FIELD.phase !== "battle" || __FIELD.paused) return;
  if (fldAtmoOff()) { p.length = 0; return; }
  var cap = (typeof fldLow === "function" && fldLow()) ? FLDAT.CAP_LO : FLDAT.CAP_HI;
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  var fog = __FIELD.fog, U = __FIELD.units;
  for (var k = 0; k < U.length; k++) {
    if (p.length >= cap) break;
    var u = U[k]; if (!u || !u.alive) continue;
    if (fog && u.side !== ps && typeof fldVisible === "function" && !fldVisible(ps, u)) continue;  // never reveal a hidden foe
    if (u._artFlash > 0) { if (fldAtmoRnd(A) < FLDAT.RATE_ART * dt) fldAtmoEmit(A, u, 1); }
    else if (u.targetId && u.ammo > 0 && u.state !== "routing") { if (fldAtmoRnd(A) < FLDAT.RATE_INF * dt) fldAtmoEmit(A, u, 0); }
    if (u.underFire > 0 && p.length < cap && fldAtmoRnd(A) < FLDAT.RATE_DUST * dt) fldAtmoEmit(A, u, 2);
  }
}

/* ===========================================================================
   2D FALLBACK — cached soft sprites stamped with per-particle alpha (fast fillrate)
   =========================================================================== */
function fldAtmoMakeSprite2d(kind) {
  var c = document.createElement("canvas"); c.width = 64; c.height = 64;
  var g = c.getContext("2d"); var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (kind === 2) {
    grd.addColorStop(0, "rgba(176,158,120,0.95)"); grd.addColorStop(0.5, "rgba(176,158,120,0.45)"); grd.addColorStop(1, "rgba(176,158,120,0)");
  } else {
    grd.addColorStop(0, "rgba(232,228,219,0.95)"); grd.addColorStop(0.45, "rgba(226,222,212,0.5)"); grd.addColorStop(1, "rgba(220,216,206,0)");
  }
  g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 32, 0, 7); g.fill();
  return c;
}
function fldAtmoDraw2d(ctx, v) {
  if (!ctx || !v) return;
  var A = fldAtmoState(); if (!A) return;
  fldAtmoStep(A, fldAtmoTick(A));
  if (fldAtmoOff() || !A.parts.length) return;
  if (!A.sprS) { A.sprS = fldAtmoMakeSprite2d(0); A.sprD = fldAtmoMakeSprite2d(2); }
  var prev = ctx.globalAlpha;
  for (var i = 0; i < A.parts.length; i++) {
    var q = A.parts[i], a = fldAtmoAlpha(q); if (a <= 0.01) continue;
    var sx = v.ox + q.x * v.s, sy = v.oz + q.z * v.s, r = fldAtmoSize(q) * v.s;
    if (!isFinite(sx) || !isFinite(sy) || !(r > 0)) continue;
    ctx.globalAlpha = a > 1 ? 1 : a;
    ctx.drawImage(q.kind === 2 ? A.sprD : A.sprS, sx - r, sy - r, r * 2, r * 2);
  }
  ctx.globalAlpha = prev;
}

/* ===========================================================================
   3D — one THREE.Points cloud, a tiny per-particle alpha/size/colour shader
   =========================================================================== */
function fldAtmoTexture(T) {
  var c = document.createElement("canvas"); c.width = 64; c.height = 64;
  var g = c.getContext("2d"); var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.45, "rgba(255,255,255,0.55)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 32, 0, 7); g.fill();
  // draw BEFORE wrapping as a CanvasTexture so the image is never "undefined" (the probe fails on that warning)
  var tex = new T.CanvasTexture(c); tex.needsUpdate = true;
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = false;
  return tex;
}
function fldAtmoDisposeGpu(A) {
  try {
    if (A.points && A.points.parent) A.points.parent.remove(A.points);
    if (A.geo && A.geo.dispose) A.geo.dispose();
    if (A.mat && A.mat.dispose) A.mat.dispose();
    if (A.tex && A.tex.dispose) A.tex.dispose();
  } catch (e) {}
  A.points = null; A.geo = null; A.mat = null; A.tex = null; A.scene = null;
  A._pos = null; A._al = null; A._sz = null; A._col = null;
}
function fldAtmoBuild3d() {
  var T = window.THREE; if (!T || !__FIELD.scene) return null;
  var A = fldAtmoState(); if (!A) return null;
  if (A.points && A.scene === __FIELD.scene) return A;
  fldAtmoDisposeGpu(A);   // fresh scene (new battle) — drop any stale buffers
  var cap = FLDAT.CAP_HI;
  var pos = new Float32Array(cap * 3), al = new Float32Array(cap), sz = new Float32Array(cap), col = new Float32Array(cap * 3);
  var geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(pos, 3));
  geo.setAttribute("aAlpha", new T.BufferAttribute(al, 1));
  geo.setAttribute("aSize", new T.BufferAttribute(sz, 1));
  geo.setAttribute("aCol", new T.BufferAttribute(col, 3));
  geo.setDrawRange(0, cap);
  // clamp gl_PointSize to the driver's reported cap so near-camera puffs render uniformly on the
  // Intel UHD-617 floor (ALIASED_POINT_SIZE_RANGE can be as low as 64/255 there — a worst-case art
  // puff computes ~924px). Without the clamp the driver clamps silently; making it explicit keeps the
  // density behaviour identical across GPUs. Benign either way (a smaller point = less fillrate).
  var maxPt = 256;
  try {
    var _gl = __FIELD.renderer && __FIELD.renderer.getContext && __FIELD.renderer.getContext();
    var _r = _gl && _gl.getParameter && _gl.getParameter(_gl.ALIASED_POINT_SIZE_RANGE);
    if (_r && _r[1] > 0) maxPt = _r[1];
  } catch (e) {}
  var mat = new T.ShaderMaterial({
    uniforms: { uMap: { value: fldAtmoTexture(T) }, uMaxPoint: { value: maxPt } },
    vertexShader: [
      "attribute float aAlpha;", "attribute float aSize;", "attribute vec3 aCol;",
      "uniform float uMaxPoint;",
      "varying float vAlpha;", "varying vec3 vCol;",
      "void main(){",
      "  vAlpha = aAlpha; vCol = aCol;",
      "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
      "  gl_PointSize = min(uMaxPoint, aSize * (560.0 / max(40.0, -mv.z)));",
      "  gl_Position = projectionMatrix * mv;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D uMap;",
      "varying float vAlpha;", "varying vec3 vCol;",
      "void main(){",
      "  if (vAlpha <= 0.001) discard;",
      "  vec4 tx = texture2D(uMap, gl_PointCoord);",
      "  float a = tx.a * vAlpha;",
      "  if (a < 0.004) discard;",
      "  gl_FragColor = vec4(vCol, a);",
      "}"
    ].join("\n"),
    transparent: true, depthWrite: false, depthTest: true, blending: T.NormalBlending
  });
  var pts = new T.Points(geo, mat);
  pts.name = "atmoSmoke"; pts.frustumCulled = false;   // positions are dynamic — skip the auto bounding-sphere
  __FIELD.scene.add(pts);
  A.tex = mat.uniforms.uMap.value; A.geo = geo; A.mat = mat; A.points = pts; A.scene = __FIELD.scene;
  A._pos = pos; A._al = al; A._sz = sz; A._col = col; A._cap = cap;
  return A;
}
function fldAtmoPre3d() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.launched) return;
  if (!window.THREE || !__FIELD.scene) return;
  var A = fldAtmoBuild3d(); if (!A || !A.points) return;
  fldAtmoStep(A, fldAtmoTick(A));
  var cap = A._cap, n = fldAtmoOff() ? 0 : Math.min(A.parts.length, cap);
  var p = A.parts, pos = A._pos, al = A._al, sz = A._sz, col = A._col;
  for (var i = 0; i < n; i++) {
    var q = p[i], a = fldAtmoAlpha(q);
    var yt = (typeof fldTerrainH === "function") ? fldTerrainH(q.x, q.z) : 0;
    pos[3 * i] = q.x; pos[3 * i + 1] = yt + q.y; pos[3 * i + 2] = q.z;
    // 3D-only density lift: the translucent white pall reads faint at the default far camera, so
    // boost opacity here (the 2D path keeps fldAtmoAlpha untouched — it already renders dense top-down)
    al[i] = a < 0 ? 0 : Math.min(0.9, a * 1.6); sz[i] = fldAtmoSize(q);
    var c = FLDAT.COL[q.kind] || FLDAT.COL[0];
    col[3 * i] = c[0]; col[3 * i + 1] = c[1]; col[3 * i + 2] = c[2];
  }
  for (var j = n; j < cap; j++) { al[j] = 0; sz[j] = 0; }
  A.geo.attributes.position.needsUpdate = true;
  A.geo.attributes.aAlpha.needsUpdate = true;
  A.geo.attributes.aSize.needsUpdate = true;
  A.geo.attributes.aCol.needsUpdate = true;
}

/* ---- teardown: drop GPU buffers + the particle field on battle exit ---- */
function fldAtmoDispose() {
  try {
    var A = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD._atmo : null;
    if (A) { fldAtmoDisposeGpu(A); A.parts.length = 0; }
    if (typeof __FIELD !== "undefined" && __FIELD) __FIELD._atmo = null;
  } catch (e) {}
}

/* ===========================================================================
   WIRE-IN — wrap the two renderers + exit by ASSIGNMENT (no combat file touched).
   The bare-name bindings are reassigned here (T16 loads after T0); callers using
   the bare name resolve the wrapper at call time, exactly like T9-audio.
   =========================================================================== */
(function () {
  if (typeof fld2dDraw === "function" && !fld2dDraw._atmo) {
    var _o2 = fld2dDraw;
    fld2dDraw = function () { var r = _o2.apply(this, arguments); try { fldAtmoDraw2d(__FIELD.ctx2d, fld2dView()); } catch (e) {} return r; };
    fld2dDraw._atmo = true;
  }
  if (typeof fld3dRender === "function" && !fld3dRender._atmo) {
    var _o3 = fld3dRender;
    fld3dRender = function () { try { fldAtmoPre3d(); } catch (e) {} return _o3.apply(this, arguments); };
    fld3dRender._atmo = true;
  }
  if (typeof fldExit === "function" && !fldExit._atmo) {
    var _oe = fldExit;
    fldExit = function () { try { fldAtmoDispose(); } catch (e) {} return _oe.apply(this, arguments); };
    fldExit._atmo = true;
  }
})();
