#!/usr/bin/env node
// Focused gate for the Phase H media budget and optional-HD-pack boundary.
// This is filesystem-only: no browser, no asset fetch, no generated output mutation.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

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
function baseStem(file) {
  return file.replace(/\.[^.]+$/, '');
}
function sourceMirrorSummary() {
  const categories = (budget.categories || []).filter(c => c.allowedInSingleFile);
  const detail = {};
  const bad = [];
  for (const c of categories) {
    if (!c.sourceDir || !c.embedDir) {
      bad.push(c.id + ' missing sourceDir/embedDir');
      continue;
    }
    const embedDir = join(ROOT, c.embedDir);
    const sourceDir = join(ROOT, c.sourceDir);
    if (!existsSync(embedDir)) bad.push(c.id + ' missing embedDir ' + c.embedDir);
    if (!existsSync(sourceDir)) bad.push(c.id + ' missing sourceDir ' + c.sourceDir);
    const embedFiles = walkFiles(embedDir);
    const sourceFiles = walkFiles(sourceDir);
    const sourceStems = new Set(sourceFiles.map(f => baseStem(f.replace(sourceDir + '/', ''))));
    const missing = [];
    for (const f of embedFiles) {
      const rel = f.replace(embedDir + '/', '');
      if (!sourceStems.has(baseStem(rel))) missing.push(relAsset(f));
    }
    if (missing.length) bad.push(c.id + ' orphan embeds without same-stem source: ' + missing.join(', '));
    detail[c.id] = {
      sourceDir: c.sourceDir,
      embedDir: c.embedDir,
      sourceFiles: sourceFiles.length,
      embedFiles: embedFiles.length,
      missingSource: missing
    };
  }
  return { bad, detail };
}
function readJsGlobalObject(rel, globalName) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) throw new Error('missing metadata module ' + rel);
  const box = {
    htmlEsc: function (s) {
      return String(s == null ? '' : s);
    }
  };
  createContext(box);
  runInContext(readFileSync(p, 'utf8'), box, { filename: rel });
  const obj = box[globalName];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(rel + ' did not define object ' + globalName);
  return obj;
}
function informativeMetadataSummary() {
  const categories = (budget.categories || []).filter(c => c.allowedInSingleFile && c.requiresInformativeMetadata);
  const detail = {};
  const bad = [];
  for (const c of categories) {
    if (!c.embedDir || !c.metadataModule || !c.metadataVar) {
      bad.push(c.id + ' missing embedDir/metadataModule/metadataVar');
      continue;
    }
    const embedDir = join(ROOT, c.embedDir);
    if (!existsSync(embedDir)) {
      bad.push(c.id + ' missing embedDir ' + c.embedDir);
      continue;
    }
    let table;
    try {
      table = readJsGlobalObject(c.metadataModule, c.metadataVar);
    } catch (e) {
      bad.push(c.id + ' metadata load failed: ' + String(e && e.message || e));
      continue;
    }
    const embedKeys = walkFiles(embedDir).map(f => baseStem(f.replace(embedDir + '/', ''))).sort();
    const metaKeys = Object.keys(table).sort();
    const embedSet = new Set(embedKeys);
    const metaSet = new Set(metaKeys);
    const missingMetadata = embedKeys.filter(k => !metaSet.has(k));
    const staleMetadata = metaKeys.filter(k => !embedSet.has(k));
    const incompleteMetadata = metaKeys.filter(k => {
      const m = table[k] || {};
      return !String(m.alt || '').trim() || !String(m.caption || '').trim() || !String(m.credit || '').trim();
    });
    if (missingMetadata.length) bad.push(c.id + ' embeds missing metadata: ' + missingMetadata.join(', '));
    if (staleMetadata.length) bad.push(c.id + ' metadata without embed: ' + staleMetadata.join(', '));
    if (incompleteMetadata.length) bad.push(c.id + ' metadata missing alt/caption/credit: ' + incompleteMetadata.join(', '));
    detail[c.id] = {
      embedDir: c.embedDir,
      metadataModule: c.metadataModule,
      metadataVar: c.metadataVar,
      embeds: embedKeys.length,
      metadataRecords: metaKeys.length,
      missingMetadata,
      staleMetadata,
      incompleteMetadata
    };
  }
  return { bad, detail };
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
function relAsset(file) {
  return file.replace(ROOT + '/', '');
}
function fileMetrics(files) {
  return files.map(f => {
    const bytes = statSync(f).size;
    return { path: relAsset(f), category: categoryOf(f), bytes };
  }).sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
}
function categoryLimits() {
  const out = {};
  for (const c of budget.categories || []) {
    if (!c.allowedInSingleFile) continue;
    out[c.id] = {
      freezeMaxFiles: Number(c.freezeMaxFiles || 0),
      freezeMaxRawBytes: Number(c.freezeMaxRawBytes || 0)
    };
  }
  return out;
}
function categorySummary() {
  const limits = categoryLimits();
  const cats = Array.from(new Set(Object.keys(limits).concat(Object.keys(totals.by)))).sort();
  return cats.reduce((acc, id) => {
    const actual = totals.by[id] || { files: 0, bytes: 0 };
    const limit = limits[id] || { freezeMaxFiles: 0, freezeMaxRawBytes: 0 };
    acc[id] = {
      files: actual.files,
      freezeMaxFiles: limit.freezeMaxFiles,
      fileHeadroom: limit.freezeMaxFiles - actual.files,
      rawBytes: actual.bytes,
      freezeMaxRawBytes: limit.freezeMaxRawBytes,
      rawByteHeadroom: limit.freezeMaxRawBytes - actual.bytes,
      rawMB: +(actual.bytes / 1048576).toFixed(3)
    };
    return acc;
  }, {});
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
function budgetPolicyState() {
  const p = budget.policy || {};
  const summary = categorySummary();
  const coreCategories = (budget.categories || []).filter(c => c.allowedInSingleFile).map(c => c.id).sort();
  const softExceeded = totals.total > p.rawEmbedSoftBytes;
  const reviewExceeded = totals.total > p.currentReviewWarnBytes;
  const hardExceeded = totals.total > p.rawEmbedHardBytes;
  const categoryFreezeActive = p.coreMediaFrozenWhileOverSoft === true && softExceeded;
  const zeroFileHeadroomCategories = coreCategories.filter(id => summary[id] && summary[id].fileHeadroom === 0);
  const zeroRawByteHeadroomCategories = coreCategories.filter(id => summary[id] && summary[id].rawByteHeadroom === 0);
  const negativeHeadroomCategories = coreCategories.filter(id => {
    const row = summary[id] || {};
    return Number(row.fileHeadroom) < 0 || Number(row.rawByteHeadroom) < 0;
  });
  let rawTier = 'under-soft';
  if (hardExceeded) rawTier = 'over-hard';
  else if (reviewExceeded) rawTier = 'over-review';
  else if (softExceeded) rawTier = 'soft-warning';
  return {
    rawTier,
    rawBytes: totals.total,
    rawMB: +(totals.total / 1048576).toFixed(3),
    files: files.length,
    headroom: {
      softBytes: p.rawEmbedSoftBytes - totals.total,
      reviewBytes: p.currentReviewWarnBytes - totals.total,
      hardBytes: p.rawEmbedHardBytes - totals.total,
      coreFiles: p.maxCoreFiles - files.length
    },
    activeGuards: {
      d300CoreFreeze: categoryFreezeActive,
      d301CategoryCeilings: categoryFreezeActive,
      d302SourceMirror: p.requireEmbedSourceMirror === true,
      d303InformativeMetadata: p.requireInformativeEmbedMetadata === true,
      h2VideoDisabled: p.videoEnabledByDefault === false,
      heavyMediaOptionalPack: p.optionalHdPackForHeavyMedia === true
    },
    frozenCategories: {
      total: coreCategories.length,
      zeroFileHeadroom: zeroFileHeadroomCategories,
      zeroRawByteHeadroom: zeroRawByteHeadroomCategories,
      negativeHeadroom: negativeHeadroomCategories
    }
  };
}
function sourceOrganizationState() {
  const coreCategories = (budget.categories || []).filter(c => c.allowedInSingleFile);
  const mirror = sourceMirrorSummary();
  const metadata = informativeMetadataSummary();
  const categoryIds = coreCategories.map(c => c.id).sort();
  const informativeIds = coreCategories.filter(c => c.requiresInformativeMetadata).map(c => c.id).sort();
  const perCategory = {};
  for (const c of coreCategories) {
    const mirrorRow = mirror.detail[c.id] || {};
    const metadataRow = metadata.detail[c.id] || null;
    perCategory[c.id] = {
      sourceDir: c.sourceDir || null,
      embedDir: c.embedDir || null,
      sourceFiles: Number(mirrorRow.sourceFiles || 0),
      embedFiles: Number(mirrorRow.embedFiles || 0),
      missingSource: Array.isArray(mirrorRow.missingSource) ? mirrorRow.missingSource : [],
      informativeMetadataRequired: c.requiresInformativeMetadata === true,
      metadataModule: c.metadataModule || null,
      metadataVar: c.metadataVar || null,
      metadataRecords: metadataRow ? Number(metadataRow.metadataRecords || 0) : null,
      missingMetadata: metadataRow && Array.isArray(metadataRow.missingMetadata) ? metadataRow.missingMetadata : [],
      staleMetadata: metadataRow && Array.isArray(metadataRow.staleMetadata) ? metadataRow.staleMetadata : [],
      incompleteMetadata: metadataRow && Array.isArray(metadataRow.incompleteMetadata) ? metadataRow.incompleteMetadata : []
    };
  }
  return {
    declaredCoreCategories: categoryIds,
    informativeCategories: informativeIds,
    sourceMirrorRequired: (budget.policy || {}).requireEmbedSourceMirror === true,
    sourceMirrorOk: mirror.bad.length === 0,
    informativeMetadataRequired: (budget.policy || {}).requireInformativeEmbedMetadata === true,
    informativeMetadataOk: metadata.bad.length === 0,
    missingSourceCategories: categoryIds.filter(id => perCategory[id].missingSource.length > 0),
    metadataIssueCategories: informativeIds.filter(id => {
      const row = perCategory[id];
      return row.missingMetadata.length || row.staleMetadata.length || row.incompleteMetadata.length;
    }),
    perCategory
  };
}

const budget = readJson('data/media-budget.json');
const cutaways = readJson('data/footage-cutaways.json');
const files = walkFiles(join(ROOT, 'assets', 'embed'));
const totals = bytesByCategory(files);
const fileList = fileMetrics(files);
const warnings = [];

step('schema and core policy are present', () => {
  if (budget.schema !== 'cw_media_budget_v1') throw new Error('bad schema ' + budget.schema);
  const p = budget.policy || {};
  if (p.singleFileCore !== true || p.optionalHdPackForHeavyMedia !== true) throw new Error('core/HD policy missing');
  if (p.coreMediaFrozenWhileOverSoft !== true || p.freezeDecision !== 'D300') throw new Error('D300 core-media freeze guard missing');
  if (p.runtimeWebDependency !== false || p.sharedArrayBufferRequired !== false) throw new Error('runtime dependency guard missing');
  if (p.videoEnabledByDefault !== false || p.requiresProvenanceBeforeVideo !== true) throw new Error('video provenance guard missing');
  return { schema: budget.schema, version: budget.schemaVersion };
});

step('media budget policy state readback is explicit', () => {
  const p = budget.policy || {};
  if (p.requirePolicyStateReadback !== true) throw new Error('policy-state readback guard missing');
  const state = budgetPolicyState();
  if (state.rawTier === 'over-hard' || state.rawTier === 'over-review') throw new Error('raw tier is over review/hard cap: ' + state.rawTier);
  if (state.rawTier === 'soft-warning' && state.activeGuards.d300CoreFreeze !== true) throw new Error('soft-warning tier without active D300 core freeze');
  if (state.rawTier === 'soft-warning' && state.activeGuards.d301CategoryCeilings !== true) throw new Error('soft-warning tier without active D301 category ceilings');
  if (state.activeGuards.d302SourceMirror !== true || state.activeGuards.d303InformativeMetadata !== true) throw new Error('source/metadata guards not active in policy readback');
  if (state.activeGuards.h2VideoDisabled !== true || state.activeGuards.heavyMediaOptionalPack !== true) throw new Error('heavy-media lock state not active in policy readback');
  if (state.frozenCategories.negativeHeadroom.length) throw new Error('frozen category over ceiling: ' + state.frozenCategories.negativeHeadroom.join(', '));
  return state;
});

step('media source-organization readback is explicit', () => {
  const p = budget.policy || {};
  if (p.requireSourceOrganizationReadback !== true) throw new Error('source-organization readback guard missing');
  const state = sourceOrganizationState();
  if (state.sourceMirrorRequired !== true || state.sourceMirrorOk !== true) throw new Error('source mirror not green in sourceOrganization readback');
  if (state.informativeMetadataRequired !== true || state.informativeMetadataOk !== true) throw new Error('informative metadata not green in sourceOrganization readback');
  if (state.declaredCoreCategories.length !== (budget.categories || []).filter(c => c.allowedInSingleFile).length) throw new Error('declared category count mismatch in sourceOrganization readback');
  if (state.missingSourceCategories.length) throw new Error('sourceOrganization reports missing sources: ' + state.missingSourceCategories.join(', '));
  if (state.metadataIssueCategories.length) throw new Error('sourceOrganization reports metadata issues: ' + state.metadataIssueCategories.join(', '));
  return state;
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

step('D300 frozen core category ceilings hold while raw tier is above soft warning', () => {
  const active = budget.policy.coreMediaFrozenWhileOverSoft === true && totals.total > budget.policy.rawEmbedSoftBytes;
  if (!active) return { active: false };
  const bad = [];
  const summary = categorySummary();
  for (const c of (budget.categories || []).filter(x => x.allowedInSingleFile)) {
    if (!Number.isFinite(Number(c.freezeMaxFiles)) || Number(c.freezeMaxFiles) < 0) bad.push(c.id + ' missing freezeMaxFiles');
    if (!Number.isFinite(Number(c.freezeMaxRawBytes)) || Number(c.freezeMaxRawBytes) < 0) bad.push(c.id + ' missing freezeMaxRawBytes');
    const actual = summary[c.id] || { files: 0, rawBytes: 0 };
    if (actual.files > Number(c.freezeMaxFiles)) bad.push(c.id + ' files ' + actual.files + ' > freezeMaxFiles ' + c.freezeMaxFiles);
    if (actual.rawBytes > Number(c.freezeMaxRawBytes)) bad.push(c.id + ' rawBytes ' + actual.rawBytes + ' > freezeMaxRawBytes ' + c.freezeMaxRawBytes);
  }
  if (bad.length) throw new Error(bad.join('; '));
  return { active: true, decision: budget.policy.freezeDecision, categories: summary };
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

step('embedded files still mirror source-tier assets', () => {
  if (budget.policy.requireEmbedSourceMirror !== true) throw new Error('embed/source mirror guard missing');
  const summary = sourceMirrorSummary();
  if (summary.bad.length) throw new Error(summary.bad.join('; '));
  return summary.detail;
});

step('informative embedded media has complete curated metadata', () => {
  if (budget.policy.requireInformativeEmbedMetadata !== true) throw new Error('informative embed metadata guard missing');
  const summary = informativeMetadataSummary();
  if (summary.bad.length) throw new Error(summary.bad.join('; '));
  return summary.detail;
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
    policyState: budgetPolicyState(),
    sourceOrganization: sourceOrganizationState(),
    categorySummary: categorySummary(),
    categories: totals.by,
    largestFiles: fileList.slice(0, 10)
  },
  steps
};
writeFileSync(join(OUT, 'probe-media-budget.json'), JSON.stringify(out, null, 2));
console.log('probe-media-budget ok=' + ok + ' steps=' + out.passed + '/' + out.total + ' rawMB=' + out.metrics.rawMB + ' warnings=' + warnings.length);
for (const s of steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.error);
if (!ok) process.exit(1);
