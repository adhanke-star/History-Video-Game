# Battle-Build Research Library (D327)

Durable, citation-grade research packets for the **remaining buildable battle lanes** of "The Civil War." This is **research/docs only** — no packet here adds `data/*.json`, a registry line, a menu button, generated HTML, or any combat code. Each packet is what a future implementer (Codex or Claude) reads *before* writing a `D###` spec, so a battle is authored from sources and re-verified OOB/rank/terrain traps rather than from memory or invented data.

**Why this exists:** D325/D326 shipped Chattanooga by first writing a durable spec packet (`docs/design/chattanooga-battle-build-spec.md`) and only then implementing. D327 generalizes that discipline to every remaining lane, so the next battle-build slices start from verified evidence, honor **D74** (one universal combat model — no per-battle fudge), and honor **D92** (accurate inputs drive the probable result; never an output gate) and citation-grade, anti-Lost-Cause history.

## How each packet was produced

An Opus research→adversarial-verify workflow (one Opus researcher with live WebSearch/WebFetch → one Opus adversarial verifier that re-fetched the riskiest claims, per lane) plus a main-loop (Opus 4.8) final-verifier pass. **D327** ran the first five lanes; **D329** ran the six coverage-completion lanes the same way.

The adversarial pass caught and corrected real defects before these landed. From D327: Forrest was **Lt. Col.** (not Col.) at Fort Donelson; the 54th Massachusetts lost **~40-45%** (not ">50%") at Fort Wagner; the Jonesborough casualty figures were day-by-day mislabeled; two-phase scoreWeights sum to **4** (not 5); the Cold Harbor "7,000 in 30 minutes" figure is a disputed myth, not an engine input. From D329: the ABT Second Manassas strength box shows **125,000 Union *total*** (a paper/theater figure), not an engaged force — and that page *does* print the anachronistic label "Lt. Gen. Longstreet," which the packet's own rank trap must override; the **7,682** Cedar Creek casualty total is the **NPS** figure, not ABT's (8,824) or Wikipedia's (8,575), though all three agree on the *direction*; and Stand Watie's Cherokee regiment number is genuinely muddled in the records, so it is left unpinned.

Two D329 corrections are worth singling out, because both were cases of a verifier **refusing to defer to authority**:

1. The run prompt itself asserted that Stonewall Jackson was "never a lieutenant general." That is **false** — he was promoted lieutenant general on **Oct 10 1862** and commanded the Second Corps at Fredericksburg and Chancellorsville. The verifier refuted the prompt from sources and re-scoped the rank guard to the Valley-1862 dates only. A blanket "fail on any `Lt. Gen. Jackson`" probe would have falsely failed a *correct* future Chancellorsville build.
2. The main-loop final verify then caught a residual date defect the adversarial pass had let stand: Jackson was **wounded May 2 1863** and **died May 10 1863**; the packet had conflated the two.

Every packet ends with a **Verification Notes** section recording what was fetched, corrected, and flagged.

## Verdict taxonomy

- **READY_FOR_SPEC** — enough verified evidence exists to write a `D###` spec next. Requires ≥2 reputable source-register entries *and* an explicit "Remaining Traps" list (residual OOB/strength/terrain items to pin during the spec pass).
- **NEEDS_MORE_RESEARCH** — exact OOB/ranks/terrain are still too thin to encode.
- **DO_NOT_BUILD_NOW** — important but not safely playable yet (needs an engine the project lacks, e.g. a naval mode) or a dignity line forbids it (a massacre must never be a gamified "win").

## The packets

**D327 lanes** (the first five):

| Packet | Lane | Verdict | Lead buildable candidate | Exact next slice |
|---|---|---|---|---|
| [atlanta-march-battle-build-research.md](atlanta-march-battle-build-research.md) | Atlanta Campaign & March to the Sea | **READY_FOR_SPEC** | **Kennesaw Mountain** (single-phase, attacker historically loses) + Jonesborough (T8 two-phase capstone) | D### Kennesaw Mountain single-phase spec + probe scaffold; March to the Sea stays teaching-only |
| [franklin-nashville-battle-build-research.md](franklin-nashville-battle-build-research.md) | Hood's Tennessee Campaign | **READY_FOR_SPEC** | **Franklin** (single-phase defender-hold) + Nashville (T8 two-phase) | D### Franklin single-phase spec + probe scaffold; Spring Hill stays teaching-only |
| [usct-battle-build-research.md](usct-battle-build-research.md) | USCT / Black combat agency | **READY_FOR_SPEC** | **New Market Heights / Chaffin's Farm** (T8 two-phase, 14 Medals of Honor) | D### New Market Heights spec + probe scaffold **+ Fort Pillow dignity guard** (massacre = teaching-only, DO_NOT_BUILD) |
| [naval-river-battle-build-research.md](naval-river-battle-build-research.md) | Naval & river battles | **READY_FOR_SPEC** (Fort Donelson only) | **Fort Donelson** (T8 three-phase land siege) | D### Fort Donelson 3-phase spec; Hampton Roads / Mobile Bay / Fort Henry are DO_NOT_BUILD_NOW (need a naval engine) |
| [1864-65-attrition-battle-build-research.md](1864-65-attrition-battle-build-research.md) | Overland Campaign & Petersburg | **READY_FOR_SPEC** | **Spotsylvania "Bloody Angle"** (single-phase) → Overland Campaign (T8 three-phase) | D### Spotsylvania single-phase spec; the Crater ships as a failed-assault scenario with the massacre as teaching only |

**D329 coverage-completion lanes** (every remaining battle/campaign that is neither shipped nor covered above — the library is now exhaustive):

| Packet | Lane | Verdict | Lead buildable candidate | Exact next slice |
|---|---|---|---|---|
| [eastern-1862-battle-build-research.md](eastern-1862-battle-build-research.md) | Eastern 1862 gaps (Second Bull Run + the Seven Days beyond the built Malvern Hill) | **READY_FOR_SPEC** | **Gaines' Mill** (single-phase defender-hold; the Malvern Hill inverse) + Second Bull Run (T8 three-phase, sum 5) | D### Gaines' Mill single-phase spec; Glendale's non-arrival lesson and all cavalry raids (Brandy Station, Stuart's rides) stay teaching-only |
| [shenandoah-1862-battle-build-research.md](shenandoah-1862-battle-build-research.md) | Jackson's 1862 Valley Campaign | **READY_FOR_SPEC** | **Cross Keys + Port Republic** (T8 two-phase, roles flip, sum 4) | D### Cross Keys/Port Republic two-phase spec; the campaign's operational maneuver stays a strategic teaching module; McDowell stays teaching-only (casualty inversion) |
| [shenandoah-1864-battle-build-research.md](shenandoah-1864-battle-build-research.md) | Sheridan's 1864 Valley Campaign | **READY_FOR_SPEC** | **Cedar Creek** (T8 two-phase, same-day role reversal, sum 4) | D### Cedar Creek two-phase spec; **"The Burning" is teaching-only** (hard war on civilians, never a scored objective) |
| [western-gaps-battle-build-research.md](western-gaps-battle-build-research.md) | Western gaps between the built Shiloh and Chickamauga | **READY_FOR_SPEC** | **Stones River** (T8 two-phase, sum 4; Jan 1 lull = teaching interstitial) + Perryville (single-phase) | D### Stones River two-phase spec with a **near-parity** aggregate casualty guard (NOT US < CS); Perryville's acoustic shadow is a teaching card, never a mechanic |
| [trans-mississippi-battle-build-research.md](trans-mississippi-battle-build-research.md) | Trans-Mississippi (Wilson's Creek, Pea Ridge, Glorieta, Red River) | **READY_FOR_SPEC** *(evidence bar only — **blocked behind the D183 two-tier Aaron gate**, see below)* | **Pea Ridge / Elkhorn Tavern** (T8 two-phase, sum 4) | **Put the D183 gate to Aaron first.** Then D### Pea Ridge spec on the Native-free Elkhorn axis; Glorieta + the Red River river-war stay teaching-only |
| [appomattox-campaign-battle-build-research.md](appomattox-campaign-battle-build-research.md) | The Appomattox Campaign (Apr 1–9 1865) | **READY_FOR_SPEC** | **Five Forks** (single-phase attacker-seize) + the Apr 2 Petersburg Breakthrough (T8 two-phase, sum 4) | D### Five Forks single-phase spec; **the surrender is a teaching sequence, never a scored battle** |

**LANE-013 P1 massacre-treatment family (2026-07-18, D455 §3 rows 6-8 + §4b — completes C3's research entirely):**

| Packet | Lane | Verdict | Lead buildable candidate | Exact next slice |
|---|---|---|---|---|
| [massacre-treatment-battle-build-research.md](massacre-treatment-battle-build-research.md) | Fort Pillow + the Crater + Olustee as ONE family (Aaron's D455 unlock: playable battles, unscoreable atrocities through the shipped no-quarter machinery) | **READY_FOR_SPEC** | **Fort Pillow** (single-phase CS assault; the massacre resolves ONLY through the D457 no-quarter machinery) | LANE-013 P4 Fort Pillow spec → runtime; Crater + Olustee specs [IF-ROOM] |

This family packet SUPERSEDES the *availability* dispositions ("Fort Pillow DO_NOT_BUILD / teaching-only", "the massacre may not be built") recorded in `usct-battle-build-research.md` and `1864-65-attrition-battle-build-research.md` and in the "teaching-only" list below, per Aaron's D455 §3 rows 6-8 — the dignity rules those packets state (no atrocity is ever a scored objective; imagery law; ≥2-source law) remain in force unchanged. The older packet texts are preserved as the historical record.

**Lane boundary (no double-claim):** `1864-65-attrition` owns the Overland Campaign, Cold Harbor, the Petersburg **siege** (Jun 1864–Mar 1865), and the Crater. `appomattox-campaign` owns **Apr 1–9 1865** — Five Forks, the Apr 2 breakthrough (which the attrition packet explicitly deferred as un-researched), Sailor's Creek, and the surrender. Fort Stedman (Mar 25 1865) is a gray zone recommended to stay a teaching card. *(Crater research now ALSO lives in the massacre-treatment family packet above, which supersedes the attrition packet's massacre-availability line per D455.)*

## The D183 gate on the Trans-Mississippi lane (a live Aaron decision — do not self-clear)

`trans-mississippi` is the one lane whose `READY_FOR_SPEC` means **"the evidence is verified and the spec is writable once Aaron clears the gate,"** not "start writing the spec now." D183 (and `data/under-told-perspectives.json`'s `native-nations` source note) says verbatim: *"this is not a license to create a playable Trans-Mississippi battle, OOB, unit roster, or Confederate-diversity claim. **M8 battle-build still needs Aaron go/no-go.**"* That is a **two-tier** gate:

- **Tier 1 (whole-lane):** the entire Trans-Mississippi M8 battle-build — *including* the Native-free Elkhorn Tavern axis — needs Aaron's explicit go/no-go before any spec is written.
- **Tier 2 (Native OOB, higher bar):** the Leetown sector (Pike's Indian Brigade, Stand Watie's Cherokees) would additionally require encoding Native units as a playable OOB, which D183/D178 **expressly barred**. The recommended Elkhorn axis honors this bar by keeping Leetown/Pike/Watie as teaching cards only.

The packet resolves **neither** tier. Do not read "the recommended axis has no Native units" as authorization to build.

## Built-battle audits (D328)

The forward packets above cover **unbuilt** lanes. The companion [built-battles/](built-battles/README.md) subfolder (D328) holds a citation-grade research/audit of the **10 already-built** battles (Bull Run, Antietam, Fredericksburg, Chancellorsville, Malvern Hill, Gettysburg, Shiloh, Vicksburg, Chickamauga, Chattanooga) so Codex can revise them alongside building new battles. Result: **9 of 10 are SOLID_AS_IS** (the D92/D86/D90/D325 hardening held); **Antietam** needs one outcome-neutral rank-label fix (`us_richardson.commander` Brig. Gen. → Maj. Gen., an internal self-contradiction with its own leader entry); one auditor false flag (Fredericksburg's Owen) was correctly refuted.

## Most-ready lane and what stays research-thin

- **Most ready for the next implementation slice:** **Atlanta/March → Kennesaw Mountain** (a clean single-phase "attacker historically loses" build that fits the objective-hold engine grain with zero fudge), which also matches the standing queue (Priority 1 after Chattanooga). Franklin (single-phase defender-hold) and Fort Donelson (3-phase land siege) are close seconds. Among the D329 lanes, **Gaines' Mill** (single-phase defender-hold, the exact inverse of the already-built Malvern Hill) and **Stones River** (T8 two-phase) are the strongest additions.
- **Research-thin / not yet buildable:** every **ship-vs-ship** action (Hampton Roads, Mobile Bay, Fort Henry, the river-passage fights) is **DO_NOT_BUILD_NOW** — the project has a land brigade engine only. **Fort Pillow** is **DO_NOT_BUILD** as a scenario on dignity grounds (a massacre of surrendering Black soldiers) and may exist only as a teaching card. Across the READY lanes, the residual gaps are **sector-level engaged OOB strengths** (the ABT "campaign totals" are unusable as engaged inputs) and a handful of **cite-pending URLs** — each packet's "Remaining Traps" section names them.

## What is teaching-only across the whole library, and why

The engine is a **land, infantry-brigade, objective-hold** model. An action is teaching-only when its decisive event lives outside that model, or when a dignity line forbids scoring it:

- **No naval engine:** all ship-vs-ship actions (Hampton Roads, Mobile Bay, Fort Henry), and the river half of the **Red River Campaign**.
- **No operational-maneuver / marching layer:** Jackson's 1862 Valley Campaign *as a campaign* (interior lines, the Massanutten screen, forced marches), **Spring Hill**, and **Glendale's** decisive non-arrival of Huger and Jackson.
- **No mounted-melee or raid mode:** **Brandy Station**, Stuart's rides around McClellan, and pure cavalry raids.
- **Logistics raid, not a tactical fight:** **Glorieta Pass** — Chivington's burning of ~80 supply wagons at Johnson's Ranch decided the campaign, not the fight at Pigeon's Ranch.
- **Not a fight at all:** the **Appomattox surrender** (Apr 9 1865) — an end-of-campaign teaching sequence.
- **Dignity line (never a scored objective):** **Fort Pillow** (massacre of surrendering Black soldiers); the **Crater** massacre (the failed assault may be built, the massacre may not); **"The Burning"** of the Shenandoah (hard war against civilians); the **Leetown scalpings** and their weaponization by the Northern press; **Sand Creek** (named as a teaching card wherever Chivington appears, never a scenario).
- **A caution, not a category:** **McDowell (1862)** and **Wilson's Creek** are casualty *inversions* — the side that held the field lost more men. A naive "the winner bleeds less" direction guard would be false there. **Stones River** and **Perryville** are near-parity fights where the **US** took more casualties than the CS. Direction guards must be written per battle from the sources, never assumed.

## Coverage

With D329 the library is **complete**: all 10 shipped battles carry a [built-battles/](built-battles/README.md) audit, and every remaining buildable Civil War battle or campaign known to this project carries a forward research packet across the 11 lanes above. A future battle-build slice should find its evidence already assembled here.

## Shared build discipline (every future spec pass must honor)

- **D74 no-fudge:** outcomes emerge from OOB, terrain, timing, doctrine, universal gun-counts, and `scoreWeight`. No `damage`/`dmg`/`fireMult`/`fireMultiplier`/`casualtyMult`/`lossMult`/`killMult`/`powerMult`/`fudge` or any battle-only combat switch. Casualty figures are **direction guards**, never count-forcing gates.
- **D92 accurate inputs:** history enters only as accurate default equipment (true soldier/gun counts, weapons, terrain, doctrine); the probable result lands near history because the inputs are true.
- **Rank-at-the-battle discipline:** the #1 recurring defect. Re-verify every commander's exact rank on the battle date (CSA had no lieutenant-general grade before Oct 1862; watch backdated/posthumous promotions).
- **Both-baselines gotcha (D86/D88/D90):** a new battle id must be added to **both** `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs` EXPECTED baselines.
- **Dignity line:** a massacre is never a scored/playable objective — memory and teaching only.

## Guard

`tools/probe-battle-build-research.mjs` is the filesystem gate for this library: it verifies the folder, all required packet files, that each packet carries a Source Register / OOB-and-rank traps / playable-shape recommendation / D74 no-fudge section / probe teeth / final verdict, that this README indexes every packet, and that no packet claims **READY_FOR_SPEC** without ≥2 source-register entries and explicit remaining traps.
