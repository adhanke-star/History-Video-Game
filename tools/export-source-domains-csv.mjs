#!/usr/bin/env node
// Source-domain URL inventory CSV export.
// Reads tools/shots/historical-source-domains.json and writes a CSV of all URL-bearing source entries.
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

function escCsv(s) {
  if (s == null) return '';
  var str = String(s);
  if (str.indexOf(',') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0 || str.indexOf('\r') >= 0) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function getDomain(urlString) {
  try {
    var u = new URL(urlString);
    return (u.hostname || '').toLowerCase();
  } catch (e) {
    return '';
  }
}

function looksLikeUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s.trim());
}

function visit(node, path, sink) {
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) visit(node[i], path + '[' + i + ']', sink);
    return;
  }
  if (node && typeof node === 'object') {
    for (var key of Object.keys(node)) {
      var next = path ? path + '.' + key : key;
      if (key === 'sources' && Array.isArray(node[key])) {
        sink.push({ fieldPath: next, values: node[key] });
      }
      visit(node[key], next, sink);
    }
  }
}

function render() {
  var data = readJson('tools/shots/historical-source-domains.json');
  var byFile = Array.isArray(data.byFile) ? data.byFile : [];

  // Re-scan the actual data files to extract individual URL entries with file/field/domain/url
  var DATA_DIR = join(ROOT, 'data');
  var rows = [];

  for (var fi = 0; fi < byFile.length; fi++) {
    var f = byFile[fi];
    if (Number(f.sourceUrlItems || 0) === 0) continue;

    var absPath = join(ROOT, f.file);
    var parsed;
    try {
      parsed = JSON.parse(readFileSync(absPath, 'utf8'));
    } catch (e) {
      continue;
    }

    var sources = [];
    visit(parsed, '', sources);

    for (var si = 0; si < sources.length; si++) {
      var src = sources[si];
      for (var vi = 0; vi < src.values.length; vi++) {
        var val = src.values[vi];
        if (!looksLikeUrl(val)) continue;
        var domain = getDomain(val);
        rows.push({
          file: f.file,
          fieldPath: src.fieldPath,
          domain: domain,
          url: val
        });
      }
    }
  }

  // Sort by file, then field path, then URL
  rows.sort(function(a, b) {
    var fc = a.file.localeCompare(b.file);
    if (fc !== 0) return fc;
    var fpc = a.fieldPath.localeCompare(b.fieldPath);
    if (fpc !== 0) return fpc;
    return a.url.localeCompare(b.url);
  });

  var header = 'file,fieldPath,domain,url';
  var lines = [header];
  for (var ri = 0; ri < rows.length; ri++) {
    var r = rows[ri];
    lines.push(escCsv(r.file) + ',' + escCsv(r.fieldPath) + ',' + escCsv(r.domain) + ',' + escCsv(r.url));
  }

  var csv = lines.join('\n') + '\n';
  var outPath = join(OUT, 'source-domains-url-inventory.csv');
  writeFileSync(outPath, csv);
  console.log('export-source-domains-csv ok  csv=' + outPath.replace(ROOT + '/', '') + '  rows=' + rows.length + '  files=' + byFile.filter(function(f) { return Number(f.sourceUrlItems || 0) > 0; }).length);
}

render();
