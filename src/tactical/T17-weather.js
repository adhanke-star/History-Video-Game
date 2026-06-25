/* ===========================================================================
   T17 — WEATHER & TIME-OF-DAY ATMOSPHERE  (Phase H · H3-i2 — "make it come to life")

   Gives each battle a sky and light that match its history: Fredericksburg's
   cold Rappahannock fog, Gettysburg's hot July haze, Antietam's dawn mist, a
   grey rain-soaked field. Procedural, code-only, offline. Re-tints the 3D
   scene's background / fog / sun / hemisphere and washes the 2D canvas to the
   resolved {sky, time}, plus optional procedural rain/snow precipitation (a
   second THREE.Points cloud reusing the T16 pattern). A short, accessible
   atmosphere note is announced once at battle start.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   this module touches NO existing file. It WRAPS fld3dInit / fld3dRender /
   fld2dDraw / fldExit by ASSIGNMENT (the T9-audio / T16 seam pattern) and reads
   ONLY the scenario's structured `weather` hint + render state. It never writes a
   sim field, never calls fldRng (its own private LCG for the precipitation drift),
   and never bumps _SAVE_VER. So the sim tick and every battle baseline are
   unchanged — the only diff is pixels.

   THE BYTE-IDENTICAL DEFAULT: a scenario with NO `weather` hint — or a hint that
   resolves to clear/midday — produces NO change at all (fldWxResolve returns null
   and every seam early-returns), so every currently-shipped look is preserved
   exactly until a battle opts in with a citation-grade hint.

   ACCESSIBILITY / PERF (Intel UHD-617 floor): the static sky/light TINT is faithful
   and motion-free, so it applies under reduceMotion; only the PRECIPITATION (motion)
   is suppressed under reduceMotion. A G.settings.weather === "off" opt-out disables
   the whole layer (back to the clear default). The fog far-plane is held >= ~1500 so
   the objective + units never vanish; precipitation is one THREE.Points cloud (single
   draw call) with a driver gl_PointSize clamp and a smaller budget on fldLow().
   The tint is a neutral atmospheric wash (no colour-encoded info → CVD-safe).
   =========================================================================== */

var FLDWX = {
  PRECIP_HI: 520, PRECIP_LO: 200,          // falling-particle ceiling per render tier
  TIME_SET: ["dawn", "morning", "midday", "afternoon", "dusk"],
  // per-sky base atmosphere. "clear" mirrors the engine default (fld3dInit) and is the no-op
  // baseline — it is NEVER applied (clear/midday resolves to null). fog near/far are camera
  // distances; far is kept >= ~1500 so the field-centre objective stays readable.
  SKY: {
    clear:    { bg: "#acc2d6", fog: "#acc2d6", near: 700, far: 1900, sun: "#fff2d0", sunI: 1.15, hemiS: "#dceaff", hemiG: "#5a4a32", hemiI: 0.72, wash: null,      washA: 0.00, precip: null },
    overcast: { bg: "#b8c0c5", fog: "#b8c0c5", near: 640, far: 1800, sun: "#e9e7dd", sunI: 0.80, hemiS: "#cfd3d4", hemiG: "#544a3b", hemiI: 0.66, wash: "#8d99a3", washA: 0.10, precip: null },
    rain:     { bg: "#8f989d", fog: "#939a9e", near: 480, far: 1550, sun: "#cdd1d0", sunI: 0.55, hemiS: "#b3b8ba", hemiG: "#4c463c", hemiI: 0.56, wash: "#3f4a54", washA: 0.18, precip: "rain" },
    fog:      { bg: "#ced3d2", fog: "#d4d8d6", near: 340, far: 1550, sun: "#ece8dd", sunI: 0.72, hemiS: "#d9dcd9", hemiG: "#5a5446", hemiI: 0.72, wash: "#ced2cf", washA: 0.20, precip: null },
    haze:     { bg: "#c2cdd0", fog: "#c8cfcf", near: 600, far: 1800, sun: "#fff0cf", sunI: 1.04, hemiS: "#e3e6e0", hemiG: "#5a4e36", hemiI: 0.74, wash: "#d8d0a8", washA: 0.09, precip: null },
    snow:     { bg: "#d6dbdd", fog: "#dfe2e1", near: 420, far: 1600, sun: "#eef0ef", sunI: 0.76, hemiS: "#e2e6e6", hemiG: "#6a6660", hemiI: 0.66, wash: "#dce2e4", washA: 0.16, precip: "snow" }
  }
};

/* ---- module-level state (precip GPU buffers + the per-launch note flag) ---- */
var FLDWX_S = { scene: null, points: null, geo: null, mat: null, tex: null,
                _pos: null, _al: null, _sz: null, parts: null, rs: 0, last: 0,
                kind: null, launchKey: null, noted: false };

/* ---- private RNG (LCG) — independent of fldRng so combat stays byte-identical ---- */
function fldWxRnd() {
  FLDWX_S.rs = (FLDWX_S.rs * 1664525 + 1013904223) % 4294967296;
  return FLDWX_S.rs / 4294967296;
}

/* ---- hex helpers (blend two #rrggbb toward t in [0,1]) ---- */
function _wxHex(h) {
  h = String(h || "#000000").replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var n = parseInt(h, 16); if (!isFinite(n)) n = 0;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function _wxToHex(r, g, b) {
  function c(v) { v = Math.round(v); if (v < 0) v = 0; if (v > 255) v = 255; var s = v.toString(16); return s.length < 2 ? "0" + s : s; }
  return "#" + c(r) + c(g) + c(b);
}
function _wxBlend(a, b, t) {
  if (t <= 0) return a; if (t >= 1) return b;
  var A = _wxHex(a), B = _wxHex(b);
  return _wxToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

/* ---- time-of-day modifier: warm the afternoon/dawn/dusk, cool/soften the morning, drop a low sun.
   Each non-midday time gives even a CLEAR sky a real (if subtle) shift + a faint matching 2D wash, so
   a hot-bright afternoon (Gettysburg) reads warm and a spring morning (Shiloh) reads cool. ---- */
function _wxApplyTime(p, time) {
  var W = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_W : 1200;
  var H = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_H : 900;
  if (time === "dawn") {
    p.sun = _wxBlend(p.sun, "#ffd6a6", 0.60); p.sunI *= 0.85;
    p.bg = _wxBlend(p.bg, "#e0bd98", 0.20); p.fog = _wxBlend(p.fog, "#e0bd98", 0.16);
    p.hemiG = _wxBlend(p.hemiG, "#6e5230", 0.35);
    p.wash = p.wash ? _wxBlend(p.wash, "#ffcf9c", 0.35) : "#ffcf9c"; p.washA = Math.max(p.washA, 0.10);
    p.sunPos = [W * 0.62, 360, H * 0.50];
  } else if (time === "dusk") {
    p.sun = _wxBlend(p.sun, "#ffbe84", 0.60); p.sunI *= 0.80;
    p.bg = _wxBlend(p.bg, "#caa089", 0.22); p.fog = _wxBlend(p.fog, "#caa089", 0.18);
    p.hemiG = _wxBlend(p.hemiG, "#5a3c22", 0.30);
    p.wash = p.wash ? _wxBlend(p.wash, "#ffae7a", 0.30) : "#ffae7a"; p.washA = Math.max(p.washA, 0.12);
    p.sunPos = [-W * 0.30, 320, -H * 0.20];
  } else if (time === "morning") {
    p.sun = _wxBlend(p.sun, "#fdf4e0", 0.20); p.sunI *= 0.92;
    p.bg = _wxBlend(p.bg, "#c4d6e6", 0.08); p.fog = _wxBlend(p.fog, "#c4d6e6", 0.06);
    p.wash = p.wash ? _wxBlend(p.wash, "#cfe0ee", 0.25) : "#cfe0ee"; if (!(p.washA > 0)) p.washA = 0.05;
    p.sunPos = [W * 0.35, 760, H * 0.35];
  } else if (time === "afternoon") {
    p.sun = _wxBlend(p.sun, "#ffe2ab", 0.30); p.sunI *= 0.98;
    p.bg = _wxBlend(p.bg, "#c8cabf", 0.06); p.fog = _wxBlend(p.fog, "#c8cabf", 0.05);
    p.hemiG = _wxBlend(p.hemiG, "#6a5430", 0.20);
    p.wash = p.wash ? _wxBlend(p.wash, "#ffdca0", 0.25) : "#ffdca0"; if (!(p.washA > 0)) p.washA = 0.06;
    p.sunPos = [-W * 0.15, 820, -H * 0.10];
  }
  // midday: no further change (clear/midday already resolved to null before this runs)
  return p;
}

/* ---- resolve the active weather to a merged palette (or null = byte-identical default) ---- */
function fldWxResolve() {
  try {
    if (typeof G !== "undefined" && G && G.settings && G.settings.weather === "off") return null;
    if (typeof __FIELD === "undefined" || !__FIELD) return null;
    var raw = (__FIELD._scenTop && __FIELD._scenTop.weather) || (__FIELD.scenData && __FIELD.scenData.weather) || null;
    if (!raw || typeof raw !== "object") return null;
    // hasOwnProperty (not `FLDWX.SKY[sky]`) so an inherited member name ("constructor"/"__proto__"/
    // "hasOwnProperty") can't masquerade as a valid sky and yield a palette with no .bg.
    var sky = String(raw.sky || "clear").toLowerCase(); if (!Object.prototype.hasOwnProperty.call(FLDWX.SKY, sky)) sky = "clear";
    var time = String(raw.time || "midday").toLowerCase(); if (FLDWX.TIME_SET.indexOf(time) < 0) time = "midday";
    if (sky === "clear" && time === "midday") return null;   // == today's exact look -> no-op (byte-identical)
    var base = FLDWX.SKY[sky], p = {
      bg: base.bg, fog: base.fog, near: base.near, far: base.far, sun: base.sun, sunI: base.sunI,
      hemiS: base.hemiS, hemiG: base.hemiG, hemiI: base.hemiI, wash: base.wash, washA: base.washA,
      precip: base.precip, sunPos: null
    };
    _wxApplyTime(p, time);
    return { sky: sky, time: time, note: (typeof raw.note === "string" ? raw.note : ""), palette: p };
  } catch (e) { return null; }
}

/* ---- the per-launch identity for the once-per-battle note. MUST be a value that is STABLE across the
   battle: __FIELD.scenario (the scenario id) qualifies; __FIELD.seed does NOT (fldRng mutates it every sim
   tick, which would reset the note flag every frame → the banner would re-fire continuously). fldExit also
   resets the flag, so a relaunch of the same scenario shows the note once again. ---- */
function _wxLaunchKey() {
  try { return (typeof __FIELD !== "undefined" && __FIELD) ? (__FIELD.scenario || "?") : null; } catch (e) { return null; }
}

/* ===========================================================================
   3D — re-tint the scene AFTER fld3dInit set its defaults (idempotent property writes)
   =========================================================================== */
function fldWxApply3d() {
  var wx = fldWxResolve(); if (!wx) return;
  var T = window.THREE; if (!T) return;
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene) return;
  var sc = __FIELD.scene, p = wx.palette;
  try {
    if (sc.background && sc.background.set) sc.background.set(p.bg); else sc.background = new T.Color(p.bg);
    if (sc.fog) { sc.fog.color.set(p.fog); sc.fog.near = p.near; sc.fog.far = p.far; }
    sc.traverse(function (o) {
      if (!o) return;
      if (o.isDirectionalLight) { o.color.set(p.sun); o.intensity = p.sunI; if (p.sunPos) o.position.set(p.sunPos[0], p.sunPos[1], p.sunPos[2]); }
      else if (o.isHemisphereLight) { o.color.set(p.hemiS); if (o.groundColor) o.groundColor.set(p.hemiG); o.intensity = p.hemiI; }
    });
  } catch (e) {}
}

/* ---- precipitation texture: a streak for rain, a soft round flake for snow ---- */
function fldWxPrecipTexture(T, kind) {
  var c = document.createElement("canvas"); c.width = 32; c.height = 64;
  var g = c.getContext("2d");
  if (kind === "rain") {
    var grd = g.createLinearGradient(16, 0, 16, 64);
    grd.addColorStop(0, "rgba(255,255,255,0)"); grd.addColorStop(0.5, "rgba(255,255,255,0.9)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(13, 0, 6, 64);
  } else {
    var rg = g.createRadialGradient(16, 32, 0, 16, 32, 16);
    rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.5, "rgba(255,255,255,0.6)"); rg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rg; g.beginPath(); g.arc(16, 32, 16, 0, 7); g.fill();
  }
  var tex = new T.CanvasTexture(c); tex.needsUpdate = true;   // draw BEFORE wrap (the T16 texture-warning lesson)
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = false;
  return tex;
}
function fldWxDisposePrecip() {
  try {
    if (FLDWX_S.points && FLDWX_S.points.parent) FLDWX_S.points.parent.remove(FLDWX_S.points);
    if (FLDWX_S.geo && FLDWX_S.geo.dispose) FLDWX_S.geo.dispose();
    if (FLDWX_S.mat && FLDWX_S.mat.dispose) FLDWX_S.mat.dispose();
    if (FLDWX_S.tex && FLDWX_S.tex.dispose) FLDWX_S.tex.dispose();
  } catch (e) {}
  FLDWX_S.points = null; FLDWX_S.geo = null; FLDWX_S.mat = null; FLDWX_S.tex = null;
  FLDWX_S.scene = null; FLDWX_S._pos = null; FLDWX_S._al = null; FLDWX_S._sz = null; FLDWX_S.parts = null; FLDWX_S.kind = null;
}
function fldWxBuildPrecip(kind) {
  var T = window.THREE; if (!T || !__FIELD.scene) return false;
  if (FLDWX_S.points && FLDWX_S.scene === __FIELD.scene && FLDWX_S.kind === kind) return true;
  fldWxDisposePrecip();
  var W = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_W : 1200;
  var H = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_H : 900;
  var cap = (typeof fldLow === "function" && fldLow()) ? FLDWX.PRECIP_LO : FLDWX.PRECIP_HI;
  var rain = (kind === "rain");
  // seed the drift LCG from the field seed (deterministic per battle, never fldRng)
  FLDWX_S.rs = (((__FIELD.seed || 0) >>> 0) ^ 0x5bd1e995) >>> 0; if (!FLDWX_S.rs) FLDWX_S.rs = 987654321;
  var parts = new Array(cap);
  var marginX = W * 0.55, marginZ = H * 0.55, topY = 1000;
  for (var i = 0; i < cap; i++) {
    parts[i] = {
      x: -marginX + fldWxRnd() * (W + marginX * 2),
      z: -marginZ + fldWxRnd() * (H + marginZ * 2),
      y: fldWxRnd() * topY,
      vy: rain ? -(620 + fldWxRnd() * 220) : -(70 + fldWxRnd() * 55),
      vx: rain ? (30 + fldWxRnd() * 30) : (fldWxRnd() - 0.5) * 60,
      vz: rain ? (10 + fldWxRnd() * 20) : (fldWxRnd() - 0.5) * 50,
      ph: fldWxRnd() * 6.28,
      sz: rain ? (10 + fldWxRnd() * 8) : (7 + fldWxRnd() * 7)
    };
  }
  var pos = new Float32Array(cap * 3), al = new Float32Array(cap), sz = new Float32Array(cap);
  var geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(pos, 3));
  geo.setAttribute("aAlpha", new T.BufferAttribute(al, 1));
  geo.setAttribute("aSize", new T.BufferAttribute(sz, 1));
  geo.setDrawRange(0, cap);
  var maxPt = 256;
  try {
    var _gl = __FIELD.renderer && __FIELD.renderer.getContext && __FIELD.renderer.getContext();
    var _r = _gl && _gl.getParameter && _gl.getParameter(_gl.ALIASED_POINT_SIZE_RANGE);
    if (_r && _r[1] > 0) maxPt = _r[1];
  } catch (e) {}
  var col = rain ? "vec3(0.78,0.82,0.86)" : "vec3(0.96,0.97,0.98)";
  var mat = new T.ShaderMaterial({
    uniforms: { uMap: { value: fldWxPrecipTexture(T, kind) }, uMaxPoint: { value: maxPt } },
    vertexShader: [
      "attribute float aAlpha;", "attribute float aSize;",
      "uniform float uMaxPoint;",
      "varying float vAlpha;",
      "void main(){",
      "  vAlpha = aAlpha;",
      "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
      "  gl_PointSize = min(uMaxPoint, aSize * (560.0 / max(40.0, -mv.z)));",
      "  gl_Position = projectionMatrix * mv;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform sampler2D uMap;",
      "varying float vAlpha;",
      "void main(){",
      "  if (vAlpha <= 0.001) discard;",
      "  vec4 tx = texture2D(uMap, gl_PointCoord);",
      "  float a = tx.a * vAlpha;",
      "  if (a < 0.004) discard;",
      "  gl_FragColor = vec4(" + col + ", a);",
      "}"
    ].join("\n"),
    transparent: true, depthWrite: false, depthTest: true, blending: T.NormalBlending
  });
  var pts = new T.Points(geo, mat);
  pts.name = "wxPrecip"; pts.frustumCulled = false;
  __FIELD.scene.add(pts);
  FLDWX_S.tex = mat.uniforms.uMap.value; FLDWX_S.geo = geo; FLDWX_S.mat = mat; FLDWX_S.points = pts;
  FLDWX_S.scene = __FIELD.scene; FLDWX_S._pos = pos; FLDWX_S._al = al; FLDWX_S._sz = sz; FLDWX_S.parts = parts; FLDWX_S.kind = kind;
  return true;
}
/* ---- per-frame wall-clock delta (drift continues even while the sim is paused) ---- */
function fldWxDt() {
  var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : 0;
  var dt = FLDWX_S.last ? (now - FLDWX_S.last) / 1000 : 0;
  FLDWX_S.last = now; if (!(dt > 0)) dt = 0; if (dt > 0.1) dt = 0.1; return dt;
}
function fldWxPre3d() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.launched) return;
  if (!window.THREE || !__FIELD.scene) return;
  var wx = fldWxResolve();
  // precipitation is MOTION: suppressed under reduceMotion (the static tint already conveys "rain"/"snow")
  var wantPrecip = wx && wx.palette.precip && !(typeof fldReduceMotion === "function" && fldReduceMotion());
  if (!wantPrecip) { if (FLDWX_S.points) fldWxDisposePrecip(); return; }
  if (!fldWxBuildPrecip(wx.palette.precip)) return;
  var dt = fldWxDt(), parts = FLDWX_S.parts, pos = FLDWX_S._pos, al = FLDWX_S._al, sz = FLDWX_S._sz;
  var W = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_W : 1200;
  var H = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_H : 900;
  var marginX = W * 0.55, marginZ = H * 0.55, topY = 1000, rain = (FLDWX_S.kind === "rain");
  for (var i = 0; i < parts.length; i++) {
    var q = parts[i];
    q.y += q.vy * dt; q.x += q.vx * dt; q.z += q.vz * dt;
    if (!rain) { q.ph += dt * 1.6; q.x += Math.sin(q.ph) * 14 * dt; }   // snow sways
    var yt = (typeof fldTerrainH === "function") ? fldTerrainH(q.x, q.z) : 0;
    if (q.y <= yt) { q.y += topY; q.x = -marginX + fldWxRnd() * (W + marginX * 2); q.z = -marginZ + fldWxRnd() * (H + marginZ * 2); }
    pos[3 * i] = q.x; pos[3 * i + 1] = yt + q.y; pos[3 * i + 2] = q.z;
    al[i] = rain ? 0.5 : 0.8; sz[i] = q.sz;
  }
  FLDWX_S.geo.attributes.position.needsUpdate = true;
  FLDWX_S.geo.attributes.aAlpha.needsUpdate = true;
  FLDWX_S.geo.attributes.aSize.needsUpdate = true;
}

/* ===========================================================================
   2D FALLBACK — an atmospheric wash over the field + a light precip hatch (rm-off)
   =========================================================================== */
function fldWxDraw2d(ctx, v) {
  if (!ctx || !v) return;
  var wx = fldWxResolve(); if (!wx) return;
  var p = wx.palette, W = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_W : 1200, H = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_H : 900;
  var fx = v.ox, fz = v.oz, fw = W * v.s, fh = H * v.s;
  if (!(fw > 0) || !(fh > 0)) return;
  var prevA = ctx.globalAlpha;
  if (p.wash && p.washA > 0) { ctx.globalAlpha = p.washA; ctx.fillStyle = p.wash; ctx.fillRect(fx, fz, fw, fh); }
  // precipitation hatch (MOTION) — suppressed under reduceMotion
  if (p.precip && !(typeof fldReduceMotion === "function" && fldReduceMotion())) {
    var rain = (p.precip === "rain");
    var n = (typeof fldLow === "function" && fldLow()) ? 60 : 130;
    var t = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.t : 0;
    var scroll = (t * (rain ? 760 : 90)) % (fh + 80);
    ctx.save();
    ctx.beginPath(); ctx.rect(fx, fz, fw, fh); ctx.clip();
    ctx.globalAlpha = rain ? 0.32 : 0.6;
    ctx.strokeStyle = rain ? "rgba(214,224,230,0.9)" : "rgba(246,248,250,0.95)";
    ctx.fillStyle = "rgba(248,250,252,0.95)"; ctx.lineWidth = 1;
    for (var i = 0; i < n; i++) {
      // a stable pseudo-random column per i, scrolled down by time (deterministic, no LCG state churn in draw)
      var fr = ((i * 2654435761) % 100000) / 100000;
      var fr2 = ((i * 40503) % 100000) / 100000;
      var px = fx + fr * fw;
      var py = fz + ((fr2 * (fh + 80) + scroll) % (fh + 80)) - 40;
      if (rain) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 3, py + 13); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(px + Math.sin((py + i) * 0.05) * 6, py, 1.6, 0, 7); ctx.fill(); }
    }
    ctx.restore();
  }
  ctx.globalAlpha = prevA;
}

/* ---- one-time accessible atmosphere note (a transient role=status banner) ---- */
function fldWxNote() {
  try {
    var wx = fldWxResolve(); if (!wx || !wx.note) return;
    var key = _wxLaunchKey();
    if (FLDWX_S.launchKey !== key) { FLDWX_S.launchKey = key; FLDWX_S.noted = false; }
    if (FLDWX_S.noted) return;
    if (!document.getElementById("fldRoot")) return;
    if (typeof fldScenarioBanner === "function") fldScenarioBanner(wx.note, null);   // role=status -> SR + visible
    FLDWX_S.noted = true;
  } catch (e) {}
}

/* ---- teardown: drop the precip GPU buffers + reset the note flag on battle exit ---- */
function fldWxDispose() {
  try { fldWxDisposePrecip(); FLDWX_S.noted = false; FLDWX_S.launchKey = null; FLDWX_S.last = 0; } catch (e) {}
}

/* ===========================================================================
   WIRE-IN — wrap fld3dInit (re-tint), fld3dRender (precip + note), fld2dDraw
   (wash + note) + fldExit (dispose) by ASSIGNMENT. No combat file is touched;
   the bare-name bindings resolve the wrapper at call time (T17 loads after T0/T16).
   =========================================================================== */
(function () {
  if (typeof fld3dInit === "function" && !fld3dInit._wx) {
    var _oi = fld3dInit;
    fld3dInit = function () { var r = _oi.apply(this, arguments); try { fldWxApply3d(); } catch (e) {} return r; };
    fld3dInit._wx = true;
  }
  if (typeof fld3dRender === "function" && !fld3dRender._wx) {
    var _or = fld3dRender;
    fld3dRender = function () { try { fldWxPre3d(); } catch (e) {} var r = _or.apply(this, arguments); try { fldWxNote(); } catch (e) {} return r; };
    fld3dRender._wx = true; fld3dRender._atmo = _or._atmo;   // keep the T16 marker transitive (the wrapper chain is intact)
  }
  if (typeof fld2dDraw === "function" && !fld2dDraw._wx) {
    var _od = fld2dDraw;
    fld2dDraw = function () { var r = _od.apply(this, arguments); try { fldWxDraw2d(__FIELD.ctx2d, fld2dView()); } catch (e) {} try { fldWxNote(); } catch (e) {} return r; };
    fld2dDraw._wx = true; fld2dDraw._atmo = _od._atmo;
  }
  if (typeof fldExit === "function" && !fldExit._wx) {
    var _oe = fldExit;
    fldExit = function () { try { fldWxDispose(); } catch (e) {} return _oe.apply(this, arguments); };
    fldExit._wx = true; fldExit._atmo = _oe._atmo;
  }
})();
