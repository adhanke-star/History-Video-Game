/* ===========================================================================
   D418 / LANE-007 Slice A — Historical / Mayhem campaign ruleset kernel.

   One campaign owner: C.ruleset = { id:"historical"|"mayhem", version:1 }.
   This module adds no combat, score, casualty, reward, surrender, result, AAR,
   registry, scenario, or custom-content behavior. It is deliberately late and
   wraps the live campaign bindings by assignment; build/base.html stays frozen.

   Public readers are pure. mayhemInit is the only initializer/sanitizer. The
   bounded picker carry is private UI state, never authority, and every public
   path remains Historical while MAYHEM_PUBLIC_READY is false.
   =========================================================================== */

const MAYHEM_PUBLIC_READY = false;

/* D419 / Slice B — closed declarations and an adapter-only transaction kernel.
   The campaign owns a capped receipt log beside (never inside) C.ruleset.
   No production domain adapter is registered in this slice. */
var MAYHEM_RECEIPT_CAP = 32;
var _MH_TAG_NAMESPACES = ["side","faction","unit","identity","leader","policy","timeline"];
var _MH_PREDICATES = { "ruleset.is":1, "side.isActor":1 };
var _MH_OPERATION_IDS = [
  "battle.score.add","phase.score.add","objective.resolve","casualty.apply","casualty.credit","capture.credit",
  "result.declare","result.reclassify","campaign.victoryProgress.add","enemyWill.add","morale.add","discipline.add",
  "press.add","diplomacy.add","funds.add","resource.add","loot.grant","technology.unlock","weapon.grant",
  "career.promote","reputation.add","notoriety.add","achievement.unlock","modifier.add","roster.add",
  "roster.transfer","reinforcement.add","scenario.unlock","timeline.branch","chronicle.event"
];
var _MH_OPERATION_REGISTRY = (function () { var r = {}; for (var i=0;i<_MH_OPERATION_IDS.length;i++) r[_MH_OPERATION_IDS[i]]={ id:_MH_OPERATION_IDS[i], order:i }; return r; })();

function _mhOwnKeys(v, allowed) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  var keys; try { keys=Object.keys(v); } catch(e) { return false; }
  for (var i=0;i<keys.length;i++) if (allowed.indexOf(keys[i]) < 0) return false;
  return true;
}
function _mhStableId(v) { return typeof v === "string" && /^[a-z0-9][a-z0-9._:-]{0,79}$/.test(v); }
function _mhFinite(v) { return typeof v === "number" && isFinite(v) && Math.abs(v) <= 1000000; }
function _mhClone(v) { try { return JSON.parse(JSON.stringify(v)); } catch(e) { return null; } }
function _mhData() { return typeof GAME_DATA === "object" && GAME_DATA && GAME_DATA["mayhem-rules"] || null; }
function _mhTag(tag, C, ctx) {
  if (!_mhOwnKeys(tag,["namespace","value"]) || _MH_TAG_NAMESPACES.indexOf(tag.namespace)<0 || !_mhStableId(tag.value)) return null;
  var value=tag.value === "actor" ? String(ctx.side||"").toLowerCase() : tag.value;
  if (!_mhStableId(value)) return null;
  return { namespace:tag.namespace, value:value };
}
function _mhActions() {
  var d=_mhData(), out={};
  if (!d || d.schema!=="cw_mayhem_rules_v1" || d.version!==1 || !Array.isArray(d.actions)) return out;
  for (var i=0;i<d.actions.length;i++) { var a=d.actions[i]; if (a && _mhStableId(a.id) && !out[a.id]) out[a.id]=a; }
  return out;
}
function _mhNormalizeContext(ctx) {
  var allowed=["campaign","ruleset","side","timelineId","battleId","phaseId","actorId","sequence","actorTags","adapters","consumed"];
  if (!_mhOwnKeys(ctx,allowed) || !ctx.campaign || typeof ctx.campaign!=="object" || Array.isArray(ctx.campaign)) return null;
  if (!_mhExactRuleset(ctx.ruleset) || JSON.stringify(ctx.ruleset)!==JSON.stringify(mayhemRuleset(ctx.campaign))) return null;
  if (ctx.side!=="US" && ctx.side!=="CS" || ctx.campaign.side!==ctx.side || ctx.consumed===true) return null;
  if (!_mhStableId(ctx.timelineId)||!_mhStableId(ctx.battleId)||!_mhStableId(ctx.phaseId)||!_mhStableId(ctx.actorId)) return null;
  if (!Number.isSafeInteger(ctx.sequence)||ctx.sequence<1||ctx.sequence>1000000000) return null;
  if (!Array.isArray(ctx.actorTags)||ctx.actorTags.length>32 || !ctx.adapters || typeof ctx.adapters!=="object" || Array.isArray(ctx.adapters)) return null;
  return ctx;
}
function _mhReceiptId(ctx, actionId) {
  var s=[ctx.timelineId,ctx.battleId,ctx.phaseId,ctx.actorId,actionId,String(ctx.sequence)].join("|");
  var h=2166136261;
  for (var i=0;i<s.length;i++) { h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return "mh:"+(h>>>0).toString(16).padStart(8,"0")+":"+ctx.sequence;
}
function _mhSanitizeReceipts(C) {
  var raw=Array.isArray(C && C.mayhemReceipts)?C.mayhemReceipts:[], clean=[], seen={};
  for (var i=0;i<raw.length;i++) {
    var r=raw[i];
    if (!_mhOwnKeys(r,["id","actionId","sequence","operations"])||!_mhStableId(r.id)||!_mhStableId(r.actionId)||!Number.isSafeInteger(r.sequence)||r.sequence<1||!Array.isArray(r.operations)||seen[r.id]) continue;
    var ok=true;
    for(var j=0;j<r.operations.length;j++){var o=r.operations[j];if(!_mhOwnKeys(o,["operation","target","value","tag","before","after"])||!_MH_OPERATION_REGISTRY[o.operation]||!_mhStableId(o.target)||!_mhFinite(o.value)||!_mhFinite(o.before)||!_mhFinite(o.after)){ok=false;break;}}
    if(ok){seen[r.id]=1;clean.push(_mhClone(r));}
  }
  clean.sort(function(a,b){return a.sequence-b.sequence||a.id.localeCompare(b.id);});
  if(clean.length>MAYHEM_RECEIPT_CAP)clean=clean.slice(clean.length-MAYHEM_RECEIPT_CAP);
  C.mayhemReceipts=clean;
  var max=0;for(var k=0;k<clean.length;k++)if(clean[k].sequence>max)max=clean[k].sequence;
  C.mayhemSequence=max;
  return clean;
}
function _mhResolve(actionId, context) {
  var ctx=_mhNormalizeContext(context), action=_mhActions()[actionId];
  if(!ctx||!action||!mayhemIsActive(ctx.campaign)||action.rulesetId!=="mayhem")return null;
  var currentSequence=Number.isSafeInteger(ctx.campaign.mayhemSequence)?ctx.campaign.mayhemSequence:0;
  if(ctx.sequence!==currentSequence+1&&ctx.sequence!==currentSequence)return null;
  var tags={};for(var i=0;i<ctx.actorTags.length;i++){var t=_mhTag(ctx.actorTags[i],ctx.campaign,ctx);if(!t)return null;tags[t.namespace+":"+t.value]=1;}
  for(i=0;i<action.actorTags.length;i++){t=_mhTag(action.actorTags[i],ctx.campaign,ctx);if(!t||!tags[t.namespace+":"+t.value])return null;}
  for(i=0;i<action.availableWhen.length;i++){var p=action.availableWhen[i];if(!p||!_MH_PREDICATES[p.id])return null;if(p.id==="ruleset.is"&&p.value!=="mayhem")return null;if(p.id==="side.isActor"&&ctx.campaign.side!==ctx.side)return null;}
  _mhSanitizeReceipts(ctx.campaign);
  var id=_mhReceiptId(ctx,actionId);for(i=0;i<ctx.campaign.mayhemReceipts.length;i++)if(ctx.campaign.mayhemReceipts[i].id===id)return null; // MAYHEM_BIND_DUPLICATE
  var ops=[];
  for(i=0;i<action.effects.length;i++){var e=action.effects[i], reg=e&&_MH_OPERATION_REGISTRY[e.operation], adapter=reg&&ctx.adapters[e.operation];if(!reg||!_mhOwnKeys(e,["operation","target","value","tag"])||!_mhStableId(e.target)||!_mhFinite(e.value)||!adapter||typeof adapter.stage!=="function"||typeof adapter.commit!=="function"||typeof adapter.rollback!=="function")return null;var tag=e.tag===undefined?undefined:_mhTag(e.tag,ctx.campaign,ctx);if(e.tag!==undefined&&!tag)return null;ops.push({operation:e.operation,target:e.target,value:Number(e.value),tag:tag,adapter:adapter,index:i});}
  return {ctx:ctx,action:action,id:id,ops:ops};
}
function mayhemCan(actionId, context) {
  if (!context || !context.campaign) return false;
  var C={}; for(var k in context.campaign) if(Object.prototype.hasOwnProperty.call(context.campaign,k)) C[k]=context.campaign[k];
  C.mayhemReceipts=_mhClone(context.campaign.mayhemReceipts||[]); C.mayhemSequence=context.campaign.mayhemSequence;
  var copy={}; for(k in context)if(Object.prototype.hasOwnProperty.call(context,k))copy[k]=context[k]; copy.campaign=C;
  return !!_mhResolve(actionId,copy);
}
function mayhemApply(actionId, context) {
  var tx=_mhResolve(actionId,context);if(!tx)return null;
  var staged=[];
  try{
    for(var i=0;i<tx.ops.length;i++){var op=tx.ops[i], result=op.adapter.stage({operation:op.operation,target:op.target,value:op.value,tag:op.tag},tx.ctx);if(!_mhOwnKeys(result,["before","after","token"])||!_mhFinite(result.before)||!_mhFinite(result.after))throw new Error("stage");staged.push({op:op,result:result});}
  }catch(e){return null;}
  var committed=[];
  try{for(i=0;i<staged.length;i++){staged[i].op.adapter.commit(staged[i].result.token,tx.ctx);committed.push(staged[i]);}}
  catch(e2){if(i<staged.length){try{staged[i].op.adapter.rollback(staged[i].result.token,tx.ctx);}catch(ignore0){}}for(i=committed.length-1;i>=0;i--){try{committed[i].op.adapter.rollback(committed[i].result.token,tx.ctx);}catch(ignore){}}return null;}
  var normalized=[];for(i=0;i<staged.length;i++){var s=staged[i];var n={operation:s.op.operation,target:s.op.target,value:s.op.value,before:s.result.before,after:s.result.after};if(s.op.tag)n.tag=s.op.tag;normalized.push(n);}
  var receipt={id:tx.id,actionId:actionId,sequence:tx.ctx.sequence,operations:normalized};
  tx.ctx.campaign.mayhemReceipts.push(receipt);tx.ctx.campaign.mayhemSequence=tx.ctx.sequence;
  if(tx.ctx.campaign.mayhemReceipts.length>MAYHEM_RECEIPT_CAP)tx.ctx.campaign.mayhemReceipts.splice(0,tx.ctx.campaign.mayhemReceipts.length-MAYHEM_RECEIPT_CAP);
  return _mhClone(receipt);
}

function _mhHistorical() { return { id:"historical", version:1 }; }
function _mhValidId(id) { return id === "historical" || id === "mayhem"; }
function _mhExactRuleset(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  var keys;
  try { keys = Object.keys(raw).sort(); } catch (e) { return null; }
  if (keys.length !== 2 || keys[0] !== "id" || keys[1] !== "version") return null;
  if (!_mhValidId(raw.id) || raw.version !== 1) return null;
  return { id:raw.id, version:1 };
}
function _mhFallbackId() {
  // Fail closed. Runtime authority never reads G.settings or localStorage.
  return "historical";
}
function _mhLockedOwner(C) {
  try {
    var d = C && Object.getOwnPropertyDescriptor(C, "ruleset");
    var frozen = !d || typeof Object.isFrozen !== "function" || Object.isFrozen(d.value);
    return !!(d && d.writable === false && d.configurable === false && frozen && _mhExactRuleset(d.value));
  } catch (e) { return false; }
}
function _mhInstallOwner(C, id) {
  var owner = { id:_mhValidId(id) ? id : "historical", version:1 };
  try { if (Object.freeze) Object.freeze(owner); } catch (e) {}
  try {
    var prior = Object.getOwnPropertyDescriptor(C, "ruleset");
    Object.defineProperty(C, "ruleset", {
      value:owner,
      enumerable:prior && prior.configurable === false ? !!prior.enumerable : true,
      writable:false, configurable:false // MAYHEM_BIND_C:IMMUTABLE_OWNER
    });
  } catch (e2) { return _mhHistorical(); }
  return _mhLockedOwner(C) ? (_mhExactRuleset(C.ruleset) || _mhHistorical()) : _mhHistorical();
}

function mayhemRuleset(C) {
  var exact = _mhExactRuleset(C && C.ruleset);
  return exact || _mhHistorical();
}
function mayhemIsActive(C) { return mayhemRuleset(C).id === "mayhem"; }
function mayhemModeLabel(C) { return mayhemIsActive(C) ? "Mayhem Campaign" : "Historical Campaign"; }

function mayhemInit(C, requestedId, phase) {
  if (!C || typeof C !== "object" || Array.isArray(C)) return _mhHistorical();

  var current = _mhExactRuleset(C.ruleset);
  if (_mhLockedOwner(C)) { if(current&&current.id==="mayhem")_mhSanitizeReceipts(C); return current || _mhHistorical(); }

  var id;
  if (current) {
    // A valid restored/new owner is preserved. No in-run call changes it.
    id = current.id;
  } else if (phase === "new" || phase === "fork") {
    id = _mhValidId(requestedId) ? requestedId : _mhFallbackId();
  } else {
    id = _mhFallbackId(); // MAYHEM_BIND_A:HISTORICAL_FALLBACK
  }
  var installed=_mhInstallOwner(C, id); if(installed.id==="mayhem")_mhSanitizeReceipts(C); return installed;
}

/* A named fork creates a new object and uses the one initializer. It never
   converts the active object in place. Historical -> Mayhem is the only legal
   direction; Mayhem -> Historical and blank/unsafe names are rejected. */
function _mhNamedFork(C, name, requestedId) {
  name = String(name == null ? "" : name).replace(/\s+/g, " ").trim();
  if (!C || !name || name.length > 80 || requestedId !== "mayhem" || mayhemIsActive(C)) return null;
  var copy;
  try { copy = JSON.parse(JSON.stringify(C)); } catch (e) { return null; }
  if (!copy || typeof copy !== "object") return null;
  try { delete copy.ruleset; } catch (e2) { return null; }
  copy.timelineName = name;
  mayhemInit(copy, "mayhem", "fork");
  return mayhemIsActive(copy) ? copy : null;
}

var _MH_BASE_MUSTER = null;
var _MH_BASE_START = null;
var _MH_BASE_INIT = null;
var _mhPendingStart = null;
var _mhStartToken = null;
var _mhKeyHandler = null;
var _mhReturnFocusId = "";

function _mhSide(side) { return side === "CS" ? "CS" : "US"; }
function _mhEsc(v) {
  if (typeof htmlEsc === "function") return htmlEsc(v);
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function _mhClearKeyHandler() {
  try { if (_mhKeyHandler && typeof document !== "undefined") document.removeEventListener("keydown", _mhKeyHandler, true); } catch (e) {}
  _mhKeyHandler = null;
}
function _mhClearPending() {
  _mhPendingStart = null;
  _mhStartToken = null;
  _mhClearKeyHandler();
}
function _mhRememberFocus() {
  try {
    var el = document.activeElement;
    _mhReturnFocusId = el && el.id ? String(el.id) : "";
  } catch (e) { _mhReturnFocusId = ""; }
}
function _mhRestoreMenuFocus() {
  var id = _mhReturnFocusId;
  try { if (typeof openMainMenu === "function") openMainMenu(); } catch (e) {}
  if (!id || typeof setTimeout !== "function") return;
  setTimeout(function () {
    try { var el = document.getElementById(id); if (el) el.focus(); } catch (e2) {}
  }, 0);
}
function _mhBackToMenu() {
  _mhClearPending();
  _mhRestoreMenuFocus();
}
function _mhInstallEscape() {
  _mhClearKeyHandler();
  if (typeof document === "undefined") return;
  _mhKeyHandler = function (evt) {
    if (!evt || evt.key !== "Escape") return;
    evt.preventDefault();
    evt.stopPropagation();
    _mhBackToMenu();
  };
  document.addEventListener("keydown", _mhKeyHandler, true);
}

function _mhArmTerms(side, id) {
  side = _mhSide(side);
  id = _mhValidId(id) ? id : "historical";
  var arm = function (btn) {
    if (!btn) return;
    btn.addEventListener("click", function () {
      _mhStartToken = { side:side, id:id };
    }, true);
  };
  arm(document.getElementById("msMuster"));
  arm(document.getElementById("msIron"));
  var back = document.getElementById("msBack");
  if (back) back.addEventListener("click", function () {
    _mhClearPending();
    if (_mhReturnFocusId && typeof setTimeout === "function") setTimeout(function () {
      try { var el = document.getElementById(_mhReturnFocusId); if (el) el.focus(); } catch (e) {}
    }, 0);
  }, true);
}
function _mhOpenTerms(side, id) {
  if (typeof _MH_BASE_MUSTER !== "function") return;
  side = _mhSide(side);
  id = _mhValidId(id) ? id : "historical";
  _mhPendingStart = { side:side, id:id };
  _mhStartToken = null;
  _MH_BASE_MUSTER(side);
  _mhArmTerms(side, id);
  _mhInstallEscape();
  try { var first = document.getElementById("msMuster"); if (first) first.focus(); } catch (e) {}
}

function _mhPickerHTML(side) {
  var sideLabel = _mhSide(side) === "CS" ? "Confederate" : "Union";
  return ''
    + '<style id="mhPickerCss">'
    + '.mh-picker{max-width:760px;margin:0 auto;color:#f2e8d5}.mh-mode-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px;margin:14px 0}'
    + '.mh-mode{display:block;width:100%;min-height:176px;text-align:left;padding:16px;border:2px solid #8c724e;border-radius:8px;background:#17120c;color:#f2e8d5;cursor:pointer}'
    + '.mh-mode:hover{border-color:#d8b458;background:#21190f}.mh-mode:focus,.mh-mode:focus-visible,.mh-picker button:focus,.mh-picker button:focus-visible{outline:3px solid #ffe27a;outline-offset:3px}'
    + '.mh-mode[aria-checked="true"]{border-color:#ffe27a;box-shadow:0 0 0 2px #2d2517 inset}.mh-mode-name{display:block;font-size:20px;font-weight:900;color:#fff4d4}.mh-mode-deck{display:block;margin-top:8px;font-size:13px;line-height:1.55;color:#e9dcc0}'
    + '.mh-picker-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.mh-picker-actions button{min-height:44px}'
    + '@media(max-width:420px){.mh-mode{min-height:0;padding:13px}.mh-mode-name{font-size:18px}}'
    + '@media(prefers-reduced-motion:reduce){.mh-picker *{transition:none!important;animation:none!important}}'
    + 'html[data-a11y-contrast="high"] .mh-mode{background:#000!important;color:#fff!important;border-color:#fff!important}html[data-a11y-contrast="high"] .mh-mode[aria-checked="true"]{border-color:#ffe27a!important}'
    + '</style>'
    + '<div class="mh-picker" id="mhRulesetPicker" data-side="' + side + '" role="region" aria-labelledby="mhPickerTitle">'
    + '<h1 class="title-xl" id="mhPickerTitle">' + _mhEsc(sideLabel) + ' Campaign</h1>'
    + '<p class="title-sub">Choose the rules for this new campaign</p><hr class="rule">'
    + '<p class="lede">Ruleset, difficulty, realism, and play style are separate choices. Choose one ruleset to continue.</p>'
    + '<div class="mh-mode-grid" role="radiogroup" aria-label="Campaign ruleset">'
    + '<button type="button" class="mh-mode" id="mhHistorical" role="radio" tabindex="0" aria-checked="false" aria-describedby="mhHistoricalDesc" data-mh-mode="historical">'
    + '<span class="mh-mode-name">Historical Campaign</span><span class="mh-mode-deck" id="mhHistoricalDesc">Fight the documented war. Historical forces, timing, choices, and teaching context remain in force, while your battlefield performance determines the result.</span></button>'
    + '<button type="button" class="mh-mode" id="mhMayhem" role="radio" tabindex="-1" aria-checked="false" aria-describedby="mhMayhemDesc" data-mh-mode="mayhem">'
    + '<span class="mh-mode-name">Mayhem Campaign — Break the Timeline</span><span class="mh-mode-deck" id="mhMayhemDesc">Mix eras, people, weapons, policies, rewards, and outcomes. The game tracks what happens; it does not grade your morality or historical plausibility.</span></button>'
    + '</div><div class="mh-picker-actions">'
    + '<button type="button" class="bigbtn" id="mhStart" disabled aria-disabled="true">Choose a ruleset</button>'
    + '<button type="button" class="ghostbtn" id="mhBack">Back</button>'
    + '</div></div>';
}
function _mhOpenRulesetPicker(side) {
  if (typeof openSheet !== "function") return;
  side = _mhSide(side);
  _mhPendingStart = null;
  _mhStartToken = null;
  openSheet(_mhPickerHTML(side));
  _mhInstallEscape();
  var selected = null;
  var radios = document.querySelectorAll('[data-mh-mode]');
  var start = document.getElementById("mhStart");
  function select(id, announce) {
    selected = _mhValidId(id) ? id : null;
    for (var i = 0; i < radios.length; i++) {
      var on = radios[i].getAttribute("data-mh-mode") === selected;
      radios[i].setAttribute("aria-checked", on ? "true" : "false");
      radios[i].setAttribute("tabindex", (!selected ? i === 0 : on) ? "0" : "-1");
    }
    if (start) {
      start.disabled = !selected;
      start.setAttribute("aria-disabled", selected ? "false" : "true");
      start.textContent = selected === "mayhem" ? "Start Mayhem Campaign" : selected === "historical" ? "Start Historical Campaign" : "Choose a ruleset";
    }
    if (announce && selected && typeof a11yAnnounce === "function") a11yAnnounce(mayhemModeLabel({ ruleset:{ id:selected, version:1 } }) + " selected");
  }
  for (var i = 0; i < radios.length; i++) {
    (function (idx) {
      radios[idx].addEventListener("click", function () { select(this.getAttribute("data-mh-mode"), true); });
      radios[idx].addEventListener("keydown", function (evt) {
        var key = evt && evt.key;
        var next = idx;
        if (key === "ArrowRight" || key === "ArrowDown") next = (idx + 1) % radios.length;
        else if (key === "ArrowLeft" || key === "ArrowUp") next = (idx + radios.length - 1) % radios.length;
        else if (key === "Home") next = 0;
        else if (key === "End") next = radios.length - 1;
        else return;
        evt.preventDefault();
        select(radios[next].getAttribute("data-mh-mode"), true);
        try { radios[next].focus(); } catch (e) {}
      });
    })(i);
  }
  if (start) start.addEventListener("click", function () {
    if (!selected) return;
    _mhClearKeyHandler();
    _mhOpenTerms(side, selected);
  });
  var back = document.getElementById("mhBack");
  if (back) back.addEventListener("click", _mhBackToMenu);
  try { if (radios[0]) radios[0].focus(); } catch (e) {}
}

(function _mhInstallCampaignWrappers() {
  _MH_BASE_MUSTER = typeof _openMusterChoice === "function" ? _openMusterChoice : null;
  _MH_BASE_START = typeof startCampaign === "function" ? startCampaign : null;
  _MH_BASE_INIT = typeof _t1InitAll === "function" ? _t1InitAll : null;
  if (!_MH_BASE_MUSTER || !_MH_BASE_START || !_MH_BASE_INIT) return;

  _openMusterChoice = function (side) {
    _mhRememberFocus();
    if (MAYHEM_PUBLIC_READY === true) return _mhOpenRulesetPicker(side);
    return _mhOpenTerms(side, "historical");
  };

  startCampaign = function (side, iron) {
    side = _mhSide(side);
    var token = _mhStartToken;
    var requested = token && token.side === side && _mhValidId(token.id) ? token.id : "historical";
    _mhPendingStart = { side:side, id:requested };
    try {
      return _MH_BASE_START.apply(this, arguments);
    } finally {
      _mhClearPending();
    }
  };

  _t1InitAll = function (C) {
    var pending = _mhPendingStart;
    var requested = pending && _mhValidId(pending.id) ? pending.id : "historical";
    mayhemInit(C, requested, "new"); // MAYHEM_BIND_B:ATTACH_BEFORE_INIT
    return _MH_BASE_INIT.apply(this, arguments);
  };
})();
