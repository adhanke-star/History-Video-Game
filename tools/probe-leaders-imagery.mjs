#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-leaders-imagery.mjs
// Focused probe for H1 — PD LEADERS imagery on the Codex People cards (D136; src/52-leaders-imagery.js +
// the embed of assets/embed/leaders into __ASSETS + the 84-codex card-body call). Verifies:
//  - the build inlined the leaders tier: __ASSETS carries the 20 leaders keys as data:image/jpeg URLs;
//  - the helper CONTRACT: leaderImageHtml(id) returns a captioned <figure class="leader-img"> with
//    <img src="data:..."> for an embedded id, and "" for an unknown id (the byte-identical-when-absent guarantee);
//  - INFORMATIVE (not decorative): a NON-EMPTY descriptive alt AND a <figcaption> (subject + holding institution);
//  - RENDER INTEGRATION + SINGLE-IMAGE PRECEDENCE: _cxEntryHTML(en) embeds the leader photo for a leader People
//    entry (abraham-lincoln), shows the USCT image (NOT the leader) for an entry that is BOTH a USCT id and a
//    People entry (frederick-douglass — usct precedence via the `usctImageHtml || leaderImageHtml` seam), shows
//    NOTHING for a non-imaged entry (a units-axis entry), and NEVER renders two figures in one card;
//  - PRESENTATION PURITY (D74): a static scan proves 52-leaders-imagery.js never calls fldRng / writes the sim /
//    bumps the save version, and that the 84-codex edit adds ONLY the guarded leaderImageHtml call;
//  - 0 pageerrors; + a captured screenshot (rendered leader codex cards) for visual confirmation.
// (Seed-for-seed combat byte-identity stays owned by probe-presets; the codex LOGIC is unaffected.)

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
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const LEADER_IDS = ['abraham-lincoln', 'jefferson-davis', 'robert-e-lee', 'ulysses-s-grant',
  'william-tecumseh-sherman', 'thomas-stonewall-jackson', 'james-longstreet', 'george-b-mcclellan',
  'george-g-meade', 'george-h-thomas', 'philip-sheridan', 'braxton-bragg', 'patrick-cleburne',
  'david-farragut', 'edwin-m-stanton', 'william-h-seward', 'alexander-h-stephens', 'clara-barton',
  'dorothea-dix', 'mary-edwards-walker'];

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

function staticScan() {
  let mod = ''; try { mod = readFileSync(join(ROOT, 'src', '52-leaders-imagery.js'), 'utf8'); } catch (e) {}
  check('static: src/52-leaders-imagery.js exists', mod.length > 0);
  check('static: 52-leaders-imagery never calls fldRng', mod.length > 0 && !/fldRng\s*\(/.test(mod));
  check('static: 52-leaders-imagery never touches __FIELD / the sim / the save version', mod.length > 0 && !/__FIELD|_SAVE_VER|\.men\s*=|\.victory\s*=/.test(mod));
  check('static: 52-leaders-imagery reads only the bare-name __ASSETS global', /__ASSETS/.test(mod) && !/window\.__ASSETS/.test(mod));
  let cx = ''; try { cx = readFileSync(join(ROOT, 'src', '84-codex.js'), 'utf8'); } catch (e) {}
  check('static: 84-codex calls leaderImageHtml(en.id), guarded, after usctImageHtml (usct wins)',
    /usctImageHtml\(en\.id\)\s*:\s*""\)\s*\n?\s*\|\|\s*\(typeof leaderImageHtml === "function" \? leaderImageHtml\(en\.id\)/.test(cx));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

function evalScript(ids) {
  return `(() => {
    try {
      var IDS = ${JSON.stringify(ids)};
      var keys = (typeof __ASSETS!=='undefined' && __ASSETS) ? Object.keys(__ASSETS) : [];
      var lk = keys.filter(function(k){return k.indexOf('leaders/')===0;});
      function H(i){ return (typeof leaderImageHtml==='function') ? leaderImageHtml(i) : '__NOFN__'; }
      function isFig(s){ return typeof s==='string' && /<figure[^>]*class="leader-img"/.test(s)
        && /<img [^>]*src="data:image\\/jpeg;base64,/.test(s); }
      function altNonEmpty(s){ var m = String(s).match(/<img [^>]*\\balt="([^"]*)"/); return !!(m && m[1] && m[1].length > 8); }
      function hasCaption(s){ return /<figcaption/.test(String(s)); }

      var perId = {};
      var allFig = true, allAlt = true, allCap = true;
      for (var i=0;i<IDS.length;i++){ var h=H(IDS[i]);
        var f=isFig(h), a=altNonEmpty(h), c=hasCaption(h);
        perId[IDS[i]] = { fig:f, alt:a, cap:c };
        if(!f) allFig=false; if(!a) allAlt=false; if(!c) allCap=false;
      }
      var bogusEmpty = H('zzz-not-a-real-entry')==='';   // unknown id -> "" (byte-identical-when-absent)

      // CODEX render integration + single-image precedence
      function cxFor(id){ var en=(typeof _cxById==='function')?_cxById(id):null; return en&&typeof _cxEntryHTML==='function'?_cxEntryHTML(en):''; }
      function figCount(html){ return (String(html).match(/<figure[^>]*class="(?:leader|usct)-img"/g)||[]).length; }
      var lincoln = cxFor('abraham-lincoln');     // leader -> leader-img
      var douglass = cxFor('frederick-douglass');  // USCT id AND People entry -> usct-img wins, NOT leader
      var anv = cxFor('army-of-northern-virginia'); // units axis, no image -> none
      var codex = {
        lincolnLeaderFig: !!__ASSETS['leaders/abraham-lincoln'] && lincoln.indexOf(__ASSETS['leaders/abraham-lincoln'])>=0 && /class="leader-img"/.test(lincoln),
        lincolnOneFig: figCount(lincoln)===1,
        douglassUsctWins: /class="usct-img"/.test(douglass) && !/class="leader-img"/.test(douglass),
        douglassOneFig: figCount(douglass)===1,
        anvNoFig: figCount(anv)===0,
        anvLen: anv.length
      };
      // EVERY People entry renders at most one figure (no double-image anywhere)
      var maxFigs = 0, peopleN = 0;
      if (typeof _cxEntries==='function'){ var es=_cxEntries();
        for (var e=0;e<es.length;e++){ if(es[e] && es[e].axis==='people'){ peopleN++; var fc=figCount(_cxEntryHTML(es[e])); if(fc>maxFigs) maxFigs=fc; } } }

      // a visible render of leader codex cards (expanded) for the screenshot
      var host = document.createElement('div');
      host.style.cssText='position:fixed;left:0;top:0;width:520px;background:#241c12;color:#e8dcc0;padding:16px;z-index:99999;font-family:Georgia,serif';
      host.innerHTML = '<div style="font-size:15px;margin-bottom:8px;color:#c9a85f">Codex — PD leaders imagery probe</div>' + lincoln + cxFor('robert-e-lee') + cxFor('ulysses-s-grant');
      document.body.appendChild(host);
      var bodies = host.querySelectorAll('.cx-body'); for (var b=0;b<bodies.length;b++) bodies[b].style.display='block';

      return { ok:true, lkN: lk.length, perId:perId, allFig:allFig, allAlt:allAlt, allCap:allCap,
        bogusEmpty:bogusEmpty, codex:codex, maxFigs:maxFigs, peopleN:peopleN };
    } catch(e) { return { ok:false, error:String(e && e.message || e) }; }
  })()`;
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true }));
  const pe = [];
  let R = { ok: false, error: 'not run' };
  try {
    const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
    ctx.setDefaultTimeout(45000);
    const page = await ctx.newPage();
    page.on('pageerror', e => pe.push(String(e.message)));
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    R = await page.evaluate(evalScript(LEADER_IDS));
    await sleep(200);
    try { const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 520, height: 900 } }); writeFileSync(join(OUT, 'leaders-imagery.png'), buf); } catch (e) {}
    await ctx.close();
  } finally { if (server) server.kill(); await browser.close(); }

  check('__ASSETS carries the 20 leaders embed keys', R.ok && R.lkN === 20, R.ok ? ('leaders=' + R.lkN) : ('err=' + R.error));
  check('helper: every embedded id -> a captioned <figure class="leader-img"> with <img data:image/jpeg>', R.ok && R.allFig === true, JSON.stringify(R.perId || {}));
  check('helper: every image carries a NON-EMPTY descriptive alt (informative, not decorative)', R.ok && R.allAlt === true);
  check('helper: every image carries a <figcaption> (subject + holding institution)', R.ok && R.allCap === true);
  check('helper: an unknown id returns "" (guarded, byte-identical-when-absent)', R.ok && R.bogusEmpty === true);
  const cx = (R.ok && R.codex) || {};
  check('render: a leader People card (Lincoln) embeds the leader photo', cx.lincolnLeaderFig === true && cx.lincolnOneFig === true, JSON.stringify(cx));
  check('render: a USCT+People entry (Douglass) shows the USCT image, NOT the leader (usct precedence)', cx.douglassUsctWins === true && cx.douglassOneFig === true);
  check('render: a non-imaged entry (Army of Northern Virginia) shows NO figure', cx.anvNoFig === true, 'anvLen=' + cx.anvLen);
  check('render: NO People card ever renders two figures (single-image guarantee)', R.ok && R.maxFigs <= 1 && R.peopleN > 0, 'maxFigs=' + R.maxFigs + ' peopleN=' + R.peopleN);
  check('0 pageerrors', pe.length === 0, pe.slice(0, 5).join(' | '));

  const passed = steps.filter(s => s.ok).length, total = steps.length;
  const out = { probe: 'leaders-imagery', passed, total, ok: passed === total, pageerrors: pe.slice(0, 10), steps };
  writeFileSync(join(OUT, 'probe-leaders-imagery.json'), JSON.stringify(out, null, 2));
  console.log('leaders-imagery: ' + passed + '/' + total + (out.ok ? ' OK' : ' FAIL'));
  for (const s of steps) if (!s.ok) console.log('  FAIL: ' + s.name + (s.detail ? ' :: ' + s.detail : ''));
  process.exit(out.ok ? 0 : 1);
})();
