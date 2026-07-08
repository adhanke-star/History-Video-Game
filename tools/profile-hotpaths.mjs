#!/usr/bin/env node
// Read-only source hotpath profile. This is a static readback, not a gameplay benchmark.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');

const HOTPATH_FILES = [
  { path: 'src/tactical/T0-field-sandbox.js', group: 'core-field', anchors: ['fldSimStep', 'fldRender', 'fldRenderHud', 'fld3dSyncUnit', 'fld3dRender'] },
  { path: 'src/tactical/T3-officers.js', group: 'battle-step', anchors: ['fldOfficersStep'] },
  { path: 'src/tactical/T4-logistics.js', group: 'battle-step', anchors: ['fldLogisticsStep'] },
  { path: 'src/tactical/T5-arms.js', group: 'battle-step', anchors: ['fldArmsStep'] },
  { path: 'src/tactical/T18-render-richness.js', group: 'render-3d', anchors: ['fldRrFrame3d', 'fldRrSyncUnit'] },
  { path: 'src/tactical/T20-order-feel.js', group: 'orders', anchors: ['fldResolveOrderGesture', 'fldOrderQueueAdvance'] },
  { path: 'src/tactical/T21-visual-fidelity.js', group: 'render-3d', anchors: ['fldVfSyncUnit'] },
  { path: 'src/tactical/T22-terrain-readability.js', group: 'render-3d', anchors: ['fldTrBuild3d', 'fldTrDrawGround2d'] },
  { path: 'src/tactical/T24-formation-figures.js', group: 'render-3d', anchors: ['fldFfSyncUnit', 'fldFfLayout'] },
  { path: 'src/tactical/T26-attacker-parity.js', group: 'ai-step', anchors: ['fldParityAiUnit', 'fldParityRecompute'] },
  { path: 'src/tactical/T27-llm-commander.js', group: 'ai-step', anchors: ['fldLlmCycle', 'fldLlmAiUnit'] },
  { path: 'src/tactical/T28-llm-connector.js', group: 'ui-network-opt-in', anchors: ['fldLlmDispatchAsync', 'fldLlmArmOnLaunch'] }
];

function countMatches(text, re) {
  const m = text.match(re);
  return m ? m.length : 0;
}

function lineOf(text, needle) {
  const idx = text.indexOf(needle);
  if (idx < 0) return null;
  return text.slice(0, idx).split(/\r?\n/).length;
}

function functionNames(text) {
  const names = [];
  const re = /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = re.exec(text))) names.push(m[1]);
  return names;
}

function profileFile(row) {
  const file = join(ROOT, row.path);
  if (!existsSync(file)) {
    return { path: row.path, group: row.group, missing: true, anchors: row.anchors.map(name => ({ name, line: null })) };
  }
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const names = functionNames(text);
  const anchors = row.anchors.map(name => ({
    name,
    line: lineOf(text, 'function ' + name + '('),
    present: text.includes('function ' + name + '(')
  }));
  return {
    path: row.path,
    group: row.group,
    bytes: statSync(file).size,
    lines: lines.length,
    functions: names.length,
    loops: countMatches(text, /\b(for|while)\s*\(/g),
    animationCalls: countMatches(text, /\brequestAnimationFrame\s*\(/g),
    timerCalls: countMatches(text, /\b(setTimeout|setInterval)\s*\(/g),
    threeRefs: countMatches(text, /\bTHREE\./g),
    instancedMeshRefs: countMatches(text, /\bInstancedMesh\b/g),
    disposeRefs: countMatches(text, /\.dispose\s*\(/g),
    storageRefs: countMatches(text, /\blocalStorage\b/g),
    fetchRefs: countMatches(text, /\bfetch\s*\(/g),
    anchors
  };
}

export function collectHotpathProfile() {
  const files = HOTPATH_FILES.map(profileFile);
  const groups = {};
  for (const row of files) {
    const g = groups[row.group] || { files: 0, bytes: 0, lines: 0, functions: 0, loops: 0, threeRefs: 0, instancedMeshRefs: 0, disposeRefs: 0, fetchRefs: 0 };
    g.files++;
    for (const key of ['bytes', 'lines', 'functions', 'loops', 'threeRefs', 'instancedMeshRefs', 'disposeRefs', 'fetchRefs']) {
      g[key] += Number(row[key] || 0);
    }
    groups[row.group] = g;
  }
  const missingAnchors = [];
  for (const row of files) {
    for (const anchor of row.anchors || []) {
      if (!anchor.present) missingAnchors.push(row.path + '#' + anchor.name);
    }
  }
  const totals = {
    files: files.length,
    bytes: files.reduce((sum, row) => sum + Number(row.bytes || 0), 0),
    lines: files.reduce((sum, row) => sum + Number(row.lines || 0), 0),
    functions: files.reduce((sum, row) => sum + Number(row.functions || 0), 0),
    loops: files.reduce((sum, row) => sum + Number(row.loops || 0), 0),
    threeRefs: files.reduce((sum, row) => sum + Number(row.threeRefs || 0), 0),
    instancedMeshRefs: files.reduce((sum, row) => sum + Number(row.instancedMeshRefs || 0), 0),
    disposeRefs: files.reduce((sum, row) => sum + Number(row.disposeRefs || 0), 0),
    fetchRefs: files.reduce((sum, row) => sum + Number(row.fetchRefs || 0), 0),
    storageRefs: files.reduce((sum, row) => sum + Number(row.storageRefs || 0), 0)
  };
  return {
    generatedAt: new Date().toISOString(),
    note: 'Static source profile only; use browser probes for runtime timing and pageerrors.',
    totals,
    groups,
    largestFiles: files.slice().sort((a, b) => Number(b.bytes || 0) - Number(a.bytes || 0)).slice(0, 8).map(row => ({ path: row.path, bytes: row.bytes, lines: row.lines })),
    missingFiles: files.filter(row => row.missing).map(row => row.path),
    missingAnchors,
    files
  };
}

export function writeHotpathProfile(outFile = join(OUT, 'hotpath-profile.json')) {
  mkdirSync(dirname(outFile), { recursive: true });
  const profile = collectHotpathProfile();
  writeFileSync(outFile, JSON.stringify(profile, null, 2));
  return profile;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const out = process.argv[2] ? resolve(process.argv[2]) : join(OUT, 'hotpath-profile.json');
  const profile = writeHotpathProfile(out);
  console.log('hotpath-profile files=' + profile.totals.files + ' lines=' + profile.totals.lines + ' functions=' + profile.totals.functions + ' out=' + out.replace(ROOT + '/', ''));
}
