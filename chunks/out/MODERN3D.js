/* ==== §23 — MODERN 3D RENDERER (WebGL / Three.js) ====
   Graphics mode "modern" — a real 3D battlefield (terrain heightmap + orbit
   camera + lighting + 3D unit tokens + raycast hex-picking). "classic" keeps
   the existing 2D canvas board untouched. Toggle in Settings.

   Progressive fidelity: v1 = vertex-colored hex terrain + simple unit tokens
   (works once Three.js loads; tokens upgrade to painted billboards, then to
   .glb models from assets/3d/ as those land). Three.js + addons load from
   jsdelivr (the game runs in the user's own browser — not the cdnjs-only
   artifact sandbox — so addons like OrbitControls are available).

   Everything is GUARDED: if Three fails to load (offline / blocked), we revert
   to "classic" with a toast and the 2D game is unaffected. The 2D renderer is
   never modified — draw() just early-returns its battlefield paint when modern
   is active (see the guard spliced into draw()).
   ---------------------------------------------------------------- */
var __M3D = {
  loading: false, ready: false, failed: false,
  scene: null, camera: null, renderer: null, controls: null,
  raf: 0, glcv: null, terrainGroup: null, unitGroup: null,
  raycaster: null, battleId: null, S: 0.06, EH: 2.4,
};
var THREE_URLS = [
  "https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js",
  "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js",
];

function _m3dModern() { return G.settings && G.settings.gfx === "modern"; }

function _m3dLoadScripts(cb) {
  if (typeof window === "undefined") { cb(false); return; }
  if (window.THREE && window.THREE.OrbitControls) { cb(true); return; }
  var i = 0;
  function next() {
    if (i >= THREE_URLS.length) { cb(!!(window.THREE && window.THREE.OrbitControls)); return; }
    var s = document.createElement("script");
    s.src = THREE_URLS[i++];
    s.onload = next;
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }
  next();
}

function _m3dEnsureCanvas() {
  if (__M3D.glcv) return __M3D.glcv;
  var map = document.getElementById("map");
  if (!map) return null;
  var gl = document.getElementById("gl");
  if (!gl) {
    gl = document.createElement("canvas");
    gl.id = "gl";
    gl.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;display:none;";
    map.parentNode.insertBefore(gl, map.nextSibling);
  }
  __M3D.glcv = gl;
  return gl;
}

// Activate modern mode: load Three, build the scene, swap canvases, start loop.
function _m3dActivate() {
  if (!_m3dModern()) return;
  if (__M3D.failed) { _m3dRevert("3D unavailable — using Classic."); return; }
  if (__M3D.ready) { _m3dShow(); return; }
  if (__M3D.loading) return;
  __M3D.loading = true;
  if (typeof toast === "function") toast("Loading 3D battlefield…", 1600);
  _m3dLoadScripts(function (ok) {
    __M3D.loading = false;
    if (!ok || !window.THREE) { __M3D.failed = true; _m3dRevert("Couldn't load 3D (offline?) — using Classic."); return; }
    try {
      _m3dInit();
      __M3D.ready = true;
      _m3dShow();
    } catch (e) {
      __M3D.failed = true;
      _m3dRevert("3D init failed — using Classic.");
    }
  });
}

function _m3dRevert(msg) {
  if (G.settings) G.settings.gfx = "classic";
  _m3dDeactivate();
  if (typeof toast === "function") toast(msg, 2400);
  if (typeof _renderSettings === "function" && G.mode !== "battle") { /* settings sheet refresh handled by caller */ }
  if (typeof draw === "function") draw();
}

function _m3dInit() {
  var T = window.THREE;
  var gl = _m3dEnsureCanvas();
  __M3D.renderer = new T.WebGLRenderer({ canvas: gl, antialias: true });
  __M3D.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  __M3D.scene = new T.Scene();
  __M3D.scene.background = new T.Color("#bcd0e0");
  __M3D.scene.fog = new T.Fog("#bcd0e0", 60, 220);
  __M3D.camera = new T.PerspectiveCamera(48, 1, 0.1, 2000);
  __M3D.controls = new T.OrbitControls(__M3D.camera, gl);
  __M3D.controls.enableDamping = true;
  __M3D.controls.dampingFactor = 0.08;
  __M3D.controls.maxPolarAngle = Math.PI * 0.49; // don't go under the ground
  __M3D.controls.minDistance = 8;
  __M3D.controls.maxDistance = 240;
  // lights: warm sun + cool sky fill (sunlit-field art direction)
  var sun = new T.DirectionalLight("#fff2d0", 1.05);
  sun.position.set(40, 80, 30);
  __M3D.scene.add(sun);
  __M3D.scene.add(new T.HemisphereLight("#dceaff", "#5a4a32", 0.75));
  __M3D.raycaster = new T.Raycaster();
  __M3D.terrainGroup = new T.Group();
  __M3D.unitGroup = new T.Group();
  __M3D.scene.add(__M3D.terrainGroup);
  __M3D.scene.add(__M3D.unitGroup);
  // pointer picking
  gl.addEventListener("pointerup", _m3dPointerUp);
  _m3dResize();
}

// world hex pixel → centered 3D coords
function _m3dWorld(c, r, elev) {
  var M = G.battle.M;
  var p = colrowToPixel(c, r);
  var cx = colrowToPixel(M.GW / 2, M.GH / 2);
  return {
    x: (p.x - cx.x) * __M3D.S,
    y: (elev || 0) * __M3D.EH,
    z: (p.y - cx.y) * __M3D.S,
  };
}

function _m3dTerrainColor(t) {
  var pal = (typeof PALETTE !== "undefined" && PALETTE[0]) ? PALETTE[0] : null;
  var c = (pal && pal[t.t]) || "#9a8a5a";
  return new window.THREE.Color(c);
}

function _m3dBuildTerrain() {
  var T = window.THREE, M = G.battle.M;
  while (__M3D.terrainGroup.children.length) __M3D.terrainGroup.remove(__M3D.terrainGroup.children[0]);
  var rad = hexW() * 0.5 * __M3D.S * 1.04;
  for (var r = 0; r < M.GH; r++) {
    for (var c = 0; c < M.GW; c++) {
      var t = M.map[M.key(c, r)];
      if (!t) continue;
      var elev = t.elev || 0;
      var h = 0.6 + elev * 0.9;
      var geo = new T.CylinderGeometry(rad, rad, h, 6);
      var mat = new T.MeshLambertMaterial({ color: _m3dTerrainColor(t) });
      var mesh = new T.Mesh(geo, mat);
      var w = _m3dWorld(c, r, 0);
      mesh.position.set(w.x, w.y + h / 2, w.z);
      mesh.rotation.y = Math.PI / 6; // align flat-side for pointy-top look
      mesh.userData = { c: c, r: r, kind: "hex" };
      __M3D.terrainGroup.add(mesh);
    }
  }
  // frame the camera on the field once per battle
  var ctr = _m3dWorld(M.GW / 2, M.GH / 2, 0);
  var span = Math.max(M.GW, M.GH) * hexW() * __M3D.S;
  __M3D.controls.target.set(ctr.x, 0, ctr.z);
  __M3D.camera.position.set(ctr.x, span * 0.9, ctr.z + span * 1.1);
  __M3D.controls.update();
}

function _m3dSideColor(side) { return side === "US" ? "#2b4d7e" : "#8a7d66"; }

function _m3dBuildUnits() {
  var T = window.THREE, B = G.battle, M = B.M;
  while (__M3D.unitGroup.children.length) __M3D.unitGroup.remove(__M3D.unitGroup.children[0]);
  for (var i = 0; i < B.units.length; i++) {
    var u = B.units[i];
    if (!u.alive) continue;
    if (u.side === B.enemySide && !u.spotted) continue;
    var t = M.map[M.key(u.c, u.r)];
    var elev = t ? (t.elev || 0) : 0;
    var w = _m3dWorld(u.c, u.r, elev);
    var grp = new T.Group();
    // body token
    var bodyH = u.type === "hq" ? 2.6 : 2.0;
    var col = _m3dSideColor(u.side);
    var body = new T.Mesh(
      new T.CylinderGeometry(0.7, 0.9, bodyH, 10),
      new T.MeshLambertMaterial({ color: new T.Color(col) })
    );
    body.position.y = 0.6 + bodyH / 2;
    grp.add(body);
    // little flag
    var flag = new T.Mesh(
      new T.PlaneGeometry(1.1, 0.7),
      new T.MeshBasicMaterial({ color: new T.Color(u.side === "US" ? "#c0392b" : "#3a3a3a"), side: T.DoubleSide })
    );
    flag.position.set(0.5, 0.6 + bodyH + 0.3, 0);
    grp.add(flag);
    // selection ring
    if (G.sel === u) {
      var ring = new T.Mesh(
        new T.RingGeometry(1.1, 1.5, 16),
        new T.MeshBasicMaterial({ color: new T.Color("#c9a85f"), side: T.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.62;
      grp.add(ring);
    }
    grp.position.set(w.x, w.y, w.z);
    grp.traverse(function (o) { o.userData = { unit: u, kind: "unit" }; });
    __M3D.unitGroup.add(grp);
  }
}

// Rebuild dynamic content (called from draw() while modern is active).
function _m3dSync() {
  if (!__M3D.ready || !G.battle) return;
  if (__M3D.battleId !== G.battle.bd.id) {
    __M3D.battleId = G.battle.bd.id;
    _m3dBuildTerrain();
  }
  _m3dBuildUnits();
}

function _m3dShow() {
  var map = document.getElementById("map");
  if (map) map.style.display = "none";
  if (__M3D.glcv) __M3D.glcv.style.display = "block";
  _m3dResize();
  __M3D.battleId = null; // force terrain rebuild
  _m3dSync();
  _m3dStartLoop();
}

function _m3dDeactivate() {
  if (__M3D.raf) { cancelAnimationFrame(__M3D.raf); __M3D.raf = 0; }
  if (__M3D.glcv) __M3D.glcv.style.display = "none";
  var map = document.getElementById("map");
  if (map) map.style.display = "";
}

function _m3dStartLoop() {
  if (__M3D.raf) return;
  function tick() {
    __M3D.raf = requestAnimationFrame(tick);
    if (!_m3dModern() || !__M3D.ready) { cancelAnimationFrame(__M3D.raf); __M3D.raf = 0; return; }
    if (__M3D.controls) __M3D.controls.update();
    if (__M3D.renderer && __M3D.scene && __M3D.camera) __M3D.renderer.render(__M3D.scene, __M3D.camera);
  }
  __M3D.raf = requestAnimationFrame(tick);
}

function _m3dResize() {
  if (!__M3D.renderer || !__M3D.camera) return;
  var w = window.innerWidth, h = window.innerHeight;
  __M3D.renderer.setSize(w, h, false);
  __M3D.camera.aspect = w / Math.max(1, h);
  __M3D.camera.updateProjectionMatrix();
}

function _m3dPointerUp(e) {
  if (!_m3dModern() || !__M3D.ready || G.mode !== "battle") return;
  var T = window.THREE, gl = __M3D.glcv;
  var rect = gl.getBoundingClientRect();
  var mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  var my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  __M3D.raycaster.setFromCamera({ x: mx, y: my }, __M3D.camera);
  // units first, then terrain
  var hitU = __M3D.raycaster.intersectObjects(__M3D.unitGroup.children, true);
  if (hitU.length && hitU[0].object.userData && hitU[0].object.userData.unit) {
    var u = hitU[0].object.userData.unit;
    if (typeof onHexClick === "function") onHexClick(u.c, u.r);
    return;
  }
  var hitT = __M3D.raycaster.intersectObjects(__M3D.terrainGroup.children, false);
  if (hitT.length) {
    var d = hitT[0].object.userData;
    if (d && typeof onHexClick === "function") onHexClick(d.c, d.r);
  }
}
