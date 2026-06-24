/* ===========================================================================
   E3 · 97-accessibility.js — THE ACCESSIBILITY HUB + the 4 dedicated a11y modes.
   (S4 accessibility; V1-CHECKLIST E3 increment 1; DECISIONS D125.)

   The game already ships a strong a11y baseline: the frozen openSettings carries
   Reduced Motion + Colour-blind Aids (cbAids), boot auto-detects prefers-reduced-
   motion, the tactical battle has a live-region narrator (fldAnnounce -> #fldLive),
   and CVD-safe shape+word redundancy is baked through the UI. E3-i1 adds the FOUR
   dedicated, first-class accessibility MODES the checklist names, in one discoverable
   hub:
     (1) HIGH CONTRAST  — a max-contrast theme (overrides the :root palette tokens to
         bright accents/rules + a black ground + strong, universal focus rings).
     (2) CVD-SAFE       — drives the existing cbAids redundancy (glyph + word on every
         side/ownership cue) and persists it as a first-class a11y choice.
     (3) SR NARRATION   — a STRATEGIC-layer aria-live region (#a11yLive) + a11yAnnounce,
         announcing each turn's situation (the tactical battle is already narrated by
         fldAnnounce). Default ON (a live region is invisible to sighted players).
     (4) DYSLEXIA TEXT  — swaps the broadsheet serif for a clean, high-legibility sans
         stack + relaxed letter/word spacing + line-height (no external font; $0 / one
         file — a research-backed spacing approach, not a special typeface download).
   Plus a one-stop mirror of Reduced Motion so the whole accessibility surface is in one
   place. The dedicated FULL WCAG 2.2 AA audit sweep across every shipped surface is the
   companion increment E3-i2.

   ARCHITECTURE — PURE SETTINGS / PRESENTATION LAYER; byte-identical combat BY
   CONSTRUCTION (D74): this module writes ONLY non-combat a11y flags on G.settings
   (a11yContrast / a11yCvd / a11yNarrate / a11yDyslexia — and it mirrors the base's own
   reduceMotion / cbAids), plus a private cw_a11y localStorage bundle (defaults-only
   boot, the proven T6/95 pattern). It injects a <style> + toggles <html> data-attrs +
   ensures a strategic live region. It touches NO combat knob, NO RNG, NO _SAVE_VER bump.
   No tactical file is in the diff; no combat/tick/resolve/bridge path references a11y*
   (probe-locked by a static scan). The host stays byte-identical when this module is
   absent: every external hook is typeof-guarded.

   Bare-name globals (G, document, localStorage, openSheet, openMainMenu, openSettings,
   saveLocal, toast, refreshUI, draw, htmlEsc). Public symbols a11y-prefixed; internals
   _a11y. No literal comment-closer inside a block comment.
   =========================================================================== */

var A11Y = {
  STORE_KEY: "cw_a11y",
  STYLE_ID: "a11yModeStyles",
  LIVE_ID: "a11yLive",
  /* the four modes + the reduced-motion mirror, in panel order. `flag` is the G.settings
     key this toggle owns/mirrors; `kind` distinguishes owned a11y flags from the mirrors. */
  modes: [
    { flag: "a11yContrast", kind: "own", label: "High contrast", glyph: "&#9681;",
      hint: "lifts the core surfaces &mdash; brighter accents, borders, and labels, a darker ground, and strong focus outlines" },
    { flag: "a11yDyslexia", kind: "own", label: "Dyslexia-friendly text", glyph: "&#9000;",
      hint: "a clean, high-legibility sans-serif with relaxed letter, word, and line spacing" },
    { flag: "a11yCvd", kind: "cvd", label: "Colour-blind safe", glyph: "&#9673;",
      hint: "adds glyphs and words so side and ownership never rely on colour alone (the battle redraws to match)" },
    { flag: "a11yNarrate", kind: "own", label: "Screen-reader narration", glyph: "&#128264;",
      hint: "announces each strategic turn to assistive tech via a live region (battles are already narrated)" },
    { flag: "reduceMotion", kind: "motion", label: "Reduced motion", glyph: "&#9208;",
      hint: "collapse animations to instant &mdash; smoke, casualty numbers, camera glide (mirrors Settings)" },
  ],
};

var _a11yEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&(?![a-zA-Z#0-9]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };

/* ---- pure reads (never throw) ---- */
function a11yOn(flag) {
  try {
    if (!G || !G.settings) return false;
    if (flag === "a11yNarrate") return G.settings.a11yNarrate !== false;   // default ON
    // bug-hunt I3-1/I5-1: CVD is NOT a separate latched flag — cbAids (base-owned, the existing
    // glyph+word redundancy) is the single source of truth, so the base Settings panel's "off"
    // can never be resurrected. The "a11yCvd" mode key simply reads/writes cbAids.
    if (flag === "a11yCvd") return !!G.settings.cbAids;
    return !!G.settings[flag];
  } catch (e) { return false; }
}

/* ===========================================================================
   THE APPLY STEP — idempotent. Injects the mode stylesheet once, toggles the
   <html> data-attributes, syncs cbAids from the CVD flag, and ensures the live
   region exists. Safe to call repeatedly (boot, every toggle).
   =========================================================================== */
function _a11yEnsureStyleEl() {
  if (typeof document === "undefined" || !document.head) return null;
  var el = document.getElementById(A11Y.STYLE_ID);
  if (el) return el;
  el = document.createElement("style");
  el.id = A11Y.STYLE_ID;
  el.type = "text/css";
  el.textContent = _a11yCss();
  document.head.appendChild(el);
  return el;
}
function _a11yCss() {
  // HIGH CONTRAST — override the :root design tokens (the highest-leverage move: every
  // var-driven label/rule/border/accent brightens at once), force a black ground + bright
  // base text on the broadsheet containers, and add strong, universal focus rings. Opacity
  // is intentionally left untouched (some elements hide via opacity:0). reduce-motion-safe
  // (no transitions introduced).
  var hc = 'html[data-a11y-contrast="high"]{'
    + '--ink:#000;--ink-soft:#0a0a0a;--parch:#ffffff;--parch-dk:#f2ead4;--parch-edge:#ffe27a;'
    + '--rule:#e8c860;--brass:#ffd24a;--brass-lt:#ffe27a;--blood:#ff6b5e;--blood-lt:#ff8a7e;--gold:#ffd24a;}'
    + 'html[data-a11y-contrast="high"] body{background:#000 !important;color:#fff !important;}'
    // bug-hunt I4-1: the main-menu broadsheet (.gn-paper) is its OWN opaque light-parchment theme
    // (#f5edd6 ground, #2b2118 ink ~12:1 — already AAA) and uses NO --vars, so high-contrast leaves
    // it untouched. We must NOT blacken its transparent .gn-col (that put black behind dark ink) nor
    // brighten its .gn-deck (that put near-white on cream) — both made the menu unreadable.
    + 'html[data-a11y-contrast="high"] .pad,html[data-a11y-contrast="high"] #sheetPad,html[data-a11y-contrast="high"] .sheet,'
    + 'html[data-a11y-contrast="high"] #info,html[data-a11y-contrast="high"] #log,html[data-a11y-contrast="high"] #objbar,'
    + 'html[data-a11y-contrast="high"] #topbar{background:#000 !important;}'
    + 'html[data-a11y-contrast="high"] .hint,html[data-a11y-contrast="high"] .sd,html[data-a11y-contrast="high"] .title-sub,'
    + 'html[data-a11y-contrast="high"] .bmeta,html[data-a11y-contrast="high"] .bth,'
    + 'html[data-a11y-contrast="high"] .rl,html[data-a11y-contrast="high"] .lab,html[data-a11y-contrast="high"] .k{color:#f2e6c8 !important;}'
    + 'html[data-a11y-contrast="high"] :focus-visible{outline:3px solid #ffe27a !important;outline-offset:2px !important;}'
    + 'html[data-a11y-contrast="high"] button:focus,html[data-a11y-contrast="high"] a:focus,'
    + 'html[data-a11y-contrast="high"] input:focus,html[data-a11y-contrast="high"] [tabindex]:focus{outline:3px solid #ffe27a !important;outline-offset:2px !important;}';
  // DYSLEXIA — a clean high-legibility sans stack + relaxed spacing. font-family on .pad *
  // is broad but safe (DOM/HTML only; canvas + 3D label text are drawn in JS, unaffected).
  var dx = 'html[data-a11y-text="dyslexia"] body,html[data-a11y-text="dyslexia"] button,'
    + 'html[data-a11y-text="dyslexia"] input,html[data-a11y-text="dyslexia"] .pad,html[data-a11y-text="dyslexia"] .pad *{'
    + 'font-family:"Atkinson Hyperlegible","Trebuchet MS",Verdana,system-ui,-apple-system,"Segoe UI",sans-serif !important;'
    + 'letter-spacing:.02em !important;}'
    + 'html[data-a11y-text="dyslexia"] .pad,html[data-a11y-text="dyslexia"] .pad p,'
    + 'html[data-a11y-text="dyslexia"] .pad div,html[data-a11y-text="dyslexia"] .pad span,html[data-a11y-text="dyslexia"] .pad li{line-height:1.62 !important;word-spacing:.04em !important;}';
  return hc + "\n" + dx;
}
function a11yApply() {
  try {
    if (typeof document === "undefined") return;
    _a11yEnsureStyleEl();
    var root = document.documentElement;
    if (root) {
      if (a11yOn("a11yContrast")) root.setAttribute("data-a11y-contrast", "high"); else root.removeAttribute("data-a11y-contrast");
      if (a11yOn("a11yDyslexia")) root.setAttribute("data-a11y-text", "dyslexia"); else root.removeAttribute("data-a11y-text");
    }
    // CVD == cbAids (the base-owned source of truth) — a11yApply does NOT force cbAids on or off,
    // so an out-of-band base "Colour-blind Aids: Off" stays authoritative (no D123-class resurrection).
    _a11yEnsureLive();
  } catch (e) {}
}

/* ===========================================================================
   THE STRATEGIC LIVE REGION + a11yAnnounce. The tactical battle already has its
   own narrator (#fldLive via fldAnnounce); this is the strategic/owner-mode one.
   =========================================================================== */
function _a11yEnsureLive() {
  if (typeof document === "undefined" || !document.body) return null;
  var el = document.getElementById(A11Y.LIVE_ID);
  if (el) return el;
  el = document.createElement("div");
  el.id = A11Y.LIVE_ID;
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-atomic", "true");
  el.setAttribute("role", "status");
  // visually hidden but available to AT (the fldLive pattern)
  el.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";
  document.body.appendChild(el);
  return el;
}
var _a11yLiveToggle = false;
function a11yAnnounce(msg) {
  try {
    if (!a11yOn("a11yNarrate")) return;             // gated by the SR-narration mode
    if (msg == null || msg === "") return;
    var el = _a11yEnsureLive(); if (!el) return;
    // alternate a trailing zero-width space so AT re-announces even an identical message.
    _a11yLiveToggle = !_a11yLiveToggle;
    el.textContent = String(msg) + (_a11yLiveToggle ? "​" : "");
  } catch (e) {}
}
/* build + announce a concise summary of the current strategic turn (date + side +
   the salient situation). Reads only; returns the string it announced (or ""). */
function a11yTurnSummary(C) {
  try {
    C = C || (typeof G !== "undefined" && G && G.campaign);
    if (!C) return "";
    var parts = [];
    // bug-hunt I6-1: the engine's real side values are "CS"/"US" (NOT "CSA") — "CS" must be matched
    // first or every player is mislabelled "Union". Legacy aliases kept defensively.
    var sideName = (C.side === "CS" || C.side === "CSA" || C.side === "cs" || C.side === "south") ? "Confederate" : "Union";
    parts.push("Strategic turn");
    // a date/year if the clock carries one
    var yr = (typeof campaignYear === "function") ? campaignYear(C) : (C.clock && C.clock.year);
    if (yr) parts.push("" + yr);
    parts.push("as the " + sideName + " president");
    // the next battle, if the bridge exposes one
    try {
      if (typeof _brgNextBattle === "function") {
        var nb = _brgNextBattle(C);
        if (nb && nb.name) parts.push("Next: " + nb.name);
      }
    } catch (eNB) {}
    return parts.join(". ") + ".";
  } catch (e) { return ""; }
}
function a11yAnnounceTurn(C) { var s = a11yTurnSummary(C); if (s) a11yAnnounce(s); return s; }

/* ===========================================================================
   WRITES + PERSISTENCE (the proven 95-playstyle / T6 pattern).
   =========================================================================== */
function _a11yPersist() {
  try {
    if (typeof localStorage === "undefined" || !G || !G.settings) return;
    // ONLY the genuinely-new flags this module owns. cbAids + reduceMotion are base-owned (they live
    // in the base defaults literal + round-trip through gor_save), so persisting them here would be a
    // dead/duplicate store and a second source of truth — bug-hunt I5-2 / I3-2.
    localStorage.setItem(A11Y.STORE_KEY, JSON.stringify({
      a11yContrast: !!G.settings.a11yContrast,
      a11yDyslexia: !!G.settings.a11yDyslexia,
      a11yNarrate: G.settings.a11yNarrate !== false,
    }));
  } catch (e) {}
}
function _a11ySave() {
  // bug-hunt NEW-1: persist UNCONDITIONALLY (no `&& G.campaign` gate) — exactly like the frozen base
  // Settings buttons. saveLocal serializes G.settings even with no campaign, so a menu-time mode-OFF
  // is written to gor_save immediately; otherwise a stale gor_save would resurrect it on the next
  // Continue (the D123-class bug, here on the module's OWN flags).
  try { if (typeof saveLocal === "function") saveLocal(); } catch (e) {}
  _a11yPersist();
}
/* toggle a mode. Handles the owned a11y flags + the cbAids (CVD) + reduceMotion mirrors,
   re-applies the presentation, and (for the battle-affecting mirrors) refreshes the field. */
function a11yToggle(flag) {
  try {
    if (!G.settings || typeof G.settings !== "object") G.settings = {};
  } catch (e) { return; }
  var battleAffecting = false;
  if (flag === "a11yNarrate") {
    G.settings.a11yNarrate = (G.settings.a11yNarrate === false) ? true : false;
  } else if (flag === "a11yCvd") {
    // CVD owns cbAids DIRECTLY (the single base-owned source of truth — no separate latch).
    G.settings.cbAids = !G.settings.cbAids;
    battleAffecting = true;
  } else if (flag === "reduceMotion") {
    G.settings.reduceMotion = !G.settings.reduceMotion;
    battleAffecting = true;
  } else {
    G.settings[flag] = !G.settings[flag];
  }
  a11yApply();
  _a11ySave();
  if (battleAffecting) {
    try { if (G.mode === "battle") { if (typeof refreshUI === "function") refreshUI(); if (typeof draw === "function") draw(); } } catch (e) {}
  }
}

/* ===========================================================================
   BOOT — load the bundle as DEFAULTS ONLY (a value already on G.settings, e.g. from
   a loaded campaign save, always wins), auto-detect prefers-contrast / prefers-reduced-
   motion, then apply.
   =========================================================================== */
function a11yBootLoad() {
  try {
    if (typeof G === "undefined") return;
    G.settings = G.settings || {};
    if (typeof localStorage !== "undefined") {
      var raw = localStorage.getItem(A11Y.STORE_KEY);
      if (raw) {
        var b = JSON.parse(raw);
        if (b && typeof b === "object") {
          delete b.__proto__; delete b.constructor; delete b.prototype;
          // ONLY the module's own flags (defaults-only — a value already on G.settings, e.g. from a
          // loaded campaign save via applySave, always wins). cbAids + reduceMotion are base-owned and
          // restored by the base (gor_save / prefers-* auto-detect), so they are NOT seeded here.
          if (G.settings.a11yContrast == null && typeof b.a11yContrast === "boolean") G.settings.a11yContrast = b.a11yContrast;
          if (G.settings.a11yDyslexia == null && typeof b.a11yDyslexia === "boolean") G.settings.a11yDyslexia = b.a11yDyslexia;
          if (G.settings.a11yNarrate == null && typeof b.a11yNarrate === "boolean") G.settings.a11yNarrate = b.a11yNarrate;
        }
      }
    }
    // OS preference auto-detect (only sets a still-unset flag — never overrides a choice)
    try {
      if (typeof window !== "undefined" && window.matchMedia) {
        if (G.settings.a11yContrast == null && window.matchMedia("(prefers-contrast: more)").matches) G.settings.a11yContrast = true;
      }
    } catch (eMM) {}
    a11yApply();
  } catch (e) {}
}

/* ===========================================================================
   THE HUB PANEL — one body, two contexts (menu overlay | desk-tab inline, reused by
   95-playstyle's hand-off). Full keyboard/ARIA; CVD-safe (glyph decorative, the word
   label carries the meaning); reduce-motion-safe.
   =========================================================================== */
function _a11yToggleBtn(flag) {
  var on = a11yOn(flag), m = null, i;
  for (i = 0; i < A11Y.modes.length; i++) { if (A11Y.modes[i].flag === flag) { m = A11Y.modes[i]; break; } }
  var name = m ? m.label : flag;
  return '<button id="a11y_' + flag + '" type="button" class="upg" aria-pressed="' + (on ? "true" : "false") + '"'
    + ' data-a11y-flag="' + flag + '"'
    + ' aria-label="' + _a11yEsc(name) + (on ? ": on" : ": off") + '"'
    + ' style="min-width:74px;' + (on ? "outline:2px solid #e8c84a;outline-offset:1px;font-weight:bold;" : "") + '">' + (on ? "On" : "Off") + '</button>';
}
function _a11yRow(m) {
  var on = a11yOn(m.flag);
  return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0;padding-bottom:9px;border-bottom:1px solid #5a4a2e">'
    + '<span style="font-size:13px;color:#f2e8d5;max-width:74%">'
    +   '<span aria-hidden="true" style="color:#c9a85f;margin-right:7px">' + m.glyph + '</span>'
    +   '<b style="letter-spacing:.02em">' + m.label + '</b>'
    +   '<span style="display:block;opacity:.72;font-size:11px;margin:2px 0 0 25px;line-height:1.45">' + m.hint + '</span>'
    + '</span>'
    + '<span style="flex-shrink:0">' + _a11yToggleBtn(m.flag) + '</span></div>';
}
function a11yPanelHTML(ctx) {
  var i, rows = "";
  for (i = 0; i < A11Y.modes.length; i++) rows += _a11yRow(A11Y.modes[i]);
  var titleBlock = (ctx === "menu")
    ? '<h1 class="title-xl" style="text-align:center">Accessibility</h1>'
      + '<p class="title-sub" style="text-align:center">This game is built to be played by everyone. Tune contrast, motion, colour, narration, and type to suit how you read and see. Every choice is saved and applies everywhere &mdash; the menu, the President&rsquo;s Desk, and the battlefield.</p>'
      + '<hr class="rule">'
    : '<div style="font-size:12px;opacity:.8;line-height:1.55;margin-bottom:10px">Tune contrast, motion, colour, narration, and type. Saved and applied everywhere &mdash; menu, Desk, and battlefield.</div>';
  var body = '<div style="' + (ctx === "menu" ? "max-width:600px;margin:0 auto;" : "") + '">'
    + '<div role="group" aria-label="Accessibility modes">' + rows + '</div>'
    // keyboard recap
    + '<div style="margin-top:12px;padding:9px 11px;border-radius:6px;background:#1a150d">'
    +   '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9f845c;margin-bottom:4px">Keyboard</div>'
    +   '<div style="font-size:11.5px;line-height:1.6;color:#e9dcc0">'
    +     'Tab / Shift+Tab move between controls &middot; Enter or Space activates &middot; Esc closes a panel. '
    +     'In battle: <b>Tab</b> next unit &middot; <b>M/F/C/R/D</b> orders &middot; arrows aim &middot; <b>Enter</b> commit &middot; <b>E</b> end turn &middot; <b>?</b> hotkeys.'
    +   '</div>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.66;margin-top:8px;line-height:1.5;color:#e9dcc0">Reduced motion and colour-blind aids also live in the main Settings panel; the controls here are the same settings.</div>';
  var footer = "";
  if (ctx === "menu") {
    footer = '<div class="btn-row" style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
      + '<button id="a11yBack" type="button" class="bigbtn">Back to the Menu</button>'
      + '</div>';
  }
  return titleBlock + body + '</div>' + footer;
}
function a11yWire(ctx) {
  if (typeof document === "undefined") return;
  var btns = document.querySelectorAll('[data-a11y-flag]');
  for (var i = 0; i < btns.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        var flag = b.getAttribute("data-a11y-flag");
        a11yToggle(flag);
        if (typeof toast === "function") { try { var lbl = ""; for (var j = 0; j < A11Y.modes.length; j++) if (A11Y.modes[j].flag === flag) lbl = A11Y.modes[j].label; toast(lbl + ": " + (a11yOn(flag) ? "on" : "off"), 1300); } catch (e) {} }
        a11yAnnounce((function () { var lbl = flag; for (var j = 0; j < A11Y.modes.length; j++) if (A11Y.modes[j].flag === flag) lbl = A11Y.modes[j].label; return lbl + " " + (a11yOn(flag) ? "on" : "off"); })());
        _a11yRerender(ctx, '[data-a11y-flag="' + flag + '"]');
      });
    })(btns[i]);
  }
  if (ctx === "menu") {
    var bk = document.getElementById("a11yBack");
    if (bk) bk.addEventListener("click", function () { if (typeof openMainMenu === "function") openMainMenu(); });
  }
}
function _a11yRerender(ctx, focusSel) {
  // bug-hunt I6-2: the hub is MENU-ONLY in-game — the Play Your Way DESK hand-off is a read-only hint
  // (a desk-context hand-off would tear down the desk sheet, D123.3), so there is no a11y desk tab to
  // refresh. A rerender is therefore always the menu overlay. a11yPanelHTML/a11yWire still accept a ctx
  // (the desk render path is probe-tested + ready for a future desk tab in E3-i2).
  if (typeof openSheet !== "function") return;
  openSheet(a11yPanelHTML("menu")); a11yWire("menu");
  try { var el = focusSel && document.querySelector(focusSel); if (el) el.focus(); } catch (e) {}
}

/* ---- PUBLIC: the main-menu overlay ---- */
function a11yOpenMenu() {
  if (typeof openSheet !== "function") return;
  openSheet(a11yPanelHTML("menu"));
  a11yWire("menu");
  try { var f = document.querySelector('[data-a11y-flag]'); if (f) f.focus(); } catch (e) {}
}

/* ---- main-menu button injection (the canonical fldInjectMenuButton pattern:
   named injector, dedupe by live DOM #gnA11y, re-inject on every menu rebuild) ---- */
function a11yInjectMenuButton() {
  try {
    if (typeof document === "undefined") return;
    if (document.getElementById("gnA11y")) return;
    var col3 = document.querySelector(".gn-col:last-child .gn-classifieds");
    if (!col3 || !col3.parentNode) return;
    var btn = document.createElement("button");
    btn.className = "gn-btn";
    btn.id = "gnA11y";
    btn.setAttribute("aria-label", "Accessibility — high contrast, dyslexia-friendly text, colour-blind safe cues, screen-reader narration, and reduced motion.");
    btn.innerHTML = '<span class="gn-hl">&#9855; ACCESSIBILITY</span>'
      + '<span class="gn-deck">High contrast, dyslexia type, colour-blind cues, screen-reader narration &amp; reduced motion &mdash; play your way.</span>';
    btn.style.marginTop = "8px";
    col3.parentNode.appendChild(btn);
    btn.addEventListener("click", function () { a11yOpenMenu(); });
  } catch (e) {}
}

/* boot: inject the menu button on every menu (re)build, and load + apply settings. */
(function a11yBootMenu() {
  try {
    if (typeof document === "undefined") return;
    var obs = new MutationObserver(function () { a11yInjectMenuButton(); });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
    a11yInjectMenuButton();
  } catch (e) {}
})();
(function a11yBoot() {
  try {
    if (typeof document === "undefined") { a11yBootLoad(); return; }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", a11yBootLoad);
    else a11yBootLoad();
  } catch (e) {}
})();
