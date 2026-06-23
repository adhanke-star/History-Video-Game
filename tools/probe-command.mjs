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
