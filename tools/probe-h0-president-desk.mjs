#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused H0 President's Desk probe: command-shell overview, responsive layout,
// keyboard focus, preserved tabs/wiring, and War Effort deep blocks.
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
const SLOW_MAC = {
  pageClose: 10000,
  newPage: 30000,
  nav: 150000,
  settle: 1400,
  screenshot: 300000,
  screenshotBound: 320000,
  viewportBound: 420000,
  browserClose: 15000
};
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
  try { await withTimeout('page.close', page.close({ runBeforeUnload: false }), SLOW_MAC.pageClose); } catch (e) {}
}

const VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 860 },
  { name: 'tablet', width: 820, height: 900 },
  { name: 'phone', width: 390, height: 820 },
];

async function bootDesk(browser, viewport, pageerrors) {
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
  await page.evaluate(() => {
    G.campaign = { side: 'US', iron: false, idx: 1, funds: 640, recovery: false, completed: ['sumter'],
      roster: [{ id: 'R1', type: 'inf', weapon: 'springfield', xp: 2, name: null }], nextId: 2,
      stats: { battles: 3, won: 2, infl: 300, suff: 1500 }, recoveryLossCount: 0,
      recoveryMode: false, flipAtk: false, captured: [] };
    const C = G.campaign;
    if (typeof _t1InitAll === 'function') _t1InitAll(C);
    if (typeof presOnResolve === 'function') {
      presOnResolve('US', 'win', { bd: { name: 'Bull Run', year: 1861 } }, C, true);
      presOnResolve('US', 'loss', { bd: { name: "Ball's Bluff", year: 1861 } }, C, false);
    }
    if (typeof decOnResolve === 'function') decOnResolve('US', 'win', { bd: { year: 1861 } }, C, true);
    openWarDept();
  });
  await page.waitForTimeout(SLOW_MAC.settle);
  return page;
}

async function inspectDesk(page, viewportName) {
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

    const shell = sel('.h0-desk-shell');
    if (!shell) {
      fail('missing .h0-desk-shell');
      return R;
    }
    R.checks.noBroadsheetClass = !shell.classList.contains('gn-paper') && !sel('.h0-desk-shell .gn-paper');
    if (!R.checks.noBroadsheetClass) fail('desk shell still uses .gn-paper');
    const cssText = (document.getElementById('h0PresidentDeskCss') || {}).textContent || '';
    R.checks.noSerifShellFont = cssText.indexOf('Iowan Old Style') < 0 && cssText.indexOf('Palatino') < 0 && cssText.indexOf('Georgia,serif') < 0;
    if (!R.checks.noSerifShellFont) fail('H0 Desk CSS carries broadsheet serif stack');
    R.checks.hasCommandTexture = cssText.indexOf('repeating-linear-gradient') >= 0;
    if (!R.checks.hasCommandTexture) fail('command-grid texture missing');
    const bg = getComputedStyle(shell).backgroundImage + '|' + getComputedStyle(shell).backgroundColor;
    R.checks.darkShell = /linear-gradient|rgb/.test(bg) && !/246, 235, 215/.test(bg);
    if (!R.checks.darkShell) fail('desk shell appears parchment/light');

    ['#wdTabs', '#wdContent', '#wdClose', '#wdTab_economy', '#wdTab_cabinet', '#wdTab_decisions', '#wdTab_map', '#wdTab_treasury', '#wdTab_codex', '#wdTab_sources'].forEach(id => {
      if (!sel(id)) fail('missing desk contract node ' + id);
    });
    R.checks.overviewCards = all('.h0-desk-panel').length >= 4 && !!sel('.h0-desk-statusline') && !!sel('.h0-desk-meter-grid');
    if (!R.checks.overviewCards) fail('overview command cards/meters missing');
    const contentText = (sel('#wdContent') || {}).textContent || '';
    ['Treasury', 'Strategic Turn', 'Current Field', 'War Resources', 'Dispatch Board'].forEach(txt => {
      if (contentText.indexOf(txt) < 0) fail('overview missing ' + txt);
    });
    R.checks.deepWarEffortBlocks = /Rail|Supply|Prisoner|Exchange|The Ranks|Nation/.test(contentText);
    if (!R.checks.deepWarEffortBlocks) fail('deep War Effort blocks not preserved below overview');

    const sr = rect(shell);
    all('.h0-desk-panel,.h0-desk-metric,.h0-desk-meter,.h0-desk-scene,#wdTabs button,#wdClose').forEach((el, i) => {
      const r = rect(el);
      if (r.w < 24 || r.h < 24) fail('too-small element ' + i + ' ' + (el.id || el.className));
      if (r.x < sr.x - 2 || r.right > sr.right + 2) fail('element escapes shell horizontal bounds ' + (el.id || el.className));
    });
    const gridKids = all('.h0-desk-overview-grid > .h0-desk-panel');
    for (let i = 0; i < gridKids.length; i++) {
      for (let j = i + 1; j < gridKids.length; j++) {
        if (overlaps(gridKids[i], gridKids[j])) fail('overview panels overlap at ' + vp);
      }
    }

    const economyTab = sel('#wdTab_economy');
    if (economyTab) {
      economyTab.focus();
      const cs = getComputedStyle(economyTab);
      R.checks.visibleFocus = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') >= 2;
      if (!R.checks.visibleFocus) fail('focused desk tab has no visible outline');
      R.checks.activePressed = economyTab.getAttribute('aria-pressed') === 'true';
      if (!R.checks.activePressed) fail('active desk tab missing aria-pressed true');
    }

    const cabinet = sel('#wdTab_cabinet');
    if (cabinet) {
      cabinet.click();
      const h = (sel('#wdContent') || {}).textContent || '';
      R.checks.cabinetStillWires = h.indexOf('Secretary') >= 0 && !!sel('#cabDel_war');
      if (!R.checks.cabinetStillWires) fail('cabinet tab did not preserve existing advisor controls');
    }
    const map = sel('#wdTab_map');
    if (map) {
      map.click();
      const h = (sel('#wdContent') || {}).textContent || '';
      R.checks.mapStillWires = h.indexOf('Eastern Theater') >= 0;
      if (!R.checks.mapStillWires) fail('map tab did not render after H0 shell');
    }
    const sources = sel('#wdTab_sources');
    if (sources) {
      sources.click();
      const h = (sel('#wdContent') || {}).textContent || '';
      R.checks.documentsHomeFrontReadouts = h.indexOf('Home front, politics & economy') >= 0
        && h.indexOf('Blind Memorandum') >= 0
        && h.indexOf('Administration will not be re-elected') >= 0
        && h.indexOf('First Legal Tender Act') >= 0
        && h.indexOf('legal tender in payment of all debts') >= 0;
      if (!R.checks.documentsHomeFrontReadouts) fail('Documents tab missing M6 home-front/politics/economy readouts');
    }
    const codex = sel('#wdTab_codex');
    if (codex) {
      codex.click();
      const h = (sel('#wdContent') || {}).textContent || '';
      R.checks.codexHomeFrontReadouts = h.indexOf('War-Finance Civics') >= 0
        && h.indexOf("Women's Home-Front Labor") >= 0
        && h.indexOf('Emancipation as Economic Revolution') >= 0
        && h.indexOf('Ex parte Milligan') >= 0
        && h.indexOf('The Election of 1864') >= 0;
      if (!R.checks.codexHomeFrontReadouts) fail('Codex tab missing M6 home-front/politics/economy cards');
    }
    const treasury = sel('#wdTab_treasury');
    if (treasury) {
      treasury.click();
      const why = sel('#ecWhy');
      if (why) why.click();
      const h = (sel('#wdContent') || {}).textContent || '';
      R.checks.treasuryFinanceCivicsReadout = h.indexOf('War finance is civics') >= 0
        && h.indexOf('Legal Tender Act') >= 0
        && h.indexOf('National Banking Acts') >= 0
        && h.indexOf('Office of the Comptroller') >= 0;
      if (!R.checks.treasuryFinanceCivicsReadout) fail('Treasury tab missing M6 war-finance civics readout');
    }
    const economy = sel('#wdTab_economy');
    if (economy) {
      economy.click();
      R.checks.economyReturns = !!sel('.h0-desk-overview-grid');
      if (!R.checks.economyReturns) fail('economy tab did not restore H0 overview');
    }
    // S29 (D232): one date surface in the header — the Date chip carries the year; no redundant Year chip.
    const chipLabels = all('.h0-desk-chip b').map(b => (b.textContent || '').trim());
    R.checks.singleDateSurface = chipLabels.indexOf('Date') >= 0 && chipLabels.indexOf('Year') < 0;
    if (!R.checks.singleDateSurface) fail('desk header chips duplicate the year: ' + chipLabels.join(','));
    // S30 (D233): one label for the tab landmark — the nav carries it; the inner group must not repeat it.
    const tabsNav = sel('.h0-desk-tabs-wrap'), tabsGroup = sel('#wdTabs');
    R.checks.singleTabsLabel = !!(tabsNav && tabsNav.getAttribute('aria-label')) && !(tabsGroup && tabsGroup.getAttribute('aria-label'));
    if (!R.checks.singleTabsLabel) fail('desk tab wrappers double-announce their label');
    // C18 (D233): the inline glossary decorates the teaching-prose tabs (not just afteraction/warvshistory) —
    // the decorator stamps data-gl-done="1" on #wdContent after a decorated render.
    const pressTab = sel('#wdTab_press');
    if (pressTab) {
      pressTab.click();
      const wc = sel('#wdContent');
      R.checks.glossaryOnTeachingTabs = !!(wc && wc.getAttribute('data-gl-done') === '1');
      if (!R.checks.glossaryOnTeachingTabs) fail('press tab not glossary-decorated (data-gl-done missing)');
      const back = sel('#wdTab_economy'); if (back) back.click();
    } else fail('missing #wdTab_press for the C18 check');
    R.checks.core = true;
    return R;
  }, viewportName);
}

async function runViewport(browser, vp) {
  const pageerrors = [];
  const page = await bootDesk(browser, vp, pageerrors);
  try {
    const viewResult = await inspectDesk(page, vp.name);
    await page.evaluate(() => { const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; });
    await withTimeout('screenshot ' + vp.name, page.screenshot({ path: join(OUT, `probe-h0-president-desk-${vp.name}.png`), fullPage: false, timeout: SLOW_MAC.screenshot }), SLOW_MAC.screenshotBound);
    viewResult.pageerrors = pageerrors;
    return viewResult;
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
      const viewResult = await withTimeout('viewport ' + vp.name, runViewport(browser, vp), SLOW_MAC.viewportBound);
      if ((viewResult.pageerrors && viewResult.pageerrors.length) || viewResult.failures.length) result.ok = false;
      result.probes.push(viewResult);
      if (viewResult.pageerrors && viewResult.pageerrors.length) result.pageerrors.push({ viewport: vp.name, pageerrors: viewResult.pageerrors });
    }
  } catch (e) {
    result.ok = false;
    result.fatal = String(e && e.message || e);
  } finally {
    try { await withTimeout('browser.close', browser.close(), SLOW_MAC.browserClose); } catch (e) {}
    if (srv) srv.kill();
    writeFileSync(join(OUT, 'probe-h0-president-desk.json'), JSON.stringify(result, null, 2));
  }

  const failures = [];
  for (const p of result.probes || []) for (const f of p.failures || []) failures.push(p.viewport + ': ' + f);
  if (result.ok) {
    console.log('H0 PRESIDENT DESK OK ' + (result.probes || []).length + '/' + (result.probes || []).length + ' pageerrors=0');
    process.exit(0);
  }
  console.error('H0 PRESIDENT DESK FAIL');
  if (result.fatal) console.error('FATAL ' + result.fatal);
  if (failures.length) console.error(failures.join('\n'));
  if (result.pageerrors && result.pageerrors.length) console.error(JSON.stringify(result.pageerrors));
  process.exit(1);
})();
