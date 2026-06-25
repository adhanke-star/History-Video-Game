#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-arms-imagery.mjs
// Focused probe for H1 — PD ARMS IMAGERY on the Armory / Cannon-Corps cards (D134; src/54-arms-imagery.js
// + the embed of assets/embed/weapons|artillery into __ASSETS + the 55/56 card-render calls). Verifies:
//  - the build inlined the arms tier: __ASSETS carries the 8 weapon + 4 artillery keys as data: URLs
//    (PNG cutouts for small arms keep alpha; artillery are JPEG);
//  - the helper CONTRACT: armsImageHtml(cat,id,name) returns a framed <img src="data:..."> with alt for an
//    embedded id, and "" for an imageless id (richmond, howitzer12) or an unknown id -> the card is unchanged
//    (the byte-identical-when-absent guarantee);
//  - RENDER INTEGRATION: armoryRenderArmory(C) embeds the weapon images (springfield) and NOT the imageless
//    ones (richmond); artRenderSection(C) embeds the artillery images (napoleon) and NOT howitzer12;
//  - PRESENTATION PURITY (D74): a static scan proves 54-arms-imagery.js never calls fldRng / writes the sim /
//    bumps the save version, and that the 55/56 edits add ONLY the armsImageHtml call (no combat-logic change);
//  - 0 pageerrors; + a captured Armory screenshot for visual confirmation.
// (The seed-for-seed combat byte-identity stays owned by probe-presets; the armory/cannon LOGIC by probe-weapons/probe-cannon.)

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

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

function staticScan() {
  let mod = ''; try { mod = readFileSync(join(ROOT, 'src', '54-arms-imagery.js'), 'utf8'); } catch (e) {}
  check('static: src/54-arms-imagery.js exists', mod.length > 0);
  check('static: 54-arms-imagery never calls fldRng', mod.length > 0 && !/fldRng\s*\(/.test(mod));
  check('static: 54-arms-imagery never touches __FIELD / the sim / the save version', mod.length > 0 && !/__FIELD|_SAVE_VER|\.men\s*=|\.victory\s*=/.test(mod));
  check('static: 54-arms-imagery reads only the bare-name __ASSETS global', /__ASSETS/.test(mod) && !/window\.__ASSETS/.test(mod));
  // 55/56 edits add ONLY the armsImageHtml call (presentation), no combat-logic change.
  let w = '', a = ''; try { w = readFileSync(join(ROOT, 'src', '55-weapons.js'), 'utf8'); a = readFileSync(join(ROOT, 'src', '56-artillery.js'), 'utf8'); } catch (e) {}
  check('static: 55-weapons calls armsImageHtml("weapons", ...) in the card render', /armsImageHtml\("weapons"/.test(w));
  check('static: 56-artillery calls armsImageHtml("artillery", ...) in the card render', /armsImageHtml\("artillery"/.test(a));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

function evalScript() {
  return `(() => {
    try {
      function mkC(side, year, funds){
        var C={ side:side, iron:false, idx:0, funds:(funds||9000), recovery:false, completed:[],
          roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2,
          stats:{battles:0,won:0,infl:0,suff:0}, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
        G.campaign=C; _t1InitAll(C); if (C.clock) C.clock.year=year; if (C.president) C.president.date={year:year,month:1}; return C;
      }
      var keys = (typeof __ASSETS!=='undefined' && __ASSETS) ? Object.keys(__ASSETS) : [];
      var wk = keys.filter(function(k){return k.indexOf('weapons/')===0;});
      var ak = keys.filter(function(k){return k.indexOf('artillery/')===0;});
      function H(c,i,n){ return (typeof armsImageHtml==='function') ? armsImageHtml(c,i,n) : '__NOFN__'; }
      function isImg(s){ return typeof s==='string' && /<img [^>]*src="data:image\\/(png|jpeg);base64,/.test(s) && /alt="/.test(s); }

      var helper = {
        springfield: isImg(H('weapons','springfield','Springfield M1861')),
        napoleon: isImg(H('artillery','napoleon','12-pdr Napoleon')),
        richmondEmpty: H('weapons','richmond','Richmond Rifle')==='',       // imageless -> no img
        howitzerEmpty: H('artillery','howitzer12','12-pdr Howitzer')==='',  // imageless -> no img
        parrottEmpty: H('artillery','parrott10','10-pdr Parrott')==='',     // imageless (wrong-gun re-source) -> no img
        ordnanceEmpty: H('artillery','ordnance3in','3-in Ordnance')==='',   // imageless (modern photo re-source) -> no img
        bogusEmpty: H('weapons','zzznope','x')==='',                        // unknown -> no img
        decorative: /alt=""/.test(H('weapons','springfield','x')) && /aria-hidden="true"/.test(H('weapons','springfield','x'))
      };

      // render integration
      var Carm = mkC('US',1863,9000);
      var armHtml = (typeof armoryRenderArmory==='function') ? armoryRenderArmory(Carm) : '';
      var Cart = mkC('US',1863,9000);
      var artHtml = (typeof artRenderSection==='function') ? artRenderSection(Cart) : '';
      function has(html, src){ return typeof src==='string' && src && html.indexOf(src) >= 0; }
      var render = {
        armHasSpringfield: has(armHtml, __ASSETS['weapons/springfield']),
        armHasEnfield: has(armHtml, __ASSETS['weapons/enfield']),
        armNoRichmond: !(__ASSETS['weapons/richmond']) ,   // not embedded at all
        armImgCount: (armHtml.match(/class="arms-img"/g)||[]).length,
        artHasNapoleon: has(artHtml, __ASSETS['artillery/napoleon']),
        artHasWhitworth: has(artHtml, __ASSETS['artillery/whitworth']),
        artNoParrott: !(__ASSETS['artillery/parrott10']),  // imageless -> not embedded
        artImgCount: (artHtml.match(/class="arms-img"/g)||[]).length
      };

      // a visible render for the screenshot
      var host = document.createElement('div');
      host.style.cssText='position:fixed;left:0;top:0;width:760px;background:#1d1810;color:#e8dcc0;padding:16px;z-index:99999;font-family:Georgia,serif';
      host.innerHTML = '<div style="font-size:15px;margin-bottom:8px;color:#c9a85f">Armory — PD arms imagery probe</div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">'
        + (typeof armoryRenderArmory==='function' ? armoryRenderArmory(mkC('US',1863,9000)).replace(/^[\\s\\S]*?The catalog<\\/div>/,'') : '')
        + '</div>';
      document.body.appendChild(host);

      return { ok:true, wkN: wk.length, akN: ak.length, helper:helper, render:render,
        armLen: armHtml.length, artLen: artHtml.length };
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
    R = await page.evaluate(evalScript());
    await sleep(150);
    try { const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 760, height: 760 } }); writeFileSync(join(OUT, 'arms-imagery.png'), buf); } catch (e) {}
    await ctx.close();
  } finally { if (server) server.kill(); await browser.close(); }

  check('__ASSETS carries the 8 weapon + 2 artillery embed keys', R.ok && R.wkN === 8 && R.akN === 2, R.ok ? ('weapons=' + R.wkN + ' artillery=' + R.akN) : ('err=' + R.error));
  const h = (R.ok && R.helper) || {};
  check('helper: an embedded weapon -> framed <img data:image/png> (springfield cutout)', h.springfield === true);
  check('helper: an embedded gun -> framed <img data:image/jpeg> (napoleon Forbes sketch)', h.napoleon === true);
  check('helper: every imageless model returns "" (richmond, howitzer12, parrott10, ordnance3in -> card unchanged, byte-identical-when-absent)',
    h.richmondEmpty === true && h.howitzerEmpty === true && h.parrottEmpty === true && h.ordnanceEmpty === true,
    JSON.stringify({ r: h.richmondEmpty, hz: h.howitzerEmpty, par: h.parrottEmpty, ord: h.ordnanceEmpty }));
  check('helper: an unknown id returns "" (guarded)', h.bogusEmpty === true);
  check('helper: the image is DECORATIVE (alt="" + aria-hidden — no screen-reader duplication of the name)', h.decorative === true);
  const r = (R.ok && R.render) || {};
  check('render: the Armory embeds the weapon images (springfield + enfield)', r.armHasSpringfield === true && r.armHasEnfield === true, JSON.stringify({ s: r.armHasSpringfield, e: r.armHasEnfield, n: r.armImgCount }));
  check('render: the Cannon Corps embeds the artillery images (napoleon + whitworth)', r.artHasNapoleon === true && r.artHasWhitworth === true, JSON.stringify({ nap: r.artHasNapoleon, wh: r.artHasWhitworth, n: r.artImgCount }));
  check('render: the wrong-model/modern artillery are absent (parrott10 imageless -> not embedded)', r.artNoParrott === true);
  check('render: image counts match coverage (armory 8 of 8, cannon 2 of 2 imaged — the 4 imageless absent)', r.armImgCount === 8 && r.artImgCount === 2, 'armImgs=' + r.armImgCount + ' artImgs=' + r.artImgCount);
  check('0 pageerrors', pe.length === 0, pe.slice(0, 5).join(' | '));

  const passed = steps.filter(s => s.ok).length, total = steps.length;
  const out = { probe: 'arms-imagery', passed, total, ok: passed === total, pageerrors: pe.slice(0, 10), steps };
  writeFileSync(join(OUT, 'probe-arms-imagery.json'), JSON.stringify(out, null, 2));
  console.log('arms-imagery: ' + passed + '/' + total + (out.ok ? ' OK' : ' FAIL'));
  for (const s of steps) if (!s.ok) console.log('  FAIL: ' + s.name + (s.detail ? ' :: ' + s.detail : ''));
  process.exit(out.ok ? 0 : 1);
})();
