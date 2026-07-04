# DECISION NEEDED — E49: the locked shed form fails the locked gate (D256, 2026-07-04)

**The one-line version:** E49 was built exactly to your D255 law and every unit tooth passed — but on the
law's own acceptance battery the SHIPPING config went red by one seed: **Chancellorsville CS 8/8 → 7/8 on
the probe set** (seed 42: the CS assault sheds 4,378 stragglers and can't clear the crossroads; the US
physically holds it 4,979-strong at the buzzer). The isolated legs pin it: **surrender-only passes EVERY
gate; the flip is pure straggler-shedding.** Per your law (§3: red → revert-file-halt) everything is
reverted and preserved; the deliverable is byte-identical to the last shipped build. Nothing red was pushed.

**Why this is a fork and not a fix:** SL-7 (your D74 extension) forbids tuning f or any term to make a
battle's gate pass. And the deeper finding is that SL-1's documented rationale — "a normal battle's 1–2
breaks/unit → ~5–10% straggling" — fails measurement: the engine routs units 3–8× in NORMAL battles, so
f=0.05-per-event sheds **15–30% of a side** in ordinary fights (Chancellorsville US ~6,000/seed, Malvern
Hill CS ~8,500/seed, Bull Run US ~8,700/seed vs the documented ~1,200-class). Killed/wounded stays flat —
the entire inflation lands in the new "missing" column — so the after-action total-loss columns would read
2–3.3× the documented bands (MH CS ~18,900 vs ~5,650 documented), and the MH attacker ratio moved 3.59 →
4.04, AWAY from the historical band. The premise broke, not just the seed.

## Your options

**(a) RECOMMENDED — split E49.**
Re-land **surrender-only as E49a now** (~30 min from the preserved diff + the full battery re-run): its
isolated leg passed every gate — byte-identical at 7/9 battles + sandbox, Chancellorsville CS 8/8 both
sets, MH US 8/8, and at Shiloh it already previews the Hornets' Nest mass capture (capUS 6,349). It is the
REMOVAL mechanism the D249/D251 inversion fix and the Shiloh/Gettysburg flips actually need. Then run a
**bounded E49b design session for shedding** armed with the run-1 measurements — candidate calibrate-free
forms that cap compounding: shed only on a unit's FIRST break (retention floor 1−f; the literature's
straggler pool scatters when the line first breaks, not 5% on every re-break), or a once-per-battle
`round(maxMen×f)`. Reason: ships only what measured green, unblocks the flip queue fastest, and redesigns
the red half with data instead of in the dark.
*Risk to name honestly: the Shiloh flip may still want an attrition partner — its own A/B (the next
milestone's gate) will say; the design session happens either way.*

**(b) Relax the Chancellorsville gate to CS ≥6/8 both sets and land BOTH as built.**
Seed 42 is honest physics (a real contested hold, not a rule glitch), and 10/11 seeds still go CS. But it
weakens a documented-direction gate that D241/D254 earned at 8/8, and it leaves the 2–3.3× total-loss
inflation on every after-action teaching surface. **Not recommended.**

**(c) Full halt — redesign shedding first, land E49 whole afterward.**
Cleanest single landing; slowest. The Shiloh/Gettysburg flips, Piper guns, and PM2 all stay blocked
behind two more sessions instead of one.

## What's preserved (nothing lost)
`.tmp/e49-T25-surrender.js` (the full module) · `.tmp/e49-tracked.diff` (T0/T8/manifest/probe-field —
includes the 5 new probe fixtures, all of which passed) · `.tmp/e49-reland-spec.md` (the ~15-min re-land
recipe + the redesign-relevant measurements) · `.tmp/ab-e49.mjs` + `.tmp/ab-e49-run1.json` (the 4-leg
battery with gates + watch metrics built in; ~6-min re-run). Full evidence: **DECISIONS D256**.

**Recommendation: (a).** Reply here or in chat; the next session executes whichever you pick.
