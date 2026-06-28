#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_PATH = join(ROOT, 'data', 'soldier-replacements.json');
const SCHEMA = 'cw_soldier_replacements_v1';
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype', 'hasOwnProperty']);
const ATTRS = [
  'tactical', 'command', 'initiative', 'resolve', 'discipline',
  'marksmanship', 'vigor', 'charisma', 'aggression', 'grit',
  'logistics', 'engineering', 'cavalry', 'artillery', 'political'
];

function usage() {
  console.log([
    'Usage:',
    '  node tools/import-soldier-replacements.mjs',
    '  node tools/import-soldier-replacements.mjs --check <pack.json>',
    '  node tools/import-soldier-replacements.mjs --import <pack.json> [--write]',
    '',
    'Default validates data/soldier-replacements.json.',
    '--import is dry-run unless --write is present.'
  ].join('\n'));
}

function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    throw new Error('cannot read JSON ' + p + ': ' + e.message);
  }
}

function plain(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
function cleanText(v, max) {
  const s = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  return max && s.length > max ? s.slice(0, max) : s;
}
function sourceKey(src) {
  return cleanText([src.title || '', src.repository || '', src.locator || '', src.url || ''].join('|'), 500).toLowerCase();
}
function scanBadKeys(node, errors, path = 'pack', depth = 0) {
  if (depth > 12) {
    errors.push(path + ' exceeds max nesting depth');
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => scanBadKeys(v, errors, path + '[' + i + ']', depth + 1));
    return;
  }
  if (!plain(node)) return;
  for (const k of Object.keys(node)) {
    if (BAD_KEYS.has(k)) {
      errors.push(path + '.' + k + ' uses a forbidden key');
      continue;
    }
    scanBadKeys(node[k], errors, path ? path + '.' + k : k, depth + 1);
  }
}
function validateSources(sources, errors, label) {
  const out = [];
  const seen = new Set();
  if (!Array.isArray(sources)) {
    errors.push(label + '.sources must be an array');
    return out;
  }
  for (let i = 0; i < sources.length && out.length < 12; i++) {
    const src = sources[i];
    if (!plain(src)) {
      errors.push(label + '.sources[' + i + '] must be an object');
      continue;
    }
    const row = {
      title: cleanText(src.title, 160),
      author: cleanText(src.author, 120),
      repository: cleanText(src.repository, 140),
      locator: cleanText(src.locator, 140),
      url: cleanText(src.url, 240),
      type: cleanText(src.type, 40),
      note: cleanText(src.note, 220)
    };
    if (!(row.title || row.repository)) errors.push(label + '.sources[' + i + '] needs title or repository');
    if (!(row.locator || row.url)) errors.push(label + '.sources[' + i + '] needs locator or URL');
    const key = sourceKey(row);
    if (key && seen.has(key)) errors.push(label + '.sources[' + i + '] duplicates another source');
    if (key) seen.add(key);
    out.push(row);
  }
  if (out.length < 2) errors.push(label + ' needs at least two independent sources');
  return out;
}
function validatePersona(persona, errors, label) {
  if (!plain(persona)) {
    errors.push(label + '.persona must be an object with all rating attributes');
    return;
  }
  for (const attr of ATTRS) {
    if (typeof persona[attr] !== 'number' || !Number.isFinite(persona[attr])) {
      errors.push(label + '.persona.' + attr + ' must be a finite number');
    } else if (persona[attr] < 0 || persona[attr] > 100) {
      errors.push(label + '.persona.' + attr + ' must be between 0 and 100');
    }
  }
}
function validateTeam(team, side, errors, label) {
  if (!plain(team)) {
    errors.push(label + '.team must be an object');
    return;
  }
  const teamSide = team.side === 'US' || team.side === 'CS' ? team.side : side;
  if (teamSide !== side) errors.push(label + '.team.side must match record side');
  if (!cleanText(team.army, 120)) errors.push(label + '.team.army is required');
  if (!(cleanText(team.brigade, 120) || cleanText(team.regiment, 120) || cleanText(team.company, 40))) {
    errors.push(label + '.team needs brigade, regiment, or company');
  }
}
function safePid(pid) {
  const s = cleanText(pid, 160);
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/.test(s) ? s : '';
}
function validatePack(pack) {
  const errors = [];
  const seenPid = new Set();
  const seenReplace = new Set();
  scanBadKeys(pack, errors);
  if (!plain(pack)) errors.push('pack must be a JSON object');
  if (plain(pack) && pack.schema !== SCHEMA) errors.push('schema must be ' + SCHEMA);
  const records = plain(pack) && Array.isArray(pack.records) ? pack.records : [];
  if (plain(pack) && !Array.isArray(pack.records)) errors.push('records must be an array');
  let verified = 0;
  let disputed = 0;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const label = 'records[' + i + ']';
    if (!plain(r)) {
      errors.push(label + ' must be an object');
      continue;
    }
    const pid = safePid(r.pid);
    if (!pid) errors.push(label + '.pid must be a stable safe id');
    if (pid.startsWith('ss:')) errors.push(label + '.pid must not use the generated ss: namespace');
    const replacePid = cleanText(r.replacePid, 220);
    if (!replacePid.startsWith('ss:')) errors.push(label + '.replacePid must target a generated ss: slot');
    if (pid && seenPid.has(pid)) errors.push(label + '.pid duplicates ' + pid);
    if (replacePid && seenReplace.has(replacePid)) errors.push(label + '.replacePid duplicates ' + replacePid);
    if (pid) seenPid.add(pid);
    if (replacePid) seenReplace.add(replacePid);
    if (r.generated === true || r.source === 'Generated') errors.push(label + ' cannot mark a sourced replacement as generated');
    if (r.side !== 'US' && r.side !== 'CS') errors.push(label + '.side must be US or CS');
    if (!cleanText(r.name, 120) || /[<>]/.test(String(r.name || ''))) errors.push(label + '.name is required and must be plain text');
    if (!cleanText(r.rank, 80)) errors.push(label + '.rank is required');
    if (!['inf', 'art', 'cav'].includes(cleanText(r.branch || 'inf', 20))) errors.push(label + '.branch must be inf, art, or cav');
    if (typeof r.year !== 'number' || !Number.isFinite(r.year) || r.year < 1861 || r.year > 1865) errors.push(label + '.year must be 1861-1865');
    if (r.provenance === 'Verified') verified++;
    else if (r.provenance === 'Disputed') {
      disputed++;
      if (!cleanText(r.disputeNote, 360)) errors.push(label + '.disputeNote is required for Disputed records');
    } else {
      errors.push(label + '.provenance must be Verified or Disputed');
    }
    validateSources(r.sources, errors, label);
    validatePersona(r.persona, errors, label);
    validateTeam(r.team, r.side, errors, label);
  }
  return { ok: errors.length === 0, errors, records: records.length, verified, disputed };
}
function mergePacks(base, incoming) {
  return Object.assign({}, base, {
    schema: SCHEMA,
    records: [...(Array.isArray(base.records) ? base.records : []), ...(Array.isArray(incoming.records) ? incoming.records : [])]
  });
}
function assertCanonicalTarget() {
  const dataRoot = realpathSync(join(ROOT, 'data'));
  const target = realpathSync(DATA_PATH);
  if (!target.startsWith(dataRoot + '/')) throw new Error('refusing to write outside data/: ' + target);
  return target;
}
function writeCanonical(pack) {
  const target = assertCanonicalTarget();
  const backupDir = join(ROOT, '.tmp', 'soldier-replacement-backups');
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(backupDir, 'soldier-replacements-' + stamp + '.json.bak'), readFileSync(target));
  writeFileSync(target, JSON.stringify(pack, null, 2) + '\n');
}
function printResult(label, result) {
  if (!result.ok) {
    console.error(label + ' FAILED errors=' + result.errors.length);
    for (const err of result.errors) console.error('  - ' + err);
    process.exit(1);
  }
  console.log(label + ' OK records=' + result.records + ' verified=' + result.verified + ' disputed=' + result.disputed);
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

let checkPath = null;
let importPath = null;
let write = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--check') checkPath = args[++i];
  else if (a === '--import') importPath = args[++i];
  else if (a === '--write') write = true;
  else {
    console.error('Unknown argument: ' + a);
    usage();
    process.exit(2);
  }
}

try {
  if (!existsSync(DATA_PATH)) throw new Error('missing canonical data file: ' + DATA_PATH);
  const canonical = readJson(DATA_PATH);
  if (checkPath) {
    printResult('soldier replacement check ' + checkPath, validatePack(readJson(resolve(checkPath))));
  } else if (importPath) {
    const incoming = readJson(resolve(importPath));
    printResult('incoming pack', validatePack(incoming));
    const merged = mergePacks(canonical, incoming);
    printResult('merged canonical dry-run', validatePack(merged));
    if (write) {
      writeCanonical(merged);
      console.log('WROTE data/soldier-replacements.json');
    } else {
      console.log('DRY RUN ONLY: pass --write to update data/soldier-replacements.json');
    }
  } else {
    printResult('canonical soldier replacements', validatePack(canonical));
  }
} catch (e) {
  console.error('SOLDIER REPLACEMENTS FAIL: ' + (e && e.message ? e.message : String(e)));
  process.exit(1);
}
