/* ==== §20 — UI POLISH + MINIMAP (G4) ==== */

// ---- style injection (guarded: never duplicate) ----
(function(){
  if (document.getElementById("__g4_style__")) return;
  const s = document.createElement("style");
  s.id = "__g4_style__";
  s.textContent = `
/* ================================================================
   G4 — UI POLISH
   Scope: dark map-room panels only. NO canvas / battlefield CSS.
   Contrast notes accompany each changed color pair.
   ================================================================ */

/* ---- typography polish ---- */
/* Small-caps letterspaced labels for panel headers */
#topbar .crest {
  font-variant: small-caps;
  letter-spacing: .08em;
  font-size: 14px;
}
#topbar .field .k,
#objbar .hd,
#log .hd,
#info .hd .rl,
.regtable th,
.castable .c .lb {
  font-variant: small-caps;
  letter-spacing: .12em;
}

/* Heading polish: battle name in topbar gets a touch more weight */
#topbar .field .v {
  font-weight: 600;
  letter-spacing: .01em;
}

/* ---- engraved double-border panel frames ----
   Layered box-shadows create an outer dark channel + inner brass rim.
   Panel bg: #1c1610 (--panel). Outer shadow reads on #0d0a07 body.
   Contrast of panel text (--parch #e8dcc0) on panel bg (#1c1610): ~12:1 — AAA. */
#info,
#objbar,
#log,
#orders {
  box-shadow:
    0 0 0 1px rgba(0,0,0,.85),
    0 0 0 2px rgba(156,122,60,.18),
    0 3px 14px rgba(0,0,0,.6),
    inset 0 1px 0 rgba(201,168,95,.08);
}

/* ---- topbar / turnstrip frames ---- */
/* topbar already has border-bottom:2px solid var(--brass); augment with shadow depth */
#topbar {
  box-shadow:
    0 2px 0 rgba(0,0,0,.7),
    0 4px 16px rgba(0,0,0,.55),
    inset 0 1px 0 rgba(201,168,95,.12);
}
#turnstrip {
  box-shadow:
    0 0 0 1px rgba(0,0,0,.8),
    0 0 0 2px rgba(156,122,60,.15),
    0 4px 18px rgba(0,0,0,.55),
    inset 0 1px 0 rgba(201,168,95,.10);
}

/* Minimap border lift */
#minicv {
  box-shadow:
    0 0 0 1px rgba(0,0,0,.9),
    0 0 0 3px rgba(156,122,60,.22),
    0 4px 12px rgba(0,0,0,.5);
}

/* ---- button hover lift + :focus-visible brass outlines (a11y) ----

   Focus ring color: #c9a85f (--brass-lt) on panel bg #1c1610.
   Contrast of #c9a85f on #1c1610: ~5.6:1 — AA ✓ (WCAG AA requires 3:1 for UI components).

   Hover lift: translateY(-1px) + brightness for tactile feel.
*/

/* tbtn — topbar buttons */
.tbtn:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: 2px;
}
.tbtn:hover:not(:disabled) {
  transform: translateY(-1px);
  transition: transform .1s, background .12s, border-color .12s;
}

/* obtn — order buttons */
.obtn:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: 2px;
}
.obtn:hover:not([disabled]) {
  transform: translateY(-1px);
  transition: transform .1s, background .12s;
}

/* mbtn — main menu buttons */
.mbtn:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: 2px;
}
/* .mbtn already has :hover translateX(2px) — keep it, add focus ring only */

/* upg — upgrade screen purchase buttons */
.upg:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: 2px;
}

/* seg button — settings segmented controls */
/* seg button bg when off: #1a130c; --brass-lt on #1a130c: ~5.6:1 — AA ✓ */
.seg button:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: -2px;   /* inset so it shows inside the overflow:hidden seg */
  position: relative;
  z-index: 1;
}

/* brow — battle picker rows (are clickable, need focus ring) */
.brow:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: 2px;
}

/* bigbtn — primary action buttons */
/* bigbtn bg: linear-gradient(--ok #3a5a32, #2e4a26); --brass-lt on #3a5a32: ~3.8:1 — AA ✓ */
.bigbtn:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: 3px;
}
.bigbtn:hover {
  transform: translateY(-1px);
  transition: transform .1s, filter .12s;
}

/* ghostbtn — secondary/cancel buttons */
/* ghostbtn bg: #1c1610; --brass-lt on #1c1610: ~5.6:1 — AA ✓ */
.ghostbtn:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: 3px;
}
.ghostbtn:hover {
  transform: translateY(-1px);
  transition: transform .1s, border-color .12s, color .12s;
}

/* tab — battle picker tabs */
.tab:focus-visible {
  outline: 2px solid var(--brass-lt);
  outline-offset: 2px;
}

/* ---- scrollbar polish ----
   Thumb: #4a3c2c on track #120d07 — contrast ~1.9:1 (decorative, not text).
   Hover thumb: var(--rule) #8a7350 — improved grab affordance. */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track {
  background: #120d07;
  border-left: 1px solid rgba(0,0,0,.4);
}
::-webkit-scrollbar-thumb {
  background: #4a3c2c;
  border-radius: 4px;
  border: 2px solid #120d07;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--rule);
}

/* ---- order-button icon sizing ----
   SVG icons are prepended via JS; reserve left margin so label text
   doesn't crowd the icon. */
.obtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.obtn svg {
  flex: none;
  opacity: .85;
}
`;
  document.head.appendChild(s);
}());

// ---- order-button inline SVG icons (idempotent, aria-hidden, labels preserved) ----
// Icons are prepended as SVG elements; existing text labels remain intact.
// Each icon is 14×14 px, stroke-based, inherits currentColor.
(function(){
  // Map: button id → SVG path data (14×14 viewBox)
  const ICONS = {
    obMove:    // march arrow: rightward arrow with motion lines
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">'
      + '<line x1="1" y1="5" x2="5" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      + '<line x1="1" y1="7" x2="5" y2="7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      + '<line x1="1" y1="9" x2="5" y2="9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      + '<path d="M5 4 L12 7 L5 10 Z" fill="currentColor" opacity=".9"/>'
      + '</svg>',

    obFire:    // fire burst: radiating lines + central dot
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">'
      + '<circle cx="7" cy="7" r="2" fill="currentColor"/>'
      + '<line x1="7" y1="1" x2="7" y2="3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
      + '<line x1="7" y1="10.5" x2="7" y2="13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
      + '<line x1="1" y1="7" x2="3.5" y2="7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
      + '<line x1="10.5" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
      + '<line x1="2.8" y1="2.8" x2="4.6" y2="4.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
      + '<line x1="9.4" y1="9.4" x2="11.2" y2="11.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
      + '<line x1="11.2" y1="2.8" x2="9.4" y2="4.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
      + '<line x1="4.6" y1="9.4" x2="2.8" y2="11.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>'
      + '</svg>',

    obCharge:  // sabre: diagonal slash with crossguard
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">'
      + '<line x1="2" y1="12" x2="11" y2="3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
      + '<line x1="8" y1="3" x2="12" y2="3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      + '<line x1="10" y1="1" x2="10" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      + '<circle cx="3" cy="11" r="1.4" fill="currentColor" opacity=".7"/>'
      + '</svg>',

    obEntrench: // spade: shovel blade + handle
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">'
      + '<path d="M7 1 C4 1 3 4 5.5 5.5 L4.5 9 L5.5 9 L7 7 L8.5 9 L9.5 9 L8.5 5.5 C11 4 10 1 7 1 Z" fill="currentColor" opacity=".85"/>'
      + '<line x1="7" y1="9" x2="7" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
      + '<line x1="4.5" y1="12.5" x2="9.5" y2="12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
      + '</svg>',

    obDone:    // halt: raised hand / stop palm
      '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">'
      + '<rect x="3" y="6" width="8" height="6" rx="1.5" fill="currentColor" opacity=".8"/>'
      + '<rect x="5" y="2" width="1.8" height="5.5" rx=".9" fill="currentColor"/>'
      + '<rect x="7.2" y="1" width="1.8" height="6.5" rx=".9" fill="currentColor"/>'
      + '<rect x="9.4" y="2.5" width="1.8" height="5" rx=".9" fill="currentColor"/>'
      + '</svg>',
  };

  function prependIcon(id, svgStr) {
    const btn = document.getElementById(id);
    if (!btn) return;
    // idempotency: skip if icon already inserted
    if (btn.querySelector("svg")) return;
    const tmp = document.createElement("span");
    tmp.innerHTML = svgStr;
    const svg = tmp.firstChild;
    btn.insertBefore(svg, btn.firstChild);
  }

  // Defer until DOM is ready (runs after parse since script is at end of body)
  function applyIcons() {
    for (const [id, svgStr] of Object.entries(ICONS)) {
      prependIcon(id, svgStr);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyIcons);
  } else {
    applyIcons();
  }
}());

// ---- drawMini() redeclaration ----
// Fixes the dead viewport-rect code in the original.
//
// Viewport math (mental verification):
//
//   World-pixel space origin: colrowToPixel(0,0) = {x:0, y:0}
//   World-pixel width  = hexW() * GW      (rightmost center + half-hex = hexW()*(GW-0.5)+hexW()*0.5 = hexW()*GW)
//   World-pixel height = HEX*1.5*(GH-1) + HEX  (last row center + one HEX above)
//                      = HEX * (1.5*GH - 0.5)
//
//   Minimap pixel coords for a world point (wx, wy):
//     mx = wx / (hexW() * GW)           * minimap_w
//     my = wy / (HEX * (1.5*GH - 0.5)) * minimap_h
//
//   Screen corners in world space via screenToWorld(0,0) and screenToWorld(Wc,Hc).
//   Those get projected to minimap fractions, clamped to [0..1], then scaled to pixels.
//   strokeRect is drawn at (x0, y0, x1-x0, y1-y0).
//
//   Zoom sanity-check at two extremes:
//     zoom-out (G.cam.z → 0.4): screenToWorld sees a very large world slice;
//       mx0 would be negative (clamped to 0), mx1 large (clamped to minimap_w)
//       → rect nearly fills minimap. Correct.
//     zoom-in  (G.cam.z → 2.0): screenToWorld sees a small world slice;
//       rect will be a small box tracking the viewport. Correct.
//
function drawMini() {
  if (!G.battle) return;
  const B = G.battle, M = B.M;

  // canvas dimensions
  const mw = mcv.width, mh = mcv.height;
  mctx.clearRect(0, 0, mw, mh);

  const cw = mw / M.GW, ch = mh / M.GH;

  // ---- terrain layer (PALETTE if defined, else TCOL skin 2 fallback) ----
  const PMAP = (typeof PALETTE !== "undefined") ? PALETTE[G.settings.render] : TCOL[2];

  for (let r = 0; r < M.GH; r++) {
    for (let c = 0; c < M.GW; c++) {
      const t = M.map[M.key(c, r)];
      if (!t) continue;
      mctx.fillStyle = (PMAP && PMAP[t.t]) ? PMAP[t.t] : (TCOL[2][t.t] || "#999");
      mctx.fillRect(c * cw, r * ch, cw + 0.5, ch + 0.5);
    }
  }

  // ---- fog wash ----
  for (let r = 0; r < M.GH; r++) {
    for (let c = 0; c < M.GW; c++) {
      if (!isVisible(c, r)) {
        // cool blue-grey soft wash, consistent with draw() fog veil tone
        mctx.fillStyle = "rgba(18,14,28,0.58)";
        mctx.fillRect(c * cw, r * ch, cw + 0.5, ch + 0.5);
      }
    }
  }

  // ---- objective dots ----
  for (let r = 0; r < M.GH; r++) {
    for (let c = 0; c < M.GW; c++) {
      const t = M.map[M.key(c, r)];
      if (!t || !t.obj) continue;
      // owner color: union blue / reb tan / neutral gold
      mctx.fillStyle = t.owner === "US" ? "#3d6098"
                     : t.owner === "CS" ? "#9a7d62"
                     : "#cccc88";
      // slightly larger than a unit dot so objectives are legible
      const ox = c * cw + cw * 0.5, oy = r * ch + ch * 0.5;
      const rad = Math.max(2.5, Math.min(cw, ch) * 0.55);
      mctx.beginPath();
      mctx.arc(ox, oy, rad, 0, Math.PI * 2);
      mctx.fill();
    }
  }

  // ---- unit dots ----
  for (const u of B.units) {
    if (!u.alive) continue;
    // hide unsighted enemies
    if (u.side === B.enemySide && !u.spotted) continue;

    const ux = u.c * cw + cw * 0.5, uy = u.r * ch + ch * 0.5;
    const dotR = Math.max(1.8, Math.min(cw, ch) * 0.45);

    // spotted enemy: draw a slightly larger ring first, then filled dot
    if (u.side === B.enemySide && u.spotted) {
      mctx.strokeStyle = "rgba(232,220,192,0.75)"; // --parch ring
      mctx.lineWidth = 1;
      mctx.beginPath();
      mctx.arc(ux, uy, dotR + 1.5, 0, Math.PI * 2);
      mctx.stroke();
    }

    mctx.fillStyle = u.side === "US" ? "#5d86c4" : "#b89878";
    mctx.beginPath();
    mctx.arc(ux, uy, dotR, 0, Math.PI * 2);
    mctx.fill();
  }

  // ---- viewport rectangle (FIXED — was dead code in original) ----
  //
  // World pixel extents of the full grid:
  //   width:  hexW() * GW
  //   height: HEX * (1.5 * GH - 0.5)
  //
  // Map the screen corners (world space) to minimap pixel coords.
  // clamp prevents the rect from escaping the minimap canvas.
  //
  const worldW = hexW() * M.GW;
  const worldH = HEX * (1.5 * M.GH - 0.5);

  const topLeft  = screenToWorld(0,    0   );
  const botRight = screenToWorld(Wc,   Hc  );

  // Project to minimap fraction, clamp to [0..1]
  const rx0 = clamp(topLeft.x  / worldW, 0, 1) * mw;
  const ry0 = clamp(topLeft.y  / worldH, 0, 1) * mh;
  const rx1 = clamp(botRight.x / worldW, 0, 1) * mw;
  const ry1 = clamp(botRight.y / worldH, 0, 1) * mh;

  const rw = rx1 - rx0;
  const rh = ry1 - ry0;

  // Only draw if the rect has meaningful area (avoids degenerate 0-size stroke)
  if (rw > 0.5 || rh > 0.5) {
    mctx.strokeStyle = "rgba(232,220,192,0.82)"; // --parch, 1px crisply visible
    mctx.lineWidth = 1;
    mctx.strokeRect(rx0, ry0, Math.max(rw, 1), Math.max(rh, 1));
  }
}
