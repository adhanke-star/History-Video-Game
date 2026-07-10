#!/usr/bin/env node
// Read-only orphan-asset checker. Reads assets/embed/ subdirectories,
// cross-references against src/*.js, build/base.html, and data/*.json for
// string references to each filename, and writes tools/shots/orphan-assets-report.html
// listing any embedded files not referenced in source code or data/build files.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml } from './report-html-escape.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const EMBED = join(ROOT, 'assets', 'embed');
const SRC = join(ROOT, 'src');
const DATA = join(ROOT, 'data');
const BUILD = join(ROOT, 'build');
const SHOTS = join(__dirname, 'shots');

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function main() {
  ensureDir(SHOTS);

  // ---- 1. Collect all embedded files ----
  const embedDirs = readdirSync(EMBED, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const allEmbeddedFiles = []; // { category, filename, stem }

  for (const dir of embedDirs) {
    const dirPath = join(EMBED, dir);
    const files = readdirSync(dirPath)
      .filter(f => /\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(f))
      .sort();

    for (const file of files) {
      const stem = file.replace(/\.(jpg|jpeg|png|gif|svg|webp|avif)$/i, '');
      allEmbeddedFiles.push({ category: dir, filename: file, stem });
    }
  }

  // ---- 2. Collect all src/*.js text ----
  const srcFiles = readdirSync(SRC)
    .filter(f => f.endsWith('.js'))
    .sort();

  let allSourceText = '';
  const srcFileContents = {};

  for (const file of srcFiles) {
    const filePath = join(SRC, file);
    const text = readFileSync(filePath, 'utf8');
    srcFileContents[file] = text;
    allSourceText += text + '\n';
  }

  // ---- 2b. Collect build/base.html text ----
  let buildHtmlText = '';
  const buildHtmlPath = join(BUILD, 'base.html');
  try {
    buildHtmlText = readFileSync(buildHtmlPath, 'utf8');
  } catch (e) {
    console.warn(`⚠ Could not read ${buildHtmlPath}: ${e.message}`);
  }

  // ---- 2c. Collect all data/*.json text ----
  let allDataText = '';
  const dataFileContents = {};
  const dataFiles = readdirSync(DATA)
    .filter(f => f.endsWith('.json'))
    .sort();

  for (const file of dataFiles) {
    const filePath = join(DATA, file);
    const text = readFileSync(filePath, 'utf8');
    dataFileContents[file] = text;
    allDataText += text + '\n';
  }

  // ---- 3. Cross-reference each embedded file ----
  const results = [];

  for (const ef of allEmbeddedFiles) {
    // Check for references: the filename itself, the stem, or paths like "embed/category/filename"
    const filenameRef = ef.filename;
    const stemRef = ef.stem;
    const pathRef = `embed/${ef.category}/${ef.filename}`;
    const categoryPathRef = `${ef.category}/${ef.filename}`;

    let foundIn = [];

    // Check src/*.js
    for (const [srcFile, srcText] of Object.entries(srcFileContents)) {
      if (srcText.includes(filenameRef) || srcText.includes(stemRef) || srcText.includes(pathRef) || srcText.includes(categoryPathRef)) {
        foundIn.push(srcFile);
      }
    }

    // Check build/base.html
    if (buildHtmlText) {
      if (buildHtmlText.includes(filenameRef) || buildHtmlText.includes(stemRef) || buildHtmlText.includes(pathRef) || buildHtmlText.includes(categoryPathRef)) {
        foundIn.push('build/base.html');
      }
    }

    // Check data/*.json
    for (const [dataFile, dataText] of Object.entries(dataFileContents)) {
      if (dataText.includes(filenameRef) || dataText.includes(stemRef) || dataText.includes(pathRef) || dataText.includes(categoryPathRef)) {
        foundIn.push(`data/${dataFile}`);
      }
    }

    // Deduplicate
    foundIn = [...new Set(foundIn)];

    const isOrphan = foundIn.length === 0;
    results.push({
      category: ef.category,
      filename: ef.filename,
      stem: ef.stem,
      isOrphan,
      referencedBy: foundIn
    });
  }

  // ---- 4. Build report ----
  const orphans = results.filter(r => r.isOrphan);
  const referenced = results.filter(r => !r.isOrphan);
  const totalFiles = results.length;

  const orphanRows = orphans.map(r => {
    return `<tr class="orphan">
      <td>${escapeHtml(r.category)}</td>
      <td>${escapeHtml(r.filename)}</td>
      <td>${escapeHtml(r.stem)}</td>
      <td>—</td>
    </tr>`;
  }).join('\n');

  const referencedRows = referenced.map(r => {
    return `<tr>
      <td>${escapeHtml(r.category)}</td>
      <td>${escapeHtml(r.filename)}</td>
      <td>${escapeHtml(r.stem)}</td>
      <td>${escapeHtml(r.referencedBy.join(', '))}</td>
    </tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Orphan Assets Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; background: #f8f9fa; color: #1a1a2e; }
  h1 { border-bottom: 2px solid #8e44ad; padding-bottom: 0.5rem; }
  .summary { margin: 1rem 0; padding: 1rem; background: #fff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .summary span { margin-right: 2rem; }
  .ok { color: #27ae60; font-weight: bold; }
  .warn { color: #e67e22; font-weight: bold; }
  .orphan-count { color: #c0392b; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
  th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #2c3e50; color: #fff; font-weight: 600; }
  tr:hover { background: #f1f2f6; }
  tr.orphan { background: #fde8e8; }
  tr.orphan:hover { background: #f5c6c6; }
  .section-title { margin-top: 2rem; color: #2c3e50; }
</style>
</head>
<body>
<h1>🔍 Orphan Assets Report</h1>
<div class="summary">
  <span>Total embedded files: <strong>${totalFiles}</strong></span>
  <span class="ok">✅ Referenced: <strong>${referenced.length}</strong></span>
  <span class="orphan-count">❌ Orphans: <strong>${orphans.length}</strong></span>
  <span>Generated: ${new Date().toISOString()}</span>
</div>

${orphans.length > 0 ? `
<h2 class="section-title">❌ Orphan Assets (${orphans.length})</h2>
<table>
<thead>
<tr><th>Category</th><th>Filename</th><th>Stem</th><th>Referenced By</th></tr>
</thead>
<tbody>
${orphanRows}
</tbody>
</table>` : '<p class="ok">✅ No orphan assets found — every embedded file is referenced in source code, build template, or data files.</p>'}

<h2 class="section-title">✅ Referenced Assets (${referenced.length})</h2>
<table>
<thead>
<tr><th>Category</th><th>Filename</th><th>Stem</th><th>Referenced By</th></tr>
</thead>
<tbody>
${referencedRows}
</tbody>
</table>
</body>
</html>`;

  const outPath = join(SHOTS, 'orphan-assets-report.html');
  writeFileSync(outPath, html, 'utf8');
  console.log(`✅ orphan-assets-report.html written (${totalFiles} files, ${orphans.length} orphans, ${referenced.length} referenced)`);
}

main();
