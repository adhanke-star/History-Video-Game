/* ==== §10 — SOUND (CHUNK-02) ==== */

(function(){
  "use strict";

  // ---- shared AudioContext (lazy) ----
  let ctx = null;        // single shared context, created on first use
  let voices = [];       // active voice tracking [{src,gain,end}]
  const MAX_VOICES = 8;

  // ambient state
  let ambientNode = null;   // BufferSourceNode for looping wind
  let ambientGain = null;   // GainNode for ambient

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }

  // drop oldest voice when at cap
  function claimVoice() {
    const now = ctx.currentTime;
    // purge already-finished voices
    voices = voices.filter(v => v.end > now);
    if (voices.length >= MAX_VOICES) {
      // stop the oldest
      const oldest = voices.shift();
      try { oldest.src.stop(); } catch(e) {}
    }
  }

  function trackVoice(src, duration) {
    voices.push({ src, end: ctx.currentTime + duration });
  }

  // ---- individual sfx builders ----

  // volley: white-noise burst ~0.18s, bandpassed ~1.8kHz
  function sfxVolley(c) {
    const dur = 0.18;
    const bufLen = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    src.buffer = buf;

    const bpf = c.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 1800;
    bpf.Q.value = 1.2;

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.6, c.currentTime);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + dur);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(c.destination);

    claimVoice();
    src.start();
    trackVoice(src, dur);
  }

  // cannon: low sine thump + noise, ~0.5s, ~70Hz
  function sfxCannon(c) {
    const dur = 0.5;
    const t0 = c.currentTime;

    // sine thump
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(70, t0);
    osc.frequency.exponentialRampToValueAtTime(30, t0 + 0.4);

    const oscGain = c.createGain();
    oscGain.gain.setValueAtTime(0.9, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);

    osc.connect(oscGain);
    oscGain.connect(c.destination);

    // noise punch
    const bufLen = Math.ceil(c.sampleRate * 0.12);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noiseSrc = c.createBufferSource();
    noiseSrc.buffer = buf;

    const lpf = c.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 220;

    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.7, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);

    noiseSrc.connect(lpf);
    lpf.connect(noiseGain);
    noiseGain.connect(c.destination);

    claimVoice();
    osc.start(t0);
    osc.stop(t0 + dur);
    noiseSrc.start(t0);
    trackVoice(osc, dur);
  }

  // march: two soft ticks (~0.12s apart), like boot-heel cadence
  function sfxMarch(c) {
    const t0 = c.currentTime;
    function tick(when) {
      const bufLen = Math.ceil(c.sampleRate * 0.04);
      const buf = c.createBuffer(1, bufLen, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      const src = c.createBufferSource();
      src.buffer = buf;
      const bpf = c.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.frequency.value = 300;
      bpf.Q.value = 2.0;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.35, when);
      gain.gain.linearRampToValueAtTime(0, when + 0.04);
      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(c.destination);
      src.start(when);
      trackVoice(src, 0.04 + (when - t0));
    }
    claimVoice();
    tick(t0);
    tick(t0 + 0.14);
  }

  // charge: rising triad (C4-E4-G4) + noise swell, 0.7s
  function sfxCharge(c) {
    const t0 = c.currentTime;
    const dur = 0.7;
    const freqs = [261.63, 329.63, 392.00]; // C4, E4, G4

    freqs.forEach((freq, i) => {
      const osc = c.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t0 + i * 0.08);

      const g = c.createGain();
      g.gain.setValueAtTime(0, t0 + i * 0.08);
      g.gain.linearRampToValueAtTime(0.22, t0 + i * 0.08 + 0.05);
      g.gain.linearRampToValueAtTime(0, t0 + dur);

      osc.connect(g);
      g.connect(c.destination);
      osc.start(t0 + i * 0.08);
      osc.stop(t0 + dur);
    });

    // noise swell
    const bufLen = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noiseSrc = c.createBufferSource();
    noiseSrc.buffer = buf;
    const hpf = c.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = 800;
    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.0, t0);
    noiseGain.gain.linearRampToValueAtTime(0.25, t0 + dur * 0.7);
    noiseGain.gain.linearRampToValueAtTime(0, t0 + dur);
    noiseSrc.connect(hpf);
    hpf.connect(noiseGain);
    noiseGain.connect(c.destination);

    claimVoice();
    noiseSrc.start(t0);
    trackVoice(noiseSrc, dur);
  }

  // rout: falling tone, 0.6s
  function sfxRout(c) {
    const t0 = c.currentTime;
    const dur = 0.6;

    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t0);
    osc.frequency.exponentialRampToValueAtTime(180, t0 + dur * 0.8);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.4, t0);
    gain.gain.setValueAtTime(0.4, t0 + 0.05);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);

    osc.connect(gain);
    gain.connect(c.destination);

    claimVoice();
    osc.start(t0);
    osc.stop(t0 + dur);
    trackVoice(osc, dur);
  }

  // bugle: three-note call G4-C5-E5, square-ish, quiet
  function sfxBugle(c) {
    const t0 = c.currentTime;
    const notes = [
      { f: 392.00, when: 0.00, dur: 0.18 },   // G4
      { f: 523.25, when: 0.20, dur: 0.18 },   // C5
      { f: 659.25, when: 0.40, dur: 0.28 },   // E5 (held)
    ];

    notes.forEach(n => {
      const osc = c.createOscillator();
      osc.type = "square";
      osc.frequency.value = n.f;

      // slight "bugle bell" character — tame the harshness with a lowpass
      const lpf = c.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = 2200;

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0, t0 + n.when);
      gain.gain.linearRampToValueAtTime(0.15, t0 + n.when + 0.02);
      gain.gain.setValueAtTime(0.15, t0 + n.when + n.dur - 0.03);
      gain.gain.linearRampToValueAtTime(0, t0 + n.when + n.dur);

      osc.connect(lpf);
      lpf.connect(gain);
      gain.connect(c.destination);
      osc.start(t0 + n.when);
      osc.stop(t0 + n.when + n.dur);
    });

    claimVoice();
    // track against longest note
    const dummySrc = c.createOscillator();
    dummySrc.frequency.value = 1;
    const dummyGain = c.createGain();
    dummyGain.gain.value = 0;
    dummySrc.connect(dummyGain);
    dummyGain.connect(c.destination);
    dummySrc.start(t0);
    dummySrc.stop(t0 + 0.70);
    trackVoice(dummySrc, 0.70);
  }

  // click: 10ms tick for UI feedback
  function sfxClick(c) {
    const dur = 0.010;
    const bufLen = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, bufLen, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);

    const src = c.createBufferSource();
    src.buffer = buf;

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.25, c.currentTime);

    src.connect(gain);
    gain.connect(c.destination);

    claimVoice();
    src.start();
    trackVoice(src, dur);
  }

  // ---- public API ----

  function playSfx(name) {
    if (!G.settings.sound) return;
    try {
      const c = getCtx();
      if (!c) return;
      switch (name) {
        case "volley":  sfxVolley(c);  break;
        case "cannon":  sfxCannon(c);  break;
        case "march":   sfxMarch(c);   break;
        case "charge":  sfxCharge(c);  break;
        case "rout":    sfxRout(c);    break;
        case "bugle":   sfxBugle(c);   break;
        case "click":   sfxClick(c);   break;
        default: break;
      }
    } catch(e) {
      // audio errors must never crash the game
    }
  }

  // ambient: very quiet looping brown-noise bed (wind)
  // ~0.05 gain; built from a filled AudioBuffer played in a loop
  function ambientStart() {
    if (!G.settings.sound) return;
    try {
      const c = getCtx();
      if (!c) return;
      if (ambientNode) return; // already running

      // generate ~2s of brown noise
      const sampleRate = c.sampleRate;
      const bufLen = sampleRate * 2;
      const buf = c.createBuffer(1, bufLen, sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < bufLen; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5; // scale to audible range
      }

      // normalize
      let peak = 0;
      for (let i = 0; i < bufLen; i++) if (Math.abs(data[i]) > peak) peak = Math.abs(data[i]);
      if (peak > 0) for (let i = 0; i < bufLen; i++) data[i] /= peak;

      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const lpf = c.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = 600; // muffled wind character

      ambientGain = c.createGain();
      ambientGain.gain.setValueAtTime(0, c.currentTime);
      ambientGain.gain.linearRampToValueAtTime(0.05, c.currentTime + 2.0); // fade in

      src.connect(lpf);
      lpf.connect(ambientGain);
      ambientGain.connect(c.destination);

      src.start();
      ambientNode = src;
    } catch(e) {
      // audio errors must never crash the game
    }
  }

  function ambientStop() {
    try {
      if (!ambientNode) return;
      if (ambientGain && ctx) {
        ambientGain.gain.setValueAtTime(ambientGain.gain.value, ctx.currentTime);
        ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5); // fade out
        const nodeToStop = ambientNode;
        setTimeout(function() {
          try { nodeToStop.stop(); } catch(e) {}
        }, 1600);
      } else {
        try { ambientNode.stop(); } catch(e) {}
      }
      ambientNode = null;
      ambientGain = null;
    } catch(e) {
      // audio errors must never crash the game
    }
  }

  // expose globals (no redefinitions — these are declared ❌ by engine facts)
  window.playSfx = playSfx;
  window.ambientStart = ambientStart;
  window.ambientStop = ambientStop;

})();
