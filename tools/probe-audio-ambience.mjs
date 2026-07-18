#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-audio-ambience.mjs
// Focused probe for T19 battle ambience (Phase H · H4 — audio deepening). Verifies:
//  - the module + the four by-assignment wrappers (fld3dRender/fld2dDraw/fldExit/_fldAudioPanelRows) install;
//  - DEFAULT-OFF: with no battleAmbience opt-in the layer never activates (0 reports) — the byte-identical-mix default;
//  - opt-in (sound + battleAmbience=true, no reduceMotion): the layer activates, builds its WebAudio beds,
//    and SCHEDULES located reports (the decision layer is recorded even headless), pan within [-1,1], node pool bounded;
//  - reduceMotion fully suppresses it (the calm default);
//  - FOG OF WAR: a hidden foe's located report is gated to ZERO (the same units, fog lifted, DO report — control);
//  - battleLoud="off" drives the master to silence (loud scale 0) while still "on";
//  - the sim RNG (__FIELD.seed) is UNCHANGED across the audio decision loop (T19 never calls fldRng);
//  - fldExit disposes the layer (beds stopped, pool emptied, ctx released);
//  - audio panel readability stays phone-safe after the ambience row makes the dialog taller;
//  - audio captions stay inside the viewport with readable sizing;
//  - a static source scan proves NO combat-execution file references the ambience layer.
// (The 9-baseline seed-for-seed byte-identity gate stays owned by probe-presets.)

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

/* ---------- 1) STATIC SCAN: no combat-execution file may reference the ambience layer ---------- */
function staticScan() {
  const tacDir = join(ROOT, 'src', 'tactical');
  const files = readdirSync(tacDir).filter(f => /\.js$/.test(f) && f !== 'T19-battle-ambience.js');
  const combatExtra = ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js'].map(f => join(ROOT, 'src', f));
  const all = files.map(f => join(tacDir, f)).concat(combatExtra);
  const leaks = [];
  for (const f of all) {
    let txt = ''; try { txt = readFileSync(f, 'utf8'); } catch (e) { continue; }
    if (/fldAmb|FLDAMB/.test(txt)) leaks.push(f.replace(ROOT + '/', ''));
  }
  check('static-scan: no combat/tactical file references the ambience layer', leaks.length === 0, leaks.join(', '));
  let t19 = ''; try { t19 = readFileSync(join(tacDir, 'T19-battle-ambience.js'), 'utf8'); } catch (e) {}
  check('static-scan: T19 never calls fldRng (combat determinism intact)', t19.length > 0 && !/fldRng\(/.test(t19));
  check('static-scan: T19 never writes _SAVE_VER', t19.length > 0 && !/_SAVE_VER\s*[-+]?=/.test(t19));

  // ---- GEA-09 phase 1 (D448, AUDIT-DEBT AD-15): the audio-bus contract, AUTHORED teeth ----
  // BIND A PREDECLARATION - removing T9's fldAudioBusScale("ambient") term from the dinSet call
  // must red exactly the din-tag static tooth below. BIND B PREDECLARATION - removing the T19
  // master multiply must red exactly the T19-multiply static tooth below.
  let t9 = ''; try { t9 = readFileSync(join(tacDir, 'T9-audio.js'), 'utf8'); } catch (e) {}
  let t2 = ''; try { t2 = readFileSync(join(tacDir, 'T2-campaign-link.js'), 'utf8'); } catch (e) {}
  let ar = ''; try { ar = readFileSync(join(ROOT, 'src', '87-auto-resolve.js'), 'utf8'); } catch (e) {}
  check('GEA-09 static: T9 defines the bus layer (fldAudioBusScale fail-open to 1, fldAudioMono, the fldAudioBusPlay zero-gate funnel) and seeds the four-bus + mono default shape',
    /function fldAudioBusScale/.test(t9) && /function fldAudioMono/.test(t9) && /function fldAudioBusPlay/.test(t9) &&
    /critical: 100, ambient: 100, ui: 100, narration: 100, mono: false/.test(t9));
  check('GEA-09 static: the din call site is tagged ambient with a TRUE multiplication',
    t9.indexOf('_fldAudioLoudScale() * fldAudioBusScale("ambient")') >= 0);
  check('GEA-09 static: every T9 one-shot cue call site is tagged critical through the funnel (charge bugle+sfx, punctuation, both end cues)',
    (t9.match(/fldAudioBusPlay\("critical"/g) || []).length >= 5);
  check('GEA-09 static: the T2 + auto-resolve outcome cues are tagged critical behind typeof guards (legacy fallback intact)',
    /fldAudioBusPlay\("critical", "sfx", o\.win/.test(t2) && /fldAudioBusPlay\("critical", "sfx", o\.win/.test(ar) &&
    /else playSfx\(o\.win/.test(t2) && /else playSfx\(o\.win/.test(ar));
  check('GEA-09 static: T19 multiplies its src-owned master by the ambient bus and the mono flag collapses PAN ONLY (never a gain write — downmix without silencing)',
    t19.indexOf('fldAudioBusScale === "function") ? fldAudioBusScale("ambient") : 1') >= 0 &&
    /_monoPan = \(\(typeof fldAudioMono === "function"\) && fldAudioMono\(\)\) \? 0 : pan/.test(t19));
  check('GEA-09 static: the audio panel ships four labeled bus sliders + the mono toggle',
    (t9.match(/data-abus="/g) || []).length >= 4 && t9.indexOf('"audioMono"') >= 0 && t9.indexOf('slider("Critical cues"') >= 0);
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

// GEA-09 phase 1 (D448): the audio-bus contract scene — pure settings-layer checks, no battle.
function busContractScript() {
  return `(() => {
    try {
      G.settings = G.settings || {};
      try { delete G.settings.audio; } catch (e) {}
      if (typeof fldAudioBusScale !== 'function' || typeof fldAudioBusPlay !== 'function' || typeof fldAudioMono !== 'function')
        return { ok: false, err: 'bus API missing' };
      if (fldAudioBusScale('ambient') !== 1 || fldAudioBusScale('critical') !== 1 || fldAudioBusScale('not-a-bus') !== 1)
        return { ok: false, err: 'default/unknown bus must scale 1 (fail-open)' };
      _fldAudioInitSettings();
      var a = G.settings.audio;
      if (!(a && a.critical === 100 && a.ambient === 100 && a.ui === 100 && a.narration === 100 && a.mono === false))
        return { ok: false, err: 'seed shape wrong: ' + JSON.stringify(a) };
      a.ambient = 50;
      if (Math.abs(fldAudioBusScale('ambient') - 0.5) > 1e-9) return { ok: false, err: 'ambient did not multiply' };
      if (fldAudioBusScale('critical') !== 1) return { ok: false, err: 'cross-bus leak' };
      var calls = 0, orig = window.playSfx;
      window.playSfx = function () { calls++; };
      try {
        a.critical = 0; fldAudioBusPlay('critical', 'sfx', 'charge');
        if (calls !== 0) return { ok: false, err: 'zero-gate failed' };
        a.critical = 40; fldAudioBusPlay('critical', 'sfx', 'charge');
        if (calls !== 1) return { ok: false, err: 'nonzero bus did not delegate' };
      } finally { window.playSfx = orig; }
      a.ambient = 'loud'; if (fldAudioBusScale('ambient') !== 1) return { ok: false, err: 'junk value must fail open to 1' };
      a.ambient = 250; if (fldAudioBusScale('ambient') !== 1) return { ok: false, err: 'high clamp failed' };
      a.ambient = -5; if (fldAudioBusScale('ambient') !== 0) return { ok: false, err: 'low clamp failed' };
      a.ambient = 100;
      a.mono = true; if (!fldAudioMono()) return { ok: false, err: 'mono flag unread' };
      a.mono = false;
      try { delete G.settings.audio; } catch (e) {}
      return { ok: true };
    } catch (e) { return { ok: false, err: String(e && e.message || e) }; }
  })()`;
}

// mode: 'normal' | 'default-off' | 'reduceMotion' | 'loud-off'
function driveScript(scenario, seed, mode) {
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    try {
      G.settings = G.settings || {};
      G.settings.sound = true; G.settings.music = false; G.settings.battleSfx = false;
      G.settings.gfxQuality = 'high';
      G.settings.reduceMotion = ${mode === 'reduceMotion' ? 'true' : 'false'};
      G.settings.battleLoud = ${mode === 'loud-off' ? "'off'" : "'full'"};
      if (${JSON.stringify(mode)} === 'default-off') { try { delete G.settings.battleAmbience; } catch(e){} }
      else { G.settings.battleAmbience = true; }

      var wrappers = {
        d3: typeof fld3dRender === 'function' && !!fld3dRender._amb,
        d2: typeof fld2dDraw === 'function' && !!fld2dDraw._amb,
        ex: typeof fldExit === 'function' && !!fldExit._amb,
        pr: typeof _fldAudioPanelRows === 'function' && !!_fldAudioPanelRows._amb,
        fns: ['fldAmbUpdate','fldAmbReports','fldAmbDispose','fldAmbPan','fldAmbActive'].every(function(n){ return eval('typeof '+n) === 'function'; })
      };

      fldLaunchSandbox({ renderer:'2d', scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      fldStepN(320, 0.05);
      __FIELD.paused = false;

      // realistic report drive: step the fight (advances the sim RNG — expected) between audio ticks,
      // with wall-clock waits so the report gap/cooldown timers progress and located reports accumulate.
      for (var t = 0; t < 18; t++) {
        FLDAMB.last = 0;            // bypass the wall-clock decision throttle for the test
        fldAmbUpdate();
        fldStepN(6, 0.05);          // keep the fight (and the firing state) live
        await wait(110);
      }

      // SIM-SEED ISOLATION (combat-byte-identity lock): a PURE audio-only window — no fldStepN — drives
      // fldAmbUpdate hundreds of times against the frozen firing state and asserts __FIELD.seed never moves.
      // If any audio path had reached fldRng (instead of Math.random / read-only reads), the seed would shift.
      var seedBefore = __FIELD.seed;
      for (var s2 = 0; s2 < 240; s2++) { FLDAMB.last = 0; fldAmbUpdate(); }
      var seedAfter = __FIELD.seed;

      var pansTracked = FLDAMB.pans.length;        // located reports route through a separate panner pool
      var loudAppliedMain = FLDAMB.loudApplied;    // snapshot BEFORE the edge tests below mutate it (over-silence resets it)

      // SUSPENDED-CONTEXT GATE (bug-hunt fix): a located report must NOT schedule while the AudioContext is
      // suspended (pre-gesture) — that would stampede on resume. Stub a suspended ctx and call fldAmbReports
      // directly: zero new reports AND zero new errors (the gate returns before any synth).
      var rBefore = FLDAMB.reportsScheduled, eBefore = FLDAMB.errN, realCtx = FLDAMB.ctx;
      FLDAMB.ctx = { state: 'suspended' };
      FLDAMB.lastReport = -1e7; FLDAMB.cool = Object.create(null);
      fldAmbReports(__FIELD, 0.6, fldAmbNow());
      var suspendedReports = FLDAMB.reportsScheduled - rBefore, suspendedErr = FLDAMB.errN - eBefore;
      FLDAMB.ctx = realCtx;   // restore the real running context

      // 'OVER'-SCREEN SILENCE (bug-hunt fix): once the field is decided the bed must silence (no idle-graph drain).
      FLDAMB.silenced = false; __FIELD.phase = 'over'; FLDAMB.last = 0;
      fldAmbUpdate();
      var overSilenced = FLDAMB.silenced;

      // panel row exposes the accessible toggle (segmented button, data-acb=battleAmbience)
      var panelHtml = ''; try { panelHtml = _fldAudioPanelRows(); } catch(e) {}
      var panelHasRow = panelHtml.indexOf('data-acb="battleAmbience"') >= 0;

      var cap = (typeof fldLow === 'function' && fldLow()) ? FLDAMB.CAP_LO : FLDAMB.CAP_NODES;
      return { ok:true, mode:${JSON.stringify(mode)},
        wrappers:wrappers,
        ctxPresent: !!FLDAMB.ctx, started: FLDAMB.started,
        washBuilt: FLDAMB.washBuilt, rumBuilt: FLDAMB.rumBuilt,
        reports: FLDAMB.reportsScheduled, fogGated: FLDAMB.fogGated,
        lastPan: FLDAMB.lastPan, intensity: FLDAMB.intensity, artCount: FLDAMB.artCount,
        bagLen: FLDAMB.bag.length, pansTracked: pansTracked, cap: cap, loudApplied: loudAppliedMain, errN: FLDAMB.errN,
        suspendedReports: suspendedReports, suspendedErr: suspendedErr, overSilenced: overSilenced,
        seedBefore: seedBefore, seedAfter: seedAfter, seedStable: (seedBefore === seedAfter),
        panelHasRow: panelHasRow, units: __FIELD.units.length };
    } catch(e) { return { ok:false, error:String(e && e.message || e), mode:${JSON.stringify(mode)} }; }
  })()`;
}

// Controlled FOG gate test (geometry-independent), plus disposal verification.
function fogAndDisposeScript(scenario, seed) {
  return `(async () => {
    try {
      G.settings = G.settings || {};
      G.settings.sound = true; G.settings.music = false; G.settings.battleSfx = false;
      G.settings.reduceMotion = false; G.settings.battleLoud = 'full'; G.settings.battleAmbience = true;
      fldLaunchSandbox({ renderer:'2d', scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      fldStepN(220, 0.05); __FIELD.paused = false;

      var ps = (typeof fldPlayerSide === 'function') ? fldPlayerSide() : 'US';
      // hidden enemies (LOS-blocked under fog)
      __FIELD.fog = true;
      var hidden = [];
      for (var i = 0; i < __FIELD.units.length; i++) {
        var u = __FIELD.units[i]; if (!u.alive) continue;
        if (u.side !== ps && typeof fldVisible === 'function' && !fldVisible(ps, u)) hidden.push(u);
      }
      // CONTROLLED GATE: silence EVERY unit, then force ONLY the hidden enemies to fire.
      for (var si = 0; si < __FIELD.units.length; si++) { var su = __FIELD.units[si]; su.targetId = null; su._artFlash = 0; su.ammo = su.ammo; }
      for (var fh = 0; fh < hidden.length; fh++) { var hh = hidden[fh]; hh.targetId = 'probe'; hh.ammo = 100; hh._artFlash = 0; if (hh.state === 'routing') hh.state = 'steady'; }

      // FOG ON: located reports for hidden foes must be GATED to zero.
      FLDAMB.reportsScheduled = 0; FLDAMB.fogGated = 0;
      FLDAMB.cool = Object.create(null); FLDAMB.last = 0; FLDAMB.lastReport = -1e7; __FIELD.fog = true;
      fldAmbUpdate();
      var reportsHiddenFog = FLDAMB.reportsScheduled, fogGated = FLDAMB.fogGated;

      // CONTROL: lift the fog — the very same units are now visible and DO report.
      FLDAMB.reportsScheduled = 0;
      FLDAMB.cool = Object.create(null); FLDAMB.last = 0; FLDAMB.lastReport = -1e7; __FIELD.fog = false;
      fldAmbUpdate();
      var reportsHiddenNoFog = FLDAMB.reportsScheduled;

      // DISPOSAL: fldExit must stop the beds, empty the pool, release the field ref.
      var bagBefore = FLDAMB.bag.length;
      try { fldExit(true); } catch(e) {}
      var disposed = { fieldRef: FLDAMB.fieldRef, washBuilt: FLDAMB.washBuilt, rumBuilt: FLDAMB.rumBuilt, bagLen: FLDAMB.bag.length, pansLen: FLDAMB.pans.length, started: FLDAMB.started };

      return { ok:true, hiddenCount: hidden.length, reportsHiddenFog: reportsHiddenFog, fogGated: fogGated,
        reportsHiddenNoFog: reportsHiddenNoFog, bagBefore: bagBefore, disposed: disposed, errN: FLDAMB.errN };
    } catch(e) { return { ok:false, error:String(e && e.message || e) }; }
  })()`;
}

async function runScene(page, label, fn) {
  const pageerrors = [];
  const onErr = e => pageerrors.push(String(e.message));
  page.on('pageerror', onErr);
  let d = { ok: false, error: 'not run' };
  try {
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(450);
    d = await page.evaluate(fn);
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  finally {
    try { await page.evaluate(`(() => { try { if (typeof fldExit === 'function') fldExit(true); } catch(e){} })()`); } catch (e) {}
    try { page.off('pageerror', onErr); } catch (e) {}
  }
  return { label, detail: d, pageerrors };
}

function audioReadabilityScript() {
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    function rectObj(el) {
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    }
    function inViewport(r) {
      if (!r) return false;
      var w = window.innerWidth || 0, h = window.innerHeight || 0;
      return r.left >= -1 && r.top >= -1 && r.right <= w + 1 && r.bottom <= h + 1;
    }
    function numPx(v) {
      var n = parseFloat(String(v || '').replace('px',''));
      return isFinite(n) ? n : 0;
    }
    try {
      G.settings = G.settings || {};
      G.settings.sound = true; G.settings.music = false; G.settings.battleSfx = true;
      G.settings.audioCaptions = true; G.settings.battleAmbience = true;
      G.settings.battleLoud = 'soft'; G.settings.reduceMotion = false; G.settings.gfxQuality = 'low';
      fldLaunchSandbox({ renderer:'2d', scenario:'shiloh', autoBoth:true, playerSide:'US', seed:27 });
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      if (typeof _fldAudioInjectButton === 'function') _fldAudioInjectButton();
      var audioBtn = document.getElementById('fldBtnAudio');
      if (typeof _fldAudioOpenPanel === 'function') _fldAudioOpenPanel();
      await wait(70);
      var panel = document.getElementById('fldAudioPanel');
      var card = document.getElementById('fldAudioPanelCard');
      var cs = card ? getComputedStyle(card) : null;
      var buttons = card ? Array.from(card.querySelectorAll('button')) : [];
      var rowCount = card ? card.querySelectorAll('div[role="group"]').length : 0;
      var minButtonHeight = buttons.length ? Math.min.apply(null, buttons.map(function(b){ return b.getBoundingClientRect().height; })) : 0;
      var cardRect = rectObj(card);
      var panelMetrics = {
        exists: !!(panel && card),
        rowCount: rowCount,
        buttonCount: buttons.length,
        minButtonHeight: +minButtonHeight.toFixed(1),
        cardRect: cardRect,
        cardInside: inViewport(cardRect),
        overflowY: cs ? cs.overflowY : '',
        maxHeight: cs ? cs.maxHeight : '',
        scrollHeight: card ? card.scrollHeight : 0,
        clientHeight: card ? card.clientHeight : 0,
        focusInside: panel ? panel.contains(document.activeElement) : false
      };

      if (typeof _fldAudioClosePanel === 'function') _fldAudioClosePanel();
      var focusReturned = !!(audioBtn && document.activeElement === audioBtn);
      if (typeof _fldAudioCaption === 'function') {
        _fldAudioCaption('Probe caption: cannon and musketry remain readable above the field controls.');
      }
      var cap = document.getElementById('fldAudioCap');
      var capStyle = cap ? getComputedStyle(cap) : null;
      var capRect = rectObj(cap);
      var captionMetrics = {
        exists: !!cap,
        rect: capRect,
        inside: inViewport(capRect),
        fontSize: capStyle ? numPx(capStyle.fontSize) : 0,
        lineHeight: capStyle ? numPx(capStyle.lineHeight) : 0,
        boxSizing: capStyle ? capStyle.boxSizing : '',
        maxWidth: capStyle ? capStyle.maxWidth : '',
        minWidth: capStyle ? capStyle.minWidth : '',
        opacity: capStyle ? capStyle.opacity : ''
      };
      return { ok:true, viewport:{ width:window.innerWidth, height:window.innerHeight }, panel:panelMetrics, focusReturned:focusReturned, caption:captionMetrics };
    } catch(e) {
      return { ok:false, error:String(e && e.message || e) };
    }
  })()`;
}

async function runReadabilityScene(page, label, viewport) {
  const pageerrors = [];
  const onErr = e => pageerrors.push(String(e.message));
  page.on('pageerror', onErr);
  let d = { ok: false, error: 'not run' };
  try {
    await page.setViewportSize(viewport);
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(450);
    d = await page.evaluate(audioReadabilityScript());
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  finally {
    try { await page.evaluate(`(() => { try { if (typeof fldExit === 'function') fldExit(true); } catch(e){} })()`); } catch (e) {}
    try { page.off('pageerror', onErr); } catch (e) {}
  }
  return { label, viewport, detail: d, pageerrors };
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(30000);
  const page = await ctx.newPage();
  const scenes = {};
  try {
    scenes.normal = await runScene(page, 'normal', driveScript('shiloh', 21, 'normal'));
    scenes.off = await runScene(page, 'default-off', driveScript('shiloh', 21, 'default-off'));
    scenes.rm = await runScene(page, 'reduceMotion', driveScript('shiloh', 21, 'reduceMotion'));
    scenes.loud = await runScene(page, 'loud-off', driveScript('shiloh', 21, 'loud-off'));
    scenes.fog = await runScene(page, 'fog+dispose', fogAndDisposeScript('shiloh', 21));
    scenes.panelDesktop = await runReadabilityScene(page, 'panel-desktop', { width: 960, height: 640 });
    scenes.panelPhone = await runReadabilityScene(page, 'panel-phone', { width: 390, height: 520 });
    scenes.bus = await runScene(page, 'gea09-bus', busContractScript());
  } finally { if (server) server.kill(); }

  const allPe = Object.values(scenes).reduce((a, s) => a + s.pageerrors.length, 0);
  const n = scenes.normal.detail, off = scenes.off.detail, rm = scenes.rm.detail, loud = scenes.loud.detail, fog = scenes.fog.detail;
  const pd = scenes.panelDesktop.detail, pp = scenes.panelPhone.detail;
  const bus = scenes.bus.detail || {};

  // GEA-09 phase 1 (D448): the live bus-contract scene.
  check('GEA-09 bus contract: default scales 1 (no settings -> today\'s behavior), seed shape, per-bus multiplication with no cross-bus leak, the critical zero-gate delegate, junk fail-open + clamps, the mono flag',
    bus.ok === true, bus.err || '');

  // wrappers + module present
  check('module + 4 by-assignment wrappers installed', n.ok && n.wrappers && n.wrappers.d3 && n.wrappers.d2 && n.wrappers.ex && n.wrappers.pr && n.wrappers.fns, JSON.stringify(n.wrappers || {}));
  // opt-in activates: beds built + located reports scheduled
  check('opt-in: layer activated (ensure ran — started)', n.ok && n.started === true, 'started=' + (n && n.started) + ' ctx=' + (n && n.ctxPresent));
  check('opt-in: WebAudio beds (wash + cannonade) built', n.ok && n.washBuilt === true && n.rumBuilt === true, 'wash=' + (n && n.washBuilt) + ' rum=' + (n && n.rumBuilt));
  check('opt-in: located reports SCHEDULED during the fight', n.ok && n.reports > 0, 'reports=' + (n && n.reports) + ' intensity=' + (n && (n.intensity || 0).toFixed(3)));
  check('opt-in: stereo pan within [-1,1]', n.ok && typeof n.lastPan === 'number' && n.lastPan >= -1 && n.lastPan <= 1, 'lastPan=' + (n && n.lastPan));
  check('opt-in: transient SOURCE pool within the cap', n.ok && n.bagLen <= n.cap, 'bagLen=' + (n && n.bagLen) + ' cap=' + (n && n.cap));
  check('opt-in: located reports route through the separate panner pool (cap not diluted)', n.ok && n.pansTracked > 0, 'pansTracked=' + (n && n.pansTracked));
  check('bug-hunt fix: SUSPENDED context defers reports (no stampede) — 0 reports, 0 errors', n.ok && n.suspendedReports === 0 && n.suspendedErr === 0, 'suspendedReports=' + (n && n.suspendedReports) + ' suspendedErr=' + (n && n.suspendedErr));
  check('bug-hunt fix: bed self-silences on the \'over\' screen (no idle-graph drain)', n.ok && n.overSilenced === true, 'overSilenced=' + (n && n.overSilenced));
  check('opt-in: sim seed UNCHANGED across the audio decision loop (no fldRng)', n.ok && n.seedStable, (n && n.seedBefore) + ' -> ' + (n && n.seedAfter));
  check('opt-in: no internal audio errors (errN===0)', n.ok && n.errN === 0, 'errN=' + (n && n.errN));
  // accessible panel row
  check('accessible toggle row appended to the audio panel', n.ok && n.panelHasRow === true, 'panelHasRow=' + (n && n.panelHasRow));
  // DEFAULT-OFF: the byte-identical-mix default — never activates
  check('DEFAULT-OFF: no opt-in => layer never activates (0 reports)', off.ok && off.started === false && off.reports === 0, 'started=' + (off && off.started) + ' reports=' + (off && off.reports));
  // reduceMotion fully suppresses
  check('reduceMotion: fully suppressed (0 reports, not started)', rm.ok && rm.reports === 0 && rm.started === false, 'reports=' + (rm && rm.reports) + ' started=' + (rm && rm.started));
  // loud-off drives master silent while still on
  check('battleLoud="off": master driven silent (loud scale 0) while active', loud.ok && loud.loudApplied === 0, 'loudApplied=' + (loud && loud.loudApplied) + ' started=' + (loud && loud.started));
  // FOG OF WAR gate
  check('fog: scene meaningful (≥1 hidden enemy; same units report when fog lifts — control)',
    fog.ok && fog.hiddenCount > 0 && fog.reportsHiddenNoFog > 0, fog.ok ? ('hidden=' + fog.hiddenCount + ' noFogReports=' + fog.reportsHiddenNoFog) : 'no fog data');
  check('fog: ZERO located report from a hidden enemy (gated — no position betrayal)',
    fog.ok && fog.reportsHiddenFog === 0 && fog.fogGated > 0, fog.ok ? ('hiddenFogReports=' + fog.reportsHiddenFog + ' gated=' + fog.fogGated) : 'no fog data');
  // disposal
  check('fldExit disposes the layer (beds stopped, pool emptied, ref released)',
    fog.ok && fog.disposed && fog.disposed.fieldRef === null && fog.disposed.washBuilt === false && fog.disposed.rumBuilt === false && fog.disposed.bagLen === 0 && fog.disposed.pansLen === 0,
    fog.ok ? JSON.stringify(fog.disposed) : 'no dispose data');
  // audio readability polish: the taller ambience-enabled panel must fit/scroll on phone, and captions must stay legible.
  check('audio panel readability: desktop exposes all audio rows and 32px+ controls',
    pd.ok && pd.panel && pd.panel.exists && pd.panel.rowCount >= 6 && pd.panel.buttonCount >= 14 && pd.panel.minButtonHeight >= 32 && pd.panel.cardInside && pd.panel.focusInside,
    pd.ok ? JSON.stringify(pd.panel) : 'no desktop panel data');
  check('audio panel readability: phone card stays in viewport with an overflow guard',
    pp.ok && pp.panel && pp.panel.exists && pp.panel.rowCount >= 6 && pp.panel.buttonCount >= 14 && pp.panel.cardInside && pp.panel.overflowY === 'auto' && pp.panel.maxHeight !== 'none',
    pp.ok ? JSON.stringify(pp.panel) : 'no phone panel data');
  check('audio panel readability: close returns focus to the toolbar button',
    pd.ok && pp.ok && pd.focusReturned === true && pp.focusReturned === true,
    'desktop=' + (pd && pd.focusReturned) + ' phone=' + (pp && pp.focusReturned));
  check('audio caption readability: desktop and phone captions stay inside viewport',
    pd.ok && pp.ok && pd.caption && pp.caption && pd.caption.inside && pp.caption.inside,
    'desktop=' + JSON.stringify(pd && pd.caption) + ' phone=' + JSON.stringify(pp && pp.caption));
  check('audio caption readability: caption uses readable sizing and border-box wrapping',
    pd.ok && pp.ok && pd.caption && pp.caption && pd.caption.fontSize >= 13 && pp.caption.fontSize >= 13 && pd.caption.lineHeight >= 17 && pp.caption.lineHeight >= 17 && pd.caption.boxSizing === 'border-box' && pp.caption.boxSizing === 'border-box',
    'desktop=' + JSON.stringify(pd && pd.caption) + ' phone=' + JSON.stringify(pp && pp.caption));
  // no pageerrors
  check('zero pageerrors across all scenes', allPe === 0, 'pageerrors=' + allPe);

  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), passed: steps.filter(s => s.ok).length, total: steps.length, steps, scenes };
  writeFileSync(join(OUT, 'probe-audio-ambience.json'), JSON.stringify(out, null, 2));
  console.log('probe-audio-ambience ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
