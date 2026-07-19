#!/usr/bin/env node
// tools/derive-hdr-palette.mjs — offline HDRI palette derivation for T33 (LANE-014 slice 3).
//
// Parses the three ledgered Poly Haven .hdr (RGBE) files READ-ONLY and derives every
// precomputed constant in src/tactical/T33-hdri-sky.js FLDHDRI (determinism: full-image
// integration, no sampling randomness — same files in, same numbers out):
//   · derived hemisphere/sun colours: upper-hemisphere solid-angle-weighted mean (hemiS),
//     lower-hemisphere mean (hemiG), brightest-0.05%-of-sky-region mean (sun), each
//     normalized to a fixed display luminance and gamma-2.2 encoded;
//   · FLDHDRI.LIGHTS[key]: the derived colours blended 50/50 with the AUTHORED palette
//     the weather layer would produce for the key's canonical state — day = the engine
//     default launch palette (clear/midday applies no weather change), dusk = the clear
//     palette with the dusk time modifier (the T17 blend math reproduced below),
//     overcast = the overcast base palette (midday applies no time change);
//   · FLDHDRI.EXPOSURE[key]: the LDR-decode exposure — the 232/255 display-mean target
//     in linear light (the T32 TARGET_LUM philosophy) / the measured upper-hemisphere
//     mean luminance.
// Recorded in DECISIONS D472. Run: node tools/derive-hdr-palette.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseHDR(path) {
  const buf = readFileSync(path);
  let pos = 0;
  function line() {
    let s = '';
    while (pos < buf.length) { const c = buf[pos++]; if (c === 10) break; s += String.fromCharCode(c); }
    return s;
  }
  let l = line();
  if (!/#\?RADIANCE|#\?RGBE/.test(l)) throw new Error('not RGBE: ' + l);
  while (true) { l = line(); if (l === '') break; }
  l = line();
  const m = l.match(/-Y (\d+) \+X (\d+)/);
  if (!m) throw new Error('bad resolution: ' + l);
  const H = +m[1], W = +m[2];
  const data = new Float32Array(W * H * 3);
  const rgbe = new Uint8Array(4);
  for (let y = 0; y < H; y++) {
    // scanline
    let r0 = buf[pos], g0 = buf[pos + 1], b0 = buf[pos + 2], e0 = buf[pos + 3];
    if (r0 === 2 && g0 === 2 && ((b0 << 8) | e0) === W) {
      pos += 4;
      // RLE: 4 components sequentially
      const row = new Uint8Array(W * 4);
      for (let c = 0; c < 4; c++) {
        let x = 0;
        while (x < W) {
          let cnt = buf[pos++];
          if (cnt > 128) { cnt -= 128; const v = buf[pos++]; while (cnt-- > 0) row[(x++) * 4 + c] = v; }
          else { while (cnt-- > 0) row[(x++) * 4 + c] = buf[pos++]; }
        }
      }
      for (let x = 0; x < W; x++) {
        const e = row[x * 4 + 3];
        const f = e ? Math.pow(2, e - 136) : 0; // 2^(e-128)/256
        const o = (y * W + x) * 3;
        data[o] = row[x * 4] * f; data[o + 1] = row[x * 4 + 1] * f; data[o + 2] = row[x * 4 + 2] * f;
      }
    } else {
      // flat (uncompressed) scanline
      for (let x = 0; x < W; x++) {
        rgbe[0] = buf[pos++]; rgbe[1] = buf[pos++]; rgbe[2] = buf[pos++]; rgbe[3] = buf[pos++];
        const f = rgbe[3] ? Math.pow(2, rgbe[3] - 136) : 0;
        const o = (y * W + x) * 3;
        data[o] = rgbe[0] * f; data[o + 1] = rgbe[1] * f; data[o + 2] = rgbe[2] * f;
      }
    }
  }
  return { W, H, data };
}

function lum(r, g, b) { return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function toHex(r, g, b, targetLum) {
  // normalize the HDR colour to a display hex at the given target luminance (gamma 2.2)
  const L = lum(r, g, b) || 1e-6;
  const s = targetLum / L;
  function ch(v) { const x = Math.pow(Math.min(1, Math.max(0, v * s)), 1 / 2.2); return Math.round(x * 255); }
  const h = (n) => n.toString(16).padStart(2, '0');
  return '#' + h(ch(r)) + h(ch(g)) + h(ch(b));
}

/* ---- the T17 authored-palette math (reproduced verbatim so the blend source is exact) ---- */
function wxHex(h) {
  h = String(h || '#000000').replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  let n = parseInt(h, 16); if (!isFinite(n)) n = 0;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function wxToHex(r, g, b) {
  function c(v) { v = Math.round(v); if (v < 0) v = 0; if (v > 255) v = 255; const s = v.toString(16); return s.length < 2 ? '0' + s : s; }
  return '#' + c(r) + c(g) + c(b);
}
function wxBlend(a, b, t) {
  if (t <= 0) return a; if (t >= 1) return b;
  const A = wxHex(a), B = wxHex(b);
  return wxToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}
// AUTHORED palettes per key (sun / hemiS / hemiG), from the weather layer's tables:
//   day      = the engine-default launch palette (== the clear base; no weather applies);
//   dusk     = clear base + the dusk time modifier (sun ->#ffbe84 @0.60, hemiG ->#5a3c22 @0.30);
//   overcast = the overcast base (midday: no time modifier).
const AUTHORED = {
  day:      { sun: '#fff2d0', hemiS: '#dceaff', hemiG: '#5a4a32' },
  dusk:     { sun: wxBlend('#fff2d0', '#ffbe84', 0.60), hemiS: '#dceaff', hemiG: wxBlend('#5a4a32', '#5a3c22', 0.30) },
  overcast: { sun: '#e9e7dd', hemiS: '#cfd3d4', hemiG: '#544a3b' }
};
function blend5050(a, b) {
  const A = wxHex(a), B = wxHex(b);
  return wxToHex((A.r + B.r) / 2, (A.g + B.g) / 2, (A.b + B.b) / 2);
}

const KEY_OF = { sky_day: 'day', sky_dusk: 'dusk', sky_overcast: 'overcast' };
const LDR_TARGET = Math.pow(232 / 255, 2.2);   // the display-mean target in linear light

for (const name of ['sky_day', 'sky_dusk', 'sky_overcast']) {
  const key = KEY_OF[name];
  const { W, H, data } = parseHDR(join(ROOT, 'assets', '3d', 'env', name + '.hdr'));
  // equirect: row 0 = zenith, row H/2 = horizon, row H-1 = nadir. Solid-angle weight = sin(theta).
  let skyR = 0, skyG = 0, skyB = 0, skyWt = 0, gndR = 0, gndG = 0, gndB = 0, gndWt = 0;
  const lums = [];
  for (let y = 0; y < H; y++) {
    const theta = ((y + 0.5) / H) * Math.PI, w = Math.sin(theta);
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 3, r = data[o], g = data[o + 1], b = data[o + 2];
      if (y < H / 2) { skyR += r * w; skyG += g * w; skyB += b * w; skyWt += w; lums.push(lum(r, g, b)); }
      else { gndR += r * w; gndG += g * w; gndB += b * w; gndWt += w; }
    }
  }
  skyR /= skyWt; skyG /= skyWt; skyB /= skyWt; gndR /= gndWt; gndG /= gndWt; gndB /= gndWt;
  // sun region: mean colour of the brightest 0.05% of sky pixels
  lums.sort((a, b) => b - a);
  const thr = lums[Math.max(0, Math.floor(lums.length * 0.0005) - 1)] || lums[0];
  let sR = 0, sG = 0, sB = 0, sN = 0;
  for (let y = 0; y < H / 2; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3;
    if (lum(data[o], data[o + 1], data[o + 2]) >= thr) { sR += data[o]; sG += data[o + 1]; sB += data[o + 2]; sN++; }
  }
  sR /= sN; sG /= sN; sB /= sN;
  const skyMeanLum = +lum(skyR, skyG, skyB).toFixed(4);
  const derived = {
    hemiSky: toHex(skyR, skyG, skyB, 0.68),
    hemiGround: toHex(gndR, gndG, gndB, 0.10),
    sun: toHex(sR, sG, sB, 0.85)
  };
  console.log(name, {
    skyMeanLum,
    gndMeanLum: +lum(gndR, gndG, gndB).toFixed(4),
    derived,
    authored: AUTHORED[key],
    LIGHTS: {
      sun: blend5050(derived.sun, AUTHORED[key].sun),
      hemiS: blend5050(derived.hemiSky, AUTHORED[key].hemiS),
      hemiG: blend5050(derived.hemiGround, AUTHORED[key].hemiG)
    },
    EXPOSURE: +(LDR_TARGET / skyMeanLum).toFixed(3),
    sunPixels: sN
  });
}
