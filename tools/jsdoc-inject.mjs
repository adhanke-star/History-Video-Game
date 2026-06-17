#!/usr/bin/env node
/**
 * tools/jsdoc-inject.mjs — Auto-generate JSDoc annotations for src/ modules.
 *
 * Scans all manifest modules and adds JSDoc stubs to functions that lack them.
 * Uses the four-function contract pattern to infer types:
 *   - *Init(C)          → @param {Campaign|null} C
 *   - *OnResolve(...)   → @param {string} winnerSide ... etc
 *   - *RenderHTML(C)    → @param {Campaign} C @returns {string}
 *   - *Wire(C)          → @param {Campaign} C
 *
 * Usage:
 *   node tools/jsdoc-inject.mjs           # dry-run (shows what would change)
 *   node tools/jsdoc-inject.mjs --write   # write changes to files
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'src');
const MANIFEST = join(SRC, '00-manifest.json');
const doWrite = process.argv.includes('--write');

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

// Pattern-based JSDoc templates
function inferJSDoc(fnName, params) {
  const paramStr = params.trim();
  const paramList = paramStr ? paramStr.split(/\s*,\s*/) : [];

  // Init functions
  if (/Init$/i.test(fnName)) {
    return `/**\n * Initialize the ${fnName.replace(/Init$/, '')} subsystem state.\n * Idempotent — safe to call multiple times.\n * @param {import('./types').Campaign | null} C\n */`;
  }
  // OnResolve functions
  if (/OnResolve$/i.test(fnName)) {
    return `/**\n * Per-battle tick for the ${fnName.replace(/OnResolve$/, '')} subsystem.\n * @param {'US'|'CS'} winnerSide\n * @param {string} type - Battle outcome type.\n * @param {object} B - Battle descriptor.\n * @param {import('./types').Campaign | null} C\n * @param {boolean} win - Whether the player's side won.\n */`;
  }
  // Render functions
  if (/Render|HTML$/i.test(fnName) && !fnName.startsWith('_')) {
    const retDoc = ' * @returns {string} HTML string.';
    if (paramList.length === 1) {
      return `/**\n * Render the ${fnName.replace(/Render.*$|HTML$/, '')} UI section.\n * @param {import('./types').Campaign} C\n${retDoc}\n */`;
    }
    return `/**\n * Render ${fnName} UI.\n${paramList.map(p => ` * @param {*} ${p}`).join('\n')}\n${retDoc}\n */`;
  }
  // Wire functions
  if (/Wire$/i.test(fnName) && !fnName.startsWith('_')) {
    return `/**\n * Wire DOM event listeners for the ${fnName.replace(/Wire.*$/, '')} UI.\n * @param {import('./types').Campaign} C\n */`;
  }
  // Score/compute functions
  if (/Score|Compute|Momentum|Leadership/i.test(fnName) && !fnName.startsWith('_')) {
    return `/**\n * Compute ${fnName.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}.\n${paramList.map(p => ` * @param {*} ${p}`).join('\n')}\n * @returns {number}\n */`;
  }
  // Buy functions
  if (/Buy$/i.test(fnName) && !fnName.startsWith('_')) {
    return `/**\n * Purchase/upgrade action for ${fnName.replace(/Buy$/, '')}.\n${paramList.map(p => ` * @param {*} ${p}`).join('\n')}\n */`;
  }
  // General public function
  if (!fnName.startsWith('_') && paramList.length > 0) {
    return `/**\n * ${fnName}.\n${paramList.map(p => ` * @param {*} ${p}`).join('\n')}\n */`;
  }

  return null; // skip private or parameterless functions
}

let totalAdded = 0;

for (const mod of manifest.modules) {
  const filepath = join(SRC, mod);
  const code = readFileSync(filepath, 'utf8');
  const lines = code.split('\n');
  const insertions = []; // { beforeLine: number, jsdoc: string }

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
    if (!match) continue;

    const [, fnName, params] = match;

    // Check if preceding lines already have JSDoc
    let hasDoc = false;
    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      if (lines[j].trim() === '*/') { hasDoc = true; break; }
      if (lines[j].trim() === '' || lines[j].trim().startsWith('/*') || lines[j].trim().startsWith('//')) continue;
      break;
    }
    if (hasDoc) continue;

    const jsdoc = inferJSDoc(fnName, params);
    if (jsdoc) {
      insertions.push({ beforeLine: i, jsdoc });
    }
  }

  if (insertions.length === 0) continue;

  totalAdded += insertions.length;
  console.log(`${mod}: +${insertions.length} JSDoc annotations`);

  if (doWrite) {
    // Insert from bottom to top to preserve line numbers
    const result = [...lines];
    for (let k = insertions.length - 1; k >= 0; k--) {
      const ins = insertions[k];
      result.splice(ins.beforeLine, 0, ins.jsdoc);
    }
    writeFileSync(filepath, result.join('\n'));
  }
}

console.log(`\nTotal: ${totalAdded} JSDoc annotations ${doWrite ? 'WRITTEN' : '(dry-run, use --write to apply)'}`);
