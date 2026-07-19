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

const MAYHEM_PUBLIC_READY = true;

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
/* ---- LANE-012 Slice 2 (D455 §3 row 2 + §4a.1): THE LOAD-BEARING MASSACRE-BLOCK. ----
   A closed consequence-operation allowlist for historical-ruleset actions. Values are the
   sign law: -1 = the effect value must be <= 0 (own-cost consequences only), +1 = >= 0
   (the infamy ledger only), 0 = no sign constraint. EVERY operation family absent from
   this map (score/casualty-credit/capture/result/victoryProgress/funds/resource/loot/
   technology/weapon/career/reputation/achievement/roster/reinforcement/scenario/timeline/
   enemyWill) is REFUSED at validation, before any mutation. A red here is a design
   failure, never a tooth to move. */
var _MH_HISTORICAL_OPS = { "morale.add":-1, "press.add":-1, "diplomacy.add":-1, "notoriety.add":1, "modifier.add":0, "chronicle.event":0 };
function _mhResolve(actionId, context) {
  var ctx=_mhNormalizeContext(context), action=_mhActions()[actionId];
  /* Slice 2: an action is legal iff its declared rulesetId EXACTLY matches the campaign
     ruleset id ("mayhem" actions only in Mayhem — unchanged; "historical" actions only in
     Historical). Anything else, including an undeclared rulesetId, fails closed. */
  if(!ctx||!action||action.rulesetId!==mayhemRuleset(ctx.campaign).id)return null;
  var currentSequence=Number.isSafeInteger(ctx.campaign.mayhemSequence)?ctx.campaign.mayhemSequence:0;
  if(ctx.sequence!==currentSequence+1&&ctx.sequence!==currentSequence)return null;
  var tags={};for(var i=0;i<ctx.actorTags.length;i++){var t=_mhTag(ctx.actorTags[i],ctx.campaign,ctx);if(!t)return null;tags[t.namespace+":"+t.value]=1;}
  for(i=0;i<action.actorTags.length;i++){t=_mhTag(action.actorTags[i],ctx.campaign,ctx);if(!t||!tags[t.namespace+":"+t.value])return null;}
  for(i=0;i<action.availableWhen.length;i++){var p=action.availableWhen[i];if(!p||!_MH_PREDICATES[p.id])return null;if(p.id==="ruleset.is"&&p.value!==mayhemRuleset(ctx.campaign).id)return null;if(p.id==="side.isActor"&&ctx.campaign.side!==ctx.side)return null;}
  /* Slice 2 ordering law: EVERY validation — including the massacre-block — runs BEFORE
     the receipt-log sanitation below, so a REFUSED action leaves the campaign
     byte-identical even when it never carried receipt fields (the Historical purity
     teeth). Sanitation runs only once the action is fully legal. */
  var ops=[];
  for(i=0;i<action.effects.length;i++){var e=action.effects[i], reg=e&&_MH_OPERATION_REGISTRY[e.operation], adapter=reg&&ctx.adapters[e.operation];if(!reg||!_mhOwnKeys(e,["operation","target","value","tag"])||!_mhStableId(e.target)||!_mhFinite(e.value)||!adapter||typeof adapter.stage!=="function"||typeof adapter.commit!=="function"||typeof adapter.rollback!=="function")return null;
    if(action.rulesetId==="historical"){var rule=_MH_HISTORICAL_OPS[e.operation];if(rule===undefined)return null;if(rule===-1&&!(Number(e.value)<=0))return null;if(rule===1&&!(Number(e.value)>=0))return null;} // MASSACRE_BLOCK
    var tag=e.tag===undefined?undefined:_mhTag(e.tag,ctx.campaign,ctx);if(e.tag!==undefined&&!tag)return null;ops.push({operation:e.operation,target:e.target,value:Number(e.value),tag:tag,adapter:adapter,index:i});}
  _mhSanitizeReceipts(ctx.campaign);
  var id=_mhReceiptId(ctx,actionId);for(i=0;i<ctx.campaign.mayhemReceipts.length;i++)if(ctx.campaign.mayhemReceipts[i].id===id)return null; // MAYHEM_BIND_DUPLICATE
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

/* D420 / Slice C — first production transaction. The adapters stage immutable
   before/after snapshots, commit only through the existing campaign owners,
   and restore those snapshots in reverse order if any later commit fails. */
function _mhProdNumberAdapter(read, write, remove, exists) {
  return {
    stage:function(op,ctx){var before=Number(read(ctx.campaign))||0;return{before:before,after:before+op.value,token:{C:ctx.campaign,before:before,after:before+op.value,existed:exists(ctx.campaign)}};},
    commit:function(t){write(t.C,t.after);}, rollback:function(t){if(t.existed)write(t.C,t.before);else remove(t.C);}
  };
}
function _mhProdLootAdapter() {
  return {
    stage:function(op,ctx){
      if(op.target!=="commissary_rations"||typeof lootInit!=="function"||typeof lootAddItem!=="function")throw new Error("loot");
      var L=lootInit(ctx.campaign), before=_mhClone(L.inventory); if(!before)throw new Error("loot");
      var qty=0;for(var i=0;i<before.length;i++)if(before[i].id===op.target)qty+=Number(before[i].qty)||0;
      return{before:qty,after:qty+op.value,token:{C:ctx.campaign,before:before,id:op.target,value:op.value}};
    },
    commit:function(t){var r=lootAddItem(t.C,t.id,t.value,"Mayhem: No Quarter");if(!r||!r.ok)throw new Error("loot-commit");},
    rollback:function(t){lootInit(t.C).inventory=_mhClone(t.before)||[];}
  };
}
function _mhProdModifierAdapter() {
  return {
    stage:function(op,ctx){
      var L=typeof lootInit==="function"?lootInit(ctx.campaign):null;if(!L)throw new Error("modifier");
      var existed=Array.isArray(L.modifiers), before=existed?_mhClone(L.modifiers):[];if(!before)throw new Error("modifier");
      var key=op.tag.namespace+":"+op.tag.value+":"+op.target, exists=false;
      for(var i=0;i<before.length;i++)if(before[i]&&before[i].key===key)exists=true;
      return{before:exists?1:0,after:1,token:{C:ctx.campaign,before:before,existed:existed,key:key,target:op.target,tag:op.tag}};
    },
    commit:function(t){var L=lootInit(t.C);if(!Array.isArray(L.modifiers))L.modifiers=[];for(var i=0;i<L.modifiers.length;i++)if(L.modifiers[i].key===t.key)return;L.modifiers.push({key:t.key,id:t.target,tag:_mhClone(t.tag)});},
    rollback:function(t){var L=lootInit(t.C);if(t.existed)L.modifiers=_mhClone(t.before)||[];else delete L.modifiers;}
  };
}
function mayhemProductionAdapters(C) {
  return {
    "battle.score.add":_mhProdNumberAdapter(function(c){return c.stats&&c.stats.mayhemScore;},function(c,v){if(!c.stats)c.stats={};c.stats.mayhemScore=v;},function(c){if(c.stats)delete c.stats.mayhemScore;},function(c){return !!(c.stats&&Object.prototype.hasOwnProperty.call(c.stats,"mayhemScore"));}),
    "casualty.credit":_mhProdNumberAdapter(function(c){return c.stats&&c.stats.infl;},function(c,v){if(!c.stats)c.stats={};c.stats.infl=v;},function(c){if(c.stats)delete c.stats.infl;},function(c){return !!(c.stats&&Object.prototype.hasOwnProperty.call(c.stats,"infl"));}),
    "loot.grant":_mhProdLootAdapter(),
    "modifier.add":_mhProdModifierAdapter()
  };
}
/* ---- LANE-012 Slice 2 (D455 §4a.1): the Historical consequence adapters. Every
   consequence enters the SIMULATION as an INPUT through an existing reader (D74):
   M.infamyShock -> moraleCompute's public-will term; C.press.infamyShock ->
   pressSentiment; C.blockade.recognition -> the existing diplomacy/victory readers,
   moved AGAINST the actor; the additive C.infamy ledger -> the prisoner-exchange
   reprisal read. No outcome write anywhere. All bounded; all additive save fields
   (NO _SAVE_VER bump). ---- */
var _MH_INFAMY_TOTAL_CAP = 100;
var _MH_INFAMY_EVENT_CAP = 16;
var _MH_SHOCK_FLOOR = -25;
function _mhInfamySanitize(C) {
  if (!C || C.infamy === undefined) return null;
  var raw=C.infamy, total=0, events=[];
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    var t=Number(raw.total); if (isFinite(t)) total=Math.max(0, Math.min(_MH_INFAMY_TOTAL_CAP, t));
    var src=Array.isArray(raw.events)?raw.events:[];
    for (var i=0;i<src.length&&events.length<_MH_INFAMY_EVENT_CAP;i++){var ev=src[i];if(_mhOwnKeys(ev,["battleId","value","sequence"])&&_mhStableId(ev.battleId)&&_mhFinite(ev.value)&&ev.value>=0&&Number.isSafeInteger(ev.sequence)&&ev.sequence>=1)events.push({battleId:ev.battleId,value:Number(ev.value),sequence:ev.sequence});}
  }
  C.infamy={total:total,events:events};
  return C.infamy;
}
function mayhemInfamyTotal(C) {
  if (!C || !C.infamy || typeof C.infamy !== "object" || Array.isArray(C.infamy)) return 0;
  var t=Number(C.infamy.total);
  return isFinite(t)?Math.max(0,Math.min(_MH_INFAMY_TOTAL_CAP,t)):0;
}
function _mhHistShockAdapter(key, init) {
  /* the M.repudiated durable-shock idiom: a bounded additive NEGATIVE shock field the
     domain's compute reads (guarded no-op at 0/absent). key names the domain object on
     the campaign ("morale"/"press"); init(C) is the domain's own idempotent
     initializer. rollback restores the WHOLE domain object byte-exactly, so a failed
     later commit cannot leave the initializer's side effects behind. */
  return {
    stage:function(op,ctx){var o=ctx.campaign[key],before=o&&typeof o.infamyShock==="number"&&isFinite(o.infamyShock)?o.infamyShock:0,after=Math.max(_MH_SHOCK_FLOOR,Math.min(0,before+op.value)),snapshot=o===undefined?undefined:_mhClone(o);return{before:before,after:after,token:{C:ctx.campaign,snapshot:snapshot,after:after}};},
    commit:function(t){init(t.C);var o=t.C[key];if(!o||typeof o!=="object"||Array.isArray(o))throw new Error("shock-owner");o.infamyShock=t.after;},
    rollback:function(t){if(t.snapshot===undefined)delete t.C[key];else t.C[key]=_mhClone(t.snapshot);}
  };
}
function _mhHistDiplomacyAdapter() {
  /* C.blockade.recognition moved AGAINST the actor: a US actor pushes recognition UP
     toward the Confederacy (+|v|), a CS actor pushes it DOWN (-|v|); clamped [0,100].
     The existing readers (diplomacy/victory/morale) consume it unchanged. */
  return {
    stage:function(op,ctx){var BL=ctx.campaign.blockade,before=BL&&typeof BL.recognition==="number"&&isFinite(BL.recognition)?BL.recognition:0,delta=(ctx.side==="US"?1:-1)*Math.abs(op.value),after=Math.max(0,Math.min(100,before+delta)),snapshot=BL===undefined?undefined:_mhClone(BL);return{before:before,after:after,token:{C:ctx.campaign,snapshot:snapshot,after:after}};},
    commit:function(t){if(!t.C.blockade||typeof t.C.blockade!=="object"||Array.isArray(t.C.blockade))t.C.blockade={};t.C.blockade.recognition=t.after;},
    rollback:function(t){if(t.snapshot===undefined)delete t.C.blockade;else t.C.blockade=_mhClone(t.snapshot);}
  };
}
function _mhHistNotorietyAdapter() {
  return {
    stage:function(op,ctx){var before=mayhemInfamyTotal(ctx.campaign),after=Math.min(_MH_INFAMY_TOTAL_CAP,before+op.value),snapshot=ctx.campaign.infamy===undefined?undefined:_mhClone(ctx.campaign.infamy);return{before:before,after:after,token:{C:ctx.campaign,before:snapshot,after:after,value:op.value,battleId:ctx.battleId,sequence:ctx.sequence}};},
    commit:function(t){var L=_mhInfamySanitize(t.C)||(t.C.infamy={total:0,events:[]});L.total=t.after;L.events.push({battleId:t.battleId,value:t.value,sequence:t.sequence});if(L.events.length>_MH_INFAMY_EVENT_CAP)L.events.splice(0,L.events.length-_MH_INFAMY_EVENT_CAP);},
    rollback:function(t){if(t.before===undefined)delete t.C.infamy;else t.C.infamy=_mhClone(t.before);}
  };
}
function mayhemHistoricalAdapters(C) {
  return {
    "morale.add":_mhHistShockAdapter("morale",function(c){if(typeof moraleInit==="function")moraleInit(c);if(!c.morale||typeof c.morale!=="object"||Array.isArray(c.morale))c.morale={};}),
    "press.add":_mhHistShockAdapter("press",function(c){if(typeof pressInit==="function")pressInit(c);if(!c.press||typeof c.press!=="object"||Array.isArray(c.press))c.press={};}),
    "diplomacy.add":_mhHistDiplomacyAdapter(),
    "notoriety.add":_mhHistNotorietyAdapter()
  };
}
function _mhNoQuarterContext(C) {
  var O=C&&C.mayhemNoQuarterOffer;if(!O||!mayhemIsActive(C)||O.consumed===true||!(O.captured>0))return null;
  return {campaign:C,ruleset:mayhemRuleset(C),side:C.side,timelineId:O.timelineId,battleId:O.battleId,phaseId:"result",actorId:String(C.side).toLowerCase()+"-command",sequence:(Number(C.mayhemSequence)||0)+1,actorTags:[{namespace:"side",value:String(C.side).toLowerCase()}],adapters:mayhemProductionAdapters(C),consumed:false};
}
/* ---- LANE-012 Slice 2: the Historical offer context + apply. Same offer shape, same
   engine, same transaction law — the ONLY differences are the ruleset gate, the
   consequence-only adapters, and the massacre-block above. ---- */
function _mhNoQuarterHistContext(C) {
  var O=C&&C.mayhemNoQuarterOffer;if(!O||mayhemIsActive(C)||O.consumed===true||!(O.captured>0))return null;
  return {campaign:C,ruleset:mayhemRuleset(C),side:C.side,timelineId:O.timelineId,battleId:O.battleId,phaseId:"result",actorId:String(C.side).toLowerCase()+"-command",sequence:(Number(C.mayhemSequence)||0)+1,actorTags:[{namespace:"side",value:String(C.side).toLowerCase()}],adapters:mayhemHistoricalAdapters(C),consumed:false};
}
function mayhemNoQuarterHistApply(C) {
  var ctx=_mhNoQuarterHistContext(C);if(!ctx)return null;
  var receipt=mayhemApply("no-quarter-historical",ctx);if(receipt){C.mayhemNoQuarterOffer.consumed=true;if(typeof saveLocal==="function")try{saveLocal();}catch(e){}}
  return receipt;
}

/* ---- LANE-012 Slice 2: THE JUDGED PANEL (Historical AARs only; consumed by src/82
   aarRenderReport behind a typeof guard — the GEA-14 seam idiom). PURE RENDER. The offer
   states ALL consequences before confirmation; the applied receipt renders with factual
   condemnation composed from the COMMITTED corpus (the General Order No. 252 policy-
   timeline entry with its committed sources; the committed Fort Pillow / cartel-collapse
   juxtaposition via tcChronicleLine); the infamy ledger renders while total > 0. With no
   offer AND no infamy it returns "" so the Historical AAR is BYTE-IDENTICAL. It NEVER
   grades performance and NEVER awards anything — judged, never rewarded (D455 §3 row 3).
   AAR grading / endings moral voice are UNTOUCHED (the round-5 law). ---- */
var _MH_JUDGED_EFFECT_LABELS = {
  "morale.add": "Your own public will",
  "press.add": "Your press standing",
  "diplomacy.add": "European standing (moved against you)",
  "notoriety.add": "The infamy ledger (opens against your cause)"
};
function _mhJudgedGo252Line() {
  var d=typeof GAME_DATA==="object"&&GAME_DATA&&GAME_DATA["prisoner-exchange"];
  var tl=d&&Array.isArray(d.policyTimeline)?d.policyTimeline:[];
  for (var i=0;i<tl.length;i++){
    var e=tl[i];
    if (e&&e.id==="lincoln-retaliation-order"&&e.summary){
      var src=Array.isArray(e.sources)?e.sources:[];
      return '<div style="margin-top:5px;font-size:11px;line-height:1.5;opacity:.85">'+_mhEsc(e.summary)
        +(src.length?' <span style="opacity:.8">('+_mhEsc(src.join(" "))+')</span>':'')+'</div>';
    }
  }
  return "";
}
function mhJudgedNoQuarterPanel(C) {
  if (!C || mayhemIsActive(C)) return "";
  var ctx=_mhNoQuarterHistContext(C);
  var total=mayhemInfamyTotal(C);
  if (!ctx && !(total>0)) return "";
  var action=_mhActions()["no-quarter-historical"];
  var offer="";
  if (ctx && action && mayhemCan("no-quarter-historical", ctx)) {
    var rows="";
    for (var i=0;i<action.effects.length;i++){
      var e=action.effects[i], label=_MH_JUDGED_EFFECT_LABELS[e.operation]||e.operation, v=Number(e.value);
      rows+='<li style="margin:2px 0">'+_mhEsc(label)+': <b>'+(v>0?'+':'')+v+'</b></li>';
    }
    offer='<div style="margin-top:6px"><p style="margin:4px 0">A surrender of <b>'+_mhEsc(C.mayhemNoQuarterOffer.captured)
      +'</b> troops stands before you. Refusing quarter is playable here — and judged. Every consequence is stated now, before you confirm; none can be undone:</p>'
      +'<ul style="margin:4px 0 6px;padding-left:20px;font-size:12px">'+rows+'</ul>'
      +'<p style="margin:4px 0;font-size:11.5px;opacity:.85">While the infamy ledger stands above zero, the prisoner-exchange cartel functions worse and its pressure rises. There is no score, credit, loot, or reward on this path.</p>'
      +'<button type="button" class="bigbtn" data-mh-no-quarter="1">Refuse quarter &mdash; accept the judgment</button></div>';
  }
  var receipt=null, rs=_mhReadReceipts(C);
  for (var k=rs.length-1;k>=0;k--)if(rs[k].actionId==="no-quarter-historical"){receipt=rs[k];break;}
  var applied="";
  if (receipt) {
    var ops="";
    for (var j=0;j<receipt.operations.length;j++){var o=receipt.operations[j];ops+=(ops?'; ':'')+_mhEsc(_MH_JUDGED_EFFECT_LABELS[o.operation]||o.operation)+' '+(o.value>0?'+':'')+o.value+' ('+o.before+' &rarr; '+o.after+')';}
    applied='<div style="margin-top:6px"><p style="margin:4px 0"><b>Quarter was refused.</b> The consequences are applied and recorded: <span style="font-size:11.5px;opacity:.85">'+ops+'</span></p>'
      +((typeof tcChronicleLine==="function")?tcChronicleLine("no-quarter-historical"):"")
      +_mhJudgedGo252Line()+'</div>';
  }
  var ledger="";
  if (total>0) {
    ledger='<div style="margin-top:6px;padding-top:6px;border-top:1px dotted #b98a6a"><b style="font-size:12px">The Infamy Ledger &mdash; '+Math.round(total)
      +'</b><div style="font-size:11.5px;opacity:.85;margin-top:2px">This ledger records atrocity as lasting damage to your own cause: public will, the press, European standing, and the prisoner-exchange cartel all stand against you while it is open. It never scores, and it never closes on its own.</div></div>';
  }
  return '<section class="mh-judged" role="region" aria-labelledby="mhJudgedTitle" style="margin:10px 0;padding:12px;border:2px solid #b98a6a;border-left:6px solid #d06862;border-radius:8px;background:rgba(0,0,0,.14)">'
    +'<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#d06862">Judged, never rewarded</div>'
    +'<h2 id="mhJudgedTitle" style="margin:3px 0;font-size:15px">No Quarter</h2>'
    +offer+applied+ledger+'</section>';
}
function mayhemNoQuarterApply(C) {
  var ctx=_mhNoQuarterContext(C);if(!ctx)return null;
  var receipt=mayhemApply("no-quarter",ctx);if(receipt){C.mayhemNoQuarterOffer.consumed=true;if(typeof saveLocal==="function")try{saveLocal();}catch(e){}}
  return receipt;
}
function _mhNoQuarterPanel(C) {
  var ctx=_mhNoQuarterContext(C), receipt=null, rs=Array.isArray(C&&C.mayhemReceipts)?C.mayhemReceipts:[];
  for(var i=rs.length-1;i>=0;i--)if(rs[i]&&rs[i].actionId==="no-quarter"){receipt=rs[i];break;}
  if(!ctx&&!receipt)return "";
  var body=receipt?"Applied through the Mayhem transaction: 25 score; 40 casualty credit; commissary rations; side-tagged No Quarter Momentum.":"A surrender of "+_mhEsc(C.mayhemNoQuarterOffer.captured)+" troops opens one declared Mayhem action. All effects are shown before confirmation.";
  return '<section class="mh-result" role="region" aria-labelledby="mhResultTitle" style="margin:10px 0;padding:12px;border:2px solid #ffe27a;border-radius:8px;background:#17120c;color:#f2e8d5"><div style="font-size:11px;font-weight:900;color:#ffe27a">MAYHEM CAMPAIGN</div><h2 id="mhResultTitle" style="margin:3px 0">No Quarter</h2><p>'+body+'</p>'+(ctx?'<button type="button" class="bigbtn" data-mh-no-quarter="1">Apply No Quarter</button>':'<p><b>Reward recorded.</b> Performance, consequences, rewards, and chaos are reported without a moral or plausibility grade.</p>')+'</section>';
}

var _MH_BASE_CAMPAIGN_ADVANCE=typeof campaignAdvance==="function"?campaignAdvance:null;
if(_MH_BASE_CAMPAIGN_ADVANCE)campaignAdvance=function(winnerSide,type){
  var C=typeof G!=="undefined"&&G.campaign,B=typeof G!=="undefined"&&G.battle;
  /* LANE-012 Slice 2: the offer stamps for BOTH rulesets from the shipped
     B.mayhemCapturedByPlayer T25/T2 chain. The ruleset routes what the offer CAN DO
     (Mayhem: the reward action; Historical: the judged consequence-only action) — never
     whether the surrender happened. No captures -> no stamp -> bytes unchanged. */
  if(C&&B&&Number(B.mayhemCapturedByPlayer)>0){var n=(Number(C.stats&&C.stats.battles)||0)+1;C.mayhemNoQuarterOffer={timelineId:_mhStableId(C.timelineName)?C.timelineName:"campaign",battleId:_mhStableId(B.id)?B.id:"battle-"+n,captured:Math.round(B.mayhemCapturedByPlayer),consumed:false};}
  return _MH_BASE_CAMPAIGN_ADVANCE.apply(this,arguments);
};
/* D425 gate-discovered root fix: propagate the delegate's wrapper markers AND the war-career
   dispatcher's captured-delegate reference (the src/106 idiom) — this wrapper silently dropped
   _slUndoWrapped/_warCareerWrapped/_warCareerDelegate, blinding probe-save-slots' and
   probe-war-career's marker teeth while undo/dispatch still worked through the delegate chain. */
if(_MH_BASE_CAMPAIGN_ADVANCE){campaignAdvance._slUndoWrapped=_MH_BASE_CAMPAIGN_ADVANCE._slUndoWrapped===true;campaignAdvance._warCareerWrapped=_MH_BASE_CAMPAIGN_ADVANCE._warCareerWrapped===true;if(_MH_BASE_CAMPAIGN_ADVANCE._warCareerDelegate)campaignAdvance._warCareerDelegate=_MH_BASE_CAMPAIGN_ADVANCE._warCareerDelegate;}
/* ---- SLICE E first cut (D437): THE LIVING WAR CHRONICLE — receipts rendered as an
   in-universe dispatch record. PURE READER over the Slice-B receipt pipeline: validates each
   stored receipt against the same closed shape _mhSanitizeReceipts enforces but WRITES NOTHING
   (no C mutation, no persistence). History comparison stays OFF by default per design §11
   Slice E; Historical campaigns never reach this branch (byte-equivalent by construction). ---- */
function _mhReadReceipts(C) {
  var raw=Array.isArray(C && C.mayhemReceipts)?C.mayhemReceipts:[], clean=[], seen={};
  for (var i=0;i<raw.length;i++) {
    var r=raw[i];
    if (!_mhOwnKeys(r,["id","actionId","sequence","operations"])||!_mhStableId(r.id)||!_mhStableId(r.actionId)||!Number.isSafeInteger(r.sequence)||r.sequence<1||!Array.isArray(r.operations)||seen[r.id]) continue;
    var ok=true;
    for(var j=0;j<r.operations.length;j++){var o=r.operations[j];if(!_mhOwnKeys(o,["operation","target","value","tag","before","after"])||!_MH_OPERATION_REGISTRY[o.operation]||!_mhStableId(o.target)||!_mhFinite(o.value)||!_mhFinite(o.before)||!_mhFinite(o.after)){ok=false;break;}}
    if(ok){seen[r.id]=1;clean.push(r);}
  }
  clean.sort(function(a,b){return a.sequence-b.sequence||a.id.localeCompare(b.id);});
  return clean;
}
function mayhemChronicleHTML(C) {
  if (!mayhemIsActive(C)) return "";
  var receipts=_mhReadReceipts(C), acts=_mhActions();
  var tl=_mhStableId(C && C.timelineName)?C.timelineName:"an unnamed timeline";
  var head='<div class="mh-chronicle" style="margin-top:12px;padding:10px;border:1px solid var(--rule,#6b5a3e);border-radius:5px">'
    + '<b style="font-size:13px">The Living War Chronicle</b>'
    + '<div style="font-size:11px;opacity:.75">The recorded dispatches of '+_mhEsc(tl)+' — every Mayhem consequence, as it was applied. This is the receipt ledger, not a judgment.</div>';
  if (!receipts.length) return head+'<div style="font-size:11.5px;opacity:.7;margin-top:6px">No Mayhem dispatches recorded yet — this timeline has so far run on its own momentum.</div></div>';
  var rows='';
  for (var i=0;i<receipts.length;i++) {
    var r=receipts[i], a=acts[r.actionId], label=a&&a.presentation&&a.presentation.label?a.presentation.label:r.actionId;
    var ops='';
    for (var j=0;j<r.operations.length;j++){var o=r.operations[j];ops+=(ops?'; ':'')+_mhEsc(o.operation)+' '+_mhEsc(o.target)+(o.tag?' ['+_mhEsc(o.tag)+']':'')+' '+(o.value>=0?'+':'')+o.value+' ('+o.before+' &rarr; '+o.after+')';}
    /* LANE-012 Slice 1 (D455 §4a.2 — the D416 amendment): the always-visible Chronicle
       juxtaposition — one guarded sourced "In history…" line per dispatch ("" when absent). */
    rows+='<li style="margin:3px 0"><b>Dispatch '+r.sequence+':</b> '+_mhEsc(label)+' <span style="opacity:.75;font-size:11px">'+ops+'</span>'+((typeof tcChronicleLine==="function")?tcChronicleLine(r.actionId):"")+'</li>';
  }
  return head+'<ol style="margin:6px 0 0;padding-left:20px;font-size:12px">'+rows+'</ol></div>';
}

var _MH_BASE_AAR=typeof aarRenderReport==="function"?aarRenderReport:null;
if(_MH_BASE_AAR)aarRenderReport=function(C,opts){
  if(!mayhemIsActive(C))return _MH_BASE_AAR.apply(this,arguments);
  var title=opts&&opts.final?"Mayhem Campaign — Final Results":"Mayhem Campaign — Results So Far";
  /* LANE-012 Slice 1 (D455 §4a.2 — amends D416's comparison-off-by-default): the always-visible
     teaching companion rides the Mayhem AAR through a guarded seam ("" when the module is absent,
     so this wrapper's output is byte-identical without it). The companion informs; it never grades. */
  return '<div class="mh-aar" data-mh-no-judgment="true"><h1>'+title+'</h1><p>Performance, consequences, rewards, and chaos. No moral or plausibility GPA.</p>'+_mhNoQuarterPanel(C)+((typeof tcMayhemPanel==="function")?tcMayhemPanel(C):"")+mayhemChronicleHTML(C)+'</div>';
};
/* LANE-012 Slice 2: the ONE delegated click path routes by ruleset — Mayhem takes the
   reward action; Historical takes the judged consequence-only action. Same button seam. */
if(typeof document!=="undefined")document.addEventListener("click",function(e){var b=e&&e.target&&e.target.closest?e.target.closest("[data-mh-no-quarter]"):null;if(!b)return;var C=typeof G!=="undefined"&&G.campaign,r=(C&&mayhemIsActive(C))?mayhemNoQuarterApply(C):mayhemNoQuarterHistApply(C);if(r&&typeof aarRenderTab==="function"&&typeof openSheet==="function")openSheet(aarRenderTab(C));});

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

/* ---- SLICE D (D437): standalone ruleset carry + the custom-content allowlist (design §3.4,
   §11 Slice D). These are PURE readers/sanitizers — no mutation, no persistence, no authority
   beyond the exact-copy law the campaign owner already enforces. ---- */
/* §3.4: sanitize a standalone launch's opts.ruleset — exact {id,version:1} copy or Historical. */
function mayhemStandaloneRuleset(raw) {
  return _mhExactRuleset(raw) || _mhHistorical();
}
/* The live battle's immutable snapshot (stamped once by fldLaunchSandbox); fail-closed. */
function mayhemBattleRuleset() {
  var f = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.ruleset : null;
  return _mhExactRuleset(f) || _mhHistorical();
}
function mayhemBattleModeLabel() { return mayhemBattleRuleset().id === "mayhem" ? "Mayhem" : "Historical"; }
/* Registered action ids from the declared data catalog — the ONLY ids a custom scenario may
   import (T11 validates against this allowlist; unknown/invented ids fail the scenario closed). */
function mayhemKnownActionIds() {
  var acts = _mhActions(), out = [];
  for (var k in acts) if (Object.prototype.hasOwnProperty.call(acts, k)) out.push(k);
  return out.sort();
}

/* LANE-012 Slice 2: PRESENT-ONLY load sanitation. Historical campaigns may now
   legitimately carry receipts (the judged action) and the C.infamy ledger — sanitize
   them whenever PRESENT under either ruleset, but NEVER create them on a campaign that
   lacks them (the never-took-the-action Historical A/B stays byte-identical). */
function _mhSanitizeCarried(C, rulesetId) {
  if (rulesetId === "mayhem" || Array.isArray(C.mayhemReceipts)) _mhSanitizeReceipts(C);
  _mhInfamySanitize(C);
}
function mayhemInit(C, requestedId, phase) {
  if (!C || typeof C !== "object" || Array.isArray(C)) return _mhHistorical();

  var current = _mhExactRuleset(C.ruleset);
  if (_mhLockedOwner(C)) { if(current)_mhSanitizeCarried(C,current.id); return current || _mhHistorical(); }

  var id;
  if (current) {
    // A valid restored/new owner is preserved. No in-run call changes it.
    id = current.id;
  } else if (phase === "new" || phase === "fork") {
    id = _mhValidId(requestedId) ? requestedId : _mhFallbackId();
  } else {
    id = _mhFallbackId(); // MAYHEM_BIND_A:HISTORICAL_FALLBACK
  }
  var installed=_mhInstallOwner(C, id); _mhSanitizeCarried(C, installed.id); return installed;
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
