#!/usr/bin/env node
// Historical source-domain HTML report generator.
// Reads tools/shots/historical-source-domains.json and produces an HTML summary.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/[&]/g, '&')
    .replace(/[<]/g, '<')
    .replace(/[>]/g, '>')
    .replace(/["]/g, '"');
}

function boolClass(v) {
  return v ? 'ok' : 'danger';
}

function pctClass(val, warnAt, dangerAt) {
  if (val >= dangerAt) return 'danger';
  if (val >= warnAt) return 'warn';
  return 'ok';
}

function render() {
  const data = readJson('tools/shots/historical-source-domains.json');
  const stats = data.stats || {};
  const policy = data.policyReadback || {};
  const topDomains = Array.isArray(data.topDomains) ? data.topDomains : [];
  const byFile = Array.isArray(data.byFile) ? data.byFile : [];
  const badUrls = Array.isArray(data.badUrls) ? data.badUrls : [];

  const urlFiles = byFile.filter(function(f) { return Number(f.sourceUrlItems || 0) > 0; });
  const zeroUrlFiles = byFile.filter(function(f) { return Number(f.sourceUrlItems || 0) === 0; });

  var h = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
'<title>Historical Source-Domain Report</title>\n' +
'<style>\n' +
'  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 2rem; background: #f8f9fa; color: #1a1a2e; }\n' +
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
'  code { background: #e9ecef; padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.85rem; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<h1>Historical Source-Domain Report</h1>\n' +
'<p>Generated from <code>tools/shots/historical-source-domains.json</code></p>\n' +
'\n' +
'<div class="summary-grid">\n' +
'  <div class="summary-card"><div class="label">Data Files</div><div class="value">' + stats.dataFiles + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Files With Sources</div><div class="value">' + stats.dataFilesWithSources + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Source Fields</div><div class="value">' + stats.sourceFields + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Source Items</div><div class="value">' + stats.sourceItems + '</div></div>\n' +
'  <div class="summary-card"><div class="label">URL Source Items</div><div class="value">' + stats.sourceUrlItems + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Unique Domains</div><div class="value">' + stats.uniqueDomains + '</div></div>\n' +
'  <div class="summary-card"><div class="label">Top-20 Concentration</div><div class="value"><span class="badge ' + pctClass(stats.concentrationTop20Pct, 70, 90) + '">' + stats.concentrationTop20Pct + '%</span></div></div>\n' +
'  <div class="summary-card"><div class="label">Invalid URLs</div><div class="value"><span class="badge ' + (stats.invalidUrlItems === 0 ? 'ok' : 'danger') + '">' + stats.invalidUrlItems + '</span></div></div>\n' +
'</div>\n' +
'\n' +
'<h2>Drift Policy Readback</h2>\n' +
'<table>\n' +
'  <tr><th>Policy</th><th>Value</th><th>Current</th><th>Status</th></tr>\n' +
'  <tr><td>Zero Invalid URLs</td><td>' + (policy.requireZeroInvalidUrls ? 'Yes' : 'No') + '</td><td>' + Number(policy.currentInvalidUrlItems || 0) + '</td><td><span class="badge ' + (Number(policy.currentInvalidUrlItems || 0) === 0 ? 'ok' : 'danger') + '">' + (Number(policy.currentInvalidUrlItems || 0) === 0 ? 'OK' : 'FAIL') + '</span></td></tr>\n' +
'  <tr><td>Max Top-20 Concentration</td><td>' + policy.maxTop20ConcentrationPct + '%</td><td>' + policy.currentConcentrationTop20Pct + '%</td><td><span class="badge ' + (Number(policy.currentConcentrationTop20Pct || 0) <= Number(policy.maxTop20ConcentrationPct || 0) ? 'ok' : 'danger') + '">' + (Number(policy.currentConcentrationTop20Pct || 0) <= Number(policy.maxTop20ConcentrationPct || 0) ? 'OK' : 'OVER') + '</span></td></tr>\n' +
'  <tr><td>Min Unique Domains</td><td>' + policy.minUniqueDomains + '</td><td>' + policy.currentUniqueDomains + '</td><td><span class="badge ' + (Number(policy.currentUniqueDomains || 0) >= Number(policy.minUniqueDomains || 0) ? 'ok' : 'danger') + '">' + (Number(policy.currentUniqueDomains || 0) >= Number(policy.minUniqueDomains || 0) ? 'OK' : 'LOW') + '</span></td></tr>\n' +
'  <tr><td>Max Single-File URL Share</td><td>' + policy.maxSingleFileUrlSharePct + '%</td><td>' + policy.currentMaxSingleFileUrlSharePct + '%</td><td><span class="badge ' + (Number(policy.currentMaxSingleFileUrlSharePct || 0) <= Number(policy.maxSingleFileUrlSharePct || 0) ? 'ok' : 'danger') + '">' + (Number(policy.currentMaxSingleFileUrlSharePct || 0) <= Number(policy.maxSingleFileUrlSharePct || 0) ? 'OK' : 'OVER') + '</span></td></tr>\n' +
'  <tr><td>Max Non-Index File URL Share</td><td>' + policy.maxNonIndexFileUrlSharePct + '%</td><td>' + policy.currentMaxNonIndexFileUrlSharePct + '%</td><td><span class="badge ' + (Number(policy.currentMaxNonIndexFileUrlSharePct || 0) <= Number(policy.maxNonIndexFileUrlSharePct || 0) ? 'ok' : 'danger') + '">' + (Number(policy.currentMaxNonIndexFileUrlSharePct || 0) <= Number(policy.maxNonIndexFileUrlSharePct || 0) ? 'OK' : 'OVER') + '</span></td></tr>\n' +
'</table>\n' +
'\n' +
'<h2>Top Domains</h2>\n' +
'<table>\n' +
'  <tr><th>#</th><th>Domain</th><th>Source Items</th><th>Files</th><th>Share</th></tr>\n' +
  topDomains.map(function(d, i) {
    var share = stats.sourceUrlItems > 0 ? (100 * d.sourceItems / stats.sourceUrlItems).toFixed(1) : '0.0';
    return '<tr><td>' + (i + 1) + '</td><td><code>' + esc(d.domain) + '</code></td><td>' + d.sourceItems + '</td><td>' + d.files + '</td><td>' + share + '%</td></tr>';
  }).join('') + '\n' +
'</table>\n' +
'\n' +
'<h2>Files With URL-Bearing Sources (' + urlFiles.length + ')</h2>\n' +
'<table>\n' +
'  <tr><th>File</th><th>Source Fields</th><th>Source Items</th><th>URL Items</th><th>Unique Domains</th><th>Top Domains</th></tr>\n' +
  urlFiles.map(function(f) {
    return '<tr><td><code>' + esc(f.file) + '</code></td><td>' + f.sourceFields + '</td><td>' + f.sourceItems + '</td><td>' + f.sourceUrlItems + '</td><td>' + f.uniqueDomains + '</td><td><code>' + esc((f.topDomains || []).join(', ')) + '</code></td></tr>';
  }).join('') + '\n' +
'</table>\n' +
'\n' +
'<h2>Files Without URL-Bearing Sources (' + zeroUrlFiles.length + ')</h2>\n' +
'<table>\n' +
'  <tr><th>File</th><th>Source Fields</th><th>Source Items</th></tr>\n' +
  zeroUrlFiles.map(function(f) {
    return '<tr><td><code>' + esc(f.file) + '</code></td><td>' + f.sourceFields + '</td><td>' + f.sourceItems + '</td></tr>';
  }).join('') + '\n' +
'</table>\n' +
'\n' +
(badUrls.length ? '<div class="danger-list"><strong>Invalid URLs (' + badUrls.length + ')</strong><ul>' + badUrls.map(function(u) { return '<li><code>' + esc(u.file) + '</code> <code>' + esc(u.fieldPath) + '</code>: ' + esc(u.url) + '</li>'; }).join('') + '</ul></div>\n' : '<div class="ok-list"><strong>Invalid URLs</strong>: 0 (clean)</div>\n') +
'\n' +
'<h2>Budget Readback</h2>\n' +
'<table>\n' +
'  <tr><th>Metric</th><th>Value</th></tr>\n' +
'  <tr><td>Data Directory Bytes</td><td>' + Number((data.budgetReadback || {}).dataDirBytes || 0).toLocaleString() + '</td></tr>\n' +
'</table>\n' +
'\n' +
'<p><em>Generated at: ' + esc(data.generatedAt || '') + '</em></p>\n' +
'</body>\n' +
'</html>';

  const outPath = join(OUT, 'report-source-domains.html');
  writeFileSync(outPath, h);
  console.log('report-source-domains ok  html=' + outPath.replace(ROOT + '/', '') + '  files=' + stats.dataFiles + '  domains=' + stats.uniqueDomains + '  urlItems=' + stats.sourceUrlItems);
}

render();
