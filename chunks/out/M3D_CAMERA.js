/* ===== M3D_CAMERA.js — cinematic camera: idle drift + combat auto-frame (append-only) ==
   $0 engine-only camera life for the Modern renderer, gated on the existing
   G.settings.follow toggle + reduceMotion:
     - IDLE DRIFT: after ~5s of no player input, OrbitControls.autoRotate slowly breathes
       the camera around the field (a gentle cinematic orbit). Cancels the instant the
       player touches the camera.
     - COMBAT AUTO-FRAME: when the player is idle and there's recent combat (fresh G.fx
       events), ease the look target toward the centroid of the fighting — the camera
       drifts to watch the action during the AI phase. Player input always wins.

   INTEGRATION: redeclares the _m3dFrameUpdate dispatcher (winning) = replicate the props
   dispatch VERBATIM + a guarded _m3dCameraUpdate call. Interaction is detected by lazily
   wiring pointerdown/wheel listeners on the GL canvas (robust vs OrbitControls 'start').
   reduceMotion → no auto-motion. Bare globals (G, performance). Never throws.
   ------------------------------------------------------------------------------------ */

// Centroid (world x,z) of recent combat FX, or null if no fresh combat.
function _m3dCombatCentroid(now) {
  try {
    var fx = G.fx; if (!fx || !fx.length || !G.battle) return null;
    var sx = 0, sz = 0, n = 0;
    for (var i = 0; i < fx.length; i++) {
      var e = fx[i];
      if ((now - e.born) > 1600) continue;           // only fresh events
      if (e.type !== "fire" && e.type !== "num" && e.type !== "smoke") continue;
      var w = _m3dWorld(e.c, e.r, 0);
      sx += w.x; sz += w.z; n++;
    }
    if (!n) return null;
    return { x: sx / n, z: sz / n };
  } catch (e) { return null; }
}

function _m3dCameraUpdate(dt, now) {
  var c = __M3D.controls; if (!c) return;
  // lazy-wire interaction listeners on the GL canvas (mark _lastInteract)
  if (!__M3D._camWired && __M3D.glcv) {
    var mark = function () { __M3D._lastInteract = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now(); };
    __M3D.glcv.addEventListener("pointerdown", mark, { passive: true });
    __M3D.glcv.addEventListener("wheel", mark, { passive: true });
    if (c.addEventListener) c.addEventListener("start", mark);
    __M3D._camWired = true;
    __M3D._lastInteract = now;                        // start idle clock at battle entry
  }
  var rm = !!(G.settings && G.settings.reduceMotion);
  var follow = !(G.settings && G.settings.follow === false); // default on
  if (rm || !follow) { if (c.autoRotate) c.autoRotate = false; return; }
  var sinceInteract = now - (__M3D._lastInteract || 0);
  if (sinceInteract < 1500) { if (c.autoRotate) c.autoRotate = false; return; } // player is driving
  // idle: prefer auto-framing live combat, else a gentle drift
  var combat = _m3dCombatCentroid(now);
  if (combat) {
    c.autoRotate = false;
    var k = Math.min(1, (dt || 0.016) * 0.9);
    c.target.x += (combat.x - c.target.x) * k;
    c.target.z += (combat.z - c.target.z) * k;
  } else if (sinceInteract > 5000) {
    c.autoRotate = true;
    c.autoRotateSpeed = 0.22;                          // slow cinematic breath
  } else {
    c.autoRotate = false;
  }
}

/* ---- OVERRIDE dispatcher: props dispatch (verbatim) + camera ----------------------- */
function _m3dFrameUpdate(dt, now) {
  if (!__M3D || !__M3D.ready || !window.THREE || !G.battle) return;
  if (typeof _m3dWeatherUpdate === "function")   { try { _m3dWeatherUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dSmokeBankUpdate === "function") { try { _m3dSmokeBankUpdate(dt, now); } catch (e) {} }
  if (typeof _m3dMixerUpdate === "function")     { try { _m3dMixerUpdate(dt, now); } catch (e) {} }   // units (G4)
  if (typeof _m3dCameraUpdate === "function")    { try { _m3dCameraUpdate(dt, now); } catch (e) {} }  // cinematic camera
  if (__M3D._propBattle !== G.battle.bd.id) { __M3D._propBattle = G.battle.bd.id; try { _m3dBuildProps(); } catch (e) {} }
}
