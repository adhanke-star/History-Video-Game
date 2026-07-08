# Battle-Build Research Library (D327)

Durable, citation-grade research packets for the **remaining buildable battle lanes** of "The Civil War." This is **research/docs only** — no packet here adds `data/*.json`, a registry line, a menu button, generated HTML, or any combat code. Each packet is what a future implementer (Codex or Claude) reads *before* writing a `D###` spec, so a battle is authored from sources and re-verified OOB/rank/terrain traps rather than from memory or invented data.

**Why this exists:** D325/D326 shipped Chattanooga by first writing a durable spec packet (`docs/design/chattanooga-battle-build-spec.md`) and only then implementing. D327 generalizes that discipline to every remaining lane, so the next battle-build slices start from verified evidence, honor **D74** (one universal combat model — no per-battle fudge), and honor **D92** (accurate inputs drive the probable result; never an output gate) and citation-grade, anti-Lost-Cause history.

## How each packet was produced

An Opus research→adversarial-verify workflow (5 lanes × [Opus researcher with live WebSearch/WebFetch → Opus adversarial verifier that re-fetched the riskiest claims]) plus a main-loop (Opus 4.8) final-verifier pass. The adversarial pass caught and corrected real defects before these landed — e.g. Forrest was **Lt. Col.** (not Col.) at Fort Donelson; the 54th Massachusetts lost **~40-45%** (not ">50%") at Fort Wagner; the Jonesborough casualty figures were day-by-day mislabeled; two-phase scoreWeights sum to **4** (not 5); and the Cold Harbor "7,000 in 30 minutes" figure is a disputed myth, not an engine input. Every packet ends with a **Verification Notes** section recording what was fetched, corrected, and flagged.

## Verdict taxonomy

- **READY_FOR_SPEC** — enough verified evidence exists to write a `D###` spec next. Requires ≥2 reputable source-register entries *and* an explicit "Remaining Traps" list (residual OOB/strength/terrain items to pin during the spec pass).
- **NEEDS_MORE_RESEARCH** — exact OOB/ranks/terrain are still too thin to encode.
- **DO_NOT_BUILD_NOW** — important but not safely playable yet (needs an engine the project lacks, e.g. a naval mode) or a dignity line forbids it (a massacre must never be a gamified "win").

## The packets

| Packet | Lane | Verdict | Lead buildable candidate | Exact next slice |
|---|---|---|---|---|
| [atlanta-march-battle-build-research.md](atlanta-march-battle-build-research.md) | Atlanta Campaign & March to the Sea | **READY_FOR_SPEC** | **Kennesaw Mountain** (single-phase, attacker historically loses) + Jonesborough (T8 two-phase capstone) | D### Kennesaw Mountain single-phase spec + probe scaffold; March to the Sea stays teaching-only |
| [franklin-nashville-battle-build-research.md](franklin-nashville-battle-build-research.md) | Hood's Tennessee Campaign | **READY_FOR_SPEC** | **Franklin** (single-phase defender-hold) + Nashville (T8 two-phase) | D### Franklin single-phase spec + probe scaffold; Spring Hill stays teaching-only |
| [usct-battle-build-research.md](usct-battle-build-research.md) | USCT / Black combat agency | **READY_FOR_SPEC** | **New Market Heights / Chaffin's Farm** (T8 two-phase, 14 Medals of Honor) | D### New Market Heights spec + probe scaffold **+ Fort Pillow dignity guard** (massacre = teaching-only, DO_NOT_BUILD) |
| [naval-river-battle-build-research.md](naval-river-battle-build-research.md) | Naval & river battles | **READY_FOR_SPEC** (Fort Donelson only) | **Fort Donelson** (T8 three-phase land siege) | D### Fort Donelson 3-phase spec; Hampton Roads / Mobile Bay / Fort Henry are DO_NOT_BUILD_NOW (need a naval engine) |
| [1864-65-attrition-battle-build-research.md](1864-65-attrition-battle-build-research.md) | Overland Campaign & Petersburg | **READY_FOR_SPEC** | **Spotsylvania "Bloody Angle"** (single-phase) → Overland Campaign (T8 three-phase) | D### Spotsylvania single-phase spec; the Crater ships as a failed-assault scenario with the massacre as teaching only |

## Built-battle audits (D328)

The forward packets above cover **unbuilt** lanes. The companion [built-battles/](built-battles/README.md) subfolder (D328) holds a citation-grade research/audit of the **10 already-built** battles (Bull Run, Antietam, Fredericksburg, Chancellorsville, Malvern Hill, Gettysburg, Shiloh, Vicksburg, Chickamauga, Chattanooga) so Codex can revise them alongside building new battles. Result: **9 of 10 are SOLID_AS_IS** (the D92/D86/D90/D325 hardening held); **Antietam** needs one outcome-neutral rank-label fix (`us_richardson.commander` Brig. Gen. → Maj. Gen., an internal self-contradiction with its own leader entry); one auditor false flag (Fredericksburg's Owen) was correctly refuted.

## Most-ready lane and what stays research-thin

- **Most ready for the next implementation slice:** **Atlanta/March → Kennesaw Mountain** (a clean single-phase "attacker historically loses" build that fits the objective-hold engine grain with zero fudge), which also matches the standing queue (Priority 1 after Chattanooga). Franklin (single-phase defender-hold) and Fort Donelson (3-phase land siege) are close seconds.
- **Research-thin / not yet buildable:** every **ship-vs-ship** action (Hampton Roads, Mobile Bay, Fort Henry, the river-passage fights) is **DO_NOT_BUILD_NOW** — the project has a land brigade engine only. **Fort Pillow** is **DO_NOT_BUILD** as a scenario on dignity grounds (a massacre of surrendering Black soldiers) and may exist only as a teaching card. Across the READY lanes, the residual gaps are **sector-level engaged OOB strengths** (the ABT "campaign totals" are unusable as engaged inputs) and a handful of **cite-pending URLs** — each packet's "Remaining Traps" section names them.

## Shared build discipline (every future spec pass must honor)

- **D74 no-fudge:** outcomes emerge from OOB, terrain, timing, doctrine, universal gun-counts, and `scoreWeight`. No `damage`/`dmg`/`fireMult`/`fireMultiplier`/`casualtyMult`/`lossMult`/`killMult`/`powerMult`/`fudge` or any battle-only combat switch. Casualty figures are **direction guards**, never count-forcing gates.
- **D92 accurate inputs:** history enters only as accurate default equipment (true soldier/gun counts, weapons, terrain, doctrine); the probable result lands near history because the inputs are true.
- **Rank-at-the-battle discipline:** the #1 recurring defect. Re-verify every commander's exact rank on the battle date (CSA had no lieutenant-general grade before Oct 1862; watch backdated/posthumous promotions).
- **Both-baselines gotcha (D86/D88/D90):** a new battle id must be added to **both** `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs` EXPECTED baselines.
- **Dignity line:** a massacre is never a scored/playable objective — memory and teaching only.

## Guard

`tools/probe-battle-build-research.mjs` is the filesystem gate for this library: it verifies the folder, all required packet files, that each packet carries a Source Register / OOB-and-rank traps / playable-shape recommendation / D74 no-fudge section / probe teeth / final verdict, that this README indexes every packet, and that no packet claims **READY_FOR_SPEC** without ≥2 source-register entries and explicit remaining traps.
