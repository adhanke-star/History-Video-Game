#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TMP = join(ROOT, '.tmp');
mkdirSync(TMP, { recursive: true });

const SUITE = [
  ['build gate', 'tools/build.mjs'],
  ['soldier replacements import gate', 'tools/import-soldier-replacements.mjs'],
  ['women in war import gate', 'tools/import-women-in-war.mjs'],
  ['boot default renderer', 'tools/bootprobe.mjs'],
  ['turn-one smoke', 'tools/t1probe.mjs'],
  ['main menu', 'tools/menuprobe.mjs'],
  ['president desk', 'tools/probe-desk.mjs'],
  ['strategy bridge', 'tools/probe-bridge.mjs'],
  ['auto resolve', 'tools/probe-auto-resolve.mjs'],
  ['campaign link', 'tools/probe-campaign-link.mjs'],
  ['economy', 'tools/probe-economy.mjs'],
  ['production', 'tools/probe-production.mjs'],
  ['logistics rail', 'tools/probe-logistics-rail.mjs'],
  ['prisoner exchange', 'tools/probe-prisoner-exchange.mjs'],
  ['disease medical', 'tools/probe-disease-medical.mjs'],
  ['blockade', 'tools/probe-blockade.mjs'],
  ['manpower', 'tools/probe-manpower.mjs'],
  ['victory', 'tools/probe-victory.mjs'],
  ['cabinet', 'tools/probe-cabinet.mjs'],
  ['decisions', 'tools/probe-decisions.mjs'],
  ['morale', 'tools/probe-morale.mjs'],
  ['press', 'tools/probe-press.mjs'],
  ['command', 'tools/probe-command.mjs'],
  ['camp', 'tools/probe-camp.mjs'],
  ['loot survival', 'tools/probe-loot-survival.mjs'],
  ['women in war', 'tools/probe-women-in-war.mjs'],
  ['ratings', 'tools/probe-ratings.mjs'],
  ['order of battle', 'tools/probe-oob.mjs'],
  ['codex', 'tools/probe-codex.mjs'],
  ['glossary', 'tools/probe-glossary.mjs'],
  ['tutorial', 'tools/probe-tutorial.mjs'],
  ['playstyle', 'tools/probe-playstyle.mjs'],
  ['realism teaching', 'tools/probe-realism-teaching.mjs'],
  ['accessibility', 'tools/probe-accessibility.mjs'],
  ['h0 main menu', 'tools/probe-h0-main-menu.mjs'],
  ['h0 president desk', 'tools/probe-h0-president-desk.mjs'],
  ['h0 battle briefing', 'tools/probe-h0-battle-briefing.mjs'],
  ['h0 between battle', 'tools/probe-h0-between-battle.mjs'],
  ['h0 tactical hud', 'tools/probe-h0-tactical-hud.mjs'],
  ['h0 after action', 'tools/probe-h0-after-action.mjs'],
  ['save slots', 'tools/probe-save-slots.mjs'],
  ['divergence', 'tools/probe-divergence.mjs'],
  ['alternate endings', 'tools/probe-endings.mjs'],
  ['after action', 'tools/probe-afteraction.mjs'],
  ['weapons', 'tools/probe-weapons.mjs'],
  ['cannon corps', 'tools/probe-cannon.mjs'],
  ['armory field', 'tools/probe-armory-field.mjs'],
  ['photo embed', 'tools/probe-photo-embed.mjs'],
  ['portraits', 'tools/probe-portraits.mjs'],
  ['arms imagery', 'tools/probe-arms-imagery.mjs'],
  ['usct imagery', 'tools/probe-usct-imagery.mjs'],
  ['leaders imagery', 'tools/probe-leaders-imagery.mjs'],
  ['scenes imagery', 'tools/probe-scenes-imagery.mjs'],
  ['h2 cutaways', 'tools/probe-h2-cutaways.mjs'],
  ['field sandbox', 'tools/probe-field.mjs'],
  ['bull run', 'tools/probe-bullrun.mjs'],
  ['fog', 'tools/probe-fog.mjs'],
  ['autopause', 'tools/probe-autopause.mjs'],
  ['attacker ai', 'tools/probe-ai.mjs'],
  ['officers', 'tools/probe-officers.mjs'],
  ['logistics', 'tools/probe-logistics.mjs'],
  ['arms', 'tools/probe-arms.mjs'],
  ['presets', 'tools/probe-presets.mjs'],
  ['cs player', 'tools/probe-csplayer.mjs'],
  ['engineering', 'tools/probe-engineering.mjs'],
  ['engineering corps', 'tools/probe-engineering-corps.mjs'],
  ['cover', 'tools/probe-cover.mjs'],
  ['targeting', 'tools/probe-targeting.mjs'],
  ['phased 3d', 'tools/probe-phased-3d.mjs'],
  ['phased byte identity', 'tools/probe-phased-ab.mjs'],
  ['order feel', 'tools/probe-order-feel.mjs'],
  ['terrain readability', 'tools/probe-terrain-readability.mjs'],
  ['visual fidelity', 'tools/probe-visual-fidelity.mjs'],
  ['render richness', 'tools/probe-render-richness.mjs'],
  ['tripo unit assets import gate', 'tools/import-tripo-unit-assets.mjs'],
  ['tripo unit assets', 'tools/probe-tripo-unit-assets.mjs'],
  ['formation figures', 'tools/probe-formation-figures.mjs'],
  ['weather', 'tools/probe-weather.mjs'],
  ['atmospherics', 'tools/probe-atmospherics.mjs'],
  ['audio ambience', 'tools/probe-audio-ambience.mjs'],
  ['flags', 'tools/probe-flags.mjs'],
  ['tactical visuals', 'tools/probe-tactical-visuals.mjs'],
  ['tactical roster', 'tools/probe-tactical-roster.mjs'],
  ['custom battle builder', 'tools/probe-custom-battle-builder.mjs'],
  ['fredericksburg', 'tools/probe-fredericksburg.mjs'],
  ['antietam', 'tools/probe-antietam.mjs'],
  ['gettysburg', 'tools/probe-gettysburg.mjs'],
  ['chancellorsville', 'tools/probe-chancellorsville.mjs'],
  ['malvern hill', 'tools/probe-malvern-hill.mjs'],
  ['shiloh', 'tools/probe-shiloh.mjs'],
  ['vicksburg', 'tools/probe-vicksburg.mjs'],
  ['chickamauga', 'tools/probe-chickamauga.mjs'],
  ['all-battles sweep', 'tools/sweep-all-battles.mjs'],
  ['full campaign', 'tools/probe-full-campaign.mjs'],
  ['classic paint', 'tools/diag-classic.mjs']
];

const listOnly = process.argv.includes('--list');
const fromArg = process.argv.find(a => a.startsWith('--from='));
const fromLabel = fromArg ? fromArg.slice('--from='.length).toLowerCase() : '';
let suite = SUITE;
if (fromLabel) {
  const idx = suite.findIndex(([label]) => label.toLowerCase() === fromLabel);
  if (idx < 0) {
    console.error('Unknown --from label: ' + fromLabel);
    process.exit(2);
  }
  suite = suite.slice(idx);
}

if (listOnly) {
  suite.forEach(([label, file], i) => console.log(String(i + 1).padStart(2, '0') + ' ' + label + ' :: ' + file));
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const logPath = join(TMP, `vet-no-regression-${stamp}.log`);
writeFileSync(logPath, '');
const DEFAULT_TIMEOUT_MS = Number(process.env.VET_TIMEOUT_MS || 360000);
const SCREENSHOT_NO_FONTS_READY = process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY || '1';

function append(s) {
  process.stdout.write(s);
  writeFileSync(logPath, s, { flag: 'a' });
}

function jsonPathFor(file) {
  const base = basename(file, '.mjs');
  if (base === 'build') return '';
  return join(ROOT, 'tools', 'shots', base + '.json');
}

function readJsonSummary(file) {
  const p = jsonPathFor(file);
  if (!p) return null;
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    const pe = Array.isArray(j.pageerrors) ? j.pageerrors.length : 0;
    const re = Array.isArray(j.realErrors) ? j.realErrors.length : null;
    return { path: p, json: j, pageerrors: pe, realErrors: re };
  } catch {
    return null;
  }
}

function enforceJson(label, file, summary) {
  if (!summary) return;
  const { json, pageerrors, realErrors } = summary;
  if (json.ok === false) throw new Error(label + ' wrote ok=false in ' + summary.path);
  if (pageerrors > 0) throw new Error(label + ' wrote pageerrors=' + pageerrors + ' in ' + summary.path);
  if (realErrors !== null && realErrors > 0) throw new Error(label + ' wrote realErrors=' + realErrors + ' in ' + summary.path);
}

function enforceDiagClassic(output) {
  const match = output.match(/diag:\s*(\{[^\n]+\})/);
  if (!match) throw new Error('diag-classic did not print a diag JSON line');
  const diag = JSON.parse(match[1]);
  if (diag.err) throw new Error('diag-classic err=' + diag.err);
  if (Number(diag.nonBlank || 0) < 300) throw new Error('diag-classic nonBlank too low: ' + diag.nonBlank);
  if (diag.m3dActive !== false) throw new Error('diag-classic expected m3dActive=false, got ' + diag.m3dActive);
}

function timeoutFor(label, file) {
  if (file.endsWith('probe-phased-3d.mjs')) return 360000;
  if (file.endsWith('probe-render-richness.mjs')) return 900000;
  if (file.endsWith('probe-weather.mjs')) return 900000;
  if (file.endsWith('probe-tactical-visuals.mjs')) return 600000;
  if (file.endsWith('sweep-all-battles.mjs')) return 360000;
  if (file.endsWith('probe-full-campaign.mjs')) return 360000;
  if (file.endsWith('build.mjs')) return 240000;
  return DEFAULT_TIMEOUT_MS;
}

function killProbe(child, signal) {
  try { process.kill(-child.pid, signal); return; } catch {}
  try { child.kill(signal); } catch {}
}

function runOne(label, file) {
  return new Promise((resolveRun, rejectRun) => {
    const started = Date.now();
    append('\n== ' + label + ' :: node ' + file + ' ==\n');
    const child = spawn(process.execPath, [file], {
      cwd: ROOT,
      env: Object.assign({}, process.env, { TMPDIR: TMP, PW_TEST_SCREENSHOT_NO_FONTS_READY: SCREENSHOT_NO_FONTS_READY }),
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    let timedOut = false;
    let sigkillTimer = null;
    const limit = timeoutFor(label, file);
    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      append('!! ' + label + ' timed out after ' + Math.round(limit / 1000) + 's; terminating process group\n');
      killProbe(child, 'SIGTERM');
      sigkillTimer = setTimeout(() => killProbe(child, 'SIGKILL'), 5000);
      sigkillTimer.unref();
    }, limit);
    timeoutTimer.unref();
    child.stdout.on('data', buf => { const s = String(buf); output += s; append(s); });
    child.stderr.on('data', buf => { const s = String(buf); output += s; append(s); });
    child.on('error', rejectRun);
    child.on('close', code => {
      try {
        clearTimeout(timeoutTimer);
        if (sigkillTimer) clearTimeout(sigkillTimer);
        const elapsed = ((Date.now() - started) / 1000).toFixed(1);
        append('== ' + label + ' exit=' + code + ' elapsed=' + elapsed + 's ==\n');
        if (timedOut) throw new Error(label + ' timed out after ' + Math.round(limit / 1000) + 's');
        if (code !== 0) throw new Error(label + ' exited ' + code);
        if (file.endsWith('diag-classic.mjs')) enforceDiagClassic(output);
        const summary = readJsonSummary(file);
        enforceJson(label, file, summary);
        if (summary) {
          const ok = Object.prototype.hasOwnProperty.call(summary.json, 'ok') ? summary.json.ok : 'n/a';
          append('json ' + basename(summary.path) + ' ok=' + ok + ' pageerrors=' + summary.pageerrors + '\n');
        }
        resolveRun();
      } catch (e) {
        rejectRun(e);
      }
    });
  });
}

append('vet-no-regression start ' + new Date().toISOString() + '\n');
append('log: ' + logPath + '\n');
append('CODEX_SANDBOX=' + (process.env.CODEX_SANDBOX || '<unset>') + '\n');
append('PW_TEST_SCREENSHOT_NO_FONTS_READY=' + SCREENSHOT_NO_FONTS_READY + '\n');

for (const [label, file] of suite) {
  await runOne(label, file);
}

append('\nVET NO-REGRESSION OK — ' + suite.length + ' commands\n');
