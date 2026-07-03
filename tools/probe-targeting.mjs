#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-targeting.mjs — A5 verify the player can pick SPECIFIC fire targets. The engine
// already supports full player target choice (onHexClick line ~1273 fires at the exact clicked
// hex when in fire mode), so this is a VERIFICATION probe (no engine change). It boots a real
// battle, disables fog (B.vis=null), places two enemies in a player unit's weapon range, and
// confirms: fireTargets() returns BOTH (multi-target choice), entering fire mode highlights them
// (G.fireT populated), clicking ONE specific enemy damages THAT enemy and not the other (player
// choice, not auto-target), and the firing unit is marked fired. Writes shots/probe-targeting.json.
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
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function key(c,r){ return c+","+r; }
  try {
    if (typeof startBattleRuntime!=='function' || typeof BATTLES==='undefined') return JSON.stringify({ok:false,fatal:'engine missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic';
    var bd=BATTLES.find(function(b){return b.id==='antietam';})||BATTLES[0];
    startBattleRuntime(bd,'US',false);
    var B=G.battle; if(!B) return JSON.stringify({ok:false,fatal:'no battle'});
    B.vis=null;   // disable fog so every hex isVisible -> deterministic targeting test

    step('the engine exposes player targeting (fireTargets/resolveFire/onHexClick) + fire-at-clicked-hex path', function(){
      if (typeof fireTargets!=='function') throw new Error('fireTargets missing');
      if (typeof resolveFire!=='function') throw new Error('resolveFire missing');
      if (typeof onHexClick!=='function') throw new Error('onHexClick missing');
      // the player-fire branch must fire at the CLICKED hex (not an auto/best pick)
      var src=onHexClick.toString().replace(/\\s+/g,' ');
      if (src.indexOf('resolveFire(sel,c,r)')<0 && !/resolveFire\\(\\s*sel\\s*,\\s*c\\s*,\\s*r\\s*\\)/.test(src)) throw new Error('onHexClick does not fire at the clicked hex (sel,c,r)');
      // and the player path must NOT route through the AI auto-target chooser
      if (src.indexOf('chooseBestFireTarget')>=0) throw new Error('player fire path uses the AI auto-target chooser');
      return { hasFireAtClicked:true }; });

    // set up a controlled firing scenario: one player infantry, two enemies in range
    var sel=null; for(var i=0;i<B.units.length;i++){ var u=B.units[i]; if(u.alive && u.side===B.playerSide && u.type==='inf' && !u.leader){ sel=u; break; } }
    if(!sel) return JSON.stringify({ok:false,fatal:'no player infantry'});
    sel.weapon='spring'; sel.ammo=10; sel.fired=false; sel.done=false; sel.moved=false;
    var es=[]; for(var j=0;j<B.units.length;j++){ if(B.units[j].alive && B.units[j].side===B.enemySide) es.push(B.units[j]); }
    if(es.length<2) return JSON.stringify({ok:false,fatal:'need 2 enemies'});
    var e1=es[0], e2=es[1];
    e1.c=sel.c+1; e1.r=sel.r; e1.spotted=true; e1.routed=false;
    e2.c=sel.c-1; e2.r=sel.r; e2.spotted=true; e2.routed=false;
    // park the rest far away so they don't enter range
    for(var k=2;k<es.length;k++){ es[k].c=0; es[k].r=0; }

    step('fireTargets returns BOTH in-range enemies (player has a real CHOICE)', function(){
      var ft=fireTargets(sel);
      if (!ft || typeof ft.has!=='function') throw new Error('fireTargets did not return a Set');
      if (!ft.has(key(e1.c,e1.r))) throw new Error('e1 not a valid target');
      if (!ft.has(key(e2.c,e2.r))) throw new Error('e2 not a valid target');
      return { targets:ft.size, hasE1:true, hasE2:true, weaponRng:WEAPONS[sel.weapon].rng }; });

    step('entering FIRE mode highlights the valid targets (G.fireT populated)', function(){
      setSel(sel); setOrder('fire');
      if (!G.fireT || !G.fireT.has(key(e2.c,e2.r))) throw new Error('fire mode did not populate G.fireT with the targets');
      return { fireTSize:G.fireT.size, order:G.order }; });

    step('clicking a SPECIFIC enemy damages THAT enemy, not the other (player choice, not auto-target)', function(){
      setSel(sel); setOrder('fire');
      var e1Before=e1.strength, e2Before=e2.strength;
      onHexClick(e2.c, e2.r);   // player clicks e2 specifically
      if (!(e2.strength < e2Before)) throw new Error('clicked target e2 took no damage: '+e2Before+'->'+e2.strength);
      if (e1.strength !== e1Before) throw new Error('the OTHER enemy e1 was hit (auto-target leak): '+e1Before+'->'+e1.strength);
      if (!sel.fired) throw new Error('firing unit not marked fired after firing');
      return { e2Before:e2Before, e2After:e2.strength, e2Cas:e2Before-e2.strength, e1Unchanged:(e1.strength===e1Before), selFired:sel.fired }; });

    step('a unit that has already fired offers NO targets (ammo/turn discipline holds)', function(){
      // sel just fired above; fireTargets must now be empty (guards on u.fired)
      var ft=fireTargets(sel);
      if (ft && ft.size>0) throw new Error('a unit that already fired should have no targets, got '+ft.size);
      return { targetsAfterFiring:ft?ft.size:0 }; });
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
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-targeting.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-targeting ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-targeting.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-targeting.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-targeting: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-targeting: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-targeting: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
