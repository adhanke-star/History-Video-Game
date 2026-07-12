/* ============================================================================
   D386 · 39-women-war-arc.js — the Women-in-War playable arc (M3, spec D385).

   Renders an interactive documented-chapter walk-through for the four arc
   records in data/women-in-war.json (Edmonds, Cashier, Clayton, Barton),
   INSIDE the D153 presentation lane. Pure presentation:
   - no combat, bridge, save, or registry touch; chapter position lives in a
     module-local map and dies with the page (D360 nothing-rides-the-save);
   - the played-ground reflection READS C.completed and any existing journey
     career rows; it never initializes, writes, or launches anything;
   - THE REGISTER LAW (spec §3): a chapter tied to a game battle renders the
     "documented" treatment ONLY when the stage is Verified; every other tied
     chapter renders the visually and textually distinct "claimed" treatment.
   38-women-in-war.js calls wiwArcSectionHTML/wiwWireArcs through typeof
   guards, so this module absent (or a record without `arc`) is a no-op.
   WCAG 2.2 AA per the T29 canonical disclosure pattern: native buttons,
   aria-expanded/controls, always-in-DOM hidden panel, >=24px targets,
   aria-current on the active chapter, aria-live=polite body, no animation.
   ========================================================================== */

var _wiwArcOpen = {};   /* record id -> disclosure open (ephemeral) */
var _wiwArcStep = {};   /* record id -> active chapter index (ephemeral) */

/* Tie map (spec §3): tactical key -> { classic id, display name }. Display
   names are presentation copy so this module reads no tactical registry. */
var _WIW_ARC_TIES = {
  bullrun1: { classic: "bullrun1", name: "First Bull Run" },
  malvernHill: { classic: "malvern", name: "Malvern Hill" },
  antietam: { classic: "antietam", name: "Antietam" },
  fredericksburg: { classic: "fredericksburg", name: "Fredericksburg" },
  fortDonelson: { classic: "ftdonelson", name: "Fort Donelson" },
  stonesRiver: { classic: "stonesriver", name: "Stones River" },
  vicksburg: { classic: "vicksburg", name: "Vicksburg" }
};

function _wiwArcSafeId(id) { return String(id == null ? "" : id).replace(/[^A-Za-z0-9_-]/g, ""); }

function _wiwArcPlayed(C, tieKey) {
  var tie = _WIW_ARC_TIES[tieKey];
  if (!tie) return false;
  try {
    if (C && Array.isArray(C.completed) && C.completed.indexOf(tie.classic) >= 0) return true;
    var L = C && C.loot;
    var J = L && L.journey;
    var career = J && Array.isArray(J.career) ? J.career : [];
    var nameLc = tie.name.toLowerCase();
    for (var i = 0; i < career.length; i++) {
      var row = career[i];
      if (!row) continue;
      if (row.battleId === tie.classic || row.battleId === tieKey) return true;
      if (row.battleName && String(row.battleName).toLowerCase().indexOf(nameLc) >= 0) return true;
    }
  } catch (e) { /* read-only best effort: never let reflection break the card */ }
  return false;
}

function _wiwArcTieHTML(r, s, C) {
  if (!s.gameBattleTie || !_WIW_ARC_TIES[s.gameBattleTie]) return "";
  var tie = _WIW_ARC_TIES[s.gameBattleTie];
  var documented = s.tieRegister === "documented" && s.stageProvenance === "Verified";
  var who = _wiwEsc(r.canonicalName);
  var line, color, label;
  if (documented) {
    color = "#9fc3b0";
    label = "Documented ground";
    line = "This ground is in the game: " + _wiwEsc(tie.name) + ". The record puts " + who + " here.";
  } else {
    color = "#e8b46a";
    label = "Claimed, not documented";
    line = "This ground is in the game: " + _wiwEsc(tie.name) + ". Only later accounts or self-report place " + who + " here — no service record confirms it.";
  }
  var played = _wiwArcPlayed(C, s.gameBattleTie)
    ? '<div style="margin-top:4px;font-size:11px;color:#cbb27a"><b>Your war has fought this ground.</b></div>'
    : "";
  return '<div class="wiw-arc-tie" data-wiw-arc-tie="' + (documented ? "documented" : "claimed") + '" style="margin-top:8px;border:1px ' + (documented ? "solid" : "dashed") + ' ' + color + ';border-radius:5px;padding:7px;font-size:11.5px;line-height:1.45">'
    + '<b style="color:' + color + '">' + label + ':</b> ' + line + played + '</div>';
}

function _wiwArcStageHTML(r, idx, C) {
  var stages = r.arc && Array.isArray(r.arc.stages) ? r.arc.stages : [];
  var s = stages[idx];
  if (!s) return "";
  var provColor = _wiwProvColor(s.stageProvenance);
  return '<h4 style="margin:0 0 2px;font-size:14px;line-height:1.3">' + _wiwEsc(s.title) + '</h4>'
    + '<div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:3px 0 6px">'
    + _wiwChip(s.stageProvenance || "Inferred", provColor)
    + '<span style="font-size:11px;opacity:.78">' + _wiwEsc(s.dateRange) + '</span>'
    + '<span style="font-size:11px;opacity:.6">Chapter ' + (idx + 1) + ' of ' + stages.length + '</span>'
    + '</div>'
    + '<p style="margin:0;font-size:12.5px;line-height:1.55">' + _wiwEsc(s.what) + '</p>'
    + (s.disputeNote ? '<div style="margin-top:7px;border:1px solid #e8b46a;border-radius:5px;padding:7px;background:rgba(232,180,106,.10);font-size:11px;line-height:1.45"><b>Dispute note:</b> ' + _wiwEsc(s.disputeNote) + '</div>' : "")
    + _wiwArcTieHTML(r, s, C)
    + _wiwArcStageSourcesHTML(r, s);
}

function _wiwArcStageSourcesHTML(r, s) {
  var refs = Array.isArray(s.sourceRefs) ? s.sourceRefs : [];
  var srcs = Array.isArray(r.sources) ? r.sources : [];
  var names = [];
  for (var i = 0; i < refs.length; i++) {
    var src = srcs[refs[i]];
    if (src) names.push(_wiwEsc(src.title || src.repository || "Source"));
  }
  if (!names.length) return "";
  return '<div style="margin-top:6px;font-size:10.5px;opacity:.72"><b>Chapter sources:</b> ' + names.join(" · ") + '</div>';
}

function _wiwArcStepsHTML(r, active) {
  var stages = r.arc.stages;
  var rid = _wiwArcSafeId(r.id);
  var h = '<div id="wiwArcSteps_' + rid + '" role="group" aria-label="Chapters of ' + _wiwAttr(r.arc.title) + '" style="display:flex;flex-wrap:wrap;gap:4px;margin:7px 0">';
  for (var i = 0; i < stages.length; i++) {
    var cur = i === active;
    h += '<button type="button" data-wiw-arc-step="' + i + '" data-wiw-arc-rec="' + _wiwAttr(r.id) + '"'
      + (cur ? ' aria-current="step"' : "")
      + ' aria-label="Chapter ' + (i + 1) + ': ' + _wiwAttr(stages[i].title) + '"'
      + ' style="font:inherit;font-size:11px;min-width:26px;padding:5px 8px;border-radius:4px;cursor:pointer;border:1px solid ' + (cur ? "#c9a85f" : "#745e3f") + ';background:' + (cur ? "#33270f" : "#1a1510") + ';color:' + (cur ? "#f0dfae" : "#d8c9a3") + '">'
      + (i + 1) + '</button>';
  }
  return h + '</div>';
}

function _wiwArcPanelInnerHTML(r, C) {
  var active = Math.min(_wiwArcStep[r.id] || 0, r.arc.stages.length - 1);
  return '<p style="margin:6px 0 0;font-size:12px;line-height:1.5;opacity:.85">' + _wiwEsc(r.arc.intro) + '</p>'
    + _wiwArcStepsHTML(r, active)
    + '<div id="wiwArcBody_' + _wiwArcSafeId(r.id) + '" aria-live="polite" style="border:1px solid var(--rule);border-radius:5px;padding:9px;background:rgba(0,0,0,.12)">'
    + _wiwArcStageHTML(r, active, C)
    + '</div>'
    + '<div style="display:flex;gap:6px;margin-top:7px">'
    + '<button type="button" data-wiw-arc-nav="-1" data-wiw-arc-rec="' + _wiwAttr(r.id) + '" style="font:inherit;font-size:11px;padding:5px 10px;border:1px solid #745e3f;border-radius:4px;background:#1a1510;color:#d8c9a3;cursor:pointer">&larr; Previous chapter</button>'
    + '<button type="button" data-wiw-arc-nav="1" data-wiw-arc-rec="' + _wiwAttr(r.id) + '" style="font:inherit;font-size:11px;padding:5px 10px;border:1px solid #745e3f;border-radius:4px;background:#1a1510;color:#d8c9a3;cursor:pointer">Next chapter &rarr;</button>'
    + '</div>';
}

function wiwArcSectionHTML(r, C) {
  if (!r || !r.arc || !Array.isArray(r.arc.stages) || !r.arc.stages.length) return "";
  var rid = _wiwArcSafeId(r.id);
  var open = !!_wiwArcOpen[r.id];
  return '<div class="wiw-arc" data-wiw-arc="' + _wiwAttr(r.id) + '" style="margin-top:9px">'
    + '<button id="wiwArcBtn_' + rid + '" type="button" data-wiw-arc-btn="' + _wiwAttr(r.id) + '" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="wiwArcPanel_' + rid + '"'
    + ' style="font:inherit;font-size:11.5px;padding:6px 10px;border:1px solid #c9a85f;border-radius:4px;background:#241b0e;color:#f0dfae;cursor:pointer">'
    + (open ? "Close the arc" : "Follow the arc: " + _wiwEsc(r.arc.title) + " &hellip;")
    + '</button>'
    + '<div id="wiwArcPanel_' + rid + '" role="region" aria-label="' + _wiwAttr(r.arc.title) + '"' + (open ? "" : " hidden") + '>'
    + _wiwArcPanelInnerHTML(r, C)
    + '</div></div>';
}

function _wiwArcRecordById(id) {
  var records = _wiwRecords();
  for (var i = 0; i < records.length; i++) if (records[i] && records[i].id === id) return records[i];
  return null;
}

function _wiwArcRerender(id, C) {
  var r = _wiwArcRecordById(id);
  if (!r || !r.arc) return;
  var rid = _wiwArcSafeId(id);
  var btn = document.getElementById("wiwArcBtn_" + rid);
  var panel = document.getElementById("wiwArcPanel_" + rid);
  if (!btn || !panel) return;
  var open = !!_wiwArcOpen[id];
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.innerHTML = open ? "Close the arc" : "Follow the arc: " + _wiwEsc(r.arc.title) + " &hellip;";
  if (open) panel.removeAttribute("hidden"); else panel.setAttribute("hidden", "");
  panel.innerHTML = _wiwArcPanelInnerHTML(r, _wiwArcC || null);
}

/* The wiring context: wiwWireArcs stores the campaign object the thread was
   rendered with so delegated re-renders can reuse it (read-only). */
var _wiwArcC = null;

function wiwWireArcs(C) {
  _wiwArcC = C || null;
}

/* One delegated document-level listener (the T29 idiom): survives every
   innerHTML rebuild of the Campaign Kit and works for pointer AND native
   keyboard activation of the buttons. */
document.addEventListener("click", function (e) {
  var t = e.target && e.target.closest ? e.target : null;
  if (!t) return;
  var btn = t.closest("[data-wiw-arc-btn]");
  if (btn) {
    var id = btn.getAttribute("data-wiw-arc-btn");
    _wiwArcOpen[id] = !_wiwArcOpen[id];
    _wiwArcRerender(id, _wiwArcC);
    var back = document.getElementById("wiwArcBtn_" + _wiwArcSafeId(id));
    if (back && back.focus) back.focus();
    return;
  }
  var stepBtn = t.closest("[data-wiw-arc-step]");
  if (stepBtn) {
    var sid = stepBtn.getAttribute("data-wiw-arc-rec");
    _wiwArcStep[sid] = Math.max(0, parseInt(stepBtn.getAttribute("data-wiw-arc-step"), 10) || 0);
    _wiwArcRerender(sid, _wiwArcC);
    var steps = document.getElementById("wiwArcSteps_" + _wiwArcSafeId(sid));
    var cur = steps && steps.querySelector('[aria-current="step"]');
    if (cur && cur.focus) cur.focus();
    return;
  }
  var nav = t.closest("[data-wiw-arc-nav]");
  if (nav) {
    var nid = nav.getAttribute("data-wiw-arc-rec");
    var r = _wiwArcRecordById(nid);
    if (!r || !r.arc) return;
    var delta = parseInt(nav.getAttribute("data-wiw-arc-nav"), 10) || 0;
    var next = (_wiwArcStep[nid] || 0) + delta;
    if (next < 0) next = 0;
    if (next > r.arc.stages.length - 1) next = r.arc.stages.length - 1;
    _wiwArcStep[nid] = next;
    _wiwArcRerender(nid, _wiwArcC);
    var again = document.querySelector('[data-wiw-arc-nav="' + delta + '"][data-wiw-arc-rec="' + nid.replace(/"/g, "") + '"]');
    if (again && again.focus) again.focus();
  }
});
