#!/usr/bin/env node
// Focused filesystem-only guard for historical source-domain visibility.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanSourceDomains } from './historical-source-domains.mjs';

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

const inventory = scanSourceDomains();
const policy = inventory.policyReadback || {};

const driftReasons = [];
if (policy.requireZeroInvalidUrls && Number(inventory.stats.invalidUrlItems || 0) !== 0) {
  driftReasons.push('invalid URL items must remain zero, saw ' + inventory.stats.invalidUrlItems);
}
if (Number(inventory.stats.concentrationTop20Pct || 0) > Number(policy.maxTop20ConcentrationPct || 0)) {
  driftReasons.push(
    'top-domain concentration ' +
    inventory.stats.concentrationTop20Pct +
    '% exceeds policy max ' +
    policy.maxTop20ConcentrationPct +
    '%'
  );
}
if (Number(inventory.stats.uniqueDomains || 0) < Number(policy.minUniqueDomains || 0)) {
  driftReasons.push(
    'unique domains ' + inventory.stats.uniqueDomains + ' below policy floor ' + policy.minUniqueDomains
  );
}
if (Number(policy.maxSingleFileUrlSharePct || 0) > 0) {
  const currentMaxSingleFileUrlSharePct = Number(policy.currentMaxSingleFileUrlSharePct || 0);
  if (currentMaxSingleFileUrlSharePct > Number(policy.maxSingleFileUrlSharePct || 0)) {
    const topFile = policy.currentTopFileByUrlItems || null;
    driftReasons.push(
      'single-file URL share ' +
      currentMaxSingleFileUrlSharePct +
      '% exceeds policy max ' +
      policy.maxSingleFileUrlSharePct +
      '%' +
      (topFile && topFile.file ? ' (file=' + topFile.file + ')' : '')
    );
  }
}
if (Number(policy.maxNonIndexFileUrlSharePct || 0) > 0) {
  const currentMaxNonIndexFileUrlSharePct = Number(policy.currentMaxNonIndexFileUrlSharePct || 0);
  if (currentMaxNonIndexFileUrlSharePct > Number(policy.maxNonIndexFileUrlSharePct || 0)) {
    const topNonIndexFile = policy.currentTopNonIndexFileByUrlItems || null;
    driftReasons.push(
      'non-index single-file URL share ' +
      currentMaxNonIndexFileUrlSharePct +
      '% exceeds policy max ' +
      policy.maxNonIndexFileUrlSharePct +
      '%' +
      (topNonIndexFile && topNonIndexFile.file ? ' (file=' + topNonIndexFile.file + ')' : '')
    );
  }
}

const driftGuard = {
  pass: driftReasons.length === 0,
  reasons: driftReasons,
  policy: {
    requireZeroInvalidUrls: !!policy.requireZeroInvalidUrls,
    maxTop20ConcentrationPct: Number(policy.maxTop20ConcentrationPct || 0),
    minUniqueDomains: Number(policy.minUniqueDomains || 0),
    maxSingleFileUrlSharePct: Number(policy.maxSingleFileUrlSharePct || 0),
    domainIndexFiles: Array.isArray(policy.domainIndexFiles) ? policy.domainIndexFiles : [],
    maxNonIndexFileUrlSharePct: Number(policy.maxNonIndexFileUrlSharePct || 0)
  },
  current: {
    invalidUrlItems: Number(inventory.stats.invalidUrlItems || 0),
    concentrationTop20Pct: Number(inventory.stats.concentrationTop20Pct || 0),
    uniqueDomains: Number(inventory.stats.uniqueDomains || 0),
    maxSingleFileUrlSharePct: Number(policy.currentMaxSingleFileUrlSharePct || 0),
    maxNonIndexFileUrlSharePct: Number(policy.currentMaxNonIndexFileUrlSharePct || 0),
    topFileByUrlItems: policy.currentTopFileByUrlItems || null
    ,
    topNonIndexFileByUrlItems: policy.currentTopNonIndexFileByUrlItems || null
  }
};

step('historical source-domain artifact is non-vacuous', () => {
  const s = inventory.stats || {};
  if (Number(s.dataFiles) < 30) throw new Error('too few data files: ' + s.dataFiles);
  if (Number(s.dataFilesWithSources) < 30) throw new Error('too few source-bearing files: ' + s.dataFilesWithSources);
  if (Number(s.sourceFields) < 500) throw new Error('too few source fields: ' + s.sourceFields);
  if (Number(s.sourceItems) < 1000) throw new Error('too few source items: ' + s.sourceItems);
  if (Number(s.sourceUrlItems) < 120) throw new Error('too few URL source items: ' + s.sourceUrlItems);
  if (Number(s.uniqueDomains) < 25) throw new Error('too few unique domains: ' + s.uniqueDomains);
  return s;
});

step('top-domain readback is coherent and sorted', () => {
  const rows = Array.isArray(inventory.topDomains) ? inventory.topDomains : [];
  if (rows.length < 10) throw new Error('too few top domains: ' + rows.length);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].sourceItems > rows[i - 1].sourceItems) {
      throw new Error('topDomains not sorted by sourceItems desc at index ' + i);
    }
  }
  const top = rows[0] || null;
  return {
    topDomain: top ? top.domain : null,
    topSourceItems: top ? top.sourceItems : 0,
    concentrationTop20Pct: inventory.stats.concentrationTop20Pct
  };
});

step('invalid URL list is explicit', () => {
  if (!Array.isArray(inventory.badUrls)) throw new Error('badUrls missing');
  return { invalidUrlItems: inventory.badUrls.length };
});

step('domain drift policy guard is within conservative thresholds', () => {
  if (!driftGuard.pass) throw new Error(driftGuard.reasons.join('; '));
  return driftGuard;
});

step('policy readback current values match computed stats', () => {
  const stats = inventory.stats || {};
  const expected = {
    invalidUrlItems: Number(stats.invalidUrlItems || 0),
    concentrationTop20Pct: Number(stats.concentrationTop20Pct || 0),
    uniqueDomains: Number(stats.uniqueDomains || 0)
  };
  const actual = {
    invalidUrlItems: Number(policy.currentInvalidUrlItems || 0),
    concentrationTop20Pct: Number(policy.currentConcentrationTop20Pct || 0),
    uniqueDomains: Number(policy.currentUniqueDomains || 0)
  };

  if (actual.invalidUrlItems !== expected.invalidUrlItems) {
    throw new Error('invalid URL readback mismatch: ' + actual.invalidUrlItems + ' vs ' + expected.invalidUrlItems);
  }
  if (actual.concentrationTop20Pct !== expected.concentrationTop20Pct) {
    throw new Error('top20 concentration readback mismatch: ' + actual.concentrationTop20Pct + ' vs ' + expected.concentrationTop20Pct);
  }
  if (actual.uniqueDomains !== expected.uniqueDomains) {
    throw new Error('unique domains readback mismatch: ' + actual.uniqueDomains + ' vs ' + expected.uniqueDomains);
  }

  return { expected, actual };
});

step('artifact is serializable and reusable', () => {
  const outFile = join(OUT, 'historical-source-domains.json');
  writeFileSync(outFile, JSON.stringify(inventory, null, 2));
  const reread = JSON.parse(readFileSync(outFile, 'utf8'));
  if (!reread.stats || reread.stats.sourceUrlItems !== inventory.stats.sourceUrlItems) {
    throw new Error('artifact readback mismatch');
  }
  return {
    artifact: 'tools/shots/historical-source-domains.json',
    sourceUrlItems: reread.stats.sourceUrlItems,
    uniqueDomains: reread.stats.uniqueDomains
  };
});

const ok = steps.every(s => s.ok);
const out = {
  ok,
  passed: steps.filter(s => s.ok).length,
  total: steps.length,
  metrics: {
    ...inventory.stats,
    domainDriftGuard: driftGuard
  },
  policyReadback: inventory.policyReadback || null,
  topDomains: inventory.topDomains.slice(0, 10),
  steps
};

writeFileSync(join(OUT, 'probe-historical-source-domains.json'), JSON.stringify(out, null, 2));
console.log(
  'probe-historical-source-domains ok=' +
  ok +
  ' steps=' +
  out.passed +
  '/' +
  out.total +
  ' urlItems=' +
  inventory.stats.sourceUrlItems +
  ' domains=' +
  inventory.stats.uniqueDomains
);
for (const s of steps) {
  if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.error);
}
if (!ok) process.exit(1);
