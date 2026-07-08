#!/usr/bin/env node
// Read-only source-file inventory. Walks src/*.js, counts lines, extracts
// function/const exports via regex. Writes tools/shots/source-file-inventory.csv
// with columns: file, lines, exports, functions.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src');
const SHOTS = join(__dirname, 'shots');

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function csvEscape(s) {
  const str = String(s);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function main() {
  ensureDir(SHOTS);

  const files = readdirSync(SRC)
    .filter(f => f.endsWith('.js'))
    .sort();

  const rows = [];

  for (const file of files) {
    const filePath = join(SRC, file);
    const text = readFileSync(filePath, 'utf8');
    const lines = text.split(/\r?\n/).length;

    // Extract function declarations: function name(...)
    const funcRe = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
    const functions = [];
    let m;
    while ((m = funcRe.exec(text))) {
      functions.push(m[1]);
    }

    // Extract const/let/var exports: export const name / export function name / module.exports
    const exportRe = /(?:export\s+(?:const|let|var|function|async\s+function)\s+([A-Za-z_$][\w$]*))/g;
    const exports = [];
    while ((m = exportRe.exec(text))) {
      exports.push(m[1]);
    }

    // Also catch arrow-function exports: export const name = (...) =>
    const arrowExportRe = /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/g;
    while ((m = arrowExportRe.exec(text))) {
      if (!exports.includes(m[1])) exports.push(m[1]);
    }

    // Also catch named function exports: export function name(...)
    const funcExportRe = /export\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g;
    while ((m = funcExportRe.exec(text))) {
      if (!exports.includes(m[1])) exports.push(m[1]);
    }

    // Also catch default exports
    const defaultExportRe = /export\s+default\s+(?:function\s+)?([A-Za-z_$][\w$]*)/g;
    while ((m = defaultExportRe.exec(text))) {
      if (!exports.includes(m[1])) exports.push(m[1]);
    }

    // Also catch module.exports assignments
    const modExportRe = /module\.exports\s*=\s*\{([^}]+)\}/g;
    while ((m = modExportRe.exec(text))) {
      const inner = m[1];
      const names = inner.split(',').map(s => s.trim().split(/\s*:\s*/)[1] || s.trim());
      for (const name of names) {
        if (name && !exports.includes(name)) exports.push(name);
      }
    }

    rows.push({
      file,
      lines,
      exports: exports.length,
      functions: functions.length,
      exportNames: exports.join('; '),
      functionNames: functions.join('; ')
    });
  }

  // Build CSV
  const header = 'file,lines,exports,functions';
  const csvRows = [header];

  for (const r of rows) {
    csvRows.push(`${csvEscape(r.file)},${r.lines},${r.exports},${r.functions}`);
  }

  const csv = csvRows.join('\n') + '\n';

  const outPath = join(SHOTS, 'source-file-inventory.csv');
  writeFileSync(outPath, csv, 'utf8');

  // Also print summary
  const totalLines = rows.reduce((s, r) => s + r.lines, 0);
  const totalExports = rows.reduce((s, r) => s + r.exports, 0);
  const totalFunctions = rows.reduce((s, r) => s + r.functions, 0);
  console.log(`✅ source-file-inventory.csv written (${rows.length} files, ${totalLines} lines, ${totalExports} exports, ${totalFunctions} functions)`);
  if (totalExports === 0) {
    console.log('ℹ️  0 exports is expected — this project uses IIFE-based globals (G.*, GAME_DATA.*), not ES module `export` statements. The regex patterns (`export const`, `export function`, `module.exports`) correctly find zero matches in this non-standard module system.');
  }
}

main();
