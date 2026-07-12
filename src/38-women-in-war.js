/* ============================================================================
   D153 · 38-women-in-war.js — Women in the War: Soldier & Relief Threads.

   Data: data/women-in-war.json -> GAME_DATA["women-in-war"].

   This is a presentation-only, additive lane beside Soldier's Story and the Army
   Register. It renders citation-grade cards and never targets the ss: namespace,
   never supplies replacePid, never writes a registry combatant row, and never
   reaches any tactical/combat/bridge path. Empty data means an exact no-op.
   ========================================================================== */

function _wiwData() { return (typeof gameData === "function") ? gameData("women-in-war") : null; }
function _wiwRecords() { var d = _wiwData(); return (d && Array.isArray(d.records)) ? d.records : []; }
function _wiwEsc(s) { return (typeof _lootEsc === "function") ? _lootEsc(s) : ((typeof htmlEsc === "function") ? htmlEsc(s) : String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")); }
function _wiwAttr(s) { return (typeof _lootAttr === "function") ? _lootAttr(s) : _wiwEsc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function _wiwClean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
function _wiwNorm(s) { return _wiwClean(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
function _wiwRoleLabel(role) {
  var map = {
    "disguised-soldier": "Disguised soldier",
    "relief": "Relief",
    "medical": "Medical",
    "scout-spy": "Scout and spy",
    "nursing-administration": "Nursing administration",
    "diarist": "Diarist",
    "teacher-nurse": "Teacher and nurse",
    "contested": "Contested"
  };
  return map[role] || role || "Role";
}
function _wiwRoleColor(role) {
  if (role === "disguised-soldier") return "#cbb27a";
  if (role === "medical") return "#9fc3b0";
  if (role === "scout-spy") return "#a9bedf";
  if (role === "nursing-administration") return "#d8b48a";
  if (role === "diarist") return "#d7c392";
  if (role === "teacher-nurse") return "#8bbbc5";
  if (role === "contested") return "#e8b46a";
  return "#b9a4c9";
}
function _wiwProvColor(prov) {
  return prov === "Disputed" ? "#e8b46a" : (prov === "Verified" ? "#9fc3b0" : "#cbb27a");
}
function _wiwSourceCount(r) {
  return Array.isArray(r && r.sources) ? r.sources.length : 0;
}
function _wiwCodexRecord(ref) {
  if (!ref || typeof _cxById !== "function") return null;
  try { return _cxById(ref); } catch (e) { return null; }
}
function _wiwImageHTML(r) {
  var ref = r && r.codexRef ? r.codexRef : "";
  var img = "";
  if (ref && typeof usctImageHtml === "function") img = usctImageHtml(ref);
  if (!img && ref && typeof leaderImageHtml === "function") img = leaderImageHtml(ref);
  if (img) return '<div class="wiw-img" style="min-width:0">' + img + '</div>';
  return '<div class="wiw-no-img" aria-label="No verified portrait used" style="display:grid;place-items:center;min-height:118px;border:1px dashed rgba(201,168,95,.65);border-radius:6px;background:repeating-linear-gradient(135deg,rgba(201,168,95,.09),rgba(201,168,95,.09) 8px,rgba(0,0,0,.10) 8px,rgba(0,0,0,.10) 16px);color:#d7c392;text-align:center;font-size:11px;line-height:1.35;padding:10px">No verified portrait used</div>';
}
function _wiwChip(label, color) {
  return '<span style="display:inline-block;border:1px solid ' + color + ';color:' + color + ';border-radius:4px;padding:1px 6px;font-size:10.5px;font-weight:bold;line-height:1.45;white-space:nowrap">' + _wiwEsc(label) + '</span>';
}
function _wiwTextBlob(r) {
  return _wiwNorm([
    r.canonicalName, r.wartimeAlias, r.roleCategory, _wiwRoleLabel(r.roleCategory), r.side,
    r.wartimeRole, r.unitClaimed, r.battleClaimed, r.provenance, r.playerCopy,
    r.integrityNote, Array.isArray(r.warningFlags) ? r.warningFlags.join(" ") : ""
  ].join(" "));
}
function _wiwOptionHTML(values, allLabel) {
  var h = '<option value="">' + _wiwEsc(allLabel) + '</option>';
  for (var i = 0; i < values.length; i++) h += '<option value="' + _wiwAttr(values[i]) + '">' + _wiwEsc(values[i]) + '</option>';
  return h;
}
function _wiwRoleOptionHTML(values) {
  var h = '<option value="">All roles</option>';
  for (var i = 0; i < values.length; i++) h += '<option value="' + _wiwAttr(values[i]) + '">' + _wiwEsc(_wiwRoleLabel(values[i])) + '</option>';
  return h;
}
function _wiwFacetValues(records, key) {
  var seen = {}, vals = [];
  for (var i = 0; i < records.length; i++) {
    var v = _wiwClean(records[i] && records[i][key]);
    if (!v || seen[v]) continue;
    seen[v] = 1; vals.push(v);
  }
  vals.sort(function (a, b) { return String(a).localeCompare(String(b)); });
  return vals;
}
function _wiwSourcesHTML(r) {
  var srcs = Array.isArray(r && r.sources) ? r.sources : [];
  if (!srcs.length) return "";
  var h = '<details style="margin-top:8px"><summary style="cursor:pointer;font-size:11px;color:#d7c392">Sources (' + srcs.length + ')</summary><ol style="margin:6px 0 0;padding-left:18px;font-size:10.5px;line-height:1.45;opacity:.82">';
  for (var i = 0; i < srcs.length; i++) {
    var s = srcs[i] || {};
    var bits = [];
    if (s.author) bits.push(s.author);
    if (s.repository) bits.push(s.repository);
    if (s.locator) bits.push(s.locator);
    if (s.type) bits.push(s.type);
    h += '<li style="margin-bottom:4px"><b>' + _wiwEsc(s.title || s.repository || "Source") + '</b>'
      + (bits.length ? '<span style="opacity:.82"> — ' + _wiwEsc(bits.join(" · ")) + '</span>' : "")
      + (s.supports ? '<div style="opacity:.74">' + _wiwEsc(s.supports) + '</div>' : "")
      + '</li>';
  }
  return h + '</ol></details>';
}
function _wiwWarningsHTML(r) {
  var ws = Array.isArray(r && r.warningFlags) ? r.warningFlags : [];
  if (!ws.length) return "";
  var h = '<details style="margin-top:7px"><summary style="cursor:pointer;font-size:11px;color:#d7c392">Integrity warnings</summary><ul style="margin:6px 0 0;padding-left:16px;font-size:10.5px;line-height:1.45;opacity:.82">';
  for (var i = 0; i < ws.length; i++) h += '<li>' + _wiwEsc(ws[i]) + '</li>';
  return h + '</ul></details>';
}
function _wiwCardHTML(r) {
  if (!r || !r.id) return "";
  var role = _wiwRoleLabel(r.roleCategory);
  var roleColor = _wiwRoleColor(r.roleCategory);
  var prov = r.provenance || "Inferred";
  var provColor = _wiwProvColor(prov);
  var codex = _wiwCodexRecord(r.codexRef);
  var alias = r.wartimeAlias ? ' <span style="opacity:.76;font-size:12px">(' + _wiwEsc(r.wartimeAlias) + ')</span>' : "";
  var mapReason = r.registryMappable && r.registryMappable.reason ? r.registryMappable.reason : "No registry mapping.";
  return '<article class="wiw-card" data-wiw-card="1" data-wiw-id="' + _wiwAttr(r.id) + '" data-wiw-role="' + _wiwAttr(r.roleCategory || "") + '" data-wiw-prov="' + _wiwAttr(prov) + '" data-wiw-text="' + _wiwAttr(_wiwTextBlob(r)) + '" style="border:1px solid var(--rule);border-left:5px solid ' + provColor + ';border-radius:6px;background:rgba(0,0,0,.14);padding:10px;min-width:0">'
    + '<div style="display:grid;grid-template-columns:minmax(104px,150px) minmax(0,1fr);gap:10px;align-items:start">'
    + _wiwImageHTML(r)
    + '<div style="min-width:0">'
    + '<div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin-bottom:5px">' + _wiwChip(prov, provColor) + _wiwChip(role, roleColor) + _wiwChip(r.side || "Side", "#cbb27a") + '</div>'
    + '<h3 style="margin:0 0 2px;font-size:17px;line-height:1.2;overflow-wrap:anywhere">' + _wiwEsc(r.canonicalName) + alias + '</h3>'
    + '<div style="font-size:11.5px;opacity:.78;overflow-wrap:anywhere">' + _wiwEsc(r.wartimeRole || "") + '</div>'
    + '<p style="margin:8px 0 0;font-size:12.5px;line-height:1.52">' + _wiwEsc(r.playerCopy || "") + '</p>'
    + '</div></div>'
    + (r.disputeNote ? '<div class="wiw-dispute" style="margin-top:9px;border:1px solid ' + provColor + ';border-radius:5px;padding:8px;background:rgba(232,180,106,.10);font-size:11.5px;line-height:1.45"><b>Dispute note:</b> ' + _wiwEsc(r.disputeNote) + '</div>' : "")
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:7px;margin-top:9px;font-size:11px">'
    + '<div><b>Unit claimed:</b> ' + _wiwEsc(r.unitClaimed || "None") + '</div>'
    + '<div><b>Campaign tie:</b> ' + _wiwEsc(r.battleClaimed || "None") + '</div>'
    + '<div><b>Registry:</b> ' + _wiwEsc(mapReason) + '</div>'
    + '<div><b>Sources:</b> ' + _wiwEsc(_wiwSourceCount(r)) + '</div>'
    + '</div>'
    + '<div style="margin-top:8px;font-size:11.5px;line-height:1.45"><b>Integrity:</b> ' + _wiwEsc(r.integrityNote || "") + '</div>'
    + (codex ? '<div style="margin-top:7px;font-size:11px;opacity:.78"><b>Codex link:</b> ' + _wiwEsc(codex.term || r.codexRef) + ' — existing sourced record and portrait reused.</div>' : "")
    + _wiwWarningsHTML(r)
    + _wiwSourcesHTML(r)
    /* D386 guarded seam: the M3 arc module (39-women-war-arc.js) renders the
       chapter walk-through; absent module or absent r.arc is an exact no-op. */
    + (typeof wiwArcSectionHTML === "function" ? wiwArcSectionHTML(r, (typeof G !== "undefined" && G && G.campaign) ? G.campaign : null) : "")
    + '</article>';
}
function _wiwControlsHTML(records) {
  var roles = _wiwFacetValues(records, "roleCategory");
  var provs = _wiwFacetValues(records, "provenance");
  var lab = 'display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:3px';
  var ctl = 'width:100%;min-width:0;padding:8px;border-radius:6px;border:1px solid var(--rule);background:#21190f;color:var(--ink)';
  return '<div id="wiwControls" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;align-items:end;margin:8px 0">'
    + '<label style="min-width:0"><span style="' + lab + '">Search</span><input id="wiwSearch" type="search" autocomplete="off" aria-label="Search Women in the War" style="' + ctl + '"></label>'
    + '<label style="min-width:0"><span style="' + lab + '">Role</span><select id="wiwRole" aria-label="Filter Women in the War by role" style="' + ctl + '">' + _wiwRoleOptionHTML(roles) + '</select></label>'
    + '<label style="min-width:0"><span style="' + lab + '">Provenance</span><select id="wiwProv" aria-label="Filter Women in the War by provenance" style="' + ctl + '">' + _wiwOptionHTML(provs, "All provenance") + '</select></label>'
    + '</div>';
}

function wiwThreadHTML(C) {
  var records = _wiwRecords();
  if (!records.length) return "";
  var verified = 0, disputed = 0;
  for (var i = 0; i < records.length; i++) {
    if (records[i] && records[i].provenance === "Verified") verified++;
    if (records[i] && records[i].provenance === "Disputed") disputed++;
  }
  var cards = "";
  for (var c = 0; c < records.length; c++) cards += _wiwCardHTML(records[c]);
  return '<hr class="rule">'
    + '<section id="wiwThread" aria-labelledby="wiwTitle" style="margin-top:8px">'
    + '<style>#wiwThread input:focus-visible,#wiwThread select:focus-visible,#wiwThread summary:focus-visible,#wiwThread button:focus-visible{outline:2px solid var(--brass-lt,#c9a85f);outline-offset:2px;border-radius:3px}@media(max-width:680px){#wiwThread .wiw-card>div:first-child{grid-template-columns:minmax(0,1fr)!important}}</style>'
    + '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end">'
    + '<div><div class="gn-col-head" id="wiwTitle" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:5px">Women in the War</div>'
    + '<p style="font-size:12px;line-height:1.45;margin:0;opacity:.82">Women served in uniformed disguise, carried medical relief to the front, gathered intelligence, and built the Union nursing system.</p></div>'
    + '<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">' + _wiwChip(verified + " Verified", "#9fc3b0") + _wiwChip(disputed + " Disputed", "#e8b46a") + '</div></div>'
    + _wiwControlsHTML(records)
    + '<div id="wiwCount" aria-live="polite" style="font-size:11px;opacity:.75;margin:3px 0 7px">' + records.length + ' cards</div>'
    + '<div id="wiwCards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:9px">' + cards + '</div>'
    + '<div id="wiwEmpty" style="display:none;font-size:12px;opacity:.72;padding:10px 0">No women-in-war cards match the current filters.</div>'
    + '</section>';
}

function wiwWireThread(C, refresh) {
  var root = document.getElementById("wiwThread");
  if (!root) return;
  var search = document.getElementById("wiwSearch");
  var role = document.getElementById("wiwRole");
  var prov = document.getElementById("wiwProv");
  var count = document.getElementById("wiwCount");
  var empty = document.getElementById("wiwEmpty");
  function val(el) { return el ? String(el.value || "") : ""; }
  function apply() {
    var cards = root.querySelectorAll("[data-wiw-card]");
    var q = _wiwNorm(val(search));
    var r = val(role);
    var p = val(prov);
    var shown = 0;
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var ok = (!q || String(card.getAttribute("data-wiw-text") || "").indexOf(q) >= 0)
        && (!r || card.getAttribute("data-wiw-role") === r)
        && (!p || card.getAttribute("data-wiw-prov") === p);
      card.style.display = ok ? "" : "none";
      if (ok) shown++;
    }
    if (count) count.textContent = shown + " of " + cards.length + (cards.length === 1 ? " card" : " cards");
    if (empty) empty.style.display = shown ? "none" : "block";
  }
  if (search) search.addEventListener("input", apply);
  if (role) role.addEventListener("change", apply);
  if (prov) prov.addEventListener("change", apply);
  /* D386 guarded seam: hand the campaign context to the arc module (no-op without it). */
  if (typeof wiwWireArcs === "function") wiwWireArcs(C);
  apply();
}
