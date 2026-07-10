#!/usr/bin/env node
// Embedded-media budget HTML report generator.
// Reads tools/shots/probe-media-budget.json and produces a human-readable HTML summary.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml } from './report-html-escape.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function pctClass(val, warnAt, dangerAt) {
  if (val >= dangerAt) return 'danger';
  if (val >= warnAt) return 'warn';
  return 'ok';
}

function headroomClass(val) {
  if (val < 0) return 'danger';
  if (val === 0) return 'warn';
  return 'ok';
}

function boolClass(v) {
  return v ? 'ok' : 'danger';
}

function render() {
  const data = readJson('tools/shots/probe-media-budget.json');
  const m = data.metrics || {};
  const policy = m.policyState || {};
  const sourceOrg = m.sourceOrganization || {};
  const sourceInv = m.sourceInventory || {};
  const catSummary = m.categorySummary || {};
  const arith = m.arithmeticConsistency || {};
  const undeclared = m.undeclaredEmbedState || {};
  const largest = Array.isArray(m.largestFiles) ? m.largestFiles : [];
  const warnings = Array.isArray(data.warnings) ? data.warnings : [];

  const catIds = Object.keys(catSummary).sort();

  let html = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>Media Budget Report</title>\n' +
'<style>\n' +
'  body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; margin: 2rem; background: #f8f9fa; color: #1a1a2e; }\n' +
'  h1 { border-bottom: 2px solid #1a1a2e; padding-bottom: 0.3rem; }\n' +
'  h2 { margin-top: 2rem; color: #16213e; }\n' +
'  table { border-collapse: collapse; width: 100%; margin: 1rem 0; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n' +
'  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }\n' +
'  th { background: #16213e; color: #fff; font-weight: 600; }\n' +
'  tr:hover { background: #f1f3f5; }\n' +
'  .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.8rem; font-weight: 600; }\n' +
'  .ok { background: #d4edda; color: #155724; }\n' +
'  .warn { background: #fff3cd; color: #856404; }\n' +
'  .danger { background: #f8d7da; color: #721c24; }\n' +
'  .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; }\n' +
'  .summary-card { background: #fff; padding: 1rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n' +
'  .summary-card .label { font-size: 0.8rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.05em; }\n' +
'  .summary-card .value { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }\n' +
'  .warn-list { background: #fff; padding: 1rem; border-radius: 6px; border-left: 4px solid #ffc107; margin: 1rem 0; }\n' +
'  .danger-list { background: #fff; padding: 1rem; border-radius: 6px; border-left: 4px solid #dc3545; margin: 1rem 0; }\n' +
'  .ok-list { background: #fff; padding: 1rem; border-radius: 6px; border-left: 4px solid #28a745; margin: 1rem 0; }\n' +
'  .guard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; margin: 0.5rem 0; }\n' +
'  .guard-item { padding: 0.4rem 0.6rem; border-radius: 4px; font-size: 0.85rem; }\n' +
'  code { background: #e9ecef; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.85rem; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<h1>Media Budget Report</h1>\n' +
'<p>Generated from <code>tools/shots/probe-media-budget.json</code></p>\n' +
'\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Status</div>\n' +
'    <div class="value"><span class="badge ' + (data.ok ? 'ok' : 'danger') + '">' + (data.ok ? 'PASS' : 'FAIL') + '</span></div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Steps Passed</div>\n' +
'    <div class="value">' + escapeHtml(data.passed) + '/' + escapeHtml(data.total) + '</div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Raw Tier</div>\n' +
'    <div class="value"><span class="badge ' + pctClass(policy.rawTier === 'over-hard' ? 100 : policy.rawTier === 'over-review' ? 80 : policy.rawTier === 'soft-warning' ? 60 : 0, 50, 80) + '">' + escapeHtml(policy.rawTier) + '</span></div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Total Files</div>\n' +
'    <div class="value">' + escapeHtml(policy.files) + '</div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Total Raw MB</div>\n' +
'    <div class="value">' + escapeHtml(policy.rawMB) + '</div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Total Raw Bytes</div>\n' +
'    <div class="value">' + Number(policy.rawBytes || 0).toLocaleString() + '</div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
(warnings.length ? '<div class="warn-list"><strong>Warnings (' + warnings.length + ')</strong><ul>' + warnings.map(function(w) { return '<li>' + escapeHtml(w) + '</li>'; }).join('') + '</ul></div>\n' : '') +
'\n' +
'<h2>Headroom</h2>\n' +
'<table>\n' +
'  <tr><th>Boundary</th><th>Headroom (bytes)</th><th>Status</th></tr>\n' +
'  <tr>\n' +
'    <td>Soft (' + (policy.rawTier === 'soft-warning' ? 'exceeded' : 'under') + ')</td>\n' +
'    <td>' + Number(policy.headroom.softBytes || 0).toLocaleString() + '</td>\n' +
'    <td><span class="badge ' + headroomClass(policy.headroom.softBytes) + '">' + (headroomClass(policy.headroom.softBytes) === 'ok' ? 'OK' : headroomClass(policy.headroom.softBytes) === 'warn' ? 'At Limit' : 'Over') + '</span></td>\n' +
'  </tr>\n' +
'  <tr>\n' +
'    <td>Review Warning</td>\n' +
'    <td>' + Number(policy.headroom.reviewBytes || 0).toLocaleString() + '</td>\n' +
'    <td><span class="badge ' + headroomClass(policy.headroom.reviewBytes) + '">' + (headroomClass(policy.headroom.reviewBytes) === 'ok' ? 'OK' : headroomClass(policy.headroom.reviewBytes) === 'warn' ? 'At Limit' : 'Over') + '</span></td>\n' +
'  </tr>\n' +
'  <tr>\n' +
'    <td>Hard Cap</td>\n' +
'    <td>' + Number(policy.headroom.hardBytes || 0).toLocaleString() + '</td>\n' +
'    <td><span class="badge ' + headroomClass(policy.headroom.hardBytes) + '">' + (headroomClass(policy.headroom.hardBytes) === 'ok' ? 'OK' : headroomClass(policy.headroom.hardBytes) === 'warn' ? 'At Limit' : 'Over') + '</span></td>\n' +
'  </tr>\n' +
'  <tr>\n' +
'    <td>Core Files</td>\n' +
'    <td>' + Number(policy.headroom.coreFiles || 0).toLocaleString() + '</td>\n' +
'    <td><span class="badge ' + headroomClass(policy.headroom.coreFiles) + '">' + (headroomClass(policy.headroom.coreFiles) === 'ok' ? 'OK' : headroomClass(policy.headroom.coreFiles) === 'warn' ? 'At Limit' : 'Over') + '</span></td>\n' +
'  </tr>\n' +
'</table>\n' +
'\n' +
'<h2>Active Guards</h2>\n' +
'<div class="guard-grid">\n' +
  Object.entries(policy.activeGuards || {}).map(function(kv) {
    var k = kv[0], v = kv[1];
    return '<div class="guard-item ' + boolClass(v) + '"><span class="badge ' + boolClass(v) + '">' + (v ? 'ON' : 'OFF') + '</span> <code>' + escapeHtml(k) + '</code></div>';
  }).join('') + '\n' +
'</div>\n' +
'\n' +
'<h2>Category Ceilings</h2>\n' +
'<table>\n' +
'  <tr><th>Category</th><th>Files</th><th>Max Files</th><th>File Headroom</th><th>Raw Bytes</th><th>Max Bytes</th><th>Byte Headroom</th><th>Raw MB</th></tr>\n' +
  catIds.map(function(id) {
    var c = catSummary[id] || {};
    var fh = Number(c.fileHeadroom || 0);
    var bh = Number(c.rawByteHeadroom || 0);
    return '<tr>\n' +
'      <td><code>' + escapeHtml(id) + '</code></td>\n' +
'      <td>' + escapeHtml(c.files) + '</td>\n' +
'      <td>' + escapeHtml(c.freezeMaxFiles) + '</td>\n' +
'      <td><span class="badge ' + headroomClass(fh) + '">' + fh + '</span></td>\n' +
'      <td>' + Number(c.rawBytes || 0).toLocaleString() + '</td>\n' +
'      <td>' + Number(c.freezeMaxRawBytes || 0).toLocaleString() + '</td>\n' +
'      <td><span class="badge ' + headroomClass(bh) + '">' + Number(bh).toLocaleString() + '</span></td>\n' +
'      <td>' + escapeHtml(c.rawMB) + '</td>\n' +
'    </tr>';
  }).join('') + '\n' +
'</table>\n' +
'\n' +
'<h2>Source Organization</h2>\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Source Mirror Required</div>\n' +
'    <div class="value"><span class="badge ' + boolClass(sourceOrg.sourceMirrorRequired) + '">' + (sourceOrg.sourceMirrorRequired ? 'Yes' : 'No') + '</span></div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Source Mirror OK</div>\n' +
'    <div class="value"><span class="badge ' + boolClass(sourceOrg.sourceMirrorOk) + '">' + (sourceOrg.sourceMirrorOk ? 'Yes' : 'No') + '</span></div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Informative Metadata Required</div>\n' +
'    <div class="value"><span class="badge ' + boolClass(sourceOrg.informativeMetadataRequired) + '">' + (sourceOrg.informativeMetadataRequired ? 'Yes' : 'No') + '</span></div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Informative Metadata OK</div>\n' +
'    <div class="value"><span class="badge ' + boolClass(sourceOrg.informativeMetadataOk) + '">' + (sourceOrg.informativeMetadataOk ? 'Yes' : 'No') + '</span></div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Declared Core Categories</div>\n' +
'    <div class="value">' + (sourceOrg.declaredCoreCategories || []).length + '</div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Informative Categories</div>\n' +
'    <div class="value">' + (sourceOrg.informativeCategories || []).length + '</div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
((sourceOrg.missingSourceCategories || []).length ? '<div class="danger-list"><strong>Missing Source Categories</strong>: ' + sourceOrg.missingSourceCategories.map(escapeHtml).join(', ') + '</div>\n' : '') +
((sourceOrg.metadataIssueCategories || []).length ? '<div class="warn-list"><strong>Metadata Issue Categories</strong>: ' + sourceOrg.metadataIssueCategories.map(escapeHtml).join(', ') + '</div>\n' : '') +
'\n' +
'<h3>Per-Category Source Organization</h3>\n' +
'<table>\n' +
'  <tr><th>Category</th><th>Source Dir</th><th>Embed Dir</th><th>Source Files</th><th>Embed Files</th><th>Missing Source</th><th>Metadata Records</th><th>Missing Metadata</th><th>Stale Metadata</th><th>Incomplete Metadata</th></tr>\n' +
  catIds.map(function(id) {
    var c = (sourceOrg.perCategory || {})[id] || {};
    return '<tr>\n' +
'      <td><code>' + escapeHtml(id) + '</code></td>\n' +
'      <td>' + (c.sourceDir ? '<code>' + escapeHtml(c.sourceDir) + '</code>' : '-') + '</td>\n' +
'      <td>' + (c.embedDir ? '<code>' + escapeHtml(c.embedDir) + '</code>' : '-') + '</td>\n' +
'      <td>' + escapeHtml(c.sourceFiles) + '</td>\n' +
'      <td>' + escapeHtml(c.embedFiles) + '</td>\n' +
'      <td>' + ((c.missingSource || []).length ? '<span class="badge danger">' + c.missingSource.length + '</span>' : '<span class="badge ok">0</span>') + '</td>\n' +
'      <td>' + escapeHtml(c.metadataRecords != null ? c.metadataRecords : '-') + '</td>\n' +
'      <td>' + ((c.missingMetadata || []).length ? '<span class="badge danger">' + c.missingMetadata.length + '</span>' : '<span class="badge ok">0</span>') + '</td>\n' +
'      <td>' + ((c.staleMetadata || []).length ? '<span class="badge warn">' + c.staleMetadata.length + '</span>' : '<span class="badge ok">0</span>') + '</td>\n' +
'      <td>' + ((c.incompleteMetadata || []).length ? '<span class="badge warn">' + c.incompleteMetadata.length + '</span>' : '<span class="badge ok">0</span>') + '</td>\n' +
'    </tr>';
  }).join('') + '\n' +
'</table>\n' +
'\n' +
'<h2>Source Inventory (Stem Parity)</h2>\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Exact Stem Parity OK</div>\n' +
'    <div class="value"><span class="badge ' + boolClass(sourceInv.exactStemParityOk) + '">' + (sourceInv.exactStemParityOk ? 'Yes' : 'No') + '</span></div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Source-Only Categories</div>\n' +
'    <div class="value">' + (sourceInv.sourceOnlyCategories || []).length + '</div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Embed-Only Categories</div>\n' +
'    <div class="value">' + (sourceInv.embedOnlyCategories || []).length + '</div>\n' +
'  </div>\n' +
'  <div class="summary-card">\n' +
'    <div class="label">Duplicate Stem Categories</div>\n' +
'    <div class="value">' + (sourceInv.duplicateStemCategories || []).length + '</div>\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
((sourceInv.sourceOnlyCategories || []).length ? '<div class="warn-list"><strong>Source-Only Categories</strong>: ' + sourceInv.sourceOnlyCategories.map(escapeHtml).join(', ') + '</div>\n' : '') +
((sourceInv.embedOnlyCategories || []).length ? '<div class="warn-list"><strong>Embed-Only Categories</strong>: ' + sourceInv.embedOnlyCategories.map(escapeHtml).join(', ') + '</div>\n' : '') +
'\n' +
'<h2>Arithmetic Consistency</h2>\n' +
'<table>\n' +
'  <tr><th>Metric</th><th>Value</th></tr>\n' +
'  <tr><td>Summed Core Files</td><td>' + escapeHtml(arith.summedCoreFiles) + '</td></tr>\n' +
'  <tr><td>Summed Core Raw Bytes</td><td>' + Number(arith.summedCoreRawBytes || 0).toLocaleString() + '</td></tr>\n' +
'  <tr><td>Total Files</td><td>' + escapeHtml(arith.totalFiles) + '</td></tr>\n' +
'  <tr><td>Total Raw Bytes</td><td>' + Number(arith.totalRawBytes || 0).toLocaleString() + '</td></tr>\n' +
'  <tr><td>Totals Match</td><td><span class="badge ' + boolClass(arith.totalsMatch) + '">' + (arith.totalsMatch ? 'Yes' : 'No') + '</span></td></tr>\n' +
'</table>\n' +
'\n' +
'<h2>Undeclared Embed State</h2>\n' +
'<table>\n' +
'  <tr><th>Metric</th><th>Value</th></tr>\n' +
'  <tr><td>Frozen Core Posture Active</td><td><span class="badge ' + boolClass(undeclared.frozenCorePostureActive) + '">' + (undeclared.frozenCorePostureActive ? 'Yes' : 'No') + '</span></td></tr>\n' +
'  <tr><td>Guard Enabled</td><td><span class="badge ' + boolClass(undeclared.guardEnabled) + '">' + (undeclared.guardEnabled ? 'Yes' : 'No') + '</span></td></tr>\n' +
'  <tr><td>Enforced</td><td><span class="badge ' + boolClass(undeclared.enforced) + '">' + (undeclared.enforced ? 'Yes' : 'No') + '</span></td></tr>\n' +
'  <tr><td>Undeclared Categories</td><td>' + escapeHtml(undeclared.undeclaredCategoryCount) + '</td></tr>\n' +
'  <tr><td>Undeclared Files</td><td>' + escapeHtml(undeclared.undeclaredFilesCount) + '</td></tr>\n' +
'</table>\n' +
'\n' +
((undeclared.undeclaredCategories || []).length ? '<div class="warn-list"><strong>Undeclared Categories</strong>: ' + undeclared.undeclaredCategories.map(escapeHtml).join(', ') + '</div>\n' : '') +
'\n' +
'<h2>Largest Embedded Files (Top 10)</h2>\n' +
'<table>\n' +
'  <tr><th>Path</th><th>Category</th><th>Bytes</th></tr>\n' +
  largest.map(function(f) {
    return '<tr><td><code>' + escapeHtml(f.path) + '</code></td><td>' + escapeHtml(f.category) + '</td><td>' + Number(f.bytes || 0).toLocaleString() + '</td></tr>';
  }).join('') + '\n' +
'</table>\n' +
'\n' +
'<h2>Frozen Categories</h2>\n' +
'<table>\n' +
'  <tr><th>Metric</th><th>Value</th></tr>\n' +
'  <tr><td>Total Frozen Categories</td><td>' + escapeHtml((policy.frozenCategories || {}).total || 0) + '</td></tr>\n' +
'  <tr><td>Zero File Headroom</td><td>' + (((policy.frozenCategories || {}).zeroFileHeadroom || []).map(escapeHtml).join(', ') || 'none') + '</td></tr>\n' +
'  <tr><td>Zero Raw Byte Headroom</td><td>' + (((policy.frozenCategories || {}).zeroRawByteHeadroom || []).map(escapeHtml).join(', ') || 'none') + '</td></tr>\n' +
'  <tr><td>Negative Headroom</td><td>' + (((policy.frozenCategories || {}).negativeHeadroom || []).map(escapeHtml).join(', ') || 'none') + '</td></tr>\n' +
'</table>\n' +
'\n' +
'<h2>Steps</h2>\n' +
'<table>\n' +
'  <tr><th>#</th><th>Name</th><th>Status</th><th>Detail</th></tr>\n' +
  (data.steps || []).map(function(s, i) {
    return '<tr>\n' +
'    <td>' + (i + 1) + '</td>\n' +
'    <td>' + escapeHtml(s.name) + '</td>\n' +
'    <td><span class="badge ' + (s.ok ? 'ok' : 'danger') + '">' + (s.ok ? 'PASS' : 'FAIL') + '</span></td>\n' +
'    <td>' + (s.ok ? (s.detail ? '<code>' + escapeHtml(JSON.stringify(s.detail)) + '</code>' : '') : '<code>' + escapeHtml(s.error) + '</code>') + '</td>\n' +
'  </tr>';
  }).join('') + '\n' +
'</table>\n' +
'\n' +
'</body>\n' +
'</html>';

  const outPath = join(OUT, 'report-media-budget.html');
  writeFileSync(outPath, html);
  console.log('report-media-budget ok  html=' + outPath.replace(ROOT + '/', '') + '  steps=' + data.passed + '/' + data.total + '  tier=' + policy.rawTier);
}

render();
