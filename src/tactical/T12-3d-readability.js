/* ============================================================================
   src/tactical/T12-3d-readability.js

   Graphics follow-up: Modern 3D unit label + selection readability.

   The base Modern renderer already builds painted unit sprites, then M3D_PARITY
   decorates each group with a small stat badge. This module keeps that pipeline
   but replaces the badge drawing/decorating layer with a larger, high-contrast
   plate and adds a depth-test-free selected-unit halo. It is deliberately narrow:
   no camera, input, combat, or Classic renderer changes.
   ============================================================================ */

function _m3dReadabilityResetBadgeCache() {
  try {
    if (!__M3D || __M3D._readabilityBadgeRev === 1) return;
    if (__M3D.badgeCache) {
      for (var k in __M3D.badgeCache) {
        if (!Object.prototype.hasOwnProperty.call(__M3D.badgeCache, k)) continue;
        var e = __M3D.badgeCache[k];
        if (e && e.tex && e.tex.dispose) e.tex.dispose();
      }
    }
    __M3D.badgeCache = {};
    __M3D._readabilityBadgeRev = 1;
  } catch (e) {}
}

function _m3dFitText(g, text, maxWidth, startPx, minPx, weight) {
  var px = startPx, safe = String(text == null ? "" : text);
  weight = weight || "700";
  while (px > minPx) {
    g.font = weight + " " + px + "px 'Iowan Old Style',Palatino,Georgia,serif";
    if (g.measureText(safe).width <= maxWidth) return safe;
    px -= 2;
  }
  g.font = weight + " " + minPx + "px 'Iowan Old Style',Palatino,Georgia,serif";
  while (safe.length > 4 && g.measureText(safe + "...").width > maxWidth) safe = safe.slice(0, -1);
  return safe.length > 4 ? safe + "..." : safe;
}

function _m3dText(g, text, x, y, fill, stroke, lw) {
  g.lineWidth = lw || 4;
  g.strokeStyle = stroke || "rgba(0,0,0,0.72)";
  g.fillStyle = fill || "#f4ead2";
  g.strokeText(text, x, y);
  g.fillText(text, x, y);
}

function _m3dBadgeCanvas(u) {
  var cv = document.createElement("canvas");
  cv.width = 384; cv.height = 148;
  var g = cv.getContext("2d");
  var w = cv.width, h = cv.height;
  var selected = (G.sel === u);
  var sideCol = u.side === "US" ? "#1f4d8f" : "#7a633d";
  var sideLt = u.side === "US" ? "#f1f7ff" : "#fff1cf";
  var border = selected ? "#ffd86a" : (u.side === "US" ? "#9ec2f2" : "#d9bf86");

  g.fillStyle = "rgba(8,10,13,0.88)";
  _m3dRR(g, 0, 0, w, h, 22); g.fill();
  g.lineWidth = selected ? 8 : 5;
  g.strokeStyle = border;
  _m3dRR(g, 4, 4, w - 8, h - 8, 18); g.stroke();

  g.fillStyle = sideCol;
  _m3dRR(g, 12, 12, w - 24, 45, 13); g.fill();
  g.lineWidth = 2;
  g.strokeStyle = "rgba(255,255,255,0.28)";
  _m3dRR(g, 13, 13, w - 26, 43, 12); g.stroke();

  var nm = _m3dUnitShortName(u);
  g.textAlign = "left";
  g.textBaseline = "middle";
  nm = _m3dFitText(g, nm, w - 112, 31, 20, "800");
  _m3dText(g, nm, 24, 35, sideLt, "rgba(0,0,0,0.76)", 5);

  g.textAlign = "right";
  g.font = "800 24px 'Iowan Old Style',Palatino,Georgia,serif";
  _m3dText(g, u.side, w - 24, 35, sideLt, "rgba(0,0,0,0.76)", 5);

  var bx = 22, by = 78, bw = w - 44, bh = 28;
  var frac = u.maxStr > 0 ? Math.max(0, Math.min(1, u.strength / u.maxStr)) : 0;
  g.fillStyle = "rgba(0,0,0,0.62)";
  _m3dRR(g, bx, by, bw, bh, 8); g.fill();
  var barCol = frac > 0.6 ? "#69a64a" : frac > 0.3 ? "#d5a13d" : "#cf4c39";
  g.fillStyle = barCol;
  _m3dRR(g, bx, by, Math.max(4, bw * frac), bh, 8); g.fill();
  g.lineWidth = 3;
  g.strokeStyle = "rgba(245,230,194,0.48)";
  _m3dRR(g, bx, by, bw, bh, 8); g.stroke();
  g.font = "800 21px 'Iowan Old Style',Palatino,Georgia,serif";
  g.textAlign = "center";
  var cntTxt = String(u.strength) + " / " + String(u.maxStr || u.strength);
  // wcag-auditor: WCAG-AA contrast — float the count over a FIXED dark pill so its contrast never
  // depends on the variable green/amber/red bar fill underneath (#fff4d7 on ~#0a0c0f >> 4.5:1).
  var ctw = g.measureText(cntTxt).width, pillW = Math.min(bw - 6, ctw + 26), pillH = 22;
  g.fillStyle = "rgba(8,10,13,0.82)";
  _m3dRR(g, bx + bw / 2 - pillW / 2, by + bh / 2 - pillH / 2, pillW, pillH, 7); g.fill();
  _m3dText(g, cntTxt, bx + bw / 2, by + bh / 2 + 1, "#fff4d7", "rgba(0,0,0,0.72)", 4);

  var cy = 126, cx = 24;
  g.textAlign = "left";
  g.font = "800 18px 'Iowan Old Style',Palatino,Georgia,serif";
  var moralePct = u.maxMor ? Math.round((u.morale / u.maxMor) * 100) : 100;
  var ammoTxt = u.type === "hq" ? "HQ" : ("Ammo " + Math.max(0, Math.round(u.ammo || 0)));
  var xpTxt = "XP " + Math.max(0, u.xp || 0);
  var routTxt = u.routed ? " ROUT" : "";
  var row = "Morale " + moralePct + "%   " + ammoTxt + "   " + xpTxt + routTxt;
  row = _m3dFitText(g, row, w - 48, 18, 14, "800");
  _m3dText(g, row, cx, cy, u.routed ? "#ff9a83" : "#f4ead2", "rgba(0,0,0,0.74)", 4);
  return cv;
}

function _m3dAddSelectionReadability(grp, u) {
  try {
    if (!grp || G.sel !== u || !window.THREE) return;
    var T = window.THREE;
    var reg = __M3D._t12Disp || (__M3D._t12Disp = []);
    var lowT = (typeof _m3dLowTier === "function") ? _m3dLowTier() : false;
    var matOuter = new T.MeshBasicMaterial({
      color: new T.Color("#ffd86a"), side: T.DoubleSide, transparent: true,
      opacity: 0.95, depthTest: false, depthWrite: false
    });
    var geoOuter = new T.RingGeometry(2.0, 2.36, lowT ? 28 : 44);
    var outer = new T.Mesh(geoOuter, matOuter);
    outer.rotation.x = -Math.PI / 2; outer.position.y = 0.28; outer.renderOrder = 11;
    grp.add(outer); reg.push(geoOuter, matOuter);
    // Intel UHD-617 floor: low tier gets a single thin selection ring; skip the richer inner ring + staff.
    if (lowT) return;
    var matInner = new T.MeshBasicMaterial({
      color: new T.Color(u.side === "US" ? "#b9d6ff" : "#ffe0a3"), side: T.DoubleSide,
      transparent: true, opacity: 0.78, depthTest: false, depthWrite: false
    });
    var geoInner = new T.RingGeometry(1.25, 1.45, 36);
    var inner = new T.Mesh(geoInner, matInner);
    inner.rotation.x = -Math.PI / 2; inner.position.y = 0.31; inner.renderOrder = 12;
    grp.add(inner); reg.push(geoInner, matInner);
    var geoStaff = new T.CylinderGeometry(0.045, 0.045, 4.5, 6);
    var matStaff = new T.MeshBasicMaterial({ color: new T.Color("#ffd86a"), transparent: true, opacity: 0.66, depthTest: false, depthWrite: false });
    var staff = new T.Mesh(geoStaff, matStaff);
    staff.position.set(0, 2.35, 0); staff.renderOrder = 12;
    grp.add(staff); reg.push(geoStaff, matStaff);
  } catch (e) {}
}

function _m3dDecorateUnits() {
  if (!__M3D || !__M3D.unitGroup || !G.battle || !window.THREE) return;
  _m3dReadabilityResetBadgeCache();
  // Dispose the PREVIOUS decoration cycle's T12-owned geometries/materials. _m3dBuildUnits rebuilds the
  // unit group each sync and removes children WITHOUT disposing, so without this the per-unit
  // SpriteMaterials and the selection ring/staff geometries+materials leak GPU memory every sync. The
  // shared cached badge TEXTURES live in __M3D.badgeCache and are intentionally NOT disposed here.
  if (__M3D._t12Disp) { for (var dd = 0; dd < __M3D._t12Disp.length; dd++) { try { __M3D._t12Disp[dd].dispose(); } catch (e0) {} } }
  __M3D._t12Disp = [];
  var T = window.THREE;
  if (!__M3D.badgeCache) __M3D.badgeCache = {};
  var cache = __M3D.badgeCache, kk;
  for (kk in cache) if (Object.prototype.hasOwnProperty.call(cache, kk)) cache[kk].used = false;
  var lowT = (typeof _m3dLowTier === "function") ? _m3dLowTier() : false;
  var kids = __M3D.unitGroup.children;
  for (var i = 0; i < kids.length; i++) {
    var grp = kids[i];
    var u = grp.userData && grp.userData.unit;
    if (!u) continue;
    _m3dAddSelectionReadability(grp, u);
    var tex = _m3dBadgeTex(u);
    if (!tex) continue;
    var mat = new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
    __M3D._t12Disp.push(mat); // .map is the shared cached badge texture — SpriteMaterial.dispose() leaves it intact
    var spr = new T.Sprite(mat);
    var selected = (G.sel === u);
    var bw = selected ? (lowT ? 3.8 : 4.2) : (lowT ? 2.8 : 3.15);
    var bh = bw * (148 / 384);
    spr.scale.set(bw, bh, 1);
    spr.center.set(0.5, 0);
    spr.position.set(0, selected ? 5.35 : (u.type === "hq" ? 5.05 : 4.7), 0);
    spr.userData = { unit: u, kind: "unit" };
    spr.renderOrder = selected ? 15 : 14;
    grp.add(spr);
  }
  var keys = Object.keys(cache);
  if (keys.length > 140) {
    for (var j = 0; j < keys.length; j++) {
      var e = cache[keys[j]];
      if (!e.used) {
        if (e.tex && e.tex.dispose) e.tex.dispose();
        delete cache[keys[j]];
      }
    }
  }
}
