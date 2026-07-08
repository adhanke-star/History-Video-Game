#!/usr/bin/env node
// Consolidated filesystem-only readback guard for Group 6 source/budget tooling.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
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

function runProbe(relPath) {
    const p = spawnSync(process.execPath, [join(ROOT, relPath)], {
        cwd: ROOT,
        encoding: 'utf8'
    });
    if (p.status !== 0) {
        const out = (p.stdout || '').trim().split(/\r?\n/).slice(-6).join(' | ');
        const err = (p.stderr || '').trim().split(/\r?\n/).slice(-6).join(' | ');
        throw new Error(relPath + ' failed status=' + p.status + (out ? ' stdout=' + out : '') + (err ? ' stderr=' + err : ''));
    }
    const tail = (p.stdout || '').trim().split(/\r?\n/).slice(-1)[0] || '';
    return { probe: relPath, tail };
}

function readJson(relPath) {
    return JSON.parse(readFileSync(join(ROOT, relPath), 'utf8'));
}

step('component probes are green and artifacts are refreshed', () => {
    const ran = [
        runProbe('tools/probe-media-budget.mjs'),
        runProbe('tools/probe-historical-data-inventory.mjs'),
        runProbe('tools/probe-historical-source-domains.mjs'),
        runProbe('tools/probe-hotpath-profile.mjs')
    ];
    return { ran };
});

const media = readJson('tools/shots/probe-media-budget.json');
const historical = readJson('tools/shots/probe-historical-data-inventory.json');
const sourceDomains = readJson('tools/shots/probe-historical-source-domains.json');
const hotpath = readJson('tools/shots/probe-hotpath-profile.json');
const hotpathRaw = readJson('tools/shots/hotpath-profile.json');

step('component artifacts report green status', () => {
    if (!media.ok) throw new Error('probe-media-budget not green');
    if (!historical.ok) throw new Error('probe-historical-data-inventory not green');
    if (!sourceDomains.ok) throw new Error('probe-historical-source-domains not green');
    if (!hotpath.ok) throw new Error('probe-hotpath-profile not green');
    return {
        media: media.passed + '/' + media.total,
        historical: historical.passed + '/' + historical.total,
        sourceDomains: sourceDomains.passed + '/' + sourceDomains.total,
        hotpath: hotpath.passed + '/' + hotpath.total
    };
});

step('media policy/source inventory state is explicit and coherent', () => {
    const policy = (((media || {}).metrics || {}).policyState || {});
    const sourceOrg = (((media || {}).metrics || {}).sourceOrganization || {});
    const sourceInv = (((media || {}).metrics || {}).sourceInventory || {});

    if (!policy.rawTier) throw new Error('missing policyState.rawTier');
    if (!policy.activeGuards || policy.activeGuards.d300CoreFreeze !== true) throw new Error('d300 core-freeze guard inactive');
    if (policy.activeGuards.d302SourceMirror !== true) throw new Error('d302 source-mirror guard inactive');
    if (policy.activeGuards.d303InformativeMetadata !== true) throw new Error('d303 informative-metadata guard inactive');

    if (sourceOrg.sourceMirrorOk !== true) throw new Error('source organization mirror readback is not green');
    if (sourceOrg.informativeMetadataOk !== true) throw new Error('informative metadata readback is not green');
    if (sourceInv.exactStemParityOk !== true) throw new Error('source inventory parity is not green');

    return {
        rawTier: policy.rawTier,
        rawMB: policy.rawMB,
        files: policy.files,
        frozenCategories: ((policy.frozenCategories || {}).total) || 0,
        warnings: Array.isArray(media.warnings) ? media.warnings.length : 0
    };
});

step('historical-data source inventory remains non-vacuous', () => {
    const m = historical.metrics || {};
    if (Number(m.historicalDocs || 0) < 4) throw new Error('too few historical docs: ' + m.historicalDocs);
    if (Number(m.dataFilesWithSources || 0) < 30) throw new Error('too few data files with source fields: ' + m.dataFilesWithSources);
    if (Number(m.dataSourceItems || 0) < 1000) throw new Error('too few source items: ' + m.dataSourceItems);
    if (Number(((m.docConfidenceMentions || {}).verified) || 0) < 100) throw new Error('verified confidence mentions too low');
    return {
        docs: m.historicalDocs,
        filesWithSources: m.dataFilesWithSources,
        sourceItems: m.dataSourceItems,
        sourceNotes: m.dataSourceNotes
    };
});

step('historical source-domain drift guard remains conservative and explicit', () => {
    const m = sourceDomains.metrics || {};
    const drift = m.domainDriftGuard || {};
    const policy = drift.policy || {};
    const current = drift.current || {};
    const reasons = Array.isArray(drift.reasons) ? drift.reasons : [];

    if (drift.pass !== true) throw new Error('source-domain drift guard not green: ' + reasons.join('; '));
    if (policy.requireZeroInvalidUrls !== true) throw new Error('source-domain policy missing zero-invalid rule');
    if (Number(policy.maxTop20ConcentrationPct || 0) <= 0) throw new Error('source-domain policy missing max concentration');
    if (Number(policy.minUniqueDomains || 0) <= 0) throw new Error('source-domain policy missing min unique domains');
    if (Number(current.invalidUrlItems || 0) !== 0) throw new Error('source-domain invalid URLs not zero');
    if (Number(current.concentrationTop20Pct || 0) > Number(policy.maxTop20ConcentrationPct || 0)) {
        throw new Error('source-domain concentration over policy max');
    }
    if (Number(current.uniqueDomains || 0) < Number(policy.minUniqueDomains || 0)) {
        throw new Error('source-domain unique domains below policy floor');
    }

    return {
        sourceUrlItems: Number(m.sourceUrlItems || 0),
        uniqueDomains: Number(current.uniqueDomains || 0),
        concentrationTop20Pct: Number(current.concentrationTop20Pct || 0),
        invalidUrlItems: Number(current.invalidUrlItems || 0),
        maxTop20ConcentrationPct: Number(policy.maxTop20ConcentrationPct || 0),
        minUniqueDomains: Number(policy.minUniqueDomains || 0)
    };
});

step('hotpath profile metrics and network isolation remain coherent', () => {
    const m = hotpath.metrics || {};
    if (Number(m.files || 0) !== 12) throw new Error('expected 12 hotpath files, saw ' + m.files);
    if (Number(m.functions || 0) < 300) throw new Error('functions unexpectedly low: ' + m.functions);
    if (Number(m.loops || 0) < 150) throw new Error('loop sites unexpectedly low: ' + m.loops);
    if (Number(m.fetchRefs || 0) !== 1) throw new Error('expected exactly one fetch reference, saw ' + m.fetchRefs);

    const fetchFiles = (hotpathRaw.files || []).filter(row => Number(row.fetchRefs || 0) > 0).map(row => row.path);
    if (fetchFiles.length !== 1 || fetchFiles[0] !== 'src/tactical/T28-llm-connector.js') {
        throw new Error('unexpected fetch surface: ' + fetchFiles.join(', '));
    }

    return {
        files: m.files,
        lines: m.lines,
        functions: m.functions,
        loops: m.loops,
        fetchFiles
    };
});

step('group-6 consolidated artifact is serializable and reusable', () => {
    const summary = {
        media: {
            rawTier: media.metrics.policyState.rawTier,
            rawMB: media.metrics.policyState.rawMB,
            files: media.metrics.policyState.files,
            headroom: media.metrics.policyState.headroom,
            activeGuards: media.metrics.policyState.activeGuards,
            sourceMirrorOk: media.metrics.sourceOrganization.sourceMirrorOk,
            informativeMetadataOk: media.metrics.sourceOrganization.informativeMetadataOk,
            exactStemParityOk: media.metrics.sourceInventory.exactStemParityOk
        },
        historical: {
            docs: historical.metrics.historicalDocs,
            markdownLines: historical.metrics.markdownLines,
            dataFiles: historical.metrics.dataFiles,
            filesWithSources: historical.metrics.dataFilesWithSources,
            sourceFields: historical.metrics.dataSourceFields,
            sourceItems: historical.metrics.dataSourceItems,
            sourceNotes: historical.metrics.dataSourceNotes
        },
        sourceDomains: {
            sourceUrlItems: sourceDomains.metrics.sourceUrlItems,
            uniqueDomains: sourceDomains.metrics.uniqueDomains,
            concentrationTop20Pct: sourceDomains.metrics.concentrationTop20Pct,
            invalidUrlItems: sourceDomains.metrics.invalidUrlItems,
            policyReadback: sourceDomains.policyReadback,
            driftGuard: sourceDomains.metrics.domainDriftGuard
        },
        hotpath: {
            files: hotpath.metrics.files,
            lines: hotpath.metrics.lines,
            functions: hotpath.metrics.functions,
            loops: hotpath.metrics.loops,
            instancedMeshRefs: hotpath.metrics.instancedMeshRefs,
            disposeRefs: hotpath.metrics.disposeRefs,
            fetchRefs: hotpath.metrics.fetchRefs,
            storageRefs: hotpath.metrics.storageRefs
        }
    };

    writeFileSync(join(OUT, 'group6-readback.json'), JSON.stringify(summary, null, 2));
    const reread = readJson('tools/shots/group6-readback.json');
    if (!reread.media || !reread.historical || !reread.sourceDomains || !reread.hotpath) {
        throw new Error('group6-readback artifact mismatch');
    }
    return {
        artifact: 'tools/shots/group6-readback.json',
        rawTier: reread.media.rawTier,
        sourceItems: reread.historical.sourceItems,
        sourceDomains: reread.sourceDomains.uniqueDomains,
        hotpathFunctions: reread.hotpath.functions
    };
});

const ok = steps.every(s => s.ok);
const out = {
    ok,
    passed: steps.filter(s => s.ok).length,
    total: steps.length,
    summary: {
        mediaRawTier: ((media.metrics || {}).policyState || {}).rawTier || null,
        mediaRawMB: ((media.metrics || {}).policyState || {}).rawMB || null,
        historicalSourceItems: ((historical.metrics || {}).dataSourceItems) || 0,
        sourceDomainUrlItems: ((sourceDomains.metrics || {}).sourceUrlItems) || 0,
        sourceDomainUniqueDomains: ((sourceDomains.metrics || {}).uniqueDomains) || 0,
        hotpathFunctions: ((hotpath.metrics || {}).functions) || 0,
        hotpathFetchRefs: ((hotpath.metrics || {}).fetchRefs) || 0
    },
    steps
};
writeFileSync(join(OUT, 'probe-group6-readback.json'), JSON.stringify(out, null, 2));
console.log('probe-group6-readback ok=' + ok + ' steps=' + out.passed + '/' + out.total + ' tier=' + out.summary.mediaRawTier + ' sources=' + out.summary.historicalSourceItems + ' functions=' + out.summary.hotpathFunctions);
for (const s of steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.error);
if (!ok) process.exit(1);
