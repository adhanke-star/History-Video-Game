# Cold Harbor (June 3, 1864) — Battle-Build Spec

**Status:** D439 durable spec (LANE-010, D431/D432 overnight queue item 7; spec-first). The
D395 explicit-reorder gate is SATISFIED by the D431 directive ("get all queue items done").
Runtime is NOT part of this slice unless the night allows; the authored plan probe
(`tools/probe-cold-harbor-plan.mjs`) gates this spec and refuses a half-registered runtime.
**Packet law:** `docs/design/battle-build-research/1864-65-attrition-battle-build-research.md`
(D327, verdict READY_FOR_SPEC; Cold Harbor is packet-High, rank 3: "One coherent fight;
open-approach-into-entrenched-enfilade is exactly the attacker-fails geometry the grain
produces, and honestly a Union tactical failure").
**Source spine (packet-fetched, D327 adversarial pass):** ABT Cold Harbor
(https://www.battlefields.org/learn/civil-war/battles/cold-harbor) — CONFIRMED at fetch:
casualties 12,737 US (1,844 k / 9,077 w / 1,816 m) vs 4,595 CS (83 k / 3,380 w / 1,132 m);
the June 3 4:30 a.m. assault by the Second, Sixth, and Eighteenth Corps; Grant's regret quote
("I have always regretted that the last assault at Cold Harbor was ever made..."); Confederate
victory. The runtime session live-fetches a second reputable page (NPS Richmond or Wikipedia
Battle of Cold Harbor) before authoring OOB numbers — the packet's §9 spec-time items are
BINDING verification obligations, not optional.

## 1. Shape

**Single-phase doomed frontal assault. Attacker = US, defender = CS. Historical result: CS
victory — the attacker FAILS.** This is the lane's cleanest attacker-fails teaching scenario
(the Kennesaw geometry at Overland scale): open approach + dense CS entrenchment + enfilade
+ fog OFF. The June 3 dawn assault is the fight; the June 1-12 trench period is teaching
prose, never a phase.

- Objective: **carry the entrenched Confederate line** (defender-hold grain; the objective
  sits inside the CS works). Historically the assault gains nothing that holds.
- Fog OFF (packet §7: the historical dawn fog aided confusion, but the killing ground is
  modeled via terrain + few gaps in the works, NOT a per-battle fog defender-buff).
- assaultDoctrine "standard"; holdToWinSec/timeLimitSec in the shipped single-phase band
  (Kennesaw/Fredericksburg precedent).

## 2. Command frame and the rank wall (packet §4 + §9)

- **Grant: Lieutenant General, USA** — general-in-chief traveling WITH the army; **Meade:
  Maj. Gen., USA** commands the Army of the Potomac (the command-frame honesty the Overland
  builds already carry — Grant directs, Meade commands).
- US corps on the assault front: **Hancock (II, Maj. Gen.)**, **Wright (VI, Maj. Gen. —
  succeeded Sedgwick after May 9; never Sedgwick here)**, **W. F. "Baldy" Smith (XVIII,
  Maj. Gen., ON LOAN from the Army of the James — §9 item: confirm identity/strength before
  OOB)**.
- **Lee: General, CSA.** CS corps/divisions on the line: **Anderson (First Corps — §9 item:
  his exact dated title must be re-verified before the OOB ships; encode the corps identity,
  not an unverified grade)**, **Early (Second Corps — succeeded Ewell late May 1864)**,
  **A. P. Hill (Third Corps)**, with **Hoke's** and **Breckinridge's** divisions holding the
  assault sector. Division-scale abstractions; every strength Inferred inside the army
  anchors.
- Dead-officer wall: no Sedgwick (d. May 9), no Stuart (d. May 12), no Longstreet (wounded
  May 6) on this field.

## 3. Engaged-strength honesty

The ABT casualty totals are CAMPAIGN aggregates (May 31 - Jun 12). The June 3 assault is the
scenario: committed envelopes **US [15000, 25000] / CS [10000, 18000]** (the three assaulting
corps' engaged fronts vs the entrenched sector), every division split Inferred, phase totals
below the army anchors. **The "7,000 in 30 minutes" figure is teaching-flavor ONLY** (ABT
states it; Rhea's scholarship disputes it — packet §7 fences it as a non-input): it may
appear in ONE teaching card as a disputed tradition, never as a casualty count, seed, or
guard.

## 4. Terrain and landmarks (packet §5)

The **Cold Harbor crossroads**, the entrenched CS line with its **enfilading angles**, the
**ravines and swampy approach ground**, the **killing field** in front of the works, few and
narrow **gaps** in the entrenchment trace (the structural seams that make the assault honest
rather than hopeless). Walls carry the works; the approach is open and low; the objective
ring sits behind the entrenchment line.

## 5. D74 no-fudge law (packet §7)

The lane's signature temptation, named and forbidden: NO `casualtyMult`/`lossMult`/
`fireMult`/winner gate to force the lopsided US loss. The disparity must EMERGE from inputs:
open approach + dense entrenchments (wall cover) + enfilade geometry (line angles) + true gun
counts + defender readiness. If the direction comes out flat, fix INPUTS. A better-generaled
US assault may genuinely carry the works — history is the par, never a rail.

## 6. Teaching spine (packet §6 — anti-Lost-Cause)

1. **The honest Union failure** — Grant's own regret quote, verbatim from the fetched page;
   a hard, admitted error inside a sound campaign; NO "Grant the Butcher" caricature (the
   packet's dignity review names the myth and rebuts it).
2. **The 7,000-in-30-minutes tradition** — taught AS disputed historiography (ABT states it;
   Rhea lowers and lengthens it): how casualty myths calcify.
3. **The trench lesson** — June 1864 anticipates Petersburg: rifled muskets + spades ended
   the frontal assault's arithmetic; ties to the shipped Spotsylvania/Petersburg cards.
4. **The wounded between the lines** — the June 5-7 truce delay (Grant/Lee correspondence),
   taught plainly as command failure costing wounded men; two-source it at runtime or omit.
5. **What the campaign bought** — Cold Harbor's failure pushed Grant to the James crossing
   and Petersburg: the operational pivot the tactical defeat produced.

## 7. Integration pin table (moves ONLY with the runtime slice, documented at every site)

| Site | Transition |
|---|---|
| `data/cold-harbor.json` | new battle file (id `coldHarbor`), battle-object `sources` register (4e-2) |
| T1 registry + menu rank | `coldHarbor` between spotsylvania:68 (May 12) and petersburgAssaults:69 (Jun 15) — **rank 68.5, the documented non-integer exception** (the rank comparator is numeric; renumbering the table would churn every later pin for no history gain) |
| `_FLD_BATTLE_META` | `coldHarbor: { theater: "E", badges: true, csFlag: "anv" }` (AotP II/VI badges legible; XVIII is AoJ — badge institution models the AotP set only, the NMH precedent note) |
| schema enrollment | 56 → 57 |
| Army Register | 1566 → 1566 + U×3 at EVERY pin site |
| scenario-count pins | 25 → 26 at every site the D436 sweep touched |
| suite | 132 → 133 (`probe-cold-harbor` appended at the END — row pins hold) |
| `tools/probe-cold-harbor.mjs` | authored with the runtime (registry/rank/landmark/rank-wall/direction teeth: CS holds ≥5/8 AND US losses > CS ≥5/8) |

## 8. Plan-probe contract (authored THIS slice: `tools/probe-cold-harbor-plan.mjs`)

Dual-mode, fail-closed (the D390 pattern — a half-registration can never fall back to the
green planning branch):
- **Planning mode** (no `data/cold-harbor.json`): the spec exists and carries the §1 shape
  tokens (single-phase, attacker US, defender CS, fog OFF), the §2 rank wall (Grant Lt. Gen. /
  Meade command frame / Wright-not-Sedgwick / the Anderson + Baldy-Smith §9 obligations), the
  §3 envelopes and the 7,000-fenced-as-flavor rule, the §5 forbidden-key law, the Grant
  regret-quote anchor, and the §7 pin table incl. the 68.5 rank exception; the packet's
  Cold Harbor rows are present and unedited; NO tactical `coldHarbor` identifier exists in
  src/ or the generated game.
- **Runtime mode** (the data file exists): every §7 transition must be complete (registry
  line, rank 68.5, meta row, schema 57, Register bump at every pin site, suite 133, focused
  probe present) — any partial state is RED in BOTH modes.
