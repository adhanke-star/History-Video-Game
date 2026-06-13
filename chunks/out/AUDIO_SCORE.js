/* ============================================================================
   §AUDIO_SCORE — ADAPTIVE PERIOD SCORE ENGINE  (append-only chunk)
   ----------------------------------------------------------------------------
   A fully self-contained, procedural, Web-Audio-synthesized adaptive score for
   the Civil War wargame. NO audio files, NO fetch, NO external libraries.
   Everything is synthesized live with OscillatorNode / AudioBufferSourceNode /
   BiquadFilter / GainNode / DelayNode.

   PUBLIC API (all attached to window):
     scoreInit()             — idempotent; prepares OWN AudioContext + masters.
     musicStart(context)     — "menu" | "march" | "battle" | "camp"; crossfades.
     musicStop()             — fade out + stop current loop + clear scheduler.
     bugleCall(name)         — one-shot solo bugle (harmonic-series pitches only).
     dinSet(intensity)       — 0..1 continuous battle-din bed (rumble+thumps).
     dinStop()               — fade + stop the din bed.
     scoreSampleBattle()     — reads G.battle, returns 0..1 intensity.

   GUARANTEES:
     * NEVER THROWS into the game. Every public body is wrapped in try/catch
       that swallows errors. Audio failing must never crash the game.
     * OWN AudioContext. Does NOT touch the existing private SOUND IIFE
       (playSfx / getCtx / ctx / voices / ambientStart / ambientStop). This
       module creates and owns a separate AudioContext.
     * FULLY GATED. All sound gates on G.settings.sound (master). Music also
       gates on G.settings.music. Bugle calls are signal SFX — gated on
       G.settings.sound only (allowed even when music is off).
     * NO NODE LEAKS. Every OscillatorNode / BufferSourceNode that is started is
       also stopped with a finite time and tracked for disconnect. The lookahead
       scheduler is stoppable and clears its setInterval. No unbounded growth.
     * SAFE under a mock/absent AudioContext: if no constructor is present every
       public function is a silent no-op.

   HISTORICAL NOTE — bugle pitches are HARMONIC-SERIES ONLY. A field bugle has
   no valves and can only sound the natural overtones of its fundamental. Every
   bugle note here is restricted to {G3 196, C4 261.63, G4 392, C5 523.25,
   E5 659.25, G5 783.99, C6 1046.50}. No chromatic notes are used.
   ============================================================================ */

(function () {
  "use strict";

  /* ---- pitch constants ---------------------------------------------------- */
  // Bugle harmonic series (the ONLY pitches a valveless bugle can produce).
  var G3 = 196.00, C4 = 261.63, G4 = 392.00, C5 = 523.25,
      E5 = 659.25, G5 = 783.99, C6 = 1046.50;
  // Diatonic fife pitches (C major) for the march melody.
  var D4 = 293.66, E4 = 329.63, F4 = 349.23, A4 = 440.00, B4 = 493.88,
      D5 = 587.33, F5 = 698.46, A5 = 880.00;

  /* ---- own AudioContext + masters (lazy) ---------------------------------- */
  var actx = null;          // OUR context — separate from the SOUND IIFE's ctx
  var musicMaster = null;   // master gain for all music loops (~0.35)
  var dinMaster = null;     // master gain for the battle din bed (<0.3)
  var inited = false;

  // Defensively add the music flag without bumping save version or touching
  // any other setting.
  try {
    if (G && G.settings && G.settings.music === undefined) {
      G.settings.music = true;
    }
  } catch (e) {}

  function AC() { return window.AudioContext || window.webkitAudioContext; }

  // settings helpers — defensive: missing G means "no sound".
  function sndOn() {
    try { return !!(G && G.settings && G.settings.sound); }
    catch (e) { return false; }
  }
  function musicOn() {
    try {
      return !!(G && G.settings &&
                G.settings.sound && G.settings.music);
    } catch (e) { return false; }
  }

  // Lazily build the context + master gains. Returns actx or null.
  function ensure() {
    try {
      if (!actx) {
        var C = AC();
        if (!C) return null;
        actx = new C();
      }
      if (actx.state === "suspended") { try { actx.resume(); } catch (e) {} }
      if (!musicMaster) {
        musicMaster = actx.createGain();
        musicMaster.gain.value = 0.35;
        musicMaster.connect(actx.destination);
      }
      if (!dinMaster) {
        dinMaster = actx.createGain();
        dinMaster.gain.value = 0.0;
        dinMaster.connect(actx.destination);
      }
      inited = true;
      return actx;
    } catch (e) { return null; }
  }

  /* ---- small synth helpers ------------------------------------------------ */

  // White-noise AudioBuffer of `secs` seconds (mono).
  function noiseBuf(c, secs) {
    var n = Math.max(1, Math.ceil(c.sampleRate * secs));
    var b = c.createBuffer(1, n, c.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // Brown-noise AudioBuffer (integrated white) — low rumble source.
  function brownBuf(c, secs) {
    var n = Math.max(1, Math.ceil(c.sampleRate * secs));
    var b = c.createBuffer(1, n, c.sampleRate);
    var d = b.getChannelData(0);
    var last = 0, peak = 0;
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
      if (Math.abs(d[i]) > peak) peak = Math.abs(d[i]);
    }
    if (peak > 0) for (var j = 0; j < n; j++) d[j] /= peak;
    return b;
  }

  // A tracked oscillator note (start+stop scheduled). Pushes into `bag` so the
  // owning loop can disconnect later. Returns nothing (fire-and-forget node).
  // env: short percussive ADSR-ish gain into `dest`.
  function oscNote(c, dest, bag, type, freq, when, dur, peak, opts) {
    opts = opts || {};
    var o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    // optional vibrato on held notes
    var lfo = null, lfoGain = null;
    if (opts.vibrato && dur > 0.18) {
      lfo = c.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = opts.vibratoRate || 5.5;
      lfoGain = c.createGain();
      lfoGain.gain.value = opts.vibrato; // cents-ish in Hz
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
    }
    var node = o;
    // optional lowpass for bell/bugle character
    if (opts.lp) {
      var f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = opts.lp;
      o.connect(f);
      node = f;
    }
    var g = c.createGain();
    var atk = opts.atk == null ? 0.02 : opts.atk;
    var rel = opts.rel == null ? 0.06 : opts.rel;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(peak, when + Math.min(atk, dur * 0.5));
    g.gain.setValueAtTime(peak, when + Math.max(atk, dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    node.connect(g);
    g.connect(dest);
    o.start(when);
    o.stop(when + dur + 0.02);
    if (lfo) { lfo.start(when); lfo.stop(when + dur + 0.02); }
    if (bag) {
      bag.push(o);
      if (lfo) bag.push(lfo);
    }
    return o;
  }

  // A filtered noise burst (snare tick / musket crackle).
  function noiseHit(c, dest, bag, when, dur, peak, filtType, freq, q) {
    var src = c.createBufferSource();
    src.buffer = noiseBuf(c, dur + 0.02);
    var f = c.createBiquadFilter();
    f.type = filtType;
    f.frequency.value = freq;
    if (q != null) f.Q.value = q;
    var g = c.createGain();
    g.gain.setValueAtTime(peak, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(when);
    src.stop(when + dur + 0.02);
    if (bag) bag.push(src);
    return src;
  }

  // Low lowpassed thump (bass drum / distant cannon).
  function thump(c, dest, bag, when, dur, peak, f0, f1) {
    var o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f0, when);
    o.frequency.exponentialRampToValueAtTime(f1, when + dur * 0.8);
    var g = c.createGain();
    g.gain.setValueAtTime(peak, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(dest);
    o.start(when);
    o.stop(when + dur + 0.02);
    if (bag) bag.push(o);
    return o;
  }

  /* ========================================================================
     MUSIC ENGINE — lookahead scheduler
     ------------------------------------------------------------------------
     Standard Web Audio lookahead: a setInterval (~25ms) wakes up and, while the
     next note time is within LOOKAHEAD seconds of now, schedules that note and
     advances nextNoteTime. This decouples musical timing from JS timer jitter.
     ======================================================================== */
  var LOOKAHEAD = 0.20;     // schedule this far ahead (s)
  var TICK_MS = 25;         // scheduler wake interval (ms)

  var musicCtx = null;      // current context string, or null
  var musicTimer = null;    // setInterval handle
  var nextNoteTime = 0;     // absolute ctx time of the next step
  var step = 0;             // step index within the current pattern
  var loopGain = null;      // gain for the CURRENT loop (fades in/out)
  var loopBag = [];         // oscillators/sources started by current loop
  var droneNodes = [];      // long-lived drone oscillators (battle/camp)
  var bpm = 110;
  var stepsPerLoop = 64;

  // Prune finished nodes from loopBag so it never grows without bound.
  function pruneBag() {
    if (!actx) return;
    var now = actx.currentTime;
    // we can't reliably read node stop time, so cap length instead:
    if (loopBag.length > 256) {
      var drop = loopBag.splice(0, loopBag.length - 128);
      for (var i = 0; i < drop.length; i++) {
        try { drop[i].disconnect(); } catch (e) {}
      }
    }
  }

  // ---- ORIGINAL period march melody (C major quickstep, ~110 BPM) ----------
  // Each entry: [fifeFreq or 0, beats]. 0 = rest. Dotted martial feel built by
  // pairing a long dotted note with a short pickup. 16 bars of 4 -> we drive it
  // by an eighth-note grid (stepsPerLoop steps). This is an AUTHORED tune, not
  // a transcription of any copyrighted arrangement.
  // Grid: 8 eighth-notes per bar; pattern repeats. fifeStep returns a freq|0.
  var MARCH = [
    // bar 1
    G4,0, C5,C5, E5,0, G5,0,
    // bar 2
    E5,0, C5,0, D5,0, E5,0,
    // bar 3
    F5,0, E5,0, D5,0, C5,0,
    // bar 4
    G4,0, G4,0, C5,0, 0,0,
    // bar 5
    E5,0, G5,G5, A5,0, G5,0,
    // bar 6
    F5,0, E5,0, D5,0, C5,0,
    // bar 7
    B4,0, C5,0, D5,0, E5,0,
    // bar 8
    C5,0, C5,0, C5,0, 0,0
  ];

  // ---- camp air (slow, lonely solo) — diatonic, long notes ----------------
  var CAMP = [E4, 0, G4, 0, A4, 0, G4, 0,
              E4, 0, D4, 0, C4, 0, 0, 0,
              D4, 0, E4, 0, F4, 0, E4, 0,
              D4, 0, C4, 0, 0, 0, 0, 0];

  // Bass-drum downbeat pattern for the march (per eighth-step boolean).
  function isDownbeat(s) { return (s % 8) === 0; }       // bar start
  function isBackbeat(s) { return (s % 4) === 0; }       // beats
  function isSnareTick(s) { return (s % 2) === 1; }      // off-eighths roll

  // Schedule ONE step of the current context at absolute time `when`.
  function scheduleStep(c, when) {
    if (musicCtx === "menu" || musicCtx === "march") {
      // ---- fife melody ----
      var idx = (step % (MARCH.length / 2)) * 2;
      var f = MARCH[idx];
      if (f) {
        // dotted feel: held notes ring; vibrato + bandpass-bright fife
        oscNote(c, loopGain, loopBag, "square", f, when, 0.22, 0.18,
                { lp: 3800, atk: 0.008, rel: 0.05, vibrato: 4, vibratoRate: 6 });
        // octave-down faint reinforcement for body
        oscNote(c, loopGain, loopBag, "triangle", f / 2, when, 0.18, 0.05,
                { atk: 0.01, rel: 0.05 });
      }
      // ---- drum cadence ----
      if (isDownbeat(step)) {
        thump(c, loopGain, loopBag, when, 0.18, 0.30, 110, 45); // bass drum
      }
      if (isBackbeat(step)) {
        noiseHit(c, loopGain, loopBag, when, 0.05, 0.18, "bandpass", 1900, 3.0);
      }
      if (isSnareTick(step) && (step % 8) >= 4) {
        // snare roll fill in second half of each bar
        noiseHit(c, loopGain, loopBag, when, 0.03, 0.10, "bandpass", 2200, 4.0);
      }
    } else if (musicCtx === "camp") {
      // ---- lonely solo fife/fiddle air ----
      var ci = (step % (CAMP.length)) ;
      var cf = CAMP[ci];
      if (cf) {
        oscNote(c, loopGain, loopBag, "triangle", cf, when, 0.55, 0.16,
                { lp: 2600, atk: 0.06, rel: 0.25, vibrato: 3, vibratoRate: 4.5 });
      }
      // very soft heartbeat drum on bar starts
      if ((step % 8) === 0) {
        thump(c, loopGain, loopBag, when, 0.22, 0.07, 80, 38);
      }
    } else if (musicCtx === "battle") {
      // ---- slow ominous drum pulse + occasional distant bugle motif ----
      if ((step % 4) === 0) {
        thump(c, loopGain, loopBag, when, 0.30, 0.22, 90, 40);
      }
      // distant bugle motif every 16 steps (sparse, low, harmonic-only)
      if ((step % 16) === 2) {
        oscNote(c, loopGain, loopBag, "sawtooth", G4, when, 0.30, 0.07,
                { lp: 1600, atk: 0.04, rel: 0.12, vibrato: 3 });
        oscNote(c, loopGain, loopBag, "sawtooth", C5, when + 0.32, 0.45, 0.07,
                { lp: 1600, atk: 0.04, rel: 0.2, vibrato: 3 });
      }
    }
  }

  // The scheduler tick: advance while nextNoteTime is within the lookahead.
  function schedulerTick() {
    try {
      if (!actx || !musicCtx) return;
      var secPerStep = (60.0 / bpm) / 2.0;            // eighth-note grid (march)
      if (musicCtx === "camp") secPerStep = 0.50;     // slow lonely air
      if (musicCtx === "battle") secPerStep = (60.0 / 96); // slow quarter pulse
      while (nextNoteTime < actx.currentTime + LOOKAHEAD) {
        scheduleStep(actx, nextNoteTime);
        nextNoteTime += secPerStep;
        step++;
        if (step >= 1e9) step = 0; // safety wrap (never realistically reached)
      }
      pruneBag();
    } catch (e) {
      // a failed tick must not crash the game; stop quietly
      try { musicStop(); } catch (e2) {}
    }
  }

  // Tear down the current loop's nodes + drones. Disconnect everything.
  function killLoopNodes() {
    var i;
    for (i = 0; i < loopBag.length; i++) {
      try { loopBag[i].stop(); } catch (e) {}
      try { loopBag[i].disconnect(); } catch (e) {}
    }
    loopBag = [];
    for (i = 0; i < droneNodes.length; i++) {
      try { droneNodes[i].stop(); } catch (e) {}
      try { droneNodes[i].disconnect(); } catch (e) {}
    }
    droneNodes = [];
  }

  // Build the sustained drone bed for the battle context (two detuned saws,
  // heavy lowpass). Connected to loopGain so it fades with the loop.
  function startBattleDrone(c) {
    var i, dets = [-6, +7];
    for (i = 0; i < dets.length; i++) {
      var o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = C4 / 2;          // low C3-ish drone
      o.detune.value = dets[i];
      var f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 220;
      var g = c.createGain();
      g.gain.value = 0.10;
      o.connect(f); f.connect(g); g.connect(loopGain);
      o.start();
      droneNodes.push(o);
    }
  }

  /* ---- per-context master target (battle sits lower so din reads through) - */
  function ctxMasterTarget(name) {
    if (name === "battle") return 0.22;
    if (name === "camp")   return 0.26;
    return 0.35; // menu / march bright
  }

  /* ========================================================================
     PUBLIC: scoreInit
     ======================================================================== */
  function scoreInit() {
    try {
      if (!AC()) return;          // mock/absent context -> no-op
      ensure();
    } catch (e) {}
  }

  /* ========================================================================
     PUBLIC: musicStart(context)
     ======================================================================== */
  function musicStart(context) {
    try {
      if (!musicOn()) return;
      if (context !== "menu" && context !== "march" &&
          context !== "battle" && context !== "camp") return;
      var c = ensure();
      if (!c) return;

      // idempotent: already playing the same context
      if (musicCtx === context && musicTimer) return;

      // crossfade: fade the OLD loop out over ~0.6s, then retire its nodes.
      if (loopGain) {
        var old = loopGain;
        var oldBag = loopBag;
        var oldDrones = droneNodes;
        try {
          old.gain.cancelScheduledValues(c.currentTime);
          old.gain.setValueAtTime(old.gain.value, c.currentTime);
          old.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.6);
        } catch (e) {}
        // detach references so the new loop gets fresh arrays
        loopGain = null; loopBag = []; droneNodes = [];
        setTimeout(function () {
          var k;
          for (k = 0; k < oldBag.length; k++) {
            try { oldBag[k].stop(); } catch (e) {}
            try { oldBag[k].disconnect(); } catch (e) {}
          }
          for (k = 0; k < oldDrones.length; k++) {
            try { oldDrones[k].stop(); } catch (e) {}
            try { oldDrones[k].disconnect(); } catch (e) {}
          }
          try { old.disconnect(); } catch (e) {}
        }, 750);
      }

      // new loop gain, fade in
      loopGain = c.createGain();
      loopGain.gain.setValueAtTime(0.0001, c.currentTime);
      loopGain.gain.linearRampToValueAtTime(1.0, c.currentTime + 0.6);
      loopGain.connect(musicMaster);

      // per-context master volume ramp
      try {
        musicMaster.gain.cancelScheduledValues(c.currentTime);
        musicMaster.gain.setValueAtTime(musicMaster.gain.value, c.currentTime);
        musicMaster.gain.linearRampToValueAtTime(
          ctxMasterTarget(context), c.currentTime + 0.6);
      } catch (e) {}

      musicCtx = context;
      step = 0;
      nextNoteTime = c.currentTime + 0.08;

      if (context === "battle") startBattleDrone(c);

      // (re)start scheduler
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      musicTimer = setInterval(schedulerTick, TICK_MS);
      // prime one tick immediately so playback begins promptly
      schedulerTick();
    } catch (e) {
      // never throw into the game
    }
  }

  /* ========================================================================
     PUBLIC: musicStop
     ======================================================================== */
  function musicStop() {
    try {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      musicCtx = null;
      if (!actx) { killLoopNodes(); return; }
      if (loopGain) {
        var g = loopGain;
        var bag = loopBag;
        var drones = droneNodes;
        try {
          g.gain.cancelScheduledValues(actx.currentTime);
          g.gain.setValueAtTime(g.gain.value, actx.currentTime);
          g.gain.linearRampToValueAtTime(0.0001, actx.currentTime + 0.8);
        } catch (e) {}
        loopGain = null; loopBag = []; droneNodes = [];
        setTimeout(function () {
          var k;
          for (k = 0; k < bag.length; k++) {
            try { bag[k].stop(); } catch (e) {}
            try { bag[k].disconnect(); } catch (e) {}
          }
          for (k = 0; k < drones.length; k++) {
            try { drones[k].stop(); } catch (e) {}
            try { drones[k].disconnect(); } catch (e) {}
          }
          try { g.disconnect(); } catch (e) {}
        }, 950);
      } else {
        killLoopNodes();
      }
    } catch (e) {}
  }

  /* ========================================================================
     PUBLIC: bugleCall(name)
     ------------------------------------------------------------------------
     One-shot solo bugle. HARMONIC-SERIES PITCHES ONLY. Each call is an authored
     contour of those pitches. Gated on G.settings.sound ONLY (signal SFX).
     Self-contained: schedules + stops its own oscillators; nodes tracked and
     disconnected after the call completes.
     ======================================================================== */
  // Note tables: [freq, startOffset(s), dur(s)]. Pitches restricted to the
  // bugle harmonic series. These are recognizable contours, not transcriptions.
  var CALLS = {
    // Reveille — brisk wake-up, bouncing C-E-G triad figures.
    reveille: [
      [C5,0.00,0.12],[E5,0.12,0.12],[G5,0.24,0.18],[E5,0.42,0.12],[C5,0.54,0.20],
      [G4,0.78,0.12],[C5,0.90,0.12],[E5,1.02,0.12],[G5,1.14,0.30]
    ],
    // Assembly — a brisk repeated rising call.
    assembly: [
      [G4,0.00,0.14],[C5,0.16,0.14],[E5,0.32,0.22],
      [G4,0.62,0.14],[C5,0.78,0.14],[E5,0.94,0.22],
      [C5,1.24,0.16],[G5,1.42,0.34]
    ],
    // Charge — iconic fast triplet figure rising to and hammering high G/C.
    charge: [
      [G4,0.00,0.09],[C5,0.09,0.09],[E5,0.18,0.09],
      [G5,0.27,0.10],[C6,0.37,0.10],
      [G5,0.50,0.10],[C6,0.60,0.10],[G5,0.70,0.10],[C6,0.80,0.26]
    ],
    // Recall — descending, calling troops back in.
    recall: [
      [G5,0.00,0.16],[E5,0.18,0.16],[C5,0.36,0.16],[G4,0.54,0.16],
      [C5,0.74,0.14],[G4,0.90,0.30]
    ],
    // Taps — slow, solemn G-G-C / G-C-E figure (lights out).
    taps: [
      [G4,0.00,0.30],[G4,0.34,0.18],[C5,0.56,0.55],
      [G4,1.20,0.30],[C5,1.54,0.30],[E5,1.88,0.85],
      [C5,2.85,0.30],[G4,3.20,0.95]
    ],
    // To the Colors — stately ceremonial rise and hold.
    to_the_colors: [
      [C5,0.00,0.20],[E5,0.22,0.20],[G5,0.46,0.36],
      [E5,0.86,0.18],[C5,1.06,0.18],[G4,1.26,0.18],[C5,1.46,0.50]
    ],
    // Tattoo — evening, two measured phrases settling down.
    tattoo: [
      [G4,0.00,0.16],[C5,0.18,0.16],[E5,0.36,0.30],[C5,0.68,0.20],
      [G4,0.94,0.16],[C5,1.12,0.16],[G4,1.30,0.16],[C4,1.48,0.50]
    ]
  };

  function bugleCall(name) {
    try {
      if (!sndOn()) return;             // signal SFX: master gate only
      var notes = CALLS[name];
      if (!notes) return;
      var c = ensure();
      if (!c) return;

      // dedicated short-lived gain so we can disconnect cleanly after the call
      var callGain = c.createGain();
      callGain.gain.value = 0.20;
      callGain.connect(actx.destination);

      var bag = [];
      var t0 = c.currentTime + 0.02;
      var last = 0;
      for (var i = 0; i < notes.length; i++) {
        var f = notes[i][0], off = notes[i][1], dur = notes[i][2];
        // bugle timbre: sawtooth through a gentle ~2.2 kHz lowpass, soft attack,
        // bell-like (exponential) release, vibrato on held notes.
        oscNote(c, callGain, bag, "sawtooth", f, t0 + off, dur, 0.9,
                { lp: 2200, atk: 0.03, rel: Math.min(0.18, dur * 0.5),
                  vibrato: dur > 0.3 ? 4 : 0, vibratoRate: 5.5 });
        if (off + dur > last) last = off + dur;
      }
      // retire nodes after the call finishes
      setTimeout(function () {
        for (var k = 0; k < bag.length; k++) {
          try { bag[k].stop(); } catch (e) {}
          try { bag[k].disconnect(); } catch (e) {}
        }
        try { callGain.disconnect(); } catch (e) {}
      }, (last + 0.4) * 1000);
    } catch (e) {}
  }

  /* ========================================================================
     BATTLE DIN BED
     ------------------------------------------------------------------------
     Continuous bed whose loudness/density scale with intensity 0..1:
       * low rumble (looping brown noise -> lowpass ~180 Hz) at low gain
       * randomly-scheduled distant cannon thumps (low sines)
       * musket-crackle bursts (short bandpassed noise)
     Rate + gain of events rise with intensity. At 0, gain ~0 (silent). At 1 a
     steady roar but dinMaster target stays well under 0.3 (no clip).
     ======================================================================== */
  var dinRumble = null;     // looping brown-noise BufferSource
  var dinTimer = null;      // event scheduler interval
  var dinIntensity = 0;
  var dinBag = [];          // transient thump/crackle nodes for cleanup
  var dinNextEvent = 0;

  function dinEventTick() {
    try {
      if (!actx) return;
      var now = actx.currentTime;
      // During a lull (intensity ~0) keep the event clock current so that when
      // intensity rises again we don't schedule a clumped burst of past-due events.
      if (dinIntensity <= 0.001) { dinNextEvent = now; return; }
      // event density: at intensity 1, ~one event every ~70ms; at low, sparse.
      // We schedule a small batch ahead each tick.
      while (dinNextEvent < now + 0.25) {
        // gap shrinks as intensity rises
        var gap = 0.5 - 0.42 * dinIntensity + Math.random() * 0.25;
        if (gap < 0.04) gap = 0.04;
        // pick event type — more cannon at high intensity
        var r = Math.random();
        if (r < 0.25 + 0.15 * dinIntensity) {
          // distant cannon thump
          thump(actx, dinMaster, dinBag, dinNextEvent, 0.45,
                0.18 * dinIntensity, 60 + Math.random() * 20, 30);
        } else {
          // musket crackle burst
          var dur = 0.06 + Math.random() * 0.08;
          noiseHit(actx, dinMaster, dinBag, dinNextEvent, dur,
                   0.10 * dinIntensity, "bandpass",
                   1500 + Math.random() * 900, 1.5);
        }
        dinNextEvent += gap;
      }
      // bound the transient-node bag
      if (dinBag.length > 200) {
        var drop = dinBag.splice(0, dinBag.length - 100);
        for (var i = 0; i < drop.length; i++) {
          try { drop[i].disconnect(); } catch (e) {}
        }
      }
    } catch (e) {
      try { dinStop(); } catch (e2) {}
    }
  }

  function dinSet(intensity) {
    try {
      if (!sndOn()) return;
      var c = ensure();
      if (!c) return;
      var v = +intensity;
      if (isNaN(v)) v = 0;
      if (v < 0) v = 0;
      if (v > 1) v = 1;
      dinIntensity = v;

      // (idempotent) start the rumble loop once
      if (!dinRumble) {
        var src = c.createBufferSource();
        src.buffer = brownBuf(c, 2.0);
        src.loop = true;
        var lp = c.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 180;
        src.connect(lp);
        lp.connect(dinMaster);
        src.start();
        dinRumble = src;
        dinNextEvent = c.currentTime + 0.1;
      }

      // smooth master ramp — cap well under 0.3 to avoid clipping.
      var target = 0.26 * v;
      try {
        dinMaster.gain.cancelScheduledValues(c.currentTime);
        dinMaster.gain.setValueAtTime(dinMaster.gain.value, c.currentTime);
        dinMaster.gain.linearRampToValueAtTime(target, c.currentTime + 0.4);
      } catch (e) {}

      // run the event scheduler whenever intensity > 0
      if (!dinTimer && v > 0.001) {
        dinTimer = setInterval(dinEventTick, TICK_MS);
      }
    } catch (e) {}
  }

  function dinStop() {
    try {
      if (dinTimer) { clearInterval(dinTimer); dinTimer = null; }
      dinIntensity = 0;
      if (!actx) {
        if (dinRumble) { try { dinRumble.stop(); } catch (e) {} dinRumble = null; }
        return;
      }
      if (dinMaster) {
        try {
          dinMaster.gain.cancelScheduledValues(actx.currentTime);
          dinMaster.gain.setValueAtTime(dinMaster.gain.value, actx.currentTime);
          dinMaster.gain.linearRampToValueAtTime(0.0001, actx.currentTime + 0.6);
        } catch (e) {}
      }
      var r = dinRumble;
      var bag = dinBag;
      dinRumble = null;
      dinBag = [];
      setTimeout(function () {
        if (r) { try { r.stop(); } catch (e) {} try { r.disconnect(); } catch (e) {} }
        for (var k = 0; k < bag.length; k++) {
          try { bag[k].stop(); } catch (e) {}
          try { bag[k].disconnect(); } catch (e) {}
        }
      }, 700);
    } catch (e) {}
  }

  /* ========================================================================
     PUBLIC: scoreSampleBattle
     ------------------------------------------------------------------------
     Pure read of G.battle. Returns a 0..1 intensity estimate from recent
     combat: casualty delta since last sample + count of engaged (non-routed)
     units. No DOM. Returns 0 if no battle.
     ======================================================================== */
  var lastCasualtySample = null;   // {us,cs} remembered from prior call

  function totalCasualties(b) {
    // tolerate several plausible shapes without throwing
    var t = 0;
    try {
      if (!b) return 0;
      if (b.casualties != null) {
        var ca = b.casualties;
        if (typeof ca === "number") t += ca;
        else {
          // REAL engine shape: G.battle.casualties = {US, CS} (uppercase). Read those
          // first; the lowercase/total variants are harmless cross-version fallbacks.
          if (ca.US != null) t += +ca.US || 0;
          if (ca.CS != null) t += +ca.CS || 0;
          if (ca.us != null) t += +ca.us || 0;
          if (ca.cs != null) t += +ca.cs || 0;
          if (ca.total != null) t += +ca.total || 0;
        }
      }
      if (b.casUS != null) t += +b.casUS || 0;
      if (b.casCS != null) t += +b.casCS || 0;
    } catch (e) {}
    return t;
  }

  function engagedFraction(b) {
    try {
      var units = b && b.units;
      if (!units || !units.length) return 0;
      var engaged = 0, alive = 0;
      for (var i = 0; i < units.length; i++) {
        var u = units[i];
        if (!u) continue;
        var hp = (u.str != null) ? u.str : (u.strength != null ? u.strength : 1);
        if (hp <= 0) continue;
        alive++;
        if (u.routed) continue;
        // "engaged" heuristic: the REAL per-turn flag is u.fired (set when a unit
        // fires); u.done means it acted this turn. The others are version fallbacks.
        if (u.fired || u.done || u.engaged || u.inCombat || u.firing || u.charging) engaged++;
      }
      if (alive === 0) return 0;
      return engaged / alive;
    } catch (e) { return 0; }
  }

  function scoreSampleBattle() {
    try {
      var b = G && G.battle;
      if (!b) { lastCasualtySample = null; return 0; }

      var cur = totalCasualties(b);
      var delta = 0;
      if (lastCasualtySample != null) {
        delta = cur - lastCasualtySample;
        if (delta < 0) delta = 0;     // new battle / reset
      }
      lastCasualtySample = cur;

      // delta -> 0..1 (saturate around ~40 casualties/sample)
      var dPart = delta / 40;
      if (dPart > 1) dPart = 1;

      var ePart = engagedFraction(b);    // already 0..1

      // weighted blend: recent bloodshed dominates, engagement sustains the bed
      var intensity = 0.65 * dPart + 0.45 * ePart;
      if (intensity > 1) intensity = 1;
      if (intensity < 0) intensity = 0;
      return intensity;
    } catch (e) { return 0; }
  }

  /* ---- expose public API (own functions only — no engine redefinitions) -- */
  window.scoreInit = scoreInit;
  window.musicStart = musicStart;
  window.musicStop = musicStop;
  window.bugleCall = bugleCall;
  window.dinSet = dinSet;
  window.dinStop = dinStop;
  window.scoreSampleBattle = scoreSampleBattle;

})();
