/* ============================================================================
   22-flag-portrait-fallback.js — D483 : THE FLAG-CARD PORTRAIT DEFAULT
   ----------------------------------------------------------------------------
   Aaron (2026-07-20): "change the default egg shaped picture for no pic people
   in game (default should be union or confederate flag type themed card)".

   Anyone the portrait chain cannot photograph (the generated prosopography
   register, minor officers, any name with no PD photo in either tier) used to
   fall to the frozen base's procedural oval ENGRAVING (data:image/png) — the
   "egg". This module wraps window.portraitFor ONE tier above src/21's embed
   layer and replaces that final fallback with a runtime-drawn, side-themed
   FLAG CARD in the shipped 96x120 oval-mount frame idiom:

     US — the 34-star-era national colors: navy canton with a star grid over
          red/cream stripes (muted to the app's aged-parchment palette).
     CS — the FIRST NATIONAL "Stars and Bars": three bars + a navy canton with
          the 1861 seven-star circle. DELIBERATELY not the battle flag: for a
          DEFAULT UI card the period-accurate national flag is the honest
          government-roster emblem, and the teaching game keeps the battle
          flag where it is taught as content, never as decoration (the
          anti-Lost-Cause standard; Aaron may override — one function).

   The two cards are distinguishable by PATTERN, not hue alone (stripes+grid
   vs bars+circle) — CVD-safe by redundant encoding. A cream cartouche carries
   the person's initials so cards stay individually scannable.

   PREFERENCE ORDER (unchanged above, upgraded below):
     1. base hi-res photo (jpeg)      — never touched
     2. src/21 embedded photo (jpeg)  — never touched
     3. THE FLAG CARD (png)           — replaces
     4. base procedural engraving     — now only the no-canvas fail-closed path

   COMBAT BYTE-IDENTICAL BY CONSTRUCTION (D74): presentation only — no sim
   state, no fldRng, no save shape, no data. Pure reads + a cached canvas
   dataURL per (side, initials). NO new asset bytes (runtime canvas — the
   LANE-017 adjudication-1 embed-budget law). The wrap CARRIES the src/21
   tier (._prev._phe) per the wrapper-carry chain law.
   ========================================================================== */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  var prev = window.portraitFor;
  if (typeof prev !== "function" || prev._cwFlag) return;          // need the chain; install once

  var W = 96, H = 120, OX = W / 2, OY = 56, ORX = 40, ORY = 50;    // the shipped frame geometry
  // aged flag tones, muted into the app's parchment world. NOT the four reserved
  // D478 tier hexes (#9a9185/#6f9e5b/#9a86f1/#b8863c) — the one-language wall stands.
  var NAVY = "#3d4e66", RED = "#8f4a3e", CREAM = "#e8dcc0", CREAM_LT = "#f2e8ce";
  var BRASS = "#9c7a3c", BRASS_LT = "#c9a85f", INK = "#4a3a22";
  var CACHE = {};

  function _cwInitials(name) {
    var parts = String(name == null ? "" : name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    var a = parts[0].charAt(0), b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (a + b).toUpperCase();
  }
  function _cwStar(ctx, cx, cy, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 === 0) ? r : r * 0.42;
      var x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  }
  function _cwFlagUS(ctx) {
    var sh = H / 13;
    for (var i = 0; i < 13; i++) { ctx.fillStyle = (i % 2 === 0) ? RED : CREAM; ctx.fillRect(0, i * sh, W, sh + 1); }
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W * 0.5, sh * 7);
    ctx.fillStyle = CREAM_LT;
    for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) _cwStar(ctx, 7 + c * 11.5, 7 + r * 12.5, 2.7);
  }
  function _cwFlagCS(ctx) {
    // First National, 1861 seven-star circle
    ctx.fillStyle = RED; ctx.fillRect(0, 0, W, H / 3); ctx.fillRect(0, 2 * H / 3, W, H / 3 + 1);
    ctx.fillStyle = CREAM; ctx.fillRect(0, H / 3, W, H / 3);
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W * 0.5, 2 * H / 3);
    ctx.fillStyle = CREAM_LT;
    var cx = W * 0.25, cy = H / 3, R = 14;
    for (var i = 0; i < 7; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / 7;
      _cwStar(ctx, cx + R * Math.cos(a), cy + R * Math.sin(a), 2.7);
    }
  }
  /* the themed card: flag inside the shipped oval mount, aged wash + vignette,
     an initials cartouche. Cached per (side, initials). Null when canvas is
     unavailable -> the caller falls back to the base engraving (fail-closed). */
  function cwFlagCardFor(side, name) {
    var sd = (side === "CS") ? "CS" : "US";
    var ini = _cwInitials(name);
    var key = sd + ":" + ini;
    if (CACHE[key]) return CACHE[key];
    try {
      var oc = document.createElement("canvas"); oc.width = W; oc.height = H;
      var ctx = oc.getContext("2d"); if (!ctx) return null;
      ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath(); ctx.ellipse(OX, OY, ORX, ORY, 0, 0, Math.PI * 2); ctx.clip();
      (sd === "CS" ? _cwFlagCS : _cwFlagUS)(ctx);
      ctx.fillStyle = "rgba(216,201,164,0.26)"; ctx.fillRect(0, 0, W, H);       // age wash
      var vg = ctx.createRadialGradient(OX, OY, ORY * 0.55, OX, OY, ORY * 1.05);
      vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(18,11,4,0.45)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      ctx.beginPath(); ctx.arc(OX, OY, 15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(242,232,206,0.92)"; ctx.fill();
      ctx.strokeStyle = BRASS; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = INK; ctx.font = "bold 13px Georgia,serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(ini, OX, OY + 0.5);
      ctx.restore();
      ctx.strokeStyle = BRASS; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(OX, OY, ORX, ORY, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = BRASS_LT; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.ellipse(OX, OY, ORX - 2.2, ORY - 2.2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(120,92,44,0.4)"; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.ellipse(OX, OY, ORX + 2.4, ORY + 2.4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = BRASS_LT;
      var pins = [[8, 10], [W - 8, 10], [8, H - 10], [W - 8, H - 10]];
      for (var i = 0; i < pins.length; i++) { ctx.beginPath(); ctx.arc(pins[i][0], pins[i][1], 1.5, 0, Math.PI * 2); ctx.fill(); }
      var url = oc.toDataURL("image/png");
      CACHE[key] = url;
      return url;
    } catch (e) { return null; }
  }
  window.cwFlagCardFor = cwFlagCardFor;                            // probe + future-consumer surface

  function cwFlagPortraitFor(name, side, opts) {
    var r = null;
    try { r = prev(name, side, opts); } catch (e) { r = null; }
    try {
      if (typeof r === "string" && r.indexOf("data:image/jpeg") === 0) return r;   // ANY photo tier wins — never downgrade
      var c = cwFlagCardFor(side, name);
      return c || r;                                               // no canvas -> the base engraving (fail-closed)
    } catch (e2) { return r; }
  }
  cwFlagPortraitFor._cwFlag = true;
  cwFlagPortraitFor._prev = prev;                                  // the wrapper-carry chain (src/21's ._phe rides here)
  window.portraitFor = cwFlagPortraitFor;

  /* lead-badge pass (the src/21 idiom): the base MutationObserver builds battle
     lead badges through the CLOSURE portraitFor, so eggs there never reach this
     wrap. Swap any badge still showing a PNG that is not already a flag card;
     never touch a JPEG (no-downgrade); mark with data-flag-card so src/21's
     embedded-photo upgrade (which only ever REPLACES non-jpegs with jpegs)
     still wins whenever a real photo exists. */
  function _cwUpgrade() {
    try {
      var badges = document.querySelectorAll(".lead-badge[data-portrait-done]");
      for (var b = 0; b < badges.length; b++) {
        var badge = badges[b];
        if (badge.getAttribute("data-flag-card") === "1") continue;
        var img = badge.querySelector("img"); if (!img) continue;
        var src = img.src || img.getAttribute("src") || "";
        if (src.indexOf("data:image/jpeg") === 0) continue;        // a real photo — never downgrade
        var lnmEl = badge.querySelector(".lnm"); if (!lnmEl) continue;
        var nm = (lnmEl.textContent || "").replace(/\s*★\s*$/, "").trim(); if (!nm) continue;
        var side = "US";
        if (typeof G !== "undefined" && G.sel && G.sel.side) side = G.sel.side;
        var card = cwFlagCardFor(side, nm);
        if (card && src !== card) { img.src = card; badge.setAttribute("data-flag-card", "1"); }
      }
    } catch (e) {}
  }
  var pending = false;
  function _cwSchedule() {
    if (pending) return; pending = true;
    setTimeout(function () { pending = false; _cwUpgrade(); }, 60);
  }
  function _cwInstall() {
    try {
      var obs = new MutationObserver(function () { _cwSchedule(); });
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    _cwSchedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", _cwInstall);
  else _cwInstall();
})();
