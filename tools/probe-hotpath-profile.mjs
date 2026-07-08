#!/usr/bin/env node
// Focused gate for the static hotpath profile/readback artifact.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectHotpathProfile } from './profile-hotpaths.mjs';

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

const profile = collectHotpathProfile();

step('declared tactical hotpath files are present', () => {
  if (profile.missingFiles.length) throw new Error('missing files: ' + profile.missingFiles.join(', '));
  if (profile.totals.files !== 12) throw new Error('expected 12 hotpath files, saw ' + profile.totals.files);
  return { files: profile.totals.files, lines: profile.totals.lines, bytes: profile.totals.bytes };
});

step('anchor functions are visible for future profiling', () => {
  if (profile.missingAnchors.length) throw new Error('missing anchors: ' + profile.missingAnchors.join(', '));
  const t0 = profile.files.find(row => row.path === 'src/tactical/T0-field-sandbox.js');
  if (!t0 || t0.anchors.filter(a => a.present).length < 5) throw new Error('T0 core anchors incomplete');
  return { anchors: profile.files.reduce((sum, row) => sum + row.anchors.length, 0) };
});

step('profile covers render, sim, order, and AI groups', () => {
  for (const group of ['core-field', 'battle-step', 'render-3d', 'orders', 'ai-step', 'ui-network-opt-in']) {
    if (!profile.groups[group] || profile.groups[group].files < 1) throw new Error('missing group ' + group);
  }
  return profile.groups;
});

step('static complexity metrics are non-vacuous', () => {
  if (profile.totals.functions < 120) throw new Error('too few functions counted: ' + profile.totals.functions);
  if (profile.totals.loops < 40) throw new Error('too few loop sites counted: ' + profile.totals.loops);
  if ((profile.groups['render-3d'] || {}).functions < 50) throw new Error('render-3d group is too thin: ' + JSON.stringify(profile.groups['render-3d'] || {}));
  if (profile.totals.instancedMeshRefs < 5) throw new Error('too few instancing references counted: ' + profile.totals.instancedMeshRefs);
  if (profile.totals.disposeRefs < 20) throw new Error('too few dispose references counted: ' + profile.totals.disposeRefs);
  return profile.totals;
});

step('network readback remains isolated to the opt-in connector surface', () => {
  const fetchFiles = profile.files.filter(row => row.fetchRefs > 0).map(row => row.path);
  if (fetchFiles.length !== 1 || fetchFiles[0] !== 'src/tactical/T28-llm-connector.js') throw new Error('unexpected fetch refs: ' + fetchFiles.join(', '));
  return { fetchFiles, fetchRefs: profile.totals.fetchRefs };
});

step('profile artifact is serializable and reusable', () => {
  const outFile = join(OUT, 'hotpath-profile.json');
  writeFileSync(outFile, JSON.stringify(profile, null, 2));
  const reread = JSON.parse(readFileSync(outFile, 'utf8'));
  if (!reread.totals || reread.totals.lines !== profile.totals.lines) throw new Error('artifact readback mismatch');
  return { artifact: 'tools/shots/hotpath-profile.json', lines: reread.totals.lines };
});

const ok = steps.every(s => s.ok);
const out = {
  ok,
  passed: steps.filter(s => s.ok).length,
  total: steps.length,
  metrics: profile.totals,
  groups: profile.groups,
  largestFiles: profile.largestFiles,
  steps
};
writeFileSync(join(OUT, 'probe-hotpath-profile.json'), JSON.stringify(out, null, 2));
console.log('probe-hotpath-profile ok=' + ok + ' steps=' + out.passed + '/' + out.total + ' lines=' + profile.totals.lines + ' functions=' + profile.totals.functions);
for (const s of steps) if (!s.ok) console.log('  FAIL ' + s.name + ' :: ' + s.error);
if (!ok) process.exit(1);
