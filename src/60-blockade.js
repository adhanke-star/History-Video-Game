/* ===========================================================================
   S1c · 60-blockade.js — cotton, the blockade, and foreign recognition.

   The Confederacy's asymmetric special subsystem (data/economy.json ->
   GAME_DATA.economy.cottonBlockade). Models the three intertwined traps that
   strangled the Southern war economy:

     1) KING COTTON / the 1861 SELF-EMBARGO TRAP — withholding cotton to coerce
        European recognition forfeited the South's one blockade-free export year
        and earned NO recognition (Britain sat on a ~1M-bale glut). A lever that
        LOOKS coercive and is in fact self-sabotage.
     2) THE BLOCKADE STRANGLEHOLD — per-voyage runner success stayed high (~5 in
        6 early) yet AGGREGATE exports collapsed to ~11% of peacetime; capture
        risk climbs 0.10 (1861) -> 0.33 (1864); runner ports fall (Wilmington,
        Jan 1865) until the ocean lifeline is severed. This gates the CS small-
        arms importFactor that 50-production.js reads (the S1b placeholder wired).
     3) FOREIGN RECOGNITION FORECLOSED — recognition pressure rises with the
        Lancashire famine + early battlefield wins but is capped by Indian/
        Egyptian substitution and slavery politics, and becomes UNREACHABLE after
        Antietam + the Emancipation Proclamation (Sep 1862). Feeds clock.intervention.

   Adds C.blockade (sibling state). Four-function contract:
     blockadeInit / blockadeOnResolve (tick — runs BEFORE prod so importFactor is
     fresh) / blockadeRenderDiplomacy (the Diplomacy desk tab) / blockadeWireDiplomacy.
   Blockade DEPTH is a realism TOGGLE (full / flat / off, R14). The Diplomacy
   desk is delegated to the Secretary of State by default (balance principle 27).

   Bare-name globals (G, GAME_DATA); _blk* unique helpers; render never mutates
   or saves; the tick mutates C.blockade + C.funds + (interlink) C.clock.intervention.
   =========================================================================== */

var _blkEXPORT_CAP_K = 350;     // per-turn export capacity, thousand-bales (peacetime-ish ceiling)
var _blkFUNDS_PER_KBALE = 0.45; // game-funds earned per thousand bales delivered to Europe

/* Capture probability per voyage by year (full-blockade schedule). Verified
   (Wise): risk ~1-in-10 (1861) climbing to ~1-in-3 (1864). */
function _blkCaptureProb(year) {
  if (year <= 1861) return 0.10;
  if (year === 1862) return 0.18;
  if (year === 1863) return 0.25;
  if (year === 1864) return 0.33;
  return 0.40;                  // 1865 — the noose closes
}

/* Per-voyage runner success by year (full schedule). Verified-derived. */
function _blkRunnerSuccess(year) {
  if (year <= 1861) return 0.90;
  if (year === 1862) return 0.82;
  if (year === 1863) return 0.75;
  if (year === 1864) return 0.67;
  return 0.55;
}

/* Runner ports still open by year (full-schedule baseline). Wilmington (the last)
   falls with Fort Fisher, Jan 1865 -> the ocean lifeline is cut. But that is only
   what befalls a LOSING South: a winning or fortified South holds its ports (§5). */
function _blkPortsByYear(year, mom, fortified) {
  var base = (year >= 1865) ? 0 : (year === 1864) ? 2 : 4;   // Wilmington/Charleston/Mobile/Galveston
  if ((typeof mom === "number" && mom >= 0.6) || fortified) base = Math.max(base, (year >= 1865) ? 2 : 4);
  return base;
}

function _blkPush(C, line) {
  try {
    if (!C.blockade.log) C.blockade.log = [];
    C.blockade.log.unshift(line);
    if (C.blockade.log.length > 6) C.blockade.log.length = 6;
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_blkPush:", e); }
}

/* ---- blockadeInit: idempotent; seeds C.blockade. CS carries the cotton model;
   the US side carries the blockade-as-weapon framing (no cotton, full imports). ---- */
function blockadeInit(C) {
  if (!C) return;
  var side = (C.side === "CS") ? "CS" : "US";
  if (!C.blockade) {
    C.blockade = {
      selfEmbargo: (side === "CS"),     // the 1861 King-Cotton embargo — on by default for CS (historical)
      embargoLifted: false,
      depth: "full",                     // 'full' | 'flat' | 'off' (realism toggle, R14)
      delegated: true,                   // Sec. of State auto-manages diplomacy by default
      cottonStockK: (side === "CS") ? 4000 : 0,   // thousand-bales on hand (4,000k = 4M)
      cottonExportedK: 0,
      cottonRevenueTotal: 0,
      importFactor: (side === "CS") ? 0.85 : 1.0, // small-arms import success (read by prodOnResolve)
      portsOpen: (side === "CS") ? 4 : 0,
      recognition: 0,                    // foreign-recognition pressure mirror (0..100)
      recognitionForeclosed: false,
      lastTurn: null,
      log: []
    };
  }
  var BL = C.blockade;
  if (typeof BL.selfEmbargo !== "boolean") BL.selfEmbargo = (side === "CS");
  if (typeof BL.embargoLifted !== "boolean") BL.embargoLifted = false;
  if (BL.depth !== "full" && BL.depth !== "flat" && BL.depth !== "off") BL.depth = "full";
  if (typeof BL.delegated !== "boolean") BL.delegated = true;
  if (typeof BL.cottonStockK !== "number") BL.cottonStockK = (side === "CS") ? 4000 : 0;
  if (typeof BL.cottonExportedK !== "number") BL.cottonExportedK = 0;
  if (typeof BL.cottonRevenueTotal !== "number") BL.cottonRevenueTotal = 0;
  if (typeof BL.importFactor !== "number") BL.importFactor = (side === "CS") ? 0.85 : 1.0;
  if (typeof BL.portsOpen !== "number") BL.portsOpen = (side === "CS") ? 4 : 0;
  if (typeof BL.recognition !== "number") BL.recognition = 0;
  if (typeof BL.recognitionForeclosed !== "boolean") BL.recognitionForeclosed = false;
  if (!BL.log) BL.log = [];
}

/* ---- blockadeOnResolve: the per-turn cotton/blockade/diplomacy tick.
   Runs AFTER clk/econ/wr and BEFORE prodOnResolve (so the fresh importFactor
   gates CS arms this same turn). Mutates C.blockade, C.funds, C.clock.intervention. ---- */
function blockadeOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  blockadeInit(C);
  try {
    var side = (C.side === "CS") ? "CS" : "US";
    var BL = C.blockade;
    var year = (B && B.bd && typeof B.bd.year === "number") ? B.bd.year
             : (C.clock && typeof C.clock.year === "number") ? C.clock.year
             : (C.president && C.president.date && typeof C.president.date.year === "number") ? C.president.date.year
             : 1861;
    var depth = BL.depth;

    // --- US side: the blockade is a WEAPON, not a cotton lever. No cotton revenue;
    //     full imports; naval dominance + "King Wheat" grain diplomacy suppress the
    //     risk of foreign intervention against the Union over time. ---
    if (side === "US") {
      BL.importFactor = 1.0;
      BL.portsOpen = 0;
      if (depth !== "off" && C.clock && typeof C.clock.intervention === "number" && year >= 1862) {
        C.clock.intervention = Math.max(0, C.clock.intervention - 1.5);  // Anaconda + King Wheat
      }
      BL.lastTurn = { year: year, shippedK: 0, revenue: 0, importFactor: 1.0,
                      capturePct: 0, runnerPct: 100, portsOpen: 0, recognition: 0 };
      return;
    }

    // ===================== Confederate cotton/blockade model =====================
    // Performance + the player's counter-levers (design law §5): a winning or
    // well-prepared South is NOT bound to the historical blockade schedule.
    var mom = (typeof vicMomentum === "function") ? vicMomentum(C) : 0.5;
    var S = C.strategy || {};

    // Resolve the per-voyage odds + open ports under the depth toggle.
    var cp, rs, ports;
    if (depth === "off") { cp = 0.0; rs = 1.0; ports = 4; }
    else if (depth === "flat") { cp = 0.25; rs = 0.75; ports = (year >= 1865 ? 2 : 4); }
    else { cp = _blkCaptureProb(year); rs = _blkRunnerSuccess(year); ports = _blkPortsByYear(year, mom, S.fortifyPorts); }
    if (S.runnerInvestment) rs = Math.min(0.96, rs + 0.15);   // invest in faster, surer runners
    BL.portsOpen = ports;
    var pf = ports / 4;          // port factor (lifeline narrows as ports fall)

    // The 1861 embargo expires by 1862 — the Confederacy's hunger for hard
    // currency overrode "King Cotton" coercion. Auto-lift if the player didn't.
    if (BL.selfEmbargo && !BL.embargoLifted && year >= 1862) {
      BL.embargoLifted = true;
      _blkPush(C, "The cotton embargo collapses — Richmond needs hard currency more than leverage.");
    }
    var embargoActive = BL.selfEmbargo && !BL.embargoLifted;

    // --- Cotton exports + revenue. The embargo throttles exports to ~nothing
    //     (the TRAP: a full treasury of cotton, no cash). Otherwise runner success
    //     x port factor x stock sets what gets through. ---
    var throttle = embargoActive ? 0.03 : 1.0;
    var capacityK = _blkEXPORT_CAP_K * (depth === "off" ? pf : rs * pf) * throttle;
    var shippedK = Math.min(BL.cottonStockK, Math.max(0, capacityK));
    BL.cottonStockK = Math.max(0, BL.cottonStockK - shippedK);
    BL.cottonExportedK += shippedK;
    var revenue = Math.round(shippedK * _blkFUNDS_PER_KBALE);
    BL.cottonRevenueTotal += revenue;
    if (typeof C.funds === "number") C.funds += revenue;

    // --- Small-arms importFactor (the lifeline that 50-production.js reads). The
    //     South imported the majority of its shoulder arms through the runners, so
    //     arms supply tracks the blockade, NOT domestic factories. ---
    var impF;
    if (depth === "off") impF = 1.05;
    else impF = 0.85 * rs * pf;
    BL.importFactor = Math.max(0.2, Math.min(1.1, impF));

    // --- Foreign-recognition pressure (King Cotton diplomacy). Rises with the
    //     Lancashire famine + early battlefield wins; capped by substitution; the
    //     embargo earns NOTHING (Britain resented coercion); FORECLOSED after
    //     Antietam + Emancipation (treat 1863+ as the closed door). ---
    var boost = 0;
    if (!BL.recognitionForeclosed) {
      if (year === 1862) boost += 6;          // Lancashire famine bites (peak winter 1862-63)
      else if (year === 1863) boost += 3;
      else boost += 1;
      if (win && (type === "decisive" || type === "win")) boost += 5;   // battlefield success keeps Europe interested
      if (S.pursueRecognition) boost += 5;                              // active courting of London & Paris
      if (S.commerceRaiders) boost += 1;                               // raiders demonstrate reach
      if (embargoActive) boost = 0;           // the embargo trap: coercion yields no recognition
    }
    var decay = 0.9;                          // Indian/Egyptian/Brazilian substitution erodes leverage
    // Foreclosure after Antietam is the DEFAULT fate — but only of a Confederacy that
    // is losing and not courting Europe. Win, or press the cause, and the window the
    // real CSA lost stays open (§5 alt-history; the 1862 crisis really was that close).
    if (year >= 1863 && !BL.recognitionForeclosed && mom < 0.6 && !S.pursueRecognition) {
      BL.recognitionForeclosed = true;
      _blkPush(C, "Antietam and the Emancipation Proclamation slam the door on recognition.");
    }
    if (BL.recognitionForeclosed) { decay = 0.5; boost = 0; }
    BL.recognition = Math.max(0, Math.min(100, BL.recognition * decay + boost));

    // Interlink: the cotton-diplomacy channel pulls clock.intervention toward the
    // (low, declining) recognition reality — so even CS battlefield wins cannot
    // conjure the intervention King Cotton promised. The teaching trap, mechanized.
    if (C.clock && typeof C.clock.intervention === "number") {
      C.clock.intervention = Math.max(0, Math.min(100,
        C.clock.intervention + (BL.recognition - C.clock.intervention) * 0.30));
    }

    BL.lastTurn = { year: year, shippedK: Math.round(shippedK), revenue: revenue,
                    importFactor: Math.round(BL.importFactor * 100) / 100,
                    capturePct: Math.round(cp * 100), runnerPct: Math.round(rs * 100),
                    portsOpen: ports, recognition: Math.round(BL.recognition) };

    if (embargoActive && year <= 1861) _blkPush(C, "King Cotton withheld — the wharves sit full, the treasury empty.");
    else if (ports === 0) _blkPush(C, "Wilmington falls — the last runner port is closed; the South is sealed.");
    else if (revenue > 0 && shippedK > 0) _blkPush(C, "Runners slip " + Math.round(shippedK) + "k bales past the blockade (+" + revenue + " funds).");
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("blockadeOnResolve:", e); }
}

/* Status word + colour for the recognition meter. */
function _blkRecogStatus(BL) {
  if (BL.recognitionForeclosed) return ["Foreclosed", "#7a241b"];
  if (BL.recognition >= 45) return ["Courted", "#4a6b3a"];
  if (BL.recognition >= 20) return ["Wavering", "#b8863b"];
  return ["Distant", "#9c3b2e"];
}

/* Status word for the blockade tightness (capture %). */
function _blkTightStatus(pct) {
  if (pct <= 0) return ["Open seas", "#4a6b3a"];
  if (pct < 18) return ["Porous", "#b8863b"];
  if (pct < 30) return ["Tightening", "#c9712e"];
  return ["Strangling", "#9c3b2e"];
}

/* Pull a teaching card (multi-voice) from GAME_DATA.diplomacy when present. */
function _blkCard(id) {
  try {
    var D = (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA.diplomacy) ? GAME_DATA.diplomacy : null;
    if (D && D.teachingCards) {
      for (var i = 0; i < D.teachingCards.length; i++) if (D.teachingCards[i].id === id) return D.teachingCards[i];
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_blkCard:", e); }
  return null;
}

/* The teaching expander text (R7/R26 — multi-voice when research is on disk; a
   grounded fallback otherwise). */
function _blkWhyText(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var card = _blkCard(side === "CS" ? "cotton-king-chance" : "cotton-blockade-decisive");
  if (card) {
    var sc = function (o) {
      if (!o || !o.scholars || !o.scholars.length) return '';
      var names = o.scholars.slice(0, 2).map(function (s) { return String(s).replace(/\*/g, '').split(/[—(]/)[0].trim(); });
      return ' <span style="opacity:.7">(' + names.join("; ") + ')</span>';
    };
    var out = '<b>' + card.title + '</b><br>';
    if (card.consensus) out += '<b>Consensus:</b> ' + card.consensus.claim + sc(card.consensus) + '<br>';
    if (card.dissent) out += '<b>But some argue:</b> ' + card.dissent.claim + sc(card.dissent) + '<br>';
    if (card.fringe) out += '<span style="opacity:.7"><b>' + (card.fringe.label || 'Fringe') + ':</b> ' + card.fringe.claim + '</span><br>';
    if (card.takeaway) out += '<span style="opacity:.85">' + card.takeaway + '</span> ';
    out += '<span style="opacity:.7">' + (card.provenance || 'Verified') + '.</span>';
    return out;
  }
  if (side === "CS") {
    return '<b>King Cotton was a bluff the South could not back.</b> The Confederacy gambled that cutting off cotton would starve British mills into recognition. '
      + 'But Britain entered 1861 on a record glut (~1M+ surplus bales), India and Egypt ramped supply, and the North\'s grain ("King Wheat") gave London a reason to stay neutral. '
      + 'Frank Owsley framed King Cotton diplomacy as a central Confederate strategy; later scholars (Surdam, Howard Jones) judge it doomed — coercion bred resentment, and Antietam plus Emancipation foreclosed recognition for good. <span style="opacity:.7">Verified.</span>';
  }
  return '<b>The blockade strangled in aggregate.</b> Individual runners usually got through (~5 in 6 early), which long fed a myth that the blockade was a paper one. '
    + 'But David Surdam showed the decisive metric was AGGREGATE: under ~2M bales reached Europe across the whole war versus ~10M+ in peacetime — the Southern export economy collapsed even as ships slipped past. '
    + 'The blockade also deterred big merchantmen and forced cargo into small, low-volume runners. <span style="opacity:.7">Verified.</span>';
}

/* ---- blockadeRenderDiplomacy: the Diplomacy & the Blockade desk tab. ---- */
function blockadeRenderDiplomacy(C) {
  if (!C) return '';
  blockadeInit(C);
  var side = (C.side === "CS") ? "CS" : "US";
  var BL = C.blockade;
  var sec = (side === "CS") ? "Benjamin" : "Seward";
  var lt = BL.lastTurn;

  var depthLabel = { full: "Full strangulation", flat: "Flat modifier", off: "Off" }[BL.depth] || "Full";
  var depthHint = { full: "Year-by-year capture odds, port losses, runner economics (most historical).",
                    flat: "A single steady blockade penalty — less micro.",
                    off: "No blockade — cotton flows freely (sandbox)." }[BL.depth] || "";

  var meter = function (label, v, status) {
    v = Math.max(0, Math.min(100, Math.round(v || 0)));
    return '<div style="margin:5px 0"><div style="display:flex;justify-content:space-between;font-size:12px;opacity:.85"><span>' + label
      + '</span><span style="color:' + status[1] + ';font-weight:bold">' + status[0] + '</span></div>'
      + '<div style="height:8px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
      + '<div style="height:100%;width:' + v + '%;background:' + status[1] + '"></div></div></div>';
  };

  var head = ''
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">'
    +   '<div><div style="font-size:17px;font-weight:bold">Diplomacy &amp; the Blockade</div>'
    +     '<div style="opacity:.75;font-size:12px">Secretary of State ' + sec + (BL.delegated ? ' &mdash; managing foreign affairs' : ' &mdash; awaiting your instruction') + '</div></div>'
    + '</div><hr class="rule">';

  var body;
  if (side === "CS") {
    var tight = _blkTightStatus(lt ? lt.capturePct : Math.round(_blkCaptureProb(C.clock ? C.clock.year : 1861) * 100));
    var recog = _blkRecogStatus(BL);
    body = ''
      + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:2px 0 4px">King Cotton</div>'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:13px;margin-bottom:6px">'
      +   '<span>Cotton on hand: <b>' + Math.round(BL.cottonStockK) + 'k</b> bales</span><span style="opacity:.5">&middot;</span>'
      +   '<span>Exported: <b>' + Math.round(BL.cottonExportedK) + 'k</b></span><span style="opacity:.5">&middot;</span>'
      +   '<span>Cotton revenue: <b>' + Math.round(BL.cottonRevenueTotal) + '</b></span></div>'
      // self-embargo lever
      + '<div style="margin:8px 0;padding:9px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
      +   '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">'
      +     '<div><b>The 1861 Cotton Embargo</b><div style="font-size:11px;opacity:.7">Withhold cotton to coerce European recognition.</div></div>'
      +     '<button id="blkEmbargo" type="button" class="upg">' + ((BL.selfEmbargo && !BL.embargoLifted) ? 'Embargo ON' : 'Embargo lifted') + '</button>'
      +   '</div>'
      +   '<div style="font-size:11px;opacity:.7;margin-top:5px;color:' + ((BL.selfEmbargo && !BL.embargoLifted) ? '#c9712e' : 'inherit') + '">'
      +     ((BL.selfEmbargo && !BL.embargoLifted)
            ? 'Warning: Britain holds a cotton glut. The embargo forfeits hard currency and wins no recognition &mdash; a trap.'
            : 'Cotton flows to the runners; the embargo experiment is over.') + '</div>'
      + '</div>'
      + meter('Blockade pressure', lt ? lt.capturePct : 10, tight)
      + meter('Foreign-recognition pressure', BL.recognition, recog)
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;opacity:.85;margin-top:4px">'
      +   '<span>Runner ports open: <b>' + BL.portsOpen + '</b>/4</span><span style="opacity:.5">&middot;</span>'
      +   '<span>Runner success: <b>' + (lt ? lt.runnerPct : 90) + '%</b></span><span style="opacity:.5">&middot;</span>'
      +   '<span>Arms import reliance: <b>' + Math.round(BL.importFactor * 100) + '%</b></span></div>';
    if (lt && lt.shippedK > 0) body += '<div style="font-size:12px;opacity:.8;margin-top:4px">Last quarter: <b>' + lt.shippedK + 'k</b> bales run out, <b>+' + lt.revenue + '</b> funds earned.</div>';
    else if (lt) body += '<div style="font-size:12px;opacity:.8;margin-top:4px">Last quarter: no cotton reached Europe.</div>';
  } else {
    body = ''
      + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:2px 0 4px">The Anaconda</div>'
      + '<p class="lede" style="font-size:13px">The Union\'s strategy is strangulation: blockade every Southern port, deny the Confederacy its cotton revenue and imported arms, '
      + 'and use Northern grain (&ldquo;King Wheat&rdquo;) to keep Britain neutral. Each season the noose tightens and the chance of foreign intervention falls.</p>'
      + meter('Foreign-intervention risk', (C.clock ? C.clock.intervention : 8), _blkTightStatus(C.clock ? C.clock.intervention : 8))
      + '<p class="lede" style="font-size:12px;opacity:.7;margin-top:6px">Capturing Southern ports (Wilmington, Charleston, Mobile) severs blockade-runner lifelines outright.</p>';
  }

  var depthRow = ''
    + '<hr class="rule"><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:2px 0 4px">Blockade model (realism)</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">'
    +   '<div><b>' + depthLabel + '</b><div style="font-size:11px;opacity:.7">' + depthHint + '</div></div>'
    +   '<button id="blkDepth" type="button" class="upg">Change</button>'
    + '</div>';

  var btns = ''
    + '<div class="btn-row" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'
    +   '<button id="blkDelegate" type="button" class="upg">' + (BL.delegated ? 'Take personal control' : 'Delegate to Sec. ' + sec) + '</button>'
    +   '<button id="blkWhy" type="button" class="upg">Why it mattered</button>'
    + '</div>'
    + '<div id="blkWhyBox" style="display:none;margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12);font-size:12px;line-height:1.5"></div>';

  return head + body + depthRow + btns;
}

/* ---- blockadeWireDiplomacy: embargo toggle, depth cycle, delegate, teaching. ---- */
function blockadeWireDiplomacy(C) {
  if (!C || !C.blockade) return;
  var BL = C.blockade;
  var emb = document.getElementById("blkEmbargo");
  if (emb) emb.addEventListener("click", function () {
    if (BL.selfEmbargo && !BL.embargoLifted) { BL.embargoLifted = true; }
    else { BL.selfEmbargo = true; BL.embargoLifted = false; }
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
  var dep = document.getElementById("blkDepth");
  if (dep) dep.addEventListener("click", function () {
    BL.depth = (BL.depth === "full") ? "flat" : (BL.depth === "flat") ? "off" : "full";
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
  var del = document.getElementById("blkDelegate");
  if (del) del.addEventListener("click", function () {
    BL.delegated = !BL.delegated;
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
  var why = document.getElementById("blkWhy");
  if (why) why.addEventListener("click", function () {
    var box = document.getElementById("blkWhyBox");
    if (!box) return;
    if (box.style.display === "none") { box.innerHTML = _blkWhyText(C); box.style.display = "block"; }
    else box.style.display = "none";
  });
}
