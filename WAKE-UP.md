# ☀ WAKE-UP — current project state

<!-- LIVE-HEAD-SUMMARY:BEGIN -->
<!-- LIVE-HEAD decision=D541 next-lane=LANE-022 state=CONTRACT owner=none -->
> **Live status (D541, 2026-07-23):** `LANE-022` **Slice 2 SHIPS** — control and per-segment service condition become REAL STATE, and supply BITES inside a conquest campaign: a cut segment degrades `depotReach` for every army downstream (64 → 52 on the traced US line), `applied` flips true, and `_lgRoute` adopts `tracedFriction` into `friction`. **Non-conquest play stays byte-identical.** The lane releases to `CONTRACT` / `none`.
>
> **Boundary:** `src/61-logistics-rail.js` only, plus its two probes, the CF-1 re-pin, and five mechanical pin re-anchors. Game `45278110`→`4764b1fccb40c473edd871621497f62b`, srcTree `08f95d9e`→`5f6d33325fa5feb04f6d5b11e3f5a3b7`, suite **142** (no probe added), manifest 112, data 65, `_SAVE_VER` **1** (purely additive save), `build/base.html` frozen. **D541 replaces D539 as the ARC 7 product head**; LANE-019 stays unrewritten and every one of its boundary sentences stays exact.
>
> **Authority:** D537 ruling 1 and design-law §4 Slice 2. Three A/B legs — two zero-diff (direction battery `18f609d0…`, `probe-full-campaign` `a38185fd…`) and one honest conquest-ON leg adjudicated under D92. Containment fails CLOSED at the ruleset seam in BOTH directions; the ELEVEN-component substrate gap is a first-class TAUGHT case that never becomes a penalty. Historical transport movement, Historical roads, the four `CTI-*` faces and E46 remain blocked.
<!-- LIVE-HEAD-SUMMARY:END -->

Read the first ⚡ amendment in [`HANDOFF.md`](HANDOFF.md) for D514's completion-loop algorithm, authorized queue, road/no-road boundary, stop conditions, and exact next work. Do not stop at ordinary milestone or phase boundaries; preserve per-slice contracts, gates, commits, pushes, and lane ownership.

**Older wake-up heads:** preserved byte-verbatim in [`legacy/WAKE-UP-ARCHIVE.md`](legacy/WAKE-UP-ARCHIVE.md), newest at top; the archive is evidence only.
