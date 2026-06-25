#!/usr/bin/env node
/* ============================================================================
   source-arms-imagery.mjs — one-time PD sourcing for the H1 weapons/artillery
   imagery (D134). For each weapon/artillery model the game uses, query the
   Wikimedia Commons API, keep ONLY public-domain raster images, prefer a clean
   transparent cutout / Smithsonian-NMAH studio shot, download the best into
   assets/<category>/<id>.<ext>, and record full provenance (file, URL, licence,
   museum/artist, period-accuracy note) to assets/arms-imagery-provenance.json.

   PD discipline: an image is kept ONLY if the Commons extmetadata LicenseShortName
   is a public-domain form (Public domain / PD-* / CC0). That is corroborated by the
   age basis (every model is an 1840s-60s design; the photographs are Smithsonian/
   museum studio shots released PD/CC0). Anything that does not return a clean PD
   raster is left for manual review (printed to stderr as an EDGE CASE), never guessed.

   Usage:  node tools/source-arms-imagery.mjs            # all
           node tools/source-arms-imagery.mjs springfield napoleon   # a subset
   Re-runnable; overwrites the chosen files + merges provenance.
   ========================================================================== */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'CivilWarTeachingGame/1.0 (personal teaching project; adhanke@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

// id, category, search query, period-accuracy note (the teaching/anachronism basis).
const ITEMS = [
  // ---- small arms ----
  ['springfield', 'weapons', 'Springfield Model 1861 Rifle Musket', 'The standard U.S. infantry rifle-musket, .58 cal; most-produced Union long arm.'],
  ['enfield', 'weapons', 'Pattern 1853 Enfield rifle musket', 'The .577 British import, the second-most-common infantry arm on BOTH sides.'],
  ['sharps', 'weapons', 'Sharps rifle Model 1859', 'The breech-loading Sharps, issued to U.S. Sharpshooters and cavalry.'],
  ['spencer', 'weapons', 'Spencer repeating rifle', 'The 7-shot lever repeater, a Union late-war advantage.'],
  ['henry', 'weapons', 'Henry rifle 1860', 'The 16-shot Henry repeater ("that damned Yankee rifle"), privately bought.'],
  ['colt', 'weapons', 'Colt Model 1855 revolving rifle', 'The Colt revolving rifle, issued in limited numbers (e.g. Berdan\'s).'],
  ['lorenz', 'weapons', 'Lorenz Model 1854 rifle musket', 'The Austrian .54 Lorenz, imported in huge numbers by both sides.'],
  ['richmond', 'weapons', 'Richmond rifle musket Confederate', 'The Confederate Richmond Armory copy of the Springfield, on captured Harpers Ferry machinery.'],
  ['smoothbore', 'weapons', 'Springfield Model 1842 musket', 'The .69 smoothbore Model 1842, the obsolescent arm of early-war second-line troops.'],
  // ---- field artillery ----
  ['napoleon', 'artillery', '12-pounder Napoleon Model 1857 gun', 'The bronze 12-pdr Napoleon smoothbore, the war\'s dominant field gun.'],
  ['parrott10', 'artillery', '10-pounder Parrott rifle cannon', 'The 10-pdr Parrott, an iron rifled gun with its distinctive breech band.'],
  ['ordnance3in', 'artillery', '3-inch Ordnance Rifle cannon', 'The 3-inch wrought-iron Ordnance Rifle, prized for accuracy and reliability.'],
  ['howitzer12', 'artillery', '12-pounder field howitzer Model 1841', 'The 12-pdr field howitzer, a short-range shell/canister piece.'],
  ['whitworth', 'artillery', 'Whitworth rifle cannon breech loading', 'The British Whitworth hexagonal-bore rifle, a long-range Confederate import.'],
];

// Exact-file PINS for items where a tuned search did not surface the best PD raster (photos of
// surviving 3D guns usually carry the photographer's CC-BY copyright; these are PD PERIOD images).
const PINS = {
  napoleon: 'File:Light 12-pounder Napoleon gun, brass, Rappahannock.jpg',
  whitworth: 'File:12inchWhitworthRifle.jpg',
  // henry: the Smithsonian-NMAH transparent cutout (the first search hit was a museum JPG that rendered
  // as an opaque box on the card — bug-hunt FINDER#6; this cutout matches the other 6 small-arms).
  henry: 'File:NMAH-2004-26295-12 transparent.png',
  // howitzer12: intentionally NOT pinned — no clean PD period image of the Model 1841 12-pdr field
  // howitzer was found (only CC-BY park photos, a mountain-howitzer of the wrong model, or unverifiable
  // generic shots). Per the anti-anachronism standard the card renders WITHOUT a photo (guarded fallback).
};

const PD_RE = /public domain|^pd|pd-|cc0|no known copyright|公有领域/i;
function isPdLicense(em) {
  const ls = ((em.LicenseShortName || {}).value || '');
  const lic = ((em.License || {}).value || '');
  const terms = ((em.UsageTerms || {}).value || '');
  return PD_RE.test(ls) || PD_RE.test(lic) || PD_RE.test(terms);
}
function strip(s) { return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

async function apiSearch(query) {
  const u = new URL(API);
  u.search = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search',
    gsrsearch: query, gsrnamespace: '6', gsrlimit: '12',
    prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size',
  }).toString();
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('API ' + r.status);
  const j = await r.json();
  const pages = (j.query && j.query.pages) || {};
  return Object.keys(pages).map(k => pages[k]);
}

function scoreCandidate(pg) {
  const ii = (pg.imageinfo || [])[0] || {};
  const em = ii.extmetadata || {};
  const title = pg.title || '';
  const mime = ii.mime || '';
  if (!isPdLicense(em)) return null;
  if (!/^image\/(jpeg|png)$/.test(mime)) return null;     // photos only (skip svg/diagram)
  const w = ii.width || 0, h = ii.height || 0;
  if (w < 200 || h < 120) return null;
  let s = 0;
  if (/transparent|cutout|no background|\bclear\b/i.test(title)) s += 50;   // clean cutout is ideal on a card
  if (/NMAH|Smithsonian|National Museum|Metropolitan|Met Museum|Royal Armouries|West Point/i.test(strip((em.Artist || {}).value) + ' ' + title)) s += 30;
  if (mime === 'image/png') s += 8;                                          // png often = cutout
  if (w >= 800) s += 10; if (w >= 1500) s += 6;
  if (/replica|reproduction|reenact|airsoft|drawing|diagram|patent|sketch/i.test(title)) s -= 60;
  if (/ammunition|cartridge|bullet|bayonet only|lock plate|detail|close-?up|stamp|marking/i.test(title)) s -= 25;
  return { pg, ii, em, title, mime, w, h, score: s };
}

async function apiTitle(title) {
  const u = new URL(API);
  u.search = new URLSearchParams({
    action: 'query', format: 'json', titles: title,
    prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size',
  }).toString();
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('API ' + r.status);
  const j = await r.json();
  const pages = (j.query && j.query.pages) || {};
  return Object.keys(pages).map(k => pages[k]);
}

async function sourceOne(item) {
  const [id, cat, query, note] = item;
  let scored;
  if (PINS[id]) {
    let pages = [];
    try { pages = await apiTitle(PINS[id]); } catch (e) { return { id, cat, note, error: 'pin fetch failed: ' + e.message }; }
    scored = pages.map(scoreCandidate).filter(Boolean);
    if (!scored.length) return { id, cat, note, error: 'PINNED file is not a PD raster: ' + PINS[id] };
  } else {
    let cands = [];
    try { cands = await apiSearch(query); } catch (e) { return { id, cat, note, error: 'search failed: ' + e.message }; }
    scored = cands.map(scoreCandidate).filter(Boolean).sort((a, b) => b.score - a.score);
  }
  if (!scored.length) return { id, cat, note, error: 'no PD raster candidate' };
  const best = scored[0];
  const ext = best.mime === 'image/png' ? '.png' : '.jpg';
  const outDir = join(ROOT, 'assets', cat); mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, id + ext);
  let bytes = 0;
  try {
    const r = await fetch(best.ii.url, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error('download ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(outPath, buf); bytes = buf.length;
  } catch (e) { return { id, cat, note, error: 'download failed: ' + e.message, file: best.title }; }
  return {
    id, cat, note,
    file: best.title,
    sourceUrl: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(best.title),
    imageUrl: best.ii.url,
    license: strip((best.em.LicenseShortName || {}).value) || 'Public domain',
    artist: strip((best.em.Artist || {}).value).slice(0, 120),
    credit: strip((best.em.Credit || {}).value).slice(0, 120),
    mime: best.mime, w: best.w, h: best.h, bytes,
    savedAs: 'assets/' + cat + '/' + id + ext,
    altCandidates: scored.slice(1, 4).map(s => s.title),
  };
}

async function main() {
  const only = process.argv.slice(2);
  const items = only.length ? ITEMS.filter(i => only.includes(i[0])) : ITEMS;
  const provPath = join(ROOT, 'assets', 'arms-imagery-provenance.json');
  let prov = {}; if (existsSync(provPath)) { try { prov = JSON.parse(readFileSync(provPath, 'utf8')); } catch (e) {} }
  const edge = [];
  for (const it of items) {
    const r = await sourceOne(it);
    if (r.error) { edge.push(r); console.error('  EDGE CASE [' + r.id + ']: ' + r.error + (r.file ? ' (best="' + r.file + '")' : '')); continue; }
    prov[r.id] = r;
    console.log('  [' + r.id + '] ' + r.savedAs + '  (' + (r.bytes / 1024).toFixed(0) + 'KB ' + r.w + 'x' + r.h + ', ' + r.license + ', ' + (r.artist || r.credit || '?').slice(0, 40) + ')');
  }
  writeFileSync(provPath, JSON.stringify(prov, null, 2));
  console.log('\nWROTE ' + Object.keys(prov).length + ' provenance records -> assets/arms-imagery-provenance.json');
  if (edge.length) { console.log('\n' + edge.length + ' EDGE CASE(S) NEED MANUAL REVIEW: ' + edge.map(e => e.id).join(', ')); process.exitCode = 3; }
  console.log('NEXT: review the picks, then node tools/prep-embed-assets.mjs && node tools/build.mjs');
}
main();
