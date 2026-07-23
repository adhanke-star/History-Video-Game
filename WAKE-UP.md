# ☀ WAKE-UP — current project state

<!-- LIVE-HEAD-SUMMARY:BEGIN -->
<!-- LIVE-HEAD decision=D542 next-lane=LANE-022 state=DRIVE owner=Claude -->
> **Live status (D542, 2026-07-23):** `LANE-022` **takes Claude Code DRIVE for Slice 3** — repair plus finite engineering capacity, the slice where Aaron's logged Engineering Corps directive lands **load-bearing** rather than decorative. This is the contract-before-teeth commit the Contract Relay's hard rule requires: the lane carries the complete Slice-3 acceptance contract as committed prose and **NO runtime byte moved**. Game `4764b1fccb40c473edd871621497f62b`, srcTree `5f6d33325fa5feb04f6d5b11e3f5a3b7`, suite **142**, manifest 112, data 65, `_SAVE_VER` 1 and the frozen base `c9db83fa99230ffb95bdfdfe059f3fb9` all HOLD and are NOT re-pinned. **D541 remains the ARC 7 product head until Slice 3 ships.**
>
> **What Slice 3 contracts.** Clearing a cut costs finite engineering capacity: the Construction Corps rebuilds a cut rail line, the Pontoon Train restores a cut water crossing (roads stay absent until Slice 5, so "clearing" acts on a Slice-2 cut rail/water service condition, never on a road). Capacity is derived from the shipped `C.engineering.levels` (Construction + Pontoon branches), and the **B-5 effectiveness/realism slider** (`fldPresetResolve().attrition`, clamped `[0.6, 1.4]` exactly as `T13`'s `fldEngRealism`) governs magnitude. Repair EXTENDS the shipped `conquestSupplySetCondition` clear-path plus a capacity ledger `C.conquest.supply.repair` — no fourth mutator, no second owner. Multiple simultaneous cuts exceed one pass's capacity, forcing the standing decision "which artery do you restore, or accept the longer water route?" (design law §5). Save stays **purely additive** (`_SAVE_VER` 1, the D447/GEA-12 precedent); containment fails CLOSED both directions at the same `_lgTraceRuleset` seam; non-conquest play stays byte-identical.
>
> **Authority:** design-law §4 Slice 3 + Aaron's logged Engineering Corps + B-5-slider directive. Historical transport movement, Historical roads, the four `CTI-*` faces and E46 remain blocked.
<!-- LIVE-HEAD-SUMMARY:END -->

Read the first ⚡ amendment in [`HANDOFF.md`](HANDOFF.md) for D514's completion-loop algorithm, authorized queue, road/no-road boundary, stop conditions, and exact next work. Do not stop at ordinary milestone or phase boundaries; preserve per-slice contracts, gates, commits, pushes, and lane ownership.

**Older wake-up heads:** preserved byte-verbatim in [`legacy/WAKE-UP-ARCHIVE.md`](legacy/WAKE-UP-ARCHIVE.md), newest at top; the archive is evidence only.
