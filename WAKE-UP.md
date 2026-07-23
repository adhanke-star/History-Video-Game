# ☀ WAKE-UP — current project state

<!-- LIVE-HEAD-SUMMARY:BEGIN -->
<!-- LIVE-HEAD decision=D540 next-lane=LANE-022 state=DRIVE owner=Claude -->
> **Live status (D540, 2026-07-23):** `LANE-022` takes **Claude Code DRIVE for Slice 2 — control/service receipts and cuts**, the FIRST sim-affecting slice of the ARC 7 ladder. **CONTRACT ONLY — no runtime byte moved here.** Territory control and per-segment service condition become real state in one namespace; a cut segment degrades `depotReach` for every army downstream; `applied` flips true and `tracedFriction` is adopted into `_lgRoute`'s `friction`.
>
> **Boundary:** contract-before-teeth per the Contract Relay hard rule — `src/`, `data/`, `build/`, the manifest, the suite, the save shape and the generated deliverable are untouched, so game `45278110cb73ea4719fa41ffef7682f9`, srcTree `08f95d9e9311e90313cc5b7a930f9380`, suite **142**, manifest 112, data 65, `_SAVE_VER` 1 and the frozen base `c9db83fa99230ffb95bdfdfe059f3fb9` do NOT move and are NOT re-pinned. **D539 remains the ARC 7 product head until Slice 2 ships.**
>
> **Authority:** D537 ruling 1 and `docs/design/conquest-supply-chain-design.md` §4 Slice 2. Containment stays fail-closed at the ruleset seam in BOTH directions; the ELEVEN-component substrate gap is made a first-class, TAUGHT case that never becomes a penalty, not cured. Historical transport movement, Historical roads, the four `CTI-*` faces and E46 remain blocked.
<!-- LIVE-HEAD-SUMMARY:END -->

Read the first ⚡ amendment in [`HANDOFF.md`](HANDOFF.md) for D514's completion-loop algorithm, authorized queue, road/no-road boundary, stop conditions, and exact next work. Do not stop at ordinary milestone or phase boundaries; preserve per-slice contracts, gates, commits, pushes, and lane ownership.

**Older wake-up heads:** preserved byte-verbatim in [`legacy/WAKE-UP-ARCHIVE.md`](legacy/WAKE-UP-ARCHIVE.md), newest at top; the archive is evidence only.
