#!/usr/bin/env node
// tools/fetch_polyhaven_terrain.mjs — pull CC0 Poly Haven PBR ground materials into the
// engine's exact terrain-material names (3D-ASSET-PLAN §5 is LAW):
//   assets/3d/materials/terrain/<key>_albedo.png  (Diffuse)
//   assets/3d/materials/terrain/<key>_normal.png  (nor_gl — GL normal, what three.js wants)
//   assets/3d/materials/terrain/<key>_rough.png   (Rough)
// 1k PNG: plenty for a hex board at distance, cheap on the Intel UHD 617 (27 textures).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RES = process.argv[2] || '1k';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets/3d/materials/terrain');
mkdirSync(OUT, { recursive: true });

// engine terrain key -> Poly Haven asset id (research shortlist, verified live)
const MAP = {
  clear: 'leafy_grass',
  field: 'sparse_grass',
  woods: 'forrest_ground_01',
  hills: 'aerial_grass_rock',
  ridge: 'aerial_rocks_02',
  town:  'cobblestone_floor_04',
  road:  'rocky_trail_02',
  swamp: 'brown_mud_03',
  fort:  'medieval_blocks_02',
};
// our suffix -> Poly Haven map node
const PICK = { albedo: 'Diffuse', normal: 'nor_gl', rough: 'Rough' };

function url(node, res) {
  if (!node) return null;
  const r = node[res] || node['2k'] || node['1k'];
  if (!r) return null;
  return (r.png && r.png.url) || (r.jpg && r.jpg.url) || null;
}

async function dl(u, path) {
  const r = await fetch(u);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(path, buf);
  return buf.length;
}

const results = [];
for (const [key, asset] of Object.entries(MAP)) {
  let files;
  try { files = await (await fetch('https://api.polyhaven.com/files/' + asset)).json(); }
  catch (e) { results.push({ key, asset, error: 'api ' + e.message }); continue; }
  for (const [suffix, node] of Object.entries(PICK)) {
    const u = url(files[node], RES);
    const out = join(OUT, `${key}_${suffix}.png`);
    if (!u) { results.push({ key, suffix, error: 'no ' + node }); continue; }
    try { const n = await dl(u, out); results.push({ key, suffix, kb: Math.round(n / 1024) }); }
    catch (e) { results.push({ key, suffix, error: e.message }); }
  }
}
const ok = results.filter(r => r.kb).length, err = results.filter(r => r.error);
console.log(JSON.stringify({ res: RES, downloaded: ok, errors: err }, null, 1));
