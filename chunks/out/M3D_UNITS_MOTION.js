/* ===== M3D_UNITS_MOTION.js — procedural life for the billboard units (append-only) ====
   Locked round-2 item 1, free-path branch: the free Hyper3D MAIN_SITE "vibecoding" trial
   is drained (API_INSUFFICIENT_FUNDS, verified twice this run); Hunyuan disabled; Sketchfab's
   Civil-War catalog is one 385k-face CC-BY soldier — too heavy + no matching cannon/cav/general
   set for a uniform 8-type drop on the UHD 617. So per the lock ("if blocked -> billboards
   stay, log it") the painted billboards remain — and we deliver the OTHER half of item 1, the
   one that actually makes the field feel alive at $0: PROCEDURAL ENGINE MOTION.

   This DEFINES the reserved per-frame sub-hook `_m3dMixerUpdate(dt, now)` that every winning
   `_m3dFrameUpdate` dispatcher already calls guarded (POSTFX -> PARTICLES -> PROPS -> CAMERA ->
   PROPS2). It does NOT redeclare the dispatcher (no override needed; no collision). The GLB
   loader + hybrid-LOD + per-(type x side) cache in `_m3dUnitModel` stay wired, so a correctly
   named `.glb` drop still auto-swaps billboards -> real models with zero further code.

   MOTION (all stateless / time-driven, so it survives the per-frame _m3dBuildUnits rebuild):
     - IDLE BOB: every alive billboard breathes on a gentle ~3.5s vertical sine, per-unit phase
       from hash(u.id) so the line isn't a synchronized wave.
     - CAVALRY: faster bob + a small horizontal sway (horse rock).
     - CANNON RECOIL + MUZZLE SMOKE: edge-detect `u.fired` (false->true) -> a sharp downward
       kick easing back (artillery strongest) + one extra powder-smoke puff at the gun's own hex
       (reuses emitFX('smoke') -> the existing smoke-bank seeder). Infantry volley / cavalry
       charge get a lighter jolt off the same edge.

   We touch ONLY the THREE.Sprite child (the painted billboard) of each unit group, never the
   ground disc or selection ring (those must stay planted). reduceMotion -> everything off
   (rebuild resets sprites to base). Bare globals (G, __M3D, hashStr, emitFX). Never throws.
   ------------------------------------------------------------------------------------ */

// fast per-unit phase in [0, 2PI) from the unit id (cached on the group's userData per build)
function _m3dUnitPhase(grp, u) {
  if (grp.userData && grp.userData._mphase != null) return grp.userData._mphase;
  var h = (typeof hashStr === "function") ? hashStr("mot" + (u && u.id != null ? u.id : "")) : 0;
  var ph = ((h % 100000) / 100000) * 6.2831853;
  if (grp.userData) grp.userData._mphase = ph;
  return ph;
}

// the painted billboard for a unit group, or null (token-fallback units have no sprite)
function _m3dBillboardOf(grp) {
  var ch = grp.children;
  for (var i = 0; i < ch.length; i++) { if (ch[i] && ch[i].isSprite) return ch[i]; }
  return null;
}

// recoil magnitude 0..1 over ~520ms: sharp kick (first 18%) then ease back to rest
function _m3dRecoilEnv(age) {
  var dur = 520;
  if (age < 0 || age > dur) return 0;
  var t = age / dur;
  return (t < 0.18) ? (t / 0.18) : (1 - (t - 0.18) / 0.82);
}

/* RESERVED HOOK — the dispatcher (_m3dFrameUpdate) already calls this guarded. */
function _m3dMixerUpdate(dt, now) {
  if (!__M3D || !__M3D.ready || !window.THREE || !G.battle) return;
  var ug = __M3D.unitGroup; if (!ug || !ug.children.length) return;
  var rm = !!(G.settings && G.settings.reduceMotion);

  // fire-edge bookkeeping persists on __M3D (the unit groups are rebuilt every sync)
  var fired = (__M3D._uFired = __M3D._uFired || {});
  var fireT = (__M3D._uFireT = __M3D._uFireT || {});

  var children = ug.children;
  for (var i = 0; i < children.length; i++) {
    var grp = children[i];
    var u = grp.userData && grp.userData.unit;
    if (!u) continue;
    var spr = _m3dBillboardOf(grp);
    if (!spr) continue;

    // ---- fire edge: detect false->true, stamp time, emit one muzzle puff (artillery) ----
    var id = (u.id != null) ? u.id : i;
    var isF = !!u.fired;
    if (isF && !fired[id]) {
      fireT[id] = now;
      if (!rm && u.type === "art" && typeof emitFX === "function") {
        try { emitFX("smoke", u.c, u.r); } catch (e) {}
      }
    }
    fired[id] = isF;

    if (rm) { spr.position.set(0, 0, 0); continue; } // reduceMotion: planted, no life

    var ph = _m3dUnitPhase(grp, u);
    var x = 0, y = 0;

    // ---- idle bob / cavalry sway ----
    if (u.type === "cav") {
      y = Math.sin(now * 0.0042 + ph) * 0.22;          // quicker bob (horse gait)
      x = Math.sin(now * 0.0021 + ph) * 0.12;          // side-to-side sway
    } else if (u.routed) {
      y = Math.sin(now * 0.0060 + ph) * 0.16;          // jittery panic
      x = Math.sin(now * 0.0090 + ph) * 0.08;
    } else {
      y = Math.sin(now * 0.0018 + ph) * 0.16;          // calm breathing
    }

    // ---- recoil kick on a recent fire edge (artillery strongest) ----
    var t0 = fireT[id];
    if (t0 != null) {
      var env = _m3dRecoilEnv(now - t0);
      if (env > 0) {
        var amp = (u.type === "art") ? 0.55 : 0.28;    // gun kick vs musket jolt
        y -= env * amp;
        var sc = 1 + env * (u.type === "art" ? 0.07 : 0.035);
        // preserve the build-time scale ratio; pulse around it
        if (grp.userData._mbaseSX == null) { grp.userData._mbaseSX = spr.scale.x; grp.userData._mbaseSY = spr.scale.y; }
        spr.scale.set(grp.userData._mbaseSX * sc, grp.userData._mbaseSY * sc, 1);
      } else {
        if (grp.userData._mbaseSX != null) spr.scale.set(grp.userData._mbaseSX, grp.userData._mbaseSY, 1);
      }
    }

    spr.position.set(x, y, 0);
  }
}
