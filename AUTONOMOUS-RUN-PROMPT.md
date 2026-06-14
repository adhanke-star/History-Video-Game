# PASTE THIS AS THE FIRST MESSAGE OF A NEW CHAT (12-hour autonomous run)

---

ultracode — Autonomous, self-perpetuating ~12-hour build run for "The Civil War" (personal project, working dir `~/Desktop/Video Game`, NOT MJI; full autonomy, $0/single-file, build bar 200/100). Aaron is away ~12 hours. Build the game forward as far as possible without him — ship-quality, content-complete, fully self-verified — and never stall.

═══ STEP 1 · LOAD CONTEXT (a fresh chat knows NOTHING about prior work — everything lives on disk; load it) ═══

**READ FULLY, in this order** (small + essential):
1. `AUTONOMOUS-RUN.md` — the operating manual (prime directive, the loop, phase roadmap, guardrails, recovery). THIS governs the run.
2. `HANDOFF.md` — the ⚡ CONTINUE-HERE block (current state + next phase) + full design orientation below it.
3. `DECISIONS.md` — every fork already resolved (don't relitigate; append new ones here as you go).
4. `GRAND-STRATEGY-PLAN.md` — THE design law: 63 locked decisions (Parts I–III) + §27 the balance principle. Honor verbatim.
5. `src/00-manifest.json` + EVERY file in `src/` (`10-president-state`, `20-president-render`, `30-president-shell`, `40-economy`, `50-production`, `90-president-register`) — the code you extend; learn its idioms (bare-name globals, the four-function `xInit/xOnResolve/xRenderHTML/xWire` contract, the `_t1InitAll`/`_t1Resolve` override-register pattern).
6. `tools/build.mjs` (the build + in-memory gate) + `tools/probe-economy.mjs` and `tools/probe-production.mjs` (the empirical-probe pattern to copy) + `tools/bootprobe.mjs` + `tools/diag-classic.mjs` (the no-regression gates).
7. `data/economy.json` — the game-ready parameters (already contains the data for S1c `cottonBlockade` and S1d `manpower`).
8. Run `git log --oneline` and `git show --stat HEAD` — the build history (latest should be the docs commit on top of `b2179d0` S1b).

**SKIM (relevant sections, not cover-to-cover):**
9. `RUN-LOG.md` — §"run i" (this run's detail); skim §run h/g for the shipped 3D foundation.
10. `REVIEW-QUEUE.md` — the top (priorities + locks).
11. `HISTORICAL-DATA-ECONOMY.md` — the economy digest + 28 debate cards (content for S1c/S1d/S4).
12. `MODERN-UGG-PLAN.md` — the real-time tactical engine spec (built LAST, after S5).

**REFERENCE ON DEMAND — do NOT bulk-read (context killers); grep/Read only the sections a phase needs:**
- `HISTORICAL-DATA.md` (211KB — OOBs, weapons, USCT, historiography) — pull per system as you build.
- `civil_war_generals.html` (~710KB GENERATED deliverable) and `build/base.html` (~620KB FROZEN base) — understand them via the docs + targeted `grep`; NEVER read whole.
- Legacy/run-h docs (`DESIGN-BIBLE.md`, `GRAPHICS-RUN-CONTINUE.md`, `MODERN-UGG-KICKOFF.md`, `3D-ASSET-PLAN.md`, `BUILD-PLAN.md`, `GENERALS_HANDOFF.md`, `NEXT-RUN-PLAN.md`, `PLAYTEST-LOG.md`, etc.) — reference only if a topic arises.

**CONTEXT DISCIPLINE:** you must last ~12 hours. Read Tier-1 fully, Tier-2 sectionally, Tier-3 NEVER wholesale. Your disk state (commits + `DECISIONS.md` + `RUN-LOG.md` + `AUTONOMOUS-RUN.md`) is your real memory across context summarization — keep it current every phase, and re-read it to recover if your context gets compacted.

═══ STEP 2 · OPERATING PARAMETERS (Aaron-locked — do NOT re-ask, do NOT pop questions) ═══
Run the whole arc (S1c→S1d→S2→S3→S4→S5, then tactical P0→P5) · **always decide & log** every fork to `DECISIONS.md` with rationale (never pause mid-run) · **local commits only** (no GitHub push) · **content-complete each phase** (citation-grade research via parallel workflows → `data/*.json` + PD images, Verified/Inferred provenance, named scholars) · **balance principle §27** (simple battle core stands alone; all depth optional, advisor-managed, non-blocking, ambient teaching).

═══ STEP 3 · THE LOOP (full detail in `AUTONOMOUS-RUN.md` §3) — repeat every cycle ═══
plan the phase → (if content missing, launch a research workflow that writes to disk) → build new `src/NN-*.js` module(s) that EXTEND existing systems (bare-name globals `G`/`GAME_DATA`, never `window.G`; register per-turn ticks via the `_t1InitAll`/`_t1Resolve` overrides in `src/90-…`; surface in the President's Desk, advisor-managed + non-blocking) → `node tools/build.mjs` (must print `GATE OK`) → write + run `tools/probe-<phase>.mjs` (START `python3 -m http.server 8765` yourself + curl 200 first; drive the system over turns via `_t1Resolve`; **READ the json + png**; assert the historical asymmetry) + re-run `probe-desk.mjs` + `diag-classic.mjs` (Classic no-regression, 0 pageerrors) → fix until green → **commit locally** + append `RUN-LOG.md`/`DECISIONS.md` → **update the handoff** (`AUTONOMOUS-RUN.md` §2 + `HANDOFF.md` CONTINUE-HERE) → **ScheduleWakeup** (prompt = sentinel `<<autonomous-loop-dynamic>>`; delay 60–270s while a background workflow runs, ~1200–1800s idle heartbeat) → next cycle. **Use Ultracode workflows aggressively:** research fan-outs for content, parallel builds of independent modules, and an adversarial bug-hunt of the tick math + UI before each commit.

═══ STEP 4 · GUARDRAILS (`AUTONOMOUS-RUN.md` §5) ═══
Never commit a red build; never regress Classic or existing systems (extend, don't duplicate); commit + update-handoff per phase (revertible + recoverable); scan `src/` for a stray `*/` inside block comments before each build (it parse-bombs); `portraitFor` → `window.portraitFor` from modules; THREE loads async; honor `reduceMotion`/`gfxQuality`; probes flake on headless-swiftshader `page.goto` (bootprobe goto = 60s — retry / A/B vs `build/base.html` to tell flakiness from a real regression). STOP ONLY when the arc is complete, ~12h elapsed, or you hit a truly irreversible blocker / a genuine design contradiction → then `PushNotification` Aaron, write the state to `AUTONOMOUS-RUN.md`, and stop. Otherwise NEVER stop.

═══ BEGIN ═══
After reading Step-1 Tier-1 + `git log`, confirm in 3 lines: (a) current state + latest commit, (b) the next unbuilt phase, (c) your 3-line plan for **S1c (cotton / blockade / foreign trade)**. Then start the loop and build continuously for the full session. Do not stop to check in.
