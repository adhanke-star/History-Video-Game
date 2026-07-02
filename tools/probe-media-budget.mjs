#!/usr/bin/env node
// Focused gate for the Phase H media budget and optional-HD-pack boundary.
// This is filesystem-only: no browser, no asset fetch, no generated output mutation.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });

const steps = [];
function step(name, fn) {
  try {
    const v = fn();
    steps.push({ name, ok: true, detail: v === undefined ? null : v });
  } catch (e) {
    steps.push({ name, ok: false, error: String(e && e.message || e) });
  }
}
function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}
function walkFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name[0] === '.') continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(p));
    else if (ent.isFile()) out.push(p);
  }
  return out;
}
function categoryOf(file) {
  const rel = file.replace(join(ROOT, 'assets', 'embed') + '/', '');
  return rel.split('/')[0] || '';
}
function bytesByCategory(files) {
  const by = {};
  let total = 0;
  for (const f of files) {
    const b = statSync(f).size;
    total += b;
    const c = categoryOf(f);
    by[c] = by[c] || { files: 0, bytes: 0 };
    by[c].files++;
    by[c].bytes += b;
  }
  return { total, by };
}
function buildBudgetBytes() {
  const txt = readFileSync(join(ROOT, 'tools', 'build.mjs'), 'utf8');
  const get = (name) => {
    const re = new RegExp('const\\s+' + name + '\\s*=\\s*([0-9.]+)\\s*\\*\\s*1024\\s*\\*\\s*1024');
    const m = txt.match(re);
    if (!m) throw new Error('could not find ' + name + ' in tools/build.mjs');
    return Math.round(Number(m[1]) * 1024 * 1024);
  };
  return { soft: get('EMBED_SOFT'), hard: get('EMBED_HARD') };
}

const budget = readJson('data/media-budget.json');
const cutaways = readJson('data/footage-cutaways.json');
const files = walkFiles(join(ROOT, 'assets', 'embed'));
const totals = bytesByCategory(files);
const warnings = [];

step('schema and core policy are present', () => {
  if (budget.schema !== 'cw_media_budget_v1') throw new Error('bad schema ' + budget.schema);
  const p = budget.policy || {};
  if (p.singleFileCore !== true || p.optionalHdPackForHeavyMedia !== true) throw new Error('core/HD policy missing');
  if (p.runtimeWebDependency !== false || p.sharedArrayBufferRequired !== false) throw new Error('runtime dependency guard missing');
  if (p.videoEnabledByDefault !== false || p.requiresProvenanceBeforeVideo !== true) throw new Error('video provenance guard missing');
  return { schema: budget.schema, version: budget.schemaVersion };
});

step('data budget matches build.mjs hard and soft caps', () => {
  const b = buildBudgetBytes();
  if (budget.policy.rawEmbedSoftBytes !== b.soft) throw new Error('soft cap drift: data=' + budget.policy.rawEmbedSoftBytes + ' build=' + b.soft);
  if (budget.policy.rawEmbedHardBytes !== b.hard) throw new Error('hard cap drift: data=' + budget.policy.rawEmbedHardBytes + ' build=' + b.hard);
  return b;
});

step('current embedded core stays below hard cap and review warning', () => {
  if (totals.total > budget.policy.rawEmbedHardBytes) throw new Error('embed raw bytes over hard cap: ' + totals.total);
  if (totals.total > budget.policy.currentReviewWarnBytes) throw new Error('embed raw bytes over review warning: ' + totals.total);
  if (totals.total > budget.policy.rawEmbedSoftBytes && budget.policy.softWarningIsNonFatal !== true) throw new Error('soft cap exceeded without nonfatal warning policy');
  if (totals.total > budget.policy.rawEmbedSoftBytes) warnings.push('raw embed tier is above the soft warning budget but below hard/review caps');
  if (files.length > budget.policy.maxCoreFiles) throw new Error('too many embedded core files: ' + files.length);
  return { files: files.length, rawBytes: totals.total, rawMB: +(totals.total / 1048576).toFixed(3) };
});

step('embedded categories are declared and image-only', () => {
  const declared = new Set((budget.categories || []).filter(c => c.allowedInSingleFile).map(c => c.id));
  const cats = Object.keys(totals.by).sort();
  const undeclared = cats.filter(c => !declared.has(c));
  if (undeclared.length) throw new Error('undeclared embedded categories: ' + undeclared.join(', '));
  const videoExt = files.filter(f => ['.mp4', '.webm', '.mov', '.m4v'].includes(extname(f).toLowerCase()));
  if (videoExt.length) throw new Error('video file found in assets/embed: ' + videoExt.map(f => f.replace(ROOT + '/', '')).join(', '));
  return cats.reduce((acc, c) => {
    acc[c] = { files: totals.by[c].files, bytes: totals.by[c].bytes };
    return acc;
  }, {});
});

step('H2 moving-image slots are still disabled and local-fallback only', () => {
  if (!cutaways.policy || cutaways.policy.videoEnabledByDefault !== false || cutaways.policy.runtimeWebDependency !== false) throw new Error('bad H2 policy');
  const bad = [];
  for (const r of cutaways.records || []) {
    const v = r.video || {};
    if (v.enabled === true || v.sourcePath || v.externalUrl) bad.push(r.id || r.battleId || '(record)');
  }
  if (bad.length) throw new Error('enabled or path-bearing H2 video slots: ' + bad.join(', '));
  return { records: (cutaways.records || []).length };
});

step('future heavy media is locked to explicit decision or optional pack', () => {
  const cats = budget.categories || [];
  const h2 = cats.find(c => c.id === 'h2-footage');
  const hd = cats.find(c => c.id === 'hd-terrain-models');
  if (!h2 || h2.allowedInSingleFile !== false || h2.hdPackCandidate !== true) throw new Error('h2-footage lock missing');
  if (!hd || hd.allowedInSingleFile !== false || hd.hdPackCandidate !== true) throw new Error('hd-terrain-models lock missing');
  if (!Array.isArray(h2.requiredBeforeEnable) || h2.requiredBeforeEnable.length < 4) throw new Error('h2 requirements underspecified');
  const locks = budget.locks || {};
  if (!/battle/i.test(locks.battleBuild || '') || !/Tripo/.test(locks.tripo || '') || !/disabled/.test(locks.h2Video || '')) throw new Error('queue locks underspecified');
  return { h2: h2.status, hd: hd.status };
});

const ok = steps.every(s => s.ok);
const out = {
  ok,
  passed: steps.filter(s => s.ok).length,
  total: steps.length,
  warnings,
  metrics: {
    files: files.length,
    rawBytes: totals.total,
    rawMB: +(totals.total / 1048576).toFixed(3),
    categories: totals.by
  },
  steps
};
writeFileSync(join(OUT, 'probe-media-budget.json'), JSON.stringify(out, null, 2));
console.log('probe-media-budget ok=' + ok + ' steps=' + out.passed + '/' + out.total + ' rawMB=' + out.metrics.rawMB + ' warnings=' + warnings.length);
for (const s of steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.error);
if (!ok) process.exit(1);
