/* =====================================================================
   THE WAR ROOM — war-economy table (namespace "wr", state C.warroom)
   DESIGN-BIBLE v1.5 lock. CAMPAIGN-LAYER ONLY: funds, supply rating, and
   a political-capital trickle into C.clock. Does NOT touch in-battle
   combat numbers or any renderer — classic 2D unaffected.
   Exports exactly: wrInit, wrOnResolve, wrRenderHTML, wrWire.
   ===================================================================== */

const _wrKEYS = ["industry", "ordnance", "provisions", "rail", "depot"];
const _wrLABELS = {
  US: { industry: "Factory", ordnance: "Arsenal", provisions: "Farm Belt", rail: "Railroad", depot: "Forward Depot" },
  CS: { industry: "Tredegar Works", ordnance: "Niter Bureau", provisions: "Plantation Belt", rail: "Railroad", depot: "Forward Depot" }
};

function _wrEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function _wrCost(level) { return 120 + 90 * level; }

function _wrSideLabels(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  return _wrLABELS[side];
}

function _wrPush(wr, msg) {
  wr.log.unshift(msg);
  while (wr.log.length > 6) wr.log.pop();
}

function wrInit(C) {
  if (!C) return;
  if (!C.warroom || typeof C.warroom !== "object") {
    C.warroom = {
      nodes: { industry: 0, ordnance: 0, provisions: 0, rail: 0, depot: 0 },
      supply: 50,
      raidCooldown: 0,
      log: []
    };
  }
  var wr = C.warroom;
  if (!wr.nodes || typeof wr.nodes !== "object") wr.nodes = { industry: 0, ordnance: 0, provisions: 0, rail: 0, depot: 0 };
  for (var i = 0; i < _wrKEYS.length; i++) {
    var k = _wrKEYS[i];
    if (typeof wr.nodes[k] !== "number") wr.nodes[k] = 0;
  }
  if (typeof wr.supply !== "number") wr.supply = 50;
  if (typeof wr.raidCooldown !== "number") wr.raidCooldown = 0;
  if (!Array.isArray(wr.log)) wr.log = [];
}

function wrOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  wrInit(C);
  var wr = C.warroom;
  var n = wr.nodes;
  if (typeof C.funds !== "number") C.funds = 0;

  // Supply rating drifts 1/3 toward a node-driven target.
  var target = clamp(40 + 8 * n.provisions + 6 * n.rail + 5 * n.depot - (win ? 0 : 8), 0, 100);
  wr.supply += Math.round((target - wr.supply) / 3);
  wr.supply = clamp(wr.supply, 0, 100);

  // Economic output to campaign funds (no combat effect).
  var gain = 25 * n.industry + 20 * n.ordnance + 15 * n.provisions;
  var railed = Math.round(gain * (wr.supply / 100) * (1 + 0.1 * n.rail));
  C.funds += railed;

  // Political-capital trickle — interlink with the 1864 Clock, if present.
  if (C.clock && typeof C.clock === "object") {
    if (typeof C.clock.capital !== "number") C.clock.capital = 0;
    C.clock.capital += Math.round((n.industry + n.ordnance) / 2);
  }

  // Raider event — CS rails are rawer, so higher strike chance.
  var pSide = (B && B.playerSide === "CS") ? "CS" : "US";
  var labels = _wrLABELS[pSide];
  if (wr.raidCooldown <= 0 && Math.random() < (pSide === "US" ? 0.18 : 0.28)) {
    wr.supply = clamp(wr.supply - 12, 0, 100);
    C.funds -= Math.round(C.funds * 0.06);
    if (C.funds < 0) C.funds = 0;
    wr.raidCooldown = 2;
    _wrPush(wr, "Raiders cut the " + labels.rail + " — supply and stores lost.");
  } else {
    wr.raidCooldown = Math.max(0, wr.raidCooldown - 1);
  }

  _wrPush(wr, "Quartermaster: +" + railed + " funds railed forward; supply " + wr.supply + ".");
}

function wrRenderHTML(C) {
  if (!C) return "";
  wrInit(C);
  var wr = C.warroom;
  var n = wr.nodes;
  var labels = _wrSideLabels(C);
  var funds = (typeof C.funds === "number") ? C.funds : 0;

  var parts = [];
  parts.push('<div class="wr-room" style="font-family:Georgia,serif;color:#2b2118;background:#f5edd6;border:1px solid #c8b07a;border-radius:3px;padding:12px 14px;">');
  parts.push('<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #7a5f35;padding-bottom:4px;margin-bottom:8px;">');
  parts.push('<strong style="font-size:1.05em;letter-spacing:.04em;">THE WAR ROOM</strong>');
  parts.push('<span style="font-weight:bold;">Treasury: ' + _wrEsc(funds) + ' funds</span>');
  parts.push('</div>');

  // Supply meter bar.
  var sup = clamp(wr.supply, 0, 100);
  parts.push('<div style="margin-bottom:10px;">');
  parts.push('<div style="font-size:.82em;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Campaign Supply &mdash; ' + _wrEsc(sup) + '/100</div>');
  parts.push('<div style="height:12px;background:#c9b78c;border:1px solid #7a5f35;border-radius:3px;overflow:hidden;">');
  parts.push('<div style="height:100%;width:' + sup + '%;background:#7a5f35;"></div>');
  parts.push('</div></div>');

  // Five build nodes.
  for (var i = 0; i < _wrKEYS.length; i++) {
    var k = _wrKEYS[i];
    var lvl = n[k];
    var cost = _wrCost(lvl);
    var maxed = lvl >= 5;
    var poor = funds < cost;
    var disabled = maxed || poor;
    var pips = "";
    for (var p = 0; p < 5; p++) pips += (p < lvl) ? "&#9632;" : "&#9633;";
    var btnLabel = maxed ? "Maxed (Lv 5)" : "Build &mdash; " + cost + " funds";
    var btnStyle = disabled
      ? "color:#9a8c70;background:#d6c8a4;border:1px solid #b3a079;cursor:default;"
      : "color:#f4ecd8;background:#7a5f35;border:1px solid #5a431f;cursor:pointer;";
    parts.push('<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px dotted #b3a079;">');
    parts.push('<span style="flex:1;">' + _wrEsc(labels[k]) + ' <span style="opacity:.7;font-size:.85em;">Lv ' + lvl + '</span></span>');
    parts.push('<span style="letter-spacing:2px;color:#7a5f35;margin:0 10px;">' + pips + '</span>');
    parts.push('<button id="wrBuild_' + k + '" ' + (disabled ? "disabled " : "") + 'style="padding:3px 8px;border-radius:3px;font-family:Georgia,serif;font-size:.85em;' + btnStyle + '">' + btnLabel + '</button>');
    parts.push('</div>');
  }

  // Dispatch log (newest first).
  parts.push('<div style="margin-top:10px;">');
  parts.push('<div style="font-size:.82em;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Dispatches</div>');
  if (wr.log.length === 0) {
    parts.push('<div style="font-style:italic;opacity:.65;font-size:.85em;">No dispatches yet.</div>');
  } else {
    for (var d = 0; d < wr.log.length; d++) {
      parts.push('<div style="font-size:.85em;opacity:' + (d === 0 ? "1" : ".75") + ';">&bull; ' + _wrEsc(wr.log[d]) + '</div>');
    }
  }
  parts.push('</div>');

  parts.push('</div>');
  return parts.join("");
}

function wrWire(C) {
  if (!C) return;
  wrInit(C);
  var wr = C.warroom;
  var n = wr.nodes;
  var labels = _wrSideLabels(C);

  for (var i = 0; i < _wrKEYS.length; i++) {
    (function (k) {
      var btn = document.getElementById("wrBuild_" + k);
      if (!btn) return;
      btn.addEventListener("click", function () {
        var lvl = n[k];
        var cost = _wrCost(lvl);
        var funds = (typeof C.funds === "number") ? C.funds : 0;
        if (lvl < 5 && funds >= cost) {
          C.funds = funds - cost;
          n[k] = lvl + 1;
          _wrPush(wr, labels[k] + " expanded to Lv " + n[k] + ".");
          if (typeof _wdRefresh === "function") _wdRefresh();
          saveLocal();
        } else {
          toast("Can't build that yet.");
        }
      });
    })(_wrKEYS[i]);
  }
}