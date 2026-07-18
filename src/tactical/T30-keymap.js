/* ===========================================================================
   src/tactical/T30-keymap.js — GEA-09 phase 2 (D449): THE ACTION-MAP SEAM.

   THE CONTRACT (docs/design/genre-elite-p1-contracts.md GEA-09 phase 2): one
   declarative table of action ids -> DEFAULT KEYS, carried VERBATIM from the
   shipped fldKey dispatch (T0), consumed through a single translate seam:
   fldKey computes `k = fldKeymapTranslate(k, e)` and its dispatch chain below
   stays byte-for-byte unchanged. A remapped key translates to its action's
   default key; a default key whose action has been remapped elsewhere goes
   INERT (the binding moved). No keymap stored -> identity translation ->
   today's behavior exactly.

   THE STORE: device-local `localStorage["cw_keymap_v1"]` = { v:1, map:
   { "<action-id>": "<key>" } } — NEVER the save envelope (`_SAVE_VER`
   untouched; no G.settings write). Sanitized on every read: unknown action
   ids DROPPED, malformed keys DROPPED, duplicate keys REFUSED (first wins,
   later duplicates dropped), reserved keys (Escape / Tab / Enter — modal
   exits and native activation) never bind. Writes go through fldKeymapSet
   (validate + collision-check against every EFFECTIVE binding) and
   fldKeymapReset (the reset button clears the store whole).

   Gamepad remains OUT of scope (the contract's own bound). Bare-name globals;
   no literal comment-closer inside this block.
   =========================================================================== */

/* The declarative table — ids -> the CURRENT default keys, verbatim from T0's
   fldKey chain (letters lowercase; the chain accepts both cases). Escape, Tab,
   and Enter are deliberately absent (reserved). */
var FLD_ACTIONS = [
  { id: "pause-play",       key: " ",    label: "Pause / resume" },
  { id: "speed-1",          key: "1",    label: "Speed 1×" },
  { id: "speed-2",          key: "2",    label: "Speed 2×" },
  { id: "speed-3",          key: "3",    label: "Speed 4×" },
  { id: "formation-line",   key: "l",    label: "Form line" },
  { id: "formation-column", key: "c",    label: "Form column" },
  { id: "charge",           key: "f",    label: "Charge" },
  { id: "hold",             key: "h",    label: "Hold position" },
  { id: "entrench",         key: "e",    label: "Entrench" },
  { id: "abatis",           key: "b",    label: "Lay abatis" },
  { id: "clear-obstacle",   key: "x",    label: "Clear obstacle" },
  { id: "pontoon",          key: "n",    label: "Lay pontoon" },
  { id: "toggle-fog",       key: "v",    label: "Toggle fog of war" },
  { id: "auto-pause",       key: "p",    label: "Toggle auto-pause" },
  { id: "settings-drawer",  key: "g",    label: "Settings drawer" },
  { id: "elevation-mode",   key: "r",    label: "Cycle elevation display" },
  { id: "camera-home",      key: "Home", label: "Camera overview (Shift = frame selected)" },
  { id: "select-all",       key: "a",    label: "Select all brigades" }
];
var _FLD_KEYMAP_RESERVED = { "Escape": 1, "Tab": 1, "Enter": 1 };
var _FLD_KEYMAP_STORE = "cw_keymap_v1";
var _fldKeymapCache;   // undefined = unread; null = no valid store; object = the sanitized map

function _fldKeymapDefaults() {
  var m = {};
  for (var i = 0; i < FLD_ACTIONS.length; i++) m[FLD_ACTIONS[i].id] = FLD_ACTIONS[i].key;
  return m;
}
function _fldKeymapValidKey(k) {
  if (typeof k !== "string" || !k) return false;
  if (_FLD_KEYMAP_RESERVED[k]) return false;
  return /^[a-z0-9]$/.test(k) || /^(Home|End|PageUp|PageDown|Insert|Delete|F[1-9]|F1[0-2]|ArrowUp|ArrowDown|ArrowLeft|ArrowRight| )$/.test(k);
}

/* The sanitized custom map, cached. Unknown action ids dropped; invalid keys
   dropped; duplicate custom keys refused (first wins); a custom key equal to a
   surviving DEFAULT binding of another action is refused too. */
function fldKeymapCustom() {
  if (_fldKeymapCache !== undefined) return _fldKeymapCache;
  _fldKeymapCache = null;
  try {
    if (typeof localStorage === "undefined") return _fldKeymapCache;
    var raw = localStorage.getItem(_FLD_KEYMAP_STORE);
    if (!raw) return _fldKeymapCache;
    var j = JSON.parse(raw);
    if (!j || j.v !== 1 || !j.map || typeof j.map !== "object" || Array.isArray(j.map)) return _fldKeymapCache;
    var defaults = _fldKeymapDefaults(), out = {}, used = {};
    var ids = Object.keys(j.map);
    for (var i = 0; i < ids.length && i < 64; i++) {
      var id = ids[i], k = j.map[id];
      if (!defaults.hasOwnProperty(id)) continue;         // unknown action id -> dropped
      if (!_fldKeymapValidKey(k)) continue;               // malformed/reserved key -> dropped
      var norm = (k.length === 1) ? k.toLowerCase() : k;
      if (used[norm]) continue;                           // duplicate custom key -> refused (first wins)
      out[id] = norm; used[norm] = 1;
    }
    // a custom key that collides with another action's SURVIVING default is refused.
    for (var id2 in out) {
      if (!out.hasOwnProperty(id2)) continue;
      for (var a in defaults) {
        if (!defaults.hasOwnProperty(a) || a === id2 || out.hasOwnProperty(a)) continue;
        if (defaults[a] === out[id2]) { delete out[id2]; break; }
      }
    }
    if (Object.keys(out).length) _fldKeymapCache = out;
  } catch (e) { _fldKeymapCache = null; }
  return _fldKeymapCache;
}

/* THE TRANSLATE SEAM (consumed by fldKey): a custom binding translates to its
   action's default key (which the verbatim dispatch consumes); a moved
   action's old default goes inert; everything else passes through unchanged. */
function fldKeymapTranslate(k, e) {
  try {
    var m = fldKeymapCustom(); if (!m) return k;
    var norm = (typeof k === "string" && k.length === 1) ? k.toLowerCase() : k;
    var defaults = _fldKeymapDefaults();
    for (var id in m) if (m.hasOwnProperty(id) && m[id] === norm) return defaults[id];
    for (var a in defaults) {
      if (defaults.hasOwnProperty(a) && defaults[a] === norm && m.hasOwnProperty(a)) return "\u0000";   // the moved default goes INERT: NUL matches no dispatch arm (never " ", the pause default)
    }
  } catch (e2) {}
  return k;
}

/* Write one binding: validate, collision-check against every EFFECTIVE binding
   (customs + surviving defaults), persist, refresh the cache. Returns
   { ok, err }. `key === null` clears the action back to its default. */
function fldKeymapSet(actionId, key) {
  try {
    var defaults = _fldKeymapDefaults();
    if (!defaults.hasOwnProperty(actionId)) return { ok: false, err: "Unknown action." };
    var cur = fldKeymapCustom() || {}, map = {};
    for (var id in cur) if (cur.hasOwnProperty(id)) map[id] = cur[id];
    if (key === null) { delete map[actionId]; }
    else {
      if (!_fldKeymapValidKey(key)) return { ok: false, err: "That key cannot be bound." };
      var norm = (key.length === 1) ? key.toLowerCase() : key;
      for (var id2 in map) if (map.hasOwnProperty(id2) && id2 !== actionId && map[id2] === norm) return { ok: false, err: "Already bound to another action." };
      for (var a in defaults) {
        if (!defaults.hasOwnProperty(a) || a === actionId || map.hasOwnProperty(a)) continue;
        if (defaults[a] === norm) return { ok: false, err: "That key is another action's default." };
      }
      map[actionId] = norm;
    }
    if (typeof localStorage !== "undefined") {
      if (Object.keys(map).length) localStorage.setItem(_FLD_KEYMAP_STORE, JSON.stringify({ v: 1, map: map }));
      else localStorage.removeItem(_FLD_KEYMAP_STORE);
    }
    _fldKeymapCache = undefined;   // re-read (and re-sanitize) on the next translate
    return { ok: true };
  } catch (e) { return { ok: false, err: "Could not save the binding." }; }
}
function fldKeymapReset() {
  try { if (typeof localStorage !== "undefined") localStorage.removeItem(_FLD_KEYMAP_STORE); } catch (e) {}
  _fldKeymapCache = undefined;
}

/* ---- the remapping panel (the T9 audio-panel idiom: dialog, Esc, focus trap,
   opener-focus restore via the bar button) ---- */
function _fldKeymapKeyName(k) { return k === " " ? "Space" : k; }
function fldOpenKeymapPanel() {
  try {
    if (document.getElementById("fldKeymapPanel")) return;
    var root = (typeof __FIELD !== "undefined" && __FIELD.root) || document.body;
    var m = fldKeymapCustom() || {};
    var rows = "";
    for (var i = 0; i < FLD_ACTIONS.length; i++) {
      var a = FLD_ACTIONS[i], eff = m.hasOwnProperty(a.id) ? m[a.id] : a.key, custom = m.hasOwnProperty(a.id);
      rows += '<div style="display:flex;align-items:center;gap:8px;margin:0 0 6px;">'
        + '<div style="flex:1 1 auto;font-size:12.5px;">' + a.label + '</div>'
        + '<button data-kmact="' + a.id + '" aria-label="' + a.label + ' — bound to ' + _fldKeymapKeyName(eff) + '. Press to rebind." '
        + 'style="cursor:pointer;font:inherit;font-size:12px;min-width:64px;min-height:30px;padding:4px 10px;border-radius:5px;border:1px solid ' + (custom ? "#e8c84a" : "#8a7258") + ';background:#161b22;color:#f2e8d5;">'
        + _fldKeymapKeyName(eff) + '</button>'
        + '</div>';
    }
    var ov = document.createElement("div");
    ov.id = "fldKeymapPanel";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "Keyboard controls");
    ov.style.cssText = "position:absolute;inset:0;z-index:6000;display:flex;align-items:center;justify-content:center;background:#000b;padding:14px;box-sizing:border-box;";
    ov.innerHTML =
      '<div style="background:#10141a;border:1px solid #745e3f;border-radius:8px;padding:18px 20px;max-width:420px;width:100%;max-height:calc(100% - 28px);overflow:auto;box-sizing:border-box;box-shadow:0 8px 40px #000c;">'
      + '<h2 style="margin:0 0 4px;font-size:19px;letter-spacing:1px;color:#e8c84a;">⌨ Controls</h2>'
      + '<p style="margin:0 0 10px;font-size:12px;opacity:.75;">Click a binding, then press the new key. Stored on this device only. Escape, Tab and Enter stay fixed.</p>'
      + '<div id="fldKeymapStatus" role="status" aria-live="polite" style="min-height:16px;font-size:11px;color:#e8c84a;margin-bottom:6px;"></div>'
      + rows
      + '<div style="display:flex;justify-content:space-between;margin-top:10px;">'
      + '<button id="fldKeymapReset" style="cursor:pointer;font:inherit;font-size:12px;min-height:32px;padding:5px 12px;border-radius:5px;border:1px solid #8a7258;background:#161b22;color:#f2e8d5;">Reset to defaults</button>'
      + '<button id="fldKeymapDone" style="cursor:pointer;font:inherit;font-size:13px;min-height:34px;padding:6px 16px;border-radius:5px;border:1px solid #e8c84a;background:#3a2f17;color:#f2e8d5;">Done</button>'
      + '</div></div>';
    root.appendChild(ov);
    var status = function (t) { var s = document.getElementById("fldKeymapStatus"); if (s) s.textContent = t; };
    var close = function () {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      var b = document.getElementById("fldBtnKeys"); if (b) { try { b.focus(); } catch (e) {} }
    };
    var rebind = function (btn) {
      var id = btn.getAttribute("data-kmact");
      status("Press the new key for this action (Escape cancels)…");
      var once = function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        document.removeEventListener("keydown", once, true);
        if (ev.key === "Escape") { status("Rebind cancelled."); return; }
        var r = fldKeymapSet(id, ev.key);
        if (r.ok) { close(); fldOpenKeymapPanel(); }
        else status(r.err || "Could not bind that key.");
      };
      document.addEventListener("keydown", once, true);
    };
    var btns = ov.querySelectorAll("button[data-kmact]");
    for (var j = 0; j < btns.length; j++) {
      (function (b) { b.addEventListener("click", function () { rebind(b); }); })(btns[j]);
    }
    var rst = document.getElementById("fldKeymapReset");
    if (rst) rst.addEventListener("click", function () { fldKeymapReset(); close(); fldOpenKeymapPanel(); });
    var done = document.getElementById("fldKeymapDone");
    if (done) done.addEventListener("click", close);
    ov.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); close(); return; }
      ev.stopPropagation();
      if (ev.key === "Tab") {
        var f = ov.querySelectorAll("button");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); try { last.focus(); } catch (e) {} }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); try { first.focus(); } catch (e) {} }
      }
    });
    setTimeout(function () { try { (ov.querySelector("button[data-kmact]") || done).focus(); } catch (e) {} }, 20);
  } catch (e) {}
}

/* Inject the "Keys" control into the field control bar (the T9 idiom). */
function fldKeymapInjectButton() {
  try {
    var bar = document.getElementById("fldBar");
    if (!bar || document.getElementById("fldBtnKeys")) return;
    var b = document.createElement("button");
    b.id = "fldBtnKeys";
    b.textContent = "⌨";
    b.setAttribute("aria-label", "Keyboard controls — view and rebind the battle hotkeys");
    b.title = "Keyboard controls";
    var anchor = document.getElementById("fldBtnAudio");
    b.className = anchor ? anchor.className : "";
    if (anchor && anchor.getAttribute("style")) b.setAttribute("style", anchor.getAttribute("style"));
    b.addEventListener("click", function () { fldOpenKeymapPanel(); });
    if (anchor && anchor.nextSibling) bar.insertBefore(b, anchor.nextSibling);
    else bar.appendChild(b);
  } catch (e) {}
}
