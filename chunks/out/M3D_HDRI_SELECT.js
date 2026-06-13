/* ===== M3D_HDRI_SELECT.js — day-phase / weather HDRI selection (append-only) =========
   Completes G2: the Modern sky now picks the RIGHT Poly Haven HDRI for the battle's
   weather + time-of-day, instead of always sky_day:
     rain | fog | snow | overcast  -> sky_overcast.hdr  (grey diffuse — cohesive storm)
     dawn | dusk                   -> sky_dusk.hdr       (warm raking golden light)
     else                          -> sky_day.hdr        (bright clear sun)

   DESIGN: append-only override by redeclaration (last def wins).
     - _m3dLoadEnv (was: hardcoded sky_day) -> selects + loads the right HDRI.
     - _m3dApplyAtmosphere (atmosphere chunk) -> replicated VERBATIM + one added call to
       _m3dSelectEnv(), so the sky re-selects on every battle build (parity _m3dSync calls
       _m3dApplyAtmosphere on battle change). PMREM envs are cached per name so swapping
       weather never re-decodes. All guarded; missing .hdr -> keeps the current sky.
     - Bare globals only (G). Never throws.
   ------------------------------------------------------------------------------------ */

function _m3dHDRIName() {
  var B = G.battle; if (!B) return "sky_day";
  var wx = B.wx || "clear";
  var tod = (B.bd && B.bd.tod) || "day";
  if (wx === "rain" || wx === "fog" || wx === "snow" || wx === "overcast") return "sky_overcast";
  if (tod === "dusk" || tod === "dawn") return "sky_dusk";
  return "sky_day";
}

// Load/apply the HDRI for the current weather+tod (cached PMREM env per name).
function _m3dSelectEnv(force) {
  try {
    var T = window.THREE;
    if (!T || !T.RGBELoader || !__M3D || !__M3D.renderer || !__M3D.scene) return;
    var name = _m3dHDRIName();
    if (!force && name === __M3D.envName && __M3D.envReady) return;
    __M3D.envCache = __M3D.envCache || {};
    if (__M3D.envCache[name]) {                       // already decoded → instant swap
      __M3D.scene.environment = __M3D.envCache[name];
      __M3D.scene.background = __M3D.envCache[name];
      __M3D.envName = name; __M3D.envReady = true;
      return;
    }
    if (__M3D._envLoading === name) return;           // in flight
    __M3D._envLoading = name;
    new T.RGBELoader().load("assets/3d/env/" + name + ".hdr", function (tex) {
      try {
        tex.mapping = T.EquirectangularReflectionMapping;
        var pmrem = new T.PMREMGenerator(__M3D.renderer);
        var env = pmrem.fromEquirectangular(tex).texture;
        __M3D.envCache[name] = env;
        if (_m3dHDRIName() === name) {                 // still wanted (weather may have changed during load)
          __M3D.scene.environment = env;
          __M3D.scene.background = env;
          __M3D.envName = name; __M3D.envReady = true;
        }
        tex.dispose(); pmrem.dispose();
        __M3D._envLoading = null;
      } catch (e) { __M3D._envLoading = null; }
    }, undefined, function () { __M3D._envLoading = null; }); // missing asset → keep current sky
  } catch (e) {}
}

// OVERRIDE: initial env load now selects by weather/tod instead of hardcoding sky_day.
function _m3dLoadEnv() { _m3dSelectEnv(true); }

// OVERRIDE: replicate the atmosphere body VERBATIM, then re-select the HDRI for this battle.
function _m3dApplyAtmosphere() {
  try {
    if (!__M3D || !__M3D.ready || !__M3D.scene || !window.THREE || !G.battle) return;
    var T = window.THREE, B = G.battle;
    var wx = B.wx || "clear";
    var tod = (B.bd && B.bd.tod) || "day";
    var P = _m3dWeatherPreset(wx, tod);
    if (__M3D.sun) { __M3D.sun.color = new T.Color(P.sun); __M3D.sun.intensity = P.sunInt; }
    for (var i = 0; i < __M3D.scene.children.length; i++) {
      var o = __M3D.scene.children[i];
      if (o && o.isHemisphereLight) {
        if (o.color) o.color.set(P.hemiTop);
        if (o.groundColor) o.groundColor.set(P.hemiBot);
        o.intensity = P.hemiInt;
      }
    }
    if (!__M3D.envReady) { __M3D.scene.background = new T.Color(P.sky); }
    __M3D.scene.fog = new T.Fog(new T.Color(P.fog), P.fogNear, P.fogFar);
    _m3dSelectEnv();                                   // re-pick the HDRI for this battle's weather/tod
  } catch (e) {}
}
