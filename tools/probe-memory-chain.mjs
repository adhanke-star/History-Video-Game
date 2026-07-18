#!/usr/bin/env node
import "./guard-probe-browser.mjs";
// tools/probe-memory-chain.mjs - GEA-12 (D447): the ONE bounded three-beat memory chain
// (emancipation-proclamation -> us-reconstruction-terms -> the divergence line). AUTHORED
// under the D443 coding-first law (VETTING DEFERRED; the FINAL audit session runs it —
// AUDIT-DEBT AD-14). Verifies the D441 contract: LEGACY-SAVE BYTE IDENTITY (the gating
// tooth — no init path ever seeds the map; a campaign that never fires beat 1 serializes
// with no memoryChains key, byte-identically through load/init round trips), chain arming
// on the issue/radical receipts only (refuse never arms), the beat-2 eligibility flip
// (1864 -> 1863, offerable-not-forced through decOnResolve's real path), beat-3 line
// determinism in divScan, the cap of 8 with unknown-id/malformed-entry drop-on-read (never
// repair), and Historical/Mayhem parity by construction (the module never reads the ruleset).
// BIND A PREDECLARATION - removing the decResolve mcOnDecisionResolved receipt seam must red
// exactly the CHAIN-ARM tooth (the map never appears), nothing else.
// BIND B PREDECLARATION - removing the _decEligible relax term must red exactly the
// ELIGIBILITY-FLIP tooth (us-reconstruction-terms stays ineligible in 1863 with the receipt).
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
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-dev-shm-usage'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function up(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok || r.status === 200; } catch { return false; } }
function killChild(child) { if (!child) return; try { child.kill(); } catch(e) {} }
async function closeBrowserHard(browser) {
  if (!browser) return;
  const proc = typeof browser.process === 'function' ? browser.process() : null;
  let closed = false;
  try {
    await Promise.race([
      browser.close().then(() => { closed = true; }, () => { closed = true; }),
      sleep(2500)
    ]);
  } catch(e) {}
  if (!closed && proc && !proc.killed) {
    try { proc.kill('SIGKILL'); } catch(e) {}
  }
}
function printResult(result) {
  console.log('probe-memory-chain ok=' + result.ok + ' steps=' + (result.steps ? result.steps.length : 0) + ' pageerrors=' + (result.pageerrors ? result.pageerrors.length : 0));
  if (result.fatal) console.log('  FATAL ' + result.fatal);
  for (const s of (result.steps || [])) {
    if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.err);
  }
}

function staticChecks() {
  const steps = [];
  const check = (name, fn) => { try { const v = fn(); steps.push({ name:'STATIC: ' + name, ok:true, v:v === undefined ? null : v }); } catch(e) { steps.push({ name:'STATIC: ' + name, ok:false, err:String(e && e.message || e) }); } };

  const mod = readFileSync(join(ROOT, 'src', '111-memory-chain.js'), 'utf8');
  const dec = readFileSync(join(ROOT, 'src', '32-decisions.js'), 'utf8');
  const div = readFileSync(join(ROOT, 'src', '81-divergence.js'), 'utf8');

  check('ONE CHAIN over EXISTING ids: MC_CHAINS declares exactly mc-emancipation-reconstruction; beat1/beat2/opts are real decisions.json ids; refuse is NOT a qualifying option', () => {
    const chains = mod.match(/"mc-[a-z-]+":/g) || [];
    if (chains.length !== 1 || chains[0] !== '"mc-emancipation-reconstruction":') throw new Error('chain set wrong: ' + chains.join(','));
    const data = JSON.parse(readFileSync(join(ROOT, 'data', 'decisions.json'), 'utf8'));
    const beat1 = data.cards.find(c => c.id === 'emancipation-proclamation');
    const beat2 = data.cards.find(c => c.id === 'us-reconstruction-terms');
    if (!beat1 || !beat2) throw new Error('beat cards missing from decisions.json');
    const optIds = new Set(beat1.options.map(o => o.id));
    ['issue', 'radical'].forEach(o => { if (!optIds.has(o)) throw new Error('qualifying option not a real option id: ' + o); });
    if (!/beat1Opts:\s*\{\s*issue:\s*1,\s*radical:\s*1\s*\}/.test(mod)) throw new Error('beat1Opts must be exactly {issue, radical}');
    if (beat2.trigger.earliestYear !== 1864) throw new Error('beat2 earliestYear moved (' + beat2.trigger.earliestYear + ') — re-adjudicate the relax');
    return { ok: true };
  });

  check('SEAM PINS: decResolve carries the guarded mcOnDecisionResolved receipt seam; _decEligible carries the guarded mcYearRelax relax; divScan carries the guarded mcChainLine push; manifest enrolls 111-memory-chain.js', () => {
    if (!/typeof mcOnDecisionResolved === "function"/.test(dec)) throw new Error('receipt seam missing');
    if (!/typeof mcYearRelax === "function"/.test(dec) || dec.indexOf('c.trigger.earliestYear - _mcRelax') < 0) throw new Error('eligibility relax missing');
    if (!/typeof mcChainLine === "function"/.test(div)) throw new Error('divScan line seam missing');
    const manifest = readFileSync(join(ROOT, 'src', '00-manifest.json'), 'utf8');
    if (manifest.indexOf('"111-memory-chain.js"') < 0) throw new Error('manifest enrollment missing');
    return { ok: true };
  });

  check('SAVE LAW BY CONSTRUCTION: src/111 never touches the envelope (no serializeSave/loadLocal/applySave/_SAVE_VER token); no init path seeds memoryChains (the ONLY writer is mcOnDecisionResolved); decInit does not reference memoryChains; MODE PARITY (no ruleset/mayhem read)', () => {
    // D453 audit root-fix (never-run tooth): src/111's own header comment NAMES the envelope
    // functions while stating the save law, so the forbidden-token scan must run over CODE
    // with comments stripped — a comment mention is documentation, not a reference.
    const modCode = mod.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    ['serializeSave', 'loadLocal', 'applySave', '_SAVE_VER', 'ruleset', 'mayhem', 'Mayhem'].forEach(tok => {
      if (modCode.indexOf(tok) >= 0) throw new Error('src/111 references ' + tok);
    });
    const writes = mod.match(/P\.memoryChains\s*=/g) || [];
    if (writes.length !== 1) throw new Error('expected exactly one lazy-creation write, got ' + writes.length);
    if (dec.indexOf('memoryChains') >= 0) throw new Error('src/32 references memoryChains directly — the src/111 single-writer law is broken');
    return { ok: true };
  });

  check('E41 GATE UNTOUCHED: tools/save-shape.json still enrolls exactly the 7 pre-D447 signatures (no envelope function moved this slice)', () => {
    const shape = JSON.parse(readFileSync(join(__dirname, 'save-shape.json'), 'utf8'));
    if (shape.saveVer !== 1) throw new Error('_SAVE_VER moved');
    if (Object.keys(shape.signatures).length !== 7) throw new Error('signature set changed');
    return { saveVer: shape.saveVer };
  });

  return steps;
}

const SETUP = `(() => {
  var R = { steps: [], errors: [], ok: true };
  function check(name, fn){ try{ var v=fn(); R.steps.push({name:name, ok:true, v: v===undefined?null:v}); }
    catch(e){ R.ok=false; R.steps.push({name:name, ok:false, err:String(e&&e.message||e)}); } }
  function mkC(side, y, m){ var C={ side:side, iron:false, idx:0, funds:200000, recovery:false, completed:[],
    roster:[{id:'R1',type:'inf',weapon:'rifled',xp:1,name:'core'}], nextId:2, stats:{battles:0,won:0,infl:0,suff:0},
    recoveryLossCount:0, recoveryMode:false, flipAtk:false, captured:[] }; G.campaign=C; _t1InitAll(C);
    C.clock.year=(y||1863); C.president.date={year:(y||1863),month:(m||6)};
    return C; }
  try {
    if (typeof mcOnDecisionResolved !== 'function' || typeof mcYearRelax !== 'function' || typeof mcChainLine !== 'function' || typeof decResolve !== 'function' || typeof divScan !== 'function')
      return JSON.stringify({ ok:false, fatal:'memory-chain/decisions API missing', steps:[], errors:[] });
    G.settings = G.settings || {}; G.settings.gfx = 'classic'; G.mode = 'menu';

    check('LEGACY BYTE IDENTITY (THE GATING TOOTH): a full init + turn tick NEVER seeds memoryChains; the serialized campaign carries no such key; a load + decInit round trip is byte-identical', function(){
      var C = mkC('US', 1862, 9);
      decOnResolve('US','win',{bd:{year:1862}},C,true);
      if ('memoryChains' in C.president) throw new Error('an init/turn path seeded the map');
      var camp = JSON.stringify(serializeSave().campaign);
      if (camp.indexOf('memoryChains') >= 0) throw new Error('serialized campaign carries the key without any beat');
      var sv = JSON.parse(JSON.stringify(serializeSave()));
      applySave(sv);
      var before = JSON.stringify(G.campaign);
      decInit(G.campaign);   // the lazy-migration path must stay idempotent and never seed the map
      var after = JSON.stringify(G.campaign);
      if (before !== after) throw new Error('decInit changed the campaign bytes on a legacy round trip');
      if (after.indexOf('memoryChains') >= 0) throw new Error('the round trip injected the key');
      return { bytes: after.length };
    });

    check('BEAT 1 ARMS ON THE ISSUE RECEIPT (closed shape); REFUSE NEVER ARMS', function(){
      var C = mkC('US', 1862, 9);
      decOnResolve('US','win',{bd:{year:1862}},C,true);
      if (C.president.pendingChoices.indexOf('emancipation-proclamation') < 0) throw new Error('the hinge did not surface in 1862');
      decResolve(C, 'emancipation-proclamation', 'radical');
      var m = C.president.memoryChains;
      if (!m || !m['mc-emancipation-reconstruction']) throw new Error('the receipt did not arm the chain');
      var e = m['mc-emancipation-reconstruction'];
      var keys = Object.keys(e).sort().join(',');
      if (keys !== 'beat2Year,opt,v,year' || e.v !== 1 || e.opt !== 'radical' || e.year !== 1862 || e.beat2Year !== 0)
        throw new Error('entry shape wrong: ' + JSON.stringify(e));
      var C2 = mkC('US', 1862, 9);
      decOnResolve('US','win',{bd:{year:1862}},C2,true);
      decResolve(C2, 'emancipation-proclamation', 'refuse');
      if ('memoryChains' in C2.president) throw new Error('refuse armed the chain');
      return { entry: e };
    });

    check('BEAT 2 ELIGIBILITY FLIP: us-reconstruction-terms is INELIGIBLE in 1863 without the receipt and ELIGIBLE in 1863 with it; every other card unaffected; the relax is exactly 1 year (1862 stays ineligible)', function(){
      var plain = mkC('US', 1863, 6);
      var card = _decById('us-reconstruction-terms');
      if (_decEligible(plain, card)) throw new Error('eligible in 1863 without the receipt — the shipped gate moved');
      var armed = mkC('US', 1862, 9);
      decOnResolve('US','win',{bd:{year:1862}},armed,true);
      decResolve(armed, 'emancipation-proclamation', 'issue');
      armed.president.date = { year: 1863, month: 6 };
      if (!_decEligible(armed, card)) throw new Error('NOT eligible in 1863 with the receipt — the flip is dead');
      armed.president.date = { year: 1862, month: 11 };
      if (_decEligible(armed, card)) throw new Error('the relax exceeded 1 year');
      armed.president.date = { year: 1863, month: 6 };
      var hard = _decById('us-hard-war');
      if (_decEligible(armed, hard)) throw new Error('a non-chain 1864 card leaked into 1863');
      if (mcYearRelax(armed, 'us-hard-war') !== 0 || mcYearRelax(armed, 'us-reconstruction-terms') !== 1) throw new Error('relax values wrong');
      return { ok: true };
    });

    check('OFFERABLE-NOT-FORCED: with the receipt, decOnResolve surfaces the beat-2 card into pendingChoices in 1863 but nothing auto-resolves it', function(){
      var C = mkC('US', 1862, 9);
      decOnResolve('US','win',{bd:{year:1862}},C,true);
      decResolve(C, 'emancipation-proclamation', 'issue');
      C.president.date = { year: 1863, month: 8 };
      decOnResolve('US','win',{bd:{year:1863}},C,true);
      if (C.president.pendingChoices.indexOf('us-reconstruction-terms') < 0) throw new Error('beat-2 card did not surface');
      if (C.president.decisionsResolved['us-reconstruction-terms']) throw new Error('beat-2 was forced');
      return { pending: C.president.pendingChoices.slice() };
    });

    check('BEAT 3 LINE + DETERMINISM: after both beats resolve, divScan carries the chain line exactly once and two scans are JSON-identical; before beat 2 it is absent', function(){
      var C = mkC('US', 1862, 9);
      decOnResolve('US','win',{bd:{year:1862}},C,true);
      decResolve(C, 'emancipation-proclamation', 'issue');
      C.president.date = { year: 1863, month: 8 };
      var pre = divScan(C).filter(function(e){ return e.id === 'mc-emancipation-reconstruction'; });
      if (pre.length) throw new Error('the line rendered before beat 2');
      decOnResolve('US','win',{bd:{year:1863}},C,true);
      decResolve(C, 'us-reconstruction-terms', 'lenient');
      var e = C.president.memoryChains['mc-emancipation-reconstruction'];
      if (e.beat2Year !== 1863) throw new Error('beat2Year not recorded: ' + e.beat2Year);
      var a = divScan(C), b = divScan(C);
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('divScan not deterministic');
      var hits = a.filter(function(x){ return x.id === 'mc-emancipation-reconstruction'; });
      if (hits.length !== 1) throw new Error('chain line count ' + hits.length);
      if (hits[0].cat !== 'Politics' || !hits[0].hist || hits[0].hist.indexOf('December 8, 1863') < 0) throw new Error('line content wrong');
      return { line: hits[0].title };
    });

    check('CAP 8 + SANITATION: with 8 foreign keys the writer refuses a 9th; unknown ids and malformed entries are dropped on read and NEVER repaired', function(){
      var C = mkC('US', 1862, 9);
      decOnResolve('US','win',{bd:{year:1862}},C,true);
      C.president.memoryChains = { f1:{}, f2:{}, f3:{}, f4:{}, f5:{}, f6:{}, f7:{}, f8:{} };
      var frozen = JSON.stringify(C.president.memoryChains);
      decResolve(C, 'emancipation-proclamation', 'issue');
      if (JSON.stringify(C.president.memoryChains) !== frozen) throw new Error('the cap did not refuse (or a foreign key was repaired/trimmed)');
      if (Object.keys(mcChains(C)).length !== 0) throw new Error('unknown ids leaked through the sanitized read');
      var C2 = mkC('US', 1863, 6);
      C2.president.memoryChains = { 'mc-emancipation-reconstruction': { v: 9, junk: true } };
      var frozen2 = JSON.stringify(C2.president.memoryChains);
      if (mcYearRelax(C2, 'us-reconstruction-terms') !== 0) throw new Error('a malformed entry granted the relax');
      if (mcChainLine(C2) !== null) throw new Error('a malformed entry rendered the line');
      if (JSON.stringify(C2.president.memoryChains) !== frozen2) throw new Error('the read repaired the stored map');
      return { ok: true };
    });

    G.campaign = null;
  } catch(e) { R.ok = false; R.errors.push(String(e && e.message || e)); }
  R.ok = R.ok && R.steps.every(function(s){ return s.ok; });
  return JSON.stringify(R);
})()`;

async function main() {
  const statics = staticChecks();
  let server = null, browser = null;
  try {
    const probe = 'http://127.0.0.1:' + cfg.port + '/civil_war_generals.html';
    if (!(await up(probe))) {
      server = spawn('python3', ['-m', 'http.server', String(cfg.port)], { cwd: ROOT, stdio: 'ignore' });
      for (let i = 0; i < 80; i++) { if (await up(probe)) break; await sleep(150); }
    }
    try { browser = await chromium.launch({ channel:'chrome', headless:true, args:GL }); }
    catch(e) { browser = await chromium.launch({ executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:GL }); }
    const page = await browser.newPage({ viewport: cfg.viewport });
    await page.addInitScript(() => { try { localStorage.setItem('gor_welcomed', '1'); } catch(e) {} });
    const pageerrors = [];
    page.on('pageerror', err => pageerrors.push(String(err.message)));
    await page.goto(probe, { waitUntil:'domcontentloaded', timeout:45000 });
    await sleep(400);
    const data = JSON.parse(await page.evaluate(SETUP));
    data.steps = statics.concat(data.steps || []);
    data.pageerrors = pageerrors;
    data.ok = !!data.ok && statics.every(s => s.ok) && !pageerrors.length;
    writeFileSync(join(OUT, 'probe-memory-chain.json'), JSON.stringify(data, null, 2));
    printResult(data);
    const fail = (data.steps || []).filter(s => !s.ok);
    if (!data.ok || fail.length || pageerrors.length) {
      for (const e of pageerrors) console.error('  PAGE ERROR:', e);
      process.exit(1);
    }
    console.log('ALL OK');
  } finally {
    await closeBrowserHard(browser);
    killChild(server);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error('FATAL:', e); process.exit(1); });
