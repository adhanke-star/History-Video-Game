/* ===========================================================================
   M2/M3 · 68-primary-sources.js — "Read the Document" primary-source apparatus.

   Data: data/primary-sources.json -> GAME_DATA["primary-sources"]. Renders short,
   citation-grade document cards in the President's Desk. Confederate
   self-justification cards show:
     verbatim excerpt -> catalyst frame -> attribution
   followed by source critique and source locators.

   PURE READ-OUT: reads GAME_DATA and writes only DOM filter/expand state. No
   campaign mutation, save, RNG, tactical path, battle bridge, or resolve path.
   =========================================================================== */

function _psData() { return gameData("primary-sources"); }
function _psCategoriesData() { var d = _psData(); return (d && Array.isArray(d.categories)) ? d.categories : []; }
function _psRecords() { var d = _psData(); return (d && Array.isArray(d.records)) ? d.records : []; }
var _psEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };
function _psNorm(s) { return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
function _psIdSafe(s) { return String(s == null ? "" : s).replace(/[^A-Za-z0-9_-]/g, "_"); }
function _psWordCount(s) { var n = _psNorm(s); return n ? n.split(" ").length : 0; }

var _PS_CAT_FALLBACK = [
  { id: "confederate-self-justification", label: "Confederacy in its own words", col: "#d8b48a", blurb: "Documents that name slavery, white supremacy, or the Black-soldier contradiction from inside Confederate politics." },
  { id: "union-war-power", label: "Union war power", col: "#9fb8d4", blurb: "Federal documents that made emancipation and Black service a war power." },
  { id: "black-soldier-agency", label: "Black freedom struggle", col: "#9fc3b0", blurb: "Black soldiers and recruiters arguing for freedom, service, pay, and dignity." },
  { id: "reconstruction-memory", label: "Reconstruction & memory", col: "#cbb27a", blurb: "Black citizenship claims, Black Codes, Klan terror, and the making of Civil War memory." }
];

function _psCatMeta(id) {
  var cs = _psCategoriesData();
  for (var i = 0; i < cs.length; i++) if (cs[i] && cs[i].id === id) return { id: id, label: cs[i].label || id, col: cs[i].col || _psCatCol(id), blurb: cs[i].blurb || "" };
  for (var j = 0; j < _PS_CAT_FALLBACK.length; j++) if (_PS_CAT_FALLBACK[j].id === id) return _PS_CAT_FALLBACK[j];
  return { id: id || "", label: id || "", col: "#d8b48a", blurb: "" };
}
function _psCatCol(id) { for (var i = 0; i < _PS_CAT_FALLBACK.length; i++) if (_PS_CAT_FALLBACK[i].id === id) return _PS_CAT_FALLBACK[i].col; return "#d8b48a"; }
function _psCatRank(id) { for (var i = 0; i < _PS_CAT_FALLBACK.length; i++) if (_PS_CAT_FALLBACK[i].id === id) return i; return 99; }
function _psCatOrder() {
  var out = [], seen = {}, cs = _psCategoriesData(), rs = _psRecords();
  for (var i = 0; i < cs.length; i++) if (cs[i] && cs[i].id && !seen[cs[i].id]) { out.push(cs[i].id); seen[cs[i].id] = 1; }
  for (var f = 0; f < _PS_CAT_FALLBACK.length; f++) {
    var fid = _PS_CAT_FALLBACK[f].id;
    for (var r = 0; r < rs.length; r++) if (rs[r] && rs[r].category === fid && !seen[fid]) { out.push(fid); seen[fid] = 1; break; }
  }
  for (var j = 0; j < rs.length; j++) if (rs[j] && rs[j].category && !seen[rs[j].category]) { out.push(rs[j].category); seen[rs[j].category] = 1; }
  return out;
}
function _psSortRecords(a, b) {
  var ca = _psCatRank(a && a.category), cb = _psCatRank(b && b.category);
  if (ca !== cb) return ca - cb;
  var da = String((a && a.date) || ""), db = String((b && b.date) || "");
  if (da !== db) return da < db ? -1 : 1;
  var ta = _psNorm(a && a.title), tb = _psNorm(b && b.title);
  return ta < tb ? -1 : (ta > tb ? 1 : 0);
}
function _psTokens(rec) {
  if (!rec) return "";
  var bits = [rec.title || "", rec.author || "", rec.date || "", rec.place || "", rec.verbatimExcerpt || "", rec.indictment || "", rec.attribution || "", _psCatMeta(rec.category).label];
  if (Array.isArray(rec.sources)) {
    for (var i = 0; i < rec.sources.length; i++) bits.push(_psSourceText(rec.sources[i]));
  }
  return _psNorm(bits.join(" "));
}
function _psSourceText(src) {
  if (typeof src === "string") return src;
  if (!src) return "";
  return [src.title || "", src.repository || "", src.locator || "", src.url || ""].join(" ");
}
function _psSourceList(rec) {
  var srcs = Array.isArray(rec && rec.sources) ? rec.sources : [];
  if (!srcs.length) return "";
  var lis = "";
  for (var i = 0; i < srcs.length; i++) {
    var s = srcs[i], title = (typeof s === "string") ? s : (s.title || "Source");
    var repo = (s && typeof s === "object" && s.repository) ? " - " + s.repository : "";
    var loc = (s && typeof s === "object" && s.locator) ? " (" + s.locator + ")" : "";
    var url = (s && typeof s === "object" && s.url) ? String(s.url) : "";
    var text = _psEsc(title + repo + loc);
    lis += '<li style="margin-bottom:3px">' + (url ? '<a href="' + _psEsc(url) + '" target="_blank" rel="noopener" style="color:var(--brass-lt,#c9a85f)">' + text + '</a>' : text) + '</li>';
  }
  return '<div class="ps-sources" style="margin-top:7px;font-size:10px;opacity:.72"><span style="text-transform:uppercase;letter-spacing:.06em">' + _psEsc(rec.provenance || "Inferred") + ' sources</span>'
    + '<ul style="margin:4px 0 0;padding-left:16px;line-height:1.45">' + lis + '</ul></div>';
}
function _psCatChip(catId) {
  var m = _psCatMeta(catId);
  return '<span style="display:inline-flex;align-items:center;font-size:10px;letter-spacing:.03em;color:' + _psEsc(m.col) + ';border:1px solid ' + _psEsc(m.col) + ';border-radius:3px;padding:1px 5px;white-space:nowrap">' + _psEsc(m.label) + '</span>';
}
function _psCardHTML(rec) {
  if (!rec || !rec.id) return "";
  var sid = _psIdSafe(rec.id), wc = _psWordCount(rec.verbatimExcerpt || "");
  var confed = rec.category === "confederate-self-justification";
  var cat = _psCatMeta(rec.category);
  var catalyst = confed && rec.catalystFrame ? '<div class="ps-step ps-catalyst" style="margin-top:6px;padding:8px;border-left:3px solid #d8b48a;background:rgba(216,180,138,.08)"><b style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#d8b48a">Catalyst frame</b><span>' + _psEsc(rec.catalystFrame) + '</span></div>' : "";
  return ''
    + '<div class="ps-card" id="psCard_' + sid + '" data-ps-category="' + _psEsc(rec.category || "") + '" data-ps-tokens="' + _psEsc(_psTokens(rec)) + '" '
    +      'style="margin:9px 0;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.14);overflow:hidden">'
    +   '<button id="psHead_' + sid + '" type="button" class="ps-head" aria-expanded="false" aria-controls="psBody_' + sid + '" '
    +        'style="display:flex;width:100%;gap:9px;justify-content:space-between;align-items:flex-start;background:none;border:none;color:inherit;cursor:pointer;text-align:left;padding:10px 12px;font-family:inherit">'
    +     '<span style="min-width:0;flex:1 1 auto"><span style="display:block;font-size:14px;font-weight:bold">' + _psEsc(rec.title || "") + '</span>'
    +       '<span style="display:block;font-size:11px;opacity:.75;margin-top:2px">' + _psEsc((rec.author || "Unknown") + " - " + (rec.date || "") + (rec.place ? " - " + rec.place : "")) + '</span></span>'
    +     '<span style="flex:0 0 auto">' + _psCatChip(rec.category) + ' <span class="ps-caret" aria-hidden="true" style="font-size:11px;opacity:.65">&#9656;</span></span>'
    +   '</button>'
    +   '<div id="psBody_' + sid + '" class="ps-body" style="display:none;border-top:1px dotted var(--rule);padding:10px 12px 11px">'
    +     '<div class="ps-step ps-quote" style="padding:9px 10px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.12);border-radius:5px">'
    +       '<b style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;opacity:.72">Verbatim excerpt (' + wc + ' words)</b>'
    +       '<blockquote style="margin:5px 0 0;font-size:14px;line-height:1.55;color:#fff3d1">"' + _psEsc(rec.verbatimExcerpt || "") + '"</blockquote>'
    +     '</div>'
    +     catalyst
    +     '<div class="ps-step ps-attribution" style="margin-top:6px;font-size:11px;line-height:1.5"><b>Attribution:</b> ' + _psEsc(rec.attribution || "") + '</div>'
    +     (rec.sourceCritique ? '<div style="margin-top:5px;font-size:11px;line-height:1.5;opacity:.82"><b>Source critique:</b> ' + _psEsc(rec.sourceCritique) + '</div>' : "")
    +     (rec.indictment ? '<div style="margin-top:6px;font-size:12px;line-height:1.55"><b>Why it matters:</b> ' + _psEsc(rec.indictment) + '</div>' : "")
    +     '<div style="margin-top:6px;font-size:10px;opacity:.68;text-transform:uppercase;letter-spacing:.06em">' + _psEsc(cat.blurb || "") + '</div>'
    +     _psSourceList(rec)
    +   '</div>'
    + '</div>';
}

function primarySourcesRenderTab(C) {
  var rs = _psRecords();
  if (!_psData() || !rs.length) {
    return '<p class="lede" style="font-size:13px;opacity:.78">The document reader is being compiled. No primary sources are yet available.</p>';
  }
  var records = rs.slice().sort(_psSortRecords), cats = _psCatOrder(), counts = {}, cards = "";
  for (var i = 0; i < records.length; i++) { counts[records[i].category] = (counts[records[i].category] || 0) + 1; cards += _psCardHTML(records[i]); }
  var pills = '<button type="button" class="ps-filter bigbtn" data-ps-category-filter="all" data-ps-blurb="" aria-pressed="true" style="font-size:11px;padding:3px 12px;margin:0 5px 6px 0">All <span style="opacity:.75">' + records.length + '</span></button>';
  for (var c = 0; c < cats.length; c++) {
    var m = _psCatMeta(cats[c]);
    pills += '<button type="button" class="ps-filter upg" data-ps-category-filter="' + _psEsc(cats[c]) + '" data-ps-blurb="' + _psEsc(m.blurb || "") + '" aria-pressed="false" style="font-size:11px;padding:3px 12px;margin:0 5px 6px 0">' + _psEsc(m.label) + ' <span style="opacity:.75">' + (counts[cats[c]] || 0) + '</span></button>';
  }
  var focusCss = '<style>'
    + '#psSearch:focus-visible,#psList .ps-head:focus-visible{outline:2px solid var(--brass-lt,#c9a85f);outline-offset:2px;border-radius:3px}'
    + '.ps-card a:focus-visible{outline:2px solid var(--brass-lt,#c9a85f);outline-offset:2px;border-radius:3px}'
    + '</style>';
  return ''
    + focusCss
    + '<div style="max-width:720px;margin:0 auto">'
    +   '<p class="lede" style="font-size:13px;margin-bottom:8px">Read the document, then read the frame. These short primary-source cards quote the war\'s own actors while keeping provenance and source limits visible.</p>'
    +   '<label for="psSearch" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">Search primary sources</label>'
    +   '<input id="psSearch" type="search" autocomplete="off" placeholder="Search documents, people, places..." aria-describedby="psCount psBlurb" '
    +     'style="width:100%;box-sizing:border-box;margin:0 0 8px;padding:7px 9px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.22);color:inherit">'
    +   '<div id="psFilters" role="group" aria-label="Primary source filters" style="margin:0 0 4px">' + pills + '</div>'
    +   '<div id="psCount" aria-live="polite" style="font-size:11px;opacity:.75;margin:2px 0 0">' + records.length + ' documents shown</div>'
    +   '<div id="psBlurb" aria-live="polite" style="font-size:11px;opacity:.68;margin:3px 0 8px;min-height:16px">All document lanes.</div>'
    +   '<div id="psList">' + cards + '</div>'
    +   '<p id="psEmpty" style="display:none;font-size:12px;opacity:.7;text-align:center;margin:14px 0">No document cards match that search.</p>'
    + '</div>';
}

function _psVisibleCount() {
  var cards = document.querySelectorAll(".ps-card"), n = 0;
  for (var i = 0; i < cards.length; i++) if (cards[i].style.display !== "none") n++;
  return n;
}
function _psApplyFilter(query, category) {
  var q = _psNorm(query), cat = category || "all";
  var cards = document.querySelectorAll(".ps-card");
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i], ccat = c.getAttribute("data-ps-category") || "", toks = c.getAttribute("data-ps-tokens") || "";
    var okCat = (cat === "all" || ccat === cat);
    var okQ = (!q || toks.indexOf(q) >= 0);
    c.style.display = (okCat && okQ) ? "" : "none";
  }
  var shown = _psVisibleCount(), cnt = document.getElementById("psCount"), empty = document.getElementById("psEmpty");
  if (cnt) cnt.textContent = shown + " document" + (shown === 1 ? "" : "s") + " shown";
  if (empty) empty.style.display = shown ? "none" : "";
}
function primarySourcesWireTab(C) {
  var currentCat = "all", search = document.getElementById("psSearch");
  var heads = document.querySelectorAll(".ps-head");
  for (var h = 0; h < heads.length; h++) {
    heads[h].addEventListener("click", function () {
      var id = this.getAttribute("aria-controls"), body = document.getElementById(id);
      var open = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", open ? "false" : "true");
      var caret = this.querySelector(".ps-caret"); if (caret) caret.innerHTML = open ? "&#9656;" : "&#9662;";
      if (body) body.style.display = open ? "none" : "";
    });
  }
  var filters = document.querySelectorAll(".ps-filter");
  for (var i = 0; i < filters.length; i++) {
    filters[i].addEventListener("click", function () {
      currentCat = this.getAttribute("data-ps-category-filter") || "all";
      for (var j = 0; j < filters.length; j++) { filters[j].className = "ps-filter " + (filters[j] === this ? "bigbtn" : "upg"); filters[j].setAttribute("aria-pressed", filters[j] === this ? "true" : "false"); }
      var blurb = document.getElementById("psBlurb"); if (blurb) blurb.textContent = this.getAttribute("data-ps-blurb") || "All document lanes.";
      _psApplyFilter(search ? search.value : "", currentCat);
    });
  }
  if (search) search.addEventListener("input", function () { _psApplyFilter(search.value, currentCat); });
  _psApplyFilter("", "all");
}
