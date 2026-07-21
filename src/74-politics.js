/* LANE-018 Slice 3: bounded politics interlink and pure teaching accessor. */
function _polData() { return (typeof gameData === "function") ? gameData("politics") : null; }
function _polNum(v, d) { return (typeof v === "number" && isFinite(v)) ? v : d; }
function _polClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function politicsCycleDelta(C, cycleId, sentiment, data) {
  var d = data || _polData(), cycle = d && d.cycles && d.cycles[cycleId];
  if (!C || !C.clock || !cycle || C.side !== cycle.side) return { weariness:0, capital:0 };
  var year = _polNum(C.clock.year, 0);
  if (year < _polNum(cycle.yearMin, 9999) || year > _polNum(cycle.yearMax, -9999) || C.clock.resolved1864) return { weariness:0, capital:0 };
  var s = _polClamp(_polNum(sentiment, 50), 0, 100);
  if (s === 50) return { weariness:0, capital:0 };
  var weariness=0, capital=0, cap, points;
  cap = Math.max(0, _polNum(cycle.wearinessDeltaCap, 0)); points = Math.max(1, _polNum(cycle.pressPointsPerWeariness, 10));
  if (cap) weariness = _polClamp(-Math.round((s-50)/points), -cap, cap);
  cap = Math.max(0, _polNum(cycle.capitalNudgeCap, 0)); points = Math.max(1, _polNum(cycle.pressPointsPerCapital, 25));
  if (cap) capital = _polClamp(Math.round((s-50)/points), -cap, cap);
  return { weariness:weariness, capital:capital };
}
function _polApplied(C,id) {
  var p=C&&C.politics;
  if (!p) return false;
  if (typeof p!=="object" || Array.isArray(p) || !p.applied || typeof p.applied!=="object" || Array.isArray(p.applied)) return true;
  return p.applied[id]===true;
}
function politicsSanitizeOnLoad(C) {
  if (!C || !Object.prototype.hasOwnProperty.call(C,"politics")) return;
  var p=C.politics, clean={}, ids=["1862-midterm","1864-presidential"];
  if (!p || typeof p!=="object" || Array.isArray(p) || !p.applied || typeof p.applied!=="object" || Array.isArray(p.applied)) { delete C.politics; return; }
  for (var i=0;i<ids.length;i++) if (p.applied[ids[i]]===true) clean[ids[i]]=true;
  if (Object.keys(clean).length) C.politics={applied:clean}; else delete C.politics;
}
function politicsOnResolve(winnerSide,type,B,C,win) {
  var d=_polData();
  if (!d || !C || !C.clock || C.side!=="US") return;
  var ids=["1862-midterm","1864-presidential"], sent=(typeof pressSentiment==="function")?pressSentiment(C):50;
  for (var i=0;i<ids.length;i++) {
    var id=ids[i]; if (_polApplied(C,id)) continue;
    var delta=politicsCycleDelta(C,id,sent,d); if (!delta.weariness&&!delta.capital) continue;
    C.clock.weariness=_polClamp(_polNum(C.clock.weariness,0)+delta.weariness,0,100);
    C.clock.capital=Math.max(0,_polNum(C.clock.capital,0)+delta.capital);
    if (!C.politics) C.politics={applied:{}};
    C.politics.applied[id]=true;
  }
}
function politicsTeachingRows(C,cycleId) {
  var d=_polData(), side=(C&&C.side==="CS")?"CS":"US";
  if (!d||!d.teaching||!Array.isArray(d.teaching[side])) return [];
  var out=JSON.parse(JSON.stringify(d.teaching[side]));
  if (side==="US"&&cycleId&&d.cycles&&d.cycles[cycleId]) out.unshift(JSON.parse(JSON.stringify(d.cycles[cycleId])));
  return out;
}
function politicsTeachingHTML(C) {
  if (!C) return "";
  var rows=politicsTeachingRows(C,C.clock&&C.clock.year>=1864?"1864-presidential":"1862-midterm"); if (!rows.length) return "";
  var h='<hr class="rule"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9b8560">Politics in the record</div>';
  for (var i=0;i<rows.length;i++) { var r=rows[i], stamp=r.provenance||"Inferred";
    h+='<div style="padding:7px 0;border-bottom:1px dotted var(--rule)"><b style="font-size:12px">'+htmlEsc(r.title||"")+'</b><div style="font-size:11px;opacity:.78">'+htmlEsc(r.summary||r.text||"")+(r.displayRange?' <b>'+htmlEsc(r.displayRange)+'</b>.':'')+'</div><div style="font-size:10px;opacity:.7">'+htmlEsc(stamp)+' · '+htmlEsc((r.sources||[]).join("; "))+'</div></div>'; }
  return h;
}
