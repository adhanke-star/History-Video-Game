# DECISION NEEDED — War Career receipt continuity before Slice C

**Status:** RESOLVED by the D404 planning contract, 2026-07-15. Aaron authorized alternate-timeline
gameplay through an exact journey-owned “Your Timeline” assignment while canonical source history
remains immutable. D404 selected a named, coexisting `cw_war_career_participation_v2` receipt over an
extended v1 shape, pinned the exact Haley Gettysburg→Chickamauga proof, and left runtime closed. This
file retains the D402-D403 contradiction and alternatives as decision provenance.

## Measured contradiction

D401 proves participation through the active person's exact immutable Army Register
`unitRef.battleId`. `_wcActiveLink` requires that source battle to equal the live campaign rung,
and the sanitizer requires every qualifying participation row to match the same canonical person,
slot, battle, and rung. The Union chain has 31 unique scenario ids in 31 rungs; the Confederate
chain has 28 unique ids in 28 rungs. The current identity can therefore qualify at most once.

COMRADE HAND-OFF selects a successor from the fallen person's same-battle company, regiment, or
brigade hierarchy. The qualifying `creditKey` for that rung is already immutable; after campaign
advance the successor's source battle is stale. The successor cannot earn a qualifying receipt.
Because explicit War Career starts remain Private through Captain, no legal player path can reach
and support a general-command billet under the D402 acceptance contract.

## Options

1. **Recommended: contract exact cross-rung service assignment first.** Run a planning-only slice
   that defines a journey-owned, result-independent assignment from the exact current person id to
   an exact future scenario-unit slot. It must use explicit stable ids, preserve the historical
   source grade and unit, label the alternate billet “Your Timeline,” fail closed when no exact
   mapping exists, and retain one credit per rung. The plan must inventory whether the existing
   D401 `explicit-career-assignment` schema can be extended without a second mutable identity truth.
2. **Permit several promotions from one receipt.** This can manufacture a general-command test from
   one battle, but it makes a Private-through-Captain career jump several grades on one result and
   turns balance numbers into a workaround for missing identity continuity.
3. **Widen explicit starts to field and general grades.** This creates a valid fixture but changes
   D400's start contract and still leaves every identity unable to qualify after its source battle.

## Aaron's first decision

Aaron selected option 1 on 2026-07-15. The ledger-only planning take is
`9fa199c89ed11bd995fc988d00f4fed0076b5667`. The required six-seam inventory then established that
D401's existing `explicit-career-assignment` is only a same-result representation from an immutable
source slot to one field-unit id. It is created after `_wcActiveLink` accepts the current rung and is
not a result-independent future-service assignment.

## Exact D401 insufficiency

The unchanged receipt cannot express both immutable source history and a different current-rung
assignment:

1. `_wcActiveLink` rejects before assignment when the canonical person's `unitRef.battleId` differs
   from the live battle. Its campaign chain check binds that same battle id to the current rung.
2. `_wcResultEvidence` writes the source reference as both the result battle and the participant's
   battle/unit/slot tuple. Its `assignmentId` changes only the represented field-unit id.
3. `warCareerParticipationEvidence` requires the live battle, result battle, participant tuple, and
   canonical Army Register `unitRef` to be the same source tuple.
4. `_ssCareerParticipation` interprets the receipt's battle/unit/slot fields as a canonical
   `unitRef`, requires `CHAINS[side][chainIndex]` and `creditKey` to name that source battle, and
   rejects any receipt that does not resolve back to exactly one canonical person and slot.

Adding only a journey-owned future-assignment ledger cannot pass those checks. Cross-rung service
requires the receipt contract itself to distinguish the immutable canonical source reference from
the exact alternate-timeline assignment used by the live result and campaign rung. Pretending the
target slot is the source slot, rewriting `journey.person.unitRef`, or weakening the canonical
registry comparison would violate the selected option's source-honesty law.

## Narrowest second decision

1. **Recommended: authorize a planning-only dual-reference receipt evolution.** Preserve one stable
   `personId` and immutable canonical `sourceRef`; add one exact journey-owned “Your Timeline”
   assignment reference for the current rung. The future contract must decide whether this is an
   additive backward-compatible v1 receipt or a named v2 receipt, bind the result id to both
   references, use the assignment reference for live scenario/rung/credit validation, use the source
   reference for canonical identity/provenance validation, and fail closed on every absent,
   duplicate, malformed, stale, wrong-side, wrong-slot, outside-service, foreign, or deceased case.
   This next slice remains docs/probe only; it may retain `_SAVE_VER=1` only with eager idempotent
   sanitation and no alias or second owner.
2. **Limit option 1 to source-battle representation.** Keep D401 unchanged and allow assignments only
   inside the person's source battle. This is safe but does not provide cross-rung continuity or a
   legal progression path to field/general command.
3. **Rewrite or alias the canonical source reference each rung.** Rejected. It would turn “Your
   Timeline” into false source history, break Army Register provenance, and make a mutable target
   masquerade as identity authority.

## Resolution

The second decision selected option 1. The D404 contract is
`docs/design/war-career-loop-design.md` §14:

- D401 v1 retains its exact flat shape, id calculation, and same-source-rung meaning.
- New cross-rung results use explicit `sourceRef` plus `timelineAssignmentRef` under named v2 result
  and participation schemas. Schema dispatch prevents a malformed hybrid from being interpreted as
  legacy v1.
- `C.loot.journey` remains the sole mutable career owner. One immutable exact-id mapping config is
  input, not a second registry or ledger.
- The exact proof maps `person_gettysburg_us_17me_haley` from
  `ss:gettysburg:US:us_birney_iii:pvt` at US rung 15 to
  `ss:chickamauga:US:us_harker_rock:pvt` at rung 16, both in 1863, with deterministic assignment id
  `wcta-1pav4ac`. The mapping is Inferred and labeled “Your Timeline”; it is not a historical service
  claim.
- `_SAVE_VER=1`, D401 compatibility, one credit per rung, eager idempotent sanitation, hand-off
  nontransfer, and the no-combat/no-command walls are mandatory.

The smallest next runtime prerequisite is the three-runtime-file v2 receipt proof in
`src/106-war-career.js`, `src/37-loot-survival.js`, and `tools/probe-war-career.mjs`, plus the narrow
`tools/probe-war-career-loop-plan.mjs` transition from D404 planning-lock teeth to exact
receipt-complete teeth. All nineteen plan-step names, runtime mode, and suite exclusion stay fixed.
That prerequisite must finish green before a separate Slice C take. T2, T3, Auto, data, command
projection, and later slices remain closed.

## Historical resume gate (discharged by Aaron's D404 authorization)

The D403 gate prohibited option-1 planning or Slice C until Aaron chose one of the first two paths.
Aaron chose the recommended planning-only dual-reference path. D404 discharges that decision hold,
not the runtime locks: do not edit D401 runtime merely to explore it, and do not enter Slice C before
the receipt prerequisite. T2, T3, Auto, relationships, politics, franchise/archive, combat inputs,
command-ledger aliasing, and `_SAVE_VER` movement remain excluded.
