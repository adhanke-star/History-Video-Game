#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-flags.mjs
// Focused probe for T10 battle flags & corps insignia (Phase H · H1b deepening, D131). Verifies:
//  - the module + seam fns exist (_fldFlagFor/_fldCorpsBadge/fldDrawFlags/fld3dBuildFlags/fldFlagHudSelected/_fldBattleMeta);
//  - BATTLE-AWARE flag selection: a CS unit flies First National at Bull Run (the ANV battle flag did not exist
//    on 21 Jul 1861), the ANV battle flag in the mid-war East, the Hardee pattern in the Army of Tennessee;
//  - the CORPS-BADGE ANACHRONISM GATE: badges appear ONLY for Eastern battles from Mar 1863 (Chancellorsville,
//    Gettysburg) and NEVER on 1861-62 fields (Bull Run, Malvern Hill, Antietam, Fredericksburg) or in the West;
//  - the corrected Kearny-patch SHAPES: I=disc, II=trefoil (NOT a circle), III=diamond, V=maltese-cross,
//    VI=greek-cross (V and VI distinct), and the roman-numeral parse never mis-reads "II Corps" as "I Corps";
//  - division colour derivation (1st=red, 2nd=white, 3rd=blue) for the badge-eligible units;
//  - CVD-safety: a badge always carries a text label; the HUD pairs the shape with its label + a teaching caption;
//  - the LIVE 3D path builds a textured "flag" mesh (+ a "corpsbadge" mesh only on badge-eligible battles) with
//    NO Three.js "image is undefined" texture warning; the LIVE 2D path paints;
//  - the BYTE-IDENTICAL guarantee: the sim seed AND mutable sim fields are invariant across a render burst
//    (T10 reads u.* but never writes them / never calls fldRng), and the T16/T17/T18/T19 marker chain survives;
//  - the settings gate (battleFlags=false -> no-op);
//  - a static scan: no combat/tactical file (except T10) references the flag layer, and T10 never calls fldRng
//    nor bumps _SAVE_VER.
// (The 9-baseline seed-for-seed byte-identity gate stays owned by probe-presets.)

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const THREE_TEXTURE_WARNING = /THREE\.WebGLRenderer:\s*Texture marked for update but image is undefined/;
const DIAGNOSTIC_LATE_WEST_FALLBACK = process.argv.includes('--diagnostic-late-west-fallback');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }

const steps = [];
function check(name, cond, detail) { steps.push({ name, ok: !!cond, detail: detail === undefined ? '' : String(detail) }); }

/* ---------- STATIC SCAN: combat purity ---------- */
function staticScan() {
  const tacDir = join(ROOT, 'src', 'tactical');
  const files = readdirSync(tacDir).filter(f => /\.js$/.test(f) && f !== 'T10-flags.js');
  const combatExtra = ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js'].map(f => join(ROOT, 'src', f));
  const all = files.map(f => join(tacDir, f)).concat(combatExtra);
  const leaks = [];
  for (const f of all) {
    let txt = ''; try { txt = readFileSync(f, 'utf8'); } catch (e) { continue; }
    // the flag layer is reached only via the typeof seams in T0; no OTHER file should reference its internals.
    // (flag-specific symbols only — T14's rating "_fldBadgeActive/_fldBadgeTrig" are an unrelated combat layer.)
    if (/_fldFlagFor|_fldCorpsBadge|_FLAG_DB|_FLD_BATTLE_META|_fldFlagDrawCanvas|_fldBadgeDrawCanvas/.test(txt)) leaks.push(f.replace(ROOT + '/', ''));
  }
  check('static-scan: no combat/tactical file references the flag layer internals', leaks.length === 0, leaks.join(', '));
  let t10 = ''; try { t10 = readFileSync(join(tacDir, 'T10-flags.js'), 'utf8'); } catch (e) {}
  check('static-scan: T10 never calls fldRng', t10.length > 0 && !/fldRng\(/.test(t10));
  check('static-scan: T10 never bumps _SAVE_VER', t10.length > 0 && !/_SAVE_VER/.test(t10));
  // FOG-GATE: the 2D draw must skip a fog-hidden enemy (no flag betrays an un-scouted position).
  check('static-scan: fldDrawFlags fog-gates a hidden enemy (the 2D no-leak guard is present)',
    /__FIELD\.fog\s*&&\s*u\.side\s*!==\s*ps\s*&&\s*!fldVisible\(ps,\s*u\)/.test(t10), 'guard expression present');
}

async function ensureServer() {
  const probe = cfg.baseUrl + '/' + cfg.file;
  if (await up(probe)) return null;
  const srv = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 70; i++) { if (await up(probe)) return srv; await sleep(150); }
  srv.kill(); throw new Error('Could not start static server on :' + cfg.port);
}

/* ---------- PURE-LOGIC eval (no scene): stub __FIELD.scenario + synthetic units ---------- */
function pureScript() {
  return `(() => {
    try {
      G.settings = G.settings || {}; G.settings.battleFlags = true;
      if (${JSON.stringify(DIAGNOSTIC_LATE_WEST_FALLBACK)}) delete _FLD_BATTLE_META.nashville;
      var savedField = (typeof __FIELD !== 'undefined') ? __FIELD : undefined;
      function withScenario(sc, fn) { __FIELD = { scenario: sc, units: [], fog: false }; try { return fn(); } finally { __FIELD = savedField; } }
      function U(name, side) { return { name: name, side: side, alive: true, x: 0, z: 0, facing: 0, men: 100, maxMen: 100 }; }

      var R = {};
      // meta
      R.meta = {
        bullrun: withScenario('bullrun1', function(){ return _fldBattleMeta(); }),
        crossKeysPortRepublic: withScenario('crossKeysPortRepublic', function(){ return _fldBattleMeta(); }),
        gaines: withScenario('gainesMill', function(){ return _fldBattleMeta(); }),
        gburg: withScenario('gettysburg', function(){ return _fldBattleMeta(); }),
        chick: withScenario('chickamauga', function(){ return _fldBattleMeta(); }),
        chattanooga: withScenario('chattanooga', function(){ return _fldBattleMeta(); }),
        kennesaw: withScenario('kennesaw', function(){ return _fldBattleMeta(); }),
        cedarCreek: withScenario('cedarCreek', function(){ return _fldBattleMeta(); }),
        franklin: withScenario('franklin', function(){ return _fldBattleMeta(); }),
        nashville: withScenario('nashville', function(){ return _fldBattleMeta(); }),
        fiveForks: withScenario('fiveForks', function(){ return _fldBattleMeta(); }),
        nmh: withScenario('newMarketHeights', function(){ return _fldBattleMeta(); }),
        stonesRiver: withScenario('stonesRiver', function(){ return _fldBattleMeta(); }),
        sandbox: withScenario('__nope__', function(){ return _fldBattleMeta(); })
      };
      R.metaCoverage = Object.keys(fldScenarioRegistry()).map(function(id) {
        return { id: id, explicit: Object.prototype.hasOwnProperty.call(_FLD_BATTLE_META, id) };
      });
      // flag selection (battle-aware)
      function flagPat(sc, name, side){ return withScenario(sc, function(){ var f=_fldFlagFor(U(name, side)); return f ? f.pattern : null; }); }
      R.flag = {
        csBullRun: flagPat('bullrun1', "Jackson's Brigade ('Stonewall')", 'CS'),
        csCrossKeysPortRepublic: flagPat('crossKeysPortRepublic', "Ewell's Division - Ridge Center Grouping", 'CS'),
        csGainesMill: flagPat('gainesMill', "Hood's Texas Brigade", 'CS'),
        csAntietam: flagPat('antietam', "Early's Brigade", 'CS'),
        csChickamaugaNative: flagPat('chickamauga', "Renewed Assault Wave", 'CS'),
        csChickamaugaHood: flagPat('chickamauga', "Hood's Arriving Brigades", 'CS'),
        csChickamaugaKershaw: flagPat('chickamauga', "Kershaw's Brigades", 'CS'),
        csVicksburg: flagPat('vicksburg', "Interior Reserve", 'CS'),
        csChattanooga: flagPat('chattanooga', "Bate's Division Sector", 'CS'),
        csKennesaw: flagPat('kennesaw', "Maney's Tennessee Brigade", 'CS'),
        csCedarCreek: flagPat('cedarCreek', "Gordon's Division", 'CS'),
        csFranklin: flagPat('franklin', "Cleburne's Division", 'CS'),
        csNashville: flagPat('nashville', "Cheatham's Shy's Hill Line", 'CS'),
        csFiveForks: flagPat('fiveForks', "White Oak Road Left Grouping", 'CS'),
        csNewMarketHeights: flagPat('newMarketHeights', "Gregg's Texas Brigade", 'CS'),
        csStonesRiver: flagPat('stonesRiver', "Cleburne's Division", 'CS'),
        csGettysburg: flagPat('gettysburg', "Rodes's Division", 'CS'),
        csShiloh: flagPat('shiloh', "Chalmers's Brigade", 'CS'),
        usNational: flagPat('gettysburg', "Doubleday's Division (I Corps)", 'US'),
        usIrish: flagPat('fredericksburg', "the Irish Brigade (Meagher's)", 'US'),
        usIron: flagPat('antietam', "Iron Brigade", 'US')
      };
      // corps badge GATE + SHAPE + division colour
      function badge(sc, name){ return withScenario(sc, function(){ return _fldCorpsBadge(U(name, 'US')); }); }
      R.gate = {
        antietamXII: badge('antietam', "Williams's Division (XII Corps)"),        // pre-Mar-1863 -> null
        fburgV: badge('fredericksburg', "Griffin's Division (V Corps)"),          // pre-Mar-1863 -> null
        shilohW: badge('shiloh', "Buell's Army — Nelson's Division"),             // Western -> null
        gburgII: badge('gettysburg', "Caldwell's Division (II Corps)"),           // eligible -> trefoil
        gburgI: badge('gettysburg', "Doubleday's Division (I Corps)"),            // eligible -> disc
        gburgV: badge('gettysburg', "Ayres's Division (V Corps)"),                // eligible -> maltese-cross
        chancVI: badge('chancellorsville', "Sedgwick's VI Corps"),               // eligible -> greek-cross
        chancIII: badge('chancellorsville', "Whipple's Division (III Corps reserve)"), // eligible -> diamond
        gburgCS: badge('gettysburg', "Rodes's Division"),                          // CS unit -> null (set side CS below)
        gburgStannard: badge('gettysburg', "Stannard's Vermonters")              // surname fallback -> I Corps disc
      };
      R.gateCS = withScenario('gettysburg', function(){ return _fldCorpsBadge(U("Rodes's Division", 'CS')); }); // -> null
      // roman parse must not mis-read II as I
      R.roman = { i: _romanToInt('i'), ii: _romanToInt('ii'), iii: _romanToInt('iii'), iv: _romanToInt('iv'), v: _romanToInt('v'), vi: _romanToInt('vi'), ix: _romanToInt('ix'), xii: _romanToInt('xii') };
      // HUD html
      R.hud = {
        gburgII: withScenario('gettysburg', function(){ return fldFlagHudSelected(U("Caldwell's Division (II Corps)", 'US')); }),
        antietamNote: withScenario('antietam', function(){ return fldFlagHudSelected(U("Williams's Division (XII Corps)", 'US')); }),
        csBullRun: withScenario('bullrun1', function(){ return fldFlagHudSelected(U("Jackson's Brigade ('Stonewall')", 'CS')); })
      };
      function hudInfo(html) {
        var wrap = document.createElement('div'); wrap.innerHTML = html || '';
        var shell = wrap.querySelector('[data-fld-flag-hud="1"]');
        var img = wrap.querySelector('[data-flag-role="image"]');
        var title = wrap.querySelector('[data-flag-role="title"]');
        var cap = wrap.querySelector('[data-flag-role="caption"]');
        var corps = wrap.querySelector('[data-flag-role="corps"]');
        var note = wrap.querySelector('[data-flag-role="corps-note"]');
        function px(el, prop) { var v = el && el.style ? el.style[prop] : ''; return parseFloat(String(v || '').replace('px', '')) || 0; }
        return {
          shell: !!shell,
          role: shell ? shell.getAttribute('role') : '',
          aria: shell ? shell.getAttribute('aria-label') : '',
          display: shell && shell.style ? shell.style.display : '',
          grid: shell && shell.style ? shell.style.gridTemplateColumns : '',
          bounded: !!(shell && /max-width:\s*100%/.test(shell.getAttribute('style') || '') && /overflow:\s*hidden/.test(shell.getAttribute('style') || '')),
          imgW: px(img, 'width'),
          imgH: px(img, 'height'),
          titleFont: px(title, 'fontSize'),
          titleWrap: !!(title && /overflow-wrap:\s*anywhere/.test(title.getAttribute('style') || '')),
          captionFont: px(cap, 'fontSize'),
          captionLine: px(cap, 'lineHeight'),
          captionWrap: !!(cap && /overflow-wrap:\s*anywhere/.test(cap.getAttribute('style') || '')),
          corps: !!corps,
          note: !!note,
          corpsText: corps ? corps.textContent : '',
          noteText: note ? note.textContent : ''
        };
      }
      R.hudInfo = {
        gburgII: hudInfo(R.hud.gburgII),
        antietamNote: hudInfo(R.hud.antietamNote),
        csBullRun: hudInfo(R.hud.csBullRun)
      };
      // settings gate
      G.settings.battleFlags = false;
      R.gateOff = withScenario('gettysburg', function(){ return fldFlagHudSelected(U("Caldwell's Division (II Corps)", 'US')); });
      G.settings.battleFlags = true;

      R.fns = ['_fldFlagFor','_fldCorpsBadge','fldDrawFlags','fld3dBuildFlags','fldFlagHudSelected','_fldBattleMeta','_romanToInt','_fldBadgeDrawCanvas','_fldFlagDrawCanvas'].every(function(n){ return eval('typeof '+n) === 'function'; });
      return { ok: true, R: R };
    } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  })()`;
}

/* ---------- LIVE-SCENE eval: build flags + badges in a real battle ---------- */
function sceneScript(scenario, seed, opts) {
  opts = opts || {};
  return `(async () => {
    function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
    try {
      try { if (typeof fldExit === 'function' && typeof __FIELD !== 'undefined' && __FIELD && __FIELD.launched) fldExit(true); } catch(e){}
      await wait(120);
      G.settings = G.settings || {};
      G.settings.gfxQuality = 'high';
      G.settings.battleFlags = true;
      try { delete G.settings.tacticalPreset; } catch(e) {}
      delete G.settings.tacticalFog;

      fldLaunchSandbox({ renderer:${JSON.stringify(opts.r2d ? '2d' : '3d')}, scenario:${JSON.stringify(scenario)}, autoBoth:true, playerSide:'US', seed:${seed} });
      if (!${JSON.stringify(!!opts.r2d)}) {
        for (var w = 0; w < 160 && !(__FIELD.mode3d && __FIELD.renderer); w++) await wait(100);
        if (!__FIELD.mode3d || !__FIELD.renderer) throw new Error('3D renderer did not become active; kind=' + __FIELD.rendererKind);
      }
      if (__FIELD.phase === 'deploy') { __FIELD.phase = 'battle'; __FIELD.paused = false; }
      for (var f = 0; f < 5; f++) { fldRender(); await wait(70); }

      // FOG-OF-WAR LEAK CHECK (3D): turn fog on, let visibility settle, then confirm that EVERY un-scouted enemy's
      // unit GROUP is hidden — so its flag + corps-badge children (which carry no independent visibility) are hidden
      // too. A leak would be a hidden enemy whose group stays visible.
      var fog = null;
      if (${JSON.stringify(!!opts.fog)} && !${JSON.stringify(!!opts.r2d)}) {
        __FIELD.fog = true;
        for (var fz = 0; fz < 8; fz++) { fldRender(); await wait(70); }
        var _fps = fldPlayerSide(); fog = { enemies: 0, hidden: 0, leak: 0, hiddenFlagShown: 0 };
        for (var fi = 0; fi < __FIELD.units.length; fi++) {
          var fu = __FIELD.units[fi]; if (!fu.alive || fu.side === _fps) continue;
          fog.enemies++;
          if (!fldVisible(_fps, fu)) {
            fog.hidden++;
            var fg = __FIELD._u3d[fu.id];
            if (fg && fg.visible) fog.leak++;
            var fmm = fg && fg.getObjectByName('flag');
            // a hidden enemy's flag must not be independently shown (it inherits the hidden parent)
            if (fmm && fg && fg.visible && fmm.visible) fog.hiddenFlagShown++;
          }
        }
      }

      // marker chain survives (T10 loaded before T16-19, so the chain must be intact)
      var chain = !!(fld3dRender && fld3dRender._atmo && fld2dDraw && fld2dDraw._atmo && fld2dDraw._wx);
      var installed = !!(fld3dBuildUnits && fld3dBuildUnits._t10FlagMaps);

      // inspect the 3D unit groups: flag textured? badge present per the date gate?
      var insp = { flagTextured: 0, badgeMeshes: 0, usUnits: 0, flagMeshes: 0, hudSample: '' };
      if (!${JSON.stringify(!!opts.r2d)}) {
        for (var i = 0; i < __FIELD.units.length; i++) {
          var u = __FIELD.units[i]; var g = __FIELD._u3d && __FIELD._u3d[u.id]; if (!g) continue;
          if (u.side === 'US') insp.usUnits++;
          var fm = g.getObjectByName('flag');
          if (fm) { insp.flagMeshes++; if (fm.material && fm.material.map) insp.flagTextured++; }
          var bm = g.getObjectByName('corpsbadge');
          if (bm) insp.badgeMeshes++;
        }
        // HUD on the first live US unit
        for (var h = 0; h < __FIELD.units.length; h++) { var hu = __FIELD.units[h]; if (hu.alive && hu.side === 'US') { insp.hudSample = String(fldFlagHudSelected(hu) || ''); break; } }
      } else {
        // 2D: just confirm fld2dDraw (which calls fldDrawFlags) painted without throwing
        fld2dDraw(); insp.painted2d = true;
      }

      // byte-identity: sim seed + mutable fields invariant across a profile-scale synchronous render burst
      function _simSnap(){ var s=[]; for (var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; s.push(u.x+','+u.z+','+u.men+','+u.morale+','+u.facing+','+u.formation); } return s.join('|'); }
      var seedBefore = __FIELD.seed, simBefore = _simSnap();
      for (var s2=0; s2<45; s2++) { fldRender(); }
      var seedAfter = __FIELD.seed, simAfter = _simSnap();

      var cv = document.getElementById('fldGl');
      var dataUrl = (cv && typeof cv.toDataURL === 'function') ? cv.toDataURL('image/png') : '';
      return { ok:true, scenario:${JSON.stringify(scenario)}, chain:chain, installed:installed, insp:insp, fog:fog,
        seedStable:(seedBefore===seedAfter), simStable:(simBefore===simAfter),
        seedBefore:seedBefore, seedAfter:seedAfter, mode3d:!!__FIELD.mode3d, dataUrl:dataUrl };
    } catch(e) { return { ok:false, error:String(e && e.message || e), scenario:${JSON.stringify(scenario)} }; }
  })()`;
}

async function runScene(page, label, scenario, seed, opts, shared) {
  const peStart = shared.pe.length, conStart = shared.con.length;
  let d = { ok: false, error: 'not run' };
  try {
    d = await page.evaluate(sceneScript(scenario, seed, opts));
    if (d && d.ok && d.dataUrl && d.dataUrl.indexOf('data:image/png;base64,') === 0) {
      writeFileSync(join(OUT, 'flags-' + label + '.png'), Buffer.from(d.dataUrl.split(',')[1] || '', 'base64'));
      d.shot = 'tools/shots/flags-' + label + '.png';
    }
    if (d) delete d.dataUrl;
  } catch (e) { d = { ok: false, error: String(e && e.message || e) }; }
  const pageerrors = shared.pe.slice(peStart), consoleLines = shared.con.slice(conStart);
  const texWarn = consoleLines.filter(l => THREE_TEXTURE_WARNING.test(l));
  return { label, detail: d, pageerrors, texWarn, console: consoleLines.slice(-10) };
}

(async () => {
  staticScan();
  const server = await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: GL }).catch(() =>
    chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: GL }));
  const ctx = await browser.newContext({ viewport: cfg.viewport, deviceScaleFactor: 1 });
  ctx.setDefaultTimeout(45000);
  const page = await ctx.newPage();
  const shared = { pe: [], con: [] };
  page.on('pageerror', e => shared.pe.push(String(e.message)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') shared.con.push('[' + m.type() + '] ' + m.text()); });

  let pure = { ok: false, error: 'not run' };
  const scenes = [];
  try {
    await page.goto(cfg.baseUrl + '/' + cfg.file, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await sleep(500);
    pure = await page.evaluate(pureScript());
    scenes.push(await runScene(page, 'gettysburg-3d', 'gettysburg', 31, {}, shared));
    scenes.push(await runScene(page, 'antietam-3d', 'antietam', 17, {}, shared));
    scenes.push(await runScene(page, 'gettysburg-2d', 'gettysburg', 31, { r2d: true }, shared));
    scenes.push(await runScene(page, 'fog-3d', 'gettysburg', 31, { fog: true }, shared));
  } finally { if (server) server.kill(); }

  /* ---------- PURE-LOGIC assertions ---------- */
  const P = pure.ok ? pure.R : {};
  check('module + flag/badge fns present', pure.ok && P.fns === true, pure.ok ? '' : ('err=' + pure.error));
  check('battle meta: badges gated to Eastern post-Mar-1863 (Gettysburg yes, Bull Run/Chickamauga no, sandbox no)',
    pure.ok && P.meta && P.meta.gburg.badges === true && P.meta.bullrun.badges === false && P.meta.chick.badges === false && P.meta.sandbox.badges === false,
    JSON.stringify(P.meta || {}));
  check('battle meta: every registered historical scenario has explicit metadata (no silent Eastern/ANV fallback)',
    pure.ok && Array.isArray(P.metaCoverage) && P.metaCoverage.length === 29 && P.metaCoverage.every(x => x.explicit),   // D391: 21 -> 22 — Spotsylvania ships explicit E/true/anv metadata. D393: 22 -> 23 — Wilderness ships explicit E/true/anv metadata. D397: 23 -> 24 — Petersburg initial assaults ships explicit E/true/anv metadata. D436: 24 -> 25 — Atlanta ships explicit W/false/hardee metadata. D442: 25 -> 26 — Cold Harbor ships explicit E/true/anv metadata. D463: 26 -> 27 — Fort Pillow ships explicit W/false/anv metadata (Forrest's cavalry corps, an Inferred representative family; LANE-013 P4). D469: 27 -> 28 — The Crater ships explicit E/true/anv metadata (AotP IX Corps badges, Mahone's ANV division; LANE-015). D470: 28 -> 29 — Olustee ships explicit E/false/first-national metadata (no corps badges; the Inferred-representative family; LANE-016).
    JSON.stringify(P.metaCoverage || []));
  check('battle meta + flag: Five Forks is an Eastern AotP/ANV field with V Corps badges and an ANV-family Southern Cross (D380)',
    pure.ok && P.meta && P.meta.fiveForks && P.meta.fiveForks.theater === 'E' && P.meta.fiveForks.badges === true && P.meta.fiveForks.csFlag === 'anv'
      && P.flag && P.flag.csFiveForks === 'southern-cross',
    'meta=' + JSON.stringify(P.meta && P.meta.fiveForks) + ' flag=' + (P.flag && P.flag.csFiveForks));
  check('battle meta + flag: Cross Keys / Port Republic is an Eastern 1862 field with no AotP badge reuse and an explicitly Inferred ANV-family Southern Cross (D378)',
    pure.ok && P.meta && P.meta.crossKeysPortRepublic && P.meta.crossKeysPortRepublic.theater === 'E' && P.meta.crossKeysPortRepublic.badges === false && P.meta.crossKeysPortRepublic.csFlag === 'anv'
      && P.flag && P.flag.csCrossKeysPortRepublic === 'southern-cross',
    'meta=' + JSON.stringify(P.meta && P.meta.crossKeysPortRepublic) + ' flag=' + (P.flag && P.flag.csCrossKeysPortRepublic));
  check('battle meta + flag: Cedar Creek is an Eastern Army-of-the-Valley field - no AotP badge reuse, ANV Southern Cross for Early\'s detached Second Corps (D376)',
    pure.ok && P.meta && P.meta.cedarCreek && P.meta.cedarCreek.theater === 'E' && P.meta.cedarCreek.badges === false && P.meta.cedarCreek.csFlag === 'anv'
      && P.flag && P.flag.csCedarCreek === 'southern-cross',
    'meta=' + JSON.stringify(P.meta && P.meta.cedarCreek) + ' flag=' + (P.flag && P.flag.csCedarCreek));
  check('battle meta + flag: Stones River is a Western Army-of-Tennessee field - no AotP badges, Hardee-pattern blue disc for the native CS divisions (D366)',
    pure.ok && P.meta && P.meta.stonesRiver && P.meta.stonesRiver.theater === 'W' && P.meta.stonesRiver.badges === false && P.meta.stonesRiver.csFlag === 'hardee'
      && P.flag && P.flag.csStonesRiver === 'hardee',
    'meta=' + JSON.stringify(P.meta && P.meta.stonesRiver) + ' flag=' + (P.flag && P.flag.csStonesRiver));
  check('battle meta + flag: Gaines Mill is pre-badge Eastern and uses the ANV Southern Cross family',
    pure.ok && P.meta && P.meta.gaines && P.meta.gaines.theater === 'E' && P.meta.gaines.badges === false && P.meta.gaines.csFlag === 'anv'
      && P.flag && P.flag.csGainesMill === 'southern-cross',
    'meta=' + JSON.stringify(P.meta && P.meta.gaines) + ' flag=' + (P.flag && P.flag.csGainesMill));
  check('battle meta + flag: New Market Heights is an Army-of-the-James Eastern field - no AotP badges (the AoJ badge sets are not modeled), ANV Southern Cross for Field\'s Division defenders',
    pure.ok && P.meta && P.meta.nmh && P.meta.nmh.theater === 'E' && P.meta.nmh.badges === false && P.meta.nmh.csFlag === 'anv'
      && P.flag && P.flag.csNewMarketHeights === 'southern-cross',
    'meta=' + JSON.stringify(P.meta && P.meta.nmh) + ' flag=' + (P.flag && P.flag.csNewMarketHeights));
  check('battle meta: Chattanooga/Kennesaw/Franklin/Nashville are Western AoT fields with no AotP badges and a Hardee-pattern default',
    pure.ok && ['chattanooga', 'kennesaw', 'franklin', 'nashville'].every(function(id) {
      var m = P.meta && P.meta[id]; return m && m.theater === 'W' && m.badges === false && m.csFlag === 'hardee';
    }),
    JSON.stringify(P.meta || {}));
  check('flag: CS flies First National at Bull Run (the ANV battle flag did not yet exist)',
    pure.ok && P.flag.csBullRun === 'first-national', 'pattern=' + (P.flag && P.flag.csBullRun));
  check('flag: CS flies the ANV battle flag (Southern Cross) in the mid-war East (Antietam, Gettysburg)',
    pure.ok && P.flag.csAntietam === 'southern-cross' && P.flag.csGettysburg === 'southern-cross',
    'antietam=' + (P.flag && P.flag.csAntietam) + ' gettysburg=' + (P.flag && P.flag.csGettysburg));
  check('flag: native Army of Tennessee flies the Hardee pattern (Chickamauga); First National at Shiloh',
    pure.ok && P.flag.csChickamaugaNative === 'hardee' && P.flag.csShiloh === 'first-national',
    'chickamauga-native=' + (P.flag && P.flag.csChickamaugaNative) + ' shiloh=' + (P.flag && P.flag.csShiloh));
  check('flag: Longstreet\'s transferred EASTERN brigades (Hood, Kershaw) fly the ANV battle flag even at Chickamauga',
    pure.ok && P.flag.csChickamaugaHood === 'southern-cross' && P.flag.csChickamaugaKershaw === 'southern-cross',
    'hood=' + (P.flag && P.flag.csChickamaugaHood) + ' kershaw=' + (P.flag && P.flag.csChickamaugaKershaw));
  check('flag: Vicksburg (Pemberton\'s Western-lineage army) flies a Western pattern, not the Eastern ANV cross',
    pure.ok && P.flag.csVicksburg === 'hardee', 'vicksburg=' + (P.flag && P.flag.csVicksburg));
  check('flag: all four late-West Army of Tennessee scenarios resolve native CS units to the Hardee pattern',
    pure.ok && P.flag.csChattanooga === 'hardee' && P.flag.csKennesaw === 'hardee'
      && P.flag.csFranklin === 'hardee' && P.flag.csNashville === 'hardee',
    'chattanooga=' + (P.flag && P.flag.csChattanooga) + ' kennesaw=' + (P.flag && P.flag.csKennesaw)
      + ' franklin=' + (P.flag && P.flag.csFranklin) + ' nashville=' + (P.flag && P.flag.csNashville));
  check('flag: US national / Irish harp / Iron Brigade national resolve correctly',
    pure.ok && P.flag.usNational === 'stars-stripes' && P.flag.usIrish === 'harp' && P.flag.usIron === 'stars-stripes',
    JSON.stringify(P.flag || {}));

  check('badge GATE: NO corps badge on pre-Mar-1863 Eastern (Antietam XII, Fredericksburg V) or Western (Shiloh)',
    pure.ok && P.gate.antietamXII === null && P.gate.fburgV === null && P.gate.shilohW === null,
    'antietamXII=' + JSON.stringify(P.gate && P.gate.antietamXII) + ' fburgV=' + JSON.stringify(P.gate && P.gate.fburgV) + ' shilohW=' + JSON.stringify(P.gate && P.gate.shilohW));
  check('badge SHAPE: II Corps = TREFOIL (the corrected Kearny patch — not a circle)',
    pure.ok && P.gate.gburgII && P.gate.gburgII.shape === 'trefoil' && P.gate.gburgII.label === 'II Corps',
    JSON.stringify(P.gate && P.gate.gburgII));
  check('badge SHAPE: I=disc, III=diamond, V=maltese-cross, VI=greek-cross (V and VI distinct)',
    pure.ok && P.gate.gburgI && P.gate.gburgI.shape === 'disc' && P.gate.chancIII && P.gate.chancIII.shape === 'diamond'
      && P.gate.gburgV && P.gate.gburgV.shape === 'maltese-cross' && P.gate.chancVI && P.gate.chancVI.shape === 'greek-cross',
    'I=' + (P.gate.gburgI && P.gate.gburgI.shape) + ' III=' + (P.gate.chancIII && P.gate.chancIII.shape) + ' V=' + (P.gate.gburgV && P.gate.gburgV.shape) + ' VI=' + (P.gate.chancVI && P.gate.chancVI.shape));
  check('badge: roman-numeral parse never mis-reads II as I (i=1, ii=2, iii=3, iv=4, v=5, vi=6, ix=9, xii=12)',
    pure.ok && P.roman.i === 1 && P.roman.ii === 2 && P.roman.iii === 3 && P.roman.iv === 4 && P.roman.v === 5 && P.roman.vi === 6 && P.roman.ix === 9 && P.roman.xii === 12,
    JSON.stringify(P.roman || {}));
  check('badge: surname fallback resolves an untagged unit (Stannard -> I Corps disc)',
    pure.ok && P.gate.gburgStannard && P.gate.gburgStannard.shape === 'disc' && P.gate.gburgStannard.label === 'I Corps',
    JSON.stringify(P.gate && P.gate.gburgStannard));
  check('badge: division colour derived (Caldwell 1st=red, Ayres 2nd=white, Doubleday 3rd=blue)',
    pure.ok && P.gate.gburgII && P.gate.gburgII.division === 1 && P.gate.gburgV && P.gate.gburgV.division === 2 && P.gate.gburgI && P.gate.gburgI.division === 3,
    'II.div=' + (P.gate.gburgII && P.gate.gburgII.division) + ' V.div=' + (P.gate.gburgV && P.gate.gburgV.division) + ' I.div=' + (P.gate.gburgI && P.gate.gburgI.division));
  check('badge: a Confederate unit never gets an AotP corps badge (even at a badge-eligible battle)',
    pure.ok && P.gateCS === null, 'gateCS=' + JSON.stringify(P.gateCS));

  check('HUD (CVD-safe): an eligible US unit shows the flag label + the corps label text',
    pure.ok && /II Corps/.test(P.hud.gburgII) && /Corps/.test(P.hud.gburgII) && P.hud.gburgII.indexOf('<img') >= 0,
    (P.hud && P.hud.gburgII || '').slice(0, 80));
  check('HUD polish: flag readout is a bounded labelled group with a larger 58x37 colour image',
    pure.ok && P.hudInfo && P.hudInfo.gburgII && P.hudInfo.gburgII.shell && P.hudInfo.gburgII.role === 'group'
      && P.hudInfo.gburgII.aria === 'Battle colours' && P.hudInfo.gburgII.display === 'grid'
      && P.hudInfo.gburgII.bounded && P.hudInfo.gburgII.imgW >= 58 && P.hudInfo.gburgII.imgH >= 37,
    JSON.stringify(P.hudInfo && P.hudInfo.gburgII || {}));
  check('HUD polish: title/caption/corps text are readable and wrapping-safe',
    pure.ok && P.hudInfo && P.hudInfo.gburgII && P.hudInfo.gburgII.titleFont >= 12
      && P.hudInfo.gburgII.titleWrap && P.hudInfo.gburgII.captionFont >= 11.5
      && P.hudInfo.gburgII.captionLine >= 1.3 && P.hudInfo.gburgII.captionWrap
      && P.hudInfo.gburgII.corps && /1st Division/.test(P.hudInfo.gburgII.corpsText),
    JSON.stringify(P.hudInfo && P.hudInfo.gburgII || {}));
  check('HUD: a pre-badge Eastern field names the Mar-1863 adoption date (the teaching beat)',
    pure.ok && /adopted Mar 1863/i.test(P.hud.antietamNote), (P.hud && P.hud.antietamNote || '').slice(0, 120));
  check('HUD polish: pre-badge corps note is readable and wrapping-safe',
    pure.ok && P.hudInfo && P.hudInfo.antietamNote && P.hudInfo.antietamNote.note
      && P.hudInfo.antietamNote.captionFont >= 11.5 && /Mar 1863/.test(P.hudInfo.antietamNote.noteText),
    JSON.stringify(P.hudInfo && P.hudInfo.antietamNote || {}));
  check('HUD: a CS Bull Run unit names the First National flag', pure.ok && /First National/i.test(P.hud.csBullRun), (P.hud && P.hud.csBullRun || '').slice(0, 80));
  check('settings gate: battleFlags=false -> fldFlagHudSelected returns ""', pure.ok && P.gateOff === '', 'gateOff=' + JSON.stringify(P.gateOff));

  /* ---------- LIVE-SCENE assertions ---------- */
  const byLabel = {}; for (const s of scenes) byLabel[s.label] = s;
  const G3 = byLabel['gettysburg-3d'].detail, A3 = byLabel['antietam-3d'].detail, G2 = byLabel['gettysburg-2d'].detail, FG = byLabel['fog-3d'].detail;
  const allPe = scenes.reduce((a, s) => a + s.pageerrors.length, 0);
  const allTex = scenes.reduce((a, s) => a + s.texWarn.length, 0);

  check('live Gettysburg-3D: every flag mesh is textured + the marker chain/install survive',
    G3.ok && G3.chain && G3.installed && G3.insp.flagMeshes > 0 && G3.insp.flagTextured === G3.insp.flagMeshes,
    G3.ok ? ('flags=' + G3.insp.flagMeshes + ' textured=' + G3.insp.flagTextured + ' chain=' + G3.chain) : ('err=' + G3.error));
  check('live Gettysburg-3D: corps-badge meshes built on this badge-eligible battle (> 0)',
    G3.ok && G3.insp.badgeMeshes > 0, 'badgeMeshes=' + (G3.ok && G3.insp.badgeMeshes));
  check('live Gettysburg-3D: the HUD renders a non-empty flag/badge block for a US unit',
    G3.ok && G3.insp.hudSample && G3.insp.hudSample.length > 0, (G3.ok && G3.insp.hudSample || '').slice(0, 60));
  check('live Gettysburg-3D: sim seed + mutable fields INVARIANT across a 45-frame render burst (byte-identical)',
    G3.ok && G3.seedStable && G3.simStable === true, 'seed=' + (G3.ok && G3.seedStable) + ' sim=' + (G3.ok && G3.simStable));

  check('live Antietam-3D (the gate): NO corps-badge mesh built (badges postdate this 1862 field)',
    A3.ok && A3.insp.badgeMeshes === 0 && A3.insp.flagMeshes > 0,
    A3.ok ? ('badgeMeshes=' + A3.insp.badgeMeshes + ' flags=' + A3.insp.flagMeshes) : ('err=' + A3.error));
  check('live Antietam-3D: sim seed + fields invariant across the render burst', A3.ok && A3.seedStable && A3.simStable === true,
    'seed=' + (A3.ok && A3.seedStable) + ' sim=' + (A3.ok && A3.simStable));

  check('live Gettysburg-2D: the 2D flag path paints without error (a shot was captured)',
    G2.ok && G2.shot, G2.ok ? ('shot=' + G2.shot) : ('err=' + G2.error));
  check('live Gettysburg-2D: sim seed + fields invariant across the render burst', G2.ok && G2.seedStable && G2.simStable === true,
    'seed=' + (G2.ok && G2.seedStable) + ' sim=' + (G2.ok && G2.simStable));

  check('FOG-OF-WAR (3D): fog actually conceals >=1 un-scouted enemy at this distance (the gate is exercised, not vacuous)',
    FG.ok && FG.fog && FG.fog.hidden > 0, FG.ok ? ('hidden=' + (FG.fog && FG.fog.hidden) + '/' + (FG.fog && FG.fog.enemies)) : ('err=' + FG.error));
  check('FOG-OF-WAR (3D): NO leak — every hidden enemy\'s group is invisible, so its flag + corps badge never betray it',
    FG.ok && FG.fog && FG.fog.leak === 0 && FG.fog.hiddenFlagShown === 0,
    'leak=' + (FG.fog && FG.fog.leak) + ' hiddenFlagShown=' + (FG.fog && FG.fog.hiddenFlagShown));
  check('FOG-OF-WAR (3D): sim seed + fields invariant across the fog render burst', FG.ok && FG.seedStable && FG.simStable === true,
    'seed=' + (FG.ok && FG.seedStable) + ' sim=' + (FG.ok && FG.simStable));

  check('no Three.js texture warning across all live scenes (canvas drawn before wrap)', allTex === 0, 'texWarnings=' + allTex);
  check('zero pageerrors across all live scenes', allPe === 0, 'pageerrors=' + allPe);

  const ok = steps.every(s => s.ok);
  const out = { ok, generatedAt: new Date().toISOString(), diagnosticLateWestFallback: DIAGNOSTIC_LATE_WEST_FALLBACK, passed: steps.filter(s => s.ok).length, total: steps.length, steps, pure, scenes };
  writeFileSync(join(OUT, 'probe-flags.json'), JSON.stringify(out, null, 2));
  console.log('probe-flags ok=' + ok + ' (' + out.passed + '/' + out.total + ')');
  for (const s of steps) console.log((s.ok ? '  ok   ' : '  FAIL ') + s.name + (s.detail ? ' :: ' + s.detail : ''));
  try { await Promise.race([ctx.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  try { await Promise.race([browser.close().catch(() => {}), sleep(2500)]); } catch (e) {}
  try { const proc = browser.process && browser.process(); if (proc && !proc.killed) proc.kill('SIGTERM'); } catch (e) {}
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
