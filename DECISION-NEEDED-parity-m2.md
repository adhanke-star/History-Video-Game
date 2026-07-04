# DECISION NEEDED — PARITY-M2 (E43 shared enemy conditioning): wait for E49, or switch channel?

**2026-07-04 · from the parity-arc build session (D246-D249). One question; everything else proceeded per the approved queue. Full evidence: DECISIONS.md D249.**

## What happened (30 seconds)
PARITY-M1 shipped clean (D246-D248: design law committed, E45 seam safe, attacker-AI proposal retired). PARITY-M2 — your locked "shared enemy conditioning" (enemyWill → a small capped enemy **morale/steadiness** debuff) — was built exactly to the design law and every unit-level check passed. Then the outcome A/B caught a real problem and the slice was reverted per never-push-red:

**A broken-willed enemy currently gets HARDER to beat when you attack it.** On 3 of 10 Union seeds, an assault that wins quickly against a fresh enemy LOSES on the clock against the will-eroded one. The trace shows why: the brittle defender breaks 4× as often and bleeds faster — but every routed unit rallies at its own rear and streams back onto the objective forever (the engine has no surrender / no straggler-shedding — that's exactly your approved **E49**), so the attacker's hold never consolidates and the timeout hands the field to the broken army (the **E48** buzzer class). Teaching "eroding enemy will makes your assaults fail" would be historically backwards, so nothing shipped.

## The decision
**Option A (my recommendation): wait.** Build the already-approved queue — E48 buzzer rule → E49 surrender/straggler mechanics → the Shiloh/Gettysburg flips — then rebuild PM2 from the D249 spec (≈1 hour; the code and probe teeth are fully specified) and re-run the A/B on the completed engine. Under E49 the cycling rabble dissolves, and the morale/steadiness channel you locked should hold its direction everywhere. **Cost: PM2 lands weeks later, in its correct order. Risk: low.**

**Option B: switch the channel now.** Ship enemy conditioning as a capped **strength** debuff instead (will-erosion = desertion = fewer men at muster — historically defensible for 1864-65, monotone in both engines, structurally immune to the rout-cycling backfire). **Cost: it deviates from the "morale/steadiness" wording you locked in the design session, which is why I'm not doing it unilaterally. Risk: low mechanically; it changes what the coupling *teaches* (numbers vs steadiness).**

No action needed if Option A suits — the queue already reflects it (E48 is next; Prompt A in HANDOFF.md). Say the word if you want Option B (or both: strength now, morale/steadiness re-examined after E49).
