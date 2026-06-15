/* ============================================================================
   src/tactical/T0-field-sandbox.js  —  TACTICAL ENGINE · P0 (the SANDBOX skirmish)

   The FIRST real-time, gridless, UG:G-style tactical layer. Per the run-k charter
   (DECISIONS D54/D55) the real-time tactical engine is now PRIORITIZED ahead of
   S3–S5, built BOTH as a gridless real-time engine AND (later) as a selectable
   hex mode, with Classic frozen and never regressed.

   THIS milestone = P0, a SANDBOX skirmish first: ~2 brigades/side, one procedural
   terrain, the full core loop  deploy -> drag-maneuver + facing -> line/column ->
   fire -> morale/rout/rally -> charge -> win/lose  — to PROVE THE LOOP on a real
   3D field, before scaling to the First Bull Run vertical slice.

   ARCHITECTURE (decided + logged as D56):
   - SIBLING engine, NOT a mutation of the hex-bound __M3D 3D re-skin. __FIELD owns
     its own THREE scene + camera + RAF loop + full-screen DOM root, completely off
     the Classic / __M3D code path  ->  ZERO regression risk. It reuses the SAME
     three@0.128 stack (via the base _m3dLoadScripts loader) + the same sunlit-field
     art direction; deeper PBR/HDRI/post-FX reuse is deferred to P1+.
   - RENDERER-AGNOSTIC sim: the sim state is pure data. A 3D renderer draws it when
     THREE loads; a 2D top-down canvas renderer draws it when THREE is unavailable
     (offline) -> satisfies D54's mandatory offline procedural fallback.
   - ADDITIVE launch: a MutationObserver injects a "Tactical Sandbox" button into the
     main-menu grid (no override of openMainMenu). fldLaunchSandbox() is also global
     so probes can drive it headlessly.
   - Combat formulas are PORTED from the base engine (moraleCheck / resolveFire /
     resolveCharge, base.html ~1015-1086; ratings _OVR_WEIGHTS ~10126) — not
     reinvented — then adapted to continuous, positional, per-tick resolution.
   - Seeded RNG (fldRng) so probes run reproducibly + balance is tunable.

   Bare-name globals only (G, WEAPONS, ARM, _m3dLoadScripts, toast); window.THREE is
   the loaded lib. All helpers are uniquely prefixed `fld` to satisfy the collision
   gate. THREE is referenced ONLY inside runtime fns (it loads async). No literal
   comment-closer inside this block.
   ============================================================================ */

var __FIELD = {
  launched: false, phase: "idle",   // idle | deploy | battle | over
  mode3d: false, renderer: null, scene: null, camera: null, controls: null, raf: 0,
  cv2d: null, ctx2d: null, root: null,
  units: [], terrain: null, objective: null,
  t: 0, winner: null, speed: 1, paused: false, acc: 0, last: 0,
  seed: 1, sel: [], drag: null, hover: null, holdSecs: { US: 0, CS: 0 },
  routEverCount: 0, autoBoth: false, rendererKind: "3d", figures: 24,
  groups: null, _ro: null, _obsInstalled: false,
};

/* ---- tunable constants (seeded from the base WEAPONS/ARM tables + tuned via probe) ---- */
var FLD = {
  FIELD_W: 1200, FIELD_H: 900,          // yards (x by z)
  FIXED_DT: 0.05,                        // 20 Hz sim
  TIME_LIMIT: 480,                       // sim-seconds (8 min) -> objective decides
  HOLD_TO_WIN: 45,                       // continuous objective hold (s) -> win
  OBJ_R: 130,                            // objective control radius (yd)
  // movement (yd/s, sim-time)
  SPD_LINE: 30, SPD_COL: 48, SPD_ROUT: 62, ARRIVE: 14, TURN_RATE: 2.4, // rad/s
  // fire
  FIRE_BASE: 3.2,                        // peak cas/s, full-strength rifle brigade, close. Primary fight-length knob;
                                         // tuned so the maneuver->firefight->rout-cascade loop runs ~90s at 1x.
  RANGE_RIFLE: 320, RANGE_SMOOTH: 130, RANGE_ART: 980, RANGE_CARB: 240,
  FALLOFF: 0.55,                         // fraction of fire at max range
  // melee / charge
  CONTACT_R: 30, MELEE_BASE: 9.0,
  // morale (moraleCheck shape: drop ~ sev*60/rally)
  ROUT_THRESH: 18, RALLY_R: 240, RALLY_SECS: 6,
  MOR_RECOVER: 2.2,                      // /s when safe
  // ambient morale pressure (/s)
  P_UNDERFIRE: 1.1, P_FLANKED: 2.0, P_FRIENDROUT: 1.6, P_LOWAMMO: 0.7, P_FATIGUE: 0.9,
  FATIGUE_MARCH: 1.5, FATIGUE_FIGHT: 2.4, FATIGUE_REST: 3.0, // /s
  AMMO_DRAIN: 0.9,                       // /s of sustained fire (ammo is 0..100)
  AI_HZ: 2.5,
};

/* ---- seeded RNG (LCG) ---- */
function fldRng() {
  __FIELD.seed = (__FIELD.seed * 1664525 + 1013904223) % 4294967296;
  return __FIELD.seed / 4294967296;
}
function fldClamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function fldDist(a, b) { var dx = a.x - b.x, dz = a.z - b.z; return Math.sqrt(dx * dx + dz * dz); }
function fldAngDiff(a, b) { var d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
function fldEnemy(side) { return side === "US" ? "CS" : "US"; }
function fldReduceMotion() { try { return !!(G && G.settings && G.settings.reduceMotion); } catch (e) { return false; } }

/* ---- weapon profile (effective range + power) from the base WEAPONS table when present ---- */
function fldWeaponProfile(key, arm) {
  var pow = 1.0, rng = FLD.RANGE_RIFLE;
  try {
    if (typeof WEAPONS !== "undefined" && WEAPONS[key]) { pow = WEAPONS[key].pow || 1.0; }
  } catch (e) {}
  if (arm === "art") rng = FLD.RANGE_ART;
  else if (arm === "cav") rng = FLD.RANGE_CARB;
  else if (key === "smooth") rng = FLD.RANGE_SMOOTH;
  else rng = FLD.RANGE_RIFLE;
  return { pow: pow, rng: rng };
}

/* ===========================================================================
   TERRAIN  (procedural; shared by sim + both renderers)
   =========================================================================== */
function fldBuildTerrain() {
  var ox = FLD.FIELD_W / 2, oz = FLD.FIELD_H / 2;
  __FIELD.objective = { x: ox, z: oz, r: FLD.OBJ_R };
  __FIELD.terrain = {
    hill: { x: ox, z: oz, h: 26, s: 220 },                 // gentle rise crowning the objective
    woods: [{ x: ox - 290, z: oz + 30, r: 170 }, { x: ox + 320, z: oz - 90, r: 130 }],
    wall: { x1: ox - 110, z1: oz - 70, x2: ox + 120, z2: oz - 70 }, // a stone wall north of the crest
  };
}
function fldTerrainH(x, z) {
  var t = __FIELD.terrain; if (!t) return 0;
  var dx = x - t.hill.x, dz = z - t.hill.z, r2 = dx * dx + dz * dz;
  var h = t.hill.h * Math.exp(-r2 / (2 * t.hill.s * t.hill.s));
  h += Math.sin(x * 0.012) * 2.2 + Math.cos(z * 0.015) * 2.0; // gentle undulation
  return h;
}
function fldInWoods(x, z) {
  var t = __FIELD.terrain; if (!t) return false;
  for (var i = 0; i < t.woods.length; i++) { var w = t.woods[i]; var dx = x - w.x, dz = z - w.z; if (dx * dx + dz * dz < w.r * w.r) return true; }
  return false;
}
function fldNearWall(x, z) {
  var t = __FIELD.terrain; if (!t || !t.wall) return false;
  var w = t.wall, dx = w.x2 - w.x1, dz = w.z2 - w.z1, L2 = dx * dx + dz * dz;
  var tt = L2 ? fldClamp(((x - w.x1) * dx + (z - w.z1) * dz) / L2, 0, 1) : 0;
  var px = w.x1 + tt * dx, pz = w.z1 + tt * dz, ex = x - px, ez = z - pz;
  return (ex * ex + ez * ez) < 26 * 26;
}
// cover def multiplier (higher = safer); mirrors the base TERRAIN .def ladder spirit.
function fldCoverAt(x, z) {
  var d = 1.0;
  if (fldNearWall(x, z)) d = 1.7;
  else if (fldInWoods(x, z)) d = 1.4;
  var t = __FIELD.terrain;
  if (t) { var dx = x - t.hill.x, dz = z - t.hill.z; if (dx * dx + dz * dz < (t.hill.s * 0.7) * (t.hill.s * 0.7)) d *= 1.12; }
  return d;
}
function fldMoveFactor(x, z) { return fldInWoods(x, z) ? 0.62 : 1.0; }

/* ===========================================================================
   SIM SETUP  —  the P0 sandbox order of battle (2 brigades/side)
   =========================================================================== */
function fldMakeUnit(o) {
  var prof = fldWeaponProfile(o.weapon, o.arm || "inf");
  return {
    id: o.id, side: o.side, name: o.name, arm: o.arm || "inf", weapon: o.weapon,
    pow: prof.pow, rng: prof.rng, xp: o.xp || 1,
    x: o.x, z: o.z, facing: o.facing, formation: o.formation || "line",
    men: o.men, maxMen: o.men, morale: o.morale || 78, maxMor: o.morale || 78,
    fatigue: 0, ammo: 100, state: "steady",
    order: { type: "hold", tx: o.x, tz: o.z, tface: o.facing },
    targetId: null, reload: 0, rallyT: 0, ai: !!o.ai, alive: true,
    casTick: 0, underFire: 0, flankHit: 0,
  };
}
function fldInitSim(opts) {
  opts = opts || {};
  __FIELD.seed = (opts.seed || 1) >>> 0;
  fldBuildTerrain();
  var ox = FLD.FIELD_W / 2, t = __FIELD.terrain;
  var south = FLD.FIELD_H - 150, north = 150;       // US deploys south, CS north
  // facing convention is atan2(dx, -dz): 0 = north (-z), PI = south (+z). US faces north toward
  // the center, CS faces south — so each brigade's TRUE front is toward the enemy (front = 1.0x fire).
  var faceN = 0, faceS = Math.PI;
  var pAI = !!opts.autoBoth;                          // probe / demo: both sides AI
  __FIELD.autoBoth = pAI;
  __FIELD.units = [
    fldMakeUnit({ id: "US1", side: "US", name: "1st Brigade", arm: "inf", weapon: "spring", xp: 1, men: 1500, x: ox - 170, z: south, facing: faceN, ai: pAI }),
    fldMakeUnit({ id: "US2", side: "US", name: "2nd Brigade", arm: "inf", weapon: "rifled", xp: 2, men: 1400, x: ox + 170, z: south, facing: faceN, ai: pAI }),
    fldMakeUnit({ id: "CS1", side: "CS", name: "Jackson's Brigade", arm: "inf", weapon: "rifled", xp: 2, men: 1500, x: ox - 160, z: north, facing: faceS, ai: true }),
    fldMakeUnit({ id: "CS2", side: "CS", name: "Bee's Brigade", arm: "inf", weapon: "smooth", xp: 1, men: 1400, x: ox + 160, z: north, facing: faceS, ai: true }),
  ];
  __FIELD.t = 0; __FIELD.winner = null; __FIELD.holdSecs = { US: 0, CS: 0 };
  __FIELD.routEverCount = 0; __FIELD.sel = []; __FIELD.drag = null;
  __FIELD.phase = "deploy"; __FIELD.paused = true; __FIELD.speed = 1; __FIELD.acc = 0;
  _fldAiClock = 0; _fldAiIdx = 0;   // reset the AI cadence so every launch is deterministic
}

/* ===========================================================================
   COMBAT  (ported from base resolveFire / resolveCharge / moraleCheck)
   =========================================================================== */
function fldFrontageExposed(shooter, tgt) {
  // a line target presents its broad front; a column presents a thin column.
  // flank/rear of either is fully exposed. bearing = from tgt to shooter.
  var bearing = Math.atan2(shooter.x - tgt.x, -(shooter.z - tgt.z)); // match facing convention below
  var rel = Math.abs(fldAngDiff(bearing, tgt.facing));               // 0 = shooter is in front
  var arc; // multiplier
  if (rel > Math.PI * 0.72) arc = 2.0;        // rear
  else if (rel > Math.PI * 0.28) arc = 1.5;   // flank
  else arc = 1.0;                              // front
  // a column is a narrow head-on target (0.7) but a fat one when enfiladed from flank/rear (1.4)
  var frontW = tgt.formation === "column" ? (arc > 1.0 ? 1.4 : 0.7) : 1.0;
  return { mult: arc, frontW: frontW, isFlank: arc > 1.0 };
}
// continuous fire: shooter at target for this tick (dt seconds).
function fldResolveFire(u, tgt, dt) {
  if (!u.alive || !tgt.alive || u.state === "routing" || u.men <= 0 || u.ammo <= 0) return;
  var d = fldDist(u, tgt); if (d > u.rng) return;
  // range falloff: full near, FALLOFF at max range
  var rngF = fldClamp(1 - (d / u.rng) * (1 - FLD.FALLOFF), FLD.FALLOFF, 1);
  var strF = u.men / 1500;
  var xpF = 0.85 + u.xp * 0.05;                        // base resolveFire xpF
  var ammoF = fldClamp(0.5 + 0.5 * (u.ammo / 100), 0.5, 1);   // fire tapers as the cartridge boxes empty
  var morF = 0.6 + 0.4 * (u.morale / u.maxMor);
  var fatF = 1 - (u.fatigue / 100) * 0.35;
  var fr = fldFrontageExposed(u, tgt);
  var cover = fldCoverAt(tgt.x, tgt.z);
  var power = FLD.FIRE_BASE * strF * u.pow * rngF * xpF * ammoF * morF * fatF;
  var cas = power * fr.mult * fr.frontW / cover * (0.78 + fldRng() * 0.44) * dt;
  cas = Math.min(cas, tgt.men);
  if (cas <= 0) return;
  tgt.men -= cas; tgt.casTick += cas; tgt.underFire = 1.2;
  if (fr.isFlank) tgt.flankHit = 1.0;
  u.ammo = Math.max(0, u.ammo - FLD.AMMO_DRAIN * dt);
  u.fatigue = Math.min(100, u.fatigue + FLD.FATIGUE_FIGHT * 0.4 * dt);
  if (tgt.men <= 0) fldKill(tgt);
}
// continuous melee when blocks are in contact.
function fldResolveMelee(a, b, dt) {
  if (!a.alive || !b.alive) return;
  var meleeA = (typeof ARM !== "undefined" && ARM[a.arm] ? ARM[a.arm].melee : 1.0);
  var meleeB = (typeof ARM !== "undefined" && ARM[b.arm] ? ARM[b.arm].melee : 1.0);
  var atk = a.men * meleeA * (0.6 + 0.4 * a.morale / a.maxMor) * (0.9 + a.xp * 0.06);
  var def = b.men * meleeB * (0.6 + 0.4 * b.morale / b.maxMor) * (0.9 + b.xp * 0.06) * fldCoverAt(b.x, b.z);
  var ratio = atk / Math.max(1, def);
  var aCas = Math.min(a.men, FLD.MELEE_BASE * (def / Math.max(1, atk)) * (0.7 + fldRng() * 0.6) * dt * 12);
  var bCas = Math.min(b.men, FLD.MELEE_BASE * (atk / Math.max(1, def)) * (0.7 + fldRng() * 0.6) * dt * 12);
  a.men -= aCas; b.men -= bCas; a.casTick += aCas; b.casTick += bCas;
  a.fatigue = Math.min(100, a.fatigue + FLD.FATIGUE_FIGHT * dt);
  b.fatigue = Math.min(100, b.fatigue + FLD.FATIGUE_FIGHT * dt);
  if (a.men <= 0) fldKill(a); if (b.men <= 0) fldKill(b);
  // the loser of the melee ratio takes a sharp morale shock
  if (ratio < 0.85) a.morale -= 9 * dt * 5; else if (ratio > 1.18) b.morale -= 9 * dt * 5;
}
function fldKill(u) {
  if (!u.alive) return;
  u.alive = false; u.men = 0; u.state = "destroyed";
  fldAnnounce(u.name + " is destroyed.");
}
// moraleCheck shape (base ~1015): drop ~ sev*60/rally; rout when below threshold.
function fldMoraleStep(u, dt) {
  if (!u.alive) return;
  var rally = 1 + u.xp * 0.12;                          // leader/veteran rally proxy
  // (1) casualties taken this tick
  if (u.casTick > 0) { var sev = u.casTick / u.maxMen; u.morale -= (sev * 60 / rally); u.casTick = 0; }
  // (2) ambient pressure
  if (u.underFire > 0) { u.morale -= FLD.P_UNDERFIRE * dt; u.underFire -= dt; }
  if (u.flankHit > 0) { u.morale -= FLD.P_FLANKED * dt; u.flankHit -= dt; }
  if (u.ammo < 18) u.morale -= FLD.P_LOWAMMO * dt;
  if (u.fatigue > 60) u.morale -= FLD.P_FATIGUE * dt;
  // friendly routing nearby
  for (var i = 0; i < __FIELD.units.length; i++) {
    var f = __FIELD.units[i];
    if (f === u || f.side !== u.side || !f.alive || f.state !== "routing") continue;
    if (fldDist(f, u) < 200) { u.morale -= FLD.P_FRIENDROUT * dt; break; }
  }
  // (3) recovery when safe (no enemy within rifle range, not routing)
  if (u.state !== "routing" && u.underFire <= 0) {
    var safe = true;
    for (var j = 0; j < __FIELD.units.length; j++) {
      var e = __FIELD.units[j];
      if (e.side === u.side || !e.alive) continue;
      if (fldDist(e, u) < FLD.RANGE_RIFLE * 0.9) { safe = false; break; }
    }
    if (safe) u.morale += FLD.MOR_RECOVER * dt;
  }
  u.morale = fldClamp(u.morale, 0, u.maxMor);
  // (4) state machine + rout roll
  var routThresh = FLD.ROUT_THRESH - u.xp * 1.5;       // veterans hold longer (base)
  if (u.state === "routing") {
    // rally if it reached safety + held for RALLY_SECS
    var danger = false;
    for (var k = 0; k < __FIELD.units.length; k++) {
      var en = __FIELD.units[k];
      if (en.side === u.side || !en.alive) continue;
      if (fldDist(en, u) < FLD.RALLY_R) { danger = true; break; }
    }
    if (!danger) { u.rallyT += dt; if (u.rallyT >= FLD.RALLY_SECS) { u.state = "wavering"; u.morale = Math.max(u.morale, 30); u.rallyT = 0; fldAnnounce(u.name + " rallies."); } }
    else u.rallyT = 0;
    return;
  }
  if (u.morale < routThresh) {
    var save = 0.5 * rally;
    if (fldRng() > save) { u.state = "routing"; u.rallyT = 0; __FIELD.routEverCount++; fldAnnounce(u.name + " breaks and routs!"); return; }
  }
  u.state = u.morale > 55 ? "steady" : (u.morale > 35 ? "shaken" : "wavering");
}

/* ===========================================================================
   MOVEMENT + ORDERS
   =========================================================================== */
function fldHomeEdgeZ(side) { return side === "US" ? FLD.FIELD_H + 60 : -60; }
function fldStepMovement(u, dt) {
  if (!u.alive) return;
  var tx, tz, spd, desiredFace;
  if (u.state === "routing") {
    tx = u.x; tz = fldHomeEdgeZ(u.side); spd = FLD.SPD_ROUT;
    desiredFace = Math.atan2(0, -(tz - u.z));
  } else {
    var o = u.order;
    tx = o.tx; tz = o.tz;
    var col = u.formation === "column";
    spd = (col ? FLD.SPD_COL : FLD.SPD_LINE) * (1 - (u.fatigue / 100) * 0.4) * fldMoveFactor(u.x, u.z);
    desiredFace = (typeof o.tface === "number") ? o.tface : u.facing;
  }
  var dx = tx - u.x, dz = tz - u.z, dd = Math.sqrt(dx * dx + dz * dz);
  var moving = dd > FLD.ARRIVE;
  if (moving) {
    var mvFace = Math.atan2(dx, -dz);
    var nx = u.x + (dx / dd) * spd * dt, nz = u.z + (dz / dd) * spd * dt;
    u.x = fldClamp(nx, 10, FLD.FIELD_W - 10);
    u.z = fldClamp(nz, -80, FLD.FIELD_H + 80);
    // face along travel while marching
    u.facing += fldClamp(fldAngDiff(mvFace, u.facing), -FLD.TURN_RATE * dt, FLD.TURN_RATE * dt);
    u.fatigue = Math.min(100, u.fatigue + FLD.FATIGUE_MARCH * dt);
  } else {
    // arrived: settle to ordered facing; rest recovers fatigue
    if (u.state !== "routing") {
      u.facing += fldClamp(fldAngDiff(desiredFace, u.facing), -FLD.TURN_RATE * dt, FLD.TURN_RATE * dt);
      u.fatigue = Math.max(0, u.fatigue - FLD.FATIGUE_REST * dt);
      if (u.order.type === "move") u.order.type = "hold";
    }
  }
}
function fldOrderMove(u, tx, tz, tface) {
  if (!u.alive || u.state === "routing") return;
  u.order = { type: "move", tx: tx, tz: tz, tface: (typeof tface === "number") ? tface : u.facing };
}
function fldOrderCharge(u) {
  if (!u.alive || u.state === "routing") return;
  var best = null, bd = 1e9;
  for (var i = 0; i < __FIELD.units.length; i++) { var e = __FIELD.units[i]; if (e.side === u.side || !e.alive) continue; var d = fldDist(u, e); if (d < bd) { bd = d; best = e; } }
  if (best) { var face = Math.atan2(best.x - u.x, -(best.z - u.z)); u.order = { type: "charge", tx: best.x, tz: best.z, tface: face }; }
}

/* ===========================================================================
   TARGETING + AI
   =========================================================================== */
function fldAcquireTarget(u) {
  if (!u.alive || u.state === "routing" || u.ammo <= 0) { u.targetId = null; return; }
  var best = null, score = -1;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var e = __FIELD.units[i]; if (e.side === u.side || !e.alive) continue;
    var d = fldDist(u, e); if (d > u.rng) continue;
    // prefer closer + weaker + flank-exposed targets
    var fr = fldFrontageExposed(u, e);
    var s = (u.rng - d) / u.rng * 1.0 + fr.mult * 0.4 + (1 - e.men / e.maxMen) * 0.5;
    if (s > score) { score = s; best = e; }
  }
  u.targetId = best ? best.id : null;
}
function fldById(id) { for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].id === id) return __FIELD.units[i]; return null; }

function fldAiUnit(u) {
  if (!u.alive || u.state === "routing" || !u.ai) return;
  var obj = __FIELD.objective;
  // nearest enemy
  var near = null, nd = 1e9, weakNear = null, wd = 1e9;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var e = __FIELD.units[i]; if (e.side === u.side || !e.alive) continue;
    var d = fldDist(u, e);
    if (d < nd) { nd = d; near = e; }
    if ((e.state === "wavering" || e.state === "routing") && d < wd) { wd = d; weakNear = e; }
  }
  // if I'm wavering and a stronger enemy is close, fall back toward home
  if (u.state === "wavering" && near && nd < 220 && near.men > u.men * 1.05) {
    fldOrderMove(u, u.x, fldHomeEdgeZ(u.side) > FLD.FIELD_H ? FLD.FIELD_H - 120 : 120, near ? Math.atan2(near.x - u.x, -(near.z - u.z)) : u.facing);
    return;
  }
  // a wavering/routing enemy within charge reach -> charge it
  if (weakNear && wd < 150 && u.state === "steady") {
    var f = Math.atan2(weakNear.x - u.x, -(weakNear.z - u.z));
    u.order = { type: "charge", tx: weakNear.x, tz: weakNear.z, tface: f };
    return;
  }
  // otherwise: advance toward the objective, halting at good fire range of the nearest enemy
  var face = near ? Math.atan2(near.x - u.x, -(near.z - u.z)) : (u.side === "US" ? 0 : Math.PI);
  var dObj = fldDist(u, obj);
  if (near && nd <= u.rng * 0.92) {
    // in range: hold and pour fire (face the enemy), pick line for max fire
    u.formation = "line";
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: face };
  } else {
    // move to a fire position near the objective on my approach lane
    u.formation = (dObj > 280) ? "column" : "line";
    var tx = obj.x + (u.x - obj.x) * 0.28;
    var tz = obj.z + (u.z - obj.z) * 0.28;
    u.order = { type: "move", tx: tx, tz: tz, tface: face };
  }
}

/* ===========================================================================
   THE SIM STEP  (one fixed tick)
   =========================================================================== */
var _fldAiClock = 0, _fldAiIdx = 0;
function fldSimStep(dt) {
  if (__FIELD.phase !== "battle") return;
  __FIELD.t += dt;
  // AI: throttle — step a slice of units per tick toward AI_HZ
  _fldAiClock += dt;
  if (_fldAiClock >= 1 / FLD.AI_HZ) {
    _fldAiClock = 0;
    for (var a = 0; a < __FIELD.units.length; a++) { var ua = __FIELD.units[a]; if (ua.ai) fldAiUnit(ua); }
  }
  // movement
  for (var m = 0; m < __FIELD.units.length; m++) fldStepMovement(__FIELD.units[m], dt);
  // melee (charging units in contact). fldResolveMelee is symmetric (hits BOTH sides), so resolve
  // each unordered pair AT MOST ONCE per tick — a mutual charge must not double-bill casualties.
  var _meleeDone = {};
  for (var c = 0; c < __FIELD.units.length; c++) {
    var u = __FIELD.units[c]; if (!u.alive || u.state === "routing") continue;
    if (u.order.type === "charge") {
      for (var d2 = 0; d2 < __FIELD.units.length; d2++) {
        var t2 = __FIELD.units[d2]; if (t2.side === u.side || !t2.alive) continue;
        if (fldDist(u, t2) <= FLD.CONTACT_R) {
          var pk = u.id < t2.id ? u.id + "_" + t2.id : t2.id + "_" + u.id;
          if (!_meleeDone[pk]) { _meleeDone[pk] = 1; fldResolveMelee(u, t2, dt); }
          if (!t2.alive || t2.state === "routing") u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing };
        }
      }
    }
  }
  // fire
  for (var f = 0; f < __FIELD.units.length; f++) {
    var s = __FIELD.units[f]; if (!s.alive) continue;
    fldAcquireTarget(s);
    if (s.targetId) { var tg = fldById(s.targetId); if (tg) fldResolveFire(s, tg, dt); }
  }
  // morale
  for (var mo = 0; mo < __FIELD.units.length; mo++) fldMoraleStep(__FIELD.units[mo], dt);
  // objective + victory
  fldObjectiveStep(dt);
  fldCheckVictory();
}
function fldObjectiveStep(dt) {
  var obj = __FIELD.objective, near = { US: 0, CS: 0 };
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i]; if (!u.alive || u.state === "routing") continue;
    if (fldDist(u, obj) <= obj.r) near[u.side] += u.men;
  }
  for (var s = 0; s < 2; s++) {
    var side = s === 0 ? "US" : "CS", foe = fldEnemy(side);
    if (near[side] > 0 && near[foe] === 0) __FIELD.holdSecs[side] += dt;
    else if (near[foe] > near[side]) __FIELD.holdSecs[side] = Math.max(0, __FIELD.holdSecs[side] - dt * 0.5);
  }
}
function fldArmyLive(side) {
  var n = 0; for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === side && u.alive && u.state !== "routing") n++; } return n;
}
function fldArmyStrength(side) {
  var n = 0; for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === side && u.alive) n += u.men; } return n;
}
function fldCheckVictory() {
  if (__FIELD.phase !== "battle") return;
  var w = null;
  if (fldArmyLive("US") === 0 && fldArmyLive("CS") > 0) w = "CS";
  else if (fldArmyLive("CS") === 0 && fldArmyLive("US") > 0) w = "US";
  else if (fldArmyLive("US") === 0 && fldArmyLive("CS") === 0) w = "draw";
  else if (__FIELD.holdSecs.US >= FLD.HOLD_TO_WIN) w = "US";
  else if (__FIELD.holdSecs.CS >= FLD.HOLD_TO_WIN) w = "CS";
  else if (__FIELD.t >= FLD.TIME_LIMIT) {
    var sU = fldArmyStrength("US"), sC = fldArmyStrength("CS");
    w = sU > sC * 1.05 ? "US" : (sC > sU * 1.05 ? "CS" : "draw");
  }
  if (w) { __FIELD.winner = w; __FIELD.phase = "over"; fldOnOver(); }
}

/* headless stepper for probes (no render) */
function fldStepN(n, dt) {
  dt = dt || FLD.FIXED_DT;
  if (__FIELD.phase === "deploy") { __FIELD.phase = "battle"; __FIELD.paused = false; }
  for (var i = 0; i < n && __FIELD.phase === "battle"; i++) fldSimStep(dt);
  return { t: __FIELD.t, phase: __FIELD.phase, winner: __FIELD.winner };
}

/* ===========================================================================
   LAUNCH / TEARDOWN  +  DOM
   =========================================================================== */
function fldLaunchSandbox(opts) {
  opts = opts || {};
  if (__FIELD.launched) fldExit(true);
  __FIELD.launched = true;
  var gen = (__FIELD._gen = (__FIELD._gen || 0) + 1);   // launch generation — stale async callbacks no-op
  __FIELD.rendererKind = opts.renderer || "3d";   // '3d' | '2d' | 'none'
  fldInitSim(opts);
  try { if (typeof closeSheet === "function") closeSheet(); } catch (e) {}
  try { var ov = document.getElementById("overlay"); if (ov) ov.classList.add("hidden"); } catch (e) {}
  if (__FIELD.rendererKind === "none") return; // headless (probe)
  fldBuildDom();
  if (__FIELD.rendererKind === "2d") { fld2dInit(); fldStartLoop(); return; }
  // 3D: load THREE via the base loader; fall back to 2D if it fails
  if (typeof _m3dLoadScripts === "function") {
    _m3dLoadScripts(function (ok) {
      // bail if the user exited (or relaunched) while THREE was loading — the canvas may be gone
      if (!__FIELD.launched || gen !== __FIELD._gen || !__FIELD.cv2d) return;
      if (ok && window.THREE) { try { fld3dInit(); __FIELD.mode3d = true; } catch (e) { __FIELD.rendererKind = "2d"; fldResetCanvasForFallback(); fld2dInit(); } }
      else { __FIELD.rendererKind = "2d"; fld2dInit(); if (typeof toast === "function") toast("3D unavailable — sandbox in 2D.", 2200); }
      fldStartLoop();
    });
  } else { __FIELD.rendererKind = "2d"; fld2dInit(); fldStartLoop(); }
}
// A canvas that took (even a failed) WebGL context can't switch to '2d'; swap in a fresh canvas
// (cloneNode copies id+style) and re-wire its pointer listeners before the 2D fallback draws.
function fldResetCanvasForFallback() {
  try {
    fld3dDispose();
    var old = __FIELD.cv2d; if (!old || !old.parentNode) return;
    var nc = old.cloneNode(false); old.parentNode.replaceChild(nc, old); __FIELD.cv2d = nc;
    nc.addEventListener("pointerdown", fldPointerDown);
    nc.addEventListener("pointermove", fldPointerMove);
  } catch (e) {}
}
function fldExit(silent) {
  if (!__FIELD.launched) return;
  __FIELD._gen = (__FIELD._gen || 0) + 1;   // invalidate any in-flight async loader callback
  if (__FIELD.raf) { cancelAnimationFrame(__FIELD.raf); __FIELD.raf = 0; }
  try { window.removeEventListener("pointerup", fldPointerUp); window.removeEventListener("resize", fldResizeCanvas); } catch (e) {}
  fld3dDispose();
  if (__FIELD._ro) { try { __FIELD._ro.disconnect(); } catch (e) {} __FIELD._ro = null; }
  if (__FIELD.root && __FIELD.root.parentNode) __FIELD.root.parentNode.removeChild(__FIELD.root);
  __FIELD.root = null; __FIELD.cv2d = null; __FIELD.ctx2d = null; __FIELD.mode3d = false;
  __FIELD.launched = false; __FIELD.phase = "idle"; __FIELD.units = []; __FIELD.sel = [];
  if (!silent) { try { if (typeof openMainMenu === "function") openMainMenu(); } catch (e) {} }
}
function fldBuildDom() {
  var r = document.createElement("div");
  r.id = "fldRoot";
  r.style.cssText = "position:fixed;inset:0;z-index:5000;background:#10141a;overflow:hidden;font-family:Georgia,serif;color:#f2e8d5;";
  r.innerHTML =
    '<canvas id="fldGl" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>' +
    '<div id="fldTop" style="position:absolute;top:0;left:0;right:0;padding:8px 12px;display:flex;gap:10px;align-items:center;background:linear-gradient(#000a,#0000);pointer-events:none;">' +
      '<b style="letter-spacing:1px;">&#9876; TACTICAL SANDBOX</b><span id="fldClock" style="opacity:.85;">0:00</span>' +
      '<span id="fldObj" style="opacity:.85;">Objective: contested</span><span style="flex:1"></span>' +
      '<span id="fldPhase" style="opacity:.85;"></span>' +
    '</div>' +
    '<div id="fldHud" role="region" aria-label="Selected unit" style="position:absolute;left:12px;bottom:12px;min-width:240px;max-width:320px;background:#0c0f14e6;border:1px solid #4a3c28;border-radius:6px;padding:10px 12px;font-size:13px;"></div>' +
    '<div id="fldBar" style="position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:6px;"></div>' +
    '<div id="fldLive" aria-live="polite" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;"></div>' +
    '<div id="fldEnd" class="hidden" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000a;"></div>';
  document.body.appendChild(r);
  __FIELD.root = r;
  __FIELD.cv2d = document.getElementById("fldGl");
  // control bar buttons (mirror the keys, for discoverability + a11y)
  var bar = document.getElementById("fldBar");
  var btns = [
    ["fldBtnPlay", "&#9654; Begin", "Begin / pause the battle (Space)"],
    ["fldBtnSpd", "1&times;", "Cycle speed 1x / 2x / 4x (1 2 3)"],
    ["fldBtnLine", "Line", "Form line — max fire (L)"],
    ["fldBtnCol", "Column", "Form column — fast march (C)"],
    ["fldBtnCharge", "Charge", "Charge nearest enemy (F)"],
    ["fldBtnHold", "Hold", "Halt in place (H)"],
    ["fldBtnExit", "Exit", "Leave the sandbox (Esc)"],
  ];
  for (var i = 0; i < btns.length; i++) {
    var b = document.createElement("button");
    b.id = btns[i][0]; b.innerHTML = btns[i][1]; b.title = btns[i][2]; b.setAttribute("aria-label", btns[i][2]);
    b.style.cssText = "background:#1c1610;color:#e9dcc0;border:1px solid #4a3c28;border-radius:4px;padding:7px 11px;font:13px Georgia,serif;cursor:pointer;";
    bar.appendChild(b);
  }
  fldWireControls();
  fldResizeCanvas();
  __FIELD._ro = (typeof ResizeObserver !== "undefined") ? new ResizeObserver(fldResizeCanvas) : null;
  if (__FIELD._ro) __FIELD._ro.observe(r); else window.addEventListener("resize", fldResizeCanvas);
  fldRenderHud();
}
function fldResizeCanvas() {
  var cv = __FIELD.cv2d; if (!cv) return;
  var w = window.innerWidth, h = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (__FIELD.mode3d && __FIELD.renderer) {
    __FIELD.renderer.setSize(w, h, false);
    if (__FIELD.camera) { __FIELD.camera.aspect = w / h; __FIELD.camera.updateProjectionMatrix(); }
  } else {
    cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr);   // NB: assigning width clears the canvas
    if (__FIELD.ctx2d) { __FIELD.ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0); if (__FIELD.terrain) fld2dDraw(); } // repaint after the clear (no resize flicker)
  }
}
function fldAnnounce(msg) {
  try { var l = document.getElementById("fldLive"); if (l) l.textContent = msg; } catch (e) {}
}

/* ===========================================================================
   THE RAF LOOP  (fixed-timestep accumulator)
   =========================================================================== */
function fldStartLoop() {
  if (__FIELD.raf) { cancelAnimationFrame(__FIELD.raf); __FIELD.raf = 0; }   // never run two RAF chains
  __FIELD.last = (typeof performance !== "undefined" && performance.now) ? performance.now() : 0;
  __FIELD.acc = 0;
  var step = function (now) {
    if (!__FIELD.launched) return;
    __FIELD.raf = requestAnimationFrame(step);
    var dt = (now - __FIELD.last) / 1000; __FIELD.last = now;
    if (dt > 0.1) dt = 0.1;                              // clamp tab-switch spikes
    if (__FIELD.phase === "battle" && !__FIELD.paused) {
      __FIELD.acc += dt * __FIELD.speed;
      var guard = 0;
      while (__FIELD.acc >= FLD.FIXED_DT && guard < 16) { fldSimStep(FLD.FIXED_DT); __FIELD.acc -= FLD.FIXED_DT; guard++; }
    }
    fldRender();
    fldRenderTop();
  };
  __FIELD.raf = requestAnimationFrame(step);
}
function fldRender() {
  if (__FIELD.mode3d) fld3dRender(); else fld2dDraw();
}
function fldRenderTop() {
  var c = document.getElementById("fldClock"); if (c) { var s = Math.floor(__FIELD.t); c.textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  var o = document.getElementById("fldObj");
  if (o) {
    var hU = __FIELD.holdSecs.US, hC = __FIELD.holdSecs.CS;
    var lead = hU > hC + 0.5 ? "Union holds " + Math.floor(hU) + "s/" + FLD.HOLD_TO_WIN : (hC > hU + 0.5 ? "Confederate holds " + Math.floor(hC) + "s/" + FLD.HOLD_TO_WIN : "contested");
    o.textContent = "Objective: " + lead;
  }
  var p = document.getElementById("fldPhase");
  if (p) p.textContent = __FIELD.phase === "deploy" ? "Press Begin (Space) to advance" : (__FIELD.paused ? "PAUSED" : (__FIELD.speed + "×"));
}

/* ===========================================================================
   CONTROLS  (low-APM: click-select, drag = move + facing; keys + buttons)
   =========================================================================== */
function fldWireControls() {
  var cv = __FIELD.cv2d;
  cv.addEventListener("pointerdown", fldPointerDown);
  cv.addEventListener("pointermove", fldPointerMove);
  window.addEventListener("pointerup", fldPointerUp);
  document.getElementById("fldRoot").addEventListener("keydown", fldKey);
  document.getElementById("fldRoot").setAttribute("tabindex", "0");
  setTimeout(function () { try { document.getElementById("fldRoot").focus(); } catch (e) {} }, 30);
  var w = function (id, fn) { var el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
  w("fldBtnPlay", function () { fldTogglePlay(); });
  w("fldBtnSpd", function () { fldCycleSpeed(); });
  w("fldBtnLine", function () { fldSetFormation("line"); });
  w("fldBtnCol", function () { fldSetFormation("column"); });
  w("fldBtnCharge", function () { fldSelCharge(); });
  w("fldBtnHold", function () { fldSelHold(); });
  w("fldBtnExit", function () { fldExit(false); });
}
function fldTogglePlay() {
  if (__FIELD.phase === "deploy") { __FIELD.phase = "battle"; __FIELD.paused = false; fldAnnounce("Battle begins."); }
  else if (__FIELD.phase === "battle") { __FIELD.paused = !__FIELD.paused; fldAnnounce(__FIELD.paused ? "Paused." : "Resumed."); }
  var b = document.getElementById("fldBtnPlay"); if (b) b.innerHTML = __FIELD.paused ? "&#9654; Resume" : "&#10074;&#10074; Pause";
}
function fldCycleSpeed() { __FIELD.speed = __FIELD.speed === 1 ? 2 : (__FIELD.speed === 2 ? 4 : 1); var b = document.getElementById("fldBtnSpd"); if (b) b.innerHTML = __FIELD.speed + "&times;"; }
function fldPlayerSel() { var out = []; for (var i = 0; i < __FIELD.sel.length; i++) { var u = fldById(__FIELD.sel[i]); if (u && u.alive && u.side === "US" && !u.ai) out.push(u); } return out; }
function fldSetFormation(f) { var s = fldPlayerSel(); for (var i = 0; i < s.length; i++) s[i].formation = f; fldRenderHud(); }
function fldSelCharge() { var s = fldPlayerSel(); for (var i = 0; i < s.length; i++) fldOrderCharge(s[i]); fldAnnounce("Charge ordered."); }
function fldSelHold() { var s = fldPlayerSel(); for (var i = 0; i < s.length; i++) { var u = s[i]; u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing }; } fldAnnounce("Hold ordered."); }
function fldKey(e) {
  // Escape always exits; otherwise let native activation handle a focused button (Space/Enter)
  // so control-bar / end-screen buttons don't double-fire, and the end screen stays keyboard-operable.
  if (e.key === "Escape") { fldExit(false); return; }
  if (e.target && e.target.tagName === "BUTTON") return;
  if (__FIELD.phase === "over") return; // end screen: native Tab/Enter/Space reach #fldAgain / #fldDone
  var k = e.key;
  if (k === " ") { e.preventDefault(); fldTogglePlay(); }
  else if (k === "1") __FIELD.speed = 1; else if (k === "2") __FIELD.speed = 2; else if (k === "3") __FIELD.speed = 4;
  else if (k === "l" || k === "L") fldSetFormation("line");
  else if (k === "c" || k === "C") fldSetFormation("column");
  else if (k === "f" || k === "F" || k === "Enter") fldSelCharge();
  else if (k === "h" || k === "H") fldSelHold();
  else if (k === "a" || k === "A") { __FIELD.sel = []; for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === "US" && u.alive && !u.ai) __FIELD.sel.push(u.id); } fldRenderHud(); }
  else if (k === "Tab") { if (__FIELD.phase === "battle") { e.preventDefault(); fldCycleSel(); } } // only steal Tab mid-battle
  var b = document.getElementById("fldBtnSpd"); if (b) b.innerHTML = __FIELD.speed + "&times;";
}
function fldCycleSel() {
  var us = []; for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === "US" && u.alive && !u.ai) us.push(u.id); }
  if (!us.length) return;
  var cur = __FIELD.sel.length ? us.indexOf(__FIELD.sel[0]) : -1;
  __FIELD.sel = [us[(cur + 1) % us.length]]; fldRenderHud();
}
// screen -> world (delegates to the active renderer's picker)
function fldPick(clientX, clientY) { return __FIELD.mode3d ? fld3dPick(clientX, clientY) : fld2dPick(clientX, clientY); }
function fldPointerDown(e) {
  if (__FIELD.phase === "over") return;
  var wp = fldPick(e.clientX, e.clientY); if (!wp) return;
  // select the friendly brigade nearest the click (within grab radius), else start a move-drag
  var best = null, bd = 70;
  for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side !== "US" || !u.alive || u.ai) continue; var d = Math.hypot(u.x - wp.x, u.z - wp.z); if (d < bd) { bd = d; best = u; } }
  if (best) { if (e.shiftKey && __FIELD.sel.indexOf(best.id) < 0) __FIELD.sel.push(best.id); else __FIELD.sel = [best.id]; fldRenderHud(); __FIELD.drag = null; return; }
  // empty ground with a selection -> begin a move/face drag
  if (fldPlayerSel().length) __FIELD.drag = { x0: wp.x, z0: wp.z, x: wp.x, z: wp.z };
  else __FIELD.sel = [];
}
function fldPointerMove(e) {
  var wp = fldPick(e.clientX, e.clientY); __FIELD.hover = wp || null;
  if (__FIELD.drag && wp) { __FIELD.drag.x = wp.x; __FIELD.drag.z = wp.z; }
}
function fldPointerUp() {
  if (!__FIELD.drag) return;
  var dr = __FIELD.drag; __FIELD.drag = null;
  var sel = fldPlayerSel(); if (!sel.length) return;
  var face = Math.atan2(dr.x - dr.x0, -(dr.z - dr.z0));
  var dragged = Math.hypot(dr.x - dr.x0, dr.z - dr.z0) > 18;
  // multi-select: spread around the drop point along the facing's perpendicular
  var perp = face + Math.PI / 2, spread = 80;
  for (var i = 0; i < sel.length; i++) {
    var off = (i - (sel.length - 1) / 2) * spread;
    var tx = dr.x0 + Math.sin(perp) * off, tz = dr.z0 - Math.cos(perp) * off;
    fldOrderMove(sel[i], tx, tz, dragged ? face : sel[i].facing);
  }
  fldAnnounce("March ordered.");
}

/* ===========================================================================
   HUD  +  END SCREEN
   =========================================================================== */
function fldStateLabel(u) { return u.state.charAt(0).toUpperCase() + u.state.slice(1); }
function fldBar(label, val, max, col) {
  var pct = Math.round(fldClamp(val / max, 0, 1) * 100);
  return '<div style="margin:3px 0;"><span style="display:inline-block;width:64px;opacity:.8;">' + label + '</span>' +
    '<span style="display:inline-block;width:120px;height:9px;background:#2a2118;border:1px solid #4a3c28;vertical-align:middle;">' +
    '<span style="display:block;height:100%;width:' + pct + '%;background:' + col + ';"></span></span> ' +
    '<span style="opacity:.75;">' + Math.round(val) + '</span></div>';
}
function fldRenderHud() {
  var el = document.getElementById("fldHud"); if (!el) return;
  var sel = fldPlayerSel();
  if (!sel.length) { el.innerHTML = '<div style="opacity:.7;">Click a brigade to select. Drag from open ground to march &amp; face. (' + fldArmyLive("US") + ' Union vs ' + fldArmyLive("CS") + ' Rebel brigades afield.)</div>'; return; }
  var u = sel[0];
  var sideCol = u.side === "US" ? "#6c8ebf" : "#b06a5a";
  var wn = (typeof WEAPONS !== "undefined" && WEAPONS[u.weapon]) ? WEAPONS[u.weapon].name : u.weapon;
  el.innerHTML =
    '<div style="font-weight:bold;color:' + sideCol + ';">' + u.name + (sel.length > 1 ? " (+" + (sel.length - 1) + ")" : "") + '</div>' +
    '<div style="opacity:.8;font-size:12px;margin-bottom:4px;">' + wn + ' &middot; ' + u.formation + ' &middot; <b>' + fldStateLabel(u) + '</b></div>' +
    fldBar("Men", u.men, u.maxMen, "#cdbb88") +
    fldBar("Morale", u.morale, u.maxMor, u.morale > 35 ? "#7faf6a" : "#c98a3a") +
    fldBar("Fatigue", u.fatigue, 100, "#a08050") +
    fldBar("Ammo", u.ammo, 100, "#8a9bb0");
}
function fldOnOver() {
  var e = document.getElementById("fldEnd"); if (!e) { fldAnnounce("Battle over."); return; }
  var w = __FIELD.winner;
  var msg = w === "draw" ? "Stalemate" : (w === "US" ? "Union Victory" : "Confederate Victory");
  fldAnnounce(msg);
  e.classList.remove("hidden");
  e.setAttribute("role", "dialog"); e.setAttribute("aria-label", msg);
  e.innerHTML =
    '<div style="text-align:center;background:#0c0f14;border:1px solid #4a3c28;border-radius:8px;padding:26px 34px;">' +
    '<div style="font-size:26px;letter-spacing:1px;margin-bottom:8px;color:#e9dcc0;">' + msg + '</div>' +
    '<div style="opacity:.8;margin-bottom:6px;">Held the field at ' + Math.floor(__FIELD.t / 60) + ':' + ("0" + (Math.floor(__FIELD.t) % 60)).slice(-2) + '.</div>' +
    '<div style="opacity:.7;font-size:13px;margin-bottom:18px;">Union ' + fldArmyStrength("US") + ' &middot; Confederate ' + fldArmyStrength("CS") + ' still under arms.</div>' +
    '<button id="fldAgain" style="background:#1c1610;color:#e9dcc0;border:1px solid #4a3c28;border-radius:4px;padding:9px 16px;font:14px Georgia,serif;cursor:pointer;margin-right:8px;">Fight Again</button>' +
    '<button id="fldDone" style="background:#1c1610;color:#e9dcc0;border:1px solid #4a3c28;border-radius:4px;padding:9px 16px;font:14px Georgia,serif;cursor:pointer;">Main Menu</button></div>';
  var a = document.getElementById("fldAgain"), d = document.getElementById("fldDone");
  if (a) a.addEventListener("click", function () { var k = __FIELD.rendererKind, sd = (__FIELD.seed + 7) >>> 0; fldExit(true); fldLaunchSandbox({ renderer: k, seed: sd }); });
  if (d) d.addEventListener("click", function () { fldExit(false); });
  if (a) { try { a.focus(); } catch (e2) {} }   // move focus into the end dialog for keyboard users
}

/* ===========================================================================
   2D FALLBACK RENDERER  (top-down — the mandatory offline path, D54)
   =========================================================================== */
function fld2dInit() { if (!__FIELD.cv2d) return; __FIELD.ctx2d = __FIELD.cv2d.getContext("2d"); __FIELD.mode3d = false; fldResizeCanvas(); }
function fld2dView() {
  var w = window.innerWidth, h = window.innerHeight;
  var pad = 40, sx = (w - pad * 2) / FLD.FIELD_W, sz = (h - pad * 2 - 60) / FLD.FIELD_H;
  var s = Math.max(0.05, Math.min(sx, sz));   // clamp — a tiny viewport must not yield a negative draw scale
  return { s: s, ox: (w - FLD.FIELD_W * s) / 2, oz: (h - FLD.FIELD_H * s) / 2 + 8 };
}
function fld2dPick(clientX, clientY) {
  var v = fld2dView(); var rect = __FIELD.cv2d.getBoundingClientRect();
  return { x: (clientX - rect.left - v.ox) / v.s, z: (clientY - rect.top - v.oz) / v.s };
}
function fld2dDraw() {
  var ctx = __FIELD.ctx2d; if (!ctx) return;
  var v = fld2dView(), W = window.innerWidth, H = window.innerHeight;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#3f4a32"; ctx.fillRect(v.ox, v.oz, FLD.FIELD_W * v.s, FLD.FIELD_H * v.s);
  var t = __FIELD.terrain;
  // woods
  ctx.fillStyle = "#2c3a22";
  for (var i = 0; i < t.woods.length; i++) { var wd = t.woods[i]; ctx.beginPath(); ctx.arc(v.ox + wd.x * v.s, v.oz + wd.z * v.s, wd.r * v.s, 0, 7); ctx.fill(); }
  // hill ring
  ctx.strokeStyle = "#5a6a44"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(v.ox + t.hill.x * v.s, v.oz + t.hill.z * v.s, t.hill.s * 0.55 * v.s, 0, 7); ctx.stroke();
  // wall
  ctx.strokeStyle = "#8a8070"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(v.ox + t.wall.x1 * v.s, v.oz + t.wall.z1 * v.s); ctx.lineTo(v.ox + t.wall.x2 * v.s, v.oz + t.wall.z2 * v.s); ctx.stroke();
  // objective
  var o = __FIELD.objective; ctx.strokeStyle = "#d8c87a"; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(v.ox + o.x * v.s, v.oz + o.z * v.s, o.r * v.s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  // units
  for (var u2 = 0; u2 < __FIELD.units.length; u2++) {
    var u = __FIELD.units[u2]; if (!u.alive) continue;
    var cx = v.ox + u.x * v.s, cz = v.oz + u.z * v.s;
    var frontW = (u.formation === "column" ? 36 : 96) * v.s * (0.5 + 0.5 * u.men / u.maxMen);
    var depth = (u.formation === "column" ? 60 : 26) * v.s;
    ctx.save(); ctx.translate(cx, cz); ctx.rotate(u.facing);
    var sel = __FIELD.sel.indexOf(u.id) >= 0;
    var base = u.side === "US" ? "#5b79ad" : "#a85a4a";
    if (u.state === "routing") base = u.side === "US" ? "#6b6b8a" : "#8a6b6b";
    ctx.fillStyle = base; ctx.fillRect(-frontW / 2, -depth / 2, frontW, depth);
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(-frontW / 2, -depth / 2 - 3 * v.s, frontW, 3 * v.s); // facing edge (front)
    if (sel) { ctx.strokeStyle = "#ffe9a8"; ctx.lineWidth = 2; ctx.strokeRect(-frontW / 2 - 2, -depth / 2 - 2, frontW + 4, depth + 4); }
    ctx.restore();
    // non-color side cue (CVD-safe): U for Union, C for Confederate, centered on the block
    ctx.fillStyle = "#f7efdd"; ctx.font = "bold 12px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(u.side === "US" ? "U" : "C", cx, cz);
    ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
    // morale pip
    ctx.fillStyle = u.morale > 35 ? "#7faf6a" : "#c98a3a"; ctx.fillRect(cx - 12, cz - depth / 2 - 9, 24 * (u.morale / u.maxMor), 3);
    if (u.state === "routing") { ctx.fillStyle = "#ffd27a"; ctx.font = "10px Georgia"; ctx.fillText("ROUT", cx - 13, cz + depth / 2 + 12); }
  }
  // drag arrow
  if (__FIELD.drag) { var dr = __FIELD.drag; ctx.strokeStyle = "#ffe9a8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(v.ox + dr.x0 * v.s, v.oz + dr.z0 * v.s); ctx.lineTo(v.ox + dr.x * v.s, v.oz + dr.z * v.s); ctx.stroke(); }
}

/* ===========================================================================
   3D RENDERER  (sibling THREE scene; sunlit-field art direction)
   =========================================================================== */
function fld3dInit() {
  var T = window.THREE, cv = __FIELD.cv2d;
  __FIELD._colUS = new T.Color("#3a5a9a"); __FIELD._colCS = new T.Color("#9a4a3a"); // hoisted — no per-frame alloc
  var rnd = new T.WebGLRenderer({ canvas: cv, antialias: !fldLow() });
  rnd.setPixelRatio(fldLow() ? 1 : Math.min(2, window.devicePixelRatio || 1));
  rnd.setSize(window.innerWidth, window.innerHeight, false);
  var scene = new T.Scene();
  scene.background = new T.Color("#acc2d6"); scene.fog = new T.Fog("#acc2d6", 700, 1900);
  var cam = new T.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 6000);
  var ctr = __FIELD.objective;
  cam.position.set(ctr.x, 620, FLD.FIELD_H + 380);
  var controls = new T.OrbitControls(cam, cv);
  controls.target.set(ctr.x, 0, ctr.z); controls.enableDamping = !fldReduceMotion(); controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.47; controls.minDistance = 120; controls.maxDistance = 2200;
  var sun = new T.DirectionalLight("#fff2d0", 1.15); sun.position.set(FLD.FIELD_W * 0.2, 1200, -FLD.FIELD_H * 0.2); scene.add(sun);
  scene.add(new T.HemisphereLight("#dceaff", "#5a4a32", 0.72));
  __FIELD.renderer = rnd; __FIELD.scene = scene; __FIELD.camera = cam; __FIELD.controls = controls;
  __FIELD.raycaster = new T.Raycaster(); __FIELD.ground = null;
  fld3dBuildTerrain();
  __FIELD.groups = new T.Group(); scene.add(__FIELD.groups);
  fld3dBuildUnits();
}
function fldLow() { try { var q = G && G.settings && G.settings.gfxQuality; if (q === "low") return true; if (q === "high") return false; return Math.min(window.innerWidth, window.innerHeight) <= 720; } catch (e) { return false; } }
function fld3dBuildTerrain() {
  var T = window.THREE, seg = fldLow() ? 40 : 80;
  var geo = new T.PlaneGeometry(FLD.FIELD_W, FLD.FIELD_H, seg, seg);
  geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position, colors = [];
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i) + FLD.FIELD_W / 2, z = pos.getZ(i) + FLD.FIELD_H / 2;
    var h = fldTerrainH(x, z); pos.setY(i, h);
    var c = new T.Color(fldInWoods(x, z) ? "#2f3d24" : "#56653c"); c.offsetHSL(0, 0, (h / 60) * 0.12);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals();
  var mesh = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true }));
  mesh.position.set(FLD.FIELD_W / 2, 0, FLD.FIELD_H / 2);
  __FIELD.scene.add(mesh); __FIELD.ground = mesh;
  // objective marker
  var o = __FIELD.objective;
  var ring = new T.Mesh(new T.RingGeometry(o.r - 6, o.r, 40), new T.MeshBasicMaterial({ color: "#d8c87a", side: T.DoubleSide, transparent: true, opacity: 0.7 }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(o.x, fldTerrainH(o.x, o.z) + 1.5, o.z); __FIELD.scene.add(ring);
  // wall
  var t = __FIELD.terrain, wdx = t.wall.x2 - t.wall.x1, wdz = t.wall.z2 - t.wall.z1, wlen = Math.hypot(wdx, wdz);
  var wall = new T.Mesh(new T.BoxGeometry(wlen, 14, 8), new T.MeshLambertMaterial({ color: "#8a8070" }));
  wall.position.set((t.wall.x1 + t.wall.x2) / 2, fldTerrainH(t.wall.x1, t.wall.z1) + 7, (t.wall.z1 + t.wall.z2) / 2);
  wall.rotation.y = -Math.atan2(wdz, wdx); __FIELD.scene.add(wall);
  // woods (instanced cones)
  for (var w = 0; w < t.woods.length; w++) {
    var wd = t.woods[w], n = fldLow() ? 14 : 34;
    var im = new T.InstancedMesh(new T.ConeGeometry(16, 46, 6), new T.MeshLambertMaterial({ color: "#2c3a22" }), n);
    var dummy = new T.Object3D();
    for (var k = 0; k < n; k++) {
      var ang = (k / n) * 7 + (k % 3), rr = (0.25 + ((k * 37) % 70) / 100) * wd.r;
      var tx = wd.x + Math.cos(ang) * rr, tz = wd.z + Math.sin(ang) * rr;
      dummy.position.set(tx, fldTerrainH(tx, tz) + 23, tz); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix);
    }
    __FIELD.scene.add(im);
  }
}
function fld3dBuildUnits() {
  var T = window.THREE;
  while (__FIELD.groups.children.length) __FIELD.groups.remove(__FIELD.groups.children[0]);
  __FIELD._u3d = {};
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i];
    var g = new T.Group();
    var col = u.side === "US" ? "#3a5a9a" : "#9a4a3a";
    var slab = new T.Mesh(new T.BoxGeometry(96, 8, 26), new T.MeshLambertMaterial({ color: col }));
    slab.name = "slab"; g.add(slab);
    var front = new T.Mesh(new T.BoxGeometry(96, 10, 5), new T.MeshLambertMaterial({ color: "#15110b" }));
    front.position.z = -14; front.name = "front"; g.add(front);
    var flag = new T.Mesh(new T.PlaneGeometry(22, 14), new T.MeshBasicMaterial({ color: col, side: T.DoubleSide }));
    flag.position.set(0, 34, 0); flag.name = "flag"; g.add(flag);
    var pole = new T.Mesh(new T.CylinderGeometry(1, 1, 40, 5), new T.MeshLambertMaterial({ color: "#2a2018" })); pole.position.y = 20; g.add(pole);
    // non-color side cue (CVD-safe): a cube finial for the Union, a pyramid for the Confederacy
    var topper = u.side === "US"
      ? new T.Mesh(new T.BoxGeometry(11, 11, 11), new T.MeshLambertMaterial({ color: "#ece4d0" }))
      : new T.Mesh(new T.ConeGeometry(8, 14, 4), new T.MeshLambertMaterial({ color: "#ece4d0" }));
    topper.position.set(0, 47, 0); g.add(topper);
    var ring = new T.Mesh(new T.RingGeometry(54, 62, 24), new T.MeshBasicMaterial({ color: "#ffe9a8", side: T.DoubleSide, transparent: true, opacity: 0 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 1; ring.name = "ring"; g.add(ring);
    __FIELD.groups.add(g); __FIELD._u3d[u.id] = g;
  }
}
function fld3dSyncUnit(u, g) {
  var T = window.THREE;
  g.visible = u.alive;
  if (!u.alive) return;
  var y = fldTerrainH(u.x, u.z);
  g.position.set(u.x, y + 4, u.z); g.rotation.y = -u.facing; // align the block front (local -z) to sim forward
  var slab = g.getObjectByName("slab"), front = g.getObjectByName("front"), ring = g.getObjectByName("ring"), flag = g.getObjectByName("flag");
  var w = (u.formation === "column" ? 34 : 96) * (0.5 + 0.5 * u.men / u.maxMen);
  var d = (u.formation === "column" ? 58 : 26);
  if (slab) { slab.scale.set(w / 96, 1, d / 26); slab.material.color.copy(u.side === "US" ? __FIELD._colUS : __FIELD._colCS); if (u.state === "routing") slab.material.color.multiplyScalar(0.55); }
  if (front) { front.scale.x = w / 96; front.position.z = -d / 2 - 3; }
  if (flag) flag.position.y = u.state === "routing" ? 14 : 34;
  if (ring) ring.material.opacity = (__FIELD.sel.indexOf(u.id) >= 0) ? 0.85 : 0;
}
function fld3dRender() {
  if (!__FIELD.renderer) return;
  if (__FIELD.controls) __FIELD.controls.update();
  for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; var g = __FIELD._u3d[u.id]; if (g) fld3dSyncUnit(u, g); }
  __FIELD.renderer.render(__FIELD.scene, __FIELD.camera);
}
function fld3dPick(clientX, clientY) {
  var T = window.THREE; if (!__FIELD.raycaster || !__FIELD.ground) return null;
  var rect = __FIELD.cv2d.getBoundingClientRect();
  var nx = ((clientX - rect.left) / rect.width) * 2 - 1, ny = -((clientY - rect.top) / rect.height) * 2 + 1;
  __FIELD.raycaster.setFromCamera({ x: nx, y: ny }, __FIELD.camera);
  var hit = __FIELD.raycaster.intersectObject(__FIELD.ground, false);
  if (hit && hit.length) return { x: hit[0].point.x, z: hit[0].point.z };
  return null;
}
function fld3dDispose() {
  if (!__FIELD.scene) { __FIELD.renderer = null; return; }
  try {
    __FIELD.scene.traverse(function (o) {
      if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      if (o.material) { var m = o.material; if (Array.isArray(m)) { for (var i = 0; i < m.length; i++) m[i].dispose && m[i].dispose(); } else if (m.dispose) m.dispose(); }
    });
    if (__FIELD.controls && __FIELD.controls.dispose) { try { __FIELD.controls.dispose(); } catch (e2) {} }
    if (__FIELD.renderer) { try { if (__FIELD.renderer.forceContextLoss) __FIELD.renderer.forceContextLoss(); } catch (e3) {} if (__FIELD.renderer.dispose) __FIELD.renderer.dispose(); }
  } catch (e) {}
  __FIELD.scene = null; __FIELD.camera = null; __FIELD.controls = null; __FIELD.renderer = null; __FIELD.groups = null; __FIELD._u3d = null; __FIELD.ground = null;
}

/* ===========================================================================
   ADDITIVE MENU LAUNCH  (MutationObserver — no override of openMainMenu)
   =========================================================================== */
function fldInjectMenuButton() {
  try {
    if (document.getElementById("fldSandboxBtn")) return;
    // Anchor on the LIVE broadsheet main menu (the openMainMenu redeclaration that wins, base ~8346):
    // the Free-Battle button #gnFree, a .gn-btn inside the col-2 .gn-col. (The earlier .menu-grid/#mmFree
    // openMainMenu at base ~3249 is shadowed and never renders.) Match the native .gn-btn markup.
    var anchor = document.getElementById("gnFree"); if (!anchor || !anchor.parentNode) return;
    var b = document.createElement("button");
    b.className = "gn-btn"; b.id = "fldSandboxBtn";
    b.setAttribute("aria-label", "Tactical Sandbox, Beta — a real-time skirmish: drag brigades to maneuver, fire, flank and break the enemy");
    b.innerHTML = '<span class="gn-hl">&#9876; NEW &mdash; THE TACTICAL SANDBOX</span>' +
      '<span class="gn-deck">Real-time skirmish (Beta) &mdash; drag to maneuver, volley, flank, and break the foe. Two brigades a side, on the open 3D field.</span>';
    b.addEventListener("click", function () { fldLaunchSandbox({ renderer: "3d" }); });
    if (anchor.nextSibling) anchor.parentNode.insertBefore(b, anchor.nextSibling); else anchor.parentNode.appendChild(b);
  } catch (e) {}
}
function fldInstallMenuObserver() {
  if (__FIELD._obsInstalled) return; __FIELD._obsInstalled = true;
  try {
    fldInjectMenuButton(); // catch an already-open menu
    var pad = document.getElementById("sheetPad");
    if (pad && typeof MutationObserver !== "undefined") {
      var obs = new MutationObserver(function () { fldInjectMenuButton(); });
      obs.observe(pad, { childList: true, subtree: true });
    }
  } catch (e) {}
}
(function fldBoot() {
  try {
    if (typeof document === "undefined") return;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fldInstallMenuObserver);
    else fldInstallMenuObserver();
  } catch (e) {}
})();
