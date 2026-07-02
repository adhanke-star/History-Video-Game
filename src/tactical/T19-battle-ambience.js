/* ===========================================================================
   T19 — BATTLE AMBIENCE  (Phase H · H4 — "make it come to life" / audio deepening)

   A DEEPER battle soundscape layered UNDER the existing T9-audio din + cues:
   the "one continuous roar" contemporaries described — the rolling roll of
   massed musketry, the ground-shaking bass of a great cannonade, and the
   individual reports of the firing brigades placed in the STEREO field where
   the smoke actually rises (the T16 gunsmoke pairing). Where a brigade is
   hidden by the fog of war it makes no located sound — sound never betrays a
   position the player has not scouted, exactly as the smoke never does.

   This DOES NOT replace T9 (the din/SFX bridge, D77/D91 — "continue audio
   incrementally"): it is a new, OPT-IN layer that sits beneath it. Default OFF.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   touches NO existing file. WRAPS fld3dRender / fld2dDraw / fldExit (the T16/T17/
   T18 render seam) + T9's _fldAudioPanelRows (to add an accessible toggle row) by
   ASSIGNMENT. Reads firing state READ-ONLY off the live units; OWNS a separate
   AudioContext (the AUDIO_SCORE / SOUND convention — one context per subsystem);
   never writes a sim field, never calls fldRng, never bumps _SAVE_VER. So the sim
   tick and every battle baseline are unchanged — the only diff is sound. The
   SCHEDULING DECISIONS (intensity, fog-gate, pan) are recorded in FLDAMB whether
   or not a real audio device exists, so the layer is fully testable headless.

   ACCESSIBILITY / PERF: gated OFF by default (G.settings.battleAmbience !== true),
   fully suppressed under reduceMotion (the calm default — the T16 convention),
   scaled by the existing battleLoud volume AND capped low so it never overwhelms
   the cues it sits under, captioned through T9's accessible caption, and node-pool
   bounded + disposed on exit for the Intel UHD-617 floor. Located reports defer
   until the AudioContext is actually running (no first-gesture stampede), and the
   bed self-silences on the 'over' screen (no idle-graph drain). A mid-battle mute
   via T9's panel is honoured on the next render frame (~16ms — T19 has no _fldAudioApply
   hook by design; the one-frame lag is benign and intentional).
   =========================================================================== */

var FLDAMB = {
  /* ---- config ---- */
  TICK_MS: 90,            // decision cadence (throttle the per-frame render hook)
  GAP_MS: 120,            // global min gap between located reports
  COOL_MUSKET: 560,       // per-unit cooldown (ms) so one brigade doesn't machine-gun
  COOL_CANNON: 900,
  CAP_NODES: 48, CAP_LO: 24,  // transient report-node ceiling per render tier
  MASTER: 0.20,           // absolute ambience ceiling — sits UNDER the din (0.26 cap)
  WASH_PEAK: 0.60,        // rolling-fire wash level at full intensity (fraction of master)
  RUM_PEAK: 0.55,         // cannonade sub-bass level when artillery rages
  /* ---- live state (reset per battle / disposed on exit) ---- */
  ctx: null, master: null,
  washSrc: null, washGain: null, washTrem: null, washLfo: null, washLfoG: null, washBuilt: false,
  rumSrc: null, rumGain: null, rumBuilt: false,
  bag: [],                // transient SOURCE voices (pooled + trimmed; the cap counts THESE — the audible density)
  pans: [],               // transient StereoPanner nodes (disposed, but NOT cap-counted — a panner is not a voice)
  cool: null,             // per-unit cooldown map (null-proto — inherited-key safe)
  fieldRef: null,
  started: false, silenced: false, captioned: false,
  last: 0, lastReport: 0, loudApplied: -1,
  /* ---- counters / probe surface ---- */
  reportsScheduled: 0, fogGated: 0, lastPan: 0, intensity: 0, artCount: 0, errN: 0
};

/* ---- wall-clock (audio drifts on real time, never on sim ticks) ---- */
function fldAmbNow() {
  try { return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now(); }
  catch (e) { return 0; }
}

/* ---- gates ---- */
function fldAmbActive() {
  try {
    if (typeof G === "undefined" || !G || !G.settings) return false;
    if (!G.settings.sound) return false;                       // master mute
    if (G.settings.battleAmbience !== true) return false;      // DEFAULT-OFF opt-in
    if (typeof fldReduceMotion === "function" && fldReduceMotion()) return false;  // calm under reduce-motion
    return true;
  } catch (e) { return false; }
}
function fldAmbLoud() {
  try { var v = G.settings.battleLoud; return v === "off" ? 0 : (v === "soft" ? 0.5 : 1); }
  catch (e) { return 1; }
}

/* ---- battle intensity (read-only; mirrors the T9/scoreSampleBattle heuristic) ---- */
function fldAmbIntensity(F) {
  try {
    var U = F.units; if (!U || !U.length) return 0;
    var i, u, cur = 0, eng = 0, alive = 0;
    for (i = 0; i < U.length; i++) {
      u = U[i]; if (!u || !u.alive) continue;
      cur += (u.men || 0); alive++;
      if (u.state === "routing") continue;
      if (u.targetId || (u.order && u.order.type === "charge")) eng++;
    }
    var delta = (FLDAMB._prevMen > 0) ? (FLDAMB._prevMen - cur) : 0;
    if (delta < 0) delta = 0;                 // reinforcement / fresh phase — not bloodshed
    FLDAMB._prevMen = cur;
    var dPart = delta / 45; if (dPart > 1) dPart = 1;
    var ePart = alive ? eng / alive : 0;
    var v = 0.6 * dPart + 0.45 * ePart;
    return v > 1 ? 1 : (v < 0 ? 0 : v);
  } catch (e) { return 0; }
}

/* ---- count of brigades currently working their guns (drives the cannonade bed) ---- */
function fldAmbArtCount(F, inBattle) {
  if (!inBattle) return 0;
  try {
    var U = F.units, n = 0;
    for (var i = 0; i < U.length; i++) { var u = U[i]; if (u && u.alive && u._artFlash > 0) n++; }
    return n;
  } catch (e) { return 0; }
}

/* ---- stereo pan from a unit's field position (side-corrected to the camera end) ---- */
function fldAmbPan(u, ps) {
  try {
    var w = (typeof FLD !== "undefined" && FLD && FLD.FIELD_W) ? FLD.FIELD_W : 1200;
    var half = w / 2; if (!(half > 0)) half = 600;
    var p = (u.x - half) / half;        // -1 (left edge) .. +1 (right edge) by world-x
    if (ps === "CS") p = -p;            // the CS camera views from the far end -> mirror
    if (!isFinite(p)) return 0;
    return p < -1 ? -1 : (p > 1 ? 1 : p);
  } catch (e) { return 0; }
}

/* ===========================================================================
   WEBAUDIO SYNTHESIS — own AudioContext; every node guarded; silent if absent
   =========================================================================== */
function fldAmbCtx() {
  try {
    if (FLDAMB.ctx) {
      if (FLDAMB.ctx.state === "suspended") { try { FLDAMB.ctx.resume(); } catch (e) {} }
      return FLDAMB.ctx;
    }
    var AC = (typeof window !== "undefined") && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    FLDAMB.ctx = new AC();
    if (FLDAMB.ctx.state === "suspended") { try { FLDAMB.ctx.resume(); } catch (e) {} }
    return FLDAMB.ctx;
  } catch (e) { FLDAMB.errN++; return null; }
}
function fldAmbRamp(param, c, target, secs) {
  try {
    param.cancelScheduledValues(c.currentTime);
    param.setValueAtTime(param.value, c.currentTime);
    param.linearRampToValueAtTime(target <= 0 ? 0.0001 : target, c.currentTime + secs);
  } catch (e) {}
}
function fldAmbNoiseBuf(c, secs, brown) {
  var n = Math.max(1, Math.ceil(c.sampleRate * secs));
  var b = c.createBuffer(1, n, c.sampleRate);
  var d = b.getChannelData(0), i;
  if (brown) {
    var last = 0, peak = 0;
    for (i = 0; i < n; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; if (Math.abs(d[i]) > peak) peak = Math.abs(d[i]); }
    if (peak > 0) for (i = 0; i < n; i++) d[i] /= peak;
  } else {
    for (i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }
  return b;
}
/* one filtered-noise burst (musket rip / cannon crack / rolling tail) */
function fldAmbNoiseHit(c, dest, when, dur, peak, filt, freq, q) {
  try {
    var src = c.createBufferSource(); src.buffer = fldAmbNoiseBuf(c, dur + 0.02, false);
    var f = c.createBiquadFilter(); f.type = filt; f.frequency.value = freq; if (q != null) f.Q.value = q;
    var g = c.createGain();
    g.gain.setValueAtTime(peak, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(when); src.stop(when + dur + 0.03);
    FLDAMB.bag.push(src);
  } catch (e) { FLDAMB.errN++; }
}
/* one low pitched thump (the cannon's body) */
function fldAmbThump(c, dest, when, dur, peak, f0, f1) {
  try {
    var o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(f0, when);
    o.frequency.exponentialRampToValueAtTime(f1, when + dur * 0.8);
    var g = c.createGain();
    g.gain.setValueAtTime(peak, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(dest);
    o.start(when); o.stop(when + dur + 0.03);
    FLDAMB.bag.push(o);
  } catch (e) { FLDAMB.errN++; }
}

/* ---- the two continuous beds (idempotent build) ---- */
function fldAmbBuildWash(c) {
  if (FLDAMB.washBuilt) return;
  try {
    var src = c.createBufferSource(); src.buffer = fldAmbNoiseBuf(c, 2.2, false); src.loop = true;
    var bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 0.7;
    var trem = c.createGain(); trem.gain.value = 0.85;            // base of the roll
    var lfo = c.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.55;  // the swell
    var lfoG = c.createGain(); lfoG.gain.value = 0.15;            // +/-0.15 -> 0.70..1.00
    var g = c.createGain(); g.gain.value = 0.0001;               // the level (driven by intensity)
    lfo.connect(lfoG); lfoG.connect(trem.gain);
    src.connect(bp); bp.connect(trem); trem.connect(g); g.connect(FLDAMB.master);
    src.start(); lfo.start();
    FLDAMB.washSrc = src; FLDAMB.washTrem = trem; FLDAMB.washLfo = lfo; FLDAMB.washLfoG = lfoG; FLDAMB.washGain = g; FLDAMB.washBuilt = true;
  } catch (e) { FLDAMB.errN++; }
}
function fldAmbBuildRumble(c) {
  if (FLDAMB.rumBuilt) return;
  try {
    var src = c.createBufferSource(); src.buffer = fldAmbNoiseBuf(c, 2.4, true); src.loop = true;
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 85;
    var g = c.createGain(); g.gain.value = 0.0001;
    src.connect(lp); lp.connect(g); g.connect(FLDAMB.master);
    src.start();
    FLDAMB.rumSrc = src; FLDAMB.rumGain = g; FLDAMB.rumBuilt = true;
  } catch (e) { FLDAMB.errN++; }
}

function fldAmbEnsure() {
  var c = fldAmbCtx(); if (!c) return null;
  try {
    if (!FLDAMB.master) { var m = c.createGain(); m.gain.value = 0.0001; m.connect(c.destination); FLDAMB.master = m; }
    fldAmbBuildWash(c); fldAmbBuildRumble(c);
    FLDAMB.started = true;
    // master tracks the loudness setting; re-ramp only when it actually changes
    var scale = fldAmbLoud(), target = FLDAMB.MASTER * scale;
    if (FLDAMB.silenced || FLDAMB.loudApplied !== scale) {
      fldAmbRamp(FLDAMB.master.gain, c, target, 0.5);
      FLDAMB.loudApplied = scale; FLDAMB.silenced = false;
    }
    return c;
  } catch (e) { FLDAMB.errN++; return null; }
}
function fldAmbSetWash(intensity) {
  if (!FLDAMB.washGain || !FLDAMB.ctx) return;
  var lvl = FLDAMB.WASH_PEAK * Math.pow(intensity < 0 ? 0 : intensity, 0.8);
  if (lvl > FLDAMB.WASH_PEAK) lvl = FLDAMB.WASH_PEAK;
  fldAmbRamp(FLDAMB.washGain.gain, FLDAMB.ctx, lvl, 0.4);
}
function fldAmbSetRumble(level) {
  if (!FLDAMB.rumGain || !FLDAMB.ctx) return;
  var lvl = FLDAMB.RUM_PEAK * (level < 0 ? 0 : (level > 1 ? 1 : level));
  fldAmbRamp(FLDAMB.rumGain.gain, FLDAMB.ctx, lvl, 0.6);
}

/* ---- a single located report (cannon report / musket volley), panned ---- */
function fldAmbSynthReport(isArt, pan, intensity) {
  var c = FLDAMB.ctx; if (!c || !FLDAMB.master) return;
  var cap = (typeof fldLow === "function" && fldLow()) ? FLDAMB.CAP_LO : FLDAMB.CAP_NODES;
  if (FLDAMB.bag.length >= cap) return;     // voice ceiling (sources only) — drop, never churn
  try {
    var when = c.currentTime + 0.005;
    var dest = FLDAMB.master;
    if (c.createStereoPanner) {
      var pn = c.createStereoPanner(); pn.pan.value = pan; pn.connect(FLDAMB.master); dest = pn; FLDAMB.pans.push(pn);
    }
    var k = 0.6 + 0.4 * (intensity < 0 ? 0 : (intensity > 1 ? 1 : intensity));
    if (isArt) {
      fldAmbNoiseHit(c, dest, when, 0.05, 0.10 * k, "highpass", 1800, 0.7);            // sharp crack
      fldAmbThump(c, dest, when, 0.5, 0.12 * k, 88, 40);                               // body
      fldAmbNoiseHit(c, dest, when + 0.03, 1.1 + Math.random() * 0.5, 0.05 * k, "lowpass", 420, 0.5);  // rolling tail
    } else {
      var dur = 0.18 + Math.random() * 0.16;
      fldAmbNoiseHit(c, dest, when, dur, 0.07 * k, "bandpass", 1300 + Math.random() * 700, 1.1);       // volley rip
    }
  } catch (e) { FLDAMB.errN++; }
}

/* ---- scan the live fire and schedule located reports (fog-gated, throttled) ---- */
function fldAmbReports(F, intensity, now) {
  // Never schedule a LOCATED report against a frozen clock. Before the first user gesture the AudioContext is
  // SUSPENDED (the autoplay policy) — its currentTime does not advance, so every report we'd queue carries a
  // past-due `when` AND consumes a per-unit cooldown; the instant a gesture resumes audio they all fire at once
  // (an audible "stampede"). Defer until the context is genuinely running. The continuous beds ramp from silence
  // and are harmless while suspended, so only this transient path needs the guard. (Probe: the headless context
  // is always running, so this is a no-op there — the suspended path is covered by a stubbed-ctx assertion.)
  if (!FLDAMB.ctx || FLDAMB.ctx.state !== "running") return;
  if ((now - FLDAMB.lastReport) < FLDAMB.GAP_MS) return;
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  var fog = F.fog, U = F.units, low = (typeof fldLow === "function" && fldLow());
  var maxThisTick = low ? 1 : 3, fired = 0;
  for (var i = 0; i < U.length; i++) {
    if (fired >= maxThisTick) break;
    var u = U[i]; if (!u || !u.alive) continue;
    var isArt = u._artFlash > 0;
    var isMusket = (!isArt && u.targetId && u.ammo > 0 && u.state !== "routing");
    if (!isArt && !isMusket) continue;
    // fog of war: a hidden foe's report is LOCATED sound -> never betray it (the T16 smoke rule)
    if (fog && u.side !== ps && typeof fldVisible === "function" && !fldVisible(ps, u)) { FLDAMB.fogGated++; continue; }
    var uid = "u" + (u.id != null ? u.id : i);
    var cd = isArt ? FLDAMB.COOL_CANNON : FLDAMB.COOL_MUSKET;
    if ((now - (FLDAMB.cool[uid] || 0)) < cd) continue;
    FLDAMB.cool[uid] = now;
    var pan = fldAmbPan(u, ps);
    FLDAMB.lastPan = pan; FLDAMB.reportsScheduled++;   // DECISION recorded (testable headless)
    fldAmbSynthReport(isArt, pan, intensity);          // synthesis best-effort
    FLDAMB.lastReport = now; fired++;
  }
}

/* ---- trim the transient node pool (already-stopped nodes disconnect harmlessly) ---- */
function fldAmbTrimBag() {
  var cap = (typeof fldLow === "function" && fldLow()) ? FLDAMB.CAP_LO : FLDAMB.CAP_NODES;
  var b = FLDAMB.bag;
  if (b.length > cap) {
    var drop = b.splice(0, b.length - cap);
    for (var i = 0; i < drop.length; i++) { try { drop[i].disconnect(); } catch (e) {} }
  }
  var pn = FLDAMB.pans;
  if (pn.length > cap) {
    var dropP = pn.splice(0, pn.length - cap);
    for (var j = 0; j < dropP.length; j++) { try { dropP[j].disconnect(); } catch (e) {} }
  }
}

/* ---- caption once on first activation in a fought battle (T9's accessible cue) ---- */
function fldAmbCaptionOnce() {
  // Consume the one-shot ONLY after the caption actually renders. T9's _fldAudioCaption no-ops when captions are
  // OFF (the default), so burning the flag unconditionally would deny the cue to a user who enables captions
  // mid-battle — the very accessibility surface this layer advertises. Re-checked cheaply each active tick until shown.
  try {
    if (typeof _fldAudioCapsOn === "function" && _fldAudioCapsOn() && typeof _fldAudioCaption === "function") {
      _fldAudioCaption("🔊 Battle ambience — the rolling roar of massed musketry and cannon");
      FLDAMB.captioned = true;
    }
  } catch (e) {}
}

/* ---- ramp everything to silence (layer toggled off mid-battle; nodes kept) ---- */
function fldAmbSilence() {
  if (FLDAMB.silenced) return;
  var c = FLDAMB.ctx; if (!c) { FLDAMB.silenced = true; return; }
  try {
    if (FLDAMB.master) fldAmbRamp(FLDAMB.master.gain, c, 0, 0.4);
    if (FLDAMB.washGain) fldAmbRamp(FLDAMB.washGain.gain, c, 0, 0.4);
    if (FLDAMB.rumGain) fldAmbRamp(FLDAMB.rumGain.gain, c, 0, 0.4);
  } catch (e) {}
  FLDAMB.silenced = true; FLDAMB.loudApplied = -1;
}

/* ---- per-battle reset (new launch) ---- */
function fldAmbResetBattle(F) {
  FLDAMB.fieldRef = F;
  FLDAMB.cool = Object.create(null);
  FLDAMB._prevMen = 0;
  FLDAMB.started = false; FLDAMB.silenced = false; FLDAMB.captioned = false;
  FLDAMB.last = 0; FLDAMB.lastReport = 0; FLDAMB.loudApplied = -1;
  FLDAMB.reportsScheduled = 0; FLDAMB.fogGated = 0; FLDAMB.lastPan = 0;
  FLDAMB.intensity = 0; FLDAMB.artCount = 0;
}

/* ===========================================================================
   THE PER-FRAME DECISION TICK (driven by the render hook, throttled to TICK_MS)
   =========================================================================== */
function fldAmbUpdate() {
  try {
    var F = (typeof __FIELD !== "undefined") ? __FIELD : null;
    if (!F || !F.launched) return;
    if (FLDAMB.fieldRef !== F) fldAmbResetBattle(F);
    if (!FLDAMB.cool) FLDAMB.cool = Object.create(null);
    var now = fldAmbNow();
    if (FLDAMB.last && (now - FLDAMB.last) < FLDAMB.TICK_MS) return;   // throttle decisions
    FLDAMB.last = now;

    if (!fldAmbActive()) { if (FLDAMB.started) fldAmbSilence(); FLDAMB.intensity = 0; return; }
    // The field is decided: let the bed fall silent and idle the graph. The RAF loop keeps calling the render
    // hook on the 'over' screen until the player exits, so without this the live WebAudio graph (two looping
    // noise beds + an LFO) would drain on indefinitely at the master ceiling. Next launch resets via fieldRef.
    if (F.phase === "over") { if (FLDAMB.started) fldAmbSilence(); FLDAMB.intensity = 0; return; }

    var inBattle = (F.phase === "battle" && !F.paused);
    var intensity = inBattle ? fldAmbIntensity(F) : 0;
    FLDAMB.intensity = intensity;

    fldAmbEnsure();   // build + bring master to the loud-scaled ceiling (idempotent)
    if (!FLDAMB.captioned && inBattle && intensity > 0.02) fldAmbCaptionOnce();

    fldAmbSetWash(intensity);
    var art = fldAmbArtCount(F, inBattle); FLDAMB.artCount = art;
    fldAmbSetRumble(inBattle ? art / 3 : 0);

    if (inBattle && intensity > 0.06) fldAmbReports(F, intensity, now);
    fldAmbTrimBag();
  } catch (e) { FLDAMB.errN++; }
}

/* ---- teardown on battle exit: stop the beds, drop the pool, suspend the ctx ---- */
function fldAmbDispose() {
  try {
    var c = FLDAMB.ctx;
    if (FLDAMB.washSrc) { try { FLDAMB.washSrc.stop(); } catch (e) {} try { FLDAMB.washSrc.disconnect(); } catch (e) {} }
    if (FLDAMB.washLfo) { try { FLDAMB.washLfo.stop(); } catch (e) {} try { FLDAMB.washLfo.disconnect(); } catch (e) {} }
    if (FLDAMB.rumSrc) { try { FLDAMB.rumSrc.stop(); } catch (e) {} try { FLDAMB.rumSrc.disconnect(); } catch (e) {} }
    for (var i = 0; i < FLDAMB.bag.length; i++) { try { FLDAMB.bag[i].stop(); } catch (e) {} try { FLDAMB.bag[i].disconnect(); } catch (e) {} }
    for (var p = 0; p < FLDAMB.pans.length; p++) { try { FLDAMB.pans[p].disconnect(); } catch (e) {} }   // panners: disconnect only (no .stop)
    FLDAMB.bag.length = 0; FLDAMB.pans.length = 0;
    if (FLDAMB.master) { try { FLDAMB.master.disconnect(); } catch (e) {} }
    FLDAMB.washSrc = FLDAMB.washGain = FLDAMB.washTrem = FLDAMB.washLfo = FLDAMB.washLfoG = null; FLDAMB.washBuilt = false;
    FLDAMB.rumSrc = FLDAMB.rumGain = null; FLDAMB.rumBuilt = false;
    FLDAMB.master = null; FLDAMB.started = false; FLDAMB.silenced = false; FLDAMB.captioned = false;
    FLDAMB.fieldRef = null; FLDAMB.loudApplied = -1;
    if (c && c.suspend) { try { c.suspend(); } catch (e) {} }   // keep the ctx for reuse, silent
  } catch (e) { FLDAMB.errN++; }
}

/* ===========================================================================
   PANEL ROW — append an accessible "Battle ambience" toggle to T9's audio panel.
   Reuses T9's segmented-button markup verbatim (keyboard / focus / ARIA / CVD-safe
   from the existing AA-vetted panel); the panel's generic data-acb handler persists
   G.settings.battleAmbience and this layer reads it live on the next frame.
   =========================================================================== */
function fldAmbPanelRow() {
  try {
    var on = (typeof G !== "undefined" && G && G.settings && G.settings.battleAmbience === true);
    var label = "Battle ambience";
    var hint = "A deep, spatial bed of rolling musketry and cannon under the cues (off by default).";
    var opts = [[true, "On"], [false, "Off"]];
    var h = '<div style="margin:0 0 12px;"><div style="font-size:13px;letter-spacing:.5px;margin-bottom:5px;">' + label +
            '</div><div role="group" aria-label="' + label + '" style="display:flex;gap:6px;flex-wrap:wrap;">';
    for (var i = 0; i < opts.length; i++) {
      var sel = (opts[i][0] === on);
      h += '<button data-acb="battleAmbience" data-acv="' + opts[i][0] + '" aria-pressed="' + sel + '" ' +
           'style="cursor:pointer;font:inherit;font-size:12px;min-height:32px;padding:5px 11px;border-radius:5px;border:1px solid ' +
           (sel ? "#e8c84a" : "#8a7258") + ';background:' + (sel ? "#3a2f17" : "#161b22") + ';color:#f2e8d5;">' +
           opts[i][1] + '</button>';
    }
    h += '</div><div style="font-size:11px;opacity:.7;margin-top:4px;">' + hint + '</div></div>';
    return h;
  } catch (e) { return ""; }
}

/* ===========================================================================
   WIRE-IN — wrap the renderers + exit + T9's panel-rows by ASSIGNMENT.
   Bare-name rebinds (T19 loads after T0/T9); callers resolve the wrapper at call
   time, exactly like T9-audio / T16 / T17 / T18. Idempotent; guarded.
   =========================================================================== */
(function () {
  // Propagate every prior introspection marker (._atmo/._wx/._t9audio/T18's, etc.) from the binding we
  // wrap onto our new wrapper, so the sibling probes that assert on the chain still see them (a fresh
  // function object would otherwise shadow them). Generic so it covers all current AND future markers.
  function keep(neu, old) {
    try { for (var k in old) { if (Object.prototype.hasOwnProperty.call(old, k) && neu[k] === undefined) { try { neu[k] = old[k]; } catch (e) {} } } } catch (e) {}
  }
  try {
    FLDAMB.cool = Object.create(null);
    if (typeof fld3dRender === "function" && !fld3dRender._amb) {
      var _o3 = fld3dRender;
      fld3dRender = function () { var r = _o3.apply(this, arguments); try { fldAmbUpdate(); } catch (e) {} return r; };
      keep(fld3dRender, _o3); fld3dRender._amb = true;
    }
    if (typeof fld2dDraw === "function" && !fld2dDraw._amb) {
      var _o2 = fld2dDraw;
      fld2dDraw = function () { var r = _o2.apply(this, arguments); try { fldAmbUpdate(); } catch (e) {} return r; };
      keep(fld2dDraw, _o2); fld2dDraw._amb = true;
    }
    if (typeof fldExit === "function" && !fldExit._amb) {
      var _oe = fldExit;
      fldExit = function () { try { fldAmbDispose(); } catch (e) {} return _oe.apply(this, arguments); };
      keep(fldExit, _oe); fldExit._amb = true;
    }
    if (typeof _fldAudioPanelRows === "function" && !_fldAudioPanelRows._amb) {
      var _op = _fldAudioPanelRows;
      _fldAudioPanelRows = function () { var base = _op.apply(this, arguments); try { return base + fldAmbPanelRow(); } catch (e) { return base; } };
      keep(_fldAudioPanelRows, _op); _fldAudioPanelRows._amb = true;
    }
  } catch (e) {}
})();
