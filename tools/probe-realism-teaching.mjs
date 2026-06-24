#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-realism-teaching.mjs — E2-i5 (D124) "THE REAL COST" historical teaching layer.
// Verifies: the 96-realism-teaching module loads; rtmRealismExpanderHTML renders the bundle
// framing + all 8 lever cards + the combined Sources block; the per-lever "YOURS:" chip is
// CONTEXTUAL to the passed config (attrition 1.3 -> Heavy, 0.7 -> Light); rtmHubReadout returns
// a teaching line for a valid bundle and "" otherwise; every lever + bundle carries >=2 sources;
// ANTI-LOST-CAUSE content present (Historian names slavery; Arcade names itself a scaffold, not
// the war); robustness (null/unknown cfg never throws); the T6 PICKER integration ("What this
// costs in real life" -> #pvTeach toggles #rtmTeach); PURITY (render never calls Math.random,
// writes no G/combat knob/localStorage); the combat-config producers (fldPresetNeutral /
// fldPresetCompute) are unperturbed (the no-thumb-on-the-scale invariant); XSS-safety (no
// <script in rendered HTML); and a STATIC SCAN proving NO combat-execution file references the
// rtm-family symbols (T6 is the lone authorized UI hook; battles byte-identical by construction).
// Writes shots/probe-realism-teaching.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// RTM-01 (byte-identity): NO combat-execution file may reference the teaching API. The T6 picker
// (a menu UI) is the lone authorized host and is EXCLUDED; if any sim/bridge/resolve file ever
// references rtm, the teaching layer stopped being a pure read-out.
function staticRtmLeakScan() {
  const RTM_RE = /rtmRealismExpanderHTML|rtmHubReadout|rtmLeverTeach|rtmBundleTeach|rtmSettingLabel|\bRTM\b|_rtm/;
  const files = [];
  try {
    const TACT = join(ROOT, 'src', 'tactical');
    for (const f of readdirSync(TACT)) if (f.endsWith('.js') && f !== 'T6-presets.js') files.push(join(TACT, f));
  } catch (e) {}
  for (const f of ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js', '80-victory.js', '81-divergence.js', '82-after-action.js', '83-endings.js']) files.push(join(ROOT, 'src', f));
  const leaks = [];
  for (const f of files) { try { if (RTM_RE.test(readFileSync(f, 'utf8'))) leaks.push(f.split('/').pop()); } catch (e) {} }
  return { scanned: files.length, leaks };
}
// RTM-02: in T6, the teaching reference must live ONLY in the picker UI, never in the combat-read
// functions fldInitSim reads (fldPresetsApply / fldPresetCompute / _fldClampCfg / fldPresetNeutral
// / fldPresetResolve). Extract each function body and assert no rtm reference inside.
function t6CombatPathClean() {
  let src = '';
  try { src = readFileSync(join(ROOT, 'src', 'tactical', 'T6-presets.js'), 'utf8'); } catch (e) { return { ok:false, err:'unreadable' }; }
  const fns = ['fldPresetsApply', 'fldPresetCompute', '_fldClampCfg', 'fldPresetNeutral', 'fldPresetResolve'];
  const dirty = [];
  for (const fn of fns) {
    const m = src.match(new RegExp('function\\s+' + fn.replace(/[$]/g, '\\$') + '\\s*\\([^)]*\\)\\s*\\{'));
    if (!m) { dirty.push(fn + ':not-found'); continue; }
    // walk braces from the opening { to find the body
    let i = m.index + m[0].length - 1, depth = 0, body = '';
    for (; i < src.length; i++) { const c = src[i]; if (c === '{') depth++; else if (c === '}') { depth--; if (depth === 0) { i++; break; } } body += c; }
    if (/rtm|RTM/.test(body)) dirty.push(fn);
  }
  return { checked: fns.length, dirty };
}

const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }

const SETUP = `(() => {
  var R = { steps: [], errors: [] , ok:true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  try {
    if (typeof rtmRealismExpanderHTML!=='function' || typeof rtmHubReadout!=='function' ||
        typeof rtmLeverTeach!=='function' || typeof rtmBundleTeach!=='function' || typeof rtmSettingLabel!=='function')
      return JSON.stringify({ok:false, fatal:'realism-teaching module missing'});
    if (typeof RTM==='undefined' || !RTM.levers || !RTM.bundles) return JSON.stringify({ok:false, fatal:'RTM content table missing'});
    G.settings = G.settings || {}; G.settings.gfx='classic'; G.mode='menu';

    var LEVERS = ['attrition','canister','supply','cmdShock','sight','veteran','aiSkill','fog'];
    var BUNDLES = ['arcade','balanced','historian'];

    step('content table: 8 levers + 3 bundles, each with title/cost and >=2 sources', function(){
      for (var i=0;i<LEVERS.length;i++){ var L=rtmLeverTeach(LEVERS[i]);
        if(!L) throw new Error('missing lever teach: '+LEVERS[i]);
        if(!L.title||!L.cost||!L.models) throw new Error('lever '+LEVERS[i]+' missing title/cost/models');
        if(!Array.isArray(L.sources)||L.sources.length<2) throw new Error('lever '+LEVERS[i]+' has <2 sources'); }
      for (var j=0;j<BUNDLES.length;j++){ var B=rtmBundleTeach(BUNDLES[j]);
        if(!B||!B.title||!B.cost) throw new Error('bundle '+BUNDLES[j]+' missing');
        if(!Array.isArray(B.sources)||B.sources.length<2) throw new Error('bundle '+BUNDLES[j]+' has <2 sources'); }
      return { levers:LEVERS.length, bundles:BUNDLES.length }; });

    step('rtmRealismExpanderHTML(historian, hardee levers): bundle framing + all 8 lever titles + Sources block', function(){
      var h=rtmRealismExpanderHTML({ realism:'historian', attrition:1.3, canister:1.3, supply:0.72, cmdShock:1.4, sight:0.88, veteran:1.2, aiSkill:1.12, fog:'on' });
      if(h.indexOf('id="rtmTeach"')<0) throw new Error('no #rtmTeach root');
      if(h.indexOf(rtmBundleTeach('historian').title)<0) throw new Error('historian bundle title missing');
      for (var i=0;i<LEVERS.length;i++){ var L=rtmLeverTeach(LEVERS[i]); if(h.indexOf(L.title)<0) throw new Error('lever title missing from expander: '+LEVERS[i]); }
      if(h.toLowerCase().indexOf('sources')<0) throw new Error('no Sources block'); return { len:h.length }; });

    step('CONTEXTUAL chip: rtmSettingLabel maps the passed value to its FLDP label (1.3->Heavy, 0.7->Light, on->On)', function(){
      if(rtmSettingLabel('attrition',1.3)!=='Heavy') throw new Error('attrition 1.3 != Heavy: '+rtmSettingLabel('attrition',1.3));
      if(rtmSettingLabel('attrition',0.7)!=='Light') throw new Error('attrition 0.7 != Light: '+rtmSettingLabel('attrition',0.7));
      if(rtmSettingLabel('fog','on')!=='On') throw new Error('fog on != On: '+rtmSettingLabel('fog','on'));
      // the chip must appear in the expander reflecting the CURRENT setting
      var heavy=rtmRealismExpanderHTML({ realism:'historian', attrition:1.3 });
      var light=rtmRealismExpanderHTML({ realism:'arcade', attrition:0.7 });
      if(heavy.indexOf('YOURS: HEAVY')<0) throw new Error('expander missing the Heavy chip for attrition 1.3');
      if(light.indexOf('YOURS: LIGHT')<0) throw new Error('expander missing the Light chip for attrition 0.7');
      // an UNKNOWN/absent value -> no chip (no false "YOURS")
      if(rtmSettingLabel('attrition',2.7)!=='') throw new Error('unknown value should yield empty label');
      return { ok:true }; });

    step('ANTI-LOST-CAUSE: Historian names slavery/Union cost; Arcade names itself a scaffold, NOT the real war', function(){
      var hist=rtmBundleTeach('historian').cost.toLowerCase();
      if(hist.indexOf('slavery')<0) throw new Error('Historian framing must name slavery as what the cost was borne to destroy');
      var arc=rtmBundleTeach('arcade').cost.toLowerCase();
      if(!/scaffold|not a depiction|not the war|drill field/.test(arc)) throw new Error('Arcade framing must mark itself a teaching scaffold, not the real war');
      return { ok:true }; });

    step('rtmHubReadout: a teaching line for a valid bundle; "" for null / unknown realism (robust)', function(){
      var ro=rtmHubReadout({ realism:'historian' });
      if(!ro || ro.indexOf(rtmBundleTeach('historian').title)<0) throw new Error('hub readout missing historian title');
      if(rtmHubReadout(null)!=='') throw new Error('null cfg should yield ""');
      if(rtmHubReadout({ realism:'__nope__' })!=='') throw new Error('unknown realism should yield ""');
      return { ok:true }; });

    step('ROBUSTNESS: rtmRealismExpanderHTML(null) / unknown realism never throws; returns a string', function(){
      var a=rtmRealismExpanderHTML(null), b=rtmRealismExpanderHTML({ realism:'__nope__' });
      if(typeof a!=='string'||typeof b!=='string') throw new Error('expander did not return a string for null/unknown');
      // a null/unknown bundle still renders the lever cards (the dials exist regardless of bundle)
      if(a.indexOf(rtmLeverTeach('attrition').title)<0) throw new Error('lever cards should render even with no bundle');
      return { ok:true }; });

    step('XSS-safety: rendered teaching HTML contains no <script', function(){
      var h=rtmRealismExpanderHTML({ realism:'historian', attrition:1.3 })+rtmHubReadout({ realism:'balanced' });
      if(/<script/i.test(h)) throw new Error('teaching HTML contains a <script tag'); return { ok:true }; });

    step('T6 PICKER integration: fldPresetMenu exposes #pvTeach; it toggles #rtmTeach (open/close)', function(){
      if(typeof fldPresetMenu!=='function') throw new Error('fldPresetMenu missing');
      G.campaign=null; G.mode='menu';
      fldPresetMenu('menu');
      var btn=document.getElementById('pvTeach');
      if(!btn) throw new Error('no #pvTeach button in the picker');
      if(btn.getAttribute('aria-expanded')!=='false') throw new Error('pvTeach should start collapsed');
      if(document.getElementById('rtmTeach')) throw new Error('#rtmTeach present before opening');
      // bug-hunt I5-1 (D124 follow-up): while collapsed, #rtmTeach is NOT in the DOM, so #pvTeach must
      // NOT advertise aria-controls=rtmTeach (a dangling IDREF — WCAG 4.1.2/1.3.1). It may only carry it
      // once the target exists (open state). aria-expanded carries collapsed/expanded in both states.
      if(btn.getAttribute('aria-controls')) throw new Error('pvTeach has a dangling aria-controls while collapsed (#rtmTeach absent)');
      btn.click();
      if(!document.getElementById('rtmTeach')) throw new Error('#rtmTeach not shown after click');
      var btn2=document.getElementById('pvTeach');
      if(!btn2||btn2.getAttribute('aria-expanded')!=='true') throw new Error('pvTeach aria-expanded not true after open');
      if(btn2.getAttribute('aria-controls')!=='rtmTeach') throw new Error('pvTeach must carry aria-controls=rtmTeach once #rtmTeach is in the DOM (open)');
      btn2.click();
      if(document.getElementById('rtmTeach')) throw new Error('#rtmTeach not hidden after second click');
      var btn3=document.getElementById('pvTeach');
      if(btn3&&btn3.getAttribute('aria-controls')) throw new Error('pvTeach aria-controls should be dropped again after re-collapse');
      return { ok:true }; });

    step('PURITY (spy): render never calls Math.random nor writes G/combat knob/localStorage', function(){
      var origRand=Math.random, origSet=window.localStorage.setItem, randCalls=0, lsWrites=0;
      var snap={ tacticalPreset:G.settings.tacticalPreset, tacticalFog:G.settings.tacticalFog, tacticalAutoPause:G.settings.tacticalAutoPause, playStyle:G.settings.playStyle };
      try {
        Math.random=function(){ randCalls++; return 0.5; };
        window.localStorage.setItem=function(){ lsWrites++; return origSet.apply(this, arguments); };
        rtmRealismExpanderHTML({ realism:'historian', attrition:1.3, canister:1.3, supply:0.72, cmdShock:1.4, sight:0.88, veteran:1.2, aiSkill:1.12, fog:'on' });
        rtmHubReadout({ realism:'balanced' });
        rtmLeverTeach('attrition'); rtmBundleTeach('historian'); rtmSettingLabel('canister',1.3);
      } finally { Math.random=origRand; window.localStorage.setItem=origSet; }
      if(randCalls) throw new Error('teaching render called Math.random '+randCalls+'x');
      if(lsWrites) throw new Error('teaching render wrote localStorage '+lsWrites+'x');
      if(G.settings.tacticalPreset!==snap.tacticalPreset || G.settings.tacticalFog!==snap.tacticalFog ||
         G.settings.tacticalAutoPause!==snap.tacticalAutoPause || G.settings.playStyle!==snap.playStyle)
        throw new Error('teaching render mutated a settings knob'); return { clean:true }; });

    step('NO THUMB ON THE SCALE: the combat-config producers are unperturbed (neutral byte-exact; historian severities intact)', function(){
      if(typeof fldPresetNeutral!=='function'||typeof fldPresetCompute!=='function') throw new Error('preset producers missing');
      var n=fldPresetNeutral();
      if(!(n.attrition===1&&n.canister===1&&n.supply===1&&n.cmdShock===1&&n.sight===1&&n.veteran===1&&n.aiSkill===1&&n.aiResolve===1&&n.aiCushion===0))
        throw new Error('neutral config no longer byte-identity (the teaching layer perturbed it)');
      var hh=fldPresetCompute('hardee','historian',null);
      if(Math.abs(hh.attrition-1.3)>1e-9||Math.abs(hh.canister-1.3)>1e-9||Math.abs(hh.aiSkill-1.12)>1e-9||Math.abs(hh.aiResolve-1)>1e-9)
        throw new Error('historian x hardee config changed (combat path perturbed): '+JSON.stringify(hh));
      return { neutralOk:true, historianOk:true }; });

  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<60;i++){ if(await up(probe))break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'load', timeout:60000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    result.staticScan = staticRtmLeakScan();
    if (result.staticScan.leaks.length) { result.ok = false; result.steps.push({ name:'STATIC SCAN: no combat-execution file references the teaching API', ok:false, err:'rtm referenced by: '+result.staticScan.leaks.join(', ') }); }
    else { result.steps.push({ name:'STATIC SCAN: no combat-execution file references the teaching API', ok:true, v:{ scanned: result.staticScan.scanned } }); }
    result.t6Clean = t6CombatPathClean();
    if (result.t6Clean.dirty && result.t6Clean.dirty.length) { result.ok = false; result.steps.push({ name:'T6 COMBAT-READ FUNCTIONS clean of the teaching hook', ok:false, err:'rtm leaked into: '+result.t6Clean.dirty.join(', ') }); }
    else { result.steps.push({ name:'T6 COMBAT-READ FUNCTIONS clean of the teaching hook', ok:true, v:{ checked: result.t6Clean.checked } }); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-realism-teaching.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-realism-teaching ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
