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
- **`V1-CHECKLIST.md`** — the APPROVED, ordered v1 feature-complete roadmap (run-k Q&A, DECISIONS **D61**). **This is the build roadmap autonomous runs drive to completion** (Phase A connect-layers → B tactical depth → C breadth → D full hex → E strategic S3–S5 → H graphics/footage/audio → I loot → J polish). Open items + the locked operating model live here + in D61.
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

## Git / saving — commit AND push to GitHub, but ONLY after PROPER VETTING
The remote is **LIVE**: `origin` → **github.com/adhanke-star/History-Video-Game** (private), branch `main`. **Every milestone is committed AND pushed (`git push origin main`) — but ONLY after PROPER VETTING passes** (Aaron standing instruction, 2026-06-14):

> **PROPER VETTING gate:** `node tools/build.mjs` → **GATE OK** (parse/hex/collision) → the milestone's focused probe **+ the full no-regression suite + `diag-classic` green + 0 pageerrors** (READ the JSON — never assume) → **adversarial bug-hunt** workflow with every confirmed finding fixed → THEN commit → THEN `git push origin main`.

Never push an unvetted / red / regressed / pageerror build. `tools/shots/*` and `.tmp/` are gitignored, so the pending-changes view stays at ~0; `git log` + the GitHub remote are the durable record.

## Universal AI implementer standards — Claude / Codex / Copilot / DeepSeek / Cline / any VS Code agent
**Each AI tool has a native entrypoint file that points to THIS file as the single source of truth — `CLAUDE.md` (Claude Code), `AGENTS.md` (Codex), `.github/copilot-instructions.md` (GitHub Copilot), `.clinerules` (Cline / DeepSeek).** They are thin pointers (the canonical read-order + the hardest non-negotiables); if the read-order or the non-negotiables below change, update them too. Every model implementing Aaron's instructions follows the same operating contract, regardless of vendor or model size:

- **Repo-ground first:** read `START-HERE.md`, `HANDOFF.md` top block, `WAKE-UP.md` top block, current `RUN-LOG.md` top entries, latest `DECISIONS.md`, `V1-CHECKLIST.md`, `src/00-manifest.json`, and the files/probes directly touched by the task before editing.
- **Work from reversible steps:** inspect before changing, keep edits scoped, preserve user/unrelated changes, make source edits in `src/` and data edits in `data/`, and touch generated `civil_war_generals.html` only when the repo's build/probe reality requires it and the source path is also aligned.
- **Recursive repo-learning loop:** read prior decisions → form a small hypothesis/plan → implement the smallest safe slice → run probes/builds → study failures and screenshots/JSON → correct root causes → write the lesson back into `DECISIONS.md`, `RUN-LOG.md`, `HANDOFF.md`, `WAKE-UP.md`, or the relevant checklist. "Learning" means repo-visible notes and improved probes; never rely on private hidden memory.
- **Self-audit every pass:** compare the diff against the user request, scan for unintended gameplay/simulation changes, check accessibility/reduceMotion/performance implications, read probe JSON instead of assuming, and search for warnings/pageerrors/regressions before reporting success.
- **Vetting is mandatory:** `node tools/build.mjs` or `--check` as appropriate, focused probe(s), full no-regression where the change can affect shared behavior, `diag-classic` when visual/engine paths are touched, 0 pageerrors, and adversarial bug-hunt for nontrivial code. If a gate fails, fix the root cause; do not weaken the probe to pass.
- **Quality bar:** no placeholder history, no fabricated citations, no unclear-license assets, no accounts/trials/downloads unless explicitly approved, no broad refactors without need, and no visual/UI work that is inaccessible, unreadable, or unverified on real output.
- **Model routing:** Codex/high-reasoning owns architecture, simulation, balance, tactical/strategic contracts, probe design, bug hunts, WCAG judgment, and final integration. Cline/DeepSeek/lower models may execute only bounded packets with exact files, steps, constraints, acceptance criteria, commands, expected outputs, do-not-touch lists, and rollback guidance; they must stop and report if the packet is ambiguous or a gate is red.
- **Reporting discipline:** every handoff/final report names files changed, commands run, pass/fail results, unverified areas, residual risks, and any docs updated. Do not claim completion for work that was not run or inspected.

## Priority picker + model routing — use when Aaron says "pick from the list"
When Aaron asks a new chat to choose from a priority list, use this list (cross-check `V1-CHECKLIST.md` for the ordered roadmap). *(`MASTER-TASK-LIST.md` was retired 2026-06-21 — it duplicated this picker + the roadmap + the live head; it is now a pointer stub.)* These are the work items Codex is expected to handle better than DeepSeek/Cline because they require architecture, balance judgment, cross-module repo reasoning, probe design, or high-risk regression control.

**Codex / high-reasoning preferred**
- **Vicksburg / siege campaign architecture:** decide single-phase vs multi-phase vs siege-shaped pattern; design data/OOB/terrain/timing/probes without combat fudges.
- **Chickamauga / Chattanooga design pass:** decide whether this is one battle, linked battles, or phases; solve theater framing, terrain lessons, balance, and roster placement.
- **Modern battles selectable in Classic hex / Phase D start:** risky frozen-Classic bridge work; requires careful source reading and regression discipline.
- **Tactical Engineering Corps on the field:** pontoons, entrenchments, abatis, obstacle clearing, B5 slider interaction, and strategic engineering linkage.
- **Full-campaign playthrough probe:** long-running cross-layer gate from strategy to battle result to saves/victory; likely flaky and root-cause heavy.
- **USCT battle arc design:** The Crater, New Market Heights, Olustee, Nashville; historically sensitive and mechanically distinct.
- **S3 alt-history engine:** divergence tiers, hinge forks, emergent-only toggle, and divergence log.
- **S4 codex/glossary architecture:** multi-axis codex by timeline/topic/person/battle with provenance and cross-links.
- **Comprehensive WCAG 2.2 AA audit plan + first pass:** broad UI judgment and remediation sequencing.
- **Phase H asset-ingestion pipeline:** extend `tools/build.mjs` for tiered/compressed PD media with offline fallback while preserving the single-file deliverable.

**Recently completed:** D85 closed the uncommitted D77-D84 leftover gate and added a procedural 3D objective beacon. C4 (D84) is done: single-phase scenario builder, validation, JSON import/export, local slots, explicit custom-ID launch contract, focused probe, and full no-regression gate. `tools/probe-tactical-visuals.mjs` now captures 8 scenes and asserts the 3D beacon at each objective.
- **Western theater roster/order/probe framework:** lock Shiloh → Vicksburg → Chickamauga/Chattanooga → Atlanta/March → Franklin/Nashville ordering and guardrails.

**DeepSeek/Cline/lower-model suitable only when packeted by Codex**
- Draft source dossiers from specified URLs/books into a fixed template.
- Fill teaching-card copy after Codex defines schema, sources, and acceptance criteria.
- Mechanical help-copy updates after roster changes.
- Add simple probe assertions copied from an existing probe pattern.
- Run exact gate commands and paste exact outputs.
- Screenshot cataloging / artifact inventory.
- Small JSON cleanup with strict acceptance criteria.

**Current loot status:** the Armory and Cannon Corps already use loot-style rarity tiers for purchasable weapons/artillery, but **Phase I standalone loot/survival is not built**: no standalone rarity-tiered drops/inventory, no light survival layer, and no Oregon-Trail-style journey mode. It remains open/deferred in `V1-CHECKLIST.md` and `MASTER-TASK-LIST.md`.

---

## ▶ PASTE THIS INTO A NEW CHAT (zero-context, looping v1 build run — Opus 4.8 / ultracode / high effort)

**Live head as of this edit (2026-06-19): Phase A ✅ + Phase B ✅; Phase C has the Eastern marquee complete through Malvern Hill, Shiloh as the first Western battle, and Custom Battle Builder C4 complete. D85 closed the uncommitted lower-model/session-leftover gate by auditing and vetting the D77-D84 C4/Malvern/Chancellorsville/custom-builder/visual/help work; one Gettysburg probe-output bug was fixed with no gameplay change. Demo-polish includes T9 audio, T10 flags/insignia, portraits, save/help work, the tactical cohesion mini-pass, the tactical roster guard, and the live tactical visual probe. Latest graphics pass adds a procedural 3D `objectiveBeacon` in `src/tactical/T0-field-sandbox.js`; `tools/probe-tactical-visuals.mjs` now captures 8 scenes and asserts the beacon at objective coordinates with 0 pageerrors and `textureWarnings:0`. Verified gate: build, custom builder, roster, field, historical battle probes, officers/logistics/arms/presets/csplayer/campaign-link, tactical visuals, broad legacy strategy/tactical probe sweep, boot/t1, Classic diag, `git diff --check`, and `node tools/build.mjs --check` all green; known residual console noise is the tolerated resource/favIcon 404 and Chromium screenshot warnings documented in handoff artifacts. Blender is closed and does NOT need reopening for current code/browser/Three.js work; reopen only for an explicit future Phase-H asset job. Next priority = Codex-owned Phase C breadth (Western theater / Vicksburg architecture), C3 USCT scenario design, or another priority-picker item.** The block below is self-updating — it points at `HANDOFF.md`'s top block + `git log` for live state, so it stays correct as milestones ship.

## ▶ PASTE THIS INTO A NEW CHAT (remaining-work map + model-routing plan — Codex / Cline / DeepSeek friendly)

> **High effort.** You are Codex working in `~/Desktop/Video Game`. Your task is **not to implement yet**. First produce a practical remaining-work map for the whole project that maximizes Codex usage for reasoning-heavy coding and packages simpler work so Cline, DeepSeek, or a lesser model can execute it safely from clear instructions.
>
> **Load context first:** read `START-HERE.md` including the Universal AI implementer standards, `HANDOFF.md` top block, `WAKE-UP.md` top block, `RUN-LOG.md` top entry, `V1-CHECKLIST.md`, latest `DECISIONS.md` entries, `src/00-manifest.json`, and the relevant `src/tactical/*.js` / `tools/probe-*.mjs` files. Note that as of 2026-06-19 the D77-D84 leftover gate is closed, the 3D flag texture warning is fixed, `probe-tactical-visuals` fails on that warning, and the visual probe now captures 8 scenes with 3D objective-beacon assertions. Blender is closed; do not require Blender unless a future Phase-H asset task explicitly needs it.
>
> **Output required:** make a table of all remaining V1 work grouped by phase (`C`, `D`, `E`, `F/G`, `H`, `I`, `J`). For each work item include: complexity (`S/M/L/XL`), risk (`low/med/high`), dependencies, files likely touched, required probes, whether it needs historical research, and the **recommended model/tool owner**.
>
> **Routing rules:** assign **Codex/high reasoning** to architecture, simulation design, balance tuning, cross-module changes, bug hunts, probe design, build-system work, WCAG fixes that require UI judgment, and anything touching tactical/strategic contracts. Assign **Cline/DeepSeek/lower model** only to prepackaged bounded tasks such as documentation refreshes, straightforward data entry after Codex has written the schema/spec, mechanical probe-output summarization, CSS copy tweaks with exact before/after instructions, and test fixture additions with exact expected results.
>
> **For each Cline/DeepSeek-suitable task**, write an implementation packet that both tools can understand: goal, exact files, exact constraints, step-by-step edits, acceptance criteria, commands to run, "do not touch" list, expected JSON/output checks, rollback guidance, and a self-audit checklist. Do not ask those models to invent architecture, rebalance combat, choose history claims, or make broad refactors. Require them to stop and report if the packet becomes ambiguous or a gate turns red.
>
> **For Codex tasks**, write a shorter implementation brief: problem, design choices to decide, likely seams, risk list, probes to create/extend, and the full vetting gate. Keep the plan grounded in the current repo. End with the recommended next 3 milestones in order and why.

> **ultracode — high effort.** You are Opus 4.8 driving an autonomous, **self-looping** build run for **"The Civil War"**, a single-file teaching wargame at `~/Desktop/Video Game` (a personal project — NOT MJI). $0 / single-file (several MB is fine) / no build step beyond `tools/build.mjs`. You have **ZERO context — everything lives on disk; load it first.** The roadmap (`V1-CHECKLIST.md`, DECISIONS **D61**) is fully cleared, so you don't re-litigate scope — you **build it, beautifully, to completion, looping**. **Bar: best appearance AND function possible — go above and beyond the basics in EVERY aspect. Nothing ships ugly, minimal, or barebones.**
>
> **STEP 1 — LOAD CONTEXT (in order, READ them):** (1) **`START-HERE.md`** (this map), including the Universal AI implementer standards. (2) **`HANDOFF.md` top block** for the newest live head. (3) **`V1-CHECKLIST.md`** — the approved roadmap/status. (4) **`DECISIONS.md`** — read the **latest D## first** (currently **D85** leftover gate + 3D objective beacon), then **D84-D80** for C4/priority-picker/Malvern/Chancellorsville/roster, **D79-D77** for Universal AI standards, flag-warning fix, and tactical/demo cohesion, **D76-D73** for Antietam/gun-model/Fredericksburg, **D72-D61** for Phase B/A operating model, and **D54/D55**; append new decisions, never relitigate. (5) **`AUTONOMOUS-RUN.md`** §1–§3 + §8, especially §1A. (6) `MODERN-UGG-PLAN.md` + `GRAND-STRATEGY-PLAN.md` §27. (7) `src/00-manifest.json` + the `src/*.js` you'll extend (esp. `src/tactical/T0-field-sandbox.js`, `T1-bull-run.js`, `T8-phases.js`, `T9-audio.js`, `T10-flags.js`, `src/92-help-overlay.js`, `data/*.json`) + `tools/build.mjs` + `tools/probe-*.mjs`. (8) `git log --oneline -15` + any `.tmp/*design*.md` drafts the handoff points to.
>
> **STEP 2 — THE OPERATING MODEL (DECISIONS D61 — obey it):**
> - **Build the V1 checklist IN ORDER**, starting at the first unchecked item (consult `HANDOFF.md`'s top block + `git log` for the live head — **Phase A + ALL of Phase B (B1–B6) are done; next = Phase C tactical BREADTH** [more real-time battles on the now-mature data-driven engine — mostly new scenario DATA on the proven T0–T7 stack, the bullrun1 pattern]). **C** breadth = Eastern marquee first per D69 (Antietam · Fredericksburg · Gettysburg · Chancellorsville) + **Western** + USCT battles + a custom-battle builder → **D** a **FULL co-equal hex/turn tactical engine** → **E** strategic S3–S5 (alt-history · codex/glossary/tutorial/presets · the dedicated full WCAG-AA pass · victory + graded report + Reconstruction) → **F/G** content systems + theaters → **H** the "make it come to life" graphics + footage + audio pass → **I** loot/survival → **J** polish/meta. (Full detail per item = `V1-CHECKLIST.md`.)
> - **Clear-then-continuous.** The MAJOR forks are already cleared. So **decide-&-log sub-choices within a checklist item and keep moving**, executing the whole cleared scope continuously (loop milestone after milestone). **PAUSE + surface (`AskUserQuestion` if Aaron is present, else `PushNotification` + write `~/Desktop/Video Game/DECISION-NEEDED-<topic>.md`) ONLY** for a NEW fork that: is uncovered by the checklist, **contradicts a prior shipped decision/teaching** (the live precedent: **B-3's logistics broke the D58/D64 "fog aids the defender" teaching** under fog — surfaced, and Aaron chose the fix; D66), is irreversible/costs money, or is so ambiguous a wrong guess wastes a whole milestone. On such a pause, keep making progress on OTHER cleared items if any; else stop and notify.
>
> **STEP 3 — THE PER-MILESTONE LOOP (run it for each checklist item, in order):** plan the item from `V1-CHECKLIST.md` → (a research workflow ONLY if citation-grade content is genuinely missing) → author NEW `src/**/*.js` module(s) that **EXTEND** the engine via **guarded, no-op-when-inactive seams** (or, where authorized, OVERRIDE a frozen `build/base.html` fn via a NEW module — **never edit `build/base.html`**; new tactical work lives in `src/tactical/`) → `node tools/build.mjs` until **`GATE OK`** → write/extend `tools/probe-<item>.mjs`, **start `python3 -m http.server 8765` yourself**, run probes **foreground with `2>/dev/null`**, and **READ `tools/shots/*.json`** (never assume) + the full no-regression suite + `diag-classic` (Classic must still paint) + **0 pageerrors** → for any balance change, run a **headless A/B sweep + LOG every number** → **adversarial bug-hunt via a `Workflow`** (diverse-lens finders × default-refute verify + a completeness critic, scaled to the change) and **FIX every confirmed finding, then re-probe** → run **`wcag-auditor`** on new UI → **commit + `git push origin main`** (remote `adhanke-star/History-Video-Game`, private) ONLY after the PROPER VETTING gate passes → append `RUN-LOG.md`/`DECISIONS.md`, refresh `AUTONOMOUS-RUN.md` §2 + `HANDOFF.md`'s top block + tick the `V1-CHECKLIST.md` box + refresh root **`WAKE-UP.md`** → **`ScheduleWakeup`** with the sentinel **`<<autonomous-loop-dynamic>>`** to fire the next iteration → next item.
>
> **SUBAGENT MODEL ROUTING (DECISIONS D63 — HYBRID, standing):** the main session stays on **highest Opus** always. Route subagents by competency: **Opus** on reasoning-critical legs (adversarial bug-hunt finders + verifiers + the completeness critic, design/judge panels, content-research VERIFY passes) — pass NO model override so they inherit Opus; **Sonnet** on bounded/mechanical legs (`wcag-auditor`, Explore/code-search, file/probe-log summarization, first-pass source gathering, spec'd mechanical transforms) — pass `{model:'sonnet'}` (`Workflow` `opts.model` / `Agent` `model`). Efficiency only where it can't move the standard.
>
> **THE ABOVE-AND-BEYOND BAR (apply to EVERY milestone — non-negotiable):** **(Function)** robust edge-handling (null/empty/NaN/extreme), determinism where probes need it, no regressions ever (`diag-classic`), the Intel UHD-617 perf floor (instancing/LOD/culling/perf presets), genuinely deep simulation + teaching (citation-grade, multi-voice, Verified/Inferred tags, anti-Lost-Cause). **(Appearance)** the period **broadsheet / engraving** aesthetic everywhere — engraved procedural portraits, antique-map terrain, muted period palette, considered typography; smooth animation that **honors `reduceMotion`**; polished, legible HUD/UI; **full WCAG 2.2 AA baked in AS YOU BUILD** (keyboard, visible focus, ≥4.5:1 text / ≥3:1 non-text, ARIA + live regions, CVD-safe cues never color-alone). The big PD-photo/footage layer is Phase H (gameplay-first), but **make even the code-only art beautiful now.**
>
> **GUARDRAILS / TOOLING:** NEVER regress Classic (`diag-classic` every change). Frozen-engine overrides = new modules only, gated, reverted on any regression. New tactical work = **guarded seams in T0/T1 + a new module, no-op when the scenario/campaign context is inactive** (so the standalone sandbox/Bull-Run/fog/auto-pause/AI probes stay byte-identical). `_SAVE_VER` bumps OK with idempotent lazy migration. Bare-name globals (`G`/`GAME_DATA`/`__FIELD`/`FLD`, not `window.*`); THREE loads async (no `new THREE.*` at chunk top level); never put a literal comment-closer inside a block comment (parse-bomb). **Use `Workflow`/subagents aggressively.** **Tooling gotchas:** the task-output tmpfs throws a **spurious "0MB free" ENOSPC** — run probes foreground with `2>/dev/null` + `export TMPDIR="$PWD/.tmp"`, READ `tools/shots/*.json` directly, verify commits via `git log`, and clear `/private/tmp/claude-501/*/tasks/*.output` (`-mmin +2`, sparing the in-flight file) if Bash blocks; **foreground `sleep` is blocked** (use `run_in_background` or an `until`-loop); for offline headless **sweep** scripts use `waitUntil:'domcontentloaded'` (the THREE-CDN `'load'` wait times out offline); **run probe batteries SEQUENTIALLY** (one server, shared `shots/*.json`).
>
> **CONFIRM in ≤4 lines, then GO (don't wait on me):** (a) latest commit + what's playable now; (b) the first unchecked `V1-CHECKLIST.md` item you're starting (per `HANDOFF.md`'s top block — currently Phase C tactical breadth, Eastern marquee first) + your design for it (surface a fork only if it hits a NEW/contradicting one per D61); (c) your appearance+function above-and-beyond plan for it; (d) confirm the loop (per-milestone vet → push → `ScheduleWakeup <<autonomous-loop-dynamic>>`). Then build, beautifully, milestone after milestone.
