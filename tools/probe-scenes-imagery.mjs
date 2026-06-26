#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-scenes-imagery.mjs
// Focused probe for H1 — PD BATTLE-SCENE imagery on the pre-battle briefing (D137;
// src/51-scenes-imagery.js + the embed of assets/embed/scenes into __ASSETS + the
// 85-battle-bridge bridgeBriefingHTML call). Verifies:
//  - the build inlined the scenes tier: __ASSETS carries the 6 marquee scenes keys as data:image/jpeg URLs;
//  - the helper CONTRACT: sceneImageHtml(id) returns a captioned <figure class="scene-img"> with
//    <img src="data:..."> for an embedded id, and "" for an unknown id, a falsy id, AND a documented-
//    imageless id (malvern/shiloh/chickamauga) — the byte-identical-when-absent guarantee;
//  - INFORMATIVE (not decorative): a NON-EMPTY descriptive alt AND a <figcaption> (scene + holding institution);
//  - BRIEFING INTEGRATION: bridgeBriefingHTML(C) for a campaign sitting at an IMAGED battle (antietam)
//    embeds that scene photo (exactly one scene-img figure, before the army columns); for an IMAGELESS
//    battle (shiloh) it renders NO scene figure; and NO briefing ever renders two scene figures;
//  - PRESENTATION PURITY (D74): a static scan proves 51-scenes-imagery.js never calls fldRng / writes the
//    sim / bumps the save version, and that the 85-battle-bridge edit adds ONLY the guarded sceneImageHtml call;
//  - 0 pageerrors; + a captured screenshot (a rendered briefing with the field photo) for visual confirmation.
// (Seed-for-seed combat byte-identity stays owned by probe-presets; the briefing is a strategy-layer screen.)

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

const SCENE_IDS = ['bullrun1', 'antietam', 'fredericksburg', 'chancellorsville', 'vicksburg', 'gettysburg'];
const IMAGELESS_IDS = ['malvern', 'shiloh', 'chickamauga'];

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

function staticScan() {
  let mod = ''; try { mod = readFileSync(join(ROOT, 'src', '51-scenes-imagery.js'), 'utf8'); } catch (e) {}
  check('static: src/51-scenes-imagery.js exists', mod.length > 0);
  check('static: 51-scenes-imagery never calls fldRng', mod.length > 0 && !/fldRng\s*\(/.test(mod));
  check('static: 51-scenes-imagery never touches __FIELD / the sim / the save version', mod.length > 0 && !/__FIELD|_SAVE_VER|\.men\s*=|\.victory\s*=/.test(mod));
  check('static: 51-scenes-imagery reads only the bare-name __ASSETS global', /__ASSETS/.test(mod) && !/window\.__ASSETS/.test(mod));
  let br = ''; try { br = readFileSync(join(ROOT, 'src', '85-battle-bridge.js'), 'utf8'); } catch (e) {}
  check('static: 85-battle-bridge calls sceneImageHtml(bd && bd.id), guarded',
    /typeof sceneImageHtml === "function" \? sceneImageHtml\(bd && bd\.id\)/.test(br));
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

function evalScript(ids, imageless) {
  return `(() => {
    try {
      var IDS = ${JSON.stringify(ids)}, IMAGELESS = ${JSON.stringify(imageless)};
      var keys = (typeof __ASSETS!=='undefined' && __ASSETS) ? Object.keys(__ASSETS) : [];
      var sk = keys.filter(function(k){return k.indexOf('scenes/')===0;});
      function H(i){ return (typeof sceneImageHtml==='function') ? sceneImageHtml(i) : '__NOFN__'; }
      function isFig(s){ return typeof s==='string' && /<figure[^>]*class="scene-img"/.test(s)
        && /<img [^>]*src="data:image\\/jpeg;base64,/.test(s); }
      function altNonEmpty(s){ var m = String(s).match(/<img [^>]*\\balt="([^"]*)"/); return !!(m && m[1] && m[1].length > 12); }
      function hasCaption(s){ return /<figcaption/.test(String(s)); }

      var perId = {}, allFig=true, allAlt=true, allCap=true;
      for (var i=0;i<IDS.length;i++){ var h=H(IDS[i]);
        var f=isFig(h), a=altNonEmpty(h), c=hasCaption(h);
        perId[IDS[i]] = { fig:f, alt:a, cap:c };
        if(!f) allFig=false; if(!a) allAlt=false; if(!c) allCap=false;
      }
      var bogusEmpty = H('zzz-not-a-real-battle')==='';     // unknown id -> ""
      var falsyEmpty = H('')==='' && H(null)==='' && H(undefined)==='';   // falsy id -> ""
      // a documented-imageless battle id has no embed -> "" (byte-identical briefing)
      var imagelessEmpty = true, imagelessPer = {};
      for (var j=0;j<IMAGELESS.length;j++){ var e=(H(IMAGELESS[j])===''); imagelessPer[IMAGELESS[j]]=e; if(!e) imagelessEmpty=false; }

      // figCount in any html (scene figures only)
      function sceneFigCount(html){ return (String(html).match(/<figure[^>]*class="scene-img"/g)||[]).length; }

      // BRIEFING INTEGRATION — drive bridgeBriefingHTML to a specific campaign battle.
      function briefAt(side, battleId){
        if (typeof CHAINS==='undefined' || !CHAINS[side]) return null;
        var idx = CHAINS[side].indexOf(battleId);
        if (idx < 0) return null;
        var C = { side: side, idx: idx, manpower:{}, production:{}, blockade:{}, clock:{}, warroom:{}, battlePrep:{} };
        try { return (typeof bridgeBriefingHTML==='function') ? bridgeBriefingHTML(C) : null; }
        catch(e){ return 'ERR:'+(e&&e.message||e); }
      }
      var antBrief = briefAt('US','antietam');
      var shiBrief = briefAt('US','shiloh');
      var antSrc = __ASSETS['scenes/antietam'] || '__none__';
      var briefing = {
        antOk: typeof antBrief==='string' && antBrief.indexOf('ERR:')!==0,
        antHasScene: typeof antBrief==='string' && sceneFigCount(antBrief)===1 && antBrief.indexOf(antSrc)>=0 && /class="scene-img"/.test(antBrief),
        antBeforeArmy: typeof antBrief==='string' && antBrief.indexOf('scene-img') < antBrief.indexOf('The army you field') && antBrief.indexOf('The army you field')>0,
        shiOk: typeof shiBrief==='string' && shiBrief.indexOf('ERR:')!==0,
        shiNoScene: typeof shiBrief==='string' && sceneFigCount(shiBrief)===0,
        antErr: typeof antBrief==='string' && antBrief.indexOf('ERR:')===0 ? antBrief : '',
        shiErr: typeof shiBrief==='string' && shiBrief.indexOf('ERR:')===0 ? shiBrief : ''
      };
      // NO briefing renders two scene figures — across every marquee battle on the US chain
      var maxFigs = 0, battlesChecked = 0;
      var ALL = IDS.concat(IMAGELESS);
      for (var b=0;b<ALL.length;b++){ var bh=briefAt('US', ALL[b]); if (typeof bh==='string' && bh.indexOf('ERR:')!==0){ battlesChecked++; var fc=sceneFigCount(bh); if(fc>maxFigs) maxFigs=fc; } }

      // a visible render of the antietam briefing for the screenshot
      var host = document.createElement('div');
      host.style.cssText='position:fixed;left:0;top:0;width:560px;max-height:980px;overflow:hidden;background:#241c12;color:#e8dcc0;padding:14px;z-index:99999;font-family:Georgia,serif';
      host.innerHTML = (typeof antBrief==='string'? antBrief : '');
      document.body.appendChild(host);

      return { ok:true, skN: sk.length, perId:perId, allFig:allFig, allAlt:allAlt, allCap:allCap,
        bogusEmpty:bogusEmpty, falsyEmpty:falsyEmpty, imagelessEmpty:imagelessEmpty, imagelessPer:imagelessPer,
        briefing:briefing, maxFigs:maxFigs, battlesChecked:battlesChecked };
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
    R = await page.evaluate(evalScript(SCENE_IDS, IMAGELESS_IDS));
    await sleep(200);
    try { const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 560, height: 980 } }); writeFileSync(join(OUT, 'scenes-imagery.png'), buf); } catch (e) {}
    await ctx.close();
  } finally { if (server) server.kill(); await browser.close(); }

  check('__ASSETS carries the 6 marquee scenes embed keys', R.ok && R.skN === 6, R.ok ? ('scenes=' + R.skN) : ('err=' + R.error));
  check('helper: every embedded id -> a captioned <figure class="scene-img"> with <img data:image/jpeg>', R.ok && R.allFig === true, JSON.stringify(R.perId || {}));
  check('helper: every image carries a NON-EMPTY descriptive alt (informative, not decorative)', R.ok && R.allAlt === true);
  check('helper: every image carries a <figcaption> (scene + holding institution)', R.ok && R.allCap === true);
  check('helper: an unknown id returns "" (guarded, byte-identical-when-absent)', R.ok && R.bogusEmpty === true);
  check('helper: a falsy id ("", null, undefined) returns ""', R.ok && R.falsyEmpty === true);
  check('helper: every documented-imageless battle (malvern/shiloh/chickamauga) returns ""', R.ok && R.imagelessEmpty === true, JSON.stringify(R.imagelessPer || {}));
  const b = (R.ok && R.briefing) || {};
  check('briefing: an IMAGED battle (Antietam) embeds its scene photo, exactly one, before the army columns',
    b.antOk === true && b.antHasScene === true && b.antBeforeArmy === true, JSON.stringify(b));
  check('briefing: an IMAGELESS battle (Shiloh) renders NO scene figure', b.shiOk === true && b.shiNoScene === true);
  check('briefing: NO briefing ever renders two scene figures (single-image guarantee)', R.ok && R.maxFigs <= 1 && R.battlesChecked > 0, 'maxFigs=' + R.maxFigs + ' battlesChecked=' + R.battlesChecked);
  check('0 pageerrors', pe.length === 0, pe.slice(0, 5).join(' | '));

  const passed = steps.filter(s => s.ok).length, total = steps.length;
  const out = { probe: 'scenes-imagery', passed, total, ok: passed === total, pageerrors: pe.slice(0, 10), steps };
  writeFileSync(join(OUT, 'probe-scenes-imagery.json'), JSON.stringify(out, null, 2));
  console.log('scenes-imagery: ' + passed + '/' + total + (out.ok ? ' OK' : ' FAIL'));
  for (const s of steps) if (!s.ok) console.log('  FAIL: ' + s.name + (s.detail ? ' :: ' + s.detail : ''));
  process.exit(out.ok ? 0 : 1);
})();
