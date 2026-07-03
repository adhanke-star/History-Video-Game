#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-playstyle.mjs — E2-i4 (D123) PLAY-STYLE PRESETS + the Historian settings layer.
// Verifies: the module loads; psRenderTab renders the 3 play-style cards + the
// Historian teaching rows (alt-history emergent-only toggle, the battlefield read-out,
// display hand-off); psWireTab wires without throwing; clicking a play-style card sets
// G.settings.playStyle + aria-pressed; psDefaultDeskTab resolves correctly for each
// style (and falls back to "economy" when unset / invalid -> byte-identical); the
// emergent-only toggle flips the flag; openWarDept lands the desk on the style's tab;
// the shell dispatch routes _wdTab=playstyle; persistence writes/reads the localStorage
// bundle (defaults-only on boot); PURITY — render/wire never call Math.random nor write
// ANY combat-path knob (tacticalPreset / tacticalFog / tacticalAutoPause); and a STATIC
// SCAN proving no tactical/combat/bridge/resolve file references the ps-family symbols.
// Writes shots/probe-playstyle.json.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// PS-01 (bug-hunt): lock the byte-identical-combat claim STRUCTURALLY — no tactical/
// combat/bridge/resolve file may reference the play-style API or the playStyle flag.
// If this ever trips, play-style stopped being a pure strategic-settings layer.
function staticPlayStyleLeakScan() {
  const PS_RE = /psRenderTab|psWireTab|psOpenMenu|psDefaultDeskTab|psGet|psSetStyle|psBootLoad|playStyle/;
  const files = [];
  try { const TACT = join(ROOT, 'src', 'tactical'); for (const f of readdirSync(TACT)) if (f.endsWith('.js')) files.push(join(TACT, f)); } catch (e) {}
  for (const f of ['85-battle-bridge.js', '86-battle-conditioning.js', '87-auto-resolve.js', '80-victory.js']) files.push(join(ROOT, 'src', f));
  const leaks = [];
  for (const f of files) { try { if (PS_RE.test(readFileSync(f, 'utf8'))) leaks.push(f.split('/').pop()); } catch (e) {} }
  return { scanned: files.length, leaks };
}
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mount(html){ var w=document.getElementById('wdContent'); if(w){ w.parentNode.removeChild(w); } w=document.createElement('div'); w.id='wdContent'; w.innerHTML=html; document.body.appendChild(w); return w; }
  function mkC(){ var C={ side:'US', iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; if(typeof _t1InitAll==='function') _t1InitAll(C); return C; }
  try {
    if (typeof psRenderTab!=='function' || typeof psWireTab!=='function' || typeof psOpenMenu!=='function' ||
        typeof psDefaultDeskTab!=='function' || typeof psGet!=='function' || typeof psBootLoad!=='function')
      return JSON.stringify({ok:false,fatal:'playstyle module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';
    var _savedStyle = G.settings.playStyle, _savedEm = G.settings.altHistoryEmergentOnly;

    step('psRenderTab (desk) renders 3 play-style cards + the Historian teaching rows', function(){
      delete G.settings.playStyle;
      var html=psRenderTab(null);
      mount(html);
      var cards=document.querySelectorAll('[data-ps-style]');
      if(cards.length!==3) throw new Error('expected 3 play-style cards, got '+cards.length);
      var keys={}; for(var i=0;i<cards.length;i++) keys[cards[i].getAttribute('data-ps-style')]=1;
      if(!keys.president||!keys.commander||!keys.free) throw new Error('missing a play-style card (need president/commander/free)');
      if(!document.getElementById('psEmergent')) throw new Error('no emergent-only toggle row');
      if(html.indexOf('The battlefield')<0) throw new Error('no battlefield read-out row');
      if(html.indexOf('Display, motion')<0) throw new Error('no display row');
      // desk context: the hand-offs are READ-ONLY hints (no live buttons)
      if(document.getElementById('psBattlefield')) throw new Error('desk context must NOT expose a live battlefield button');
      if(document.getElementById('psDisplay')) throw new Error('desk context must NOT expose a live display button');
      return { cards:cards.length }; });

    step('default selection = Free when unset; aria-pressed marks exactly one card', function(){
      delete G.settings.playStyle;
      mount(psRenderTab(null));
      var cards=document.querySelectorAll('[data-ps-style]'), pressed=[];
      for(var i=0;i<cards.length;i++){ if(cards[i].getAttribute('aria-pressed')==='true') pressed.push(cards[i].getAttribute('data-ps-style')); }
      if(pressed.length!==1) throw new Error('expected exactly one pressed card, got '+pressed.length);
      if(pressed[0]!=='free') throw new Error('unset default should be free, got '+pressed[0]);
      return { pressed:pressed[0] }; });

    step('psWireTab wires + clicking a card sets G.settings.playStyle + aria-pressed (no throw)', function(){
      delete G.settings.playStyle;
      mount(psRenderTab(null));
      var threw=false; try{ psWireTab(null); }catch(e){ threw=true; R.errors.push('wire:'+String(e&&e.message||e)); }
      if(threw) throw new Error('psWireTab threw');
      // NOTE: the desk-context card click calls _wdRefresh (re-render); guard for a present #wdContent.
      var card=document.querySelector('[data-ps-style="commander"]');
      card.click();
      if(G.settings.playStyle!=='commander') throw new Error('card click did not set playStyle=commander (got '+G.settings.playStyle+')');
      return { set:G.settings.playStyle }; });

    step('psDefaultDeskTab: unset->economy; commander->command; president->economy; invalid->economy', function(){
      delete G.settings.playStyle;
      if(psDefaultDeskTab()!=='economy') throw new Error('unset default not economy: '+psDefaultDeskTab());
      G.settings.playStyle='commander'; if(psDefaultDeskTab()!=='command') throw new Error('commander not command: '+psDefaultDeskTab());
      G.settings.playStyle='president'; if(psDefaultDeskTab()!=='economy') throw new Error('president not economy: '+psDefaultDeskTab());
      G.settings.playStyle='free'; if(psDefaultDeskTab()!=='economy') throw new Error('free not economy: '+psDefaultDeskTab());
      G.settings.playStyle='__bogus__'; if(psDefaultDeskTab()!=='economy') throw new Error('invalid style not economy fallback: '+psDefaultDeskTab());
      delete G.settings.playStyle;
      return { ok:true }; });

    step('emergent-only toggle flips the flag + re-renders (the real desk path: campaign present)', function(){
      // the desk play-style tab is only ever reached WITH a campaign, so the desk-context
      // re-render (_wdRefresh) needs one — render via the actual shell dispatch path.
      mkC(); G.settings.altHistoryEmergentOnly=false;
      var w=document.getElementById('wdContent'); if(!w){ w=document.createElement('div'); w.id='wdContent'; document.body.appendChild(w); }
      _wdTab='playstyle'; _wdRefresh();
      var btn=document.getElementById('psEmergent');
      if(!btn) throw new Error('no emergent toggle after dispatch render');
      if(btn.getAttribute('aria-pressed')!=='false') throw new Error('toggle should start Off');
      btn.click();
      if(G.settings.altHistoryEmergentOnly!==true) throw new Error('toggle did not set emergent-only true');
      var btn2=document.getElementById('psEmergent');   // a fresh node after _wdRefresh re-rendered the tab
      if(!btn2||btn2.getAttribute('aria-pressed')!=='true') throw new Error('toggle aria-pressed not true after the re-render');
      G.settings.altHistoryEmergentOnly=false;
      return { ok:true }; });

    step('openWarDept lands the desk on the play-style tab (commander->command, president->economy)', function(){
      var C=mkC();
      G.settings.playStyle='commander';
      try{ openWarDept(); }catch(e){ R.errors.push('openWarDept:'+String(e&&e.message||e)); }
      if(typeof _wdTab==='undefined') throw new Error('_wdTab undefined after openWarDept');
      if(_wdTab!=='command') throw new Error('commander did not land on command tab (got '+_wdTab+')');
      G.settings.playStyle='president';
      try{ openWarDept(); }catch(e2){ R.errors.push('openWarDept2:'+String(e2&&e2.message||e2)); }
      if(_wdTab!=='economy') throw new Error('president did not land on economy tab (got '+_wdTab+')');
      delete G.settings.playStyle;
      return { ok:true }; });

    step('SHELL dispatch: _wdTab=playstyle renders the panel; another tab does not (lockstep arrays)', function(){
      if(typeof _wdRefresh!=='function') throw new Error('_wdRefresh missing');
      mkC();
      var w=document.getElementById('wdContent'); if(!w){ w=document.createElement('div'); w.id='wdContent'; document.body.appendChild(w); }
      _wdTab='playstyle'; _wdRefresh();
      if(w.innerHTML.indexOf('data-ps-style')<0) throw new Error('_wdRefresh did not render playstyle for _wdTab=playstyle');
      _wdTab='decisions'; _wdRefresh();
      if(w.innerHTML.indexOf('data-ps-style')>=0) throw new Error('playstyle markup leaked into the decisions tab');
      return { dispatched:true }; });

    step('psOpenMenu (menu ctx) opens the overlay with the LIVE hand-off buttons', function(){
      G.campaign=null; G.mode='menu';
      psOpenMenu();
      if(!document.querySelector('[data-ps-style]')) throw new Error('menu overlay has no play-style cards');
      if(!document.getElementById('psBattlefield')) throw new Error('menu ctx must expose the live battlefield button');
      if(!document.getElementById('psDisplay')) throw new Error('menu ctx must expose the live display button');
      if(!document.getElementById('psBack')) throw new Error('menu ctx must expose a Back button');
      return { ok:true }; });

    step('PURITY (spy): render/wire never call Math.random nor write a combat-path knob', function(){
      var origRand=Math.random, origSet=window.localStorage.setItem, badWrites=[], randCalls=0;
      // intercept the combat knobs via a watched G.settings
      var snap={ tacticalPreset:G.settings.tacticalPreset, tacticalFog:G.settings.tacticalFog, tacticalAutoPause:G.settings.tacticalAutoPause };
      try {
        Math.random=function(){ randCalls++; return 0.5; };
        delete G.settings.playStyle;
        mount(psRenderTab(null)); psWireTab(null);
        psRenderTab(null); psDefaultDeskTab(); psGet();
      } finally { Math.random=origRand; window.localStorage.setItem=origSet; }
      if(randCalls) throw new Error('playstyle render/wire called Math.random '+randCalls+'x');
      if(G.settings.tacticalPreset!==snap.tacticalPreset || G.settings.tacticalFog!==snap.tacticalFog || G.settings.tacticalAutoPause!==snap.tacticalAutoPause)
        throw new Error('playstyle render/wire wrote a combat-path knob');
      return { clean:true }; });

    step('PERSISTENCE: psSetStyle writes the localStorage bundle; psBootLoad seeds DEFAULTS-ONLY', function(){
      if(typeof psSetStyle!=='function') throw new Error('psSetStyle missing');
      psSetStyle('president');
      var raw=window.localStorage.getItem('cw_playstyle'); if(!raw) throw new Error('no cw_playstyle bundle written');
      var b=JSON.parse(raw); if(b.playStyle!=='president') throw new Error('bundle playStyle not president: '+b.playStyle);
      // boot must NOT override an existing in-memory value
      G.settings.playStyle='commander';
      psBootLoad();
      if(G.settings.playStyle!=='commander') throw new Error('psBootLoad overrode an existing value');
      // boot SHOULD seed when absent
      delete G.settings.playStyle;
      psBootLoad();
      if(G.settings.playStyle!=='president') throw new Error('psBootLoad did not seed from the bundle (got '+G.settings.playStyle+')');
      return { ok:true }; });

    step('A11Y: cards carry aria-pressed; the group is labelled; toggle is a real button', function(){
      delete G.settings.playStyle;
      mount(psRenderTab(null));
      var cards=document.querySelectorAll('[data-ps-style]');
      for(var i=0;i<cards.length;i++){ if(cards[i].tagName!=='BUTTON') throw new Error('card not a <button>'); if(cards[i].getAttribute('aria-pressed')==null) throw new Error('card missing aria-pressed'); }
      if(!document.querySelector('[role="group"][aria-label]')) throw new Error('no labelled play-style group');
      var em=document.getElementById('psEmergent'); if(em.tagName!=='BUTTON'||em.getAttribute('aria-pressed')==null) throw new Error('emergent toggle not an aria-pressed button');
      return { ok:true }; });

    step('A11Y NAMES (bug-hunt): emergent toggle + menu hand-off buttons carry a descriptive accessible name', function(){
      // desk ctx: the On/Off toggle must NOT have "On"/"Off" as its whole accessible name (WCAG 4.1.2)
      delete G.settings.playStyle;
      mount(psRenderTab(null));
      var em=document.getElementById('psEmergent'), al=String(em.getAttribute('aria-label')||'');
      if(!/emergent/i.test(al)) throw new Error('psEmergent aria-label missing/weak: "'+al+'"');
      // menu ctx: the hand-off buttons must describe their purpose (their visible text is just "Adjust…"/"Open…")
      G.campaign=null; G.mode='menu'; psOpenMenu();
      var bf=document.getElementById('psBattlefield'), dp=document.getElementById('psDisplay');
      if(!bf||!/battlefield/i.test(String(bf.getAttribute('aria-label')||''))) throw new Error('psBattlefield aria-label weak/missing');
      if(!dp||!/display|sound|motion/i.test(String(dp.getAttribute('aria-label')||''))) throw new Error('psDisplay aria-label weak/missing');
      return { ok:true }; });

    step('MENU BUTTON (bug-hunt): psInjectMenuButton injects once, dedupes, and RE-INJECTS after a menu rebuild (no latch)', function(){
      if(typeof psInjectMenuButton!=='function') throw new Error('psInjectMenuButton missing');
      // ensure a main-menu classifieds column exists in this headless DOM (synthesize if absent)
      var synth=null;
      if(!document.querySelector('.gn-col:last-child .gn-classifieds')){
        synth=document.createElement('div'); synth.innerHTML='<div class="gn-col"><div class="gn-classifieds"></div></div>'; document.body.appendChild(synth);
      }
      var ex=document.getElementById('gnPlayStyle'); if(ex&&ex.parentNode) ex.parentNode.removeChild(ex);
      psInjectMenuButton();
      if(document.querySelectorAll('[id="gnPlayStyle"]').length!==1) throw new Error('inject did not produce exactly one button');
      psInjectMenuButton();   // dedupe — a second call must NOT add a duplicate
      if(document.querySelectorAll('[id="gnPlayStyle"]').length!==1) throw new Error('second inject duplicated the button (dedupe failed)');
      var b2=document.getElementById('gnPlayStyle'); if(b2&&b2.parentNode) b2.parentNode.removeChild(b2);   // the menu rebuild drops it
      psInjectMenuButton();
      if(document.querySelectorAll('[id="gnPlayStyle"]').length!==1) throw new Error('did not re-inject after removal (the latch regression)');
      var fin=document.getElementById('gnPlayStyle'); if(fin&&fin.parentNode) fin.parentNode.removeChild(fin);
      if(synth&&synth.parentNode) synth.parentNode.removeChild(synth);
      return { ok:true }; });

    // restore the player's real settings
    if(_savedStyle==null) { try{ delete G.settings.playStyle; }catch(e){} } else G.settings.playStyle=_savedStyle;
    if(_savedEm==null) { try{ delete G.settings.altHistoryEmergentOnly; }catch(e){} } else G.settings.altHistoryEmergentOnly=_savedEm;
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
    result.staticScan = staticPlayStyleLeakScan();
    if (result.staticScan.leaks.length) { result.ok = false; result.steps.push({ name:'STATIC SCAN: no combat path references the play-style API', ok:false, err:'ps referenced by: '+result.staticScan.leaks.join(', ') }); }
    else { result.steps.push({ name:'STATIC SCAN: no combat path references the play-style API', ok:true, v:{ scanned: result.staticScan.scanned } }); }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-playstyle.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-playstyle ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-playstyle.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-playstyle.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-playstyle: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-playstyle: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-playstyle: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
