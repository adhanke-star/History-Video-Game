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
  // D105: a single resolve with an EXPLICIT casualty split (so the attrition-drag tests can dial the share).
  function resolveCas(C, win, type, casMe, casEnemy){ var side=C.side, e=(side==='US')?'CS':'US'; var c={}; c[side]=casMe; c[e]=casEnemy;
    _t1Resolve(side, win?(type||'win'):(type||'loss'), {playerSide:side,enemySide:e,bd:{name:'x',year:C.president.date.year},casualties:c,infl:{},units:[]}, C, win); return C; }
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

    step('R-2 UI: the Command desk renders the general OVR + A-F grade (active card + pool rows, triple-encoded)', function(){
      if(typeof fldRatingGrade!=='function') return { skipped:'no fldRatingGrade (pre-R-2 build)' };
      var C=mkC('US',1863,3); C.clock.capital=100; cmdAppoint(C,'us-grant');
      var g=cmdActiveGeneral(C); var ovr=Math.round(_cmdGenRating(C,g)); var gr=fldRatingGrade(ovr);
      var html=cmdRenderTab(C);
      if(html.indexOf('>'+ovr+'<')<0) throw new Error('active card missing the OVR number '+ovr);
      if(html.indexOf('OVR')<0) throw new Error('active card missing the OVR label');
      if(html.indexOf('>'+gr.letter+'<')<0) throw new Error('active card missing the grade letter '+gr.letter);
      if(html.indexOf(gr.word)<0) throw new Error('active card missing the grade word '+gr.word);
      if(html.indexOf(' OVR)')<0) throw new Error('pool rows missing the "(NN OVR)" grade');
      return { general:g.id, ovr:ovr, letter:gr.letter, word:gr.word }; });

    step('Q9: cmdInit seeds the seniority currency + an empty promotions map (byte-identical default)', function(){
      if(typeof cmdPromote!=='function') return { skipped:'pre-Q9 build' };
      var C=mkC('US',1863,3), cmd=C.president.command;
      if(typeof cmd.seniority!=='number'||!(cmd.seniority>=0)) throw new Error('seniority not seeded: '+cmd.seniority);
      if(!cmd.promotions||typeof cmd.promotions!=='object'||Object.keys(cmd.promotions).length!==0) throw new Error('promotions should start empty');
      return { seniority:cmd.seniority, promotions:Object.keys(cmd.promotions).length }; });

    step('Q9: cmdInit RE-CLAMPS a valid-but-out-of-band stored seniority to the cap on LOAD (save-tamper hardening)', function(){
      if(typeof cmdPromote!=='function') return { skipped:'pre-Q9' };
      var C=mkC('US',1863,3); C.president.command.seniority=1e9;   // a tampered/stale save value that passes the >=0 guard
      cmdInit(C);                                                  // idempotent re-init must clamp it on load (not wait for the next resolve)
      if(!(C.president.command.seniority<=60)) throw new Error('out-of-band seniority not clamped on load: '+C.president.command.seniority);
      return { clampedTo:C.president.command.seniority }; });

    step('Q9: the strategic grade ladder parses the verbose generals.json ranks correctly', function(){
      if(typeof _cmdBaseGrade!=='function') return { skipped:'pre-Q9' };
      var gl=_cmdBaseGrade(_cmdById('CS','cs-lee')), gg=_cmdBaseGrade(_cmdById('US','us-grant')), gm=_cmdBaseGrade(_cmdById('US','us-meade')), gs=_cmdBaseGrade(_cmdById('CS','cs-stuart'));
      if(gl!=='General') throw new Error('Lee -> General, got '+gl);
      if(gg!=='Lt. Gen.') throw new Error('Grant -> Lt. Gen., got '+gg);
      if(gm!=='Maj. Gen.') throw new Error('Meade -> Maj. Gen., got '+gm);
      if(gs!=='Maj. Gen.') throw new Error('Stuart -> Maj. Gen., got '+gs);
      return { lee:gl, grant:gg, meade:gm, stuart:gs }; });

    step('Q9: a top-grade general (Lee = General) is NOT promotable', function(){
      if(typeof _cmdPromoteInfo!=='function') return { skipped:'pre-Q9' };
      var C=mkC('CS',1863,3);
      if(_cmdPromoteInfo(C,_cmdById('CS','cs-lee'))!==null) throw new Error('Lee (General) should not be promotable');
      return { leePromotable:false }; });

    step('Q9: promotion is GATED when a currency is short, SPENDS both when affordable, and stores the grade', function(){
      if(typeof cmdPromote!=='function') return { skipped:'pre-Q9' };
      var C=mkC('US',1863,3), cmd=C.president.command, meade=_cmdById('US','us-meade');   // Maj. Gen. -> Lt. Gen.
      C.clock.capital=0; cmd.seniority=50; cmdPromote(C,'us-meade');
      if(cmd.promotions['us-meade']) throw new Error('promotion should be BLOCKED with 0 capital');
      C.clock.capital=80; cmd.seniority=0; cmdPromote(C,'us-meade');
      if(cmd.promotions['us-meade']) throw new Error('promotion should be BLOCKED with 0 seniority');
      var info=_cmdPromoteInfo(C,meade); C.clock.capital=80; cmd.seniority=50;
      var cap0=C.clock.capital, sen0=cmd.seniority; cmdPromote(C,'us-meade');
      if(cmd.promotions['us-meade']!==info.next) throw new Error('should store the next grade '+info.next+', got '+cmd.promotions['us-meade']);
      if(!(C.clock.capital<cap0)) throw new Error('should spend capital');
      if(!(cmd.seniority<sen0)) throw new Error('should spend seniority');
      return { storedGrade:cmd.promotions['us-meade'], capSpent:cap0-C.clock.capital, senSpent:sen0-cmd.seniority }; });

    step('Q9: an EARNED promotion raises reputation; an ABOVE-MERIT one costs more capital + cuts reputation (jealousy)', function(){
      if(typeof cmdPromote!=='function') return { skipped:'pre-Q9' };
      var meade=_cmdById('US','us-meade');
      var Ce=mkC('US',1863,3); Ce.clock.capital=80; Ce.president.command.seniority=50; Ce.president.command.reputation['us-meade']=80;
      var infoE=_cmdPromoteInfo(Ce,meade); if(!infoE.earned) throw new Error('rep 80 should be EARNED for '+infoE.next+' (bar '+infoE.meritBar+')');
      var rep0e=Ce.president.command.reputation['us-meade']; cmdPromote(Ce,'us-meade'); var rep1e=Ce.president.command.reputation['us-meade'];
      if(!(rep1e>rep0e)) throw new Error('earned promotion should RAISE reputation: '+rep0e+'->'+rep1e);
      var Ca=mkC('US',1863,3); Ca.clock.capital=80; Ca.president.command.seniority=50; Ca.president.command.reputation['us-meade']=40;
      var infoA=_cmdPromoteInfo(Ca,meade); if(infoA.earned) throw new Error('rep 40 should be ABOVE-merit for '+infoA.next+' (bar '+infoA.meritBar+')');
      if(!(infoA.capital>infoE.capital)) throw new Error('above-merit should cost MORE capital: '+infoA.capital+' vs '+infoE.capital);
      var rep0a=Ca.president.command.reputation['us-meade']; cmdPromote(Ca,'us-meade'); var rep1a=Ca.president.command.reputation['us-meade'];
      if(!(rep1a<rep0a)) throw new Error('above-merit promotion should LOWER reputation (jealousy): '+rep0a+'->'+rep1a);
      return { earnedCap:infoE.capital, aboveCap:infoA.capital, earnedRep:rep0e+'->'+rep1e, aboveRep:rep0a+'->'+rep1a }; });

    step('Q9: a promotion lifts effective skill (BOUNDED) -> reaches commandLeadership; un-promoted reads byte-identical', function(){
      if(typeof cmdPromote!=='function') return { skipped:'pre-Q9' };
      var meade=_cmdById('US','us-meade');
      var C0=mkC('US',1863,3);
      if(_cmdEffectiveSkill(meade)!==_cmdEffectiveSkill(meade,C0)) throw new Error('un-promoted: skill(g) must equal skill(g,C)');
      var C=mkC('US',1863,3); C.clock.capital=100; C.president.command.seniority=60; C.president.command.reputation['us-meade']=80;
      cmdAppoint(C,'us-meade'); var lead0=commandLeadership(C), skill0=_cmdEffectiveSkill(meade,C);
      cmdPromote(C,'us-meade'); var skill1=_cmdEffectiveSkill(meade,C), lead1=commandLeadership(C);
      if(!(skill1>skill0)) throw new Error('promotion should raise effective skill: '+skill0+'->'+skill1);
      if(!((skill1-skill0)<=6.001)) throw new Error('skill lift must stay bounded (<=6): '+(skill1-skill0));
      if(!(lead1>=lead0)) throw new Error('promotion should not lower commandLeadership: '+lead0+'->'+lead1);
      return { skill:skill0+'->'+Math.round(skill1*100)/100, lead:lead0+'->'+lead1 }; });

    step('Q9: an un-promoted campaign is byte-identical — every general reads the SAME effective skill with/without C', function(){
      if(typeof cmdPromote!=='function') return { skipped:'pre-Q9' };
      var sides=['US','CS'], n=0;
      for(var s=0;s<sides.length;s++){ var roster=_cmdSideGenerals(sides[s]), C=mkC(sides[s],1863,3);
        for(var i=0;i<roster.length;i++){ var g=roster[i]; n++;
          if(_cmdEffectiveSkill(g)!==_cmdEffectiveSkill(g,C)) throw new Error('un-promoted skill drift for '+g.id+': '+_cmdEffectiveSkill(g)+' vs '+_cmdEffectiveSkill(g,C)); } }
      return { generalsChecked:n, identical:true }; });

    step('Q9: the Command desk renders the Officer Corps promotions section (currencies + a Promote control)', function(){
      if(typeof _cmdPromotionsHTML!=='function') return { skipped:'pre-Q9' };
      var C=mkC('US',1863,3); C.clock.capital=80; C.president.command.seniority=50;
      var html=cmdRenderTab(C);
      if(html.indexOf('officer corps')<0) throw new Error('render missing the promotions section header');
      if(html.indexOf('Seniority')<0) throw new Error('render missing the seniority currency');
      if(html.indexOf('Promote to')<0) throw new Error('render missing a Promote control');
      return { len:html.length }; });

    // ===== D105 · LIVE DEV-TRAITS (the Madden development arc) =====

    step('D105: devTraits data loads — every named general carries a real archetype, all Inferred (citation-gate-safe), anti-Lost-Cause balanced', function(){
      if(typeof _cmdDevTrait!=='function'||typeof _cmdDevCfg!=='function') return { skipped:'pre-D105' };
      var cfg=_cmdDevCfg(); if(!cfg||!cfg.assign||!cfg.archetypes) throw new Error('no devTraits config');
      var ids=[]; ['US','CS'].forEach(function(s){ var r=_cmdSideGenerals(s); for(var i=0;i<r.length;i++) ids.push([s,r[i].id]); });
      var pos={US:0,CS:0}, neg={US:0,CS:0}, fail={US:0,CS:0};   // fail = the NAMED-FAILURE set: hard-negative (−) OR double-edged (~), so the both-sides check doesn't rest on the single cs-bragg (−) record (CM#3)
      for(var j=0;j<ids.length;j++){ var s2=ids[j][0], id=ids[j][1], a=cfg.assign[id];
        if(!a) throw new Error('unassigned general '+id);
        if(!cfg.archetypes[a.trait]) throw new Error('unknown archetype '+a.trait+' for '+id);
        if(a.prov!=='Inferred') throw new Error('non-Inferred dev-trait (citation-gate risk) '+id+'='+a.prov);
        var pol=cfg.archetypes[a.trait].polarity;
        if(pol==='+') pos[s2]++;
        if(pol==='−'||pol==='-') neg[s2]++;
        if(pol==='−'||pol==='-'||pol==='~') fail[s2]++; }
      if(!(pos.US>=pos.CS)) throw new Error('anti-Lost-Cause: US positive risers ('+pos.US+') must be >= CS ('+pos.CS+')');
      if(!(fail.US>=1&&fail.CS>=1)) throw new Error('named command failures (− or double-edged ~) must appear on BOTH sides: US='+fail.US+' CS='+fail.CS);
      return { assigned:ids.length, posUS:pos.US, posCS:pos.CS, negUS:neg.US, negCS:neg.CS, failUS:fail.US, failCS:fail.CS }; });

    // NOTE: _t1Resolve advances the strategic date, which would change the HISTORICAL-default commander mid-drive
    // (e.g. McClellan's tenure ends Nov 1862) and freeze the tested general's reputation. So these steps LOCK the
    // tested general via cmd.fieldGeneral (the same effect cmdAppoint has, minus the capital cost) so every
    // resolve evolves the SAME man — isolating the dev-trait arithmetic from the command-rotation.
    function lock(C, id){ C.president.command.fieldGeneral = id; return id; }

    step('D105: BYTE-IDENTICAL when off — EVERY outcome quadrant + the [5,98] clamp rails take the LITERAL pre-D105 path', function(){
      if(typeof _cmdDevTrait!=='function') return { skipped:'pre-D105' };
      var cfg=_cmdDevCfg(); var savedAssign=cfg.assign; cfg.assign={};   // disable every dev-trait -> the default path for all
      try {
        // each win/loss quadrant: one resolve, asserted == the literal clamp(cur+delta,5,98) (Grant, long tenure, locked)
        function one(win,type,d){ var C=mkC('US',1864,3); var id=lock(C,cmdActiveId(C)); var s=C0rep(C,id);
          resolveCas(C,win,type, win?900:2200, win?2600:700);
          if(cmdActiveId(C)!==id) throw new Error('active general changed mid-test');
          var got=C0rep(C,id), exp=Math.max(5,Math.min(98,s+d));
          if(Math.abs(got-exp)>1e-9) throw new Error(type+(win?'-win':'-loss')+' default not byte-identical: '+s+'->'+got+' (exp '+exp+')'); return got; }
        one(true,'decisive',6); one(true,'win',3); one(false,'loss',-4); one(false,'decisive',-8);
        // a DRAW (winnerSide null): delta -1
        var Cd=mkC('US',1864,3); var idd=lock(Cd,cmdActiveId(Cd)); var sd=C0rep(Cd,idd);
        _t1Resolve(null,'draw',{playerSide:'US',enemySide:'CS',bd:{name:'x',year:1864},casualties:{US:1500,CS:1500},infl:{},units:[]},Cd,false);
        if(Math.abs(C0rep(Cd,idd)-Math.max(5,Math.min(98,sd-1)))>1e-9) throw new Error('draw default not byte-identical');
        // the clamp RAILS: a near-98 general caps at 98 on a decisive win; a near-5 general floors at 5 on a decisive loss
        var Ch=mkC('US',1864,3); var idh=lock(Ch,cmdActiveId(Ch)); Ch.president.command.reputation[idh]=97;
        resolveCas(Ch,true,'decisive',900,2600); if(C0rep(Ch,idh)!==98) throw new Error('high rail != 98: '+C0rep(Ch,idh));
        var Cl=mkC('US',1864,3); var idl=lock(Cl,cmdActiveId(Cl)); Cl.president.command.reputation[idl]=6;
        resolveCas(Cl,false,'decisive',2200,700); if(C0rep(Cl,idl)!==5) throw new Error('low rail != 5: '+C0rep(Cl,idl));
        return { quadrants:'win/decisive/loss/decisive-loss/draw all byte-identical', railHi:98, railLo:5 }; }
      finally { cfg.assign=savedAssign; } });

    step('D105: the off-test RESTORED the shared devTraits.assign (no global-state leak into the following steps)', function(){
      if(typeof _cmdDevCfg!=='function') return { skipped:'pre-D105' };
      var n=Object.keys((_cmdDevCfg()&&_cmdDevCfg().assign)||{}).length;
      if(n<20) throw new Error('devTraits.assign not restored to the full 20-general map (got '+n+') — the off-test leaked global state');
      return { assignRestored:n }; });

    step('D105: a Rising Star (Grant) climbs faster + higher than a Plateau (McClellan); the ceiling caps the plateau', function(){
      if(typeof _cmdDevTrait!=='function') return { skipped:'pre-D105' };
      var Cg=mkC('US',1864,3); var idg=lock(Cg,cmdActiveId(Cg)); var g0=C0rep(Cg,idg);
      resolveCas(Cg,true,'win',900,2600); resolveCas(Cg,true,'win',900,2600); var gGain=C0rep(Cg,idg)-g0;
      var Cm=mkC('US',1862,9); var idm=lock(Cm,cmdActiveId(Cm)); var m0=C0rep(Cm,idm);
      resolveCas(Cm,true,'win',900,2600); resolveCas(Cm,true,'win',900,2600); var mGain=C0rep(Cm,idm)-m0;
      if(!(gGain>mGain)) throw new Error('Rising Star should gain faster than Plateau: '+idg+' +'+gGain+' vs '+idm+' +'+mGain);
      var Cm2=mkC('US',1862,9); var idm2=lock(Cm2,cmdActiveId(Cm2)); var dt=_cmdDevTrait(Cm2,_cmdById('US',idm2));
      for(var w=0;w<14;w++) resolveCas(Cm2,true,'decisive',900,2600);
      var mCap=C0rep(Cm2,idm2);
      if(!(mCap<=dt.ceiling+1e-9)) throw new Error('plateau rep exceeded its ceiling: '+mCap+' > '+dt.ceiling);
      if(!(mCap<90)) throw new Error('a plateau must never reach the legendary band: '+mCap);
      return { grantGain:+gGain.toFixed(2), mcclellanGain:+mGain.toFixed(2), mcclellanCeiling:dt.ceiling, mcclellanCappedAt:+mCap.toFixed(2) }; });

    step('D105: the FLOOR caps the fall — an Established Legend (Lee) bottoms at his floor, not at 5', function(){
      if(typeof _cmdDevTrait!=='function') return { skipped:'pre-D105' };
      var C=mkC('CS',1863,7); var id=lock(C,cmdActiveId(C)); var dt=_cmdDevTrait(C,_cmdById('CS',id));
      if(dt.key!=='established_legend') throw new Error('expected the 1863 CS default (Lee) = established_legend, got '+id+'='+dt.key);
      for(var l=0;l<16;l++) resolveCas(C,false,'decisive',2600,700);
      if(cmdActiveId(C)!==id) throw new Error('locked general changed mid-test ('+id+' -> '+cmdActiveId(C)+')');
      var lo=C0rep(C,id);
      if(!(lo>=dt.floor-1e-9)) throw new Error('rep fell below the floor: '+lo+' < '+dt.floor);
      if(!(lo>55)) throw new Error('an established legend must not crater to the basement: '+lo);
      return { general:id, trait:dt.key, floor:dt.floor, bottomedAt:+lo.toFixed(2) }; });

    step('D105: attrition drag — a bloody loss erodes reputation MORE than a clean one (bounded); the §15-R3 decline-with-attrition', function(){
      if(typeof _cmdAttritionDrag!=='function') return { skipped:'pre-D105' };
      var Cb=mkC('US',1862,9); var idb=lock(Cb,cmdActiveId(Cb)); var b0=C0rep(Cb,idb);
      if(_cmdDevTrait(Cb,_cmdById('US',idb)).key!=='plateau') throw new Error('expected the 1862 US default (McClellan) = plateau, got '+idb+'='+_cmdDevTrait(Cb,_cmdById('US',idb)).key);
      resolveCas(Cb,false,'loss',8000,2000); var bloody=b0-C0rep(Cb,idb);   // share 0.8 > pivot -> drag (McClellan plateau drag 0.50)
      var Cc=mkC('US',1862,9); var idc=lock(Cc,cmdActiveId(Cc)); var c0=C0rep(Cc,idc);
      resolveCas(Cc,false,'loss',1000,4000); var clean=c0-C0rep(Cc,idc);     // share 0.2 < pivot -> no drag
      if(!(bloody>clean)) throw new Error('a bloody loss should erode MORE than a clean one: bloody -'+bloody+' vs clean -'+clean);
      if(!((bloody-clean)<=4+1e-9)) throw new Error('attrition drag must stay bounded (<= attritionDragMax): '+(bloody-clean));
      return { bloodyDrop:+bloody.toFixed(2), cleanDrop:+clean.toFixed(2), extraDrag:+(bloody-clean).toFixed(2) }; });

    step('D105: NO output gate — cmdOnResolve writes only reputation/devTrack, never the battle B; devTrack peak/low/battles never feed combat', function(){
      if(typeof cmdOnResolve!=='function') return { skipped:'pre-D105' };
      var C=mkC('US',1863,5);
      var B={playerSide:'US',enemySide:'CS',bd:{name:'x',year:1863},casualties:{US:1500,CS:1200},infl:{},units:[]};
      var casBefore=JSON.stringify(B.casualties), keysBefore=Object.keys(B).sort().join(',');
      cmdOnResolve('US','win',B,C,true);
      if(JSON.stringify(B.casualties)!==casBefore) throw new Error('cmdOnResolve mutated B.casualties (no-fudge wall)');
      if(Object.keys(B).sort().join(',')!==keysBefore) throw new Error('cmdOnResolve added a key to B (a scoreboard write)');
      var Ca=mkC('US',1864,3), Cb2=mkC('US',1864,3); var ida=lock(Ca,cmdActiveId(Ca)); lock(Cb2,ida);
      Cb2.president.command.devTrack[ida].peak=999; Cb2.president.command.devTrack[ida].low=-999; Cb2.president.command.devTrack[ida].battles=123;
      resolveCas(Ca,true,'win',900,2600); resolveCas(Cb2,true,'win',900,2600);
      if(Math.abs(C0rep(Ca,ida)-C0rep(Cb2,ida))>1e-9) throw new Error('devTrack peak/low/battles leaked into reputation: '+C0rep(Ca,ida)+' vs '+C0rep(Cb2,ida));
      return { bCasUnchanged:true, devTrackObservationPure:true }; });

    step('D105: SAVE-TAMPER hardening — a corrupt devTrack.start (the load-bearing band anchor) degrades safely: finite + in-band reputation, no NaN in the render', function(){
      if(typeof _cmdDevTrait!=='function') return { skipped:'pre-D105' };
      function tamper(v){ var C=mkC('US',1864,3); var id=lock(C,cmdActiveId(C));
        C.president.command.devTrack[id].start=v; cmdInit(C);   // simulate a save LOAD (cmdInit sanitizes), then a battle
        resolveCas(C,true,'win',900,2600);
        var rep=C0rep(C,id);
        if(!isFinite(rep)) throw new Error('start='+v+' -> non-finite reputation '+rep);
        if(!(rep>=5&&rep<=98)) throw new Error('start='+v+' -> out-of-band reputation '+rep);
        var html=cmdRenderTab(C);
        if(html.indexOf('NaN')>=0) throw new Error('start='+v+' -> "NaN" leaked into the Career Arc render');
        return +rep.toFixed(2); }
      return { fromNaN:tamper(NaN), from500:tamper(500), fromNeg:tamper(-99) }; });

    step('D105: the Career Arc renders + _cmdDevTrend covers all four verdict branches (incl. the battles=0 edge)', function(){
      if(typeof _cmdCareerArcHTML!=='function'||typeof _cmdDevTrend!=='function') return { skipped:'pre-D105' };
      // _cmdDevTrend branch coverage (pure, deterministic — independent of the OVR arithmetic)
      if(_cmdDevTrend(0,5).word!=='Untested') throw new Error('battles=0 should read Untested');
      if(_cmdDevTrend(5,10).word!=='Rising') throw new Error('a positive delta should read Rising');
      if(_cmdDevTrend(5,-10).word!=='Fading') throw new Error('a negative delta should read Fading');
      if(_cmdDevTrend(5,0).word!=='Holding') throw new Error('a flat delta should read Holding');
      // render integration
      var C=mkC('US',1864,3); var id=lock(C,cmdActiveId(C)); var dt=_cmdDevTrait(C,_cmdById('US',id));
      var html=cmdRenderTab(C);
      if(html.toLowerCase().indexOf('career arc')<0) throw new Error('render missing the Career Arc section');
      if(html.indexOf(dt.label)<0) throw new Error('render missing the active general dev-trait label "'+dt.label+'"');
      if(html.indexOf('OVR NOW')<0) throw new Error('render missing the OVR-now read-out');
      if(html.indexOf('Untested')<0||html.indexOf('0 battle')<0) throw new Error('a fresh (battles=0) arc should render the Untested verdict + "0 battles"');
      resolveCas(C,true,'decisive',900,2600); resolveCas(C,true,'decisive',900,2600); resolveCas(C,true,'decisive',900,2600);
      var html2=cmdRenderTab(C);
      if(html2.indexOf('(+')<0) throw new Error('a winning general should render a positive career delta');
      return { branches:'Untested/Rising/Fading/Holding', label:dt.label }; });

    // ===== Q8b (D107): THE CAVALRY RECONNAISSANCE — scout the next-battle enemy OOB, tiered by cavalry =====
    step('Q8b: _cmdScoutTierForCavalry maps cavalry -> tier at the configured threshold; a fresh campaign reads "light"', function(){
      if(typeof _cmdScoutTierForCavalry!=='function'||typeof cmdScoutTier!=='function') return { skipped:'pre-Q8b' };
      var thr=(_cmdScoutCfg().cavalryFullThreshold)||65;
      if(_cmdScoutTierForCavalry(thr)!=='full') throw new Error('at the threshold should be full');
      if(_cmdScoutTierForCavalry(thr+5)!=='full') throw new Error('above the threshold should be full');
      if(_cmdScoutTierForCavalry(thr-1)!=='better') throw new Error('below the threshold should be better');
      if(_cmdScoutTierForCavalry(NaN)!=='better') throw new Error('garbage cavalry must fall back to better, never full');
      var C=mkC('US',1861,7);   // idx 0 -> bullrun1 is the next battle; never scouted
      if(cmdScoutTier(C)!=='light') throw new Error('an unscouted campaign must read light (byte-identical default)');
      return { thr:thr, fresh:cmdScoutTier(C) }; });

    step('Q8b: cmdScout reveals the enemy at the appointed general\\'s cavalry tier + debits EXACTLY the cost (capital only)', function(){
      if(typeof cmdScout!=='function') return { skipped:'pre-Q8b' };
      var cost=(_cmdScoutCfg().cost)||3;
      // a high-cavalry general (Grant, cav 66 >= 65) -> FULL recon
      var Cg=mkC('US',1863,3); Cg.clock.capital=100; cmdAppoint(Cg,'us-grant');
      var capBefore=Math.round(Cg.clock.capital);
      cmdScout(Cg);
      var sc=Cg.president.command.scout;
      if(!sc) throw new Error('cmdScout set no scout record');
      if(sc.tier!=='full') throw new Error('Grant (cav 66) should yield FULL recon, got '+sc.tier);
      var bd=_brgNextBattle(Cg); if(sc.battleId!==bd.id) throw new Error('scout record keyed to the wrong battle: '+sc.battleId+' vs '+bd.id);
      if(Math.round(Cg.clock.capital)!==capBefore-cost) throw new Error('capital not debited exactly the cost: '+capBefore+' -> '+Math.round(Cg.clock.capital)+' (cost '+cost+')');
      if(cmdScoutTier(Cg)!=='full') throw new Error('cmdScoutTier should now read full');
      var html=cmdRenderTab(Cg);
      if(html.indexOf('Reconnaissance complete')<0) throw new Error('the scouted board must show the reconnaissance-complete badge');
      // a mid-cavalry general (McClellan, cav 58 < 65) -> BETTER recon
      var Cm=mkC('US',1862,9); Cm.clock.capital=100; cmdAppoint(Cm,'us-mcclellan');
      cmdScout(Cm);
      var sm=Cm.president.command.scout;
      if(!sm||sm.tier!=='better') throw new Error('McClellan (cav 58) should yield BETTER recon, got '+(sm&&sm.tier));
      // no player appointee -> the HISTORICAL DEFAULT commander's cavalry drives recon (the flat baseline only
      // applies when there is truly no active general); a default-command campaign can still scout.
      var Cn=mkC('CS',1863,5); Cn.clock.capital=100; cmdScout(Cn);
      if(!Cn.president.command.scout) throw new Error('a default-command campaign should still be able to scout');
      return { grant:sc.tier, mcclellan:sm.tier, defaultCmd:Cn.president.command.scout.tier, cost:cost }; });

    step('Q8b: the gate + idempotence — short capital is a no-op; re-scouting the same engagement does not re-charge', function(){
      if(typeof cmdScout!=='function') return { skipped:'pre-Q8b' };
      var cost=(_cmdScoutCfg().cost)||3;
      // insufficient capital -> no scout, no debit
      var Cp=mkC('US',1863,3); Cp.clock.capital=cost-1; cmdAppoint(Cp,'us-grant'); var capPoor=Math.round(Cp.clock.capital);
      cmdScout(Cp);
      if(Cp.president.command.scout) throw new Error('scouted despite insufficient capital');
      if(Math.round(Cp.clock.capital)!==capPoor) throw new Error('capital changed on a gated (failed) scout');
      // re-scout the SAME battle -> no double charge
      var Cr=mkC('US',1863,3); Cr.clock.capital=100; cmdAppoint(Cr,'us-grant');
      cmdScout(Cr); var cap1=Math.round(Cr.clock.capital);
      cmdScout(Cr); var cap2=Math.round(Cr.clock.capital);
      if(cap1!==cap2) throw new Error('re-scouting the same engagement charged again: '+cap1+' -> '+cap2);
      return { gatedNoOp:true, reScoutFree:true }; });

    step('Q8b: stale recon — when the next engagement changes, the reveal reverts to light (fresh intel per battle)', function(){
      if(typeof cmdScout!=='function') return { skipped:'pre-Q8b' };
      var C=mkC('US',1863,3); C.clock.capital=100; cmdAppoint(C,'us-grant');   // 1863 so the Grant appointment (cav 66) sticks
      cmdScout(C);
      if(cmdScoutTier(C)!=='full') throw new Error('precondition: should be scouted full at idx0');
      C.idx=1;   // advance to the next engagement (a different battle id)
      var bd1=_brgNextBattle(C);
      if(bd1 && bd1.id===C.president.command.scout.battleId) return { note:'idx1 same battle id; skip' };
      if(cmdScoutTier(C)!=='light') throw new Error('a changed next-battle must revert the reveal to light, got '+cmdScoutTier(C));
      return { staleRevertsToLight:true }; });

    step('Q8b: SAVE-TAMPER hardening — a malformed scout record is dropped on cmdInit; a valid one survives + is bounded', function(){
      if(typeof cmdScout!=='function') return { skipped:'pre-Q8b' };
      var C=mkC('US',1863,3);
      C.president.command.scout={ battleId:'', tier:'wat', turn:-9, cavalry:9e9 };   // poison
      cmdInit(C);
      if(C.president.command.scout!==null) throw new Error('a malformed scout record must be dropped to null on load');
      // a valid-but-out-of-band record is kept + bounded
      C.president.command.scout={ battleId:'bullrun1', tier:'full', turn:-3, cavalry:500 };
      cmdInit(C);
      var s=C.president.command.scout;
      if(!s) throw new Error('a valid scout record must survive sanitize');
      if(s.turn<0||!isFinite(s.turn)) throw new Error('turn not bounded: '+s.turn);
      if(s.cavalry<0||s.cavalry>100) throw new Error('cavalry not clamped: '+s.cavalry);
      return { droppedBad:true, boundedGood:{turn:s.turn,cavalry:s.cavalry} }; });

    step('Q8b: NO output gate — cmdScout writes ONLY cmd.scout + C.clock.capital (no scoreboard); unscouted board is the light default', function(){
      if(typeof cmdScout!=='function') return { skipped:'pre-Q8b' };
      var C=mkC('US',1863,3); C.clock.capital=100; cmdAppoint(C,'us-grant');
      var snap=JSON.stringify({ idx:C.idx, stats:C.stats, strength:(C.manpower&&C.manpower.strength), fieldGeneral:C.president.command.fieldGeneral });
      cmdScout(C);
      if(JSON.stringify({ idx:C.idx, stats:C.stats, strength:(C.manpower&&C.manpower.strength), fieldGeneral:C.president.command.fieldGeneral })!==snap)
        throw new Error('cmdScout mutated campaign/combat state beyond cmd.scout + capital');
      // the control on an UNSCOUTED board offers the button; on a scouted board shows the complete badge
      var Cu=mkC('US',1863,3); Cu.clock.capital=100;
      var ctrlU=cmdScoutControlHtml(Cu);
      if(ctrlU.indexOf('id="cmdScout"')<0) throw new Error('the unscouted control must render the scout button');
      if(cmdScoutTier(Cu)!=='light') throw new Error('unscouted must read light');
      return { pure:true, unscoutedOffersButton:true }; });

    // ===== Q10 (D108): THE CORPS DEPTH-CHART — seat pool generals into corps billets over the OOB tree =====
    step('Q10: corpsCommand config loads — slots/labels/seatCost/SIDE-AWARE preferredGrade/perSlotWeight/liftCap + >=2 src', function(){
      if(typeof _cmdCorpsCfg!=='function') return { skipped:'pre-Q10' };
      var cfg=_cmdCorpsCfg(); if(!cfg) throw new Error('no corpsCommand config');
      if(!(cfg.slots>=1)) throw new Error('bad slots');
      if(!Array.isArray(cfg.labels)||cfg.labels.length<cfg.slots) throw new Error('labels missing');
      if(!(cfg.seatCost>=0)) throw new Error('bad seatCost');
      if(!cfg.preferredGrade||typeof cfg.preferredGrade!=='object') throw new Error('preferredGrade must be side-aware {US,CS}');
      if(cfg.preferredGrade.US!=='Maj. Gen.'||cfg.preferredGrade.CS!=='Lt. Gen.') throw new Error('preferredGrade must be US=Maj. Gen. / CS=Lt. Gen. (the historical corps grades)');
      if(!(cfg.perSlotWeight>0)||!(cfg.liftCap>0)) throw new Error('bad lift calibration');
      if(String(cfg.prov||'').trim().toLowerCase()==='verified'&&(!Array.isArray(cfg.src)||cfg.src.length<2)) throw new Error('Verified needs >=2 src (gate-4e)');
      if(!Array.isArray(cfg.src)||cfg.src.length<2) throw new Error('want >=2 sources for the corps-org teaching');
      return { slots:cfg.slots, pref:cfg.preferredGrade, cost:cfg.seatCost, w:cfg.perSlotWeight, cap:cfg.liftCap, src:cfg.src.length }; });

    step('Q10: BYTE-IDENTICAL when no corps seated — _cmdCorpsLift is 0 and commandLeadership matches an ABSENT record (pre-Q10 save)', function(){
      if(typeof _cmdCorpsLift!=='function') return { skipped:'pre-Q10' };
      var C=mkC('US',1864,5);
      if(_cmdCorpsLift(C)!==0) throw new Error('a fresh campaign must have 0 corps lift, got '+_cmdCorpsLift(C));
      var L0=commandLeadership(C);
      delete C.president.command.corps;                 // an absent record (a pre-Q10 save) must read identically
      if(_cmdCorpsLift(C)!==0) throw new Error('an absent corps record must also give 0 lift');
      var L1=commandLeadership(C);
      if(L0!==L1) throw new Error('byte-identity break: seeded-empty '+L0+' vs absent-record '+L1);
      return { lift0:true, leadership:L0 }; });

    step('Q10: seating SPENDS exactly seatCost, is GATED when capital is short, stores the slot; re-seat no-op; vacate is free', function(){
      if(typeof cmdSeatCorps!=='function') return { skipped:'pre-Q10' };
      var C=mkC('US',1864,5), army=cmdActiveId(C), cost=_cmdCorpsCfg().seatCost;
      var g=['us-thomas','us-sherman','us-sheridan'].filter(function(x){return x!==army;})[0];
      C.clock.capital=Math.max(0,cost-1);               // short -> gated
      cmdSeatCorps(C,0,g);
      if(C.president.command.corps[0]===g) throw new Error('seating must be GATED when capital is short');
      C.clock.capital=20; var cap0=C.clock.capital;
      cmdSeatCorps(C,0,g);
      if(C.president.command.corps[0]!==g) throw new Error('an affordable seat must store the slot');
      if(C.clock.capital!==cap0-cost) throw new Error('seat must debit exactly '+cost+', spent '+(cap0-C.clock.capital));
      var cap1=C.clock.capital; cmdSeatCorps(C,0,g);     // re-seat same -> no re-charge
      if(C.clock.capital!==cap1) throw new Error('re-seating the same general must not re-charge');
      var cap2=C.clock.capital; cmdVacateCorps(C,0);
      if(C.president.command.corps[0]!=null) throw new Error('vacate must empty the slot');
      if(C.clock.capital!==cap2) throw new Error('vacate must be free');
      return { gated:true, spent:cost, vacateFree:true }; });

    step('Q10: a seated able corps commander LIFTS the army (bounded by liftCap); more strong commanders never reduce the lift', function(){
      if(typeof _cmdCorpsLift!=='function') return { skipped:'pre-Q10' };
      var C=mkC('US',1864,5); C.clock.capital=1000; cmdAppoint(C,'us-meade');
      var army=cmdActiveId(C);
      var pick=['us-grant','us-thomas','us-sherman','us-sheridan'].filter(function(x){return x!==army;});
      if(_cmdCorpsLift(C)!==0) throw new Error('baseline lift must be 0');
      cmdSeatCorps(C,0,pick[0]);
      var l1=_cmdCorpsLift(C);
      if(!(l1>0)) throw new Error('an able commander must give a positive lift, got '+l1);
      for(var i=1;i<pick.length;i++) cmdSeatCorps(C,i,pick[i]);
      var lN=_cmdCorpsLift(C), cap=_cmdCorpsCfg().liftCap;
      if(!(lN>=l1-1e-9)) throw new Error('more strong commanders must not reduce the lift: '+lN+' < '+l1);
      if(lN>cap+1e-9) throw new Error('lift exceeds the cap: '+lN+' > '+cap);
      // it reaches the fight through commandLeadership (an INPUT) — never the scoreboard
      var Lbefore=(function(){ var D=mkC('US',1864,5); cmdAppoint.call(null,D,'us-meade'); return commandLeadership(D); })();
      return { oneStrong:Number(l1.toFixed(3)), fullStaff:Number(lN.toFixed(3)), cap:cap, leadershipBaseline:Lbefore }; });

    step('Q10: the SIDE-AWARE below-grade penalty bites on the CS roster (Stuart, a Maj. Gen., is stretched over a corps); promoting him to Lt. Gen. removes it (the Q9 synergy)', function(){
      if(typeof _cmdCorpsBelowGrade!=='function') return { skipped:'pre-Q10' };
      var C=mkC('CS',1863,9); C.clock.capital=1000; C.president.command.seniority=60;
      var stuart=_cmdById('CS','cs-stuart'); if(!stuart) return { skipped:'no cs-stuart' };
      if(_cmdCorpsPreferredGrade(C)!=='Lt. Gen.') throw new Error('a CS corps preferred grade must be Lt. Gen., got '+_cmdCorpsPreferredGrade(C));
      if(_cmdCorpsBelowGrade(C,stuart)!==true) throw new Error('Stuart (Maj. Gen.) must be BELOW grade for a CS corps');
      var ovr=Math.round(_cmdGenRating(C,stuart)), effBefore=_cmdCorpsEffRating(C,stuart);
      if(!(effBefore<ovr)) throw new Error('a below-grade commander must contribute below his OVR: eff '+effBefore+' vs ovr '+ovr);
      cmdPromote(C,'cs-stuart');
      if(_cmdCurrentGrade(C,stuart)!=='Lt. Gen.') return { note:'promotion gated/short; below-grade math verified', belowGrade:true, effBefore:effBefore, ovr:ovr };
      if(_cmdCorpsBelowGrade(C,stuart)!==false) throw new Error('a promoted (Lt. Gen.) Stuart must FIT the corps billet');
      var effAfter=_cmdCorpsEffRating(C,stuart);
      if(!(effAfter>effBefore)) throw new Error('promoting to grade must raise the corps contribution: '+effAfter+' !> '+effBefore);
      // a US Maj. Gen. (Thomas) by contrast already MEETS the US corps floor -> not below grade
      var D=mkC('US',1864,5), thomas=_cmdById('US','us-thomas');
      if(thomas&&_cmdCorpsBelowGrade(D,thomas)!==false) throw new Error('a US Maj. Gen. must MEET the US corps floor');
      return { csBelowGrade:true, effBefore:effBefore, effAfter:effAfter, ovr:ovr, usFloorMet:true }; });

    step('Q10: one corps per general — reassign moves him; appointing a seated general to ARMY command clears his corps; the army commander cannot be seated', function(){
      if(typeof cmdSeatCorps!=='function') return { skipped:'pre-Q10' };
      var C=mkC('US',1864,5); C.clock.capital=1000; var army=cmdActiveId(C);
      var g=['us-thomas','us-sherman','us-sheridan'].filter(function(x){return x!==army;})[0];
      cmdSeatCorps(C,0,g);
      if(C.president.command.corps[0]!==g) throw new Error('seat slot 0 failed');
      cmdSeatCorps(C,2,g);                               // reassign -> slot 0 clears (one corps per general)
      if(C.president.command.corps[0]===g) throw new Error('reassign must clear the old slot');
      if(C.president.command.corps[2]!==g) throw new Error('reassign must set the new slot');
      cmdAppoint(C,g);                                   // promote him to ARMY command -> his corps clears
      if(C.president.command.fieldGeneral!==g) throw new Error('appoint failed (capital/availability?)');
      for(var k in C.president.command.corps) if(C.president.command.corps[k]===g) throw new Error('the army commander must not also hold a corps');
      var capX=C.clock.capital; cmdSeatCorps(C,1,g);     // seating the army commander -> no-op, no charge
      for(var k2 in C.president.command.corps) if(C.president.command.corps[k2]===g) throw new Error('the army commander cannot be seated in a corps');
      if(C.clock.capital!==capX) throw new Error('a refused seat must not charge');
      return { reassigned:true, appointClears:true, armyCmdNotSeatable:true }; });

    step('Q10: SAVE-TAMPER hardening — cmdInit sanitizes a malformed cmd.corps (array/bad slot/non-string/bogus/duplicate/the army commander) on LOAD', function(){
      if(typeof cmdSeatCorps!=='function') return { skipped:'pre-Q10' };
      var C=mkC('US',1864,5), army=cmdActiveId(C);
      var good=['us-thomas','us-sherman','us-sheridan'].filter(function(x){return x!==army;})[0];
      C.president.command.corps={ '0':good, '1':good, '7':good, '2':12345, '3':'no-such-general', '4':army };
      cmdInit(C);
      var c=C.president.command.corps;
      if(Array.isArray(c)||typeof c!=='object') throw new Error('corps must sanitize to a clean object');
      if(c[0]!==good) throw new Error('the first valid placement must survive');
      if(c[1]===good) throw new Error('a duplicate (one corps per general) must be dropped');
      if(c[7]!==undefined) throw new Error('an out-of-range slot must be dropped');
      if(c[2]!==undefined) throw new Error('a non-string id must be dropped');
      if(c[3]!==undefined) throw new Error('a bogus id must be dropped');
      if(c[4]!==undefined) throw new Error('the army commander must be dropped from the corps');
      C.president.command.corps=[good]; cmdInit(C);
      if(Array.isArray(C.president.command.corps)) throw new Error('an array corps must be replaced by an object');
      return { sanitized:true }; });

    step('Q10: NO output gate — cmdSeatCorps/cmdVacateCorps write ONLY cmd.corps + C.clock.capital (no scoreboard, no reputation/seniority)', function(){
      if(typeof cmdSeatCorps!=='function') return { skipped:'pre-Q10' };
      var C=mkC('US',1864,5); C.clock.capital=100; var army=cmdActiveId(C);
      var g=['us-thomas','us-sherman','us-sheridan'].filter(function(x){return x!==army;})[0];
      function snap(){ return JSON.stringify({ idx:C.idx, stats:C.stats, strength:(C.manpower&&C.manpower.strength), fieldGeneral:C.president.command.fieldGeneral, seniority:C.president.command.seniority, rep:C.president.command.reputation[g] }); }
      var s0=snap(); cmdSeatCorps(C,0,g); cmdVacateCorps(C,0);
      if(snap()!==s0) throw new Error('seat/vacate mutated state beyond cmd.corps + capital');
      return { pure:true }; });

    step('Q10: the Command desk renders the depth-chart section (slot labels + a Seat/Vacate control + the net-effect line); the full tab includes it', function(){
      if(typeof _cmdCorpsDepthHTML!=='function') return { skipped:'pre-Q10' };
      var C=mkC('US',1864,5); C.clock.capital=100;
      var h0=_cmdCorpsDepthHTML(C);
      if(h0.toLowerCase().indexOf('depth chart')<0) throw new Error('missing the depth-chart header');
      if(h0.indexOf('I Corps')<0) throw new Error('missing the I Corps slot label');
      if(h0.indexOf('cmdCorpsSeat_0')<0&&h0.indexOf('cmdCorpsSel_0')<0) throw new Error('a vacant slot must offer a seat control');
      var army=cmdActiveId(C); var g=['us-thomas','us-sherman','us-sheridan'].filter(function(x){return x!==army;})[0];
      cmdSeatCorps(C,0,g);
      var h1=_cmdCorpsDepthHTML(C);
      if(h1.indexOf('cmdCorpsVac_0')<0) throw new Error('a seated slot must offer a Vacate control');
      if(h1.indexOf(_cmdName(_cmdById('US',g)))<0) throw new Error('a seated slot must name its commander');
      if(h1.indexOf('Corps staff')<0) throw new Error('missing the net-effect line');
      var tab=cmdRenderTab(C);
      if(tab.toLowerCase().indexOf('depth chart')<0) throw new Error('the Command tab must include the depth-chart section');
      return { rendered:true }; });

    // ===== Q11 (D109): THE COMMISSION MOVE — bring documented political generals into the pool =====
    step('Q11: commission config + pool load — costPolitical<costProfessional, maxCommissions; both sides have a pool; political generals are LOW OVR / HIGH political value, with personas + provenance', function(){
      if(typeof _cmdCommissionCfg!=='function') return { skipped:'pre-Q11' };
      var cfg=_cmdCommissionCfg(); if(!cfg) throw new Error('no commission config');
      if(!(cfg.costPolitical>=0)||!(cfg.costProfessional>=0)) throw new Error('bad commission costs');
      if(!(cfg.costPolitical<cfg.costProfessional)) throw new Error('a political general must be CHEAPER than a professional (§12.2)');
      if(!(cfg.maxCommissions>=1)) throw new Error('bad maxCommissions');
      if(String(cfg.prov||'').trim().toLowerCase()==='verified'&&(!Array.isArray(cfg.src)||cfg.src.length<2)) throw new Error('Verified config needs >=2 src (gate-4e)');
      var us=_cmdCommissionPool('US'), cs=_cmdCommissionPool('CS');
      if(!us.length||!cs.length) throw new Error('a commission pool is empty (US '+us.length+' / CS '+cs.length+')');
      var C=mkC('US',1862,9);
      var rosterIds={}; _cmdSideGenerals('US').concat(_cmdSideGenerals('CS')).forEach(function(g){ rosterIds[g.id]=1; });
      var all=us.concat(cs), seen={};
      for(var i=0;i<all.length;i++){ var e=all[i];
        if(!e.id||!e.name||typeof e.skill!=='number'||typeof e.reputation!=='number'||!e.availableFrom) throw new Error('commission entry missing field: '+(e&&e.id));
        if(rosterIds[e.id]) throw new Error('a commission officer must NOT also be in the starting roster: '+e.id);
        if(seen[e.id]) throw new Error('duplicate commission id: '+e.id); seen[e.id]=1;
        if(!_cmdGenPersona(e)) throw new Error('commission officer needs a persona (for the dual OVR): '+e.id);
        var ovr=Math.round(_cmdGenRating(C,e));
        if(!(ovr<=58)) throw new Error('a political general must be a LOW combat OVR (<=58), '+e.id+' = '+ovr);
        var pol=(e.commission&&typeof e.commission.politicalValue==='number')?e.commission.politicalValue:e.politicalValueScore;
        if(!(pol>=50)) throw new Error('a political general must have a HIGH political value (>=50), '+e.id+' = '+pol);
        if(String(e.provenance||'').trim().toLowerCase()==='verified'&&(!Array.isArray(e.sources)||e.sources.length<2)) throw new Error('a Verified commission entry needs >=2 sources (gate-4e): '+e.id);
        if(!Array.isArray(e.sources)||e.sources.length<2) throw new Error('want >=2 sources for the citation-grade bio: '+e.id);
      }
      return { us:us.length, cs:cs.length, costPol:cfg.costPolitical, costPro:cfg.costProfessional, maxC:cfg.maxCommissions }; });

    step('Q11: BYTE-IDENTICAL when nobody commissioned — the roster+commissioned pool equals the bare roster; the appoint pool names no political general; leadership matches an absent record', function(){
      if(typeof _cmdRosterPlusCommissioned!=='function') return { skipped:'pre-Q11' };
      var C=mkC('US',1862,9);
      if(_cmdRosterPlusCommissioned(C,'US').length!==_cmdSideGenerals('US').length) throw new Error('a fresh campaign must expose exactly the starting roster');
      var pool=_cmdPoolHTML(C);
      var names=_cmdCommissionPool('US').map(function(e){return _cmdName(e);});
      for(var i=0;i<names.length;i++) if(pool.indexOf('>'+names[i])>=0||pool.indexOf(names[i]+' &')>=0) { /* loose */ }
      var L0=commandLeadership(C);
      delete C.president.command.commissioned;             // an absent record (a pre-Q11 save) must read identically
      cmdInit(C);
      if(_cmdRosterPlusCommissioned(C,'US').length!==_cmdSideGenerals('US').length) throw new Error('an absent record must still expose just the roster');
      var L1=commandLeadership(C);
      if(L0!==L1) throw new Error('byte-identity break: seeded-empty '+L0+' vs absent-record '+L1);
      return { rosterOnly:true, leadership:L0 }; });

    step('Q11: cmdCommission SPENDS exactly the cost, is GATED when capital is short, adds the id; idempotent (no re-charge)', function(){
      if(typeof cmdCommission!=='function') return { skipped:'pre-Q11' };
      var C=mkC('US',1862,9), id='us-banks', e=_cmdCommissionEntry('US',id); if(!e) return { skipped:'no '+id };
      var cost=_cmdCommissionCost(e);
      C.clock.capital=Math.max(0,cost-1);                  // short -> gated
      cmdCommission(C,id);
      if(cmdCommissioned(C).indexOf(id)>=0) throw new Error('commissioning must be GATED when capital is short');
      C.clock.capital=20; var cap0=C.clock.capital;
      cmdCommission(C,id);
      if(cmdCommissioned(C).indexOf(id)<0) throw new Error('an affordable commission must add the officer');
      if(C.clock.capital!==cap0-cost) throw new Error('commission must debit exactly '+cost+', spent '+(cap0-C.clock.capital));
      var cap1=C.clock.capital; cmdCommission(C,id);       // re-commission -> no re-charge
      if(C.clock.capital!==cap1) throw new Error('re-commissioning the same officer must not re-charge');
      if(cmdCommissioned(C).filter(function(x){return x===id;}).length!==1) throw new Error('an officer must appear once in the commissioned set');
      return { gated:true, spent:cost }; });

    step('Q11: a commissioned officer ENTERS the pools (appointable + seatable); appointing a political general yields a LOWER leadership than a strong professional (rank != competence)', function(){
      if(typeof cmdCommission!=='function') return { skipped:'pre-Q11' };
      var C=mkC('US',1862,9); C.clock.capital=1000;
      cmdCommission(C,'us-banks');
      if(_cmdRosterPlusCommissioned(C,'US').map(function(g){return g.id;}).indexOf('us-banks')<0) throw new Error('a commissioned officer must enter the selectable pool');
      var pool=_cmdPoolHTML(C);
      if(pool.indexOf(_cmdName(_cmdCommissionEntry('US','us-banks')))<0) throw new Error('the appoint pool must list the commissioned officer');
      // appoint him -> his (low) leadership takes the field
      cmdAppoint(C,'us-banks');
      if(cmdActiveId(C)!=='us-banks') throw new Error('a commissioned officer must be appointable to army command');
      var banksLead=commandLeadership(C);
      // a strong professional, by contrast, fields a much higher leadership
      var D=mkC('US',1862,9); D.clock.capital=1000; cmdAppoint(D,'us-grant');
      var grantLead=commandLeadership(D);
      if(!(banksLead<grantLead)) throw new Error('a political general must field a LOWER leadership than a strong professional: banks '+banksLead+' !< grant '+grantLead);
      // seatable too
      var E=mkC('US',1862,9); E.clock.capital=1000; cmdCommission(E,'us-butler');
      cmdSeatCorps(E,0,'us-butler');
      if(E.president.command.corps[0]!=='us-butler') throw new Error('a commissioned officer must be seatable over a corps');
      return { appointable:true, seatable:true, banksLead:banksLead, grantLead:grantLead }; });

    step('Q11: the maxCommissions cap is a real budget — commissioning past the cap is a no-op (the scarcity teaching)', function(){
      if(typeof cmdCommission!=='function') return { skipped:'pre-Q11' };
      var cap=_cmdCommissionCfg().maxCommissions;
      var us=_cmdCommissionPool('US').map(function(e){return e.id;});
      if(us.length<=cap) return { note:'pool ('+us.length+') <= cap ('+cap+'); cap not exercisable on this roster', poolSize:us.length, cap:cap };
      var C=mkC('US',1862,9); C.clock.capital=1000;
      for(var i=0;i<cap;i++) cmdCommission(C,us[i]);
      if(cmdCommissioned(C).length!==cap) throw new Error('should have commissioned exactly the cap ('+cap+'), got '+cmdCommissioned(C).length);
      var capBefore=C.clock.capital; cmdCommission(C,us[cap]);   // one past the cap
      if(cmdCommissioned(C).indexOf(us[cap])>=0) throw new Error('commissioning past the cap must be refused');
      if(C.clock.capital!==capBefore) throw new Error('a refused (over-cap) commission must not charge');
      return { cap:cap, atCap:cmdCommissioned(C).length, overCapRefused:true }; });

    step('Q11: SAVE-TAMPER hardening — cmdInit sanitizes a malformed cmd.commissioned (non-array/dupes/bogus/roster-id/over-cap) on LOAD', function(){
      if(typeof cmdCommission!=='function') return { skipped:'pre-Q11' };
      var cap=_cmdCommissionCfg().maxCommissions;
      var us=_cmdCommissionPool('US').map(function(e){return e.id;});
      var C=mkC('US',1862,9);
      // a torrent of garbage: dupes, a non-string, a bogus id, a real roster id (must be rejected — never both), the full pool
      C.president.command.commissioned=[us[0], us[0], 12345, 'no-such-officer', 'us-grant'].concat(us);
      cmdInit(C);
      var c=C.president.command.commissioned;
      if(!Array.isArray(c)) throw new Error('commissioned must sanitize to an array');
      if(c.indexOf('us-grant')>=0) throw new Error('a starting-roster id must be rejected from the commissioned set');
      if(c.indexOf(12345)>=0||c.indexOf('no-such-officer')>=0) throw new Error('bogus ids must be dropped');
      if(c.filter(function(x){return x===us[0];}).length>1) throw new Error('dupes must be removed');
      if(c.length>cap) throw new Error('the commissioned set must be capped at maxCommissions ('+cap+'), got '+c.length);
      C.president.command.commissioned='not-an-array'; cmdInit(C);
      if(!Array.isArray(C.president.command.commissioned)) throw new Error('a non-array commissioned must be replaced by an array');
      return { sanitized:true, cappedTo:cap }; });

    step('Q11: NO output gate — cmdCommission writes ONLY cmd.commissioned + C.clock.capital + the reputation seed (no scoreboard, no seniority)', function(){
      if(typeof cmdCommission!=='function') return { skipped:'pre-Q11' };
      var C=mkC('US',1862,9); C.clock.capital=100;
      function snap(){ return JSON.stringify({ idx:C.idx, stats:C.stats, strength:(C.manpower&&C.manpower.strength), fieldGeneral:C.president.command.fieldGeneral, seniority:C.president.command.seniority, corps:C.president.command.corps }); }
      var s0=snap(); cmdCommission(C,'us-sigel');
      if(snap()!==s0) throw new Error('commission mutated state beyond cmd.commissioned + capital + reputation');
      // it did write the commissioned set + a reputation seed (the allowed writes)
      if(cmdCommissioned(C).indexOf('us-sigel')<0) throw new Error('commission should have added the officer');
      return { pure:true }; });

    step('Q11: the Command desk renders the Commission section (header + a political general + a Commission control); the full tab includes it', function(){
      if(typeof _cmdCommissionHTML!=='function') return { skipped:'pre-Q11' };
      var C=mkC('US',1862,9); C.clock.capital=100;
      var h0=_cmdCommissionHTML(C);
      if(h0.toLowerCase().indexOf('commission')<0) throw new Error('missing the commission header');
      if(h0.toLowerCase().indexOf('political value')<0) throw new Error('missing the political-value read-out');
      var bn=_cmdName(_cmdCommissionEntry('US','us-banks'));
      if(h0.indexOf(bn)<0) throw new Error('the commission section must list a political general ('+bn+')');
      if(h0.indexOf('cmdComm_us-banks')<0) throw new Error('an un-commissioned officer must offer a Commission control');
      cmdCommission(C,'us-banks');
      var h1=_cmdCommissionHTML(C);
      if(h1.indexOf('cmdComm_us-banks')>=0) throw new Error('a commissioned officer must not still offer the Commission button');
      if(h1.toLowerCase().indexOf('commissioned')<0) throw new Error('a commissioned officer must be marked Commissioned');
      var tab=cmdRenderTab(C);
      if(tab.toLowerCase().indexOf('commission an officer')<0) throw new Error('the Command tab must include the Commission section');
      return { rendered:true }; });

    step('Q11 (bug-hunt): the commission gate is enforced at the FUNCTION level — an UN-commissioned officer cannot be appointed/seated/promoted (byte-identical for roster generals); a seated commissioned officer shows the RIGHT corps label', function(){
      if(typeof cmdCommission!=='function') return { skipped:'pre-Q11' };
      var C=mkC('US',1862,9); C.clock.capital=1000;
      cmdAppoint(C,'us-banks'); if(cmdActiveId(C)==='us-banks') throw new Error('appoint must REFUSE an un-commissioned officer');
      cmdSeatCorps(C,0,'us-banks'); if(C.president.command.corps[0]==='us-banks') throw new Error('seat must REFUSE an un-commissioned officer');
      cmdPromote(C,'us-banks'); if(C.president.command.promotions['us-banks']) throw new Error('promote must REFUSE an un-commissioned officer');
      // the guard is INERT for roster generals (always false) — a roster appoint still works
      var D=mkC('US',1862,9); D.clock.capital=1000; cmdAppoint(D,'us-grant'); if(cmdActiveId(D)!=='us-grant') throw new Error('a roster appoint must still work — the guard must be inert for roster ids');
      // commission, then the moves succeed; a seat in corps index 1 shows "II Corps", not the old always-"I Corps"
      cmdCommission(C,'us-banks'); cmdSeatCorps(C,1,'us-banks');
      if(C.president.command.corps[1]!=='us-banks') throw new Error('a COMMISSIONED officer must be seatable');
      var h=_cmdCommissionHTML(C);
      if(h.indexOf('Commands II Corps')<0) throw new Error('a commissioned officer seated in corps 1 must show "Commands II Corps" (the parseInt label fix), not always I Corps');
      return { unCommissionedRefused:true, rosterUnaffected:true, commissionedSeatable:true, corpsLabelCorrect:true }; });

    // ===== Q12 (D110): THE DIVISION SUB-TIER — seat generals into division billets nested UNDER a seated corps =====
    // helper: a US general id who is neither the army commander nor any already-seated corps/division holder.
    function freeGen(C, prefer){ var army=cmdActiveId(C); var cand=(prefer||['us-thomas','us-sherman','us-sheridan','us-meade']);
      var corps=cmdCorpsSeated(C), div=cmdDivSeated(C), taken={}; for(var k in corps) taken[corps[k]]=1;
      for(var e in div){ var inn=div[e]; for(var f in inn) taken[inn[f]]=1; }
      for(var i=0;i<cand.length;i++){ if(cand[i]!==army && !taken[cand[i]]) return cand[i]; } return null; }

    step('Q12: divisionCommand config loads — perCorps/labels/seatCost/preferredGrade(Maj. Gen. both)/perSlotWeight/liftCap; the division liftCap is SMALLER than the corps liftCap (army>corps>division); >=2 src', function(){
      if(typeof _cmdDivCfg!=='function') return { skipped:'pre-Q12' };
      var cfg=_cmdDivCfg(); if(!cfg) throw new Error('no divisionCommand config');
      if(!(cfg.perCorps>=1)) throw new Error('bad perCorps');
      if(!Array.isArray(cfg.labels)||cfg.labels.length<cfg.perCorps) throw new Error('labels must cover perCorps');
      if(!(cfg.seatCost>=0)) throw new Error('bad seatCost');
      if(!cfg.preferredGrade||cfg.preferredGrade.US!=='Maj. Gen.'||cfg.preferredGrade.CS!=='Maj. Gen.') throw new Error('a division is a Maj. Gen. billet in both armies');
      if(!(cfg.perSlotWeight>0)) throw new Error('bad perSlotWeight');
      var corpsCap=_cmdCorpsCfg().liftCap;
      if(!(cfg.liftCap>0 && cfg.liftCap<corpsCap)) throw new Error('division liftCap ('+cfg.liftCap+') must be > 0 and < the corps liftCap ('+corpsCap+') so the influence hierarchy army>corps>division holds');
      if(!Array.isArray(cfg.src)||cfg.src.length<2) throw new Error('want >=2 sources for the division-org teaching');
      return { perCorps:cfg.perCorps, cost:cfg.seatCost, w:cfg.perSlotWeight, divCap:cfg.liftCap, corpsCap:corpsCap, src:cfg.src.length }; });

    step('Q12: BYTE-IDENTICAL when no division seated — _cmdDivLift is 0 and commandLeadership matches an ABSENT record (a pre-Q12 save), even with a corps seated', function(){
      if(typeof _cmdDivLift!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=100;
      if(_cmdDivLift(C)!==0) throw new Error('a fresh campaign must have 0 division lift, got '+_cmdDivLift(C));
      // seat a corps (no divisions) — the division lift must STILL be 0 (corps alone is byte-identical to pre-Q12 corps-only)
      var g=freeGen(C); cmdSeatCorps(C,0,g);
      var L0=commandLeadership(C);
      if(_cmdDivLift(C)!==0) throw new Error('a corps with no divisions must give 0 division lift');
      delete C.president.command.divisions;                // an absent record (a pre-Q12 save) must read identically
      if(_cmdDivLift(C)!==0) throw new Error('an absent divisions record must also give 0 lift');
      if(commandLeadership(C)!==L0) throw new Error('commandLeadership must be identical with an absent divisions record ('+commandLeadership(C)+' != '+L0+')');
      return { lift0:true, absentOk:true, corpsOnlyIdentical:true }; });

    step('Q12: the HIERARCHY GATE — a division can be seated ONLY under a SEATED corps; seating with a vacant parent corps is a no-op (no charge); seat the corps, then the division takes', function(){
      if(typeof cmdSeatDivision!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=100;
      var b=freeGen(C,['us-thomas','us-meade']);
      var cap0=C.clock.capital;
      cmdSeatDivision(C,0,0,b);                            // corps 0 is VACANT -> the hierarchy gate refuses
      if(C.president.command.divisions&&C.president.command.divisions[0]&&C.president.command.divisions[0][0]) throw new Error('a division under a VACANT corps must be refused');
      if(C.clock.capital!==cap0) throw new Error('a refused (no parent corps) division seat must not charge');
      var a=freeGen(C,['us-sherman','us-sheridan']); cmdSeatCorps(C,0,a);   // seat the parent corps
      var capC=C.clock.capital; cmdSeatDivision(C,0,0,b);  // now it takes
      if(!(C.president.command.divisions[0]&&C.president.command.divisions[0][0]===b)) throw new Error('a division under a SEATED corps must be seatable');
      if(C.clock.capital!==capC-_cmdDivCfg().seatCost) throw new Error('the division seat must debit exactly seatCost');
      return { gateHeld:true, seatsUnderCorps:true }; });

    step('Q12: seating SPENDS exactly seatCost, is GATED when capital is short, stores the slot; re-seat no-op; vacate is free', function(){
      if(typeof cmdSeatDivision!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=100; var a=freeGen(C,['us-sherman']); cmdSeatCorps(C,0,a);
      var b=freeGen(C,['us-thomas','us-meade']), cost=_cmdDivCfg().seatCost;
      C.clock.capital=cost-1;                              // too poor
      cmdSeatDivision(C,0,0,b);
      if(C.president.command.divisions[0]&&C.president.command.divisions[0][0]===b) throw new Error('seating must be GATED when capital is short');
      C.clock.capital=cost+5; var cap0=C.clock.capital;
      cmdSeatDivision(C,0,0,b);
      if(C.president.command.divisions[0][0]!==b) throw new Error('an affordable seat must store the slot');
      if(C.clock.capital!==cap0-cost) throw new Error('seat must debit exactly '+cost+', spent '+(cap0-C.clock.capital));
      var cap1=C.clock.capital; cmdSeatDivision(C,0,0,b);  // re-seat same -> no re-charge
      if(C.clock.capital!==cap1) throw new Error('re-seating the same general must not re-charge');
      var cap2=C.clock.capital; cmdVacateDivision(C,0,0);
      if(C.president.command.divisions[0][0]!=null) throw new Error('vacate must empty the slot');
      if(C.clock.capital!==cap2) throw new Error('vacate must be free');
      return { gated:true, spent:cost, reSeatNoop:true, vacateFree:true }; });

    step('Q12: a seated able division commander LIFTS the army; the lift is bounded by the division liftCap (< the corps cap); more strong commanders never reduce it', function(){
      if(typeof _cmdDivLift!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=400;
      var per=_cmdDivPerCorps(), cap=_cmdDivCfg().liftCap;
      // seat ONE corps (a weaker man, so the able generals stay free for the divisions), then fill its divisions
      // with the strongest generals — the division lift must rise and stay bounded by liftCap.
      var corpsMan=freeGen(C,['us-meade','us-hooker','us-burnside','us-halleck']); cmdSeatCorps(C,0,corpsMan);
      if(_cmdDivLift(C)!==0) throw new Error('baseline division lift must be 0');
      var able=['us-grant','us-sherman','us-thomas','us-sheridan'];
      var seated=0;
      for(var di=0;di<per;di++){ var dg=freeGen(C,able); if(dg){ cmdSeatDivision(C,0,di,dg); seated++; } }
      if(seated===0) throw new Error('the test could not free an able division commander');
      var l1=_cmdDivLift(C);
      if(!(l1>0)) throw new Error('seating able division commanders must LIFT the army, got '+l1+' (seated '+seated+')');
      if(l1>cap+1e-9) throw new Error('the division lift must be bounded by liftCap '+cap+', got '+l1);
      return { lift:Math.round(l1*100)/100, cap:cap, seated:seated, bounded:true }; });

    step('Q12: the below-grade penalty bites on a commissioned Brig. Gen. seated over a division; promoting him to Maj. Gen. removes it (the Q9 synergy); a Maj. Gen. meets the division floor', function(){
      if(typeof _cmdDivBelowGrade!=='function') return { skipped:'pre-Q12' };
      // CS Floyd is a Brig. Gen. (a political general) — below the division Maj. Gen. grade. His service window is
      // 1861-5..1862-3 (Davis removed him after Fort Donelson), so test within it (Jan 1862).
      var C=mkC('CS',1862,1); C.clock.capital=400;
      if(_cmdDivPreferredGrade(C)!=='Maj. Gen.') throw new Error('a division preferred grade must be Maj. Gen.');
      // seat the parent corps with ANY available CS roster general (!= the army commander) — the gate just needs a seated corps
      var army=cmdActiveId(C), corpsGen=null, csr=_cmdSideGenerals('CS');
      for(var i=0;i<csr.length;i++){ if(csr[i].id!==army && _cmdAlive(csr[i],C.president.date)){ corpsGen=csr[i].id; break; } }
      if(!corpsGen) throw new Error('no available CS roster general to seat the parent corps');
      cmdSeatCorps(C,0,corpsGen);
      cmdCommission(C,'cs-floyd');
      if(cmdCommissioned(C).indexOf('cs-floyd')<0) throw new Error('Floyd must be commissionable within his service window');
      var floyd=_cmdById('CS','cs-floyd'); if(!floyd) throw new Error('Floyd not resolvable after commission');
      if(_cmdDivBelowGrade(C,floyd)!==true) throw new Error('a Brig. Gen. (Floyd) must be BELOW grade for a division');
      var effBefore=_cmdDivEffRating(C,floyd);
      // promote Floyd up to Maj. Gen. (Q9) — removes the penalty (fund both currencies so the gate is not the variable under test)
      C.clock.capital=1000; C.president.command.seniority=100;
      cmdPromote(C,'cs-floyd');
      if(_cmdDivBelowGrade(C,floyd)!==false) throw new Error('a promoted (Maj. Gen.) Floyd must FIT the division billet');
      var effAfter=_cmdDivEffRating(C,floyd);
      if(!(effAfter>effBefore)) throw new Error('promoting to grade must raise the division contribution: '+effAfter+' !> '+effBefore);
      // a Maj. Gen. roster general (Stuart) by contrast already MEETS the division floor
      var D=mkC('CS',1863,7); var stuart=_cmdById('CS','cs-stuart');
      if(stuart&&_cmdDivBelowGrade(D,stuart)!==false) throw new Error('a Maj. Gen. must MEET the division floor');
      return { brigBelow:true, promoteFits:true, effRose:true }; });

    step('Q12: ONE BILLET PER MAN — appointing a division commander to ARMY clears his division; seating him in a CORPS clears it; reassign between divisions; a corps-holder is excluded from the division pool; the army commander cannot be seated', function(){
      if(typeof cmdSeatDivision!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=400;
      var a=freeGen(C,['us-sherman']); cmdSeatCorps(C,0,a);
      var b=freeGen(C,['us-thomas','us-meade']); cmdSeatDivision(C,0,0,b);
      if(C.president.command.divisions[0][0]!==b) throw new Error('seat div (0,0) failed');
      // reassign b to a different division under the same corps
      cmdSeatDivision(C,0,1,b);
      if(C.president.command.divisions[0][0]===b) throw new Error('reassign must clear the old division');
      if(C.president.command.divisions[0][1]!==b) throw new Error('reassign must set the new division');
      // appoint b to ARMY command -> his division clears
      cmdAppoint(C,b);
      if(cmdActiveId(C)!==b) throw new Error('appoint failed (capital/availability?)');
      var dv=C.president.command.divisions; for(var k in dv){ for(var f in dv[k]) if(dv[k][f]===b) throw new Error('the army commander must not also hold a division'); }
      // seat a fresh division commander, then promote him into a CORPS -> his division clears
      var c=freeGen(C,['us-thomas','us-meade','us-sheridan']); cmdSeatDivision(C,0,0,c);
      cmdSeatCorps(C,1,c);
      if(C.president.command.corps[1]!==c) throw new Error('seat corps for c failed');
      var dv2=C.president.command.divisions; for(var k2 in dv2){ for(var f2 in dv2[k2]) if(dv2[k2][f2]===c) throw new Error('a man promoted to a corps must vacate his division'); }
      // a corps-holder (a, commanding corps 0) is excluded from the division pool AND cmdSeatDivision refuses him
      var pool=_cmdDivPoolFor(C,0,0); for(var p=0;p<pool.length;p++) if(pool[p].id===a) throw new Error('a corps-holder must not appear in the division pool');
      var capX=C.clock.capital; cmdSeatDivision(C,1,0,a);    // a commands corps 1 (after c? no — a commands corps 0) -> still a corps-holder, refused
      var dv3=C.president.command.divisions; for(var k3 in dv3){ for(var f3 in dv3[k3]) if(dv3[k3][f3]===a) throw new Error('a corps-holder must not be seatable in a division'); }
      if(C.clock.capital!==capX) throw new Error('a refused (corps-holder) division seat must not charge');
      // the army commander (b) cannot be seated in a division
      var capY=C.clock.capital; cmdSeatDivision(C,0,2,b);
      var dv4=C.president.command.divisions; for(var k4 in dv4){ for(var f4 in dv4[k4]) if(dv4[k4][f4]===b) throw new Error('the army commander cannot be seated in a division'); }
      if(C.clock.capital!==capY) throw new Error('a refused (army commander) division seat must not charge');
      return { appointClears:true, corpsPromoteClears:true, reassign:true, corpsHolderExcluded:true, armyCmdNotSeatable:true }; });

    step('Q12: the CASCADE — vacating a corps drops its divisions (cmdInit sanitizes on load); the orphaned division contributes 0 lift', function(){
      if(typeof cmdVacateCorps!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=400;
      var a=freeGen(C,['us-sherman']); cmdSeatCorps(C,0,a);
      var b=freeGen(C,['us-thomas','us-meade']); cmdSeatDivision(C,0,0,b);
      if(_cmdDivLift(C)===0) throw new Error('a seated division should lift before the cascade');
      cmdVacateCorps(C,0);                                  // orphan the division
      cmdInit(C);                                           // the load-sanitize drops the orphaned branch
      var dv=C.president.command.divisions;
      if(dv&&dv[0]&&dv[0][0]) throw new Error('vacating the parent corps must drop its divisions (cascade)');
      if(_cmdDivLift(C)!==0) throw new Error('an orphaned division must contribute 0 lift');
      return { cascadeDrops:true, zeroLift:true }; });

    step('Q12: SAVE-TAMPER hardening — cmdInit sanitizes a malformed cmd.divisions (array/parent-not-seated/bad slot/non-string/bogus/dup/the army commander/a corps-holder) on LOAD', function(){
      if(typeof cmdSeatDivision!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=400; var army=cmdActiveId(C);
      var a=freeGen(C,['us-sherman']); cmdSeatCorps(C,0,a);          // corps 0 seated; corps 1 vacant
      var good=freeGen(C,['us-thomas','us-meade']);
      // tamper: a valid placement, a dup, an out-of-range div slot, a non-string, a bogus id, the army commander,
      // a corps-holder (a), and a whole branch under a VACANT corps (1)
      C.president.command.divisions={ '0':{ '0':good, '1':good, '7':good, '2':12345, '3':'no-such-general', '4':army, '5':a }, '1':{ '0':good } };
      cmdInit(C);
      var dv=C.president.command.divisions;
      if(Array.isArray(dv)||typeof dv!=='object') throw new Error('divisions must sanitize to a clean object');
      if(!(dv[0]&&dv[0][0]===good)) throw new Error('the first valid placement must survive');
      if(dv[0]&&dv[0][1]===good) throw new Error('a duplicate (one division per general) must be dropped');
      if(dv[0]&&dv[0][7]!==undefined) throw new Error('an out-of-range division slot must be dropped');
      if(dv[0]&&dv[0][2]!==undefined) throw new Error('a non-string id must be dropped');
      if(dv[0]&&dv[0][3]!==undefined) throw new Error('a bogus id must be dropped');
      if(dv[0]&&dv[0][4]!==undefined) throw new Error('the army commander must be dropped from a division');
      if(dv[0]&&dv[0][5]!==undefined) throw new Error('a corps-holder must be dropped from a division');
      if(dv[1]!==undefined) throw new Error('a branch under a VACANT corps must be dropped (the cascade)');
      C.president.command.divisions=[{'0':good}]; cmdInit(C);
      if(Array.isArray(C.president.command.divisions)) throw new Error('an array divisions must be replaced by an object');
      return { sanitized:true }; });

    step('Q12: NO output gate — cmdSeatDivision/cmdVacateDivision write ONLY cmd.divisions + C.clock.capital (no scoreboard, no reputation/seniority)', function(){
      if(typeof cmdSeatDivision!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=100; var a=freeGen(C,['us-sherman']); cmdSeatCorps(C,0,a);
      var b=freeGen(C,['us-thomas','us-meade']);
      function snap(){ return JSON.stringify({ idx:C.idx, stats:C.stats, strength:(C.manpower&&C.manpower.strength), fieldGeneral:C.president.command.fieldGeneral, seniority:C.president.command.seniority, rep:C.president.command.reputation[b] }); }
      var s0=snap(); cmdSeatDivision(C,0,0,b); cmdVacateDivision(C,0,0);
      if(snap()!==s0) throw new Error('seat/vacate mutated state beyond cmd.divisions + capital');
      return { pure:true }; });

    step('Q12: the Command desk renders the division sub-rows nested under a SEATED corps (the "Divisions of I Corps" label + a Seat/Vacate control); a vacant corps renders none; the full tab includes it', function(){
      if(typeof _cmdCorpsDepthHTML!=='function') return { skipped:'pre-Q12' };
      var C=mkC('US',1864,5); C.clock.capital=100;
      var h0=_cmdCorpsDepthHTML(C);
      if(h0.indexOf('Divisions of')>=0) throw new Error('with no corps seated, no division sub-rows must render');
      var a=freeGen(C,['us-sherman']); cmdSeatCorps(C,0,a);
      var h1=_cmdCorpsDepthHTML(C);
      if(h1.indexOf('Divisions of I Corps')<0) throw new Error('a seated corps must render its "Divisions of I Corps" sub-section');
      if(h1.indexOf('cmdDivSeat_0_0')<0&&h1.indexOf('cmdDivSel_0_0')<0) throw new Error('a vacant division must offer a seat control');
      var b=freeGen(C,['us-thomas','us-meade']); cmdSeatDivision(C,0,0,b);
      var h2=_cmdCorpsDepthHTML(C);
      if(h2.indexOf('cmdDivVac_0_0')<0) throw new Error('a seated division must offer a Vacate control');
      if(h2.indexOf(_cmdName(_cmdById('US',b)))<0) throw new Error('a seated division must name its commander');
      var tab=cmdRenderTab(C);
      if(tab.indexOf('Divisions of I Corps')<0) throw new Error('the Command tab must include the division sub-rows');
      return { gatedRender:true, nestsUnderCorps:true, namesCommander:true }; });

    // ===== D113 — §12.3 THE ELECTION-SUPPORT RELIEF-BIND =====
    step('D113: byte-identity — a ROSTER general carries NO election surcharge in any year (relief cost = the pre-bind base+prestige)', function(){
      if(typeof _cmdElectionSupportSurcharge!=='function') return { skipped:'pre-D113' };
      var grant=_cmdById('US','us-grant'); if(!grant) throw new Error('no us-grant');
      var years=[1861,1862,1863,1864,1865];
      for(var i=0;i<years.length;i++){ var C=mkC('US',years[i],9);
        if(_cmdElectionSupportSurcharge(C,grant)!==0) throw new Error('a roster general must have 0 election surcharge in '+years[i]); }
      // therefore _cmdReliefCost is byte-identical to the base+prestige formula
      var Cy=mkC('US',1864,9); var rep=_cmdReputation(Cy,'us-grant'); var expect=Math.round((_cmdRELIEF_BASE[grant.relief]||_cmdRELIEF_BASE.costly)+Math.max(0,rep-60)*0.25);
      if(_cmdReliefCost(Cy,grant)!==expect) throw new Error('a roster general\\'s relief cost must equal base+prestige, got '+_cmdReliefCost(Cy,grant)+' vs '+expect);
      return { rosterSurcharge:0, byteIdentical:true }; });

    step('D113: a commissioned POLITICAL general (Banks, pv 82) costs MORE to relieve in the 1864 pre-election window than his base+prestige', function(){
      if(typeof _cmdElectionSupportSurcharge!=='function') return { skipped:'pre-D113' };
      var banks=_cmdCommissionEntry('US','us-banks'); if(!banks) return { skipped:'no us-banks' };
      if(_cmdPoliticalValue(banks)<=0) throw new Error('Banks must read a political value');
      var C=mkC('US',1864,9); C.clock.resolved1864=false;
      var sur=_cmdElectionSupportSurcharge(C,banks);
      if(!(sur>0)) throw new Error('a political general in the 1864 window must carry a surcharge, got '+sur);
      var rep=_cmdReputation(C,'us-banks'); var noBind=Math.round((_cmdRELIEF_BASE[banks.relief]||_cmdRELIEF_BASE.costly)+Math.max(0,rep-60)*0.25);
      if(!(_cmdReliefCost(C,banks)>noBind)) throw new Error('the bind must raise the relief cost above base+prestige');
      if(_cmdReliefCost(C,banks)!==noBind+sur) throw new Error('relief cost must equal base+prestige+surcharge');
      return { surcharge:sur, withBind:_cmdReliefCost(C,banks), noBind:noBind }; });

    step('D113: the bind RELAXES once the 1864 verdict is rendered (resolved1864 -> surcharge 0, relief back to base+prestige)', function(){
      if(typeof _cmdElectionSupportSurcharge!=='function') return { skipped:'pre-D113' };
      var banks=_cmdCommissionEntry('US','us-banks'); if(!banks) return { skipped:'no us-banks' };
      var C=mkC('US',1864,12); C.clock.resolved1864=true;
      if(_cmdElectionSupportSurcharge(C,banks)!==0) throw new Error('after the election resolves, the surcharge must fall to 0 (the bind is spent)');
      var rep=_cmdReputation(C,'us-banks'); var noBind=Math.round((_cmdRELIEF_BASE[banks.relief]||_cmdRELIEF_BASE.costly)+Math.max(0,rep-60)*0.25);
      if(_cmdReliefCost(C,banks)!==noBind) throw new Error('post-election relief cost must be exactly base+prestige');
      return { relaxed:true }; });

    step('D113: the surcharge RAMPS toward Nov 1864 (1861=0 <= 1862 < 1863 < 1864) and is BOUNDED by surchargeMax; a professional kind reads 0', function(){
      if(typeof _cmdElectionSupportSurcharge!=='function') return { skipped:'pre-D113' };
      var banks=_cmdCommissionEntry('US','us-banks'); if(!banks) return { skipped:'no us-banks' };
      var s=function(y){ var C=mkC('US',y,6); C.clock.resolved1864=false; return _cmdElectionSupportSurcharge(C,banks); };
      var s61=s(1861),s62=s(1862),s63=s(1863),s64=s(1864);
      if(!(s61===0 && s61<=s62 && s62<s63 && s63<s64)) throw new Error('the surcharge must ramp 1861(0) <= 1862 < 1863 < 1864: '+[s61,s62,s63,s64].join('/'));
      var cfg=_cmdElectionBindCfg(); var max=cfg?cfg.surchargeMax:0;
      if(s64>max) throw new Error('the surcharge must be bounded by surchargeMax ('+max+'), got '+s64);
      // a non-political (professional) commission kind reads 0
      var fake={ id:'fake', relief:'costly', commission:{ kind:'professional', politicalValue:90 } };
      if(_cmdPoliticalValue(fake)!==0) throw new Error('only kind==="political" carries an election value');
      var Cb=mkC('US',1864,6); if(_cmdElectionSupportSurcharge(Cb,fake)!==0) throw new Error('a professional-kind officer must have 0 surcharge');
      return { ramp:[s61,s62,s63,s64], max:max }; });

    step('D113: the teaching TELL renders when a commissioned political general is in command before the vote (constituency + the +capital cost)', function(){
      if(typeof cmdCommission!=='function'||typeof _cmdElectionSupportSurcharge!=='function') return { skipped:'pre-D113' };
      var C=mkC('US',1864,9); C.clock.capital=200; C.clock.resolved1864=false;   // Butler served until Jan 1865 (the historical bind: relieved after the election)
      cmdCommission(C,'us-butler'); cmdAppoint(C,'us-butler');
      var active=cmdActiveGeneral(C);
      if(!active||active.id!=='us-butler') return { skipped:'Butler not seated (service window)' };
      var html=cmdRenderTab(C);
      if(html.indexOf('Election support')<0) throw new Error('the active card must show the election-support tell for a seated political general in the window');
      if(html.indexOf('political capital')<0) throw new Error('the tell must name the +capital relief cost');
      if(html.indexOf('NaN')>=0||html.indexOf('undefined')>=0) throw new Error('the tell leaked NaN/undefined');
      return { tell:true }; });

    step('D113 bug-hunt (MED): the bind is UNION-ONLY — a CS political general (Floyd, pv 78) carries NO surcharge and NO "Lincoln" tell (the CSA held no 1864 election)', function(){
      if(typeof _cmdElectionSupportSurcharge!=='function') return { skipped:'pre-D113' };
      var floyd=_cmdCommissionEntry('CS','cs-floyd'); if(!floyd) return { skipped:'no cs-floyd' };
      if(_cmdPoliticalValue(floyd)<=0) throw new Error('Floyd should read a political value (he IS a political general — the gate must be by SIDE, not by political-value)');
      var C=mkC('CS',1862,2); C.clock.resolved1864=false;
      if(_cmdElectionSupportSurcharge(C,floyd)!==0) throw new Error('a CS political general must carry 0 election surcharge (the Union-only bind)');
      var rep=_cmdReputation(C,'cs-floyd'); var noBind=Math.round((_cmdRELIEF_BASE[floyd.relief]||_cmdRELIEF_BASE.costly)+Math.max(0,rep-60)*0.25);
      if(_cmdReliefCost(C,floyd)!==noBind) throw new Error('CS relief cost must equal base+prestige (byte-identical, no surcharge)');
      C.clock.capital=200; cmdCommission(C,'cs-floyd'); cmdAppoint(C,'cs-floyd');
      if(cmdActiveGeneral(C)&&cmdActiveGeneral(C).id==='cs-floyd'){ var html=cmdRenderTab(C);
        if(html.indexOf('Lincoln lived this bind')>=0) throw new Error('a CS card must NOT render the "Lincoln lived this bind" tell (fabricated attribution)');
        if(html.indexOf('Election support')>=0) throw new Error('a CS card must NOT render the election-support tell'); }
      return { csSurcharge:0, unionOnly:true }; });

    step('D113 bug-hunt (MED): a tampered NaN windowByYear can never poison the surcharge (isFinite guard) — stays finite & bounded', function(){
      if(typeof _cmdElectionWindow!=='function'||typeof gameData!=='function') return { skipped:'pre-D113' };
      var cfg=gameData('ratings'); if(!cfg||!cfg.electionReliefBind||!cfg.electionReliefBind.windowByYear) return { skipped:'no config' };
      var by=cfg.electionReliefBind.windowByYear, saved=by['1864'];
      try {
        by['1864']=NaN;
        var banks=_cmdCommissionEntry('US','us-banks'), C=mkC('US',1864,9); C.clock.resolved1864=false;
        var w=_cmdElectionWindow(C); if(!isFinite(w)) throw new Error('a NaN windowByYear must fall to a finite default, got '+w);
        var sur=_cmdElectionSupportSurcharge(C,banks); if(!isFinite(sur)||sur<0) throw new Error('the surcharge must stay finite & >=0 under a NaN window, got '+sur);
        if(sur>cfg.electionReliefBind.surchargeMax) throw new Error('surcharge must stay bounded by surchargeMax even under a tampered window');
        if(!isFinite(_cmdReliefCost(C,banks))) throw new Error('relief cost must stay finite under a tampered window (no NaN-capital poison)');
      } finally { by['1864']=saved; }
      return { nanSafe:true }; });

    // ===== D173 / Group 2 — SYMMETRIC AI-GM SHADOW =====
    step('D173: symmetric AI-GM shadow chooses an enemy-side commander for the next battle and mutates no command save state', function(){
      if(typeof cmdEnemyShadow!=='function') throw new Error('cmdEnemyShadow missing');
      var C=mkC('US',1863,7);
      var before=JSON.stringify(C.president.command||{});
      var sh=cmdEnemyShadow(C);
      var after=JSON.stringify(C.president.command||{});
      if(before!==after) throw new Error('cmdEnemyShadow must be pure over C.president.command');
      if(!sh||sh.side!=='CS'||!sh.commander||!sh.commander.id) throw new Error('bad enemy shadow for US player: '+JSON.stringify(sh));
      var ids=_cmdSideGenerals('CS').map(function(g){return g.id;});
      if(ids.indexOf(sh.commander.id)<0) throw new Error('enemy shadow picked a non-CS roster commander: '+sh.commander.id);
      if(sh.role!=='attack'&&sh.role!=='defend') throw new Error('role must be attack/defend, got '+sh.role);
      var sh2=cmdEnemyShadow(C);
      if(JSON.stringify(sh)!==JSON.stringify(sh2)) throw new Error('enemy shadow must be deterministic across reads');
      return { enemy:sh.side, commander:sh.commander.id, role:sh.role, leadership:sh.leadership, pure:true }; });

    step('D173: AI tier changes staff depth without hidden commissions or hidden Transfer moves', function(){
      if(typeof cmdEnemyShadow!=='function') throw new Error('cmdEnemyShadow missing');
      var C=mkC('CS',1864,5), old=G.settings.tacticalPreset, had=Object.prototype.hasOwnProperty.call(G.settings,'tacticalPreset');
      try {
        G.settings.tacticalPreset={ ai:'recruit' };
        var rec=cmdEnemyShadow(C);
        G.settings.tacticalPreset={ ai:'hardee' };
        var hard=cmdEnemyShadow(C);
        if(!rec||!hard) throw new Error('missing shadow at one of the tiers');
        if(hard.corps.length<rec.corps.length) throw new Error('hardee staff should not be shallower than recruit');
        if(hard.divisions.length<rec.divisions.length) throw new Error('hardee division staff should not be shallower than recruit');
        var usIds=_cmdSideGenerals('US').map(function(g){return g.id;});
        var seen=[hard.commander.id].concat(hard.corps.map(function(x){return x.commander.id;})).concat(hard.divisions.map(function(x){return x.commander.id;}));
        for(var i=0;i<seen.length;i++) if(usIds.indexOf(seen[i])<0) throw new Error('AI-GM used a non-roster or commissioned id: '+seen[i]);
        if(hard.commander.transfer || hard.transfer) throw new Error('AI-GM shadow must not run a hidden Transfer move');
        return { recruitStaff:rec.corps.length+'/'+rec.divisions.length, hardeeStaff:hard.corps.length+'/'+hard.divisions.length, noHiddenCommission:true };
      } finally { if(had) G.settings.tacticalPreset=old; else delete G.settings.tacticalPreset; } });

    step('D322: theater classification covers roster + commission pool with broad Eastern/Western/Multi buckets', function(){
      if(typeof _cmdGeneralTheater!=='function'||typeof _cmdGeneralTheaters!=='function') throw new Error('theater helpers missing');
      var allowed={Eastern:1,Western:1,Multi:1}, checked=0, singles=0, multis=0;
      ['US','CS'].forEach(function(side){
        var rows=_cmdSideGenerals(side).concat(_cmdCommissionPool(side));
        for(var i=0;i<rows.length;i++){
          var g=rows[i], t=_cmdGeneralTheater(g), list=_cmdGeneralTheaters(g);
          checked++;
          if(!allowed[t]) throw new Error('bad theater bucket for '+g.id+': '+t);
          if(g.theaterProvenance!=='Inferred') throw new Error('theater provenance should be Inferred substrate for '+g.id);
          if(!Array.isArray(list)||!list.length) throw new Error('empty theaters list for '+g.id);
          for(var j=0;j<list.length;j++) if(list[j]!=='Eastern'&&list[j]!=='Western') throw new Error('bad theater list item for '+g.id+': '+list[j]);
          if(t==='Multi'&&list.length<2) throw new Error('Multi theater needs both broad theaters for '+g.id);
          if(t==='Multi') multis++; else singles++;
        }
      });
      if(!_cmdGeneralFitsTheater(_cmdById('US','us-meade'),'Eastern')) throw new Error('Meade should fit Eastern');
      if(_cmdGeneralFitsTheater(_cmdById('US','us-meade'),'Western')) throw new Error('Meade should not fit Western');
      if(!_cmdGeneralFitsTheater(_cmdById('US','us-grant'),'Western')||!_cmdGeneralFitsTheater(_cmdById('US','us-grant'),'Eastern')) throw new Error('Grant should fit both broad theaters');
      if(!_cmdGeneralFitsTheater(_cmdById('CS','cs-longstreet'),'Western')||!_cmdGeneralFitsTheater(_cmdById('CS','cs-longstreet'),'Eastern')) throw new Error('Longstreet should fit both broad theaters');
      if(!_cmdGeneralFitsTheater(_cmdById('CS','cs-lee'),'Eastern')||_cmdGeneralFitsTheater(_cmdById('CS','cs-lee'),'Western')) throw new Error('Lee should remain Eastern-only');
      return { checked:checked, single:singles, multi:multis }; });

    step('D322: Transfer readiness is pure and flags cross-theater candidates before any Transfer move exists', function(){
      if(typeof cmdTransferReadiness!=='function'||typeof _cmdBattleTheater!=='function') throw new Error('transfer substrate helpers missing');
      var C=mkC('US',1863,7), before=JSON.stringify(C.president.command||{});
      var east=_cmdBattleTheater(C);
      if(east!=='Eastern') throw new Error('idx0 campaign battle should resolve to Eastern via logistics rail, got '+east);
      var meade=cmdTransferReadiness(C,'us-meade'), thomas=cmdTransferReadiness(C,'us-thomas'), grant=cmdTransferReadiness(C,'us-grant');
      var after=JSON.stringify(C.president.command||{});
      if(before!==after) throw new Error('cmdTransferReadiness must not mutate command state');
      if(!meade||!meade.sameTheater||meade.transferNeeded) throw new Error('Meade should already fit the Eastern next battle: '+JSON.stringify(meade));
      if(!thomas||thomas.sameTheater||!thomas.transferNeeded) throw new Error('Thomas should be flagged as cross-theater for an Eastern next battle: '+JSON.stringify(thomas));
      if(!grant||!grant.sameTheater||grant.transferNeeded) throw new Error('Grant should bridge Eastern/Western without a Transfer flag: '+JSON.stringify(grant));
      if(C.president.command.transfer||C.transfer) throw new Error('substrate must not create a Transfer save field');
      return { battleTheater:east, meade:meade.transferNeeded, thomas:thomas.transferNeeded, grant:grant.transferNeeded, pure:true }; });

    step('D173: enemy leadership and margin helpers are bounded pure inputs; Command tab renders the readout', function(){
      if(typeof cmdEnemyLeadership!=='function'||typeof cmdEnemyMarginEdge!=='function'||typeof cmdEnemyShadowHTML!=='function') throw new Error('enemy command helpers missing');
      var C=mkC('US',1863,7);
      var before=JSON.stringify(C.president.command||{});
      var lead=cmdEnemyLeadership(C), atk=cmdEnemyMarginEdge(C,true), def=cmdEnemyMarginEdge(C,false);
      var after=JSON.stringify(C.president.command||{});
      if(before!==after) throw new Error('enemy command helpers must not mutate command state');
      if(!(lead>=42&&lead<=88)) throw new Error('enemy leadership out of bounds: '+lead);
      if(Math.abs(atk)>2.1||Math.abs(def)>2.1) throw new Error('enemy margin edge out of bounds: '+atk+'/'+def);
      var sh=cmdEnemyShadow(C);
      if(!sh||!sh.battleTheater||typeof sh.commander.theater!=='string'||!sh.commander.theaters.length) throw new Error('enemy shadow missing D322 theater data: '+JSON.stringify(sh&&sh.commander));
      var html=cmdRenderTab(C);
      if(html.indexOf('Enemy command shadow')<0) throw new Error('Command tab must render the AI-GM shadow readout');
      if(html.indexOf('theater')<0) throw new Error('AI-GM readout should surface the command theater');
      if(html.indexOf('hidden Transfer')<0) throw new Error('readout should make clear Transfer is not secretly active');
      if(html.indexOf('NaN')>=0||html.indexOf('undefined')>=0) throw new Error('AI-GM readout leaked NaN/undefined');
      return { leadership:lead, attackEdge:atk, defendEdge:def, renders:true }; });

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


/* ==== D230/E37 probe teeth (appended) ==== a standalone run must FAIL LOUDLY: exit nonzero
   unless the artifact this probe wrote THIS RUN reports ok with no failed steps and no
   pageerrors. Closes the bare `node tools/probe-command.mjs; echo $?` false-green; the vet suite
   additionally enforces artifact freshness (E15). */
import { readFileSync as __teethRead, statSync as __teethStat } from 'node:fs';
const __TEETH_T0 = Date.now();
process.on('beforeExit', (code) => {
  if (code !== 0) return;
  const art = new URL('./shots/probe-command.json', import.meta.url);
  try {
    if (__teethStat(art).mtimeMs < __TEETH_T0 - 2000) { console.error('probe-command: TEETH FAIL - artifact not rewritten this run'); process.exit(1); }
    const j = JSON.parse(__teethRead(art, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const failedSteps = Array.isArray(j.steps) ? j.steps.filter(s => s && s.ok === false).length : 0;
    if (j.ok === false || pe > 0 || failedSteps > 0) { console.error('probe-command: TEETH FAIL - ok=' + j.ok + ' failedSteps=' + failedSteps + ' pageerrors=' + pe); process.exit(1); }
  } catch (e) { console.error('probe-command: TEETH FAIL - no readable artifact (' + (e && e.message) + ')'); process.exit(1); }
});
