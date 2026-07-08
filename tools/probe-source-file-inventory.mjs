#!/usr/bin/env node
// Focused filesystem-only guard for tools/inventory-source-files.mjs.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });

const steps = [];
function step(name, fn) {
  try {
    const detail = fn();
    steps.push({ name, ok: true, detail: detail === undefined ? null : detail });
  } catch (e) {
    steps.push({ name, ok: false, error: String(e && e.message || e) });
  }
}

function walkJsFiles(dir, baseDir = dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkJsFiles(abs, baseDir));
      continue;
    }
    if (ent.isFile() && ent.name.endsWith('.js')) {
      out.push(abs.replace(baseDir + '/', ''));
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift();
  if (header !== 'file,lines,exports,functions') {
    throw new Error('unexpected CSV header: ' + header);
  }
  return lines.map(line => {
    const cols = line.split(',');
    return {
      file: cols[0],
      lines: Number(cols[1] || 0),
      exports: Number(cols[2] || 0),
      functions: Number(cols[3] || 0)
    };
  });
}

const scriptOut = execFileSync(process.execPath, [join(__dirname, 'inventory-source-files.mjs')], {
  cwd: ROOT,
  encoding: 'utf8'
});

const csvPath = join(OUT, 'source-file-inventory.csv');
const expectedFiles = walkJsFiles(SRC);
const rows = parseCsv(readFileSync(csvPath, 'utf8'));
const byFile = new Map(rows.map(row => [row.file, row]));
const totalLines = rows.reduce((sum, row) => sum + row.lines, 0);
const totalExports = rows.reduce((sum, row) => sum + row.exports, 0);
const totalFunctions = rows.reduce((sum, row) => sum + row.functions, 0);
const tacticalRows = rows.filter(row => row.file.startsWith('tactical/'));

step('source inventory script runs and writes CSV', () => {
  if (!scriptOut.includes('source-file-inventory.csv written')) {
    throw new Error('script output missing success line');
  }
  if (!existsSync(csvPath)) throw new Error('CSV missing at tools/shots/source-file-inventory.csv');
  return { stdout: scriptOut.trim().split(/\r?\n/)[0] };
});

step('CSV row count matches src/**/*.js', () => {
  if (rows.length !== expectedFiles.length) {
    throw new Error('CSV rows ' + rows.length + ' != expected source files ' + expectedFiles.length);
  }
  return { files: rows.length };
});

step('tactical modules are included', () => {
  const required = [
    'tactical/T0-field-sandbox.js',
    'tactical/T15-oob.js',
    'tactical/T27-llm-commander.js',
    'tactical/T28-llm-connector.js'
  ];
  const missing = required.filter(file => !byFile.has(file));
  if (missing.length) throw new Error('missing tactical inventory rows: ' + missing.join(', '));
  if (tacticalRows.length < 25) throw new Error('too few tactical rows: ' + tacticalRows.length);
  return { tacticalFiles: tacticalRows.length };
});

step('inventory totals are non-vacuous for the current codebase', () => {
  if (totalLines < 30000) throw new Error('too few source lines: ' + totalLines);
  if (totalFunctions < 1400) throw new Error('too few function declarations: ' + totalFunctions);
  if (totalExports !== 0) throw new Error('expected IIFE globals with 0 exports, saw ' + totalExports);
  return { lines: totalLines, functions: totalFunctions, exports: totalExports };
});

const ok = steps.every(s => s.ok);
const result = {
  ok,
  passed: steps.filter(s => s.ok).length,
  total: steps.length,
  steps,
  metrics: {
    files: rows.length,
    tacticalFiles: tacticalRows.length,
    lines: totalLines,
    exports: totalExports,
    functions: totalFunctions
  }
};

writeFileSync(join(OUT, 'probe-source-file-inventory.json'), JSON.stringify(result, null, 2));
console.log('probe-source-file-inventory ok=' + ok + ' steps=' + result.passed + '/' + result.total + ' files=' + rows.length + ' tactical=' + tacticalRows.length + ' functions=' + totalFunctions);
if (!ok) process.exit(1);
