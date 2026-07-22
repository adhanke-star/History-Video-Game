/* ============================================================================
   D523 + D525 / LANE-019 Slices 3A-3B — detached conquest foundation.

   This module creates no live campaign, save path, UI, map state, transport
   state, order, or movement. The factory returns one detached four-field value;
   the view validates either that value or its ordinary JSON round trip.

   Existing mayhemInit remains the sole ruleset owner. It runs only against a
   disposable local carrier because Mayhem initialization also sanitizes carried
   receipts. Only the carrier's verified frozen ruleset descriptor/value crosses
   into the exact returned root; every incidental carrier field is discarded.

   The campaign calendar is a detached immutable query over Package A's fixed
   schedule. It is not attached to the factory namespace and establishes no
   current turn, availability, action, resolution boundary, or live state.
   ========================================================================== */
var conquestCampaignFoundation = null;
var conquestCampaignFoundationView = null;
var conquestCampaignCalendar = null;

(function conquestCampaignStateModule() {
  var _ccsOwn = Object.prototype.hasOwnProperty;
  var _ccsStartKeys = ["side","ruleset"];
  var _ccsRulesetKeys = ["id","version"];
  var _ccsRootKeys = ["side","campaignKind","ruleset","conquest"];
  var _ccsKindKeys = ["id","version"];

  function _ccsObject(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }

  function _ccsPrototype(v, allowNull) {
    if (!_ccsObject(v)) return false;
    var proto;
    try { proto = Object.getPrototypeOf(v); } catch (e) { return false; }
    return proto === Object.prototype || (!!allowNull && proto === null);
  }

  function _ccsInheritedEnumerable(v) {
    try {
      for (var key in v) if (!_ccsOwn.call(v, key)) return true;
      return false;
    } catch (e) { return true; }
  }

  function _ccsRecord(v, keys, allowNullPrototype) {
    if (!_ccsPrototype(v, allowNullPrototype) || _ccsInheritedEnumerable(v)) return null;
    var names, symbols, want=keys.slice().sort(), descriptors={};
    try {
      names=Object.getOwnPropertyNames(v).sort();
      symbols=typeof Object.getOwnPropertySymbols === "function" ? Object.getOwnPropertySymbols(v) : [];
      if (symbols.length || names.length !== want.length) return null;
      for (var i=0;i<want.length;i++) if (names[i] !== want[i]) return null;
      for (var j=0;j<keys.length;j++) {
        var descriptor=Object.getOwnPropertyDescriptor(v,keys[j]);
        if (!descriptor || !_ccsOwn.call(descriptor,"value") || descriptor.enumerable !== true) return null;
        descriptors[keys[j]]=descriptor;
      }
      return descriptors;
    } catch (e) { return null; }
  }

  function _ccsEmptyExtensibleObject(v) {
    if (!_ccsPrototype(v, false) || _ccsInheritedEnumerable(v)) return false;
    try {
      if (Object.getOwnPropertyNames(v).length ||
          (typeof Object.getOwnPropertySymbols === "function" && Object.getOwnPropertySymbols(v).length)) return false;
      return Object.isExtensible(v) && !Object.isFrozen(v);
    } catch (e) { return false; }
  }

  function _ccsDescriptorMode(descriptors, keys, locked) {
    for (var i=0;i<keys.length;i++) {
      var d=descriptors[keys[i]];
      if (!d || d.enumerable !== true || d.writable !== !locked || d.configurable !== !locked) return false;
    }
    return true;
  }

  function _ccsFreezeExact(v) {
    try { Object.freeze(v); } catch (e) { return null; }
    return Object.isFrozen(v) ? v : null;
  }

  function _ccsLockedPair(id, version) {
    var value={id:id,version:version};
    return _ccsFreezeExact(value);
  }

  function _ccsCalendarDate(year, month) {
    return _ccsFreezeExact({year:year,month:month});
  }

  function _ccsCalendarRecord(ordinal, start, end, kind) {
    return _ccsFreezeExact({ordinal:ordinal,start:start,end:end,kind:kind});
  }

  function _ccsDefineLocked(root, key, value) {
    try {
      Object.defineProperty(root,key,{value:value,enumerable:true,writable:false,configurable:false});
      var d=Object.getOwnPropertyDescriptor(root,key);
      return !!(d && d.value === value && d.enumerable === true && d.writable === false && d.configurable === false);
    } catch (e) { return false; }
  }

  function _ccsFactoryInput(startView) {
    var start=_ccsRecord(startView,_ccsStartKeys,true);
    if (!start) return null;
    var side=start.side.value, rawRuleset=start.ruleset.value;
    if (side !== "US" && side !== "CS") return null;
    var ruleset=_ccsRecord(rawRuleset,_ccsRulesetKeys,true);
    if (!ruleset) return null;
    var id=ruleset.id.value, version=ruleset.version.value;
    if ((id !== "historical" && id !== "mayhem") || version !== 1) return null;
    return {side:side,rulesetId:id};
  }

  function _ccsCarrierRuleset(id) {
    if (typeof mayhemInit !== "function") return null;
    var carrier={}, descriptor;
    try {
      mayhemInit(carrier,id,"new");
      descriptor=Object.getOwnPropertyDescriptor(carrier,"ruleset");
    } catch (e) { return null; }
    if (!descriptor || !_ccsOwn.call(descriptor,"value") || descriptor.enumerable !== true ||
        descriptor.writable !== false || descriptor.configurable !== false || !Object.isFrozen(descriptor.value)) return null;
    var ruleset=_ccsRecord(descriptor.value,_ccsRulesetKeys,false);
    if (!ruleset || !_ccsDescriptorMode(ruleset,_ccsRulesetKeys,true) ||
        ruleset.id.value !== id || ruleset.version.value !== 1) return null;
    return descriptor;
  }

  function _ccsCandidate(candidate) {
    var root=_ccsRecord(candidate,_ccsRootKeys,false);
    if (!root) return null;
    var factoryMode=root.side.writable === true && root.side.configurable === true &&
      _ccsDescriptorMode(root,["campaignKind","ruleset","conquest"],true);
    var jsonMode=_ccsDescriptorMode(root,_ccsRootKeys,false);
    if ((!factoryMode && !jsonMode) || !Object.isExtensible(candidate)) return null;

    var side=root.side.value, rawKind=root.campaignKind.value,
      rawRuleset=root.ruleset.value, rawConquest=root.conquest.value;
    if (side !== "US" && side !== "CS") return null;

    var kind=_ccsRecord(rawKind,_ccsKindKeys,false), ruleset=_ccsRecord(rawRuleset,_ccsRulesetKeys,false);
    if (!kind || !ruleset || !_ccsEmptyExtensibleObject(rawConquest)) return null;
    if (factoryMode && (!_ccsDescriptorMode(kind,_ccsKindKeys,true) ||
        !_ccsDescriptorMode(ruleset,_ccsRulesetKeys,true) ||
        !Object.isFrozen(rawKind) || !Object.isFrozen(rawRuleset))) return null;
    if (jsonMode && (!_ccsDescriptorMode(kind,_ccsKindKeys,false) ||
        !_ccsDescriptorMode(ruleset,_ccsRulesetKeys,false) ||
        !Object.isExtensible(rawKind) || !Object.isExtensible(rawRuleset))) return null;

    var candidateKind={id:kind.id.value,version:kind.version.value};
    if (candidateKind.id !== "conquest" || candidateKind.version !== 1) return null; // CONQUEST_STATE_BIND_A:VERSION_1
    var candidateRuleset={id:ruleset.id.value,version:ruleset.version.value};
    if ((candidateRuleset.id !== "historical" && candidateRuleset.id !== "mayhem") || candidateRuleset.version !== 1) return null;
    return {side:side,rulesetId:candidateRuleset.id};
  }

  function _ccsSnapshot(parsed) {
    var root={side:parsed.side}, kind=_ccsLockedPair("conquest",1),
      ruleset=_ccsLockedPair(parsed.rulesetId,1), conquest={};
    if (!kind || !ruleset || !_ccsDefineLocked(root,"campaignKind",kind) ||
        !_ccsDefineLocked(root,"ruleset",ruleset) || !_ccsDefineLocked(root,"conquest",conquest) ||
        !_ccsFreezeExact(conquest) || !_ccsFreezeExact(root)) return null;
    return root;
  }

  conquestCampaignCalendar = function () {
    if (arguments.length !== 0) return null;
    try {
      var intervals=[], ordinal, index, year, startMonth, start, end, record;
      for (ordinal=1;ordinal<=24;ordinal++) {
        index=ordinal-1;
        year=1861+Math.floor(index/6);
        startMonth=1+2*(index%6);
        start=_ccsCalendarDate(year,startMonth);
        end=_ccsCalendarDate(year,startMonth+1);
        record=_ccsCalendarRecord(ordinal,start,end,"regular");
        if (!start || !end || !record) return null;
        intervals.push(record);
      }
      var endgameEndMonth=4; // CONQUEST_CALENDAR_BIND_B:ENDGAME_APRIL
      start=_ccsCalendarDate(1865,1);
      end=_ccsCalendarDate(1865,endgameEndMonth);
      record=_ccsCalendarRecord(25,start,end,"endgame");
      if (!start || !end || !record) return null;
      intervals.push(record);
      return _ccsFreezeExact(intervals);
    } catch (e) { return null; }
  };

  conquestCampaignFoundation = function (startView) {
    try {
      var parsed=_ccsFactoryInput(startView);
      if (!parsed) return null;
      var rulesetDescriptor=_ccsCarrierRuleset(parsed.rulesetId);
      if (!rulesetDescriptor) return null;
      var root={side:parsed.side}, kind=_ccsLockedPair("conquest",1), conquest={};
      if (!kind || !_ccsDefineLocked(root,"campaignKind",kind)) return null;
      Object.defineProperty(root,"ruleset",rulesetDescriptor);
      if (!_ccsDefineLocked(root,"conquest",conquest)) return null;
      var installed=Object.getOwnPropertyDescriptor(root,"ruleset");
      if (!installed || installed.value !== rulesetDescriptor.value || installed.enumerable !== true ||
          installed.writable !== false || installed.configurable !== false || !Object.isFrozen(installed.value)) return null;
      return root;
    } catch (e) { return null; }
  };

  conquestCampaignFoundationView = function (candidate) {
    try {
      var parsed=_ccsCandidate(candidate);
      return parsed ? _ccsSnapshot(parsed) : null;
    } catch (e) { return null; }
  };
})();
