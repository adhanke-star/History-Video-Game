/* ============================================================================
   99-h0-president-desk.js -- H0 prototype slice: President's Desk overview
   ----------------------------------------------------------------------------
   Late-bound shell pass. Keeps the existing Desk tab ids, close path, and
   _wdRefresh dispatch contract, while replacing the overview presentation with
   a modern command-game surface.
   ========================================================================== */
(function h0PresidentDeskModule() {
  var H0_DESK_TABS = [
    ["economy", "War Effort"],
    ["treasury", "Treasury"],
    ["diplomacy", "Diplomacy"],
    ["victory", "Victory Paths"],
    ["warvshistory", "War vs History"],
    ["afteraction", "After-Action"],
    ["codex", "Codex"],
    ["sources", "Documents"],
    ["playstyle", "Play Style"],
    ["armory", "Armory"],
    ["warroom", "War Room"],
    ["clock", "1864 Clock"],
    ["muster", "Muster Roll"],
    ["cabinet", "Cabinet"],
    ["command", "Command"],
    ["camp", "Camp"],
    ["loot", "Campaign Kit"],
    ["decisions", "Decisions"],
    ["press", "Press"],
    ["map", "Map"]
  ];

  function h0DeskEsc(v) {
    return (typeof htmlEsc === "function") ? htmlEsc(v)
      : String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function h0DeskSideName(side) {
    return side === "CS" ? "Confederate" : "Union";
  }

  function h0DeskMonth(P) {
    try { return _pdMonthName(P.date.month) + " " + P.date.year; } catch (e) { return ""; }
  }

  function h0DeskCampaignYear(C) {
    try {
      if (typeof campaignYear === "function") return campaignYear(C || {});
      if (C && C.clock && C.clock.year) return C.clock.year;
      if (C && C.president && C.president.date) return C.president.date.year;
    } catch (e) {}
    return 1861;
  }

  function h0DeskNextBattleId(C) {
    try {
      if (!C || !C.side || typeof CHAINS === "undefined" || !CHAINS[C.side]) return "bullrun1";
      var chain = CHAINS[C.side] || [];
      var idx = (typeof C.idx === "number") ? C.idx : 0;
      if (idx < 0) idx = 0;
      if (idx >= chain.length) idx = Math.max(0, chain.length - 1);
      return chain[idx] || "bullrun1";
    } catch (e) { return "bullrun1"; }
  }

  function h0DeskBattleName(id) {
    try {
      if (typeof BATTLES !== "undefined" && Array.isArray(BATTLES)) {
        for (var i = 0; i < BATTLES.length; i++) {
          if (BATTLES[i] && BATTLES[i].id === id) return BATTLES[i].name || id;
        }
      }
    } catch (e) {}
    return id === "bullrun1" ? "First Bull Run" : "The Field";
  }

  function h0DeskSceneKey(id) {
    var candidates = [id, "gettysburg", "antietam", "bullrun1"];
    try {
      if (typeof __ASSETS !== "undefined" && __ASSETS) {
        for (var i = 0; i < candidates.length; i++) {
          if (__ASSETS["scenes/" + candidates[i]]) return candidates[i];
        }
      }
    } catch (e) {}
    return "";
  }

  function h0DeskSceneHtml(id) {
    var key = h0DeskSceneKey(id);
    if (!key) {
      return '<div class="h0-desk-map-fallback" aria-hidden="true"><span></span><span></span><span></span><span></span></div>';
    }
    var src = "";
    try { src = __ASSETS["scenes/" + key] || ""; } catch (e) { src = ""; }
    var meta = (typeof SCENE_IMG !== "undefined" && SCENE_IMG && SCENE_IMG[key]) ? SCENE_IMG[key] : {};
    var alt = meta.alt || "Civil War battlefield photograph.";
    var caption = meta.caption || h0DeskBattleName(key);
    var credit = meta.credit || "Public domain";
    return '<figure class="h0-desk-scene">'
      + '<img src="' + src + '" alt="' + h0DeskEsc(alt) + '" loading="eager">'
      + '<figcaption><span>' + h0DeskEsc(caption) + '</span><b>' + h0DeskEsc(credit) + '</b></figcaption>'
      + '</figure>';
  }

  function h0DeskNodeLevels(wr) {
    var keys = ["industry", "ordnance", "provisions", "rail", "depot"];
    var n = 0;
    if (!wr || !wr.nodes) return n;
    for (var i = 0; i < keys.length; i++) n += (wr.nodes[keys[i]] || 0);
    return n;
  }

  function h0DeskMetric(label, value, tone) {
    return '<div class="h0-desk-metric h0-metric-' + (tone || "neutral") + '">'
      + '<span>' + h0DeskEsc(label) + '</span><b>' + h0DeskEsc(value) + '</b>'
      + '</div>';
  }

  function h0DeskMeter(label, value, highIsBad) {
    var v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    var tone = highIsBad ? (v > 66 ? "bad" : v > 33 ? "warn" : "good") : (v > 66 ? "good" : v > 33 ? "warn" : "bad");
    return '<div class="h0-desk-meter h0-meter-' + tone + '">'
      + '<div class="h0-meter-label"><span>' + h0DeskEsc(label) + '</span><b>' + v + '</b></div>'
      + '<div class="h0-meter-track" aria-hidden="true"><span style="width:' + v + '%"></span></div>'
      + '</div>';
  }

  function h0DeskStatusLine(C) {
    var clk = C.clock || {}, P = C.president || {};
    var election = clk.resolved1864
      ? (clk.elected ? "1864 mandate held" : "Peace platform ascendant")
      : (clk.year >= 1864 ? "1864 election pending" : "Election not yet at hand");
    var enemyWill = (C.strategy && C.strategy.enemyWill != null) ? Math.round(C.strategy.enemyWill) : "—";
    var next = h0DeskBattleName(h0DeskNextBattleId(C));
    return '<div class="h0-desk-statusline" aria-label="Campaign status">'
      + h0DeskMetric("Strategic Turn", P.turn || 0, "neutral")
      + h0DeskMetric("Next Field", next, "field")
      + h0DeskMetric("Enemy Will", enemyWill, "warn")
      + h0DeskMetric("Home Front", election, "neutral")
      + '</div>';
  }

  function h0DeskDispatches(P) {
    var rows = "";
    if (P && P.log && P.log.length) {
      var max = Math.min(3, P.log.length);
      for (var i = 0; i < max; i++) rows += '<li>' + h0DeskEsc(P.log[i]) + '</li>';
    } else {
      rows = '<li>The armies rest, and the work of the war goes on.</li>';
    }
    return '<section class="h0-desk-panel h0-desk-dispatches" aria-labelledby="h0DeskDispatchTitle">'
      + '<div class="h0-desk-panel-head"><span class="h0-desk-icon" aria-hidden="true">DS</span><h3 id="h0DeskDispatchTitle">Dispatch Board</h3></div>'
      + '<ul>' + rows + '</ul>'
      + '</section>';
  }

  function h0DeskCommandSummary(C) {
    var P = C.president || {}, clk = C.clock || {}, wr = C.warroom || {};
    var head = P.head || {};
    var portrait = "";
    if (typeof window !== "undefined" && typeof window.portraitFor === "function") {
      try {
        portrait = '<img class="h0-desk-portrait" src="' + window.portraitFor(head.name, C.side, { named: true }) + '" alt="' + h0DeskEsc(head.name || "President") + '">';
      } catch (e) {}
    }
    return '<section class="h0-desk-panel h0-desk-command" aria-labelledby="h0DeskCommandTitle">'
      + '<div class="h0-desk-leader">'
        + portrait
        + '<div><p class="h0-desk-kicker">Executive command</p><h2 id="h0DeskCommandTitle">' + h0DeskEsc(head.title || "The President") + '</h2>'
        + '<p>' + h0DeskEsc(head.seat || "") + '</p></div>'
      + '</div>'
      + h0DeskStatusLine(C)
      + '<div class="h0-desk-meter-grid">'
        + h0DeskMeter("War-weariness", clk.weariness, true)
        + h0DeskMeter("Political capital", Math.min(100, clk.capital || 0), false)
        + h0DeskMeter("Foreign pressure", clk.intervention, true)
        + h0DeskMeter("Supply", wr.supply, false)
      + '</div>'
      + '</section>';
  }

  function h0DeskResourceSummary(C) {
    var clk = C.clock || {}, wr = C.warroom || {}, stats = C.stats || {};
    var victories = stats.won || 0;
    var fought = stats.battles || 0;
    var winText = victories + " / " + fought;
    return '<section class="h0-desk-panel h0-desk-resources" aria-labelledby="h0DeskResourceTitle">'
      + '<div class="h0-desk-panel-head"><span class="h0-desk-icon" aria-hidden="true">$</span><h3 id="h0DeskResourceTitle">War Resources</h3></div>'
      + '<div class="h0-desk-resource-grid">'
        + h0DeskMetric("Treasury", "$" + (C.funds || 0), "good")
        + h0DeskMetric("Nodes Built", h0DeskNodeLevels(wr) + " / 25", "neutral")
        + h0DeskMetric("Victories", winText, victories >= Math.max(1, fought / 2) ? "good" : "warn")
        + h0DeskMetric("The Year", clk.year || h0DeskCampaignYear(C), "neutral")
      + '</div>'
      + '</section>';
  }

  function h0DeskShellIntro(C) {
    var P = C.president || {};
    var side = h0DeskSideName(C.side);
    var battleId = h0DeskNextBattleId(C);
    return '<div class="h0-desk-overview-grid">'
      + h0DeskCommandSummary(C)
      + '<section class="h0-desk-panel h0-desk-current-field" aria-labelledby="h0DeskFieldTitle">'
        + '<div class="h0-desk-panel-head"><span class="h0-desk-icon" aria-hidden="true">BT</span><h3 id="h0DeskFieldTitle">Current Field</h3></div>'
        + h0DeskSceneHtml(battleId)
        + '<div class="h0-desk-field-copy"><b>' + h0DeskEsc(h0DeskBattleName(battleId)) + '</b><span>' + h0DeskEsc(side) + ' command · ' + h0DeskEsc(h0DeskMonth(P)) + '</span></div>'
      + '</section>'
      + h0DeskResourceSummary(C)
      + h0DeskDispatches(P)
      + '</div>';
  }

  function h0DeskSystemBlocks(C) {
    return '<section class="h0-desk-systems" aria-label="War Effort systems">'
      + (typeof presProdBlock === "function" ? presProdBlock(C) : "")
      + (typeof presLogisticsBlock === "function" ? presLogisticsBlock(C) : "")
      + (typeof presPrisonerExchangeBlock === "function" ? presPrisonerExchangeBlock(C) : "")
      + (typeof presMedicalBlock === "function" ? presMedicalBlock(C) : "")
      + (typeof presHardWarBlock === "function" ? presHardWarBlock(C) : "")
      + (typeof presIrregularWarBlock === "function" ? presIrregularWarBlock(C) : "")
      + (typeof presUnderToldBlock === "function" ? presUnderToldBlock(C) : "")
      + (typeof presFlagshipUnitsBlock === "function" ? presFlagshipUnitsBlock(C) : "")
      + (typeof presCsFinanceBlock === "function" ? presCsFinanceBlock(C) : "")
      + (typeof presRealDiplomacyBlock === "function" ? presRealDiplomacyBlock(C) : "")
      + (typeof presManpowerBlock === "function" ? presManpowerBlock(C) : "")
      + (typeof presMoraleBlock === "function" ? presMoraleBlock(C) : "")
      + '</section>';
  }

  function h0DeskInjectCss() {
    if (typeof document === "undefined" || document.getElementById("h0PresidentDeskCss")) return;
    var s = document.createElement("style");
    s.id = "h0PresidentDeskCss";
    s.textContent = [
      "#overlay .sheet:has(.h0-desk-shell){width:min(1220px,96vw);background:#080c0e;border-color:#667c70;border-radius:8px;}",
      "#overlay .sheet:has(.h0-desk-shell)::before{border-color:rgba(216,180,88,.30);}",
      ".h0-desk-shell{--h0d-bg:#080c0e;--h0d-panel:#111918;--h0d-panel2:#17231f;--h0d-ink:#f3efe4;--h0d-muted:#bac5bd;--h0d-brass:#d8b458;--h0d-blue:#5d86b7;--h0d-red:#b35a50;--h0d-green:#5f9273;--h0d-warn:#d0a047;--h0d-line:rgba(216,180,88,.27);--h0d-focus:#ffe27a;color:var(--h0d-ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#070a0b 0%,#13201d 44%,#090e11 100%);border:1px solid rgba(216,180,88,.42);border-radius:8px;overflow:hidden;position:relative;box-shadow:0 24px 70px rgba(0,0,0,.58),inset 0 0 0 1px rgba(255,255,255,.05);}",
      ".h0-desk-shell *{box-sizing:border-box;letter-spacing:0;}",
      ".h0-desk-shell::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0,rgba(255,255,255,.03) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(90deg,rgba(216,180,88,.05) 0,rgba(216,180,88,.05) 1px,transparent 1px,transparent 30px);opacity:.48;pointer-events:none;}",
      ".h0-desk-header,.h0-desk-tabs-wrap,.h0-desk-body,.h0-desk-footer{position:relative;z-index:1;}",
      ".h0-desk-header{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:16px;border-bottom:1px solid var(--h0d-line);background:linear-gradient(90deg,rgba(216,180,88,.11),rgba(93,134,183,.08),rgba(0,0,0,.16));}",
      ".h0-desk-kicker{margin:0 0 4px;color:var(--h0d-brass);font-size:11px;text-transform:uppercase;font-weight:900;}",
      ".h0-desk-header h1{margin:0;color:#fff8dc;font-size:34px;line-height:1;font-weight:950;}",
      ".h0-desk-sub{margin:6px 0 0;color:var(--h0d-muted);font-size:13px;line-height:1.4;}",
      ".h0-desk-header-actions{display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap;justify-content:flex-end;}",
      ".h0-desk-chip{display:inline-flex;min-height:34px;align-items:center;gap:7px;padding:7px 10px;border-radius:8px;border:1px solid rgba(216,180,88,.28);background:rgba(255,255,255,.06);color:var(--h0d-ink);font-size:12px;font-weight:850;}",
      ".h0-desk-chip b{color:var(--h0d-brass);font-size:10px;text-transform:uppercase;}",
      ".h0-desk-tabs-wrap{padding:10px 14px 0;}",
      ".h0-desk-shell #wdTabs{display:flex;gap:6px;justify-content:flex-start;align-items:center;flex-wrap:wrap;margin:0;padding:2px 2px 12px;}",
      ".h0-desk-shell #wdTabs .upg,.h0-desk-shell #wdTabs button{flex:0 0 auto;border:1px solid rgba(216,180,88,.24)!important;border-radius:8px!important;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035))!important;color:var(--h0d-ink)!important;box-shadow:0 7px 16px rgba(0,0,0,.22);font-family:inherit!important;font-size:12px!important;line-height:1.15!important;min-height:36px;padding:8px 10px!important;}",
      ".h0-desk-shell #wdTabs button[aria-pressed='true']{border-color:var(--h0d-brass)!important;background:linear-gradient(180deg,rgba(216,180,88,.28),rgba(216,180,88,.08))!important;box-shadow:0 0 0 1px rgba(216,180,88,.24),0 10px 20px rgba(0,0,0,.25);}",
      ".h0-desk-shell #wdTabs button:focus,.h0-desk-shell #wdTabs button:focus-visible,.h0-desk-shell #wdClose:focus,.h0-desk-shell #wdClose:focus-visible,.h0-desk-shell button:focus-visible{outline:3px solid var(--h0d-focus)!important;outline-offset:3px!important;}",
      ".h0-desk-body{padding:0 14px 14px;}",
      ".h0-desk-overview-grid{display:grid;grid-template-columns:minmax(320px,1.25fr) minmax(270px,.9fr);gap:12px;}",
      ".h0-desk-panel{background:linear-gradient(180deg,rgba(23,35,31,.97),rgba(10,15,17,.97));border:1px solid var(--h0d-line);border-radius:8px;box-shadow:0 14px 28px rgba(0,0,0,.34);min-width:0;}",
      ".h0-desk-command{padding:14px;}",
      ".h0-desk-leader{display:flex;gap:12px;align-items:center;margin-bottom:10px;}",
      ".h0-desk-portrait{width:72px;height:72px;object-fit:cover;border:2px solid rgba(216,180,88,.55);border-radius:8px;flex:0 0 auto;background:#050607;}",
      ".h0-desk-leader h2{margin:0;color:#fff8dc;font-size:22px;line-height:1.08;font-weight:950;}",
      ".h0-desk-leader p{margin:4px 0 0;color:var(--h0d-muted);font-size:12px;}",
      ".h0-desk-statusline{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 12px;}",
      ".h0-desk-metric{min-height:48px;border:1px solid rgba(216,180,88,.22);border-radius:8px;padding:8px 9px;background:rgba(255,255,255,.055);display:flex;flex-direction:column;justify-content:center;gap:2px;}",
      ".h0-desk-metric span{color:var(--h0d-muted);font-size:10px;text-transform:uppercase;font-weight:900;}",
      ".h0-desk-metric b{color:var(--h0d-ink);font-size:14px;line-height:1.12;overflow-wrap:anywhere;}",
      ".h0-metric-good{border-color:rgba(95,146,115,.5);background:rgba(95,146,115,.13);}.h0-metric-warn{border-color:rgba(208,160,71,.5);background:rgba(208,160,71,.13);}.h0-metric-field{border-color:rgba(93,134,183,.55);background:rgba(93,134,183,.13);}",
      ".h0-desk-meter-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}",
      ".h0-meter-label{display:flex;justify-content:space-between;gap:8px;color:var(--h0d-muted);font-size:12px;font-weight:800;}",
      ".h0-meter-label b{color:var(--h0d-ink);}",
      ".h0-meter-track{height:9px;margin-top:5px;background:rgba(0,0,0,.34);border:1px solid rgba(216,180,88,.25);border-radius:999px;overflow:hidden;}",
      ".h0-meter-track span{display:block;height:100%;border-radius:999px;background:var(--h0d-green);}.h0-meter-warn .h0-meter-track span{background:var(--h0d-warn);}.h0-meter-bad .h0-meter-track span{background:var(--h0d-red);}",
      ".h0-desk-panel-head{display:flex;align-items:center;gap:9px;padding:12px 12px 0;}",
      ".h0-desk-icon{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#44514d;color:#fff;font-size:11px;font-weight:950;border:1px solid rgba(255,255,255,.16);}",
      ".h0-desk-panel-head h3{margin:0;color:#fff3d1;font-size:15px;line-height:1.15;font-weight:950;}",
      ".h0-desk-scene{position:relative;margin:11px 12px 10px;border-radius:8px;overflow:hidden;border:1px solid rgba(216,180,88,.32);background:#050607;}",
      ".h0-desk-scene img{display:block;width:100%;height:180px;object-fit:cover;filter:grayscale(.12) contrast(1.18) brightness(.74);}",
      ".h0-desk-scene::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.28) 52%,rgba(0,0,0,.84));pointer-events:none;}",
      ".h0-desk-scene figcaption{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:42px 10px 8px;color:#f4e4c2;font-size:10px;line-height:1.35;background:linear-gradient(180deg,transparent,rgba(0,0,0,.92));}",
      ".h0-desk-scene figcaption b{display:block;margin-top:2px;color:#e2bd6f;font-weight:950;}",
      ".h0-desk-map-fallback{height:180px;margin:11px 12px 10px;border:1px solid rgba(216,180,88,.32);border-radius:8px;background:linear-gradient(135deg,#12191b,#20372e);display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:12px;}",
      ".h0-desk-map-fallback span{border-radius:5px;background:linear-gradient(180deg,rgba(216,180,88,.18),rgba(93,134,183,.15));}",
      ".h0-desk-field-copy{display:flex;justify-content:space-between;gap:8px;align-items:flex-end;padding:0 12px 12px;color:var(--h0d-muted);font-size:12px;}",
      ".h0-desk-field-copy b{color:var(--h0d-ink);font-size:15px;}.h0-desk-field-copy span{text-align:right;line-height:1.3;}",
      ".h0-desk-resources,.h0-desk-dispatches{padding-bottom:12px;}",
      ".h0-desk-resource-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:11px 12px 0;}",
      ".h0-desk-dispatches ul{margin:10px 12px 0;padding:0 0 0 18px;color:var(--h0d-muted);font-size:12px;line-height:1.45;}",
      ".h0-desk-dispatches li+li{margin-top:5px;}",
      ".h0-desk-systems{display:grid;gap:12px;margin-top:12px;}",
      ".h0-desk-systems .lede,.h0-desk-systems p,.h0-desk-systems div{letter-spacing:0;}",
      ".h0-desk-footer{border-top:1px solid var(--h0d-line);padding:11px 14px;display:flex;justify-content:flex-end;background:rgba(0,0,0,.24);}",
      ".h0-desk-shell #wdClose{border-radius:8px!important;background:linear-gradient(180deg,rgba(216,180,88,.24),rgba(216,180,88,.08))!important;color:#fff5d8!important;border:1px solid rgba(216,180,88,.5)!important;font-family:inherit!important;}",
      "@media (max-width:920px){#overlay .sheet:has(.h0-desk-shell){width:min(820px,96vw);}.h0-desk-header{grid-template-columns:1fr;}.h0-desk-header-actions{justify-content:flex-start;}.h0-desk-overview-grid{grid-template-columns:1fr;}.h0-desk-statusline{grid-template-columns:repeat(2,minmax(0,1fr));}.h0-desk-scene img,.h0-desk-map-fallback{height:210px;}}",
      "@media (max-width:540px){.sheet .pad{padding:10px;}.h0-desk-header{padding:13px;}.h0-desk-header h1{font-size:28px;}.h0-desk-sub{font-size:12px;}.h0-desk-body{padding:0 10px 10px;}.h0-desk-tabs-wrap{padding:9px 10px 0;}.h0-desk-statusline,.h0-desk-meter-grid,.h0-desk-resource-grid{grid-template-columns:1fr;}.h0-desk-leader{align-items:flex-start;}.h0-desk-portrait{width:58px;height:58px;}.h0-desk-field-copy{display:block;}.h0-desk-field-copy span{text-align:left;display:block;margin-top:3px;}.h0-desk-scene img,.h0-desk-map-fallback{height:168px;}}",
      "html[data-a11y-contrast='high'] .h0-desk-shell,html[data-a11y-contrast='high'] .h0-desk-panel,html[data-a11y-contrast='high'] .h0-desk-shell #wdTabs button,html[data-a11y-contrast='high'] .h0-desk-metric{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}",
      "html[data-a11y-contrast='high'] .h0-desk-sub,html[data-a11y-contrast='high'] .h0-desk-leader p,html[data-a11y-contrast='high'] .h0-desk-dispatches ul{color:#f2e6c8!important;}"
    ].join("");
    document.head.appendChild(s);
  }

  function h0DeskTabsHtml() {
    var out = "";
    for (var i = 0; i < H0_DESK_TABS.length; i++) out += _wdTabBtn(H0_DESK_TABS[i][0], H0_DESK_TABS[i][1]);
    return out;
  }

  function h0DeskWireTabs() {
    for (var i = 0; i < H0_DESK_TABS.length; i++) {
      (function (k) {
        var b = document.getElementById("wdTab_" + k);
        if (b) b.addEventListener("click", function () { _wdTab = k; _wdRefresh(); });
      })(H0_DESK_TABS[i][0]);
    }
  }

  h0DeskInjectCss();

  presRenderEconomy = function (C) {
    if (!C) return "";
    if (typeof presInit === "function") presInit(C);
    return h0DeskShellIntro(C) + h0DeskSystemBlocks(C)
      + '<p class="h0-desk-sub" style="margin:12px 2px 0">This overview stages the war for play: quick command state first, expandable system detail below, and broadsheet treatments reserved for press, dispatch, and provenance surfaces.</p>';
  };

  openWarDept = function () {
    var C = G.campaign;
    if (!C && typeof loadLocal === "function") {
      var sv = loadLocal();
      if (sv && sv.campaign && typeof applySave === "function") { applySave(sv); C = G.campaign; }
    }
    if (!C) { if (typeof toast === "function") toast("No active campaign."); return; }
    if (typeof _t1InitAll === "function") _t1InitAll(C);
    if (typeof presInit === "function") presInit(C);
    C.president.onboarded = true;
    _wdTab = (typeof psDefaultDeskTab === "function") ? psDefaultDeskTab() : "economy";

    var P = C.president || {};
    var head = P.head || {};
    var dateLine = h0DeskMonth(P);
    var html = '<section class="h0-desk-shell" role="region" aria-label="President\'s Desk command center">'
      + '<header class="h0-desk-header">'
        + '<div><p class="h0-desk-kicker">President\'s command center</p><h1>The President\'s Desk</h1>'
        + '<p class="h0-desk-sub">' + h0DeskEsc(head.title || "The President") + (head.seat ? ' · ' + h0DeskEsc(head.seat) : '') + '</p></div>'
        + '<div class="h0-desk-header-actions">'
          + '<span class="h0-desk-chip"><b>Side</b>' + h0DeskEsc(h0DeskSideName(C.side)) + '</span>'
          + '<span class="h0-desk-chip"><b>Date</b>' + h0DeskEsc(dateLine) + '</span>'
          + '<span class="h0-desk-chip"><b>Year</b>' + h0DeskEsc(h0DeskCampaignYear(C)) + '</span>'
        + '</div>'
      + '</header>'
      + '<nav class="h0-desk-tabs-wrap" aria-label="President\'s Desk sections"><div id="wdTabs" role="group" aria-label="President\'s Desk sections">' + h0DeskTabsHtml() + '</div></nav>'
      + '<main class="h0-desk-body"><div id="wdContent"></div></main>'
      + '<footer class="h0-desk-footer"><button id="wdClose" type="button" class="bigbtn">Close</button></footer>'
      + '</section>';

    if (typeof openSheet === "function") openSheet(html);
    _wdRefresh();
    var cl = document.getElementById("wdClose");
    if (cl) cl.addEventListener("click", function () {
      if (_pdAfterDeskClose) { var cb = _pdAfterDeskClose; _pdAfterDeskClose = null; cb(); }
      else if (typeof closeSheet === "function") closeSheet();
    });
    h0DeskWireTabs();
  };
})();
