/* ==========================================================================
   D506 / LANE-019 Slice 2A — immutable read-only transport evidence.
   D521 / Slice 2B — pure ruleset-filtered physical-service evidence.

   This module normalizes one injected evidence owner. It creates no UI and owns
   no campaign behavior. Any shape, mapping, source, or territory drift fails the
   complete value closed to null.
   ========================================================================== */
var conquestTransportNormalized = null;
var conquestTransportPhysicalServices = null;

(function conquestTransportModule() {
  var _trRootKeys = ["schema","version","enablement","sourcePackets","railServices","waterServices","seaServices","interchanges","nonLinks","roadStatus"];
  var _trEnableKeys = ["mode","enabled","status"];
  var _trServiceKeys = ["id","mode","evidenceRowIds","endpointAnchorIds","territoryRefs","direction","historicalEligibility","mayhemPhysicalEligibility","provenance","scope","sourceRefs","uncertainty","nonLinkRefs"];
  var _trHistoricalKeys = ["status","dateText"];
  var _trInterchangeKeys = ["id","modes","endpointAnchorIds","territoryRefs","evidenceRowIds","historicalEligibility","mayhemPhysicalEligibility","provenance","sourceRefs","handlingLimit"];
  var _trNonLinkKeys = ["id","modes","endpointAnchorIds","territoryRefs","evidenceRowIds","claim","provenance","sourceRefs","uncertainty"];
  var _trRailPins = ["485:0c7a6344","478:0bc80c35","473:dcff2792","451:eb3a2a7a","464:5e2889af","510:12b1aea6","487:a3db1246","443:85c16ba7","511:91438176","462:ea0471b7","440:9cc136ac","531:390b0afe","503:62e077e3","484:baf855e9","523:23cc3b54","473:5666ec0c","479:a1f2a105","452:eb68ec70","503:091ff271","508:43657c68","529:822bab1e","486:024bdcdf","470:03bdb1e8","448:3d9b68f4","559:07a167d5","453:1d1a0f5e","504:8fb49da7"];
  var _trWaterPins = ["486:59059fa9","428:bb2ac36d","418:48f40d7b","471:a750161d","463:3a4dee8f","451:5b51ef44","427:1e17eed2","445:2c8a3d3f","468:6398dc87","475:6ed75d62","464:8cb66a95","452:bd942be3","460:c3b5ca0b","461:d4cf0c18","448:9f0a3dd0"];
  var _trSeaPins = ["515:d6c8e150","486:a900b783"];
  var _trInterchangePins = ["555:ff92e1c2","471:f6520709","462:19387efa","489:d5688f6d"];
  var _trNonLinkPins = ["359:df84ad9c","372:e8d50ef3","398:6e221c69","355:1881efaf","419:4797070c","357:89a878e8","373:0c705b34","362:05ddcefc","367:ff8797f8","368:7a4f0152","331:ab7002f7","363:6555f91f","401:264138df","358:06bd22e4","377:5d9142bd","346:03b7a588","369:eb63b349","389:40c03868"];
  var _trAllowedModes = { rail:1, "inland-water":1, sea:1, road:1 };
  var _trAllowedProvenance = { Verified:1, Inferred:1, Disputed:1 };
  var _trAllowedScope = { "node-segment":1, "territory-connection":1, "operation-specific":1 };
  var _trAllowedDirection = { bidirectional:1, "one-way":1, "operation-specific":1 };
  var _trAllowedHistorical = { eligible:1, conditional:1, "operation-specific":1 };

  function _trPlain(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function _trRulesetId(v) {
    if (!_trPlain(v)) return null;
    try {
      var proto=Object.getPrototypeOf(v), names=Object.getOwnPropertyNames(v).sort();
      if ((proto!==Object.prototype && proto!==null) || names.length!==2 || names[0]!=="id" || names[1]!=="version" ||
          (typeof Object.getOwnPropertySymbols==="function" && Object.getOwnPropertySymbols(v).length)) return null;
      var id=Object.getOwnPropertyDescriptor(v,"id"), version=Object.getOwnPropertyDescriptor(v,"version");
      if (!id || !version || !Object.prototype.hasOwnProperty.call(id,"value") || !Object.prototype.hasOwnProperty.call(version,"value") ||
          (id.value!=="historical" && id.value!=="mayhem") || version.value!==1) return null;
      return id.value;
    } catch (e) { return null; }
  }
  function _trExactKeys(o, keys) {
    if (!_trPlain(o)) return false;
    var got=Object.keys(o).sort(), want=keys.slice().sort();
    if (got.length !== want.length) return false;
    for (var i=0;i<want.length;i++) if (got[i] !== want[i]) return false;
    return true;
  }
  function _trText(v, max) { return typeof v === "string" && v.trim() === v && !!v && v.length <= max; }
  function _trUniqueStrings(v, re, allowEmpty) {
    if (!Array.isArray(v) || (!allowEmpty && !v.length)) return false;
    var seen={};
    for (var i=0;i<v.length;i++) {
      if (typeof v[i] !== "string" || (re && !re.test(v[i])) || seen[v[i]]) return false;
      seen[v[i]]=1;
    }
    return true;
  }
  function _trStable(v) {
    if (Array.isArray(v)) return "[" + v.map(_trStable).join(",") + "]";
    if (_trPlain(v)) return "{" + Object.keys(v).sort().map(function(k){ return JSON.stringify(k)+":"+_trStable(v[k]); }).join(",") + "}";
    return JSON.stringify(v);
  }
  function _trSignature(v) {
    var s=_trStable(v), h=2166136261;
    for (var i=0;i<s.length;i++) { h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
    return s.length+":"+(h>>>0).toString(16).padStart(8,"0");
  }
  function _trPinned(rows,pins) {
    if (!Array.isArray(rows) || rows.length !== pins.length) return false;
    for (var i=0;i<rows.length;i++) if (_trSignature(rows[i]) !== pins[i]) return false;
    return true;
  }
  function _trFreeze(v) {
    if (!v || typeof v !== "object") return v;
    var keys=Object.keys(v);
    for (var i=0;i<keys.length;i++) _trFreeze(v[keys[i]]);
    try { return Object.freeze(v); } catch (e) { return v; }
  }
  function _trClone(v) { try { return JSON.parse(JSON.stringify(v)); } catch (e) { return null; } }
  function _trRaw(name) {
    try { return (typeof GAME_DATA === "object" && GAME_DATA) ? GAME_DATA[name] : null; }
    catch (e) { return null; }
  }
  function _trTerritoryIndex() {
    var pack=_trRaw("conquest-territories");
    if (!_trPlain(pack) || pack.schema !== "cw_conquest_territories_v1" || pack.version !== 1 ||
        !Array.isArray(pack.sourceRegisters) || !Array.isArray(pack.territories) || pack.territories.length !== 36) return null;
    var sources={D497:1,D499:1}, anchors={}, territories={};
    for (var sr=1;sr<=26;sr++) sources["SR-"+String(sr).padStart(2,"0")]=1;
    for (var sw=1;sw<=32;sw++) sources["SW-"+String(sw).padStart(2,"0")]=1;
    for (var s=0;s<pack.sourceRegisters.length;s++) {
      var src=pack.sourceRegisters[s];
      if (!_trPlain(src) || !_trText(src.id,32)) return null;
      sources[src.id]=1;
    }
    for (var i=0;i<pack.territories.length;i++) {
      var row=pack.territories[i], id="CT-"+String(i+1).padStart(2,"0");
      if (!_trPlain(row) || row.id !== id || territories[id] || !Array.isArray(row.anchors)) return null;
      territories[id]=1;
      for (var a=0;a<row.anchors.length;a++) {
        if (typeof row.anchors[a] !== "string" || anchors[row.anchors[a]]) return null;
        anchors[row.anchors[a]]=id;
      }
    }
    return {sources:sources,anchors:anchors,territories:territories};
  }
  function _trHistorical(v) {
    return _trExactKeys(v,_trHistoricalKeys) && !!_trAllowedHistorical[v.status] && _trText(v.dateText,180);
  }
  function _trRefsResolve(row,index,allowEmptyEvidence) {
    if (!_trUniqueStrings(row.endpointAnchorIds,/^(?:RN|WN)-\d{2}$|^BATTLE-(?:WILSONS-CREEK|ELKHORN-TAVERN)$/,false) ||
        !_trUniqueStrings(row.territoryRefs,/^CT-\d{2}$/,false) ||
        !_trUniqueStrings(row.evidenceRowIds,/^(?:RE|WE)-\d{2}$/,!!allowEmptyEvidence) ||
        !_trUniqueStrings(row.sourceRefs,/^[A-Z0-9][A-Z0-9-]{1,31}$/,false)) return false;
    for (var i=0;i<row.endpointAnchorIds.length;i++) {
      var ct=index.anchors[row.endpointAnchorIds[i]];
      if (!ct || row.territoryRefs.indexOf(ct)<0) return false;
    }
    for (var t=0;t<row.territoryRefs.length;t++) if (!index.territories[row.territoryRefs[t]]) return false;
    for (var s=0;s<row.sourceRefs.length;s++) if (!index.sources[row.sourceRefs[s]]) return false;
    return true;
  }
  function _trService(row,index,id,mode,evidence) {
    return _trExactKeys(row,_trServiceKeys) && row.id===id && row.mode===mode &&
      row.evidenceRowIds.length===1 && row.evidenceRowIds[0]===evidence && _trRefsResolve(row,index,false) &&
      !!_trAllowedDirection[row.direction] && _trHistorical(row.historicalEligibility) &&
      row.mayhemPhysicalEligibility===true && !!_trAllowedProvenance[row.provenance] &&
      !!_trAllowedScope[row.scope] && _trText(row.uncertainty,700) &&
      _trUniqueStrings(row.nonLinkRefs,/^CTNL-\d{2}$/,true);
  }

  conquestTransportNormalized = function () {
    var raw=_trRaw("conquest-transport-evidence"), index=_trTerritoryIndex();
    if (!index || !_trExactKeys(raw,_trRootKeys) || raw.schema!=="cw_conquest_transport_evidence_v1" || raw.version!==1) return null;
    if (!_trExactKeys(raw.enablement,_trEnableKeys) || raw.enablement.mode!=="read-only" || raw.enablement.enabled!==true ||
        raw.enablement.status!=="read-only transport evidence; transport play not yet enabled") return null;
    if (!_trUniqueStrings(raw.sourcePackets,/^D\d{3}$/,false) || raw.sourcePackets.length!==2 || raw.sourcePackets[0]!=="D497" || raw.sourcePackets[1]!=="D499" ||
        raw.roadStatus!=="ROAD_REQUIRES_BOUNDED_SOURCE_PASS") return null;
    if (!_trPinned(raw.railServices,_trRailPins) || !_trPinned(raw.waterServices,_trWaterPins) || !_trPinned(raw.seaServices,_trSeaPins) ||
        !_trPinned(raw.interchanges,_trInterchangePins) || !_trPinned(raw.nonLinks,_trNonLinkPins)) return null;

    var serviceIds={}, nonLinkIds={};
    for (var r=0;r<27;r++) {
      var rid="CTS-R-"+String(r+1).padStart(2,"0"), re="RE-"+String(r+1).padStart(2,"0");
      if (serviceIds[rid] || !_trService(raw.railServices[r],index,rid,"rail",re)) return null;
      serviceIds[rid]=1;
    }
    var we=[1,3,4,5,6,7,8,9,10,11,12,14,17,21,22];
    for (var w=0;w<we.length;w++) {
      var wid="CTS-W-"+String(w+1).padStart(2,"0"), wer="WE-"+String(we[w]).padStart(2,"0");
      if (serviceIds[wid] || !_trService(raw.waterServices[w],index,wid,"inland-water",wer)) return null;
      serviceIds[wid]=1;
    }
    for (var q=0;q<2;q++) {
      var sid="CTS-S-0"+(q+1), swe=q===0?"WE-24":"WE-26";
      if (serviceIds[sid] || !_trService(raw.seaServices[q],index,sid,"sea",swe)) return null;
      serviceIds[sid]=1;
    }
    for (var n=0;n<raw.nonLinks.length;n++) {
      var nl=raw.nonLinks[n], nid="CTNL-"+String(n+1).padStart(2,"0");
      if (!_trExactKeys(nl,_trNonLinkKeys) || nl.id!==nid || nonLinkIds[nid] || !_trUniqueStrings(nl.modes,/^(?:rail|inland-water|sea|road)$/,false) ||
          !_trRefsResolve(nl,index,n>=15) || !_trText(nl.claim,500) || !_trText(nl.uncertainty,700) || !_trAllowedProvenance[nl.provenance]) return null;
      nonLinkIds[nid]=1;
    }
    var claims={};
    for (var c=0;c<raw.nonLinks.length;c++) { if (claims[raw.nonLinks[c].claim]) return null; claims[raw.nonLinks[c].claim]=1; }
    for (var rs=0;rs<raw.railServices.length;rs++) for (var rn=0;rn<raw.railServices[rs].nonLinkRefs.length;rn++) if (!nonLinkIds[raw.railServices[rs].nonLinkRefs[rn]]) return null;
    for (var ws=0;ws<raw.waterServices.length;ws++) for (var wn=0;wn<raw.waterServices[ws].nonLinkRefs.length;wn++) if (!nonLinkIds[raw.waterServices[ws].nonLinkRefs[wn]]) return null;
    for (var si=0;si<raw.interchanges.length;si++) {
      var ix=raw.interchanges[si], iid="CTI-0"+(si+1);
      if (!_trExactKeys(ix,_trInterchangeKeys) || ix.id!==iid || !_trUniqueStrings(ix.modes,/^(?:rail|inland-water)$/,false) || ix.modes.length!==2 ||
          ix.modes[0]!=="rail" || ix.modes[1]!=="inland-water" || !_trRefsResolve(ix,index,false) || !_trHistorical(ix.historicalEligibility) ||
          ix.mayhemPhysicalEligibility!==true || !_trAllowedProvenance[ix.provenance] || !_trText(ix.handlingLimit,700)) return null;
    }
    var clone=_trClone(raw);
    return clone ? _trFreeze(clone) : null;
  };

  conquestTransportPhysicalServices = function (rulesetView) {
    var rulesetId=_trRulesetId(rulesetView);
    if (!rulesetId) return null;
    var pack=conquestTransportNormalized();
    if (!_trExactKeys(pack,_trRootKeys) || !Array.isArray(pack.railServices) || pack.railServices.length!==27 ||
        !Array.isArray(pack.waterServices) || pack.waterServices.length!==15 ||
        !Array.isArray(pack.seaServices) || pack.seaServices.length!==2 ||
        !Array.isArray(pack.interchanges) || pack.interchanges.length!==4 ||
        !Array.isArray(pack.nonLinks) || pack.nonLinks.length!==18 ||
        pack.roadStatus!=="ROAD_REQUIRES_BOUNDED_SOURCE_PASS") return null;
    var services=pack.railServices.concat(pack.waterServices,pack.seaServices);
    if (rulesetId==="mayhem") services=services.filter(function(row){ return row.mayhemPhysicalEligibility===true; });
    var clone=_trClone({rulesetId:rulesetId,services:services});
    return clone ? _trFreeze(clone) : null;
  };
})();
