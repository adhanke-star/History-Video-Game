/* ===========================================================================
   S0 · 30-president-shell.js — President's Desk SHELL + strategic-turn surface.

   Aaron's locked S0 design decisions (popup, run i):
     (1) EXPAND IN PLACE — the War Department screen BECOMES the President's Desk:
         keep its 1864 Clock / Muster Roll / War Room tabs, add The War Effort /
         Cabinet / Theater Map. One owner-mode screen, no parallel system (§1/§11).
     (2) AUTO-SURFACE, ONE-CLICK SKIP — between battles a brief "To the Executive
         Mansion" interstitial appears; one click continues, or open the desk.
     (3) CABINET stubbed now with engraved portraits (render in 20-…).

   Mechanism = override-by-redeclaration (last top-level def wins; spliced after
   base). We redeclare:
       _wdRefresh   — dispatch all SIX tabs (wr/clk/mr Wire fns still call this
                      by name after they mutate, so their tabs keep working)
       openWarDept  — render the President's Desk (six tabs) instead of 3
       openUpgrade  — prepend the one-per-turn strategic interstitial, then run
                      the VERBATIM-replicated base body (base 2864-2885); the big
                      _renderUpgradeSheet is left untouched and called by name.
   No edit to base.html; campaignAdvance calls openUpgrade by bare name → wrap
   is picked up automatically. _wdTabBtn (base 11552) is reused as-is.
   =========================================================================== */

/* Once-per-turn guard for the interstitial; and a one-shot "after the desk
   closes, do this" continuation used to chain desk → upgrade screen. */
var _pdTurnAck = false;
var _pdAfterDeskClose = null;

/* Wire the Cabinet tab's per-domain Delegate toggles (R25 stub). */
function presWireCabinet(C) {
  if (!C || !C.president) return;
  var cab = C.president.cabinet || [];
  for (var i = 0; i < cab.length; i++) {
    (function (a) {
      var b = document.getElementById("pdDel_" + a.domain);
      if (!b) return;
      b.addEventListener("click", function () {
        a.delegated = !a.delegated;
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(cab[i]);
  }
}

/* ---- _wdRefresh OVERRIDE: dispatch the six desk tabs. ----
   Replicates the base dispatch for the three existing tabs (so wr/clk/mr Wire
   handlers that call _wdRefresh keep refreshing their own tab) and adds the
   three new President's-Desk tabs. */
function _wdRefresh() {
  var C = G.campaign;
  if (!C) return;
  var cont = document.getElementById("wdContent");
  if (!cont) return;
  var html = "", wire = null;
  if (_wdTab === "muster") {
    html = (typeof mrRenderHTML === "function") ? mrRenderHTML(C) : "";
    wire = (typeof mrWire === "function") ? mrWire : null;
  } else if (_wdTab === "warroom") {
    html = (typeof wrRenderHTML === "function") ? wrRenderHTML(C) : "";
    wire = (typeof wrWire === "function") ? wrWire : null;
  } else if (_wdTab === "clock") {
    html = (typeof clkRenderHTML === "function") ? clkRenderHTML(C) : "";
    wire = (typeof clkWire === "function") ? clkWire : null;
  } else if (_wdTab === "treasury") {
    html = (typeof econRenderFinance === "function") ? econRenderFinance(C) : "";
    wire = (typeof econWireFinance === "function") ? econWireFinance : null;
  } else if (_wdTab === "diplomacy") {
    html = (typeof blockadeRenderDiplomacy === "function") ? blockadeRenderDiplomacy(C) : "";
    wire = (typeof blockadeWireDiplomacy === "function") ? blockadeWireDiplomacy : null;
  } else if (_wdTab === "victory") {
    html = (typeof vicRenderPaths === "function") ? vicRenderPaths(C) : "";
    wire = (typeof vicWirePaths === "function") ? vicWirePaths : null;
  } else if (_wdTab === "cabinet") {
    html = (typeof presRenderCabinet === "function") ? presRenderCabinet(C) : "";
    wire = (typeof presWireCabinet === "function") ? presWireCabinet : null;
  } else if (_wdTab === "map") {
    html = (typeof presRenderMap === "function") ? presRenderMap(C) : "";
    wire = null;
  } else { // "economy" — the President's overview (default landing)
    html = (typeof presRenderEconomy === "function") ? presRenderEconomy(C) : "";
    wire = null;
  }
  cont.innerHTML = html || '<p class="lede" style="text-align:center;opacity:0.7">This office is not yet staffed.</p>';
  var tabs = ["economy", "treasury", "diplomacy", "victory", "warroom", "clock", "muster", "cabinet", "map"];
  for (var i = 0; i < tabs.length; i++) {
    var b = document.getElementById("wdTab_" + tabs[i]);
    if (b) b.style.opacity = (tabs[i] === _wdTab) ? "1" : "0.55";
  }
  if (wire) { try { wire(C); } catch (e) {} }
}

/* ---- openWarDept OVERRIDE: the President's Desk (expand-in-place). ---- */
function openWarDept() {
  var C = G.campaign;
  if (!C) {
    if (typeof loadLocal === "function") {
      var sv = loadLocal();
      if (sv && sv.campaign && typeof applySave === "function") { applySave(sv); C = G.campaign; }
    }
  }
  if (!C) { if (typeof toast === "function") toast("No active campaign."); return; }
  if (typeof _t1InitAll === "function") _t1InitAll(C);   // inits clock/muster/warroom AND president
  if (typeof presInit === "function") presInit(C);
  C.president.onboarded = true;                          // layered-onboarding flag (§10/§23)
  _wdTab = "economy";                                    // land on the President's overview
  var head = C.president.head || {};
  var html =
    '<h1 class="title-xl" style="text-align:center">The President\'s Desk</h1>' +
    '<p class="title-sub" style="text-align:center">' + (head.title || '')
      + (head.seat ? ' &mdash; ' + head.seat : '') + '</p>' +
    '<hr class="rule">' +
    '<div id="wdTabs" style="display:flex;gap:6px;justify-content:center;margin-bottom:12px;flex-wrap:wrap">' +
      _wdTabBtn("economy", "The War Effort") +
      _wdTabBtn("treasury", "The Treasury") +
      _wdTabBtn("diplomacy", "Diplomacy") +
      _wdTabBtn("victory", "Paths to Victory") +
      _wdTabBtn("warroom", "War Room") +
      _wdTabBtn("clock", "1864 Clock") +
      _wdTabBtn("muster", "Muster Roll") +
      _wdTabBtn("cabinet", "Cabinet") +
      _wdTabBtn("map", "Theater Map") +
    '</div>' +
    '<div id="wdContent"></div>' +
    '<div class="btn-row" style="margin-top:14px"><button id="wdClose" type="button" class="bigbtn">Close</button></div>';
  if (typeof openSheet === "function") openSheet(html);
  _wdRefresh();
  var cl = document.getElementById("wdClose");
  if (cl) cl.addEventListener("click", function () {
    if (_pdAfterDeskClose) { var cb = _pdAfterDeskClose; _pdAfterDeskClose = null; cb(); }
    else if (typeof closeSheet === "function") closeSheet();
  });
  ["economy", "treasury", "diplomacy", "victory", "warroom", "clock", "muster", "cabinet", "map"].forEach(function (k) {
    var b = document.getElementById("wdTab_" + k);
    if (b) b.addEventListener("click", function () { _wdTab = k; _wdRefresh(); });
  });
}

/* The between-battles strategic-turn surface. Opens an overlay sheet; one click
   continues to the Quartermaster, or opens the desk (whose Close then continues). */
function _pdShowTurnInterstitial() {
  var C = G.campaign;
  if (!C) { _pdTurnAck = false; if (typeof openUpgrade === "function") openUpgrade(); return; }
  if (typeof presInit === "function") presInit(C);
  if (typeof openSheet !== "function") { _pdTurnAck = false; if (typeof openUpgrade === "function") openUpgrade(); return; }
  openSheet(_pdInterstitialHTML(C));
  var on = document.getElementById("pdGoOn");
  if (on) on.addEventListener("click", function () { if (typeof openUpgrade === "function") openUpgrade(); });
  var desk = document.getElementById("pdGoDesk");
  if (desk) desk.addEventListener("click", function () {
    _pdAfterDeskClose = function () { if (typeof openUpgrade === "function") openUpgrade(); };
    openWarDept();
  });
  var brief = document.getElementById("pdGoBrief");
  if (brief && typeof bridgeBriefingHTML === "function") brief.addEventListener("click", function () {
    openSheet(bridgeBriefingHTML(C));
    if (typeof bridgeWireBriefing === "function") bridgeWireBriefing(C,
      function () { _pdShowTurnInterstitial(); },                                   // Back → the interstitial
      function () { if (typeof openUpgrade === "function") openUpgrade(); });        // To the Field → Quartermaster/battle
  });
}

/* ---- openUpgrade OVERRIDE: surface the strategic turn once, then the base flow.
   Body after the guard is replicated VERBATIM from base.html openUpgrade
   (lines 2864-2885); _renderUpgradeSheet (base) is untouched and called by name. */
function openUpgrade() {
  var C = G.campaign;
  // Auto-surface the strategic turn ONCE per post-battle turn (one-click skip).
  if (C && C.president && !_pdTurnAck) {
    _pdTurnAck = true;
    if (typeof presInit === "function") presInit(C);
    _pdShowTurnInterstitial();
    return;
  }
  _pdTurnAck = false;
  // --- base openUpgrade body (replicated; do not diverge from base 2864-2885) ---
  G.mode = "upgrade";
  if (typeof hideHud === "function") hideHud();
  if (!C) { if (typeof toast === "function") toast("No active campaign."); return; }
  var chainId = CHAINS[C.side][C.idx];
  var bd = BATTLES.find(function (b) { return b.id === chainId; });
  if (!bd) { if (typeof launchCampaignBattle === "function") launchCampaignBattle(); return; }
  if (typeof _renderUpgradeSheet === "function") _renderUpgradeSheet(C, bd);
}
