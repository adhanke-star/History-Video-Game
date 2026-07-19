/* ===========================================================================
   T34 — GROUND-LEVEL CAMERA  (ARC 3 · LANE-014 slice 4 — walk the field)

   A settings-gated camera mode (G.settings.groundCam === "on"; DEFAULT OFF =
   today's orbit camera byte-identical). When enabled, the T key drops the view
   to a soldier's-eye vantage on the field: GROUND INSPECT (walk the ground the
   player was orbiting — arrow keys walk and turn) or BRIGADE FOLLOW (with a
   brigade selected, the camera rides behind it along its facing). Pressing T
   again restores the EXACT pre-entry camera, target, and control parameters.

   THE SEAM (contract slice 4): everything goes through the EXISTING OrbitControls
   instance in PARAMETER MODE — the mode temporarily narrows minDistance and
   widens maxPolarAngle through the documented public fields and restores the
   saved values on exit; NO control addon is loaded (the "prefer none" branch),
   NO pointer lock. The two T0 reposition commands stay AUTHORITATIVE: the phase
   re-aim and the frame-selected command are WRAPPED BY REASSIGNMENT (never
   edited) so an explicit reposition simply DROPS ground mode and wins — T34
   never fights a T0 camera command.

   THE CLAMP: while the mode is active, every rendered frame enforces
   camera.y >= fldTerrainH(camera.x, camera.z) + EYE — the camera can never sink
   under the analytic terrain (entering, walking, and following also PLACE the
   camera at eye height explicitly; the clamp is the per-frame floor).

   KEYBOARD (only when the mode setting is on; never over editable targets;
   defers to any handler that already consumed the key):
     · T          — enter ground mode (follow when a brigade is selected, else
                    inspect at the orbit target); press again to exit-restore
     · Up / Down  — walk forward / back along the view line (inspect)
     · Left/Right — turn the view (with Shift: sidestep) (inspect)

   ACCESSIBILITY / MOTION: reduceMotion ⇒ NO auto-glide (the follow camera JUMPS
   to its seat instead of easing) and T34 never touches enableDamping — the
   engine's own reduceMotion damping law from fld3dInit stands unchanged.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   wraps fld3dRender / _fld3dReaimPhase / fldCamFrameSelected / fldExit by
   ASSIGNMENT (the established seam law), reads ONLY render state (__FIELD.camera
   / .controls / .sel / unit x-z-facing) + the analytic fldTerrainH. It NEVER
   writes a sim field, never uses the shared sim RNG, never bumps the save
   format. Every hook try/caught into the module's own errN.

   FAIL-CLOSED: the mode setting absent/anything-but-"on" ⇒ the key layer is
   inert and no wrap does per-frame work — today's orbit camera byte-identical.
   PERF: zero new scene objects, zero draw calls; active-mode per-frame work is
   a few float ops (the clamp + the follow seat).
   =========================================================================== */

var FLDGC = {
  EYE: 22,            // eye height above the analytic terrain (field-yd; officer's vantage at this stylized scale)
  LOOK: 60,           // inspect: how far ahead the view target sits
  STEP: 26,           // keyboard walk step
  TURN: 0.12,         // keyboard yaw step (radians)
  BACK: 90,           // follow: seat distance behind the brigade along its facing
  GLIDE: 0.18,        // follow ease per frame (reduceMotion => jump)
  MIN_D: 8,           // parameter-mode OrbitControls: ground-mode minDistance
  MAX_POLAR: Math.PI * 0.55   // ground-mode maxPolarAngle (allows a near-level gaze uphill)
};

var FLDGC_S = { active: false, mode: null, followId: null, saved: null, errN: 0, _warned: false };

/* ---- gates ---- */
function fldGcOn() {
  try { return !!(typeof G !== "undefined" && G && G.settings && G.settings.groundCam === "on"); } catch (e) { return false; }
}
function fldGcActive() { return !!FLDGC_S.active; }
function _gcRM() {
  try { return typeof fldReduceMotion === "function" && fldReduceMotion(); } catch (e) { return false; }
}
function _gcCam() {
  return (typeof __FIELD !== "undefined" && __FIELD && __FIELD.mode3d && __FIELD.camera && __FIELD.controls) ? __FIELD : null;
}
function _gcH(x, z) {
  try { return (typeof fldTerrainH === "function") ? fldTerrainH(x, z) : 0; } catch (e) { return 0; }
}

/* ---- the per-frame terrain floor (active mode only) ---- */
function fldGcClamp() {
  var F = _gcCam(); if (!F || !FLDGC_S.active) return;
  var c = F.camera.position, floor = _gcH(c.x, c.z) + FLDGC.EYE;
  if (c.y < floor) c.y = floor;
}

/* ---- enter/exit (parameter-mode OrbitControls: save, narrow, restore) ---- */
function fldGcEnter(mode, followId) {
  var F = _gcCam(); if (!F) return;
  var c = F.camera, ct = F.controls, t = ct.target;
  if (!FLDGC_S.saved) {
    FLDGC_S.saved = {
      cam: { x: c.position.x, y: c.position.y, z: c.position.z },
      tgt: { x: t.x, y: t.y, z: t.z },
      minD: ct.minDistance, maxPolar: ct.maxPolarAngle
    };
  }
  ct.minDistance = FLDGC.MIN_D; ct.maxPolarAngle = FLDGC.MAX_POLAR;
  FLDGC_S.active = true; FLDGC_S.mode = mode; FLDGC_S.followId = followId || null;
  if (mode === "inspect") {
    var gx = t.x, gz = t.z;                               // walk to where the player was looking
    var dx = t.x - c.position.x, dz = t.z - c.position.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 1e-6) { dx = 0; dz = -1; } else { dx /= len; dz /= len; }
    var eyeY = _gcH(gx, gz) + FLDGC.EYE;
    c.position.set(gx, eyeY, gz);
    t.set(gx + dx * FLDGC.LOOK, eyeY - 6, gz + dz * FLDGC.LOOK);
  }
  if (ct.update) { try { ct.update(); } catch (e) {} }
}
function fldGcExit() {
  var F = _gcCam();
  var s = FLDGC_S.saved;
  if (F && s) {
    F.camera.position.set(s.cam.x, s.cam.y, s.cam.z);
    F.controls.target.set(s.tgt.x, s.tgt.y, s.tgt.z);
    F.controls.minDistance = s.minD; F.controls.maxPolarAngle = s.maxPolar;
    if (F.controls.update) { try { F.controls.update(); } catch (e) {} }
  }
  FLDGC_S.active = false; FLDGC_S.mode = null; FLDGC_S.followId = null; FLDGC_S.saved = null;
}
/* deactivate WITHOUT restoring — an explicit T0 reposition command just set the
   camera and is authoritative; only the control parameters go back. */
function fldGcDrop() {
  var F = _gcCam(), s = FLDGC_S.saved;
  if (F && s) { F.controls.minDistance = s.minD; F.controls.maxPolarAngle = s.maxPolar; }
  FLDGC_S.active = false; FLDGC_S.mode = null; FLDGC_S.followId = null; FLDGC_S.saved = null;
}
function _gcSelUnit() {
  try {
    if (!__FIELD.sel || !__FIELD.sel.length || typeof fldById !== "function") return null;
    for (var i = 0; i < __FIELD.sel.length; i++) { var u = fldById(__FIELD.sel[i]); if (u && u.alive) return u; }
  } catch (e) {}
  return null;
}
function fldGcToggle() {
  if (FLDGC_S.active) { fldGcExit(); return; }
  var u = _gcSelUnit();
  fldGcEnter(u ? "follow" : "inspect", u ? u.id : null);
}

/* ---- the per-frame seat (follow) + floor (both modes) ---- */
function fldGcFrame() {
  var F = _gcCam(); if (!F || !FLDGC_S.active) return;
  if (FLDGC_S.mode === "follow") {
    var u = null;
    try { u = (typeof fldById === "function") ? fldById(FLDGC_S.followId) : null; } catch (e) {}
    if (!u || !u.alive) { FLDGC_S.mode = "inspect"; FLDGC_S.followId = null; }
    else {
      var fx = Math.sin(u.facing), fz = Math.cos(u.facing);       // unit forward in the field plane
      var dx = u.x - fx * FLDGC.BACK, dz = u.z - fz * FLDGC.BACK; // seat BEHIND the line
      var dy = _gcH(dx, dz) + FLDGC.EYE;
      var c = F.camera.position;
      if (_gcRM()) { c.set(dx, dy, dz); }                          // reduceMotion: jump, never glide
      else { c.x += (dx - c.x) * FLDGC.GLIDE; c.y += (dy - c.y) * FLDGC.GLIDE; c.z += (dz - c.z) * FLDGC.GLIDE; }
      F.controls.target.set(u.x, _gcH(u.x, u.z) + 8, u.z);
      if (F.controls.update) { try { F.controls.update(); } catch (e2) {} }
    }
  }
  fldGcClamp();
}

/* ---- keyboard (resident listener; inert unless the setting is on) ---- */
function fldGcKey(ev) {
  try {
    if (!fldGcOn()) return;
    if (ev.defaultPrevented) return;                               // another handler owns this key
    var tg = ev.target;
    if (tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.tagName === "SELECT" || tg.isContentEditable)) return;
    var F = _gcCam(); if (!F || !__FIELD.launched) return;
    var k = ev.key;
    if (k === "t" || k === "T") { ev.preventDefault(); fldGcToggle(); return; }
    if (!FLDGC_S.active || FLDGC_S.mode !== "inspect") return;
    var c = F.camera.position, t = F.controls.target;
    var dx = t.x - c.x, dz = t.z - c.z, len = Math.sqrt(dx * dx + dz * dz);
    if (len < 1e-6) { dx = 0; dz = -1; } else { dx /= len; dz /= len; }
    var moved = false;
    if (k === "ArrowUp") { c.x += dx * FLDGC.STEP; c.z += dz * FLDGC.STEP; t.x += dx * FLDGC.STEP; t.z += dz * FLDGC.STEP; moved = true; }
    else if (k === "ArrowDown") { c.x -= dx * FLDGC.STEP; c.z -= dz * FLDGC.STEP; t.x -= dx * FLDGC.STEP; t.z -= dz * FLDGC.STEP; moved = true; }
    else if (k === "ArrowLeft" || k === "ArrowRight") {
      var sgn = (k === "ArrowLeft") ? 1 : -1;
      if (ev.shiftKey) {                                           // sidestep
        var sx = dz * sgn * FLDGC.STEP, sz = -dx * sgn * FLDGC.STEP;
        c.x += sx; c.z += sz; t.x += sx; t.z += sz;
      } else {                                                     // turn the view around the camera
        var ca = Math.cos(FLDGC.TURN * sgn), sa = Math.sin(FLDGC.TURN * sgn);
        var rx = dx * ca - dz * sa, rz = dx * sa + dz * ca;
        t.x = c.x + rx * FLDGC.LOOK; t.z = c.z + rz * FLDGC.LOOK;
      }
      moved = true;
    }
    if (moved) {
      ev.preventDefault();
      var eyeY = _gcH(c.x, c.z) + FLDGC.EYE;
      c.y = eyeY; t.y = eyeY - 6;
      if (F.controls.update) { try { F.controls.update(); } catch (e) {} }
    }
  } catch (e2) { _gcErr(e2); }
}

function _gcErr(e) {
  FLDGC_S.errN++;
  if (!FLDGC_S._warned && typeof console !== "undefined" && console.warn) {
    FLDGC_S._warned = true; console.warn("T34 ground-camera:", (e && e.message) || e);
  }
}

/* ===========================================================================
   WIRE-IN — wrap fld3dRender (the seat + floor), the two T0 reposition commands
   (drop-and-defer), and fldExit (state reset) by ASSIGNMENT, outermost, carrying
   every prior wrapper marker forward. One resident keydown listener, inert
   unless the settings gate is on.
   =========================================================================== */
(function () {
  function _carryGc(dst, src) { for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { try { dst[k] = src[k]; } catch (e) {} } } }
  if (typeof fld3dRender === "function" && !fld3dRender._t34) {
    var _orr = fld3dRender;
    fld3dRender = function () { var r = _orr.apply(this, arguments); try { fldGcFrame(); } catch (e) { _gcErr(e); } return r; };
    _carryGc(fld3dRender, _orr); fld3dRender._t34 = true;
  }
  if (typeof _fld3dReaimPhase === "function" && !_fld3dReaimPhase._t34) {
    var _orp = _fld3dReaimPhase;
    _fld3dReaimPhase = function () { try { if (FLDGC_S.active) fldGcDrop(); } catch (e) { _gcErr(e); } return _orp.apply(this, arguments); };
    _carryGc(_fld3dReaimPhase, _orp); _fld3dReaimPhase._t34 = true;
  }
  if (typeof fldCamFrameSelected === "function" && !fldCamFrameSelected._t34) {
    var _ofs = fldCamFrameSelected;
    fldCamFrameSelected = function () { try { if (FLDGC_S.active) fldGcDrop(); } catch (e) { _gcErr(e); } return _ofs.apply(this, arguments); };
    _carryGc(fldCamFrameSelected, _ofs); fldCamFrameSelected._t34 = true;
  }
  if (typeof fldExit === "function" && !fldExit._t34) {
    var _oe = fldExit;
    fldExit = function () { try { FLDGC_S.active = false; FLDGC_S.mode = null; FLDGC_S.followId = null; FLDGC_S.saved = null; } catch (e) { _gcErr(e); } return _oe.apply(this, arguments); };
    _carryGc(fldExit, _oe); fldExit._t34 = true;
  }
  try { if (typeof document !== "undefined") document.addEventListener("keydown", fldGcKey); } catch (e) {}
})();
