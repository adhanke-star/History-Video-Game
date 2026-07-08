#!/usr/bin/env node
// Read-only inventory for historical markdown and machine-readable source fields.
// It writes a probe-friendly JSON index; it does not validate historical truth.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');

const HISTORICAL_DOCS = [
  { path: 'HISTORICAL-DATA.md', companionData: ['data/bullrun.json', 'data/antietam.json', 'data/chancellorsville.json', 'data/chickamauga.json', 'data/fredericksburg.json', 'data/gettysburg.json', 'data/malvern-hill.json', 'data/shiloh.json', 'data/vicksburg.json'] },
  { path: 'HISTORICAL-DATA-ECONOMY.md', companionData: ['data/economy.json', 'data/cs-finance.json', 'data/logistics-rail.json', 'data/weapons.json'] },
  { path: 'HISTORICAL-DATA-DIPLOMACY.md', companionData: ['data/diplomacy.json'] },
  { path: 'HISTORICAL-DATA-ARTILLERY.md', companionData: ['data/artillery.json'] }
];

const SOURCE_KEYS = new Set(['sources', 'source', 'sourceUrl', 'sourceUrls', 'citation', 'citations', 'bibliography']);
const NOTE_KEYS = new Set(['sourceNote', 'provenance', 'provenanceNote']);

function readText(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function listDataFiles() {
  return readdirSync(join(ROOT, 'data'))
    .filter(name => name.endsWith('.json'))
    .map(name => 'data/' + name)
    .sort();
}

function countMatches(text, re) {
  const m = text.match(re);
  return m ? m.length : 0;
}

function docInventory(row) {
  const text = readText(row.path);
  const lines = text.split(/\r?\n/);
  const headings = lines.filter(line => /^#{1,6}\s+/.test(line));
  const sourceHeadings = lines.filter(line => /^#{2,6}\s+sources\b/i.test(line.trim()));
  const sourceLikeLines = lines.filter(line => /\b(source|sources|scholars|historiography|fact-checked|audit)\b/i.test(line));
  const keyFactTables = lines.filter(line => /^\|\s*Claim\s*\|\s*Value\s*\|\s*Confidence\s*\|\s*Source\s*\|/i.test(line.trim()));
  return {
    path: row.path,
    bytes: statSync(join(ROOT, row.path)).size,
    lines: lines.length,
    headings: headings.length,
    sourceHeadings: sourceHeadings.length,
    sourceLikeLines: sourceLikeLines.length,
    keyFactTables: keyFactTables.length,
    confidenceMentions: {
      verified: countMatches(text, /\bVerified\b/g),
      inferred: countMatches(text, /\bInferred\b/g),
      disputed: countMatches(text, /\bDisputed\b/g),
      contested: countMatches(text, /\bcontested\b/gi)
    },
    companionData: row.companionData.slice()
  };
}

function pushSourceRef(refs, file, path, value) {
  if (value == null) return;
  if (Array.isArray(value)) {
    refs.push({ file, path, kind: 'array', count: value.length });
    return;
  }
  if (typeof value === 'string') {
    refs.push({ file, path, kind: 'string', count: value.trim() ? 1 : 0 });
    return;
  }
  if (typeof value === 'object') {
    refs.push({ file, path, kind: 'object', count: Object.keys(value).length });
  }
}

function scanJsonValue(value, file, path, acc) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) scanJsonValue(value[i], file, path + '[' + i + ']', acc);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? path + '.' + key : key;
    if (SOURCE_KEYS.has(key)) pushSourceRef(acc.sourceRefs, file, childPath, child);
    if (NOTE_KEYS.has(key) && typeof child === 'string' && child.trim()) acc.sourceNotes.push({ file, path: childPath });
    if ((key === 'confidence' || key === 'confidenceTag' || key === 'status') && typeof child === 'string') {
      const v = child.toLowerCase();
      if (v.includes('verified')) acc.confidence.verified++;
      else if (v.includes('inferred')) acc.confidence.inferred++;
      else if (v.includes('disputed')) acc.confidence.disputed++;
    }
    scanJsonValue(child, file, childPath, acc);
  }
}

function dataInventory(file) {
  const acc = {
    sourceRefs: [],
    sourceNotes: [],
    confidence: { verified: 0, inferred: 0, disputed: 0 }
  };
  scanJsonValue(readJson(file), file, '', acc);
  const sourceItems = acc.sourceRefs.reduce((sum, r) => sum + Number(r.count || 0), 0);
  return {
    path: file,
    bytes: statSync(join(ROOT, file)).size,
    sourceFields: acc.sourceRefs.length,
    sourceItems,
    sourceNotes: acc.sourceNotes.length,
    confidence: acc.confidence,
    sampleSourcePaths: acc.sourceRefs.slice(0, 8).map(r => r.path)
  };
}

export function collectHistoricalDataInventory(root = ROOT) {
  if (root !== ROOT) throw new Error('custom roots are not supported in this CLI inventory yet');
  const missingDocs = HISTORICAL_DOCS.filter(row => !existsSync(join(ROOT, row.path))).map(row => row.path);
  const docs = HISTORICAL_DOCS.filter(row => existsSync(join(ROOT, row.path))).map(docInventory);
  const dataFiles = listDataFiles();
  const data = dataFiles.map(dataInventory);
  const companionMissing = [];
  for (const row of HISTORICAL_DOCS) {
    for (const rel of row.companionData) {
      if (!existsSync(join(ROOT, rel))) companionMissing.push(row.path + ' -> ' + rel);
    }
  }
  const filesWithSources = data.filter(row => row.sourceFields > 0).map(row => row.path);
  const totals = {
    historicalDocs: docs.length,
    markdownLines: docs.reduce((sum, row) => sum + row.lines, 0),
    markdownSourceHeadings: docs.reduce((sum, row) => sum + row.sourceHeadings, 0),
    markdownKeyFactTables: docs.reduce((sum, row) => sum + row.keyFactTables, 0),
    docConfidenceMentions: docs.reduce((acc, row) => {
      acc.verified += row.confidenceMentions.verified;
      acc.inferred += row.confidenceMentions.inferred;
      acc.disputed += row.confidenceMentions.disputed;
      acc.contested += row.confidenceMentions.contested;
      return acc;
    }, { verified: 0, inferred: 0, disputed: 0, contested: 0 }),
    dataFiles: data.length,
    dataFilesWithSources: filesWithSources.length,
    dataSourceFields: data.reduce((sum, row) => sum + row.sourceFields, 0),
    dataSourceItems: data.reduce((sum, row) => sum + row.sourceItems, 0),
    dataSourceNotes: data.reduce((sum, row) => sum + row.sourceNotes, 0),
    dataConfidence: data.reduce((acc, row) => {
      acc.verified += row.confidence.verified;
      acc.inferred += row.confidence.inferred;
      acc.disputed += row.confidence.disputed;
      return acc;
    }, { verified: 0, inferred: 0, disputed: 0 })
  };
  return {
    generatedAt: new Date().toISOString(),
    docs,
    data,
    filesWithSources,
    missingDocs,
    companionMissing,
    totals
  };
}

export function writeHistoricalDataInventory(outFile = join(OUT, 'historical-data-inventory.json')) {
  mkdirSync(dirname(outFile), { recursive: true });
  const inventory = collectHistoricalDataInventory();
  writeFileSync(outFile, JSON.stringify(inventory, null, 2));
  return inventory;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const out = process.argv[2] ? resolve(process.argv[2]) : join(OUT, 'historical-data-inventory.json');
  const inventory = writeHistoricalDataInventory(out);
  console.log('historical-data-inventory docs=' + inventory.totals.historicalDocs + ' dataFiles=' + inventory.totals.dataFiles + ' sourceItems=' + inventory.totals.dataSourceItems + ' out=' + out.replace(ROOT + '/', ''));
}
