/* ===========================================================================
   S1d · 70-manpower.js — manpower, conscription & the replacement-ratio collapse.

   The lever that ENDS the war (data/economy.json -> GAME_DATA.economy.manpower).
   Models the decisive demographic asymmetry: the Union draws on a deep, refillable
   pool (4M mobilizable + ~25% foreign-born immigration + the ~180k USCT pool the
   Emancipation Proclamation unlocks from the South's OWN labor base) and REPLACES
   its casualties to the end; the Confederacy (1M white military pop, no immigrant
   inflow, and unable to arm the 3.5M enslaved without dissolving its own war aim)
   sees its REPLACEMENT RATIO collapse from ~0.9 early to ~0.1 by 1865 — its armies
   melt away while the Union's stay full. Emergent from the real pools, not scripted.

   The Union draft (Enrollment Act 1863) is modeled as a COERCIVE STIMULUS to
   volunteering/bounties (only ~6% of Union soldiers were direct draftees), NOT a
   direct manpower source; CS conscription (Apr 1862, a year earlier) is structurally
   load-bearing, its widening age band (18-35 -> 17-50) a visible crisis 'tell'.

   Adds C.manpower (sibling state). manpowerInit / manpowerOnResolve (tick — reads
   B.casualties + the year; runs after prod) / presManpowerBlock (overview fragment,
   "The Ranks", rendered in the War Effort tab beside production). C.manpower.strength
   (0-100) is the army-strength index the S5 pre-battle bridge will read.

   Bare-name globals (G, GAME_DATA); _mp* unique helpers; render never mutates/saves;
   the tick mutates C.manpower + (interlink) C.clock.weariness when the ranks thin.
   =========================================================================== */

var _mpATTR_COEFF = 3.5;   // strength-points lost per thousand casualties
var _mpATTR_MAX   = 14;    // per-turn attrition clamp

function _mpCfg(side) {
  var _d = gameData("economy"); var M = (_d && _d.manpower) ? _d.manpower : null;
  var d = {
    US: { pool: 4000, ceiling: 2129, immigrant: 350, usct: 180 },
    CS: { pool: 1000, ceiling: 850,  immigrant: 0,   usct: 0 }
  };
  var base = d[side] || d.US;
  if (M) {
    try {
      var sm = M.startingManpoolThousands;
      if (sm) { if (side === "US" && typeof sm.US === "number") base.pool = sm.US; else if (side === "CS" && typeof sm.CS_white === "number") base.pool = sm.CS_white; }
      var ce = M.cumulativeEnlistmentCeilingThousands;
      if (ce && typeof ce[side] === "number") base.ceiling = ce[side];
      var us = M.levers && M.levers.usctUnlock && M.levers.usctUnlock.US;
      if (side === "US" && us && typeof us.newManpoolThousands === "number") base.usct = us.newManpoolThousands;
      var im = M.immigrantPool && M.immigrantPool.US;
      if (side === "US" && im) { var g = im.germanBornThousands || 0, ir = im.irishBornThousands || 0; if (g + ir > 0) base.immigrant = g + ir; }
    } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_mpCfg data load:", e); }
  }
  return base;
}

/* Replacement ratio (replacements per casualty) by side. The US replaces fully.
   The CS curve is PERFORMANCE-DRIVEN, not scripted (design law §5): the year sets a
   "if you are losing" FLOOR (the historical doom of a Confederacy that loses), and
   war momentum lifts it toward full replacement — a WINNING South keeps its armies
   filled. Arming the enslaved (Cleburne's path) raises it further. */
function _mpReplacementRatio(side, year, mom, armed) {
  if (side === "US") return 1.0;
  var floor = (year <= 1862) ? 0.9 : (year === 1863) ? 0.55 : (year === 1864) ? 0.35 : 0.18;
  var m = (typeof mom === "number") ? mom : 0.5;
  var eff = floor + (0.95 - floor) * m;     // momentum lifts the floor toward near-full replacement
  if (armed) eff = Math.min(0.95, eff + 0.30);
  return Math.max(0, Math.min(0.95, eff));
}

function _mpPush(C, line) { logPush(C && C.manpower, "log", line); }

function manpowerInit(C) {
  if (!C) return;
  var side = (C.side === "CS") ? "CS" : "US";
  var cfg = _mpCfg(side);
  if (!C.manpower) {
    C.manpower = {
      pool: cfg.pool,               // thousand-men mobilizable reserve remaining
      enlisted: 0,                  // cumulative enlisted (thousand-men)
      strength: 100,                // army-strength index (the S5 bridge input)
      draftActive: false,           // conscription enacted
      usctUnlocked: false,          // US: Emancipation unlocks the USCT pool
      immigrantPool: cfg.immigrant, // foreign-born inflow remaining (US)
      replacementRatio: (side === "CS") ? 0.9 : 1.0,
      desertionTotal: 0,            // thousand-men deserted (CS rising)
      ageBand: (side === "CS") ? "18-35" : "20-45",
      delegated: true,              // Sec. of War manages recruitment by default
      armedApplied: false,          // one-time flag: the arm-the-enslaved pool surge
      lastTurn: null,
      log: []
    };
  }
  var P = C.manpower;
  if (typeof P.pool !== "number") P.pool = cfg.pool;
  if (typeof P.enlisted !== "number") P.enlisted = 0;
  if (typeof P.strength !== "number") P.strength = 100;
  if (typeof P.draftActive !== "boolean") P.draftActive = false;
  if (typeof P.usctUnlocked !== "boolean") P.usctUnlocked = false;
  if (typeof P.immigrantPool !== "number") P.immigrantPool = cfg.immigrant;
  if (typeof P.replacementRatio !== "number") P.replacementRatio = (side === "CS") ? 0.9 : 1.0;
  if (typeof P.desertionTotal !== "number") P.desertionTotal = 0;
  if (typeof P.ageBand !== "string") P.ageBand = (side === "CS") ? "18-35" : "20-45";
  if (typeof P.delegated !== "boolean") P.delegated = true;
  if (typeof P.armedApplied !== "boolean") P.armedApplied = false;
  if (!P.log) P.log = [];
}

/* ---- manpowerOnResolve: the per-turn recruitment + attrition tick. Reads
   B.casualties + the year; mutates C.manpower + (interlink) C.clock.weariness. ---- */
function manpowerOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  manpowerInit(C);
  if (typeof decInit === "function") decInit(C);   // D50.1: sanitize C.president.emancipation BEFORE the USCT gate reads it (manpower ticks before dec)
  try {
    var side = (C.side === "CS") ? "CS" : "US";
    var cfg = _mpCfg(side);
    var P = C.manpower;
    var year = (B && B.bd && typeof B.bd.year === "number") ? B.bd.year
             : (C.clock && typeof C.clock.year === "number") ? C.clock.year
             : (C.president && C.president.date && typeof C.president.date.year === "number") ? C.president.date.year
             : 1861;

    // Conscription events (historical timing). US 1863 = a stimulus; CS 1862 = load-bearing.
    if (!P.draftActive) {
      if (side === "US" && year >= 1863) { P.draftActive = true; P.ageBand = "20-45"; _mpPush(C, "The Enrollment Act takes effect — the draft spurs volunteering and bounties."); }
      else if (side === "CS" && year >= 1862) { P.draftActive = true; _mpPush(C, "Conscription begins — the first national draft in American history stems the bleed."); }
    }
    if (side === "CS") P.ageBand = (year >= 1864) ? "17-50" : (year >= 1862 ? "18-35" : "18-35");

    // USCT unlock (US): a NEW pool from the South's own labor base. Gated on the
    // EMANCIPATION decision (S2 m2): unlocks as soon as the Proclamation is issued
    // (earlier than 1863 if radical); the historical 1863 calendar is the DEFAULT if
    // the player never decides; NEVER unlocks if emancipation was explicitly declined.
    var _mpEm = C.president && C.president.emancipation;
    var _mpEmIssued = _mpEm && _mpEm.issued, _mpEmDeclined = _mpEm && _mpEm.declined;
    if (side === "US" && !P.usctUnlocked && !_mpEmDeclined && (_mpEmIssued || year >= 1863)) {
      P.usctUnlocked = true;
      P.pool += cfg.usct;           // ~180k added
      _mpPush(C, "Emancipation organizes the USCT — ~180,000 men join from the South's labor base.");
    }

    // Confederate emancipation (the player's Cleburne lever, C.strategy.armEnslaved):
    // a vast new pool from the South's OWN people — the boldest divergence.
    if (side === "CS" && C.strategy && C.strategy.armEnslaved && !P.armedApplied) {
      P.armedApplied = true;
      P.pool += 600;
      _mpPush(C, "Black Confederate regiments form — the ranks swell from an unthinkable source.");
    }

    // --- Recruitment inflow this turn (thousand-men), drawn from the pool ---
    var volunteer;
    if (side === "US") {
      volunteer = 70;                                  // deep + sustainable
      if (P.draftActive) volunteer *= 1.2;             // draft-as-stimulus
      var imm = Math.min(22, P.immigrantPool); P.immigrantPool = Math.max(0, P.immigrantPool - imm);
      volunteer += imm;                                // ~25% foreign-born
      if (P.usctUnlocked) volunteer += 15;             // USCT inflow
    } else {
      volunteer = (year <= 1861) ? 85 : (P.draftActive ? 38 : 16);   // CS curve falls first
    }
    var recruitsK = Math.min(P.pool, Math.max(0, volunteer));
    P.pool = Math.max(0, P.pool - recruitsK);
    P.enlisted += recruitsK;

    // --- Attrition + replacement (the decisive asymmetry — now PERFORMANCE-driven) ---
    var mom = (typeof vicMomentum === "function") ? vicMomentum(C) : 0.5;
    var armed = !!(C.strategy && C.strategy.armEnslaved);
    var casK = (B && B.casualties && side) ? (B.casualties[side] || 0) / 1000 : 0;
    var attr = Math.min(_mpATTR_MAX, casK * _mpATTR_COEFF);
    var ratio = _mpReplacementRatio(side, year, mom, armed);
    P.replacementRatio = ratio;
    var poolFactor = (P.pool > 50) ? 1 : (P.pool / 50) * 0.6 + 0.1;   // an empty reserve cannot replace
    var replenish = attr * ratio * poolFactor;
    P.strength = Math.max(5, Math.min(100, P.strength - attr + replenish));

    // Desertion (CS) is PERFORMANCE-driven: a WINNING South does not bleed deserters
    // (design law §5 / Aaron). Losing + a weary home front drives men from the ranks;
    // a deserter amnesty (C.strategy.amnesty) stems it.
    if (side === "CS") {
      var amnesty = (C.strategy && C.strategy.amnesty) ? 0.45 : 1;
      var desert = Math.max(0, Math.round(Math.pow(1 - mom, 1.6) * 16 * amnesty));
      P.desertionTotal += desert;
      P.pool = Math.max(0, P.pool - desert * 0.5);
    }

    // Interlink: thinning ranks depress the home front (additive to inflation/hunger).
    if (side === "CS" && C.clock && typeof C.clock.weariness === "number" && P.strength < 45) {
      C.clock.weariness = Math.min(100, C.clock.weariness + (45 - P.strength) * 0.06);
    }

    P.lastTurn = { year: year, strength: Math.round(P.strength), pool: Math.round(P.pool),
                   ratio: Math.round(ratio * 100) / 100, recruits: Math.round(recruitsK),
                   enlisted: Math.round(P.enlisted), draft: P.draftActive, usct: P.usctUnlocked,
                   ageBand: P.ageBand, desertion: Math.round(P.desertionTotal) };

    if (side === "CS" && P.strength < 40) _mpPush(C, "The ranks thin — casualties outrun every replacement the South can find.");
    else if (side === "US" && P.usctUnlocked && P.strength >= 80) _mpPush(C, "The armies refill from a deep well — volunteers, immigrants, and freedmen.");
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("manpowerOnResolve:", e); }
}

/* Status word for the army-strength index. */
function _mpStrengthStatus(v) {
  if (v >= 85) return ["At full strength", "#639452"];
  if (v >= 60) return ["Holding", "#b8863b"];
  if (v >= 35) return ["Thinning", "#c9712e"];
  return ["Melting away", "#d07060"];
}

/* Pull a teaching card from GAME_DATA["manpower-teaching"] when present. */
function _mpCard(id) {
  try {
    var D = (typeof GAME_DATA !== "undefined" && GAME_DATA) ? GAME_DATA["manpower-teaching"] : null;
    if (D && D.teachingCards) {
      for (var i = 0; i < D.teachingCards.length; i++) if (D.teachingCards[i].id === id) return D.teachingCards[i];
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_mpCard:", e); }
  return null;
}

/* Ambient one-line teaching note (R26), card-aware when research is on disk. */
function _mpWhyText(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var card = _mpCard(side === "CS" ? "mp-arm-the-enslaved" : "mp-demographic-superiority");
  if (card && card.takeaway) return card.takeaway;
  if (side === "CS") return "The South could not replace its dead. With no immigration and 3.5M enslaved it would not arm, every casualty was permanent — the replacement ratio fell toward 0.1 by 1865.";
  return "The Union out-manned the South ~4:1 in free population, refilled its armies from immigration and the ~180,000 USCT, and replaced casualties the Confederacy never could.";
}

/* ---- presManpowerBlock: "The Ranks" — overview fragment for the War Effort tab. ---- */
function presManpowerBlock(C) {
  if (!C || !C.manpower) return '';
  var side = (C.side === "CS") ? "CS" : "US";
  var P = C.manpower, ss = _mpStrengthStatus(P.strength);
  var lt = P.lastTurn;
  var bar = function (label, v, col) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    return '<div style="margin:4px 0"><div style="display:flex;justify-content:space-between;font-size:12px;opacity:.8"><span>' + label + '</span><span>' + v + '</span></div>'
      + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + v + '%;background:' + col + '"></div></div></div>';
  };
  var ratioPct = Math.round(P.replacementRatio * 100);
  var out = '<hr class="rule"><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:2px 0 4px">The Ranks &mdash; Manpower &amp; Conscription</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px">Army strength</span>'
    + '<span style="font-weight:bold;color:' + ss[1] + '">' + Math.round(P.strength) + ' &middot; ' + ss[0] + '</span></div>'
    + bar('Casualty replacement', ratioPct, ratioPct > 70 ? '#639452' : ratioPct > 35 ? '#b8863b' : '#d07060')
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;opacity:.85;margin-top:3px">'
    +   '<span>Manpool: <b>' + Math.round(P.pool) + 'k</b></span><span style="opacity:.5">&middot;</span>'
    +   '<span>Enlisted: <b>' + Math.round(P.enlisted) + 'k</b></span><span style="opacity:.5">&middot;</span>'
    +   '<span>Draft: <b>' + (P.draftActive ? 'Active (' + P.ageBand + ')' : 'Volunteers only') + '</b></span>'
    +   (side === "US" ? ('<span style="opacity:.5">&middot;</span><span>USCT: <b>' + (P.usctUnlocked ? 'Organized' : 'Not yet') + '</b></span>')
                       : ('<span style="opacity:.5">&middot;</span><span>Desertion: <b>' + Math.round(P.desertionTotal) + 'k</b></span>'))
    + '</div>';
  if (lt) out += '<div style="font-size:12px;opacity:.8;margin-top:3px">Last quarter: <b>' + lt.recruits + 'k</b> recruited; ' + (P.replacementRatio < 0.5 ? '<span style="color:#d07060">losses outrun replacements.</span>' : 'the ranks hold.') + '</div>';
  out += '<div style="font-size:11px;opacity:.62;margin-top:4px;font-style:italic">' + _mpWhyText(C) + '</div>';
  return out;
}
