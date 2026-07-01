#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-logistics-rail.mjs — D159 strategic rail/logistics gate.
// Verifies citation-grade data, default exact-zero bridge input, bounded active
// effects, integration with production/engineering/blockade, save-shape
// sanitization, UI render/wire, and no tactical/classic contamination.
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
const SLOW_MAC = { screenshot: 120000, browserClose: 30000 };
async function withTimeout(label, promise, ms) {
  let t;
  try {
    return await Promise.race([
      promise,
      new Promise((_, rej) => { t = setTimeout(() => rej(new Error(label + ' timeout after ' + ms + 'ms')), ms); })
    ]);
  } finally {
    if (t) clearTimeout(t);
  }
}
async function closeBrowser(browser) {
  try { await withTimeout('browser.close', browser.close(), SLOW_MAC.browserClose); } catch {}
}
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, funds){ var C={ side:side, iron:false, idx:0, funds:(funds||400000), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C); return C; }
  function fakeB(side, id, year){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=1500; c[e]=1800;
    return { playerSide:side, enemySide:e, bd:{id:id||'x',name:'Engagement',year:year||1863}, casualties:c, infl:{}, units:[] }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';

    step('data loads with source-backed profiles and benchmarks', function(){
      var D=GAME_DATA && GAME_DATA['logistics-rail'];
      if (!D || D.schema!=='cw_logistics_rail_v1') throw new Error('missing logistics-rail data/schema');
      ['US','CS'].forEach(function(s){ var p=D.profiles&&D.profiles[s]; if(!p) throw new Error('missing profile '+s);
        if(p.provenance!=='Verified') throw new Error('profile '+s+' not Verified');
        if(!Array.isArray(p.sources)||p.sources.length<2) throw new Error('profile '+s+' needs >=2 sources'); });
      if(!Array.isArray(D.benchmarks)||D.benchmarks.length<2) throw new Error('missing benchmarks');
      D.benchmarks.forEach(function(b){ if(b.provenance!=='Verified'||!Array.isArray(b.sources)||b.sources.length<2) throw new Error('benchmark source failure '+b.id); });
      return { schema:D.schema, routes:Object.keys(D.routes||{}).length, benchmarks:D.benchmarks.length };
    });

    step('default bridge input is exact zero and does not move army facets', function(){
      var C=mkC('US'); C.warroom.supply=62; C.idx=1;
      var a0=bridgeArmy(C);
      var b=logisticsBridgeBonus(C);
      var a1=bridgeArmy(C);
      if (b.supply!==0 || b.fatigue!==0 || b.overall!==0) throw new Error('inactive bridge should be exact zero: '+JSON.stringify(b));
      ['overall','supply','fatigue'].forEach(function(k){ if(a0[k]!==a1[k]) throw new Error(k+' changed while inactive: '+a0[k]+'->'+a1[k]); });
      return { bridge:b, army:{ overall:a1.overall, supply:a1.supply, fatigue:a1.fatigue, logistics:a1.logistics } };
    });

    step('active railhead priority is bounded and transparent', function(){
      var C=mkC('US'); C.idx=14; C.warroom.supply=78; C.warroom.nodes.rail=5; C.warroom.nodes.depot=5; C.warroom.nodes.provisions=4;
      for(var i=0;i<3;i++) engBuy(C,'construction');
      for(var p=0;p<2;p++) engBuy(C,'pontoons');
      var before=bridgeArmy(C);
      logisticsSetPriority(C,'railheads');
      var bonus=logisticsBridgeBonus(C), after=bridgeArmy(C), caps=GAME_DATA['logistics-rail'].config.bridgeCaps;
      if(!bonus.active) throw new Error('bonus should be active');
      if(bonus.supply<0 || bonus.supply>caps.supply) throw new Error('supply outside cap '+bonus.supply);
      if(bonus.fatigue>0 || Math.abs(bonus.fatigue)>caps.fatigueRelief) throw new Error('fatigue outside cap '+bonus.fatigue);
      if(bonus.overall<0 || bonus.overall>caps.overall) throw new Error('overall outside cap '+bonus.overall);
      if(!(after.supply>=before.supply)) throw new Error('active priority should not lower supply');
      if(!(after.fatigue<=before.fatigue)) throw new Error('active priority should not raise fatigue');
      return { before:{supply:before.supply,fatigue:before.fatigue,overall:before.overall}, after:{supply:after.supply,fatigue:after.fatigue,overall:after.overall}, bonus:bonus };
    });

    step('production, engineering, blockade, and War Room inputs move the network', function(){
      var C0=mkC('CS'); C0.idx=14; C0.warroom.supply=48; C0.warroom.nodes.rail=0; C0.warroom.nodes.depot=0; C0.blockade.importFactor=0.42;
      C0.production.railIntegrity=42; C0.production.foodDist=0.45;
      var low=logisticsSnapshot(C0);
      var C1=mkC('CS'); C1.idx=14; C1.warroom.supply=68; C1.warroom.nodes.rail=5; C1.warroom.nodes.depot=5; C1.warroom.nodes.provisions=3; C1.blockade.importFactor=0.78;
      C1.production.railIntegrity=58; C1.production.foodDist=0.58; for(var i=0;i<3;i++) engBuy(C1,'construction');
      var high=logisticsSnapshot(C1);
      if(!(high.network>low.network+10)) throw new Error('network should improve with rail/depot/engineering/imports: '+low.network+'->'+high.network);
      if(!(high.depotReach>low.depotReach)) throw new Error('depot reach should improve');
      if(!(high.importReach>low.importReach)) throw new Error('import reach should improve');
      return { low:low, high:high };
    });

    step('resolve stores a save-compatible lastTurn without reversing CS rail decay', function(){
      var C=mkC('CS'); C.warroom.nodes.rail=5; var start=C.production.railIntegrity;
      for(var i=0;i<3;i++) engBuy(C,'construction');
      for(var t=0;t<8;t++){ C.stats.battles++; _t1Resolve('CS','draw',fakeB('CS','chickamauga',1863),C,false); }
      if(!C.logistics || !C.logistics.lastTurn) throw new Error('missing lastTurn after resolve');
      if(!(C.production.railIntegrity<start)) throw new Error('CS rail must still decline despite logistics readout');
      if(!Array.isArray(C.logistics.log) || !C.logistics.log.length) throw new Error('log not written');
      return { start:Math.round(start), end:Math.round(C.production.railIntegrity), lastTurn:C.logistics.lastTurn };
    });

    step('state sanitizer handles malformed saves', function(){
      var C=mkC('US'); C.logistics={active:'yes', priority:'bad', log:'oops', lastTurn:'bad', lastBridge:[]};
      logisticsInit(C);
      if(C.logistics.active!==false) throw new Error('active not sanitized');
      if(C.logistics.priority!==null) throw new Error('priority not sanitized');
      if(!Array.isArray(C.logistics.log)) throw new Error('log not array');
      if(C.logistics.lastTurn!==null) throw new Error('lastTurn not null');
      if(C.logistics.lastBridge!==null) throw new Error('lastBridge not null');
      return C.logistics;
    });

    step('War Effort UI renders and toggle wires through save state', function(){
      var C=mkC('US'); C.idx=14; C.warroom.nodes.rail=4; C.warroom.nodes.depot=3;
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if(h.indexOf('Rail &amp; Supply Network')<0) throw new Error('logistics block missing');
      if(h.indexOf('Prioritize railheads')<0) throw new Error('priority button missing');
      var b=document.getElementById('lgToggleRailheads'); if(!b) throw new Error('button absent');
      b.click();
      if(!C.logistics || C.logistics.active!==true || C.logistics.priority!=='railheads') throw new Error('toggle did not activate');
      var bb=logisticsBridgeBonus(C); if(!bb.active) throw new Error('bridge not active after click');
      return { active:C.logistics.active, bridge:bb, len:h.length };
    });

    step('no tactical/classic contamination from the strategic module', function(){
      var src = ${JSON.stringify(readFileSync(join(ROOT, 'src', '61-logistics-rail.js'), 'utf8'))};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=/.test(src)) throw new Error('strategic rail module touched tactical engine/output fields');
      return { tacticalTokens:false };
    });
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
    await page.evaluate(() => { G.campaign={side:'US',iron:false,idx:14,funds:400000,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); C.warroom.nodes.rail=4; C.warroom.nodes.depot=4; C.warroom.nodes.provisions=3; C.warroom.supply=72; logisticsSetPriority(C,'railheads');
      openWarDept(); window._wdTab='economy'; _wdRefresh(); });
    await sleep(250);
    await page.screenshot({ path: join(OUT,'logistics-rail.png'), fullPage:false, timeout:SLOW_MAC.screenshot });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-logistics-rail.json'), JSON.stringify(result, null, 2));
    await closeBrowser(browser); if (srv) srv.kill();
  }
  console.log('probe-logistics-rail ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
})();
