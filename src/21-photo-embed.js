/* ============================================================================
   21-photo-embed.js  —  H1 / D71 : THE OFFLINE PORTRAIT TIER
   ----------------------------------------------------------------------------
   Makes the single-file deliverable's public-domain PORTRAITS portable. The
   frozen base.html PD-photo layer (_warmPhotos) loads assets/portraits/<key>.jpg
   by RELATIVE PATH, so the real photos show only when the file is served beside
   the assets/ folder — opened standalone they 404 to the procedural engraving.
   The build now inlines a small, compressed, licence-vetted tier
   (assets/embed/portraits/, produced by tools/prep-embed-assets.mjs) into the
   bare-name global __ASSETS; this module overrides window.portraitFor so a real
   photo shows even with NO assets/ folder present.

   SCOPE NOTE (honest): this makes the PORTRAITS offline-portable. The 3D engine's
   terrain textures / HDRI sky / unit GLBs are SEPARATE asset categories (future
   H1 increments) and still resolve by relative path — the 3D scene is unaffected
   by this layer either way.

   PREFERENCE ORDER (best available wins, no quality regression where assets/ is present):
     1. base hi-res relative-path photo  (data:image/jpeg)  — sharpest; only when served beside assets/
     2. this embedded 128px tier         (offline-safe)     — the portability baseline
     3. base procedural engraving        (data:image/png)   — final fallback

   PERF: framing is LAZY (per-key, on demand) so the SERVED-FROM-ROOT path — where
   base hi-res already covers every portrait — frames ~nothing (no wasted boot-time
   JPEG encodes). When a one-shot probe image proves we're OFFLINE/standalone (the
   relative path 404s), the whole tier is warmed eagerly so the desk surfaces show
   photos without a re-navigation. Either way only the portraits actually shown get
   encoded on the slow path.

   COMBAT BYTE-IDENTICAL BY CONSTRUCTION (D74): touches NO combat file, NO sim
   state, never fldRng, no save / no save-version bump. It only swaps an <img>
   source on a presentation surface. NO-OP when __ASSETS carries no portraits.

   Function names are _phe* / phe* to avoid colliding with the frozen base.html
   portrait closures (_framePhoto / _photoMount / _photoLookup / _photoNorm /
   _photoKeys / _renderPortrait).
   ========================================================================== */
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  var orig = window.portraitFor;
  if (typeof orig !== "function" || orig._phe) return;            // need the base fn; install once

  var ASSETS = (typeof __ASSETS !== "undefined" && __ASSETS) ? __ASSETS : {};
  var RAW = {}, have = false, firstStem = null;                   // stem -> inline data: URL (unframed)
  for (var k in ASSETS) {
    if (Object.prototype.hasOwnProperty.call(ASSETS, k) && k.indexOf("portraits/") === 0) {
      var st = k.slice(10); RAW[st] = ASSETS[k]; have = true; if (firstStem === null) firstStem = st;
    }
  }
  if (!have) return;                                              // no embedded portraits -> byte-identical base behavior

  /* ---- period frame: mirrors build/base.html _framePhoto / _photoMount EXACTLY ---- */
  var W = 96, H = 120, OX = W / 2, OY = 56, ORX = 40, ORY = 50;
  var PARCH_LIGHT = "#f2e8ce", PARCH_BASE = "#e8dcc0", PARCH_DARK = "#d8c9a4";
  var BRASS = "#9c7a3c", BRASS_LT = "#c9a85f";

  function _pheMount(ctx) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.ellipse(OX, OY, ORX, ORY, 0, 0, Math.PI * 2);
    ctx.clip("evenodd");
    ctx.fillStyle = PARCH_BASE; ctx.fillRect(0, 0, W, H);
    var pg = ctx.createRadialGradient(W * 0.4, H * 0.33, 2, W * 0.5, H * 0.5, W * 0.72);
    pg.addColorStop(0, PARCH_LIGHT); pg.addColorStop(1, PARCH_DARK);
    ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);
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
  }
  function _pheFrame(img) {
    var oc = document.createElement("canvas"); oc.width = W; oc.height = H;
    var ctx = oc.getContext("2d");
    ctx.fillStyle = PARCH_BASE; ctx.fillRect(0, 0, W, H);
    var pg = ctx.createRadialGradient(W * 0.4, H * 0.33, 2, W * 0.5, H * 0.5, W * 0.72);
    pg.addColorStop(0, PARCH_LIGHT); pg.addColorStop(1, PARCH_DARK);
    ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(OX, OY, ORX, ORY, 0, 0, Math.PI * 2); ctx.clip();
    var dw = ORX * 2 + 8, dh = ORY * 2 + 12, dx = OX - dw / 2, dy = OY - dh / 2 - 3;
    var dr = dw / dh, sw, sh, sx, sy;
    if (img.width / img.height > dr) { sh = img.height; sw = sh * dr; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / dr; sx = 0; sy = (img.height - sh) * 0.12; }   // bias toward the head
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.fillStyle = "rgba(120,92,44,0.10)"; ctx.fillRect(dx, dy, dw, dh);
    var vg = ctx.createRadialGradient(OX, OY, ORY * 0.55, OX, OY, ORY * 1.05);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(18,11,4,0.45)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    _pheMount(ctx);
    return oc.toDataURL("image/jpeg", 0.85);
  }

  /* ---- LAZY framed cache: each stem is framed on first need, once ---- */
  var FRAMED = {}, FRAMING = {};
  function _pheFrameOne(stem) {
    if (FRAMED[stem] || FRAMING[stem] || !RAW[stem] || typeof Image === "undefined") return;
    FRAMING[stem] = true;
    var im = new Image();
    im.onload = function () { try { FRAMED[stem] = _pheFrame(im); } catch (e) {} delete FRAMING[stem]; _pheSchedule(); };
    im.onerror = function () { delete FRAMING[stem]; };
    im.src = RAW[stem];
  }
  // eager warm (ONLY when offline is detected — see _pheMaybeWarm): frame every stem now.
  function _pheWarm() { for (var stem in RAW) { if (Object.prototype.hasOwnProperty.call(RAW, stem)) _pheFrameOne(stem); } }

  /* ---- key normalization: mirrors base _photoNorm / _photoKeys exactly ---- */
  function _pheNorm(s) { return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function _pheKeys(name, side) {
    var b = _pheNorm(name), sd = (side === "US" || side === "CS") ? side.toLowerCase() : "";
    var ks = []; if (sd) ks.push(b + "_" + sd); ks.push(b); return ks;
  }
  // return the framed embedded photo if ready; otherwise trigger lazy framing of the best-matching
  // stem and return null (the caller falls to the engraving until the frame is ready + re-applied).
  function _pheLookup(name, side) {
    var ks = _pheKeys(name, side), need = null;
    for (var i = 0; i < ks.length; i++) {
      if (FRAMED[ks[i]]) return FRAMED[ks[i]];
      if (need === null && RAW[ks[i]]) need = ks[i];
    }
    if (need) _pheFrameOne(need);
    return null;
  }

  /* ---- the override: base hi-res photo (jpeg) wins; else embedded; else engraving (png) ---- */
  function phePortraitFor(name, side, opts) {
    try {
      var r = orig(name, side, opts);
      if (typeof r === "string" && r.indexOf("data:image/jpeg") === 0) return r;   // base hi-res photo present
      var emb = _pheLookup(name, side);
      return emb || r;                                                             // embedded offline baseline, else engraving
    } catch (e) { try { return orig(name, side, opts); } catch (e2) { return ""; } }
  }
  phePortraitFor._phe = true;
  window.portraitFor = phePortraitFor;

  /* ---- lead-badge upgrade: the base MutationObserver calls the CLOSURE portraitFor (not window),
          so battle lead badges never reach this tier through it. Swap the embedded photo into any
          .lead-badge <img> still showing an ENGRAVING. Skip any badge already showing a JPEG (a base
          hi-res photo OR our own embedded one) so we never DOWNGRADE the base hi-res — a badge built
          after base hi-res warmed gets hi-res from the closure portraitFor but carries no
          data-portrait-photo flag, so the src sniff (not the attribute) is the correct guard. ---- */
  function _pheUpgrade() {
    try {
      if (typeof document === "undefined") return;
      var badges = document.querySelectorAll(".lead-badge[data-portrait-done]");
      for (var b = 0; b < badges.length; b++) {
        var badge = badges[b];
        var img = badge.querySelector("img"); if (!img) continue;
        var src = img.src || img.getAttribute("src") || "";
        if (src.indexOf("data:image/jpeg") === 0) continue;       // already a photo (hi-res or embedded) — never downgrade
        var lnmEl = badge.querySelector(".lnm"); if (!lnmEl) continue;
        var nm = (lnmEl.textContent || "").replace(/\s*★\s*$/, "").trim(); if (!nm) continue;
        var side = "US";
        if (typeof G !== "undefined" && G.sel && G.sel.side) side = G.sel.side;
        var ph = _pheLookup(nm, side);                            // returns null + triggers framing if not ready yet
        if (ph) { img.src = ph; badge.setAttribute("data-photo-embed", "1"); }   // (a later _pheSchedule re-runs once framed)
      }
    } catch (e) {}
  }
  var pending = false;
  function _pheSchedule() {
    if (pending) return; pending = true;
    setTimeout(function () { pending = false; _pheUpgrade(); }, 50);
  }

  // Offline detection: try ONE relative-path portrait. If it loads we are served beside assets/ (base
  // hi-res covers everything) -> do NOT eager-warm (lazy framing handles any rare miss). If it 404s we
  // are standalone/offline -> warm the whole tier so the desk surfaces (which do not self-upgrade) show
  // photos promptly. This is the ONLY place the full tier is eagerly framed.
  function _pheMaybeWarm() {
    if (typeof Image === "undefined" || !firstStem) return;
    var probe = new Image();
    probe.onload = function () { /* served-from-root: base hi-res covers it; stay lazy */ };
    probe.onerror = function () { _pheWarm(); };
    probe.src = "assets/portraits/" + firstStem + ".jpg?phe=1";
  }

  function _pheInstall() {
    _pheMaybeWarm();
    try {
      var obs = new MutationObserver(function () { _pheSchedule(); });
      obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    _pheSchedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", _pheInstall);
  else _pheInstall();
})();
