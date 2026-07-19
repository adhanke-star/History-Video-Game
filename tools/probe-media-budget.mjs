#!/usr/bin/env node
// Focused gate for the Phase H media budget and optional-HD-pack boundary.
// This is filesystem-only: no browser, no asset fetch, no generated output mutation.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { createHash } from 'node:crypto';

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
function stemRows(files, rootDir) {
  return files.map(f => {
    const rel = f.replace(rootDir + '/', '');
    return {
      path: rel,
      stem: baseStem(rel),
      ext: extname(rel).toLowerCase(),
      bytes: statSync(f).size
    };
  }).sort((a, b) => a.path.localeCompare(b.path));
}
function duplicateStems(rows) {
  const seen = new Set();
  const dupes = new Set();
  for (const r of rows) {
    if (seen.has(r.stem)) dupes.add(r.stem);
    seen.add(r.stem);
  }
  return Array.from(dupes).sort();
}
function sourceInventoryState() {
  const coreCategories = (budget.categories || []).filter(c => c.allowedInSingleFile);
  const perCategory = {};
  const bad = [];
  for (const c of coreCategories) {
    const embedDir = c.embedDir ? join(ROOT, c.embedDir) : null;
    const sourceDir = c.sourceDir ? join(ROOT, c.sourceDir) : null;
    if (!embedDir || !sourceDir) {
      bad.push(c.id + ' missing sourceDir/embedDir');
      continue;
    }
    if (!existsSync(embedDir)) {
      bad.push(c.id + ' missing embedDir ' + c.embedDir);
      continue;
    }
    if (!existsSync(sourceDir)) {
      bad.push(c.id + ' missing sourceDir ' + c.sourceDir);
      continue;
    }
    const sourceRows = stemRows(walkFiles(sourceDir), sourceDir);
    const embedRows = stemRows(walkFiles(embedDir), embedDir);
    const sourceStems = new Set(sourceRows.map(r => r.stem));
    const embedStems = new Set(embedRows.map(r => r.stem));
    const sourceOnly = sourceRows.filter(r => !embedStems.has(r.stem)).map(r => r.path);
    const embedOnly = embedRows.filter(r => !sourceStems.has(r.stem)).map(r => relAsset(join(embedDir, r.path)));
    const sourceDuplicateStems = duplicateStems(sourceRows);
    const embedDuplicateStems = duplicateStems(embedRows);
    const largestEmbed = embedRows.slice().sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path))[0] || null;
    if (sourceOnly.length) bad.push(c.id + ' source files without embedded same-stem file: ' + sourceOnly.join(', '));
    if (embedOnly.length) bad.push(c.id + ' embedded files without source same-stem file: ' + embedOnly.join(', '));
    if (sourceDuplicateStems.length) bad.push(c.id + ' duplicate source stems: ' + sourceDuplicateStems.join(', '));
    if (embedDuplicateStems.length) bad.push(c.id + ' duplicate embedded stems: ' + embedDuplicateStems.join(', '));
    perCategory[c.id] = {
      sourceDir: c.sourceDir,
      embedDir: c.embedDir,
      sourceFiles: sourceRows.length,
      embedFiles: embedRows.length,
      sourceOnly,
      embedOnly,
      sourceDuplicateStems,
      embedDuplicateStems,
      sourceExtensions: Array.from(new Set(sourceRows.map(r => r.ext))).sort(),
      embedExtensions: Array.from(new Set(embedRows.map(r => r.ext))).sort(),
      largestEmbed: largestEmbed ? { path: relAsset(join(embedDir, largestEmbed.path)), bytes: largestEmbed.bytes } : null
    };
  }
  const categoryIds = coreCategories.map(c => c.id).sort();
  return {
    declaredCoreCategories: categoryIds,
    exactStemParityOk: bad.length === 0,
    sourceOnlyCategories: categoryIds.filter(id => (perCategory[id] && perCategory[id].sourceOnly || []).length > 0),
    embedOnlyCategories: categoryIds.filter(id => (perCategory[id] && perCategory[id].embedOnly || []).length > 0),
    duplicateStemCategories: categoryIds.filter(id => {
      const row = perCategory[id] || {};
      return (row.sourceDuplicateStems || []).length || (row.embedDuplicateStems || []).length;
    }),
    perCategory
  };
}

function arithmeticConsistencyState() {
  const summary = categorySummary();
  const coreIds = (budget.categories || []).filter(c => c.allowedInSingleFile).map(c => c.id).sort();
  const sumFiles = coreIds.reduce((n, id) => n + Number((summary[id] || {}).files || 0), 0);
  const sumBytes = coreIds.reduce((n, id) => n + Number((summary[id] || {}).rawBytes || 0), 0);
  const policyState = budgetPolicyState();
  const softHeadroomExpected = Number(budget.policy.rawEmbedSoftBytes || 0) - Number(totals.total || 0);
  const reviewHeadroomExpected = Number(budget.policy.currentReviewWarnBytes || 0) - Number(totals.total || 0);
  const hardHeadroomExpected = Number(budget.policy.rawEmbedHardBytes || 0) - Number(totals.total || 0);
  const coreFileHeadroomExpected = Number(budget.policy.maxCoreFiles || 0) - Number(files.length || 0);

  return {
    declaredCoreCategories: coreIds,
    summedCoreFiles: sumFiles,
    summedCoreRawBytes: sumBytes,
    totalFiles: Number(files.length || 0),
    totalRawBytes: Number(totals.total || 0),
    totalsMatch: sumFiles === Number(files.length || 0) && sumBytes === Number(totals.total || 0),
    headroom: {
      softExpected: softHeadroomExpected,
      softReported: Number((policyState.headroom || {}).softBytes || 0),
      reviewExpected: reviewHeadroomExpected,
      reviewReported: Number((policyState.headroom || {}).reviewBytes || 0),
      hardExpected: hardHeadroomExpected,
      hardReported: Number((policyState.headroom || {}).hardBytes || 0),
      coreFilesExpected: coreFileHeadroomExpected,
      coreFilesReported: Number((policyState.headroom || {}).coreFiles || 0)
    }
  };
}

function undeclaredEmbedState() {
  const declaredCoreCategories = (budget.categories || []).filter(c => c.allowedInSingleFile).map(c => c.id).sort();
  const declared = new Set(declaredCoreCategories);
  const undeclaredFiles = files
    .filter(f => !declared.has(categoryOf(f)))
    .map(f => relAsset(f))
    .sort((a, b) => a.localeCompare(b));
  const undeclaredCategories = Array.from(new Set(undeclaredFiles.map(f => f.replace('assets/embed/', '').split('/')[0] || '')))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const frozenCorePostureActive = budget.policy.coreMediaFrozenWhileOverSoft === true && totals.total > budget.policy.rawEmbedSoftBytes;
  const guardEnabled = budget.policy.requireDeclaredCoreEmbedCategoriesWhileFrozen === true;
  return {
    declaredCoreCategories,
    frozenCorePostureActive,
    guardEnabled,
    enforced: frozenCorePostureActive && guardEnabled,
    undeclaredCategories,
    undeclaredCategoryCount: undeclaredCategories.length,
    undeclaredFilesCount: undeclaredFiles.length,
    sampleOffendingPaths: undeclaredFiles.slice(0, 10)
  };
}

const budget = readJson('data/media-budget.json');
const cutaways = readJson('data/footage-cutaways.json');
const files = walkFiles(join(ROOT, 'assets', 'embed'));
const totals = bytesByCategory(files);
const fileList = fileMetrics(files);
const undeclaredState = undeclaredEmbedState();
const warnings = [];

step('schema and core policy are present', () => {
  if (budget.schema !== 'cw_media_budget_v1') throw new Error('bad schema ' + budget.schema);
  const p = budget.policy || {};
  if (p.singleFileCore !== true || p.optionalHdPackForHeavyMedia !== true) throw new Error('core/HD policy missing');
  if (p.coreMediaFrozenWhileOverSoft !== true || p.freezeDecision !== 'D300') throw new Error('D300 core-media freeze guard missing');
  if (p.requireDeclaredCoreEmbedCategoriesWhileFrozen !== true) throw new Error('declared core embed category guard missing');
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

step('media source-inventory readback is explicit', () => {
  const p = budget.policy || {};
  if (p.requireSourceInventoryReadback !== true) throw new Error('source-inventory readback guard missing');
  const state = sourceInventoryState();
  if (state.exactStemParityOk !== true) throw new Error('source inventory parity is not green');
  if (state.declaredCoreCategories.length !== (budget.categories || []).filter(c => c.allowedInSingleFile).length) throw new Error('declared category count mismatch in sourceInventory readback');
  if (state.sourceOnlyCategories.length) throw new Error('sourceInventory reports source-only files: ' + state.sourceOnlyCategories.join(', '));
  if (state.embedOnlyCategories.length) throw new Error('sourceInventory reports embed-only files: ' + state.embedOnlyCategories.join(', '));
  if (state.duplicateStemCategories.length) throw new Error('sourceInventory reports duplicate stems: ' + state.duplicateStemCategories.join(', '));
  return state;
});

step('data budget matches build.mjs hard and soft caps', () => {
  const b = buildBudgetBytes();
  if (budget.policy.rawEmbedSoftBytes !== b.soft) throw new Error('soft cap drift: data=' + budget.policy.rawEmbedSoftBytes + ' build=' + b.soft);
  if (budget.policy.rawEmbedHardBytes !== b.hard) throw new Error('hard cap drift: data=' + budget.policy.rawEmbedHardBytes + ' build=' + b.hard);
  return b;
});

step('media-budget arithmetic remains internally consistent', () => {
  const state = arithmeticConsistencyState();
  if (!state.totalsMatch) {
    throw new Error(
      'core category sums mismatch totals: files ' +
      state.summedCoreFiles +
      '/' +
      state.totalFiles +
      ', rawBytes ' +
      state.summedCoreRawBytes +
      '/' +
      state.totalRawBytes
    );
  }
  if (state.headroom.softExpected !== state.headroom.softReported) throw new Error('soft headroom mismatch');
  if (state.headroom.reviewExpected !== state.headroom.reviewReported) throw new Error('review headroom mismatch');
  if (state.headroom.hardExpected !== state.headroom.hardReported) throw new Error('hard headroom mismatch');
  if (state.headroom.coreFilesExpected !== state.headroom.coreFilesReported) throw new Error('core file headroom mismatch');
  return state;
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
  const cats = Object.keys(totals.by).sort();
  if (undeclaredState.enforced && undeclaredState.undeclaredFilesCount > 0) {
    throw new Error(
      'undeclared embedded categories while frozen-core posture is active: ' +
      undeclaredState.undeclaredCategories.join(', ') +
      ' (files=' + undeclaredState.undeclaredFilesCount + ')' +
      (undeclaredState.sampleOffendingPaths.length ? ' sample=' + undeclaredState.sampleOffendingPaths.join(', ') : '')
    );
  }
  const videoExt = files.filter(f => ['.mp4', '.webm', '.mov', '.m4v'].includes(extname(f).toLowerCase()));
  if (videoExt.length) throw new Error('video file found in assets/embed: ' + videoExt.map(f => f.replace(ROOT + '/', '')).join(', '));
  const byCategory = cats.reduce((acc, c) => {
    acc[c] = { files: totals.by[c].files, bytes: totals.by[c].bytes };
    return acc;
  }, {});
  return {
    byCategory,
    undeclared: undeclaredState
  };
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

// LANE-014 slice 1: the assets/3d provenance-ledger wall (adjudications 3+4).
const ASSETS3D_EXTS = new Set(['.png', '.hdr', '.glb', '.gltf']);
function assets3dCategory() {
  const c = (budget.categories || []).find(x => x.id === 'hd-terrain-models');
  if (!c) throw new Error('hd-terrain-models category missing');
  return c;
}
function assets3dTreeFiles() {
  return walkFiles(join(ROOT, 'assets', '3d'))
    .filter(f => ASSETS3D_EXTS.has(extname(f).toLowerCase()))
    .map(f => relAsset(f))
    .sort();
}
function assets3dLedger() {
  const c = assets3dCategory();
  if (!c.provenanceLedger) throw new Error('hd-terrain-models missing provenanceLedger');
  const ledger = readJson(c.provenanceLedger);
  if (ledger.schema !== 'cw_assets3d_provenance_v1') throw new Error('bad ledger schema ' + ledger.schema);
  if (!Array.isArray(ledger.records)) throw new Error('ledger records missing');
  return ledger;
}
function assets3dState() {
  const ledger = assets3dLedger();
  const tree = assets3dTreeFiles();
  const ledgered = ledger.records.map(r => 'assets/3d/' + r.file).sort();
  const unledgered = tree.filter(f => !ledgered.includes(f));
  const ghosts = ledgered.filter(f => !tree.includes(f));
  const byClass = {};
  for (const r of ledger.records) {
    byClass[r.class] = byClass[r.class] || { files: 0, bytes: 0 };
    byClass[r.class].files++;
    byClass[r.class].bytes += Number(r.bytes || 0);
  }
  return { ledger, tree, unledgered, ghosts, byClass };
}

step('assets3d ledger enumeration is 1:1 with the asset tree', () => {
  const s = assets3dState();
  if (s.unledgered.length) throw new Error('assets/3d files without a provenance row: ' + s.unledgered.join(', '));
  if (s.ghosts.length) throw new Error('provenance rows without a file: ' + s.ghosts.join(', '));
  const classes = assets3dCategory().ledgerClasses || {};
  const outOfClass = s.ledger.records.filter(r => {
    const cls = classes[r.class];
    return !cls || !('assets/3d/' + r.file).startsWith(cls.dir + '/');
  }).map(r => r.file);
  if (outOfClass.length) throw new Error('ledger rows outside their declared class dir: ' + outOfClass.join(', '));
  return { treeFiles: s.tree.length, ledgerRows: s.ledger.records.length };
});

step('assets3d ledger rows are license-clear and identity-proven', () => {
  const s = assets3dState();
  const bad = [];
  for (const r of s.ledger.records) {
    const missing = ['file', 'class', 'asset', 'source', 'md5', 'license', 'status'].filter(k => !String(r[k] || '').trim());
    if (missing.length) { bad.push(r.file + ' missing ' + missing.join('/')); continue; }
    if (r.license !== 'CC0-1.0') { bad.push(r.file + ' license not clear: ' + r.license); continue; }
    if (r.status !== 'Verified') { bad.push(r.file + ' status not Verified: ' + r.status); continue; }
    if (!Array.isArray(r.authors) || !r.authors.length) { bad.push(r.file + ' authors missing'); continue; }
    const p = join(ROOT, 'assets', '3d', r.file);
    const actual = createHash('md5').update(readFileSync(p)).digest('hex');
    if (actual !== r.md5) bad.push(r.file + ' md5 drift: ' + actual + ' != ledgered ' + r.md5);
    else if (statSync(p).size !== Number(r.bytes)) bad.push(r.file + ' byte drift');
  }
  if (bad.length) throw new Error(bad.join('; '));
  return { rows: s.ledger.records.length, hashed: s.ledger.records.length };
});

step('assets3d ledger class caps hold', () => {
  const classes = assets3dCategory().ledgerClasses || {};
  if (!Object.keys(classes).length) throw new Error('ledgerClasses missing');
  const s = assets3dState();
  const bad = [];
  for (const [id, cls] of Object.entries(classes)) {
    const actual = s.byClass[id] || { files: 0, bytes: 0 };
    if (actual.files > Number(cls.maxFiles)) bad.push(id + ' files ' + actual.files + ' > maxFiles ' + cls.maxFiles);
    if (actual.bytes > Number(cls.maxRawBytes)) bad.push(id + ' bytes ' + actual.bytes + ' > maxRawBytes ' + cls.maxRawBytes);
    for (const r of s.ledger.records.filter(x => x.class === id)) {
      if (Number(r.bytes) > Number(cls.maxFileBytes)) bad.push(r.file + ' bytes ' + r.bytes + ' > maxFileBytes ' + cls.maxFileBytes);
    }
  }
  const declared = new Set(Object.keys(classes));
  const strays = Object.keys(s.byClass).filter(id => !declared.has(id));
  if (strays.length) bad.push('undeclared ledger classes: ' + strays.join(', '));
  if (bad.length) throw new Error(bad.join('; '));
  return { classes: Object.keys(classes).sort(), byClass: s.byClass };
});

step('assets3d stays outside the embed pipeline', () => {
  if (budget.policy.requireAssets3dProvenanceLedger !== true) throw new Error('assets3d provenance guard missing from policy');
  const c = assets3dCategory();
  if (c.allowedInSingleFile !== false || c.embedDir !== null) throw new Error('hd-terrain-models must stay non-embedded');
  if (Object.keys(totals.by).includes('3d')) throw new Error('assets/embed carries a 3d category');
  const prep = readFileSync(join(ROOT, 'tools', 'prep-embed-assets.mjs'), 'utf8');
  if (/['"]3d['"]/.test(prep)) throw new Error('prep-embed-assets.mjs enrolls a 3d category');
  return { embedDir: c.embedDir, allowedInSingleFile: c.allowedInSingleFile };
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
    undeclaredEmbedState: undeclaredState,
    policyState: budgetPolicyState(),
    sourceOrganization: sourceOrganizationState(),
    sourceInventory: sourceInventoryState(),
    arithmeticConsistency: arithmeticConsistencyState(),
    categorySummary: categorySummary(),
    categories: totals.by,
    largestFiles: fileList.slice(0, 10),
    assets3d: (() => {
      try {
        const s = assets3dState();
        return { treeFiles: s.tree.length, ledgerRows: s.ledger.records.length, byClass: s.byClass, unledgered: s.unledgered, ghosts: s.ghosts };
      } catch (e) {
        return { error: String(e && e.message || e) };
      }
    })()
  },
  steps
};
writeFileSync(join(OUT, 'probe-media-budget.json'), JSON.stringify(out, null, 2));
console.log('probe-media-budget ok=' + ok + ' steps=' + out.passed + '/' + out.total + ' rawMB=' + out.metrics.rawMB + ' warnings=' + warnings.length);
for (const s of steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.error);
if (!ok) process.exit(1);
