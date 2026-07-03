/* ===========================================================================
   A6a · 86-battle-conditioning.js — battle-day CONDITIONING: the strategic war
   shapes the army that actually takes the field.

   Aaron's directive (backlog A6 / §3 pre-battle conditioning / §11 the bridge):
   "wire economy/production/manpower/morale → pre-battle conditioning (army
   strength/weapons/morale/fatigue) → battles use the EXISTING engine via a clean
   bridge → results feed back." The bridge (85-…) already COMPUTES the conditioned
   army (bridgeArmy) + the prep (C.battlePrep). THIS module APPLIES it: it overrides
   startBattleRuntime (frozen-engine §8.2) to, AFTER genForce builds the forces,
   scale the PLAYER force's strength + morale from bridgeArmy(C), apply the player's
   battle-prep orders, and (the A3/A2 tie) stamp Field-Fortifications → trench cover
   onto the player's deploy zone. Campaign battles only (B.fromCampaign) — Free
   Battle / Classic / diag-classic (fromCampaign=false) are untouched.

   Conditioning model (designer calibration, Inferred; logged DECISIONS D47):
     · strength ×[0.88..1.12] anchored at the FRESH-campaign baseline (overall ~74 → 1.0), so a
       no-investment army plays ≈ Classic (§27); a well-run war earns up to +12%, a failing one −12%
     · morale +[(bridgeArmy.morale-60)*0.3] (the morale facet is ~60 at fresh → ~0; a confident war steadies the men)
     · battlePrep: entrench → +2 ent (defense); forcedMarch → -6 morale (arrived tired);
       raidSupply → enemy -6 morale & -20% ammo (fights hungry, short of cartridges)
     · Field Fortifications (A2) level L → trench cover on ~25%·L of the line — but ONLY when the
       entrench prep is ordered (a deliberate slot, not a free always-on stack); falls back to the
       player's own hexes on procedural maps that carry no deploy band

   New fns: _a6Condition / _a6Entrench. Override: startBattleRuntime (manifest).
   Bare-name globals (G, bridgeArmy, engBranchLevel, TERRAIN, + the verbatim base
   helpers); _a6* helpers; only mutates the live battle's player units + deploy tiles.
   =========================================================================== */

/* Field Fortifications (A2) → stamp trench cover on a fraction of the player's deploy zone.
   Reuses the A3 guards: never weaken def, never reduce move cost, never water. */
function _a6Entrench(C, B, ps) {
  if (typeof engBranchLevel !== "function" || typeof TERRAIN === "undefined" || !TERRAIN.trench) return 0;
  var lvl = engBranchLevel(C, "fortifications"); if (lvl <= 0) return 0;
  var M = B.M; if (!M || !M.map) return 0;
  // Authored maps carry a deploy band; procedural (genMap) battles — ~29 of 40 — do NOT, so fall back to
  // the player's own occupied hexes (the line they dig in on). Without this the A2 tie was inert on most battles.
  var zone = [];
  if (M.deploy && M.deploy[ps] && typeof M.deploy[ps].forEach === "function") {
    M.deploy[ps].forEach(function (k) { zone.push(k); });
  } else if (M.key) {
    for (var u = 0; u < B.units.length; u++) { var un = B.units[u]; if (un && un.side === ps && un.type !== "hq" && un.c >= 0 && un.r >= 0) zone.push(M.key(un.c, un.r)); }
  }
  if (!zone.length) return 0;
  var frac = Math.min(1, 0.25 * lvl);              // L1 25% / L2 50% / L3 75% entrenched
  var want = Math.max(1, Math.floor(zone.length * frac)), stamped = 0, skip = { water: 1, river: 1, ford: 1, shoal: 1 };
  for (var i = 0; i < zone.length && stamped < want; i++) {
    var t = M.map[zone[i]]; if (!t || t.obj || skip[t.t]) continue;   // skip objectives (preserve authored terrain) + water
    var cur = TERRAIN[t.t] || {}, cd = (typeof cur.def === "number") ? cur.def : 1, cc = (typeof cur.cost === "number") ? cur.cost : 1;
    if (TERRAIN.trench.def <= cd) continue;        // never weaken an authored position (works/fort stay)
    if (TERRAIN.trench.cost < cc) continue;        // never make a tile faster to cross
    t.t = "trench"; t.cover = "trench"; stamped++;
  }
  return stamped;
}

/* Apply the conditioned army (bridgeArmy) + battle-prep to the LIVE battle's player force.
   Campaign battles only; idempotent-safe per battle (runs once at startBattleRuntime). */
function _a6Condition() {
  var C = (typeof G !== "undefined" && G.campaign) ? G.campaign : null;
  var B = (typeof G !== "undefined") ? G.battle : null;
  if (!C || !B || !B.fromCampaign) return null;          // only a genuine campaign battle
  if (typeof bridgeArmy !== "function") return null;
  var a = bridgeArmy(C), ps = B.playerSide, bp = C.battlePrep || {};
  // Anchor 1.0 at the FRESH-campaign baseline (overall ~74 US 76 / CS 69), NOT 50 — a no-investment
  // army must play ≈ Classic (§27). Band ±12%: a well-run war earns a buff, a failing one a real penalty.
  // E05 (D231): typeof+isFinite guards, NOT `|| default` — bridgeArmy clamps to [0,100], so overall/morale 0
  // (a fully collapsed war) is a LEGITIMATE value that must keep the full floor penalty, not be swapped for
  // the neutral anchor (the `0 || 74` bug). isFinite also keeps a NaN facet from corrupting unit strengths
  // (the old || idiom absorbed NaN; a bare typeof check would let it through to Math.round).
  var _ov = (typeof a.overall === "number" && isFinite(a.overall)) ? a.overall : 74;
  var _mo = (typeof a.morale === "number" && isFinite(a.morale)) ? a.morale : 60;
  var strengthMul = Math.max(0.88, Math.min(1.12, 1.0 + (_ov - 74) * 0.0045));
  var moraleAdd = Math.round((_mo - 60) * 0.3);   // morale facet is ~60 at fresh → ~0 (neutral)
  var touched = 0;
  for (var i = 0; i < B.units.length; i++) {
    var u = B.units[i]; if (!u || u.side !== ps) continue;
    if (u.type !== "hq") {
      u.strength = Math.max(1, Math.round(u.strength * strengthMul));
      u.maxStr = Math.max(u.strength, Math.round((u.maxStr || u.strength) * strengthMul));
    }
    u.morale = Math.max(5, Math.min(99, (u.morale || 70) + moraleAdd));
    u.maxMor = Math.max(u.morale, u.maxMor || u.morale);
    if (bp.entrench) u.ent = Math.min(3, (u.ent || 0) + 2);          // dig in → +defense
    if (bp.forcedMarch) u.morale = Math.max(5, u.morale - 6);        // arrived tired
    touched++;
  }
  if (bp.raidSupply) {   // the enemy fights hungry and short of cartridges
    for (var j = 0; j < B.units.length; j++) {
      var e = B.units[j]; if (!e || e.side !== B.enemySide) continue;
      e.morale = Math.max(5, (e.morale || 70) - 6);
      if (typeof e.ammo === "number") e.ammo = Math.max(1, Math.round(e.ammo * 0.8));
    }
  }
  // The Engineer Corps digs the works only when you ORDER the entrench prep — a deliberate tactical
  // choice (one of five prep slots), not a free always-on stack (§27). Fortifications level sets how much.
  var entr = bp.entrench ? _a6Entrench(C, B, ps) : 0;
  return { strengthMul: strengthMul, moraleAdd: moraleAdd, unitsConditioned: touched, deployEntrenched: entr, overall: a.overall };
}

/* ---- startBattleRuntime OVERRIDE (frozen-engine §8.2): the VERBATIM base body
   (build/base.html 772-796) + the conditioning pass after G.battle is built. ---- */
function startBattleRuntime(bd, playerSide, fromCampaign){
  HEX=30;
  const M=(typeof authoredMap==="function" && authoredMap(bd)) || genMap(bd);
  const enemySide = playerSide==="US"?"CS":"US";
  const atkSide=bd.atk;
  const core = (fromCampaign && G.campaign)? G.campaign.roster : null;
  const pForce=genForce(bd, playerSide, atkSide===playerSide, M, core);
  const eForce=genForce(bd, enemySide, atkSide===enemySide, M, null);
  const units=pForce.concat(eForce);
  nameForce(units);
  units.forEach(u=>{ u.maxAmmo=MAXAMMO[u.type]||0; u.ammo=u.maxAmmo; });
  const total=bd.us+bd.cs;
  const maxTurns=clamp(10+Math.round(total/13000),10,18);
  let wx=bd.wx||"clear"; if(!WX[wx]) wx="clear";
  G.battle={ bd, M, units, turn:1, maxTurns, wx, playerSide, enemySide, atkSide,
    log:[], over:false, casualties:{US:0,CS:0}, infl:{US:0,CS:0}, started:Date.now(),
    fromCampaign:!!fromCampaign, phase:"player" };
  // A6a: the strategic war conditions the army that takes the field (campaign battles only).
  // E06 (D231): never swallow a conditioning failure silently — the battle still degrades fail-safe to the
  // unconditioned Classic baseline, but the warn (the 87-auto-resolve catch pattern) makes a broken bridge
  // visible during vetting instead of hiding indefinitely behind an empty catch.
  if (typeof _a6Condition==="function"){ try { _a6Condition(); } catch(e){ if (typeof console!=="undefined" && console.warn) console.warn("a6 conditioning failed — battle proceeds unconditioned:", e); } }
  fitCamera();
  updateObjOwners();
  beginTurn("player",true);
  G.mode="battle";
  logMsg(`${bd.name}, ${bd.year}. You command the ${playerSide==="US"?"Union":"Confederate"} forces.`,"sys");
  if(typeof _audEnterBattle==="function") _audEnterBattle();  // martial bed + wind + din sampling
  if(M.ground && typeof openSheet==="function") _showGroundBriefing(M, bd);
}
