# GitHub Copilot instructions — "The Civil War" (personal teaching wargame, single-file, $0)

**Single source of truth: [`START-HERE.md`](../START-HERE.md) — and `CLAUDE.md` / `AGENTS.md` carry the full read-order + standards.** The trimmed mandated read order (D412): `START-HERE.md` → `COORDINATION.md` (relevant lane) → `HANDOFF.md` top ⚡ block (THE canonical live boundary) → the task's own law docs/probes → latest `DECISIONS.md` entry; `WAKE-UP.md`/`RUN-LOG.md`/`V1-CHECKLIST.md` detail are pull-on-demand. Read them before suggesting nontrivial changes. You assist *inline*; you do not run the build/probe gate, so your job is to propose edits that fit the architecture and to flag what a human must verify. D145 model routing applies: Copilot/helper output is bounded assistance; the top loop (ChatGPT/Codex 5.6 Sol Ultra, primary; Claude Opus 4.8 in Claude Code, secondary) owns architecture, important code, historical judgment, UX/accessibility direction, bug hunts, and final integration.

## What this project is
A single self-contained HTML teaching wargame. Source lives in `src/*.js` (concatenated by `tools/build.mjs`) + `data/*.json` (injected as `GAME_DATA`). The shipped file `civil_war_generals.html` is GENERATED — never the source of truth.

## Suggest edits that obey these (non-negotiable)
1. **Edit `src/` and `data/` only. NEVER `build/base.html` (frozen) and never the generated `civil_war_generals.html`.** A change is real only after the D160/D161 batched gate is green: build GATE OK, relevant importer/schema gate, focused probe, `git diff --check`, and adjacent probes for JS/runtime work. The full `npm run vet:noreg` battery is for planned-work batch/release checkpoints or explicit Aaron requests, not every playable feature/graphics slice.
2. **No per-battle damage/firepower fudge (D74)** — battle outcomes come from data (OOB/terrain/timing/scoreWeight), one shared combat model. Don't introduce battle-specific damage knobs.
3. **Bare-name globals** (`G`, `GAME_DATA`, `__FIELD`, `FLD`) — not `window.*`. New tactical work = guarded, no-op-when-inactive seams in `src/tactical/`. Never put a literal comment-closer inside a block comment (it parse-bombs the concatenated build).
4. **History is citation-grade + anti-Lost-Cause** — never invent units, ranks, dates, or citations; tag claims Verified/Inferred.
5. **Match surrounding code** — comment density, naming, idiom; keep edits scoped and reversible.

## Do NOT
Generate large refactors, new build steps, new "task list"/"roadmap" docs (the roadmap is `V1-CHECKLIST.md`), own architecture/history/combat balance/UX/accessibility decisions, or commit/push. Flag anything that needs the human to run `node tools/build.mjs`, relevant importer/schema checks, focused probe, adjacent probes, `git diff --check`, and the later batch/release battery before broad release.
