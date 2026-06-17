# HANDOFF-DEVIN.md — Context for Future Devin Sessions

Last updated: 2026-06-17 by Devin session `82a38bef`.

---

## Project Identity

**"The Civil War"** — a single-file Civil War teaching strategy game. Personal project by Aaron Hanke. Built to be opened directly from a desktop (offline-first, $0 hosting, no server required). The deliverable is `civil_war_generals.html` (~1.8MB unminified, ~1.14MB minified).

## Repository Layout

```
History-Video-Game/
├── build/base.html          FROZEN foundation — NEVER EDIT (Classic engine + 3D + War Dept)
├── src/
│   ├── 00-manifest.json     Module splice order (31 modules)
│   ├── types.d.ts           TypeScript declarations for IDE autocomplete
│   ├── 10-president-state.js ... 90-president-register.js  (grand-strategy)
│   └── tactical/T0-T8*.js   (real-time battle engine)
├── data/*.json              Game data (scenarios, weapons, generals, economy, etc)
├── tools/
│   ├── build.mjs            Zero-dep build (--check, --minify flags)
│   ├── probe-*.mjs          Integration tests (Playwright)
│   ├── visual-baseline.mjs  Screenshot diff regression tool
│   └── profile-report.md    Size analysis
├── tests/
│   ├── helpers.mjs          VM-based unit test harness
│   └── test-*.mjs           Unit tests (Node built-in runner)
├── .github/workflows/ci.yml GitHub Actions (test + build gate)
├── .githooks/pre-commit     Local hook (test + build gate)
├── civil_war_generals.html  THE GENERATED DELIVERABLE (never hand-edit)
├── jsconfig.json            IDE type checking config
├── CONTRIBUTING.md          Onboarding guide
└── package.json             npm test script + deps
```

## Key Architecture Rules

1. **Never edit `build/base.html`** — it's frozen. Extend via new src/ modules.
2. **Override-by-redeclaration** — last `function` definition wins. `90-president-register.js` wires all lifecycle hooks by redefining `_t1InitAll` / `_t1Resolve`.
3. **`G` is a bare-name global** — reference directly, NEVER `window.G`.
4. **Unique `_xx` prefixes** — each module uses a unique 2-3 char prefix (`_pd`, `_ec`, `_blk`, `_fld`, etc).
5. **`C.xxx` is PLAIN DATA only** — no functions, no DOM refs, no cycles. Must JSON-serialize.
6. **Four-function contract** per system: `xxxInit(C)`, `xxxOnResolve(...)`, `xxxRenderHTML(C)`, `xxxWire(C)`.
7. **Gates must pass** — `node tools/build.mjs --check` (parse + hex + collision) before every commit.

## Build & Test Commands

```bash
npm test                           # 78 unit tests (~230ms)
node tools/build.mjs               # dev build (gate + write)
node tools/build.mjs --check       # gate only, don't write
node tools/build.mjs --minify      # production build (39% smaller)
node tools/visual-baseline.mjs     # capture screenshot baselines
node tools/visual-baseline.mjs --update  # update baselines
```

## Design Documents (READ THESE FIRST)

| File | Purpose |
|------|---------|
| `START-HERE.md` | Master index — read order, conventions, the 30-second pitch |
| `AUTONOMOUS-RUN.md` | Operating manual — build loop, roadmap, live state |
| `DECISIONS.md` | Every design fork already resolved (D1-D76). Don't relitigate. |
| `GRAND-STRATEGY-PLAN.md` | The design law. Honor verbatim. |
| `V1-CHECKLIST.md` | Roadmap phases (A-H) with checkboxes |

## Current State (as of acc984a + this session)

- **Phase C-2 shipped**: Antietam multi-phase battle engine (T8-phases.js)
- **Phase H in progress**: "Make it come to life" (audio, graphics, battle flags) — was being worked on by Claude/Cline when subscription ran out
- **Unit tests**: 78 tests covering 4 modules that had zero coverage
- **CI**: GitHub Actions + pre-commit hooks active
- **Minification**: `--minify` flag available (1.87MB → 1.14MB)

## Things to Know

- The `diag-classic` probe's "346" count is the byte-identity baseline — any change must NOT alter it.
- Probes use `TMPDIR=$PWD/.tmp` (create `.tmp/` before running probes).
- The game uses Three.js for 3D tactical battles — performance floor is Intel UHD 617.
- Aaron plans to demo to family — prioritize high visual impact, low risk.
- The `.claude/settings.json` allows all Bash commands — Claude Code had full permissions.
- There's a Blender MCP integration (`.mcp.json`) for 3D asset work.

## What Devin Added This Session

1. Unit test infrastructure (`tests/`) — 78 tests, Node built-in runner, vm-based harness
2. GitHub Actions CI (`.github/workflows/ci.yml`)
3. Pre-commit hook (`.githooks/pre-commit`)
4. `CONTRIBUTING.md` onboarding guide
5. `src/types.d.ts` TypeScript declarations
6. JSDoc annotations on `10-president-state.js` and `T8-phases.js`
7. `jsconfig.json` for IDE type checking
8. `--minify` flag on `tools/build.mjs` (terser, 39% reduction)
9. Visual regression baseline tool + screenshots
10. Build size profiling report

## Branch State

All work is on `devin/unit-tests` branch. Aaron merges to `main` locally.
