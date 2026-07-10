#!/usr/bin/env node
// Consolidated Group 6 dashboard HTML report.
// Reads all Group 6 shot artifacts and produces a single-page health dashboard.
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

function boolClass(v) {
  return v ? 'ok' : 'danger';
}

function headroomClass(val) {
  if (val < 0) return 'danger';
  if (val === 0) return 'warn';
  return 'ok';
}

function render() {
  const media = readJson('tools/shots/probe-media-budget.json');
  const historical = readJson('tools/shots/probe-historical-data-inventory.json');
  const sourceDomains = readJson('tools/shots/probe-historical-source-domains.json');
  const hotpath = readJson('tools/shots/probe-hotpath-profile.json');
  const hotpathRaw = readJson('tools/shots/hotpath-profile.json');
  const group6 = readJson('tools/shots/group6-readback.json');

  const mp = media.metrics || {};
  const mPolicy = mp.policyState || {};
  const mSourceOrg = mp.sourceOrganization || {};
  const mSourceInv = mp.sourceInventory || {};
  const hm = historical.metrics || {};
  const dm = sourceDomains.metrics || {};
  const hp = hotpath.metrics || {};
  const hpRaw = hotpathRaw.totals || {};

  var h = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>Group 6 Health Dashboard</title>\n' +
'<style>\n' +
'  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 2rem; background: #f8f9fa; color: #1a1a2e; }\n' +
'  h1 { border-bottom: 2px solid #1a1a2e; padding-bottom: 0.3rem; }\n' +
'  h2 { margin-top: 2rem; color: #16213e; }\n' +
'  h3 { margin-top: 1.5rem; color: #0f3460; }\n' +
'  table { border-collapse: collapse; width: 100%; margin: 1rem 0; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n' +
'  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }\n' +
'  th { background: #16213e; color: #fff; font-weight: 600; }\n' +
'  tr:hover { background: #f1f3f5; }\n' +
'  .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.8rem; font-weight: 600; }\n' +
'  .ok { background: #d4edda; color: #155724; }\n' +
'  .warn { background: #fff3cd; color: #856404; }\n' +
'  .danger { background: #f8d7da; color: #721c24; }\n' +
'  .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin: 1rem 0; }\n' +
'  .summary-card { background: #fff; padding: 1rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n' +
'  .summary-card .label { font-size: 0.8rem; color: #6c757d; text-transform: uppercase; letter-spacing: 0.05em; }\n' +
'  .summary-card .value { font-size: 1.5rem; font-weight: 700; margin-top: 0.25rem; }\n' +
'  .section-card { background: #fff; padding: 1rem 1.5rem; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin: 1rem 0; }\n' +
'  .section-card h3 { margin-top: 0; }\n' +
'  code { background: #e9ecef; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.85rem; }\n' +
'  .guard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.4rem; margin: 0.5rem 0; }\n' +
'  .guard-item { padding: 0.3rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<h1>Group 6 Health Dashboard</h1>\n' +
'<p>Consolidated health of all Group 6 guards: media budget, source domains, hotpath profile, historical data inventory.</p>\n' +
'\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card"><div class="label">Media Budget</div><div class="value"><span class="badge ' + (media.ok ? 'ok' : 'danger') + '">' + (media.ok ? 'PASS' : 'FAIL') + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Historical Data</div><div class="value"><span class="badge ' + (historical.ok ? 'ok' : 'danger') + '">' + (historical.ok ? 'PASS' : 'FAIL') + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Source Domains</div><div class="value"><span class="badge ' + (sourceDomains.ok ? 'ok' : 'danger') + '">' + (sourceDomains.ok ? 'PASS' : 'FAIL') + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Hotpath Profile</div><div class="value"><span class="badge ' + (hotpath.ok ? 'ok' : 'danger') + '">' + (hotpath.ok ? 'PASS' : 'FAIL') + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Group 6 Readback</div><div class="value"><span class="badge ' + (group6.ok ? 'ok' : 'danger') + '">' + (group6.ok ? 'PASS' : 'FAIL') + '</span></div></div>\n' +
'</div>\n' +
'\n' +
'<div class="section-card">\n' +
'<h3>Media Budget</h3>\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card"><div class="label">Raw Tier</div><div class="value"><span class="badge ' + (mPolicy.rawTier === 'over-hard' ? 'danger' : mPolicy.rawTier === 'over-review' ? 'danger' : mPolicy.rawTier === 'soft-warning' ? 'warn' : 'ok') + '">' + escapeHtml(mPolicy.rawTier) + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Raw MB</div><div class="value">' + escapeHtml(mPolicy.rawMB) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Files</div><div class="value">' + escapeHtml(mPolicy.files) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Soft Headroom</div><div class="value"><span class="badge ' + headroomClass(mPolicy.headroom.softBytes) + '">' + Number(mPolicy.headroom.softBytes || 0).toLocaleString() + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Hard Headroom</div><div class="value"><span class="badge ' + headroomClass(mPolicy.headroom.hardBytes) + '">' + Number(mPolicy.headroom.hardBytes || 0).toLocaleString() + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Steps</div><div class="value">' + escapeHtml(media.passed) + '/' + escapeHtml(media.total) + '</div></div>\n' +
'</div>\n' +
'<div class="guard-grid">\n' +
  Object.entries(mPolicy.activeGuards || {}).map(function(kv) {
    var k = kv[0], v = kv[1];
    return '<div class="guard-item ' + boolClass(v) + '"><span class="badge ' + boolClass(v) + '">' + (v ? 'ON' : 'OFF') + '</span> <code>' + escapeHtml(k) + '</code></div>';
  }).join('') + '\n' +
'</div>\n' +
'<table>\n' +
'  <tr><th>Metric</th><th>Value</th></tr>\n' +
'  <tr><td>Source Mirror OK</td><td><span class="badge ' + boolClass(mSourceOrg.sourceMirrorOk) + '">' + (mSourceOrg.sourceMirrorOk ? 'Yes' : 'No') + '</span></td></tr>\n' +
'  <tr><td>Informative Metadata OK</td><td><span class="badge ' + boolClass(mSourceOrg.informativeMetadataOk) + '">' + (mSourceOrg.informativeMetadataOk ? 'Yes' : 'No') + '</span></td></tr>\n' +
'  <tr><td>Exact Stem Parity OK</td><td><span class="badge ' + boolClass(mSourceInv.exactStemParityOk) + '">' + (mSourceInv.exactStemParityOk ? 'Yes' : 'No') + '</span></td></tr>\n' +
'  <tr><td>Warnings</td><td>' + (Array.isArray(media.warnings) ? media.warnings.length : 0) + '</td></tr>\n' +
'</table>\n' +
'</div>\n' +
'\n' +
'<div class="section-card">\n' +
'<h3>Historical Data Inventory</h3>\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card"><div class="label">Historical Docs</div><div class="value">' + escapeHtml(hm.historicalDocs || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Markdown Lines</div><div class="value">' + Number(hm.markdownLines || 0).toLocaleString() + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Data Files</div><div class="value">' + escapeHtml(hm.dataFiles || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Files With Sources</div><div class="value">' + escapeHtml(hm.dataFilesWithSources || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Source Fields</div><div class="value">' + Number(hm.dataSourceFields || 0).toLocaleString() + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Source Items</div><div class="value">' + Number(hm.dataSourceItems || 0).toLocaleString() + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Source Notes</div><div class="value">' + Number(hm.dataSourceNotes || 0).toLocaleString() + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Verified Mentions</div><div class="value">' + Number(((hm.docConfidenceMentions || {}).verified) || 0) + '</div></div>\n' +
'</div>\n' +
'</div>\n' +
'\n' +
'<div class="section-card">\n' +
'<h3>Source Domains</h3>\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card"><div class="label">URL Items</div><div class="value">' + escapeHtml(dm.sourceUrlItems || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Unique Domains</div><div class="value">' + escapeHtml(dm.uniqueDomains || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Top-20 Concentration</div><div class="value"><span class="badge ' + (Number(dm.concentrationTop20Pct || 0) <= 90 ? 'ok' : 'danger') + '">' + escapeHtml(dm.concentrationTop20Pct) + '%</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Invalid URLs</div><div class="value"><span class="badge ' + (dm.invalidUrlItems === 0 ? 'ok' : 'danger') + '">' + escapeHtml(dm.invalidUrlItems) + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Drift Guard</div><div class="value"><span class="badge ' + boolClass(((dm.domainDriftGuard || {}).pass)) + '">' + (((dm.domainDriftGuard || {}).pass) ? 'PASS' : 'FAIL') + '</span></div></div>\n' +
'</div>\n' +
'</div>\n' +
'\n' +
'<div class="section-card">\n' +
'<h3>Hotpath Profile</h3>\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card"><div class="label">Files</div><div class="value">' + escapeHtml(hp.files || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Lines</div><div class="value">' + Number(hp.lines || 0).toLocaleString() + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Functions</div><div class="value">' + escapeHtml(hp.functions || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Loops</div><div class="value">' + escapeHtml(hp.loops || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">InstancedMesh Refs</div><div class="value">' + escapeHtml(hp.instancedMeshRefs || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Dispose Refs</div><div class="value">' + escapeHtml(hp.disposeRefs || 0) + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Fetch Refs</div><div class="value"><span class="badge ' + (Number(hp.fetchRefs || 0) <= 1 ? 'ok' : 'warn') + '">' + escapeHtml(hp.fetchRefs || 0) + '</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Storage Refs</div><div class="value">' + escapeHtml(hp.storageRefs || 0) + '</div></div>\n' +
'</div>\n' +
'<table>\n' +
'  <tr><th>Group</th><th>Files</th><th>Bytes</th><th>Lines</th><th>Functions</th><th>Loops</th></tr>\n' +
  Object.entries(hotpathRaw.groups || {}).map(function(kv) {
    var g = kv[0], grp = kv[1];
    return '<tr><td><code>' + escapeHtml(g) + '</code></td><td>' + escapeHtml(grp.files) + '</td><td>' + Number(grp.bytes || 0).toLocaleString() + '</td><td>' + escapeHtml(grp.lines) + '</td><td>' + escapeHtml(grp.functions) + '</td><td>' + escapeHtml(grp.loops) + '</td></tr>';
  }).join('') + '\n' +
'</table>\n' +
'</div>\n' +
'\n' +
'<div class="section-card">\n' +
'<h3>Cross-Artifact Lockstep</h3>\n' +
'<table>\n' +
'  <tr><th>Metric</th><th>Value</th></tr>\n' +
'  <tr><td>Media Raw Bytes</td><td>' + Number(group6.media.rawBytes || 0).toLocaleString() + '</td></tr>\n' +
'  <tr><td>Historical Source Items</td><td>' + Number(group6.historical.sourceItems || 0).toLocaleString() + '</td></tr>\n' +
'  <tr><td>Source Domain URL Items</td><td>' + Number(group6.sourceDomains.sourceUrlItems || 0).toLocaleString() + '</td></tr>\n' +
'  <tr><td>Source Domain Unique Domains</td><td>' + Number(group6.sourceDomains.uniqueDomains || 0) + '</td></tr>\n' +
'  <tr><td>Hotpath Functions</td><td>' + Number(group6.hotpath.functions || 0) + '</td></tr>\n' +
'  <tr><td>Hotpath Fetch Refs</td><td>' + Number(group6.hotpath.fetchRefs || 0) + '</td></tr>\n' +
'</table>\n' +
'</div>\n' +
'\n' +
'<p><em>Dashboard generated from Group 6 shot artifacts.</em></p>\n' +
'</body>\n' +
'</html>';

  const outPath = join(OUT, 'report-group6-dashboard.html');
  writeFileSync(outPath, h);
  console.log('report-group6-dashboard ok  html=' + outPath.replace(ROOT + '/', '') + '  media=' + (media.ok ? 'PASS' : 'FAIL') + '  historical=' + (historical.ok ? 'PASS' : 'FAIL') + '  domains=' + (sourceDomains.ok ? 'PASS' : 'FAIL') + '  hotpath=' + (hotpath.ok ? 'PASS' : 'FAIL'));
}

render();
