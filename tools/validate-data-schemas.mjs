#!/usr/bin/env node
// Read-only data-schema validator. Reads all data/*.json files and validates
// required top-level keys per file type. Writes tools/shots/data-schema-validation.html
// with pass/fail per file.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml } from './report-html-escape.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = join(ROOT, 'data');
const SHOTS = join(__dirname, 'shots');
const diagnosticArg = process.argv.find(arg => arg.startsWith('--diagnostic-invalid='));
const DIAGNOSTIC_INVALID = diagnosticArg ? diagnosticArg.slice('--diagnostic-invalid='.length) : '';
const DIAGNOSTIC_FAMILIES = new Set(['', 'all', 'battle', 'meta', 'schema', 'ratings']);
if (!DIAGNOSTIC_FAMILIES.has(DIAGNOSTIC_INVALID)) {
  console.error('Unknown diagnostic family: ' + DIAGNOSTIC_INVALID);
  process.exit(2);
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// ---- Closed-world schema map: every family requires substantive nonempty keys ----
const BATTLE_FILES = new Set([
  'antietam.json', 'bullrun.json', 'chancellorsville.json', 'chickamauga.json',
  'chattanooga.json', 'cedar-creek.json', 'cross-keys-port-republic.json', 'franklin.json', 'fredericksburg.json', 'gaines-mill.json', 'gettysburg.json', 'kennesaw.json',
  'five-forks.json', 'nashville.json', 'new-market-heights.json',
  'malvern-hill.json', 'shiloh.json', 'stones-river.json', 'vicksburg.json'
]);

const META_REQUIREMENTS = new Map([
  ['cabinet.json', ['_meta', 'sides', 'crossCards']],
  ['codex.json', ['_meta', 'axes', 'entries']],
  ['decisions.json', ['_meta', 'cards']],
  ['generals.json', ['comment', 'sides', 'teachingCards']],
  ['loot-survival.json', ['_meta', 'rarities', 'survival', 'drops', 'items']],
  ['press.json', ['_meta', 'papers', 'teachingCards']],
  ['primary-sources.json', ['_meta', 'schema', 'categories', 'records']],
  ['soldier-replacements.json', ['_meta', 'schema', 'records', '_template']],
  ['women-in-war.json', ['_meta', 'schema', 'records']]
]);

const SCHEMA_REQUIREMENTS = new Map([
  ['artillery.json', ['schemaVersion', 'guns', 'teachingCards']],
  ['cs-finance.json', ['schema', 'schemaVersion', 'config', 'profile', 'instruments']],
  ['diplomacy.json', ['schemaVersion', 'teachingCards', 'realDiplomacy', 'numbersAudit']],
  ['disease-medical.json', ['schema', 'schemaVersion', 'config', 'profiles', 'practices', 'debates']],
  ['economy.json', ['schemaVersion', 'sides', 'finance', 'production', 'manpower', 'timeline', 'teachingCardIndex']],
  ['engineering.json', ['schemaVersion', 'branches', 'teachingCards']],
  ['flagship-units.json', ['schema', 'schemaVersion', 'config', 'profiles', 'units', 'debates']],
  ['footage-cutaways.json', ['schema', 'schemaVersion', 'policy', 'records']],
  ['hard-war.json', ['schema', 'schemaVersion', 'config', 'profiles', 'policies', 'debates']],
  ['human-cost.json', ['schema', 'schemaVersion', 'historicalScale', 'profile', 'anchors', 'debates']],
  ['irregular-war.json', ['schema', 'schemaVersion', 'config', 'profiles', 'threads', 'debates']],
  ['logistics-rail.json', ['schema', 'schemaVersion', 'config', 'profiles', 'theaters', 'routes', 'benchmarks', 'debates']],
  ['manpower-teaching.json', ['schemaVersion', 'teachingCards', 'numbersAudit']],
  ['media-budget.json', ['schema', 'schemaVersion', 'policy', 'performanceProfile', 'categories', 'locks']],
  ['prisoner-exchange.json', ['schema', 'schemaVersion', 'config', 'profiles', 'policyTimeline', 'camps', 'debates']],
  ['terrain-cover.json', ['schemaVersion', 'types', 'teachingCards']],
  ['tripo-unit-assets.json', ['schema', 'version', 'policy', 'records']],
  ['under-told-perspectives.json', ['schema', 'schemaVersion', 'config', 'profiles', 'threads', 'debates']],
  ['weapons.json', ['schemaVersion', 'weapons']],
  ['western-theater.json', ['schema', 'schemaVersion', 'profile', 'currentArc', 'strategicHinges', 'futureLocks', 'guardrails']]
]);

const RATINGS_FILE = 'ratings.json';
const RATINGS_REQUIREMENTS = ['_meta', 'attributes', 'ovrWeights', 'gradeBands', 'rankBase', 'realismCaps', 'badgeDefs', 'personas', 'generalPersonas'];
const BATTLE_ROOT_REQUIREMENTS = ['_comment'];
const BATTLE_REQUIREMENTS = [
  'id', 'name', 'date', 'place', 'blurb', 'attacker', 'defender', 'defaultFog',
  'field', 'objective', 'holdToWinSec', 'timeLimitSec', 'brief', 'sides',
  'teaching', 'provenance', 'weather'
];
const PHASE_REQUIREMENTS = [
  'id', 'name', 'attacker', 'defender', 'defaultFog', 'objective', 'holdToWinSec',
  'timeLimitSec', 'scoreWeight', 'oob', 'leaders', 'reinforcements', 'terrain',
  'supply', 'teaching', 'timing', 'transition', 'sector'
];
const META_ROOT_KEYS = new Set(['_comment', '_meta', 'schemaVersion']);

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function isMeaningful(v) {
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'boolean') return true;
  if (Array.isArray(v)) return v.length > 0;
  if (isObject(v)) return Object.keys(v).length > 0;
  return false;
}

function requireKeys(obj, keys, prefix, issues) {
  if (!isObject(obj)) {
    issues.push((prefix || 'root') + ' must be an object');
    return;
  }
  for (const key of keys) {
    const path = prefix ? prefix + '.' + key : key;
    if (!Object.prototype.hasOwnProperty.call(obj, key)) issues.push(path + ' missing');
    else if (!isMeaningful(obj[key])) issues.push(path + ' empty/invalid');
  }
}

function ruleFor(filename) {
  if (BATTLE_FILES.has(filename)) return { family: 'battle', required: BATTLE_ROOT_REQUIREMENTS };
  if (META_REQUIREMENTS.has(filename)) return { family: 'meta', required: META_REQUIREMENTS.get(filename) };
  if (filename === RATINGS_FILE) return { family: 'ratings', required: RATINGS_REQUIREMENTS };
  if (SCHEMA_REQUIREMENTS.has(filename)) return { family: 'schema', required: SCHEMA_REQUIREMENTS.get(filename) };
  return null;
}

function validateRoles(node, prefix, issues) {
  if (!['US', 'CS'].includes(node.attacker)) issues.push(prefix + '.attacker must be US or CS');
  if (!['US', 'CS'].includes(node.defender)) issues.push(prefix + '.defender must be US or CS');
  if (node.attacker === node.defender) issues.push(prefix + ' attacker and defender must differ');
  if (typeof node.defaultFog !== 'boolean') issues.push(prefix + '.defaultFog must be boolean');
}

function validateObjective(objective, prefix, issues) {
  if (!isObject(objective)) {
    issues.push(prefix + ' must be an object');
    return;
  }
  if (typeof objective.name !== 'string' || !objective.name.trim()) issues.push(prefix + '.name missing');
  for (const key of ['x', 'z', 'r']) {
    if (!Number.isFinite(objective[key])) issues.push(prefix + '.' + key + ' must be finite');
  }
  if (Number.isFinite(objective.r) && objective.r <= 0) issues.push(prefix + '.r must be positive');
}

function validateOob(oob, prefix, issues) {
  if (!isObject(oob)) {
    issues.push(prefix + ' must be an object');
    return;
  }
  const ids = new Set();
  for (const side of ['US', 'CS']) {
    const units = oob[side];
    if (!Array.isArray(units) || !units.length) {
      issues.push(prefix + '.' + side + ' must be a nonempty array');
      continue;
    }
    for (let i = 0; i < units.length; i++) {
      const id = units[i] && units[i].id;
      if (typeof id !== 'string' || !id.trim()) issues.push(prefix + '.' + side + '[' + i + '].id missing');
      else if (ids.has(id)) issues.push(prefix + ' duplicate unit id ' + id);
      else ids.add(id);
    }
  }
}

function validateBattle(file, data, issues) {
  const payloadKeys = Object.keys(data).filter(key => !META_ROOT_KEYS.has(key));
  if (payloadKeys.length !== 1) {
    issues.push('battle root must contain exactly one payload object; found ' + payloadKeys.length);
    return { extraInfo: payloadKeys.length + ' payload keys' };
  }
  const battleKey = payloadKeys[0];
  const battle = data[battleKey];
  requireKeys(battle, BATTLE_REQUIREMENTS, battleKey, issues);
  if (!isObject(battle)) return { extraInfo: battleKey + ' invalid' };
  if (battle.id !== battleKey) issues.push(battleKey + '.id must match payload key');
  validateRoles(battle, battleKey, issues);
  if (!isObject(battle.field) || !Number.isFinite(battle.field.w) || battle.field.w <= 0 || !Number.isFinite(battle.field.h) || battle.field.h <= 0) {
    issues.push(battleKey + '.field must have positive finite w/h');
  }
  validateObjective(battle.objective, battleKey + '.objective', issues);
  if (!Number.isFinite(battle.holdToWinSec) || battle.holdToWinSec <= 0) issues.push(battleKey + '.holdToWinSec must be a positive number');
  if (!Number.isFinite(battle.timeLimitSec) || battle.timeLimitSec <= 0) issues.push(battleKey + '.timeLimitSec must be a positive number');
  if (!isObject(battle.brief) || typeof battle.brief.attack !== 'string' || !battle.brief.attack.trim() || typeof battle.brief.defend !== 'string' || !battle.brief.defend.trim()) issues.push(battleKey + '.brief needs nonempty attack/defend strings');
  if (!isObject(battle.sides) || !isObject(battle.sides.US) || !isObject(battle.sides.CS)) issues.push(battleKey + '.sides needs US/CS objects');
  if (!isObject(battle.teaching) || !Array.isArray(battle.teaching.cards) || !battle.teaching.cards.length) issues.push(battleKey + '.teaching.cards must be nonempty');

  if (Object.prototype.hasOwnProperty.call(battle, 'phases')) {
    if (!Array.isArray(battle.phases) || !battle.phases.length) {
      issues.push(battleKey + '.phases must be a nonempty array when present');
    } else {
      const phaseIds = new Set();
      battle.phases.forEach((phase, i) => {
        const prefix = battleKey + '.phases[' + i + ']';
        requireKeys(phase, PHASE_REQUIREMENTS, prefix, issues);
        if (!isObject(phase)) return;
        if (typeof phase.id !== 'string' || !phase.id.trim()) issues.push(prefix + '.id must be a nonempty string');
        else if (phaseIds.has(phase.id)) issues.push(battleKey + ' duplicate phase id ' + phase.id);
        else phaseIds.add(phase.id);
        validateRoles(phase, prefix, issues);
        validateObjective(phase.objective, prefix + '.objective', issues);
        validateOob(phase.oob, prefix + '.oob', issues);
        if (!Number.isFinite(phase.holdToWinSec) || phase.holdToWinSec <= 0) issues.push(prefix + '.holdToWinSec must be a positive number');
        if (!Number.isFinite(phase.timeLimitSec) || phase.timeLimitSec <= 0) issues.push(prefix + '.timeLimitSec must be a positive number');
        if (!Number.isFinite(phase.scoreWeight) || phase.scoreWeight <= 0) issues.push(prefix + '.scoreWeight must be a positive number');
      });
    }
  } else {
    validateOob(battle.oob, battleKey + '.oob', issues);
    if (!Array.isArray(battle.reinforcements)) issues.push(battleKey + '.reinforcements must be an array');
    if (!isObject(battle.terrain)) issues.push(battleKey + '.terrain must be an object');
  }
  return { extraInfo: Array.isArray(battle.phases) ? battle.phases.length + ' phases, ' + battle.attacker + ' vs ' + battle.defender : 'single-phase, ' + battle.attacker + ' vs ' + battle.defender };
}

function validateDocument(file, data) {
  const rule = ruleFor(file);
  const issues = [];
  if (!rule) return { family: 'unclassified', requiredKeys: [], issues: ['file has no registered schema rule'], extraInfo: 'FAIL CLOSED' };
  if (!rule.required.length) issues.push('internal schema error: ' + rule.family + ' requires zero keys');
  requireKeys(data, rule.required, '', issues);
  let extraInfo = rule.required.length + ' required keys';
  if (rule.family === 'battle') {
    extraInfo = validateBattle(file, data, issues).extraInfo;
  } else if (rule.family === 'meta') {
    if (file === 'generals.json') {
      if (typeof data.comment !== 'string' || !data.comment.trim()) issues.push('comment metadata must be nonempty');
    } else if (!isObject(data._meta)) {
      issues.push('_meta must be an object');
    }
    extraInfo = rule.required.length + ' explicit keys';
  } else if (rule.family === 'schema') {
    const marker = ['schemaVersion', 'schema', 'version'].find(key => Object.prototype.hasOwnProperty.call(data, key) && isMeaningful(data[key]));
    if (!marker) issues.push('schema/version marker missing');
    else if (!((typeof data[marker] === 'string' && data[marker].trim()) || (typeof data[marker] === 'number' && Number.isFinite(data[marker])))) issues.push(marker + ' must be a nonempty string or finite number');
    extraInfo = (marker ? marker + '=' + String(data[marker]) : 'no version marker') + ', ' + rule.required.length + ' explicit keys';
  } else if (rule.family === 'ratings') {
    if (typeof data._meta !== 'string' || !data._meta.trim()) issues.push('_meta must be a nonempty string');
    if (!Array.isArray(data.attributes) || !data.attributes.length) issues.push('attributes must be nonempty');
    if (!isObject(data.ovrWeights)) issues.push('ovrWeights must be an object');
    extraInfo = rule.required.length + ' ratings invariants';
  }
  return { family: rule.family, requiredKeys: rule.required, issues, extraInfo };
}

function injectDiagnostic(file, family, data, rule, applied) {
  if (!DIAGNOSTIC_INVALID || (DIAGNOSTIC_INVALID !== 'all' && DIAGNOSTIC_INVALID !== family) || applied.some(item => item.family === family)) return data;
  const copy = JSON.parse(JSON.stringify(data));
  let key = '';
  if (family === 'battle') {
    const battleKey = Object.keys(copy).find(name => !META_ROOT_KEYS.has(name));
    if (battleKey && isObject(copy[battleKey])) { delete copy[battleKey].objective; key = battleKey + '.objective'; }
  } else {
    const skip = new Set(['_meta', 'comment', 'schema', 'schemaVersion', 'version']);
    key = rule.required.find(name => !skip.has(name)) || rule.required[0];
    delete copy[key];
  }
  applied.push({ family, file, removed: key });
  return copy;
}

function main() {
  ensureDir(SHOTS);

  const files = readdirSync(DATA)
    .filter(f => f.endsWith('.json'))
    .sort();

  const results = [];
  const diagnosticApplied = [];

  for (const file of files) {
    const filePath = join(DATA, file);
    const rule = ruleFor(file);
    let parseOk = false;
    let family = rule ? rule.family : 'unclassified';
    let requiredKeys = rule ? rule.required.slice() : [];
    let issues = [];
    let extraInfo = '';

    try {
      const raw = readFileSync(filePath, 'utf8');
      let data = JSON.parse(raw);
      parseOk = true;
      if (rule) data = injectDiagnostic(file, rule.family, data, rule, diagnosticApplied);
      const validated = validateDocument(file, data);
      family = validated.family;
      requiredKeys = validated.requiredKeys;
      issues = validated.issues;
      extraInfo = validated.extraInfo;
    } catch (e) {
      parseOk = false;
      issues = ['parse error: ' + e.message];
      extraInfo = e.message;
    }

    const pass = parseOk && issues.length === 0;
    results.push({ file, family, parseOk, requiredKeys, issues, extraInfo, pass });
  }

  const totalPassed = results.filter(r => r.pass).length;
  const totalFailed = results.filter(r => !r.pass).length;
  const totalRows = results.length;

  const tableRows = results.map(r => {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    const statusClass = r.pass ? 'pass' : 'fail';
    const parseStatus = r.parseOk ? '✅' : '❌';
    const issueStr = r.issues.length > 0 ? r.issues.join('; ') : '—';
    return `<tr>
      <td>${escapeHtml(r.file)}</td>
      <td>${escapeHtml(r.family)}</td>
      <td>${parseStatus}</td>
      <td>${escapeHtml(issueStr)}</td>
      <td>${escapeHtml(r.extraInfo || '—')}</td>
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
<tr><th>File</th><th>Family</th><th>Parse OK</th><th>Missing / Invalid</th><th>Info</th><th>Status</th></tr>
</thead>
<tbody>
${tableRows}
</tbody>
</table>
</body>
</html>`;

  const outPath = join(SHOTS, 'data-schema-validation.html');
  writeFileSync(outPath, html, 'utf8');
  const familyCounts = {};
  for (const result of results) {
    const row = familyCounts[result.family] || { total: 0, passed: 0, failed: 0 };
    row.total++;
    if (result.pass) row.passed++; else row.failed++;
    familyCounts[result.family] = row;
  }
  const artifact = {
    ok: totalFailed === 0,
    diagnostic: DIAGNOSTIC_INVALID || null,
    diagnosticApplied,
    total: totalRows,
    passed: totalPassed,
    failed: totalFailed,
    familyCounts,
    pageerrors: [],
    results
  };
  writeFileSync(join(SHOTS, 'validate-data-schemas.json'), JSON.stringify(artifact, null, 2), 'utf8');
  console.log(`${artifact.ok ? '✅' : '❌'} data-schema-validation.html written (${totalRows} files, ${totalPassed} passed, ${totalFailed} failed)`);
  console.log(`validate-data-schemas ok=${artifact.ok} families=${Object.keys(familyCounts).join(',')} diagnostic=${artifact.diagnostic || 'none'}`);
  process.exitCode = artifact.ok ? 0 : 1;
}

try {
  main();
} catch (e) {
  ensureDir(SHOTS);
  try {
    writeFileSync(join(SHOTS, 'validate-data-schemas.json'), JSON.stringify({ ok: false, fatal: String(e && e.message || e), pageerrors: [] }, null, 2), 'utf8');
  } catch (_) {}
  console.error('FATAL validate-data-schemas:', e && e.message || e);
  process.exitCode = 1;
}
