/* ============================================================================
   98-h0-main-menu.js -- H0 main menu: full-bleed historical command screen
   ----------------------------------------------------------------------------
   Assignment override only: build/base.html already declares openMainMenu twice
   inside the frozen snapshot, so this module replaces the winning binding by
   assignment instead of adding a third function declaration.

   D282 (design law: docs/design/main-menu-redesign-design.md — AARON-LOCKED,
   Q-D270-4/D280). The menu graduates from the boxed-hero prototype to a
   full-bleed command screen. The three Aaron locks honored here:
     1. HYBRID synthesis — War Room contrast architecture (all copy on >=.90
        dark-glass panels) + Situation Board structure/chain tracker + The
        Front's grouped Field Operations rail.
     2. Campaign-chain tracker IN scope (war-effort chip expansion + Soldier's
        Story slot stay OUT).
     3. Casualty photographs SOMBER-STATIC ONLY — static backdrop, cold
        grayscale-leaning grade, provenance caption/credit always legible, and
        NO MOTION over the dead, ever: when the resolved backdrop scene is a
        photograph of the dead (H0_SOMBER_SCENES) the one-shot entrance
        animation is suppressed too (.h0-somber). Button hover motion happens
        on top of near-opaque panels that occlude the photograph, never over
        the photograph itself; the chain tracker's current ring is static.

   E61 nudge-card half ships here (read-only C.recoveryLossCount/recoveryMode
   consumption; base.html:2547-2741 writes them). The collapse-terminal half
   stays open in REVIEW-QUEUE.

   Scope: presentation-only (D74). Reads loadLocal().campaign, CHAINS, BATTLES,
   __ASSETS, SCENE_IMG, _gorDatelineYear + the recovery fields; writes NOTHING
   to G.campaign/save state. Preserves every live button id and click path used
   by the existing menu and injection observers (#gnFree sibling chain; the
   .gn-col:last-child .gn-classifieds parent-append).
   ========================================================================== */
(function h0MainMenuModule() {
  var h0InjectedObserver = null;

  /* Lock 3: the embedded PD scenes that show the dead (see 51-scenes-imagery
     SCENE_IMG provenance). Keyed by RESOLVED scene key — Bloody Lane at
     Antietam, "A Harvest of Death" at Gettysburg, the Marye's Heights dead on
     the Chancellorsville plate. No motion ever renders over these. */
  var H0_SOMBER_SCENES = { antietam: 1, gettysburg: 1, chancellorsville: 1 };

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

  function h0RulesetLabel(C) {
    try { return (typeof mayhemModeLabel === "function") ? mayhemModeLabel(C) : "Historical Campaign"; }
    catch (e) { return "Historical Campaign"; }
  }

  function h0ChainIdx(C, chain) {
    var idx = (C && typeof C.idx === "number") ? C.idx : 0;
    if (idx < 0) idx = 0;
    if (idx >= chain.length) idx = chain.length - 1;
    return idx;
  }

  function h0NextBattleId(C) {
    try {
      if (!C || !C.side || typeof CHAINS === "undefined" || !CHAINS[C.side]) return "bullrun1";
      var chain = CHAINS[C.side] || [];
      return chain[h0ChainIdx(C, chain)] || "bullrun1";
    } catch (e) { return "bullrun1"; }
  }

  function h0BattleEntry(id) {
    try {
      if (typeof BATTLES !== "undefined" && Array.isArray(BATTLES)) {
        for (var i = 0; i < BATTLES.length; i++) {
          if (BATTLES[i] && BATTLES[i].id === id) return BATTLES[i];
        }
      }
    } catch (e) {}
    return null;
  }

  function h0BattleName(id) {
    var bd = h0BattleEntry(id);
    if (bd && bd.name) return bd.name;
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

  /* Full-bleed backdrop layer — pure decoration (aria-hidden, empty alt); the
     INFORMATIVE element stays the provenance plate below (D282 lock 3: the
     caption/credit must always be legible, so it never rides the backdrop).
     Static by construction: no transform/animation is ever applied to it. */
  function h0BackdropHtml(battleId) {
    var key = h0SceneKey(battleId);
    var inner;
    if (!key) {
      inner = '<div class="h0-backdrop-fallback"><span></span><span></span><span></span></div>';
    } else {
      var src = "";
      try { src = __ASSETS["scenes/" + key] || ""; } catch (e) { src = ""; }
      inner = '<img class="h0-backdrop-img" src="' + src + '" alt="" loading="eager">';
    }
    return '<div class="h0-backdrop" aria-hidden="true">' + inner
      + '<div class="h0-backdrop-vignette"></div>'
      + '<div class="h0-backdrop-scrim"></div>'
      + '</div>';
  }

  /* The framed provenance plate: keeps the img[alt] + figcaption caption/credit
     as the informative element while the backdrop carries the drama. */
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

  /* E61 nudge card (the honest half): read-only consumption of the recovery
     state base.html already writes (:2547-2549 init, :2715-2718 win reset,
     :2739-2741 loss path). Renders once per menu open; no dismissal state, no
     save writes. Guidance, not nagging. */
  function h0NudgeHtml(C, hasCampaignSave) {
    try {
      if (!hasCampaignSave || !C || !C.recoveryMode) return "";
      var n = (typeof C.recoveryLossCount === "number") ? C.recoveryLossCount : 0;
      if (n < 2) return "";
      var battleName = h0BattleName(h0NextBattleId(C));
      var times = (n === 2) ? "twice" : (n + " times");
      return '<section class="h0-nudge" aria-labelledby="h0NudgeTitle">'
        + '<p class="h0-nudge-kicker">Command guidance</p>'
        + '<h3 id="h0NudgeTitle">Take command at ' + h0Esc(battleName) + '</h3>'
        + '<p>Delegated command has failed here ' + h0Esc(times) + '. Auto-resolve fights the same field with the'
        + ' same inputs &mdash; repeating it will not change the ground. Taking field command yourself, or pressing'
        + ' the political path to victory, is the honest way forward.</p>'
        + '</section>';
    } catch (e) { return ""; }
  }

  /* Campaign-chain tracker (Aaron lock 2): one theater-tinted segment per
     CHAINS[C.side] battle. fought = filled, current = STATIC brass ring (no
     pulse — nothing loops, and lock 3 forbids motion near the dead), ahead =
     dimmed. aria-hidden decoration paired with a visually-hidden SR summary;
     suppressed entirely in the no-save state. */
  function h0ChainRailHtml(C, hasCampaignSave) {
    try {
      if (!hasCampaignSave || !C || !C.side) return "";
      if (typeof CHAINS === "undefined" || !CHAINS[C.side] || typeof BATTLES === "undefined") return "";
      var chain = CHAINS[C.side];
      if (!chain.length) return "";
      var idx = h0ChainIdx(C, chain);
      var segs = "";
      var curName = "", curYear = "";
      for (var i = 0; i < chain.length; i++) {
        var bd = h0BattleEntry(chain[i]);
        var name = (bd && bd.name) ? bd.name : chain[i];
        var year = (bd && bd.year) ? String(bd.year) : "";
        var th = (bd && bd.th) ? bd.th : "E";
        var state = (i < idx) ? "is-fought" : (i === idx) ? "is-current" : "is-ahead";
        if (i === idx) { curName = name; curYear = year; }
        var word = (i < idx) ? "fought" : (i === idx) ? "current" : "ahead";
        segs += '<li class="h0-seg ' + state + ' th-' + h0Esc(th) + '" title="'
          + h0Esc(name + (year ? ", " + year : "") + " — " + word) + '"></li>';
      }
      var pos = "Battle " + (idx + 1) + " of " + chain.length + ": " + curName + (curYear ? ", " + curYear : "");
      var sr = "Campaign progress: " + pos + ". " + idx + " fought, " + (chain.length - idx - 1) + " ahead.";
      return '<div class="h0-chainrail">'
        + '<div class="h0-chainrail-head">'
          + '<p class="h0-chainrail-title">Campaign Trail &mdash; ' + h0Esc(h0SideLabel(C.side)) + '</p>'
          + '<p class="h0-chainrail-now">' + h0Esc(pos) + '</p>'
        + '</div>'
        + '<p class="h0-sr-only">' + h0Esc(sr) + '</p>'
        + '<div class="h0-chain-scroll"><ol class="h0-chain" aria-hidden="true">' + segs + '</ol></div>'
        + '</div>';
    } catch (e) { return ""; }
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
      /* S03+S11 (D232): the accent tokens stay the six-shell canon values —
         green #5f9273 / red #b35a50 / muted #c5cdc3 / brass #d8b458 / focus #ffe27a
         (probe-pinned LITERAL; D282 extends the pin to brass+focus). New backdrop/scrim
         values below are literal rgba per the same canon — no new CSS variables. */
      "  --h0-bg:#090d0e;--h0-panel:#131a19;--h0-panel2:#18231f;--h0-ink:#f2eee3;--h0-muted:#c5cdc3;",
      "  --h0-brass:#d8b458;--h0-amber:#d0a047;--h0-green:#5f9273;--h0-blue:#5d86b7;",
      "  --h0-red:#b35a50;--h0-line:rgba(216,180,88,.28);--h0-focus:#ffe27a;",
      "  color:var(--h0-ink);background:linear-gradient(135deg,#080b0c 0%,#14201d 46%,#0c1112 100%);",
      "  border:1px solid rgba(216,180,88,.42);border-radius:8px;overflow:hidden;position:relative;",
      "  box-shadow:0 24px 70px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,255,255,.05);",
      "  font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;",
      "}",
      ".h0-menu *{box-sizing:border-box;letter-spacing:0;}",
      /* D282: the full-bleed backdrop — the next field's PD photograph promoted behind the
         whole command screen. STATIC (no ken-burns/push-in: auto-motion >5s with no pause
         control fails WCAG 2.2.2 for the no-OS-flag majority). Cold grayscale-leaning grade;
         heavy vignette + bottom scrim. Lives INSIDE .h0-menu (absolute within the sheet's
         flow, base.html:2319 openSheet contract), never fixed to the viewport. */
      ".h0-backdrop{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#0a0e0f;}",
      ".h0-backdrop-img{width:100%;height:100%;object-fit:cover;filter:grayscale(.62) contrast(1.15) brightness(.52);}",
      ".h0-backdrop-fallback{position:absolute;inset:0;background:linear-gradient(135deg,#101517 0%,#1d332a 55%,#0d1213 100%);display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;padding:26px;}",
      ".h0-backdrop-fallback span{display:block;border-radius:6px;background:linear-gradient(180deg,rgba(216,180,88,.14),rgba(93,134,183,.12));}",
      ".h0-backdrop-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 34%,rgba(0,0,0,0) 26%,rgba(0,0,0,.55) 72%,rgba(0,0,0,.82) 100%);}",
      ".h0-backdrop-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,8,8,.42),rgba(5,8,8,.18) 32%,rgba(5,8,8,.66) 74%,rgba(4,6,6,.92));}",
      /* command-grid texture kept as a faint layer OVER the backdrop (probe-pinned) */
      ".h0-menu::before{content:'';position:absolute;inset:0;z-index:1;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0,rgba(255,255,255,.035) 1px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,rgba(216,180,88,.055) 0,rgba(216,180,88,.055) 1px,transparent 1px,transparent 28px);opacity:.35;pointer-events:none;}",
      ".h0-menu::after{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(216,180,88,.1),transparent 28%,rgba(93,134,183,.1) 64%,rgba(179,90,80,.1));pointer-events:none;}",
      ".h0-top{position:relative;z-index:2;display:grid;grid-template-columns:minmax(245px,.9fr) minmax(330px,1.45fr) minmax(245px,.9fr);gap:12px;padding:12px;}",
      /* War Room contrast architecture: ALL copy sits on near-opaque (>=.90) dark-glass
         panels so contrast is independent of the photograph behind. Literal rgba. */
      ".h0-panel{background:linear-gradient(180deg,rgba(21,30,28,.94),rgba(9,13,14,.96));border:1px solid var(--h0-line);border-radius:8px;box-shadow:0 16px 34px rgba(0,0,0,.44);}",
      ".h0-command{padding:16px;display:flex;flex-direction:column;gap:12px;border-left:4px solid var(--h0-green);}",
      ".h0-kicker{font-size:11px;text-transform:uppercase;color:var(--h0-brass);font-weight:800;margin:0;}",
      ".h0-title{font-size:42px;line-height:.96;margin:0;color:#fff8df;font-weight:900;text-shadow:0 2px 14px rgba(0,0,0,.55);}",
      ".h0-sub{font-size:13px;line-height:1.45;color:var(--h0-muted);margin:0;}",
      ".h0-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:2px;}",
      ".h0-chip{min-height:46px;display:flex;flex-direction:column;justify-content:center;border:1px solid rgba(216,180,88,.22);border-radius:8px;padding:7px 9px;background:rgba(255,255,255,.055);color:var(--h0-ink);}",
      ".h0-chip b{font-size:10px;text-transform:uppercase;color:var(--h0-muted);font-weight:800;}",
      ".h0-chip span{font-size:13px;font-weight:850;white-space:normal;}",
      ".h0-chip.h0-alert{background:rgba(179,90,80,.18);border-color:rgba(179,90,80,.5);}",
      /* S05 (D232): the action grid absorbs the column's leftover height and distributes its
         cards, so the no-save state no longer strands a void under the campaign cards. */
      ".h0-actions{display:grid;gap:9px;margin-top:2px;flex:1 1 auto;min-height:0;align-content:space-evenly;}",
      /* New-player state: with no campaign save the tracker/identity surfaces suppress and
         the two muster cards become the dominant first-viewport signal. */
      ".h0-fresh #gnNewUS,.h0-fresh #gnNewCS{min-height:86px;padding:14px 12px;}",
      ".h0-fresh #gnNewUS .h0-card-icon,.h0-fresh #gnNewCS .h0-card-icon{width:44px;height:44px;min-width:44px;font-size:19px;}",
      ".h0-stage{padding:0;display:flex;flex-direction:column;min-height:480px;background:rgba(7,9,9,.93);color:#f7eddc;border-color:rgba(93,134,183,.36);}",
      ".h0-stage-head{padding:11px 14px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}",
      ".h0-stage-head h2{font-size:17px;margin:0;color:#fff4d4;line-height:1.2;font-weight:900;}",
      ".h0-stage-head span{font-size:11px;color:#cfd7cd;text-align:right;line-height:1.35;}",
      /* The provenance plate: smaller framed informative figure — caption/credit ALWAYS
         legible on a near-opaque bottom band (lock 3), independent of the backdrop. */
      ".h0-hero-figure{margin:8px 14px 6px;position:relative;border-radius:8px;overflow:hidden;border:1px solid rgba(216,180,88,.3);background:#080706;flex:0 0 auto;}",
      ".h0-hero-img{display:block;width:100%;height:128px;object-fit:cover;filter:grayscale(.2) contrast(1.15) brightness(.82);}",
      ".h0-hero-figure::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.16) 50%,rgba(0,0,0,.6));pointer-events:none;}",
      ".h0-hero-figure figcaption{position:relative;z-index:1;font-size:11px;line-height:1.4;color:#f4e4c2;background:rgba(0,0,0,.92);padding:8px 10px 9px;border-top:1px solid rgba(216,180,88,.24);}",
      ".h0-hero-figure figcaption b{display:block;margin-top:3px;color:#e2bd6f;font-size:10px;font-weight:900;}",
      ".h0-hero-fallback{height:128px;margin:8px 14px 6px;border-radius:8px;border:1px solid rgba(216,180,88,.3);background:linear-gradient(135deg,#121719,#20382e);display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;padding:16px;flex:0 0 auto;}",
      ".h0-hero-fallback span{display:block;border-radius:4px;background:linear-gradient(180deg,rgba(216,180,88,.18),rgba(93,134,183,.15));}",
      /* E61 take-command guidance card */
      ".h0-nudge{margin:4px 14px 10px;border:1px solid rgba(179,90,80,.55);border-left:4px solid var(--h0-red);border-radius:8px;background:rgba(26,13,12,.93);padding:11px 12px;flex:0 0 auto;}",
      ".h0-nudge-kicker{font-size:10px;text-transform:uppercase;color:#e0a49b;font-weight:800;margin:0 0 3px;}",
      ".h0-nudge h3{font-size:14px;margin:0 0 5px;color:#ffe9d9;font-weight:900;line-height:1.25;}",
      ".h0-nudge p{font-size:12px;line-height:1.5;color:#e8ddd2;margin:0;}",
      /* Field Operations group: #gnFree anchors here and the T0->T1->T2->T6->T11
         sibling-insertion chain clusters under the heading (same anchor id, same
         parentNode/nextSibling mechanics); capped + internally scrollable so 6+
         scenario buttons never blow the viewport. */
      ".h0-fieldops{margin:4px 14px 12px;display:flex;flex-direction:column;flex:1 1 auto;min-height:0;border:1px solid rgba(216,180,88,.3);border-radius:8px;background:rgba(255,255,255,.04);}",
      ".h0-fieldops-title{font-size:11px;text-transform:uppercase;font-weight:900;color:var(--h0-brass);margin:0;padding:9px 11px 7px;border-bottom:1px solid rgba(216,180,88,.2);}",
      /* flex column, NOT grid: a scroll-capped grid freezes Chrome's button rows at
         min-height and 3-line decks paint over the next button (D282 shot readback). */
      /* the 160px cap keeps the Aaron-locked chain rail above the desktop fold once the
         T0/T1/T2/T6/T11 buttons finish injecting (they add ~700px of scrollable content) */
      ".h0-fieldops-list{overflow:auto;max-height:150px;padding:8px;display:flex;flex-direction:column;gap:7px;}",
      ".h0-fieldops-list .gn-btn{width:100%;margin:0;flex:0 0 auto;}",
      ".h0-notices{padding:11px;display:flex;flex-direction:column;gap:8px;border-right:4px solid var(--h0-amber);}",
      ".h0-notices-title{font-size:12px;text-transform:uppercase;font-weight:900;color:var(--h0-brass);margin:0;}",
      ".h0-notices .gn-classifieds{display:grid;gap:6px;margin:0;border:0;padding:0;background:transparent;}",
      ".h0-menu .gn-col{border:0;padding:0;}",
      ".h0-menu .gn-btn{min-height:48px;width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid rgba(216,180,88,.24);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));color:var(--h0-ink);padding:9px;cursor:pointer;font-family:inherit;box-shadow:0 8px 18px rgba(0,0,0,.22);transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease,background .12s ease;}",
      ".h0-menu .gn-btn:hover{transform:translateY(-1px);border-color:var(--h0-brass);box-shadow:0 12px 24px rgba(0,0,0,.34);background:linear-gradient(180deg,rgba(216,180,88,.18),rgba(255,255,255,.06));}",
      ".h0-menu .gn-btn:focus,.h0-menu .gn-btn:focus-visible{outline:3px solid var(--h0-focus);outline-offset:3px;}",
      ".h0-menu .gn-btn:hover .gn-hl,.h0-menu .gn-btn:focus .gn-hl,.h0-menu .gn-btn:focus-visible .gn-hl{color:#fff7df;text-decoration:none;}",
      ".h0-menu .gn-hl{display:block;font-size:14px;line-height:1.22;font-weight:900;color:inherit;text-transform:none;margin:0;}",
      ".h0-menu .gn-deck,.h0-menu .gn-advert-body{display:block;font-size:11px;line-height:1.35;color:var(--h0-muted);margin-top:2px;font-style:normal;}",
      ".h0-card-icon{width:34px;height:34px;min-width:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:900;border:1px solid rgba(255,255,255,.18);}",
      ".h0-union .h0-card-icon{background:var(--h0-blue);}.h0-confed .h0-card-icon{background:var(--h0-red);}.h0-primary .h0-card-icon{background:var(--h0-green);}.h0-field .h0-card-icon{background:var(--h0-amber);}.h0-neutral .h0-card-icon{background:#59615d;}",
      ".h0-menu .h0-injected-icon{font-size:11px;letter-spacing:0;color:#fff;background:#46524f;}",
      ".h0-menu .h0-inj-field .h0-injected-icon{background:var(--h0-amber);}",
      ".h0-menu .h0-inj-neutral .h0-injected-icon{background:#59615d;}",
      ".h0-stage .h0-field{background:linear-gradient(180deg,rgba(208,160,71,.28),rgba(216,180,88,.1));color:#fff7df;border-color:rgba(216,180,88,.58);}",
      ".h0-stage .h0-field .gn-deck{color:#e6d6b7;}",
      /* Campaign-chain tracker rail (replaces the prototype footer). The rail's own
         near-opaque band keeps its copy contrast-independent of the backdrop. */
      ".h0-chainrail{position:relative;z-index:2;border-top:1px solid rgba(216,180,88,.24);background:rgba(6,9,9,.93);padding:7px 14px 9px;}",
      ".h0-chainrail-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 5px;}",
      ".h0-chainrail-title{font-size:11px;text-transform:uppercase;font-weight:900;color:var(--h0-brass);margin:0;}",
      ".h0-chainrail-now{font-size:12px;font-weight:800;color:#e7e0d2;margin:0;}",
      ".h0-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}",
      ".h0-chain-scroll{overflow-x:auto;overflow-y:hidden;padding:2px 0;}",
      ".h0-chain{display:flex;gap:3px;list-style:none;margin:0;padding:2px;min-width:100%;}",
      ".h0-seg{flex:1 1 0;min-width:12px;height:16px;border-radius:3px;background:#59615d;}",
      ".h0-seg.th-E{background:#5d86b7;}",
      ".h0-seg.th-W{background:#5f9273;}",
      ".h0-seg.th-TM{background:#d0a047;}",
      ".h0-seg.th-N{background:#7d92a9;}",
      ".h0-seg.is-ahead{opacity:.26;}",
      /* current = STATIC ring (no pulse: nothing loops; lock 3 forbids motion over the dead) */
      ".h0-seg.is-current{height:20px;margin-top:-2px;box-shadow:0 0 0 2px #d8b458,0 0 10px rgba(216,180,88,.5);}",
      /* Motion budget: ONE-SHOT entrance fade/translate, 340ms total, nothing loops.
         Suppressed by G.settings.reduceMotion (is-reduced-motion), by the OS flag, AND by
         .h0-somber — when the backdrop is a photograph of the dead, panels do not slide
         over it (Aaron lock 3: no motion over the dead, ever). */
      "@keyframes h0Enter{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}",
      ".h0-top,.h0-chainrail{animation:h0Enter .34s ease-out both;}",
      ".h0-menu.h0-somber .h0-top,.h0-menu.h0-somber .h0-chainrail{animation:none!important;}",
      /* panel-advisory sharpening: under somber even the 1px hover lift is stilled —
         border/glow/background hover cues remain, but nothing translates at all. */
      ".h0-menu.h0-somber .gn-btn:hover{transform:none;}",
      ".h0-menu.is-reduced-motion .gn-btn,.h0-menu.is-reduced-motion *{transition:none!important;animation:none!important;}",
      "@media (prefers-reduced-motion: reduce){.h0-menu .gn-btn,.h0-menu *{transition:none!important;animation:none!important;}}",
      "@media (max-width:900px){#overlay .sheet:has(.h0-menu){width:min(760px,96vw);}.h0-top{grid-template-columns:1fr;}.h0-stage{min-height:0;}.h0-chips{grid-template-columns:repeat(3,minmax(0,1fr));}.h0-hero-img,.h0-hero-fallback{height:150px;}.h0-fieldops-list{max-height:300px;}}",
      "@media (max-width:520px){.sheet .pad{padding:10px;}.h0-top{padding:10px;gap:10px;}.h0-command,.h0-notices{padding:12px;}.h0-title{font-size:31px;}.h0-sub{font-size:12px;}.h0-chips{grid-template-columns:1fr;}.h0-hero-img,.h0-hero-fallback{height:128px;}.h0-menu .gn-btn{padding:9px;}.h0-card-icon{width:30px;height:30px;min-width:30px;font-size:15px;}.h0-chainrail{padding:8px 10px 10px;}.h0-seg{min-width:10px;}}",
      /* High-contrast mode force-hides the backdrop entirely — copy sits on pure black. */
      "html[data-a11y-contrast=\"high\"] .h0-backdrop{display:none!important;}",
      "html[data-a11y-contrast=\"high\"] .h0-menu{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}",
      "html[data-a11y-contrast=\"high\"] .h0-panel,html[data-a11y-contrast=\"high\"] .h0-menu .gn-btn,html[data-a11y-contrast=\"high\"] .h0-chip,html[data-a11y-contrast=\"high\"] .h0-chainrail,html[data-a11y-contrast=\"high\"] .h0-nudge,html[data-a11y-contrast=\"high\"] .h0-fieldops{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}",
      "html[data-a11y-contrast=\"high\"] .h0-menu .gn-deck,html[data-a11y-contrast=\"high\"] .h0-sub{color:#f2e6c8!important;}"
    ].join("");
    document.head.appendChild(s);
  }

  function h0BuildMenuHtml(C, hasCampaignSave) {
    var side = (C && C.side === "CS") ? "CS" : "US";
    var battleId = h0NextBattleId(C);
    var battleName = h0BattleName(battleId);
    var battleEntry = h0BattleEntry(battleId);
    /* Year of the NEXT field: read it straight off the battle row (correct even when a
       save exists but G.campaign is not applied yet); fall back to the live helpers. */
    var year = (battleEntry && battleEntry.year) ? String(battleEntry.year)
      : (typeof _gorDatelineYear === "function") ? _gorDatelineYear() : String(campaignYear(C || {}));
    var sceneKey = h0SceneKey(battleId);
    var somber = !!(sceneKey && H0_SOMBER_SCENES[sceneKey]);

    var actionHtml = "";
    if (hasCampaignSave) {
      actionHtml += h0Action("gnContinue", "primary", "&#9654;", "Continue Campaign",
        "Resume the current " + h0SideLabel(side) + " war at the next decision point. Mode: " + h0RulesetLabel(C) + ".",
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

    var cls = "h0-menu"
      + (h0HasReducedMotion() ? " is-reduced-motion" : "")
      + (somber ? " h0-somber" : "")
      + (hasCampaignSave ? "" : " h0-fresh");

    return '<div class="' + cls + '" role="region" aria-label="The Civil War main menu">'
      + h0BackdropHtml(battleId)
      + '<div class="h0-top">'
        + '<section class="gn-col h0-panel h0-command" aria-labelledby="h0Title">'
          + '<p class="h0-kicker">Operational command interface</p>'
          + '<h1 id="h0Title" class="h0-title">The Civil War</h1>'
          + '<p class="h0-sub">Run the war from the President’s desk, choose the next field, and carry every decision into real-time command.</p>'
          + '<div class="h0-chips" aria-label="Campaign status">'
            + h0Chip("Season", year, "")
            + h0Chip("Side", hasCampaignSave ? h0SideLabel(side) : "Choose", "")
            + h0Chip("Next Field", battleName, "h0-alert")
            + h0Chip("Mode", hasCampaignSave ? h0RulesetLabel(C) : "Historical default", "")
          + '</div>'
          + '<div class="h0-actions">' + actionHtml + '</div>'
        + '</section>'
        + '<section class="gn-col h0-panel h0-stage" aria-labelledby="h0FieldTitle">'
          + '<div class="h0-stage-head"><h2 id="h0FieldTitle">Current Field</h2><span>' + h0Esc(battleName) + '<br>campaign season ' + h0Esc(year) + '</span></div>'
          + h0SceneHtml(battleId)
          + h0NudgeHtml(C, hasCampaignSave)
          + '<div class="h0-fieldops" role="group" aria-labelledby="h0FieldOpsTitle">'
            + '<p class="h0-fieldops-title" id="h0FieldOpsTitle">Field Operations</p>'
            + '<div class="h0-fieldops-list">'
              + h0Action("gnFree", "field", "BT", "Choose a Battle",
                  "Fight a standalone historical engagement, use the sandbox, or launch custom tactical tools.",
                  "Free Battle - choose any engagement or tactical mode")
            + '</div>'
          + '</div>'
        + '</section>'
        + '<aside class="gn-col h0-panel h0-notices" aria-labelledby="h0NoticesTitle">'
          + '<p id="h0NoticesTitle" class="h0-notices-title">Command Utilities</p>'
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
      + h0ChainRailHtml(C, hasCampaignSave)
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
