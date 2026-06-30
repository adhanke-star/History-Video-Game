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
   =========================================================================== */

var FLDFF = {
  INF_CAP: 42,
  INF_MIN: 10,
  BODY_H: 13,
  BODY_R: 2.2,
  HEAD_R: 2.35,
  FILE_SP: 7.0,
  RANK_SP: 7.4
};

var FLDFF_S = { errN: 0 };

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
  var m = new T.MeshLambertMaterial({ color: color });
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

function fldFfCreate(u, g) {
  var T = window.THREE;
  if (!T || !u || !g || !g.add) return null;
  var old = g.getObjectByName && g.getObjectByName("ffFormation");
  if (old && old.parent) old.parent.remove(old);

  var sideCol = u.side === "US" ? "#334f86" : "#8f4538";
  var capCol = u.side === "US" ? "#1b2744" : "#5a2a24";
  var grp = new T.Group();
  grp.name = "ffFormation";
  grp.position.y = -4;

  var cap = FLDFF.INF_CAP;
  var body = fldFfInstanced(T, new T.CylinderGeometry(FLDFF.BODY_R, FLDFF.BODY_R * 1.08, FLDFF.BODY_H, 5),
    fldFfMakeMat(T, sideCol), cap, "ffBodies");
  var head = fldFfInstanced(T, new T.SphereGeometry(FLDFF.HEAD_R, 6, 4),
    fldFfMakeMat(T, "#d7b18b"), cap, "ffHeads");
  var kepi = fldFfInstanced(T, new T.CylinderGeometry(2.7, 2.45, 1.4, 6),
    fldFfMakeMat(T, capCol), cap, "ffKepis");
  var rifle = fldFfInstanced(T, new T.BoxGeometry(0.85, 0.85, 16),
    fldFfMakeMat(T, "#3a2618"), cap, "ffRifles");
  var bayonet = fldFfInstanced(T, new T.BoxGeometry(0.45, 0.45, 5.5),
    fldFfMakeMat(T, "#d9d4c6"), cap, "ffBayonets");

  grp.add(body); grp.add(head); grp.add(kepi); grp.add(rifle); grp.add(bayonet);
  g.add(grp);
  g.userData._ff = {
    grp: grp, body: body, head: head, kepi: kepi, rifle: rifle, bayonet: bayonet,
    dummy: new T.Object3D(), cap: cap, markerHidden: false
  };
  return g.userData._ff;
}

function fldFfEnsure(u, g) {
  if (!g || !g.userData) return null;
  var ff = g.userData._ff;
  if (ff && ff.grp && ff.grp.parent) return ff;
  return fldFfCreate(u, g);
}

function fldFfMarkerVisible(g, visible) {
  if (!g || !g.children) return;
  for (var i = 0; i < g.children.length; i++) {
    var ch = g.children[i];
    if (!ch) continue;
    var nm = ch.name || "";
    if (nm === "ffFormation" || nm === "flag" || nm === "corpsbadge" || nm === "ring" || nm === "vfShadow" || nm === "unitGlbModel") continue;
    ch.visible = visible;
  }
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
  var rows = col ? Math.max(5, Math.ceil(n / 4)) : 3;
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
  var d = ff.dummy;
  d.position.set(x, y, z);
  d.rotation.set(rx || 0, ry || 0, rz || 0);
  d.scale.set(sx || 1, sy || 1, sz || 1);
  d.updateMatrix();
  mesh.setMatrixAt(idx, d.matrix);
}

function fldFfSyncUnit(u, g) {
  if (!u || !g || !window.THREE) return;
  var show = fldFfShowFor(u, g);
  if (!show) {
    if (g.userData && g.userData._ff && g.userData._ff.grp) g.userData._ff.grp.visible = false;
    var glb = g.getObjectByName && g.getObjectByName("unitGlbModel");
    if (glb && glb.visible) return;                                // T23 owns base-marker visibility while a GLB hero mesh is active.
    fldFfMarkerVisible(g, true);
    return;
  }
  var ff = fldFfEnsure(u, g);
  if (!ff) return;

  var n = fldFfActiveCount(u, ff.cap);
  var pose = fldFfPose(u);
  var moving = pose === "march" || pose === "charge";
  var motion = fldFfMotion();
  var t = ((typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.t : 0) + fldFfPhase(u.id);
  var minX = 9999, maxX = -9999, minZ = 9999, maxZ = -9999;

  for (var i = 0; i < n; i++) {
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
    fldFfSetMatrix(ff, ff.body, i, p.x, bodyY, p.z, lean, p.yaw, 0, 1, bodyScaleY, 1);
    fldFfSetMatrix(ff, ff.head, i, p.x, (kneel ? 11.2 : 15.2) + bob, p.z - (charge ? 0.8 : 0), lean * 0.35, p.yaw, 0, 1, 1, 1);
    fldFfSetMatrix(ff, ff.kepi, i, p.x, (kneel ? 13.5 : 17.5) + bob, p.z - (charge ? 1.0 : 0), lean * 0.35, p.yaw, 0, 1, 1, 1);

    if (firing || charge) {
      var ry = p.yaw + (charge ? 0 : (frontRank ? 0 : 0.04));
      fldFfSetMatrix(ff, ff.rifle, i, p.x + 1.7, kneel ? 9.4 : 10.4, p.z - (charge ? 11.4 : 9.2), charge ? -0.08 : 0, ry, 0, 1, 1, 1);
      fldFfSetMatrix(ff, ff.bayonet, i, p.x + 1.7, kneel ? 9.4 : 10.4, p.z - (charge ? 21.8 : 18.0), charge ? -0.08 : 0, ry, 0, 1, 1, 1);
    } else {
      fldFfSetMatrix(ff, ff.rifle, i, p.x + 2.9, 12.0 + bob * 0.35, p.z + 1.4, Math.PI / 2, p.yaw + 0.12, 0, 1, 1, 1);
      fldFfSetMatrix(ff, ff.bayonet, i, p.x + 2.9, -60, p.z, 0, 0, 0, 0.01, 0.01, 0.01);
    }
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
  }

  ff.body.count = n; ff.head.count = n; ff.kepi.count = n; ff.rifle.count = n; ff.bayonet.count = n;
  ff.body.instanceMatrix.needsUpdate = true; ff.head.instanceMatrix.needsUpdate = true; ff.kepi.instanceMatrix.needsUpdate = true;
  ff.rifle.instanceMatrix.needsUpdate = true; ff.bayonet.instanceMatrix.needsUpdate = true;
  ff.grp.visible = true;
  ff.grp.userData.ff = { active: n, pose: pose, formation: u.formation, width: maxX - minX, depth: maxZ - minZ };

  if (ff.body.material && ff.body.material.color) {
    ff.body.material.color.set(u.side === "US" ? "#334f86" : "#8f4538");
    if (u.state === "routing") ff.body.material.color.multiplyScalar(0.62);
  }
  fldFfMarkerVisible(g, false);
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
})();
