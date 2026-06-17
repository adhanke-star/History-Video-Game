/* ============================================================================
   src/tactical/T9-audio.js  —  WIRE THE AUDIO ENGINE INTO REAL-TIME BATTLES
   (Phase H4 · DEMO-POLISH)
   ----------------------------------------------------------------------------
   The frozen base.html already carries a complete WebAudio stack:
     * AUDIO_SCORE  — an adaptive synthesized score (musicStart "menu/march/
                      battle/camp"), 7 bugle calls (bugleCall), and an
                      intensity-scaled battle "din" bed (dinSet 0..1).
     * playSfx      — one-shots: volley / cannon / charge / bugle / rout / march.
     * ambientStart — a quiet looping wind bed.
     * AUDIO_WIRE   — _audEnterBattle / _audLeaveBattle / _audMenu glue.
   The CLASSIC hex battle wires all of this. The MODERN real-time tactical engine
   (T0..T8 — Bull Run / Fredericksburg / Antietam) wired NONE of it: the tactical
   battles played silent. This module connects them — no new synthesis, just the
   missing bridge — plus an accessible in-battle Audio panel (toggle / loudness /
   captions) and on-screen CAPTIONS for the audio cues.

   HOW IT STAYS BYTE-IDENTICAL (no edits to any existing module):
     * Probes drive the sim headlessly via fldStepN(); the LIVE loop fldStartLoop()
       and teardown fldExit() are NEVER called in a probe. We wrap ONLY those two
       (by ASSIGNMENT, not a function declaration -> no collision-gate entry, no
       hoist trap) and run a self-contained sampler interval. So none of this code
       runs during the deterministic sim probes -> every tactical baseline is
       byte-identical for free; nothing touches sim state; everything is guarded
       and swallows errors so audio can never crash the game.
     * All gating reads the SAME G.settings.sound / G.settings.music the existing
       menu Settings screen owns, so the two stay consistent.

   New settings (lazily defaulted; no _SAVE_VER bump needed):
     G.settings.battleLoud   "off" | "soft" | "full"   (default "full")  — din volume
     G.settings.battleSfx    boolean                    (default true)    — bugle/cannon cues
     G.settings.audioCaptions boolean                   (default false)   — on-screen cue captions
   ============================================================================ */

/* ---- lazy settings defaults (idempotent) -------------------------------- */
function _fldAudioInitSettings() {
  try {
    if (typeof G === "undefined") return;
    G.settings = G.settings || {};
    if (G.settings.battleLoud === undefined)    G.settings.battleLoud = "full";
    if (G.settings.battleSfx === undefined)     G.settings.battleSfx = true;
    if (G.settings.audioCaptions === undefined) G.settings.audioCaptions = false;
  } catch (e) {}
}

/* ---- module state ------------------------------------------------------- */
var _T9 = {
  timer: null,        // sampler interval handle
  prevMen: 0,         // total live men at the previous sample (for casualty-delta intensity)
  prevPCharge: 0,     // player-side charging-unit count at the previous sample
  lastCharge: 0,      // ms timestamp of the last charge bugle (throttle)
  lastPunch: 0,       // ms timestamp of the last cannon/volley punctuation (throttle)
  musicStarted: false,// has the battle bed been brought up this battle
  ended: false,       // has the end cue fired this battle
  capHide: null,      // caption auto-hide timeout
  panelOpen: false
};

function _fldAudioNow() {
  try { return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now(); }
  catch (e) { return 0; }
}
function _fldAudioOn() { try { return !!(G && G.settings && G.settings.sound); } catch (e) { return false; } }
function _fldAudioSfxOn() { try { return _fldAudioOn() && G.settings.battleSfx !== false; } catch (e) { return false; } }
function _fldAudioCapsOn() { try { return !!(G && G.settings && G.settings.audioCaptions); } catch (e) { return false; } }
function _fldAudioLoudScale() {
  try { var v = G.settings.battleLoud; return v === "off" ? 0 : (v === "soft" ? 0.5 : 1); }
  catch (e) { return 1; }
}
function _fldAudioPlayerSide() {
  try { if (typeof fldPlayerSide === "function") return fldPlayerSide(); } catch (e) {}
  try { return (__FIELD && __FIELD.playerSide) || "US"; } catch (e) { return "US"; }
}
function _fldAudioCall(fn, a) {
  try { if (typeof window !== "undefined" && typeof window[fn] === "function") window[fn](a); } catch (e) {}
}

/* ---- intensity sampled from the LIVE tactical field --------------------- */
function _fldAudioIntensity() {
  try {
    var U = __FIELD && __FIELD.units;
    if (!U || !U.length) return 0;
    var i, u, cur = 0, eng = 0, alive = 0;
    for (i = 0; i < U.length; i++) {
      u = U[i]; if (!u || !u.alive) continue;
      cur += (u.men || 0); alive++;
      if (u.state === "routing") continue;
      if (u.targetId || (u.order && u.order.type === "charge")) eng++;
    }
    var delta = (_T9.prevMen > 0) ? (_T9.prevMen - cur) : 0;
    if (delta < 0) delta = 0;
    _T9.prevMen = cur;
    var dPart = delta / 45; if (dPart > 1) dPart = 1;
    var ePart = alive ? eng / alive : 0;
    var v = 0.62 * dPart + 0.45 * ePart;
    return v > 1 ? 1 : (v < 0 ? 0 : v);
  } catch (e) { return 0; }
}

/* ---- on-screen captions for the audio cues (accessible, CVD/SR-safe) ----- */
function _fldAudioCaption(txt) {
  if (!_fldAudioCapsOn()) return;
  try {
    var root = __FIELD && __FIELD.root; if (!root) return;
    var el = document.getElementById("fldAudioCap");
    if (!el) {
      el = document.createElement("div");
      el.id = "fldAudioCap";
      el.setAttribute("aria-live", "polite");
      el.setAttribute("role", "status");
      var anim = (typeof fldReduceMotion === "function" && fldReduceMotion()) ? "" : "transition:opacity .3s;";
      el.style.cssText = "position:absolute;left:50%;bottom:66px;transform:translateX(-50%);" +
        "background:#0c0f14ee;border:1px solid #745e3f;border-radius:5px;padding:5px 14px;" +
        "font-size:13px;color:#f2e8d5;max-width:80%;text-align:center;pointer-events:none;z-index:40;opacity:0;" + anim;
      root.appendChild(el);
    }
    el.textContent = txt;
    el.style.opacity = "1";
    if (_T9.capHide) { clearTimeout(_T9.capHide); }
    _T9.capHide = setTimeout(function () { try { el.style.opacity = "0"; } catch (e) {} }, 2600);
  } catch (e) {}
}

/* ---- the sampler tick: drive the din + fire the event cues --------------- */
function _fldAudioTick() {
  try {
    if (typeof __FIELD === "undefined" || !__FIELD.launched) { _fldAudioStop(); return; }

    if (_fldAudioOn() && !_T9.musicStarted) {
      _fldAudioCall("scoreInit");
      _fldAudioCall("musicStart", "battle");
      if (typeof ambientStart === "function") { try { ambientStart(); } catch (e) {} }
      _T9.musicStarted = true;
    }

    var now = _fldAudioNow();
    var inBattle = (__FIELD.phase === "battle" && !__FIELD.paused);
    var intensity = inBattle ? _fldAudioIntensity() : 0;

    _fldAudioCall("dinSet", intensity * _fldAudioLoudScale());

    if (_fldAudioSfxOn() && inBattle) {
      var ps = _fldAudioPlayerSide();
      var U = __FIELD.units, i, u, pCharge = 0;
      for (i = 0; i < U.length; i++) {
        u = U[i];
        if (u && u.alive && u.side === ps && u.order && u.order.type === "charge") pCharge++;
      }
      if (pCharge > _T9.prevPCharge && (now - _T9.lastCharge) > 4800) {
        if (typeof bugleCall === "function") { try { bugleCall("charge"); } catch (e) {} }
        _fldAudioCall("playSfx", "charge");
        _fldAudioCaption("\uD83C\uDFBA Charge \u2014 forward at the double-quick!");
        _T9.lastCharge = now;
      }
      _T9.prevPCharge = pCharge;

      if (intensity > 0.28) {
        var gap = 900 + 1700 * (1 - intensity);
        if ((now - _T9.lastPunch) > gap) {
          _fldAudioCall("playSfx", Math.random() < 0.45 ? "cannon" : "volley");
          _T9.lastPunch = now;
        }
      }
    }

    if (__FIELD.phase === "over" && !_T9.ended) {
      _T9.ended = true;
      _fldAudioCall("dinSet", 0);
      if (_fldAudioSfxOn()) {
        var w = __FIELD.winner;
        var draw = (!w || w === "draw");
        if (!draw) {
          var win = (w === _fldAudioPlayerSide());
          if (typeof bugleCall === "function") { try { bugleCall(win ? "to_the_colors" : "taps"); } catch (e) {} }
          _fldAudioCall("playSfx", win ? "bugle" : "rout");
          _fldAudioCaption(win ? "\uD83C\uDFBA To the Colors \u2014 the field is held"
                               : "\uD83C\uDFBA Taps \u2014 the line is broken");
        }
      }
    }
  } catch (e) {
    try { _fldAudioStop(); } catch (e2) {}
  }
}

/* ---- start / stop the tactical-audio layer ------------------------------ */
function _fldAudioStart() {
  try {
    _fldAudioInitSettings();
    _T9.prevMen = 0; _T9.prevPCharge = 0; _T9.lastCharge = 0; _T9.lastPunch = 0;
    _T9.musicStarted = false; _T9.ended = false;
    if (_T9.timer) { clearInterval(_T9.timer); _T9.timer = null; }
    if (typeof setInterval !== "undefined") {
      _T9.timer = setInterval(_fldAudioTick, 700);
    }
    _fldAudioTick();
  } catch (e) {}
}
function _fldAudioStop() {
  try {
    if (_T9.timer) { clearInterval(_T9.timer); _T9.timer = null; }
    _T9.musicStarted = false; _T9.ended = false;
    if (typeof _audLeaveBattle === "function") { try { _audLeaveBattle(); } catch (e) {} }
    else { _fldAudioCall("dinStop"); _fldAudioCall("musicStop"); if (typeof ambientStop === "function") { try { ambientStop(); } catch (e) {} } }
  } catch (e) {}
}

/* ============================================================================
   THE IN-BATTLE AUDIO PANEL  (accessible: keyboard, focus-trap, ARIA, CVD-safe)
   ============================================================================ */
function _fldAudioApply(changed) {
  try {
    if (changed === "sound") {
      if (_fldAudioOn()) { _T9.musicStarted = false; _fldAudioTick(); }
      else { _fldAudioStop(); _fldAudioCall("dinStop"); }
    } else if (changed === "music") {
      if (_fldAudioOn() && G.settings.music !== false) { _T9.musicStarted = false; _fldAudioCall("musicStart", "battle"); _T9.musicStarted = true; }
      else { _fldAudioCall("musicStop"); }
    }
    if (typeof saveLocal === "function") { try { saveLocal(); } catch (e) {} }
  } catch (e) {}
}

function _fldAudioPanelRows() {
  function seg(label, hint, opts, cur, cb) {
    var h = '<div style="margin:0 0 12px;"><div style="font-size:13px;letter-spacing:.5px;margin-bottom:5px;">' + label +
            '</div><div role="group" aria-label="' + label + '" style="display:flex;gap:6px;flex-wrap:wrap;">';
    for (var i = 0; i < opts.length; i++) {
      var on = (opts[i][0] === cur);
      h += '<button data-acb="' + cb + '" data-acv="' + opts[i][0] + '" aria-pressed="' + on + '" ' +
           'style="cursor:pointer;font:inherit;font-size:12px;padding:5px 11px;border-radius:5px;border:1px solid ' +
           (on ? "#e8c84a" : "#745e3f") + ';background:' + (on ? "#3a2f17" : "#161b22") + ';color:#f2e8d5;">' +
           opts[i][1] + '</button>';
    }
    h += '</div><div style="font-size:11px;opacity:.7;margin-top:4px;">' + hint + '</div></div>';
    return h;
  }
  var s = G.settings;
  var onoff = [[true, "On"], [false, "Off"]];
  return seg("Sound (master)", "All music, bugles and battlefield sound.", onoff, !!s.sound, "sound") +
         seg("Music", "The adaptive martial score under the battle.", onoff, s.music !== false, "music") +
         seg("Battlefield loudness", "Volume of the cannon-and-musketry roar.", [["full", "Full"], ["soft", "Soft"], ["off", "Off"]], (s.battleLoud || "full"), "battleLoud") +
         seg("Bugle & cannon cues", "Charge calls, victory / taps, and cannon punctuation.", onoff, s.battleSfx !== false, "battleSfx") +
         seg("Captions", "On-screen text for each audio cue.", onoff, !!s.audioCaptions, "audioCaptions");
}

function _fldAudioClosePanel() {
  try {
    var ov = document.getElementById("fldAudioPanel");
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    _T9.panelOpen = false;
    var b = document.getElementById("fldBtnAudio");
    if (b) { try { b.focus(); } catch (e) {} }
  } catch (e) {}
}

function _fldAudioOpenPanel() {
  try {
    _fldAudioInitSettings();
    if (document.getElementById("fldAudioPanel")) return;
    var root = (__FIELD && __FIELD.root) || document.body;
    var ov = document.createElement("div");
    ov.id = "fldAudioPanel";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "Audio settings");
    ov.style.cssText = "position:absolute;inset:0;z-index:6000;display:flex;align-items:center;justify-content:center;background:#000b;";
    ov.innerHTML =
      '<div style="background:#10141a;border:1px solid #745e3f;border-radius:8px;padding:18px 20px;max-width:380px;width:88%;box-shadow:0 8px 40px #000c;">' +
        '<h2 style="margin:0 0 4px;font-size:19px;letter-spacing:1px;color:#e8c84a;">\u266A Audio</h2>' +
        '<p style="margin:0 0 14px;font-size:12px;opacity:.75;">Sound, music &amp; captions for the field.</p>' +
        _fldAudioPanelRows() +
        '<div style="text-align:right;margin-top:6px;"><button id="fldAudioDone" style="cursor:pointer;font:inherit;font-size:13px;padding:6px 16px;border-radius:5px;border:1px solid #e8c84a;background:#3a2f17;color:#f2e8d5;">Done</button></div>' +
      '</div>';
    root.appendChild(ov);
    _T9.panelOpen = true;

    var btns = ov.querySelectorAll("button[data-acb]");
    var i;
    for (i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        try {
          var key = this.getAttribute("data-acb");
          var raw = this.getAttribute("data-acv");
          var val = (raw === "true") ? true : (raw === "false") ? false : raw;
          G.settings[key] = val;
          _fldAudioApply(key);
          _fldAudioClosePanel(); _fldAudioOpenPanel();
        } catch (e) {}
      });
    }
    var done = document.getElementById("fldAudioDone");
    if (done) done.addEventListener("click", function () { _fldAudioClosePanel(); });

    ov.addEventListener("keydown", function (ev) {
      var k = ev.key;
      if (k === "Escape") { ev.preventDefault(); ev.stopPropagation(); _fldAudioClosePanel(); return; }
      ev.stopPropagation();
      if (k === "Tab") {
        var f = ov.querySelectorAll("button");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); try { last.focus(); } catch (e) {} }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); try { first.focus(); } catch (e) {} }
      }
    });
    setTimeout(function () { try { (ov.querySelector("button[data-acb]") || done).focus(); } catch (e) {} }, 20);
  } catch (e) {}
}

/* ---- inject the "Audio" control into the field control bar -------------- */
function _fldAudioInjectButton() {
  try {
    var bar = document.getElementById("fldBar");
    if (!bar || document.getElementById("fldBtnAudio")) return;
    var b = document.createElement("button");
    b.id = "fldBtnAudio";
    b.innerHTML = "\u266A Audio";
    b.title = "Audio settings \u2014 sound, music, loudness, captions";
    b.setAttribute("aria-label", "Open audio settings");
    b.style.cssText = "cursor:pointer;font:inherit;font-size:13px;padding:6px 10px;border-radius:5px;border:1px solid #745e3f;background:#161b22;color:#f2e8d5;";
    b.addEventListener("click", function () { _fldAudioOpenPanel(); });
    var exit = document.getElementById("fldBtnExit");
    if (exit && exit.parentNode === bar) bar.insertBefore(b, exit); else bar.appendChild(b);
  } catch (e) {}
}

/* ============================================================================
   INSTALL — wrap fldStartLoop / fldExit BY ASSIGNMENT (no function declaration,
   so the collision gate sees each engine name exactly once and there is no
   hoist trap). Idempotent; guarded.
   ============================================================================ */
(function _fldAudioInstall() {
  try {
    if (typeof fldStartLoop === "function" && !fldStartLoop._t9audio) {
      var _origStartLoop = fldStartLoop;
      fldStartLoop = function () {
        var r = _origStartLoop.apply(this, arguments);
        try { _fldAudioInjectButton(); _fldAudioStart(); } catch (e) {}
        return r;
      };
      fldStartLoop._t9audio = true;
    }
    if (typeof fldExit === "function" && !fldExit._t9audio) {
      var _origExit = fldExit;
      fldExit = function () {
        try { _fldAudioClosePanel(); _fldAudioStop(); } catch (e) {}
        return _origExit.apply(this, arguments);
      };
      fldExit._t9audio = true;
    }
    _fldAudioInitSettings();
  } catch (e) {}
})();
