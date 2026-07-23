# Conquest supply-chain design law (D537, Aaron-ratified 2026-07-23)

**Status:** LAW. Ratified in the D537 decision session by Aaron directly, card by card. This packet
is the binding design law for the ARC 7 conquest transport/supply ladder. It does not authorize
implementation by itself — every slice below still needs its own committed acceptance contract in
`COORDINATION.md` LANE-022 before any runtime edit, per the Contract Relay's contract-before-teeth
rule.

**Owning lane:** LANE-022 · conquest-mayhem-supply-ladder.
**Product head at ratification:** D525. **Predecessor evidence lanes:** LANE-019 (untouched by this
packet; its historical-evidence contract remains exact).

---

## 0 · Why this packet exists — the finding that forced the fork

Three separate citation-grade research passes closed with **zero** established physical windows:

| Pass | Decision | Result |
|---|---|---|
| Rail, exact 27 rows | D528 | 0 established · 19 snapshot-only · 7 unresolved · 1 disputed |
| Inland water + bounded sea, exact 15+2 | D530 | 0 established · 11 snapshot-only · 6 unresolved · 0 disputed |
| Roads, exact six claim-specific gaps | D532 | 2 cured (`RD-SI06`, `RD-SI13`) · 4 unresolved · 0 disputed |

D526 is the load-bearing ruling behind all three: the services' verbatim `dateText` is deliberate
source evidence, **not** a machine-readable physical window. Its decisive counterexample is
`CTS-S-02` / `WE-26` — "Through 15 Jan. 1865; closed thereafter" describes Fort Fisher closing the
Cape Fear approach *to blockade runners*, and mapping that phrase to a generic service end date
**reverses the history**.

Therefore Historical transport movement is not blocked by unfinished work. It is blocked by
**exhausted sources**, and no further research pass is expected to change that. D526 named the four
remaining closures: no turn-cursor state holder, **unsourced opening control/service values**,
unchosen receipt payloads/preconditions/transitions, and route queries that would require forbidden
topology or prose parsing.

Those are *historical* obligations. **Mayhem carries none of them** — it is a shipped, public,
separately-ruled ruleset (LANE-007, D420, `MAYHEM_PUBLIC_READY=true`) that may lawfully author its
own content. That asymmetry is the entire basis of this packet.

## 1 · THE RATIFIED FORK (Aaron, D537)

> **Build the transport/supply ladder on the Mayhem ruleset now. Historical movement stays
> evidence-gated and visibly unavailable until physical windows are source-proved.**

Rejected alternatives, recorded so they are not relitigated:

- **Relaxing the Historical evidence floor** to accept the 19 rail + 11 water snapshot-only rows
  under a labeled Inferred tier — rejected. D526's Fort Fisher counterexample shows qualitative
  prose can invert the source's meaning, and a shipped save would carry the error forward.
- **A sixth research pass** — rejected as the *primary* route. Five passes have returned zero
  established windows. Research may continue opportunistically; it no longer blocks or paces work.
- **Closing transport movement outright** and spending ARC 7 on its other four children — rejected.
  A conquest layer without movement is not a conquest layer.

## 2 · THE NON-NEGOTIABLE BOUNDARY — Historical containment

This is the highest-risk surface in the whole ladder and it is **structural, not cosmetic**.

1. Every authored Mayhem supply object — road segment, interchange, opening control value, opening
   service value — must be **structurally incapable** of surfacing under the Historical ruleset. A
   label or a filter is insufficient; the boundary fails **closed** at the ruleset seam.
2. D511's and D532's zero-road-service negative remains **exact for Historical**. So do New
   Orleans-origin, CT-36, the D503 endpoint quarantine, the Potomac/operation-composition/
   Sherman-chain negatives, and the permanent unassignment of Boonville, Arrow Rock and Glasgow.
3. The four rail interchange faces `CTI-01`..`CTI-04` stay `INTERCHANGE_WINDOW_UNADJUDICATED` for
   Historical **permanently**. Mayhem may author interchanges freely as game content (Aaron, D537).
4. Every slice carries a probe tooth proving the boundary in **both** directions: an authored object
   is reachable in Mayhem, and the identical query under Historical returns the absent/unavailable
   result. A negative bind must red exactly that tooth.
5. `src/115-conquest-transport.js` — the immutable read-only 27/15/2/4/18 evidence substrate shipped
   at D506/D521 — is **read-only forever**. Authored Mayhem content never writes into it and never
   merges with it in a shared namespace.

## 3 · THE SEAM — what actually changes, and what does not

**Already shipped and reused unchanged:**

- `src/61-logistics-rail.js` computes `network` / `depotReach` / `marchBurden` / `arteryIndex` from
  production, blockade and war-room nodes, and `logisticsBridgeBonus()` hands battle a **capped**
  packet: `supply ≤ 7`, `fatigueRelief ≤ 5`, `overall ≤ 2` (`_lgCfg().bridgeCaps`).
- `wr.supply` (0–100) feeds troop morale at weight 0.15 (`src/33-morale.js:95`).
- `src/36-camp.js` and `src/37-loot-survival.js` use the same bounded supply lever.
- `src/114-conquest-board.js` — the read-only 36-territory board.
- `src/116-conquest-state.js` — immutable `C.campaignKind`, preserved immutable `C.ruleset`, exact
  empty extensible `C.conquest` factory (D523); the frozen 25-interval calendar query (D525).
- `src/60-blockade.js` plus the nine other modules that already read blockade state.

**The single structural change:** `_lgRoute(C, bd)` (`src/61-logistics-rail.js:51`) today returns a
**static per-battle friction** from the logistics data table over a fixed battle chain — exactly the
defect GEA-11 filed ("`src/61-logistics-rail.js:227` explicitly preserves a readout-only theater map
and fixed battle chain"). In a conquest campaign it instead returns a **traced path** across the
36-territory board: source depot → rail / water / road segments → the army's territory.

Everything downstream of `_lgRoute` is untouched. **The supply→battle channel is therefore already
bounded and already D74-legal; this ladder does not create a new combat channel.**

## 4 · THE SLICE LADDER (each needs its own LANE-022 contract before implementation)

### Slice 1 — traced route, READ-ONLY (Aaron-ratified: read-only trace first)
Replace `_lgRoute`'s static lookup with a real trace over the board for conquest campaigns. It
**changes no outcome**: the capped bridge keeps its current values, and the sim stays byte-identical.
Rationale (Aaron, D537): it proves the trace against the 36-territory board under the cheapest
possible D74 proof, and every later slice inherits a verified path. This is the same discipline that
landed D521, D523 and D525.
**Gating proof:** conquest-OFF byte-identity leg + fresh-campaign A/B, both zero-diff.

> **BUILD STATUS — SHIPPED (contract D538, delivered D539, 2026-07-23).** Both gating legs returned ZERO
> diffs (direction battery `18f609d07b1190904ec0c11e4ca64675`, `probe-full-campaign`
> `a38185fd371a7f181250eff3a6cbf76a`, byte-identical at `0829d8d` and at the shipped head). Containment
> fails closed at the ruleset seam on OWN, data-valued descriptors — hardened mid-slice after the acceptance
> teeth caught an inherited-prototype leak. **Recorded finding for Slice 5:** projecting the 44 sourced
> services yields ELEVEN disconnected components, so most traced pairs are `reachable:false`; the default
> `US`/`E` route resolves in one rail segment (`CTS-R-02`) and `CS`/`E` does not resolve at all. That gap is
> the measured reason the authored road layer exists, and it was not cured by inventing a service, window,
> interchange or endpoint. Slice 2 is the first slice that adopts `tracedFriction`, flips `applied`, and
> therefore owns the first sim-affecting A/B.

### Slice 2 — control/service receipts and cuts
Territory control and per-segment service condition become real state; a cut segment degrades
`depotReach` for every army downstream of it. First slice where supply has teeth.

### Slice 3 — repair and engineering capacity
Repair costs time and finite engineering capacity. **This is where Aaron's logged Engineering Corps
directive lands and becomes load-bearing** rather than decorative: pontoons restore a water crossing,
clearing restores a road segment, entrenching and abatis keep their tactical roles. The B-5
effectiveness/realism slider governs magnitude, per the original directive.

### Slice 4 — blockade / sea edge (Aaron-ratified: blockade severs the sea edge)
Blockade state gates the two bounded sea services as the Confederate import edge: tightening the
blockade **closes a supply mode**, not merely an economy number. Reuses shipped blockade state across
its existing ten consumer modules; adds no new owner. The committed naval engine on the D382 slate
may later land on top of this edge. The richer contested river-control layer (gunboats, forts,
Island No. 10-class chokepoints) was considered and deferred — it is a second ARC, not a slice.

### Slice 5 — authored Mayhem road layer (Aaron-ratified: sourced seed + authored network)
`RD-SI06` and `RD-SI13` ship as **sourced, labeled exemplars that teach road failure**, and the rest
of the Mayhem road network is **openly authored game content, visibly marked as such**, structurally
barred from Historical per §2.

The two cured rows are the right seed precisely because they document roads *failing*:
- **`RD-SI06`** — Corse's Fourth Division, Robertsville–Lawtonville–Coosawhatchie–Whippy route:
  inclement almost-impassable roads, pioneer labor, miles of corduroy, wagon passage, and the
  11 February Binnaker's Bridge pontoon crossing. (Official Records Series I, vol. 47, pt. I,
  Report No. 32, pp. 337–338.)
- **`RD-SI13`** — the same division at Laurel Hill on 9 March: violent all-day rain, flooded
  almost-impassable roads, exhausted men and animals, a forced midnight halt. (Same report,
  pp. 340–342.)

Rejected: shipping only those two rows (two Sherman-campaign segments cannot form a network), and
authoring everything with no special status for the cured rows (discards the only citation-grade road
evidence five passes produced, and loses the teaching).

### Slice 6 — legal-order AI
The AI's order filter respects supply legality under the **same rules as the player**. Non-negotiable:
an AI that ignores supply punishes only the player.

### Slice 7 — first playable-loop release checkpoint
The full serialized 140-row battery, alone on the machine (S-03 item 5), with every artifact read.

## 5 · THE TEACHING — mode economics

The ladder's historical payload is that the three modes fail differently, which is why armies fought
for railroads:

- **Water** — highest volume, lowest cost; fails to freeze, flood, low water, and blockade.
- **Rail** — fastest; brittle, easily raided, and broken by gauge changes and destroyed bridges.
- **Road** — universal and always available; slowest, lowest volume, and destroyed by weather. This
  is exactly what `RD-SI06` and `RD-SI13` document.

Finite repair capacity across multiple simultaneous cuts produces the intended standing decision:
**which artery do you restore, or do you accept a longer water route instead?**

## 6 · STANDING RISKS AND THEIR CONTROLS

| Risk | Control |
|---|---|
| Historical contamination by authored Mayhem content | §2 — fail-closed at the ruleset seam, probe-bound both directions, negative bind per slice |
| D74 / no-fudge — supply writing outcomes directly | Supply stays a **bounded conditioning input** through the existing capped bridge; conquest-OFF byte-identity leg plus fresh-campaign A/B on every sim-touching slice |
| Save-shape drift | `C.conquest` is an empty extensible factory today; every added field is a save change. **Legacy-save byte identity is the gating tooth** (the GEA-12 / D447 precedent) |
| A second logistics owner | `presLogisticsBlock` / `logisticsSetPriority` / `logisticsOnResolve` are the shipped owners. **Extend them; never fork a parallel logistics store** (LANE-020's no-second-owner law, generalized) |
| AI parity | Slice 6 — supply legality in the AI order filter, same rules both sides |
| Scope creep across slices | One committed LANE-022 contract per slice; no slice may absorb its successor |

## 7 · WHAT THIS PACKET DOES NOT AUTHORIZE

No implementation. No data or runtime edit. No Historical service, road service, interchange,
window, eligibility, topology, capacity or movement authority. No change to
`src/115-conquest-transport.js`, `data/*`, `build/base.html`, the generated deliverable, the manifest,
the suite, or any save owner. D525 remains the product head until a LANE-022 slice ships and says
otherwise.
