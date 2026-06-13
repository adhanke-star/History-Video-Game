/* ===== M3D_PROPS.js — battlefield dressing: forests + buildings (append-only) =========
   Dresses the Modern battlefield with environment props, lit by the HDRI env + PBR +
   post-FX so they read stylized-realistic. $0 / procedural / instanced (perf-first for
   the Intel UHD 617 — the whole forest is ~4 draw calls via InstancedMesh):

     - FORESTS on every `woods` hex: scattered low-poly trees, 2 species (conifer cone /
       broadleaf faceted canopy), per-tree jittered position + rotation + scale + green
       tint (instanceColor). Turns flat textured woods hexes into actual timber.
     - BUILDINGS on `town` hexes + named building features (label contains Church/House/
       Farm/Mill): a simple period structure (clapboard body + gable/steeple roof). The
       Dunker Church etc. get a white steepled church.

   INTEGRATION: redeclares the per-frame dispatcher `_m3dFrameUpdate` (winning) = replicate
   G5's sub-hook dispatch VERBATIM + a battle-change props rebuild (so props rebuild with
   terrain, no sync/terrain re-override). Perf-tiered tree budget; bare globals (G, HEX);
   MeshStandard so props catch IBL + grade. Never throws.
   ------------------------------------------------------------------------------------ */

/* ---- tree budget by tier ----------------------------------------------------------- */
function _m3dTreeBudget() {
  var q = G.settings && G.settings.gfxQuality;
  var low = (typeof _m3dLowTier === "function") ? _m3dLowTier() : false;
  if (q === "low" || low) return 0;
  if (q === "high") return 460;
  return 240;                                          // auto
}

// cheap deterministic hash -> [0,1)
function _m3dHash01(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function _m3dDisposeProps() {
  if (!__M3D.propGroup) return;
  var g = __M3D.propGroup;
  while (g.children.length) {
    var c = g.children[0]; g.remove(c);
    if (c.geometry && c.geometry.dispose) c.geometry.dispose();
    if (c.material && c.material.dispose) { if (Array.isArray(c.material)) c.material.forEach(function (m) { m.dispose && m.dispose(); }); else c.material.dispose(); }
  }
}

/* ---- one procedural building (clapboard body + roof; optional steeple) -------------- */
function _m3dMakeBuilding(T, kind) {
  var grp = new T.Group();
  var bodyCol = kind === "church" ? "#e6e2d6" : (kind === "farm" ? "#9a8a6c" : "#caa980");
  var roofCol = kind === "church" ? "#5a5048" : "#6b3a2a";
  var bw = kind === "church" ? 2.0 : 2.6, bd = kind === "church" ? 3.0 : 2.4, bh = 1.9;
  var body = new T.Mesh(new T.BoxGeometry(bw, bh, bd), new T.MeshStandardMaterial({ color: new T.Color(bodyCol), roughness: 0.85 }));
  body.position.y = bh / 2; body.castShadow = true; body.receiveShadow = true; grp.add(body);
  // gable roof = a thin rotated box prism (cone with 4 sides) sitting on the body
  var roof = new T.Mesh(new T.ConeGeometry(Math.max(bw, bd) * 0.78, 1.3, 4), new T.MeshStandardMaterial({ color: new T.Color(roofCol), roughness: 0.9 }));
  roof.position.y = bh + 0.62; roof.rotation.y = Math.PI / 4; roof.castShadow = true; grp.add(roof);
  if (kind === "church") {                              // steeple
    var tower = new T.Mesh(new T.BoxGeometry(0.7, 2.4, 0.7), new T.MeshStandardMaterial({ color: new T.Color(bodyCol), roughness: 0.85 }));
    tower.position.set(0, 1.2, bd / 2 - 0.4); tower.castShadow = true; grp.add(tower);
    var spire = new T.Mesh(new T.ConeGeometry(0.5, 1.3, 6), new T.MeshStandardMaterial({ color: new T.Color(roofCol), roughness: 0.9 }));
    spire.position.set(0, 2.4 + 0.65, bd / 2 - 0.4); spire.castShadow = true; grp.add(spire);
  }
  return grp;
}

/* ---- build all props for the current battle ---------------------------------------- */
function _m3dBuildProps() {
  if (!__M3D || !__M3D.ready || !__M3D.scene || !window.THREE || !G.battle) return;
  var T = window.THREE, M = G.battle.M;
  if (!__M3D.propGroup) { __M3D.propGroup = new T.Group(); __M3D.scene.add(__M3D.propGroup); }
  _m3dDisposeProps();

  var shadows = __M3D.renderer.shadowMap.enabled;
  var budget = _m3dTreeBudget();

  // 1) collect tree instances over every woods hex (jittered, deterministic)
  var trees = [];                                       // {x,z,y,s,rot,species,tint}
  if (budget > 0) {
    var rad = HEX * __M3D.S * 0.66;
    for (var r = 0; r < M.GH && trees.length < budget; r++) {
      for (var c = 0; c < M.GW && trees.length < budget; c++) {
        var t = M.map[M.key(c, r)];
        if (!t || t.t !== "woods") continue;
        var w = _m3dWorld(c, r, 0);
        var baseY = _m3dTileH(t.elev || 0);
        var per = 5;                                     // trees per woods hex
        for (var k = 0; k < per && trees.length < budget; k++) {
          var h1 = _m3dHash01(c * 73.1 + r * 19.7 + k * 5.3);
          var h2 = _m3dHash01(c * 11.3 + r * 53.9 + k * 7.1);
          var h3 = _m3dHash01(c * 31.7 + r * 7.3 + k * 17.9);
          var ang = h1 * 6.2832, dist = Math.sqrt(h2) * rad;
          trees.push({
            x: w.x + Math.cos(ang) * dist, z: w.z + Math.sin(ang) * dist, y: baseY,
            s: 0.8 + h3 * 0.7, rot: h1 * 6.2832,
            species: (h2 > 0.5) ? 1 : 0, tint: 0.7 + h3 * 0.5
          });
        }
      }
    }
  }

  // 2) build 2 species × (trunk + canopy) InstancedMeshes sharing per-tree matrices
  if (trees.length) {
    var byS = [[], []];
    for (var i = 0; i < trees.length; i++) byS[trees[i].species].push(trees[i]);
    for (var sp = 0; sp < 2; sp++) {
      var list = byS[sp]; if (!list.length) continue;
      // geometries baked so the same matrix puts trunk base on ground + canopy on top
      var trunkH = 1.4;
      var trunkGeo = new T.CylinderGeometry(0.12, 0.2, trunkH, 6); trunkGeo.translate(0, trunkH / 2, 0);
      var canopyGeo = sp === 0
        ? (function () { var g = new T.ConeGeometry(1.05, 2.6, 7); g.translate(0, trunkH + 1.2, 0); return g; })()   // conifer
        : (function () { var g = new T.IcosahedronGeometry(1.15, 0); g.translate(0, trunkH + 1.0, 0); return g; })(); // broadleaf
      var trunkMat = new T.MeshStandardMaterial({ color: new T.Color("#5a4326"), roughness: 0.95 });
      var leafMat = new T.MeshStandardMaterial({ color: new T.Color("#5f7a3a"), roughness: 0.9, flatShading: true });
      var trunkIM = new T.InstancedMesh(trunkGeo, trunkMat, list.length);
      var leafIM = new T.InstancedMesh(canopyGeo, leafMat, list.length);
      trunkIM.castShadow = leafIM.castShadow = shadows;
      leafIM.receiveShadow = shadows;
      var dummy = new T.Object3D(), col = new T.Color();
      for (var j = 0; j < list.length; j++) {
        var tr = list[j];
        dummy.position.set(tr.x, tr.y, tr.z);
        dummy.rotation.set(0, tr.rot, 0);
        dummy.scale.setScalar(tr.s);
        dummy.updateMatrix();
        trunkIM.setMatrixAt(j, dummy.matrix);
        leafIM.setMatrixAt(j, dummy.matrix);
        // green tint variation per tree
        var base = sp === 0 ? { r: 0.30, g: 0.43, b: 0.20 } : { r: 0.40, g: 0.50, b: 0.24 };
        col.setRGB(base.r * tr.tint, base.g * tr.tint, base.b * tr.tint);
        if (leafIM.setColorAt) leafIM.setColorAt(j, col);
      }
      trunkIM.instanceMatrix.needsUpdate = true; leafIM.instanceMatrix.needsUpdate = true;
      if (leafIM.instanceColor) leafIM.instanceColor.needsUpdate = true;
      __M3D.propGroup.add(trunkIM); __M3D.propGroup.add(leafIM);
    }
  }

  // 3) buildings on town hexes (cap a few) + named building features
  if (budget >= 0) {
    var townCount = 0, TOWN_CAP = 14;
    for (var r2 = 0; r2 < M.GH && townCount < TOWN_CAP; r2++) {
      for (var c2 = 0; c2 < M.GW && townCount < TOWN_CAP; c2++) {
        var t2 = M.map[M.key(c2, r2)];
        if (!t2 || t2.t !== "town") continue;
        var w2 = _m3dWorld(c2, r2, 0), by2 = _m3dTileH(t2.elev || 0);
        var b = _m3dMakeBuilding(T, "house");
        b.position.set(w2.x, by2, w2.z);
        b.rotation.y = _m3dHash01(c2 * 9.1 + r2 * 4.7) * 6.2832;
        var sc = 0.85 + _m3dHash01(c2 + r2) * 0.3; b.scale.setScalar(sc);
        __M3D.propGroup.add(b); townCount++;
      }
    }
    // named building features (Dunker Church, farmhouses) get a distinct structure
    var feats = M && M.authoredFeatures;
    if (feats && feats.length) {
      for (var fi = 0; fi < feats.length; fi++) {
        var f = feats[fi]; if (f.c == null || f.r == null || !f.label) continue;
        var lbl = String(f.label).toLowerCase();
        var kind = lbl.indexOf("church") >= 0 ? "church" : (lbl.indexOf("farm") >= 0 || lbl.indexOf("house") >= 0 || lbl.indexOf("mill") >= 0) ? "farm" : null;
        if (!kind) continue;
        var tf = M.map[M.key(f.c, f.r)]; if (!tf) continue;
        var wf = _m3dWorld(f.c, f.r, 0), byf = _m3dTileH(tf.elev || 0);
        var bf = _m3dMakeBuilding(T, kind);
        bf.position.set(wf.x, byf, wf.z);
        __M3D.propGroup.add(bf);
      }
    }
  }
}

/* ---- OVERRIDE dispatcher: G5 sub-hook dispatch (verbatim) + battle-change props build */
function _m3dFrameUpdate(dt, now) {
  if (!__M3D || !__M3D.ready || !window.THREE || !G.battle) return;
  if (typeof _m3dWeatherUpdate === "function")   { try { _m3dWeatherUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dSmokeBankUpdate === "function") { try { _m3dSmokeBankUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dMixerUpdate === "function")     { try { _m3dMixerUpdate(dt, now); } catch (e) {} } // G4 hook
  if (__M3D._propBattle !== G.battle.bd.id) { __M3D._propBattle = G.battle.bd.id; try { _m3dBuildProps(); } catch (e) {} }
}
