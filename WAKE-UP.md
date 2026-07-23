# ☀ WAKE-UP — current project state

<!-- LIVE-HEAD-SUMMARY:BEGIN -->
<!-- LIVE-HEAD decision=D539 next-lane=LANE-022 state=CONTRACT owner=none -->
> **Live status (D539, 2026-07-23):** `LANE-022` **Slice 1 SHIPS** — `_lgRoute`'s static per-battle lookup becomes a REAL TRACE over the read-only 36-territory board for conquest carriers on the open ruleset, closing the GEA-11 defect at its named seam. Read-only: `applied:false`, `friction` unmoved, every downstream logistics owner untouched, and **both A/B legs zero-diff**. The lane releases to `CONTRACT` / `none`.
>
> **Boundary:** `src/61-logistics-rail.js` only, plus two new probes and mechanical pin re-anchors. Game `859637ed`→`45278110cb73ea4719fa41ffef7682f9`, srcTree `003d308a`→`08f95d9e9311e90313cc5b7a930f9380`, suite **140 → 142**, manifest 112, data 65, `_SAVE_VER` 1, `build/base.html` frozen. **D539 replaces D525 as the ARC 7 product head**; LANE-019 is deliberately unrewritten and every one of its boundary sentences stays exact.
>
> **Authority:** D537 ruling 4 — read-only first, so the trace's correctness proof is never mixed with a sim-affecting A/B. Containment fails CLOSED at the ruleset seam on OWN, data-valued descriptors; the honest ELEVEN-component result is recorded, not cured. Historical transport movement, Historical roads, the four `CTI-*` faces and E46 remain blocked.
<!-- LIVE-HEAD-SUMMARY:END -->

Read the first ⚡ amendment in [`HANDOFF.md`](HANDOFF.md) for D514's completion-loop algorithm, authorized queue, road/no-road boundary, stop conditions, and exact next work. Do not stop at ordinary milestone or phase boundaries; preserve per-slice contracts, gates, commits, pushes, and lane ownership.

**Older wake-up heads:** preserved byte-verbatim in [`legacy/WAKE-UP-ARCHIVE.md`](legacy/WAKE-UP-ARCHIVE.md), newest at top; the archive is evidence only.
