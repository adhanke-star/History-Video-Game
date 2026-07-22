/* ===========================================================================
   src/109-chief-of-staff.js — GEA-08 (D445): the Chief of Staff MORNING BRIEF.

   THE CONTRACT (docs/design/genre-elite-p1-contracts.md GEA-08): one READ-ONLY
   panel at the top of the President's Desk composing AT MOST three priority
   lines per turn from a deterministic severity ordering DECLARED IN DATA
   (data/chief-of-staff.json: rule id -> reader id -> threshold -> copy template
   -> target tab). D516 / ARC 9 Slice 2 may upgrade ONLY the unique top-priority
   line to one native action, and only after its target is proven in the mounted
   H0 Desk tab row; all lower facts remain plain text. The panel WRITES NOTHING
   and computes NO new aggregates.

   THE PURITY LAW (the D443 §19 lesson, applied at design time): the desk tabs'
   own render functions lazy-init their domain blocks onto the LIVE campaign
   (econRenderFinance -> econInit, blockadeRenderDiplomacy -> blockadeInit,
   decRenderTab -> decInit, moraleCompute -> bridgeArmy -> engInit/logistics
   writes). Calling any of them from a "pure read" panel would mutate the
   campaign exactly the way the D443 audit caught warCareerArchiveRecord doing.
   So the reader registry below resolves each reader id to a pure PROPERTY-PATH
   read of the SAME already-materialized per-turn value those tabs render —
   values the domains' own OnResolve chain has already computed by the time the
   desk can open (src/90-president-register.js). An unavailable value returns
   null and the rule is DROPPED, never thrown (fail-closed). An unknown reader
   id likewise drops its rule.

   Exclusions per contract: no advice engine, no LLM, no new aggregate
   computation, no auto-action. Bare-name globals (G, GAME_DATA, gameData,
   _wdTab, _wdRefresh); no literal comment-closer inside this block.
   =========================================================================== */

/* The sanitized data read — fail-closed: missing/malformed data means NO panel
   (the desk renders byte-identically to the pre-D445 build). */
function cosData() {
  try {
    var d = (typeof gameData === "function") ? gameData("chief-of-staff")
      : ((typeof GAME_DATA !== "undefined" && GAME_DATA["chief-of-staff"]) || null);
    if (!d || d.schema !== "cw_chief_of_staff_v1" || !d.rules || !d.rules.length) return null;
    return d;
  } catch (e) { return null; }
}

/* The CLOSED reader registry: reader id -> a finite number, or null (drop the
   rule). Pure property-path reads ONLY — see the purity law above. */
function cosReaderValue(C, id) {
  try {
    if (!C) return null;
    var v = null;
    switch (id) {
      case "decisions-pending":
        v = (C.president && Object.prototype.toString.call(C.president.pendingChoices) === "[object Array]") ? C.president.pendingChoices.length : null; break;
      case "treasury-funds":
        v = (typeof C.funds === "number") ? C.funds : null; break;
      case "treasury-inflation":
        v = (C.economy && C.economy.lastTurn && typeof C.economy.lastTurn.inflRatePct === "number") ? C.economy.lastTurn.inflRatePct : null; break;
      case "morale-public":
        v = (C.morale && typeof C.morale.public === "number") ? C.morale.public : null; break;
      case "manpower-pool":
        v = (C.manpower && typeof C.manpower.pool === "number") ? C.manpower.pool : null; break;
      case "blockade-recognition":
        v = (C.blockade && typeof C.blockade.recognition === "number") ? C.blockade.recognition : null; break;
      case "rail-integrity":
        v = (C.production && typeof C.production.railIntegrity === "number") ? C.production.railIntegrity : null; break;
      default: return null;   // unknown reader id -> the rule is dropped, never thrown
    }
    return (typeof v === "number" && isFinite(v)) ? v : null;
  } catch (e) { return null; }
}

/* One rule, sanitized: every field type-checked; a malformed rule is dropped. */
function _cosSaneRule(r) {
  return !!(r && typeof r.id === "string" && r.id && typeof r.reader === "string" &&
    (r.op === "lt" || r.op === "gte") && typeof r.threshold === "number" && isFinite(r.threshold) &&
    typeof r.severity === "number" && isFinite(r.severity) && typeof r.copy === "string" && r.copy &&
    typeof r.tab === "string" && /^[a-z]+$/.test(r.tab) && typeof r.label === "string" && r.label);
}

/* The brief: AT MOST three lines, deterministic (same campaign state -> the
   same lines: severity desc, ties by rule id asc; {value} substituted with the
   deterministic 0.1-rounded reading). Pure — no G/C write anywhere. */
function cosBriefLines(C) {
  var out = [];
  try {
    var d = cosData(); if (!C || !d) return out;
    var cap = 3;
    if (d.config && typeof d.config.maxLines === "number" && d.config.maxLines >= 1 && d.config.maxLines < 3) cap = Math.floor(d.config.maxLines);
    var fired = [];
    for (var i = 0; i < d.rules.length && i < 16; i++) {
      var r = d.rules[i];
      if (!_cosSaneRule(r)) continue;
      var v = cosReaderValue(C, r.reader);
      if (v === null) continue;
      var hit = (r.op === "lt") ? (v < r.threshold) : (v >= r.threshold);
      if (!hit) continue;
      var shown = String(Math.round(v * 10) / 10);
      fired.push({ id: r.id, severity: r.severity, tab: r.tab, label: r.label,
        copy: String(r.copy).replace(/\{value\}/g, shown) });
    }
    fired.sort(function (a, b) { return (b.severity - a.severity) || (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0)); });
    out = fired.slice(0, cap);
  } catch (e) { out = []; }
  return out;
}

/* ARC 9 Slice 2: derive at most one recommendation from the ALREADY ordered
   brief. Equal top severity is deliberately ambiguous and therefore neutral.
   Return a copy so no caller can obtain authority over the brief row. */
function cosNextAction(C) {
  try {
    var lines = cosBriefLines(C);
    if (!lines || !lines.length) return null;
    var top = lines[0];
    if (!top || typeof top.id !== "string" || !top.id ||
        typeof top.severity !== "number" || !isFinite(top.severity) ||
        typeof top.tab !== "string" || !/^[a-z]+$/.test(top.tab) ||
        typeof top.label !== "string" || !top.label ||
        typeof top.copy !== "string" || !top.copy) return null;
    if (lines.length > 1 && lines[1] && typeof lines[1].severity === "number" &&
        lines[1].severity === top.severity) return null;
    return { id: top.id, severity: top.severity, tab: top.tab,
      label: top.label, copy: top.copy };
  } catch (e) { return null; }
}

function _cosEsc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* The H0 registry is intentionally private to src/99. Its mounted native tab
   row is the one live authority available here; do not duplicate its 20 ids. */
function _cosLiveDeskTab(tab) {
  try {
    if (typeof document === "undefined" || typeof tab !== "string" || !/^[a-z]+$/.test(tab)) return false;
    var tabs = document.getElementById("wdTabs");
    var btn = document.getElementById("wdTab_" + tab);
    return !!(tabs && tabs.getAttribute("role") === "group" && btn &&
      btn.tagName === "BUTTON" && tabs.contains(btn));
  } catch (e) { return false; }
}

/* The panel html — "" when the module's data is absent (byte-identical desk);
   the honest all-quiet line when no rule fires. Every fact is inert at render
   time. The unique top row carries only a candidate marker; cosWireBrief may
   upgrade it after live-tab validation. Plain-text data is escaped for both
   markup and attributes (the B-6 lesson). */
function cosBriefHtml(C) {
  try {
    if (!C) return "";
    var d = cosData(); if (!d) return "";
    var lines = cosBriefLines(C);
    var action = cosNextAction(C);
    var quiet = (d.config && typeof d.config.allQuiet === "string" && d.config.allQuiet) ? d.config.allQuiet
      : "All quiet — no office demands your immediate attention.";
    var neutral = "Review the briefing below; no single live office is available as the next action.";
    var body = "";
    if (!lines.length) {
      body = '<div style="font-size:12.5px;opacity:.75;font-style:italic;">' + _cosEsc(quiet) + '</div>';
    } else {
      body = '<p class="cos-brief-orientation" data-cos-orientation="1"'
        + (action ? ' hidden' : '')
        + ' style="margin:6px 0 0;font-size:12.5px;opacity:.8;font-style:italic;">'
        + _cosEsc(neutral) + '</p>';
      for (var i = 0; i < lines.length; i++) {
        var li = lines[i];
        var candidate = action && action.id === li.id && action.tab === li.tab;
        body += '<div class="cos-brief-line" data-cos-rule="' + _cosEsc(li.id) + '"'
          + (candidate ? ' data-cos-candidate="' + li.tab + '"' : '')
          + ' style="display:block;width:100%;box-sizing:border-box;text-align:left;margin-top:5px;padding:6px 9px;font-size:12.5px;line-height:1.45;">'
          + '<b style="color:#d8c87a;">' + _cosEsc(li.label) + ':</b> ' + _cosEsc(li.copy) + '</div>';
      }
    }
    return '<div id="cosBrief" role="region" aria-label="Chief of Staff morning brief" '
      + 'style="max-width:640px;margin:0 auto 12px;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:9px 12px;">'
      + '<div style="font-size:11px;letter-spacing:2px;color:#d8c87a;font-weight:bold;">CHIEF OF STAFF &mdash; MORNING BRIEF</div>'
      + body
      + '</div>';
  } catch (e) { return ""; }
}

/* Materialize exactly one native action only after the mounted H0 tab proves
   the target is live. Route through the existing _wdTab/_wdRefresh path only.
   The panel sits outside wdContent, so a valid refresh retains button focus and
   the shell's existing aria-pressed state announces the destination. */
function cosWireBrief(C) {
  try {
    var root = document.getElementById("cosBrief"); if (!root) return;
    var orientation = root.querySelector("[data-cos-orientation]");
    var candidate = root.querySelector("[data-cos-candidate]");
    var action = cosNextAction(C);
    var valid = !!(action && candidate &&
      candidate.getAttribute("data-cos-rule") === action.id &&
      candidate.getAttribute("data-cos-candidate") === action.tab &&
      _cosLiveDeskTab(action.tab));
    if (!valid) {
      if (orientation) orientation.hidden = false;
      if (candidate) candidate.removeAttribute("data-cos-candidate");
      return;
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "upg cos-brief-line cos-brief-action";
    btn.setAttribute("data-cos-rule", action.id);
    btn.setAttribute("data-costab", action.tab);
    /* WCAG 2.5.3: retain the visible label and fact first in the accessible
       name, then state the action, so voice control can match what is shown. */
    btn.setAttribute("aria-label", action.label + ": " + action.copy + ". Open this office.");
    btn.style.cssText = candidate.style.cssText + "cursor:pointer;";
    while (candidate.firstChild) btn.appendChild(candidate.firstChild);
    candidate.parentNode.replaceChild(btn, candidate);
    if (orientation) orientation.hidden = true;

    function neutralizeStaleAction() {
      if (orientation) orientation.hidden = false;
      if (!btn.parentNode) return;
      var fact = document.createElement("div");
      fact.className = "cos-brief-line";
      fact.setAttribute("data-cos-rule", action.id);
      fact.style.cssText = btn.style.cssText;
      fact.style.cursor = "";
      while (btn.firstChild) fact.appendChild(btn.firstChild);
      btn.parentNode.replaceChild(fact, btn);
    }

    btn.addEventListener("click", function () {
      var t = btn.getAttribute("data-costab");
      if (!_cosLiveDeskTab(t)) {
        neutralizeStaleAction();
        return;
      }
      if (typeof _wdRefresh === "function") { _wdTab = t; _wdRefresh(); }
    });
  } catch (e) {}
}
