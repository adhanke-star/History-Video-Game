#!/usr/bin/env node
// tools/probe-ai.mjs — TACTICAL ENGINE P1b-iii (role-aware AI: the smarter CS DEFENDER doctrine).
// Verifies EMPIRICALLY on the renderer-agnostic sim (no GPU → no swiftshader flake): the asymmetric
// scenario routes the DEFENDER (CS) to fldAiDefender and the ATTACKER (US) + the SANDBOX to the
// unchanged fldAiGeneric; the four defender behaviors fire deterministically (counterattack on a leash,
// fighting withdrawal to the reverse slope, hold-the-line-in-cover, rear-reinforcement-advances); an
// A/B BALANCE SWEEP proves the doctrine makes the Confederate defender materially stronger than the
// prior generic-for-both AI on identical seeds, and that a smart defender and fog are SUBSTITUTABLE
// defender levers (not strictly additive — fog also blinds the defender's own reactivity) (D58);
// determinism holds; the SANDBOX is a byte-behavior no-op (attacker null → the defender path is
// unreachable); no Classic contamination. Writes shots/probe-ai.json + shots/probe-ai.png.
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
  function strength(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side&&u.alive) c+=u.men; } return Math.round(c); }
  // a steady, full unit at (x,z) — the helper for the behavioral setups
  function mk(id, side, x, z, men, st){ var u=fldMakeUnit({id:id, side:side, name:id, arm:'inf', weapon:'rifled', men:men, xp:2, x:x, z:z, facing:(side==='US'?0:Math.PI), ai:true});
    u.state = st || 'steady'; u.morale = (st==='wavering') ? 40 : 78; return u; }
  function casTot(side){ var c=0; for(var i=0;i<__FIELD.units.length;i++){ var u=__FIELD.units[i]; if(u.side===side) c+=((u.maxMen||0)-(u.men||0)); } return Math.round(c); }
  // run a full Bull Run AI-vs-AI battle headless under (seed, fog, mode) and report the verdict.
  // mode: 'gen' = both sides generic (pre-P1b-iii) · 'def' = defender doctrine only (P1b-iii) · 'both' = + attacker (P1b-iv)
  function runBR(seed, fog, mode){
    fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:seed});
    __FIELD.fog = !!fog;
    __FIELD._aiGenericAll = (mode === 'gen'); __FIELD._aiGenericAtk = (mode === 'def');   // 'both' -> neither hook
    __FIELD.phase='battle'; __FIELD.paused=false;
    var n=0; while(__FIELD.phase==='battle' && n<20000){ fldSimStep(0.05); n++; }
    return { winner:__FIELD.winner, by:__FIELD.winBy, t:Math.round(__FIELD.t), us:strength('US'), cs:strength('CS'), csCas:casTot('CS'), usCas:casTot('US') };
  }
  function csScore(r){ var d=r.cs-r.us; if(r.winner==='CS') return 1000000+d; if(r.winner==='draw') return 500000+d; return r.t*1000+d; }
  function tally(acc, r){ acc[r.winner]=(acc[r.winner]||0)+1; acc.score+=csScore(r); acc.csCas+=r.csCas; return acc; }
  function sweep(seeds, fog, docMode){
    var base={US:0,CS:0,draw:0,score:0,csCas:0}, doc={US:0,CS:0,draw:0,score:0,csCas:0};
    for(var i=0;i<seeds.length;i++){ tally(base, runBR(seeds[i], fog, 'gen')); tally(doc, runBR(seeds[i], fog, docMode||'def')); }
    return { base:base, doc:doc, seeds:seeds.length };
  }
  try {
    if (typeof fldLaunchSandbox!=='function' || typeof __FIELD==='undefined' || typeof fldAiDefender!=='function' || typeof fldAiGeneric!=='function')
      return JSON.stringify({ok:false, fatal:'__FIELD engine / role-aware AI fns missing'});
    G.settings=G.settings||{}; G.settings.gfx='classic'; G.mode='menu'; G.settings.tacticalFog=false; __FIELD._officersOff=true; __FIELD._logisticsOff=true;   // B-2/B-3: lock the AI doctrine sweep BYTE-IDENTICAL (officers + logistics off; each layer -> its own probe)

    step('ROUTING: a scenario sets attacker/defender (CS=defender); the sandbox is symmetric (attacker null)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:1});
      if(__FIELD.attacker!=='US') throw new Error('bullrun attacker should be US, got '+__FIELD.attacker);
      if(__FIELD.defender!=='CS') throw new Error('bullrun defender should be CS, got '+__FIELD.defender);
      if(fldEnemy(__FIELD.attacker)!=='CS') throw new Error('defender-side mismatch');
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:1});  // sandbox
      if(__FIELD.attacker!==null) throw new Error('sandbox attacker should be null, got '+__FIELD.attacker);
      if(__FIELD._aiGenericAll) throw new Error('the A/B hook _aiGenericAll must default falsy (inert)');
      return { scenAttacker:'US', scenDefender:'CS', sandboxAttacker:null }; });

    step('COUNTERATTACK: steady defender on the hill charges a CATCHABLE (wavering) attacker — gated by reach, the dual leash, catchability, and local parity', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:2});
      __FIELD.fog=false; __FIELD._aiGenericAll=false;
      var o=__FIELD.objective;
      function hold(cs){ cs.state='steady'; cs.order={type:'hold',tx:cs.x,tz:cs.z,tface:cs.facing}; }
      // (a) wavering attacker within reach + within both leashes + parity -> CHARGE
      var cs=mk('CSd','CS', o.x, o.z+30, 1500, 'steady');
      var us=mk('USw','US', o.x, o.z+110, 800, 'wavering'); us.ai=false;
      __FIELD.units=[cs, us]; fldAiUnit(cs);
      if(cs.order.type!=='charge') throw new Error('did not counterattack a catchable (wavering) attacker on the hill: '+cs.order.type);
      if(Math.abs(cs.order.tx-us.x)>1 || Math.abs(cs.order.tz-us.z)>1) throw new Error('charge not aimed at the wavering attacker');
      // (b) CATCHABLE-ONLY: a ROUTING target (outruns the charge) must NOT be chased
      hold(cs); var ur=mk('USr','US', o.x, o.z+110, 800, 'routing'); ur.ai=false;
      __FIELD.units=[cs, ur]; fldAiUnit(cs);
      if(cs.order.type==='charge') throw new Error('chased a ROUTING target it can never catch (catchable-only broken): '+cs.order.type);
      // (c) TARGET LEASH: a wavering target BEYOND obj.r+CTR_LEASH (=290) must NOT be chased even when in reach
      var csf=mk('CSf','CS', o.x, o.z+130, 1500, 'steady');            // forward defender, still on the hill (dObj=130<215)
      var uf=mk('USf','US', o.x, o.z+295, 800, 'wavering'); uf.ai=false; // dObj 295 >= 290 (leash), but wd 165 < 175 (in reach)
      __FIELD.units=[csf, uf]; fldAiUnit(csf);
      if(csf.order.type==='charge') throw new Error('broke the TARGET leash: chased a wavering enemy beyond OBJ_R+CTR_LEASH');
      // (d) DEFENDER-OWN leash: a defender already drawn OFF the hill must NOT charge (even a close wavering target)
      var cso=mk('CSo','CS', o.x, o.z+270, 1500, 'steady');            // dObj 270 > obj.r+CTR_LEASH*0.5 (=215)
      var uo=mk('USo','US', o.x, o.z+170, 800, 'wavering'); uo.ai=false; // wd 100 < 175, target dObj 280 < 290
      __FIELD.units=[cso, uo]; fldAiUnit(cso);
      if(cso.order.type==='charge') throw new Error('broke the DEFENDER-own leash: charged from off the hill (dObj>215)');
      // (e) CTR_RATIO: a locally OUTNUMBERED defender must NOT over-commit
      var csw=mk('CSwk','CS', o.x, o.z+30, 500, 'steady');             // few defenders (500)
      var uw=mk('USmass','US', o.x, o.z+110, 900, 'wavering'); uw.ai=false; // 500 < 900*0.9 -> ratio fails
      __FIELD.units=[csw, uw]; fldAiUnit(csw);
      if(csw.order.type==='charge') throw new Error('outnumbered defender over-committed (CTR_RATIO guard not enforced)');
      return { charged:true, catchableOnly:true, targetLeash:true, ownLeash:true, ratioGuard:true }; });

    step('FIGHTING WITHDRAWAL: a wavering defender with a stronger attacker close falls back to the REVERSE SLOPE (not a deep flight), still facing the threat', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:3});
      __FIELD.fog=false; __FIELD._aiGenericAll=false;
      var o=__FIELD.objective;
      var cs=mk('CSw','CS', o.x, o.z+200, 1200, 'wavering');      // forward of the crest, shaken
      var us=mk('USs','US', o.x, o.z+250, 2600, 'steady'); us.ai=false;  // stronger, close
      __FIELD.units=[cs, us];
      fldAiUnit(cs);
      if(cs.order.type!=='move') throw new Error('wavering defender did not withdraw (order '+cs.order.type+')');
      if(!(cs.order.tz < cs.z)) throw new Error('withdrawal did not move toward the reverse slope (tz '+Math.round(cs.order.tz)+' vs z '+Math.round(cs.z)+')');
      // it must cross BEHIND the crest (tz < objective z) — distinguishes a true reverse-slope withdrawal from a
      // forward-face delay-fallback (whose target is FORWARD of the crest); without this the branches alias.
      if(!(cs.order.tz < o.z)) throw new Error('withdrawal did not cross behind the crest to the reverse slope: tz='+Math.round(cs.order.tz)+' vs crest '+o.z);
      if(cs.order.tz < o.z - o.r) throw new Error('withdrawal fled too deep past the reverse slope: tz='+Math.round(cs.order.tz));
      // facing the threat (south, ~PI), not away
      if(Math.abs(fldAngDiff(cs.order.tface, Math.PI)) > 0.5) throw new Error('withdrawing defender turned its back on the enemy');
      return { withdrew:true, toZ:Math.round(cs.order.tz), fromZ:Math.round(cs.z), facesThreat:true }; });

    step('HOLD THE LINE: an on-the-line steady defender holds the forward face (does NOT advance into the open toward the attacker)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:4});
      __FIELD.fog=false; __FIELD._aiGenericAll=false;
      var o=__FIELD.objective;
      var cs=mk('CSh','CS', o.x, o.z+Math.round(o.r*0.55), 1500, 'steady');  // exactly on the hold line
      var us=mk('USn','US', o.x, o.z+150, 1500, 'steady'); us.ai=false;       // in rifle range but steady
      __FIELD.units=[cs, us];
      var z0=cs.z;
      fldAiUnit(cs);
      if(cs.order.type!=='hold') throw new Error('on-line defender did not hold: '+cs.order.type);
      if(cs.order.tz > z0 + 40) throw new Error('defender advanced into the open toward the attacker (tz '+Math.round(cs.order.tz)+' > z '+Math.round(z0)+')');
      return { held:true, holdZ:Math.round(cs.order.tz) }; });

    step('ADVANCE TO THE LINE: a rear reinforcement (deep behind the crest) marches UP to the hold line in column', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:6});
      __FIELD.fog=false; __FIELD._aiGenericAll=false;
      var o=__FIELD.objective;
      var cs=mk('CSr','CS', o.x, o.z-250, 1500, 'steady');   // deep behind (low z), far from the line -> column
      __FIELD.units=[cs];                                     // no enemy: bearing falls back to the attacker edge
      fldAiUnit(cs);
      if(cs.order.type!=='move') throw new Error('rear reinforcement did not advance: '+cs.order.type);
      if(!(cs.order.tz > cs.z)) throw new Error('rear reinforcement did not move toward the front (tz '+Math.round(cs.order.tz)+' vs z '+Math.round(cs.z)+')');
      if(cs.formation!=='column') throw new Error('a distant advance should be in column, got '+cs.formation);
      // BEARING-FLIP GUARD: even with a VISIBLE attacker that has reached the crest (which would flip a
      // threat-bearing frame toward the rear), the stable frame must still send the deep-rear unit FORWARD.
      var cs2=mk('CSr2','CS', o.x, o.z-250, 1500, 'steady');
      var usCrest=mk('USc','US', o.x, o.z-10, 1500, 'steady'); usCrest.ai=false;  // attacker on/behind the crest
      __FIELD.units=[cs2, usCrest]; fldAiUnit(cs2);
      if(cs2.order.type!=='move' || !(cs2.order.tz > cs2.z)) throw new Error('rear reinforcement STRANDED when the attacker crossed the crest (bearing-flip): '+cs2.order.type+' tz='+Math.round(cs2.order.tz));
      return { advanced:true, toZ:Math.round(cs.order.tz), formation:cs.formation, bearingFlipSafe:true }; });

    step('BALANCE A/B (fog OFF): the smart defender ALONE flips Bull Run from a Union sweep to a CS-favored fight (the logged "AI leans Union" fix)', function(){
      var seeds=[1,7,21,42,55,101,303,909];
      var s=sweep(seeds, false);
      // the OLD generic-for-both AI is the baseline; it should heavily favor the Union (the logged gap)...
      if(!(s.doc.score > s.base.score)) throw new Error('doctrine did not improve the CS aggregate vs baseline: doc='+s.doc.score+' base='+s.base.score);
      if(!(s.base.CS < s.doc.CS)) throw new Error('baseline should lean Union (fewer CS wins than the doctrine): base.CS='+s.base.CS+' doc.CS='+s.doc.CS);
      // ...and the defender doctrine ALONE (fog default OFF) should make the CS win a MAJORITY — the headline.
      if(!(s.doc.CS >= Math.ceil(s.seeds/2))) throw new Error('the smart defender alone should win a CS majority fog-OFF, got '+s.doc.CS+'/'+s.seeds);
      return { seeds:s.seeds, baseline:{CS:s.base.CS,US:s.base.US,draw:s.base.draw,score:s.base.score}, doctrine:{CS:s.doc.CS,US:s.doc.US,draw:s.doc.draw,score:s.doc.score} }; });

    step('BALANCE A/B (fog ON): the doctrine still beats the old AI and keeps the CS competitive', function(){
      var seeds=[1,7,21,42,55,101,303,909];
      var s=sweep(seeds, true);
      if(!(s.doc.score > s.base.score)) throw new Error('doctrine did not improve the CS aggregate (fog ON): doc='+s.doc.score+' base='+s.base.score);
      if(!(s.doc.CS > s.base.CS)) throw new Error('doctrine won no more CS battles than the old AI (fog ON): '+s.doc.CS+' vs '+s.base.CS);
      if(!(s.doc.CS >= Math.floor(s.seeds/3))) throw new Error('the CS is shut out with fog ON: '+s.doc.CS+'/'+s.seeds);
      return { seeds:s.seeds, baseline:{CS:s.base.CS,US:s.base.US,draw:s.base.draw}, doctrine:{CS:s.doc.CS,US:s.doc.US,draw:s.doc.draw} }; });

    // The honest relationship (decide-&-log): a smart defender and fog are SUBSTITUTABLE defender levers,
    // not strictly additive — fog also blinds the defender's own reactivity, so stacking them is bounded.
    // Both, independently, keep the CS competitive; that is the verified claim (not fog-ON > fog-OFF).
    step('LEVER MATRIX: both fog states keep the CS competitive under the doctrine (substitutable, not additive)', function(){
      var seeds=[1,7,21,42,55,101,303,909], floor=Math.floor(seeds.length/3);
      var off=sweep(seeds,false), on=sweep(seeds,true);
      if(!(off.doc.CS >= floor)) throw new Error('fog-OFF doctrine shut the CS out: '+off.doc.CS);
      if(!(on.doc.CS >= floor)) throw new Error('fog-ON doctrine shut the CS out: '+on.doc.CS);
      return { seeds:seeds.length,
        matrix:{ fogOff:{base:off.base.CS, doctrine:off.doc.CS}, fogOn:{base:on.base.CS, doctrine:on.doc.CS} },
        note:'CS-win counts /'+seeds.length+'; defender doctrine vs the old generic-for-both AI' }; });

    // ---------- P1b-iv: the ATTACKER doctrine ----------
    step('ATTACKER ROUTING: in a scenario the ATTACKER side runs fldAiAttacker; the sandbox + the _aiGenericAtk hook fall back to generic', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:2});
      if(typeof fldAiAttacker!=='function') throw new Error('fldAiAttacker missing');
      if(__FIELD._aiGenericAtk) throw new Error('the A/B hook _aiGenericAtk must default falsy (inert)');
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:2});  // sandbox: attacker null -> generic for both
      if(__FIELD.attacker!==null) throw new Error('sandbox attacker should be null');
      return { attackerDoctrine:true, hookInert:true, sandboxSymmetric:true }; });

    step('ATTACKER ASSAULTS a SIGHTED steady defender once CLOSED with local superiority (fog OFF) — presses the bayonet, not a fire trade', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:2});
      __FIELD.fog=false; __FIELD._aiGenericAll=false; __FIELD._aiGenericAtk=false;
      var o=__FIELD.objective;
      var cs=mk('CSdef','CS', o.x, o.z+20, 1200, 'steady');                 // a steady defender on the hill
      var a1=mk('USa','US', o.x-30, o.z+90, 1500, 'steady'); a1.ai=true;     // closed (nd~76<130, dObj~95<obj.r+70)
      var a2=mk('USb','US', o.x+30, o.z+95, 1500, 'steady'); a2.ai=true;     // a 2nd brigade -> local mass + global weight
      __FIELD.units=[cs,a1,a2]; fldAiUnit(a1);
      if(a1.order.type!=='charge') throw new Error('attacker did not assault a sighted+closed+locally-outmassed steady defender: '+a1.order.type);
      if(Math.abs(a1.order.tx-cs.x)>1 || Math.abs(a1.order.tz-cs.z)>1) throw new Error('assault not aimed at the defender');
      return { assault:true }; });

    step('ATTACKER is CAUTIOUS WHEN BLIND (fog ON, objective unsighted) — advances, does NOT blind-assault into hidden reserves (fog AIDS the defender)', function(){
      fldLaunchSandbox({renderer:'none', scenario:'bullrun1', autoBoth:true, seed:2});
      __FIELD.fog=true; __FIELD._aiGenericAll=false; __FIELD._aiGenericAtk=false;
      var o=__FIELD.objective;
      var a1=mk('USa','US', o.x, o.z+100, 1500, 'steady'); a1.ai=true;       // closed on the (apparently empty) crest
      var cs=mk('CShid','CS', o.x, o.z-420, 1500, 'steady');                 // the defense is unseen (out of sight, far from the objective)
      __FIELD.units=[a1, cs]; __FIELD.vis={US:{},CS:{}};                     // fog: nothing scouted -> blind
      fldAiUnit(a1);
      if(a1.order.type==='charge') throw new Error('a BLIND attacker launched an assault into the unseen objective (fog must make it cautious -> aids the defender)');
      // contrast: fog OFF with a SIGHTED close defender -> it WOULD assault (proven by the prior step) — so fog changed the behavior
      return { blindOrder:a1.order.type, assaultedBlind:false }; });

    step('BALANCE A/B (P1b-iv both doctrines): Bull Run stays CS-FAVORED fog-OFF, FOG AIDS THE DEFENDER (no inversion), the attacker PRESSES (bloodier)', function(){
      var seeds=[101,202,303,404,505,606,707,909];
      var off=sweep(seeds,false,'both'), on=sweep(seeds,true,'both'), defOff=sweep(seeds,false,'def');
      // (1) defender-FAVORED fog-OFF — a CS majority (historical: the South won First Bull Run) but competitive (US can break through)
      if(!(off.doc.CS >= Math.ceil(seeds.length/2))) throw new Error('both-doctrines fog-OFF not CS-favored: '+off.doc.CS+'/'+seeds.length);
      // (2) FOG AIDS THE DEFENDER (the fork-#2 lock): fog-ON CS win count >= fog-OFF — the prototype INVERTED here; tuned out.
      if(!(on.doc.CS >= off.doc.CS)) throw new Error('fog did NOT aid the defender (inversion not tuned out): fogON CS='+on.doc.CS+' < fogOFF CS='+off.doc.CS);
      // (3) the attacker doctrine WORKS — it presses real assaults, so the defender bleeds far more than vs the passive (defender-only) attacker
      if(!(off.doc.csCas > defOff.doc.csCas * 1.5)) throw new Error('the attacker did not press (defender casualties not materially > defender-only): '+off.doc.csCas+' vs '+defOff.doc.csCas);
      return { seeds:seeds.length, fogOff_CS:off.doc.CS, fogOn_CS:on.doc.CS, fogAidsDefender:(on.doc.CS>=off.doc.CS),
        csCas_both:Math.round(off.doc.csCas/seeds.length), csCas_defOnly:Math.round(defOff.doc.csCas/seeds.length), attackerPresses:true }; });

    step('DETERMINISM under the doctrine: same seed -> same winner + same casualties', function(){
      var a=runBR(909, false, 'both'), b=runBR(909, false, 'both');
      if(a.winner!==b.winner) throw new Error('non-deterministic winner: '+a.winner+' vs '+b.winner);
      if(a.us!==b.us || a.cs!==b.cs) throw new Error('non-deterministic strength');
      return { winner:a.winner, us:a.us, cs:a.cs, endSec:a.t }; });

    step('SANDBOX NO-OP: attacker null -> the defender path is unreachable; the sandbox still resolves', function(){
      fldLaunchSandbox({renderer:'none', autoBoth:true, seed:12345});
      if(__FIELD.attacker!==null) throw new Error('sandbox attacker not null');
      __FIELD.phase='battle'; __FIELD.paused=false;
      var n=0; while(__FIELD.phase==='battle' && n<12000){ fldSimStep(0.05); n++; }
      if(__FIELD.phase!=='over') throw new Error('sandbox did not finish');
      if(['US','CS','draw'].indexOf(__FIELD.winner)<0) throw new Error('sandbox bad winner: '+__FIELD.winner);
      return { sandboxWinner:__FIELD.winner }; });

    step('NO CLASSIC CONTAMINATION: a doctrine battle never wrote G.battle / G.mode', function(){
      var modeBefore=G.mode;
      runBR(3, false, 'both');
      if(typeof G.battle!=='undefined' && G.battle && G.battle.M) throw new Error('created a Classic G.battle');
      if(G.mode!==modeBefore) throw new Error('mutated G.mode: '+G.mode);
      try{ fldExit(true); }catch(e){}
      return { gMode:G.mode, gBattle:(typeof G.battle) }; });
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
    // visual: 2D Bull Run, fog ON, mid-battle — the CS holding Henry House Hill against the Union assault.
    const shot = await page.evaluate(`(function(){
      fldLaunchSandbox({renderer:'2d', scenario:'bullrun1', autoBoth:true, seed:21});
      __FIELD.fog=true; __FIELD.phase='battle'; __FIELD.paused=true;
      fldStepN(3600, 0.05);   // ~180 sim-seconds: the rail reserves up, the defender line holding the crest
      fld2dDraw(); fldRenderTop(); fldRenderHud();
      return { simT: Math.round(__FIELD.t), winner: __FIELD.winner, phase: __FIELD.phase };
    })()`);
    result.screenshot = shot;
    await sleep(250);
    await page.screenshot({ path: join(OUT,'probe-ai.png') });
    await page.evaluate(`(function(){ try{ fldExit(true); }catch(e){} })()`);
  } catch(e){ result = { ok:false, fatal:String(e&&e.message||e), pageerrors }; }
  finally {
    writeFileSync(join(OUT,'probe-ai.json'), JSON.stringify(result, null, 2));
    await browser.close(); if (srv) srv.kill();
  }
  console.log('probe-ai ok=' + result.ok + ' steps=' + (result.steps?result.steps.length:0) + ' pageerrors=' + (result.pageerrors?result.pageerrors.length:0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  if (result.steps) for (const s of result.steps) { if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err); else console.log('  ok   ' + s.name + ' :: ' + JSON.stringify(s.v)); }
})();
