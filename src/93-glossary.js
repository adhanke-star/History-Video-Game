/* ===========================================================================
   E2 · 93-glossary.js — THE INLINE GLOSSARY (S4 education; V1-CHECKLIST E2
   increment 2; DECISIONS D120). Hover/tap/focus definitions of key terms woven
   into the existing teaching prose, reading the SAME codex data as the Codex tab
   (cxLookupShort / cxGlossaryIndex from 84-codex.js) — one source of truth.

   HOW IT WORKS — DOM decoration (safe, post-render): glDecorate(rootEl) walks the
   TEXT NODES under a rendered teaching container and wraps the FIRST occurrence of
   each codex term (whole-word, case-insensitive, longest-term-first) in an inline
   <button class="gl-term">. It NEVER parses HTML by regex (no tag/attribute
   corruption); it skips interactive/code zones (BUTTON/A/INPUT/SELECT/TEXTAREA/
   SCRIPT/STYLE), the Codex tab itself (.cx-card — the glossary's own source), and
   anything marked [data-no-gloss]. Each term decorates at most once per container.

   ACCESSIBILITY-FIRST: the definition rides the trigger's aria-label
   ("<term> — <short>"), so a screen-reader announces it on focus REGARDLESS of the
   visual tooltip; the floating tooltip (#glTip) is aria-hidden decorative
   reinforcement for sighted users. Triggers are real <button>s (keyboard-operable,
   in the tab order); Esc dismisses; the tooltip transition honors reduceMotion.

   PURE READ-OUT (byte-identical combat BY CONSTRUCTION): reads GAME_DATA.codex via
   the cx* accessors and DECORATES already-rendered teaching DOM; it WRITES NOTHING
   to the sim (no campaign state, no save, no RNG). No tactical/combat/tick/resolve/
   bridge path references gl* — battles are byte-identical by construction. The
   _wdRefresh hook is a guarded, additive call (byte-identical when glDecorate is
   absent), scoped to the read-only teaching tabs.

   Bare-name globals (document, G via the cx accessors); gl/_gl-prefixed helpers;
   no literal comment-closer in a block comment.
   =========================================================================== */

var _GL_SKIP_TAGS = { BUTTON: 1, A: 1, INPUT: 1, SELECT: 1, TEXTAREA: 1, SCRIPT: 1, STYLE: 1, KBD: 1, CODE: 1, LABEL: 1 };
var _GL_MAX_TERM_WORDS = 5;       // don't try to match absurdly long phrases
var _GL_MIN_TERM_LEN = 4;         // skip tiny non-acronym tokens that would be noisy (acronyms like "USCT" are kept via the acronym rule below; sub-4-char non-acronyms are dropped)

/* Escape a term for use inside a RegExp. */
function _glReEsc(s) { return String(s == null ? "" : s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/* The searchable SURFACE forms for a codex entry — the spellings prose actually uses,
   distinct from the canonical en.term (which may carry a leading "The" and a trailing
   "(...)" clarifier that never appears verbatim in running text). Returns the core noun
   phrase, any acronym inside the parenthetical (e.g. "USCT"), and authored aliases. */
function _glSurfaces(en) {
  var out = [], term = String(en.term || "");
  var core = term.replace(/^the\s+/i, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (core) out.push(core);
  var pm = term.match(/\(([^)]*)\)/);
  if (pm) { var inner = pm[1].trim(); if (/^[A-Z0-9]{3,}$/.test(inner)) out.push(inner); }   // e.g. "(USCT)" -> USCT (>=3 to avoid "CS"/"US" noise)
  if (Array.isArray(en.aliases)) for (var i = 0; i < en.aliases.length; i++) { var a = String(en.aliases[i] == null ? "" : en.aliases[i]).trim(); if (a) out.push(a); }
  return out;
}

/* Build (once, memoized on codex-data identity) the match list: [{id, term, short, surface, re}],
   sorted LONGEST-first so multi-word surfaces win over their substrings. A surface is allowed
   only if it is >= _GL_MIN_TERM_LEN (or an all-caps acronym), <= _GL_MAX_TERM_WORDS words, and
   begins+ends with a word char (so the \b...\b anchors can fire — the prior trailing-\b made
   every term ending in ")" a dead matcher). Surfaces are deduped (first/longest wins). */
var _glMatchers = null, _glMatchersFor = null;
function _glBuildMatchers() {
  var dataId = (typeof _cxData === "function") ? _cxData() : null;
  if (_glMatchers && _glMatchersFor === dataId) return _glMatchers;
  var es = (typeof _cxEntries === "function") ? _cxEntries() : [];
  var out = [], seen = {};
  for (var e = 0; e < es.length; e++) {
    var en = es[e];
    if (!en || !en.term || !en.short) continue;
    var surfaces = _glSurfaces(en);
    for (var s = 0; s < surfaces.length; s++) {
      var surface = surfaces[s];
      var words = surface.split(/\s+/).length;
      var isAcronym = /^[A-Z0-9]{2,}$/.test(surface);
      if (words > _GL_MAX_TERM_WORDS) continue;
      if (surface.length < _GL_MIN_TERM_LEN && !isAcronym) continue;
      if (!/^[A-Za-z0-9]/.test(surface) || !/[A-Za-z0-9]$/.test(surface)) continue;   // \b needs word-char ends
      var key = surface.toLowerCase();
      if (seen[key]) continue;
      seen[key] = 1;
      out.push({ id: en.id, term: en.term, short: en.short, surface: surface, len: surface.length,
        re: new RegExp("\\b" + _glReEsc(surface) + "\\b", "i") });
    }
  }
  out.sort(function (a, b) { return b.len - a.len; });   // longest surface first ("Army of the Potomac" beats "Army")
  _glMatchers = out; _glMatchersFor = dataId;
  return out;
}

/* Is this text node inside a zone we must not decorate? */
function _glInSkipZone(node) {
  var el = node.parentNode;
  while (el && el.nodeType === 1) {
    if (_GL_SKIP_TAGS[el.tagName]) return true;
    if (el.classList && (el.classList.contains("gl-term") || el.classList.contains("cx-card"))) return true;
    if (el.id === "cxList" || el.id === "glTip") return true;
    if (el.getAttribute && el.getAttribute("data-no-gloss") != null) return true;
    el = el.parentNode;
  }
  return false;
}

/* the shared tooltip element (created once). */
function _glTip() {
  var t = document.getElementById("glTip");
  if (t) return t;
  t = document.createElement("div");
  t.id = "glTip";
  t.setAttribute("role", "tooltip");
  t.setAttribute("aria-hidden", "true");   // the aria-label on the trigger carries the def for SR; this is sighted-only reinforcement
  t.style.cssText = "position:fixed;z-index:100000;max-width:280px;padding:8px 11px;background:#1a130c;border:1px solid var(--brass-lt,#c9a85f);border-radius:5px;"
    + "color:#e8dcc0;font-family:Georgia,serif;font-size:12px;line-height:1.5;box-shadow:0 4px 14px rgba(0,0,0,.5);pointer-events:none;display:none;opacity:0";
  (document.body || document.documentElement).appendChild(t);
  return t;
}

var _glReduce = function () { try { return !!(G && G.settings && G.settings.reduceMotion); } catch (e) { return false; } };

function _glShowTip(btn) {
  if (!btn) return;
  var id = btn.getAttribute("data-gl-id");
  var term = btn.getAttribute("data-gl-term") || btn.textContent || "";
  var short = btn.getAttribute("data-gl-short") || "";
  var tip = _glTip();
  tip.innerHTML = '<span style="font-weight:bold;color:var(--brass-lt,#c9a85f)">' + _glEsc(term) + '</span> &mdash; ' + _glEsc(short)
    + '<span style="display:block;margin-top:3px;font-size:10px;opacity:.6;font-style:italic">in the Codex</span>';
  tip.style.transition = _glReduce() ? "none" : "opacity .12s ease";
  tip.style.display = "block";
  // position: above the trigger, clamped to the viewport
  var r = btn.getBoundingClientRect();
  var tw = tip.offsetWidth, th = tip.offsetHeight;
  var vw = (window.innerWidth || document.documentElement.clientWidth), vh = (window.innerHeight || document.documentElement.clientHeight);
  var left = Math.max(6, Math.min(r.left, vw - tw - 6));
  var top = r.top - th - 8;
  if (top < 6) top = Math.min(vh - th - 6, r.bottom + 8);   // flip below if no room above
  tip.style.left = left + "px";
  tip.style.top = Math.max(6, top) + "px";
  // force reflow then fade in
  void tip.offsetWidth;
  tip.style.opacity = "1";
}
function _glHideTip() {
  var tip = document.getElementById("glTip");
  if (!tip) return;
  tip.style.opacity = "0";
  tip.style.display = "none";
}
var _glEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };

/* Wrap EVERY distinct unused-term occurrence in one text node (left-to-right,
   longest-surface-first at each position), then replace the node with the result.
   `used` (per-container) ensures each term decorates at most once per container.
   Returns true if it decorated anything. */
function _glDecorateTextNode(node, used) {
  var text = node.nodeValue;
  if (!text || text.length < _GL_MIN_TERM_LEN) return false;
  var matchers = _glBuildMatchers();
  var frag = null, cursor = 0;
  while (cursor < text.length) {
    var rest = text.slice(cursor), best = null;
    for (var i = 0; i < matchers.length; i++) {
      var m = matchers[i];
      if (used[m.id]) continue;
      var mm = m.re.exec(rest);
      if (!mm) continue;
      var start = cursor + mm.index, end = start + mm[0].length;
      if (!best || start < best.start || (start === best.start && (end - start) > (best.end - best.start))) best = { start: start, end: end, m: m, matched: mm[0] };
    }
    if (!best) break;
    if (!frag) frag = document.createDocumentFragment();
    if (best.start > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, best.start)));
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gl-term";
    btn.textContent = best.matched;                       // preserve the case as it appears in the prose
    btn.setAttribute("data-gl-id", best.m.id);
    btn.setAttribute("data-gl-term", best.m.term);
    btn.setAttribute("data-gl-short", best.m.short);
    btn.setAttribute("aria-label", best.matched + " — " + best.m.short + " (glossary term)");   // SR gets the def on focus; STARTS with the visible matched text (WCAG 2.5.3)
    frag.appendChild(btn);
    used[best.m.id] = 1;
    cursor = best.end;
  }
  if (!frag) return false;
  if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
  node.parentNode.replaceChild(frag, node);
  return true;
}

/* Decorate every eligible text node under rootEl with inline glossary triggers. */
function glDecorate(rootEl) {
  if (!rootEl || typeof document === "undefined" || !document.createTreeWalker) return;
  if (rootEl.getAttribute && rootEl.getAttribute("data-gl-done") === "1") return;   // idempotent per container
  var matchers = _glBuildMatchers();
  if (!matchers.length) return;
  var used = {};   // one decoration per term id per container
  // snapshot text nodes first (we mutate the tree as we go)
  var nodes = [], walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false);
  var n; while ((n = walker.nextNode())) { if (!_glInSkipZone(n) && /\S/.test(n.nodeValue)) nodes.push(n); }
  for (var i = 0; i < nodes.length; i++) { try { _glDecorateTextNode(nodes[i], used); } catch (e) {} }
  if (rootEl.setAttribute) rootEl.setAttribute("data-gl-done", "1");
}

/* ============ one-time style injection (base.html is frozen) ============ */
(function () {
  if (typeof document === "undefined") return;
  if (document.getElementById("glStyle")) return;
  var st = document.createElement("style");
  st.id = "glStyle";
  st.textContent =
    ".gl-term{display:inline;background:none;border:none;padding:0;margin:0;font:inherit;color:inherit;cursor:help;"
    + "text-decoration:underline dotted var(--brass-lt,#c9a85f);text-underline-offset:2px;text-decoration-thickness:1px}"
    + ".gl-term:hover,.gl-term:focus-visible{color:var(--brass-lt,#c9a85f)}"
    + ".gl-term:focus-visible{outline:2px solid var(--brass-lt,#c9a85f);outline-offset:2px;border-radius:2px}";
  (document.head || document.documentElement).appendChild(st);
})();

/* ============ delegated interaction (one set of document listeners) ============ */
(function () {
  if (typeof document === "undefined" || !document.addEventListener) return;
  function target(e) { var t = e.target; while (t && t.nodeType === 1) { if (t.classList && t.classList.contains("gl-term")) return t; t = t.parentNode; } return null; }
  document.addEventListener("mouseover", function (e) { var b = target(e); if (b) _glShowTip(b); });
  document.addEventListener("mouseout", function (e) { var b = target(e); if (b) _glHideTip(); });
  document.addEventListener("focusin", function (e) { var b = target(e); if (b) _glShowTip(b); });
  document.addEventListener("focusout", function (e) { var b = target(e); if (b) _glHideTip(); });
  // tap/click ON a term REVEALS it (touch users have no hover); a click anywhere else dismisses.
  document.addEventListener("click", function (e) { var b = target(e); if (b) { e.preventDefault(); _glShowTip(b); } else { _glHideTip(); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") _glHideTip(); }, true);
  // hide on scroll/resize so the fixed tooltip never strands
  window.addEventListener("scroll", function () { _glHideTip(); }, true);
  window.addEventListener("resize", function () { _glHideTip(); });
})();
