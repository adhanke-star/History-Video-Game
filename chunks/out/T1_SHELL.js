/* ============================================================================
   §24 — THE WAR DEPARTMENT (v1.5 strategic shell)  — Fable-authored integration glue
   Hosts the three v1.5 systems (1864 Clock / Muster Roll / War Room) behind one
   campaign-gated menu entry. Each system is an append-only chunk exposing exactly
   four functions (<ns>Init / <ns>OnResolve / <ns>RenderHTML / <ns>Wire); this shell
   wires them into the existing engine without the systems touching the HTML.
     • _t1InitAll(C)                       — idempotent init of all three systems
     • _t1Resolve(winnerSide,type,B,C,win) — per-battle tick (called from campaignAdvance)
     • openWarDept()                       — opens the tabbed War Department sheet
     • _wdRefresh()                        — re-renders the active tab (systems' Wire calls this)
   All guarded: absent system → tab shows a placeholder; G.campaign null → no-op.
   ============================================================================ */
var _wdTab = "clock"; // UI-only (not persisted)

function _t1InitAll(C) {
  if (!C) return;
  try { if (typeof clkInit === "function") clkInit(C); } catch (e) {}
  try { if (typeof mrInit  === "function") mrInit(C);  } catch (e) {}
  try { if (typeof wrInit  === "function") wrInit(C);  } catch (e) {}
}

// Tick order: clock first (creates C.clock), then war room (trickles into C.clock.capital),
// then muster roll (records fates). Each call is isolated so one failure can't abort the others.
function _t1Resolve(winnerSide, type, B, C, win) {
  if (!C) return;
  try { if (typeof clkOnResolve === "function") clkOnResolve(winnerSide, type, B, C, win); } catch (e) {}
  try { if (typeof wrOnResolve  === "function") wrOnResolve(winnerSide, type, B, C, win);  } catch (e) {}
  try { if (typeof mrOnResolve  === "function") mrOnResolve(winnerSide, type, B, C, win);  } catch (e) {}
}

function _wdTabBtn(k, label) {
  var on = (k === _wdTab);
  return '<button id="wdTab_' + k + '" type="button" style="padding:7px 13px;border:1px solid var(--rule);'
    + 'background:transparent;color:inherit;border-radius:4px;cursor:pointer;font:inherit;'
    + 'opacity:' + (on ? '1' : '0.55') + '">' + label + '</button>';
}

// Re-render the active tab's content + re-attach its listeners. Systems call this
// after they mutate state in their Wire handlers, then saveLocal().
function _wdRefresh() {
  var C = G.campaign;
  if (!C) return;
  var cont = document.getElementById("wdContent");
  if (!cont) return;
  var html = "", wire = null;
  if (_wdTab === "muster") {
    html = (typeof mrRenderHTML === "function") ? mrRenderHTML(C) : "";
    wire = (typeof mrWire === "function") ? mrWire : null;
  } else if (_wdTab === "warroom") {
    html = (typeof wrRenderHTML === "function") ? wrRenderHTML(C) : "";
    wire = (typeof wrWire === "function") ? wrWire : null;
  } else {
    html = (typeof clkRenderHTML === "function") ? clkRenderHTML(C) : "";
    wire = (typeof clkWire === "function") ? clkWire : null;
  }
  cont.innerHTML = html || '<p class="lede" style="text-align:center;opacity:0.7">This office is not yet staffed.</p>';
  var tabs = ["clock", "muster", "warroom"];
  for (var i = 0; i < tabs.length; i++) {
    var b = document.getElementById("wdTab_" + tabs[i]);
    if (b) b.style.opacity = (tabs[i] === _wdTab) ? "1" : "0.55";
  }
  if (wire) { try { wire(C); } catch (e) {} }
}

function openWarDept() {
  var C = G.campaign;
  if (!C) {
    // Try to revive a saved campaign (mirrors the Continue button).
    if (typeof loadLocal === "function") {
      var sv = loadLocal();
      if (sv && sv.campaign && typeof applySave === "function") { applySave(sv); C = G.campaign; }
    }
  }
  if (!C) { if (typeof toast === "function") toast("No active campaign."); return; }
  _t1InitAll(C);
  var sideLabel = (C.side === "US") ? "Union" : "Confederate";
  var html =
    '<h1 class="title-xl" style="text-align:center">The War Department</h1>' +
    '<p class="title-sub" style="text-align:center">' + sideLabel + ' Grand Campaign</p>' +
    '<hr class="rule">' +
    '<div id="wdTabs" style="display:flex;gap:6px;justify-content:center;margin-bottom:12px;flex-wrap:wrap">' +
      _wdTabBtn("clock", "The 1864 Clock") +
      _wdTabBtn("muster", "Muster Roll") +
      _wdTabBtn("warroom", "War Room") +
    '</div>' +
    '<div id="wdContent"></div>' +
    '<div class="btn-row" style="margin-top:14px"><button id="wdClose" type="button" class="bigbtn">Close</button></div>';
  if (typeof openSheet === "function") openSheet(html);
  _wdRefresh();
  var cl = document.getElementById("wdClose");
  if (cl) cl.addEventListener("click", function () { if (typeof closeSheet === "function") closeSheet(); });
  ["clock", "muster", "warroom"].forEach(function (k) {
    var b = document.getElementById("wdTab_" + k);
    if (b) b.addEventListener("click", function () { _wdTab = k; _wdRefresh(); });
  });
}
