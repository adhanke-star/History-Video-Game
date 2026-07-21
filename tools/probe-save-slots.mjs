#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-save-slots.mjs — Phase J focused gate for save/load/share hardening.
// Verifies named slots, rename/load/delete, import/export round trip, invalid payload
// handling, no-latch menu reinjection, and D35 one-turn undo on learner-friendly terms.
// E13 (D244) + E50: also boots the page with TAMPERED autosaves carrying an own
// hasOwnProperty first in settings and then deep in campaign command state. The gate
// requires every accept lane to reject the deep campaign poison, applySave to stay
// atomic, the boot to remain clean, and every legitimate save to remain byte-identical.

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

const SETUP = `(() => {
  var R = { ok:true, steps:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  function cleanStore() {
    try {
      for (var i = 0; i < 3; i++) localStorage.removeItem('gor_slot_' + i);
      localStorage.removeItem('gor_undo_last');
      localStorage.removeItem('gor_save');
    } catch(e) {}
  }
  function mkC(side, idx) {
    var C = { side:side || 'US', iron:false, idx:idx || 0, funds:900, recovery:false, completed:[],
      roster:[{ id:'R1', type:'inf', weapon:'springfield', xp:1, name:'Probe Infantry' }],
      nextId:2, stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0,
      recoveryMode:false, flipAtk:false, captured:[] };
    if (typeof _t1InitAll === 'function') _t1InitAll(C);
    return C;
  }
  function slotCount() { return document.querySelectorAll('#gnSaveLoad').length; }
  function input(id, value) {
    var el = document.getElementById(id); if (!el) throw new Error('missing input ' + id);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles:true }));
    return el;
  }
  try {
    cleanStore();
    G.mode = 'menu';
    G.settings = G.settings || {};
    G.settings.diff = 1;
    G.campaign = mkC('US', 0);

    step('API: save-slot helpers and campaignAdvance wrapper are present', function() {
      ['_slOpenManager','_slRead','_slWrite','_slSetSlotName','_slImportText','_slImportFile','_slExportString','_slCaptureUndo','_slRestoreUndo','_slInjectMenuButton'].forEach(function(n) {
        if (typeof window[n] !== 'function') throw new Error('missing ' + n);
      });
      if (typeof campaignAdvance !== 'function' || !campaignAdvance._slUndoWrapped) throw new Error('campaignAdvance not undo-wrapped');
      if (typeof importSave !== 'function' || !importSave._slHardened) throw new Error('importSave not hardened');
      return { wrapped:true, importHardened:true };
    });

    step('MENU: Save & Load button injects once, dedupes, and re-injects after removal/rebuild', function() {
      if (typeof openMainMenu === 'function') openMainMenu();
      _slInjectMenuButton(); _slInjectMenuButton();
      if (slotCount() !== 1) throw new Error('button count after dedupe ' + slotCount());
      var b = document.getElementById('gnSaveLoad');
      if (!b || !/Save and Load/.test(b.getAttribute('aria-label') || '')) throw new Error('button missing usable aria-label');
      b.parentNode.removeChild(b);
      _slInjectMenuButton();
      if (slotCount() !== 1) throw new Error('button did not re-inject after removal');
      openMainMenu(); _slInjectMenuButton();
      if (slotCount() !== 1) throw new Error('button duplicated after menu rebuild: ' + slotCount());
      return { button:true };
    });

    step('UI: manager renders three named slots, paste import, export/import, and accessible controls', function() {
      _slOpenManager();
      if (document.querySelectorAll('.sl-row').length !== 3) throw new Error('expected 3 slot rows');
      if (!document.getElementById('slImportJson')) throw new Error('paste-import textarea missing');
      ['slExport','slImport','slImportPaste','slBack','slSave0'].forEach(function(id){ if (!document.getElementById(id)) throw new Error('missing ' + id); });
      var bad = [];
      document.querySelectorAll('.sl-row button,input,textarea').forEach(function(el) {
        if (el.tagName === 'BUTTON' && !el.textContent.trim()) bad.push(el.id || el.tagName);
        if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && !(el.getAttribute('aria-label') || document.querySelector('label[for="' + el.id + '"]'))) bad.push(el.id || el.tagName);
      });
      if (bad.length) throw new Error('weak control labels: ' + bad.join(','));
      return { rows:3 };
    });

    step('SLOTS: save, rename, load, and delete use validated payloads', function() {
      // D234: load/delete/overwrite now confirm — accept the dialogs for this happy-path flow
      var origConfirm = window.confirm; window.confirm = function() { return true; };
      try {
        G.campaign = mkC('US', 0);
        _slOpenManager();
        input('slName0', 'Probe Slot');
        document.getElementById('slSave0').click();
        var m0 = _slMeta(0);
        if (!m0 || m0.label !== 'Probe Slot' || m0.side !== 'Union') throw new Error('slot save/meta failed: ' + JSON.stringify(m0));
        _slOpenManager();
        input('slName0', 'Renamed Probe');
        document.getElementById('slRename0').click();
        if ((_slMeta(0) || {}).label !== 'Renamed Probe') throw new Error('rename failed: ' + JSON.stringify(_slMeta(0)));
        G.campaign = mkC('CS', 2);
        _slOpenManager();
        document.getElementById('slLoad0').click();
        if (!G.campaign || G.campaign.side !== 'US' || G.campaign.idx !== 0) throw new Error('load did not restore slot campaign: ' + JSON.stringify(G.campaign && { side:G.campaign.side, idx:G.campaign.idx }));
        _slOpenManager();
        document.getElementById('slDel0').click();
        if (_slRead(0)) throw new Error('delete left a readable slot');
      } finally { window.confirm = origConfirm; }
      return { ok:true };
    });

    step('S31-S34 (D234): destructive save-manager actions confirm; declines block; incompatible slots are protected', function() {
      cleanStore();
      var orig = window.confirm, calls = [], allow = false;
      window.confirm = function(m) { calls.push(String(m)); return allow; };
      try {
        // S31: saving to an EMPTY slot never prompts; overwriting a FILLED slot confirms + a decline keeps it
        G.campaign = mkC('US', 0); _slOpenManager();
        input('slName0', 'Keep Me');
        document.getElementById('slSave0').click();
        if (calls.length) throw new Error('saving to an EMPTY slot prompted a confirm');
        if ((_slMeta(0) || {}).label !== 'Keep Me') throw new Error('setup save failed');
        G.campaign = mkC('CS', 2); _slOpenManager();
        document.getElementById('slSave0').click();
        if (!calls.length) throw new Error('overwriting a filled slot did not confirm (S31)');
        if ((_slMeta(0) || {}).label !== 'Keep Me') throw new Error('a DECLINED overwrite still replaced the save');
        // S32: loading over a live campaign confirms + a decline keeps the live campaign
        calls.length = 0;
        document.getElementById('slLoad0').click();
        if (!calls.length) throw new Error('loading over a live campaign did not confirm (S32)');
        if (!G.campaign || G.campaign.side !== 'CS') throw new Error('a DECLINED load still replaced the live campaign');
        // S33: delete confirms + a decline keeps the save; an accept clears it
        calls.length = 0;
        document.getElementById('slDel0').click();
        if (!calls.length) throw new Error('delete did not confirm (S33)');
        if (!_slRead(0)) throw new Error('a DECLINED delete still erased the slot');
        allow = true;
        document.getElementById('slDel0').click();
        if (_slRead(0)) throw new Error('an ACCEPTED delete left the slot readable');
        // S34: raw-present-but-invalid renders as Incompatible (Save disabled, Delete enabled, labeled)
        localStorage.setItem('gor_slot_1', '{ damaged');
        _slOpenManager();
        var sv1 = document.getElementById('slSave1');
        if (!sv1 || !sv1.disabled) throw new Error('incompatible slot leaves Save enabled (clobber risk, S34)');
        var del1 = document.getElementById('slDel1');
        if (!del1 || del1.disabled) throw new Error('incompatible slot should keep Delete enabled (S34)');
        var sheetTxt = (document.body.textContent || '');
        if (sheetTxt.indexOf('Incompatible save') < 0) throw new Error('incompatible slot not labeled distinctly (S34)');
        del1.click();   // allow still true
        if (localStorage.getItem('gor_slot_1') != null) throw new Error('delete did not clear the incompatible raw');
        // S32 (review-caught): the BASE MENU Load-from-File lane (the hardened global importSave) must
        // confirm too — a decline leaves the live campaign untouched and opens no picker.
        allow = false; calls.length = 0;
        G.campaign = mkC('CS', 2);
        importSave(function () { throw new Error('declined importSave still invoked its callback'); });
        if (!calls.length) throw new Error('menu Load-from-File did not confirm over a live campaign (S32)');
        if (!G.campaign || G.campaign.side !== 'CS') throw new Error('declined menu import disturbed the live campaign');
        cleanStore();
      } finally { window.confirm = orig; }
      return { guarded: true };
    });

    step('IMPORT/EXPORT: JSON round trip restores campaign and rejects malformed/invalid payloads', function() {
      G.campaign = mkC('CS', 2);
      G.campaign.funds = 1776;
      var json = _slExportString(serializeSave());
      G.campaign = mkC('US', 0);
      var r = _slImportText(json);
      if (!r.ok) throw new Error('valid import rejected: ' + r.reason);
      if (G.campaign.side !== 'CS' || G.campaign.idx !== 2 || G.campaign.funds !== 1776) throw new Error('import did not restore campaign');
      if (_slImportText('{ broken').ok) throw new Error('malformed JSON accepted');
      if (_slImportText(JSON.stringify({ ver:_SAVE_VER, settings:[], campaign:null })).ok) throw new Error('settings array accepted');
      if (_slImportText(JSON.stringify({ ver:_SAVE_VER, settings:{}, campaign:7 })).ok) throw new Error('primitive campaign accepted');
      if (_slImportText(JSON.stringify({ ver:_SAVE_VER, settings:{ hasOwnProperty:7 }, campaign:null })).ok) throw new Error('hasOwnProperty-shadow settings accepted');
      if (_slImportText(JSON.stringify({ ver:_SAVE_VER, settings:{}, campaign:{ president:{ command:{ transfer:{ ids:{ hasOwnProperty:7 } } } } } })).ok) throw new Error('deep hasOwnProperty-shadow campaign import accepted (E50)');
      return { bytes:json.length, side:G.campaign.side };
    });

    step('VALIDATION: stale slots, corrupt JSON, and wrong versions are hidden safely', function() {
      localStorage.setItem('gor_slot_0', '{ bad');
      if (_slRead(0)) throw new Error('corrupt JSON slot read as valid');
      localStorage.setItem('gor_slot_1', JSON.stringify({ ver:_SAVE_VER + 1, settings:{}, campaign:null }));
      if (_slRead(1)) throw new Error('future-version slot read as valid');
      localStorage.setItem('gor_slot_2', JSON.stringify({ ver:_SAVE_VER, settings:{}, campaign:3 }));
      if (_slRead(2)) throw new Error('primitive campaign slot read as valid');
      localStorage.setItem('gor_slot_2', JSON.stringify({ ver:_SAVE_VER, settings:{ hasOwnProperty:7 }, campaign:null }));
      if (_slRead(2)) throw new Error('hasOwnProperty-shadow settings slot read as valid');
      localStorage.setItem('gor_slot_2', JSON.stringify({ ver:_SAVE_VER, settings:{}, campaign:{ president:{ command:{ transfer:{ ids:{ hasOwnProperty:7 } } } } } }));
      if (_slRead(2)) throw new Error('deep hasOwnProperty-shadow campaign slot read as valid (E50)');
      cleanStore();
      return { ok:true };
    });

    step('UNDO: learner-friendly campaign captures before campaignAdvance and restores exactly once', function() {
      cleanStore();
      G.settings.diff = 1;
      G.campaign = mkC('US', 0);
      G.battle = { playerSide:'US', enemySide:'CS', bd:{ id:'sumter', name:'Fort Sumter', year:1861 },
        infl:{ US:0, CS:0 }, casualties:{ US:0, CS:0 },
        units:[{ side:'US', alive:true, type:'inf', vetId:'R1', weapon:'springfield', xp:1, kills:0, name:'Probe Infantry' },
               { side:'CS', alive:false, type:'inf', id:'E1', weapon:'rifle', xp:0, kills:0, name:'Enemy' }] };
      campaignAdvance('US', 'win');
      if (!G.campaign || G.campaign.idx !== 1 || G.campaign.stats.battles !== 1) throw new Error('advance precondition failed');
      if (!_slReadUndo() || !_slUndoAvailable()) throw new Error('undo snapshot unavailable after accessible advance');
      _slOpenManager();
      var u = document.getElementById('slUndo');
      if (!u) throw new Error('undo button missing from manager');
      u.click();
      if (!G.campaign || G.campaign.idx !== 0 || G.campaign.stats.battles !== 0 || G.campaign.completed.length !== 0) throw new Error('undo did not restore pre-turn campaign');
      if (_slReadUndo()) throw new Error('undo snapshot was not cleared after restore');
      return { idx:G.campaign.idx, battles:G.campaign.stats.battles };
    });

    step('UNDO: hardened and Ironman terms do not retain an undo snapshot', function() {
      cleanStore();
      G.settings.diff = 3;
      G.campaign = mkC('US', 0);
      _slCaptureUndo('US', 'win');
      if (_slReadUndo()) throw new Error('hardened difficulty captured undo');
      G.settings.diff = 1;
      G.campaign = mkC('US', 0);
      G.campaign.iron = true;
      _slCaptureUndo('US', 'win');
      if (_slReadUndo()) throw new Error('ironman captured undo');
      G.campaign.iron = false;
      return { ok:true };
    });

    step('STATIC: save-slot hardening stays out of tactical/combat state and does not redeclare campaignAdvance', function() {
      var txt = window.__SL_SRC__ || '';
      if (/function\\s+campaignAdvance\\s*\\(/.test(txt)) throw new Error('campaignAdvance was redeclared instead of wrapped by assignment');
      if (/_SAVE_VER\\s*=/.test(txt)) throw new Error('module writes _SAVE_VER');
      if (/G\\.battle\\s*=/.test(txt)) throw new Error('module writes G.battle');
      return { scanned:txt.length };
    });

    step('POLITICS SAVE: absent legacy state stays absent; malformed optional state fails closed', function() {
      var legacy=mkC('US',0), sv={ver:_SAVE_VER,settings:{},campaign:legacy}; delete legacy.politics;
      applySave(JSON.parse(JSON.stringify(sv)));
      if(Object.prototype.hasOwnProperty.call(G.campaign,'politics')) throw new Error('legacy absent politics field was created');
      var bad=mkC('US',0); bad.politics={applied:'tampered'}; applySave({ver:_SAVE_VER,settings:{},campaign:bad});
      if(Object.prototype.hasOwnProperty.call(G.campaign,'politics')) throw new Error('malformed politics state survived sanitation');
      var good=mkC('US',0); good.politics={applied:{'1864-presidential':true,evil:true}}; applySave({ver:_SAVE_VER,settings:{},campaign:good});
      if(!G.campaign.politics||G.campaign.politics.applied['1864-presidential']!==true||Object.prototype.hasOwnProperty.call(G.campaign.politics.applied,'evil')) throw new Error('politics allowlist sanitation failed');
      if(_SAVE_VER!==1) throw new Error('_SAVE_VER moved');
      return { legacyAbsent:true, malformedDropped:true, saveVer:_SAVE_VER };
    });

    return JSON.stringify(R);
  } catch(e) {
    return JSON.stringify({ ok:false, fatal:String(e && e.message || e), steps:R.steps });
  }
})()`;

// E13 (D244) tamper-boot phase — evaluated on a SECOND page load that booted with a
// tampered gor_save already in localStorage (seeded before reload). Without the
// 105-save-guard overrides this boot dies in applySave (src.hasOwnProperty is not a
// function) — the 0-pageerror artifact gate plus these steps are the regression teeth.
const E13BOOT = `(() => {
  var R = { ok:true, steps:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  step('E13 (D244): a tampered autosave (own hasOwnProperty in settings) cannot crash the boot and reads as absent', function() {
    if (typeof loadLocal !== 'function' || typeof applySave !== 'function' || typeof hasSave !== 'function') throw new Error('save API missing');
    if (G.mode !== 'menu') throw new Error('boot did not reach the main menu with the tampered autosave present (mode=' + G.mode + ')');
    if (loadLocal() !== null) throw new Error('tampered autosave was not rejected by loadLocal');
    if (hasSave()) throw new Error('hasSave() still true on a tampered autosave');
    if (Object.prototype.hasOwnProperty.call(G.settings, 'hasOwnProperty')) throw new Error('shadow key landed on G.settings');
    if (Object.prototype.hasOwnProperty.call(G.settings, '__e13Marker')) throw new Error('tampered settings were applied');
    return { rejected:true, mode:G.mode };
  });
  step('E13 (D244): applySave sanitizes a poisoned settings object — skips the shadow key, applies the rest, never throws', function() {
    var poisoned = JSON.parse('{"ver":0,"settings":{"hasOwnProperty":7,"__e13Direct":"x"},"campaign":null}');
    poisoned.ver = _SAVE_VER;
    applySave(poisoned);
    if (G.settings.__e13Direct !== 'x') throw new Error('legit sibling key was not applied');
    if (Object.prototype.hasOwnProperty.call(G.settings, 'hasOwnProperty')) throw new Error('shadow key copied onto G.settings');
    if (typeof G.settings.hasOwnProperty !== 'function') throw new Error('G.settings.hasOwnProperty no longer callable');
    delete G.settings.__e13Direct;
    return { sanitized:true };
  });
  step('E13 (D244): a legit save round-trips identically through the hardened loadLocal/applySave', function() {
    G.settings.__e13Legit = 'y';
    if (typeof saveLocal !== 'function') throw new Error('saveLocal missing');
    saveLocal();
    var sv = loadLocal();
    if (!sv) throw new Error('legit save rejected');
    if (sv.settings.__e13Legit !== 'y') throw new Error('legit save did not round-trip');
    delete G.settings.__e13Legit;
    applySave(sv);
    if (G.settings.__e13Legit !== 'y') throw new Error('applySave did not apply a legit key');
    delete G.settings.__e13Legit;
    localStorage.removeItem('gor_save');
    return { roundTrip:true };
  });
  step('STATIC (D244): 105-save-guard redeclares ONLY loadLocal/applySave and stays out of combat/save-version state', function() {
    // NOTE (D244 panel): this scans the on-disk MODULE SOURCE (source hygiene), not the served
    // build — build inclusion is proven behaviorally by the three steps above (a missing override
    // would crash the tampered boot / fail the rejection asserts) plus the E41 hash pins.
    var txt = window.__SG_SRC__ || '';
    if (!txt) throw new Error('module source not injected');
    var decls = (txt.match(/(^|\\n)\\s*function\\s+[A-Za-z_$][\\w$]*\\s*\\(/g) || []);
    if (decls.length !== 2) throw new Error('expected exactly 2 function declarations, saw ' + decls.length);
    if (!/function\\s+loadLocal\\s*\\(/.test(txt) || !/function\\s+applySave\\s*\\(/.test(txt)) throw new Error('loadLocal/applySave redeclarations missing');
    if (/_SAVE_VER\\s*=/.test(txt)) throw new Error('module writes _SAVE_VER');
    if (/G\\.battle\\s*=/.test(txt)) throw new Error('module writes G.battle');
    if (!/Object\\.prototype\\.hasOwnProperty\\.call/.test(txt)) throw new Error('tamper-proof iteration form missing');
    return { decls:2 };
  });
  return JSON.stringify(R);
})()`;

// E50 campaign-envelope phase — a THIRD page load begins with a payload that passes
// the old settings-only screen but poisons the D323 raw.ids command sink. Rejection at
// load plus atomic direct-apply behavior prevents the navigation-gated crash entirely.
const E50BOOT = `(() => {
  var R = { ok:true, steps:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  step('E50: a deep-poisoned campaign autosave is rejected before it can enter live state', function() {
    if (typeof loadLocal !== 'function' || typeof applySave !== 'function' || typeof hasSave !== 'function') throw new Error('save API missing');
    if (G.mode !== 'menu') throw new Error('boot did not reach the main menu with the tampered campaign present (mode=' + G.mode + ')');
    if (loadLocal() !== null) throw new Error('deep-poisoned campaign autosave was not rejected by loadLocal');
    if (hasSave()) throw new Error('hasSave() still true on a deep-poisoned campaign autosave');
    if (G.campaign && G.campaign.__e50Marker) throw new Error('deep-poisoned campaign entered G.campaign');
    return { rejected:true, mode:G.mode };
  });
  step('E50: applySave rejects a deep-poisoned campaign atomically', function() {
    var live = { __e50Live:'keep' };
    G.campaign = live;
    delete G.settings.__e50Setting;
    var poisoned = JSON.parse('{"ver":0,"settings":{"__e50Setting":"poison"},"campaign":{"president":{"command":{"transfer":{"ids":{"hasOwnProperty":7}}}}}}');
    poisoned.ver = _SAVE_VER;
    applySave(poisoned);
    if (G.campaign !== live || G.campaign.__e50Live !== 'keep') throw new Error('applySave replaced live campaign with deep-poisoned state');
    if (Object.prototype.hasOwnProperty.call(G.settings, '__e50Setting')) throw new Error('applySave partially applied settings before rejecting campaign');
    localStorage.removeItem('gor_save');
    return { atomic:true };
  });
  return JSON.stringify(R);
})()`;

async function main() {
  let server = null, browser = null;
  const probe = cfg.baseUrl + '/' + cfg.file;
  try {
    if (!(await up(probe))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 70; i++) { if (await up(probe)) break; await sleep(150); }
    }
    try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
    catch(e) { browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
    const page = await browser.newPage({ viewport: cfg.viewport });
    const pageerrors = [], consoleLines = [];
    page.on('pageerror', err => pageerrors.push(String(err.message)));
    page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') consoleLines.push('[' + msg.type() + '] ' + msg.text()); });
    await page.addInitScript(srcs => {
      window.__SL_SRC__ = srcs.sl;
      window.__SG_SRC__ = srcs.sg;
      try { localStorage.setItem('gor_welcomed', '1'); } catch(e) {}
    }, { sl: readFileSync(join(ROOT, 'src', '91-save-slots.js'), 'utf8'),
         sg: readFileSync(join(ROOT, 'src', '105-save-guard.js'), 'utf8') });
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(500);
    const data = JSON.parse(await page.evaluate(SETUP));
    await page.evaluate(`(() => { try { if (typeof _slOpenManager === 'function') _slOpenManager(); } catch(e) {} })()`);
    await sleep(250);
    // SLOW-MAC budget (D232/D233 class): the default 30s screenshot timeout flakes on the
    // 8GB Mac under WebGL ReadPixels stalls — grant the same 120s budget, assertions untouched.
    await page.screenshot({ path: join(OUT, 'probe-save-slots.png'), fullPage:false, timeout: 120000 });
    // E13 (D244): seed a TAMPERED autosave, reboot the page on top of it, and run the
    // tamper-boot teeth. The pageerror listener persists across the reload, so a boot
    // crash (the pre-E13 behavior) fails the artifact's 0-pageerror gate.
    await page.evaluate(`(() => {
      localStorage.setItem('gor_save', JSON.stringify({ ver: _SAVE_VER, when: 1,
        settings: { hasOwnProperty: 7, __e13Marker: 'tampered' }, campaign: null }));
    })()`);
    await page.reload({ waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(500);
    const e13 = JSON.parse(await page.evaluate(E13BOOT));
    data.steps = (data.steps || []).concat(e13.steps || []);
    data.ok = !!data.ok && !!e13.ok;
    // E50: repeat with a settings-clean save whose poison lives deep in the campaign
    // envelope. Pre-fix this payload applies at boot and survives until Command opens.
    await page.evaluate(`(() => {
      localStorage.setItem('gor_save', JSON.stringify({ ver: _SAVE_VER, when: 1,
        settings: {}, campaign: { __e50Marker: 'tampered', side: 'US', president: {
          command: { transfer: { battleId: 'sumter', theater: 'Eastern',
            ids: { hasOwnProperty: 7, 'us-thomas': { theater: 'Eastern', turn: 1 } } } }
        } } }));
    })()`);
    await page.reload({ waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(500);
    const e50 = JSON.parse(await page.evaluate(E50BOOT));
    data.steps = (data.steps || []).concat(e50.steps || []);
    data.ok = !!data.ok && !!e50.ok;
    const actionableConsoleErrors = consoleLines.filter(line => line.startsWith('[error]') && !/Failed to load resource:.*404/i.test(line));
    data.pageerrors = pageerrors;
    data.console = consoleLines.slice(-20);
    data.ok = !!data.ok && !pageerrors.length && !actionableConsoleErrors.length;
    writeFileSync(join(OUT, 'probe-save-slots.json'), JSON.stringify(data, null, 2));
    const ok = (data.steps || []).filter(s => s.ok).length;
    const fail = (data.steps || []).filter(s => !s.ok).length;
    console.log('probe-save-slots: ' + ok + '/' + (data.steps || []).length + ' steps ok' + (fail ? ', ' + fail + ' FAIL' : ', 0 fail') + ' pageerrors=' + pageerrors.length);
    if (!data.ok || fail || pageerrors.length || actionableConsoleErrors.length) {
      if (data.fatal) console.error('FATAL:', data.fatal);
      for (const s of (data.steps || [])) if (!s.ok) console.error('  FAIL:', s.name, s.err);
      for (const e of pageerrors) console.error('  PAGE ERROR:', e);
      for (const c of actionableConsoleErrors) console.error('  CONSOLE:', c);
      process.exit(1);
    }
    console.log('ALL OK');
  } finally {
    if (browser) try { await Promise.race([browser.close(), sleep(2500)]); } catch(e) {}
    if (server) server.kill();
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
