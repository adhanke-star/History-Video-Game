#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// Focused H0 main-menu probe — D282 re-anchor for the Aaron-locked main-menu
// redesign (docs/design/main-menu-redesign-design.md §5). Covers: the full-bleed
// somber-static backdrop + provenance-plate coexistence (lock 3), the
// campaign-chain tracker two-state (SR summary / overflow rail / no-save
// suppression), the E61 take-command nudge two-state, the Field Operations
// group around the #gnFree injection anchor, the extended six-shell token pin
// (green/red/muted + brass/focus), the D74 no-write tripwire on the generated
// module region, responsive layout, keyboard focus, injected menu tools, and
// the saved-campaign War Department path.
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
    R.checks.noSwordGlyphCards = all('.h0-menu .h0-card-icon').every(el => (el.textContent || '').trim() !== '⚔');
    if (!R.checks.noSwordGlyphCards) fail('H0 cards still depend on the old sword glyph');

    // D282 lock 3 / §5 tooth 1: the full-bleed decorative backdrop coexists with a
    // still-rendering INFORMATIVE provenance plate (img[alt] + legible figcaption).
    const backdrop = sel('.h0-backdrop[aria-hidden="true"]');
    R.checks.backdropPresent = !!backdrop;
    if (!backdrop) fail('missing .h0-backdrop[aria-hidden="true"] full-bleed layer');
    else {
      const br = rect(backdrop), mr0 = rect(menu);
      R.checks.backdropFullBleed = Math.abs(br.x - mr0.x) <= 2 && Math.abs(br.right - mr0.right) <= 2 && br.h >= mr0.h - 4;
      if (!R.checks.backdropFullBleed) fail('backdrop does not cover the menu (inset:0 contract)');
    }
    const plateImg = sel('.h0-hero-figure img.h0-hero-img');
    const plateCap = sel('.h0-hero-figure figcaption');
    R.checks.provenancePlate = !!(plateImg && (plateImg.getAttribute('alt') || '').trim().length > 10
      && plateCap && (plateCap.textContent || '').trim().length > 10 && rect(plateCap).h > 8);
    if (!R.checks.provenancePlate) fail('provenance plate (img[alt] + legible figcaption) missing or empty');

    // §5 tooth 2 (no-save half): tracker suppressed with no campaign save.
    R.checks.noChainRailNoSave = !sel('.h0-chainrail');
    if (!R.checks.noChainRailNoSave) fail('chain tracker rendered in the no-save state');
    // §3 (no-save half): E61 nudge absent with no campaign save.
    R.checks.noNudgeNoSave = !sel('.h0-nudge');
    if (!R.checks.noNudgeNoSave) fail('E61 nudge card rendered in the no-save state');

    // Field Operations group: labeled group wraps the #gnFree injection anchor;
    // internally scrollable so 6+ injected buttons never blow the viewport.
    const fieldops = sel('.h0-fieldops[role="group"]');
    const fieldopsList = sel('.h0-fieldops-list');
    R.checks.fieldOpsGroup = !!(fieldops && fieldops.getAttribute('aria-labelledby') === 'h0FieldOpsTitle'
      && sel('#h0FieldOpsTitle') && fieldopsList && fieldopsList.contains(sel('#gnFree'))
      && /auto|scroll/.test(getComputedStyle(fieldopsList).overflowY));
    if (!R.checks.fieldOpsGroup) fail('Field Operations group missing, unlabeled, missing #gnFree, or not scrollable');
    // D282 shot-readback regression tooth: a scroll-capped GRID froze Chrome button rows at
    // min-height so 3-line decks painted over the next button. Every button must fit its content.
    if (fieldopsList) {
      const clipped = Array.from(fieldopsList.querySelectorAll('.gn-btn'))
        .filter(b => b.scrollHeight > b.getBoundingClientRect().height + 3)
        .map(b => b.id || b.className);
      R.checks.fieldOpsButtonsFitContent = clipped.length === 0;
      if (!R.checks.fieldOpsButtonsFitContent) fail('field-ops buttons clip their content: ' + clipped.join(','));
    }

    // Motion locks: nothing loops anywhere in the menu CSS; the somber
    // (casualty-photo) suppression rule ships; entrance animation is one-shot <=400ms.
    R.checks.noLoopingAnimation = cssText.indexOf('infinite') < 0;
    if (!R.checks.noLoopingAnimation) fail('menu CSS contains a looping animation');
    R.checks.somberSuppressionRule = cssText.indexOf('.h0-menu.h0-somber') >= 0;
    if (!R.checks.somberSuppressionRule) fail('missing .h0-somber no-motion-over-the-dead suppression rule');
    const entrance = cssText.match(/animation:h0Enter ([0-9.]+)s/);
    R.checks.entranceBudget = !!entrance && parseFloat(entrance[1]) <= 0.4;
    if (!R.checks.entranceBudget) fail('entrance animation missing or exceeds the 400ms one-shot budget');

    // High-contrast mode force-hides the backdrop entirely (pure CSS, restore after).
    if (backdrop) {
      const prevHC = document.documentElement.getAttribute('data-a11y-contrast');
      document.documentElement.setAttribute('data-a11y-contrast', 'high');
      R.checks.highContrastHidesBackdrop = getComputedStyle(backdrop).display === 'none';
      if (prevHC == null) document.documentElement.removeAttribute('data-a11y-contrast');
      else document.documentElement.setAttribute('data-a11y-contrast', prevHC);
      if (!R.checks.highContrastHidesBackdrop) fail('high-contrast mode does not hide the backdrop');
    }

    ['#gnNewUS', '#gnNewCS', '#gnFree', '#gnSettings', '#gnLoad'].forEach(id => {
      if (!sel(id)) fail('missing core button ' + id);
    });
    ['#fldSandboxBtn', '#fldPresetBtn', '#fldCustomBuilderBtn', '#gnPlayStyle', '#gnA11y', '#gnHelp', '#gnTour'].forEach(id => {
      if (!sel(id)) fail('missing injected menu tool ' + id);
    });
    // The T0->T1->T2->T6->T11 sibling chain must land INSIDE the Field Operations list
    // (same #gnFree anchor, same parentNode/nextSibling mechanics — §2 contract).
    const fieldTools = ['#fldSandboxBtn', '#fldPresetBtn', '#fldCustomBuilderBtn'];
    R.checks.injectedInsideFieldOps = !!fieldopsList && fieldTools.every(id => { const b = sel(id); return b && fieldopsList.contains(b); });
    if (!R.checks.injectedInsideFieldOps) fail('injected field tools did not cluster inside the Field Operations group');
    const injected = all('.h0-menu .gn-btn:not(.h0-card)');
    const oldGlyphs = injected
      .map(btn => ((btn.querySelector('.gn-hl') || {}).textContent || '').trim())
      .filter(txt => /^[⚔⚙★♿]/.test(txt));
    R.checks.injectedLabelsPolished = injected.length > 0 && oldGlyphs.length === 0 && injected.every(btn => !!btn.querySelector('.h0-injected-icon'));
    if (!R.checks.injectedLabelsPolished) fail('injected menu labels still use old visible glyph treatment');

    const panel = sel('.h0-panel');
    if (panel) {
      const bg = getComputedStyle(panel).backgroundImage + '|' + getComputedStyle(panel).backgroundColor;
      R.checks.darkCommandPanel = /rgb|linear-gradient/.test(bg) && !/246, 235, 215/.test(bg) && !/245, 237, 214/.test(bg);
      if (!R.checks.darkCommandPanel) fail('panel appears parchment/light instead of command-dark');
      // War Room contrast architecture: copy sits on near-opaque (>=.90) dark glass.
      const alphas = (cssText.match(/\.h0-panel\{background:linear-gradient\(180deg,rgba\(\d+,\d+,\d+,(\.\d+)\),rgba\(\d+,\d+,\d+,(\.\d+)\)/) || []).slice(1).map(parseFloat);
      R.checks.panelNearOpaque = alphas.length === 2 && alphas.every(a => a >= 0.90);
      if (!R.checks.panelNearOpaque) fail('panel dark-glass alpha dropped below the .90 contract: ' + JSON.stringify(alphas));
    }

    // S03+S11 (D232) extended by D282 §5: the menu pins the FULL six-shell accent canon —
    // green/red/muted plus brass #d8b458 and focus #ffe27a — as LITERAL token values.
    const mcs = getComputedStyle(menu);
    const tok = p => (mcs.getPropertyValue(p) || '').trim().toLowerCase();
    R.checks.sharedAccentTokens = tok('--h0-green') === '#5f9273' && tok('--h0-red') === '#b35a50' && tok('--h0-muted') === '#c5cdc3'
      && tok('--h0-brass') === '#d8b458' && tok('--h0-focus') === '#ffe27a';
    if (!R.checks.sharedAccentTokens) fail('menu accent tokens drift from the shared H0 canon: green=' + tok('--h0-green') + ' red=' + tok('--h0-red') + ' muted=' + tok('--h0-muted') + ' brass=' + tok('--h0-brass') + ' focus=' + tok('--h0-focus'));
    // S05 (D232): the action grid absorbs the leftover column height (no stranded void in the no-save state).
    const actions = sel('.h0-command .h0-actions');
    if (actions) {
      R.checks.actionsFillColumn = getComputedStyle(actions).flexGrow === '1';
      if (!R.checks.actionsFillColumn) fail('command action grid does not absorb the column height (flexGrow=' + getComputedStyle(actions).flexGrow + ')');
    } else fail('missing .h0-command .h0-actions');

    const mr = rect(menu);
    const important = all('.h0-panel,.h0-menu .gn-btn,.h0-chip,.h0-hero-figure,.h0-fieldops');
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
    all('.h0-actions,.gn-classifieds,.h0-fieldops-list').forEach(group => {
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

async function inspectCoreButtonActions(page) {
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
    try {
      if (!sel('.h0-menu')) openMainMenu();
      // D453 audit re-tooth (STRONGER; the D420 design-§11 PUBLIC flow — this suite row had not
      // run since the Slice-C public flip): a campaign start opens the RULESET PICKER first;
      // Historical is chosen through the real cards, and only the armed Start opens the muster
      // choice. The old direct-muster expectation described the pre-D420 private flow.
      const us = sel('#gnNewUS');
      if (!us) fail('missing #gnNewUS before action check');
      else {
        us.click();
        R.checks.unionPicker = !!sel('#mhRulesetPicker') && document.querySelectorAll('[data-mh-mode]').length === 2 && !!sel('#mhStart') && sel('#mhStart').disabled === true;
        if (!R.checks.unionPicker) fail('Union campaign button did not open the ruleset picker (Start must arm only after a choice)');
        const usHist = sel('[data-mh-mode="historical"]');
        if (usHist) usHist.click();
        const usStart = sel('#mhStart');
        R.checks.unionPickerStart = !!usStart && usStart.disabled === false && usStart.textContent.indexOf('Start Historical Campaign') >= 0;
        if (!R.checks.unionPickerStart) fail('Historical selection did not arm the picker Start');
        if (usStart) usStart.click();
        const title = (sel('.title-xl') || {}).textContent || '';
        R.checks.unionMuster = title.indexOf('Union Campaign') >= 0 && !!sel('#msMuster') && !!sel('#msIron');
        if (!R.checks.unionMuster) fail('the Historical start did not open the muster choice');
        const back = sel('#msBack');
        if (back) back.click();
        R.checks.unionBackReturns = !!sel('.h0-menu') && !!sel('#gnNewUS');
        if (!R.checks.unionBackReturns) fail('Union muster Back did not return to H0 menu');
        const us2 = sel('#gnNewUS');
        if (us2) { us2.click(); const mb = sel('#mhBack'); if (mb) mb.click(); }
        R.checks.unionPickerBackReturns = !!sel('.h0-menu') && !!sel('#gnNewUS');
        if (!R.checks.unionPickerBackReturns) fail('ruleset picker Back did not return to H0 menu');
      }

      const cs = sel('#gnNewCS');
      if (!cs) fail('missing #gnNewCS before action check');
      else {
        cs.click();
        R.checks.confedPicker = !!sel('#mhRulesetPicker') && !!sel('#mhStart');
        if (!R.checks.confedPicker) fail('Confederate campaign button did not open the ruleset picker');
        const csHist = sel('[data-mh-mode="historical"]');
        if (csHist) csHist.click();
        const csStart = sel('#mhStart');
        if (csStart && !csStart.disabled) csStart.click();
        const title = (sel('.title-xl') || {}).textContent || '';
        R.checks.confedMuster = title.indexOf('Confederate Campaign') >= 0 && !!sel('#msMuster') && !!sel('#msIron');
        if (!R.checks.confedMuster) fail('the Historical start did not open the Confederate muster choice');
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

async function inspectSavedCampaign(page) {
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
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

      // §5 tooth 2 (saved half): the campaign-chain tracker.
      const rail = sel('.h0-chainrail');
      R.checks.chainRailPresent = !!rail;
      if (!rail) fail('missing chain tracker with saved campaign');
      else {
        const chainLen = (typeof CHAINS !== 'undefined' && CHAINS.US) ? CHAINS.US.length : -1;
        const segs = Array.from(document.querySelectorAll('.h0-seg'));
        R.checks.chainSegCount = segs.length === chainLen && chainLen > 0;
        if (!R.checks.chainSegCount) fail('chain segments ' + segs.length + ' != CHAINS.US length ' + chainLen);
        R.checks.chainCurrentRinged = segs.findIndex(s => s.classList.contains('is-current')) === 1;
        if (!R.checks.chainCurrentRinged) fail('current-battle segment is not chain index 1');
        R.checks.chainFoughtFilled = segs.filter(s => s.classList.contains('is-fought')).length === 1;
        if (!R.checks.chainFoughtFilled) fail('fought segment count != 1 at idx 1');
        const srText = (sel('.h0-chainrail .h0-sr-only') || {}).textContent || '';
        R.checks.chainSrSummary = /Battle 2 of \d+: First Bull Run, 1861/.test(srText);
        if (!R.checks.chainSrSummary) fail('SR chain summary missing/wrong: "' + srText + '"');
        const scroller = sel('.h0-chain-scroll');
        R.checks.chainOverflowScroll = !!scroller && /auto|scroll/.test(getComputedStyle(scroller).overflowX);
        if (!R.checks.chainOverflowScroll) fail('chain rail is not inside an overflow-x:auto container');
        const ol = sel('ol.h0-chain');
        R.checks.chainDecorationHidden = !!ol && ol.getAttribute('aria-hidden') === 'true';
        if (!R.checks.chainDecorationHidden) fail('chain rail decoration is not aria-hidden');
        const now = (sel('.h0-chainrail-now') || {}).textContent || '';
        R.checks.chainNowLine = now.indexOf('Battle 2 of') >= 0 && now.indexOf('First Bull Run') >= 0;
        if (!R.checks.chainNowLine) fail('visible chain now-line missing/wrong: "' + now + '"');
      }
      // §3: non-recovery saved campaign shows NO nudge.
      R.checks.noNudgeHealthy = !sel('.h0-nudge');
      if (!R.checks.noNudgeHealthy) fail('E61 nudge rendered on a non-recovery campaign');
    } catch (e) { fail('fatal saved-campaign check: ' + String(e && e.message || e)); }
    return R;
  });
}

async function inspectNudgeState(page) {
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    const sel = s => document.querySelector(s);
    try {
      // Walled campaign: two consecutive delegated losses at Fredericksburg (US idx 10).
      G.campaign.idx = 10;
      G.campaign.recovery = true;
      G.campaign.recoveryMode = true;
      G.campaign.recoveryLossCount = 2;
      saveLocal();
      openMainMenu();
      const card = sel('.h0-nudge');
      R.checks.nudgePresent = !!card;
      if (!card) fail('E61 nudge card missing in recoveryMode with 2 losses');
      else {
        const h = (sel('#h0NudgeTitle') || {}).textContent || '';
        R.checks.nudgeNamesBattle = h.indexOf('Fredericksburg') >= 0;
        if (!R.checks.nudgeNamesBattle) fail('nudge does not name the walled battle: "' + h + '"');
        const body = (card.textContent || '');
        R.checks.nudgeHonestCopy = body.indexOf('twice') >= 0 && /field command|political path/.test(body);
        if (!R.checks.nudgeHonestCopy) fail('nudge copy lost its honest guidance shape');
        R.checks.nudgeLabeled = card.getAttribute('aria-labelledby') === 'h0NudgeTitle';
        if (!R.checks.nudgeLabeled) fail('nudge card is not labeled for AT');
      }
      // D74 runtime no-write tripwire: re-rendering the menu twice must not move the save.
      const s1 = localStorage.getItem('gor_save');
      openMainMenu();
      openMainMenu();
      const s2 = localStorage.getItem('gor_save');
      R.checks.menuWritesNothing = s1 === s2 && !!s1;
      if (!R.checks.menuWritesNothing) fail('opening the menu mutated the saved campaign (D74 violation)');
    } catch (e) { fail('fatal nudge-state check: ' + String(e && e.message || e)); }
    return R;
  });
}

async function inspectWarDept(page) {
  return await page.evaluate(() => {
    const R = { checks: {}, failures: [] };
    const fail = msg => R.failures.push(msg);
    try {
      if (!document.querySelector('.h0-menu')) openMainMenu();
      const wd = document.getElementById('gnWarDept');
      if (wd) wd.click();
      R.checks.warDeptOpened = !!document.getElementById('wdTabs');
      if (!R.checks.warDeptOpened) fail('War Department did not open');
    } catch (e) { fail('fatal war-dept check: ' + String(e && e.message || e)); }
    return R;
  });
}

/* D74 static tripwire (§5 tooth 4): the generated deliverable's 98-h0-main-menu
   region must contain NO campaign/save writes — no C.<recovery-family> or
   G.campaign assignment, and no saveLocal() call. */
function inspectGeneratedRegion() {
  const R = { checks: {}, failures: [] };
  try {
    const html = readFileSync(join(ROOT, 'civil_war_generals.html'), 'utf8');
    const start = html.indexOf('/* ===== module: 98-h0-main-menu.js ===== */');
    if (start < 0) { R.failures.push('module marker not found in deliverable'); return R; }
    const next = html.indexOf('/* ===== module:', start + 10);
    const region = html.slice(start, next > 0 ? next : undefined);
    // panel-advisory sharpening: catch ANY C.<field> assignment, not an enumerated list
    // (comparisons like C.idx >= n or C.side === 'CS' don't match: '=[^=]' rejects '=='
    // and requires '=' as the first operator char).
    const writes = region.match(/\bC\.[A-Za-z_$][\w$]*\s*=[^=]/g) || [];
    const gcw = region.match(/\bG\.campaign\s*=[^=]/g) || [];
    const slw = region.match(/\bsaveLocal\s*\(/g) || [];
    R.checks.noCampaignWrites = writes.length === 0 && gcw.length === 0 && slw.length === 0;
    if (!R.checks.noCampaignWrites) R.failures.push('generated menu region contains campaign/save writes: ' + JSON.stringify({ writes, gcw, slw }));
  } catch (e) { R.failures.push('fatal generated-region check: ' + String(e && e.message || e)); }
  return R;
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
    // The Aaron-locked tracker is a first-viewport signature at desktop: measured AFTER the
    // async T0/T1/T2/T6/T11 injections settle (they grow the Field Operations list), against
    // the SHEET's visible box (the sheet is the scroll container that clips the menu), in the
    // default saved state (no nudge). With the sheet scrolled to top the segment row must show.
    await page.waitForTimeout(700);
    const fold = await page.evaluate(() => {
      const sh = document.querySelector('.sheet');
      const ol = document.querySelector('ol.h0-chain');
      if (!sh || !ol) return { ok: false, why: 'missing sheet or chain' };
      sh.scrollTop = 0;
      const shr = sh.getBoundingClientRect();
      const olr = ol.getBoundingClientRect();
      return { ok: olr.bottom <= shr.bottom + 1 && olr.top >= shr.top - 1, olBottom: Math.round(olr.bottom), sheetBottom: Math.round(shr.bottom) };
    });
    saved.checks.chainVisibleFirstViewport = fold.ok;
    if (!fold.ok) saved.failures.push('chain tracker segments hidden below the desktop fold: ' + JSON.stringify(fold));
    // D517 root-fix tooth: the dynamically injected Command Utilities column must own
    // its desktop overflow so the chain stays above the frozen-sheet fold. Natural Tab
    // order must still reach the final utility and reveal it inside that inner scroller.
    const utilityOrder = await page.evaluate(() => {
      const sh = document.querySelector('.sheet');
      const box = document.querySelector('.h0-notices');
      if (!sh || !box) return { ok: false, why: 'missing sheet or Command Utilities' };
      sh.scrollTop = 0;
      box.scrollTop = 0;
      const buttons = Array.from(box.querySelectorAll('button')).filter(btn => !btn.disabled && btn.offsetParent !== null);
      if (buttons.length < 2) return { ok: false, why: 'fewer than two visible utility buttons', count: buttons.length };
      buttons[0].focus();
      return {
        ok: true,
        ids: buttons.map(btn => btn.id),
        overflowY: getComputedStyle(box).overflowY,
        clientHeight: box.clientHeight,
        scrollHeight: box.scrollHeight
      };
    });
    if (utilityOrder.ok) {
      for (let i = 1; i < utilityOrder.ids.length; i++) await page.keyboard.press('Tab');
    }
    const utility = await page.evaluate((order) => {
      const sh = document.querySelector('.sheet');
      const box = document.querySelector('.h0-notices');
      const active = document.activeElement;
      const lastId = order && order.ids ? order.ids[order.ids.length - 1] : '';
      const target = lastId ? document.getElementById(lastId) : null;
      if (!order || !order.ok || !sh || !box || !target) return { ok: false, order };
      const br = box.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      const capped = /auto|scroll/.test(order.overflowY) && order.scrollHeight > order.clientHeight;
      const keyboardReachable = active === target && tr.top >= br.top - 1 && tr.bottom <= br.bottom + 1;
      return {
        ok: capped && keyboardReachable && sh.scrollTop === 0,
        capped,
        keyboardReachable,
        activeId: active && active.id || '',
        targetId: lastId,
        utilityScrollTop: box.scrollTop,
        sheetScrollTop: sh.scrollTop,
        clientHeight: order.clientHeight,
        scrollHeight: order.scrollHeight,
        targetTop: Math.round(tr.top),
        targetBottom: Math.round(tr.bottom),
        boxTop: Math.round(br.top),
        boxBottom: Math.round(br.bottom)
      };
    }, utilityOrder);
    saved.commandUtilities = utility;
    saved.checks.commandUtilitiesDesktopCapped = !!utility.capped;
    saved.checks.commandUtilitiesKeyboardReachable = !!utility.keyboardReachable && utility.sheetScrollTop === 0;
    if (!saved.checks.commandUtilitiesDesktopCapped) saved.failures.push('Command Utilities did not own desktop overflow: ' + JSON.stringify(utility));
    if (!saved.checks.commandUtilitiesKeyboardReachable) saved.failures.push('last Command Utility was not keyboard-reachable inside its scroller: ' + JSON.stringify(utility));
    await page.evaluate(() => {
      const sh = document.querySelector('.sheet');
      const box = document.querySelector('.h0-notices');
      if (sh) sh.scrollTop = 0;
      if (box) box.scrollTop = 0;
    });
    // Two-state screenshots (§5 tooth 5): the saved state at all three widths.
    for (const vp of VIEWPORTS) {
      try {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(400);
        await page.evaluate(() => { const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; });
        await withTimeout('screenshot saved-' + vp.name, page.screenshot({ path: join(OUT, `probe-h0-main-menu-saved-${vp.name}.png`), fullPage: false }), SLOW_MAC.screenshot);
      } catch (e) { saved.screenshotWarning = String(e && e.message || e); }
    }
    await page.setViewportSize({ width: VIEWPORTS[0].width, height: VIEWPORTS[0].height });
    await page.waitForTimeout(300);

    const nudge = await inspectNudgeState(page);
    saved.nudgeState = nudge;
    for (const f of nudge.failures || []) saved.failures.push('nudge: ' + f);
    try {
      await page.evaluate(() => { const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; });
      await withTimeout('screenshot nudge', page.screenshot({ path: join(OUT, 'probe-h0-main-menu-nudge.png'), fullPage: false }), SLOW_MAC.screenshot);
    } catch (e) { saved.screenshotWarning = String(e && e.message || e); }

    const wd = await inspectWarDept(page);
    saved.warDept = wd;
    for (const f of wd.failures || []) saved.failures.push('wardept: ' + f);
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

    const region = inspectGeneratedRegion();
    if (region.failures.length) result.ok = false;
    result.generatedRegion = region;
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
  for (const f of (result.generatedRegion && result.generatedRegion.failures) || []) failures.push('generated: ' + f);
  const totalChecks = (result.probes || []).length + (result.savedCampaign ? 1 : 0) + (result.generatedRegion ? 1 : 0);
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
