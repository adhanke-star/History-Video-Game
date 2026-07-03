/* ============================================================================
   103-h0-after-action.js -- H0 prototype slice: after-action + final report
   ----------------------------------------------------------------------------
   Late-bound presentation pass for the strategic report surfaces. It wraps the
   existing aarRenderReport output and preserves the grading, endings, Soldier's
   Story, glossary, warWonScreen, and campaign-nullify contracts.
   ========================================================================== */
(function h0AfterActionModule() {
  function h0aEsc(v) {
    return (typeof htmlEsc === "function") ? htmlEsc(v)
      : String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function h0aNum(v, d) {
    return (typeof v === "number" && isFinite(v)) ? v : (d || 0);
  }

  function h0aSideName(C) {
    return C && C.side === "CS" ? "Confederate" : "Union";
  }

  function h0aGrade(C) {
    try {
      if (typeof _aarDomains !== "function" || typeof aarOverall !== "function") return null;
      return aarOverall(_aarDomains(C)).grade || null;
    } catch (e) {
      return null;
    }
  }

  function h0aDivergence(C) {
    try {
      if (typeof divScan !== "function" || typeof divIndex !== "function") return { idx: "0", word: "Historical track" };
      var entries = divScan(C);
      var ix = divIndex(entries);
      return { idx: String(ix.idx || 0), word: ix.word || "Historical track" };
    } catch (e) {
      return { idx: "0", word: "Historical track" };
    }
  }

  function h0aEndingCount(C) {
    try {
      if (typeof endScan !== "function") return "0 / 0";
      var sc = endScan(C) || {};
      return h0aNum((sc.reached || []).length, 0) + " / " + h0aNum((sc.near || []).length, 0);
    } catch (e) {
      return "0 / 0";
    }
  }

  function h0aChip(label, value, tone) {
    return '<span class="h0a-chip h0a-' + (tone || "neutral") + '"><b>' + h0aEsc(label) + '</b>' + h0aEsc(value) + '</span>';
  }

  function h0aMetric(label, value, hint, tone) {
    return '<div class="h0a-metric h0a-' + (tone || "neutral") + '">'
      + '<span>' + h0aEsc(label) + '</span><b>' + h0aEsc(value) + '</b>'
      + (hint ? '<em>' + h0aEsc(hint) + '</em>' : '')
      + '</div>';
  }

  function h0aCss() {
    if (typeof document === "undefined" || document.getElementById("h0AfterActionCss")) return;
    var s = document.createElement("style");
    s.id = "h0AfterActionCss";
    s.textContent = [
      "#overlay .sheet:has(.h0a-report){width:min(1160px,96vw);background:#080c0d;border-color:#6f8069;border-radius:8px;}",
      "#overlay .sheet:has(.h0a-report)::before{border-color:rgba(216,180,88,.30);}",
      "#overlay .sheet:has(#wwReport .h0a-report) .title-xl,#overlay .sheet:has(#wwReport .h0a-report) .title-sub,#overlay .sheet:has(#wwReport .h0a-report) .verdict{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;letter-spacing:0!important;}",
      "#overlay .sheet:has(#wwReport .h0a-report) .verdict{border-radius:8px!important;border:1px solid rgba(95,146,115,.48)!important;background:rgba(95,146,115,.14)!important;color:#f4efe2!important;}",
      "#overlay .sheet:has(#wwReport .h0a-report) #wwMainMenu:focus-visible{outline:3px solid #ffe27a!important;outline-offset:3px!important;}",
      ".h0a-report{--h0a-bg:#080c0d;--h0a-panel:#111918;--h0a-ink:#f2eee3;--h0a-muted:#c5cdc3;--h0a-brass:#d8b458;--h0a-blue:#5d86b7;--h0a-red:#b35a50;--h0a-green:#5f9273;--h0a-line:rgba(216,180,88,.28);--h0a-focus:#ffe27a;color:var(--h0a-ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#070a0b 0%,#121e21 46%,#0b1014 100%);border:1px solid rgba(216,180,88,.42);border-radius:8px;overflow:hidden;position:relative;box-shadow:0 24px 70px rgba(0,0,0,.58),inset 0 0 0 1px rgba(255,255,255,.05);}",
      ".h0a-report *{box-sizing:border-box;letter-spacing:0!important;font-family:inherit!important;}",
      ".h0a-report::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.030) 0,rgba(255,255,255,.030) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(90deg,rgba(216,180,88,.050) 0,rgba(216,180,88,.050) 1px,transparent 1px,transparent 31px);opacity:.50;pointer-events:none;}",
      ".h0a-head,.h0a-metrics,.h0a-body{position:relative;z-index:1;}",
      ".h0a-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;padding:16px;border-bottom:1px solid var(--h0a-line);background:linear-gradient(90deg,rgba(216,180,88,.13),rgba(93,134,183,.10),rgba(0,0,0,.20));}",
      ".h0a-kicker{margin:0 0 4px;color:var(--h0a-brass);font-size:11px;text-transform:uppercase;font-weight:950;}",
      ".h0a-head h1{margin:0;color:#fff8dc;font-size:34px;line-height:1;font-weight:950;}",
      ".h0a-sub{margin:6px 0 0;color:var(--h0a-muted);font-size:13px;line-height:1.45;max-width:74ch;}",
      ".h0a-chips{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;justify-content:flex-end;}",
      ".h0a-chip{min-height:34px;display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid rgba(216,180,88,.28);border-radius:8px;background:rgba(255,255,255,.06);font-size:12px;font-weight:850;color:var(--h0a-ink);}",
      ".h0a-chip b,.h0a-metric span{color:var(--h0a-brass);font-size:10px;text-transform:uppercase;font-weight:950;}",
      ".h0a-overall{display:grid;grid-template-columns:auto minmax(78px,1fr);align-items:center;gap:10px;min-width:178px;padding:9px 11px;border:1px solid rgba(216,180,88,.34);border-radius:8px;background:rgba(0,0,0,.22);}",
      ".h0a-grade-letter{width:56px;height:56px;display:inline-flex;align-items:center;justify-content:center;border:2px solid currentColor;border-radius:8px;font-size:24px;font-weight:950;line-height:1;}",
      /* S01 (D232): scope the small-label rule to the inner div's span — bare '.h0a-overall span' also matched
         the .h0a-grade-letter span (and out-specified its rule), forcing display:block + font-size:10px so the
         headline grade rendered tiny/top-pinned in a nearly-empty 56px box. */
      ".h0a-overall div>span{display:block;font-size:10px;text-transform:uppercase;color:var(--h0a-brass);font-weight:950;}.h0a-overall b{display:block;color:#fff3d1;font-size:14px;line-height:1.15;}.h0a-overall em{display:block;color:var(--h0a-muted);font-size:11px;font-style:normal;margin-top:1px;}",
      ".h0a-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px;border-bottom:1px solid var(--h0a-line);background:rgba(0,0,0,.18);}",
      ".h0a-metric{min-width:0;padding:10px;border:1px solid rgba(216,180,88,.24);border-radius:8px;background:rgba(255,255,255,.055);}.h0a-metric b{display:block;color:#fff3d1;font-size:18px;line-height:1.1;overflow-wrap:anywhere;}.h0a-metric em{display:block;color:var(--h0a-muted);font-size:11px;font-style:normal;margin-top:3px;line-height:1.3;}",
      ".h0a-good{border-color:rgba(95,146,115,.48)!important;background:rgba(95,146,115,.12)!important;}.h0a-field{border-color:rgba(93,134,183,.50)!important;background:rgba(93,134,183,.12)!important;}.h0a-warn{border-color:rgba(179,90,80,.48)!important;background:rgba(179,90,80,.12)!important;}",
      ".h0a-body{margin:12px;padding:14px;border:1px solid var(--h0a-line);border-radius:8px;background:linear-gradient(180deg,rgba(17,25,24,.96),rgba(7,10,12,.96));box-shadow:0 14px 28px rgba(0,0,0,.34);font-size:13px;line-height:1.5;overflow-wrap:anywhere;}",
      ".h0a-body>div:first-child{color:#fff3d1!important;font-size:20px!important;line-height:1.1!important;}",
      ".h0a-body hr.rule{border-color:rgba(216,180,88,.28)!important;}",
      ".h0a-body [style*='color:#9b8560']{color:var(--h0a-brass)!important;}",
      ".h0a-body [style*='border:1px solid var(--rule)'],.h0a-body [style*='border:1px solid #b8863b']{border-color:rgba(216,180,88,.30)!important;border-radius:8px!important;background:rgba(255,255,255,.055)!important;}",
      ".h0a-body [style*='border-bottom:1px dotted var(--rule)'],.h0a-body [style*='border-top:1px solid rgba(120,92,62']{border-color:rgba(216,180,88,.25)!important;}",
      ".h0a-body [style*='display:flex']{flex-wrap:wrap!important;}",
      ".h0a-body [style*='white-space:nowrap']{white-space:normal!important;}",
      ".h0a-body b,.h0a-body strong{color:#fff3d1;}.h0a-body ul{padding-left:18px;}.h0a-body li{margin:3px 0;}.h0a-body .gl-term{border-radius:5px!important;outline-offset:3px!important;}.h0a-body .gl-term:focus-visible{outline:3px solid var(--h0a-focus)!important;}",
      "@media (max-width:900px){#overlay .sheet:has(.h0a-report){width:min(840px,96vw);}.h0a-head{grid-template-columns:1fr;}.h0a-chips{justify-content:flex-start;}.h0a-overall{width:100%;grid-template-columns:auto minmax(0,1fr);}.h0a-metrics{grid-template-columns:repeat(2,minmax(0,1fr));}.h0a-head h1{font-size:30px;}}",
      "@media (max-width:540px){.sheet .pad:has(.h0a-report){padding:10px;}.h0a-head{padding:13px;}.h0a-head h1{font-size:27px;}.h0a-metrics{grid-template-columns:1fr;padding:10px;gap:8px;}.h0a-body{margin:10px;padding:12px;}.h0a-body [style*='grid-template-columns']{grid-template-columns:1fr!important;}.h0a-grade-letter{width:50px;height:50px;font-size:21px;}}",
      "html[data-a11y-contrast='high'] .h0a-report,html[data-a11y-contrast='high'] .h0a-body,html[data-a11y-contrast='high'] .h0a-metric,html[data-a11y-contrast='high'] .h0a-chip,html[data-a11y-contrast='high'] .h0a-overall{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}html[data-a11y-contrast='high'] .h0a-sub,html[data-a11y-contrast='high'] .h0a-metric em{color:#f2e6c8!important;}"
    ].join("");
    document.head.appendChild(s);
  }

  function h0aShell(C, opts, inner) {
    if (!C) return inner;
    opts = opts || {};
    h0aCss();
    var final = !!opts.final;
    var st = C.stats || {};
    var grade = h0aGrade(C) || { letter: "C", label: "Workmanlike", col: "#d8a44a" };
    var div = h0aDivergence(C);
    var battles = h0aNum(st.battles, 0);
    var won = h0aNum(st.won, 0);
    var suff = h0aNum(st.suff, 0);
    var infl = h0aNum(st.infl, 0);
    var title = final ? "Final War Report" : "After-Action Report";
    var mode = final ? "Campaign closed" : "Live campaign assessment";
    var side = h0aSideName(C);
    return '<section class="h0a-report ' + (final ? "h0a-final" : "h0a-live") + '" role="region" aria-label="' + h0aEsc(title) + ' command surface">'
      + '<header class="h0a-head">'
        + '<div><p class="h0a-kicker">' + h0aEsc(mode) + '</p><h1>' + h0aEsc(title) + '</h1>'
        + '<p class="h0a-sub">' + h0aEsc(side) + ' command record. The original graded report remains intact below: domains, divergence, alternate endings, Soldier\'s Story, human cost, and Reconstruction framing.</p>'
        + '<div class="h0a-chips">'
          + h0aChip("Command", side, "field")
          + h0aChip("Divergence", div.idx + " / 100", "neutral")
          + h0aChip("Alternates", h0aEndingCount(C), "neutral")
        + '</div></div>'
        + '<div class="h0a-overall" style="color:' + h0aEsc(grade.col) + '"><span class="h0a-grade-letter">' + h0aEsc(grade.letter) + '</span><div><span>Overall</span><b>' + h0aEsc(grade.label) + '</b><em>Report-card grade</em></div></div>'
      + '</header>'
      + '<div class="h0a-metrics" aria-label="Campaign report summary">'
        + h0aMetric("Engagements", won + " / " + battles, "Victories over battles fought", battles ? "field" : "neutral")
        + h0aMetric("Own losses", suff.toLocaleString(), "Fallen, wounded, or lost", suff ? "warn" : "neutral")
        + h0aMetric("Enemy losses", infl.toLocaleString(), "Inflicted casualties", infl ? "good" : "neutral")
        + h0aMetric("History index", div.idx, div.word, "neutral")
      + '</div>'
      + '<div class="h0a-body">' + inner + '</div>'
      + '</section>';
  }

  if (typeof aarRenderReport === "function" && !aarRenderReport._h0a) {
    var h0aBaseReport = aarRenderReport;
    aarRenderReport = function (C, opts) {
      return h0aShell(C, opts, h0aBaseReport.call(this, C, opts));
    };
    aarRenderReport._h0a = true;
  }

  h0aCss();
})();
