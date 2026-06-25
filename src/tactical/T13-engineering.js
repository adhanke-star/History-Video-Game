/* ============================================================================
   src/tactical/T13-engineering.js  —  THE TACTICAL ENGINEERING CORPS

   Aaron's run-k directive: build the field-engineering effects (entrenchments,
   abatis/obstacles, pontoon bridging, obstacle clearing) that interact with the
   B-5 difficulty/realism sliders. This module hosts the whole corps; it ships in
   vetted increments.

   INCREMENT 1 — FIELD ENTRENCHMENTS (the spade):
     A player brigade ordered to ENTRENCH (key E) digs in where it stands and,
     over time, earns COVER that rises toward a parapet-grade multiplier — the war's
     defining drift toward trench warfare (Cold Harbor, Petersburg). Marching off the
     works abandons them (the cover fades). The dig SPEED and the COVER it yields read
     the B-5 realism slider: Arcade digs fast for modest cover, Historian digs slow
     for strong cover.

   GUARDED + BYTE-IDENTICAL: every seam in T0 is a `typeof fldEng* === "function"`
   call, and each engineering fn is a NO-OP for a unit that never entrenched
   (`u.entrench` is 0/undefined). No historical scenario or AI triggers entrenchment,
   so every existing AI-vs-AI baseline resolves byte-for-byte as before. Entrenchment
   is a PLAYER tool in this increment; scenario/AI-driven works are a later increment.

   FACING-AWARE: a parapet shelters its FRONT (fldEngCover takes the shooter/attacker
   bearing — full bonus in the front arc, half on the flank, none in the rear), so a
   flank/rear maneuver still counters fixed works (bug-hunt 2026-06-20).

   INCREMENT 2 — ABATIS / OBSTACLES (the axe):
     A selected infantry brigade's pioneer detail may build a capped timber belt across
     its front (B). Enemy troops forcing the belt are slowed and disordered; their
     immediate morale and fire cohesion suffer. A nearby brigade may clear a belt (X).
     Realism makes the obstacle bite harder and makes building/clearing slower.

   INCREMENT 3 — PONTOON BRIDGING (the pontoon train):
     A NEW opt-in river terrain feature (__FIELD.terrain.rivers[]) that actually GATES
     movement: a river is impassable except at a crossing. Crossings are a shallow FORD
     (always passable, but slow), a DEEP ford (passable only at low realism — else it needs
     a bridge), and a player-laid PONTOON bridge (key N): a pioneer brigade on the near bank
     lays a bridge over time, opening a fast crossing corridor. The realism slider (B-5)
     scales the sapper speed, the ford slow, AND whether a deep crossing is fordable at all
     vs. requires a pontoon. A campaign-fielded strong Engineer Works Corps (57-engineering)
     lays bridges faster (the A1 strategic anchor). The active gate reuses the T0 seams that
     were reserved for it: fldEngMoveFactor (ford slow) + fldEngMoveGate (return a clamped
     bank point for an illegal water step). NO shipped scenario declares terrain.rivers and
     the AI never lays a pontoon, so every existing AI-vs-AI baseline is byte-for-byte
     unchanged; the river is surfaced via the Skirmish "River crossing" ground option (and an
     opts.river sandbox flag for the focused probe).

   EXTENSION POINTS (kept here so the corps grows in one place):
     - AI / SCENARIO-driven entrenchment + AI river-assault pathing to fords/pontoons
       (currently player-only). When AI entrenchment lands, also carry entrench onto the fog
       last-seen ghost so a scouted-then-hidden enemy fieldwork persists as last-known intel,
       and re-init the 3D works on phase advance. AI pathing would let the AI force a river.
     - Activating a shipped scenario's cosmetic creek/Stone-Bridge markers as a LIVE river
       (re-vet that battle's balance first — today they stay cosmetic so the baseline holds).
   ============================================================================ */

/* the realism coupling (B-5). Derive a realism scale from the live severity bundle
   (attrition is the cleanest realism proxy: Arcade 0.7 / Balanced 1.0 / Historian 1.3).
   Neutral 1.0 when no preset is set -> the entrenchment baseline. */
function fldEngRealism() {
  var a = (typeof __FIELD !== "undefined" && __FIELD.sev && typeof __FIELD.sev.attrition === "number") ? __FIELD.sev.attrition : 1;
  return Math.max(0.6, Math.min(1.4, a));
}

var FLDE = {
  DIG_TIME_BASE: 70,   // sim-seconds to a full parapet at Balanced realism (scaled by realism below)
  MAX_BONUS_BASE: 0.62, // full-entrench cover bonus at Balanced: cover x1.62 (rifle pits -> low parapet)
  WORKS_R: 26,         // yd: march beyond this from the dig site and the works are abandoned
  DECAY_T: 28,         // sim-seconds for abandoned works to fade fully
  ABATIS_BUILD_T: 48,  // balanced sim-seconds for a pioneer detail to finish one belt
  ABATIS_CLEAR_T: 34,  // balanced sim-seconds to open a passage
  ABATIS_HALF_W: 62,   // belt half-width across a brigade front
  ABATIS_DEPTH: 18,    // interaction band around the timber line
  ABATIS_FRONT: 52,    // belt center offset in front of its builder
  ABATIS_WORK_R: 82,   // builder/clearer must stay near the work
  ABATIS_MAX_SIDE: 4,  // anti-spam / anti-stalemate cap
  // ---- INCREMENT 3: river / pontoon ----
  RIVER_HALF: 34,        // yd: default half-width of a river's impassable water band
  CROSS_W: 80,           // yd: radius of a crossing corridor (ford/bridge/pontoon); > RIVER_HALF so a straight march through it clears the band
  DEEP_FORD_CAP: 0.85,   // a DEEP ford is fordable only when realism <= this (Arcade 0.7 yes; Balanced 1.0 / Historian 1.3 -> needs a pontoon)
  FORD_FATIGUE: 7,       // fatigue/sim-second slogging through an open ford (the wet, exhausting crossing)
  PONTOON_BUILD_T: 58,   // balanced sim-seconds to lay one pontoon bridge (scaled by realism + the strategic corps speed)
  PONTOON_REACH: 124,    // the escorting brigade must be within this of the river to order/keep building
  PONTOON_MAX: 3         // bridges a side may have under way / standing at once
};

function fldEngReset() {
  if (typeof __FIELD === "undefined") return;
  __FIELD.engObstacles = null;
  __FIELD._engUsed = null;
  __FIELD._engObsSeq = null;
  __FIELD.engPontoons = null;        // INCREMENT 3: player-laid pontoon bridges (reset every launch -> byte-identical sandbox)
  __FIELD._engPonSeq = null;
  __FIELD.engCorpsSpeed = 1;         // strategic Engineer Works Corps speed factor (1 = standalone; T2 raises it on a campaign launch)
}

/* per-phase reset (multi-phase battles — Vicksburg/Antietam/Gettysburg): drop the prior sector's
   obstacle belts. Each phase is a fresh field and _fldBuildPhase rebuilds __FIELD.units, so the
   per-unit eng fields are moot. KEEP __FIELD._engUsed so the aggregate teaching card still fires
   if an abatis was used in ANY phase (bug-hunt 2026-06-20: belts were leaking across phases). */
function fldEngPhaseReset() {
  if (typeof __FIELD === "undefined") return;
  __FIELD.engObstacles = null;
  __FIELD._engObsSeq = null;
  __FIELD.engPontoons = null;   // INCREMENT 3: a phase advance is a fresh sector/map — drop the prior phase's pontoons too
  __FIELD._engPonSeq = null;
}

function _fldEngObs() { return (__FIELD.engObstacles || (__FIELD.engObstacles = [])); }
function _fldEngPointSeg(x, z, a) {
  var dx = a.x2 - a.x1, dz = a.z2 - a.z1, l2 = dx * dx + dz * dz;
  var t = l2 ? fldClamp(((x - a.x1) * dx + (z - a.z1) * dz) / l2, 0, 1) : 0;
  var px = a.x1 + t * dx, pz = a.z1 + t * dz, ex = x - px, ez = z - pz;
  return { d2: ex * ex + ez * ez, x: px, z: pz, t: t };
}
function _fldEngOrient(ax, az, bx, bz, cx, cz) { return (bx - ax) * (cz - az) - (bz - az) * (cx - ax); }
function _fldEngCross(ax, az, bx, bz, cx, cz, dx, dz) {
  var a = _fldEngOrient(ax, az, bx, bz, cx, cz), b = _fldEngOrient(ax, az, bx, bz, dx, dz);
  var c = _fldEngOrient(cx, cz, dx, dz, ax, az), d = _fldEngOrient(cx, cz, dx, dz, bx, bz);
  return ((a <= 0 && b >= 0) || (a >= 0 && b <= 0)) && ((c <= 0 && d >= 0) || (c >= 0 && d <= 0));
}

function fldSelAbatis() {
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [];
  if (!sel || !sel.length) return;
  var obs = _fldEngObs(), made = 0;
  for (var i = 0; i < sel.length; i++) {
    var u = sel[i];
    if (!u || !u.alive || u.state === "routing" || u.arm !== "inf") continue;
    var sideN = 0, already = false;
    for (var j = 0; j < obs.length; j++) { if (obs[j].side === u.side && obs[j].strength > 0) sideN++; if (obs[j].builderId === u.id && obs[j].building) already = true; }
    if (already || sideN >= FLDE.ABATIS_MAX_SIDE) continue;
    var fx = Math.sin(u.facing), fz = -Math.cos(u.facing), rx = Math.cos(u.facing), rz = Math.sin(u.facing);
    var cx = u.x + fx * FLDE.ABATIS_FRONT, cz = u.z + fz * FLDE.ABATIS_FRONT;
    var id = "abatis_" + u.side + "_" + (__FIELD._engObsSeq = (__FIELD._engObsSeq || 0) + 1);   // monotonic counter -> globally unique (no same-tick collisions)
    obs.push({ id: id, side: u.side, builderId: u.id, x1: cx - rx * FLDE.ABATIS_HALF_W, z1: cz - rz * FLDE.ABATIS_HALF_W,
      x2: cx + rx * FLDE.ABATIS_HALF_W, z2: cz + rz * FLDE.ABATIS_HALF_W, strength: 0.02, building: true });
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing };
    u.engBuildId = id; u.digging = false; made++;
  }
  if (made) {
    __FIELD._engUsed = __FIELD._engUsed || {}; __FIELD._engUsed.abatis = true;
    if (typeof fldAnnounce === "function") fldAnnounce("Abatis ordered — pioneer details fell timber across the front.");
  } else if (typeof fldAnnounce === "function") fldAnnounce("No infantry pioneer detail is free, or the four-belt limit is reached.");
  if (typeof fldRenderHud === "function") fldRenderHud();
}

function fldSelClearObstacle() {
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [], obs = __FIELD.engObstacles || [];
  if (!sel || !sel.length || !obs.length) return;
  var n = 0;
  for (var i = 0; i < sel.length; i++) {
    var u = sel[i], best = null, bd = FLDE.ABATIS_WORK_R * FLDE.ABATIS_WORK_R;
    if (!u || !u.alive || u.state === "routing" || u.arm !== "inf") continue;
    for (var j = 0; j < obs.length; j++) { var q = _fldEngPointSeg(u.x, u.z, obs[j]); if (obs[j].strength > 0 && q.d2 <= bd) { bd = q.d2; best = obs[j]; } }
    if (!best) continue;
    u.engClearId = best.id; u.engBuildId = null; u.digging = false;
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing }; n++;
  }
  if (n && typeof fldAnnounce === "function") fldAnnounce("Obstacle-clearing ordered — axes open a lane through the timber.");
  else if (typeof fldAnnounce === "function") fldAnnounce("Move infantry within 82 yards of an obstacle before ordering clearance.");
  if (typeof fldRenderHud === "function") fldRenderHud();
}

function fldEngMoveFactor(x, z, u) {
  if (!u) return 1;
  var f = 1;
  // INCREMENT 3: a river ford slows a crossing column; a bridge/pontoon is full speed. No-op (no read)
  // unless a river is declared, so every pre-river baseline multiplies by exactly 1 (byte-identical).
  if (typeof __FIELD !== "undefined" && __FIELD.terrain && __FIELD.terrain.rivers) {
    var cr = fldEngCrossAt(x, z);
    if (cr) f *= cr.open ? cr.slow : 0.34;   // open ford -> slow; blocked water (shoved in) -> a crawl
  }
  // an active ENEMY obstacle belt slows a unit forcing it (unchanged: friendly belts return factor 1)
  var obs = (typeof __FIELD !== "undefined") ? __FIELD.engObstacles : null;
  if (obs && obs.length) {
    for (var i = 0; i < obs.length; i++) {
      var a = obs[i]; if (!(a.strength > 0.02) || a.side === u.side) continue;
      if (_fldEngPointSeg(x, z, a).d2 <= FLDE.ABATIS_DEPTH * FLDE.ABATIS_DEPTH) {
        var minF = Math.max(0.24, 0.80 - 0.40 * fldEngRealism());
        f *= 1 - (1 - minF) * a.strength;
        break;
      }
    }
  }
  return f;
}

function fldEngMoveGate(u, x0, z0, x1, z1, dt) {
  if (!u) return null;
  var obs = (typeof __FIELD !== "undefined") ? __FIELD.engObstacles : null;
  // ---- abatis crossing disorder. A routed unit is already broken (and the rout branch bypasses fldMoveFactor);
  //      don't keep docking its morale/fatigue as it flees through a belt (matches the module's routing guards). ----
  if (u.state !== "routing" && obs && obs.length) {
    var touched = null;
    for (var i = 0; i < obs.length; i++) {
      var a = obs[i]; if (!(a.strength >= 0.2) || a.side === u.side) continue;
      if (_fldEngCross(x0, z0, x1, z1, a.x1, a.z1, a.x2, a.z2) || _fldEngPointSeg(x1, z1, a).d2 <= FLDE.ABATIS_DEPTH * FLDE.ABATIS_DEPTH) { touched = a; break; }
    }
    if (touched && u._engObsTouch !== touched.id) {
      u._engObsTouch = touched.id;
      u.engDisorder = Math.max(u.engDisorder || 0, 12 * fldEngRealism() * touched.strength);
      u.morale = Math.max(0, u.morale - (4 + 4 * fldEngRealism()) * touched.strength);
      u.fatigue = Math.min(100, u.fatigue + 5 * touched.strength);
    } else if (!touched) u._engObsTouch = null;
  }
  // ---- INCREMENT 3: river water gate. Terrain blocks ALL states (a routed mob is stopped by deep water too).
  //      No-op (returns null, no read) unless a river is declared -> every pre-river baseline is byte-identical. ----
  var rv = (typeof __FIELD !== "undefined" && __FIELD.terrain) ? __FIELD.terrain.rivers : null;
  if (rv && rv.length) {
    // classify the destination, the ORIGIN, and the segment MIDPOINT. The destination/midpoint catch a step that
    // ENDS in (or tangentially clips) impassable water; classifying the origin closes the bug-hunt leak where a unit
    // standing on an OPEN crossing could sidestep off it into deep water (fldEngCrossAt is truthy for an open ford too,
    // so "not dry" != "blockable"). Block entering blocked water from anywhere EXCEPT already-blocked water (so a unit
    // mired in the band can still crawl back to a bank), per the bug-hunt consensus fix.
    var c1 = fldEngCrossAt(x1, z1), c0 = fldEngCrossAt(x0, z0), cm = fldEngCrossAt((x0 + x1) / 2, (z0 + z1) / 2);
    var destBlocked = (c1 && !c1.open) || (cm && !cm.open), originBlocked = (c0 && !c0.open);
    if (destBlocked && !originBlocked) {
      if (!u._engWaterHalt && u.state !== "routing" && typeof fldAnnounce === "function") fldAnnounce((u.name || "The brigade") + " is stopped at the water — there is no crossing here. Lay a pontoon (N) or march to a ford.");
      u._engWaterHalt = true;
      return _fldRiverBankPoint(x0, z0, x1, z1);   // snug to the bank
    }
    u._engWaterHalt = false;
    if (c1 && c1.open && c1.kind === "ford" && u.state !== "routing") u.fatigue = Math.min(100, (u.fatigue || 0) + FLDE.FORD_FATIGUE * dt);
  }
  return null;
}

function fldEngFireFactor(u) { return (u && u.engDisorder > 0) ? 0.72 : 1; }

/* ===========================================================================
   INCREMENT 3 — RIVERS & PONTOON BRIDGING
   =========================================================================== */
/* strategic Engineer Works Corps speed (the A1 anchor): >1 = faster sappers, set by T2 on a campaign
   launch from bridgeArmy(C).engineering; 1 for every standalone launch (byte-identical). */
function _fldEngCorpsSpeed() {
  var s = (typeof __FIELD !== "undefined") ? __FIELD.engCorpsSpeed : 1;
  return (typeof s === "number" && isFinite(s) && s > 0) ? s : 1;
}
/* a shallow ford is always passable; a DEEP ford only at low realism (else it needs a pontoon). */
function _fldFordOpen(c) { return !c.deep || fldEngRealism() <= FLDE.DEEP_FORD_CAP; }
/* fording speed multiplier (<1); Historian fords slower than Arcade. */
function _fldFordSlow() { return Math.max(0.30, 0.66 - 0.22 * fldEngRealism()); }

/* nearest point on a river's polyline to (x,z), plus the local along-river unit direction. */
function _fldRiverNearest(x, z, rr) {
  var pth = rr.path || [], best = 1e18, bx = x, bz = z, dirx = 1, dirz = 0;
  for (var i = 1; i < pth.length; i++) {
    var ax = pth[i - 1][0], az = pth[i - 1][1], bx2 = pth[i][0], bz2 = pth[i][1];
    var seg = _fldEngPointSeg(x, z, { x1: ax, z1: az, x2: bx2, z2: bz2 });
    if (seg.d2 < best) {
      best = seg.d2; bx = seg.x; bz = seg.z;
      var ddx = bx2 - ax, ddz = bz2 - az, L = Math.sqrt(ddx * ddx + ddz * ddz) || 1;
      dirx = ddx / L; dirz = ddz / L;
    }
  }
  return { d2: best, x: bx, z: bz, dirx: dirx, dirz: dirz };
}

/* classify a world point against the rivers:
   null            -> dry land (no river band here)
   {open:true,...} -> in the band but inside an OPEN crossing (kind: ford/bridge/pontoon; slow multiplier)
   {open:false,...}-> in the band, no open crossing -> impassable (kind: water / ford-deep) */
function fldEngCrossAt(x, z) {
  var rv = (typeof __FIELD !== "undefined" && __FIELD.terrain) ? __FIELD.terrain.rivers : null;
  if (!rv || !rv.length) return null;
  for (var r = 0; r < rv.length; r++) {
    var rr = rv[r], hw = rr.halfW || FLDE.RIVER_HALF;
    if (_fldRiverNearest(x, z, rr).d2 > hw * hw) continue;   // not in this river's water band
    var cs = rr.crossings || [], deepHere = false;
    for (var c = 0; c < cs.length; c++) {
      var cc = cs[c], cw = cc.w || FLDE.CROSS_W, dx = x - cc.x, dz = z - cc.z;
      if (dx * dx + dz * dz > cw * cw) continue;
      if (cc.kind === "bridge") return { open: true, kind: "bridge", slow: 1, name: cc.name || "Bridge" };
      if (cc.kind === "ford") {
        if (_fldFordOpen(cc)) return { open: true, kind: "ford", slow: _fldFordSlow(), name: cc.name || "Ford" };
        deepHere = true;   // a deep ford overlapping this point, but closed at this realism
      }
    }
    var pp = (typeof __FIELD !== "undefined") ? (__FIELD.engPontoons || []) : [];
    for (var p = 0; p < pp.length; p++) {
      var pn = pp[p]; if (!(pn.strength >= 1)) continue;   // only a COMPLETED bridge is a crossing
      var pdx = x - pn.x, pdz = z - pn.z, pw = pn.w || FLDE.CROSS_W;
      if (pdx * pdx + pdz * pdz <= pw * pw) return { open: true, kind: "pontoon", slow: 1, name: "Pontoon bridge" };
    }
    return { open: false, kind: deepHere ? "ford-deep" : "water", name: deepHere ? "Deep ford" : "River" };
  }
  return null;
}

/* the furthest point along [start -> end] that is NOT blocked water — snugs a unit to the bank. */
function _fldRiverBankPoint(x0, z0, x1, z1) {
  var lo = 0, hi = 1;
  for (var k = 0; k < 10; k++) {
    var mid = (lo + hi) / 2, mx = x0 + (x1 - x0) * mid, mz = z0 + (z1 - z0) * mid, cm = fldEngCrossAt(mx, mz);
    if (cm && !cm.open) hi = mid; else lo = mid;
  }
  return { x: x0 + (x1 - x0) * lo, z: z0 + (z1 - z0) * lo };
}

/* the nearest river bridging site within reach of a brigade, with the local span axis. */
function _fldEngBridgeSite(u) {
  var rv = (typeof __FIELD !== "undefined" && __FIELD.terrain) ? __FIELD.terrain.rivers : null;
  if (!rv || !rv.length) return null;
  var best = null, bd = FLDE.PONTOON_REACH * FLDE.PONTOON_REACH;
  for (var r = 0; r < rv.length; r++) {
    var near = _fldRiverNearest(u.x, u.z, rv[r]);
    if (near.d2 < bd) { bd = near.d2; best = near; }
  }
  if (!best) return null;
  return { x: best.x, z: best.z, rx: best.dirx, rz: best.dirz };
}

/* ORDER (key N): the selected brigade's pioneer detail brings up the pontoon train and lays a bridge. */
function fldSelPontoon() {
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [];
  if (!sel || !sel.length) return;
  var rv = (typeof __FIELD !== "undefined" && __FIELD.terrain) ? __FIELD.terrain.rivers : null;
  if (!rv || !rv.length) { if (typeof fldAnnounce === "function") fldAnnounce("There is no river here to bridge."); return; }
  var pp = (__FIELD.engPontoons || (__FIELD.engPontoons = [])), made = 0, capped = false, tooFar = false, dupedOnly = false;
  for (var i = 0; i < sel.length; i++) {
    var u = sel[i];
    if (!u || !u.alive || u.state === "routing" || u.arm !== "inf") continue;
    var mine = 0; for (var m = 0; m < pp.length; m++) if (pp[m].side === u.side) mine++;   // per-side cap (the corps grows to AI/hotseat river assaults)
    if (mine >= FLDE.PONTOON_MAX) { capped = true; break; }
    var site = _fldEngBridgeSite(u);
    if (!site) { tooFar = true; continue; }
    var dupe = false, gap = FLDE.CROSS_W * 0.85;
    for (var j = 0; j < pp.length; j++) { var q = pp[j], qdx = q.x - site.x, qdz = q.z - site.z; if (qdx * qdx + qdz * qdz < gap * gap) { dupe = true; break; } }
    if (dupe) { dupedOnly = true; continue; }
    var id = "pontoon_" + (__FIELD._engPonSeq = (__FIELD._engPonSeq || 0) + 1);   // monotonic -> globally unique
    pp.push({ id: id, side: u.side, x: site.x, z: site.z, rx: site.rx, rz: site.rz, w: FLDE.CROSS_W, strength: 0.02, building: true, builderId: u.id });
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing };
    u.engPontoonId = id; u.digging = false; u.engBuildId = null; u.engClearId = null;
    made++;
  }
  if (typeof fldAnnounce === "function") {
    if (made) fldAnnounce("Pontoon train ordered forward — the engineers begin laying a bridge.");
    else if (capped) fldAnnounce("The pontoon train is fully committed (bridge limit reached).");
    else if (tooFar) fldAnnounce("Bring an infantry brigade up to the near bank before laying a pontoon bridge.");
    else if (dupedOnly) fldAnnounce("A pontoon bridge is already being laid at that span — choose another stretch of river.");
    else fldAnnounce("No infantry pioneer detail is free to escort the pontoon train.");
  }
  if (made) { __FIELD._engUsed = __FIELD._engUsed || {}; __FIELD._engUsed.pontoon = true; }
  if (typeof fldRenderHud === "function") fldRenderHud();
}

/* OPT-IN river terrain (the Skirmish "River crossing" ground + the opts.river sandbox flag). Attaches a
   single west-east river across the player's approach to the central objective: a meandering impassable
   band with a SHALLOW ford on one flank (always passable, slow) and a DEEP ford on the other (passable
   only at low realism — else it must be bridged with a pontoon). No shipped scenario calls this, so the
   gate stays a no-op for every baseline. */
function fldEngInstallRiver(opts) {
  if (typeof __FIELD === "undefined" || !__FIELD.terrain || typeof FLD === "undefined") return;
  var W = FLD.FIELD_W, H = FLD.FIELD_H, ox = W / 2;
  // Place the band between the PLAYER's home edge and the objective, so the player (either side) is the one forcing
  // the crossing and the AI defends the far bank (the AI doesn't path to fords yet — see the header extension point).
  // US deploys south (z high), CS north (z low) — matching the sandbox/skirmish home edges.
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : ((__FIELD.playerSide === "CS") ? "CS" : "US");
  var homeZ = (ps === "US") ? (H - 150) : 150;
  var objZ = (__FIELD.objective && typeof __FIELD.objective.z === "number") ? __FIELD.objective.z : H / 2;
  var base = Math.round(objZ + (homeZ - objZ) * 0.5);   // halfway between the player's edge and the objective
  __FIELD.terrain.rivers = [{
    name: "the River",
    halfW: FLDE.RIVER_HALF,
    path: [[30, base + 16], [Math.round(W * 0.22), base - 14], [Math.round(W * 0.42), base + 10],
           [Math.round(W * 0.58), base - 12], [Math.round(W * 0.78), base + 14], [W - 30, base - 10]],
    crossings: [
      { kind: "ford", name: "the Lower Ford", x: Math.round(ox - W * 0.28), z: base, w: 88 },
      { kind: "ford", name: "the Mill Ford", deep: true, x: Math.round(ox + W * 0.28), z: base, w: 88 }
    ]
  }];
}

/* the earned-cover multiplier for a unit (>=1). Returns EXACTLY 1 for any unit that
   is not entrenched -> the fire/melee cover seams are byte-identical for every baseline.
   FACING-AWARE: a parapet shelters the direction it FACES. Pass the shooter/attacker
   world position (fromX,fromZ) and the EARNED bonus is full in the front arc, half on the
   flank, and zero in the rear — so a flank/rear maneuver still counters fixed works (and
   matches the one-sided berm we render). With no bearing (the HUD call) it reads the
   nominal front-facing strength. */
function fldEngCover(u, fromX, fromZ) {
  if (!u || !u.entrench || u.entrench <= 0) return 1;
  var arc = 1;
  if (fromX != null && fromZ != null && typeof u.facing === "number" && typeof fldAngDiff === "function") {
    var bearing = Math.atan2(fromX - u.x, -(fromZ - u.z));   // world bearing from the unit toward the shooter
    var rel = Math.abs(fldAngDiff(bearing, u.facing));
    arc = rel > Math.PI * 0.72 ? 0 : (rel > Math.PI * 0.28 ? 0.5 : 1);   // front full / flank half / rear none
  }
  return 1 + u.entrench * (FLDE.MAX_BONUS_BASE * fldEngRealism()) * arc;
}

/* advance entrenchment each sim tick. NO-OP for any clean unit (the loop body never
   runs unless a unit is digging or already has works), so baselines are byte-identical. */
function fldEngStep(dt) {
  if (typeof __FIELD === "undefined" || !__FIELD.units) return;
  var rate = 1 / (FLDE.DIG_TIME_BASE * fldEngRealism());   // entrench progress per sim-second
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i];
    if (!u.alive) continue;
    if (u.engDisorder > 0) u.engDisorder = Math.max(0, u.engDisorder - dt);
    if (u.digging || u.entrench > 0) {
      // left the works? (marched off the dig site, or no site recorded)
      var leftWorks = (u.digX == null) ||
        ((u.x - u.digX) * (u.x - u.digX) + (u.z - u.digZ) * (u.z - u.digZ) > FLDE.WORKS_R * FLDE.WORKS_R);
      if (leftWorks) {
        u.digging = false;
        if (u.entrench > 0) u.entrench = Math.max(0, u.entrench - dt / FLDE.DECAY_T);
      } else if (u.digging && u.order && u.order.type === "hold" && u.state !== "routing") {
        u.entrench = Math.min(1, (u.entrench || 0) + rate * dt);
      }
    }
    // a routed unit drops its tools but keeps any works it is standing in (no progress while routing)
  }
  var obs = __FIELD.engObstacles;
  if (obs && obs.length) for (var j = obs.length - 1; j >= 0; j--) {
    var a = obs[j], b = (typeof fldById === "function") ? fldById(a.builderId) : null;
    if (a.building) {
      var midx = (a.x1 + a.x2) / 2, midz = (a.z1 + a.z2) / 2;
      var near = b && b.alive && b.state !== "routing" && b.order && b.order.type === "hold" &&
        ((b.x - midx) * (b.x - midx) + (b.z - midz) * (b.z - midz) <= FLDE.ABATIS_WORK_R * FLDE.ABATIS_WORK_R);
      if (near) a.strength = Math.min(1, a.strength + dt / (FLDE.ABATIS_BUILD_T * fldEngRealism()));
      else { a.building = false; if (b) b.engBuildId = null; }
      if (a.strength >= 1) { a.building = false; if (b) b.engBuildId = null; }
    } else if (a.strength < 0.2) {
      // an aborted, never-completed belt (builder marched off / fell before it matured past the
      // disorder threshold) falls apart instead of lingering as a free weak-slow stub that
      // permanently consumes a side's ABATIS_MAX_SIDE slot (matches abandoned-entrenchment decay).
      a.strength = Math.max(0, a.strength - dt / FLDE.DECAY_T);
      if (a.strength <= 0) { obs.splice(j, 1); continue; }
    }
    for (var k = 0; k < __FIELD.units.length; k++) {
      var c = __FIELD.units[k]; if (!c.alive || c.state === "routing" || c.engClearId !== a.id) continue;
      var q = _fldEngPointSeg(c.x, c.z, a);
      if (!c.order || c.order.type !== "hold" || q.d2 > FLDE.ABATIS_WORK_R * FLDE.ABATIS_WORK_R) { c.engClearId = null; continue; }
      a.building = false;
      a.strength = Math.max(0, a.strength - dt / (FLDE.ABATIS_CLEAR_T * fldEngRealism()));
      if (a.strength <= 0) { c.engClearId = null; obs.splice(j, 1); break; }
    }
  }
  // INCREMENT 3: advance / wash-out the player's pontoon bridges (no-op when none are laid).
  var pp = __FIELD.engPontoons;
  if (pp && pp.length) for (var pj = pp.length - 1; pj >= 0; pj--) {
    var pn = pp[pj], pb = (typeof fldById === "function") ? fldById(pn.builderId) : null;
    if (pn.building) {
      var pnear = pb && pb.alive && pb.state !== "routing" && pb.order && pb.order.type === "hold" &&
        ((pb.x - pn.x) * (pb.x - pn.x) + (pb.z - pn.z) * (pb.z - pn.z) <= FLDE.PONTOON_REACH * FLDE.PONTOON_REACH);
      // realism slows the lay; a strong strategic Engineer Works Corps speeds it (the A1 anchor).
      if (pnear) pn.strength = Math.min(1, pn.strength + dt / (FLDE.PONTOON_BUILD_T * fldEngRealism()) * _fldEngCorpsSpeed());
      else { pn.building = false; if (pb) pb.engPontoonId = null; }
      if (pn.strength >= 1) { pn.building = false; if (pb) pb.engPontoonId = null; }
    } else if (pn.strength < 1) {
      // a half-laid bridge whose escort marched off / fell washes downstream and frees the cap; a COMPLETED
      // bridge stands on its own and persists after the pioneers move on (it is a permanent crossing).
      pn.strength = Math.max(0, pn.strength - dt / FLDE.DECAY_T);
      if (pn.strength <= 0) { pp.splice(pj, 1); continue; }
    }
  }
}

/* ORDER (key E): the selected player brigades take up the spade where they stand. */
function fldSelEntrench() {
  var sel = (typeof fldPlayerSel === "function") ? fldPlayerSel() : [];
  if (!sel || !sel.length) return;
  var n = 0;
  for (var i = 0; i < sel.length; i++) {
    var u = sel[i];
    if (!u || !u.alive || u.state === "routing") continue;
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing };
    u.digging = true; u.digX = u.x; u.digZ = u.z;
    n++;
  }
  if (n && typeof fldAnnounce === "function") fldAnnounce("Entrench ordered — the men take up the spade.");
  if (typeof fldRenderHud === "function") fldRenderHud();
}

/* HUD line for the selected unit. Empty (no extra markup) for a non-entrenching unit. */
function fldEngHudSelected(u) {
  if (!u) return "";
  var dig = !!u.digging, e = u.entrench || 0;
  var out = "";
  if (dig || e > 0) {
    var pct = Math.round(e * 100);
    var label = e >= 0.98 ? "Entrenched" : (dig ? "Digging in" : "Works (fading)");
    var cov = fldEngCover(u);
    var col = e >= 0.66 ? "#9cc66f" : e >= 0.33 ? "#d6b15a" : "#cda06a";
    out += '<div style="margin-top:4px;color:' + col + ';font-size:12px;">⛏ ' + label +
      ' — ' + pct + '% · cover ×' + cov.toFixed(2) + '</div>';
  }
  var obs = __FIELD.engObstacles || [], a = null;
  for (var i = 0; i < obs.length; i++) if (obs[i].id === u.engBuildId || obs[i].id === u.engClearId) { a = obs[i]; break; }
  if (a && u.engBuildId) out += '<div style="margin-top:4px;color:#e1bd76;font-size:12px;">▲ Building abatis — ' + Math.round(a.strength * 100) + '%</div>';
  if (a && u.engClearId) out += '<div style="margin-top:4px;color:#d9c9a5;font-size:12px;">✕ Clearing obstacle — ' + Math.round((1 - a.strength) * 100) + '%</div>';
  if (u.engDisorder > 0) out += '<div style="margin-top:4px;color:#f0a07d;font-size:12px;">⚠ Obstacle disorder — ragged fire (' + Math.ceil(u.engDisorder) + 's)</div>';
  // INCREMENT 3: pontoon-laying + fording status (no markup unless this unit is bridging or in the water)
  if (u.engPontoonId) {
    var pn = null, pl = __FIELD.engPontoons || [];
    for (var pk = 0; pk < pl.length; pk++) if (pl[pk].id === u.engPontoonId) { pn = pl[pk]; break; }
    if (pn) out += '<div style="margin-top:4px;color:#8fb9d6;font-size:12px;">⚓ Laying pontoon bridge — ' + Math.round(pn.strength * 100) + '%</div>';
  }
  if (typeof fldEngCrossAt === "function" && typeof __FIELD !== "undefined" && __FIELD.terrain && __FIELD.terrain.rivers) {
    var cr = fldEngCrossAt(u.x, u.z);
    // the halt flag is set by the move gate when it clamps the unit to the bank (its tile is then dry, so a tile read
    // alone would miss it); a unit actually standing in an open ford shows the fording line.
    if (u._engWaterHalt) out += '<div style="margin-top:4px;color:#f0a07d;font-size:12px;">≈ Halted at the water — no crossing here (lay a pontoon, key N)</div>';
    else if (cr && cr.open && cr.kind === "ford") out += '<div style="margin-top:4px;color:#8fb9d6;font-size:12px;">≈ Fording ' + (cr.name || "the river") + ' — slow, exposed</div>';
    else if (cr && !cr.open) out += '<div style="margin-top:4px;color:#f0a07d;font-size:12px;">≈ In the water — no crossing here (lay a pontoon)</div>';
  }
  return out;
}

/* ---- 2D render: the river band + fords + pontoon bridges (no-op when no river declared) ---- */
function fldEngDrawWater2d(ctx, v) {
  var t = (typeof __FIELD !== "undefined") ? __FIELD.terrain : null, rv = t && t.rivers;
  if (!rv || !rv.length) return;
  var reduce = (typeof fldReduceMotion === "function") && fldReduceMotion();
  for (var r = 0; r < rv.length; r++) {
    var rr = rv[r], pth = rr.path || [], hw = (rr.halfW || FLDE.RIVER_HALF) * v.s;
    if (pth.length < 2) continue;
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
    var tracePath = function () { ctx.beginPath(); for (var p = 0; p < pth.length; p++) { var X = v.ox + pth[p][0] * v.s, Z = v.oz + pth[p][1] * v.s; if (p === 0) ctx.moveTo(X, Z); else ctx.lineTo(X, Z); } };
    // dark bank halo, then the slate water body, then a lighter mid-current sheen (value contrast = CVD-safe)
    tracePath(); ctx.strokeStyle = "rgba(26,38,50,0.85)"; ctx.lineWidth = hw * 2 + 4 * v.s; ctx.stroke();
    tracePath(); ctx.strokeStyle = "rgba(58,84,109,0.95)"; ctx.lineWidth = hw * 2; ctx.stroke();
    tracePath(); ctx.strokeStyle = reduce ? "rgba(120,150,176,0.45)" : "rgba(132,164,190,0.55)"; ctx.lineWidth = Math.max(1, hw * 0.55); ctx.stroke();
    ctx.restore();
    var cs = rr.crossings || [];
    for (var c = 0; c < cs.length; c++) _fldDrawFord2d(ctx, v, cs[c], rr, hw);
  }
  var pp = (typeof __FIELD !== "undefined") ? (__FIELD.engPontoons || []) : [];
  for (var pi = 0; pi < pp.length; pi++) _fldDrawPontoon2d(ctx, v, pp[pi]);
}
function _fldDrawFord2d(ctx, v, cc, rr, hw) {
  if (cc.kind !== "ford" && cc.kind !== "bridge") return;
  var near = _fldRiverNearest(cc.x, cc.z, rr), nx = -near.dirz, nz = near.dirx;   // unit normal across the river
  var cx = v.ox + cc.x * v.s, cz = v.oz + cc.z * v.s, half = hw + 4 * v.s, open = (cc.kind === "bridge") || _fldFordOpen(cc);
  ctx.save();
  if (cc.kind === "bridge") {
    ctx.strokeStyle = "rgba(150,135,104,0.95)"; ctx.lineWidth = 9 * v.s;
    ctx.beginPath(); ctx.moveTo(cx - nx * half, cz - nz * half); ctx.lineTo(cx + nx * half, cz + nz * half); ctx.stroke();
  } else {
    // a ford = a paler shallow break across the band + stepping-stone dots; a CLOSED (deep) ford reads darker
    ctx.strokeStyle = open ? "rgba(150,176,196,0.7)" : "rgba(40,58,74,0.85)"; ctx.lineWidth = (open ? 8 : 6) * v.s;
    ctx.beginPath(); ctx.moveTo(cx - nx * half, cz - nz * half); ctx.lineTo(cx + nx * half, cz + nz * half); ctx.stroke();
    ctx.fillStyle = open ? "rgba(214,226,236,0.85)" : "rgba(96,116,134,0.6)";
    var dots = 5;
    for (var d = 0; d <= dots; d++) { var p = d / dots, sx = cx - nx * half + nx * (2 * half) * p, sz = cz - nz * half + nz * (2 * half) * p; ctx.beginPath(); ctx.arc(sx, sz, Math.max(1.2, 2.2 * v.s), 0, 7); ctx.fill(); }
  }
  ctx.restore();
  if (cc.name && typeof fld2dLabel === "function") fld2dLabel(ctx, cc.name + (cc.kind === "ford" && !open ? " (deep)" : ""), cx, cz - (half + 5));
}
function _fldDrawPontoon2d(ctx, v, pn) {
  var nx = -pn.rz, nz = pn.rx, cx = v.ox + pn.x * v.s, cz = v.oz + pn.z * v.s;
  var half = ((FLDE.RIVER_HALF) + 12) * v.s, frac = Math.min(1, pn.strength), done = pn.strength >= 1;
  ctx.save();
  // boats strung across the span (grow in as the bridge is laid)
  var boats = 6, span = 2 * half;
  ctx.fillStyle = "rgba(58,42,24," + (done ? 0.95 : 0.8) + ")";
  for (var b = 0; b <= boats; b++) {
    var p = b / boats; if (p > frac + 0.001) break;
    var sx = cx - nx * half + nx * span * p, sz = cz - nz * half + nz * span * p;
    ctx.save(); ctx.translate(sx, sz); ctx.rotate(Math.atan2(pn.rz, pn.rx));
    ctx.beginPath(); ctx.ellipse ? ctx.ellipse(0, 0, 7 * v.s, 3.4 * v.s, 0, 0, 7) : ctx.arc(0, 0, 5 * v.s, 0, 7); ctx.fill(); ctx.restore();
  }
  // the plank deck over the laid portion
  ctx.strokeStyle = done ? "rgba(176,150,104,0.97)" : "rgba(176,150,104,0.7)"; ctx.lineWidth = 5 * v.s;
  ctx.beginPath(); ctx.moveTo(cx - nx * half, cz - nz * half); ctx.lineTo(cx - nx * half + nx * (2 * half) * frac, cz - nz * half + nz * (2 * half) * frac); ctx.stroke();
  ctx.restore();
  if (typeof fld2dLabel === "function") fld2dLabel(ctx, done ? "Pontoon bridge" : ("Pontoon " + Math.round(frac * 100) + "%"), cx, cz - (half + 5));
}

/* ---- 2D render: a dirt parapet arc along the unit's front (toward its facing) ---- */
function fldEngDraw2d(ctx, v) {
  if (typeof __FIELD === "undefined" || !__FIELD.units) return;
  var obs = __FIELD.engObstacles || [];
  for (var oi = 0; oi < obs.length; oi++) {
    var a = obs[oi]; if (!(a.strength > 0.02)) continue;
    // fog: an enemy-owned belt whose builder is unscouted stays hidden (mirrors the entrenchment works)
    if (__FIELD.fog && a.side !== fldPlayerSide()) { var ab2 = (typeof fldById === "function") ? fldById(a.builderId) : null; if (ab2 && !fldVisible(fldPlayerSide(), ab2)) continue; }
    var x1 = v.ox + a.x1 * v.s, z1 = v.oz + a.z1 * v.s, x2 = v.ox + a.x2 * v.s, z2 = v.oz + a.z2 * v.s;
    var dx = x2 - x1, dz = z2 - z1, len = Math.max(1, Math.sqrt(dx * dx + dz * dz)), nx = -dz / len, nz = dx / len;
    ctx.save();
    ctx.strokeStyle = "rgba(46,31,18," + (0.45 + 0.5 * a.strength) + ")"; ctx.lineWidth = Math.max(2, 5 * v.s);
    ctx.beginPath(); ctx.moveTo(x1, z1); ctx.lineTo(x2, z2); ctx.stroke();
    ctx.strokeStyle = "rgba(189,155,101,0.95)"; ctx.lineWidth = Math.max(1, 1.5 * v.s);
    var stakes = 4 + Math.round(6 * a.strength);
    for (var si = 0; si <= stakes; si++) {
      var p = si / stakes, sx = x1 + dx * p, sz = z1 + dz * p, off = (si % 2 ? 8 : -8) * v.s * a.strength;
      ctx.beginPath(); ctx.moveTo(sx - nx * off, sz - nz * off); ctx.lineTo(sx + nx * off, sz + nz * off); ctx.stroke();
    }
    ctx.restore();
  }
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i];
    if (!u.alive || !(u.entrench > 0)) continue;
    if (__FIELD.fog && u.side !== fldPlayerSide() && !fldVisible(fldPlayerSide(), u)) continue;   // hidden enemy works
    var cx = v.ox + u.x * v.s, cz = v.oz + u.z * v.s;
    var frontW = (u.formation === "column" ? 36 : 96) * v.s * (0.5 + 0.5 * u.men / u.maxMen);
    var e = u.entrench;
    ctx.save(); ctx.translate(cx, cz); ctx.rotate(u.facing);
    // the parapet sits just in front of the block (front = -depth/2 side); height grows with progress
    var depth = (u.formation === "column" ? 60 : 26) * v.s;
    var y = -depth / 2 - 2 * v.s;
    var berm = (2 + 4 * e) * v.s;
    // earth body
    ctx.fillStyle = "rgba(74,56,33," + (0.55 + 0.35 * e) + ")";
    ctx.beginPath();
    ctx.moveTo(-frontW / 2, y);
    ctx.lineTo(frontW / 2, y);
    ctx.lineTo(frontW / 2, y - berm);
    ctx.lineTo(-frontW / 2, y - berm);
    ctx.closePath(); ctx.fill();
    // crest highlight (CVD-safe: shape + value, not color-only)
    ctx.strokeStyle = "rgba(150,124,82,0.9)"; ctx.lineWidth = Math.max(1, 1.4 * v.s);
    ctx.beginPath(); ctx.moveTo(-frontW / 2, y - berm); ctx.lineTo(frontW / 2, y - berm); ctx.stroke();
    // gabion/stake ticks along the crest grow in as the works mature
    var ticks = Math.round(3 + 5 * e);
    ctx.strokeStyle = "rgba(40,30,18,0.8)";
    for (var t = 0; t <= ticks; t++) {
      var tx = -frontW / 2 + (frontW * t / ticks);
      ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, y - berm); ctx.stroke();
    }
    ctx.restore();
  }
}

/* ---- 3D render: a low dirt berm in front of each entrenched unit (depth-correct,
   leak-managed: meshes are created lazily per unit and disposed when works fade) ---- */
function fld3dBuildEng() {
  if (typeof __FIELD === "undefined" || !window.THREE || !__FIELD.scene) return;
  var T = window.THREE;
  // D132: SELF-DISPOSE the prior phase's works group (its berm/abatis/pontoon geometries+materials are
  // children of _engGroup) before replacing it — so a 3D phase advance (fld3dRebuildPhaseScene re-calls
  // this) does not orphan their GPU buffers. Matches the self-disposing pattern of fld3dBuildUnits /
  // fld3dBuildOfficers / fld3dBuildSupply / fld3dBuildArms. Does NOT touch the water group (its own
  // dispose lives in fld3dBuildWater). Empty/null at battle start (init) -> byte-identical first call.
  if (__FIELD._engGroup) { _fld3dDisposeGroup(__FIELD._engGroup); if (__FIELD._engGroup.parent) __FIELD._engGroup.parent.remove(__FIELD._engGroup); }
  __FIELD._engGroup = new T.Group();
  __FIELD._engGroup.name = "engWorks";
  __FIELD._engMeshes = {};   // unitId -> { mesh, geo, mat, lvl }
  __FIELD._engAbatisMeshes = {}; // obstacleId -> { group, geo, mat, lvl }
  __FIELD._engPontoonMeshes = {}; // pontoonId -> { group, geo, mat, lvl }
  __FIELD.scene.add(__FIELD._engGroup);
}

/* ---- 3D static river water + fords (built once per 3D init, like walls/woods; no-op when no river) ---- */
function fld3dBuildWater() {
  if (typeof __FIELD === "undefined" || !window.THREE || !__FIELD.scene) return;
  // D132: dispose any PRIOR phase's river group FIRST — BEFORE the no-river early-return — so a 3D phase
  // advance into a sector with NO river (fld3dRebuildPhaseScene -> fld3dBuildTerrain re-calls this) clears
  // the old river instead of leaving it stale + leaked. (The dispose used to sit below the early-return,
  // so a river->no-river advance orphaned it.) Empty/null at init -> byte-identical first call.
  if (__FIELD._waterGroup) { _fld3dDisposeGroup(__FIELD._waterGroup); if (__FIELD._waterGroup.parent) __FIELD._waterGroup.parent.remove(__FIELD._waterGroup); __FIELD._waterGroup = null; }
  var t = __FIELD.terrain, rv = t && t.rivers; if (!rv || !rv.length) return;
  var T = window.THREE;
  __FIELD._waterGroup = new T.Group(); __FIELD._waterGroup.name = "rivers";
  var waterMat = new T.MeshLambertMaterial({ color: new T.Color("#3a566d"), transparent: true, opacity: 0.82 });
  for (var r = 0; r < rv.length; r++) {
    var rr = rv[r], pth = rr.path || [], hw = (rr.halfW || FLDE.RIVER_HALF);
    for (var p = 1; p < pth.length; p++) {
      var ax = pth[p - 1][0], az = pth[p - 1][1], bx = pth[p][0], bz = pth[p][1];
      var dx = bx - ax, dz = bz - az, len = Math.sqrt(dx * dx + dz * dz); if (len < 1) continue;
      // a thin sheet sitting ON the ground (the opaque terrain is at fldTerrainH; the walls/objective/abatis all sit
      // ABOVE it). Center +0.3 with half-height 0.5 -> top at terrainH+0.8, so the translucent water actually shows.
      var seg = new T.Mesh(new T.BoxGeometry(len + hw, 1.0, hw * 2), waterMat);
      var mx = (ax + bx) / 2, mz = (az + bz) / 2;
      seg.position.set(mx, fldTerrainH(mx, mz) + 0.3, mz); seg.rotation.y = -Math.atan2(dz, dx);
      seg.receiveShadow = true; __FIELD._waterGroup.add(seg);
    }
    // fords: a paler shallow strip across the band, lifted clear of the heightfield so it neither buries nor z-fights
    var cs = rr.crossings || [];
    for (var c = 0; c < cs.length; c++) {
      var cc = cs[c]; if (cc.kind !== "ford") continue;
      var near = _fldRiverNearest(cc.x, cc.z, rr), open = _fldFordOpen(cc);
      var fmat = new T.MeshLambertMaterial({ color: new T.Color(open ? "#7e98ac" : "#26384a"), transparent: true, opacity: open ? 0.9 : 0.85 });
      var fseg = new T.Mesh(new T.BoxGeometry(28, 0.8, hw * 2 + 8), fmat);
      fseg.position.set(cc.x, fldTerrainH(cc.x, cc.z) + 0.7, cc.z);   // bottom ~terrainH+0.3, clear of the ground
      fseg.rotation.y = -Math.atan2(near.dirz, near.dirx); __FIELD._waterGroup.add(fseg);
    }
  }
  __FIELD.scene.add(__FIELD._waterGroup);
}
function _fld3dDisposeGroup(g) {
  if (!g || !g.traverse) return;
  g.traverse(function (o) {
    if (o.geometry && o.geometry.dispose) o.geometry.dispose();
    if (o.material) { var m = o.material; if (Array.isArray(m)) { for (var i = 0; i < m.length; i++) m[i] && m[i].dispose && m[i].dispose(); } else if (m.dispose) m.dispose(); }
  });
}

function _fld3dEngDisposeOne(rec) {
  try {
    if (!rec) return;
    if (rec.mesh && __FIELD._engGroup) __FIELD._engGroup.remove(rec.mesh);
    if (rec.geo && rec.geo.dispose) rec.geo.dispose();
    if (rec.mat && rec.mat.dispose) rec.mat.dispose();
  } catch (e) {}
}

function _fld3dEngDisposeAbatis(rec) {
  try {
    if (!rec) return;
    if (rec.group && __FIELD._engGroup) __FIELD._engGroup.remove(rec.group);
    if (rec.geo && rec.geo.dispose) rec.geo.dispose();
    if (rec.mat && rec.mat.dispose) rec.mat.dispose();
  } catch (e) {}
}

/* a pontoon group holds several distinct geometries/materials (deck + boats), so dispose the WHOLE
   group by traversal (not just the stored deck geo/mat) to keep it leak-clean. */
function _fld3dEngDisposePontoon(rec) {
  try {
    if (!rec) return;
    if (rec.group && __FIELD._engGroup) __FIELD._engGroup.remove(rec.group);
    if (typeof _fld3dDisposeGroup === "function") _fld3dDisposeGroup(rec.group);
  } catch (e) {}
}

function fld3dSyncEng() {
  if (typeof __FIELD === "undefined" || !window.THREE || !__FIELD._engGroup) return;
  var T = window.THREE, meshes = __FIELD._engMeshes || (__FIELD._engMeshes = {});
  // mark all stale; refresh those that should exist
  var keep = {};
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i];
    if (!u.alive || !(u.entrench > 0.02)) continue;
    keep[u.id] = 1;
    var lvl = Math.round(u.entrench * 20) / 20;   // quantize so we only rebuild geometry on a real change
    var frontW = (u.formation === "column" ? 40 : 100);   // match the unit slab frontage (BoxGeometry 96 wide)
    var hgt = 4 + 10 * u.entrench;                          // parapet height: 4 -> 14 (the slab is 8 tall)
    var depthB = 6 + 8 * u.entrench;                        // earthwork thickness
    var rec = meshes[u.id];
    if (!rec || rec.lvl !== lvl) {
      _fld3dEngDisposeOne(rec);
      var geo = new T.BoxGeometry(frontW, hgt, depthB);
      var mat = new T.MeshStandardMaterial({ color: new T.Color("#5a4326"), roughness: 0.97, metalness: 0.0, flatShading: true });
      var mesh = new T.Mesh(geo, mat);
      mesh.castShadow = false; mesh.receiveShadow = true;
      __FIELD._engGroup.add(mesh);
      rec = meshes[u.id] = { mesh: mesh, geo: geo, mat: mat, lvl: lvl };
    }
    // place the berm just in front of the unit, along its facing (forward world = (sin f, -cos f))
    var slabHalf = (u.formation === "column" ? 29 : 13);
    var fwd = slabHalf + depthB * 0.5 + 3;
    var px = u.x + Math.sin(u.facing) * fwd, pz = u.z - Math.cos(u.facing) * fwd;
    var gy = (typeof fldTerrainH === "function") ? fldTerrainH(px, pz) : 0;
    rec.mesh.position.set(px, gy + hgt / 2, pz);
    rec.mesh.rotation.y = -u.facing;
    var hidden = (__FIELD.fog && u.side !== fldPlayerSide() && !fldVisible(fldPlayerSide(), u));   // hidden enemy works
    rec.mesh.visible = !hidden;
  }
  // dispose works whose unit is gone / no longer entrenched
  for (var id in meshes) {
    if (!Object.prototype.hasOwnProperty.call(meshes, id)) continue;
    if (!keep[id]) { _fld3dEngDisposeOne(meshes[id]); delete meshes[id]; }
  }
  // Abatis: low-poly crossed timber, rebuilt only when its quantized completion changes.
  var am = __FIELD._engAbatisMeshes || (__FIELD._engAbatisMeshes = {}), akeep = {}, obs = __FIELD.engObstacles || [];
  for (var ai = 0; ai < obs.length; ai++) {
    var a = obs[ai]; if (!(a.strength > 0.02)) continue;
    akeep[a.id] = 1;
    var alvl = Math.round(a.strength * 10) / 10, ar = am[a.id];
    if (!ar || ar.lvl !== alvl) {
      _fld3dEngDisposeAbatis(ar);
      var ag = new T.Group(), ageo = new T.BoxGeometry(20, 3.2, 3.2);
      var amat = new T.MeshStandardMaterial({ color: new T.Color("#4d321c"), roughness: 1, metalness: 0, flatShading: true });
      var count = (typeof fldLow === "function" && fldLow()) ? 6 : 11;
      for (var s = 0; s < count; s++) {
        var branch = new T.Mesh(ageo, amat), p = count === 1 ? 0.5 : s / (count - 1);
        branch.position.set((p - 0.5) * 124, 3 + (s % 3), (s % 2 ? 5 : -5) * a.strength);
        branch.rotation.z = (s % 2 ? 0.62 : -0.62); branch.rotation.y = (s % 3 - 1) * 0.42;
        branch.castShadow = false; branch.receiveShadow = true; ag.add(branch);
      }
      __FIELD._engGroup.add(ag); ar = am[a.id] = { group: ag, geo: ageo, mat: amat, lvl: alvl };
    }
    var acx = (a.x1 + a.x2) / 2, acz = (a.z1 + a.z2) / 2;
    ar.group.position.set(acx, fldTerrainH(acx, acz) + 1.5, acz);
    ar.group.rotation.y = -Math.atan2(a.z2 - a.z1, a.x2 - a.x1);
    // fog: hide an enemy-owned belt whose builder is unscouted (mirrors the 3D entrenchment works)
    var aHidden = (__FIELD.fog && a.side !== fldPlayerSide()); if (aHidden) { var ab3 = (typeof fldById === "function") ? fldById(a.builderId) : null; aHidden = !!(ab3 && !fldVisible(fldPlayerSide(), ab3)); }
    ar.group.visible = !aHidden;
  }
  for (var aid in am) {
    if (!Object.prototype.hasOwnProperty.call(am, aid)) continue;
    if (!akeep[aid]) { _fld3dEngDisposeAbatis(am[aid]); delete am[aid]; }
  }
  // Pontoon bridges: a tan plank deck on boat floats across the river, rebuilt only as the lay advances.
  var pm = __FIELD._engPontoonMeshes || (__FIELD._engPontoonMeshes = {}), pkeep = {}, pp = __FIELD.engPontoons || [];
  for (var ppi = 0; ppi < pp.length; ppi++) {
    var pn = pp[ppi]; if (!(pn.strength > 0.02)) continue;
    pkeep[pn.id] = 1;
    var plvl = Math.round(pn.strength * 10) / 10, pr = pm[pn.id];
    if (!pr || pr.lvl !== plvl) {
      _fld3dEngDisposePontoon(pr);   // deck + boats are distinct geos/mats -> traversal dispose
      var pg = new T.Group();
      var span = (FLDE.RIVER_HALF + 12) * 2, frac = Math.min(1, pn.strength), laid = span * frac;
      var deckGeo = new T.BoxGeometry(Math.max(2, laid), 2.2, 9);
      var deckMat = new T.MeshStandardMaterial({ color: new T.Color("#b09668"), roughness: 0.9, metalness: 0, flatShading: true });
      var deck = new T.Mesh(deckGeo, deckMat); deck.position.set(-span / 2 + laid / 2, 2.4, 0); deck.receiveShadow = true; pg.add(deck);
      var boatGeo = new T.BoxGeometry(7, 3, 13), boatMat = new T.MeshStandardMaterial({ color: new T.Color("#3a2a18"), roughness: 1, metalness: 0, flatShading: true });
      var boatN = (typeof fldLow === "function" && fldLow()) ? 4 : 7;
      for (var bb = 0; bb <= boatN; bb++) { var bp = bb / boatN; if (bp > frac + 0.001) break; var boat = new T.Mesh(boatGeo, boatMat); boat.position.set(-span / 2 + span * bp, 0.6, 0); pg.add(boat); }
      __FIELD._engGroup.add(pg); pr = pm[pn.id] = { group: pg, geo: deckGeo, mat: deckMat, lvl: plvl };
    }
    pr.group.position.set(pn.x, fldTerrainH(pn.x, pn.z) + 0.2, pn.z);   // boats float at the waterline; the deck rides above
    pr.group.rotation.y = -Math.atan2(pn.rz, pn.rx);
  }
  for (var pid in pm) {
    if (!Object.prototype.hasOwnProperty.call(pm, pid)) continue;
    if (!pkeep[pid]) { _fld3dEngDisposePontoon(pm[pid]); delete pm[pid]; }
  }
}

function fld3dDisposeEng() {
  if (typeof __FIELD === "undefined") return;
  var meshes = __FIELD._engMeshes || {};
  for (var id in meshes) { if (Object.prototype.hasOwnProperty.call(meshes, id)) _fld3dEngDisposeOne(meshes[id]); }
  __FIELD._engMeshes = {};
  var am = __FIELD._engAbatisMeshes || {};
  for (var aid in am) { if (Object.prototype.hasOwnProperty.call(am, aid)) _fld3dEngDisposeAbatis(am[aid]); }
  __FIELD._engAbatisMeshes = {};
  var pm = __FIELD._engPontoonMeshes || {};
  for (var pid in pm) { if (Object.prototype.hasOwnProperty.call(pm, pid)) _fld3dEngDisposePontoon(pm[pid]); }
  __FIELD._engPontoonMeshes = {};
  if (__FIELD._engGroup && __FIELD._engGroup.parent) __FIELD._engGroup.parent.remove(__FIELD._engGroup);
  __FIELD._engGroup = null;
  // INCREMENT 3: the static river water group (added straight to the scene like walls/woods)
  if (__FIELD._waterGroup) { if (typeof _fld3dDisposeGroup === "function") _fld3dDisposeGroup(__FIELD._waterGroup); if (__FIELD._waterGroup.parent) __FIELD._waterGroup.parent.remove(__FIELD._waterGroup); __FIELD._waterGroup = null; }
}

function fldEngEndHtml() {
  var used = __FIELD._engUsed;
  if (!used || (!used.abatis && !used.pontoon)) return "";
  var out = "";
  if (used.abatis) out += _fldEngCard(
    "The axe beside the spade",
    "An abatis was not a magical wall: felled trees were laid with sharpened branches toward the attacker, breaking formation and holding troops under fire. Axemen could open a lane, but clearing took time and exposed the working party. The game models that friction as slow movement, temporary disorder, and deliberate clearance—not extra casualties from the timber itself.",
    "Verified (high): Dennis Hart Mahan, <i>A Treatise on Field Fortification</i> (1861), obstacle and abatis construction; U.S. War Department engineering practice.");
  if (used.pontoon) out += _fldEngCard(
    "The pontoon train",
    "A river funneled an army to fords and bridges. Too deep to wade, and infantry, guns, and wagons simply stopped — Burnside's army stalled for days at the Rappahannock waiting on delayed pontoon trains, giving Lee time to dig in. Where no ford served, engineers had to lay a floating bridge: slow work and deadly — at Fredericksburg the 50th New York Engineers built under Barksdale's musket fire. Done right it was decisive: in June 1864 engineers spanned the James with a bridge roughly 2,100 feet long, the war's longest, slipping Grant's army across toward Petersburg.",
    "Verified (high): NPS, &ldquo;Delay Crossing the Rappahannock&rdquo; &amp; Fredericksburg crossing history; <i>Battle of Fredericksburg</i> (50th NY Engineers, Spaulding); Encyclopedia Virginia, James River crossing (June 14–15, 1864, ~2,100 ft).");
  return out;
}
function _fldEngCard(head, body, prov) {
  return '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:6px;">' + head + '</div>' +
    '<div style="font-size:12.5px;opacity:.88;line-height:1.48;">' + body + '</div>' +
    '<div style="font-size:11px;opacity:.62;margin-top:4px;">' + prov + '</div></div>';
}
