# ⚰ RESOLVED — productionized by D64 (2026-06-15), hardened by D73/D231 — retired to legacy/ in D248

**This proposal is CLOSED (Aaron popup, design session 2026-07-03: "Retire as superseded"; retirement executed
in the parity arc's M1, D248).** D64 productionized the prototype below *with Aaron's locked answers*: the
knife-edge `ATK_ASSAULT_RATIO` binary became the gradual `effLocal` per-unit commit (T0), the fog inversion was
tuned out (mass-assault/column gated directly on `!__FIELD.fog` — fog aids the defender, per D58), it passed the
full gate, and T6 `aiSkill`, D73's `_atkCautious` doctrine, and D231's charge releases all build on it. The
"open decision" label below survived by inertia only. Any FUTURE attacker-AI ambition is a NEW proposal grounded
in today's engine (post-fortifications, post-E47) — not a revival of this one. Full resolution record:
`docs/design/battle-mode-parity-design.md` §1 (D2XX-d) + DECISIONS.md D248. Text below preserved verbatim.

---

# PROPOSAL / FINDING — Tactical "smarter ATTACKER AI" (P1b-iv) — NEEDS A BALANCE-TARGET DECISION

**Status:** prototyped + measured, **NOT committed** (main stays at the vetted P1b-iii, commit `fb2da49`). The
full prototype is in `.tmp/attacker-ai-prototype.patch` and in the chat transcript that produced this file
(*`.tmp/` is gitignored local scratch — the patch may be absent in a fresh clone; if so, the prototype would
need re-deriving from §"What I built" below — S18, D236*).
Surfacing to Aaron because the result raises a **design/balance decision** that touches a prior shipped
milestone (D58 fog), and I won't unilaterally ship a balance I'm uncertain about.

## What I built (the prototype)
A role-aware ATTACKER doctrine (`fldAiAttacker`), the complement to the P1b-iii defender doctrine, gated to
the scenario attacker (sandbox stays byte-identical). The generic AI halts at long fire range and trades
fire from the open against a defender in cover — which it loses — so it can never crack a defended hill.
The new doctrine: **concentrate on the weaker flank, close in an ASSAULT COLUMN (fast, narrow 0.7 frontage),
suppress where it lacks the weight, and charge home once the army has the global numerical weight** (melee +
numbers beat fire + cover). It dispatches alongside the defender; two test hooks (`_aiGenericAll`,
`_aiGenericAtk`) let the probe A/B each doctrine in isolation.

## Measured (Bull Run AI-vs-AI, 8 seeds, CS = defender win counts)
| config | fog OFF | fog ON |
|---|---|---|
| both generic (pre-P1b-iii) | CS 0 / US 8 | CS 1 / US 7 |
| defender-only (shipped P1b-iii) | CS 8 / US 0 | CS 8 / US 0 |
| **both doctrines (this prototype)** | **CS 7 / US 1** | **CS 2 / US 6** |

The attacker doctrine clearly **works**: it presses real assaults (attacker charge-orders 8 → 144), and it
makes the fight far bloodier (defender casualties **1263 → 6420**, ~5×). Fog OFF (the default) becomes a
genuinely good result: defender-favored + historical, but competitive and bloody, with US breakthroughs.

## The concern (why I'm not shipping it autonomously)
1. **Fog inverts.** Fog ON flips to attacker-favored (CS 2/6). Mechanism: the aggressive concealed column
   closes unseen and the defender's long-range fire-from-cover advantage evaporates, so the assault wins in
   melee. This is a *legitimate emergent dynamic* (fog is double-edged: it hides the defender's reserves —
   D58 — but also lets the attacker close unseen) — but it **contradicts the D58 milestone's shipped teaching
   that "fog aids the defender."** That tension deserves your call, not mine.
2. **Knife-edge balance.** The global-weight binary "commit the whole army to the assault" decision is a
   phase-transition: `ATK_ASSAULT_RATIO` 1.15–1.5 all give fog-OFF 7/1 & fog-ON 2/6, but 1.7 flips to fog-OFF
   4/4 & fog-ON 8/0. A robust attacker should ramp gradually (per-unit / fraction-of-force), not flip
   all-at-once.

## Recommendation
Two questions for you, then I'll finish it robustly:
1. **Balance target for AI-vs-AI Bull Run** — keep it strongly defender-favored (historical: the South won),
   roughly balanced, or attacker-favored? (Affects the auto-resolve/demo path and a future CS-player mode;
   the primary human-Union mode is unaffected either way — the human *is* the attacker there.)
2. **Fog's intended cut** — should fog aid the defender (per D58), be genuinely double-edged (as the data
   shows), or is the inversion a bug to tune out?

With those answers I'll (a) replace the binary commit with a gradual/robust model (no knife-edge), (b) tune
to the target, (c) reconcile or document the fog interaction, and (d) run the full probe + adversarial
bug-hunt + no-regression gate before committing — the same discipline as P1b-iii.

## To apply the prototype for review
`cd ~/Desktop/Video\ Game && git apply .tmp/attacker-ai-prototype.patch && node tools/build.mjs` then open
`civil_war_generals.html` (or re-run the sweep with `.tmp/attacker-ai-measure.mjs`). To discard: `git checkout
src/tactical/T0-field-sandbox.js`.
