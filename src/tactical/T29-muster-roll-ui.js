/* ===========================================================================
   PHASE I (D357) · T29-muster-roll-ui.js — THE ARMY REGISTER MUSTER-ROLL
   INSPECT SURFACE (LANE-002 slice 5a).

   fldMusterRollHtml(u) (T14, probe-vetted since R-5) renders the full
   EA-roster muster panel — men-mean OVR + lazily-materialized person rows —
   but was never wired to a player-reachable surface; the live HUD carried
   only the compact fldMusterHudLine. This module adds the inspect-expand:
   a native <button> in the selected-unit HUD (the first interactive control
   inside #fldHud) that toggles the full panel open/closed.

   GUARDED SEAM: T0's fldRenderHud calls fldMusterRollHudToggle(u) through a
   typeof guard; this function returns "" whenever fldMusterRollHtml(u) is ""
   (no ratings data / no unit) — byte-identical to the pre-T29 HUD there.
   Presentation-only: reads sim state, never writes it — no combat knob, no
   RNG, no G/battle mutation, nothing rides the save (the open flag lives on
   __FIELD and dies with the battle), so D74 AI-vs-AI baselines are untouched.

   ACCESSIBILITY (WCAG 2.2 AA): a real <button> (native Enter/Space), visible
   focus (the engine's :focus-visible outline), aria-expanded + aria-controls,
   the panel as a named region; no animation, so reduceMotion needs no gate.
   fldRenderHud rebuilds the HUD's innerHTML on every event re-render, which
   would silently drop keyboard focus from the recreated button (the S22
   lesson) — the reassignment wrapper below restores it whenever the button
   held focus before the rebuild.
   =========================================================================== */

function fldMusterRollHudToggle(u) {
  if (typeof fldMusterRollHtml !== "function") return "";
  var roll = fldMusterRollHtml(u);
  if (!roll) return "";   // no ratings data / no sample -> the pre-T29 HUD, byte-identical
  var open = !!(typeof __FIELD !== "undefined" && __FIELD && __FIELD._mrOpen);
  return '<div style="margin-top:5px">'
    + '<button id="fldMrBtn" type="button" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="fldMrPanel"'
    /* wcag-auditor: target-size fix (SC 2.5.8 AA) — padding 2px 9px -> 5px 9px raises the
       rendered hit box from ~19-21px to ~25-27px tall, clearing the 24x24px CSS-px minimum;
       font-size left untouched per audit instruction. */
    + ' style="font:inherit;font-size:11px;padding:5px 9px;border:1px solid #745e3f;border-radius:4px;background:#1a1510;color:#d8c9a3;cursor:pointer">'
    + (open ? "Hide muster roll" : "Muster roll&hellip;")
    + '</button>'
    /* wcag-auditor flag (4.1.2) resolved: the panel is ALWAYS in the DOM (hidden when closed)
       so aria-controls never references a nonexistent node — the canonical disclosure pattern. */
    + '<div id="fldMrPanel" role="region" aria-label="Muster roll"' + (open ? '' : ' hidden') + '>' + roll + '</div>'
    + '</div>';
}

/* One delegated document-level listener (registered once at module eval):
   survives every innerHTML rebuild of #fldHud, works for pointer AND the
   native keyboard activation of the button. */
document.addEventListener("click", function (e) {
  var btn = e.target && e.target.closest ? e.target.closest("#fldMrBtn") : null;
  if (!btn) return;
  if (typeof __FIELD === "undefined" || !__FIELD) return;
  __FIELD._mrOpen = !__FIELD._mrOpen;
  if (typeof fldRenderHud === "function") fldRenderHud();
});

/* S22-class focus preservation: fldRenderHud replaces #fldHud's innerHTML on
   every event re-render, destroying the focused toggle button. Wrap it (the
   reassignment-wrapper idiom — all callers resolve the binding at call time)
   to restore focus to the recreated button when it held focus going in. */
fldRenderHud = (function (orig) {
  return function () {
    var hadFocus = false;
    try { hadFocus = !!(document.activeElement && document.activeElement.id === "fldMrBtn"); } catch (e) {}
    var r = orig.apply(this, arguments);
    if (hadFocus) {
      try { var b = document.getElementById("fldMrBtn"); if (b) b.focus(); } catch (e2) {}
    }
    return r;
  };
})(fldRenderHud);
