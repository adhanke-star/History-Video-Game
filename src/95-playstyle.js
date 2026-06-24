/* ===========================================================================
   E2 · 95-playstyle.js — PLAY-STYLE PRESETS + THE D39 "HISTORIAN" SETTINGS LAYER
   (S4 education; V1-CHECKLIST E2 increment 4; DECISIONS D122-next).

   ONE "Play Your Way" hub gathering the game's play-emphasis + teaching/realism
   preferences in an accessible place — the strategic-layer companion to the
   tactical Command & Realism picker (src/tactical/T6-presets.js · fldPresetMenu).

   D39.1 (Aaron): play "modes" are an EMPHASIS, never a hard gate — General-
   Commander = battle focus, President = grand-strategy focus, and the Historian
   is a settings/realism/teaching LAYER over either. In this game BOTH layers are
   always available (the locked "both battle modes selectable" charter), so the
   play-style preset NEVER removes content: it is a remembered emphasis that (a)
   sets which President's-Desk tab the desk first lands on, and (b) tailors the
   hub's own guidance. The teaching layer surfaces the alt-history emergent-only
   teaching toggle and hands off to the existing pickers for the rest.

   ARCHITECTURE — PURE SETTINGS / READ-OUT (byte-identical combat BY CONSTRUCTION):
   this module WRITES only two NON-combat strategic-state flags — G.settings.playStyle
   and G.settings.altHistoryEmergentOnly (the latter already owned by the divergence
   teaching tab; this is a second surface for it) — plus a private localStorage bundle
   for pre-campaign persistence. It does NOT write any combat-path knob: the tactical
   realism levers stay owned by T6 (fldPresetResolve is read-only here; "Adjust the
   battlefield" hands off to fldPresetMenu), and motion/CVD/sound stay owned by the
   frozen base openSettings (a hand-off). No tactical/combat/tick/resolve/bridge path
   references the ps-family symbols (ps_, PS, _ps) — probe-locked by a static scan. NO RNG. NO _SAVE_VER bump
   (playStyle is additive, lazily defaulted).

   Two surfaces, ONE panel body (_psPanelHTML(ctx)): an 18th President's-Desk tab
   (rendered inline like the Codex tab, ctx="desk") AND a main-menu overlay
   (openSheet, ctx="menu"). The desk context is mid-campaign, so its hand-off rows
   are READ-ONLY hints (a live hand-off would tear down the desk sheet + its
   between-battles continuation chain); the menu context offers the live buttons.

   Bare-name globals (G, document, localStorage, openSheet, openMainMenu, openSettings,
   toast, saveLocal, _wdRefresh, fldPresetResolve, FLDP, fldPresetMenu, htmlEsc).
   All public symbols ps-prefixed; internals _ps; the config table PS. No literal
   comment-closer inside a block comment.
   =========================================================================== */

var PS = {
  STORE_KEY: "cw_playstyle",
  /* the three play-style emphases. deskTab = which President's-Desk tab the desk
     first lands on for this style (a PURE-UI consumer of the preference); it must
     be one of the known desk tab keys. "free" == the shipped neutral (economy). */
  styles: {
    president: { label: "President", glyph: "&#9813;", deskTab: "economy",
      sub: "Owner-mode focus &mdash; you run the whole war from the Executive Mansion: the economy, the blockade, manpower, diplomacy, and politics. The Desk opens to the War Effort overview.",
      lead: "Run the war." },
    commander: { label: "General-Commander", glyph: "&#9876;", deskTab: "command",
      sub: "Battle focus &mdash; your army and its generals up front. The Desk opens to Command, and the battlefield&rsquo;s difficulty &amp; realism are yours to set. The strategy layer is still here whenever you want it.",
      lead: "Fight the battles." },
    free: { label: "Free Command", glyph: "&#9819;", deskTab: "economy",
      sub: "Both layers, equally &mdash; the shipped balance. Run the war from the Desk and fight every battle in real time, however you please. Nothing is emphasized over anything else.",
      lead: "Both, your way." },
  },
  order: ["president", "commander", "free"],
  /* the set of desk tab keys deskTab is allowed to resolve to (defensive — a hand-
     edited/older persisted value must never land the desk on a non-existent tab). */
  deskTabs: { economy: 1, command: 1, victory: 1, warroom: 1 },
};

/* the period-broadsheet palette (AA on the dark sheet; reused from T6/codex tokens).
   #9f845c label 4.58:1 · #e9dcc0/#f2e8d5 body · #e8c84a/#c9a85f selection ring. */
var _psEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };

/* ---- read accessors (pure) ---- */
function psGet() { try { var k = G && G.settings && G.settings.playStyle; return (k && PS.styles[k]) ? k : null; } catch (e) { return null; } }
/* the desk's default landing tab for the current play-style; "economy" (the shipped
   default) when unset OR resolving to an unknown tab -> byte-identical when no style set. */
function psDefaultDeskTab() {
  try { var k = psGet(); var s = k && PS.styles[k]; var t = s && s.deskTab; return (t && PS.deskTabs[t]) ? t : "economy"; }
  catch (e) { return "economy"; }
}
function _psEmergentOnly() { try { return !!(G && G.settings && G.settings.altHistoryEmergentOnly); } catch (e) { return false; } }
/* the current tactical Command & Realism preset, READ-ONLY (owned by T6). */
function _psTacticalLine() {
  try {
    if (typeof fldPresetResolve !== "function" || typeof FLDP === "undefined") return null;
    var c = fldPresetResolve(); if (!c) return "Veteran &times; Balanced (the shipped fight)";
    var ai = FLDP.ai && FLDP.ai[c.ai], rm = FLDP.realism && FLDP.realism[c.realism];
    return (ai ? ai.label : "Custom") + " &times; " + (rm ? rm.label : "Custom");
  } catch (e) { return null; }
}

/* ---- writes (the ONLY two non-combat flags this module owns) + persistence ---- */
function _psPersist() {
  // a private localStorage bundle so a PRE-campaign menu choice survives (a campaign
  // save, when present, also carries the flags via saveLocal). Never throws.
  try {
    if (typeof localStorage === "undefined" || !G || !G.settings) return;
    localStorage.setItem(PS.STORE_KEY, JSON.stringify({
      playStyle: G.settings.playStyle || null,
      emergentOnly: !!G.settings.altHistoryEmergentOnly,
    }));
  } catch (e) {}
}
function _psSave() {
  // mirror to the campaign save when one exists (keeps the desk + the save in sync,
  // exactly like the divergence emergent-only toggle); always update the localStorage bundle.
  try { if (typeof saveLocal === "function" && G && G.campaign) saveLocal(); } catch (e) {}
  _psPersist();
}
function psSetStyle(k) {
  if (!PS.styles[k]) return;
  try { if (!G.settings || typeof G.settings !== "object") G.settings = {}; G.settings.playStyle = k; } catch (e) { return; }
  _psSave();
}
function _psToggleEmergent() {
  try { if (!G.settings || typeof G.settings !== "object") G.settings = {}; G.settings.altHistoryEmergentOnly = !G.settings.altHistoryEmergentOnly; } catch (e) { return; }
  _psSave();
}

/* boot: seed G.settings from the localStorage bundle as DEFAULTS ONLY (a value already
   on G.settings — e.g. from a loaded campaign save — always wins). Mirrors the proven
   T6 fldPresetBootLoad pattern; sanitizes the parsed object. */
function psBootLoad() {
  try {
    if (typeof G === "undefined") return;
    G.settings = G.settings || {};
    if (typeof localStorage === "undefined") return;
    var raw = localStorage.getItem(PS.STORE_KEY); if (!raw) return;
    var b = JSON.parse(raw); if (!b || typeof b !== "object") return;
    delete b.__proto__; delete b.constructor; delete b.prototype;
    if (G.settings.playStyle == null && b.playStyle && PS.styles[b.playStyle]) G.settings.playStyle = b.playStyle;
    if (G.settings.altHistoryEmergentOnly == null && typeof b.emergentOnly === "boolean") G.settings.altHistoryEmergentOnly = b.emergentOnly;
  } catch (e) {}
}

/* ===========================================================================
   THE PANEL — one body, two contexts. ctx="desk" (inline in #wdContent, mid-
   campaign: hand-offs become read-only hints) | ctx="menu" (the openSheet overlay:
   live hand-off buttons + a footer). Full keyboard/ARIA; CVD-safe (the glyph is
   decorative, the word label carries the meaning); honours reduceMotion (no
   transitions are introduced here).
   =========================================================================== */
function _psStyleCard(k, on) {
  var d = PS.styles[k];
  return '<button type="button" class="upg" aria-pressed="' + (on ? "true" : "false") + '"'
    + ' data-ps-style="' + k + '"'
    + ' style="display:block;width:100%;text-align:left;margin:0 0 8px 0;padding:10px 12px;border-radius:6px;'
    + (on ? "outline:2px solid #e8c84a;outline-offset:1px;background:#241c10;" : "background:#1a150d;") + '">'
    + '<div style="display:flex;align-items:baseline;gap:8px">'
    +   '<span aria-hidden="true" style="font-size:17px;color:' + (on ? "#f0d98a" : "#c9a85f") + '">' + d.glyph + '</span>'
    +   '<span style="font-weight:bold;letter-spacing:.03em;color:' + (on ? "#f0d98a" : "#e9dcc0") + ';">' + (on ? "&#9656; " : "") + _psEsc(d.label) + '</span>'
    +   '<span style="margin-left:auto;font-size:11px;font-style:italic;opacity:.7;color:#e9dcc0">' + d.lead + '</span>'
    + '</div>'
    + '<div style="font-size:11.5px;opacity:.85;line-height:1.5;margin-top:3px;color:#e9dcc0;">' + d.sub + '</div></button>';
}
function _psToggleBtn(id, on, name) {
  // bug-hunt (WCAG 4.1.2): the visible "On"/"Off" text is the whole accessible name unless we
  // add one — the descriptive label lives in a sibling span (_psRow), which AT cannot associate.
  // Carry the purpose on the button itself, matching the divergence-tab toggle's aria-label.
  return '<button id="' + id + '" type="button" class="upg" aria-pressed="' + (on ? "true" : "false") + '"'
    + (name ? ' aria-label="' + _psEsc(name) + (on ? ": on" : ": off") + '"' : '')
    + ' style="min-width:70px;' + (on ? "outline:2px solid #e8c84a;outline-offset:1px;font-weight:bold;" : "") + '">' + (on ? "On" : "Off") + '</button>';
}
/* a labelled settings row: a name + hint on the left, a control on the right. */
function _psRow(label, hint, controlHTML) {
  return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:9px 0">'
    + '<span style="font-size:13px;color:#f2e8d5">' + label + '<span style="opacity:.62;font-size:11px"> &mdash; ' + hint + '</span></span>'
    + '<span style="flex-shrink:0">' + controlHTML + '</span></div>';
}
function _psPanelHTML(ctx) {
  var curStyle = psGet() || "free";
  var i, cards = "";
  for (i = 0; i < PS.order.length; i++) { var k = PS.order[i]; cards += _psStyleCard(k, k === curStyle); }
  var titleBlock = (ctx === "menu")
    ? '<h1 class="title-xl" style="text-align:center">Play Your Way</h1>'
      + '<p class="title-sub" style="text-align:center">This is a teaching wargame in three layers &mdash; the war you run, the battles you fight, and the history that frames both. Set how it leans for you. Nothing here is locked away: every layer is always one click from any other.</p>'
      + '<hr class="rule">'
    : '<div style="font-size:12px;opacity:.8;line-height:1.55;margin-bottom:10px">Set how the game leans for you &mdash; an emphasis, never a gate. Every layer of the war stays one click away whichever you choose.</div>';

  // --- Section 1: play-style ---
  var sec1 = '<div style="' + (ctx === "menu" ? "max-width:600px;margin:0 auto;" : "") + '">'
    + '<div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#9f845c;margin:2px 0 6px">Play-style</div>'
    + '<div role="group" aria-label="Play-style emphasis">' + cards + '</div>';

  // --- Section 2: the Historian's layer (teaching / realism) ---
  var emOn = _psEmergentOnly();
  var tac = _psTacticalLine();
  var sec2 = '<div style="margin-top:14px;border-top:1px solid #8c724e;padding-top:10px">' /* wcag-auditor: contrast fix from #5a4a2e to #8c724e for AA non-text 3:1 compliance (was 1.89:1 vs #26200f; now 3.57:1) */
    + '<div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#9f845c;margin-bottom:2px">The Historian&rsquo;s layer</div>'
    + '<div style="font-size:11px;opacity:.72;line-height:1.5;margin-bottom:6px">Teaching &amp; realism &mdash; how honestly, and how unforgivingly, the war is presented.</div>'
    // alt-history emergent-only (a real, owned teaching toggle)
    + _psRow("Alternate history: emergent only",
        "hide the game&rsquo;s curated &ldquo;what-if&rdquo; gambits and let divergence arise only from your own play",
        _psToggleBtn("psEmergent", emOn, "Alternate history: emergent only"))
    // battlefield realism (read-only here; owned by T6)
    + _psRow("The battlefield",
        "difficulty &amp; realism of every real-time battle &mdash; the AI never cheats",
        (ctx === "menu"
          ? '<button id="psBattlefield" type="button" class="upg" aria-label="Adjust the battlefield difficulty and realism" style="min-width:70px">Adjust&hellip;</button>'
          : '<span style="font-size:12px;opacity:.85;color:#e9dcc0">' + (tac || "&mdash;") + '<span style="opacity:.6;font-size:11px"><br>set from the menu &middot; &#9881; Command &amp; Realism</span></span>'))
    // display / motion / sound (owned by the frozen base openSettings)
    + _psRow("Display, motion &amp; sound",
        "reduced motion, colour-blind aids, and audio",
        (ctx === "menu"
          ? '<button id="psDisplay" type="button" class="upg" aria-label="Open display, motion and sound settings" style="min-width:70px">Open&hellip;</button>'
          : '<span style="font-size:11px;opacity:.7;color:#e9dcc0">main menu &middot; Settings</span>'));
  if (ctx === "menu" && tac) {
    sec2 += '<div style="font-size:11px;opacity:.7;margin-top:2px;color:#e9dcc0">Battlefield now: <b>' + tac + '</b>.</div>';
  }
  // E2-i5 (D124): a guarded historical teaching read-out of the current realism level
  // (pure read-out, owned by 96-realism-teaching; "" when unavailable -> no change).
  if (typeof rtmHubReadout === "function") {
    var _rtmCfg = (typeof fldPresetResolve === "function" ? fldPresetResolve() : null) || (typeof fldPresetNeutral === "function" ? fldPresetNeutral() : null);
    var _rtmRO = _rtmCfg ? rtmHubReadout(_rtmCfg) : "";
    if (_rtmRO) sec2 += _rtmRO;
  }
  sec2 += '</div>';

  var footer = "";
  if (ctx === "menu") {
    footer = '<div class="btn-row" style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
      + '<button id="psBack" type="button" class="bigbtn">To the Field</button>'
      + '</div>';
  }
  return titleBlock + sec1 + sec2 + '</div>' + footer;
}

/* ---- wiring (shared) ---- */
function _psWire(ctx) {
  if (typeof document === "undefined") return;
  // play-style cards
  var cards = document.querySelectorAll('[data-ps-style]');
  for (var i = 0; i < cards.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        psSetStyle(b.getAttribute("data-ps-style"));
        if (typeof toast === "function") { try { var s = PS.styles[psGet()]; if (s) toast("Play-style: " + s.label, 1400); } catch (e) {} }
        _psRerender(ctx, '[data-ps-style="' + b.getAttribute("data-ps-style") + '"]');
      });
    })(cards[i]);
  }
  // emergent-only toggle (both contexts — a pure G.settings write)
  var em = document.getElementById("psEmergent");
  if (em) em.addEventListener("click", function () { _psToggleEmergent(); _psRerender(ctx, "#psEmergent"); });
  // menu-only live hand-offs (a mid-campaign desk hand-off would tear down the desk sheet)
  if (ctx === "menu") {
    var bf = document.getElementById("psBattlefield");
    if (bf) bf.addEventListener("click", function () { if (typeof fldPresetMenu === "function") fldPresetMenu("menu"); });
    var dp = document.getElementById("psDisplay");
    if (dp) dp.addEventListener("click", function () { if (typeof openSettings === "function") openSettings(); });
    var bk = document.getElementById("psBack");
    if (bk) bk.addEventListener("click", function () { if (typeof openMainMenu === "function") openMainMenu(); });
  }
}
function _psRerender(ctx, focusSel) {
  if (ctx === "desk") {
    if (typeof _wdRefresh === "function") _wdRefresh();   // re-renders the playstyle tab + re-wires via psWireTab
  } else {
    if (typeof openSheet !== "function") return;
    openSheet(_psPanelHTML("menu")); _psWire("menu");
  }
  try { var el = focusSel && document.querySelector(focusSel); if (el) el.focus(); } catch (e) {}
}

/* ---- PUBLIC: the President's-Desk tab (rendered inline like the Codex tab) ---- */
function psRenderTab(C) { return _psPanelHTML("desk"); }
function psWireTab(C) { _psWire("desk"); }

/* ---- PUBLIC: the main-menu overlay ---- */
function psOpenMenu() {
  if (typeof openSheet !== "function") return;
  openSheet(_psPanelHTML("menu"));
  _psWire("menu");
  // land the keyboard inside the panel (the selected style card, else the first)
  try { var f = document.querySelector('[data-ps-style][aria-pressed="true"]') || document.querySelector('[data-ps-style]'); if (f) f.focus(); } catch (e) {}
}

/* ---- main-menu button injection ----
   bug-hunt (E2-i4): the OLD observer used a one-shot `installed` latch (the same shape
   92-help-overlay shipped) — but the main menu is REBUILT on every openMainMenu, so after
   the first menu render the latched observer never re-injects and the button vanishes for
   the rest of the session. Adopt the project's canonical fldInjectMenuButton pattern: a
   NAMED injector that dedupes by LIVE DOM (#gnPlayStyle) and re-injects on EVERY qualifying
   mutation, so the button survives every menu rebuild. (probe-testable directly.) */
function psInjectMenuButton() {
  try {
    if (typeof document === "undefined") return;
    if (document.getElementById("gnPlayStyle")) return;   // already present — dedupe by live DOM
    var col3 = document.querySelector(".gn-col:last-child .gn-classifieds");
    if (!col3 || !col3.parentNode) return;                // no main-menu classifieds column on screen
    var btn = document.createElement("button");
    btn.className = "gn-btn";
    btn.id = "gnPlayStyle";
    btn.setAttribute("aria-label", "Play Your Way — set your play-style (President or General-Commander) and the Historian's teaching and realism settings.");
    btn.innerHTML = '<span class="gn-hl">&#9881; PLAY YOUR WAY</span>'
      + '<span class="gn-deck">Play-style &amp; the Historian&rsquo;s settings &mdash; President or General-Commander, and how the war teaches you.</span>';
    btn.style.marginTop = "8px";
    col3.parentNode.appendChild(btn);
    btn.addEventListener("click", function () { psOpenMenu(); });
  } catch (e) {}
}
(function () {
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") return;
  var obs = new MutationObserver(function () { psInjectMenuButton(); });   // no latch — re-inject whenever the menu (re)appears
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  psInjectMenuButton();   // immediate attempt in case the menu already exists
})();

/* boot: load any persisted play-style / teaching prefs into G.settings. */
(function psBoot() {
  try {
    if (typeof document === "undefined") { psBootLoad(); return; }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", psBootLoad);
    else psBootLoad();
  } catch (e) {}
})();
