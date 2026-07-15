# DECISION NEEDED — War Career receipt continuity before Slice C

**Status:** D402 Slice C HALT, 2026-07-15. No D402 balance law was declared and no runtime,
probe, generated-game, frozen-base, data, or save-version byte moved.

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

## Resume gate

Do not restart Slice C runtime until Aaron chooses an option and the chosen identity-continuity law
is committed with a filesystem-first plan probe. The recommended next bounded task is that
planning-only contract. Relationships, politics, franchise/archive, combat inputs, command-ledger
aliasing, and `_SAVE_VER` movement remain excluded.
