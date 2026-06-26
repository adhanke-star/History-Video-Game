#!/usr/bin/env node
/* ============================================================================
   source-scenes-imagery.mjs — one-time PD sourcing for the H1 BATTLE-SCENE imagery
   (D137). Sibling of tools/source-leaders-imagery.mjs / source-usct-imagery.mjs /
   source-arms-imagery.mjs. For each MARQUEE playable battle the game fights, fetch a
   famous public-domain WARTIME photograph of the ACTUAL FIELD (Gardner / O'Sullivan /
   Barnard / Russell / Gibson — Library of Congress / National Archives) from the
   Wikimedia Commons API, keep ONLY a PD raster, download it to assets/scenes/<id>.<ext>
   (id = the campaign BATTLE id, so the runtime keys __ASSETS["scenes/<id>"] trivially),
   and record full provenance (file, URL, licence, artist/credit, caption, alt,
   period-accuracy note) to assets/scenes-imagery-provenance.json.

   These photographs head the PRE-BATTLE BRIEFING (bridgeBriefingHTML in
   src/85-battle-bridge.js): the player sees the real ground before they fight on it.
   They are INFORMATIVE / TEACHING images (like the USCT + leaders sets, NOT decorative
   like the arms cutouts), so the provenance carries a real descriptive `alt` + a
   visible `caption` + a `credit` (the holding institution) the runtime renders as a
   <figcaption>.

   DIGNITY-SENSITIVE (the D135 Fort-Pillow precedent). Many of the only period
   photographs of these fields are Gardner's "Dead of Antietam" and O'Sullivan's
   "Harvest of Death" — the first photographs of American dead ever shown to the
   public. We choose them deliberately and frame them honestly: the captions name the
   cost of the war plainly, name slavery as its cause where the field warrants it
   (anti-Lost-Cause), and never glorify. We match the RIGHT plate to the RIGHT field
   (no staging the dead of one battle onto another) and VIEW each before embed.

   PD discipline (Aaron's "hands-off, edge-cases only", D134): an image is kept ONLY if
   the Commons extmetadata LicenseShortName is a public-domain form. Corroborated by
   the age basis — every plate is an 1861-1865 federal/contract photograph (published
   before 1929 -> PD by age), most Library-of-Congress / NARA. The scorer favours a
   genuine PERIOD PHOTOGRAPH and penalises paintings / engravings / maps / monuments /
   reenactments / postwar dates so a bronze tablet or a 1900 lithograph never wins (the
   D134 "ordnance3in = a modern monument photo" lesson). Several of these fields have
   NO clean period photograph (Shiloh, Chickamauga, Malvern Hill were not photographed
   during or just after the fighting) — those surface as EDGE CASES and stay imageless +
   documented, never guessed (accuracy over coverage).

   Usage:  node tools/source-scenes-imagery.mjs            # all
           node tools/source-scenes-imagery.mjs antietam
   Re-runnable; overwrites the chosen files + merges provenance.
   ========================================================================== */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'CivilWarTeachingGame/1.0 (personal teaching project; adhanke@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

/* id (= campaign battle id) · search query · caption (visible, citation-grade, anti-Lost-
   Cause, dignity-aware) · alt (SR) · period note. The 9 MARQUEE playable tactical ids. */
const ITEMS = [
  ['bullrun1', 'Bull Run Manassas Sudley Ford 1862 Barnard photograph Virginia',
    'Sudley Ford on Bull Run, where McDowell\'s flanking column crossed to open the first great battle of the war in July 1861 — a Union rout that taught the North the war would be long.',
    'A wartime photograph of Sudley Ford on Bull Run near Manassas, Virginia, with a stone ford crossing, a soldier, a wagon, and a house on the hill beyond.',
    'A wartime Library-of-Congress photograph of Sudley Ford, the crossing of McDowell\'s flank column at First Bull Run.'],
  ['shiloh', 'Shiloh battlefield Tennessee 1862 photograph Pittsburg Landing',
    'Pittsburg Landing on the Tennessee River, the Union base at Shiloh — two days of carnage in April 1862 that ended the illusion of a short war.',
    'A wartime photograph of Pittsburg Landing on the Tennessee River, the Union supply base at the Battle of Shiloh.',
    'Period photographs of the Shiloh field itself are scarce; Pittsburg Landing is the documented wartime view.'],
  ['malvern', 'Malvern Hill 1862 battlefield Virginia photograph Gardner Peninsula',
    'Malvern Hill, where massed Union artillery shattered Lee\'s assaults on July 1, 1862 — the last of the Seven Days\' Battles.',
    'A wartime photograph of the Malvern Hill battlefield in Virginia.',
    'The Peninsula fields were photographed by Gardner and Gibson in 1862.'],
  ['antietam', 'Antietam 1862 Confederate dead Bloody Lane Sunken Road Gardner photograph',
    'Confederate dead along the Sunken Road ("Bloody Lane") at Antietam, photographed by Alexander Gardner days after September 17, 1862 — the bloodiest day in American history, and among the first photographs of the American dead ever shown to the public.',
    'A wartime photograph of Confederate soldiers lying dead along the Sunken Road at the Antietam battlefield.',
    'Alexander Gardner / James Gibson, "The Dead of Antietam," September 1862 — genuine field photographs of the battle\'s aftermath.'],
  ['fredericksburg', 'Fredericksburg Virginia pontoon bridge Rappahannock 1862 photograph Russell',
    'Union pontoon bridges across the Rappahannock at Fredericksburg, December 1862 — Burnside\'s army crossed here to be slaughtered in futile charges against the stone wall at Marye\'s Heights.',
    'A wartime photograph of Union pontoon bridges spanning the Rappahannock River at Fredericksburg, Virginia.',
    'Photographed during the Fredericksburg operations, 1862-63 (A.J. Russell and others, U.S. Military Railroad).'],
  ['chancellorsville', 'Confederate dead stone wall Marye Heights Fredericksburg May 1863 Russell photograph',
    'Confederate dead behind the stone wall at Marye\'s Heights, May 3, 1863 — Sedgwick\'s corps stormed the heights at Second Fredericksburg during the Chancellorsville campaign, taking the ground that had been a slaughter-pen five months before.',
    'A wartime photograph of Confederate dead lying behind the stone wall at the foot of Marye\'s Heights, Fredericksburg.',
    'Andrew J. Russell, May 3, 1863 — taken during the Chancellorsville campaign (Second Battle of Fredericksburg).'],
  ['vicksburg', 'Vicksburg siege 1863 Shirley House trenches Union camp photograph',
    'The Shirley House amid the Union siege works at Vicksburg, 1863 — Grant\'s army dug in around the city until its July 4 surrender split the Confederacy along the Mississippi.',
    'A wartime photograph of the Shirley House surrounded by the dug-in Union siege lines at Vicksburg, Mississippi.',
    'Photographed during the 1863 siege of Vicksburg; the Shirley House ("the white house") stood amid the 45th Illinois\' encampment.'],
  ['gettysburg', 'Gettysburg Harvest of Death OSullivan July 1863 dead photograph battlefield',
    'Timothy O\'Sullivan\'s "A Harvest of Death" — the dead on the field at Gettysburg, July 1863. The war\'s turning point cost some 50,000 casualties in three days.',
    'A wartime photograph of soldiers lying dead in a field at Gettysburg, Pennsylvania, in July 1863.',
    'Timothy H. O\'Sullivan, "A Harvest of Death," July 1863 — published by Alexander Gardner; a genuine field photograph of the dead.'],
  ['chickamauga', 'Chickamauga 1863 battlefield Georgia photograph',
    'The wooded field of Chickamauga, where Bragg\'s costly September 1863 victory drove the Union army back into Chattanooga — and Thomas\'s stand earned him "the Rock of Chickamauga."',
    'A wartime photograph of the Chickamauga battlefield in Georgia.',
    'The dense woods of Chickamauga were not photographed during the September 1863 fighting; period field photographs are scarce.'],
];

/* Exact-file PINS chosen from a Commons API reconnaissance (each a verified PD raster).
   The free-text search returned maps / sketches / a 1917 birdseye panorama for several
   fields (the scorer + VIEW caught them); these PINS are the genuine wartime PHOTOGRAPHS
   chosen + VIEW-checked instead (the D135 "Shaw 2d" / D136 "Jefferson C. Davis" precedent).
   antietam + chancellorsville were correct on the first search pass (no pin needed). */
const PINS = {
  // VIEW-approved (genuine wartime field photographs, the right plate to the right field):
  'bullrun1': 'File:Sudley Ford and Church, Bull Run, where General McDowell crossed with Hunter\'s column to turn the extreme left of the enemy\'s position LCCN2016651686.jpg', // the actual ford McDowell's flank column crossed at First Bull Run
  'fredericksburg': 'File:Pontoon bridge across the Rappahannock - negative by T.H. O\'Sullivan; positive by A. Gardner. LCCN2006685381.jpg', // O'Sullivan/Gardner — the Rappahannock pontoon crossing
  'vicksburg': 'File:Quarters of Logan\'s Division in the trenches in front of Vicksburg LCCN2013649023.jpg', // genuine 1863 Union siege trenches/dugouts before Vicksburg
  'gettysburg': 'File:Incidents of the War A Harvest of Death.jpg', // Timothy O'Sullivan, "A Harvest of Death," July 1863
};

/* Fields with NO clean PD WARTIME PHOTOGRAPH on Commons — left IMAGELESS + documented
   (accuracy over coverage, the D134 arms precedent). The briefing renders unchanged for
   these (the guarded helper returns ""). Malvern Hill (a Seven Days field) and Chickamauga
   (dense woods, Sept 1863) were not photographed during/just after the fighting; the only
   candidates are postwar maps, lithographs, watercolours, and bronze monuments. */
const IMAGELESS = {
  'malvern': 'No clean PD wartime photograph of the Malvern Hill field exists on Commons — only Sneden watercolours, Leslie\'s/Harper\'s lithographs, "barrage"/"gunboat" sketches, and battle maps. The Seven Days fields (July 1862) were not photographed during the fighting.',
  'chickamauga': 'No clean PD wartime photograph of the Chickamauga field exists on Commons — only battle maps (McElroy/Ohio Commission) and postwar monument photos. The dense Georgia woods were not photographed during the Sept 1863 fighting.',
  'shiloh': 'No clean PD wartime photograph of the Shiloh field / Pittsburg Landing exists on Commons — the candidates were a 1917 "Birdseye View" drawn panorama and a book ENGRAVING of the steamers at the landing ("from a photograph taken a few days after the battle", but reproduced as a woodcut, not the photo). Caught on VIEW. Shiloh (April 1862) was not cleanly photographed during/just after the fighting.',
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
    gsrsearch: query, gsrnamespace: '6', gsrlimit: '18',
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

/* Favor a genuine PERIOD PHOTOGRAPH of the field; penalize paintings / engravings / maps
   / monuments / reenactments / postwar dates / non-subject media so a bronze tablet or a
   1900 lithograph never wins over a Gardner / O'Sullivan / Barnard photograph. */
function scoreCandidate(pg) {
  const ii = (pg.imageinfo || [])[0] || {};
  const em = ii.extmetadata || {};
  const title = pg.title || '';
  const mime = ii.mime || '';
  if (!isPdLicense(em)) return null;
  if (!/^image\/(jpeg|png)$/.test(mime)) return null;
  const w = ii.width || 0, h = ii.height || 0;
  if (w < 360 || h < 280) return null;
  const meta = (strip((em.Credit || {}).value) + ' ' + strip((em.Artist || {}).value) + ' '
    + strip((em.ImageDescription || {}).value) + ' ' + title).toLowerCase();
  let s = 0;
  // archive + war-photographer provenance
  if (/loc|library of congress|national archives|nara|brady|gardner|o'sullivan|osullivan|sullivan|barnard|russell|gibson|smithsonian/.test(meta)) s += 25;
  // photograph preference
  if (/photograph|albumen|stereograph|negative|glass plate|wet plate/.test(meta)) s += 14;
  if (/\.jpg$|\.jpeg$/i.test(title)) s += 2;
  if (w >= 1000) s += 6;
  // wartime date bonus
  if (/186[1-5]/.test(meta)) s += 8;
  // NON-photograph media — strong penalty (we want a photo, not a painting/print/map/statue)
  if (/painting|oil on|engraving|lithograph|woodcut|illustration|drawing|sketch|etching|chromolithograph|map of|battle map|bird's-eye|birds eye|panorama print|bust|statue|monument|memorial|sculpture|tablet|relief|plaque|grave|tombstone|cemetery dedication|stamp|currency|banknote/.test(meta)) s -= 32;
  if (/reenact|re-enact|replica|reproduction|cosplay|living history/.test(meta)) s -= 32;
  // postwar / late penalty (the battles were fought 1861-65; later views are dispreferred)
  if (/18[789]\d|19\d\d|20\d\d/.test(meta) && !/186[1-5]/.test(meta)) s -= 10;
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
  const outDir = join(ROOT, 'assets', 'scenes'); mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, id + ext);
  let bytes = 0;
  // polite retry/backoff: upload.wikimedia.org rate-limits (HTTP 429) bursts of binary downloads.
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  let lastErr = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await sleep(1500 * attempt);   // 0, 1.5s, 3s, 4.5s, 6s
    try {
      const r = await fetch(best.ii.url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status === 503) { lastErr = 'download ' + r.status; continue; }
      if (!r.ok) throw new Error('download ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      writeFileSync(outPath, buf); bytes = buf.length; lastErr = '';
      break;
    } catch (e) { lastErr = e.message; }
  }
  if (!bytes) return { id, error: 'download failed: ' + lastErr, file: best.title };
  await sleep(400);   // gap before the next item's download
  return {
    id, caption, alt, periodNote: note,
    file: best.title,
    sourceUrl: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(best.title),
    imageUrl: best.ii.url,
    license: strip((best.em.LicenseShortName || {}).value) || 'Public domain',
    artist: strip((best.em.Artist || {}).value).slice(0, 160),
    credit: strip((best.em.Credit || {}).value).slice(0, 160),
    mime: best.mime, w: best.w, h: best.h, bytes, score: best.score,
    savedAs: 'assets/scenes/' + id + ext,
    runnerUp: (scored[1] && scored[1].title) || '',
  };
}

async function main() {
  const only = process.argv.slice(2);
  // skip the documented-imageless fields (no clean PD wartime photograph exists) unless
  // explicitly named on the CLI — they must never silently re-pull a map/sketch.
  const items = (only.length ? ITEMS.filter(i => only.includes(i[0])) : ITEMS).filter(i => only.length || !IMAGELESS[i[0]]);
  const provPath = join(ROOT, 'assets', 'scenes-imagery-provenance.json');
  let prov = {}; if (existsSync(provPath)) { try { prov = JSON.parse(readFileSync(provPath, 'utf8')); } catch (e) {} }
  const edge = [];
  for (const it of items) {
    const r = await sourceOne(it);
    if (r.error) { edge.push(r); console.error('  EDGE CASE [' + r.id + ']: ' + r.error + (r.file ? ' (best="' + r.file + '")' : '')); continue; }
    prov[r.id] = r;
    console.log('  [' + r.id + '] ' + r.savedAs + '  (' + (r.bytes / 1024).toFixed(0) + 'KB ' + r.w + 'x' + r.h + ', score ' + r.score + ', ' + r.license + ')  <- ' + r.file);
  }
  // record the deliberately-imageless fields so coverage is auditable (not a silent gap)
  prov._imageless = IMAGELESS;
  writeFileSync(provPath, JSON.stringify(prov, null, 2));
  const imaged = Object.keys(prov).filter(k => k !== '_imageless');
  console.log('\nWROTE ' + imaged.length + ' image provenance records (+' + Object.keys(IMAGELESS).length + ' documented imageless) -> assets/scenes-imagery-provenance.json');
  if (edge.length) { console.log('\n' + edge.length + ' EDGE CASE(S) NEED MANUAL REVIEW: ' + edge.map(e => e.id).join(', ')); process.exitCode = 3; }
  console.log('NEXT: VIEW each image, pin/fix any wrong pull, then node tools/prep-embed-assets.mjs scenes && node tools/build.mjs');
}
main();
