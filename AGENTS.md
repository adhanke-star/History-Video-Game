# AGENTS.md — Codex (and any agent reading AGENTS.md) entrypoint for "The Civil War"

**This is a thin pointer. The single source of truth is [`START-HERE.md`](START-HERE.md) — read it FIRST, every session.** It maps which docs are canonical vs legacy, the read-order, the Universal AI implementer standards, and the priority picker + model routing. The same standards bind every AI tool (Claude, Codex, Copilot, DeepSeek/Cline) — see `START-HERE.md` §"Universal AI implementer standards."

## Canonical file system (the proper read-order — same for every AI tool)
1. **`START-HERE.md`** — master index (canonical vs legacy · read-order · implementer standards · priority picker + model routing).
2. **`AUTONOMOUS-RUN.md`** — THE operating manual (live state · the build loop · the phase roadmap · guardrails · the backlog · the §8 charter).
3. **`HANDOFF.md` top block + `WAKE-UP.md` top block** — the live head (what shipped last + what's playable).
4. **`V1-CHECKLIST.md`** — the approved, ordered v1 roadmap (the build target). *The roadmap lives HERE — there is no separate task list.*
5. **`DECISIONS.md`** — the append-only decisions log (newest D## first; append, never relitigate).
6. **`GRAND-STRATEGY-PLAN.md`** (strategic-layer design LAW) + **`MODERN-UGG-PLAN.md`** (tactical-engine design LAW) — honor verbatim.
7. **`src/00-manifest.json`** + the `src/*.js` you'll touch + **`tools/build.mjs`** + the relevant **`tools/probe-*.mjs`**.
8. **`DEPLOY.md`** — only when publishing.

## Non-negotiables (never violate, even for a one-line change)
1. **Edit `src/` (code) + `data/` (data); NEVER edit `build/base.html` (frozen) and never hand-edit the generated `civil_war_generals.html`** — change source, then `node tools/build.mjs` (must print `GATE OK`).
2. **ONE universal combat model — NO per-battle damage/firepower fudge (D74);** outcomes emerge from OOB/terrain/timing/doctrine/scoreWeight. New tactical work = guarded no-op-when-inactive seams; bare-name globals (`G`/`GAME_DATA`/`__FIELD`/`FLD`, not `window.*`); no literal comment-closer inside a block comment.
3. **PROPER VETTING before any commit:** `node tools/build.mjs` GATE OK → focused probe + FULL no-regression suite + `diag-classic` (Classic still paints, `nonBlank:346`) + **0 pageerrors** → adversarial bug-hunt, every confirmed finding fixed → THEN commit → `git push origin main` (`adhanke-star/History-Video-Game`). Never push red; fix the root cause, never weaken the probe.
4. **Citation-grade, anti-Lost-Cause history:** ≥2 sources = Verified, else Inferred/Disputed; no fabricated citations/units/ranks. (Recurring trap: a commander's rank/sector AT THE BATTLE — verify it; bug-hunts have caught "Brig. Gen." for an officer who was a Colonel that day, and a general placed at the wrong redan.)
5. **Record lessons in the repo** (`DECISIONS.md`/`RUN-LOG.md`/`HANDOFF.md`/`WAKE-UP.md`/`V1-CHECKLIST.md`) — never hidden memory. **Surface (don't silently guess)** only a NEW fork that contradicts a shipped decision, is irreversible/costs money, or would waste a milestone.

## Codex sandbox note (IMPORTANT — read before vetting)
You run in the **Seatbelt sandbox**. `tools/guard-probe-browser.mjs` deliberately **blocks every browser probe** when `CODEX_SANDBOX=seatbelt` (the Chrome-crash guard, commit `679ee7d`). So:
- `node tools/build.mjs` runs fine sandboxed (pure Node, no browser) → you can reach `GATE OK` in-sandbox.
- **The browser-probe vetting gate (every `probe-*.mjs`, `diag-classic`, `bootprobe`, `t1probe`, `tactical-visuals`, the sweeps) must be run with the sandbox DISABLED** (your full-access mode / a normal terminal), or have Aaron run them and paste the results. **Do NOT weaken or bypass the guard file itself.** Probes print two summary formats (`probe-X ok=true …` and `probe-X: N/M steps ok`) — check exit codes, not one grep. Run probes foreground with `2>/dev/null` + `export TMPDIR="$PWD/.tmp"`; start one shared `python3 -m http.server 8765`; READ `tools/shots/*.json`.

## Recurring gotcha
Adding a new historical battle? You MUST add its id to the `EXPECTED` baseline in BOTH `tools/probe-tactical-roster.mjs` AND `tools/probe-custom-battle-builder.mjs` (the latter goes RED otherwise — it asserts the historical registry is unchanged). This has bitten D86/D88/D90.
