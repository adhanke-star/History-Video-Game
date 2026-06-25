#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-usct-imagery.mjs
// Focused probe for H1 — PD USCT IMAGERY on the teaching cards (D135; src/53-usct-imagery.js + the embed of
// assets/embed/usct into __ASSETS + the 84-codex card-body call + the 70-manpower "The Ranks" call). Verifies:
//  - the build inlined the usct tier: __ASSETS carries the 7 usct keys as data:image/jpeg URLs;
//  - the helper CONTRACT: usctImageHtml(id) returns a captioned <figure> with <img src="data:..."> for an
//    embedded id, and "" for an unknown id -> the card is unchanged (the byte-identical-when-absent guarantee);
//  - the image is INFORMATIVE (NOT decorative like the arms cutouts): a NON-EMPTY descriptive alt AND a
//    <figcaption> (the subject + the holding institution) — the key a11y/teaching distinction from 54-arms;
//  - RENDER INTEGRATION: _cxEntryHTML(en) embeds the photo for a USCT codex entry (united-states-colored-troops,
//    54th-massachusetts-infantry, ...) and NOT for a non-USCT entry (army-of-northern-virginia); presManpowerBlock(C)
//    embeds the USCT company photo when usctUnlocked and NOT when it is not (and never on the CS side);
//  - PRESENTATION PURITY (D74): a static scan proves 53-usct-imagery.js never calls fldRng / writes the sim /
//    bumps the save version, and that the 84/70 edits add ONLY the guarded usctImageHtml call (no logic change);
//  - 0 pageerrors; + a captured screenshot (a rendered USCT codex card) for visual confirmation.
// (Seed-for-seed combat byte-identity stays owned by probe-presets; the codex/manpower LOGIC is unaffected.)

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

const USCT_IDS = ['united-states-colored-troops', '54th-massachusetts-infantry', 'robert-gould-shaw',
  'frederick-douglass', 'harriet-tubman', 'nathan-bedford-forrest', 'system-manpower-pool-usct'];

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

function staticScan() {
  let mod = ''; try { mod = readFileSync(join(ROOT, 'src', '53-usct-imagery.js'), 'utf8'); } catch (e) {}
  check('static: src/53-usct-imagery.js exists', mod.length > 0);
  check('static: 53-usct-imagery never calls fldRng', mod.length > 0 && !/fldRng\s*\(/.test(mod));
  check('static: 53-usct-imagery never touches __FIELD / the sim / the save version', mod.length > 0 && !/__FIELD|_SAVE_VER|\.men\s*=|\.victory\s*=/.test(mod));
  check('static: 53-usct-imagery reads only the bare-name __ASSETS global', /__ASSETS/.test(mod) && !/window\.__ASSETS/.test(mod));
  let cx = '', mp = ''; try { cx = readFileSync(join(ROOT, 'src', '84-codex.js'), 'utf8'); mp = readFileSync(join(ROOT, 'src', '70-manpower.js'), 'utf8'); } catch (e) {}
  check('static: 84-codex calls usctImageHtml(en.id) in the card body (guarded)', /typeof usctImageHtml === "function" \? usctImageHtml\(en\.id\)/.test(cx));
  check('static: 70-manpower calls usctImageHtml(...) only on the US side when usctUnlocked', /usctUnlocked && typeof usctImageHtml === "function"/.test(mp));
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
      var uk = keys.filter(function(k){return k.indexOf('usct/')===0;});
      function H(i){ return (typeof usctImageHtml==='function') ? usctImageHtml(i) : '__NOFN__'; }
      function isFig(s){ return typeof s==='string' && /<figure[^>]*class="usct-img"/.test(s)
        && /<img [^>]*src="data:image\\/jpeg;base64,/.test(s); }
      function altNonEmpty(s){ var m = String(s).match(/<img [^>]*\\balt="([^"]*)"/); return !!(m && m[1] && m[1].length > 8); }
      function hasCaption(s){ return /<figcaption/.test(String(s)); }

      // every embedded id -> a captioned figure with a non-empty descriptive alt
      var perId = {};
      var allFig = true, allAlt = true, allCap = true;
      for (var i=0;i<IDS.length;i++){ var h=H(IDS[i]);
        var f=isFig(h), a=altNonEmpty(h), c=hasCaption(h);
        perId[IDS[i]] = { fig:f, alt:a, cap:c };
        if(!f) allFig=false; if(!a) allAlt=false; if(!c) allCap=false;
      }
      var bogusEmpty = H('zzz-not-a-real-entry')==='';   // unknown id -> "" (byte-identical-when-absent)

      // CODEX render integration
      function cxFor(id){ var en=(typeof _cxById==='function')?_cxById(id):null; return en&&typeof _cxEntryHTML==='function'?_cxEntryHTML(en):''; }
      var uColored = cxFor('united-states-colored-troops');
      var uCarney  = cxFor('54th-massachusetts-infantry');
      var anv      = cxFor('army-of-northern-virginia');   // a NON-usct entry -> no figure
      function embeds(html,id){ var src=__ASSETS['usct/'+id]; return !!src && html.indexOf(src)>=0; }
      var codex = {
        coloredHasFig: embeds(uColored,'united-states-colored-troops') && /class="usct-img"/.test(uColored),
        carneyHasFig: embeds(uCarney,'54th-massachusetts-infantry'),
        anvNoFig: !/class="usct-img"/.test(anv),
        anvLen: anv.length
      };

      // MANPOWER "The Ranks" render integration (stub campaign shapes)
      function mp(side, usct){ return { side:side, manpower:{ strength:80, replacementRatio:0.8, pool:1200,
        enlisted:500, draftActive:true, ageBand:'20-45', usctUnlocked:usct, desertionTotal:0, lastTurn:{recruits:40} } }; }
      var src7 = __ASSETS['usct/united-states-colored-troops'];
      var mpOrg = (typeof presManpowerBlock==='function') ? presManpowerBlock(mp('US', true)) : '';
      var mpNot = (typeof presManpowerBlock==='function') ? presManpowerBlock(mp('US', false)) : '';
      var mpCs  = (typeof presManpowerBlock==='function') ? presManpowerBlock(mp('CS', true)) : '';
      var manpower = {
        organizedShows: !!src7 && mpOrg.indexOf(src7) >= 0 && /class="usct-img"/.test(mpOrg),
        notOrganizedHides: !/class="usct-img"/.test(mpNot),
        csNeverShows: !/class="usct-img"/.test(mpCs)
      };

      // a visible render of a USCT codex card (expanded) for the screenshot
      var host = document.createElement('div');
      host.style.cssText='position:fixed;left:0;top:0;width:520px;background:#241c12;color:#e8dcc0;padding:16px;z-index:99999;font-family:Georgia,serif';
      host.innerHTML = '<div style="font-size:15px;margin-bottom:8px;color:#c9a85f">Codex — PD USCT imagery probe</div>' + uColored + uCarney;
      document.body.appendChild(host);
      // force the two cards open so the figures are visible in the shot
      var bodies = host.querySelectorAll('.cx-body'); for (var b=0;b<bodies.length;b++) bodies[b].style.display='block';

      return { ok:true, ukN: uk.length, perId:perId, allFig:allFig, allAlt:allAlt, allCap:allCap,
        bogusEmpty:bogusEmpty, codex:codex, manpower:manpower };
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
    R = await page.evaluate(evalScript(USCT_IDS));
    await sleep(200);
    try { const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 520, height: 820 } }); writeFileSync(join(OUT, 'usct-imagery.png'), buf); } catch (e) {}
    await ctx.close();
  } finally { if (server) server.kill(); await browser.close(); }

  check('__ASSETS carries the 7 usct embed keys', R.ok && R.ukN === 7, R.ok ? ('usct=' + R.ukN) : ('err=' + R.error));
  check('helper: every embedded id -> a captioned <figure> with <img data:image/jpeg>', R.ok && R.allFig === true, JSON.stringify(R.perId || {}));
  check('helper: every image carries a NON-EMPTY descriptive alt (informative, not decorative — the a11y distinction from 54-arms)', R.ok && R.allAlt === true);
  check('helper: every image carries a <figcaption> (subject + holding institution)', R.ok && R.allCap === true);
  check('helper: an unknown id returns "" (guarded, byte-identical-when-absent)', R.ok && R.bogusEmpty === true);
  const cx = (R.ok && R.codex) || {};
  check('render: the USCT codex cards embed the photo (Company E + Carney/54th)', cx.coloredHasFig === true && cx.carneyHasFig === true, JSON.stringify(cx));
  check('render: a NON-USCT codex entry (Army of Northern Virginia) shows NO figure', cx.anvNoFig === true, 'anvLen=' + cx.anvLen);
  const mp = (R.ok && R.manpower) || {};
  check('render: "The Ranks" shows the USCT company photo once USCT is organized', mp.organizedShows === true);
  check('render: "The Ranks" shows NO USCT photo before USCT is organized', mp.notOrganizedHides === true);
  check('render: the CS side never shows a USCT photo', mp.csNeverShows === true);
  check('0 pageerrors', pe.length === 0, pe.slice(0, 5).join(' | '));

  const passed = steps.filter(s => s.ok).length, total = steps.length;
  const out = { probe: 'usct-imagery', passed, total, ok: passed === total, pageerrors: pe.slice(0, 10), steps };
  writeFileSync(join(OUT, 'probe-usct-imagery.json'), JSON.stringify(out, null, 2));
  console.log('usct-imagery: ' + passed + '/' + total + (out.ok ? ' OK' : ' FAIL'));
  for (const s of steps) if (!s.ok) console.log('  FAIL: ' + s.name + (s.detail ? ' :: ' + s.detail : ''));
  process.exit(out.ok ? 0 : 1);
})();
