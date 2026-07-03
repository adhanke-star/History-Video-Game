/* ============================================================================
   101-h0-between-battle.js -- H0 prototype slice: between-battle interstitial
   ----------------------------------------------------------------------------
   Late-bound presentation pass for the strategic-turn surface shown before the
   Quartermaster. Assignment override only: preserves pdGoDesk, pdGoBrief,
   pdGoOn, pdConcludeWar, decision cards, army summary text, and existing wiring
   in _pdShowTurnInterstitial.
   ========================================================================== */
(function h0BetweenBattleModule() {
  function h0iEsc(v) {
    return (typeof htmlEsc === "function") ? htmlEsc(v)
      : String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function h0iSideName(side) {
    return side === "CS" ? "Confederate" : "Union";
  }

  function h0iMonth(P) {
    try { return _pdMonthName(P.date.month) + " " + P.date.year; } catch (e) { return ""; }
  }

  function h0iNextBattle(C) {
    try {
      if (!C || !C.side || typeof CHAINS === "undefined" || typeof BATTLES === "undefined") return null;
      var chain = CHAINS[C.side] || [];
      var idx = (typeof C.idx === "number") ? C.idx : 0;
      var id = chain[Math.max(0, Math.min(chain.length - 1, idx))];
      for (var i = 0; i < BATTLES.length; i++) if (BATTLES[i] && BATTLES[i].id === id) return BATTLES[i];
    } catch (e) {}
    return null;
  }

  function h0iSceneKey(id) {
    var candidates = [id, "antietam", "gettysburg", "bullrun1"];
    try {
      if (typeof __ASSETS !== "undefined" && __ASSETS) {
        for (var i = 0; i < candidates.length; i++) {
          if (__ASSETS["scenes/" + candidates[i]]) return candidates[i];
        }
      }
    } catch (e) {}
    return "";
  }

  function h0iScene(C) {
    var bd = h0iNextBattle(C);
    var key = h0iSceneKey(bd && bd.id);
    if (!key) return '<div class="h0i-map-fallback" aria-hidden="true"><span></span><span></span><span></span><span></span></div>';
    var src = "";
    try { src = __ASSETS["scenes/" + key] || ""; } catch (e) { src = ""; }
    var meta = (typeof SCENE_IMG !== "undefined" && SCENE_IMG && SCENE_IMG[key]) ? SCENE_IMG[key] : {};
    return '<figure class="h0i-scene">'
      + '<img src="' + src + '" alt="' + h0iEsc(meta.alt || "Civil War battlefield photograph.") + '" loading="eager">'
      + '<figcaption><span>' + h0iEsc(meta.caption || (bd && bd.name) || "The next field") + '</span><b>' + h0iEsc(meta.credit || "Public domain") + '</b></figcaption>'
      + '</figure>';
  }

  function h0iMetric(label, value, tone) {
    return '<div class="h0i-metric h0i-' + (tone || "neutral") + '"><span>' + h0iEsc(label) + '</span><b>' + h0iEsc(value) + '</b></div>';
  }

  function h0iEntityText(v) {
    return h0iEsc(v).replace(/&amp;mdash;/g, "&mdash;");
  }

  function h0iDispatch(P) {
    var rows = "";
    if (P && P.log && P.log.length) {
      var max = Math.min(3, P.log.length);
      for (var i = 0; i < max; i++) rows += '<li>' + h0iEsc(P.log[i]) + '</li>';
    } else {
      rows = '<li>The armies rest, and the work of the war goes on.</li>';
    }
    return '<section class="h0i-panel h0i-dispatch" aria-labelledby="h0iDispatchTitle">'
      + '<div class="h0i-panel-head"><span class="h0i-icon" aria-hidden="true">DS</span><h2 id="h0iDispatchTitle">Latest Dispatch</h2></div>'
      + '<ul>' + rows + '</ul>'
      + '</section>';
  }

  function h0iArmy(C) {
    var summary = (typeof _brgArmySummaryHTML === "function") ? _brgArmySummaryHTML(C) : "";
    return '<section class="h0i-panel h0i-army" aria-labelledby="h0iArmyTitle">'
      + '<div class="h0i-panel-head"><span class="h0i-icon" aria-hidden="true">HQ</span><h2 id="h0iArmyTitle">The army you will field</h2></div>'
      + '<div class="h0i-army-body">' + summary + '</div>'
      + '</section>';
  }

  function h0iDecisions(C) {
    var html = (typeof decInterstitialHTML === "function") ? decInterstitialHTML(C) : "";
    if (!html) return "";
    return '<section class="h0i-panel h0i-decisions" aria-label="Pending decisions">' + html + '</section>';
  }

  function h0iOffer(C) {
    var offer = (typeof aarStrategicEndOffer === "function") ? aarStrategicEndOffer(C) : null;
    if (!offer) return "";
    return '<section class="h0i-panel h0i-offer" aria-labelledby="h0iOfferTitle">'
      + '<div class="h0i-panel-head"><span class="h0i-icon" aria-hidden="true">END</span><h2 id="h0iOfferTitle">The war can be concluded</h2></div>'
      + '<p>' + h0iEntityText(offer.line) + '</p>'
      + '<button id="pdConcludeWar" type="button" class="bigbtn" data-reason="' + h0iEsc(offer.reason) + '">' + h0iEntityText(offer.btn) + '</button>'
      + '</section>';
  }

  function h0iCss() {
    if (typeof document === "undefined" || document.getElementById("h0BetweenBattleCss")) return;
    var s = document.createElement("style");
    s.id = "h0BetweenBattleCss";
    s.textContent = [
      "#overlay .sheet:has(.h0i-shell){width:min(1120px,96vw);background:#080c0d;border-color:#6f8069;border-radius:8px;}",
      "#overlay .sheet:has(.h0i-shell)::before{border-color:rgba(216,180,88,.30);}",
      ".h0i-shell{--h0i-bg:#080c0d;--h0i-panel:#111918;--h0i-ink:#f2eee3;--h0i-muted:#c5cdc3;--h0i-brass:#d8b458;--h0i-blue:#5d86b7;--h0i-red:#b35a50;--h0i-green:#5f9273;--h0i-line:rgba(216,180,88,.27);--h0i-focus:#ffe27a;color:var(--h0i-ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#070a0b 0%,#13201d 48%,#090e11 100%);border:1px solid rgba(216,180,88,.42);border-radius:8px;overflow:hidden;position:relative;box-shadow:0 24px 70px rgba(0,0,0,.58),inset 0 0 0 1px rgba(255,255,255,.05);}",
      ".h0i-shell *{box-sizing:border-box;letter-spacing:0;}",
      ".h0i-shell::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.032) 0,rgba(255,255,255,.032) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(90deg,rgba(216,180,88,.052) 0,rgba(216,180,88,.052) 1px,transparent 1px,transparent 30px);opacity:.48;pointer-events:none;}",
      ".h0i-head,.h0i-grid,.h0i-actions{position:relative;z-index:1;}",
      ".h0i-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:16px;border-bottom:1px solid var(--h0i-line);background:linear-gradient(90deg,rgba(216,180,88,.12),rgba(93,134,183,.08),rgba(0,0,0,.18));}",
      ".h0i-kicker{margin:0 0 4px;color:var(--h0i-brass);font-size:11px;text-transform:uppercase;font-weight:900;}",
      ".h0i-head h1{margin:0;color:#fff8dc;font-size:34px;line-height:1;font-weight:950;}",
      ".h0i-sub{margin:6px 0 0;color:var(--h0i-muted);font-size:13px;line-height:1.4;}",
      ".h0i-chips{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;justify-content:flex-end;}",
      ".h0i-chip,.h0i-metric{min-height:34px;display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid rgba(216,180,88,.28);border-radius:8px;background:rgba(255,255,255,.06);font-size:12px;font-weight:850;}",
      ".h0i-chip b,.h0i-metric span{color:var(--h0i-brass);font-size:10px;text-transform:uppercase;font-weight:900;}",
      ".h0i-stage{position:relative;z-index:1;display:grid;grid-template-columns:minmax(280px,.85fr) minmax(340px,1.15fr);gap:12px;padding:12px;}",
      ".h0i-panel{background:linear-gradient(180deg,rgba(23,35,31,.97),rgba(10,15,17,.97));border:1px solid var(--h0i-line);border-radius:8px;box-shadow:0 14px 28px rgba(0,0,0,.34);min-width:0;}",
      ".h0i-panel-head{display:flex;align-items:center;gap:9px;padding:12px 12px 0;}.h0i-icon{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#44514d;color:#fff;font-size:11px;font-weight:950;border:1px solid rgba(255,255,255,.16);}.h0i-panel-head h2{margin:0;color:#fff3d1;font-size:16px;line-height:1.15;font-weight:950;}",
      ".h0i-scene{position:relative;margin:0;border-radius:8px;overflow:hidden;border:1px solid rgba(216,180,88,.32);background:#050607;min-height:100%;}.h0i-scene img{display:block;width:100%;height:100%;min-height:315px;object-fit:cover;filter:grayscale(.12) contrast(1.18) brightness(.74);}.h0i-scene::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.28) 52%,rgba(0,0,0,.84));pointer-events:none;}.h0i-scene figcaption{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:48px 10px 9px;color:#f4e4c2;font-size:10px;line-height:1.35;background:linear-gradient(180deg,transparent,rgba(0,0,0,.92));}.h0i-scene figcaption b{display:block;margin-top:2px;color:#e2bd6f;font-weight:950;}",
      ".h0i-map-fallback{min-height:315px;border:1px solid rgba(216,180,88,.32);border-radius:8px;background:linear-gradient(135deg,#12191b,#20372e);display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:12px;}.h0i-map-fallback span{border-radius:5px;background:linear-gradient(180deg,rgba(216,180,88,.18),rgba(93,134,183,.15));}",
      ".h0i-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:0 12px 12px;}.h0i-dispatch ul{margin:10px 12px 12px;padding-left:18px;color:var(--h0i-muted);font-size:12px;line-height:1.45;}.h0i-dispatch li+li{margin-top:5px;}",
      ".h0i-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:12px;}.h0i-metric{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;}.h0i-metric b{color:var(--h0i-ink);font-size:14px;line-height:1.12;overflow-wrap:anywhere;}.h0i-field{border-color:rgba(93,134,183,.55);background:rgba(93,134,183,.13);}.h0i-good{border-color:rgba(95,146,115,.5);background:rgba(95,146,115,.13);}",
      ".h0i-army-body{padding:0 12px 12px;}.h0i-army-body>div{max-width:none!important;margin:10px 0 0!important;border-radius:8px!important;background:rgba(255,255,255,.05)!important;}.h0i-army-body div,.h0i-army-body span{letter-spacing:0!important;}",
      /* S02 (D232): the army panel spans the full row like its .h0i-decisions/.h0i-offer siblings (both already
         grid-column 1/-1) — in the common no-decision state it sat stranded in a 2-col grid with the whole
         right half of the frame empty down to the action bar. */
      ".h0i-army{grid-column:1 / -1;}",
      ".h0i-decisions{grid-column:1 / -1;padding:12px;}.h0i-decisions .lede{color:var(--h0i-muted);}.h0i-offer{grid-column:1 / -1;text-align:left;padding-bottom:12px;}.h0i-offer p{margin:10px 12px;color:var(--h0i-muted);font-size:12px;line-height:1.45;}.h0i-offer button{margin:0 12px;}",
      ".h0i-actions{border-top:1px solid var(--h0i-line);padding:11px 12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;background:rgba(0,0,0,.24);}.h0i-actions button{border-radius:8px!important;font-family:inherit!important;min-height:42px!important;white-space:normal!important;}.h0i-actions .h0i-primary{background:linear-gradient(180deg,rgba(95,146,115,.34),rgba(95,146,115,.12))!important;border-color:rgba(95,146,115,.62)!important;color:#fff!important;}.h0i-actions button:focus-visible,.h0i-shell button:focus-visible{outline:3px solid var(--h0i-focus)!important;outline-offset:3px!important;}",
      "@media (max-width:900px){#overlay .sheet:has(.h0i-shell){width:min(820px,96vw);}.h0i-head{grid-template-columns:1fr;}.h0i-chips{justify-content:flex-start;}.h0i-stage,.h0i-grid{grid-template-columns:1fr;}.h0i-scene img,.h0i-map-fallback{min-height:230px;height:230px;}.h0i-actions{grid-template-columns:1fr 1fr;}.h0i-actions #pdGoOn{grid-column:1 / -1;}}",
      "@media (max-width:540px){.sheet .pad{padding:10px;}.h0i-head{padding:13px;}.h0i-head h1{font-size:28px;}.h0i-stage,.h0i-grid{padding:10px;gap:10px;}.h0i-metrics{grid-template-columns:1fr;}.h0i-scene img,.h0i-map-fallback{min-height:178px;height:178px;}.h0i-actions{grid-template-columns:1fr;padding:10px;}}",
      "html[data-a11y-contrast='high'] .h0i-shell,html[data-a11y-contrast='high'] .h0i-panel,html[data-a11y-contrast='high'] .h0i-chip,html[data-a11y-contrast='high'] .h0i-metric{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}html[data-a11y-contrast='high'] .h0i-sub,html[data-a11y-contrast='high'] .h0i-dispatch ul,html[data-a11y-contrast='high'] .h0i-offer p{color:#f2e6c8!important;}"
    ].join("");
    document.head.appendChild(s);
  }

  h0iCss();

  _pdInterstitialHTML = function (C) {
    var P = (C && C.president) ? C.president : null;
    var when = P ? h0iMonth(P) : "";
    var bd = h0iNextBattle(C);
    var sideName = h0iSideName(C && C.side);
    var turn = P ? (P.turn || 0) : 0;
    return '<section class="h0i-shell" role="region" aria-label="Strategic Turn command surface">'
      + '<header class="h0i-head">'
        + '<div><p class="h0i-kicker">Between battles</p><h1>Strategic Turn</h1>'
        + '<p class="h0i-sub">' + h0iEsc(when || "Campaign calendar") + ' &middot; prepare the next field, review the war effort, or press on to Winter Quarters.</p></div>'
        + '<div class="h0i-chips">'
          + '<span class="h0i-chip"><b>Turn</b>' + h0iEsc(turn) + '</span>'
          + '<span class="h0i-chip"><b>Command</b>' + h0iEsc(sideName) + '</span>'
          + '<span class="h0i-chip"><b>Next</b>' + h0iEsc((bd && bd.name) || "The field") + '</span>'
        + '</div>'
      + '</header>'
      + '<div class="h0i-stage">'
        + h0iScene(C)
        + '<div>'
          + '<div class="h0i-metrics">'
            + h0iMetric("Treasury", "$" + h0iEsc((C && C.funds) || 0), "good")
            + h0iMetric("Battles", h0iEsc(((C && C.stats && C.stats.won) || 0) + " / " + ((C && C.stats && C.stats.battles) || 0)), "field")
            + h0iMetric("Next Year", h0iEsc((bd && bd.year) || (P && P.date && P.date.year) || ""), "neutral")
          + '</div>'
          + h0iDispatch(P)
        + '</div>'
      + '</div>'
      + '<div class="h0i-grid">'
        + h0iArmy(C)
        + h0iDecisions(C)
        + h0iOffer(C)
      + '</div>'
      + '<div class="h0i-actions" aria-label="Strategic turn actions">'
        + '<button id="pdGoDesk" type="button" class="upg">Review the War Effort</button>'
        + '<button id="pdGoBrief" type="button" class="upg">Pre-Battle Briefing</button>'
        + '<button id="pdGoOn" type="button" class="bigbtn h0i-primary">Continue</button>'
      + '</div>'
      + '</section>';
  };
})();
