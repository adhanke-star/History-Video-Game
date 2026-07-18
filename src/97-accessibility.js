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
   place.

   E3-i2 (D126) — the dedicated FULL WCAG 2.2 AA audit sweep also lands here: _a11yCss() now
   emits an ALWAYS-ON correction block (NOT gated on any mode) that redefines the two TEXT-ONLY
   tokens which failed AA on the dark grounds (--rule -> #a89066, --blood-lt -> #d8745c), adds a
   universal :focus-visible fallback ring, and a pressed-toggle focus override; a11yApply makes
   the base #toast a polite status region; and the high-contrast block gained per-surface
   extensions (desk tabs, the tactical HUD, sheet dialogs, control borders). The matching
   per-site inline-hex/aria fixes live in the individual src/ modules; see DECISIONS D126.

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
  // ALWAYS-ON WCAG 2.2 AA CORRECTION (E3-i2, D126) — not gated on any mode; ships for EVERY
  // player at boot. (1) Redefine the two TEXT-ONLY design tokens that failed AA as small text on
  // the dark grounds: --rule #8a7350 (3.5-4.4:1 secondary labels everywhere) -> #a89066 (>=5.17,
  // the exact tone base.html ALREADY uses for the same fix in its loot/readability cards), and
  // --blood-lt #a83d33 (2.5-3.0:1 — the FIRE order button, #log .e.hit, .tagn, .verdict.lose) ->
  // #d8745c (>=4.96). --blood-lt is text-only in base.html (color: only; adjacent borders use
  // --blood). --rule is text-only EXCEPT a handful of DECORATIVE dark-surface uses (~17 panel
  // borders, the scrollbar-thumb hover, and the .rule divider gradient), which the redefine merely
  // recolors a touch lighter (#8a7350 -> #a89066) — contrast-SAFE (it only raises border contrast,
  // and decorative borders carry no WCAG requirement). The LIGHT main-menu broadsheet (.gn-paper)
  // references NEITHER token, so the redefine cannot touch it. The high-contrast block below re-redefines
  // both at higher specificity, so HC still wins. (2) A universal :focus-visible fallback ring for
  // any bare/custom control the base class rings miss (class rings keep winning by specificity).
  // (3) The pressed-toggle focus override — the inline pressed outline (specificity 1000) hid the
  // focus delta, so !important is required to show a distinct ring when Tabbing onto an On toggle.
  var aa = ':root{--rule:#a89066;--blood-lt:#d8745c;}'
    + ':focus-visible{outline:2px solid var(--brass-lt,#c9a85f);outline-offset:2px;}'
    + '.upg[aria-pressed="true"]:focus-visible{outline:3px solid #ffe27a !important;outline-offset:2px !important;}';
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
  // HIGH-CONTRAST PER-SURFACE EXTENSIONS (E3-i2, D126) — i1's hc block reached the broadsheet
  // containers + the var-driven label classes, but NOT the President's-Desk tab body (#wdContent/
  // #wdTabs), the tactical HUD chrome (#fldHud/#fldBar/#fldRoot), the sheet-dialog headings, or the
  // audio/custom-battle control borders. Blacken those grounds and lift text. The broad text rules
  // deliberately OMIT !important so inline semantic status colours (the now-AA greens/reds) survive
  // on the black ground (they clear 4.5 on #000) while uncoloured text inherits the cream. Every
  // selector is dark-surface-scoped (#wdContent/#wdTabs/[id^=wdTab_]/#fldHud/#fldBar/#fldRoot/.sheet
  // /#fldAudioPanel/.fld-cb) so NONE can match a .gn-* light-menu node. #fldRoot's bg only paints
  // the DOM chrome — the battlefield canvas is drawn over it in JS, unaffected.
  var hcx = 'html[data-a11y-contrast="high"] #wdContent,html[data-a11y-contrast="high"] #wdTabs{background:#000 !important;}'
    + 'html[data-a11y-contrast="high"] #wdContent{color:#f2e6c8;}'
    + 'html[data-a11y-contrast="high"] [id^="wdTab_"]{color:#ffe27a !important;border-color:#ffe27a !important;}'
    + 'html[data-a11y-contrast="high"] [id^="wdTab_"][aria-pressed="true"]{background:#3a2f12 !important;outline:2px solid #ffe27a !important;}'
    + 'html[data-a11y-contrast="high"] #fldHud,html[data-a11y-contrast="high"] #fldBar,html[data-a11y-contrast="high"] #fldRoot{background:#000 !important;}'
    + 'html[data-a11y-contrast="high"] #fldHud{color:#f2e6c8;}'
    + 'html[data-a11y-contrast="high"] .sheet [style*="color:var(--rule)"]{color:#ffe27a !important;}'
    + 'html[data-a11y-contrast="high"] #fldAudioPanel button,html[data-a11y-contrast="high"] #fldBtnAudio,html[data-a11y-contrast="high"] .fld-cb input,html[data-a11y-contrast="high"] .fld-cb select,html[data-a11y-contrast="high"] .fld-cb textarea{border-color:#ffe27a !important;}';
  return aa + "\n" + hc + "\n" + hcx + "\n" + dx;
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
    _a11yEnsureStatusRegions();
  } catch (e) {}
}
/* E3-i2 (D126): make the base toast container a polite assistive-tech STATUS region so transient
   confirmations + errors (save success, "Needs N capital", etc.) are announced (WCAG 4.1.3). The
   #toast element is base-owned, so we only set the missing ARIA, idempotently. */
function _a11yEnsureStatusRegions() {
  try {
    if (typeof document === "undefined") return;
    var t = document.getElementById("toast");
    if (t && !t.getAttribute("aria-live")) { t.setAttribute("aria-live", "polite"); t.setAttribute("role", "status"); t.setAttribute("aria-atomic", "true"); }
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
    // E3-i2 (D126): inject the always-on AA-correction stylesheet synchronously at module load
    // (before first paint) so the token redefine + universal focus ring apply immediately, not
    // only after DOMContentLoaded boot-load.
    try { _a11yEnsureStyleEl(); } catch (eS) {}
    if (typeof document === "undefined") { a11yBootLoad(); return; }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", a11yBootLoad);
    else a11yBootLoad();
  } catch (e) {}
})();

/* ============ S45 (D424): programmatic selected state for the FROZEN Settings segs ============
   base.html's _renderSettings paints seg selection ONLY via the .on class — no aria-pressed,
   aria-selected, or checked input state (WCAG 4.1.2 name/role/value). The base is frozen, so this
   SOURCE-OWNED post-render decorator (the D418 late-additive-wrapper idiom) runs after EVERY
   frozen render, including the rerender each click triggers: each .setrow .seg becomes a
   role=group named by its row's .sl label, and every seg button carries aria-pressed mirrored
   from its .on class. Pure presentation — no click path, settings write, save, or combat surface
   is touched; absent this module the host stays byte-identical. */
function _stA11ySyncSegs(rootEl) {
  var root = rootEl || (typeof document !== "undefined" ? document : null);
  if (!root || !root.querySelectorAll) return 0;
  var segs = root.querySelectorAll(".setrow .seg"), n = 0;
  for (var i = 0; i < segs.length; i++) {
    var seg = segs[i];
    if (seg.getAttribute("role") !== "group") seg.setAttribute("role", "group");
    if (!seg.getAttribute("aria-label")) {
      try {
        var row = seg.parentNode, sl = row && row.querySelector ? row.querySelector(".sl") : null;
        if (sl && sl.textContent) seg.setAttribute("aria-label", sl.textContent);
      } catch (e) {}
    }
    var btns = seg.querySelectorAll("button");
    for (var j = 0; j < btns.length; j++) {
      btns[j].setAttribute("aria-pressed", (btns[j].classList && btns[j].classList.contains("on")) ? "true" : "false");
      n++;
    }
  }
  return n;
}
(function _stA11yInstall() {
  try {
    if (typeof _renderSettings !== "function") return;
    var orig = _renderSettings;
    _renderSettings = function () {
      var r = orig.apply(this, arguments);
      try { _stA11ySyncSegs(document.getElementById("sheetPad") || document); } catch (e) {}
      return r;
    };
  } catch (e) {}
})();

/* ============ S46 (D425): the shared sheet's modal contract + rerender focus persistence ============
   base.html's openSheet/closeSheet swap #sheetPad by innerHTML with no dialog semantics, initial
   focus, trap, or opener restore — and every Settings / save-manager action rerenders the sheet,
   dropping focus to the document. The base is frozen, so this SOURCE-OWNED wrapper (the D418
   idiom) supplies the contract. One structural fact rules the design: the H0 MAIN MENU ITSELF
   renders inside this same sheet (src/98 openMainMenu → openSheet), so content is CLASSIFIED —
   a pad containing .h0-menu is the PAGE (no dialog semantics, no focus steal); anything else is a
   DIALOG (role=dialog + aria-modal + a .title-xl-derived name, initial focus, Tab trap, Escape via
   the sheet's OWN dismiss control, and opener restore BY STABLE ID across the menu rebuild).
   Rerender persistence is also id-keyed: the frozen surfaces reuse stable control ids
   (stDiff_N, slSaveN, slImportPaste …), so the activated control regains focus in the fresh DOM.
   Pure presentation: no click path, save, or combat surface moves. */
var _shOpenerId = "";
var _shOpenerEl = null;
function _shOverlayEl() { return (typeof document !== "undefined") ? document.getElementById("overlay") : null; }
function _shOverlayOpen() { var o = _shOverlayEl(); return !!(o && o.classList && !o.classList.contains("hidden")); }
function _shPadIsMenu(pad) { return !!(pad && pad.querySelector && pad.querySelector(".h0-menu")); }
function _shFocusables(scope) {
  if (!scope || !scope.querySelectorAll) return [];
  var all = scope.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'), out = [];
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (el.disabled) continue;
    if (el.offsetParent === null && (!el.getClientRects || el.getClientRects().length === 0)) continue;
    out.push(el);
  }
  return out;
}
(function _shInstall() {
  try {
    if (typeof openSheet !== "function" || typeof closeSheet !== "function" || typeof document === "undefined") return;
    var origOpen = openSheet, origClose = closeSheet;
    openSheet = function (html) {
      var wasOpen = _shOverlayOpen();
      var padBefore = document.getElementById("sheetPad");
      var fromMenu = wasOpen && _shPadIsMenu(padBefore);
      var prev = document.activeElement;
      var prevId = (prev && prev.id) ? prev.id : "";
      var r = origOpen.apply(this, arguments);
      try {
        var overlay = _shOverlayEl(), pad = document.getElementById("sheetPad");
        if (!overlay || !pad) return r;
        if (_shPadIsMenu(pad)) {
          // the sheet IS the page again — drop dialog semantics; restore the remembered opener by id
          overlay.removeAttribute("role");
          overlay.removeAttribute("aria-modal");
          overlay.removeAttribute("aria-label");
          if (_shOpenerId) {
            var back = document.getElementById(_shOpenerId);
            if (back && typeof back.focus === "function") back.focus();
            _shOpenerId = "";
          }
          _shOpenerEl = null;
        } else {
          overlay.setAttribute("role", "dialog");
          overlay.setAttribute("aria-modal", "true");
          var h = pad.querySelector(".title-xl");
          overlay.setAttribute("aria-label", (h && h.textContent) ? h.textContent : "Game dialog");
          if (fromMenu || !wasOpen) { _shOpenerId = prevId; _shOpenerEl = (prev && prev !== document.body) ? prev : null; }
          var target = (wasOpen && !fromMenu && prevId) ? document.getElementById(prevId) : null;   // id-keyed rerender persistence
          if (!target) target = _shFocusables(pad)[0] || null;                                       // initial focus
          if (target && typeof target.focus === "function") target.focus();
        }
      } catch (e) {}
      return r;
    };
    closeSheet = function () {
      var wasOpen = _shOverlayOpen();
      var r = origClose.apply(this, arguments);
      try {
        var o = _shOverlayEl();
        if (o) { o.removeAttribute("role"); o.removeAttribute("aria-modal"); o.removeAttribute("aria-label"); }
        if (wasOpen && _shOpenerEl && document.contains(_shOpenerEl) && typeof _shOpenerEl.focus === "function") _shOpenerEl.focus();
      } catch (e) {}
      _shOpenerId = ""; _shOpenerEl = null;
      return r;
    };
    document.addEventListener("keydown", function (e) {
      if (!_shOverlayOpen()) return;
      var overlay = _shOverlayEl(), pad = document.getElementById("sheetPad");
      if (!overlay || !pad || _shPadIsMenu(pad)) return;   // the menu is not a dialog
      if (e.key === "Escape") {
        // Escape rides the sheet's OWN dismiss control so each surface's back semantics run;
        // sheets without a registered dismiss (muster choice, pickers, results) keep their flow.
        var dis = document.getElementById("slBack") || document.getElementById("stBack")
          || document.getElementById("hpHelpBack") || document.getElementById("hpWelcomeOk");
        if (dis) { e.preventDefault(); e.stopPropagation(); dis.click(); }
        return;
      }
      if (e.key === "Tab") {
        var f = _shFocusables(overlay);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1], a = document.activeElement;
        if (!overlay.contains(a)) { e.preventDefault(); first.focus(); return; }
        if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
      }
    }, true);
  } catch (e) {}
})();
