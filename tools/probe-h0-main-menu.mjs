#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused H0 main-menu probe: modern command shell, responsive layout,
// keyboard focus, injected menu tools, saved-campaign War Department path.
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
/* Slow-Mac budget profile (D232) — the probe-h0-president-desk SLOW_MAC pattern. The multi-MB single-file
   page can take far longer than the old 8s/75s budgets to boot on the 8 GB Intel Mac under load; the probe
   was failing on DIFFERENT scenes run-to-run (a resource flake, pre-existing at D231), never on content.
   Assertions are unchanged — only the harness budgets are raised to the profile the desk probe already uses. */
const SLOW_MAC = {
  pageClose: 10000,
  newPage: 30000,
  nav: 150000,
  settle: 1400,
  screenshot: 300000,
  sceneBound: 420000,
  browserClose: 15000
};
async function closePage(page) {
  try { await withTimeout('page.close', page.close({ runBeforeUnload: false }), SLOW_MAC.pageClose); } catch (e) {}
}

const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 850 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 390, height: 820 },
];

async function bootPage(browser, viewport, pageerrors) {
  const page = await withTimeout('browser.newPage', browser.newPage({ viewport }), SLOW_MAC.newPage);
  page.setDefaultTimeout(SLOW_MAC.nav);
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
  await page.goto(`${cfg.baseUrl}/${cfg.file}`, { waitUntil: 'domcontentloaded', timeout: SLOW_MAC.nav });
  await page.waitForTimeout(SLOW_MAC.settle);
  await page.evaluate(() => { try { G.campaign = null; localStorage.removeItem('gor_save'); openMainMenu(); } catch (e) { throw e; } });
  await page.waitForTimeout(SLOW_MAC.settle);
  return page;
}

async function inspectMenu(page, viewportName) {
  return await page.evaluate((vp) => {
    const R = { viewport: vp, checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
    const all = s => Array.from(document.querySelectorAll(s));
    const rect = el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
    };
    const menu = sel('.h0-menu');
    if (!menu) {
      fail('missing .h0-menu');
      return R;
    }
    R.checks.noBroadsheetClass = !menu.classList.contains('gn-paper');
    if (!R.checks.noBroadsheetClass) fail('visible menu still uses .gn-paper');
    const cssText = (document.getElementById('h0MainMenuCss') || {}).textContent || '';
    R.checks.noSerifMenuFont = cssText.indexOf('Iowan Old Style') < 0 && cssText.indexOf('Palatino') < 0 && cssText.indexOf('Georgia,serif') < 0;
    if (!R.checks.noSerifMenuFont) fail('H0 CSS still carries broadsheet serif font stack');
    R.checks.hasGridOverlay = cssText.indexOf('repeating-linear-gradient') >= 0;
    if (!R.checks.hasGridOverlay) fail('modern command-grid texture missing');
    R.checks.noSwordGlyphCards = all('.h0-menu .h0-card-icon').every(el => (el.textContent || '').trim() !== '\u2694');
    if (!R.checks.noSwordGlyphCards) fail('H0 cards still depend on the old sword glyph');

    ['#gnNewUS', '#gnNewCS', '#gnFree', '#gnSettings', '#gnLoad'].forEach(id => {
      if (!sel(id)) fail('missing core button ' + id);
    });
    ['#fldSandboxBtn', '#fldPresetBtn', '#fldCustomBuilderBtn', '#gnPlayStyle', '#gnA11y', '#gnHelp', '#gnTour'].forEach(id => {
      if (!sel(id)) fail('missing injected menu tool ' + id);
    });
    const injected = all('.h0-menu .gn-btn:not(.h0-card)');
    const oldGlyphs = injected
      .map(btn => ((btn.querySelector('.gn-hl') || {}).textContent || '').trim())
      .filter(txt => /^[\u2694\u2699\u2605\u267f]/.test(txt));
    R.checks.injectedLabelsPolished = injected.length > 0 && oldGlyphs.length === 0 && injected.every(btn => !!btn.querySelector('.h0-injected-icon'));
    if (!R.checks.injectedLabelsPolished) fail('injected menu labels still use old visible glyph treatment');

    const panel = sel('.h0-panel');
    if (panel) {
      const bg = getComputedStyle(panel).backgroundImage + '|' + getComputedStyle(panel).backgroundColor;
      R.checks.darkCommandPanel = /rgb|linear-gradient/.test(bg) && !/246, 235, 215/.test(bg) && !/245, 237, 214/.test(bg);
      if (!R.checks.darkCommandPanel) fail('panel appears parchment/light instead of command-dark');
    }

    // S03+S11 (D232): the menu shares the six-shell accent system — green/red/muted match the values the
    // other five H0 shells standardized on (the old #4f8064/#aa5148 pair visibly drifted on the first screen).
    const mcs = getComputedStyle(menu);
    const tok = p => (mcs.getPropertyValue(p) || '').trim().toLowerCase();
    R.checks.sharedAccentTokens = tok('--h0-green') === '#5f9273' && tok('--h0-red') === '#b35a50' && tok('--h0-muted') === '#c5cdc3';
    if (!R.checks.sharedAccentTokens) fail('menu accent tokens drift from the shared H0 palette: green=' + tok('--h0-green') + ' red=' + tok('--h0-red') + ' muted=' + tok('--h0-muted'));
    // S05 (D232): the action grid absorbs the leftover column height (no stranded void in the no-save state).
    const actions = sel('.h0-command .h0-actions');
    if (actions) {
      R.checks.actionsFillColumn = getComputedStyle(actions).flexGrow === '1';
      if (!R.checks.actionsFillColumn) fail('command action grid does not absorb the column height (flexGrow=' + getComputedStyle(actions).flexGrow + ')');
    } else fail('missing .h0-command .h0-actions');

    const mr = rect(menu);
    const important = all('.h0-panel,.h0-menu .gn-btn,.h0-chip,.h0-hero-figure');
    important.forEach((el, i) => {
      const r = rect(el);
      if (r.w < 24 || r.h < 24) fail('too-small element ' + i + ' ' + (el.id || el.className));
      if (r.x < mr.x - 2 || r.right > mr.right + 2) {
        fail('element escapes menu horizontal bounds ' + (el.id || el.className));
      }
    });

    function overlaps(a, b) {
      const ar = rect(a), br = rect(b);
      return ar.x < br.right - 1 && ar.right > br.x + 1 && ar.y < br.bottom - 1 && ar.bottom > br.y + 1;
    }
    const topPanels = all('.h0-top > .h0-panel');
    for (let i = 0; i < topPanels.length; i++) {
      for (let j = i + 1; j < topPanels.length; j++) {
        if (overlaps(topPanels[i], topPanels[j])) fail('top panels overlap at ' + vp);
      }
    }
    all('.h0-actions,.gn-classifieds').forEach(group => {
      const kids = Array.from(group.children).filter(el => el.matches && el.matches('button'));
      for (let i = 0; i < kids.length; i++) {
        for (let j = i + 1; j < kids.length; j++) {
          if (overlaps(kids[i], kids[j])) fail('buttons overlap in ' + vp + ': ' + (kids[i].id || i) + '/' + (kids[j].id || j));
        }
      }
    });

    const free = sel('#gnFree');
    if (free) {
      free.focus();
      const cs = getComputedStyle(free);
      R.checks.visibleFocus = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') >= 2;
      if (!R.checks.visibleFocus) fail('focused #gnFree has no visible outline');
      const hl = free.querySelector('.gn-hl');
      if (hl) {
        const hcs = getComputedStyle(hl);
        R.checks.focusTitleModern = hcs.textDecorationLine === 'none' && hcs.color !== 'rgb(122, 92, 42)';
        if (!R.checks.focusTitleModern) fail('focused #gnFree title inherited old broadsheet hover/focus treatment');
      }
    }
    R.checks.core = true;
    return R;
  }, viewportName);
}

async function inspectSavedCampaign(page) {
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    try {
      G.campaign = { side: 'US', iron: false, idx: 1, funds: 500, recovery: false, completed: ['sumter'],
        roster: [{ id: 'R1', type: 'inf', weapon: 'springfield', xp: 2, name: null }], nextId: 2,
        stats: { battles: 2, won: 1, infl: 300, suff: 1500 }, recoveryLossCount: 0, recoveryMode: false, flipAtk: false, captured: [] };
      if (typeof _t1InitAll === 'function') _t1InitAll(G.campaign);
      saveLocal();
      openMainMenu();
      R.checks.continuePresent = !!document.getElementById('gnContinue');
      R.checks.warDeptPresent = !!document.getElementById('gnWarDept');
      if (!R.checks.continuePresent) fail('missing Continue with saved campaign');
      if (!R.checks.warDeptPresent) fail('missing War Department with saved campaign');
      const wd = document.getElementById('gnWarDept');
      if (wd) wd.click();
      R.checks.warDeptOpened = !!document.getElementById('wdTabs');
      if (!R.checks.warDeptOpened) fail('War Department did not open');
    } catch (e) { fail('fatal saved-campaign check: ' + String(e && e.message || e)); }
    return R;
  });
}

async function inspectCoreButtonActions(page) {
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
    try {
      if (!sel('.h0-menu')) openMainMenu();
      const us = sel('#gnNewUS');
      if (!us) fail('missing #gnNewUS before action check');
      else {
        us.click();
        const title = (sel('.title-xl') || {}).textContent || '';
        R.checks.unionMuster = title.indexOf('Union Campaign') >= 0 && !!sel('#msMuster') && !!sel('#msIron');
        if (!R.checks.unionMuster) fail('Union campaign button did not open the muster choice');
        const back = sel('#msBack');
        if (back) back.click();
        R.checks.unionBackReturns = !!sel('.h0-menu') && !!sel('#gnNewUS');
        if (!R.checks.unionBackReturns) fail('Union muster Back did not return to H0 menu');
      }

      const cs = sel('#gnNewCS');
      if (!cs) fail('missing #gnNewCS before action check');
      else {
        cs.click();
        const title = (sel('.title-xl') || {}).textContent || '';
        R.checks.confedMuster = title.indexOf('Confederate Campaign') >= 0 && !!sel('#msMuster') && !!sel('#msIron');
        if (!R.checks.confedMuster) fail('Confederate campaign button did not open the muster choice');
        const back = sel('#msBack');
        if (back) back.click();
        R.checks.confedBackReturns = !!sel('.h0-menu') && !!sel('#gnNewCS');
        if (!R.checks.confedBackReturns) fail('Confederate muster Back did not return to H0 menu');
      }

      const free = sel('#gnFree');
      if (!free) fail('missing #gnFree before action check');
      else {
        free.click();
        R.checks.freeBattlePicker = !!sel('#pkTabs') && !!sel('#pkBack') && !!sel('#pkList');
        if (!R.checks.freeBattlePicker) fail('Free Battle button did not open the picker');
        const back = sel('#pkBack');
        if (back) back.click();
        R.checks.freeBattleBackReturns = !!sel('.h0-menu') && !!sel('#gnFree');
        if (!R.checks.freeBattleBackReturns) fail('Picker Back did not return to H0 menu');
      }
    } catch (e) { fail('fatal core action check: ' + String(e && e.message || e)); }
    return R;
  });
}

async function runViewport(browser, vp) {
  const pageerrors = [];
  const page = await bootPage(browser, vp, pageerrors);
  try {
    const viewResult = await inspectMenu(page, vp.name);
    await page.evaluate(() => { const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; });
    await withTimeout('screenshot ' + vp.name, page.screenshot({ path: join(OUT, `probe-h0-main-menu-${vp.name}.png`), fullPage: false }), SLOW_MAC.screenshot);
    if (vp.name === 'desktop') {
      const actions = await inspectCoreButtonActions(page);
      viewResult.coreActions = actions;
      for (const f of actions.failures || []) viewResult.failures.push('core action: ' + f);
    }
    viewResult.pageerrors = pageerrors;
    return viewResult;
  } finally {
    await closePage(page);
  }
}

async function runSavedCampaign(browser) {
  const savedErrors = [];
  const page = await bootPage(browser, VIEWPORTS[0], savedErrors);
  try {
    const saved = await inspectSavedCampaign(page);
    try {
      await withTimeout('screenshot saved', page.screenshot({ path: join(OUT, 'probe-h0-main-menu-wardept.png'), fullPage: false }), SLOW_MAC.screenshot);
    } catch (e) {
      saved.screenshotWarning = String(e && e.message || e);
    }
    saved.pageerrors = savedErrors;
    return saved;
  } finally {
    await closePage(page);
  }
}

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) {
    srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 60; i++) { if (await up(probe)) break; await sleep(120); }
  }
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
  catch (e) { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }

  const result = { ok: true, probes: [], pageerrors: [] };
  try {
    for (const vp of VIEWPORTS) {
      const viewResult = await withTimeout('viewport ' + vp.name, runViewport(browser, vp), SLOW_MAC.sceneBound);
      if ((viewResult.pageerrors && viewResult.pageerrors.length) || viewResult.failures.length) result.ok = false;
      result.probes.push(viewResult);
      if (viewResult.pageerrors && viewResult.pageerrors.length) result.pageerrors.push({ viewport: vp.name, pageerrors: viewResult.pageerrors });
    }

    const saved = await withTimeout('saved campaign', runSavedCampaign(browser), SLOW_MAC.sceneBound);
    if ((saved.pageerrors && saved.pageerrors.length) || saved.failures.length) result.ok = false;
    result.savedCampaign = saved;
    if (saved.pageerrors && saved.pageerrors.length) result.pageerrors.push({ viewport: 'saved', pageerrors: saved.pageerrors });
  } catch (e) {
    result.ok = false;
    result.fatal = String(e && e.message || e);
  } finally {
    try { await withTimeout('browser.close', browser.close(), SLOW_MAC.browserClose); } catch (e) {}
    if (srv) srv.kill();
    writeFileSync(join(OUT, 'probe-h0-main-menu.json'), JSON.stringify(result, null, 2));
  }

  const failures = [];
  for (const p of result.probes || []) for (const f of p.failures || []) failures.push(p.viewport + ': ' + f);
  for (const f of (result.savedCampaign && result.savedCampaign.failures) || []) failures.push('saved: ' + f);
  const totalChecks = (result.probes || []).length + (result.savedCampaign ? 1 : 0);
  if (result.ok) {
    console.log('H0 MAIN MENU OK ' + totalChecks + '/' + totalChecks + ' pageerrors=0');
    process.exit(0);
  }
  console.error('H0 MAIN MENU FAIL');
  if (result.fatal) console.error('FATAL ' + result.fatal);
  if (failures.length) console.error(failures.join('\n'));
  if (result.pageerrors && result.pageerrors.length) console.error(JSON.stringify(result.pageerrors));
  process.exit(1);
})();
