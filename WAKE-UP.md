# ☀ WAKE-UP — current project state

<!-- LIVE-HEAD-SUMMARY:BEGIN -->
<!-- LIVE-HEAD decision=D543 next-lane=LANE-022 state=CONTRACT owner=none -->
> **Live status (D543, 2026-07-23):** `LANE-022` **Slice 3 SHIPS** — repair costs FINITE engineering capacity, and the logged Engineering Corps directive is now load-bearing. Clearing a cut runs through the shipped `conquestSupplySetCondition`, consulting a pure capacity reader over `C.engineering.levels` scaled by the **B-5 slider** (`fldPresetResolve().attrition`, `[0.6,1.4]`) plus a per-pass ledger `C.conquest.supply.repair`; a repair the corps cannot afford, or lacks the branch for, is REFUSED so the cut stands — the standing decision (a Construction-1 corps restores only **2 of 27** cut rail arteries per pass). **Non-conquest play stays byte-identical.** The lane releases to `CONTRACT` / `none`.
>
> **Boundary:** `src/61-logistics-rail.js` only, plus its two probes and five mechanical pin re-anchors. Game `4764b1fc`→`98f3feaf0de89b3b47eda6b1347dacd0`, srcTree `5f6d3332`→`c4fc64ebe6d49d9cdfc79885b4c05d8b`, suite **142** (no probe added), manifest 112, data 65, `_SAVE_VER` **1** (purely additive save), `build/base.html` frozen. **D543 replaces D541 as the ARC 7 product head**; LANE-019 stays unrewritten.
>
> **Authority:** design-law §4 Slice 3 + the logged Engineering Corps / B-5 directive. Three A/B legs — two zero-diff (direction battery `18f609d0…`, `probe-full-campaign` `a38185fd…`) and one honest conquest-ON leg adjudicated under D92 (a repair restores friction 40→7 and depotReach toward TRACED; pontoons restore water, Construction restores rail; Historian 28 / Balanced 37 / Arcade 40 capacity). Containment fails CLOSED at the ruleset seam both directions; Bind D542-B1 redded only `CONTAINMENT-B` with a byte-identical restore. Historical transport movement, Historical roads, the four `CTI-*` faces and E46 remain blocked.
<!-- LIVE-HEAD-SUMMARY:END -->

Read the first ⚡ amendment in [`HANDOFF.md`](HANDOFF.md) for D514's completion-loop algorithm, authorized queue, road/no-road boundary, stop conditions, and exact next work. Do not stop at ordinary milestone or phase boundaries; preserve per-slice contracts, gates, commits, pushes, and lane ownership.

**Older wake-up heads:** preserved byte-verbatim in [`legacy/WAKE-UP-ARCHIVE.md`](legacy/WAKE-UP-ARCHIVE.md), newest at top; the archive is evidence only.
