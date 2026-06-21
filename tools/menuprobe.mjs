#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/menuprobe.mjs — verifies the main-menu "War Department" entry (the with-save path).
// Boots the game, persists a campaign, opens the main menu, asserts the #gnWarDept button is
// present, clicks it, and confirms the War Department sheet opens. Writes results to disk.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..'); const OUT = join(__dirname, 'shots'); mkdirSync(OUT, { recursive: true });
const cfg = JSON.parse(readFileSync(join(__dirname, 'shots.json'), 'utf8'));
const GL = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u){ try{ const r=await fetch(u,{method:'HEAD'}); return r.ok||r.status===200; }catch{ return false; } }
const EVAL = `(() => {
  var R={steps:[],errors:[]}; window.addEventListener('error',e=>R.errors.push(String(e.message)));
  function step(n,f){ try{ R.steps.push({n,ok:true,v:f()}); }catch(e){ R.steps.push({n,ok:false,err:String(e&&e.message||e)}); } }
  try {
    G.campaign = { side:'US', iron:false, idx:1, funds:500, recovery:false, completed:['sumter'],
      roster:[{id:'R1',type:'inf',weapon:'springfield',xp:2,name:null}], nextId:2,
      stats:{battles:2,won:1,infl:300,suff:1500}, recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] };
    if (typeof _t1InitAll==='function') _t1InitAll(G.campaign);
    step('saveLocal', function(){ saveLocal(); return true; });
    step('openMainMenu', function(){ openMainMenu(); return true; });
    step('wardept button present', function(){ return !!document.getElementById('gnWarDept'); });
    step('click wardept', function(){ var b=document.getElementById('gnWarDept'); if(!b) throw new Error('no button'); b.click();
      var ov=document.getElementById('overlay'); var sp=document.getElementById('sheetPad');
      return { overlayShown: ov && !ov.classList.contains('hidden'), hasTabs: !!document.getElementById('wdTabs') }; });
  } catch(e){ R.errors.push('FATAL '+String(e&&e.message||e)); }
  return JSON.stringify(R);
})()`;
(async () => {
  const probe = `${cfg.baseUrl}/${cfg.file}`; let srv=null;
  if (!(await up(probe))) { srv=spawn('python3',['-m','http.server',String(cfg.port)],{cwd:ROOT,stdio:'ignore'}); for(let i=0;i<50;i++){ if(await up(probe))break; await sleep(120);} }
  let browser; try{ browser=await chromium.launch({channel:'chrome',headless:true,args:GL}); }
  catch(e){ browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:GL}); }
  const page=await browser.newPage({viewport:cfg.viewport}); const pe=[]; page.on('pageerror',e=>pe.push(String(e.message)));
  let result={};
  try {
    await page.goto(probe,{waitUntil:'load',timeout:60000}); await sleep(400);
    // capture the main menu (with the War Department entry) first
    await page.evaluate(`(()=>{ G.campaign={side:'US',iron:false,idx:1,funds:500,recovery:false,completed:['x'],roster:[{id:'R1',type:'inf',weapon:'springfield',xp:1,name:null}],nextId:2,stats:{battles:2,won:1,infl:0,suff:0},recoveryLossCount:0,recoveryMode:false,flipAtk:false,captured:[]}; if(typeof saveLocal==='function')saveLocal(); if(typeof openMainMenu==='function')openMainMenu(); })()`);
    await sleep(300); await page.screenshot({ path: join(OUT,'t1-menu.png'), fullPage:false });
    result = JSON.parse(await page.evaluate(EVAL)); result.pageerrors = pe;
    await sleep(300); await page.screenshot({ path: join(OUT,'t1-menu-wardept.png'), fullPage:false });
  } catch(e){ result={fatal:String(e&&e.message||e),pageerrors:pe}; }
  finally { writeFileSync(join(OUT,'menuprobe.json'), JSON.stringify(result,null,2)); await browser.close(); if(srv) srv.kill(); }
})();
