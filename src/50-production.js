/* ===========================================================================
   S1b · 50-production.js — the asymmetric war-production layer.

   Content-complete from data/economy.json (GAME_DATA.economy.production). EXTENDS
   the existing War Room (G.campaign.warroom nodes — industry/ordnance/provisions/
   rail/depot) rather than duplicating it: the wr nodes are the INPUTS; this layer
   computes the matériel REALITY on top — arms & artillery output, rail integrity,
   food distribution, and a composite army EQUIP index — with the historical
   asymmetry. The Union is effectively unconstrained; the Confederacy is throttled
   by a hard iron ceiling (~20k tons/yr), import-dependence for small arms, and
   IRREVERSIBLE rail decay (no replacement iron → ~7%/turn throughput loss). The
   result: CS armies grow ragged and hungry as the war drags — emergent, not scripted.

   Adds C.production (sibling state). prodInit / prodOnResolve (tick, after wr so it
   can read the nodes) / presProdBlock (overview render fragment, called from the
   War Effort tab). Bare-name globals; _pr* helpers; tick may nudge clock.weariness
   (CS hunger) — modest, additive to the finance-inflation pressure.
   =========================================================================== */

var _prRAIL_DECAY_CS = 0.07;     // CS rail throughput lost per turn (no replacement iron)
var _prARMS_NEED = 45;           // per-turn small-arms need (both sides, normalized vs CS 16-turn scale)

function _prCfg(side) {
  var P = (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA.economy && GAME_DATA.economy.production) ? GAME_DATA.economy.production : null;
  var d = {
    US: { arms: 85, arty: 40, foodDist: 0.85, importFactor: 1.0, railDecay: 0, ironCeiling: 9999 },
    CS: { arms: 6, arty: 17, foodDist: 0.45, importFactor: 0.6, railDecay: 0.07, ironCeiling: 20 }
  };
  var base = d[side] || d.US;
  if (P) {
    try {
      if (P.industry && P.industry.smallArmsPerTurn && typeof P.industry.smallArmsPerTurn[side] === "number") base.arms = P.industry.smallArmsPerTurn[side];
      if (P.industry && P.industry.artilleryPerTurn && typeof P.industry.artilleryPerTurn[side] === "number") base.arty = P.industry.artilleryPerTurn[side];
      if (P.rail && P.rail.deteriorationPerTurnPct && typeof P.rail.deteriorationPerTurnPct[side] === "number") base.railDecay = P.rail.deteriorationPerTurnPct[side] / 100;
      var ag = P.agriculture && P.agriculture.distributionEfficiency;
      if (ag) { if (side === "US" && typeof ag.US === "number") base.foodDist = ag.US; else if (side === "CS" && ag.CS_byTurn && typeof ag.CS_byTurn.start === "number") base.foodDist = ag.CS_byTurn.start; }
    } catch (e) {}
  }
  return base;
}

function _prPush(C, line) {
  try {
    if (!C.production.log) C.production.log = [];
    C.production.log.unshift(line);
    if (C.production.log.length > 6) C.production.log.length = 6;
  } catch (e) {}
}

/**
 * Initialize the prod subsystem state.
 * Idempotent — safe to call multiple times.
 * @param {import('./types').Campaign | null} C
 */
function prodInit(C) {
  if (!C) return;
  var side = (C.side === "CS") ? "CS" : "US";
  var cfg = _prCfg(side);
  if (!C.production) {
    C.production = { railIntegrity: 100, equipIndex: (side === "CS" ? 60 : 95), foodDist: cfg.foodDist, lastTurn: null, log: [] };
  }
  var P = C.production;
  if (typeof P.railIntegrity !== "number") P.railIntegrity = 100;
  if (typeof P.equipIndex !== "number") P.equipIndex = (side === "CS" ? 60 : 95);
  if (typeof P.foodDist !== "number") P.foodDist = cfg.foodDist;
  if (!P.log) P.log = [];
}

/* Per-turn production tick. Reads the War Room nodes; runs AFTER wrOnResolve. */
/**
 * Per-battle tick for the prod subsystem.
 * @param {'US'|'CS'} winnerSide
 * @param {string} type - Battle outcome type.
 * @param {object} B - Battle descriptor.
 * @param {import('./types').Campaign | null} C
 * @param {boolean} win - Whether the player's side won.
 */
function prodOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  prodInit(C);
  try {
    var side = (C.side === "CS") ? "CS" : "US";
    var cfg = _prCfg(side);
    var P = C.production;
    var wr = C.warroom || { nodes: {} };
    var nodes = wr.nodes || {};
    var industry = nodes.industry || 0, ordnance = nodes.ordnance || 0, railNode = nodes.rail || 0, provisions = nodes.provisions || 0;

    // 1) Rail integrity: CS decays irreversibly (no replacement iron); rail-node investment slows it a touch.
    if (cfg.railDecay > 0) {
      var decay = cfg.railDecay * (1 - 0.08 * railNode);    // depots/rail spending mitigates slightly
      var railBefore = P.railIntegrity;
      P.railIntegrity = Math.max(8, P.railIntegrity * (1 - decay));
      P.railLossLast = railBefore - P.railIntegrity;         // A2: the Engineer Corps may claw back a FRACTION of this (never all)
    } else {
      P.railIntegrity = Math.min(100, P.railIntegrity + 2);  // US repairs/USMRR keeps it full
      P.railLossLast = 0;
    }
    var throughput = P.railIntegrity / 100;

    // 2) Matériel output. US scales freely with industry/ordnance nodes; CS is gated by the
    //    iron ceiling + import-dependence (small arms mostly imported → blockade-gated). S1c
    //    wires the live blockade importFactor (C.blockade, set this same turn BEFORE prod);
    //    falls back to the static cfg.importFactor placeholder if the blockade layer is absent.
    var impF = (side === "CS")
      ? ((C.blockade && typeof C.blockade.importFactor === "number") ? C.blockade.importFactor : cfg.importFactor)
      : 1;
    var armsRaw = cfg.arms * (1 + 0.18 * industry) * impF;
    var artyRaw = cfg.arty * (1 + 0.15 * ordnance);
    if (side === "CS") {
      // iron ceiling: rail repair + ordnance compete for the same scarce metal
      var ironPressure = 1 / (1 + 0.05 * (ordnance + railNode));   // more nodes chasing same iron → diminishing
      armsRaw *= ironPressure; artyRaw *= ironPressure;
    }
    var armsThisTurn = Math.round(armsRaw);
    var artyThisTurn = Math.round(artyRaw);

    // 3) Food distribution declines with rail integrity (CS "hunger amid plenty").
    P.foodDist = Math.max(0.15, cfg.foodDist * (side === "CS" ? throughput : 1) + 0.02 * provisions);
    P.foodDist = Math.min(0.95, P.foodDist);

    // 4) Composite EQUIP index — how well-found the armies are (arms adequacy + rail + food).
    var armsAdequacy = Math.min(1, armsThisTurn / _prARMS_NEED);
    var target = 100 * (0.45 * armsAdequacy + 0.30 * throughput + 0.25 * (P.foodDist / 0.85));
    P.equipIndex = Math.round(Math.max(5, Math.min(100, P.equipIndex + (target - P.equipIndex) * 0.5)));

    P.lastTurn = { arms: armsThisTurn, arty: artyThisTurn, rail: Math.round(P.railIntegrity), food: Math.round(P.foodDist * 100), equip: P.equipIndex };

    // 5) Interlink: CS supply/hunger erodes the home front (additive to inflation pressure).
    if (side === "CS" && C.clock && typeof C.clock.weariness === "number") {
      if (P.equipIndex < 45) C.clock.weariness = Math.min(100, C.clock.weariness + (45 - P.equipIndex) * 0.08);
    }
    if (side === "CS" && P.railIntegrity < 50) _prPush(C, "The railroads fail — stores rot in depots while the men go hungry.");
    else if (side === "US" && P.equipIndex >= 90) _prPush(C, "The arsenals and railroads keep the armies well-found.");
  } catch (e) {}
}

/* Status word for the equip index. */
function _prEquipStatus(v) {
  if (v >= 85) return ["Well-found", "#4a6b3a"];
  if (v >= 60) return ["Adequate", "#b8863b"];
  if (v >= 35) return ["Strained", "#c9712e"];
  return ["Ragged", "#9c3b2e"];
}

/* Overview fragment for the War Effort tab (called by presRenderEconomy). */
/**
 * presProdBlock.
 * @param {*} C
 */
function presProdBlock(C) {
  if (!C || !C.production) return '';
  var P = C.production, es = _prEquipStatus(P.equipIndex);
  var lt = P.lastTurn;
  var bar = function (label, v, col) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    return '<div style="margin:4px 0"><div style="display:flex;justify-content:space-between;font-size:12px;opacity:.8"><span>' + label + '</span><span>' + v + '</span></div>'
      + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + v + '%;background:' + col + '"></div></div></div>';
  };
  var out = '<hr class="rule"><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:2px 0 4px">War Production &amp; Logistics</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px">Army equipment</span>'
    + '<span style="font-weight:bold;color:' + es[1] + '">' + P.equipIndex + ' &middot; ' + es[0] + '</span></div>'
    + bar('Railroad integrity', P.railIntegrity, P.railIntegrity > 60 ? '#4a6b3a' : P.railIntegrity > 30 ? '#b8863b' : '#9c3b2e')
    + bar('Food reaching the front', P.foodDist * 100, P.foodDist > 0.6 ? '#4a6b3a' : '#b8863b');
  if (lt) out += '<div style="font-size:12px;opacity:.8;margin-top:4px">Last quarter: <b>' + lt.arms + '</b>k shoulder arms, <b>' + lt.arty + '</b> guns produced.</div>';
  return out;
}
