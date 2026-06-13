/* ==== M3D_ATMOSPHERE — weather + day-phase lighting + 3D objective flags ===========
   Pushes the Modern look further (no assets):
     (A) Per-battle ATMOSPHERE — the flat warm sun + blue sky become weather/time
         aware. G.battle.wx (clear|hot|rain|fog|snow) and an optional bd.tod
         (dawn|day|dusk|night) drive sun color/intensity, sky color, fog density,
         and the hemisphere fill — so a rainy field reads grey and close, a foggy
         field swallows the distance, a clear field is bright and open.
     (B) 3D OBJECTIVE FLAGS — a banner on a staff over every objective hex, its
         cloth colored by who holds it (US blue / CS red / neutral grey). Objective
         control now reads at a glance in 3D (Classic shows it; Modern didn't).

   Append-only. Defines hook fns the parity _m3dSync/_m3dStartLoop call by typeof
   guard (no re-override). All guarded; never throws; Classic untouched. If an HDRI
   env is present (assets/3d/env/sky_day.hdr) we leave the sky/background to it and
   only tune sun + fog. State on __M3D.* ; nothing saved.
   ----------------------------------------------------------------------------------- */

// Weather/time -> lighting preset. Magnitudes match _m3dInit's baseline (fog 60..220).
function _m3dWeatherPreset(wx, tod) {
  var P;
  switch (wx) {
    case "rain":
      P = { sun: "#9fb0c8", sunInt: 0.50, sky: "#8a93a0", fog: "#8a93a0",
            fogNear: 30, fogFar: 150, hemiTop: "#b9c2cf", hemiBot: "#3a3a34", hemiInt: 0.55 }; break;
    case "fog":
      P = { sun: "#b8c0c8", sunInt: 0.55, sky: "#cfd3d6", fog: "#cfd3d6",
            fogNear: 14, fogFar: 95,  hemiTop: "#dfe3e6", hemiBot: "#4a4a44", hemiInt: 0.72 }; break;
    case "snow":
      P = { sun: "#e8eef6", sunInt: 0.95, sky: "#d4dce6", fog: "#d4dce6",
            fogNear: 40, fogFar: 175, hemiTop: "#eef4fb", hemiBot: "#6a6e74", hemiInt: 0.98 }; break;
    case "hot":
      P = { sun: "#fff0bf", sunInt: 1.22, sky: "#d8d2bf", fog: "#d8d2bf",
            fogNear: 48, fogFar: 190, hemiTop: "#e8e2cf", hemiBot: "#5a4a32", hemiInt: 0.86 }; break;
    case "clear":
    default:
      P = { sun: "#fff2d0", sunInt: 1.15, sky: "#bcd0e0", fog: "#bcd0e0",
            fogNear: 60, fogFar: 220, hemiTop: "#dceaff", hemiBot: "#5a4a32", hemiInt: 0.70 }; break;
  }
  // Time-of-day tint over the weather preset (default "day" = no change).
  if (tod === "dawn")      { P.sun = "#ffd9a0"; P.sunInt *= 0.85; P.sky = _m3dMix(P.sky, "#d8b890", 0.4); P.fog = P.sky; }
  else if (tod === "dusk") { P.sun = "#ff9d66"; P.sunInt *= 0.80; P.sky = _m3dMix(P.sky, "#c8855a", 0.45); P.fog = P.sky; }
  else if (tod === "night"){ P.sun = "#7a86b0"; P.sunInt *= 0.30; P.sky = _m3dMix(P.sky, "#243050", 0.7); P.fog = P.sky; P.hemiInt *= 0.6; }
  return P;
}

// hex-color blend a->b by t (0..1), returned as "#rrggbb".
function _m3dMix(a, b, t) {
  try {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
    var br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
    var r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  } catch (e) { return a; }
}

// Apply the current battle's atmosphere to sun / hemisphere / sky / fog.
function _m3dApplyAtmosphere() {
  try {
    if (!__M3D || !__M3D.ready || !__M3D.scene || !window.THREE || !G.battle) return;
    var T = window.THREE, B = G.battle;
    var wx = B.wx || "clear";
    var tod = (B.bd && B.bd.tod) || "day";
    var P = _m3dWeatherPreset(wx, tod);
    if (__M3D.sun) { __M3D.sun.color = new T.Color(P.sun); __M3D.sun.intensity = P.sunInt; }
    // hemisphere fill is created in _m3dInit without a stored ref — find it in the scene.
    for (var i = 0; i < __M3D.scene.children.length; i++) {
      var o = __M3D.scene.children[i];
      if (o && o.isHemisphereLight) {
        if (o.color) o.color.set(P.hemiTop);
        if (o.groundColor) o.groundColor.set(P.hemiBot);
        o.intensity = P.hemiInt;
      }
    }
    // Don't clobber an HDRI environment background if one loaded; always tune fog.
    if (!__M3D.envReady) { __M3D.scene.background = new T.Color(P.sky); }
    __M3D.scene.fog = new T.Fog(new T.Color(P.fog), P.fogNear, P.fogFar);
  } catch (e) {}
}

/* ---- 3D objective flags ------------------------------------------------------------ */

function _m3dObjColor(owner) {
  return owner === "US" ? "#2f57a8" : owner === "CS" ? "#9a3a30" : "#7a7468"; // blue / red / neutral grey
}

// Build a staff + banner over each objective hex (rebuilt per battle).
function _m3dBuildObjFlags() {
  try {
    if (!__M3D || !__M3D.scene || !G.battle || !window.THREE) return;
    var T = window.THREE, M = G.battle.M;
    if (!__M3D.objGroup) { __M3D.objGroup = new T.Group(); __M3D.scene.add(__M3D.objGroup); }
    var grp = __M3D.objGroup;
    while (grp.children.length) {
      var c0 = grp.children[0]; grp.remove(c0);
      if (c0.material && c0.material.dispose) c0.material.dispose();
      if (c0.geometry && c0.geometry.dispose) c0.geometry.dispose();
    }
    var objs = (M && M.objs) || [];
    for (var i = 0; i < objs.length; i++) {
      var o = objs[i];
      var tile = M.map[M.key(o.c, o.r)];
      var elev = tile ? (tile.elev || 0) : 0;
      var w = _m3dWorld(o.c, o.r, 0);
      var baseY = _m3dTileH(elev);
      var poleH = 3.2;
      var pole = new T.Mesh(
        new T.CylinderGeometry(0.06, 0.06, poleH, 6),
        new T.MeshBasicMaterial({ color: new T.Color("#3a2f20") })
      );
      pole.position.set(w.x, baseY + poleH / 2, w.z);
      grp.add(pole);
      var cloth = new T.Mesh(
        new T.PlaneGeometry(1.5, 0.95),
        new T.MeshLambertMaterial({ color: new T.Color(_m3dObjColor(o.owner)), side: T.DoubleSide })
      );
      cloth.position.set(w.x + 0.78, baseY + poleH - 0.6, w.z);
      cloth.userData = { obj: o, kind: "objflag" };
      grp.add(cloth);
      // gold finial so the staff reads as a standard, not a stick
      var fin = new T.Mesh(
        new T.SphereGeometry(0.12, 8, 6),
        new T.MeshBasicMaterial({ color: new T.Color("#caa14a") })
      );
      fin.position.set(w.x, baseY + poleH + 0.02, w.z);
      grp.add(fin);
    }
  } catch (e) {}
}

// Recolor banners to the current controller (objective ownership changes mid-battle).
function _m3dSyncObjFlags() {
  try {
    if (!__M3D || !__M3D.objGroup || !window.THREE) return;
    var kids = __M3D.objGroup.children;
    for (var i = 0; i < kids.length; i++) {
      var c0 = kids[i];
      if (c0.userData && c0.userData.kind === "objflag" && c0.userData.obj && c0.material && c0.material.color) {
        c0.material.color.set(_m3dObjColor(c0.userData.obj.owner));
      }
    }
  } catch (e) {}
}
