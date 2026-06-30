#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-h2-cutaways.mjs — D170 H2 cutaway/fallback gate.
// Verifies the skippable pre-battle cutaway shell, disabled video slots,
// embedded-still and procedural fallback paths, no runtime web/video dependency,
// and no battle-launch or combat contamination.
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

const moduleText = readFileSync(join(ROOT, 'src', '104-h2-cutaways.js'), 'utf8');
const dataText = readFileSync(join(ROOT, 'data', 'footage-cutaways.json'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v:v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, battleId){
    var idx = (typeof CHAINS!=='undefined' && CHAINS[side]) ? CHAINS[side].indexOf(battleId) : -1;
    if(idx<0) throw new Error('battle not in chain: '+side+' '+battleId);
    var C={ side:side, iron:false, idx:idx, funds:6500, recovery:false, completed:[],
      roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
      recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
    G.campaign=C; _t1InitAll(C); return C;
  }
  function renderBrief(C){
    var launched = { field:0, back:0 };
    openSheet(bridgeBriefingHTML(C));
    bridgeWireBriefing(C, function(){ launched.back++; }, function(){ launched.field++; });
    return launched;
  }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';

    step('data policy: disabled video slots and mandatory offline fallback', function(){
      var D=GAME_DATA && GAME_DATA['footage-cutaways'];
      if(!D || D.schema!=='cw_h2_cutaways_v1') throw new Error('missing cw_h2_cutaways_v1');
      if(!D.policy || D.policy.runtimeWebDependency!==false || D.policy.videoEnabledByDefault!==false || D.policy.fallbackRequired!==true || D.policy.skipRequired!==true) throw new Error('bad policy '+JSON.stringify(D.policy));
      if(!Array.isArray(D.records) || D.records.length<9) throw new Error('expected current battle cutaway records');
      var enabled=[], url=[], under=[];
      D.records.forEach(function(r){
        if(r.video && r.video.enabled===true) enabled.push(r.id);
        if(r.video && (r.video.externalUrl || r.video.sourcePath)) url.push(r.id);
        if(r.provenance==='Verified' && (!Array.isArray(r.sources)||r.sources.length<2)) under.push(r.id);
      });
      if(enabled.length || url.length || under.length) throw new Error(JSON.stringify({enabled:enabled,url:url,under:under}));
      return { records:D.records.length, fallbacks:D.records.map(function(r){return r.fallback;}).filter(function(v,i,a){return a.indexOf(v)===i;}) };
    });

    step('static scan: no video tag, fetch, external URL, or combat/output contamination', function(){
      var src = ${JSON.stringify(moduleText)};
      var data = ${JSON.stringify(dataText)};
      if(/<video|<iframe|fetch\\s*\\(|XMLHttpRequest|https?:\\/\\//i.test(src + data)) throw new Error('runtime video/web dependency token found');
      if(/fldRng|startBattleRuntime|genForce|fldLaunch|\\.victory\\s*=|\\bcas\\s*=|\\.men\\s*=|_SAVE_VER/.test(src)) throw new Error('combat/output/save contamination token found');
      if(/window\\./.test(src)) throw new Error('window.* global used');
      return { clean:true };
    });

    step('briefing wires a skippable cutaway button without launching battle paths', function(){
      var C=mkC('US','antietam');
      var prep0=JSON.stringify(C.battlePrep);
      var launched=renderBrief(C);
      var b=document.getElementById('h2CutawayBtn');
      if(!b) throw new Error('missing h2CutawayBtn');
      if(!document.querySelector('.h0-brief-actions.h2-cutaway-ready')) throw new Error('actions not marked ready');
      b.click();
      var ov=document.querySelector('.h2-cutaway-overlay');
      if(!ov) throw new Error('overlay did not open');
      if(document.querySelector('video') || document.querySelector('iframe')) throw new Error('video/iframe rendered');
      if(!document.querySelector('.h2-has-still')) throw new Error('Antietam should use embedded still fallback');
      if(!/Sunken Road|Disabled pending provenance/.test(ov.textContent||'')) throw new Error('expected cutaway copy missing');
      var card=document.querySelector('.h2-cutaway-card'), frame=document.querySelector('.h2-cutaway-frame');
      if(!card || card.getBoundingClientRect().width<300 || card.getBoundingClientRect().height<260) throw new Error('cutaway card did not lay out visibly');
      if(!frame || frame.getBoundingClientRect().height<180) throw new Error('cutaway visual frame did not lay out visibly');
      if(launched.field!==0 || launched.back!==0) throw new Error('cutaway launched a battle/back path '+JSON.stringify(launched));
      if(JSON.stringify(C.battlePrep)!==prep0) throw new Error('cutaway mutated battlePrep');
      var done=document.getElementById('h2CutawayDone'); if(!done) throw new Error('missing return button');
      done.click();
      if(document.querySelector('.h2-cutaway-overlay')) throw new Error('overlay did not close');
      return { button:true, launched:launched };
    });

    step('imageless battle uses procedural fallback and remains skippable', function(){
      var C=mkC('US','shiloh');
      renderBrief(C);
      var b=document.getElementById('h2CutawayBtn');
      if(!b) throw new Error('missing h2CutawayBtn for Shiloh');
      b.click();
      var ov=document.querySelector('.h2-cutaway-overlay');
      if(!ov) throw new Error('overlay did not open for Shiloh');
      if(!document.querySelector('.h2-has-procedural')) throw new Error('Shiloh should use procedural fallback');
      if(!/procedural map art|No verified moving-image asset/.test(ov.textContent||'')) throw new Error('procedural fallback copy missing');
      var close=document.getElementById('h2CutawayClose'); if(!close) throw new Error('missing skip button');
      close.click();
      if(document.querySelector('.h2-cutaway-overlay')) throw new Error('skip did not close overlay');
      return { fallback:'procedural-map' };
    });

    step('helper lookup exposes current records without enabling media', function(){
      if(typeof h2CutawayRecordForBattle!=='function') throw new Error('lookup helper missing');
      if(typeof h2ShowCutaway!=='function') throw new Error('open helper missing');
      var a=h2CutawayRecordForBattle('antietam'), s=h2CutawayRecordForBattle('shiloh');
      if(!a || a.fallback!=='embedded-scene-still') throw new Error('bad Antietam record');
      if(!s || s.fallback!=='procedural-map') throw new Error('bad Shiloh record');
      if(a.video && a.video.enabled) throw new Error('Antietam video unexpectedly enabled');
      return { antietam:a.id, shiloh:s.id };
    });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<80;i++){ if(await up(probe))break; await sleep(150); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:90000 });
    await sleep(700);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    await page.evaluate(() => {
      var idx=CHAINS.US.indexOf('antietam');
      var C={side:'US',idx:idx,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      G.campaign=C; _t1InitAll(C); openSheet(bridgeBriefingHTML(C)); bridgeWireBriefing(C,function(){},function(){});
      document.getElementById('h2CutawayBtn').click();
    });
    await sleep(300);
    result.artifact = await page.evaluate(() => {
      var ov=document.querySelector('.h2-cutaway-overlay'), card=document.querySelector('.h2-cutaway-card'), frame=document.querySelector('.h2-cutaway-frame');
      function box(el){ if(!el) return null; var r=el.getBoundingClientRect(); return { width:Math.round(r.width), height:Math.round(r.height), top:Math.round(r.top), left:Math.round(r.left) }; }
      return { overlay:!!ov, card:box(card), frame:box(frame), hasStill:!!document.querySelector('.h2-has-still'), hasVideo:!!document.querySelector('video') };
    });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-h2-cutaways.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-h2-cutaways ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
