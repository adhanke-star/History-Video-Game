/* ===== M3D_PROPS2.js — signature battlefield dressing (append-only) =================
   The locked round-2 polish pick: the micro-dressing that defines famous ground, $0 /
   procedural, lit by HDRI + grade + shadows. Added to the SAME __M3D.propGroup that
   _m3dBuildProps clears + rebuilds, so it's torn down/rebuilt with the forests/buildings.

     - EARTHWORK REDOUBTS on `fort` hexes: a low brown parapet arc (the dirt the men
       threw up — Vicksburg/Franklin redans, fort revetments).
     - STONE WALLS at named "Wall/Sunken/Heights" features: a low fieldstone wall — the
       Stone Wall at Marye's Heights, the Sunken Road.
     - SNAKE-RAIL FENCES along a sample of `road` hexes: the zig-zag worm fence that
       lined every 1860s turnpike.
     - ORCHARDS at "Orchard/Cornfield" features: a regular grid of small trees (the Peach
       Orchard, the Cornfield) — reads ordered, distinct from the random woods scatter.

   INTEGRATION: redeclares the _m3dFrameUpdate dispatcher (winning) = camera dispatch
   VERBATIM + a _m3dBuildSignatureProps() call alongside _m3dBuildProps on battle change.
   Perf-tiered (off on low). Bare globals (G, HEX). Never throws.
   ------------------------------------------------------------------------------------ */

function _m3dBuildSignatureProps() {
  if (!__M3D || !__M3D.propGroup || !__M3D.ready || !G.battle || !window.THREE) return;
  if (typeof _m3dTreeBudget === "function" && _m3dTreeBudget() <= 0) return; // low tier → skip dressing
  var T = window.THREE, M = G.battle.M, grp = __M3D.propGroup;
  var shadows = __M3D.renderer.shadowMap.enabled;
  var S = __M3D.S, hx = HEX * S;
  var stoneMat = new T.MeshStandardMaterial({ color: new T.Color("#8c877d"), roughness: 1.0, flatShading: true });
  var railMat  = new T.MeshStandardMaterial({ color: new T.Color("#5a4a32"), roughness: 0.95 });
  var earthMat = new T.MeshStandardMaterial({ color: new T.Color("#6b5334"), roughness: 1.0 });
  var leafMat  = new T.MeshStandardMaterial({ color: new T.Color("#5f7a3a"), roughness: 0.9, flatShading: true });
  var trunkMat = new T.MeshStandardMaterial({ color: new T.Color("#5a4326"), roughness: 0.95 });

  function place(mesh, x, y, z, rot) { mesh.position.set(x, y, z); if (rot != null) mesh.rotation.y = rot; mesh.castShadow = shadows; mesh.receiveShadow = shadows; grp.add(mesh); }
  function hsh(n) { var v = Math.sin(n * 91.7 + 13.1) * 43758.5453; return v - Math.floor(v); }

  // 1) earthwork redoubts on fort hexes
  for (var r = 0; r < M.GH; r++) for (var c = 0; c < M.GW; c++) {
    var t = M.map[M.key(c, r)]; if (!t || t.t !== "fort") continue;
    var w = _m3dWorld(c, r, 0), by = _m3dTileH(t.elev || 0);
    var berm = new T.Mesh(new T.TorusGeometry(hx * 0.66, 0.5, 6, 14, Math.PI * 1.35), earthMat);
    berm.rotation.x = -Math.PI / 2; berm.rotation.z = hsh(c + r) * 6.28;
    place(berm, w.x, by + 0.25, w.z, null);
  }

  // 2) stone walls + 3) orchards at named features; 4) fences handled below
  var feats = M && M.authoredFeatures;
  if (feats) for (var fi = 0; fi < feats.length; fi++) {
    var f = feats[fi]; if (f.c == null || f.r == null || !f.label) continue;
    var lbl = String(f.label).toLowerCase();
    var tf = M.map[M.key(f.c, f.r)]; if (!tf) continue;
    var wf = _m3dWorld(f.c, f.r, 0), byf = _m3dTileH(tf.elev || 0);
    if (/wall|sunken|heights|angle/.test(lbl)) {
      // a low fieldstone wall across the hex (a row of irregular stones)
      var segN = 7, span = hx * 1.5, ang = hsh(f.c + f.r) * 3.14;
      for (var s = 0; s < segN; s++) {
        var sz = 0.45 + hsh(s + f.c) * 0.3;
        var stone = new T.Mesh(new T.BoxGeometry(span / segN * 1.05, 0.55 + sz * 0.4, 0.5 + sz * 0.25), stoneMat);
        var off = (s - (segN - 1) / 2) * (span / segN);
        place(stone, wf.x + Math.cos(ang) * off, byf + 0.28, wf.z + Math.sin(ang) * off, ang + (hsh(s) - 0.5) * 0.3);
      }
    } else if (/orchard|cornfield/.test(lbl)) {
      // ordered grid of small trees
      for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
        var tx = wf.x + ox * hx * 0.5, tz = wf.z + oy * hx * 0.5;
        var trunk = new T.Mesh(new T.CylinderGeometry(0.1, 0.14, 1.0, 5), trunkMat); place(trunk, tx, byf + 0.5, tz, null);
        var can = new T.Mesh(new T.IcosahedronGeometry(0.85, 0), leafMat); place(can, tx, byf + 1.5, tz, hsh(ox + oy * 3) * 6.28);
      }
    }
  }

  // 4) snake-rail (worm) fences along a sample of road hexes
  var placed = 0, FENCE_CAP = 26;
  for (var r2 = 0; r2 < M.GH && placed < FENCE_CAP; r2++) for (var c2 = 0; c2 < M.GW && placed < FENCE_CAP; c2++) {
    var t2 = M.map[M.key(c2, r2)]; if (!t2 || t2.t !== "road") continue;
    if (((c2 * 3 + r2) % 2) !== 0) continue;            // sample every other road hex
    var w2 = _m3dWorld(c2, r2, 0), by2 = _m3dTileH(t2.elev || 0);
    var rails = 5, seg = hx * 1.6 / rails, base = hsh(c2 + r2) * 3.14;
    for (var k = 0; k < rails; k++) {
      var zig = (k % 2 === 0) ? 0.5 : -0.5;
      var rail = new T.Mesh(new T.BoxGeometry(seg * 1.25, 0.5, 0.1), railMat);
      var rx = w2.x + Math.cos(base) * (k - (rails - 1) / 2) * seg - Math.sin(base) * zig * 0.6;
      var rz = w2.z + Math.sin(base) * (k - (rails - 1) / 2) * seg + Math.cos(base) * zig * 0.6;
      place(rail, rx, by2 + 0.3, rz, base + (zig > 0 ? 0.5 : -0.5));
    }
    placed++;
  }
}

/* ---- OVERRIDE dispatcher: camera dispatch (verbatim) + signature props on battle change */
function _m3dFrameUpdate(dt, now) {
  if (!__M3D || !__M3D.ready || !window.THREE || !G.battle) return;
  if (typeof _m3dWeatherUpdate === "function")   { try { _m3dWeatherUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dSmokeBankUpdate === "function") { try { _m3dSmokeBankUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dMixerUpdate === "function")     { try { _m3dMixerUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dCameraUpdate === "function")    { try { _m3dCameraUpdate(dt, now); } catch (e) {} }
  if (__M3D._propBattle !== G.battle.bd.id) {
    __M3D._propBattle = G.battle.bd.id;
    try { _m3dBuildProps(); } catch (e) {}
    try { if (typeof _m3dBuildSignatureProps === "function") _m3dBuildSignatureProps(); } catch (e) {}
  }
}
