/* ===========================================================================
   A6b · 87-auto-resolve.js — the bridge AUTO-RESOLVE: fight the war end-to-end
   without playing every tactical battle.

   Aaron's directive (§8.19): "battle resolve — ADD auto-resolve from the bridge
   (conditioned army + variance) so the owner-mode war is PLAYABLE end-to-end NOW;
   keep the option to fight the existing tactical battle."

   How it works:
     · bridgeAutoResolve(C) builds the CONDITIONED battle via startBattleRuntime
       (so A6a's strength/morale/prep/fortifications conditioning is already applied),
       then decides the outcome from bridgeArmy(C).overall (the army your whole war
       fielded) vs an enemy rating (year + the Confederacy's decline / the Union's
       growth + the enemy's will), plus battle variance and an attacker/defender edge.
     · It applies casualties to BOTH sides' units (destroying the worst-hit), sets
       G.battle.casualties/infl, then drives the engine's OWN campaignAdvance(winner,
       type) — which reconciles the roster, runs _t1Resolve (manpower/clock/strategy/
       enemyWill/victory), awards funds, advances the chain, and re-enters the next
       turn's interstitial. So an auto-resolved battle feeds the war IDENTICALLY to a
       fought one; the only thing skipped is the tactical fight.
     · Surfaced at the pre-battle briefing as "Auto-resolve" beside "To the Field".

   Deterministic-by-performance: uses the engine's seeded RND, so the same war state
   gives the same field — your strategic choices decide it, not luck. Numbers are
   designer calibration (Inferred), logged DECISIONS D48.

   New fns: bridgeResolveOutcome (the testable core) / bridgeAutoResolve (orchestration)
   / _arApplyCasualties / _arEnemyRating / _arShowResult. No override.
   Bare-name globals (G, RND, bridgeArmy, _brgNextBattle, startBattleRuntime,
   campaignAdvance, openSheet, toast); _ar* helpers.
   =========================================================================== */

/* Reduce a side's units by `frac`; destroy the worst-hit (so the roster reflects real loss). Returns men lost. */
function _arApplyCasualties(B, side, frac) {
  frac = Math.max(0, Math.min(0.9, frac));
  var lost = 0;
  for (var i = 0; i < B.units.length; i++) {
    var u = B.units[i]; if (!u || u.side !== side || !u.alive || u.type === "hq") continue;   // leaders aren't a casualty pool
    var before = u.strength || 0;
    var after = Math.round(before * (1 - frac));
    if (after < Math.max(1, Math.round((u.maxStr || before) * 0.22))) { after = 0; u.alive = false; }   // shattered -> destroyed
    u.strength = Math.max(0, after);
    lost += (before - u.strength);
  }
  return lost;
}

/* The enemy's strength rating (0-100), reflecting the historical asymmetry + the enemy's will. */
function _arEnemyRating(C, bd, ps) {
  var year = (bd && typeof bd.year === "number") ? bd.year : ((C.clock && C.clock.year) || 1861);
  var yi = Math.max(0, Math.min(4, year - 1861));
  var foe = (ps === "US") ? (64 - yi * 4) : (58 + yi * 2);   // the Confederacy weakens; the Union grows
  var ew = (C.strategy && typeof C.strategy.enemyWill === "number") ? C.strategy.enemyWill : null;
  if (ew !== null) foe -= (100 - ew) * 0.10;                 // a broken-willed enemy fights worse
  return Math.max(35, Math.min(85, foe));
}

/* Decide + apply the outcome on a (conditioned) battle B. Returns the outcome; does NOT advance the campaign. */
function bridgeResolveOutcome(C, B) {
  if (!C || !B) return null;
  var ps = B.playerSide, es = B.enemySide, bd = B.bd || {};
  var a = (typeof bridgeArmy === "function") ? bridgeArmy(C) : { overall: 60 };
  var me = (typeof a.overall === "number") ? a.overall : 60;
  var foe = _arEnemyRating(C, bd, ps);
  var rnd = (typeof RND === "function") ? RND : Math.random;
  // Decide on the EDGE OVER BASELINE — the same quantity the tactical conditioning uses (overall 74 = neutral,
  // cf. 86-conditioning; the enemy's own 1861 baseline is 64) — NOT the raw 0-100 overall. So a baseline army is
  // a genuine gamble (losable like Classic) and a strong war's *edge* decides it: auto-resolve stays
  // outcome-equivalent to fighting instead of a guaranteed win. (D48; bug-hunt: the raw gap dwarfed the variance.)
  var armyEdge = me - 74, foeEdge = foe - 64;
  var margin = (armyEdge - foeEdge) + (rnd() * 24 - 12);        // ±12 battle variance, baseline-anchored
  if (bd.atk && bd.atk !== ps) margin += 6; else margin -= 2;   // defending is easier than attacking
  // S2 m5: the commanding general's temperament nudges the day — an aggressive general presses the
  // attack, a cautious one is sound on the defensive (small, deterministic ±~2; never swamps the war).
  if (typeof commandMarginEdge === "function") { try { margin += commandMarginEdge(C, bd.atk === ps); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("bridgeResolveOutcome commandMarginEdge:", e); } }
  var winnerSide, type;
  if (margin >= 18) { winnerSide = ps; type = "decisive"; }
  else if (margin >= 5) { winnerSide = ps; type = "win"; }
  else if (margin > -5) { winnerSide = null; type = "draw"; }
  else if (margin > -18) { winnerSide = es; type = "win"; }
  else { winnerSide = es; type = "decisive"; }
  // casualties — SYMMETRIC clamps; the loser bleeds more; the winner shatters the loser about as hard as the
  // tactical break threshold, so the inflicted-blood rewards (funds inflBonus, stats.infl, enemyWill erosion) match fighting.
  var pFrac = Math.max(0.04, Math.min(0.45, 0.17 - margin * 0.0045 + rnd() * 0.05));
  var eFrac = Math.max(0.04, Math.min(0.45, 0.17 + margin * 0.0045 + rnd() * 0.05));
  if (winnerSide === ps) eFrac = Math.max(eFrac, (type === "decisive") ? 0.72 : 0.42);
  else if (winnerSide === es) pFrac = Math.max(pFrac, (type === "decisive") ? 0.72 : 0.42);
  var pCas = _arApplyCasualties(B, ps, pFrac);
  var eCas = _arApplyCasualties(B, es, eFrac);
  // XP parity with the fought path: a win credits surviving regiments by MAGNITUDE (a decisive win -> 2 kills,
  // so campaignAdvance's xpGain = 1 + (kills>=2?1:0) awards the +2 a decisive win deserves; a normal win -> 1).
  // Magnitude-based, not destruction-based: auto-resolve spreads casualties, so few units actually shatter.
  if (winnerSide === ps) {
    var ke = (type === "decisive") ? 2 : 1;
    for (var k = 0; k < B.units.length; k++) { var uk = B.units[k]; if (uk && uk.side === ps && uk.alive && uk.type !== "hq") uk.kills = (uk.kills || 0) + ke; }
  }
  if (!B.casualties) B.casualties = {}; if (!B.infl) B.infl = {};
  B.casualties[ps] = pCas; B.casualties[es] = eCas;
  B.infl[ps] = eCas; B.infl[es] = pCas;   // infl[X] = what X inflicted = what the enemy suffered
  B.over = true;
  return { me: Math.round(me), foe: Math.round(foe), margin: Math.round(margin), winnerSide: winnerSide,
    type: type, playerCas: pCas, enemyCas: eCas, win: (winnerSide === ps), draw: (winnerSide === null) };
}

/* Orchestrate the full auto-resolve: build the conditioned battle, resolve, show a brief result,
   then drive the engine's campaignAdvance (which advances the war + re-enters the next turn). */
function bridgeAutoResolve(C) {
  if (!C) return null;
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  if (!bd) { if (typeof toast === "function") toast("No battle to resolve."); return null; }
  if (typeof startBattleRuntime !== "function") return null;
  // honor a pending recovery role-flip exactly as launchCampaignBattle (base 2592-2596): clone with atk
  // reversed (NEVER mutate the BATTLES entry), consume the flag — so a recovery battle resolves in the
  // correct defend orientation (the +6 defender edge) and stays in sync if the player later fights it.
  if (C.flipAtk) { bd = Object.assign({}, bd, { atk: (bd.atk === "US" ? "CS" : "US") }); C.flipAtk = false; }
  startBattleRuntime(bd, C.side, true);                 // build + condition (A6a) the battle in one JS turn — never paints the field
  var B = (typeof G !== "undefined") ? G.battle : null; if (!B) return null;
  var o = bridgeResolveOutcome(C, B);
  // tear down the battle audio + render the way endBattle does (auto-resolve bypasses endBattle, so it must):
  if (typeof _audLeaveBattle === "function") { try { _audLeaveBattle(); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("bridgeAutoResolve _audLeaveBattle:", e); } }   // silence the martial bed + wind + din
  if (typeof G !== "undefined") G.mode = "result";      // stop the rAF redrawing the now-occluded battlefield
  if (o && !o.draw && typeof playSfx === "function") { try { playSfx(o.win ? "bugle" : "rout"); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("bridgeAutoResolve playSfx:", e); } }
  if (o) _arShowResult(C, B, o);
  return o;
}

function _arShowResult(C, B, o) {
  var verdict = o.draw ? "Drawn Battle" : (o.win ? (o.type === "decisive" ? "Decisive Victory" : "Victory") : (o.type === "decisive" ? "Decisive Defeat" : "Defeat"));
  var col = o.draw ? "#b8863b" : (o.win ? "#739850" : "#da6a5a");
  var bd = B.bd || {};
  function adv() { if (typeof campaignAdvance === "function") campaignAdvance(o.winnerSide, o.type); }
  if (typeof openSheet !== "function") { adv(); return; }   // headless fallback: advance directly
  var html = ''
    + '<h1 class="title-xl" style="text-align:center">Auto-Resolved</h1>'
    + '<p class="title-sub" style="text-align:center">' + (bd.name || "The engagement") + (bd.year ? (", " + bd.year) : "") + '</p>'
    + '<hr class="rule">'
    + '<div style="text-align:center;font-size:22px;font-weight:bold;color:' + col + ';margin:6px 0">' + verdict + '</div>'
    + '<p class="lede" style="text-align:center;font-size:13px;opacity:.85">Resolved from the army your war fielded (rating ' + o.me + ' against the enemy\'s ' + o.foe + '). '
    + 'Your losses <b>' + o.playerCas + '</b>; the enemy\'s <b>' + o.enemyCas + '</b>.</p>'
    + '<p class="lede" style="font-size:11px;opacity:.6;text-align:center">Your strategic war decided this field. The war moves on.</p>'
    + '<div class="btn-row" style="margin-top:14px;display:flex;justify-content:center"><button id="arGo" type="button" class="bigbtn">Continue &#9654;</button></div>';
  openSheet(html);
  var go = document.getElementById("arGo");
  if (go) go.addEventListener("click", adv); else adv();
}
