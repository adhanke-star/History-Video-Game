/* ==== M3D_PARITY — Modern-renderer parity layer ====================================
   Closes the three gaps that kept Modern (WebGL) behind Classic (2D) and blocked
   flipping the default renderer:
     (1) NAMED-FEATURE LABELS  — the authored "Cornfield / Sunken Road / Hornet's Nest"
         ground labels (M.authoredFeatures), drawn as camera-facing parchment plaques
         on little brass stakes above their exact hex (Verified vs Inferred styling).
     (2) LIVE UNIT BADGES      — the strength bar + name + morale/ammo/xp glyphs Classic
         paints over each token, now floating above each 3D regiment (same live data:
         u.strength/maxStr, u.morale/maxMor, u.ammo/maxAmmo, u.xp).
     (3) 3D BATTLE FX          — the SAME transient G.fx queue emitFX() already fills
         (muzzle flash, drifting powder smoke, melee dust, floating −casualty numbers),
         rendered as world-space sprites and animated in the render loop.

   DESIGN: pure engine, ZERO new assets, file://-safe, Classic 2D 100% untouched.
   INTEGRATION: append-only at the engine-end marker. We OVERRIDE two tiny functions
   (_m3dSync, _m3dStartLoop) by redeclaration — JS function-declaration hoisting makes
   the LAST definition win everywhere they're called (draw()->_m3dSync; _m3dShow()->
   _m3dStartLoop). Both overrides replicate the original's small body verbatim, then add
   the new behaviour, so the originals (_m3dBuildTerrain/_m3dBuildUnits) are untouched and
   still called by name. All new state hangs off __M3D.* (created lazily) — no new const/let
   at module scope, no save-version touch. Everything guarded: if THREE / __M3D / G.battle
   isn't ready, every function early-returns and the game is unaffected.
   Honors reduceMotion implicitly: emitFX() creates nothing under reduceMotion, so the FX
   group stays empty; labels/badges are static (no animation) so they remain.
   ----------------------------------------------------------------------------------- */

/* ---- shared canvas->texture helper (sRGB-correct on r128, no-op on older) ---------- */
function _m3dTex(cv) {
  var T = window.THREE;
  var tex = new T.CanvasTexture(cv);
  tex.needsUpdate = true;
  if (T.SRGBColorSpace) tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 2;
  return tex;
}

/* ---- ensure the label + FX groups exist and are in the scene (lazy; no _m3dInit edit) */
function _m3dEnsureGroups() {
  if (!__M3D || !__M3D.scene || !window.THREE) return;
  var T = window.THREE;
  if (!__M3D.labelGroup) { __M3D.labelGroup = new T.Group(); __M3D.scene.add(__M3D.labelGroup); }
  if (!__M3D.fxGroup)    { __M3D.fxGroup    = new T.Group(); __M3D.scene.add(__M3D.fxGroup); }
  if (!__M3D.badgeCache) __M3D.badgeCache = {};   // signature -> {tex, used}
  if (!__M3D.fxShared)   __M3D.fxShared   = {};   // type -> shared soft-circle texture
  if (!__M3D.numCache)   __M3D.numCache   = {};   // "-N" -> texture
}

/* =================================================================================
   (1) NAMED-FEATURE LABELS
   ================================================================================= */

// Draw a parchment label plaque to an offscreen canvas (matches the 2D label palette:
// parchment fill #e8dcc0, brass border, dark serif text). Inferred features read lighter
// + italicised "(inferred)" tail so the Verified/Inferred discipline carries into 3D.
function _m3dLabelCanvas(text, inferred) {
  var pad = 26, fs = 48;
  var cv = document.createElement("canvas");
  var g = cv.getContext("2d");
  g.font = "italic 600 " + fs + "px 'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";
  var tw = Math.ceil(g.measureText(text).width);
  cv.width = tw + pad * 2;
  cv.height = fs + pad * 1.4;
  g = cv.getContext("2d");
  var w = cv.width, h = cv.height, r = 14;
  // rounded parchment plate
  g.beginPath();
  g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r);
  g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.closePath();
  g.fillStyle = inferred ? "rgba(232,220,192,0.80)" : "rgba(236,226,200,0.94)";
  g.fill();
  g.lineWidth = inferred ? 3 : 4.5;
  g.strokeStyle = inferred ? "rgba(156,122,60,0.55)" : "rgba(140,104,46,0.9)";
  if (inferred) g.setLineDash([10, 7]);
  g.stroke(); g.setLineDash([]);
  // text
  g.font = "italic 600 " + fs + "px 'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "rgba(20,14,8,0.35)"; g.fillText(text, w / 2 + 2, h / 2 + 2); // soft shadow
  g.fillStyle = inferred ? "#4a3c28" : "#241a10"; g.fillText(text, w / 2, h / 2);
  return { cv: cv, aspect: w / h };
}

// Build (or rebuild) the feature-label plaques for the current battle.
function _m3dBuildLabels() {
  if (!__M3D || !__M3D.labelGroup || !G.battle) return;
  var T = window.THREE, M = G.battle.M;
  var grp = __M3D.labelGroup;
  while (grp.children.length) { var c0 = grp.children[0]; grp.remove(c0); if (c0.material && c0.material.dispose) { if (c0.material.map && c0.material.map.dispose) c0.material.map.dispose(); c0.material.dispose(); } }
  var feats = M && M.authoredFeatures;            // only exact-hex authored features in 3D
  if (!feats || !feats.length) return;
  for (var i = 0; i < feats.length; i++) {
    var f = feats[i];
    if (f.c == null || f.r == null) continue;
    var tile = M.map[M.key(f.c, f.r)];
    if (!tile) continue;
    var elev = tile.elev || 0;
    var w = _m3dWorld(f.c, f.r, 0);
    var baseY = _m3dTileH(elev);
    var inferred = (f.conf === "Inferred");
    var lc;
    try { lc = _m3dLabelCanvas(f.label, inferred); } catch (e) { continue; }
    var mat = new T.SpriteMaterial({ map: _m3dTex(lc.cv), transparent: true, depthTest: true, depthWrite: false });
    var spr = new T.Sprite(mat);
    var labH = 1.7;                                // world height of the plaque
    spr.scale.set(labH * lc.aspect, labH, 1);
    spr.center.set(0.5, 0);                        // sit ABOVE its anchor point
    var labY = baseY + 5.2;                        // float clear of the unit billboards (~4.2)
    spr.position.set(w.x, labY, w.z);
    spr.renderOrder = 5;
    grp.add(spr);
    // thin brass stake from the ground up to the plaque + a small base nub on the hex
    var stakeH = labY - baseY;
    var stake = new T.Mesh(
      new T.CylinderGeometry(0.05, 0.05, stakeH, 5),
      new T.MeshBasicMaterial({ color: new T.Color(inferred ? "#8a7a4e" : "#b58a3c"), transparent: true, opacity: 0.85 })
    );
    stake.position.set(w.x, baseY + stakeH / 2, w.z);
    grp.add(stake);
    var nub = new T.Mesh(
      new T.SphereGeometry(0.16, 8, 6),
      new T.MeshBasicMaterial({ color: new T.Color(inferred ? "#8a7a4e" : "#b58a3c") })
    );
    nub.position.set(w.x, baseY + 0.12, w.z);
    grp.add(nub);
  }
}

/* =================================================================================
   (2) LIVE UNIT BADGES  — strength bar + name + morale/ammo/xp, same data as Classic
   ================================================================================= */

// Short display name for the plate (player-named veteran wins, else a terse type label).
function _m3dUnitShortName(u) {
  if (u.vetName) return u.vetName;
  if (typeof unitLabel === "function") {
    try { var l = unitLabel(u); if (l) return l; } catch (e) {}
  }
  var ty = { inf: "Infantry", cav: "Cavalry", art: "Artillery", hq: "Headquarters", nav: "Gunboat", fort: "Works" };
  return (ty[u.type] || "Regiment");
}

// Signature: rebuild the badge texture only when a shown stat changes (cache the rest).
function _m3dBadgeSig(u) {
  return u.id + "|" + (u.vetName || u.type) + "|" + u.strength + "/" + u.maxStr +
    "|m" + u.morale + "/" + u.maxMor + "|a" + (u.type === "hq" ? "-" : (u.ammo + "/" + u.maxAmmo)) +
    "|x" + (u.xp || 0) + "|" + (u.routed ? "R" : "") + "|" + (G.sel === u ? "S" : "");
}

// Draw the badge plate (name strip + strength bar + glyph row) to an offscreen canvas.
function _m3dBadgeCanvas(u) {
  var cv = document.createElement("canvas");
  cv.width = 256; cv.height = 104;
  var g = cv.getContext("2d");
  var w = cv.width, h = cv.height;
  var sideCol = u.side === "US" ? "#27406e" : "#6e5a36";
  var sideLt  = u.side === "US" ? "#cfe0f5" : "#f0e4c6";
  // backing plate
  g.fillStyle = "rgba(28,22,14,0.82)";
  _m3dRR(g, 0, 0, w, h, 16); g.fill();
  g.lineWidth = 4; g.strokeStyle = (G.sel === u) ? "#e8c46a" : "rgba(150,120,60,0.7)";
  _m3dRR(g, 2, 2, w - 4, h - 4, 14); g.stroke();
  // side bar (ownership, never color-only — also the name strip bg)
  g.fillStyle = sideCol; _m3dRR(g, 6, 6, w - 12, 34, 10); g.fill();
  // name
  g.font = "700 26px 'Iowan Old Style',Palatino,Georgia,serif";
  g.textAlign = "left"; g.textBaseline = "middle";
  g.fillStyle = sideLt;
  var nm = _m3dUnitShortName(u);
  if (g.measureText(nm).width > w - 28) { while (nm.length > 4 && g.measureText(nm + "…").width > w - 28) nm = nm.slice(0, -1); nm += "…"; }
  g.fillText(nm, 16, 24);
  // glyph: side mark at right of name strip (colorblind-safe redundancy)
  g.textAlign = "right"; g.fillText(u.side === "US" ? "✦" : "✕", w - 16, 24);
  // strength bar
  var bx = 14, by = 52, bw = w - 28, bh = 22;
  var frac = u.maxStr > 0 ? Math.max(0, Math.min(1, u.strength / u.maxStr)) : 0;
  g.fillStyle = "rgba(0,0,0,0.45)"; _m3dRR(g, bx, by, bw, bh, 6); g.fill();
  var barCol = frac > 0.6 ? "#5b8c3a" : frac > 0.3 ? "#c69a32" : "#a8402f";
  g.fillStyle = barCol; _m3dRR(g, bx, by, Math.max(2, bw * frac), bh, 6); g.fill();
  g.lineWidth = 2; g.strokeStyle = "rgba(150,120,60,0.55)"; _m3dRR(g, bx, by, bw, bh, 6); g.stroke();
  g.font = "700 17px 'Iowan Old Style',Palatino,Georgia,serif";
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#f3ead2";
  g.fillText(String(u.strength), bx + bw / 2, by + bh / 2 + 1);
  // glyph row (morale / ammo / xp / routed) — mirrors Classic's pips
  var gy = 90, gx = 16;
  g.textAlign = "left"; g.textBaseline = "middle";
  if (u.morale < u.maxMor * 0.4) { g.fillStyle = "#e06a5a"; g.beginPath(); g.arc(gx, gy, 6, 0, 7); g.fill(); gx += 18; }
  if (u.type !== "hq" && u.ammo <= 0) { g.fillStyle = "#caa14a"; g.font = "700 18px Georgia,serif"; g.fillText("∅", gx - 2, gy); gx += 18; }
  if (u.routed) { g.fillStyle = "#e06a5a"; g.font = "italic 700 18px Georgia,serif"; g.fillText("rout", gx, gy); gx += 50; }
  var xpN = Math.min(u.xp || 0, 5);
  for (var k = 0; k < xpN; k++) { g.fillStyle = "#e8c46a"; g.beginPath(); g.arc(gx + 6 + k * 14, gy, 5, 0, 7); g.fill(); }
  return cv;
}

// rounded-rect path helper (badge-local; named _m3dRR to avoid colliding with engine _rrectPath)
function _m3dRR(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// Get a cached badge texture for u (rebuild only on stat change), with light cache eviction.
function _m3dBadgeTex(u) {
  var sig = _m3dBadgeSig(u);
  var cache = __M3D.badgeCache;
  var hit = cache[sig];
  if (hit) { hit.used = true; return hit.tex; }
  var tex;
  try { tex = _m3dTex(_m3dBadgeCanvas(u)); } catch (e) { return null; }
  cache[sig] = { tex: tex, used: true };
  // evict if cache grows large (keep entries touched this pass)
  var keys = Object.keys(cache);
  if (keys.length > 120) {
    for (var i = 0; i < keys.length; i++) {
      var e = cache[keys[i]];
      if (!e.used) { if (e.tex && e.tex.dispose) e.tex.dispose(); delete cache[keys[i]]; }
    }
  }
  return tex;
}

// Add a badge sprite above each already-built unit group (called after _m3dBuildUnits).
function _m3dDecorateUnits() {
  if (!__M3D || !__M3D.unitGroup || !G.battle || !window.THREE) return;
  var T = window.THREE;
  // mark all cache entries unused; _m3dBadgeTex re-marks the live ones, then we evict
  var cache = __M3D.badgeCache, kk;
  for (kk in cache) cache[kk].used = false;
  var kids = __M3D.unitGroup.children;
  for (var i = 0; i < kids.length; i++) {
    var grp = kids[i];
    var u = grp.userData && grp.userData.unit;
    if (!u) continue;
    var tex = _m3dBadgeTex(u);
    if (!tex) continue;
    var mat = new T.SpriteMaterial({ map: tex, transparent: true, depthTest: true, depthWrite: false });
    var spr = new T.Sprite(mat);
    var bw = 2.7, bh = bw * (104 / 256);
    spr.scale.set(bw, bh, 1);
    spr.center.set(0.5, 0);
    spr.position.set(0, (u.type === "hq" ? 5.0 : 4.5), 0); // local to the unit group, above the billboard
    spr.userData = { unit: u, kind: "unit" };              // so clicking the badge still selects the unit
    spr.renderOrder = 6;
    grp.add(spr);
  }
}

/* =================================================================================
   (3) 3D BATTLE FX  — animate the shared G.fx transient queue as world sprites
   ================================================================================= */

// Shared radial soft-circle texture (smoke/dust/fire reuse one per tint).
function _m3dSoftTex(key, inner, outer) {
  if (__M3D.fxShared[key]) return __M3D.fxShared[key];
  var cv = document.createElement("canvas"); cv.width = cv.height = 64;
  var g = cv.getContext("2d");
  var grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grd.addColorStop(0, inner); grd.addColorStop(1, outer);
  g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 32, 0, 7); g.fill();
  var tex = _m3dTex(cv);
  __M3D.fxShared[key] = tex;
  return tex;
}

// Cached "-N" casualty-number texture.
function _m3dNumTex(val) {
  var keyS = "-" + val;
  if (__M3D.numCache[keyS]) return __M3D.numCache[keyS];
  var cv = document.createElement("canvas"); cv.width = 128; cv.height = 64;
  var g = cv.getContext("2d");
  g.font = "700 46px 'Iowan Old Style',Palatino,Georgia,serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "rgba(0,0,0,0.6)"; g.fillText("−" + val, 65, 34);
  g.fillStyle = "#ffcc66"; g.fillText("−" + val, 64, 32);
  var tex = _m3dTex(cv);
  __M3D.numCache[keyS] = tex;
  // bound the number cache
  var ks = Object.keys(__M3D.numCache);
  if (ks.length > 60) { var d = __M3D.numCache[ks[0]]; if (d && d.dispose) d.dispose(); delete __M3D.numCache[ks[0]]; }
  return tex;
}

// Build a sprite for one G.fx entry (or null to skip).
function _m3dMakeFXSprite(e) {
  var T = window.THREE, mat, spr;
  try {
    if (e.type === "smoke") {
      mat = new T.SpriteMaterial({ map: _m3dSoftTex("smoke", "rgba(225,225,225,0.95)", "rgba(210,210,210,0)"), transparent: true, depthWrite: false });
    } else if (e.type === "dust") {
      mat = new T.SpriteMaterial({ map: _m3dSoftTex("dust", "rgba(214,189,134,0.9)", "rgba(214,189,134,0)"), transparent: true, depthWrite: false });
    } else if (e.type === "fire") {
      mat = new T.SpriteMaterial({ map: _m3dSoftTex("fire", "rgba(255,240,170,1)", "rgba(255,150,40,0)"), transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    } else if (e.type === "num") {
      mat = new T.SpriteMaterial({ map: _m3dNumTex((e.val !== undefined) ? e.val : 0), transparent: true, depthWrite: false, depthTest: false });
    } else { return null; }
    spr = new T.Sprite(mat);
    spr.renderOrder = (e.type === "num") ? 9 : 7;
    return spr;
  } catch (err) { return null; }
}

// Position/scale/fade a live FX sprite by its age (mirrors drawFX's t = age/life).
function _m3dPlaceFX(e, age) {
  var spr = e.__m3d; if (!spr) return;
  var M = G.battle.M;
  var w = _m3dWorld(e.c, e.r, 0);
  var tile = M.map[M.key(e.c, e.r)];
  var elev = tile ? (tile.elev || 0) : 0;
  var baseY = _m3dTileH(elev);
  var t = Math.max(0, Math.min(1, age / e.life));
  var alpha = 1 - t;
  if (e.type === "smoke") {
    var rise = 1.6 + t * 3.2;
    var dx = (e.windDx || 0) * t * 5.0, dz = (e.windDy || 0) * t * 5.0;
    var ox = (e.offsetX || 0) * 0.04, oz = (e.offsetY || 0) * 0.04;
    var s = (e.radius || 7) * 0.30 * (1 + t * 0.7);
    spr.position.set(w.x + ox + dx, baseY + rise, w.z + oz + dz);
    spr.scale.set(s, s, 1);
    spr.material.opacity = alpha * 0.55;
  } else if (e.type === "dust") {
    var sd = (e.radius || 10) * 0.34 * (1 + t * 1.1);
    spr.position.set(w.x, baseY + 1.0 + t * 0.6, w.z);
    spr.scale.set(sd, sd, 1);
    spr.material.opacity = alpha * 0.5;
  } else if (e.type === "fire") {
    var sf = 2.4 * (0.6 + (1 - t) * 0.6);
    spr.position.set(w.x, baseY + 2.0, w.z);
    spr.scale.set(sf, sf, 1);
    spr.material.opacity = alpha * 0.95;
  } else if (e.type === "num") {
    var rn = 3.0 + t * 3.4;
    spr.position.set(w.x, baseY + rn, w.z);
    spr.scale.set(2.4, 1.2, 1);
    spr.material.opacity = Math.min(1, alpha * 1.1) * 0.98;
  }
}

// Per-frame: prune dead/removed FX, spawn new, update live. Reads the SAME G.fx emitFX fills,
// and prunes G.fx of expired entries too (Classic's drawFX never runs in Modern, so we must).
function _m3dFXUpdate(now) {
  if (!__M3D || !__M3D.ready || !__M3D.fxGroup || !G.battle || !window.THREE) return;
  var grp = __M3D.fxGroup;
  var fx = G.fx;
  if (!fx) { fx = G.fx = []; }
  // prune expired entries from G.fx (mirror drawFX's filter exactly)
  if (fx.length) {
    G.fx = fx.filter(function (f) { var a = now - f.born - (f.delay || 0); return a < f.life; });
    fx = G.fx;
  }
  // remove sprites whose backing entry is gone (expired or evicted by emitFX's cap)
  for (var i = grp.children.length - 1; i >= 0; i--) {
    var s = grp.children[i];
    var e0 = s.userData && s.userData.fx;
    if (!e0 || fx.indexOf(e0) < 0) {
      grp.remove(s);
      if (s.material && s.material.dispose) s.material.dispose(); // shared map textures are NOT disposed
      if (e0) e0.__m3d = null;
    }
  }
  // spawn/update sprites for live entries
  for (var j = 0; j < fx.length; j++) {
    var e = fx[j];
    var age = now - e.born - (e.delay || 0);
    if (age < 0) continue; // delayed puff not yet visible
    if (!e.__m3d) {
      var spr = _m3dMakeFXSprite(e);
      if (spr) { spr.userData = { fx: e }; e.__m3d = spr; grp.add(spr); }
    }
    if (e.__m3d) _m3dPlaceFX(e, age);
  }
}

/* =================================================================================
   OVERRIDES — redeclare the two small functions to weave in the new layers.
   Each replicates the ORIGINAL body verbatim, then adds parity calls.
   ================================================================================= */

// Original (line ~10683): rebuild terrain on battle change, then rebuild units.
// Added: build feature labels on battle change; decorate units with badges every sync.
function _m3dSync() {
  if (!__M3D.ready || !G.battle) return;
  _m3dEnsureGroups();
  if (__M3D.battleId !== G.battle.bd.id) {
    __M3D.battleId = G.battle.bd.id;
    _m3dBuildTerrain();
    _m3dBuildLabels();
    if (typeof _m3dApplyAtmosphere === "function") _m3dApplyAtmosphere(); // M3D_ATMOSPHERE hook: weather/day-phase light
    if (typeof _m3dBuildObjFlags === "function") _m3dBuildObjFlags();     // M3D_ATMOSPHERE hook: objective banners
  }
  _m3dBuildUnits();
  _m3dDecorateUnits();
  if (typeof _m3dSyncObjFlags === "function") _m3dSyncObjFlags();         // M3D_ATMOSPHERE hook: recolor banners by owner
}

// Original (line ~10709): RAF loop that updates controls then renders.
// Added: animate the 3D FX layer each frame from the live G.fx queue.
function _m3dStartLoop() {
  if (__M3D.raf) return;
  function tick() {
    __M3D.raf = requestAnimationFrame(tick);
    if (!_m3dModern() || !__M3D.ready) { cancelAnimationFrame(__M3D.raf); __M3D.raf = 0; return; }
    if (__M3D.controls) __M3D.controls.update();
    var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    try { _m3dFXUpdate(now); } catch (e) {}
    if (__M3D.renderer && __M3D.scene && __M3D.camera) __M3D.renderer.render(__M3D.scene, __M3D.camera);
  }
  __M3D.raf = requestAnimationFrame(tick);
}
