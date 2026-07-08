#!/usr/bin/env node
// Read-only inventory of URL source domains across historical data JSON.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const DOMAIN_DRIFT_POLICY = Object.freeze({
  requireZeroInvalidUrls: true,
  maxTop20ConcentrationPct: 90,
  minUniqueDomains: 30
});

function walkJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkJsonFiles(p));
      continue;
    }
    if (!ent.isFile()) continue;
    if (ent.name.toLowerCase().endsWith('.json')) out.push(p);
  }
  return out;
}

function relPath(p) {
  return p.replace(ROOT + '/', '');
}

function looksLikeUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s.trim());
}

function getDomain(urlString) {
  try {
    const u = new URL(urlString);
    return (u.hostname || '').toLowerCase();
  } catch {
    return '';
  }
}

function visit(node, path, sink) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) visit(node[i], path + '[' + i + ']', sink);
    return;
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const next = path ? path + '.' + key : key;
      if (key === 'sources' && Array.isArray(node[key])) {
        sink.push({ fieldPath: next, values: node[key] });
      }
      visit(node[key], next, sink);
    }
  }
}

function scanSourceDomains() {
  const files = walkJsonFiles(DATA_DIR).sort((a, b) => a.localeCompare(b));
  const byDomain = new Map();
  const byFile = [];
  const badUrls = [];
  let sourceFields = 0;
  let sourceItems = 0;
  let sourceUrlItems = 0;

  for (const abs of files) {
    const raw = readFileSync(abs, 'utf8');
    const parsed = JSON.parse(raw);
    const sources = [];
    visit(parsed, '', sources);

    const fileDomains = new Set();
    let fileFields = 0;
    let fileItems = 0;
    let fileUrlItems = 0;

    for (const row of sources) {
      fileFields++;
      sourceFields++;
      for (const item of row.values) {
        fileItems++;
        sourceItems++;

        if (!looksLikeUrl(item)) continue;
        fileUrlItems++;
        sourceUrlItems++;
        const domain = getDomain(item);
        if (!domain) {
          badUrls.push({ file: relPath(abs), fieldPath: row.fieldPath, url: item });
          continue;
        }
        fileDomains.add(domain);

        const d = byDomain.get(domain) || {
          domain,
          sourceItems: 0,
          files: new Set()
        };
        d.sourceItems++;
        d.files.add(relPath(abs));
        byDomain.set(domain, d);
      }
    }

    if (fileFields > 0) {
      byFile.push({
        file: relPath(abs),
        sourceFields: fileFields,
        sourceItems: fileItems,
        sourceUrlItems: fileUrlItems,
        uniqueDomains: fileDomains.size,
        topDomains: Array.from(fileDomains).sort().slice(0, 8)
      });
    }
  }

  const domainRows = Array.from(byDomain.values())
    .map(d => ({ domain: d.domain, sourceItems: d.sourceItems, files: d.files.size }))
    .sort((a, b) => b.sourceItems - a.sourceItems || a.domain.localeCompare(b.domain));

  const topDomains = domainRows.slice(0, 20);
  const topItemTotal = topDomains.reduce((sum, r) => sum + r.sourceItems, 0);
  const concentrationTop20Pct = sourceUrlItems > 0 ? +(100 * topItemTotal / sourceUrlItems).toFixed(2) : 0;

  const stats = {
    dataFiles: files.length,
    dataFilesWithSources: byFile.length,
    sourceFields,
    sourceItems,
    sourceUrlItems,
    uniqueDomains: domainRows.length,
    concentrationTop20Pct,
    invalidUrlItems: badUrls.length
  };

  const policyReadback = {
    requireZeroInvalidUrls: DOMAIN_DRIFT_POLICY.requireZeroInvalidUrls,
    maxTop20ConcentrationPct: DOMAIN_DRIFT_POLICY.maxTop20ConcentrationPct,
    minUniqueDomains: DOMAIN_DRIFT_POLICY.minUniqueDomains,
    currentInvalidUrlItems: stats.invalidUrlItems,
    currentConcentrationTop20Pct: stats.concentrationTop20Pct,
    currentUniqueDomains: stats.uniqueDomains
  };

  return {
    generatedAt: new Date().toISOString(),
    stats,
    policyReadback,
    topDomains,
    byFile: byFile.sort((a, b) => b.sourceUrlItems - a.sourceUrlItems || a.file.localeCompare(b.file)),
    badUrls,
    budgetReadback: {
      // Keep this artifact lightweight but include one filesystem-size signal for context.
      dataDirBytes: files.reduce((sum, f) => sum + statSync(f).size, 0)
    }
  };
}

if (process.argv[1] && process.argv[1].endsWith('historical-source-domains.mjs')) {
  const out = scanSourceDomains();
  process.stdout.write(JSON.stringify(out, null, 2));
}

export { scanSourceDomains };
