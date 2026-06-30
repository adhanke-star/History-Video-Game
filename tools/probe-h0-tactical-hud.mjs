#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused H0 tactical probe: field HUD/settings command shell, responsive layout,
// preserved tactical control ids, selected-unit meters, and drawer wiring.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }
async function withTimeout(label, promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms); })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function closePage(page) {
  try { await withTimeout('page.close', page.close({ runBeforeUnload: false }), 2500); } catch (e) {}
}

const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 850 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 390, height: 820 },
];

async function bootPage(browser, viewport, pageerrors) {
  const page = await withTimeout('browser.newPage', browser.newPage({ viewport }), 8000);
  page.on('pageerror', e => pageerrors.push(String(e.message || e)));
  page.on('console', msg => {
    if (msg.type() === 'error' && !/Failed to load resource.*404/.test(msg.text())) pageerrors.push('console:' + msg.text());
  });
  await page.addInitScript(() => {
    try {
      localStorage.setItem('gor_welcomed', '1');
      localStorage.setItem('gor_tutorial_seen', '1');
      localStorage.removeItem('gor_save');
    } catch (e) {}
  });
  await page.goto(`${cfg.baseUrl}/${cfg.file}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  return page;
}

async function openField(page) {
  await page.evaluate(() => {
    G.settings = G.settings || {};
    G.settings.gfx = 'classic';
    delete G.settings.tacticalFog;
    fldLaunchSandbox({ renderer: '2d', scenario: 'bullrun1', seed: 42 });
    __FIELD.phase = 'battle';
    __FIELD.paused = true;
    fldStepN(260, 0.05);
    fld2dDraw();
    fldRenderTop();
    fldRenderHud();
  });
  await page.waitForTimeout(350);
}

async function inspectShell(page, viewportName) {
  return await page.evaluate((vp) => {
    const R = { viewport: vp, checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
    const all = s => Array.from(document.querySelectorAll(s));
    const rect = el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
    };
    function overlaps(a, b) {
      const ar = rect(a), br = rect(b);
      return ar.x < br.right - 1 && ar.right > br.x + 1 && ar.y < br.bottom - 1 && ar.bottom > br.y + 1;
    }
    const root = sel('#fldRoot');
    if (!root) {
      fail('missing #fldRoot');
      return R;
    }
    const top = sel('#fldTop'), hud = sel('#fldHud'), bar = sel('#fldBar'), key = sel('#fldElevLegend');
    if (!top || !hud || !bar) fail('missing top/hud/bar');
    R.checks.h0Class = root.classList.contains('h0f-root') && !!sel('#h0TacticalHudCss');
    if (!R.checks.h0Class) fail('H0 tactical class/css missing');
    const cssText = (sel('#h0TacticalHudCss') || {}).textContent || '';
    R.checks.commandTexture = cssText.indexOf('repeating-linear-gradient') >= 0;
    if (!R.checks.commandTexture) fail('command texture missing');
    const rootFont = getComputedStyle(root).fontFamily;
    const btnFont = getComputedStyle(sel('#fldBtnSettings') || bar).fontFamily;
    const keyFont = key ? getComputedStyle(key).fontFamily : '';
    const keyBtnFont = sel('#fldElevMode,#fldElevExpand') ? getComputedStyle(sel('#fldElevMode,#fldElevExpand')).fontFamily : '';
    R.checks.noBroadsheetFont = !/Georgia|Iowan|Palatino/i.test(rootFont + '|' + btnFont + '|' + keyFont + '|' + keyBtnFont);
    if (!R.checks.noBroadsheetFont) fail('tactical shell still computes broadsheet font: ' + rootFont + ' / ' + btnFont + ' / ' + keyFont + ' / ' + keyBtnFont);
    const bg = getComputedStyle(root).backgroundColor + '|' + getComputedStyle(root).backgroundImage;
    R.checks.darkShell = !/246, 235, 215/.test(bg);
    if (!R.checks.darkShell) fail('tactical root appears parchment/light');

    ['#fldBtnPlay', '#fldBtnSpd', '#fldBtnLine', '#fldBtnCol', '#fldBtnCharge', '#fldBtnHold', '#fldBtnFog', '#fldBtnAuto', '#fldBtnSettings', '#fldBtnExit'].forEach(id => {
      if (!sel(id)) fail('missing preserved tactical control ' + id);
    });
    if (sel('#fldBtnFog') && sel('#fldBtnFog').getAttribute('aria-pressed') == null) fail('fog control missing aria-pressed');
    if (sel('#fldBtnAuto') && sel('#fldBtnAuto').getAttribute('aria-pressed') == null) fail('auto control missing aria-pressed');

    const vw = window.innerWidth, vh = window.innerHeight;
    [top, hud, bar, key].filter(Boolean).forEach(el => {
      const r = rect(el);
      if (r.w < 40 || r.h < 24) fail('too-small tactical element ' + el.id);
      if (r.x < -2 || r.right > vw + 2 || r.y < -2 || r.bottom > vh + 2) fail('tactical element escapes viewport ' + el.id + ' ' + JSON.stringify(r));
    });
    if (top && hud && overlaps(top, hud)) fail('top overlaps hud at ' + vp);
    if (top && bar && overlaps(top, bar)) fail('top overlaps controls at ' + vp);
    if (hud && bar && overlaps(hud, bar)) fail('hud overlaps controls at ' + vp);
    if (key && bar && overlaps(key, bar)) fail('terrain key overlaps controls at ' + vp);
    if (key && hud && overlaps(key, hud)) fail('terrain key overlaps hud at ' + vp);
    const play = sel('#fldBtnPlay');
    if (play && bar) {
      const pr = rect(play), br = rect(bar);
      R.checks.primaryControlVisible = pr.y >= br.y - 1 && pr.bottom <= br.bottom + 1 && pr.x >= br.x - 1 && pr.right <= br.right + 1;
      if (!R.checks.primaryControlVisible) fail('primary play control clipped at ' + vp + ' ' + JSON.stringify(pr) + ' in ' + JSON.stringify(br));
    }

    const settings = sel('#fldBtnSettings');
    if (settings) {
      settings.focus();
      const cs = getComputedStyle(settings);
      R.checks.visibleFocus = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') >= 2;
      if (!R.checks.visibleFocus) fail('settings button has no visible focus outline');
    }

    const ps = (typeof fldPlayerSide === 'function') ? fldPlayerSide() : 'US';
    const u = __FIELD.units.find(x => x && x.side === ps && x.alive && !x.ai);
    if (u) {
      __FIELD.sel = [u.id];
      fldRenderHud();
      R.checks.selectedMeters = all('#fldHud .h0f-meter').length >= 4 && /Men|Morale|Fatigue|Ammo/.test(sel('#fldHud').textContent || '');
      if (!R.checks.selectedMeters) fail('selected HUD missing H0 meters');
    } else fail('no selectable player unit for HUD check');
    R.checks.core = true;
    return R;
  }, viewportName);
}

async function inspectWiring(page) {
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
    try {
      const fog = sel('#fldBtnFog');
      if (!fog) fail('no #fldBtnFog');
      else {
        const before = fog.getAttribute('aria-pressed');
        fog.click();
        R.checks.fogToggles = fog.getAttribute('aria-pressed') !== before;
        if (!R.checks.fogToggles) fail('fog button did not toggle aria-pressed');
      }
      const auto = sel('#fldBtnAuto');
      if (!auto) fail('no #fldBtnAuto');
      else {
        const before = auto.getAttribute('aria-pressed');
        auto.click();
        R.checks.autoToggles = auto.getAttribute('aria-pressed') !== before;
        if (!R.checks.autoToggles) fail('auto-pause button did not toggle aria-pressed');
      }
      const settings = sel('#fldBtnSettings');
      if (!settings) fail('no #fldBtnSettings');
      else {
        settings.click();
        const d = sel('#fldDrawer');
        const card = sel('.h0f-drawer-card');
        R.checks.drawerOpens = !!d && d.getAttribute('role') === 'dialog' && !!card;
        if (!R.checks.drawerOpens) fail('settings drawer did not open as H0 dialog');
        ['#fldDrawerFog', '#fldDrawerAuto', '#fldDrawerElev', '#fldDrawerSpd', '#fldDrawerDone', '#fldDrawerClose'].forEach(id => {
          if (!sel(id)) fail('drawer missing ' + id);
        });
        const spd = sel('#fldDrawerSpd');
        const oldSpeed = __FIELD.speed;
        if (spd) spd.click();
        R.checks.drawerSpeedCycles = __FIELD.speed !== oldSpeed;
        if (!R.checks.drawerSpeedCycles) fail('drawer speed did not cycle');
        const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
        sel('#fldDrawer').dispatchEvent(ev);
        R.checks.escapeClosesDrawer = !sel('#fldDrawer') && !!sel('#fldRoot') && __FIELD.phase === 'battle';
        if (!R.checks.escapeClosesDrawer) fail('Escape did not close drawer while preserving battle');
      }
    } catch (e) { fail('fatal wiring check: ' + String(e && e.message || e)); }
    return R;
  });
}

async function runViewport(browser, vp) {
  const pageerrors = [];
  const page = await bootPage(browser, vp, pageerrors);
  try {
    await openField(page);
    const shell = await inspectShell(page, vp.name);
    let wiring = { checks: {}, failures: [] };
    if (vp.name === 'desktop') wiring = await inspectWiring(page);
    await withTimeout('field screenshot ' + vp.name, page.screenshot({ path: join(OUT, `probe-h0-tactical-hud-${vp.name}.png`), fullPage: false, timeout: 90000 }), 95000);
    return { viewport: vp.name, shell, wiring, pageerrors };
  } finally {
    try { await page.evaluate(() => { if (typeof fldExit === 'function') fldExit(true); }); } catch (e) {}
    await closePage(page);
  }
}

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) {
    srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 70; i++) { if (await up(probe)) break; await sleep(120); }
  }
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
  catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }

  const result = { ok: true, probes: [], pageerrors: [] };
  try {
    for (const vp of VIEWPORTS) {
      const r = await withTimeout('viewport ' + vp.name, runViewport(browser, vp), 190000);
      result.probes.push(r);
      const failures = [...(r.shell.failures || []), ...(r.wiring.failures || [])];
      if (failures.length || (r.pageerrors && r.pageerrors.length)) result.ok = false;
      if (r.pageerrors && r.pageerrors.length) result.pageerrors.push({ viewport: vp.name, pageerrors: r.pageerrors });
    }
  } catch (e) {
    result.ok = false;
    result.fatal = String(e && e.message || e);
  } finally {
    try { await withTimeout('browser.close', browser.close(), 5000); } catch (e) {}
    if (srv) srv.kill();
    writeFileSync(join(OUT, 'probe-h0-tactical-hud.json'), JSON.stringify(result, null, 2));
  }

  const failures = [];
  for (const p of result.probes || []) {
    for (const f of p.shell.failures || []) failures.push(p.viewport + ' shell: ' + f);
    for (const f of p.wiring.failures || []) failures.push(p.viewport + ' wiring: ' + f);
  }
  if (result.ok) {
    console.log('H0 TACTICAL HUD OK ' + (result.probes || []).length + '/' + (result.probes || []).length + ' pageerrors=0');
    process.exit(0);
  }
  console.error('H0 TACTICAL HUD FAIL');
  if (result.fatal) console.error('fatal: ' + result.fatal);
  for (const f of failures) console.error(' - ' + f);
  if (result.pageerrors && result.pageerrors.length) console.error('pageerrors: ' + JSON.stringify(result.pageerrors));
  process.exit(1);
})();
