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

   Bare-name globals only (G, WEAPONS, the T5 arm helpers fldArmMelee/fldArtFireMult/FLDA, _m3dLoadScripts, toast); window.THREE is
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

/* ---- tunable constants (seeded from the base WEAPONS table + tuned via probe; the per-arm melee/canister
   table lives in T5 FLDA, gated on __FIELD.arms) ---- */
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
  // fog of war (P1b — a toggle, default OFF): per-arm sight radius (yd); woods block line-of-sight.
  SIGHT_INF: 430, SIGHT_ART: 470, SIGHT_CAV: 720, // cavalry are the scouts (wide recon)
  WOODS_SEE_THRU: 75,                    // yards of woods a sight line can penetrate before it is blocked
  // role-aware tactical AI (P1b-iii): the DEFENDER doctrine for an ASYMMETRIC scenario (attacker set).
  // A defender HOLDS the objective's forward face + cover and makes the attacker assault uphill,
  // conducts a fighting withdrawal when pressed, and counterattacks a disordered attacker that has
  // closed on the hill (then returns to the line). The symmetric SANDBOX (attacker null) runs the
  // generic AI for both sides -> byte-behavior-identical (probe-field holds by construction).
  AI_LOCAL_R: 360,        // radius for the local force-balance read (yd)
  DEF_FACE_FRAC: 0.55,    // the hold line sits this fraction of OBJ_R forward of the crest, toward the threat
  DEF_LANE: 1.6,          // lateral spread of the hold line = this * OBJ_R either side of the threat bearing
  DEF_HOLD_TOL: 50,       // within this of the line band -> treat as "on the line", don't reposition (yd)
  DEF_FALLBACK_RATIO: 0.6,// a forward (delaying) unit outnumbered below this locally -> fall back to the line
  CTR_REACH: 175,         // a disordered visible enemy within this -> a defender may counterattack (yd)
  CTR_LEASH: 150,         // ...only if the target stays within OBJ_R + this of the objective (don't chase off the hill)
  CTR_RATIO: 0.9,         // ...and only with local friendly men >= this * local enemy men (don't over-commit)
  // role-aware ATTACKER doctrine (P1b-iv): the complement to the defender. A covered defender wins a
  // long-range fire trade, so the attacker CONCENTRATES on the weaker flank, CLOSES, and ASSAULTS — but
  // GRADUALLY (per-unit local concentration, not a knife-edge global commit) and CAUTIOUSLY UNDER FOG
  // (it can't assault what it can't see, so fog AIDS the defender, consistent with D58 — fork #2). Gated to
  // the scenario attacker -> the symmetric sandbox is byte-identical (fldAiGeneric for both).
  ATK_CHARGE_R: 170,       // charge a VISIBLE disordered (wavering) defender within this (yd)
  ATK_ASSAULT_R: 130,      // closed enough to assault a STEADY defender — press the bayonet home (yd)
  ATK_ASSAULT_STANDOFF: 70,// ...only when within OBJ_R + this of the objective (assault the position)
  ATK_LOCAL_RATIO: 1.1,    // ...and only with LOCAL men >= this * local VISIBLE-foe men (gradual concentration, not a global flip)
  ATK_GLOBAL_FLOOR: 0.85,  // never throw the army onto the bayonet while globally outnumbered below this
  ATK_FLANK_BIAS: 0.5,     // pull the approach this fraction toward the weaker (thinner) flank of the objective
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
// terrain accessors (P1a scenario seam): scenarios supply MULTIPLE hills/walls
// (terrain.hills[] / terrain.walls[]); the P0 sandbox supplies ONE (terrain.hill /
// terrain.wall). These normalize both shapes so every reader/renderer is shape-agnostic.
// For the single-hill sandbox the loops below iterate exactly one element -> the computed
// height/cover values are byte-identical to the pre-seam code (verified by probe-field +
// the terrain golden-snapshot guard).
function fldHills() { var t = __FIELD.terrain; if (!t) return []; return t.hills || (t.hill ? [t.hill] : []); }
function fldWalls() { var t = __FIELD.terrain; if (!t) return []; return t.walls || (t.wall ? [t.wall] : []); }
function fldTerrainH(x, z) {
  var t = __FIELD.terrain; if (!t) return 0;
  var h = Math.sin(x * 0.012) * 2.2 + Math.cos(z * 0.015) * 2.0; // gentle undulation
  var hs = fldHills();
  for (var i = 0; i < hs.length; i++) { var hh = hs[i], dx = x - hh.x, dz = z - hh.z, r2 = dx * dx + dz * dz; h += hh.h * Math.exp(-r2 / (2 * hh.s * hh.s)); }
  return h;
}
function fldInWoods(x, z) {
  var t = __FIELD.terrain; if (!t || !t.woods) return false;
  for (var i = 0; i < t.woods.length; i++) { var w = t.woods[i]; var dx = x - w.x, dz = z - w.z; if (dx * dx + dz * dz < w.r * w.r) return true; }
  return false;
}
function fldNearWall(x, z) {
  var ws = fldWalls();
  for (var i = 0; i < ws.length; i++) {
    var w = ws[i], dx = w.x2 - w.x1, dz = w.z2 - w.z1, L2 = dx * dx + dz * dz;
    var tt = L2 ? fldClamp(((x - w.x1) * dx + (z - w.z1) * dz) / L2, 0, 1) : 0;
    var px = w.x1 + tt * dx, pz = w.z1 + tt * dz, ex = x - px, ez = z - pz;
    if ((ex * ex + ez * ez) < 26 * 26) return true;
  }
  return false;
}
// cover def multiplier (higher = safer); mirrors the base TERRAIN .def ladder spirit.
function fldCoverAt(x, z) {
  var d = 1.0;
  if (fldNearWall(x, z)) d = 1.7;
  else if (fldInWoods(x, z)) d = 1.4;
  var hs = fldHills();
  for (var i = 0; i < hs.length; i++) { var hh = hs[i], dx = x - hh.x, dz = z - hh.z; if (dx * dx + dz * dz < (hh.s * 0.7) * (hh.s * 0.7)) { d *= 1.12; break; } }
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
    commander: o.commander || null,   // B-2: the brigade's named leader (from the OOB data); labels it in the HUD
    role: o.role || null,             // B-4: a cavalry brigade's role (scout/flank/screen/raid); null/ignored for inf+art
    pow: prof.pow, rng: prof.rng, xp: o.xp || 1,
    x: o.x, z: o.z, facing: o.facing, formation: o.formation || "line",
    men: o.men, maxMen: o.men, morale: o.morale || 78, maxMor: o.morale || 78,
    fatigue: 0, ammo: 100, state: "steady",
    order: { type: "hold", tx: o.x, tz: o.z, tface: o.facing },
    targetId: null, reload: 0, rallyT: 0, ai: !!o.ai, alive: true,
    casTick: 0, underFire: 0, flankHit: 0,
  };
}
// the per-launch run reset — shared by the sandbox path and every scenario (T1+) so the
// deploy/clock/selection state is initialized in exactly ONE place (deterministic launch).
function fldResetRun() {
  __FIELD.t = 0; __FIELD.winner = null; __FIELD.holdSecs = { US: 0, CS: 0 };
  __FIELD.vis = null; __FIELD.lastSeen = {};   // fog visibility set + last-known "ghost" positions, recomputed per tick
  __FIELD._apReason = null;                     // active auto-pause: the current decision-point reason (if paused by it)
  __FIELD.routEverCount = 0; __FIELD.sel = []; __FIELD.drag = null;
  __FIELD.phase = "deploy"; __FIELD.paused = true; __FIELD.speed = 1; __FIELD.acc = 0;
  _fldAiClock = 0; _fldAiIdx = 0;   // reset the AI cadence so every launch is deterministic
  // Phase A (A1): condition the army the strategic war fielded (bridgeArmy) onto the player's units —
  // the single chokepoint shared by the sandbox / scenario / skirmish paths. No-op when campaignCtx is
  // null (every standalone launch), so the conditioning never perturbs the sandbox/Bull-Run probes.
  if (__FIELD.campaignCtx && typeof fldCampaignCondition === "function") { try { fldCampaignCondition(); } catch (e) {} }
  // officers & command (B-2): build the named field leaders for this battle (scenario cast / the appointed
  // general / a generic pair). No-op when officers are off (gate inside) -> probe baselines unperturbed.
  if (typeof fldBuildOfficers === "function") { try { fldBuildOfficers(); } catch (e) {} }
  // in-battle logistics (B-3): build the ammunition trains (no-op when logistics off / a side has no units).
  if (typeof fldBuildSupply === "function") { try { fldBuildSupply(); } catch (e) {} }
  // fog ON at launch: prime the visibility set so the DEPLOY screen already shows what is in sight
  // (matching the in-battle toggle) instead of a blacked-out field until the first sim tick.
  if (__FIELD.fog && __FIELD.units && __FIELD.units.length) fldComputeVisibility();
}
function fldInitSim(opts) {
  opts = opts || {};
  __FIELD.seed = (opts.seed || 1) >>> 0;
  // difficulty/realism presets (B-5): read G.settings.tacticalPreset -> set __FIELD.sev (the per-layer severity
  // multipliers) + aiSkill/aiResolve/aiCushion, and (only when a preset is configured) the global fog/auto-pause
  // the precedence reads below honour. Run BEFORE the fog/auto-pause precedence + the gate reads. With NO preset
  // configured (the probes never set one) it writes the NEUTRAL config and touches nothing else -> every severity
  // seam multiplies by 1.0 / adds 0 -> the 8 tactical baselines + bullrun stay BYTE-IDENTICAL. Coverage = probe-presets.
  if (typeof fldPresetsApply === "function") fldPresetsApply(opts);
  else { __FIELD.sev = { attrition: 1, canister: 1, supply: 1, cmdShock: 1, sight: 1, veteran: 1 }; __FIELD.aiSkill = 1; __FIELD.aiResolve = 1; __FIELD.aiCushion = 0; }
  // scenario seam (P1a): a non-sandbox scenario (e.g. "bullrun1") is built by a registered
  // fldScenarioInit (src/tactical/T1-*). It returns true once it has populated terrain + units
  // + the reinforcement schedule + holdToWin/timeLimit, then we early-return. The sandbox path
  // below runs verbatim/unchanged whenever scenario === "sandbox" (the default).
  var sc = opts.scenario || "sandbox"; __FIELD.scenario = sc;
  __FIELD.reinforce = null; __FIELD.holdToWin = FLD.HOLD_TO_WIN; __FIELD.timeLimit = FLD.TIME_LIMIT; __FIELD.attacker = null;
  __FIELD.scenData = null; __FIELD.defender = null; __FIELD.winBy = null;   // cleared every launch (scenario init re-sets); no stale leak into the sandbox
  // Phase A (campaign link): a campaign-launched battle carries a ctx (the bd + conditioning params);
  // null for every standalone launch -> the fldResetRun conditioning hook + the campaign end screen are
  // no-ops then (byte-behavior-identical sandbox/Bull-Run; probe-field/bullrun hold). Set by T2.
  __FIELD.campaignCtx = opts.campaign || null;
  // fog of war (P1b): a toggle. PRECEDENCE: an explicit opts.fog wins; else an explicit global setting
  // (G.settings.tacticalFog, set once the player presses V or a probe pins it) wins; else the SCENARIO default
  // applies (set in fldScenarioInit from scenData.defaultFog — First Bull Run defaults fog ON, D67: under fog the
  // stacked tactical layers keep the battle Confederate-favoured, the historically faithful result + "fog aids the
  // defender"). _fogSpecified records whether fog was pinned, so the scenario default only fills an UNSET fog.
  var _fogGlobalSet = (typeof G !== "undefined" && G.settings && G.settings.tacticalFog != null);
  __FIELD._fogSpecified = (opts.fog != null) || _fogGlobalSet;
  __FIELD.fog = (opts.fog != null) ? !!opts.fog : (_fogGlobalSet ? !!G.settings.tacticalFog : false);
  // active auto-pause (P1b): pause at decision points (a brigade breaks / is destroyed / reinforcements
  // arrive) so a low-APM player keeps up. A toggle, default ON. Lives ONLY in the RAF loop (fldAutoPauseScan),
  // so the headless probe stepper (fldStepN) never auto-pauses -> zero probe/determinism impact.
  __FIELD.autoPause = (opts.autoPause != null) ? !!opts.autoPause : !(typeof G !== "undefined" && G.settings && G.settings.tacticalAutoPause === false);
  __FIELD._apReason = null;
  // officers & command (B-2): named field leaders project a command radius (morale lift / faster rally / rout
  // resistance) and CAN BE HIT. A per-launch gate, default ON for every live launch; the sticky _officersOff
  // test hook forces it OFF — set once by the field/bullrun/fog/autopause/ai/campaign-link probes so their
  // PRE-officer baselines stay BYTE-IDENTICAL (no leaders are built, fldOfficersStep never runs, and the
  // (u.cmdBonus||0) reads in fldMoraleStep are exactly 0 -> the new layer is provably the only change).
  __FIELD.officers = __FIELD._officersOff ? false : ((opts.officers != null) ? !!opts.officers : true);
  __FIELD.leaders = [];
  // in-battle logistics (B-3): ammunition trains + resupply + exhaustion. Same per-launch gate / sticky
  // _logisticsOff test hook — the field/bullrun/fog/autopause/ai/campaign-link + officers probes set it so
  // no trains build, fldLogisticsStep / the AI override never run, and u.exhausted is never set (the
  // (u.exhausted) read in fldStepMovement stays falsy) -> those baselines remain BYTE-IDENTICAL.
  __FIELD.logistics = __FIELD._logisticsOff ? false : ((opts.logistics != null) ? !!opts.logistics : true);
  __FIELD.trains = null;
  // distinct arm roles (B-4): artillery canister/bombardment + battery doctrine; cavalry scout/flank/screen/raid;
  // the ARM melee table; the Cannon-Corps->field-battery bridge. Same per-launch gate / sticky _armsOff test hook
  // — the field/bullrun/fog/autopause/ai/campaign-link + officers + logistics probes set it so the ARM table is
  // not consulted (melee stays the 1.0 default), no canister branch fires, no role AI / raid runs, and
  // u.role/_canisterScale stay inert -> those baselines (INCLUDING bullrun1, which FIELDS Griffin/Ricketts as art
  // and Stuart as cav) remain BYTE-IDENTICAL. The gate is exactly what protects them. Coverage = probe-arms.mjs.
  __FIELD.arms = __FIELD._armsOff ? false : ((opts.arms != null) ? !!opts.arms : true);
  __FIELD._aiGenericAll = false; __FIELD._aiGenericAtk = false;   // role-aware AI test hooks: reset per launch (bug-hunt #4); probe-ai sets them AFTER launch (A/B the defender + attacker doctrines)
  if (sc !== "sandbox" && typeof fldScenarioInit === "function" && fldScenarioInit(opts)) return;
  // Phase A (A2): a custom FREE skirmish / procedural campaign battle is built by T2's fldSkirmishOOB
  // (terrain + a parameterized OOB), which calls fldResetRun and returns true. Absent opts.skirmish this
  // is a no-op and the verbatim 2-brigade sandbox below runs unchanged (probe-field byte-identical).
  if (opts.skirmish && typeof fldSkirmishOOB === "function" && fldSkirmishOOB(opts)) return;
  __FIELD.scenario = "sandbox";
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
  fldResetRun();
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
  // distinct arm roles (B-4): artillery fires CANISTER up close (a giant shotgun — devastating in the open,
  // defeated by works/woods) and a softening long-range bombardment beyond. A gated multiplier on the base fire
  // (1.0 / no-op when arms off or the shooter is not artillery -> byte-identical, incl. bullrun1's batteries).
  if (__FIELD.arms && u.arm === "art" && typeof fldArtFireMult === "function") power *= fldArtFireMult(u, tgt, d, cover);
  // difficulty/realism presets (B-5): scale the casualties by the attrition severity (1.0 = neutral = byte-identical).
  var cas = power * fr.mult * fr.frontW / cover * (0.78 + fldRng() * 0.44) * dt * (__FIELD.sev ? __FIELD.sev.attrition : 1);
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
  // distinct arm roles (B-4): the ARM melee table. When arms is ON, fldArmMelee gives the deepened values
  // (art 0.35 overrun, cav 1.4 shock / 0.9 braced, inf 1.0). When arms is OFF, fall back to the BASE engine's
  // ARM table (base.html: inf 1.00 / cav 1.05 / art 0.40) EXACTLY as the pre-B4 code did — the build concatenates
  // base + src so ARM is in scope; this fallback is what keeps the arms-OFF baselines byte-identical (the design's
  // "ARM is never defined -> 1.0" was wrong; the base table was live, and reverting to 1.0 shifted the balance).
  var meleeA = (__FIELD.arms && typeof fldArmMelee === "function") ? fldArmMelee(a, b) : (typeof ARM !== "undefined" && ARM[a.arm] ? ARM[a.arm].melee : 1.0);
  var meleeB = (__FIELD.arms && typeof fldArmMelee === "function") ? fldArmMelee(b, a) : (typeof ARM !== "undefined" && ARM[b.arm] ? ARM[b.arm].melee : 1.0);
  var atk = a.men * meleeA * (0.6 + 0.4 * a.morale / a.maxMor) * (0.9 + a.xp * 0.06);
  var def = b.men * meleeB * (0.6 + 0.4 * b.morale / b.maxMor) * (0.9 + b.xp * 0.06) * fldCoverAt(b.x, b.z);
  var ratio = atk / Math.max(1, def);
  var _att = (__FIELD.sev ? __FIELD.sev.attrition : 1);   // B-5: attrition severity (1.0 = neutral = byte-identical)
  var aCas = Math.min(a.men, FLD.MELEE_BASE * (def / Math.max(1, atk)) * (0.7 + fldRng() * 0.6) * dt * 12 * _att);
  var bCas = Math.min(b.men, FLD.MELEE_BASE * (atk / Math.max(1, def)) * (0.7 + fldRng() * 0.6) * dt * 12 * _att);
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
  if (__FIELD.lastSeen) delete __FIELD.lastSeen[u.id];   // a destroyed unit leaves no fog "ghost" (it's gone, not merely unseen)
  fldAnnounce(u.name + " is destroyed.");
}
// moraleCheck shape (base ~1015): drop ~ sev*60/rally; rout when below threshold.
function fldMoraleStep(u, dt) {
  if (!u.alive) return;
  // difficulty/realism presets (B-5): _vet = experience weight (1.0 = neutral), _cu = a PLAYER-side morale cushion
  // (> 0 only at the easiest AI tier), _ar = the AI-unit resilience multiplier (<= 1.0 — a handicap, never a buff).
  // ALL neutral (1 / 0 / 1) when no preset -> every term below is byte-identical. The cushion/resolve only ever
  // touch live play (a probe AI-vs-AI run is autoBoth, so !u.ai is false and _ar is 1 unless a preset is set).
  var _vet = (__FIELD.sev ? __FIELD.sev.veteran : 1), _cu = (__FIELD.aiCushion || 0), _ar = (__FIELD.aiResolve == null ? 1 : __FIELD.aiResolve);
  var rally = 1 + u.xp * 0.12 * _vet;                   // leader/veteran rally proxy
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
    if (safe) {
      var _rec = FLD.MOR_RECOVER * (1 + 0.4 * (u.cmdBonus || 0)) * dt;   // B-2: a general's presence speeds recovery (moderated — §27: meaningful, not dominant)
      if (u.ai) { if (_ar !== 1) _rec *= _ar; }                          // B-5: an AI brigade recovers slower at the easy tiers (brittler — a handicap, never a buff: _ar <= 1)
      else if (_cu) _rec += FLD.MOR_RECOVER * _cu * dt;                  // B-5: the Recruit player cushion — your men steady faster
      u.morale += _rec;
    }
  }
  // B-2 command presence: a leader in radius steadies the troops (a small passive lift; 0 when out of command / officers off)
  if (u.cmdBonus) u.morale += 0.3 * u.cmdBonus * dt;
  u.morale = fldClamp(u.morale, 0, u.maxMor);
  // (4) state machine + rout roll
  var routThresh = FLD.ROUT_THRESH - u.xp * 1.5 * _vet; // veterans hold longer (base; B-5 experience weight, 1.0 = neutral)
  if (u.state === "routing") {
    // rally if it reached safety + held for RALLY_SECS
    var danger = false;
    for (var k = 0; k < __FIELD.units.length; k++) {
      var en = __FIELD.units[k];
      if (en.side === u.side || !en.alive) continue;
      if (fldDist(en, u) < FLD.RALLY_R) { danger = true; break; }
    }
    if (!danger) { u.rallyT += dt; var _need = FLD.RALLY_SECS / (1 + 0.4 * (u.cmdBonus || 0)); if (u.rallyT >= _need) { u.state = "wavering"; u.morale = Math.max(u.morale, 30); u.rallyT = 0; fldAnnounce(u.name + " rallies."); } }   /* B-2: a leader near a routed unit rallies it sooner */
    else u.rallyT = 0;
    return;
  }
  if (u.morale < routThresh) {
    var _saveBase = (0.5 + 0.12 * (u.cmdBonus || 0)) * rally;   // B-2: a general in command stiffens resolve against the rout (moderated + capped — never total immunity)
    if (u.ai) { if (_ar !== 1) _saveBase *= _ar; }              // B-5: AI brigades break sooner at the easy tiers (_ar <= 1 -> easier, never a cheat)
    else if (_cu) _saveBase += _cu * 0.3;                       // B-5: the Recruit player cushion vs the rout
    var save = Math.min(0.95, _saveBase);
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
    if (u.exhausted) spd *= 0.62;   // B-3: a SPENT brigade can barely drag itself forward (set only when logistics on -> falsy/byte-identical otherwise)
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
/* ---------------------------------------------------------------------------
   FOG OF WAR  (P1b — a toggle, default OFF). Per-side line-of-sight visibility:
   an enemy is seen only when a friendly unit is within sight range with a clear
   line (woods block sight); cavalry scout widest. Drives AI/targeting/render.
   fldVisible() short-circuits true when fog is OFF -> every caller is a no-op then.
   --------------------------------------------------------------------------- */
function fldUnitSight(u) { var _b = u.arm === "cav" ? FLD.SIGHT_CAV : (u.arm === "art" ? FLD.SIGHT_ART : FLD.SIGHT_INF); return _b * (__FIELD.sev ? __FIELD.sev.sight : 1); }   /* B-5: scouting/LOS range severity (1.0 = neutral = byte-identical) */
function fldLosClear(ax, az, bx, bz) {
  // EXACT segment-vs-woods test: sum the length of the sight line that lies inside any woods disk;
  // block only when the line penetrates more than WOODS_SEE_THRU yards of timber. This is robust where
  // a fixed-sample walk failed both ways — a thin grazing chord stays visible (short penetration) and a
  // line straight through a woods is blocked (long penetration); two units in the SAME woods close
  // together still see each other (short chord). O(woods) per call, no RNG.
  var t = __FIELD.terrain; if (!t || !t.woods) return true;
  var dx = bx - ax, dz = bz - az, segLen = Math.sqrt(dx * dx + dz * dz);
  if (segLen < 1e-6) return true;
  var inside = 0;
  for (var i = 0; i < t.woods.length; i++) {
    var w = t.woods[i], fx = ax - w.x, fz = az - w.z;
    // |P0 + t*D - C|^2 = r^2  ->  A t^2 + B t + Cc = 0, t in [0,1]
    var A = dx * dx + dz * dz, B = 2 * (fx * dx + fz * dz), Cc = fx * fx + fz * fz - w.r * w.r;
    var disc = B * B - 4 * A * Cc; if (disc <= 0) continue;
    var sq = Math.sqrt(disc), t0 = (-B - sq) / (2 * A), t1 = (-B + sq) / (2 * A);
    if (t0 < 0) t0 = 0; if (t1 > 1) t1 = 1; if (t1 > t0) inside += (t1 - t0) * segLen;
    if (inside > FLD.WOODS_SEE_THRU) return false;
  }
  return inside <= FLD.WOODS_SEE_THRU;
}
function fldComputeVisibility() {
  var vis = { US: {}, CS: {} }, U = __FIELD.units, i, j;
  for (i = 0; i < U.length; i++) {
    var e = U[i]; if (!e.alive) continue; var foe = fldEnemy(e.side);
    // is e visible to its foe? -> some alive foe-unit within sight + clear LOS
    for (j = 0; j < U.length; j++) {
      var o = U[j]; if (o.side !== foe || !o.alive) continue;
      if (fldDist(o, e) <= fldUnitSight(o) && fldLosClear(o.x, o.z, e.x, e.z)) { vis[foe][e.id] = 1; break; }
    }
    if (vis[foe][e.id]) __FIELD.lastSeen[e.id] = { x: e.x, z: e.z, facing: e.facing, formation: e.formation, men: e.men, maxMen: e.maxMen, side: e.side };
  }
  __FIELD.vis = vis;
}
// can `side` see `target` right now? Always true with fog OFF (the no-op fast path).
function fldVisible(side, target) {
  if (!__FIELD.fog) return true;
  var v = __FIELD.vis && __FIELD.vis[side];
  return !!(v && v[target.id]);
}
function fldAcquireTarget(u) {
  if (!u.alive || u.state === "routing" || u.ammo <= 0) { u.targetId = null; return; }
  var best = null, score = -1;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var e = __FIELD.units[i]; if (e.side === u.side || !e.alive) continue;
    if (__FIELD.fog && !fldVisible(u.side, e)) continue;   // can't fire at what you can't see
    var d = fldDist(u, e); if (d > u.rng) continue;
    // prefer closer + weaker + flank-exposed targets
    var fr = fldFrontageExposed(u, e);
    var s = (u.rng - d) / u.rng * 1.0 + fr.mult * 0.4 + (1 - e.men / e.maxMen) * 0.5;
    // distinct arm roles (B-4): arm-aware target preference (artillery -> dense/exposed canister fodder; cavalry ->
    // disordered/flanked). Returns 0 for infantry AND when arms off -> infantry/baseline targeting is byte-identical.
    if (__FIELD.arms && typeof fldArmTargetBias === "function") s += fldArmTargetBias(u, e, d, fr);
    if (s > score) { score = s; best = e; }
  }
  u.targetId = best ? best.id : null;
}
function fldById(id) { for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].id === id) return __FIELD.units[i]; return null; }

function fldAiUnit(u) {
  if (!u.alive || u.state === "routing" || !u.ai) return;
  // in-battle logistics (B-3): a low-ammo brigade not under assault falls back to its train to refill — this
  // OVERRIDES the normal doctrine for that brigade (returns true). No-op when logistics off (byte-identical).
  if (__FIELD.logistics && typeof fldLogisticsAiUnit === "function" && fldLogisticsAiUnit(u)) return;
  // distinct arm roles (B-4): artillery + cavalry run their OWN doctrines (battery stand/displace; cavalry
  // scout/flank/screen/raid), OVERRIDING the infantry doctrine for those arms. No-op when arms off OR the unit is
  // infantry (returns false -> falls through to the existing generic/attacker/defender doctrines, byte-identical).
  if (__FIELD.arms && typeof fldArmsAiUnit === "function" && fldArmsAiUnit(u)) return;
  // ROLE-AWARE AI (P1b-iii): in an ASYMMETRIC scenario (attacker set) the DEFENDER holds ground + cover
  // and counterattacks disordered attackers instead of advancing off its good ground like an attacker.
  // The symmetric SANDBOX (attacker === null) runs fldAiGeneric for BOTH sides -> byte-behavior-identical
  // (probe-field holds by construction). The defender lives in the same headless sim path -> probe-testable.
  // P1b-iv: the ATTACKER side now runs fldAiAttacker (concentrate / close / assault, fog-cautious). Test-only
  // hooks (default falsy, reset per launch, set only by probe-ai for A/B isolation): _aiGenericAll forces
  // generic for BOTH; _aiGenericAtk forces generic for the ATTACKER only (to isolate the attacker doctrine).
  if (!__FIELD._aiGenericAll && __FIELD.attacker && __FIELD.objective) {
    if (u.side === fldEnemy(__FIELD.attacker)) { fldAiDefender(u); return; }
    if (u.side === __FIELD.attacker && !__FIELD._aiGenericAtk) { fldAiAttacker(u); return; }
  }
  fldAiGeneric(u);
}
/* the GENERIC doctrine: advance toward the objective, halt at good fire range, press a wavering enemy.
   Used by BOTH sides in the sandbox and by the ATTACKER in a scenario. (Unchanged from P0/P1a.) */
function fldAiGeneric(u) {
  var obj = __FIELD.objective;
  // nearest enemy
  var near = null, nd = 1e9, weakNear = null, wd = 1e9;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var e = __FIELD.units[i]; if (e.side === u.side || !e.alive) continue;
    if (__FIELD.fog && !fldVisible(u.side, e)) continue;   // AI reacts only to enemies it can see
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

/* the ATTACKER doctrine (asymmetric scenario only — see fldAiUnit; P1b-iv, DECISIONS D64). A covered defender
   wins a long-range fire trade, so the attacker CONCENTRATES on the objective's weaker (thinner) flank,
   CLOSES, and ASSAULTS with the bayonet (melee + numbers beat fire + cover). Two design locks (charter fork #2):
   (a) GRADUAL commitment — the assault is a PER-UNIT, LOCAL-concentration decision (a unit assaults once it has
       CLOSED on the objective AND locally out-masses the VISIBLE defenders it faces), with the local bar
       modulated SMOOTHLY by the global force ratio + a global floor — NOT a knife-edge "commit the whole army
       at ratio R" flip (the prototype's phase transition). The army commits incrementally as it masses.
   (b) FOG AIDS THE DEFENDER (consistent with D58) — UNDER FOG the attacker NEVER launches a massed assault
       on a position (it can't trust its sight: a hidden reverse-slope reserve or rail-borne brigade may hold
       the hill) and never column-rushes; it advances cautiously in LINE, trades fire / probes, and only
       exploits a VISIBLE BROKEN unit. So fog denies it the unseen-close melee win and lets the concealed
       reserves maul the piecemeal advance — the attacker never BENEFITS from fog. (This gates on fog DIRECTLY,
       not on whether a defender is currently sighted: a lone visible picket must not "unblind" an assault into
       the hidden mass behind it — bug-hunt P1b-iv #1.) Deterministic — no RNG (probes reproduce). */
function fldAiAttacker(u) {
  var obj = __FIELD.objective;
  // scan VISIBLE defenders: nearest, nearest CATCHABLE-disordered (wavering only — a rout outruns a charge),
  // local force balance (within AI_LOCAL_R), and the flank split (men left/right of the objective).
  var near = null, nd = 1e9, weak = null, wd = 1e9, foeMen = 0, friendMen = u.men, defLeft = 0, defRight = 0;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var e = __FIELD.units[i]; if (!e.alive) continue;
    if (e.side === u.side) { if (e !== u && e.state !== "routing" && fldDist(u, e) < FLD.AI_LOCAL_R) friendMen += e.men; continue; }
    if (__FIELD.fog && !fldVisible(u.side, e)) continue;   // react only to what it can see
    var d = fldDist(u, e);
    if (d < FLD.AI_LOCAL_R) foeMen += e.men;
    if (d < nd) { nd = d; near = e; }
    if (e.state === "wavering" && d < wd) { wd = d; weak = e; }
    if (e.x < obj.x) defLeft += e.men; else defRight += e.men;
  }
  var face = near ? Math.atan2(near.x - u.x, -(near.z - u.z)) : Math.atan2(0, -(obj.z - u.z));
  var dObj = fldDist(u, obj);
  // (a) GRADUAL local-concentration commit. The global ratio modulates the LOCAL bar smoothly (ahead -> press
  //     at lower local odds; behind -> demand more); a global FLOOR forbids the bayonet while badly outnumbered.
  var atkTot = fldArmyStrength(u.side), defTot = fldArmyStrength(fldEnemy(u.side));
  var globRatio = atkTot / Math.max(1, defTot);
  // B-5 AI sharpness: a sharper AI commits with slightly less local superiority (lower bar). aiSkill 1.0 = neutral
  // -> FLD.ATK_LOCAL_RATIO / 1.0 is exactly the constant -> byte-identical. Bounded; only differs when a preset is set.
  var effLocal = FLD.ATK_LOCAL_RATIO / (__FIELD.aiSkill || 1) * fldClamp(1 / Math.max(0.5, globRatio), 0.75, 1.4);
  var localSup = foeMen > 0 && friendMen >= foeMen * effLocal;     // must SEE the foe AND locally out-mass it
  var canCommit = globRatio >= FLD.ATK_GLOBAL_FLOOR;

  // (1) SURVIVAL: wavering + a stronger enemy close -> fall back to rally (an assault can break too).
  if (u.state === "wavering" && near && nd < 220 && near.men > u.men * 1.05) {
    u.order = { type: "move", tx: u.x, tz: (fldHomeEdgeZ(u.side) > FLD.FIELD_H ? FLD.FIELD_H - 120 : 120), tface: face };
    return;
  }
  // (2) ASSAULT: charge a VISIBLE disordered defender on sight (safe under fog too — it's a confirmed broken
  //     unit, not a blind rush); OR — ONLY WITH FOG OFF — press the bayonet home on a steady defender once
  //     CLOSED on the objective with LOCAL superiority + the global floor. Under fog the massed assault is
  //     withheld (b): the attacker cannot trust its sight of the position, so it will not commit blind.
  if (u.state !== "wavering" && near) {
    var chargeWeak = weak && wd < FLD.ATK_CHARGE_R;
    var assaultSteady = !__FIELD.fog && canCommit && localSup && nd < FLD.ATK_ASSAULT_R && dObj < obj.r + FLD.ATK_ASSAULT_STANDOFF;
    if (chargeWeak || assaultSteady) {
      var t = chargeWeak ? weak : near;
      u.order = { type: "charge", tx: t.x, tz: t.z, tface: Math.atan2(t.x - u.x, -(t.z - u.z)) };
      return;
    }
  }
  // (3) SUPPRESS / PROBE: in fire range but not assaulting (under fog, or no local superiority yet) -> hold +
  //     pour fire in LINE while the mass forms (don't bleed forward piecemeal, don't retreat). Under fog this
  //     is the cautious probe that lets the concealed reserves reveal + keeps the fight slow (fog aids defender).
  if (near && nd <= u.rng * 0.92 && (__FIELD.fog || !localSup || !canCommit)) {
    u.formation = "line";
    u.order = { type: "hold", tx: u.x, tz: u.z, tface: face };
    return;
  }
  // (4) CLOSE on the weaker (thinner) flank. An ASSAULT COLUMN (fast SPD_COL, narrow 0.7 head-on frontage)
  //     crosses the killing zone with far less loss — but ONLY with FOG OFF when committed; under fog the
  //     attacker closes cautiously in LINE (no unseen-column rush — that is what made fog favor the attacker).
  var flankX = (defLeft <= defRight) ? (obj.x - obj.r * 0.6) : (obj.x + obj.r * 0.6);
  var aimX = u.x + (flankX - u.x) * FLD.ATK_FLANK_BIAS;
  var sign = (fldHomeEdgeZ(u.side) > obj.z) ? 1 : -1;     // press onto the attacker-side face of the objective
  var aimZ = obj.z + sign * obj.r * 0.25;
  u.formation = (!__FIELD.fog && canCommit && dObj > 160) ? "column" : "line";
  u.order = { type: "move", tx: aimX, tz: aimZ, tface: face };
}

/* the DEFENDER doctrine (asymmetric scenario only — see fldAiUnit). A defender HOLDS the objective's
   forward face in cover and makes the attacker assault uphill; a forward delaying unit fights to buy
   time then withdraws when locally outnumbered; a rear reinforcement marches up to the line; a steady
   unit counterattacks a disordered attacker that has closed on the hill (the melee code then returns
   it to hold). Deterministic — no RNG — so probes reproduce. This is the historical Henry House Hill
   defense AND the lever that answers the logged "AI leans Union" gap (cover + delay + counterattack). */
function fldAiDefender(u) {
  var obj = __FIELD.objective, att = __FIELD.attacker;
  // scan VISIBLE enemies: nearest, nearest CATCHABLE-disordered, and the local force balance within AI_LOCAL_R.
  // weak tracks WAVERING only — a routing unit flees at SPD_ROUT (62) faster than a charge marches (SPD_LINE
  // 30), so chasing a rout can never make contact and only walks the defender off its ground (bug-hunt #3).
  var near = null, nd = 1e9, weak = null, wd = 1e9, foeMen = 0, friendMen = u.men;
  for (var i = 0; i < __FIELD.units.length; i++) {
    var e = __FIELD.units[i]; if (!e.alive) continue;
    if (e.side === u.side) { if (e !== u && e.state !== "routing" && fldDist(u, e) < FLD.AI_LOCAL_R) friendMen += e.men; continue; }
    if (__FIELD.fog && !fldVisible(u.side, e)) continue;   // react only to what it can see (fog aids the defender)
    var d = fldDist(u, e);
    if (d < FLD.AI_LOCAL_R) foeMen += e.men;
    if (d < nd) { nd = d; near = e; }
    if (e.state === "wavering" && d < wd) { wd = d; weak = e; }
  }
  var face = near ? Math.atan2(near.x - u.x, -(near.z - u.z)) : Math.atan2(0, -(fldHomeEdgeZ(att) - u.z));
  // STABLE defensive frame (bug-hunt #1/#2): the engine models the two armies on the +z / -z home edges, so
  // the approach axis is z and the lateral frontage axis is world x. Deriving the frame from the MOMENTARY
  // nearest-enemy bearing collapsed the line onto one point on a flank threat (Chinn Ridge) and flipped the
  // forward/behind gate when an attacker crossed the crest (stranding rear reserves). fwdSign points from the
  // crest toward the attacker's home edge and never rotates; `face` still tracks the threat (we aim, not move).
  var fwdSign = (fldHomeEdgeZ(att) > obj.z) ? 1 : -1;
  var lane = fldClamp(u.x - obj.x, -obj.r * FLD.DEF_LANE, obj.r * FLD.DEF_LANE);   // this unit's stable lateral slot
  var proj = (u.z - obj.z) * fwdSign;                                              // signed distance forward of the crest
  var holdDist = obj.r * FLD.DEF_FACE_FRAC;
  // a hold point at this unit's lane on the forward face (faceFrac>0) or the reverse slope (faceFrac<0),
  // CLAMPED inside the objective control radius so a holding defender actually DENIES the objective rather
  // than parking up to ~237yd outside the 140yd ring it is meant to hold (bug-hunt #5).
  function fldDefHold(faceFrac) {
    var hx = obj.x + lane, hz = obj.z + fwdSign * obj.r * faceFrac;
    var hd = Math.sqrt((hx - obj.x) * (hx - obj.x) + (hz - obj.z) * (hz - obj.z));
    if (hd > obj.r) { var sc = obj.r / hd; hx = obj.x + (hx - obj.x) * sc; hz = obj.z + (hz - obj.z) * sc; }
    return { x: hx, z: hz };
  }

  // (1) SURVIVAL: wavering with a stronger enemy close -> a fighting withdrawal to the reverse slope (behind
  //     the crest), still facing the threat so it can rally and rejoin — not a deep flight off the field.
  if (u.state === "wavering" && near && nd < 240 && near.men > u.men * 1.05) {
    var rs = fldDefHold(-0.5);
    u.formation = "line"; u.order = { type: "move", tx: rs.x, tz: rs.z, tface: face };
    return;
  }
  // (2) COUNTERATTACK: steady + a CATCHABLE (wavering) enemy within reach that has closed on the hill +
  //     local parity-or-better -> charge. The DUAL leash (the target AND the defender's OWN position both
  //     bounded near the objective) keeps the defender from being walked off the ground it denies (#3/#6).
  var _sk = (__FIELD.aiSkill || 1);   // B-5 AI sharpness: a sharper defender counterattacks on a slightly longer leash + lower local-odds bar (1.0 = neutral = byte-identical)
  if (weak && u.state === "steady" && wd < FLD.CTR_REACH && fldDist(weak, obj) < obj.r + FLD.CTR_LEASH * _sk
      && fldDist(u, obj) < obj.r + FLD.CTR_LEASH * 0.5 * _sk && friendMen >= foeMen * FLD.CTR_RATIO / _sk) {
    u.order = { type: "charge", tx: weak.x, tz: weak.z, tface: Math.atan2(weak.x - u.x, -(weak.z - u.z)) };
    return;
  }
  // (3) DELAY: a unit FORWARD of the line (the delaying force) holds its ground and fights to buy time;
  //     it falls back to the line only when locally outnumbered (a pressed withdrawal, not a rout).
  if (proj > holdDist + FLD.DEF_HOLD_TOL) {
    u.formation = "line";
    if (foeMen > 0 && friendMen < foeMen * FLD.DEF_FALLBACK_RATIO) { var fp = fldDefHold(FLD.DEF_FACE_FRAC); u.order = { type: "move", tx: fp.x, tz: fp.z, tface: face }; }
    else u.order = { type: "hold", tx: u.x, tz: u.z, tface: face };
    return;
  }
  // (4) ADVANCE TO THE LINE: a rear unit (a fresh reinforcement behind the crest) marches up to the hold line.
  if (proj < holdDist - FLD.DEF_HOLD_TOL) {
    var ap = fldDefHold(FLD.DEF_FACE_FRAC);
    u.formation = (fldDist(u, ap) > 280) ? "column" : "line";
    u.order = { type: "move", tx: ap.x, tz: ap.z, tface: face };
    return;
  }
  // (5) HOLD THE LINE: on the forward face in cover, face the threat, pour fire — never advance into the open.
  var hp = fldDefHold(FLD.DEF_FACE_FRAC);
  u.formation = "line"; u.order = { type: "hold", tx: hp.x, tz: hp.z, tface: face };
}

/* ===========================================================================
   THE SIM STEP  (one fixed tick)
   =========================================================================== */
var _fldAiClock = 0, _fldAiIdx = 0;
function fldSimStep(dt) {
  if (__FIELD.phase !== "battle") return;
  __FIELD.t += dt;
  // scenario seam (P1a): per-tick reinforcement schedule (keyed on sim-time __FIELD.t).
  // Null for the sandbox (no reinforcements) -> this is a no-op on the sandbox path.
  if (__FIELD.reinforce && typeof fldScenarioTick === "function") fldScenarioTick(dt);
  // fog of war (P1b): recompute per-side visibility before AI/targeting consult it (no-op when fog OFF).
  if (__FIELD.fog) fldComputeVisibility();
  // in-battle logistics (B-3): refill cartridge boxes from the trains + flag low-ammo / spent BEFORE the AI
  // (so the resupply doctrine sees the fresh flags) and BEFORE fire (so a refilled brigade can volley this tick).
  if (__FIELD.logistics && typeof fldLogisticsStep === "function") fldLogisticsStep(dt);
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
  // distinct arm roles (B-4): decay the muzzle-flash/charge visual timers + apply the cavalry RAID on an enemy
  // ammunition train (the B-3 tie). No-op when arms off (byte-identical) / no trains.
  if (__FIELD.arms && typeof fldArmsStep === "function") fldArmsStep(dt);
  // officers & command (B-2): ride leaders to the line, apply the command aura (u.cmdBonus), accrue the
  // leader exposure-hazard + any general-down shock — all BEFORE morale, so this tick's morale resolution
  // reflects them. No-op when officers are off (fldOfficersStep early-returns; u.cmdBonus stays unset -> 0).
  if (__FIELD.officers && typeof fldOfficersStep === "function") fldOfficersStep(dt);
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
// pending (scheduled-but-not-yet-arrived) reinforcements for a side. 0 for the sandbox
// (reinforce === null) -> the collapse checks below behave exactly as the pre-seam engine.
function fldArmyPending(side) {
  var r = __FIELD.reinforce; if (!r) return 0;
  var n = 0; for (var i = 0; i < r.length; i++) { if (!r[i].done && r[i].spec && r[i].spec.side === side) n++; } return n;
}
// is a side eliminated? Never while reinforcements are still detraining. In a SCENARIO a routing
// line is alive and can still rally, so the side is gone only when NO live men remain; the SANDBOX
// keeps its original routing-counts-as-gone rule (byte-identical to the pre-seam engine).
function fldGoneCheck(side) {
  if (fldArmyPending(side) > 0) return false;
  if (__FIELD.attacker) {
    for (var i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i]; if (u.side === side && u.alive) return false; }
    return true;
  }
  return fldArmyLive(side) === 0;
}
function fldCheckVictory() {
  if (__FIELD.phase !== "battle") return;
  var w = null, by = null;
  var usGone = fldGoneCheck("US"), csGone = fldGoneCheck("CS");
  if (usGone && !csGone) { w = "CS"; by = "destroy"; }
  else if (csGone && !usGone) { w = "US"; by = "destroy"; }
  else if (usGone && csGone) { w = "draw"; by = "destroy"; }
  else if (__FIELD.attacker) {
    // ASYMMETRIC (scenario): only the ATTACKER wins by seizing-and-holding the objective; the
    // DEFENDER wins by denying it to the time limit (the historical attacker-must-take-the-hill shape).
    var att = __FIELD.attacker, def = fldEnemy(att);
    if (__FIELD.holdSecs[att] >= __FIELD.holdToWin) { w = att; by = "hold"; }
    else if (__FIELD.t >= __FIELD.timeLimit) { w = def; by = "timeout"; }
  } else {
    // SYMMETRIC (sandbox): either side can win by holding the crest, else strength at the time limit.
    if (__FIELD.holdSecs.US >= __FIELD.holdToWin) { w = "US"; by = "hold"; }
    else if (__FIELD.holdSecs.CS >= __FIELD.holdToWin) { w = "CS"; by = "hold"; }
    else if (__FIELD.t >= __FIELD.timeLimit) {
      var sU = fldArmyStrength("US"), sC = fldArmyStrength("CS");
      w = sU > sC * 1.05 ? "US" : (sC > sU * 1.05 ? "CS" : "draw"); by = "timeout";
    }
  }
  if (w) { __FIELD.winner = w; __FIELD.winBy = by; __FIELD.phase = "over"; fldOnOver(); }
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
  // Phase A: a campaign-launched battle sets _returnFn (-> the bridge briefing) so a non-silent exit
  // (Esc / Exit before the battle ends) drops back into the campaign, re-launchable, instead of the main
  // menu; cleared here so it never leaks into a later standalone launch. Default stays openMainMenu.
  var _ret = __FIELD._returnFn; __FIELD._returnFn = null; __FIELD.campaignCtx = null;
  if (!silent) { try { if (typeof _ret === "function") _ret(); else if (typeof openMainMenu === "function") openMainMenu(); } catch (e) {} }
}
function fldBuildDom() {
  /* wcag-auditor: inject :focus-visible styles for all tactical buttons (WCAG 2.4.7 / 2.4.11).
     Inline-styled buttons have no explicit outline suppression, but browser defaults vary in
     contrast on dark backgrounds. Explicit ring (#e8c84a, 11:1 vs #10141a) guarantees AA. */
  if (!document.getElementById("fldFocusStyle")) {
    var st = document.createElement("style");
    st.id = "fldFocusStyle";
    st.textContent = "#fldBar button:focus-visible,#fldEnd button:focus-visible,#fldBrief button:focus-visible{outline:2px solid #e8c84a;outline-offset:2px;}";
    document.head.appendChild(st);
  }
  var r = document.createElement("div");
  r.id = "fldRoot";
  r.style.cssText = "position:fixed;inset:0;z-index:5000;background:#10141a;overflow:hidden;font-family:Georgia,serif;color:#f2e8d5;";
  r.innerHTML =
    '<canvas id="fldGl" style="position:absolute;inset:0;width:100%;height:100%;display:block;"></canvas>' +
    '<div id="fldTop" style="position:absolute;top:0;left:0;right:0;padding:8px 12px;display:flex;gap:10px;align-items:center;background:linear-gradient(#000a,#0000);pointer-events:none;">' +
      '<b id="fldTitle" style="letter-spacing:1px;">&#9876; TACTICAL SANDBOX</b><span id="fldClock" style="opacity:.85;">0:00</span>' +
      '<span id="fldObj" style="opacity:.85;">Objective: contested</span><span style="flex:1"></span>' +
      '<span id="fldPhase" style="opacity:.85;"></span>' +
    '</div>' +
    '<div id="fldHud" role="region" aria-label="Selected unit" style="position:absolute;left:12px;bottom:12px;min-width:240px;max-width:320px;background:#0c0f14e6;border:1px solid #745e3f;border-radius:6px;padding:10px 12px;font-size:13px;"></div>'/* wcag-auditor: contrast fix #4a3c28->#745e3f border on #0c0f14/#10141a (was 1.80:1, now 3.12/3.00:1) WCAG 1.4.11 */ +
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
    ["fldBtnFog", "Fog: " + (__FIELD.fog ? "On" : "Off"), "Toggle fog of war — line-of-sight scouting (V)"],
    ["fldBtnAuto", "Auto-pause: " + (__FIELD.autoPause ? "On" : "Off"), "Toggle active auto-pause at key moments (P)"],
    ["fldBtnSettings", "&#9881; Settings", "Battle settings — fog, auto-pause, speed & difficulty (G)"],
    ["fldBtnExit", "Exit", "Leave the sandbox (Esc)"],
  ];
  for (var i = 0; i < btns.length; i++) {
    var b = document.createElement("button");
    b.id = btns[i][0]; b.innerHTML = btns[i][1]; b.title = btns[i][2]; b.setAttribute("aria-label", btns[i][2]);
    if (btns[i][0] === "fldBtnFog") b.setAttribute("aria-pressed", String(!!__FIELD.fog));   // a toggle button: convey on/off state to AT
    if (btns[i][0] === "fldBtnAuto") b.setAttribute("aria-pressed", String(!!__FIELD.autoPause));
    b.style.cssText = "background:#1c1610;color:#e9dcc0;border:1px solid #766040;border-radius:4px;padding:7px 11px;font:13px Georgia,serif;cursor:pointer;"; /* wcag-auditor: contrast fix #4a3c28->#766040 border on #1c1610/#10141a (was 1.68/1.73:1, now 3.00/3.09:1) WCAG 1.4.11 */
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
function fldCountAlive() { var n = 0; for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].alive) n++; return n; }
// active auto-pause: after a live-loop sim advance, pause once on a decision-point event (lives in the RAF
// loop only, so the headless fldStepN never triggers it). Priority: a break, then a destroyed brigade,
// then arriving reinforcements. Announces (aria-live) + surfaces the reason in the phase indicator.
function fldAutoPauseScan(prevRouts, prevAlive, prevN) {
  if (__FIELD.paused) return;
  // detect EVERY decision-point event this frame (a frame can advance up to 16 ticks). Reinforcements
  // only ever push ALIVE units, so kills-this-frame = prevAlive - (aliveNow - spawned) — robust to a
  // same-frame spawn masking a death in the net headcount. Report all reasons; keep priority for the label.
  var spawned = __FIELD.units.length - prevN, killed = prevAlive - (fldCountAlive() - spawned), reasons = [];
  if (__FIELD.routEverCount > prevRouts) reasons.push("A brigade has broken");
  if (killed > 0) reasons.push("A brigade is destroyed");
  if (spawned > 0) reasons.push("Reinforcements arrive");
  if (!reasons.length) return;
  __FIELD.paused = true; __FIELD._apReason = reasons[0];
  var b = document.getElementById("fldBtnPlay"); if (b) { b.innerHTML = "&#9654; Resume"; b.setAttribute("aria-label", "Resume — auto-paused: " + reasons.join("; ")); }
  fldAnnounce("Auto-paused — " + reasons.join("; ") + ". Press Space to resume.");
}
function fldToggleAutoPause() {
  __FIELD.autoPause = !__FIELD.autoPause;
  try { if (typeof G !== "undefined") { G.settings = G.settings || {}; G.settings.tacticalAutoPause = __FIELD.autoPause; } } catch (e) {}
  var b = document.getElementById("fldBtnAuto"); if (b) { b.innerHTML = "Auto-pause: " + (__FIELD.autoPause ? "On" : "Off"); b.setAttribute("aria-pressed", String(__FIELD.autoPause)); }
  // turning the feature OFF while it is actively holding the battle paused must RELEASE that pause
  // (otherwise the most-likely escape control doesn't escape).
  if (!__FIELD.autoPause && __FIELD._apReason) {
    __FIELD.paused = false; __FIELD._apReason = null;
    var pb = document.getElementById("fldBtnPlay"); if (pb) { pb.innerHTML = "&#10074;&#10074; Pause"; pb.setAttribute("aria-label", "Begin / pause the battle (Space)"); }
  }
  fldAnnounce(__FIELD.autoPause ? "Active auto-pause ON — the battle pauses at key moments." : "Active auto-pause OFF.");
}
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
      // snapshot for active auto-pause (live loop only — never from the headless fldStepN)
      var apOn = __FIELD.autoPause, apR0 = 0, apA0 = 0, apN0 = 0;
      if (apOn) { apR0 = __FIELD.routEverCount; apA0 = fldCountAlive(); apN0 = __FIELD.units.length; }
      __FIELD.acc += dt * __FIELD.speed;
      var guard = 0;
      while (__FIELD.acc >= FLD.FIXED_DT && guard < 16) { fldSimStep(FLD.FIXED_DT); __FIELD.acc -= FLD.FIXED_DT; guard++; }
      if (apOn && __FIELD.phase === "battle") fldAutoPauseScan(apR0, apA0, apN0);
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
  var ti = document.getElementById("fldTitle");
  if (ti) { var wantT = (__FIELD.scenData && __FIELD.scenData.name) ? ("⚔ " + __FIELD.scenData.name) : "⚔ TACTICAL SANDBOX"; if (ti.textContent !== wantT) ti.textContent = wantT; }
  var o = document.getElementById("fldObj");
  if (o) {
    var hU = __FIELD.holdSecs.US, hC = __FIELD.holdSecs.CS, lead;
    if (__FIELD.attacker) {
      // asymmetric: only the attacker's hold progresses toward a win; the defender is denying.
      var att = __FIELD.attacker, hA = Math.floor(__FIELD.holdSecs[att]), an = att === "US" ? "Union" : "Confederate";
      lead = hA > 0 ? (an + " holds " + hA + "s/" + __FIELD.holdToWin) : "must be seized";
    } else {
      lead = hU > hC + 0.5 ? "Union holds " + Math.floor(hU) + "s/" + __FIELD.holdToWin : (hC > hU + 0.5 ? "Confederate holds " + Math.floor(hC) + "s/" + __FIELD.holdToWin : "contested");
    }
    o.textContent = "Objective: " + lead;
  }
  var p = document.getElementById("fldPhase");
  if (p) p.textContent = __FIELD.phase === "deploy" ? "Press Begin (Space) to advance" : (__FIELD.paused ? ("⏸ " + (__FIELD._apReason ? __FIELD._apReason + " — Space to resume" : "PAUSED")) : (__FIELD.speed + "×"));
  // fog: keep the no-selection "N Rebel brigades sighted" HUD line live as scouting changes (throttled ~3x/sec)
  if (__FIELD.fog) { __FIELD._hudTick = (__FIELD._hudTick || 0) + 1; if (__FIELD._hudTick % 20 === 0 && !fldPlayerSel().length) fldRenderHud(); }
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
  setTimeout(function () { try { if (!document.getElementById("fldBrief")) document.getElementById("fldRoot").focus(); } catch (e) {} }, 30);
  var w = function (id, fn) { var el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
  w("fldBtnPlay", function () { fldTogglePlay(); });
  w("fldBtnSpd", function () { fldCycleSpeed(); });
  w("fldBtnLine", function () { fldSetFormation("line"); });
  w("fldBtnCol", function () { fldSetFormation("column"); });
  w("fldBtnCharge", function () { fldSelCharge(); });
  w("fldBtnHold", function () { fldSelHold(); });
  w("fldBtnFog", function () { fldToggleFog(); });
  w("fldBtnAuto", function () { fldToggleAutoPause(); });
  w("fldBtnSettings", function () { if (typeof fldOpenSettingsDrawer === "function") fldOpenSettingsDrawer(); });   // B-5: the in-battle settings drawer
  w("fldBtnExit", function () { fldExit(false); });
}
function fldToggleFog() {
  __FIELD.fog = !__FIELD.fog;
  try { if (typeof G !== "undefined") { G.settings = G.settings || {}; G.settings.tacticalFog = __FIELD.fog; } } catch (e) {}
  if (__FIELD.fog) fldComputeVisibility(); else { __FIELD.vis = null; }   // ON: scout now; OFF: everything visible again
  var b = document.getElementById("fldBtnFog"); if (b) { b.innerHTML = "Fog: " + (__FIELD.fog ? "On" : "Off"); b.setAttribute("aria-pressed", String(__FIELD.fog)); }
  fldAnnounce(__FIELD.fog ? "Fog of war ON — you see only what your units scout." : "Fog of war OFF — the whole field is visible.");
  fldRenderHud();
}
function fldTogglePlay() {
  if (__FIELD.phase === "deploy") { __FIELD.phase = "battle"; __FIELD.paused = false; fldAnnounce("Battle begins."); }
  else if (__FIELD.phase === "battle") { __FIELD.paused = !__FIELD.paused; fldAnnounce(__FIELD.paused ? "Paused." : "Resumed."); }
  if (!__FIELD.paused) __FIELD._apReason = null;   // clear any auto-pause reason once the player resumes
  var b = document.getElementById("fldBtnPlay"); if (b) { b.innerHTML = __FIELD.paused ? "&#9654; Resume" : "&#10074;&#10074; Pause"; b.setAttribute("aria-label", __FIELD.paused ? "Resume the battle (Space)" : "Begin / pause the battle (Space)"); }
}
function fldCycleSpeed() { __FIELD.speed = __FIELD.speed === 1 ? 2 : (__FIELD.speed === 2 ? 4 : 1); var b = document.getElementById("fldBtnSpd"); if (b) b.innerHTML = __FIELD.speed + "&times;"; }
function fldPlayerSel() { var out = []; for (var i = 0; i < __FIELD.sel.length; i++) { var u = fldById(__FIELD.sel[i]); if (u && u.alive && u.side === "US" && !u.ai) out.push(u); } return out; }
function fldSetFormation(f) { var s = fldPlayerSel(); for (var i = 0; i < s.length; i++) s[i].formation = f; fldRenderHud(); }
function fldSelCharge() { var s = fldPlayerSel(); for (var i = 0; i < s.length; i++) fldOrderCharge(s[i]); fldAnnounce("Charge ordered."); }
function fldSelHold() { var s = fldPlayerSel(); for (var i = 0; i < s.length; i++) { var u = s[i]; u.order = { type: "hold", tx: u.x, tz: u.z, tface: u.facing }; } fldAnnounce("Hold ordered."); }
function fldKey(e) {
  // B-5: while the in-battle settings drawer (an aria-modal dialog) is open, NO battlefield hotkey fires — the
  // drawer owns the keyboard (its own handler does stopPropagation + handles Escape/Tab). This guard is the
  // belt-and-suspenders so even a key dispatched outside the drawer subtree never reaches fldExit / the toggles.
  if (typeof document !== "undefined" && document.getElementById("fldDrawer")) return;
  // Escape always exits; otherwise let native activation handle a focused button (Space/Enter)
  // so control-bar / end-screen buttons don't double-fire, and the end screen stays keyboard-operable.
  if (e.key === "Escape") {
    // Phase A (bug-hunt F1): on a FINISHED campaign battle, Esc must RESOLVE the decided result (not
    // abort-and-discard it via _returnFn — that would lose the win/loss + casualties and be save-scummable).
    // Mirrors the #fldCampReturn button. Mid-battle Esc still aborts (the re-launchable abort, by design).
    if (__FIELD.phase === "over" && __FIELD.campaignCtx) {
      var oc = (typeof fldCampaignComputeOutcome === "function") ? fldCampaignComputeOutcome() : null;
      fldExit(true);
      if (oc && typeof fldCampaignApplyOutcome === "function") fldCampaignApplyOutcome(oc);
      return;
    }
    fldExit(false); return;
  }
  if (e.target && e.target.tagName === "BUTTON") return;
  if (__FIELD.phase === "over") return; // end screen: native Tab/Enter/Space reach #fldAgain / #fldDone
  var k = e.key;
  if (k === " ") { e.preventDefault(); fldTogglePlay(); }
  else if (k === "1") __FIELD.speed = 1; else if (k === "2") __FIELD.speed = 2; else if (k === "3") __FIELD.speed = 4;
  else if (k === "l" || k === "L") fldSetFormation("line");
  else if (k === "c" || k === "C") fldSetFormation("column");
  else if (k === "f" || k === "F" || k === "Enter") fldSelCharge();
  else if (k === "h" || k === "H") fldSelHold();
  else if (k === "v" || k === "V") fldToggleFog();
  else if (k === "p" || k === "P") fldToggleAutoPause();
  else if (k === "g" || k === "G") { if (typeof fldOpenSettingsDrawer === "function") fldOpenSettingsDrawer(); }   // B-5: the in-battle settings drawer
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
  if (!sel.length) {
    var foeLine;
    if (__FIELD.fog) { var seen = 0; for (var fi = 0; fi < __FIELD.units.length; fi++) { var fu = __FIELD.units[fi]; if (fu.side === "CS" && fu.alive && fldVisible("US", fu)) seen++; } foeLine = seen + ' Rebel brigades sighted'; }
    else foeLine = fldArmyLive("CS") + ' Rebel brigades afield';
    el.innerHTML = '<div style="opacity:.7;">Click a brigade to select. Drag from open ground to march &amp; face. (' + fldArmyLive("US") + ' Union vs ' + foeLine + '.)</div>'
      + (typeof fldOfficerHudRoster === "function" ? fldOfficerHudRoster() : "")   // B-2: a field-officer status line
      + (typeof fldLogisticsHudReserve === "function" ? fldLogisticsHudReserve() : "");   // B-3: the ammunition-reserve line
    return;
  }
  var u = sel[0];
  var sideCol = u.side === "US" ? "#6c8ebf" : "#b06a5a";
  var wn = (typeof WEAPONS !== "undefined" && WEAPONS[u.weapon]) ? WEAPONS[u.weapon].name : u.weapon;
  el.innerHTML =
    '<div style="font-weight:bold;color:' + sideCol + ';">' + u.name + (sel.length > 1 ? " (+" + (sel.length - 1) + ")" : "") + '</div>' +
    '<div style="opacity:.8;font-size:12px;margin-bottom:4px;">' + wn + ' &middot; ' + u.formation + ' &middot; <b>' + fldStateLabel(u) + '</b></div>' +
    fldBar("Men", u.men, u.maxMen, "#cdbb88") +
    fldBar("Morale", u.morale, u.maxMor, u.morale > 35 ? "#7faf6a" : "#c98a3a") +
    fldBar("Fatigue", u.fatigue, 100, "#a08050") +
    fldBar("Ammo", u.ammo, 100, "#8a9bb0") +
    (typeof fldLogisticsHudSelected === "function" ? fldLogisticsHudSelected(u) : "") +   // B-3: ammo/resupply/spent status
    (typeof fldArmsHudSelected === "function" ? fldArmsHudSelected(u) : "") +   // B-4: battery range-band / cavalry role
    (typeof fldOfficerHudSelected === "function" ? fldOfficerHudSelected(u) : "");   // B-2: brigade leader + in-command status
}
function fldOnOver() {
  var e = document.getElementById("fldEnd"); if (!e) { fldAnnounce("Battle over."); return; }
  var w = __FIELD.winner;
  var msg = w === "draw" ? "Stalemate" : (w === "US" ? "Union Victory" : "Confederate Victory");
  fldAnnounce(msg);
  e.classList.remove("hidden");
  e.setAttribute("role", "dialog"); e.setAttribute("aria-modal", "true"); e.setAttribute("aria-label", msg); /* wcag-auditor: added aria-modal=true so AT users know focus is constrained (WCAG 4.1.2) */
  // P1a seam: a scenario can append its teaching payoff (what really happened / your war vs history).
  var scNote = (typeof fldScenarioEndHtml === "function") ? (fldScenarioEndHtml(w) || "") : "";
  // Phase A seam: a campaign battle appends its strategic-consequence note (no-op standalone).
  if (__FIELD.campaignCtx && typeof fldCampaignEndHtml === "function") { try { scNote += (fldCampaignEndHtml(w) || ""); } catch (eC) {} }
  // B-2 seam: the officer teaching payoff (who fell, why command-from-the-saddle mattered). No-op when off / none lost.
  if (typeof fldOfficerEndHtml === "function") { try { scNote += (fldOfficerEndHtml(w) || ""); } catch (eO) {} }
  // B-3 seam: the ammunition-economy teaching payoff (if a side's reserve ran low). No-op when off / reserves held.
  if (typeof fldLogisticsEndHtml === "function") { try { scNote += (fldLogisticsEndHtml() || ""); } catch (eL) {} }
  // B-4 seam: the arms-of-the-service teaching (lost batteries / the cavalry charge). No-op when off / none afield.
  if (typeof fldArmsEndHtml === "function") { try { scNote += (fldArmsEndHtml() || ""); } catch (eA) {} }
  var _inCampaign = !!__FIELD.campaignCtx;
  e.innerHTML =
    '<div style="text-align:center;background:#0c0f14;border:1px solid #745e3f;border-radius:8px;padding:26px 34px;max-width:640px;max-height:88vh;overflow:auto;">' /* wcag-auditor: contrast fix #4a3c28->#745e3f border on #0c0f14 (was 1.80:1, now 3.12:1) WCAG 1.4.11 */ +
    '<div style="font-size:26px;letter-spacing:1px;margin-bottom:8px;color:#e9dcc0;">' + msg + '</div>' +
    '<div style="opacity:.8;margin-bottom:6px;">Held the field at ' + Math.floor(__FIELD.t / 60) + ':' + ("0" + (Math.floor(__FIELD.t) % 60)).slice(-2) + '.</div>' +
    '<div style="opacity:.7;font-size:13px;margin-bottom:18px;">Union ' + fldArmyStrength("US") + ' &middot; Confederate ' + fldArmyStrength("CS") + ' still under arms.</div>' +
    scNote +
    (_inCampaign
      ? '<button id="fldCampReturn" type="button" style="background:#1c1610;color:#e9dcc0;border:1px solid #766040;border-radius:4px;padding:9px 18px;font:14px Georgia,serif;cursor:pointer;">Return to Headquarters &#9654;</button></div>' /* wcag-auditor: added type=button (WCAG 4.1.2 — explicit role semantics; prevents accidental form submit) */
      : ('<button id="fldAgain" style="background:#1c1610;color:#e9dcc0;border:1px solid #766040;border-radius:4px;padding:9px 16px;font:14px Georgia,serif;cursor:pointer;margin-right:8px;">Fight Again</button>' +
         '<button id="fldDone" style="background:#1c1610;color:#e9dcc0;border:1px solid #766040;border-radius:4px;padding:9px 16px;font:14px Georgia,serif;cursor:pointer;">Main Menu</button></div>')); /* wcag-auditor: contrast fix #4a3c28->#766040 border on #1c1610 (was 1.68:1, now 3.00:1) WCAG 1.4.11 */
  if (_inCampaign) {
    // Phase A (A3): a campaign battle returns to headquarters — compute the outcome from the FINISHED
    // sim (before fldExit clears units), tear down the tactical UI silently, then feed the result into
    // the campaign (build a conditioned hex roster + apply the real loss fractions + campaignAdvance).
    var rb = document.getElementById("fldCampReturn");
    if (rb) rb.addEventListener("click", function () {
      var o = (typeof fldCampaignComputeOutcome === "function") ? fldCampaignComputeOutcome() : null;
      fldExit(true);
      if (o && typeof fldCampaignApplyOutcome === "function") fldCampaignApplyOutcome(o);
    });
    // Phase A (bug-hunt F2): the end dialog is aria-modal, so trap Tab/Shift+Tab on the single button
    // (otherwise focus escapes to the battle controls behind it). One button -> Tab keeps focus on it.
    e.addEventListener("keydown", function (ev) { if (ev.key === "Tab") { ev.preventDefault(); if (rb) rb.focus(); } });
    if (rb) { try { rb.focus(); } catch (e2) {} }
    return;
  }
  var a = document.getElementById("fldAgain"), d = document.getElementById("fldDone");
  // rematch preserves the scenario (sandbox OR a battle like bullrun1) — capture before fldExit clears state.
  if (a) a.addEventListener("click", function () { var k = __FIELD.rendererKind, sc = __FIELD.scenario, sd = (__FIELD.seed + 7) >>> 0; fldExit(true); fldLaunchSandbox({ renderer: k, seed: sd, scenario: sc }); });
  if (d) d.addEventListener("click", function () { fldExit(false); });
  // focus trap (WCAG 2.4.11): the end screen is aria-modal, so confine Tab/Shift+Tab to its two buttons.
  e.addEventListener("keydown", function (ev) {
    if (ev.key !== "Tab") return;
    var act = document.activeElement;
    if (!ev.shiftKey && act === d) { ev.preventDefault(); if (a) a.focus(); }
    else if (ev.shiftKey && act === a) { ev.preventDefault(); if (d) d.focus(); }
    else if (act !== a && act !== d) { ev.preventDefault(); if (a) a.focus(); }
  });
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
  if (t.woods) for (var i = 0; i < t.woods.length; i++) { var wd = t.woods[i]; ctx.beginPath(); ctx.arc(v.ox + wd.x * v.s, v.oz + wd.z * v.s, wd.r * v.s, 0, 7); ctx.fill(); }
  // hill rings (one for the sandbox; several for a scenario)
  ctx.strokeStyle = "#5a6a44"; ctx.lineWidth = 2;
  var _hs = fldHills(); for (var hi = 0; hi < _hs.length; hi++) { var hh = _hs[hi]; ctx.beginPath(); ctx.arc(v.ox + hh.x * v.s, v.oz + hh.z * v.s, hh.s * 0.55 * v.s, 0, 7); ctx.stroke(); }
  // walls
  ctx.strokeStyle = "#8a8070"; ctx.lineWidth = 4;
  var _ws = fldWalls(); for (var wi = 0; wi < _ws.length; wi++) { var ww = _ws[wi]; ctx.beginPath(); ctx.moveTo(v.ox + ww.x1 * v.s, v.oz + ww.z1 * v.s); ctx.lineTo(v.ox + ww.x2 * v.s, v.oz + ww.z2 * v.s); ctx.stroke(); }
  // scenario markers (creek / stream / road / ford / bridge / place-labels) — render + teaching atmosphere
  fld2dDrawMarkers(ctx, v);
  // objective
  var o = __FIELD.objective; ctx.strokeStyle = "#d8c87a"; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(v.ox + o.x * v.s, v.oz + o.z * v.s, o.r * v.s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  // last-known "ghosts" for enemies once seen but now hidden by fog (drawn beneath the live units)
  fld2dGhosts(ctx, v);
  // units
  for (var u2 = 0; u2 < __FIELD.units.length; u2++) {
    var u = __FIELD.units[u2]; if (!u.alive) continue;
    if (__FIELD.fog && u.side !== "US" && !fldVisible("US", u)) continue;   // hidden enemy (the player sees only what is scouted)
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
  // in-battle logistics (B-3): the ammunition trains + resupply rings (drawn under the officers; no-op when off)
  if (typeof fldDrawSupply === "function") fldDrawSupply(ctx, v);
  // distinct arm roles (B-4): brass gun/limber + mounted-trooper markers, muzzle flash, canister cone, charge trail (no-op when off)
  if (typeof fldDrawArms === "function") fldDrawArms(ctx, v);
  // officers & command (B-2): command rings + mounted-officer markers + fallen crosses (no-op when off / no leaders)
  if (typeof fldDrawOfficers === "function") fldDrawOfficers(ctx, v);
  // drag arrow
  if (__FIELD.drag) { var dr = __FIELD.drag; ctx.strokeStyle = "#ffe9a8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(v.ox + dr.x0 * v.s, v.oz + dr.z0 * v.s); ctx.lineTo(v.ox + dr.x * v.s, v.oz + dr.z * v.s); ctx.stroke(); }
}
// scenario terrain markers (Bull Run: Bull Run creek, Young's Branch, the Warrenton Turnpike,
// Sudley Ford, the Stone Bridge, place-labels). The sandbox has no markers -> a no-op.
function fld2dDrawMarkers(ctx, v) {
  var t = __FIELD.terrain; if (!t || !t.markers) return;
  for (var i = 0; i < t.markers.length; i++) {
    var mk = t.markers[i];
    if (mk.path && mk.path.length > 1) {
      ctx.lineWidth = mk.kind === "road" ? 5 : (mk.kind === "creek" ? 6 : 3);
      ctx.strokeStyle = mk.kind === "road" ? "#caa86a" : "#5a7da0";
      ctx.beginPath();
      for (var p = 0; p < mk.path.length; p++) { var pt = mk.path[p], X = v.ox + pt[0] * v.s, Z = v.oz + pt[1] * v.s; if (p === 0) ctx.moveTo(X, Z); else ctx.lineTo(X, Z); }
      ctx.stroke();
      var midp = mk.path[Math.floor(mk.path.length / 2)];
      if (mk.name) fld2dLabel(ctx, mk.name, v.ox + midp[0] * v.s, v.oz + midp[1] * v.s - 6);
    } else if (typeof mk.x === "number") {
      if (mk.kind === "ford" || mk.kind === "bridge") { ctx.fillStyle = mk.kind === "bridge" ? "#9a8a6a" : "#5a7da0"; ctx.beginPath(); ctx.arc(v.ox + mk.x * v.s, v.oz + mk.z * v.s, 5, 0, 7); ctx.fill(); }
      if (mk.name) fld2dLabel(ctx, mk.name, v.ox + mk.x * v.s, v.oz + mk.z * v.s - 8);
    }
  }
}
function fld2dLabel(ctx, text, x, z) {
  ctx.save();
  ctx.font = "11px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.lineWidth = 3; ctx.strokeStyle = "rgba(8,10,14,0.85)"; ctx.strokeText(text, x, z);
  ctx.fillStyle = "#e9dcc0"; ctx.fillText(text, x, z);
  ctx.restore();
}
// fog "ghosts": a faded last-known marker for each enemy once seen but now out of sight.
function fld2dGhosts(ctx, v) {
  if (!__FIELD.fog || !__FIELD.lastSeen) return;
  for (var id in __FIELD.lastSeen) {
    if (!Object.prototype.hasOwnProperty.call(__FIELD.lastSeen, id)) continue;
    var g = __FIELD.lastSeen[id]; if (g.side === "US") continue;          // only enemy ghosts
    var live = fldById(id);
    if (!live || !live.alive || fldVisible("US", live)) continue;          // skip if gone, dead, or currently seen (the live unit is drawn)
    var cx = v.ox + g.x * v.s, cz = v.oz + g.z * v.s;
    ctx.save(); ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "#9a8a7a"; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
    var w = (g.formation === "column" ? 36 : 84) * v.s, d = (g.formation === "column" ? 54 : 24) * v.s;
    ctx.translate(cx, cz); ctx.rotate(g.facing || 0); ctx.strokeRect(-w / 2, -d / 2, w, d); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = "#cdbb88"; ctx.font = "bold 11px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("?", cx, cz); ctx.restore();
    ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
  }
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
  // officers & command (B-2): mounted-officer figures + ground command auras (no-op when off / no leaders)
  if (typeof fld3dBuildOfficers === "function") { try { fld3dBuildOfficers(); } catch (e) {} }
  // in-battle logistics (B-3): ammunition-wagon meshes + resupply rings (no-op when off / no trains)
  if (typeof fld3dBuildSupply === "function") { try { fld3dBuildSupply(); } catch (e) {} }
  // distinct arm roles (B-4): gun + mounted-trooper meshes (no-op when off / no art+cav)
  if (typeof fld3dBuildArms === "function") { try { fld3dBuildArms(); } catch (e) {} }
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
  // walls (one for the sandbox; several for a scenario)
  var t = __FIELD.terrain, _ws = fldWalls();
  for (var wq = 0; wq < _ws.length; wq++) {
    var wl = _ws[wq], wdx = wl.x2 - wl.x1, wdz = wl.z2 - wl.z1, wlen = Math.hypot(wdx, wdz);
    var wall = new T.Mesh(new T.BoxGeometry(wlen, 14, 8), new T.MeshLambertMaterial({ color: "#8a8070" }));
    wall.position.set((wl.x1 + wl.x2) / 2, fldTerrainH(wl.x1, wl.z1) + 7, (wl.z1 + wl.z2) / 2);
    wall.rotation.y = -Math.atan2(wdz, wdx); __FIELD.scene.add(wall);
  }
  // scenario markers (roads/creeks as low ribbons; ford/bridge as small markers) — Bull Run only
  fld3dBuildMarkers();
  // woods (instanced cones)
  if (t.woods) for (var w = 0; w < t.woods.length; w++) {
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
function fld3dBuildMarkers() {
  var t = __FIELD.terrain; if (!t || !t.markers || !window.THREE) return;
  var T = window.THREE;
  for (var i = 0; i < t.markers.length; i++) {
    var mk = t.markers[i];
    var col = mk.kind === "road" ? "#c2a063" : (mk.kind === "bridge" ? "#9a8a6a" : "#4f739a");
    if (mk.path && mk.path.length > 1) {
      var wgt = mk.kind === "road" ? 16 : 12, hgt = mk.kind === "road" ? 1.4 : 0.8;
      for (var p = 1; p < mk.path.length; p++) {
        var a = mk.path[p - 1], b = mk.path[p], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
        if (len < 1) continue;
        var seg = new T.Mesh(new T.BoxGeometry(len, hgt, wgt), new T.MeshLambertMaterial({ color: col }));
        var mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
        seg.position.set(mx, fldTerrainH(mx, mz) + hgt, mz); seg.rotation.y = -Math.atan2(dz, dx);
        __FIELD.scene.add(seg);
      }
    } else if (typeof mk.x === "number" && (mk.kind === "ford" || mk.kind === "bridge")) {
      var m2 = new T.Mesh(new T.BoxGeometry(22, mk.kind === "bridge" ? 7 : 2, 22), new T.MeshLambertMaterial({ color: col }));
      m2.position.set(mk.x, fldTerrainH(mk.x, mk.z) + 3, mk.z); __FIELD.scene.add(m2);
    }
  }
}
function fld3dBuildUnits() {
  var T = window.THREE;
  // dispose each child's geometry/material BEFORE detaching — this runs on every reinforcement
  // arrival (a full rebuild), so skipping disposal would leak GPU buffers wave after wave.
  while (__FIELD.groups.children.length) {
    var ch = __FIELD.groups.children[0];
    if (ch.traverse) ch.traverse(function (o) {
      if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      if (o.material) { var m = o.material; if (Array.isArray(m)) { for (var i = 0; i < m.length; i++) m[i] && m[i].dispose && m[i].dispose(); } else if (m.dispose) m.dispose(); }
    });
    __FIELD.groups.remove(ch);
  }
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
  // fog: a hidden enemy (not currently scouted) is not drawn (no-op when fog OFF).
  g.visible = u.alive && !(__FIELD.fog && u.side !== "US" && !fldVisible("US", u));
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
  if (typeof fld3dSyncOfficers === "function") fld3dSyncOfficers();   // B-2: officer figures + auras
  if (typeof fld3dSyncSupply === "function") fld3dSyncSupply();       // B-3: ammunition-train wagons
  if (typeof fld3dSyncArms === "function") fld3dSyncArms();           // B-4: gun + trooper markers + muzzle flash
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
  __FIELD._ld3dGroup = null; __FIELD._ld3d = null;   // B-2: the officer group's geometries were disposed in the scene traverse above; drop the refs
  __FIELD._sup3dGroup = null; __FIELD._sup3d = null; // B-3: same for the ammunition-train wagons
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
    // P1a seam: registered scenarios (e.g. First Bull Run) inject their own menu buttons after the sandbox button.
    if (typeof fldInjectScenarioButtons === "function") fldInjectScenarioButtons(b);
    // Phase A (A2) seam: the custom FREE skirmish setup menu button (after the sandbox / Bull Run buttons).
    var lastBtn = document.getElementById("fldBullRunBtn") || b;
    if (typeof fldInjectSkirmishButton === "function") fldInjectSkirmishButton(lastBtn);
    // Phase B-5 seam: the Command & Realism (difficulty/realism presets) menu button (after the skirmish button).
    var lastBtn2 = document.getElementById("fldSkirmishBtn") || lastBtn;
    if (typeof fldInjectPresetButton === "function") fldInjectPresetButton(lastBtn2);
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
