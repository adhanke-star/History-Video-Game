#!/usr/bin/env node
// Read-only data-schema validator. Reads all data/*.json files and validates
// required top-level keys per file type. Writes tools/shots/data-schema-validation.html
// with pass/fail per file.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = join(ROOT, 'data');
const SHOTS = join(__dirname, 'shots');

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function htmlEscape(s) {
  return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

// ---- Schema map: file patterns -> required top-level keys ----
// Battle files (named after battles) need id/name/phases nested inside the battle object
const BATTLE_FILES = new Set([
  'antietam.json', 'bullrun.json', 'chancellorsville.json', 'chickamauga.json',
  'chattanooga.json', 'franklin.json', 'fredericksburg.json', 'gettysburg.json', 'kennesaw.json',
  'nashville.json',
  'malvern-hill.json', 'shiloh.json', 'vicksburg.json'
]);

// Data files that use _meta for version info (no top-level schemaVersion or id)
const META_DATA_FILES = new Set([
  'cabinet.json', 'codex.json', 'decisions.json', 'generals.json',
  'loot-survival.json', 'press.json', 'primary-sources.json',
  'soldier-replacements.json', 'women-in-war.json'
]);

// Data files with top-level schemaVersion (id is nested inside data)
const SCHEMA_DATA_FILES = new Set([
  'artillery.json', 'cs-finance.json', 'diplomacy.json', 'disease-medical.json',
  'economy.json', 'engineering.json', 'flagship-units.json', 'footage-cutaways.json',
  'hard-war.json', 'human-cost.json', 'irregular-war.json', 'logistics-rail.json',
  'manpower-teaching.json', 'media-budget.json', 'prisoner-exchange.json',
  'terrain-cover.json', 'tripo-unit-assets.json', 'under-told-perspectives.json',
  'weapons.json', 'western-theater.json'
]);

// Special files
const RATINGS_FILE = 'ratings.json';

function getRequiredKeys(filename) {
  if (BATTLE_FILES.has(filename)) {
    // Battle files: no top-level schemaVersion; id/name/phases are nested inside the battle object
    return { keys: [], type: 'battle' };
  }
  if (META_DATA_FILES.has(filename)) {
    // _meta files: use _meta for version info, no top-level schemaVersion or id
    return { keys: [], type: 'meta' };
  }
  if (filename === RATINGS_FILE) {
    // ratings.json: _meta is a string, not an object
    return { keys: [], type: 'ratings' };
  }
  if (SCHEMA_DATA_FILES.has(filename)) {
    // schemaVersion files: have schemaVersion at top level, id is nested inside data
    // Some files (e.g., tripo-unit-assets.json) use 'schema' instead of 'schemaVersion'
    return { keys: [], type: 'schema' };
  }
  // Fallback: any JSON file should at least parse and have some content
  return { keys: [], type: 'generic' };
}

function main() {
  ensureDir(SHOTS);

  const files = readdirSync(DATA)
    .filter(f => f.endsWith('.json'))
    .sort();

  const results = [];

  for (const file of files) {
    const filePath = join(DATA, file);
    const { keys: requiredKeys, type } = getRequiredKeys(file);
    let parseOk = false;
    let missingKeys = [];
    let extraInfo = '';
    let data = null;

    try {
      const raw = readFileSync(filePath, 'utf8');
      data = JSON.parse(raw);
      parseOk = true;

      // Check for required keys at top level
      for (const key of requiredKeys) {
        if (!(key in data)) {
          missingKeys.push(key);
        }
      }

      // Additional checks per type
      if (type === 'battle') {
        // Find the battle key (skip _comment, _meta, schemaVersion)
        const battleKey = Object.keys(data).find(k => k !== '_comment' && k !== '_meta' && k !== 'schemaVersion');
        if (battleKey && data[battleKey]) {
          const battle = data[battleKey];
          // Check for expected nested keys — id and name are required, phases is optional
          // (some battles are single-phase tactical battles without a phases array)
          const requiredNested = ['id', 'name'];
          const missingNested = requiredNested.filter(k => !(k in battle));
          if (missingNested.length > 0) {
            missingKeys.push(...missingNested.map(k => `${battleKey}.${k}`));
          }
          if (battle.phases && Array.isArray(battle.phases)) {
            extraInfo = `${battle.phases.length} phases`;
          } else {
            extraInfo = 'single-phase (no phases array)';
          }
          if (battle.attacker && battle.defender) {
            extraInfo += (extraInfo ? ', ' : '') + `${battle.attacker} vs ${battle.defender}`;
          }
        } else {
          missingKeys.push('battle-object');
        }
      } else if (type === 'meta') {
        // Check _meta exists and is an object — some files use 'comment' instead
        if (data._meta && typeof data._meta === 'object') {
          const metaVersion = data._meta.version || data._meta.schema || '—';
          extraInfo = `_meta v${metaVersion}`;
        } else if (data.comment) {
          extraInfo = `comment: ${data.comment.substring(0, 60)}...`;
        } else {
          missingKeys.push('_meta (object) or comment');
        }
      } else if (type === 'ratings') {
        // ratings.json: _meta is a string, not an object — just note it
        if (data._meta && typeof data._meta === 'string') {
          extraInfo = `_meta is a string (${data._meta.substring(0, 60)}...)`;
        } else {
          extraInfo = 'no _meta string found';
        }
      } else if (type === 'schema') {
        // schemaVersion files — some use 'schema' instead of 'schemaVersion'
        if (data.schemaVersion) {
          extraInfo = `v${data.schemaVersion}`;
        } else if (data.schema) {
          extraInfo = `schema: ${data.schema}`;
        }
        // Check for a nested id or schema field
        if (data.version) {
          extraInfo = (extraInfo ? extraInfo + ', ' : '') + `version: ${data.version}`;
        }
      }
    } catch (e) {
      parseOk = false;
      extraInfo = e.message;
    }

    const pass = parseOk && missingKeys.length === 0;
    results.push({ file, type, parseOk, missingKeys, extraInfo, pass });
  }

  const totalPassed = results.filter(r => r.pass).length;
  const totalFailed = results.filter(r => !r.pass).length;
  const totalRows = results.length;

  const tableRows = results.map(r => {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    const statusClass = r.pass ? 'pass' : 'fail';
    const parseStatus = r.parseOk ? '✅' : '❌';
    const missingStr = r.missingKeys.length > 0 ? r.missingKeys.join(', ') : '—';
    return `<tr>
      <td>${htmlEscape(r.file)}</td>
      <td>${htmlEscape(r.type)}</td>
      <td>${parseStatus}</td>
      <td>${htmlEscape(missingStr)}</td>
      <td>${htmlEscape(r.extraInfo || '—')}</td>
      <td class="${statusClass}">${status}</td>
    </tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Data Schema Validation</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; background: #f8f9fa; color: #1a1a2e; }
  h1 { border-bottom: 2px solid #2980b9; padding-bottom: 0.5rem; }
  .summary { margin: 1rem 0; padding: 1rem; background: #fff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .summary span { margin-right: 2rem; }
  .pass { color: #27ae60; font-weight: bold; }
  .fail { color: #c0392b; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #2c3e50; color: #fff; font-weight: 600; }
  tr:hover { background: #f1f2f6; }
</style>
</head>
<body>
<h1>📋 Data Schema Validation</h1>
<div class="summary">
  <span>Total: <strong>${totalRows}</strong></span>
  <span class="pass">✅ Passed: <strong>${totalPassed}</strong></span>
  <span class="fail">❌ Failed: <strong>${totalFailed}</strong></span>
  <span>Generated: ${new Date().toISOString()}</span>
</div>
<table>
<thead>
<tr><th>File</th><th>Type</th><th>Parse OK</th><th>Missing Keys</th><th>Info</th><th>Status</th></tr>
</thead>
<tbody>
${tableRows}
</tbody>
</table>
</body>
</html>`;

  const outPath = join(SHOTS, 'data-schema-validation.html');
  writeFileSync(outPath, html, 'utf8');
  console.log(`✅ data-schema-validation.html written (${totalRows} files, ${totalPassed} passed, ${totalFailed} failed)`);
}

main();
