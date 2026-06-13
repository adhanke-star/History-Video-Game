# DECISIONS LOG — "The Civil War" autonomous build run

Per Aaron's locked operating parameters (run i, 2026-06-13): **run the whole arc · always decide & log · auto-commit AND push at gated milestones · content-complete each phase.** Every design fork I resolve mid-run is recorded here with rationale so Aaron can override in review. Aaron-locked decisions (via popup) are marked **[AARON]**; ones I made under "always decide & log" are **[CLAUDE]**.

Format: `Dn · [who] · phase · decision — rationale (reversible? / impact)`

---

## Run-i operating parameters — [AARON] (popup, 2026-06-13)
- **D0a** Run scope = **run the whole arc** (S0→S5 then tactical), stop only at an unresolvable fork / unfixable gate failure / done; auto-handoff at context pressure.
- **D0b** Fork policy = **always decide & log** (never pause mid-run; this file is the log).
- **D0c** Commits = **auto-commit AND push** at each gated milestone (clear message + RUN-LOG entry).
- **D0d** Content = **content-complete each phase** (real citation-grade data + PD images per system; slower per phase, less rework). NOTE: the S0 cabinet is the one explicit exception — Aaron chose engravings-now / PD-photos-in-S2 in the same popup round (D4); the content-complete policy governs S1 onward.

## S0 — President's-Desk shell + build system
- **D1 · [AARON]** Build system = **frozen `build/base.html` (byte copy of the run-h monolith) + ordered `src/*.js` modules + zero-dep `tools/build.mjs`** that concatenates + splices before the unique engine-end anchor and re-emits `civil_war_generals.html`, gated in-memory (parse/hex/collision) before writing. — Honors the handoff's "modularize via a zero-dep concat build step, keep the current HTML as the base." Classic stays frozen (base never edited). (Reversible.)
- **D2 · [AARON]** Desk structure = **expand the War Department in place** — `openWarDept` redeclared to render the President's Desk; its 1864 Clock / Muster Roll / War Room become tabs alongside new The-War-Effort / Cabinet / Theater-Map tabs. One owner-mode screen, no parallel system (§1/§11). (Reversible.)
- **D3 · [AARON]** Strategic-turn surface = **auto-surface, one-click skip** — a "To the Executive Mansion" interstitial between battles (wraps `openUpgrade`); Continue proceeds to the Quartermaster, or open the desk. (Reversible.)
- **D4 · [AARON]** Cabinet (S0) = **stub now with procedural engraved portraits** (4 named secretaries per side); real advisor auto-manage/teach (R25) + PD photos in S2. (Reversible.)
- **D5 · [CLAUDE]** Main-menu button relabel **DEFERRED to S1** — `openMainMenu` is a 124-line broadsheet builder; redeclaring it to rename one cosmetic button (`#gnWarDept` → "The President's Desk") is the highest-churn override in S0 for a purely visual gain. The existing button already opens the (now-expanded) desk; the desk is also reachable from the interstitial. — Risk/benefit. (Reversible; do in S1 once stable.)
- **D6 · [CLAUDE]** Keep the generated `civil_war_generals.html` **committed** (not gitignored) — the deliverable premise is open-and-play from a fresh clone with no build step for the player; the build is a developer tool. `build/base.html` is the source of truth for the frozen foundation. (Reversible.)
- **D7 · [CLAUDE]** **No `_SAVE_VER` bump** for S0 — new `G.campaign.president` is additive plain data that rides `serializeSave` automatically; back-compat = idempotent `presInit` (lazy migration on next desk-open or battle-resolve). Bumping the version would silently erase every existing ver-1 save. (Reversible only forward.)
- **D8 · [CLAUDE]** Strategic-date cadence = **~1 month per battle placeholder**, synced up to the 1864 Clock's year. — S0 is a shell; real variable pacing (weekly in season, compressed in winter, §22) lands with the strategic-turn-loop content in S1. (Reversible.)

## S1 — economy (content-complete from research)
- **D9 · [CLAUDE]** Economy content gathered via a **citation-grade research workflow** (8 agents) → `HISTORICAL-DATA-ECONOMY.md` (digest + 28 debate cards) + `data/economy.json` (game-ready params). — Honors "content-complete each phase." (Source of truth on disk.)
- **D10 · [CLAUDE]** Build is now **data-driven**: `tools/build.mjs` injects `data/*.json` as a `GAME_DATA` global so `data/economy.json` is the single source of truth while the deliverable stays single-file. — Cleaner than inlining params in modules; sets up all of S1. (Reversible.)
- **D11 · [CLAUDE]** S1a = **the finance core first** (the spine + the most teachable system): three funding levers (bonds/taxes/printing), an EMERGENT inflation model (thin CS bond absorption + ~0.10 tax efficiency force the printing press → compounding spiral; US bonds+taxes cover demand → anchored), inflation→`clock.weariness` interlink. Production/cotton-blockade/manpower are S1b–S1d. — The asymmetry must be emergent from real params, not scripted (R29). (Reversible.)
- **D12 · [CLAUDE]** Treasury is **delegated to the Secretary by default** (auto-managed historical mix), opt-in to self-manage (balance principle §27). New "The Treasury" tab (7th desk tab). (Reversible.)
- **D14 · [CLAUDE]** S1b production layer **EXTENDS the War Room** (reads `wr.nodes` as inputs; does NOT redeclare wr → zero regression risk) rather than a parallel system. Asymmetric matériel: US well-found; CS throttled by iron ceiling + import-dependence + IRREVERSIBLE rail decay (~7%/turn) → ragged/hungry armies, emergent. Surfaced in the War Effort overview (no new tab). Probe-verified: US rail100/equip100/arms85 vs CS rail42/equip24/arms4/food19%. (Reversible.)
- **D15 · [CLAUDE]** Local commits only, **no GitHub push** — Aaron confirmed (run i): "just use local commit, should be fine not pushing to github." Supersedes the D0c push intent. (Reversible.)
- **D13 · [CLAUDE]** Inflation **calibration**: per-turn `_ecDEMAND=100`, US `inflCoeff≈0.06`/cap 4%, CS `inflCoeff≈0.18`×`spiralCoefficient^hiPrintTurns`. Probe-verified over 12 turns: US ×1.13, CS ×87.5 (≈ historical ~90× target), ratio 1:77. These are calibration starts per `economy.json` designerGaps — playtest to tune; turnCount still unset (rates documented for a 16-turn war). (Reversible.)
