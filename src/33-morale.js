/* ===========================================================================
   S2 m3 · 33-morale.js — THE THREE-LAYER MORALE SYSTEM + the 1864 election hinge
   (§8.61 / D39.2 — three interacting, visible layers · §8.67 / D41.2 — public will
   decides the strategic outcome; troop morale decides the battle; leader reputation
   modulates both).

   Three layers, computed fresh each strategic turn from the war state, with the
   INTERACTIONS baked into the formulas:
     • TROOP morale   — the army's heart: battle conditioning + supply, LIFTED by
                        respected leadership. (Feeds the battle via the bridge, which
                        already reads morale; this layer is the strategic mirror.)
     • LEADER reputation — win-rate + the sitting cabinet's competence (cabinetLeadership),
                        dragged down by an advisor who serves himself (ambition).
     • PUBLIC will    — the home front: SUNK by the accumulating human cost (casualty
                        toll, D35.6) and a ruined economy (inflation), lifted by victories
                        and (for the South) the hope of recognition; leader reputation
                        modulates it. THIS is what decides the war late.

   THE 1864 ELECTION HINGE (D41.2): the frozen clock already resolves the 1864
   referendum from weariness + capital + win-rate (weariness IS the public-will proxy).
   m3 adds the CONSEQUENCE: when the verdict lands, it feeds the EXISTING enemy-will
   system — a re-elected, determined administration grinds the enemy down (enemyWill−);
   a repudiated one (the home front broke) hands the enemy the initiative (enemyWill+).
   So you can win every battle and still lose the war if the public will fails.

   EXTENDS: adds C.morale (plain data; rides the save, no _SAVE_VER bump). NO writes
   to the frozen clock/economy/manpower (zero regression); the ONE sim coupling is the
   bounded, one-time election→enemyWill nudge into the existing victory module.
   moraleInit / moraleOnResolve registered in 90 (after dec, BEFORE vic so vicOnResolve
   sees the enemyWill change the same turn). presMoraleBlock surfaces it in the overview.
   Bare-name globals; _mor/morale prefix; render never mutates/saves.
   =========================================================================== */

function moraleInit(C) {
  if (!C) return;
  if (typeof presInit === "function") presInit(C);
  if (!C.morale || typeof C.morale !== "object" || Array.isArray(C.morale)) {
    // D51.1: seed the one-time election latch from world state — if the 1864 verdict
    // is ALREADY resolved at init (a legacy/pre-morale save), treat it as applied so
    // the enemyWill nudge cannot re-fire on load.
    C.morale = { troop: 55, leader: 55, public: 55, casualtyToll: 0,
      electionApplied: !!(C.clock && C.clock.resolved1864), repudiated: false };
  }
  var M = C.morale;
  if (typeof M.troop !== "number") M.troop = 55;
  if (typeof M.leader !== "number") M.leader = 55;
  if (typeof M.public !== "number") M.public = 55;
  if (typeof M.casualtyToll !== "number" || !(M.casualtyToll >= 0)) M.casualtyToll = 0;   // D51.2: floor >=0 (a corrupt negative toll would invert the penalty)
  if (typeof M.electionApplied !== "boolean") M.electionApplied = !!(C.clock && C.clock.resolved1864);   // D51.1: migration-safe latch
  if (typeof M.repudiated !== "boolean") M.repudiated = false;
}

function _morClamp(v) { return Math.max(0, Math.min(100, v)); }

/* ---- moraleCompute: the three layers as a readout (no state mutation). Callable
   from the tick AND the render so the displayed numbers are always current. ---- */
function moraleCompute(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var clk = (C && C.clock) || {}, wr = (C && C.warroom) || {}, ec = (C && C.economy) || {}, bl = (C && C.blockade) || {};
  var M = (C && C.morale) || {};
  var won = (C && C.stats && C.stats.won) || 0, battles = Math.max(1, (C && C.stats && C.stats.battles) || 0);
  var winRate = won / battles, cwin = winRate - 0.5;                       // -0.5..0.5
  var lead = (typeof cabinetLeadership === "function") ? cabinetLeadership(C) : 64;
  // S2 m5 NOTE: the leader layer stays on cabinetLeadership (the cabinet interaction the probe pins).
  // The sitting field general's influence is deliberately confined to the BRIDGE leadership facet +
  // the auto-resolve margin (commandLeadership / commandMarginEdge) — coupling it into morale here
  // would double-count the cabinet (commandLeadership already folds it in) and confound the
  // cabinet-isolating morale probe. Folding the general into morale is deferred (DECISIONS D53).
  var leadC = lead - 64;
  var infl = (typeof ec.inflation === "number") ? ec.inflation : 1.0;
  var inflPenalty = Math.min(22, Math.max(0, (infl - 1.5)) * 6);          // the CS spiral bites; US (~1.1) ~0
  var casToll = (typeof M.casualtyToll === "number") ? M.casualtyToll : 0;
  var casPenalty = Math.min(30, Math.max(0, casToll / 4000));             // the accumulating human cost (floored >=0)
  var recog = (typeof bl.recognition === "number") ? bl.recognition : 0;
  var interv = (typeof clk.intervention === "number") ? clk.intervention : 0;
  var recogEffect = (side === "CS") ? (recog * 0.10) : (-interv * 0.06);
  var bMorale = (typeof bridgeArmy === "function") ? bridgeArmy(C).morale : 50;
  var supply = (typeof wr.supply === "number") ? wr.supply : 50;

  // ambition friction: a War Secretary serving himself costs cohesion (the cabinet tie)
  var ambFriction = 0;
  if (typeof _cabHolder === "function" && typeof _cabAmbitionActive === "function") {
    try { var ws = _cabHolder(side, "war", C.president && C.president.date); if (ws && _cabAmbitionActive(ws, C)) ambFriction = 5; } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("moraleCompute ambition:", e); }
  }

  var repudPenalty = (M && M.repudiated) ? 12 : 0;                                          // a DURABLE home-front shock after a lost 1864 election (D51.4)
  var pressTerm = ((typeof pressSentiment === "function") ? pressSentiment(C) : 50) - 50;   // S2 m4: the press swings public will (anchored at 50 = neutral, a no-op until the press reacts)
  var leader = _morClamp(48 + cwin * 50 + leadC * 0.5 - ambFriction);
  var troop = _morClamp(bMorale * 0.6 + leader * 0.25 + supply * 0.15);                     // leadership lifts the troops
  var publicWill = _morClamp(52 + cwin * 36 - casPenalty - inflPenalty + leadC * 0.3 + recogEffect - repudPenalty + pressTerm * 0.2);  // the human cost + economy + the press + a repudiation
  return { troop: Math.round(troop), leader: Math.round(leader), public: Math.round(publicWill),
    casToll: Math.round(casToll), casPenalty: Math.round(casPenalty), inflPenalty: Math.round(inflPenalty), winRate: Math.round(winRate * 100) / 100 };
}

/* The 1864-referendum forecast, mirroring the frozen clock's own support formula. */
function _morElectionForecast(C) {
  var clk = (C && C.clock) || {};
  var won = (C && C.stats && C.stats.won) || 0, battles = Math.max(1, (C && C.stats && C.stats.battles) || 0);
  var weary = (typeof clk.weariness === "number") ? clk.weariness : 30;
  var cap = (typeof clk.capital === "number") ? clk.capital : 0;
  var support = Math.max(0, Math.min(200, 100 - weary + Math.floor(cap / 2) + Math.round((won / battles) * 20)));
  return { support: support, sustained: support >= 60, resolved: !!clk.resolved1864, elected: !!clk.elected };
}

/* ---- moraleOnResolve: per-turn tick. Runs AFTER clk (weariness/election set) and
   BEFORE vic (enemyWill change seen by victoryReady detection). ---- */
function moraleOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  moraleInit(C);
  try {
    var M = C.morale, side = (C.side === "CS") ? "CS" : "US";
    // accumulate the human cost (the player's own casualties this battle)
    var cas = (B && B.casualties && B.casualties[side]) ? (B.casualties[side] || 0) : 0;
    M.casualtyToll = (M.casualtyToll || 0) + Math.max(0, cas);
    // THE 1864 ELECTION CONSEQUENCE (once, ATOMIC with the effect landing — D51.3/.5: the
    // latch is set ONLY when the nudge actually applies, so a turn with C.strategy absent
    // doesn't silently burn it). Runs BEFORE the layer compute so a repudiation shows.
    var clk = C.clock, S = C.strategy;
    if (clk && clk.resolved1864 && !M.electionApplied && S && typeof S.enemyWill === "number") {
      M.electionApplied = true;
      if (clk.elected) {
        S.enemyWill = Math.max(0, S.enemyWill - 8);    // a sustained, determined administration grinds the enemy down
        if (typeof _pdLog === "function") _pdLog(C, "The 1864 verdict steels the war effort — the enemy's hope of your collapse fades.");
      } else {
        S.enemyWill = Math.min(100, S.enemyWill + 12); // the home front broke — the enemy takes heart
        M.repudiated = true;                            // a DURABLE shock (read by moraleCompute), not an inert one-tick write
        if (typeof _pdLog === "function") _pdLog(C, "The home front is repudiated at the polls — the enemy takes heart.");
      }
    }
    // compute + store the three layers (display) AFTER the election block
    var m = moraleCompute(C);
    M.troop = m.troop; M.leader = m.leader; M.public = m.public;
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("moraleOnResolve:", e); }
}

/* ===== render: "The Nation's Will" block for the War Effort overview ===== */

function _morMeter(label, v, hint) {
  v = Math.max(0, Math.min(100, Math.round(v || 0)));
  var col = v > 66 ? '#4a6b3a' : v > 38 ? '#b8863b' : '#9c3b2e';
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;font-size:12px;opacity:.85"><span>' + label + '</span><span style="color:' + col + '">' + v + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + v + '%;background:' + col + '"></div></div>'
    + (hint ? '<div style="font-size:10px;opacity:.55;margin-top:1px">' + hint + '</div>' : '') + '</div>';
}

function presMoraleBlock(C) {
  if (!C) return '';
  moraleInit(C);
  var m = moraleCompute(C), f = _morElectionForecast(C);
  var clk = C.clock || {};
  var electionLine;
  if (f.resolved) electionLine = f.elected ? '<span style="color:#4a6b3a">Sustained at the polls — the war goes on.</span>' : '<span style="color:#9c3b2e">Repudiated — the peace platform prevailed.</span>';
  else if ((clk.year || 1861) >= 1864) electionLine = '<span style="color:' + (f.sustained ? '#b8863b' : '#9c3b2e') + '">November 1864 is at hand — the verdict looks <b>' + (f.sustained ? 'favorable' : 'doubtful') + '</b> (support ' + f.support + ').</span>';
  else electionLine = '<span style="opacity:.75">If the war reaches November 1864, the people will render their verdict (support now ' + f.support + ', need 60).</span>';

  // a restrained line on the human cost (D35.6 — gravity, not spectacle)
  var tollLine = (m.casToll > 0)
    ? '<div style="font-size:11px;opacity:.7;margin-top:6px">The toll of the war so far: roughly <b>' + m.casToll.toLocaleString() + '</b> of your men fallen, wounded, or lost. The country feels every name.</div>'
    : '';

  return ''
    + '<hr class="rule">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:4px">The Nation\'s Will</div>'
    + '<div style="display:flex;gap:20px;flex-wrap:wrap">'
    +   '<div style="flex:1 1 220px;min-width:200px">'
    +     _morMeter('Troop morale', m.troop, 'The army\'s heart — battle, supply, and the generals who lead it.')
    +     _morMeter('Leadership', m.leader, 'The repute of the men who run the war — victories, competence, ambition.')
    +     _morMeter('Public will', m.public, 'The home front — the one that decides the war in the end.')
    +   '</div>'
    +   '<div style="flex:1 1 220px;min-width:200px">'
    +     '<div style="font-size:12px;opacity:.85;margin-bottom:3px"><b>The 1864 Election</b></div>'
    +     '<div style="font-size:12px">' + electionLine + '</div>'
    +     tollLine
    +   '</div>'
    + '</div>'
    + '<p class="lede" style="font-size:11px;opacity:.65;margin-top:8px">Three wills wage the war together: a beloved general lifts the troops; a bloody, fruitless year sinks the public; and when the public will breaks, even a winning army cannot save the cause. The ballot box is the South\'s surest road to a negotiated peace.</p>';
}
