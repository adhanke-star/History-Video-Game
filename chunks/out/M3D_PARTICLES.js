/* ===== M3D_PARTICLES.js — cinematic battlefield particles (append-only) =============
   Adds two $0 atmosphere layers to the Modern renderer, both driven from the per-frame
   hook _m3dFrameUpdate(dt, now) that M3D_POSTFX's render loop calls (guarded). NO new
   assets, NO core edits, Classic untouched.

     (A) WEATHER PARTICLES — rain streaks / drifting snow, a camera-following volume
         driven by G.battle.wx (rain|snow). Perf-tiered counts; OFF on low tier and
         under reduceMotion. Recycled in a fixed box that tracks the look target, so it
         always fills the view at any zoom/pan.
     (B) LINGERING POWDER-SMOKE BANKS — the locked 3D look (#8): when the shared G.fx
         queue emits a fire/smoke event (a volley/cannon), occasionally spawn a large,
         long-lived soft smoke puff that drifts downwind, rises, expands and slowly fades
         — so banks of powder smoke hang over the firing lines (beyond the 2D transient
         puffs). Capped + perf-tiered + reduceMotion-off.

   DISPATCHER: _m3dFrameUpdate calls guarded sub-hooks (_m3dWeatherUpdate,
   _m3dSmokeBankUpdate, _m3dMixerUpdate) so later chunks add behavior by DEFINING a
   sub-hook, never by re-overriding the loop. Reuses _m3dSoftTex / _m3dWorld / _m3dTileH /
   _m3dLowTier from the engine. Bare globals only (G). Never throws into the frame.
   ------------------------------------------------------------------------------------ */

/* ---- per-frame dispatcher (the loop calls this; defined once, here) ----------------- */
function _m3dFrameUpdate(dt, now) {
  if (!__M3D || !__M3D.ready || !window.THREE || !G.battle) return;
  if (typeof _m3dWeatherUpdate === "function")   { try { _m3dWeatherUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dSmokeBankUpdate === "function") { try { _m3dSmokeBankUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dMixerUpdate === "function")     { try { _m3dMixerUpdate(dt, now); } catch (e) {} } // G4 hook
}

/* ---- particle perf budget: counts by tier (0 = off) -------------------------------- */
function _m3dPartBudget() {
  var q = G.settings && G.settings.gfxQuality;
  var low = (typeof _m3dLowTier === "function") ? _m3dLowTier() : false;
  if (q === "low" || low) return { rain: 0, snow: 0, banks: 0 };
  if (q === "high")       return { rain: 1700, snow: 1100, banks: 36 };
  return { rain: 850, snow: 600, banks: 18 };          // auto
}

/* ---- small streak/flake textures (cached on __M3D.fxShared) ------------------------- */
function _m3dRainTex() {
  if (__M3D.fxShared && __M3D.fxShared.rain) return __M3D.fxShared.rain;
  var cv = document.createElement("canvas"); cv.width = 8; cv.height = 32;
  var g = cv.getContext("2d");
  var grd = g.createLinearGradient(0, 0, 0, 32);
  grd.addColorStop(0, "rgba(200,212,228,0)");
  grd.addColorStop(0.5, "rgba(200,212,228,0.85)");
  grd.addColorStop(1, "rgba(200,212,228,0)");
  g.fillStyle = grd; g.fillRect(2, 0, 4, 32);
  var t = (typeof _m3dTex === "function") ? _m3dTex(cv) : new window.THREE.CanvasTexture(cv);
  __M3D.fxShared = __M3D.fxShared || {}; __M3D.fxShared.rain = t; return t;
}
function _m3dSnowTex() {
  if (__M3D.fxShared && __M3D.fxShared.snow) return __M3D.fxShared.snow;
  var cv = document.createElement("canvas"); cv.width = cv.height = 16;
  var g = cv.getContext("2d");
  var grd = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grd.addColorStop(0, "rgba(255,255,255,0.95)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.beginPath(); g.arc(8, 8, 8, 0, 7); g.fill();
  var t = (typeof _m3dTex === "function") ? _m3dTex(cv) : new window.THREE.CanvasTexture(cv);
  __M3D.fxShared = __M3D.fxShared || {}; __M3D.fxShared.snow = t; return t;
}

/* ---- (A) weather particles --------------------------------------------------------- */
function _m3dDisposeWeather() {
  var w = __M3D.weather;
  if (!w) return;
  if (w.obj && w.obj.parent) w.obj.parent.remove(w.obj);
  if (w.obj && w.obj.geometry && w.obj.geometry.dispose) w.obj.geometry.dispose();
  if (w.obj && w.obj.material && w.obj.material.dispose) w.obj.material.dispose();
  __M3D.weather = null;
}

function _m3dBuildWeather(kind, count) {
  var T = window.THREE;
  var W = 150, H = 95;                                  // box footprint + height (world units)
  var pos = new Float32Array(count * 3);
  var vel = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    var rx = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1); // deterministic [0,1) spread (no Math.random)
    var rz = Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1);
    pos[i * 3]     = rx * W - W / 2;
    pos[i * 3 + 1] = ((i * 37) % 1000) / 1000 * H;
    pos[i * 3 + 2] = rz * W - W / 2;
    if (kind === "rain") { vel[i * 3] = 2.5; vel[i * 3 + 1] = -62 - (i % 7) * 3; vel[i * 3 + 2] = 1.0; }
    else { vel[i * 3] = 1.6; vel[i * 3 + 1] = -6 - (i % 5); vel[i * 3 + 2] = 1.2; }
  }
  var geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.BufferAttribute(pos, 3));
  var mat = new T.PointsMaterial({
    map: kind === "rain" ? _m3dRainTex() : _m3dSnowTex(),
    color: kind === "rain" ? new T.Color("#b6c2d2") : new T.Color("#ffffff"),
    size: kind === "rain" ? 1.5 : 1.1,
    transparent: true, opacity: kind === "rain" ? 0.5 : 0.85,
    depthWrite: false, sizeAttenuation: true, fog: false
  });
  var pts = new T.Points(geo, mat);
  pts.frustumCulled = false;
  __M3D.scene.add(pts);
  __M3D.weather = { kind: kind, obj: pts, vel: vel, W: W, H: H, count: count };
}

function _m3dWeatherUpdate(dt, now) {
  var rm = !!(G.settings && G.settings.reduceMotion);
  var bud = _m3dPartBudget();
  var wx = (G.battle && G.battle.wx) || "clear";
  var want = (!rm && (wx === "rain" || wx === "snow")) ? wx : null;
  var count = want === "rain" ? bud.rain : want === "snow" ? bud.snow : 0;
  if (!want || count <= 0) { if (__M3D.weather) _m3dDisposeWeather(); return; }
  if (!__M3D.weather || __M3D.weather.kind !== want) { _m3dDisposeWeather(); _m3dBuildWeather(want, count); }
  var w = __M3D.weather; if (!w) return;
  // box follows the camera look target so the volume always fills the view
  var ctr = (__M3D.controls && __M3D.controls.target) ? __M3D.controls.target : { x: 0, y: 0, z: 0 };
  w.obj.position.set(ctr.x, ctr.y, ctr.z);
  var p = w.obj.geometry.attributes.position.array, vel = w.vel, W = w.W, H = w.H, n = w.count;
  var d = Math.min(0.05, dt || 0.016);
  for (var i = 0; i < n; i++) {
    var ix = i * 3;
    p[ix]     += vel[ix] * d;
    p[ix + 1] += vel[ix + 1] * d;
    p[ix + 2] += vel[ix + 2] * d;
    if (p[ix + 1] < -10) { p[ix + 1] += H; }            // recycle to top of the box
    if (p[ix] >  W / 2) p[ix] -= W; else if (p[ix] < -W / 2) p[ix] += W;
    if (p[ix + 2] > W / 2) p[ix + 2] -= W; else if (p[ix + 2] < -W / 2) p[ix + 2] += W;
  }
  w.obj.geometry.attributes.position.needsUpdate = true;
}

/* ---- (B) lingering powder-smoke banks ---------------------------------------------- */
function _m3dSmokeBankUpdate(dt, now) {
  var T = window.THREE;
  var rm = !!(G.settings && G.settings.reduceMotion);
  var cap = _m3dPartBudget().banks;
  if (!__M3D.bankGroup) { __M3D.bankGroup = new T.Group(); __M3D.scene.add(__M3D.bankGroup); }
  if (!__M3D.banks) __M3D.banks = [];
  // clear banks on battle change (stale positions)
  if (__M3D._bankBattle !== G.battle.bd.id) {
    __M3D._bankBattle = G.battle.bd.id;
    while (__M3D.bankGroup.children.length) { var c0 = __M3D.bankGroup.children[0]; __M3D.bankGroup.remove(c0); if (c0.material && c0.material.dispose) c0.material.dispose(); }
    __M3D.banks.length = 0;
  }
  if (rm || cap <= 0) {                                  // banks off → drain any live ones quickly
    for (var z = __M3D.banks.length - 1; z >= 0; z--) { var b0 = __M3D.banks[z]; __M3D.bankGroup.remove(b0.spr); if (b0.spr.material && b0.spr.material.dispose) b0.spr.material.dispose(); __M3D.banks.splice(z, 1); }
    return;
  }
  var d = Math.min(0.05, dt || 0.016);
  // spawn from fresh fire/smoke FX events (mark so we only seed once per event)
  var fx = G.fx;
  if (fx && fx.length && __M3D.banks.length < cap) {
    for (var j = 0; j < fx.length; j++) {
      var e = fx[j];
      if (e.__bank || (e.type !== "fire" && e.type !== "smoke")) continue;
      e.__bank = true;
      // deterministic-ish gate: ~55% of events seed a bank (skip via hex parity to avoid Math.random)
      if (((e.c + e.r + (e.born | 0)) % 100) > 55) continue;
      if (__M3D.banks.length >= cap) break;
      var w = _m3dWorld(e.c, e.r, 0);
      var tile = G.battle.M.map[G.battle.M.key(e.c, e.r)];
      var elev = tile ? (tile.elev || 0) : 0;
      var baseY = _m3dTileH(elev);
      var tex = (typeof _m3dSoftTex === "function") ? _m3dSoftTex("smoke", "rgba(222,220,214,0.95)", "rgba(210,208,202,0)") : null;
      var mat = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 });
      var spr = new T.Sprite(mat);
      spr.renderOrder = 6;
      __M3D.bankGroup.add(spr);
      var wdx = (e.windDx || 0.4), wdz = (e.windDy || -0.3);
      __M3D.banks.push({ spr: spr, born: now, life: 5200 + ((e.c * 7 + e.r * 13) % 2600),
        x: w.x + ((e.offsetX || 0) * 0.04), y: baseY + 2.2, z: w.z + ((e.offsetY || 0) * 0.04),
        vx: wdx * 2.6, vy: 1.5, vz: wdz * 2.6, s0: 5 + ((e.c + e.r) % 4) });
    }
  }
  // advance + fade banks
  for (var k = __M3D.banks.length - 1; k >= 0; k--) {
    var b = __M3D.banks[k];
    var age = now - b.born, t = age / b.life;
    if (t >= 1) { __M3D.bankGroup.remove(b.spr); if (b.spr.material && b.spr.material.dispose) b.spr.material.dispose(); __M3D.banks.splice(k, 1); continue; }
    b.x += b.vx * d; b.y += b.vy * d; b.z += b.vz * d; b.vy *= 0.992;
    var s = b.s0 * (1 + t * 1.6);
    var fade = Math.sin(Math.min(1, t * 1.0) * Math.PI);   // bell: 0→peak→0
    b.spr.position.set(b.x, b.y, b.z);
    b.spr.scale.set(s, s, 1);
    b.spr.material.opacity = fade * 0.42;
  }
}
