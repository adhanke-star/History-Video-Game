# AUTONOMOUS-RUN.md — the 12-hour max-productivity build plan ("The Civil War")

**Written run i (2026-06-13). This is the operating manual for a long, unsupervised, self-perpetuating autonomous build run.** Aaron is away ~12 hours and wants the strategic Owner-Mode war built as far as possible, ship-quality, content-complete, fully self-verified. Personal project — NOT MJI. Ultracode on. $0/single-file. Build bar **200/100 — go above and beyond.**

---

## 0 · THE PRIME DIRECTIVE
Build the game forward, continuously, for the whole session, and **never stall waiting on Aaron.** Resolve every fork yourself (log it), gate and self-verify every change, commit each milestone locally, and keep going phase after phase until the strategic arc (S1c→S5) and then the tactical engine (P0→P5) are done, or you genuinely cannot proceed without a human decision on something irreversible. Quality is non-negotiable; speed is the goal *within* quality.

## 1 · OPERATING PARAMETERS (Aaron-locked — do not re-ask)
- **Run the whole arc** — S1c→S1d→S2→S3→S4→S5, then tactical P0→P5. Stop only at: the arc is complete, ~12h elapsed, or a truly irreversible blocker.
- **Always decide & log** — never pause mid-run for a design fork. Make the best call, append it to `DECISIONS.md` with rationale (mark `[CLAUDE]`). Aaron overrides in review.
- **Local commits only, no push** — Aaron confirmed (no GitHub remote). Commit each milestone locally with a clear message.
- **Content-complete each phase** — real citation-grade data (Verified/Inferred provenance, named scholars) + PD images, gathered via research workflows, written to disk *before/while* building the system. Never ship placeholder numbers as if real.
- **Above and beyond** — polish to ship-quality each phase: period art (R30), ambient teaching (R26), ant the balance principle (§27: simple core stands alone, all depth optional/advisor-managed/non-blocking).

## 2 · STATE AS OF THIS HANDOFF (run i — verified + committed)
Commits: `673894f` S0 · `3a6aad6` S1a · `b2179d0` S1b (+ docs). Tree clean.
- **Build system (data-driven, single-file):** `build/base.html` (FROZEN run-h monolith — Classic + Modern 3D + run-h chunks; NEVER edit) + `data/*.json` (injected as `GAME_DATA`) + ordered `src/*.js` (manifest `src/00-manifest.json`) → `tools/build.mjs` concatenates, splices before the engine-end anchor, gates IN MEMORY (parse/hex/collision; `overrides` allowed 2×), writes `civil_war_generals.html` (the deliverable; kept committed for open-and-play).
- **S0 President's Desk** (`src/10/20/30`): `G.campaign.president` (sibling of clock/muster/warroom; rides the save, no `_SAVE_VER` bump). War Department **expanded in place** → 7-tab desk (The War Effort · The Treasury · War Room · 1864 Clock · Muster Roll · Cabinet · Theater Map). Between-battles auto-surface/one-click-skip interstitial. Cabinet = 4 engraved advisors + per-domain Delegate toggle (the R25 seed pattern).
- **S1a finance core** (`src/40-economy.js`, `G.campaign.economy`): 3 funding levers (bonds/taxes/press) → **emergent inflation asymmetry** (US ×1.13 anchored / CS ×87.5 spiral over 12 turns); inflation→`clock.weariness`. Treasury tab; Secretary delegated by default; teaching card.
- **S1b production** (`src/50-production.js`, `G.campaign.production`): extends the War Room nodes → asymmetric matériel (US well-found; CS iron-ceiling + import + irreversible rail decay → ragged/hungry); CS hunger→weariness. War Production block in the overview.
- **Content on disk:** `data/economy.json` (sides/finance/production/cottonBlockade/manpower/timeline/28 teachingCards/designerGaps) + `HISTORICAL-DATA-ECONOMY.md` (digest). `HISTORICAL-DATA.md` (211KB: Bull Run OOB, weapons, USCT, historiography). `data/economy.json` already contains the data for S1c (cottonBlockade) and S1d (manpower).

## 3 · THE LOOP (run this every cycle)
For each phase, in order:
1. **Plan** the phase from `GRAND-STRATEGY-PLAN.md` (the design law) + this file's roadmap. Sub-divide if large (like S1a/S1b).
2. **Content** — if the data isn't already in `data/*.json`/`HISTORICAL-DATA*.md`, launch a **research workflow** (8-ish parallel citation-grade agents → synthesis writes `data/<topic>.json` + a `HISTORICAL-DATA-<TOPIC>.md` digest to disk). Run it in the background; build other parts meanwhile.
3. **Build** — author new `src/NN-*.js` module(s) (bare-name globals `G`/`GAME_DATA`, never `window.G`; unique helper-name prefixes; NO literal comment-closer inside block comments; extend existing systems, don't duplicate — register ticks via the `_t1InitAll`/`_t1Resolve` overrides in `src/90-president-register.js`). Add to `src/00-manifest.json` (+ `overrides` if redeclaring a base fn). Surface in the desk (a tab or an existing overview); keep it advisor-managed + non-blocking (§27).
4. **Gate** — `node tools/build.mjs` (must print `GATE OK`; it parse/hex/collision-checks in memory before writing). Fix any failure; never proceed red.
5. **Verify** — write a focused empirical `tools/probe-<phase>.mjs` (model on `probe-economy.mjs`/`probe-production.mjs`: boot real Chrome on :8765 — **start `python3 -m http.server 8765` yourself + curl 200 first**; run the system over turns via `_t1Resolve`; assert the intended behavior + the historical asymmetry; screenshot the UI). **READ the JSON + PNGs.** Re-run `probe-desk.mjs` + `diag-classic.mjs` (Classic no-regression) every phase. Require `ok=true` + 0 pageerrors + Classic paints.
6. **Commit** locally (clear message + `Co-Authored-By` line). Append to `RUN-LOG.md` (§"run i" or a new run header) + `DECISIONS.md`.
7. **Update the handoff** — refresh §2 of this file (state) + the HANDOFF.md ⚡ CONTINUE-HERE block, so the run is recoverable across context summarization.
8. **Continue** — `ScheduleWakeup` (sentinel `<<autonomous-loop-dynamic>>`, delay 60–270s while a workflow is running, 1200–1800s for an idle heartbeat) to fire the next cycle. Do NOT stop unless §0's stop conditions are met.

**Use Ultracode/workflows aggressively** (research fan-outs; parallel build of independent modules; adversarial verify of each finished system — spawn skeptics to find bugs in the tick math before committing). Periodically (every ~2 phases) run a **bug-hunt / no-regression sweep workflow** over the built systems.

## 4 · PHASE ROADMAP (concrete targets; data mostly already on disk)
- **S1c — cotton / blockade / foreign** (`data/economy.json` → `cottonBlockade`). New `src/60-blockade.js`, `G.campaign.blockade`. King-Cotton 1861 self-embargo trap; blockade capture-prob schedule 0.10→0.33; runner economics → **gate the CS small-arms `importFactor`** that `prodOnResolve` already reads (wire the S1b placeholder); cotton revenue → funds; foreign-recognition pressure (battlefield + cotton + antislavery) → `clock.intervention`. Blockade-depth **toggle** (full / flat-modifier / off, R14). Diplomacy view on the desk.
- **S1d — manpower / conscription** (`data/economy.json` → `manpower`). `src/70-manpower.js`, `G.campaign.manpower`. Recruitment pools, the draft (US 1863 / CS 1862+exemptions), the **late-war CS replacement-ratio collapse 1.0→0.1** (a war-ending pressure), immigrant pool, enslaved-labor base (ties to S2 emancipation/contraband). Feeds army strength (→ the pre-battle bridge in S5).
- **S2 — executive decisions + 3-layer morale + 1864 election + the ADVISOR SYSTEM (the linchpin, R25).** Research workflow for political/decision content (cabinet recommendations + teaching, decision cards, home-front events). Each secretary auto-manages + recommends + TEACHES its domain (generalize the Treasury delegate seed across all domains). Per-turn curated decision cards via `president.pendingChoices` (the S0 stub). 3-layer morale (troop seed / leader reputation+ambition / public — public partly in `clock.weariness`). Wire the 1864 election hinge (`clk.resolved1864`) to consequences.
- **S3 — alt-history engine** (§5). Tiered divergence (plausible/long-shot/fantastical) + hinge-point forks + emergent-only toggle + curated scenarios; deterministic-by-performance with consensus framing; the living **"your war vs history" tracker** + end report card.
- **S4 — education layer** (§7, R26). Multi-voice debate cards (the 28 economy cards exist; add more from `HISTORICAL-DATA.md`) + deep-dives + a growing **codex**; difficulty/realism sliders; **play-style presets** (General/Commander/President/Historian, R27) that configure all toggles. Full a11y (R33).
- **S5 — victory/defeat + the strategy↔battle BRIDGE** (§8, §11). Asymmetric win paths incl. **negotiated peace (both sides)**; hard-loss = military-only. Wire economy/production/manpower/morale → **pre-battle conditioning** (army strength/weapons/morale/fatigue) → battles use the EXISTING engine via a clean bridge → results feed back → **a playable full Owner-Mode war.**
- **THEN tactical P0→P5** (`MODERN-UGG-PLAN.md`): the real-time UG:G field engine, First Bull Run vertical slice first, swapping in behind the bridge.

## 5 · GUARDRAILS (a 12-hour unsupervised run lives or dies on these)
- **Never commit a red build** (gate + probes must pass; 0 pageerrors; Classic paints via `diag-classic.mjs`).
- **Never regress Classic or the existing systems** — extend by new modules + the registered `_t1InitAll`/`_t1Resolve` hooks; redeclare a base fn ONLY when necessary (add to manifest `overrides`); re-run the full probe suite each phase.
- **Commit per phase** = revertible checkpoints. **Update the handoff per phase** = recoverable across context summarization (your disk state — commits + `DECISIONS.md` + `RUN-LOG.md` + this file — is the source of truth, not your context).
- **Decide & log; don't ask.** The only stop-and-notify cases: an irreversible/destructive action you can't avoid, or a genuine contradiction in the locked design that makes a whole phase ill-defined. Then `PushNotification` + write the state to this file + stop.
- **Probes flake** on headless-swiftshader `page.goto` (heavy 3D boot) — bootprobe goto is 60s; if a probe times out, start the server yourself + retry; an A/B against `build/base.html` distinguishes a real regression from flakiness.
- **Gotchas:** scan `src/` for stray `*/` before each build (it parse-bombs); `portraitFor` → `window.portraitFor` from modules; THREE loads async; honor `reduceMotion`/`gfxQuality`.

## 6 · SUCCESS CRITERIA (what "above and beyond" looks like at hour 12)
A maximally-complete, ship-quality, **playable Owner-Mode war**: pick a side → run economy/production/manpower/blockade/diplomacy/politics through a characterful advisor-managed, non-blocking, deeply-teaching desk → fight the existing battles through the bridge → win via an asymmetric path (incl. negotiated peace) → get a "your war vs history" report. Every system content-complete + self-verified + committed, with a clean `DECISIONS.md` trail of every call made and a current handoff. As far down S1c→S5→tactical as the hours allow — and if the whole arc lands, keep polishing (assets, teaching, a11y, balance) and bug-hunting.

**To resume after a stop/summarization:** read this file (§2 state + §4 roadmap) + `DECISIONS.md` + `git log` + `src/00-manifest.json`, then continue the §3 loop at the next unbuilt phase.
