#!/usr/bin/env node
/* ============================================================================
   source-usct-imagery.mjs — one-time PD sourcing for the H1 USCT imagery (D135).
   Sibling of tools/source-arms-imagery.mjs. For each USCT-cluster CODEX entry the
   game teaches, fetch a famous public-domain photograph/engraving from the
   Wikimedia Commons API, keep ONLY a PD raster, download it to assets/usct/<id>.<ext>
   (id = the codex entry id, so the runtime keys __ASSETS["usct/<id>"] trivially),
   and record full provenance (file, URL, licence, artist/credit, caption, alt,
   period-accuracy note) to assets/usct-imagery-provenance.json.

   Unlike the arms cutouts (which are DECORATIVE — the gun's name is printed beside
   them), these are INFORMATIVE historical photographs woven into teaching cards, so
   the provenance carries a real descriptive `alt` + a visible `caption` + a `credit`
   (the holding institution) the runtime renders as a <figcaption>.

   PD discipline (Aaron's "hands-off, edge-cases only", D134): an image is kept ONLY
   if the Commons extmetadata LicenseShortName is a public-domain form. That is
   corroborated by the age basis — every item is an 1863-69 photograph / an 1864
   Harper's Weekly engraving / an 1863 recruitment broadside, all published before
   1929 (PD by age) and most are Library-of-Congress / federal works. Anything that
   does not return a clean PD raster is printed as an EDGE CASE, never guessed.

   Usage:  node tools/source-usct-imagery.mjs            # all
           node tools/source-usct-imagery.mjs united-states-colored-troops
   Re-runnable; overwrites the chosen files + merges provenance.
   ========================================================================== */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'CivilWarTeachingGame/1.0 (personal teaching project; adhanke@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

/* id (= codex entry id) · search query · caption (visible) · alt (SR) · period note. */
const ITEMS = [
  ['united-states-colored-troops', 'Company E 4th United States Colored Infantry Fort Lincoln',
    'Company E, 4th U.S. Colored Infantry, at Fort Lincoln in the defenses of Washington, c.1864.',
    'A full company of Black Union soldiers of the 4th U.S. Colored Infantry standing at attention in two ranks before a fort, c.1864.',
    'A genuine 1864 photograph of a USCT company in the field — period-accurate to the war.'],
  ['54th-massachusetts-infantry', 'William Harvey Carney with flag',
    'Sgt. William H. Carney, 54th Massachusetts — the first Black soldier whose deeds earned the Medal of Honor, holding the regimental colors he saved at Fort Wagner.',
    'Sergeant William H. Carney in uniform holding the United States flag he carried at the assault on Fort Wagner.',
    'A wartime portrait of the 54th Massachusetts color-sergeant — period-accurate.'],
  ['robert-gould-shaw', 'Robert Gould Shaw Union colonel 54th Massachusetts',
    'Col. Robert Gould Shaw, the abolitionist-born commander of the 54th Massachusetts, killed leading its assault on Battery Wagner, July 18, 1863.',
    'A seated portrait photograph of the young Union colonel Robert Gould Shaw in his uniform and kepi.',
    'A wartime portrait of the 54th Massachusetts colonel — period-accurate.'],
  ['frederick-douglass', 'Frederick Douglass Merrill Crosby 1860s',
    'Frederick Douglass in the 1860s — the formerly enslaved abolitionist whose "Men of Color, To Arms!" helped raise the USCT.',
    'A formal portrait photograph of Frederick Douglass in the 1860s, seated in a suit.',
    'An 1860s portrait of the wartime abolitionist — period-accurate.'],
  ['harriet-tubman', 'Carte-de-visite portrait of Harriet Tubman cropped',
    'Harriet Tubman, who guided the 1863 Combahee River Raid that freed some 750 enslaved people — the first woman to lead a U.S. military operation.',
    'A carte-de-visite portrait photograph of Harriet Tubman seated, one arm resting on a chair back.',
    'Benjamin F. Powelson carte-de-visite, Auburn NY, c.1868-69 — a postwar studio portrait, made a few years after Tubman\'s wartime service.'],
  ['nathan-bedford-forrest', "The Massacre at Fort Pillow Harper's Weekly April 30 1864",
    'The Northern press depicts the massacre of surrendering U.S. Colored Troops at Fort Pillow, April 12, 1864 (Harper\'s Weekly, April 30, 1864).',
    'An 1864 Harper\'s Weekly engraving showing Confederate troops killing surrendering Black Union soldiers at Fort Pillow.',
    'A contemporary 1864 newspaper engraving condemning the atrocity — period source, anti-Lost-Cause.'],
  ['system-manpower-pool-usct', 'Come and Join Us Brothers United States Colored Troops recruitment',
    '"Come and Join Us Brothers" — an 1863 broadside of the Supervisory Committee for Recruiting Colored Regiments.',
    'An 1863 recruitment broadside showing Black Union soldiers in formation beside the flag, captioned "Come and Join Us Brothers".',
    'An 1863 recruitment poster — period-accurate.'],
];

/* Exact-file PINS chosen from a Commons API reconnaissance (each verified PD raster). */
const PINS = {
  'united-states-colored-troops': 'File:District of Columbia. Company E, 4th U.S. Colored Infantry, at Fort Lincoln LOC cwpb.04294.jpg',
  '54th-massachusetts-infantry': 'File:William Harvey Carney with flag.jpg',
  'robert-gould-shaw': 'File:Robert Gould Shaw.jpg',
  'frederick-douglass': 'File:Frederick Douglass by Merrill & Crosby, 1860s.jpg',
  'harriet-tubman': 'File:Carte-de-visite portrait of Harriet Tubman (cropped).jpg',
  'nathan-bedford-forrest': "File:The Massacre at Fort Pillow - unsigned - Harper's Weekly - issue of April 30, 1864 - page 284.jpg",
  'system-manpower-pool-usct': 'File:Come and Join Us Brothers, by the Supervisory Committee For Recruiting Colored Regiments.jpg',
};

const PD_RE = /public domain|^pd|pd-|cc0|no known copyright|no restrictions/i;
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

function scoreCandidate(pg) {
  const ii = (pg.imageinfo || [])[0] || {};
  const em = ii.extmetadata || {};
  const title = pg.title || '';
  const mime = ii.mime || '';
  if (!isPdLicense(em)) return null;
  if (!/^image\/(jpeg|png)$/.test(mime)) return null;
  const w = ii.width || 0, h = ii.height || 0;
  if (w < 300 || h < 300) return null;
  let s = 0;
  if (/LOC|Library of Congress|National Archives|NARA|Smithsonian/i.test(strip((em.Credit || {}).value) + ' ' + strip((em.Artist || {}).value) + ' ' + title)) s += 25;
  if (w >= 1200) s += 8;
  if (/replica|reproduction|reenact|memorial|statue|monument|2d, portrait/i.test(title)) s -= 10;
  return { pg, ii, em, title, mime, w, h, score: s };
}

async function sourceOne(item) {
  const [id, query, caption, alt, note] = item;
  let scored;
  if (PINS[id]) {
    let pages = [];
    try { pages = await apiTitle(PINS[id]); } catch (e) { return { id, error: 'pin fetch failed: ' + e.message }; }
    scored = pages.map(scoreCandidate).filter(Boolean);
    if (!scored.length) return { id, error: 'PINNED file is not a PD raster: ' + PINS[id] };
  } else {
    let cands = [];
    try { cands = await apiSearch(query); } catch (e) { return { id, error: 'search failed: ' + e.message }; }
    scored = cands.map(scoreCandidate).filter(Boolean).sort((a, b) => b.score - a.score);
  }
  if (!scored.length) return { id, error: 'no PD raster candidate' };
  const best = scored[0];
  const ext = best.mime === 'image/png' ? '.png' : '.jpg';
  const outDir = join(ROOT, 'assets', 'usct'); mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, id + ext);
  let bytes = 0;
  try {
    const r = await fetch(best.ii.url, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error('download ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(outPath, buf); bytes = buf.length;
  } catch (e) { return { id, error: 'download failed: ' + e.message, file: best.title }; }
  return {
    id, caption, alt, periodNote: note,
    file: best.title,
    sourceUrl: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(best.title),
    imageUrl: best.ii.url,
    license: strip((best.em.LicenseShortName || {}).value) || 'Public domain',
    artist: strip((best.em.Artist || {}).value).slice(0, 160),
    credit: strip((best.em.Credit || {}).value).slice(0, 160),
    mime: best.mime, w: best.w, h: best.h, bytes,
    savedAs: 'assets/usct/' + id + ext,
  };
}

async function main() {
  const only = process.argv.slice(2);
  const items = only.length ? ITEMS.filter(i => only.includes(i[0])) : ITEMS;
  const provPath = join(ROOT, 'assets', 'usct-imagery-provenance.json');
  let prov = {}; if (existsSync(provPath)) { try { prov = JSON.parse(readFileSync(provPath, 'utf8')); } catch (e) {} }
  const edge = [];
  for (const it of items) {
    const r = await sourceOne(it);
    if (r.error) { edge.push(r); console.error('  EDGE CASE [' + r.id + ']: ' + r.error + (r.file ? ' (best="' + r.file + '")' : '')); continue; }
    prov[r.id] = r;
    console.log('  [' + r.id + '] ' + r.savedAs + '  (' + (r.bytes / 1024).toFixed(0) + 'KB ' + r.w + 'x' + r.h + ', ' + r.license + ')');
  }
  writeFileSync(provPath, JSON.stringify(prov, null, 2));
  console.log('\nWROTE ' + Object.keys(prov).length + ' provenance records -> assets/usct-imagery-provenance.json');
  if (edge.length) { console.log('\n' + edge.length + ' EDGE CASE(S) NEED MANUAL REVIEW: ' + edge.map(e => e.id).join(', ')); process.exitCode = 3; }
  console.log('NEXT: VIEW each image, then add a `usct` category to tools/prep-embed-assets.mjs && node tools/prep-embed-assets.mjs && node tools/build.mjs');
}
main();
