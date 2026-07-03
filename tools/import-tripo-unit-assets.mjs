#!/usr/bin/env node
// Validate optional Tripo/GLB tactical unit assets. This does not call Tripo.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = join(ROOT, 'data', 'tripo-unit-assets.json');
const STRICT = process.argv.includes('--strict-assets');

const errors = [];
const warnings = [];
const ids = new Set();

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }
function text(v, max = 400) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max); }
function plain(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype', 'hasOwnProperty']);
function scanBadKeys(o, path) {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) scanBadKeys(o[i], path + '[' + i + ']'); return; }
  for (const k of Object.keys(o)) {
    if (BAD_KEYS.has(k)) err('unsafe key "' + k + '" at ' + (path || 'pack'));
    scanBadKeys(o[k], path ? path + '.' + k : k);
  }
}
function num(v) { return typeof v === 'number' && Number.isFinite(v); }
function cleanRel(p) {
  const s = text(p, 300);
  if (!s || s[0] === '/' || s.startsWith('~') || /^[A-Za-z]+:/.test(s) || s.indexOf('\\') >= 0 || s.indexOf('\0') >= 0) return '';
  const parts = s.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) return '';
  return s;
}
function contained(abs) {
  const root = ROOT.endsWith(sep) ? ROOT : ROOT + sep;
  return abs === ROOT || abs.startsWith(root);
}
function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (e) { err('invalid JSON: ' + e.message); return null; }
}
function extOk(p) { return /\.(glb|gltf)$/i.test(p); }
function runtimePathOk(p) { return /^assets\/3d\/models\/units\/[A-Za-z0-9_.\/-]+\.(glb|gltf)$/i.test(p); }
function sourcePathOk(p) { return /^assets\/3d\/source\/tripo\/[A-Za-z0-9_.\/-]+\.(glb|gltf)$/i.test(p); }
function checkModelFile(rel, rec, maxBytes) {
  const abs = resolve(ROOT, rel);
  if (!contained(abs)) { err(rec.id + ': path escapes repo root: ' + rel); return false; }
  if (!existsSync(abs)) { err(rec.id + ': enabled runtime asset is missing: ' + rel); return false; }
  const st = statSync(abs);
  if (!st.isFile()) { err(rec.id + ': runtime asset is not a file: ' + rel); return false; }
  if (st.size > maxBytes) err(rec.id + ': runtime asset is ' + st.size + ' bytes, over maxRuntimeBytes=' + maxBytes);
  if (/\.glb$/i.test(rel)) {
    const hdr = readFileSync(abs).subarray(0, 4).toString('utf8');
    if (hdr !== 'glTF') err(rec.id + ': .glb header is not glTF');
  } else if (/\.gltf$/i.test(rel)) {
    try {
      const j = JSON.parse(readFileSync(abs, 'utf8'));
      if (!j || !j.asset || String(j.asset.version || '').slice(0, 1) !== '2') err(rec.id + ': .gltf does not declare glTF 2.x');
    } catch (e) {
      err(rec.id + ': invalid .gltf JSON: ' + e.message);
    }
  }
  return true;
}

const pack = readJson(DATA);
if (!pack) process.exit(1);

if (pack.schema !== 'cw_tripo_unit_assets_v1') err('schema must be cw_tripo_unit_assets_v1');
if (!plain(pack.policy)) err('policy object is required');
const maxBytes = plain(pack.policy) && num(pack.policy.maxRuntimeBytes) ? pack.policy.maxRuntimeBytes : 1500000;
const maxVerts = plain(pack.policy) && num(pack.policy.maxRuntimeVertices) ? pack.policy.maxRuntimeVertices : 20000;
const maxTris = plain(pack.policy) && num(pack.policy.maxRuntimeTriangles) ? pack.policy.maxRuntimeTriangles : 12000;
if (!Array.isArray(pack.records)) err('records array is required');
scanBadKeys(pack, '');

let enabled = 0;
let filesPresent = 0;
let pendingLicense = 0;
let detailedSlots = 0;

for (const rec of Array.isArray(pack.records) ? pack.records : []) {
  if (!plain(rec)) { err('record must be an object'); continue; }
  rec.id = text(rec.id, 120);
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{2,119}$/.test(rec.id)) err('bad id: ' + rec.id);
  if (ids.has(rec.id)) err('duplicate id: ' + rec.id);
  ids.add(rec.id);

  if (rec.enabled !== true && rec.enabled !== false) err(rec.id + ': enabled must be boolean');
  if (rec.enabled === true) enabled++;
  if (!['US', 'CS', 'ANY'].includes(rec.side)) err(rec.id + ': side must be US, CS, or ANY');
  if (!['inf', 'art', 'cav', 'hq', 'any'].includes(rec.arm)) err(rec.id + ': arm must be inf, art, cav, hq, or any');

  const rp = cleanRel(rec.runtimePath);
  if (!rp) err(rec.id + ': runtimePath must be a safe relative path');
  else {
    if (!runtimePathOk(rp)) err(rec.id + ': runtimePath must live under assets/3d/models/units and end .glb/.gltf');
    if (existsSync(resolve(ROOT, rp))) filesPresent++;
    if (rec.enabled || STRICT) checkModelFile(rp, rec, maxBytes);
  }

  const hasUltraSourcePath = rec.ultraSourcePath != null && !!text(rec.ultraSourcePath);
  if (hasUltraSourcePath) {
    const sp = cleanRel(rec.ultraSourcePath);
    if (!sp) err(rec.id + ': ultraSourcePath must be a safe relative path when set');
    else {
      if (!sourcePathOk(sp)) err(rec.id + ': ultraSourcePath must live under assets/3d/source/tripo and end .glb/.gltf');
      if (!extOk(sp)) err(rec.id + ': unsupported source extension');
    }
  }

  if (!num(rec.targetHeight) || rec.targetHeight < 10 || rec.targetHeight > 90) err(rec.id + ': targetHeight must be 10..90');
  if (rec.rotationY != null && !num(rec.rotationY)) err(rec.id + ': rotationY must be numeric when set');
  if (rec.hideBaseMarker !== true && rec.hideBaseMarker !== false) err(rec.id + ': hideBaseMarker must be boolean');

  if (!plain(rec.generation)) err(rec.id + ': generation object is required');
  else {
    if (rec.generation.provider !== 'tripo') err(rec.id + ': generation.provider must be tripo');
    if (!text(rec.generation.modelVersion)) err(rec.id + ': generation.modelVersion is required');
    const geometryQuality = text(rec.generation.geometryQuality, 80);
    const textureQuality = text(rec.generation.textureQuality, 80);
    if (!['standard', 'detailed'].includes(geometryQuality)) err(rec.id + ': generation.geometryQuality must be standard or detailed');
    if (!['standard', 'detailed'].includes(textureQuality)) err(rec.id + ': generation.textureQuality must be standard or detailed');
    if (geometryQuality === 'detailed') detailedSlots++;
    if (rec.generation.provider === 'tripo') {
      if (geometryQuality !== 'detailed') err(rec.id + ': Tripo source generation must use geometryQuality=detailed / Ultra');
      if (textureQuality !== 'detailed') err(rec.id + ': Tripo source generation must use textureQuality=detailed / Ultra');
      if (!hasUltraSourcePath) err(rec.id + ': Tripo Ultra source slots require ultraSourcePath');
      if (rec.generation.pbr !== true) err(rec.id + ': Tripo Ultra source slots require pbr=true');
      if (rec.generation.smartLowPoly !== true) err(rec.id + ': runtime optimization requires smartLowPoly=true');
    }
    if (!num(rec.generation.runtimeFaceLimit) || rec.generation.runtimeFaceLimit < 500 || rec.generation.runtimeFaceLimit > maxVerts) err(rec.id + ': runtimeFaceLimit must be 500..' + maxVerts);
    if (geometryQuality === 'detailed' && rec.enabled !== true) warn(rec.id + ': detailed/Ultra source slot is disabled until an optimized runtime file and license proof land');
  }

  if (!plain(rec.license)) err(rec.id + ': license object is required');
  else {
    const st = text(rec.license.status).toLowerCase();
    if (!['pending', 'clear', 'rejected'].includes(st)) err(rec.id + ': license.status must be pending, clear, or rejected');
    if (st === 'pending') pendingLicense++;
    if (rec.enabled === true) {
      if (st !== 'clear') err(rec.id + ': enabled records require license.status=clear');
      if (!text(rec.license.name)) err(rec.id + ': enabled records require license.name');
      if (rec.license.requiresAttribution === true && !text(rec.license.attribution)) err(rec.id + ': enabled records requiring attribution need attribution text');
    }
  }

  if (num(rec.maxRuntimeVertices) && rec.maxRuntimeVertices > maxVerts) err(rec.id + ': maxRuntimeVertices exceeds policy max');
  if (num(rec.maxRuntimeTriangles) && rec.maxRuntimeTriangles > maxTris) err(rec.id + ': maxRuntimeTriangles exceeds policy max');
}

/* D237 (E15 follow-through): vet-no-regression requires every enrolled gate to (re)write a FRESH
   tools/shots artifact each run — this import gate predated that law and wrote none. ok mirrors
   the gate's exit semantics. */
function _writeGateArtifact(ok, errCount) {
  const dir = join(__dirname, 'shots');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'import-tripo-unit-assets.json'),
    JSON.stringify({ ok: ok, errors: errCount, pageerrors: [], generatedAt: new Date().toISOString() }, null, 1));
}

if (errors.length) {
  console.error('TRIPO UNIT ASSETS FAIL errors=' + errors.length);
  for (const e of errors) console.error('  - ' + e);
  try { _writeGateArtifact(false, errors.length); } catch {}
  process.exit(1);
}

console.log('TRIPO UNIT ASSETS OK records=' + ids.size + ' enabled=' + enabled + ' detailedSlots=' + detailedSlots + ' filesPresent=' + filesPresent + ' pendingLicense=' + pendingLicense + ' strict=' + STRICT);
for (const w of warnings.slice(0, 12)) console.log('  warn ' + w);
_writeGateArtifact(true, 0);
