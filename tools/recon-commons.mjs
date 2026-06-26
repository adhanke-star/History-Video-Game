#!/usr/bin/env node
/* Throwaway recon: list PD photo candidates for a Commons search query so a human can
   pick the exact File: title to PIN. Usage: node tools/recon-commons.mjs "query terms" */
const UA = 'CivilWarTeachingGame/1.0 (personal teaching project; adhanke@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';
const PD_RE = /public domain|^pd|pd-|cc0|no known copyright|no restrictions/i;
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
async function search(q) {
  const u = new URL(API);
  u.search = new URLSearchParams({ action: 'query', format: 'json', generator: 'search',
    gsrsearch: q, gsrnamespace: '6', gsrlimit: '24', prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size' }).toString();
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  const j = await r.json();
  const pages = (j.query && j.query.pages) || {};
  return Object.keys(pages).map(k => pages[k]);
}
const q = process.argv.slice(2).join(' ');
const rows = await search(q);
const out = [];
for (const pg of rows) {
  const ii = (pg.imageinfo || [])[0] || {}; const em = ii.extmetadata || {};
  const ls = strip((em.LicenseShortName || {}).value); const terms = strip((em.UsageTerms || {}).value);
  const pd = PD_RE.test(ls) || PD_RE.test(terms);
  if (!/^image\/(jpeg|png)$/.test(ii.mime || '')) continue;
  out.push({ title: pg.title, pd, lic: ls || terms, w: ii.width, h: ii.height, mime: ii.mime });
}
out.sort((a, b) => (b.pd - a.pd) || (b.w - a.w));
for (const r of out) console.log((r.pd ? 'PD ' : '.. ') + (r.w + 'x' + r.h).padEnd(11) + ' [' + (r.lic || '?') + ']  ' + r.title);
