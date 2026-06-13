// stubs for engine symbols the chunk references
function clamp(v,a,b){ return v<a?a:v>b?b:v; }
function saveLocal(){}
function toast(){}
var _wdRefresh;
var document = { getElementById: function(){ return null; } };

/* ==== THE 1864 CLOCK — war's political dimension (clk) ==== */
function _clkEsc(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function _clkPush(clock, line) {
  if (!clock.log) clock.log = [];
  clock.log.unshift(String(line));
  if (clock.log.length > 6) clock.log.length = 6;
}
function _clkBondCost(clock) {
  return 20 + 10 * (clock.bonds || 0);
}
function clkInit(C) {
  if (!C) return;
  if (!C.clock) {
    C.clock = {
      weariness: 25, capital: 0, intervention: 8, year: 1861,
      elected: true, resolved1864: false, bonds: 0, log: []
    };
  }
  if (!C.clock.log) C.clock.log = [];
}
function clkOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  clkInit(C);
  var k = C.clock;
  var side = (B && B.playerSide) ? B.playerSide : C.side;
  var name = (B && B.bd && B.bd.name) ? B.bd.name : "The field";
  var battleYear = (B && B.bd && B.bd.year) ? B.bd.year : k.year;
  k.year = Math.max(k.year, battleYear || k.year);
  var wDelta;
  if (win) wDelta = (type === "decisive") ? -10 : -6;
  else if (type === "draw") wDelta = 3;
  else wDelta = 10;
  var cas = (B && B.casualties && side) ? (B.casualties[side] || 0) : 0;
  wDelta += Math.round(cas / 2500);
  k.weariness = clamp(k.weariness + wDelta, 0, 100);
  var cDelta;
  if (win) cDelta = (type === "decisive") ? 18 : (type === "objwin") ? 13 : 10;
  else if (type === "draw") cDelta = 3;
  else cDelta = 2;
  k.capital = Math.max(0, k.capital + cDelta);
  var iDelta = 0;
  if (side === "CS") {
    if (win) iDelta = (type === "decisive") ? 10 : 6;
    else if (!win && type !== "draw") iDelta = -5;
  } else {
    if (win) iDelta = -5;
    else if (!win && type !== "draw") iDelta = 4;
  }
  k.intervention = clamp(k.intervention + iDelta, 0, 100);
  if (k.year >= 1864 && !k.resolved1864) {
    var won = (C.stats && C.stats.won) || 0;
    var battles = Math.max(1, (C.stats && C.stats.battles) || 1);
    var support = clamp(
      100 - k.weariness + Math.floor(k.capital / 2) + Math.round((won / battles) * 20),
      0, 200
    );
    k.elected = support >= 60;
    k.resolved1864 = true;
    if (k.elected) {
      _clkPush(k, "1864: the administration is sustained at the polls — the war goes on.");
    } else {
      _clkPush(k, "1864: the peace ticket prevails — the war effort is repudiated.");
      k.weariness = clamp(k.weariness + 15, 0, 100);
    }
  }
  var verdict = win ? (type === "decisive" ? "a decisive victory steadies the home front"
                                            : "a victory steadies the home front")
                    : (type === "draw" ? "an inconclusive day strains the home front"
                                       : "a reverse hardens the war-weariness");
  var capSign = (cDelta >= 0 ? "+" : "") + cDelta;
  _clkPush(k, _clkEsc(name) + ": " + verdict +
    " (weariness " + k.weariness + ", capital " + capSign + ").");
}
function clkRenderHTML(C) {
  if (!C) return "";
  clkInit(C);
  var k = C.clock;
  var cost = _clkBondCost(k);
  var canBond = k.capital >= cost;
  var pips = "";
  var pipN = Math.min(12, Math.floor(k.capital / 10));
  for (var p = 0; p < pipN; p++) pips += "&#9670;";
  if (!pips) pips = "&mdash;";
  var meter = function (label, val, pct, fill) {
    var w = clamp(pct, 0, 100);
    return '<div class="kv" style="margin:6px 0;">' +
      '<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#5c3c18;margin-bottom:2px;">' +
        _clkEsc(label) + ' &mdash; ' + val + '</div>' +
      '<div style="height:9px;background:#0e0a06;border:1px solid #3a2e1e;border-radius:2px;overflow:hidden;">' +
        '<div style="height:100%;width:' + w + '%;background:' + fill + ';"></div>' +
      '</div></div>';
  };
  var verdictLine = "";
  if (k.resolved1864) {
    verdictLine = k.elected
      ? '<div class="lede" style="color:#2f6a3a;font-weight:700;">1864 Election: Administration Sustained &mdash; the war goes on.</div>'
      : '<div class="lede" style="color:#9a3328;font-weight:700;">1864 Election: Peace Ticket Prevails &mdash; the war effort repudiated.</div>';
  } else {
    verdictLine = '<div class="lede" style="color:#4a3c2c;font-style:italic;">The 1864 referendum is yet to come.</div>';
  }
  var dispatches = "";
  if (k.log && k.log.length) {
    var lines = "";
    for (var i = 0; i < k.log.length; i++) {
      lines += '<li style="margin:0 0 4px;line-height:1.4;">&#8226; ' + _clkEsc(k.log[i]) + '</li>';
    }
    dispatches = '<ul style="list-style:none;padding:0;margin:6px 0 0;font-size:11px;color:#4a3c2c;">' + lines + '</ul>';
  } else {
    dispatches = '<div style="font-size:11px;color:#6a5a3a;font-style:italic;margin-top:6px;">No dispatches yet.</div>';
  }
  var bondBtn =
    '<button id="clkBond" class="kv"' + (canBond ? '' : ' disabled') + ' ' +
      'style="display:block;width:100%;text-align:left;margin:10px 0 0;padding:8px 10px;cursor:' +
        (canBond ? 'pointer' : 'default') + ';background:#1a1208;border:1px solid ' +
        (canBond ? '#c9a85f' : '#5a4a32') + ';border-radius:3px;color:' +
        (canBond ? '#e0c472' : '#7a6a4a') + ';font-family:Georgia,serif;">' +
      '<span style="font-weight:700;letter-spacing:.02em;">Float a War-Bond Drive</span><br>' +
      '<span style="font-size:10px;font-style:italic;">Costs ' + cost +
        ' Political Capital &mdash; yields +150 funds.</span>' +
    '</button>';
  return '<div class="benchbox" style="background:#f5edd6;color:#2b2118;border:1px solid #c8b07a;' +
      'border-radius:3px;padding:12px 14px;font-family:Georgia,serif;">' +
      '<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#5c3c18;' +
        'border-bottom:2px solid #2b2118;padding-bottom:5px;margin-bottom:8px;">' +
        'The 1864 Clock &mdash; Campaign Season ' + (k.year || 1861) + '</div>' +
      verdictLine +
      meter("Home-Front Weariness", k.weariness, k.weariness, 'linear-gradient(#d4694f,#a03828)') +
      meter("Foreign Intervention", k.intervention, k.intervention, 'linear-gradient(#7a8fc0,#3a4a8a)') +
      '<div class="kv" style="margin:6px 0;">' +
        '<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#5c3c18;margin-bottom:2px;">' +
          'Political Capital &mdash; ' + k.capital + '</div>' +
        '<div style="font-size:13px;color:#7a5c2a;letter-spacing:.06em;">' + pips + '</div>' +
      '</div>' +
      bondBtn +
      '<div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#5c3c18;' +
        'border-top:1px solid #b09a6a;margin-top:12px;padding-top:6px;">Telegraph Dispatches</div>' +
      dispatches +
    '</div>';
}
function clkWire(C) {
  if (!C) return;
  clkInit(C);
  var btn = document.getElementById("clkBond");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var k = C.clock;
    var cost = _clkBondCost(k);
    if (k.capital >= cost) {
      k.capital -= cost;
      C.funds = (C.funds || 0) + 150;
      k.bonds = (k.bonds || 0) + 1;
      _clkPush(k, "War-bond drive subscribed: +150 funds.");
      if (typeof _wdRefresh === "function") _wdRefresh();
      saveLocal();
    } else {
      toast("Not enough political capital.");
    }
  });
}
/* ==== END THE 1864 CLOCK (clk) ==== */

// ---- runtime exercise ----
clkInit(null);
clkOnResolve("US","decisive",null,null,true); // null C must no-op
var C = { side:"US", funds:100, stats:{won:3,battles:5} };
clkInit(C);
clkOnResolve("US","win",{playerSide:"US",bd:{name:"Antietam",year:1862},casualties:{US:12000}},C,true);
clkOnResolve("CS","loss",{playerSide:"US",bd:{name:"Fredericksburg",year:1862},casualties:{US:13000}},C,false);
clkOnResolve(null,"draw",{playerSide:"US",bd:{name:"Stones River",year:1863},casualties:{US:13000}},C,false);
clkOnResolve("US","decisive",{playerSide:"US",bd:{name:"Gettysburg",year:1864},casualties:{US:23000}},C,true);
console.log("year",C.clock.year,"elected",C.clock.elected,"resolved",C.clock.resolved1864,"weariness",C.clock.weariness,"capital",C.clock.capital,"interv",C.clock.intervention);
console.log("log:", JSON.stringify(C.clock.log,null,1));
var html = clkRenderHTML(C);
console.log("HTML len", html.length, "has clkBond id:", html.indexOf('id="clkBond"')>=0);
var html2 = clkRenderHTML(null); console.log("null render:", JSON.stringify(html2));
clkWire(C); clkWire(null);
// old save: C without clock
var oldC = { side:"CS", funds:0 };
console.log("old-save render len", clkRenderHTML(oldC).length, "clock created:", !!oldC.clock);
