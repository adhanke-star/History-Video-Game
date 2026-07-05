# E54 Pocket-Collapse Capture Design

## Scope

E54 closes the captured-ledger gap left after D274: D273 E53-v2 made the Shiloh and Gettysburg home-edge flips directionally green, but correct-direction geometry still left `captured` at zero. The old capture rows were artifact-direction captures; the new rule must not recreate that by letting every routed unit surrender just because it moved through the wrong edge.

This design adds a narrow victory-seam conversion, not a per-tick rewrite of E49a:

- Runs only after an asymmetric attacker HOLD win is already decided.
- Runs before `T8` phase logs or `fldOnOver` freeze captured/missing ledgers.
- Requires an explicit role-aware `homeEdge`; default-edge and sandbox runs are inert.
- Requires at least a 2:1 attacker live-strength edge across the field plus attacker local control around the seized objective.
- Converts only live defenders already in `routing` or `wavering` state.

## Rationale

E49a models an active blocked retreat lane: a router accrues `surrenderT` while steady enemies block the corridor to its home edge. That remains correct and unchanged.

D274 measured a different terminal state. With Shiloh/Gettysburg routed toward the correct home edge, the attacker can still seize the position and collapse the defending pocket, but there is no remaining blocked-lane tick to accrue the six-second E49a grace before phase/end ledgers record zero captured. This is a phase-resolution semantics gap.

The 2:1 field-collapse check is the Chancellorsville guard. A simple "attacker hold + broken defender" rule mass-captures Chancellorsville, whose hold wins are near parity. E54 fires only when the attacker has converted the position and the defending force is objectively collapsing.

## Non-goals

- No per-battle captured constants.
- No weakening of E47's captured requirement.
- No old artifact-direction capture rows.
- No change to E53-v2 A+B doctrine or the E53 sidestep valve.
- No defender-timeout or near-parity hold conversion.

## Acceptance

Focused gates:

- `node tools/probe-field.mjs` must pass the E54 fixture: capture under 2:1 attacker hold with `homeEdge`, no capture under near parity, and no capture without `homeEdge`.
- `node tools/probe-chancellorsville.mjs` must remain green.
- E47 reattempt must show Shiloh/Gettysburg captured ledgers greater than zero on the same documented mass-capture hold seeds without weakening direction gates.

Standing gates:

- `node tools/build.mjs`
- `node --check` on touched JS/probes
- relevant focused probes and JSON/pageerror readback
- `git diff --check`
