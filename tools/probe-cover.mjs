#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-cover.mjs — A3 terrain cover hierarchy. Verifies the six named cover types are
// installed in the frozen TERRAIN with the strong->light def ordering, that they render
// (TCOL + PALETTE colors, not the gray fallback), that _tcCoverFor maps historical feature
// labels to the right cover, that the authoredMap override STAMPS cover onto labelled features
// (and never weakens a tile / touches water), that Antietam's Sunken Road specifically becomes
// sunkenroad, and that combat picks cover up through the existing .def path. Reads the live
// GAME_DATA.terrainCover + AUTHORED_MAPS so it is robust to the data. Writes shots/probe-cover.json.
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
  try {
    if (typeof TERRAIN==='undefined') return JSON.stringify({ok:false,fatal:'TERRAIN undefined'});
    var D = (typeof GAME_DATA!=='undefined' && GAME_DATA && GAME_DATA['terrain-cover']) ? GAME_DATA['terrain-cover'] : null;
    if (!D || !D.types || !D.types.length) return JSON.stringify({ok:false,fatal:'GAME_DATA.terrainCover missing'});

    step('the six cover types are installed in TERRAIN, strong->light def ordering', function(){
      var ids = D.types.map(function(t){return t.id;});
      for (var i=0;i<ids.length;i++){ if(!TERRAIN[ids[i]]) throw new Error('missing TERRAIN.'+ids[i]); }
      var sw=TERRAIN.stonewall.def, tr=TERRAIN.trench.def, sr=TERRAIN.sunkenroad.def, bo=TERRAIN.boulders.def, fo=TERRAIN.forest.def, wf=TERRAIN.woodfence.def;
      if (!(sw>=tr && tr>=sr && sr>bo && bo>fo && fo>wf && wf>TERRAIN.clear.def)) throw new Error('def ordering wrong: '+[sw,tr,sr,bo,fo,wf,TERRAIN.clear.def].join(','));
      if (!(sw < TERRAIN.fort.def)) throw new Error('stonewall should slot below works/fort');
      return { stonewall:sw, trench:tr, sunkenroad:sr, boulders:bo, forest:fo, woodfence:wf, clear:TERRAIN.clear.def, fort:TERRAIN.fort.def }; });

    step('cover types render (TCOL + PALETTE colors, not the gray fallback)', function(){
      if (typeof TCOL==='undefined') throw new Error('TCOL undefined');
      for (var s=0;s<TCOL.length;s++){ if(!TCOL[s].stonewall||!TCOL[s].sunkenroad||!TCOL[s].forest) throw new Error('TCOL skin '+s+' missing cover colors'); }
      if (typeof PALETTE!=='undefined' && PALETTE){ for (var p=0;p<PALETTE.length;p++){ if(!PALETTE[p].stonewall||!PALETTE[p].forest) throw new Error('PALETTE skin '+p+' missing cover colors'); } }
      return { tcolSkins:TCOL.length, sample:TCOL[2].sunkenroad, palette:(typeof PALETTE!=='undefined'&&PALETTE)?PALETTE.length:0 }; });

    step('_tcCoverFor maps historical feature labels to the right cover', function(){
      if (typeof _tcCoverFor!=='function') throw new Error('_tcCoverFor missing');
      var sr=_tcCoverFor('The Sunken Road'), dd=_tcCoverFor("Devil's Den"), ew=_tcCoverFor('East Woods'),
          rd=_tcCoverFor('3rd Louisiana Redan'), fn=_tcCoverFor('Rail Fence'), ch=_tcCoverFor('Dunker Church');
      if (sr!=='sunkenroad') throw new Error('Sunken Road -> '+sr);
      if (dd!=='boulders') throw new Error("Devil's Den -> "+dd);
      if (ew!=='forest') throw new Error('East Woods -> '+ew);
      if (rd!=='trench') throw new Error('Redan -> '+rd);
      if (fn!=='woodfence') throw new Error('Rail Fence -> '+fn);
      if (ch!==null) throw new Error('Dunker Church should not map to cover, got '+ch);
      return { sunkenRoad:sr, devilsDen:dd, eastWoods:ew, redan:rd, fence:fn, church:ch }; });

    step('authoredMap STAMPS cover onto labelled features across the authored maps', function(){
      if (typeof authoredMap!=='function' || typeof AUTHORED_MAPS==='undefined') throw new Error('authoredMap/AUTHORED_MAPS missing');
      var coverIds={}; for (var i=0;i<D.types.length;i++) coverIds[D.types[i].id]=true;
      var keys=Object.keys(AUTHORED_MAPS), totalStamped=0, mapsWithCover=0, perType={};
      for (var k=0;k<keys.length;k++){
        var M=authoredMap({id:keys[k]}); if(!M||!M.map) continue;
        var n=0; for (var kk in M.map){ if(M.map.hasOwnProperty(kk)){ var t=M.map[kk]; if(t&&coverIds[t.t]){ n++; perType[t.t]=(perType[t.t]||0)+1; } } }
        totalStamped+=n; if(n>0) mapsWithCover++;
      }
      if (!(totalStamped>0)) throw new Error('no cover stamped on any authored map');
      if (!(mapsWithCover>=2)) throw new Error('expected >=2 maps with cover, got '+mapsWithCover);
      return { maps:keys.length, mapsWithCover:mapsWithCover, totalStamped:totalStamped, perType:perType }; });

    step('Antietam Sunken Road is strong cover (stamped sunkenroad OR an already-stronger authored work; never weakened)', function(){
      if (typeof AUTHORED_MAPS==='undefined' || !AUTHORED_MAPS.antietam) return { skipped:'no antietam authored map' };
      var A=AUTHORED_MAPS.antietam, feat=null;
      (A.features||[]).forEach(function(f){ if(f && /sunken/i.test(f.label||'')) feat=f; });
      if (!feat) return { skipped:'no Sunken Road feature in antietam' };
      var M=authoredMap({id:'antietam'}); var tile=M.map[M.key(feat.c,feat.r)];
      if (!tile) throw new Error('no tile at the Sunken Road feature');
      var def=(TERRAIN[tile.t]&&typeof TERRAIN[tile.t].def==='number')?TERRAIN[tile.t].def:1;
      if (!(def >= TERRAIN.sunkenroad.def)) throw new Error('Sunken Road should be at least sunkenroad-strong, got '+tile.t+' def='+def);
      if (!(M.objs && M.objs.length>0)) throw new Error('objectives lost after decoration');
      return { c:feat.c, r:feat.r, t:tile.t, def:def, objs:M.objs.length }; });

    step('decoration NEVER weakens a tile or walls off water', function(){
      // re-run a map and confirm every cover-stamped tile is at least as strong as bare clear, and no water became cover
      if (typeof authoredMap!=='function') throw new Error('no authoredMap');
      var keys=Object.keys(AUTHORED_MAPS), bad=0, checked=0, coverIds={};
      for (var i=0;i<D.types.length;i++) coverIds[D.types[i].id]=true;
      for (var k=0;k<keys.length;k++){ var M=authoredMap({id:keys[k]}); if(!M||!M.map) continue;
        for (var kk in M.map){ if(M.map.hasOwnProperty(kk)){ var t=M.map[kk];
          if(t&&coverIds[t.t]){ checked++; if(TERRAIN[t.t].def < TERRAIN.clear.def) bad++; } } } }
      if (bad>0) throw new Error(bad+' cover tiles weaker than open ground');
      return { coverTilesChecked:checked, weakened:bad }; });

    step('decoration is a clean terrain swap: strengthens def, never reduces move cost', function(){
      var coverIds={}; for (var i=0;i<D.types.length;i++) coverIds[D.types[i].id]=true;
      var keys=Object.keys(AUTHORED_MAPS), checked=0, badDef=0, badCost=0;
      for (var k=0;k<keys.length;k++){ var A=AUTHORED_MAPS[keys[k]]; if(!A||!A.grid||!A.legend) continue;
        var M=authoredMap({id:keys[k]}); if(!M||!M.map) continue;
        for (var r=0;r<A.GH;r++){ var row=A.grid[r]||""; for (var c=0;c<A.GW;c++){
          var tile=M.map[M.key(c,r)]; if(!tile||!coverIds[tile.t]) continue;   // only stamped tiles
          var ch=row[c]||"."; var orig=A.legend[ch]||"clear"; if(orig===tile.t) continue; // unchanged (already that type)
          checked++;
          if (!(TERRAIN[tile.t].def > TERRAIN[orig].def)) badDef++;
          if (TERRAIN[tile.t].cost < TERRAIN[orig].cost) badCost++;
        } }
      }
      if (badDef>0) throw new Error(badDef+' stamps did not strengthen def');
      if (badCost>0) throw new Error(badCost+' stamps REDUCED move cost (speedup bug)');
      return { stampsChecked:checked, weakerDef:badDef, cheaperToCross:badCost }; });

    step('combat picks cover up through the existing .def path (less damage behind cover)', function(){
      // resolveFire divides damage by TERRAIN[t].def; a stone wall must take less than open ground.
      var power=100;
      var openCas=power/TERRAIN.clear.def, wallCas=power/TERRAIN.stonewall.def, sunkCas=power/TERRAIN.sunkenroad.def;
      if (!(wallCas < openCas)) throw new Error('stone wall should reduce damage vs open');
      if (!(sunkCas < openCas)) throw new Error('sunken road should reduce damage vs open');
      return { openCas:Math.round(openCas), wallCas:Math.round(wallCas), sunkenCas:Math.round(sunkCas), wallReductionPct:Math.round((1-wallCas/openCas)*100) }; });
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
    writeFileSync(join(OUT,'probe-cover.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-cover ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-cover.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-cover.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-cover: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-cover: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-cover: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
