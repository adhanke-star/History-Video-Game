# CLAUDE.md — Claude Code entrypoint for "The Civil War"

**This is a thin pointer. The single source of truth is [`START-HERE.md`](START-HERE.md) — read it FIRST, every session.** It maps which docs are canonical vs legacy, the order to read them, the Universal AI implementer standards, and the priority picker + model routing. (Your user-level `~/.claude/CLAUDE.md` also applies — personal-projects framing, terse/direct, model routing.)

## Canonical file system (the proper read-order — same for every AI tool)
1. **`START-HERE.md`** — master index (canonical vs legacy · read-order · implementer standards · priority picker + model routing).
2. **`AUTONOMOUS-RUN.md`** — THE operating manual (live state · the build loop · the phase roadmap · guardrails · the backlog · the §8 charter).
3. **`HANDOFF.md` top block + `WAKE-UP.md` top block** — the live head (what shipped last + what's playable).
4. **`V1-CHECKLIST.md`** — the approved, ordered v1 roadmap (the build target). *The roadmap lives HERE — there is no separate task list.*
5. **`DECISIONS.md`** — the append-only decisions log (newest D## first; append, never relitigate).
6. **`GRAND-STRATEGY-PLAN.md`** (strategic-layer design LAW) + **`MODERN-UGG-PLAN.md`** (tactical-engine design LAW) — honor verbatim; pull the section a task needs.
7. **`src/00-manifest.json`** + the `src/*.js` you'll touch + **`tools/build.mjs`** + the relevant **`tools/probe-*.mjs`**.
8. **`DEPLOY.md`** — only when publishing.

## Non-negotiables (never violate, even for a one-line change)
1. **Edit `src/` (code) + `data/` (data); NEVER edit `build/base.html` (frozen) and never hand-edit the generated `civil_war_generals.html`** — change source, then `node tools/build.mjs` (must print `GATE OK`).
2. **ONE universal combat model — NO per-battle damage/firepower fudge (D74);** outcomes emerge from OOB/terrain/timing/doctrine/scoreWeight. New tactical work = guarded no-op-when-inactive seams; bare-name globals (`G`/`GAME_DATA`/`__FIELD`/`FLD`, not `window.*`); no literal comment-closer inside a block comment.
3. **PROPER VETTING before any commit:** `node tools/build.mjs` GATE OK → focused probe + FULL no-regression suite + `diag-classic` (Classic still paints, `nonBlank:346`) + **0 pageerrors** → adversarial bug-hunt, every confirmed finding fixed → THEN commit → `git push origin main` (`adhanke-star/History-Video-Game`). Never push red; fix the root cause, never weaken the probe.
4. **Citation-grade, anti-Lost-Cause history:** ≥2 sources = Verified, else Inferred/Disputed; no fabricated citations/units/ranks.
5. **Record lessons in the repo** (`DECISIONS.md`/`RUN-LOG.md`/`HANDOFF.md`/`WAKE-UP.md`/`V1-CHECKLIST.md`) — never hidden memory. **Surface (don't silently guess)** only a NEW fork that contradicts a shipped decision, is irreversible/costs money, or would waste a milestone.

## Claude Code note
You run the full vetting gate natively (Chrome works — `CODEX_SANDBOX` is unset, so `tools/guard-probe-browser.mjs` does not block). Probe gotchas: the task tmpfs throws a spurious "0MB free" ENOSPC → run probes foreground with `2>/dev/null` + `export TMPDIR="$PWD/.tmp"`; READ `tools/shots/*.json`; run probe batteries sequentially (one shared `python3 -m http.server 8765`). Use Workflows for citation-grade research+verify and adversarial bug-hunts.
