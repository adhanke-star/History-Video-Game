/* ===========================================================================
   T20 — ORDER & MOVEMENT FEEL  (H5-i1 — the UG:G-fidelity modern-engine push, D139)

   Aaron's locked direction (D138): the modern (non-hex) engine must move and
   obey like Ultimate General: Gettysburg. This module is the PLAYER CONTROL
   SURFACE — it upgrades how the human directs troops, and NOTHING else:

     - a live ORDER GHOST while you give an order (the destination footprint,
       a swinging FACING HANDLE arrow, the spread line) in BOTH the 2D fallback
       and the showcase 3D renderer (today 2D drew a bare line; 3D drew nothing);
     - DRAG-ONTO-ENEMY = a charge at THAT brigade (drop on a foe), vs today's
       nearest-enemy-only charge;
     - POINT + FACING HANDLE: a tap places the men keeping their facing; a drag
       swings a visible handle to aim; the standing handle stays grabbable so you
       can re-aim a unit already under orders (Aaron's chosen facing-drag UX);
     - SHIFT-QUEUE: shift-drag appends a waypoint to a planned route (u.queue),
       advanced on arrival (Aaron's chosen immediate+queue order model).
     - KEYBOARD ORDER CURSOR: M opens a selected-unit endpoint cursor; arrows
       move it, [ / ] turn destination facing, Enter commits, Shift+Enter uses
       the same waypoint queue, and Escape cancels without exiting the battle.

   BYTE-IDENTITY (D74) — this is GAMEPLAY/engine work (the deliberate carve-out),
   yet it is built so the HEADLESS AI-vs-AI sim stays byte-identical (proven by
   probe-presets + probe-phased-ab + the 9 per-battle probes staying 0-diff):
     * fldOrderCharge generalizes to (u, target) with target===null reproducing
       the EXACT nearest-enemy scan; its sole caller is the player (fldSelCharge),
       never the AI doctrines (which set u.order inline).
     * the queue advance is gated on u.queue, which fldMakeUnit NEVER initializes
       and only the player shift-drag ever creates -> a strict no-op for every AI
       / scenario unit (u.queue undefined -> the guard is false).
     * the ghost lives in the render + pointer layer; the headless stepper runs
       renderer 'none' and never calls a draw fn.
   The companion dig-rate change lives in T13 (faster digging) and is byte-identical
   for the same reason no non-player unit ever digs (T13 header invariant).

   Bare-name globals only (no window.*); presentation reads sim state, never writes
   it; the resolver (fldResolveOrderGesture) is a pure-ish translator a probe can
   drive headlessly with a synthetic gesture -> tools/probe-order-feel.mjs.
   =========================================================================== */

/* tuning — yards (world units) */
var FLD_DRAG_MIN = 18;       // a drag shorter than this is a TAP (place, keep facing)
var FLD_CHARGE_GRAB = 58;    // drop within this of an enemy brigade -> charge it
var FLD_HANDLE_GRAB = 46;    // press within this of a facing-handle tip -> re-aim it
var FLD_HANDLE_LEN = 70;     // length of the facing-handle arrow ahead of the destination
var FLD_ORDER_SPREAD = 80;   // per-unit lateral spread of a multi-brigade order (mirrors the legacy fldPointerUp spread)
var FLD_CHARGE_GRACE = 1.2;  // sim-seconds: brief correction window before a player charge commits
var FLD_KEY_STEP = 30;       // keyboard endpoint nudge (yards; held arrows repeat through native key repeat)
var FLD_KEY_TURN = Math.PI / 12; // keyboard facing nudge (15 degrees)

/* the nearest VISIBLE alive enemy brigade within r of a world point, or null.
   Fog-gated: you cannot drag-to-charge a foe you have not scouted (and the cursor
   never reveals a hidden enemy). With fog OFF every alive enemy is eligible. */
function fldEnemyAt(x, z, side, r) {
  if (typeof __FIELD === "undefined" || !__FIELD.units) return null;
  var best = null, bd = (r || FLD_CHARGE_GRAB); bd = bd * bd;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var e = __FIELD.units[i];
    if (!e.alive || e.side === side) continue;
    if (__FIELD.fog && typeof fldVisible === "function" && !fldVisible(side, e)) continue;
    var dx = e.x - x, dz = e.z - z, d2 = dx * dx + dz * dz;
    if (d2 < bd) { bd = d2; best = e; }
  }
  return best;
}

/* H5-i4: player-issued charges get impetus. During a short grace window the player can
   correct the order; after commit, casual move/hold/re-aim orders are refused until the
   brigade reaches contact, loses the target, routs, or dies. AI charges remain plain
   inline {type:"charge"} orders unless a future AI path explicitly opts into this API. */
function fldChargePrime(u, ord, target) {
  if (!u || !ord || !target) return;
  ord.tid = target.id;
  ord.playerCharge = true;
  ord.commitT = ((typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.t : 0) + FLD_CHARGE_GRACE;
  ord.committed = false;
  ord.contact = false;
}
function fldChargeGraceLeft(u) {
  var o = u && u.order;
  if (!o || o.type !== "charge" || !o.playerCharge || typeof o.commitT !== "number") return 0;
  var now = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.t : 0;
  return Math.max(0, o.commitT - now);
}
function fldChargeTargetLost(u) {
  var o = u && u.order;
  if (!o || !o.tid || typeof fldById !== "function") return true;
  var t = fldById(o.tid);
  if (!t || !t.alive || t.side === u.side || t.state === "routing") return true;
  if (typeof __FIELD !== "undefined" && __FIELD && __FIELD.fog && typeof fldVisible === "function" && !fldVisible(u.side, t)) return true;
  return false;
}
function fldChargeLocked(u) {
  var o = u && u.order;
  return !!(u && u.alive && u.state !== "routing" && o && o.type === "charge" && o.playerCharge && o.tid && !o.contact && fldChargeGraceLeft(u) <= 0 && !fldChargeTargetLost(u));
}
function fldChargeBlocked(u) {
  if (typeof fldAnnounce !== "function") return;
  var name = "the chosen enemy", o = u && u.order, t = o && o.tid && typeof fldById === "function" ? fldById(o.tid) : null;
  if (t && t.name) name = t.name;
  fldAnnounce("Charge committed — " + name + " must be reached or lost before new orders take hold.");
}
function fldChargeStep(u) {
  var o = u && u.order;
  if (!o || o.type !== "charge" || !o.playerCharge || !o.tid || o.contact) return;
  if (!u.alive || u.state === "routing") return;
  var t = (typeof fldById === "function") ? fldById(o.tid) : null;
  if (fldChargeTargetLost(u)) { u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing }; return; }
  o.tx = t.x; o.tz = t.z; o.tface = Math.atan2(t.x - u.x, -(t.z - u.z));
  if (fldChargeGraceLeft(u) <= 0) o.committed = true;
}
/* E23 (D231): a committed charge is released by melee contact with ANY enemy, not only the charged target.
   The melee loop (T0 fldSimStep) resolves combat against every enemy inside CONTACT_R, so an interposing
   brigade that pins the charge must also return it to player control — otherwise the brigade is decisively
   engaged in a fight the lock refuses to let the player manage. playerCharge is player-only, so the early
   return keeps every AI charge byte-identical. */
function fldChargeContact(u, target) {
  var o = u && u.order;
  if (!o || o.type !== "charge" || !o.playerCharge || !target || !target.alive || target.side === u.side) return;
  o.contact = true;
  o.playerCharge = false;
}
function fldChargeHudSelected(u) {
  var o = u && u.order;
  if (!u || !u.alive || u.state === "routing" || !o || o.type !== "charge" || (!o.playerCharge && !o.tid)) return "";
  var t = o.tid && typeof fldById === "function" ? fldById(o.tid) : null;
  var nm = t && t.name ? t.name : "target";
  if (o.playerCharge) {
    var left = fldChargeGraceLeft(u);
    var txt = left > 0 ? ("correcting " + left.toFixed(1) + "s") : "committed";
    return '<div style="margin-top:4px;color:#f0b37a;font-size:12px;">&#9876; Charge ' + txt + ' — tracking ' + nm + '</div>';
  }
  return '<div style="margin-top:4px;color:#d9c9a5;font-size:12px;">&#9876; Charge in contact — ' + nm + '</div>';
}

/* a unit has a grabbable facing handle when it is marching to a MOVE destination
   OR standing on a HOLD order (S10, D231: a stationary line — including a fresh
   spawn — can now be re-faced IN PLACE, pivoting as UG:G allows, instead of
   needing a displacing move order to swing its facing). The handle cannot hijack
   unit selection (fldPointerDown checks the ~70yd body-select radius BEFORE the
   handle hit-test), and it cannot hijack a short forward NUDGE either: the hold
   handle pivots only on a real DRAG — a TAP on it falls through to the normal
   move gesture in fldResolveOrderGesture, so pressing ~70-116yd dead ahead still
   marches the men exactly as it did pre-S10. A CHARGE is deliberately excluded:
   a charge's facing is just the settle-on-arrival angle (the men keep marching
   at the tracked target), so re-aiming it would be a no-effect gesture. Once the
   H5-i4 charge lock commits, re-aim/move/queue orders are refused until contact,
   target loss, rout, or death. */
function fldOrderHasHandle(u) {
  var o = u && u.order;
  return !!(o && (o.type === "move" || o.type === "hold") && o.tx != null);
}
/* the player's selected unit whose facing-handle tip is within grab of a world
   point (so a press there re-aims that unit's facing), or null. */
function fldHandleHit(wp) {
  if (!wp || typeof fldPlayerSel !== "function") return null;
  var s = fldPlayerSel();
  for (var i = 0; i < s.length; i++) {
    var u = s[i]; if (!fldOrderHasHandle(u)) continue;
    var hf = (typeof u.order.tface === "number") ? u.order.tface : u.facing;
    var hx = u.order.tx + Math.sin(hf) * FLD_HANDLE_LEN, hz = u.order.tz - Math.cos(hf) * FLD_HANDLE_LEN;
    if (Math.hypot(wp.x - hx, wp.z - hz) < FLD_HANDLE_GRAB) return u;
  }
  return null;
}

/* ---------------------------------------------------------------------------
   KEYBOARD ORDER CURSOR  (S40 — WCAG 2.1.1 equivalence)

   This is an input adapter over fldResolveOrderGesture. It never steps a unit,
   computes movement, or writes combat state. The pending cursor is presentation
   state only; commit synthesizes the same endpoint/facing gesture that pointer
   play already sends through fldApplyOrder/fldEnqueueOrder.
   --------------------------------------------------------------------------- */
function fldOrderKeyActive() {
  return !!(typeof __FIELD !== "undefined" && __FIELD && __FIELD.orderCursor);
}
function fldOrderKeySelection(c) {
  var out = [];
  if (!c || !c.ids || typeof fldById !== "function") return out;
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  for (var i = 0; i < c.ids.length; i++) {
    var u = fldById(c.ids[i]);
    if (u && u.alive && u.state !== "routing" && u.side === ps && !u.ai) out.push(u);
  }
  return out;
}
function fldOrderKeyCompass(a) {
  var dirs = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  var n = Math.round(Math.atan2(Math.sin(a), Math.cos(a)) / (Math.PI / 4));
  return dirs[(n % 8 + 8) % 8];
}
function fldOrderKeyFacingLabel(a) {
  var deg = (Math.round(Math.atan2(Math.sin(a), Math.cos(a)) * 180 / Math.PI) % 360 + 360) % 360;
  return fldOrderKeyCompass(a) + ", " + deg + " degrees clockwise from north";
}
function fldOrderKeyOffset(c) {
  var dx = Math.round(c.x - c.anchorX), dz = Math.round(c.z - c.anchorZ), parts = [];
  if (Math.abs(dx) >= 1) parts.push(Math.abs(dx) + " yards " + (dx > 0 ? "east" : "west"));
  if (Math.abs(dz) >= 1) parts.push(Math.abs(dz) + " yards " + (dz > 0 ? "south" : "north"));
  return parts.length ? parts.join(", ") : "at the selected position";
}
function fldOrderKeyStatus(c, instructions) {
  if (!c) return "";
  var s = "Order cursor " + fldOrderKeyOffset(c) + "; facing " + fldOrderKeyFacingLabel(c.facing) + ".";
  if (instructions) s += " Arrows move. Left and right brackets turn. Enter commits; Shift plus Enter queues; Escape cancels.";
  return s;
}
function fldOrderKeyShow(c) {
  if (typeof document === "undefined" || !c) return;
  var root = document.getElementById("fldRoot"); if (!root) return;
  var el = document.getElementById("fldOrderKey");
  if (!el) {
    el = document.createElement("div"); el.id = "fldOrderKey"; el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:absolute;left:50%;top:68px;transform:translateX(-50%);z-index:24;max-width:calc(100vw - 24px);padding:8px 12px;border:2px solid #ffe27a;border-radius:8px;background:#05080af2;color:#fff4c7;box-shadow:0 3px 0 #000,0 10px 28px #000b;font:800 12px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;pointer-events:none;white-space:normal;";
    root.appendChild(el);
  }
  el.textContent = "KEYBOARD ORDER · Arrows move · [ / ] face · Enter commit · Shift+Enter waypoint · Esc cancel";
}
function fldOrderKeyStart() {
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.launched || (__FIELD.phase !== "deploy" && __FIELD.phase !== "battle")) return false;
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [];
  if (!sel.length) { if (typeof fldAnnounce === "function") fldAnnounce("Select a brigade before starting a keyboard move."); return true; }
  var ax = 0, az = 0, tx = 0, tz = 0, ids = [];
  for (var i = 0; i < sel.length; i++) {
    var u = sel[i], o = u.order;
    ax += u.x; az += u.z; ids.push(u.id);
    tx += (o && typeof o.tx === "number") ? o.tx : u.x;
    tz += (o && typeof o.tz === "number") ? o.tz : u.z;
  }
  var f0 = sel[0].order && typeof sel[0].order.tface === "number" ? sel[0].order.tface : sel[0].facing;
  var c = {
    ids: ids,
    anchorX: ax / sel.length, anchorZ: az / sel.length,
    x: fldClamp(tx / sel.length, 15, FLD.FIELD_W - 15),
    z: fldClamp(tz / sel.length, 15, FLD.FIELD_H - 15),
    facing: Math.atan2(Math.sin(f0 || 0), Math.cos(f0 || 0))
  };
  __FIELD.orderCursor = c; fldOrderKeyShow(c);
  if (typeof fldAnnounce === "function") fldAnnounce(fldOrderKeyStatus(c, true));
  return true;
}
function fldOrderKeyMove(dx, dz) {
  var c = __FIELD && __FIELD.orderCursor; if (!c) return;
  c.x = fldClamp(c.x + dx * FLD_KEY_STEP, 15, FLD.FIELD_W - 15);
  c.z = fldClamp(c.z + dz * FLD_KEY_STEP, 15, FLD.FIELD_H - 15);
  if (typeof fldAnnounce === "function") fldAnnounce(fldOrderKeyStatus(c, false));
}
function fldOrderKeyFace(dir) {
  var c = __FIELD && __FIELD.orderCursor; if (!c) return;
  c.facing = Math.atan2(Math.sin(c.facing + dir * FLD_KEY_TURN), Math.cos(c.facing + dir * FLD_KEY_TURN));
  if (typeof fldAnnounce === "function") fldAnnounce("Facing " + fldOrderKeyFacingLabel(c.facing) + ". Destination " + fldOrderKeyOffset(c) + ".");
}
function fldOrderKeyCancel(announce) {
  if (!fldOrderKeyActive()) return false;
  __FIELD.orderCursor = null;
  if (typeof document !== "undefined") { var el = document.getElementById("fldOrderKey"); if (el && el.parentNode) el.parentNode.removeChild(el); }
  if (announce !== false && typeof fldAnnounce === "function") fldAnnounce("Keyboard order canceled.");
  return true;
}
function fldOrderKeyCommit(queue) {
  var c = __FIELD && __FIELD.orderCursor; if (!c) return false;
  var sel = fldOrderKeySelection(c), face = c.facing, x0 = c.x, z0 = c.z;
  fldOrderKeyCancel(false);
  if (!sel.length) { if (typeof fldAnnounce === "function") fldAnnounce("Keyboard order canceled; the selected brigades are unavailable."); return true; }
  // moveOnly prevents the FACING arrow tip from being interpreted as a drag-drop charge target. Endpoint,
  // spread, facing, immediate-vs-queue application, charge locks, and announcements remain T20's resolver.
  fldResolveOrderGesture(sel, {
    x0: x0, z0: z0,
    x: x0 + Math.sin(face) * (FLD_DRAG_MIN + 2),
    z: z0 - Math.cos(face) * (FLD_DRAG_MIN + 2),
    shift: !!queue, moveOnly: true, keyboard: true
  });
  return true;
}
function fldOrderKeyHandle(e) {
  if (!e) return false;
  var k = e.key, active = fldOrderKeyActive();
  if (active && (!__FIELD.launched || (__FIELD.phase !== "deploy" && __FIELD.phase !== "battle"))) { fldOrderKeyCancel(false); active = false; }
  if (!active) {
    if (k !== "m" && k !== "M") return false;
    var started = fldOrderKeyStart();
    if (started) { if (e.preventDefault) e.preventDefault(); if (e.stopPropagation) e.stopPropagation(); }
    return started;
  }
  // Escape cancels even if a control-bar button took focus. Other keys leave native button activation alone.
  if (k === "Escape") { fldOrderKeyCancel(true); if (e.preventDefault) e.preventDefault(); if (e.stopPropagation) e.stopPropagation(); return true; }
  if (e.target && e.target.tagName === "BUTTON") return false;
  var used = true;
  if (k === "ArrowUp") fldOrderKeyMove(0, -1);
  else if (k === "ArrowDown") fldOrderKeyMove(0, 1);
  else if (k === "ArrowLeft") fldOrderKeyMove(-1, 0);
  else if (k === "ArrowRight") fldOrderKeyMove(1, 0);
  else if (k === "[" || k === "BracketLeft") fldOrderKeyFace(-1);
  else if (k === "]" || k === "BracketRight") fldOrderKeyFace(1);
  else if (k === "Enter") fldOrderKeyCommit(!!e.shiftKey);
  else if (k === "m" || k === "M") { fldOrderKeyShow(__FIELD.orderCursor); if (typeof fldAnnounce === "function") fldAnnounce(fldOrderKeyStatus(__FIELD.orderCursor, true)); }
  else used = false;
  if (used) { if (e.preventDefault) e.preventDefault(); if (e.stopPropagation) e.stopPropagation(); }
  return used;
}
function fldOrderKeyHudSelected() {
  return '<div style="margin-top:7px;padding-top:6px;border-top:1px solid #725e40;color:#fff0bd;font-size:11px;line-height:1.35;"><b>Keyboard move:</b> M · arrows place · [ / ] face · Enter commit · Shift+Enter waypoint</div>';
}
function fldOrderGhostGesture() {
  if (typeof __FIELD === "undefined" || !__FIELD) return null;
  if (__FIELD.drag) return __FIELD.drag;
  var c = __FIELD.orderCursor; if (!c) return null;
  return {
    x0: c.x, z0: c.z,
    x: c.x + Math.sin(c.facing) * FLD_HANDLE_LEN,
    z: c.z - Math.cos(c.facing) * FLD_HANDLE_LEN,
    shift: false, moveOnly: true, keyboard: true
  };
}

/* ---------------------------------------------------------------------------
   ORDER APPLICATION  (immediate vs shift-queue)
   --------------------------------------------------------------------------- */
/* immediate: set the unit's order NOW and drop any planned route. */
function fldApplyOrder(u, ord) {
  if (!u || !u.alive || u.state === "routing") return false;
  if (typeof fldChargeLocked === "function" && fldChargeLocked(u)) { if (typeof fldChargeBlocked === "function") fldChargeBlocked(u); return false; }
  u.queue = null;   // immediate cancels the planned route (kept falsy -> the queue guard stays a no-op for clean units)
  if (ord.type === "charge") fldOrderCharge(u, ord.tid ? fldById(ord.tid) : null, { player: true });
  else u.order = { type: "move", tx: ord.tx, tz: ord.tz, tface: (typeof ord.tface === "number") ? ord.tface : u.facing };
  return true;
}
/* queue: append a waypoint to the planned route; start it immediately if idle. */
function fldEnqueueOrder(u, ord) {
  if (!u || !u.alive || u.state === "routing") return false;
  if (typeof fldChargeLocked === "function" && fldChargeLocked(u)) { if (typeof fldChargeBlocked === "function") fldChargeBlocked(u); return false; }
  (u.queue || (u.queue = [])).push(ord);
  if (!u.order || u.order.type === "hold") fldOrderQueueAdvance(u);
  return true;
}
/* pop the next queued waypoint into u.order — called from fldStepMovement when a
   move completes. Returns true iff it set a fresh order. BYTE-IDENTICAL no-op for
   any unit without a non-empty .queue (every AI / scenario unit) -> returns false. */
function fldOrderQueueAdvance(u) {
  if (!u || !u.queue || !u.queue.length) return false;
  var nx = u.queue.shift();
  if (!nx) return false;
  if (nx.type === "charge") {
    var tgt = nx.tid ? fldById(nx.tid) : null;
    fldOrderCharge(u, (tgt && tgt.alive && tgt.side !== u.side) ? tgt : null, { player: true });
  } else {
    u.order = { type: "move", tx: nx.tx, tz: nx.tz, tface: (typeof nx.tface === "number") ? nx.tface : u.facing };
  }
  return true;
}

/* ---------------------------------------------------------------------------
   THE GESTURE RESOLVER  (the testable core: a synthetic gesture -> orders)
   gst = { x0, z0, x, z, shift, aimUid }
     - aimUid set      -> re-aim that unit's facing toward (x,z);
     - drop near a foe -> CHARGE that brigade;
     - else            -> MOVE to the press point (x0,z0); a drag aims facing, a
                          tap keeps it. Multi-select spreads along the front.
   --------------------------------------------------------------------------- */
function fldResolveOrderGesture(sel, gst) {
  if (!gst) return;
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  if (gst.aimUid) {
    var au = fldById(gst.aimUid);
    if (au && typeof fldChargeLocked === "function" && fldChargeLocked(au)) { if (typeof fldChargeBlocked === "function") fldChargeBlocked(au); return; }
    // S10 (D231): the HOLD handle pivots only on a real DRAG. A TAP on it (press+release under FLD_DRAG_MIN)
    // falls through to the normal place gesture below, so the pre-S10 "tap just ahead to nudge the line
    // forward" still marches the men — the handle-grab band ~70-116yd ahead of a standing line never
    // becomes a move dead-zone. (A MOVE-order handle keeps the original always-re-aim semantics.)
    var aimTap = !(Math.hypot(gst.x - gst.x0, gst.z - gst.z0) > FLD_DRAG_MIN);
    if (!(au && au.alive && au.order && au.order.type === "hold" && aimTap)) {
      if (au && au.alive && au.order && (au.order.type === "move" || au.order.type === "hold") && au.order.tx != null) {
        au.order.tface = Math.atan2(gst.x - au.order.tx, -(gst.z - au.order.tz));
        if (typeof fldAnnounce === "function") fldAnnounce("Facing set.");
        if (typeof fldRenderHud === "function") fldRenderHud();
      }
      return;
    }
  }
  if (!sel || !sel.length) return;
  var n = sel.length, i, u;
  var dropFoe = gst.moveOnly ? null : fldEnemyAt(gst.x, gst.z, ps, FLD_CHARGE_GRAB);
  var applied = 0;
  if (dropFoe) {
    for (i = 0; i < n; i++) {
      var ord = { type: "charge", tid: dropFoe.id };
      if (gst.shift) { if (fldEnqueueOrder(sel[i], ord)) applied++; }
      else if (fldApplyOrder(sel[i], ord)) applied++;
    }
    if (applied && typeof fldAnnounce === "function") fldAnnounce((gst.shift ? "Charge queued — " : "Charge ordered — ") + dropFoe.name + (gst.shift ? "." : "!"));
  } else {
    var dragged = Math.hypot(gst.x - gst.x0, gst.z - gst.z0) > FLD_DRAG_MIN;
    var face = Math.atan2(gst.x - gst.x0, -(gst.z - gst.z0));
    var perp = face + Math.PI / 2;
    for (i = 0; i < n; i++) {
      u = sel[i];
      var off = (i - (n - 1) / 2) * FLD_ORDER_SPREAD;
      var tx = gst.x0 + Math.sin(perp) * off, tz = gst.z0 - Math.cos(perp) * off;
      var ord2 = { type: "move", tx: tx, tz: tz, tface: dragged ? face : u.facing };
      if (gst.shift) { if (fldEnqueueOrder(u, ord2)) applied++; }
      else if (fldApplyOrder(u, ord2)) applied++;
    }
    if (applied && typeof fldAnnounce === "function") fldAnnounce(gst.shift ? "Waypoint queued." : "March ordered.");
  }
  if (typeof fldRenderHud === "function") fldRenderHud();
}

/* ===========================================================================
   2D ORDER GHOST  (drawn last in fld2dDraw, replacing the bare drag line)
   World -> canvas: (v.ox + x*v.s, v.oz + z*v.s). CVD-safe by SHAPE: a charge is a
   filled double arrowhead in warm red; a move is an open amber arrow; a queued
   waypoint is a dashed green route. No animation -> reduceMotion-safe by nature.
   =========================================================================== */
var FLD_GH_MOVE = "#ffe9a8", FLD_GH_CHARGE = "#ff9763", FLD_GH_QUEUE = "#bfe0a0", FLD_GH_HANDLE = "#ffd27a";

function fldGhostArrow2d(ctx, v, fx, fz, tx, tz, col, filled) {
  var ax = v.ox + fx * v.s, az = v.oz + fz * v.s, bx = v.ox + tx * v.s, bz = v.oz + tz * v.s;
  ctx.strokeStyle = col; ctx.lineWidth = filled ? 3 : 2;
  ctx.beginPath(); ctx.moveTo(ax, az); ctx.lineTo(bx, bz); ctx.stroke();
  var ang = Math.atan2(bz - az, bx - ax), hl = 12;
  ctx.beginPath();
  ctx.moveTo(bx, bz);
  ctx.lineTo(bx - hl * Math.cos(ang - 0.42), bz - hl * Math.sin(ang - 0.42));
  if (filled) ctx.lineTo(bx - hl * 0.55 * Math.cos(ang), bz - hl * 0.55 * Math.sin(ang));
  ctx.lineTo(bx - hl * Math.cos(ang + 0.42), bz - hl * Math.sin(ang + 0.42));
  if (filled) { ctx.closePath(); ctx.fillStyle = col; ctx.fill(); } else ctx.stroke();
}
function fldGhostFootprint2d(ctx, v, u, cx, cz, face, col) {
  var frontW = (u.formation === "column" ? 36 : 96) * v.s * (0.5 + 0.5 * u.men / u.maxMen);
  var depth = (u.formation === "column" ? 60 : 26) * v.s;
  ctx.save();
  ctx.translate(v.ox + cx * v.s, v.oz + cz * v.s); ctx.rotate(face);
  ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
  ctx.strokeRect(-frontW / 2, -depth / 2, frontW, depth);
  ctx.setLineDash([]);
  ctx.fillStyle = col; ctx.fillRect(-frontW / 2, -depth / 2 - 2, frontW, 2);   // the front edge
  ctx.restore();
}
function fldOrderGhost2d(ctx, v) {
  if (typeof __FIELD === "undefined") return;
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [];
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  ctx.save();
  // standing facing handles + queued routes for the selected brigades that are actively moving (grabbable)
  if (sel.length <= 8) for (var i = 0; i < sel.length; i++) {
    var u = sel[i]; if (!fldOrderHasHandle(u)) continue;
    var hf = (typeof u.order.tface === "number") ? u.order.tface : u.facing;
    var hx = u.order.tx + Math.sin(hf) * FLD_HANDLE_LEN, hz = u.order.tz - Math.cos(hf) * FLD_HANDLE_LEN;
    ctx.globalAlpha = 0.42;
    fldGhostArrow2d(ctx, v, u.order.tx, u.order.tz, hx, hz, FLD_GH_HANDLE, false);
    ctx.beginPath(); ctx.arc(v.ox + hx * v.s, v.oz + hz * v.s, 4, 0, 7); ctx.fillStyle = FLD_GH_HANDLE; ctx.fill();
    if (u.queue && u.queue.length) {
      ctx.globalAlpha = 0.6; ctx.strokeStyle = FLD_GH_QUEUE; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(v.ox + u.order.tx * v.s, v.oz + u.order.tz * v.s);
      for (var q = 0; q < u.queue.length; q++) { var w = u.queue[q]; if (w.tx == null) continue; ctx.lineTo(v.ox + w.tx * v.s, v.oz + w.tz * v.s); }
      ctx.stroke(); ctx.setLineDash([]);
      for (var q2 = 0; q2 < u.queue.length; q2++) { var w2 = u.queue[q2]; if (w2.tx == null) continue; ctx.beginPath(); ctx.arc(v.ox + w2.tx * v.s, v.oz + w2.tz * v.s, 3, 0, 7); ctx.fillStyle = FLD_GH_QUEUE; ctx.fill(); }
    }
  }
  // the active drag ghost
  var dr = fldOrderGhostGesture();
  if (dr) {
    if (dr.aimUid) {
      var au = fldById(dr.aimUid);
      if (au && au.order && au.order.tx != null) { ctx.globalAlpha = 0.95; fldGhostArrow2d(ctx, v, au.order.tx, au.order.tz, dr.x, dr.z, FLD_GH_HANDLE, true); }
    } else {
      var dropFoe = fldEnemyAt(dr.x, dr.z, ps, FLD_CHARGE_GRAB);
      if (dropFoe) {
        ctx.globalAlpha = 0.9;
        for (var c = 0; c < sel.length; c++) fldGhostArrow2d(ctx, v, sel[c].x, sel[c].z, dropFoe.x, dropFoe.z, FLD_GH_CHARGE, true);
        ctx.beginPath(); ctx.arc(v.ox + dropFoe.x * v.s, v.oz + dropFoe.z * v.s, 30 * v.s + 5, 0, 7); ctx.strokeStyle = FLD_GH_CHARGE; ctx.lineWidth = 2.5; ctx.stroke();
      } else {
        var col = dr.shift ? FLD_GH_QUEUE : FLD_GH_MOVE;
        var dragged = Math.hypot(dr.x - dr.x0, dr.z - dr.z0) > FLD_DRAG_MIN;
        var face = Math.atan2(dr.x - dr.x0, -(dr.z - dr.z0));
        var perp = face + Math.PI / 2, n = sel.length || 1;
        ctx.globalAlpha = 0.85;
        for (var m = 0; m < sel.length; m++) {
          var off = (m - (n - 1) / 2) * FLD_ORDER_SPREAD;
          var tx = dr.x0 + Math.sin(perp) * off, tz = dr.z0 - Math.cos(perp) * off;
          var ff = dragged ? face : sel[m].facing;
          fldGhostFootprint2d(ctx, v, sel[m], tx, tz, ff, col);
          fldGhostArrow2d(ctx, v, tx, tz, tx + Math.sin(ff) * FLD_HANDLE_LEN, tz - Math.cos(ff) * FLD_HANDLE_LEN, col, false);
        }
        // CVD-safe-by-SHAPE (the T0:1590 convention): the QUEUE preview's stem is DASHED, the immediate-MOVE
        // stem is SOLID — so queue-vs-immediate reads by line style, not by the near-identical amber/green hue.
        ctx.globalAlpha = 0.9; ctx.strokeStyle = col; ctx.lineWidth = 2;
        if (dr.shift) ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(v.ox + dr.x0 * v.s, v.oz + dr.z0 * v.s); ctx.lineTo(v.ox + dr.x * v.s, v.oz + dr.z * v.s); ctx.stroke();
        ctx.setLineDash([]);
        if (dr.shift) {   // a small "+" append glyph at the drop point makes "add a waypoint" explicit
          var qx = v.ox + dr.x0 * v.s, qz = v.oz + dr.z0 * v.s;
          ctx.beginPath(); ctx.moveTo(qx - 6, qz); ctx.lineTo(qx + 6, qz); ctx.moveTo(qx, qz - 6); ctx.lineTo(qx, qz + 6); ctx.stroke();
        }
        // S40: the keyboard cursor adds a thick light-on-dark crosshair around the endpoint. Shape plus
        // dual-stroke contrast keeps it visible over every terrain palette; it is static, so reduceMotion
        // needs no alternate animation path.
        if (dr.keyboard) {
          var kx = v.ox + dr.x0 * v.s, kz = v.oz + dr.z0 * v.s, kr = 18;
          ctx.globalAlpha = 1; ctx.setLineDash([]);
          ctx.strokeStyle = "#10141a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(kx, kz, kr, 0, 7); ctx.moveTo(kx - kr - 8, kz); ctx.lineTo(kx + kr + 8, kz); ctx.moveTo(kx, kz - kr - 8); ctx.lineTo(kx, kz + kr + 8); ctx.stroke();
          ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(kx, kz, kr, 0, 7); ctx.moveTo(kx - kr - 8, kz); ctx.lineTo(kx + kr + 8, kz); ctx.moveTo(kx, kz - kr - 8); ctx.lineTo(kx, kz + kr + 8); ctx.stroke();
        }
      }
    }
  }
  ctx.globalAlpha = 1; ctx.restore();
}

/* ===========================================================================
   3D ORDER GHOST  (a persistent THREE group repositioned each frame; no per-frame
   alloc). Built once in fld3dInit, hidden when there is no active drag.
   =========================================================================== */
function fld3dEnsureGhost() {
  var T = window.THREE; if (!T || !__FIELD.scene) return;
  var grp = new T.Group(); grp.name = "orderGhost"; grp.visible = false;
  // an always-on-top transparent overlay must pair depthTest:false WITH depthWrite:false (the T12 convention)
  // or it stamps depth and culls later transparent fragments (precip / selection rings); and renderOrder must be
  // set per-MESH (it does NOT inherit from the group) — 13/14 sit above T12's 11/12 selection rings.
  function gmat(c, o) { return new T.MeshBasicMaterial({ color: c, side: T.DoubleSide, transparent: true, opacity: o, depthTest: false, depthWrite: false }); }
  var ring = new T.Mesh(new T.RingGeometry(20, 27, 28), gmat("#ffe9a8", 0.85));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 1; ring.name = "gring"; ring.renderOrder = 13; grp.add(ring);
  var shaft = new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 56, 6), gmat("#ffe9a8", 0.82));
  shaft.rotation.x = Math.PI / 2; shaft.position.set(0, 8, -34); shaft.name = "gshaft"; shaft.renderOrder = 13; grp.add(shaft);
  var head = new T.Mesh(new T.ConeGeometry(11, 30, 4), gmat("#ffe9a8", 0.9));
  head.rotation.x = -Math.PI / 2; head.position.set(0, 8, -74); head.name = "ghead"; head.renderOrder = 13; grp.add(head);
  // SHAPE REDUNDANCY (CVD): so the 3D ghost is not color-ONLY across intents — a CHARGE adds a bold second ring
  // around the foe; a QUEUE adds a raised "+" append tick. Both hidden unless that intent is active.
  var gfoe = new T.Mesh(new T.RingGeometry(30, 42, 32), gmat("#ff9763", 0.9));
  gfoe.rotation.x = -Math.PI / 2; gfoe.position.y = 2; gfoe.name = "gfoe"; gfoe.renderOrder = 14; gfoe.visible = false; grp.add(gfoe);
  var tick = new T.Group(); tick.name = "gqtick"; tick.visible = false; tick.position.set(0, 26, 0);
  var bar1 = new T.Mesh(new T.BoxGeometry(22, 5, 5), gmat("#bfe0a0", 0.95)); bar1.renderOrder = 14;
  var bar2 = new T.Mesh(new T.BoxGeometry(5, 22, 5), gmat("#bfe0a0", 0.95)); bar2.renderOrder = 14;
  tick.add(bar1); tick.add(bar2); grp.add(tick);
  __FIELD.scene.add(grp); __FIELD._ghost3d = grp;
}
function fld3dSyncDrag() {
  var grp = __FIELD._ghost3d; if (!grp) return;
  var dr = fldOrderGhostGesture();
  if (!dr) { grp.visible = false; return; }
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  var dx, dz, face, col;
  if (dr.aimUid) {
    var au = fldById(dr.aimUid); if (!au || !au.order || au.order.tx == null) { grp.visible = false; return; }
    dx = au.order.tx; dz = au.order.tz; face = Math.atan2(dr.x - dx, -(dr.z - dz)); col = FLD_GH_HANDLE;
  } else {
    var foe = fldEnemyAt(dr.x, dr.z, ps, FLD_CHARGE_GRAB);
    if (foe) { dx = foe.x; dz = foe.z; face = Math.atan2(foe.x - dr.x0, -(foe.z - dr.z0)); col = FLD_GH_CHARGE; }
    else {
      dx = dr.x0; dz = dr.z0;
      var dragged = Math.hypot(dr.x - dr.x0, dr.z - dr.z0) > FLD_DRAG_MIN;
      face = dragged ? Math.atan2(dr.x - dr.x0, -(dr.z - dr.z0)) : 0;
      col = dr.shift ? FLD_GH_QUEUE : FLD_GH_MOVE;
    }
  }
  var y = (typeof fldTerrainH === "function") ? fldTerrainH(dx, dz) : 0;
  grp.visible = true; grp.position.set(dx, y + 3, dz); grp.rotation.y = -face;
  var kring = grp.getObjectByName("gring");
  if (kring) { kring.scale.setScalar(dr.keyboard ? 1.35 : 1); if (kring.material) kring.material.opacity = dr.keyboard ? 1 : 0.85; }
  var names = ["gring", "gshaft", "ghead"];
  for (var i = 0; i < names.length; i++) { var m = grp.getObjectByName(names[i]); if (m && m.material) m.material.color.set(col); }
  // shape redundancy: the bold foe-ring only on a CHARGE, the "+" append tick only on a QUEUE
  var gfoe = grp.getObjectByName("gfoe"), gtick = grp.getObjectByName("gqtick");
  if (gfoe) gfoe.visible = (col === FLD_GH_CHARGE);
  if (gtick) gtick.visible = (col === FLD_GH_QUEUE);
}
