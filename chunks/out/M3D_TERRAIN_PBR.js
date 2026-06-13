/* ===== M3D_TERRAIN_PBR.js — PBR terrain material path (append-only override) =========
   Upgrades the Modern terrain from flat vertex-color MeshLambert hex chips to real
   PBR ground (MeshStandardMaterial: albedo + normal + roughness) per terrain key,
   read from assets/3d/materials/terrain/<key>_albedo|normal|rough.png (3D-ASSET-PLAN
   naming is LAW). Terrain keys: clear field woods hills ridge town road swamp fort.

   DESIGN (honors every locked rule):
     - ZERO regression: if a key's albedo is absent (404) the hex falls back to the
       EXACT original vertex-color MeshLambertMaterial path — same look as before. So
       the build is valid with zero assets present; each material lights up on drop.
     - Append-only OVERRIDE by redeclaration: this redeclares _m3dBuildTerrain so the
       LAST definition wins everywhere it is called (the parity _m3dSync calls it by
       bare name). The original geometry / per-hex layout / camera-framing / sun-frustum
       blocks are replicated VERBATIM; only material SELECTION changes.
     - Async, coalesced: materials load once per key (like _m3dUnitModel's lazy load);
       arrivals trigger a single debounced terrain rebuild that swaps fallback to PBR.
     - Perf-tiered: anisotropy + normal detail drop on the low tier (Intel UHD 617).
     - Bare globals only (G, HEX, PALETTE via _m3dTerrainColor, hexW, colrowToPixel).
   ------------------------------------------------------------------------------------ */

/* ---- lazy per-key PBR material; null until ready, false when known-absent ---------- */
function _m3dTerrainMat(key) {
  var T = window.THREE;
  if (!T || !__M3D || !__M3D.renderer) return null;
  __M3D.terrainMats = __M3D.terrainMats || {};
  __M3D.terrainMatLoading = __M3D.terrainMatLoading || {};
  var m = __M3D.terrainMats[key];
  if (m && m !== true) return m;            // ready material
  if (m === false) return null;             // known-absent → vertex-color fallback
  if (__M3D.terrainMatLoading[key]) return null; // in flight
  __M3D.terrainMatLoading[key] = true;
  var base = "assets/3d/materials/terrain/" + key + "_";
  var loader = new T.TextureLoader();
  var lowT = (typeof _m3dLowTier === "function") ? _m3dLowTier() : false;
  var rep = 2.0;                            // tile the ground within each hex cap for detail
  loader.load(base + "albedo.png",
    function (tex) {
      try {
        tex.wrapS = tex.wrapT = T.RepeatWrapping;
        tex.repeat.set(rep, rep);
        if (T.sRGBEncoding !== undefined) tex.encoding = T.sRGBEncoding; // r128 albedo is sRGB
        tex.anisotropy = lowT ? 1 : 4;
        var mat = new T.MeshStandardMaterial({ map: tex, roughness: 0.96, metalness: 0.0 });
        mat.userData = { terrainKey: key };
        __M3D.terrainMats[key] = mat;
        __M3D.terrainMatLoading[key] = false;
        // optional normal/rough maps upgrade the same material in place (linear data, NOT sRGB)
        if (!lowT) {
          loader.load(base + "normal.png", function (n) {
            try { n.wrapS = n.wrapT = T.RepeatWrapping; n.repeat.set(rep, rep); n.anisotropy = 4;
              mat.normalMap = n; mat.normalScale = new T.Vector2(0.7, 0.7); mat.needsUpdate = true;
              _m3dTerrainRebuildSoon(); } catch (e) {}
          }, undefined, function () {});
        }
        loader.load(base + "rough.png", function (rgh) {
          try { rgh.wrapS = rgh.wrapT = T.RepeatWrapping; rgh.repeat.set(rep, rep);
            mat.roughnessMap = rgh; mat.roughness = 1.0; mat.needsUpdate = true;
            _m3dTerrainRebuildSoon(); } catch (e) {}
        }, undefined, function () {});
        _m3dTerrainRebuildSoon();           // swap this key's hexes fallback → PBR
      } catch (e) { __M3D.terrainMats[key] = false; __M3D.terrainMatLoading[key] = false; }
    },
    undefined,
    function () { __M3D.terrainMats[key] = false; __M3D.terrainMatLoading[key] = false; } // no asset → fallback
  );
  return null;
}

/* ---- coalesce many per-key material arrivals into one terrain rebuild --------------- */
function _m3dTerrainRebuildSoon() {
  if (!__M3D || __M3D._terRT) return;
  __M3D._terRT = setTimeout(function () {
    __M3D._terRT = 0;
    try {
      if (__M3D.ready && typeof _m3dModern === "function" && _m3dModern() && G.battle) {
        __M3D.battleId = null;              // force terrain rebuild
        if (typeof _m3dSync === "function") _m3dSync();
      }
    } catch (e) {}
  }, 140);
}

/* ---- OVERRIDE: _m3dBuildTerrain — PBR material per hex, vertex-color fallback -------
   Body mirrors the original (lines ~10521-10564) verbatim except the per-hex material:
   a ready PBR MeshStandardMaterial when present, else the original MeshLambert tint. */
function _m3dBuildTerrain() {
  var T = window.THREE, M = G.battle.M;
  while (__M3D.terrainGroup.children.length) {
    var ch0 = __M3D.terrainGroup.children[0];
    __M3D.terrainGroup.remove(ch0);
    if (ch0.geometry && ch0.geometry.dispose) ch0.geometry.dispose();
    // dispose only the per-hex fallback Lambert material; shared PBR materials are cached + reused
    if (ch0.material && ch0.material.dispose && !(ch0.material.userData && ch0.material.userData.terrainKey)) ch0.material.dispose();
  }
  var rad = HEX * __M3D.S * 1.015;          // circumradius + slight overlap kills seams
  var shadowsOn = __M3D.renderer.shadowMap.enabled;
  for (var r = 0; r < M.GH; r++) {
    for (var c = 0; c < M.GW; c++) {
      var t = M.map[M.key(c, r)];
      if (!t) continue;
      var elev = t.elev || 0;
      var h = _m3dTileH(elev);
      var geo = new T.CylinderGeometry(rad, rad, h, 6);
      var pbr = _m3dTerrainMat(t.t);        // shared per-key PBR material (or null)
      var mat;
      if (pbr) {
        mat = pbr;                          // shared — do NOT dispose per-hex in rebuild
      } else {
        var col = _m3dTerrainColor(t);
        col.offsetHSL(0, 0.05, (((c * 7 + r * 13) % 5) - 2) * 0.014);
        col.multiplyScalar(0.92);
        mat = new T.MeshLambertMaterial({ color: col });
      }
      var mesh = new T.Mesh(geo, mat);
      mesh.castShadow = shadowsOn;
      mesh.receiveShadow = shadowsOn;
      var w = _m3dWorld(c, r, 0);
      mesh.position.set(w.x, h / 2, w.z);
      mesh.rotation.y = Math.PI / 6;        // vertices to ±Z → pointy-top, matches the 2D board
      mesh.userData = { c: c, r: r, kind: "hex" };
      __M3D.terrainGroup.add(mesh);
    }
  }
  // frame the camera + aim the sun/shadow frustum at the field (VERBATIM from original)
  var ctr = _m3dWorld(M.GW / 2, M.GH / 2, 0);
  var span = Math.max(M.GW, M.GH) * hexW() * __M3D.S;
  if (__M3D.sun) {
    var s = __M3D.sun, off = span * 0.85;
    s.position.set(ctr.x - off * 0.45, off * 1.25, ctr.z - off * 0.35);
    s.target.position.set(ctr.x, 0, ctr.z); s.target.updateMatrixWorld();
    var sc = s.shadow.camera;
    sc.left = -span * 0.78; sc.right = span * 0.78; sc.top = span * 0.78; sc.bottom = -span * 0.78;
    sc.near = 1; sc.far = span * 3.2; sc.updateProjectionMatrix();
  }
  __M3D.controls.target.set(ctr.x, 2, ctr.z);
  __M3D.camera.position.set(ctr.x, span * 0.58, ctr.z + span * 0.70);
  __M3D.controls.update();
}
