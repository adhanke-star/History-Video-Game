#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused H0 battle-briefing probe: command-shell bridge briefing and tactical
// side-choice card, preserving legacy ids, callbacks, scene imagery, and launch contracts.
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

async function openBridge(page) {
  await page.evaluate(() => {
    G.campaign = { side: 'US', iron: false, idx: 1, funds: 720, recovery: false, completed: ['sumter'],
      roster: [{ id: 'R1', type: 'inf', weapon: 'springfield', xp: 2, name: null }], nextId: 2,
      stats: { battles: 3, won: 2, infl: 300, suff: 1500 }, recoveryLossCount: 0,
      recoveryMode: false, flipAtk: false, captured: [] };
    const C = G.campaign;
    if (typeof _t1InitAll === 'function') _t1InitAll(C);
    if (typeof bridgeInit === 'function') bridgeInit(C);
    window.__h0Back = false;
    window.__h0Field = false;
    openSheet(bridgeBriefingHTML(C));
    if (typeof bridgeWireBriefing === 'function') {
      bridgeWireBriefing(C, () => { window.__h0Back = true; }, () => { window.__h0Field = true; });
    }
  });
  await page.waitForTimeout(350);
}

async function inspectBridge(page, viewportName) {
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

    const shell = sel('.h0-brief-shell');
    if (!shell) {
      fail('missing .h0-brief-shell');
      return R;
    }
    const cssText = (document.getElementById('h0BattleBriefingCss') || {}).textContent || '';
    R.checks.noBroadsheetClass = !shell.classList.contains('gn-paper') && !sel('.h0-brief-shell .gn-paper');
    if (!R.checks.noBroadsheetClass) fail('briefing shell still uses .gn-paper');
    R.checks.noSerifShellFont = cssText.indexOf('Iowan Old Style') < 0 && cssText.indexOf('Palatino') < 0 && cssText.indexOf('Georgia,serif') < 0;
    if (!R.checks.noSerifShellFont) fail('H0 briefing CSS carries broadsheet serif stack');
    R.checks.commandTexture = cssText.indexOf('repeating-linear-gradient') >= 0;
    if (!R.checks.commandTexture) fail('command-grid texture missing');
    const bg = getComputedStyle(shell).backgroundImage + '|' + getComputedStyle(shell).backgroundColor;
    R.checks.darkShell = /linear-gradient|rgb/.test(bg) && !/246, 235, 215/.test(bg);
    if (!R.checks.darkShell) fail('briefing shell appears parchment/light');

    const text = shell.textContent || '';
    ['Pre-Battle Briefing', 'The army you field', 'Your orders for the day', 'Auto-resolve', 'Fight in real time', 'To the Field (Classic)'].forEach(txt => {
      if (text.indexOf(txt) < 0) fail('briefing missing ' + txt);
    });
    ['#brgBack', '#brgAuto', '#brgRealTime', '#brgToField', '#brg_entrench', '#brg_forcedMarch'].forEach(id => {
      if (!sel(id)) fail('missing preserved bridge id ' + id);
    });
    const shellHtml = shell.innerHTML || '';
    R.checks.sceneContract = all('figure.scene-img').length === 1 && shellHtml.indexOf('scene-img') >= 0
      && shellHtml.indexOf('scene-img') < shellHtml.indexOf('The army you field');
    if (!R.checks.sceneContract) fail('scene-img contract missing or not before army columns');
    R.checks.panels = all('.h0-brief-panel').length === 2 && all('.h0-brief-meter').length >= 6 && all('.h0-prep-row').length >= 5;
    if (!R.checks.panels) fail('briefing panels/meters/prep rows incomplete');
    // S00 (D232): the prep list renders the feint order as literal text, never a garbled '&amp;'.
    const prepTxt = all('.h0-prep-row').map(el => el.textContent || '').join(' | ');
    R.checks.noDoubleEscape = prepTxt.indexOf('Feint & flank') >= 0 && prepTxt.indexOf('&amp;') < 0;
    if (!R.checks.noDoubleEscape) fail('prep list double-escapes the feint label: ' + prepTxt.slice(0, 120));

    const sr = rect(shell);
    all('.h0-brief-panel,.h0-brief-stat,.h0-brief-meter,.h0-prep-row,.h0-brief-actions button,.h0-brief-scene-wrap').forEach((el, i) => {
      const r = rect(el);
      if (r.w < 24 || r.h < 24) fail('too-small briefing element ' + i + ' ' + (el.id || el.className));
      if (r.x < sr.x - 2 || r.right > sr.right + 2) fail('briefing element escapes shell bounds ' + (el.id || el.className));
    });
    const panels = all('.h0-brief-grid > .h0-brief-panel');
    for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) if (overlaps(panels[i], panels[j])) fail('briefing panels overlap at ' + vp);

    const entrench = sel('#brg_entrench');
    if (entrench) {
      entrench.focus();
      const cs = getComputedStyle(entrench);
      R.checks.visibleFocus = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') >= 2;
      if (!R.checks.visibleFocus) fail('focused prep button has no visible outline');
      const before = entrench.getAttribute('aria-pressed');
      entrench.click();
      const after = (sel('#brg_entrench') || {}).getAttribute ? sel('#brg_entrench').getAttribute('aria-pressed') : null;
      R.checks.toggleWires = before === 'false' && after === 'true';
      if (!R.checks.toggleWires) fail('prep toggle did not re-render with aria-pressed true');
    }
    // LANE-012 Slice 1 (D455 §4a.2): the always-visible teaching companion on the briefing.
    // Presence + sourced (every attribution is a PREFIX of the scenario's committed source
    // register) + factual voice (no verdict vocabulary). bullrun1 is chain US idx 1.
    const tc = sel('.h0-brief-shell .tc-companion');
    R.checks.tcPresent = !!tc && (tc.textContent || '').indexOf('In history') >= 0;
    if (!R.checks.tcPresent) fail('teaching companion missing from the briefing');
    if (tc) {
      const sd = (typeof fldScenarioData === 'function') ? fldScenarioData('bullrun1') : null;
      const attrs = Array.from(tc.querySelectorAll('.tc-src')).map(el => (el.textContent || '').trim());
      R.checks.tcSourced = !!sd && attrs.length >= 2
        && attrs.every(a => (sd.sources || []).some(row => String(row).indexOf(a) === 0));
      if (!R.checks.tcSourced) fail('companion attributions are not prefixes of the committed source register: ' + attrs.join(' | '));
      const tcText = tc.textContent || '';
      const verdictHits = ['Legendary', 'Masterful', 'Workmanlike', 'Faltering', 'A failure', 'GPA', 'report card']
        .filter(w => tcText.indexOf(w) >= 0);
      if (/\bgraded?\b/i.test(tcText)) verdictHits.push('grade');
      R.checks.tcFactualVoice = verdictHits.length === 0;
      if (!R.checks.tcFactualVoice) fail('companion carries verdict vocabulary: ' + verdictHits.join(','));
    }
    R.checks.core = true;
    return R;
  }, viewportName);
}

// LANE-012 Slice 1: the absent-by-guard byte-equivalence + fail-closed contract. Run once
// (desktop). Stubbing the composer off must yield EXACTLY the with-panel render minus the
// companion node; a chain battle with no committed scenario corpus renders NO panel; the
// verified alias map reaches its corpus.
async function inspectCompanionGuard(page) {
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const C = G.campaign;
    if (typeof tcBriefingPanel !== 'function') { fail('tcBriefingPanel missing'); return R; }
    const withHtml = bridgeBriefingHTML(C);
    const m = withHtml.match(/<aside class="tc-companion"[\s\S]*?<\/aside>/);
    R.checks.panelInRender = !!m;
    if (!m) { fail('companion aside not found in briefing render'); return R; }
    const saved = tcBriefingPanel;
    let withoutHtml;
    try { tcBriefingPanel = 0; withoutHtml = bridgeBriefingHTML(C); } finally { tcBriefingPanel = saved; }
    R.checks.guardExact = withoutHtml === withHtml.replace(m[0], '');
    if (!R.checks.guardExact) fail('guarded absence is not byte-identical to render-minus-panel');
    R.checks.failClosed = tcBriefingPanel({ id: 'wilsons', name: 'Wilsons Creek' }) === '';
    if (!R.checks.failClosed) fail('companion fabricates a panel for a battle with no committed corpus');
    R.checks.aliasWorks = tcBriefingPanel({ id: 'ftdonelson' }) !== '' && tcBriefingPanel({ id: 'peariver' }) !== '';
    if (!R.checks.aliasWorks) fail('verified chain alias (ftdonelson/peariver) did not reach its scenario corpus');
    return R;
  });
}

async function inspectSideChoice(page, viewportName) {
  await page.evaluate(() => {
    window.__h0Picked = null;
    if (typeof fldScenarioSideChoice !== 'function') throw new Error('fldScenarioSideChoice missing');
    fldScenarioSideChoice('antietam', side => { window.__h0Picked = side; });
  });
  await page.waitForTimeout(250);
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
    const shell = sel('.h0-side-shell');
    if (!shell) {
      fail('missing .h0-side-shell');
      return R;
    }
    const text = shell.textContent || '';
    if (text.indexOf('Side Choice') < 0) fail('side shell missing label');
    if (text.indexOf('Objective') < 0 || text.indexOf('Attacker') < 0) fail('side shell missing command chips');
    const cards = all('[data-brside]');
    R.checks.twoCards = cards.length === 2 && !!sel('[data-brside="US"]') && !!sel('[data-brside="CS"]');
    if (!R.checks.twoCards) fail('side choice did not render two US/CS cards');
    R.checks.noBroadsheetClass = !shell.classList.contains('gn-paper') && !sel('.h0-side-shell .gn-paper');
    if (!R.checks.noBroadsheetClass) fail('side shell still uses .gn-paper');
    const sr = rect(shell);
    all('.h0-side-card,.h0-brief-chip,#fldBrSideBack').forEach((el, i) => {
      const r = rect(el);
      if (r.w < 24 || r.h < 24) fail('too-small side element ' + i + ' ' + (el.id || el.className));
      if (r.x < sr.x - 2 || r.right > sr.right + 2) fail('side element escapes shell bounds ' + (el.id || el.className));
    });
    for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) if (overlaps(cards[i], cards[j])) fail('side cards overlap at ' + vp);
    const us = sel('[data-brside="US"]');
    if (us) {
      us.focus();
      const cs = getComputedStyle(us);
      R.checks.visibleFocus = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth || '0') >= 2;
      if (!R.checks.visibleFocus) fail('focused side card has no visible outline');
    }
    const csCard = sel('[data-brside="CS"]');
    if (csCard) csCard.click();
    R.checks.callback = window.__h0Picked === 'CS';
    if (!R.checks.callback) fail('CS side card did not call back CS');
    R.checks.closedAfterPick = !sel('.h0-side-shell');
    if (!R.checks.closedAfterPick) fail('side shell did not close after pick');
    return R;
  }, viewportName);
}

async function runViewport(browser, vp) {
  const pageerrors = [];
  const page = await bootPage(browser, vp, pageerrors);
  try {
    await openBridge(page);
    const bridge = await inspectBridge(page, vp.name);
    if (vp.name === 'desktop') {
      const guard = await inspectCompanionGuard(page);
      bridge.failures = [...(bridge.failures || []), ...(guard.failures || [])];
      bridge.checks = Object.assign({}, bridge.checks, guard.checks);
    }
    await page.evaluate(() => { const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; });
    await withTimeout('bridge screenshot ' + vp.name, page.screenshot({ path: join(OUT, `probe-h0-battle-briefing-${vp.name}.png`), fullPage: false, timeout: 90000 }), 95000);
    const side = await inspectSideChoice(page, vp.name);
    if (vp.name === 'desktop') {
      await page.evaluate(() => { window.__h0Picked = null; fldScenarioSideChoice('antietam', side => { window.__h0Picked = side; }); });
      await page.waitForTimeout(150);
      await withTimeout('side screenshot ' + vp.name, page.screenshot({ path: join(OUT, 'probe-h0-battle-side-choice-desktop.png'), fullPage: false, timeout: 90000 }), 95000);
    }
    bridge.pageerrors = pageerrors;
    return { viewport: vp.name, bridge, side, pageerrors };
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
      const r = await withTimeout('viewport ' + vp.name, runViewport(browser, vp), 180000);
      result.probes.push(r);
      const failures = [...(r.bridge.failures || []), ...(r.side.failures || [])];
      if (failures.length || (r.pageerrors && r.pageerrors.length)) result.ok = false;
      if (r.pageerrors && r.pageerrors.length) result.pageerrors.push({ viewport: vp.name, pageerrors: r.pageerrors });
    }
  } catch (e) {
    result.ok = false;
    result.fatal = String(e && e.message || e);
  } finally {
    try { await withTimeout('browser.close', browser.close(), 5000); } catch (e) {}
    if (srv) srv.kill();
    writeFileSync(join(OUT, 'probe-h0-battle-briefing.json'), JSON.stringify(result, null, 2));
  }

  const failures = [];
  for (const p of result.probes || []) {
    for (const f of p.bridge.failures || []) failures.push(p.viewport + ' bridge: ' + f);
    for (const f of p.side.failures || []) failures.push(p.viewport + ' side: ' + f);
  }
  if (result.ok) {
    console.log('H0 BATTLE BRIEFING OK ' + (result.probes || []).length + '/' + (result.probes || []).length + ' pageerrors=0');
    process.exit(0);
  }
  console.error('H0 BATTLE BRIEFING FAIL');
  if (result.fatal) console.error('FATAL ' + result.fatal);
  if (failures.length) console.error(failures.join('\n'));
  if (result.pageerrors && result.pageerrors.length) console.error(JSON.stringify(result.pageerrors));
  process.exit(1);
})();
