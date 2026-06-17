# Contributing to "The Civil War"

This guide onboards **AI agents** and human collaborators to the codebase.

---

## Quick Start

```bash
cd ~/Desktop/Video\ Game   # or wherever your clone lives
npm install                 # jsdom + playwright-core (the only deps)
npm test                    # 78 unit tests — Node 22+ built-in runner
node tools/build.mjs       # assemble civil_war_generals.html (the deliverable)
```

## Architecture (30-second overview)

| Layer | What |
|-------|------|
| `build/base.html` | **FROZEN** foundation (Classic + 3D + War Dept). NEVER edit. |
| `src/NN-*.js` | Grand-strategy modules, spliced in manifest order. |
| `src/tactical/T*.js` | Tactical (real-time battle) engine modules. |
| `data/*.json` | Game data (economy, diplomacy, weapons, scenarios, etc). |
| `tools/build.mjs` | Zero-dep build: concatenates → gates → writes deliverable. |
| `tools/probe-*.mjs` | Integration tests (Playwright). Run against the built HTML. |
| `tests/test-*.mjs` | Unit tests (Node `node:test` + `vm` harness). |
| `civil_war_generals.html` | The GENERATED playable deliverable. Never hand-edit. |

## The Module Contract

Every `src/` module follows the **four-function pattern**:
- `xxxInit(C)` — idempotent state initialization (creates `C.xxx` if missing)
- `xxxOnResolve(winnerSide, type, B, C, win)` — per-battle tick (mutate `C.xxx` only)
- `xxxRenderHTML(C)` → string — pure render (no side effects)
- `xxxWire(C)` — wire DOM event listeners

Modules extend by **override-by-redeclaration** (last `function` definition wins via hoisting). See `90-president-register.js` for the lifecycle wiring.

## Rules

1. **Never edit `build/base.html`** — extend via new modules + guarded seams.
2. **`G` is a bare-name lexical global** — reference `G` directly, NEVER `window.G`.
3. **Unique prefixes** — each module uses a unique `_xx` prefix (`_pd`, `_ec`, `_blk`, etc.) to avoid collisions.
4. **`C.xxx` holds PLAIN DATA only** — no functions, no DOM refs, no cycles. Must JSON-serialize.
5. **All gates must pass before commit** — `node tools/build.mjs --check` (parse + hex + collision).
6. **Probes are the source of truth** — run the relevant `probe-*.mjs` after any change.

## Pre-Commit Hook

The repo includes a `.githooks/pre-commit` hook that runs `npm test` + `node tools/build.mjs --check`. To activate:

```bash
git config core.hooksPath .githooks
```

## Testing

### Unit Tests (fast, no browser)
```bash
npm test                              # all 78 tests, ~230ms
node --test tests/test-*.mjs          # same thing
```

The test harness (`tests/helpers.mjs`) evaluates `src/` modules in a `vm.createContext` sandbox — pure logic testing without a browser.

### Integration Probes (Playwright, full browser)
```bash
export TMPDIR="$PWD/.tmp" && mkdir -p .tmp
node tools/probe-economy.mjs          # one probe
node tools/bootprobe.mjs              # boot sanity check
```

Probes require a local HTTP server or use the built `civil_war_generals.html` directly.

## Commit Discipline

- **GATE-BEFORE-PUSH**: Every commit must pass `node tools/build.mjs` (not just `--check`).
- **One feature = one commit** — descriptive message, push to `main` after vetting.
- **Stage only milestone files** — never commit `.tmp/`, `tools/shots/*.json`, `.claude/settings.local.json`.

## For AI Agents

- **Read `START-HERE.md` first** — it's the master index. Follow its read-order.
- **`AUTONOMOUS-RUN.md`** is the operating manual — live state, build loop, roadmap.
- **`DECISIONS.md`** — every design fork already resolved. Don't relitigate.
- **`GRAND-STRATEGY-PLAN.md`** — the design law. Honor verbatim.
- Probes write `tools/shots/*.json` — check these for regression evidence.
- The `diag-classic` probe's "346" count is the byte-identity baseline — changes must not alter it.
