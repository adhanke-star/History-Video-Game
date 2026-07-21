/* ===========================================================================
   ARC 5 (D489) · T35-muster-desk-ui.js — THE MUSTER-ROLL DESK SURFACE
   (LANE-018 slice 1; the §4e.4 remaining half after T29 shipped the in-battle
   inspect-expand as LANE-002 slice 5a).

   fldMusterRollHtml(u) (T14, probe-vetted since R-5) renders the full muster
   panel — men-mean OVR + the lazily-materialized representative sample — and
   T29 wired it into the in-battle HUD. The STRATEGIC desk never had it: the
   Command desk's Order-of-Battle board (T15) shows per-brigade OVR/men rows
   with no way to inspect the men behind a brigade. This module adds that
   inspect-expand to the board's PLAYER column only.

   GUARDED SEAM: T15's _fldOOBSideExact passes each PLAYER brigade node through
   fldOOBMusterToggle(br, side) behind a typeof guard + an explicit player-side
   flag; the enemy column NEVER receives the flag, so no scout tier can surface
   enemy muster detail through this panel (the Q8b intelligence law). This
   function returns "" whenever the muster machinery is absent or the node
   lacks the vetted shape (id + name + arm + positive men + a real side) —
   byte-identical to the pre-T35 board there.

   Presentation-only: reads the already-built board node, never writes sim,
   campaign, or save state. The open/closed state lives in a module-local map
   keyed by brigade id and dies with the session — nothing rides the save.

   ACCESSIBILITY (WCAG 2.2 AA): a real <button> (native Enter/Space; the
   24x24px CSS-px minimum target honored per the T29 audit), aria-expanded +
   aria-controls, the panel always in the DOM (hidden when closed) as a named
   region. Activation toggles the DOM in place — no re-render — so keyboard
   focus stays on the button naturally (the S22 rebuild-theft never fires on
   toggle); an unrelated desk refresh rebuilds from the state map, keeping the
   panel's open state coherent. No animation, so reduceMotion needs no gate.
   =========================================================================== */

var _mdOpenRolls = {};   /* brigade-id -> true while its desk muster panel is open (session-only) */

function _mdEscHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/* a DOM-id-safe deterministic key for a brigade node id */
function _mdKey(id) { return String(id).replace(/[^A-Za-z0-9_-]/g, "_"); }

function fldOOBMusterToggle(br, side) {
  if (typeof fldMusterRollHtml !== "function") return "";
  if (!br || !br.id || !br.name) return "";
  if (side !== "US" && side !== "CS") return "";
  var men = (typeof br.men === "number" && isFinite(br.men)) ? br.men : 0;
  if (men <= 0) return "";
  /* the vetted unit shape the T14 muster machinery expects (the board node lacks `side`) */
  var u = { id: br.id, name: br.name, arm: br.arm, side: side, men: men,
    commander: (br.commander != null && String(br.commander).length) ? String(br.commander) : null };
  var roll = fldMusterRollHtml(u);
  if (!roll) return "";   /* no ratings data -> the pre-T35 board, byte-identical */
  var key = _mdKey(br.id);
  var open = !!_mdOpenRolls[br.id];
  return '<div style="margin:2px 0 4px 39px">'
    + '<button id="oobMrBtn_' + key + '" type="button" data-oob-mr="' + _mdEscHtml(br.id) + '"'
    + ' aria-expanded="' + (open ? "true" : "false") + '" aria-controls="oobMrPanel_' + key + '"'
    + ' style="font:inherit;font-size:11px;padding:5px 9px;border:1px solid #745e3f;border-radius:4px;background:#1a1510;color:#d8c9a3;cursor:pointer">'
    + (open ? "Hide muster roll" : "Muster roll&hellip;")
    + '</button>'
    + '<div id="oobMrPanel_' + key + '" role="region" aria-label="Muster roll: ' + _mdEscHtml(br.name) + '"' + (open ? '' : ' hidden') + '>' + roll + '</div>'
    + '</div>';
}

/* One delegated document-level listener (registered once at module eval):
   survives every innerHTML rebuild of the desk, works for pointer AND the
   native keyboard activation of the button. Toggles the DOM in place — no
   re-render, so focus never leaves the activated button. */
document.addEventListener("click", function (e) {
  var btn = e.target && e.target.closest ? e.target.closest("[data-oob-mr]") : null;
  if (!btn) return;
  var id = btn.getAttribute("data-oob-mr");
  if (id == null) return;
  var nowOpen = !_mdOpenRolls[id];
  if (nowOpen) _mdOpenRolls[id] = true; else delete _mdOpenRolls[id];
  btn.setAttribute("aria-expanded", nowOpen ? "true" : "false");
  btn.innerHTML = nowOpen ? "Hide muster roll" : "Muster roll&hellip;";
  var panel = document.getElementById("oobMrPanel_" + _mdKey(id));
  if (panel) { if (nowOpen) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", ""); }
});
