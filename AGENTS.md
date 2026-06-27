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
3. **PROPER VETTING before any commit:** `node tools/build.mjs` GATE OK → focused probe + `npm run vet:noreg` (FULL no-regression suite, `probe-full-campaign`, `diag-classic` with Classic still painting, **0 pageerrors**) → adversarial bug-hunt, every confirmed finding fixed → THEN commit → `git push origin main` (`adhanke-star/History-Video-Game`). Never push red; fix the root cause, never weaken the probe.
4. **Citation-grade, anti-Lost-Cause history:** ≥2 sources = Verified, else Inferred/Disputed; no fabricated citations/units/ranks. (Recurring trap: a commander's rank/sector AT THE BATTLE — verify it; bug-hunts have caught "Brig. Gen." for an officer who was a Colonel that day, and a general placed at the wrong redan.)
5. **Record lessons in the repo** (`DECISIONS.md`/`RUN-LOG.md`/`HANDOFF.md`/`WAKE-UP.md`/`V1-CHECKLIST.md`) — never hidden memory. **Surface (don't silently guess)** only a NEW fork that contradicts a shipped decision, is irreversible/costs money, or would waste a milestone.

## Model routing (updated D145)
The main reasoning/integration loop stays on the highest-quality model, specifically **5.5** for complex architecture, important code, user-facing text, historical judgment, UI/UX design decisions, accessibility judgment, bug hunts, final review, and any irreversible or quality-critical work. Use token-efficient models only for bounded helper packets where quality cannot be harmed: `rg`/search summaries, file inventories, probe-log summaries, mechanical doc syncs, exact-schema data cleanup, first-pass source gathering, and repetitive fixture/probe scaffolding. Every helper/subagent/workflow call must explicitly set model **and** effort. Smaller models never own architecture, combat balance, historical claims, UX direction, accessibility judgment, or final integration; they produce packets that 5.5 verifies.

## Codex Cloud / full-access probe policy (updated 2026-06-27)
Aaron has granted dangerous/full-access permissions for this repo. Prefer **Codex Cloud or another full-access, non-Seatbelt session** for most real implementation work and for the full browser-probe gate. The required probe gate is still mandatory, but it should run where Chrome/Playwright are allowed instead of asking Aaron to babysit an 8 GB local Mac.

- Before browser vetting, confirm the environment is full-access: `CODEX_SANDBOX` must be unset or not equal to `seatbelt`. If it is `seatbelt`, restart/reconfigure the session with sandboxing disabled; do **not** weaken `tools/guard-probe-browser.mjs`.
- Browser probes are allowed and expected in full-access sessions: `probe-*.mjs`, `diag-classic`, `bootprobe`, `t1probe`, tactical visuals, sweeps, and screenshot/canvas artifact checks. Run them foreground with `2>/dev/null` + `export TMPDIR="$PWD/.tmp"`; start one shared `python3 -m http.server 8765`; READ `tools/shots/*.json`; trust exit codes plus the printed/JSON `ok` and `pageerrors` summaries.
- Keep heavy probe batches serialized unless the cloud runner is explicitly sized for parallel Chrome. Fix harness/resource flakes at the root; never mark a red probe green.
- After a cloud milestone is committed and pushed, the local Mac copy must be fast-forwarded before any local work continues: on the Mac run `git fetch origin && git status --short --branch && git pull --ff-only origin main` from `~/Desktop/Video Game`. If the Mac has local dirty edits, stop, inspect/stash/commit them first, and never overwrite unreviewed local work.

## Recurring gotcha
Adding a new historical battle? You MUST add its id to the `EXPECTED` baseline in BOTH `tools/probe-tactical-roster.mjs` AND `tools/probe-custom-battle-builder.mjs` (the latter goes RED otherwise — it asserts the historical registry is unchanged). This has bitten D86/D88/D90.
