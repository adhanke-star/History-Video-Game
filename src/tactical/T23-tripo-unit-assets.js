/* ===========================================================================
   T23 - LOCAL GLB UNIT ASSET BRIDGE  (Tripo-compatible, local-file-only)

   This is the safe integration point for Tripo-style unit output. It never calls a
   remote API, never needs an account/key, and never assumes paid Ultra meshes are
   free. Detailed/Ultra files are treated as SOURCE ART; the runtime only accepts
   optimized local GLB/GLTF files declared in data/tripo-unit-assets.json.

   Architecture: pure presentation. The module wraps fld3dBuildUnits /
   fld3dSyncUnit by assignment and reads only render state plus unit metadata. When
   no enabled local asset exists, the existing slab/flag/ring renderer is left
   untouched. renderRich="off" and low-quality mode both keep the default marker
   path, preserving the existing no-regression and Intel UHD-617 fallback lanes.
   =========================================================================== */

var FLDGLB = {
  MAX_BYTES: 1500000,
  MAX_VERTS: 20000,
  MAX_TRIS: 12000
};

var FLDGLB_S = {
  templates: {},
  loading: {},
  failed: {},
  stats: { records: 0, enabled: 0, requested: 0, loaded: 0, attached: 0, fallback: 0, overBudget: 0, disabledByTier: 0 },
  errN: 0
};

function fldUnitGlbOff() {
  try { if (G && G.settings && G.settings.unitGlbModels === "off") return true; } catch (e) {}
  try { if (G && G.settings && G.settings.renderRich === "off") return true; } catch (e2) {}
  try {
    if (typeof fldLow === "function" && fldLow()) {
      return !(G && G.settings && G.settings.unitGlbModels === "force");
    }
  } catch (e3) {}
  return false;
}

function fldUnitGlbPack() {
  try {
    var p = GAME_DATA && GAME_DATA["tripo-unit-assets"];
    if (p && p.schema === "cw_tripo_unit_assets_v1" && p.records && p.records.length) return p;
  } catch (e) {}
  return null;
}

function fldUnitGlbPolicy() {
  var p = fldUnitGlbPack();
  return (p && p.policy) ? p.policy : {};
}

function fldUnitGlbRecords() {
  var p = fldUnitGlbPack();
  return p ? p.records : [];
}

function fldUnitGlbArm(u) {
  if (!u) return "inf";
  if (u.type === "hq") return "hq";
  var a = String(u.arm || u.type || "inf").toLowerCase();
  if (a === "artillery") return "art";
  if (a === "cavalry") return "cav";
  if (a === "infantry") return "inf";
  return a;
}

function fldUnitGlbSlot(u) {
  if (fldUnitGlbOff()) { FLDGLB_S.stats.disabledByTier++; return null; }
  var recs = fldUnitGlbRecords();
  FLDGLB_S.stats.records = recs.length;
  var arm = fldUnitGlbArm(u), side = u && u.side;
  var fallback = null;
  for (var i = 0; i < recs.length; i++) {
    var r = recs[i];
    if (!r || r.enabled !== true) continue;
    FLDGLB_S.stats.enabled++;
    if (!(r.side === "ANY" || r.side === side)) continue;
    if (!(r.arm === "any" || r.arm === arm)) continue;
    return r;
  }
  return fallback;
}

function fldUnitGlbMaxBytes(slot) {
  var p = fldUnitGlbPolicy();
  return Number(slot && slot.maxRuntimeBytes || p.maxRuntimeBytes || FLDGLB.MAX_BYTES);
}

function fldUnitGlbMaxVerts(slot) {
  var p = fldUnitGlbPolicy();
  return Number(slot && slot.maxRuntimeVertices || p.maxRuntimeVertices || FLDGLB.MAX_VERTS);
}

function fldUnitGlbMaxTris(slot) {
  var p = fldUnitGlbPolicy();
  return Number(slot && slot.maxRuntimeTriangles || p.maxRuntimeTriangles || FLDGLB.MAX_TRIS);
}

function fldUnitGlbStats(root) {
  var out = { meshes: 0, vertices: 0, triangles: 0 };
  if (!root || !root.traverse) return out;
  root.traverse(function (o) {
    if (!o || !o.geometry) return;
    var g = o.geometry, pos = g.attributes && g.attributes.position;
    if (pos && pos.count) out.vertices += pos.count;
    if (g.index && g.index.count) out.triangles += Math.floor(g.index.count / 3);
    else if (pos && pos.count) out.triangles += Math.floor(pos.count / 3);
    out.meshes++;
  });
  return out;
}

function fldUnitGlbBudgetOk(slot, stats) {
  if (!stats) return false;
  if (stats.vertices > fldUnitGlbMaxVerts(slot)) return false;
  if (stats.triangles > fldUnitGlbMaxTris(slot)) return false;
  return true;
}

function fldUnitGlbPath(slot) {
  var s = String(slot && slot.runtimePath || "");
  if (!s) return "";
  if (/^data:model\/gltf\+json;base64,/.test(s)) return s;  // probe-only data URI path
  if (/^assets\/3d\/models\/units\/[A-Za-z0-9_.\/-]+\.(glb|gltf)$/i.test(s)) return s;
  return "";
}

function fldUnitGlbRequest(slot) {
  var id = String(slot && slot.id || "");
  if (!id) return;
  if (FLDGLB_S.templates[id] || FLDGLB_S.loading[id] || FLDGLB_S.failed[id]) return;
  var T = window.THREE;
  if (!T || !T.GLTFLoader) { FLDGLB_S.failed[id] = "no GLTFLoader"; return; }
  var path = fldUnitGlbPath(slot);
  if (!path) { FLDGLB_S.failed[id] = "bad runtimePath"; return; }
  FLDGLB_S.loading[id] = true;
  FLDGLB_S.stats.requested++;
  try {
    new T.GLTFLoader().load(path, function (gltf) {
      try {
        var root = gltf && gltf.scene;
        var st = fldUnitGlbStats(root);
        if (!root || !fldUnitGlbBudgetOk(slot, st)) {
          FLDGLB_S.failed[id] = "over budget vertices=" + st.vertices + " triangles=" + st.triangles;
          FLDGLB_S.stats.overBudget++;
        } else {
          FLDGLB_S.templates[id] = { root: root, stats: st, slot: slot };
          FLDGLB_S.stats.loaded++;
          fldUnitGlbApplyAll();
        }
      } catch (e) {
        FLDGLB_S.failed[id] = String(e && e.message || e);
        FLDGLB_S.errN++;
      }
      FLDGLB_S.loading[id] = false;
    }, undefined, function () {
      FLDGLB_S.failed[id] = "load failed";
      FLDGLB_S.loading[id] = false;
    });
  } catch (e2) {
    FLDGLB_S.failed[id] = String(e2 && e2.message || e2);
    FLDGLB_S.loading[id] = false;
    FLDGLB_S.errN++;
  }
}

function fldUnitGlbClone(root) {
  var obj = root.clone(true);
  obj.traverse(function (o) {
    if (!o) return;
    if (o.geometry && o.geometry.clone) o.geometry = o.geometry.clone();
    if (o.material) {
      if (Array.isArray(o.material)) {
        var mats = [];
        for (var i = 0; i < o.material.length; i++) mats.push(o.material[i] && o.material[i].clone ? o.material[i].clone() : o.material[i]);
        o.material = mats;
      } else if (o.material.clone) {
        o.material = o.material.clone();
      }
    }
    o.castShadow = false;
    o.receiveShadow = true;
  });
  return obj;
}

function fldUnitGlbDispose(obj) {
  if (!obj || !obj.traverse) return;
  obj.traverse(function (o) {
    if (o.geometry && o.geometry.dispose) o.geometry.dispose();
    if (o.material) {
      var mm = Array.isArray(o.material) ? o.material : [o.material];
      for (var i = 0; i < mm.length; i++) if (mm[i] && mm[i].dispose) mm[i].dispose();
    }
  });
  if (obj.parent) obj.parent.remove(obj);
}

function fldUnitGlbNormalized(template, slot) {
  var T = window.THREE;
  if (!T || !template || !template.root) return null;
  var holder = new T.Group();
  holder.name = "unitGlbModel";
  var obj = fldUnitGlbClone(template.root);
  obj.name = "unitGlbSource";
  holder.add(obj);

  var box = new T.Box3().setFromObject(obj);
  var size = new T.Vector3();
  box.getSize(size);
  var h = size.y > 0.001 ? size.y : Math.max(size.x, size.z, 1);
  var target = Number(slot.targetHeight || 42);
  var sc = target / h;
  if (!(sc > 0 && sc < 10000)) sc = 1;
  obj.scale.multiplyScalar(sc);
  if (Number(slot.rotationY)) obj.rotation.y += Number(slot.rotationY);

  box.setFromObject(obj);
  var ctr = new T.Vector3();
  box.getCenter(ctr);
  obj.position.x -= ctr.x;
  obj.position.z -= ctr.z;
  obj.position.y -= box.min.y;
  holder.userData.unitGlb = { id: slot.id, stats: template.stats };
  return holder;
}

function fldUnitGlbSetBaseVisible(g, visible, u) {
  if (!g || !g.children) return;
  var useBodyLayer = false;
  if (visible !== false && u && typeof fldLow === "function" && typeof fld3dSyncMarkerBodyLayer === "function") {
    try { useBodyLayer = !!fldLow(); } catch (e0) { FLDGLB_S.errN++; }
  }
  if (visible === false && typeof fld3dEnsureSelectionRing === "function") {
    try { fld3dEnsureSelectionRing(window.THREE, g); } catch (e) { FLDGLB_S.errN++; }
  }
  if (visible === false && u && typeof fld3dSyncMarkerBodyLayer === "function") {
    try { fld3dSyncMarkerBodyLayer(u, g, false); } catch (e2) { FLDGLB_S.errN++; }
  }
  for (var i = 0; i < g.children.length; i++) {
    var ch = g.children[i];
    if (!ch || ch.name === "unitGlbModel" || ch.name === "flag" || ch.name === "ring" || ch.name === "vfShadow") continue;
    if (useBodyLayer && (ch.name === "slab" || ch.name === "front")) {
      ch.visible = false;
      continue;
    }
    ch.visible = visible;
  }
}

function fldUnitGlbAttach(u, g, slot) {
  if (!u || !g || !slot) return false;
  var id = String(slot.id || "");
  var tpl = FLDGLB_S.templates[id];
  if (!tpl) { fldUnitGlbRequest(slot); return false; }
  var cur = g.getObjectByName("unitGlbModel");
  if (cur && cur.userData && cur.userData.unitGlb && cur.userData.unitGlb.id === id) return true;
  if (cur) fldUnitGlbDispose(cur);
  var model = fldUnitGlbNormalized(tpl, slot);
  if (!model) return false;
  g.add(model);
  g.userData._unitGlbSlot = id;
  FLDGLB_S.stats.attached++;
  return true;
}

function fldUnitGlbBuildUnits() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD._u3d || !__FIELD.units || !window.THREE) return;
  FLDGLB_S.stats.enabled = 0;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i], g = __FIELD._u3d[u.id];
    var slot = fldUnitGlbSlot(u);
    if (!slot || !g) { FLDGLB_S.stats.fallback++; continue; }
    fldUnitGlbAttach(u, g, slot);
  }
}

function fldUnitGlbSyncUnit(u, g) {
  if (!u || !g) return;
  var slot = fldUnitGlbSlot(u);
  var attached = slot ? fldUnitGlbAttach(u, g, slot) : false;
  var m = g.getObjectByName("unitGlbModel");
  if (!attached || !m) {
    if (m) m.visible = false;
    fldUnitGlbSetBaseVisible(g, true, u);
    return;
  }
  var show = !!(u.alive && g.visible);
  m.visible = show;
  if (slot.hideBaseMarker === true) fldUnitGlbSetBaseVisible(g, !show, u);
  else fldUnitGlbSetBaseVisible(g, true, u);
}

function fldUnitGlbApplyAll() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD._u3d || !__FIELD.units) return;
  // Route the async template-arrival apply through the PUBLIC wrapped seam, not this
  // module's private sync: the loader callback fires between frames, and a direct
  // fldUnitGlbSyncUnit here attaches + shows the hero model and hides the base marker
  // WITHOUT the later-loaded sibling layers' fld3dSyncUnit wrappers running — leaving
  // their shared instanced slots active for one frame (orphan figures over the model).
  // The full seam call keeps every layer's hide/park atomic with the attach.
  var seam = (typeof fld3dSyncUnit === "function") ? fld3dSyncUnit : null;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i], g = __FIELD._u3d[u.id];
    if (!g) continue;
    if (seam) seam(u, g); else fldUnitGlbSyncUnit(u, g);
  }
}

(function () {
  function carry(dst, src) { for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { try { dst[k] = src[k]; } catch (e) {} } } }
  if (typeof fld3dBuildUnits === "function" && !fld3dBuildUnits._unitGlb) {
    var oldBuild = fld3dBuildUnits;
    fld3dBuildUnits = function () {
      var r = oldBuild.apply(this, arguments);
      try { fldUnitGlbBuildUnits(); } catch (e) { FLDGLB_S.errN++; }
      return r;
    };
    carry(fld3dBuildUnits, oldBuild); fld3dBuildUnits._unitGlb = true;
  }
  if (typeof fld3dSyncUnit === "function" && !fld3dSyncUnit._unitGlb) {
    var oldSync = fld3dSyncUnit;
    fld3dSyncUnit = function (u, g) {
      var r = oldSync.apply(this, arguments);
      try { fldUnitGlbSyncUnit(u, g); } catch (e) { FLDGLB_S.errN++; }
      return r;
    };
    carry(fld3dSyncUnit, oldSync); fld3dSyncUnit._unitGlb = true;
  }
})();
