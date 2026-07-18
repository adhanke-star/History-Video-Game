/* ============================================================================
   T9-audio.js — WIRE THE (ALREADY-BUILT) AUDIO ENGINE INTO THE REAL-TIME BATTLES
   (Phase H4 · DEMO-POLISH, run k 2026-06-16)
   ----------------------------------------------------------------------------
   The frozen base.html already carries a complete, vetted WebAudio stack:
     * AUDIO_SCORE  — an adaptive synthesized score (musicStart "menu/march/
                      battle/camp"), 7 bugle calls (bugleCall), and an
                      intensity-scaled battle "din" bed (dinSet 0..1).
     * playSfx      — one-shots: volley / cannon / charge / bugle / rout / march.
     * ambientStart — a quiet looping wind bed.
     * AUDIO_WIRE   — _audEnterBattle / _audLeaveBattle / _audMenu glue.
   The CLASSIC hex battle wires all of this. The MODERN real-time tactical engine
   (T0..T8 — Bull Run / Fredericksburg / Antietam, the demo centerpiece) wired
   NONE of it: the tactical battles played silent (menu music lingering, no din,
   no bugles). This module connects them — no new synthesis, just the missing
   bridge — plus an accessible in-battle Audio panel (toggle / loudness /
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
    // GEA-09 phase 1 (D448): the AUDIO-BUS contract — four independent 0-100 bus volumes plus a
    // mono-downmix flag, seeded lazily exactly like battleLoud above (the shipped T9 settings
    // precedent). Defaults preserve today's output EXACTLY (every scale resolves to 1).
    if (G.settings.audio === undefined) G.settings.audio = { critical: 100, ambient: 100, ui: 100, narration: 100, mono: false };
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

/* ---- GEA-09 phase 1 (D448): the audio-bus layer ------------------------- */
/* Bus ids: critical (bugle/cannon/outcome cues) · ambient (the din + the T19
   bed) · ui (reserved: base-internal clicks run inside frozen closures and
   stay untouched = audible) · narration (forward-declared for a future spoken
   source). An absent/unknown bus or a missing G.settings.audio resolves to
   scale 1 — FAIL-OPEN TO AUDIBLE, never silent, and byte-equivalent to the
   pre-D448 output. THE RECORDED BOUND: each one-shot cue's DSP gain lives in a
   frozen build/base.html closure, so a one-shot's bus volume gates at zero
   (0 = silent, otherwise audible at its authored level); TRUE multiplication
   rides the src-owned levers — the dinSet intensity argument and the T19
   ambience master (both ambient), plus any future narration source. */
function fldAudioBusScale(bus) {
  try {
    var a = (typeof G !== "undefined") && G.settings && G.settings.audio;
    if (!a || typeof a !== "object") return 1;
    var v = a[bus];
    if (typeof v !== "number" || !isFinite(v)) return 1;
    return Math.max(0, Math.min(100, v)) / 100;
  } catch (e) { return 1; }
}
function fldAudioMono() {
  try { var a = G.settings && G.settings.audio; return !!(a && a.mono === true); } catch (e) { return false; }
}
function fldAudioBusPlay(bus, kind, name) {
  try {
    if (fldAudioBusScale(bus) <= 0) return;   // the zero-gate (see the recorded bound above)
    if (kind === "bugle") { if (typeof bugleCall === "function") { try { bugleCall(name); } catch (e) {} } }
    else _fldAudioCall("playSfx", name);
  } catch (e) {}
}

/* ---- intensity sampled from the LIVE tactical field --------------------- */
/* Mirrors base.html's scoreSampleBattle (which reads the Classic G.battle) but
   reads __FIELD.units directly: recent men lost (bloodshed) dominates, the
   engaged fraction sustains the bed. Pure read; never mutates sim state.        */
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
    if (delta < 0) delta = 0;            // reinforcements / a fresh phase cast -> not bloodshed
    _T9.prevMen = cur;
    var dPart = delta / 45; if (dPart > 1) dPart = 1;     // saturate ~45 men lost / sample
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
      el.style.cssText = "position:absolute;left:50%;bottom:76px;transform:translateX(-50%);" +
        "box-sizing:border-box;background:rgba(12,15,20,.94);border:1px solid #b9975f;border-radius:6px;padding:7px 14px;" +
        "font-size:13px;line-height:1.35;color:#f8ecd8;max-width:min(86vw,720px);min-width:min(280px,82vw);" +
        "text-align:center;box-shadow:0 6px 22px #000a;pointer-events:none;z-index:40;opacity:0;" + anim;
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

    // bring the battle bed up the moment sound is on (also catches a mid-battle un-mute)
    if (_fldAudioOn() && !_T9.musicStarted) {
      _fldAudioCall("scoreInit");
      _fldAudioCall("musicStart", "battle");
      // GEA-09: the base wind bed is tagged ambient — a zero ambient bus skips it (its gain
      // lives in a frozen closure; the recorded zero-gate bound), any other value is audible.
      if (typeof ambientStart === "function" && fldAudioBusScale("ambient") > 0) { try { ambientStart(); } catch (e) {} }
      _T9.musicStarted = true;
    }

    var now = _fldAudioNow();
    var inBattle = (__FIELD.phase === "battle" && !__FIELD.paused);
    var intensity = inBattle ? _fldAudioIntensity() : 0;

    // adaptive din (scaled by the player's "battlefield loudness" volume × the ambient bus —
    // GEA-09: a TRUE multiplication, the src-owned lever)
    _fldAudioCall("dinSet", intensity * _fldAudioLoudScale() * fldAudioBusScale("ambient"));

    // ----- event cues (bugle / cannon), gated + throttled -----
    if (_fldAudioSfxOn() && inBattle) {
      var ps = _fldAudioPlayerSide();
      // a fresh PLAYER charge -> the charge call
      var U = __FIELD.units, i, u, pCharge = 0;
      for (i = 0; i < U.length; i++) {
        u = U[i];
        if (u && u.alive && u.side === ps && u.order && u.order.type === "charge") pCharge++;
      }
      if (pCharge > _T9.prevPCharge && (now - _T9.lastCharge) > 4800) {
        fldAudioBusPlay("critical", "bugle", "charge");   // GEA-09: tagged critical
        fldAudioBusPlay("critical", "sfx", "charge");
        _fldAudioCaption("🎺 Charge — forward at the double-quick!");
        _T9.lastCharge = now;
      }
      _T9.prevPCharge = pCharge;

      // punctuate the roar with discrete cannon / volley, denser as the fight heats up
      if (intensity > 0.28) {
        var gap = 900 + 1700 * (1 - intensity);   // ~0.9s when fierce, ~2.6s when light
        if ((now - _T9.lastPunch) > gap) {
          fldAudioBusPlay("critical", "sfx", Math.random() < 0.45 ? "cannon" : "volley");   // GEA-09: tagged critical
          _T9.lastPunch = now;
        }
      }
    }

    // ----- the field is decided: the end cue (player's perspective) -----
    if (__FIELD.phase === "over" && !_T9.ended) {
      _T9.ended = true;
      _fldAudioCall("dinSet", 0);                 // let the roar fall away under the call
      if (_fldAudioSfxOn()) {
        var w = __FIELD.winner;
        var draw = (!w || w === "draw");
        if (!draw) {
          var win = (w === _fldAudioPlayerSide());
          fldAudioBusPlay("critical", "bugle", win ? "to_the_colors" : "taps");   // GEA-09: tagged critical
          fldAudioBusPlay("critical", "sfx", win ? "bugle" : "rout");
          _fldAudioCaption(win ? "🎺 To the Colors — the field is held"
                               : "🎺 Taps — the line is broken");
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
    // reset per-battle state
    _T9.prevMen = 0; _T9.prevPCharge = 0; _T9.lastCharge = 0; _T9.lastPunch = 0;
    _T9.musicStarted = false; _T9.ended = false;
    if (_T9.timer) { clearInterval(_T9.timer); _T9.timer = null; }
    if (typeof setInterval !== "undefined") {
      _T9.timer = setInterval(_fldAudioTick, 700);
    }
    // prime immediately so the bed comes up without a 0.7s gap
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
   ----------------------------------------------------------------------------
   Opened by a "Audio" button this module injects into the field control bar.
   Toggles the SAME G.settings flags the menu Settings screen owns. Self-
   contained DOM + listeners; removed on close; never touches an engine fn.
   ============================================================================ */
function _fldAudioApply(changed) {
  // re-apply the live state after a settings change
  try {
    if (changed === "sound") {
      if (_fldAudioOn()) { _T9.musicStarted = false; _fldAudioTick(); }   // un-mute: bring the bed back
      else { _fldAudioStop(); _fldAudioCall("dinStop"); }                 // mute: silence everything now
    } else if (changed === "music") {
      if (_fldAudioOn() && G.settings.music !== false) { _T9.musicStarted = false; _fldAudioCall("musicStart", "battle"); _T9.musicStarted = true; }
      else { _fldAudioCall("musicStop"); }
    }
    if (typeof saveLocal === "function") { try { saveLocal(); } catch (e) {} }
  } catch (e) {}
}

function _fldAudioPanelRows() {
  function seg(label, hint, opts, cur, cb, cbVal) {
    // opts: [[value,text],...]; cur = current value; CVD-safe (text + aria-pressed, never colour-alone)
    var h = '<div style="margin:0 0 12px;"><div style="font-size:13px;letter-spacing:.5px;margin-bottom:5px;">' + label +
            '</div><div role="group" aria-label="' + label + '" style="display:flex;gap:6px;flex-wrap:wrap;">';
    for (var i = 0; i < opts.length; i++) {
      var on = (opts[i][0] === cur);
      h += '<button data-acb="' + cb + '" data-acv="' + opts[i][0] + '" aria-pressed="' + on + '" ' +
           'style="cursor:pointer;font:inherit;font-size:12px;min-height:32px;padding:5px 11px;border-radius:5px;border:1px solid ' +
           (on ? "#e8c84a" : "#8a7258") + ';background:' + (on ? "#3a2f17" : "#161b22") + ';color:#f2e8d5;">' +
           opts[i][1] + '</button>';
    }
    h += '</div><div style="font-size:11px;opacity:.7;margin-top:4px;">' + hint + '</div></div>';
    return h;
  }
  var s = G.settings;
  var onoff = [[true, "On"], [false, "Off"]];
  // GEA-09 phase 1 (D448): one labeled 0-100 slider per bus + the mono toggle.
  function slider(label, hint, bus) {
    var a = s.audio || {}, v = (typeof a[bus] === "number" && isFinite(a[bus])) ? Math.max(0, Math.min(100, a[bus])) : 100;
    return '<div style="margin:0 0 12px;"><label for="fldAudioBus_' + bus + '" style="font-size:13px;letter-spacing:.5px;display:block;margin-bottom:5px;">' + label +
      ' <span id="fldAudioBusVal_' + bus + '" style="opacity:.7;">' + v + '</span></label>' +
      '<input type="range" id="fldAudioBus_' + bus + '" data-abus="' + bus + '" min="0" max="100" step="5" value="' + v + '" ' +
      'style="width:100%;accent-color:#e8c84a;" aria-label="' + label + ' volume, 0 to 100">' +
      '<div style="font-size:11px;opacity:.7;margin-top:2px;">' + hint + '</div></div>';
  }
  return seg("Sound (master)", "All music, bugles and battlefield sound.", onoff, !!s.sound, "sound") +
         seg("Music", "The adaptive martial score under the battle.", onoff, s.music !== false, "music") +
         seg("Battlefield loudness", "Volume of the cannon-and-musketry roar.", [["full", "Full"], ["soft", "Soft"], ["off", "Off"]], (s.battleLoud || "full"), "battleLoud") +
         seg("Bugle & cannon cues", "Charge calls, victory / taps, and cannon punctuation.", onoff, s.battleSfx !== false, "battleSfx") +
         seg("Captions", "On-screen text for each audio cue.", onoff, !!s.audioCaptions, "audioCaptions") +
         slider("Critical cues", "Bugle calls, cannon punctuation, and outcome cues. 0 silences them.", "critical") +
         slider("Ambience", "The battle din and the wind-and-musketry bed.", "ambient") +
         slider("Interface", "Reserved for interface sounds.", "ui") +
         slider("Narration", "Reserved for future spoken narration.", "narration") +
         seg("Mono downmix", "Collapse the stereo battlefield image to center — nothing is silenced.", onoff, !!(s.audio && s.audio.mono), "audioMono");
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
    ov.style.cssText = "position:absolute;inset:0;z-index:6000;display:flex;align-items:center;justify-content:center;background:#000b;padding:14px;box-sizing:border-box;";
    ov.innerHTML =
      '<div id="fldAudioPanelCard" style="background:#10141a;border:1px solid #745e3f;border-radius:8px;padding:18px 20px;max-width:420px;width:100%;max-height:calc(100% - 28px);overflow:auto;box-sizing:border-box;box-shadow:0 8px 40px #000c;">' +
        '<h2 style="margin:0 0 4px;font-size:19px;letter-spacing:1px;color:#e8c84a;">♪ Audio</h2>' +
        '<p style="margin:0 0 14px;font-size:12px;opacity:.75;">Sound, music & captions for the field.</p>' +
        _fldAudioPanelRows() +
        '<div style="text-align:right;margin-top:6px;"><button id="fldAudioDone" style="cursor:pointer;font:inherit;font-size:13px;min-height:34px;padding:6px 16px;border-radius:5px;border:1px solid #e8c84a;background:#3a2f17;color:#f2e8d5;">Done</button></div>' +
      '</div>';
    root.appendChild(ov);
    _T9.panelOpen = true;

    // wire the segmented toggles
    var btns = ov.querySelectorAll("button[data-acb]");
    var i;
    for (i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        try {
          var key = this.getAttribute("data-acb");
          var raw = this.getAttribute("data-acv");
          var val = (raw === "true") ? true : (raw === "false") ? false : raw;
          // GEA-09 (D448): the mono toggle lives inside G.settings.audio, never a top-level key.
          if (key === "audioMono") { _fldAudioInitSettings(); G.settings.audio.mono = (val === true); }
          else G.settings[key] = val;
          _fldAudioApply(key);
          // re-render the rows in place to reflect the new pressed state
          var host = ov.querySelector("[data-acrows]") || this.closest("div[role=dialog] > div") || ov.firstChild;
          // simplest robust refresh: rebuild the whole panel body
          _fldAudioClosePanel(); _fldAudioOpenPanel();
        } catch (e) {}
      });
    }
    // GEA-09 (D448): wire the four bus sliders — live value readout; the din/T19 levers pick
    // the new scale up on their next tick (no re-render needed, so the slider keeps focus).
    var sliders = ov.querySelectorAll("input[data-abus]");
    for (i = 0; i < sliders.length; i++) {
      sliders[i].addEventListener("input", function () {
        try {
          _fldAudioInitSettings();
          var bus = this.getAttribute("data-abus");
          var v = Math.max(0, Math.min(100, Math.round(+this.value || 0)));
          G.settings.audio[bus] = v;
          var lab = document.getElementById("fldAudioBusVal_" + bus);
          if (lab) lab.textContent = String(v);
          if (typeof saveLocal === "function") { try { saveLocal(); } catch (e) {} }
        } catch (e) {}
      });
    }
    var done = document.getElementById("fldAudioDone");
    if (done) done.addEventListener("click", function () { _fldAudioClosePanel(); });

    // keyboard: Esc closes (stopPropagation so it never bubbles to fldKey -> fldExit);
    // a simple focus-trap across the dialog's focusables.
    ov.addEventListener("keydown", function (ev) {
      var k = ev.key;
      if (k === "Escape") { ev.preventDefault(); ev.stopPropagation(); _fldAudioClosePanel(); return; }
      ev.stopPropagation();   // keep battle hotkeys from firing behind the modal
      if (k === "Tab") {
        var f = ov.querySelectorAll("button, input");   // GEA-09 (D448): the bus sliders join the focus trap
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); try { last.focus(); } catch (e) {} }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); try { first.focus(); } catch (e) {} }
      }
    });
    // focus the first control
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
    b.innerHTML = "♪ Audio";
    b.title = "Audio settings — sound, music, loudness, captions";
    b.setAttribute("aria-label", "Open audio settings");
    // match the existing tactical control-bar button styling
    b.style.cssText = "cursor:pointer;font:inherit;font-size:13px;padding:6px 10px;border-radius:5px;border:1px solid #8a7258;background:#161b22;color:#f2e8d5;";
    b.addEventListener("click", function () { _fldAudioOpenPanel(); });
    // place it just before the Exit button if present, else append
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
        try { _fldAudioInjectButton(); if (typeof fldKeymapInjectButton === "function") fldKeymapInjectButton(); _fldAudioStart(); } catch (e) {}   // GEA-09 phase 2 (D449): the Keys button rides the same bar hook (guarded)
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
