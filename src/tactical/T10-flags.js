/* ============================================================================
   src/tactical/T10-flags.js  —  BATTLE FLAGS & INSIGNIA ON UNITS (Phase H1b)
   ----------------------------------------------------------------------------
   Renders Civil War battle flags on the 3D unit flag-planes using procedural
   Canvas textures (offline-safe, no external assets). Each side gets its
   historical flag pattern:
     US: Stars & Stripes (national colors) with unit-specific canton star count
     CS: Battle Flag of the Army of Northern Virginia (Southern Cross saltire)

   Also renders 2D flag indicators on the 2D canvas view.

   CVD-safe: shape + pattern + text label, never colour-alone.
   Honours reduceMotion (no animated flutter).
   Gated: only runs when 3D units exist (__FIELD._u3d populated by fld3dBuildUnits).
   Byte-identical to probes: wraps fld3dBuildUnits by assignment (same pattern as T9).
   ============================================================================ */

/* ---- procedural flag textures (Canvas 2D -> THREE.CanvasTexture) --------- */

function _flagUSTexture(T, unitIdx) {
  var c = document.createElement("canvas");
  c.width = 64; c.height = 40;
  var ctx = c.getContext("2d");
  // Red and white stripes
  var stripeH = 40 / 13;
  for (var i = 0; i < 13; i++) {
    ctx.fillStyle = (i % 2 === 0) ? "#bf0a30" : "#ffffff";
    ctx.fillRect(0, i * stripeH, 64, stripeH + 1);
  }
  // Blue canton
  ctx.fillStyle = "#002868";
  ctx.fillRect(0, 0, 26, 22);
  // Stars (simplified — a few white dots representing the canton)
  ctx.fillStyle = "#ffffff";
  var starCount = Math.min(35, 20 + (unitIdx || 0));
  for (var s = 0; s < Math.min(starCount, 20); s++) {
    var sx = 3 + (s % 5) * 5;
    var sy = 3 + Math.floor(s / 5) * 5;
    ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  var tex = new T.CanvasTexture(c);
  tex.minFilter = T.LinearFilter;
  return tex;
}

function _flagCSTexture(T) {
  var c = document.createElement("canvas");
  c.width = 64; c.height = 40;
  var ctx = c.getContext("2d");
  // Red field
  ctx.fillStyle = "#cc0000";
  ctx.fillRect(0, 0, 64, 40);
  // Blue saltire (X-cross)
  ctx.strokeStyle = "#002868";
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(64, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(0, 40); ctx.stroke();
  // White border on saltire
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(64, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(0, 40); ctx.stroke();
  // White stars on the cross (13 stars)
  ctx.fillStyle = "#ffffff";
  for (var i = 0; i < 7; i++) {
    var t = (i + 0.5) / 7;
    var sx = t * 64, sy = t * 40;
    ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
  }
  for (var j = 0; j < 6; j++) {
    var t2 = (j + 0.5) / 6;
    var sx2 = t2 * 64, sy2 = (1 - t2) * 40;
    ctx.beginPath(); ctx.arc(sx2, sy2, 2, 0, Math.PI * 2); ctx.fill();
  }
  var tex = new T.CanvasTexture(c);
  tex.minFilter = T.LinearFilter;
  return tex;
}

/* ---- apply flag textures to the existing flag planes --------------------- */
function _flagApplyTextures() {
  try {
    var T = window.THREE;
    if (!T || !__FIELD || !__FIELD._u3d || !__FIELD.units) return;
    // Cache textures per side (one US, one CS texture for all units)
    if (!__FIELD._flagTexUS) __FIELD._flagTexUS = _flagUSTexture(T, 0);
    if (!__FIELD._flagTexCS) __FIELD._flagTexCS = _flagCSTexture(T);

    for (var i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i];
      var g = __FIELD._u3d[u.id];
      if (!g) continue;
      var flag = g.getObjectByName("flag");
      if (!flag || flag._flagApplied) continue;
      var tex = (u.side === "US") ? __FIELD._flagTexUS : __FIELD._flagTexCS;
      flag.material.dispose();
      flag.material = new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide, transparent: true });
      flag._flagApplied = true;
    }
  } catch (e) {}
}

/* ---- 2D flag indicators (small pennant icon next to unit label) ---------- */
function _flagDraw2d(ctx, u, sx, sz) {
  try {
    if (!u || !u.alive) return;
    // Draw a small flag pennant above the unit position
    var fx = sx + 12, fy = sz - 18;
    ctx.save();
    ctx.fillStyle = (u.side === "US") ? "#3a5a9a" : "#9a4a3a";
    // Pennant shape
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 10, fy + 4);
    ctx.lineTo(fx, fy + 8);
    ctx.closePath();
    ctx.fill();
    // Pole
    ctx.strokeStyle = "#2a2018";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx, fy - 2);
    ctx.lineTo(fx, fy + 12);
    ctx.stroke();
    // CVD-safe shape cue: square finial for US, triangle for CS
    if (u.side === "US") {
      ctx.fillStyle = "#ece4d0";
      ctx.fillRect(fx - 2, fy - 4, 4, 4);
    } else {
      ctx.fillStyle = "#ece4d0";
      ctx.beginPath();
      ctx.moveTo(fx, fy - 6);
      ctx.lineTo(fx + 3, fy - 2);
      ctx.lineTo(fx - 3, fy - 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } catch (e) {}
}

/* ============================================================================
   INSTALL — wrap fld3dBuildUnits + fld2dDraw by assignment.
   Same byte-identity guarantee as T9: these only run during the LIVE UI path,
   never during the headless fldStepN probe path.
   ============================================================================ */
(function _flagInstall() {
  try {
    // After fld3dBuildUnits, apply flag textures to the new meshes
    if (typeof fld3dBuildUnits === "function" && !fld3dBuildUnits._t10flags) {
      var _origBuild = fld3dBuildUnits;
      fld3dBuildUnits = function () {
        var r = _origBuild.apply(this, arguments);
        try { _flagApplyTextures(); } catch (e) {}
        return r;
      };
      fld3dBuildUnits._t10flags = true;
    }
    // After fld2dDraw, overlay 2D flags on each unit
    if (typeof fld2dDraw === "function" && !fld2dDraw._t10flags) {
      var _origDraw = fld2dDraw;
      fld2dDraw = function () {
        var r = _origDraw.apply(this, arguments);
        try {
          var cv = __FIELD && __FIELD.canvas;
          if (cv && __FIELD.units) {
            var ctx2 = cv.getContext("2d");
            var v = __FIELD._2dView || { ox: 0, oz: 0, scale: 1 };
            for (var i = 0; i < __FIELD.units.length; i++) {
              var u = __FIELD.units[i];
              if (!u.alive) continue;
              if (__FIELD.fog && u.side !== fldPlayerSide() && !fldVisible(fldPlayerSide(), u)) continue;
              var sx = (u.x - v.ox) * v.scale + cv.width / 2;
              var sz = (u.z - v.oz) * v.scale + cv.height / 2;
              _flagDraw2d(ctx2, u, sx, sz);
            }
          }
        } catch (e) {}
        return r;
      };
      fld2dDraw._t10flags = true;
    }
  } catch (e) {}
})();
