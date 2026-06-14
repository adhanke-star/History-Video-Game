# START HERE — "The Civil War" (master index)

**This is the ONE file to open first. It tells every new chat exactly which documents are CURRENT and which are history, and the order to read them. If a doc isn't listed under "Canonical" below, treat it as archived — do not follow it as live strategy.**

The game: a teaching wargame in three layers — **owner-mode grand strategy** (you are President Lincoln/Davis: economy, blockade, manpower, diplomacy, politics) + **real-time UG:G-style battles** (the tactical engine, built last) + a **PhD-level history & alternate-history seminar**. Personal project, $0/single-file, build bar 200/100.

---

## ⭐ The source of truth — read these in this order (a fresh chat has zero context)
1. **`START-HERE.md`** ← you are here (the map).
2. **`AUTONOMOUS-RUN.md`** ← **THE operating manual.** Live state (§2), the build loop (§3), phase roadmap (§4), guardrails (§5), and the **outstanding BACKLOG (§7)**. *This governs the run.* If you read one file, read this.
3. **`DECISIONS.md`** — every design fork already resolved (don't relitigate; append new ones here).
4. **`GRAND-STRATEGY-PLAN.md`** — the **design LAW**: 63 locked decisions + §27 the balance principle. Honor verbatim.
5. **`src/00-manifest.json` + every `src/*.js`** — the code you extend (the four-function module contract + the `_t1InitAll`/`_t1Resolve` override pattern).
6. **`tools/build.mjs` + `tools/probe-*.mjs`** — the build gate + the empirical probes (the verification discipline).
7. `git log --oneline` — the commit history (each phase is one commit).

## 📚 Canonical reference (current — pull the section a task needs; don't bulk-read)
- **`MODERN-UGG-PLAN.md`** — the real-time tactical battle engine spec (the UG:G layer, built LAST, phases P0–P5).
- **`RUN-LOG.md`** — chronological build log (newest run at top).
- **`HANDOFF.md`** — the new-chat handoff (the ⚡ CONTINUE-HERE block mirrors `AUTONOMOUS-RUN.md` §2).
- **`HISTORICAL-DATA.md`** (211KB — OOBs, weapons, USCT, historiography), **`HISTORICAL-DATA-ECONOMY.md`**, **`HISTORICAL-DATA-DIPLOMACY.md`** — citation-grade content. Grep per system; never bulk-read.
- **`REVIEW-QUEUE.md`** — priorities + locks.
- **`DEPLOY.md`** — how the single-file deliverable ships.
- **`data/*.json`** — game data (`economy`, `diplomacy`, `manpower-teaching`, `weapons`), injected as `GAME_DATA`.
- **`civil_war_generals.html`** — the GENERATED, playable deliverable (open-and-play; rebuilt by `tools/build.mjs`; never hand-edit).
- **`build/base.html`** — the FROZEN run-h foundation (Classic + 3D engine). **NEVER edit.**

## 🗄️ Legacy (in `legacy/` — superseded run-g/run-h material; reference only, NOT live strategy)
Old kickoff prompts, the pre-modularization plans, the graphics/3D/Blender/asset notes, and earlier handoffs. They explain *how we got here* but do **not** describe current strategy — `AUTONOMOUS-RUN.md` §7 supersedes all of them. Files: `legacy/{AUTONOMOUS-RUN-PROMPT, NEXT-CHAT-PROMPT, NEXT-RUN-PLAN, CC-KICKOFF, GRAPHICS-RUN-PROMPT, GRAPHICS-RUN-CONTINUE, MODERN-UGG-KICKOFF, DESIGN-BIBLE, BUILD-PLAN, 3D-ASSET-PLAN, ASSET-PROMPTS, BLENDER-MCP-SETUP, BLENDER-CONNECT-STEPS, AUDIT-PROTOCOL, GENERALS_HANDOFF, PHASE4_HALT, PLAYTEST-LOG}.md`.

---

## Naming convention (going forward — keep the root clean)
- **`START-HERE.md`** — the only entry point. Update it whenever a doc's status changes.
- **One operating manual** (`AUTONOMOUS-RUN.md`), **one design law** (`GRAND-STRATEGY-PLAN.md`), **one decisions log**, **one run-log**, **one handoff**. Do not spawn parallel "PLAN/PROMPT/KICKOFF/CONTINUE" variants — append to the canonical file instead.
- Content files are prefixed **`HISTORICAL-DATA-<topic>.md`**; code is in **`src/NN-name.js`** (NN = load order); data in **`data/<topic>.json`**; tools in **`tools/<verb>-<topic>.mjs`**.
- Anything superseded goes to **`legacy/`** immediately, so the root only ever shows what's current.
- **Proposed deeper structure (next session, optional):** `docs/operating/` · `docs/design/` · `docs/research/` · `docs/handoff/` — deferred so the build's paths and the read-order references don't churn mid-flight; the root/`legacy` split already removes the confusion.

## Git / saving
Local commits only — **no GitHub remote is configured** (chosen for this project). Every change is committed the moment it's verified; `git log` is the durable record. `tools/shots/*` and `.tmp/` are gitignored, so the pending-changes view stays at ~0. To add off-machine backup, set up a remote (a human decision — ask the owner first).

---

## ▶ PASTE THIS INTO A NEW CHAT (zero-context autonomous kickoff)

> **ultracode** — Autonomous build run for "The Civil War" (personal project at `~/Desktop/Video Game`; NOT MJI). Full autonomy, $0/single-file, build bar 200/100. You have ZERO context — everything lives on disk; load it, then execute the backlog continuously without me.
>
> **STEP 1 — LOAD CONTEXT, in order:** (1) `START-HERE.md` — the master index (which docs are canonical vs legacy). (2) `AUTONOMOUS-RUN.md` — THE operating manual: live state (§2), the build loop (§3), guardrails (§5), and the **OUTSTANDING BACKLOG (§7)** you will execute. (3) `DECISIONS.md` — every resolved fork (don't relitigate; append new ones). (4) `GRAND-STRATEGY-PLAN.md` — the design LAW (63 locked decisions + §27 balance). (5) `src/00-manifest.json` + every `src/*.js`, `tools/build.mjs` + `tools/probe-*.mjs`. (6) run `git log --oneline -15`.
>
> **STEP 2 — EXECUTE THE BACKLOG (`AUTONOMOUS-RUN.md` §7) autonomously, in order:** the BATTLE LAYER first (Cannon Corps → Engineering Works Corps → terrain-cover hierarchy → wire The Armory into battle → targeting → battle-day conditioning application), then the strategic arc (S2 advisor/cabinet + 3-layer morale + 1864 election → S3 alt-history → S4 education/codex → S5 victory + full bridge), then tactical P0–P5. For EACH item: plan → (launch a research workflow if content is missing) → build a new `src/NN-*.js` module that EXTENDS existing systems (NEVER edit `build/base.html`; bare-name globals; register ticks via the `_t1InitAll`/`_t1Resolve` overrides) → `node tools/build.mjs` (must print `GATE OK`) → write+run a `tools/probe-<item>.mjs` you READ (start `python3 -m http.server 8765` yourself; `2>/dev/null`; read `tools/shots/*.json`) + the full no-regression suite (`diag-classic` + `probe-desk` + all `probe-*`) → fix until green, 0 pageerrors → commit locally + append `RUN-LOG.md`/`DECISIONS.md` → update `AUTONOMOUS-RUN.md` §2/§7 + `HANDOFF.md` → `ScheduleWakeup` (sentinel `<<autonomous-loop-dynamic>>`) → next item.
>
> **PARAMETERS (locked — don't re-ask):** run the whole backlog; always decide & log forks to `DECISIONS.md` (never stall mid-run); local commits only (no remote); content-complete each system (citation-grade data, named scholars, Verified/Inferred); honor §27 balance (the simple battle core stands alone, all depth optional/advisor-managed/non-blocking/ambient-teaching). Use **ultracode workflows aggressively** (research fan-outs, parallel module builds, an adversarial bug-hunt before each commit). NEVER regress Classic (`diag-classic` every change). Git stays clean (`tools/shots/*` + `.tmp/` gitignored; commit promptly). **Tooling note:** the harness task-output tmpfs throws a spurious "0MB free" ENOSPC — run probes foreground, read `tools/shots/*.json`, verify commits via `.git/logs/HEAD`, and clear `/private/tmp/claude-501/*/tasks/*.output` if Bash blocks.
>
> **CONFIRM in 3 lines:** (a) current state + latest commit, (b) the first unbuilt backlog item, (c) your 3-line plan for it. Then build continuously. Do not stop to check in.
