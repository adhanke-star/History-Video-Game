# Build Size Profile

Generated: 2026-06-17

## Summary

| Metric | Value |
|--------|-------|
| Total file size | 1,825 KB (1.78 MB) |
| JavaScript | 1,809 KB (99%) |
| CSS/Styles | 13.6 KB (1%) |
| HTML/markup | 2.2 KB (<1%) |
| Data URIs | 0 KB (none) |
| Functions | 937 |
| Script blocks | 1 (single monolithic `<script>`) |
| Inline event handlers | 2 |

## Composition

```
base.html (frozen foundation):  ~1,202 KB (66%)
src/ modules (active code):       ~623 KB (34%)
```

## Top 10 Largest Modules

| # | Module | Size | % of src/ |
|---|--------|------|-----------|
| 1 | tactical/T0-field-sandbox.js | 120.1 KB | 19% |
| 2 | tactical/T2-campaign-link.js | 35.4 KB | 6% |
| 3 | tactical/T5-arms.js | 33.7 KB | 5% |
| 4 | tactical/T6-presets.js | 31.8 KB | 5% |
| 5 | 80-victory.js | 28.3 KB | 5% |
| 6 | tactical/T3-officers.js | 26.3 KB | 4% |
| 7 | 35-command.js | 26.2 KB | 4% |
| 8 | tactical/T1-bull-run.js | 26.1 KB | 4% |
| 9 | 31-cabinet.js | 24.7 KB | 4% |
| 10 | 60-blockade.js | 22.9 KB | 4% |

## Analysis & Recommendations

### Why it's 1.8MB
- **Single-file delivery is a design constraint** (offline-first, open-and-play, $0 hosting).
- The frozen `base.html` foundation (Classic engine + 3D/Three.js + War Department) accounts for 66% of the size — this is expected and intentional.
- No data URIs or embedded assets — the file is pure code + minimal CSS.

### What would help (without breaking the single-file constraint)
1. **Gzip/Brotli on serving** — a 1.8MB text file compresses to ~300-400KB over HTTP. If hosted on any CDN or static server with compression enabled, load time is negligible.
2. **Minification** — running the JS through a minifier (terser) could save 30-50% (removing comments, whitespace, shortening locals). A `build --prod` flag could do this.
3. **Dead code elimination** — the 937 functions likely include some unused paths from the frozen base. A tree-shaking pass could identify candidates (risky without full test coverage of base.html).

### What would NOT help
- **Code splitting / lazy loading** — incompatible with single-file offline delivery.
- **Moving data to external files** — breaks the open-and-play guarantee.
- **Reducing module count** — the modules are well-organized by domain; fewer files just means less clarity.

### T0-field-sandbox.js (120KB) — the elephant
This single module is 19% of all src/ code. It contains the entire tactical battle engine (sim loop, rendering, AI, input). It's large because it IS the game's real-time layer. Splitting it would require breaking the single-scope override-by-redeclaration pattern. Acceptable as-is.
