#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// D188 Confederate finance toolkit focused gate.
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

const sourceText = readFileSync(join(ROOT, 'src', '69-cs-finance.js'), 'utf8');
const dataText = readFileSync(join(ROOT, 'data', 'cs-finance.json'), 'utf8');
const economyText = readFileSync(join(ROOT, 'data', 'economy.json'), 'utf8');

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function step(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v:v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  window.addEventListener('error', function(ev){ R.errors.push(String(ev.message||ev.error||ev)); });
  function mkC(side, year){ var C={ side:side, iron:false, idx:0, funds:(side==='CS'?900:6500), recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:null,xp:0,name:null}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    if(C.clock){ C.clock.year=year||1863; C.clock.weariness=42; C.clock.capital=12; }
    if(C.president && C.president.date) C.president.date.year=year||1863;
    if(C.economy){ C.economy.inflation=3.2; C.economy.mix={bonds:.32,taxes:.08,printing:.60}; C.economy.hiPrintTurns=3; }
    if(C.blockade) C.blockade.importFactor=.42;
    return C; }
  function fakeB(side, year){ var e=(side==='US')?'CS':'US'; var c={}; c[side]=1800; c[e]=1400;
    return { playerSide:side, enemySide:e, bd:{id:'vicksburg',name:'Vicksburg',year:year||1863}, casualties:c, infl:{}, units:[], type:'loss' }; }
  try {
    G.mode='menu';
    step('data loads five Confederate finance instruments with source guards', function(){
      var D=GAME_DATA&&GAME_DATA['cs-finance'];
      if(!D||D.schema!=='cw_cs_finance_v1') throw new Error('missing schema');
      var ids=(D.instruments||[]).map(function(x){return x.id;}).sort();
      ['cotton-bonds','erlanger-loan','impressment','printing-spiral','produce-loan'].forEach(function(id){ if(ids.indexOf(id)<0) throw new Error('missing '+id); });
      (D.instruments||[]).concat(D.debates||[], [D.profile||{}]).forEach(function(x){
        if(x.provenance==='Verified' && (!Array.isArray(x.sources)||x.sources.length<2)) throw new Error('under-sourced '+(x.id||x.title||x.name));
      });
      var erl=(D.instruments||[]).filter(function(x){return x.id==='erlanger-loan';})[0];
      if(!erl||erl.oneShot!==true||erl.mechanism.indexOf('45%')<0||erl.mechanism.indexOf('72')>=0) throw new Error('Erlanger correction not locked');
      var text=JSON.stringify(D);
      ['chattanooga','atlanta','franklin','nashville','new-market-heights','olustee','crater'].forEach(function(id){ if(new RegExp('"'+id+'"','i').test(text)) throw new Error('locked battle id leaked '+id); });
      return { instruments:ids };
    });
    step('economy data retains corrected Erlanger net proceeds', function(){
      var E=GAME_DATA&&GAME_DATA.economy;
      var loan=E&&E.finance&&E.finance.levers&&E.finance.levers.foreignLoan&&E.finance.levers.foreignLoan.CS;
      if(!loan||loan.netProceedsPct!==0.45||loan.issuePriceToErlanger!==77||loan.publicOfferPrice!==90) throw new Error('economy Erlanger correction drifted');
      return { netProceedsPct:loan.netProceedsPct, issue:loan.issuePriceToErlanger, publicOffer:loan.publicOfferPrice };
    });
    step('default bridge input is exact zero and US side is inert', function(){
      var C=mkC('CS',1863), before=bridgeArmy(C), b=csFinanceBridgeBonus(C), after=bridgeArmy(C);
      if(b.morale!==0||b.supply!==0||b.fatigue!==0||b.overall!==0) throw new Error('inactive nonzero '+JSON.stringify(b));
      ['overall','morale','supply','fatigue'].forEach(function(k){ if(before[k]!==after[k]) throw new Error(k+' changed '+before[k]+'->'+after[k]); });
      var U=mkC('US',1863); csFinanceSetPriority(U,'printing-spiral');
      var ub=csFinanceBridgeBonus(U);
      if(U.csFinance.active||ub.supply!==0||ub.morale!==0||ub.fatigue!==0||ub.overall!==0) throw new Error('US side not inert '+JSON.stringify(ub));
      return { bridge:b, us:ub };
    });
    step('active priorities are capped, costly, and no direct overall', function(){
      var C=mkC('CS',1863), before=bridgeArmy(C);
      csFinanceSetPriority(C,'impressment');
      var bonus=csFinanceBridgeBonus(C), after=bridgeArmy(C), caps=GAME_DATA['cs-finance'].config.bridgeCaps;
      if(!bonus.active||bonus.priority!=='impressment') throw new Error('not active');
      if(bonus.supply<0||bonus.supply>caps.supply) throw new Error('supply cap');
      if(bonus.morale>0||Math.abs(bonus.morale)>caps.moraleCost) throw new Error('morale cost cap');
      if(bonus.fatigue<0||bonus.fatigue>caps.fatigueCost) throw new Error('fatigue cap');
      if(bonus.overall!==0) throw new Error('overall bonus');
      if(after.supply<before.supply || after.morale>before.morale || after.fatigue<before.fatigue) throw new Error('bridge tradeoff inverted');
      return { before:before, after:after, bonus:bonus };
    });
    step('resolve applies strategic finance effects and Erlanger is one-shot', function(){
      var C=mkC('CS',1863); C.funds=900; C.clock.capital=12; C.economy.inflation=2;
      csFinanceSetPriority(C,'erlanger-loan');
      csFinanceOnResolve('US','loss',fakeB('CS',1863),C,false);
      var first=C.csFinance.lastTurn, funds1=C.funds, debt1=C.csFinance.debtBurden, credit1=C.csFinance.creditIndex;
      csFinanceOnResolve('US','loss',fakeB('CS',1863),C,false);
      var second=C.csFinance.lastTurn;
      if(!(first.fundsRaised>second.fundsRaised)) throw new Error('Erlanger repeat not reduced');
      if(!(funds1>900 && C.csFinance.debtBurden>debt1 && C.csFinance.creditIndex<credit1)) throw new Error('strategic ledgers absent');
      csFinanceSetPriority(C,'printing-spiral');
      var inf=C.economy.inflation;
      csFinanceOnResolve('US','loss',fakeB('CS',1864),C,false);
      if(!(C.economy.inflation>inf && C.csFinance.lastTurn.inflationNudgePct>0)) throw new Error('printing did not nudge inflation');
      return { first:first, second:second, printing:C.csFinance.lastTurn };
    });
    step('state sanitizer handles malformed saves', function(){
      var C=mkC('CS',1863);
      C.csFinance={active:'yes', priority:'bad', cashRaised:'33', debtBurden:-5, cottonPledged:'7', impressmentPressure:'12', civilianPressure:999, creditIndex:'bad', used:'bad', log:'oops', lastTurn:'bad', lastBridge:[]};
      csFinanceInit(C);
      if(C.csFinance.active!==false||C.csFinance.priority!==null) throw new Error('active/priority not sanitized');
      if(C.csFinance.cashRaised!==33||C.csFinance.debtBurden!==0||C.csFinance.cottonPledged!==7||C.csFinance.impressmentPressure!==12||C.csFinance.civilianPressure!==100||C.csFinance.creditIndex!==72) throw new Error('ledger sanitize failed');
      if(C.csFinance.used['erlanger-loan']!==false) throw new Error('used bag absent');
      if(!Array.isArray(C.csFinance.log)||C.csFinance.lastTurn!==null||C.csFinance.lastBridge!==null) throw new Error('last/log not sanitized');
      return C.csFinance;
    });
    step('War Effort UI renders all instruments and toggle wires', function(){
      var C=mkC('CS',1863);
      openWarDept(); window._wdTab='economy'; _wdRefresh();
      var h=document.getElementById('wdContent').innerHTML;
      ['Confederate Finance Toolkit','Erlanger cotton loan','Cotton bonds','Produce loan','Impressment','Printing spiral','No banker scapegoat'].forEach(function(s){ if(h.indexOf(s)<0) throw new Error('missing UI text '+s); });
      var b=document.querySelector('[data-csfpriority="printing-spiral"]'); if(!b) throw new Error('printing button absent');
      b.click(); if(!C.csFinance.active||C.csFinance.priority!=='printing-spiral') throw new Error('toggle failed');
      return { active:C.csFinance.active, priority:C.csFinance.priority, bridge:csFinanceBridgeBonus(C), len:h.length };
    });
    step('no tactical or output contamination from source/data', function(){
      var src=${JSON.stringify(sourceText)}, data=${JSON.stringify(dataText)}, econ=${JSON.stringify(economyText)};
      if(/__FIELD|fldLaunch|startBattleRuntime|genForce|\\.victory\\s*=|\\bcas\\s*=|\\.winner\\s*=|\\.men\\s*=/.test(src)) throw new Error('tactical/output touch');
      if(/new-market-heights|olustee|chattanooga|atlanta|franklin|nashville/i.test(data)) throw new Error('battle queue leak in data');
      if(!/netProceedsPct"\\s*:\\s*0\\.45/.test(econ)) throw new Error('economy text lacks corrected netProceedsPct');
      return { clean:true };
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
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-cs-finance.json'), JSON.stringify(result, null, 2));
    await closePage(page);
    await closeBrowser(browser);
    if (srv) srv.kill();
  }
  console.log('probe-cs-finance ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  if (!result.ok || (result.pageerrors && result.pageerrors.length)) process.exit(1);
  process.exit(0);
})();
