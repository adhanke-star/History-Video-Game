/* ============================================================================
   src/tactical/T5-arms.js  —  TACTICAL ENGINE · PHASE B-4 (DISTINCT ARM ROLES)

   ARTILLERY + CAVALRY get real ROLES on top of the existing arm typing. V1-CHECKLIST
   Phase B-4: "artillery (canister / long-range), cavalry (scout / flank / screen / raid)."
   Before this, `arm` only set a unit's fire RANGE and SIGHT; every arm meleed at 1.0
   (the ARM table in T0 fldResolveMelee was REFERENCED but never defined — a dangling
   hook), batteries trundled forward like infantry, and a cavalry brigade advanced in
   line like a foot regiment. This module fills all of that:

     - ARTILLERY. A battery fires CANISTER up close (a giant shotgun — devastating in
       the open, sharply defeated by works/woods) and a softening long-range BOMBARDMENT
       beyond. It is OVERRUN in melee (ARM.art ~ 0.35 — Griffin's and Ricketts's regular
       batteries lost on Henry House Hill). Its doctrine STANDS and fires from good ground
       and DISPLACES to the rear when an enemy closes on it unscreened — it never chases
       into melee. The Cannon Corps you BOUGHT on the President's Desk conditions the field
       battery's reach / per-shot weight / canister strength through the A1 bridge (build a
       Napoleon park -> murderous canister; build Whitworths -> a long-range counter-battery
       with no close spike).

     - CAVALRY. A trooper brigade runs one of four ROLES (scout / flank / screen / raid).
       Mounted SHOCK shatters a disordered or flanked line (ARM.cav ~ 1.4) but breaks on a
       formed, steady one with leveled bayonets (~0.9 — cavalry rarely broke fresh infantry
       frontally). It decides by mobility, not the firefight (weak carbine). A RAIDER that
       reaches an undefended enemy AMMUNITION TRAIN drains its reserve — the on-field
       realization of the strategic raid-supply order (the B-3 tie).

   ARCHITECTURE: ADDITIVE + fully GATED on __FIELD.arms (default ON every live launch). The
   field/bullrun/fog/autopause/ai/campaign-link + officers + logistics probes set sticky
   __FIELD._armsOff -> with arms off the ARM melee table is NOT consulted (melee stays the
   1.0 default), no canister branch fires, no role AI / raid runs, and u.role / _canisterScale
   stay inert -> those baselines (INCLUDING bullrun1, which FIELDS Griffin/Ricketts as art
   and Stuart as cav) remain BYTE-IDENTICAL. The gate is exactly what protects them, since
   the existing scenarios already contain art + cav. The layer's own coverage =
   tools/probe-arms.mjs. DETERMINISM: no RNG anywhere here (the role AI is deterministic;
   the fire/melee RNG stream is the seeded fldRng in T0, untouched) -> same seed reproduces
   the battle. Bare-name globals (G, GAME_DATA, __FIELD, FLD, fldPlayerSide from T3, the
   fld* T0 helpers). All helpers uniquely prefixed + defined once. No literal comment-closer
   in this block.
   ============================================================================ */

var FLDA = {
  // ---- the UNIVERSAL ARTILLERY GUN MODEL (DECISIONS D74 — one consistent ruleset across EVERY battle) ----
  // A battery's volume of fire derives from its GUN COUNT, not from a per-battle "men" fudge. GUN_FIRE_WEIGHT is the
  // fire-strength contribution of ONE gun, in the SAME men-equivalent unit the fire model's strF=men/1500 uses — so a
  // gun throws the same weight of metal in Antietam as in Fredericksburg as in Bull Run; only the scenario differs.
  // CALIBRATION: a standard 6-gun regular battery -> 6*27 = 162 ~ Bull Run's already-realistic 160-men/6-gun Griffin &
  // Ricketts (data/bullrun.json) — so the gun model is CONSISTENT with the existing realistic batteries, not merely
  // gated around them. The universal canister/bombardment rule (fldArtFireMult) does the killing on top of this.
  // BYTE-IDENTITY: fldArtFireStr falls back to u.men for any battery that declares no `guns` (the legacy realistic
  // batteries, e.g. Bull Run's) AND whenever arms is off -> probe-arms 23/23 + probe-bullrun 15/15 hold unchanged.
  GUN_FIRE_WEIGHT: 27,        // fire-strength (men-equivalent) per gun — UNIVERSAL across all battles; never tuned per-battle
  CANISTER_R: 150,            // canister band (yd): a battery is a giant shotgun inside this
  CANISTER_MULT: 2.7,        // canister damage spike vs an in-the-open target at close range
  CANISTER_COVER_K: 1.15,    // how sharply cover attenuates canister (works/woods defeat the balls)
  CANISTER_COVER_FLOOR: 0.18,// canister never drops below this fraction even behind heavy works
  LONG_MULT: 0.5,           // beyond canister range: a softening bombardment (lower kill, suppresses). NOTE: a
                            // seed-isolation sweep (DECISIONS D67) proved artillery effectiveness is balance-NEUTRAL
                            // at Bull Run (the batteries survive but surviving guns don't change who holds the hill);
                            // the balance lever was the cavalry flank doctrine — see CAV_DEF_LEASH below.
  CAV_DEF_LEASH: 200,        // a DEFENDING flank cavalry stays a mobile reserve within obj.r + this of the objective
                            // (Stuart hit the Union right NEAR Henry House Hill — he did not abandon the decisive
                            // point). Without the leash the new flank role pulled the (CS, defending) cavalry off the
                            // hill -> CS 6/8 -> 3/8; the leash keeps it at the decisive point -> balance-neutral.
  ART_MELEE: 0.35,          // a battery caught in melee is overrun (the 33rd Virginia took the crest guns)
  CAV_CHARGE: 1.4,          // mounted shock vs a disordered / flanked target in the open
  CAV_BRACE: 0.9,           // ...but a formed, steady line breaks a frontal charge (leveled bayonets)
  BATTERY_DISPLACE_R: 200,   // a DEFENDING battery displaces when an unscreened enemy closes to this (cautious — sited guns stay safe)
  BATTERY_OVERRUN_R: 95,     // an ATTACKING battery pushed forward to support the assault bolts only at point-blank ->
                            // it CAN be overrun (the Griffin/Ricketts crest guns; also the balance counter to its canister).
  BATTERY_FWD_FRAC: 0.5,     // an attacking battery posts this fraction of obj.r forward of the crest, on its approach side (exposed, in canister range)
  BATTERY_SCREEN_R: 168,     // a friendly non-art brigade within this counts as a screen (don't bolt)
  BATTERY_STANDOFF: 95,      // a DEFENDING battery sits this far outside the objective ring, on its own side
  BATTERY_DISPLACE_BACK: 185,// how far it limbers back when displacing (yd)
  RAID_RATE: 42,            // reserve points/s a raider drains from an undefended enemy train (B-3 tie)
  CAV_CHARGE_R: 165,         // a flank / screen / raid trooper charges a catchable disordered enemy within this (yd)
  SCOUT_AVOID: 150,          // a scout / raider peels off a stronger enemy within this (don't get caught)
  FLASH_T: 0.5,             // muzzle-flash / canister-cone visual lifetime (s)
};

/* ===========================================================================
   MELEE — the ARM table (T0 fldResolveMelee seam). meleeFor the ATTACKER `att`
   given the DEFENDER `def`. 1.0 for infantry AND when arms off -> byte-identical.
   =========================================================================== */
/**
 * fldArmMelee.
 * @param {*} att
 * @param {*} def
 */
function fldArmMelee(att, def) {
  if (!__FIELD.arms || !att) return 1.0;
  if (att.arm === "art") return FLDA.ART_MELEE;                      // a battery overrun in melee
  if (att.arm === "cav") return (def && def.state === "steady") ? FLDA.CAV_BRACE : FLDA.CAV_CHARGE;
  return 1.0;                                                        // infantry — the pre-B4 default
}

/* ===========================================================================
   ARTILLERY FIRE — canister / bombardment (T0 fldResolveFire seam). Returns a
   multiplier on the base fire power; 1.0 / inert when arms off or non-artillery.
   =========================================================================== */
/**
 * fldArtFireMult.
 * @param {*} u
 * @param {*} tgt
 * @param {*} d
 * @param {*} cover
 */
function fldArtFireMult(u, tgt, d, cover) {
  if (!__FIELD.arms || !u || u.arm !== "art") return 1.0;
  u._artFlash = FLDA.FLASH_T;                                        // light the muzzle for the renderer
  if (d <= FLDA.CANISTER_R) {
    // canister: murderous in the open, defeated by cover (a fuze-immune close-range shotgun)
    var pen = fldClamp(1 - (cover - 1) * FLDA.CANISTER_COVER_K, FLDA.CANISTER_COVER_FLOOR, 1);
    var scale = (typeof u._canisterScale === "number") ? u._canisterScale : 1;   // bridge: the bought gun's canister strength
    var csev = (__FIELD.sev ? __FIELD.sev.canister : 1);                         // B-5: canister lethality severity (1.0 = neutral = byte-identical)
    u._canisterLive = FLDA.FLASH_T;
    return FLDA.CANISTER_MULT * pen * scale * csev;
  }
  u._canisterLive = 0;
  return FLDA.LONG_MULT;                                             // long-range bombardment: lower kill, suppression
}

/* ===========================================================================
   UNIVERSAL GUN MODEL (T0 fldResolveFire seam — DECISIONS D74). Returns the fire-strength
   NUMERATOR for a unit (what the fire model divides by 1500 to get strF). For a battery that
   declares a GUN COUNT this is guns * GUN_FIRE_WEIGHT — a consistent, per-battle-fudge-free
   measure of the metal it throws, identical in every battle. For infantry, an arms-off launch,
   or a LEGACY battery with no `guns` (Bull Run's realistic 160-men/6-gun Griffin & Ricketts),
   it returns u.men EXACTLY as the pre-D74 code did -> byte-identical (the gate is `guns`). The
   battery's CREW (u.men) still governs melee overrun, casualties, and the HUD — so de-fudging a
   battery's fire (real gun count) and giving it realistic crew makes it MORE overrun-able when
   infantry reach it (historical), without inflating men to fake fire volume.

   CAMPAIGN SEMANTICS (bug-hunt note, D74): the GUN COUNT is the army-size-invariant "hardware" — a
   battery has its guns regardless of the strategic army's manpower. So fldCampaignConditionUnit's
   strengthMul (which scales men AND maxMen together, T2) leaves a gun-battery's crew RATIO ~1.0 and
   therefore its VOLUME of fire unchanged — intentionally. A bigger strategic army strengthens its
   guns through the Cannon-Corps bridge instead (the bought gun type -> _canisterScale + reach/pow via
   _fldArtProfile), the proper "better guns, not more guns from manpower" lever. (Antietam/Fredericksburg
   are standalone today, so this path is dormant; documented so a future campaign-linked gun battery
   doesn't silently inherit a dead volume lever.)
   =========================================================================== */
/**
 * fldArtFireStr.
 * @param {*} u
 */
function fldArtFireStr(u) {
  if (!__FIELD.arms || !u || u.arm !== "art") return u ? u.men : 0;
  if (typeof u.guns === "number" && u.guns > 0) {
    // RATED fire = guns * the universal per-gun weight; scaled by CREW AVAILABILITY (men/maxMen) so a battery losing
    // its cannoneers serves its guns more slowly and fades smoothly (not full-volume-then-zero). At full crew this is
    // exactly guns * GUN_FIRE_WEIGHT — the consistent, battle-agnostic rated output.
    var crew = (u.maxMen > 0) ? fldClamp(u.men / u.maxMen, 0, 1) : 1;
    return u.guns * FLDA.GUN_FIRE_WEIGHT * crew;
  }
  return u.men;   // legacy battery (no gun count) -> men-based, byte-identical
}

/* ===========================================================================
   TARGETING — arm-aware preference (T0 fldAcquireTarget seam). Returns a score
   delta; 0 for infantry AND when arms off -> baseline targeting unchanged.
   =========================================================================== */
/**
 * fldArmTargetBias.
 * @param {*} u
 * @param {*} e
 * @param {*} d
 * @param {*} fr
 */
function fldArmTargetBias(u, e, d, fr) {
  if (!__FIELD.arms || !u) return 0;
  if (u.arm === "art") {
    var cov = (typeof fldCoverAt === "function") ? fldCoverAt(e.x, e.z) : 1;
    return (1.5 - fldClamp(cov, 1, 1.7)) * 0.4 + fldClamp(e.men / 2000, 0, 1) * 0.2;   // dense + exposed = canister fodder
  }
  if (u.arm === "cav") {
    return ((e.state === "wavering" || e.state === "routing") ? 0.5 : 0) + (fr && fr.isFlank ? 0.3 : 0);
  }
  return 0;
}

/* ===========================================================================
   ROLE AI (T0 fldAiUnit seam) — artillery + cavalry run their own doctrines,
   OVERRIDING the infantry doctrine for those arms. Returns true if it handled u.
   =========================================================================== */
/**
 * fldArmsAiUnit.
 * @param {*} u
 */
function fldArmsAiUnit(u) {
  if (!__FIELD.arms || !u.alive || u.state === "routing") return false;
  if (u.arm === "art") { fldAiArtillery(u); return true; }
  if (u.arm === "cav") { fldAiCavalry(u); return true; }
  return false;
}

/* a shared scan of VISIBLE enemies (fog-respecting) + the local force balance. Mirrors the
   defender/attacker scanners so cavalry/artillery react only to what their side can see. */
/**
 * fldArmsScan.
 * @param {*} u
 */
function fldArmsScan(u) {
  var near = null, nd = 1e9, weak = null, wd = 1e9, foeMen = 0, friendMen = u.men, enemyCav = null, ed = 1e9;
  var U = __FIELD.units, i;
  for (i = 0; i < U.length; i++) {
    var e = U[i]; if (!e.alive || e === u) continue;
    if (e.side === u.side) { if (e.state !== "routing" && fldDist(u, e) < FLD.AI_LOCAL_R) friendMen += e.men; continue; }
    if (__FIELD.fog && typeof fldVisible === "function" && !fldVisible(u.side, e)) continue;
    var d = fldDist(u, e);
    if (d < FLD.AI_LOCAL_R) foeMen += e.men;
    if (d < nd) { nd = d; near = e; }
    if (e.state === "wavering" && d < wd) { wd = d; weak = e; }
    if (e.arm === "cav" && d < ed) { ed = d; enemyCav = e; }
  }
  return { near: near, nd: nd, weak: weak, wd: wd, foeMen: foeMen, friendMen: friendMen, enemyCav: enemyCav, ed: ed };
}

/* the BATTERY doctrine, ASYMMETRIC by role (deterministic; never chases into melee):
   - a DEFENDING battery is sited safely: it stands and fires from good ground OUTSIDE the contested ring on its
     own side, and DISPLACES early when an unscreened enemy closes (Marye's Heights — the guns are not lost).
   - an ATTACKING battery supports the assault: it pushes FORWARD to a canister post on the objective's near face
     (exposed) and bolts only at point-blank — so it CAN be overrun if its infantry screen fails (Griffin's and
     Ricketts's crest guns, whose loss broke the Union attack). This asymmetry is historical AND the balance
     counter to the attacker's un-answered guns (verified by a seed-isolation sweep — DECISIONS D67). */
/**
 * fldAiArtillery.
 * @param {*} u
 */
function fldAiArtillery(u) {
  var obj = __FIELD.objective; if (!obj) { fldAiGeneric(u); return; }
  var attacking = !!(__FIELD.attacker && u.side === __FIELD.attacker);
  var near = null, nd = 1e9, screen = false, U = __FIELD.units, i;
  for (i = 0; i < U.length; i++) {
    var e = U[i]; if (!e.alive || e === u) continue;
    if (e.side === u.side) { if (e.arm !== "art" && e.state !== "routing" && fldDist(u, e) < FLDA.BATTERY_SCREEN_R) screen = true; continue; }
    if (__FIELD.fog && typeof fldVisible === "function" && !fldVisible(u.side, e)) continue;
    var d = fldDist(u, e); if (d < nd) { nd = d; near = e; }
  }
  var face = near ? Math.atan2(near.x - u.x, -(near.z - u.z)) : (u.side === "US" ? 0 : Math.PI);
  var dObj = fldDist(u, obj), hz = fldHomeEdgeZ(u.side), sgn = (hz > obj.z) ? 1 : -1;
  // DISPLACE when an enemy closes on an unscreened battery — a defender bolts early (stays safe); an attacker
  // pushed forward accepts the risk and bolts only at point-blank (so it can be caught and overrun).
  var displaceR = attacking ? FLDA.BATTERY_OVERRUN_R : FLDA.BATTERY_DISPLACE_R;
  if (near && nd < displaceR && !screen) {
    u.formation = "column"; u.order = { type: "move", tx: u.x, tz: fldClamp(u.z + sgn * FLDA.BATTERY_DISPLACE_BACK, 40, FLD.FIELD_H - 40), tface: face };
    return;
  }
  if (attacking) {
    // push forward to a canister-support post on the objective's near face (exposed), then stand and fire
    var postZ = obj.z + sgn * obj.r * FLDA.BATTERY_FWD_FRAC;
    if (dObj > obj.r * FLDA.BATTERY_FWD_FRAC + 45) {
      u.formation = (dObj > obj.r + 200) ? "column" : "line";
      u.order = { type: "move", tx: fldClamp(obj.x + (u.x - obj.x) * 0.5, 120, FLD.FIELD_W - 120), tz: fldClamp(postZ, 40, FLD.FIELD_H - 40), tface: face };
      return;
    }
    u.formation = "line"; u.order = { type: "hold", tx: u.x, tz: u.z, tface: face };
    return;
  }
  // DEFENDING battery: stand and fire if a target is in (the long artillery) range — the usual case
  if (near && nd <= u.rng) { u.formation = "line"; u.order = { type: "hold", tx: u.x, tz: u.z, tface: face }; return; }
  // not yet in range -> move up to a firing stance just outside the objective ring, on its OWN side
  var tz2 = fldClamp(obj.z + sgn * (obj.r + FLDA.BATTERY_STANDOFF), 40, FLD.FIELD_H - 40);
  u.formation = "line"; u.order = { type: "move", tx: fldClamp(u.x, 120, FLD.FIELD_W - 120), tz: tz2, tface: face };
}

/* the CAVALRY doctrine — dispatch on the unit's role (default "flank"). */
/**
 * fldAiCavalry.
 * @param {*} u
 */
function fldAiCavalry(u) {
  var role = u.role || "flank";
  if (role === "scout") { fldCavScout(u); return; }
  if (role === "screen") { fldCavScreen(u); return; }
  if (role === "raid") { fldCavRaid(u); return; }
  fldCavFlank(u);
}

/* the enemy's exposed flank: a point beyond the objective toward the enemy's rear, offset to
   whichever lateral side this trooper is already nearer (wrap the open wing). */
/**
 * fldArmsFlankPoint.
 * @param {*} u
 * @param {*} obj
 */
function fldArmsFlankPoint(u, obj) {
  var foe = fldEnemy(u.side), homeZf = fldHomeEdgeZ(foe);
  var dir = (homeZf > obj.z) ? 1 : -1;                               // toward the enemy's home (their rear)
  var sideSign = (u.x <= obj.x) ? -1 : 1;                            // wrap the flank u is already nearer
  var fx = fldClamp(obj.x + sideSign * (obj.r * 1.7 + 120), 120, FLD.FIELD_W - 120);
  var fz = fldClamp(obj.z + dir * (obj.r + 90), 60, FLD.FIELD_H - 60);
  return { x: fx, z: fz };
}

/* FLANK: charge a catchable disordered line; ride for the open wing otherwise. A DEFENDING flanker
   (its side holds the objective) is a MOBILE RESERVE leashed to the hill — it only chases a target that
   has closed on the objective and otherwise guards the threatened wing (Stuart hit the Union right NEAR
   Henry House Hill; he did not abandon it). An ATTACKING flanker rides for the enemy's exposed wing.
   Fall back if caught wavering by a stronger enemy (cavalry won't trade a firefight it loses). */
/**
 * fldCavFlank.
 * @param {*} u
 */
function fldCavFlank(u) {
  var obj = __FIELD.objective; if (!obj) { fldAiGeneric(u); return; }
  var s = fldArmsScan(u);
  var defending = !!(__FIELD.attacker && u.side === fldEnemy(__FIELD.attacker));
  if (u.state === "wavering" && s.near && s.nd < 200 && s.near.men > u.men * 1.1) {
    var hz0 = fldHomeEdgeZ(u.side);
    u.formation = "line"; u.order = { type: "move", tx: u.x, tz: (hz0 > FLD.FIELD_H ? FLD.FIELD_H - 120 : 120), tface: u.facing };
    return;
  }
  // CHARGE a catchable disordered enemy in reach — a DEFENDING flanker only one that has closed on the hill
  // (the dual leash: don't get drawn off the decisive point), an ATTACKING flanker any exposed flank.
  if (s.weak && s.wd < FLDA.CAV_CHARGE_R && u.state !== "wavering"
      && (!defending || fldDist(s.weak, obj) < obj.r + FLDA.CAV_DEF_LEASH)) {
    u.order = { type: "charge", tx: s.weak.x, tz: s.weak.z, tface: Math.atan2(s.weak.x - u.x, -(s.weak.z - u.z)) };
    return;
  }
  if (defending) {
    // a committed RESERVE on the threatened wing of the contested ground (Stuart's troopers fought AT Henry
    // House Hill, not on a distant wing): move INTO the objective ring on the side the enemy is massing, adding
    // its weight to the hold (its men then count in fldObjectiveStep) while staying poised to charge.
    var sideSign = (s.near ? (s.near.x <= obj.x ? -1 : 1) : (u.x <= obj.x ? -1 : 1));
    var gx = fldClamp(obj.x + sideSign * obj.r * 0.55, 120, FLD.FIELD_W - 120);
    var gz = fldClamp(obj.z, 60, FLD.FIELD_H - 60);
    u.formation = "line"; u.order = { type: "move", tx: gx, tz: gz, tface: s.near ? Math.atan2(s.near.x - u.x, -(s.near.z - u.z)) : u.facing };
    return;
  }
  var aim = fldArmsFlankPoint(u, obj);
  if (s.near && s.nd <= u.rng * 0.92 && fldDist(u, aim) < 90) {      // on the flank, in carbine range -> fire from the saddle
    u.formation = "line"; u.order = { type: "hold", tx: u.x, tz: u.z, tface: Math.atan2(s.near.x - u.x, -(s.near.z - u.z)) };
    return;
  }
  u.formation = "column"; u.order = { type: "move", tx: aim.x, tz: aim.z, tface: Math.atan2(aim.x - u.x, -(aim.z - u.z)) };
}

/* SCOUT: range wide toward the enemy flank/rear to lift the fog (a cavalry brigade's wide sight
   is the side's recon); AVOID a stronger enemy that closes (a scout caught is a scout wasted). */
/**
 * fldCavScout.
 * @param {*} u
 */
function fldCavScout(u) {
  var obj = __FIELD.objective; if (!obj) { fldAiGeneric(u); return; }
  var s = fldArmsScan(u);
  if (s.near && s.nd < FLDA.SCOUT_AVOID && s.near.men > u.men * 0.8) {
    var away = Math.atan2(u.x - s.near.x, -(u.z - s.near.z));
    u.formation = "column"; u.order = { type: "move", tx: fldClamp(u.x + Math.sin(away) * 160, 120, FLD.FIELD_W - 120), tz: fldClamp(u.z - Math.cos(away) * 160, 60, FLD.FIELD_H - 60), tface: away };
    return;
  }
  var aim = fldArmsFlankPoint(u, obj);
  u.formation = "column"; u.order = { type: "move", tx: aim.x, tz: aim.z, tface: Math.atan2(aim.x - u.x, -(aim.z - u.z)) };
}

/* SCREEN: interpose between the nearest enemy scout/cav (else the nearest enemy) and the
   objective — deny the enemy his eyes and a clean flanking lane; drive off a broken scout. */
/**
 * fldCavScreen.
 * @param {*} u
 */
function fldCavScreen(u) {
  var obj = __FIELD.objective; if (!obj) { fldAiGeneric(u); return; }
  var s = fldArmsScan(u), threat = s.enemyCav || s.near;
  if (threat) {
    if (s.weak && s.wd < FLDA.CAV_CHARGE_R && u.state === "steady") {
      u.order = { type: "charge", tx: s.weak.x, tz: s.weak.z, tface: Math.atan2(s.weak.x - u.x, -(s.weak.z - u.z)) };
      return;
    }
    var mx = fldClamp((threat.x + obj.x) / 2, 120, FLD.FIELD_W - 120), mz = fldClamp((threat.z + obj.z) / 2, 60, FLD.FIELD_H - 60);
    u.formation = "line"; u.order = { type: "move", tx: mx, tz: mz, tface: Math.atan2(threat.x - u.x, -(threat.z - u.z)) };
    return;
  }
  var hz = fldHomeEdgeZ(u.side), sgn = (hz > obj.z) ? 1 : -1;
  u.formation = "line"; u.order = { type: "move", tx: u.x, tz: fldClamp(obj.z + sgn * (obj.r + 140), 60, FLD.FIELD_H - 60), tface: (u.side === "US" ? 0 : Math.PI) };
}

/* RAID: make for the enemy AMMUNITION TRAIN (the strategic raid-supply order, realized on the
   field); peel off a stronger interceptor en route; the actual reserve drain happens in
   fldArmsStep while the raider sits on the depot. No train (logistics off) -> behave as a flanker. */
/**
 * fldCavRaid.
 * @param {*} u
 */
function fldCavRaid(u) {
  var trains = __FIELD.trains, et = trains ? trains[fldEnemy(u.side)] : null;
  if (!et || !et.alive || et.reserve <= 0) { fldCavFlank(u); return; }
  var s = fldArmsScan(u);
  if (s.near && s.nd < FLDA.SCOUT_AVOID && s.near.men > u.men * 1.2 && fldDist(u, et) > et.radius) {
    var away = Math.atan2(u.x - s.near.x, -(u.z - s.near.z));
    u.formation = "column"; u.order = { type: "move", tx: fldClamp(u.x + Math.sin(away) * 150, 120, FLD.FIELD_W - 120), tz: fldClamp(u.z - Math.cos(away) * 150, 40, FLD.FIELD_H - 40), tface: away };
    return;
  }
  u.formation = "column"; u.order = { type: "move", tx: et.x, tz: et.z, tface: Math.atan2(et.x - u.x, -(et.z - u.z)) };
}

/* ===========================================================================
   THE PER-TICK STEP (T0 fldSimStep seam) — decay the visual timers, record charges
   (for the end-screen teaching), and apply the cavalry RAID on an enemy train.
   =========================================================================== */
/**
 * fldArmsStep.
 * @param {*} dt
 */
function fldArmsStep(dt) {
  if (!__FIELD.arms) return;
  var U = __FIELD.units, i, u;
  for (i = 0; i < U.length; i++) {
    u = U[i];
    if (u._artFlash > 0) u._artFlash = Math.max(0, u._artFlash - dt);
    if (u._canisterLive > 0) u._canisterLive = Math.max(0, u._canisterLive - dt);
    if (u.arm === "cav" && u.alive && u.order && u.order.type === "charge") u._everCharged = true;
  }
  var trains = __FIELD.trains; if (!trains) return;
  for (i = 0; i < U.length; i++) {
    u = U[i]; if (!u.alive || u.arm !== "cav" || (u.role || "flank") !== "raid" || u.state === "routing") { if (u) u._raiding = false; continue; }
    var et = trains[fldEnemy(u.side)]; if (!et || !et.alive || et.reserve <= 0) { u._raiding = false; continue; }
    if (fldDist(u, et) <= et.radius * 0.5) { var deg = Math.min(et.reserve, FLDA.RAID_RATE * dt); et.reserve -= deg; u._raiding = true; }
    else u._raiding = false;
  }
}

/* ===========================================================================
   HUD  (T0 fldRenderHud seam) — a battery's range band / a trooper's role.
   =========================================================================== */
/**
 * fldArmsHudSelected.
 * @param {*} u
 */
function fldArmsHudSelected(u) {
  if (!__FIELD.arms || !u) return "";
  if (u.arm === "art") {
    var nd = 1e9, U = __FIELD.units, i;
    for (i = 0; i < U.length; i++) {
      var e = U[i]; if (!e.alive || e.side === u.side) continue;
      if (__FIELD.fog && typeof fldVisible === "function" && !fldVisible(u.side, e)) continue;   // bug-hunt MED: don't leak a hidden enemy's proximity through the canister-range band (fog-gate like the AI scanners)
      var d = fldDist(u, e); if (d < nd) nd = d;
    }
    var band = (nd <= FLDA.CANISTER_R)
      ? '<span style="color:#e0b15a;">&#9888; Canister range &mdash; murderous in the open</span>'
      : '<span style="color:#9db4cc;">Long range &mdash; bombardment</span>';
    // D74: show the GUN COUNT for a battery built on the universal gun model (its fire derives from guns, not "men").
    // A LEGACY men-based battery (Bull Run's Griffin/Ricketts — kept byte-identical, no `guns` field) shows no count;
    // it migrates to the gun model (gaining the count) whenever its balance is intentionally re-vetted. Cosmetic.
    var gunTxt = (typeof u.guns === "number" && u.guns > 0) ? (u.guns + (u.guns === 1 ? " gun &middot; " : " guns &middot; ")) : "";
    return '<div style="font-size:12px;margin-top:2px;">Battery &middot; ' + gunTxt + band + ' &middot; reach ' + Math.round(u.rng) + ' yd</div>';
  }
  if (u.arm === "cav") {
    var role = u.role || "flank";
    var map = { scout: "Scout &mdash; lifting the fog", flank: "Flank &mdash; the open wing &amp; the charge", screen: "Screen &mdash; denying the enemy his eyes", raid: "Raid &mdash; for the enemy trains" };
    var raiding = u._raiding ? ' &middot; <span style="color:#e0b15a;">on the depot</span>' : '';
    return '<div style="font-size:12px;margin-top:2px;color:#cdbfa2;">Cavalry &middot; ' + (map[role] || "Flank") + raiding + '</div>';
  }
  return "";
}

/* end-screen teaching payoff (T0 fldOnOver seam) — the lost battery / the cavalry charge. */
/**
 * Render fldArmsEndHtml UI.

 * @returns {string} HTML string.
 */
function fldArmsEndHtml() {
  if (!__FIELD.arms) return "";
  var U = __FIELD.units, lostArt = 0, hadCav = false, i, u;
  for (i = 0; i < U.length; i++) {
    u = U[i];
    if (u.arm === "art" && !u.alive) lostArt++;
    if (u.arm === "cav") hadCav = true;
  }
  if (!lostArt && !hadCav) return "";
  var body = "";
  if (lostArt) body += 'Guns taken in the rush could not be carried off &mdash; a battery overrun is a battery lost (Griffin’s and Ricketts’s regulars on Henry House Hill). Massed canister shatters a charge across open ground, but it is fuze-immune metal at close range, not a wall: drive infantry into the guns and they fall. ';
  if (hadCav) body += 'Cavalry decided by movement, not the firefight &mdash; a mounted charge broke a wavering or flanked line but rarely a formed one with leveled bayonets, and troopers earned their keep scouting, screening, and raiding the trains. ';
  return '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:6px;">The arms of the service</div>' +
    '<div style="font-size:13px;opacity:.9;line-height:1.5;">' + body + '<span style="opacity:.7;">(Verified: Hess, Civil War Field Artillery; Naisawald, Grape and Canister.)</span></div></div>';
}

/* ===========================================================================
   2D RENDERER (T0 fld2dDraw seam) — a brass gun + limber for artillery (muzzle flash +
   a canister cone toward the target) and a mounted trooper for cavalry (a charge trail).
   CVD-safe: distinct SHAPES, not colour alone; honors reduceMotion (no flash/cone/trail).
   =========================================================================== */
/**
 * fldDrawArms.
 * @param {*} ctx
 * @param {*} v
 */
function fldDrawArms(ctx, v) {
  if (!__FIELD.arms) return;
  var U = __FIELD.units, ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  var rm = (typeof fldReduceMotion === "function") && fldReduceMotion();
  for (var i = 0; i < U.length; i++) {
    var u = U[i]; if (!u.alive) continue;
    if (u.arm !== "art" && u.arm !== "cav") continue;
    if (__FIELD.fog && u.side !== ps && typeof fldVisible === "function" && !fldVisible(ps, u)) continue;
    var cx = v.ox + u.x * v.s, cz = v.oz + u.z * v.s;
    if (u.arm === "art") fldDrawBattery(ctx, u, cx, cz, rm);
    else fldDrawTrooper(ctx, u, cx, cz, rm);
  }
}
/**
 * fldDrawBattery.
 * @param {*} ctx
 * @param {*} u
 * @param {*} cx
 * @param {*} cz
 * @param {*} rm
 */
function fldDrawBattery(ctx, u, cx, cz, rm) {
  ctx.save(); ctx.translate(cx, cz); ctx.rotate(u.facing);          // local -y = the gun's front (toward facing)
  if (!rm && u._canisterLive > 0) {                                 // the canister cone (a faint wedge toward the target)
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = "#e8b85a";
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-22, -54); ctx.lineTo(22, -54); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.strokeStyle = "#c19a3a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -13); ctx.stroke();   // the barrel
  if (!rm && u._artFlash > 0) { ctx.fillStyle = "#ffe2a0"; ctx.beginPath(); ctx.arc(0, -14, 3.4, 0, 7); ctx.fill(); }    // muzzle flash
  ctx.strokeStyle = "#3a2c1c"; ctx.lineWidth = 1.6;                 // the carriage wheels
  ctx.beginPath(); ctx.arc(-5, 4, 3.2, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(5, 4, 3.2, 0, 7); ctx.stroke();
  ctx.restore();
}
/**
 * fldDrawTrooper.
 * @param {*} ctx
 * @param {*} u
 * @param {*} cx
 * @param {*} cz
 * @param {*} rm
 */
function fldDrawTrooper(ctx, u, cx, cz, rm) {
  var charging = !!(u.order && u.order.type === "charge");
  ctx.save(); ctx.translate(cx, cz); ctx.rotate(u.facing);          // local -y = the front; +y = behind
  if (!rm && charging) {                                            // a fading motion trail behind a charging troop
    ctx.strokeStyle = "#d8c89a";
    for (var k = 1; k <= 3; k++) { ctx.globalAlpha = 0.26 - k * 0.07; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 8 * k, 2.2, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = "#2a2016"; ctx.lineWidth = 1.5; ctx.fillStyle = "#5a4330";
  ctx.fillRect(-5, -3, 10, 5);                                      // the horse
  ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -9); ctx.stroke();   // the rider
  ctx.fillStyle = u.side === "US" ? "#9fb6d8" : "#d8a79f"; ctx.beginPath(); ctx.arc(0, -10, 2, 0, 7); ctx.fill();
  if (charging) { ctx.fillStyle = "#e8d28a"; ctx.beginPath(); ctx.arc(3, -11, 1.6, 0, 7); ctx.fill(); }   // a raised-saber glint
  ctx.restore();
}

/* ===========================================================================
   3D RENDERER (T0 fld3dInit / fld3dRender seams) — a gun + wheels for artillery,
   a horse + rider for cavalry. THREE is referenced only here (loads async).
   =========================================================================== */
function fld3dBuildArms() {
  var T = window.THREE; if (!T || !__FIELD.scene) return;
  fld3dDisposeArms();
  if (!__FIELD.arms) { __FIELD._arm3d = null; return; }
  __FIELD._arm3d = {};
  var U = __FIELD.units; var grp = new T.Group(); __FIELD.scene.add(grp); __FIELD._arm3dGroup = grp;
  for (var i = 0; i < U.length; i++) {
    var u = U[i]; if (u.arm !== "art" && u.arm !== "cav") continue;
    var g = new T.Group();
    if (u.arm === "art") {
      var barrel = new T.Mesh(new T.CylinderGeometry(1.6, 1.9, 18, 8), new T.MeshLambertMaterial({ color: "#b9912f" })); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 8, -6); g.add(barrel);
      var wl = new T.Mesh(new T.CylinderGeometry(5, 5, 2, 12), new T.MeshLambertMaterial({ color: "#3a2c1c" })); wl.rotation.z = Math.PI / 2; wl.position.set(-7, 5, 2); g.add(wl);
      var wr = new T.Mesh(new T.CylinderGeometry(5, 5, 2, 12), new T.MeshLambertMaterial({ color: "#3a2c1c" })); wr.rotation.z = Math.PI / 2; wr.position.set(7, 5, 2); g.add(wr);
      var flash = new T.Mesh(new T.SphereGeometry(3, 8, 8), new T.MeshBasicMaterial({ color: "#ffe2a0", transparent: true, opacity: 0 })); flash.position.set(0, 8, -16); flash.name = "flash"; g.add(flash);
    } else {
      var horse = new T.Mesh(new T.BoxGeometry(16, 8, 6), new T.MeshLambertMaterial({ color: "#3a2c20" })); horse.position.y = 8; g.add(horse);
      var rider = new T.Mesh(new T.CylinderGeometry(2, 2.4, 11, 6), new T.MeshLambertMaterial({ color: u.side === "US" ? "#3a5a9a" : "#9a4a3a" })); rider.position.y = 17; g.add(rider);
    }
    grp.add(g); __FIELD._arm3d[u.id] = g;
  }
}
function fld3dSyncArms() {
  var map = __FIELD._arm3d; if (!map) return;
  var U = __FIELD.units, ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  var rm = (typeof fldReduceMotion === "function") && fldReduceMotion();
  for (var i = 0; i < U.length; i++) {
    var u = U[i], g = map[u.id]; if (!g) continue;
    var shown = u.alive && !(__FIELD.fog && u.side !== ps && typeof fldVisible === "function" && !fldVisible(ps, u));
    g.visible = shown; if (!shown) continue;
    var y = (typeof fldTerrainH === "function") ? fldTerrainH(u.x, u.z) : 0;
    g.position.set(u.x, y, u.z); g.rotation.y = -u.facing;
    var flash = g.getObjectByName("flash");
    if (flash && flash.material) flash.material.opacity = (!rm && u._artFlash > 0) ? 0.8 : 0;
  }
}
function fld3dDisposeArms() {
  var grp = __FIELD._arm3dGroup; if (!grp) { __FIELD._arm3d = null; return; }
  try { grp.traverse(function (o) { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); }); if (grp.parent) grp.parent.remove(grp); } catch (e) {}
  __FIELD._arm3dGroup = null; __FIELD._arm3d = null;
}
