#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D191 Western Theater strategic readout focused gate.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY || '1';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }
const T = { serverTries:180, serverDelay:250, nav:150000, settle:1400, eval:300000, pageClose:10000, browserClose:15000 };
async function withTimeout(label, promise, ms) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms); })]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function closePage(page) { try { await withTimeout('page.close', page.close({ runBeforeUnload: false }), T.pageClose); } catch {} }
async function closeBrowser(browser) { try { await withTimeout('browser.close', browser.close(), T.browserClose); } catch {} }

const sourceText = readFileSync(join(ROOT, 'src', '73-western-theater.js'), 'utf8');
const bridgeText = readFileSync(join(ROOT, 'src', '85-battle-bridge.js'), 'utf8');
const manifestText = readFileSync(join(ROOT, 'src', '00-manifest.json'), 'utf8');
const dataText = readFileSync(join(ROOT, 'data', 'western-theater.json'), 'utf8');
const futureBattleFiles = ['chattanooga','atlanta','franklin','nashville'].filter(id => existsSync(join(ROOT, 'data', id + '.json')));

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v:v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?900:6500), recovery:false, completed:['shiloh','vicksburg','chickamauga'],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:6,won:3,infl:14800,suff:17200},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock){ C.clock.year=year||1864; C.clock.weariness=48; C.clock.capital=18; C.clock.intervention=14; }
    if(C.president && C.president.date) C.president.date.year=year||1864;
    if(C.production){ C.production.railIntegrity=(side==='CS'?42:86); C.production.equipIndex=(side==='CS'?45:80); }
    if(C.blockade) C.blockade.importFactor=(side==='CS'?0.55:1);
    if(C.warroom) C.warroom.supply=(side==='CS'?44:76);
    if(C.morale){ C.morale.casualtyToll=16600; C.morale.public=(side==='CS'?41:62); }
    if(C.manpower) C.manpower.strength=(side==='CS'?48:78);
    if(C.hardWar){ C.hardWar.displaced[side]=4200; C.hardWar.propertyDestroyed[side]=9600; }
    return C; }
  function fakeB(side, year){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=2600; c[e]=2100;
    return { playerSide:side, enemySide:e, bd:{id:'chickamauga',name:'Chickamauga',year:year||1863}, casualties:c, infl:{}, units:[], type:'loss' }; }
  function stripWestern(C){ var copy=JSON.parse(JSON.stringify(C)); delete copy.westernTheater; return JSON.stringify(copy); }
  try {
    G.mode='menu';
    step('data loads sourced current arc, hinges, future locks, and guardrails', function(){
      var D=GAME_DATA&&GAME_DATA['western-theater'];
      if(!D||D.schema!=='cw_western_theater_v1') throw new Error('missing western-theater schema');
      // S44 (D423): every arc entry carries scenarioId + playable-now + the two-source law.
      // The 9-id SET requirement is owned by the registry-truth tooth below, live-derived from
      // the registry (no hardcoded subset) — which also lets the atlanta-flip bind isolate it.
      var cur=(D.currentArc||[]).map(function(x){return x.scenarioId;});
      if(!cur.length) throw new Error('currentArc empty');
      (D.currentArc||[]).forEach(function(x){
        if(!x.scenarioId||typeof x.scenarioId!=='string') throw new Error('currentArc entry missing scenarioId: '+(x.id||x.label));
        if(x.status!=='playable-now') throw new Error('currentArc entry not playable-now: '+x.id); });
      var locks=D.futureLocks||[];
      if(!locks.length) throw new Error('futureLocks empty');
      var atl=locks.filter(function(x){return x.id==='wt-march-to-the-sea-readout';})[0];   // D443 (AD-4 re-pin): D436's S44 swap renamed the lock wt-atlanta-march-readout -> wt-march-to-the-sea-readout with lockedScenarioIds ["marchToTheSea"] (atlanta is registered/playable); the D436 sweep missed this tooth — recorded honestly
      if(!atl) throw new Error('missing the March-to-the-Sea future lock');
      if(!Array.isArray(atl.lockedScenarioIds)||atl.lockedScenarioIds.indexOf('marchToTheSea')<0) throw new Error('March lock missing lockedScenarioIds ["marchToTheSea"]');
      var all=[D.profile||{}].concat(D.currentArc||[],D.strategicHinges||[],D.futureLocks||[],D.guardrails||[]);
      all.forEach(function(x){ if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+(x.id||x.title||x.label||x.name)); });
      return { current:cur, locks:locks.length, hinges:(D.strategicHinges||[]).length };
    });
    step('S44 registry truth: currentArc == the registered theater-"W" set; locked ids unregistered', function(){
      if(typeof fldScenarioRegistry!=='function') throw new Error('fldScenarioRegistry unavailable');
      if(typeof _FLD_BATTLE_META!=='object'||!_FLD_BATTLE_META) throw new Error('_FLD_BATTLE_META unavailable');
      var D=GAME_DATA['western-theater'], reg=fldScenarioRegistry()||{};
      var arcIds=(D.currentArc||[]).map(function(x){return x.scenarioId;});
      arcIds.forEach(function(id){ if(!reg[id]) throw new Error('currentArc scenarioId not registered: '+id); });
      // no hardcoded subset: a new registered Western battle forces this copy update
      var westernRegistered=Object.keys(reg).filter(function(id){ var m=_FLD_BATTLE_META[id]; return !!(m&&m.theater==='W'); }).sort();
      var arcSorted=arcIds.slice().sort();
      if(JSON.stringify(westernRegistered)!==JSON.stringify(arcSorted)) throw new Error('registered western set ['+westernRegistered.join(',')+'] != currentArc ['+arcSorted.join(',')+']');
      var lockedIds=(D.futureLocks||[]).reduce(function(a,l){return a.concat(Array.isArray(l.lockedScenarioIds)?l.lockedScenarioIds:[]);},[]);
      lockedIds.forEach(function(id){ if(reg[id]) throw new Error('locked scenarioId is actually registered: '+id); });
      return { western:westernRegistered, lockedIds:lockedIds };
    });
    step('bridge function is exact zero and does not move army facets', function(){
      var C=mkC('US',1864), before=bridgeArmy(C), b=westernTheaterBridgeBonus(C), after=bridgeArmy(C);
      if(b.active!==false||b.morale!==0||b.supply!==0||b.fatigue!==0||b.overall!==0||b.readoutOnly!==true) throw new Error('nonzero bridge '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(before[k]!==after[k]) throw new Error(k+' changed '+before[k]+'->'+after[k]); });
      return { bridge:b, army:after };
    });
    step('snapshot aggregates existing ledgers without external mutation', function(){
      var C=mkC('CS',1864), before=stripWestern(C), snap=westernTheaterSnapshot(C), after=stripWestern(C);
      if(before!==after) throw new Error('snapshot mutated external campaign state');
      if(!(snap.riverRailIndex>0 && snap.chattanoogaPressure>0 && snap.georgiaPressure>0 && snap.armyTennesseeStrain>0)) throw new Error('snapshot metrics missing '+JSON.stringify(snap));
      var arcLen=(GAME_DATA['western-theater'].currentArc||[]).length;   // S44 (D423): count derives from the data, never a hardcoded 3
      if(snap.playableWesternCount!==arcLen || snap.futureLockedCount<1 || snap.readoutAddsNoBattles!==true) throw new Error('queue counts wrong (want playable '+arcLen+', locks >=1, readoutAddsNoBattles true) '+JSON.stringify(snap));
      return snap;
    });
    step('resolve records only western lastTurn/log', function(){
      var C=mkC('US',1864);
      var before={stats:JSON.stringify(C.stats), morale:JSON.stringify(C.morale), production:JSON.stringify(C.production), hardWar:JSON.stringify(C.hardWar), manpower:JSON.stringify(C.manpower)};
      westernTheaterOnResolve('CS','loss',fakeB('US',1863),C,false);
      if(!C.westernTheater.lastTurn||C.westernTheater.lastTurn.readoutOnly!==true) throw new Error('lastTurn missing');
      if(!Array.isArray(C.westernTheater.log)||!C.westernTheater.log.length) throw new Error('log missing');
      ['stats','morale','production','hardWar','manpower'].forEach(function(k){ if(before[k]!==JSON.stringify(C[k])) throw new Error(k+' mutated'); });
      return C.westernTheater.lastTurn;
    });
    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1864);
      C.westernTheater={schema:3, log:'oops', lastTurn:'bad', lastBridge:[]};
      westernTheaterInit(C);
      if(C.westernTheater.schema!=='cw_western_theater_v1') throw new Error('schema not set');
      if(!Array.isArray(C.westernTheater.log)||C.westernTheater.lastTurn!==null||C.westernTheater.lastBridge!==null) throw new Error('sanitize failed '+JSON.stringify(C.westernTheater));
      return C.westernTheater;
    });
    step('War Effort UI renders the DERIVED Western readout and no priority control', function(){
      var C=mkC('US',1864);
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      // S44 (D423): all nine playable labels + the Atlanta lock render; the listing is derived
      ['Western Theater Strategic Readout','Fort Donelson','Shiloh','Stones River','Vicksburg','Chickamauga','Chattanooga','Kennesaw','Franklin','Nashville','Atlanta','USCT','No battle-build in this slice','bridge input is zero'].forEach(function(s){ if(h.indexOf(s)<0) throw new Error('missing UI text '+s); });
      if(h.indexOf('are playable now')<0) throw new Error('missing the derived playable listing');
      if(h.indexOf('locked future battle work')<0) throw new Error('missing the derived locked listing');
      if(h.indexOf('Shiloh, Vicksburg, and Chickamauga are playable now')>=0) throw new Error('retired hardcoded playable sentence still rendered');
      if(h.indexOf('USCT playable work remain locked')>=0) throw new Error('retired hardcoded lock sentence still rendered');
      if(document.querySelector('[data-wtpriority],#wtToggle,#westernTheaterToggle')) throw new Error('western theater priority control should not exist');
      return { len:h.length };
    });
    step('Theater Map renders the full derived arc without launch affordance', function(){
      var C=mkC('US',1864);
      openWarDept(); window._wdTab='map'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      ['The seat of war spans','Western Theater Strategic Readout','No tactical launch added','Fort Donelson','Stones River','Kennesaw','Chattanooga','Atlanta','Franklin','Nashville'].forEach(function(s){ if(h.indexOf(s)<0) throw new Error('missing map text '+s); });
      if(h.indexOf('Shiloh, Vicksburg, and Chickamauga are playable now')>=0) throw new Error('retired hardcoded playable sentence leaked into the map block');
      if(/fldLaunch|Start Battle|side-choice/i.test(h)) throw new Error('map readout leaked launch affordance');
      return { len:h.length };
    });
    step('no tactical, output, bridge, or unregistered battle-file contamination exists', function(){
      var src=${JSON.stringify(sourceText)}, bridge=${JSON.stringify(bridgeText)}, manifest=${JSON.stringify(manifestText)}, data=${JSON.stringify(dataText)}, future=${JSON.stringify(futureBattleFiles)};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|BATTLES|CHAINS|fldScenarioRegistry|\\.victory\\s*=|\\.winner\\s*=|\\.men\\s*=|\\.casualties\\s*=/.test(src)) throw new Error('western source touched tactical/output fields');
      if(/westernTheaterBridgeBonus/.test(bridge)) throw new Error('bridgeArmy should not consume westernTheaterBridgeBonus');
      if(manifest.indexOf('73-western-theater.js')<0) throw new Error('manifest missing module');
      if(/"id"\\s*:\\s*"(chattanooga|atlanta|franklin|nashville)"/i.test(data)) throw new Error('future battle id leaked as registry-like quoted id');
      // D355: the original D191 leg asserted these battle files must NOT exist — battle-build was
      // locked when this readout shipped, so mere existence proved leakage. D324 unlocked the lanes
      // and D326/D333/D335 shipped chattanooga/franklin/nashville through their own gates, which
      // made the time-bound premise obsolete (caught by the first full battery after D176 deferral).
      // The durable invariant it protected stands: a battle data file may exist ONLY as a battle
      // REGISTERED in fldScenarioRegistry (file basename == scenario id for every name in this
      // list), never as an unregistered stowaway smuggled around the registry/roster gates.
      if(future.length){
        if(typeof fldScenarioRegistry!=='function') throw new Error('battle JSON exists but the scenario registry is unavailable: '+future.join(','));
        var reg=fldScenarioRegistry()||{}, stowaway=[];
        for(var fi=0;fi<future.length;fi++){ if(!reg[future[fi]]) stowaway.push(future[fi]); }
        if(stowaway.length) throw new Error('unregistered battle JSON exists (stowaway outside the registry gates): '+stowaway.join(','));
      }
      return { clean:true, registeredBattleFiles:future };
    });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<T.serverTries;i++){ if(await up(probe))break; await sleep(T.serverDelay); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  page.setDefaultTimeout(T.nav);
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:T.nav });
    await sleep(T.settle);
    result = JSON.parse(await withTimeout('assertion evaluate', page.evaluate(SETUP), T.eval));
    result.pageerrors = pageerrors;
    if (pageerrors.length) result.ok = false;
    await page.evaluate(() => {
      G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:['shiloh','vicksburg','chickamauga'],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:6,won:3,infl:14800,suff:17200},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
      var C=G.campaign; _t1InitAll(C); if(C.clock){C.clock.year=1864;C.clock.weariness=48;} if(C.president&&C.president.date) C.president.date.year=1864;
      if(C.production){ C.production.railIntegrity=86; C.production.equipIndex=80; } if(C.warroom) C.warroom.supply=76; if(C.morale){ C.morale.public=62; C.morale.casualtyToll=16600; }
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var block=Array.from(document.querySelectorAll('.h0-desk-systems > div, #wdContent > div')).filter(function(el){return (el.textContent||'').indexOf('Western Theater Strategic Readout')>=0;})[0];
      if(block && block.scrollIntoView) block.scrollIntoView({block:'center'});
    });
    await sleep(350);
    await page.screenshot({ path: join(OUT, 'western-theater-war-effort.png'), fullPage:false, timeout:120000 });
    await page.evaluate(() => { window._wdTab='map'; _wdRefresh(); });
    await sleep(300);
    await page.screenshot({ path: join(OUT, 'western-theater-map.png'), fullPage:false, timeout:120000 });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-western-theater.json'), JSON.stringify(result, null, 2));
    await closePage(page);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  console.log('probe-western-theater ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
  process.exit(0);
})();
