/* ===========================================================================
   S1 · 40-economy.js — The finance core (the spine of the asymmetric economy).

   Content-complete from data/economy.json (build-injected as GAME_DATA.economy;
   citation-grade research, run i). Models the war's central economic morality
   tale: HOW a side finances the war (bonds / taxes / the printing press) and the
   consequence (inflation). The Union balances bonds+taxes and stays anchored;
   the Confederacy — thin bond market + near-zero tax collection — is FORCED onto
   the press and spirals into hyperinflation. The asymmetry is EMERGENT from the
   real parameters, not scripted (the teaching mechanic, §2 + R29).

   Adds C.economy as a sibling of clock/muster/warroom/president. Four-function
   contract: econInit / econOnResolve (tick) / econRenderFinance / econWireFinance.
   Balance principle (§27): the Treasury is DELEGATED to the Secretary by default
   (auto-managed, historical mix) — opt in to run it yourself. Non-blocking.

   Bare-name globals (G, GAME_DATA); _ec* unique helper names; render never
   mutates/saves; the tick mutates C.economy + feeds C.clock.weariness (interlink).
   =========================================================================== */

var _ecPRINT_HI = 0.40;        // printing fraction above which the CS spiral compounds
var _ecINFL_MAX = 200;         // hard clamp so a runaway CS never hits Infinity
var _ecDEMAND   = 100;         // normalized per-turn war-financing demand (both sides)

/* Pull a side's finance config from GAME_DATA with hardcoded fallbacks that
   mirror data/economy.json (so the module works even if GAME_DATA is absent). */
function _ecCfg(side) {
  var G2 = gameData("economy");
  var d = {
    US: { startFunds: 6500, mix: { bonds: 0.66, taxes: 0.21, printing: 0.13 },
          taxEff: 0.80, bondAbsorb: 100, inflCoeff: 0.06, spiral: 1.0, target: 1.8, secretary: "Chase" },
    CS: { startFunds: 900, mix: { bonds: 0.32, taxes: 0.08, printing: 0.60 },
          taxEff: 0.10, bondAbsorb: 20, inflCoeff: 0.18, spiral: 1.15, target: 90.0, secretary: "Memminger" }
  };
  var base = d[side] || d.US;
  if (G2) {
    try {
      var s = G2.sides && G2.sides[side];
      if (s && typeof s.startFunds === "number") base.startFunds = s.startFunds;
      var rm = G2.finance && G2.finance.revenueMix && G2.finance.revenueMix[side];
      if (rm) base.mix = { bonds: rm.bonds, taxes: rm.taxes, printing: rm.printing };
      var lv = G2.finance && G2.finance.levers;
      if (lv) {
        if (lv.taxes && lv.taxes[side] && typeof lv.taxes[side].collectionEfficiency === "number") base.taxEff = lv.taxes[side].collectionEfficiency;
        if (lv.bonds && lv.bonds[side] && typeof lv.bonds[side].absorptionPerTurn === "number") base.bondAbsorb = lv.bonds[side].absorptionPerTurn;
        if (lv.printing && lv.printing[side] && typeof lv.printing[side].inflationPerUnitPrinted === "number") base.inflCoeff = lv.printing[side].inflationPerUnitPrinted * (side === "CS" ? 1.8 : 4.0);
      }
      var inf = G2.finance && G2.finance.inflation && G2.finance.inflation[side];
      if (inf) { if (typeof inf.spiralCoefficient === "number") base.spiral = inf.spiralCoefficient; if (typeof inf.cumulativeTargetMultiplier === "number") base.target = inf.cumulativeTargetMultiplier; }
    } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_ecCfg data load:", e); }
  }
  return base;
}

function _ecSecretary(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  return (side === "CS") ? "Memminger" : "Chase";
}

function _ecPush(C, line) { logPush(C && C.economy, "log", line); }

/* Normalize the 3-way mix to sum to 1 (after a lever shift). */
function _ecNorm(mix) {
  var s = (mix.bonds || 0) + (mix.taxes || 0) + (mix.printing || 0);
  if (s <= 0) { mix.bonds = 0.34; mix.taxes = 0.33; mix.printing = 0.33; return mix; }
  mix.bonds /= s; mix.taxes /= s; mix.printing /= s; return mix;
}

/* ---- econInit: idempotent; seeds C.economy from the side's finance config. ---- */
function econInit(C) {
  if (!C) return;
  var side = (C.side === "CS") ? "CS" : "US";
  var cfg = _ecCfg(side);
  if (!C.economy) {
    C.economy = {
      inflation: 1.0,                                   // cumulative price level vs 1861 = 1.0
      mix: { bonds: cfg.mix.bonds, taxes: cfg.mix.taxes, printing: cfg.mix.printing },
      debt: 0,
      hiPrintTurns: 0,                                  // turns of heavy printing (CS spiral driver)
      delegated: true,                                  // Treasury auto-managed by default (balance principle)
      lastTurn: null,
      log: []
    };
  }
  var E = C.economy;
  if (typeof E.inflation !== "number") E.inflation = 1.0;
  if (!E.mix) E.mix = { bonds: cfg.mix.bonds, taxes: cfg.mix.taxes, printing: cfg.mix.printing };
  if (typeof E.debt !== "number") E.debt = 0;
  if (typeof E.hiPrintTurns !== "number") E.hiPrintTurns = 0;
  if (typeof E.delegated !== "boolean") E.delegated = true;
  if (!E.log) E.log = [];
}

/* ---- econOnResolve: the per-turn finance tick. Mutates C.economy + (interlink)
   C.clock.weariness. Runs AFTER clkOnResolve so the clock exists. ----
   Emergent asymmetry: each turn the side must finance _ecDEMAND. Taxes yield
   little (CS efficiency ~0.10); bonds are capped by what the public absorbs
   (CS thin + shrinks as inflation rises); WHATEVER is left must be PRINTED →
   inflation. The CS shortfall forces the press → spiral; the US covers demand
   with bonds+taxes → stays anchored. */
function econOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  econInit(C);
  try {
    var side = (C.side === "CS") ? "CS" : "US";
    var cfg = _ecCfg(side);
    var E = C.economy;

    // Delegated Treasury → the Secretary reverts to the historical mix each turn.
    if (E.delegated) E.mix = { bonds: cfg.mix.bonds, taxes: cfg.mix.taxes, printing: cfg.mix.printing };
    _ecNorm(E.mix);

    // Bond absorption: US deep + steady; CS thin and shrinks as inflation climbs.
    var bondCap = (side === "CS") ? (cfg.bondAbsorb / Math.max(1, E.inflation)) : cfg.bondAbsorb;
    var taxYield  = _ecDEMAND * E.mix.taxes * cfg.taxEff;
    var bondYield = Math.min(_ecDEMAND * E.mix.bonds, bondCap);
    var printed   = _ecDEMAND - taxYield - bondYield;     // the residue MUST be printed
    if (printed < 0) printed = 0;
    var printFrac = printed / _ecDEMAND;

    // Inflation: US linear-dampened; CS super-linear (compounds with sustained printing).
    if (printFrac > _ecPRINT_HI) E.hiPrintTurns += 1; else if (E.hiPrintTurns > 0) E.hiPrintTurns -= 1;
    var spiralFactor = (side === "CS") ? Math.pow(cfg.spiral, E.hiPrintTurns) : 1.0;
    var inflRate = printFrac * cfg.inflCoeff * spiralFactor;
    if (side === "US") inflRate = Math.min(inflRate, 0.04);  // US per-turn cap (anchored)
    var before = E.inflation;
    E.inflation = Math.min(_ecINFL_MAX, E.inflation * (1 + inflRate));

    E.debt += bondYield;
    E.lastTurn = { taxYield: Math.round(taxYield), bondYield: Math.round(bondYield),
                   printed: Math.round(printed), inflRatePct: Math.round(inflRate * 1000) / 10,
                   inflation: Math.round(E.inflation * 100) / 100 };

    // Interlink: inflation erodes the home front (feeds the 1864 Clock weariness).
    if (C.clock && typeof C.clock.weariness === "number") {
      var wDelta = Math.min(9, inflRate * 22);
      C.clock.weariness = Math.max(0, Math.min(100, C.clock.weariness + wDelta));
    }

    if (E.inflation > before * 1.08) _ecPush(C, "Prices surge — paper money buys ×" + (Math.round(E.inflation * 10) / 10) + " of 1861.");
    else if (printed > _ecDEMAND * 0.5) _ecPush(C, "The Treasury leans hard on the printing press this quarter.");
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("econOnResolve:", e); }
}

/* Status word for an inflation multiplier. */
function _ecInflStatus(m) {
  if (m < 1.5) return ["Stable", "#65974f"];
  if (m < 3)   return ["Rising", "#b8863b"];
  if (m < 10)  return ["Severe", "#c9712e"];
  if (m < 30)  return ["Critical", "#d56760"];
  return ["Collapsing", "#d8706b"];
}

/* ---- econRenderFinance: the Treasury tab. ---- */
function econRenderFinance(C) {
  if (!C) return '';
  econInit(C);
  var E = C.economy, sec = _ecSecretary(C);
  var st = _ecInflStatus(E.inflation);
  var mixRow = function (label, frac, key, hint) {
    var pct = Math.round((frac || 0) * 100);
    var ctrl = E.delegated ? '' :
      '<span style="margin-left:8px">'
      + '<button class="upg" data-eclever="' + key + '" data-ecdir="-1" aria-label="Decrease ' + label + '" style="padding:1px 7px">&minus;</button> '
      + '<button class="upg" data-eclever="' + key + '" data-ecdir="1" aria-label="Increase ' + label + '" style="padding:1px 7px">+</button></span>';
    return '<div style="margin:6px 0">'
      + '<div style="display:flex;justify-content:space-between;font-size:13px"><span>' + label + ctrl + '</span><span style="font-weight:bold">' + pct + '%</span></div>'
      + '<div style="height:8px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:#8a6d2f"></div></div>'
      + '<div style="font-size:11px;opacity:.6">' + hint + '</div></div>';
  };
  var lt = E.lastTurn;
  var ltHtml = lt
    ? '<div style="font-size:12px;opacity:.85;margin-top:8px">Last quarter — raised from <b>bonds</b> ' + lt.bondYield + ', <b>taxes</b> ' + lt.taxYield + ', <b>the press</b> ' + lt.printed + '; inflation +' + lt.inflRatePct + '%.</div>'
    : '<div style="font-size:12px;opacity:.6;margin-top:8px">No quarter financed yet.</div>';

  return ''
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">'
    +   '<div><div style="font-size:17px;font-weight:bold">The Treasury</div>'
    +     '<div style="opacity:.75;font-size:12px">Secretary ' + sec + (E.delegated ? ' &mdash; managing the war\'s finances' : ' &mdash; awaiting your instruction') + '</div></div>'
    +   '<div style="text-align:right"><div style="font-size:12px;opacity:.7">Prices since 1861</div>'
    +     '<div style="font-size:22px;font-weight:bold;color:' + st[1] + '">&times;' + (Math.round(E.inflation * 100) / 100) + '</div>'
    +     '<div style="font-size:12px;color:' + st[1] + '">' + st[0] + '</div></div>'
    + '</div>'
    + '<hr class="rule">'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:13px;margin-bottom:6px">'
    +   '<span>Treasury: <b>$' + (C.funds || 0) + '</b></span><span style="opacity:.5">&middot;</span>'
    +   '<span>Bonded debt: <b>' + Math.round(E.debt) + '</b></span></div>'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:8px 0 2px">How the war is paid for</div>'
    + mixRow('War Bonds', E.mix.bonds, 'bonds', 'Borrow from the public. Sound, but builds debt; the market is thin in the South.')
    + mixRow('Taxation', E.mix.taxes, 'taxes', 'Direct revenue. Unpopular; Southern collection is feeble.')
    + mixRow('The Printing Press', E.mix.printing, 'printing', 'Instant funds — and the road to inflation. Unanchored in the South, it spirals.')
    + ltHtml
    + '<div class="btn-row" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'
    +   '<button id="ecDelegate" type="button" class="upg">' + (E.delegated ? 'Take personal control' : 'Delegate to Sec. ' + sec) + '</button>'
    +   '<button id="ecWhy" type="button" class="upg" aria-expanded="false" aria-controls="ecWhyBox">Why it mattered</button>'
    + '</div>'
    + '<div id="ecWhyBox" style="display:none;margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12);font-size:12px"></div>';
}

/* The teaching card (R7/R26 — ambient, on-demand). */
function _ecWhyText(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  if (side === "CS") {
    return '<b>The Confederacy printed itself to death.</b> With almost no banking system, a population that resisted taxation, '
      + 'and a cotton economy strangled by the blockade, the Richmond government covered ~60% of its spending by printing paper money. '
      + 'Prices rose roughly <b>9,000%</b> by 1865 — flour reached hundreds of dollars a barrel. Historians (Douglas Ball; Roger Ransom) '
      + 'argue the financial collapse was as fatal as any battlefield defeat. <span style="opacity:.7">Verified.</span>';
  }
  return '<b>The Union invented modern war finance.</b> Salmon Chase and Jay Cooke sold war bonds to ordinary citizens through ~2,500 agents, '
    + 'the 1862 Legal Tender Act made "greenbacks" national currency, and the National Banking Acts tied banks to federal debt. '
    + 'Borrowing and taxing — not just printing — held cumulative inflation to ~<b>80%</b> (McPherson). Sound finance was a Northern war-winning weapon. '
    + '<span style="opacity:.7">Verified.</span>';
}

/* ---- econWireFinance: lever buttons, delegate toggle, teaching expander. ---- */
function econWireFinance(C) {
  if (!C || !C.economy) return;
  var E = C.economy;
  var del = document.getElementById("ecDelegate");
  if (del) del.addEventListener("click", function () {
    E.delegated = !E.delegated;
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
  var why = document.getElementById("ecWhy");
  if (why) why.addEventListener("click", function () {
    var box = document.getElementById("ecWhyBox");
    if (!box) return;
    if (box.style.display === "none") { box.innerHTML = _ecWhyText(C); box.style.display = "block"; }
    else box.style.display = "none";
    why.setAttribute("aria-expanded", box.style.display !== "none" ? "true" : "false");
  });
  if (!E.delegated) {
    var btns = document.querySelectorAll('[data-eclever]');
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener("click", function () {
          var lever = b.getAttribute("data-eclever"), dir = parseInt(b.getAttribute("data-ecdir"), 10);
          var step = 0.05 * dir;
          E.mix[lever] = Math.max(0, Math.min(1, (E.mix[lever] || 0) + step));
          // pull the opposite weight mainly from the printing press (or to it)
          var other = (lever === "printing") ? "bonds" : "printing";
          E.mix[other] = Math.max(0, (E.mix[other] || 0) - step);
          _ecNorm(E.mix);
          if (typeof saveLocal === "function") saveLocal();
          if (typeof _wdRefresh === "function") _wdRefresh();
        });
      })(btns[i]);
    }
  }
}
