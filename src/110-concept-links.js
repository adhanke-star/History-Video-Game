/* ===========================================================================
   src/110-concept-links.js — GEA-10 (D446): STABLE CONCEPT IDS + DEEP LINKS
   AT THE MOMENT OF NEED.

   THE CONTRACT (docs/design/genre-elite-p1-contracts.md GEA-10): (1) a data
   registry of stable concept ids (data/concept-links.json), each mapping to
   exactly ONE canonical surface anchor (codex entry id / glossary term /
   primary-source record id / teaching-card id). (2) Surfaces opt in by
   annotating EXISTING copy spans with data-concept="<id>" (plus data-no-gloss,
   the shipped src/93 skip attribute, so the inline glossary never nests a
   gl-term button inside a concept span); this module decorates ONLY resolvable
   spans and a shared delegated handler opens the canonical surface, RETURNING
   FOCUS to the invoking element on close — the S12/S22 focus law, implemented
   on the src/104 h2Cutaway body-appended-dialog idiom (focus trap + Escape +
   opener restore). (3) Provenance travels: every kind's canonical render
   includes its sources/provenance visibly (codex bodies are force-expanded in
   the modal). (4) Unknown ids fail closed — the span stays plain text, no
   role, no tabindex, no dead link.

   WIRING ONLY: no prose expansion, no new content. Canonical renders REUSE the
   owning modules' own helpers (_cxById/_cxEntryHTML for codex+glossary,
   _psCardHTML for sources); teaching cards render through the same
   head/body/provenance/sources shape their battle surfaces use. Bare-name
   globals (GAME_DATA, gameData, fldScenarioRegistry, the _cxById/_cxEntryHTML
   and _psCardHTML helpers); no literal comment-closer inside this block.
   =========================================================================== */

function conceptData() {
  try {
    var d = (typeof gameData === "function") ? gameData("concept-links")
      : ((typeof GAME_DATA !== "undefined" && GAME_DATA["concept-links"]) || null);
    if (!d || d.schema !== "cw_concept_links_v1" || !d.concepts || !d.concepts.length) return null;
    return d;
  } catch (e) { return null; }
}

/* Find one registry row by concept id; null when absent/malformed (fail-closed). */
function _clRow(id) {
  var d = conceptData(); if (!d || typeof id !== "string") return null;
  for (var i = 0; i < d.concepts.length && i < 64; i++) {
    var c = d.concepts[i];
    if (c && c.id === id && typeof c.kind === "string" && typeof c.anchor === "string") return c;
  }
  return null;
}

/* One battle teaching card by id, searched across the LIVE scenario registry
   (battle-level and phase-level cards). Pure read; null when unfound. */
function _clCardByAnchor(anchor) {
  try {
    if (typeof fldScenarioRegistry !== "function") return null;
    var reg = fldScenarioRegistry();
    for (var k in reg) {
      if (!reg.hasOwnProperty(k)) continue;
      var sd = reg[k], packs = [];
      if (sd.teaching && sd.teaching.cards) packs.push(sd.teaching.cards);
      var ph = sd.phases || [];
      for (var p = 0; p < ph.length; p++) if (ph[p] && ph[p].teaching && ph[p].teaching.cards) packs.push(ph[p].teaching.cards);
      for (var a = 0; a < packs.length; a++) for (var c = 0; c < packs[a].length; c++) {
        if (packs[a][c] && packs[a][c].id === anchor) return packs[a][c];
      }
    }
  } catch (e) {}
  return null;
}

/* Resolve a concept id to { title, html } of its CANONICAL surface content, or
   null (fail-closed) when the id, kind, anchor, or owning module is missing. */
function conceptResolve(id) {
  try {
    var row = _clRow(id); if (!row) return null;
    var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    if (row.kind === "codex" || row.kind === "glossary") {
      if (typeof _cxById !== "function" || typeof _cxEntryHTML !== "function") return null;
      var en = null;
      if (row.kind === "codex") en = _cxById(row.anchor);
      else if (typeof _cxEntries === "function") {
        var list = _cxEntries();
        for (var i = 0; i < list.length; i++) if (list[i] && String(list[i].term).toLowerCase() === String(row.anchor).toLowerCase()) { en = list[i]; break; }
      }
      if (!en) return null;
      var html = _cxEntryHTML(en);
      return html ? { title: en.term, html: html, kind: row.kind } : null;
    }
    if (row.kind === "source") {
      if (typeof _psCardHTML !== "function") return null;
      var d = (typeof gameData === "function") ? gameData("primary-sources") : null;
      var recs = (d && d.records) || [];
      for (var r = 0; r < recs.length; r++) if (recs[r] && recs[r].id === row.anchor) {
        var ph = _psCardHTML(recs[r]);
        return ph ? { title: recs[r].title || row.anchor, html: ph, kind: row.kind } : null;
      }
      return null;
    }
    if (row.kind === "card") {
      var card = _clCardByAnchor(row.anchor); if (!card) return null;
      var head = card.title || card.head || row.anchor;
      var srcs = card.sources || [], lis = "";
      for (var s = 0; s < srcs.length; s++) lis += '<li style="margin-bottom:2px">' + esc(srcs[s]) + '</li>';
      var ch = '<div class="cl-card" style="padding:10px 12px;border:1px solid #715e3e;border-radius:5px;background:#15110b;">'
        + '<b style="color:#d8c87a;">' + esc(head) + '</b>'
        + '<div style="font-size:12.5px;opacity:.88;line-height:1.5;margin-top:4px;">' + esc(card.body || "") + '</div>'
        + (card.provenance ? '<div style="font-size:11px;opacity:.6;margin-top:5px;">' + esc(card.provenance) + '</div>' : '')
        + (lis ? '<ul style="margin:5px 0 0;padding-left:16px;font-size:10.5px;opacity:.62;line-height:1.45">' + lis + '</ul>' : '')
        + '</div>';
      return { title: head, html: ch, kind: row.kind };
    }
    return null;   // unknown kind -> fail closed
  } catch (e) { return null; }
}

/* Decorate the [data-concept] spans under root: RESOLVABLE ids become
   accessible deep links (role=button, tabindex, aria-haspopup=dialog, the
   cl-term underline); unknown ids are left EXACTLY as they are — plain text,
   no dead link. Idempotent per span (data-cl-done). Installs the one shared
   delegated handler + style on first use. */
function conceptDecorate(root) {
  try {
    if (!root || !root.querySelectorAll) return;
    _clInstallOnce();
    var spans = root.querySelectorAll("[data-concept]");
    for (var i = 0; i < spans.length; i++) {
      var el = spans[i];
      if (el.getAttribute("data-cl-done") === "1") continue;
      var id = el.getAttribute("data-concept");
      if (!conceptResolve(id)) continue;   // unknown/unresolvable -> inert plain text
      el.setAttribute("data-cl-done", "1");
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-haspopup", "dialog");
      el.className = (el.className ? el.className + " " : "") + "cl-term";
    }
  } catch (e) {}
}

var _clInstalled = false;
function _clInstallOnce() {
  if (_clInstalled || typeof document === "undefined" || !document.addEventListener) return;
  _clInstalled = true;
  if (!document.getElementById("clStyle")) {
    var st = document.createElement("style");
    st.id = "clStyle";
    st.textContent = ".cl-term{cursor:pointer;text-decoration:underline;text-decoration-color:#c9a85f;text-underline-offset:2px}"
      + ".cl-term:hover{color:#c9a85f}"
      + ".cl-term:focus-visible{outline:2px solid #c9a85f;outline-offset:2px;border-radius:2px}";
    (document.head || document.documentElement).appendChild(st);
  }
  var hit = function (e) { var t = e.target; while (t && t.nodeType === 1) { if (t.getAttribute && t.getAttribute("data-cl-done") === "1") return t; t = t.parentNode; } return null; };
  document.addEventListener("click", function (e) { var el = hit(e); if (el) { e.preventDefault(); conceptOpen(el.getAttribute("data-concept"), el); } });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = hit(e); if (el) { e.preventDefault(); conceptOpen(el.getAttribute("data-concept"), el); }
  });
}

/* Open the canonical surface in a focus-trapped modal appended to body (the
   src/104 h2Cutaway idiom: own Escape/Tab handling; close restores focus to
   the invoking element — the S12/S22 focus law). Codex bodies are force-
   expanded so provenance/sources are VISIBLE on landing (contract clause 3). */
function conceptOpen(id, invoker) {
  try {
    var res = conceptResolve(id); if (!res) return;
    if (document.getElementById("clModal")) return;   // one modal at a time
    var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
    var ov = document.createElement("div");
    ov.id = "clModal";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "In depth: " + esc(res.title));
    ov.style.cssText = "position:fixed;inset:0;z-index:7000;display:flex;align-items:center;justify-content:center;background:#070a0ecc;";
    ov.innerHTML = '<div style="max-width:620px;max-height:86vh;overflow:auto;background:#0c0f14;border:1px solid #745e3f;border-radius:8px;padding:18px 22px;">'
      + '<div style="font-size:11px;letter-spacing:2px;opacity:.65;">IN DEPTH</div>'
      + '<div style="margin-top:8px;">' + res.html + '</div>'
      + '<div style="text-align:center;margin-top:14px;"><button id="clModalClose" type="button" class="upg" style="padding:7px 16px;cursor:pointer;">Close</button></div>'
      + '</div>';
    document.body.appendChild(ov);
    // provenance travels: force-expand any collapsed codex body so sources are visible on landing.
    var bodies = ov.querySelectorAll(".cx-body");
    for (var b = 0; b < bodies.length; b++) bodies[b].style.display = "block";
    var heads = ov.querySelectorAll(".cx-head");
    for (var h = 0; h < heads.length; h++) heads[h].setAttribute("aria-expanded", "true");
    var close = function () {
      try { ov.removeEventListener("keydown", onKey); } catch (e) {}
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      try { if (invoker && invoker.isConnected && invoker.focus) invoker.focus(); } catch (e) {}
    };
    var onKey = function (e) {
      if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(); return; }
      if (e.key === "Tab") {
        var f = ov.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    ov.addEventListener("keydown", onKey);
    var cb = document.getElementById("clModalClose");
    if (cb) { cb.addEventListener("click", close); try { cb.focus(); } catch (e) {} }
  } catch (e) {}
}
