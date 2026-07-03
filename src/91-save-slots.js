/* ===========================================================================
   J-polish · 91-save-slots.js — SAVE / LOAD / SHARE HARDENING.

   Extends the base autosave with named local slots, export/import affordances,
   malformed-save guards, and the D35 accessible undo-last-turn safety valve.

   Storage:
     - base autosave: localStorage "gor_save" (owned by base saveLocal)
     - named slots:   "gor_slot_0" / "gor_slot_1" / "gor_slot_2"
     - one-turn undo: "gor_undo_last"

   Bare-name globals (G, openSheet, openMainMenu, toast, serializeSave,
   applySave, _SAVE_VER, saveLocal, campaignAdvance). Helpers are _sl-prefixed.
   =========================================================================== */

var _SL_MAX = 3;
var _SL_PREFIX = "gor_slot_";
var _SL_UNDO_KEY = "gor_undo_last";

/* ---- shared validation / cloning ---- */
function _slOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function _slKey(i) { return _SL_PREFIX + i; }
function _slClone(v) { try { return JSON.parse(JSON.stringify(v)); } catch (e) { return null; } }
function _slEsc(s) {
  if (typeof _cabEsc === "function") return _cabEsc(s);
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\x27/g, "&#39;");
}
function _slCleanLabel(s) {
  s = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  return s.length > 80 ? s.slice(0, 80) : s;
}
function _slValidSave(sv) {
  if (!sv || typeof sv !== "object" || Array.isArray(sv)) return false;
  if (sv.ver !== _SAVE_VER) return false;
  if (!sv.settings || typeof sv.settings !== "object" || Array.isArray(sv.settings)) return false;
  if (_slOwn(sv.settings, "hasOwnProperty")) return false;
  if (sv.campaign != null && (typeof sv.campaign !== "object" || Array.isArray(sv.campaign))) return false;
  return true;
}

/* ---- slot I/O ---- */
function _slRead(i) {
  try {
    var raw = localStorage.getItem(_slKey(i));
    if (!raw) return null;
    var sv = JSON.parse(raw);
    return _slValidSave(sv) ? sv : null;
  } catch (e) { return null; }
}
function _slWrite(i, sv) {
  try {
    if (!_slValidSave(sv)) return false;
    localStorage.setItem(_slKey(i), JSON.stringify(sv));
    return true;
  } catch (e) { return false; }
}
function _slDelete(i) { try { localStorage.removeItem(_slKey(i)); } catch (e) {} }
/* S34 (D234): a slot whose RAW data exists but fails validation (older _SAVE_VER / damaged JSON) must not
   masquerade as "Empty" — the raw string is still in localStorage and an enabled Save would clobber it. */
function _slRawPresent(i) { try { return localStorage.getItem(_slKey(i)) != null; } catch (e) { return false; } }
/* S32 (D234): loading/importing replaces the LIVE campaign and immediately overwrites the base autosave
   (saveLocal) — confirm first whenever a campaign is actually in progress. */
function _slConfirmReplaceLive(what) {
  var hasLive = false;
  try { hasLive = !!(typeof G !== "undefined" && G && G.campaign); } catch (e) {}
  if (!hasLive) return true;
  try { return window.confirm(what + " will replace your current campaign — unsaved progress is lost. Continue?"); } catch (e2) { return true; }
}
function _slSetSlotName(i, name) {
  var sv = _slRead(i);
  if (!sv) return false;
  sv.slotName = _slCleanLabel(name);
  return _slWrite(i, sv);
}
function _slMeta(i) {
  var sv = _slRead(i);
  if (!sv) return null;
  var c = sv.campaign || null;
  var label = _slCleanLabel(sv.slotName || "");
  var side = (c && c.side === "CS") ? "Confederate" : "Union";
  var turn = (c && c.president && typeof c.president.turn === "number") ? c.president.turn : 0;
  var date = "";
  if (c && c.president && c.president.date && typeof c.president.date === "object") {
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var mi = Math.max(0, Math.min(11, ((c.president.date.month || 1) - 1)));
    date = months[mi] + " " + (c.president.date.year || 1861);
  }
  var when = "";
  try { when = sv.when ? new Date(sv.when).toLocaleDateString() : ""; } catch (e) {}
  return { label: label, side: side, turn: turn, date: date, when: when, hasCampaign: !!c };
}
function _slDefaultSlotName() {
  var C = (typeof G !== "undefined") ? G.campaign : null;
  if (!C) return "Quick Save";
  var side = (C.side === "CS") ? "Confederate" : "Union";
  var turn = (C.president && typeof C.president.turn === "number") ? C.president.turn : 0;
  return side + " - Turn " + turn;
}

/* ---- export / import helpers ---- */
function _slExportString(sv) {
  return JSON.stringify(sv || serializeSave(), null, 2);
}
function _slApplyImportedSave(sv) {
  if (!_slValidSave(sv)) return { ok: false, reason: "Invalid save file." };
  var copy = _slClone(sv);
  if (!_slValidSave(copy)) return { ok: false, reason: "Invalid save file." };
  applySave(copy);
  _slClearUndo();
  if (typeof saveLocal === "function") saveLocal();
  return { ok: true };
}
function _slImportText(text) {
  try { return _slApplyImportedSave(JSON.parse(String(text || ""))); }
  catch (e) { return { ok: false, reason: "Malformed JSON." }; }
}
function _slImportFile(onDone) {
  try {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) { if (typeof onDone === "function") onDone(false); return; }
      var reader = new FileReader();
      reader.onload = function (evt) {
        var r = _slImportText(evt && evt.target ? evt.target.result : "");
        if (typeof onDone === "function") onDone(!!r.ok);
      };
      reader.onerror = function () { if (typeof onDone === "function") onDone(false); };
      reader.readAsText(file);
    });
    input.click();
  } catch (e) {
    if (typeof onDone === "function") onDone(false);
  }
}
function _slExportEnhanced() {
  try {
    var sv = serializeSave();
    var fname = "civil_war";
    if (G.campaign) {
      fname += "_" + (G.campaign.side === "CS" ? "confederate" : "union");
      fname += "_turn" + ((G.campaign.president && G.campaign.president.turn) || 0);
    }
    fname += "_save.json";
    var blob = new Blob([_slExportString(sv)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = fname;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  } catch (e) {
    if (typeof toast === "function") toast("Export failed.", 2200);
  }
}

/* ---- accessible one-turn undo ---- */
function _slDiff(settings) {
  var d = settings && typeof settings.diff === "number" && isFinite(settings.diff) ? settings.diff : 1;
  return d;
}
function _slUndoAllowedFor(C, settings) {
  return !!(C && !C.iron && _slDiff(settings) <= 1);
}
function _slClearUndo() { try { localStorage.removeItem(_SL_UNDO_KEY); } catch (e) {} }
function _slCaptureUndo(winnerSide, type) {
  try {
    var sv = serializeSave();
    if (!_slUndoAllowedFor(sv.campaign, sv.settings)) { _slClearUndo(); return null; }
    var snap = {
      ver: 1,
      when: Date.now(),
      winnerSide: winnerSide || null,
      type: type || "",
      save: _slClone(sv)
    };
    if (!_slValidSave(snap.save)) return null;
    localStorage.setItem(_SL_UNDO_KEY, JSON.stringify(snap));
    return snap;
  } catch (e) { return null; }
}
function _slReadUndo() {
  try {
    var raw = localStorage.getItem(_SL_UNDO_KEY);
    if (!raw) return null;
    var snap = JSON.parse(raw);
    if (!snap || snap.ver !== 1 || !_slValidSave(snap.save)) return null;
    if (!_slUndoAllowedFor(snap.save.campaign, snap.save.settings)) return null;
    return snap;
  } catch (e) { return null; }
}
function _slUndoAvailable() {
  var snap = _slReadUndo();
  var C = (typeof G !== "undefined") ? G.campaign : null;
  if (!snap || !C || !_slUndoAllowedFor(C, G.settings)) return false;
  return !!(snap.save.campaign && snap.save.campaign.side === C.side);
}
function _slRestoreUndo() {
  var snap = _slReadUndo();
  if (!snap || !_slUndoAvailable()) return false;
  applySave(snap.save);
  _slClearUndo();
  if (typeof saveLocal === "function") saveLocal();
  return true;
}

(function () {
  var base = (typeof campaignAdvance === "function") ? campaignAdvance : null;
  if (!base || base._slUndoWrapped) return;
  var wrapped = function (winnerSide, type) {
    _slCaptureUndo(winnerSide, type);
    return base.apply(this, arguments);
  };
  wrapped._slUndoWrapped = true;
  campaignAdvance = wrapped;
})();

(function () {
  if (typeof importSave !== "function" || importSave._slHardened) return;
  var hardened = function (onDone) {
    // S32 (D234, review-caught): the base menu's "Load from File" buttons route through THIS wrapper —
    // they replace the live campaign + autosave just like the slot manager's import lanes, so the same
    // confirm guards them all. A decline simply leaves the menu untouched (no picker, no callback).
    if (!_slConfirmReplaceLive("Loading a save file")) return;
    _slImportFile(onDone);
  };
  hardened._slHardened = true;
  importSave = hardened;
})();

/* ---- Slot Manager UI ---- */
function _slRowHTML(i) {
  var m = _slMeta(i);
  var stale = !m && _slRawPresent(i);   // S34 (D234): raw data present but unreadable (old version / damaged)
  var title = stale ? "Incompatible save" : "Empty";
  var sub = stale
    ? "This slot holds data from an older or damaged save format. Save and Load are disabled to protect it; Delete clears it."
    : "No saved campaign in this slot.";
  var value = "";
  if (m) {
    title = m.label || (m.side + " - Turn " + m.turn);
    if (m.date) title += " (" + m.date + ")";
    sub = "Saved: " + (m.when || "unknown");
    value = m.label || "";
  }
  return ''
    + '<div class="sl-row" style="display:grid;grid-template-columns:26px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 12px;border:1px solid var(--rule);border-radius:6px;margin-bottom:8px;background:rgba(0,0,0,.15)">'
    +   '<div aria-hidden="true" style="font-size:18px;font-weight:bold;color:#a89066;text-align:center">' + (i + 1) + '</div>'
    +   '<div style="min-width:0">'
    +     '<div style="font-weight:bold;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + _slEsc(title) + '</div>'
    +     '<div style="font-size:11px;opacity:.72">' + _slEsc(sub) + '</div>'
    +     '<label for="slName' + i + '" style="display:block;font-size:11px;opacity:.76;margin-top:5px">Slot name</label>'
    +     '<input id="slName' + i + '" type="text" value="' + _slEsc(value) + '" aria-label="Name for save slot ' + (i + 1) + '" maxlength="80"'
    +       ' style="box-sizing:border-box;width:100%;margin-top:2px;padding:6px 8px;border:1px solid #8c724e;border-radius:4px;background:#161009;color:#f2e8d5">'
    +   '</div>'
    +   '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">'
    +     '<button class="upg" id="slSave' + i + '" style="padding:6px 10px;font-size:12px" aria-label="Save current campaign to slot ' + (i + 1) + '"' + (stale ? " disabled" : "") + '>Save</button>'
    +     '<button class="upg" id="slRename' + i + '" style="padding:6px 10px;font-size:12px" aria-label="Rename save slot ' + (i + 1) + '"' + (m ? "" : " disabled") + '>Rename</button>'
    +     '<button class="upg" id="slLoad' + i + '" style="padding:6px 10px;font-size:12px" aria-label="Load save slot ' + (i + 1) + '"' + (m ? "" : " disabled") + '>Load</button>'
    +     '<button class="upg" id="slDel' + i + '" style="padding:6px 10px;font-size:12px;opacity:.75" aria-label="Delete save slot ' + (i + 1) + '"' + ((m || stale) ? "" : " disabled") + '>Delete</button>'
    +   '</div>'
    + '</div>';
}
function _slUndoHTML() {
  var snap = _slReadUndo();
  if (_slUndoAvailable()) {
    var d = "";
    try { d = snap.when ? new Date(snap.when).toLocaleString() : ""; } catch (e) {}
    return '<div style="border:1px solid #8c724e;border-radius:6px;padding:10px 12px;margin:12px 0;background:rgba(0,0,0,.12)">'
      + '<div style="font-weight:bold;color:#f0d98a">Undo last strategic turn</div>'
      + '<div style="font-size:11.5px;opacity:.75;margin:2px 0 8px">Available for Standard/Recruit terms; disabled for Hardened or Ironman campaigns. Snapshot: ' + _slEsc(d || "last resolved turn") + '.</div>'
      + '<button class="upg" id="slUndo" aria-label="Undo the last resolved strategic turn" style="padding:6px 12px">Undo Last Turn</button>'
      + '</div>';
  }
  var why = snap ? "Undo is disabled for this campaign's current terms." : "No undo snapshot is available yet.";
  return '<div style="font-size:11.5px;opacity:.72;margin:10px 0">' + why + '</div>';
}
function _slOpenManager() {
  var rows = "";
  for (var i = 0; i < _SL_MAX; i++) rows += _slRowHTML(i);
  var html =
    '<h1 class="title-xl">Save &amp; Load</h1>' +
    '<p class="title-sub">Campaign Slots - keep separate campaigns for each commander</p>' +
    '<hr class="rule">' +
    rows +
    _slUndoHTML() +
    '<hr class="rule" style="margin-top:14px">' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">' +
      '<button class="upg" id="slExport" style="padding:6px 14px">Export to File</button>' +
      '<button class="upg" id="slImport" style="padding:6px 14px">Import from File</button>' +
      '<button class="upg" id="slBack" style="padding:6px 14px;opacity:.75">Back to Menu</button>' +
    '</div>' +
    '<label for="slImportJson" style="display:block;font-size:12px;opacity:.8;margin-top:8px">Paste save JSON</label>' +
    '<textarea id="slImportJson" rows="3" aria-label="Paste exported save JSON" style="box-sizing:border-box;width:100%;margin-top:4px;padding:8px;border:1px solid #8c724e;border-radius:5px;background:#161009;color:#f2e8d5;font-family:ui-monospace,Menlo,monospace;font-size:11px"></textarea>' +
    '<button class="upg" id="slImportPaste" style="margin-top:8px;padding:6px 14px">Import Pasted JSON</button>';
  openSheet(html);
  _slWire();
}
function _slWire() {
  for (var i = 0; i < _SL_MAX; i++) {
    (function (idx) {
      var loadBtn = document.getElementById("slLoad" + idx);
      var saveBtn = document.getElementById("slSave" + idx);
      var delBtn = document.getElementById("slDel" + idx);
      var renBtn = document.getElementById("slRename" + idx);
      var nameEl = document.getElementById("slName" + idx);

      if (loadBtn) loadBtn.addEventListener("click", function () {
        var sv = _slRead(idx);
        if (!sv) { if (typeof toast === "function") toast("Slot is empty."); return; }
        if (!_slConfirmReplaceLive("Loading slot " + (idx + 1))) return;   // S32 (D234)
        applySave(_slClone(sv));
        _slClearUndo();
        if (typeof saveLocal === "function") saveLocal();
        if (typeof toast === "function") toast("Loaded slot " + (idx + 1) + ".");
        if (typeof openMainMenu === "function") openMainMenu();
      });
      if (saveBtn) saveBtn.addEventListener("click", function () {
        // S31 (D234): overwriting a FILLED slot loses that save permanently (no undo lane covers it) — confirm.
        var existing = _slMeta(idx);
        if (existing) {
          var exLabel = existing.label || (existing.side + " - Turn " + existing.turn);
          var okOw = true;
          try { okOw = window.confirm('Overwrite "' + exLabel + '" in slot ' + (idx + 1) + "? The existing save will be lost."); } catch (e) {}
          if (!okOw) return;
        }
        var sv = serializeSave();
        sv.slotName = _slCleanLabel(nameEl && nameEl.value ? nameEl.value : "") || _slDefaultSlotName();
        if (_slWrite(idx, sv)) { if (typeof toast === "function") toast("Saved to slot " + (idx + 1) + "."); }
        else if (typeof toast === "function") toast("Save failed - storage may be full.");
        _slOpenManager();
      });
      if (renBtn) renBtn.addEventListener("click", function () {
        if (_slSetSlotName(idx, nameEl ? nameEl.value : "")) { if (typeof toast === "function") toast("Renamed slot " + (idx + 1) + "."); }
        else if (typeof toast === "function") toast("Rename failed.");
        _slOpenManager();
      });
      if (delBtn) delBtn.addEventListener("click", function () {
        // S33 (D234): a single mis-tap beside Load must not permanently destroy a save — confirm first.
        var dm = _slMeta(idx);
        var dLabel = dm ? (dm.label || (dm.side + " - Turn " + dm.turn)) : ("the incompatible data in slot " + (idx + 1));
        var okDel = true;
        try { okDel = window.confirm('Delete "' + dLabel + '"? This cannot be undone.'); } catch (e) {}
        if (!okDel) return;
        _slDelete(idx);
        if (typeof toast === "function") toast("Slot " + (idx + 1) + " cleared.");
        _slOpenManager();
      });
    })(i);
  }
  var expBtn = document.getElementById("slExport");
  if (expBtn) expBtn.addEventListener("click", _slExportEnhanced);
  var impBtn = document.getElementById("slImport");
  if (impBtn) impBtn.addEventListener("click", function () {
    if (!_slConfirmReplaceLive("Importing a save file")) return;   // S32 (D234)
    _slImportFile(function (ok) {
      if (ok) { _slClearUndo(); if (typeof toast === "function") toast("Save loaded."); }
      else if (typeof toast === "function") toast("Import failed.");
      _slOpenManager();
    });
  });
  var pasteBtn = document.getElementById("slImportPaste");
  if (pasteBtn) pasteBtn.addEventListener("click", function () {
    if (!_slConfirmReplaceLive("Importing pasted save JSON")) return;   // S32 (D234)
    var ta = document.getElementById("slImportJson");
    var r = _slImportText(ta ? ta.value : "");
    if (typeof toast === "function") toast(r.ok ? "Save loaded." : (r.reason || "Import failed."));
    _slOpenManager();
  });
  var undoBtn = document.getElementById("slUndo");
  if (undoBtn) undoBtn.addEventListener("click", function () {
    if (_slRestoreUndo()) {
      if (typeof toast === "function") toast("Last strategic turn undone.");
      if (typeof openMainMenu === "function") openMainMenu();
    } else if (typeof toast === "function") toast("Undo is not available.");
  });
  var backBtn = document.getElementById("slBack");
  if (backBtn) backBtn.addEventListener("click", function () { if (typeof openMainMenu === "function") openMainMenu(); });
}

/* ---- additive menu injection, deliberately no one-shot latch ---- */
function _slInjectMenuButton() {
  try {
    if (document.getElementById("gnSaveLoad")) return;
    var col3 = document.querySelector(".gn-col:last-child");
    if (!col3) return;
    var btn = document.createElement("button");
    btn.className = "gn-btn";
    btn.id = "gnSaveLoad";
    btn.setAttribute("aria-label", "Save and Load - manage campaign save slots, import, export, and undo");
    btn.innerHTML =
      '<span class="gn-hl">SAVE &amp; LOAD CAMPAIGNS</span>' +
      '<span class="gn-deck">Slots, export/import, and one-turn undo for learner-friendly campaigns.</span>';
    btn.style.marginBottom = "10px";
    btn.addEventListener("click", function () { _slOpenManager(); });
    var before = col3.querySelector(".gn-classifieds") || col3.firstChild;
    if (before) col3.insertBefore(btn, before); else col3.appendChild(btn);
  } catch (e) {}
}
(function () {
  if (typeof MutationObserver === "undefined") return;
  function install() { _slInjectMenuButton(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
  try {
    var obs = new MutationObserver(function () { install(); });
    obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
