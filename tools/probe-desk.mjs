#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-desk.mjs — functional + visual gate for the S0 President's Desk.
// Boots the real game, builds a campaign (with president state), opens the
// expanded War Department (now the President's Desk), exercises all SIX tabs,
// the Cabinet delegate toggle (must persist), and the between-battles
// strategic-turn interstitial → Continue → Quartermaster flow.
// Writes tools/shots/probe-desk.json (read this) + desk-<tab>.png + desk-interstitial.png.
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
    if (typeof G === 'undefined') return JSON.stringify({ok:false, fatal:'G undefined'});
    G.mode = 'menu';
    G.campaign = { side:'US', iron:false, idx:0, funds:420, recovery:false, completed:[],
      roster:[ {id:'R1',type:'inf',weapon:'springfield',xp:1,name:null} ],
      nextId:2, stats:{battles:2,won:1,infl:0,suff:0}, recoveryLossCount:0,
      recoveryMode:false, flipAtk:false, captured:[] };
    var C = G.campaign;
    step('init systems', function(){ _t1InitAll(C);
      return { clock:!!C.clock, warroom:!!C.warroom, muster:!!C.muster, president:!!C.president }; });
    // simulate a couple of resolved turns so the desk has live data
    step('seed two turns', function(){
      presOnResolve('US','win',{bd:{name:'Bull Run',year:1861}},C,true);
      presOnResolve('US','loss',{bd:{name:'Ball\\'s Bluff',year:1861}},C,false);
      return { turn:C.president.turn, year:C.president.date.year, log:C.president.log.length }; });

    step('open desk', function(){ openWarDept();
      var ov=document.getElementById('overlay');
      var t=document.querySelector('.title-xl');
      var tabs=['economy','warroom','clock','muster','cabinet','map'].map(function(k){return !!document.getElementById('wdTab_'+k);});
      return { overlay: ov && !ov.classList.contains('hidden'), title:(t?t.textContent:''),
        tabsPresent: tabs.filter(Boolean).length }; });

    function tabContent(){ var c=document.getElementById('wdContent'); return c?c.innerHTML:''; }
    step('economy tab', function(){ _wdTab='economy'; _wdRefresh(); var h=tabContent();
      if(h.indexOf('Treasury')<0) throw new Error('no Treasury in overview');
      if(h.indexOf('Strategic Turn')<0) throw new Error('no turn counter');
      return { len:h.length, hasMeter:h.indexOf('War-weariness')>=0, hasPortrait:h.indexOf('<img')>=0 }; });
    step('warroom tab (existing)', function(){ _wdTab='warroom'; _wdRefresh();
      return { len:tabContent().length, hasBuild:!!document.getElementById('wrBuild_industry') }; });
    step('clock tab (existing)', function(){ _wdTab='clock'; _wdRefresh();
      return { len:tabContent().length, hasBond:!!document.getElementById('clkBond') }; });
    step('muster tab (existing)', function(){ _wdTab='muster'; _wdRefresh();
      return { len:tabContent().length }; });
    step('cabinet tab (S2 advisor system)', function(){ _wdTab='cabinet'; _wdRefresh(); var h=tabContent();
      var dels=['war','treasury','state','navy'].map(function(d){return !!document.getElementById('cabDel_'+d);});
      var imgs=(h.match(/<img/g)||[]).length;
      if(dels.filter(Boolean).length!==4) throw new Error('expected 4 Delegate buttons (cabDel_*), got '+dels.filter(Boolean).length);
      if(imgs<4) throw new Error('expected >=4 portraits, got '+imgs);
      // the sitting War Secretary must render (date-aware churn — Cameron in 1861)
      var warSec=_cabHolder(C.side,'war',C.president.date);
      if(warSec && h.indexOf(warSec.name)<0) throw new Error('sitting War Secretary '+warSec.name+' not rendered');
      return { delegates:dels.filter(Boolean).length, portraits:imgs, warSec:warSec?warSec.name:null }; });
    step('delegate toggle persists', function(){
      var before = !!C.president.cabinetState.war.delegated;
      var b=document.getElementById('cabDel_war'); if(!b) throw new Error('no cabDel_war'); b.click();
      if(C.president.cabinetState.war.delegated===before) throw new Error('delegate did not toggle');
      return { wasDelegated:before, nowDelegated:C.president.cabinetState.war.delegated }; });
    step('decisions tab (S2 m2)', function(){
      if(typeof decOnResolve==='function') decOnResolve('US','win',{bd:{year:C.president.date.year}},C,true);  // surface eligible cards (1861 -> habeas)
      _wdTab='decisions'; _wdRefresh(); var h=tabContent();
      var pend=(C.president.pendingChoices||[]).length;
      if(pend>0 && h.indexOf('decChoose_tab_')<0) throw new Error('pending decisions but no Decide button rendered');
      if(pend>0 && h.indexOf('Habeas')<0) throw new Error('expected the habeas card title in 1861, got len '+h.length);
      return { len:h.length, pending:pend, hasDecideBtn:h.indexOf('decChoose_tab_')>=0 }; });
    step('map tab', function(){ _wdTab='map'; _wdRefresh(); var h=tabContent();
      if(h.indexOf('Eastern Theater')<0) throw new Error('no theaters'); return { len:h.length }; });

    // ---- the between-battles interstitial → Continue → Quartermaster ----
    step('interstitial appears', function(){ window._pdTurnAck=false; openUpgrade();
      var on=document.getElementById('pdGoOn'), desk=document.getElementById('pdGoDesk');
      if(!on) throw new Error('interstitial Continue button missing');
      return { hasContinue:!!on, hasDeskBtn:!!desk, mode:G.mode }; });
    step('continue → quartermaster', function(){ var on=document.getElementById('pdGoOn'); on.click();
      var quartermaster = !!document.getElementById('ugFunds') || (document.querySelector('.title-xl')||{}).textContent==='Winter Quarters';
      if(!quartermaster) throw new Error('upgrade sheet did not render after Continue');
      return { quartermaster:true, mode:G.mode, turnAckReset:(window._pdTurnAck===false) }; });
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
  const pageerrors = [];
  page.on('pageerror', e => pageerrors.push(String(e.message)));
  let result = { ok:false };
  try {
    await page.goto(probe, { waitUntil:'load', timeout:45000 });
    await sleep(500);
    result = JSON.parse(await page.evaluate(SETUP));
    result.pageerrors = pageerrors;
    // visual: re-open the desk and shoot each tab
    await page.evaluate(`openWarDept()`);
    for (const tab of ['economy','cabinet','map','warroom']) {
      await page.evaluate(t => { window._wdTab = t; if (typeof _wdRefresh==='function') _wdRefresh(); }, tab);
      await sleep(250);
      await page.screenshot({ path: join(OUT, `desk-${tab}.png`), fullPage:false });
    }
    await page.evaluate(`(function(){ window._pdTurnAck=false; if(typeof closeSheet==='function')closeSheet(); openUpgrade(); })()`);
    await sleep(250);
    await page.screenshot({ path: join(OUT, 'desk-interstitial.png'), fullPage:false });
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-desk.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-desk ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
})();
