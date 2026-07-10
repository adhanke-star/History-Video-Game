#!/usr/bin/env node
// E69 guard: every audited HTML report uses the shared entity escaper, and
// hostile data remains inert text in both element and quoted-attribute contexts.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFragment } from 'parse5';
import { escapeHtml } from './report-html-escape.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(__dirname, 'shots');
mkdirSync(OUT, { recursive: true });

const DIAGNOSTIC_IDENTITY_ESCAPE = process.argv.includes('--diagnostic-identity-escape');
const candidateEscape = DIAGNOSTIC_IDENTITY_ESCAPE
  ? (value => String(value == null ? '' : value))
  : escapeHtml;

const TARGETS = [
  'tools/validate-data-schemas.mjs',
  'tools/check-orphan-assets.mjs',
  'tools/summarize-probe-logs.mjs',
  'tools/report-media-budget.mjs',
  'tools/report-group6-dashboard.mjs'
];

const HOSTILE = [
  '&<>"\'',
  '</td></tr><script>globalThis.__e69 = 1</script><tr><td>',
  '<img src=x onerror="globalThis.__e69 = 2">',
  '<svg><a href="javascript:globalThis.__e69=3">x</a></svg>',
  '" autofocus onfocus="globalThis.__e69 = 4" data-x="',
  "' onmouseover='globalThis.__e69 = 5' data-y='",
  '&lt;script&gt;already-entity'
];

const result = {
  ok: true,
  diagnosticIdentityEscape: DIAGNOSTIC_IDENTITY_ESCAPE,
  targets: TARGETS.slice(),
  fixtures: [],
  steps: [],
  pageerrors: []
};

function step(name, fn) {
  try {
    const detail = fn();
    result.steps.push({ name, ok: true, detail: detail === undefined ? null : detail });
  } catch (error) {
    result.ok = false;
    result.steps.push({ name, ok: false, error: String(error && error.message || error) });
  }
}

step('shared helper emits all five reserved-character entities in safe order', () => {
  const actual = candidateEscape('&<>"\'');
  const expected = '&amp;&lt;&gt;&quot;&#39;';
  if (actual !== expected) throw new Error('actual=' + actual + ' expected=' + expected);
  return { actual };
});

step('shared helper normalizes nullish report values to blank text', () => {
  const values = [candidateEscape(null), candidateEscape(undefined), candidateEscape(0), candidateEscape(false)];
  if (values[0] !== '' || values[1] !== '' || values[2] !== '0' || values[3] !== 'false') {
    throw new Error('nullish/primitive normalization=' + JSON.stringify(values));
  }
  return { values };
});

step('all five audited report tools import and use the one shared helper', () => {
  const coverage = [];
  const brokenIdentityLiterals = [
    ".replace(/&/g, '&')", ".replace(/</g, '<')", ".replace(/>/g, '>')", ".replace(/\"/g, '\"')",
    ".replace(/[&]/g, '&')", ".replace(/[<]/g, '<')", ".replace(/[>]/g, '>')", ".replace(/[\"]/g, '\"')"
  ];
  for (const rel of TARGETS) {
    const text = readFileSync(join(ROOT, rel), 'utf8');
    const imported = /import\s*\{\s*escapeHtml\s*\}\s*from\s*['"]\.\/report-html-escape\.mjs['"]/.test(text);
    const uses = (text.match(/\bescapeHtml\s*\(/g) || []).length;
    const localHelper = /function\s+(?:htmlEscape|esc)\s*\(/.test(text);
    const identity = brokenIdentityLiterals.filter(literal => text.includes(literal));
    coverage.push({ rel, imported, uses, localHelper, identity });
    if (!imported || uses < 1 || localHelper || identity.length) {
      throw new Error(rel + ' routing=' + JSON.stringify(coverage[coverage.length - 1]));
    }
  }
  return coverage;
});

step('hostile fixtures round-trip only as text in element and quoted-attribute contexts', () => {
  for (const hostile of HOSTILE) {
    const escaped = candidateEscape(hostile);
    const markup = '<!doctype html><table><tbody><tr><td id="fixture" data-hostile="' + escaped + '">' + escaped + '</td></tr></tbody></table>';
    const doc = parseFragment(markup);
    const forbiddenTags = new Set(['script', 'img', 'svg', 'iframe', 'object', 'embed', 'style', 'link', 'meta']);
    let cell = null;
    let forbiddenNodes = 0;
    let eventAttrs = 0;
    function walk(node) {
      if (node && node.tagName) {
        if (forbiddenTags.has(node.tagName)) forbiddenNodes++;
        for (const attr of node.attrs || []) {
          if (/^on/i.test(attr.name)) eventAttrs++;
          if (attr.name === 'id' && attr.value === 'fixture') cell = node;
        }
      }
      for (const child of node && node.childNodes || []) walk(child);
    }
    function textContent(node) {
      if (!node) return '';
      if (node.nodeName === '#text') return node.value || '';
      return (node.childNodes || []).map(textContent).join('');
    }
    walk(doc);
    const hostileAttr = cell && (cell.attrs || []).find(attr => attr.name === 'data-hostile');
    const fixture = {
      hostile,
      escaped,
      textRoundTrip: !!cell && textContent(cell) === hostile,
      attributeRoundTrip: !!hostileAttr && hostileAttr.value === hostile,
      forbiddenNodes,
      eventAttrs
    };
    result.fixtures.push(fixture);
    if (!fixture.textRoundTrip || !fixture.attributeRoundTrip || forbiddenNodes || eventAttrs) {
      throw new Error(JSON.stringify(fixture));
    }
  }
  return { fixtures: result.fixtures.length, forbiddenNodes: 0, eventAttrs: 0 };
});

result.passed = result.steps.filter(item => item.ok).length;
result.total = result.steps.length;
writeFileSync(join(OUT, 'probe-report-html-escaping.json'), JSON.stringify(result, null, 2));
console.log('probe-report-html-escaping ok=' + result.ok + ' (' + result.passed + '/' + result.total + ')');
for (const item of result.steps) {
  console.log((item.ok ? '  ok   ' : '  FAIL ') + item.name + (item.error ? ' :: ' + item.error : ''));
}
process.exit(result.ok ? 0 : 1);
