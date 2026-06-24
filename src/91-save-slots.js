/* ===========================================================================
   J-polish · 91-save-slots.js — NAMED SAVE SLOTS + enhanced export.

   Adds a multi-slot save system so two (or more) players can maintain
   separate campaigns on the same browser. Three named slots + the existing
   auto-save (localStorage "gor_save") coexist; slots are stored under
   "gor_slot_0" / "gor_slot_1" / "gor_slot_2".

   Also enhances exportSave() with a descriptive filename (side + turn).

   Injects a "Save & Load" button into the main-menu Notices column via
   MutationObserver (same additive pattern as T0). Opens a period-styled
   slot manager (save-to / load-from / rename / delete per slot).

   Bare-name globals (G, openSheet, openMainMenu, toast, serializeSave,
   applySave, _SAVE_VER, saveLocal). All helpers prefixed `_sl` to satisfy
   the collision gate.
   =========================================================================== */

var _SL_MAX = 3;
var _SL_PREFIX = "gor_slot_";

/* ---- slot I/O ---- */
function _slKey(i) { return _SL_PREFIX + i; }

function _slRead(i) {
  try {
    var raw = localStorage.getItem(_slKey(i));
    if (!raw) return null;
    var sv = JSON.parse(raw);
    if (!sv || sv.ver !== _SAVE_VER) return null;
    if (!sv.settings || typeof sv.settings !== "object" || Array.isArray(sv.settings)) return null;
    return sv;
  } catch (e) { return null; }
}

function _slWrite(i, sv) {
  try {
    localStorage.setItem(_slKey(i), JSON.stringify(sv));
    return true;
  } catch (e) { return false; }
}

function _slDelete(i) {
  try { localStorage.removeItem(_slKey(i)); } catch (e) {}
}

function _slMeta(i) {
  var sv = _slRead(i);
  if (!sv) return null;
  var c = sv.campaign;
  var label = sv.slotName || "";
  var side = (c && c.side === "CS") ? "Confederate" : "Union";
  var turn = (c && c.president && c.president.turn) ? c.president.turn : 0;
  var date = "";
  if (c && c.president && c.president.date) {
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    date = months[(c.president.date.month || 1) - 1] + " " + (c.president.date.year || 1861);
  }
  var when = sv.when ? new Date(sv.when).toLocaleDateString() : "";
  return { label: label, side: side, turn: turn, date: date, when: when, hasCampaign: !!c };
}

/* ---- the Slot Manager UI ---- */
function _slOpenManager() {
  var rows = "";
  for (var i = 0; i < _SL_MAX; i++) {
    var m = _slMeta(i);
    var content;
    if (m) {
      var desc = m.label || (m.side + " — Turn " + m.turn);
      if (m.date) desc += " (" + m.date + ")";
      content =
        '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:bold;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _slEsc(desc) + '</div>' +
          '<div style="font-size:11px;opacity:.7">Saved: ' + m.when + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0">' +
          '<button class="gn-btn" id="slLoad' + i + '" style="padding:6px 10px;font-size:12px" aria-label="Load slot ' + (i+1) + '">Load</button>' +
          '<button class="gn-btn" id="slDel' + i + '" style="padding:6px 10px;font-size:12px;opacity:.7" aria-label="Delete slot ' + (i+1) + '">Del</button>' +
        '</div>';
    } else {
      content =
        '<div style="flex:1;opacity:.6;font-style:italic;font-size:13px">— Empty —</div>';
    }
    rows +=
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--rule);border-radius:4px;margin-bottom:8px;background:rgba(0,0,0,.15)">' +
        '<div style="font-size:18px;font-weight:bold;color:#a89066;width:22px;text-align:center">' + (i+1) + '</div>' +
        content +
        '<button class="gn-btn" id="slSave' + i + '" style="padding:6px 10px;font-size:12px" aria-label="Save to slot ' + (i+1) + '">Save</button>' +
      '</div>';
  }

  var html =
    '<h1 class="title-xl">Save &amp; Load</h1>' +
    '<p class="title-sub">Campaign Slots — maintain separate campaigns for each commander</p>' +
    '<hr class="rule">' +
    rows +
    '<hr class="rule" style="margin-top:16px">' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="gn-btn" id="slExport" style="padding:6px 14px">Export to File</button>' +
      '<button class="gn-btn" id="slImport" style="padding:6px 14px">Import from File</button>' +
      '<button class="gn-btn" id="slBack" style="padding:6px 14px;opacity:.7">Back to Menu</button>' +
    '</div>';

  openSheet(html);
  _slWire();
}

function _slWire() {
  for (var i = 0; i < _SL_MAX; i++) {
    (function (idx) {
      var loadBtn = document.getElementById("slLoad" + idx);
      var saveBtn = document.getElementById("slSave" + idx);
      var delBtn  = document.getElementById("slDel" + idx);

      if (loadBtn) loadBtn.addEventListener("click", function () {
        var sv = _slRead(idx);
        if (!sv) { toast("Slot is empty."); return; }
        applySave(sv);
        saveLocal();
        toast("Loaded slot " + (idx+1) + ".");
        if (typeof openMainMenu === "function") openMainMenu();
      });

      if (saveBtn) saveBtn.addEventListener("click", function () {
        var sv = serializeSave();
        var name = "";
        if (G.campaign) {
          var side = (G.campaign.side === "CS") ? "Confederate" : "Union";
          var turn = (G.campaign.president && G.campaign.president.turn) || 0;
          name = side + " — Turn " + turn;
        } else {
          name = "Quick Save";
        }
        sv.slotName = name;
        if (_slWrite(idx, sv)) {
          toast("Saved to slot " + (idx+1) + ".");
        } else {
          toast("Save failed — storage may be full.");
        }
        _slOpenManager();
      });

      if (delBtn) delBtn.addEventListener("click", function () {
        _slDelete(idx);
        toast("Slot " + (idx+1) + " cleared.");
        _slOpenManager();
      });
    })(i);
  }

  var expBtn = document.getElementById("slExport");
  if (expBtn) expBtn.addEventListener("click", function () {
    _slExportEnhanced();
  });

  var impBtn = document.getElementById("slImport");
  if (impBtn) impBtn.addEventListener("click", function () {
    if (typeof importSave === "function") {
      importSave(function (ok) {
        if (ok) { toast("Save loaded."); saveLocal(); }
        else { toast("Import failed."); }
        _slOpenManager();
      });
    }
  });

  var backBtn = document.getElementById("slBack");
  if (backBtn) backBtn.addEventListener("click", function () {
    if (typeof openMainMenu === "function") openMainMenu();
  });
}

/* Enhanced export with descriptive filename */
function _slExportEnhanced() {
  try {
    var sv = serializeSave();
    var fname = "civil_war";
    if (G.campaign) {
      var side = (G.campaign.side === "CS") ? "confederate" : "union";
      var turn = (G.campaign.president && G.campaign.president.turn) || 0;
      fname += "_" + side + "_turn" + turn;
    }
    fname += "_save.json";
    var json = JSON.stringify(sv, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = fname;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  } catch (e) {
    toast("Export failed.", 2200);
  }
}

/* Escape HTML (reuse _cabEsc if available, else minimal) */
function _slEsc(s) {
  if (typeof _cabEsc === "function") return _cabEsc(s);
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---- ADDITIVE MENU INJECTION (MutationObserver — same pattern as T0) ---- */
(function () {
  if (typeof MutationObserver === "undefined") return;
  var installed = false;
  var obs = new MutationObserver(function (muts) {
    if (installed) return;
    for (var i = 0; i < muts.length; i++) {
      for (var j = 0; j < muts[i].addedNodes.length; j++) {
        var node = muts[i].addedNodes[j];
        if (!node.querySelector) continue;
        var classifieds = node.querySelector(".gn-classifieds");
        if (!classifieds) classifieds = node.querySelector(".gn-col:last-child");
        if (!classifieds) continue;
        /* Inject the Save & Load button BEFORE the existing Notices block */
        var col3 = node.querySelector(".gn-col:last-child");
        if (!col3) continue;
        var btn = document.createElement("button");
        btn.className = "gn-btn";
        btn.id = "gnSaveLoad";
        btn.setAttribute("aria-label", "Save & Load — manage campaign save slots");
        btn.innerHTML =
          '<span class="gn-hl">SAVE &amp; LOAD CAMPAIGNS</span>' +
          '<span class="gn-deck">Multiple slots &mdash; keep separate campaigns for each commander.</span>';
        btn.style.marginBottom = "10px";
        col3.insertBefore(btn, col3.firstChild.nextSibling);
        btn.addEventListener("click", function () { _slOpenManager(); });
        installed = true;
        return;
      }
    }
  });
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  /* Also try on any existing sheet (if openMainMenu already fired) */
  var existing = document.querySelector(".gn-col:last-child");
  if (existing && !installed) {
    var btn2 = document.createElement("button");
    btn2.className = "gn-btn";
    btn2.id = "gnSaveLoad";
    btn2.setAttribute("aria-label", "Save & Load — manage campaign save slots");
    btn2.innerHTML =
      '<span class="gn-hl">SAVE &amp; LOAD CAMPAIGNS</span>' +
      '<span class="gn-deck">Multiple slots &mdash; keep separate campaigns for each commander.</span>';
    btn2.style.marginBottom = "10px";
    existing.insertBefore(btn2, existing.firstChild.nextSibling);
    btn2.addEventListener("click", function () { _slOpenManager(); });
    installed = true;
  }
})();
