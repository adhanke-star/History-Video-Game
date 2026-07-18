/* ============================================================================
   108-tactical-coach.js — GEA-05 + GEA-06 (D440, LANE-010 queue item 8)
   ----------------------------------------------------------------------------
   GEA-05: ONE optional, action-aware "how/why" lesson for issuing and facing an
   order. Keyed by a stable concept id ("order-issue-v1"), shown the first time
   the PLAYER commits an order in a live battle, dismissed into DEVICE-LOCAL
   presentation state (localStorage cw_lessons_v1 — never the save envelope, no
   campaign/sim read-write). The static seven-step tour (src/94) is untouched.

   GEA-06: a READ-ONLY, FOG-SAFE causal ribbon on the selected-brigade HUD. It
   consumes EXISTING stored per-unit values the universal model already computed
   (state, underFire, flankHit, fatigue, morale, ammo, formation, order type) and
   NEVER recomputes an outcome (the D74 acceptance tooth). Fog-safe by
   construction: it renders only for the player's OWN selected brigade
   (fldPlayerSel filters to the player side) and reads no enemy state.

   Both surfaces are guarded no-ops when the tactical layer is absent. No
   combat, sim, save, grade, or history change. Bare-name globals only.
   ========================================================================== */

var _TC_LESSON_KEY = "cw_lessons_v1";
var _TC_LESSONS = {
  "order-issue-v1": {
    title: "Your first order",
    how: "Drag from your brigade across open ground to march it - the drag DIRECTION sets its facing when it arrives. Drag ONTO an enemy brigade to charge that brigade. Shift+drag queues waypoints; M opens the keyboard order cursor.",
    why: "Civil War brigades fought by facing: a line delivers its volleys FORWARD, so a unit facing the wrong way is a target, not a threat. Columns march faster but fight thin - form line (L) before contact. Orders take time to execute; commit early, not perfectly."
  }
};

function _tcReadDismissed() {
  var raw = null;
  try { raw = localStorage.getItem(_TC_LESSON_KEY); } catch (e) { return {}; }
  if (!raw) return {};
  var j = null;
  try { j = JSON.parse(raw); } catch (e2) { return {}; }
  if (!j || typeof j !== "object" || Array.isArray(j) || j.version !== 1 || !j.dismissed || typeof j.dismissed !== "object" || Array.isArray(j.dismissed)) return {};
  var out = {};
  for (var k in j.dismissed) if (Object.prototype.hasOwnProperty.call(j.dismissed, k) && /^[a-z0-9-]{1,40}$/.test(k) && j.dismissed[k] === true) out[k] = true;
  return out;
}
function _tcDismiss(conceptId) {
  var d = _tcReadDismissed();
  d[conceptId] = true;
  try { localStorage.setItem(_TC_LESSON_KEY, JSON.stringify({ version: 1, dismissed: d })); } catch (e) {}
}
function _tcEsc(v) {
  return (typeof htmlEsc === "function") ? htmlEsc(v)
    : String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* GEA-05: show the lesson card once per concept. Pure presentation over #fldRoot. */
var _tcShowing = false;
function tcMaybeShowLesson(conceptId) {
  if (_tcShowing) return;
  var lesson = _TC_LESSONS[conceptId];
  if (!lesson) return;
  if (_tcReadDismissed()[conceptId] === true) return;
  var root = document.getElementById("fldRoot");
  if (!root || document.getElementById("tcLesson")) return;
  _tcShowing = true;
  var card = document.createElement("div");
  card.id = "tcLesson";
  card.setAttribute("role", "note");
  card.setAttribute("aria-label", "Tactics lesson: " + lesson.title);
  card.style.cssText = "position:absolute;right:12px;bottom:64px;z-index:5600;max-width:340px;background:#0c0f14ee;border:1px solid #8b7a56;border-radius:7px;padding:12px 14px;color:#e6dcc3;font-size:12.5px;line-height:1.5;";
  card.innerHTML =
    '<div style="font-weight:bold;color:#d8c87a;margin-bottom:4px;">' + _tcEsc(lesson.title) + '</div>' +
    '<div><b>How:</b> ' + _tcEsc(lesson.how) + '</div>' +
    '<div style="margin-top:5px;"><b>Why:</b> ' + _tcEsc(lesson.why) + '</div>' +
    '<div style="margin-top:9px;display:flex;gap:8px;">' +
      '<button type="button" id="tcLessonGotIt" style="font-size:12px;padding:5px 12px;background:#2a2418;border:1px solid #8b7a56;color:#cdb87f;border-radius:4px;cursor:pointer;">Got it &mdash; don&#39;t show again</button>' +
      '<button type="button" id="tcLessonLater" style="font-size:12px;padding:5px 10px;background:none;border:1px solid #5a4f3a;color:#b0a586;border-radius:4px;cursor:pointer;">Close</button>' +
    '</div>';
  root.appendChild(card);
  var remove = function () { try { if (card.parentNode) card.parentNode.removeChild(card); } catch (e) {} };
  var gotIt = document.getElementById("tcLessonGotIt");
  var later = document.getElementById("tcLessonLater");
  if (gotIt) gotIt.addEventListener("click", function () { _tcDismiss(conceptId); remove(); });
  if (later) later.addEventListener("click", remove);   // close-only: eligible to reappear next battle (device state untouched)
}

/* The action-aware hook: the first PLAYER-committed order in a live battle fires the lesson.
   Installed as a guarded wrapper over fldOrderMove (the shared move/charge commit path) —
   AI-issued orders (u.ai) and non-battle phases never fire it. */
(function tcInstallOrderHook() {
  if (typeof fldOrderMove !== "function" || fldOrderMove._tcWrapped === true) return;
  var base = fldOrderMove;
  var wrapped = function (u) {
    try {
      if (u && !u.ai && typeof __FIELD !== "undefined" && __FIELD && __FIELD.launched &&
          (__FIELD.phase === "battle" || __FIELD.phase === "deploy") && __FIELD.rendererKind !== "none") {
        tcMaybeShowLesson("order-issue-v1");
      }
    } catch (e) {}
    return base.apply(this, arguments);
  };
  for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) { try { wrapped[k] = base[k]; } catch (e2) {} }
  wrapped._tcWrapped = true;
  wrapped._tcDelegate = base;
  fldOrderMove = wrapped;
})();

/* ---- GEA-06: the causal ribbon (called from fldRenderHud's guarded helper line). ----
   Reads ONLY existing stored fields on the player's own selected unit; returns "" when
   nothing needs explaining (a steady, fresh, supplied brigade renders no ribbon). */
function fldCausalRibbonHTML(u) {
  if (!u || !u.alive) return "";
  var causes = [];
  try {
    if (u.state === "routing") causes.push("ROUTING - morale broke; it will run until rallied");
    else if (u.state === "shaken") causes.push("shaken - fights and moves at a fraction");
    if (u.flankHit > 0) causes.push("flanked - taking fire from beyond its facing (line can't reply)");
    else if (u.underFire > 0) causes.push("under fire");
    if (u.fatigue >= 60) causes.push("exhausted (" + Math.round(u.fatigue) + ") - slower march, weaker volleys");
    else if (u.fatigue >= 35) causes.push("tiring (" + Math.round(u.fatigue) + ")");
    if (u.morale <= 35 && u.state !== "routing") causes.push("wavering - morale " + Math.round(u.morale) + " of " + Math.round(u.maxMor));
    if (u.ammo <= 25) causes.push("ammunition low (" + Math.round(u.ammo) + ") - volleys weaken until resupplied");
    if (u.formation === "column") causes.push("in column - marches fast, fights thin");
    if (u.order && u.order.type === "charge") causes.push("committed to the charge - it will not answer new orders until it strikes home or breaks");
  } catch (e) { return ""; }
  if (!causes.length) return "";
  var out = "";
  for (var i = 0; i < causes.length && i < 4; i++) out += (out ? " &middot; " : "") + _tcEsc(causes[i]);
  return '<div class="tcRibbon" role="note" aria-label="Why this brigade is fighting the way it is" style="margin-top:4px;padding:4px 7px;border-left:2px solid #cbb27a;background:rgba(0,0,0,.18);font-size:11px;opacity:.88;line-height:1.45;">' + out + '</div>';
}
