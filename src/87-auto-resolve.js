/* ===========================================================================
   PM3 · 87-auto-resolve.js — the SIM-BACKED auto-resolve: ONE battle-truth model.

   Design law: docs/design/battle-mode-parity-design.md (Aaron-locked, D246;
   built here as PARITY-M3, D277). PL-1: a campaign battle's outcome is decided
   by the real-time engine — fought by the player, or fought HEADLESS by the AI
   on the player's behalf. This module is the delegated path:

     · bridgeAutoResolve(C) builds the SAME conditioned battle the "Fight in
       real time" button would launch (same campaign ctx, same scenario routing,
       same skirmish params, same A1/PM2 conditioning through fldResetRun ->
       fldCampaignCondition), runs it headless (renderer 'none', both sides AI,
       fldStepN to decision), then reads the outcome through the SAME
       fldCampaignComputeOutcome -> fldCampaignApplyOutcome path the fought
       battle uses. Substitutability is true BY CONSTRUCTION (D74 extended).
     · The old rating-margin model (bridgeResolveOutcome), its enemy year curve
       (_arEnemyRating), its 0.42/0.72 loser-casualty floors, its ±5 draw band,
       and its margin>=18 decisive threshold are GONE (supersedes D48's outcome
       model; the commandMarginEdge output nudge dies with it — the general
       reaches the field as INPUTS via bridgeArmy leadership + the officers
       layer, never as a margin term).
     · PL-6 determinism: the seed is a pure function of WAR STATE (_arSimSeed —
       side/battle/chain position/battles fought/recovery/flip; never wall
       clock, never Math.random). The same war state resolves to the same
       field, so re-opening the briefing cannot reroll a delegated battle.
     · PL-10: the headless sim runs at the NEUTRAL preset (Veteran × Balanced)
       regardless of the player's chosen difficulty (the T6 neutralPreset
       seam) — the Recruit cushion is a human-play affordance. Fog keeps the
       same precedence a fought launch uses (a battle-condition input, not a
       difficulty lever).
     · PL-3 investment visibility: because the sim conditions through the same
       T2 seam, the bought armory re-arms the delegated line (era-gated), the
       Cannon Corps sets the battery profile, and enemy-will erosion thins the
       enemy muster — purchases measurably shift delegated RESULTS.
     · PL-8 honest copy: the result card states the true contract — the war
       shaped the INPUTS; the field decided the outcome.

   Kept: _arApplyCasualties (the outcome-apply path consumes loss FRACTIONS on
   the conditioned hex roster — shared with the fought path via
   fldCampaignApplyOutcome). New: _arSimSeed / _arRunHeadlessSim (the testable
   core) / bridgeAutoResolve (orchestration) / _arShowResult (honest card).
   Bare-name globals (G, bridgeArmy, _brgNextBattle, startBattleRuntime,
   campaignAdvance, openSheet, toast, the fld* T0/T2 seams); _ar* helpers.
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

/* PL-6: the WAR-STATE-PURE seed. A deterministic integer hash of the campaign state that
   defines this delegated battle: side, the battle id, the chain position, how many battles
   the war has fought (so a recovery re-attempt is a NEW field), the recovery flag, and the
   flip orientation. NEVER wall clock, NEVER Math.random — the same war state resolves to
   the same field (replay-deterministic; nothing to save-scum). */
function _arSimSeed(C, bd, flipped) {
  var h = 2166136261;   // FNV-1a offset basis
  function mix(n) { h ^= (n >>> 0); h = (h * 16777619) >>> 0; }
  var id = (bd && bd.id) ? String(bd.id) : "";
  for (var i = 0; i < id.length; i++) mix(id.charCodeAt(i));
  mix(C && C.side === "CS" ? 67 : 85);
  mix((C && typeof C.idx === "number") ? C.idx : 0);
  mix((C && C.stats && typeof C.stats.battles === "number") ? C.stats.battles : 0);
  mix(C && C.recovery ? 1 : 0);
  mix(flipped ? 1 : 0);
  return (h >>> 0) || 1;   // fldInitSim treats 0 as unset — never emit it
}

/* THE TESTABLE CORE: run the delegated battle headless and return the SHARED outcome.
   Builds exactly what fldLaunchCampaignBattle would (same flip handling / scenario routing /
   skirmish params / campaign ctx -> same conditioning), runs it renderer-none with both
   sides under AI at the neutral preset, then computes the outcome through the SAME
   fldCampaignComputeOutcome the fought path uses, tears down silently, and returns o
   (+ o.sim diagnostics for the honest result card). Returns null when no campaign battle
   exists or the tactical engine is unavailable — there is NO fallback outcome model (PL-1). */
function _arRunHeadlessSim(C) {
  if (!C) return null;
  if (typeof _brgNextBattle !== "function" || typeof fldLaunchSandbox !== "function"
      || typeof fldStepN !== "function" || typeof fldCampaignComputeOutcome !== "function"
      || typeof _fldCampaignSkirmishParams !== "function" || typeof _fldCampaignScenarioFor !== "function") return null;
  var bd = _brgNextBattle(C); if (!bd) return null;
  // recovery role-flip: compute the fight orientation but do NOT consume C.flipAtk here — it is
  // consumed once, at RESOLUTION (fldCampaignApplyOutcome), exactly like the fought path (F6).
  var flipped = !!C.flipAtk;
  var fightBd = flipped ? Object.assign({}, bd, { atk: (bd.atk === "US" ? "CS" : "US") }) : bd;
  var scn = _fldCampaignScenarioFor(bd, C);   // null on a recovery flip (F7) -> procedural honors the flipped atk
  var ctx = { bd: fightBd, scn: scn, fromCampaign: true, _conditioned: false, simResolve: true };
  var opts = { renderer: "none", autoBoth: true, campaign: ctx, neutralPreset: true, seed: _arSimSeed(C, bd, flipped) };
  if (scn) opts.scenario = scn; else opts.skirmish = _fldCampaignSkirmishParams(fightBd, C);
  fldLaunchSandbox(opts);
  fldStepN(24000);   // 20 Hz: covers timeLimit 480s + the bounded E48 overtime with wide margin
  if (__FIELD.phase !== "over") {   // structurally unreachable (E48 bounds overtime < holdToWin) — never fabricate an outcome
    if (typeof console !== "undefined" && console.warn) console.warn("auto-resolve sim did not terminate — no outcome applied");
    fldExit(true); return null;
  }
  var o = fldCampaignComputeOutcome();
  if (o) {
    // diagnostics for the honest result card — captured BEFORE fldExit clears __FIELD.units
    var ps = o.playerSide, es = (ps === "US") ? "CS" : "US";
    var fielded = { US: 0, CS: 0 }, remain = { US: 0, CS: 0 };
    for (var i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i]; if (!u || (u.side !== "US" && u.side !== "CS")) continue;
      fielded[u.side] += Math.max(0, u.maxMen || u.men || 0);
      if (u.alive) remain[u.side] += Math.max(0, u.men || 0);
    }
    o.sim = { seed: opts.seed, endT: Math.round(__FIELD.t), winBy: __FIELD.winBy,
      playerLost: Math.max(0, Math.round(fielded[ps] - remain[ps])), enemyLost: Math.max(0, Math.round(fielded[es] - remain[es])),
      playerFielded: Math.round(fielded[ps]), enemyFielded: Math.round(fielded[es]),
      capturedPlayer: Math.round((__FIELD.captured && __FIELD.captured[ps]) || 0),
      capturedEnemy: Math.round((__FIELD.captured && __FIELD.captured[es]) || 0) };
  }
  fldExit(true);   // silent teardown — no _returnFn, no UI disturbance; campaignCtx cleared
  return o;
}

/* Orchestrate the full auto-resolve: run the headless sim, show the honest result card,
   then (on Continue) drive the SHARED apply path — fldCampaignApplyOutcome builds the
   conditioned hex roster, applies the REAL loss fractions, and runs the engine's own
   campaignAdvance. Identical consequence pipeline to a fought battle, by construction. */
function bridgeAutoResolve(C) {
  if (!C) return null;
  var o = _arRunHeadlessSim(C);
  if (!o) { if (typeof toast === "function") toast("No battle to resolve."); return null; }
  if (o.winnerSide && typeof playSfx === "function") { try { playSfx(o.win ? "bugle" : "rout"); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("bridgeAutoResolve playSfx:", e); } }
  _arShowResult(C, o);
  return o;
}

function _arShowResult(C, o) {
  function adv() { if (typeof fldCampaignApplyOutcome === "function") fldCampaignApplyOutcome(o); }
  if (typeof openSheet !== "function") { adv(); return; }   // headless fallback: apply + advance directly
  var verdict = o.type === "draw" ? "Drawn Battle" : (o.win ? (o.type === "decisive" ? "Decisive Victory" : "Victory") : (o.type === "decisive" ? "Decisive Defeat" : "Defeat"));
  var col = o.type === "draw" ? "#b8863b" : (o.win ? "#739850" : "#da6a5a");
  var bd = o.bd || {};
  var s = o.sim || {};
  var how = s.winBy === "hold" ? "the objective was seized and held"
    : (s.winBy === "timeout" ? "the attack was contained to the clock"
    : (s.winBy === "destroy" ? "an army was destroyed in the field" : "the day was decided sector by sector"));
  var capLine = (s.capturedPlayer || s.capturedEnemy)
    ? ('<p class="lede" style="text-align:center;font-size:12px;opacity:.75">Prisoners &mdash; yours ' + (s.capturedPlayer || 0) + '; the enemy\'s ' + (s.capturedEnemy || 0) + '.</p>') : '';
  var html = ''
    + '<h1 class="title-xl" style="text-align:center">Delegated to the Field</h1>'
    + '<p class="title-sub" style="text-align:center">' + (bd.name || "The engagement") + (bd.year ? (", " + bd.year) : "") + '</p>'
    + '<hr class="rule">'
    + '<div style="text-align:center;font-size:22px;font-weight:bold;color:' + col + ';margin:6px 0">' + verdict + '</div>'
    + '<p class="lede" style="text-align:center;font-size:13px;opacity:.85">Your commander fought this battle in the same real-time engine &mdash; headless, both sides under AI, at the neutral Veteran &times; Balanced setting. After ' + Math.floor((s.endT || 0) / 60) + ':' + ("0" + ((s.endT || 0) % 60)).slice(-2) + ' on the field, ' + how + '.</p>'
    + '<p class="lede" style="text-align:center;font-size:13px;opacity:.85">Of ' + (s.playerFielded || 0) + ' fielded, you lost <b>' + (s.playerLost || 0) + '</b> (' + Math.round((o.pFrac || 0) * 100) + '%); the enemy lost <b>' + (s.enemyLost || 0) + '</b> of ' + (s.enemyFielded || 0) + ' (' + Math.round((o.eFrac || 0) * 100) + '%).</p>'
    + capLine
    + '<p class="lede" style="font-size:11px;opacity:.6;text-align:center">Your war shaped the inputs &mdash; the muster, the arms you bought, the enemy\'s will. The field decided the outcome. The same war state resolves the same field.</p>'
    + '<div class="btn-row" style="margin-top:14px;display:flex;justify-content:center"><button id="arGo" type="button" class="bigbtn">Continue &#9654;</button></div>';
  openSheet(html);
  var go = document.getElementById("arGo");
  if (go) go.addEventListener("click", adv); else adv();
}
