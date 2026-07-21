/* ============================================================================
   D504 / LANE-019 Slice 1 — source-backed read-only conquest territory board.

   This module owns no campaign state. It reads the injected territory registry,
   constructs a new immutable normalized value, and renders transient DOM only.
   Missing/malformed data or enablement fails the entire entry point closed.
   ========================================================================== */
var conquestBoardNormalized = null;
var conquestBoardReady = null;
var conquestBoardOpen = null;

(function conquestBoardModule() {
  var _ctExpected = [
    ["CT-01","Baltimore-Washington Corridor"], ["CT-02","Upper Potomac-Harpers Ferry"],
    ["CT-03","Northern Virginia-Manassas"], ["CT-04","Shenandoah Valley-Strasburg"],
    ["CT-05","Richmond Capital District"], ["CT-06","Petersburg-City Point"],
    ["CT-07","Virginia Southside-Lynchburg"], ["CT-08","Hampton Roads-Peninsula"],
    ["CT-09","North Carolina Sounds-Weldon"], ["CT-10","Cape Fear-Wilmington"],
    ["CT-11","Charleston-Port Royal Lowcountry"], ["CT-12","Savannah-Coastal Georgia"],
    ["CT-13","Augusta-Upper Savannah"], ["CT-14","Atlanta-North Georgia"],
    ["CT-15","Macon-Central Georgia"], ["CT-16","Montgomery-Central Alabama"],
    ["CT-17","Mobile Bay-Lower Alabama"], ["CT-18","Louisville-Ohio Falls"],
    ["CT-19","Cairo-Paducah-Western Kentucky"], ["CT-20","Nashville-Middle Tennessee"],
    ["CT-21","Chattanooga-East Tennessee"], ["CT-22","Tennessee River-Shiloh"],
    ["CT-23","Memphis-West Tennessee"], ["CT-24","Corinth-North Mississippi"],
    ["CT-25","Vicksburg-Mississippi Bend"], ["CT-26","Jackson-Central Mississippi"],
    ["CT-27","Meridian-East Mississippi"], ["CT-28","Lower Mississippi-New Orleans"],
    ["CT-29","Missouri River-St. Louis"], ["CT-30","Missouri Ozarks"],
    ["CT-31","Lower Arkansas-Arkansas Post"], ["CT-32","Little Rock-Central Arkansas"],
    ["CT-33","Alexandria-Lower Red River"], ["CT-34","Shreveport-North Louisiana"],
    ["CT-35","Marshall-East Texas"], ["CT-36","Houston-Galveston"]
  ];
  var _ctRegions = {
    "Chesapeake Approaches":1, "Virginia Heartland":1, "Atlantic Coast":1,
    "Georgia-Alabama Interior":1, "Ohio-Tennessee":1, "Mississippi Spine":1,
    "Trans-Mississippi":1
  };
  var _ctProvenance = { Verified:1, Inferred:1, Disputed:1 };
  var _ctRootKeys = ["schema","version","enablement","sourceRegisters","territories"];
  var _ctEnableKeys = ["mode","enabled","status"];
  var _ctSourceKeys = ["id","label","locator"];
  var _ctRowKeys = ["id","name","displayOrder","teachingRegion","anchors","sources","provenance","uncertainty","nonLinks"];
  var _ctNonLinkKeys = ["id","claim","sourceRefs"];
  var _ctForbiddenKey = /^(movement|movementpoints|capacity|ownership|owner|control|condition|economy|reinforcement|objective|ai|save|state|army|armies|casualty|casualties|winner|score|surrender|tacticaloutput|battleResult|reward|receipt)$/i;
  var _ctEscapeHandler = null;
  var _ctReturnFocusId = "gnConquestBoard";

  function _ctPlain(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function _ctText(v, max) {
    if (typeof v !== "string") return "";
    var s = v.replace(/\s+/g, " ").trim();
    return s && s.length <= max ? s : "";
  }
  function _ctExactKeys(o, keys) {
    if (!_ctPlain(o)) return false;
    var got = Object.keys(o).sort(), want = keys.slice().sort();
    if (got.length !== want.length) return false;
    for (var i=0;i<want.length;i++) if (got[i] !== want[i]) return false;
    return true;
  }
  function _ctSafeId(v, re) { return typeof v === "string" && re.test(v); }
  function _ctNoForbiddenKeys(node, depth) {
    if (depth > 10) return false;
    if (Array.isArray(node)) {
      for (var i=0;i<node.length;i++) if (!_ctNoForbiddenKeys(node[i], depth+1)) return false;
      return true;
    }
    if (!_ctPlain(node)) return true;
    var keys = Object.keys(node);
    for (var k=0;k<keys.length;k++) {
      if (_ctForbiddenKey.test(keys[k]) || !_ctNoForbiddenKeys(node[keys[k]], depth+1)) return false;
    }
    return true;
  }
  function _ctFreeze(node) {
    if (!node || typeof node !== "object") return node;
    var keys = Object.keys(node);
    for (var i=0;i<keys.length;i++) _ctFreeze(node[keys[i]]);
    try { return Object.freeze(node); } catch (e) { return node; }
  }
  function _ctRaw() {
    try {
      return (typeof GAME_DATA === "object" && GAME_DATA) ? GAME_DATA["conquest-territories"] : null;
    } catch (e) { return null; }
  }

  conquestBoardNormalized = function () {
    var raw = _ctRaw();
    if (!_ctExactKeys(raw, _ctRootKeys) || !_ctNoForbiddenKeys(raw, 0)) return null;
    if (raw.schema !== "cw_conquest_territories_v1" || raw.version !== 1) return null;
    if (!_ctExactKeys(raw.enablement, _ctEnableKeys) || raw.enablement.mode !== "read-only" ||
        raw.enablement.enabled !== true || raw.enablement.status !== "read-only foundation; conquest play not yet enabled") return null;
    if (!Array.isArray(raw.sourceRegisters) || !raw.sourceRegisters.length || !Array.isArray(raw.territories) || raw.territories.length !== 36) return null;

    var sourceIds = {}, sources = [];
    for (var s=0;s<raw.sourceRegisters.length;s++) {
      var src = raw.sourceRegisters[s];
      if (!_ctExactKeys(src, _ctSourceKeys) || !_ctSafeId(src.id, /^[A-Z0-9][A-Z0-9-]{1,31}$/) || sourceIds[src.id] ||
          !_ctText(src.label, 180) || !_ctText(src.locator, 240)) return null;
      sourceIds[src.id] = 1;
      sources.push({ id:src.id, label:_ctText(src.label,180), locator:_ctText(src.locator,240) });
    }

    var requiredAnchors = {}, seenAnchors = {}, rows = [];
    for (var rn=1;rn<=35;rn++) requiredAnchors["RN-" + (rn<10 ? "0" : "") + rn] = 1;
    for (var wn=1;wn<=41;wn++) requiredAnchors["WN-" + (wn<10 ? "0" : "") + wn] = 1;
    requiredAnchors["BATTLE-WILSONS-CREEK"] = 1;
    requiredAnchors["BATTLE-ELKHORN-TAVERN"] = 1;

    for (var i=0;i<raw.territories.length;i++) {
      var row = raw.territories[i], expected = _ctExpected[i];
      if (!_ctExactKeys(row, _ctRowKeys) || row.id !== expected[0] || row.name !== expected[1] ||
          row.displayOrder !== i+1 || !_ctRegions[row.teachingRegion] || !_ctProvenance[row.provenance] ||
          !_ctText(row.uncertainty, 500) || !Array.isArray(row.anchors) || !row.anchors.length ||
          !Array.isArray(row.sources) || row.sources.length < 2 || !Array.isArray(row.nonLinks) || !row.nonLinks.length) return null;

      var anchors = [], rowSources = [], nonLinks = [], rowSourceSeen = {};
      for (var a=0;a<row.anchors.length;a++) {
        var anchor = row.anchors[a];
        if (!requiredAnchors[anchor] || seenAnchors[anchor]) return null;
        seenAnchors[anchor] = 1; anchors.push(anchor);
      }
      for (var q=0;q<row.sources.length;q++) {
        var ref = row.sources[q];
        if (!sourceIds[ref] || rowSourceSeen[ref]) return null;
        rowSourceSeen[ref] = 1; rowSources.push(ref);
      }
      for (var n=0;n<row.nonLinks.length;n++) {
        var nl = row.nonLinks[n];
        if (!_ctExactKeys(nl, _ctNonLinkKeys) || !_ctSafeId(nl.id, /^NL-CT\d{2}-\d{2}$/) ||
            !_ctText(nl.claim, 500) || !Array.isArray(nl.sourceRefs) || nl.sourceRefs.length < 2) return null;
        var nlRefs = [], nlSeen = {};
        for (var x=0;x<nl.sourceRefs.length;x++) {
          var nlRef = nl.sourceRefs[x];
          if (!sourceIds[nlRef] || nlSeen[nlRef]) return null;
          nlSeen[nlRef] = 1; nlRefs.push(nlRef);
        }
        nonLinks.push({ id:nl.id, claim:_ctText(nl.claim,500), sourceRefs:nlRefs });
      }
      rows.push({
        id:row.id, name:row.name, displayOrder:row.displayOrder,
        teachingRegion:row.teachingRegion, anchors:anchors, sources:rowSources,
        provenance:row.provenance, uncertainty:_ctText(row.uncertainty,500), nonLinks:nonLinks
      });
    }
    var expectedAnchorIds = Object.keys(requiredAnchors);
    if (Object.keys(seenAnchors).length !== expectedAnchorIds.length) return null;
    for (var z=0;z<expectedAnchorIds.length;z++) if (!seenAnchors[expectedAnchorIds[z]]) return null;

    return _ctFreeze({
      schema:raw.schema, version:raw.version,
      enablement:{ mode:"read-only", enabled:true, status:raw.enablement.status },
      sourceRegisters:sources, territories:rows
    });
  };

  conquestBoardReady = function () { return !!conquestBoardNormalized(); };

  function _ctEsc(v) {
    return (typeof htmlEsc === "function") ? htmlEsc(v) : String(v == null ? "" : v)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function _ctSourceLabels(refs, sourceMap) {
    var out=[];
    for (var i=0;i<refs.length;i++) out.push(refs[i] + " — " + sourceMap[refs[i]].label);
    return out.join("; ");
  }
  function _ctRowHtml(row, sourceMap) {
    var non="";
    for (var i=0;i<row.nonLinks.length;i++) {
      var nl=row.nonLinks[i];
      non += '<li><b>' + _ctEsc(nl.id) + ' — explicit non-link:</b> ' + _ctEsc(nl.claim)
        + '<br><span class="ct-source">Evidence: ' + _ctEsc(_ctSourceLabels(nl.sourceRefs,sourceMap)) + '</span></li>';
    }
    return '<li class="ct-row" id="ctRow-' + _ctEsc(row.id) + '"><details data-ct-detail="' + _ctEsc(row.id) + '">'
      + '<summary><span class="ct-id">' + _ctEsc(row.id) + '</span> <span class="ct-name">' + _ctEsc(row.name) + '</span>'
      + '<span class="ct-prov ct-prov-' + row.provenance.toLowerCase() + '">' + _ctEsc(row.provenance) + '</span></summary>'
      + '<div class="ct-detail"><p><b>Teaching region:</b> ' + _ctEsc(row.teachingRegion) + '</p>'
      + '<p><b>Exact source anchors:</b> ' + _ctEsc(row.anchors.join(", ")) + '</p>'
      + '<p><b>Provenance:</b> ' + _ctEsc(row.provenance) + ' <span class="ct-symbol" aria-hidden="true">'
      + (row.provenance === "Verified" ? "[V]" : row.provenance === "Inferred" ? "[I]" : "[D]") + '</span></p>'
      + '<p><b>Uncertainty / caution:</b> ' + _ctEsc(row.uncertainty) + '</p>'
      + '<p><b>Resolved sources:</b> <span class="ct-source">' + _ctEsc(_ctSourceLabels(row.sources,sourceMap)) + '</span></p>'
      + '<h3>Explicit non-links and limits</h3><ul>' + non + '</ul></div></details></li>';
  }
  function _ctBoardHtml(pack) {
    var sourceMap={}, list="", schematic="";
    for (var s=0;s<pack.sourceRegisters.length;s++) sourceMap[pack.sourceRegisters[s].id]=pack.sourceRegisters[s];
    for (var i=0;i<pack.territories.length;i++) {
      var row=pack.territories[i];
      list += _ctRowHtml(row,sourceMap);
      schematic += '<button type="button" class="ct-node ct-node-' + row.provenance.toLowerCase() + '" data-ct-target="' + _ctEsc(row.id)
        + '" aria-label="' + _ctEsc(row.id + ', ' + row.name + ', ' + row.provenance + '. Open its authoritative list detail.') + '">'
        + '<span>' + _ctEsc(row.id) + '</span><b>' + _ctEsc(row.name) + '</b><small>' + _ctEsc(row.provenance) + '</small></button>';
    }
    return '<style id="conquestBoardCss">'
      + '.ct-board{max-width:1180px;margin:0 auto;color:#f3efe4;background:#0b1110;border:1px solid #d8b458;border-radius:8px;padding:16px;line-height:1.5}'
      + '.ct-board *{box-sizing:border-box}.ct-board h1{margin:0 0 4px;color:#fff7df}.ct-kicker{margin:0;color:#d8b458;font-weight:800;text-transform:uppercase;font-size:12px}'
      + '.ct-status{border-left:5px solid #d8b458;background:#17231f;padding:10px;margin:12px 0;font-weight:800}.ct-note{color:#d9dfd8}'
      + '.ct-legend{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.ct-legend span,.ct-prov{border:1px solid currentColor;border-radius:999px;padding:2px 8px;font-weight:800;font-size:12px}'
      + '.ct-prov{margin-left:8px}.ct-prov-verified{color:#aee5c3}.ct-prov-inferred{color:#ffe27a}.ct-prov-disputed{color:#ffb0a8}'
      + '.ct-schematic{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:8px;margin:12px 0 18px}'
      + '.ct-node{min-height:92px;background:#14201d;color:#f3efe4;border:2px solid #87948e;border-radius:7px;padding:8px;text-align:left;display:grid;gap:2px;cursor:pointer}'
      + '.ct-node span,.ct-node small{font-weight:800}.ct-node b{font-size:13px}.ct-node-verified{border-style:solid}.ct-node-inferred{border-style:dashed}.ct-node-disputed{border-style:double;border-width:4px}'
      + '.ct-node:focus-visible,.ct-close:focus-visible,.ct-row summary:focus-visible{outline:3px solid #ffe27a;outline-offset:3px}'
      + '.ct-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.ct-row details{background:#111918;border:1px solid #596b64;border-radius:6px}'
      + '.ct-row summary{cursor:pointer;padding:10px;min-height:48px}.ct-name{font-weight:850}.ct-detail{padding:0 12px 12px}.ct-detail p{overflow-wrap:anywhere}.ct-detail ul{padding-left:22px}'
      + '.ct-source{font-size:12px;color:#d6ddd6}.ct-close{margin-top:16px;min-height:44px;background:#d8b458;color:#101413;border:2px solid #fff0b6;border-radius:6px;padding:8px 14px;font-weight:900;cursor:pointer}'
      + '@media(max-width:520px){.ct-board{padding:10px}.ct-schematic{grid-template-columns:1fr 1fr}.ct-node{min-height:78px;padding:7px}.ct-prov{display:inline-block;margin:5px 0 0 4px}}'
      + '@media(max-width:390px){.ct-schematic{grid-template-columns:1fr}.ct-board{border-left:0;border-right:0}.ct-row summary{padding:9px}}'
      + '@media(prefers-reduced-motion:reduce){.ct-board *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}'
      + 'html[data-a11y-contrast="high"] .ct-board,html[data-a11y-contrast="high"] .ct-row details,html[data-a11y-contrast="high"] .ct-node{background:#000!important;color:#fff!important;border-color:#ffe27a!important}'
      + 'html[data-a11y-contrast="high"] .ct-source{color:#fff!important}'
      + '</style><main class="ct-board" role="main" aria-labelledby="ctBoardTitle">'
      + '<p class="ct-kicker">ARC 7 evidence foundation</p><h1 id="ctBoardTitle">Conquest territory board</h1>'
      + '<p class="ct-status" role="status">' + _ctEsc(pack.enablement.status) + '</p>'
      + '<p class="ct-note">These are operational catchments defined by exact source anchors. The schematic is an illustrative locator only: shape contact implies no control, adjacency, transport service, or tactical-site authority.</p>'
      + '<section aria-labelledby="ctLegendTitle"><h2 id="ctLegendTitle">Provenance key</h2><div class="ct-legend"><span class="ct-prov-verified">[V] Verified</span><span class="ct-prov-inferred">[I] Inferred</span><span class="ct-prov-disputed">[D] Disputed</span></div></section>'
      + '<section aria-labelledby="ctSchematicTitle" aria-describedby="ctSchematicDesc"><h2 id="ctSchematicTitle">Schematic enhancement — 36 territories</h2><p id="ctSchematicDesc">Each control opens the matching authoritative list detail below. Position and contact are illustrative only.</p><div class="ct-schematic">' + schematic + '</div></section>'
      + '<section aria-labelledby="ctListTitle"><h2 id="ctListTitle">Authoritative territory list — 36 territories</h2><ol class="ct-list">' + list + '</ol></section>'
      + '<button type="button" class="ct-close" id="ctBoardClose">Return to main menu</button></main>';
  }

  function _ctRemoveEscape() {
    if (_ctEscapeHandler && typeof document !== "undefined") document.removeEventListener("keydown", _ctEscapeHandler, true);
    _ctEscapeHandler=null;
  }
  function _ctClose() {
    _ctRemoveEscape();
    if (typeof openMainMenu === "function") openMainMenu();
    if (typeof setTimeout === "function") setTimeout(function(){
      var el=(typeof document !== "undefined") ? document.getElementById(_ctReturnFocusId) : null;
      if (el && typeof el.focus === "function") el.focus();
    },0);
  }
  function _ctWire() {
    var close=document.getElementById("ctBoardClose");
    if (close) close.addEventListener("click",_ctClose);
    var nodes=document.querySelectorAll("[data-ct-target]");
    for (var i=0;i<nodes.length;i++) nodes[i].addEventListener("click",function(){
      var id=this.getAttribute("data-ct-target"), detail=document.querySelector('[data-ct-detail="'+id+'"]');
      if (!detail) return;
      detail.open=true;
      if (typeof detail.scrollIntoView === "function") detail.scrollIntoView({block:"start"});
      var summary=detail.querySelector("summary"); if (summary && summary.focus) summary.focus();
    });
    _ctEscapeHandler=function(e){ if (e && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); _ctClose(); } };
    document.addEventListener("keydown",_ctEscapeHandler,true);
  }

  conquestBoardOpen = function () {
    var pack=conquestBoardNormalized();
    if (!pack || typeof document === "undefined" || typeof openSheet !== "function") return false;
    var active=document.activeElement;
    _ctReturnFocusId=(active && active.id) ? active.id : "gnConquestBoard";
    _ctRemoveEscape();
    openSheet(_ctBoardHtml(pack));
    _ctWire();
    var title=document.getElementById("ctBoardTitle");
    if (title) { title.setAttribute("tabindex","-1"); title.focus(); }
    return true;
  };
})();
