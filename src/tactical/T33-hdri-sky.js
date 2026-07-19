/* ===========================================================================
   T33 — HDRI SKY + DERIVED LIGHTING  (ARC 3 · LANE-014 slice 3 — the audited env skies)

   Loads the three ledgered Poly Haven CC0 environment HDRIs (assets/3d/provenance.json
   rows sky_day / sky_dusk / sky_overcast; the media-budget assets3d wall enforces the
   ledger) through the already-enrolled THREE.RGBELoader (an OPTIONAL frozen-base addon
   — its absence is a fail-closed path, never an error), PRE-DECODES each to an LDR
   canvas (RGBE -> linear -> precomputed per-sky exposure -> gamma 2.2 -> bytes; the
   raw RGBE map displayed in this engine's linear-output pipeline reads as a near-night
   sky — headless smoke evidence, D472), and attaches the decoded equirect CanvasTexture
   to the existing sky dome mesh (found by scene name — no sibling-internal reach).
   The dome's material multiplies map × vertex luminance ramp × material.colour, and the
   sibling fidelity layer keeps re-copying material.colour from the live weather fog
   each frame, so THE LIVE FOG TINT KEEPS MODULATING THE HDRI SKY by construction —
   the dome/ground-fog seam stays seamless with zero new coupling code. The decode
   whites out the BELOW-HORIZON half (a short fade under the horizon row), so the dome
   below the horizon keeps rendering exactly today's fog-tinted colour.

   KEYING (weather/time state, resolved from the SAME scenario fields the weather
   layer reads — an independent read of __FIELD._scenTop/.scenData, never a sibling
   call): skies overcast/rain/fog/snow -> the overcast HDRI; clear/haze at dawn or
   dusk -> the dusk HDRI; every other state (including the engine default) -> the
   day HDRI.

   DERIVED LIGHTING (precomputed — determinism, no live sampling): when (and only
   when) an HDRI attaches, the scene's directional-sun + hemisphere light COLOURS
   become PRECOMPUTED constants derived OFFLINE from that HDRI's actual pixels by
   tools/derive-hdr-palette.mjs (solid-angle-weighted hemisphere means + the
   brightest-0.05%-region sun colour, blended 50/50 with the authored palette the
   weather layer would produce for the key's canonical state — day = the engine
   default, dusk = clear sky + the dusk time modifier, overcast = the overcast base
   — so the antique broadsheet look holds; numbers reproduced in DECISIONS D472).
   The per-sky EXPOSURE constants used by the LDR decode come from the same tool
   (display-mean target / measured upper-hemisphere mean luminance). Light
   INTENSITIES are never touched — the weather layer's authored per-sky darkness
   law stays intact. The pre-attach colours are captured first and restored on any
   detach, so every non-attached state keeps today's lighting byte-identical.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   wraps fld3dInit / fldExit by ASSIGNMENT (the established seam law), reads ONLY
   render state (__FIELD.scene, the dome mesh, G.settings) + the scenario weather
   hint. It NEVER writes a sim field, NEVER touches geometry or the shared sim RNG,
   never bumps the save format, and does NO per-frame work (no render wrap).

   FAIL-CLOSED (the progressive-enhancement law): every early-out keeps the CURRENT
   gradient dome + current lighting byte-identical —
     · renderRich === "off"            -> inert (the dome itself is not built);
     · fldLow()                        -> no map, no light change (static tint);
     · reduceMotion                    -> no map, no light change (static tint);
     · non-http(s) protocol (file://)  -> no map (the offline single-file build
                                          keeps today's sky exactly);
     · RGBELoader addon absent         -> no map (CDN hiccup is a fallback, not
                                          an error);
     · .hdr absent/blocked/unreadable  -> no map, no light change (load failure is
                                          the fail-closed path — errN stays 0);
     · decode unavailable (no 2d ctx)  -> no map, no light change (same path).

   PERF (Intel UHD-617 floor): ZERO new scene objects, ZERO new draw calls — the
   equirect map rides the existing dome mesh/material. One 2k LDR canvas decodes +
   uploads once per battle launch (cached per key across battles; the one-time
   decode is LUT-driven); no per-frame work, so reduceMotion needs no motion
   suppression (the gate above is the conservative static-tint contract, not a
   motion concern).
   =========================================================================== */

var FLDHDRI = {
  BASE: "assets/3d/env/",                     // ledgered CC0 HDRIs (provenance.json)
  FILES: { day: "sky_day.hdr", dusk: "sky_dusk.hdr", overcast: "sky_overcast.hdr" },
  // sky enums that key to the overcast HDRI; every other valid sky keys by time
  OVERCAST_SKIES: ["overcast", "rain", "fog", "snow"],
  DUSK_TIMES: ["dawn", "dusk"],
  SKY_SET: ["clear", "overcast", "rain", "fog", "haze", "snow"],
  TIME_SET: ["dawn", "morning", "midday", "afternoon", "dusk"],
  // PRECOMPUTED per-sky decode exposure (tools/derive-hdr-palette.mjs: the 232/255
  // display-mean target in linear light / the HDRI's measured solid-angle-weighted
  // upper-hemisphere mean luminance — the map MODULATES the fog-tinted dome, never
  // repaints it dark; the T32 TARGET_LUM philosophy):
  EXPOSURE: { day: 0.336, dusk: 0.590, overcast: 0.645 },
  HORIZON_FADE: 0.04,  // below-horizon rows fade to white over this fraction of image height
  // PRECOMPUTED light colours (offline derivation from the named HDRI's pixels,
  // blended 50/50 with the authored palette; intensities NEVER touched):
  //   sun  = brightest-0.05%-region colour · hemiS = upper-hemisphere mean ·
  //   hemiG = lower-hemisphere mean (solid-angle weighted; gamma 2.2 display hex)
  LIGHTS: {
    day:      { sun: "#feefc7", hemiS: "#dee0dc", hemiG: "#55534d" },
    dusk:     { sun: "#ffdb9e", hemiS: "#dfdef0", hemiG: "#5e4f44" },
    overcast: { sun: "#efeadf", hemiS: "#d3d5d5", hemiG: "#57524a" }
  }
};

var FLDHDRI_S = {
  tex: {},             // { key: decoded LDR THREE.CanvasTexture } cache (≤3, survives battles)
  loadState: {},       // { key: "loading" | "ready" | "failed" } (failed => fail-closed)
  attachedKey: null,   // the key currently attached to the live dome (null = gradient)
  prevLights: null,    // captured pre-attach light colours, restored on detach
  errN: 0, _warned: false
};

/* ---- gates (each early-out keeps the byte-identical current sky + lights) ---- */
function fldHdriOff() {
  try { if (typeof G !== "undefined" && G && G.settings && G.settings.renderRich === "off") return true; } catch (e) {}
  return false;
}
function fldHdriEligible() {
  if (fldHdriOff()) return false;
  try { if (typeof fldLow === "function" && fldLow()) return false; } catch (e) {}
  try { if (typeof fldReduceMotion === "function" && fldReduceMotion()) return false; } catch (e2) {}
  try {
    var pr = (typeof location !== "undefined" && location && location.protocol) ? location.protocol : "";
    if (pr !== "http:" && pr !== "https:") return false;   // offline single-file build keeps today's sky
  } catch (e3) { return false; }
  return true;
}

/* ---- weather/time -> HDRI key (an independent read of the scenario hint — the
   same __FIELD fields the weather layer resolves from, validated the same way) ---- */
function fldHdriKey() {
  var sky = "clear", time = "midday";
  try {
    var wOff = (typeof G !== "undefined" && G && G.settings && G.settings.weather === "off");
    var raw = null;
    if (!wOff && typeof __FIELD !== "undefined" && __FIELD) {
      raw = (__FIELD._scenTop && __FIELD._scenTop.weather) || (__FIELD.scenData && __FIELD.scenData.weather) || null;
    }
    if (raw && typeof raw === "object") {
      var s = String(raw.sky || "clear").toLowerCase();
      if (FLDHDRI.SKY_SET.indexOf(s) >= 0) sky = s;
      var t = String(raw.time || "midday").toLowerCase();
      if (FLDHDRI.TIME_SET.indexOf(t) >= 0) time = t;
    }
  } catch (e) {}
  if (FLDHDRI.OVERCAST_SKIES.indexOf(sky) >= 0) return "overcast";
  if (FLDHDRI.DUSK_TIMES.indexOf(time) >= 0) return "dusk";
  return "day";
}

/* ---- the dome (found by scene name — no sibling-internal reach) ---- */
function fldHdriDome() {
  try {
    if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene) return null;
    var d = null;
    __FIELD.scene.traverse(function (o) { if (o && o.name === "vfSky") d = o; });
    return (d && d.material) ? d : null;
  } catch (e) { return null; }
}

/* ---- RGBE -> LDR decode: linear light × precomputed exposure, gamma-2.2 encoded
   through a 12-bit LUT into a canvas; the below-horizon half fades to white so the
   dome under the horizon keeps today's exact fog-tinted look. Any missing piece
   (bad data layout, no 2d context) returns null => the caller fails closed. ---- */
function fldHdriDecode(T, tex, key) {
  try {
    var img = tex && tex.image;
    var d = img && img.data, W = img && img.width, H = img && img.height;
    if (!d || !W || !H || d.length !== W * H * 4) return null;
    var c = document.createElement("canvas"); c.width = W; c.height = H;
    var g = c.getContext("2d"); if (!g) return null;
    var id = g.createImageData(W, H), o = id.data;
    var exp = FLDHDRI.EXPOSURE[key] || 0.5;
    var lut = new Uint8Array(4096);                       // linear [0,1] -> gamma-2.2 byte
    for (var i = 0; i < 4096; i++) lut[i] = Math.round(Math.pow(i / 4095, 1 / 2.2) * 255);
    var horizon = H / 2, fadeRows = Math.max(1, H * FLDHDRI.HORIZON_FADE);
    for (var y = 0; y < H; y++) {
      var wMix = y <= horizon ? 0 : Math.min(1, (y - horizon) / fadeRows);
      for (var x = 0; x < W; x++) {
        var p = (y * W + x) * 4;
        var e = d[p + 3], f = e ? Math.pow(2, e - 136) * exp : 0;  // 2^(e-128)/256 × exposure
        for (var ch = 0; ch < 3; ch++) {
          var lin = d[p + ch] * f; if (lin > 1) lin = 1;
          var v = lut[(lin * 4095) | 0];
          o[p + ch] = wMix ? Math.round(v * (1 - wMix) + 255 * wMix) : v;
        }
        o[p + 3] = 255;
      }
    }
    g.putImageData(id, 0, 0);
    var out = new T.CanvasTexture(c); out.needsUpdate = true;  // canvas fully drawn BEFORE upload
    out.minFilter = T.LinearMipmapLinearFilter; out.magFilter = T.LinearFilter;
    out.generateMipmaps = true;                                // 2048×1024 POT (mipmap-safe on WebGL1)
    return out;
  } catch (e2) { return null; }
}

/* ---- texture loading (per-key cache; failure is fail-closed, never an error) ---- */
function fldHdriEnsure(key, cb) {
  var st = FLDHDRI_S.loadState[key];
  if (st === "ready") { if (cb) cb(); return; }
  if (st === "failed" || st === "loading") return;
  var T = window.THREE;
  if (!T || typeof T.RGBELoader !== "function") { FLDHDRI_S.loadState[key] = "failed"; return; }
  FLDHDRI_S.loadState[key] = "loading";
  try {
    new T.RGBELoader().load(
      FLDHDRI.BASE + FLDHDRI.FILES[key],
      function (tex) {
        var ldr = fldHdriDecode(T, tex, key);
        try { if (tex && tex.dispose) tex.dispose(); } catch (e0) {}
        if (!ldr) { FLDHDRI_S.loadState[key] = "failed"; return; }   // undecodable => gradient dome
        FLDHDRI_S.tex[key] = ldr;
        FLDHDRI_S.loadState[key] = "ready";
        if (cb) { try { cb(); } catch (e) { _hdriErr(e); } }
      },
      undefined,
      function () { FLDHDRI_S.loadState[key] = "failed"; }   // absent/blocked => gradient dome
    );
  } catch (e2) { FLDHDRI_S.loadState[key] = "failed"; }
}

/* ---- lights: capture-once, set to the key's precomputed colours, restore on detach.
   Colours only — intensities keep the authored per-sky values. ---- */
function fldHdriSetLights(key) {
  var sc = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.scene : null;
  var L = FLDHDRI.LIGHTS[key];
  if (!sc || !L) return;
  var prev = FLDHDRI_S.prevLights ? null : { sun: null, hemiS: null, hemiG: null };
  sc.traverse(function (o) {
    if (!o) return;
    if (o.isDirectionalLight) {
      if (prev) prev.sun = "#" + o.color.getHexString();
      o.color.set(L.sun);
    } else if (o.isHemisphereLight) {
      if (prev) { prev.hemiS = "#" + o.color.getHexString(); prev.hemiG = o.groundColor ? "#" + o.groundColor.getHexString() : null; }
      o.color.set(L.hemiS);
      if (o.groundColor) o.groundColor.set(L.hemiG);
    }
  });
  if (prev) FLDHDRI_S.prevLights = prev;
}
function fldHdriRestoreLights() {
  var sc = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.scene : null;
  var p = FLDHDRI_S.prevLights;
  if (!sc || !p) { FLDHDRI_S.prevLights = null; return; }
  sc.traverse(function (o) {
    if (!o) return;
    if (o.isDirectionalLight && p.sun) o.color.set(p.sun);
    else if (o.isHemisphereLight) {
      if (p.hemiS) o.color.set(p.hemiS);
      if (o.groundColor && p.hemiG) o.groundColor.set(p.hemiG);
    }
  });
  FLDHDRI_S.prevLights = null;
}

/* ---- attach/detach (atomic with the lights: colours move ONLY when a map does) ---- */
function fldHdriDetach() {
  var dome = fldHdriDome();
  if (dome && dome.material.map) { dome.material.map = null; dome.material.needsUpdate = true; }
  if (FLDHDRI_S.attachedKey) fldHdriRestoreLights();
  FLDHDRI_S.attachedKey = null;
}
function fldHdriAttach(key) {
  var dome = fldHdriDome(); if (!dome) return;
  var tex = FLDHDRI_S.tex[key]; if (!tex) return;
  if (dome.material.map !== tex) { dome.material.map = tex; dome.material.needsUpdate = true; }
  if (FLDHDRI_S.attachedKey !== key) {
    if (FLDHDRI_S.attachedKey) fldHdriRestoreLights();       // key switch: restore, then re-capture
    fldHdriSetLights(key);
    FLDHDRI_S.attachedKey = key;
  }
}

/* the init-time hook (re-callable — re-resolves the key against live state) */
function fldHdriApply() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene) return;
  if (!fldHdriEligible()) { fldHdriDetach(); return; }
  var key = fldHdriKey();
  if (FLDHDRI_S.loadState[key] === "ready") { fldHdriAttach(key); return; }
  if (FLDHDRI_S.attachedKey && FLDHDRI_S.attachedKey !== key) fldHdriDetach();
  fldHdriEnsure(key, function () {
    try {
      if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.launched || !__FIELD.scene) return;
      if (!fldHdriEligible()) return;
      if (fldHdriKey() !== key) return;                      // state moved while loading
      fldHdriAttach(key);
    } catch (e) { _hdriErr(e); }
  });
}

/* ---- teardown: battle-scoped detach (textures stay cached; the sibling layer
   disposes the dome itself, and a torn-down GL context re-uploads on next use) ---- */
function fldHdriExit() {
  FLDHDRI_S.attachedKey = null;                              // dome + lights die with the battle scene
  FLDHDRI_S.prevLights = null;
}

function _hdriErr(e) {
  FLDHDRI_S.errN++;
  if (!FLDHDRI_S._warned && typeof console !== "undefined" && console.warn) {
    FLDHDRI_S._warned = true; console.warn("T33 hdri-sky:", (e && e.message) || e);
  }
}

/* ===========================================================================
   WIRE-IN — wrap fld3dInit (attach after the dome exists) and fldExit (reset the
   battle-scoped state) by ASSIGNMENT, outermost, carrying every prior wrapper
   marker forward so the chain stays introspectable. Each hook try/caught into errN.
   =========================================================================== */
(function () {
  function _carryT33(dst, src) { for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { try { dst[k] = src[k]; } catch (e) {} } } }
  if (typeof fld3dInit === "function" && !fld3dInit._t33) {
    var _oi = fld3dInit;
    fld3dInit = function () { var r = _oi.apply(this, arguments); try { fldHdriApply(); } catch (e) { _hdriErr(e); } return r; };
    _carryT33(fld3dInit, _oi); fld3dInit._t33 = true;
  }
  if (typeof fldExit === "function" && !fldExit._t33) {
    var _oe = fldExit;
    fldExit = function () { try { fldHdriExit(); } catch (e) { _hdriErr(e); } return _oe.apply(this, arguments); };
    _carryT33(fldExit, _oe); fldExit._t33 = true;
  }
})();
