/* ===========================================================================
   src/109-chief-of-staff.js — GEA-08 (D445): the Chief of Staff MORNING BRIEF.

   THE CONTRACT (docs/design/genre-elite-p1-contracts.md GEA-08): one READ-ONLY
   panel at the top of the President's Desk composing AT MOST three priority
   lines per turn from a deterministic severity ordering DECLARED IN DATA
   (data/chief-of-staff.json: rule id -> reader id -> threshold -> copy template
   -> target tab). Each line deep-links to its owning desk tab. The panel WRITES
   NOTHING and computes NO new aggregates.

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

/* The panel html — "" when the module's data is absent (byte-identical desk);
   the honest all-quiet line when no rule fires. Plain-text copy only (the data
   law forbids markup in templates); the tab id is schema-constrained [a-z]+ so
   the data-costab attribute interpolation is safe; label/copy are escaped for
   the aria-label anyway (the B-6 attribute lesson). */
function cosBriefHtml(C) {
  try {
    if (!C) return "";
    var d = cosData(); if (!d) return "";
    var lines = cosBriefLines(C);
    var quiet = (d.config && typeof d.config.allQuiet === "string" && d.config.allQuiet) ? d.config.allQuiet
      : "All quiet — no office demands your immediate attention.";
    var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
    var body = "";
    if (!lines.length) {
      body = '<div style="font-size:12.5px;opacity:.75;font-style:italic;">' + esc(quiet) + '</div>';
    } else {
      for (var i = 0; i < lines.length; i++) {
        var li = lines[i];
        body += '<button type="button" class="upg" data-costab="' + li.tab + '" '
          + 'aria-label="' + esc(li.copy) + ' Open ' + esc(li.label) + '." '
          + 'style="display:block;width:100%;text-align:left;margin-top:5px;padding:6px 9px;font-size:12.5px;line-height:1.45;cursor:pointer;">'
          + '<b style="color:#d8c87a;">' + esc(li.label) + ':</b> ' + esc(li.copy) + '</button>';
      }
    }
    return '<div id="cosBrief" role="region" aria-label="Chief of Staff morning brief" '
      + 'style="max-width:640px;margin:0 auto 12px;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:9px 12px;">'
      + '<div style="font-size:11px;letter-spacing:2px;color:#d8c87a;font-weight:bold;">CHIEF OF STAFF &mdash; MORNING BRIEF</div>'
      + body
      + '</div>';
  } catch (e) { return ""; }
}

/* Wire the deep links: clicking a line opens its owning desk tab via the same
   _wdTab/_wdRefresh path the tab buttons use. The panel sits OUTSIDE wdContent,
   so it survives the refresh; focus stays on the clicked line (the tab change
   is announced by the aria-pressed flip the shell already performs). */
function cosWireBrief(C) {
  try {
    var root = document.getElementById("cosBrief"); if (!root) return;
    var btns = root.querySelectorAll("[data-costab]");
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener("click", function () {
          var t = b.getAttribute("data-costab");
          if (typeof _wdRefresh === "function" && t) { _wdTab = t; _wdRefresh(); }
        });
      })(btns[i]);
    }
  } catch (e) {}
}
