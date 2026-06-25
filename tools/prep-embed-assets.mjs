#!/usr/bin/env node
/* ============================================================================
   prep-embed-assets.mjs — the TIER/COMPRESS half of the D71 asset-ingestion
   pipeline (V1-CHECKLIST H1). Reads the full-resolution, already-licence-vetted
   public-domain source images under assets/<category>/ and writes a small,
   compressed "embed tier" to assets/embed/<category>/ that tools/build.mjs then
   Base64-inlines into the single-file deliverable as the OFFLINE tier (`__ASSETS`).

   WHY a prep step (not inline in build.mjs): build.mjs is deliberately ZERO-DEP
   (node:fs only) and cross-platform. Real JPEG re-encode/resize needs an image
   codec; rather than add a dependency, this companion shells out to macOS `sips`
   (always present on Aaron's Mac) ONCE, commits the tiny tier, and build.mjs stays
   dependency-free + deterministic. Re-run this whenever a source image is
   added/changed under an embedded category, then rebuild.

   Source of truth = assets/<category>/  (full-res PD).
   Generated tier  = assets/embed/<category>/  (committed; the deliverable's offline tier).

   Usage:  node tools/prep-embed-assets.mjs            # all configured categories
           node tools/prep-embed-assets.mjs portraits  # one category

   The embed tier is intentionally small (a 128px-wide portrait fills the 96x120
   framed badge at retina). The compression here is the ONLY place size is traded;
   build.mjs enforces a hard budget cap so the single file can never balloon unseen.
   ========================================================================== */

import { readdirSync, existsSync, mkdirSync, copyFileSync, statSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const EMBED = join(ASSETS, 'embed');

/* Per-category tier spec. Each embedded category lists its source dir, the output
   pixel ceiling (longest side via `sips -Z`), the JPEG quality, and the
   extensions to ingest. Add a category here (then re-run) to embed it offline. */
const CATEGORIES = [
  { name: 'portraits', maxPx: 128, quality: 64, ext: ['.jpg', '.jpeg'], format: 'jpeg', perFileWarn: 40 * 1024 },
  // weapons: Smithsonian transparent-PNG cutouts + a couple of studio JPGs. format:'keep' so the PNG
  // ALPHA is preserved (the gun sits transparent on the card, no solid box) and a JPG stays a JPG.
  { name: 'weapons', maxPx: 384, quality: 80, ext: ['.png', '.jpg', '.jpeg'], format: 'keep', perFileWarn: 110 * 1024 },
  // artillery: PD period photos + an Edwin Forbes sketch (all opaque) -> re-encode to JPEG.
  { name: 'artillery', maxPx: 384, quality: 74, ext: ['.jpg', '.jpeg'], format: 'jpeg', perFileWarn: 120 * 1024 },
  // usct: famous LoC/NARA/Harper's-Weekly PD USCT photographs + engravings (all opaque) -> JPEG. A touch
  // larger/higher-q than the small-arms cards since these are INFORMATIVE teaching images, shown bigger.
  { name: 'usct', maxPx: 420, quality: 78, ext: ['.jpg', '.jpeg'], format: 'jpeg', perFileWarn: 70 * 1024 },
  // future H1 categories plug in here once their PD sources are reviewed:
  //   { name: 'scenes',  maxPx: 420, quality: 72, ext: ['.jpg'], format: 'jpeg' },
];

function hasSips() {
  try { execFileSync('sips', ['--help'], { stdio: 'ignore' }); return true; } catch (e) { return false; }
}

const KB = (b) => (b / 1024).toFixed(1) + 'KB';

function prepCategory(cat) {
  const srcDir = join(ASSETS, cat.name);
  if (!existsSync(srcDir)) { console.log('  [skip] no source dir assets/' + cat.name + '/'); return null; }
  const outDir = join(EMBED, cat.name);
  // rebuild the tier from scratch so a removed source can't leave a stale embed
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(srcDir)
    .filter(f => cat.ext.some(e => f.toLowerCase().endsWith(e)))
    .sort();
  let total = 0, n = 0, biggest = { f: '', b: 0 };
  for (const f of files) {
    const fmt = cat.format || 'jpeg';
    const isPng = /\.png$/i.test(f);
    // Output extension: 'keep' preserves the source ext; 'jpeg' ALWAYS writes .jpg so a .png source can
    // never yield a .png file holding JPEG bytes (the extension/MIME mismatch — bug-hunt FINDER#4). The
    // build keys by stem + MIME-maps by extension, so the renamed .jpg is mapped correctly.
    const outName = (fmt === 'jpeg') ? f.replace(/\.[^.]+$/i, '.jpg') : f;
    const sp = join(srcDir, f), op = join(outDir, outName);
    copyFileSync(sp, op);
    let args;
    if (fmt === 'keep') {
      // resize only; keep the source format (preserves PNG alpha). recompress a JPG via quality.
      args = isPng ? ['-Z', String(cat.maxPx), op]
                   : ['-Z', String(cat.maxPx), '-s', 'formatOptions', String(cat.quality), op];
    } else {
      // force JPEG (no alpha). NOTE: only use format:'jpeg' on categories whose sources are .jpg, else
      // the file keeps its .png name but holds JPEG bytes (an extension/MIME mismatch). The categories
      // above honor this (portraits/artillery = jpg sources; weapons = 'keep').
      args = ['-Z', String(cat.maxPx), '-s', 'format', 'jpeg', '-s', 'formatOptions', String(cat.quality), op];
    }
    try { execFileSync('sips', args, { stdio: 'ignore' }); }
    catch (e) { console.error('  [warn] sips failed on ' + cat.name + '/' + f + ' — copied uncompressed: ' + e.message); }
    const b = statSync(op).size; total += b; n++;
    if (b > biggest.b) biggest = { f, b };
    // per-file sanity cap: a tier image should be a few KB. A large one means sips failed (full-res
    // copy kept) or the source is unusually heavy — flag it so it can't quietly bloat the embed blob.
    var pfw = cat.perFileWarn || 50 * 1024;
    if (b > pfw) console.error('  [warn] ' + cat.name + '/' + f + ' is ' + KB(b) + ' (over the ' + KB(pfw) + ' per-file warn — compression may have failed for this file).');
  }
  // base64 inflation ~ 4/3 + the data:URL prefix per entry
  const b64 = Math.round(total * 4 / 3 + n * 24);
  console.log('  [' + cat.name + '] ' + n + ' files @ <=' + cat.maxPx + 'px q' + cat.quality
    + ' -> tier ' + KB(total) + ' (raw) ~ ' + KB(b64) + ' (base64); biggest ' + biggest.f + ' ' + KB(biggest.b));
  return { name: cat.name, n, total, b64 };
}

function main() {
  if (!hasSips()) { console.error('prep-embed-assets: `sips` not found (macOS only). Embed tier NOT regenerated; build.mjs will embed whatever already exists under assets/embed/.'); process.exit(2); }
  const only = process.argv[2];
  const cats = only ? CATEGORIES.filter(c => c.name === only) : CATEGORIES;
  if (!cats.length) { console.error('prep-embed-assets: no such category "' + only + '". Known: ' + CATEGORIES.map(c => c.name).join(', ')); process.exit(2); }
  console.log('prep-embed-assets — generating assets/embed/ tier:');
  let grandRaw = 0, grandB64 = 0, grandN = 0;
  for (const c of cats) { const r = prepCategory(c); if (r) { grandRaw += r.total; grandB64 += r.b64; grandN += r.n; } }
  console.log('TOTAL embed tier: ' + grandN + ' files, ' + KB(grandRaw) + ' raw ~ ' + KB(grandB64) + ' base64.');
  console.log('NEXT: node tools/build.mjs  (embeds assets/embed/** into __ASSETS).');
}

main();
