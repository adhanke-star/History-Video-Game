#!/usr/bin/env node
/* ============================================================================
   source-leaders-imagery.mjs — one-time PD sourcing for the H1 LEADERS imagery (D136).
   Sibling of tools/source-usct-imagery.mjs / tools/source-arms-imagery.mjs. For each
   "People" CODEX entry the game teaches that does NOT already carry a USCT image
   (D135), fetch a famous public-domain WARTIME / IN-THE-FIELD photograph (Brady /
   Gardner / Library-of-Congress / National-Archives) from the Wikimedia Commons API,
   keep ONLY a PD raster, download it to assets/leaders/<id>.<ext> (id = the codex
   entry id, so the runtime keys __ASSETS["leaders/<id>"] trivially), and record full
   provenance (file, URL, licence, artist/credit, caption, alt, period-accuracy note)
   to assets/leaders-imagery-provenance.json.

   These are INFORMATIVE historical photographs woven into teaching cards (like the
   USCT set, NOT decorative like the arms cutouts), so the provenance carries a real
   descriptive `alt` + a visible `caption` + a `credit` (the holding institution) the
   runtime renders as a <figcaption>.

   DELIBERATE COMPLEMENTARITY (the overlap-check answer): the game already embeds a
   155-image `portraits` category, but that is a tiny 128px BADGE tier (D133), sized
   for the 96x120 general badge and keyed by portrait key, not offline-usable at card
   size. This `leaders` category is a SEPARATE, larger (420px) codex-resolution tier
   keyed by CODEX ENTRY ID and biased toward "leader in the field" wartime photographs
   (Lincoln at Antietam, Grant at City Point, ...) — complementary, not a duplicate.

   PD discipline (Aaron's "hands-off, edge-cases only", D134): an image is kept ONLY
   if the Commons extmetadata LicenseShortName is a public-domain form. Corroborated
   by the age basis — every subject is a Civil-War-era figure photographed 1860-1865
   (published before 1929 -> PD by age) and most are Library-of-Congress / Brady-Handy
   / federal works. The scorer favors PHOTOGRAPHS and penalizes paintings / engravings
   / statues / monuments / postwar dates so the search returns a period photo, not a
   bronze or a 1900 lithograph. Anything that does not return a clean PD raster is
   printed as an EDGE CASE, never guessed; every image is VIEWed before embed.

   Usage:  node tools/source-leaders-imagery.mjs            # all
           node tools/source-leaders-imagery.mjs abraham-lincoln
   Re-runnable; overwrites the chosen files + merges provenance.
   ========================================================================== */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'CivilWarTeachingGame/1.0 (personal teaching project; adhanke@gmail.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

/* id (= codex entry id) · search query · caption (visible, citation-grade, anti-Lost-Cause) ·
   alt (SR) · period note. Captions name the historical truth plainly (Stephens' Cornerstone
   Speech, Cleburne's emancipation proposal, Longstreet's postwar vilification, Thomas the
   loyal Virginian, Lee photographed days after Appomattox). */
const ITEMS = [
  ['abraham-lincoln', 'Abraham Lincoln Antietam McClellan 1862 Gardner photograph',
    'President Abraham Lincoln with Gen. McClellan and officers at Antietam, October 1862 — Lincoln pressed his cautious general to pursue Lee.',
    'A photograph of President Abraham Lincoln standing in a tent encampment among Union officers at Antietam in 1862.',
    'Alexander Gardner photograph at Antietam, October 1862 — a genuine wartime field photograph.'],
  ['jefferson-davis', 'Jefferson Davis Confederate president photograph 1860s',
    'Jefferson Davis, President of the Confederacy — a government its own leaders founded to preserve and extend slavery.',
    'A wartime portrait photograph of Jefferson Davis, President of the Confederate States.',
    'A wartime Brady photographic portrait (1860s) — period-accurate.'],
  ['robert-e-lee', 'Robert E. Lee Brady April 1865 photograph',
    'Gen. Robert E. Lee, commander of the Army of Northern Virginia, in an 1863 wartime portrait.',
    'A wartime portrait photograph of Gen. Robert E. Lee in his Confederate uniform coat.',
    'An 1863 wartime photographic portrait — period-accurate.'],
  ['ulysses-s-grant', 'Ulysses S. Grant City Point headquarters 1864 photograph',
    'Lt. Gen. Ulysses S. Grant at his Cold Harbor headquarters, 1864 — the general who pressed the war relentlessly to its end.',
    'A photograph of Lt. Gen. Ulysses S. Grant standing beside a tree before a tent at his field headquarters at Cold Harbor.',
    'An 1864 field photograph at Cold Harbor, Virginia — period-accurate.'],
  ['william-tecumseh-sherman', 'William Tecumseh Sherman general photograph Brady 1865',
    'Maj. Gen. William T. Sherman, whose 1864 campaigns through Georgia and the Carolinas broke the Confederacy\'s war-making capacity and its will.',
    'A wartime portrait photograph of Maj. Gen. William T. Sherman in uniform.',
    'A wartime photographic portrait (Brady studio) — period-accurate.'],
  ['thomas-stonewall-jackson', 'Stonewall Jackson 1863 photograph Chancellorsville portrait',
    'Lt. Gen. Thomas "Stonewall" Jackson, photographed in 1863 shortly before he was mortally wounded by his own men at Chancellorsville.',
    'A wartime portrait photograph of Lt. Gen. Thomas "Stonewall" Jackson in a Confederate uniform coat.',
    'An 1863 photographic portrait, weeks before Chancellorsville — period-accurate.'],
  ['james-longstreet', 'James Longstreet Confederate general photograph 1860s',
    'Lt. Gen. James Longstreet, Lee\'s senior corps commander; after the war he became a Republican and was vilified by Lost Cause writers seeking a scapegoat for Gettysburg.',
    'A wartime portrait photograph of Lt. Gen. James Longstreet in a Confederate uniform.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['george-b-mcclellan', 'George B. McClellan general photograph 1862',
    'Maj. Gen. George B. McClellan, organizer of the Army of the Potomac, whose caution let Lee escape after Antietam.',
    'A wartime portrait photograph of Maj. Gen. George B. McClellan in uniform.',
    'A wartime (1861-62) photographic portrait — period-accurate.'],
  ['george-g-meade', 'George Meade general photograph 1863',
    'Maj. Gen. George G. Meade, who took command of the Army of the Potomac days before defeating Lee at Gettysburg.',
    'A wartime portrait photograph of Maj. Gen. George G. Meade in uniform.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['george-h-thomas', 'George Henry Thomas general photograph 1860s',
    'Maj. Gen. George H. Thomas, the "Rock of Chickamauga" — a Virginian who stayed loyal to the Union and broke the Army of Tennessee at Nashville.',
    'A wartime portrait photograph of Maj. Gen. George H. Thomas in uniform.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['philip-sheridan', 'Philip Sheridan general photograph 1864',
    'Maj. Gen. Philip H. Sheridan, whose 1864 Shenandoah Valley campaign stripped the Confederacy of one of its last granaries.',
    'A wartime portrait photograph of Maj. Gen. Philip H. Sheridan in uniform.',
    'A wartime (1864) photographic portrait — period-accurate.'],
  ['braxton-bragg', 'Braxton Bragg Confederate general photograph 1860s',
    'Gen. Braxton Bragg, the contentious commander of the Confederate Army of Tennessee.',
    'A wartime portrait photograph of Gen. Braxton Bragg in a Confederate uniform.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['patrick-cleburne', 'Patrick Cleburne Confederate general photograph',
    'Maj. Gen. Patrick Cleburne, the "Stonewall of the West," who in 1864 proposed arming and freeing enslaved men for the Confederacy — and was never promoted again.',
    'A wartime portrait photograph of Maj. Gen. Patrick Cleburne in a Confederate uniform.',
    'A wartime photographic portrait — period-accurate.'],
  ['david-farragut', 'David Farragut admiral photograph 1860s',
    'Rear Adm. David G. Farragut, who forced Mobile Bay in 1864 — "Damn the torpedoes, full speed ahead."',
    'A wartime portrait photograph of Rear Adm. David G. Farragut in a naval uniform.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['edwin-m-stanton', 'Edwin Stanton Secretary of War photograph 1860s',
    'Edwin M. Stanton, Lincoln\'s resolute Secretary of War, who organized the Union\'s vast war machine.',
    'A wartime portrait photograph of Edwin M. Stanton in a dark suit.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['william-h-seward', 'William Henry Seward Secretary of State photograph 1860s',
    'William H. Seward, Secretary of State, whose diplomacy kept Britain and France from recognizing the Confederacy.',
    'A wartime portrait photograph of William H. Seward in a suit.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['alexander-h-stephens', 'Alexander Stephens Confederate vice president photograph',
    'Alexander H. Stephens, Confederate Vice President, whose 1861 "Cornerstone Speech" declared slavery the cornerstone of the new government.',
    'A wartime portrait photograph of Alexander H. Stephens, a thin man in dark clothing.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['clara-barton', 'Clara Barton nurse photograph 1860s',
    'Clara Barton, the "Angel of the Battlefield," who carried supplies and nursed the wounded at Antietam and Fredericksburg.',
    'A wartime portrait photograph of Clara Barton, a woman in dark Victorian dress.',
    'A wartime (1860s) photographic portrait — period-accurate.'],
  ['dorothea-dix', 'Dorothea Dix photograph 1860s superintendent of nurses',
    'Dorothea Dix, Superintendent of Army Nurses for the Union, who built the army nursing corps.',
    'A portrait photograph of Dorothea Dix, a woman in mid-19th-century dress.',
    'A c.1850s daguerreotype — the standard likeness of the reformer who led the Union army nurses.'],
  ['mary-edwards-walker', 'Mary Edwards Walker surgeon Medal of Honor photograph',
    'Dr. Mary Edwards Walker, Union army surgeon and the only woman ever awarded the Medal of Honor (1865).',
    'A full-length portrait photograph of Dr. Mary Edwards Walker in her reform dress.',
    'Elliott & Fry, London, 1872 — a postwar studio portrait of the wartime surgeon.'],
];

/* Exact-file PINS chosen from a Commons API reconnaissance (each verified PD raster).
   Left empty initially; the search path + scorer pick the best PD photograph, then any
   wrong/anachronistic/namesake pull found on VIEW is pinned here and re-sourced (the
   D135 "Shaw 2d" precedent). */
const PINS = {
  // VIEW-approved from the first (search) pass:
  'abraham-lincoln': 'File:Lincoln and generals at Antietam.jpg',                 // Gardner, Antietam Oct 1862 — Lincoln (top hat) among officers in the field
  'thomas-stonewall-jackson': 'File:Stonewall Jackson.jpg',                       // the iconic 1863 portrait
  'james-longstreet': 'File:James Longstreet CDV.png',                            // wartime CDV, solo
  'philip-sheridan': 'File:Philip Sheridan - Brady-Handy.jpg',                    // Brady-Handy, solo
  'david-farragut': 'File:Admiral Farragut2.jpg',                                 // clean solo naval portrait
  'mary-edwards-walker': 'File:Mary E. Walker.jpg',                               // Elliott & Fry 1872 (postwar; date noted)
  // re-pinned after VIEW caught a wrong/group/engraving pull (the D135 discipline):
  'robert-e-lee': 'File:RobertELeephoto1863.jpg',                                 // was the 3-figure 1865 porch -> solo 1863 wartime portrait
  'ulysses-s-grant': 'File:Lt. Gen. Ulysses S. Grant standing by a tree in front of a tent, Cold Harbor, Va. - NARA - 524455.jpg', // was a Harper's Weekly ENGRAVING -> the iconic Cold Harbor field photo
  'william-tecumseh-sherman': 'File:General William T. Sherman - NARA - 527045.jpg', // was Sherman+staff group -> solo
  'jefferson-davis': 'File:President Jefferson Davis, Confederate States of America.jpg', // VIEW caught a NAMESAKE ("General Jefferson Davis"=Union Gen. Jefferson C. Davis) then a NEWSPAPER engraving cover; this is the clean wartime presidential photo
  'george-b-mcclellan': 'File:George B. McClellan - Brady-Handy.jpg',            // was the Lincoln+McClellan tent (dup Lincoln) -> solo
  'george-g-meade': 'File:George Meade - Brady-Handy.jpg',                        // was a 6-general group -> solo
  'george-h-thomas': 'File:George Henry Thomas - Brady-Handy.jpg',               // edge case (no PD hit) -> Brady solo
  'patrick-cleburne': 'File:Maj. Gen. Patrick Cleburne.jpg',                      // clean PD Cleburne PHOTOS are scarce on Commons (mostly engravings/a painting/statues); this is the standard likeness — caption worded "wartime portrait", not "photograph"
  'edwin-m-stanton': 'File:Edwin M. Stanton - Brady-Handy.jpg',                   // was a USCT soldier's family (!) -> Brady solo
  'william-h-seward': 'File:William Seward, Secretary of State, bw photo portrait circa 1860-1865.jpg', // was daughter Fanny Seward -> William, wartime
  'alexander-h-stephens': 'File:Alexander Stephens C.S.A. LOC cwpb.04947.jpg',    // was a Harper's cabinet engraving -> LOC cwpb solo
  'braxton-bragg': 'File:Braxton Bragg, CSA LOC cwpb.07427.jpg',                  // the "General (Confederate)" oval read as a tinted engraving -> the LOC cwpb wartime photo
  'clara-barton': 'File:Clara Barton - from portrait taken in Civil War and authorized by her as the one she wished to be remembered by LCCN93513623.jpg', // edge case -> the wartime portrait she authorized
  'dorothea-dix': 'File:NPG 77 261 det Dix.jpg',                                  // edge case (search gave a painting) -> NPG daguerreotype
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
    gsrsearch: query, gsrnamespace: '6', gsrlimit: '16',
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

/* Favor a genuine PERIOD PHOTOGRAPH; penalize paintings / engravings / statues /
   monuments / postwar dates / non-subject media so a bronze or a 1900 lithograph
   never wins over a Brady photograph. */
function scoreCandidate(pg) {
  const ii = (pg.imageinfo || [])[0] || {};
  const em = ii.extmetadata || {};
  const title = pg.title || '';
  const mime = ii.mime || '';
  if (!isPdLicense(em)) return null;
  if (!/^image\/(jpeg|png)$/.test(mime)) return null;
  const w = ii.width || 0, h = ii.height || 0;
  if (w < 300 || h < 300) return null;
  const meta = (strip((em.Credit || {}).value) + ' ' + strip((em.Artist || {}).value) + ' '
    + strip((em.ImageDescription || {}).value) + ' ' + title).toLowerCase();
  let s = 0;
  // archive provenance
  if (/loc|library of congress|national archives|nara|brady|gardner|smithsonian/.test(meta)) s += 25;
  // photograph preference
  if (/photograph|albumen|carte de visite|carte-de-visite|cdv|ambrotype|tintype|daguerre/.test(meta)) s += 14;
  if (/\.jpg$|\.jpeg$/i.test(title)) s += 2;
  if (w >= 1000) s += 6;
  // wartime date bonus
  if (/186[0-5]/.test(meta)) s += 6;
  // NON-photograph media — strong penalty (we want a photo, not a painting/print/statue)
  if (/painting|oil on|portrait painting|engraving|lithograph|woodcut|illustration|drawing|sketch|etching|bust|statue|monument|memorial|sculpture|relief|plaque|grave|tomb|cemetery|banknote|currency|stamp|\$\d|cent|bond/.test(meta)) s -= 30;
  if (/reenact|replica|reproduction|re-enact|cosplay/.test(meta)) s -= 30;
  // postwar / late penalty (Lincoln/Jackson died in/before 1865, so these are dis-preferred for all)
  if (/18[789]\d|19\d\d/.test(meta) && !/186[0-5]/.test(meta)) s -= 8;
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
  const outDir = join(ROOT, 'assets', 'leaders'); mkdirSync(outDir, { recursive: true });
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
    savedAs: 'assets/leaders/' + id + ext,
    runnerUp: (scored[1] && scored[1].title) || '',
  };
}

async function main() {
  const only = process.argv.slice(2);
  const items = only.length ? ITEMS.filter(i => only.includes(i[0])) : ITEMS;
  const provPath = join(ROOT, 'assets', 'leaders-imagery-provenance.json');
  let prov = {}; if (existsSync(provPath)) { try { prov = JSON.parse(readFileSync(provPath, 'utf8')); } catch (e) {} }
  const edge = [];
  for (const it of items) {
    const r = await sourceOne(it);
    if (r.error) { edge.push(r); console.error('  EDGE CASE [' + r.id + ']: ' + r.error + (r.file ? ' (best="' + r.file + '")' : '')); continue; }
    prov[r.id] = r;
    console.log('  [' + r.id + '] ' + r.savedAs + '  (' + (r.bytes / 1024).toFixed(0) + 'KB ' + r.w + 'x' + r.h + ', score ' + r.score + ', ' + r.license + ')  <- ' + r.file);
  }
  writeFileSync(provPath, JSON.stringify(prov, null, 2));
  console.log('\nWROTE ' + Object.keys(prov).length + ' provenance records -> assets/leaders-imagery-provenance.json');
  if (edge.length) { console.log('\n' + edge.length + ' EDGE CASE(S) NEED MANUAL REVIEW: ' + edge.map(e => e.id).join(', ')); process.exitCode = 3; }
  console.log('NEXT: VIEW each image, pin/fix any wrong pull, then node tools/prep-embed-assets.mjs leaders && node tools/build.mjs');
}
main();
