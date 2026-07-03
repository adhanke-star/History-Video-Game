/* ===========================================================================
   E2 · 94-tutorial.js — THE GUIDED TUTORIAL (S4 education; V1-CHECKLIST E2
   increment 3; DECISIONS D121-next). A self-contained, multi-step guided tour
   that orients a new player across all three layers (owner-mode grand strategy ·
   real-time tactical battles · the history/codex seminar) — the sequenced
   onboarding the static welcome/help cards (src/92-help-overlay.js) are not.

   Surfaced from THREE entry points wired in 92-help-overlay.js (the help spine):
   the first-launch welcome card, the How-to-Play panel, and a main-menu button.
   Self-managed modal overlay (#tutOverlay) with Back / Next / Skip, a step
   indicator + progress dots, full keyboard control (Esc / Left / Right / Enter),
   a focus trap, ARIA dialog semantics, and reduce-motion-safe transitions.

   PURE UI / HELP LAYER (byte-identical combat BY CONSTRUCTION): the tutorial reads
   no campaign/sim state and writes nothing but a localStorage "seen" flag; no
   tactical/combat/tick/resolve/bridge path references the tut or _tut helpers. NO RNG.

   Bare-name globals (document, localStorage, G for reduceMotion); tut/_tut-prefixed;
   no literal comment-closer in a block comment.
   =========================================================================== */

var _TUT_SEEN_KEY = "gor_tour_seen";
var _tutIdx = 0;
var _tutPrevFocus = null;

/* The tour content — orientation copy (NOT citation-grade data; the same trust
   model as the welcome card). Accurate + anti-Lost-Cause; the title carries the
   meaning, the glyph is decorative. */
var _TUT_STEPS = [
  { glyph: "&#9733;", title: "Welcome, Mr. President",
    body: "You command an entire war in three layers. From the Executive Mansion you run the <strong>grand strategy</strong> &mdash; the economy, the blockade, manpower, diplomacy, and politics. On the field you fight <strong>real-time tactical battles</strong> in the style of <em>Ultimate General: Gettysburg</em>. And throughout, a <strong>history seminar</strong> teaches the real war &mdash; citation-grade and anti&#8209;Lost&#8209;Cause. This tour takes about a minute." },
  { glyph: "&#9813;", title: "The President's Desk",
    body: "Between battles, the Desk auto-surfaces and the war is yours to run. Its tabs cover <strong>the War Effort</strong> (economy, manpower &amp; the home front), <strong>the Treasury</strong>, <strong>Diplomacy &amp; the blockade</strong>, <strong>the Armory</strong> (buy weapons &amp; artillery), <strong>Command</strong> (appoint and promote your generals), <strong>Decisions</strong>, <strong>the Press</strong>, and <strong>Paths to Victory</strong>. One click skips the Desk and returns you to the field." },   /* C21 (D233): no "Manpower" tab exists — manpower lives inside The War Effort */
  { glyph: "&#9878;", title: "The Great Decisions",
    body: "History turns on choices. The Desk surfaces curated <strong>decision cards</strong> with honest trade-offs &mdash; whether and when to proclaim <em>emancipation</em>, how hard to wage the war, whether to sue for peace. The great <em>hinge</em> cards bend your war toward one of its possible endings. Each card shows the real record in several voices &mdash; and names, then refutes, the Lost Cause myth around it." },
  { glyph: "&#9876;", title: "The Battles",
    body: "The army you build fields here in real time. <strong>Click</strong> a brigade to select it (or press <kbd>A</kbd> for all); <strong>drag</strong> from open ground to maneuver, the facing following your drag. Order <kbd>L</kbd>ine, <kbd>C</kbd>olumn, <kbd>H</kbd>old, or <kbd>F</kbd> to charge. <strong>Flanking is devastating</strong> &mdash; get on the enemy's side or rear to break his morale. Press <kbd>?</kbd> in battle for the full controls." },
  { glyph: "&#128218;", title: "The Codex &amp; the Glossary",
    body: "When a term is unfamiliar, the game explains it. The <strong>Codex</strong> tab is a sourced encyclopedia of the war &mdash; its people, units, terms, and the very systems you command &mdash; searchable and cross-linked. And in the teaching panels, key terms carry a faint dotted underline: <strong>hover, tap, or focus</strong> one and its definition appears, drawn from that same Codex." },
  { glyph: "&#9819;", title: "Winning the War",
    body: "There is more than one honest path. Win the battles outright; or break the enemy's <strong>will to fight</strong> for a negotiated peace; or, as the Confederacy, win a European power's <strong>recognition</strong>. However it ends, a graded <strong>After-Action report</strong> scores the whole war you fought &mdash; the battlefield, the treasury, diplomacy, the home front, your purpose, and your high command &mdash; and faces honestly the Reconstruction to come." },
  { glyph: "&#9881;", title: "Play Your Way",
    body: "The game bends to you, not the reverse. Toggle <strong>reduced motion</strong>, fog of war, and (from the menu) the <strong>Command &amp; Realism</strong> presets for an easier or harder fight. Press <kbd>?</kbd> anytime for help. When you're ready: muster a <strong>Union</strong> or <strong>Confederate</strong> campaign, or try a standalone battle &mdash; First Bull Run, Antietam, Shiloh, and more. To the field." }
];

var _tutEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
function _tutReduce() { try { return !!(G && G.settings && G.settings.reduceMotion); } catch (e) { return false; } }
function _tutTotal() { return _TUT_STEPS.length; }

/* the focusable controls inside the overlay (for the focus trap) */
function _tutFocusable() {
  var ov = document.getElementById("tutOverlay");
  if (!ov) return [];
  var nodes = ov.querySelectorAll("button:not([disabled])");
  return Array.prototype.slice.call(nodes);
}

/* render the current step into the overlay */
function _tutRender() {
  var ov = document.getElementById("tutOverlay");
  if (!ov) return;
  var n = _tutTotal();
  if (_tutIdx < 0) _tutIdx = 0;
  if (_tutIdx > n - 1) _tutIdx = n - 1;
  var step = _TUT_STEPS[_tutIdx];
  var last = (_tutIdx === n - 1), first = (_tutIdx === 0);
  // progress dots (CVD-safe: the "Step N of M" text carries the meaning; dots are decorative)
  var dots = "";
  for (var i = 0; i < n; i++) dots += '<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 3px;background:' + (i === _tutIdx ? "var(--brass-lt,#c9a85f)" : "rgba(201,168,95,.28)") + '"></span>';
  ov.querySelector("#tutGlyph").innerHTML = step.glyph;
  var title = ov.querySelector("#tutTitle");
  title.innerHTML = step.title;
  // fold the position into the title's accessible name so the per-step focus move
  // announces BOTH where you are and the heading (TUT-A11Y-03).
  title.setAttribute("aria-label", "Step " + (_tutIdx + 1) + " of " + n + ": " + title.textContent);
  ov.querySelector("#tutBody").innerHTML = step.body;
  ov.querySelector("#tutStepInd").textContent = "Step " + (_tutIdx + 1) + " of " + n;
  ov.querySelector("#tutDots").innerHTML = dots;
  var back = ov.querySelector("#tutBack");
  back.disabled = first;
  back.style.visibility = first ? "hidden" : "visible";
  var next = ov.querySelector("#tutNext");
  next.textContent = last ? "To the Field" : "Next ›";
  next.setAttribute("aria-label", last ? "Finish the tour and go to the main menu" : "Next step");
  // move focus to the step title so a screen-reader announces the new step
  try { title.focus(); } catch (e) {}
}

function _tutNext() { if (_tutIdx >= _tutTotal() - 1) { _tutClose(true); return; } _tutIdx++; _tutRender(); }
function _tutBack() { if (_tutIdx > 0) { _tutIdx--; _tutRender(); } }

function _tutClose(completed) {
  var ov = document.getElementById("tutOverlay");
  try { localStorage.setItem(_TUT_SEEN_KEY, "1"); } catch (e) {}
  _tutSetBgInert(false);   // restore the background's SR visibility
  if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
  document.removeEventListener("keydown", _tutKey, true);
  var pf = _tutPrevFocus; _tutPrevFocus = null;
  if (pf && pf.focus) { try { pf.focus(); } catch (e2) {} }
}

function _tutKey(e) {
  if (!document.getElementById("tutOverlay")) return;
  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); _tutClose(false); return; }
  if (e.key === "ArrowRight") { e.preventDefault(); _tutNext(); return; }
  if (e.key === "ArrowLeft") { e.preventDefault(); _tutBack(); return; }
  if (e.key === "Enter") { var t = e.target; if (t && t.id === "tutTitle") { e.preventDefault(); _tutNext(); return; } }
  if (e.key === "Tab") {
    // Explicit, symmetric focus trap over the visible+enabled controls in DOM order
    // ([Skip, (Back), Next]); the announce-only title (tabindex=-1) routes INTO the
    // cycle. preventDefault in every case so native Tab can never escape the dialog,
    // and forward Tab always reaches Skip (TUT-A11Y-01 / TUT-DOM-02).
    var seq = _tutFocusable(); if (!seq.length) return;
    var titleEl = document.getElementById("tutTitle");
    var act = document.activeElement, idx = seq.indexOf(act);
    e.preventDefault();
    if (act === titleEl || idx === -1) { (e.shiftKey ? seq[seq.length - 1] : seq[0]).focus(); return; }
    var ni = e.shiftKey ? idx - 1 : idx + 1;
    if (ni < 0) ni = seq.length - 1;
    if (ni >= seq.length) ni = 0;
    seq[ni].focus();
  }
}

/* Make the background (everything but the tour + the glossary tooltip) inert for
   assistive tech while the modal is open; restore exactly what we hid on close. The
   JS focus trap handles keyboard containment; this handles the SR reading order. */
var _tutHidden = [];
function _tutSetBgInert(on) {
  var body = document.body; if (!body) return;
  if (on) {
    _tutHidden = [];
    var kids = body.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el.id === "tutOverlay" || el.id === "glTip") continue;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE") continue;
      if (el.getAttribute("aria-hidden") === "true") continue;   // already hidden — leave it (and don't un-hide it later)
      el.setAttribute("aria-hidden", "true");
      _tutHidden.push(el);
    }
  } else {
    for (var j = 0; j < _tutHidden.length; j++) { try { _tutHidden[j].removeAttribute("aria-hidden"); } catch (e) {} }
    _tutHidden = [];
  }
}

/* PUBLIC: start (or restart) the guided tour. */
function tutStart() {
  if (typeof document === "undefined") return;
  var existing = document.getElementById("tutOverlay");
  if (!existing) _tutPrevFocus = document.activeElement || null;   // capture the launcher BEFORE teardown; a double-start must not clobber it to <body> (TUT-CORR-01)
  if (existing) { _tutSetBgInert(false); if (existing.parentNode) existing.parentNode.removeChild(existing); }   // restore the prior inert set before re-inerting (no double-start aria-hidden leak)
  _tutIdx = 0;
  var ov = document.createElement("div");
  ov.id = "tutOverlay";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-labelledby", "tutTitle");
  ov.setAttribute("aria-describedby", "tutBody");
  ov.style.cssText = "position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:20px;font-family:Georgia,serif";
  ov.innerHTML =
    /* wcag-auditor: #tutSkip focus-visible ring — bare button with background:none/border:none
       strips all UA chrome; without an explicit ring the UA default is invisible on the dark
       panel. Matches the established brass-outline pattern used for every other button class
       (bigbtn, tbtn, obtn, etc.) in base.html lines 7748-7771. #c9a85f on #1a1610 = 7.93:1
       (AA ✓ for 3:1 non-text / focus indicator). */
    '<style>#tutSkip:focus-visible{outline:2px solid var(--brass-lt,#c9a85f);outline-offset:2px;border-radius:2px}'
      // E3-i2 (D126): the step heading is focused programmatically each step but had inline
      // outline:none -> no visible focus indicator (WCAG 2.4.7). Give it a real ring (the inline
      // outline:none is also dropped below so this rule can take effect).
      + '#tutTitle:focus-visible{outline:2px solid var(--brass-lt,#c9a85f);outline-offset:3px;border-radius:2px}</style>' +
    '<div style="background:#1a1610;border:2px solid #8b7a56;border-radius:8px;max-width:540px;width:100%;max-height:86vh;overflow-y:auto;color:#e8dcc0;padding:22px 26px;box-shadow:0 8px 30px rgba(0,0,0,.6)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<div id="tutStepInd" style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--brass-lt,#c9a85f)"></div>' +
        '<button id="tutSkip" type="button" style="background:none;border:none;color:#cdb87f;font-size:12px;cursor:pointer;text-decoration:underline;font-family:inherit" aria-label="Skip the tour">Skip</button>' +
      '</div>' +
      '<div id="tutGlyph" aria-hidden="true" style="font-size:30px;text-align:center;color:var(--brass-lt,#c9a85f);margin:4px 0 2px"></div>' +
      '<h2 id="tutTitle" tabindex="-1" style="font-size:20px;text-align:center;margin:0 0 10px;color:var(--brass-lt,#c9a85f)"></h2>' +
      '<div id="tutBody" style="font-size:14px;line-height:1.65;min-height:96px"></div>' +
      '<div id="tutDots" style="text-align:center;margin:14px 0 12px"></div>' +
      '<div style="display:flex;justify-content:space-between;gap:10px">' +
        '<button id="tutBack" type="button" class="bigbtn" style="font-size:13px;padding:6px 16px">‹ Back</button>' +
        '<button id="tutNext" type="button" class="bigbtn" style="font-size:13px;padding:6px 18px"></button>' +
      '</div>' +
    '</div>';
  if (!_tutReduce()) { ov.style.opacity = "0"; ov.style.transition = "opacity .15s ease"; }
  (document.body || document.documentElement).appendChild(ov);
  _tutSetBgInert(true);   // aria-hide the background while the modal is up (TUT-A11Y-02)
  // wire (delegated-ish: direct, the elements are stable for the overlay's life)
  ov.querySelector("#tutNext").addEventListener("click", _tutNext);
  ov.querySelector("#tutBack").addEventListener("click", _tutBack);
  ov.querySelector("#tutSkip").addEventListener("click", function () { _tutClose(false); });
  ov.addEventListener("click", function (e) { if (e.target === ov) _tutClose(false); });   // click the scrim to dismiss
  document.addEventListener("keydown", _tutKey, true);
  _tutRender();
  if (!_tutReduce()) { void ov.offsetWidth; ov.style.opacity = "1"; }
}

/* Has the player seen the tour? (for the welcome card's first-launch offer) */
function tutSeen() { try { return !!localStorage.getItem(_TUT_SEEN_KEY); } catch (e) { return false; } }
