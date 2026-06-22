#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-command.mjs — S2 m5 COMMAND / named-generals. Verifies: the generals load
// side-correct + schema-clean; cmdInit builds command state + seeds reputation; a FRESH/default
// command ANCHORS leadership near 64 so bridgeArmy stays Classic-safe (the A6a/D47.1 anchor);
// a date-aware historical default holds the post; appointing a brilliant general lifts the army
// and a poor one drags it; reputation evolves with the war (victor outshines the vanquished) and
// commandLeadership tracks it; relief costs political capital (a very-costly general is gated when
// capital is short); the general's temperament nudges the auto-resolve margin (deterministic);
// commandLeadership feeds the m3 leader-morale layer; the appointee locks until revert; render works.
// Writes shots/probe-command.json.
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
  function mkC(side, y, m){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    C.clock.year=(y||1862); C.president.date={year:(y||1862),month:(m||9)}; return C; }
  function drive(C, win, type, turns){ var side=C.side, e=(side==='US')?'CS':'US';
    for(var t=0;t<turns;t++){ C.stats.battles++; if(win) C.stats.won++; var c={}; c[side]=win?900:2200; c[e]=win?2600:700;
      _t1Resolve(side, win?(type||'win'):(type||'loss'), {playerSide:side,enemySide:e,bd:{name:'x',year:C.president.date.year},casualties:c,infl:{},units:[]}, C, win); }
    return C; }
  try {
    if (typeof _cmdData!=='function' || typeof commandLeadership!=='function' || typeof cmdInit!=='function')
      return JSON.stringify({ok:false,fatal:'command module missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu';

    step('generals data loads, side-correct + schema-clean', function(){
      var d=_cmdData(); if(!d||!d.sides) throw new Error('no GAME_DATA.generals.sides');
      var us=_cmdSideGenerals('US'), cs=_cmdSideGenerals('CS');
      if(!us.length||!cs.length) throw new Error('missing generals for a side ('+us.length+'/'+cs.length+')');
      var all=us.concat(cs); var ids={};
      for(var i=0;i<all.length;i++){ var g=all[i];
        if(!g.id||!g.name||!g.side||typeof g.skill!=='number'||typeof g.aggression!=='number'||typeof g.caution!=='number'||!g.availableFrom) throw new Error('general missing field: '+(g&&g.id));
        if(ids[g.id]) throw new Error('duplicate general id: '+g.id); ids[g.id]=1; }
      return { us:us.length, cs:cs.length }; });

    step('cmdInit builds command state + seeds reputation; follows history by default', function(){
      var C=mkC('US',1862,9);
      if(!C.president.command||typeof C.president.command!=='object') throw new Error('command not initialized');
      if(C.president.command.fieldGeneral!==null) throw new Error('should follow history by default (fieldGeneral null)');
      var us=_cmdSideGenerals('US'); for(var i=0;i<us.length;i++) if(typeof C.president.command.reputation[us[i].id]!=='number') throw new Error('no seeded reputation for '+us[i].id);
      return { seeded:Object.keys(C.president.command.reputation).length }; });

    step('a FRESH/default command ANCHORS leadership near 64 -> bridgeArmy stays Classic-safe', function(){
      var C=mkC('US',1862,9); var lead=commandLeadership(C); var ov=bridgeArmy(C).overall;
      if(!(lead>=52 && lead<=82)) throw new Error('default leadership should anchor near 64, got '+lead);
      // the conditioning floor is overall>=62.9 (strengthMul>=0.95); keep a safe margin.
      if(!(ov>=66)) throw new Error('fresh overall must stay >= 66 to keep the Classic anchor, got '+ov);
      return { defaultLeadership:lead, freshOverall:ov }; });

    step('a date-aware HISTORICAL default holds the post (the commander changes with the war)', function(){
      var early=mkC('US',1862,1), late=mkC('US',1864,9);
      var gE=cmdActiveGeneral(early), gL=cmdActiveGeneral(late);
      if(!gE||!gL) throw new Error('no historical default at one of the dates');
      return { early:gE.id, late:gL.id, changed:(gE.id!==gL.id) }; });

    step('appointing a BRILLIANT general lifts the army; the default (cautious) drags it', function(){
      var grant=_cmdById('US','us-grant'); if(!grant) return { skipped:'no us-grant in data' };
      var Cdef=mkC('US',1864,9); var leadDef=commandLeadership(Cdef), ovDef=bridgeArmy(Cdef).overall;   // default at 1864 ~ Grant already; use a weak appointment to contrast
      var poor=_cmdById('US','us-burnside')||_cmdById('US','us-mcclellan');
      var Cgr=mkC('US',1863,3); Cgr.clock.capital=100; cmdAppoint(Cgr,'us-grant');
      if(cmdActiveId(Cgr)!=='us-grant') throw new Error('appointment of Grant failed (active='+cmdActiveId(Cgr)+')');
      var leadGr=commandLeadership(Cgr), ovGr=bridgeArmy(Cgr).overall;
      if(poor){ var Cpo=mkC('US',1863,3); Cpo.clock.capital=100; cmdAppoint(Cpo,poor.id);
        var leadPo=commandLeadership(Cpo), ovPo=bridgeArmy(Cpo).overall;
        if(!(leadGr>leadPo)) throw new Error('Grant should out-lead '+poor.id+': '+leadGr+' vs '+leadPo);
        if(!(ovGr>=ovPo)) throw new Error('Grant should field a no-worse army than '+poor.id+': '+ovGr+' vs '+ovPo);
        return { grantLead:leadGr, poorLead:leadPo, grantOverall:ovGr, poorOverall:ovPo, poor:poor.id }; }
      return { grantLead:leadGr, grantOverall:ovGr }; });

    step('reputation evolves with the war; commandLeadership tracks (victor outshines vanquished)', function(){
      var Cw=mkC('US',1864,3); var idW=cmdActiveId(Cw); var rep0=Math.round(C0rep(Cw,idW)); var lead0=commandLeadership(Cw);
      drive(Cw,true,'win',6); var rep1=Math.round(C0rep(Cw,idW)); var lead1=commandLeadership(Cw);
      var Cl=mkC('US',1864,3); var idL=cmdActiveId(Cl); var lrep0=Math.round(C0rep(Cl,idL));
      drive(Cl,false,'loss',6); var lrep1=Math.round(C0rep(Cl,idL));
      if(!(rep1>rep0)) throw new Error('a winning general should gain reputation: '+rep0+'->'+rep1);
      if(!(lrep1<lrep0)) throw new Error('a losing general should lose reputation: '+lrep0+'->'+lrep1);
      if(!(lead1>=lead0)) throw new Error('victories should not lower command leadership: '+lead0+'->'+lead1);
      return { winRep:rep0+'->'+rep1, loseRep:lrep0+'->'+lrep1, winLead:lead0+'->'+lead1 }; });

    step('relief costs political capital; a replacement is GATED when capital is short', function(){
      var grant=_cmdById('US','us-grant'); if(!grant) return { skipped:'no us-grant' };
      var Clow=mkC('US',1862,9); Clow.clock.capital=1; var before=cmdActiveId(Clow);
      cmdAppoint(Clow,'us-grant');
      if(cmdActiveId(Clow)!==before) throw new Error('with 1 capital the appointment should be BLOCKED, but active changed to '+cmdActiveId(Clow));
      var Chi=mkC('US',1862,9); Chi.clock.capital=80; var cap0=Chi.clock.capital;
      cmdAppoint(Chi,'us-grant');
      if(cmdActiveId(Chi)!=='us-grant') throw new Error('with ample capital the appointment should succeed');
      if(!(Chi.clock.capital<cap0)) throw new Error('appointment should spend political capital: '+cap0+'->'+Chi.clock.capital);
      return { blockedWhenPoor:true, capSpent:cap0-Chi.clock.capital }; });

    step('the general temperament nudges the auto-resolve margin (deterministic, signed)', function(){
      if(typeof commandMarginEdge!=='function') throw new Error('commandMarginEdge missing');
      var C=mkC('CS',1863,3); var t=cmdActiveTraits(C);
      var atk=commandMarginEdge(C,true), def=commandMarginEdge(C,false);
      var atk2=commandMarginEdge(C,true);
      if(atk!==atk2) throw new Error('margin edge must be deterministic: '+atk+' vs '+atk2);
      var wantAtk=(t.aggression-50)*0.04, wantDef=(t.caution-50)*0.04;
      if(Math.abs(atk-wantAtk)>1e-9) throw new Error('attack edge should follow aggression: '+atk+' vs '+wantAtk);
      if(Math.abs(def-wantDef)>1e-9) throw new Error('defend edge should follow caution: '+def+' vs '+wantDef);
      if(Math.abs(atk)>3||Math.abs(def)>3) throw new Error('margin edge must stay small (|.|<=3): '+atk+'/'+def);
      return { traits:t, attackEdge:Math.round(atk*100)/100, defendEdge:Math.round(def*100)/100 }; });

    step('the general is confined to the BRIDGE/auto-resolve, NOT the m3 morale leader layer (D53 decoupling)', function(){
      var grant=_cmdById('US','us-grant'), poor=_cmdById('US','us-burnside')||_cmdById('US','us-mcclellan');
      if(!grant||!poor) return { skipped:'need grant + a poor general' };
      var Cg=mkC('US',1863,3); Cg.clock.capital=100; Cg.stats.won=4; Cg.stats.battles=8; cmdAppoint(Cg,'us-grant');
      var Cp=mkC('US',1863,3); Cp.clock.capital=100; Cp.stats.won=4; Cp.stats.battles=8; cmdAppoint(Cp,poor.id);
      // the general DOES move the army the war fields (the real, intended coupling)...
      if(!(bridgeArmy(Cg).overall > bridgeArmy(Cp).overall)) throw new Error('the general should move the bridge army: '+bridgeArmy(Cg).overall+' vs '+bridgeArmy(Cp).overall);
      // ...but the morale LEADER layer stays cabinet-driven (same cabinet -> identical leader morale): D53,
      // so the cabinet-isolating morale probe is not confounded by the general.
      if(moraleCompute(Cg).leader !== moraleCompute(Cp).leader) throw new Error('the leader layer should stay cabinet-driven (D53), got '+moraleCompute(Cg).leader+' vs '+moraleCompute(Cp).leader);
      return { grantOverall:bridgeArmy(Cg).overall, poorOverall:bridgeArmy(Cp).overall, leaderMoraleBoth:moraleCompute(Cg).leader }; });

    step('the appointee LOCKS until revert; revert restores the historical command', function(){
      var grant=_cmdById('US','us-grant'); if(!grant) return { skipped:'no us-grant' };
      var C=mkC('US',1862,9); C.clock.capital=80; cmdAppoint(C,'us-grant');
      if(cmdActiveId(C)!=='us-grant') throw new Error('appoint failed');
      if(C.president.command.fieldGeneral!=='us-grant') throw new Error('fieldGeneral should be locked to the appointee');
      cmdRevert(C);
      if(C.president.command.fieldGeneral!==null) throw new Error('revert should clear the appointment');
      var def=cmdActiveGeneral(C); if(!def) throw new Error('no historical default after revert');
      return { revertedTo:def.id }; });

    step('the bridgeArmy<->cabinet recursion guard holds under a moderately-ambitious War Sec (D53.4)', function(){
      // force the latent cycle: a War Secretary with ambition in [45,75) + an ambitionTell makes
      // cabinetLeadership -> _cabAmbitionActive -> _cabReading('war') -> bridgeArmy, which (via the m5
      // leadership wiring) re-enters bridgeArmy. The guard must break it (no stack overflow).
      var C=mkC('US',1863,6);
      var ws=(typeof _cabHolder==='function')?_cabHolder('US','war',C.president.date):null;
      if(!ws) return { skipped:'no war secretary' };
      var oldAmb=ws.ambition, oldTell=ws.ambitionTell;
      ws.ambition=60; ws.ambitionTell=oldTell||'(probe) presses his own interest';
      var threw=false, ov=null, cl=null;
      try { ov=bridgeArmy(C).overall; cl=commandLeadership(C); cabinetLeadership(C); }
      catch(e){ threw=true; }
      finally { ws.ambition=oldAmb; ws.ambitionTell=oldTell; }
      if(threw) throw new Error('recursion guard failed — bridgeArmy/cabinet recursed to overflow');
      if(!(ov>0&&ov<=100)) throw new Error('bridgeArmy.overall invalid under the guard: '+ov);
      if(!(cl>=42&&cl<=88)) throw new Error('commandLeadership out of band under the guard: '+cl);
      return { overall:ov, commandLeadership:cl, guarded:true }; });

    step('post-war the command falls to the LAST commander, not back to the first (D53.5)', function(){
      var C=mkC('US',1866,6);   // past every US tenure end
      var g=cmdActiveGeneral(C);
      if(!g) throw new Error('no commander past the war');
      if(g.id==='us-scott') throw new Error('post-war jumped back to the first commander (Scott)');
      return { postWarCommander:g.id }; });

    step('CS player sees only CS generals; appoint flow is side-correct', function(){
      var C=mkC('CS',1863,3); C.clock.capital=80;
      var cs=_cmdSideGenerals('CS'); if(cs.some(function(g){return g.side!=='CS';})) throw new Error('CS roster has a non-CS general');
      if(_cmdById('CS','us-grant')) throw new Error('a US general leaked into the CS roster');
      var html=cmdRenderTab(C); if(html.indexOf('generals at your call')<0) throw new Error('CS command tab missing the pool');
      return { csGenerals:cs.length, len:html.length }; });

    step('cmdRenderTab renders the commander + the pool + a teaching card', function(){
      var C=mkC('US',1863,3); var html=cmdRenderTab(C);
      var g=cmdActiveGeneral(C);
      if(g && html.indexOf(g.fullName||g.name.replace(/-[A-Za-z]$/,''))<0 && html.indexOf(g.name.replace(/-[A-Za-z]$/,''))<0) throw new Error('render missing the active commander');
      if(html.indexOf('generals at your call')<0) throw new Error('render missing the pool');
      return { len:html.length, active:(g?g.id:null) }; });

    step('R-1: cmdActiveTraits.skill + the rendered Skill bar read the persona-DERIVED _cmdEffectiveSkill (ONE source of truth, no drift)', function(){
      if(typeof _cmdEffectiveSkill!=='function') return { skipped:'no _cmdEffectiveSkill (pre-R-1 build)' };
      var C=mkC('US',1863,3); C.clock.capital=100; cmdAppoint(C,'us-grant');
      var g=cmdActiveGeneral(C); if(!g) throw new Error('no active general');
      var eff=_cmdEffectiveSkill(g);
      if(cmdActiveTraits(C).skill!==eff) throw new Error('cmdActiveTraits.skill '+cmdActiveTraits(C).skill+' != _cmdEffectiveSkill '+eff+' (source-of-truth drift)');
      var html=cmdRenderTab(C);
      if(html.indexOf('Skill</span><span>'+eff+'</span>')<0) throw new Error('the rendered Skill bar does not show the effective skill '+eff+' (display reads a stale source)');
      return { general:g.id, effectiveSkill:eff }; });

    // helper: read a general's current reputation
    function C0rep(C,id){ return (C.president&&C.president.command&&typeof C.president.command.reputation[id]==='number')?C.president.command.reputation[id]:60; }
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
    writeFileSync(join(OUT,'probe-command.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-command ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.steps) for (const s of result.steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
})();
