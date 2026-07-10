/* ============================================================================
   T10-flags.js — BATTLE FLAGS & CORPS INSIGNIA ON UNITS (Phase H1b)
   ----------------------------------------------------------------------------
   Renders each brigade's battle flag / colors + (where historically worn) its
   Army-of-the-Potomac corps badge on the 2D and 3D unit markers and in the
   selected-brigade HUD. Procedural canvas rendering (no external assets — the
   single-file rule holds), with citation-grade, period-faithful designs.

   H1b DEEPENING (D131 — deepen, never replace; the D91 ethic). What changed:
     * BATTLE-AWARE flag selection. The Confederate "default" flag now resolves
       from the battle's date + theater, not a blanket ANV battle flag:
         - First National "Stars and Bars" at FIRST BULL RUN (21 Jul 1861) and in
           the early Western theater — the ANV battle flag did NOT exist yet at
           Manassas; its very creation was prompted by the smoke-confusion of the
           Stars and Bars with the U.S. flag THAT day.
         - ANV battle flag (Southern Cross) for the mid-war Eastern battles.
         - Hardee pattern (blue field, white disc) for the Army of Tennessee.
     * NEW flag patterns drawn for real: first-national, hardee, polk, guidon
       (the doc once claimed a "hardee" pattern that was never implemented).
     * CORPS BADGES are now drawn as SHAPES (the Kearny patch geometry), not just
       a text label — disc (I) / trefoil (II) / diamond (III) / cross pattée (V) /
       Greek cross (VI) / crescent (XI) / star (XII) — coloured by division
       (1st=red, 2nd=white, 3rd=blue) and ALWAYS paired with a text label
       (CVD-safe: shape + label, never colour alone).
     * ANACHRONISM GATE. Corps badges were adopted army-wide by Hooker's Circular
       of 21 March 1863 (the shapes perfected by his chief of staff, Daniel
       Butterfield; "General Orders No. 53" is a common but under-attested label —
       the surviving primary artifact is a Headquarters AotP circular). They are
       therefore shown ONLY for the
       Eastern battles from that date forward (here: Chancellorsville, Gettysburg)
       and NEVER on 1861-62 fields (Bull Run, Malvern Hill, Antietam,
       Fredericksburg) — where the corps existed but wore no badge yet. A short
       teaching note names the adoption date in the HUD on those earlier fields.
     * The 2D path now draws the ACTUAL flag pattern (a cached canvas blit). The
       prior code computed an SVG + an Image() it never drew, leaving 2D flags as
       blank coloured rectangles.

   CVD-safe: shape + label, never colour-alone. Static (no motion of its own —
   the T18 cloth-ripple owns the only flag motion, suppressed under reduceMotion).
   Gated: G.settings.battleFlags (default true); no-op when off.

   HOW IT STAYS BYTE-IDENTICAL (D74), BY CONSTRUCTION:
     * The live rendering fns (fldDrawFlags / fld3dBuildFlags / fldFlagHudSelected)
       are reached only from the T0 render seams (fld2dDraw / fld3dInit /
       fldRenderHud), which probes NEVER call — probes drive the sim headlessly
       via fldStepN(). So none of this runs during a deterministic sim probe.
     * Pure READ of sim state (u.name/side/x/z/facing/alive/state, __FIELD.scenario/
       fog/units). It writes NO sim field, NEVER touches fldRng, bumps no save-version.
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

/* ---- per-battle meta: date/theater drive flag choice + the badge gate -----
   theater "E"/"W"; badges = were AotP corps badges worn (post 21 Mar 1863, East);
   csFlag = the predominant Confederate flag family at that battle.
   Citations live in DECISIONS D131/D351. "hardee" is the representative Western/AoT
   family default, not a claim that every regiment carried one identical design;
   a documented unit-specific variant still requires its own lookup override.
   A scenario absent from this table (the sandbox / a skirmish) -> _default:
   no badges, ANV battle flag for CS — a byte-identity-neutral, era-typical look. */
var _FLD_BATTLE_META = {
  bullrun1:         { theater: "E", badges: false, csFlag: "first-national" }, // 21 Jul 1861
  malvernHill:      { theater: "E", badges: false, csFlag: "anv" },            // 1 Jul 1862
  antietam:         { theater: "E", badges: false, csFlag: "anv" },            // 17 Sep 1862
  fredericksburg:   { theater: "E", badges: false, csFlag: "anv" },            // 13 Dec 1862
  chancellorsville: { theater: "E", badges: true,  csFlag: "anv" },            // 1-3 May 1863
  gettysburg:       { theater: "E", badges: true,  csFlag: "anv" },            // 1-3 Jul 1863
  shiloh:           { theater: "W", badges: false, csFlag: "first-national" }, // 6-7 Apr 1862
  vicksburg:        { theater: "W", badges: false, csFlag: "hardee" },         // siege to 4 Jul 1863 (Pemberton's army was Western-lineage — a Western pattern, not the Eastern ANV cross; Inferred)
  chickamauga:      { theater: "W", badges: false, csFlag: "hardee" },         // 19-20 Sep 1863 (native Army of Tennessee; Longstreet's transferred Eastern brigades split out below)
  chattanooga:      { theater: "W", badges: false, csFlag: "hardee" },         // 23-25 Nov 1863 (Army of Tennessee)
  kennesaw:         { theater: "W", badges: false, csFlag: "hardee" },         // 27 Jun 1864 (Army of Tennessee)
  franklin:         { theater: "W", badges: false, csFlag: "hardee" },         // 30 Nov 1864 (Army of Tennessee)
  nashville:        { theater: "W", badges: false, csFlag: "hardee" },         // 15-16 Dec 1864 (Army of Tennessee)
  _default:         { theater: "E", badges: false, csFlag: "anv" }
};
function _fldBattleMeta() {
  try {
    var sc = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.scenario : null;
    if (sc && Object.prototype.hasOwnProperty.call(_FLD_BATTLE_META, sc) && sc !== "_default") return _FLD_BATTLE_META[sc];
  } catch (e) {}
  return _FLD_BATTLE_META._default;
}

/* ---- flag design database -----------------------------------------------
   Each entry: { label, caption, colors:[hex...], pattern }. The colour ROLES per
   pattern are documented at each draw case. caption = a one-line teaching note
   shown in the HUD (citation-grade; see DECISIONS D131). */
var _FLAG_DB = {
  /* -- UNION -- */
  default_us: {
    label: "U.S. National Colors (34 stars)",
    caption: "United States national flag — 34 stars through the war's middle years.",
    colors: ["#ffffff", "#b22234", "#2a3b6e"], // [white, red, blue]
    pattern: "stars-stripes"
  },
  irish_brigade: {
    label: "Irish Brigade Colors",
    caption: "Irish Brigade — the green regimental colour with its gold harp and sunburst.",
    colors: ["#0a7a36", "#e8c14a", "#f3ecd8"], // [green, gold, cream]
    pattern: "harp"
  },
  iron_brigade: {
    label: "Iron Brigade National Colors",
    caption: "The 'Black Hats' — the Iron Brigade carried the U.S. national and state colours.",
    colors: ["#ffffff", "#b22234", "#2a3b6e"],
    pattern: "stars-stripes"
  },
  us_cavalry: {
    label: "U.S. Cavalry Guidon",
    caption: "A swallow-tailed cavalry guidon in the national colours.",
    colors: ["#ffffff", "#b22234", "#2a3b6e"],
    pattern: "guidon"
  },
  /* -- CONFEDERATE -- */
  first_national: {
    label: "First National 'Stars and Bars'",
    caption: "First National flag — its confusion with the U.S. colours at Manassas prompted the battle flag.",
    colors: ["#c1382c", "#f3ecd8", "#2a3b6e"], // [red bar, white bar, blue canton]
    pattern: "first-national"
  },
  default_cs: {
    label: "A.N.V. Battle Flag (Southern Cross)",
    caption: "Army of Northern Virginia battle flag — adopted after the flag confusion at First Manassas.",
    colors: ["#c1382c", "#f3ecd8", "#2a3b6e"], // [red field, white border/stars, blue saltire]
    pattern: "southern-cross"
  },
  hardee: {
    label: "Hardee Pattern (Army of Tennessee)",
    caption: "Hardee pattern — a blue field with a white disc, carried by Army of Tennessee commands.",
    colors: ["#1d3a6b", "#f3ecd8"], // [blue field, white disc]
    pattern: "hardee"
  },
  polk: {
    label: "Polk's Corps Flag",
    caption: "Leonidas Polk's corps flag — a blue field with a red, white-bordered upright cross.",
    colors: ["#1d3a6b", "#f3ecd8", "#c1382c"], // [blue field, white border, red cross]
    pattern: "polk"
  },
  hamptons_legion: {
    label: "Hampton's Legion Colors",
    caption: "Hampton's Legion — a South Carolina command serving in the East.",
    colors: ["#1d3a6b", "#f3ecd8", "#c1382c"],
    pattern: "southern-cross"
  }
};

/* ---- battle-aware flag lookup by unit name + side ------------------------ */
function _fldFlagFor(u) {
  if (!u || !u.name || !u.side) return null;
  var n = u.name.toLowerCase();
  var meta = _fldBattleMeta();

  if (u.side === "US") {
    if (n.indexOf("irish") >= 0) return _FLAG_DB.irish_brigade;
    if (n.indexOf("iron") >= 0) return _FLAG_DB.iron_brigade;
    if (n.indexOf("cavalry") >= 0 || n.indexOf(" cav") >= 0) return _FLAG_DB.us_cavalry;
    return _FLAG_DB.default_us;
  }

  if (u.side === "CS") {
    // The Confederate "default" is the battle's flag family (date/theater-aware):
    var csDefault = meta.csFlag === "first-national" ? _FLAG_DB.first_national
                  : meta.csFlag === "hardee"          ? _FLAG_DB.hardee
                  :                                     _FLAG_DB.default_cs;
    // Once the battle flag existed (post-Bull Run), some commands flew a DISTINCT flag from the army default:
    if (meta.csFlag !== "first-national") {
      // Longstreet's transferred Eastern brigades (Hood, Kershaw, Law) carried the ANV Southern Cross even in
      // the West at Chickamauga — NOT the native Army-of-Tennessee Western pattern (the citation-grade split).
      if (/\b(hood|kershaw|law)\b/.test(n)) return _FLAG_DB.default_cs;
      if (n.indexOf("hampton") >= 0) return _FLAG_DB.hamptons_legion;
    }
    return csDefault;
  }
  return null;
}

/* ---- corps-badge derivation (DATE-GATED; corrected Kearny-patch shapes) ---
   Returns { shape, label, division (0-4), color } or null. null when:
     * the battle predates army-wide badges (Hooker's Circular, 21 Mar 1863), OR
     * the unit carries no resolvable corps.
   Division colour: 1st=red, 2nd=white, 3rd=blue, 4th=green; unknown -> neutral
   parchment (so we never imply a FALSE division colour). Shape + label always
   shown together (CVD-safe). */
// (IX = the crossed-cannon/anchor shield is an 1864 design — inert here; no IX-Corps unit appears at the two
//  badge-eligible 1863 fields. If a late-war scenario is ever added, gate the shield to 1864+.)
var _CORPS_SHAPE = { 1: "disc", 2: "trefoil", 3: "diamond", 5: "maltese-cross", 6: "greek-cross", 9: "shield", 11: "crescent", 12: "star" };
var _DIV_COLOR = { 1: "#c0392b", 2: "#f2efe4", 3: "#2f4d8a", 4: "#3a7d3a" };
var _DIV_NAME = { 1: "1st Division (red)", 2: "2nd Division (white)", 3: "3rd Division (blue)", 4: "4th Division (green)" };
/* surname -> { corps, div } for badge-eligible units whose name omits the corps
   tag, or to pin the division (the parenthetical "(I Corps)" tags resolve the
   rest). Citation-grade per DECISIONS D131. */
var _CORPS_BY_NAME = {
  doubleday: { corps: 1, div: 3 }, // 3rd Div, I Corps (Gettysburg)
  stannard:  { corps: 1, div: 3 }, // 2nd Vermont Bde, 3rd Div, I Corps
  caldwell:  { corps: 2, div: 1 }, // 1st Div, II Corps (Gettysburg)
  ayres:     { corps: 5, div: 2 }, // 2nd Div (Regulars), V Corps (Gettysburg)
  whipple:   { corps: 3, div: 3 }, // 3rd Div, III Corps (Chancellorsville)
  sedgwick:  { corps: 6, div: 0 }  // VI Corps commander (Chancellorsville)
};
function _romanToInt(r) {
  var map = { i: 1, v: 5, x: 10 }, total = 0, prev = 0;
  for (var k = r.length - 1; k >= 0; k--) {
    var val = map[r.charAt(k)]; if (!val) return 0;
    if (val < prev) total -= val; else { total += val; prev = val; }
  }
  return total;
}
function _fldCorpsBadge(u) {
  if (!u || !u.name || !u.side) return null;
  if (u.side !== "US") return null;                 // AotP corps badges are a Union institution
  if (!_fldBattleMeta().badges) return null;        // the anachronism gate
  var n = u.name.toLowerCase();

  var corps = 0, div = 0;
  // 1) an explicit "<roman> corps" in the name (the data tags most: "(I Corps)").
  var m = n.match(/\b([ivx]+)\s+corps\b/);
  if (m) corps = _romanToInt(m[1]);
  // 2) a division ordinal if present.
  var dm = n.match(/\b([1-4])(?:st|nd|rd|th)\s+division\b/);
  if (dm) div = parseInt(dm[1], 10);
  // 3) surname fallback (and to pin the division).
  if (!corps || !div) {
    for (var key in _CORPS_BY_NAME) {
      if (!Object.prototype.hasOwnProperty.call(_CORPS_BY_NAME, key)) continue;
      if (n.indexOf(key) >= 0) { if (!corps) corps = _CORPS_BY_NAME[key].corps; if (!div) div = _CORPS_BY_NAME[key].div; break; }
    }
  }
  if (!corps || !_CORPS_SHAPE[corps]) return null;

  var roman = "";
  var table = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  var rem = corps;
  for (var t = 0; t < table.length; t++) { while (rem >= table[t][0]) { roman += table[t][1]; rem -= table[t][0]; } }
  return {
    shape: _CORPS_SHAPE[corps],
    label: roman + " Corps",
    division: div,
    color: (div && _DIV_COLOR[div]) ? _DIV_COLOR[div] : "#d8cba0",
    divLabel: (div && _DIV_NAME[div]) ? _DIV_NAME[div] : ""
  };
}

/* ===========================================================================
   PROCEDURAL FLAG CANVAS  (single source of geometry — 2D blit + 3D texture +
   HUD data-URI all read from here; no external assets, no async image load).
   =========================================================================== */
function _fldDrawStarsStripes(ctx, c, w, h, swallowtail) {
  // c = [white, red, blue]
  var rect = function (x, y, rw, rh, f) { ctx.fillStyle = f; ctx.fillRect(x, y, rw, rh); };
  var circle = function (x, y, r, f) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = f; ctx.fill(); };
  rect(0, 0, w, h, c[0]);
  var stripeH = h / 13;
  for (var si = 0; si < 13; si++) if (si % 2 === 0) rect(0, si * stripeH, w, stripeH, c[1]);
  var cantonW = w * 0.4, cantonH = h * 7 / 13;
  rect(0, 0, cantonW, cantonH, c[2]);
  var starR = Math.max(0.6, cantonH * 0.07);
  for (var row = 0; row < 5; row++) for (var col = 0; col < 7; col++) {
    if (row * 7 + col >= 34) break;
    circle(cantonW * (0.09 + col * 0.13), cantonH * (0.13 + row * 0.19), starR, c[0]);
  }
  if (swallowtail) {
    ctx.save(); ctx.globalCompositeOperation = "destination-out";
    var notch = w * 0.26;
    ctx.beginPath(); ctx.moveTo(w, h / 2); ctx.lineTo(w - notch, h / 2); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(w, h / 2); ctx.lineTo(w - notch, h / 2); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
function _fldFlagDrawCanvas(ctx, flag, w, h) {
  var c = flag.colors || ["#ccc", "#fff", "#333"];
  var rect = function (x, y, rw, rh, f) { ctx.fillStyle = f; ctx.fillRect(x, y, rw, rh); };
  var circle = function (x, y, r, f) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = f; ctx.fill(); };
  var poly = function (points, f) { if (!points.length) return; ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]); for (var pi = 1; pi < points.length; pi++) ctx.lineTo(points[pi][0], points[pi][1]); ctx.closePath(); ctx.fillStyle = f; ctx.fill(); };
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = "round";

  switch (flag.pattern) {
    case "stars-stripes": _fldDrawStarsStripes(ctx, c, w, h, false); break;
    case "guidon":        _fldDrawStarsStripes(ctx, c, w, h, true);  break;

    case "southern-cross": // c = [red field, white border/stars, blue saltire]
      rect(0, 0, w, h, c[0]);
      // blue saltire as two crossbars (drawn thick on the diagonal)
      ctx.save();
      ctx.strokeStyle = c[1]; ctx.lineWidth = h * 0.30; // white fimbriation (under)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
      ctx.strokeStyle = c[2]; ctx.lineWidth = h * 0.20; // blue saltire (over)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
      ctx.restore();
      // 13 white stars along the saltire
      var sp = [[0.5, 0.5], [0.30, 0.30], [0.70, 0.30], [0.30, 0.70], [0.70, 0.70], [0.16, 0.16], [0.84, 0.16], [0.16, 0.84], [0.84, 0.84], [0.50, 0.18], [0.50, 0.82], [0.18, 0.50], [0.82, 0.50]];
      for (var sti = 0; sti < sp.length; sti++) circle(sp[sti][0] * w, sp[sti][1] * h, h * 0.05, c[1]);
      ctx.strokeStyle = c[1]; ctx.lineWidth = 1.25; ctx.strokeRect(0.6, 0.6, w - 1.2, h - 1.2);
      break;

    case "first-national": // c = [red bar, white bar, blue canton]
      rect(0, 0, w, h, c[1]);            // white middle bar (base)
      rect(0, 0, w, h / 3, c[0]);        // top red bar
      rect(0, h * 2 / 3, w, h / 3, c[0]); // bottom red bar
      var cw = w * 0.5, ch = h * 2 / 3;
      rect(0, 0, cw, ch, c[2]);          // blue canton
      var ns = 7, rr = ch * 0.30, ccx = cw / 2, ccy = ch / 2;
      for (var k = 0; k < ns; k++) { var a = -Math.PI / 2 + k * 2 * Math.PI / ns; circle(ccx + rr * Math.cos(a), ccy + rr * Math.sin(a), Math.max(0.7, ch * 0.06), c[1]); }
      break;

    case "harp": // c = [green, gold, cream]
      rect(0, 0, w, h, c[0]);
      ctx.strokeStyle = c[1]; ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2);
      // a sunburst behind the harp
      ctx.save(); ctx.strokeStyle = c[1]; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.55;
      for (var rb = 0; rb < 12; rb++) { var ra = rb * Math.PI / 6; ctx.beginPath(); ctx.moveTo(w / 2, h * 0.52); ctx.lineTo(w / 2 + Math.cos(ra) * w * 0.5, h * 0.52 + Math.sin(ra) * h * 0.5); ctx.stroke(); }
      ctx.restore();
      // a simplified harp
      ctx.strokeStyle = c[1]; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.34, h * 0.22); ctx.lineTo(w * 0.34, h * 0.80); ctx.lineTo(w * 0.66, h * 0.80); ctx.lineTo(w * 0.66, h * 0.34);
      ctx.quadraticCurveTo(w * 0.50, h * 0.12, w * 0.34, h * 0.22);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.40, h * 0.34); ctx.lineTo(w * 0.62, h * 0.50);
      ctx.moveTo(w * 0.40, h * 0.48); ctx.lineTo(w * 0.60, h * 0.62);
      ctx.moveTo(w * 0.40, h * 0.62); ctx.lineTo(w * 0.58, h * 0.72);
      ctx.stroke();
      break;

    case "hardee": // c = [blue field, white disc]
      rect(0, 0, w, h, c[0]);
      ctx.strokeStyle = c[1]; ctx.lineWidth = Math.max(1, h * 0.05); ctx.strokeRect(h * 0.05, h * 0.05, w - h * 0.10, h - h * 0.10);
      circle(w / 2, h / 2, h * 0.32, c[1]);
      break;

    case "polk": // c = [blue field, white border, red cross]
      rect(0, 0, w, h, c[0]);
      var aw = h * 0.26, bd = h * 0.05;
      rect(0, (h - aw) / 2 - bd, w, aw + 2 * bd, c[1]);            // horizontal white
      rect((w - aw) / 2 - bd, 0, aw + 2 * bd, h, c[1]);           // vertical white
      rect(0, (h - aw) / 2, w, aw, c[2]);                         // horizontal red
      rect((w - aw) / 2, 0, aw, h, c[2]);                         // vertical red
      var pcx = [w / 2, w * 0.18, w * 0.82, w / 2, w / 2], pcy = [h / 2, h / 2, h / 2, h * 0.18, h * 0.82];
      for (var pk = 0; pk < 5; pk++) circle(pcx[pk], pcy[pk], h * 0.05, c[1]);
      break;

    case "lone-star": // c = [blue, white, red]
      rect(0, 0, w, h, c[0]);
      rect(w / 3, 0, w * 2 / 3, h / 2, c[1]);
      rect(w / 3, h / 2, w * 2 / 3, h / 2, c[2]);
      _fldFillStar(ctx, w / 6, h / 2, h * 0.25, c[1]);
      break;

    default:
      rect(0, 0, w, h, c[0] || "#888");
      break;
  }
}
function _fldFillStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (var pt = 0; pt < 5; pt++) {
    var ang = -Math.PI / 2 + pt * 2 * Math.PI / 5, angI = ang + Math.PI / 5;
    var ox = cx + r * Math.cos(ang), oy = cy + r * Math.sin(ang);
    var ix = cx + r * 0.38 * Math.cos(angI), iy = cy + r * 0.38 * Math.sin(angI);
    if (pt === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}

var _FLD_FLAG_CANVAS_CACHE = {}, _FLD_FLAG_URI_CACHE = {};
function _fldFlagEsc(v) {
  return (typeof htmlEsc === "function") ? htmlEsc(v)
    : String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
}
function _fldFlagKey(flag, w, h) {
  var c = (flag && flag.colors) ? flag.colors.join("|") : "";
  return (flag && flag.pattern || "solid") + "|" + c + "|" + (w || 0) + "x" + (h || 0);
}
function _fldFlagCanvas(flag, w, h) {
  if (!flag || typeof document === "undefined") return null;
  w = w || 88; h = h || 56;
  var key = _fldFlagKey(flag, w, h);
  if (_FLD_FLAG_CANVAS_CACHE[key]) return _FLD_FLAG_CANVAS_CACHE[key];
  var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  var ctx = cv.getContext && cv.getContext("2d"); if (!ctx) return null;
  _fldFlagDrawCanvas(ctx, flag, w, h);
  _FLD_FLAG_CANVAS_CACHE[key] = cv;
  return cv;
}
function _fldFlagDataUri(flag, w, h) {
  if (!flag) return "";
  var key = _fldFlagKey(flag, w || 66, h || 42);
  if (_FLD_FLAG_URI_CACHE[key]) return _FLD_FLAG_URI_CACHE[key];
  var cv = _fldFlagCanvas(flag, w || 66, h || 42); if (!cv) return "";
  try { var u = cv.toDataURL("image/png"); _FLD_FLAG_URI_CACHE[key] = u; return u; } catch (e) { return ""; }
}
function _fldFlagCanvasTexture(T, flag, w, h) {
  var cv = _fldFlagCanvas(flag, w, h); if (!cv || !T) return null;
  var tex = T.CanvasTexture ? new T.CanvasTexture(cv) : (T.Texture ? new T.Texture(cv) : null);
  if (!tex) return null;
  tex.needsUpdate = true;
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace; else if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
  if (T.LinearFilter) { tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; }
  tex.generateMipmaps = false; tex.anisotropy = 2;
  return tex;
}

/* ===========================================================================
   PROCEDURAL CORPS-BADGE CANVAS  (the Kearny-patch shapes; one geometry source)
   =========================================================================== */
function _fldBadgeDrawCanvas(ctx, badge, s) {
  var cx = s / 2, cy = s / 2, r = s * 0.38;
  var fill = badge.color || "#d8cba0", dark = "#15110b", halo = "#f4ecd6";
  ctx.clearRect(0, 0, s, s);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  var hw = Math.max(1.6, s * 0.16), dw = Math.max(0.8, s * 0.06);
  // Finish the CURRENT path with a 3-pass outline so the SHAPE SILHOUETTE reads on ANY background — the light
  // parchment halo lifts a dark (e.g. 3rd-division blue) badge off the dark HUD; the thin dark line defines it
  // against the light 3D field. (The shape — never colour alone — is the CVD-safe cue, so it must stay legible.)
  var finish = function () { ctx.lineWidth = hw; ctx.strokeStyle = halo; ctx.stroke(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = dw; ctx.strokeStyle = dark; ctx.stroke(); };
  var poly = function (pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); finish(); };

  switch (badge.shape) {
    case "disc":
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); finish(); break;

    case "diamond":
      poly([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]); break;

    case "trefoil": {
      var lr = r * 0.48, d = r * 0.44, lobes = [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6];
      // stem first (haloed), so the lobes overlay it
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + r);
      ctx.lineWidth = Math.max(2, s * 0.13); ctx.strokeStyle = halo; ctx.stroke();
      ctx.lineWidth = Math.max(1, s * 0.07); ctx.strokeStyle = dark; ctx.stroke();
      for (var li = 0; li < lobes.length; li++) { ctx.beginPath(); ctx.arc(cx + d * Math.cos(lobes[li]), cy + d * Math.sin(lobes[li]), lr, 0, Math.PI * 2); finish(); }
      break;
    }

    case "greek-cross": {
      var hwc = r * 0.32, len = r;
      poly([[cx - hwc, cy - len], [cx + hwc, cy - len], [cx + hwc, cy - hwc], [cx + len, cy - hwc], [cx + len, cy + hwc], [cx + hwc, cy + hwc], [cx + hwc, cy + len], [cx - hwc, cy + len], [cx - hwc, cy + hwc], [cx - len, cy + hwc], [cx - len, cy - hwc], [cx - hwc, cy - hwc]]);
      break;
    }

    case "maltese-cross": { // a cross pattée (flared arms) — distinct from the Greek cross
      var ih = r * 0.20, tw = r * 0.46, ln = r;
      poly([[cx - tw, cy - ln], [cx + tw, cy - ln], [cx + ih, cy - ih], [cx + ln, cy - tw], [cx + ln, cy + tw], [cx + ih, cy + ih], [cx + tw, cy + ln], [cx - tw, cy + ln], [cx - ih, cy + ih], [cx - ln, cy + tw], [cx - ln, cy - tw], [cx - ih, cy - ih]]);
      break;
    }

    case "star": {
      ctx.beginPath();
      for (var p = 0; p < 5; p++) {
        var ang = -Math.PI / 2 + p * 2 * Math.PI / 5, angI = ang + Math.PI / 5;
        var ox = cx + r * Math.cos(ang), oy = cy + r * Math.sin(ang), ix = cx + r * 0.40 * Math.cos(angI), iy = cy + r * 0.40 * Math.sin(angI);
        if (p === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath(); finish(); break;
    }

    case "crescent": {
      // a light halo coin, carved to a crescent, then a dark outline — reads on any background
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r + hw * 0.4, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.arc(cx + r * 0.50, cy - r * 0.10, r * 0.90, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.lineWidth = dw; ctx.strokeStyle = dark; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI * 0.36, Math.PI * 1.64); ctx.stroke();
      break;
    }

    case "shield": {
      ctx.beginPath();
      ctx.moveTo(cx - r, cy - r * 0.9); ctx.lineTo(cx + r, cy - r * 0.9);
      ctx.lineTo(cx + r, cy + r * 0.2); ctx.quadraticCurveTo(cx + r, cy + r, cx, cy + r * 1.1);
      ctx.quadraticCurveTo(cx - r, cy + r, cx - r, cy + r * 0.2);
      ctx.closePath(); finish();
      break;
    }

    default:
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); finish(); break;
  }
}
var _FLD_BADGE_CANVAS_CACHE = {}, _FLD_BADGE_URI_CACHE = {};
function _fldBadgeKey(badge, s) { return (badge.shape || "?") + "|" + (badge.color || "") + "|" + (s || 0); }
function _fldBadgeCanvas(badge, s) {
  if (!badge || typeof document === "undefined") return null;
  s = s || 40;
  var key = _fldBadgeKey(badge, s);
  if (_FLD_BADGE_CANVAS_CACHE[key]) return _FLD_BADGE_CANVAS_CACHE[key];
  var cv = document.createElement("canvas"); cv.width = s; cv.height = s;
  var ctx = cv.getContext && cv.getContext("2d"); if (!ctx) return null;
  _fldBadgeDrawCanvas(ctx, badge, s);
  _FLD_BADGE_CANVAS_CACHE[key] = cv;
  return cv;
}
function _fldBadgeDataUri(badge, s) {
  if (!badge) return "";
  var key = _fldBadgeKey(badge, s || 34);
  if (_FLD_BADGE_URI_CACHE[key]) return _FLD_BADGE_URI_CACHE[key];
  var cv = _fldBadgeCanvas(badge, s || 34); if (!cv) return "";
  try { var u = cv.toDataURL("image/png"); _FLD_BADGE_URI_CACHE[key] = u; return u; } catch (e) { return ""; }
}
function _fldBadgeCanvasTexture(T, badge, s) {
  var cv = _fldBadgeCanvas(badge, s); if (!cv || !T) return null;
  var tex = T.CanvasTexture ? new T.CanvasTexture(cv) : (T.Texture ? new T.Texture(cv) : null);
  if (!tex) return null;
  tex.needsUpdate = true;
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace; else if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding;
  if (T.LinearFilter) { tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; }
  tex.generateMipmaps = false; tex.anisotropy = 2;
  return tex;
}

/* ---- disposal helpers (flag + corps-badge texture maps + meshes) -------- */
function _fldFlagDisposeMaterialMaps(material) {
  if (!material) return;
  var mats = Array.isArray(material) ? material : [material];
  for (var i = 0; i < mats.length; i++) { var m = mats[i]; if (!m || !m.map) continue; try { if (m.map.dispose) m.map.dispose(); } catch (e) {} m.map = null; }
}
function _fldFlagDisposeMesh(mesh) {
  if (!mesh) return;
  if (mesh.geometry && mesh.geometry.dispose) mesh.geometry.dispose();
  _fldFlagDisposeMaterialMaps(mesh.material);
  if (mesh.material) { var mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]; for (var i = 0; i < mats.length; i++) { try { if (mats[i] && mats[i].dispose) mats[i].dispose(); } catch (e) {} } }
}
function _fld3dDisposeFlagMaps() {
  try {
    if (typeof __FIELD === "undefined" || !__FIELD.groups || !__FIELD.groups.traverse) return;
    __FIELD.groups.traverse(function (o) { if (o && (o.name === "flag" || o.name === "corpsbadge")) _fldFlagDisposeMaterialMaps(o.material); });
  } catch (e) {}
}

/* ---- 2D flag + badge rendering (called from the fld2dDraw seam) --------- */
function fldDrawFlags(ctx, v) {
  try {
    if (!_fldFlagOn()) return;
    var U = __FIELD.units; if (!U || !U.length) return;
    var ps = fldPlayerSide();
    for (var i = 0; i < U.length; i++) {
      var u = U[i]; if (!u || !u.alive) continue;
      if (__FIELD.fog && u.side !== ps && !fldVisible(ps, u)) continue;   // fog: a hidden foe shows no colours
      var flag = _fldFlagFor(u); if (!flag) continue;
      var cx = v.ox + u.x * v.s, cz = v.oz + u.z * v.s;
      // a small staff + the flag, drawn screen-upright above the block (legible as a map marker).
      var topY = cz - 24 * v.s, fw = 17 * v.s, fh = 11 * v.s;
      ctx.save();
      ctx.strokeStyle = "#2a2018"; ctx.lineWidth = Math.max(1, 1.4 * v.s);
      ctx.beginPath(); ctx.moveTo(cx, cz - 6 * v.s); ctx.lineTo(cx, topY - fh * 0.5); ctx.stroke();
      var fcv = _fldFlagCanvas(flag, 66, 42);
      if (fcv) {
        ctx.save(); ctx.shadowColor = "rgba(8,10,14,0.55)"; ctx.shadowBlur = 2 * v.s;
        ctx.drawImage(fcv, cx + 0.5 * v.s, topY - fh, fw, fh);
        ctx.restore();
        ctx.strokeStyle = "rgba(20,16,10,0.85)"; ctx.lineWidth = Math.max(0.6, 0.8 * v.s);
        ctx.strokeRect(cx + 0.5 * v.s, topY - fh, fw, fh);
      }
      // CVD-safe side glyph on the staff finial.
      ctx.fillStyle = "#f7efdd"; ctx.font = "bold " + Math.max(7, 8 * v.s) + "px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(u.side === "US" ? "U" : "C", cx, cz - 2 * v.s);
      // corps badge (post-Mar-1863 Eastern battles only), a small glyph by the staff base.
      var badge = _fldCorpsBadge(u);
      if (badge) { var bcv = _fldBadgeCanvas(badge, 30); if (bcv) { var bs = 11 * v.s; ctx.drawImage(bcv, cx - bs - 2 * v.s, cz - bs * 0.5, bs, bs); } }
      ctx.restore();
    }
    ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
  } catch (e) {}
}

/* ---- 3D flag (name "flag" — T18 ripples it) + corps badge plane --------- */
function fld3dBuildFlags() {
  try {
    if (!_fldFlagOn() || !window.THREE) return;
    var T = window.THREE;
    var U = __FIELD.units; if (!U || !U.length) return;
    for (var i = 0; i < U.length; i++) {
      var u = U[i];
      var g = __FIELD._u3d && __FIELD._u3d[u.id]; if (!g) continue;
      var flag = _fldFlagFor(u); if (!flag) continue;
      // replace the generic base flag plane with a textured one (keep the name so T18's ripple still finds it)
      var oldFlag = g.getObjectByName("flag");
      if (oldFlag) { g.remove(oldFlag); _fldFlagDisposeMesh(oldFlag); }
      var tex = _fldFlagCanvasTexture(T, flag, 88, 56);
      if (tex) {
        var flagMesh = new T.Mesh(new T.PlaneGeometry(22, 14), new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide, transparent: true }));
        flagMesh.position.set(0, 34, 0); flagMesh.name = "flag"; g.add(flagMesh);
      }
      // corps badge: a small plaque on the marker for badge-eligible battles only.
      var oldBadge = g.getObjectByName("corpsbadge");
      if (oldBadge) { g.remove(oldBadge); _fldFlagDisposeMesh(oldBadge); }
      var badge = _fldCorpsBadge(u);
      if (badge) {
        var btex = _fldBadgeCanvasTexture(T, badge, 40);
        if (btex) {
          var bMesh = new T.Mesh(new T.PlaneGeometry(11, 11), new T.MeshBasicMaterial({ map: btex, side: T.DoubleSide, transparent: true }));
          bMesh.position.set(0, 21, 0.7); bMesh.name = "corpsbadge"; g.add(bMesh);  // on the staff, just below the flag
        }
      }
    }
  } catch (e) {}
}

/* ---- HUD flag + badge display (called from the fldRenderHud seam) -------- */
function fldFlagHudSelected(u) {
  try {
    if (!_fldFlagOn() || !u) return "";
    var flag = _fldFlagFor(u); if (!flag) return "";
    var corps = _fldCorpsBadge(u);
    var meta = _fldBattleMeta();
    var flagUri = _fldFlagDataUri(flag, 66, 42);
    var html = '<div data-fld-flag-hud="1" role="group" aria-label="Battle colours" style="display:grid;grid-template-columns:62px minmax(0,1fr);align-items:start;gap:9px;margin-top:8px;padding:8px 9px;border:1px solid rgba(216,180,88,.34);border-radius:6px;background:rgba(5,7,10,.46);box-sizing:border-box;max-width:100%;overflow:hidden;">';
    if (flagUri) html += '<img src="' + flagUri + '" alt="' + _fldFlagEsc(flag.label) + '" data-flag-role="image" style="width:58px;height:37px;border:1px solid #b69863;border-radius:3px;flex:0 0 auto;box-shadow:0 0 0 1px rgba(0,0,0,.45),0 2px 5px rgba(0,0,0,.38);object-fit:cover;">';
    else html += '<span aria-hidden="true" style="width:58px;height:37px;border:1px solid #b69863;border-radius:3px;background:#201910;display:block;"></span>';
    html += '<div style="min-width:0;font-size:12px;line-height:1.42;color:#e9dcc0;">';
    html += '<div data-flag-role="title" style="color:#f7e9c9;font-weight:800;font-size:12.5px;line-height:1.25;overflow-wrap:anywhere;">' + _fldFlagEsc(flag.label) + '</div>';
    if (flag.caption) html += '<div data-flag-role="caption" style="color:#d8c79e;font-size:11.5px;line-height:1.35;margin-top:3px;overflow-wrap:anywhere;">' + _fldFlagEsc(flag.caption) + '</div>';
    if (corps) {
      var badgeUri = _fldBadgeDataUri(corps, 34);
      html += '<div data-flag-role="corps" style="display:flex;align-items:center;gap:7px;margin-top:7px;padding-top:6px;border-top:1px solid rgba(216,180,88,.22);min-width:0;">';
      if (badgeUri) html += '<img src="' + badgeUri + '" alt="' + _fldFlagEsc(corps.label) + ' badge" style="width:22px;height:22px;flex:0 0 auto;">';
      html += '<span style="color:#f0dfbd;font-size:11.5px;line-height:1.3;overflow-wrap:anywhere;">' + _fldFlagEsc(corps.label) + (corps.divLabel ? ' &middot; ' + _fldFlagEsc(corps.divLabel) : '') + '</span></div>';
    } else if (u.side === "US" && !meta.badges && /\bcorps\b/i.test(u.name || "")) {
      // the corps existed here, but no badge was worn yet — name the date (a teaching beat).
      html += '<div data-flag-role="corps-note" style="color:#d8c79e;font-size:11.5px;line-height:1.35;margin-top:6px;padding-top:6px;border-top:1px solid rgba(216,180,88,.18);overflow-wrap:anywhere;">Corps badges adopted Mar 1863 — not yet worn here.</div>';
    }
    html += '</div></div>';
    return html;
  } catch (e) { return ""; }
}

/* ---- gating helper ------------------------------------------------------ */
function _fldFlagOn() { try { return !!(G && G.settings && G.settings.battleFlags !== false); } catch (e) { return false; } }

/* ---- generic marker propagation: a fresh wrapper must NOT shadow the prior
   binding's introspection markers (the D130 lesson). Copies own marker props
   (._atmo / ._wx / ._t9audio / ._amb / T18's, and any sibling's) onto the new fn. */
function _fldFlagKeep(oldFn, newFn) {
  try { if (!oldFn || !newFn) return newFn; for (var k in oldFn) { if (Object.prototype.hasOwnProperty.call(oldFn, k)) { try { newFn[k] = oldFn[k]; } catch (e) {} } } } catch (e2) {}
  return newFn;
}

/* ---- install seam hooks (dispose flag/badge maps before unit/scene teardown) */
(function _fldFlagInstall() {
  try {
    _fldFlagInitSettings();
    if (typeof fld3dBuildUnits === "function" && !fld3dBuildUnits._t10FlagMaps) {
      var _origFld3dBuildUnits = fld3dBuildUnits;
      fld3dBuildUnits = _fldFlagKeep(_origFld3dBuildUnits, function () {
        try { _fld3dDisposeFlagMaps(); } catch (e) {}
        var _r = _origFld3dBuildUnits.apply(this, arguments);
        // Re-skin the freshly (re)built groups so a REINFORCEMENT arrival (T1 re-calls fld3dBuildUnits) also flies
        // the proper textured flag + corps badge — the base rebuild installs only a plain side-coloured flag
        // plane, which a fog-of-war-style untextured marker would leave on the new brigades and which T18 would
        // then cache. Idempotent (fld3dBuildFlags removes the old flag/badge first). At battle start fld3dInit
        // also calls fld3dBuildFlags — a cheap, harmless redundant pass.
        try { if (typeof fld3dBuildFlags === "function") fld3dBuildFlags(); } catch (e2) {}
        return _r;
      });
      fld3dBuildUnits._t10FlagMaps = true;
    }
    if (typeof fld3dDispose === "function" && !fld3dDispose._t10FlagMaps) {
      var _origFld3dDispose = fld3dDispose;
      fld3dDispose = _fldFlagKeep(_origFld3dDispose, function () {
        try { _fld3dDisposeFlagMaps(); } catch (e) {}
        return _origFld3dDispose.apply(this, arguments);
      });
      fld3dDispose._t10FlagMaps = true;
    }
  } catch (e) {}
})();
