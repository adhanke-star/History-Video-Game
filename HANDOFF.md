# HANDOFF — "The Civil War"

## ⚡ CONTINUE HERE — run j (THE OVERNIGHT CHARTER is locked) → finish A1, then build the backlog (updated 2026-06-14)

> **A 23-round popup charter session (2026-06-13/14) pre-cleared the entire all-night build.** The 68 Aaron-locked decisions live in **`AUTONOMOUS-RUN.md` §8 (+11 addenda)** and **`DECISIONS.md` D30–D41** — **read §8 FIRST; it governs the whole run.** The operating unblockers: **gated frozen-engine overrides AUTHORIZED · halt only for irreversible/destructive or money/external-account actions · GitHub backup AUTHORIZED (create PRIVATE `History-Video-Game` under the `adhanke-star` account, push every milestone) · `_SAVE_VER` bumps OK w/ lazy migration · unlimited compute · auto-tune balance+log · code-only art · adversarial bug-hunt before every commit · max systems shipped.**
>
> **IMMEDIATE NEXT = finish A1 · Cannon Corps** (scaffolded, uncommitted — full detail in `AUTONOMOUS-RUN.md` §2). On disk: `data/artillery.json` (5 guns + 4 teaching cards, from a verified 11-agent workflow — don't re-research) + `HISTORICAL-DATA-ARTILLERY.md`; `src/56-artillery.js` (battery-count corps) wired into the manifest + register (`artInit`) + the Armory tab (`src/30-president-shell.js`) + an additive `artillery` facet in `bridgeArmy` (`src/85-battle-bridge.js`); `tools/probe-cannon.mjs` written; `node tools/build.mjs --check` = GATE OK. **Remaining:** `node tools/build.mjs` → probe-cannon + full no-regression suite (READ the JSON) → adversarial bug-hunt → commit + push → then the §7 charter-integrated priority order (A2–A6 battle layer incl. bridge auto-resolve → S2–S5 charter-expanded → content systems → theaters → tactical).
>
> **To run it:** start a fresh chat and paste the kickoff prompt from `START-HERE.md` (the ▶ PASTE block, updated for the charter). Everything is on disk; load it, then execute the backlog continuously.

---

## ⚡ CONTINUE HERE — run i progress (S0 + S1 COMPLETE: a/b/c/d SHIPPED) → next: S2 (updated 2026-06-13)

> **S1 is COMPLETE — the full asymmetric economy.** S1a finance/inflation · S1b production/logistics · S1c cotton/blockade/diplomacy · **S1d manpower/conscription (just shipped).** `src/70-manpower.js` + `G.campaign.manpower`: the replacement-ratio collapse (US 1.0 holds; CS 0.9→0.1 by 1865 → armies melt), Union draft-as-stimulus, +180k USCT pool at 1863, immigrant inflow, CS desertion; **`C.manpower.strength` is the army-strength index the S5 battle bridge reads.** Surfaced as "The Ranks" in the War Effort overview. Content-complete via an 11-agent workflow → `data/manpower-teaching.json` (5 multi-voice cards + 9-claim audit; no sim correction needed). **VERIFIED:** probe-manpower 9/9 (20-turn arc to 1865: US strength 100 / CS 53-melting / ratio 0.1 / pool 0); full no-regression suite green (desk 12/12, economy 8/8, production 4/4, blockade 11/11, diag-classic paints, 0 pageerrors).
>
> **NEXT = S2** (`GRAND-STRATEGY-PLAN` §3/§4/§16/§25, R25 the linchpin): the **advisor/cabinet system** — generalize the Treasury/Diplomacy/War per-domain Delegate toggle + the ambient "Why it mattered" teaching into a full system where each secretary auto-manages + recommends + TEACHES; wire `president.pendingChoices` curated non-blocking decision cards (the S0 stub); 3-layer morale (troop/leader-reputation+ambition/public); wire the 1864 election (`clk.resolved1864`) to consequences. The 10 economy/diplomacy/manpower card sets + the desk are the foundation to build on. Then S3 alt-history · S4 education/codex · S5 victory + the battle bridge.
>
> Eight desk tabs now: The War Effort (overview: treasury/home-front meters + War Production + The Ranks blocks) · The Treasury · Diplomacy · War Room · 1864 Clock · Muster Roll · Cabinet · Theater Map. Modules `src/10/20/30/40/50/60/70/90`. Tick order in `_t1Resolve`: clk → econ → wr → blockade → prod → manpower → mr → pres. Data: `data/{economy,diplomacy,manpower-teaching}.json` → `GAME_DATA`.

---

### (prior) ⚡ CONTINUE HERE — S0 + S1a + S1b + S1c SHIPPED → S1d

> **S1c cotton/blockade/foreign just shipped + gated + committed.** `src/60-blockade.js` + `G.campaign.blockade`: the 1861 King-Cotton self-embargo trap (rev≈0), blockade strangulation (capture 0.10→0.33, ports fall, a dynamic `importFactor` that WIRED the S1b prod placeholder — off>full arms), cotton revenue→funds, foreign recognition (1862 famine window → foreclosed 1863) → `clock.intervention`; blockade-depth toggle (full/flat/off, R14); new 8th **Diplomacy** desk tab. Content-complete via an 11-agent research+verify+audit workflow → `data/diplomacy.json` (5 multi-voice cards + a 9-claim numbers audit that corrected Erlanger 72%→45% in `economy.json`) + `HISTORICAL-DATA-DIPLOMACY.md`. **VERIFIED:** probe-blockade 11/11 (16-turn arc), full no-regression suite green (desk 12/12, economy 8/8, production 4/4, diag-classic Classic paints, 0 pageerrors). **NEXT = S1d manpower/conscription** (`data/economy.json` → `manpower`): recruitment pools, the draft (US 1863 / CS 1862), the late-war **CS replacement-ratio collapse 1.0→0.1** (the war-ender), immigrant pool, enslaved-labor base (ties to S2 emancipation/contraband); feeds the pre-battle strength bridge (S5). New `src/70-manpower.js`, register a `manpowerOnResolve` tick. Then S2.

---

### (prior) ⚡ CONTINUE HERE — S0 + S1a + S1b SHIPPED → S1c

> **For a long unsupervised run, read `AUTONOMOUS-RUN.md`** — the operating manual for the self-perpetuating 12-hour build loop (prime directive, loop steps, phase roadmap, guardrails, recovery).

**Strategic-first build underway. Three milestones shipped + gated + committed locally this run (local commits only — Aaron: no GitHub push):**
- **S0 — President's-Desk owner shell** (commit `673894f`): zero-dep **build system** (`build/base.html` frozen run-h monolith + ordered `src/*.js` modules + `tools/build.mjs` → concat → splice before the engine-end anchor → in-memory parse/hex/collision gate → write `civil_war_generals.html`). `G.campaign.president` state (sibling of clock/muster/warroom; rides the save, no `_SAVE_VER` bump). War Department **expanded in place** into a 7-tab desk; between-battles **auto-surface/one-click-skip interstitial**. Cabinet = 4 engraved advisors (stub).
- **S1a — finance core** (commit `3a6aad6`): build is now **data-driven** (`tools/build.mjs` injects `data/*.json` as `GAME_DATA`). `data/economy.json` + `HISTORICAL-DATA-ECONOMY.md` from a citation-grade 8-agent research workflow. `src/40-economy.js` = 3 funding levers (bonds/taxes/press) with an **emergent inflation asymmetry** (US anchored ×1.13 / CS spiral ×87.5 over 12 turns ≈ historical ~90×; inflation→`clock.weariness`). "The Treasury" tab; Secretary delegated by default; teaching card.
- **S1b — war production** (commit `b2179d0`): `src/50-production.js` extends the War Room nodes → asymmetric matériel (US well-found; CS iron-ceiling + import + irreversible rail decay → ragged/hungry; hunger→weariness). Probe-verified 12-turn US rail100/equip100 vs CS rail42/equip24/arms4/food19%. War Production block in the War Effort overview.

**OPERATING PARAMETERS (Aaron-locked, run i — govern the whole run):** run the whole arc (S0→S5→tactical; stop only at unresolvable fork/blocker/done) · **always decide & log** (forks → `DECISIONS.md`, never pause mid-run) · **auto-commit AND push** at gated milestones (no remote yet → local only) · **content-complete each phase** (real data + PD images per system).

**TOOLCHAIN (proven this run):** `node tools/build.mjs` (then bootprobe/t1probe/probe-desk/probe-economy/diag-classic — START a `python3 -m http.server 8765` yourself + confirm 200 first; probes' auto-spawn races; bootprobe goto=60s). **READ the JSON in `tools/shots/` + the PNGs.** Gotchas: no literal comment-closer in JS block comments (bit the build script + a module — scan `src/` before building); bare-name globals `G`/`GAME_DATA` (never `window.G`); `portraitFor` → `window.portraitFor` from modules. Decisions: `DECISIONS.md`. Run detail: `RUN-LOG.md` §"run i".

**NEXT — finish S1, then S2 (all data already in `data/economy.json`; full plan in `AUTONOMOUS-RUN.md` §4):**
- **S1c cotton/blockade/foreign** — King Cotton self-embargo trap + blockade strangulation schedule + runner economics + Erlanger loan; foreign-recognition pressure inputs (feeds S2 diplomacy). Blockade-depth = toggle (R14).
- **S1d manpower/conscription** — recruitment pools, draft, the late-war CS replacement-ratio collapse (1.0→0.1) that ends the war; immigrant pool; enslaved-labor base (ties to S2 emancipation/contraband).
- Wire economy consequences into the pre-battle conditioning bridge (§3/§11) and the cabinet advisors (each secretary surfaces its domain's choices + teaches).
- **Then S2** — executive decisions + 3-layer morale + the 1864 election + the **advisor/cabinet system** (the linchpin R25: auto-manage + recommend + TEACH, per-domain delegation — the Treasury delegate toggle is the seed pattern).

**To continue:** read this CONTINUE-HERE block, then `DECISIONS.md`, `RUN-LOG.md` §"run i", `data/economy.json` + `HISTORICAL-DATA-ECONOMY.md`, and the design law `GRAND-STRATEGY-PLAN.md` (esp. §2 economy, §27 balance). Build S1b next with the same module+gate+probe+commit discipline. The full design orientation is below.

---

# HANDOFF — "The Civil War" — MASTER new-chat handoff (run h → next build)

**Written 2026-06-13 (run h, Opus 4.8). THE single entry point for the next session.** Personal project — NOT MJI. Full autonomy, Ultracode on, $0/free-CC0, build bar 200/100. **To start the next chat: paste the §PASTE block at the bottom.** Everything else here orients you.

---

## 1 · THE PROJECT IN ONE PARAGRAPH
"The Civil War" is becoming **the definitive teaching wargame: Ultimate General: Gettysburg's combat FEEL + Paradox-grade strategic DEPTH + a museum's historical RIGOR** — all three, no compromise. You are the **President (Lincoln or Davis)** running the entire war (economy, politics, diplomacy, morale, generals, the home front) AND commanding the battles in a real-time, gridless, drag-to-maneuver tactical engine — wrapped in a PhD-level history + alternate-history teaching layer where scholarly consensus is the *favored-but-not-guaranteed* path. **The governing design law (Aaron's central tension, resolved): the simple low-micro UG:G battle is the always-fun CORE that stands alone; ALL depth is optional — auto-managed by characterful advisors, delegable per-domain, preset-gated, fluidly dial-able; education is ambient, never blocks play, and confers real in-game mastery (so learning and fun pull the SAME direction).** One engine must serve the pure-battle player, the grand-strategist, and the PhD-historian simultaneously.

## 2 · WHERE THINGS STAND (run h, verified)
- **Classic (hex, turn-based) is FROZEN/finished** — the complete hex lineage + its 3D-skin "Modern." NEVER regress it (`tools/diag-classic.mjs` every splice).
- **Shipped + GPU-verified this run (all reusable):** procedural unit motion; **131 real PD-photo leader portraits** (`assets/portraits/`, license-gated, side-split for Anderson/Gregg) with a closure refactor + upgraded engraving fallback; a fuller period UI pass (drawn order-icons, engraved frames, brass portrait mat). Plus the inherited cinematic 3D foundation (PBR terrain, HDRI, ACES/bloom post-FX, weather, props, camera) and the adaptive period audio score.
- **The shipped "Modern" is only a 3D re-skin of the hex-turn engine** — it does NOT play like UG:G. The real-time tactical engine + the grand-strategy owner-mode are **NOT built yet** — that's the next work.
- **DESIGN: 63 decisions LOCKED** across a 35-round popup design session (Aaron). Fully captured in `GRAND-STRATEGY-PLAN.md` (Parts I–III). **No new-engine code written yet** — the next chat builds from the spec.

## 3 · THE DOCS (read in this order — you have zero prior context)
1. **`GRAND-STRATEGY-PLAN.md`** — THE DESIGN LAW. All 63 locked decisions: Part I (rounds 1–10: player/economy/executive/morale/alt-history/upgrades/education/victory/modes/first-build), Part II (rounds 11–20: diplomacy/slavery/politics/naval/map/generals/soldiers/intel/events/replay), Part III (rounds 21–33: **the depth↔simplicity balance** + presentation), §27 **the balance principle**, §13/§24/§28 decision indexes.
2. **`HISTORICAL-DATA.md`** — citation-grade content (211KB, 18-agent research): First Bull Run full OOB (Union + CSA), weapons/ballistics with ranges, USCT (structure/battles/criticism), the historiography framework, PD image sources. Feeds OOBs, weapon stats, debate cards, the codex.
3. **`MODERN-UGG-PLAN.md`** — the real-time tactical battle engine spec (built SECOND, after the strategic layer).
4. **`RUN-LOG.md` §"run h"** — what shipped + the pivot + this design session; skim §"run g"/§"run f" for the 3D foundation.
5. **`REVIEW-QUEUE.md` top** + **`GRAPHICS-RUN-CONTINUE.md` §TOOLCHAIN/GOTCHAS** — the splice/gate/real-GPU-shot toolchain + the bare-name-globals / async-THREE / override-by-redeclaration lessons.

## 4 · ARCHITECTURE DECISION (run h — important)
**Modularize via a zero-dependency build step.** The scope (50–100k+ lines) outgrows the single 14k-line file. Author the new engine in **source modules**; a tiny **node concat script** assembles the one shippable `civil_war_generals.html` (keep the $0/portable/open-and-play deliverable + `play.command`). Set this up FIRST in S0. Classic + the existing engine stay intact through the transition (move them into the build later, carefully, or keep the current HTML as the base the build appends to). Gate the BUILT output (parse/hex/Classic-regression). This replaces the append-only-single-file splice model for new work — but the gate discipline carries over.

## 5 · BUILD ORDER & PHASES (Aaron: STRATEGIC-FIRST, confirmed twice)
**Phase group S (grand-strategy owner-mode) FIRST, then phase group P (real-time tactical).** Battles use the EXISTING engine via a clean bridge until the UG:G engine swaps in.
- **S0 — scaffold:** set up the module/build system; expand the War Department (`G.campaign.{clock,muster,warroom}`) into the President's-desk shell (period war-room UI); strategic-turn loop; save. Layered scenario onboarding (start ~1861, limited toolset).
- **S1 — economy** (full asymmetric model + finance/inflation/blockade).
- **S2 — executive decisions + 3-layer morale + the 1864 election; the advisor/cabinet system** (the linchpin: auto-manage + recommend + TEACH, per-domain delegation).
- **S3 — alt-history engine** (tiered divergence + hinge-points + emergent toggle + curated scenarios; deterministic-by-performance with consensus framing; the "your war vs history" tracker).
- **S4 — education layer** (multi-voice debate cards + deep-dives + codex from HISTORICAL-DATA.md; ambient teaching; difficulty/realism sliders; play-style presets; full a11y).
- **S5 — victory/defeat** (asymmetric paths incl. **negotiated peace for both sides**, military-only hard-loss) + all campaign scopes; wire existing battles through the bridge → **playable full owner-mode war.**
- **THEN P0–P5** (`MODERN-UGG-PLAN.md`): the real-time UG:G tactical engine (First Bull Run vertical slice first), swapping in behind the bridge.
Each phase: gate + real-GPU self-verify (probes you READ) + Classic no-regression + left in a working, polished state (ship-quality iteratively).

## 6 · THE BALANCE PRINCIPLE (design law — apply to EVERY system)
The simple, low-micro UG:G battle is the always-fun core that works on its own. Every deep system is optional — auto-managed by characterful advisors, delegable per-domain, preset-gated, fluidly dial-able mid-campaign. Education is ambient, never blocks play, and confers real mastery (learning is rewarded by winning, not a chore-score). Presets + sliders let each player set their own balance. **If a feature forces depth on a battle-first player, it's wrong; if it denies depth to a strategist/historian, it's wrong.** (Full statement: GRAND-STRATEGY-PLAN §27.)

## 7 · TOOLCHAIN, GATES, GOTCHAS (proven — reuse)
- **Gates every change:** `.bak` → parse (`node --check` the built/extracted `<script>`) → invalid-hex grep `0x[0-9a-fA-F]*[g-z]` = 0 → collision-grep new fns = 0. With the new build step, gate the assembled output.
- **Real-GPU self-verify (READ the PNGs/probes):** `tools/shot-postfx.mjs`, `tools/shot-gpu.mjs`, `tools/shot-ui.mjs`, `tools/probe-motion.mjs`, `tools/probe-portraits.mjs`, `tools/bootprobe.mjs`, `tools/diag-classic.mjs`. Real GPU = **Intel UHD 617** via headed Chrome `--use-angle=metal`. A real-time sim/strategic loop needs an EMPIRICAL probe (sample state over frames), not just screenshots. Stale server: `lsof -ti tcp:8765 | xargs kill`.
- **Perf target:** smooth on the Intel UHD 617 at Auto tier; instancing/LOD/perf-tiers mandatory.
- **CRITICAL gotchas:** `G`/`HEX`/`PALETTE`/`THREE_BASE` are bare-name lexical globals (never `window.G`); THREE loads async (no top-level `new THREE.*`); override-by-redeclaration (last def wins); never a literal `*/` in a block comment; honor `reduceMotion` + `gfxQuality`; **NEVER regress Classic**; $0/free-CC0; Verified/Inferred provenance on all history.
- **Asset pipeline:** PD images via the run-h portrait pattern (Wikipedia REST summary → Commons license API PD-gate → download → `sips` resize). Extend to weapons/flags/USCT. Blender MCP available for 3D (PolyHaven CC0 / Sketchfab) — keep Blender open for asset jobs; free Hyper3D trial is drained.

## 8 · WORKING NORMS (Aaron)
- Full autonomy; build continuously; surface **questions only at a genuine design fork** — and Aaron LOVES **popup rounds of 3 questions, Recommended = option 1** (use AskUserQuestion). Aaron tests/feels much later — self-verify everything.
- Terse, direct; recommendation + reason on suggestions; push back on gaps; no emojis unless he uses one.
- The **modes & toggles, all-play-styles** spine governs everything; **protect everything (no cuts)** is the scope ambition (build iteratively, but aim to deliver the full vision).

## 9 · §PASTE (paste as the FIRST message of the new session)
> Build the next phase of "The Civil War" (personal project, NOT MJI; full autonomy, Ultracode on, $0/free-CC0, build bar 200/100). Read `HANDOFF.md` fully, then `GRAND-STRATEGY-PLAN.md` (THE design law — 63 locked decisions across Parts I–III + §27 the balance principle), `HISTORICAL-DATA.md` (citation-grade content), `MODERN-UGG-PLAN.md` (the tactical engine, built second), `RUN-LOG.md` §"run h", `REVIEW-QUEUE.md` top, and `GRAPHICS-RUN-CONTINUE.md` §TOOLCHAIN/GOTCHAS. The game is THREE-in-one: UG:G real-time combat feel + Paradox-depth owner-mode grand strategy (you are President Lincoln/Davis) + PhD-level history & alternate-history teaching. THE design law: the simple low-micro UG:G battle is the always-fun core that stands alone; ALL depth is optional (auto-managed by characterful cabinet advisors who also TEACH, delegable per-domain, preset-gated, fluidly dial-able); education is ambient, never blocks, and confers real in-game mastery. BUILD ORDER = STRATEGIC-FIRST: build the full grand-strategy Owner-Mode war + alt-history + teaching layer (GRAND-STRATEGY-PLAN §12 phases S0→S5) by EXTENDING the War Department (`G.campaign.*`), wrapping the existing battle engine via a clean bridge; the real-time UG:G tactical engine (MODERN-UGG-PLAN P0→P5, First Bull Run slice first) swaps in afterward. ARCHITECTURE: modularize now via a tiny zero-dependency node concat build step that assembles the single shippable civil_war_generals.html (set this up in S0); keep the $0/portable one-file deliverable; Classic (hex/turn) is FROZEN — never regress it (`tools/diag-classic.mjs` every change). Gate every change (`.bak` + parse + hex + collision on the built output); self-verify on the real GPU (Intel UHD 617, headed Chrome `--use-angle=metal`) with probes you READ; Aaron tests much later. Honor the bare-name-globals / async-THREE / no-`*/`-in-comments gotchas, the modes-&-toggles spine, Verified/Inferred provenance, and "protect everything (no cuts)." Confirm you've read HANDOFF.md + GRAND-STRATEGY-PLAN.md, give a 3-line plan for S0 (module/build scaffold + President's-desk shell), then build continuously; surface questions only at a genuine design fork (Aaron likes popup rounds of 3 with Rec first).
