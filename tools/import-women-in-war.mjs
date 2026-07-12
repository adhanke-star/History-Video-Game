#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_PATH = join(ROOT, 'data', 'women-in-war.json');
const CODEX_PATH = join(ROOT, 'data', 'codex.json');
const SCHEMA = 'cw_women_in_war_v1';
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype', 'hasOwnProperty']);
const ROLE_CATEGORIES = new Set(['disguised-soldier', 'relief', 'medical', 'scout-spy', 'nursing-administration', 'diarist', 'teacher-nurse', 'contested']);
const SIDES = new Set(['US', 'CS', 'Both', 'Unclear']);
const PROVENANCE = new Set(['Verified', 'Disputed', 'Inferred']);
// D385/D386 arc law (docs/design/women-in-war-arc-spec.md §2-§3): battle-tie allowlist
// and the register law — a documented tie is legal ONLY on a Verified stage.
const ARC_TIE_ALLOWLIST = new Set(['bullrun1', 'malvernHill', 'antietam', 'fredericksburg', 'fortDonelson', 'stonesRiver', 'vicksburg']);
const ARC_REGISTERS = new Set(['documented', 'claimed']);

function usage() {
  console.log([
    'Usage:',
    '  node tools/import-women-in-war.mjs',
    '  node tools/import-women-in-war.mjs --check <pack.json>',
    '  node tools/import-women-in-war.mjs --import <pack.json> [--write]',
    '',
    'Default validates data/women-in-war.json.',
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
function safeId(v) {
  const s = cleanText(v, 160);
  return /^[A-Za-z0-9][A-Za-z0-9_.:-]{2,159}$/.test(s) ? s : '';
}
function wordCount(s) {
  const m = cleanText(s, 20000).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
  return m ? m.length : 0;
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
function codexIds() {
  const ids = new Set();
  if (!existsSync(CODEX_PATH)) return ids;
  const d = readJson(CODEX_PATH);
  const entries = d && Array.isArray(d.entries) ? d.entries : [];
  for (const e of entries) if (e && e.id) ids.add(e.id);
  return ids;
}
function validateSources(sources, errors, label) {
  const out = [];
  const seen = new Set();
  if (!Array.isArray(sources)) {
    errors.push(label + '.sources must be an array');
    return out;
  }
  for (let i = 0; i < sources.length && out.length < 16; i++) {
    const src = sources[i];
    if (!plain(src)) {
      errors.push(label + '.sources[' + i + '] must be an object');
      continue;
    }
    const row = {
      title: cleanText(src.title, 180),
      author: cleanText(src.author, 140),
      repository: cleanText(src.repository, 160),
      locator: cleanText(src.locator, 180),
      url: cleanText(src.url, 260),
      type: cleanText(src.type, 40),
      supports: cleanText(src.supports || src.note, 260),
      independent: src.independent !== false
    };
    if (!(row.title || row.repository)) errors.push(label + '.sources[' + i + '] needs title or repository');
    if (!(row.locator || row.url)) errors.push(label + '.sources[' + i + '] needs locator or URL');
    if (!['primary', 'secondary', 'tertiary'].includes(row.type)) errors.push(label + '.sources[' + i + '].type must be primary, secondary, or tertiary');
    const key = sourceKey(row);
    if (key && seen.has(key)) errors.push(label + '.sources[' + i + '] duplicates another source');
    if (key) seen.add(key);
    out.push(row);
  }
  const independent = out.filter(s => s.independent !== false).length;
  if (independent < 2) errors.push(label + ' needs at least two independent sources');
  return out;
}
function validatePack(pack) {
  const errors = [];
  const ids = new Set();
  const cids = codexIds();
  let verified = 0;
  let disputed = 0;
  scanBadKeys(pack, errors);
  if (!plain(pack)) errors.push('pack must be a JSON object');
  if (plain(pack) && pack.schema !== SCHEMA) errors.push('schema must be ' + SCHEMA);
  const records = plain(pack) && Array.isArray(pack.records) ? pack.records : [];
  if (plain(pack) && !Array.isArray(pack.records)) errors.push('records must be an array');
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const label = 'records[' + i + ']';
    if (!plain(r)) {
      errors.push(label + ' must be an object');
      continue;
    }
    const id = safeId(r.id);
    if (!id) errors.push(label + '.id must be a stable safe id');
    if (id.startsWith('ss:')) errors.push(label + '.id must not use the generated ss: namespace');
    if (Object.prototype.hasOwnProperty.call(r, 'replacePid')) errors.push(label + ' must not carry replacePid; this lane renders cards only');
    if (id && ids.has(id)) errors.push(label + '.id duplicates ' + id);
    if (id) ids.add(id);
    if (r.generated === true || r.source === 'Generated') errors.push(label + ' cannot mark a women-in-war card as generated');
    if (!cleanText(r.canonicalName, 160) || /[<>]/.test(String(r.canonicalName || ''))) errors.push(label + '.canonicalName is required and must be plain text');
    if (!ROLE_CATEGORIES.has(r.roleCategory)) errors.push(label + '.roleCategory must be one of ' + Array.from(ROLE_CATEGORIES).join(', '));
    if (!SIDES.has(r.side)) errors.push(label + '.side must be US, CS, Both, or Unclear');
    if (!cleanText(r.wartimeRole, 480)) errors.push(label + '.wartimeRole is required');
    if (!PROVENANCE.has(r.provenance)) errors.push(label + '.provenance must be Verified, Disputed, or Inferred');
    if (r.provenance === 'Verified') verified++;
    if (r.provenance === 'Disputed') {
      disputed++;
      if (!cleanText(r.disputeNote, 1200)) errors.push(label + '.disputeNote is required for Disputed records');
    }
    const sources = validateSources(r.sources, errors, label);
    if ((r.provenance === 'Verified' || r.provenance === 'Disputed') && sources.filter(s => s.independent !== false).length < 2) {
      errors.push(label + '.' + r.provenance + ' needs at least two independent sources');
    }
    if (!plain(r.registryMappable)) {
      errors.push(label + '.registryMappable must be an object');
    } else {
      if (typeof r.registryMappable.canMap !== 'boolean') errors.push(label + '.registryMappable.canMap must be boolean');
      if (!cleanText(r.registryMappable.reason, 240)) errors.push(label + '.registryMappable.reason is required');
    }
    if (r.codexRef != null) {
      const ref = cleanText(r.codexRef, 160);
      if (!safeId(ref) || ref.startsWith('ss:')) errors.push(label + '.codexRef must be a safe non-ss id');
      else if (!cids.has(ref)) errors.push(label + '.codexRef does not resolve in data/codex.json: ' + ref);
    }
    if (Array.isArray(r.warningFlags)) {
      if (!r.warningFlags.length) errors.push(label + '.warningFlags must not be empty');
      for (let w = 0; w < r.warningFlags.length; w++) if (!cleanText(r.warningFlags[w], 500)) errors.push(label + '.warningFlags[' + w + '] is empty');
    } else {
      errors.push(label + '.warningFlags must be an array');
    }
    if (!cleanText(r.integrityNote, 800)) errors.push(label + '.integrityNote is required');
    const wc = wordCount(r.playerCopy);
    if (wc < 80 || wc > 150) errors.push(label + '.playerCopy must be 80-150 words; got ' + wc);
    if (r.arc != null) validateArc(r.arc, r, errors, label + '.arc');
  }
  return { ok: errors.length === 0, errors, records: records.length, verified, disputed };
}
function validateArc(arc, record, errors, label) {
  if (!plain(arc)) {
    errors.push(label + ' must be an object');
    return;
  }
  if (!cleanText(arc.title, 120)) errors.push(label + '.title is required (<=120 chars)');
  const introWc = wordCount(arc.intro);
  if (introWc < 30 || introWc > 90) errors.push(label + '.intro must be 30-90 words; got ' + introWc);
  const stages = Array.isArray(arc.stages) ? arc.stages : null;
  if (!stages) {
    errors.push(label + '.stages must be an array');
    return;
  }
  if (stages.length < 4 || stages.length > 8) errors.push(label + '.stages must have 4-8 stages; got ' + stages.length);
  const sourceCount = Array.isArray(record.sources) ? record.sources.length : 0;
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    const sl = label + '.stages[' + i + ']';
    if (!plain(s)) {
      errors.push(sl + ' must be an object');
      continue;
    }
    if (!cleanText(s.title, 120)) errors.push(sl + '.title is required (<=120 chars)');
    if (!cleanText(s.dateRange, 80)) errors.push(sl + '.dateRange is required (<=80 chars)');
    if (/[<>]/.test(String(s.what || '') + String(s.title || '') + String(s.disputeNote || ''))) errors.push(sl + ' must be plain text (no markup)');
    const swc = wordCount(s.what);
    if (swc < 30 || swc > 130) errors.push(sl + '.what must be 30-130 words; got ' + swc);
    if (!PROVENANCE.has(s.stageProvenance)) errors.push(sl + '.stageProvenance must be Verified, Disputed, or Inferred');
    if (s.stageProvenance === 'Disputed' && !cleanText(s.disputeNote, 600)) errors.push(sl + '.disputeNote is required for Disputed stages (<=600 chars)');
    if (s.gameBattleTie != null) {
      if (!ARC_TIE_ALLOWLIST.has(s.gameBattleTie)) errors.push(sl + '.gameBattleTie not in the spec allowlist: ' + s.gameBattleTie);
      if (!ARC_REGISTERS.has(s.tieRegister)) errors.push(sl + '.tieRegister must be documented or claimed on a tied stage');
      // THE REGISTER LAW: a documented tie is legal ONLY on a Verified stage.
      if (s.tieRegister === 'documented' && s.stageProvenance !== 'Verified') errors.push(sl + ' REGISTER LAW violation: documented tie on a non-Verified stage');
    } else if (s.tieRegister != null) {
      errors.push(sl + '.tieRegister without gameBattleTie');
    }
    if (!Array.isArray(s.sourceRefs) || !s.sourceRefs.length) {
      errors.push(sl + '.sourceRefs must be a nonempty array');
    } else {
      for (const ref of s.sourceRefs) {
        if (!Number.isInteger(ref) || ref < 0 || ref >= sourceCount) errors.push(sl + '.sourceRefs entry out of range: ' + ref);
      }
    }
  }
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
  const backupDir = join(ROOT, '.tmp', 'women-in-war-backups');
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(join(backupDir, 'women-in-war-' + stamp + '.json.bak'), readFileSync(target));
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
    printResult('women in war check ' + checkPath, validatePack(readJson(resolve(checkPath))));
  } else if (importPath) {
    const incoming = readJson(resolve(importPath));
    printResult('incoming pack', validatePack(incoming));
    const merged = mergePacks(canonical, incoming);
    printResult('merged canonical dry-run', validatePack(merged));
    if (write) {
      writeCanonical(merged);
      console.log('WROTE data/women-in-war.json');
    } else {
      console.log('DRY RUN ONLY: pass --write to update data/women-in-war.json');
    }
  } else {
    printResult('canonical women in war', validatePack(canonical));
  }
  _writeGateArtifact(true, null);
} catch (e) {
  const _msg = (e && e.message ? e.message : String(e));
  console.error('WOMEN IN WAR FAIL: ' + _msg);
  try { _writeGateArtifact(false, _msg); } catch {}
  process.exit(1);
}

/* D237 (E15 follow-through): vet-no-regression requires every enrolled gate to (re)write a FRESH
   tools/shots artifact each run — this import gate predated that law and wrote none. ok mirrors
   the gate's exit semantics. */
function _writeGateArtifact(ok, error) {
  const dir = join(__dirname, 'shots');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'import-women-in-war.json'),
    JSON.stringify({ ok: ok, error: error || undefined, pageerrors: [], generatedAt: new Date().toISOString() }, null, 1));
}
