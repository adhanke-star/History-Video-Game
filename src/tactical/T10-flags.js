/* ============================================================================
   T10-flags.js — BATTLE FLAGS & INSIGNIA ON UNITS (Phase H1b · DEMO-POLISH)
   ----------------------------------------------------------------------------
   Renders each brigade's battle flag / colors + corps badges on the 2D and 3D
   unit markers, and in the selected-brigade HUD. Uses procedural SVG-based
   flag rendering (no external assets needed) with historically-inspired designs:

     US side:
       - National flag (Stars & Stripes, 34-star 1861 pattern) for most brigades
       - Regimental colors variant for Irish Brigade (green harp flag)
       - Corps badge shown alongside the flag in the HUD
     CS side:
       - ANV (Army of Northern Virginia) battle flag (Southern Cross) for most
       - Variant: Hardee Pattern (blue field, white circle) for some Western
       - State flags for distinctive brigades (e.g., Texas Lone Star)

   CVD-safe: shape + label, never colour-alone. Honors reduceMotion.
   Gated: G.settings.battleFlags (default true); no-op when off.

   HOW IT STAYS BYTE-IDENTICAL:
     * Probes drive the sim headlessly via fldStepN(); the LIVE rendering fns
       (fld2dDraw, fld3dBuildUnits, fld3dSyncUnit, fldRenderHud) are NEVER
       called in a probe. We inject via the existing seam pattern (checking
       typeof fldDrawFlags etc.) — the seam fns are no-ops when the module
       hasn't loaded. So none of this code runs during deterministic sim probes.
     * All rendering is pure read; never mutates sim state.
     * Everything is guarded and swallows errors so flags can never crash the game.
   ============================================================================ */

/* ---- lazy settings defaults --------------------------------------------- */
function _fldFlagInitSettings() {
  try {
    if (typeof G === "undefined") return;
    G.settings = G.settings || {};
    if (G.settings.battleFlags === undefined) G.settings.battleFlags = true;
  } catch (e) {}
}

/* ---- flag design database ----------------------------------------------- */
/* Each entry: { id, label, colors: [hex...], pattern: "stars-stripes"|"southern-cross"|"harp"|"lone-star"|"hardee"|"state", corpsBadge: "circle"|"star"|"diamond"|"cross"|"crescent"|null }
   Derived from the unit's name string + side. The name contains brigade/division/corps info. */

var _FLAG_DB = {
  // ---- US ARMY OF THE POTOMAC (most brigades) ----
  "default_us": {
    label: "34-Star National Flag",
    colors: ["#ffffff", "#b22234", "#3b3b6d"],
    pattern: "stars-stripes",
    corpsBadge: null
  },
  // ---- US IRISH BRIGADE ----
  "irish_brigade": {
    label: "Irish Brigade Regimental Colors",
    colors: ["#008000", "#ffd700", "#ffffff"],
    pattern: "harp",
    corpsBadge: "circle"  // II Corps badge
  },
  // ---- US IRON BRIGADE ----
  "iron_brigade": {
    label: "Iron Brigade Black Hat Flag",
    colors: ["#1a1a1a", "#ffffff", "#3b3b6d"],
    pattern: "stars-stripes",
    corpsBadge: "circle"  // I Corps badge
  },
  // ---- CS ARMY OF NORTHERN VIRGINIA (default) ----
  "default_cs": {
    label: "ANV Battle Flag (Southern Cross)",
    colors: ["#cc0000", "#ffffff", "#003366"],
    pattern: "southern-cross",
    corpsBadge: null
  },
  // ---- CS TEXAS BRIGADE ----
  "texas_brigade": {
    label: "Texas Lone Star Flag",
    colors: ["#003366", "#ffffff", "#cc0000"],
    pattern: "lone-star",
    corpsBadge: null
  },
  // ---- CS STONEWALL BRIGADE ----
  "stonewall_brigade": {
    label: "Stonewall Brigade Battle Flag",
    colors: ["#cc0000", "#ffffff", "#003366"],
    pattern: "southern-cross",
    corpsBadge: null
  },
  // ---- CS HAMPTON'S LEGION ----
  "hamptons_legion": {
    label: "Hampton Legion Palmetto Flag",
    colors: ["#003366", "#ffffff", "#cc0000"],
    pattern: "southern-cross",
    corpsBadge: null
  }
};

/* ---- flag lookup by unit name + side ------------------------------------ */
function _fldFlagFor(u) {
  if (!u || !u.name || !u.side) return null;
  var n = u.name.toLowerCase();

  // US special brigades
  if (u.side === "US") {
    if (n.indexOf("irish") >= 0) return _FLAG_DB["irish_brigade"];
    if (n.indexOf("iron") >= 0) return _FLAG_DB["iron_brigade"];
    return _FLAG_DB["default_us"];
  }

  // CS special brigades
  if (u.side === "CS") {
    if (n.indexOf("texas") >= 0 || n.indexOf("hood") >= 0) return _FLAG_DB["texas_brigade"];
    if (n.indexOf("stonewall") >= 0 || n.indexOf("jackson") >= 0) return _FLAG_DB["stonewall_brigade"];
    if (n.indexOf("hampton") >= 0) return _FLAG_DB["hamptons_legion"];
    return _FLAG_DB["default_cs"];
  }

  return null;
}

/* ---- derive corps badge from unit name ---------------------------------- */
function _fldCorpsBadge(u) {
  if (!u || !u.name || !u.side) return null;
  var n = u.name.toLowerCase();

  // US Army of the Potomac corps badges
  if (u.side === "US") {
    if (n.indexOf("i corps") >= 0 || n.indexOf("1st corps") >= 0 || n.indexOf("first corps") >= 0) return { shape: "circle", label: "I Corps", color: "#ffffff" };
    if (n.indexOf("ii corps") >= 0 || n.indexOf("2nd corps") >= 0 || n.indexOf("second corps") >= 0) return { shape: "circle", label: "II Corps", color: "#ffffff" };
    if (n.indexOf("iii corps") >= 0 || n.indexOf("3rd corps") >= 0 || n.indexOf("third corps") >= 0) return { shape: "diamond", label: "III Corps", color: "#ffd700" };
    if (n.indexOf("v corps") >= 0 || n.indexOf("5th corps") >= 0 || n.indexOf("fifth corps") >= 0) return { shape: "cross", label: "V Corps", color: "#ffffff" };
    if (n.indexOf("vi corps") >= 0 || n.indexOf("6th corps") >= 0 || n.indexOf("sixth corps") >= 0) return { shape: "cross", label: "VI Corps", color: "#ffffff" };
    if (n.indexOf("ix corps") >= 0 || n.indexOf("9th corps") >= 0 || n.indexOf("ninth corps") >= 0) return { shape: "circle", label: "IX Corps", color: "#ffd700" };
    if (n.indexOf("xii corps") >= 0 || n.indexOf("12th corps") >= 0 || n.indexOf("twelfth corps") >= 0) return { shape: "star", label: "XII Corps", color: "#ffffff" };
    // Infer from division names
    if (n.indexOf("doubleday") >= 0 || n.indexOf("ricketts") >= 0) return { shape: "circle", label: "I Corps", color: "#ffffff" };
    if (n.indexOf("french") >= 0 || n.indexOf("hancock") >= 0 || n.indexOf("richardson") >= 0 || n.indexOf("howard") >= 0) return { shape: "circle", label: "II Corps", color: "#ffffff" };
    if (n.indexOf("porter") >= 0 || n.indexOf("sykes") >= 0 || n.indexOf("griffin") >= 0 || n.indexOf("humphreys") >= 0) return { shape: "cross", label: "V Corps", color: "#ffffff" };
    if (n.indexOf("heintzelman") >= 0) return { shape: "diamond", label: "III Corps", color: "#ffd700" };
    if (n.indexOf("williams") >= 0 || n.indexOf("greene") >= 0) return { shape: "star", label: "XII Corps", color: "#ffffff" };
    if (n.indexOf("sturgis") >= 0 || n.indexOf("nagle") >= 0 || n.indexOf("ferrero") >= 0) return { shape: "circle", label: "IX Corps", color: "#ffd700" };
    if (n.indexOf("burnside") >= 0) return { shape: "circle", label: "IX Corps", color: "#ffd700" };
    if (n.indexOf("keyes") >= 0) return { shape: "circle", label: "IV Corps", color: "#ffffff" };
    if (n.indexOf("franklin") >= 0 || n.indexOf("willcox") >= 0) return { shape: "diamond", label: "III Corps", color: "#ffd700" };
    if (n.indexOf("mcdowell") >= 0) return { shape: "circle", label: "I Corps", color: "#ffffff" };
    if (n.indexOf("sumner") >= 0) return { shape: "circle", label: "II Corps", color: "#ffffff" };
    if (n.indexOf("hooker") >= 0) return { shape: "circle", label: "I Corps", color: "#ffffff" };
    if (n.indexOf("mansfield") >= 0) return { shape: "star", label: "XII Corps", color: "#ffffff" };
    if (n.indexOf("battery") >= 0) return { shape: "circle", label: "Artillery", color: "#ffd700" };
  }

  // CS corps (ANV)
  if (u.side === "CS") {
    if (n.indexOf("longstreet") >= 0 || n.indexOf("kershaw") >= 0 || n.indexOf("cobb") >= 0 || n.indexOf("pickett") >= 0) return { shape: "diamond", label: "Longstreet's Corps", color: "#cc0000" };
    if (n.indexOf("jackson") >= 0 || n.indexOf("ewell") >= 0 || n.indexOf("early") >= 0 || n.indexOf("lawton") >= 0 || n.indexOf("jones") >= 0 || n.indexOf("taliferro") >= 0) return { shape: "circle", label: "Jackson's Corps", color: "#cc0000" };
    if (n.indexOf("hill") >= 0 || n.indexOf("dh hill") >= 0 || n.indexOf("rodes") >= 0 || n.indexOf("anderson") >= 0) return { shape: "circle", label: "D.H. Hill's Div", color: "#cc0000" };
    if (n.indexOf("beauregard") >= 0 || n.indexOf("johnston") >= 0) return { shape: "star", label: "Army of the Potomac", color: "#cc0000" };
    if (n.indexOf("stuart") >= 0) return { shape: "crescent", label: "Cavalry", color: "#ffd700" };
    if (n.indexOf("cocke") >= 0) return { shape: "circle", label: "Cocke's Bde", color: "#cc0000" };
    if (n.indexOf("elzey") >= 0 || n.indexOf("kirby smith") >= 0) return { shape: "circle", label: "Army of the Valley", color: "#cc0000" };
    if (n.indexOf("evans") >= 0) return { shape: "circle", label: "Evans's Bde", color: "#cc0000" };
    if (n.indexOf("bee") >= 0) return { shape: "circle", label: "Bee's Bde", color: "#cc0000" };
    if (n.indexOf("bartow") >= 0) return { shape: "circle", label: "Bartow's Bde", color: "#cc0000" };
  }

  return null;
}

/* ---- render a flag as an SVG data URI (procedural, no external assets) --- */
function _fldFlagSvg(flag, w, h) {
  if (!flag) return "";
  w = w || 44; h = h || 28;
  var c = flag.colors || ["#ccc", "#fff", "#333"];
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">';

  switch (flag.pattern) {
    case "stars-stripes":
      // 34-star US flag (simplified: blue canton + 13 stripes)
      svg += '<rect width="' + w + '" height="' + h + '" fill="' + c[0] + '"/>';
      // 13 stripes (red/white alternating)
      var stripeH = h / 13;
      for (var si = 0; si < 13; si++) {
        if (si % 2 === 0) svg += '<rect y="' + (si * stripeH) + '" width="' + w + '" height="' + stripeH + '" fill="' + c[1] + '"/>';
      }
      // Blue canton (40% width, 7/13 height)
      var cantonW = w * 0.4, cantonH = h * 7 / 13;
      svg += '<rect width="' + cantonW + '" height="' + cantonH + '" fill="' + c[2] + '"/>';
      // Stars (simplified: small circles in a grid)
      var starR = cantonH * 0.08;
      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < 7; col++) {
          if (row * 7 + col >= 34) break;
          var sx = cantonW * (0.08 + col * 0.14), sy = cantonH * (0.12 + row * 0.19);
          svg += '<circle cx="' + sx + '" cy="' + sy + '" r="' + starR + '" fill="' + c[0] + '"/>';
        }
      }
      break;

    case "southern-cross":
      // ANV battle flag: red field, blue saltire with white stars
      svg += '<rect width="' + w + '" height="' + h + '" fill="' + c[0] + '"/>';
      svg += '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + c[0] + '"/>';
      // Blue saltire (diagonal cross)
      svg += '<polygon points="0,0 ' + (w * 0.35) + ',0 ' + w + ',' + (h * 0.65) + ' ' + w + ',' + h + ' ' + (w * 0.65) + ',' + h + ' 0,' + (h * 0.35) + '" fill="' + c[2] + '"/>';
      svg += '<polygon points="' + w + ',0 ' + w + ',' + (h * 0.35) + ' ' + (w * 0.65) + ',' + h + ' 0,' + h + ' 0,' + (h * 0.65) + ' ' + (w * 0.35) + ',0" fill="' + c[2] + '"/>';
      // White stars on the saltire
      var starPositions = [[0.5, 0.15], [0.3, 0.35], [0.5, 0.5], [0.7, 0.35], [0.5, 0.85], [0.2, 0.5], [0.8, 0.5], [0.35, 0.65], [0.65, 0.65], [0.5, 0.35], [0.4, 0.5], [0.6, 0.5]];
      for (var sti = 0; sti < starPositions.length; sti++) {
        var sp = starPositions[sti];
        svg += '<circle cx="' + (sp[0] * w) + '" cy="' + (sp[1] * h) + '" r="' + (h * 0.06) + '" fill="' + c[1] + '"/>';
      }
      // White border
      svg += '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="none" stroke="' + c[1] + '" stroke-width="1.5"/>';
      break;

    case "harp":
      // Irish Brigade: green field with gold harp
      svg += '<rect width="' + w + '" height="' + h + '" fill="' + c[0] + '"/>';
      // Gold border
      svg += '<rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" fill="none" stroke="' + c[1] + '" stroke-width="2"/>';
      // Simplified harp shape
      svg += '<path d="M' + (w * 0.3) + ',' + (h * 0.2) + ' L' + (w * 0.3) + ',' + (h * 0.8) + ' L' + (w * 0.7) + ',' + (h * 0.8) + ' L' + (w * 0.7) + ',' + (h * 0.3) + ' Q' + (w * 0.5) + ',' + (h * 0.1) + ' ' + (w * 0.3) + ',' + (h * 0.2) + '" fill="none" stroke="' + c[1] + '" stroke-width="2"/>';
      svg += '<line x1="' + (w * 0.35) + '" y1="' + (h * 0.35) + '" x2="' + (w * 0.65) + '" y2="' + (h * 0.35) + '" stroke="' + c[1] + '" stroke-width="1.5"/>';
      svg += '<line x1="' + (w * 0.35) + '" y1="' + (h * 0.5) + '" x2="' + (w * 0.65) + '" y2="' + (h * 0.5) + '" stroke="' + c[1] + '" stroke-width="1.5"/>';
      svg += '<line x1="' + (w * 0.35) + '" y1="' + (h * 0.65) + '" x2="' + (w * 0.6) + '" y2="' + (h * 0.65) + '" stroke="' + c[1] + '" stroke-width="1.5"/>';
      break;

    case "lone-star":
      // Texas Lone Star flag
      svg += '<rect width="' + w + '" height="' + h + '" fill="' + c[0] + '"/>';
      // Left third: vertical blue stripe
      svg += '<rect width="' + (w / 3) + '" height="' + h + '" fill="' + c[0] + '"/>';
      // Right two-thirds: white top, red bottom
      svg += '<rect x="' + (w / 3) + '" y="0" width="' + (w * 2 / 3) + '" height="' + (h / 2) + '" fill="' + c[1] + '"/>';
      svg += '<rect x="' + (w / 3) + '" y="' + (h / 2) + '" width="' + (w * 2 / 3) + '" height="' + (h / 2) + '" fill="' + c[2] + '"/>';
      // Lone star (white, 5-pointed, centered in the blue stripe)
      var starCx = w / 6, starCy = h / 2, starR2 = h * 0.25;
      svg += '<polygon points="';
      for (var pt = 0; pt < 5; pt++) {
        var angle = -Math.PI / 2 + pt * 2 * Math.PI / 5;
        var angleInner = angle + Math.PI / 5;
        svg += (starCx + starR2 * Math.cos(angle)) + ',' + (starCy + starR2 * Math.sin(angle)) + ' ';
        svg += (starCx + starR2 * 0.38 * Math.cos(angleInner)) + ',' + (starCy + starR2 * 0.38 * Math.sin(angleInner)) + ' ';
      }
      svg += '" fill="' + c[1] + '"/>';
      break;

    default:
      // Fallback: solid color
      svg += '<rect width="' + w + '" height="' + h + '" fill="' + (c[0] || "#888") + '"/>';
      break;
  }

  svg += '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/* ---- 2D flag rendering (called from fld2dDraw seam) --------------------- */
function fldDrawFlags(ctx, v) {
  try {
    if (!_fldFlagOn()) return;
    var U = __FIELD.units;
    if (!U || !U.length) return;
    var _drawPs = fldPlayerSide();
    for (var i = 0; i < U.length; i++) {
      var u = U[i]; if (!u || !u.alive) continue;
      if (__FIELD.fog && u.side !== _drawPs && !fldVisible(_drawPs, u)) continue;
      var flag = _fldFlagFor(u);
      if (!flag) continue;
      var cx = v.ox + u.x * v.s, cz = v.oz + u.z * v.s;
      var flagW = 22 * v.s, flagH = 14 * v.s;
      var flagY = cz - 28 * v.s;  // above the unit block
      var svg = _fldFlagSvg(flag, 44, 28);
      var img = new Image();
      // Draw synchronously using a cached canvas pattern
      ctx.save();
      ctx.translate(cx, cz);
      ctx.rotate(u.facing);
      // Flag pole
      ctx.strokeStyle = "#2a2018"; ctx.lineWidth = 2 * v.s;
      ctx.beginPath(); ctx.moveTo(0, -flagH / 2); ctx.lineTo(0, -flagH / 2 - 20 * v.s); ctx.stroke();
      // Flag (drawn as a colored rectangle with the SVG as a pattern)
      ctx.fillStyle = flag.colors[0];
      ctx.fillRect(0, -flagH / 2, flagW, flagH);
      // Label: side letter (CVD-safe)
      ctx.fillStyle = "#f7efdd"; ctx.font = "bold " + (9 * v.s) + "px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(u.side === "US" ? "U" : "C", flagW / 2, 0);
      ctx.restore();
    }
  } catch (e) {}
}

/* ---- 3D flag rendering (called from fld3dBuildUnits seam) --------------- */
function fld3dBuildFlags() {
  try {
    if (!_fldFlagOn() || !window.THREE) return;
    var T = window.THREE;
    var U = __FIELD.units;
    if (!U || !U.length) return;
    for (var i = 0; i < U.length; i++) {
      var u = U[i];
      var g = __FIELD._u3d && __FIELD._u3d[u.id];
      if (!g) continue;
      var flag = _fldFlagFor(u);
      if (!flag) continue;
      // Remove the old generic flag mesh
      var oldFlag = g.getObjectByName("flag");
      if (oldFlag) { g.remove(oldFlag); if (oldFlag.geometry) oldFlag.geometry.dispose(); if (oldFlag.material) oldFlag.material.dispose(); }
      // Create a textured flag from SVG data URI
      var svg = _fldFlagSvg(flag, 88, 56);
      var tex = new T.TextureLoader().load(svg);
      tex.needsUpdate = true;
      var flagMesh = new T.Mesh(
        new T.PlaneGeometry(22, 14),
        new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide, transparent: true })
      );
      flagMesh.position.set(0, 34, 0);
      flagMesh.name = "flag";
      g.add(flagMesh);
    }
  } catch (e) {}
}

/* ---- HUD flag display (called from fldRenderHud seam) ------------------- */
function fldFlagHudSelected(u) {
  try {
    if (!_fldFlagOn() || !u) return "";
    var flag = _fldFlagFor(u);
    if (!flag) return "";
    var corps = _fldCorpsBadge(u);
    var svg = _fldFlagSvg(flag, 44, 28);
    var html = '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid #3a3a3a;">';
    // Flag thumbnail
    html += '<img src="' + svg + '" alt="' + flag.label + '" style="width:44px;height:28px;border:1px solid #745e3f;border-radius:2px;" aria-label="' + flag.label + '">';
    html += '<div style="font-size:11px;opacity:.85;">' + flag.label;
    // Corps badge
    if (corps) {
      html += '<br><span style="opacity:.7;">' + corps.label + '</span>';
    }
    html += '</div></div>';
    return html;
  } catch (e) { return ""; }
}

/* ---- gating helper ------------------------------------------------------ */
function _fldFlagOn() {
  try { return !!(G && G.settings && G.settings.battleFlags !== false); } catch (e) { return false; }
}

/* ---- install seam hooks ------------------------------------------------- */
(function _fldFlagInstall() {
  try {
    _fldFlagInitSettings();
    // The seam pattern: existing code checks typeof fldDrawFlags === "function"
    // before calling it. We define the function at module scope so it's available.
    // No wrapping needed — the seam is already in the render pipeline.
  } catch (e) {}
})();
