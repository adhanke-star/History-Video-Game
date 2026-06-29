#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-photo-embed.mjs
// Focused probe for H1 / D71 — the OFFLINE PORTRAIT TIER (src/21-photo-embed.js + the build.mjs
// __ASSETS embed stage + tools/prep-embed-assets.mjs). Verifies:
//  - the build INLINES a portrait tier: __ASSETS carries the 156 "portraits/<stem>" keys as data: URLs;
//  - the override is installed once: window.portraitFor._phe === true;
//  - SERVED-FROM-ROOT (assets/ reachable): a known portrait resolves to a JPEG photo (hi-res or embedded);
//  - OFFLINE PORTABILITY (assets/portraits/ blocked, simulating the single file moved away from assets/):
//    a known portrait STILL resolves to a JPEG photo (the embedded tier) — NOT the procedural PNG engraving;
//  - side-specific keys resolve distinctly (Anderson CS != Anderson US; Gregg CS != Gregg US);
//  - the FALLBACK CHAIN holds: an unknown name with no embedded photo + no hi-res returns the PNG engraving;
//  - the LEAD-BADGE upgrade: a .lead-badge[data-portrait-done] still showing an engraving is swapped to the
//    embedded photo by the module's own observer (the base MutationObserver uses the closure portraitFor, not window);
//  - COMBAT BYTE-IDENTICAL purity (D74): a static scan proves 21-photo-embed.js never calls fldRng / writes the
//    sim / bumps _SAVE_VER, no combat/tactical file references the _phe* internals, and build.mjs keeps the
//    embed stage + the budget guard + the data-URL hex mask; the disk tier exists (assets/embed/portraits/, 156);
//  - 0 pageerrors throughout.
// (The 9-baseline seed-for-seed byte-identity gate stays owned by probe-presets.)

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const EXPECTED_PORTRAIT_COUNT = 156;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

/* ---------- STATIC SCAN: combat purity + pipeline integrity ---------- */
function staticScan() {
  // 1. the override module is presentation-only.
  let mod = ''; try { mod = readFileSync(join(ROOT, 'src', '21-photo-embed.js'), 'utf8'); } catch (e) {}
  check('static: src/21-photo-embed.js exists', mod.length > 0);
  check('static: 21-photo-embed.js never calls fldRng', mod.length > 0 && !/fldRng\s*\(/.test(mod));
  check('static: 21-photo-embed.js never bumps _SAVE_VER', mod.length > 0 && !/_SAVE_VER/.test(mod));
  check('static: 21-photo-embed.js never touches __FIELD / the sim', mod.length > 0 && !/__FIELD/.test(mod) && !/\.men\s*=|\.victory\s*=|\.casualties/.test(mod));
  check('static: 21-photo-embed.js reads the bare-name __ASSETS global', /__ASSETS/.test(mod) && !/window\.__ASSETS/.test(mod));
  // 2. no combat/tactical/strategy module reaches into the _phe* internals.
  const dirs = [join(ROOT, 'src'), join(ROOT, 'src', 'tactical')];
  const leaks = [];
  for (const d of dirs) {
    let fs = []; try { fs = readdirSync(d).filter(f => /\.js$/.test(f) && f !== '21-photo-embed.js'); } catch (e) { continue; }
    for (const f of fs) {
      let t = ''; try { t = readFileSync(join(d, f), 'utf8'); } catch (e) { continue; }
      if (/_pheFrame|_pheMount|_pheWarm|_pheLookup|phePortraitFor|_pheUpgrade/.test(t)) leaks.push(f);
    }
  }
  check('static: no other module references the _phe* internals', leaks.length === 0, leaks.join(', '));
  // 3. build.mjs keeps the embed stage + budget guard + the data-URL hex mask.
  let b = ''; try { b = readFileSync(join(ROOT, 'tools', 'build.mjs'), 'utf8'); } catch (e) {}
  check('static: build.mjs injects the __ASSETS embed blob', /var __ASSETS = \{/.test(b));
  check('static: build.mjs keeps the embed BUDGET guard (EMBED_HARD)', /EMBED_HARD/.test(b) && /embed BUDGET/.test(b));
  check('static: build.mjs masks data: URL string literals before the HEX_BOMB scan', /replace\(\/"data:\[\^"\]\*"\/g/.test(b));
  // 4. the prep tool + the disk tier exist.
  check('static: tools/prep-embed-assets.mjs exists', existsSync(join(ROOT, 'tools', 'prep-embed-assets.mjs')));
  let tier = []; try { tier = readdirSync(join(ROOT, 'assets', 'embed', 'portraits')).filter(f => /\.jpe?g$/i.test(f)); } catch (e) {}
  check('static: assets/embed/portraits/ tier present (156 files)', tier.length === EXPECTED_PORTRAIT_COUNT, 'count=' + tier.length);
  check('static: D154 Elisha Hunt Rhodes portrait is embedded on disk', tier.includes('elisharhodes.jpg'));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

// in-page: wait until the embedded tier has warmed, then probe portraitFor for several names.
function probeScript(offline) {
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    try {
      var keys = (typeof __ASSETS !== 'undefined' && __ASSETS) ? Object.keys(__ASSETS) : [];
      var portraitKeys = keys.filter(function(k){ return k.indexOf('portraits/') === 0; });
      var installed = (typeof window.portraitFor === 'function') && window.portraitFor._phe === true;

      // Wait for warm: offline, a known portrait can only become a JPEG via the embedded tier
      // (base hi-res is blocked -> engraving PNG). Poll until JPEG or timeout.
      function fmt(s){ if (typeof s !== 'string') return 'none'; if (s.indexOf('data:image/jpeg') === 0) return 'jpeg'; if (s.indexOf('data:image/png') === 0) return 'png'; return 'other'; }
      // framing is now LAZY/on-demand, so poll each name until its photo resolves (or timeout).
      async function resolve(name, side){ var u=''; for (var t=0;t<60;t++){ u = window.portraitFor(name, side); if (fmt(u)==='jpeg') break; await wait(50); } return u; }
      var lee = await resolve('Lee','CS'); var tries = 0;

      var samples = {};
      var names = ['Lincoln|US','Davis|CS','Grant|US','Lee|CS','Sherman|US','Jackson|CS','Meade|US','Longstreet|CS'];
      for (var si=0; si<names.length; si++){ var pp = names[si].split('|'); var u = await resolve(pp[0], pp[1]); samples[names[si]] = { fmt: fmt(u), len: (u||'').length }; }
      // side-specific distinctness (these are the only side-split keys: anderson_*, gregg_*)
      var andCS = await resolve('Anderson','CS'), andUS = await resolve('Anderson','US');
      var grCS  = await resolve('Gregg','CS'),    grUS  = await resolve('Gregg','US');
      // fallback chain: an unknown name with no embedded photo + no hi-res must be the PNG engraving
      var unknown = window.portraitFor('Zzqxnobodyhere','US');

      // LEAD-BADGE upgrade test: inject a badge still showing an engraving; the module's observer must swap the embedded photo in.
      var badgeResult = null;
      try {
        if (typeof G !== 'undefined') { G.sel = G.sel || {}; G.sel.side = 'CS'; }
        var eng = window.portraitFor('Zzqxnobodyhere','US'); // a guaranteed PNG engraving to seed the <img>
        var bd = document.createElement('div'); bd.className = 'lead-badge'; bd.setAttribute('data-portrait-done','1');
        var im = document.createElement('img'); im.src = eng; bd.appendChild(im);
        var nm = document.createElement('span'); nm.className = 'lnm'; nm.textContent = 'Lee'; bd.appendChild(nm);
        document.body.appendChild(bd);
        for (var bw = 0; bw < 40; bw++) { if (bd.getAttribute('data-photo-embed') === '1') break; await wait(50); }
        badgeResult = { swapped: bd.getAttribute('data-photo-embed') === '1', imgFmt: fmt(im.src) };
        if (bd.parentNode) bd.parentNode.removeChild(bd);
      } catch(e) { badgeResult = { error: String(e && e.message || e) }; }

      // NO-DOWNGRADE (bug-hunt FINDER#3): a badge already showing a JPEG (a base hi-res photo, which the
      // base closure portraitFor inserts WITHOUT a data-portrait-photo flag) must NOT be swapped to the
      // 128px embedded tier. Seed an <img> with a known JPEG and confirm the observer leaves it alone.
      var noDowngrade = null;
      try {
        var hires = await resolve('Grant','US');            // a real JPEG, distinct from Lee's embedded
        var bd2 = document.createElement('div'); bd2.className = 'lead-badge'; bd2.setAttribute('data-portrait-done','1');
        var im2 = document.createElement('img'); im2.src = hires; bd2.appendChild(im2);
        var nm2 = document.createElement('span'); nm2.className = 'lnm'; nm2.textContent = 'Lee'; bd2.appendChild(nm2);
        document.body.appendChild(bd2);
        for (var dw = 0; dw < 8; dw++) await wait(50);      // several _pheSchedule cycles
        noDowngrade = { unchanged: im2.src === hires, embedFlag: bd2.getAttribute('data-photo-embed') };
        if (bd2.parentNode) bd2.parentNode.removeChild(bd2);
      } catch(e) { noDowngrade = { error: String(e && e.message || e) }; }

      return { ok:true, offline:${JSON.stringify(!!offline)}, portraitCount: portraitKeys.length, totalKeys: keys.length,
        hasRhodes: portraitKeys.indexOf('portraits/elisharhodes') >= 0,
        installed: installed, leeFmt: fmt(lee), leeLen: (lee||'').length, warmTries: tries,
        samples: samples,
        sideSplit: { andCS: fmt(andCS), andUS: fmt(andUS), andDistinct: andCS !== andUS, grCS: fmt(grCS), grUS: fmt(grUS), grDistinct: grCS !== grUS },
        unknownFmt: fmt(unknown), badge: badgeResult, noDowngrade: noDowngrade,
        leeSample: (lee||'').slice(0, 40) };
    } catch(e) { return { ok:false, error:String(e && e.message || e) }; }
  })()`;
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
  const pe = [];
  let rootRes = { ok: false, error: 'not run' }, offRes = { ok: false, error: 'not run' };
  try {
    // PASS 1 — served from root (assets/ reachable): hi-res OR embedded; both JPEG.
    const ctx1 = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
    ctx1.setDefaultTimeout(45000);
    const p1 = await ctx1.newPage();
    p1.on('pageerror', e => pe.push('[root] ' + String(e.message)));
    await p1.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    rootRes = await p1.evaluate(probeScript(false));
    // write a couple of framed embedded portraits as visual-confirmation shots
    try {
      const samp = await p1.evaluate(`(async () => { function wait(ms){return new Promise(function(r){setTimeout(r,ms);});} function isJ(s){return typeof s==='string'&&s.indexOf('data:image/jpeg')===0;} async function rs(n,sd){var u='';for(var t=0;t<60;t++){u=window.portraitFor(n,sd);if(isJ(u))break;await wait(50);}return u;} var o={}; var L=[['Lincoln','US'],['Lee','CS'],['Grant','US'],['Davis','CS']]; for(var i=0;i<L.length;i++){o[L[i][0]]=await rs(L[i][0],L[i][1]);} return o; })()`);
      for (const k of Object.keys(samp || {})) { const u = samp[k]; if (typeof u === 'string' && u.indexOf('data:image/jpeg') === 0) writeFileSync(join(OUT, 'photo-embed-' + k.toLowerCase() + '.jpg'), Buffer.from(u.split(',')[1] || '', 'base64')); }
    } catch (e) {}
    await ctx1.close();

    // PASS 2 — OFFLINE: block assets/portraits/ so base hi-res can never load; only the embedded tier can produce a JPEG.
    const ctx2 = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
    ctx2.setDefaultTimeout(45000);
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => pe.push('[offline] ' + String(e.message)));
    await p2.route('**/assets/portraits/**', route => route.abort());
    await p2.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    offRes = await p2.evaluate(probeScript(true));
    await ctx2.close();
  } finally { if (server) server.kill(); await browser.close(); }

  /* ---------- assertions ---------- */
  check('__ASSETS carries the 156-portrait embed tier', rootRes.ok && rootRes.portraitCount === EXPECTED_PORTRAIT_COUNT, rootRes.ok ? ('count=' + rootRes.portraitCount) : ('err=' + rootRes.error));
  check('__ASSETS carries the D154 Rhodes portrait key', rootRes.ok && rootRes.hasRhodes === true);
  check('override installed (window.portraitFor._phe)', rootRes.ok && rootRes.installed === true);
  check('served-from-root: Lee resolves to a JPEG photo', rootRes.ok && rootRes.leeFmt === 'jpeg', 'fmt=' + (rootRes.leeFmt) + ' len=' + (rootRes.leeLen));

  check('OFFLINE (assets blocked): Lee STILL resolves to a JPEG photo (the embedded tier — portability win)',
    offRes.ok && offRes.leeFmt === 'jpeg', offRes.ok ? ('fmt=' + offRes.leeFmt + ' warmTries=' + offRes.warmTries + ' len=' + offRes.leeLen) : ('err=' + offRes.error));
  check('OFFLINE: the embedded photo is a real framed image (non-trivial byte length)', offRes.ok && offRes.leeLen > 1000, 'len=' + (offRes.leeLen));
  const offSamples = (offRes.ok && offRes.samples) || {};
  const allJpeg = Object.keys(offSamples).every(k => offSamples[k].fmt === 'jpeg');
  check('OFFLINE: every sampled named portrait (Lincoln/Davis/Grant/Lee/Sherman/Jackson/Meade/Longstreet) resolves to JPEG',
    offRes.ok && allJpeg, JSON.stringify(Object.keys(offSamples).reduce((a, k) => (a[k] = offSamples[k].fmt, a), {})));
  check('OFFLINE: side-specific keys resolve distinctly (Anderson CS != US, Gregg CS != US, all JPEG)',
    offRes.ok && offRes.sideSplit && offRes.sideSplit.andDistinct && offRes.sideSplit.grDistinct
      && offRes.sideSplit.andCS === 'jpeg' && offRes.sideSplit.andUS === 'jpeg' && offRes.sideSplit.grCS === 'jpeg' && offRes.sideSplit.grUS === 'jpeg',
    JSON.stringify(offRes.sideSplit || {}));
  check('OFFLINE: fallback chain — an unknown name returns the PNG engraving (not a broken/empty image)',
    offRes.ok && offRes.unknownFmt === 'png', 'unknownFmt=' + (offRes.unknownFmt));
  check('OFFLINE: lead-badge upgrade — an engraving-showing badge is swapped to the embedded JPEG by the module observer',
    offRes.ok && offRes.badge && offRes.badge.swapped === true && offRes.badge.imgFmt === 'jpeg', JSON.stringify(offRes.badge || {}));
  check('NO-DOWNGRADE (FINDER#3): a badge already showing a JPEG (base hi-res) is NEVER swapped to the 128px embedded tier',
    offRes.ok && offRes.noDowngrade && offRes.noDowngrade.unchanged === true && offRes.noDowngrade.embedFlag !== '1', JSON.stringify(offRes.noDowngrade || {}));

  check('0 pageerrors across both passes', pe.length === 0, pe.slice(0, 6).join(' | '));

  const passed = steps.filter(s => s.ok).length, total = steps.length;
  const out = { probe: 'photo-embed', passed, total, ok: passed === total, pageerrors: pe.slice(0, 12), steps };
  writeFileSync(join(OUT, 'probe-photo-embed.json'), JSON.stringify(out, null, 2));
  console.log('photo-embed: ' + passed + '/' + total + (out.ok ? ' OK' : ' FAIL'));
  for (const s of steps) if (!s.ok) console.log('  FAIL: ' + s.name + (s.detail ? ' :: ' + s.detail : ''));
  process.exit(out.ok ? 0 : 1);
})();
