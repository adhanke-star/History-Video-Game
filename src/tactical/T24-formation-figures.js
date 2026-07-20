/* ===========================================================================
   T24 - FORMATION FIGURES  (Modern UG:G visual execution slice)

   Adds a procedural miniature-infantry formation layer over the existing Modern
   unit groups: ranks/files, firing posture, marching bob, charge lean, and
   bayonets. This is the no-cost path that lets the battlefield look like
   formations rather than colored slabs while Tripo/GLB assets remain optional
   hero-source art.

   ARCHITECTURE - PRESENTATION ONLY:
   - wraps fld3dBuildUnits / fld3dSyncUnit by assignment;
   - reads unit render state only;
   - writes no sim fields, never calls fldRng, never bumps _SAVE_VER;
   - renderRich="off" and low tier restore the existing slab/peg fallback;
   - infantry first by design. Artillery/cavalry keep their established T5 arms.

   D476 (LANE-014 slice 5) - DISTANCE LOD: units inside the camera near
   threshold render from a SECOND shared instanced layer ("ffNearLayer", its
   own scene-level group so the far layer keeps exactly 5 meshes) with richer
   geometry, knapsack/bedroll accessories, and a higher active-figure cap.
   The far tier is the pre-slice-5 path byte-for-byte; fldLow() always
   resolves to the far tier, so the low tier is unchanged. Near/far selection
   uses hysteresis (NEAR_IN/NEAR_OUT) to avoid threshold thrash, and the E20
   recolor latch applies to the near set too.
   =========================================================================== */

var FLDFF = {
  INF_CAP: 42,
  INF_MIN: 10,
  BODY_H: 13,
  BODY_R: 2.2,
  HEAD_R: 2.35,
  FILE_SP: 7.0,
  RANK_SP: 7.4,
  NEAR_CAP: 66,
  NEAR_IN: 430,
  NEAR_OUT: 490
};

var FLDFF_S = { errN: 0, layer: null, nearLayer: null };

function fldFfOff() {
  try {
    if (G && G.settings && G.settings.formationFigures === "off") return true;
    if (G && G.settings && G.settings.renderRich === "off") return true;
    if (typeof fldLow === "function" && fldLow()) {
      return !(G && G.settings && G.settings.formationFigures === "force");
    }
  } catch (e) {}
  return false;
}

function fldFfMotion() {
  if (fldFfOff()) return false;
  try { if (typeof fldReduceMotion === "function" && fldReduceMotion()) return false; } catch (e) {}
  return true;
}

function fldFfPhase(id) {
  var s = String(id == null ? "" : id), h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return (h % 62832) / 10000;
}

function fldFfJitter(id, i, salt) {
  var s = String(id == null ? "" : id) + "|" + i + "|" + salt, h = 2166136261;
  for (var k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = (h * 16777619) >>> 0; }
  return ((h >>> 0) % 10000) / 10000;
}

function fldFfArm(u) {
  var a = String(u && (u.arm || u.type) || "inf").toLowerCase();
  if (a === "infantry") return "inf";
  return a;
}

function fldFfShowFor(u, g) {
  if (!u || !g || fldFfOff()) return false;
  if (!u.alive || u.men <= 0 || fldFfArm(u) !== "inf") return false;
  if (!g.visible) return false;
  var glb = g.getObjectByName && g.getObjectByName("unitGlbModel");
  if (glb && glb.visible) return false;
  return true;
}

function fldFfMakeMat(T, color, opts) {
  opts = opts || {};
  var cfg = { color: color };
  if (opts.vertexColors) cfg.vertexColors = true;
  var m = new T.MeshLambertMaterial(cfg);
  if (opts.transparent) { m.transparent = true; m.opacity = opts.opacity == null ? 1 : opts.opacity; }
  return m;
}

function fldFfInstanced(T, geo, mat, cap, name) {
  var im = new T.InstancedMesh(geo, mat, cap);
  im.name = name;
  im.frustumCulled = false;
  if (im.instanceMatrix && T.DynamicDrawUsage) im.instanceMatrix.setUsage(T.DynamicDrawUsage);
  return im;
}

function fldFfLayer() {
  var T = window.THREE;
  if (!T || typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene) return null;
  var old = __FIELD._ffLayer;
  if (old && old.grp && old.grp.parent === __FIELD.scene) return old;
  var units = (__FIELD.units && __FIELD.units.length) ? __FIELD.units.length : 1;
  var cap = Math.max(FLDFF.INF_CAP, units * FLDFF.INF_CAP);
  var grp = new T.Group();
  grp.name = "ffFormationLayer";

  var body = fldFfInstanced(T, new T.CylinderGeometry(FLDFF.BODY_R, FLDFF.BODY_R * 1.08, FLDFF.BODY_H, 5),
    fldFfMakeMat(T, "#ffffff", { vertexColors: true }), cap, "ffBodiesLayer");
  var head = fldFfInstanced(T, new T.SphereGeometry(FLDFF.HEAD_R, 6, 4),
    fldFfMakeMat(T, "#d7b18b"), cap, "ffHeadsLayer");
  var kepi = fldFfInstanced(T, new T.CylinderGeometry(2.7, 2.45, 1.4, 6),
    fldFfMakeMat(T, "#ffffff", { vertexColors: true }), cap, "ffKepisLayer");
  var rifle = fldFfInstanced(T, new T.BoxGeometry(0.85, 0.85, 16),
    fldFfMakeMat(T, "#3a2618"), cap, "ffRiflesLayer");
  var bayonet = fldFfInstanced(T, new T.BoxGeometry(0.45, 0.45, 5.5),
    fldFfMakeMat(T, "#d9d4c6"), cap, "ffBayonetsLayer");

  grp.add(body); grp.add(head); grp.add(kepi); grp.add(rifle); grp.add(bayonet);
  __FIELD.scene.add(grp);
  var zero = new T.Matrix4();
  zero.makeScale(0.0001, 0.0001, 0.0001);
  zero.setPosition(0, -9999, 0);
  var layer = {
    grp: grp, body: body, head: head, kepi: kepi, rifle: rifle, bayonet: bayonet,
    cap: cap, nextSlot: 0, zero: zero, dummy: new T.Object3D(), world: new T.Matrix4(), composed: new T.Matrix4(),
    bodyColor: new T.Color(), kepiColor: new T.Color()
  };
  __FIELD._ffLayer = layer;
  FLDFF_S.layer = layer;
  return layer;
}

function fldFfLayerMeshes(layer) {
  return layer ? [layer.body, layer.head, layer.kepi, layer.rifle, layer.bayonet] : [];
}

/* ---- D476 near-LOD shared layer: richer instanced geometry + knapsack/bedroll, own scene group ---- */
function fldFfNearLayer() {
  var T = window.THREE;
  if (!T || typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene) return null;
  var old = __FIELD._ffNearLayer;
  if (old && old.grp && old.grp.parent === __FIELD.scene) return old;
  var units = (__FIELD.units && __FIELD.units.length) ? __FIELD.units.length : 1;
  var cap = Math.max(FLDFF.NEAR_CAP, units * FLDFF.NEAR_CAP);
  var grp = new T.Group();
  grp.name = "ffNearLayer";

  var body = fldFfInstanced(T, new T.CylinderGeometry(FLDFF.BODY_R, FLDFF.BODY_R * 1.08, FLDFF.BODY_H, 8),
    fldFfMakeMat(T, "#ffffff", { vertexColors: true }), cap, "ffNearBodiesLayer");
  var head = fldFfInstanced(T, new T.SphereGeometry(FLDFF.HEAD_R, 10, 7),
    fldFfMakeMat(T, "#d7b18b"), cap, "ffNearHeadsLayer");
  var kepi = fldFfInstanced(T, new T.CylinderGeometry(2.7, 2.45, 1.4, 8),
    fldFfMakeMat(T, "#ffffff", { vertexColors: true }), cap, "ffNearKepisLayer");
  var rifle = fldFfInstanced(T, new T.BoxGeometry(0.85, 0.85, 16),
    fldFfMakeMat(T, "#3a2618"), cap, "ffNearRiflesLayer");
  var bayonet = fldFfInstanced(T, new T.BoxGeometry(0.45, 0.45, 5.5),
    fldFfMakeMat(T, "#d9d4c6"), cap, "ffNearBayonetsLayer");
  var pack = fldFfInstanced(T, new T.BoxGeometry(3.6, 4.4, 1.7),
    fldFfMakeMat(T, "#2e2a24"), cap, "ffNearPacksLayer");
  var roll = fldFfInstanced(T, new T.CylinderGeometry(0.95, 0.95, 5.8, 6),
    fldFfMakeMat(T, "#9a8f77"), cap, "ffNearRollsLayer");

  grp.add(body); grp.add(head); grp.add(kepi); grp.add(rifle); grp.add(bayonet); grp.add(pack); grp.add(roll);
  __FIELD.scene.add(grp);
  var zero = new T.Matrix4();
  zero.makeScale(0.0001, 0.0001, 0.0001);
  zero.setPosition(0, -9999, 0);
  var layer = {
    grp: grp, body: body, head: head, kepi: kepi, rifle: rifle, bayonet: bayonet, pack: pack, roll: roll,
    cap: cap, nextSlot: 0, zero: zero, bodyColor: new T.Color(), kepiColor: new T.Color()
  };
  __FIELD._ffNearLayer = layer;
  FLDFF_S.nearLayer = layer;
  return layer;
}

function fldFfNearMeshes(layer) {
  return layer ? [layer.body, layer.head, layer.kepi, layer.rifle, layer.bayonet, layer.pack, layer.roll] : [];
}

function fldFfSetNearCount(layer, n) {
  var meshes = fldFfNearMeshes(layer);
  for (var i = 0; i < meshes.length; i++) if (meshes[i]) meshes[i].count = n;
}

function fldFfZeroNearRange(ff) {
  if (!ff || !ff.nearLayer || ff.nearSlot < 0) return;
  var layer = ff.nearLayer, start = ff.nearSlot | 0, end = Math.min(layer.cap, start + FLDFF.NEAR_CAP);
  var meshes = fldFfNearMeshes(layer);
  for (var m = 0; m < meshes.length; m++) {
    var mesh = meshes[m]; if (!mesh) continue;
    for (var i = start; i < end; i++) mesh.setMatrixAt(i, layer.zero);
    mesh.instanceMatrix.needsUpdate = true;
  }
}

function fldFfNearEnsure(ff) {
  var layer = fldFfNearLayer();
  if (!layer) return null;
  if (ff.nearLayer === layer && ff.nearSlot >= 0 && ff.nearSlot + FLDFF.NEAR_CAP <= layer.cap) return layer;
  if (layer.nextSlot + FLDFF.NEAR_CAP > layer.cap) return null;
  ff.nearLayer = layer;
  ff.nearSlot = layer.nextSlot;
  layer.nextSlot += FLDFF.NEAR_CAP;
  fldFfSetNearCount(layer, layer.nextSlot);
  fldFfZeroNearRange(ff);
  return layer;
}

/* fldLow() ALWAYS resolves far: the low tier is unchanged by the LOD (LANE-014 slice-5 contract). */
function fldFfTier(u, g, ff) {
  try {
    if (typeof fldLow === "function" && fldLow()) return "far";
    var cam = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.camera : null;
    if (!cam || !cam.position || !g || !g.position) return "far";
    var dx = cam.position.x - g.position.x, dy = cam.position.y - g.position.y, dz = cam.position.z - g.position.z;
    var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var gate = (ff && ff.tier === "near") ? FLDFF.NEAR_OUT : FLDFF.NEAR_IN;
    return d < gate ? "near" : "far";
  } catch (e) {}
  return "far";
}

/* E19 (D231): dispose + release the shared instanced layer so the NEXT fldFfLayer() call rebuilds it sized to
   the CURRENT cast with a fresh slot allocator. Called on every base fld3dBuildUnits rebuild (reinforcement
   arrivals, phase advances): the base disposes the unit GROUPS but this layer is a direct scene child, so the
   old reuse guard kept it alive with nextSlot already == cap — every post-rebuild fldFfCreate returned null,
   all brigades lost their figures, and the pre-rebuild instances stayed frozen in an oversized buffer. */
function fldFfResetLayer() {
  var layer = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD._ffLayer : null;
  if (layer) {
    try {
      if (layer.grp && layer.grp.parent) layer.grp.parent.remove(layer.grp);
      var meshes = fldFfLayerMeshes(layer);
      for (var i = 0; i < meshes.length; i++) {
        var m = meshes[i]; if (!m) continue;
        if (m.geometry && m.geometry.dispose) m.geometry.dispose();
        if (m.material && m.material.dispose) m.material.dispose();
        if (m.dispose) m.dispose();   // InstancedMesh.dispose() frees the instance buffers
      }
    } catch (e) {}
    __FIELD._ffLayer = null;
  }
  FLDFF_S.layer = null;
  var near = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD._ffNearLayer : null;
  if (near) {
    try {
      if (near.grp && near.grp.parent) near.grp.parent.remove(near.grp);
      var nm = fldFfNearMeshes(near);
      for (var j = 0; j < nm.length; j++) {
        var n = nm[j]; if (!n) continue;
        if (n.geometry && n.geometry.dispose) n.geometry.dispose();
        if (n.material && n.material.dispose) n.material.dispose();
        if (n.dispose) n.dispose();
      }
    } catch (e2) {}
    __FIELD._ffNearLayer = null;
  }
  FLDFF_S.nearLayer = null;
}

function fldFfSetLayerCount(layer, n) {
  var meshes = fldFfLayerMeshes(layer);
  for (var i = 0; i < meshes.length; i++) if (meshes[i]) meshes[i].count = n;
}

function fldFfZeroFarRange(ff) {
  if (!ff || !ff.layer) return;
  var layer = ff.layer, start = ff.slot | 0, end = Math.min(layer.cap, start + ff.cap);
  for (var i = start; i < end; i++) {
    layer.body.setMatrixAt(i, layer.zero);
    layer.head.setMatrixAt(i, layer.zero);
    layer.kepi.setMatrixAt(i, layer.zero);
    layer.rifle.setMatrixAt(i, layer.zero);
    layer.bayonet.setMatrixAt(i, layer.zero);
  }
  layer.body.instanceMatrix.needsUpdate = true;
  layer.head.instanceMatrix.needsUpdate = true;
  layer.kepi.instanceMatrix.needsUpdate = true;
  layer.rifle.instanceMatrix.needsUpdate = true;
  layer.bayonet.instanceMatrix.needsUpdate = true;
}

function fldFfClearSlot(ff) {
  if (!ff || !ff.layer) return;
  fldFfZeroFarRange(ff);
  fldFfZeroNearRange(ff);
  if (ff.grp) {
    ff.grp.visible = false;
    ff.grp.userData.ff = { mode: "shared-instanced", active: 0, slot: ff.slot, width: 0, depth: 0 };
  }
}

function fldFfCreate(u, g) {
  var T = window.THREE;
  if (!T || !u || !g || !g.add) return null;
  var layer = fldFfLayer();
  if (!layer || layer.nextSlot + FLDFF.INF_CAP > layer.cap) return null;
  var marker = g.getObjectByName && g.getObjectByName("ffFormation");
  if (!marker) {
    marker = new T.Group();
    marker.name = "ffFormation";
    g.add(marker);
  }
  var ff = {
    grp: marker, layer: layer, slot: layer.nextSlot, cap: FLDFF.INF_CAP,
    mode: "shared-instanced", markerHidden: false, world: new T.Matrix4(),
    tier: "far", nearLayer: null, nearSlot: -1
  };
  layer.nextSlot += FLDFF.INF_CAP;
  fldFfSetLayerCount(layer, layer.nextSlot);
  g.userData._ff = ff;
  fldFfClearSlot(ff);
  return ff;
}

function fldFfEnsure(u, g) {
  if (!g || !g.userData) return null;
  var ff = g.userData._ff;
  if (ff && ff.grp && ff.grp.parent && ff.layer && ff.layer.grp && ff.layer.grp.parent) return ff;
  return fldFfCreate(u, g);
}

function fldFfMarkerVisible(g, visible, u) {
  if (!g || !g.children) return;
  var useBodyLayer = false;
  if (visible !== false && u && typeof fldLow === "function" && typeof fld3dSyncMarkerBodyLayer === "function") {
    try { useBodyLayer = !!fldLow(); } catch (e) {}
  }
  for (var i = 0; i < g.children.length; i++) {
    var ch = g.children[i];
    if (!ch) continue;
    var nm = ch.name || "";
    if (nm === "ffFormation" || nm === "flag" || nm === "corpsbadge" || nm === "ring" || nm === "vfShadow" || nm === "unitGlbModel") continue;
    if (useBodyLayer && (nm === "slab" || nm === "front")) {
      ch.visible = false;
      continue;
    }
    ch.visible = visible;
  }
}

function fldFfApplyLowMarkerTrim(g) {
  if (!g || !g.getObjectByName) return;
  var topper = g.getObjectByName("topper");
  if (topper) topper.visible = !(typeof fldLow === "function" && fldLow());
}

function fldFfPose(u) {
  if (!u || u.state === "routing") return "routing";
  if (u.order && u.order.type === "charge") return "charge";
  if (u.targetId && u.ammo > 0) return "firing";
  if (u.order && u.order.type === "move") return "march";
  return "ready";
}

function fldFfActiveCount(u, cap) {
  var ratio = (u && u.maxMen > 0) ? (u.men / u.maxMen) : 1;
  if (ratio < 0) ratio = 0; if (ratio > 1) ratio = 1;
  var n = Math.round(cap * (0.35 + ratio * 0.65));
  if (u && u.state === "routing") n = Math.max(FLDFF.INF_MIN, Math.round(n * 0.72));
  if (n < FLDFF.INF_MIN) n = FLDFF.INF_MIN;
  if (n > cap) n = cap;
  return n;
}

function fldFfLayout(u, i, n) {
  var col = u && u.formation === "column";
  // n > INF_CAP only happens on the D476 near tier: a 4th rank keeps the denser line compact.
  var rows = col ? Math.max(5, Math.ceil(n / 4)) : (n > 48 ? 4 : 3);
  var files = col ? Math.min(4, n) : Math.ceil(n / rows);
  var file = col ? (i % files) : (i % files);
  var rank = col ? Math.floor(i / files) : Math.floor(i / files);
  var x = (file - (files - 1) / 2) * FLDFF.FILE_SP;
  var z = (rank - (rows - 1) / 2) * FLDFF.RANK_SP;
  if (col) z *= 1.04;
  else z -= 1.5;

  var jx = (fldFfJitter(u.id, i, 1) - 0.5) * 1.7;
  var jz = (fldFfJitter(u.id, i, 2) - 0.5) * 1.4;
  var yaw = (fldFfJitter(u.id, i, 3) - 0.5) * 0.22;
  if (u.state === "routing") {
    x += (fldFfJitter(u.id, i, 4) - 0.5) * 34;
    z += 16 + fldFfJitter(u.id, i, 5) * 42;
    yaw += (fldFfJitter(u.id, i, 6) - 0.5) * 1.8;
  }
  return { x: x + jx, z: z + jz, row: rank, files: files, rows: rows, yaw: yaw };
}

function fldFfSetMatrix(ff, mesh, idx, x, y, z, rx, ry, rz, sx, sy, sz) {
  var d = ff.layer.dummy;
  d.position.set(x, y - 4, z);
  d.rotation.set(rx || 0, ry || 0, rz || 0);
  d.scale.set(sx || 1, sy || 1, sz || 1);
  d.updateMatrix();
  ff.layer.composed.multiplyMatrices(ff.world, d.matrix);
  mesh.setMatrixAt(idx, ff.layer.composed);
}

function fldFfSetColor(ff, mesh, idx, color) {
  if (mesh && typeof mesh.setColorAt === "function") mesh.setColorAt(idx, color);
}

function fldFfApplyColors(ff, u, idx) {
  var body = u.side === "US" ? "#334f86" : "#8f4538";
  var kepi = u.side === "US" ? "#1b2744" : "#5a2a24";
  ff.layer.bodyColor.set(body);
  ff.layer.kepiColor.set(kepi);
  if (u.state === "routing") {
    ff.layer.bodyColor.multiplyScalar(0.62);
    ff.layer.kepiColor.multiplyScalar(0.62);
  }
  fldFfSetColor(ff, ff.layer.body, idx, ff.layer.bodyColor);
  fldFfSetColor(ff, ff.layer.kepi, idx, ff.layer.kepiColor);
}

function fldFfApplyNearColors(ff, u, idx) {
  var layer = ff.nearLayer;
  var body = u.side === "US" ? "#334f86" : "#8f4538";
  var kepi = u.side === "US" ? "#1b2744" : "#5a2a24";
  layer.bodyColor.set(body);
  layer.kepiColor.set(kepi);
  if (u.state === "routing") {
    layer.bodyColor.multiplyScalar(0.62);
    layer.kepiColor.multiplyScalar(0.62);
  }
  fldFfSetColor(ff, layer.body, idx, layer.bodyColor);
  fldFfSetColor(ff, layer.kepi, idx, layer.kepiColor);
}

/* The D476 near tier: same pose/layout law as the far tier, written into the richer near set.
   Returns false when the near layer/slot is unavailable so the caller falls back to far. */
function fldFfSyncNear(u, g, ff) {
  var layer = fldFfNearEnsure(ff);
  if (!layer) return false;
  if (layer.grp) layer.grp.visible = true;

  var n = fldFfActiveCount(u, FLDFF.NEAR_CAP);
  var pose = fldFfPose(u);
  var moving = pose === "march" || pose === "charge";
  var motion = fldFfMotion();
  var t = ((typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.t : 0) + fldFfPhase(u.id);
  var minX = 9999, maxX = -9999, minZ = 9999, maxZ = -9999;
  if (g.updateMatrixWorld) g.updateMatrixWorld(true);
  ff.world.copy(g.matrixWorld);
  // E20 latch (D231), extended to the near set: instanceColor re-uploads only on side/routing/count change.
  var colKey = u.side + (u.state === "routing" ? "|rout" : "");
  var recolor = (ff.nearColorKey !== colKey || ff.nearColorN !== n);

  for (var i = 0; i < n; i++) {
    var idx = ff.nearSlot + i;
    var p = fldFfLayout(u, i, n);
    var bob = (motion && moving) ? Math.sin(t * (pose === "charge" ? 8.5 : 6.4) + i * 0.72) * (pose === "charge" ? 1.0 : 0.65) : 0;
    var frontRank = p.row === 0;
    var firing = pose === "firing" && p.row <= 1;
    var charge = pose === "charge";
    var kneel = firing && frontRank;
    var lean = charge ? -0.22 : (moving ? -0.08 : 0);
    if (u.state === "routing") lean = 0.12;

    var bodyY = (kneel ? 5.2 : 6.5) + bob;
    var bodyScaleY = kneel ? 0.78 : 1;
    if (recolor) fldFfApplyNearColors(ff, u, idx);
    fldFfSetMatrix(ff, layer.body, idx, p.x, bodyY, p.z, lean, p.yaw, 0, 1, bodyScaleY, 1);
    fldFfSetMatrix(ff, layer.head, idx, p.x, (kneel ? 11.2 : 15.2) + bob, p.z - (charge ? 0.8 : 0), lean * 0.35, p.yaw, 0, 1, 1, 1);
    fldFfSetMatrix(ff, layer.kepi, idx, p.x, (kneel ? 13.5 : 17.5) + bob, p.z - (charge ? 1.0 : 0), lean * 0.35, p.yaw, 0, 1, 1, 1);
    fldFfSetMatrix(ff, layer.pack, idx, p.x, bodyY + 2.6, p.z + 2.3, lean * 0.35, p.yaw, 0, 1, bodyScaleY, 1);
    fldFfSetMatrix(ff, layer.roll, idx, p.x, bodyY + 5.3, p.z + 2.3, lean * 0.35, p.yaw, Math.PI / 2, 1, 1, 1);

    if (firing || charge) {
      var ry = p.yaw + (charge ? 0 : (frontRank ? 0 : 0.04));
      fldFfSetMatrix(ff, layer.rifle, idx, p.x + 1.7, kneel ? 9.4 : 10.4, p.z - (charge ? 11.4 : 9.2), charge ? -0.08 : 0, ry, 0, 1, 1, 1);
      fldFfSetMatrix(ff, layer.bayonet, idx, p.x + 1.7, kneel ? 9.4 : 10.4, p.z - (charge ? 21.8 : 18.0), charge ? -0.08 : 0, ry, 0, 1, 1, 1);
    } else {
      fldFfSetMatrix(ff, layer.rifle, idx, p.x + 2.9, 12.0 + bob * 0.35, p.z + 1.4, Math.PI / 2, p.yaw + 0.12, 0, 1, 1, 1);
      fldFfSetMatrix(ff, layer.bayonet, idx, p.x + 2.9, -60, p.z, 0, 0, 0, 0.01, 0.01, 0.01);
    }
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
  }

  for (var j = n; j < FLDFF.NEAR_CAP; j++) {
    var offIdx = ff.nearSlot + j;
    layer.body.setMatrixAt(offIdx, layer.zero);
    layer.head.setMatrixAt(offIdx, layer.zero);
    layer.kepi.setMatrixAt(offIdx, layer.zero);
    layer.rifle.setMatrixAt(offIdx, layer.zero);
    layer.bayonet.setMatrixAt(offIdx, layer.zero);
    layer.pack.setMatrixAt(offIdx, layer.zero);
    layer.roll.setMatrixAt(offIdx, layer.zero);
  }
  var meshes = fldFfNearMeshes(layer);
  for (var m = 0; m < meshes.length; m++) if (meshes[m]) meshes[m].instanceMatrix.needsUpdate = true;
  if (recolor) {
    ff.nearColorKey = colKey; ff.nearColorN = n;
    if (layer.body.instanceColor) layer.body.instanceColor.needsUpdate = true;
    if (layer.kepi.instanceColor) layer.kepi.instanceColor.needsUpdate = true;
  }
  ff.grp.visible = true;
  ff.grp.userData.ff = {
    active: n, pose: pose, formation: u.formation, width: maxX - minX, depth: maxZ - minZ,
    mode: "shared-instanced", slot: ff.slot, layerCount: ff.layer.nextSlot,
    lod: "near", nearSlot: ff.nearSlot, nearLayerCount: layer.nextSlot
  };
  fldFfMarkerVisible(g, false, u);
  var pegs = g.getObjectByName && g.getObjectByName("vfPegs");
  if (pegs) pegs.visible = false;
  return true;
}

function fldFfSyncUnit(u, g) {
  if (!u || !g || !window.THREE) return;
  var show = fldFfShowFor(u, g);
  if (!show) {
    if (g.userData && g.userData._ff) {
      fldFfClearSlot(g.userData._ff);
      if (fldFfOff() && g.userData._ff.layer && g.userData._ff.layer.grp) g.userData._ff.layer.grp.visible = false;
      if (fldFfOff() && g.userData._ff.nearLayer && g.userData._ff.nearLayer.grp) g.userData._ff.nearLayer.grp.visible = false;
    }
    var glb = g.getObjectByName && g.getObjectByName("unitGlbModel");
    if (glb && glb.visible) return;                                // T23 owns base-marker visibility while a GLB hero mesh is active.
    fldFfMarkerVisible(g, true, u);
    fldFfApplyLowMarkerTrim(g);
    return;
  }
  var ff = fldFfEnsure(u, g);
  if (!ff) return;
  if (ff.layer && ff.layer.grp) ff.layer.grp.visible = true;

  // D476 distance LOD: pick the tier with hysteresis, zero the set being vacated on a flip.
  var tier = fldFfTier(u, g, ff);
  if (ff.tier !== tier) {
    if (tier === "near") fldFfZeroFarRange(ff);
    else fldFfZeroNearRange(ff);
    ff.tier = tier;
  }
  if (tier === "near") {
    if (fldFfSyncNear(u, g, ff)) return;
    ff.tier = "far";                          // near layer/slot unavailable: fall back cleanly
  }

  var n = fldFfActiveCount(u, ff.cap);
  var pose = fldFfPose(u);
  var moving = pose === "march" || pose === "charge";
  var motion = fldFfMotion();
  var t = ((typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.t : 0) + fldFfPhase(u.id);
  var minX = 9999, maxX = -9999, minZ = 9999, maxZ = -9999;
  if (g.updateMatrixWorld) g.updateMatrixWorld(true);
  ff.world.copy(g.matrixWorld);
  // E20 (D231): figure colors depend only on side (fixed) + routing state (rare toggle) + the active count.
  // Re-write them (and pay the whole-layer instanceColor GPU re-upload) ONLY when that state changes — the
  // per-frame path stays matrices-only, instead of a THREE.Color string-parse per figure per frame.
  var colKey = u.side + (u.state === "routing" ? "|rout" : "");
  var recolor = (ff.colorKey !== colKey || ff.colorN !== n);

  for (var i = 0; i < n; i++) {
    var idx = ff.slot + i;
    var p = fldFfLayout(u, i, n);
    var bob = (motion && moving) ? Math.sin(t * (pose === "charge" ? 8.5 : 6.4) + i * 0.72) * (pose === "charge" ? 1.0 : 0.65) : 0;
    var frontRank = p.row === 0;
    var firing = pose === "firing" && p.row <= 1;
    var charge = pose === "charge";
    var kneel = firing && frontRank;
    var lean = charge ? -0.22 : (moving ? -0.08 : 0);
    if (u.state === "routing") lean = 0.12;

    var bodyY = (kneel ? 5.2 : 6.5) + bob;
    var bodyScaleY = kneel ? 0.78 : 1;
    if (recolor) fldFfApplyColors(ff, u, idx);
    fldFfSetMatrix(ff, ff.layer.body, idx, p.x, bodyY, p.z, lean, p.yaw, 0, 1, bodyScaleY, 1);
    fldFfSetMatrix(ff, ff.layer.head, idx, p.x, (kneel ? 11.2 : 15.2) + bob, p.z - (charge ? 0.8 : 0), lean * 0.35, p.yaw, 0, 1, 1, 1);
    fldFfSetMatrix(ff, ff.layer.kepi, idx, p.x, (kneel ? 13.5 : 17.5) + bob, p.z - (charge ? 1.0 : 0), lean * 0.35, p.yaw, 0, 1, 1, 1);

    if (firing || charge) {
      var ry = p.yaw + (charge ? 0 : (frontRank ? 0 : 0.04));
      fldFfSetMatrix(ff, ff.layer.rifle, idx, p.x + 1.7, kneel ? 9.4 : 10.4, p.z - (charge ? 11.4 : 9.2), charge ? -0.08 : 0, ry, 0, 1, 1, 1);
      fldFfSetMatrix(ff, ff.layer.bayonet, idx, p.x + 1.7, kneel ? 9.4 : 10.4, p.z - (charge ? 21.8 : 18.0), charge ? -0.08 : 0, ry, 0, 1, 1, 1);
    } else {
      fldFfSetMatrix(ff, ff.layer.rifle, idx, p.x + 2.9, 12.0 + bob * 0.35, p.z + 1.4, Math.PI / 2, p.yaw + 0.12, 0, 1, 1, 1);
      fldFfSetMatrix(ff, ff.layer.bayonet, idx, p.x + 2.9, -60, p.z, 0, 0, 0, 0.01, 0.01, 0.01);
    }
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
  }

  for (var j = n; j < ff.cap; j++) {
    var offIdx = ff.slot + j;
    ff.layer.body.setMatrixAt(offIdx, ff.layer.zero);
    ff.layer.head.setMatrixAt(offIdx, ff.layer.zero);
    ff.layer.kepi.setMatrixAt(offIdx, ff.layer.zero);
    ff.layer.rifle.setMatrixAt(offIdx, ff.layer.zero);
    ff.layer.bayonet.setMatrixAt(offIdx, ff.layer.zero);
  }
  ff.layer.body.instanceMatrix.needsUpdate = true; ff.layer.head.instanceMatrix.needsUpdate = true; ff.layer.kepi.instanceMatrix.needsUpdate = true;
  ff.layer.rifle.instanceMatrix.needsUpdate = true; ff.layer.bayonet.instanceMatrix.needsUpdate = true;
  if (recolor) {
    ff.colorKey = colKey; ff.colorN = n;
    if (ff.layer.body.instanceColor) ff.layer.body.instanceColor.needsUpdate = true;
    if (ff.layer.kepi.instanceColor) ff.layer.kepi.instanceColor.needsUpdate = true;
  }
  ff.grp.visible = true;
  ff.grp.userData.ff = { active: n, pose: pose, formation: u.formation, width: maxX - minX, depth: maxZ - minZ, mode: "shared-instanced", slot: ff.slot, layerCount: ff.layer.nextSlot, lod: "far", nearSlot: ff.nearSlot };
  fldFfMarkerVisible(g, false, u);
  var pegs = g.getObjectByName && g.getObjectByName("vfPegs");
  if (pegs) pegs.visible = false;
}

/* ---- wire-in ---- */
(function () {
  function _ffErr(e) { FLDFF_S.errN++; if (!FLDFF._warned && typeof console !== "undefined" && console.warn) { FLDFF._warned = true; console.warn("T24 formation-figures:", (e && e.message) || e); } }
  function _ffCarry(dst, src) { for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { try { dst[k] = src[k]; } catch (e) {} } } }

  if (typeof fld3dBuildUnits === "function" && !fld3dBuildUnits._ff) {
    var _obu = fld3dBuildUnits;
    fld3dBuildUnits = function () { var r = _obu.apply(this, arguments); try {
      if (__FIELD && __FIELD._u3d && __FIELD.units) {
        fldFfResetLayer();   // E19 (D231): reclaim slots + re-size the cap on every unit rebuild (reinforcements/phases)
        for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i], g = __FIELD._u3d[u.id]; if (g && fldFfShowFor(u, g)) fldFfEnsure(u, g); }
      }
    } catch (e) { _ffErr(e); } return r; };
    _ffCarry(fld3dBuildUnits, _obu); fld3dBuildUnits._ff = true;
  }

  if (typeof fld3dSyncUnit === "function" && !fld3dSyncUnit._ff) {
    var _osu = fld3dSyncUnit;
    fld3dSyncUnit = function (u, g) { var r = _osu.apply(this, arguments); try { fldFfSyncUnit(u, g); } catch (e) { _ffErr(e); } return r; };
    _ffCarry(fld3dSyncUnit, _osu); fld3dSyncUnit._ff = true;
  }

  if (typeof fldExit === "function" && !fldExit._ff) {
    var _oex = fldExit;
    fldExit = function () { try { FLDFF_S.layer = null; FLDFF_S.nearLayer = null; if (typeof __FIELD !== "undefined" && __FIELD) { __FIELD._ffLayer = null; __FIELD._ffNearLayer = null; } } catch (e) {} return _oex.apply(this, arguments); };
    _ffCarry(fldExit, _oex); fldExit._ff = true;
  }
})();
