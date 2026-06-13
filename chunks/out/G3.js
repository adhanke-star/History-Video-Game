/* ==== §19 — FX, SPEED, CAMERA, LOOP (G3) ==== */

// ─────────────────────────────────────────────────────────────────────────────
// LOOP NEUTRALIZATION
//
// The legacy loop() (§8) does: requestAnimationFrame(loop) → conditionally
// draw(). Re-declaring loop() as a no-op prevents its rAF call from ever
// re-scheduling itself again after the current pending frame lands. Because JS
// function declarations hoist and the later declaration wins at parse time,
// but both declarations live in the same script block (appended after engine),
// the override-by-append pattern applies: this file is spliced after the engine
// marker, so this `function loop(){}` textually supersedes the earlier one.
// After the legacy rAF fires once and calls this no-op, it will never schedule
// a successor — the double-draw is eliminated.
//
// Our own driver (_gorDriver) is installed via window.__gorLoop guard so it
// is started exactly once across any number of splices / module re-evals.
// ─────────────────────────────────────────────────────────────────────────────

// Neutralize the legacy loop — becomes a harmless no-op.
function loop() { /* neutralized by G3 — _gorDriver is the sole rAF loop */ }

// ─────────────────────────────────────────────────────────────────────────────
// G.fx  — particle array with hard cap 80
// ─────────────────────────────────────────────────────────────────────────────

if (!G.fx) G.fx = [];
const _FX_CAP = 80;

// ─────────────────────────────────────────────────────────────────────────────
// Wind direction helper (derived deterministically from battle id hash)
// Returns {dx, dy} unit-ish vector (one of 8 compass dirs scaled 0.4)
// ─────────────────────────────────────────────────────────────────────────────
function _windDir() {
  if (!G.battle) return { dx: 0.3, dy: -0.2 };
  const dirs = [
    { dx: 0, dy: -1 }, { dx: 0.7, dy: -0.7 }, { dx: 1, dy: 0 },  { dx: 0.7, dy: 0.7 },
    { dx: 0, dy: 1 },  { dx: -0.7, dy: 0.7 }, { dx: -1, dy: 0 }, { dx: -0.7, dy: -0.7 },
  ];
  const idx = hashStr(G.battle.bd.id) % 8;
  const d = dirs[idx];
  return { dx: d.dx * 0.4, dy: d.dy * 0.4 };
}

// ─────────────────────────────────────────────────────────────────────────────
// emitFX(type, c, r, data)
//
// type: "fire"   — 2-frame muzzle flash star
//       "smoke"  — 3-5 grey-white circles drifting downwind, fade ≤1.4s (TRANSIENT)
//       "dust"   — melee dust cloud
//       "num"    — floating casualty number, rise 14px, fade ≤1.1s
//                  data.n = number to display
//
// All FX durations are divided by G.speed (default 1).
// Under reduceMotion: "num" is skipped entirely (log carries it);
//   "fire"/"smoke"/"dust" are also skipped (instant/static).
// ─────────────────────────────────────────────────────────────────────────────
function emitFX(type, c, r, data) {
  const rm = G.settings && G.settings.reduceMotion;
  const spd = (G.speed && G.speed >= 1) ? G.speed : 1;

  // Under reduceMotion skip all animated FX
  if (rm) return;

  // Enforce hard cap — oldest entries ejected
  if (G.fx.length >= _FX_CAP) {
    G.fx.splice(0, G.fx.length - _FX_CAP + 1);
  }

  const wind = _windDir();
  const now = performance.now();

  if (type === "fire") {
    // 2-frame muzzle flash: short, very bright
    const life = 120 / spd; // ms
    G.fx.push({ type: "fire", c, r, born: now, life, spd });
  } else if (type === "smoke") {
    // 3-5 puff circles drifting downwind, ≤1.4s total
    const count = 3 + (hashStr((c + "," + r + (now | 0))) % 3);
    for (let i = 0; i < count; i++) {
      const life = (900 + i * 120) / spd;
      if (life > 1400) break; // enforce TRANSIENT cap
      G.fx.push({
        type: "smoke",
        c, r,
        born: now,
        life,
        spd,
        offsetX: (i - 1) * 4,
        offsetY: -i * 3,
        windDx: wind.dx,
        windDy: wind.dy,
        radius: 6 + i * 2,
        delay: i * 80 / spd,
      });
    }
  } else if (type === "dust") {
    const life = 600 / spd;
    G.fx.push({ type: "dust", c, r, born: now, life, spd, radius: 10 });
  } else if (type === "num") {
    // Floating casualty number — skip under reduceMotion (already gated above)
    const life = 1100 / spd;
    const val = (data && data.n !== undefined) ? data.n : 0;
    G.fx.push({ type: "num", c, r, born: now, life, spd, val });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// flash(c, r, type)  — thin wrapper preserving the exact 3-arg engine signature
//
// Existing call sites in resolveFire / resolveCharge / moraleCheck remain
// valid. We also push to G.anim for backward compat with any legacy draw path
// that reads G.anim (e.g., old draw() flash rendering loop — now empty since
// G1's draw() replaces that, but defensive).
// ─────────────────────────────────────────────────────────────────────────────
function flash(c, r, type) {
  // Legacy anim array (legacy draw() consumed this; G1 may ignore it but keep it safe)
  G.anim.push({ c, r, type, t: 18, max: 18 });

  // New FX system
  if (type === "fire") {
    emitFX("fire", c, r, null);
    emitFX("smoke", c, r, null);
  } else if (type === "melee") {
    emitFX("dust", c, r, null);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// drawFX()  — called from G1's draw() via typeof guard
//
// Renders all live entries in G.fx onto the main canvas ctx.
// Expects ctx, G.cam, Wc, Hc, HEX, colrowToPixel, worldToScreen to exist
// (they are engine globals present by integration time).
// ─────────────────────────────────────────────────────────────────────────────
function drawFX() {
  if (!G.fx || !G.fx.length) return;
  const now = performance.now();
  const rm = G.settings && G.settings.reduceMotion;

  // Prune dead entries
  G.fx = G.fx.filter(function(f) {
    const age = now - f.born - (f.delay || 0);
    return age < f.life;
  });

  if (rm) return; // under reduceMotion, nothing to draw (emitFX skipped creation anyway)

  ctx.save();

  for (let i = 0; i < G.fx.length; i++) {
    const f = G.fx[i];
    const age = now - f.born - (f.delay || 0);
    if (age < 0) continue; // delayed puff not yet visible

    const t = Math.max(0, Math.min(1, age / f.life)); // 0→1 progress
    const alpha = 1 - t;                               // fade out

    const p = colrowToPixel(f.c, f.r);
    const s = worldToScreen(p.x, p.y);
    const rad = HEX * G.cam.z * 0.98;

    if (f.type === "fire") {
      // 2-frame muzzle flash — star burst
      ctx.globalAlpha = alpha * 0.9;
      const starR = rad * (0.5 + (1 - t) * 0.4);
      const pts = 8;
      ctx.beginPath();
      for (let k = 0; k < pts * 2; k++) {
        const a = (Math.PI / pts) * k - Math.PI / 2;
        const r2 = (k % 2 === 0) ? starR : starR * 0.38;
        const x = s.x + r2 * Math.cos(a);
        const y = s.y + r2 * Math.sin(a);
        k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 210, 80, 0.95)";
      ctx.fill();
      // inner hot core
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, starR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 200, 1)";
      ctx.fill();

    } else if (f.type === "smoke") {
      // Drifting puff — grey-white circle
      const drift = t * f.life * 0.001; // time-based drift in world units
      const px = s.x + f.offsetX + f.windDx * drift * rad * 2;
      const py = s.y + f.offsetY + f.windDy * drift * rad * 2;
      const pufR = f.radius * G.cam.z * (1 + t * 0.5);
      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.arc(px, py, pufR, 0, Math.PI * 2);
      const grey = Math.floor(200 + t * 40);
      ctx.fillStyle = "rgb(" + grey + "," + grey + "," + grey + ")";
      ctx.fill();

    } else if (f.type === "dust") {
      // Melee dust — expanding warm cloud
      const dustR = f.radius * G.cam.z * (1 + t * 1.2);
      ctx.globalAlpha = alpha * 0.45;
      ctx.beginPath();
      ctx.arc(s.x, s.y, dustR, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(210, 185, 130, 0.8)";
      ctx.fill();

    } else if (f.type === "num") {
      // Floating casualty number — period serif, rises 14px, fades ≤1.1s
      const rise = t * 14 * G.cam.z;
      ctx.globalAlpha = alpha * 0.95;
      const fontSize = Math.max(10, Math.round(rad * 0.38));
      ctx.font = "bold " + fontSize + "px 'Iowan Old Style',Palatino,Georgia,serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillText("−" + f.val, s.x + 1, s.y - rise + 1);
      // text
      ctx.fillStyle = "#ffcc66";
      ctx.fillText("−" + f.val, s.x, s.y - rise);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEED CONTROL
//
// G.speed ∈ {1, 2, 4}, default 1.
// A segmented control is inserted into #turnstrip before #btnEndTurn.
// Guarded against re-insertion by checking for existing element id "stSpeed".
// FX durations are divided by G.speed at emitFX time (already implemented above).
// aiDelay() is exposed for Fable to wire into runAI timeouts.
// ─────────────────────────────────────────────────────────────────────────────

if (typeof G.speed === "undefined") G.speed = 1;

function aiDelay() {
  return Math.max(40, 150 / ((G.speed && G.speed >= 1) ? G.speed : 1));
}

function _insertSpeedControl() {
  // Idempotent — bail if already inserted
  if (document.getElementById("stSpeed")) return;

  const strip = document.getElementById("turnstrip");
  const endBtn = document.getElementById("btnEndTurn");
  if (!strip || !endBtn) return;

  const seg = document.createElement("div");
  seg.id = "stSpeed";
  seg.className = "seg";
  seg.setAttribute("aria-label", "Game speed");

  const speeds = [1, 2, 4];
  speeds.forEach(function(spd) {
    const btn = document.createElement("button");
    btn.textContent = spd + "×";
    btn.setAttribute("data-spd", spd);
    btn.setAttribute("aria-label", spd + "× speed");
    btn.className = (G.speed === spd) ? "on" : "";
    btn.addEventListener("click", function() {
      G.speed = spd;
      // Update button states
      const allBtns = seg.querySelectorAll("button");
      allBtns.forEach(function(b) {
        b.className = (parseInt(b.getAttribute("data-spd"), 10) === spd) ? "on" : "";
      });
    });
    seg.appendChild(btn);
  });

  strip.insertBefore(seg, endBtn);
}

// Insert on DOMContentLoaded if not ready, or immediately if ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", _insertSpeedControl);
} else {
  _insertSpeedControl();
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA: glideTo + followAction
// ─────────────────────────────────────────────────────────────────────────────

// Active glide state
let _glide = null;

// glideTo(c, r, ms) — eased pan to hex (c, r) over ms milliseconds.
// Under reduceMotion: snaps instantly (no animation).
function glideTo(c, r, ms) {
  const p = colrowToPixel(c, r);
  const rm = G.settings && G.settings.reduceMotion;
  if (rm) {
    G.cam.x = p.x;
    G.cam.y = p.y;
    if (typeof draw === "function") draw();
    return;
  }
  const duration = (ms && ms > 0) ? ms : 400;
  _glide = {
    fromX: G.cam.x,
    fromY: G.cam.y,
    toX: p.x,
    toY: p.y,
    start: performance.now(),
    dur: duration,
  };
}

// followAction(u) — glide to u if it is off-screen by more than 30%,
// and G.settings.follow !== false.
function followAction(u) {
  if (!u) return;
  if (G.settings && G.settings.follow === false) return;

  const p = colrowToPixel(u.c, u.r);
  const s = worldToScreen(p.x, p.y);

  const marginX = Wc * 0.30;
  const marginY = Hc * 0.30;

  const offscreen = (
    s.x < marginX || s.x > Wc - marginX ||
    s.y < marginY || s.y > Hc - marginY
  );

  if (offscreen) {
    glideTo(u.c, u.r, 320);
  }
}

// Ease function — smooth step (cubic)
function _easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RAF DRIVER
//
// Installs exactly ONE continuous rAF loop, guarded by window.__gorLoop.
// Runs at 30fps idle throttle; steps to 60fps when G.fx.length > 0 or
// G.spriteAnim is true.
// Advances active glide, calls draw() via typeof guard.
// ─────────────────────────────────────────────────────────────────────────────

if (!window.__gorLoop) {
  window.__gorLoop = true;

  let _driverLast = 0;

  function _gorDriver(ts) {
    requestAnimationFrame(_gorDriver);

    const inBattle = (G.mode === "battle");

    // Advance glide regardless of battle mode (camera may be set before mode flips)
    if (_glide) {
      const elapsed = ts - _glide.start;
      const frac = Math.min(1, elapsed / _glide.dur);
      const e = _easeInOut(frac);
      G.cam.x = _glide.fromX + (_glide.toX - _glide.fromX) * e;
      G.cam.y = _glide.fromY + (_glide.toY - _glide.fromY) * e;
      if (frac >= 1) _glide = null;
    }

    if (!inBattle) {
      _driverLast = ts;
      return;
    }

    // Determine target frame interval
    const hasFX = G.fx && G.fx.length > 0;
    const hasSprite = !!G.spriteAnim;
    const hasGlide = !!_glide;
    const targetInterval = (hasFX || hasSprite || hasGlide) ? (1000 / 60) : (1000 / 30);

    if (ts - _driverLast < targetInterval - 1) return; // throttle
    _driverLast = ts;

    // Tick legacy G.anim (kept for backward compat — flash() still pushes there)
    if (G.anim && G.anim.length) {
      for (let i = 0; i < G.anim.length; i++) G.anim[i].t--;
      G.anim = G.anim.filter(function(f) { return f.t > 0; });
    }

    if (typeof draw === "function") draw();
  }

  requestAnimationFrame(_gorDriver);
}
