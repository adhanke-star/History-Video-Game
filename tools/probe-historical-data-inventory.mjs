#!/usr/bin/env node
// Focused filesystem-only gate for the reusable historical-data/source inventory.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectHistoricalDataInventory } from './historical-data-inventory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

const inventory = collectHistoricalDataInventory();

step('canonical historical markdown docs are present and source-bearing', () => {
  if (inventory.missingDocs.length) throw new Error('missing docs: ' + inventory.missingDocs.join(', '));
  if (inventory.totals.historicalDocs !== 4) throw new Error('expected 4 historical docs, saw ' + inventory.totals.historicalDocs);
  const noSources = inventory.docs.filter(row => row.sourceHeadings < 1 && row.confidenceMentions.verified < 1 && row.sourceLikeLines < 2).map(row => row.path);
  if (noSources.length) throw new Error('docs lack source/confidence signal: ' + noSources.join(', '));
  return {
    docs: inventory.totals.historicalDocs,
    markdownLines: inventory.totals.markdownLines,
    sourceHeadings: inventory.totals.markdownSourceHeadings,
    keyFactTables: inventory.totals.markdownKeyFactTables
  };
});

step('historical docs point at existing companion data files', () => {
  if (inventory.companionMissing.length) throw new Error('missing companion data: ' + inventory.companionMissing.join(', '));
  return { companionLinks: inventory.docs.reduce((sum, row) => sum + row.companionData.length, 0) };
});

step('machine-readable data source fields are discoverable', () => {
  if (inventory.totals.dataFiles < 30) throw new Error('too few data files inventoried: ' + inventory.totals.dataFiles);
  if (inventory.totals.dataFilesWithSources < 25) throw new Error('too few data files with source fields: ' + inventory.totals.dataFilesWithSources);
  if (inventory.totals.dataSourceFields < 300) throw new Error('too few source fields: ' + inventory.totals.dataSourceFields);
  if (inventory.totals.dataSourceItems < 500) throw new Error('too few source items: ' + inventory.totals.dataSourceItems);
  return {
    dataFiles: inventory.totals.dataFiles,
    filesWithSources: inventory.totals.dataFilesWithSources,
    sourceFields: inventory.totals.dataSourceFields,
    sourceItems: inventory.totals.dataSourceItems
  };
});

step('confidence tags remain visible across docs and data', () => {
  const d = inventory.totals.docConfidenceMentions;
  if (d.verified < 100 || d.inferred < 10) throw new Error('historical docs confidence signal too thin: ' + JSON.stringify(d));
  if (inventory.totals.dataSourceNotes < 500) throw new Error('data source-note signal too thin: ' + inventory.totals.dataSourceNotes);
  return { docs: d, dataSourceNotes: inventory.totals.dataSourceNotes };
});

step('inventory artifact is serializable and reusable', () => {
  const outFile = join(OUT, 'historical-data-inventory.json');
  writeFileSync(outFile, JSON.stringify(inventory, null, 2));
  const reread = JSON.parse(readFileSync(outFile, 'utf8'));
  if (!reread.totals || reread.totals.dataSourceItems !== inventory.totals.dataSourceItems) throw new Error('artifact readback mismatch');
  return { artifact: 'tools/shots/historical-data-inventory.json', sourceItems: reread.totals.dataSourceItems };
});

const ok = steps.every(s => s.ok);
const out = {
  ok,
  passed: steps.filter(s => s.ok).length,
  total: steps.length,
  metrics: inventory.totals,
  docs: inventory.docs,
  filesWithSources: inventory.filesWithSources,
  steps
};
writeFileSync(join(OUT, 'probe-historical-data-inventory.json'), JSON.stringify(out, null, 2));
console.log('probe-historical-data-inventory ok=' + ok + ' steps=' + out.passed + '/' + out.total + ' sourceItems=' + inventory.totals.dataSourceItems);
for (const s of steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.error);
if (!ok) process.exit(1);
