/* ===========================================================================
   src/tactical/T31-replay.js — GEA-13 (D450): THE DETERMINISTIC REPLAY CAPSULE.

   THE CONTRACT (docs/design/genre-elite-p1-contracts.md GEA-13): a versioned,
   SECRET-FREE capsule { capsuleVersion, scenarioId, seed, settings subset,
   playerSide, ordered order-log } captured during a tactical battle behind a
   DEFAULT-OFF recording flag; playback drives the SAME engine with input
   injection and asserts END-STATE HASH EQUALITY before anything is called a
   "replay". Divergence = HONEST FAILURE ("this build cannot replay that
   battle"), never a silent approximation. Export rides the GEA-02 plain-text /
   Blob-download idiom; capsules are device-local FILES — the save envelope
   never moves (save-shape stays green; no localStorage, no G.settings write
   beyond reading the flag).

   DETERMINISM GROUND: the T0 loop is a FIXED-TIMESTEP accumulator
   (FLD.FIXED_DT = 0.05, 20 Hz) over a seeded LCG — same launch seed + the same
   player inputs at the same TICK INDEXES reproduce the same battle. The log
   records each player input at its tick; playback re-steps fixed dt and
   injects through the SAME engine mutators.

   ZERO COST WHEN OFF: the ONLY hook on the launch path is one guarded call in
   fldLaunchSandbox; with the flag off (the default) it disarms and returns —
   no wrapper enters any call path and the sim tick is never touched.

   RECORDED v1 BOUNDS: standalone battles only (a campaign battle's strategic
   conditioning is external state — recording refuses, honestly); the import
   surface is the fldReplayVerify API + the end-screen export block (a picker
   UI is a future slice). Wrappers use the D425 by-assignment idiom with marker
   propagation and restore byte-identically on disarm. Bare-name globals; no
   literal comment-closer inside this block.
   =========================================================================== */

var FLD_REPLAY_VERSION = 1;
var FLD_REPLAY = { armed: false, cap: null, orig: null, wired: false };
var _RP_FNS = ["fldOrderMove", "fldSelCharge", "fldSelHold", "fldSetFormation", "fldToggleFog",
  "fldSelEntrench", "fldSelAbatis", "fldSelClearObstacle", "fldSelPontoon"];
var _RP_IDS = { fldOrderMove: "move", fldSelCharge: "charge", fldSelHold: "hold", fldSetFormation: "formation",
  fldToggleFog: "fog", fldSelEntrench: "entrench", fldSelAbatis: "abatis", fldSelClearObstacle: "clear", fldSelPontoon: "pontoon" };

function _rpFlagOn() { try { return !!(G && G.settings && G.settings.replayRec === true); } catch (e) { return false; } }
function _rpTick() { try { return Math.round((__FIELD.t || 0) / (FLD.FIXED_DT || 0.05)); } catch (e) { return 0; } }
function _rpSel() { try { return (__FIELD.sel || []).slice(0, 64); } catch (e) { return []; } }

/* djb2 over the canonical end-state string — phase/winner/clock + every unit's
   rounded id/alive/men/position/morale/state (+ the phased score when present). */
function fldReplayHash() {
  try {
    var parts = [__FIELD.phase, __FIELD.winner || "", __FIELD.winBy || "", Math.round((__FIELD.t || 0) * 20)];
    if (__FIELD.phaseScore) parts.push(JSON.stringify(__FIELD.phaseScore));
    var us = (__FIELD.units || []).slice().sort(function (a, b) { return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0); });
    for (var i = 0; i < us.length; i++) {
      var u = us[i];
      parts.push(u.id, u.alive ? 1 : 0, Math.round(u.men || 0), Math.round(u.x || 0), Math.round(u.z || 0), Math.round(u.morale || 0), u.state || "");
    }
    var s = parts.join("|"), h = 5381;
    for (var j = 0; j < s.length; j++) h = ((h * 33) ^ s.charCodeAt(j)) >>> 0;
    return ("00000000" + h.toString(16)).slice(-8);
  } catch (e) { return ""; }
}

/* ---- arm / disarm (the launch seam calls this; wrappers only exist while armed) ---- */
function fldReplayOnLaunch(opts) {
  try {
    fldReplayDisarm();
    if (!_rpFlagOn()) return;                                   // DEFAULT OFF -> zero cost
    if (__FIELD.campaignCtx) return;                            // v1 bound: standalone only
    FLD_REPLAY.cap = {
      capsuleVersion: FLD_REPLAY_VERSION,
      scenarioId: __FIELD.scenario || "sandbox",
      seed: ((opts && opts.seed) || 1) >>> 0,
      playerSide: (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US",
      settings: { fog: !!__FIELD.fog, officersOff: !!__FIELD._officersOff, logisticsOff: !!__FIELD._logisticsOff, armsOff: !!__FIELD._armsOff, autoBoth: !!__FIELD.autoBoth },
      ticks: 0, endHash: "", log: []
    };
    _rpInstall();
    FLD_REPLAY.armed = true;
    _rpWireOnce();
  } catch (e) {}
}
function fldReplayDisarm() {
  try {
    if (FLD_REPLAY.orig) {
      for (var name in FLD_REPLAY.orig) {
        if (FLD_REPLAY.orig.hasOwnProperty(name)) window[name] = FLD_REPLAY.orig[name];   // byte-identical restore
      }
    }
  } catch (e) {}
  FLD_REPLAY.orig = null; FLD_REPLAY.armed = false;
}
function _rpLog(fnId, args, withSel) {
  try {
    var cap = FLD_REPLAY.cap;
    if (!FLD_REPLAY.armed || !cap || cap.log.length >= 4096) return;
    if (typeof __FIELD === "undefined" || __FIELD.phase !== "battle") return;
    var ev = { k: _rpTick(), fn: fnId, a: args || [] };
    if (withSel) ev.sel = _rpSel();
    cap.log.push(ev);
  } catch (e) {}
}
function _rpInstall() {
  FLD_REPLAY.orig = {};
  for (var i = 0; i < _RP_FNS.length; i++) {
    (function (name) {
      var orig = (typeof window !== "undefined") ? window[name] : undefined;
      if (typeof orig !== "function") return;
      FLD_REPLAY.orig[name] = orig;
      var wrapper;
      if (name === "fldOrderMove") {
        wrapper = function (u, tx, tz, tface) { _rpLog("move", [u && u.id, tx, tz, tface], false); return orig.apply(this, arguments); };
      } else if (name === "fldSetFormation") {
        wrapper = function (f) { _rpLog("formation", [f], true); return orig.apply(this, arguments); };
      } else {
        wrapper = function () { _rpLog(_RP_IDS[name], [], name !== "fldToggleFog"); return orig.apply(this, arguments); };
      }
      for (var p in orig) { if (orig.hasOwnProperty(p)) { try { wrapper[p] = orig[p]; } catch (e) {} } }   // D425 marker propagation
      wrapper._rpWrapped = true;
      window[name] = wrapper;
    })(_RP_FNS[i]);
  }
}

/* Finalize the capture at battle end (idempotent; also called by the end-screen render). */
function fldReplayFinalize() {
  try {
    var cap = FLD_REPLAY.cap;
    if (!FLD_REPLAY.armed || !cap || __FIELD.phase !== "over" || cap.endHash) return cap;
    cap.ticks = _rpTick();
    cap.endHash = fldReplayHash();
    return cap;
  } catch (e) { return null; }
}
function fldReplayCapture() { return (FLD_REPLAY.armed && FLD_REPLAY.cap && FLD_REPLAY.cap.endHash) ? FLD_REPLAY.cap : null; }

/* ---- the end-screen export block (the fldOnOver scNote seam; "" when unarmed
   — the default-off picker/end screen is byte-identical) ---- */
function fldReplayEndHtml() {
  try {
    var cap = fldReplayFinalize();
    if (!cap) return "";
    return '<div id="fldReplayEnd" style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:10px 13px;margin-bottom:16px;">'
      + '<div style="font-size:12px;letter-spacing:2px;color:#d8c87a;font-weight:bold;">REPLAY CAPSULE</div>'
      + '<div style="font-size:12px;opacity:.8;margin-top:3px;">' + cap.log.length + ' orders · ' + cap.ticks + ' ticks · hash ' + cap.endHash + '. Verified on import before anything is called a replay.</div>'
      + '<button id="fldReplayExport" type="button" style="margin-top:7px;background:#1c1610;color:#e9dcc0;border:1px solid #736241;border-radius:4px;padding:6px 12px;font:12.5px Georgia,serif;cursor:pointer;">Download Replay (.json)</button>'
      + '</div>';
  } catch (e) { return ""; }
}
function _rpWireOnce() {
  if (FLD_REPLAY.wired || typeof document === "undefined" || !document.addEventListener) return;
  FLD_REPLAY.wired = true;
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || t.id !== "fldReplayExport") return;
    try {
      var cap = fldReplayCapture(); if (!cap) return;
      var blob = new Blob([JSON.stringify(cap)], { type: "application/json" });   // the GEA-02 download idiom
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "civil-war-replay-" + (cap.scenarioId || "battle") + "-" + cap.seed + ".json";
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); } catch (e2) {} }, 500);
    } catch (e3) {}
  });
}

/* ---- validation (closed shape; UNKNOWN VERSION FAILS CLOSED) ---- */
function _rpValidCapsule(cap) {
  try {
    if (!cap || typeof cap !== "object" || Array.isArray(cap)) return { ok: false, err: "Not a replay capsule." };
    var keys = Object.keys(cap).sort().join(",");
    if (keys !== "capsuleVersion,endHash,log,playerSide,scenarioId,seed,settings,ticks") return { ok: false, err: "Capsule shape not recognized." };
    if (cap.capsuleVersion !== FLD_REPLAY_VERSION) return { ok: false, err: "Unknown capsule version (" + String(cap.capsuleVersion) + ") — refused." };
    if (typeof cap.scenarioId !== "string" || !cap.scenarioId) return { ok: false, err: "Capsule scenario malformed." };
    if (typeof cap.seed !== "number" || !isFinite(cap.seed)) return { ok: false, err: "Capsule seed malformed." };
    if (cap.playerSide !== "US" && cap.playerSide !== "CS") return { ok: false, err: "Capsule side malformed." };
    var s = cap.settings;
    if (!s || Object.keys(s).sort().join(",") !== "armsOff,autoBoth,fog,logisticsOff,officersOff") return { ok: false, err: "Capsule settings malformed." };
    if (!Number.isInteger(cap.ticks) || cap.ticks < 0 || cap.ticks > 200000) return { ok: false, err: "Capsule tick count malformed." };
    if (typeof cap.endHash !== "string" || !/^[0-9a-f]{8}$/.test(cap.endHash)) return { ok: false, err: "Capsule hash malformed." };
    if (!Array.isArray(cap.log) || cap.log.length > 4096) return { ok: false, err: "Capsule log malformed." };
    var okFn = { move: 1, charge: 1, hold: 1, formation: 1, fog: 1, entrench: 1, abatis: 1, clear: 1, pontoon: 1 };
    var last = -1;
    for (var i = 0; i < cap.log.length; i++) {
      var ev = cap.log[i];
      if (!ev || !Number.isInteger(ev.k) || ev.k < 0 || ev.k < last || !okFn[ev.fn]) return { ok: false, err: "Capsule log entry " + i + " malformed." };
      last = ev.k;
    }
    return { ok: true };
  } catch (e) { return { ok: false, err: "Capsule unreadable." }; }
}

/* ---- playback: the SAME engine, input injection, hash equality or HONEST failure ---- */
function _rpInject(ev) {
  try {
    if (ev.sel) __FIELD.sel = ev.sel.slice();
    if (ev.fn === "move") {
      var u = null;
      for (var i = 0; i < __FIELD.units.length; i++) if (__FIELD.units[i].id === ev.a[0]) { u = __FIELD.units[i]; break; }
      if (u && typeof fldOrderMove === "function") fldOrderMove(u, ev.a[1], ev.a[2], ev.a[3]);
    }
    else if (ev.fn === "charge" && typeof fldSelCharge === "function") fldSelCharge();
    else if (ev.fn === "hold" && typeof fldSelHold === "function") fldSelHold();
    else if (ev.fn === "formation" && typeof fldSetFormation === "function") fldSetFormation(ev.a[0]);
    else if (ev.fn === "fog" && typeof fldToggleFog === "function") fldToggleFog();
    else if (ev.fn === "entrench" && typeof fldSelEntrench === "function") fldSelEntrench();
    else if (ev.fn === "abatis" && typeof fldSelAbatis === "function") fldSelAbatis();
    else if (ev.fn === "clear" && typeof fldSelClearObstacle === "function") fldSelClearObstacle();
    else if (ev.fn === "pontoon" && typeof fldSelPontoon === "function") fldSelPontoon();
  } catch (e) {}
}
function fldReplayVerify(input) {
  var cap = input;
  if (typeof input === "string") {
    try { cap = JSON.parse(input); } catch (e) { return { ok: false, replay: false, message: "Not a readable replay capsule." }; }
  }
  var v = _rpValidCapsule(cap);
  if (!v.ok) return { ok: false, replay: false, message: v.err };
  try {
    fldReplayDisarm();   // never record a playback
    G.campaign = null;
    fldLaunchSandbox({ renderer: "none", scenario: cap.scenarioId, playerSide: cap.playerSide, seed: cap.seed, autoBoth: cap.settings.autoBoth });
    __FIELD.fog = !!cap.settings.fog;
    __FIELD._officersOff = !!cap.settings.officersOff;
    __FIELD._logisticsOff = !!cap.settings.logisticsOff;
    __FIELD._armsOff = !!cap.settings.armsOff;
    __FIELD.phase = "battle"; __FIELD.paused = false;
    var byTick = {}, i;
    for (i = 0; i < cap.log.length; i++) (byTick[cap.log[i].k] = byTick[cap.log[i].k] || []).push(cap.log[i]);
    var dt = (FLD.FIXED_DT || 0.05);
    for (i = 0; i < cap.ticks; i++) {
      var evs = byTick[i];
      if (evs) for (var j = 0; j < evs.length; j++) _rpInject(evs[j]);
      if (__FIELD.phase !== "battle") break;
      fldSimStep(dt);
    }
    var actual = fldReplayHash();
    var match = (actual === cap.endHash);
    try { fldExit(true); } catch (e2) {}
    return { ok: true, replay: match, expected: cap.endHash, actual: actual,
      message: match ? "Replay verified — the battle reproduced exactly."
                     : "This build cannot replay that battle — the simulation diverged. (An honest failure, never an approximation.)" };
  } catch (e) {
    try { fldExit(true); } catch (e3) {}
    return { ok: false, replay: false, message: "Playback failed: " + String(e && e.message || e) };
  }
}
