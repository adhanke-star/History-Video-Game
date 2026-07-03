#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused H0 after-action probe: live report + final report command shell,
// responsive screenshots, preserved report/endings/Soldier's Story/glossary contracts.
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
  { name: 'desktop', width: 1366, height: 900 },
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

async function openLiveReport(page) {
  await page.evaluate(() => {
    function mkC(side) {
      var C = {
        side: side || 'US', iron: false, idx: 0, funds: 245000, recovery: false, completed: [],
        roster: [{ id: 'R1', type: 'inf', weapon: 'rifled', xp: 2, name: 'Rhode Island Veterans' }],
        nextId: 2, stats: { battles: 8, won: 6, infl: 42000, suff: 21000 },
        recoveryLossCount: 0, recoveryMode: false, flipAtk: false, captured: []
      };
      G.campaign = C;
      _t1InitAll(C);
      if (typeof vicInit === 'function') vicInit(C);
      C.economy.inflation = 1.25;
      C.blockade.recognition = 8;
      C.blockade.recognitionForeclosed = true;
      C.blockade.importFactor = 0.82;
      C.clock.year = 1864;
      C.clock.weariness = 24;
      C.clock.capital = 92;
      C.clock.resolved1864 = true;
      C.clock.elected = true;
      C.president.date = { year: 1864, month: 11 };
      C.president.emancipation = { issued: true, declined: false, year: 1863, month: 1 };
      C.strategy.wildsPlayed = ['us-russian'];
      C.strategy.enemyWill = 32;
      return C;
    }
    G.settings = G.settings || {};
    G.settings.gfx = 'classic';
    G.mode = 'menu';
    var C = mkC('US');
    openWarDept();
    C.loot = C.loot || {};
    C.loot.journey = {
      enabled: true,
      personId: 'person_bullrun_us_rhodes',
      status: 'wounded',
      battles: 2,
      promotionCount: 1,
      lastBattleName: 'Antietam',
      person: { pid: 'person_bullrun_us_rhodes', name: 'Elisha Hunt Rhodes', rank: 'Sergeant', side: 'US', ovr: 72, grade: { letter: 'B' } },
      career: [
        { battleName: 'First Bull Run', outcome: 'defeat', status: 'alive', rankAfter: 'Private', casualties: { suffered: 2600, inflicted: 1800 }, note: 'Began the journey in retreat.' },
        { battleName: 'Antietam', outcome: 'victory', status: 'wounded', rankAfter: 'Sergeant', promoted: true, casualties: { suffered: 2100, inflicted: 3300 }, note: 'Promotion recorded after the field.' }
      ]
    };
    _wdTab = 'afteraction';
    _wdRefresh();
    return !!C;
  });
  await page.waitForTimeout(400);
}

async function openFinalReport(page) {
  await page.evaluate(() => {
    var C = {
      side: 'US', iron: false, idx: 0, funds: 245000, recovery: false, completed: [],
      roster: [{ id: 'R1', type: 'inf', weapon: 'rifled', xp: 2, name: 'Rhode Island Veterans' }],
      nextId: 2, stats: { battles: 12, won: 10, infl: 62000, suff: 28000 },
      recoveryLossCount: 0, recoveryMode: false, flipAtk: false, captured: []
    };
    G.campaign = C;
    _t1InitAll(C);
    if (typeof vicInit === 'function') vicInit(C);
    C.economy.inflation = 1.18;
    C.blockade.recognition = 0;
    C.blockade.recognitionForeclosed = true;
    C.blockade.importFactor = 0.9;
    C.clock.year = 1865;
    C.clock.weariness = 18;
    C.clock.capital = 104;
    C.clock.resolved1864 = true;
    C.clock.elected = true;
    C.president.date = { year: 1865, month: 4 };
    C.president.emancipation = { issued: true, declined: false, year: 1863, month: 1 };
    C.strategy.wildsPlayed = ['us-russian'];
    C.strategy.enemyWill = 22;
    C.loot = C.loot || {};
    C.loot.journey = {
      enabled: true,
      personId: 'person_bullrun_us_rhodes',
      status: 'wounded',
      battles: 2,
      promotionCount: 1,
      lastBattleName: 'Antietam',
      person: { pid: 'person_bullrun_us_rhodes', name: 'Elisha Hunt Rhodes', rank: 'Sergeant', side: 'US', ovr: 72, grade: { letter: 'B' } },
      career: [
        { battleName: 'First Bull Run', outcome: 'defeat', status: 'alive', rankAfter: 'Private', casualties: { suffered: 2600, inflicted: 1800 }, note: 'Began the journey in retreat.' },
        { battleName: 'Antietam', outcome: 'victory', status: 'wounded', rankAfter: 'Sergeant', promoted: true, casualties: { suffered: 2100, inflicted: 3300 }, note: 'Promotion recorded after the field.' }
      ]
    };
    warWonScreen();
  });
  await page.waitForTimeout(400);
}

async function inspectLiveReport(page, viewportName) {
  return await page.evaluate((vp) => {
    const R = { viewport: vp, checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
    const all = s => Array.from(document.querySelectorAll(s));
    const report = sel('.h0a-report.h0a-live');
    if (!report) {
      fail('missing live .h0a-report shell');
      return R;
    }
    const css = sel('#h0AfterActionCss');
    R.checks.css = !!css;
    if (!css) fail('missing H0 after-action CSS');
    R.checks.commandTexture = css && css.textContent.indexOf('repeating-linear-gradient') >= 0;
    if (!R.checks.commandTexture) fail('command-grid texture missing');
    const font = getComputedStyle(report).fontFamily + '|' + getComputedStyle(sel('.h0a-body') || report).fontFamily;
    R.checks.noBroadsheetFont = !/Georgia|Iowan|Palatino/i.test(font);
    if (!R.checks.noBroadsheetFont) fail('report shell still computes broadsheet font: ' + font);
    const bg = getComputedStyle(report).backgroundColor + '|' + getComputedStyle(report).backgroundImage;
    R.checks.darkShell = !/246, 235, 215/.test(bg);
    if (!R.checks.darkShell) fail('report shell appears parchment/light');
    if (report.querySelector('.gn-paper')) fail('report shell leaked gn-paper');
    if (document.documentElement.scrollWidth > window.innerWidth + 10) fail('horizontal overflow: scrollWidth=' + document.documentElement.scrollWidth + ' innerWidth=' + window.innerWidth);
    const text = report.textContent || '';
    ['After-Action Report', 'Overall conduct', 'The report card', 'Your war vs history', 'The Soldier'].forEach(t => {
      if (text.indexOf(t) < 0) fail('missing preserved report content: ' + t);
    });
    R.checks.metrics = all('.h0a-metric').length >= 4 && all('.h0a-chip').length >= 3;
    if (!R.checks.metrics) fail('summary metrics/chips missing');
    // S01 (D232): the headline grade letter keeps its own large centered treatment — the bare
    // '.h0a-overall span' rule used to out-specify it (display:block + font-size:10px = tiny/top-pinned).
    const gl = sel('.h0a-grade-letter');
    if (!gl) fail('missing .h0a-grade-letter');
    else {
      const gcs = getComputedStyle(gl);
      R.checks.gradeLetterCentered = /flex/.test(gcs.display) && parseFloat(gcs.fontSize) >= 20;
      if (!R.checks.gradeLetterCentered) fail('grade letter lost its centered treatment (display=' + gcs.display + ' fontSize=' + gcs.fontSize + ')');
    }
    R.checks.glossary = all('#wdContent .gl-term').length > 0;
    if (!R.checks.glossary) fail('after-action tab was not glossary-decorated');
    R.checks.endingsCompact = text.indexOf('Alternate endings') >= 0;
    if (!R.checks.endingsCompact) fail('compact endings line missing');
    const body = sel('.h0a-body'), head = sel('.h0a-head'), metrics = sel('.h0a-metrics');
    [report, body, head, metrics].filter(Boolean).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 28) fail('too-small report element ' + (el.className || el.tagName));
      if (r.left < -4 || r.right > window.innerWidth + 4) fail('report element escapes viewport ' + (el.className || el.tagName) + ' ' + JSON.stringify({ left: r.left, right: r.right, width: r.width }));
    });
    const term = sel('#wdContent .gl-term');
    if (term) {
      term.focus();
      const cs = getComputedStyle(term);
      R.checks.visibleFocus = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') >= 2;
      if (!R.checks.visibleFocus) fail('glossary focus ring is not visible inside report');
      try { if (typeof _glHideTip === 'function') _glHideTip(); term.blur(); } catch (e) {}
    }
    return R;
  }, viewportName);
}

async function inspectFinalReport(page, viewportName) {
  return await page.evaluate((vp) => {
    const R = { viewport: vp, checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
    const report = sel('#wwReport .h0a-report.h0a-final');
    if (!report) {
      fail('missing final .h0a-report shell');
      return R;
    }
    const text = document.querySelector('#sheetPad') ? document.querySelector('#sheetPad').textContent || '' : '';
    ['The War is Won', 'Final War Report', 'Final Reckoning', 'Reconstruction to Come', 'Overall conduct'].forEach(t => {
      if (text.indexOf(t) < 0) fail('missing final-report content: ' + t);
    });
    if (!document.getElementById('wwMainMenu')) fail('final report lost #wwMainMenu');
    R.checks.campaignNullified = G.campaign === null;
    if (!R.checks.campaignNullified) fail('warWonScreen did not nullify campaign');
    if (document.documentElement.scrollWidth > window.innerWidth + 10) fail('final report horizontal overflow: scrollWidth=' + document.documentElement.scrollWidth + ' innerWidth=' + window.innerWidth);
    const sheet = sel('#sheetPad'), body = sel('#wwReport .h0a-body'), metrics = sel('#wwReport .h0a-metrics');
    [report, body, metrics].filter(Boolean).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 28) fail('too-small final report element ' + (el.className || el.tagName));
      if (r.left < -4 || r.right > window.innerWidth + 4) fail('final report element escapes viewport ' + (el.className || el.tagName) + ' ' + JSON.stringify({ left: r.left, right: r.right, width: r.width }));
    });
    const btn = sel('#wwMainMenu');
    if (btn) {
      btn.focus();
      const cs = getComputedStyle(btn);
      R.checks.visibleFocus = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') >= 2;
      if (!R.checks.visibleFocus) fail('final Main Menu button has no visible focus outline');
    }
    R.checks.sheetMounted = !!sheet;
    return R;
  }, viewportName);
}

async function runViewport(browser, vp) {
  const pageerrors = [];
  const page = await bootPage(browser, vp, pageerrors);
  try {
    await openLiveReport(page);
    const live = await inspectLiveReport(page, vp.name);
    await withTimeout('after-action screenshot ' + vp.name, page.screenshot({ path: join(OUT, `probe-h0-after-action-${vp.name}.png`), fullPage: true, timeout: 90000 }), 95000);
    await openFinalReport(page);
    const final = await inspectFinalReport(page, vp.name);
    await withTimeout('final-report screenshot ' + vp.name, page.screenshot({ path: join(OUT, `probe-h0-final-report-${vp.name}.png`), fullPage: true, timeout: 90000 }), 95000);
    return { viewport: vp.name, live, final, pageerrors };
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
      const r = await withTimeout('viewport ' + vp.name, runViewport(browser, vp), 210000);
      result.probes.push(r);
      const failures = [...(r.live.failures || []), ...(r.final.failures || [])];
      if (failures.length || (r.pageerrors && r.pageerrors.length)) result.ok = false;
      if (r.pageerrors && r.pageerrors.length) result.pageerrors.push({ viewport: vp.name, pageerrors: r.pageerrors });
    }
  } catch (e) {
    result.ok = false;
    result.fatal = String(e && e.message || e);
  } finally {
    try { await withTimeout('browser.close', browser.close(), 5000); } catch (e) {}
    if (srv) srv.kill();
    writeFileSync(join(OUT, 'probe-h0-after-action.json'), JSON.stringify(result, null, 2));
  }

  const failures = [];
  for (const p of result.probes || []) {
    for (const f of p.live.failures || []) failures.push(p.viewport + ' live: ' + f);
    for (const f of p.final.failures || []) failures.push(p.viewport + ' final: ' + f);
  }
  if (result.ok) {
    console.log('H0 AFTER-ACTION OK ' + (result.probes || []).length + '/' + (result.probes || []).length + ' pageerrors=0');
    process.exit(0);
  }
  console.error('H0 AFTER-ACTION FAIL');
  if (result.fatal) console.error('fatal: ' + result.fatal);
  for (const f of failures) console.error(' - ' + f);
  if (result.pageerrors && result.pageerrors.length) console.error('pageerrors: ' + JSON.stringify(result.pageerrors));
  process.exit(1);
})();
