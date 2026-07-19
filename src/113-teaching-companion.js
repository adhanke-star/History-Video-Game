/* ===========================================================================
   ARC 1 / LANE-012 Slice 1 · 113-teaching-companion.js — THE ALWAYS-VISIBLE
   TEACHING COMPANION, BOTH MODES (DECISIONS D455; design law
   docs/design/unlocked-but-judged-design.md §1 + §4a.2; AMENDS D416's
   Mayhem comparison-off-by-default — the amendment is recorded in this
   slice's D### entry).

   One rule: THE COMPANION INFORMS; IT NEVER GRADES. Every composer here is a
   PURE READER producing a compact, sourced "In history…" panel beside a live
   surface. Mayhem keeps its chartered no-moral-GPA identity — nothing in this
   module scores, judges, or grades the PLAYER's war; it states what the
   documented record holds, with attributions.

   CITATION LAW (the D111 trust boundary): the companion COMPOSES EXISTING
   COMMITTED SOURCED PROSE — each scenario's own `sources`/`blurb`/`date`/
   `place` family (schema-gated, ≥2 sources), the divergence ledger's hist
   corpus (src/81), and the codex's sourced entries (data/codex.json). The one
   composed Chronicle line below carries its facts VERBATIM from the committed
   codex bodies (nathan-bedford-forrest; united-states-colored-troops) with
   their own committed attributions. Any NEW claim added here MUST satisfy the
   ≥2-source law and stay anti-Lost-Cause.

   SEAMS (all guarded by typeof at the consumer, so ABSENCE of this module
   renders every host surface byte-identically):
     - src/100-h0-battle-briefing.js  -> tcBriefingPanel(bd)   (both modes)
     - src/107-mayhem-rules.js  AAR   -> tcMayhemPanel(C)      (Mayhem AAR)
     - src/107-mayhem-rules.js  Chron -> tcChronicleLine(id)   (per dispatch)
   Historical's divergence tab / AAR read-back / endings section already carry
   the sourced "In history…" corpus by construction (src/81, src/82, src/83) —
   the lane's presence teeth pin that fact instead of double-rendering.

   Bare-name globals; tc/_tc prefixes; renders NEVER mutate or save. NO RNG.
   =========================================================================== */

var _tcEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

/* Verified base-chain id -> tactical-scenario registry key aliases. ONLY pairs
   confirmed to be the SAME battle land here (base name checked against the
   scenario); everything else fails closed to "no panel" — no fabrication.
   (base "newmarket" is New Market 1864, NOT New Market Heights: NOT aliased;
   base "globe"/"crater"/"fortstedman" are distinct Petersburg actions: NOT
   aliased to petersburgAssaults, which is June 15-18, 1864.) */
var _TC_CHAIN_ALIAS = {
  ftdonelson: "fortDonelson",
  gainesmill: "gainesMill",
  malvern: "malvernHill",
  stonesriver: "stonesRiver",
  cedarcreek: "cedarCreek",
  coldharbor: "coldHarbor",
  fiveforks: "fiveForks",
  peariver: "elkhornTavern",            // Pea Ridge — Elkhorn Tavern is the same field
  crosskeys: "crossKeysPortRepublic",   // the scenario covers both 1862 fields
  portrepublic: "crossKeysPortRepublic"
};

/* The canonical scenario for a base campaign-chain battle, or null. Reads ONLY
   the canonical registry (never the custom-content lane). */
function tcScenarioForBattle(bd) {
  if (!bd || !bd.id || typeof fldScenarioRegistry !== "function") return null;
  var R;
  try { R = fldScenarioRegistry(); } catch (e) { return null; }
  if (!R) return null;
  var key = R[bd.id] ? bd.id : _TC_CHAIN_ALIAS[bd.id];
  return (key && R[key]) ? R[key] : null;
}

/* A compact attribution label: the PREFIX of a committed source-register row,
   cut before its URL/fetch tail. A mechanical shortening, never a new claim —
   the probe tooth verifies every rendered label is a prefix of a committed row. */
function _tcAttr(row) {
  var s = String(row == null ? "" : row);
  var cut = s.length;
  var marks = [" (http", " http", " - fetched", " — fetched", ", http"];
  for (var i = 0; i < marks.length; i++) {
    var at = s.indexOf(marks[i]);
    if (at > 0 && at < cut) cut = at;
  }
  s = s.slice(0, cut).replace(/[\s,;:–—-]+$/, "").trim();
  return s.length > 90 ? s.slice(0, 90).replace(/\s+\S*$/, "") : s;
}

function _tcSourcesLine(sources, max) {
  if (!Array.isArray(sources)) return "";
  var out = [];
  for (var i = 0; i < sources.length && out.length < (max || 2); i++) {
    var a = _tcAttr(sources[i]);
    if (a) out.push('<span class="tc-src">' + _tcEsc(a) + '</span>');
  }
  return out.length ? '<div class="tc-sources" style="margin-top:5px;font-size:10.5px;opacity:.72">Sources: ' + out.join(' &middot; ') + '</div>' : "";
}

/* The shared compact panel frame. Factual voice only — the callers compose
   COMMITTED prose into it; no grade, no verdict vocabulary. */
function _tcPanel(bodyHtml, sourcesHtml) {
  return '<aside class="tc-companion" role="note" aria-label="In history — the documented record" '
    + 'style="margin:10px 0;padding:10px 12px;border:1px solid var(--rule,#6b5a3e);border-left:4px solid #cbb27a;border-radius:5px;background:rgba(0,0,0,.12);font-size:12px;line-height:1.5">'
    + '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#cbb27a;font-weight:bold;margin-bottom:3px">In history</div>'
    + bodyHtml + sourcesHtml
    + '</aside>';
}

/* ---- SURFACE 1 · the pre-battle briefing (both modes; wired by src/100). ----
   Composes the scenario's OWN committed corpus: date · place · blurb · its
   ≥2-source register. Fails closed ("" — no panel) for chain battles without
   a committed scenario corpus: no placeholder history, ever. */
function tcBriefingPanel(bd) {
  var sd = tcScenarioForBattle(bd);
  if (!sd || !sd.blurb || !Array.isArray(sd.sources) || sd.sources.length < 2) return "";
  var whenWhere = [sd.date, sd.place].filter(function (v) { return !!v; }).join(" &middot; ");
  var body = (whenWhere ? '<div style="font-weight:bold;font-size:11.5px;margin-bottom:2px">' + whenWhere + '</div>' : '')
    + '<div>' + _tcEsc(sd.blurb) + '</div>';
  return _tcPanel(body, _tcSourcesLine(sd.sources, 2));
}

/* ---- SURFACE 2 · the Mayhem AAR companion (wired by src/107; the D416
   amendment). The juxtaposition is the existing divergence ledger's own
   sourced hist corpus (src/81 divScan) — rendered FACTUALLY: what diverged,
   what the record holds. No index bar, no grade chip, no verdict. Historical
   campaigns return "" (their AAR already carries the divergence read-back). */
function tcMayhemPanel(C) {
  if (typeof mayhemIsActive !== "function" || !mayhemIsActive(C)) return "";
  var entries = (typeof divScan === "function") ? divScan(C) : [];
  var body;
  if (entries && entries.length) {
    var top = entries.slice();
    if (typeof _divTier === "function") top.sort(function (a, b) { return _divTier(b.tier).weight - _divTier(a.tier).weight; });
    top = top.slice(0, 4);
    var lis = "";
    for (var i = 0; i < top.length; i++) {
      lis += '<li style="margin:4px 0"><b>' + _tcEsc(top[i].title) + '</b>'
        + '<div style="opacity:.78;font-style:italic;margin-top:1px">' + _tcEsc(top[i].hist) + '</div></li>';
    }
    body = '<div>Where this timeline has left the documented record — and what the record holds. '
      + 'The companion informs; it does not grade your war.</div>'
      + '<ul style="margin:6px 0 0;padding-left:18px">' + lis + '</ul>';
  } else {
    body = '<div>This timeline still tracks the documented war. As it diverges, the record each departure '
      + 'leaves behind is shown here — information, never a judgment.</div>';
  }
  var foot = '<div class="tc-sources" style="margin-top:5px;font-size:10.5px;opacity:.72">Sources: '
    + '<span class="tc-src">McPherson, Battle Cry of Freedom</span> &middot; <span class="tc-src">Foner, The Fiery Trial</span> &middot; '
    + '<span class="tc-src">Howard Jones, Blue &amp; Gray Diplomacy</span> &middot; <span class="tc-src">Levine, Confederate Emancipation</span></div>';
  return _tcPanel(body, foot);
}

/* ---- SURFACE 3 · the Chronicle juxtaposition (wired by src/107): one
   sourced "In history…" line under a dispatch, keyed by actionId. Facts are
   carried from the committed codex bodies (nathan-bedford-forrest;
   united-states-colored-troops) with their committed attributions; the
   exchange-cartel clause carries the committed prisoner-exchange teaching
   corpus (src/62 / data/prisoner-exchange.json). Unknown ids fail closed. */
function tcChronicleLine(actionId) {
  if (actionId !== "no-quarter" && actionId !== "no-quarter-historical") return "";
  return '<div class="tc-chronicle-line" style="margin:2px 0 4px;padding-left:10px;border-left:3px solid #cbb27a;font-size:11px;line-height:1.5;opacity:.85">'
    + '<span style="text-transform:uppercase;letter-spacing:.06em;font-size:9.5px;color:#cbb27a;font-weight:bold">In history</span> '
    + 'Refusing quarter to surrendering soldiers was a war crime, then and since: at Fort Pillow, Tennessee, on April 12, 1864, '
    + 'troops under Forrest’s command massacred surrendering Union soldiers — the Black defenders, roughly 262 of the garrison, '
    + 'were killed at far higher rates than the white defenders. The prisoner-exchange cartel had already collapsed over the '
    + 'Confederacy’s refusal of equal status for captured Black U.S. soldiers. '
    + '<span class="tc-src" style="opacity:.85">(American Battlefield Trust, “The Most Terrible Ordeal of My Life”; National Archives, '
    + '“Black Soldiers in the U.S. Military During the Civil War”; McPherson, Battle Cry of Freedom.)</span></div>';
}
