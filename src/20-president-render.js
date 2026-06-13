/* ===========================================================================
   S0 · 20-president-render.js — President's Desk: the NEW tab renderers.

   Pure render (HTML string) + wire (event listeners) for the desk tabs that
   S0 ADDS to the (expanded-in-place) War Department screen:
       economy  → presRenderEconomy(C)   "The War Effort" — state-of-the-war overview
       cabinet  → presRenderCabinet(C)   the 4 secretaries (engraved portraits, R25 stub)
       map      → presRenderMap(C)        Theater Map placeholder (full map = S1, §18)
   plus the between-battles strategic-turn interstitial body:
       _pdInterstitialHTML(C)

   The existing War-Department tabs (War Room / 1864 Clock / Muster Roll) keep
   their own wr/clk/mr render fns untouched; the desk's _wdRefresh (in
   30-president-shell.js) dispatches all six. Period aesthetic (R30): reuse the
   existing classes (.title-xl/.title-sub/.rule/.lede/.bigbtn/.btn-row/.fundbar/
   .coin) + var(--rule); zero new CSS.

   Codebase rules: bare-name globals (G, never window.G); portraitFor lives in a
   closure and is reachable only via window.portraitFor from here; _pd* unique
   names; render fns NEVER mutate state or save (that is the Wire fns' job).
   =========================================================================== */

/* Small two-cell stat row for the overview ledger. */
function _pdStat(label, value, accent) {
  return '<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0;border-bottom:1px dotted var(--rule)">'
    + '<span style="opacity:.75">' + label + '</span>'
    + '<span style="font-weight:bold' + (accent ? ';color:' + accent : '') + '">' + value + '</span>'
    + '</div>';
}

/* A meter (0-100) drawn as a thin period bar. */
function _pdMeter(label, v, hi) {
  v = Math.max(0, Math.min(100, Math.round(v || 0)));
  var col = hi ? (v > 66 ? '#9c3b2e' : v > 33 ? '#b8863b' : '#4a6b3a')   // higher = worse (weariness/intervention)
               : (v > 66 ? '#4a6b3a' : v > 33 ? '#b8863b' : '#9c3b2e');  // higher = better (supply/capital)
  return '<div style="margin:5px 0">'
    + '<div style="display:flex;justify-content:space-between;font-size:12px;opacity:.8"><span>' + label + '</span><span>' + v + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    + '<div style="height:100%;width:' + v + '%;background:' + col + '"></div></div></div>';
}

/* ---- "The War Effort": the President's state-of-the-war overview (S0). ----
   A live ledger drawn from the existing systems; full economy/finance is S1. */
function presRenderEconomy(C) {
  if (!C) return '';
  if (typeof presInit === "function") presInit(C);
  var P = C.president, clk = C.clock || {}, wr = C.warroom || {};
  var sideName = (C.side === "CS") ? "the Confederacy" : "the Union";
  var head = P.head || {};
  var portrait = "";
  if (typeof window.portraitFor === "function") {
    try {
      portrait = '<img src="' + window.portraitFor(head.name, C.side, { named: true }) + '" alt="'
        + (head.name || 'President') + '" style="width:84px;height:84px;object-fit:cover;border:2px solid var(--rule);border-radius:4px;flex:0 0 auto">';
    } catch (e) {}
  }
  var nodeLevels = 0, nodeKeys = ["industry", "ordnance", "provisions", "rail", "depot"];
  if (wr.nodes) for (var i = 0; i < nodeKeys.length; i++) nodeLevels += (wr.nodes[nodeKeys[i]] || 0);

  var dispatches = "";
  if (P.log && P.log.length) {
    dispatches = '<div style="margin-top:12px"><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:4px">From the Wires</div>';
    for (var d = 0; d < P.log.length; d++) dispatches += '<div style="font-size:12px;opacity:.85;padding:2px 0">&bull; ' + P.log[d] + '</div>';
    dispatches += '</div>';
  } else {
    dispatches = '<p class="lede" style="opacity:.6;font-size:12px;margin-top:12px">No dispatches yet — the war is young.</p>';
  }

  var electionLine = clk.resolved1864
    ? (clk.elected ? 'Won (war continues)' : 'Lost (peace platform ascendant)')
    : (clk.year >= 1864 ? 'Pending — November 1864' : 'Not yet at hand');

  return ''
    + '<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:10px">'
    +   portrait
    +   '<div style="flex:1 1 auto">'
    +     '<div style="font-size:18px;font-weight:bold">' + (head.title || 'The President') + '</div>'
    +     '<div style="opacity:.75;font-size:13px">' + (head.seat || '') + '</div>'
    +     '<div style="opacity:.85;font-size:13px;margin-top:4px">'
    +       _pdMonthName(P.date.month) + ' ' + P.date.year + ' &middot; Strategic Turn ' + (P.turn || 0)
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '<hr class="rule">'
    + '<div style="display:flex;gap:20px;flex-wrap:wrap">'
    +   '<div style="flex:1 1 220px;min-width:200px">'
    +     '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:4px">The Treasury & The War</div>'
    +     _pdStat('Treasury', '$' + (C.funds || 0))
    +     _pdStat('War-Department nodes built', nodeLevels + ' / 25')
    +     _pdStat('Battles fought', (C.stats ? C.stats.battles : 0))
    +     _pdStat('Victories', (C.stats ? C.stats.won : 0), '#4a6b3a')
    +     _pdStat('The year', clk.year || P.date.year)
    +     _pdStat('1864 election', electionLine)
    +   '</div>'
    +   '<div style="flex:1 1 220px;min-width:200px">'
    +     '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:4px">The Home Front</div>'
    +     _pdMeter('War-weariness', clk.weariness, true)
    +     _pdMeter('Political capital', Math.min(100, clk.capital || 0), false)
    +     _pdMeter('Foreign-intervention pressure', clk.intervention, true)
    +     _pdMeter('Supply', wr.supply, false)
    +   '</div>'
    + '</div>'
    + dispatches
    + '<hr class="rule">'
    + '<p class="lede" style="font-size:12px;opacity:.7">Full executive management of ' + sideName
    + ' — finance &amp; inflation, industry, railroads, agriculture, the blockade, diplomacy, and the home front — '
    + 'deepens as the war grows. Your cabinet will advise and, where you wish, manage it for you.</p>';
}

/* ---- The Cabinet: the 4 secretaries with engraved portraits (R25 stub). ----
   Per-domain "Delegate" toggle is live (presWireCabinet); auto-manage + the
   teaching voice land in S2. portraitFor renders these civilians via the
   engraving fallback (no PD photo on file → period engraving). */
function presRenderCabinet(C) {
  if (!C) return '';
  if (typeof presInit === "function") presInit(C);
  var P = C.president;
  var cards = "";
  for (var i = 0; i < P.cabinet.length; i++) {
    var a = P.cabinet[i];
    var img = "";
    if (typeof window.portraitFor === "function") {
      try {
        img = '<img src="' + window.portraitFor(a.name, C.side, { named: true }) + '" alt="Secretary ' + a.name
          + '" style="width:72px;height:72px;object-fit:cover;border:2px solid var(--rule);border-radius:4px;flex:0 0 auto">';
      } catch (e) {}
    }
    var on = !!a.delegated;
    cards += '<div style="display:flex;gap:12px;align-items:center;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
      + img
      + '<div style="flex:1 1 auto">'
      +   '<div style="font-weight:bold;font-size:15px">Secretary ' + a.name + '</div>'
      +   '<div style="opacity:.75;font-size:12px">' + a.role + '</div>'
      +   '<div style="opacity:.6;font-size:11px;margin-top:3px">' + (on ? 'Running the department in your stead.' : 'Awaiting your direction.') + '</div>'
      + '</div>'
      + '<button id="pdDel_' + a.domain + '" type="button" class="upg" style="flex:0 0 auto">'
      +   (on ? 'Delegated &check;' : 'Delegate')
      + '</button>'
      + '</div>';
  }
  return ''
    + '<p class="lede" style="font-size:13px;margin-bottom:10px">Your cabinet advises you, manages the departments you entrust to them, '
    + 'and explains the <em>why</em> behind every recommendation. Delegate a department to let its secretary run it — or keep the reins yourself.</p>'
    + '<div style="display:flex;flex-direction:column;gap:8px">' + cards + '</div>'
    + '<p class="lede" style="font-size:11px;opacity:.6;margin-top:12px">In future turns each secretary will surface choices, run their domain on your behalf, '
    + 'and teach the history behind the decision (the scholarly debate, the trade-offs, the cost).</p>';
}

/* Theater Map placeholder — the living strategic map (armies/rail/rivers, §18) is S1. */
function presRenderMap(C) {
  if (!C) return '';
  var theaters = [
    ['Eastern Theater', 'Washington &harr; Richmond — the Virginia campaigns, the Shenandoah, the road between the capitals.'],
    ['Western Theater', 'Tennessee, Kentucky, Georgia — Shiloh, Vicksburg, Chickamauga, the march to Atlanta.'],
    ['Trans-Mississippi', 'Missouri, Arkansas, the far frontier west of the great river.']
  ];
  var rows = "";
  for (var i = 0; i < theaters.length; i++) {
    rows += '<div style="padding:9px 0;border-bottom:1px dotted var(--rule)">'
      + '<div style="font-weight:bold;font-size:14px">' + theaters[i][0] + '</div>'
      + '<div style="opacity:.75;font-size:12px">' + theaters[i][1] + '</div></div>';
  }
  return ''
    + '<p class="lede" style="font-size:13px;margin-bottom:6px">The seat of war spans three great theaters.</p>'
    + '<div>' + rows + '</div>'
    + '<hr class="rule">'
    + '<p class="lede" style="font-size:12px;opacity:.7">The living strategic map — armies maneuvering over railroads and rivers, '
    + 'cities and supply lines changing hands, battles emerging from the campaign — is being drawn. '
    + 'For now, the war is fought through the existing battle chain; the open-map campaign arrives as the owner-mode deepens.</p>';
}

/* The between-battles strategic-turn interstitial (auto-surface, one-click skip). */
function _pdInterstitialHTML(C) {
  var P = (C && C.president) ? C.president : null;
  var when = P ? (_pdMonthName(P.date.month) + ' ' + P.date.year) : '';
  var dispatch = (P && P.log && P.log.length) ? P.log[0] : 'The armies rest, and the work of the war goes on.';
  var sideName = (C && C.side === "CS") ? "the Confederate States" : "the United States";
  return ''
    + '<h1 class="title-xl" style="text-align:center">To the Executive Mansion</h1>'
    + '<p class="title-sub" style="text-align:center">' + when + (P ? ' &middot; Strategic Turn ' + (P.turn || 0) : '') + '</p>'
    + '<hr class="rule">'
    + '<p class="lede" style="text-align:center;font-size:14px">' + dispatch + '</p>'
    + '<p class="lede" style="text-align:center;font-size:12px;opacity:.7">As President of ' + sideName
    + ', you may review the war effort and confer with your cabinet — or press on to the front.</p>'
    + '<div class="btn-row" style="margin-top:16px;display:flex;gap:10px;justify-content:center">'
    +   '<button id="pdGoDesk" type="button" class="upg">Review the War Effort</button>'
    +   '<button id="pdGoOn" type="button" class="bigbtn">Continue &#9654;</button>'
    + '</div>';
}
