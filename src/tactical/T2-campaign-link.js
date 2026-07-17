/* ============================================================================
   src/tactical/T2-campaign-link.js  —  TACTICAL ENGINE · PHASE A (CONNECT THE LAYERS)

   The connective tissue between the owner-mode GRAND STRATEGY and the real-time
   TACTICAL engine (V1-CHECKLIST Phase A; DECISIONS D61). Three ties, all here:

     A1  CONDITION the tactical brigades from the strategic-desk army. The army your
         war fielded (bridgeArmy(C): strength / equipment / morale / arms / leadership)
         scales the PLAYER side's men + morale + fatigue and RE-ARMS a fraction of the
         line from the weapons you actually bought (C.armory.loadout). Same 74-anchor /
         +-12% band as the Classic-hex conditioning (86-battle-conditioning _a6Condition);
         since PM3 (D277) the auto-resolve runs THIS same conditioning headless — the
         strategic war reaches every mode as INPUTS (PL-2), and a fresh/no-investment
         army plays ~ the nominal scenario.

     A2  LAUNCH a tactical battle from the bridge (a "Fight in real time" option beside
         Auto-resolve + the Classic "To the Field") + a custom FREE SKIRMISH menu
         (pick side / forces / terrain / era / fog). The campaign First Bull Run routes
         to the historical bullrun1 scenario (US attacker); every other campaign battle
         gets a CONDITIONED procedural brigade fight derived from its OOB (bd.us/cs/atk/
         year/feat). The standalone sandbox + the menu Bull Run are untouched.

     A3  FEED the result back into the campaign. The real-time fight decides the outcome
         and the REAL casualty fractions (men lost / men fielded, per side, counting
         reinforcements via maxMen); those fractions drive the shared apply path
         (build a conditioned hex roster via startBattleRuntime, _arApplyCasualties, then
         the engine's own campaignAdvance -> _t1Resolve: manpower / clock / strategy /
         enemyWill / victory). Since PM3 (D277) the auto-resolve runs the SAME battle
         headless and feeds back through THIS same compute/apply path — one battle-truth
         model (PL-1): fought and delegated battles share the consequence pipeline
         because they share the field. Aborting (Esc) before the battle ends
         simply returns to the briefing — the battle is re-launchable, nothing advances.

   ARCHITECTURE: this module ORCHESTRATES. The combat / morale / objective / victory math
   all stays in T0; T0+T1 expose tiny guarded seams (campaignCtx / skirmish / the
   fldResetRun conditioning hook / the campaign end-screen + exit + menu hooks) that are
   NO-OPS for the standalone paths -> probe-field / probe-bullrun / probe-fog /
   probe-autopause / probe-ai hold by construction; Classic is never touched. Determinism:
   no RNG in conditioning or outcome (the fight is seeded in T0) -> probes reproduce.

   Bare-name globals (G, GAME_DATA, BATTLES, CHAINS, __FIELD, FLD, bridgeArmy,
   _brgNextBattle, _arApplyCasualties, startBattleRuntime, campaignAdvance, openSheet,
   closeSheet, saveLocal, _audLeaveBattle, playSfx, openMainMenu, the fld* T0 helpers,
   the _af* armory mapping). All new helpers are uniquely prefixed and defined once. No
   literal comment-closer inside this block.
   ============================================================================ */

/* ---- the live campaign (or null). One place, guarded. ---- */
function _fldCamp() { try { return (typeof G !== "undefined" && G.campaign) ? G.campaign : null; } catch (e) { return null; } }

/* ===========================================================================
   A1 — CONDITIONING the tactical army from the strategic war (bridgeArmy)
   =========================================================================== */
/* A year-appropriate standard-issue infantry arm (engine WEAPONS key) per side; the
   emergent US firepower edge is baked in (the South lags a year), then the player's
   bought loadout re-arms a fraction on top (A1). Keys exist in the base WEAPONS table. */
function _fldYearWeapon(year, side) {
  year = (typeof year === "number" && isFinite(year)) ? year : 1862;
  if (side === "CS") return year <= 1861 ? "smooth" : "rifled";
  return year <= 1861 ? "rifled" : "spring";
}
/* Build a re-arm plan: an array of engine WEAPONS keys claimed by the player's bought
   loadout, weighted by each weapon's fraction (mirrors 59-armory-field _afWireUnits, the
   same _afEngineKey mapping + era gate), to assign across the player's brigades in order.
   Returns [] when there is no loadout / no campaign -> the line keeps its standard arm. */
function _fldArmPlan(C, year, count) {
  var out = [];
  try {
    if (!C || !C.armory || !C.armory.loadout || typeof WEAPONS === "undefined") return out;
    if (typeof _afEngineKey !== "function") return out;
    var lo = C.armory.loadout, by = (typeof year === "number" && isFinite(year)) ? year : null;
    for (var id in lo) {
      if (!lo.hasOwnProperty(id)) continue;
      var frac = Number(lo[id]); if (!isFinite(frac) || frac <= 0) continue;
      var ek = _afEngineKey(id); if (!ek || !WEAPONS[ek]) continue;
      if (by != null && WEAPONS[ek].era && WEAPONS[ek].era > by) continue;   // honor the engine's era gate (fair vs the era-locked AI)
      var fr = Math.min(1, frac); if (fr > 0.9995) fr = 1;
      var cnt = Math.floor(count * fr + 1e-9);
      for (var k = 0; k < cnt; k++) out.push(ek);
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("fldCampaignArmory:", e); }
  return out;
}
/* Condition ONE player unit. Reads the per-launch params stashed on the campaign ctx
   (computed once by fldCampaignCondition). Used for the initial line AND for player-side
   reinforcements as they detrain (T1 fldReinforceSpawn seam) -> your war fields stronger
   reserves too. No-op for the enemy / off-campaign. Deterministic (index-based re-arm). */
function fldCampaignConditionUnit(u) {
  var ctx = __FIELD.campaignCtx; if (!ctx || !ctx._params || !u) return;
  var p = ctx._params;
  if (u.side !== p.playerSide) {
    // PM2 (E43 · D250/D266): the enemy STRENGTH leg — strategic will-erosion musters a THINNER enemy
    // (desertion), via the ONE shared bridge contract (bridgeEnemyWillStrengthMul). Exact-1.0 at the
    // fresh baseline → guarded no-op (byte-identical); covers the initial enemy line AND enemy
    // reinforcements as they arrive (this same function is the T1 fldReinforceSpawn seam).
    var em = p.enemyStrengthMul;
    if (typeof em === "number" && isFinite(em) && em !== 1) {
      u.men = Math.max(1, Math.round((u.men || 1) * em));
      u.maxMen = Math.max(u.men, Math.round((u.maxMen || u.men) * em));
    }
    return;
  }
  u.men = Math.max(1, Math.round((u.men || 1) * p.strengthMul));
  u.maxMen = Math.max(u.men, Math.round((u.maxMen || u.men) * p.strengthMul));
  u.morale = fldClamp((u.morale || 78) + p.moraleAdd + (p.entrench ? 3 : 0), 5, 99);
  u.maxMor = Math.max(u.morale, u.maxMor || u.morale);
  if (p.fatigueAdd) u.fatigue = Math.min(100, (u.fatigue || 0) + p.fatigueAdd);
  // re-arm the player's INFANTRY from the bought loadout, by a running index across the army
  if (u.arm === "inf" && p.armPlan && p.armPlan.length) {
    var ek = p.armPlan[p._armIdx % p.armPlan.length];
    if (typeof p._armIdx === "number" && p._armIdx < p.armPlan.length && ek && typeof fldWeaponProfile === "function" && typeof WEAPONS !== "undefined" && WEAPONS[ek]) {
      var prof = fldWeaponProfile(ek, "inf"); u.weapon = ek; u.pow = prof.pow; u.rng = prof.rng;
    }
    p._armIdx = (p._armIdx || 0) + 1;
  }
  // B-4: condition the player's ARTILLERY from the bought Cannon Corps (the dominant battery type) — the
  // artillery arm you built on the President's Desk becomes the battery you field (reach / per-shot weight /
  // canister strength). No-op when arms off OR no batteries bought (p.artProfile null) -> the field battery
  // keeps its nominal scenario profile, so a no-Cannon-Corps army fields ~ the nominal piece (balanced like A1).
  if (__FIELD.arms && u.arm === "art" && p.artProfile) {
    if (typeof p.artProfile.rng === "number") u.rng = p.artProfile.rng;
    if (typeof p.artProfile.pow === "number") u.pow = p.artProfile.pow;
    u._canisterScale = (typeof p.artProfile.canisterScale === "number") ? p.artProfile.canisterScale : 1;
  }
}
/* B-4: map the player's bought Cannon Corps (C.artillery.batteries -> the DOMINANT gun type in
   GAME_DATA.artillery) onto a field-battery profile. Anchored ~ the Napoleon (rangeYds 1600, quality 78,
   accuracy 60) so no investment -> null -> the nominal field battery (balanced like the A1 strength anchor).
   "Build Napoleons -> murderous canister; build Whitworths -> long-range counter-battery with no close spike."
   Deterministic; reads only data + C. FLD.* / fldClamp are T0 globals (resolved at launch). */
function _fldArtProfile(C) {
  try {
    if (!C || !C.artillery || !C.artillery.batteries || typeof GAME_DATA === "undefined" || !GAME_DATA.artillery || !GAME_DATA.artillery.guns) return null;
    var bats = C.artillery.batteries, guns = GAME_DATA.artillery.guns;
    // dominant battery type by count; SORTED keys + a stable id tie-break so the choice is order-independent
    // (bug-hunt LOW: removes the only Object-key-order dependence in the arms layer — deterministic on ties).
    var keys = []; for (var kk in bats) { if (bats.hasOwnProperty(kk)) keys.push(kk); }
    keys.sort();
    var bestId = null, bestN = 0;
    for (var ki = 0; ki < keys.length; ki++) { var id = keys[ki], n = Number(bats[id]) || 0; if (n > bestN) { bestN = n; bestId = id; } }
    if (!bestId || bestN <= 0) return null;                       // no investment -> neutral (the nominal field battery)
    var g = null; for (var i = 0; i < guns.length; i++) { if (guns[i].id === bestId) { g = guns[i]; break; } }
    if (!g) return null;
    var rangeYds = Number(g.rangeYds) || 1600, quality = Number(g.quality) || 70, accuracy = Number(g.accuracy) || 70;
    var hasCanister = false, pr = g.projectiles || [];
    for (var k = 0; k < pr.length; k++) { if (String(pr[k]).toLowerCase().indexOf("canister") >= 0) { hasCanister = true; break; } }
    var rng = fldClamp(FLD.RANGE_ART * (rangeYds / 1600), 560, 1700);                  // Whitworth reaches far; a howitzer is short-armed
    var pow = fldClamp(0.9 + (accuracy - 60) / 100 * 0.55, 0.85, 1.45);                // accuracy lifts per-shot weight
    var canisterScale = hasCanister ? fldClamp(0.7 + (quality - 58) / 100 * 0.7, 0.7, 1.2) : 0.28;  // a no-canister gun (Whitworth) loses the close spike
    return { rng: rng, pow: pow, canisterScale: canisterScale, gun: g.name, hasCanister: hasCanister };
  } catch (e) { return null; }
}
/* Condition the whole fielded army from bridgeArmy(C) + the battle-prep orders. Called once
   per launch from the T0 fldResetRun hook (campaignCtx set only on a campaign launch —
   including the PM3 headless auto-resolve, which routes through this exact seam).
   Anchored at the fresh-campaign baseline 74 (+-12%), exactly like _a6Condition (86) ->
   the real-time, Classic-hex, and delegated modes condition identically; a no-investment
   army plays ~ the nominal scenario. */
function fldCampaignCondition() {
  var ctx = __FIELD.campaignCtx; if (!ctx || ctx._conditioned) return;
  var C = _fldCamp(); if (!C) return;
  // D401 consequence-only link: identifies which already-built tactical unit
  // represents the active War Career slot. No combat reader consumes it.
  if (typeof warCareerLinkField === "function") {
    try { warCareerLinkField(C, ctx, __FIELD); } catch (wcErr) { if (typeof console !== "undefined" && console.warn) console.warn("warCareerLinkField:", wcErr); }
  }
  if (typeof bridgeArmy !== "function") { ctx._conditioned = true; return; }
  var ps = (C.side === "CS") ? "CS" : "US";
  var a, bp;
  try { a = bridgeArmy(C); } catch (e) { a = null; }
  if (!a) { ctx._conditioned = true; return; }
  bp = C.battlePrep || {};
  var overall = (typeof a.overall === "number" && isFinite(a.overall)) ? a.overall : 74;
  var moraleF = (typeof a.morale === "number" && isFinite(a.morale)) ? a.morale : 60;
  var year = (ctx.bd && typeof ctx.bd.year === "number") ? ctx.bd.year : ((C.clock && C.clock.year) || 1861);
  // count the player's infantry brigades so the re-arm plan spans the whole eventual line — INCLUDING
  // scheduled reinforcements (bug-hunt F5: else the running _armIdx exhausts the plan on the initial line
  // and player reinforcements detrain unarmed by the bought loadout).
  var infN = 0, i;
  for (i = 0; i < __FIELD.units.length; i++) { var uu = __FIELD.units[i]; if (uu && uu.side === ps && uu.arm === "inf") infN++; }
  var rs = __FIELD.reinforce;
  if (rs && rs.length) for (i = 0; i < rs.length; i++) { var sp = rs[i] && rs[i].spec; if (sp && sp.side === ps && (sp.arm === "inf" || !sp.arm)) infN++; }
  ctx._params = {
    playerSide: ps,
    strengthMul: fldClamp(1.0 + (overall - 74) * 0.0045, 0.88, 1.12),   // same anchor/band as _a6Condition (D47.1)
    moraleAdd: Math.round((moraleF - 60) * 0.3),
    fatigueAdd: bp.forcedMarch ? 22 : 0,
    entrench: !!bp.entrench,
    armPlan: _fldArmPlan(C, year, infN),
    _armIdx: 0,
    artProfile: _fldArtProfile(C),   // B-4: the bought Cannon Corps -> the field battery's reach/power/canister (null = nominal)
    // PM2 (E43 · D250/D266): the shared enemy-conditioning contract — will-erosion thins the enemy
    // muster (exact-1.0 fresh, debuff-only, floor 0.90; the 85 bridge owns the math).
    enemyStrengthMul: (typeof bridgeEnemyWillStrengthMul === "function") ? bridgeEnemyWillStrengthMul(C) : 1,
  };
  // T13 (pontoon bridging): the strategic Engineer Works Corps (57-engineering -> bridgeArmy.engineering) lays
  // field bridges faster — the A1 anchor, the same way B-4 wired the Cannon Corps onto the field battery. >1 =
  // faster sappers; defensively read (the facet may be absent), and only on a campaign launch (standalone stays 1).
  var engR = (typeof a.engineering === "number" && isFinite(a.engineering)) ? a.engineering : null;
  if (engR != null) __FIELD.engCorpsSpeed = fldClamp(1 + (engR - 50) * 0.006, 0.78, 1.34);
  for (i = 0; i < __FIELD.units.length; i++) fldCampaignConditionUnit(__FIELD.units[i]);
  // raid-supply prep: the enemy fights hungry and short of cartridges (mirrors _a6Condition's enemy debuff)
  if (bp.raidSupply) {
    var es = fldEnemy(ps);
    for (i = 0; i < __FIELD.units.length; i++) {
      var e = __FIELD.units[i]; if (!e || e.side !== es) continue;
      e.morale = fldClamp((e.morale || 78) - 6, 5, 99);
      if (typeof e.ammo === "number") e.ammo = Math.max(1, Math.round(e.ammo * 0.8));
    }
  }
  ctx._conditioned = true;
}

/* ===========================================================================
   A2 — LAUNCH a tactical battle from the campaign bridge
   =========================================================================== */
/* Does this campaign battle have a hand-built historical tactical scenario? First Bull Run
   maps to the bullrun1 scenario, but only for a US player (the scenario is built US-attacker;
   the CS-player tactical mode is Phase B). Everything else -> a conditioned procedural fight. */
function _fldCampaignScenarioFor(bd, C) {
  if (!bd || !C) return null;
  // bug-hunt F7: a recovery role-flip (the player must DEFEND) cannot use the fixed US-attacker bullrun1
  // scenario — fall through to the procedural fight, which honors the flipped bd.atk. (CS-player + the
  // flipped Bull Run are Phase B work.)
  if (C.flipAtk) return null;
  if (bd.id === "bullrun1" && C.side === "US" && typeof fldBrData === "function" && fldBrData()) return "bullrun1";
  return null;
}
/* Procedural skirmish params derived from a campaign battle definition (bd). Brigade scale,
   abstracted (a handful of brigades a side; absolute men are an abstraction, the loss FRACTION
   is what feeds back). attacker = bd.atk so the asymmetric victory + the role-aware defender AI
   (D60) apply; terrain from bd.feat. */
function _fldCampaignSkirmishParams(bd, C) {
  var ps = (C.side === "CS") ? "CS" : "US", es = fldEnemy(ps);
  var totP = (ps === "US") ? (bd.us || 18000) : (bd.cs || 18000);
  var totE = (es === "US") ? (bd.us || 18000) : (bd.cs || 18000);
  // E59 (D288) — ODDS-PRESERVING brigade scale. The OLD scheme clamped brigade COUNT to [2,5] and
  // men-per-brigade to [1300,2100] INDEPENDENTLY, so the two sides' effective men were each pinned to
  // [2600,10500] with no regard for their RATIO: Fort Sumter's authored 6:1 collapsed to 2600-vs-2600
  // (a coin flip that took a fresh delegate up to 9 attempts to win), and Fredericksburg's 1.58:1
  // collapsed to 10500-vs-10500 (both sides saturated -> 1:1). The field is still a handful of
  // brigades a side (count [2,5] x men [1300,2100]; effective men per side [2600,10500]; the loss
  // FRACTION is what feeds back, absolute men stay an abstraction), but the two sides are now derived
  // JOINTLY (_skForces) so the AUTHORED men ratio (bd.us:bd.cs) SURVIVES -- proportionally, up to a
  // capped SK_MAX_ODDS. The cap is deliberate and symmetric: the campaign advances on a WIN, so a
  // field the disadvantaged side cannot contest would SOFT-LOCK the delegated chain at the first
  // historical rout (measured E59 A/B: full preservation strands the delegated US at Sumter and the
  // CS at Kernstown; 1.8 keeps the US completing at mcl 1 and the CS reaching Spotsylvania, while a
  // walkover reads as a decisive ~1.8:1 edge, no longer a coin flip). This is an INPUT-fidelity
  // ceiling of the brigade abstraction, NEVER a D74 output gate -- the sim still decides freely, and
  // it is shared byte-for-byte by the fought procedural path AND the PM3 headless auto-resolve (D277).
  var SK_MAX_ODDS = 1.8;
  function _skDecomp(eff) {   // effective men -> {count in [2,5], men in [1300,2100]}, count*men ~= eff (ceil keeps men <= 2100)
    eff = Math.max(2600, Math.min(10500, eff));
    var n = Math.max(2, Math.min(5, Math.ceil(eff / 2100)));
    return { count: n, men: Math.max(1300, Math.min(2100, Math.round(eff / n))) };
  }
  function _skForces(a, b) {   // authored totals (a = this side, b = the other) -> this side's {count, men}, ratio-true within the cap
    a = Math.max(1, a); b = Math.max(1, b);
    var big = Math.max(a, b), small = Math.min(a, b);
    var effBig = Math.max(3400, Math.min(10500, 3400 + big * 0.13));   // battle scale: a grand field fills the 5-brigade line
    var ratio = Math.min(SK_MAX_ODDS, big / small);                    // the represented odds, capped (symmetric)
    var effSmall = effBig / ratio;
    if (effSmall < 2600) { effSmall = 2600; effBig = Math.min(10500, 2600 * ratio); }   // a floored weak side lifts the strong side to hold the odds
    effSmall = Math.max(2600, Math.min(effBig, effSmall));
    return _skDecomp((a >= b) ? effBig : effSmall);
  }
  var fP = _skForces(totP, totE), fE = _skForces(totE, totP);
  var feat = (bd.feat || "") + "";
  var terrain = /ridge|hills/.test(feat) ? "ridge" : (/woods|swamp/.test(feat) ? "woods" : "open");
  return {
    playerSide: ps, attacker: bd.atk || ps, year: bd.year || 1862,
    countPlayer: fP.count, countEnemy: fE.count, menPlayer: fP.men, menEnemy: fE.men,
    weaponPlayer: _fldYearWeapon(bd.year, ps), weaponEnemy: _fldYearWeapon(bd.year, es),
    terrain: terrain, holdToWin: 36, name: bd.name || "Engagement", year2: bd.year,
  };
}
/* THE BRIDGE LAUNCH (A2 + A1 + A3). Called by the "Fight in real time" button (src/85).
   Routes to the historical scenario or a conditioned procedural fight, sets the campaign ctx
   so fldResetRun conditions the army (A1) and the end screen feeds it back (A3), and wires the
   abort-return so leaving before the battle ends drops back to the briefing (re-launchable). */
function fldLaunchCampaignBattle(C) {
  C = C || _fldCamp(); if (!C) return;
  if (typeof _brgNextBattle !== "function") return;
  var bd = _brgNextBattle(C); if (!bd) { if (typeof toast === "function") toast("No battle to fight."); return; }
  // bug-hunt F6: compute the recovery-flip orientation for the FIGHT, but do NOT consume C.flipAtk here —
  // the real-time path is abort-relaunchable (Esc returns to the briefing), so consuming at launch would
  // lose the flip if the player backs out and re-attempts in ANY mode. It is consumed once, at RESOLUTION
  // (fldCampaignApplyOutcome). launchCampaignBattle / bridgeAutoResolve still see the live flag if used.
  var fightBd = C.flipAtk ? Object.assign({}, bd, { atk: (bd.atk === "US" ? "CS" : "US") }) : bd;
  var scn = _fldCampaignScenarioFor(bd, C);   // null on a recovery flip (F7) -> procedural honors the flipped atk
  var ctx = { bd: fightBd, scn: scn, fromCampaign: true, _conditioned: false };
  if (scn) {
    fldLaunchSandbox({ scenario: scn, renderer: "3d", campaign: ctx });
    try { if (typeof fldBullRunBriefing === "function") fldBullRunBriefing(); } catch (e) {}
  } else {
    fldLaunchSandbox({ renderer: "3d", campaign: ctx, skirmish: _fldCampaignSkirmishParams(fightBd, C) });
    try { fldCampaignBriefing(C, fightBd); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("fldCampaignBriefing:", e); }
  }
  // abort (Esc / Exit before the battle ends) returns to the bridge briefing rather than the main menu
  __FIELD._returnFn = function () { fldCampaignReturn(C); };
}
/* The abort-return surface: reopen the bridge briefing wired the same as the interstitial did
   (Back -> the strategic turn; To the Field -> the Quartermaster/Classic battle). */
function fldCampaignReturn(C) {
  C = C || _fldCamp(); if (!C) return;
  try {
    if (typeof openSheet === "function" && typeof bridgeBriefingHTML === "function") {
      openSheet(bridgeBriefingHTML(C));
      if (typeof bridgeWireBriefing === "function") {
        bridgeWireBriefing(C,
          function () { if (typeof _pdShowTurnInterstitial === "function") _pdShowTurnInterstitial(); else if (typeof openUpgrade === "function") openUpgrade(); },
          function () { if (typeof openUpgrade === "function") openUpgrade(); });
      }
    } else if (typeof openUpgrade === "function") { openUpgrade(); }
    else if (typeof openMainMenu === "function") { openMainMenu(); }
  } catch (e) { if (typeof openMainMenu === "function") openMainMenu(); }
}

/* ===========================================================================
   A2 — the FREE SKIRMISH builder + setup menu (pick side / forces / terrain / era)
   =========================================================================== */
/* Adjust the base sandbox terrain for a chosen variant (additive — only ever runs on a
   skirmish / procedural-campaign launch, never the verbatim sandbox path). */
function _fldApplyTerrainVariant(variant) {
  var t = __FIELD.terrain; if (!t) return;
  if (variant === "open") { t.woods = []; }
  else if (variant === "ridge") { if (t.hill) { t.hill.h = 40; t.hill.s = 250; } t.woods = [t.woods && t.woods[0]].filter(Boolean); }
  else if (variant === "river") { t.woods = [t.woods && t.woods[0]].filter(Boolean); if (typeof fldEngInstallRiver === "function") fldEngInstallRiver(); }   // T13: a river to ford or bridge
  // "woods" = the default fldBuildTerrain shape (unchanged)
}
/* THE GENERALIZED OOB BUILDER (T0 fldInitSim skirmish seam). Builds terrain + a custom OOB
   from opts.skirmish and returns true; T0 then runs fldResetRun (which conditions the army if a
   campaign ctx is set) and early-returns. Returns false if there are no skirmish params (T0
   falls through to the verbatim 2-brigade sandbox -> byte-identical, probe-field holds). */
function fldSkirmishOOB(opts) {
  var sk = opts && opts.skirmish; if (!sk) return false;
  __FIELD.scenario = "skirmish";
  __FIELD.autoBoth = !!opts.autoBoth;
  fldBuildTerrain();
  _fldApplyTerrainVariant(sk.terrain || "woods");
  __FIELD.attacker = sk.attacker || null;
  __FIELD.defender = sk.attacker ? fldEnemy(sk.attacker) : null;
  __FIELD.holdToWin = (typeof sk.holdToWin === "number") ? sk.holdToWin : FLD.HOLD_TO_WIN;
  __FIELD.reinforce = null;
  var ps = (sk.playerSide === "CS") ? "CS" : "US", es = fldEnemy(ps);
  var ox = FLD.FIELD_W / 2;
  var south = FLD.FIELD_H - 150, north = 150;
  function _skEdge(side) { return side === "US" ? south : north; }
  function _skFace(side) { return side === "US" ? 0 : Math.PI; }   // atan2(dx,-dz): 0=north, PI=south -> faces the enemy
  function _skSpread(side, n, menN, weapon, isPlayer) {
    var arr = [], z = _skEdge(side), step = 180, x0 = ox - ((n - 1) / 2) * step;
    for (var i = 0; i < n; i++) {
      arr.push(fldMakeUnit({
        id: side + (i + 1), side: side, name: (side === "US" ? "Union" : "Rebel") + " " + _fldOrdinal(i + 1) + " Brigade",
        arm: "inf", weapon: weapon, xp: (side === ps && isPlayer ? 2 : 1),
        x: x0 + i * step, z: z, facing: _skFace(side), formation: "line", men: menN,
        ai: (side === ps) ? !!opts.autoBoth : true,
      }));
    }
    return arr;
  }
  var pUnits = _skSpread(ps, sk.countPlayer || 2, sk.menPlayer || 1500, sk.weaponPlayer || _fldYearWeapon(sk.year, ps), true);
  var eUnits = _skSpread(es, sk.countEnemy || 2, sk.menEnemy || 1500, sk.weaponEnemy || _fldYearWeapon(sk.year, es), false);
  __FIELD.units = pUnits.concat(eUnits);
  __FIELD.scenData = sk.name ? { name: sk.name } : null;
  fldResetRun();
  return true;
}
function _fldOrdinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

/* the FREE skirmish setup menu — a period broadsheet sheet; pick side / size / terrain / era /
   fog, then launch. Full keyboard + ARIA; option groups are radio-style buttons (aria-pressed). */
var _fldSkState = { side: "US", size: 3, terrain: "woods", era: 1862, fog: false };
function fldSkirmishMenu() {
  if (typeof openSheet !== "function") { fldSkirmishLaunch(); return; }
  openSheet(_fldSkirmishHTML());
  _fldSkWire();
}
function _fldSkOptRow(label, group, opts, cur) {
  // bug-hunt F4: a toggle-BUTTON group with aria-pressed (NOT role=radio) — the chips are click/Enter/Space
  // operable plain buttons; a radiogroup would promise arrow-key roving navigation this UI doesn't implement.
  // S25 (D245): labels + the selected outline consume the shared H0 --h0d-* tokens (defined on the sheet
  // wrapper in _fldSkirmishHTML). The old var(--rule) label rendered 3.59:1 on the sheet bg — the same
  // 1.4.3 failure the preset picker once carried; var(--h0d-brass) lands at 8.17:1.
  var h = '<div style="margin:9px 0"><div id="sklbl_' + group + '" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--h0d-brass);margin-bottom:4px">' + label + '</div>'
    + '<div role="group" aria-labelledby="sklbl_' + group + '" style="display:flex;gap:7px;flex-wrap:wrap">';
  for (var i = 0; i < opts.length; i++) {
    var on = String(opts[i].v) === String(cur);
    h += '<button type="button" class="upg" aria-pressed="' + (on ? "true" : "false") + '"'
      + ' data-skg="' + group + '" data-skv="' + opts[i].v + '"'
      + ' style="' + (on ? "outline:2px solid var(--h0d-focus);outline-offset:1px;font-weight:bold;" : "") + '">' + opts[i].label + '</button>';
  }
  return h + '</div></div>';
}
function _fldSkirmishHTML() {
  var s = _fldSkState;
  return ''
    + '<h1 class="title-xl" style="text-align:center">Skirmish &mdash; Choose Your Battle</h1>'
    + '<p class="title-sub" style="text-align:center">A free real-time engagement on the open field &mdash; no campaign at stake.</p>'
    + '<hr class="rule">'
    + '<div style="--h0d-brass:#d8b458;--h0d-focus:#ffe27a;max-width:540px;margin:0 auto">'
    + _fldSkOptRow("Your side", "side", [{ v: "US", label: "Union" }, { v: "CS", label: "Confederate" }], s.side)
    + _fldSkOptRow("Army size", "size", [{ v: 2, label: "2 brigades" }, { v: 3, label: "3 brigades" }, { v: 4, label: "4 brigades" }, { v: 5, label: "5 brigades" }], s.size)
    + _fldSkOptRow("Ground", "terrain", [{ v: "open", label: "Open field" }, { v: "woods", label: "Wooded" }, { v: "ridge", label: "Ridge &amp; crest" }, { v: "river", label: "River crossing" }], s.terrain)
    + _fldSkOptRow("Year (arms)", "era", [{ v: 1861, label: "1861" }, { v: 1862, label: "1862" }, { v: 1863, label: "1863" }, { v: 1864, label: "1864" }], s.era)
    + _fldSkOptRow("Fog of war", "fog", [{ v: "0", label: "Off" }, { v: "1", label: "On" }], s.fog ? "1" : "0")
    + _fldSkDifficultyRow()
    + '<p class="lede" style="font-size:11px;opacity:.6;margin-top:6px">The two armies start on opposite edges; seize and hold the central crest, or break the enemy. Auto-pause helps a low-APM commander.</p>'
    + '<div class="btn-row" style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    + '<button id="fldSkBack" type="button" class="upg">Back</button>'
    + '<button id="fldSkGo" type="button" class="bigbtn">Begin Skirmish &#9876;</button>'
    + '</div></div>';
}
/* B-5: a difficulty/realism summary + a "Change" link into the Command & Realism picker (returns here). */
function _fldSkDifficultyRow() {
  var lbl = "Veteran &times; Balanced";
  try {
    var c = (typeof fldPresetResolve === "function") ? fldPresetResolve() : null;
    if (c && typeof FLDP !== "undefined") { var ai = FLDP.ai[c.ai], rm = FLDP.realism[c.realism]; lbl = (ai ? ai.label : "Custom") + " &times; " + (rm ? rm.label : "Custom"); }
  } catch (e) {}
  return '<div style="margin:9px 0"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--h0d-brass);margin-bottom:4px">Difficulty &amp; realism</div>'
    + '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap"><span style="font-size:13px">Current: <b id="fldSkDiff">' + lbl + '</b></span>'
    + '<button id="fldSkDiffBtn" type="button" class="upg" style="padding:5px 10px;font-size:12px">Change&hellip;</button></div></div>';
}
function _fldSkWire() {
  var diffBtn = document.getElementById("fldSkDiffBtn");
  if (diffBtn) diffBtn.addEventListener("click", function () { if (typeof fldPresetMenu === "function") fldPresetMenu("skirmish"); });
  var btns = document.querySelectorAll('[data-skg]');
  for (var i = 0; i < btns.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        var g = b.getAttribute("data-skg"), v = b.getAttribute("data-skv");
        if (g === "side") _fldSkState.side = v;
        else if (g === "size") _fldSkState.size = parseInt(v, 10) || 3;
        else if (g === "terrain") _fldSkState.terrain = v;
        else if (g === "era") _fldSkState.era = parseInt(v, 10) || 1862;
        else if (g === "fog") _fldSkState.fog = (v === "1");
        openSheet(_fldSkirmishHTML()); _fldSkWire();   // re-render with the new selection
        // bug-hunt F3: restore keyboard focus to the chosen chip after the full re-render (else focus drops to <body>)
        try { var nb = document.querySelector('[data-skg="' + g + '"][data-skv="' + v + '"]'); if (nb) nb.focus(); } catch (e) {}
      });
    })(btns[i]);
  }
  var back = document.getElementById("fldSkBack");
  if (back) back.addEventListener("click", function () { if (typeof openMainMenu === "function") openMainMenu(); });
  var go = document.getElementById("fldSkGo");
  if (go) go.addEventListener("click", function () { fldSkirmishLaunch(); });
}
function fldSkirmishLaunch() {
  var s = _fldSkState, es = (s.side === "US") ? "CS" : "US";
  var sk = {
    playerSide: s.side, attacker: null, year: s.era,
    countPlayer: s.size, countEnemy: s.size,
    menPlayer: 1600, menEnemy: 1500,
    weaponPlayer: _fldYearWeapon(s.era, s.side), weaponEnemy: _fldYearWeapon(s.era, es),
    terrain: s.terrain, name: "Skirmish",
  };
  fldLaunchSandbox({ renderer: "3d", skirmish: sk, fog: s.fog });
}
/* main-menu injection (T0 fldInjectMenuButton hook) — a button beside the sandbox / Bull Run. */
function fldInjectSkirmishButton(afterBtn) {
  try {
    if (document.getElementById("fldSkirmishBtn")) return;
    if (!afterBtn || !afterBtn.parentNode) return;
    var b = document.createElement("button");
    b.className = "gn-btn"; b.id = "fldSkirmishBtn";
    b.setAttribute("aria-label", "Skirmish, custom battle — pick your side, army size, ground and year, then fight a free real-time engagement.");
    b.innerHTML = '<span class="gn-hl">&#9876; SKIRMISH &mdash; CUSTOM BATTLE</span>'
      + '<span class="gn-deck">Pick your side, force size, ground and year &mdash; a free real-time engagement with no campaign at stake.</span>';
    b.addEventListener("click", function () { fldSkirmishMenu(); });
    if (afterBtn.nextSibling) afterBtn.parentNode.insertBefore(b, afterBtn.nextSibling); else afterBtn.parentNode.appendChild(b);
  } catch (e) {}
}

/* ===========================================================================
   A2 — the procedural campaign-battle briefing (period broadsheet)
   =========================================================================== */
function fldCampaignBriefing(C, bd) {
  var root = document.getElementById("fldRoot"); if (!root || !bd) return;
  if (document.getElementById("fldBrief")) return;
  var ps = (C.side === "CS") ? "CS" : "US";
  var attacking = (bd.atk === ps);
  var role = attacking ? "You attack: seize and hold the central crest, or break the enemy line." : "You stand on the defensive: deny the crest to the time limit, or break the assault.";
  var a = (typeof bridgeArmy === "function") ? bridgeArmy(C) : null;
  var ow = (a && typeof _brgWord === "function") ? _brgWord(a.overall) : ["", "#cdbb88"];
  var ov = document.createElement("div");
  ov.id = "fldBrief";
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Battle briefing: " + bd.name);
  ov.style.cssText = "position:absolute;inset:0;z-index:6000;display:flex;align-items:center;justify-content:center;background:#070a0ecc;";
  ov.innerHTML =
    '<div style="max-width:580px;max-height:86vh;overflow:auto;background:#0c0f14;border:1px solid #745e3f;border-radius:8px;padding:22px 26px;">'
    + '<div style="font-size:12px;letter-spacing:2px;opacity:.7;">' + (bd.year || "") + ' &middot; REAL-TIME ENGAGEMENT</div>'
    + '<div style="font-size:24px;color:#e9dcc0;margin:2px 0 8px;">' + _fldEsc(bd.name) + '</div>'
    + '<div style="opacity:.9;font-size:14px;line-height:1.5;">' + (bd.res ? _fldEsc(bd.res) : "") + '</div>'
    + '<div style="margin-top:12px;padding:9px 11px;background:#15110b;border:1px solid #715e3e;border-radius:5px;font-size:13px;line-height:1.5;"><b>Your orders:</b> ' + role + (a ? (' Your war fields a <b style="color:' + ow[1] + '">' + ow[0].toLowerCase() + '</b> army (rating ' + a.overall + ') &mdash; its strength, arms, and morale all carry onto this field.') : '') + '</div>'
    + '<div style="opacity:.6;font-size:11px;margin-top:12px;line-height:1.4;">Fought or delegated, this field feeds the same campaign &mdash; the war shapes the army; the battle decides the day; the men you lose carry back. Drag brigades to maneuver; volley, flank, and break the foe.</div>'
    + '<div style="text-align:center;margin-top:16px;"><button id="fldBriefGo" type="button" style="background:#1c1610;color:#e9dcc0;border:1px solid #736241;border-radius:4px;padding:9px 18px;font:14px Georgia,serif;cursor:pointer;">Take command &#9654;</button></div>' /* wcag-auditor: added type=button (WCAG 4.1.2 — prevents accidental form submit; explicit role semantics) */
    + '</div>';
  root.appendChild(ov);
  var go = document.getElementById("fldBriefGo");
  var close = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); try { var rr = document.getElementById("fldRoot"); if (rr) rr.focus(); } catch (e) {} };
  ov.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(); }
    else if (e.key === "Tab") { e.preventDefault(); if (go) go.focus(); }
  });
  if (go) { go.addEventListener("click", close); try { go.focus(); } catch (e) {} }
  fldAnnounce("Briefing: " + bd.name + ". " + role);
}
function _fldEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

/* ===========================================================================
   A3 — FEED the real-time result back into the campaign
   =========================================================================== */
/* Compute the outcome from the FINISHED tactical battle. REAL casualty fractions:
   men lost / men fielded per side, where "fielded" sums every unit's maxMen (so it counts
   reinforcements that arrived and units that were destroyed) and "remaining" sums live men.
   Must be called BEFORE fldExit clears __FIELD.units. Returns null off-campaign. */
function fldCampaignComputeOutcome() {
  var ctx = __FIELD.campaignCtx; if (!ctx) return null;
  var C = _fldCamp(); if (!C) return null;
  var ps = (C.side === "CS") ? "CS" : "US", es = fldEnemy(ps);
  var fielded = { US: 0, CS: 0 }, remain = { US: 0, CS: 0 };
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i]; if (!u || (u.side !== "US" && u.side !== "CS")) continue;
    fielded[u.side] += Math.max(0, u.maxMen || u.men || 0);
    if (u.alive) remain[u.side] += Math.max(0, u.men || 0);
  }
  // E45 (D247): PHASE-AWARE — a multi-phase battle's final-sector units are only the LAST phase's
  // committed force, so the single-phase read above would silently under-count the day. When the
  // T8 cumulative tallies exist AND have accumulated (>=1 phase resolved), the fractions aggregate
  // losses/fielded across ALL phases. Unreachable in every shipped path today (no phased battle is
  // campaign-launchable — _fldCampaignScenarioFor returns only bullrun1/null); load-bearing the day
  // the epics join the campaign, and the PM3 sim-backed resolve routes through this exact function.
  var pFrac, eFrac;
  if (__FIELD.phases && __FIELD.battleFielded && __FIELD.battleCas
      && ((__FIELD.battleFielded.US || 0) + (__FIELD.battleFielded.CS || 0) > 0)) {
    pFrac = fldClamp((__FIELD.battleCas[ps] || 0) / Math.max(1, __FIELD.battleFielded[ps] || 0), 0, 0.92);
    eFrac = fldClamp((__FIELD.battleCas[es] || 0) / Math.max(1, __FIELD.battleFielded[es] || 0), 0, 0.92);
  } else {
    pFrac = fldClamp(1 - remain[ps] / Math.max(1, fielded[ps]), 0, 0.92);
    eFrac = fldClamp(1 - remain[es] / Math.max(1, fielded[es]), 0, 0.92);
  }
  var winner = __FIELD.winner, winBy = __FIELD.winBy;
  var winnerSide = (winner === "draw" || winner == null) ? null : winner;
  var win = winnerSide === ps;
  var type;
  if (winnerSide === null) type = "draw";
  else if (win) type = (winBy === "destroy" || eFrac >= 0.6) ? "decisive" : "win";
  else type = (winBy === "destroy" || pFrac >= 0.6) ? "decisive" : "win";   // for a loss, only the funds tier differs
  var out = { bd: ctx.bd, winnerSide: winnerSide, type: type, pFrac: pFrac, eFrac: eFrac, win: win, playerSide: ps };
  // D420 / LANE-007 Slice C: carry the existing surrender ledger into the
  // canonical campaign result. It is inert unless the immutable campaign
  // ruleset is Mayhem; Historical never reads or mutates from this metadata.
  out.capturedByPlayer = Math.max(0, Math.round((__FIELD.captured || {})[es] || 0));
  // D401: capture field-complete participation/leader consequence evidence
  // before fldExit clears the tactical state. It is never a simulation input.
  if (typeof warCareerBuildFieldEvidence === "function") {
    try {
      var wcMode = ctx.simResolve === true ? "auto" : "realtime";
      var wcEvidence = warCareerBuildFieldEvidence(C, ctx, wcMode, __FIELD);
      if (wcEvidence) out.warCareerEvidence = wcEvidence;
    } catch (wcErr) { if (typeof console !== "undefined" && console.warn) console.warn("warCareerBuildFieldEvidence:", wcErr); }
  }
  return out;
}
/* Apply the outcome to the campaign: build a CONDITIONED hex roster via startBattleRuntime
   (A6a runs again on it -> same conditioning the fight used), apply the real loss fractions
   with _arApplyCasualties, set casualties/infl, then drive the engine's OWN campaignAdvance
   (roster reconcile + _t1Resolve + funds + advance/recovery). Mirrors bridgeAutoResolve (87)
   so the war moves on IDENTICALLY to a fought / auto-resolved battle. */
function fldCampaignApplyOutcome(o) {
  var C = _fldCamp(); if (!C || !o || !o.bd) return;
  var ps = o.playerSide, es = fldEnemy(ps);
  if (typeof startBattleRuntime !== "function" || typeof campaignAdvance !== "function") return;
  // bug-hunt F6: the battle is resolving now -> consume the recovery role-flip (o.bd already carries the
  // flipped orientation). campaignAdvance re-sets C.flipAtk on a fresh loss, exactly like the fought path.
  if (C.flipAtk) C.flipAtk = false;
  startBattleRuntime(o.bd, ps, true);                  // build + condition (A6a) the hex roster in one JS turn
  var B = (typeof G !== "undefined") ? G.battle : null;
  if (!B) { campaignAdvance(o.winnerSide, o.type); return; }
  if (typeof _audLeaveBattle === "function") { try { _audLeaveBattle(); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("fldCampaignApplyOutcome _audLeaveBattle:", e); } }
  if (typeof G !== "undefined") G.mode = "result";     // never paint the now-occluded hex field
  var pCas = (typeof _arApplyCasualties === "function") ? _arApplyCasualties(B, ps, o.pFrac) : 0;
  var eCas = (typeof _arApplyCasualties === "function") ? _arApplyCasualties(B, es, o.eFrac) : 0;
  // XP parity with the fought / auto-resolved paths (campaignAdvance reads kills>=2 -> +2)
  if (o.winnerSide === ps) {
    var ke = (o.type === "decisive") ? 2 : 1;
    for (var k = 0; k < B.units.length; k++) { var uk = B.units[k]; if (uk && uk.side === ps && uk.alive && uk.type !== "hq") uk.kills = (uk.kills || 0) + ke; }
  }
  if (!B.casualties) B.casualties = {}; if (!B.infl) B.infl = {};
  B.casualties[ps] = pCas; B.casualties[es] = eCas;
  B.infl[ps] = eCas; B.infl[es] = pCas;   // infl[X] = what X inflicted = what the enemy suffered
  B.over = true;
  if (o.capturedByPlayer > 0) B.mayhemCapturedByPlayer = o.capturedByPlayer;
  // Hand the already-computed result receipt to the canonical campaign result.
  // This metadata is consequence-only and is not read by combat, casualty, AI,
  // score, winner, or direction code.
  if (o.warCareerEvidence && typeof o.warCareerEvidence === "object") B.warCareerEvidence = o.warCareerEvidence;
  if (o.winnerSide && typeof playSfx === "function") { try { playSfx(o.win ? "bugle" : "rout"); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("fldCampaignApplyOutcome playSfx:", e); } }
  campaignAdvance(o.winnerSide, o.type);
}
/* the campaign end-screen teaching/result snippet (T0 fldOnOver hook) — appended beneath any
   scenario teaching; states the strategic consequence of this real-time fight. */
function fldCampaignEndHtml(winner) {
  var ctx = __FIELD.campaignCtx; if (!ctx) return "";
  var C = _fldCamp(); var ps = (C && C.side === "CS") ? "CS" : "US";
  var win = (winner === ps);
  var head = (winner === "draw" || winner == null) ? "A drawn field" : (win ? "Your war advances" : "A costly reverse");
  var body = (winner === "draw" || winner == null)
    ? "Neither side carried the day. The campaign grinds on; your losses are felt in the ranks."
    : (win
      ? "You carried the field in real time. The casualties you inflicted and suffered carry straight back to the campaign &mdash; the war moves on to the next engagement."
      : "The assault broke. Your losses feed the campaign and you fall back to refit; the war is not yet lost.");
  return '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">'
    + '<div style="color:#d8c87a;font-weight:bold;margin-bottom:6px;">' + head + '</div>'
    + '<div style="font-size:13px;opacity:.9;line-height:1.5;">' + body + '</div></div>';
}
