/* ============================================================================
   98-h0-main-menu.js -- H0 prototype slice: historical command-game main menu
   ----------------------------------------------------------------------------
   Assignment override only: build/base.html already declares openMainMenu twice
   inside the frozen snapshot, so this module replaces the winning binding by
   assignment instead of adding a third function declaration.

   Scope: visual/interaction shell for the main menu only. Preserves every live
   button id and click path used by the existing menu and injection observers.
   ========================================================================== */
(function h0MainMenuModule() {
  var h0InjectedObserver = null;

  function h0Esc(v) {
    return (typeof htmlEsc === "function") ? htmlEsc(v)
      : String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function h0HasReducedMotion() {
    try {
      return !!(G && G.settings && G.settings.reduceMotion);
    } catch (e) { return false; }
  }

  function h0CampaignSave() {
    try {
      var sv = (typeof loadLocal === "function") ? loadLocal() : null;
      return (sv && sv.campaign) ? sv.campaign : null;
    } catch (e) { return null; }
  }

  function h0SideLabel(side) {
    return side === "CS" ? "Confederate" : "Union";
  }

  function h0NextBattleId(C) {
    try {
      if (!C || !C.side || typeof CHAINS === "undefined" || !CHAINS[C.side]) return "bullrun1";
      var chain = CHAINS[C.side] || [];
      var idx = (typeof C.idx === "number") ? C.idx : 0;
      if (idx < 0) idx = 0;
      if (idx >= chain.length) idx = chain.length - 1;
      return chain[idx] || "bullrun1";
    } catch (e) { return "bullrun1"; }
  }

  function h0BattleName(id) {
    try {
      if (typeof BATTLES !== "undefined" && Array.isArray(BATTLES)) {
        for (var i = 0; i < BATTLES.length; i++) {
          if (BATTLES[i] && BATTLES[i].id === id) return BATTLES[i].name || id;
        }
      }
    } catch (e) {}
    return id === "bullrun1" ? "First Bull Run" : "The Field";
  }

  function h0SceneKey(id) {
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

  function h0SceneHtml(id) {
    var key = h0SceneKey(id);
    if (!key) {
      return '<div class="h0-hero-fallback" aria-hidden="true"><span></span><span></span><span></span></div>';
    }
    var src = "";
    try { src = __ASSETS["scenes/" + key] || ""; } catch (e) { src = ""; }
    var meta = (typeof SCENE_IMG !== "undefined" && SCENE_IMG && SCENE_IMG[key]) ? SCENE_IMG[key] : {};
    var alt = meta.alt || "A wartime photograph connected to the Civil War battlefield.";
    var caption = meta.caption || h0BattleName(key);
    var credit = meta.credit || "Public domain";
    return '<figure class="h0-hero-figure">'
      + '<img class="h0-hero-img" src="' + src + '" alt="' + h0Esc(alt) + '" loading="eager">'
      + '<figcaption><span>' + h0Esc(caption) + '</span><b>' + h0Esc(credit) + '</b></figcaption>'
      + '</figure>';
  }

  function h0Chip(label, value, cls) {
    return '<span class="h0-chip ' + (cls || "") + '"><b>' + h0Esc(label) + '</b><span>' + h0Esc(value) + '</span></span>';
  }

  function h0Action(id, tone, icon, title, deck, aria) {
    return '<button type="button" class="gn-btn h0-card h0-' + tone + '" id="' + id + '" aria-label="' + h0Esc(aria || title) + '">'
      + '<span class="h0-card-icon" aria-hidden="true">' + icon + '</span>'
      + '<span class="h0-card-copy"><span class="gn-hl">' + h0Esc(title) + '</span>'
      + '<span class="gn-deck">' + h0Esc(deck) + '</span></span>'
      + '</button>';
  }

  function h0InjectedButtonSpec(btn) {
    var id = btn && btn.id ? btn.id : "";
    if (id === "fldSandboxBtn") return ["RT", "field"];
    if (id === "fldSkirmishBtn") return ["SK", "field"];
    if (id === "fldPresetBtn") return ["AI", "neutral"];
    if (id === "fldCustomBuilderBtn") return ["CB", "field"];
    if (id === "gnPlayStyle") return ["PX", "neutral"];
    if (id === "gnA11y") return ["AX", "neutral"];
    if (id === "gnHelp") return ["?", "neutral"];
    if (id === "gnTour") return ["TO", "neutral"];
    if (id === "fldBullRunBtn" || id.indexOf("fldScnBtn_") === 0) return ["BT", "field"];
    return ["OP", "neutral"];
  }

  function h0CleanInjectedTitle(text) {
    return String(text || "")
      .replace(/^[\s\u2694\u2699\u2605\u267f\u267f\u25cf\u25cb\u25c9\u2328]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function h0NormalizeInjectedButtons() {
    if (typeof document === "undefined") return;
    var menu = document.querySelector(".h0-menu");
    if (!menu) return;
    var buttons = menu.querySelectorAll(".gn-btn:not(.h0-card)");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (!btn || btn.getAttribute("data-h0-normalized") === "1") continue;
      var titleNode = btn.querySelector(".gn-hl");
      var deckNode = btn.querySelector(".gn-deck");
      if (!titleNode || !deckNode) continue;
      var spec = h0InjectedButtonSpec(btn);
      var title = h0CleanInjectedTitle(titleNode.textContent);
      var deckHtml = deckNode.innerHTML;
      btn.setAttribute("data-h0-normalized", "1");
      btn.className += " h0-injected h0-inj-" + spec[1];
      btn.innerHTML = '<span class="h0-card-icon h0-injected-icon" aria-hidden="true">' + h0Esc(spec[0]) + '</span>'
        + '<span class="h0-card-copy"><span class="gn-hl">' + h0Esc(title) + '</span>'
        + '<span class="gn-deck">' + deckHtml + '</span></span>';
    }
  }

  function h0InstallInjectedPolisher() {
    if (typeof document === "undefined") return;
    if (h0InjectedObserver && h0InjectedObserver.disconnect) {
      try { h0InjectedObserver.disconnect(); } catch (e) {}
    }
    h0InjectedObserver = null;
    h0NormalizeInjectedButtons();
    var menu = document.querySelector(".h0-menu");
    if (menu && typeof MutationObserver !== "undefined") {
      h0InjectedObserver = new MutationObserver(function () { h0NormalizeInjectedButtons(); });
      h0InjectedObserver.observe(menu, { childList: true, subtree: true });
    }
    setTimeout(h0NormalizeInjectedButtons, 0);
    setTimeout(h0NormalizeInjectedButtons, 90);
  }

  function h0InjectCss() {
    if (typeof document === "undefined" || document.getElementById("h0MainMenuCss")) return;
    var s = document.createElement("style");
    s.id = "h0MainMenuCss";
    s.textContent = [
      "#overlay .sheet:has(.h0-menu){width:min(1180px,96vw);background:#090d0e;border-color:#6d7f67;border-radius:8px;}",
      "#overlay .sheet:has(.h0-menu)::before{border-color:rgba(216,180,88,.28);}",
      ".h0-menu{",
      "  --h0-bg:#090d0e;--h0-panel:#131a19;--h0-panel2:#18231f;--h0-ink:#f2eee3;--h0-muted:#b8c3bc;",
      "  --h0-brass:#d8b458;--h0-amber:#c7863a;--h0-green:#4f8064;--h0-blue:#5d86b7;",
      "  --h0-red:#aa5148;--h0-line:rgba(216,180,88,.28);--h0-focus:#ffe27a;",
      "  color:var(--h0-ink);background:linear-gradient(135deg,#080b0c 0%,#14201d 46%,#0c1112 100%);",
      "  border:1px solid rgba(216,180,88,.42);border-radius:8px;overflow:hidden;position:relative;",
      "  box-shadow:0 24px 70px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.05);",
      "  font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;",
      "}",
      ".h0-menu *{box-sizing:border-box;letter-spacing:0;}",
      ".h0-menu::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0,rgba(255,255,255,.035) 1px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,rgba(216,180,88,.055) 0,rgba(216,180,88,.055) 1px,transparent 1px,transparent 28px);opacity:.45;pointer-events:none;}",
      ".h0-menu::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(216,180,88,.12),transparent 28%,rgba(93,134,183,.12) 64%,rgba(170,81,72,.12));pointer-events:none;}",
      ".h0-top{position:relative;z-index:1;display:grid;grid-template-columns:minmax(245px,.9fr) minmax(330px,1.45fr) minmax(245px,.9fr);gap:12px;padding:12px;}",
      ".h0-panel{background:linear-gradient(180deg,rgba(24,35,31,.96),rgba(12,17,18,.96));border:1px solid var(--h0-line);border-radius:8px;box-shadow:0 16px 34px rgba(0,0,0,.36);}",
      ".h0-command{padding:16px;display:flex;flex-direction:column;gap:12px;border-left:4px solid var(--h0-green);}",
      ".h0-kicker{font-size:11px;text-transform:uppercase;color:var(--h0-brass);font-weight:800;margin:0;}",
      ".h0-title{font-size:36px;line-height:.98;margin:0;color:#fff8df;font-weight:900;}",
      ".h0-sub{font-size:13px;line-height:1.45;color:var(--h0-muted);margin:0;}",
      ".h0-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:2px;}",
      ".h0-chip{min-height:46px;display:flex;flex-direction:column;justify-content:center;border:1px solid rgba(216,180,88,.22);border-radius:8px;padding:7px 9px;background:rgba(255,255,255,.055);color:var(--h0-ink);}",
      ".h0-chip b{font-size:10px;text-transform:uppercase;color:var(--h0-muted);font-weight:800;}",
      ".h0-chip span{font-size:13px;font-weight:850;white-space:normal;}",
      ".h0-chip.h0-alert{background:rgba(170,81,72,.18);border-color:rgba(170,81,72,.5);}",
      ".h0-actions{display:grid;gap:9px;margin-top:2px;}",
      ".h0-stage{padding:0;display:flex;flex-direction:column;min-height:514px;background:#080a0a;color:#f7eddc;border-color:rgba(93,134,183,.36);}",
      ".h0-stage-head{padding:13px 14px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}",
      ".h0-stage-head h2{font-size:17px;margin:0;color:#fff4d4;line-height:1.2;font-weight:900;}",
      ".h0-stage-head span{font-size:11px;color:#cfd7cd;text-align:right;line-height:1.35;}",
      ".h0-hero-figure{margin:12px 14px 10px;position:relative;border-radius:8px;overflow:hidden;border:1px solid rgba(216,180,88,.3);background:#080706;}",
      ".h0-hero-img{display:block;width:100%;height:284px;object-fit:cover;filter:grayscale(.15) contrast(1.18) brightness(.72);}",
      ".h0-hero-figure::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.24) 50%,rgba(0,0,0,.78));pointer-events:none;}",
      ".h0-hero-figure figcaption{position:absolute;left:0;right:0;bottom:0;z-index:1;font-size:11px;line-height:1.4;color:#f4e4c2;background:linear-gradient(180deg,transparent,rgba(0,0,0,.92));padding:48px 10px 9px;}",
      ".h0-hero-figure figcaption b{display:block;margin-top:3px;color:#e2bd6f;font-size:10px;font-weight:900;}",
      ".h0-hero-fallback{height:284px;margin:12px 14px 10px;border-radius:8px;border:1px solid rgba(216,180,88,.3);background:linear-gradient(135deg,#121719,#20382e);display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;padding:16px;}",
      ".h0-hero-fallback span{display:block;border-radius:4px;background:linear-gradient(180deg,rgba(216,180,88,.18),rgba(93,134,183,.15));}",
      ".h0-stage .gn-btn{width:auto;margin-left:14px;margin-right:14px;margin-bottom:12px;}",
      ".h0-notices{padding:13px;display:flex;flex-direction:column;gap:10px;border-right:4px solid var(--h0-amber);}",
      ".h0-notices-title{font-size:12px;text-transform:uppercase;font-weight:900;color:var(--h0-brass);margin:0;}",
      ".h0-notices .gn-classifieds{display:grid;gap:8px;margin:0;border:0;padding:0;background:transparent;}",
      ".h0-menu .gn-col{border:0;padding:0;}",
      ".h0-menu .gn-btn{min-height:48px;width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid rgba(216,180,88,.24);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));color:var(--h0-ink);padding:10px;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(0,0,0,.22);transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease,background .12s ease;}",
      ".h0-menu .h0-stage .gn-btn{width:auto;}",
      ".h0-menu .gn-btn:hover{transform:translateY(-1px);border-color:var(--h0-brass);box-shadow:0 12px 24px rgba(0,0,0,.34);background:linear-gradient(180deg,rgba(216,180,88,.18),rgba(255,255,255,.06));}",
      ".h0-menu .gn-btn:focus,.h0-menu .gn-btn:focus-visible{outline:3px solid var(--h0-focus);outline-offset:3px;}",
      ".h0-menu .gn-btn:hover .gn-hl,.h0-menu .gn-btn:focus .gn-hl,.h0-menu .gn-btn:focus-visible .gn-hl{color:#fff7df;text-decoration:none;}",
      ".h0-menu .gn-hl{display:block;font-size:14px;line-height:1.22;font-weight:900;color:inherit;text-transform:none;margin:0;}",
      ".h0-menu .gn-deck,.h0-menu .gn-advert-body{display:block;font-size:11px;line-height:1.4;color:var(--h0-muted);margin-top:3px;font-style:normal;}",
      ".h0-card-icon{width:34px;height:34px;min-width:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:900;border:1px solid rgba(255,255,255,.18);}",
      ".h0-union .h0-card-icon{background:var(--h0-blue);}.h0-confed .h0-card-icon{background:var(--h0-red);}.h0-primary .h0-card-icon{background:var(--h0-green);}.h0-field .h0-card-icon{background:var(--h0-amber);}.h0-neutral .h0-card-icon{background:#59615d;}",
      ".h0-menu .h0-injected-icon{font-size:11px;letter-spacing:0;color:#fff;background:#46524f;}",
      ".h0-menu .h0-inj-field .h0-injected-icon{background:var(--h0-amber);}",
      ".h0-menu .h0-inj-neutral .h0-injected-icon{background:#59615d;}",
      ".h0-stage .h0-field{background:linear-gradient(180deg,rgba(199,134,58,.28),rgba(216,180,88,.1));color:#fff7df;border-color:rgba(216,180,88,.58);}",
      ".h0-stage .h0-field .gn-deck{color:#e6d6b7;}",
      ".h0-footer{position:relative;z-index:1;border-top:1px solid rgba(216,180,88,.24);padding:10px 14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;color:#d6ded5;background:rgba(0,0,0,.28);font-size:11px;line-height:1.35;}",
      ".h0-footer b{color:#ffe2a0;}",
      ".h0-menu.is-reduced-motion .gn-btn,.h0-menu.is-reduced-motion *{transition:none!important;animation:none!important;}",
      "@media (prefers-reduced-motion: reduce){.h0-menu .gn-btn,.h0-menu *{transition:none!important;animation:none!important;}}",
      "@media (max-width:900px){#overlay .sheet:has(.h0-menu){width:min(760px,96vw);}.h0-top{grid-template-columns:1fr;}.h0-stage{min-height:0;}.h0-chips{grid-template-columns:repeat(3,minmax(0,1fr));}.h0-hero-img,.h0-hero-fallback{height:228px;}.h0-stage .gn-btn{margin-bottom:14px;}}",
      "@media (max-width:520px){.sheet .pad{padding:10px;}.h0-top{padding:10px;gap:10px;}.h0-command,.h0-notices{padding:12px;}.h0-title{font-size:29px;}.h0-sub{font-size:12px;}.h0-chips{grid-template-columns:1fr;}.h0-hero-img,.h0-hero-fallback{height:182px;}.h0-menu .gn-btn{padding:9px;}.h0-card-icon{width:30px;height:30px;min-width:30px;font-size:15px;}.h0-footer{font-size:10px;}}",
      "html[data-a11y-contrast=\"high\"] .h0-menu{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}",
      "html[data-a11y-contrast=\"high\"] .h0-panel,html[data-a11y-contrast=\"high\"] .h0-menu .gn-btn,html[data-a11y-contrast=\"high\"] .h0-chip{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}",
      "html[data-a11y-contrast=\"high\"] .h0-menu .gn-deck,html[data-a11y-contrast=\"high\"] .h0-sub{color:#f2e6c8!important;}"
    ].join("");
    document.head.appendChild(s);
  }

  function h0BuildMenuHtml(C, hasCampaignSave) {
    var side = (C && C.side === "CS") ? "CS" : "US";
    var battleId = h0NextBattleId(C);
    var battleName = h0BattleName(battleId);
    var year = (typeof _gorDatelineYear === "function") ? _gorDatelineYear() : String(campaignYear(C || {}));
    var actionHtml = "";
    if (hasCampaignSave) {
      actionHtml += h0Action("gnContinue", "primary", "&#9654;", "Continue Campaign",
        "Resume the current " + h0SideLabel(side) + " war at the next decision point.",
        "Continue Campaign - resume where you left off");
      actionHtml += h0Action("gnWarDept", "primary", "&#9874;", "President's Desk",
        "Open the command hub: resources, cabinet, War Effort, decisions, and campaign state.",
        "War Department - open the President's Desk");
    }
    actionHtml += h0Action("gnNewUS", "union", "US", "Muster the Union",
      "Lead the Federal war effort through strategy, politics, logistics, and the field.",
      "New Campaign - Union. Lead the Federal armies.");
    actionHtml += h0Action("gnNewCS", "confed", "CS", "Command the Confederacy",
      "Play the rebellion's government honestly, with slavery and war aims taught plainly.",
      "New Campaign - Confederate. Play the Confederate government.");

    return '<div class="h0-menu' + (h0HasReducedMotion() ? ' is-reduced-motion' : '') + '" role="region" aria-label="The Civil War main menu">'
      + '<div class="h0-top">'
        + '<section class="gn-col h0-panel h0-command" aria-labelledby="h0Title">'
          + '<p class="h0-kicker">Operational command interface</p>'
          + '<h1 id="h0Title" class="h0-title">The Civil War</h1>'
          + '<p class="h0-sub">Run the war from the desk, choose your next battlefield, and carry decisions into real-time command. Sourced history stays visible without making the shell a newspaper.</p>'
          + '<div class="h0-chips" aria-label="Campaign status">'
            + h0Chip("Season", year, "")
            + h0Chip("Side", hasCampaignSave ? h0SideLabel(side) : "Choose", "")
            + h0Chip("Next Field", battleName, "h0-alert")
          + '</div>'
          + '<div class="h0-actions">' + actionHtml + '</div>'
        + '</section>'
        + '<section class="gn-col h0-panel h0-stage" aria-labelledby="h0FieldTitle">'
          + '<div class="h0-stage-head"><h2 id="h0FieldTitle">Current Field</h2><span>' + h0Esc(battleName) + '<br>campaign season ' + h0Esc(year) + '</span></div>'
          + h0SceneHtml(battleId)
          + h0Action("gnFree", "field", "BT", "Choose a Battle",
            "Fight a standalone historical engagement, use the sandbox, or launch custom tactical tools.",
            "Free Battle - choose any engagement or tactical mode")
        + '</section>'
        + '<aside class="gn-col h0-panel h0-notices" aria-labelledby="h0NoticesTitle">'
          + '<p id="h0NoticesTitle" class="h0-notices-title">Command Settings</p>'
          + '<div class="gn-classifieds">'
            + h0Action("gnSettings", "neutral", "&#9881;", "Settings",
              "Difficulty, map style, sound, music, motion, and core display controls.",
              "Settings - difficulty, map style, sound, and display")
            + h0Action("gnLoad", "neutral", "&#8681;", "Load from File",
              "Import an exported campaign save from this machine.",
              "Load from File - import a previously exported save")
          + '</div>'
        + '</aside>'
      + '</div>'
      + '<div class="h0-footer"><span><b>H0 prototype:</b> modern command shell on the main menu; press and provenance can keep archival treatments elsewhere.</span><span>WCAG AA focus rings and responsive layout active.</span></div>'
    + '</div>';
  }

  function h0WireMenu(hasCampaignSave) {
    if (hasCampaignSave) {
      var btnContinue = document.getElementById("gnContinue");
      if (btnContinue) {
        btnContinue.addEventListener("click", function () {
          if (!G.campaign) {
            var sv2 = (typeof loadLocal === "function") ? loadLocal() : null;
            if (sv2 && typeof applySave === "function") applySave(sv2);
          }
          if (G.campaign && typeof openUpgrade === "function") openUpgrade();
          else if (typeof toast === "function") toast("No campaign found. Start a new one.");
        });
      }
    }

    var btnWarDept = document.getElementById("gnWarDept");
    if (btnWarDept) btnWarDept.addEventListener("click", function () { if (typeof openWarDept === "function") openWarDept(); });

    var btnNewUS = document.getElementById("gnNewUS");
    if (btnNewUS) btnNewUS.addEventListener("click", function () { if (typeof _openMusterChoice === "function") _openMusterChoice("US"); });

    var btnNewCS = document.getElementById("gnNewCS");
    if (btnNewCS) btnNewCS.addEventListener("click", function () { if (typeof _openMusterChoice === "function") _openMusterChoice("CS"); });

    var btnFree = document.getElementById("gnFree");
    if (btnFree) btnFree.addEventListener("click", function () { if (typeof openPicker === "function") openPicker(); });

    var btnLoad = document.getElementById("gnLoad");
    if (btnLoad) {
      btnLoad.addEventListener("click", function () {
        if (typeof importSave !== "function") return;
        importSave(function (ok) {
          if (typeof toast === "function") toast(ok ? "Save loaded." : "Import failed.");
          openMainMenu();
        });
      });
    }

    var btnSettings = document.getElementById("gnSettings");
    if (btnSettings) btnSettings.addEventListener("click", function () { if (typeof openSettings === "function") openSettings(); });
  }

  h0InjectCss();

  openMainMenu = function () {
    G.mode = "menu";
    if (typeof hideHud === "function") hideHud();
    if (typeof _audMenu === "function") _audMenu();

    var savedCampaign = h0CampaignSave();
    var liveCampaign = (G && G.campaign) ? G.campaign : null;
    var C = liveCampaign || savedCampaign;
    var hasCampaignSave = !!savedCampaign;

    if (typeof openSheet === "function") {
      openSheet(h0BuildMenuHtml(C, hasCampaignSave));
      h0WireMenu(hasCampaignSave);
      h0InstallInjectedPolisher();
    }
  };

  try {
    if (typeof G !== "undefined" && G.mode === "menu" && document.getElementById("sheetPad")) openMainMenu();
  } catch (e) {}
})();
