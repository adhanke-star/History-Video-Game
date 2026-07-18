/* ===========================================================================
   src/112-session-packet.js — GEA-14 (D451): THE PRINT-SAFE CLASSROOM SESSION
   PACKET.

   THE CONTRACT (docs/design/genre-elite-p1-contracts.md GEA-14): a print-safe,
   single-file session/evidence packet composed from EXISTING ids and surfaces
   ONLY — the scenario + settings summary (existing campaign readers), the
   GEA-02 AAR plain-text export (derived through the SAME innerText path the
   Copy/Download buttons use), the divergence ledger (divScan verbatim), the
   teaching content the session surfaced — the completed battles' own
   teaching.cards where the live registry resolves them, plus the GEA-10
   concept registry rendered BY CONCEPT ID through conceptResolve — and every
   cited source list VERBATIM. NO LMS, no accounts, no grading of students;
   generation is a PURE READ (a temporary hidden node renders the report for
   its innerText, then is removed; the campaign is never written). One
   "Session Packet" button rides the GEA-02 export bar behind a typeof guard
   (its existing Copy/Download teeth are untouched); the packet downloads as a
   self-contained .html file via the GEA-02 Blob idiom that a teacher opens
   and prints. PRINT-CSS SANITY: white paper, dark ink, NO dark-background
   ink traps anywhere in the packet stylesheet.

   RECORDED INTERPRETATION: "the teaching cards the session actually surfaced"
   composes fail-closed from C.completed ∩ the live scenario registry (the
   cards those battles' briefings/end screens present) plus the concept-id
   index — no telemetry exists (GEA-10 excludes it) and none is added.
   Bare-name globals; no literal comment-closer inside this block.
   =========================================================================== */

function _spEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* The GEA-02 plain text, derived through the SAME DOM path the bar buttons use:
   render the report into a temporary hidden node, read innerText, remove. */
function _spAarText(C) {
  try {
    if (typeof aarRenderReport !== "function" || typeof document === "undefined") return "";
    var host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-9999px;top:0;width:640px;";
    host.innerHTML = aarRenderReport(C, { final: false }) || "";
    document.body.appendChild(host);
    var txt = host.innerText || host.textContent || "";
    document.body.removeChild(host);
    // the export controls render inside the report; their labels are presentation, not evidence
    return txt.replace(/\n{3,}/g, "\n\n").trim();
  } catch (e) { return ""; }
}

function _spSourcesList(srcs) {
  var out = "";
  for (var i = 0; i < (srcs || []).length; i++) out += '<li>' + _spEsc(srcs[i]) + '</li>';
  return out ? '<ul class="src">' + out + '</ul>' : "";
}

/* The packet document — a SELF-CONTAINED print-safe HTML string. White paper,
   dark ink; no dark background anywhere (the ink-trap tooth). */
function spPacketHtml(C) {
  try {
    if (!C) return "";
    var side = (C.side === "CS") ? "Confederate" : "Union";
    var st = C.stats || {};
    var completed = (C.completed || []).slice(0, 40);
    var summary = '<table class="sum">'
      + '<tr><td>Side commanded</td><td>' + side + '</td></tr>'
      + '<tr><td>Battles fought</td><td>' + (st.battles || 0) + '</td></tr>'
      + '<tr><td>Battles won</td><td>' + (st.won || 0) + '</td></tr>'
      + '<tr><td>Ironman</td><td>' + (C.iron ? "On" : "Off") + '</td></tr>'
      + '<tr><td>Completed battle ids</td><td>' + _spEsc(completed.join(", ") || "none yet") + '</td></tr>'
      + '</table>';

    var aar = _spAarText(C);

    var ledger = "";
    if (typeof divScan === "function") {
      var entries = divScan(C) || [];
      for (var i = 0; i < entries.length; i++) {
        var en = entries[i];
        ledger += '<div class="entry"><b>' + _spEsc(en.title) + '</b> <span class="meta">(' + _spEsc(en.cat) + ' · ' + _spEsc(en.tier) + ' · ' + _spEsc(en.when) + ')</span>'
          + '<div>' + _spEsc(en.hist) + '</div></div>';
      }
    }

    var cards = "";
    if (typeof fldScenarioRegistry === "function") {
      var reg = fldScenarioRegistry();
      for (var b = 0; b < completed.length; b++) {
        var sd = reg[completed[b]];
        if (!sd) continue;   // fail-closed: only battles the live registry resolves
        var packs = [];
        if (sd.teaching && sd.teaching.cards) packs.push(sd.teaching.cards);
        var ph = sd.phases || [];
        for (var p = 0; p < ph.length; p++) if (ph[p] && ph[p].teaching && ph[p].teaching.cards) packs.push(ph[p].teaching.cards);
        for (var a = 0; a < packs.length; a++) for (var c = 0; c < packs[a].length; c++) {
          var card = packs[a][c];
          cards += '<div class="entry"><b>' + _spEsc(card.title || card.head || card.id || "") + '</b>'
            + '<div>' + _spEsc(card.body || "") + '</div>'
            + (card.provenance ? '<div class="meta">' + _spEsc(card.provenance) + '</div>' : "")
            + _spSourcesList(card.sources);
        cards += '</div>';
        }
      }
    }

    var concepts = "";
    if (typeof conceptData === "function" && typeof conceptResolve === "function") {
      var d = conceptData();
      var list = (d && d.concepts) || [];
      for (var k = 0; k < list.length; k++) {
        var res = conceptResolve(list[k].id);
        if (!res) continue;
        concepts += '<div class="entry"><b>' + _spEsc(list[k].id) + '</b> — ' + _spEsc(res.title) + ' <span class="meta">(' + _spEsc(res.kind) + ')</span></div>';
      }
    }

    return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
      + '<title>The Civil War — Classroom Session Packet</title>'
      + '<style>'
      + 'body{background:#fff;color:#111;font:13px/1.55 Georgia,serif;margin:28px;max-width:760px;}'
      + 'h1{font-size:20px;letter-spacing:1px;border-bottom:2px solid #444;padding-bottom:6px;}'
      + 'h2{font-size:15px;margin-top:22px;border-bottom:1px solid #999;padding-bottom:3px;}'
      + '.sum td{padding:2px 10px 2px 0;vertical-align:top;}.sum td:first-child{font-weight:bold;}'
      + '.entry{margin:9px 0;}.meta{font-size:11px;color:#444;}'
      + 'pre{white-space:pre-wrap;font:12px/1.5 Georgia,serif;border:1px solid #bbb;padding:10px;background:#fff;}'
      + 'ul.src{font-size:11px;color:#333;margin:4px 0 0;padding-left:18px;}'
      + '@media print{body{margin:12mm;}h2{page-break-after:avoid;}.entry{page-break-inside:avoid;}}'
      + '</style></head><body>'
      + '<h1>THE CIVIL WAR — CLASSROOM SESSION PACKET</h1>'
      + '<div class="meta">Evidence packet composed from the session\'s own surfaces. No grades, no accounts — a record a teacher prints.</div>'
      + '<h2>Session summary</h2>' + summary
      + '<h2>After-action report (the GEA-02 plain-text export)</h2><pre>' + _spEsc(aar) + '</pre>'
      + '<h2>Divergence ledger — your war vs. history</h2>' + (ledger || '<div class="meta">No divergences recorded yet.</div>')
      + '<h2>Teaching cards this session surfaced</h2>' + (cards || '<div class="meta">No registry-resolvable battles completed yet.</div>')
      + '<h2>Concept index (GEA-10 registry)</h2>' + (concepts || '<div class="meta">No concept registry present.</div>')
      + '</body></html>';
  } catch (e) { return ""; }
}

/* The one bar button ("" when the module is absent — the GEA-02 bar and its
   teeth are byte-identical without it). */
function spPacketButtonHtml() {
  try {
    return '<button type="button" class="aarPacketBtn" style="font-size:12px;padding:6px 12px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.14);color:inherit;cursor:pointer">Session Packet</button>';
  } catch (e) { return ""; }
}

/* Own delegated listener (the GEA-02 wiring idiom; _aarExportHandle untouched). */
var _spWired = false;
if (typeof document !== "undefined" && document.addEventListener && !_spWired) {
  _spWired = true;
  document.addEventListener("click", function (e) {
    var t = e.target;
    var btn = (t && t.closest) ? t.closest(".aarPacketBtn") : null;
    if (!btn) return;
    try {
      var C = (typeof G !== "undefined" && G) ? G.campaign : null;
      var bar = btn.closest(".aarExport");
      var html = spPacketHtml(C);
      var status = function (msg) { try { var s = bar && bar.querySelector(".aarExportStatus"); if (s) s.textContent = msg; } catch (e2) {} };
      if (!html) { status("No live campaign to compose a packet from."); return; }
      var blob = new Blob([html], { type: "text/html" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "civil-war-session-packet.html";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e3) {} }, 1000);
      status("Session packet downloaded — open it and print.");
    } catch (e4) {}
  });
}
