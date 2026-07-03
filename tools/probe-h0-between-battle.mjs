#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused H0 between-battle probe: strategic-turn command shell, responsive
// layout, preserved ids, and Continue / Desk / Briefing wiring.
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

async function openInterstitial(page, withOffer = false) {
  await page.evaluate((offer) => {
    G.campaign = { side: 'US', iron: false, idx: 1, funds: 720, recovery: false, completed: ['sumter'],
      roster: [{ id: 'R1', type: 'inf', weapon: 'springfield', xp: 2, name: null }], nextId: 2,
      stats: { battles: 3, won: 2, infl: 300, suff: 1500 }, recoveryLossCount: 0,
      recoveryMode: false, flipAtk: false, captured: [] };
    const C = G.campaign;
    if (typeof _t1InitAll === 'function') _t1InitAll(C);
    if (typeof presOnResolve === 'function') {
      presOnResolve('US', 'win', { bd: { name: 'Bull Run', year: 1861 } }, C, true);
      presOnResolve('US', 'loss', { bd: { name: "Ball's Bluff", year: 1861 } }, C, false);
    }
    if (offer) C.strategy.victoryReady = 'will';
    window._pdTurnAck = false;
    openUpgrade();
  }, withOffer);
  await page.waitForTimeout(400);
}

async function inspectInterstitial(page, viewportName) {
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
    const shell = sel('.h0i-shell');
    if (!shell) {
      fail('missing .h0i-shell');
      return R;
    }
    const cssText = (document.getElementById('h0BetweenBattleCss') || {}).textContent || '';
    R.checks.noBroadsheetClass = !shell.classList.contains('gn-paper') && !sel('.h0i-shell .gn-paper');
    if (!R.checks.noBroadsheetClass) fail('interstitial shell still uses .gn-paper');
    R.checks.noSerifShellFont = cssText.indexOf('Iowan Old Style') < 0 && cssText.indexOf('Palatino') < 0 && cssText.indexOf('Georgia,serif') < 0;
    if (!R.checks.noSerifShellFont) fail('H0 interstitial CSS carries broadsheet serif stack');
    R.checks.commandTexture = cssText.indexOf('repeating-linear-gradient') >= 0;
    if (!R.checks.commandTexture) fail('command-grid texture missing');
    const bg = getComputedStyle(shell).backgroundImage + '|' + getComputedStyle(shell).backgroundColor;
    R.checks.darkShell = /linear-gradient|rgb/.test(bg) && !/246, 235, 215/.test(bg);
    if (!R.checks.darkShell) fail('interstitial shell appears parchment/light');

    const text = shell.textContent || '';
    ['Strategic Turn', 'Latest Dispatch', 'The army you will field', 'Review the War Effort', 'Pre-Battle Briefing', 'Continue'].forEach(txt => {
      if (text.indexOf(txt) < 0) fail('interstitial missing ' + txt);
    });
    ['#pdGoDesk', '#pdGoBrief', '#pdGoOn'].forEach(id => { if (!sel(id)) fail('missing preserved action id ' + id); });
    R.checks.panels = all('.h0i-panel').length >= 2 && all('.h0i-chip').length >= 3 && !!(sel('.h0i-scene') || sel('.h0i-map-fallback'));
    if (!R.checks.panels) fail('interstitial panels/chips/scene incomplete');

    const sr = rect(shell);
    all('.h0i-panel,.h0i-chip,.h0i-metric,.h0i-actions button,.h0i-scene,.h0i-map-fallback').forEach((el, i) => {
      const r = rect(el);
      if (r.w < 24 || r.h < 24) fail('too-small interstitial element ' + i + ' ' + (el.id || el.className));
      if (r.x < sr.x - 2 || r.right > sr.right + 2) fail('interstitial element escapes shell bounds ' + (el.id || el.className));
    });
    const panels = all('.h0i-grid > .h0i-panel');
    for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) if (overlaps(panels[i], panels[j])) fail('interstitial panels overlap at ' + vp);
    // S02 (D232): the army panel spans the full grid row — the default no-decision state must not strand it
    // in one column with the right half of the frame empty.
    const army = sel('.h0i-army'), grid = sel('.h0i-grid');
    if (army && grid) {
      const aw = rect(army).w, gw = rect(grid).w;
      R.checks.armySpansGrid = aw >= gw - 30;
      if (!R.checks.armySpansGrid) fail('army panel does not span the interstitial grid (army=' + Math.round(aw) + ' grid=' + Math.round(gw) + ')');
    } else fail('missing .h0i-army/.h0i-grid for the span check');
    const cont = sel('#pdGoOn');
    if (cont) {
      cont.focus();
      const cs = getComputedStyle(cont);
      R.checks.visibleFocus = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') >= 2;
      if (!R.checks.visibleFocus) fail('focused Continue has no visible outline');
    }
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
      if (!sel('.h0i-shell')) return { checks: {}, failures: ['no interstitial before wiring'] };
      const brief = sel('#pdGoBrief');
      if (!brief) fail('missing #pdGoBrief before click');
      else {
        brief.click();
        R.checks.briefOpens = !!sel('.h0-brief-shell') && !!sel('#brgBack') && !!sel('#brgToField');
        if (!R.checks.briefOpens) fail('Pre-Battle Briefing did not open H0 briefing');
        const back = sel('#brgBack');
        if (back) back.click();
        R.checks.briefBackReturns = !!sel('.h0i-shell') && !!sel('#pdGoOn');
        if (!R.checks.briefBackReturns) fail('Briefing Back did not return to interstitial');
      }
      const desk = sel('#pdGoDesk');
      if (!desk) fail('missing #pdGoDesk before click');
      else {
        desk.click();
        R.checks.deskOpens = !!sel('.h0-desk-shell') && !!sel('#wdClose');
        if (!R.checks.deskOpens) fail('Review the War Effort did not open H0 Desk');
        const close = sel('#wdClose');
        if (close) close.click();
        const title = (sel('.title-xl') || {}).textContent || '';
        R.checks.deskCloseContinues = !!sel('#ugFunds') || title.indexOf('Winter Quarters') >= 0;
        if (!R.checks.deskCloseContinues) fail('Desk Close did not continue to Quartermaster');
      }
      window._pdTurnAck = false;
      openUpgrade();
      const go = sel('#pdGoOn');
      if (!go) fail('missing #pdGoOn before click');
      else {
        go.click();
        const title = (sel('.title-xl') || {}).textContent || '';
        R.checks.continueOpensQuartermaster = !!sel('#ugFunds') || title.indexOf('Winter Quarters') >= 0;
        if (!R.checks.continueOpensQuartermaster) fail('Continue did not open Quartermaster');
      }
    } catch (e) { fail('fatal wiring check: ' + String(e && e.message || e)); }
    return R;
  });
}

async function inspectOffer(page) {
  await openInterstitial(page, true);
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const offer = document.getElementById('pdConcludeWar');
    R.checks.offerPresent = !!offer;
    if (!offer) fail('strategic-end offer missing #pdConcludeWar');
    else {
      R.checks.reason = offer.getAttribute('data-reason') === 'will';
      if (!R.checks.reason) fail('pdConcludeWar missing data-reason will');
      const h = document.querySelector('.h0i-offer');
      R.checks.copy = !!h && (h.textContent || '').indexOf('The war can be concluded') >= 0;
      if (!R.checks.copy) fail('offer copy missing');
      R.checks.noLiteralEntity = !!h && (h.textContent || '').indexOf('&mdash;') < 0 && (offer.textContent || '').indexOf('&mdash;') < 0;
      if (!R.checks.noLiteralEntity) fail('offer rendered literal &mdash; text');
    }
    return R;
  });
}

async function runViewport(browser, vp) {
  const pageerrors = [];
  const page = await bootPage(browser, vp, pageerrors);
  try {
    await openInterstitial(page, false);
    const interstitial = await inspectInterstitial(page, vp.name);
    await page.evaluate(() => { const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; });
    await withTimeout('interstitial screenshot ' + vp.name, page.screenshot({ path: join(OUT, `probe-h0-between-battle-${vp.name}.png`), fullPage: false, timeout: 90000 }), 95000);
    let wiring = { checks: {}, failures: [] };
    let offer = { checks: {}, failures: [] };
    if (vp.name === 'desktop') {
      wiring = await inspectWiring(page);
      await openInterstitial(page, false);
      offer = await inspectOffer(page);
      await withTimeout('offer screenshot ' + vp.name, page.screenshot({ path: join(OUT, 'probe-h0-between-battle-offer-desktop.png'), fullPage: false, timeout: 90000 }), 95000);
    }
    return { viewport: vp.name, interstitial, wiring, offer, pageerrors };
  } finally {
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
      const failures = [...(r.interstitial.failures || []), ...(r.wiring.failures || []), ...(r.offer.failures || [])];
      if (failures.length || (r.pageerrors && r.pageerrors.length)) result.ok = false;
      if (r.pageerrors && r.pageerrors.length) result.pageerrors.push({ viewport: vp.name, pageerrors: r.pageerrors });
    }
  } catch (e) {
    result.ok = false;
    result.fatal = String(e && e.message || e);
  } finally {
    try { await withTimeout('browser.close', browser.close(), 5000); } catch (e) {}
    if (srv) srv.kill();
    writeFileSync(join(OUT, 'probe-h0-between-battle.json'), JSON.stringify(result, null, 2));
  }

  const failures = [];
  for (const p of result.probes || []) {
    for (const f of p.interstitial.failures || []) failures.push(p.viewport + ' interstitial: ' + f);
    for (const f of p.wiring.failures || []) failures.push(p.viewport + ' wiring: ' + f);
    for (const f of p.offer.failures || []) failures.push(p.viewport + ' offer: ' + f);
  }
  if (result.ok) {
    console.log('H0 BETWEEN BATTLE OK ' + (result.probes || []).length + '/' + (result.probes || []).length + ' pageerrors=0');
    process.exit(0);
  }
  console.error('H0 BETWEEN BATTLE FAIL');
  if (result.fatal) console.error('FATAL ' + result.fatal);
  if (failures.length) console.error(failures.join('\n'));
  if (result.pageerrors && result.pageerrors.length) console.error(JSON.stringify(result.pageerrors));
  process.exit(1);
})();
