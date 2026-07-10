#!/usr/bin/env node
// Read-only probe-log summarizer. Reads all tools/shots/probe-*.json files and
// produces tools/shots/probe-log-summary.html with a table of probe name,
// steps passed/total, page errors, warnings, and tier.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml } from './report-html-escape.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SHOTS = join(__dirname, 'shots');

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function readJson(rel) {
  return JSON.parse(readFileSync(join(SHOTS, rel), 'utf8'));
}

function tierFromName(name) {
  // Infer tier from probe filename conventions
  if (/probe-(accessibility|h0-|h2-)/.test(name)) return 'UI';
  if (/probe-(ai|attacker-parity|auto-resolve|campaign-link|conditioning|field|fog|logistics|oob|targeting)/.test(name)) return 'Engine';
  if (/probe-(antietam|bullrun|chancellorsville|chickamauga|fredericksburg|gettysburg|malvern-hill|shiloh|vicksburg)/.test(name)) return 'Scenario';
  if (/probe-(arms|artillery|cannon|cover|engineering|weapons)/.test(name)) return 'Combat';
  if (/probe-(blockade|cabinet|command|cs-finance|decisions|diplomacy|economy|hard-war|human-cost|irregular-war|logistics-rail|manpower|morale|press|prisoner-exchange|production|real-diplomacy|western-theater)/.test(name)) return 'Strategy';
  if (/probe-(bridge|codex|custom-battle-builder|desk|endings|glossary|help-overlay|playstyle|ratings|save-slots|tutorial|victory)/.test(name)) return 'Meta';
  if (/probe-(afteraction|h0-after-action|h0-battle-briefing|h0-between-battle|h0-main-menu|h0-president-desk|h0-tactical-hud)/.test(name)) return 'UI';
  if (/probe-(photo-embed|portraits|scenes-imagery|leaders-imagery|usct-imagery|arms-imagery)/.test(name)) return 'Media';
  if (/probe-(loot-survival|women-in-war|flagship-units|primary-sources|under-told-perspectives|soldier-replacements)/.test(name)) return 'Content';
  if (/probe-(group6|media-budget|historical|hotpath|report-html|source-domain)/.test(name)) return 'Tooling';
  return 'Other';
}

function main() {
  ensureDir(SHOTS);

  const files = readdirSync(SHOTS)
    .filter(f => f.startsWith('probe-') && f.endsWith('.json'))
    .sort();

  const rows = [];

  for (const file of files) {
    const probeName = file.replace(/\.json$/, '');
    try {
      const data = readJson(file);
      const passed = data.passed != null ? data.passed : (data.steps ? data.steps.filter(s => s.ok).length : (data.ok === true ? '✓' : '?'));
      const total = data.total != null ? data.total : (data.steps ? data.steps.length : (data.ok === true ? '✓' : '?'));
      const pageErrors = data.pageErrors != null ? data.pageErrors : (data.pageerrors != null ? data.pageerrors : '—');
      const warnings = data.warnings && data.warnings.length > 0
        ? data.warnings.join('; ')
        : (data.warning || '—');
      const tier = tierFromName(probeName);
      const ok = data.ok != null ? data.ok : (passed === total);
      rows.push({ probeName, passed, total, pageErrors, warnings, tier, ok });
    } catch (e) {
      rows.push({ probeName, passed: 'ERR', total: 'ERR', pageErrors: '—', warnings: e.message, tier: '—', ok: false });
    }
  }

  const totalPassed = rows.filter(r => r.ok === true).length;
  const totalFailed = rows.filter(r => r.ok === false).length;
  const totalRows = rows.length;

  const tableRows = rows.map(r => {
    const status = r.ok === true ? '✅' : (r.ok === false ? '❌' : '⚠️');
    return `<tr>
      <td>${escapeHtml(r.probeName)}</td>
      <td>${escapeHtml(String(r.passed))} / ${escapeHtml(String(r.total))}</td>
      <td>${escapeHtml(String(r.pageErrors))}</td>
      <td>${escapeHtml(String(r.warnings))}</td>
      <td>${escapeHtml(r.tier)}</td>
      <td>${status}</td>
    </tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Probe Log Summary</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; background: #f8f9fa; color: #1a1a2e; }
  h1 { border-bottom: 2px solid #c0392b; padding-bottom: 0.5rem; }
  .summary { margin: 1rem 0; padding: 1rem; background: #fff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .summary span { margin-right: 2rem; }
  .pass { color: #27ae60; font-weight: bold; }
  .fail { color: #c0392b; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #2c3e50; color: #fff; font-weight: 600; }
  tr:hover { background: #f1f2f6; }
  .warn-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
</head>
<body>
<h1>📊 Probe Log Summary</h1>
<div class="summary">
  <span>Total: <strong>${totalRows}</strong></span>
  <span class="pass">✅ Passed: <strong>${totalPassed}</strong></span>
  <span class="fail">❌ Failed: <strong>${totalFailed}</strong></span>
  <span>Generated: ${new Date().toISOString()}</span>
</div>
<table>
<thead>
<tr><th>Probe</th><th>Steps</th><th>Page Errors</th><th>Warnings</th><th>Tier</th><th>Status</th></tr>
</thead>
<tbody>
${tableRows}
</tbody>
</table>
</body>
</html>`;

  const outPath = join(SHOTS, 'probe-log-summary.html');
  writeFileSync(outPath, html, 'utf8');
  console.log(`✅ probe-log-summary.html written (${totalRows} probes, ${totalPassed} passed, ${totalFailed} failed)`);
}

main();
