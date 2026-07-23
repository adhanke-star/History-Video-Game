# ☀ WAKE-UP — current project state

<!-- LIVE-HEAD-SUMMARY:BEGIN -->
<!-- LIVE-HEAD decision=D545 next-lane=LANE-022 state=CONTRACT owner=none -->
> **Live status (D545, 2026-07-23):** `LANE-022` **Slice 4 SHIPS** — the blockade / sea edge. For a CS carrier the held coastal ports that ORIGINATE a sourced sea service become supply **sources** beside the interior depot, and the shipped blockade lever gates them: `conquestSupplyTrace` reads `C.blockade.portsOpen`, so an **open** runner port TRACES the import and a **sealed** blockade (`portsOpen 0`) SEVERS it. `CS→CT-11` (Charleston via `CTS-S-01`) moves friction **8↔40** and the Western front `CS→CT-20` **16↔40** as the blockade opens and seals, while US play and the CS interior line stay **byte-identical**. Reuses shipped `C.blockade` state — **no new owner, no new field, `_SAVE_VER` 1, no authored constant**. The lane releases to `CONTRACT` / `none`.
>
> **Boundary:** `src/61-logistics-rail.js` only, plus its two probes and five mechanical pin re-anchors. Game `98f3feaf`→`0a5286c3b79c8011a6903ceb23772d80`, srcTree `c4fc64eb`→`7bcb0579d4e432950897500e7f0e5846`, suite **142** (no probe added), manifest 112, data 65, `_SAVE_VER` **1**, `build/base.html` frozen. **D545 replaces D543 as the ARC 7 product head**; LANE-019 stays unrewritten.
>
> **Authority:** design-law §4 Slice 4 + Aaron's ratified sea-import-port source model. Three A/B legs — two zero-diff (direction battery `18f609d0…`, `probe-full-campaign` `a38185fd…`) and one honest conquest-ON leg adjudicated under D92 (open TRACES the CS import, sealed SEVERS at the 40 ceiling; both columns logged). Containment fails CLOSED at the ruleset seam both directions; Bind D544-B1 redded only `CONTAINMENT-B` with a byte-identical restore. Historical transport movement, Historical roads, the four `CTI-*` faces and E46 remain blocked.
<!-- LIVE-HEAD-SUMMARY:END -->

Read the first ⚡ amendment in [`HANDOFF.md`](HANDOFF.md) for D514's completion-loop algorithm, authorized queue, road/no-road boundary, stop conditions, and exact next work. Do not stop at ordinary milestone or phase boundaries; preserve per-slice contracts, gates, commits, pushes, and lane ownership.

**Older wake-up heads:** preserved byte-verbatim in [`legacy/WAKE-UP-ARCHIVE.md`](legacy/WAKE-UP-ARCHIVE.md), newest at top; the archive is evidence only.
