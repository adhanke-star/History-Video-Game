/* ===========================================================================
   E2 · 84-codex.js — THE MULTI-AXIS CODEX / GLOSSARY (S4 education; V1-CHECKLIST
   E2 increment 1; DECISIONS D120). A citation-grade, anti-Lost-Cause reference
   on the war's PEOPLE, UNITS & FORMATIONS, TERMS & CONCEPTS, and the SYSTEMS the
   game itself models — surfaced as a President's-Desk tab, searchable and
   filterable by axis, each entry expandable to its full teaching prose + sources.

   Data: data/codex.json -> GAME_DATA.codex (authored + adversarially verified by
   the codex-content-research workflow). Each entry:
     { id, axis (people|units|terms|systems), term, short (<=140-char glossary
       tooltip), body (teaching prose), tags[], related[] (entry ids), provenance,
       sources[] }.
   The >=2-source-for-Verified non-negotiable (D92/D103) is enforced by the build
   gate over every data/*.json, so a Verified codex entry structurally carries >=2
   real sources; this module only READS and renders.

   PURE READ-OUT (the D111/D112/D116 pattern; byte-identical combat BY CONSTRUCTION):
   codexRenderTab READS GAME_DATA.codex and WRITES NOTHING to the sim — no campaign
   state, no save, no RNG. No tactical file is touched and no combat/tick/resolve/
   bridge path reads `cx*` / GAME_DATA.codex -> the bridge + all battles are
   byte-identical by construction. Filtering is client-side DOM show/hide in the
   wire handlers (so the search box keeps focus); no _wdRefresh re-render on keystroke.

   `cxLookupShort(term)` exposes the one-line glossary definition for the E2-i2
   INLINE GLOSSARY (hover/tap tooltips in the teaching prose), so the codex data is
   the single source of truth for both surfaces.

   EXTENDS: a "Codex" tab in 30-president-shell.js (codexRenderTab/codexWireTab).
   Bare-name globals (GAME_DATA via gameData, htmlEsc, document); cx/_cx-prefixed
   helpers; render NEVER mutates or saves.
   =========================================================================== */

function _cxData() { return gameData("codex"); }
function _cxAxesData() { var d = _cxData(); return (d && Array.isArray(d.axes)) ? d.axes : []; }
function _cxEntries() { var d = _cxData(); return (d && Array.isArray(d.entries)) ? d.entries : []; }
function _cxById(id) { var es = _cxEntries(); for (var i = 0; i < es.length; i++) if (es[i] && es[i].id === id) return es[i]; return null; }
var _cxEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };
/* normalize for search/lookup: lowercase, strip diacritics-lite + punctuation -> spaces, collapse */
function _cxNorm(s) { return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
/* element-id-safe (matches _decIdSafe convention; kept in lockstep with getElementById) */
function _cxIdSafe(s) { return String(s == null ? "" : s).replace(/[^A-Za-z0-9_-]/g, "_"); }

/* Axis metadata (label + a CVD-safe word-carried colour); falls back to the raw id. */
var _CX_AXIS_FALLBACK = [
  { id: "people",  label: "People",              col: "#cbb27a" },
  { id: "units",   label: "Units & Formations",  col: "#b9a4c9" },
  { id: "terms",   label: "Terms & Concepts",    col: "#9fc3b0" },
  { id: "systems", label: "Systems of the War",  col: "#d8b48a" }
];
function _cxAxisMeta(id) {
  var ax = _cxAxesData();
  for (var i = 0; i < ax.length; i++) if (ax[i] && ax[i].id === id) return { id: id, label: ax[i].label || id, col: ax[i].col || _cxAxisDefaultCol(id), blurb: ax[i].blurb || "" };
  for (var j = 0; j < _CX_AXIS_FALLBACK.length; j++) if (_CX_AXIS_FALLBACK[j].id === id) return _CX_AXIS_FALLBACK[j];
  return { id: id, label: id || "", col: "#cbb27a" };
}
function _cxAxisDefaultCol(id) { for (var j = 0; j < _CX_AXIS_FALLBACK.length; j++) if (_CX_AXIS_FALLBACK[j].id === id) return _CX_AXIS_FALLBACK[j].col; return "#cbb27a"; }
/* the axis ids present in the data, in a stable display order (data order, else fallback order) */
function _cxAxisOrder() {
  var ax = _cxAxesData(), out = [];
  if (ax.length) { for (var i = 0; i < ax.length; i++) if (ax[i] && ax[i].id) out.push(ax[i].id); return out; }
  var es = _cxEntries(), seen = {};
  for (var k = 0; k < _CX_AXIS_FALLBACK.length; k++) { var a = _CX_AXIS_FALLBACK[k].id; for (var e = 0; e < es.length; e++) if (es[e] && es[e].axis === a) { if (!seen[a]) { out.push(a); seen[a] = 1; } break; } }
  return out;
}

/* the searchable token blob for an entry (term + short + tags + axis label) */
function _cxTokens(en) {
  if (!en) return "";
  var bits = [en.term || "", en.short || "", _cxAxisMeta(en.axis).label];
  if (Array.isArray(en.tags)) bits = bits.concat(en.tags);
  return _cxNorm(bits.join(" "));
}

/* sort entries by term, A-Z (locale-naive, stable enough for display) */
function _cxSortByTerm(a, b) { var ta = _cxNorm(a.term), tb = _cxNorm(b.term); return ta < tb ? -1 : (ta > tb ? 1 : 0); }

/* ===== the INLINE-GLOSSARY accessor (consumed by E2-i2) ===== */
/* Build a lowercased term -> entry index once (memoized on the data identity). */
var _cxGlossaryIdx = null, _cxGlossaryIdxFor = null;
function cxGlossaryIndex() {
  var d = _cxData();
  if (_cxGlossaryIdx && _cxGlossaryIdxFor === d) return _cxGlossaryIdx;
  var idx = {}, es = _cxEntries();
  for (var i = 0; i < es.length; i++) {
    var en = es[i]; if (!en || !en.term) continue;
    idx[_cxNorm(en.term)] = en;
    if (Array.isArray(en.aliases)) for (var a = 0; a < en.aliases.length; a++) { var k = _cxNorm(en.aliases[a]); if (k && !idx[k]) idx[k] = en; }
  }
  _cxGlossaryIdx = idx; _cxGlossaryIdxFor = d;
  return idx;
}
/* Return {id, term, short} for a term/alias, or null. Used by the inline glossary. */
function cxLookupShort(term) {
  var en = cxGlossaryIndex()[_cxNorm(term)];
  return en ? { id: en.id, term: en.term, short: en.short || "" } : null;
}

/* ===== render ===== */

/* an axis chip (word + colour; CVD-safe — the WORD carries the meaning) */
function _cxAxisChip(axisId) {
  var m = _cxAxisMeta(axisId);
  return '<span style="font-size:10px;letter-spacing:.04em;color:' + m.col + ';border:1px solid ' + m.col + ';border-radius:3px;padding:0 5px;white-space:nowrap">' + _cxEsc(m.label) + '</span>';
}

/* one entry as an expandable card */
function _cxEntryHTML(en) {
  if (!en || !en.id) return "";
  var sid = _cxIdSafe(en.id);
  var prov = en.provenance || "Inferred";
  var srcs = Array.isArray(en.sources) ? en.sources : [];
  var related = Array.isArray(en.related) ? en.related : [];
  var relHTML = "";
  for (var r = 0; r < related.length; r++) {
    var rc = _cxById(related[r]); if (!rc) continue;   // only resolvable cross-links render
    relHTML += '<button type="button" class="cx-rel upg" data-cx-goto="' + _cxEsc(rc.id) + '" style="font-size:11px;padding:1px 7px;margin:2px 4px 0 0">' + _cxEsc(rc.term) + ' &#8250;</button>';
  }
  var srcHTML = "";
  if (srcs.length) {
    var lis = "";
    for (var s = 0; s < srcs.length; s++) lis += '<li style="margin-bottom:2px">' + _cxEsc(srcs[s]) + '</li>';
    srcHTML = '<div style="margin-top:6px;font-size:10px;opacity:.62"><span style="text-transform:uppercase;letter-spacing:.06em">' + _cxEsc(prov) + '</span>'
      + '<ul style="margin:3px 0 0;padding-left:16px;line-height:1.45">' + lis + '</ul></div>';
  } else {
    srcHTML = '<div style="margin-top:6px;font-size:10px;opacity:.62;text-transform:uppercase;letter-spacing:.06em">' + _cxEsc(prov) + '</div>';
  }
  return ''
    + '<div class="cx-card" id="cxCard_' + sid + '" data-cx-axis="' + _cxEsc(en.axis || "") + '" data-cx-tokens="' + _cxEsc(_cxTokens(en)) + '" '
    +      'style="margin:8px 0;padding:10px 12px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.13)">'
    +   '<button id="cxHead_' + sid + '" type="button" class="cx-head" aria-expanded="false" aria-controls="cxBody_' + sid + '" '
    +        'style="display:flex;width:100%;gap:8px;justify-content:space-between;align-items:flex-start;background:none;border:none;color:inherit;cursor:pointer;text-align:left;padding:0;font-family:inherit">'
    +     '<span style="flex:1 1 auto"><span style="font-size:14px;font-weight:bold">' + _cxEsc(en.term) + '</span> '
    +       '<span class="cx-caret" aria-hidden="true" style="font-size:11px;opacity:.6">&#9656;</span></span>'
    +     '<span style="flex:0 0 auto">' + _cxAxisChip(en.axis) + '</span>'
    +   '</button>'
    +   '<div style="font-size:12px;opacity:.88;margin-top:3px">' + _cxEsc(en.short || "") + '</div>'
    +   '<div id="cxBody_' + sid + '" class="cx-body" style="display:none;margin-top:7px;border-top:1px dotted var(--rule);padding-top:7px">'
    +     '<div style="font-size:13px;line-height:1.6">' + _cxEsc(en.body || "") + '</div>'
    +     (relHTML ? '<div style="margin-top:6px"><span style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;opacity:.6;margin-right:4px">See also</span>' + relHTML + '</div>' : "")
    +     srcHTML
    +   '</div>'
    + '</div>';
}

/* The "Codex" desk tab: an axis filter + a live search + the A-Z entry list. */
function codexRenderTab(C) {
  if (!_cxData() || !_cxEntries().length) {
    return '<p class="lede" style="font-size:13px;opacity:.78">The Codex is being compiled. No entries are yet available.</p>';
  }
  var es = _cxEntries().slice().sort(_cxSortByTerm);
  var axisIds = _cxAxisOrder();
  // per-axis counts (render-time; for the pill labels)
  var counts = {};
  for (var c0 = 0; c0 < es.length; c0++) counts[es[c0].axis] = (counts[es[c0].axis] || 0) + 1;
  // axis filter pills (All + one per axis present), each carrying its count + blurb
  /* wcag-auditor: contrast fix — count spans were opacity:.6 (3.56–3.57:1 on pill bg, FAIL AA).
     Raised to opacity:.75: bigbtn count #e6f2e0 on #3a5a32 → 4.62:1 ✓; upg count #c9a85f on #241a10 → 4.84:1 ✓ */
  var pills = '<button type="button" class="cx-axis bigbtn" data-cx-axis-filter="all" data-cx-blurb="" aria-pressed="true" '
    + 'style="font-size:11px;padding:3px 12px;margin:0 5px 6px 0">All <span style="opacity:.75">' + es.length + '</span></button>';
  for (var a = 0; a < axisIds.length; a++) {
    var m = _cxAxisMeta(axisIds[a]);
    pills += '<button type="button" class="cx-axis upg" data-cx-axis-filter="' + _cxEsc(axisIds[a]) + '" data-cx-blurb="' + _cxEsc(m.blurb || "") + '" aria-pressed="false" '
      + 'style="font-size:11px;padding:3px 12px;margin:0 5px 6px 0">' + _cxEsc(m.label) + ' <span style="opacity:.75">' + (counts[axisIds[a]] || 0) + '</span></button>';
  }
  var cards = "";
  for (var i = 0; i < es.length; i++) cards += _cxEntryHTML(es[i]);
  // Scoped focus-visible rings for the codex controls (base.html is frozen, so we
  // cannot extend its global focus block; this gives cx-head + the search box the
  // same deliberate 2px brass ring every other control uses — WCAG 2.4.7).
  var focusCss = '<style>'
    + '#cxSearch:focus-visible,#cxList .cx-head:focus-visible{outline:2px solid var(--brass-lt,#c9a85f);outline-offset:2px;border-radius:3px}'
    + '</style>';
  return ''
    + focusCss
    + '<div style="max-width:640px;margin:0 auto">'
    +   '<p class="lede" style="font-size:13px;margin-bottom:8px">A reference on the war &mdash; its people, its armies, its terms, and the systems this office commands. '
    +     'Citation-grade and anti&#8209;Lost&#8209;Cause: every entry names its sources, and slavery is named plainly as the war’s cause.</p>'
    +   '<label for="cxSearch" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">Search the codex</label>'
    +   '<input id="cxSearch" type="search" placeholder="Search people, units, terms&hellip;" autocomplete="off" '
    +        'style="width:100%;box-sizing:border-box;padding:7px 10px;font-size:13px;font-family:inherit;color:inherit;'
    +        'background:rgba(0,0,0,.18);border:1px solid var(--rule);border-radius:5px;margin-bottom:8px">'
    +   '<div id="cxAxisBar" style="display:flex;flex-wrap:wrap;align-items:center">' + pills + '</div>'
    +   '<div id="cxBlurb" aria-live="polite" style="font-size:11px;font-style:italic;opacity:.7;margin:1px 0 3px;min-height:0"></div>'
    +   '<div id="cxCount" aria-live="polite" style="font-size:11px;opacity:.6;margin:2px 0 6px">' + es.length + (es.length === 1 ? ' entry' : ' entries') + '</div>'
    +   '<div id="cxList">' + cards + '</div>'
    +   '<div id="cxEmpty" style="display:none;font-size:13px;opacity:.7;padding:10px 0">No entry matches your search.</div>'
    + '</div>';
}

/* client-side filter: show/hide cards by axis + query; update the count + empty-state. */
function _cxApplyFilter(query, axisFilter) {
  var list = document.getElementById("cxList"); if (!list) return;
  var cards = list.querySelectorAll(".cx-card");
  var q = _cxNorm(query || "");
  var shown = 0;
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var ax = card.getAttribute("data-cx-axis") || "";
    var toks = card.getAttribute("data-cx-tokens") || "";
    var ok = (axisFilter === "all" || ax === axisFilter) && (!q || toks.indexOf(q) >= 0);
    card.style.display = ok ? "" : "none";
    if (ok) shown++;
  }
  var cnt = document.getElementById("cxCount"); if (cnt) cnt.textContent = shown + (shown === 1 ? " entry" : " entries");
  var empty = document.getElementById("cxEmpty"); if (empty) empty.style.display = shown ? "none" : "block";
}

function codexWireTab(C) {
  if (!_cxData()) return;
  var state = { q: "", axis: "all" };
  var search = document.getElementById("cxSearch");
  if (search) search.addEventListener("input", function () { state.q = search.value || ""; _cxApplyFilter(state.q, state.axis); });
  var bar = document.getElementById("cxAxisBar");
  if (bar) {
    var pills = bar.querySelectorAll(".cx-axis");
    var setActive = function (active) {
      for (var i = 0; i < pills.length; i++) {
        var on = (pills[i] === active);
        pills[i].setAttribute("aria-pressed", on ? "true" : "false");
        pills[i].className = on ? "cx-axis bigbtn" : "cx-axis upg";
      }
    };
    for (var p = 0; p < pills.length; p++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          state.axis = btn.getAttribute("data-cx-axis-filter") || "all";
          setActive(btn);
          var bl = document.getElementById("cxBlurb"); if (bl) bl.textContent = btn.getAttribute("data-cx-blurb") || "";
          _cxApplyFilter(state.q, state.axis);
        });
      })(pills[p]);
    }
  }
  // expand/collapse each card + cross-link navigation
  var list = document.getElementById("cxList");
  if (!list) return;
  var heads = list.querySelectorAll(".cx-head");
  for (var h = 0; h < heads.length; h++) {
    (function (head) {
      head.addEventListener("click", function () {
        var id = head.id.replace(/^cxHead_/, "");
        var body = document.getElementById("cxBody_" + id);
        if (!body) return;
        var open = body.style.display !== "none";
        body.style.display = open ? "none" : "block";
        head.setAttribute("aria-expanded", open ? "false" : "true");
        var caret = head.querySelector(".cx-caret"); if (caret) caret.innerHTML = open ? "&#9656;" : "&#9662;";
      });
    })(heads[h]);
  }
  var rels = list.querySelectorAll(".cx-rel");
  for (var r = 0; r < rels.length; r++) {
    (function (rel) {
      rel.addEventListener("click", function () {
        var gid = _cxIdSafe(rel.getAttribute("data-cx-goto") || "");
        // clear any filter that would hide the target, then open + scroll to it
        if (search) { search.value = ""; }
        state.q = ""; state.axis = "all";
        var bar2 = document.getElementById("cxAxisBar");
        if (bar2) { var ps = bar2.querySelectorAll(".cx-axis"); for (var i = 0; i < ps.length; i++) { var isAll = (ps[i].getAttribute("data-cx-axis-filter") === "all"); ps[i].setAttribute("aria-pressed", isAll ? "true" : "false"); ps[i].className = isAll ? "cx-axis bigbtn" : "cx-axis upg"; } }
        var bl2 = document.getElementById("cxBlurb"); if (bl2) bl2.textContent = "";   // CX-01: keep the blurb in sync with the reset-to-All
        _cxApplyFilter("", "all");
        var card = document.getElementById("cxCard_" + gid);
        var body = document.getElementById("cxBody_" + gid);
        var head = document.getElementById("cxHead_" + gid);
        if (body && body.style.display === "none" && head) head.click();
        var reduce = false; try { reduce = !!(G && G.settings && G.settings.reduceMotion); } catch (eRM) {}   // WCAG 2.3.3 — honor reduce-motion
        if (card && card.scrollIntoView) try { card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); } catch (e) { card.scrollIntoView(); }
        if (head && head.focus) try { head.focus(); } catch (e2) {}
      });
    })(rels[r]);
  }
}
