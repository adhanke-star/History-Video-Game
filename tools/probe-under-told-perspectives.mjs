#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-under-told-perspectives.mjs — D178 under-told-perspectives gate.
// Verifies source-backed data, D153 women-lane separation, default exact-zero
// bridge input, capped active liaison, resolve ledger behavior, War Effort UI,
// and no Soldier's Story / tactical contamination.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY || '1';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }
const SLOW_MAC = {
  serverTries: 180,
  serverDelay: 250,
  nav: 150000,
  settle: 1400,
  eval: 300000,
  screenshotSetup: 90000,
  screenshot: 300000,
  screenshotBound: 320000,
  pageClose: 10000,
  browserClose: 15000
};
async function withTimeout(label, promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + ' timed out after ' + ms + 'ms')), ms); })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function closePage(page) {
  try { await withTimeout('page.close', page.close({ runBeforeUnload: false }), SLOW_MAC.pageClose); } catch (e) {}
}
async function closeBrowser(browser) {
  try { await withTimeout('browser.close', browser.close(), SLOW_MAC.browserClose); } catch (e) {}
}

const sourceText = readFileSync(join(ROOT, 'src', '66-under-told-perspectives.js'), 'utf8');
const dataText = readFileSync(join(ROOT, 'data', 'under-told-perspectives.json'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?2200:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock){ C.clock.year=year||1864; C.clock.weariness=42; C.clock.capital=12; }
    if(C.president && C.president.date) C.president.date.year=year||1864;
    return C; }
  function fakeB(side, id, year, type){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=2200; c[e]=1400;
    return { playerSide:side, enemySide:e, bd:{id:id||'shiloh',name:'Shiloh',year:year||1863}, casualties:c, infl:{}, units:[], type:type||'loss' }; }
  try {
    if (typeof G==='undefined') return JSON.stringify({ok:false,fatal:'G undefined'});
    G.mode='menu';

    step('data loads three remaining threads plus D153 women lane without replacement ids', function(){
      var D=GAME_DATA && GAME_DATA['under-told-perspectives'];
      if(!D || D.schema!=='cw_under_told_perspectives_v1') throw new Error('missing under-told data/schema');
      ['US','CS'].forEach(function(s){ var p=D.profiles&&D.profiles[s]; if(!p) throw new Error('missing profile '+s);
        if(p.provenance!=='Verified') throw new Error('profile '+s+' not Verified');
        if(!Array.isArray(p.sources)||p.sources.length<2) throw new Error('profile '+s+' needs >=2 sources'); });
      if(!Array.isArray(D.threads)||D.threads.length<4) throw new Error('missing perspective threads');
      var ids=D.threads.map(function(t){ return t.id; }).join(',');
      ['enslaved-agency','immigrant-ethnic-units','native-nations','women-d153-lane'].forEach(function(id){ if(ids.indexOf(id)<0) throw new Error('missing '+id); });
      var nativeThread=D.threads.filter(function(t){ return t.id==='native-nations'; })[0];
      if(!nativeThread || nativeThread.provenance!=='Verified') throw new Error('Native-nations thread must be Verified after the M4 dossier pass');
      if(!Array.isArray(nativeThread.sources)||nativeThread.sources.length<4) throw new Error('Native-nations Verified thread needs source-backed dossier trails');
      if(!/not a license to create a playable Trans-Mississippi battle/i.test(nativeThread.sourceNote||'')) throw new Error('Native-nations narrow-scope playable-battle note missing');
      var nativeBlob=(nativeThread.summary||'')+' '+(nativeThread.sourceNote||'')+' '+(nativeThread.sources||[]).join(' ');
      ['Worcester v. Georgia','Trail of Tears','Albert Pike','Stand Watie','Honey Springs','Sand Creek','Dakota 38','Ely Parker','Appomattox'].forEach(function(token){
        if(nativeBlob.indexOf(token)<0) throw new Error('Native-nations M4 thread missing token: '+token);
      });
      if(!/This does not make the Confederacy "diverse\.?"/.test(nativeBlob)) throw new Error('Native-nations anti-diverse-Confederacy guardrail missing');
      D.threads.concat(D.debates||[]).forEach(function(x){
        if(x.id && String(x.id).indexOf('ss:')===0) throw new Error('ss namespace leak '+x.id);
        if(Object.prototype.hasOwnProperty.call(x,'replacePid')) throw new Error('replacePid leak '+x.id);
        if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+x.id);
      });
      var womenLane=JSON.stringify(D.threads.filter(function(t){return t.id==='women-d153-lane';})[0]||{});
      if(!/D153/.test(womenLane)) throw new Error('women lane does not name D153 separation');
      if(!/11 records, 9 Verified and 2 Disputed/.test(womenLane)) throw new Error('women lane does not reflect the D386 11-card source count (9 at M4, +Edmonds +Clayton in D386)');
      return { schema:D.schema, threads:D.threads.length, debates:(D.debates||[]).length };
    });

    step('default bridge input is exact zero and does not move army facets', function(){
      var C=mkC('US',1864);
      C.underTold.covered.enslavedAgency=80; C.underTold.omitted.nativeNations=140;
      var a0=bridgeArmy(C);
      var b=underToldBridgeBonus(C);
      var a1=bridgeArmy(C);
      if(b.morale!==0 || b.supply!==0 || b.fatigue!==0 || b.overall!==0) throw new Error('inactive bridge should be exact zero: '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(a0[k]!==a1[k]) throw new Error(k+' changed while inactive: '+a0[k]+'->'+a1[k]); });
      return { bridge:b, army:{overall:a1.overall,morale:a1.morale,supply:a1.supply,fatigue:a1.fatigue} };
    });

    step('active liaison is explicit, bounded, and costly', function(){
      var C=mkC('US',1864); C.warroom.supply=72; C.strategy.enemyWill=44;
      var before=bridgeArmy(C);
      underToldSetPriority(C,'perspectiveLiaison');
      var bonus=underToldBridgeBonus(C), after=bridgeArmy(C), caps=GAME_DATA['under-told-perspectives'].config.bridgeCaps;
      if(!bonus.active) throw new Error('bonus should be active');
      if(bonus.morale<0 || bonus.morale>caps.morale) throw new Error('morale outside cap '+bonus.morale);
      if(bonus.supply>0 || Math.abs(bonus.supply)>caps.supplyCost) throw new Error('supply cost outside cap '+bonus.supply);
      if(bonus.fatigue<0 || bonus.fatigue>caps.fatigueCost) throw new Error('fatigue outside cap '+bonus.fatigue);
      if(bonus.overall!==0) throw new Error('under-told liaison must not add direct overall bonus');
      if(after.supply>before.supply) throw new Error('liaison should not raise supply');
      if(after.fatigue<before.fatigue) throw new Error('liaison should not reduce fatigue');
      return { before:before, after:after, bonus:bonus };
    });

    step('snapshot responds to emancipation, western context, women lane, and irregular pressure', function(){
      var early=mkC('US',1861); early.idx=0; early.clock.weariness=20;
      var late=mkC('US',1864); late.idx=1; late.clock.weariness=62; late.manpower.strength=70; late.strategy.enemyWill=42;
      if(typeof irregularWarSetPriority==='function') irregularWarSetPriority(late,'civilianSecurity');
      var e=underToldSnapshot(early), l=underToldSnapshot(late);
      if(!(l.omissionPressure>e.omissionPressure)) throw new Error('late pressure should exceed early pressure: '+e.omissionPressure+' -> '+l.omissionPressure);
      if(l.womenLane!==100) throw new Error('D153 women lane should be detected as covered');
      if(!(l.agencyIndex>=e.agencyIndex)) throw new Error('emancipation/USCT context should lift agency visibility');
      return { early:e, late:l };
    });

    step('resolve records coverage and active liaison mitigates omissions without erasing ledger', function(){
      var I=mkC('US',1864), A=mkC('US',1864);
      I.clock.capital=A.clock.capital=12;
      underToldSetPriority(A,'perspectiveLiaison');
      underToldOnResolve('CS','loss',fakeB('US','shiloh',1864,'loss'),I,false);
      underToldOnResolve('CS','loss',fakeB('US','shiloh',1864,'loss'),A,false);
      if(!I.underTold.lastTurn || !A.underTold.lastTurn) throw new Error('lastTurn not recorded');
      if(!(A.underTold.lastTurn.omittedAdded<I.underTold.lastTurn.omittedAdded)) throw new Error('active liaison should reduce omissions');
      if(!(A.underTold.lastTurn.coveredAdded>I.underTold.lastTurn.coveredAdded)) throw new Error('active liaison should increase coverage');
      if(!(A.underTold.lastTurn.liaisonContacts>0)) throw new Error('active liaison should record contacts');
      if(!(A.clock.capital<I.clock.capital)) throw new Error('active liaison should cost political capital');
      if(!(A.underTold.omitted.enslavedAgency>0 && A.underTold.covered.nativeNations>0)) throw new Error('ledger should retain omissions and coverage');
      return { inactive:I.underTold.lastTurn, active:A.underTold.lastTurn };
    });

    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1864);
      C.underTold={active:'yes', priority:'bad', covered:{enslavedAgency:'9', immigrantEthnic:-5, nativeNations:'12', womenLane:[]}, omitted:'bad', liaisonContacts:{enslavedAgency:4, immigrantEthnic:'6', nativeNations:null, womenLane:'1'}, log:'oops', lastTurn:'bad', lastBridge:[]};
      underToldInit(C);
      if(C.underTold.active!==false) throw new Error('active not sanitized');
      if(C.underTold.priority!==null) throw new Error('priority not sanitized');
      if(C.underTold.covered.enslavedAgency!==9 || C.underTold.covered.immigrantEthnic!==0 || C.underTold.covered.nativeNations!==12) throw new Error('covered bag not sanitized');
      if(C.underTold.omitted.enslavedAgency!==0 || C.underTold.omitted.nativeNations!==0) throw new Error('omitted bag not reset');
      if(C.underTold.liaisonContacts.enslavedAgency!==4 || C.underTold.liaisonContacts.immigrantEthnic!==6 || C.underTold.liaisonContacts.womenLane!==1) throw new Error('contacts bag not sanitized');
      if(!Array.isArray(C.underTold.log)) throw new Error('log not array');
      if(C.underTold.lastTurn!==null || C.underTold.lastBridge!==null) throw new Error('last fields not nulled');
      return C.underTold;
    });

    step('War Effort UI renders under-told teaching and toggle wires', function(){
      var C=mkC('US',1864); C.underTold.omitted.nativeNations=90; C.strategy.enemyWill=42;
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      if(h.indexOf('Under-Told Perspectives')<0) throw new Error('under-told block missing');
      if(h.indexOf('Enslaved agency')<0 || h.indexOf('Immigrant')<0 || h.indexOf('Native nations')<0 || h.indexOf('D153')<0) throw new Error('under-told teaching copy missing');
      if(h.indexOf('source-anchored')<0 || h.indexOf('not a playable Trans-Mississippi battle')<0) throw new Error('M4 Native bounded-source note missing from UI');
      var b=document.getElementById('utpToggleLiaison'); if(!b) throw new Error('liaison button absent');
      b.click();
      if(!C.underTold || C.underTold.active!==true || C.underTold.priority!=='perspectiveLiaison') throw new Error('toggle did not activate');
      var bb=underToldBridgeBonus(C); if(!bb.active) throw new Error('bridge not active after click');
      return { active:C.underTold.active, bridge:bb, len:h.length };
    });

    step('no Soldier Story or tactical contamination from source/data', function(){
      var src = ${JSON.stringify(sourceText)};
      var data = ${JSON.stringify(dataText)};
      function scanNoReplacementNamespace(obj, path){
        if(!obj || typeof obj!=='object') return;
        Object.keys(obj).forEach(function(k){
          var p = path ? path + '.' + k : k;
          var v = obj[k];
          if(k==='replacePid') throw new Error('data leaked replacePid key at '+p);
          if(typeof v==='string' && /^ss:/.test(v)) throw new Error('data leaked ss namespace value at '+p);
          if(v && typeof v==='object') scanNoReplacementNamespace(v, p);
        });
      }
      scanNoReplacementNamespace(JSON.parse(data), '');
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=|\\.winner\\s*=|\\.men\\s*=/.test(src)) throw new Error('module touched tactical engine/output fields');
      if(/soldier-replacements|ssPersonRegistry|wiwThreadHTML/.test(src)) throw new Error('module should not consume Soldier Story or women card renderers');
      return { clean:true };
    });
  } catch(e){ R.ok=false; R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;

(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`;
  let srv = null;
  if (!(await up(probe))) { srv = spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<SLOW_MAC.serverTries;i++){ if(await up(probe))break; await sleep(SLOW_MAC.serverDelay); } }
  let browser;
  try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
  catch(e){ browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
  const page = await browser.newPage({ viewport: cfg.viewport });
  page.setDefaultTimeout(SLOW_MAC.nav);
  const pageerrors = []; page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:SLOW_MAC.nav });
    await sleep(SLOW_MAC.settle);
    result = JSON.parse(await withTimeout('assertion evaluate', page.evaluate(SETUP), SLOW_MAC.eval));
    result.pageerrors = pageerrors;
    if (pageerrors.length) result.ok = false;
    try {
      await withTimeout('screenshot setup', page.evaluate(() => {
        G.campaign={side:'US',iron:false,idx:0,funds:6500,recovery:false,completed:[],roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}],nextId:2,stats:{battles:0,won:0,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]};
        var C=G.campaign; _t1InitAll(C); if(C.clock){ C.clock.year=1864; C.clock.capital=12; C.clock.weariness=52; } if(C.president&&C.president.date) C.president.date.year=1864;
        C.underTold.omitted.nativeNations=130; C.underTold.covered.enslavedAgency=80; C.strategy.enemyWill=42; underToldSetPriority(C,'perspectiveLiaison');
        openWarDept(); window._wdTab='economy'; _wdRefresh();
        var b=document.getElementById('utpToggleLiaison'); if(b && b.scrollIntoView) b.scrollIntoView({block:'center'});
      }), SLOW_MAC.screenshotSetup);
      await sleep(600);
      await withTimeout('screenshot', page.screenshot({ path: join(OUT,'under-told-perspectives.png'), fullPage:false, timeout:SLOW_MAC.screenshot }), SLOW_MAC.screenshotBound);
      result.screenshot = { path: join(OUT,'under-told-perspectives.png') };
    } catch (shotErr) {
      result.screenshotWarning = String(shotErr && shotErr.message || shotErr);
    }
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-under-told-perspectives.json'), JSON.stringify(result, null, 2));
    await closePage(page);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  console.log('probe-under-told-perspectives ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  process.exit(!result.ok || (result.pageerrors && result.pageerrors.length) ? 1 : 0);
})();
