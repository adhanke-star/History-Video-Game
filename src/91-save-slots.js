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
function _slRulesetLabel(C) {
  try { return (typeof mayhemModeLabel === "function") ? mayhemModeLabel(C) : "Historical Campaign"; }
  catch (e) { return "Historical Campaign"; }
}
function _slSaveRulesetLabel(sv) { return _slRulesetLabel(sv && sv.campaign); }
/* E50 (D353): deep own-"hasOwnProperty" scan of a save's campaign envelope.
   A shadow anywhere inside it would crash a downstream callable-form iterator
   (the D323 raw.ids Transfer sink in 35-command.js is the verified case), so
   every accept lane — autosave loadLocal/applySave (105-save-guard.js), slot
   read, import, undo — rejects the whole payload. Iterative walk (explicit
   stack), cycle-safe via a seen-Set, arrays included (JSON cannot put a named
   key on an array, but applySave accepts any object). A legitimate save never
   carries one at any depth, so legit saves stay byte-identical on every lane.
   Returns true = tampered payload, reject. */
function _slCampaignPoisoned(root) {
  if (!root || typeof root !== "object") return false;
  var own = Object.prototype.hasOwnProperty;
  var stack = [root], seen = (typeof Set === "function") ? new Set() : null, guard = 0;
  while (stack.length) {
    var node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (seen) { if (seen.has(node)) continue; seen.add(node); }
    else if (++guard > 1000000) return true;   // no-Set fallback: fail closed on a runaway/cyclic payload
    if (own.call(node, "hasOwnProperty")) return true;
    for (var k in node) {
      if (!own.call(node, k)) continue;
      var v = node[k];
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return false;
}
function _slValidSave(sv) {
  if (!sv || typeof sv !== "object" || Array.isArray(sv)) return false;
  if (sv.ver !== _SAVE_VER) return false;
  if (!sv.settings || typeof sv.settings !== "object" || Array.isArray(sv.settings)) return false;
  if (_slOwn(sv.settings, "hasOwnProperty")) return false;
  if (sv.campaign != null && (typeof sv.campaign !== "object" || Array.isArray(sv.campaign))) return false;
  // E50 (D353): reject a deep own-"hasOwnProperty" anywhere in the campaign envelope.
  if (_slCampaignPoisoned(sv.campaign)) return false;
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

/* ---- ARC 9 session-bookmark pointers (metadata only; named slots stay authoritative) ---- */
function _slBookmarkRunId(v) {
  if (typeof v !== "string") return "";
  return /^[A-Za-z0-9][A-Za-z0-9._:@|/-]{0,95}$/.test(v) ? v : "";
}
function _slBookmarkSide(C) { return C && (C.side === "US" || C.side === "CS") ? C.side : ""; }
function _slBookmarkRuleset(C) {
  var raw = C && C.ruleset, keys;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  try { keys = Object.keys(raw).sort(); } catch (e) { return ""; }
  if (keys.length !== 2 || keys[0] !== "id" || keys[1] !== "version" || raw.version !== 1) return "";
  return raw.id === "historical" || raw.id === "mayhem" ? raw.id : "";
}
function _slCanonicalJSON(v) {
  if (v === null || typeof v === "string" || typeof v === "boolean" || typeof v === "number") {
    var scalar = JSON.stringify(v);
    return typeof scalar === "string" ? scalar : null;
  }
  if (Array.isArray(v)) {
    var items = [];
    for (var i = 0; i < v.length; i++) {
      var item = _slCanonicalJSON(v[i]);
      if (item === null) return null;
      items.push(item);
    }
    return "[" + items.join(",") + "]";
  }
  if (!v || typeof v !== "object") return null;
  var keys;
  try { keys = Object.keys(v).sort(); } catch (e) { return null; }
  var pairs = [];
  for (var j = 0; j < keys.length; j++) {
    var value = _slCanonicalJSON(v[keys[j]]);
    if (value === null) return null;
    pairs.push(JSON.stringify(keys[j]) + ":" + value);
  }
  return "{" + pairs.join(",") + "}";
}
function _slHex32(v) {
  var hex = (v >>> 0).toString(16);
  return "00000000".slice(hex.length) + hex;
}
function _slBookmarkFingerprint(sv) {
  if (!_slValidSave(sv) || typeof hashStr !== "function") return "";
  var copy = _slClone(sv);
  if (!_slValidSave(copy)) return "";
  if (_slOwn(copy, "slotName")) delete copy.slotName;
  if (_slOwn(copy, "when")) delete copy.when;
  var canonical = _slCanonicalJSON(copy);
  if (canonical === null) return "";
  return "v1:" + canonical.length + ":" + _slHex32(hashStr("arc9-a|" + canonical)) + ":" +
    _slHex32(hashStr("arc9-b|" + canonical));
}
function _slBookmarkTarget(i, sv) {
  if (typeof i !== "number" || !isFinite(i) || Math.floor(i) !== i || i < 0 || i >= _SL_MAX) return null;
  if (!_slValidSave(sv) || _slBookmarkListFromSettings(sv.settings) === null || !sv.campaign || sv.campaign.iron) return null;
  var runId = _slBookmarkRunId(sv.campaign.runId);
  var side = _slBookmarkSide(sv.campaign);
  var ruleset = _slBookmarkRuleset(sv.campaign);
  var fingerprint = _slBookmarkFingerprint(sv);
  if (!runId || !side || !ruleset || !fingerprint) return null;
  return { slot:i, runId:runId, side:side, ruleset:ruleset, fingerprint:fingerprint, save:sv };
}
function _slBookmarkLive() {
  var C = (typeof G !== "undefined" && G) ? G.campaign : null;
  if (!C || C.iron) return null;
  var runId = _slBookmarkRunId(C.runId), side = _slBookmarkSide(C), ruleset = _slBookmarkRuleset(C);
  return runId && side && ruleset ? { runId:runId, side:side, ruleset:ruleset } : null;
}
function _slBookmarkSameAuthority(a, b) {
  return !!(a && b && a.runId === b.runId && a.side === b.side && a.ruleset === b.ruleset);
}
function _slBookmarkPointer(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  var keys;
  try { keys = Object.keys(raw).sort(); } catch (e) { return null; }
  if (keys.join("|") !== "fingerprint|label|ruleset|runId|side|slot") return null;
  var label = _slCleanLabel(raw.label);
  if (!label || label !== raw.label || typeof raw.runId !== "string" || _slBookmarkRunId(raw.runId) !== raw.runId ||
      (raw.side !== "US" && raw.side !== "CS") ||
      (raw.ruleset !== "historical" && raw.ruleset !== "mayhem") ||
      typeof raw.slot !== "number" || !isFinite(raw.slot) || Math.floor(raw.slot) !== raw.slot ||
      raw.slot < 0 || raw.slot >= _SL_MAX ||
      typeof raw.fingerprint !== "string" || !/^v1:\d+:[0-9a-f]{8}:[0-9a-f]{8}$/.test(raw.fingerprint)) return null;
  return { label:label, slot:raw.slot, runId:raw.runId, side:raw.side,
    ruleset:raw.ruleset, fingerprint:raw.fingerprint };
}
function _slBookmarkListFromSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  if (!_slOwn(settings, "arc9SessionBookmarks")) return [];
  var raw = settings.arc9SessionBookmarks;
  if (!Array.isArray(raw) || raw.length > _SL_MAX) return null;
  var clean = [], slots = {};
  for (var i = 0; i < raw.length; i++) {
    var pointer = _slBookmarkPointer(raw[i]);
    if (!pointer || slots[pointer.slot]) return null;
    slots[pointer.slot] = true;
    clean.push(pointer);
  }
  return clean;
}
function _slBookmarkList() {
  var settings = (typeof G !== "undefined" && G) ? G.settings : null;
  return _slBookmarkListFromSettings(settings);
}
function _slBookmarkCreationTarget(i) {
  if (_slBookmarkList() === null) return null;
  var target = _slBookmarkTarget(i, _slRead(i));
  return _slBookmarkSameAuthority(_slBookmarkLive(), target) ? target : null;
}
function _slBookmarkCreate(i, label) {
  var list = _slBookmarkList();
  var target = list === null ? null : _slBookmarkCreationTarget(i);
  if (!target) return { ok:false, reason:"This slot is not a valid bookmark target for the current campaign." };
  label = _slCleanLabel(label) || _slCleanLabel(target.save.slotName || "") || ("Slot " + (i + 1) + " bookmark");
  var pointer = { label:label, slot:i, runId:target.runId, side:target.side,
    ruleset:target.ruleset, fingerprint:target.fingerprint };
  var next = [], replaced = false;
  for (var j = 0; j < list.length; j++) {
    if (list[j].slot === i) { next.push(pointer); replaced = true; }
    else next.push(list[j]);
  }
  if (!replaced) {
    if (next.length >= _SL_MAX) return { ok:false, reason:"The three session-bookmark positions are already in use." };
    next.push(pointer);
  }
  if (JSON.stringify(next) === JSON.stringify(list)) return { ok:true, changed:false, pointer:pointer };
  G.settings.arc9SessionBookmarks = next;
  if (typeof saveLocal === "function") saveLocal();
  return { ok:true, changed:true, pointer:pointer };
}
function _slBookmarkRemove(position) {
  var list = _slBookmarkList();
  if (!list || typeof position !== "number" || Math.floor(position) !== position || position < 0 || position >= list.length) return false;
  list.splice(position, 1);
  if (list.length) G.settings.arc9SessionBookmarks = list;
  else delete G.settings.arc9SessionBookmarks;
  if (typeof saveLocal === "function") saveLocal();
  return true;
}
function _slBookmarkMatches(pointer, sv) {
  pointer = _slBookmarkPointer(pointer);
  var target = pointer ? _slBookmarkTarget(pointer.slot, sv) : null;
  var live = _slBookmarkLive();
  if (!pointer || !target || !_slBookmarkSameAuthority(live, target)) return false;
  if (pointer.runId !== target.runId || pointer.side !== target.side || pointer.ruleset !== target.ruleset) return false;
  if (pointer.fingerprint !== target.fingerprint) return false; // ARC9_BIND_S4:FINGERPRINT_EQUALITY
  return true;
}
function _slIronmanNamedSaveBlocked(sv) {
  return !!(sv && sv.campaign && sv.campaign.iron);
}
function _slWrite(i, sv) {
  try {
    if (!_slValidSave(sv)) return false;
    if (_slIronmanNamedSaveBlocked(sv)) return false;
    localStorage.setItem(_slKey(i), JSON.stringify(sv));
    return true;
  } catch (e) { return false; }
}
function _slDelete(i) { try { localStorage.removeItem(_slKey(i)); } catch (e) {} }
function _slInvalidateRunSlots(runId) {
  runId = String(runId == null ? "" : runId).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:@|/-]{0,95}$/.test(runId)) return 0;
  var removed = 0;
  for (var i = 0; i < _SL_MAX; i++) {
    var sv = _slRead(i);
    if (sv && sv.campaign && sv.campaign.runId === runId) { _slDelete(i); removed++; }
  }
  return removed;
}
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
function _slLoadSlot(i, what, guard) {
  var sv = _slRead(i);
  if (!sv) return { ok:false, reason:"Slot is empty or incompatible." };
  if (typeof guard === "function" && !guard(sv)) return { ok:false, reason:"Bookmark target changed or no longer belongs to this campaign." };
  if (!_slConfirmReplaceLive(what)) return { ok:false, cancelled:true, reason:"Load cancelled." };
  // Re-read after the blocking confirmation: another tab may have replaced the slot while it was open.
  sv = _slRead(i);
  if (!sv) return { ok:false, reason:"Slot is empty or incompatible." };
  if (typeof guard === "function" && !guard(sv)) return { ok:false, reason:"Bookmark target changed or no longer belongs to this campaign." };
  var copy = _slClone(sv);
  if (!_slValidSave(copy)) return { ok:false, reason:"Slot is empty or incompatible." };
  applySave(copy);
  if (typeof G !== "undefined" && G && G.campaign && typeof warCareerInit === "function") warCareerInit(G.campaign);
  _slClearUndo();
  if (typeof saveLocal === "function") saveLocal();
  return { ok:true, save:sv };
}
function _slBookmarkOpen(position) {
  var list = _slBookmarkList();
  if (!list || typeof position !== "number" || Math.floor(position) !== position || position < 0 || position >= list.length) {
    return { ok:false, reason:"Session bookmark metadata is unavailable." };
  }
  var pointer = list[position];
  var result = _slLoadSlot(pointer.slot, 'Opening bookmark "' + pointer.label + '"', function (sv) {
    return _slBookmarkMatches(pointer, sv);
  });
  if (result.ok) result.pointer = pointer;
  return result;
}
function _slSetSlotName(i, name) {
  var sv = _slRead(i);
  if (!sv) return false;
  sv.slotName = _slCleanLabel(name);
  // Metadata-only rename preserves the validated payload already in this slot.
  // It is deliberately narrower than _slWrite, whose Ironman copy law has no
  // options/bypass surface.
  try { localStorage.setItem(_slKey(i), JSON.stringify(sv)); return true; }
  catch (e) { return false; }
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
  return { label: label, side: side, turn: turn, date: date, when: when, hasCampaign: !!c,
    rulesetLabel:_slRulesetLabel(c) };
}
function _slDefaultSlotName() {
  var C = (typeof G !== "undefined") ? G.campaign : null;
  if (!C) return "Quick Save";
  var side = (C.side === "CS") ? "Confederate" : "Union";
  var turn = (C.president && typeof C.president.turn === "number") ? C.president.turn : 0;
  return side + " - " + _slRulesetLabel(C) + " - Turn " + turn;
}

/* ---- export / import helpers ---- */
function _slExportString(sv) {
  return JSON.stringify(sv || serializeSave(), null, 2);
}
function _slImportPreview(text) {
  try {
    var sv = JSON.parse(String(text || ""));
    if (!_slValidSave(sv)) return { ok:false, label:"Invalid save" };
    return { ok:true, label:_slSaveRulesetLabel(sv) };
  } catch (e) { return { ok:false, label:"Invalid save" }; }
}
function _slApplyImportedSave(sv) {
  if (!_slValidSave(sv)) return { ok: false, reason: "Invalid save file." };
  var copy = _slClone(sv);
  if (!_slValidSave(copy)) return { ok: false, reason: "Invalid save file." };
  applySave(copy);
  if (typeof G !== "undefined" && G && G.campaign && typeof warCareerInit === "function") warCareerInit(G.campaign);
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
    fname += "_" + (_slSaveRulesetLabel(sv).indexOf("Mayhem") === 0 ? "mayhem" : "historical") + "_save.json";
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
  if (typeof G !== "undefined" && G && G.campaign && typeof warCareerInit === "function") warCareerInit(G.campaign);
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
  var bookmarkList = _slBookmarkList();
  var bookmarkAllowed = bookmarkList !== null && !!_slBookmarkCreationTarget(i);
  var bookmarked = false;
  if (bookmarkList) for (var bi = 0; bi < bookmarkList.length; bi++) if (bookmarkList[bi].slot === i) bookmarked = true;
  var ironBlocked = false;
  try { ironBlocked = !!(typeof G !== "undefined" && G && G.campaign && G.campaign.iron); } catch (e0) {}
  var title = stale ? "Incompatible save" : "Empty";
  var sub = stale
    ? "This slot holds data from an older or damaged save format. Save and Load are disabled to protect it; Delete clears it."
    : "No saved campaign in this slot.";
  var value = "";
  if (m) {
    title = m.label || (m.side + " - Turn " + m.turn);
    if (m.date) title += " (" + m.date + ")";
    sub = "Mode: " + m.rulesetLabel + " · Saved: " + (m.when || "unknown");
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
    +     '<button class="upg" id="slSave' + i + '" style="padding:6px 10px;font-size:12px" aria-label="Save current campaign to slot ' + (i + 1) + (ironBlocked ? ' — unavailable during Ironman' : '') + '"' + ((stale || ironBlocked) ? ' disabled aria-disabled="true"' : "") + '>Save</button>'
    +     '<button class="upg" id="slRename' + i + '" style="padding:6px 10px;font-size:12px" aria-label="Rename save slot ' + (i + 1) + '"' + (m ? "" : " disabled") + '>Rename</button>'
    +     '<button class="upg" id="slLoad' + i + '" style="padding:6px 10px;font-size:12px" aria-label="Load save slot ' + (i + 1) + '"' + (m ? "" : " disabled") + '>Load</button>'
    +     '<button class="upg" type="button" id="slBookmark' + i + '" style="padding:6px 10px;font-size:12px" aria-describedby="slBookmarkHelp" aria-label="' + (bookmarked ? "Update Bookmark" : "Bookmark") + ' for save slot ' + (i + 1) + '"' + (bookmarkAllowed ? "" : " disabled aria-disabled=\"true\"") + '>' + (bookmarked ? "Update Bookmark" : "Bookmark") + '</button>'
    +     '<button class="upg" id="slDel' + i + '" style="padding:6px 10px;font-size:12px;opacity:.75" aria-label="Delete save slot ' + (i + 1) + '"' + ((m || stale) ? "" : " disabled") + '>Delete</button>'
    +   '</div>'
    + '</div>';
}
function _slBookmarksHTML(status) {
  var list = _slBookmarkList();
  var html = '<section id="slBookmarks" aria-labelledby="slBookmarkTitle" style="border:1px solid #8c724e;border-radius:6px;padding:10px 12px;margin:12px 0;background:rgba(0,0,0,.12)">'
    + '<h2 id="slBookmarkTitle" style="font-size:15px;margin:0 0 4px;color:#f0d98a">Session Bookmarks</h2>'
    + '<p id="slBookmarkHelp" style="font-size:11.5px;line-height:1.45;opacity:.78;margin:0 0 8px">Bookmarks are labels over this campaign\'s existing named slots. Opening one rechecks the live slot; it never stores another campaign copy.</p>';
  if (list === null) {
    html += '<p style="font-size:11.5px;margin:6px 0">Bookmark metadata is malformed. It has not been repaired, and named saves remain unchanged.</p>';
  } else if (!list.length) {
    html += '<p style="font-size:11.5px;margin:6px 0">No bookmarks yet. Use Bookmark beside a valid slot from this campaign.</p>';
  } else {
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:7px">'
        + '<span style="min-width:0;flex:1;font-size:12px;overflow-wrap:anywhere"><b>' + _slEsc(p.label) + '</b> · Slot ' + (p.slot + 1) + ' · ' + _slEsc(p.side === "CS" ? "Confederate" : "Union") + ' · ' + _slEsc(p.ruleset === "mayhem" ? "Mayhem" : "Historical") + '</span>'
        + '<button class="upg" type="button" id="slBookmarkOpen' + i + '" aria-label="Open session bookmark ' + _slEsc(p.label) + '" style="padding:5px 9px;font-size:12px">Open</button>'
        + '<button class="upg" type="button" id="slBookmarkRemove' + i + '" aria-label="Remove session bookmark ' + _slEsc(p.label) + '" style="padding:5px 9px;font-size:12px;opacity:.78">Remove</button>'
        + '</div>';
    }
  }
  html += '<div id="slBookmarkStatus" role="status" aria-atomic="true" style="min-height:1.4em;font-size:11.5px;margin-top:8px;opacity:.82">' + _slEsc(status || "") + '</div></section>';
  return html;
}
function _slUndoHTML() {
  var snap = _slReadUndo();
  if (_slUndoAvailable()) {
    var d = "";
    try { d = snap.when ? new Date(snap.when).toLocaleString() : ""; } catch (e) {}
    var mode = _slSaveRulesetLabel(snap.save);
    return '<div style="border:1px solid #8c724e;border-radius:6px;padding:10px 12px;margin:12px 0;background:rgba(0,0,0,.12)">'
      + '<div style="font-weight:bold;color:#f0d98a">Undo last strategic turn</div>'
      + '<div style="font-size:11.5px;opacity:.75;margin:2px 0 8px">Available for Standard/Recruit terms; disabled for Hardened or Ironman campaigns. Mode: ' + _slEsc(mode) + ' · Snapshot: ' + _slEsc(d || "last resolved turn") + '.</div>'
      + '<button class="upg" id="slUndo" aria-label="Undo the last resolved strategic turn" style="padding:6px 12px">Undo Last Turn</button>'
      + '</div>';
  }
  var why = snap ? "Undo is disabled for this campaign's current terms." : "No undo snapshot is available yet.";
  return '<div style="font-size:11.5px;opacity:.72;margin:10px 0">' + why + '</div>';
}
function _slOpenManager(bookmarkStatus, focusId) {
  var rows = "";
  for (var i = 0; i < _SL_MAX; i++) rows += _slRowHTML(i);
  var html =
    '<h1 class="title-xl">Save &amp; Load</h1>' +
    '<p class="title-sub">Campaign Slots - keep separate campaigns for each commander</p>' +
    ((typeof G !== "undefined" && G && G.campaign) ? '<div id="slCurrentRuleset" role="status" style="margin:8px 0;padding:7px 10px;border:1px solid #8c724e;border-radius:5px;font-size:12px">Current mode: <b>' + _slEsc(_slRulesetLabel(G.campaign)) + '</b></div>' : '') +
    ((typeof G !== "undefined" && G && G.campaign && G.campaign.iron) ? '<div id="slIronmanLaw" role="status" style="border:1px solid #b8863b;border-radius:5px;padding:8px 10px;margin:8px 0;font-size:12px">Ironman uses its live campaign save only. New named saves are disabled; existing slots may still be loaded, renamed, exported, or deleted.</div>' : '') +
    '<hr class="rule">' +
    rows +
    _slBookmarksHTML(bookmarkStatus) +
    _slUndoHTML() +
    '<hr class="rule" style="margin-top:14px">' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">' +
      '<button class="upg" id="slExport" style="padding:6px 14px">Export to File</button>' +
      '<button class="upg" id="slImport" style="padding:6px 14px">Import from File</button>' +
      '<button class="upg" id="slBack" style="padding:6px 14px;opacity:.75">Back to Menu</button>' +
    '</div>' +
    '<label for="slImportJson" style="display:block;font-size:12px;opacity:.8;margin-top:8px">Paste save JSON</label>' +
    '<textarea id="slImportJson" rows="3" aria-label="Paste exported save JSON" aria-describedby="slImportPreview" style="box-sizing:border-box;width:100%;margin-top:4px;padding:8px;border:1px solid #8c724e;border-radius:5px;background:#161009;color:#f2e8d5;font-family:ui-monospace,Menlo,monospace;font-size:11px"></textarea>' +
    '<div id="slImportPreview" role="status" style="font-size:11.5px;opacity:.8;margin-top:5px">Paste an exported save to preview its campaign mode.</div>' +
    '<button class="upg" id="slImportPaste" style="margin-top:8px;padding:6px 14px">Import Pasted JSON</button>';
  openSheet(html);
  _slWire();
  if (focusId) {
    var focusTarget = document.getElementById(focusId);
    if (focusTarget && !focusTarget.disabled) focusTarget.focus();
  }
}
function _slBookmarkSay(message) {
  var status = document.getElementById("slBookmarkStatus");
  if (status) status.textContent = String(message || "");
}
function _slWire() {
  for (var i = 0; i < _SL_MAX; i++) {
    (function (idx) {
      var loadBtn = document.getElementById("slLoad" + idx);
      var saveBtn = document.getElementById("slSave" + idx);
      var delBtn = document.getElementById("slDel" + idx);
      var renBtn = document.getElementById("slRename" + idx);
      var bookmarkBtn = document.getElementById("slBookmark" + idx);
      var nameEl = document.getElementById("slName" + idx);

      if (loadBtn) loadBtn.addEventListener("click", function () {
        var loaded = _slLoadSlot(idx, "Loading slot " + (idx + 1));
        if (loaded.ok) {
          if (typeof toast === "function") toast("Loaded slot " + (idx + 1) + ".");
          if (typeof openMainMenu === "function") openMainMenu();
        } else if (!loaded.cancelled && typeof toast === "function") toast(loaded.reason || "Slot is empty.");
      });
      if (saveBtn) saveBtn.addEventListener("click", function () {
        var liveSave = serializeSave();
        if (_slIronmanNamedSaveBlocked(liveSave)) {
          if (typeof toast === "function") toast("Named saves are disabled during Ironman.", 2600);
          return;
        }
        // S31 (D234): overwriting a FILLED slot loses that save permanently (no undo lane covers it) — confirm.
        var existing = _slMeta(idx);
        if (existing) {
          var exLabel = existing.label || (existing.side + " - Turn " + existing.turn);
          var okOw = true;
          try { okOw = window.confirm('Overwrite "' + exLabel + '" in slot ' + (idx + 1) + "? The existing save will be lost."); } catch (e) {}
          if (!okOw) return;
        }
        var sv = liveSave;
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
      if (bookmarkBtn) bookmarkBtn.addEventListener("click", function () {
        var made = _slBookmarkCreate(idx, nameEl ? nameEl.value : "");
        if (!made.ok) { _slBookmarkSay(made.reason); return; }
        var message = made.changed ? ("Bookmark saved for slot " + (idx + 1) + ".") : ("Bookmark for slot " + (idx + 1) + " is already current.");
        if (typeof toast === "function") toast(message);
        _slOpenManager(message, "slBookmark" + idx);
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
  var bookmarks = _slBookmarkList();
  if (bookmarks) for (var b = 0; b < bookmarks.length; b++) {
    (function (position, pointer) {
      var openBtn = document.getElementById("slBookmarkOpen" + position);
      var removeBtn = document.getElementById("slBookmarkRemove" + position);
      if (openBtn) openBtn.addEventListener("click", function () {
        var opened = _slBookmarkOpen(position);
        if (!opened.ok) { _slBookmarkSay(opened.reason); return; }
        if (typeof toast === "function") toast('Opened bookmark "' + pointer.label + '".');
        if (typeof openMainMenu === "function") openMainMenu();
      });
      if (removeBtn) removeBtn.addEventListener("click", function () {
        if (!_slBookmarkRemove(position)) { _slBookmarkSay("Bookmark removal failed closed."); return; }
        var message = 'Removed bookmark "' + pointer.label + '".';
        if (typeof toast === "function") toast(message);
        _slOpenManager(message, "slBookmark" + pointer.slot);
      });
    })(b, bookmarks[b]);
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
  var previewInput = document.getElementById("slImportJson");
  var previewStatus = document.getElementById("slImportPreview");
  if (previewInput && previewStatus) previewInput.addEventListener("input", function () {
    var p = _slImportPreview(previewInput.value);
    previewStatus.textContent = p.ok ? ("Import mode: " + p.label) : "This is not a valid current save.";
  });
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
