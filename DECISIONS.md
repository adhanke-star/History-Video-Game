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

## S1c — cotton / blockade / foreign recognition
- **D16 · [CLAUDE]** S1c **EXTENDS, does not redeclare**: new `src/60-blockade.js` + `G.campaign.blockade` (sibling state); the production `importFactor` placeholder is wired by EDITING the `prodOnResolve` body (a src module I own, not the frozen base) to read `C.blockade.importFactor` with the static `cfg.importFactor` as fallback — no new manifest override. `blockadeOnResolve` registered in the existing `_t1Resolve` override BEFORE `prodOnResolve` so the fresh importFactor gates CS arms the same turn. — Lowest-regression wiring; zero new overrides. Probe-confirmed off>full arms. (Reversible.)
- **D17 · [CLAUDE]** The 1861 cotton **self-embargo is ON by default for CS** (historical: planters/committees drove it) and **auto-expires at year≥1862** (Richmond's hunger for hard currency overrode coercion). Player can lift it early via the Diplomacy tab. Recognition gained while the embargo is active = 0 (the trap: coercion against a glutted Britain bought nothing). — Models the self-sabotage as a *tempting* lever that quietly bleeds the treasury (per the `cotton-self-embargo` card takeaway), not a scripted penalty. (Reversible.)
- **D18 · [CLAUDE]** Foreign recognition is **foreclosed at year≥1863** (decay 0.5, boosts→0), with a 1862 window where it rises (Lancashire famine + early CS wins) then collapses. The S1c numbersAudit endorsed exactly this ("model a recognition window that narrows sharply after Sep 1862 and effectively closes by spring 1863," not a hard Proclamation cutoff). Recognition pulls `clock.intervention` toward itself (×0.30/turn) so even CS battlefield wins can't conjure intervention. — Honest contingency: the one real window, then the door shuts. (Reversible.)
- **D19 · [CLAUDE]** **Erlanger correction applied to `data/economy.json`**: `netProceedsPct` 0.72 → **0.45**, added `issuePriceToErlanger:77` / `publicOfferPrice:90`. The S1c numbersAudit (Gentry 1970) found 77 was Erlanger's BUY price (90 the public offer), and after the post-Vicksburg/Gettysburg slide + Confederate price-propping repurchases the net realized was ~£1.4M of £3M (~45%, not 72%). The Erlanger LEVER itself is deferred to S1d/S2 finance; the corrected figure is on disk for when it's built. Audit also flagged the `cottonBlockade.aggregateExportThroughputVsPeacetime: 0.11` as muddled (true blockade-run cotton to Europe ~3-4% of normal), but the sim doesn't read that field — the revenue-collapse curve (129→53) carries the teaching point; flagged for playtest, not changed. (Reversible.)
- **D20 · [CLAUDE]** **Citation-grade content via an 11-agent workflow** (5 research → 5 adversarial-verify → 1 numbers-audit) → `data/diplomacy.json` (multi-voice cards: consensus + scholarly dissent + named-and-countered Lost Cause + primary sources, Verified/Inferred provenance) + `HISTORICAL-DATA-DIPLOMACY.md`. The Verify pass removed 3 fabricated/misattributed citations (e.g., Egnal's *Clash of Extremes* mis-cited; a fabricated "Weidenmier & Brown" co-author). — Honors content-complete + the adversarial-verify quality bar. (Source of truth on disk.)

## S1d — manpower / conscription (the war-ender)
- **D21 · [CLAUDE]** S1d EXTENDS: new `src/70-manpower.js` + `G.campaign.manpower` (sibling); `manpowerOnResolve` registered in `_t1Resolve` AFTER prod (reads `B.casualties[side]` + the year). No new manifest overrides. **`C.manpower.strength` (0-100) is the army-strength index the S5 pre-battle bridge will read** — S1d produces the strength number that conditions battles. (Reversible.)
- **D22 · [CLAUDE]** The **replacement-ratio collapse is the war-ender**, modeled as the decisive asymmetry: US holds 1.0 (deep refillable pool); CS falls **0.9→0.6(1863)→0.3(1864)→0.1(1865)** by year. The S1d numbersAudit marked the precise ratios DISPUTED ("DIRECTION confirmed; precise ratios not a published statistic") — so they stay **calibrated designer values** (economy.json `replacementRatio._inferred:true`), directionally correct. Probe-verified: CS strength 99→53 (melting), pool→0 by 1865; US strength holds 100. (Reversible — playtest to tune.)
- **D23 · [CLAUDE]** Mechanics from the verified data: **Union draft = a coercive STIMULUS** (×1.2 volunteer inflow at 1863), NOT a direct manpower add — only ~6% of Union soldiers were direct draftees (Geary; audit CONFIRMED); **CS draft load-bearing** (1862, a year earlier); **USCT one-time +180k pool at 1863** (a new pool from the South's labor base); **immigrant inflow US-only** (~25% foreign-born). CS age-band widens 18-35→17-50 (1864) as a visible crisis 'tell'. Surfaced as a **"The Ranks" overview block** in the War Effort tab (NOT a 9th desk tab — tab economy; pairs with the production block), delegated to the Sec. of War, ambient teaching line (R26). (Reversible.)
## S1e — Paths to Victory (the South can win; performance, not script) — [AARON directive]
- **D25 · [AARON]** **The asymmetric collapse must be EMERGENT, not scripted.** Aaron caught that S1c/S1d keyed the Confederate death spiral to the calendar (ratio by year, recognition foreclosed 1863, ports fall on schedule), making defeat feel inevitable — contra §5 (deterministic by performance), §8 (the South wins by not losing), §29 (fair sandbox). FIX: `src/80-victory.js` adds `vicMomentum(C)` (a 0..1 war-fortunes signal from win-rate/will/capital); blockade + manpower now read it. **Winning → desertion ~0, ranks refill, ports hold, recognition stays open.** History is only the default-if-losing. Probe-verified (winning South: str 93/desert 9/ratio 0.83/ports held; losing: str 38/desert 297/ratio 0.22/foreclosed). (Reversible — but this is the locked design intent.)
- **D26 · [CLAUDE]** The replacement-ratio year curve became a "if losing" FLOOR (raised 1865 floor 0.1→0.18 so a passive South isn't instant-doomed) that momentum lifts toward 0.95; desertion = `(1-momentum)^1.6 * 16`. New `C.strategy.enemyWill` (the opponent's resolve) — winning erodes it → at ≤30 (1864+) the **negotiated-peace victory** becomes reachable (`victoryReady`). The S5 win-screen reads this. (Reversible.)
- **D27 · [CLAUDE]** **Executable Southern counter-levers** (new "Paths to Victory" 9th desk tab, side-aware): invest in blockade-runners (+importFactor), commission commerce raiders, fortify ports (hold past historical fall), pursue recognition (keep window open), deserter amnesty, arm-and-free the enslaved (Cleburne, +600 pool +0.3 ratio floor, one-time legitimacy shock). The US gets a mirror (Conquer / Hold Political Will / Strangle by Blockade). — Gives the player real avenues to execute each path (Aaron). (Reversible.)
- **D28 · [AARON]** **Wild-card catalog — alt-history gambits for BOTH sides, tiered plausible→long-shot→fantastical/preposterous** (Aaron: "creative and absurd to preposterous okay if I'm entertained… this is a game"). 11 CS (Trent crisis, invade North, burn-cotton, Cleburne, repeater smuggling, Northwest Conspiracy, Hunley fleet, Maximilian's legions, Stonewall-lives, **the Decapitation Plot** [momentum-gated: lands or backfires], Arizona gold) + 10 US (Hard War, radical 1861 emancipation, Anaconda overdrive, repeater army, Grant-early, greenback firehose, Gatling legions, Russian alliance, rail artillery, the general strike of the enslaved). Each one-shot, effect in `_vicApplyWild`. (Reversible; expandable.)
- **D29 · [CLAUDE]** probe-manpower/probe-blockade reframed to drive a LOSING South (the historical-default trajectory) for their collapse assertions; the WINNING-escapes case is proven by the new `tools/probe-victory.mjs` (12/12). (Test-only.)

## S1d — manpower / conscription (the war-ender)
- **D24 · [CLAUDE]** Manpower teaching content via an 11-agent workflow → `data/manpower-teaching.json` (`GAME_DATA["manpower-teaching"]`; 5 multi-voice cards — Geary/Murdock/Moore/Anbinder/Lonn/Glatthaar/Levine; Black agency front-and-center, Lost Cause erasure countered) + a 9-claim audit (7 CONFIRMED, 1 DISPUTED [ratio direction], 1 CORRECTED [date precision: CS Black-soldier statute Mar 13 vs GO No. 14 Mar 23 1865 — `economy.json` already lists "Mar 13/23 1865", no change needed]). Verify pass removed a misattribution (Fry's Final Report is a standalone 1866 doc, not OR Series III). **Unlike S1c, no sim data correction was required.** (Source of truth on disk.)

## D30 — OVERNIGHT AUTONOMOUS-RUN CHARTER — [AARON] (7 popup rounds, 2026-06-13)
The standing authorization for all-night unsupervised runs. Full text lives in `AUTONOMOUS-RUN.md` §8 (the operating manual reads it first each run). Captured here so the decisions log is complete. All 20 are **[AARON]** unless noted; Aaron overrode the recommended option on three (marked ⚑).
- **D30.1** Scope order = battle layer → S2–S5 → tactical P0–P5.
- **D30.2** Frozen-engine overrides AUTHORIZED (new modules only, gated by `diag-classic`, revert on regression).
- **D30.3** Halt only for irreversible/destructive OR money/external-account actions; else decide-&-log and never stop.
- **D30.4** GitHub backup AUTHORIZED — PRIVATE repo `History-Video-Game` under `adhanke-star`, push every committed milestone. (The one pre-cleared external action; supersedes D15's no-remote for this project going forward.)
- **D30.5** `_SAVE_VER` bumps OK with idempotent lazy migration (D7 pattern); prefer additive.
- **D30.6** Compute UNLIMITED (ultracode aggressive).
- **D30.7** Auto-tune balance via sim sweeps + log every changed number.
- **D30.8** Visual art = code-only light touch (CSS/SVG/procedural); NO Blender/3D/external pipelines unattended.
- **D30.9** Adversarial bug-hunt before EVERY commit + full no-regression suite.
- **D30.10** Tactical engine starts only after battle layer + S2–S5.
- **D30.11** Backlog cleared ⇒ polish/deepen existing design; don't invent major new systems.
- **D30.12 ⚑** Morning goal = MAXIMUM SYSTEMS SHIPPED (breadth), each verified — Aaron chose breadth over the recommended "playable end-to-end war" (but D30.19 auto-resolve still delivers a playable loop cheaply).
- **D30.13** Handoff = live `RUN-LOG.md`/`DECISIONS.md` + a root `WAKE-UP.md` (what shipped / what's playable / demo click-through / open Qs / flags) each session.
- **D30.14** History stance = unflinching, scholarly, anti-Lost-Cause; CS playable without endorsement.
- **D30.15 ⚑** Difficulty = ACCESSIBLE default; presets HARDEN for experts — Aaron chose accessible-default over the recommended punishing-default.
- **D30.16** Conflicting on-disk numbers ⇒ auto-correct to better-sourced value + log citation (Erlanger pattern).
- **D30.17** Player voice = period-flavored but tight; depth opt-in.
- **D30.18** Accessibility = FULL WCAG 2.2 AA, built-in; run `wcag-auditor` on new UI (hold Aaron's MJI bar).
- **D30.19** ADD auto-resolve from the bridge (conditioned army + variance) so the war is playable end-to-end now; keep the option to fight the tactical battle. (New item, folds into A6.)
- **D30.20 ⚑** Onboarding = build a FULL guided tutorial — Aaron chose full over the recommended light/skippable (keep it skippable for experts regardless).

## D31 — DESIGN-SCOPE DECISIONS — [AARON] (popup rounds 8–9, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum. All chose maximal scope (consistent with D30.12 "max systems shipped").
- **D31.1** Theaters in order: Eastern → Western core → Trans-Miss → coastal/naval.
- **D31.2** FULL historical cabinet per side, incl. churn (each: voice/recs/ambition/teaching).
- **D31.3** Start modes = 1861 campaign + scenario hinge-starts + full-sandbox toggle (all three).
- **D31.4** Named-generals system (traits/reputation/ambition) → bridge leadership facet + S2 morale + promotions (replaces the leadership placeholder).
- **D31.5** Home-front = curated conditional event deck (real choices, not random noise).
- **D31.6** End-of-war = rich graded after-action (per-domain grades, turn-by-turn divergence, casualties vs historical, citations).

## D32 — CONTENT-SYSTEM DECISIONS — [AARON] (popup rounds 10–11, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 2.
- **D32.1** Emancipation = a dated Union player decision (radical 1861 / historical 1862 / never) trading border loyalty ↔ USCT manpower ↔ foreign opinion ↔ war aims.
- **D32.2** Naval = dedicated system built at theater-expansion (ironclads, commerce raiders, river war) — not now.
- **D32.3** Disease/medical = real attrition driver (~2× combat) + teaching layer (sanitation/hospitals/Sanitary Commission/Clara Barton; USCT toll).
- **D32.4** Cavalry = DEFERRED to a supervised session.
- **D32.5** Logistics = rail/supply-network system (USMRR vs CS decay, depots → bridge supply/fatigue).
- **D32.6** POW = exchange-cartel-collapse thread (1863 USCT fault line) + manpower effect + Andersonville/Elmira.

## D33 — SYSTEMS & ATMOSPHERE — [AARON] (popup rounds 12–13, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 3.
- **D33.1** Hard war = system (Sherman/Sheridan; break enemy will/logistics + honest civilian/enslaved reckoning).
- **D33.2 ⚑** Turn pacing = FIXED ~monthly (Aaron chose simple over the recommended §22 variable weekly/seasonal).
- **D33.3** Reconstruction coda = short honest epilogue (13/14/15th, Foner unfinished revolution), scales to ending.
- **D33.4** CS finance toolkit BUILT (Erlanger loan + cotton bonds + impressment + produce loan + printing spiral).
- **D33.5** Irregular war = contained thread (Mosby; Quantrill/Lawrence; anti-guerrilla policy) — events + small system.
- **D33.6 ⚑** Audio = RICHER (Aaron upgraded from light): period tunes + ambient soundscapes, code-only synth, toggleable/off-by-default.

## D34 — PERSPECTIVES, AI, SCOPE — [AARON] (popup rounds 14–15, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 4.
- **D34.1** ALL FOUR under-told perspective threads (enslaved agency, immigrant/ethnic units, Native nations, women's roles), woven in + sourced.
- **D34.2** Enemy AI = reactive strategist (own choices, sues for peace at broken will, exploits weakness; presets tune sharpness).
- **D34.3** Codex = multi-axis (timeline + topic + person + battle, cross-linked, provenance shown).
- **D34.4** Single-file may grow to several MB (don't trade scope for bytes; keep gates).
- **D34.5 ⚑** Information = mostly transparent (Aaron chose this over the recommended fog-of-war toggle).
- **D34.6** Replay = alt-history gallery + teaching milestones.

## D35 — SAVES, A11Y, PRESENTATION — [AARON] (popup rounds 16–17, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 5.
- **D35.1** Saves = autosave + named slots + undo-last-turn on accessible difficulty (off on harder/ironman).
- **D35.2** A11y = all four modes on baseline AA (high-contrast theme, CVD-safe palettes w/ patterns+labels, screen-reader ARIA-live narration, dyslexia-friendly font/spacing).
- **D35.3** Inline glossary = every specialized term → definition + provenance, linked to codex.
- **D35.4** Devices = responsive desktop-first; tablet/phone playable + touch.
- **D35.5** Art direction LOCKED = period broadsheet/engraving aesthetic (procedural engraved portraits, broadsheet type, antique-chart maps; CSS/SVG/canvas).
- **D35.6** Human cost rendered with gravity (numbers + regiment losses + occasional named soldier/letter + scale made legible; restrained, no spectacle).

## D36 — CONTENT STANDARD, VICTORY, TUTORIAL — [AARON] (popup round 18, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 6.
- **D36.1** Provenance: Verified needs ≥2 independent reputable sources; single-source/own calibration = Inferred; nothing untagged; adversarial-verify strips fabrications.
- **D36.2** Victory = multiple honest paths per side incl. negotiated peace (CS: exhaust Northern will / recognition / hold to 1865; US: conquest / break rebellion / CS political collapse); hard-loss = military destruction.
- **D36.3** Tutorial = interactive guided scenario (a real 1861 slice), learn-by-doing, optional why-callouts, skippable.

## D37 — ADVISOR UX, SCENARIOS, THRESHOLDS — [AARON] (popup round 19, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 7.
- **D37.1** Advisor UX = one-line rec + one-click accept/delegate + expandable why; ambition surfaces on self-interest.
- **D37.2** Build all four scenario hinge-starts (Antietam/recognition 1862; Vicksburg 1863; 1864 election eve; First Bull Run 1861 = tutorial).
- **D37.3** Win thresholds = accessible default (paths genuinely reachable), harden via presets.

## D38 — PRESS, COMMAND, UNITS — [AARON] (popup round 20, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 8.
- **D38.1** Press = public-opinion system (papers react → public morale + 1864 election; censorship/Vallandigham lever; ties broadsheet UI + 3-layer morale).
- **D38.2** Command = appoint/promote/relieve generals (McClellan problem, political generals, fallout) → bridge leadership facet.
- **D38.3** Flagship named units (54th Mass, Iron Brigade, Irish Brigade, Stonewall Brigade) with identity/history/teaching; ties human-cost + perspectives.

## D39 — MODES, MORALE, CIVIL LIBERTIES — [AARON] (popup round 21, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 9.
- **D39.1 ⚑** Play modes REVISED by Aaron: General+Commander = ONE battle/ops mode; President = full grand-strategy mode; Historian = a settings/realism/teaching LAYER over either mode, NOT a standalone mode. (Supersedes the R27 four-preset framing.)
- **D39.2** 3-layer morale = troop + leader-reputation + public-will, interacting + visible; feeds bridge + 1864 election.
- **D39.3** Civil-liberties = real dilemmas with costs (habeas corpus, Vallandigham/Copperheads, draft enforcement, censorship); both Lincoln and Davis.

## D40 — DIPLOMACY, THE WEST, WAR FINANCE — [AARON] (popup round 22, 2026-06-13)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 10.
- **D40.1** Diplomacy = a real system (Mason/Slidell, Trent war-scare, Laird rams, Russian fleet 1863, cotton vs King Wheat) feeding clock.intervention; builds on S1c.
- **D40.2 ⚑** Western theater = SAME mechanics + new maps/battles (Aaron chose reuse over the recommended distinct Western texture).
- **D40.3** War finance = civic+political (Jay Cooke bond drives, first income tax, greenbacks vs gold, taxation politics); Union popular finance vs CS failure.

## D41 — BATTLE ROSTER, MORALE RESOLUTION, CADENCE — [AARON] (popup round 23, 2026-06-14)
Full text in `AUTONOMOUS-RUN.md` §8 addendum 11.
- **D41.1** Build next: Antietam, Vicksburg, Chickamauga/Chattanooga, Atlanta/the March (on top of existing Bull Run/Shiloh/Fredericksburg/Gettysburg/Malvern/Franklin).
- **D41.2** Morale resolution: troop morale → battle (bridge); public will → strategic outcome (1864 election, negotiated peace); leader reputation modulates both.
- **D41.3** Event cadence: 1–2 meaningful choices/turn, more at hinges.

## D42 — A1 CANNON CORPS: hardening + the CS artillery asymmetry made mechanical — [CLAUDE] (run j, 2026-06-14)
Finishing the scaffolded A1 Cannon Corps. An adversarial bug-hunt workflow (5 lenses × independent verify, 21 agents) confirmed **9 real findings** (7 correctly refuted as unreachable/cosmetic); all 9 fixed in `src/56-artillery.js` + `data/artillery.json`.
- **D42.1 (save integrity)** `artInit` now guards arrays explicitly (`Array.isArray`) at BOTH the `C.artillery` and `.batteries` levels — `typeof [] === "object"` let a corrupt/imported array survive, and a JSON round-trip serializes an array as `[]` and drops every named property → the whole park silently wiped on the next save. Battery COUNTS are now coerced/sanitized at the same chokepoint (`"3"`→3; drop null/NaN/objects/≤0).
- **D42.2 (the balance bug)** the 4-vs-6 guns-per-battery handicap was **purely cosmetic** (shown in the UI, zero mechanical effect — CS and US scored identically). `artBatteryScore` now scales coverage by the side's gun ratio (CS 4/6 ≈ 0.667), so a CS battery fills the park ~2/3 as fast; the South needs ~18 batteries to match a full Union park.
- **D42.3 (CS stacking penalties — designer calibration, Inferred)** the STRATEGIC pre-battle score now also models, CS-only: fuze unreliability ×0.96 (expected-value haircut for shell/case duds; solid shot & canister immune), horse/forage mobility ×0.95 from 1862 / ×0.88 from 1864, mixed-caliber resupply ×0.94 at 3+ calibers; plus the **1863 massing reform** as a both-sides bonus (US ×1.08 / CS ×1.04 — the Union's larger factor stands in for the army-level Artillery Reserve the ANV abolished after Chancellorsville). The per-shot fuze roll, the Whitworth ammunition cap, and gun-loss-on-retreat are **DEFERRED to the battle-day layer (A6) / tactical engine (P-phases)** where they belong as live rolls, not score haircuts. `_designNote` updated to record implemented-vs-deferred.
- **D42.4 (Whitworth import)** the rare British import now costs BOTH sides a premium (CS ×1.5 blockade / US ×1.2 foreign-import) instead of the Union buying the catalog's best gun at base price; `csOnly` kept false (both sides fielded a handful).
- **D42.5 (hardening)** `_artCost` honors a configured cost of 0; no-`id` guns are skipped in scoring + refused at purchase; `_artEsc` escapes data fields before `innerHTML`; `artBuy` coerces `n` via `Number()`; the baseline is clamped into [0,100]. *(The parallel unescaped-data gap in `55-weapons.js` is the same latent, non-triggering issue — flagged as a follow-up hardening item, not fixed in this A1-scoped commit.)*
- **Verified:** probe-cannon now **9/9** (added a US>CS divergence assertion that also asserts CS isn't crushed to baseline — accessible default per D35/§8.15); full no-regression suite green (diag-classic Classic paints, desk 12/0, weapons 8/0, bridge 6/0); 0 pageerrors. Sample (1863, 6× howitzer12 Q58): **US 44 vs CS 33**; bridge artillery facet 8→63 lifts overall 76→83.

## D43 — A2 ENGINEERING WORKS CORPS: buildable engineer arm + the rail-repair-that-can't-rebuild — [CLAUDE] (run j, 2026-06-14)
The Engineering Works Corps — the third buildable in The Armory (after small arms + the Cannon Corps). Four capabilities raised in levels 0-3 with funds: Construction Corps (Haupt's USMRR rail/bridge repair), Field Fortifications (the spade), Pontoon Train (river crossings), Siege Works (saps/parallels). New `src/57-engineering.js` + `data/engineering.json` + `C.engineering`. Feeds the battle bridge as an additive `engineering` facet (weight 0.10); construction raises the supply facet, pontoons lower fatigue; the Construction Corps claws back a FRACTION of each turn's rail loss (slows but never stops the CS rail collapse). CS pays a 1.25× materials premium — Union engineering vastly outstripped the South's (the USMRR rebuilt faster than the CS could wreck).
- **Content:** an 8-agent research+verify workflow → **4 Verified multi-voice teaching cards** (Haupt/USMRR; the spade & fieldworks; pontoon mobility; siege engineering). Anti-Lost-Cause: Solonick's "Vicksburg was dug out, not starved out"; the rifle-musket-vs-entrenchment debate surfaced (Griffith vs Hess); the Cold Harbor "7,000 in minutes" myth corrected (Rhea, ~6,000 Union for the day); Vauban dated correctly (17th c.). Every citation independently fact-checked; the verify pass fixed real errors (rank anachronisms, Petersburg mileage, the Foote attribution).
- **Mechanics (designer calibration, Inferred):** baseline 12; scorePerLevel construction 8 / fortifications 7 / pontoons 6 / siege 7 (full park ≈ 96); construction supply +4/level; pontoons fatigue −3/level; costPremiumCS 1.25.
- **Adversarial bug-hunt** (5 lenses × independent verify, 19 agents) → **5 confirmed findings, all fixed** (9 correctly refuted as dev-console-only / intended-design):
  - **D43.1 (the real one)** the rail-repair was a CONSTANT additive (`level × 1.6`) against MULTIPLICATIVE decay → a stable equilibrium, and with the rail War-Room node funded it **pinned rail at 100 forever** (and recovered net-positive from a low point) — flatly contradicting the locked "irreversible decay, still declines" intent. **Fix:** `prodOnResolve` now stashes `railLossLast`; `engOnResolve` claws back only `min(0.70, 0.24×level)` of that loss (a sub-1.0 fraction), so the net trend is strictly negative for every decay/level/node combination. Probe asserts rail never pins at 100 and declines monotonically with the rail node maxed (verified: 100→84 with full construction, vs 55 without).
  - **D43.2** `perLevelEffect`/`scorePerLevel` lacked NaN/negative guards (a data typo could NaN or *invert* supply/fatigue) → Number/isFinite/floor-guarded; a configured `scorePerLevel` of 0 is now honored.
  - **D43.3** boolean-in-save coerced to level 1 (`Number(true)===1` → a free capability) → `engInit` rejects non-number/string before coercion. **Parity fix applied to `artInit` (A1) too.**
  - **D43.4** `_engEsc` didn't escape quotes but `b.id` sits in a `data-engbuy="…"` attribute → quote-escaping added. **Parity fix to `_artEsc` + the `data-artbuy` attribute (A1) too.**
  - **D43.5** a bare `&` in static render text → `&amp;`.
- **Verified:** probe-engineering **9/9** (incl. the new equilibrium-regression assertion); full no-regression green (diag-classic Classic paints; production/cannon/bridge/desk unaffected — the prod `railLossLast` + artillery parity edits caused no regression); 0 pageerrors. Deliverable ≈947KB.

## D44 — A3 TERRAIN COVER HIERARCHY: the first frozen-engine override — [CLAUDE] (run j, 2026-06-14)
The first frozen-engine override under §8.2. Six named cover types (Stone Wall, Entrenchments, Sunken Road, Boulders, Dense Forest, Rail Fence) slotted into the engine's EXISTING terrain/defense model. New `src/58-terrain-cover.js` + `data/terrain-cover.json`.
- **Mechanism (NO fire-function override — lowest engine risk):** combat reduces fire damage by dividing by `TERRAIN[tile.t].def`; the `.cover` field was defined but UNUSED. The module MUTATES the frozen consts `TERRAIN`/`TCOL`/`PALETTE` at load (adding keys to a const object is legal) to install the 6 cover types with real `def` values + period colors, so combat applies them automatically through the existing `.def` path. def ladder: stonewall 2.00 > trench 1.95 > sunkenroad 1.85 > boulders 1.70 > forest 1.50 > woodfence 1.25 (between clear 1.00 and works/fort 2.10). A stone wall halves casualties (probe: 100→50).
- **Placement:** OVERRIDES `authoredMap` (verbatim base body + a `tcDecorateMap` pass; added to manifest overrides → 2× collision-gate). `_tcCoverFor` matches feature labels → cover: Sunken Road→sunkenroad, Marye's Heights/Stone Wall→stonewall, Devil's Den/Round Top→boulders, the woods/Wilderness→forest, redan/redoubt/lunette/salient/retrenchment→trench. 11 stamps across 6 of 10 authored maps. Positions already `fort` (def 2.10) — the Vicksburg redans, Antietam's Bloody Lane — are correctly LEFT by the no-weaken guard. Procedural `genMap` battles aren't decorated (already carry woods/town/works cover).
- **Content:** 1 Verified teaching card (cover as graded killing ground — Fredericksburg's stone wall & sunken road; Hess / NPS-ABT / Griffith, the A2-vetted sources).
- **Adversarial bug-hunt** (5 lenses × independent verify, 13 agents) → 2 confirmed findings (both medium; the const-mutation timing + idempotency were probed and confirmed SAFE by the refuted set), both fixed:
  - **D44.1** `"trench"` substring-matched "The Retrenchment" (an accidental hit stamping a road tile). Fixed: dropped bare `"trench"` → `"trenches"` + added explicit `"retrenchment"` (anchored intent — The Retrenchment is a genuine Franklin fieldwork, kept as cover).
  - **D44.2** stamping swaps `tile.t`, which the engine also reads for MOVEMENT cost — and one case (Marye's ridge→stonewall) made high ground CHEAPER to cross, contradicting the "def only" claim. Fixed: stonewall cost 1→2 (a wall is an obstacle) + a **no-speedup guard** (never stamp if `cover.cost < tile.cost`) so decoration never reduces traversal cost; reframed the docs as an honest terrain swap (def↑, cost never↓, never water, preserves objectives/elevation).
- **Verified:** probe-cover **8/8** (def ladder, render colors, label matching incl. a Dunker-Church negative, stamping across 6 maps, Antietam Sunken Road strong-cover, never-weaken, the terrain-swap invariant [11 stamps: 0 weaker def, 0 cheaper-to-cross], combat reduction); diag-classic Classic paints (no regression from the override); full no-regression suite green; 0 pageerrors. Deliverable ≈962KB.

## D45 — A4 WIRE THE ARMORY → THE BATTLEFIELD: the weapons you buy are what your brigades fire — [CLAUDE] (run j, 2026-06-14)
The small arms bought in The Armory (`C.armory.loadout`) become what the player's brigades actually carry and fire. New `src/59-armory-field.js`. Frozen-engine override (§8.2): `genForce`.
- **Mechanism:** a battle unit's firepower is decided entirely by `WEAPONS[u.weapon].pow` (resolveFire ~1037). The module OVERRIDES `genForce` (verbatim base body + a re-arm pass) so a fraction of the PLAYER's fresh infantry are re-armed from the loadout, mapped armory-id → engine WEAPONS key (`smoothbore`→smooth … `henry`→henry, quality-MONOTONIC so a better buy is never a worse field weapon). Buy Spencers → a slice of the line carries "spencer" (pow 2.05 vs the musket's 1.00 = +105% fire). The remainder keeps standard issue; veterans keep their earned weapon; the enemy is untouched (no arsenal to draw on).
- **Adversarial bug-hunt** (5 lenses × independent verify, 16 agents) → 5 confirmed findings (the override fidelity confirmed byte-identical by the refuted set), all fixed:
  - **D45.1 (HIGH — Classic regression)** the re-arm fired whenever `G.campaign` merely existed (gated on `G.campaign.side`), so a **Free Battle with a saved campaign in memory could re-arm the AI ENEMY with the player's arsenal** (or silently self-buff a same-side free-battle force) — breaking Classic/Free-Battle independence from campaign state. Fixed: gate on `campaignCore` (the engine passes it non-null ONLY for the player force in a real `fromCampaign` battle; the enemy force and BOTH Free-Battle forces get null) — the exact discriminator.
  - **D45.2 (MED)** engine-era bypass: the armory's `data/weapons.json` year-gates are looser than the engine's `WEAPONS.era`, so the player could field e.g. Sharps at an 1861 battle the era-locked AI couldn't. Fixed: skip any weapon whose `WEAPONS.era` > the battle year (the bought arm fields only once the engine would issue it — fair vs the AI, no anachronism).
  - **D45.3 (LOW)** float drift: 0.1×10 = 0.9999… → `floor` left one brigade un-armed on a "100%-armed" line. Fixed: snap `fr>0.9995→1` + an epsilon on the floor.
- **Verified:** probe-armory-field **9/9** (monotonic mapping, player-not-enemy re-arm, fraction lower-bound, whole-army float-safe, veterans keep their weapon, Spencer +105% pow, off-campaign no-op, the engine-era gate [1861 Sharps→0 fielded], Free-Battle isolation [`{spencer:1.0}` live but core=null → not all armed = no leak]); diag-classic Classic paints (no regression from the `genForce` override); full no-regression suite green; 0 pageerrors. Deliverable ≈970KB.
