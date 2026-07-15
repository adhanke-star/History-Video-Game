# DECISION NEEDED — War Career receipt continuity before Slice C

**Status:** D403 option-1 planning HALT, 2026-07-15. Aaron selected exact cross-rung service
assignment. The live seam inventory proved that an authored assignment cannot satisfy the unchanged
D401 result/participation receipt. The packet's receipt-change stop rule therefore fired before a
continuity contract, new plan tooth, runtime, data, generated-game, frozen-base, or save-version byte
moved. LANE-005 is CONTRACT/unowned.

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

## Resume gate

Do not resume the option-1 contract or Slice C runtime until Aaron explicitly authorizes one of the
first two second-decision paths above. The recommendation is option 1: a bounded planning-only
dual-reference receipt contract and filesystem-first negative-bound plan probe. Do not edit D401
runtime merely to explore it. T2, T3, Auto, relationships, politics, franchise/archive, combat
inputs, command-ledger aliasing, and `_SAVE_VER` movement remain excluded.
