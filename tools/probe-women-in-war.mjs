#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D153 focused browser gate for the Women in the War presentation lane.
// Verifies the card data/schema is visible in the Campaign Kit, remains separate
// from Soldier's Story replacements, reuses codex portraits, filters cleanly, and
// keeps the Disputed Velazquez warning visible. Writes shots/probe-women-in-war.json.

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

function staticWomenSeparationScan() {
  const files = [
    'src/85-battle-bridge.js',
    'src/86-battle-conditioning.js',
    'src/87-auto-resolve.js',
    'src/tactical/T0-field-sandbox.js',
    'src/tactical/T1-bull-run.js',
    'src/tactical/T2-campaign-link.js',
    'src/tactical/T3-officers.js',
    'src/tactical/T4-logistics.js',
    'src/tactical/T5-arms.js',
    'src/tactical/T6-presets.js',
    'src/tactical/T7-command-side.js',
    'src/tactical/T8-phases.js',
    'src/tactical/T14-ratings.js',
    'src/82-after-action.js'
  ];
  const leaks = [];
  const re = /women-in-war|wiwThread|wiwWireThread|GAME_DATA\s*\[\s*["']women-in-war["']\s*\]|gameData\(\s*["']women-in-war["']\s*\)/;
  for (const f of files) {
    try { if (re.test(readFileSync(join(ROOT, f), 'utf8'))) leaks.push(f); } catch {}
  }
  return { scanned: files.length, leaks };
}

const SETUP = `(() => {
  var R = { ok:true, steps:[], errors:[] };
  function step(name, fn) {
    try { var v = fn(); R.steps.push({ name:name, ok:true, v:v === undefined ? null : v }); }
    catch(e) { R.ok = false; R.steps.push({ name:name, ok:false, err:String(e && e.message || e) }); }
  }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message || ev.error || ev)); });
  function mkC() {
    var C = { side:'US', iron:false, idx:0, funds:900, recovery:false, completed:[],
      roster:[{ id:'R1', type:'inf', weapon:'springfield', xp:1, name:'Probe Infantry' }],
      nextId:2, stats:{ battles:0, won:0, infl:0, suff:0 }, recoveryLossCount:0,
      recoveryMode:false, flipAtk:false, captured:[] };
    G.campaign = C;
    if (typeof _t1InitAll === 'function') _t1InitAll(C);
    return C;
  }
  function mountLoot(C) {
    var w = document.getElementById('wdContent');
    if (!w) { w = document.createElement('div'); w.id = 'wdContent'; document.body.appendChild(w); }
    w.innerHTML = lootRenderTab(C);
    lootWireTab(C);
    return w;
  }
  function visibleCards() {
    var cards = document.querySelectorAll('[data-wiw-card]'), out = [];
    for (var i = 0; i < cards.length; i++) if (cards[i].style.display !== 'none') out.push(cards[i]);
    return out;
  }
  function ids(nodes) {
    var out = [];
    for (var i = 0; i < nodes.length; i++) out.push(nodes[i].getAttribute('data-wiw-id'));
    return out;
  }
  try {
    if (typeof wiwThreadHTML !== 'function' || typeof wiwWireThread !== 'function') return JSON.stringify({ ok:false, fatal:'women-in-war module missing' });
    var C = mkC();
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';

    step('DATA: canonical women-in-war pack is separate from soldier replacements', function() {
      var d = GAME_DATA && GAME_DATA['women-in-war'];
      if (!d || d.schema !== 'cw_women_in_war_v1') throw new Error('missing women schema');
      if (!Array.isArray(d.records) || d.records.length !== 7) throw new Error('expected 7 women records');
      var repl = GAME_DATA['soldier-replacements'];
      if (!repl || !Array.isArray(repl.records)) throw new Error('missing soldier replacements records array');
      var replacementWomenLeaks = [];
      for (var j = 0; j < repl.records.length; j++) {
        var rr = repl.records[j] || {};
        if (rr.id && d.records.some(function(w){ return w.id === rr.id; })) replacementWomenLeaks.push(rr.id);
        if (rr.replacePid && String(rr.replacePid).indexOf('ss:') !== 0) replacementWomenLeaks.push(String(rr.id || j) + ':badReplacePid');
      }
      if (replacementWomenLeaks.length) throw new Error('women/replacement cross-lane leaks: ' + replacementWomenLeaks.join(','));
      var verified = 0, disputed = 0, bad = [];
      for (var i = 0; i < d.records.length; i++) {
        var r = d.records[i];
        if (r.id && r.id.indexOf('ss:') === 0) bad.push(r.id);
        if (Object.prototype.hasOwnProperty.call(r, 'replacePid')) bad.push(r.id + ':replacePid');
        if (!r.registryMappable || r.registryMappable.canMap !== false) bad.push(r.id + ':canMap');
        if (r.provenance === 'Verified') verified++;
        if (r.provenance === 'Disputed') disputed++;
      }
      if (bad.length) throw new Error('separation violations: ' + bad.join(','));
      if (verified !== 6 || disputed !== 1) throw new Error('expected 6 Verified / 1 Disputed, got ' + verified + '/' + disputed);
      return { records:d.records.length, verified:verified, disputed:disputed, replacementRecords:repl.records.length };
    });

    step('REGISTRY: the seven women cards do not enter ssPersonRegistry', function() {
      var reg = ssPersonRegistry(C), txt = reg.people.map(function(p){ return p.name; }).join('\\n').toLowerCase();
      ['wakeman','cashier','velazquez','clara barton','harriet tubman','mary edwards walker','dorothea'].forEach(function(name) {
        if (txt.indexOf(name) >= 0) throw new Error('women-thread name leaked into registry: ' + name);
      });
      return { registryPeople:reg.people.length };
    });

    step('UI: Campaign Kit renders seven Women in the War cards with required names', function() {
      mountLoot(C);
      var root = document.getElementById('wiwThread');
      if (!root) throw new Error('missing wiwThread section');
      var cards = document.querySelectorAll('[data-wiw-card]');
      if (cards.length !== 7) throw new Error('expected 7 cards, got ' + cards.length);
      var text = root.textContent;
      ['Sarah Rosetta Wakeman','Albert D. J. Cashier','Loreta Janeta Velazquez','Clara Barton','Dr. Mary Edwards Walker','Harriet Tubman','Dorothea Lynde Dix'].forEach(function(name) {
        if (text.indexOf(name) < 0) throw new Error('missing visible name: ' + name);
      });
      if (!document.getElementById('wiwSearch') || !document.getElementById('wiwRole') || !document.getElementById('wiwProv')) throw new Error('missing search/filter controls');
      var cnt = document.getElementById('wiwCount');
      if (!cnt || cnt.getAttribute('aria-live') !== 'polite') throw new Error('wiwCount should be aria-live');
      return { cards:cards.length, text:text.slice(0,120) };
    });

    step('DISPUTED: Velazquez renders only as Disputed with the dispute note visible', function() {
      var card = document.querySelector('[data-wiw-id="velazquez-loreta-janeta"]');
      if (!card) throw new Error('missing Velazquez card');
      if (card.getAttribute('data-wiw-prov') !== 'Disputed') throw new Error('Velazquez not marked Disputed');
      var text = card.textContent;
      if (text.indexOf('Dispute note:') < 0 || text.indexOf('no military service record for "Harry T. Buford"') < 0) throw new Error('dispute note not visible');
      if (GAME_DATA['women-in-war'].records.filter(function(r){ return r.id === 'velazquez-loreta-janeta' && r.provenance === 'Verified'; }).length) throw new Error('Velazquez data was upgraded to Verified');
      if (!/Disputed/.test(text)) throw new Error('Disputed label is not visible');
      return { disputed:true };
    });

    step('PORTRAITS: existing codex portraits are reused; no unverified Wakeman portrait is asserted', function() {
      ['barton-clara','walker-mary-edwards','dix-dorothea-lynde','tubman-harriet'].forEach(function(id) {
        var card = document.querySelector('[data-wiw-id="' + id + '"]');
        if (!card) throw new Error('missing card ' + id);
        var img = card.querySelector('img');
        if (!img || String(img.getAttribute('src') || '').indexOf('data:image/') !== 0) throw new Error('codex portrait not reused for ' + id);
      });
      var wakeman = document.querySelector('[data-wiw-id="wakeman-sarah-rosetta"]');
      if (!wakeman) throw new Error('missing Wakeman card');
      if (wakeman.querySelector('img')) throw new Error('Wakeman should not render a portrait');
      if (wakeman.textContent.indexOf('No verified portrait used') < 0) throw new Error('Wakeman no-portrait notice missing');
      return { portraits:4, wakemanNoPortrait:true };
    });

    step('FILTERS: search, role, and provenance filters narrow without re-rendering the desk', function() {
      var search = document.getElementById('wiwSearch'), role = document.getElementById('wiwRole'), prov = document.getElementById('wiwProv');
      search.value = 'Combahee';
      search.dispatchEvent(new Event('input', { bubbles:true }));
      var shown = visibleCards();
      if (shown.length !== 1 || shown[0].getAttribute('data-wiw-id') !== 'tubman-harriet') throw new Error('Combahee search expected Tubman only: ' + ids(shown).join(','));
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles:true }));
      role.value = 'contested';
      role.dispatchEvent(new Event('change', { bubbles:true }));
      shown = visibleCards();
      if (shown.length !== 1 || shown[0].getAttribute('data-wiw-id') !== 'velazquez-loreta-janeta') throw new Error('contested role expected Velazquez only: ' + ids(shown).join(','));
      role.value = '';
      role.dispatchEvent(new Event('change', { bubbles:true }));
      prov.value = 'Disputed';
      prov.dispatchEvent(new Event('change', { bubbles:true }));
      shown = visibleCards();
      if (shown.length !== 1 || shown[0].getAttribute('data-wiw-id') !== 'velazquez-loreta-janeta') throw new Error('Disputed provenance expected Velazquez only: ' + ids(shown).join(','));
      return { shown:ids(shown) };
    });

    step('EMPTY-DATA NO-OP: an empty records array renders no section', function() {
      var original = GAME_DATA['women-in-war'];
      GAME_DATA['women-in-war'] = { schema:'cw_women_in_war_v1', records:[] };
      try {
        var html = wiwThreadHTML(C);
        if (html !== '') throw new Error('empty women-in-war data should render exact empty string');
      } finally {
        GAME_DATA['women-in-war'] = original;
      }
      return { noOp:true };
    });

    step('A11Y/XSS: controls have labels, focus rings are scoped, and entry text is escaped', function() {
      var original = GAME_DATA['women-in-war'];
      var copy = JSON.parse(JSON.stringify(original));
      copy.records = copy.records.slice();
      copy.records.push({
        id:'xss-probe', canonicalName:'<img src=x onerror="window.__wiwXss=1">', wartimeAlias:'',
        roleCategory:'relief', side:'US', wartimeRole:'<b>bad</b>', unitClaimed:'', battleClaimed:'',
        provenance:'Inferred', registryMappable:{canMap:false, reason:'probe'}, sources:[
          {title:'A', repository:'A', locator:'A', type:'secondary', supports:'A', independent:true},
          {title:'B', repository:'B', locator:'B', type:'secondary', supports:'B', independent:true}
        ],
        playerCopy:'This is a safe probe record with enough words to exercise the escaping path without executing markup or event handlers in the generated Women in the War card surface for this browser gate.',
        integrityNote:'probe', warningFlags:['probe']
      });
      window.__wiwXss = 0;
      GAME_DATA['women-in-war'] = copy;
      try {
        var html = wiwThreadHTML(C);
        if (html.indexOf('#wiwThread input:focus-visible') < 0) throw new Error('missing focus-visible CSS');
        mountLoot(C);
        if (window.__wiwXss !== 0) throw new Error('XSS payload executed');
        if (!document.querySelector('label span') || !document.getElementById('wiwSearch')) throw new Error('search label/control missing');
        var payloadImg = document.querySelector('#wiwThread img[src="x"]');
        if (payloadImg) throw new Error('payload img reached DOM');
      } finally {
        GAME_DATA['women-in-war'] = original;
        mountLoot(C);
      }
      return { escaped:true };
    });

    try {
      if (typeof openWarDept === 'function') {
        G.campaign = C;
        openWarDept();
        var tab = document.getElementById('wdTab_loot');
        if (tab) tab.click();
      } else {
        mountLoot(C);
      }
      var root = document.getElementById('wiwThread');
      if (root && root.scrollIntoView) root.scrollIntoView({ block:'center' });
    } catch (viewErr) {
      R.errors.push('view:' + String(viewErr && viewErr.message || viewErr));
    }
  } catch(e) { R.ok = false; R.errors.push('FATAL ' + String(e && e.message || e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const staticScan = staticWomenSeparationScan();
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) {
    srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
    for (let i = 0; i < 80; i++) { if (await up(probe)) break; await sleep(150); }
  }
  let browser;
  try { browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }); }
  catch { browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = [];
  page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok: false };
  try {
    await page.goto(probe, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.staticScan = staticScan;
    if (staticScan.leaks.length) result.ok = false;
    const shotPath = join(OUT, 'probe-women-in-war.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    const shot = statSync(shotPath);
    result.screenshot = { path: shotPath, bytes: shot.size };
    if (!shot.size) result.ok = false;
    result.pageerrors = pageerrors;
    if (pageerrors.length) result.ok = false;
  } catch (e) {
    result = { ok: false, fatal: String(e && e.message || e), pageerrors, staticScan };
  } finally {
    writeFileSync(join(OUT, 'probe-women-in-war.json'), JSON.stringify(result, null, 2));
    await browser.close();
    if (srv) srv.kill();
  }
  console.log('probe-women-in-war ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.staticScan) console.log('  staticScan leaks=' + result.staticScan.leaks.length + ' scanned=' + result.staticScan.scanned);
  if (result.screenshot) console.log('  screenshot ' + result.screenshot.path + ' bytes=' + result.screenshot.bytes);
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
